import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {DatabaseSync} from 'node:sqlite';
import * as A from '../public/action-engine.js';
import * as Worlds from '../public/worlds.js';
import * as Mastery from '../public/mastery.js';
import * as Records from '../public/run-record.js';
import * as Settings from '../public/settings.js';
import * as Entry from '../public/entry.js';
import * as CombatView from '../public/combat-view.js';
import {DuelScreen} from '../public/duel-view.js';
import {saveRunCard} from '../public/share-run.js';
import {KEYS,doorId} from '../public/exploration.js';
import * as Gear from '../public/equipment.js';
import {ProgressSave} from '../public/progress.js';
import {OnlineRoom} from '../public/online.js';
import {CHAMBER_STORIES,ENEMY_LORE} from '../public/story.js';
import {FORMS,validateSave} from '../public/engine.js';
import {handleProgressRequest} from '../server/progress.mjs';

import {ui} from './ui-harness.mjs';

test('skill-tree menus learn linked specialties between lives, retain points, and refuse mid-run changes',()=>{
 const meta=A.createMeta();meta.training.spark.xp=60;const view=ui({version:2,meta,run:null});view.run("act('skills')");assert.match(view.el('skill-content').innerHTML,/Far light/);assert.match(view.el('skill-content').innerHTML,/3 available/);assert.throws(()=>view.run("act('learn-skill',{form:'spark',skill:'radiance-2'})"),/first/);
 view.run("act('learn-skill',{form:'spark',skill:'radiance-1'});act('learn-skill',{form:'spark',skill:'radiance-2'})");assert.equal(view.window.SparkDescent.observe().rememberedTraining.spark.learned.length,2);assert.match(view.el('skill-content').innerHTML,/Spark · Beacon/);view.el('skill-dialog').close();view.key('1');assert.equal(view.run("specialty(run.training,'spark').name"),'Beacon');assert.throws(()=>view.run("act('rebuild-tree',{form:'spark'})"),/between lives/);
 view.run("run.phase='dead';run.player.hp=0;changed();act('rebuild-tree',{form:'spark'})");assert.equal(view.run('meta.training.spark.xp'),60);assert.equal(view.run('meta.training.spark.learned.length'),0);assert.equal(JSON.parse(view.storage.get('spark-substrate-descent-v2')).meta.training.spark.xp,60);
});
test('remapped keys and volume preferences are saved and drive the actual input path',()=>{
 const view=ui();view.run("act('settings');act('remap',{binding:'power'})");assert.equal(view.key('r').prevented,true);assert.equal(view.run('settings.bindings.power'),'r');assert.match(view.el('control-hints').textContent,/R power/);view.listeners.get('input').fn({target:{dataset:{setting:'flashes'},value:'0'}});assert.equal(JSON.parse(view.storage.get('spark-substrate-settings-v1')).flashes,0);
 view.el('settings-dialog').close();view.key('1');view.key('f');assert.equal(view.run('powerRequested'),false);view.key('r');assert.equal(view.run('powerRequested'),true);view.run('animate(50)');assert.ok(view.run('run.player.powerCooldown')>0);view.run("act('settings');act('reset-bindings')");assert.equal(view.run('settings.bindings.power'),'f');
});
test('Eye milestone choices use the keyboard and end with a karma-specific build summary',()=>{
 const view=ui();view.key('1');view.run("run.room='eye';run.cleared.push('eye');run.phase='milestone';run.karma=-50;renderOverlay(true)");assert.match(view.el('game-overlay').innerHTML,/The New Crown/);view.key('2');assert.equal(view.run('run.phase'),'won');assert.equal(view.run('run.victory'),'eye');assert.match(view.el('game-overlay').innerHTML,/FIRST DESCENT COMPLETE/);assert.match(view.el('game-overlay').innerHTML,/damage dealt/);assert.match(view.el('game-overlay').innerHTML,/Save run card/);assert.equal(view.run('meta.lastRun.ending'),'The New Crown');
});
test('first-life HUD reveals progression when it matters and daily launches a baseline current',()=>{
 const view=ui();assert.equal(view.el('header-karma').hidden,true);assert.equal(view.el('online-nav').hidden,true);assert.equal(view.el('skills-nav').hidden,true);view.key('1');view.run("run.room='glass';run.cleared.push('glass');run.phase='resolve';act('resolve',{index:0})");assert.equal(view.el('header-karma').hidden,false);assert.equal(view.el('online-nav').hidden,false);view.run("run.phase='dead';run.player.hp=0;changed();act('reincarnate');meta.gifts.heart=8;act('daily-start')");assert.equal(view.run('run.player.maxHp'),112);assert.match(view.el('run-number').textContent,/DAILY/);assert.equal(view.el('header-memory').textContent,'DAILY');assert.throws(()=>view.run("act('daily-start')"),/Finish this life/);
});
test('controller movement, dash pulses and held gate input feed the same live simulation',()=>{
 const view=ui();view.key('1');view.run("chooseProfile('controller')");const pad={connected:true,mapping:'standard',id:'Test controller',axes:[.5,0],buttons:Array.from({length:16},()=>({pressed:false,value:0}))};view.window.navigator={getGamepads:()=>[pad]};view.run('animate(50)');assert.ok(view.run('run.player.x')>480);pad.buttons[0].pressed=true;view.run('animate(100)');assert.equal(view.run('run.stats.dashes'),1);view.run('animate(150)');assert.equal(view.run('run.stats.dashes'),1);pad.buttons[0].pressed=false;pad.axes=[0,0];pad.buttons[1].pressed=true;view.run("run.player.x=480;run.player.y=50;run.player.gateLatched=false;animate(200)");assert.equal(view.run('run.room'),'glass');view.run('animate(250)');assert.equal(view.run('run.room'),'glass');
});
const save=run=>({version:2,meta:A.createMeta(),run});

