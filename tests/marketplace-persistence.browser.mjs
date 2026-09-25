// Real local managed Auth sessions -> browser -> caller-JWT RPC -> PostgreSQL.
import assert from "node:assert/strict"
import { spawn, execFileSync } from "node:child_process"
import { randomUUID } from "node:crypto"
import { mkdir, mkdtemp, writeFile } from "node:fs/promises"
import path from "node:path"
import { tmpdir } from "node:os"
import { createServerClient } from "@supabase/ssr"
import { seedMarketplace, sql, literal, day, acting } from "./marketplace-local.mjs"
const base=process.env.PHASE4_BASE_URL ?? "http://127.0.0.1:3001"
if(!['127.0.0.1','localhost'].includes(new URL(base).hostname)) throw new Error('Local browser test only')
const local=JSON.parse(execFileSync('npx',['--no-install','supabase','status','--output','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}))
if(!['127.0.0.1','localhost'].includes(new URL(local.API_URL).hostname)) throw new Error('Local Supabase only')
const actors=[]
for(let i=0;i<4;i++) {
 const email=`phase4-browser-${randomUUID()}@example.test`, password=randomUUID()+randomUUID(), phone=`3706${String(Math.floor(Math.random()*1e7)).padStart(7,'0')}`
 const created=await fetch(`${local.API_URL}/auth/v1/admin/users`,{method:'POST',headers:{apikey:local.SERVICE_ROLE_KEY,Authorization:`Bearer ${local.SERVICE_ROLE_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({email,password,phone,email_confirm:true,phone_confirm:true})})
 if(!created.ok) throw new Error('Local managed test-user bootstrap failed')
 const cookies=[]
 const client=createServerClient(local.API_URL,local.ANON_KEY,{cookies:{getAll:()=>[],setAll:values=>cookies.push(...values)}})
 const {data,error}=await client.auth.signInWithPassword({email,password})
 if(error || !data.session) throw new Error('Local managed sign-in failed')
 const payload=JSON.parse(Buffer.from(data.session.access_token.split('.')[1],'base64url').toString())
 actors.push({id:data.user.id,session:payload.session_id,email,phone,cookies})
}
const fixture=seedMarketplace(actors), request=fixture.publish()
const profile = await mkdtemp(path.join(tmpdir(), "phase4-chrome-"))
const artifacts = path.resolve(".next/phase4-review")
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
  for (let index = 0; index < 300; index++) { if (await evaluate(expression)) return; await pause(100) }
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

const hasText = text => `document.querySelector('main')?.innerText.includes(${JSON.stringify(text)})`
const click = async text => {
  await evaluate(`[...document.querySelectorAll('main button')].find(el => el.textContent.trim() === ${JSON.stringify(text)}).click()`)
  await pause(100)
}
const fill = async (id, value) => {
  await evaluate(`(() => { const el = document.getElementById(${JSON.stringify(id)}); const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); })()`)
  await pause(100)
}

async function login(index) {
 await cdp('Network.clearBrowserCookies')
 await cdp('Network.setCookies',{cookies:actors[index].cookies.map(c=>({name:c.name,value:c.value,url:base,path:'/',httpOnly:false,secure:false,sameSite:'Lax'}))})
}
async function widths(label) {
 for(const width of [390,768,1280,1440]) {
  await cdp('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false})
  await pause(150);await overflow(`${label}-${width}`);await screenshot(`${label}-${width}`)
 }
}
const clickAny=async text=>{await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(text)}).click()`);await pause(100)}
let offer,competing,thread,losing,booking
try {
 await login(1)
 await visit(`carrier/requests/${request}`)
 await until('document.getElementById("offer-price") !== null')
 await widths('carrier-offer-form')
 await fill('offer-price','500');await fill('offer-pickup',day(31));await fill('offer-delivery',day(33))
 await fill('offer-validity',`${day(1)}T12:00`);await fill('offer-payment','Payment on delivery');await fill('offer-comment','Complete persisted browser Offer')
 await click('Pateikti pasiūlymą')
 await until('location.pathname.startsWith("/offers/")')
 offer=await evaluate('location.pathname.split("/").at(-1)')
 assert.match(offer,/^[0-9a-f-]{36}$/)
 thread=sql(`select id from app.conversations where current_offer_id=${literal(offer)}`)
 assert.equal(sql(`select capacity_reserved from app.carrier_routes where id=${literal(fixture.carriers[0].route)}`),'0')
 // Revise the real relationship through the same form.
 await visit(`carrier/requests/${request}`);await until('document.getElementById("offer-price") !== null')
 await fill('offer-price','550');await fill('offer-validity',`${day(1)}T12:00`);await click('Atnaujinti pasiūlymą')
 await until(`location.pathname === '/offers/${offer}'`)
 assert.equal(sql(`select current_version from app.offers where id=${literal(offer)}`),'2')
 assert.equal(sql(`select id from app.conversations where current_offer_id=${literal(offer)}`),thread)
 competing=fixture.offer(request,1);losing=sql(`select id from app.conversations where current_offer_id=${literal(competing)}`)
 await visit(`messages/${thread}`);await fill('message-body','Carrier persisted browser message');await click('Siųsti')
 await until(hasText('Carrier persisted browser message'))
 await login(0);await visit(`requests/${request}`)
 await until(hasText('550'));await widths('request-offers')
 await visit(`offers/${offer}`);await widths('offer-detail')
 await visit(`messages/${thread}`);await until(hasText('Carrier persisted browser message'))
 await fill('message-body','Customer persisted browser message');await click('Siųsti');await until(hasText('Customer persisted browser message'))
 await visit(`messages/${thread}`);await until(hasText('Customer persisted browser message'));await widths('conversation')
 await visit(`offers/${offer}`);await click('Priimti pasiūlymą');await until(`document.querySelector('[role="alertdialog"]') !== null`)
 await widths('accept-dialog');await clickAny('Patvirtinti pasirinkimą')
 await until('location.pathname.startsWith("/bookings/")')
 booking=await evaluate('location.pathname.split("/").at(-1)')
 await until(hasText('550'));await widths('booking-detail')
 await visit(`bookings/${booking}`);await until(hasText('550'))
 assert.equal(sql(`select capacity_reserved from app.carrier_routes where id=${literal(fixture.carriers[0].route)}`),'2')
 assert.equal(sql(`select status from app.transport_requests where id=${literal(request)}`),'booked')
 assert.equal(sql(`select status from app.offers where id=${literal(competing)}`),'not_selected')
 await visit('dashboard');await click('Pervežimai')
 await until(`!!document.querySelector('a[href="/bookings/${booking}"]')`)
 await widths('dashboard-transports')
 await visit(`offers/${competing}`)
 assert.equal(await evaluate(`[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Priimti pasiūlymą')`),false)
 await visit(`messages/${losing}`);assert.equal(await evaluate('!!document.getElementById("message-body")'),false)
 await visit(`messages/${thread}`);await fill('message-body','Winning Customer continues');await click('Siųsti');await until(hasText('Winning Customer continues'))
 await login(1);await visit(`messages/${thread}`);await fill('message-body','Winning Carrier continues');await click('Siųsti');await until(hasText('Winning Carrier continues'))
 await visit(`messages/${thread}`);await until(hasText('Winning Carrier continues'))
 await login(3);await visit(`bookings/${booking}`);assert.ok(!(await evaluate('document.body.innerText')).includes('550'))
 assert.equal(exceptions.length,0,JSON.stringify(exceptions))
 const openRequest=fixture.publish()
 const reviewRoute=sql(acting(actors[1],`select api.save_route(${literal(JSON.stringify({stops:['hamburg-de','berlin-de','kaunas-lt'],date_from:day(30),date_to:day(35),capacity_total:2,supported_categories:['car'],supports_non_running:true,route_flexible:true,accepting_new_requests:true}))}::jsonb,true,null,null,${literal(randomUUID())})`))
 const review={base,openRequest,reviewRoute,request,offer,competing,thread,losing,booking,route:fixture.carriers[0].route,customerPhone:actors[0].phone,carrierPhone:actors[1].phone}
 await writeFile('supabase/.temp/phase4-review.json',JSON.stringify(review,null,2)+'\n',{mode:0o600})
 console.log(JSON.stringify({result:'PASS',checks:['Carrier submit/revise','Customer private Offers','both participants send','reload persistence','acceptance','Booking snapshot','exact capacity','booked Request','losing Offer/thread','winning thread','nonparticipant denial','390/768/1280/1440 widths'],review},null,2))
} finally { socket.close();chrome.kill() }
