// Phase 3 local managed Auth -> Carrier UI -> PostgreSQL -> public discovery.
import assert from "node:assert/strict"
import { spawn, execFileSync } from "node:child_process"
import { mkdir, mkdtemp, writeFile, readFile } from "node:fs/promises"
import path from "node:path"
import { tmpdir } from "node:os"

const base = process.env.PHASE3_BASE_URL ?? "http://127.0.0.1:3001"
if (!['127.0.0.1','localhost'].includes(new URL(base).hostname)) throw new Error('Local browser test only')
const localAuth = JSON.parse(await readFile(new URL('../supabase/.temp/local-phone-auth.json',import.meta.url),'utf8'))
if (!/^\+[1-9][0-9]{7,14}$/.test(localAuth.phone) || !/^[0-9]{6}$/.test(localAuth.token)) throw new Error('Invalid local test configuration')
const profile = await mkdtemp(path.join(tmpdir(), "phase3-chrome-"))
const artifacts = path.resolve(".next/phase3-review")
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
  await screenshot("failure")
  console.log(await evaluate(`({path:location.pathname,buttons:[...document.querySelectorAll("main button")].map(b=>({text:b.textContent,disabled:b.disabled})),invalid:[...document.querySelectorAll(":invalid")].map(e=>e.id)})`))
  const alert = await evaluate(`document.querySelector('[role="alert"]')?.textContent ?? ""`)
  throw new Error(`Timed out: ${expression}; UI alert: ${alert}`)
}
const visit = async query => {
  await cdp("Page.navigate", { url: `${base}/${query}` })
  await until("document.readyState === 'complete' && !!document.querySelector('h1')")
  await pause(600)
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
  await evaluate(`(() => { const el = document.getElementById(${JSON.stringify(id)}); const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); })()`)
  await pause(100)
}
const sql = query => execFileSync('docker',['exec','supabase_db_traliukas','psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-At','-c',query],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim()
const digits=localAuth.phone.slice(1)
const date = days => { const d=new Date(); d.setDate(d.getDate()+days);return d.toISOString().slice(0,10) }
async function fillRoute() {
  await fill('route-stop-0','hamburg-de'); await fill('route-stop-1','kaunas-lt')
  await click('Pridėti sustojimą'); await fill('route-stop-1','berlin-de')
  await fill('route-date-from',date(30)); await fill('route-date-to',date(35)); await fill('route-capacity','3')
  await evaluate(`document.getElementById('category-motorcycle').click(); document.getElementById('route-non-running').click(); document.getElementById('route-flexible').click()`)
}
try {
  await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:1,mobile:false})
  await visit('carrier/routes/new')
  await until('document.getElementById("carrier-phone") !== null')
  await fill('carrier-phone',localAuth.phone); await click('Gauti kodą')
  await until('document.getElementById("carrier-otp") !== null')
  sql(`begin;
    update app.profiles set beta_access=true where phone_e164='+${digits}';
    insert into app.audit_log(action,entity_type,entity_id,correlation_id,reason,change_summary)
      select 'profile.beta_access','profile',id,gen_random_uuid(),'Local Phase 3 browser admission','{"beta_access":true}'::jsonb from app.profiles where phone_e164='+${digits}';
    insert into app.carriers(slug,display_name,description,visibility,registration_country) values
      ('phase3-browser-carrier','Phase 3 Browser Carrier','Local persisted Carrier route review.','published','LT')
      on conflict(slug) do update set visibility='published',suspended_at=null;
    insert into app.carrier_memberships(carrier_id,user_id,role)
      select c.id,p.id,'owner' from app.carriers c cross join app.profiles p where c.slug='phase3-browser-carrier' and p.phone_e164='+${digits}'
      on conflict(carrier_id,user_id) do update set active=true;
    insert into app.carrier_private_details(carrier_id,legal_name,business_kind,registration_country,street,contact_email)
      select id,'PRIVATE legal identity','individual','LT','PRIVATE street','private-carrier@example.test' from app.carriers where slug='phase3-browser-carrier'
      on conflict(carrier_id) do nothing;
    insert into app.audit_log(action,entity_type,entity_id,correlation_id,reason,change_summary)
      select 'carrier.updated','carrier',id,gen_random_uuid(),'Local Phase 3 explicit Carrier admission','{"fields":["visibility","owner","legal_profile"]}'::jsonb from app.carriers where slug='phase3-browser-carrier';
    commit;`)
  await fill('carrier-otp',localAuth.token); await click('Prisijungti')
  await until('document.getElementById("route-stop-0") !== null')
  await fillRoute()
  await click('Išsaugoti juodraštį')
  await until('location.pathname.startsWith("/carrier/routes/") && location.pathname.split("/").at(-1).length === 36')
  await until(hasText('Juodraštis išsaugotas'))
  const managementPath=await evaluate('location.pathname')
  const routeId=managementPath.split('/').at(-1)
  assert.match(routeId,/^[0-9a-f-]{36}$/)
  assert.equal((await fetch(`${base}/routes/${routeId}`)).status,404,'draft private')
  await visit(managementPath.slice(1))
  assert.equal(await evaluate('document.getElementById("route-capacity").value'),'3')
  assert.equal(await evaluate('document.getElementById("route-stop-1").value'),'berlin-de')
  assert.equal(await evaluate('document.getElementById("route-flexible").checked'),true)
  await click('Paskelbti maršrutą')
  await until(hasText('Maršrutas paskelbtas'))
  assert.equal(sql(`select capacity_reserved from app.carrier_routes where id='${routeId}'`),'0')
  assert.equal(sql(`select count(*) from app.route_revisions where route_id='${routeId}'`),'1')
  const carrierId=sql(`select carrier_id from app.carrier_routes where id='${routeId}'`)
  const publicPath=`routes/${routeId}`
  const search=`search?from=hamburg-de&to=kaunas-lt&vehicleCount=3`
  for (const width of [390,768,1280,1440]) {
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false})
    for (const page of [managementPath.slice(1),'carrier/routes',search,publicPath,`carriers/${carrierId}`]) {
      await visit(page)
      await overflow(`${page} ${width}`)
      assert.equal(await evaluate('document.body.innerText.includes("PRIVATE") || document.body.innerText.includes("private-carrier@example.test")'),false)
      if (page===search || page===`carriers/${carrierId}`) assert.ok(await evaluate(`!!document.querySelector('a[href="/${publicPath}"]')`),'real route link')
      if (page===publicPath) {
        assert.ok(await evaluate(hasText('Berlin')))
        assert.ok(await evaluate(hasText('Phase 3 Browser Carrier')))
        assert.equal(await evaluate(hasText('Patvirtintas vežėjas')),false,'beta admission never verification')
        await screenshot(`route-${width}`)
      }
      if (page===managementPath.slice(1)) await screenshot(`manage-${width}`)
    }
  }
  await visit(search+'&vehicle=van')
  assert.equal(await evaluate(`!!document.querySelector('a[href="/${publicPath}"]')`),false,'unsupported category excluded')
  await visit('search?from=kaunas-lt&to=hamburg-de')
  assert.equal(await evaluate(`!!document.querySelector('a[href="/${publicPath}"]')`),false,'flexibility does not reverse ordered route')
  await visit('search?from=hamburg-de&to=kaunas-lt&vehicleCount=4')
  assert.equal(await evaluate(`!!document.querySelector('a[href="/${publicPath}"]')`),false,'complete count does not fit')
  await visit(managementPath.slice(1)); await fill('route-capacity','4'); await click('Išsaugoti pakeitimus')
  await until('document.querySelector("form button[type=submit]")?.textContent === "Išsaugoti pakeitimus"')
  await pause(400); await visit(managementPath.slice(1))
  assert.equal(await evaluate('document.getElementById("route-capacity").value'),'4','edit survives reload')
  assert.equal(sql(`select route_version from app.carrier_routes where id='${routeId}'`),'2')
  await evaluate('document.getElementById("route-accepting").click()'); await click('Išsaugoti pakeitimus'); await pause(500)
  await visit(search)
  assert.equal(await evaluate(`!!document.querySelector('a[href="/${publicPath}"]')`),false,'paused supply excluded from Search')
  assert.equal((await fetch(`${base}/${publicPath}`)).status,200,'paused route remains directly public')
  await visit(managementPath.slice(1))
  await evaluate('window.confirm = () => true'); await click('Uždaryti maršrutą')
  await until(hasText('Maršrutas uždarytas'))
  assert.equal((await fetch(`${base}/${publicPath}`)).status,404,'closed route not public')
  assert.equal((await fetch(`${base}/routes/ffffffff-ffff-ffff-ffff-ffffffffffff`)).status,404,'unknown real ID not found')
  // A second route proves atomic create+publish and remains for human review.
  await visit('carrier/routes/new'); await fillRoute(); await click('Paskelbti maršrutą')
  await until('location.pathname.startsWith("/carrier/routes/") && location.pathname.split("/").at(-1).length === 36')
  await until(hasText('Maršrutas paskelbtas'))
  const reviewId=await evaluate('location.pathname.split("/").at(-1)')
  await visit(`routes/${reviewId}`); await cdp('Page.reload'); await until(hasText('Phase 3 Browser Carrier'))
  assert.equal((await fetch(`${base}/routes/${reviewId}`)).status,200,'anonymous real detail')
  assert.deepEqual(exceptions,[],'no runtime exceptions')
  await writeFile(path.join(artifacts,'result.json'),JSON.stringify({routeId:reviewId,carrierId,widths:[390,768,1280,1440]},null,2))
  console.log(`Phase 3 browser PASS: ${base}/routes/${reviewId}; ${base}/carriers/${carrierId}`)
} finally { socket.close(); chrome.kill() }
