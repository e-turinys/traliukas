// Production P04 browser checks without an additional package dependency.
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { mkdir, mkdtemp, writeFile } from "node:fs/promises"
import path from "node:path"
import { tmpdir } from "node:os"

const base = process.env.P04_BASE_URL ?? "http://localhost:3000"
const profile = await mkdtemp(path.join(tmpdir(), "p04-chrome-"))
const artifacts = path.resolve(".next/p04-review")
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

// Fixed September review fixtures naturally expire; eligibility uses the real Vilnius date.
try {
  for (const width of [390, 768, 1280, 1440]) {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false })
    for (const id of ['vakaru-kryptis', 'manto-transportas', 'aukstaitijos-transportas', 'baltijos-kelias', 'pajurio-pervezimai', 'unknown']) {
      await visit(`carriers/${id}`)
      await evaluate('document.fonts.ready.then(() => true)')
      await overflow(`${id} ${width}`)
      const clipped = await evaluate(`Array.from(document.querySelectorAll('main a, main h1, main h2, main h3, main p')).filter(el => el.clientWidth && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)).map(el => el.textContent)`)
      assert.deepEqual(clipped, [])
      const text = await evaluate('document.querySelector("main").innerText')
      assert.equal(await evaluate(`document.querySelectorAll('main a[href^="tel:"], main a[href^="mailto:"], main a[href^="/messages"], main a[href^="/bookings"]').length`), 0)
      assert.ok(!/CMR|Live tracking|Sąskaita faktūra|Rašyti vežėjui/.test(text))
      if (id === 'unknown') {
        assert.ok(text.includes('Vežėjas nerastas'))
      } else {
        assert.equal(await evaluate(`getComputedStyle(document.querySelector('aside')).position`), 'static')
        const routes = await evaluate(`Array.from(document.querySelectorAll('#active-routes a[href^="/routes/"]')).map(el => el.getAttribute('href'))`)
        if (id === 'aukstaitijos-transportas' || id === 'baltijos-kelias') {
          assert.deepEqual(routes, [])
          assert.ok(text.includes('Šiuo metu aktyvių maršrutų nėra.'))
          assert.equal(await evaluate(`document.querySelector('main header a').getAttribute('href')`), '/request/new')
          assert.equal(await evaluate(`document.querySelector('#capabilities-heading') === null`), true)
        } else {
          assert.equal(routes.length, 1)
          assert.equal(await evaluate(`document.querySelector('main header a').getAttribute('href')`), '#active-routes')
          assert.ok(text.includes('Pagal aktyvius maršrutus.'))
          const carrierName = await evaluate(`document.querySelector('h1').textContent`)
          assert.ok(!(await evaluate(`document.querySelector('#active-routes article').innerText`)).includes(carrierName))
        }
        if (id === 'vakaru-kryptis') {
          assert.ok(text.includes('Patvirtintas vežėjas'))
          assert.ok(text.includes('4,6 · 17 atsiliepimų'))
          assert.ok(text.includes('25 užbaigti pervežimai'))
          assert.ok(text.includes('4 laisvos vietos'))
          assert.equal(await evaluate(`document.querySelectorAll('blockquote').length`), 2)
          assert.deepEqual(routes, ['/routes/vakaru-kryptis-0918'])
        }
        if (id === 'manto-transportas' || id === 'aukstaitijos-transportas') {
          assert.ok(text.includes('Naujas vežėjas'))
          assert.ok(text.includes('Vežėjas dar nepatvirtintas'))
          assert.ok(text.includes('Šis vežėjas dar neturi klientų atsiliepimų.'))
          assert.ok(!text.includes('Patvirtintas vežėjas'))
          assert.equal(await evaluate(`document.querySelectorAll('blockquote').length`), 0)
        }
      }
      await screenshot(`${id}-${width}`)
    }
    console.log(`PASS ${width}px: verified/new/route-free/expired/unverified/unknown profiles, trust, capacity, privacy, no overflow/clipping`)
  }
  assert.equal((await fetch(`${base}/carriers/unknown`)).status, 404)
  await visit('carriers/vakaru-kryptis')
  await evaluate(`document.querySelector('main header a').focus()`)
  await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter' })
  await until("location.hash === '#active-routes'")
  await evaluate(`document.querySelector('#active-routes a[href^="/routes/"]').click()`)
  await until("location.pathname === '/routes/vakaru-kryptis-0918'")
  await visit('carriers/aukstaitijos-transportas')
  await evaluate(`document.querySelector('main header a').click()`)
  await until("location.pathname === '/request/new'")
  await visit('carriers/vakaru-kryptis')
  await evaluate(`document.querySelector('main a[href="/search"]').click()`)
  await until("location.pathname === '/search'")
  assert.deepEqual(exceptions, [])
  console.log('PASS keyboard routes anchor, route/request/back navigation, account-free access, HTTP 404, no runtime exceptions')
} finally {
  await send('Browser.close').catch(() => {})
  socket.close()
  chrome.kill()
}
