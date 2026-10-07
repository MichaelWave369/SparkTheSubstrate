import test from 'node:test';
import assert from 'node:assert/strict';
import {SIDE_ROOMS,SIDE_KEY,SIDE_FORMS,createSideJourney,enterSideRoom,sideGeometry,sideDoorStatus,sidePower,morphSide,sideSave,restoreSide,sideDamage,respawnSide,useSideService} from '../public/sideways-engine.js';
import {SIDE_PATHS,SIDE_RELICS,SIDE_CACHE_ROOMS,sidePathObjective} from '../public/sideways-paths.js';
import {SIDE_EQUIPMENT,sideSet,sideDamageBonus} from '../public/sideways-build.js';
import {ROUTE_RELICS} from '../public/world-expansion.js';
import {EQUIPMENT,SET_BONUSES} from '../public/equipment.js';
import {frames} from './sideways-path.mjs';
import {ui} from './ui-harness.mjs';

// Small isolated fixtures test requirements; the separate acceptance walk earns
// all twelve branches using ordinary health, real combat and physical movement.
function nursery(){const s=createSideJourney();enterSideRoom(s,'nursery','');s.enemies.forEach(e=>e.hp=0);frames(s,{});return s;}
function quiet(id){const s=nursery();enterSideRoom(s,id,'');s.enemies.forEach(e=>e.hp=0);frames(s,{});return s;}
function qualify(form){const p=SIDE_PATHS[form],s=quiet(p.room);morphSide(s,form);s.player.x=p.x;s.player.y=p.y;s.player.grounded=true;s.player.guard=form==='human';s.pathPractice[p.practice]=true;return s;}
function remember(form){const s=qualify(form);sidePower(s);assert.ok(s.paths.includes(form));return s;}
function secret(id){
 const c=SIDE_CACHE_ROOMS[id];let s;
 if(c.relic==='unmade-thread')s=secret('origin-nameless');
 else if(c.relic==='ivory-feather'){s=remember('animal');s.secrets.push('feather');s.relics.push('ivory-feather');}
 else if(c.relic){s=remember(Object.entries(SIDE_PATHS).find(([,p])=>p.relic===c.relic)[0]);}
 else s=remember(c.path);
 if(c.path&&!s.paths.includes(c.path)){const trial=SIDE_PATHS[c.path];enterSideRoom(s,trial.room,'');s.enemies.forEach(e=>e.hp=0);frames(s,{});morphSide(s,c.path);s.player.x=trial.x;s.player.y=trial.y;s.player.powerCooldown=0;s.pathPractice[trial.practice]=true;sidePower(s);}
 if(c.allSeals)for(const [room,r]of Object.entries(SIDE_ROOMS))if(r.seal){if(!s.visited.includes(room))s.visited.push(room);if(!s.cleared.includes(room))s.cleared.push(room);if(!s.seals.includes(r.seal))s.seals.push(r.seal);}
 enterSideRoom(s,id,'');s.enemies.forEach(e=>e.hp=0);frames(s,{});morphSide(s,c.form);s.player.x=c.x;s.player.y=c.y;s.player.powerCooldown=0;sidePower(s);assert.ok(s.secrets.includes(c.secret));return s;
}

