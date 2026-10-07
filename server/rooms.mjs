import {validRun,BODIES} from '../public/action-engine.js';
import {cleanPlayerName,coopChoiceContext} from '../public/coop-state.js';
const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const random=(length)=>Array.from(crypto.getRandomValues(new Uint8Array(length)),n=>alphabet[n%alphabet.length]).join('');
const token=()=>crypto.randomUUID()+crypto.randomUUID();
const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),n=>n.toString(16).padStart(2,'0')).join('');
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
const db=env=>{if(!env.DB)throw Error('Online rooms are unavailable. Please try again shortly.');return env.DB;};
async function body(request){if(Number(request.headers.get('content-length')??0)>140000)throw Error('Room update is too large.');const raw=await request.text();if(raw.length>140000)throw Error('Room update is too large.');const value=JSON.parse(raw);if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid room update.');return value;}
const safeInput=input=>{if(!input||typeof input!=='object'||!Number.isFinite(input.x??0)||!Number.isFinite(input.y??0)||Math.abs(input.x??0)>1||Math.abs(input.y??0)>1)throw Error('Invalid movement.');if(input.morph!=null&&!Object.hasOwn(BODIES,input.morph))throw Error('Invalid vessel.');if(input.fire!==undefined&&typeof input.fire!=='boolean'||input.fireMode!==undefined&&!['auto','manual','surge'].includes(input.fireMode))throw Error('Invalid fire input.');if(input.power!==undefined&&typeof input.power!=='boolean')throw Error('Invalid vessel power.');if(input.active!==undefined&&typeof input.active!=='boolean')throw Error('Invalid input presence.');if(input.interact!==undefined&&typeof input.interact!=='boolean'||input.fallAck!==undefined&&(!Number.isSafeInteger(input.fallAck)||input.fallAck<0||input.fallAck>1000000))throw Error('Invalid rescue input.');let stream;if(input.stream!=null){const b=input.stream;if(typeof b.epoch!=='string'||b.epoch.length>80||typeof b.context!=='string'||b.context.length>120||!Array.isArray(b.frames)||b.frames.length>240)throw Error('Invalid input ticks.');let last=0;stream={epoch:b.epoch,context:b.context,frames:b.frames.map(f=>{if(!Number.isSafeInteger(f.tick)||f.tick<1||last&&f.tick!==last+1||f.stream)throw Error('Invalid input tick sequence.');last=f.tick;return {...safeInput(f),tick:f.tick};})};}return {...(stream?{stream}:{}),x:input.x??0,y:input.y??0,fire:!!input.fire,fireMode:input.fireMode??'auto',dash:!!input.dash,interact:!!input.interact,power:!!input.power,morph:input.morph??null,active:input.active??true,...(input.fallAck!==undefined?{fallAck:input.fallAck}:{})};};
function safeAck(a){return a&&typeof a.epoch==='string'&&a.epoch.length<=80&&typeof a.context==='string'&&a.context.length<=120&&Number.isSafeInteger(a.tick)&&a.tick>=0?{epoch:a.epoch,context:a.context,tick:a.tick}:null;}
function publicRoom(row,role){const now=Date.now(),hostAge=Math.max(0,now-row.host_seen),inputAge=Math.max(0,now-row.guest_seen),input=JSON.parse(row.input);return {code:row.code,role,closed:!!row.closed,hostOnline:hostAge<6500,guestOnline:!!row.guest_hash&&inputAge<6500,hostAgeMs:hostAge,inputAgeMs:inputAge,guestForm:row.guest_form,seq:row.host_seq,inputSeq:row.guest_seq,input,...JSON.parse(row.snapshot)};}
export async function handleRoomRequest(request,env){
 try{
  const url=new URL(request.url),parts=url.pathname.split('/').filter(Boolean),code=parts[2],action=parts[3];
  if(request.method!=='POST')return json({error:'Use POST for room actions.'},405);
  const origin=request.headers.get('origin');if(origin&&origin!==url.origin)return json({error:'Cross-origin room updates are not allowed.'},403);
  const input=await body(request),now=Date.now(),database=db(env);
  if(!code){
   if(!validRun(input.run)||input.run.room!=='threshold'||input.run.time!==0||input.run.partner)throw Error('Start a fresh life before hosting.');
   const secret=token(),hash=await digest(secret);let roomCode;
   for(let attempt=0;attempt<4;attempt++){roomCode=random(8);try{await database.prepare('INSERT INTO rooms (code,host_hash,created,expires,host_seen,snapshot) VALUES (?,?,?,?,?,?)').bind(roomCode,hash,now,now+7200000,now,JSON.stringify({run:input.run,paused:true,waiting:true,crew:{host:cleanPlayerName(input.name,'Player 1'),guest:null,vote:null}})).run();break;}catch(error){if(attempt===3)throw error;}}
   // Small bounded cleanup; no request ever scans or deletes an active room.
   await database.prepare('DELETE FROM rooms WHERE code IN (SELECT code FROM rooms WHERE expires < ? LIMIT 10)').bind(now).run();
   return json({code:roomCode,token:secret,role:'host'},201);
  }
  if(!/^[A-HJ-NP-Z2-9]{8}$/.test(code))return json({error:'Enter an eight-character room code.'},400);
  let row=await database.prepare('SELECT * FROM rooms WHERE code = ?').bind(code).first();
  if((!row||row.expires<now||row.closed)&&action==='resume')return json({expired:true});
  if(!row||row.expires<now||row.closed)return json({error:'That room has ended or expired.'},404);
  if(action==='join'){
   if(row.guest_hash)return json({error:'This two-player room is full.'},409);
   if(now-row.host_seen>20000)return json({error:'The host is offline. Ask them to reopen the room.'},409);
   if(!BODIES[input.form])throw Error('Choose a known body.');
   const secret=token(),hash=await digest(secret);
   const result=await database.prepare("UPDATE rooms SET guest_hash=?,guest_seen=?,guest_form=?,guest_seq=0,input=?,snapshot=json_set(snapshot,'$.crew.guest',?,'$.crew.vote',NULL) WHERE code=? AND guest_hash IS NULL AND closed=0").bind(hash,now,input.form,'{}',cleanPlayerName(input.name,'Player 2'),code).run();
   if(result.meta.changes!==1)return json({error:'Someone else joined this room. It is now full.'},409);
   return json({code,token:secret,role:'guest'},201);
  }
  const secret=request.headers.get('authorization')?.replace(/^Bearer /,'');if(!secret||secret.length>200)return json({error:'Room credential required.'},401);
  const hash=await digest(secret),role=hash===row.host_hash?'host':hash===row.guest_hash?'guest':null;
  if(!role)return json({error:'That room credential is not valid.'},403);
  if(action==='leave'){
   if(role==='host')await database.prepare('UPDATE rooms SET closed=1 WHERE code=? AND host_hash=?').bind(code,hash).run();
   else await database.prepare("UPDATE rooms SET guest_hash=NULL,guest_form=NULL,guest_seen=0,input=?,guest_seq=0,snapshot=json_set(snapshot,'$.crew.guest',NULL,'$.crew.vote',NULL) WHERE code=? AND guest_hash=?").bind('{}',code,hash).run();
   return json({left:true});
  }
  if(action==='pulse'){const data=publicRoom(row,role);if(role==='guest')return json(data);delete data.run;return json({...data,partial:true});}
  if(action==='sync'||action==='input'){
   if(action==='input'&&role!=='guest')return json({error:'Only the guest sends input ticks.'},403);
   if(!Number.isSafeInteger(input.seq)||input.seq<1)throw Error('Invalid update sequence.');
   if(role==='host'){
    if(!validRun(input.run))throw Error('The host sent an invalid game state.');
    const snapshot=JSON.stringify({run:input.run,paused:!!input.paused,waiting:!!input.waiting,rescueWaiting:!!input.rescueWaiting,controlAck:safeAck(input.controlAck),presence:{active:input.presence?.active!==false,moving:!!input.presence?.moving,channeling:!!input.presence?.channeling,holding:!!input.presence?.holding},voteReceipt:input.voteReceipt&&typeof input.voteReceipt.context==='string'&&input.voteReceipt.context.length<200&&Number.isInteger(input.voteReceipt.index)&&input.voteReceipt.index>=0&&input.voteReceipt.index<3?{context:input.voteReceipt.context,index:input.voteReceipt.index}:null});
    // Preserve authenticated names and the guest's advisory vote atomically,
    // including when a host sync and a join/name change arrive together.
    await database.prepare("UPDATE rooms SET host_seq=?,snapshot=json_set(?,'$.crew',COALESCE(json_extract(snapshot,'$.crew'),json(?))),host_seen=? WHERE code=? AND host_hash=? AND host_seq < ?").bind(input.seq,snapshot,JSON.stringify({host:'Player 1',guest:row.guest_hash?'Player 2':null,vote:null}),now,code,hash,input.seq).run();
   }else{
    const movement=safeInput(input.input);
    await database.prepare('UPDATE rooms SET guest_seq=?,input=?,guest_seen=? WHERE code=? AND guest_hash=? AND guest_seq < ?').bind(input.seq,JSON.stringify(movement),now,code,hash,input.seq).run();
   }
   row=await database.prepare('SELECT * FROM rooms WHERE code=?').bind(code).first();
   if(action==='input')return json({inputSeq:row.guest_seq});
  }else if(action==='resume'){
   // Reload retains the room and its credentials, but releases any held input.
   if(role==='host')await database.prepare('UPDATE rooms SET host_seen=? WHERE code=? AND host_hash=?').bind(now,code,hash).run();
   else await database.prepare('UPDATE rooms SET guest_seen=?,input=? WHERE code=? AND guest_hash=?').bind(now,JSON.stringify({x:0,y:0,active:false}),code,hash).run();
   if(cleanPlayerName(input.name))await database.prepare(`UPDATE rooms SET snapshot=json_set(snapshot,'$.crew.${role}',?) WHERE code=?`).bind(cleanPlayerName(input.name),code).run();
   row=await database.prepare('SELECT * FROM rooms WHERE code=?').bind(code).first();
  }else if(action==='name'){
   await database.prepare(`UPDATE rooms SET snapshot=json_set(snapshot,'$.crew.${role}',?) WHERE code=?`).bind(cleanPlayerName(input.name,role==='host'?'Player 1':'Player 2'),code).run();
   row=await database.prepare('SELECT * FROM rooms WHERE code=?').bind(code).first();
  }else if(action==='vote'){
   if(role!=='guest')return json({error:'Only the guest sends an advisory vote.'},403);
   const context=coopChoiceContext(JSON.parse(row.snapshot).run);
   if(!context||input.context!==context||!Number.isInteger(input.index)||input.index<0||input.index>2)return json({error:'That choice has already changed. Choose a current card.'},409);
   const current=JSON.parse(row.snapshot).run;
   const result=await database.prepare("UPDATE rooms SET snapshot=json_set(snapshot,'$.crew.vote',json(?),'$.crew.voteRevision',COALESCE(json_extract(snapshot,'$.crew.voteRevision'),0)+1) WHERE code=? AND guest_hash=? AND json_extract(snapshot,'$.run.seed')=? AND json_extract(snapshot,'$.run.room')=? AND json_extract(snapshot,'$.run.phase')=? AND json_extract(snapshot,'$.run.level')=? AND COALESCE(json_extract(snapshot,'$.run.choices'),'[]')=? AND COALESCE(json_array_length(snapshot,'$.run.roomResolved'),0)=?").bind(JSON.stringify({context,index:input.index}),code,hash,current.seed,current.room,current.phase,current.level,JSON.stringify(current.choices??[]),(current.roomResolved??[]).length).run();
   if(result.meta.changes!==1)return json({error:'That choice has already changed. Choose a current card.'},409);
   row=await database.prepare('SELECT * FROM rooms WHERE code=?').bind(code).first();
  }else return json({error:'Unknown room action.'},404);
  return json(publicRoom(row,role));
 }catch(error){console.error('room request',error.message);return json({error:error.message.includes('Online rooms')?error.message:/^(Invalid|Choose|Start|Room update)/.test(error.message)?error.message:'The room could not connect. Please try again.'},400);}
}
