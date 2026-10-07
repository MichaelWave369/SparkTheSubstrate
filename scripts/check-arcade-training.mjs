import assert from 'node:assert/strict';
import {createSideJourney,SIDE_ROOMS,sideSave,sideGeometry,SIDE_KEY,morphSide} from '../public/sideways-engine.js';
import {createMeta} from '../public/action-engine.js';
import {createDungeon,DUNGEON_KEY} from '../public/dungeon.js';
import {clearRoom,cross,walkTo,frames} from '../tests/sideways-path.mjs';
import {ui} from '../tests/ui-harness.mjs';
import {legacyUI} from '../tests/legacy-harness.mjs';
import {playFirstForge,playFirstMastery} from '../tests/legacy-training-flow.mjs';
import {ARCADE_KEY,legacyStorageKey} from '../public/memory-arcade-state.js';
import {LEGACY_BY_ID} from '../public/memory-arcade-manifest.js';

const s=createSideJourney(),earned={};
function visit(to){cross(s,to);clearRoom(s);const r=SIDE_ROOMS[to];if(r.key)walkTo(s,r.width-300);const glyph=sideGeometry(to).checkpoint;walkTo(s,glyph.x);frames(s,{});frames(s,{interact:true});frames(s,{});}
for(const room of ['glass','machine','cistern','forge','cistern','reliquary','nursery','archive','belfry','eye','tide-harbor','tide-archive','tide-harbor','tide-throne','grove-rest','grove-well','grove-rest','grove-heart','cinder-rest','cinder-fuel','cinder-rest','cinder-throne','night-rest','night-library','night-rest','night-nest','orbit-rest']){
 visit(room);if(room==='forge'){walkTo(s,420);frames(s,{});earned['first-forge']=sideSave(s);}if(room==='orbit-rest'){morphSide(s,'computer');walkTo(s,1330);frames(s,{});earned['first-mastery']=sideSave(s);}
}
const results=[];
for(const [id,play,backtrack]of [
 ['first-forge',playFirstForge,['cistern','machine','glass','threshold']],
 ['first-mastery',playFirstMastery,['night-nest','night-rest','cinder-throne','cinder-rest','grove-heart','grove-rest','tide-throne','tide-harbor','eye','belfry','archive','nursery','reliquary','cistern','machine','glass','threshold']]
]){
 const storage=new Map([[SIDE_KEY,JSON.stringify(earned[id])],['spark-substrate-descent-v2',JSON.stringify({version:2,meta:createMeta(),run:null})],
  [DUNGEON_KEY,JSON.stringify({version:1,run:createDungeon('rock',152),record:{attempts:0,best:0,last:null}})]]);
 const current=ui(null,{entry:true,deviceStorage:storage});current.run("chooseProfile('pc');act('entry-sideways');act('side-resume')");current.window.SparkSideways.control({interact:true},1);
 assert.ok(current.window.SparkMemoryArcade.observe().discovered.includes(id));assert.match(current.el('side-notice').textContent,new RegExp(LEGACY_BY_ID[id].title));
 const journey=current.run('side.journey');for(const room of backtrack)cross(journey,room);walkTo(journey,1210);frames(journey,{});current.window.SparkSideways.control({interact:true},1);
 assert.equal(current.window.SparkMemoryArcade.observe().active,true);const b=LEGACY_BY_ID[id],at=current.window.SparkMemoryArcade.observe().player.x;
 current.window.SparkMemoryArcade.control({x:1},Math.floor((b.x-at)/265*60));current.window.SparkMemoryArcade.control({interact:true},1);assert.match(current.el('side-overlay').innerHTML,new RegExp(b.commit.slice(0,7)));
 current.window.SparkMemoryArcade.play(id);const frame=current.el('arcade-frame'),session=current.run('side.arcade.session');frame.contentWindow={postMessage(){}};const before=new Map(storage);
 const old=legacyUI(id,{}, {session}),result=play(old);old.send('legacy-dispose');assert.equal(old.messages.some(m=>m.type==='legacy-error'),false);
 for(const message of old.messages)current.listeners.get('window:message').fn({source:frame.contentWindow,data:message});
 assert.equal(current.window.SparkMemoryArcade.observe().tokens,1);assert.equal(current.el('arcade-legacy-view').hidden,true);
 for(const [key,value]of before)if(key!==ARCADE_KEY)assert.equal(storage.get(key),value,'Modern save changed: '+key);
 const remembered=JSON.parse(storage.get(legacyStorageKey(id)));assert.ok(remembered['spark-substrate-descent-v2']);const reload=legacyUI(id,remembered);
 if(id==='first-forge'){assert.equal(JSON.parse(reload.storage()['spark-substrate-descent-v2']).meta.inventory.wayfarer,1);assert.equal(reload.observe().enhancedItems,1);}
 else {assert.ok(reload.window.SparkDescent.observe().rememberedTraining.spark.learned.includes('radiance-1'));assert.equal(reload.observe().activeSkills,1);}
 reload.send('legacy-dispose');current.run("act('arcade-reset',{build:'"+id+"'});act('arcade-reset-confirm')");assert.equal(current.window.SparkMemoryArcade.observe().tokens,1);assert.equal(storage.has(legacyStorageKey(id)),false);
 current.run("act('arcade-resume');act('arcade-exit');act('side-quit')");const refreshed=ui(null,{entry:true,deviceStorage:storage});assert.equal(refreshed.window.SparkMemoryArcade.observe().tokens,1);assert.ok(refreshed.window.SparkMemoryArcade.observe().discovered.includes(id));
 results.push({id,source:b.commit,proof:result.proof,discoveryRoom:earned[id].room});
}
console.log(JSON.stringify(results,null,2));
console.log('Training-cabinet acceptance passed: normal-health Cantor and route to the Moonless Dock; native terminal interaction; earned backtracks; authentic essence enhancement and mastery carried into a new life; capability-bound tokens; old save/reload, reset and modern save isolation.');
