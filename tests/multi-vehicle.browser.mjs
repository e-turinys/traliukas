// Production multi-vehicle browser checks without an additional package dependency.
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { mkdir, mkdtemp, writeFile } from "node:fs/promises"
import path from "node:path"
import { tmpdir } from "node:os"

const base = process.env.MULTI_VEHICLE_BASE_URL ?? "http://localhost:3000"
const profile = await mkdtemp(path.join(tmpdir(), "multi-vehicle-chrome-"))
const artifacts = path.resolve(".next/multi-vehicle-review")
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
const visit = async pathname => {
  await cdp("Page.navigate", { url: `${base}${pathname}` })
  await until("document.readyState === 'complete' && !!document.querySelector('h1')")
  await pause(200)
}
const click = async label => {
  await evaluate(`(() => { const button = [...document.querySelectorAll('button')].find(item => item.textContent.trim() === ${JSON.stringify(label)}); if (!button) throw new Error('Missing button: ' + ${JSON.stringify(label)}); button.click() })()`)
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
const p05 = "/request/new?from=hamburg-de&to=kaunas-lt&dateType=range&dateFrom=2026-09-15&dateTo=2026-09-17&review=multi-vehicle"
const p05Pickups = "/request/new?from=hamburg-de&to=kaunas-lt&dateType=range&dateFrom=2026-09-15&dateTo=2026-09-17&review=multi-location-pickups"
const p05Mixed = "/request/new?from=hamburg-de&to=kaunas-lt&dateType=range&dateFrom=2026-09-15&dateTo=2026-09-17&review=multi-location-mixed"

try {
  for (const width of [390, 768, 1280, 1536]) {
    await cdp("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false })

    await visit(p05)
    await overflow(`P05 initial ${width}`)
    for (const copy of ["Automobilis 1", "Automobilis 2", "Ar automobilį galima laisvai užridenti / ar jis rieda?", "bmw-priekis.jpg", "audi-sonas.jpg", "audi-galas.png"]) assert.ok(await evaluate(text(copy)), `P05 missing ${copy}`)
    assert.equal(await evaluate("document.querySelectorAll('#request-vehicles h3').length"), 2)
    assert.equal(await evaluate("document.querySelector('#request-vehicle-1-make').value"), "BMW")
    assert.equal(await evaluate("document.querySelector('#request-vehicle-1-model').value"), "X5")
    assert.equal(await evaluate("document.querySelector('#request-vehicle-2-make').value"), "Audi")
    assert.equal(await evaluate("document.querySelector('#request-vehicle-2-model').value"), "Q5")
    await click("+ Pridėti kitą automobilį")
    assert.equal(await evaluate("document.querySelectorAll('#request-vehicles h3').length"), 3)
    assert.equal(await evaluate("document.querySelector('#request-vehicle-1-make').value"), "BMW")
    assert.equal(await evaluate("document.querySelector('#request-vehicle-2-model').value"), "Q5")
    await evaluate("[...document.querySelectorAll('#request-vehicles button')].findLast(item => item.textContent.trim() === 'Pašalinti automobilį').click()")
    await pause(100)
    assert.equal(await evaluate("document.querySelectorAll('#request-vehicles h3').length"), 2)
    await click("Atgal")
    await click("Toliau")
    await until(text("Automobilis 2"))
    assert.equal(await evaluate("document.querySelector('#request-vehicle-1-model').value"), "X5")
    assert.equal(await evaluate("document.querySelector('#request-vehicle-2-model').value"), "Q5")
    assert.ok(await evaluate(text("audi-galas.png")))
    await overflow(`P05 preserved ${width}`)
    if (width === 390 || width === 1280) await screenshot(`p05-step-2-${width}`)

    await visit(p05Pickups)
    await overflow(`P05 multi-location pickups ${width}`)
    assert.ok(await evaluate(text("Naudoti pagrindinį maršrutą: Hamburg → Kaunas")))
    assert.equal(await evaluate("document.querySelector('#request-vehicle-2-pickupLocation').value"), "Berlin, Germany")
    assert.equal(await evaluate("document.querySelector('#request-vehicle-2-deliveryLocation').value"), "Kaunas, Lithuania")
    await click("Toliau")
    await click("Toliau")
    assert.ok(await evaluate(text("2 paėmimo vietos → Kaunas")))
    assert.ok(await evaluate(text("2 automobiliai · BMW X5, Audi Q5")))
    await overflow(`P05 multi-location summary ${width}`)
    if (width === 390 || width === 1280) await screenshot(`p05-multi-location-${width}`)

    await visit(p05Mixed)
    await overflow(`P05 mixed locations ${width}`)
    assert.equal(await evaluate("document.querySelector('#request-vehicle-2-pickupLocation').value"), "Berlin, Germany")
    assert.equal(await evaluate("document.querySelector('#request-vehicle-2-deliveryLocation').value"), "Vilnius, Lithuania")
    await click("Toliau")
    await click("Toliau")
    assert.ok(await evaluate(text("Kelių vietų pervežimas · 4 transporto vietos")))
    await overflow(`P05 mixed summary ${width}`)

    await visit("/request/multi-vehicle-demo-001/published")
    await overflow(`P06 ${width}`)
    assert.ok(await evaluate(text("2 automobiliai · BMW X5, Audi Q5")))

    await visit("/request/multi-location-pickups-demo-001/published")
    await overflow(`P06 multi-location ${width}`)
    assert.ok(await evaluate(text("2 paėmimo vietos → Kaunas")))

    await visit("/requests/multi-vehicle-demo-001")
    await overflow(`P07 ${width}`)
    assert.ok(await evaluate(text("Automobiliai (2)")))
    assert.ok(await evaluate(text("Visa pervežimo kaina už 2 automobilius")))

    await visit("/requests/multi-location-pickups-demo-001")
    await overflow(`P07 multi-location pickups ${width}`)
    assert.ok(await evaluate(text("Hamburg → Kaunas")))
    assert.ok(await evaluate(text("Berlin → Kaunas")))

    await visit("/requests/multi-location-mixed-demo-001")
    await overflow(`P07 mixed locations ${width}`)
    assert.ok(await evaluate(text("Berlin → Vilnius")))

    await visit("/offers/multi-vehicle-demo-001-offer-1")
    await overflow(`P08 ${width}`)
    assert.ok(await evaluate(text("Visa pervežimo kaina už 2 automobilius")))
    assert.ok(await evaluate(text("Automobiliai (2)")))

    await visit("/offers/multi-location-pickups-demo-001-offer-1")
    await overflow(`P08 multi-location ${width}`)
    assert.ok(await evaluate(text("Pasiūlymas apima visus automobilius ir visus šioje užklausoje nurodytus maršrutus.")))
    assert.ok(await evaluate(text("Berlin → Kaunas")))

    await visit("/dashboard")
    await overflow(`P09 ${width}`)
    assert.ok(await evaluate(text("2 automobiliai · BMW X5, Audi Q5")))
    assert.ok(await evaluate(text("Reikia dėmesio")))
    assert.ok(await evaluate(text("2 paėmimo vietos → Kaunas")))

    await visit("/search?from=hamburg-de&to=kaunas-lt&vehicle=car&vehicleCount=2")
    await overflow(`P02 capacity ${width}`)
    assert.equal(await evaluate("document.querySelector('a[href=\"/routes/manto-transportas-0917\"]')"), null)
    assert.ok(await evaluate(text("Laisvos vietos: 3")))

    await visit("/routes/baltijos-kelias-0915")
    await overflow(`P03 available ${width}`)
    assert.ok(await evaluate(text("3 laisvos vietos")))
    assert.ok(await evaluate(text("Gauti pasiūlymą iš šio vežėjo")))

    await visit("/routes/baltijos-kelias-0920-full")
    await overflow(`P03 full ${width}`)
    assert.ok(await evaluate(text("Maršrutas pilnas")))
    assert.equal(await evaluate(text("Gauti pasiūlymą iš šio vežėjo")), false)
    assert.equal(await evaluate(text("Gauti pasiūlymų iš kitų vežėjų")), false)
    if (width === 390 || width === 1280) await screenshot(`p03-full-${width}`)
    console.log(`PASS ${width}px: P02/P03 capacity and P05–P09 multi-vehicle states; no overflow`)
  }
  assert.deepEqual(exceptions, [])
  console.log(`PASS no runtime exceptions. Screenshots: ${artifacts}`)
} finally {
  await send("Browser.close").catch(() => {})
  socket.close()
  chrome.kill()
}
