// Presentation targeting. Activation still calls canonical stepRun(interact).
import {worldAt} from './spark-vr-model.js';
import {trackedMatrix} from './spark-xr-input.js';
import {ATTACK_INTENT_VERSION} from '../attack-intent.js';
export const XR_TARGETING_VERSION='spark.xr.target.v1';
export const XR_ATTACK_PROJECTION_VERSION='spark.xr.planar-aim.v1';
// Invert the exact view-root yaw: 1 metre = 100 canonical units. Horizontal
// controller rays project onto the native X/Y combat plane. Height is visual;
// near-vertical rays fail closed rather than inventing anatomical 3D hitboxes.
export function projectAttackRay(run,input,{hand='right',assist=3,sequence=1,cast=null}={}){
 const head=trackedMatrix(input?.head),ray=trackedMatrix(input?.hands?.[hand]?.ray),
  grip=trackedMatrix(input?.hands?.[hand]?.matrix),yaw=input?.yaw;
 if(!input?.valid||input.ready===false||!head||!ray||!grip||!Number.isFinite(yaw))return null;
 if(Math.hypot(grip[12]-head[12],grip[13]-head[13],grip[14]-head[14])>1.4||
   Math.hypot(ray[12]-grip[12],ray[13]-grip[13],ray[14]-grip[14])>.25)return null;
 const c=Math.cos(yaw),s=Math.sin(yaw),dx=ray[12]-head[12],dz=ray[14]-head[14],
  x=(c*dx-s*dz)*100,y=(s*dx+c*dz)*100;
 let rx=c*-ray[8]-s*-ray[10],ry=s*-ray[8]+c*-ray[10];
 if(cast?.gesture&&Number.isFinite(cast.dx)&&Number.isFinite(cast.dz)){rx=cast.dz;ry=-cast.dx;}
 const length=Math.hypot(rx,ry);if(length<.2||Math.hypot(x,y)>75)return null;
 return {version:ATTACK_INTENT_VERSION,room:run.room,observedAt:run.time,sequence,
  origin:{x:run.player.x+x,y:run.player.y+y},direction:{x:rx/length,y:ry/length},targetId:null,assist,hand};
}
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
