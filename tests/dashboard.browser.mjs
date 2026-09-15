// Production P09 browser checks without an additional package dependency.
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { mkdir, mkdtemp, writeFile } from "node:fs/promises"
import path from "node:path"
import { tmpdir } from "node:os"

const base = process.env.P09_BASE_URL ?? "http://localhost:3000"
const profile = await mkdtemp(path.join(tmpdir(), "p09-chrome-"))
const artifacts = path.resolve(".next/p09-review")
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
const text = value => `document.body.innerText.includes(${JSON.stringify(value)})`
const visit = async query => {
  await cdp("Page.navigate", { url: `${base}/dashboard${query}` })
  await until("document.readyState === 'complete' && !!document.querySelector('h1') && !document.querySelector('[aria-label=\"Įkeliamas kliento skydelis\"]')")
  await pause(150)
}
const clickTab = async label => {
  await evaluate(`(() => { const tab = [...document.querySelectorAll('[role="tab"]')].find(item => item.textContent.trim() === ${JSON.stringify(label)}); if (!tab) throw new Error('Missing tab'); tab.click() })()`)
  await pause(100)
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
  for (const width of [390, 768, 1280, 1536]) {
    await cdp("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false })

    await visit("")
    await overflow(`mixed ${width}`)
    for (const copy of ["Reikia dėmesio", "Atnaujintas pasiūlymas", "Naujas pasiūlymas", "Ieškoma vežėjo"]) assert.ok(await evaluate(text(copy)))
    for (const copy of ["2 paėmimo vietos → Kaunas", "Berlin → Vilnius", "Warsaw → Kaunas", "BMW X5", "Audi Q5", "Volkswagen Passat"]) assert.ok(await evaluate(text(copy)))
    assert.ok(await evaluate(text("2 automobiliai · BMW X5, Audi Q5")))
    assert.equal(await evaluate("[...document.querySelectorAll('[data-slot=\"card-title\"]')].filter(item => item.textContent.trim() === '2 paėmimo vietos → Kaunas').length"), 2)
    assert.equal(await evaluate("[...document.querySelectorAll('section[aria-labelledby=\"attention-heading\"] [data-slot=\"card\"]')].map(card => card.innerText.includes('Atnaujintas pasiūlymas'))[0]"), true)
    assert.equal(await evaluate("document.querySelector('a[href=\"/requests/updated-offer-demo-001\"]')?.textContent.trim()"), "Peržiūrėti pasiūlymus")
    await clickTab("Pervežimai")
    assert.ok(await evaluate(text("Pasirinktas vežėjas")))
    assert.ok(await evaluate(text("Šiaurės autovežis")))
    assert.equal(await evaluate("document.querySelector('a[href=\"/bookings/transport-demo-001\"]')?.textContent.trim()"), "Atidaryti pervežimą")
    assert.equal(await evaluate(text("Baltijos kelias")), false)
    await clickTab("Istorija")
    assert.ok(await evaluate(text("Pervežimas užbaigtas")))
    assert.ok(await evaluate(text("Užklausa uždaryta")))
    assert.equal(await evaluate("[...document.querySelectorAll('button,a')].some(item => ['Priimti pasiūlymą','Atmesti pasiūlymą','Redaguoti užklausą','Uždaryti užklausą','Pakartoti užklausą'].includes(item.textContent.trim()))"), false)

    await visit("?view=requests")
    await overflow(`requests ${width}`)
    assert.ok(await evaluate(text("Pasiūlymų dar nėra")))
    assert.ok(await evaluate(text("Tik Baltijos kelias")))

    await visit("?view=transport")
    await overflow(`transport ${width}`)
    assert.ok(await evaluate(text("Vežėjas pasirinktas")))
    assert.equal(await evaluate(text("Reikia dėmesio")), false)

    await visit("?view=history")
    await overflow(`history ${width}`)
    assert.ok(await evaluate(text("Pervežimas užbaigtas")))
    assert.ok(await evaluate(text("Užklausa uždaryta")))
    assert.equal(await evaluate(text("Vežėjas pasirinktas")), false)

    await visit("?view=empty")
    await overflow(`empty ${width}`)
    assert.ok(await evaluate(text("Čia dar nieko nėra")))
    assert.ok(await evaluate(text("Sukurkite pirmą pervežimo užklausą ir gaukite vežėjų pasiūlymus.")))
    assert.equal(await evaluate("document.querySelector('a[href=\"/request/new\"]')?.textContent.trim()"), "Sukurti naują užklausą")
    assert.equal(await evaluate("document.querySelectorAll('[role=tab]').length"), 0)

    await visit("")
    const undersized = await evaluate("[...document.querySelectorAll('[role=tab], main a')].filter(item => { const box = item.getBoundingClientRect(); return box.width > 0 && box.height < 43 }).map(item => [item.textContent.trim(), item.getBoundingClientRect().height])")
    assert.deepEqual(undersized, [])
    if (width === 390 || width === 1280) await screenshot(`mixed-${width}`)
    console.log(`PASS ${width}px: five fixtures, tab navigation, destinations and touch targets; no overflow`)
  }
  assert.deepEqual(exceptions, [])
  console.log(`PASS no runtime exceptions. Screenshots: ${artifacts}`)
} finally {
  await send("Browser.close").catch(() => {})
  socket.close()
  chrome.kill()
}
