// Production B01 browser checks without an additional package dependency.
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { mkdir, mkdtemp, writeFile } from "node:fs/promises"
import path from "node:path"
import { tmpdir } from "node:os"

const base = process.env.B01_BASE_URL ?? "http://localhost:3000"
const profile = await mkdtemp(path.join(tmpdir(), "b01-chrome-"))
const artifacts = path.resolve(".next/b01-review")
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
  await pause(120)
}
const overflow = async label => {
  const size = await evaluate("({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth })")
  assert.ok(size.scroll <= size.width, `${label}: ${JSON.stringify(size)}`)
}
const click = async label => {
  await evaluate(`(() => { const element = [...document.querySelectorAll('button')].find(item => item.textContent.trim() === ${JSON.stringify(label)}); if (!element) throw new Error('Missing button'); element.click() })()`)
  await pause(120)
}
const screenshot = async name => {
  const { data } = await cdp("Page.captureScreenshot", { captureBeyondViewport: true })
  await writeFile(path.join(artifacts, `${name}.png`), Buffer.from(data, "base64"))
}

const states = [
  ["transport-demo-001", "Vežėjas pasirinktas"],
  ["transport-pickup-scheduled-demo-001", "Paėmimas suplanuotas"],
  ["transport-collected-demo-001", "Automobilis paimtas"],
  ["transport-in-transit-demo-001", "Vežama"],
  ["transport-delivered-demo-001", "Pristatyta"],
  ["transport-completed-demo-001", "Pervežimas užbaigtas"],
]

