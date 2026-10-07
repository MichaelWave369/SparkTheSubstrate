import test from 'node:test';
import assert from 'node:assert/strict';
import * as D from '../public/duel-engine.js';
import {duelInputs} from '../public/duel-view.js';
import {ui} from './ui-harness.mjs';

const close=(form='human')=>{const m=D.createDuel({forms:[form,'spark'],seed:128});m.fighters[0].x=350;m.fighters[1].x=550;return m;};
const step=(m,input={},n=1,i=0)=>{const pair=[{},{}];pair[i]=input;return D.stepDuel(m,pair,n);};
const keyName={lp:'light',hp:'heavy',lk:'lk',hk:'hk'};
function command(m,id,i=0){const toward=m.fighters[i].x<m.fighters[1-i].x?1:-1,c=D.DUEL_COMMANDS[id];for(const direction of c.directions)step(m,direction==='D'?{crouch:true}:{x:direction==='F'?toward:-toward},3,i);step(m,{[c.button]:true},1,i);}
function chain(m){for(const button of ['lp','lk','hp','hk']){step(m,{[button]:true});step(m,{},D.DUEL_MOVES[keyName[button]].startup+4);}return m;}

test('LP HP LK HK are distinct manual attacks with shared timing for all nine bodies',()=>{
 for(const form of D.DUEL_FIGHTERS)for(const button of ['lp','hp','lk','hk']){
  const m=close(form),move=D.DUEL_MOVES[keyName[button]];step(m,{[button]:true});assert.equal(m.fighters[1].hp,100);
  step(m,{},move.startup-2);assert.equal(m.fighters[1].hp,100);step(m);assert.equal(m.fighters[1].hp,100-move.damage,form+' '+button);
 }
 assert.notEqual(D.DUEL_MOVES.lk.range,D.DUEL_MOVES.light.range);assert.notEqual(D.DUEL_MOVES.hk.startup,D.DUEL_MOVES.heavy.startup);
});

test('low kicks require crouch-back, overhead HK defeats crouch-back, and a jump avoids low attacks',()=>{
 for(const [kind,crouch,expected]of [['lk',false,90],['lk',true,100],['hk',false,100],['hk',true,82]]){
  const m=close();D.stepDuel(m,[{[kind]:true},{x:1,crouch}],D.DUEL_MOVES[kind].startup);assert.equal(m.fighters[1].hp,expected,kind+' crouch='+crouch);
 }
 const airborne=close();D.stepDuel(airborne,[{lk:true},{jump:true}],8);assert.equal(airborne.fighters[1].hp,100);
});

test('four confirmed normal hits form one scaled chain and repeated LP cannot cancel itself',()=>{
 const m=chain(close());assert.equal(m.fighters[0].combo.hits,4);assert.equal(m.fighters[0].stats.bestCombo,4);
 assert.deepEqual(m.fighters[0].combo.moves,['light','lk','heavy','hk']);assert.ok(m.fighters[0].combo.damage>30&&m.fighters[0].combo.damage<52);
 const repeat=close();step(repeat,{lp:true},6);const id=repeat.fighters[0].attack.id;step(repeat);step(repeat,{lp:true});assert.equal(repeat.fighters[0].attack.id,id);
 const whiff=D.createDuel();step(whiff,{lp:true},6);const whiffId=whiff.fighters[0].attack.id;step(whiff,{hk:true});assert.equal(whiff.fighters[0].attack.id,whiffId,'a missed LP grants no cancel');
});

test('a directional break cancels a confirmed HK, scales its damage and launches with a shared cooldown',()=>{
 const m=chain(close());command(m,'break');assert.equal(m.fighters[0].attack.kind,'special');assert.equal(m.fighters[0].attack.technique,'break');
 step(m,{},18);assert.equal(m.fighters[0].combo.hits,5);assert.ok(m.fighters[1].y>0);assert.equal(m.fighters[0].stats.commands,1);assert.ok(m.fighters[0].cooldown>0);
});

