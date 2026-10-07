import * as CoopInput from '../public/coop-input.js';
import * as Coop from '../public/coop-state.js';
import * as Table from '../public/table-engine.js';
import * as Keepsakes from '../public/substrate-rewards.js';
import * as Expansion from '../public/world-expansion.js';
import * as Rematches from '../public/boss-rematch.js';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {KEYS,doorId} from '../public/exploration.js';
import * as Gear from '../public/equipment.js';
import {ProgressSave} from '../public/progress.js';
import * as A from '../public/action-engine.js';
import * as Worlds from '../public/worlds.js';
import * as Mastery from '../public/mastery.js';
import * as Records from '../public/run-record.js';
import * as Settings from '../public/settings.js';
import * as Entry from '../public/entry.js';
import * as CombatView from '../public/combat-view.js';
import * as Dungeon from '../public/dungeon.js';
import {DuelScreen} from '../public/duel-view.js';
import {SideScreen} from '../public/sideways-view.js';
import {saveRunCard} from '../public/share-run.js';
import {OnlineRoom} from '../public/online.js';
import {CHAMBER_STORIES,ENEMY_LORE} from '../public/story.js';
import {FORMS,validateSave} from '../public/engine.js';

function metaFor(form){const meta=A.createMeta();for(let i=0;i<300;i++){meta.runs=i;if(A.offeredForms(meta).includes(form))return meta;}throw Error('Form never offered');}
function enemyAt(x,y,hp=100){return {id:999,kind:'collector',x,y,hp,maxHp:hp,r:14,speed:0,attack:1,orbitHit:0,flash:0};}
function applyChoices(run){if(run.phase==='boon')A.chooseBoon(run,run.choices.find(id=>id==='edge')??run.choices[0]);if(run.phase==='resolve')A.resolveChamber(run,0);}