try {
  for (const width of [390, 768, 1280, 1440]) {
    await cdp("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false })

    for (const [id, label] of states) {
      await visit(`/bookings/${id}`)
      await overflow(`${id} ${width}`)
      assert.equal(await evaluate("document.querySelectorAll('[data-timeline-state=current]').length"), 1)
      assert.ok(await evaluate(text(label)), `${id} missing ${label}`)
      assert.equal(await evaluate("!!document.querySelector('a[href^=\"/messages/\"]')"), true)
      assert.equal(await evaluate("!!document.querySelector('a[href^=\"/offers/\"]')"), false)
      const showsCompletion = await evaluate(text("Patvirtinti, kad automobilis gautas"))
      assert.equal(showsCompletion, id === "transport-delivered-demo-001")
      assert.equal(await evaluate("document.querySelectorAll('[aria-current=step]').length"), 1)
      assert.equal(await evaluate("document.querySelectorAll('ol[aria-label=\"Pervežimo būsenos\"] > li').length"), 6)
      assert.ok(await evaluate("document.querySelector('main header').innerText.includes('Sutarta bendra kaina')"))
      await screenshot(`${id}-${width}`)
    }

    const connector = await evaluate(`(() => {
      const lines = [...document.querySelectorAll('[data-timeline-connector]')].filter(item => getComputedStyle(item).visibility !== 'hidden').map(item => item.getBoundingClientRect())
      const nodes = [...document.querySelectorAll('[data-timeline-node]')].map(node => node.getBoundingClientRect())
      const steps = [...document.querySelectorAll('[data-timeline-state]')]
      return {
        lineVisible: lines.some(line => line.width > 0 && line.height > 0),
        connected: nodes.slice(0, -1).every((node, index) => Math.abs(lines[index * 2].left - node.right) < 2 && Math.abs(lines[index * 2].right - lines[index * 2 + 1].left) < 2 && Math.abs(lines[index * 2 + 1].right - nodes[index + 1].left) < 2),
        vertical: steps.slice(1).every((step, index) => step.getBoundingClientRect().top >= steps[index].getBoundingClientRect().bottom),
        explicitStates: steps.every(step => /Atlikta|Dabartinė būsena|Dar neatlikta/.test(step.innerText)),
      }
    })()`)
    if (width >= 768) {
      assert.equal(connector.lineVisible, true)
      assert.equal(connector.connected, true)
    } else {
      assert.equal(connector.lineVisible, false)
      assert.equal(connector.vertical, true)
    }
    assert.equal(connector.explicitStates, true)

    await visit("/bookings/transport-delivered-demo-001")
    assert.ok(await evaluate(text("Jei automobilis pristatytas, patvirtinkite jo gavimą ir užbaikite pervežimą.")))
    await click("Patvirtinti, kad automobilis gautas")
    assert.ok(await evaluate(text("Patvirtinus, kad automobilis gautas, pervežimas bus pažymėtas kaip užbaigtas.")))
    await overflow(`confirmation dialog ${width}`)
    await until("document.activeElement?.textContent.trim() === 'Atšaukti'")
    await click("Atšaukti")
    assert.ok(await evaluate(text("Patvirtinti, kad automobilis gautas")))
    await until("document.activeElement?.textContent.trim() === 'Patvirtinti, kad automobilis gautas'")
    await click("Patvirtinti, kad automobilis gautas")
    await click("Patvirtinti gavimą")
    assert.ok(await evaluate(text("Pervežimas užbaigtas")))
    assert.equal(await evaluate(text("Patvirtinti, kad automobilis gautas")), false)
    assert.ok(await evaluate(text("Peržiūrėkite susirašinėjimo istoriją.")))
    await until("document.activeElement?.textContent.trim() === 'Pervežimas užbaigtas'")
    assert.equal(await evaluate("document.querySelector('a[href=\"/messages/booking-winning-demo-001\"]')?.textContent.includes('Peržiūrėti pokalbį')"), true)

    await visit("/bookings/transport-multi-location-demo-001")
    await overflow(`multi-location ${width}`)
    for (const copy of ["2 paėmimo vietos → Kaunas", "2 automobiliai", "BMW X5", "Hamburg → Kaunas", "Audi Q5", "Berlin → Kaunas", "900 €", "Visa pervežimo kaina už 2 automobilius"]) assert.ok(await evaluate(text(copy)), `Multi ${width} missing ${copy}`)
    assert.equal(await evaluate("document.querySelectorAll('section[aria-labelledby=\"vehicles-heading\"] [data-slot=card]').length"), 2)
    assert.equal(await evaluate("document.querySelector('a[href=\"/messages/booking-winning-demo-001\"]')?.textContent.includes('Atidaryti pokalbį')"), true)
    const shortTargets = await evaluate("[...document.querySelectorAll('main a, main button')].filter(item => { const rect = item.getBoundingClientRect(); return rect.width > 0 && rect.height < 43 }).map(item => [item.textContent.trim(), item.getBoundingClientRect().height])")
    assert.deepEqual(shortTargets, [])

    await screenshot(`multi-location-${width}`)
    console.log(`PASS ${width}px: six lifecycle states, Delivered confirmation, timeline and multi-location Booking; no overflow`)
  }

  await visit("/dashboard?view=transport")
  assert.equal(await evaluate("document.querySelector('a[href=\"/bookings/transport-demo-001\"]')?.textContent.trim()"), "Atidaryti pervežimą")
  await visit("/dashboard?view=history")
  assert.equal(await evaluate("!!document.querySelector('a[href=\"/requests/completed-demo-001\"]')"), true)
  await visit("/requests/completed-demo-001")
  // Existing locked P07 gap: Completed Request detail does not expose a Booking action.
  // Keep this baseline explicit; B01 visual work must not change P07/P09 behavior.
  assert.equal(await evaluate("!!document.querySelector('a[href^=\"/bookings/\"]')"), false)
  await visit("/bookings/transport-completed-demo-001")
  assert.equal(await evaluate("!!document.querySelector('a[href=\"/dashboard?view=history\"]')"), true)
  await visit("/messages/completed-demo-001")
  assert.equal(await evaluate("!!document.querySelector('textarea')"), false)
  await visit("/messages/booking-winning-demo-001")
  assert.equal(await evaluate("!!document.querySelector('textarea')"), true)
  const unknownStatus = await evaluate(`fetch(${JSON.stringify(`${base}/bookings/unknown-b01-booking`)}, { redirect: 'manual' }).then(response => response.status)`)
  assert.equal(unknownStatus, 404)
  await visit("/bookings/unknown-b01-booking")
  await overflow("unknown Booking")
  assert.deepEqual(exceptions, [])
  console.log(`PASS dashboard destination, unknown HTTP 404 and no runtime exceptions. Screenshots: ${artifacts}`)
} finally {
  await send("Browser.close").catch(() => {})
  socket.close()
  chrome.kill()
}
