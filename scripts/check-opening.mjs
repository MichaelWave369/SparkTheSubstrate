import assert from 'node:assert/strict';
import * as A from '../public/action-engine.js';
import {choose,moveTo,combatInput} from './campaign-controls.mjs';
for(const form of Object.keys(A.BODIES)){
 const meta=A.createMeta();while(!A.offeredForms(meta).includes(form))meta.runs++;const run=A.createRun(meta,form,245),route=['north','east','north','east','east','south'];let index=0;
 for(let frame=0;frame<30000&&run.phase!=='dead'&&!run.cleared.includes('nursery');frame++){
  if(choose(run))continue;let input;
  if(A.pendingKey(run))input=moveTo(run.player,A.pendingKey(run));
  else if(run.cleared.includes(run.room)){const target=A.exitPosition(route[index]);assert.ok(target,'Opening route exhausted');input=moveTo(run.player,target);input.interact=Math.hypot(run.player.x-target.x,run.player.y-target.y)<75;}
  else input=combatInput(run);
  const before=run.room;A.stepRun(run,input,1/60);if(before!==run.room)index++;
 }
 assert.notEqual(run.phase,'dead',JSON.stringify({form,room:run.room,kills:run.kills,hp:run.player.hp,time:run.time}));assert.ok(run.cleared.includes('nursery'),form+' did not reach resonance');assert.ok(run.keys.includes('ivory'));assert.ok(run.abilities.includes('morph'));assert.ok(A.validRun(run));console.log(JSON.stringify({form,result:'Nursery reached',seconds:Math.round(run.time),hp:Math.round(run.player.hp),kills:run.kills,level:run.level}));
}
