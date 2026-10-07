import {BODIES,BOONS,createMeta,createRun,morphRun,beginDungeonChamber,prepareDungeonGifts,validRun} from './action-engine.js?v=0.17.0';

export const DUNGEON_KEY='spark-substrate-endless-v1';
export const DUNGEON_CONDITIONS={
 steady:{name:'Unbroken current',desc:'A clean chamber. Learn its rhythm.'},
 fleet:{name:'Fleet echoes',desc:'Enemies move 12% faster.'},
 crowd:{name:'Crowded lattice',desc:'Six extra enemies; two extra active foes.'},
 fault:{name:'Fault weather',desc:'Violet circles warn for 1.5s before striking every 8s.'},
 wither:{name:'Withering refuge',desc:'Checkpoint recovery is reduced to 60% of its depth-scaled amount.'}
};
const CHAMBERS=['glass','machine','quiet','cistern','tide-sluice','grove-canopy','cinder-gears','night-trail','orbit-bridge','archive'];
const GUARDIANS=['forge','eye','tide-throne','grove-heart','cinder-throne','night-nest','orbit-throne','origin-heart'];
const ARENAS={glass:'The Shard Stair',machine:'The Buried Circuit',quiet:'The Listening Lattice',cistern:'The Echo Reservoir','tide-sluice':'The Brine Descent','grove-canopy':'The Root Spiral','cinder-gears':'The Turning Furnace','night-trail':'The Dreamfall','orbit-bridge':'The Pale Ascent',archive:'The Leafbound Step',forge:'The Cantor’s Rung',eye:'The Warden’s Rung','tide-throne':'The Drowned Rung','grove-heart':'The Thorn Rung','cinder-throne':'The Clockwork Rung','night-nest':'The Dreamwoven Rung','orbit-throne':'The Lunar Rung','origin-heart':'The Maker’s Rung'};
export const dungeonArenaName=spec=>ARENAS[spec.room]??'The Unnumbered Stair';
const mix=(seed,floor)=>(Math.imul((seed^Math.imul(floor,2654435761))>>>0,2246822519)>>>0);
export function dungeonFloor(seed,floor){
 if(!Number.isInteger(seed)||!Number.isSafeInteger(floor)||floor<1)throw Error('A dungeon needs a valid seed and floor.');
 const boss=floor%5===0,room=boss?GUARDIANS[(floor/5-1)%GUARDIANS.length]:floor===1?'glass':floor===2?'machine':CHAMBERS[mix(seed,floor)%CHAMBERS.length];
 const condition=floor<=2?'steady':Object.keys(DUNGEON_CONDITIONS)[mix(seed+17,floor)%5],n=floor-1;
 const pressure={health:1+n*.11,damage:.72*(1+n*.035),speed:(1+Math.min(.55,Math.log2(floor)*.07))*(condition==='fleet'?1.12:1),cap:Math.min(16,6+Math.floor(n/3))+(condition==='crowd'?2:0),total:Math.min(70,14+n*2)+(condition==='crowd'?6:0),interval:Math.max(.35,1-n*.012),rangedCap:Math.min(4,1+Math.floor(n/8))};
 return {floor,room,boss,condition,pressure};
}
function enterFloor(run){run.dungeon.recovered=0;run.dungeon.vesselRecovered=0;const spec=dungeonFloor(run.seed,run.dungeon.floor);run.dungeon.condition=spec.condition;beginDungeonChamber(run,spec.room,spec.pressure);run.notice='Floor '+spec.floor+' · '+DUNGEON_CONDITIONS[spec.condition].name+'. '+DUNGEON_CONDITIONS[spec.condition].desc+(spec.boss?' Guardian floor.':'');run.noticeTime=7;return run;}
export function createDungeon(form='spark',seed=Date.now()>>>0){
 if(!Object.hasOwn(BODIES,form)||!Number.isInteger(seed))throw Error('Choose a known dungeon vessel and seed.');
 const run=createRun(createMeta(),'spark',seed);run.abilities=['phase','root','fracture','morph'];if(form!=='spark')morphRun(run,form);run.player.morphCooldown=0;run.birthForm=form;run.dungeon={version:1,floor:1,floorsCleared:0,condition:'steady',pressure:null};return enterFloor(run);
}
export function nextDungeonFloor(run){
 if(!run?.dungeon||run.phase!=='resolve'||!run.cleared.includes(run.room))throw Error('Clear the current floor first.');
 if(run.xp>=run.nextXp)throw Error('Remember your waiting gifts before descending.');
 run.dungeon.floor++;return enterFloor(run);
}
export function chooseDungeonGift(run){prepareDungeonGifts(run);return run.choices;}
export function dungeonRung(floor){const names=['Ember','Wayfarer','Bellkeeper','Seamwalker','Archonbreaker','Unbound'];const rank=Math.floor((floor-1)/5);return names[Math.min(5,rank)]+(rank>=6?' '+(rank-4):'');}
export function validDungeon(run){
 const d=run?.dungeon;if(!Number.isInteger(run?.seed)||run.seed<0||run.seed>4294967295||!d||d.version!==1||run.partner||run.daily||!Number.isSafeInteger(d.floor)||d.floor<1||!Number.isSafeInteger(d.floorsCleared)||d.floorsCleared<0||d.floorsCleared>d.floor||!['playing','resolve','boon','dead'].includes(run.phase))return false;
 const spec=dungeonFloor(run.seed,d.floor);if(run.room!==spec.room||d.condition!==spec.condition||JSON.stringify(d.pressure)!==JSON.stringify(spec.pressure)||d.floorsCleared!==(run.cleared.includes(run.room)?d.floor:d.floor-1))return false;
 return validRun({...run,dungeon:undefined});
}
export function cleanDungeonRecord(raw){const result={attempts:0,best:0,last:null};if(!raw||typeof raw!=='object')return result;for(const key of ['attempts','best'])if(Number.isSafeInteger(raw[key])&&raw[key]>=0)result[key]=raw[key];if(raw.last&&Object.hasOwn(BODIES,raw.last.form)&&['floors','kills','seconds','seed'].every(k=>Number.isSafeInteger(raw.last[k])&&raw.last[k]>=0))result.last={...raw.last};return result;}
export function loadDungeon(storage){try{const state=JSON.parse(storage.getItem(DUNGEON_KEY)??'null');return {run:validDungeon(state?.run)?state.run:null,record:cleanDungeonRecord({...state?.record,best:Math.max(state?.record?.best??0,validDungeon(state?.run)?state.run.dungeon.floorsCleared:0)})};}catch{return {run:null,record:cleanDungeonRecord(null)};}}
export function saveDungeon(storage,run,raw){
 const record=cleanDungeonRecord(raw);if(run?.dungeon)record.best=Math.max(record.best,run.dungeon.floorsCleared);if(run?.phase==='dead'&&!run.dungeon.recorded){record.attempts++;record.best=Math.max(record.best,run.dungeon.floorsCleared);record.last={form:run.form,floors:run.dungeon.floorsCleared,kills:run.kills,seconds:Math.floor(run.time),seed:run.seed};run.dungeon.recorded=true;}
 storage.setItem(DUNGEON_KEY,JSON.stringify({version:1,run,record}));return record;
}
export function observeDungeon(run,record){return run?.dungeon?{mode:'dungeon',phase:run.phase,seed:run.seed,floor:run.dungeon.floor,floorsCleared:run.dungeon.floorsCleared,rung:dungeonRung(run.dungeon.floor),condition:DUNGEON_CONDITIONS[run.dungeon.condition],pressure:run.dungeon.pressure,form:run.form,player:{...run.player},time:run.time,level:run.level,choices:run.choices.map(id=>({id,name:BOONS[id].name})),next:dungeonFloor(run.seed,run.dungeon.floor+1),record}: {mode:'dungeon',phase:'select',record};}
