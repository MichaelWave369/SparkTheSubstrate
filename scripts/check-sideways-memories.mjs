import fs from 'node:fs';
import assert from 'node:assert/strict';
import {SIDE_KEY,SIDE_ROOMS} from '../public/sideways-engine.js';
import {SIDE_MEMORY_KEY} from '../public/sideways-memories.js';
import {createMeta,createRun} from '../public/action-engine.js';
import {ui} from '../tests/ui-harness.mjs';
const input=process.argv[2];assert.ok(input,'Pass the normally earned 39-room save.');
const raw=JSON.parse(fs.readFileSync(input,'utf8')).save,meta=createMeta(),run=createRun(meta,'spark'),deviceStorage=new Map([[SIDE_KEY,JSON.stringify(raw)]]);
let h=ui({meta,run},{entry:true,deviceStorage});h.run("chooseProfile('pc');act('entry-sideways')");
const original=h.storage.get(SIDE_KEY),campaign=h.storage.get('spark-substrate-descent-v2'),vault=JSON.stringify(h.window.SparkVault.observe()),results=[];
for(const [id,r]of Object.entries(SIDE_ROOMS).filter(([,r])=>r.boss)){
 h.window.SparkSideways.memories();h.window.SparkSideways.remember(id);let o=h.window.SparkSideways.observe();assert.equal(o.paused,false);assert.equal(o.player.maxHp,180);assert.equal(o.build.weapon,null);assert.equal(o.seals.length,0);let jumpStart=-1000,reloaded=false;
 for(let i=0;i<12000&&o.phase==='playing';i+=4){
  const e=o.enemies[0],p=o.player;assert.ok(e,'missing guardian');const dx=e.x-p.x,desired=Math.abs(dx)>480?Math.sign(dx):Math.abs(dx)<240?-Math.sign(dx):0;
  if(i>=120&&!reloaded){const before=JSON.parse(h.storage.get(SIDE_MEMORY_KEY));h.run("act('side-pause');act('side-quit')");assert.equal(h.storage.get(SIDE_KEY),original);h=ui({meta,run},{entry:true,deviceStorage});h.run("chooseProfile('pc');act('entry-sideways')");o=h.window.SparkSideways.observe();assert.equal(o.menu,'pause');assert.equal(o.room,id);assert.equal(o.player.hp,before.hp);assert.equal(o.enemies[0].hp,before.guardian.hp);h.window.SparkSideways.resume();reloaded=true;o=h.window.SparkSideways.observe();continue;}
  const drop=p.grounded&&p.y<r.floor-15&&e.y>p.y+65;
  const m=h.run('side.journey');const danger=m.marks.some(v=>!v.trigger&&v.life<.6&&Math.abs(v.x-p.x)<v.r+25)||o.bolts.some(b=>b.enemy&&Math.abs(b.x-p.x)<160&&b.y>p.y-50);
  if(danger&&p.grounded&&i-jumpStart>55)jumpStart=i;
  const x=desired===0&&p.facing!==Math.sign(dx)?Math.sign(dx):desired;
  o=h.window.SparkSideways.control({x,attack:true,power:p.powerCooldown===0&&Math.abs(dx)<210,down:drop||e.y>p.y+75,up:e.y<p.y-90,jump:drop||i-jumpStart<34},4);
 }
 assert.equal(o.phase,'complete','guardian '+id+' ended with '+o.phase+' · '+o.player.hp+' health');assert.equal(o.menu,'memory-result');const m=h.run('side.journey');assert.ok(m.enemies[0].phase>1,'second movement missing in '+id);if(r.boss==='demiurge')assert.equal(m.enemies[0].phase,3);assert.equal(o.wallet,0);assert.equal(o.memoryPoints,0);assert.equal(o.coins.length,0);assert.equal(o.seals.length,0);assert.equal(o.keys.length,0);assert.equal(h.storage.get(SIDE_KEY),original);assert.match(h.el('side-overlay').innerHTML,/0% remains/);assert.match(h.el('side-overlay').innerHTML,/Return to your journey/);assert.equal(h.storage.get('spark-substrate-descent-v2'),campaign);assert.equal(JSON.stringify(h.window.SparkVault.observe()),vault);
 results.push({room:id,name:o.name,seconds:Math.round(o.time*10)/10,hp:Math.round(o.player.hp),guardianPhase:m.enemies[0].phase,reloaded});h.window.SparkSideways.returnToJourney();assert.equal(h.window.SparkSideways.observe().room,raw.room);assert.equal(h.window.SparkSideways.observe().player.hp,raw.player.hp);assert.deepEqual(h.window.SparkSideways.observe().build,raw.build);assert.equal(h.window.SparkSideways.observe().wallet,raw.wallet);assert.equal(deviceStorage.has(SIDE_MEMORY_KEY),false);console.log(id+' memory · '+results.at(-1).seconds+'s · '+results.at(-1).hp+' / 180 HP · phase '+m.enemies[0].phase);
}
if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(results,null,2));
console.log('All eight guardian memories completed through actual UI input, fixed health/build, an in-fight reload per guardian, second phases (three existing laws for the Demiurge), unchanged saved campaign/journey/Vault, no rewards, and return to the exact parent room.');
