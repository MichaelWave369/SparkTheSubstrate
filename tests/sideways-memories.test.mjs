import test from 'node:test';
import assert from 'node:assert/strict';
import {SIDE_KEY,SIDE_ROOMS,createSideJourney,createSideGuardianMemory,enterSideRoom,sideSave,restoreSide,sideDamage,sidePower,sideInteract,respawnSide,useSideService,saveSide,sideGeometry} from '../public/sideways-engine.js';
import {SIDE_MEMORY_KEY,memorySave,restoreMemory,guardianMemories} from '../public/sideways-memories.js';
import {SIDE_GUARDIAN_PATTERNS} from '../public/sideways-guardians.js';
import {physicalCoins,hitSideEnemy} from '../public/sideways-brawler.js';
import {SIDE_EQUIPMENT,sideSet} from '../public/sideways-build.js';
import {SIDE_PATHS,SIDE_CACHE_ROOMS} from '../public/sideways-paths.js';
import {EQUIPMENT} from '../public/equipment.js';
import {frames} from './sideways-path.mjs';
import {ui} from './ui-harness.mjs';

function parent(room='forge'){
 const s=createSideJourney();enterSideRoom(s,'nursery','');s.enemies.forEach(e=>e.hp=0);frames(s,{});enterSideRoom(s,room,'');s.enemies.forEach(e=>e.hp=0);frames(s,{});enterSideRoom(s,'threshold','');s.player.hp=91;s.wallet=17;s.build.weapon='wayfarer-edge';s.build.armor='held-shell';s.build.enhance=2;return s;
}
const emit=(s,type,text='',x=0,y=0)=>s.events.push({id:++s.eventSerial,type,text,x,y,time:s.time});

