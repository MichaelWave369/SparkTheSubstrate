import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {
  ROOMS,BODIES,BOONS,validRun,validMeta
} from '../public/action-engine.js';
import {WORLDS,WORLD_ORDER,worldOf} from '../public/worlds.js';
import {
  createVRPreview,resumeVRPreview,vrPhaseChoices,chooseVRPhase,nextVRForm,
  vrRoomSnapshot,VR_ROOMS,VR_WORLDS,VR_FORMS,stepVRPreview,VR_SIM_STEP
} from '../public/vr/spark-vr-model.js';
import {
  saveVRCheckpoint,loadVRCheckpoint,clearVRCheckpoint,VR_SAVE_KEY
} from '../public/vr/spark-vr-save.js';
import {makeSceneVertices} from '../public/vr/spark-vr-renderer.js';

const text=rel=>readFileSync(fileURLToPath(new URL(rel,import.meta.url)),'utf8');
const store=()=>({
  data:new Map(),
  getItem(k){return this.data.get(k)??null;},
  setItem(k,v){this.data.set(k,String(v));},
  removeItem(k){this.data.delete(k);}
});

test('all canonical Descent rooms and every exit target are represented in VR',()=>{
  assert.ok(VR_ROOMS.length>=126);
  assert.deepEqual([...VR_ROOMS].sort(),Object.keys(ROOMS).sort());
  assert.deepEqual([...VR_WORLDS],WORLD_ORDER);
  assert.equal(VR_WORLDS.length,7);
  assert.deepEqual([...VR_FORMS].sort(),Object.keys(BODIES).sort());
  assert.equal(VR_FORMS.length,6);
  for(const [id,room]of Object.entries(ROOMS)){
    for(const [direction,exit]of Object.entries(room.exits)){
      assert.ok(['north','south','east','west'].includes(direction),
        id+' exit orientation must render as a doorway');
      assert.ok(VR_ROOMS.includes(exit.to),id+' -> '+exit.to+' missing VR room');
    }
  }
});
test('each of seven world entrances has canonical theme, scenery, doors and finite geometry',()=>{
  const state=createVRPreview();
  const sizes=new Set();
  for(const worldId of WORLD_ORDER){
    const world=WORLDS[worldId];
    state.run.room=world.entry;
    const scene=vrRoomSnapshot(state);
    assert.equal(scene.worldId,worldId);
    assert.equal(scene.worldName,world.name);
    assert.ok(/^#[a-fA-F0-9]{6}$/.test(scene.roomTheme));
    assert.ok(scene.gates.every(g=>g.vrSupported));
    assert.equal(scene.availableRooms,VR_ROOMS.length);
    const vertices=makeSceneVertices(scene);
    assert.ok(vertices.length>0&&vertices.length<115000,worldId+' budget');
    assert.equal(vertices.length%6,0,worldId+' interleaved triangle vertices');
    assert.ok(vertices.every(Number.isFinite),worldId+' finite geometry');
    sizes.add(vertices.length);
  }
  assert.ok(sizes.size>=2,'geometry varies with the canonical world data');
});
test('gifts pause the real engine, expose exactly its offered choices, and apply a shell',()=>{
  const state=createVRPreview(369),run=state.run;
  run.phase='boon';run.choices=['edge','shell','cadence'];
  assert.deepEqual(vrPhaseChoices(state).map(x=>x.id),run.choices);
  const oldMax=run.player.maxHp;
  chooseVRPhase(state,'shell');
  assert.equal(run.phase,'playing');
  assert.equal(run.boons.shell,1);
  assert.equal(run.player.maxHp,oldMax+25);
  assert.deepEqual(vrPhaseChoices(state),[]);
  assert.throws(()=>chooseVRPhase(state,'edge'),/not currently available/);
});
test('cleared-room karma choices call canonical resolve and do not skip choice authority',()=>{
  const state=createVRPreview(369),run=state.run;
  run.room='glass';run.phase='resolve';run.cleared.push('glass');
  const choices=vrPhaseChoices(state);
  assert.equal(choices.length,3);
  const oldKarma=run.karma;
  assert.throws(()=>chooseVRPhase(state,'3'),/not currently available/);
  chooseVRPhase(state,'2');
  assert.equal(run.phase,'playing');
  assert.equal(run.karma,oldKarma+2);
  assert.ok(run.roomResolved.includes('glass'));
});
test('the Eye offers canonical continue or finish; finish is a real ending',()=>{
  const state=createVRPreview(369),run=state.run;
  run.room='eye';run.phase='milestone';run.cleared.push('eye');
  assert.deepEqual(vrPhaseChoices(state).map(x=>x.id),['continue','finish']);
  chooseVRPhase(state,'finish');
  assert.equal(run.phase,'won');
  assert.equal(run.victory,'eye');
  const scene=vrRoomSnapshot(state);
  assert.equal(scene.victory,'eye');
  assert.deepEqual(scene.choices,[]);
});
test('cycle between original six vessels only after real resonance unlock and cooldown',()=>{
  const state=createVRPreview(369),run=state.run;
  assert.throws(()=>nextVRForm(state),/Mirror Nursery/);
  run.abilities.push('morph');
  const initial=run.form;
  const fraction=run.player.hp/run.player.maxHp;
  const next=nextVRForm(state);
  assert.ok(BODIES[next]);
  assert.notEqual(next,initial);
  assert.equal(run.form,next);
  assert.ok(Math.abs(run.player.hp/run.player.maxHp-fraction)<1e-8);
  assert.throws(()=>nextVRForm(state),/recovering/);
});
test('canonical locked gates remain closed and cannot be bypassed by VR',()=>{
  const state=createVRPreview(369),run=state.run;
  run.room='glass';run.player.x=900;run.player.y=300;
  stepVRPreview(state,{interact:true},VR_SIM_STEP);
  assert.equal(run.room,'glass');
  assert.match(state.blockedMessage,/swarm/);
  run.cleared.push('glass');
  stepVRPreview(state,{interact:false},VR_SIM_STEP);
  stepVRPreview(state,{interact:true},VR_SIM_STEP);
  assert.equal(run.room,'machine','real progression continues beyond first two rooms');
  assert.equal(vrRoomSnapshot(state).worldId,'stratum');
});
test('pickup and boss visuals use real canonical room state, including hazards',()=>{
  const state=createVRPreview(369);
  const baseline=vrRoomSnapshot(state),size=makeSceneVertices(baseline).length;
  const boss={...baseline,roomId:'origin-heart',worldId:'uncreated',worldRank:6,
    boss:true,roomTheme:'#e6c780',safe:false,
    enemies:[{x:430,y:210,r:30,hp:250,color:'#e8c777',boss:true}],
    keyPickup:{x:480,y:240},relicPickup:{x:420,y:200},
    dangerMarks:[{x:490,y:270,r:58,color:'#f29280'}]};
  const mesh=makeSceneVertices(boss);
  assert.ok(mesh.length>size);
  assert.ok(mesh.every(Number.isFinite));
});
test('VR-only local checkpoint roundtrip is independent and validated by canonical code',()=>{
  const storage=store(),state=createVRPreview(369);
  assert.equal(loadVRCheckpoint(storage),null);
  assert.ok(validMeta(state.meta)&&validRun(state.run));
  const saved=saveVRCheckpoint(storage,state);
  assert.equal(saved.room,'threshold');
  assert.deepEqual([...storage.data.keys()],[VR_SAVE_KEY]);
  const restored=loadVRCheckpoint(storage);
  assert.equal(restored.run.room,state.run.room);
  assert.equal(restored.run.seed,state.run.seed);
  restored.run.player.hp=12;
  assert.notEqual(state.run.player.hp,12,'restored state is a safe separate copy');
  clearVRCheckpoint(storage);
  assert.equal(loadVRCheckpoint(storage),null);
});
test('VR checkpoint rejects corrupt input, invalid schema, partner data and oversize writes',()=>{
  const storage=store(),state=createVRPreview();
  storage.setItem(VR_SAVE_KEY,'{bad json');
  assert.throws(()=>loadVRCheckpoint(storage),/corrupt/);
  storage.setItem(VR_SAVE_KEY,JSON.stringify({schema:'not Spark',meta:state.meta,run:state.run}));
  assert.throws(()=>loadVRCheckpoint(storage),/incompatible/);
  state.run.partner={hp:5};
  assert.throws(()=>saveVRCheckpoint(storage,state),/invalid or non-solo/);
  state.run.partner=null;
  storage.setItem(VR_SAVE_KEY,'x'.repeat(512*1024+1));
  assert.throws(()=>loadVRCheckpoint(storage),/too large/);
});
test('source exposes separate save/resume, explicit XR controls and no backend transport',()=>{
  const html=text('../public/vr/index.html');
  const app=text('../public/vr/spark-vr-app.js');
  const save=text('../public/vr/spark-vr-save.js');
  assert.match(html,/id="resume-vr"/);
  assert.match(html,/id="save-vr"/);
  assert.match(html,/id="phase-options"/);
  assert.match(html,/Quest Touch controllers/);
  assert.match(app,/chooseVRPhase\(/);
  assert.match(app,/nextVRForm\(/);
  assert.match(app,/navigator\.xr\.requestSession\('immersive-vr'/);
  assert.ok(!app.includes('/api/'));
  assert.ok(!save.includes('/api/'));
  assert.ok(!app.includes('spark-substrate-descent-v2'));
  assert.ok(save.includes('spark-substrate-immersive-vr-v1'));
});
