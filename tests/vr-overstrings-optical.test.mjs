import test from "node:test";
import assert from "node:assert/strict";
import {JOINT_NAMES} from "../public/vr/vendor/gesture.mjs";
import {SparkOpticalHandObserver,readOpticalHands,diagnoseOpticalHands,OPTICAL_SOURCE_STATES,requestedXRFeatures,installSparkOpticalXR} from "../public/vr/spark-overstrings-hands.mjs";
import {createSparkEchoBridge} from "../public/vr/spark-overstrings-bridge.mjs";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

function opticalSource(side="left",missing=[]){
  return {handedness:side,hand:{get:name=>JOINT_NAMES.includes(name)&&!missing.includes(name)?name:null}};
}
const xyz=name=>{
  if(name==="wrist")return {x:0,y:0,z:0};
  if(name==="thumb-tip")return {x:-.04,y:.11,z:0};
  if(name==="index-finger-tip")return {x:-.04,y:.11,z:0};
  const columns={"index-finger":-.045,"middle-finger":-.02,"ring-finger":.02,"pinky-finger":.045};
  const f=Object.keys(columns).find(f=>name.startsWith(f));
  if(f)return {x:columns[f],y:name.endsWith("tip")?.11:name.endsWith("metacarpal")?.02:.04,z:0};
  return {x:-.025,y:.055,z:0};
};
function opticalFrame({emulated=false,fail=[]}={}){
  return {getJointPose:(joint,space)=>{
    if(!space||fail.includes(joint))return null;
    return {emulatedPosition:emulated,transform:{position:xyz(joint)}};
  }};
}
test("optical joint reader refuses controllers, missing sensors and emulated XR poses",()=>{
  const space={};
  assert.deepEqual(readOpticalHands({},space,[opticalSource()]),{left:null,right:null});
  assert.deepEqual(readOpticalHands(opticalFrame(),space,[{
    handedness:"left",gamepad:{mapping:"xr-standard"}}]),{left:null,right:null});
  assert.deepEqual(readOpticalHands(opticalFrame({emulated:true}),space,[opticalSource()]),{left:null,right:null});
  assert.deepEqual(readOpticalHands(opticalFrame({fail:["wrist"]}),space,[opticalSource()]),{left:null,right:null});
  const hands=readOpticalHands(opticalFrame(),space,[opticalSource("left"),opticalSource("right")]);
  assert.ok(hands.left?.wrist&&hands.right?.["thumb-tip"]);
  assert.equal(Object.keys(hands.left).length,JOINT_NAMES.length);
});
test("stable real-format left and right pinch produce bounded start events only",()=>{
  const seen=[],messages=[],armed={current:true};
  const observer=new SparkOpticalHandObserver({
    onGesture:event=>seen.push(event),onStatus:message=>messages.push(message),
    isArmed:()=>armed.current
  });
  const space={},frame=opticalFrame(),sources=[opticalSource("left"),opticalSource("right")];
  assert.equal(observer.observe({frame,space,sources,time:0}).tracked,0); // no session
  observer.sessionStart();
  assert.equal(observer.observe({frame,space,sources,time:0}).tracked,2);
  assert.equal(seen.length,0);
  assert.equal(observer.observe({frame,space,sources,time:135}).tracked,2);
  assert.deepEqual(seen.map(e=>e.handedness),["left","right"]);
  assert.ok(seen.every(e=>e.gesture==="pinch"&&e.phase==="start"&&e.source==="webxr"));
  observer.observe({frame,space,sources,time:300});
  assert.equal(seen.length,2,"one event while holding the gesture");
  armed.current=false;
  assert.equal(observer.observe({frame,space,sources,time:500}).tracked,0);
  observer.sessionEnd();
  assert.ok(messages.some(m=>m.includes("optical")||m.includes("Optical")));
  assert.match(messages.at(-1),/Last optical observation/);
});
test("tracking loss does not synthesize optical poses or generate extra starts",()=>{
  let count=0;
  const observer=new SparkOpticalHandObserver({onGesture:e=>{if(e.gesture==="pinch")count++;},isArmed:()=>true});
  const real=[opticalSource()],space={},frame=opticalFrame();
  observer.sessionStart();
  observer.observe({frame,space,sources:real,time:0});
  observer.observe({frame,space,sources:real,time:150});
  observer.observe({frame,space,sources:[],time:170});
  observer.observe({frame,space,sources:[],time:360});
  observer.observe({frame,space,sources:real,time:400});
  observer.observe({frame,space,sources:real,time:550});
  assert.equal(count,2,"new real pinch requires renewed dwell after loss");
});
test("one real-format pinch only yields cosmetic Spark echo when armed",()=>{
  const echoes=[],bridge=createSparkEchoBridge({onEcho:e=>echoes.push(e)});
  assert.equal(bridge.livePinch(500,"left").reason,"not_armed");
  bridge.arm({source:"webxr"});
  const allowed=bridge.livePinch(1000,"left");
  assert.equal(allowed.accepted,true);
  assert.equal(echoes[0].source,"webxr");
  assert.equal(echoes[0].action_id,"spark.cast");
  assert.equal("damage" in echoes[0],false);
  assert.equal(bridge.livePinch(1200,"right").reason,"not_armed");
  bridge.arm({source:"synthetic",allowSyntheticDemo:true});
  assert.equal(bridge.livePinch(3000,"right").reason,"source_mismatch");
  assert.equal(bridge.livePinch(NaN,"left").reason,"invalid_live_pinch");
});
test("XR request feature is off by default, on only for explicit observer opt-in",()=>{
  assert.deepEqual(requestedXRFeatures(["local-floor"]),["local-floor"]);
  assert.deepEqual(requestedXRFeatures(["local-floor"],false),["local-floor"]);
  assert.deepEqual(requestedXRFeatures(["local-floor"],true),["local-floor","hand-tracking"]);
});
test("Quest integration is isolated from controller input and has no network/storage path",()=>{
  const read=path=>readFileSync(fileURLToPath(new URL(path,import.meta.url)),"utf8");
  const hands=read("../public/vr/spark-overstrings-hands.mjs");
  const runtime=read("../public/vr/spark-xr-runtime.js");
  const app=read("../public/vr/spark-vr-app.js");
  const html=read("../public/vr/index.html");
  assert.doesNotMatch(runtime,/handObserver|hand-tracking/);
  assert.match(hands,/installSparkOpticalXR/);
  assert.match(hands,/getJointPose/);
  assert.match(app,/installSparkOpticalXR\(sharedXR,overstringsPilot\)/);
  assert.match(html,/overstrings-optical-status/);
  assert.doesNotMatch(hands,/fetch\(|localStorage|sessionStorage|postMessage|stepVRPreview/);
  assert.doesNotMatch(hands,/getUserMedia\s*\(|navigator\.mediaDevices|\.gamepad\b|input\.cast/);
});

test("sidecar preserves normal WebXR without an opt-in",async()=>{
 let args=null;
 const session={requestAnimationFrame(){},addEventListener(){}};
 const xr={requestSession:async(mode,options)=>{args=options;return session;}};
 const runtime={getXR:()=>xr,space:null};
 const restore=installSparkOpticalXR(runtime,{wantsHandTracking:()=>false});
 assert.equal(runtime.getXR(),xr);
 assert.equal(await runtime.getXR().requestSession("immersive-vr",{optionalFeatures:["local-floor"]}),session);
 assert.deepEqual(args.optionalFeatures,["local-floor"]);
 restore();
});
test("opted-in sidecar requests hand-tracking only and observes XRFrame",async()=>{
 let args=null,started=0,ended=0,observed=0;
 const listeners={},session={visibilityState:"visible",inputSources:[opticalSource()],
   callbacks:[],requestAnimationFrame(fn){this.callbacks.push(fn);return this.callbacks.length;},
   addEventListener(name,fn){listeners[name]=fn;}};
 const xr={requestSession:async(mode,opts)=>{args=opts;return session;}};
 const runtime={getXR:()=>xr,space:null};
 const pilot={wantsHandTracking:()=>true,sessionStart:()=>started++,
   sessionEnd:()=>ended++,observeXRFrame:()=>observed++};
 installSparkOpticalXR(runtime,pilot);
 assert.equal(await runtime.getXR().requestSession("immersive-vr",{optionalFeatures:["local-floor"]}),session);
 assert.deepEqual(args.optionalFeatures,["local-floor","hand-tracking"]);
 session.callbacks.shift()(0,opticalFrame());assert.equal(observed,0);
 runtime.space={};session.callbacks.shift()(140,opticalFrame());
 assert.equal(started,1);assert.equal(observed,1);
 listeners.end();assert.equal(ended,1);
});

test("real WebXR source states distinguish missing hand sources from missing joints",()=>{
  const space={},valid=opticalFrame(),left=opticalSource("left");
  assert.equal(OPTICAL_SOURCE_STATES.includes("valid"),true);
  assert.deepEqual(diagnoseOpticalHands(valid,space,[]).statuses,{
    left:"no_hand_source",right:"no_hand_source"
  });
  assert.equal(diagnoseOpticalHands({},space,[left]).statuses.left,"unavailable_frame");
  assert.equal(diagnoseOpticalHands(valid,null,[left]).statuses.left,"unavailable_frame");
  const noAPI={handedness:"left",hand:{}};
  assert.equal(diagnoseOpticalHands(valid,space,[noAPI]).statuses.left,"no_joint_api");
  assert.equal(diagnoseOpticalHands(valid,space,[opticalSource("left",["thumb-tip"])]).statuses.left,
    "missing_required_joints");
  assert.equal(diagnoseOpticalHands(opticalFrame({emulated:true}),space,[left]).statuses.left,
    "emulated_required_pose");
  const active=diagnoseOpticalHands(valid,space,[left]);
  assert.equal(active.statuses.left,"valid");
  assert.equal(active.statuses.right,"no_hand_source");
  assert.ok(active.hands.left.wrist);
  assert.equal(active.hands.right,null);
});
test("observer reports only per-side status enums, never joint data, to receipt listener",()=>{
  const samples=[];
  const observer=new SparkOpticalHandObserver({
    isArmed:()=>true,onSample:x=>samples.push(x)
  });
  observer.sessionStart();
  observer.observe({
    frame:opticalFrame(),space:{},sources:[opticalSource("left")],time:100
  });
  assert.equal(samples.length,1);
  assert.deepEqual(samples[0].statuses,{left:"valid",right:"no_hand_source"});
  assert.deepEqual(samples[0].tracked,{left:true,right:false});
  assert.deepEqual(Object.keys(samples[0]).sort(),["source","statuses","time","tracked"]);
  assert.equal(JSON.stringify(samples[0]).includes("thumb-tip"),false);
  assert.equal(JSON.stringify(samples[0]).includes("wrist"),false);
});
