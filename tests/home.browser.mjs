// Production P01 browser checks without an additional package dependency.
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { mkdir, mkdtemp, writeFile } from "node:fs/promises"
import path from "node:path"
import { tmpdir } from "node:os"

const base = process.env.P01_BASE_URL ?? "http://localhost:3000"
const profile = await mkdtemp(path.join(tmpdir(), "p01-chrome-"))
const artifacts = path.resolve(".next/p01-review")
await mkdir(artifacts, { recursive: true })
const chrome = spawn(process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe", [
  "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
  "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank",
], { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] })
const endpoint = await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error("Chrome startup timeout")), 15000)
  chrome.on("error", reject)
  chrome.stderr.on("data", chunk => {
    const match = String(chunk).match(/DevTools listening on (ws:\/\/\S+)/)
    if (match) { clearTimeout(timeout); resolve(match[1]) }
  })
})
const socket = new WebSocket(endpoint)
await new Promise(resolve => socket.addEventListener("open", resolve, { once: true }))
let sequence = 0
const pending = new Map(), exceptions = []
socket.addEventListener("message", event => {
  const message = JSON.parse(event.data)
  if (message.id) {
    const handler = pending.get(message.id); pending.delete(message.id)
    if (message.error) handler.reject(message.error); else handler.resolve(message.result)
  }
  if (message.method === "Runtime.exceptionThrown") exceptions.push(message.params.exceptionDetails)
})
const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
  const id = ++sequence; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params, sessionId }))
})
const { targetId } = await send("Target.createTarget", { url: "about:blank" })
const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true })
const cdp = (method, params) => send(method, params, sessionId)
await cdp("Page.enable")
await cdp("Runtime.enable")
const evaluate = async expression => {
  const result = await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails))
  return result.result.value
}
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
const until = async expression => {
  for (let index = 0; index < 100; index++) { if (await evaluate(expression)) return; await pause(100) }
  throw new Error(`Timed out: ${expression}`)
}
const visit = async query => {
  await cdp("Page.navigate", { url: `${base}/${query}` })
  await until("document.readyState === 'complete' && !!document.querySelector('h1')")
  await pause(150)
}
const overflow = async label => {
  const size = await evaluate("({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth })")
  assert.ok(size.scroll <= size.width, `${label}: ${JSON.stringify(size)}`)
}
const screenshot = async name => {
  const { data } = await cdp("Page.captureScreenshot", { captureBeyondViewport: true })
  await writeFile(path.join(artifacts, `${name}.png`), Buffer.from(data, "base64"))
}

try {
  for (const width of [390, 768, 1280, 1440]) {
    await cdp("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false })
    await visit("")
    await evaluate("document.fonts.ready.then(() => true)")
    assert.equal(await evaluate("getComputedStyle(document.querySelector('h1')).fontFamily.includes('Geist')"), true, "Geist/CSS must load")
    await overflow(`Home ${width}`)
    assert.equal(await evaluate("document.querySelectorAll('main article').length"), 3)
    const clipped = await evaluate(`Array.from(document.querySelectorAll('main button, main a, main h1, main h2, main h3')).filter(el => el.clientWidth && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)).map(el => el.textContent)`)
    assert.deepEqual(clipped, [])
    assert.equal(await evaluate("document.querySelector('button[type=submit]').disabled"), true)
    if (width >= 1280) {
      const tops = await evaluate("[document.querySelector('[data-slot=input-group]'), document.querySelector('form button[aria-haspopup=dialog]'), document.querySelector('button[type=submit]')].map(el => el.getBoundingClientRect().top)")
      assert.ok(Math.max(...tops) - Math.min(...tops) < 2, `Aligned search controls: ${tops}`)
    }
    await screenshot(`home-${width}`)
    console.log(`PASS ${width}px: no overflow/clipping, three cards, disabled empty search`)
  }
  await evaluate("[...document.querySelectorAll('button')].find(el => el.textContent.includes('Gauti vežėjų pasiūlymus')).click()")
  await until("document.querySelectorAll('[role=alert]').length === 2")
  assert.equal(await evaluate("document.activeElement.getAttribute('role')"), "combobox")
  const choose = async (index, city) => {
    await evaluate(`document.querySelectorAll('input[role=combobox]')[${index}].focus()`)
    await cdp("Input.insertText", { text: city })
    await until("document.querySelector('[role=option]') !== null")
    await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowDown", code: "ArrowDown" })
    await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter" })
    await pause(150)
  }
  await choose(0, "Hamburg")
  await choose(1, "Kaunas")
  assert.equal(await evaluate("document.querySelector('button[type=submit]').disabled"), false)
  await evaluate("document.querySelector('button[type=submit]').click()")
  await until("location.pathname === '/search'")
  assert.equal(await evaluate("new URLSearchParams(location.search).get('from')"), "hamburg-de")
  assert.equal(await evaluate("new URLSearchParams(location.search).get('to')"), "kaunas-lt")
  console.log("PASS validation/focus, keyboard location selection and search URL handoff")
  await visit("")
  await choose(0, "Hamburg")
  await choose(1, "Kaunas")
  await evaluate("[...document.querySelectorAll('button')].find(el => el.textContent.includes('Gauti vežėjų pasiūlymus')).click()")
  await until("location.pathname === '/request/new'")
  assert.equal(await evaluate("new URLSearchParams(location.search).get('from')"), "hamburg-de")
  assert.equal(await evaluate("new URLSearchParams(location.search).get('to')"), "kaunas-lt")
  await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 900, deviceScaleFactor: 1, mobile: false })
  await visit("")
  await evaluate("document.querySelector('button[aria-label=\"Atidaryti navigaciją\"]').click()")
  await until("document.querySelector('[role=dialog]') !== null")
  await overflow("Mobile menu")
  await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape" })
  console.log("PASS secondary offer URL handoff and mobile menu")
  assert.deepEqual(exceptions, [])
} finally {
  await send("Browser.close").catch(() => {})
  socket.close()
  chrome.kill()
}
