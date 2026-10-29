import test from 'node:test';
import assert from 'node:assert/strict';
import {DescentXRAdapter} from '../public/vr/spark-xr-adapters.js';
import {SparkXRRuntime} from '../public/vr/spark-xr-runtime.js';
import {LivingSparkHost} from '../public/vr/spark-living-host.js';
import {XR_INPUT_VERSION,SparkXRInput} from '../public/vr/spark-xr-input.js';
import {desktopXRSample} from '../public/vr/spark-xr-preview.js';
import {createVRPreview,VR_ROOMS} from '../public/vr/spark-vr-model.js';
import {VR_SAVE_KEY,saveVRCheckpoint} from '../public/vr/spark-vr-save.js';
import {stepRun,validRun,validMeta,ROOMS,BODIES,createRun,createMeta,gateStatus,enterGate,exitPosition,morphRun} from '../public/action-engine.js';
import {KEYS} from '../public/exploration.js';
import {ROUTE_RELICS} from '../public/world-expansion.js';
import {WORLD_ORDER} from '../public/worlds.js';
import {targetDescent} from '../public/vr/spark-xr-targeting.js';
import {previewMatrix} from '../public/vr/spark-xr-preview.js';
import {VesselPresentation,VESSEL_PRESENTATIONS} from '../public/vr/spark-vessel-presentation.js';
import {livingRoomGeometry,XR_QUALITY,roomTheme} from '../public/vr/spark-room-themes.js';
import {makeSceneVertices,makeTrackedHandVertices} from '../public/vr/spark-vr-renderer.js';
import {thresholdGlassMachine,earnResonanceFromMachine} from './vr-living-path.mjs';
const storage=()=>({data:new Map(),getItem(k){return this.data.get(k)??null;},setItem(k,v){this.data.set(k,String(v));}});
const silent={unlock(){},stop(){},event(){},listener(){},dispose(){}};
const intent=(x={})=>({version:XR_INPUT_VERSION,valid:true,body:{forward:0,lateral:0,height:65},...x});
const driver=a=>({snapshot:()=>a.snapshot(),choose:id=>a.choose(id),tick:i=>a.step(intent({movement:{x:i.x||0,y:i.y||0},dash:!!i.dash,cast:i.power?{}:null,interact:!!i.interact}))});

