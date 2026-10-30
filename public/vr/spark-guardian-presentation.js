import {worldAt} from './spark-vr-model.js';
import {pushBox,pushBeam,pushGem,pushRing,tint} from './spark-vr-geometry.js';
export const GUARDIAN_PRESENTATION_VERSION='spark.xr.guardian-presentation.v1';
const SPECS=Object.freeze({forge:{kind:'cantor',name:'The Cantor',victory:2.5},eye:{kind:'warden',name:'The Warden',victory:2.8}});
export const guardianSpec=room=>SPECS[room]||null;
export class GuardianPresentation{
 constructor({now=()=>globalThis.performance?.now?.()??Date.now()}={}){this.now=now;this.reset();}
 reset(){this.room=null;this.boss=null;this.winding=false;this.stage=1;this.victory=0;this.events=[];this.defeated=false;this.transition=0;this.victoryStarted=null;this.defeatPoint=null;this.hounds=0;}
 // A loaded checkpoint can be paused at a choice and never take a sim step.
 // Reflect its canonical state immediately, without replaying transient cues.
 seed(s){
  this.reset();this.room=s.roomId;const spec=guardianSpec(s.roomId);
  this.boss=s.guardians?.find(g=>g.kind===spec?.kind)||null;this.stage=this.boss?.stage??1;this.winding=this.boss?.windup>0;
  // Cleared history also survives old saves or a later boss replacing the
  // single latest bossDefeated banner. Seeding never emits a victory event.
  this.defeated=!!spec&&!!s.cleared;
  this.hounds=spec?.kind==='warden'?(s.enemies||[]).filter(e=>e.kind==='hound'&&e.hp>0).length:0;
 }
 observe(s,dt){
  if(this.room!==s.roomId){this.reset();this.room=s.roomId;}
  this.victory=Math.max(0,this.victory-dt);
  this.transition=Math.max(0,this.transition-dt);
  const spec=guardianSpec(s.roomId),boss=s.guardians?.find(g=>g.kind===spec?.kind);
  if(boss){
   if(boss.windup>0&&!this.winding)this.events.push({type:'windup',x:boss.x,y:boss.y,tone:stageTone(boss.stage)});
   if(spec.kind==='warden'&&this.boss&&boss.stage!==this.stage){this.transition=1;this.events.push({type:'guardian-phase',x:boss.x,y:boss.y,tone:110});}
   this.boss=boss;this.winding=boss.windup>0;this.stage=boss.stage;
  }
  this.hounds=spec?.kind==='warden'?(s.enemies||[]).filter(e=>e.kind==='hound'&&e.hp>0).length:0;
  if(!this.defeated&&spec&&s.cleared&&s.bossDefeated?.room===s.roomId){
   this.defeated=true;this.victory=spec.victory;this.victoryStarted=this.now();
   const burst=s.effects?.find(e=>e.type==='burst'&&e.color==='#f7cb79');
   this.defeatPoint=burst?{x:burst.x,y:burst.y}:this.boss?{x:this.boss.x,y:this.boss.y}:null;
   this.events.push({type:'victory',...s.player,tone:523.25});
  }
  this.events=this.events.slice(-8);
 }
 describe(){const spec=guardianSpec(this.room);
  // The native milestone pauses combat. Only this bounded cosmetic dissolution
  // uses elapsed presentation time; attacks, hazards and phase changes never do.
  const victory=spec?.kind==='warden'&&this.victoryStarted!==null?Math.max(0,spec.victory-(this.now()-this.victoryStarted)/1000):this.victory;
  return {version:GUARDIAN_PRESENTATION_VERSION,kind:spec?.kind,victory,victoryDuration:spec?.victory,
  defeated:this.defeated,stage:this.stage,transition:this.transition,defeatPoint:this.defeatPoint,hounds:this.hounds,
  guide:spec?.kind==='warden'?(this.defeated?'The Warden is defeated · claim rewards, then Continue / Finish':
   this.boss?.windup>0?(this.stage===2?'Five locked paths · leave the ground seals':'Three locked paths · step between the bolts'):
   this.stage===2?'Second phase · five bolts, faster rhythm and summoned hounds':'The Warden · three aimed bolts and marked ground'):
   this.defeated?'The Cantor is defeated · claim the actual chamber choice and continue':
   this.boss?.windup>0?'Amber spokes show the locked ring · move between lanes; leave ground seals':
   this.stage===2?'Second movement · eight notes and the aimed pair':'The Cantor · six-note rings and marked ground'};}
 drainEvents(){const e=this.events;this.events=[];return e;}
}
const stageTone=stage=>stage===2?146.83:196;
// Original guardian silhouettes and warning geometry. All positions/angles/health
// come from read-only canonical observations. No collision or attack decisions.
export function guardianGeometry(v,s,detail=12){
 const spec=guardianSpec(s.roomId);if(!spec)return;
 const amber=[1,.62,.25],copper=[.48,.24,.15],gold=[1,.82,.48],mint=[.35,.95,.8];
 for(const g of s.guardians||[]){if(g.kind!==spec.kind)continue;
  const [x,,z]=worldAt(g.x,g.y),pulse=s.reduced?0:Math.sin(s.time*1.5)*.06,hot=g.stage===2?[1,.42,.24]:amber;
  if(g.kind==='warden')wardenBody(v,s,g,x,z,detail);
  else{
  pushBox(v,x,.4,z,.5,.65,.5,copper);pushGem(v,x,1.25+pulse,z,.43,1.35,tint(copper,1.4));
  pushGem(v,x,2.03+pulse,z,.24,.52,hot);pushBox(v,x,2.08+pulse,z+.21,.19,.045,.035,gold);
  for(const side of [-1,1]){
   pushBeam(v,[x+side*.25,1.6,z],[x+side*.7,1.15+pulse,z],.14,copper);
   pushGem(v,x+side*.72,1.13+pulse,z,.15,.42,hot);
   pushBeam(v,[x+side*.14,.6,z],[x+side*.26,.08,z],.14,tint(copper,.8));
  }
  for(const y of [.75,1.25,1.7])pushRing(v,x,y+pulse,z,.55+(g.windup>0?.07:0),y===1.25?hot:gold,detail);
  }
  // A true health fraction, including the native half-health movement threshold.
  const healthY=g.kind==='warden'?2.98:2.52;
  pushBox(v,x,healthY,z,1.35,.09,.055,[.10,.14,.17]);
  const fraction=Math.max(0,Math.min(1,g.hp/g.maxHp));pushBox(v,x-(1-fraction)*.675,healthY,z,1.35*fraction,.10,.06,mint);
  pushBox(v,x,healthY,z+.035,.012,.13,.01,gold);
  if(g.windup>0){
   pushRing(v,x,.035,z,.6+(1-g.windup/g.windupTotal)*.3,hot,detail);
   for(const a of g.angles)for(let i=1;i<=(g.kind==='warden'?9:5);i++){
    const distance=.35+i*.43,px=x+Math.cos(a)*distance,pz=z+Math.sin(a)*distance;
    if(Math.abs(px)>4.45||Math.abs(pz)>2.65)continue;
    pushBeam(v,[px,.045,pz],[px+Math.cos(a)*.17,.045,pz+Math.sin(a)*.17],.025,hot);
    // Repeat the same native lane at the actual projectile presentation height,
    // so a seated player looking at the boss can read it without looking down.
    if(g.kind==='warden')pushBeam(v,[px,.82,pz],[px+Math.cos(a)*.12,.82,pz+Math.sin(a)*.12],.018,hot);
   }
  }
  for(const m of g.marks){const [mx,,mz]=worldAt(m.x,m.y),r=m.r/100;
   pushRing(v,mx,.035,mz,r,amber,detail);pushRing(v,mx,.04,mz,r*Math.max(0,m.remaining/m.total),gold,detail);
  }
 }
 if(spec.kind==='warden'){
  wardenHounds(v,s,detail);
  const visual=s.guardianVisual;
  if(visual?.victory>0&&visual.defeatPoint){
   const age=visual.victoryDuration-visual.victory,[x,,z]=worldAt(visual.defeatPoint.x,visual.defeatPoint.y),count=s.reduced?5:14;
   for(let i=0;i<count;i++){const a=i*2.3999,r=.1+age*.24;
    pushGem(v,x+Math.cos(a)*r,.25+i*.16+age*.6,z+Math.sin(a)*r,.055*visual.victory/visual.victoryDuration,.17,gold);
   }
  }
 }
 if(spec.kind==='cantor'&&s.guardianVisual?.victory>0){
  const age=2.5-s.guardianVisual.victory;
  for(let i=0;i<(s.reduced?1:3);i++)pushRing(v,0,.3+age*.6+i*.3,0,.65+age*.35,mint,detail);
 }
}
function wardenBody(v,s,g,x,z,detail){
 const dark=[.12,.13,.19],gold=[.93,.68,.26],hot=g.stage===2?[1,.36,.17]:[1,.86,.5],
  pulse=s.reduced?0:Math.sin(s.time*1.5)*.035,charge=g.windup>0?1-g.windup/g.windupTotal:0;
 pushGem(v,x,1.5+pulse,z,.4,1.55,dark);pushGem(v,x,1.68+pulse,z,.29,.75,gold);
 for(const side of [-1,1]){
  pushBeam(v,[x+side*.2,1.95,z],[x+side*(.64+charge*.12),2.15+pulse,z],.18,gold);
  pushGem(v,x+side*(.62+charge*.12),1.86+pulse,z,.22,.65,dark);
  pushGem(v,x+side*.66,1.42+pulse,z,.14,.48,hot);
  pushBeam(v,[x+side*.15,.93,z],[x+side*.3,.12,z],.18,dark);
  pushGem(v,x+side*.3,.13,z+.08,.18,.25,gold);
 }
 pushGem(v,x,2.43+pulse,z,.26,.55,gold);pushGem(v,x,2.43+pulse,z+.21,.12,.2,hot);
 for(const side of [-1,0,1])pushGem(v,x+side*.24,2.75+pulse,z,.075,.34,hot);
 pushRing(v,x,.055,z,.46,gold,detail);
 for(const y of [1.1,1.85])pushRing(v,x,y+pulse,z,.48+charge*.17,tint(gold,g.windup>0?1.15:.6),detail);
}
function wardenHounds(v,s,detail){
 for(const e of (s.enemies||[]).filter(e=>e.kind==='hound'&&e.hp>0)){
  const charging=Math.hypot(e.chargeX||0,e.chargeY||0)>0,
   [x,,z]=worldAt(e.x,e.y),dx=charging?e.chargeX:s.player.x-e.x,dz=charging?e.chargeY:s.player.y-e.y,n=Math.hypot(dx,dz)||1,
   hx=x+dx/n*.24,hz=z+dz/n*.24,hot=e.windup>0?[1,.5,.15]:[.85,.68,.37];
  pushBox(v,x,.28,z,.4,.3,.42,[.14,.12,.2]);pushGem(v,hx,.42,hz,.15,.3,hot);
  for(const side of [-1,1]){pushGem(v,hx+side*.1,.6,hz,.045,.18,hot);
   for(const offset of [-.14,.14])pushBox(v,x+side*.15,.1,z+offset,.06,.2,.065,hot);
  }
  if(s.guardianVisual?.transition>0)pushRing(v,x,.04,z,.3+s.guardianVisual.transition*.25,hot,detail);
 }
}
