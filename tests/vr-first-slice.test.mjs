import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {
  createVRPreview,stepVRPreview,vrRoomSnapshot,stickToGame,
  worldAt,engineAt,VR_SIM_STEP,VR_SLICE_ROOMS
} from '../public/vr/spark-vr-model.js';
import {worldRoot4,transform4,multiply4,projection4,lookAt4} from '../public/vr/spark-vr-math.js';
import {makeSceneVertices} from '../public/vr/spark-vr-renderer.js';

const identity=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
test('VR preview begins as canonical Spark in the actual safe Threshold, isolated from saved game',()=>{
  const state=createVRPreview(369);
  assert.equal(state.run.form,'spark');
  assert.equal(state.run.room,'threshold');
  assert.equal(state.run.phase,'playing');
  assert.ok(state.run.cleared.includes('threshold'));
  assert.deepEqual([...VR_SLICE_ROOMS],['threshold','glass']);
  const snap=vrRoomSnapshot(state);
  assert.equal(snap.roomName,'The Threshold');
  assert.ok(snap.gates.some(g=>g.direction==='north'&&g.to==='glass'&&g.available));
  assert.ok(snap.gates.some(g=>g.direction==='east'&&!g.available));
});
test('VR inputs actually step the canonical movement, dash and vessel power cooldown',()=>{
  const state=createVRPreview(369);
  const before=state.run.player.y;
  for(let i=0;i<10;i++)stepVRPreview(state,{x:0,y:-1},VR_SIM_STEP);
  assert.ok(state.run.player.y<before);
  stepVRPreview(state,{x:0,y:-1,dash:true,power:true},VR_SIM_STEP);
  assert.ok(state.run.player.dashCooldown>0);
  assert.ok(state.run.player.powerCooldown>0);
  assert.ok(state.run.stats.dashes>0);
  assert.ok(state.run.stats.powers>0);
});
test('canonical gate interaction reaches the actual Glass Causeway encounter',()=>{
  const state=createVRPreview(369);
  for(let i=0;i<120&&state.run.player.y>90;i++){
    stepVRPreview(state,{x:0,y:-1},VR_SIM_STEP);
  }
  assert.ok(state.run.player.y<=90);
  stepVRPreview(state,{interact:true},VR_SIM_STEP);
  assert.equal(state.run.room,'glass');
  assert.equal(vrRoomSnapshot(state).roomName,'Glass Causeway');
  assert.equal(state.run.phase,'playing');
  for(let i=0;i<100;i++)stepVRPreview(state,{},VR_SIM_STEP);
  assert.ok(state.run.spawned>0,'actual Spark encounter spawned foes');
});
test('VR boundary refuses unqualified routes beyond the two room slice',()=>{
  const state=createVRPreview(369);
  // Tests exactly the access boundary without fabricating earned keys or seals.
  state.run.room='glass';
  state.run.player.x=900;state.run.player.y=300;
  state.run.cleared.push('glass');
  const before=state.run.room;
  stepVRPreview(state,{interact:true},VR_SIM_STEP);
  assert.equal(state.run.room,before);
  assert.match(state.blockedMessage,/two-room|only covers Threshold and Glass/);
});
test('head-relative stick axes convert to actual engine movement including snap yaw',()=>{
  let result=stickToGame(0,-1,identity,0);
  assert.ok(result.y<-.95);
  result=stickToGame(1,0,identity,0);
  assert.ok(result.x>.95);
  result=stickToGame(0,-1,identity,Math.PI/2);
  assert.ok(result.x>.95);
  result=stickToGame(NaN,Infinity,identity,0);
  assert.deepEqual(result,{x:0,y:0});
  result=stickToGame(.05,.03,identity,0);
  assert.deepEqual(result,{x:0,y:0});
});
test('model-to-world coordinates and XR root preserve player anchor',()=>{
  const p=worldAt(480,390);
  assert.deepEqual(engineAt(p[0],p[2]),{x:480,y:390});
  const root=worldRoot4(p[0],p[2],Math.PI/3);
  const centered=transform4(root,p);
  assert.ok(Math.hypot(centered[0],centered[2])<1e-6);
  const combined=multiply4(identity,root);
  assert.deepEqual([...combined],[...root]);
  const projection=projection4(Math.PI/2,1.6,.05,80);
  assert.ok(projection.every(Number.isFinite));
  const view=lookAt4([0,1.65,0],[0,1.65,-1]);
  assert.ok(view.every(Number.isFinite));
});
test('world scene geometry is bounded, finite, responsive to engine obstacles/entities',()=>{
  const state=createVRPreview(369);
  let scene=vrRoomSnapshot(state);
  const threshold=makeSceneVertices(scene);
  assert.ok(threshold.length>0&&threshold.length<50000);
  assert.equal(threshold.length%6,0);
  assert.ok(threshold.every(Number.isFinite));
  scene={...scene,roomId:'glass',roomName:'Glass Causeway',
    obstacles:[{x:200,y:200,w:90,h:40}],
    enemies:[{x:400,y:200,r:16,hp:20,color:'#f5aa77'}],
    shots:[{x:410,y:210,enemy:true}],fragments:[{x:415,y:190}]};
  const encounter=makeSceneVertices(scene);
  assert.ok(encounter.length>threshold.length);
  assert.ok(encounter.every(Number.isFinite));
});
test('VR files use an explicit entry and do not rename or take over established save namespaces',async()=>{
  const source=fileURLToPath(new URL('../public/index.html',import.meta.url));
  const entry=await readFile(source,'utf8');
  const page=await readFile(new URL('../public/vr/index.html',import.meta.url),'utf8');
  const app=await readFile(new URL('../public/vr/spark-vr-app.js',import.meta.url),'utf8');
  assert.match(entry,/href="vr\/index\.html" id="entry-spark-vr"/);
  assert.match(page,/id="enter-vr"/);
  assert.match(page,/Prototype boundary/);
  assert.match(app,/navigator\.xr\.requestSession\('immersive-vr'/);
  assert.doesNotMatch(app,/localStorage\.(setItem|removeItem)/);
  assert.doesNotMatch(app,/sessionStorage\.(setItem|removeItem)/);
  assert.doesNotMatch(app,/fetch\(/);
});
test('VR front-end modules parse under Node without browser globals',()=>{
  for(const rel of ['../public/vr/spark-vr-app.js','../public/vr/spark-vr-renderer.js',
    '../public/vr/spark-vr-model.js','../public/vr/spark-vr-math.js']){
    const filename=fileURLToPath(new URL(rel,import.meta.url));
    const check=spawnSync(process.execPath,['--check',filename],{encoding:'utf8'});
    assert.equal(check.status,0,check.stderr);
  }
});
