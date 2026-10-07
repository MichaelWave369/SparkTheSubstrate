import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as A from '../public/action-engine.js';
import * as Gear from '../public/equipment.js';
import {WORLDS,WORLD_ORDER,SEALS,WORLD_GUARDIANS,WORLD_KEYS,VESSEL_POWERS,worldUnlocked} from '../public/worlds.js';
import {CHAMBER_STORIES,ENEMY_LORE} from '../public/story.js';

function metaFor(form){const meta=A.createMeta();while(!A.offeredForms(meta).includes(form))meta.runs++;return meta;}
const runFor=form=>A.createRun(metaFor(form),form,114);
const tick=(run,n=1,input={})=>{for(let i=0;i<n;i++)A.stepRun(run,input,1/60);};
const foe=(run,x=70)=>({id:900,kind:'collector',x:run.player.x+x,y:run.player.y,r:14,hp:600,maxHp:600,speed:0,attack:10,orbitHit:0,flash:0});

test('six created worlds lead to a seventh with a real mega boss and complete story coverage',()=>{
 assert.equal(WORLD_ORDER.length,7);assert.equal(SEALS.length,6);assert.equal(Object.keys(A.ROOMS).length,126);
 for(const [id,room]of Object.entries(A.ROOMS)){assert.ok(WORLDS[room.world]);assert.ok(CHAMBER_STORIES[id]?.entry);if(!room.safe&&!room.finalBoss)assert.equal(CHAMBER_STORIES[id].choices?.length??3,3);}
 for(const [kind,boss]of Object.entries(WORLD_GUARDIANS)){assert.ok(ENEMY_LORE[kind]);const room=A.ROOMS[WORLDS[boss.world].bossRoom];assert.equal(room.guardian,kind);assert.equal(room.boss,true);}
 assert.ok(A.ROOMS['origin-heart'].finalBoss);assert.equal(A.ROOMS.eye.finalBoss,undefined);assert.equal(new Set(Object.values(WORLD_GUARDIANS).map(b=>b.pattern)).size,6);
});
test('guardian seals gate world travel and the final door, and checkpoints preserve injuries',()=>{
 const run=runFor('spark');assert.throws(()=>A.travelWorld(run,'tideglass'),/seals/);run.seals=['stratum'];assert.equal(worldUnlocked('tideglass',run.seals),true);const ratio=.4;run.player.hp=run.player.maxHp*ratio;A.travelWorld(run,'tideglass');assert.equal(run.room,'tide-harbor');assert.equal(run.player.hp/run.player.maxHp,ratio);assert.ok(run.cleared.includes('tide-harbor'));
 run.room='tide-archive';assert.throws(()=>A.travelWorld(run,'stratum'),/checkpoint/);run.room='threshold';assert.throws(()=>A.travelWorld(run,'uncreated'),/seals/);run.seals=[...SEALS];A.travelWorld(run,'uncreated');assert.deepEqual(run.loot,['firstlight','dawnshell']);run.room='origin-answer';run.cleared.push('origin-answer');assert.equal(A.gateStatus(run,'west').available,false);run.abilities.push('morph');A.morphRun(run,'human');assert.ok(A.gateStatus(run,'west').available);assert.ok(A.validRun(run));
 const incomplete=structuredClone(run);incomplete.seals.pop();assert.equal(A.gateStatus(incomplete,'west').available,false);A.addPartner(run,'tree');run.partner.hp=0;assert.throws(()=>A.travelWorld(run,'stratum'),/checkpoint/);
});
test('later key rooms require a physical pickup and their vessel trials use five distinct shapes',()=>{
 assert.equal(new Set(['tide-archive','grove-well','cinder-fuel','night-library','orbit-relay'].map(id=>A.ROOMS[id].exits.south.vessel)).size,5);
 for(const[key,definition]of Object.entries(WORLD_KEYS)){const run=runFor('spark');run.room=definition.room;run.spawnClock=100;run.spawnTotal=100;assert.equal(A.pendingKey(run),null);run.cleared.push(run.room);assert.equal(A.pendingKey(run).key,key);tick(run);assert.equal(run.keys.length,0);Object.assign(run.player,A.pendingKey(run));tick(run);assert.deepEqual(run.keys,[key]);assert.ok(A.validRun(run));}
});
test('all six vessel powers do different work, use cooldowns, and do not reset when morphing',()=>{
 for(const form of Object.keys(A.BODIES)){const run=runFor(form);run.enemies=[foe(run)];run.player.attackClock=100;run.player.hp=run.player.maxHp-25;run.shots=[{x:run.player.x,y:run.player.y,r:6,vx:0,vy:0,life:4,damage:10,enemy:true}];const hp=run.player.hp,x=run.player.x;
  assert.equal(A.useVesselPower(run),VESSEL_POWERS[form].name);assert.equal(run.player.powerCooldown,VESSEL_POWERS[form].cooldown);assert.throws(()=>A.useVesselPower(run),/recovering/);
  if(form==='spark'){assert.equal(run.shots.length,0);assert.ok(run.enemies[0].hp<600);}
  if(form==='human'){assert.equal(run.player.hp,hp+18);assert.equal(run.player.guardTime,3);}
  if(form==='computer'){assert.equal(run.player.overclockTime,4);assert.equal(run.shots.filter(s=>!s.enemy).length,5);}
  if(form==='animal')assert.ok(Math.hypot(run.player.x-x,run.player.y-390)>100);
  if(form==='tree'){assert.equal(run.player.hp,hp+12);assert.equal(run.enemies[0].rootTime,2.5);}
  if(form==='rock')assert.equal(run.player.guardTime,4);
  run.abilities.push('morph');A.morphRun(run,form==='spark'?'rock':'spark');assert.equal(run.player.powerCooldown,VESSEL_POWERS[form].cooldown);assert.ok(A.validRun(run));
 }
});
test('root hold freezes enemy movement while projectiles and the simulation continue',()=>{
 const run=runFor('tree');run.enemies=[foe(run,180)];run.enemies[0].speed=90;run.player.attackClock=100;A.useVesselPower(run);const x=run.enemies[0].x;tick(run,60);assert.equal(run.enemies[0].x,x);assert.ok(run.enemies[0].rootTime>0);tick(run,100);assert.ok(run.enemies[0].x<x);
});
test('guard reduces actual damage and overclock changes real attack timing',()=>{
 const ordinary=runFor('human');ordinary.player.iframes=0;ordinary.enemies=[foe(ordinary,0)];ordinary.player.attackClock=100;const guarded=structuredClone(ordinary);guarded.player.guardTime=3;tick(ordinary);tick(guarded);assert.ok(ordinary.player.maxHp-ordinary.player.hp>(guarded.player.maxHp-guarded.player.hp)*1.9);
 const normal=runFor('computer');normal.player.attackClock=0;normal.enemies=[foe(normal,300)];const fast=structuredClone(normal);fast.player.overclockTime=4;tick(normal);tick(fast);assert.ok(Math.abs(fast.player.attackClock*2-normal.player.attackClock)<1e-9);
});
test('weapon and armor pairs change attacks and grant only their matching set bonus',()=>{
 const meta=A.createMeta();meta.inventory.tideblade=0;meta.inventory.coralmail=0;meta.inventory.grovemantle=0;let equipped=Gear.equipItem(Gear.equipItem(meta,'tideblade'),'coralmail');assert.equal(Gear.matchedSet(equipped.loadout),'tide');assert.equal(Gear.gearStats(equipped).regen,.5);const run=A.createRun(equipped,'spark',2);assert.equal(A.attackProfile(run).style,'cleave');run.enemies=[foe(run,100)];run.player.attackClock=0;tick(run);assert.ok(run.enemies[0].hp<600);assert.equal(run.shots.length,0);
 equipped=Gear.equipItem(equipped,'grovemantle');assert.equal(Gear.matchedSet(equipped.loadout),null);assert.equal(Gear.gearStats(equipped).regen,.25);assert.ok(Gear.validEquipment(equipped));assert.equal(Gear.validEquipment({...meta,loadout:{...meta.loadout,armor:'tideblade'}}),false);
 const styles=new Set(Object.values(Gear.EQUIPMENT).filter(item=>item.attack).map(item=>item.attack.style));assert.deepEqual([...styles].sort(),['cleave','homing','volley','wave']);
});
test('checkpoint equipment uses found items and enhanced levels without healing either partner',()=>{
 const meta=A.createMeta();meta.inventory.bark=2;const run=A.createRun(meta,'spark',3);A.addPartner(run,'human');run.loot=['tideblade','coralmail'];run.player.hp=run.player.maxHp*.4;run.partner.hp=run.partner.maxHp*.3;A.equipRunItem(run,meta,'tideblade');A.equipRunItem(run,meta,'coralmail');assert.equal(run.equipmentLevels.bark,2);assert.equal(run.player.hp/run.player.maxHp,.4);assert.equal(run.partner.hp/run.partner.maxHp,.3);assert.ok(run.gear.regen===.5);assert.ok(A.validRun(run));run.room='glass';assert.throws(()=>A.equipRunItem(run,meta,'wayfarer'),/checkpoint/);
 run.phase='dead';run.player.hp=0;run.partner.hp=0;const next=A.settleRun(run,meta);assert.equal(next.loadout.weapon,'tideblade');assert.equal(next.loadout.armor,'coralmail');assert.ok(A.validMeta(next));
});
test('new seals, all eight keys, equipment, and legacy first-world wins survive saves',()=>{
 const run=runFor('spark');run.keys=['ivory','tide','crown',...Object.keys(WORLD_KEYS)];run.seals=[...SEALS];run.phase='dead';run.player.hp=0;const meta=A.settleRun(run,A.createMeta());assert.ok(A.validMeta(meta));const next=A.createRun(meta,A.offeredForms(meta)[0],5);assert.deepEqual(next.seals,SEALS);assert.equal(next.keys.length,8);assert.ok(A.validRun(JSON.parse(JSON.stringify(next))));assert.equal(A.validRun({...next,seals:['stratum','stratum']}),false);assert.equal(A.validMeta({...meta,seals:['uncreated']}),false);
 const legacy=A.createMeta();delete legacy.seals;legacy.wins=1;legacy.abilities=['phase','root','fracture','eye'];const migrated=Gear.prepareEquipment(legacy);assert.deepEqual(migrated.seals,['stratum']);assert.ok(migrated.abilities.includes('morph'));assert.deepEqual(A.createRun(legacy,'spark',7).seals,['stratum']);assert.ok(A.validMeta(migrated));
});
test('the Machine encounter caps its ranged turret and every shot has a visible wind-up',()=>{
 const spec=A.ENCOUNTERS.machine;assert.ok(spec.cap<=5);assert.ok(spec.total<=14);assert.equal(spec.rangedCap,1);const run=runFor('human');run.room='machine';run.player.iframes=100;run.player.attackClock=100;run.spawnTotal=spec.total;tick(run,1200);assert.ok(run.enemies.length<=5);assert.ok(run.enemies.filter(e=>e.kind==='archon').length<=1);
 const turret=runFor('tree');turret.player.attackClock=100;turret.player.iframes=100;turret.enemies=[{...foe(turret,220),kind:'archon',attack:0}];tick(turret);assert.ok(turret.enemies[0].windup>0);assert.equal(turret.shots.length,0);tick(turret,50);assert.ok(turret.shots.some(s=>s.enemy));
});
test('movement leaves every side of the Machine pillar, including an initially overlapping body',()=>{
 const box=A.obstacles('machine')[0],cases=[{x:box.x-15,y:box.y+20,input:{x:0,y:-1}},{x:box.x+box.w+15,y:box.y+20,input:{x:0,y:-1}},{x:box.x+20,y:box.y-15,input:{x:1,y:0}},{x:box.x+20,y:box.y+box.h+15,input:{x:-1,y:0}},{x:box.x+4,y:box.y+4,input:{x:-1,y:-1}}];
 for(const form of ['human','tree'])for(const sample of cases){const run=runFor(form);run.room='machine';run.cleared.push('machine');run.spawnTotal=0;Object.assign(run.player,sample);const start={...run.player};tick(run,240,sample.input);assert.ok(Math.hypot(run.player.x-start.x,run.player.y-start.y)>100,form+' remained at a pillar');const px=Math.max(box.x,Math.min(box.x+box.w,run.player.x)),py=Math.max(box.y,Math.min(box.y+box.h,run.player.y));assert.ok(Math.hypot(run.player.x-px,run.player.y-py)>=run.player.r);assert.ok(A.validRun(run));}
});
test('holding a gate key crosses once; backtracking requires release and approaching the return gate',()=>{
 const run=runFor('spark');run.cleared.push('glass');Object.assign(run.player,A.exitPosition('north'));tick(run,1,{interact:true});assert.equal(run.room,'glass');tick(run,120,{interact:true});assert.equal(run.room,'glass');tick(run);tick(run,1,{interact:true});assert.equal(run.room,'glass');Object.assign(run.player,A.exitPosition('south'));tick(run);tick(run,1,{interact:true});assert.equal(run.room,'threshold');
});
