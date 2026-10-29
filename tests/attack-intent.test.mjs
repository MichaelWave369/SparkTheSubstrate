import test from 'node:test';
import assert from 'node:assert/strict';
import {createMeta,createRun,stepRun,attackProfile,attackInterval,attackReach,attackObservations,queryAttackIntent,obstacles,validRun,morphRun,guardianThreats,enterGate} from '../public/action-engine.js';
import {ATTACK_INTENT_VERSION,DIRECTED_ATTACK_MODE,segmentBox,segmentCircle} from '../public/attack-intent.js';
import * as engine from '../public/action-engine.js';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {legacyCombatScenario} from './legacy-combat-scenario.mjs';
import {saveVRCheckpoint,loadVRCheckpoint,VR_SAVE_SCHEMA} from '../public/vr/spark-vr-save.js';
// Controlled combat fixtures only: these do not claim legitimately earned progress.
function fixture(form='spark',room='threshold'){
 const r=createRun(createMeta(),'spark',369);r.abilities.push('morph');morphRun(r,form);
 r.room=room;r.cleared.push(room);r.player.attackClock=0;
 r.enemies=[{id:1000,kind:'collector',x:630,y:350,r:14,hp:1000,maxHp:1000,speed:0,attack:100,orbitHit:0,flash:0},
  {id:1001,kind:'collector',x:330,y:350,r:14,hp:1000,maxHp:1000,speed:0,attack:100,orbitHit:0,flash:0}];return r;
}
function intent(r,patch={}){const p=r.player,e=r.enemies[0],n=Math.hypot(e.x-p.x,e.y-p.y);return {version:ATTACK_INTENT_VERSION,
 room:r.room,observedAt:r.time,sequence:1,origin:{x:p.x,y:p.y},direction:{x:(e.x-p.x)/n,y:(e.y-p.y)/n},targetId:e.id,assist:0,...patch};}
