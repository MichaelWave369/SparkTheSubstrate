import {trackedMatrix} from './spark-xr-input.js';
import {multiply4} from './spark-vr-math.js';
export const XR_CALIBRATION_VERSION='spark.xr.calibration.v1';
export const XR_CALIBRATION_KEY='spark-substrate-xr-calibration-v1';
const bound=(n,a,b,f=0)=>Number.isFinite(n)?Math.max(a,Math.min(b,n)):f;
export function xrCalibration(raw={}){
 const out={version:XR_CALIBRATION_VERSION,scale:bound(raw.scale,.65,1.2,1),
  wristSide:raw.wristSide==='right'?'right':'left',panelMode:raw.panelMode==='floating'?'floating':'wrist',
  panelScale:bound(raw.panelScale,.85,1.15,1),grip:{},ray:{}};
 for(const side of ['left','right']){
  const g=raw.grip?.[side]||{},r=raw.ray?.[side]||{};
  out.grip[side]={height:bound(g.height,-.04,.04),depth:bound(g.depth,-.04,.04),pitch:bound(g.pitch,-25,25),roll:bound(g.roll,-25,25)};
  out.ray[side]={pitch:bound(r.pitch,-12,12),yaw:bound(r.yaw,-12,12)};
 }
 return out;
}
export function calibrationRotation(pitch=0,yaw=0,roll=0){
 const p=pitch*Math.PI/180,y=yaw*Math.PI/180,r=roll*Math.PI/180,
  cp=Math.cos(p),sp=Math.sin(p),cy=Math.cos(y),sy=Math.sin(y),cr=Math.cos(r),sr=Math.sin(r);
 return multiply4([cy,0,-sy,0,0,1,0,0,sy,0,cy,0,0,0,0,1],
  multiply4([1,0,0,0,0,cp,sp,0,0,-sp,cp,0,0,0,0,1],[cr,sr,0,0,-sr,cr,0,0,0,0,1,0,0,0,0,1]));
}
// Ray calibration changes orientation only. The current tracked origin and grip
// validation remain untouched, so calibration cannot extend native attack reach.
export function calibrateXRSource(sample,raw){
 const c=xrCalibration(raw),hands={};
 for(const side of ['left','right'])if(sample.hands?.[side]){
  const hand=sample.hands[side],ray=trackedMatrix(hand.ray),r=c.ray[side];
  const rotated=ray?Array.from(multiply4(ray,calibrationRotation(r.pitch,r.yaw))):null;
  if(rotated)for(const i of [12,13,14])rotated[i]=ray[i];
  hands[side]={...hand,ray:rotated};
 }
 return {...sample,hands};
}
export function presentCalibratedHands(hands,raw){
 const c=xrCalibration(raw),out={};
 for(const [side,hand] of Object.entries(hands||{})){
  if(!trackedMatrix(hand.matrix))continue;
  const g=c.grip[side],offset=calibrationRotation(g.pitch,0,g.roll);
  offset[13]=g.height;offset[14]=g.depth;
  out[side]={...hand,visualMatrix:multiply4(hand.matrix,offset),scale:c.scale};
 }
 return out;
}
export function loadXRCalibration(storage){
 try{const text=storage?.getItem?.(XR_CALIBRATION_KEY);if(!text||text.length>4096)return xrCalibration();
  const item=JSON.parse(text);return item.schema===XR_CALIBRATION_VERSION?xrCalibration(item.options):xrCalibration();
 }catch{return xrCalibration();}
}
export function storeXRCalibration(storage,raw){
 const options=xrCalibration(raw);storage?.setItem?.(XR_CALIBRATION_KEY,JSON.stringify({schema:XR_CALIBRATION_VERSION,options}));return options;
}
