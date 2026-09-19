// Production P05 browser checks without an additional package dependency.
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { mkdir, mkdtemp, writeFile } from "node:fs/promises"
import path from "node:path"
import { tmpdir } from "node:os"

const base = process.env.P05_BASE_URL ?? "http://localhost:3000"
const profile = await mkdtemp(path.join(tmpdir(), "p05-chrome-"))
const artifacts = path.resolve(".next/p05-review")
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

const hasText = text => `document.querySelector('main').innerText.includes(${JSON.stringify(text)})`
const click = async text => {
  await evaluate(`[...document.querySelectorAll('main button')].find(el => el.textContent.trim() === ${JSON.stringify(text)}).click()`)
  await pause(100)
}
const fill = async (id, value) => {
  await evaluate(`(() => { const el = document.getElementById(${JSON.stringify(id)}); const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event('input', { bubbles: true })); })()`)
  await pause(100)
}
const choose = async (id, city) => {
  await evaluate(`(() => { const el = document.getElementById(${JSON.stringify(id)}); if (el.value) el.closest('[data-slot=input-group]').querySelector('[data-slot=combobox-clear]').click(); })()`)
  await pause(100)
  await evaluate(`document.getElementById(${JSON.stringify(id)}).focus()`)
  await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'a', code: 'KeyA', modifiers: 2 })
  await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'a', code: 'KeyA', modifiers: 2 })
  await cdp('Input.insertText', { text: city })
  await until("document.querySelector('[role=option]') !== null")
  await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowDown', code: 'ArrowDown' })
  await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter' })
  await pause(150)
}
const radio = async (id, index) => {
  await evaluate(`document.getElementById(${JSON.stringify(id)}).querySelectorAll('[role=radio]')[${index}].click()`)
  await pause(100)
}
const review = async name => {
  await overflow(name)
  const clipped = await evaluate(`Array.from(document.querySelectorAll('main button, main h1, main h2, main h3, main label, main p')).filter(el => el.clientWidth && getComputedStyle(el).position !== 'absolute' && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)).map(el => el.textContent)`)
  await screenshot(name)
  assert.deepEqual(clipped, [], name)
}
const photo = path.join(profile, 'vehicle.jpg')
await writeFile(photo, 'local browser test photo')
const upload = async id => {
  const { root } = await cdp('DOM.getDocument')
  const { nodeId } = await cdp('DOM.querySelector', { nodeId: root.nodeId, selector: `#${id}` })
  await cdp('DOM.setFileInputFiles', { nodeId, files: [photo] })
  await pause(100)
}
try {
  for (const width of [390, 768, 1280, 1440]) {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false })
    await visit('request/new')
    await click('Toliau')
    assert.equal(await evaluate('document.activeElement.id'), 'request-from')
    assert.equal(await evaluate('document.querySelectorAll("main [role=alert]").length'), 2)
    await review(`validation-${width}`)
    await choose('request-from', 'Hamburg')
    await choose('request-to', 'Kaunas')
    await review(`route-${width}`)
    await click('Toliau')
    await click('Toliau')
    assert.equal(await evaluate('document.activeElement.getAttribute("role")'), 'radio')
    await radio('request-vehicle-1-category', 1)
    await fill('request-vehicle-1-make', 'BMW')
    await fill('request-vehicle-1-model', 'X5')
    await radio('request-vehicle-1-condition', 1)
    await click('Toliau')
    assert.ok(await evaluate(hasText('Nurodykite, ar automobilis rieda.')))
    await radio('request-vehicle-1-rolls', 0)
    await upload('request-vehicle-1-photos')
    assert.ok(await evaluate(hasText('vehicle.jpg')))
    await review(`vehicle-${width}`)
    await click('Atgal')
    await click('Toliau')
    assert.equal(await evaluate('document.getElementById("request-vehicle-1-make").value'), 'BMW')
    assert.ok(await evaluate(hasText('vehicle.jpg')))
    await click('Toliau')
    await fill('request-notes', 'Raktai vietoje. Paėmimas darbo dienomis.')
    await review(`notes-${width}`)
    await click('Toliau')
    assert.ok(await evaluate(hasText('BMW X5')))
    assert.ok(await evaluate(hasText('Hamburg → Kaunas')))
    assert.ok(await evaluate(hasText('Nevažiuojantis · Rieda')))
    assert.ok(await evaluate(hasText('Raktai vietoje. Paėmimas darbo dienomis.')))
    await click('Tęsti telefono patvirtinimą')
    assert.equal(await evaluate('document.activeElement.id'), 'request-name')
    await fill('request-name', 'Jonas')
    await fill('request-phone', '+37060000000')
    await fill('request-email', 'jonas@example.test')
    await evaluate('document.getElementById("request-terms").click()')
    await review(`contact-review-${width}`)
    await click('Keisti automobilius')
    assert.equal(await evaluate('document.getElementById("request-vehicle-1-model").value'), 'X5')
    await click('Toliau')
    await click('Toliau')
    assert.equal(await evaluate('document.getElementById("request-email").value'), 'jonas@example.test')
    await click('Tęsti telefono patvirtinimą')
    await until(hasText('Užklausa nepaskelbta, patvirtinimo kodas neišsiųstas.'))
    assert.equal(await evaluate('location.pathname'), '/request/new')
    assert.equal(await evaluate('document.activeElement.id'), 'handoff-heading')
    await review(`handoff-${width}`)
    await click('Grįžti prie užklausos')
    assert.equal(await evaluate('document.getElementById("request-name").value'), 'Jonas')

    await visit('request/new?from=hamburg-de&to=kaunas-lt&dateType=range&dateFrom=2026-09-20&dateTo=2026-09-22&review=multi-location-pickups')
    await until('document.getElementById("request-vehicle-2-make") !== null')
    await click('+ Pridėti kitą automobilį')
    assert.ok(await evaluate(hasText('Automobilis 3')))
    await click('Atgal')
    await choose('request-from', 'Rotterdam')
    await click('Toliau')
    assert.ok(await evaluate(hasText('Naudoti pagrindinį maršrutą: Rotterdam → Kaunas')))
    assert.equal(await evaluate('document.getElementById("request-vehicle-2-pickupLocation").value'), 'Berlin, Germany')
    await evaluate(`[...document.querySelectorAll('#request-vehicles button')].findLast(el => el.textContent.trim() === 'Pašalinti automobilį').click()`)
    await pause(100)
    assert.equal(await evaluate('document.querySelectorAll("#request-vehicles h3").length'), 2)
    await choose('request-vehicle-2-pickupLocation', 'Hamburg')
    await review(`multi-vehicle-${width}`)
    for (let count = 2; count < 10; count++) await click('+ Pridėti kitą automobilį')
    assert.equal(await evaluate(`[...document.querySelectorAll('button')].find(el => el.textContent.trim() === '+ Pridėti kitą automobilį').disabled`), true)
    assert.equal(await evaluate('document.querySelectorAll("#request-vehicles h3").length'), 10)
    await overflow(`ten vehicles ${width}`)
    for (let count = 10; count > 2; count--) {
      await evaluate(`[...document.querySelectorAll('#request-vehicles button')].findLast(el => el.textContent.trim() === 'Pašalinti automobilį').click()`)
      await pause(70)
    }
    assert.equal(await evaluate('document.getElementById("request-vehicle-2-model").value'), 'Q5')
    assert.ok(await evaluate(hasText('audi-galas.png')))
    await click('Toliau')
    await click('Toliau')
    assert.ok(await evaluate(hasText('2 paėmimo vietos → Kaunas')))
    assert.ok(await evaluate(hasText('Rotterdam → Kaunas')))
    assert.ok(await evaluate(hasText('Hamburg → Kaunas')))
    await review(`multi-review-${width}`)
    await visit('request/new?from=hamburg-de&to=kaunas-lt&review=multi-location-mixed')
    await click('Toliau')
    await click('Toliau')
    assert.ok(await evaluate(hasText('Kelių vietų pervežimas · 4 transporto vietos')))
    assert.ok(await evaluate(hasText('Berlin → Vilnius')))
    await review(`mixed-review-${width}`)
    await visit('request/new?from=hamburg-de&to=warsaw-pl&review=multi-vehicle')
    await until('document.getElementById("request-vehicle-2-make") !== null')
    assert.deepEqual(await evaluate(`Array.from(document.querySelectorAll('#request-vehicle-1-category label')).map(el => el.textContent.trim())`), ['Lengvasis automobilis', 'SUV / Crossover', 'Furgonas / mikroautobusas', 'Motociklas'])
    await radio('request-vehicle-1-category', 3)
    await click('Toliau')
    await click('Toliau')
    assert.ok(await evaluate(hasText('Motociklas')))
    assert.ok(await evaluate(hasText('Hamburg → Warsaw')))
    await click('Keisti automobilius')
    await radio('request-vehicle-1-category', 1)
    await evaluate(`[...document.querySelectorAll('#request-vehicles button')].filter(el => el.textContent.trim() === 'Keisti šio automobilio maršrutą')[1].click()`)
    await pause(100)
    await choose('request-vehicle-2-pickupLocation', 'Berlin')
    await review(`warsaw-override-step2-${width}`)
    await click('Atgal')
    assert.equal(await evaluate('document.getElementById("request-from").value'), 'Hamburg, Germany')
    assert.equal(await evaluate('document.getElementById("request-to").value'), 'Warsaw, Poland')
    await click('Toliau')
    assert.equal(await evaluate('document.getElementById("request-vehicle-2-pickupLocation").value'), 'Berlin, Germany')
    assert.equal(await evaluate('document.getElementById("request-vehicle-2-deliveryLocation").value'), 'Warsaw, Poland')
    await click('Toliau')
    await click('Toliau')
    assert.ok(await evaluate(hasText('2 paėmimo vietos → Warsaw')))
    assert.ok(!(await evaluate(hasText('Kelių vietų pervežimas'))))
    const vehicleSummaries = await evaluate(`Array.from(document.querySelectorAll('main li')).map(el => el.innerText)`)
    assert.ok(vehicleSummaries.some(text => text.includes('BMW X5') && text.includes('Hamburg → Warsaw')))
    assert.ok(vehicleSummaries.some(text => text.includes('Audi Q5') && text.includes('Berlin → Warsaw')))
    await review(`warsaw-override-review-${width}`)
    await click('Keisti automobilius')
    await choose('request-vehicle-2-pickupLocation', 'Hamburg')
    await choose('request-vehicle-2-deliveryLocation', 'Kaunas')
    await click('Toliau')
    await click('Toliau')
    assert.ok(await evaluate(hasText('Hamburg → 2 pristatymo vietos')))
    await click('Keisti automobilius')
    await choose('request-vehicle-2-pickupLocation', 'Berlin')
    await click('Toliau')
    await click('Toliau')
    assert.ok(await evaluate(hasText('Kelių vietų pervežimas')))
    await visit('request/multi-location-pickups-demo-001/published')
    assert.ok(await evaluate(hasText('2 paėmimo vietos → Kaunas')))
    await overflow(`unchanged P06 fixture ${width}`)
    console.log(`PASS ${width}px: all steps, field focus, photos, 1–10 vehicles, inheritance/override, add/remove, retained data, review edits, verification boundary and P06 fixture`)
  }
  // Current valid route context; expired/unknown targets retain explicit fallback.
  await visit('request/new?from=rotterdam-nl&to=vilnius-lt&visibility=targeted&targetCarrier=vakaru-kryptis&targetRoute=vakaru-kryptis-0918')
  assert.ok(await evaluate(hasText('Pasiūlymo prašote iš Vakarų kryptis')))
  await visit('request/new?from=hamburg-de&to=kaunas-lt&visibility=targeted&targetRoute=unknown&targetCarrier=unknown')
  await click('Tęsti su kitais vežėjais')
  assert.equal(await evaluate('document.getElementById("request-from").value'), 'Hamburg, Germany')
  assert.ok(!(await evaluate(hasText('Pasirinkto vežėjo maršruto nepavyko rasti.'))))
  assert.deepEqual(exceptions, [])
  console.log('PASS targeted context, explicit fallback; no runtime exceptions')
} finally {
  await send('Browser.close').catch(() => {})
  socket.close()
  chrome.kill()
}
