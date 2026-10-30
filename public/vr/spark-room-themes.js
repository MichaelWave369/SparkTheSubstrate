import {FOUNDATION_ROOMS,foundationFloor,foundationArchitecture,foundationDynamics} from './spark-world-art.js';
import {pushBevelBox} from './spark-vr-art.js';
import {pushBox,pushBeam,pushGem,pushRing,hex,tint} from './spark-vr-geometry.js';
import {worldAt} from './spark-vr-model.js';
export const ROOM_THEME_VERSION='spark.xr.room-theme.v1';
export const XR_QUALITY=Object.freeze({
  performance:Object.freeze({detail:6,particles:6,scale:.7,far:18}),
  balanced:Object.freeze({detail:12,particles:16,scale:.85,far:25}),
  high:Object.freeze({detail:20,particles:28,scale:1,far:32})
});
export const ROOM_THEMES=Object.freeze({
  stratum:{stone:'#20323c',light:'#f4cc83',glow:'#6ddbd0'},
  tideglass:{stone:'#173a4c',light:'#94e5ee',glow:'#66a7ec'},
  verdant:{stone:'#263f33',light:'#b5da85',glow:'#6ad8ab'},
  cinder:{stone:'#44302d',light:'#f2b16a',glow:'#e57a49'},
  prism:{stone:'#30324c',light:'#d7b5ee',glow:'#7ca7df'},
  orbit:{stone:'#2e3d52',light:'#dbe6f3',glow:'#7dcbeb'},
  uncreated:{stone:'#383a3c',light:'#ffdfa4',glow:'#8be9d2'}
});
const WORLD_IDS=['stratum','tideglass','verdant','cinder','prism','orbit','uncreated'];
const SHOWCASE={threshold:{stone:'#303239',light:'#f4d08a',glow:'#b5dbc5'},
  glass:{stone:'#1d3549',light:'#b2e9f0',glow:'#59c4dd'},machine:{stone:'#272c3d',light:'#e4ab64',glow:'#69dfc5'},
  forge:{stone:'#392c32',light:'#f3c181',glow:'#ef874c'},eye:{stone:'#171923',light:'#f6d28a',glow:'#c39c43'}};
export function roomTheme(scene){return {version:ROOM_THEME_VERSION,...(ROOM_THEMES[scene.worldId]||ROOM_THEMES[WORLD_IDS[scene.worldRank]]||ROOM_THEMES.stratum),
  ...(SHOWCASE[scene.roomId]||{}),
  showcase:['threshold','glass','machine','forge','eye'].includes(scene.roomId)?scene.roomId:'world'};}
const cache=new Map();
export function clearRoomGeometryCache(){cache.clear();}
export function roomGeometryKey(s){return JSON.stringify([ROOM_THEME_VERSION,s.roomId,s.worldId,s.quality||'balanced',
  s.gates.map(g=>[g.direction,g.available]),s.obstacles]);}
