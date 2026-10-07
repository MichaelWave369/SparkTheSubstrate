import * as Table from '../public/table-engine.js';
import * as Keepsakes from '../public/substrate-rewards.js';
import * as Expansion from '../public/world-expansion.js';
import * as Rematches from '../public/boss-rematch.js';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {KEYS,doorId} from '../public/exploration.js';
import * as Gear from '../public/equipment.js';
import {ProgressSave} from '../public/progress.js';
import * as A from '../public/action-engine.js';
import * as Worlds from '../public/worlds.js';
import * as Mastery from '../public/mastery.js';
import * as Records from '../public/run-record.js';
import * as Settings from '../public/settings.js';
import * as Entry from '../public/entry.js';
import * as CombatView from '../public/combat-view.js';
import * as Dungeon from '../public/dungeon.js';
import {DuelScreen} from '../public/duel-view.js';
import {saveRunCard} from '../public/share-run.js';
import {recordArrival,recordDecision} from '../public/story.js';
import {handleRoomRequest} from '../server/rooms.mjs';
import {OnlineRoom} from '../public/online.js';
import {ui as uiHarness} from './ui-harness.mjs';
const enemy=(kind,x,y)=>({id:55,kind,x,y,r:17,hp:300,maxHp:300,speed:60,attack:0,orbitHit:0,flash:0,windup:0,charge:0,chargeX:0,chargeY:0,shield:0});
function simulation(){const run=A.createRun(A.createMeta(),'spark',54);run.player.attackClock=100;run.player.iframes=100;return run;}
test('story arrivals and decisions are retained across lives without duplicate arrivals',()=>{const run=simulation();assert.equal(run.journal.length,1);run.room='machine';recordArrival(run);recordArrival(run);assert.equal(run.journal.length,2);recordDecision(run,0);assert.match(run.journal.at(-1).title,/Release SIX/);run.phase='dead';const meta=A.settleRun(run,A.createMeta());assert.equal(meta.journal.length,3);assert.ok(A.validMeta(meta));});
test('four new enemy types have distinct telegraphed behaviors',()=>{
 const hound=simulation();hound.enemies=[enemy('hound',240,390)];A.stepRun(hound,{},1/60);assert.ok(hound.enemies[0].windup>0);for(let i=0;i<45;i++)A.stepRun(hound,{},1/60);assert.ok(hound.enemies[0].charge>0);
 const mirror=simulation();mirror.enemies=[enemy('mirror',240,390)];A.stepRun(mirror,{},1/60);assert.equal(mirror.enemies[0].shield,1);assert.equal(mirror.shots.filter(s=>s.enemy).length,2);
 const spore=simulation();spore.enemies=[enemy('spore',240,390)];A.stepRun(spore,{},1/60);assert.equal(spore.marks.length,1);assert.equal(spore.marks[0].damage,15);
 const oracle=simulation();oracle.enemies=[enemy('oracle',240,390)];A.stepRun(oracle,{},1/60);assert.equal(oracle.enemies.filter(e=>e.kind==='collector').length,2);assert.equal(oracle.spawned,0);
});
test('partner movement, weapons, shared gifts and either-player revival use the same engine',()=>{
 const run=simulation();A.addPartner(run,'computer');run.partner.attackClock=100;const x=run.partner.x;A.stepRun(run,{partner:{x:1}},1/60);assert.ok(run.partner.x>x);assert.equal(run.player.x,480);
 run.partner.attackClock=0;run.enemies=[enemy('collector',run.partner.x+100,run.partner.y)];A.stepRun(run,{},1/60);assert.equal(run.shots.filter(s=>!s.enemy).length,3);
 run.phase='boon';run.choices=['shell'];const old=run.partner.maxHp;A.chooseBoon(run,'shell');assert.equal(run.partner.maxHp,old+25);
 run.partner.hp=0;run.player.x=run.partner.x-20;run.enemies=[];run.shots=[];for(let i=0;i<115;i++)A.stepRun(run,{interact:true},1/60);assert.ok(run.partner.hp>0);assert.equal(run.phase,'playing');
 run.player.hp=0;run.player.x=run.partner.x-20;for(let i=0;i<115;i++)A.stepRun(run,{partner:{interact:true}},1/60);assert.ok(run.player.hp>0);assert.ok(A.validRun(run));
 const before=structuredClone(run);assert.throws(()=>A.stepRun(run,{partner:{x:NaN}},1/60));assert.deepEqual(run,before);
});
test('a partner can cross a gate and both vessels arrive in the same chamber',()=>{const run=simulation();A.addPartner(run,'animal');Object.assign(run.partner,A.exitPosition('north'));run.player.x=480;run.player.y=100;A.stepRun(run,{partner:{interact:true}},1/60);assert.equal(run.room,'glass');assert.ok([run.player,run.partner].every(p=>Math.hypot(p.x-480,p.y-569)>120),'arrival leaves both sparks inside the chamber, beyond return-gate contact');assert.equal(run.spawnTotal,Math.round(A.ENCOUNTERS.glass.total*1.3));});
function binding(sqlite){return {prepare(sql){let values=[];return {bind(...v){values=v;return this;},async first(){return sqlite.prepare(sql).get(...values)??null;},async run(){const result=sqlite.prepare(sql).run(...values);return {meta:{changes:Number(result.changes)}};}};}};}
async function service(){const sqlite=new DatabaseSync(':memory:');sqlite.exec(fs.readFileSync(new URL('../drizzle/0000_famous_swarm.sql',import.meta.url),'utf8'));const env={DB:binding(sqlite)};const server=http.createServer(async(req,res)=>{try{let raw='';for await(const part of req)raw+=part;const request=new Request('http://127.0.0.1:'+server.address().port+req.url,{method:req.method,headers:req.headers,body:raw||undefined});const response=await handleRoomRequest(request,env);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(await response.text());}catch(e){res.writeHead(500);res.end(e.message);}});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;return {sqlite,fetcher:(path,options)=>fetch(base+path,options),close:async()=>{await new Promise(resolve=>server.close(resolve));sqlite.close();}};}
test('two independent online clients share live inputs and authoritative combat over HTTP',async()=>{
 const serviceInstance=await service();let run=simulation(),hostData,guestData;
 const host=new OnlineRoom(data=>{hostData=data;if(data.guestForm&&!run.partner)A.addPartner(run,data.guestForm);},message=>assert.fail(message),{fetch:serviceInstance.fetcher});
 const guest=new OnlineRoom(data=>guestData=data,message=>assert.fail(message),{fetch:serviceInstance.fetcher});
 try{
  host.setSource(()=>({run,paused:false,waiting:!run.partner}));await host.host(run);host.stop();await guest.join(host.code,'animal');guest.stop();
  await host.sync();assert.ok(run.partner);guest.input({x:1,y:0,dash:true,interact:false});await guest.sync();await host.sync();assert.equal(hostData.input.x,1);assert.equal(hostData.input.dash,true);
  const initial=run.partner.x;for(let i=0;i<20;i++)A.stepRun(run,{partner:{...hostData.input,dash:i===0}},1/60);await host.sync();await guest.sync();assert.ok(guestData.run.partner.x>initial);assert.deepEqual(guestData.run,run);
  run.enemies=[enemy('collector',run.partner.x+35,run.partner.y)];run.partner.attackClock=0;for(let i=0;i<60;i++)A.stepRun(run,{},1/60);await host.sync();await guest.sync();assert.deepEqual(guestData.run.enemies,run.enemies);assert.deepEqual(guestData.run.shots,run.shots);
  const resume=await guest.request('/'+guest.code+'/resume');assert.equal(resume.role,'guest');assert.deepEqual(resume.run,run);assert.equal(resume.token,undefined);assert.equal(resume.hostHash,undefined);
  const stale=await guest.request('/'+guest.code+'/sync',{seq:1,input:{x:-1,y:0}});assert.equal(stale.input.x,0); // resume releases held input; a late packet cannot restore it
  const unauthorized=await serviceInstance.fetcher('/api/rooms/'+host.code+'/sync',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer wrong'},body:JSON.stringify({seq:200,run})});assert.equal(unauthorized.status,403);
  const third=await serviceInstance.fetcher('/api/rooms/'+host.code+'/join',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({form:'spark'})});assert.equal(third.status,409);
  await guest.leave();await host.sync();assert.equal(hostData.guestOnline,false);await host.leave();
 }finally{host.stop();guest.stop();await serviceInstance.close();}
});
test('room expiry and competing joins are enforced by the database',async()=>{const instance=await service();const send=(path,data)=>instance.fetcher('/api/rooms'+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});try{const created=await (await send('',{run:simulation()})).json();const joins=await Promise.all([send('/'+created.code+'/join',{form:'tree'}),send('/'+created.code+'/join',{form:'rock'})]);assert.deepEqual(joins.map(r=>r.status).sort(),[201,409]);instance.sqlite.prepare('UPDATE rooms SET expires=0 WHERE code=?').run(created.code);assert.equal((await send('/'+created.code+'/join',{form:'tree'})).status,404);}finally{await instance.close();}});

