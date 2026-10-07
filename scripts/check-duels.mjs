import assert from 'node:assert/strict';
import {createDuel,stepDuel,DUEL_FORMS,DUEL_FIGHTERS,DUEL_STAGES,recordDuel,cleanDuelRecord} from '../public/duel-engine.js';
let completed=0;
for(const difficulty of ['easy','medium','hard'])for(const [index,form]of DUEL_FIGHTERS.entries()){
 const match=createDuel({forms:[form,DUEL_FORMS[(index+3)%6]],stage:Object.keys(DUEL_STAGES)[index%6],bot:true,difficulty,seed:881+index});
 for(let frames=0;frames<40000&&match.phase!=='finished';frames++){
  const [player,opponent]=match.fighters,distance=Math.abs(player.x-opponent.x),toward=player.x<opponent.x?1:-1,input={x:distance>65?toward:0,light:frames%30===0,heavy:frames%60===15,launcher:frames%120===45,special:frames%310===80,super:player.meter>=100&&frames%60===0};
  stepDuel(match,[input,{}]);
  for(const fighter of match.fighters)assert.ok(Number.isFinite(fighter.x)&&Number.isFinite(fighter.hp)&&Number.isFinite(fighter.meter));
 }
 assert.equal(match.phase,'finished',difficulty+' / '+form+' did not finish');assert.equal(match.fighters[match.winner].rounds,2);assert.ok(match.fighters[match.winner].stats.damage>0);assert.ok(match.fighters[1].stats.specials>0);const record=recordDuel(match,cleanDuelRecord(null));assert.equal(record.matches,1);completed++;
 console.log(JSON.stringify({form,difficulty,winner:match.forms[match.winner],rounds:match.fighters.map(f=>f.rounds),seconds:Math.round(match.frames/60),damage:match.fighters.map(f=>Math.round(f.stats.damage))}));
}
// Two manual input streams finish with default health, walking into reach and using the common kit.
const local=createDuel({forms:['human','spark'],seed:91});
for(let frame=0;frame<40000&&local.phase!=='finished';frame++){
 const input=local.fighters.map((fighter,i)=>{const other=local.fighters[1-i],distance=Math.abs(fighter.x-other.x),toward=fighter.x<other.x?1:-1;return {x:distance>70?toward:0,light:frame%(i?80:28)===0,heavy:frame%(i?240:75)===15,special:frame%330===70,super:fighter.meter>=100&&frame%90===0};});stepDuel(local,input);
}
assert.equal(local.phase,'finished');assert.equal(local.fighters[local.winner].rounds,2);assert.ok(local.fighters.every(f=>f.stats.damage>0));
console.log('Duel simulation passed: '+completed+' complete bot matchups, all six stages, six vessels and three met-enemy fighters, plus a complete local-versus match; default health and real movement/attacks.');
