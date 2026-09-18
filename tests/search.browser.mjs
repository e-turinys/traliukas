// Production P02 browser checks without an additional package dependency.
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { mkdir, mkdtemp, writeFile } from "node:fs/promises"
import path from "node:path"
import { tmpdir } from "node:os"

const base = process.env.P02_BASE_URL ?? "http://localhost:3000"
const profile = await mkdtemp(path.join(tmpdir(), "p02-chrome-"))
const artifacts = path.resolve(".next/p02-review")
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
  await cdp("Page.navigate", { url: `${base}/search${query}` })
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

const click = async label => {
  await evaluate(`(() => { const el = [...document.querySelectorAll('button')].find(el => el.textContent.trim() === ${JSON.stringify(label)} && el.getBoundingClientRect().width); if (!el) throw new Error('Missing button: ' + ${JSON.stringify(label)}); el.click() })()`)
  await pause(100)
}
const checkLayout = async label => {
  await overflow(label)
  const clipped = await evaluate(`Array.from(document.querySelectorAll('main button, main a, main h1, main h2, main h3')).filter(el => el.clientWidth && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)).map(el => el.textContent)`)
  assert.deepEqual(clipped, [], label)
  assert.equal(await evaluate("getComputedStyle(document.querySelector('h1')).fontFamily.includes('Geist')"), true)
  assert.equal(await evaluate("document.querySelectorAll('h1').length"), 1)
}
const query = '?from=hamburg-de&to=kaunas-lt'
try {
  for (const width of [390, 768, 1280, 1440]) {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false })
    await visit(query)
    await evaluate('document.fonts.ready.then(() => true)')
    await checkLayout(`results ${width}`)
    assert.ok(await evaluate("document.querySelectorAll('article').length > 0"), 'Fixed September fixtures must still be active for this review')
    assert.equal(await evaluate("document.body.innerText.includes('1 automobilis')"), true)
    assert.equal(await evaluate("document.querySelector('a[href*=full]') !== null"), false)
    assert.ok(await evaluate("document.body.innerText.includes('Tinka jūsų kelionei')"))
    assert.ok(await evaluate("document.body.innerText.includes('Galimi alternatyvūs maršrutai')"))
    await screenshot(`results-${width}`)
    await click('Keisti')
    await checkLayout(`editor ${width}`)
    await screenshot(`editor-${width}`)
    await click('Rasti vežėją')
    assert.equal(await evaluate("new URLSearchParams(location.search).get('from')"), 'hamburg-de')
    await click('Filtrai')
    await checkLayout(`filters ${width}`)
    await screenshot(`filters-${width}`)
    await evaluate("document.querySelector('input[type=checkbox]').click()")
    await click('Taikyti filtrus')
    await until("new URLSearchParams(location.search).get('verified') === 'true'")
    await evaluate('history.back()')
    await until("!new URLSearchParams(location.search).has('verified')")
    if (width < 1024) {
      await click('Žemėlapis')
      assert.equal(await evaluate("getComputedStyle(document.querySelector('#search-route-list')).display"), 'none')
      await checkLayout(`map ${width}`)
      await click('Sąrašas')
    }
    await visit(query + '&vehicleCount=10&dateType=single&date=2026-10-15')
    await checkLayout(`empty ${width}`)
    assert.ok(await evaluate("document.body.innerText.includes('10 automobilių')"))
    assert.ok(await evaluate("document.body.innerText.includes('Neradome tinkamo maršruto')"))
    assert.equal(await evaluate("document.querySelector('main a[href^=\"/request/new\"]').getAttribute('href')"), '/request/new?from=hamburg-de&to=kaunas-lt&dateType=single&date=2026-10-15')
    await screenshot(`empty-${width}`)
    await visit('?from=berlin-de&to=kaunas-lt&vehicleCount=2')
    await checkLayout(`segment ${width}`)
    assert.ok(await evaluate("document.body.innerText.includes('2 automobiliai')"))
    assert.ok(await evaluate("document.body.innerText.includes('Berlin → Kaunas')"))
    await visit('?from=unknown&to=kaunas-lt')
    await checkLayout(`invalid ${width}`)
    assert.equal(await evaluate("document.querySelectorAll('article').length"), 0)
    assert.ok(await evaluate("document.querySelector('#search-editor') !== null"))
    console.log(`PASS ${width}px: results, segments, counts, filters/history, editor, empty/invalid states and layout`)
  }
  await visit(query)
  await evaluate("document.querySelector('[data-slot=select-trigger]').click()")
  await until("document.querySelector('[role=option]') !== null")
  await evaluate("[...document.querySelectorAll('[role=option]')].find(el => el.textContent.includes('Geriausiai įvertinti')).click()")
  await until("new URLSearchParams(location.search).get('sort') === 'rating'")
  const href = await evaluate("document.querySelector('article a').getAttribute('href')")
  await evaluate("document.querySelector('article a').click()")
  await until(`location.pathname === ${JSON.stringify(href)}`)
  assert.deepEqual(exceptions, [])
  console.log('PASS sort URL, route navigation, no runtime exceptions')
} finally {
  await send('Browser.close').catch(() => {})
  socket.close()
  chrome.kill()
}