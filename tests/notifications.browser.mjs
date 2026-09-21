// Production N01 browser checks without an additional package dependency.
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { mkdir, mkdtemp, writeFile } from "node:fs/promises"
import path from "node:path"
import { tmpdir } from "node:os"

const base = process.env.N01_BASE_URL ?? "http://localhost:3000"
const profile = await mkdtemp(path.join(tmpdir(), "n01-chrome-"))
const artifacts = path.resolve(".next/n01-review")
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
await cdp("Page.bringToFront")
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
const text = value => `document.body.innerText.includes(${JSON.stringify(value)})`
const visit = async pathname => {
  await cdp("Page.navigate", { url: `${base}${pathname}` })
  await until("document.readyState === 'complete' && !!document.querySelector('h1')")
  await pause(120)
}
const click = async label => {
  await evaluate(`(() => { const element = [...document.querySelectorAll('button')].find(item => item.textContent.trim() === ${JSON.stringify(label)}); if (!element) throw new Error('Missing button'); element.click() })()`)
  await pause(120)
}
const screenshot = async name => {
  const { data } = await cdp("Page.captureScreenshot", { captureBeyondViewport: true })
  await writeFile(path.join(artifacts, `${name}.png`), Buffer.from(data, "base64"))
}

try {
  for (const width of [390, 768, 1280, 1440]) {
    await cdp("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false })
    await visit("/notifications")
    const size = await evaluate("({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth })")
    assert.ok(size.scroll <= size.width, `${width}px overflow: ${JSON.stringify(size)}`)
    assert.equal(await evaluate("document.querySelectorAll('[data-notification-id]').length"), 9)
    assert.equal(await evaluate("document.querySelectorAll('[data-notification-read=false]').length"), 3)
    for (const copy of ["Pranešimai", "Naujas pasiūlymas", "Nauja žinutė", "Automobilis pristatytas", "2 paėmimo vietos → Kaunas", "2 automobiliai", "Baltijos kelias", "900 €"]) assert.ok(await evaluate(text(copy)), `${width}px missing ${copy}`)
    assert.equal(await evaluate("document.querySelector('[data-notification-id=notification-offer-created-001] a')?.getAttribute('href')"), "/offers/marketplace-demo-001-offer-1")
    assert.equal(await evaluate("document.querySelector('[data-notification-id=notification-message-created-001] a')?.getAttribute('href')"), "/messages/active-prebooking-demo-001")
    assert.equal(await evaluate("document.querySelector('[data-notification-id=notification-delivered-001] a')?.getAttribute('href')"), "/bookings/transport-delivered-demo-001")
    const shortTargets = await evaluate("[...document.querySelectorAll('main a, main button')].filter(item => { const rect = item.getBoundingClientRect(); return rect.width > 0 && rect.height < 43 }).map(item => [item.textContent.trim(), item.getBoundingClientRect().height])")
    assert.deepEqual(shortTargets, [])
    assert.equal(await evaluate("[...document.querySelectorAll('[data-notification-read=false]')].every(row => row.innerText.includes('Neperskaitytas'))"), true)
    assert.equal(await evaluate("[...document.querySelectorAll('[data-notification-read=true]')].every(row => row.innerText.includes('Perskaitytas'))"), true)
    await screenshot(`notifications-${width}`)

    // Stress wrapping with repeated existing fixture text; no product fixture data is changed.
    await evaluate(`(() => {
      const row = document.querySelector('[data-notification-id]')
      const title = row.querySelector('h2'), body = row.querySelector('p')
      title.textContent = Array(6).fill(title.textContent).join(' ')
      body.textContent = Array(8).fill(body.textContent).join(' ')
    })()`)
    assert.equal(await evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth"), true)
    assert.equal(await evaluate("[...document.querySelectorAll('[data-notification-id] h2, [data-notification-id] p, [data-notification-id] time')].every(item => item.scrollWidth <= item.clientWidth + 1 && item.scrollHeight <= item.clientHeight + 1)"), true)
    await screenshot(`long-text-${width}`)
    await visit("/notifications")

    await evaluate("[...document.querySelectorAll('button')].find(item => item.textContent.trim() === 'Neperskaityti').focus()")
    await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: "\r" })
    await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 })
    await until("document.querySelectorAll('[data-notification-id]').length === 3")
    assert.equal(await evaluate("document.activeElement.getAttribute('aria-pressed')"), "true")
    assert.equal(await evaluate("document.querySelectorAll('[data-notification-id]').length"), 3)
    await click("Pažymėti visus kaip perskaitytus")
    assert.ok(await evaluate(text("Visus pranešimus perskaitėte")))
    assert.equal(await evaluate("document.querySelectorAll('[data-notification-id]').length"), 0)
    await click("Visi")
    assert.equal(await evaluate("document.querySelectorAll('[data-notification-read=true]').length"), 9)
    assert.equal(await evaluate("[...document.querySelectorAll('button')].find(item => item.textContent.includes('Pažymėti visus')).disabled"), true)
    await screenshot(`all-read-${width}`)

    await visit("/notifications?view=empty")
    assert.ok(await evaluate(text("Pranešimų nėra")))
    assert.equal(await evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth"), true)
    await screenshot(`empty-${width}`)
    await visit("/notifications?filter=unread")
    assert.equal(await evaluate("document.querySelectorAll('[data-notification-id]').length"), 3)
    await visit("/notifications?view=all-read&filter=unread")
    assert.ok(await evaluate(text("Visus pranešimus perskaitėte")))
    console.log(`PASS ${width}px: list, unread filter, mark-all state, destinations and touch targets; no overflow`)
  }

  await visit("/notifications?view=empty")
  assert.ok(await evaluate(text("Pranešimų nėra")))
  await visit("/notifications?view=all-read&filter=unread")
  assert.ok(await evaluate(text("Visus pranešimus perskaitėte")))
  await visit("/notifications")
  await evaluate("document.querySelector('[data-notification-id=notification-message-created-001] a').click()")
  await until("location.pathname === '/messages/active-prebooking-demo-001'")
  assert.equal(await evaluate("location.pathname"), "/messages/active-prebooking-demo-001")
  for (const [id, href] of [
    ['notification-offer-created-001', '/offers/marketplace-demo-001-offer-1'],
    ['notification-booking-created-001', '/bookings/transport-demo-001'],
  ]) {
    await visit('/notifications')
    await evaluate(`document.querySelector('[data-notification-id="${id}"] a').click()`)
    await until(`location.pathname === ${JSON.stringify(href)}`)
  }
  assert.deepEqual(exceptions, [])
  console.log(`PASS empty/all-read fixtures, stored-href click navigation and no runtime exceptions. Screenshots: ${artifacts}`)
} finally {
  await send("Browser.close").catch(() => {})
  socket.close()
  chrome.kill()
}
