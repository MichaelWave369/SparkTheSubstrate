import assert from 'node:assert/strict';
import * as A from '../public/action-engine.js';
import {KEYS} from '../public/exploration.js';
import {SEALS,worldOf,WORLD_ORDER,WORLDS} from '../public/worlds.js';
import {ROUTE_RELICS,EASTER_EGGS} from '../public/world-expansion.js';
import {SKILL_TREES,learnSkill} from '../public/mastery.js';
import {choose,moveTo,combatInput,equipCheckpoint} from './campaign-controls.mjs';
const first=['north','east','south','north','north','east','east','south','east','north','south','west','south','east','west','north','north','west','south','south','north','west','west','west','north','east','north','east'];
// Plans using the real key, ward, relic, seal and vessel requirements. Never skips combat.
function routeTo(run,target){const queue=[[run.room,[]]],seen=new Set([run.room]);while(queue.length){const [room,path]=queue.shift();if(room===target)return path;for(const [direction,exit]of Object.entries(A.ROOMS[room].exits)){if(seen.has(exit.to)||A.ROOMS[exit.to].finalBoss&&exit.to!==target)continue;const probe={...run,room,cleared:[...new Set([...run.cleared,room])],form:exit.vessel??run.form};if(!A.gateStatus(probe,direction).available)continue;seen.add(exit.to);queue.push([exit.to,[...path,direction]]);}}return null;}
const destinations=Object.keys(A.ROOMS).sort((a,b)=>(!!A.ROOMS[a].finalBoss)-(!!A.ROOMS[b].finalBoss)||WORLDS[worldOf(a)].rank-WORLDS[worldOf(b)].rank||(A.ROOMS[a].stage??0)-(A.ROOMS[b].stage??0));
for(const coop of [false,true]){
 let meta=A.createMeta();if(process.argv.includes('--trained'))for(const form of Object.keys(SKILL_TREES)){meta.training[form].xp=100;for(const node of SKILL_TREES[form][0].nodes)meta=learnSkill(meta,form,node.id);}const run=A.createRun(meta,'spark',245);if(coop)A.addPartner(run,'computer');let index=0,targetId=null,goalKey=null,centered=false;const worlds=new Set(['stratum']),times={},laws=new Set();let maxBytes=0;
 for(let frame=0;frame<500000&&!['dead','won'].includes(run.phase);frame++){
  const mega=run.enemies.find(e=>e.kind==='demiurge');if(mega?.stage)laws.add(mega.stage);
  if(choose(run))continue;equipCheckpoint(run,meta);let input={};
  const down=run.partner&&(run.player.hp<=0?run.player:run.partner.hp<=0?run.partner:null),pickup=A.pendingKey(run)??A.pendingRelic(run),secret=A.pendingSecret(run);
  if(down){const living=down===run.player?run.partner:run.player,action=moveTo(living,down);action.interact=Math.hypot(living.x-down.x,living.y-down.y)<75;if(living===run.partner)input.partner=action;else input=action;}
  else if(pickup){input=moveTo(run.player,pickup);if(run.partner)input.partner=moveTo(run.partner,pickup);}
  else if(secret){if(run.form!==secret.vessel){if((run.player.morphCooldown??0)<=0)A.morphRun(run,secret.vessel);A.stepRun(run,{});continue;}input=moveTo(run.player,secret);input.interact=Math.hypot(run.player.x-secret.x,run.player.y-secret.y)<60;}
  else if(run.cleared.includes(run.room)){
   let direction=first[index];if(index>=first.length){
    if(!targetId||run.cleared.includes(targetId)||!routeTo(run,targetId))targetId=destinations.find(id=>!run.cleared.includes(id)&&routeTo(run,id));
    assert.ok(targetId,'No reachable destination from '+run.room);direction=routeTo(run,targetId)[0];
   }
   const exit=A.ROOMS[run.room].exits[direction];assert.ok(exit,'No route at '+run.room+' #'+index);
   if(exit.vessel&&run.form!==exit.vessel){if((run.player.morphCooldown??0)<=0)A.morphRun(run,exit.vessel);A.stepRun(run,{},1/60);continue;}
   const target=A.exitPosition(direction),key=run.room+':'+direction;if(goalKey!==key){goalKey=key;centered=false;}if(Math.hypot(run.player.x-480,run.player.y-300)<22)centered=true;
   input=moveTo(run.player,centered?target:{x:480,y:300});input.interact=centered&&Math.hypot(target.x-run.player.x,target.y-run.player.y)<75;if(run.partner)input.partner=moveTo(run.partner,centered?target:{x:480,y:300});
  }else{
   if(run.abilities.includes('morph')&&run.form!=='spark'&&(run.player.morphCooldown??0)<=0)A.morphRun(run,'spark');
   input=combatInput(run);if(run.partner)input.partner=combatInput(run,run.partner,run.partnerForm,.8);
  }
  const oldRoom=run.room;A.stepRun(run,input,1/60);if(oldRoom!==run.room){index++;goalKey=null;const world=worldOf(run.room);if(!worlds.has(world)){times[world]=Math.round(run.time);worlds.add(world);}maxBytes=Math.max(maxBytes,JSON.stringify(run).length);}
 }
 assert.equal(run.phase,'won',JSON.stringify({mode:coop?'co-op':'solo',phase:run.phase,room:run.room,target:targetId,kills:run.kills,hp:run.player.hp,ally:run.partner?.hp,time:run.time,index,cleared:run.cleared.length}));
 assert.deepEqual([...laws],[1,2,3]);assert.equal(run.cleared.length,Object.keys(A.ROOMS).length,JSON.stringify(destinations.filter(id=>!run.cleared.includes(id))));assert.equal(run.loot.length,16);assert.deepEqual([...run.keys].sort(),Object.keys(KEYS).sort());assert.deepEqual([...run.seals].sort(),[...SEALS].sort());assert.deepEqual([...run.relics].sort(),Object.keys(ROUTE_RELICS).sort());assert.deepEqual([...run.secrets].sort(),Object.keys(EASTER_EGGS).sort());assert.equal(run.visitedVessels.length,6);assert.ok(A.validRun(run));assert.ok(A.validMeta(A.settleRun(structuredClone(run),meta)));assert.equal(new Set(run.discovered.map(worldOf)).size,WORLD_ORDER.length);assert.ok(maxBytes<130000,'Snapshot approaches room API limit: '+maxBytes);
 assert.ok(Object.values(run.masteryEarned).reduce((sum,xp)=>sum+xp,0)>0);if(coop)assert.ok(Object.values(run.partnerMasteryEarned).reduce((sum,xp)=>sum+xp,0)>0);
 console.log(JSON.stringify({mode:coop?'co-op':'solo',trained:process.argv.includes('--trained'),result:run.phase,seconds:Math.round(run.time),kills:run.kills,level:run.level,health:Math.round(run.player.hp),partnerHealth:run.partner?Math.round(run.partner.hp):null,rooms:run.cleared.length,stories:run.journal.length,loot:run.loot,keys:run.keys,seals:run.seals,relics:run.relics,secrets:run.secrets,vessels:run.visitedVessels,worldEntryTimes:times,laws:[...laws],mastery:run.masteryEarned,partnerMastery:run.partnerMasteryEarned,damageDealt:Math.round(run.stats.damageDealt),partnerDamageDealt:Math.round(run.stats.partner?.damageDealt??0),maxSnapshotBytes:maxBytes}));
}