test('keyboard choices survive reload, queued fragments stay bounded in the HUD, and repeats cannot choose twice',()=>{
 const run=A.createRun(A.createMeta(),'spark',34);Object.assign(run,{phase:'boon',level:3,nextXp:18,xp:19,choices:['edge','cadence','shell']});const view=ui(save(run));
 assert.match(view.el('game-overlay').innerHTML,/What will this life become/);assert.doesNotMatch(view.el('game-overlay').innerHTML,/life is paused/);assert.equal(view.el('xp-label').textContent,'18 / 18');assert.equal(view.run('paused'),false);
 assert.equal(view.key('2').prevented,true);assert.equal(view.run('run.boons.cadence'),1);assert.equal(view.run('run.xp'),1);assert.equal(view.run('run.phase'),'boon');const level=view.run('run.level');view.key('2',{repeat:true});assert.equal(view.run('run.level'),level);
 view.key('1');assert.equal(view.run('run.phase'),'playing');assert.equal(view.run('paused'),false);
 assert.ok(view.focuses.every(f=>f.id!=='h2'));assert.ok(view.focuses.every(f=>f.options?.preventScroll));
});
test('Space and arrow defaults are captured during play, never queue a dash behind a choice, and respect text fields',()=>{
 const view=ui();view.key('1');assert.equal(view.listeners.get('keydown').options.capture,true);
 assert.equal(view.key('Spacebar',{code:'Space'}).prevented,true);assert.equal(view.run('dashRequested'),true);assert.equal(view.key('ArrowDown').prevented,true);
 view.run("dashRequested=false;run.phase='boon';run.choices=['edge','cadence','shell'];renderOverlay(true)");assert.equal(view.key(' ').prevented,true);assert.equal(view.run('dashRequested'),false);assert.equal(view.key('ArrowUp').prevented,true);
 const field=view.key(' ',{target:{tagName:'INPUT'}});assert.equal(field.prevented,false);view.key('1',{target:{tagName:'INPUT'}});assert.equal(view.run('run.phase'),'boon');
 view.run('paused=true;renderOverlay(true)');assert.match(view.el('game-overlay').innerHTML,/What will this life become/);assert.doesNotMatch(view.el('game-overlay').innerHTML,/life is paused/);
});
test('story choices use number keys and Enter; menu pause stays disabled and the introduction starts at the top',()=>{
 const view=ui();assert.equal(view.el('pause-button').disabled,true);assert.equal(view.el('pause-button').textContent,'Pause');assert.equal(view.window.history.scrollRestoration,'manual');assert.equal(view.scrolls[0].top,0);assert.equal(view.el('game-overlay').scrollTop,0);assert.equal(view.focuses.length,0);
 view.key('1');view.run("run.room='glass';run.cleared.push('glass');run.phase='resolve';renderOverlay(true)");const karma=view.run('run.karma');view.key('3');assert.equal(view.run('run.karma'),karma);assert.equal(view.run('run.phase'),'resolve');view.key('Enter');assert.equal(view.run('run.karma'),karma+2);assert.equal(view.run('run.essence'),5);
 view.run("run.kills=1;run.phase='dead';run.player.hp=0;changed();act('reincarnate')");assert.equal(view.el('pause-button').disabled,true);assert.equal(view.el('pause-button').textContent,'Pause');assert.equal(view.run('meta.essence'),5);
});
test('rapid gift keys cannot spend karma when combat transitions to a story choice',()=>{
 const view=ui();view.key('1');view.run("run.room='glass';run.phase='boon';run.choices=['edge','cadence','shell'];run.spawned=run.spawnTotal=1;run.enemies=[{id:88,kind:'collector',x:run.player.x+30,y:run.player.y,r:14,hp:1,maxHp:1,speed:0,attack:1,orbitHit:0,flash:0}];renderOverlay(true)");
 view.key('2');assert.equal(view.run('run.boons.cadence'),1);view.run('useVesselPower(run);stepRun(run,{},1/60);renderOverlay()');assert.equal(view.run('run.phase'),'resolve');
 const karma=view.run('run.karma');view.key('Enter');assert.equal(view.run('run.phase'),'resolve');
 for(const key of ['2','3','1','2'])view.key(key);view.key('3',{repeat:true});assert.equal(view.run('run.karma'),karma);assert.equal(view.run('run.essence'),0);assert.equal(view.run('storyChoice'),1);assert.match(view.el('game-overlay').innerHTML,/aria-pressed="true" data-action="resolve" data-index="1"/);assert.match(view.el('game-overlay').innerHTML,/Enter to confirm/);
 view.key('Enter',{repeat:true});assert.equal(view.run('run.phase'),'resolve');view.key('Enter');assert.equal(view.run('run.karma'),karma-9);assert.equal(view.run('run.essence'),8);assert.equal(view.run('run.roomResolved.length'),1);
});
test('reloaded stories require intentional keyboard confirmation while pointer and Tab choices still work',()=>{
 const run=A.createRun(A.createMeta(),'spark',13);run.room='glass';run.cleared.push('glass');run.phase='resolve';const view=ui(save(run));view.key('Enter');assert.equal(view.run('run.phase'),'resolve');view.key('3');view.run('renderOverlay(true)');assert.equal(view.run('storyChoice'),2);
 const reloaded=ui(JSON.parse(view.storage.get('spark-substrate-descent-v2')));assert.equal(reloaded.run('storyChoice'),null);reloaded.key('Enter');assert.equal(reloaded.run('run.phase'),'resolve');
 const button={dataset:{action:'resolve',index:'0'}};reloaded.key('Enter',{target:{tagName:'BUTTON',closest:selector=>selector==='[data-action="resolve"]'?button:null}});assert.equal(reloaded.run('run.karma'),7);
 const pointer=ui(save(run));pointer.listeners.get('click').fn({target:{closest:()=>({dataset:{action:'resolve',index:'1'}})},preventDefault(){}});assert.equal(pointer.run('run.karma'),-9);assert.equal(pointer.run('run.phase'),'playing');
 view.run("run.phase='playing';renderOverlay();run.room='machine';run.phase='resolve';renderOverlay()");assert.equal(view.run('storyChoice'),null);view.key('Enter');assert.equal(view.run('run.phase'),'resolve');
});
test('settings hide pending choices, preserve paused time and restore gift or highlighted story on close',()=>{
 const view=ui();view.key('1');view.run("run.phase='boon';run.choices=['edge','cadence','shell'];renderOverlay(true);act('settings')");assert.equal(view.el('game-overlay').hidden,true);assert.equal(view.el('settings-pending').hidden,false);assert.match(view.el('settings-pending').textContent,/gift is waiting/);
 const time=view.run('run.time');view.run('animate(100)');view.key('2');assert.equal(view.run('run.time'),time);assert.equal(view.run('run.boons.cadence'),0);view.el('settings-dialog').close();assert.equal(view.el('game-overlay').hidden,false);assert.equal(view.run('paused'),false);assert.equal(view.run('run.phase'),'boon');view.key('2');assert.equal(view.run('run.boons.cadence'),1);
 view.run("run.room='glass';run.cleared.push('glass');run.phase='resolve';renderOverlay()");view.key('3');view.run("act('settings')");assert.match(view.el('settings-pending').textContent,/story choice is waiting/);view.el('settings-dialog').close();assert.equal(view.run('storyChoice'),2);view.key('Enter');assert.equal(view.run('run.karma'),2);
 view.run("act('pause');act('settings')");assert.equal(view.el('settings-pending').hidden,true);view.el('settings-dialog').close();assert.equal(view.run('paused'),true);assert.equal(view.el('game-overlay').hidden,false);
 view.run("online.role='guest';run.phase='boon';run.choices=['edge','cadence','shell'];renderOverlay();act('settings')");assert.equal(view.el('settings-pending').hidden,false);view.run("run.phase='playing';renderOverlay()");assert.equal(view.el('settings-pending').hidden,true);assert.equal(view.el('game-overlay').hidden,true);
});
test('Cistern arrival shows an approaching swarm countdown until the first real spawn',()=>{
 const view=ui();view.key('1');view.run("run.room='machine';run.cleared.push('machine');run.abilities.push('root');Object.assign(run.player,exitPosition('east'));enterGate(run,'east');draw()");assert.equal(view.run('run.room'),'cistern');assert.equal(view.run('run.enemies.length'),0);assert.ok(view.drawn.includes('SWARM 0 / 22 · 22 LEFT · 0.6s'));
 view.drawn.length=0;view.run('for(let i=0;i<40;i++)stepRun(run,{},1/60);draw()');assert.equal(view.run('run.spawned'),1);assert.equal(view.run('run.spawnTotal'),22);assert.ok(view.drawn.includes('SWARM 0 / 22 · 22 LEFT'));assert.equal(view.drawn.includes('Swarm approaching'),false);
 view.drawn.length=0;view.run("run.cleared.push('cistern');draw()");assert.ok(view.drawn.includes('SWARM CLEARED'));
});
test('normal online-save transitions keep the footer steady while real save failures stay visible',()=>{
 const view=ui(),normal=view.el('save-status').textContent;assert.equal(normal,'Progress saved on this device');
 for(const status of ['connecting','saved','pending','saved','device']){view.run('progress.setStatus('+JSON.stringify(status)+')');assert.equal(view.el('save-status').textContent,normal);}view.run("progress.setStatus('saved')");assert.match(view.el('save-status').title,/backed up online/);
 view.run("progress.setStatus('error')");assert.match(view.el('save-status').textContent,/device copy kept/);view.run("progress.setStatus('conflict')");assert.match(view.el('save-status').textContent,/Another tab/);view.run("saveAvailable=false;progress.setStatus('error')");assert.match(view.el('save-status').textContent,/Device save unavailable/);assert.doesNotMatch(view.el('save-status').textContent,/copy kept/);
 view.run("progress.setStatus('saved')");assert.match(view.el('save-status').textContent,/saved online/);const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');assert.match(html,/<span id="save-version">v0\.17\.0 · guardian memories<\/span>/);
});
test('equipment is found, retained, equipped, and enhanced to +3 with real next-life stat changes',()=>{
 const first=A.createMeta();assert.deepEqual(Object.keys(first.inventory),['wayfarer','bark']);const old=structuredClone(first);delete old.inventory;delete old.loadout;assert.ok(A.validMeta(old));assert.deepEqual(Gear.prepareEquipment(old),first);
 const run=A.createRun(first,'spark',41);run.phase='dead';run.player.hp=0;run.kills=1;run.loot=['prism','fang','bell','ash'];let meta=A.settleRun(run,first);assert.equal(meta.essence,4);assert.ok(['wayfarer','bark','prism','fang','bell','ash'].every(id=>id in meta.inventory));assert.ok(A.validMeta(meta));assert.throws(()=>A.settleRun(run,meta));
 const before=structuredClone(meta);meta=Gear.enhanceItem(meta,'bark');assert.equal(meta.essence,1);assert.equal(before.inventory.bark,0);assert.equal(meta.inventory.bark,1);meta.essence=30;meta=Gear.enhanceItem(Gear.enhanceItem(meta,'bark'),'bark');assert.equal(meta.inventory.bark,3);assert.throws(()=>Gear.enhanceItem(meta,'bark'));assert.throws(()=>Gear.equipItem(first,'ash'));
 meta=Gear.equipItem(meta,'bell');const form=A.offeredForms(meta)[0],next=A.createRun(meta,form,50);assert.equal(next.loadout.relic,'bell');assert.equal(next.player.maxHp,A.BODIES[form].hp+30);assert.equal(next.gear.haste,.12);assert.equal(next.gear.damage,0);assert.ok(A.validRun(next));
 const early=A.createRun(first,'spark',8);early.kills=1;early.phase='dead';early.player.hp=0;assert.equal(A.buyMemory(A.settleRun(early,first),'heart').gifts.heart,1);
});
test('new enemies telegraph a dodgeable beam and a defusable explosion; the Cantor rewards the optional Forge',()=>{
 const base=()=>{const run=A.createRun(A.createMeta(),'spark',5);run.player.attackClock=100;run.player.iframes=0;return run;};
 const enemy=(kind,x,y)=>({id:88,kind,x,y,r:17,hp:100,maxHp:100,speed:0,attack:0,orbitHit:0,flash:0,windup:0,chargeX:0,chargeY:0});
 const leech=base();leech.enemies=[enemy('leech',leech.player.x-170,leech.player.y)];A.stepRun(leech,{},1/60);assert.ok(leech.enemies[0].windup>0);leech.player.y+=65;for(let i=0;i<52;i++)A.stepRun(leech,{},1/60);assert.equal(leech.player.hp,leech.player.maxHp);
 const moth=base();moth.enemies=[enemy('moth',moth.player.x+35,moth.player.y)];A.stepRun(moth,{},1/60);assert.equal(moth.marks.length,1);moth.enemies[0].hp=1;moth.player.attackClock=0;for(let i=0;i<20;i++)A.stepRun(moth,{},1/60);assert.equal(moth.marks.length,0);assert.equal(moth.kills,1);assert.equal(moth.player.hp,moth.player.maxHp);
 const forge=base();forge.room='cistern';forge.cleared.push('cistern');Object.assign(forge.player,A.exitPosition('south'));A.enterGate(forge,'south');assert.equal(forge.enemies[0].kind,'cantor');assert.equal(forge.enemies[0].maxHp,1100);forge.enemies[0].hp=1;forge.player.attackClock=0;for(let i=0;i<120&&forge.phase==='playing';i++)A.stepRun(forge,{},1/60);assert.equal(forge.phase,'resolve');assert.ok(forge.loot.includes('ash'));assert.ok(forge.essence>=7);
});
function database(){const sqlite=new DatabaseSync(':memory:');for(const file of fs.readdirSync(new URL('../drizzle/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())sqlite.exec(fs.readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));return {sqlite,DB:{prepare(sql){let params=[];return {bind(...values){params=values;return this;},async first(){return sqlite.prepare(sql).get(...params)??null;},async run(){return {meta:{changes:Number(sqlite.prepare(sql).run(...params).changes)}};}};}}};}
test('server saves keep equipment and pending choices, hash credentials, and reject stale or unauthorized writes',async()=>{
 const db=database(),state=save(A.createRun(A.createMeta(),'spark',29));state.run.phase='boon';state.run.choices=['edge','cadence','shell'];
 const request=(path,method,body,token)=>handleProgressRequest(new Request('http://local/api/progress'+path,{method,headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})}),db);
 try{const created=await request('','POST',{state});assert.equal(created.status,201);const profile=await created.json(),path='/'+profile.id;
  assert.notEqual(db.sqlite.prepare('SELECT token_hash FROM progress').get().token_hash,profile.token);assert.equal((await request(path,'GET',null,'wrong')).status,403);
  const read=await (await request(path,'GET',null,profile.token)).json();assert.deepEqual(read.state,state);assert.equal(read.token,undefined);
  const upgraded=structuredClone(state);upgraded.meta.essence=5;upgraded.meta=Gear.enhanceItem(upgraded.meta,'bark');assert.equal((await request(path,'PUT',{revision:1,state:upgraded},profile.token)).status,200);
  assert.equal((await request(path,'PUT',{revision:1,state},profile.token)).status,409);const again=await (await request(path,'GET',null,profile.token)).json();assert.equal(again.revision,2);assert.equal(again.state.meta.inventory.bark,1);assert.equal(again.state.run.phase,'boon');assert.equal((await request(path,'PUT',{revision:2,state:{version:2,meta:{},run:null}},profile.token)).status,400);
 }finally{db.sqlite.close();}
});
test('save clients restore from D1 and concurrent tabs preserve the newest recorded progress',async()=>{
 const db=database(),store=new Map(),storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)},fetcher=(path,options={})=>handleProgressRequest(new Request('http://local'+path,options),db),first=new ProgressSave({fetch:fetcher,storage}),state=save(null);
 try{assert.deepEqual(await first.open(state),state);const next=structuredClone(state);next.meta.essence=12;next.meta=Gear.enhanceItem(next.meta,'bark');first.queue(next);await first.flush();assert.equal(first.status,'saved');
  const a=new ProgressSave({fetch:fetcher,storage}),b=new ProgressSave({fetch:fetcher,storage});assert.deepEqual(await a.open(state),next);assert.deepEqual(await b.open(state),next);const newest=structuredClone(next);newest.meta=Gear.enhanceItem(newest.meta,'bark');a.queue(newest);await a.flush();b.queue(state);await b.flush();assert.equal(b.status,'conflict');const reloaded=new ProgressSave({fetch:fetcher,storage});assert.deepEqual(await reloaded.open(state),newest);
 }finally{if(first.timer)clearTimeout(first.timer);db.sqlite.close();}
});

