import { test } from "node:test"
import assert from "node:assert/strict"
import { registerHooks } from "node:module"
import { pathToFileURL } from "node:url"
import path from "node:path"
registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) return nextResolve(pathToFileURL(path.resolve(import.meta.dirname,"../src",`${specifier.slice(2)}.ts`)).href,context)
  try { return nextResolve(specifier,context) } catch(error) {
    if(specifier.startsWith(".") && !path.extname(specifier)) return nextResolve(`${specifier}.ts`,context)
    throw error
  }
} })
const { requestPayload, publicationPhone } = await import("../src/features/public/request-persistence/payload.ts")
const { publicationContinuation } = await import("../src/features/public/request-persistence/continuation.ts")
const { persistedRequestSummary } = await import("../src/features/public/request-persistence/summary.ts")
const { createRequestDraft, addRequestVehicle } = await import("../src/features/public/create-request/logic.ts")
const { mockLocations } = await import("../src/lib/mock/locations.ts")
function draft() {
  const value = createRequestDraft(new URLSearchParams("from=hamburg-de&to=kaunas-lt"))
  value.contact = { name:"Owner",email:"contact@example.test",phone:"+370 600 00999" }
  value.termsAccepted = true
  value.privateDetails = { pickup:"PRIVATE pickup",delivery:"PRIVATE delivery" }
  value.vehicles = addRequestVehicle(value.vehicles, mockLocations[1], mockLocations[4]).map((v,i)=>({...v,
    category:i ? "motorcycle":"car",make:i ? "Yamaha":"VW",model:i ? "MT-07":"Golf",condition:i ? "non-running":"running",rolls:i ? "yes":"", usesDefaultRoute: !i }))
  return value
}
test("payload uses canonical categories, conditions, locations and optional budget without authority fields",()=>{
  const value=draft(); value.budgetAmount=750.5; value.budgetCurrency="EUR"
  const payload=requestPayload(value)
  assert.equal(payload.phone,"+37060000999")
  assert.equal(payload.vehicles.length,2)
  assert.equal(payload.vehicles[1].condition,"non_running")
  assert.equal(payload.vehicles[1].pickup,"berlin-de")
  assert.equal(payload.vehicles[1].uses_default_route,false)
  assert.equal(payload.private_pickup,"PRIVATE pickup")
  assert.equal(payload.budget_amount,750.5)
  for(const field of ["customer_id","status","request_version","published_at"]) assert.equal(payload[field],undefined)
  assert.equal(payload.vehicles[0].id,undefined)
  assert.equal(payload.vehicles[0].photos,undefined)
})
test("adapter rejects unconfirmed terms, photos and demo targets without dropping draft state",()=>{
  const value=draft();value.termsAccepted=false
  assert.throws(()=>requestPayload(value));value.termsAccepted=true
  value.vehicles[0].photos=[new File(["bytes"],"local.jpg",{type:"image/jpeg"})]
  assert.throws(()=>requestPayload(value),/Nuotrauk/)
  assert.equal(value.vehicles[0].photos.length,1)
  value.vehicles[0].photos=[];value.target.requested=true
  assert.throws(()=>requestPayload(value),/demonstracinis/)
  assert.throws(()=>publicationPhone("37060000999"))
})
test("calendar adapter sends date-only values and leaves flexible resolution to database",()=>{
  const value=draft(); value.route.date={type:"single",date:new Date(2027,0,5)}
  assert.deepEqual(requestPayload(value).pickup,{kind:"single",from:"2027-01-05",to:"2027-01-05"})
  value.route.date={type:"flexible",option:"next-week"}
  assert.deepEqual(requestPayload(value).pickup,{kind:"flexible",option:"next-week"})
})
test("OTP failure cannot publish; verified continuation preserves and publishes original payload",async()=>{
  const payload=requestPayload(draft());const calls=[];let reject=true
  const flow=publicationContinuation(payload,"key",{
    identity:async()=>null,challenge:async(...args)=>calls.push(["challenge",...args]),
    verify:async()=>{if(reject) throw new Error("invalid code")},
    publish:async(value,key)=>{calls.push(["publish",value,key]);return "request-id"},
  })
  assert.deepEqual(await flow.start(),{challenge:"sms"})
  await assert.rejects(flow.verify("000000"));assert.equal(calls.length,1)
  reject=false;payload.private_pickup="changed outside pending action"
  assert.deepEqual(await flow.verify("123456"),{id:"request-id"})
  assert.equal(calls[1][1].private_pickup,"PRIVATE pickup")
})
test("email-authenticated user attaches phone to same account; verified user resumes directly",async()=>{
  for(const verified of [false,true]) {
    const calls=[]
    const flow=publicationContinuation(requestPayload(draft()),"key",{
      identity:async()=>verified ? {phone:"37060000999",phone_confirmed_at:"now"}: {},
      challenge:async(phone,kind)=>calls.push(kind),verify:async()=>{},publish:async()=>{calls.push("publish");return "id"},
    })
    await flow.start();assert.deepEqual(calls,verified ? ["publish"]:["phone_change"])
  }
})
test("network-uncertain publication retries identical key/payload, prevents concurrent duplicates",async()=>{
  const calls=[];let attempts=0
  const flow=publicationContinuation(requestPayload(draft()),"stable-key",{
    identity:async()=>({phone:"37060000999",phone_confirmed_at:"now"}),challenge:async()=>{},verify:async()=>{},
    publish:async(value,key)=>{calls.push([value,key]);if(!attempts++) throw new Error("network");return "id"},
  })
  await assert.rejects(flow.start());assert.equal(flow.attempted,true)
  const retry=flow.start();await assert.rejects(flow.start(),/Palaukite/);await retry
  assert.deepEqual(calls[0],calls[1]);assert.deepEqual(await flow.start(),{id:"id"});assert.equal(calls.length,2)
})
test("real P06 adapter reuses multi-location summary and excludes private data",()=>{
  const locations=mockLocations.map(p=>({id:p.id,city:p.city,country_name:p.country,country_code:p.countryCode,latitude:p.lat,longitude:p.lng}))
  const input=requestPayload(draft())
  const request={id:"real-id",status:"active",published_at:"now",visibility:"marketplace",pickup_kind:"anytime",
    default_pickup_location_id:input.from,default_delivery_location_id:input.to,notes:"PRIVATE notes"}
  const vehicles=input.vehicles.map((v,i)=>({...v,id:`uuid-${i}`,position:i+1,pickup_location_id:v.pickup,delivery_location_id:v.delivery}))
  const summary=persistedRequestSummary(request,vehicles,locations)
  assert.equal(summary.route,"Kelių vietų pervežimas");assert.equal(summary.vehicleCount,2)
  assert.equal(summary.locationCount,4);assert.equal(summary.date,"Bet kada")
  assert.ok(!JSON.stringify(summary).includes("PRIVATE"))
  const shared=vehicles.map(v=>({...v,delivery_location_id:input.to}))
  assert.equal(persistedRequestSummary(request,shared,locations).route,"2 paėmimo vietos → Kaunas")
  assert.throws(()=>persistedRequestSummary({...request,status:"draft"},vehicles,locations))
})