test('host and guest UI flows join the same room and render the guest’s own vessel',async()=>{
 const {default:vm}=await import('node:vm');const {FORMS,validateSave}=await import('../public/engine.js');const {CHAMBER_STORIES,ENEMY_LORE}=await import('../public/story.js');const instance=await service();
 function ui(){return uiHarness(null,{roomOptions:{fetch:instance.fetcher}});}
 const host=ui(),guest=ui();try{
  host.el('online-form').value='spark';await host.run("onlineAction('online-host')");assert.equal(host.run('online.role'),'host');const code=host.run('online.code');assert.equal(code.length,8);
  guest.el('online-form').value='computer';guest.el('online-code').value=code;await guest.run("onlineAction('online-join')");await host.run('online.sync()');await host.run('online.sync()');await guest.run('online.sync()');assert.equal(host.run('run.partnerForm'),'computer');assert.equal(guest.el('form-name').textContent,'Computer');assert.equal(host.run('onlineWaiting'),false);assert.equal(guest.run('onlineWaiting'),false);
  guest.run("keys.add('d');animate(16)");await guest.run('online.sync()');await host.run('online.sync()');const before=host.run('run.partner.x');host.run('for(let i=1;i<=50;i++)animate(i*16.67)');assert.ok(host.run('run.partner.x')>before);await host.run('online.sync()');await guest.run('online.sync()');assert.equal(guest.run('run.partner.x'),host.run('run.partner.x'));
  host.run("run.abilities.push('morph')");await host.run('online.sync()');await guest.run('online.sync()');guest.run("act('morph',{form:'tree'})");await guest.run('online.sync()');await host.run('online.sync()');host.run('animate(875)');assert.equal(host.run('run.partnerForm'),'tree');await host.run('online.sync()');await host.run('online.sync()');await guest.run('online.sync()');assert.equal(host.run('run.partnerForm'),'tree');assert.equal(host.run('run.partnerBirthForm'),'computer');assert.equal(guest.el('form-name').textContent,'Tree');
  host.run("run.room='reliquary';run.cleared.push('reliquary');run.partner.x=480;run.partner.y=215;stepRun(run,{},1/60)");await host.run('online.sync()');await guest.run('online.sync()');assert.equal(guest.run('run.keys[0]'),'ivory');
  host.run('run.partner.hp=run.partner.maxHp-20');await host.run('online.sync()');await guest.run('online.sync()');guest.run("act('power')");await guest.run('online.sync()');await host.run('online.sync()');host.run('animate(950)');assert.ok(host.run('run.partner.powerCooldown')>0);assert.ok(host.run('run.partner.hp')>host.run('run.partner.maxHp-20'));await host.run('online.sync()');await guest.run('online.sync()');assert.ok(guest.run('run.partner.powerCooldown')>0);
  host.run("run.partnerMasteryEarned={tree:30};run.stats.partner.damageDealt=800");
  await guest.run("onlineAction('online-leave')");await host.run('online.sync()');assert.equal(host.run('onlineWaiting'),true);assert.equal(guest.run('menu'),true);assert.equal(host.run('run.partner'),null);assert.equal(host.run('Object.keys(run.partnerMasteryEarned).length'),0);
  guest.run("enterDescent('join')");guest.el('online-form').value='computer';guest.el('online-code').value=code;await guest.run("onlineAction('online-join')");await host.run('online.sync()');assert.equal(host.run('run.partnerForm'),'computer');assert.equal(host.run('run.stats.partner.damageDealt'),0);assert.equal(host.run('Object.keys(run.partnerMasteryEarned).length'),0);
 }finally{await host.run('online.leave()');await guest.run('online.leave()');await instance.close();}
});
