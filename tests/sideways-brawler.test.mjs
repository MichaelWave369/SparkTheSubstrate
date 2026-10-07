import test from 'node:test';
import assert from 'node:assert/strict';
import {createSideJourney,SIDE_KEY,enterSideRoom,stepSide,sideDamage,respawnSide,sideSave,restoreSide,useSideService,observeSide,sideEchoEncounter} from '../public/sideways-engine.js';
import {SIDE_IMPRINTS,hasSideImprint,freshSideBuild} from '../public/sideways-build.js';
import {physicalCoins,hitSideEnemy,sideGrab,tickSideReaction} from '../public/sideways-brawler.js';
import {cleanKeepsakes,depositSideCoins} from '../public/substrate-rewards.js';
import {SIDE_LEASE} from '../public/sideways-view.js';
import {frames} from './sideways-path.mjs';
import {ui} from './ui-harness.mjs';
const emit=(s,type,text='',x=0,y=0,value=0)=>s.events.push({id:++s.eventSerial,type,text,x,y,value,time:s.time});
const hit=(s,e,d,impact)=>hitSideEnemy(s,e,d,impact,emit);
function fight(form='human',room='glass'){const s=createSideJourney();enterSideRoom(s,'nursery','');s.enemies.forEach(e=>e.hp=0);frames(s,{});enterSideRoom(s,room,'');s.form=form;s.player.x=590;s.player.facing=1;s.player.hp=130;s.player.invuln=5;s.enemies[0].x=680;return s;}
function counter(s,id,x){s.player.x=x;s.player.y=620;s.station=id;}

