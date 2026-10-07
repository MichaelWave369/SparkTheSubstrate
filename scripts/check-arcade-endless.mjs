import assert from 'node:assert/strict';
import {createSideJourney,SIDE_ROOMS,sideSave,sideGeometry,SIDE_KEY} from '../public/sideways-engine.js';
import {createMeta} from '../public/action-engine.js';
import {createDungeon,DUNGEON_KEY} from '../public/dungeon.js';
import {clearRoom,cross,walkTo,frames} from '../tests/sideways-path.mjs';
import {ui} from '../tests/ui-harness.mjs';
import {legacyUI} from '../tests/legacy-harness.mjs';
import {playFirstEndless} from '../tests/legacy-endless-flow.mjs';
import {ARCADE_KEY,legacyStorageKey} from '../public/memory-arcade-state.js';

// Earn the discovery prerequisite through the current journey at normal health.
const s=createSideJourney();
function visit(to){cross(s,to);clearRoom(s);const r=SIDE_ROOMS[to];if(r.key)walkTo(s,r.width-300);const glyph=sideGeometry(to).checkpoint;walkTo(s,glyph.x);frames(s,{});frames(s,{interact:true});frames(s,{});}
for(const room of ['glass','machine','cistern','forge','cistern','reliquary','nursery','archive','belfry','eye','tide-harbor','tide-archive','tide-harbor','tide-throne','grove-rest','grove-well','grove-rest','grove-heart','cinder-rest','cinder-fuel','cinder-rest','cinder-throne'])visit(room);
assert.ok(s.cleared.includes('cinder-throne'));assert.ok(s.seals.includes('cinder'));walkTo(s,450);frames(s,{});
const storage=new Map([[SIDE_KEY,JSON.stringify(sideSave(s))],['spark-substrate-descent-v2',JSON.stringify({version:2,meta:createMeta(),run:null})],
 [DUNGEON_KEY,JSON.stringify({version:1,run:createDungeon('rock',155),record:{attempts:0,best:0,last:null}})]]);
const current=ui(null,{entry:true,deviceStorage:storage});current.run("chooseProfile('pc');act('entry-sideways');act('side-resume')");current.window.SparkSideways.control({interact:true},1);
assert.ok(current.window.SparkMemoryArcade.observe().discovered.includes('first-endless'));assert.match(current.el('side-notice').textContent,/First Endless/);

// Backtrack on the earned journey, then process its physical doorway normally.
const journey=current.run('side.journey');
for(const room of ['cinder-rest','grove-heart','grove-rest','tide-throne','tide-harbor','eye','belfry','archive','nursery','reliquary','cistern','machine','glass','threshold'])cross(journey,room);
walkTo(journey,1210);frames(journey,{});current.window.SparkSideways.control({interact:true},1);assert.equal(current.window.SparkMemoryArcade.observe().active,true);
current.window.SparkMemoryArcade.control({x:1},400);current.window.SparkMemoryArcade.control({interact:true},1);assert.match(current.el('side-overlay').innerHTML,/First Endless/);assert.match(current.el('side-overlay').innerHTML,/73d7d9b/);
current.window.SparkMemoryArcade.play('first-endless');const frame=current.el('arcade-frame'),session=current.run('side.arcade.session');frame.contentWindow={postMessage(){}};
const before=new Map(storage),old=legacyUI('first-endless',{}, {session});const result=playFirstEndless(old);old.send('legacy-dispose');
assert.equal(result.proof.floorsCleared,5);assert.equal(old.messages.some(m=>m.type==='legacy-error'),false);
for(const message of old.messages)current.listeners.get('window:message').fn({source:frame.contentWindow,data:message});
assert.equal(current.window.SparkMemoryArcade.observe().tokens,1);assert.equal(current.window.SparkMemoryArcade.observe().trail,true);assert.equal(current.el('arcade-legacy-view').hidden,true);
for(const [key,value]of before)if(key!==ARCADE_KEY)assert.equal(storage.get(key),value,'Current save changed: '+key);
assert.ok(storage.get(legacyStorageKey('first-endless')).includes('spark-substrate-endless-v1'));
const oldSave=JSON.parse(storage.get(legacyStorageKey('first-endless'))),reload=legacyUI('first-endless',oldSave);assert.equal(reload.window.SparkDungeon.observe().floorsCleared,5);assert.equal(reload.window.SparkDungeon.observe().floor,5);reload.send('legacy-dispose');
current.run("act('arcade-reset',{build:'first-endless'});act('arcade-reset-confirm')");assert.equal(current.window.SparkMemoryArcade.observe().tokens,1);assert.equal(storage.has(legacyStorageKey('first-endless')),false);assert.equal(storage.get(DUNGEON_KEY),before.get(DUNGEON_KEY));
current.run("act('arcade-resume');act('arcade-exit');act('side-quit')");const refreshed=ui(null,{entry:true,deviceStorage:storage});assert.equal(refreshed.window.SparkMemoryArcade.observe().tokens,1);assert.ok(refreshed.window.SparkMemoryArcade.observe().discovered.includes('first-endless'));
console.log('First Endless acceptance passed: normal-health Cinder Regent → terminal E → earned route back to Threshold → approach/read/play → authentic v0.9 floor-5 guardian → one token → safe exit and reload. Current campaign, modern Endless and Sideways saves remain separate; cabinet reset retains the token.');
console.log(JSON.stringify({source:'73d7d9bce0683daf075fd706f6cbad6a75790cc7',proof:result.proof,currentRoomsCleared:s.cleared.length,checkpoints:result.checkpoints},null,2));
