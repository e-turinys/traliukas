// Run after prepare-phase5-review.mjs against the local app on port 3000.
// Header regression: independent managed Auth sessions; no Booking mutations.
import assert from 'node:assert/strict'
import { spawn, execFileSync } from 'node:child_process'
import { writeFileSync, mkdtempSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createServerClient } from '@supabase/ssr'

const base = 'http://127.0.0.1:3000'
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
  mkdirSync('supabase/.temp/header-auth-screens', {recursive:true})
  const result = await send('Page.captureScreenshot', {format:'png',captureBeyondViewport:false}, session)
  writeFileSync(`supabase/.temp/header-auth-screens/${name}.png`, Buffer.from(result.data,'base64'))
}
try {
  for (const role of ['anonymous','customer','carrier']) {
    const session = await tab(role==='anonymous'?undefined:`phase5-windows-${role}@example.test`)
    const label = role==='anonymous'?'Prisijungti':role==='carrier'?'Mano pervežimai':'Mano užklausos'
    const href = role==='carrier'?'/carrier/bookings':'/dashboard'
    await visit(session, '/')
    await ready(session,label)
    for (const width of [1440,390]) {
      await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false},session)
      if(width===390) {
        await evaluate(session, "document.querySelector('button[aria-label=\"Atidaryti navigaciją\"]').click()")
        await until(session, "!!document.querySelector('nav[aria-label=\"Mobilioji navigacija\"]')")
      }
      if(width===390) await until(session, "(()=>{const s=document.querySelector('[data-slot=sheet-content]');return s && !s.hasAttribute('data-starting-style') && getComputedStyle(s).opacity==='1' && s.getAnimations().every(a=>a.playState==='finished')})()")
      const selector = width===390?'nav[aria-label="Mobilioji navigacija"]':header
      const nav = await evaluate(session, `document.querySelector(${JSON.stringify(selector)}).innerText`)
      assert.ok(nav.includes(label))
      assert.equal(nav.includes('Prisijungti'),role==='anonymous')
      assert.equal(nav.includes('Atsijungti'),role!=='anonymous')
      assert.equal(await evaluate(session,'document.documentElement.scrollWidth > innerWidth'),false)
      await shot(session,`${role}-${width}`)
      if(width===390) {
        if(role!=='anonymous') {
          await evaluate(session, `document.querySelector(${JSON.stringify(selector)}).querySelector('a[href="${href}"]').click()`)
          await until(session, `location.pathname===${JSON.stringify(href)} && !document.querySelector('[data-slot=sheet-content]')`)
          await ready(session,label)
        } else await evaluate(session,"document.querySelector('[data-slot=sheet-content] button[data-slot=sheet-close]').click()")
      }
    }
    if(role!=='anonymous') {
      // Customer logout on desktop; Carrier logout in the mobile sheet.
      const mobile = role==='carrier'
      await send('Emulation.setDeviceMetricsOverride',{width:mobile?390:1440,height:900,deviceScaleFactor:1,mobile:false},session)
      if(mobile) {
        await evaluate(session, "document.querySelector('button[aria-label=\"Atidaryti navigaciją\"]').click()")
        await until(session, "!!document.querySelector('nav[aria-label=\"Mobilioji navigacija\"]')")
      }
      const selector = mobile?'nav[aria-label="Mobilioji navigacija"]':header
      await evaluate(session, `[...document.querySelector(${JSON.stringify(selector)}).querySelectorAll('button')].find(b=>b.textContent==='Atsijungti').click()`)
      await until(session,"location.pathname==='/' && document.readyState==='complete'")
      await ready(session,'Prisijungti')
      const {cookies: remaining} = await send('Network.getCookies',{urls:[base]},session)
      assert.equal(remaining.some(c=>/sb-.*-auth-token/.test(c.name)),false,'session cookies cleared')
      await visit(session,href)
      await ready(session,'Prisijungti')
      assert.equal(await evaluate(session,"document.querySelectorAll('main a[href^=\"/bookings/\"]').length"),0,'no private Bookings after logout')
    }
    console.log(`PASS ${role}: desktop/mobile header, navigation${role==='anonymous'?'':', logout, cleared cookies and private-page isolation'}`)
  }
  assert.deepEqual(errors,[],'no browser runtime exceptions')
} finally { socket.close(); chrome.kill() }
