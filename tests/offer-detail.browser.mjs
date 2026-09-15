// Production P08 browser checks without an additional package dependency.
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { mkdir, mkdtemp, writeFile } from "node:fs/promises"
import path from "node:path"
import { tmpdir } from "node:os"

const base = process.env.P08_BASE_URL ?? "http://localhost:3000"
const profile = await mkdtemp(path.join(tmpdir(), "p08-chrome-"))
const artifacts = path.resolve(".next/p08-review")
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
const visit = async id => {
  await cdp("Page.navigate", { url: `${base}/offers/${id}` })
  await until("document.readyState === 'complete' && !!document.querySelector('h1')")
  await pause(200)
}
const click = async label => {
  await evaluate(`(() => { const root = document.querySelector('[role="alertdialog"][data-open]') ?? document; const button = [...root.querySelectorAll('button')].find(item => item.textContent.trim() === ${JSON.stringify(label)}); if (!button) throw new Error('Missing button: ' + ${JSON.stringify(label)}); button.click() })()`)
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
const fixtures = {
  pending: ["marketplace-demo-001-offer-1", "Laukia jūsų sprendimo"],
  updated: ["updated-offer-demo-001-offer-1", "Laukia jūsų sprendimo"],
  expired: ["historical-offers-demo-001-offer-1", "Pasiūlymas nebegalioja"],
  unavailable: ["request-changed-demo-001-offer-1", "Pasiūlymas nebegalioja"],
  notSelected: ["booked-demo-001-offer-2", "Nepasirinktas"],
  accepted: ["booked-demo-001-offer-1", "Pasirinktas"],
  declined: ["historical-offers-demo-001-offer-2", "Atmestas"],
  multi: ["multi-vehicle-demo-001-offer-1", "Laukia jūsų sprendimo"],
}

try {
  for (const width of [390, 768, 1280, 1536]) {
    await cdp("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false })
    for (const [state, [id, status]] of Object.entries(fixtures)) {
      assert.equal((await fetch(`${base}/offers/${id}`)).status, 200)
      await visit(id)
      await overflow(`${state} ${width}`)
      assert.ok(await evaluate(text(status)))
      assert.ok(await evaluate(text(`Pasiūlymas iš vežėjo „${id.endsWith("offer-2") ? "Šiaurės autovežis" : "Baltijos kelias"}“`)))
      assert.equal(await evaluate(text("Demonstracinis pasiūlymas.")), false)
      assert.ok(await evaluate(text("Visa pervežimo kaina")))
      const expiry = await evaluate("[...document.querySelectorAll('dt')].find(item => item.textContent === 'Pasiūlymas galioja iki').parentElement.innerText")
      assert.ok(expiry.includes(`2026 m. rugs. ${state === "expired" ? "13" : "14"} d. 21:00`))
      assert.match(expiry, /\(Lietuvos laiku\)/)
      assert.ok(await evaluate(text("Jūsų užklausa")))
      assert.equal(await evaluate("document.querySelector('a[href^=\"/carriers/\"]').getAttribute('href')"), id.endsWith("offer-2") ? "/carriers/siaures-autovezis" : "/carriers/baltijos-kelias")
      const decisions = await evaluate("[...document.querySelectorAll('button')].filter(button => ['Priimti pasiūlymą', 'Atmesti pasiūlymą'].includes(button.textContent.trim())).length")
      assert.equal(decisions, ["pending", "updated", "multi"].includes(state) ? 2 : 0)
      if (state === "multi") {
        assert.ok(await evaluate(text("Visa pervežimo kaina už 2 automobilius")))
        assert.ok(await evaluate(text("Automobiliai (2)")))
        assert.ok(await evaluate(text("BMW X5 · SUV / Crossover")))
        assert.ok(await evaluate(text("Audi Q5 · SUV / Crossover")))
      }
      if (state === "updated") {
        assert.ok(await evaluate(text("Atnaujintas pasiūlymas")))
        assert.equal(await evaluate("document.querySelector('details').open"), false)
        await evaluate("document.querySelector('details').open = true")
        assert.ok(await evaluate(text("Ankstesnė kaina")))
        assert.ok(await evaluate(text("590")))
        assert.equal(await evaluate("document.querySelectorAll('details button').length"), 0)
        await evaluate("document.querySelector('details').open = false")
      }
      if (state === "expired") assert.ok(await evaluate(text("Šio pasiūlymo galiojimo laikas baigėsi.")))
      if (state === "unavailable") assert.ok(await evaluate(text("užklausos duomenys pasikeitė")))
      if (state === "notSelected") assert.ok(await evaluate(text("Pasirinkote kitą vežėją.")))
      if (width === 390 || width === 1280) await screenshot(`${state}-${width}`)
    }

    await visit(fixtures.pending[0])
    await click("Priimti pasiūlymą")
    await until(text("Pasirinkus šį vežėją, kiti pasiūlymai taptų nebepasirenkami."))
    assert.equal(await evaluate("document.activeElement.textContent.trim()"), "Atšaukti")
    for (const copy of ["Baltijos kelias", "590", "2026 m. rugs. 15 d.", "2026 m. rugs. 17 d.", "Apmokėjimas pristatymo metu"]) assert.ok(await evaluate(text(copy)))
    await overflow(`accept dialog ${width}`)
    if (width === 390 || width === 1280) await screenshot(`accept-dialog-${width}`)
    await click("Atšaukti")
    assert.ok(await evaluate(text("Laukia jūsų sprendimo")))
    await click("Priimti pasiūlymą")
    await click("Patvirtinti pasirinkimą")
    await until(text("Tikras užsakymas nebuvo sukurtas"))
    assert.ok(await evaluate(text("Pasirinktas")))
    assert.equal(await evaluate("[...document.querySelectorAll('button')].some(button => button.textContent.trim() === 'Priimti pasiūlymą')"), false)
    await visit(fixtures.pending[0])
    assert.ok(await evaluate(text("Laukia jūsų sprendimo")))

    await visit(fixtures.multi[0])
    await click("Priimti pasiūlymą")
    await until(text("Priimate 900"))
    assert.ok(await evaluate(text("pasiūlymą už 2 automobilių pervežimą pagal visus užklausoje nurodytus maršrutus.")))
    assert.ok(await evaluate(text("Pasirinkus šį vežėją, kiti pasiūlymai taptų nebepasirenkami.")))
    await overflow(`multi-vehicle accept dialog ${width}`)
    await click("Atšaukti")

    await visit(fixtures.pending[0])
    await click("Atmesti pasiūlymą")
    await until(text("Atmesti pasiūlymą?"))
    await click("Patvirtinti atmetimą")
    await until(text("Pasiūlymas atmestas tik šiame puslapyje"))
    assert.ok(await evaluate(text("Atmestas")))
    assert.equal(await evaluate("[...document.querySelectorAll('button')].some(button => button.textContent.trim() === 'Priimti pasiūlymą')"), false)
    await visit(fixtures.pending[0])
    assert.ok(await evaluate(text("Laukia jūsų sprendimo")))
    console.log(`PASS ${width}px: eight states, multi-vehicle scope, history, accept/decline confirmation and reload reset; no overflow`)
  }
  assert.equal((await fetch(`${base}/offers/unknown-p08-offer`)).status, 404)
  await visit("unknown-p08-offer")
  assert.ok(await evaluate(text("Pasiūlymas nerastas")))
  assert.deepEqual(exceptions, [])
  console.log(`PASS unknown HTTP 404; no runtime exceptions. Screenshots: ${artifacts}`)
} finally {
  await send("Browser.close").catch(() => {})
  socket.close()
  chrome.kill()
}
