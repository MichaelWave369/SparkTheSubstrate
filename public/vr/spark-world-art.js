import {pushBox,pushBeam,pushGem,pushRing,hex,tint} from './spark-vr-geometry.js';
import {pushArch,pushColumn,pushBevelBox,pushLimb} from './spark-vr-art.js';
import {worldAt} from './spark-vr-model.js';
export const WORLD_ART_VERSION='spark.xr.world-art.v1';
export const FOUNDATION_ROOMS=new Set(['threshold','glass','machine']);
export function foundationFloor(v,s,stone,light,glow){
 // Large fractured slate courses replace the graph-paper grid. Relief is flush
 // at foot level and adds no collision surfaces or route decisions.
 for(let row=0;row<7;row++)for(let col=0;col<11;col++){
  const x=-4.25+col*.85,z=-2.55+row*.85,variation=((col*17+row*31)%7)/28;
  // Hidden bottoms/sides are omitted: one octagonal top, 24 vertices per tile.
  const color=tint(stone,.95+variation),w=.405,b=.05,ring=[[-w+b,-w],[w-b,-w],[w,-w+b],[w,w-b],[w-b,w],[-w+b,w],[-w,w-b],[-w,-w+b]];
  for(let i=0;i<8;i++)for(const p of [[x,.0075,z],[x+ring[(i+1)%8][0],.0075,z+ring[(i+1)%8][1]],[x+ring[i][0],.0075,z+ring[i][1]]])v.push(...p,...color);
  if((col+row*3)%9===0)pushBeam(v,[x-.25,.007,z-.26],[x+.17,.007,z+.21],.009,tint(light,.45));
 }
 for(const side of [-1,1])for(let i=0;i<8;i++){
  const z=-2.4+i*.66;pushBeam(v,[side*.48,.012,z],[side*.48,.012,z+.38],.015,tint(glow,.7));
 }
}
export function foundationArchitecture(v,s,q,stone,light,glow){
 const gates=new Set(s.gates.map(g=>g.direction)),dark=tint(stone,.7),metal=tint(light,.65),segments=Math.max(8,q.detail);
 // Layered masonry belongs to the existing wall envelope, not the walk space.
 // Broad courses, recessed windows and occasional gold seams keep the distant
 // silhouettes readable without texture downloads or fragment-heavy shaders.
 const rows=q.detail<=6||s.roomId==='machine'?4:5;
 for(const side of [-1,1])for(let row=0;row<rows;row++)for(let col=0;col<12;col++){
  const x=-4.35+col*.79,y=.28+row*.58,z=side*2.94,
   gate=gates.has(side<0?'north':'south');
  if(gate&&Math.abs(x)<1.12&&y<3.05)continue;
  pushBevelBox(v,x,y,z,.75,.53,.09,tint(stone,1.7+((row+col*3)%5)*.13),.13);
  if((row*7+col)%11===0)pushBeam(v,[x-.19,y-.15,z-side*.057],[x+.14,y+.14,z-side*.057],.012,tint(light,.75));
 }
 for(const side of [-1,1])for(const x of [-2.7,2.7]){
  const z=side*2.82;pushArch(v,x,1.65,z,.44,.7,metal,8);
  pushGem(v,x,1.95,z,.17,.7,tint(glow,1.1));
  for(const dx of [-.43,.43])pushBeam(v,[x+dx,.9,z],[x+dx,1.7,z],.055,metal);
 }
 for(const side of [-1,1])for(const z of [-2.25,0,2.25]){
  if(z===0&&gates.has(side>0?'east':'west'))continue;
  pushColumn(v,side*4.6,z,3.3,tint(stone,1.4),metal);
 }
 // Portal ornaments sit on the real jambs or above head height. No portal plane
 // masquerades as a traversable door: the native lock bars remain in place.
 for(const g of s.gates){
  const horizontal=['north','south'].includes(g.direction),x=horizontal?0:g.direction==='east'?4.65:-4.65,
    z=horizontal?(g.direction==='north'?-2.85:2.85):0,axis=horizontal?'z':'x',col=g.available?glow:metal;
  pushArch(v,x,2.22,z,.86,.72,col,segments,axis);
  pushArch(v,x,2.22,z,1.02,.9,metal,segments,axis);
  pushGem(v,x,3.14,z,.11,.3,g.available?light:tint(light,.45));
  if(g.available)for(const radius of [.88,1])for(let i=0;i<12;i++){
   const a=i*Math.PI/6,b=(i+1)*Math.PI/6,
    point=(t,scale)=>[x+(horizontal?Math.cos(t)*.59*scale:0),1.24+Math.sin(t)*.90*scale,z+(horizontal?0:Math.cos(t)*.59*scale)],
    quad=[point(a,radius),point(b,radius),point(b,radius-.025),point(a,radius-.025)];
   // Thin, two-sided luminous ribbons rather than an opaque plane or blocker.
   for(const triangle of [[0,1,2],[0,2,3],[2,1,0],[3,2,0]])for(const k of triangle)v.push(...quad[k],...tint(glow,.95));
  }
 }
 if(s.roomId==='threshold'){
  // A broken cathedral vault, an open lantern and golden seams recall Spark's
  // poster. The native north gate remains the destination of the floor trail.
  for(const z of [-2.0,0,2.0]){
   pushArch(v,0,3.1,z,4.35,1.8,tint(light,.52),segments);
   pushArch(v,0,3.12,z,3.95,1.35,tint(glow,.45),segments);
   for(const side of [-1,1])pushBeam(v,[side*4.4,2.95,z],[side*2.5,4.5,z],.17,metal);
  }
  for(const radius of [.42,.68])pushRing(v,0,3.25,0,radius,metal,segments);
  pushGem(v,0,3.22,0,.18,.62,[1,.88,.5]);
  for(const [i,x]of [-5.6,0,5.6].entries()){
   const h=6.5+i*.7;pushBevelBox(v,x,h/2,-6.4,.65,h,.7,tint(stone,1.7));
   pushGem(v,x,h+.7,-6.4,.46,1.6,tint(light,.75));
   pushBeam(v,[x,h*.25,-6.02],[x,h-.1,-6.02],.025,glow);
  }
  for(const x of [-4.65,4.65])for(const z of [-1.8,1.8]){
   pushBevelBox(v,x,.23,z,.24,.46,.28,dark);pushGem(v,x,.65,z,.11,.28,glow);
  }
  for(let i=0;i<8;i++){
   const z=1.8-i*.52;pushBeam(v,[-.19,.018,z],[.19,.018,z-.22],.018,light);
  }
 }else if(s.roomId==='glass'){
  // Framed glass fins and a distant broken bridge give the causeway depth.
  for(const side of [-1,1])for(const z of [-2.2,-1.15,1.15,2.2]){
   const x=side*4.65;
   pushBevelBox(v,x,1.65,z,.16,3.3,.28,tint(glow,.45));
   pushBeam(v,[x,3.3,z],[side*2.45,4.15,z],.09,metal);
   pushGem(v,x,2.7,z,.16,.8,[.44,.87,.92]);
  }
  for(const z of [-1.65,0,1.65]){
   pushArch(v,0,3.05,z,4.3,1.1,tint(glow,.65),segments);
   pushBeam(v,[-4.2,3.1,z],[4.2,3.1,z],.045,metal);
  }
  for(const side of [-1,1])for(let i=0;i<6;i++)pushBevelBox(v,side*4.4,-.035,-2.4+i*.8,.2,.04,.7,tint(glow,.7));
 }else{
  // Brass, obsidian and a suspended processor. All moving machinery stays above
  // the body; canonical pillar footprints below are dressed separately.
  for(const x of [-3.8,3.8])for(const z of [-2.9,2.9]){
   pushColumn(v,x,z,3.3,tint(stone,1.5),metal);
   pushBeam(v,[x,3.3,z],[x*.5,4.3,z*.5],.18,tint(light,.65));
   for(let i=0;i<4;i++)pushBevelBox(v,x,1+i*.48,z,.34,.09,.34,i%2?glow:metal);
  }
  for(const r of [1.25,1.65,2.1])pushRing(v,0,3.5,0,r,r===1.65?glow:metal,segments);
  pushGem(v,0,3.5,0,.23,.7,glow);
  for(const side of [-1,1])for(let i=0;i<5;i++){
   const z=-2.4+i*1.2;pushBeam(v,[side*3.85,.014,z],[side*3.55,.014,z+.2],.025,light);
  }
 }
}
export function foundationDynamics(v,s,q,light,glow){
 if(!FOUNDATION_ROOMS.has(s.roomId))return;
 const spin=s.reduced?0:s.time*.13;
 if(s.roomId==='machine')for(let i=0;i<8;i++){
  const a=i*Math.PI/4+spin;
  pushBeam(v,[Math.cos(a)*.5,3.52,Math.sin(a)*.5],[Math.cos(a)*1.95,3.52,Math.sin(a)*1.95],.065,light);
  pushGem(v,Math.cos(a)*1.95,3.52,Math.sin(a)*1.95,.075,.24,glow);
 }else if(s.roomId==='threshold')for(let i=0;i<(s.reduced?3:6);i++){
  const a=i*Math.PI/3+spin;pushGem(v,Math.cos(a)*.75,3.2+(s.reduced?0:Math.sin(a)*.1),Math.sin(a)*.75,.035,.14,light);
 }
}
export function livingEnemyFigure(v,e,s){
 const [x,,z]=worldAt(e.x,e.y),base=hex(e.color||'#8eaca8'),gold=[.82,.65,.35],hot=e.windup>0?[1,.68,.3]:[.4,.85,.85],
  step=s.reduced?0:Math.sin((s.time||0)*5+(e.id||0))*.035;
 if(e.kind==='hound'){
  pushBevelBox(v,x,.28,z,.28,.28,.42,tint(base,.5));pushGem(v,x,.44,z+.19,.13,.28,hot);
  for(const side of [-1,1])for(const n of [-1,1])pushLimb(v,[x+side*.10,.24,z+n*.13],[x+side*.13,.035,z+n*.17],.037,.025,gold);
  return;
 }
 const mechanical=['archon','construct','turret'].some(k=>e.kind.includes(k));
 if(mechanical){
  pushBevelBox(v,x,.76+step,z,.32,.55,.25,tint(base,.45));pushGem(v,x,1.15+step,z,.18,.3,gold);
  pushGem(v,x,1.15+step,z+.17,.06,.10,hot);pushRing(v,x,.8+step,z,.29,gold,8);
  for(const side of [-1,1]){pushLimb(v,[x+side*.16,.95,z],[x+side*.34,.5+step,z],.055,.035,gold);pushLimb(v,[x+side*.09,.52,z],[x+side*.13,.05,z],.055,.04,tint(base,.5));}
 }else{
  pushGem(v,x,.62,z,.22,.95,tint(base,.45));pushGem(v,x,1.12+step,z,.17,.35,tint(base,.55));
  pushBevelBox(v,x,1.12+step,z+.12,.13,.15,.07,[.045,.065,.09]);pushBeam(v,[x-.05,1.13+step,z+.16],[x+.05,1.13+step,z+.16],.018,hot);
  for(const side of [-1,1]){
   const lift=e.windup>0?.18:step*side;
   pushLimb(v,[x+side*.16,.87,z],[x+side*.26,.46+lift,z+.08],.05,.03,tint(base,.7));
   pushGem(v,x+side*.26,.44+lift,z+.08,.035,.08,gold);
   pushLimb(v,[x+side*.08,.35,z],[x+side*.10,.04,z+step*side],.045,.035,tint(base,.45));
  }
 }
}
