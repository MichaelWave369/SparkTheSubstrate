// Portable, original presentation contract. No engine, save, account or network APIs.
export const MORE_BOUNCE_FIELD_VERSION='more-bounce.field.v1';
export function createMoreBounceField({at,origin=[0,0,0],seed=369,reduced=false}={}){
 if(!Number.isFinite(at)||at<0||!Array.isArray(origin)||origin.length!==3||!origin.every(n=>Number.isFinite(n)&&Math.abs(n)<=50)||
  !Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)throw Error('Invalid bounded More Bounce field');
 return Object.freeze({schema:MORE_BOUNCE_FIELD_VERSION,at,duration:6.9,origin:Object.freeze([...origin]),radius:3.6,
  propagation:Object.freeze({maxHops:0,speed:1.8}),
  dance:Object.freeze({count:6,tempo:108,amplitude:reduced?.025:.07,seed}),
  bubbles:Object.freeze({count:reduced?3:9}),
  audio:Object.freeze({originalSynthesis:true,optional:true}),haptics:Object.freeze({optional:true,maxAmplitude:.08,maxMilliseconds:25}),
  accessibility:Object.freeze({reduced,noCameraMotion:true,noRequiredPhysicalMotion:true}),authority:'presentation-only'});
}
export function sampleMoreBounceField(event,now){
 if(!validMoreBounceField(event)||!Number.isFinite(now))return null;
 const age=now-event.at;if(age<0||age>=event.duration)return null;
 const phase=age*event.dance.tempo/60*Math.PI*2,seedPhase=(event.dance.seed%369)/369*Math.PI,
  radius=Math.min(event.radius,age*event.propagation.speed);
 const dancers=Array.from({length:event.dance.count},(_,i)=>{
  const a=i*Math.PI/3,bounce=Math.sin(phase+i*.7+seedPhase),sway=Math.cos(phase*.5+i)*event.dance.amplitude;
  return {x:event.origin[0]+Math.cos(a)*1.15+sway,y:event.origin[1]+.27+Math.abs(bounce)*event.dance.amplitude,
   z:event.origin[2]+Math.sin(a)*1.15,arms:bounce*event.dance.amplitude*2,form:i};
 });
 return {schema:event.schema,age,remaining:event.duration-age,radius,dancers,
  bubbles:Array.from({length:event.bubbles.count},(_,i)=>{const a=i*2.3999+age*.25;return {
   x:event.origin[0]+Math.cos(a)*radius*.7,y:event.origin[1]+.2+(age*.22+i*.19)%1.4,z:event.origin[2]+Math.sin(a)*radius*.7};}),
  celebrationOnly:true};
}
export function validMoreBounceField(e){
 return e?.schema===MORE_BOUNCE_FIELD_VERSION&&e.authority==='presentation-only'&&Number.isFinite(e.at)&&e.at>=0&&
  Number.isFinite(e.duration)&&e.duration>0&&e.duration<=6.9&&Number.isFinite(e.radius)&&e.radius>0&&e.radius<=3.6&&
  Array.isArray(e.origin)&&e.origin.length===3&&e.origin.every(n=>Number.isFinite(n)&&Math.abs(n)<=50)&&
  e.propagation?.maxHops===0&&Number.isFinite(e.propagation.speed)&&e.propagation.speed>0&&e.propagation.speed<=1.8&&
  e.dance?.count===6&&e.dance.tempo===108&&Number.isFinite(e.dance.amplitude)&&e.dance.amplitude>=0&&e.dance.amplitude<=.07&&
  Number.isSafeInteger(e.dance.seed)&&e.dance.seed>=0&&e.dance.seed<=0xffffffff&&[3,9].includes(e.bubbles?.count);
}
