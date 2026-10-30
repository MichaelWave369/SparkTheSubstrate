import {desktopXRSample,previewMatrix} from '../public/vr/spark-xr-preview.js';
import {lookAt4,projection4} from '../public/vr/spark-vr-math.js';
export function questSample(options={}){
 const s=desktopXRSample(options);return s;
}
export function aimMatrix(origin,target){const d=target.map((v,i)=>v-origin[i]),n=Math.hypot(...d);return previewMatrix(...origin,Math.atan2(-d[0],-d[2]),Math.asin(d[1]/n));}
export function questViews(head){
 const eye=[head[12],head[13],head[14]],forward=[-head[8],-head[9],-head[10]];
 return [-.032,.032].map((offset,i)=>{const p=eye.map((v,k)=>v+head[k]*offset),projection=projection4(Math.PI/2.2,1,.04,25);projection[8]=i===0?.025:-.025;
  return {projection,inverse:lookAt4(p,p.map((v,k)=>v+forward[k])),viewport:{x:i*600,y:0,width:600,height:600}};});
}
