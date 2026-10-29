import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createDuel,stepDuel,DUEL_TECHNIQUES} from '../public/duel-engine.js';
import {duelBody,duelSpatialInput,duelSpatialCollision} from '../public/duel-spatial.js';
import {SparkXRInput,XR_INPUT_VERSION,trackedMatrix,readXRFrame,xrSettings} from '../public/vr/spark-xr-input.js';
import {DuelXRAdapter,DescentXRAdapter} from '../public/vr/spark-xr-adapters.js';
import {SparkXRRuntime,xrWorldRoot} from '../public/vr/spark-xr-runtime.js';
import {desktopXRSample,previewMatrix} from '../public/vr/spark-xr-preview.js';
import {makeSceneVertices,makeTrackedHandVertices} from '../public/vr/spark-vr-renderer.js';
import {transform4} from '../public/vr/spark-vr-math.js';
import {XRFeedback} from '../public/vr/spark-xr-feedback.js';
import {createVRPreview} from '../public/vr/spark-vr-model.js';
import {saveVRCheckpoint,loadVRCheckpoint} from '../public/vr/spark-vr-save.js';

const body={forward:0,lateral:0,height:65};
const aim={forward:25,lateral:0,height:65,dx:1,dy:0,dz:0};
const intent=(extra={})=>({version:XR_INPUT_VERSION,valid:true,body:{...body},move:0,...extra});
const spatial=(extra={})=>({version:1,body:{...body},...extra});
const silent={unlock(){},stop(){},event(){},listener(){},dispose(){}};
function runtime(options={}){return new SparkXRRuntime({adapter:new DuelXRAdapter(),feedback:silent,...options});}

