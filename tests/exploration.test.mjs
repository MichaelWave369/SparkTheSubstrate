import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as A from '../public/action-engine.js';
import {KEYS,keyPosition,doorId} from '../public/exploration.js';

const base=()=>A.createRun(A.createMeta(),'spark',63);
function clearFixture(run,room){run.player.gateGrace=0;run.room=room;run.phase='playing';run.enemies=[];run.shots=[];run.marks=[];run.spawned=run.spawnTotal=0;if(!run.cleared.includes(room))run.cleared.push(room);if(!run.discovered.includes(room))run.discovered.push(room);}
function tick(run,frames=1){for(let i=0;i<frames;i++)A.stepRun(run,{},1/60);}

test('a key requires clearing and physically reaching its pedestal; opening and returning do not consume it',()=>{
 const run=base();run.room='reliquary';run.spawnTotal=16;run.spawnClock=100;Object.assign(run.player,keyPosition);tick(run);assert.deepEqual(run.keys,[]);assert.equal(A.pendingKey(run),null);
 clearFixture(run,'reliquary');Object.assign(run.player,A.exitPosition('south'));const before=structuredClone(run);assert.throws(()=>A.enterGate(run,'south'),/Ivory Key/);assert.deepEqual(run,before);assert.equal(A.pendingKey(run).key,'ivory');tick(run);assert.deepEqual(run.keys,[]);
 Object.assign(run.player,keyPosition);tick(run);assert.deepEqual(run.keys,['ivory']);assert.equal(A.pendingKey(run),null);tick(run,5);assert.deepEqual(run.keys,['ivory']);Object.assign(run.player,A.exitPosition('south'));A.enterGate(run,'south');assert.equal(run.room,'nursery');assert.ok(run.openDoors.includes(doorId('reliquary','nursery')));
 clearFixture(run,'nursery');Object.assign(run.player,A.exitPosition('north'));A.enterGate(run,'north');assert.equal(run.room,'reliquary');assert.deepEqual(run.keys,['ivory']);assert.equal(run.openDoors.length,1);assert.ok(A.validRun(run));
});
test('the Crown Vault needs both later keys and reports their actual places',()=>{
 const run=base();clearFixture(run,'observatory');run.keys=['ivory'];const status=A.gateStatus(run,'east');assert.equal(status.available,false);assert.deepEqual(status.missingKeys,['tide','crown']);assert.match(status.reason,/Drowned Observatory/);assert.match(status.reason,/Obsidian Belfry/);
 run.keys.push('tide');assert.equal(A.gateStatus(run,'east').available,false);run.keys.push('crown');assert.equal(A.gateStatus(run,'east').available,true);Object.assign(run.player,A.exitPosition('east'));A.enterGate(run,'east');assert.equal(run.enemies[0].kind,'sentinel');assert.equal(run.enemies[0].maxHp,1400);assert.ok(A.validRun(run));
});
test('morphing preserves injury, bonuses and the rest of the run, and enforces cooldown and life state',()=>{
 const run=base();const initial=structuredClone(run);assert.throws(()=>A.morphRun(run,'tree'),/Mirror Nursery/);assert.deepEqual(run,initial);run.abilities.push('morph');run.player.maxHp+=50;run.player.hp=run.player.maxHp*.37;run.boons.shell=2;run.keys=['ivory'];const level=run.level,bonus=run.player.maxHp-A.BODIES.spark.hp;
 A.morphRun(run,'rock');assert.equal(run.form,'rock');assert.equal(run.player.maxHp,A.BODIES.rock.hp+bonus);assert.ok(Math.abs(run.player.hp/run.player.maxHp-.37)<1e-12);assert.equal(run.player.morphCooldown,3);assert.equal(run.level,level);assert.deepEqual(run.keys,['ivory']);assert.equal(run.boons.shell,2);assert.throws(()=>A.morphRun(run,'human'),/recovering/);
 tick(run,181);A.morphRun(run,'computer');assert.ok(Math.abs(run.player.hp/run.player.maxHp-.37)<1e-12);assert.ok(run.visitedVessels.includes('computer'));assert.ok(A.validRun(run));const saved=JSON.parse(JSON.stringify(run));assert.deepEqual(saved,run);assert.ok(A.validRun(saved));
 const before=structuredClone(run);assert.throws(()=>A.morphRun(run,'toString'),/Unknown/);assert.deepEqual(run,before);assert.throws(()=>A.stepRun(run,{morph:'constructor'}));assert.deepEqual(run,before);run.phase='dead';run.player.hp=0;assert.throws(()=>A.morphRun(run,'human'));assert.equal(run.player.hp,0);
});
test('vessel doors require the current shape and work in both directions',()=>{
 const run=base();clearFixture(run,'nursery');run.keys=['ivory'];run.abilities.push('morph','root');assert.equal(A.gateStatus(run,'east').available,false);assert.match(A.gateStatus(run,'east').reason,/Tree/);A.morphRun(run,'tree');assert.equal(A.gateStatus(run,'east').available,true);Object.assign(run.player,A.exitPosition('east'));A.enterGate(run,'east');assert.equal(run.room,'archive');clearFixture(run,'archive');assert.equal(A.gateStatus(run,'north').available,false);tick(run,181);A.morphRun(run,'rock');assert.equal(A.gateStatus(run,'north').available,true);Object.assign(run.player,A.exitPosition('north'));A.enterGate(run,'north');clearFixture(run,'belfry');Object.assign(run.player,A.exitPosition('south'));A.enterGate(run,'south');assert.equal(run.room,'archive');assert.equal(A.gateStatus(run,'west').available,false);
 tick(run,181);A.morphRun(run,'tree');Object.assign(run.player,A.exitPosition('west'));A.enterGate(run,'west');assert.equal(run.room,'nursery');
});
test('either partner can collect a shared key or provide the vessel a door needs',()=>{
 const run=base();A.addPartner(run,'computer');run.abilities.push('morph');run.partner.hp=run.partner.maxHp*.5;clearFixture(run,'nursery');A.morphRun(run,'tree',true);assert.equal(run.form,'spark');assert.equal(run.partnerForm,'tree');assert.equal(run.partnerBirthForm,'computer');assert.equal(run.partner.hp/run.partner.maxHp,.5);assert.equal(A.gateStatus(run,'east').available,true);
 clearFixture(run,'reliquary');Object.assign(run.partner,keyPosition);Object.assign(run.player,{x:200,y:300});tick(run);assert.deepEqual(run.keys,['ivory']);assert.ok(A.validRun(run));
});
test('keys, explored places and learned resonance persist after a life, while old saves remain valid',()=>{
 const meta=A.createMeta(),run=base();run.keys=['ivory','tide','crown'];run.discovered.push('reliquary','nursery','archive','belfry','observatory','crown');run.earnedAbilities.push('morph');run.visitedVessels.push('tree');run.phase='dead';run.player.hp=0;const remembered=A.settleRun(run,meta);assert.ok(A.validMeta(remembered));assert.deepEqual(remembered.keys,run.keys);assert.ok(remembered.explored.includes('crown'));const next=A.createRun(remembered,A.offeredForms(remembered)[0],4);assert.deepEqual(next.keys,run.keys);assert.ok(next.abilities.includes('morph'));assert.ok(next.discovered.includes('crown'));assert.deepEqual(next.openDoors,[]);
 const legacyMeta=A.createMeta(),legacyRun=base();delete legacyMeta.keys;delete legacyMeta.explored;for(const key of ['keys','openDoors','birthForm','visitedVessels'])delete legacyRun[key];delete legacyRun.player.morphCooldown;assert.ok(A.validMeta(legacyMeta));assert.ok(A.validRun(legacyRun));legacyRun.abilities.push('morph');A.morphRun(legacyRun,'human');assert.ok(A.validRun(legacyRun));
 assert.equal(A.validMeta({...remembered,keys:['toString']}),false);assert.equal(A.validRun({...next,keys:['ivory','ivory']}),false);assert.equal(A.validRun({...next,openDoors:['unknown:crown']}),false);
});
test('progression can discover every key and place from each possible starting vessel without a circular lock',()=>{
 for(const form of Object.keys(A.BODIES)){
  const reached=new Set(['threshold']),keys=new Set(),seals=new Set(),relics=new Set(),abilities=new Set(A.BODIES[form].ability?[A.BODIES[form].ability]:[]);let changed=true;
  while(changed){changed=false;for(const id of [...reached]){const room=A.ROOMS[id];for(const [set,reward]of [[keys,room.key],[abilities,room.reward],[seals,room.seal],[relics,room.relic]])if(reward&&!set.has(reward)){set.add(reward);changed=true;}
   for(const vessel of abilities.has('morph')?Object.keys(A.BODIES):[form]){const run={room:id,form:vessel,player:{hp:100},cleared:[...reached],abilities:[...abilities],keys:[...keys],seals:[...seals],relics:[...relics]};for(const direction of Object.keys(room.exits)){const gate=A.gateStatus(run,direction);if(gate.available&&!reached.has(gate.to)){reached.add(gate.to);changed=true;}}}
  }}assert.equal(reached.size,Object.keys(A.ROOMS).length,form);assert.deepEqual([...keys].sort(),Object.keys(KEYS).sort());assert.ok(abilities.has('morph'));
 }
});
test('Quiet Array has a bounded, spaced encounter without early ground attacks or mirror volleys',()=>{
 const quiet=A.ENCOUNTERS.quiet;assert.ok(quiet.total<=18);assert.ok(quiet.cap<=6);assert.ok(quiet.interval>=1.1);assert.ok(quiet.damage<=.75);assert.ok(!quiet.pool.includes('spore')&&!quiet.pool.includes('mirror')&&!quiet.pool.includes('oracle'));
 const run=base();run.room='machine';run.cleared.push('machine');run.abilities.push('phase');Object.assign(run.player,A.exitPosition('north'));A.enterGate(run,'north');assert.equal(run.spawnTotal,quiet.total);run.player.attackClock=100;run.player.iframes=100;tick(run,1200);assert.ok(run.enemies.length<=quiet.cap);assert.ok(run.enemies.every(enemy=>quiet.pool.includes(enemy.kind)));
});
