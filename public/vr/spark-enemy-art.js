import {COMBAT_ROLES} from '../worlds.js?v=0.17.0';
import {pushGem,pushBeam,pushRing,hex,tint} from './spark-vr-geometry.js';
import {pushBevelBox,pushLimb} from './spark-vr-art.js';
import {worldAt} from './spark-vr-model.js';
export const ENEMY_ART_VERSION='spark.xr.enemy-art.v1';
export const ENEMY_ART=Object.freeze({
 collector:{silhouette:'harvester',color:'#aeb5a2'},archon:{silhouette:'armored-core',color:'#d8ac67'},
 hound:{silhouette:'angular-quadruped',color:'#c59168'},mirror:{silhouette:'segmented-crystal',color:'#b6a1ea'},
 leech:{silhouette:'segmented-siphon',color:'#72c9bd'},spore:{silhouette:'rooted-spore',color:'#a8ce80'},
 moth:{silhouette:'ember-wings',color:'#edb779'},oracle:{silhouette:'orbital-seer',color:'#cabca2'}
});
export function enemyArtState(e,s){
 const role=COMBAT_ROLES[e.kind]||e.kind,spec=ENEMY_ART[role],locked=(e.windup>0||e.charge>0)&&Math.hypot(e.chargeX||0,e.chargeY||0)>.0001,
  dx=locked&&Number.isFinite(e.chargeX)?e.chargeX:(s.player.x-e.x),dz=locked&&Number.isFinite(e.chargeY)?e.chargeY:(s.player.y-e.y);
 return {role,spec,preparing:e.windup>0,charging:e.charge>0,hit:e.flash>0,shield:e.shield>0,
  yaw:Math.atan2(dx||0,dz||0),stride:s.reduced||e.rootTime>0?0:Math.sin((s.time||0)*5+(e.id||0))*.035};
}
function wing(v,side,y,z,spread,col){
 const ps=[[side*.07,y,z],[side*spread,y+.16,z-.16],[side*.40,y-.16,z+.16]];
 for(const face of [[0,1,2],[2,1,0]])for(const i of face)v.push(...ps[i],...col);
}
// Position, locked directions, charge, shield and damage are canonical data.
// The oscillator moves limbs only; it cannot schedule an attack or resolve hits.
export function enemyFigure(v,e,s){
 const a=enemyArtState(e,s),local=[],q=s.quality==='performance'?0:s.quality==='high'?2:1,sides=q?6:4,
  base=hex(a.spec?.color||e.color||'#8eaca8'),metal=tint(base,.75),dark=tint(base,.28),
  hot=a.preparing?[1,.62,.29]:a.hit?[.9,.97,.84]:tint(base,1.1),stride=a.stride;
 const limb=(p,r,r1=.04,r2=.025,col=metal)=>pushLimb(local,p,r,r1,r2,col,sides),gem=(x,y,z,r,h,col=hot)=>pushGem(local,x,y,z,r,h,col),
  box=(x,y,z,w,h,d,col=dark)=>pushBevelBox(local,x,y,z,w,h,d,col);
 if(a.role==='collector'){
  // A narrow hood and long asymmetric harvesting arms, rather than a soldier.
  gem(0,.72,0,.13,.74,dark);gem(0,1.29,0,.14,.36,metal);box(0,1.28,.11,.12,.15,.07,[.035,.045,.045]);
  pushBeam(local,[-.035,1.30,.155],[.035,1.30,.155],.012,hot);
  for(const side of [-1,1]){
   limb([side*.08,.48,0],[side*.11,.045,side*stride],.027,.019,dark);
   const lift=a.preparing?.12:stride*side;
   limb([side*.11,.96,0],[side*.29,.63+lift,.06],.026,.018);
   limb([side*.29,.63+lift,.06],[side*.26,.35+lift,.14],.018,.011);
   limb([side*.26,.35+lift,.14],[side*.13,.30+lift,.25],.017,.002,hot);
   if(q>1)limb([side*.26,.43+lift,.12],[side*.34,.30+lift,.20],.012,.002,metal);
  }
 }else if(a.role==='archon'){
  box(0,.90+stride,0,.38,.54,.28);gem(0,.94+stride,.17,.12,.27,hot);
  gem(0,1.42+stride,0,.18,.28,metal);box(0,1.42+stride,.13,.15,.065,.06,hot);
  for(const side of [-1,1]){
   gem(side*.26,1.12+stride,0,.16,.35,metal);
   const z=a.preparing?.28:.07;limb([side*.21,1.02,0],[side*.30,.76,z],.07,.045);
   gem(side*.30,.76,z+.055,.05,.11,hot);
   limb([side*.11,.64,0],[side*.14,.10,side*stride],.065,.045,dark);box(side*.14,.06,.055,.15,.10,.24,metal);
  }
  if(q)pushRing(local,0,.94+stride,0,.28,metal,q>1?12:8);
 }else if(a.role==='hound'){
  const crouch=a.preparing?-.075:0,y=.35+crouch;
  box(0,y,0,.24,.25,.48);gem(0,y+.11,.29,.13,.27,metal);gem(0,y+.08,.40,.06,.10,hot);
  for(const side of [-1,1]){
   gem(side*.09,y+.27,.23,.035,.18,metal);
   for(const z of [-.15,.16]){
    const motion=a.charging?(z>0?.10:-.08):stride*side*(z>0?1:-1);
    limb([side*.10,y-.03,z],[side*.16,.16+crouch*.5,z+motion],.045,.03,metal);
    limb([side*.16,.16+crouch*.5,z+motion],[side*.13,.035,z+.04+motion],.028,.017);
   }
  }
  limb([0,y,-.23],[0,y+.12,-.49],.035,.004,metal);
 }else if(a.role==='mirror'){
  const drift=s.reduced?0:stride;
  for(let i=0;i<3;i++){const sign=i%2?1:-1;gem(sign*.045,.42+i*.31+drift,0,.17-i*.025,.37,i===1?hot:metal);}
  for(const side of [-1,1]){
   gem(side*.25,.83-drift,.02,.09,.72,metal);gem(side*.25,.83-drift,.07,.045,.55,[.8,.89,1]);
   if(a.shield)pushBeam(local,[side*.33,.36,.12],[side*.33,1.35,.12],.032,[.66,.88,.96]);
  }
  if(a.shield)pushRing(local,0,.78,0,.35,[.62,.82,.97],q?12:6);
 }else if(a.role==='leech'){
  for(let i=0;i<4;i++){
   const z=-.38+i*.19,x=s.reduced?0:Math.sin((s.time||0)*3-i*.8)*.025;
   gem(x,.21+(i%2)*.025,z,.13-i*.012,.28,i===3?hot:dark);
   if(q||i%2===0)pushRing(local,x,.23,z,.10,tint(base,.75),6);
  }
  pushRing(local,0,.26,.29,.10,hot,8,true);
  for(const side of [-1,1])limb([side*.06,.25,.25],[side*.11,.16,a.preparing?.70:.42],.018,.003,hot);
 }else if(a.role==='moth'){
  gem(0,.54+stride,0,.08,.45,dark);gem(0,.70+stride,.05,.06,.13,hot);
  const spread=.38+(s.reduced?0:Math.sin((s.time||0)*5)*.06);
  for(const side of [-1,1]){wing(local,side,.60+stride,0,spread,metal);limb([side*.035,.78,0],[side*.12,.9,.10],.012,.002,hot);}
 }else if(a.role==='spore'){
  limb([0,.07,0],[0,.55,0],.085,.065,dark);gem(0,.61,0,.27,.30,metal);
  for(const side of [-1,1]){gem(side*.18,.53+stride,0,.13,.22,hot);limb([side*.05,.20,0],[side*.23,.025,.16],.035,.006,dark);}
  gem(0,.75,0,.08,.15,hot);
 }else if(a.role==='oracle'){
  gem(0,.76+stride,0,.20,.75,dark);gem(0,1.15+stride,.02,.10,.20,hot);
  pushRing(local,0,1.14+stride,0,.31,metal,q?12:6,true);
  for(const side of [-1,1])limb([side*.10,.75,0],[side*.28,.63,.08],.035,.012,metal);
 }else{
  // Other existing guardians retain the established faceted interpretation.
  gem(0,.62,0,.22,.95,dark);gem(0,1.12+stride,0,.17,.35,metal);
  for(const side of [-1,1]){limb([side*.16,.87,0],[side*.26,.46, .08]);limb([side*.08,.35,0],[side*.10,.04,stride*side],.045,.035,dark);}
 }
 // Damage flash is an existing native timer, not a new hit or damage source.
 const [x,,z]=worldAt(e.x,e.y),c=Math.cos(a.yaw),sn=Math.sin(a.yaw);
 for(let i=0;i<local.length;i+=6){
  const r=local[i+3],g=local[i+4],b=local[i+5];
  v.push(x+c*local[i]+sn*local[i+2],local[i+1],z-sn*local[i]+c*local[i+2],
   a.hit?Math.min(1,r*.5+.35):r,a.hit?Math.min(1,g*.5+.35):g,a.hit?Math.min(1,b*.5+.35):b);
 }
}