test('tracked matrices reject malformed, nonfinite, scaled, reflected and implausible transforms',()=>{
  assert.ok(trackedMatrix(previewMatrix()));
  for(const bad of [null,[],Array(16).fill(Infinity),previewMatrix(100)])assert.equal(trackedMatrix(bad),null);
  for(const [index,value] of [[0,2],[0,-1],[3,1],[15,0]]){
    const m=previewMatrix();m[index]=value;assert.equal(trackedMatrix(m),null);
  }
});
test('frame reader never substitutes stale, emulated or missing controller positions',()=>{
  const left={handedness:'left',gripSpace:{},targetRaySpace:{},gamepad:{mapping:'xr-standard'}};
  const right={...left,handedness:'right',gripSpace:{missing:true}};
  const frame={getViewerPose:()=>({transform:{matrix:previewMatrix(0,1.65)}}),
    getPose:space=>space.missing?null:{transform:{matrix:previewMatrix(0,1.3)}}};
  const result=readXRFrame(frame,{},[left,right]);
  assert.ok(result.hands.left.grip);assert.equal(result.hands.right.grip,null);
  frame.getPose=()=>({emulatedPosition:true,transform:{matrix:previewMatrix()}});
  assert.equal(readXRFrame(frame,{},[left]).hands.left.grip,null);
  frame.getViewerPose=()=>{throw Error('device lost');};
  assert.equal(readXRFrame(frame,{},[]).head,null);
});
test('both triggers charge/release once, including simultaneous release and stationary fallback',()=>{
  const input=new SparkXRInput();
  input.poll(desktopXRSample(),0);
  let result=input.poll(desktopXRSample({leftTrigger:true,rightTrigger:true}),16);
  assert.equal(result.cast,null);
  result=input.poll(desktopXRSample({leftTrigger:true,rightTrigger:true}),100);
  assert.ok(result.hands.left.charge>0&&result.hands.right.charge>0);
  result=input.poll(desktopXRSample(),116);
  assert.equal(result.cast.hand,'right');assert.equal(result.cast.gesture,false);
  assert.equal(input.poll(desktopXRSample(),132).cast,null);
  input.poll(desktopXRSample({leftTrigger:true}),148);
  assert.equal(input.poll(desktopXRSample(),164).cast.hand,'left');
});
test('intentional bounded throw chooses velocity, while trigger-only mode keeps pointing aim',()=>{
  function release(mode){
    const i=new SparkXRInput();i.poll(desktopXRSample(),0);
    i.poll(desktopXRSample({rightTrigger:true}),16);
    const s=desktopXRSample();s.hands.right.grip[14]-=.04;
    return i.poll(s,32,{settings:{throwMode:mode}}).cast;
  }
  assert.equal(release('gesture').gesture,true);
  assert.equal(release('trigger').gesture,false);
  assert.equal(release('gesture').dx,1);
});
test('held controls on entry, interruption, pause and resume require neutral before casting',()=>{
  const i=new SparkXRInput();
  i.poll(desktopXRSample({rightTrigger:true}),0);
  assert.equal(i.poll(desktopXRSample(),16).cast,null);
  i.poll(desktopXRSample({rightTrigger:true}),32);
  assert.equal(i.poll(desktopXRSample({missingPose:true}),48).valid,false);
  i.poll(desktopXRSample({rightTrigger:true}),64);
  assert.equal(i.poll(desktopXRSample(),80).cast,null);
  i.poll(desktopXRSample({rightTrigger:true}),96,{active:false});
  i.poll(desktopXRSample({rightTrigger:true}),112);
  assert.equal(i.poll(desktopXRSample(),128).cast,null);
  i.poll(desktopXRSample({rightTrigger:true}),144);
  assert.ok(i.poll(desktopXRSample(),160).cast);
});
test('head jumps, boundary excursions and long gaps pause rather than granting motion or shots',()=>{
  for(const sample of [desktopXRSample({lean:.6}),{...desktopXRSample(),head:previewMatrix(0,1.65,1)},
    {...desktopXRSample(),head:previewMatrix(0,NaN)}]){
    const i=new SparkXRInput();i.poll(desktopXRSample(),0);
    assert.equal(i.poll(sample,16).valid,false);
  }
  const i=new SparkXRInput();i.poll(desktopXRSample(),0);
  assert.equal(i.poll(desktopXRSample(),1000).valid,false);
  i.recenter();assert.equal(i.poll(desktopXRSample(),1016).valid,true);
});
test('small physical lean and duck become bounded canonical pose, never a direct position write',()=>{
  const i=new SparkXRInput();i.poll(desktopXRSample(),0);
  const lean=i.poll(desktopXRSample({lean:.20,duck:.2}),50);
  assert.equal(lean.valid,true);assert.ok(Math.abs(lean.body.lateral-20)<1e-5);
  assert.ok(Math.abs(lean.body.height-45)<1e-5);assert.equal(lean.move,0);
  assert.ok(i.poll(desktopXRSample({controllerDuck:true}),100).body.height<=35);
  assert.deepEqual(xrSettings({movement:100,turn:NaN,posture:'floating'}),xrSettings());
});
test('snap turn and UI controls are edge-triggered and rearm only after neutral',()=>{
  const i=new SparkXRInput();i.poll(desktopXRSample(),0);
  const turned=i.poll(desktopXRSample({turn:1,pause:true}),16);
  assert.ok(Math.abs(turned.yaw-Math.PI/6)<1e-6);assert.equal(turned.pause,true);
  const held=i.poll(desktopXRSample({turn:1,pause:true}),32);
  assert.equal(held.yaw,turned.yaw);assert.equal(held.pause,false);
  i.interrupt();assert.equal(i.poll(desktopXRSample({pause:true}),48).pause,false);
  i.poll(desktopXRSample(),64);assert.equal(i.poll(desktopXRSample({pause:true}),80).pause,true);
});
test('spatial contracts fail closed for malformed body/aim and cannot inject damage or cooldown',()=>{
  assert.equal(duelSpatialInput({version:2,body}),null);
  assert.equal(duelSpatialInput(spatial({body:{...body,lateral:999}})),null);
  for(const bad of [{...aim,dx:NaN},{...aim,height:999},{...aim,dx:100}])
    assert.equal(duelSpatialInput(spatial({cast:true,aim:bad})).cast,false);
  const clean=duelSpatialInput(spatial({cast:true,aim:{...aim,damage:999,cooldown:0}}));
  assert.equal(clean.cast,true);assert.equal(clean.aim.damage,undefined);
  const m=createDuel({spatial:true});
  stepDuel(m,[{spatial:spatial({cast:true,aim:{...aim,damage:999,cooldown:0}})},{}],50);
  assert.equal(m.fighters[1].hp,100-DUEL_TECHNIQUES.spark.trace.damage);
  assert.ok(m.fighters[0].cooldown>200);
  assert.ok(m.fighters[0].meter>0,'canonical hit grants meter');
});
test('charge is cosmetic: miss spends canonical cooldown; repeated casts cannot bypass recovery',()=>{
  const adapter=new DuelXRAdapter();
  adapter.step(intent({cast:{...aim,dz:1,dx:0,damage:1e6,charge:100}}));
  assert.equal(adapter.match.fighters[0].cooldown,300);
  for(let i=0;i<100;i++)adapter.step(intent({cast:i%2?aim:null}));
  assert.equal(adapter.match.fighters[0].stats.specials,1);
  assert.equal(adapter.match.fighters[1].hp,100);
  assert.ok(adapter.match.fighters[0].cooldown>0);
});
test('arena edges reject an out-of-lane launch and clamp the head target inside canonical walls',()=>{
  const m=createDuel({spatial:true});m.fighters[0].x=45;
  stepDuel(m,[{spatial:spatial({body:{...body,forward:-35},cast:true,aim:{...aim,forward:-60}})},{}]);
  assert.equal(m.fighters[0].stats.specials,0);assert.equal(m.bolts.length,0);
  assert.equal(duelBody(m.fighters[0]).x,45);
  const i=new SparkXRInput();i.poll(desktopXRSample(),0);
  const invalid=desktopXRSample({rightTrigger:true});invalid.hands.right.grip[12]=3;
  assert.equal(i.poll(invalid,16).valid,false);
  for(const edge of [{y:65,z:264,vy:0,vz:10},{y:-94,z:0,vy:-10,vz:0},{y:199,z:0,vy:10,vz:0}]){
    const bounded=createDuel({spatial:true});
    bounded.bolts.push({owner:0,x:400,vx:0,life:90,damage:14,...edge});
    stepDuel(bounded,[{},{}]);assert.equal(bounded.bolts.length,0,'floor/wall/height boundary consumes the bolt');
  }
});
test('swept collisions catch fast crossings, and lean/duck misses leave HP unchanged',()=>{
  assert.equal(duelSpatialCollision({x:0,y:65,z:0},{x:1000,y:65,z:0},{x:500,y:65,z:0}),true);
  assert.equal(duelSpatialCollision({x:0,y:65,z:0},{x:1000,y:65,z:0},{x:500,y:35,z:30}),false);
  function hit(pose){
    const m=createDuel({spatial:true});m.bolts.push({owner:1,x:330,y:65,z:0,vx:-90,vy:0,vz:0,life:3,damage:14});
    stepDuel(m,[{spatial:spatial({body:pose})},{}]);return m.fighters[0].hp;
  }
  assert.equal(hit(body),86);assert.equal(hit({...body,lateral:30}),100);
  assert.equal(hit({...body,height:35}),100);
});
test('controller dodge changes collision geometry with canonical cooldown and no invulnerability',()=>{
  const m=createDuel({spatial:true});
  stepDuel(m,[{spatial:spatial({dodge:true,dodgeDirection:1})},{}]);
  assert.equal(duelBody(m.fighters[0]).z,45);assert.ok(m.fighters[0].dodgeCooldown>0);
  for(let i=0;i<25;i++)stepDuel(m,[{spatial:spatial({dodge:i%2===0})},{}]);
  assert.equal(duelBody(m.fighters[0]).z,0,'dodge ends despite repeated requests');
  assert.equal(m.events.filter(e=>e.type==='dodge').length,1);
  const exposed=createDuel({spatial:true});
  exposed.bolts.push({owner:1,x:330,y:65,z:45,vx:-90,vy:0,vz:0,life:3,damage:14});
  stepDuel(exposed,[{spatial:spatial({dodge:true,dodgeDirection:1})},{}]);
  assert.equal(exposed.fighters[0].hp,86,'a bolt aimed at the displaced target still hits');
});
test('enemy windup locks aim at startup; projectile travels along that visible line',()=>{
  const a=new DuelXRAdapter();a.step(intent());
  assert.ok(a.snapshot().windup);const locked=structuredClone(a.match.fighters[1].attack.aim);
  for(let i=0;i<43;i++)a.step(intent({body:{...body,lateral:30}}));
  const bolt=a.match.bolts.find(b=>b.owner===1);assert.ok(bolt);
  assert.equal(bolt.vz,locked.vz);assert.equal(bolt.vy,locked.vy);
  assert.ok(bolt.x<locked.x,'attack really moved, rather than applying deferred instant damage');
  for(let i=0;i<50;i++)a.step(intent({body:{...body,lateral:30}}));
  assert.equal(a.match.fighters[0].hp,100,'moving after the windup dodges its locked line');
});
test('a complete repeatable encounter wins two canonical rounds without mutating HP or rules',()=>{
  const a=new DuelXRAdapter();
  function play(){
    for(let i=0;i<15000&&a.match.phase!=='finished';i++){
      const p=a.match.fighters[0],e=a.match.fighters[1];
      // Lean after a windup starts; return when no incoming bolt remains.
      const evading=!!e.attack||a.match.bolts.some(b=>b.owner===1);
      const lateral=evading?30:0,dx=e.x-p.x-25,dz=-lateral,n=Math.hypot(dx,dz);
      a.step(intent({body:{...body,lateral},cast:p.cooldown===0&&!p.attack?
        {...aim,lateral,dx:dx/n,dz:dz/n}:null}));
    }
    assert.equal(a.match.phase,'finished');assert.equal(a.match.winner,0);
    assert.equal(a.match.fighters[0].rounds,2);assert.equal(a.match.recorded,false);
  }
  play();a.restart();assert.equal(a.match.fighters[0].hp,100);play();
});
test('classic Duel completely ignores the optional XR payload',()=>{
  const a=createDuel({seed:369,bot:true}),b=createDuel({seed:369,bot:true});
  for(let i=0;i<600;i++){
    const input={x:i%60<30?1:-1,light:i%45===0,special:i%180===0};
    stepDuel(a,[input,{}]);stepDuel(b,[{...input,spatial:spatial({cast:true,aim,dodge:true})},{}]);
  }
  assert.deepEqual(a,b);
});
test('arena and shared adapter preserve campaign, VR checkpoint and online/save isolation',()=>{
  const data=new Map([['spark-substrate-duels-v1','original'],['spark-substrate-descent-v2','campaign']]);
  const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
  saveVRCheckpoint(storage,createVRPreview());const before=[...data];
  const a=new DuelXRAdapter();for(let i=0;i<120;i++)a.step(intent({cast:i===0?aim:null}));
  a.restart();a.dispose();assert.deepEqual([...data],before);assert.ok(loadVRCheckpoint(storage));
  const descent=new DescentXRAdapter(),y=descent.state.run.player.y;
  descent.step(intent({descentMovement:{x:0,y:-1},dodge:true,cast:aim}));
  assert.ok(descent.state.run.player.y<y);assert.ok(descent.state.run.player.dashCooldown>0);
  for(const path of ['spark-xr-input.js','spark-xr-adapters.js','spark-xr-runtime.js','spark-ascension-app.js']){
    const source=readFileSync(new URL('../public/vr/'+path,import.meta.url),'utf8');
    assert.doesNotMatch(source,/localStorage|sessionStorage|fetch\(|sendBeacon|recordDuel\(/);
  }
});
test('render geometry contains both tracked hands, charge changes and bounded finite arena geometry',()=>{
  const i=new SparkXRInput();i.poll(desktopXRSample(),0);let input=i.poll(desktopXRSample(),16);
  const one=makeTrackedHandVertices({left:input.hands.left});const two=makeTrackedHandVertices(input.hands);
  assert.equal(two.length,one.length*2);assert.ok(two.every(Number.isFinite));
  i.poll(desktopXRSample({rightTrigger:true}),32);input=i.poll(desktopXRSample({rightTrigger:true}),100);
  assert.ok(makeTrackedHandVertices(input.hands).length>two.length);
  const scene=makeSceneVertices(new DuelXRAdapter().snapshot());
  assert.ok(scene.length>0&&scene.length<70000);assert.ok(scene.every(Number.isFinite));
  assert.equal(makeTrackedHandVertices({}).length,0);
});
test('world root anchors the collision target to actual head pose, including snap turns',()=>{
  const scene=new DuelXRAdapter().snapshot(),head=previewMatrix(.1,1.1,.2);
  scene.playerBody={x:300,y:45,z:30};const world=[.3,1.45,1.8];
  const mapped=transform4(xrWorldRoot(scene,{head,yaw:Math.PI/3}),world);
  for(let i=0;i<3;i++)assert.ok(Math.abs(mapped[i]-head[12+i])<1e-5);
});
test('runtime queues releases between 90Hz callbacks exactly once and pauses without catch-up',()=>{
  const r=runtime();r.pause(false);
  r.advance(0,desktopXRSample());r.advance(11,desktopXRSample({rightTrigger:true}));
  r.advance(22,desktopXRSample({rightTrigger:true}));r.advance(33,desktopXRSample());
  for(let i=4;i<20;i++)r.advance(i*11,desktopXRSample());
  assert.equal(r.adapter.match.fighters[0].stats.specials,1);
  const frame=r.adapter.match.frames;r.advance(220,desktopXRSample({missingPose:true}));
  assert.equal(r.paused,true);r.advance(2000,desktopXRSample());
  assert.equal(r.adapter.match.frames,frame);
  r.pause(false);r.advance(2016,desktopXRSample({rightTrigger:true}));
  r.advance(2032,desktopXRSample());assert.equal(r.adapter.match.fighters[0].stats.specials,1);
});
test('slow synthetic previews stay usable without relaxing physical XR cadence protection',()=>{
  const desktop=runtime();desktop.mode='desktop';desktop.pause(false);
  desktop.advance(0,desktopXRSample());desktop.advance(300,desktopXRSample());
  assert.equal(desktop.paused,false);
  const xr=runtime();xr.mode='xr';xr.pause(false);
  xr.advance(0,desktopXRSample());xr.advance(300,desktopXRSample());assert.equal(xr.paused,true);
});
test('comfort menu captures trigger input and exposes in-headset recenter/restart/exit',()=>{
  const r=runtime();r.advance(0,desktopXRSample());
  r.menuIndex=2;r.advance(16,desktopXRSample({rightTrigger:true}));
  assert.equal(r.settings.posture,'standing');assert.equal(r.adapter.match.frames,0);
  assert.ok(r.menu().some(([label])=>label==='Exit VR / preview'));
  assert.ok(r.menu().some(([label])=>label==='Restart isolated encounter'));
});
class Target {
  listeners=new Map();
  addEventListener(k,f){if(!this.listeners.has(k))this.listeners.set(k,new Set());this.listeners.get(k).add(f);}
  removeEventListener(k,f){this.listeners.get(k)?.delete(f);}
  emit(k){for(const f of [...this.listeners.get(k)||[]])f({preventDefault(){}});}
  count(){return [...this.listeners.values()].reduce((n,s)=>n+s.size,0);}
}
function fakeSession({fallback=false,reference}={}){
  const s=new Target(),space=new Target();s.visibilityState='visible';s.inputSources=[];
  s.requestAnimationFrame=()=>7;s.cancelAnimationFrame=()=>{s.cancelled=true;};s.updateRenderState=()=>{};
  s.requestReferenceSpace=async kind=>{if(fallback&&kind==='local-floor')throw Error('unsupported');return reference?await reference:space;};
  s.end=async()=>{s.emit('end');};return {s,space};
}
test('session lifecycle handles local fallback, reset, interruption, end, cleanup and reentry',async()=>{
  const {s,space}=fakeSession({fallback:true}),canvas=new Target();let disposed=0;
  const r=runtime({canvas,xr:()=>({requestSession:async()=>s}),
    makeRenderer:()=>({gl:{makeXRCompatible:async()=>{}},dispose:()=>disposed++}),makeLayer:()=>({})});
  assert.equal(await r.enter(),true);assert.equal(r.space,space);
  space.emit('reset');assert.equal(r.paused,true);
  r.pause(false);s.visibilityState='hidden';s.emit('visibilitychange');assert.equal(r.paused,true);
  await r.exit();assert.equal(disposed,1);assert.equal(s.count(),0);assert.equal(space.count(),0);
  assert.equal(canvas.count(),0);assert.equal(s.cancelled,true);
  assert.equal(await r.enter(),true);await r.dispose();assert.equal(disposed,2);
});
test('ending while reference-space setup is pending cannot resurrect stale XR resources',async()=>{
  let resolve;const reference=new Promise(r=>{resolve=r;}),{s,space}=fakeSession({reference});
  const r=runtime({canvas:new Target(),xr:()=>({requestSession:async()=>s}),
    makeRenderer:()=>({gl:{makeXRCompatible:async()=>{}},dispose(){}}),makeLayer:()=>({})});
  const entering=r.enter();await new Promise(r=>setImmediate(r));
  await r.exit();resolve(space);assert.equal(await entering,false);
  assert.equal(r.session,null);assert.equal(r.space,null);assert.equal(r.renderer,null);assert.equal(space.count(),0);
});
test('cancelled permission setup cannot start a late immersive session',async()=>{
  let resolve;const permission=new Promise(r=>{resolve=r;}),{s}=fakeSession();
  const r=runtime({xr:()=>({requestSession:()=>permission})});const entering=r.enter();
  await r.exit();resolve(s);assert.equal(await entering,false);assert.equal(r.mode,'idle');
});
test('missing haptics/audio and actuator rejections never affect gameplay',async()=>{
  const feedback=new XRFeedback(),settings=xrSettings();
  feedback.event({type:'hit'},new DuelXRAdapter().snapshot(),settings,[{},
    {gamepad:{hapticActuators:[{pulse:()=>Promise.reject(Error('disconnected'))}]}}]);
  feedback.listener({},null,0);feedback.dispose();await new Promise(r=>setImmediate(r));
});
