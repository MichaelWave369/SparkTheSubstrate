import assert from 'node:assert/strict';
import {legacyUI} from '../tests/legacy-harness.mjs';
import {ui} from '../tests/ui-harness.mjs';
import {LEGACY_BUILDS} from '../public/memory-arcade-manifest.js';
import {playFirstEndless} from '../tests/legacy-endless-flow.mjs';
import {playFirstForge,playFirstMastery} from '../tests/legacy-training-flow.mjs';
const results=[];
for(const b of LEGACY_BUILDS){
 const h=legacyUI(b.id);assert.ok(h.messages.some(m=>m.type==='legacy-booted'),JSON.stringify(h.messages));
 if(b.mode==='echo'){
  const api=h.window.Spark;for(let i=0;i<8&&api.observe().phase!=='between';i++){const s=api.observe();if(s.phase==='choice'){let chosen=false;for(let n=0;n<3;n++)try{api.choose(n);chosen=true;break;}catch{}assert.ok(chosen);}if(api.observe().phase==='aftermath')api.continue();}
  assert.equal(api.observe().phase,'between');
 }else if(b.id==='first-forge'){
  playFirstForge(h);
 }else if(b.id==='first-mastery'){
  playFirstMastery(h);
 }else if(b.mode==='descent'){
  const api=h.window.SparkDescent;api.start(api.observe().offeredForms.includes('spark')?'spark':api.observe().offeredForms[0]);
  for(let i=0;i<240&&api.observe().room==='threshold';i++){const p=api.observe().player,dx=480-p.x,dy=50-p.y;api.control({x:Math.abs(dx)<3?0:Math.sign(dx),y:Math.abs(dy)<3?0:Math.sign(dy),interact:Math.hypot(dx,dy)<55,frames:1});}
  assert.equal(api.observe().room,'glass');
  for(let i=0;i<12000&&!api.observe().cleared.includes('glass');i++){const s=api.observe();assert.notEqual(s.phase,'dead','historical first swarm ended at '+i+' frames');if(s.phase==='boon'){api.chooseGift(s.choices[0]);continue;}if(s.phase==='resolve'){api.resolve(0);continue;}
   const p=s.player,tx=480+Math.cos(i*.013)*240,ty=300+Math.sin(i*.013)*165,dx=tx-p.x,dy=ty-p.y,d=Math.hypot(dx,dy);api.control({x:dx/(d||1),y:dy/(d||1),dash:s.enemies.some(e=>Math.hypot(e.x-p.x,e.y-p.y)<80)&&p.dashReady,frames:1});}
  assert.ok(api.observe().cleared.includes('glass'));
 }else if(b.mode==='duel'){
  const api=h.window.SparkDuel;api.start({forms:['human','spark'],bot:true,difficulty:'easy',stage:'glass',condition:'classic'});
  for(let i=0;i<19000&&api.observe().phase!=='finished';i++){const s=api.observe(),p=s.fighters[0],other=s.fighters[1],dx=other.x-p.x;api.control([{x:Math.abs(dx)>60?Math.sign(dx):0,light:i%24===0,heavy:i%60===0,launcher:i%93===0,special:p.cooldown===0,super:p.meter===100},{}],1);}
  assert.equal(api.observe().phase,'finished');assert.equal(api.observe().winner,0,'historical bot match must finish with a real Player 1 win');
 }else if(b.mode==='endless'){
  const result=playFirstEndless(h);assert.equal(result.state.floorsCleared,5);assert.equal(result.state.floor,5);assert.equal(result.state.phase,'resolve');
  assert.equal(result.state.record.best,0,'the historical BEST only updates after the body falls');
  assert.equal(result.proof.mode,'dungeon');assert.equal(result.proof.floorsCleared,5);
  h.send('legacy-dispose');const remembered=h.storage();const resumed=legacyUI(b.id,remembered);assert.equal(resumed.window.SparkDungeon.observe().floorsCleared,5);
  assert.equal(resumed.window.SparkDescent.observe().entryMode,'dungeon');resumed.send('legacy-dispose');
 }else{
  const api=h.window.SparkSideways;api.start();
  for(let i=0;i<500&&api.observe().room==='threshold';i++){const p=api.observe().player,dx=1405-p.x;api.control({x:Math.abs(dx)<5?0:Math.sign(dx),interact:Math.abs(dx)<20},1);}
  assert.equal(api.observe().room,'glass');let jumpStart=-1000;
  for(let i=0;i<12000&&!api.observe().cleared.includes('glass');i++){const s=api.observe();assert.equal(s.phase,'playing','historical side body fell at '+i+' frames');const p=s.player,e=s.enemies.toSorted((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];if(!e){api.control({},1);continue;}const dx=e.x-p.x,direction=Math.abs(dx)>480?Math.sign(dx):Math.abs(dx)<240?-Math.sign(dx):0;if(direction===0&&p.facing!==Math.sign(dx)){api.control({x:Math.sign(dx),attack:true},1);continue;}
   const danger=s.bolts.some(b=>b.enemy&&Math.abs(b.x-p.x)<160&&b.y>p.y-50);if(danger&&p.grounded&&i-jumpStart>55)jumpStart=i;
   api.control({x:direction,attack:true,power:p.powerCooldown===0&&Math.abs(dx)<210,down:p.grounded&&p.y<605&&e.y>p.y+65,up:e.y<p.y-90,jump:i-jumpStart<34},1);}
  assert.ok(api.observe().cleared.includes('glass'));
 }
 const proof=h.observe();assert.ok(proof);assert.equal(h.messages.filter(m=>m.type==='legacy-error').length,0,JSON.stringify(h.messages.filter(m=>m.type==='legacy-error')));
 const remembered=h.storage();h.send('legacy-dispose');assert.equal(h.frames.size,0);assert.equal(h.timers.size,0);const reload=legacyUI(b.id,remembered);assert.equal(reload.messages.filter(m=>m.type==='legacy-error').length,0);reload.send('legacy-dispose');
 results.push({id:b.id,version:b.version,proof});
}
// Feed a real old life crossing into the current room's capability-bound bridge.
const current=ui(null,{entry:true});current.run("chooseProfile('pc');act('entry-sideways');act('side-new')");current.window.SparkSideways.control({x:1},200);current.window.SparkSideways.control({interact:true},1);current.window.SparkMemoryArcade.control({x:1},85);current.window.SparkMemoryArcade.control({interact:true},1);
const before=current.storage.get('spark-substrate-sideways-v1'),vault=current.storage.get('spark-substrate-keepsakes-v12');current.window.SparkMemoryArcade.play('echo-lives');const frame=current.el('arcade-frame');frame.contentWindow={postMessage(){}};const session=current.run('side.arcade.session');const receive=data=>current.listeners.get('window:message').fn({source:frame.contentWindow,data:{...data,session}});
receive({type:'legacy-observation',build:'echo-lives',proof:results[0].proof});assert.equal(current.window.SparkMemoryArcade.observe().tokens,1);receive({type:'legacy-exit',build:'echo-lives',store:{},proof:results[0].proof});assert.equal(current.el('arcade-frame-slot').innerHTML,'');assert.equal(current.storage.get('spark-substrate-sideways-v1'),before);assert.equal(current.storage.get('spark-substrate-keepsakes-v12'),vault);
current.run("act('arcade-resume');act('arcade-exit');act('side-quit')");const refreshed=ui(null,{entry:true,deviceStorage:current.storage});assert.equal(refreshed.window.SparkMemoryArcade.observe().tokens,1);assert.equal(refreshed.window.SparkMemoryArcade.observe().trail,true);
// Discover the sleeping terminal by actually clearing the current Glass room.
refreshed.run("act('entry-sideways');act('side-resume')");const side=refreshed.window.SparkSideways;
const walk=x=>{for(let i=0;i<1600;i++){const p=side.observe().player;if(Math.abs(p.x-x)<5&&p.grounded&&p.y===620)return;side.control({x:Math.abs(p.x-x)<5?0:Math.sign(x-p.x),down:p.grounded&&p.y<600,jump:p.grounded&&p.y<600},1);}throw Error('Current walk missed '+x);};
walk(1405);side.control({interact:true},1);assert.equal(side.observe().room,'glass');let jumpStart=-1000;
for(let i=0;i<12000&&!side.observe().cleared.includes('glass');i++){
 const s=side.observe(),p=s.player;assert.equal(s.phase,'playing','current discovery body fell');const e=s.enemies.toSorted((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];if(!e){side.control({},1);continue;}const dx=e.x-p.x,direction=Math.abs(dx)>480?Math.sign(dx):Math.abs(dx)<240?-Math.sign(dx):0;
 if(direction===0&&p.facing!==Math.sign(dx)){side.control({x:Math.sign(dx),attack:true},1);continue;}if(s.bolts.some(b=>b.enemy&&Math.abs(b.x-p.x)<160&&b.y>p.y-50)&&p.grounded&&i-jumpStart>55)jumpStart=i;
 side.control({x:direction,attack:true,power:p.powerCooldown===0&&Math.abs(dx)<210,down:p.grounded&&p.y<605&&e.y>p.y+65,up:e.y<p.y-90,jump:i-jumpStart<34},1);
}
assert.ok(side.observe().cleared.includes('glass'));walk(1450);side.control({interact:true},1);assert.ok(refreshed.window.SparkMemoryArcade.observe().discovered.includes('first-descent'));
walk(95);side.control({},45);side.control({interact:true},1);assert.equal(side.observe().room,'threshold');walk(1210);side.control({interact:true},1);assert.equal(refreshed.window.SparkMemoryArcade.observe().active,true);
let position=refreshed.window.SparkMemoryArcade.observe().player.x;refreshed.window.SparkMemoryArcade.control({x:Math.sign(850-position)},Math.floor(Math.abs(850-position)/265*60));refreshed.window.SparkMemoryArcade.control({interact:true},1);
const waiting=refreshed.storage.get('spark-substrate-sideways-v1');refreshed.window.SparkMemoryArcade.play('first-descent');const nextFrame=refreshed.el('arcade-frame');nextFrame.contentWindow={postMessage(){}};const nextSession=refreshed.run('side.arcade.session');refreshed.listeners.get('window:message').fn({source:nextFrame.contentWindow,data:{type:'legacy-exit',build:'first-descent',session:nextSession,proof:results[1].proof,store:{}}});
assert.equal(refreshed.window.SparkMemoryArcade.observe().tokens,2);assert.equal(refreshed.storage.get('spark-substrate-sideways-v1'),waiting);assert.equal(refreshed.storage.get('spark-substrate-keepsakes-v12'),vault);
console.log(JSON.stringify(results,null,2));console.log('Memory Arcade acceptance passed: seven actual historical objectives at ordinary health, including earned forge enhancement, banked mastery used in a new life and the original five-floor guardian; isolated save and reload; real old-life proof to current token and First light; current journey and Vault untouched; runtime teardown.');
console.log('Current discovery passed: real Glass clear → sleeping terminal → walk back to Threshold → awake First Descent cabinet → authentic completion → second token; no health, currency, enemy or unlock injection.');