test('the map is connected, reciprocal, and every form can eventually open the Eye',()=>{
  const inverse={north:'south',south:'north',east:'west',west:'east'};
  for(const [id,room] of Object.entries(A.ROOMS))for(const [direction,exit]of Object.entries(room.exits)){assert.ok(A.ROOMS[exit.to]);assert.equal(A.ROOMS[exit.to].exits[inverse[direction]].to,id);if(exit.requires)assert.ok(A.ABILITIES[exit.requires]);}
  for(const form of Object.keys(A.BODIES)){const abilities=new Set(A.BODIES[form].ability?[A.BODIES[form].ability]:[]),reached=new Set(['threshold']);let changed=true;while(changed){changed=false;for(const id of [...reached]){if(A.ROOMS[id].reward&&!abilities.has(A.ROOMS[id].reward)){abilities.add(A.ROOMS[id].reward);changed=true;}for(const exit of Object.values(A.ROOMS[id].exits))if((!exit.requires||abilities.has(exit.requires))&&!reached.has(exit.to)){reached.add(exit.to);changed=true;}}}assert.equal(reached.size,Object.keys(A.ROOMS).length);assert.ok(reached.has('eye'));}
});
test('diagonal movement is normalized, world bounds hold, and a dash protects the body',()=>{
  const straight=A.createRun(A.createMeta(),'spark',1),diagonal=structuredClone(straight),sx=straight.player.x,sy=straight.player.y;
  for(let i=0;i<30;i++){A.stepRun(straight,{x:1},1/60);A.stepRun(diagonal,{x:1,y:-1},1/60);}
  assert.ok(Math.abs(Math.hypot(diagonal.player.x-sx,diagonal.player.y-sy)-(straight.player.x-sx))<.01);
  for(let i=0;i<1000;i++)A.stepRun(straight,{x:1,y:1},1/60);assert.ok(straight.player.x<=A.WIDTH-49);assert.ok(straight.player.y<=A.HEIGHT-49);
  const hit=A.createRun(A.createMeta(),'spark',4);hit.player.iframes=0;hit.enemies=[enemyAt(hit.player.x,hit.player.y)];const dodge=structuredClone(hit);
  A.stepRun(hit,{},1/60);A.stepRun(dodge,{dash:true},1/60);assert.ok(hit.player.hp<dodge.player.maxHp);assert.equal(dodge.player.hp,dodge.player.maxHp);assert.ok(dodge.player.dashCooldown>0);
});
test('sealed and distant gates reject travel; remembered abilities open real destinations',()=>{
  const run=A.createRun(metaFor('human'),'human',9);run.room='glass';run.player=A.createRun(metaFor('human'),'human',9).player;
  assert.throws(()=>A.enterGate(run,'west'),/swarm/);run.cleared.push('glass');assert.throws(()=>A.enterGate(run,'west'),/Root passage/i);run.abilities.push('root');assert.throws(()=>A.enterGate(run,'west'),/closer/);
  Object.assign(run.player,A.exitPosition('west'));A.enterGate(run,'west');assert.equal(run.room,'wild');assert.ok(run.discovered.includes('wild'));assert.equal(run.spawnTotal,26);assert.equal(run.enemies.length,0);
});
test('each of six forms has a working auto-attack',()=>{
  for(const form of Object.keys(A.BODIES)){const run=A.createRun(metaFor(form),form,29);run.player.attackClock=0;run.enemies=[enemyAt(run.player.x+55,run.player.y,80)];for(let i=0;i<60;i++)A.stepRun(run,{},1/60);assert.ok(run.kills>0||run.enemies[0].hp<80,form+' did not attack');}
});
test('fragment collection offers gifts and freezes time until a valid choice',()=>{
  const run=A.createRun(A.createMeta(),'spark',10);run.fragments=[{id:4,x:run.player.x,y:run.player.y,value:8,r:5}];A.stepRun(run,{},1/60);assert.equal(run.phase,'boon');assert.equal(run.choices.length,3);const time=run.time;A.stepRun(run,{x:1},1/60);assert.equal(run.time,time);assert.throws(()=>A.chooseBoon(run,'absent'));A.chooseBoon(run,run.choices[0]);assert.equal(run.phase,'playing');assert.equal(run.level,2);
});
test('a normal combat chamber can be cleared through movement and auto-attacks',()=>{
  const run=A.createRun(A.createMeta(),'spark',245);Object.assign(run.player,A.exitPosition('north'));A.enterGate(run,'north');
  for(let i=0;i<7200&&!run.cleared.includes('glass')&&run.phase!=='dead';i++){
    applyChoices(run);if(run.phase!=='playing')continue;const angle=run.time*.7,target={x:480+Math.cos(angle)*220,y:300+Math.sin(angle)*155},dx=target.x-run.player.x,dy=target.y-run.player.y,d=Math.hypot(dx,dy);A.stepRun(run,{x:dx/(d||1),y:dy/(d||1),dash:run.player.dashCooldown===0&&run.enemies.some(e=>Math.hypot(e.x-run.player.x,e.y-run.player.y)<70)},1/60);
  }
  assert.notEqual(run.phase,'dead',JSON.stringify({kills:run.kills,hp:run.player.hp,remaining:run.enemies.length}));assert.ok(run.cleared.includes('glass'));assert.ok(run.kills>=A.ENCOUNTERS.glass.total);if(run.phase==='resolve')A.resolveChamber(run,0);assert.ok(run.level>1);
});
test('chamber karma choices change rewards and abilities survive the end of a run',()=>{
  const run=A.createRun(A.createMeta(),'spark',1);run.phase='resolve';run.room='machine';run.earnedAbilities=['phase'];run.cleared.push('machine');const take=structuredClone(run);A.resolveChamber(run,0);A.resolveChamber(take,1);assert.ok(run.karma>take.karma);assert.ok(take.essence>run.essence);run.phase='dead';run.player.hp=0;const meta=A.settleRun(run,A.createMeta());assert.ok(meta.abilities.includes('phase'));assert.equal(meta.runs,1);assert.throws(()=>A.settleRun(run,meta));const nextForm=A.offeredForms(meta)[0],next=A.createRun(meta,nextForm,3);assert.ok(next.abilities.includes('phase'));assert.equal(next.player.hp,next.player.maxHp);
});
test('the Warden has telegraphed attacks and its defeat opens the first world seam',()=>{
  const run=A.createRun(A.createMeta(),'spark',1);run.room='foundry';run.cleared.push('foundry');run.abilities.push('eye');Object.assign(run.player,A.exitPosition('north'));A.enterGate(run,'north');assert.equal(run.enemies[0].kind,'warden');
  run.player.iframes=20;for(let i=0;i<245;i++)A.stepRun(run,{x:.2},1/60);assert.ok(run.shots.some(s=>s.enemy));assert.ok(run.marks.length>0||run.effects.some(e=>e.color==='#dd8f85'));
  run.enemies[0].hp=1;run.player.attackClock=0;for(let i=0;i<180&&!run.cleared.includes('eye');i++){applyChoices(run);A.stepRun(run,{},1/60);}assert.equal(run.phase,'resolve');assert.ok(run.cleared.includes('eye'));assert.deepEqual(run.seals,['stratum']);A.resolveChamber(run,0);while(run.phase==='boon')A.chooseBoon(run,run.choices[0]);assert.equal(run.phase,'milestone');A.resolveMilestone(run,'continue');assert.ok(A.gateStatus(run,'east').available);Object.assign(run.player,A.exitPosition('east'));A.enterGate(run,'east');assert.equal(run.room,'tide-harbor');
});
test('lasting gifts spend earned essence and apply to a later body',()=>{
  const meta={...A.createMeta(),essence:30};const upgraded=A.buyMemory(meta,'heart');assert.equal(upgraded.essence,26);assert.equal(meta.gifts.heart,0);const run=A.createRun(upgraded,'spark',1);assert.equal(run.player.maxHp,124);assert.throws(()=>A.buyMemory(A.createMeta(),'heart'));assert.throws(()=>A.buyMemory(meta,'unknown'));
});
test('save/resume preserves the exact simulation and invalid inputs do not corrupt it',()=>{
  const a=A.createRun(A.createMeta(),'spark',912);Object.assign(a.player,A.exitPosition('north'));A.enterGate(a,'north');for(let i=0;i<150;i++)A.stepRun(a,{x:.25,y:.1},1/60);const b=JSON.parse(JSON.stringify(a));assert.ok(A.validRun(b));assert.ok(A.validMeta(A.createMeta()));assert.deepEqual(b,a);
  const before=structuredClone(a);assert.throws(()=>A.stepRun(a,{x:NaN},1/60));assert.deepEqual(a,before);assert.throws(()=>A.stepRun(a,{},1));for(let i=0;i<80;i++){A.stepRun(a,{x:-.15,y:.1},1/60);A.stepRun(b,{x:-.15,y:.1},1/60);}assert.deepEqual(a,b);
});
test('browser rendering and agent tools exercise the same action state in a DOM harness',()=>{
  const els=new Map(),callbacks=new Map(),registered=new Map(),storage=new Map(),draws=[];
  const context2d=new Proxy({measureText:t=>({width:t.length*6}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),drawImage:(...a)=>draws.push(a)}, {get:(o,k)=>k in o?o[k]:(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
  const el=id=>els.get(id)??(els.set(id,{innerHTML:'',textContent:'',hidden:false,style:{},dataset:{},classList:{toggle(){}},setAttribute(){},focus(){},addEventListener(type,fn){callbacks.set(id+':'+type,fn);},querySelector(){return {setAttribute(){},focus(){}};},getBoundingClientRect(){return {width:800,height:500,left:0,top:0};},getContext(){return context2d;},showModal(){this.open=true;},close(){this.open=false;}}),els.get(id));
  const document={getElementById:el,querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},modelContext:{registerTool:def=>registered.set(def.name,def)}};
  const window={matchMedia:()=>({matches:false}),devicePixelRatio:1,addEventListener(){}};
  const vmContext=vm.createContext({...A,...Gear,...Worlds,...Mastery,...Records,...Settings,...Entry,...CombatView,...Dungeon,...Expansion,...Rematches,...Coop,...CoopInput,...Keepsakes,...Table,DuelScreen,SideScreen,saveRunCard,KEYS,doorId,ProgressSave,FORMS,validateSave,OnlineRoom,CHAMBER_STORIES,ENEMY_LORE,performance,document,window,sessionStorage:{getItem:()=>null,setItem(){},removeItem(){}},Image:class{constructor(){this.complete=true;this.naturalWidth=1774;this.naturalHeight=887;}addEventListener(){}},ResizeObserver:class{observe(){}},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},requestAnimationFrame(){},structuredClone,AbortController,console,Math,Date});
  const code=fs.readFileSync(new URL('../public/descent.js',import.meta.url),'utf8').replace(/^import .*?;\n/gm,'');vm.runInContext(code,vmContext);
  assert.equal(registered.size,21);assert.ok(el('game-overlay').innerHTML.includes('A spark against'));
  assert.equal(window.SparkDescent.observe().entryMode,'start');assert.equal(storage.has('spark-substrate-descent-v2'),false);assert.throws(()=>registered.get('begin_descent').execute({form:'spark'}),/profile/);registered.get('choose_spark_input').execute({profile:'pc'});registered.get('enter_spark_mode').execute({mode:'descent'});
  registered.get('begin_descent').execute({form:'spark'});assert.equal(window.SparkDescent.observe().phase,'playing');assert.equal(el('game-overlay').innerHTML,'');assert.throws(()=>registered.get('begin_descent').execute({form:'spark'}));
  const before=window.SparkDescent.observe();assert.throws(()=>registered.get('control_descent').execute({x:5,frames:10}));assert.equal(window.SparkDescent.observe().player.y,before.player.y);
  registered.get('control_descent').execute({x:0,y:-1,frames:75});registered.get('control_descent').execute({interact:true,frames:1});assert.equal(window.SparkDescent.observe().room,'glass');assert.ok(draws.length>0);
  registered.get('enter_sideways_descent').execute({});assert.equal(registered.get('observe_sideways_descent').execute({}).room,'threshold');registered.get('control_sideways_descent').execute({x:1,jump:true,frames:40});assert.ok(window.SparkSideways.observe().player.x>300);assert.equal(window.SparkDescent.observe().room,'glass');assert.throws(()=>registered.get('morph_sideways_vessel').execute({form:'animal'}),/Nursery/);
  const saved=JSON.parse(storage.get('spark-substrate-descent-v2'));assert.ok(A.validMeta(saved.meta));assert.ok(A.validRun(saved.run));
});