test('all 27 vessel techniques execute from real directions and apply their translated fight effects',()=>{
 const names=new Set();for(const form of D.DUEL_FIGHTERS)for(const id of Object.keys(D.DUEL_COMMANDS)){
  const m=close(form);command(m,id);const f=m.fighters[0],tech=D.DUEL_TECHNIQUES[form][id];
  assert.equal(f.attack?.technique,id);assert.equal(f.cooldown,300);assert.equal(f.stats.commands,1);assert.equal(f.lastTechnique.name,tech.name);names.add(tech.name);
  step(m,{},24);assert.ok(m.fighters[1].hp<100,form+' '+id+' never connected');
  if(tech.guard)assert.ok(f.guard>0,form+' '+id+' guard');if(tech.root)assert.ok(m.fighters[1].root>0);if(tech.launcher)assert.ok(m.fighters[1].y>0);
 }
 assert.equal(names.size,27);
});

test('directional commands mirror for either fighter and reversed sides; stale motions remain normals',()=>{
 for(const i of [0,1])for(const swapped of [false,true])for(const id of Object.keys(D.DUEL_COMMANDS)){
  const m=close();if(swapped)[m.fighters[0].x,m.fighters[1].x]=[m.fighters[1].x,m.fighters[0].x];command(m,id,i);assert.equal(m.fighters[i].attack?.technique,id,'player '+i+' swapped '+swapped);
 }
 const stale=close();step(stale,{x:1},3);step(stale,{},30);step(stale,{crouch:true});step(stale,{lp:true});assert.equal(stale.fighters[0].attack.kind,'light');assert.equal(stale.fighters[0].stats.commands,0);
});

test('a technique uses five-percent chip and cannot be repeated while its power recovers',()=>{
 const m=close('computer');command(m,'trace');for(let n=0;n<30;n++)D.stepDuel(m,[{},{x:1}]);assert.ok(Math.abs(m.fighters[1].hp-99.3)<1e-8);
 const count=m.fighters[0].stats.specials;command(m,'trace');step(m,{},22);assert.equal(m.fighters[0].stats.specials,count);
});

test('short attack taps during hit-stop survive until the next playable frame',()=>{
 const m=close();step(m,{lp:true},6);assert.equal(m.freeze,3);step(m,{lk:true});step(m);step(m);assert.equal(m.fighters[0].attack.kind,'light');
 step(m);assert.equal(m.fighters[0].attack.kind,'lk');step(m,{},12);assert.equal(m.fighters[0].combo.hits,2);
});

test('a confirmed normal can spend a full meter on Super; its chain remains scaled and the next round resets it',()=>{
 const m=chain(close());m.fighters[0].meter=100;step(m,{super:true});assert.equal(m.fighters[0].meter,0);assert.equal(m.fighters[0].attack.kind,'super');
 step(m,{},36);assert.equal(m.fighters[0].combo.hits,5);assert.ok(m.fighters[0].combo.damage<60);assert.equal(m.fighters[0].stats.supers,1);
 m.clock=1/60;m.cinematic=0;m.freeze=0;step(m);step(m,{},120);assert.equal(m.phase,'playing');assert.ok(m.fighters.every(f=>f.combo.hits===0&&f.pending===null&&f.motion.length===0));
});

test('PC two-player four-button maps, both pads and mobile feed independent attack verbs',()=>{
 const keys=new Set(['f','g','c','b','k','l',',','.']),pc=duelInputs('pc',keys,[]);assert.ok(pc.every(p=>p.light&&p.heavy&&p.lk&&p.hk));
 const pad={connected:true,mapping:'standard',axes:[0,0],buttons:Array.from({length:16},(_,i)=>({pressed:i<4,value:i<4?1:0}))};
 const pads=duelInputs('controller',new Set(),[pad,pad]);assert.ok(pads.every(p=>p.light&&p.heavy&&p.lk&&p.hk&&!p.jump));
 const mobile=duelInputs('mobile',new Set(),[],{x:0,y:0,buttons:{light:true,heavy:true,lk:true,hk:true}},1);assert.deepEqual(mobile[0],{});assert.ok(mobile[1].lk&&mobile[1].hk);
});

