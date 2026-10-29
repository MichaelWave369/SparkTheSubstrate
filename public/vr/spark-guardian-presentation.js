import {worldAt} from './spark-vr-model.js';
import {pushBox,pushBeam,pushGem,pushRing,tint} from './spark-vr-geometry.js';
export const GUARDIAN_PRESENTATION_VERSION='spark.xr.guardian-presentation.v1';
export class GuardianPresentation{
 constructor(){this.reset();}
 reset(){this.room=null;this.boss=null;this.winding=false;this.stage=1;this.victory=0;this.events=[];this.defeated=false;}
 observe(s,dt){
  if(this.room!==s.roomId){this.reset();this.room=s.roomId;}
  this.victory=Math.max(0,this.victory-dt);
  const boss=s.guardians?.find(g=>g.kind==='cantor');
  if(boss){
   if(boss.windup>0&&!this.winding)this.events.push({type:'windup',x:boss.x,y:boss.y,tone:stageTone(boss.stage)});
   this.boss=boss;this.winding=boss.windup>0;this.stage=boss.stage;
  }
  if(!this.defeated&&s.roomId==='forge'&&s.cleared&&s.bossDefeated?.room==='forge'){
   this.defeated=true;this.victory=2.5;this.events.push({type:'victory',...s.player,tone:523.25});
  }
  this.events=this.events.slice(-8);
 }
 describe(){return {version:GUARDIAN_PRESENTATION_VERSION,victory:this.victory,
  guide:this.defeated?'The Cantor is defeated · claim the actual chamber choice and continue':
   this.boss?.windup>0?'Amber spokes show the locked ring · move between lanes; leave ground seals':
   this.stage===2?'Second movement · eight notes and the aimed pair':'The Cantor · six-note rings and marked ground'};}
 drainEvents(){const e=this.events;this.events=[];return e;}
}
const stageTone=stage=>stage===2?146.83:196;
// Original Cantor silhouette and warning geometry. All positions/angles/health
// come from read-only canonical observations. No collision or attack decisions.
export function guardianGeometry(v,s,detail=12){
 if(s.roomId!=='forge')return;
 const amber=[1,.62,.25],copper=[.48,.24,.15],gold=[1,.82,.48],mint=[.35,.95,.8];
 for(const g of s.guardians||[]){if(g.kind!=='cantor')continue;
  const [x,,z]=worldAt(g.x,g.y),pulse=s.reduced?0:Math.sin(s.time*1.5)*.06,hot=g.stage===2?[1,.42,.24]:amber;
  pushBox(v,x,.4,z,.5,.65,.5,copper);pushGem(v,x,1.25+pulse,z,.43,1.35,tint(copper,1.4));
  pushGem(v,x,2.03+pulse,z,.24,.52,hot);pushBox(v,x,2.08+pulse,z+.21,.19,.045,.035,gold);
  for(const side of [-1,1]){
   pushBeam(v,[x+side*.25,1.6,z],[x+side*.7,1.15+pulse,z],.14,copper);
   pushGem(v,x+side*.72,1.13+pulse,z,.15,.42,hot);
   pushBeam(v,[x+side*.14,.6,z],[x+side*.26,.08,z],.14,tint(copper,.8));
  }
  for(const y of [.75,1.25,1.7])pushRing(v,x,y+pulse,z,.55+(g.windup>0?.07:0),y===1.25?hot:gold,detail);
  // A true health fraction, including the native half-health movement threshold.
  pushBox(v,x,2.52,z,1.35,.09,.055,[.10,.14,.17]);
  const fraction=Math.max(0,Math.min(1,g.hp/g.maxHp));pushBox(v,x-(1-fraction)*.675,2.52,z,1.35*fraction,.10,.06,mint);
  pushBox(v,x,2.52,z+.035,.012,.13,.01,gold);
  if(g.windup>0){
   pushRing(v,x,.035,z,.6+(1-g.windup/g.windupTotal)*.3,hot,detail);
   for(const a of g.angles)for(let i=1;i<=5;i++){
    const distance=.35+i*.43,px=x+Math.cos(a)*distance,pz=z+Math.sin(a)*distance;
    if(Math.abs(px)>4.45||Math.abs(pz)>2.65)continue;
    pushBeam(v,[px,.045,pz],[px+Math.cos(a)*.17,.045,pz+Math.sin(a)*.17],.025,hot);
   }
  }
  for(const m of g.marks){const [mx,,mz]=worldAt(m.x,m.y),r=m.r/100;
   pushRing(v,mx,.035,mz,r,amber,detail);pushRing(v,mx,.04,mz,r*Math.max(0,m.remaining/m.total),gold,detail);
  }
 }
 if(s.guardianVisual?.victory>0){
  const age=2.5-s.guardianVisual.victory;
  for(let i=0;i<(s.reduced?1:3);i++)pushRing(v,0,.3+age*.6+i*.3,0,.65+age*.35,mint,detail);
 }
}
