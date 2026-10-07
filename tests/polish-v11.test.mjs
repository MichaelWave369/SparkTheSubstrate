import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as A from '../public/action-engine.js';
import * as D from '../public/dungeon.js';
import {createBossRematch} from '../public/boss-rematch.js';
import {discoveryClues} from '../public/world-expansion.js';
import {drawSeal} from '../public/combat-view.js';
import {ui} from './ui-harness.mjs';

function journey(room='threshold'){
 const meta=A.createMeta(),run=A.createRun(meta,'spark',7919);run.room=room;run.cleared=[...new Set(['threshold',room])];run.discovered=[...run.cleared];run.abilities=['phase','root','fracture','morph'];return {version:2,meta,run};
}
test('the campaign HUD shows the current stratum and the world map counts all 126 rooms',()=>{
 const saved=journey('tide-harbor');saved.run.seals=['stratum'];saved.run.cleared.push('tide-refuge');const view=ui(saved);
 assert.equal(view.el('room-count').textContent,'2 / 18');assert.equal(view.el('room-count-label').textContent,'stratum progress');
 const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');assert.match(html,/SEVEN WORLDS · 126 ROOMS/);assert.doesNotMatch(html,/SIX WORLDS|0 \/ 33/);
});
test('Cistern, Nursery and Reliquary have different rendered obstacles on an existing save',()=>{
 const layouts=[];for(const room of ['cistern','nursery','reliquary']){const saved=journey(room),view=ui(saved);layouts.push(JSON.stringify(A.obstacles(room)));
  view.run('globalThis.drawnBoxes=[];ctx.fillRect=(x,y,w,h)=>drawnBoxes.push({x,y,w,h});draw()');const rectangles=JSON.parse(view.run('JSON.stringify(drawnBoxes)'));
  for(const box of A.obstacles(room))assert.ok(rectangles.some(r=>Object.keys(box).every(k=>r[k]===box[k])),room+' did not draw its collision obstacle');
 }
 assert.equal(new Set(layouts).size,3);assert.equal(A.obstacles('machine').length,2);
 assert.ok(new Set(Object.entries(A.ROOMS).filter(([,r])=>r.world==='stratum'&&!r.safe&&!r.boss&&!r.miniboss).map(([id])=>JSON.stringify(A.obstacles(id)))).size>=8);
});
test('a cleared legacy Reliquary gains clues and a separate relic without masking its key pickup',()=>{
 const saved=journey('reliquary');saved.run.journal=[{id:'reliquary:arrival',room:'reliquary',title:'Old memory',speaker:'Nacre',text:'I was here before the update.'}];saved.run.noticeTime=0;delete saved.run.relics;delete saved.run.secrets;
 const view=ui(saved);assert.match(view.el('world-message').textContent,/Lantern Grave|Nacre’s Feather/);assert.ok(view.run('run.journal.some(e=>e.id==="reliquary:clue:ivory-feather")'));
 const run=saved.run;Object.assign(run.player,{x:480,y:215});A.stepRun(run);assert.equal(run.banner.title,'Ivory Key acquired');assert.deepEqual(run.relics,undefined);
 Object.assign(run.player,A.pendingRelic(run));A.stepRun(run);assert.equal(run.banner.title,'Nacre’s Feather acquired');assert.match(run.banner.text,/Door Behind Sleep · Prism Night/);
 assert.match(discoveryClues('nursery')[0].text,/Spark/);
});
test('the map shows actionable discovery hints before arrival, with journal clues available on return visits',()=>{
 const view=ui(journey());view.run("act('map')");const first=view.el('large-map').innerHTML;
 assert.match(first,/unknown hinted[^>]+data-room="reliquary"/);assert.match(first,/Nacre’s Feather/);assert.match(first,/unknown hinted[^>]+data-room="nursery"/);assert.match(first,/golden cursor/);
 view.run("run.seals=['stratum'];act('map-world',{world:'tideglass'})");assert.match(view.el('large-map').innerHTML,/unknown hinted[^>]+data-room="tide-lantern"/);assert.match(view.el('large-map').innerHTML,/Salt Hourglass/);
});
test('every physical exit labels its destination and locked root prompts name that same room',()=>{
 const saved=journey('glass'),run=saved.run,texts=[],ctx=new Proxy({measureText:t=>({width:t.length*6}),fillText:t=>texts.push(t)},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});
 for(const [dir,exit]of Object.entries(A.ROOMS.glass.exits))drawSeal(ctx,run,A.ROOMS.glass,dir,exit,A.gateStatus(run,dir),A.exitPosition(dir));
 assert.ok(texts.includes('The Wild Margin'));assert.ok(texts.includes('Machine Sepulcher'));
 run.abilities=[];Object.assign(run.player,{x:49,y:300});const view=ui(saved);view.run('paused=false;draw()');assert.ok(view.drawn.some(t=>/WEST.*The Wild Margin/.test(t)));
 run.cleared=[];assert.equal(A.gateStatus(run,'west').to,'wild');
});
test('endless room titles, canvas, forecast and death results use dungeon names and reached depth',()=>{
 const view=ui(null,{entry:true});view.window.SparkDescent.selectProfile('pc');view.run("act('entry-dungeon');start('spark');draw();renderDungeonMap()");
 assert.equal(view.el('room-title').textContent,'The Shard Stair');assert.ok(view.drawn.includes('FLOOR 1 · The Shard Stair'));assert.doesNotMatch(view.drawn.join(' '),/Glass Causeway|northern gate/);assert.doesNotMatch(view.el('dungeon-map-content').innerHTML,/Glass Causeway/);
 view.run("run.dungeon.floor=4;run.dungeon.floorsCleared=3;run.phase='dead';run.player.hp=0;renderRail();renderOverlay(true)");assert.match(view.el('game-overlay').innerHTML,/Reached floor 4/);assert.match(view.el('game-overlay').innerHTML,/3 floors cleared before/);
});
test('rematch stats are independent of campaign level, enhanced gear and permanent upgrades',()=>{
 const first=journey('forge'),rich=structuredClone(first);rich.meta.gifts={heart:8,edge:8,haste:8};rich.meta.inventory.firstlight=3;rich.meta.inventory.dawnshell=3;rich.meta.loadout.weapon='firstlight';rich.meta.loadout.armor='dawnshell';rich.run.level=60;rich.run.boons.edge=45;rich.run.memoryEdge=10;rich.run.memoryHaste=5;rich.run.player.maxHp=1200;rich.run.player.hp=600;rich.run.gear.damage=20;
 const before=JSON.stringify(rich),baseline=createBossRematch(first.meta,first.run,'forge'),echo=createBossRematch(rich.meta,rich.run,'forge');
 for(const field of ['boons','gear','training','loadout','equipmentLevels','level','memoryEdge','memoryHaste'])assert.deepEqual(echo[field],baseline[field],field);
 assert.equal(echo.level,6);assert.equal(echo.player.maxHp,baseline.player.maxHp);assert.equal(echo.enemies[0].maxHp,4000);assert.equal(JSON.stringify(rich),before);
});
test('a deferred native dialog close cannot pause a fresh rematch and returning restores the original pause',()=>{
 const view=ui(journey('forge'));assert.equal(view.run('paused'),true);view.run("act('boss-rematches')");const dialog=view.el('boss-rematch-dialog'),onClose=dialog.handlers.get('close');dialog.close=()=>{dialog.open=false;};
 view.run("act('boss-rematch',{room:'forge'})");assert.equal(view.run('paused'),false);onClose();assert.equal(view.run('paused'),false);
 assert.equal(view.el('world-label').textContent,'REMATCH · THE FIRST STRATUM');assert.equal(view.el('room-title').textContent,'The Cantor');assert.equal(view.el('room-count').textContent,'LV 6');assert.equal(view.el('room-count-label').textContent,'fixed practice level');
 view.window.SparkRematches.control({frames:2});assert.ok(view.run('run.time')>0);view.window.SparkRematches.return();assert.equal(view.run('paused'),true);assert.equal(view.el('room-count').textContent,'2 / 18');
 view.run("act('boss-rematches');act('boss-rematch',{room:'forge'})");view.window.SparkRematches.return();onClose();assert.equal(view.run('paused'),true);
});
test('guardian floors have longer health reserves while existing endless snapshots still load',()=>{
 const run=D.createDungeon('spark',153);const old=structuredClone(run);assert.ok(D.validDungeon(old));old.dungeon.floor=5;old.dungeon.floorsCleared=4;const spec=D.dungeonFloor(old.seed,5);old.dungeon.condition=spec.condition;A.beginDungeonChamber(old,spec.room,spec.pressure);assert.equal(old.enemies[0].maxHp,5184);assert.ok(D.validDungeon(old));old.enemies[0].hp=936;old.enemies[0].maxHp=936;
 const values=new Map([[D.DUNGEON_KEY,JSON.stringify({version:1,run:old,record:{best:4,attempts:0}})]]);const loaded=D.loadDungeon({getItem:k=>values.get(k)});assert.equal(loaded.run.dungeon.floor,5);assert.equal(loaded.run.enemies[0].maxHp,936);assert.equal(loaded.record.best,4);
});
