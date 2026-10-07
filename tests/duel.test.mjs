import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as D from '../public/duel-engine.js';
import {duelInputs} from '../public/duel-view.js';
import {ui} from './ui-harness.mjs';
import * as A from '../public/action-engine.js';
const close=(forms=['spark','human'])=>{const m=D.createDuel({forms,seed:19});m.fighters[0].x=420;m.fighters[1].x=420+D.DUEL_CONTACT;return m;};
const steps=(m,n,inputs=[{},{}])=>{while(n){const count=Math.min(n,240);D.stepDuel(m,inputs,count);n-=count;}return m;};
const press=(m,action,i=0)=>{const inputs=[{},{}];inputs[i][action]=true;D.stepDuel(m,inputs);};

test('duels use six existing vessels and six visual stages with identical combat rules',()=>{
 assert.deepEqual(D.DUEL_FORMS,Object.keys(A.BODIES));assert.equal(Object.keys(D.DUEL_STAGES).length,6);
 for(const form of D.DUEL_FORMS){assert.ok(D.DUEL_ROSTER[form].epithet);assert.ok(D.DUEL_ROSTER[form].special);}
 const snapshots=Object.keys(D.DUEL_STAGES).map(stage=>{const m=D.createDuel({forms:['rock','animal'],stage,seed:44});steps(m,45,[{x:1},{x:-1}]);press(m,'heavy');steps(m,50);const o=D.observeDuel(m);delete o.stage;return o;});for(const o of snapshots)assert.deepEqual(o,snapshots[0]);
 assert.throws(()=>D.createDuel({forms:['ghost','rock']}));assert.throws(()=>D.stepDuel(close(),[],241));
});
test('manual light, heavy and launcher have startup, active and recovery; crouch and jump change the pose',()=>{
 for(const kind of ['light','heavy','launcher']){const m=close();press(m,kind);steps(m,D.DUEL_MOVES[kind].startup-2);assert.equal(m.fighters[1].hp,100);steps(m,1);assert.equal(m.fighters[1].hp,100-D.DUEL_MOVES[kind].damage);assert.equal(m.freeze,3);assert.ok(m.fighters[0].meter>0&&m.fighters[1].meter>0);steps(m,70);assert.equal(m.fighters[0].attack,null);}
 const m=close();press(m,'jump');assert.ok(m.fighters[0].y>0);steps(m,60);assert.equal(m.fighters[0].y,0);D.stepDuel(m,[{crouch:true},{}]);assert.equal(D.observeDuel(m).fighters[0].pose,'crouch');
});
test('hold-back blocks normals without chip; specials chip five percent',()=>{
 const normal=close();D.stepDuel(normal,[{light:true},{x:1}],20);assert.equal(normal.fighters[1].hp,100);assert.ok(normal.events.some(e=>e.type==='block'));
 const special=close();D.stepDuel(special,[{special:true},{x:1}],16);assert.equal(special.fighters[1].hp,99.2);assert.ok(special.events.some(e=>e.type==='chip'&&e.blocked));
});
test('counter hits freeze six frames and clear the interrupted startup',()=>{
 const m=close();D.stepDuel(m,[{light:true},{heavy:true}],6);assert.equal(m.freeze,6);assert.equal(m.fighters[1].attack,null);assert.ok(m.events.some(e=>e.type==='hit'&&e.counter));const clock=m.clock;steps(m,6);assert.equal(m.freeze,0);assert.equal(m.clock,clock);
});
test('close light plus back throws; the same input breaks within eight frames and is late afterwards',()=>{
 const tech=close();D.stepDuel(tech,[{x:-1,light:true},{}]);assert.ok(tech.throw);steps(tech,6);D.stepDuel(tech,[{},{x:1,light:true}]);assert.equal(tech.throw,null);assert.equal(tech.fighters[1].hp,100);assert.equal(tech.fighters[1].stats.techs,1);
 const late=close();D.stepDuel(late,[{x:-1,light:true},{}]);steps(late,8);assert.equal(late.fighters[1].hp,86);D.stepDuel(late,[{},{x:1,light:true}]);assert.equal(late.fighters[1].stats.techs,0);assert.equal(late.fighters[0].stats.throws,1);
});
test('every power has one five-second cooldown and a distinct vessel effect',()=>{
 const states={};for(const form of D.DUEL_FORMS){const m=close([form,'human']);press(m,'special');assert.equal(m.fighters[0].cooldown,300);steps(m,11);assert.equal(m.fighters[0].cooldown,289);states[form]=m;assert.equal(m.fighters[0].stats.specials,1);steps(m,70);press(m,'special');assert.equal(m.fighters[0].stats.specials,1);}
 for(const [form,property] of [['human','guard'],['rock','guard'],['computer','overclock']]){const m=close([form,'human']);press(m,'special');steps(m,11);assert.ok(m.fighters[0][property]>0,form);}
 const animal=close(['animal','human']);press(animal,'special');steps(animal,11);assert.ok(animal.fighters[0].x>550&&animal.fighters[0].y>0);
 const tree=close(['tree','human']);press(tree,'special');steps(tree,11);assert.ok(tree.fighters[1].root>0);
 const rock=close(['rock','human']);rock.fighters[1].y=90;rock.fighters[1].vy=0;press(rock,'special');steps(rock,11);assert.equal(rock.fighters[1].hp,100);
});
test('a full-meter super spends on a whiff and freezes its cinematic for exactly 1.2 seconds',()=>{
 const m=D.createDuel({seed:30});m.fighters[0].meter=100;press(m,'super');assert.equal(m.fighters[0].meter,0);assert.equal(m.cinematic,72);const clock=m.clock;steps(m,72);assert.equal(m.cinematic,0);assert.equal(m.clock,clock);assert.equal(m.fighters[1].hp,100);assert.equal(m.fighters[0].stats.supers,1);steps(m,1);assert.ok(m.clock<clock);
 const empty=close();press(empty,'super');assert.equal(empty.fighters[0].attack,null);
});
test('sixty-second ties replay once; timeouts award higher health and two wins finish',()=>{
 const m=D.createDuel({seed:6});steps(m,3600);assert.equal(m.phase,'round-end');assert.equal(m.roundWinner,null);steps(m,119);assert.equal(m.phase,'round-end');steps(m,1);assert.equal(m.round,1);assert.equal(m.replay,1);steps(m,3600);steps(m,120);assert.equal(m.round,2);assert.equal(m.replay,0);assert.deepEqual(m.fighters.map(f=>f.rounds),[0,0]);
 for(let i=0;i<2;i++){m.fighters[1].hp=80;m.clock=1/60;steps(m,1);assert.equal(m.roundWinner,0);steps(m,120);}assert.equal(m.phase,'finished');assert.equal(m.winner,0);assert.deepEqual(m.fighters.map(f=>f.rounds),[2,0]);assert.equal(m.events.some(e=>e.type==='finisher'),false);
});
test('only a match-winning round with low losing health and held meter gets the skippable two-second seal',()=>{
 const m=close();m.fighters[1].hp=8;press(m,'light');steps(m,5);assert.equal(m.phase,'round-end');steps(m,120);assert.equal(m.phase,'playing');assert.equal(m.events.some(e=>e.type==='finisher'),false);
 m.fighters[0].x=420;m.fighters[1].x=480;m.fighters[1].hp=8;press(m,'light');steps(m,5);steps(m,120);assert.equal(m.phase,'finisher');assert.equal(m.winner,0);assert.equal(m.fighters[0].meter,0);steps(m,119);assert.equal(m.phase,'finisher');steps(m,1);assert.equal(m.phase,'finished');
 const skip=close();skip.fighters[0].rounds=1;skip.fighters[1].hp=0;steps(skip,1);skip.fighters[0].meter=30;steps(skip,120);assert.equal(skip.phase,'finisher');D.skipDuelScene(skip);assert.equal(skip.phase,'finished');
 const noMeter=close();noMeter.fighters[0].rounds=1;noMeter.fighters[1].hp=0;steps(noMeter,121);assert.equal(noMeter.phase,'finished');
});
test('mobile handoff stops the clock, poses and inputs until ready, then alternates three-second turns',()=>{
 const m=D.createDuel({profile:'mobile',forms:['animal','tree'],seed:11}),initial=structuredClone(m);steps(m,240,[{x:1},{x:-1}]);assert.deepEqual(m,initial);D.readyDuel(m);steps(m,180,[{x:1},{x:-1}]);assert.equal(m.phase,'handoff');assert.equal(m.turn,1);const snapshot=structuredClone(m);steps(m,180,[{x:1},{x:-1}]);assert.deepEqual(m,snapshot);D.readyDuel(m);m.fighters[0].x=300;m.fighters[1].x=700;const before=m.fighters.map(f=>f.x);steps(m,10,[{x:1},{x:-1}]);assert.equal(m.fighters[0].x,before[0]);assert.ok(m.fighters[1].x<before[1]);
});
test('PC, one-pad, two-pad, and touch input feed independent fighters',()=>{
 const keys=new Set(['d','f','arrowleft','k']);let inputs=duelInputs('pc',keys,[]);assert.equal(inputs[0].light,true);assert.equal(inputs[1].light,true);assert.equal(inputs[0].x,1);assert.equal(inputs[1].x,-1);
 const pad={connected:true,mapping:'standard',axes:[.7,0],buttons:Array.from({length:16},()=>({pressed:false,value:0}))};pad.buttons[3].pressed=true;inputs=duelInputs('controller',keys,[pad]);assert.equal(inputs[0].heavy,true);assert.equal(inputs[0].light,false);assert.equal(inputs[1].light,true);inputs=duelInputs('controller',keys,[pad,{...pad,axes:[-.6,0]}]);assert.equal(inputs[1].x,-.6);
 inputs=duelInputs('mobile',keys,[pad],{x:.5,y:-1,buttons:{special:true}},1);assert.deepEqual(inputs[0],{});assert.equal(inputs[1].jump,true);assert.equal(inputs[1].special,true);
});
test('Hard remembers a seen special, and bot decisions are independent of hidden opponent frame data',()=>{
 const m=close();m.difficulty='hard';m.fighters[0].attack={kind:'special',id:41,frame:1};D.duelBotInput(m);assert.equal(m.botState.seenSpecials,0);m.fighters[0].attack=null;D.duelBotInput(m);assert.equal(m.botState.seenSpecials,1);m.fighters[0].attack={kind:'special',id:42,frame:1};m.botState.decision=0;assert.equal(D.duelBotInput(m).x,1);
 const a=close(),b=structuredClone(a);a.fighters[0].attack={kind:'heavy',id:16,frame:1};b.fighters[0].attack={kind:'heavy',id:16,frame:99};b.fighters[0].meter=99;b.fighters[0].cooldown=123;assert.deepEqual(D.duelBotInput(a),D.duelBotInput(b));
 for(const difficulty of ['easy','medium','hard']){const bot=D.createDuel({bot:true,difficulty,seed:42});steps(bot,1200);assert.ok(bot.fighters[1].stats.hits>0,difficulty);assert.ok(bot.fighters[1].stats.specials>0,difficulty);}
});
test('a complete local versus match saves only its own record, leaving live campaign and daily seeds unchanged',()=>{
 const meta=A.createMeta();meta.keys=['ivory'];meta.seals=['stratum'];meta.essence=29;const run=A.createRun(meta,'spark',765);const state={version:2,meta,run},view=ui(state,{entry:true}),before=view.storage.get('spark-substrate-descent-v2');view.window.SparkDescent.selectProfile('pc');view.window.SparkDuel.start({forms:['computer','rock'],stage:'night'});
 for(let round=0;round<2;round++){view.run("duel.match.fighters[0].x=420;duel.match.fighters[1].x=480;duel.match.fighters[1].hp=8");view.window.SparkDuel.control([{light:true},{}],6);view.window.SparkDuel.control([{},{}],124);}assert.equal(view.window.SparkDuel.observe().phase,'finisher');view.run("act('duel-skip');duel.tick(0)");assert.equal(view.window.SparkDuel.observe().phase,'finished');const record=JSON.parse(view.storage.get(D.DUEL_RECORD_KEY));assert.equal(record.wins.computer,1);assert.equal(record.matches,1);assert.equal(view.storage.get('spark-substrate-descent-v2'),before);assert.equal(view.run('run.seed'),765);assert.equal(view.run('meta.essence'),29);assert.deepEqual(JSON.parse(view.run('JSON.stringify(meta.keys)')),['ivory']);assert.equal(D.cleanDuelRecord(record).last.stage,'night');view.run('duel.tick(0)');assert.equal(JSON.parse(view.storage.get(D.DUEL_RECORD_KEY)).matches,1);
 view.run("act('duel-quit');enterDescent('continue')");assert.equal(view.window.SparkDescent.observe().entryMode,'descent');assert.equal(view.run('run.seed'),765);assert.equal(view.run('paused'),false);
});
