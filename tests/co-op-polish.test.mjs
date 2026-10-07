import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import * as A from '../public/action-engine.js';
import {OnlineRoom} from '../public/online.js';
import {cleanPlayerName,coopChoiceContext,currentCoopVote} from '../public/coop-state.js';
import {handleRoomRequest} from '../server/rooms.mjs';

test('gate crossing enforces identical contact for both actors, without moving a distant or fallen partner',()=>{
 for(const guest of [false,true]){
  const run=A.createRun(A.createMeta(),'spark',124);A.addPartner(run,'human');
  run.room='glass';run.cleared.push('glass');const gate=A.exitPosition('east'),actor=guest?run.partner:run.player,other=guest?run.player:run.partner;
  Object.assign(actor,gate);Object.assign(other,{x:gate.x-150,y:gate.y});
  assert.equal(A.gateStatus(run,'east').available,true);
  const before=JSON.stringify(run);assert.throws(()=>A.enterGate(run,'east',actor),/Partner must be near/);assert.equal(JSON.stringify(run),before);
  A.stepRun(run,guest?{partner:{interact:true}}:{interact:true},1/60);assert.equal(run.room,'glass');assert.match(run.notice,/Partner must be near/);
  Object.assign(other,{x:gate.x-65,y:gate.y,hp:0});assert.throws(()=>A.enterGate(run,'east',actor),/Rekindle your partner/);assert.equal(run.room,'glass');
  other.hp=other.maxHp;A.enterGate(run,'east',actor);assert.equal(run.room,'machine');assert.ok(A.validRun(run));
 }
});

test('guest drawing projection follows real movement and collision while leaving combat and the save untouched',()=>{
 const run=A.createRun(A.createMeta(),'spark',124);A.addPartner(run,'tree');run.room='machine';run.cleared.push('machine');
 for(const start of [{x:480,y:300},{x:230,y:150},{x:900,y:300}]){
  Object.assign(run.partner,start);const before=JSON.stringify(run),projected=A.projectMovement(run,run.partner,'tree',{x:1,y:1},.12),actual=structuredClone(run);
  for(let i=0;i<6;i++)A.stepRun(actual,{partner:{x:1,y:1}},.02);
  assert.ok(Math.hypot(projected.x-actual.partner.x,projected.y-actual.partner.y)<1);
  assert.equal(JSON.stringify(run),before);assert.deepEqual(A.projectMovement(run,run.partner,'tree',{x:1,y:1},10),projected,'prediction cannot keep moving indefinitely');
 }
});

test('guest press and release packets bypass poll delay and serialize a release that arrives during a slow request',async()=>{
 let time=1000;const packets=[],respond=[];
 const room=new OnlineRoom(()=>{},assert.fail,{now:()=>time,fetch:async(path,options)=>{const packet=JSON.parse(options.body);packets.push(packet);return new Promise(resolve=>respond.push(()=>resolve(Response.json({inputSeq:packet.seq}))));}});
 room.session={code:'ABCDEFGH',role:'guest',token:'test-only'};
 for(const duration of [17,50,85]){
  room.input({x:1,y:0});room.pump();const pressed=room.inFlight;assert.equal(packets.at(-1).input.x,1);
  time+=duration;room.input({x:0,y:0});room.pump();assert.equal(room.busy,true);
  respond.shift()();await pressed;assert.equal(packets.at(-1).input.x,0,'latest release is sent immediately after the held packet');
  const released=room.inFlight;respond.shift()();await released;
  const count=packets.length;time++;room.input({x:0,y:0});room.pump();assert.equal(packets.length,count,'steady held state does not flood the relay');
 }
 assert.equal(room.busy,false);assert.equal(room.pending.x,0);
});

test('advisory votes and display names are bounded and a vote cannot follow a choice into a different room',()=>{
 assert.equal(cleanPlayerName('  Mr. FL  '),'Mr. FL');assert.equal(cleanPlayerName('Mav\u202eerick'),'Maverick');assert.equal(cleanPlayerName('<Maverick>'),'Maverick');assert.equal(Array.from(cleanPlayerName('✨'.repeat(30))).length,24);
 const run=A.createRun(A.createMeta(),'spark',124);run.phase='boon';run.choices=['edge','cadence','orbit'];
 const context=coopChoiceContext(run),crew={vote:{context,index:1}};assert.equal(currentCoopVote(run,crew).index,1);
 run.room='glass';assert.equal(currentCoopVote(run,crew),null);run.room='threshold';run.level++;assert.equal(currentCoopVote(run,crew),null);
});

test('pre-patch rooms adopt names and choice votes survive heartbeat races but reject changed choices',async()=>{
 const sqlite=new DatabaseSync(':memory:');sqlite.exec(fs.readFileSync(new URL('../drizzle/0000_famous_swarm.sql',import.meta.url),'utf8'));
 let interleave=null;
 const DB={prepare(sql){let values=[];return {bind(...v){values=v;return this;},async first(){return sqlite.prepare(sql).get(...values)??null;},async run(){if(interleave&&sql.includes("snapshot=json_set(snapshot,'$.crew.vote',json(?)")){const change=interleave;interleave=null;sqlite.exec(change==='heartbeat'?"UPDATE rooms SET host_seq=host_seq+1":"UPDATE rooms SET snapshot=json_set(snapshot,'$.run.level',json_extract(snapshot,'$.run.level')+1)");}return {meta:{changes:Number(sqlite.prepare(sql).run(...values).changes)}};}};}};
 const send=(path,body,token)=>handleRoomRequest(new Request('http://local/api/rooms'+path,{method:'POST',headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})},body:JSON.stringify(body)}),{DB});
 try{
  const run=A.createRun(A.createMeta(),'spark',124),host=await (await send('',{run})).json();
  sqlite.prepare("UPDATE rooms SET snapshot=json_remove(snapshot,'$.crew') WHERE code=?").run(host.code);
  const guest=await (await send('/'+host.code+'/join',{form:'tree',name:'Maverick'})).json();
  let response=await send('/'+host.code+'/name',{name:'Mr. FL'},host.token);assert.equal(response.status,200);
  run.phase='boon';run.choices=['edge','cadence','orbit'];await send('/'+host.code+'/sync',{run,seq:1,paused:false},host.token);
  interleave='heartbeat';response=await send('/'+host.code+'/vote',{context:coopChoiceContext(run),index:2},guest.token);assert.equal(response.status,200);
  response=await send('/'+host.code+'/sync',{run,seq:3,paused:true},host.token);const state=await response.json();
  assert.equal(state.crew.host,'Mr. FL');assert.equal(state.crew.guest,'Maverick');assert.equal(state.crew.vote.index,2);assert.deepEqual(state.run,run);
  response=await send('/'+host.code+'/vote',{context:coopChoiceContext(run),index:1},host.token);assert.equal(response.status,403);
  response=await send('/'+host.code+'/resume',{name:'Maverick'},guest.token);assert.equal(response.status,200);assert.deepEqual((await response.json()).run,run);
  interleave='choice';response=await send('/'+host.code+'/vote',{context:coopChoiceContext(run),index:0},guest.token);assert.equal(response.status,409,'an actual choice change during the vote is rejected');
 }finally{sqlite.close();}
});
