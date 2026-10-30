import {hex,tint,pushGem,pushBeam} from './spark-vr-geometry.js';
import {pushBevelBox,pushLimb} from './spark-vr-art.js';
import {transform4} from './spark-vr-math.js';
export const XR_HAND_ART_VERSION='spark.xr.controller-gauntlet.v1';
// WebXR grip axes: -Z towards the thumb, +Y towards the arm; back of
// right/left hand faces +X/-X. These are controller gauntlets, not optical joints.
export function trackedGauntletVertices(hands={},reduced=false){
 const out=[];
 for(const side of ['left','right']){
  const hand=hands[side];if(!hand?.matrix)continue;
  const v=[],color=hex(hand.color),light=hex(hand.accent||hand.color),dark=tint(color,.27),charge=Math.max(0,Math.min(1,hand.charge||0)),
   pulse=hand.attacking?Math.sin((hand.attack||0)*Math.PI):0;
  pushBevelBox(v,.015,0,0,.045,.065,.087,dark,.22);
  pushBevelBox(v,.037,.003,0,.014,.052,.066,tint(color,.65),.22);
  // Curled fingers wrap a controller-sized grip; knuckles remain distinct.
  for(let i=0;i<4;i++){
   const z=-.037+i*.024,r=i===3?.006:.008,a=[.014,-.025,z],b=[-.022,-.043,z],c=[-.039,-.009,z];
   pushLimb(v,a,b,r,r*.9,tint(color,.5));pushLimb(v,b,c,r*.9,r*.75,tint(color,.7));
   pushGem(v,.021,-.032,z,r*1.15,r*1.8,light);
  }
  pushLimb(v,[.012,.022,-.043],[-.022,.003,-.055],.012,.009,tint(color,.75));
  pushLimb(v,[-.022,.003,-.055],[-.037,-.012,-.035],.009,.007,color);
  pushLimb(v,[.012,.025,.005],[.008,.069,.009],.025,.023,dark,8);
  for(let i=0;i<8;i++){const a=i*Math.PI/4,b=(i+1)*Math.PI/4;
   pushBeam(v,[.008+Math.cos(a)*.026,.059,.009+Math.sin(a)*.026],[.008+Math.cos(b)*.026,.059,.009+Math.sin(b)*.026],.004,light);}
  const r=.014+charge*.009+pulse*.006;
  pushGem(v,.053,.002,-.005,r,r*1.7,hand.recovering?tint(light,.5):light);
  const style=hand.style||'lumen';
  if(style==='prism')for(const z of [-.023,0,.023])pushGem(v,.048,.015,z,.008,.024,light);
  else if(style==='root')for(const sign of [-1,1])pushBeam(v,[.043,.025,0],[.052,.01,sign*.035],.006,color);
  else if(style==='crystal')for(const z of [-.026,.026])pushGem(v,.047,0,z,.013,.035,light);
  else if(style==='claw')for(const z of [-.027,0,.027])pushLimb(v,[.025,-.03,z],[.029,-.067-pulse*.02,z],.005,.0015,light);
  else if(style==='blade')pushBeam(v,[.047,.025,-.02],[.047,-.05-pulse*.035,-.02],.007,light);
  else for(let i=0;i<(reduced?2:4);i++){const a=i*Math.PI/2+charge;
   pushGem(v,.055,Math.cos(a)*.027,Math.sin(a)*.027,.004,.01,color);}
  if(charge>0)for(let i=0;i<(reduced?2:4);i++){const a=i*Math.PI/2+charge*2;
   pushGem(v,.055+charge*.008,Math.cos(a)*.037,Math.sin(a)*.037,.004,.01,light);}
  const matrix=hand.visualMatrix||hand.matrix,scale=hand.scale||1,mirror=side==='left'?-1:1;
  // Reflect the whole mesh, reversing triangle winding for correct culling.
  for(let i=0;i<v.length;i+=18)for(const j of (mirror<0?[0,12,6]:[0,6,12])){
   const k=i+j;out.push(...transform4(matrix,[v[k]*mirror*scale,v[k+1]*scale,v[k+2]*scale]),...v.slice(k+3,k+6));
  }
  // Pointing is a separate tracked ray, not a guessed grip direction.
  if(hand.ray){const ray=[];pushBeam(ray,[0,0,-.07],[0,0,-.32],.002,tint(color,.65));
   for(let i=0;i<ray.length;i+=6)out.push(...transform4(hand.ray,ray.slice(i,i+3)),...ray.slice(i+3,i+6));}
  if(hand.calibration)for(const [end,col]of [[[.08,0,0],[.9,.3,.25]],[[0,.09,0],[.3,.9,.5]],[[0,0,-.10],[.3,.6,1]]]){
   const axes=[];pushBeam(axes,[0,0,0],end,.003,col);for(let i=0;i<axes.length;i+=6)out.push(...transform4(hand.matrix,axes.slice(i,i+3)),...axes.slice(i+3,i+6));}
 }
 return new Float32Array(out);
}