test('live keyboard kicks, directional techniques and the paused move guide use the real DOM path',()=>{
 const v=ui(null,{entry:true});v.window.SparkDescent.selectProfile('pc');v.window.SparkDuel.start({forms:['human','spark']});
 v.key('c');v.listeners.get('keyup').fn({key:'c'});v.run('duel.tick(1/60)');assert.equal(v.window.SparkDuel.observe().fighters[0].pose,'lk');
 v.run("act('duel-rematch')");v.key('d');v.run('duel.tick(3/60)');v.listeners.get('keyup').fn({key:'d'});v.key('s');v.run('duel.tick(3/60)');v.listeners.get('keyup').fn({key:'s'});v.key('f');v.listeners.get('keyup').fn({key:'f'});v.run('duel.tick(1/60)');assert.equal(v.window.SparkDuel.observe().fighters[0].technique,'trace');
 const clock=v.window.SparkDuel.observe().clock;v.run("act('duel-guide')");assert.match(v.el('duel-overlay').innerHTML,/Rally step/);assert.match(v.el('duel-overlay').innerHTML,/Lumen thread/);assert.match(v.el('duel-overlay').innerHTML,/forward · down · LP/);
 v.run('duel.tick(1)');assert.equal(v.window.SparkDuel.observe().clock,clock);v.run("act('duel-pause')");assert.equal(v.run('duel.paused'),false);assert.equal(v.run('duel.match.fighters.some(f=>!!f.pending)'),false);
 v.run("duel.match.phase='finished';duel.match.winner=0;act('duel-guide');act('duel-pause')");assert.equal(v.run('duel.paused'),false);assert.match(v.el('duel-overlay').innerHTML,/wins the duel/);
 assert.match(v.el('duel-instructions').textContent,/C LK · B HK/);assert.match(v.el('duel-rosters').innerHTML,/HK 18 \/ 5 \/ 23/);
});

test('touch kick taps and pause or focus loss clear buffered combat actions',()=>{
 const v=ui(null,{entry:true});v.window.SparkDescent.selectProfile('mobile');v.window.SparkDuel.start();v.run("act('duel-ready')");
 const kick=v.el('duel-touch-hk'),event={pointerId:3,preventDefault(){}};kick.handlers.get('pointerdown')(event);kick.handlers.get('pointerup')(event);v.run('duel.tick(1/60)');assert.equal(v.window.SparkDuel.observe().fighters[0].pose,'hk');
 v.run("duel.match.freeze=3;act('duel-input-light');duel.tick(1/60);act('duel-pause')");assert.equal(v.run('duel.match.fighters.some(f=>!!f.pending)'),false);assert.equal(v.run('Object.keys(duel.touch.buttons).length'),0);
 v.run("act('duel-pause');duel.match.freeze=3;act('duel-input-light');duel.tick(1/60)");v.listeners.get('window:blur').fn();assert.equal(v.run('duel.paused'),true);assert.equal(v.run('duel.match.fighters.some(f=>!!f.pending)'),false);
});

test('Medium and Hard bots perform command motions through the same parser without hidden opponent state',()=>{
 for(const difficulty of ['medium','hard']){const m=D.createDuel({forms:['rock','computer'],bot:true,difficulty,seed:29});for(let n=0;n<1200;n++)D.stepDuel(m,[{},{}]);assert.ok(m.fighters[1].stats.commands>0,difficulty);}
 const a=close(),b=structuredClone(a);a.bot=true;b.bot=true;a.difficulty=b.difficulty='hard';a.fighters[0].attack={kind:'hk',id:9,frame:1};b.fighters[0].attack={kind:'hk',id:9,frame:33};b.fighters[0].meter=100;b.fighters[0].cooldown=99;assert.deepEqual(D.duelBotInput(a),D.duelBotInput(b));
});

test('command moves do not change the campaign save, remembered profile or earned roster locks',()=>{
 const v=ui(null,{entry:true});v.window.SparkDescent.selectProfile('pc');const before=v.storage.get('spark-substrate-descent-v2');v.window.SparkDuel.start({forms:['human','spark']});v.run("act('duel-guide');act('duel-pause');duel.tick(.5)");
 assert.equal(v.storage.get('spark-substrate-descent-v2'),before);assert.equal(v.run('settings.inputProfile'),'pc');assert.throws(()=>v.window.SparkDuel.start({forms:['collector','spark']}),/sealed/);
});
