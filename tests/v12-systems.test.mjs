import test from 'node:test';
import assert from 'node:assert/strict';
import * as A from '../public/action-engine.js';
import * as Dungeon from '../public/dungeon.js';
import * as D from '../public/duel-engine.js';
import {DUEL_BODY_CELLS,duelInputs} from '../public/duel-view.js';
import * as K from '../public/substrate-rewards.js';
import * as T from '../public/table-engine.js';
import {defaultSettings,cleanSettings,controllerInput} from '../public/settings.js';
import {ui} from './ui-harness.mjs';
const enemy=(kind='collector')=>({id:1,kind,x:510,y:390,r:14,hp:10000,maxHp:10000,speed:0,attack:10,orbitHit:0,flash:0});
function arena(mode='auto',dungeon=false){const r=dungeon?Dungeon.createDungeon('spark',153):A.createRun(A.createMeta(),'spark',153);r.room='glass';r.cleared=[];r.spawned=r.spawnTotal=1;r.player.x=480;r.player.y=390;r.player.iframes=100;r.fireMode=mode;r.enemies=[enemy()];return r;}
function step(r,seconds,input={}){for(let i=0;i<seconds*60&&r.phase==='playing';i++)A.stepRun(r,input);}
test('Auto stays the default; Manual does no weapon damage until held fire, in descent and endless',()=>{
 assert.equal(defaultSettings().fireMode,'auto');assert.equal(cleanSettings({fireMode:'unknown'}).fireMode,'auto');
 for(const dungeon of [false,true]){const manual=arena('manual',dungeon);step(manual,1);assert.equal(manual.stats.damageDealt,0);step(manual,1,{fire:true});assert.ok(manual.stats.damageDealt>0);const damage=manual.stats.damageDealt;manual.shots=[];step(manual,1);assert.equal(manual.stats.damageDealt,damage);const automatic=arena('auto',dungeon);step(automatic,1);assert.ok(automatic.stats.damageDealt>0);}
 const slow=arena('manual'),fast=arena('manual');fast.boons.cadence=3;step(slow,4,{fire:true});step(fast,4,{fire:true});assert.ok(fast.stats.damageDealt>slow.stats.damageDealt);
});
test('Surge holds a four-second cooldown and a separately purchased seal never spends essence',()=>{
 const state=K.cleanKeepsakes(null);state.coins=7;const before=structuredClone(A.createMeta());before.essence=99;const meta=structuredClone(before);K.breakVaultSeal(state,'surge');assert.equal(K.hasAlcove(state,'surge'),true);assert.equal(state.coins,1);assert.deepEqual(meta,before);assert.throws(()=>K.breakVaultSeal(state,'surge'),/already/);
 const run=arena('surge');A.stepRun(run,{fire:true});assert.equal(run.player.surgeCooldown,4);A.stepRun(run,{fire:true});assert.ok(Math.abs(run.player.surgeCooldown-(4-1/60))<1e-8);step(run,1,{fire:true});assert.ok(run.player.surgeCooldown>2.9);assert.ok(run.stats.damageDealt>0);
});
test('keyboard J, left click, controller RT and mobile FIRE feed the live fire path',()=>{
 const view=ui();view.key('1');view.window.SparkDescent.setFireMode('manual');view.run("run.room='glass';run.cleared=[];run.spawned=run.spawnTotal=1;run.enemies=[{id:999,kind:'collector',x:510,y:390,r:14,hp:9999,maxHp:9999,speed:0,attack:10,orbitHit:0,flash:0}];run.player.x=480;run.player.y=390;run.player.iframes=100");view.key('j');view.run('animate(100);animate(200)');assert.ok(view.run('run.stats.damageDealt')>0);view.listeners.get('keyup').fn({key:'j'});assert.equal(view.run("keys.has('j')"),false);
 view.el('game-canvas').handlers.get('pointerdown')({button:0,pointerId:1,preventDefault(){}});assert.equal(view.run('fireHeld'),true);
 view.run("chooseProfile('mobile')");view.el('touch-fire').handlers.get('pointerdown')({pointerId:2,preventDefault(){}});assert.equal(view.el('touch-fire').hidden,false);assert.equal(view.run('fireHeld'),true);
 const pad={connected:true,mapping:'standard',axes:[0,0],buttons:Array.from({length:16},()=>({pressed:false}))};pad.buttons[7].pressed=true;assert.equal(controllerInput([pad]).fire,true);assert.equal(controllerInput([pad],Array(16).fill(true)).fire,true);
 view.run("chooseProfile('controller')");view.window.navigator={getGamepads:()=>[pad]};view.run('animate(300)');assert.equal(view.run('controller.fire'),true);
});
test('Swarm pact changes one life, preserves normal room density, and cyan shooter fans keep their warning',()=>{
 const normal=A.createRun(A.createMeta(),'spark',19),pact=structuredClone(normal);pact.swarmPact=true;for(const r of [normal,pact]){r.player.x=480;r.player.y=50;A.stepRun(r,{interact:true});}assert.equal(normal.spawnTotal,14);assert.equal(pact.spawnTotal,18);assert.equal(pact.swarmPact,true);
 for(const r of [normal,pact]){r.spawned=r.spawnTotal;r.enemies=[{...enemy('archon'),x:700,y:390,windup:.1,chargeX:-1,chargeY:0}];r.player.attackClock=100;for(let i=0;i<7;i++)A.stepRun(r);}
 assert.equal(normal.shots.filter(s=>s.enemy).length,1);assert.equal(pact.shots.filter(s=>s.enemy).length,3);assert.ok(pact.shots.every(s=>!s.enemy||s.color==='#71e5e4'));
 const d=Dungeon.createDungeon('spark',44);assert.ok(Dungeon.validDungeon(d));
});
test('earned enemy fighters stay sealed until encountered; Cantor requires a won echo',()=>{
 const state=K.cleanKeepsakes(null);for(const id of ['collector','archon','cantor'])assert.equal(K.fighterAvailable(state,id),false);K.rememberEncounter(state,{enemies:['collector','archon','cantor']});assert.equal(K.fighterAvailable(state,'collector'),true);assert.equal(K.fighterAvailable(state,'archon'),true);assert.equal(K.fighterAvailable(state,'cantor'),false);K.rememberEncounter(state,{cantorWon:true});assert.equal(K.fighterAvailable(state,'cantor'),true);
 const view=ui(null,{entry:true});view.window.SparkDescent.selectProfile('pc');view.window.SparkDuel.start({forms:['human','spark']});assert.equal(view.window.SparkDuel.observe().forms[1],'spark');view.run("act('duel-select')");assert.match(view.el('duel-rosters').innerHTML,/duel-vessel[^>]*sealed[^>]*data-form="collector"[^>]*disabled/);assert.throws(()=>view.window.SparkDuel.start({forms:['collector','spark']}),/sealed/);
 assert.equal(new Set(Object.values(DUEL_BODY_CELLS)).size,9);assert.equal(D.DUEL_FORMS.length,6);assert.equal(D.DUEL_FIGHTERS.length,9);
});
test('Focus needs 24 frames, guards a hit, hastens a special, and a whiff costs ten meter',()=>{
 const m=D.createDuel({forms:['human','rock'],seed:18});m.fighters[0].x=420;m.fighters[1].x=500;m.fighters[0].meter=30;D.stepDuel(m,[{focus:true},{}],23);assert.equal(m.fighters[0].focusGuard,0);D.stepDuel(m,[{focus:true},{}]);assert.equal(m.fighters[0].focusGuard,12);D.stepDuel(m,[{},{light:true}],6);assert.equal(m.fighters[0].hp,100);assert.ok(m.events.some(e=>e.type==='focus-guard'));m.freeze=0;D.stepDuel(m,[{special:true},{}]);assert.equal(m.fighters[0].attack.startup,7);
 const whiff=D.createDuel({seed:8});whiff.fighters[0].meter=30;D.stepDuel(whiff,[{focus:true},{}],24);D.stepDuel(whiff,[{},{}],12);assert.equal(whiff.fighters[0].meter,20);
 const input=duelInputs('pc',new Set(['v','i']),[]);assert.equal(input[0].focus,true);assert.equal(input[1].focus,true);
});
test('Seal break ignores the first round block and normal blocks return afterwards',()=>{
 const m=D.createDuel({condition:'seal-break',seed:3});m.fighters[0].x=420;m.fighters[1].x=480;D.stepDuel(m,[{light:true},{x:1}],6);assert.equal(m.fighters[1].hp,92);D.stepDuel(m,[{},{}],60);m.fighters[0].x=420;m.fighters[1].x=480;D.stepDuel(m,[{light:true},{x:1}],6);assert.equal(m.fighters[1].hp,92);
});
test('one new card per visit, duplicate coins, first-clear receipts and losing duels are bounded',()=>{
 const state=K.cleanKeepsakes(null);const first=K.rewardChamber(state,'glass','glass:visit1');assert.equal(first.card.id,'first-player');assert.equal(state.coins,3);K.rewardChamber(state,'glass','glass:visit1');assert.equal(state.coins,3);K.findSparkCard(state,'feather','glass:visit1');assert.equal(state.cards.length,1);const duplicate=K.rewardChamber(state,'glass','glass:visit2');assert.equal(duplicate.card.duplicate,true);assert.equal(state.coins,5);K.rewardDuel(state,{winner:1,forms:['human','spark'],stage:'glass'},'loss');assert.equal(state.coins,5);
 for(const id of ['keys','seals','essence','mastery'])assert.equal(Object.hasOwn(state,id),false);
});
test('a Glass Causeway card is in the Table binder; Table sessions save and never write campaign progress',()=>{
 const meta=A.createMeta(),run=A.createRun(meta,'spark',52);run.room='glass';run.phase='playing';run.spawned=run.spawnTotal=0;run.enemies=[];A.stepRun(run,{},1/60);run.visitedVessels=['spark','human'];const view=ui({version:2,meta,run});view.run('paused=false;renderRail()');assert.ok(view.window.SparkCards.observe().some(c=>c.id==='first-player'));
 view.window.SparkTable.enter();const before=view.storage.get('spark-substrate-descent-v2');view.window.SparkCards.open();assert.match(view.el('binder-content').innerHTML,/First Player/);view.el('binder-dialog').close();view.window.SparkTable.start();view.window.SparkTable.playCard('first-player');assert.throws(()=>view.window.SparkTable.playCard('first-player'),/One spark card/);view.window.SparkTable.choose(2);assert.equal(view.window.SparkTable.observe().result.bonus,1);view.window.SparkTable.next();view.window.SparkTable.leave();
 const session=JSON.parse(view.storage.get(T.TABLE_KEY));assert.equal(session.scene,1);assert.ok(T.validTableSession(session));assert.equal(view.storage.get('spark-substrate-descent-v2'),before);view.window.SparkTable.enter();assert.equal(view.window.SparkTable.observe().scene,1);
 for(let n=1;n<6;n++){view.window.SparkTable.choose(n%3);view.window.SparkTable.next();}assert.equal(view.window.SparkTable.observe().phase,'ended');assert.equal(view.run('run.room'),'glass');assert.deepEqual(JSON.parse(view.run('JSON.stringify(run.keys)')),[]);assert.deepEqual(JSON.parse(view.run('JSON.stringify(run.seals)')),[]);assert.equal(view.storage.get('spark-substrate-descent-v2'),before);assert.ok(view.window.SparkCards.observe().some(c=>c.id==='the-uncreated'));const coins=view.run('keepsakes.coins');view.run('finishTable()');assert.equal(view.run('keepsakes.coins'),coins);
});
test('two six-sided spark dice remember sixes, fall on two ones, and end at twenty active minutes',()=>{
 let six,fall;for(let seed=1;seed<500&&(!six||!fall);seed++){const s=T.createTableSession({seed:Math.imul(seed,2654435761)>>>0,seats:['human','tree']});const result=T.rollTableScene(s,0);if(result.memory)six=result;if(result.fall)fall=result;}assert.ok(six.memory>0);assert.equal(fall.held,false);assert.deepEqual(fall&&[fall.memory,fall.fall],[0,true]);
 const s=T.createTableSession({seed:7,seats:['human','tree']});for(let i=0;i<240;i++)T.tickTable(s,5);assert.equal(s.phase,'ended');assert.equal(s.elapsed,1200);assert.ok(T.validTableSession(s));assert.ok(T.tableStats('rock').fault>T.tableStats('rock').pulse);assert.ok(T.tableStats('tree').root>T.tableStats('tree').fault);assert.ok(T.tableStats('computer').pulse>T.tableStats('computer').root);
});
test('vault purchase and Surge reload preserve the actual campaign save and essence',()=>{
 const meta=A.createMeta();meta.essence=73;const run=A.createRun(meta,'spark',98),state=K.cleanKeepsakes(null);state.coins=10;
 const view=ui({version:2,meta,run},{keepsakes:state});view.window.SparkVault.enter();const before=view.storage.get('spark-substrate-descent-v2');view.window.SparkVault.buy('surge');assert.equal(view.run('meta.essence'),73);assert.equal(view.storage.get('spark-substrate-descent-v2'),before);assert.equal(view.window.SparkVault.observe().alcoves[0].owned,true);view.window.SparkDescent.setFireMode('surge');
 const saved=JSON.parse(view.storage.get(K.SUBSTRATE_KEY)),preferences=JSON.parse(view.storage.get('spark-substrate-settings-v1'));const restored=ui(JSON.parse(before),{entry:true,keepsakes:saved,preferences});assert.equal(restored.run('settings.fireMode'),'surge');assert.equal(restored.run('meta.essence'),73);assert.equal(restored.window.SparkVault.observe().alcoves[0].owned,true);assert.ok(restored.window.SparkCards.observe().some(c=>c.id==='unbound-conduit'));
});
test('a won Cantor echo unlocks its fighter and memory, without changing campaign rooms or seals',()=>{
 const meta=A.createMeta(),run=A.createRun(meta,'spark',99);run.discovered.push('forge');const view=ui({version:2,meta,run});view.window.SparkRematches.start('forge');const before=view.run('JSON.stringify(campaignCache.run)');view.run('run.enemies[0].hp=0;stepRun(run);changed()');assert.equal(view.run('keepsakes.cantor'),true);assert.ok(view.window.SparkCards.observe().some(c=>c.id==='second-movement'));assert.equal(view.run('JSON.stringify(campaignCache.run)'),before);view.window.SparkRematches.return();view.window.SparkDuel.start({forms:['cantor','human']});assert.equal(view.window.SparkDuel.observe().forms[0],'cantor');
});
test('met fighters use their translated kits and a Human–Spark match finishes with coin isolation',()=>{
 const collector=D.createDuel({forms:['collector','human'],seed:3});collector.fighters[0].x=350;collector.fighters[1].x=350+D.DUEL_CONTACT;D.stepDuel(collector,[{special:true},{x:1}],12);assert.ok(collector.fighters[0].x>420);assert.ok(collector.fighters[1].hp<100);
 const archon=D.createDuel({forms:['archon','human'],seed:4});D.stepDuel(archon,[{special:true},{}],12);assert.equal(archon.bolts.length,1);assert.equal(archon.fighters[1].hp,100);D.stepDuel(archon,[{},{}],50);assert.ok(archon.fighters[1].hp<100);
 const view=ui(null,{entry:true});view.window.SparkDescent.selectProfile('pc');view.window.SparkDuel.start({forms:['human','spark']});for(let r=0;r<2;r++){view.run('duel.match.fighters[0].x=420;duel.match.fighters[1].x=480;duel.match.fighters[1].hp=8');view.window.SparkDuel.control([{light:true},{}],6);view.window.SparkDuel.control([{},{}],124);}assert.equal(view.window.SparkDuel.observe().phase,'finisher');view.run("act('duel-skip');duel.tick(0)");assert.equal(view.window.SparkDuel.observe().phase,'finished');assert.ok(view.window.SparkCards.observe().some(c=>c.id==='glass-oath'));assert.equal(view.run('keepsakes.coins'),4);assert.equal(view.storage.has('spark-substrate-descent-v2'),false);const total=view.run('keepsakes.coins');view.run('duel.tick(0)');assert.equal(view.run('keepsakes.coins'),total);
});
test('holding inspect reveals frame data and releasing hides it again',()=>{
 const view=ui(null,{entry:true});view.window.SparkDescent.selectProfile('pc');view.run('enterDuel()');const button=view.el('duel-inspect-0');assert.match(view.el('duel-rosters').innerHTML,/duel-frame-data[^>]+hidden/);button.handlers.get('pointerdown')({pointerId:1,preventDefault(){}});assert.equal(view.el('duel-frame-data-0').hidden,false);button.handlers.get('pointerup')();assert.equal(view.el('duel-frame-data-0').hidden,true);
});
test('invalid Table saves fail closed, and a met guest can join after two scenes',()=>{
 const s=T.createTableSession({seed:92,seats:['human','tree']});s.phase='result';s.result={stat:'new-god'};assert.equal(T.validTableSession(s),false);assert.equal(T.loadTableSession({getItem:()=>JSON.stringify(s)}),null);
 const session=T.createTableSession({seed:91,seats:['human','tree']}),state=K.cleanKeepsakes(null);state.met=['archon'];assert.throws(()=>T.inviteTableGuest(session,'archon',state),/two scenes/);for(let i=0;i<2;i++){T.rollTableScene(session,0);T.advanceTableScene(session);}T.inviteTableGuest(session,'archon',state);assert.equal(session.guest,'archon');assert.ok(T.validTableSession(session));
});
