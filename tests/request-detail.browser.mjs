// Production browser checks without a package dependency. Run against npm run start.
// CHROME_PATH may override the Windows Chrome executable; P07_BASE_URL defaults to port 3000.
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { mkdir, mkdtemp, writeFile } from "node:fs/promises"
import path from "node:path"
import { tmpdir } from "node:os"

const base = process.env.P07_BASE_URL ?? "http://localhost:3000"
const profile = await mkdtemp(path.join(tmpdir(), "p07-chrome-"))
const artifacts = path.resolve(".next/p07-review")
await mkdir(artifacts, { recursive: true })
const chrome = spawn(process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe", ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"], { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] })
const endpoint = await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error("Chrome startup timeout")), 15000)
  chrome.on("error", reject)
  chrome.stderr.on("data", chunk => { const match = String(chunk).match(/DevTools listening on (ws:\/\/\S+)/); if (match) { clearTimeout(timeout); resolve(match[1]) } })
})
const socket = new WebSocket(endpoint)
await new Promise(resolve => socket.addEventListener("open", resolve, { once: true }))
let sequence = 0
const pending = new Map(), errors = []
socket.addEventListener("message", event => {
  const message = JSON.parse(event.data)
  if (message.id) { const handler = pending.get(message.id); pending.delete(message.id); if (message.error) handler.reject(message.error); else handler.resolve(message.result) }
  if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails)
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
const until = async expression => { for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await pause(100) } throw new Error(`Timed out: ${expression}`) }
const text = value => `document.body.innerText.includes(${JSON.stringify(value)})`
const click = async label => {
  await evaluate(`(() => { const root = document.querySelector('[role="alertdialog"][data-open]') ?? document; const button = [...root.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(label)}); if (!button) throw new Error('Missing button: ' + ${JSON.stringify(label)}); button.click() })()`)
  await pause(150)
}
const offers = () => evaluate("document.querySelectorAll('a[href^=\"/offers/\"]').length")
const visit = async id => {
  await cdp("Page.navigate", { url: `${base}/requests/${id}` })
  await until("document.readyState === 'complete' && !!document.querySelector('h1')")
  await pause(250)
}
const overflow = async label => {
  const size = await evaluate("({width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth})")
  assert.ok(size.scroll <= size.width, `${label}: ${JSON.stringify(size)}`)
}
const screenshot = async name => {
  const { data } = await cdp("Page.captureScreenshot", { captureBeyondViewport: true })
  await writeFile(path.join(artifacts, `${name}.png`), Buffer.from(data, "base64"))
}
try {
  const states = ["marketplace", "targeted", "updated-offer", "booked", "closed", "completed", "draft", "non-running", "historical-offers"]
  for (const width of [390, 768, 1280, 1536]) {
    await cdp("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false })
    for (const state of states) {
      const id = `${state}-demo-001`
      assert.equal((await fetch(`${base}/requests/${id}`)).status, 200)
      await visit(id)
      await overflow(`${state} ${width}`)
      if (width >= 1280) assert.equal(await evaluate("getComputedStyle(document.querySelector('[aria-labelledby=\"offers-heading\"]').parentElement).gridTemplateColumns.split(' ').length"), 2, 'Desktop offers and details must use two columns')
      assert.equal(await offers(), ["marketplace", "updated-offer"].includes(state) ? 2 : state === "non-running" ? 1 : 0)
      if (state === "targeted") assert.ok(await evaluate(text("Pasiūlymų dar nėra")))
      if (state === "updated-offer") assert.ok(await evaluate(text("Atnaujintas pasiūlymas")))
      if (state === "booked" || state === "completed") {
        assert.ok(await evaluate(text("Pasirinktas vežėjas")))
        assert.equal(await evaluate("document.querySelectorAll('[aria-labelledby=\"offers-heading\"] > [data-slot=\"card\"]').length"), 1)
        assert.ok(await evaluate(text("Ankstesni pasiūlymai (1)")))
        assert.equal(await evaluate("document.querySelector('details').open"), false)
        await evaluate("document.querySelector('details').open = true")
        assert.ok(await evaluate(text("Nepasirinktas")))
        assert.equal(await evaluate("document.querySelectorAll('details a[href^=\"/offers/\"]').length"), 0)
        await evaluate("document.querySelector('details').open = false")
      }
      if (state === "booked") assert.equal(await evaluate("document.querySelector('a[href^=\"/bookings/\"]').getAttribute('href')"), "/bookings/transport-demo-001")
      if (["booked", "closed", "completed", "draft"].includes(state)) assert.equal(await evaluate("[...document.querySelectorAll('button')].some(b => b.textContent === 'Redaguoti užklausą' || b.textContent === 'Uždaryti užklausą')"), false)
      if (width === 390 || width === 1280) await screenshot(`${state}-${width}`)
    }
    await visit("marketplace-demo-001")
    await click("Redaguoti užklausą")
    await until("document.activeElement?.id === 'edit-heading'")
    await overflow(`editor ${width}`)
    await evaluate(`(() => { const field = document.querySelector('#edit-notes'); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(field, 'Vietinis pakeitimas'); field.dispatchEvent(new Event('input', { bubbles: true })) })()`)
    await evaluate(`(() => {
      const png = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9S8AAAAASUVORK5CYII='), c => c.charCodeAt(0));
      const data = new DataTransfer(); data.items.add(new File([png], 'automobilis-' + 'a'.repeat(180) + '.png', { type: 'image/png' }));
      const input = document.querySelector('#request-photos'); input.files = data.files; input.dispatchEvent(new Event('change', { bubbles: true }));
    })()`)
    await pause(100)
    await overflow(`editor with long photo filename ${width}`)
    await click("Išsaugoti pakeitimus")
    await until(text("Vietinis pakeitimas"))
    await until("!!document.querySelector('img[alt^=\"Automobilio nuotrauka\"]')?.naturalWidth")
    await overflow(`photo detail ${width}`)
    assert.equal(await offers(), 2)
    await click("Redaguoti užklausą")
    await click("Pašalinti")
    await evaluate("[...document.querySelectorAll('#edit-category [role=radio]')][0].click()")
    await click("Išsaugoti pakeitimus")
    await until(text("Pakeitus šiuos duomenis esami pasiūlymai nebegalios."))
    await overflow(`confirmation ${width}`)
    assert.equal(await evaluate("document.activeElement.textContent"), "Atšaukti")
    await screenshot(`confirmation-${width}`)
    await click("Atšaukti")
    await click("Išsaugoti pakeitimus")
    await click("Patvirtinti pakeitimus")
    await until(text("Ankstesni pasiūlymai nebegalioja."))
    assert.equal(await offers(), 0)
    await visit("marketplace-demo-001")
    assert.equal(await offers(), 2)
    await click("Uždaryti užklausą")
    await click("Atšaukti")
    assert.equal(await offers(), 2)
    await click("Uždaryti užklausą")
    await click("Patvirtinti uždarymą")
    await until(text("Užklausa uždaryta"))
    assert.equal(await offers(), 0)
    await click("Pakartoti užklausą")
    await until(text("Juodraštis"))
    assert.ok(await evaluate(text("BMW X5")))
    await visit("targeted-demo-001")
    await click("Parodyti ir kitiems tinkamiems vežėjams")
    await until(text("Baltijos kelias ir kiti tinkami vežėjai"))
    await visit("targeted-demo-001")
    assert.ok(await evaluate(text("Tik Baltijos kelias")))
    console.log(`PASS ${width}px: nine fixtures, editor, material confirmation, closure, repeat, visibility, reset; no overflow`)
  }
  assert.equal((await fetch(`${base}/requests/unknown-p07-request`)).status, 404)
  await visit("unknown-p07-request")
  assert.ok(await evaluate(text("Užklausa nerasta")))
  assert.deepEqual(errors, [])
  console.log(`PASS unknown HTTP 404; no runtime exceptions. Screenshots: ${artifacts}`)
} finally {
  await send("Browser.close").catch(() => {})
  socket.close()
  chrome.kill()
}
