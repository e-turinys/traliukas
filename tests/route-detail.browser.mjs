// Production P03 browser checks without an additional package dependency.
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { mkdir, mkdtemp, writeFile } from "node:fs/promises"
import path from "node:path"
import { tmpdir } from "node:os"

const base = process.env.P03_BASE_URL ?? "http://localhost:3000"
const profile = await mkdtemp(path.join(tmpdir(), "p03-chrome-"))
const artifacts = path.resolve(".next/p03-review")
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
  const active = 'vakaru-kryptis-0918'
  for (const width of [390, 768, 1280, 1440]) {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false })
    for (const id of [active, 'baltijos-kelias-0920-full', 'manto-transportas-0917', 'baltijos-kelias-0915', 'unknown']) {
      await visit(`routes/${id}`)
      await evaluate('document.fonts.ready.then(() => true)')
      await overflow(`${id} ${width}`)
      const clipped = await evaluate(`Array.from(document.querySelectorAll('main a, main h1, main h2, main h3, main p')).filter(el => el.clientWidth && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)).map(el => el.textContent)`)
      if (clipped.length) { console.log(await evaluate(`Array.from(document.querySelectorAll("main h1")).map(el => ({text:el.textContent, width:el.clientWidth, scrollWidth:el.scrollWidth, height:el.clientHeight, scrollHeight:el.scrollHeight, lineHeight:getComputedStyle(el).lineHeight}))`)); await screenshot(`clipping-${width}`) }; assert.deepEqual(clipped, [])
      const hrefs = await evaluate(`Array.from(document.querySelectorAll('main a[href^="/request/new"]')).map(el => el.getAttribute('href'))`)
      const text = await evaluate('document.querySelector("main").innerText')
      if (id === 'unknown') {
        assert.ok(text.includes('Maršrutas nerastas'))
        assert.deepEqual(hrefs, [])
      } else {
        assert.equal(await evaluate(`getComputedStyle(document.querySelector('aside')).position`), width >= 1024 ? 'sticky' : 'static')
        assert.equal(await evaluate(`document.querySelectorAll('main [style*="position: absolute"]').length`), 0)
        assert.ok(!text.includes('Lankstus maršrutas'))
        assert.ok(!text.includes('Tinka jūsų kelionei'))
        if (id.includes('full')) {
          assert.ok(text.includes('Maršrutas pilnas'))
          assert.deepEqual(hrefs, [])
        } else {
          assert.equal(hrefs.length, 1)
          const params = new URL(hrefs[0], base).searchParams
          assert.equal(params.get('visibility'), id === 'baltijos-kelias-0915' ? 'marketplace' : 'targeted')
          assert.equal(params.get('targetRoute'), id === 'baltijos-kelias-0915' ? null : id)
          if (id === active) {
            assert.ok(text.includes('4 laisvos vietos'))
            assert.ok(text.includes('Tik važiuojantys automobiliai'))
            assert.equal(params.get('from'), 'rotterdam-nl')
            assert.equal(params.get('to'), 'vilnius-lt')
            assert.equal(params.get('dateFrom'), '2026-09-18')
            assert.equal(params.get('dateTo'), '2026-09-21')
            assert.deepEqual(await evaluate(`Array.from(document.querySelectorAll('ol li p:first-child')).map(el => el.textContent)`), ['Rotterdam', 'Hamburg', 'Kaunas', 'Vilnius'])
          }
          if (id === 'manto-transportas-0917') {
            assert.ok(text.includes('1 laisva vieta'))
            assert.ok(text.includes('Motociklas'))
            assert.ok(text.includes('Naujas vežėjas'))
            assert.ok(!text.includes('Patvirtintas vežėjas'))
          }
        }
      }
      await screenshot(`${id}-${width}`)
    }
    console.log(`PASS ${width}px: active/full/expired/new/unknown routes, capacity, timeline, action flow, no overflow/clipping`)
  }
  assert.equal((await fetch(`${base}/routes/unknown`)).status, 404)
  await visit(`routes/${active}`)
  await evaluate(`document.querySelector('main a[href^="/request/new"]').focus()`)
  assert.equal(await evaluate(`document.activeElement.getAttribute('href').startsWith('/request/new')`), true)
  await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter' })
  await until("location.pathname === '/request/new'")
  assert.equal(await evaluate("new URLSearchParams(location.search).get('targetRoute')"), active)
  await visit(`routes/${active}`)
  await evaluate(`document.querySelector('main a[href^="/carriers/"]').click()`)
  await until("location.pathname === '/carriers/vakaru-kryptis'")
  await visit(`routes/${active}`)
  await evaluate(`document.querySelector('main a[href^="/search"]').click()`)
  await until("location.pathname === '/search'")
  assert.equal(await evaluate("new URLSearchParams(location.search).get('from')"), 'rotterdam-nl')
  assert.deepEqual(exceptions, [])
  console.log('PASS keyboard request handoff without login, carrier/back navigation, HTTP 404, no runtime exceptions')
} finally {
  await send('Browser.close').catch(() => {})
  socket.close()
  chrome.kill()
}
