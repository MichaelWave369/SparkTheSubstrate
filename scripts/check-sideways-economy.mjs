import assert from 'node:assert/strict';
import {ui} from '../tests/ui-harness.mjs';
import {frames,walkTo,cross,clearRoom} from '../tests/sideways-path.mjs';
import {sideGeometry,SIDE_KEY} from '../public/sideways-engine.js';

// No wallet, health, enemy HP or memory is injected in this acceptance walk.
const h=ui(null,{entry:true});h.run("chooseProfile('pc');act('entry-sideways');act('side-new')");
const original=h.storage.get('spark-substrate-descent-v2'),s=h.run('side.journey');
cross(s,'glass');clearRoom(s);assert.equal(s.phase,'playing');
walkTo(s,1520);frames(s,{attack:true},180); // Break any remaining cask/stone through normal fire.
for(const c of [...s.coins]){walkTo(s,c.x);frames(s,{},70);}
assert.ok(s.wallet>=11,'defeated constructs must pay physical coins');
const ledges=sideGeometry('glass').platforms.filter(p=>p.oneWay);
for(const [ledge,launch,target]of [[ledges[0],410,610],[ledges[1],710,925]]){
 walkTo(s,launch);frames(s,{});let landed=false;
 for(let i=0;i<120;i++){frames(s,{x:Math.abs(target-s.player.x)<5?0:Math.sign(target-s.player.x),jump:i<36});if(s.player.grounded&&Math.abs(s.player.y-ledge.y)<2){landed=true;break;}}
 assert.ok(landed,'ordinary jump reaches the memory ledge');
}
assert.equal(s.memoryPoints,1);assert.ok(s.memories.includes('glass'));
cross(s,'threshold');walkTo(s,450);frames(s,{});h.run('side.events()');h.window.SparkSideways.control({interact:true},1);assert.equal(h.window.SparkSideways.observe().menu,'merchant');
const collected=s.wallet;h.window.SparkSideways.service('wayfarer-edge');assert.equal(s.wallet,collected-5);h.run("act('side-resume')");
walkTo(s,1015);frames(s,{});h.window.SparkSideways.control({interact:true},1);assert.equal(h.window.SparkSideways.observe().menu,'imprints');h.window.SparkSideways.service('learn');assert.deepEqual(s.imprints,['pulse-return']);assert.equal(s.memoryPoints,0);h.run("act('side-resume')");
walkTo(s,710);frames(s,{});h.window.SparkSideways.control({interact:true},1);const banked=s.wallet;h.window.SparkSideways.service('bank');assert.equal(h.window.SparkVault.observe().coins,banked);assert.ok(banked>=6);h.run("act('side-alcove',{alcove:'surge'})");assert.equal(h.window.SparkVault.observe().coins,banked-6);assert.equal(h.storage.get('spark-substrate-descent-v2'),original);
h.run("act('side-quit')");const reloaded=ui(null,{entry:true,deviceStorage:h.storage});reloaded.run("act('entry-sideways');act('side-resume')");assert.deepEqual(reloaded.window.SparkSideways.observe().imprints,['pulse-return']);assert.equal(reloaded.window.SparkSideways.observe().build.weapon,'wayfarer-edge');assert.equal(reloaded.window.SparkVault.observe().coins,banked-6);assert.equal(JSON.parse(h.storage.get(SIDE_KEY)).schema,2);
console.log('Physical economy walk passed: real Glass Causeway combat → scattered coins → two jumped ledges → earned memory → world merchant equipment → permanent imprint → receipt-backed Vault deposit → Surge purchase → reload. Campaign untouched; normal health; no injected rewards.');
