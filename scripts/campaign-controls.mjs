import * as A from '../public/action-engine.js';
export function moveTo(actor,target){const dx=target.x-actor.x,dy=target.y-actor.y,d=Math.hypot(dx,dy);return {x:d>12?dx/(d||1):0,y:d>12?dy/(d||1):0,dash:d>110&&actor.dashCooldown===0};}
export function combatInput(run,actor=run.player,form=run.form,offset=0){
 const profile=A.attackProfile(run,form),enemies=run.enemies.filter(e=>e.hp>0),nearest=enemies.reduce((a,b)=>!a||Math.hypot(b.x-actor.x,b.y-actor.y)<Math.hypot(a.x-actor.x,a.y-actor.y)?b:a,null),melee=profile.range<300;
 const angle=run.time*.7+offset,target=melee&&nearest?nearest:{x:480+Math.cos(angle)*220,y:300+Math.sin(angle)*155};let input=moveTo(actor,target);
 if(melee&&nearest&&Math.hypot(nearest.x-actor.x,nearest.y-actor.y)<profile.range*.6){const x=input.x;input.x=-input.y*.6;input.y=x*.6;}
 const marks=run.marks.filter(mark=>Math.hypot(mark.x-actor.x,mark.y-actor.y)<mark.r+26);
 if(marks.length){const mark=marks[0],dx=actor.x-mark.x,dy=actor.y-mark.y,d=Math.hypot(dx,dy);input.x=d>1?dx/d:Math.cos(angle);input.y=d>1?dy/d:Math.sin(angle);}
 const projectile=run.shots.some(shot=>shot.enemy&&Math.hypot(shot.x+shot.vx*.16-actor.x,shot.y+shot.vy*.16-actor.y)<40),close=enemies.some(e=>Math.hypot(e.x-actor.x,e.y-actor.y)<65);
 input.dash=actor.dashCooldown===0&&(projectile||marks.length>0||close||melee&&nearest&&Math.hypot(nearest.x-actor.x,nearest.y-actor.y)>profile.range&&Math.hypot(nearest.x-actor.x,nearest.y-actor.y)<350);
 input.power=(actor.powerCooldown??0)<=0&&(enemies.some(e=>Math.hypot(e.x-actor.x,e.y-actor.y)<240)||form==='computer'&&enemies.length>0||['human','tree'].includes(form)&&actor.hp/actor.maxHp<.9);
 return input;
}
export function choose(run){
 if(run.phase==='milestone'){A.resolveMilestone(run,'continue');return true;}
 if(run.phase==='boon'){const urgent=[run.player,run.partner].filter(Boolean).some(p=>p.hp/p.maxHp<.65),preferred=urgent?['shell','regeneration','edge','cadence','orbit']:run.boons.regeneration<2?['regeneration','edge','cadence','orbit','shell']:['edge','cadence','orbit','shell'];A.chooseBoon(run,preferred.find(id=>run.choices.includes(id))??run.choices[0]);return true;}
 if(run.phase==='resolve'){A.resolveChamber(run,0);return true;}return false;
}
export function equipCheckpoint(run,meta){
 if(!A.checkpointAvailable(run))return;
 for(const group of [['bell','prism'],['ash'],['firstlight','orbitprism','nightfangs','cindermaul','thornstaff','tideblade'],['dawnshell','astralaegis','veilgarb','furnaceplate','grovemantle','coralmail']]){const id=group.find(id=>(run.loot??[]).includes(id)||id in meta.inventory);if(id&&!Object.values(run.loadout).includes(id))A.equipRunItem(run,meta,id);}
}
