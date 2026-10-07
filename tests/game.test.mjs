import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as E from '../public/engine.js';

function complete(s,index=0){while(s.phase!=='between'){if(s.phase==='choice')s=E.choose(s,index);else s=E.continueGame(s);}return s;}

test('all six forms have six playable events and three different choices',()=>{
  const titles=new Set();let count=0;
  for(const form of E.FORM_ORDER)for(let turn=0;turn<6;turn++){
    const s={...E.newGame(19),form,turn},ev=E.currentEvent(s);
    assert.equal(ev.choices.length,3);assert.equal(new Set(ev.choices.map(c=>c.label)).size,3);titles.add(ev.title);
    for(let index=0;index<3;index++){const next=E.choose(s,index);assert.equal(next.phase,'aftermath');assert.ok(E.validateSave(next));assert.equal(next.history[0].choice,ev.choices[index].label);count++;}
  }
  assert.equal(titles.size,36);assert.equal(count,108);
});

test('choice and continuation enforce phases and do not mutate the previous state',()=>{
  const original=E.newGame(12),snapshot=structuredClone(original),next=E.choose(original,0);
  assert.deepEqual(original,snapshot);assert.notDeepEqual(next.world,original.world);
  assert.throws(()=>E.choose(next,0));assert.throws(()=>E.continueGame(original));assert.throws(()=>E.choose(original,3));assert.throws(()=>E.choose(original,-1));assert.throws(()=>E.choose(original,1.5));
  const continued=E.continueGame(next);assert.equal(continued.turn,1);assert.equal(continued.phase,'choice');
});

test('karma favors different currents and seeded rebirth is repeatable',()=>{
  const dense={...E.newGame(22),karma:-65},light={...E.newGame(22),karma:70};
  assert.ok(E.affinity(dense,'rock')>E.affinity(dense,'spark'));
  assert.ok(E.affinity(light,'spark')>E.affinity(light,'rock'));
  const s=complete(E.newGame(22));assert.deepEqual(s,complete(E.newGame(22)));
  assert.equal(new Set(s.candidates).size,3);assert.ok(!s.candidates.includes('spark'));
  assert.deepEqual(E.surrenderToCurrent(s),E.surrenderToCurrent(s));
});

test('world and spark persist through death while a new form gets fresh energy',()=>{
  const crossing=complete(E.newGame(39));const next=E.reincarnate(crossing,crossing.candidates[0]);
  assert.deepEqual(next.world,crossing.world);assert.equal(next.karma,crossing.karma);assert.equal(next.awareness,crossing.awareness);assert.equal(next.energy,100);assert.equal(next.life,2);assert.equal(next.turn,0);assert.equal(next.history.length,crossing.history.length);assert.equal(next.pastLives.length,1);assert.equal(next.visited.length,2);
  assert.throws(()=>E.reincarnate(crossing,'spark'));
  const depleted=E.choose({...E.newGame(1),energy:1},0);assert.equal(depleted.energy,0);assert.equal(E.continueGame(depleted).phase,'between');
});

test('depleted worlds change choices and increase their energy cost',()=>{
  const ordinary={...E.newGame(1),form:'human',turn:3};
  const depleted={...structuredClone(ordinary),world:{vitality:10,freedom:40,balance:50}};
  assert.equal(E.currentEvent(depleted).title,'The substrate is starving');assert.equal(E.environment(depleted).cost,5);
  const chosen=E.choose(depleted,0);assert.equal(chosen.energy,70);assert.ok(chosen.world.vitality>depleted.world.vitality);
  const locked={...E.newGame(1),form:'computer',turn:4,world:{vitality:55,freedom:10,balance:50}};
  assert.equal(E.currentEvent(locked).title,'The archon’s inspection');
});

test('the awakening ending is reachable through a real campaign',()=>{
  let s=E.newGame(135);let lives=0;
  while(!E.canAwaken(s)&&lives<15){
    if(s.phase==='between')s=E.reincarnate(s,s.candidates.find(id=>!s.visited.includes(id))??s.candidates[0]);
    while(s.phase!=='between'){
      if(s.phase==='aftermath'){s=E.continueGame(s);continue;}
      const ev=E.currentEvent(s);let best=0;
      for(let i=0;i<3;i++){const score=c=>(c.delta.awareness??0)+(c.delta.karma??0)*.4-(c.delta.attachment??0)*.5+(c.delta.freedom??0)*.5;if(score(ev.choices[i])>score(ev.choices[best]))best=i;}
      s=E.choose(s,best);
    }
    lives++;
  }
  assert.ok(E.canAwaken(s),JSON.stringify(s));assert.equal(E.awaken(s).phase,'ended');assert.throws(()=>E.awaken(E.newGame(1)));
});

test('many simulated lives keep bounded statistics and valid save data',()=>{
  let s=E.newGame(348);for(let i=0;i<750;i++){
    if(s.phase==='choice')s=E.choose(s,i%3);else if(s.phase==='aftermath')s=E.continueGame(s);else s=E.surrenderToCurrent(s);
    assert.ok(E.validateSave(JSON.parse(JSON.stringify(s))),`transition ${i}`);
  }
  assert.ok(s.pastLives.length>20);assert.ok(s.history.length<=120);
});

test('malformed or obsolete saves are rejected',()=>{
  assert.ok(!E.validateSave(null));assert.ok(!E.validateSave({version:1}));
  for(const patch of [{version:0},{form:'unknown'},{phase:'wat'},{energy:200},{karma:Infinity},{candidates:['unknown']},{location:{layer:6,region:0,sector:0}},{phase:'aftermath'}])assert.ok(!E.validateSave({...E.newGame(1),...patch}));
});

test('the rendered game and agent actions share a working full-life loop',async()=>{
  const elements=new Map();const el=id=>elements.get(id)??(elements.set(id,{innerHTML:'',textContent:'',addEventListener(){},setAttribute(){},focus(){},showModal(){},close(){}}),elements.get(id));
  const tools=new Map();const store=new Map();const document={getElementById:el,addEventListener(){},querySelectorAll(){return[];},querySelector(){return null;},modelContext:{registerTool(def){tools.set(def.name,def);}}};
  const window={addEventListener(){}};const context=vm.createContext({...E,document,window,localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},structuredClone,AbortController,console,Date,Math});
  const code=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8').replace(/^import .*?;\n/,'');vm.runInContext(code,context);
  assert.equal(tools.size,4);assert.ok(el('app').innerHTML.includes('The first pulse'));assert.ok(el('app').innerHTML.includes('worlds')===false);
  assert.throws(()=>tools.get('choose_spark_action').execute({index:8}));assert.equal(window.Spark.observe().turn,1);
  for(let turn=0;turn<6;turn++){
    tools.get('choose_spark_action').execute({index:0});assert.ok(el('app').innerHTML.includes('THE RIPPLE'));
    assert.throws(()=>tools.get('choose_spark_action').execute({index:0}));tools.get('continue_spark_life').execute({});
  }
  const crossing=window.Spark.observe();assert.equal(crossing.phase,'between');assert.ok(el('app').innerHTML.includes('THE NEXT INCARNATION'));
  assert.throws(()=>tools.get('inhabit_spark_form').execute({form:'spark'}));
  tools.get('inhabit_spark_form').execute({form:crossing.candidates[0]});assert.equal(window.Spark.observe().life,2);assert.equal(window.Spark.observe().phase,'choice');
  const saved=JSON.parse(store.get('spark-substrate-journey-v1'));assert.ok(E.validateSave(saved));
});
