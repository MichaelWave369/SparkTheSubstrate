import assert from 'node:assert/strict';
import * as A from '../public/action-engine.js';
import * as D from '../public/dungeon.js';
import * as Duel from '../public/duel-engine.js';
import {combatInput} from './campaign-controls.mjs';
function gift(run){const urgent=run.player.hp/run.player.maxHp<.65,preferred=urgent?['shell','regeneration','edge','cadence','orbit']:run.boons.regeneration<2?['regeneration','edge','cadence','orbit','shell']:['edge','cadence','orbit','shell'];return preferred.find(id=>run.choices.includes(id))??run.choices[0];}
for(const form of Object.keys(A.BODIES)){
 let run=D.createDungeon(form,153),loaded=false,maxActive=0,guardian=null;const guardianChecks=[];
 for(let frame=0;frame<120000&&run.phase!=='dead'&&run.dungeon.floorsCleared<20;frame++){
  if(run.phase==='resolve'){assert.ok(D.validDungeon(run));if(run.xp>=run.nextXp)D.chooseDungeonGift(run);else{D.nextDungeonFloor(run);if(run.dungeon.floor===7&&!loaded){const values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};D.saveDungeon(storage,run,null);const loadedState=D.loadDungeon(storage);assert.deepEqual(loadedState.run,run);run=loadedState.run;loaded=true;}}continue;}
  if(run.phase==='boon'){A.chooseBoon(run,gift(run));continue;}
  const boss=run.enemies.find(e=>['cantor','warden'].includes(e.kind)||A.ROOMS[run.room].guardian===e.kind);if(boss){guardian??={floor:run.dungeon.floor,started:run.time,damageBefore:run.stats.damageTaken,stages:new Set(),windup:false,volleys:0};guardian.stages.add(boss.stage??1);guardian.windup ||= boss.windup>0;guardian.volleys=Math.max(guardian.volleys,boss.volleys??0);}
  A.stepRun(run,combatInput(run));if(guardian&&run.phase==='resolve'){const seconds=Math.round(run.time-guardian.started);assert.ok(guardian.windup&&guardian.volleys>=3,'Dungeon '+form+' floor '+guardian.floor+' needs readable boss patterns.');assert.ok(guardian.stages.has(2),'Dungeon '+form+' needs a second boss phase.');guardianChecks.push({floor:guardian.floor,seconds,damageTaken:Math.round(run.stats.damageTaken-guardian.damageBefore),phases:[...guardian.stages],volleys:guardian.volleys});guardian=null;}maxActive=Math.max(maxActive,run.enemies.length);if(frame%120===0)assert.ok(D.validDungeon(run));
 }
 assert.ok(run.dungeon.floorsCleared>=12,form+' could not reach the first dozen floors.');assert.equal(loaded,true);assert.ok(maxActive<=18);console.log(JSON.stringify({mode:'dungeon',form,floors:run.dungeon.floorsCleared,result:run.phase,seconds:Math.round(run.time),hp:Math.round(run.player.hp),level:run.level,maxActive,guardians:guardianChecks}));
}
for(const rung of Duel.DUEL_LADDER){
 const match=Duel.createLadderDuel('human',rung.rung,'pc',881+rung.rung);
 for(let frame=0;frame<40000&&match.phase!=='finished';frame++){
  const [player,other]=match.fighters,d=Math.abs(player.x-other.x),toward=player.x<other.x?1:-1;
  Duel.stepDuel(match,[{x:d>65?toward:0,light:frame%30===0,heavy:frame%60===15,launcher:frame%120===45,special:frame%(match.rules.cooldown+10)===80,super:player.meter>=100&&frame%60===0},{}]);
 }
 assert.equal(match.phase,'finished','Ladder rung '+rung.rung+' did not finish');assert.equal(match.fighters[match.winner].rounds,2);assert.ok(match.fighters.every(f=>Number.isFinite(f.hp)&&f.hp<=f.maxHp));assert.ok(match.fighters[1].stats.specials>0);console.log(JSON.stringify({mode:'ladder',rung:rung.rung,condition:rung.condition,winner:match.winner,seconds:Math.round(match.frames/60),rounds:match.fighters.map(f=>f.rounds),damage:match.fighters.map(f=>Math.round(f.stats.damage))}));
}
console.log('Endless and ladder simulations passed with baseline health, real movement, powers, attacks and saved checkpoint continuation.');
