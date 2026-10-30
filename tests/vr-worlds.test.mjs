import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {DescentXRAdapter} from '../public/vr/spark-xr-adapters.js';
import {livingRoomGeometry,livingDynamicGeometry,clearRoomGeometryCache,XR_QUALITY,roomTheme} from '../public/vr/spark-room-themes.js';
import {VR_ROOMS} from '../public/vr/spark-vr-model.js';
import {WORLD_ORDER,COMBAT_ROLES} from '../public/worlds.js';
import {ENCOUNTERS} from '../public/action-engine.js';
import {hex} from '../public/vr/spark-vr-geometry.js';
import {WORLD_FAMILIES,worldFamily,roomArtSeed,worldFamilyGeometry,worldFamilyDynamics,PRESERVED_ART_ROOMS} from '../public/vr/spark-world-families.js';
import {ENEMY_ART,enemyArtState,enemyFigure} from '../public/vr/spark-enemy-art.js';
const scenes=()=>{const a=new DescentXRAdapter();return VR_ROOMS.map(room=>{a.state.run.room=room;return a.snapshot();});};
const familyMesh=s=>{const t=roomTheme(s);return worldFamilyGeometry(s,hex(t.stone),hex(t.light),hex(t.glow));};
const fingerprint=v=>createHash('sha256').update(new Uint8Array(v.buffer,v.byteOffset,v.byteLength)).digest('hex');
test('all seven canonical world IDs dispatch to different architectural position geometry, not only palettes',()=>{
 assert.deepEqual(Object.keys(WORLD_FAMILIES),WORLD_ORDER);const signatures=new Set(),all=scenes();
 for(const worldId of WORLD_ORDER){const s=all.find(s=>s.worldId===worldId&&!PRESERVED_ART_ROOMS.has(s.roomId)),v=familyMesh(s),positions=[];
  for(let i=0;i<v.length;i+=6)positions.push(...v.slice(i,i+3));signatures.add(JSON.stringify(positions));assert.ok(worldFamily(s).motif);}
 assert.equal(signatures.size,7);
});
test('every canonical room at all quality presets stays finite, cached and under the unchanged 30000 static vertex cap',()=>{
 for(const s of scenes())for(const quality of Object.keys(XR_QUALITY)){
  const scene={...s,quality},before=structuredClone(scene),mesh=livingRoomGeometry(scene);
  assert.ok(mesh.length/6<=30000,scene.roomId+' '+quality+' '+mesh.length/6);assert.ok(mesh.every(Number.isFinite));
  assert.equal(livingRoomGeometry(scene),mesh);assert.deepEqual(scene,before);
 }
});
test('restore-equivalent rooms build byte-identical scenery without using runtime randomness or time',()=>{
 for(const s of scenes().filter(s=>!PRESERVED_ART_ROOMS.has(s.roomId))){const v=familyMesh(s),restored=familyMesh({...structuredClone(s),time:999,reduced:true});assert.equal(fingerprint(v),fingerprint(restored));}
 assert.equal(roomArtSeed('tide-archive'),roomArtSeed('tide-archive'));assert.notEqual(roomArtSeed('tide-archive'),roomArtSeed('grove-well'));
});
test('new world decoration cannot introduce a body-height visual barrier into canonical interior movement lanes',()=>{
 for(const s of scenes().filter(s=>!PRESERVED_ART_ROOMS.has(s.roomId)))for(const quality of Object.keys(XR_QUALITY)){
  const v=familyMesh({...s,quality});for(let i=0;i<v.length;i+=6){const[x,y,z]=v.slice(i,i+3);
   assert.ok(y<=.031||y>=2.65||Math.abs(x)>=4.4||Math.abs(z)>=2.65,`${s.roomId} (${x},${y},${z})`);
  }
  for(let i=0;i<v.length;i+=18){const xs=[v[i],v[i+6],v[i+12]],ys=[v[i+1],v[i+7],v[i+13]],zs=[v[i+2],v[i+8],v[i+14]];
   assert.ok(Math.max(...ys)<=.031||Math.min(...ys)>=2.65||Math.min(...xs)>=4.4||Math.max(...xs)<=-4.4||Math.min(...zs)>=2.65||Math.max(...zs)<=-2.65,s.roomId+' triangle spans a movement lane');
  }
 }
});
test('all three Rung 4 opening rooms and Cantor/Warden static stages remain byte-identical at every quality',()=>{
 const {hashes}=JSON.parse(readFileSync(new URL('../docs/vr-worlds/preserved-showcases.json',import.meta.url),'utf8')),all=scenes();
 for(const [key,hash]of Object.entries(hashes)){const [room,quality]=key.split(':');assert.equal(fingerprint(livingRoomGeometry({...all.find(s=>s.roomId===room),quality})),hash,key);}
});
test('all native gate axes remain free of new opaque family geometry from ankle to head height',()=>{
 for(const s of scenes().filter(s=>!PRESERVED_ART_ROOMS.has(s.roomId))){const v=familyMesh({...s,quality:'high'});
  for(const g of s.gates)for(let i=0;i<v.length;i+=6){const[x,y,z]=v.slice(i,i+3);if(y<.06||y>2.15)continue;
   const ns=['north','south'].includes(g.direction),along=ns?x:z,edge=ns?z:x,sign=['north','west'].includes(g.direction)?-1:1;
   assert.ok(!(Math.abs(along)<.68&&edge*sign>(ns?2.55:4.38)),s.roomId+' '+g.direction+' decoration crosses doorway');
  }
 }
});
test('cache ignores cosmetic time, changes for native gate eligibility/obstacles/quality, and clears on teardown',()=>{
 const s=scenes().find(s=>s.roomId==='tide-archive'),mesh=livingRoomGeometry(s);
 assert.equal(livingRoomGeometry({...s,time:98,reduced:true}),mesh);
 for(const patch of [{quality:'high'},{gates:s.gates.map(g=>({...g,available:!g.available}))},{obstacles:[...s.obstacles,{x:400,y:250,w:15,h:15}]}])assert.notEqual(livingRoomGeometry({...s,...patch}),mesh);
 clearRoomGeometryCache();assert.notEqual(livingRoomGeometry(s),mesh);
});
test('performance/balanced/high add bounded detail; reduced intensity freezes ambient motion without erasing gates or native warnings',()=>{
 for(const worldId of WORLD_ORDER){const s=scenes().find(s=>s.worldId===worldId&&!PRESERVED_ART_ROOMS.has(s.roomId)),sizes=[];
  for(const quality of ['performance','balanced','high']){const v=[];worldFamilyDynamics(v,{...s,time:1,quality},[1,.8,.6],[.5,.9,.8]);sizes.push(v.length);assert.ok(v.length<14000);}
  assert.ok(sizes[0]<sizes[1]&&sizes[1]<=sizes[2]);
  const a=[],b=[];worldFamilyDynamics(a,{...s,time:1,reduced:true},[1,.8,.6],[.5,.9,.8]);worldFamilyDynamics(b,{...s,time:87,reduced:true},[1,.8,.6],[.5,.9,.8]);assert.deepEqual(a,b);
  const warning={...s,reduced:true,enemies:[{x:480,y:300,r:14,windup:.4,chargeX:1,chargeY:0}],effects:[]},v=[];livingDynamicGeometry(v,warning);assert.ok(v.length>a.length,'native attack direction survives reduced effects');
 }
});
test('ordinary silhouettes select only native roles and regional aliases and have bounded distinct geometry',()=>{
 const pool=new Set(Object.values(ENCOUNTERS).flatMap(e=>e.pool||[])),signatures=new Set(),s={player:{x:480,y:400},time:1,quality:'high'};
 for(const kind of Object.keys(ENEMY_ART)){
  // Oracle also appears in the canonical danger-based fallback spawn pool.
  assert.ok(pool.has(kind)||Object.values(COMBAT_ROLES).includes(kind)||kind==='oracle',kind);const e={id:1,kind,x:480,y:250,hp:30,windup:0,charge:0,shield:0},v=[];enemyFigure(v,e,s);
  assert.ok(v.length/6<2400,kind);assert.ok(v.every(Number.isFinite));signatures.add(JSON.stringify(v));assert.equal(enemyArtState(e,s).role,kind);
 }
 assert.equal(signatures.size,Object.keys(ENEMY_ART).length);
 for(const [kind,role]of Object.entries(COMBAT_ROLES))assert.equal(enemyArtState({kind,x:0,y:0},s).role,role);
});
test('enemy preparation, locked heading, charge, shield and damage come only from actual observed fields',()=>{
 const s={player:{x:0,y:100},time:0},e={id:1,kind:'hound',x:0,y:0,windup:.5,chargeX:1,chargeY:0,charge:0,flash:0,shield:0};
 const a=enemyArtState(e,s);assert.equal(a.preparing,true);assert.equal(a.charging,false);assert.ok(Math.abs(a.yaw-Math.PI/2)<1e-5);
 assert.equal(enemyArtState({...e,windup:0}, {...s,time:500}).preparing,false);
 assert.equal(enemyArtState({...e,windup:0,charge:.2,flash:.1,shield:1},s).charging,true);
 const mesh=(enemy,scene)=>{const v=[];enemyFigure(v,enemy,scene);return v;};
 assert.notDeepEqual(mesh(e,s),mesh({...e,flash:.1},s));assert.notDeepEqual(mesh({...e,kind:'mirror',shield:0},s),mesh({...e,kind:'mirror',shield:1},s));
 assert.deepEqual(mesh(e,{...s,reduced:true}),mesh(e,{...s,reduced:true,time:700}));
});
test('rendering enemy art and atmosphere cannot alter native state, rewards or progression',()=>{
 const a=new DescentXRAdapter(),run=a.state.run,before=structuredClone(run);a.state.run.room='conduit';const s=a.snapshot(),snapshot=structuredClone(s),native=structuredClone(run);
 for(let i=0;i<20;i++){const v=[];for(const kind of Object.keys(ENEMY_ART))enemyFigure(v,{id:1,kind,x:350,y:150,windup:.4,flash:.1},s);livingDynamicGeometry(v,s);}
 assert.deepEqual(s,snapshot);assert.deepEqual(run,native);run.room=before.room;assert.deepEqual(run,before);
});
test('Rung 4 controller, wrist, canonical engines and save files remain byte-identical to the merged baseline',()=>{
 const protectedFiles=JSON.parse(readFileSync(new URL('../docs/vr-worlds/protected-baseline.json',import.meta.url),'utf8'));
 for(const [path,hash]of Object.entries(protectedFiles)){const data=readFileSync(new URL('../'+path,import.meta.url));assert.equal(createHash('sha256').update(data).digest('hex'),hash,path);}
});
