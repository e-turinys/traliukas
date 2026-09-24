// Production P05 browser checks without an additional package dependency.
import assert from "node:assert/strict"
import { spawn, execFileSync } from "node:child_process"
import { mkdir, mkdtemp, writeFile, readFile } from "node:fs/promises"
import path from "node:path"
import { tmpdir } from "node:os"

const base = process.env.P05_BASE_URL ?? "http://127.0.0.1:3000"
if (!['127.0.0.1','localhost'].includes(new URL(base).hostname)) throw new Error('Local browser test only')
const localAuth = JSON.parse(await readFile(new URL('../supabase/.temp/local-phone-auth.json',import.meta.url),'utf8'))
if (!/^\+[1-9][0-9]{7,14}$/.test(localAuth.phone) || !/^[0-9]{6}$/.test(localAuth.token)) throw new Error('Invalid local test configuration')
const profile = await mkdtemp(path.join(tmpdir(), "p05-chrome-"))
const artifacts = path.resolve(".next/phase2-review")
await mkdir(artifacts, { recursive: true })
const chrome = spawn(process.env.CHROME_PATH ?? "/usr/bin/google-chrome", [
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
  const alert = await evaluate(`document.querySelector('[role="alert"]')?.textContent ?? ""`)
  throw new Error(`Timed out: ${expression}; UI alert: ${alert}`)
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
try {
  await cdp('Emulation.setDeviceMetricsOverride', {width:390,height:900,deviceScaleFactor:1,mobile:false})
  await visit('request/new?from=hamburg-de&to=kaunas-lt')
  await fill('request-pickup','PRIVATE browser pickup instructions')
  await fill('request-delivery','PRIVATE browser delivery instructions')
  await click('Toliau')
  await radio('request-vehicle-1-category',0)
  await fill('request-vehicle-1-make','VW')
  await fill('request-vehicle-1-model','Golf')
  await radio('request-vehicle-1-condition',0)
  await click('+ Pridėti kitą automobilį')
  await radio('request-vehicle-2-category',3)
  await fill('request-vehicle-2-make','Yamaha')
  await fill('request-vehicle-2-model','MT-07')
  await radio('request-vehicle-2-condition',0)
  await evaluate(`[...document.querySelectorAll('button')].filter(el=>el.textContent.trim()==='Keisti šio automobilio maršrutą')[1].click()`)
  await choose('request-vehicle-2-pickupLocation','Berlin')
  await choose('request-vehicle-2-deliveryLocation','Vilnius')
  await click('Toliau')
  await click('Toliau')
  await fill('request-name','Local Browser Customer')
  await fill('request-phone',localAuth.phone)
  await fill('request-email','local-browser@example.test')
  await evaluate('document.getElementById("request-terms").click()')
  await click('Tęsti telefono patvirtinimą')
  await until(hasText('Patvirtinkite kontaktus ir paskelbkite užklausą.'))
  await click('Tęsti ir paskelbti')
  await until('document.getElementById("request-otp") !== null')
  // Explicit local-only beta admission after Auth creates the shell. Never a browser/admin key.
  const digits=localAuth.phone.slice(1)
  execFileSync('docker',['exec','supabase_db_traliukas','psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-c',
    `begin; update app.profiles set beta_access=true where phone_e164='+${digits}';
     insert into app.audit_log(action,entity_type,entity_id,correlation_id,reason,change_summary)
     select 'profile.beta_access','profile',id,gen_random_uuid(),'Local browser test admission','{"beta_access":true}'::jsonb
     from app.profiles where phone_e164='+${digits}'; commit;`],{stdio:['ignore','pipe','pipe']})
  await fill('request-otp',localAuth.token)
  await click('Patvirtinti ir paskelbti')
  await until('location.pathname.endsWith("/published")')
  await until(hasText('Užklausa paskelbta'))
  assert.ok(await evaluate(hasText('Kelių vietų pervežimas')))
  assert.ok(await evaluate(hasText('Yamaha MT-07')))
  assert.equal(await evaluate('document.body.innerText.includes("PRIVATE")'),false)
  await overflow('real P06 mobile')
  const publishedPath=await evaluate('location.pathname')
  assert.match(publishedPath,/^\/request\/[0-9a-f-]{36}\/published$/)
  await cdp('Page.reload')
  await until(hasText('Užklausa paskelbta'))
  await screenshot('real-p06-mobile')
  await cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false})
  await overflow('real P06 desktop')
  await screenshot('real-p06-desktop')
  const anon=await fetch(`${base}${publishedPath}`)
  assert.equal(anon.status,404,'anonymous cannot load the owner success page')
  const missing=await fetch(`${base}/request/ffffffff-ffff-ffff-ffff-ffffffffffff/published`)
  assert.equal(missing.status,404,'unknown real ID is not a fixture')
  assert.deepEqual(exceptions,[])
  console.log('PASS: local P05 → managed phone OTP → atomic multi-location publication → real P06 and reload; anonymous/unknown IDs denied')
} finally {
  await send('Browser.close').catch(()=>{})
  socket.close(); chrome.kill()
}