test('guardian memories require a defeated existing Sideways guardian and use a fixed isolated build',()=>{
 const s=parent();assert.throws(()=>createSideGuardianMemory(s,'glass'),/Defeat/);assert.throws(()=>createSideGuardianMemory(s,'tide-throne'),/Defeat/);
 const before=sideSave(s),m=createSideGuardianMemory(s,'forge');assert.deepEqual(sideSave(s),before);assert.equal(m.player.maxHp,180);assert.equal(m.player.hp,180);assert.equal(m.enemies[0].maxHp,600);assert.deepEqual(m.forms,s.forms);assert.equal(m.build.weapon,null);assert.equal(m.wallet,0);assert.equal(m.memoryPoints,0);assert.deepEqual(m.keys,[]);assert.deepEqual(m.seals,[]);assert.deepEqual(m.imprints,[]);assert.deepEqual(m.paths,[]);assert.deepEqual(guardianMemories(s).filter(g=>g.owned).map(g=>g.id),['forge']);
});
test('practice cannot deposit, buy, leave by a gate, heal at a glyph or overwrite the main save',()=>{
 const s=createSideGuardianMemory(parent(),'forge'),storage={setItem(){assert.fail('main storage was written');}};assert.equal(sideInteract(s),false);assert.match(s.notice,/Pause returns/);assert.throws(()=>respawnSide(s),/Retry/);assert.throws(()=>enterSideRoom(s,'threshold'),/guardian memory menu/);assert.throws(()=>useSideService(s,'bank'),/no purchases/);assert.throws(()=>sideSave(s),/own save slot/);assert.throws(()=>saveSide(storage,s),/own save slot/);
 physicalCoins(s,'fake',270,620,24);assert.equal(s.coins.length,0);assert.equal(s.lootLedger.length,0);
 const boss=s.enemies[0];hitSideEnemy(s,boss,boss.hp,{type:'power'},emit);frames(s,{},10);assert.equal(s.phase,'complete');assert.equal(s.wallet,0);assert.equal(s.coins.length,0);assert.equal(s.memoryPoints,0);assert.deepEqual(s.cleared,[]);assert.deepEqual(s.seals,[]);
});
test('a separate encounter save resumes remaining health and rejects other journeys, locked guardians and forged rewards',()=>{
 const p=parent(),s=createSideGuardianMemory(p,'forge');frames(s,{x:1},30);hitSideEnemy(s,s.enemies[0],100,{type:'light'},emit);s.player.invuln=0;sideDamage(s,30);const raw=memorySave(p,s),r=restoreMemory(raw,p);assert.ok(r);assert.equal(r.player.hp,150);assert.equal(r.enemies[0].hp,500);assert.equal(r.player.maxHp,180);assert.equal(r.player.x,s.player.x);assert.equal(r.wallet,0);
 for(const patch of [{parent:'another-journey'},{room:'tide-throne'},{form:'eighth'},{hp:181},{guardian:{hp:601,x:850}},{phase:'complete'},{phase:'fallen'},{time:-1},{x:10000}])assert.equal(restoreMemory({...raw,...patch},p),null);
 const forged=restoreMemory({...raw,wallet:900,keys:['ivory'],seals:['stratum'],build:{weapon:'firstlight'},imprints:['pulse-return']},p);assert.ok(forged);assert.equal(forged.wallet,0);assert.deepEqual(forged.keys,[]);assert.equal(forged.build.weapon,null);
});
for(const kind of Object.keys(SIDE_GUARDIAN_PATTERNS))test(kind+' announces a wind-up, locks its marks, and produces a bounded distinct pattern',()=>{
 const id=Object.keys(SIDE_ROOMS).find(id=>SIDE_ROOMS[id].boss===kind),s=createSideGuardianMemory(parent(id),id),e=s.enemies[0];e.clock=0;frames(s,{});assert.ok(e.windup>=.9);assert.equal(s.bolts.length,0);assert.match(e.attackHint,/./);const marks=s.marks.map(m=>m.x);frames(s,{x:1},30);assert.deepEqual(s.marks.map(m=>m.x),marks,'marks must not follow a dodge');frames(s,{},70);assert.ok(s.bolts.some(b=>b.guardian));assert.ok(s.bolts.length<=12);assert.ok(s.bolts.every(b=>b.color===SIDE_GUARDIAN_PATTERNS[kind].color));
 e.hp=e.maxHp*.45;frames(s,{});assert.equal(e.phase,2);if(kind==='cantor')assert.ok(s.events.some(v=>/SECOND MOVEMENT/.test(v.text)));if(kind==='demiurge'){e.hp=e.maxHp*.25;frames(s,{});assert.equal(e.phase,3);assert.ok(s.events.some(v=>/LAW 3/.test(v.text)));}
});
test('guardian death cancels its warned ground damage and airborne bolts',()=>{
 const s=createSideGuardianMemory(parent('grove-heart'),'grove-heart'),e=s.enemies[0];e.clock=0;frames(s,{});assert.equal(s.marks.length,2);s.bolts.push({source:e.id,enemy:true,x:s.player.x,y:s.player.y-25,vx:0,vy:0,life:3,damage:999,lane:0});hitSideEnemy(s,e,e.hp,{type:'power'},emit);s.player.invuln=0;frames(s,{},10);assert.equal(s.player.hp,180);assert.equal(s.phase,'complete');assert.equal(s.marks.length,0);assert.equal(s.bolts.length,0);
});
test('actual DOM opens an unlocked memory, pauses, reloads, returns to the same room and keeps campaign and Vault unchanged',()=>{
 const p=parent(),deviceStorage=new Map([[SIDE_KEY,JSON.stringify(sideSave(p))]]),h=ui(null,{entry:true,deviceStorage});h.run("chooseProfile('pc');act('entry-sideways');act('side-memories')");assert.match(h.el('side-overlay').innerHTML,/Guardian memories/);assert.match(h.el('side-overlay').innerHTML,/data-room="tide-throne" disabled/);h.window.SparkSideways.remember('forge');assert.equal(h.window.SparkSideways.observe().practice,true);assert.equal(h.window.SparkSideways.observe().paused,false);assert.equal(h.window.SparkSideways.observe().returnRoom,'threshold');const main=h.storage.get(SIDE_KEY),campaign=h.storage.get('spark-substrate-descent-v2'),vault=JSON.stringify(h.window.SparkVault.observe());h.window.SparkSideways.control({x:1,attack:true},120);h.key('Escape');assert.match(h.el('side-overlay').innerHTML,/Return to your journey/);assert.doesNotMatch(h.el('side-overlay').innerHTML,/restore health|New side journey|coins carried home/);assert.equal(h.storage.get(SIDE_KEY),main);assert.ok(h.storage.has(SIDE_MEMORY_KEY));h.run("act('side-quit')");
 const loaded=ui(null,{entry:true,deviceStorage});loaded.run("chooseProfile('pc');act('entry-sideways')");assert.equal(loaded.window.SparkSideways.observe().practice,true);assert.equal(loaded.window.SparkSideways.observe().menu,'pause');assert.equal(loaded.window.SparkSideways.observe().returnRoom,'threshold');assert.ok(loaded.window.SparkSideways.observe().time>0);loaded.window.SparkSideways.returnToJourney();const o=loaded.window.SparkSideways.observe();assert.equal(o.room,'threshold');assert.equal(o.player.hp,91);assert.equal(o.wallet,17);assert.equal(o.build.enhance,2);assert.equal(o.practice,false);assert.equal(o.paused,false);assert.equal(loaded.storage.has(SIDE_MEMORY_KEY),false);assert.equal(loaded.storage.get('spark-substrate-descent-v2'),campaign);assert.equal(JSON.stringify(loaded.window.SparkVault.observe()),vault);
});
test('a 5% loss and a 90% loss show their actual guardian health and retry restores only the encounter',()=>{
 for(const percent of [.05,.9]){const p=parent(),h=ui(null,{entry:true,deviceStorage:new Map([[SIDE_KEY,JSON.stringify(sideSave(p))]])});h.run("chooseProfile('pc');act('entry-sideways');act('side-memories');act('side-memory-start',{room:'forge'})");const m=h.run('side.journey');m.enemies[0].hp=m.enemies[0].maxHp*percent;m.player.invuln=0;sideDamage(m,999);h.run('side.events();side.render(true)');assert.equal(h.window.SparkSideways.observe().menu,'memory-result');assert.match(h.el('side-overlay').innerHTML,new RegExp(Math.round(percent*100)+'% remains'));assert.match(h.el('side-overlay').innerHTML,new RegExp(Math.ceil(m.enemies[0].hp)+' / 600 guardian HP'));h.window.SparkSideways.retryMemory();assert.equal(h.window.SparkSideways.observe().enemies[0].hp,600);assert.equal(h.window.SparkSideways.observe().player.hp,180);h.window.SparkSideways.returnToJourney();assert.equal(h.window.SparkSideways.observe().player.hp,91);}
});
test('all six matching sets use existing item names; Night Hunter moves farther and Pale Horizon preserves aimed bolt angles',()=>{
 for(const id of ['nightfangs','veilgarb','orbitprism','astralaegis','firstlight','dawnshell'])assert.equal(SIDE_EQUIPMENT[id].name,EQUIPMENT[id].name);
 const walk=gear=>{const s=createSideJourney();if(gear)s.build={...s.build,weapon:'nightfangs',armor:'veilgarb'};frames(s,{x:1,dash:true},1);const cd=s.player.dashCooldown;frames(s,{x:1},120);return {x:s.player.x,cd};};assert.ok(walk(true).x>walk(false).x+20);assert.ok(walk(true).cd<walk(false).cd);
 const bolt=gear=>{const s=createSideJourney();if(gear)s.build={...s.build,weapon:'orbitprism',armor:'astralaegis'};frames(s,{attack:true,up:true},12);return s.bolts[0];};assert.ok(Math.hypot(bolt(true).vx,bolt(true).vy)>Math.hypot(bolt(false).vx,bolt(false).vy)*1.09);assert.ok(Math.abs(bolt(true).vy/bolt(true).vx-bolt(false).vy/bolt(false).vx)<1e-8);
 const dawn=createSideJourney();dawn.build.weapon='firstlight';dawn.build.armor='dawnshell';dawn.player.hp=100;frames(dawn,{},60);assert.ok(dawn.player.hp>100.69);assert.equal(sideSet(dawn).name,'Before the Law');
});
test('an old feather save migrates even when the Reliquary was never cleared, and the new door names its needed path',()=>{
 const s=createSideJourney();s.secrets=['feather'];const raw=sideSave(s);delete raw.relics;const restored=restoreSide(raw);assert.ok(restored);assert.ok(restored.relics.includes('ivory-feather'));assert.equal(restored.cleared.includes('reliquary'),false);assert.ok(sideGeometry('night-rest').doors.some(d=>d.to==='night-door'&&d.path==='animal'));assert.ok(sideGeometry('orbit-rest').doors.some(d=>d.to==='orbit-window'&&d.relic==='unmade-thread'));assert.equal(SIDE_CACHE_ROOMS['origin-nameless'].foundRelic,'unmade-thread');assert.equal(SIDE_PATHS.human.name,'Rally ascent');
});
