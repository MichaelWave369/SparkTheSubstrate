// Presentation targeting. Activation still calls canonical stepRun(interact).
import {worldAt} from './spark-vr-model.js';
export const XR_TARGETING_VERSION='spark.xr.target.v1';
export function inverseRigidPoint(root,p,direction=false){
  const x=p[0]-(direction?0:root[12]),y=p[1]-(direction?0:root[13]),z=p[2]-(direction?0:root[14]);
  return [root[0]*x+root[1]*y+root[2]*z,root[4]*x+root[5]*y+root[6]*z,root[8]*x+root[9]*y+root[10]*z];
}
function segmentBlocked(origin,target,obstacles){
  // A bounded sweep through the exact canonical box footprints, at hand height.
  const n=Math.ceil(Math.hypot(target[0]-origin[0],target[2]-origin[2])/.04);
  for(let i=1;i<n;i++){
    const t=i/n,x=(origin[0]+(target[0]-origin[0])*t)*100+480,
      y=(origin[2]+(target[2]-origin[2])*t)*100+300,height=origin[1]+(target[1]-origin[1])*t;
    if(height<1.2&&obstacles.some(b=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h))return true;
  }
  return false;
}
export function targetDescent(scene,hands,root){
  const hand=hands?.right,ray=hand?.ray;if(!ray)return null;
  const origin=inverseRigidPoint(root,[ray[12],ray[13],ray[14]]);
  const direction=inverseRigidPoint(root,[-ray[8],-ray[9],-ray[10]],true);
  const candidates=(scene.gates||[]).map(g=>({kind:'gate',id:g.direction,point:worldAt(g.position.x,g.position.y,1.2),
    label:g.toName,available:g.entry.available,reason:g.entry.reason||'Grip / A / E to cross',radius:.65}));
  for(const [kind,item]of [['key',scene.keyPickup],['relic',scene.relicPickup]])if(item)candidates.push({kind,id:kind,
    point:worldAt(item.x,item.y,.7),label:kind==='key'?'Canonical key':'Canonical relic',available:false,
    reason:'Move into contact to collect',radius:.25});
  let best=null;
  for(const c of candidates){
    const delta=c.point.map((v,i)=>v-origin[i]),t=delta.reduce((sum,v,i)=>sum+v*direction[i],0);
    if(t<.03||t>1.6||Math.hypot(...delta.map((v,i)=>v-direction[i]*t))>c.radius||segmentBlocked(origin,c.point,scene.obstacles||[]))continue;
    if(!best||t<best.distance)best={version:XR_TARGETING_VERSION,...c,distance:t};
  }
  return best;
}
