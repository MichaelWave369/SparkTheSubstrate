import test from 'node:test';import assert from 'node:assert/strict';
import {SparkXRInput,trackedMatrix} from '../public/vr/spark-xr-input.js';
import {SparkXRRuntime} from '../public/vr/spark-xr-runtime.js';
import {DescentXRAdapter,DuelXRAdapter} from '../public/vr/spark-xr-adapters.js';
import {createVRPreview} from '../public/vr/spark-vr-model.js';
import {previewMatrix} from '../public/vr/spark-xr-preview.js';
import {makeTrackedHandVertices} from '../public/vr/spark-vr-renderer.js';
import {xrCalibration,calibrateXRSource,presentCalibratedHands,storeXRCalibration,loadXRCalibration,XR_CALIBRATION_KEY} from '../public/vr/spark-xr-calibration.js';
import {xrPanelPose,panelFitsViews,hitXRPanel,xrPanelModel,XR_PANEL_PAGES} from '../public/vr/spark-xr-panel.js';
import {XRRealityDiagnostics} from '../public/vr/spark-xr-status.js';
import {legacyXRBridge} from '../public/vr/spark-vr-legacy-xr.js';
import {LivingSparkHost} from '../public/vr/spark-living-host.js';
import {transform4} from '../public/vr/spark-vr-math.js';
import {livingRoomGeometry} from '../public/vr/spark-room-themes.js';
import {questSample,questViews,aimMatrix} from './vr-reality-poses.mjs';
const silent={unlock(){},stop(){},event(){},listener(){},dispose(){}};
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-5,`${a} != ${b}`);
function runtime(adapter=new DescentXRAdapter()){const r=new SparkXRRuntime({adapter,feedback:silent});r.mode='desktop';r.pause(false);return r;}
test('Touch-like fixtures separate thumb-up grips from forward rays; calibration keeps raw grips and exact ray origins',()=>{
 const sample=questSample(),c=xrCalibration({scale:999,grip:{left:{height:.8,pitch:100}},ray:{left:{pitch:-999,yaw:7}}}),before=structuredClone(sample),next=calibrateXRSource(sample,c);
 assert.ok(Math.abs(sample.hands.left.grip[9]-sample.hands.left.ray[9])>.5);
 assert.equal(c.scale,1.2);assert.equal(c.grip.left.height,.04);assert.equal(c.ray.left.pitch,-12);
 assert.deepEqual(sample,before);assert.equal(next.hands.left.grip,sample.hands.left.grip);
 for(const side of ['left','right']){assert.ok(trackedMatrix(next.hands[side].ray));for(const i of [12,13,14])assert.equal(next.hands[side].ray[i],sample.hands[side].ray[i]);}
 const i=new SparkXRInput(),input=i.poll(next,0),visual=presentCalibratedHands(input.hands,c);
 assert.deepEqual(visual.left.matrix,input.hands.left.matrix);assert.notDeepEqual(visual.left.visualMatrix,input.hands.left.matrix);assert.ok(trackedMatrix(visual.left.visualMatrix));
});
test('gauntlets mirror the whole grip-local mesh with correct winding and human-scale bounds',()=>{
 const hand={matrix:previewMatrix(),ray:null,color:'#d5b36c',style:'lumen'},left=makeTrackedHandVertices({left:hand}),right=makeTrackedHandVertices({right:hand});
 assert.equal(left.length,right.length);assert.ok(right.every(Number.isFinite));
 const tuples=(v,sign)=>{const out=[];for(let i=0;i<v.length;i+=6)out.push([v[i]*sign,v[i+1],v[i+2]].map(x=>Math.round(x*1e5)).join(','));return out.sort();};
 assert.deepEqual(tuples(left,-1),tuples(right,1));
 for(let i=0;i<right.length;i+=6)assert.ok(Math.hypot(...right.slice(i,i+3))<.13);
 const moved=makeTrackedHandVertices({right:{...hand,matrix:previewMatrix(.12,.07,-.2)}});
 for(let i=0;i<right.length;i+=6){close(moved[i]-right[i],.12);close(moved[i+1]-right[i+1],.07);close(moved[i+2]-right[i+2],-.2);}
 assert.equal(makeTrackedHandVertices({left:{matrix:null}}).length,0);
});
test('loss of one pose pauses authority but the other current tracked hand keeps moving',()=>{
 const i=new SparkXRInput();i.poll(questSample(),0);const s=questSample({missingPose:true});s.hands.left.grip[12]-=.03;
 const a=i.poll(s,16);assert.equal(a.valid,false);assert.ok(a.hands.left);assert.equal(a.hands.right,undefined);assert.equal(a.uiReady,true);
 s.hands.left.grip[12]-=.02;const b=i.poll(s,32);close(b.hands.left.matrix[12]-a.hands.left.matrix[12],-.02);assert.equal(b.cast,null);
 delete s.hands.right;assert.equal(i.poll(s,48).status.code,'controller-disconnected');
});
test('neutral wait identifies held controls and conservative range checks remain active',()=>{
 const i=new SparkXRInput(),s=questSample({move:1,leftTrigger:true});s.hands.left.buttons[1]={pressed:true,value:1};
 const wait=i.poll(s,0);assert.equal(wait.ready,false);assert.match(wait.status.reason,/left trigger/);assert.match(wait.status.reason,/left grip/);assert.match(wait.status.reason,/move stick/);
 assert.equal(i.poll(questSample(),16).ready,true);
 const bad=questSample();bad.hands.left.axes[2]=2;assert.equal(i.poll(bad,32).status.code,'input-range');
 assert.equal(i.poll(questSample({lean:.7}),48).status.code,'safe-boundary');
});
test('small stick noise stays neutral with no locomotion; full radial input retains native speed cap',()=>{
 const i=new SparkXRInput();i.poll(questSample(),0);const noise=i.poll(questSample({move:.08,strafe:.08}),16);
 assert.equal(noise.ready,true);assert.deepEqual(noise.movement,{x:0,y:0});assert.equal(Math.abs(noise.move),0);
 const full=i.poll(questSample({move:1,strafe:1}),32);assert.ok(Math.hypot(full.movement.x,full.movement.y)<=.500001);
});
test('legitimate recovery requires tracking and neutral controls; charges cannot leak across missing poses',()=>{
 const r=runtime();r.advance(0,questSample());r.advance(16,questSample({rightTrigger:true}));r.advance(32,questSample({missingPose:true,rightTrigger:true}));
 assert.equal(r.paused,true);r.recoverControls();r.advance(48,questSample({rightTrigger:true}));assert.equal(r.paused,true);
 r.advance(64,questSample());assert.equal(r.paused,false);r.advance(81,questSample());assert.equal(r.adapter.state.run.stats.powers,0);
 r.advance(98,questSample({rightTrigger:true}));r.advance(115,questSample());assert.equal(r.adapter.state.run.stats.powers,1);
});
test('tracking jumps do not latch stale previous poses; boundary recovery still needs recenter',()=>{
 const i=new SparkXRInput();i.poll(questSample(),0);const jumped=questSample({lean:.4});assert.equal(i.poll(jumped,16).status.code,'tracking-jump');
 assert.equal(i.poll(jumped,32,{active:false}).valid,true);assert.equal(i.poll(questSample({lean:.7}),48).valid,false);
 i.recenter();const re=i.poll(questSample({lean:.7}),64);assert.equal(re.valid,true);assert.deepEqual(re.physicalDelta,{x:0,y:0});
});
test('a refused off-centre snap turn rolls back yaw instead of trapping future frames outside the envelope',()=>{
 const i=new SparkXRInput(),settings={turn:60};i.poll(questSample(),0,{settings});assert.equal(i.poll(questSample({lean:.44}),100,{settings}).valid,true);
 const blocked=i.poll(questSample({lean:.44,turn:1}),116,{settings});assert.equal(blocked.status.code,'safe-boundary');close(i.yaw,0);close(blocked.yaw,0);
 assert.equal(i.poll(questSample({lean:.44}),132,{settings,active:false}).valid,true);
});
test('panel has five pages, scrolls at most three actions and retains full canonical choice labels',()=>{
 const r=runtime(),s=r.adapter.snapshot(),menu=r.menu();
 assert.deepEqual(XR_PANEL_PAGES,['Combat','Inventory','World','Comfort','Session']);
 for(const page of XR_PANEL_PAGES){const p=xrPanelModel(menu,s,2,page);assert.ok(p.rows.length<=3);assert.ok(p.width<=.35);assert.ok(p.height<.27);}
 const choice={id:'continue',title:'Continue beyond the Eye'},p=xrPanelModel([[choice.title,()=>{}]],{choices:[choice]},0);assert.equal(p.page,'Combat');assert.equal(p.rows[0].label,choice.title);
});
test('active gameplay does not repeatedly build paused command menus or inventory snapshots',()=>{
 const r=runtime();let reads=0;r.menuExtras=()=>{reads++;return[];};for(let i=0;i<15;i++)r.advance(i*17,questSample());assert.equal(reads,0);
 r.pause(true);r.advance(260,questSample());assert.ok(reads>0);
});
test('both-eye frusta retain compact wrist/floating panels at realistic low, seated and overhead poses',()=>{
 for(const pitch of [-.6,0,1])for(const height of [1.1,1.65])for(const wristSide of ['left','right']){
  const head=previewMatrix(0,height,0,0,pitch),hands={};for(const side of ['left','right'])hands[side]={matrix:previewMatrix(side==='left'?-.1:.1,height-.2,-.7,0,1.25)};
  const views=questViews(head),p=xrPanelPose(head,hands,{wristSide},head,views);assert.ok(panelFitsViews(p.matrix,p.width,p.height,views));
  const floating=xrPanelPose(head,{}, {},head,views);assert.match(floating.attachment,/floating/);assert.ok(panelFitsViews(floating.matrix,floating.width,floating.height,views));
 }
});
test('wrist position tracks the actual controller and ray hits identify the existing command index',()=>{
 const head=previewMatrix(0,1.65),hands={left:{matrix:previewMatrix(-.1,1.45,-.7,0,1.25)}},views=questViews(head),p=xrPanelPose(head,hands,{},head,views);
 assert.equal(p.attachment,'left wrist');hands.left.matrix[13]+=.02;const moved=xrPanelPose(head,hands,{},head,views);close(moved.matrix[13]-p.matrix[13],.02);
 const model=xrPanelModel([['Resume',()=>{}],['Combat: Classic',()=>{}]],{},0),row=model.rows[1],
  point=transform4(p.matrix,[0,model.height*(.5-(row.y+20)/384),0]),ray=aimMatrix([.2,1.4,-.3],point),hit=hitXRPanel(p.matrix,ray,model);
 assert.equal(hit.kind,'row');assert.equal(hit.index,1);
});
test('menu transitions retain correct command selection and cannot queue a held attack',()=>{
 const r=runtime();r.advance(0,questSample());r.pause(true);r.menuIndex=0;
 r.advance(16,questSample({rightTrigger:true}));assert.equal(r.paused,false);r.advance(32,questSample({rightTrigger:true}));r.advance(48,questSample());
 assert.equal(r.adapter.state.run.stats.powers,0);r.advance(64,questSample({rightTrigger:true}));r.advance(81,questSample());assert.equal(r.adapter.state.run.stats.powers,1);
 const interrupted=runtime();interrupted.advance(0,questSample());interrupted.advance(16,questSample({missingPose:true}));
 const restored=interrupted.advance(32,questSample()).scene;
 assert.equal(restored.panel.page,'Diagnostics');assert.ok(restored.panel.rows.some(row=>row.selected));
 assert.match(interrupted.menu()[interrupted.menuIndex][0],/^Diagnostics:/);
});
test('pointing at a bottom menu row never scrolls more actions underneath a stationary ray',()=>{
 const r=runtime();r.pause(true);r.focusPage('Comfort');const first=r.advance(0,questSample()),model=first.scene.panel,row=model.rows[2],
  point=transform4(first.scene.panelPlacement.matrix,[0,model.height*(.5-(row.y+20)/384),0]),sample=questSample();
 sample.hands.right.ray=aimMatrix(sample.hands.right.ray.slice(12,15),point);
 let frame;for(let i=1;i<=8;i++)frame=r.advance(i*17,sample);
 assert.equal(r.menuIndex,row.global);assert.deepEqual(frame.scene.panel.rows.map(x=>x.label),model.rows.map(x=>x.label));
 assert.equal(frame.scene.panel.rows[2].selected,true);
});
test('native collision feedback observes a blocked request and clears on legal movement without changing the run rules',()=>{
 const a=new DescentXRAdapter();a.state.run.player.x=911;const intent={version:'spark.xr.input.v1',valid:true,body:{forward:0,lateral:0,height:65},movement:{x:1,y:0}};
 a.step(intent);assert.equal(a.state.run.player.x,911);assert.equal(a.motionStatus.blocked,true);a.step({...intent,movement:{x:-1,y:0}});assert.equal(a.motionStatus.blocked,false);assert.ok(a.state.run.player.x<911);
});
test('calibration is a frozen display context, not a new game, target or reward source',()=>{
 const r=runtime();r.advance(0,questSample());const before=structuredClone(r.adapter.state.run);r.setCalibration(true);
 for(let i=1;i<=120;i++)r.advance(i*16,questSample());
 assert.deepEqual(r.adapter.state.run,before);assert.equal(r.calibrating,true);assert.equal(r.paused,true);r.pause(false);assert.equal(r.calibrating,false);assert.equal(r.paused,true);
});
test('calibration preferences stay in a new namespace and cannot carry gameplay payloads',()=>{
 const map=new Map([['spark-substrate-descent-v2','original'],['spark-substrate-immersive-vr-v1','checkpoint']]),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};
 storeXRCalibration(storage,{scale:.9,damage:999,hp:999,wristSide:'right'});assert.equal(map.get('spark-substrate-descent-v2'),'original');assert.equal(map.get('spark-substrate-immersive-vr-v1'),'checkpoint');
 assert.equal(loadXRCalibration(storage).wristSide,'right');assert.equal(JSON.parse(map.get(XR_CALIBRATION_KEY)).options.damage,undefined);
 map.set(XR_CALIBRATION_KEY,'broken');assert.deepEqual(loadXRCalibration(storage),xrCalibration());
});
test('diagnostic exports allow only aggregate status, never poses, axes, identifiers or raw errors',()=>{
 const d=new XRRealityDiagnostics(),secret='PRIVATE_DEVICE_TOKEN';d.observe({session:'xr',mode:'descent',input:{valid:false,status:{code:secret},controllers:{left:{detected:true,grip:true,ray:true,pose:secret}},head:secret,axes:secret},error:secret});
 const report=JSON.stringify(d.snapshot());assert.ok(!report.includes(secret));for(const field of ['"head"','"axes"','"pose"','gameProgress'])assert.ok(!report.includes(field));assert.ok(report.includes('XR_ERROR'));
});
test('legacy bridge uses the same adapter and follows replaced canonical checkpoints',()=>{
 let state=createVRPreview(),saved=0;const r=legacyXRBridge({canvas:null,getState:()=>state,setState:s=>{state=s;},save:()=>saved++,restore(){},onStatus(){},onMode(){},onSnapshot(){},onFrame(){},onSession(){}});
 assert.ok(r.adapter instanceof DescentXRAdapter);r.menu().find(([label])=>label==='Save VR checkpoint')[1]();assert.equal(saved,1);
 state=createVRPreview(777);assert.equal(r.adapter.state.run.seed,777);assert.equal(r.adapter.snapshot().roomId,'threshold');
});
test('entry warmup can acquire neutral controllers once; later interruptions require an explicit recovery',async()=>{
 const session=new EventTarget(),space=new EventTarget();Object.assign(session,{inputSources:[],visibilityState:'visible',requestReferenceSpace:async()=>space,updateRenderState(){},requestAnimationFrame:()=>1,cancelAnimationFrame(){},end:async()=>session.dispatchEvent(new Event('end'))});
 const r=new SparkXRRuntime({adapter:new DuelXRAdapter(),feedback:silent,xr:()=>({requestSession:async()=>session}),makeRenderer:()=>({gl:{makeXRCompatible:async()=>{}},dispose(){}}),makeLayer:()=>({})});
 assert.equal(await r.enter(),true);const missing=questSample();missing.hands={};r.advance(0,missing);assert.equal(r.paused,true);
 r.advance(16,questSample({rightTrigger:true}));assert.equal(r.paused,true);r.advance(32,questSample());assert.equal(r.paused,false);
 r.advance(48,questSample({missingPose:true}));r.advance(64,questSample());assert.equal(r.paused,true);await r.exit();assert.equal(r.mode,'idle');
});