export function livingRoomGeometry(s){
  const key=roomGeometryKey(s);if(cache.has(key))return cache.get(key);
  const v=[],theme=roomTheme(s),stone=hex(theme.stone),light=hex(theme.light),glow=hex(theme.glow),q=XR_QUALITY[s.quality]||XR_QUALITY.balanced;
  pushBox(v,0,-.10,0,9.6,.20,6,tint(stone,.65));
  // Floor inlays are flush; all new solid architecture is beyond the legal body
  // footprint or above head height. Cover uses the exact canonical footprints.
  if(FOUNDATION_ROOMS.has(s.roomId))foundationFloor(v,s,stone,light,glow);
  else for(let x=-4.25;x<4.3;x+=.5)pushBox(v,x,.004,0,.009,.008,5.18,tint(glow,.35));
  if(!FOUNDATION_ROOMS.has(s.roomId))for(let z=-2.5;z<2.6;z+=.5)pushBox(v,0,.005,z,8.6,.009,.008,tint(light,.22));
  const sides=new Set(s.gates.map(g=>g.direction));
  for(const axis of ['x','z'])for(const side of [-1,1]){
    const dir=axis==='x'?(side<0?'west':'east'):(side<0?'north':'south'),edge=(axis==='x'?4.8:3)*side;
    const length=axis==='x'?6:9.6;
    if(sides.has(dir))for(const sign of [-1,1])pushBox(v,axis==='x'?edge:sign*(length/4+.45),1.8,axis==='x'?sign*(length/4+.45):edge,
      axis==='x'?.18:length/2-.9,3.6,axis==='x'?length/2-.9:.18,stone);
    else pushBox(v,axis==='x'?edge:0,1.8,axis==='x'?0:edge,axis==='x'?.18:length,3.6,axis==='x'?length:.18,stone);
  }
  for(const gate of s.gates){
    const horizontal=['north','south'].includes(gate.direction),x=horizontal?0:gate.direction==='east'?4.65:-4.65,
      z=horizontal?(gate.direction==='north'?-2.85:2.85):0,col=gate.available?glow:tint(light,.58);
    for(const side of [-1,1]){
      pushBox(v,x+(horizontal?side*.84:0),1.28,z+(horizontal?0:side*.84),horizontal?.13:.28,2.56,horizontal?.28:.13,col);
      pushGem(v,x+(horizontal?side*.84:0),2.7,z+(horizontal?0:side*.84),.12,.35,light);
    }
    pushBox(v,x,2.55,z,horizontal?1.8:.25,.13,horizontal?.25:1.8,col);
    pushBox(v,x,.018,z,horizontal?1.5:.28,.025,horizontal?.28:1.5,tint(col,.7));
    if(!gate.available)for(let k=0;k<5;k++)pushBox(v,x,.3+k*.42,z,horizontal?1.5:.018,.012,horizontal?.018:1.5,tint(light,.45));
  }
  for(const o of s.obstacles){
    const [x,,z]=worldAt(o.x+o.w/2,o.y+o.h/2);
    pushBevelBox(v,x,.58,z,o.w/100,1.16,o.h/100,tint(stone,1.6),.13);
    pushBox(v,x,.99,z,o.w/100,.045,o.h/100,glow);
    pushGem(v,x,1.16,z,Math.min(o.w,o.h)/240,.32,light);
  }
  // Tall peripheral ribs frame every real room across all seven worlds.
  if(!FOUNDATION_ROOMS.has(s.roomId))for(const x of [-4.55,4.55])for(let i=0;i<5;i++){
    const z=-2.2+i*1.1;
    if(Math.abs(z)<.01&&sides.has(x>0?'east':'west'))continue;
    pushBox(v,x,1.65,z,.30,3.3,.28,tint(stone,1.6));
    pushBox(v,x,2.85,z,.36,.12,.38,light);
    pushBox(v,x,1.6,z,.035,2.3,.31,tint(glow,.8));
  }
  if(!FOUNDATION_ROOMS.has(s.roomId))for(const z of [-2.72,2.72])for(const x of [-3.8,-2.0,2.0,3.8]){
    pushBeam(v,[x,3.15,z],[x*.62,4.15,z],.14,tint(light,.6));
    pushGem(v,x,2.5,z,.17,.75,tint(glow,.9));
  }
  if(FOUNDATION_ROOMS.has(s.roomId)){
    foundationArchitecture(v,s,q,stone,light,glow);
  }else if(s.roomId==='forge'){
    // All forge structures are overhead or outside the legal body footprint.
    for(const side of [-1,1])for(const z of [-2.15,0,2.15]){
      const x=side*4.5;
      pushBox(v,x,1.7,z,.34,3.4,.5,tint(stone,1.7));
      pushBeam(v,[x,3.25,z],[side*2.0,4.1,z],.28,tint(stone,2));
      pushBox(v,x,1.8,z,.37,2.2,.06,glow);
      for(let i=0;i<3;i++)pushRing(v,x,.6+i*.9,z,.30,light,q.detail);
    }
    pushRing(v,0,3.5,0,2.2,tint(light,.7),q.detail);
    pushRing(v,0,3.7,0,1.55,tint(glow,.7),q.detail);
    for(const radius of [1,1.5,2.15])pushRing(v,0,.012,0,radius,tint(light,.35),q.detail);
    for(const z of [-2.55,2.55])pushBeam(v,[-4.25,.025,z],[4.25,.025,z],.045,glow);
  }else if(s.roomId==='eye'){
    for(const side of [-1,1])for(const z of [-2.2,0,2.2]){
      if(z===0&&sides.has(side>0?'east':'west'))continue;
      const x=side*4.65;
      pushBox(v,x,1.8,z,.4,3.6,.44,tint(stone,1.7));
      pushBox(v,x,1.9,z,.43,2.5,.055,tint(light,.7));
      pushBeam(v,[x,3.4,z],[side*2.1,4.65,z],.2,tint(light,.7));
      pushGem(v,x,3.65,z,.22,.7,light);
    }
    for(const radius of [1.3,2.1,2.55])pushRing(v,0,.012,0,radius,tint(light,.28),q.detail);
    pushRing(v,0,4.5,-.5,3.1,tint(light,.65),q.detail);
    pushRing(v,0,5.1,-.5,2.3,tint(glow,.7),q.detail);
    // Obsidian plinths and golden glyph strokes stay outside the playable body.
    for(const x of [-4.35,4.35])for(let i=0;i<6;i++){
      const z=-2.2+i*.88;
      pushBeam(v,[x,.03,z-.15],[x-.12*Math.sign(x),.03,z],.025,light);
      pushBeam(v,[x-.12*Math.sign(x),.03,z],[x,.03,z+.15],.025,light);
    }
  }else{
    for(let i=0;i<q.detail/2;i++){
      const a=i/Math.max(1,q.detail/2)*Math.PI*2;
      pushGem(v,Math.cos(a)*1.45,3.5,Math.sin(a)*1.45,.13,.5,light);
    }
  }
  const result=new Float32Array(v);cache.set(key,result);
  if(cache.size>4)cache.delete(cache.keys().next().value);
  return result;
}
export function livingDynamicGeometry(v,s){
  const q=XR_QUALITY[s.quality]||XR_QUALITY.balanced,theme=roomTheme(s),glow=hex(theme.glow),light=hex(theme.light);
  foundationDynamics(v,s,q,light,glow);
  if(s.roomId==='forge'){
    const boss=s.guardians?.find(g=>g.kind==='cantor'),second=boss?.stage===2,
      spin=s.reduced?0:s.time*(second?.26:.14),heat=boss?.windup>0?1.25:.7;
    for(let i=0;i<6;i++){
      const a=i*Math.PI/3+spin;
      pushBeam(v,[Math.cos(a)*.65,3.55,Math.sin(a)*.65],[Math.cos(a)*2.15,3.55,Math.sin(a)*2.15],.13,tint(light,heat));
      pushGem(v,Math.cos(a)*2.1,3.40,Math.sin(a)*2.1,.17,.4,glow);
    }
  }
  if(s.roomId==='eye')eyeMechanisms(v,s,q,light,glow);
  for(const enemy of s.enemies.slice(0,24))if(enemy.windup>0){
    const [x,,z]=worldAt(enemy.x,enemy.y),r=(enemy.r||18)/100+.13;
    pushRing(v,x,.035,z,r,[1,.55,.25],q.detail);
    if(Number.isFinite(enemy.chargeX)&&Number.isFinite(enemy.chargeY))pushBeam(v,[x,.045,z],
      [x+enemy.chargeX*1.2,.045,z+enemy.chargeY*1.2],.035,[1,.62,.3]);
  }
  for(const fx of (s.effects||[]).slice(-(s.reduced?4:q.particles))){
    const [x,,z]=worldAt(fx.x,fx.y),col=hex(fx.color),life=Math.max(0,Math.min(1,1-fx.life/(fx.maxLife||Math.max(.1,fx.life)))),r=Math.min(2.5,(fx.r||20)/100);
    if(['wave','power','slash'].includes(fx.type)){
      const segments=fx.type==='slash'?Math.max(3,q.detail/2):q.detail;
      for(let i=0;i<segments;i++){
        const a=fx.type==='slash'?Math.atan2(s.facing?.y||0,s.facing?.x||1)-1.52+i/Math.max(1,segments-1)*3.04:i/q.detail*Math.PI*2;
        pushGem(v,x+Math.cos(a)*r*(.65+life*.35),.28+life*.25,z+Math.sin(a)*r*(.65+life*.35),.035,.12,col);
      }
    }else pushGem(v,x,.7+life*.45,z,.06*(1-life),.14*(1-life),col);
  }
  if(s.transform>0&&!s.reduced){const [x,,z]=worldAt(s.player.x,s.player.y);pushRing(v,x,.15,z,.6+(1-s.transform)*.5,hex(s.vessel.color),q.detail);}
  if(!s.reduced)for(let i=0;i<q.particles;i++){
    const a=i*2.3999,x=Math.cos(a)*4.1,z=Math.sin(a)*2.45,y=2.4+Math.sin(s.time*.2+i)*.25;
    pushGem(v,x,y,z,.012,.035,tint(glow,.6));
  }
  if(s.target){const p=s.target.point;pushRing(v,p[0],.025,p[2],.28,s.target.available?glow:light,q.detail);}
  if(s.combatProfile==='spellcraft'&&s.aim?.draft&&!s.paused){
    const aim=s.aim,draft=aim.draft,target=s.enemies.find(e=>e.id===aim.targetId),
      point=aim.blockedPoint||target||{x:draft.origin.x+draft.direction.x*Math.min(s.attackReach,450),y:draft.origin.y+draft.direction.y*Math.min(s.attackReach,450)},
      origin=worldAt(draft.origin.x,draft.origin.y,aim.visualOriginHeight??.85),end=worldAt(point.x,point.y,.85),
      col=!aim.valid||aim.blocked?[1,.4,.28]:target?[.55,1,.75]:[.38,.65,.68];
    const count=s.reduced?4:8;
    for(let i=0;i<count;i++){
      const t=i/count,u=(i+.4)/count;
      pushBeam(v,origin.map((v,k)=>v+(end[k]-v)*t),origin.map((v,k)=>v+(end[k]-v)*u),.009,col);
    }
    pushRing(v,end[0],.035,end[2],target?.28:.14,col,q.detail);
    if(target){pushGem(v,end[0],1.4,end[2],.07,.16,col);}
    if(['cleave','wave'].includes(s.weapon.style)){
      const [x,,z]=worldAt(s.player.x,s.player.y),r=s.attackReach/100;
      if(s.weapon.style==='wave')pushRing(v,x,.025,z,r,tint(col,.55),q.detail);
      else for(const side of [-1,1]){const angle=Math.atan2(draft.direction.y,draft.direction.x)+side*1.52;
        pushBeam(v,[x,.03,z],[x+Math.cos(angle)*r,.03,z+Math.sin(angle)*r],.015,tint(col,.65));}
    }
  }
  if(s.attackResult?.life>0){const result=s.attackResult,[x,,z]=worldAt(result.x??s.player.x,result.y??s.player.y),
    col=result.type==='hit'?[.7,1,.85]:[.9,.5,.33];
    pushRing(v,x,.07,z,.12+(.5-result.life)*.45,col,s.reduced?6:q.detail);
  }
}
// Presentation only. Canonical observations select the phase, charge and defeat;
// time merely moves bounded decorative geometry, never an attack or hitbox.
function eyeMechanisms(v,s,q,light,glow){
  const boss=s.guardians?.find(g=>g.kind==='warden'),visual=s.guardianVisual||{},second=boss?.stage===2||visual.stage===2,
    defeated=visual.defeated===true,age=defeated?Math.max(0,(visual.victoryDuration||2.8)-(visual.victory||0)):0,
    intensity=s.reduced?.65:1,hot=second?[1,.43,.22]:light,
    charge=boss?.windup>0?1-boss.windup/boss.windupTotal:0,
    spin=s.reduced?0:s.time*(second?.2:.1)+(defeated?age*.3:0),segments=q.detail*2,eye=[];
  // A broken Eye stays broken after legitimate victory, including restored saves.
  for(let i=0;i<segments;i++){
    if(defeated&&i%5===0)continue;
    const a=i/segments*Math.PI*2,b=(i+1)/segments*Math.PI*2,shift=defeated?(i%3-1)*Math.min(age,.6)*.22:0;
    const point=t=>[Math.cos(t)*1.65+shift,4.25+Math.sin(t)*.65+(defeated?shift*.4:0),-1.1];
    pushBeam(eye,point(a),point(b),.075,tint(hot,intensity));
    if(i%2===0&&!s.reduced)pushBeam(eye,[Math.cos(a)*1.85,4.25+Math.sin(a)*.8,-1.1],point(a),.028,tint(glow,.65));
  }
  const iris=defeated?tint(glow,.35):tint(hot,.8+charge*.2);
  pushRing(eye,0,4.25,-1.08,.43,iris,q.detail,true);
  if(!defeated)for(let i=0;i<q.detail;i++){
    const a=i/q.detail*Math.PI*2;
    pushBeam(eye,[Math.cos(a)*.18,4.25+Math.sin(a)*.18,-1.03],
      [Math.cos(a)*.4,4.25+Math.sin(a)*.4,-1.03],.018,[1,.92,.64]);
    // A second lid gives the silhouette an unmistakable all-seeing gaze.
    const b=(i+1)/q.detail*Math.PI*2;
    pushBeam(eye,[Math.cos(a)*1.3,4.25+Math.sin(a)*(.38+charge*.06),-1.07],
      [Math.cos(b)*1.3,4.25+Math.sin(b)*(.38+charge*.06),-1.07],.025,tint(hot,.7));
  }
  pushGem(eye,0,4.25,-1.02,.23,.64,defeated?[.18,.2,.27]:[1,.91,.66]);
  pushBox(eye,0,4.25,-.8,.055,.48,.04,[.1,.08,.12]);
  // The all-seeing gaze follows the native player position, remaining readable
  // around the arena. This rotates art alone, never the camera or collisions.
  const [px,,pz]=worldAt(s.player.x,s.player.y),gaze=Math.atan2(px,pz+1.1),c=Math.cos(gaze),sn=Math.sin(gaze);
  for(let i=0;i<eye.length;i+=6){const x=eye[i],z=eye[i+2]+1.1;
    v.push(c*x+sn*z,eye[i+1],-sn*x+c*z-1.1,eye[i+3],eye[i+4],eye[i+5]);
  }
  // Tilted, independently rotating celestial rings remain above standing heads.
  for(let ring=0;ring<2;ring++)for(let i=0;i<q.detail;i++){
    const rate=defeated?1+ring*.7:1,a=i/q.detail*Math.PI*2+spin*(ring?-1:1)*rate,
      b=a+Math.PI*2/q.detail,r=ring?2.15:2.8,
      point=t=>[Math.cos(t)*r,4.05+ring*.85+Math.sin(t)*.45+(s.reduced?0:(visual.transition||0)*.18),-.5+Math.sin(t)*r*.7];
    pushBeam(v,point(a),point(b),.055,tint(ring?glow:hot,s.reduced?.5:.8));
    if(i%2===0){const p=point(a);pushGem(v,p[0],p[1],p[2],.1,.3,tint(hot,.8));}
  }
  const count=s.reduced?4:q.particles;
  for(let i=0;i<count;i++){
    const a=i*2.3999+spin*.25,r=2.5+(i%3)*.45,
      y=defeated?2.5+((i*.37+age*.7)%2.8):3.25+Math.sin(a)*.14;
    pushGem(v,Math.cos(a)*r,y,Math.sin(a)*r*.7,.035,.16,tint(hot,intensity));
  }
  // Ground glyphs brighten with the actual windup; attacks have their own lanes.
  for(const side of [-1,1])for(let i=0;i<3;i++){
    const x=side*(3.4+i*.22),z=-1.9+i*.28;
    pushBeam(v,[x,.025,z],[x+side*.12,.025,z+.16],.025,tint(hot,.3+charge*.6));
  }
}