test('fresh Descent XR clears real Glass, earns rewards, enters Machine, saves/restores and continues',()=>{
  const a=new DescentXRAdapter(),d=driver(a),receipt=thresholdGlassMachine(d);
  assert.equal(receipt.glass.cleared,true);assert.ok(receipt.glass.level>1);assert.ok(receipt.glass.karma>0);
  assert.ok(a.state.run.kills>=14);assert.ok(a.state.run.stats.damageDealt>0);assert.ok(a.state.run.essence>0);
  const store=storage();store.setItem('spark-substrate-descent-v2','original campaign');
  const runtime=new SparkXRRuntime({adapter:a,feedback:silent}),host=new LivingSparkHost({runtime,storage:store});
  host.save();const before=structuredClone(a.state.run);host.restore();assert.deepEqual(a.state.run,before);
  d.tick({x:.5});assert.ok(a.state.run.time>before.time);assert.ok(validRun(a.state.run)&&validMeta(a.state.meta));
  assert.equal(store.getItem('spark-substrate-descent-v2'),'original campaign');assert.deepEqual([...store.data.keys()].sort(),[VR_SAVE_KEY,'spark-substrate-descent-v2'].sort());
});
test('real input-only campaign route earns Ivory and Mirror Nursery resonance before transforming',()=>{
  const a=new DescentXRAdapter(),d=driver(a);thresholdGlassMachine(d);
  const receipt=earnResonanceFromMachine(d);assert.ok(receipt.keyring.includes('ivory'));
  assert.ok(a.state.run.earnedAbilities.includes('morph'));assert.equal(a.snapshot().roomId,'nursery');
  a.morph('tree');assert.equal(a.snapshot().form,'tree');assert.ok(a.snapshot().morphCooldown>0);
  assert.throws(()=>a.morph('rock'),/recovering/);assert.ok(validRun(a.state.run));
});
test('every room and gate retains canonical eligibility and transition behavior through the shared adapter',()=>{
  for(const room of VR_ROOMS)for(const direction of Object.keys(ROOMS[room].exits)){
    // Controlled gate fixture covers all graph edges, including locked states.
    const state=createVRPreview(),a=new DescentXRAdapter(state);state.run.room=room;
    state.run.cleared=[...VR_ROOMS];state.run.abilities=['phase','root','fracture','eye','morph'];
    state.run.keys=Object.keys(KEYS);
    state.run.seals=[...WORLD_ORDER];
    state.run.relics=Object.keys(ROUTE_RELICS);
    if(ROOMS[room].exits[direction].vessel)morphRun(state.run,ROOMS[room].exits[direction].vessel);
    Object.assign(state.run.player,exitPosition(direction));state.run.player.gateGrace=0;
    const baseline=structuredClone(state.run),available=gateStatus(baseline,direction);
    a.step(intent({interact:true}));stepRun(baseline,{interact:true,fireMode:'auto'},1/60);
    assert.equal(available.available,true,room+' '+direction+' fixture eligibility');
    assert.equal(a.state.run.room,ROOMS[room].exits[direction].to,room+' '+direction+' actual crossing');
    assert.equal(a.state.run.room,baseline.room,room+' '+direction);
    assert.deepEqual(a.state.run,baseline,room+' canonical authority');
    assert.equal(a.snapshot().gates.length,Object.keys(ROOMS[a.state.run.room].exits).length);
  }
});
test('Descent power, auto damage, cooldowns and charge exactly match canonical engine',()=>{
  for(const form of Object.keys(BODIES)){
    const state=createVRPreview();state.run.abilities.push('morph');state.run.earnedAbilities.push('morph');morphRun(state.run,form);
    const a=new DescentXRAdapter(state),baseline=structuredClone(state.run);
    a.step(intent({cast:{damage:1e9,charge:1000}}));stepRun(baseline,{power:true,fireMode:'auto'},1/60);
    assert.deepEqual(a.state.run,baseline,form);assert.ok(a.snapshot().cooldown>0);
    const cooldown=a.snapshot().cooldown;a.step(intent({cast:{}}));assert.ok(a.snapshot().cooldown<cooldown);
    assert.match(a.snapshot().notice,/Power recovering/);
  }
});
test('six vessel mappings and silhouettes are distinct and observe only canonical transformations',()=>{
  const presentation=new VesselPresentation(),styles=new Set(),meshes=new Set();
  for(const form of Object.keys(BODIES)){
    const spec=presentation.describe(form);styles.add(spec.style);
    const hands=presentation.hands({left:{matrix:desktopXRSample().hands.left.grip,charge:.5}},form);
    meshes.add(JSON.stringify([...makeTrackedHandVertices(hands)].slice(0,400)));
    assert.ok(spec.color&&spec.tone>0);
  }
  assert.equal(styles.size,6);assert.equal(meshes.size,6);assert.equal(Object.keys(VESSEL_PRESENTATIONS).length,6);
  const a=new DescentXRAdapter();assert.throws(()=>a.morph('tree'),/Nursery/);assert.equal(a.state.run.form,'spark');
  // A validator-compatible earned-resonance checkpoint fixture; no production unlock shortcut.
  a.state.run.abilities.push('morph');a.state.run.earnedAbilities.push('morph');
  a.presentation.observe(a.snapshotBase(),0);const fraction=a.snapshot().health/a.snapshot().maxHealth;
  a.morph('tree');assert.equal(a.snapshot().form,'tree');assert.ok(a.snapshot().transform>0);
  assert.ok(Math.abs(a.snapshot().health/a.snapshot().maxHealth-fraction)<1e-8);
  assert.throws(()=>a.morph('rock'),/recovering/);assert.equal(a.snapshot().form,'tree');
});
test('old VR checkpoint is explicitly restored with the same format and without changing other modes',()=>{
  const store=storage(),old=createVRPreview();old.run.player.hp=73;saveVRCheckpoint(store,old);
  for(const key of ['spark-substrate-sideways-v1','spark-substrate-duels-v1','spark-substrate-memory-arcade-v1'])store.setItem(key,key);
  const before=new Map(store.data),runtime=new SparkXRRuntime({adapter:new DescentXRAdapter(),feedback:silent});
  const host=new LivingSparkHost({runtime,storage:store});host.restore();assert.equal(host.descent.state.run.player.hp,73);
  assert.deepEqual(store.data,before);assert.equal(host.worldModePacket().externalDependency,false);
});
test('mode switch ends session/renderer ownership and keeps independent journey and arena state',async()=>{
  const runtime=new SparkXRRuntime({adapter:new DescentXRAdapter(),feedback:silent}),host=new LivingSparkHost({runtime,storage:storage()});
  const state=host.descent.state;state.run.player.hp=77;state.ticks=1;
  let disposed=0;runtime.renderer={dispose:()=>disposed++};
  await host.setMode('duel');assert.equal(runtime.mode,'idle');assert.equal(disposed,1);
  assert.equal(runtime.adapter.match.recorded,false);assert.equal(runtime.adapter.match.fighters[0].hp,100);
  await host.setMode('descent');assert.equal(host.descent.state,state);assert.equal(runtime.adapter.snapshot().health,77);
  await assert.rejects(()=>host.setMode('sideways'),/not implemented/);
});
test('movement and physical lean share the native speed cap and collision, while duck grants no immunity',()=>{
  const a=new DescentXRAdapter(),baseline=new DescentXRAdapter(),start=a.snapshot().player;
  a.step(intent({movement:{x:1,y:1},physicalDelta:{x:500,y:500},motionScale:.5,duck:true}));
  const move=Math.hypot(a.snapshot().player.x-start.x,a.snapshot().player.y-start.y);
  assert.ok(move<=BODIES.spark.speed/60*.50001);assert.ok(a.state.run.player.iframes<1);
  baseline.step(intent({movement:{x:0,y:0},body:{forward:0,lateral:0,height:15},duck:true}));
  assert.equal(baseline.state.run.player.iframes,a.state.run.player.iframes);
  const cover=new DescentXRAdapter();cover.state.run.room='glass';cover.state.run.cleared.push('glass');
  const box=cover.snapshot().obstacles[0];
  cover.state.run.player.x=box.x-20;cover.state.run.player.y=box.y+box.h/2;
  for(let i=0;i<30;i++)cover.step(intent({physicalDelta:{x:100,y:0},body:{forward:0,lateral:40,height:15}}));
  assert.ok(cover.state.run.player.x<=box.x-cover.state.run.player.r+.01,'physical input cannot pass the native Glass cover');
});
test('neutral rearm covers movement/grips and menu triggers after interruption; invisible sessions cannot resume',()=>{
  const i=new SparkXRInput();i.poll(desktopXRSample(),0);i.interrupt();
  assert.equal(i.poll(desktopXRSample({move:1}),16).ready,false);
  assert.deepEqual(i.poll(desktopXRSample({move:1}),32).movement,{x:0,y:0});
  assert.equal(i.poll(desktopXRSample(),48).ready,true);
  assert.ok(i.poll(desktopXRSample({move:1}),64).movement.y<0);
  assert.equal(i.poll({...desktopXRSample(),visible:false},80).valid,false);
});
test('three showcase rooms and all seven world themes have finite bounded cached geometry at three qualities',()=>{
  const a=new DescentXRAdapter(),signatures=new Set();
  for(const roomId of ['threshold','glass','machine'])for(const quality of Object.keys(XR_QUALITY)){
    a.state.run.room=roomId;const s={...a.snapshot(),quality};const mesh=livingRoomGeometry(s);
    assert.equal(livingRoomGeometry(s),mesh);assert.ok(mesh.length>10000&&mesh.length<180000);
    assert.ok(mesh.every(Number.isFinite));signatures.add(mesh.length);assert.ok(makeSceneVertices(s).every(Number.isFinite));
    assert.equal(roomTheme(s).version,'spark.xr.room-theme.v1');
  }
  assert.ok(signatures.size>=4);for(const room of VR_ROOMS){a.state.run.room=room;assert.ok(roomTheme(a.snapshot()).glow);}
});

test('pointing is reach-bounded, cover-occluded and preserves canonical gate eligibility',()=>{
  const a=new DescentXRAdapter();a.state.run.player.y=100;const s=a.snapshot();
  const near=targetDescent(s,{right:{ray:previewMatrix(0,1.2,-2)}},previewMatrix());
  assert.equal(near.id,'north');assert.equal(near.available,true);
  assert.equal(targetDescent(s,{right:{ray:previewMatrix(0,1.2,0)}},previewMatrix()),null);
  const blocked={...s,obstacles:[{x:450,y:80,w:60,h:80}]};
  assert.equal(targetDescent(blocked,{right:{ray:previewMatrix(0,.8,-1.3)}},previewMatrix()),null);
  assert.equal(targetDescent(s,{right:{ray:null}},previewMatrix()),null);
});
