// Production P06 browser checks without an additional package dependency.
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { mkdir, mkdtemp, writeFile } from "node:fs/promises"
import path from "node:path"
import { tmpdir } from "node:os"

const base = process.env.P06_BASE_URL ?? "http://localhost:3000"
const profile = await mkdtemp(path.join(tmpdir(), "p06-chrome-"))
const artifacts = path.resolve(".next/p06-review")
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

const fixtures = [
  ['marketplace-demo-001', 'Hamburg → Kaunas', 1],
  ['targeted-demo-001', 'Hamburg → Kaunas', 1],
  ['targeted-marketplace-demo-001', 'Hamburg → Kaunas', 1],
  ['multi-vehicle-demo-001', 'Hamburg → Kaunas', 2],
  ['multi-location-pickups-demo-001', '2 paėmimo vietos → Kaunas', 2],
  ['multi-location-mixed-demo-001', 'Kelių vietų pervežimas', 2],
]
const text = () => evaluate("document.querySelector('main').innerText")
try {
  for (const width of [390, 768, 1280, 1440]) {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false })
    for (const [id, route, count] of fixtures) {
      await visit(`request/${id}/published`)
      await evaluate('document.fonts.ready.then(() => true)')
      const targeted = id === 'targeted-demo-001'
      assert.equal(await evaluate("document.querySelector('h1').textContent"), targeted ? 'Užklausa išsiųsta vežėjui „Baltijos kelias“' : 'Užklausa paskelbta')
      assert.ok((await text()).includes(route))
      assert.ok((await text()).includes('2026 m. rugs. 15–17 d.'))
      assert.equal(await evaluate("document.querySelectorAll('main ul li').length"), count)
      assert.equal(await evaluate("document.querySelectorAll('main ol li').length"), 3)
      assert.ok((await text()).includes('BMW X5'))
      if (count === 2) assert.ok((await text()).includes('Audi Q5'))
      if (id.includes('pickups')) assert.ok((await text()).includes('Berlin → Kaunas'))
      if (id.includes('mixed')) assert.ok((await text()).includes('Berlin → Vilnius'))
      assert.equal(await evaluate("getComputedStyle(document.querySelector('h1')).fontFamily.includes('Geist')"), true)
      assert.equal(await evaluate("document.querySelector('meta[name=robots]').content"), 'noindex, nofollow')
      assert.ok(!(await text()).match(/SMS|el\. paštu|@|\.jpg|\.png/))
      const primary = `document.querySelector('main a[href="/requests/${id}"]')`
      assert.ok(await evaluate(`${primary} !== null`))
      assert.ok(await evaluate("document.querySelector('main a[href=" + JSON.stringify('/') + "]').getBoundingClientRect().height >= 44"))
      await overflow(`${id} ${width}`)
      const clipped = await evaluate(`Array.from(document.querySelectorAll('main a, main button, main h1, main h2, main h3, main p, main li, main dd')).filter(el => el.clientWidth && getComputedStyle(el).position !== 'absolute' && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)).map(el => el.textContent)`)
      assert.deepEqual(clipped, [], `${id} ${width}`)
      await screenshot(`${id}-${width}`)
      if (targeted) {
        await evaluate("document.querySelector('main button').focus()")
        assert.equal(await evaluate("document.activeElement.tagName"), 'BUTTON')
        await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' })
        await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 })
        await until("document.querySelector('h1').textContent === 'Užklausa paskelbta'")
        assert.ok((await text()).includes('Baltijos kelias ir kiti tinkami vežėjai'))
        assert.equal(await evaluate("document.activeElement.getAttribute('role')"), 'status')
        assert.equal(await evaluate("document.querySelector('main button')"), null)
        await overflow(`expanded ${width}`)
        await screenshot(`expanded-${width}`)
        await visit(`request/${id}/published`)
        assert.ok((await text()).includes('Tik Baltijos kelias'))
      }
      await evaluate(`${primary}.focus()`)
      await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' })
      await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 })
      await until(`location.pathname === '/requests/${id}'`)
      await until("document.querySelector('main').innerText.includes('BMW X5')")
    }
    await visit('request/marketplace-demo-001/published')
    await evaluate("document.querySelector('main a[href=" + JSON.stringify('/') + "]').click()")
    await until("location.pathname === '/'")
    console.log(`PASS ${width}px: six fixtures, summary/date/vehicles, primary navigation, home action, keyboard expansion/reset/focus, no clipping or overflow`)
  }
  const unknown = await fetch(`${base}/request/unknown/published`)
  assert.equal(unknown.status, 404)
  assert.deepEqual(exceptions, [])
  console.log('PASS unknown-ID HTTP 404, no runtime exceptions')
} finally {
  await send('Browser.close').catch(() => {})
  socket.close()
  chrome.kill()
}
