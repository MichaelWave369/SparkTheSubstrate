/**
 * Opt-in Quest XRHand observation. No camera, Wi-Fi sensing, persistence or
 * gameplay command. Raw joints remain in this frame. MIT.
 */
import {JOINT_NAMES,GestureTracker} from "./vendor/gesture.mjs";
const SIDES=["left","right"];
const point=pose=>{
  const p=pose?.transform?.position;
  return p && [p.x,p.y,p.z].every(Number.isFinite) &&
    [p.x,p.y,p.z].every(v=>Math.abs(v)<100) ? {x:p.x,y:p.y,z:p.z}:null;
};
export function readOpticalHands(frame,space,sources) {
  const result={left:null,right:null};
  if(!frame||typeof frame.getJointPose!=="function"||!space)return result;
  for(const source of Array.from(sources||[])) {
    const hand=source?.hand,side=source?.handedness;
    if(!SIDES.includes(side)||result[side]||!hand||typeof hand.get!=="function")continue;
    const joints={};
    for(const name of JOINT_NAMES) {
      let pose=null;
      try {const joint=hand.get(name);if(joint)pose=frame.getJointPose(joint,space);}
      catch {/* Tracking dropout is not a synthetic pose. */}
      if(pose?.emulatedPosition===true)continue;
      const p=point(pose);if(p)joints[name]=p;
    }
    if(joints.wrist&&joints["thumb-tip"]&&joints["index-finger-tip"])result[side]=joints;
  }
  return result;
}
export class SparkOpticalHandObserver {
  constructor({onGesture=()=>{},onStatus=()=>{},onSample=()=>{},isArmed=()=>false}={}) {
    this.onGesture=onGesture;this.onStatus=onStatus;this.onSample=onSample;this.isArmed=isArmed;
    this.tracker=new GestureTracker({dwellMs:130,lostMs:200});
    this.reset();
  }
  reset(){this.tracker.reset();this.sessionActive=false;this.frames=0;this.lastStatus="";}
  sessionStart(){
    this.reset();this.sessionActive=true;
    this.report("XR session started; waiting for optical XRHand joints. Controller game input remains separate.");
  }
  sessionEnd(){
    const last=this.lastStatus;
    this.reset();
    // Keep only the final textual observation on the page for field testing,
    // never joint coordinates, trajectories, or a falsely claimed hardware pass.
    const real=last && !last.startsWith("XR session started");
    this.onStatus(real ?
      "XR ended. Last optical observation: "+last :
      "XR ended. No optical hand observation confirmed.");
  }
  report(message) {
    if(message!==this.lastStatus) {this.lastStatus=message;this.onStatus(message);}
  }
  observe({frame,space,sources,time,visible=true}={}) {
    if(!this.sessionActive||!this.isArmed()||visible===false||!Number.isFinite(time))
      return {tracked:0,events:[]};
    const hands=readOpticalHands(frame,space,sources);
    this.frames++;
    // Aggregate booleans only. The listener never receives joint coordinates.
    try {
      this.onSample({
        time,source:"webxr",
        tracked:{left:!!hands.left,right:!!hands.right}
      });
    } catch {/* optional diagnostics must not block optical observation */}
    const events=[];
    for(const side of SIDES) {
      for(const evt of this.tracker.update(side,hands[side],time,"webxr")) {
        events.push(evt);
        if(evt.phase==="start")this.onGesture(evt);
      }
    }
    const tracked=SIDES.filter(s=>hands[s]).length;
    if(tracked)this.report("Optical joints: "+SIDES.map(s=>hands[s]?
      (s+" "+this.tracker.active(s)):(s+" untracked")).join(" · ")+
      ". Experimental recognition; no game actions.");
    else this.report("No real XRHand joints. Try Quest hand-tracking settings; no fallback pose invented.");
    return {tracked,events};
  }
}

/**
 * Same-app opt-in WebXR sidecar. Wraps Spark's instance-local getXR factory,
 * never the protected runtime or the global navigator.xr object. MIT.
 */
export function requestedXRFeatures(features=[],enabled=false) {
  const base=Array.isArray(features)?features:[];
  return enabled?[...new Set([...base,"hand-tracking"])]:[...base];
}
export function installSparkOpticalXR(runtime,pilot) {
  if(!runtime||typeof runtime.getXR!=="function"||!pilot)
    throw new TypeError("Expected XR runtime and gesture preview");
  const original=runtime.getXR.bind(runtime);
  runtime.getXR=()=>{
    const xr=original();
    if(!xr||typeof xr.requestSession!=="function"||pilot.wantsHandTracking?.()!==true)
      return xr;
    return {requestSession:async(mode,options={})=>{
      const session=await xr.requestSession(mode,{
        ...options,optionalFeatures:requestedXRFeatures(options.optionalFeatures,true)
      });
      let active=true,started=false;
      session.addEventListener?.("end",()=>{
        active=false;if(started)pilot.sessionEnd?.();
      },{once:true});
      session.addEventListener?.("visibilitychange",()=>{
        if(session.visibilityState!=="visible")pilot.visibilityLost?.();
      });
      function observe(time,frame) {
        if(!active)return;
        try {
          if(!started&&runtime.space) {started=true;pilot.sessionStart?.();}
          if(started&&session.visibilityState==="visible"&&frame)
            pilot.observeXRFrame?.({time,frame,space:runtime.space,
              sources:session.inputSources,visible:true});
        } catch {/* optional observer cannot terminate Spark's render loop */}
        if(active)session.requestAnimationFrame(observe);
      }
      session.requestAnimationFrame(observe);
      return session;
    }};
  };
  return ()=>{runtime.getXR=original;};
}