test('light stagger, heavy knockdown, launcher and real-time hit freeze have different weight',()=>{
 const light=fight();frames(light,{attack:true},7);assert.ok(light.enemies[0].hp<60);assert.equal(light.enemies[0].state,'stagger');assert.ok(light.enemies[0].vx>0);assert.ok(light.hitstop>0);const frame=light.player.attack.frame,x=light.enemies[0].x,time=light.time;frames(light,{},2);assert.equal(light.player.attack.frame,frame);assert.equal(light.enemies[0].x,x);assert.ok(light.time>time);
 const heavy=fight();frames(heavy,{heavy:true},15);assert.equal(heavy.enemies[0].state,'down');assert.ok(heavy.enemies[0].vx>=300);assert.ok(heavy.events.some(e=>e.type==='thump'));
 const launcher=fight();frames(launcher,{heavy:true,up:true},20);assert.equal(launcher.enemies[0].state,'launched');assert.ok(launcher.enemies[0].y<620);assert.ok(launcher.enemies[0].vy<0);
});
test('short button presses during hit-stop are buffered instead of disappearing',()=>{
 const s=fight();frames(s,{attack:true},7);assert.ok(s.hitstop>0);frames(s,{jump:true},1);frames(s,{},8);assert.ok(s.player.y<620);assert.ok(s.events.some(e=>e.type==='jump'));
});
test('a vulnerable enemy can be grabbed, struck and thrown through another enemy',()=>{
 const s=fight(),e=s.enemies[0],other=s.enemies[1];e.x=650;e.root=2;other.x=920;other.y=620;assert.equal(sideGrab(s,{floor:620,width:1900},emit,hit),true);assert.equal(e.state,'grabbed');const hp=e.hp;frames(s,{attack:true},1);assert.ok(e.hp<hp);frames(s,{},4);sideGrab(s,{floor:620,width:1900},emit,hit);assert.equal(s.player.grab,null);assert.equal(e.state,'thrown');const secondHP=other.hp;
 for(let i=0;i<80;i++)stepSide(s,{});assert.ok(other.hp<secondHP,'thrown construct collides with the crowd');assert.ok(s.events.some(e=>e.type==='bounce'));
});
test('throw physics has one ground bounce and one authored wall rebound, not unlimited energy',()=>{
 const s=fight(),e=s.enemies[0];e.x=1810;e.y=400;e.state='thrown';e.vx=660;e.vy=-50;e.stagger=.5;e.bounce=true;e.wallBounced=false;e.throwHits=[];
 for(let i=0;i<180;i++)tickSideReaction(s,e,{width:1900,floor:620},1/60,emit,hit);
 assert.equal(e.y,620);assert.equal(e.wallBounced,true);assert.equal(e.bounce,false);assert.equal(e.state,'ready');assert.ok(Math.abs(e.vx)<15);
});
test('Rock lifts and throws a fault stone; another body gets an honest weight hint',()=>{
 const s=fight('human');s.player.x=1350;assert.equal(sideGrab(s,{floor:620,width:1900},emit,hit),false);assert.match(s.events.at(-1).text,/Rock/);s.form='rock';assert.equal(sideGrab(s,{floor:620,width:1900},emit,hit),true);assert.equal(s.player.carry,'glass-stone');frames(s,{},2);assert.equal(s.props[1].y,s.player.y-125);sideGrab(s,{floor:620,width:1900},emit,hit);assert.equal(s.props[1].thrown,true);assert.equal(s.props[1].vx,750);frames(s,{},70);assert.equal(s.props[1].hp,0);assert.ok(s.coins.length||s.wallet>0);
});
test('coins scatter, bounce, magnetize and collect only once, including after reload',()=>{
 const s=createSideJourney();physicalCoins(s,'test:coins',s.player.x+60,620,7);assert.deepEqual(s.coins.map(c=>c.value),[5,1,1]);assert.ok(s.coins.every(c=>c.vy<0));frames(s,{},300);assert.equal(s.wallet,7);assert.equal(s.coins.length,0);assert.ok(s.events.some(e=>e.type==='coin'));physicalCoins(s,'test:coins',s.player.x,620,7);assert.equal(s.coins.length,0);
 const restored=restoreSide(sideSave(s));physicalCoins(restored,'test:coins',restored.player.x,620,7);assert.equal(restored.wallet,7);assert.equal(restored.coins.length,0);
});
test('lethal hits create a readable death reaction and one guardian coin shower',()=>{
 const s=fight('spark','forge'),e=s.enemies[0];hit(s,e,9999,{type:'heavy',direction:1});assert.equal(e.hp,0);assert.equal(e.state,'dead');assert.equal(e.death,.8);assert.equal(s.coins.reduce((n,c)=>n+c.value,0),24);assert.ok(s.events.some(e=>e.type==='boss-down'));hit(s,e,9999,{type:'heavy',direction:1});assert.equal(s.coins.reduce((n,c)=>n+c.value,0),24);
});
test('uncollected coin locations and broken scenery survive room travel and save migration',()=>{
 const s=fight();hit(s,s.enemies[0],1000,{type:'light',direction:1});s.props[0].hp=0;const coins=s.coins.length;enterSideRoom(s,'threshold','');enterSideRoom(s,'glass','');assert.equal(s.coins.length,coins);assert.equal(s.props[0].hp,0);const loaded=restoreSide(sideSave(s));assert.equal(loaded.coins.length,coins);assert.equal(loaded.props[0].hp,0);assert.equal(loaded.player.grab,null);
});
test('the Vault reserves a receipt before transferring money, without changing memory',()=>{
 const s=createSideJourney();s.wallet=17;s.memoryPoints=2;counter(s,'vault',710);useSideService(s,'bank');assert.equal(s.wallet,0);assert.equal(s.pendingBank.amount,17);assert.equal(s.memoryPoints,2);const bank=cleanKeepsakes({coins:3});assert.equal(depositSideCoins(bank,s.pendingBank),17);assert.equal(bank.coins,20);assert.equal(depositSideCoins(bank,s.pendingBank),0);assert.equal(bank.coins,20);assert.equal(depositSideCoins(cleanKeepsakes(bank),s.pendingBank),0);assert.equal(restoreSide(sideSave(s)).pendingBank.id,s.pendingBank.id);
});
test('coin purchases equip, enhance and feed this life; zero coins cannot buy',()=>{
 const s=createSideJourney();counter(s,'merchant',450);assert.throws(()=>useSideService(s,'glass-bun'),/Need 3/);s.wallet=17;s.player.hp=40;useSideService(s,'glass-bun');assert.equal(s.player.hp,68);assert.equal(s.build.buffs.haste,90);useSideService(s,'wayfarer-edge');useSideService(s,'enhance');assert.equal(s.build.enhance,1);useSideService(s,'held-shell');assert.equal(s.wallet,1);assert.throws(()=>useSideService(s,'held-shell'),/Already/);frames(s,{},120);assert.equal(s.build.buffs.haste,90,'counter scene pauses buff time');s.station=null;frames(s,{},120);assert.ok(s.build.buffs.haste<89);assert.equal(restoreSide(sideSave(s)).build.enhance,1);
});
test('a fall ends temporary equipment, food and loans but keeps lasting imprints and remaining coins',()=>{
 const s=createSideJourney();s.imprints=['pulse-return'];s.wallet=20;s.build={...freshSideBuild(),weapon:'wayfarer-edge',loan:'held-answer',buffs:{haste:90}};s.player.invuln=0;sideDamage(s,999);assert.equal(s.wallet,15);respawnSide(s);assert.equal(s.life,2);assert.deepEqual(s.imprints,['pulse-return']);assert.equal(s.build.weapon,null);assert.equal(s.build.loan,null);assert.equal(s.build.buffs.haste,undefined);assert.equal(s.wallet,15);
});
test('permanent Memory Imprints require an earned fragment and a remembered room; coins only rent',()=>{
 const s=createSideJourney();counter(s,'imprints',1015);s.wallet=100;assert.throws(()=>useSideService(s,'learn'),/Remember glass/);s.visited.push('glass');s.cleared.push('glass');assert.throws(()=>useSideService(s,'learn'),/memory fragment/);s.memoryPoints=1;useSideService(s,'learn');assert.equal(s.wallet,100);assert.equal(s.memoryPoints,0);assert.equal(hasSideImprint(s),true);assert.ok(restoreSide(sideSave(s)).imprints.includes('pulse-return'));
 const loan=createSideJourney();counter(loan,'merchant',450);loan.wallet=4;useSideService(loan,'loan');assert.equal(hasSideImprint(loan),true);assert.deepEqual(loan.imprints,[]);assert.equal(loan.wallet,0);
});
test('Human perfect guard counters contact; learned Computer, Tree, Rock and Animal techniques differ',()=>{
 const human=fight();human.imprints=[SIDE_IMPRINTS.human.id];human.player.invuln=0;human.player.guard=true;human.player.guardAge=.05;const hp=human.player.hp,target=human.enemies[0];sideDamage(human,20,target);assert.equal(human.player.hp,hp);assert.ok(target.hp<target.maxHp);
 const computer=fight('computer');computer.imprints=[SIDE_IMPRINTS.computer.id];computer.enemies=[];frames(computer,{heavy:true},15);assert.equal(computer.bolts.length,3);
 const tree=fight('tree');tree.imprints=[SIDE_IMPRINTS.tree.id];tree.enemies[0].x=810;frames(tree,{heavy:true,up:true},15);assert.equal(tree.enemies[0].state,'launched');assert.ok(tree.enemies[0].root>0);
 const rock=fight('rock');rock.imprints=[SIDE_IMPRINTS.rock.id];frames(rock,{heavy:true},15);assert.equal(rock.enemies[0].state,'launched');
 const animal=fight('animal');animal.imprints=[SIDE_IMPRINTS.animal.id];frames(animal,{jump:true},20);frames(animal,{heavy:true,down:true},1);assert.equal(animal.player.dive,true);assert.ok(animal.player.vy>0);frames(animal,{},70);assert.equal(animal.player.dive,false);assert.ok(animal.events.some(e=>e.text==='Pounce · landing strike'));
});
test('Spark Pulse return reflects a nearby enemy projectile during a dash strike',()=>{
 const s=fight('spark');s.imprints=[SIDE_IMPRINTS.spark.id];s.enemies=[];s.bolts=[{x:650,y:590,vx:-200,vy:0,enemy:true,guardian:false,damage:8,life:2,color:'#75e8ed',lane:0}];frames(s,{dash:true,attack:true},1);assert.equal(s.bolts[0].enemy,false);assert.ok(s.bolts[0].vx>0);assert.ok(s.events.some(e=>e.type==='deflect'));
});
test('only the prototype room has lane movement and it cannot hit a target in another lane',()=>{
 const s=fight('human','machine');s.player.lane=-46;s.enemies[0].lane=46;const hp=s.enemies[0].hp;frames(s,{attack:true},9);assert.equal(s.enemies[0].hp,hp);frames(s,{down:true},40);assert.ok(s.player.lane>20);assert.equal(observeSide(s).depthLane,true);enterSideRoom(s,'cistern','');assert.equal(s.player.lane,0);frames(s,{down:true},20);assert.equal(s.player.lane,0);assert.equal(observeSide(s).depthLane,false);
});
test('schema 1 migrates in place and schema 2 rejects malformed economy and invented techniques',()=>{
 const s=createSideJourney();const raw=sideSave(s);raw.schema=1;delete raw.id;const migrated=restoreSide(raw);assert.equal(migrated.schema,2);assert.equal(migrated.room,s.room);assert.equal(migrated.player.hp,s.player.hp);assert.equal(migrated.wallet,0);assert.equal(SIDE_KEY,'spark-substrate-sideways-v1');
 const current=sideSave(migrated);for(const patch of [{schema:3},{wallet:-2},{memoryPoints:Infinity},{imprints:['new-god']},{pendingBank:{id:'wrong',amount:10}},{loot:{'new-world':{coins:[],props:[]}}}])assert.equal(restoreSide({...current,...patch}),null);
});
test('real UI walks to a world counter, purchases, banks once and opens a Vault seal without campaign changes',()=>{
 const h=ui(null,{entry:true});h.run("chooseProfile('pc');act('entry-sideways');act('side-new')");const campaign=h.storage.get('spark-substrate-descent-v2');h.run('side.journey.wallet=14;side.journey.player.x=450');h.window.SparkSideways.control({interact:true},1);assert.equal(h.window.SparkSideways.observe().menu,'merchant');assert.match(h.el('side-overlay').innerHTML,/Glass bun/);h.window.SparkSideways.service('wayfarer-edge');assert.equal(h.window.SparkSideways.observe().wallet,9);h.run("act('side-resume');side.journey.player.x=710");h.window.SparkSideways.control({interact:true},1);assert.equal(h.window.SparkSideways.observe().menu,'vault');h.window.SparkSideways.service('bank');assert.equal(h.window.SparkVault.observe().coins,9);assert.equal(h.window.SparkSideways.observe().pendingBank,null);h.run("act('side-alcove',{alcove:'surge'})");assert.equal(h.window.SparkVault.observe().coins,3);assert.ok(h.window.SparkVault.observe().alcoves.find(a=>a.id==='surge').owned);assert.equal(h.storage.get('spark-substrate-descent-v2'),campaign);h.run("act('side-quit');act('entry-sideways')");assert.equal(h.window.SparkVault.observe().coins,3);
});
test('a failed bank storage write retains the outbox and retry pays exactly once',()=>{
 const h=ui(null,{entry:true});h.run("chooseProfile('pc');act('entry-sideways');act('side-new');side.journey.wallet=12;side.journey.player.x=710;act('side-gate')");h.run("side.onBank=()=>{throw Error('Storage unavailable')};act('side-service',{service:'bank'})");assert.equal(h.window.SparkSideways.observe().pendingBank.amount,12);assert.equal(h.window.SparkVault.observe().coins,0);assert.match(h.el('side-save-status').textContent,/waiting/);const retry=ui(null,{entry:true,deviceStorage:h.storage});retry.run("act('entry-sideways')");assert.equal(retry.window.SparkVault.observe().coins,12);assert.equal(retry.window.SparkSideways.observe().pendingBank,null);retry.run("act('side-quit');act('entry-sideways')");assert.equal(retry.window.SparkVault.observe().coins,12);
});
test('a second tab owns the side save; the older tab stops before moving, purchasing or saving',()=>{
 const h=ui(null,{entry:true});h.run("chooseProfile('pc');act('entry-sideways');act('side-new')");h.window.SparkSideways.control({x:1},40);const latest=h.storage.get(SIDE_KEY),second=ui(null,{entry:true,deviceStorage:h.storage});second.run("act('entry-sideways');act('side-resume')");assert.notEqual(h.storage.get(SIDE_LEASE),h.run('side.owner'));const oldX=h.window.SparkSideways.observe().player.x;h.run('side.tick(.5)');assert.equal(h.window.SparkSideways.observe().menu,'foreign');assert.equal(h.window.SparkSideways.observe().player.x,oldX);assert.throws(()=>h.window.SparkSideways.control({x:1},10),/Resume/);h.run('side.journey.wallet=100;side.save()');assert.equal(JSON.parse(h.storage.get(SIDE_KEY)).wallet,JSON.parse(latest).wallet);second.window.SparkSideways.control({x:1},20);assert.ok(second.window.SparkSideways.observe().player.x>oldX);
});
test('controller and touch grab and guard feed the same engine, and unsupported rumble is harmless',()=>{
 const h=ui(null,{entry:true});h.run("chooseProfile('controller');act('entry-sideways');act('side-new')");const b=Array.from({length:16},()=>({pressed:false,value:0}));b[6].pressed=true;b[10].pressed=true;h.window.navigator={getGamepads:()=>[{connected:true,mapping:'standard',axes:[0,0],buttons:b}]};assert.equal(h.run('side.controller().grab'),true);assert.equal(h.run('side.controller().guard'),true);assert.doesNotThrow(()=>h.run('side.rumble()'));h.run("chooseProfile('mobile');act('side-resume')");for(const id of ['grab','guard']){h.el('side-touch-'+id).handlers.get('pointerdown')({preventDefault(){},pointerId:7});assert.equal(h.run('side.touch.buttons.'+id),true);h.el('side-touch-'+id).handlers.get('pointercancel')({});assert.equal(h.run('side.touch.buttons.'+id),false);}
});
test('old cleared chambers offer actual encounters; rewards pay once per construct per body',()=>{
 const s=createSideJourney();enterSideRoom(s,'glass','');s.enemies.forEach(e=>e.hp=0);frames(s,{});s.player.x=230;s.player.y=620;const memories=s.memoryPoints;sideEchoEncounter(s);assert.equal(s.enemies.length,3);assert.ok(s.enemies.every(e=>e.id.startsWith('echo:')));
 for(const e of s.enemies)hit(s,e,9999,{type:'heavy',direction:1});frames(s,{},8);const paid=s.coins.reduce((n,c)=>n+c.value,0);assert.equal(paid,11);assert.equal(s.echoFinished,true);assert.equal(s.memoryPoints,memories);sideEchoEncounter(s);for(const e of s.enemies)hit(s,e,9999,{type:'heavy',direction:1});assert.equal(s.coins.reduce((n,c)=>n+c.value,0),paid);const restored=restoreSide(sideSave(s));assert.ok(restored);assert.equal(restored.enemies.filter(e=>e.hp>0).length,0);assert.equal(restored.coins.reduce((n,c)=>n+c.value,0),paid);
 s.player.invuln=0;sideDamage(s,9999);respawnSide(s);enterSideRoom(s,'glass','');s.player.x=230;sideEchoEncounter(s);for(const e of s.enemies)hit(s,e,9999,{type:'heavy',direction:1});assert.equal(s.coins.reduce((n,c)=>n+c.value,0),paid*2);
});
test('an encounter replay resumes injured foes and cannot be opened remotely or in a guardian arena',()=>{
 const s=createSideJourney();s.visited.push('glass');s.cleared.push('glass');enterSideRoom(s,'glass','');s.player.x=230;sideEchoEncounter(s);s.enemies[0].hp=24;const restored=restoreSide(sideSave(s));assert.equal(restored.echoRoom,'glass');assert.equal(restored.enemies[0].hp,24);restored.enemies.forEach(e=>e.hp=0);restored.player.x=1000;assert.throws(()=>sideEchoEncounter(restored),/glyph/);enterSideRoom(s,'forge','');assert.throws(()=>sideEchoEncounter(s),/glyph/);
});
test('many unattended physical drops consolidate without losing value or making the save unloadable',()=>{
 const s=createSideJourney();for(let i=0;i<80;i++)physicalCoins(s,'burst-'+i,1000,620,3);assert.ok(s.coins.length<=40);assert.equal(s.coins.reduce((n,c)=>n+c.value,0),240);const restored=restoreSide(sideSave(s));assert.ok(restored);assert.equal(restored.coins.reduce((n,c)=>n+c.value,0),240);
});
test('the Clockwork Collector captain has a breakable shell and a longer telegraphed lunge',()=>{
 const s=fight('human','cinder-fuel'),e=s.enemies.find(e=>e.captain);assert.ok(e);assert.ok(e.maxHp>100);const hp=e.hp;hit(s,e,20,{type:'light',direction:1});assert.equal(hp-e.hp,16);assert.ok(e.shell>0);hit(s,e,30,{type:'heavy',direction:1});assert.equal(e.shell,0);assert.ok(s.events.some(e=>e.type==='break'&&e.text.includes('armor')));
});
test('closing an unchanged older side tab does not overwrite a newer Vault deposit',()=>{
 const older=ui(null,{entry:true});older.run("chooseProfile('pc');act('entry-sideways');act('side-new')");const fresh=ui(null,{entry:true,deviceStorage:older.storage});fresh.run("act('entry-sideways');act('side-resume');side.journey.wallet=13;side.journey.player.x=710;act('side-gate');act('side-service',{service:'bank'})");assert.equal(fresh.window.SparkVault.observe().coins,13);older.run('side.save();persistKeepsakes()');assert.equal(JSON.parse(older.storage.get('spark-substrate-keepsakes-v12')).coins,13);
});
test('a committed deposit followed by a failed Sideways acknowledgement cannot pay twice on reload',()=>{
 const h=ui(null,{entry:true});h.run("chooseProfile('pc');act('entry-sideways');act('side-new');side.journey.wallet=16;side.journey.player.x=710;act('side-gate');const realBank=side.onBank;side.onBank=pending=>{const result=realBank(pending);const originalWrite=localStorage.setItem;localStorage.setItem=(key,value)=>{if(key==='spark-substrate-sideways-v1'){throw Error('Interrupted acknowledgement');}return originalWrite(key,value);};return result;};act('side-service',{service:'bank'})");assert.equal(h.window.SparkVault.observe().coins,16);assert.ok(JSON.parse(h.storage.get(SIDE_KEY)).pendingBank);const reloaded=ui(null,{entry:true,deviceStorage:h.storage});reloaded.run("act('entry-sideways')");assert.equal(reloaded.window.SparkVault.observe().coins,16);assert.equal(reloaded.window.SparkSideways.observe().pendingBank,null);
});
