import test from 'node:test';
import assert from 'node:assert/strict';
import {DescentXRAdapter} from '../public/vr/spark-xr-adapters.js';
import {SparkXRRuntime,xrWorldRoot} from '../public/vr/spark-xr-runtime.js';
import {LivingSparkHost} from '../public/vr/spark-living-host.js';
import {SparkXRInput,xrSettings} from '../public/vr/spark-xr-input.js';
import * as poses from '../public/vr/spark-xr-preview.js';
import {projectAttackRay,inverseRigidPoint} from '../public/vr/spark-xr-targeting.js';
import {attackObservations,queryAttackIntent,validRun} from '../public/action-engine.js';
import {VR_SAVE_KEY,VR_SAVE_SCHEMA} from '../public/vr/spark-vr-save.js';
import {loadSpellcraftPreferences,storeSpellcraftPreferences,SPELLCRAFT_PREFS_KEY} from '../public/vr/spark-spellcraft-preferences.js';
import {makeTrackedHandVertices} from '../public/vr/spark-vr-renderer.js';
import {awakeningDriver,findObservedPair,directedFightStep} from './vr-awakening-path.mjs';
import {walk,clearEncounter,crossGate,settleChoices} from './vr-living-path.mjs';
const silent={unlock(){},stop(){},event(){},listener(){},dispose(){}};
const memory=()=>({data:new Map(),getItem(k){return this.data.get(k)??null;},setItem(k,v){this.data.set(k,String(v));}});
function setup(){const storage=memory(),a=new DescentXRAdapter(),r=new SparkXRRuntime({adapter:a,feedback:silent,settings:{movement:1,throwMode:'trigger'}}),h=new LivingSparkHost({runtime:r,storage});
 r.mode='desktop';r.pause(false);const d=awakeningDriver({runtime:r,host:h,poses});d.tick({});d.tick({});return {a,r,h,d,storage};}