const tick=(r,i=null)=>stepRun(r,{attackMode:DIRECTED_ATTACK_MODE,...(i?{attackIntent:i}:{})},1/60);
const wait=(r,n=120)=>{for(let i=0;i<n;i++)tick(r);};
test('directed intent damages the selected observed enemy, genuinely misses away, and never auto-fires',()=>{
 const r=fixture();tick(r,intent(r));wait(r,90);
 assert.ok(r.enemies[0].hp<1000);assert.equal(r.enemies[1].hp,1000);
 assert.equal(attackObservations(r).filter(e=>e.type==='cast').length,1);
 const hp=r.enemies.map(e=>e.hp);tick(r,intent(r,{sequence:2,targetId:null,direction:{x:0,y:1}}));wait(r,120);
 assert.deepEqual(r.enemies.map(e=>e.hp),hp);assert.ok(attackObservations(r).some(e=>e.type==='miss'));
 assert.ok(Math.abs(r.stats.damageDealt-(1000-hp[0]))<1e-9);assert.ok(validRun(r));
});
test('basic recovery is canonical, replayed/cooldown requests cannot queue or manufacture hits',()=>{
 const r=fixture(),i=intent(r);tick(r,i);const recovery=attackInterval(r);
 assert.equal(r.player.attackClock,recovery);tick(r,intent(r,{sequence:2}));
 assert.ok(r.player.attackClock<recovery);assert.equal(attackObservations(r).filter(e=>e.type==='cast').length,1);
 wait(r,60);tick(r,intent(r,{sequence:2}));assert.equal(attackObservations(r).filter(e=>e.type==='cast').length,1);
 tick(r,intent(r,{sequence:3}));assert.equal(attackObservations(r).filter(e=>e.type==='cast').length,2);
});
test('invalid, stale, future, forged and absent enemy requests fail closed',()=>{
 const patches=[{version:'bad'},{room:'glass'},{observedAt:-1},{observedAt:1},{sequence:NaN},{sequence:0},
  {origin:{x:Infinity,y:0}},{origin:{x:100,y:100}},{direction:{x:NaN,y:1}},{direction:{x:3,y:1}},
  {targetId:999},{targetId:'1000'},{assist:90},{damage:1e9},{cooldown:0},{targetHP:0}];
 for(const patch of patches){const r=fixture();tick(r,intent(r,patch));assert.equal(r.shots.length,0,JSON.stringify(patch));assert.equal(r.stats.damageDealt,0);assert.equal(attackObservations(r).at(-1).type,'rejected');}
 const r=fixture(),i=intent(r);r.enemies[0].x=100;r.enemies[0].y=100;
 tick(r,i);assert.equal(r.shots.length,0,'moving outside observed ray is independently revalidated');
});
test('directed cover blocks origin, target requests and swept projectiles without changing classic shots',()=>{
 const r=fixture('computer','glass'),box=obstacles('glass',r)[0];
 Object.assign(r.player,{x:box.x-50,y:box.y+box.h/2});Object.assign(r.enemies[0],{x:box.x+box.w+70,y:r.player.y});r.enemies.splice(1);
 assert.equal(queryAttackIntent(r,intent(r)).valid,false);
 tick(r,intent(r,{targetId:null,direction:{x:1,y:0}}));wait(r,120);
 assert.equal(r.enemies[0].hp,1000);assert.ok(attackObservations(r).some(e=>e.type==='blocked'));
 const through=intent(r,{sequence:2,origin:{x:box.x+box.w+8,y:r.player.y}});tick(r,through);assert.equal(r.stats.damageDealt,0);
});
test('native melee cone and radial reach stay body-anchored and respect cover',()=>{
 for(const form of ['human','animal','tree','rock']){
  const r=fixture(form),range=attackReach(r);Object.assign(r.enemies[0],{x:r.player.x+range*.6,y:r.player.y});Object.assign(r.enemies[1],{x:r.player.x-range*.6,y:r.player.y});
  tick(r,intent(r));assert.ok(r.enemies[0].hp<1000,form);
  assert.equal(r.enemies[1].hp<1000,['tree','rock'].includes(form),form+' native cone/radial');
  const far=fixture(form);far.enemies[0].x=far.player.x+range+90;far.enemies[0].y=far.player.y;
  tick(far,intent(far));assert.equal(far.stats.damageDealt,0,form+' cannot target at a distance');
 }
 const r=fixture('rock','glass'),b=obstacles('glass',r)[0];Object.assign(r.player,{x:b.x-20,y:b.y+b.h/2});Object.assign(r.enemies[0],{x:b.x+b.w+20,y:r.player.y});r.enemies.splice(1);
 tick(r,intent(r,{targetId:null,direction:{x:1,y:0}}));assert.equal(r.stats.damageDealt,0,'radial directed attacks cannot hit through cover');
});
test('six canonical profiles retain damage, interval and projectile capabilities',()=>{
 for(const form of ['spark','human','computer','animal','tree','rock']){
  const r=fixture(form),range=attackReach(r);r.enemies.splice(1);r.enemies[0].x=r.player.x+Math.min(85,range*.6);r.enemies[0].y=r.player.y;
  const baseline=structuredClone(r);stepRun(baseline,{},1/60);tick(r,intent(r));
  assert.equal(r.player.attackClock,baseline.player.attackClock,form+' recovery');
  if(r.shots.length){assert.equal(r.shots.length,baseline.shots.length);assert.deepEqual(r.shots.map(s=>[s.damage,s.homing,s.homingSpeed]),baseline.shots.map(s=>[s.damage,s.homing,s.homingSpeed]));}
  else assert.equal(r.enemies[0].hp,baseline.enemies[0].hp,form+' native damage');
  assert.equal(attackProfile(r).interval,attackProfile(baseline).interval);
 }
});
test('ordinary prism volley does not acquire homing, while native seeker stays on selected identity',()=>{
 const r=fixture('computer');tick(r,intent(r));assert.ok(r.shots.every(s=>!s.homing));
 const seeker=fixture();tick(seeker,intent(seeker));assert.ok(seeker.shots.every(s=>s.homing&&s.directed.targetId===1000));
 const away=fixture();tick(away,intent(away,{targetId:null,direction:{x:0,y:1}}));assert.ok(away.shots.every(s=>s.directed.targetId===null));wait(away);assert.equal(away.stats.damageDealt,0);
});
test('exact sweeps handle thin cover, tangency and nearest intersection',()=>{
 assert.equal(segmentBox({x:0,y:1},{x:100,y:1},{x:50,y:0,w:.01,h:2}),.5);
 assert.equal(segmentBox({x:0,y:3},{x:100,y:3},{x:50,y:0,w:1,h:2}),null);
 assert.equal(segmentCircle({x:0,y:0},{x:100,y:0},{x:50,y:5},5),.5);
});
test('guardian warnings expose actual locked Cantor patterns without changing canonical AI',()=>{
 for(const stage of [1,2]){
  const r=createRun(createMeta(),'spark',369);r.player.y=115;enterGate(r,'north');
  // Clearly labeled guardian fixture: canonical enter/arrive spawns native Cantor.
  r.room='cistern';r.cleared.push('cistern');r.player.x=480;r.player.y=485;r.player.gateGrace=0;enterGate(r,'south');
  const boss=r.enemies.find(e=>e.kind==='cantor');assert.ok(boss);if(stage===2)boss.hp=boss.maxHp*.49;
  boss.attack=0;tick(r);const threats=guardianThreats(r),g=threats[0];assert.equal(g.angles.length,stage===1?6:10);
  const before=structuredClone(r);guardianThreats(r);assert.deepEqual(r,before,'read-only warning');
  for(let i=0;i<60&&!r.shots.some(s=>s.enemy);i++)tick(r);
  const shots=r.shots.filter(s=>s.enemy);assert.equal(shots.length,g.angles.length);
  for(let i=0;i<shots.length;i++)assert.ok(Math.abs(Math.cos(g.angles[i])-shots[i].vx/Math.hypot(shots[i].vx,shots[i].vy))<1e-9);
 }
});
test('48 golden combat traces remain byte-identical to pre-Rung-3 main across solo/co-op, modes, equipment and Cantor AI',()=>{
 const receipt=JSON.parse(readFileSync(new URL('./fixtures/legacy-combat-rung2.json',import.meta.url),'utf8'));
 for(const {sha256,...spec}of receipt.cases){
  const run=legacyCombatScenario(engine,spec),hash=createHash('sha256').update(JSON.stringify(run)).digest('hex');
  assert.equal(hash,sha256,JSON.stringify(spec));
 }
});
test('equipped weapons and learned homing/haste retain canonical profiles in directed mode',()=>{
 for(const weapon of ['tideblade','thornstaff','cindermaul','nightfangs','orbitprism','firstlight']){
  const r=fixture('human'),meta=createMeta();meta.inventory[weapon]=2;engine.equipRunItem(r,meta,weapon);
  r.enemies.splice(1);r.enemies[0].x=r.player.x+75;r.enemies[0].y=r.player.y;const old=structuredClone(r);
  stepRun(old,{},1/60);tick(r,intent(r));assert.equal(r.player.attackClock,old.player.attackClock,weapon);
  assert.deepEqual(r.shots.map(s=>[s.damage,s.homing,s.homingSpeed]),old.shots.map(s=>[s.damage,s.homing,s.homingSpeed]),weapon);
  if(!r.shots.length)assert.equal(r.enemies[0].hp,old.enemies[0].hp,weapon);
 }
 const r=fixture('computer');r.training.computer={xp:100,learned:['scan-1','scan-2','clock-1']};r.player.overclockTime=4;r.boons.cadence=2;
 const old=structuredClone(r);stepRun(old,{},1/60);tick(r,intent(r));
 assert.equal(r.player.attackClock,old.player.attackClock);assert.ok(r.shots.every(s=>s.homing));assert.ok(validRun(r));
});
test('a moving enemy can leave an ordinary volley after launch without turning it into a seeker',()=>{
 const r=fixture('computer');r.enemies.splice(1);tick(r,intent(r));const velocities=r.shots.map(s=>[s.vx,s.vy]);
 r.enemies[0].y=80;wait(r,70);assert.equal(r.stats.damageDealt,0);assert.ok(attackObservations(r).some(e=>e.type==='miss'));
 assert.ok(velocities.length===3);
});
test('hand extension cannot add attack reach and real directed shots expire at native range',()=>{
 const r=fixture();r.enemies[0].x=800;r.enemies[0].y=100;r.player.x=100;r.player.y=100;
 const request=intent(r,{origin:{x:170,y:100},direction:{x:1,y:0}});tick(r,request);assert.equal(r.shots.length,0);
 tick(r,intent(r,{sequence:2,targetId:null,origin:{x:170,y:100},direction:{x:1,y:0}}));wait(r,120);
 assert.equal(r.stats.damageDealt,0);assert.ok(attackObservations(r).some(e=>e.type==='miss'));
});
test('mixed legacy surge/fire flags cannot bypass intentional targeting or unsupported contract rejection',()=>{
 for(const mode of [DIRECTED_ATTACK_MODE,'directed-v999']){
  const r=fixture();stepRun(r,{attackMode:mode,fireMode:'surge',fire:true},1/60);assert.equal(r.shots.length,0);
  stepRun(r,{attackMode:mode,attackIntent:intent(r,{damage:1e9}),fireMode:'surge',fire:true},1/60);
  assert.equal(r.shots.length,0);assert.equal(r.stats.damageDealt,0);
 }
});
test('in-flight directed metadata survives the original checkpoint envelope and malformed geometry is refused',()=>{
 const run=fixture(),meta=createMeta(),store={value:null,setItem(k,v){this.value=v;},getItem(){return this.value;}};
 tick(run,intent(run));saveVRCheckpoint(store,{run,meta});const parsed=JSON.parse(store.value);
 assert.equal(parsed.schema,VR_SAVE_SCHEMA);assert.equal(parsed.run.version,2);
 const restored=loadVRCheckpoint(store);assert.deepEqual(restored.run,run);
 restored.run.shots[0].directed.remaining=NaN;assert.equal(validRun(restored.run),false);
 assert.throws(()=>saveVRCheckpoint(store,restored),/invalid/);
});
