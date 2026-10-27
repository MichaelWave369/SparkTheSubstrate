import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createVRPreview,vrRoomSnapshot,stepVRPreview} from '../public/vr/spark-vr-model.js';
import {vrCompass,closestVRGate,gateSummary} from '../public/vr/spark-vr-navigation.js';
import {
  VR_COMFORT_DEFAULTS,VR_COMFORT_KEY,normalizeVRComfort,
  applyVRComfortToMovement,vrSnapRadians,storeVRComfort,loadVRComfort
} from '../public/vr/spark-vr-comfort.js';

const file=relative=>readFileSync(fileURLToPath(new URL(relative,import.meta.url)),'utf8');
const localStorageMock=()=>({
  data:new Map(),
  setItem(key,value){this.data.set(key,String(value));},
  getItem(key){return this.data.get(key)??null;},
  removeItem(key){this.data.delete(key);}
});

test('compass displays original four-way gate data and blocked reasons, without changing gameplay state',()=>{
  const state=createVRPreview(369);
  const before=JSON.stringify(state.run);
  const route=vrCompass(vrRoomSnapshot(state));
  assert.deepEqual(route.map(g=>g.heading),['N','E']);
  const north=route.find(g=>g.direction==='north');
  const east=route.find(g=>g.direction==='east');
  assert.equal(north.available,true);
  assert.equal(north.name,'Glass Causeway');
  assert.equal(north.status,'OPEN');
  assert.equal(east.status,'LOCKED');
  assert.match(east.reason,/root|Root|Requires/);
  assert.equal(JSON.stringify(state.run),before,'map does not change engine state');
  assert.match(gateSummary(east),/^E LOCKED /);
  assert.ok(closestVRGate(vrRoomSnapshot(state)));
});
test('compass also shows swarm locks in Glass and opens the canonical east gate after clearance',()=>{
  const state=createVRPreview(369),run=state.run;
  run.room='glass';
  let east=vrCompass(vrRoomSnapshot(state)).find(g=>g.direction==='east');
  assert.equal(east.available,false);
  assert.match(east.reason,/swarm/i);
  run.cleared.push('glass');
  east=vrCompass(vrRoomSnapshot(state)).find(g=>g.direction==='east');
  assert.equal(east.available,true);
  assert.equal(east.name,'Machine Sepulcher');
  assert.ok(east.distance>0);
});
test('compass never invents doors for a room lacking specific cardinal exits',()=>{
  const state=createVRPreview(369);
  const routes=vrCompass(vrRoomSnapshot(state));
  assert.equal(routes.every(g=>['north','east','south','west'].includes(g.direction)),true);
  assert.equal(routes.some(g=>g.direction==='south'),false);
  assert.equal(vrCompass({...vrRoomSnapshot(state),gates:[]}).length,0);
  assert.equal(gateSummary(null),'No exits in this room');
  assert.throws(()=>vrCompass(null),/canonical room snapshot/);
});
test('comfort defaults are bounded and never increase canonical movement beyond 100%',()=>{
  assert.deepEqual(normalizeVRComfort({}),VR_COMFORT_DEFAULTS);
  assert.deepEqual(normalizeVRComfort({movement:999,turn:5,vignette:-1}),VR_COMFORT_DEFAULTS);
  const gentle=applyVRComfortToMovement({x:.5,y:-.5},{movement:.5,turn:30,vignette:0});
  assert.deepEqual(gentle,{x:.25,y:-.25});
  const defaultMove=applyVRComfortToMovement({x:1,y:-1});
  assert.ok(Math.hypot(defaultMove.x,defaultMove.y)<=.750000001);
  assert.ok(Math.abs(defaultMove.x)>0&&Math.abs(defaultMove.y)>0,
    'both diagonal movement axes remain active');
  assert.deepEqual(
    applyVRComfortToMovement({x:Infinity,y:NaN},{movement:1,turn:60,vignette:.75}),
    {x:0,y:0}
  );
  assert.ok(Math.abs(vrSnapRadians({movement:1,turn:45,vignette:0})-Math.PI/4)<1e-8);
  assert.ok(Math.abs(vrSnapRadians({movement:1,turn:60,vignette:0})-Math.PI/3)<1e-8);
});
test('VR comfort storage is independent from game checkpoints and rejects malformed settings',()=>{
  const storage=localStorageMock();
  assert.deepEqual(loadVRComfort(storage),VR_COMFORT_DEFAULTS);
  const updated={movement:.5,turn:60,vignette:.75};
  assert.deepEqual(storeVRComfort(storage,updated),updated);
  assert.deepEqual([...storage.data.keys()],[VR_COMFORT_KEY]);
  assert.deepEqual(loadVRComfort(storage),updated);
  storage.setItem(VR_COMFORT_KEY,'not json');
  assert.deepEqual(loadVRComfort(storage),VR_COMFORT_DEFAULTS);
  storage.setItem(VR_COMFORT_KEY,JSON.stringify({schema:'unexpected',options:updated}));
  assert.deepEqual(loadVRComfort(storage),VR_COMFORT_DEFAULTS);
  storage.setItem(VR_COMFORT_KEY,'x'.repeat(1500));
  assert.deepEqual(loadVRComfort(storage),VR_COMFORT_DEFAULTS);
});
test('XR implementation wires per-eye comfort, canonical directions and map-on-left-Y with safe pause',()=>{
  const html=file('../public/vr/index.html');
  const app=file('../public/vr/spark-vr-app.js');
  const renderer=file('../public/vr/spark-vr-renderer.js');
  assert.match(html,/id="comfort-speed"/);
  assert.match(html,/id="comfort-turn"/);
  assert.match(html,/id="comfort-vignette"/);
  assert.match(html,/id="navigation-panel"/);
  assert.match(html,/id="navigation-routes"/);
  assert.match(html,/id="toggle-navigation"/);
  assert.match(app,/edge\('navigation',pad\(left,5\)\)/);
  assert.ok(app.includes("currentChoices().map(x=>x.id).join(',')"),'rebirth offers must refresh the actual choice buttons');
  assert.ok(app.includes('Boolean(state.pendingRebirth)'),'death settlement must update the UI choice cache');
  assert.ok(app.includes('if(navigationOpen)toggleNavigation(false)'),'mode transitions safely close navigation');
  assert.match(app,/event.code==='KeyM'/);
  assert.match(app,/if\(paused\|\|navigationOpen\|\|!dt\)return/);
  assert.match(app,/applyVRComfortToMovement\(/);
  assert.match(app,/vrSnapRadians\(comfort\)/);
  assert.match(app,/vignette:comfort.vignette/);
  assert.match(renderer,/drawComfortVignette/);
  assert.match(renderer,/gl_FragColor=vec4\(0.005,0.012,0.021,falloff\*amount\)/);
  assert.ok(!app.includes('/api/'));
  assert.ok(!app.includes('spark-substrate-descent-v2'));
});
