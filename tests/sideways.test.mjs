import test from 'node:test';
import assert from 'node:assert/strict';
import {SIDE_KEY,SIDE_ROOMS,SIDE_FORMS,createSideJourney,sideGeometry,stepSide,sideDoorStatus,enterSideRoom,sideInteract,morphSide,sideDamage,sidePower,respawnSide,sideSave,restoreSide,loadSide} from '../public/sideways-engine.js';
import {createRun,createMeta} from '../public/action-engine.js';
import {ui} from './ui-harness.mjs';
import {frames,climbCistern} from './sideways-path.mjs';

test('the side route contains 39 connected canon rooms, seven worlds and only six vessels',()=>{
 assert.equal(Object.keys(SIDE_ROOMS).length,39);assert.equal(new Set(Object.values(SIDE_ROOMS).map(r=>r.world)).size,7);assert.equal(SIDE_FORMS.length,6);
 const found=new Set(['threshold']),queue=['threshold'];while(queue.length){const id=queue.shift();for(const door of SIDE_ROOMS[id].doors){assert.ok(SIDE_ROOMS[door.to].doors.some(d=>d.to===id));if(!found.has(door.to)){found.add(door.to);queue.push(door.to);}}}assert.equal(found.size,39);
 assert.equal(new Set(Object.values(SIDE_ROOMS).filter(r=>r.boss).map(r=>r.boss)).size,8);
});
test('jump edge, coyote window and buffered landing use fixed ticks; holding cannot jump forever',()=>{
 const s=createSideJourney();frames(s,{x:1,jump:true},90);assert.equal(s.player.grounded,true);assert.equal(s.player.y,620);assert.ok(s.player.x>500);assert.equal(s.player.jumps,0);
 frames(s,{});s.player.grounded=false;s.player.coyote=5;s.player.y=615;frames(s,{jump:true});assert.ok(s.player.vy<0);
 const b=createSideJourney();b.player.y=610;b.player.grounded=false;b.player.coyote=0;b.player.vy=250;frames(b,{jump:true},4);assert.ok(b.player.vy<0,'buffer jumps after landing');
});
test('one-way ledges are landable and Down + Jump drops without falling through the floor',()=>{
 const s=createSideJourney(),ledge=sideGeometry('threshold').platforms[0];s.player.x=ledge.x+40;s.player.y=ledge.y-80;s.player.vy=120;s.player.grounded=false;frames(s,{},40);assert.equal(s.player.y,ledge.y);assert.equal(s.player.grounded,true);frames(s,{down:true,jump:true},60);assert.equal(s.player.y,620);assert.equal(s.player.grounded,true);
});
test('all six forms can reach the raised Cistern branch with ordinary jump controls',()=>{
 for(const form of SIDE_FORMS){const s=createSideJourney();enterSideRoom(s,'cistern','');s.cleared.push('cistern');s.enemies=[];s.forms=[...SIDE_FORMS];s.form=form;climbCistern(s);assert.equal(s.player.y,260,form);}
});
test('Animal has a second jump, Spark can drift, Computer air dashes, Tree grows a temporary step',()=>{
 const a=createSideJourney();a.form='animal';frames(a,{jump:true},20);frames(a,{});const y=a.player.y;frames(a,{jump:true});assert.ok(a.player.vy<-600);frames(a,{jump:true},20);assert.ok(a.player.y<y-100);
 const held=createSideJourney(),released=createSideJourney();frames(held,{jump:true},34);frames(released,{jump:true},34);frames(held,{jump:true},10);frames(released,{},10);assert.ok(held.player.y<released.player.y);
 const c=createSideJourney();c.form='computer';frames(c,{jump:true},10);frames(c,{dash:true},8);assert.ok(c.player.x>350);assert.equal(c.player.vy,0);
 const tree=createSideJourney();tree.form='tree';sidePower(tree);assert.equal(tree.bridges.length,1);frames(tree,{},721);assert.equal(tree.bridges.length,0);
});
test('ranged strikes are manual, repeat at attack speed, and can be aimed off a ledge',()=>{
 const s=createSideJourney();frames(s,{},120);assert.equal(s.bolts.length,0);frames(s,{attack:true,down:true},50);assert.ok(s.bolts.length>=2);assert.ok(s.bolts.every(b=>b.vy>0));assert.ok(s.events.some(e=>e.type==='strike'));
});
test('keys wait for a clear and contact; Nursery resonance unlocks six shapes while preserving injuries',()=>{
 const s=createSideJourney();enterSideRoom(s,'reliquary','');s.player.x=1600;frames(s,{});assert.equal(s.keys.length,0);s.enemies.forEach(e=>e.hp=0);frames(s,{});assert.deepEqual(s.keys,['ivory']);
 enterSideRoom(s,'nursery','');s.enemies.forEach(e=>e.hp=0);frames(s,{});assert.deepEqual(s.forms,SIDE_FORMS);s.player.hp=40;s.player.powerCooldown=6;morphSide(s,'tree');assert.equal(s.player.hp,40);assert.ok(s.player.powerCooldown>5);assert.equal(sideDoorStatus(s,sideGeometry('nursery').doors.find(d=>d.to==='archive')).open,true);
});
test('door requirements report the needed object, body or guardian; arrival latch prevents immediate bounce',()=>{
 const s=createSideJourney();enterSideRoom(s,'reliquary','');const door=sideGeometry(s.room).doors.find(d=>d.to==='nursery');assert.match(sideDoorStatus(s,door).reason,/Ivory Key/);assert.equal(sideDoorStatus(s,door).open,false);
 const t=createSideJourney();t.player.x=1405;frames(t,{interact:true});assert.equal(t.room,'glass');const west=sideGeometry(t.room).doors.find(d=>d.to==='threshold');t.player.x=west.x;t.player.y=west.y;assert.equal(sideInteract(t),false);assert.match(t.notice,/arrival/);frames(t,{},40);assert.equal(sideInteract(t),true);assert.equal(t.room,'threshold');
});
test('a fall returns to a remembered glyph with collected keys, defeated guardians and the chosen body kept',()=>{
 const s=createSideJourney();enterSideRoom(s,'reliquary','');s.enemies.forEach(e=>e.hp=0);s.player.x=1600;frames(s,{});s.player.invuln=0;sideDamage(s,999);assert.equal(s.phase,'fallen');assert.equal(s.falls,1);respawnSide(s);assert.equal(s.room,'threshold');assert.equal(s.player.hp,s.player.maxHp);assert.deepEqual(s.keys,['ivory']);assert.ok(s.cleared.includes('reliquary'));
});
test('guardian wind-up precedes distinct gold shots, second movement is visible and defeat remembers a seal',()=>{
 const s=createSideJourney();enterSideRoom(s,'forge','');frames(s,{},80);assert.equal(s.bolts.length,0);frames(s,{},80);assert.ok(s.enemies[0].windup>0);assert.equal(s.bolts.length,0);frames(s,{},60);assert.ok(s.bolts.some(b=>b.guardian&&b.color==='#f6be76'));s.enemies[0].hp=200;frames(s,{});assert.ok(s.events.some(e=>e.text.includes('SECOND MOVEMENT')));
 const w=createSideJourney();enterSideRoom(w,'eye','');const max=w.player.maxHp;w.enemies[0].hp=0;frames(w,{});assert.deepEqual(w.seals,['stratum']);assert.equal(w.player.maxHp,max+8);assert.ok(w.cleared.includes('eye'));
});
test('the Feather secret pays off only at the cross-world night seam and stays in its own save',()=>{
 const s=createSideJourney();enterSideRoom(s,'night-rest','');s.player.x=620;s.player.y=515;frames(s,{},40);assert.equal(sideInteract(s),false);assert.match(s.notice,/Nacre/);
 enterSideRoom(s,'reliquary','');s.player.x=1110;s.player.y=80;frames(s,{});assert.deepEqual(s.secrets,['feather']);enterSideRoom(s,'cinder-throne','');s.enemies[0].hp=0;frames(s,{});enterSideRoom(s,'night-rest','');s.player.x=620;s.player.y=515;frames(s,{},40);const max=s.player.maxHp;assert.equal(sideInteract(s),true);assert.equal(s.player.maxHp,max+20);assert.ok(s.secrets.includes('feather-path'));assert.equal(s.room,'nursery');frames(s,{},40);s.player.x=620;s.player.y=505;assert.equal(sideInteract(s),true);assert.equal(s.room,'night-rest');assert.ok(restoreSide(sideSave(s)).secrets.includes('feather-path'));
});
test('saving restores room combat and rejects corrupt, inconsistent or non-canon progress',()=>{
 const s=createSideJourney();enterSideRoom(s,'glass','');frames(s,{attack:true},80);s.enemies[0].hp=22;s.player.hp=68;const raw=sideSave(s),r=restoreSide(raw);assert.equal(r.room,'glass');assert.equal(r.player.hp,68);assert.equal(r.enemies[0].hp,22);assert.equal(r.player.attack,null);
 for(const patch of [{room:'eighth-world'},{form:'dragon'},{keys:['ivory']},{seals:['orbit']},{forms:SIDE_FORMS},{phase:'complete'},{player:{...raw.player,x:Infinity}},{visited:['glass','glass']}])assert.equal(restoreSide({...raw,...patch}),null);assert.equal(loadSide({getItem:()=>'{oops'}),null);
});
for(const profile of ['pc','controller','mobile'])test(profile+' enters Sideways through the real start page without changing an existing campaign',()=>{
 const meta=createMeta(),run=createRun(meta,'spark');const h=ui({meta,run},{entry:true});const original=h.storage.get('spark-substrate-descent-v2');assert.equal(h.el('entry-sideways').disabled,true);h.run("chooseProfile('"+profile+"');act('entry-sideways');act('side-new')");assert.equal(h.el('side-root').hidden,false);assert.equal(h.el('game-canvas').hidden,true);assert.equal(h.el('duel-canvas').hidden,true);assert.equal(h.el('side-canvas').hidden,false);assert.equal(h.window.SparkSideways.observe().form,'spark');assert.equal(h.el('side-touch').hidden,profile!=='mobile');h.window.SparkSideways.control({x:1,attack:true},120);assert.ok(h.window.SparkSideways.observe().player.x>500);h.run("act('side-map')");assert.match(h.el('side-overlay').innerHTML,/39 side rooms/);h.run("act('side-resume');act('side-quit')");assert.equal(h.storage.get('spark-substrate-descent-v2'),original);assert.ok(h.storage.has(SIDE_KEY));assert.equal(h.window.SparkDescent.observe().entryMode,'start');
 const restored=ui({meta,run},{entry:true,deviceStorage:h.storage});restored.run("act('entry-sideways');act('side-resume')");assert.equal(restored.window.SparkSideways.observe().room,'threshold');assert.ok(restored.window.SparkSideways.observe().player.x>500);
});
test('keyboard focus, pause, profile changes and blur clear side inputs; invalid agent controls cannot mutate state',()=>{
 const h=ui(null,{entry:true});h.run("chooseProfile('pc');act('entry-sideways');act('side-new')");assert.equal(h.key(' ').prevented,true);h.key('j');h.run('side.tick(.2)');assert.ok(h.window.SparkSideways.observe().player.y<620);h.key('escape');assert.equal(h.window.SparkSideways.observe().menu,'pause');assert.equal(h.run('side.keys.size'),0);h.run("act('side-resume')");const x=h.window.SparkSideways.observe().player.x;assert.throws(()=>h.window.SparkSideways.control({x:4},1),/bounded/);assert.throws(()=>h.window.SparkSideways.control({x:1},601),/bounded/);assert.equal(h.window.SparkSideways.observe().player.x,x);h.key('d');h.listeners.get('window:blur').fn();assert.equal(h.window.SparkSideways.observe().menu,'pause');assert.equal(h.run('side.keys.size'),0);h.run("chooseProfile('mobile')");assert.equal(h.run('side.keys.size'),0);
});
test('controller face buttons and mobile held actions feed the separate platform engine',()=>{
 const h=ui(null,{entry:true});h.run("chooseProfile('controller');act('entry-sideways');act('side-new')");const b=Array.from({length:16},()=>({pressed:false,value:0}));h.window.navigator={getGamepads:()=>[{connected:true,mapping:'standard',axes:[.7,0],buttons:b}]};b[0].pressed=true;b[2].pressed=true;h.run('side.tick(.15)');const s=h.window.SparkSideways.observe();assert.ok(s.player.x>270);assert.ok(s.player.y<620);assert.ok(h.run('side.journey.events.some(e=>e.type===\'strike\')'));
 h.run("chooseProfile('mobile');act('side-resume')");h.el('side-touch-heavy').handlers.get('pointerdown')({preventDefault(){},pointerId:2});assert.equal(h.run('side.touch.buttons.heavy'),true);h.el('side-touch-heavy').handlers.get('pointerup')({});assert.equal(h.run('side.touch.buttons.heavy'),false);
});
