// Original procedural art families. No simulation state, random source or assets.
import {pushBox,pushBeam,pushGem,pushRing,hex,tint} from './spark-vr-geometry.js';
import {pushArch,pushBevelBox,pushLimb} from './spark-vr-art.js';
export const WORLD_FAMILY_VERSION='spark.xr.world-family.v1';
export const WORLD_FAMILIES=Object.freeze({
 stratum:{motif:'conduit-vault',fog:[.012,.025,.04]},
 tideglass:{motif:'tidal-fins',fog:[.012,.045,.065]},
 verdant:{motif:'root-canopy',fog:[.018,.04,.027]},
 cinder:{motif:'furnace-works',fog:[.045,.019,.018]},
 prism:{motif:'split-reflections',fog:[.029,.019,.06]},
 orbit:{motif:'celestial-orbits',fog:[.008,.014,.047]},
 uncreated:{motif:'unfinished-echoes',fog:[.026,.025,.043]}
});
export const PRESERVED_ART_ROOMS=new Set(['threshold','glass','machine','forge','eye']);
export function worldFamily(s){return WORLD_FAMILIES[s.worldId]||WORLD_FAMILIES.stratum;}
export function roomArtSeed(id=''){let n=2166136261;for(const c of id)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
const quality=s=>s.quality==='performance'?0:s.quality==='high'?2:1;
const points=(n,fn)=>Array.from({length:n},(_,i)=>fn(i));
function path(v,ps,width,color){for(let i=1;i<ps.length;i++)pushBeam(v,ps[i-1],ps[i],width,color);}
function leaf(v,a,b,width,color){
 const m=a.map((x,i)=>(x+b[i])/2),ps=[a,[m[0]+width,m[1]+width*.18,m[2]],b,[m[0]-width,m[1]+width*.18,m[2]]];
 for(const face of [[0,1,2],[0,2,3],[2,1,0],[3,2,0]])for(const i of face)v.push(...ps[i],...color);
}
function orbit(v,r,y,tilt,segments,color,phase=0,broken=false){
 for(let i=0;i<segments;i++){
  if(broken&&i%4===0)continue;
  const a=i/segments*Math.PI*2+phase,b=(i+1)/segments*Math.PI*2+phase,
   p=t=>[Math.cos(t)*r,y+Math.sin(t)*tilt,Math.sin(t)*r*.75];
  pushBeam(v,p(a),p(b),.045,color);
 }
}
function wallRelief(v,id,side,x,stone,light,glow,detail,seed){
 const z=side*2.83,front=z-side*.11,dark=tint(stone,.85),metal=tint(light,.65);
 // Layered relief faces the interior on both long walls. Keeping its depth
 // under .15m leaves the entire canonical body and gate corridors untouched.
 if(id==='stratum'){
  for(let row=0;row<3;row++)pushBevelBox(v,x,.43+row*.72,z,1.37,.64,.12,tint(stone,1.9+(row%2)*.25));
  pushArch(v,x,1.68,front,.48,.72,metal,detail);
  pushGem(v,x,1.85,front,.07,.34,glow);
  for(const sign of [-1,1])pushBeam(v,[x+sign*.48,.6,front],[x+sign*.48,1.72,front],.035,glow);
 }else if(id==='tideglass'||id==='prism'){
  const crystal=[];pushGem(crystal,0,1.52,0,id==='prism'?.56:.40,2.35,tint(glow,.65));
  pushGem(crystal,.12,1.52,-.12,id==='prism'?.30:.20,1.85,tint(light,.9));
  for(let i=0;i<crystal.length;i+=6)v.push(x+crystal[i],crystal[i+1],z+crystal[i+2]*.18,...crystal.slice(i+3,i+6));
  if(id==='prism'){
   for(const sign of [-1,1])path(v,[[x,2.65,front],[x+sign*.66,1.52,front],[x,.39,front]],.022,metal);
  }else for(const sign of [-1,1])path(v,[[x+sign*.44,.4,front],[x+sign*.34,1.4,front],[x+sign*.48,2.65,front]],.018,tint(light,.75));
 }else if(id==='verdant'){
  const ps=[[x-.45,.06,z],[x-.34,.85,z],[x+.18,1.7,z],[x-.1,2.55,z]];
  for(let i=1;i<ps.length;i++)pushLimb(v,ps[i-1],ps[i],.11,.075,tint(stone,1.9),6);
  for(const sign of [-1,1]){
   pushLimb(v,[x,1.6,z],[x+sign*.54,2.2,z],.055,.02,metal,4);
   leaf(v,[x+sign*.2,1.25,front],[x+sign*.45,2.1,front],.24,tint(glow,.7));
   pushGem(v,x+sign*.43,.38,front,.045,.14,glow);
  }
 }else if(id==='cinder'){
  pushBevelBox(v,x,1.4,z,1.20,2.25,.12,dark);pushBox(v,x,1.4,front,.83,1.77,.025,tint(glow,.8));
  for(let i=0;i<6;i++)pushBeam(v,[x-.51,.6+i*.32,front-side*.035],[x+.51,.6+i*.32,front-side*.035],.045,metal);
  for(const sign of [-1,1])pushBeam(v,[x+sign*.58,.27,front],[x+sign*.58,2.55,front],.075,metal);
 }else if(id==='orbit'){
  pushRing(v,x,1.5,front,.57,metal,detail*2,true);pushRing(v,x,1.5,front,.43,glow,detail,true);
  for(let i=0;i<detail;i++){
   const a=i/detail*Math.PI*2+(seed%5)*.1;
   pushBeam(v,[x+Math.cos(a)*.28,1.5+Math.sin(a)*.28,front],[x+Math.cos(a)*.54,1.5+Math.sin(a)*.54,front],.015,tint(light,.65));
  }
  pushGem(v,x,1.5,front,.06,.17,light);
  pushBeam(v,[x,2.12,front],[x,2.7,front],.025,glow);
 }else{
  for(let i=0;i<3;i++){
   const offset=i%2?.18:-.12;pushBevelBox(v,x+offset,.47+i*.74,z,1.05-i*.16,.48,.10,i%2?metal:tint(stone,2));
   path(v,[[x-.6+offset,.28+i*.74,front],[x+.1+offset,.28+i*.74,front],[x+.1+offset,.66+i*.74,front]],.025,glow);
  }
 }
}
// All family solids are on the wall envelope or above y=2.65m. Floor inlays
// stay <=.03m. These meshes never add collision, cover, gates or interactables.
export function worldFamilyGeometry(s,stone,light,glow){
 const v=[],q=quality(s),detail=[6,10,16][q],seed=roomArtSeed(s.roomId),phase=(seed%17)*.11,
  dark=tint(stone,.75),metal=tint(light,.65),id=Object.hasOwn(WORLD_FAMILIES,s.worldId)?s.worldId:'stratum';
 const sides=new Set(s.gates.map(g=>g.direction));
 // Broad engraved slabs instead of graph paper. One top face per slab, no
 // hidden sides/bottoms, stable room-dependent stagger rather than RNG.
 for(let row=0;row<6;row++)for(let col=0;col<10;col++){
  const x=-4.18+col*.92,z=-2.35+row*.91,c=tint(stone,1.05+((col*7+row*3+seed)%5)*.08),a=.435,b=.42;
  for(const p of [[x-a,.007,z-b],[x+a,.007,z+b],[x+a,.007,z-b],[x-a,.007,z-b],[x-a,.007,z+b],[x+a,.007,z+b]])v.push(...p,...c);
 }
 // Native gates remain visible. Energy lives on the jambs, never as an opaque
 // portal plane through the opening. Color follows actual gate eligibility.
 for(const g of s.gates){
  const ns=['north','south'].includes(g.direction),x=ns?0:g.direction==='east'?4.66:-4.66,z=ns?(g.direction==='north'?-2.86:2.86):0,
   col=g.available?glow:tint(light,.4);
  for(const sign of [-1,1]){
   const at=y=>[x+(ns?sign*.93:0),y,z+(ns?0:sign*.93)];
   path(v,[at(.2),at(1.3),at(2.65)],.028,col);
  }
  pushGem(v,x,2.92,z,.14,.34,g.available?light:metal);
 }
 for(const side of [-1,1])for(const x of [-3.2,-1.6,0,1.6,3.2]){
  if(Math.abs(x)<1&&sides.has(side<0?'north':'south'))continue;
  wallRelief(v,id,side,x,stone,light,glow,detail,seed);
 }
 // Recessed wall relief repeats along the true exterior, avoiding gate axes.
 for(const side of [-1,1])for(const z of [-2.05,0,2.05]){
  if(z===0&&sides.has(side>0?'east':'west'))continue;
  const x=side*4.72;
  if(id==='stratum'){
   pushBevelBox(v,x,1.6,z,.23,3.2,.36,tint(stone,1.8));
   path(v,[[x-side*.13,.15,z-.12],[x-side*.13,1.6,z+.08],[x-side*.13,3.05,z-.12]],.025,glow);
   pushGem(v,x,2.65,z,.16,.5,light);
  }else if(id==='tideglass'){
   pushGem(v,x,1.65,z,.17,2.9,tint(glow,.8));
   pushGem(v,x-side*.08,1.8,z+.09,.10,2.1,tint(light,.9));
   pushBeam(v,[x-side*.15,.3,z],[x-side*.15,3,z+.1],.016,[.7,.97,.94]);
  }else if(id==='verdant'){
   const ps=[[x,.1,z],[x-side*.02,1.2,z+.07],[x,2.35,z-.06],[x-side*.07,3.25,z]];
   for(let i=1;i<ps.length;i++)pushLimb(v,ps[i-1],ps[i],.17-(i-1)*.025,.15-i*.025,tint(stone,1.9),q?6:4);
   for(const dz of [-.23,.23]){pushLimb(v,[x,2,z],[x-side*.04,2.65,z+dz],.06,.022,metal,4);leaf(v,[x-side*.05,2.5,z+dz],[x-side*.05,3,z+dz*1.7],.16,tint(glow,.8));}
  }else if(id==='cinder'){
   pushBevelBox(v,x,1.7,z,.24,3.4,.45,dark);
   for(const y of [.6,1.35,2.1,2.85])pushBox(v,x-side*.14,y,z,.025,.07,.42,metal);
   pushBeam(v,[x-side*.15,.3,z-.13],[x-side*.15,3.1,z-.13],.025,glow);
  }else if(id==='prism'){
   for(const dz of [-.14,.14]){pushGem(v,x,1.8,z+dz,.15,2.8,tint(light,dz>0?.6:.9));pushGem(v,x-side*.09,1.8,z+dz,.045,2.2,glow);}
  }else if(id==='orbit'){
   pushBeam(v,[x,.08,z],[x,3.25,z],.085,metal);
   for(const y of [.55,1.5,2.45])pushGem(v,x-side*.09,y,z,.085,.24,glow);
  }else{
   // The voids are intentional, stable gaps. No jitter or unstable flashing.
   for(let j=0;j<3;j++)pushBevelBox(v,x,j*1.1+.5,z+(j%2?.13:-.13),.22,.72,.28,j%2?metal:dark);
   pushGem(v,x-side*.08,2.98,z,.12,.45,glow);
  }
 }
 if(id==='stratum'){
  for(const z of [-1.9,1.9]){pushArch(v,0,3.05,z,4.4,1.5,metal,detail);pushArch(v,0,3.1,z,3.95,1.2,tint(glow,.6),detail);}
  for(const side of [-1,1])path(v,points(7,i=>[side*(.48+(i%2)*.1),.018,-2.5+i*.83]),.018,glow);
 }else if(id==='tideglass'){
  for(const z of [-1.8,0,1.8])path(v,points(detail+1,i=>{const x=-4.4+i/detail*8.8;return[x,3.5+Math.sin(i/detail*Math.PI)*.6,z+Math.sin(i*.8+phase)*.11];}),.07,tint(light,.7));
  for(const x of [-3.6,-1.8,1.8,3.6]){pushGem(v,x,3.7,-1.7,.22,1.2,glow);pushGem(v,x+.14,3.7,-1.68,.12,.8,light);}
  for(const z of [-1.75,-.6,.6,1.75])path(v,points(detail+1,i=>[-4.2+i/detail*8.4,.017,z+Math.sin(i/detail*Math.PI*3+phase)*.15]),.012,tint(glow,.7));
 }else if(id==='verdant'){
  for(const z of [-1.9,1.9])for(const sign of [-1,1]){
   const ps=[[sign*4.48,2.95,z],[sign*3.2,3.65,z+.2],[sign*1.4,4.1,z],[0,4.25,z-.1]];
   for(let i=1;i<ps.length;i++)pushLimb(v,ps[i-1],ps[i],.19-i*.025,.15-i*.025,tint(stone,1.6),q?6:4);
   for(const x of [1.5,3.1])leaf(v,[sign*x,3.8,z],[sign*(x-.5),4.45,z+.5],.35,tint(glow,.75));
  }
  for(const z of [-2.88,2.88])for(let i=0;i<5;i++){
   const x=-3.6+i*1.8;if(Math.abs(x)<.9&&sides.has(z<0?'north':'south'))continue;
   pushGem(v,x,.15,z,.10,.28,glow);
  }
 }else if(id==='cinder'){
  for(const x of [-3.5,3.5]){
   pushBevelBox(v,x,4.65,-3.9,.85,2,.8,dark);pushBevelBox(v,x,4.4,-3.46,.5,.7,.04,glow);
   for(let i=0;i<3;i++)pushBox(v,x,4.15+i*.25,-3.42,.55,.045,.035,metal);
  }
  for(const z of [-1.6,1.6]){pushBeam(v,[-4.4,3.3,z],[4.4,3.3,z],.14,metal);pushRing(v,0,3.6,z,.75,glow,detail);}
  for(const sign of [-1,1])path(v,points(7,i=>[sign*(2.85+(i%2)*.28),.017,-2.4+i*.8]),.02,tint(glow,.65));
 }else if(id==='prism'){
  for(const z of [-1.8,1.8])for(const sign of [-1,1]){
   path(v,[[sign*4.4,3.0,z],[sign*2.2,4.35,z],[0,3.65,z]],.09,metal);
   for(const x of [1.3,3.1]){pushGem(v,sign*x,3.7,z,.22,1.1,glow);pushGem(v,sign*(x+.13),3.7,z,.10,.8,light);}
  }
  for(const r of [.6,1.2,1.8])for(const sign of [-1,1])path(v,[[0,.017,-r],[sign*r,.017,0],[0,.017,r]],.014,tint(light,.65));
 }else if(id==='orbit'){
  orbit(v,3.2,4.2,.65,detail*2,metal);orbit(v,2.3,4.75,1.1,detail*2,glow,Math.PI/2);
  pushGem(v,0,4.65,0,.25,.8,light);
  for(let i=0;i<detail;i++){const a=i*2.3999+phase;pushGem(v,Math.cos(a)*4,3.8+(i%3)*.5,Math.sin(a)*2.5,.025,.09,[.75,.87,1]);}
  const ps=points(6,i=>[Math.sin(i*1.4+phase)*2.8,.017,-2.2+i*.85]);path(v,ps,.012,tint(light,.7));for(const p of ps)pushGem(v,p[0],.014,p[2],.025,.025,glow);
 }else{
  orbit(v,3.1,4.25,.65,detail*2,metal,phase,true);
  // Six recognizable remnants of created worlds, all over the arena.
  pushArch(v,-2.8,3.65,-1.3,.65,.7,metal,Math.max(4,detail/2));
  pushGem(v,-1.55,3.8,-1.3,.25,1.1,[.35,.75,.84]);
  leaf(v,[-.6,3.5,-1.3],[.2,4.2,-1.3],.3,[.4,.75,.48]);
  pushBevelBox(v,1.2,3.8,-1.3,.4,.65,.45,[.54,.32,.18]);
  pushGem(v,2.45,3.8,-1.3,.22,.9,[.65,.43,.87]);
  orbit(v,.65,4.25,.25,detail,[.55,.75,.9],phase,true);
  for(let i=0;i<5+q*2;i++){const a=i*2.3999+phase,x=Math.cos(a)*3.5,z=Math.sin(a)*2.0;
   path(v,[[x,3.1,z],[x+.35,3.1,z],[x+.35,3.65,z]],.065,i%2?glow:metal);}
 }
 return new Float32Array(v);
}
export function worldFamilyDynamics(v,s,light,glow){
 if(PRESERVED_ART_ROOMS.has(s.roomId))return;
 const q=quality(s),id=s.worldId,seed=roomArtSeed(s.roomId),time=s.reduced?0:s.time||0,
  activity=(s.effects||[]).some(e=>['power','unlock','wave'].includes(e.type)&&e.life>0)?1.08:1;
 // No ambient motion in reduced intensity. Essential native warnings/gates are
 // rendered elsewhere and are never removed by this cosmetic quality budget.
 if(!s.reduced)for(let i=0;i<[2,6,10][q];i++){
  const a=i*2.3999+(seed%19),x=Math.cos(a)*3.6,z=Math.sin(a)*2.1,
   y=2.85+((i*7)%11)*.055+Math.sin(time*.28+i)*.09;
  pushGem(v,x,y,z,id==='cinder'?.009:.014,id==='cinder'?.055:.07,tint(glow,.65*activity));
 }
 // A small bounded current on wall conduits; it stays on the exterior and
 // follows native activity only in color. No separate attack animation clock.
 for(const side of [-1,1])for(let i=0;i<(q===0?1:3);i++){
  const z=-1.9+i*1.9,y=1.5+(s.reduced?0:Math.sin(time*.25+i)*.1);
  pushGem(v,side*4.56,y,z,.024,.11,tint(glow,.75*activity));
 }
 if(id==='cinder'||id==='orbit'||id==='uncreated'){
  const spin=s.reduced?0:time*.055,r=id==='cinder'?.7:1.35;
  for(let i=0;i<(q===0?4:8);i++){const a=i*Math.PI/4+spin;
   pushBeam(v,[Math.cos(a)*r,3.85,Math.sin(a)*r*.7],[Math.cos(a+.2)*r,3.85,Math.sin(a+.2)*r*.7],.025,light);}
 }
}
