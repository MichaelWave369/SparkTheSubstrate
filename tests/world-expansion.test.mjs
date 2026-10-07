import {KEYS} from '../public/exploration.js';
import {sealReason} from '../public/combat-view.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as A from '../public/action-engine.js';
import * as D from '../public/dungeon.js';
import {WORLDS,WORLD_ORDER,SEALS} from '../public/worlds.js';
import {ROUTE_RELICS,EASTER_EGGS} from '../public/world-expansion.js';
import {ROOM_LAYOUTS} from '../public/room-layouts.js';
import {rematchBosses,createBossRematch} from '../public/boss-rematch.js';
import {ui} from './ui-harness.mjs';
const fresh=()=>A.createRun(A.createMeta(),'spark',245);
function inCleared(room){const run=fresh();run.room=room;run.cleared.push(room);run.abilities=['phase','root','fracture','morph'];return run;}
function pickup(run,item){Object.assign(run.player,item);A.stepRun(run,{});}
const opposite={north:'south',south:'north',east:'west',west:'east'};

test('all seven worlds have eighteen distinct rooms and reciprocal doors line up with the map',()=>{
 for(const world of WORLD_ORDER){const rooms=Object.entries(A.ROOMS).filter(([,r])=>r.world===world);assert.equal(rooms.length,18,world);assert.equal(new Set(rooms.map(([,r])=>r.coord.join(','))).size,18,world);}
 for(const [id,room]of Object.entries(A.ROOMS))for(const [direction,exit]of Object.entries(room.exits)){const next=A.ROOMS[exit.to];assert.ok(next);assert.equal(next.exits[opposite[direction]]?.to,id,id+' '+direction);if(room.world!==next.world)continue;const [x,y]=room.coord,[nx,ny]=next.coord;assert.deepEqual([nx-x,ny-y],{north:[0,-1],south:[0,1],east:[1,0],west:[-1,0]}[direction],id+' '+direction);}
});
test('later worlds get stronger gradually in health, damage and active enemy pressure',()=>{
 const names=['tide-archive','grove-well','cinder-fuel','night-library','orbit-relay','origin-witness'];let hp=0,damage=0,total=0;for(const id of names){const spec=A.ENCOUNTERS[id];assert.ok(spec.health>hp);assert.ok(spec.damage>damage);assert.ok(spec.total>total);assert.ok(spec.cap<=11&&spec.rangedCap<=3);hp=spec.health;damage=spec.damage;total=spec.total;}
 const run=inCleared('tide-archive');run.cleared=[];run.spawnTotal=1;run.spawnClock=0;A.stepRun(run);assert.ok(run.enemies[0].maxHp>40);
});
test('a local key cannot bypass the ward, and old guardian seals retain access to cleared worlds',()=>{
 const run=inCleared('tide-refuge');run.room='tide-number';run.cleared.push(run.room);run.keys=['pearl'];assert.match(A.gateStatus(run,'south').reason,/Last Tide Beacon/);assert.equal(sealReason(run,A.ROOMS[run.room].exits.south,A.gateStatus(run,'south')),'WARD');run.cleared.push('tide-beacon');assert.equal(A.gateStatus(run,'south').available,true);run.cleared=run.cleared.filter(id=>id!=='tide-beacon');run.seals=['tideglass'];assert.equal(A.gateStatus(run,'south').available,true);
 const final=inCleared('origin-answer');final.form='human';assert.equal(A.gateStatus(final,'west').available,false);final.seals=[...SEALS];assert.equal(A.gateStatus(final,'west').available,true);
});
test('five physical route relics open other worlds, explain their source, and persist without acting as equipment',()=>{
 for(const [id,relic]of Object.entries(ROUTE_RELICS)){const run=inCleared(relic.room),item=A.pendingRelic(run);assert.equal(item.relic,id);A.stepRun(run);assert.deepEqual(run.relics,[]);pickup(run,item);assert.deepEqual(run.relics,[id]);assert.equal(A.pendingRelic(run),null);assert.match(run.banner.text,new RegExp(relic.opens.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));const target=Object.entries(A.ROOMS).find(([,r])=>Object.values(r.exits).some(e=>e.relics?.includes(id))),[roomId,room]=target,direction=Object.keys(room.exits).find(d=>room.exits[d].relics?.includes(id));assert.notEqual(room.world,relic.world);run.room=roomId;run.cleared.push(roomId);if(room.exits[direction].ward)run.cleared.push(room.exits[direction].ward);run.keys=Object.keys(KEYS);run.relics=[];assert.match(A.gateStatus(run,direction).reason,new RegExp(WORLDS[relic.world].name));assert.equal(sealReason(run,room.exits[direction],A.gateStatus(run,direction)),'RELIC');run.relics=[id];assert.equal(A.gateStatus(run,direction).available,true);run.phase='dead';run.player.hp=0;const remembered=A.settleRun(run,A.createMeta());assert.deepEqual(remembered.relics,[id]);const next=A.createRun(remembered,A.offeredForms(remembered)[0],48);assert.deepEqual(next.relics,[id]);assert.ok(A.validMeta(remembered)&&A.validRun(next));}
});
test('secret investigations need the hinted vessel, reward once, and remain remembered after death',()=>{
 for(const [id,egg]of Object.entries(EASTER_EGGS)){const run=inCleared(egg.room);Object.assign(run.player,{x:730,y:300});A.stepRun(run,{interact:true});if(egg.vessel!=='spark'){assert.deepEqual(run.secrets,[]);assert.match(run.notice,/Press Q/);A.stepRun(run,{});A.morphRun(run,egg.vessel);A.stepRun(run,{interact:true});}assert.deepEqual(run.secrets,[id]);assert.equal(run.essence,egg.essence);assert.equal(A.pendingSecret(run),null);for(let i=0;i<120;i++)A.stepRun(run,{interact:true});assert.equal(run.essence,egg.essence);assert.match(run.journal.at(-1).text,/./);run.phase='dead';run.player.hp=0;const remembered=A.settleRun(run,A.createMeta());assert.deepEqual(remembered.secrets,[id]);}
});
test('a co-op partner can pick up a shared relic and investigate in its own vessel',()=>{
 const run=inCleared('tide-lantern');A.addPartner(run,'computer');Object.assign(run.partner,A.pendingRelic(run));A.stepRun(run,{partner:{}});assert.deepEqual(run.relics,['salt-hourglass']);run.room='tide-number';run.cleared.push(run.room);Object.assign(run.partner,{x:730,y:300});A.stepRun(run,{partner:{interact:true}});assert.deepEqual(run.secrets,['wrong-number']);assert.equal(run.form,'spark');assert.ok(A.validRun(run));
});
test('new relic and discovery validators are bounded and allow legacy saves with no added fields',()=>{
 const run=fresh(),meta=A.createMeta();for(const field of ['relics','secrets','roomKills','roomExtra'])delete run[field];delete meta.relics;delete meta.secrets;assert.ok(A.validMeta(meta)&&A.validRun(run));assert.equal(A.validRun({...run,relics:['salt-hourglass','salt-hourglass']}),false);assert.equal(A.validMeta({...meta,secrets:['unknown']}),false);assert.equal(A.validRun({...run,roomKills:-1}),false);A.stepRun(run);assert.equal(run.roomKills,0);
});
test('twelve layouts keep central pickup lanes, visible gate approaches and recoverable pillar collisions',()=>{
 assert.equal(ROOM_LAYOUTS.length,12);const seen=new Set();for(const [id,room]of Object.entries(A.ROOMS)){if(room.safe||room.boss||room.miniboss)continue;const boxes=A.obstacles(id);seen.add(JSON.stringify(boxes));for(const b of boxes){assert.ok(b.x>150&&b.x+b.w<810&&b.y>100&&b.y+b.h<490);assert.ok(!(b.x<495&&b.x+b.w>465));assert.ok(!(b.y<315&&b.y+b.h>285));}}
 assert.ok(seen.size>=8);const layouts=new Set();for(let floor=1;floor<25;floor++){const run=D.createDungeon('human',153);run.dungeon.floor=floor;layouts.add(JSON.stringify(A.obstacles('machine',run)));}assert.ok(layouts.size>=6);
 for(const boxes of ROOM_LAYOUTS)for(const box of boxes){const run=inCleared('tide-archive');run.player.x=box.x-15;run.player.y=box.y-15;const initial={...run.player};for(let i=0;i<120;i++)A.stepRun(run,{x:-1,y:-1});assert.ok(Math.hypot(run.player.x-initial.x,run.player.y-initial.y)>100);}
});
test('swarm progress measures defeated enemies, includes summoned foes, and never fills before the room clears',()=>{
 const run=inCleared('machine');run.cleared=[];run.spawned=14;run.spawnTotal=14;run.roomKills=0;run.enemies=[{id:999,kind:'collector',x:run.player.x+20,y:run.player.y,hp:1,maxHp:1,r:14,speed:0,attack:10,orbitHit:0,flash:0}];assert.equal(A.swarmProgress(run).fraction,0);assert.equal(A.swarmProgress(run).remaining,14);run.player.attackClock=0;A.stepRun(run);assert.equal(run.roomKills,1);assert.equal(A.swarmProgress(run).cleared,true);
 const waiting=fresh();waiting.room='cistern';waiting.spawned=22;waiting.spawnTotal=22;waiting.roomKills=21;waiting.enemies=[{hp:5}];const progress=A.swarmProgress(waiting);assert.equal(progress.remaining,1);assert.ok(progress.fraction<1);waiting.roomExtra=2;waiting.roomKills=22;waiting.enemies=[{hp:5},{hp:5}];assert.equal(A.swarmProgress(waiting).total,24);assert.equal(A.swarmProgress(waiting).remaining,2);
 const legacy=structuredClone(waiting);delete legacy.roomKills;delete legacy.roomExtra;assert.equal(A.swarmProgress(legacy).defeated,20);
});
test('endless best updates at a live checkpoint, survives reload, and does not count a death twice',()=>{
 const values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)},run=D.createDungeon('rock',153);run.spawned=run.spawnTotal;A.stepRun(run);assert.equal(run.phase,'resolve');const record=D.saveDungeon(storage,run,null);assert.equal(record.best,1);assert.equal(record.attempts,0);assert.equal(D.loadDungeon(storage).record.best,1);D.nextDungeonFloor(run);run.phase='dead';run.player.hp=0;const ended=D.saveDungeon(storage,run,record);assert.equal(ended.best,1);assert.equal(ended.attempts,1);assert.equal(D.saveDungeon(storage,run,ended).attempts,1);
});
test('checkpoint recovery scales with depth and vessel health, with readable reduced withering recovery',()=>{
 const run=D.createDungeon('rock',153);run.player.hp=30;const before=run.player.hp;run.spawned=run.spawnTotal;A.stepRun(run);assert.ok(run.player.hp-before>=32);assert.equal(run.dungeon.recovered,Math.ceil(run.player.hp-before));const early=A.floorRecovery(run);run.dungeon.floor=12;assert.ok(A.floorRecovery(run)>early);run.player.maxHp=600;assert.equal(A.floorRecovery(run),120);run.dungeon.condition='wither';assert.equal(A.floorRecovery(run),72);
});
test('dungeon menu and live HUD contain no campaign arrival instructions and show current versus best',()=>{
 const view=ui(null,{entry:true});view.window.SparkDescent.selectProfile('pc');view.run("act('entry-dungeon')");assert.doesNotMatch(view.el('world-message').textContent,/Glass Causeway|northern gate/);assert.equal(view.el('room-title').textContent,'The endless current');view.key('6');view.run('run.spawned=run.spawnTotal;run.enemies=[];stepRun(run);changed()');assert.equal(view.el('run-number').textContent,'FLOOR 1 · BEST 1');assert.equal(view.run('dungeonState.record.best'),1);view.run('run.noticeTime=0;renderRail()');assert.doesNotMatch(view.el('world-message').textContent,/northern gate|key|ward/i);
});
test('rematches normalize a current build, spawn tougher practice guardians, and award no campaign rewards',()=>{
 const meta=A.createMeta(),source=inCleared('forge');source.discovered.push('forge');source.boons.edge=5;source.level=9;source.player.hp=42;const before=structuredClone(source),echo=createBossRematch(meta,source,'forge');assert.equal(echo.rematch.build,'practice');assert.equal(echo.boons.edge,2);assert.equal(echo.enemies[0].kind,'cantor');assert.equal(echo.enemies[0].hp,4000);assert.equal(echo.player.hp,echo.player.maxHp);echo.enemies[0].hp=0;A.stepRun(echo);assert.equal(echo.phase,'won');assert.equal(echo.bossDefeated.name,'The Cantor');assert.equal(echo.essence,0);assert.deepEqual(echo.loot,[]);assert.deepEqual(echo.masteryEarned,{});assert.deepEqual(source,before);assert.equal(A.validRun(echo),false);assert.throws(()=>A.settleRun(echo,meta),/separate/);assert.throws(()=>createBossRematch(meta,null,'origin-heart'),/Encounter/);
 const old=A.createMeta();old.explored=['forge'];assert.equal(rematchBosses(old,null)[0].id,'forge');const practice=createBossRematch(old,null,'forge');assert.equal(practice.rematch.build,'practice');assert.equal(practice.phase,'playing');assert.equal(practice.player.maxHp,A.BODIES[practice.form].hp+12+50);
});
test('practice returns to an exact waiting gift without changing campaign storage, and all modes remain isolated',()=>{
 const meta=A.createMeta(),campaign=inCleared('forge');campaign.discovered.push('forge');campaign.phase='boon';campaign.choices=['edge','shell','cadence'];campaign.player.hp=51;const view=ui({version:2,meta,run:campaign},{entry:true});view.window.SparkDescent.selectProfile('pc');const stored=view.storage.get('spark-substrate-descent-v2'),before=view.run('JSON.stringify(run)');view.window.SparkRematches.start('forge');assert.equal(view.run('entryMode'),'rematch');assert.throws(()=>view.run("act('daily-start')"),/campaign/);assert.throws(()=>view.run("act('online')"),/solo/);view.run('run.enemies[0].hp=0;stepRun(run);changed()');assert.match(view.el('game-overlay').innerHTML,/The Cantor defeated/);assert.equal(view.run('meta.essence'),0);view.window.SparkRematches.return();assert.equal(view.run('JSON.stringify(run)'),before);assert.equal(view.storage.get('spark-substrate-descent-v2'),stored);assert.equal(view.run('entryMode'),'descent');view.window.SparkDescent.enter('continue');assert.equal(view.run('run.phase'),'boon');assert.match(view.el('game-overlay').innerHTML,/What will this life become/);
});
test('holding left and interact in the Nursery crosses the nearby west gate only once',()=>{
 const run=inCleared('nursery');run.keys=['ivory'];run.player.x=65;run.player.y=300;run.player.gateLatched=false;A.stepRun(run,{x:-1,interact:true});assert.equal(run.room,'cistern');for(let i=0;i<30;i++)A.stepRun(run,{x:-1,interact:true});assert.equal(run.room,'cistern');assert.equal(run.lastGate,'east');
});