test('optional branches reuse existing worlds, relics and equipment; their layouts are distinct',()=>{
 const layouts=Object.keys(SIDE_PATHS).map(form=>SIDE_ROOMS[SIDE_PATHS[form].room].layout);assert.equal(new Set(layouts).size,6);
 for(const [id,r]of Object.entries(SIDE_RELICS))assert.deepEqual(r,ROUTE_RELICS[id]);
 for(const id of ['tideblade','coralmail','thornstaff','grovemantle','cindermaul','furnaceplate'])assert.equal(SIDE_EQUIPMENT[id].name,EQUIPMENT[id].name);
 assert.equal(Object.keys(SET_BONUSES).length>0,true);assert.equal(new Set(Object.values(SIDE_ROOMS).map(r=>r.world)).size,7);assert.equal(SIDE_FORMS.length,6);
});
test('both prior Sideways save schemas accept absent path fields without resetting the journey',()=>{
 const raw=sideSave(quiet('glass'));delete raw.paths;delete raw.relics;
 for(const schema of [1,2]){const r=restoreSide({...raw,schema});assert.ok(r);assert.equal(r.room,'glass');assert.deepEqual(r.paths,[]);assert.deepEqual(r.relics,[]);assert.deepEqual(r.cleared,raw.cleared);assert.equal(r.player.hp,raw.player.hp);}
 assert.equal(SIDE_KEY,'spark-substrate-sideways-v1');
});
test('a trial requires a cleared room, its vessel, its practiced move and contact with the rune',()=>{
 const s=qualify('spark');s.cleared=s.cleared.filter(id=>id!=='conduit');sidePower(s);assert.deepEqual(s.paths,[]);assert.match(s.notice,/Clear the constructs/);
 s.cleared.push('conduit');s.player.powerCooldown=0;s.pathPractice={};sidePower(s);assert.deepEqual(s.paths,[]);assert.match(s.notice,/Drift while falling/);
 s.pathPractice.drift=true;s.player.powerCooldown=0;morphSide(s,'rock');sidePower(s);assert.deepEqual(s.paths,[]);assert.match(s.notice,/Borrow Spark/);
 morphSide(s,'spark');s.player.powerCooldown=0;s.player.x=SIDE_PATHS.spark.x-160;sidePower(s);assert.deepEqual(s.paths,[]);
 s.player.x=SIDE_PATHS.spark.x;s.player.powerCooldown=0;sidePower(s);assert.deepEqual(s.paths,['spark']);
});
for(const form of SIDE_FORMS)test(form+' remembers its path once, preserves it through reload and cannot duplicate its reward',()=>{
 const s=qualify(form),memory=s.memoryPoints,keys=[...s.keys],seals=[...s.seals];sidePower(s);assert.deepEqual(s.paths,[form]);assert.equal(s.memoryPoints,memory+1);assert.deepEqual(s.keys,keys);assert.deepEqual(s.seals,seals);assert.equal(s.wallet,0);
 if(SIDE_PATHS[form].relic)assert.deepEqual(s.relics,[SIDE_PATHS[form].relic]);else assert.deepEqual(s.relics,[]);
 s.player.powerCooldown=0;sidePower(s);assert.equal(s.memoryPoints,memory+1);assert.equal(sidePathObjective(s),null);const r=restoreSide(sideSave(s));assert.ok(r);assert.deepEqual(r.paths,[form]);assert.ok(r.journal.some(j=>j.title===SIDE_PATHS[form].name));
});
test('relocated relic doors give the named source and open only for that relic',()=>{
 for(const [parent,to,relic,form]of [['cinder-rest','cinder-minute','salt-hourglass','computer'],['night-rest','night-concert','ember-wing','rock'],['grove-rest','grove-bell','star-seed','human']]){
  const s=nursery();enterSideRoom(s,parent,'');const door=sideGeometry(parent).doors.find(d=>d.to===to);assert.equal(sideDoorStatus(s,door).open,false);assert.ok(sideDoorStatus(s,door).reason.includes(SIDE_RELICS[relic].name));
  s.relics.push('unrelated-relic');assert.equal(sideDoorStatus(s,door).open,false);const earned=remember(form);enterSideRoom(earned,parent,'');assert.equal(sideDoorStatus(earned,door).open,true);assert.equal(sideGeometry(to).doors.find(d=>d.to===parent).relic,undefined);
 }
});
test('cross-world secrets drop physical coins once and remember a recipe, without keys or seals',()=>{
 for(const id of Object.keys(SIDE_CACHE_ROOMS)){const s=secret(id),c=SIDE_CACHE_ROOMS[id],value=s.coins.reduce((n,coin)=>n+coin.value,0);assert.equal(value,12);assert.equal(s.wallet,0);const memory=s.memoryPoints;s.player.powerCooldown=0;sidePower(s);assert.equal(s.coins.reduce((n,coin)=>n+coin.value,0),12);assert.equal(s.memoryPoints,memory);assert.deepEqual(s.keys,[]);assert.equal(s.seals.length,c.allSeals||c.relic==='unmade-thread'?6:0);assert.ok(restoreSide(sideSave(s)).secrets.includes(c.secret));}
});
test('new save fields reject inconsistent paths, relics, recipes and locked equipment',()=>{
 const raw=sideSave(createSideJourney());for(const patch of [{paths:['tree']},{relics:['star-seed']},{paths:['eighth-vessel']},{relics:['new-relic']},{secrets:['ninth-bell']},{build:{...raw.build,weapon:'tideblade'}}])assert.equal(restoreSide({...raw,...patch}),null);
 const valid=sideSave(secret('cinder-minute'));assert.ok(restoreSide(valid));assert.equal(restoreSide({...valid,relics:[]}),null);assert.equal(restoreSide({...valid,paths:[]}),null);assert.equal(restoreSide({...valid,paths:['computer','computer']}),null);
 valid.memoryPoints=100;assert.equal(restoreSide(valid),null);
});
test('falling preserves learned paths, relics and recipes; temporary equipment ends on rekindling',()=>{
 const s=secret('cinder-minute');s.build.weapon='tideblade';s.build.armor='coralmail';const paths=[...s.paths],relics=[...s.relics],secrets=[...s.secrets];s.player.invuln=0;sideDamage(s,9999);respawnSide(s);assert.deepEqual(s.paths,paths);assert.deepEqual(s.relics,relics);assert.deepEqual(s.secrets,secrets);assert.equal(s.build.weapon,null);assert.ok(restoreSide(sideSave(s)));
});
test('Lumen drift lasts longer; Prism carry adds distance to a real air dash',()=>{
 const drift=learned=>{const s=createSideJourney();s.player.y=200;s.player.grounded=false;s.player.coyote=0;if(learned)s.paths=['spark'];let max=0;for(let i=0;i<150;i++){frames(s,{jump:true});max=Math.max(max,s.player.drift);}return max;};assert.ok(drift(true)>drift(false)+.3);
 const dash=learned=>{const s=createSideJourney();s.form='computer';if(learned)s.paths=['computer'];frames(s,{jump:true},10);const x=s.player.x;frames(s,{dash:true},32);return s.player.x-x;};assert.ok(dash(true)>dash(false)+50);
});
test('Root stair grows two landable steps and resets its practice when entering another room',()=>{
 const s=createSideJourney();s.form='tree';s.paths=['tree'];sidePower(s);assert.equal(s.bridges.length,2);frames(s,{x:1,jump:true},48);assert.equal(s.player.y,525);assert.equal(s.pathPractice.rootStep,true);enterSideRoom(s,'glass');assert.deepEqual(s.pathPractice,{});assert.equal(s.bridges.length,0);
});
test('Fault descent uses Down + airborne Power and clears its pending landing across vessel changes',()=>{
 const s=nursery();enterSideRoom(s,'glass','');morphSide(s,'rock');s.paths=['rock'];frames(s,{jump:true},10);frames(s,{down:true,power:true});assert.equal(s.player.faultLanding,true);assert.ok(s.player.vy>700);frames(s,{},60);assert.equal(s.player.faultLanding,false);assert.ok(s.events.some(e=>e.text==='Fault descent · landing shockwave'));
 s.player.faultLanding=true;morphSide(s,'human');assert.equal(s.player.faultLanding,false);
});
test('Feral bound restores one jump after an aerial Pounce; Rally ascent boosts only once before landing',()=>{
 const a=createSideJourney();a.form='animal';a.paths=['animal'];frames(a,{jump:true},25);frames(a,{});frames(a,{jump:true},12);assert.equal(a.player.jumps,2);frames(a,{power:true});assert.equal(a.player.jumps,1);frames(a,{});frames(a,{jump:true});assert.equal(a.events.filter(e=>e.type==='jump').length,3);
 const h=nursery();morphSide(h,'human');h.paths=['human'];frames(h,{jump:true},8);frames(h,{power:true});assert.equal(h.player.rallyBoost,true);assert.equal(h.player.vy,-540);frames(h,{},1);const vy=h.player.vy;h.player.powerCooldown=0;sidePower(h);assert.equal(h.player.vy,vy);morphSide(h,'spark');morphSide(h,'human');assert.equal(h.player.rallyBoost,true,'changing bodies cannot reset an air boost');frames(h,{},100);assert.equal(h.player.rallyBoost,false);
});
test('set recipes gate purchases without taking coins, and matching gear enables only its own set',()=>{
 const s=createSideJourney();s.player.x=450;s.station='merchant';s.wallet=80;assert.throws(()=>useSideService(s,'tideblade'),/cross-world/);assert.equal(s.wallet,80);
 s.secrets=['sleeping-minute','quiet-concert','ninth-bell'];useSideService(s,'tideblade');assert.equal(sideSet(s),null);useSideService(s,'coralmail');assert.equal(sideSet(s).name,'Tidebound');assert.equal(sideDamageBonus(s),4);useSideService(s,'enhance');assert.equal(sideDamageBonus(s),6);
 useSideService(s,'thornstaff');assert.equal(s.build.enhance,0);assert.equal(sideSet(s),null);useSideService(s,'grovemantle');assert.equal(sideSet(s).name,'Living Grove');const hp=s.player.hp-10;s.player.hp=hp;s.station=null;frames(s,{},60);assert.ok(s.player.hp>=hp+.69&&s.player.hp<=hp+.71);s.station='merchant';frames(s,{},60);assert.ok(s.player.hp<=hp+.71,'menus do not regenerate health');
 useSideService(s,'cindermaul');useSideService(s,'furnaceplate');assert.equal(sideSet(s).name,'Cinder Crown');s.station=null;s.player.invuln=0;const before=s.player.hp;sideDamage(s,100);assert.equal(Math.round(before-s.player.hp),83);
});
test('the start page and map expose branch clues before discovery, and merchant locks name the recipe room',()=>{
 const h=ui(null,{entry:true});h.run("chooseProfile('pc');act('entry-sideways')");assert.match(h.el('side-overlay').innerHTML,/39 connected rooms/);h.run("act('side-new');act('side-map');act('side-info',{room:'tide-lantern'})");assert.match(h.el('side-overlay').innerHTML,/Salt Hourglass opens the Unburned Minute/);assert.match(h.el('side-overlay').innerHTML,/Borrowed paths · 0 \/ 6/);h.run("act('side-resume');side.journey.player.x=450;act('side-gate')");assert.match(h.el('side-overlay').innerHTML,/Find the pattern · The Unburned Minute/);assert.match(h.el('side-overlay').innerHTML,/data-service="tideblade" disabled/);
});
