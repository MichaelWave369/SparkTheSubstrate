import {createMoreBounceField,sampleMoreBounceField} from '../more-bounce-field.js';
import {pushBox,pushBeam,pushGem,pushRing,hex} from './spark-vr-geometry.js';
import {ROOMS,BODIES} from '../action-engine.js?v=0.17.0';
const colors=['#ffd875','#e9b993','#64dce9','#c5b472','#68b885','#ae9ed1'];
// The host verifies earned canonical history. No gameplay rule is added here.
export function moreBounceEligible(run){
 const kindness=new Set((run.journal||[]).filter(e=>ROOMS[e.room]&&run.cleared.includes(e.room)&&(run.roomResolved||[]).includes(e.room)&&
  e.id===e.room+':decision'&&e.text?.endsWith('A small freedom outlives this body.')).map(e=>e.room));
 return run.room==='forge'&&run.phase==='playing'&&run.player.hp>0&&run.cleared.includes('forge')&&
  !run.partner&&!run.daily&&!run.dungeon&&!run.rematch&&!run.enemies.some(e=>e.hp>0)&&
  run.abilities.includes('morph')&&new Set(run.visitedVessels||[]).size===6&&Object.keys(BODIES).every(f=>run.visitedVessels.includes(f))&&kindness.size>=9;
}
export class MoreBouncePresentation{
 constructor(){this.reset();}
 reset(){this.field=null;this.variants=null;this.events=[];this.beat=-1;}
 activate(run,settings){
  if(!moreBounceEligible(run))throw Error('The quiet rhythm has not answered.');
  if(this.field)return false;
  this.variants={normal:createMoreBounceField({at:run.time,seed:run.seed}),reduced:createMoreBounceField({at:run.time,seed:run.seed,reduced:true})};
  this.field=this.variants[settings.reduced?'reduced':'normal'];this.beat=-1;return true;
 }
 observe(run){
  if(!this.field)return;
  if(run.room!=='forge'||run.phase!=='playing'||run.enemies.some(e=>e.hp>0)){this.reset();return;}
  const s=sampleMoreBounceField(this.field,run.time);if(!s){this.reset();return;}
  const beat=Math.floor(s.age/(60/108));
  // At most one current cue: never queue a burst after a pause or long frame.
  if(beat!==this.beat){this.beat=beat;this.events.push({type:beat%3===2?'giggle':'bounce-note',x:480,y:300,
    tone:[261.63,329.63,392][beat%3],hand:beat%2?'left':'right'});this.events=this.events.slice(-4);}
 }
 snapshot(run,settings){return this.field?sampleMoreBounceField(settings?this.variants[settings.reduced?'reduced':'normal']:this.field,run.time):null;}
 drainEvents(){const e=this.events;this.events=[];return e;}
}
export function moreBounceGeometry(v,s,detail=12){
 const field=s.moreBounce;if(!field)return;
 for(let i=0;i<3;i++)pushRing(v,0,.025+i*.008,0,Math.min(2.4,field.radius*(i+1)/3),hex(colors[i*2]),detail);
 // Original harmless celebrants, not enemies animated into a fake pacified state.
 for(const d of field.dancers){const c=hex(colors[d.form]),x=d.x,y=d.y,z=d.z;
  pushGem(v,x,y+.19,z,.085,.30,c);pushGem(v,x,y+.40,z,.07,.13,c);
  for(const side of [-1,1]){pushBeam(v,[x+side*.05,y+.23,z],[x+side*.17,y+.23+side*d.arms,z],.018,c);
   pushBeam(v,[x+side*.025,y+.08,z],[x+side*(.06+d.arms*.2),.035,z],.025,c);}
 }
 for(const [i,b]of field.bubbles.entries())pushRing(v,b.x,b.y,b.z,.035+(i%3)*.012,hex(colors[i%6]),6);
}
