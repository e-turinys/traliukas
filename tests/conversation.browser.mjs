// Production Conversation browser checks without an additional package dependency.
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { mkdir, mkdtemp, writeFile } from "node:fs/promises"
import path from "node:path"
import { tmpdir } from "node:os"

const base = process.env.CONVERSATION_BASE_URL ?? "http://localhost:3000"
const profile = await mkdtemp(path.join(tmpdir(), "conversation-chrome-"))
const artifacts = path.resolve(".next/conversation-review")
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
  await pause(150)
}
const overflow = async label => {
  const size = await evaluate("({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth })")
  assert.ok(size.scroll <= size.width, `${label}: ${JSON.stringify(size)}`)
  const clipped = await evaluate(`Array.from(document.querySelectorAll('main button, main a, main h1, main h2, main p, main time')).filter(el => el.clientWidth && getComputedStyle(el).position !== 'absolute' && getComputedStyle(el).webkitLineClamp !== '2' && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)).map(el => el.textContent)`)
  assert.deepEqual(clipped, [], `${label}: clipped content`)
}
const screenshot = async name => {
  const { data } = await cdp("Page.captureScreenshot", { captureBeyondViewport: true })
  await writeFile(path.join(artifacts, `${name}.png`), Buffer.from(data, "base64"))
}