test('a pointer on any part of a body card starts once, and Space starts a form without scrolling',()=>{
 const view=ui(),form=A.offeredForms(A.createMeta())[1],card={dataset:{action:'start',form}},portrait={closest:()=>card};const event={target:portrait,button:0,pointerId:1,clientX:50,clientY:80,preventDefault(){},stopPropagation(){}};
 view.listeners.get('pointerdown').fn(event);view.listeners.get('pointerup').fn({...event,clientX:52,clientY:81});assert.equal(view.window.SparkDescent.observe().form,form);assert.equal(view.run('menu'),false);view.listeners.get('click').fn(event);assert.equal(view.window.SparkDescent.observe().form,form);assert.equal(view.el('announcer').textContent,'');
 const keyboard=ui();assert.equal(keyboard.key(' ').prevented,true);assert.equal(keyboard.run('menu'),false);assert.equal(keyboard.window.SparkDescent.observe().form,'spark');
 const click=ui();click.listeners.get('click').fn(event);assert.equal(click.window.SparkDescent.observe().form,form);
});
test('story essence appears in the header immediately and is not counted twice after settlement',()=>{
 const view=ui();view.key('1');view.run("run.room='glass';run.phase='resolve';act('resolve',{index:1})");assert.equal(view.el('header-memory').textContent,'◇ 8');assert.equal(view.run('meta.essence'),0);assert.match(view.el('header-memory').title,/8 earned this life/);
 view.run("run.phase='dead';run.player.hp=0;changed()");assert.equal(view.el('header-memory').textContent,'◇ 8');assert.equal(view.run('meta.essence'),8);
});
test('actual player damage produces an actor flash and a visible damage number',()=>{
 const view=ui();view.key('1');view.run("settings.damageNumbers=true;run.player.iframes=0;run.enemies=[{id:88,kind:'collector',x:run.player.x,y:run.player.y,r:14,hp:100,maxHp:100,speed:0,attack:1,orbitHit:0,flash:0}];stepRun(run,{},1/60);draw()");
 assert.ok(view.run('run.player.hurtFlash')>0);assert.equal(view.run('run.player.maxHp-run.player.hp'),10);assert.ok(view.drawn.includes('−10'));assert.equal(view.run("run.effects.find(fx=>fx.type==='damage').value"),10);
});
test('F activates the real vessel power once and number-based mini maps retain full room labels',()=>{
 const view=ui();view.key('1');assert.equal(view.key('f').prevented,true);view.run('animate(40)');assert.ok(view.run('run.player.powerCooldown')>0);assert.equal(view.run('powerRequested'),false);view.key('f',{repeat:true});assert.equal(view.run('powerRequested'),false);assert.match(view.el('mini-map').innerHTML,/<span>Threshold<\/span>/);assert.match(view.el('mini-map').innerHTML,/title="The Threshold"/);
 view.run("act('map')");assert.match(view.el('world-tabs').innerHTML,/Tideglass Expanse/);assert.match(view.el('large-map').innerHTML,/Threshold/);assert.doesNotMatch(view.el('large-map').innerHTML,/[⚿✥]/);view.run("act('map-world',{world:'tideglass'})");assert.match(view.el('large-map').innerHTML,/Salt Archive/);assert.equal(view.el('large-map').style.gridTemplateColumns,'repeat(4,minmax(90px,1fr))');assert.equal(view.el('world-travel').disabled,true);
});
test('New Save needs its in-game confirmation and can restore the prior spark and private credential',()=>{
 const meta=A.createMeta();meta.essence=42;meta.keys=['ivory'];meta.seals=['stratum'];const run=A.createRun(meta,'spark',3);run.room='tide-harbor';run.cleared.push('tide-harbor');run.discovered.push('tide-harbor');const view=ui({version:2,meta,run}),credential=JSON.stringify({id:'previous-profile',token:'previous-secret'});view.storage.set('spark-substrate-save-credential',credential);
 view.run("act('new-save')");assert.equal(view.el('new-save-dialog').open,true);assert.equal(view.run('meta.essence'),42);view.run("act('new-save-confirm')");assert.equal(view.run('menu'),true);assert.equal(view.run('meta.runs'),0);assert.equal(view.run('meta.essence'),0);assert.equal(view.run('meta.keys.length'),0);assert.equal(view.run('meta.seals.length'),0);assert.match(view.el('game-overlay').innerHTML,/YOUR FIRST LIFE/);assert.equal(view.storage.has('spark-substrate-save-credential'),false);
 const backup=JSON.parse(view.storage.get('spark-substrate-previous-spark'));assert.equal(backup.state.run.room,'tide-harbor');assert.equal(backup.state.meta.essence,42);assert.equal(backup.credential,credential);view.run("act('restore-previous')");assert.equal(view.run('meta.essence'),42);assert.equal(view.run('run.room'),'tide-harbor');assert.equal(view.run('paused'),true);assert.equal(view.storage.get('spark-substrate-save-credential'),credential);assert.ok(view.run('validMeta(meta)&&validRun(run)'));
});
test('a discarded save connection cannot replace the new save credential after its request finishes',async()=>{
 const store=new Map(),storage={getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,value)};let release;const response=new Promise(resolve=>release=resolve),statuses=[],old=new ProgressSave({storage,fetch:()=>response,onStatus:status=>statuses.push(status)}),opening=old.open(save(null));old.dispose();storage.setItem('spark-substrate-save-credential','new-profile');const before=statuses.length;release(new Response(JSON.stringify({id:'old-profile',token:'old-token',revision:1,state:save(null)}),{headers:{'content-type':'application/json'}}));assert.equal(await opening,null);assert.equal(store.get('spark-substrate-save-credential'),'new-profile');assert.equal(old.ready,false);assert.equal(statuses.length,before);old.queue(save(null));assert.equal(old.timer,null);
});
