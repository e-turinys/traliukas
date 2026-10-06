// Run after prepare-phase5-review.mjs against the local app on port 3000.
// Consumes only automation* Bookings; leaves lifecycle/cancellation for humans.
import assert from 'node:assert/strict'
import { spawn, execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createServerClient } from '@supabase/ssr'
import { sql, literal, day } from './marketplace-local.mjs'

const base = 'http://127.0.0.1:3000'
const review = JSON.parse(readFileSync('supabase/.temp/phase5-review.json', 'utf8'))
const f = review.automationLifecycle, c = review.automationCancellation
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
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=0', `--user-data-dir=${mkdtempSync(path.join(tmpdir(), 'phase5-browser-'))}`, 'about:blank'], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] })
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
  await send('Network.setCookies', { cookies: await cookies(email) }, sessionId)
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
const button = label => `[...document.querySelectorAll('main button')].find(b => b.textContent.trim() === ${JSON.stringify(label)})`
const click = async (session, label) => { await until(session, `!!(${button(label)})`); await evaluate(session, `${button(label)}.click()`) }
async function fill(session, name, value) {
  await evaluate(session, `(()=>{const input=document.querySelector('input[name='+CSS.escape(${JSON.stringify(name)})+']');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));})()`)
}
const current = label => `document.querySelector('li[aria-current="step"]')?.textContent.includes(${JSON.stringify(label)})`
async function widths(session, name) {
  mkdirSync('supabase/.temp/phase5-screens', { recursive: true })
  for (const width of [390, 768, 1280, 1440]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false }, session)
    assert.equal(await evaluate(session, 'document.documentElement.scrollWidth > innerWidth'), false, `${name}: ${width} overflow`)
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }, session)
    writeFileSync(`supabase/.temp/phase5-screens/${name}-${width}.png`, Buffer.from(shot.data, 'base64'))
  }
}
try {
  const carrier = await tab('phase5-windows-carrier@example.test'), customer = await tab('phase5-windows-customer@example.test')
  if (!process.argv.includes('--cancel-only')) {
  await visit(carrier, `/bookings/${f.booking}`); await until(carrier, `!!(${button('Suplanuoti paėmimą')})`)
  await widths(carrier, 'schedule')
  await visit(customer, `/bookings/${f.booking}`)
  assert.equal(await evaluate(customer, `!!(${button('Suplanuoti paėmimą')})`), false)
  for (const name of await evaluate(carrier, "[...document.querySelectorAll('main input[name]')].map(i=>i.name)")) {
    const value = name.endsWith('scheduled_from') ? `${day(31)}T10:00` : name.endsWith('scheduled_to') ? `${day(31)}T12:00` : name.endsWith('contact_phone') ? '+37062557545' : name.endsWith('street') ? 'Review street 12' : 'Review contact'
    await fill(carrier, name, value)
  }
  await click(carrier, 'Suplanuoti paėmimą'); await until(carrier, current('Paėmimas suplanuotas'))
  await widths(carrier, 'scheduled')
  for (const [action, label] of [['Pažymėti paėmimą', 'Automobiliai paimti'], ['Pradėti vežimą', 'Vežama'], ['Pažymėti pristatymą', 'Pristatyta']]) {
    await click(carrier, action); await until(carrier, current(label))
    assert.equal(await evaluate(carrier, `!!(${button('Atšaukti pervežimą')})`), false)
  }
  assert.equal(await evaluate(carrier, `!!(${button('Patvirtinti, kad automobiliai gauti')})`), false)
  await visit(customer, `/bookings/${f.booking}`); await until(customer, current('Pristatyta'))
  await click(customer, 'Patvirtinti, kad automobiliai gauti')
  await until(customer, "!!document.querySelector('[role=alertdialog]')")
  await widths(customer, 'completion')
  await evaluate(customer, "[...document.querySelectorAll('[role=alertdialog] button')].find(b=>b.textContent==='Patvirtinti gavimą').click()")
  await until(customer, current('Pervežimas užbaigtas'))
  await visit(customer, `/bookings/${f.booking}`); await until(customer, current('Pervežimas užbaigtas'))
  await visit(customer, '/dashboard?tab=history')
  await until(customer, `document.querySelectorAll('main a[href="/bookings/${f.booking}"]').length===1`)
  await visit(customer, '/dashboard?tab=transports')
  assert.equal(await evaluate(customer, `document.querySelectorAll('main a[href="/bookings/${f.booking}"]').length`), 0)
  await visit(customer, `/messages/${f.conversation}`)
  await until(customer, "document.body.innerText.includes('istor')")
  assert.equal(await evaluate(customer, "[...document.querySelectorAll('main textarea')].some(i=>!i.disabled)"), false)
  assert.equal(sql(`select capacity_reserved from app.carrier_routes where id=${literal(f.route)}`), '2')
  console.log('PASS: Carrier progression, Customer completion, reload, History placement and terminal Chat; capacity retained')
  }

  await visit(customer, `/bookings/${c.booking}`); await click(customer, 'Atšaukti pervežimą')
  await widths(customer, 'cancellation')
  await fill(customer, 'reason', 'Browser review cancellation')
  assert.equal(await evaluate(customer, "document.querySelector('input[name=reason]').form.checkValidity()"), true, 'cancellation form is valid')
  await click(customer, 'Patvirtinti atšaukimą')
  await until(customer, "document.body.innerText.includes('Pervežimas atšauktas')")
  await visit(customer, `/bookings/${c.booking}`)
  assert.ok(await evaluate(customer, "document.body.innerText.includes('Pervežimas atšauktas')"))
  await visit(customer, `/messages/${c.conversation}`)
  assert.equal(await evaluate(customer, "[...document.querySelectorAll('main textarea')].some(i=>!i.disabled)"), false)
  assert.equal(sql(`select capacity_reserved from app.carrier_routes where id=${literal(c.route)}`), '0')
  await visit(carrier, '/carrier/bookings'); await widths(carrier, 'carrier-bookings')
  assert.ok(await evaluate(carrier, `!!document.querySelector('main a[href="/bookings/${review.lifecycle.booking}"]')`))
  for (const untouched of [review.lifecycle, review.cancellation]) {
    assert.equal(sql(`select status from app.bookings where id=${literal(untouched.booking)}`), 'booked')
    assert.equal(sql(`select capacity_reserved from app.carrier_routes where id=${literal(untouched.route)}`), '2')
  }
  assert.deepEqual(errors, [], 'no browser runtime exceptions')
  console.log('PASS: cancellation, exact capacity release, independent Carrier session, 390/768/1280/1440 layouts; human review Bookings remain Booked')
} finally { socket.close(); chrome.kill() }