test('actual shared runtime selects a real Glass enemy, misses, preserves cadence, returns to Classic and restores old-format save',()=>{
 const {a,r,h,d,storage}=setup();walk(d,480,115);d.tick({interact:true});d.tick({});assert.equal(d.snapshot().roomId,'glass');
 d.profile('spellcraft');walk(d,480,300);const pair=findObservedPair(d),before=a.state.run.enemies.find(e=>e.id===pair.chosen).hp;
 d.tick({attack:true,aim:pair.chosen});d.tick({aim:pair.chosen});
 for(let i=0;i<100&&!attackObservations(a.state.run).some(e=>e.type==='hit');i++)d.tick({});
 assert.ok(attackObservations(a.state.run).some(e=>e.type==='hit'&&e.targetId===pair.chosen));
 assert.ok((a.state.run.enemies.find(e=>e.id===pair.chosen)?.hp??0)<before);
 const hp=d.snapshot().enemies.find(e=>e.id===pair.other).hp;
 const wait=()=>{for(let i=0;i<40;i++)d.tick({});};wait();
 const casts=attackObservations(a.state.run).filter(e=>e.type==='cast').length;
 d.tick({attack:true,direction:{x:0,y:1}});d.tick({direction:{x:0,y:1}});
 d.tick({attack:true,direction:{x:0,y:1}});d.tick({direction:{x:0,y:1}});
 assert.equal(attackObservations(a.state.run).filter(e=>e.type==='cast').length,casts+1);
 for(let i=0;i<120;i++)d.tick({});assert.ok(attackObservations(a.state.run).some(e=>e.type==='miss'));
 assert.equal(d.snapshot().enemies.find(e=>e.id===pair.other)?.hp,hp);
 d.profile('classic');const damage=a.state.run.stats.damageDealt;
 for(let i=0;i<120;i++)d.tick({});assert.ok(a.state.run.stats.damageDealt>damage,'legacy auto-targeting resumes');
 h.save();const saved=JSON.parse(storage.getItem(VR_SAVE_KEY));assert.equal(saved.schema,VR_SAVE_SCHEMA);
 assert.equal(saved.run.combatProfile,undefined);assert.equal(saved.run.attackMode,undefined);
 const beforeSave=structuredClone(a.state.run);h.restore();assert.deepEqual(a.state.run,beforeSave);assert.ok(validRun(a.state.run));
 assert.equal(r.settings.combatProfile,'classic');
});
test('XR-to-planar projection matches the rendered root at arbitrary head position and snap yaw',()=>{
 const {a}=setup();
 for(const yaw of [0,.5,Math.PI/2,-2]){
  const input=new SparkXRInput().poll(poses.desktopXRSample({yaw:.3,lean:.1}),0);input.yaw=yaw;
  const draft=projectAttackRay(a.state.run,input),root=xrWorldRoot(a.snapshot(),input),ray=input.hands.right.ray;
  assert.ok(draft);const origin=inverseRigidPoint(root,[ray[12],ray[13],ray[14]]);
  assert.ok(Math.abs(draft.origin.x-(origin[0]*100+480))<1e-4);
  assert.ok(Math.abs(draft.origin.y-(origin[2]*100+300))<1e-4);
 }
 const input=new SparkXRInput().poll(poses.desktopXRSample(),0);
 input.hands.right.ray=poses.previewMatrix(.22,1.45,-.48,0,Math.PI/2);assert.equal(projectAttackRay(a.state.run,input),null);
 input.hands.right.matrix=null;assert.equal(projectAttackRay(a.state.run,input),null);
});
test('profile and handedness changes capture held triggers until every gameplay control returns neutral',()=>{
 const {a,r,d}=setup();d.profile('spellcraft');d.tick({attack:true});
 r.configure({dominantHand:'left'});r.pause(false);
 d.tick({attack:true,x:1});d.tick({x:1});d.tick({attack:true,x:1});d.tick({});
 assert.equal(attackObservations(a.state.run).filter(e=>e.type==='cast').length,0);
 for(let i=0;i<10;i++)d.tick({});
 d.tick({attack:true});d.tick({});assert.equal(attackObservations(a.state.run).filter(e=>e.type==='cast').length,1);
 const event=attackObservations(a.state.run).find(e=>e.type==='cast');assert.equal(event.hand,'left');
});
test('separate left/right release edges survive high-refresh queueing and left-hand layout swaps native power',()=>{
 const i=new SparkXRInput(),s=xrSettings({throwMode:'trigger'});i.poll(poses.desktopXRSample(),0,{settings:s});
 i.poll(poses.desktopXRSample({leftTrigger:true,rightTrigger:true}),16,{settings:s});
 const release=i.poll(poses.desktopXRSample(),32,{settings:s});assert.deepEqual(Object.keys(release.casts),['right','left']);
 const {a,r,d}=setup();d.profile('spellcraft');r.configure({dominantHand:'left'});r.pause(false);d.tick({});d.tick({});
 d.tick({power:true});d.tick({});assert.equal(a.state.run.stats.powers,1);assert.ok(a.snapshot().cooldown>0);
 assert.equal(attackObservations(a.state.run).filter(e=>e.type==='cast').length,0);
});
test('Spellcraft preferences remain separate from campaign, old comfort and checkpoint data',()=>{
 const storage=memory();for(const key of [VR_SAVE_KEY,'spark-substrate-descent-v2','spark-substrate-sideways-v1'])storage.setItem(key,key);
 const before=new Map(storage.data);storeSpellcraftPreferences(storage,{combatProfile:'spellcraft',dominantHand:'left',aimAssist:6,damage:999});
 assert.equal(loadSpellcraftPreferences(storage).dominantHand,'left');assert.equal(loadSpellcraftPreferences(storage).aimAssist,6);
 for(const [key,value]of before)assert.equal(storage.getItem(key),value);
 assert.equal(JSON.parse(storage.getItem(SPELLCRAFT_PREFS_KEY)).options.damage,undefined);
});
test('input-only campaign reaches the actual Cantor, wins with directed attacks, earns native loot and continues',()=>{
 const {a,r,d,h,storage}=setup();walk(d,480,115);d.tick({interact:true});d.tick({});clearEncounter(d);crossGate(d,'east');
 for(const dir of ['north','east','south','south']){clearEncounter(d);crossGate(d,dir);}
 assert.equal(d.snapshot().roomId,'forge');assert.equal(d.snapshot().guardians[0].hp,1100);
 d.profile('spellcraft');let second=false,windup=false,frame=0;
 for(;frame<15000&&!d.snapshot().cleared;frame++){
  if(d.snapshot().phase==='dead')throw Error('Acceptance character died at Cantor');
  const g=d.snapshot().guardians[0];second||=g?.stage===2;windup||=g?.angles.length===10;
  directedFightStep(d,frame);
 }
 assert.equal(d.snapshot().cleared,true);assert.ok(second&&windup);assert.equal(a.state.run.bossDefeated.name,'The Cantor');
 assert.ok(a.state.run.loot.includes('ash'));assert.ok(d.snapshot().guardianVisual.victory>0);
 settleChoices(d);h.save();const saved=structuredClone(a.state.run);h.restore();assert.deepEqual(a.state.run,saved);
 r.pause(false);d.tick({});d.tick({});crossGate(d,'north');assert.equal(d.snapshot().roomId,'cistern');
 assert.equal(JSON.parse(storage.getItem(VR_SAVE_KEY)).schema,VR_SAVE_SCHEMA);
});
test('both simultaneous release edges are consumed once at 120 Hz and missing controller poses cannot cast',()=>{
 const {a,r,d}=setup();d.profile('spellcraft');for(let i=0;i<12;i++)d.tick({});
 let now=1000;const poll=(leftTrigger,rightTrigger)=>r.advance(now+=1000/120,poses.desktopXRSample({leftTrigger,rightTrigger}));
 r.last=null;r.input.interrupt();poll(false,false);poll(false,false);poll(true,true);poll(true,true);poll(false,false);poll(false,false);
 assert.equal(a.state.run.stats.powers,1);assert.equal(attackObservations(a.state.run).filter(e=>e.type==='cast').length,1);
 const before=structuredClone(a.state.run),input=new SparkXRInput().poll(poses.desktopXRSample(),0);
 input.casts={right:{hand:'right'}};input.hands.left.matrix=null;assert.equal(a.step(input),false);assert.deepEqual(a.state.run,before);
});
test('active charge is cancelled by missing tracking and cannot burst after resume or recenter',()=>{
 const {a,r,d}=setup();d.profile('spellcraft');for(let i=0;i<10;i++)d.tick({});d.tick({attack:true});
 r.advance(500,poses.desktopXRSample({missingPose:true,rightTrigger:true}));assert.equal(r.paused,true);
 r.pause(false);d.tick({attack:true});d.tick({});assert.equal(attackObservations(a.state.run).filter(e=>e.type==='cast').length,0);
 r.recenter();r.pause(false);d.tick({});d.tick({});for(let i=0;i<12;i++)d.tick({});
 d.tick({attack:true});d.tick({});assert.equal(attackObservations(a.state.run).filter(e=>e.type==='cast').length,1);
});
test('acceptance driver honors real recenter yaw instead of overriding canonical movement',()=>{
 const {r,d}=setup();d.view(1.6);r.recenter();r.pause(false);d.tick({});d.tick({});
 walk(d,480,230);assert.ok(Math.hypot(d.snapshot().player.x-480,d.snapshot().player.y-230)<9);
});
test('each canonical vessel release produces a distinct changing tracked animation without granting damage',()=>{
 const styles=new Set(),meshes=new Set();
 for(const form of ['spark','human','computer','animal','tree','rock']){
  const {a,d}=setup();
  // Controlled earned-resonance fixture; browser evidence earns it by actual play.
  a.state.run.abilities.push('morph');a.state.run.earnedAbilities.push('morph');a.morph(form);d.profile('spellcraft');
  for(let i=0;i<120&&a.snapshot().attackCooldown>0;i++)d.tick({});assert.ok(a.snapshot().attackCooldown<=0);
  d.tick({attack:true});d.tick({});
  const hands=d.last().input.hands,first=makeTrackedHandVertices(hands);assert.equal(hands.right.attacking,true);styles.add(hands.right.style);
  for(let i=0;i<6;i++)d.tick({});const next=makeTrackedHandVertices(d.last().input.hands);
  assert.notDeepEqual(next,first,form+' actual release progresses');meshes.add(JSON.stringify([...next]));
  assert.equal(a.state.run.stats.damageDealt,0);assert.ok(a.snapshot().attackCooldown>0);
 }
 assert.equal(styles.size,6);assert.equal(meshes.size,6);
});
