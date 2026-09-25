// Local-only integration bootstrap; never imported by application code.
import { execFileSync, spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
export const literal = value => `'${String(value).replaceAll("'","''")}'`
export const sql = query => execFileSync('docker',['exec','-i','supabase_db_traliukas','psql','-X','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-Atq'],{input:query,encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim()
export const sqlAsync = query => new Promise(resolve => {
 const p=spawn('docker',['exec','-i','supabase_db_traliukas','psql','-X','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-Atq'],{stdio:['pipe','pipe','pipe']})
 let out='',err='';p.stdout.on('data',c=>out+=c);p.stderr.on('data',c=>err+=c);p.on('close',code=>resolve({code,out:out.trim(),err}));p.stdin.end(query)
})
export const day = n => {const d=new Date();d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)}
export const claims = a => `set local role authenticated; set local request.jwt.claims=${literal(JSON.stringify({sub:a.id,session_id:a.session}))};`
export const acting = (a,query) => `begin; ${claims(a)} ${query}; commit;`
export const terms = () => ({total_price:500,currency:'EUR',planned_pickup_date:day(31),planned_delivery_date:day(33),payment_terms:'Payment on delivery',expires_at:new Date(Date.now()+86400000).toISOString(),carrier_comment:'Local complete transport Offer'})
export function seedMarketplace(existingActors) {
 const run=randomUUID().slice(0,8)
 const actors=existingActors ?? Array.from({length:4},(_,i)=>({id:randomUUID(),session:randomUUID(),phone:`3706${String(Math.floor(Math.random()*1e7)).padStart(7,'0')}`,email:`phase4-${run}-${i}@example.test`}))
 if(!existingActors) sql(`begin; ${actors.map(a=>`insert into auth.users(id,email,phone,phone_confirmed_at) values(${literal(a.id)},${literal(a.email)},${literal(a.phone)},now()); insert into auth.sessions(id,user_id) values(${literal(a.session)},${literal(a.id)});`).join('\n')} commit;`)
 sql(`begin; update app.profiles set beta_access=true,display_name='Phase 4 review' where id in (${actors.map(a=>literal(a.id)).join(',')}); insert into app.audit_log(actor_id,action,entity_type,entity_id,correlation_id,reason,change_summary) select id,'profile.beta_access','profile',id,gen_random_uuid(),'Local Phase 4 test admission','{"beta_access":true}' from app.profiles where id in (${actors.map(a=>literal(a.id)).join(',')}); commit;`)
 const carriers=actors.slice(1,3).map((a,i)=>{
   const id=sql(acting(a,`select api.create_carrier(${literal(`phase4-${run}-${i}`)},${literal(`Phase 4 Carrier ${run}-${i}`)},'Legal test identity',${literal(i===0?'individual':'company')},'LT')`))
   sql(`begin; update app.carriers set visibility='published' where id=${literal(id)}; insert into app.carrier_verifications(carrier_id,category,status,reviewed_by,reviewed_at,expires_at) values(${literal(id)},${literal(i===0?'identity':'company')},'approved',${literal(actors[3].id)},now(),now()+interval '60 days'); insert into app.audit_log(actor_id,action,entity_type,entity_id,correlation_id,reason,change_summary) values(${literal(actors[3].id)},'carrier.updated','carrier',${literal(id)},gen_random_uuid(),'Local Phase 4 explicit Carrier admission','{"fields":["visibility"]}'); commit;`)
   const route=sql(acting(a,`select api.save_route(${literal(JSON.stringify({stops:['hamburg-de','berlin-de','kaunas-lt'],date_from:day(30),date_to:day(35),capacity_total:2,supported_categories:['car'],supports_non_running:true,route_flexible:true,accepting_new_requests:true}))}::jsonb,true,null,null,${literal(randomUUID())})`))
   return {id,route,owner:a}
 })
 function publish(customer=actors[0]) {
   const phone=sql(`select phone_e164 from app.profiles where id=${literal(customer.id)}`)
   const payload={name:'Phase 4 Customer',email:customer.email,phone,terms_version:'2026-09-24',from:'hamburg-de',to:'kaunas-lt',pickup:{kind:'anytime'},notes:'Complete local test transport',private_pickup:'PRIVATE pickup instruction',vehicles:[
     {category:'car',make:'Volkswagen',model:'Golf',year:2020,condition:'running',pickup:'hamburg-de',delivery:'kaunas-lt',uses_default_route:true},
     {category:'car',make:'Toyota',model:'Corolla',year:2021,condition:'non_running',rolling_ability:'yes',pickup:'berlin-de',delivery:'kaunas-lt',uses_default_route:false},
   ]}
   return sql(acting(customer,`select api.publish_request(${literal(JSON.stringify(payload))}::jsonb,${literal(randomUUID())})`))
 }
 function offer(request,index=0) {
   const c=carriers[index]
   return sql(acting(c.owner,`select api.submit_offer(${literal(request)},${literal(c.route)},${literal(JSON.stringify(terms()))}::jsonb,1,1)`))
 }
 return {run,actors,carriers,publish,offer}
}
