// Run after prepare-phase5-review.mjs against the local app on port 3000.
// Header regression: independent managed Auth sessions; no Booking mutations.
import assert from 'node:assert/strict'
import { spawn, execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createServerClient } from '@supabase/ssr'
import { sql, acting, literal } from './marketplace-local.mjs'

const base = process.env.NOTIFICATIONS_BASE_URL ?? 'http://127.0.0.1:3002'
const review = JSON.parse(readFileSync('supabase/.temp/notifications-auto-review.json','utf8'))
const local = JSON.parse(execFileSync(process.execPath, ['node_modules/supabase/dist/supabase.js', 'status', '--output', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }))
assert.equal(local.API_URL, 'http://127.0.0.1:54321')
async function cookies(email) {
  const response = await fetch(`${local.API_URL}/auth/v1/admin/generate_link`, { method: 'POST', headers: { apikey: local.SERVICE_ROLE_KEY, Authorization: `Bearer ${local.SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'magiclink', email }) })
  assert.ok(response.ok)
  const link = await response.json()
  const verified = await fetch(`${local.API_URL}/auth/v1/verify`, { method: 'POST', headers: { apikey: local.ANON_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'magiclink', token_hash: link.hashed_token }) })
  assert.ok(verified.ok)
  const values = []
  const client = createServerClient(local.API_URL, local.ANON_KEY, { cookies: { getAll: () => [], setAll: rows => values.push(...rows) } })
  assert.equal((await client.auth.setSession(await verified.json())).error, null)
  return values.map(row => ({ name: row.name, value: row.value, url: base, path: '/', httpOnly: false, secure: false, sameSite: 'Lax' }))
}
const chromePath = process.env.CHROME_PATH ?? (process.platform === 'win32'
  ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  : process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : 'google-chrome')
const chrome = spawn(chromePath, ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=0', `--user-data-dir=${mkdtempSync(path.join(tmpdir(), 'phase5-browser-'))}`, 'about:blank'], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] })
const endpoint = await new Promise((resolve, reject) => { chrome.on('error', reject); chrome.stderr.on('data', chunk => { const match = String(chunk).match(/DevTools listening on (ws:\/\/\S+)/); if (match) resolve(match[1]) }) })
const socket = new WebSocket(endpoint)
await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }))
let sequence = 0
const pending = new Map(), errors = []
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data)
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails)
  if (message.id) { const p = pending.get(message.id); pending.delete(message.id); message.error ? p.reject(message.error) : p.resolve(message.result) }
})
const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params, sessionId })) })
async function tab(email) {
  const { browserContextId } = await send('Target.createBrowserContext')
  const { targetId } = await send('Target.createTarget', { url: 'about:blank', browserContextId })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
  await send('Page.enable', {}, sessionId); await send('Runtime.enable', {}, sessionId)
  if (email) await send('Network.setCookies', { cookies: await cookies(email) }, sessionId)
  return sessionId
}
async function evaluate(session, expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, session)
  if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails))
  return r.result.value
}
async function until(session, expression) {
  for (let i = 0; i < 150; i++) { if (await evaluate(session, expression)) return; await new Promise(resolve => setTimeout(resolve, 200)) }
  throw Error(`Timed out: ${expression}\n${await evaluate(session, 'document.body.innerText')}`)
}
async function visit(session, url) {
  await send('Page.navigate', { url: base + url }, session)
  await until(session, `location.pathname === ${JSON.stringify(url.split('?')[0])} && document.readyState === 'complete' && !!document.querySelector('main h1')`)
}
const header = 'header nav[aria-label="Pagrindinė navigacija"]'
async function ready(session, label) {
  await until(session, `document.querySelector(${JSON.stringify(header)})?.innerText.includes(${JSON.stringify(label)})`)
}
async function shot(session, name) {
  mkdirSync('supabase/.temp/notifications-screens', {recursive:true})
  const result = await send('Page.captureScreenshot', {format:'png',captureBeyondViewport:false}, session)
  writeFileSync(`supabase/.temp/notifications-screens/${name}.png`, Buffer.from(result.data,'base64'))
}
const cards = '[data-notification-id]'
const unread = '[data-notification-read="false"]'
const clickButton = (session, text) => evaluate(session, `[...document.querySelectorAll('main button')].find(b=>b.textContent.trim()===${JSON.stringify(text)}).click()`)
async function go(session) {
 await visit(session,'/notifications?view=empty')
 await until(session, `document.querySelectorAll('${cards}').length>0`)
}
try {
 const customer=await tab('notifications-auto-customer@example.test')
 const carrier=await tab('notifications-auto-carrier@example.test')
 await go(customer)
 const expected=Number(sql(`select count(*) from app.notifications where recipient_id=${literal(review.customer)}`))
 assert.equal(await evaluate(customer,`document.querySelectorAll('${cards}').length`),expected)
 for(const width of [390,768,1280,1440]) {
  await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false},customer)
  assert.equal(await evaluate(customer,'document.documentElement.scrollWidth>innerWidth'),false)
  await shot(customer,`customer-${width}`)
 }
 // Use stored canonical links for all three entity kinds and verify read state on reload.
 for(const kind of ['offer','conversation','booking']) {
  const n=JSON.parse(sql(`select row_to_json(n) from app.notifications n where recipient_id=${literal(review.customer)} and entity_type=${literal(kind)} order by created_at,id limit 1`))
  await evaluate(customer,`document.querySelector('[data-notification-id="${n.id}"] a').click()`)
  await until(customer,`location.pathname===${JSON.stringify(n.href)} && document.readyState==='complete' && !!document.querySelector('main h1')`)
  await go(customer)
  assert.equal(await evaluate(customer,`document.querySelector('[data-notification-id="${n.id}"]').dataset.notificationRead`),'true')
  assert.equal(sql(`select read_at is not null from app.notifications where id=${literal(n.id)}`),'t')
 }
 await clickButton(customer,'Neperskaityti')
 assert.equal(await evaluate(customer,`document.querySelectorAll('[data-notification-read="true"]').length`),0)
 await clickButton(customer,'Visi')
 // Failed RPC must not claim success or erase unread state.
 const before=await evaluate(customer,`document.querySelectorAll('${unread}').length`)
 await send('Network.enable',{},customer)
 await send('Network.setBlockedURLs',{urls:['*mark_notifications_read*']},customer)
 await clickButton(customer,'Pažymėti visus kaip perskaitytus')
 await until(customer,"!!document.querySelector('main [role=alert]')")
 assert.equal(await evaluate(customer,`document.querySelectorAll('${unread}').length`),before)
 await send('Network.setBlockedURLs',{urls:[]},customer)
 await clickButton(customer,'Pažymėti visus kaip perskaitytus')
 await until(customer,`document.querySelectorAll('${unread}').length===0`)
 await go(customer)
 assert.equal(await evaluate(customer,`document.querySelectorAll('${unread}').length`),0)
 await clickButton(customer,'Neperskaityti')
 await until(customer,"document.body.innerText.includes('Visus pranešimus perskaitėte')")
 // A later real message appears only after refresh; realtime remains deferred.
 const actor={id:review.carrierUser,session:sql(`select id from auth.sessions where user_id=${literal(review.carrierUser)} order by created_at desc limit 1`)}
 sql(acting(actor,`select api.send_message(${literal(review.pending.conversation)},'New message after mark-all',gen_random_uuid())`))
 await go(customer)
 assert.equal(await evaluate(customer,`document.querySelectorAll('${unread}').length`),1)
 await go(carrier)
 assert.equal(await evaluate(carrier,`document.querySelectorAll('${cards}').length`),Number(sql(`select count(*) from app.notifications where recipient_id=${literal(review.carrierUser)}`)))
 assert.ok(await evaluate(carrier,`document.querySelectorAll('${unread}').length>0`))
 for(const width of [390,1440]) {
  await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false},carrier)
  assert.equal(await evaluate(carrier,'document.documentElement.scrollWidth>innerWidth'),false)
  await shot(carrier,`carrier-${width}`)
 }
 const empty=await tab('notifications-auto-empty@example.test')
 await visit(empty,'/notifications?view=demo')
 await until(empty,"document.body.innerText.includes('Pranešimų nėra')")
 assert.equal(await evaluate(empty,`document.querySelectorAll('${cards}').length`),0)
 const anonymous=await tab()
 await send('Page.navigate',{url:base+'/notifications'},anonymous)
 await until(anonymous,"location.pathname==='/login'")
 assert.deepEqual(errors,[])
 console.log('PASS: real Customer/Carrier feeds, own read state, filters, mark-one/all, failure retry, reload, new event, stored Offer/Chat/Booking hrefs, empty/anonymous isolation, 390/768/1280/1440 layouts')
} finally { socket.close(); chrome.kill() }