try {
  for (const width of [390, 768, 1280, 1440, 1536]) {
    await cdp("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false })

    await visit("/messages")
    await overflow(`inbox ${width}`)
    for (const copy of ["Pokalbiai", "Aktyvus pervežimas", "Baigtas", "2 paėmimo vietos → Kaunas"]) assert.ok(await evaluate(text(copy)), `Inbox ${width} missing ${copy}`)
    assert.equal(await evaluate("document.querySelectorAll('a[href^=\"/messages/\"]').length"), 6)
    assert.equal(await evaluate("!!document.querySelector('[aria-label=\"1 neperskaityta\"]')"), true)
    await screenshot(`inbox-${width}`)
    await visit('/messages?view=empty')
    assert.ok(await evaluate(text('Pokalbių dar nėra')))
    assert.equal(await evaluate(`document.querySelectorAll('a[href^="/messages/"]').length`), 0)
    await overflow(`empty inbox ${width}`)
    await screenshot(`empty-${width}`)

    await visit("/messages/active-prebooking-demo-001")
    await overflow(`active ${width}`)
    for (const copy of ["Baltijos kelias", "Hamburg → Kaunas", "BMW X5", "Baltijos kelias pateikė pasiūlymą", "Rašyti žinutę", "Siųsti"]) assert.ok(await evaluate(text(copy)), `Active ${width} missing ${copy}`)
    assert.equal(await evaluate("[...document.querySelectorAll('[data-message-kind=\"system\"] p')].some(item => item.firstChild?.nodeType === Node.TEXT_NODE && item.firstChild.textContent.trim() === 'Sistemos įvykis')"), false)
    const messageLayout = await evaluate(`(() => {
      const items = [...document.querySelectorAll('[data-message-item]')]
      const gaps = items.slice(1).map((item, index) => item.getBoundingClientRect().top - items[index].getBoundingClientRect().bottom)
      const composer = document.querySelector('[data-message-composer]')
      const style = getComputedStyle(composer)
      return { maxGap: Math.max(...gaps), position: style.position, composerHeight: composer.getBoundingClientRect().height }
    })()`)
    assert.ok(messageLayout.maxGap <= 12, `Message gap ${width}: ${messageLayout.maxGap}`)
    assert.equal(messageLayout.position, "sticky")
    assert.ok(messageLayout.composerHeight >= 44)
    assert.ok(await evaluate(`document.querySelector('[data-message-item]:last-child').getBoundingClientRect().bottom <= document.querySelector('[data-message-composer]').getBoundingClientRect().top`), `Composer overlaps history on initial load ${width}`)
    assert.equal(await evaluate("document.querySelector('a[href=\"/requests/marketplace-demo-001\"]')?.textContent.includes('Atidaryti užklausą')"), true)
    for (const [kind, alignment] of [['carrier', 'flex-start'], ['customer', 'flex-end'], ['system', 'center']]) {
      assert.equal(await evaluate(`getComputedStyle(document.querySelector('[data-message-kind="${kind}"]')).justifyContent`), alignment)
    }
    assert.equal(await evaluate(`document.querySelector('button[type="submit"]').disabled`), true)
    await screenshot(`active-${width}`)
    await evaluate("(() => { const area = document.querySelector('#message-body'); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(area, 'Kada tiksliai atvyksite?'); area.dispatchEvent(new Event('input', { bubbles: true })) })()")
    await pause(50)
    await evaluate("[...document.querySelectorAll('button')].find(item => item.textContent.trim().startsWith('Siųsti')).click()")
    await pause(100)
    assert.ok(await evaluate(text("Kada tiksliai atvyksite?")))
    const bottomLayout = await evaluate(`(() => {
      window.scrollTo(0, document.documentElement.scrollHeight)
      const latest = document.querySelector('[data-message-item]:last-child').getBoundingClientRect()
      const composer = document.querySelector('[data-message-composer]').getBoundingClientRect()
      return { latestBottom: latest.bottom, composerTop: composer.top, composerBottom: composer.bottom, viewport: innerHeight }
    })()`)
    assert.ok(bottomLayout.latestBottom <= bottomLayout.composerTop, `Composer obscures latest message ${width}: ${JSON.stringify(bottomLayout)}`)
    assert.ok(bottomLayout.composerBottom <= bottomLayout.viewport + 1, `Composer outside viewport ${width}: ${JSON.stringify(bottomLayout)}`)
    if (width >= 1280) assert.ok(await evaluate("Math.max(...[...document.querySelectorAll('ol[aria-label=\"Žinutės\"] article')].map(item => item.getBoundingClientRect().width)) <= 576"))
    await evaluate(`(() => { const area = document.querySelector('#message-body'); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(area, ${JSON.stringify('Ilga žinutė apie visų automobilių pervežimą. '.repeat(16) + '\n' + 'IlgasTekstas'.repeat(35))}); area.dispatchEvent(new Event('input', { bubbles: true })) })()`)
    await pause(50)
    await evaluate(`document.querySelector('button[type="submit"]').click()`)
    await pause(100)
    await overflow(`long message ${width}`)
    await screenshot(`long-message-${width}`)
    await visit('/messages/active-prebooking-demo-001')
    assert.equal(await evaluate(text('Kada tiksliai atvyksite?')), false)
    await visit('/messages/updated-offer-demo-001')
    assert.ok(await evaluate(text('Pasiūlymas atnaujintas')))
    assert.equal(await evaluate(`!!document.querySelector('[data-message-composer]')`), true)
    await overflow(`updated ${width}`)

    await visit("/messages/booking-winning-demo-001")
    await overflow(`booking ${width}`)
    assert.ok(await evaluate(text("Pasiūlymas priimtas")))
    assert.equal(await evaluate("document.querySelector('a[href=\"/bookings/transport-demo-001\"]')?.textContent.includes('Atidaryti pervežimą')"), true)
    assert.equal(await evaluate(`!!document.querySelector('[data-message-composer]')`), true)
    await screenshot(`booking-${width}`)

    await visit("/messages/booking-losing-demo-001")
    await overflow(`archived ${width}`)
    assert.ok(await evaluate(text("Šis pokalbis baigtas.")))
    assert.equal(await evaluate("!!document.querySelector('#message-body')"), false)
    assert.equal(await evaluate("!!document.querySelector('[data-message-composer]')"), false)
    await screenshot(`archived-${width}`)

    await visit("/messages/completed-demo-001")
    await overflow(`completed ${width}`)
    assert.ok(await evaluate(text("Šis pokalbis baigtas.")))
    assert.equal(await evaluate("!!document.querySelector('[data-message-composer]')"), false)
    await screenshot(`completed-${width}`)

    await visit("/messages/multi-location-demo-001")
    await overflow(`multi-location ${width}`)
    assert.ok(await evaluate(text("2 paėmimo vietos → Kaunas")))
    assert.ok(await evaluate(text("2 automobiliai")))
    await screenshot(`multi-location-${width}`)

    if (width === 390 || width === 1280) {
      await visit("/messages/active-prebooking-demo-001")
      await screenshot(`active-${width}`)
      await visit("/messages")
      await screenshot(`inbox-${width}`)
    }
    console.log(`PASS ${width}px: inbox, active, Booking-linked, archived and multi-location states; no overflow`)
  }

  for (const [source, destination] of [
    ['/messages', '/messages/active-prebooking-demo-001'],
    ['/messages/active-prebooking-demo-001', '/requests/marketplace-demo-001'],
    ['/messages/booking-winning-demo-001', '/bookings/transport-demo-001'],
  ]) {
    await visit(source)
    await evaluate(`document.querySelector('a[href="${destination}"]').focus()`)
    await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' })
    await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 })
    await until(`location.pathname === ${JSON.stringify(destination)}`)
  }

  await visit("/requests/booked-demo-001")
  assert.equal(await evaluate("document.querySelector('a[href=\"/messages/booking-winning-demo-001\"]')?.textContent.trim()"), "Rašyti vežėjui")
  assert.equal(await evaluate("document.querySelector('a[href=\"/messages/booking-losing-demo-001\"]')?.textContent.trim()"), "Peržiūrėti pokalbį")
  await visit("/offers/updated-offer-demo-001-offer-1")
  assert.equal(await evaluate("document.querySelector('a[href=\"/messages/updated-offer-demo-001\"]')?.textContent.trim()"), "Rašyti vežėjui")

  const unknownStatus = await evaluate(`fetch(${JSON.stringify(`${base}/messages/unknown-conversation`)}, { redirect: 'manual' }).then(response => response.status)`)
  assert.equal(unknownStatus, 404)
  assert.deepEqual(exceptions, [])
  console.log(`PASS P07/P08 links, unknown 404 and no runtime exceptions. Screenshots: ${artifacts}`)
} finally {
  await send("Browser.close").catch(() => {})
  socket.close()
  chrome.kill()
}
