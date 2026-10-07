import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as A from '../public/action-engine.js';
import * as M from '../public/mastery.js';
import {endingFor,dailySeed,runRecord} from '../public/run-record.js';
import {cleanSettings,defaultSettings,changeBinding,controllerInput,SparkAudio} from '../public/settings.js';
import {saveRunCard} from '../public/share-run.js';
import {FORMS} from '../public/engine.js';
import {prepareEquipment} from '../public/equipment.js';

function trained(form,branch=null){let meta=A.createMeta();while(!A.offeredForms(meta).includes(form))meta.runs++;meta.training[form].xp=100;if(branch)for(const node of M.SKILL_TREES[form].find(path=>path.id===branch).nodes)meta=M.learnSkill(meta,form,node.id);return meta;}
const runFor=(form,branch=null)=>A.createRun(trained(form,branch),form,19);
const foe=(run,x=50,hp=1000)=>({id:400,kind:'collector',x:run.player.x+x,y:run.player.y,r:14,hp,maxHp:hp,speed:0,attack:10,orbitHit:0,flash:0});
const tick=(run,n=1,input={})=>{for(let i=0;i<n;i++)A.stepRun(run,input,1/60);};
const bullet=run=>({id:501,x:run.player.x,y:run.player.y,r:6,vx:0,vy:0,damage:10,life:4,enemy:true});
function power(form,branch){const run=runFor(form,branch);run.player.hp-=50;run.player.attackClock=100;run.enemies=[foe(run)];A.useVesselPower(run);assert.ok(A.validRun(run));return run;}

test('36 skills form 18 linked paths, enforce point budgets and specialties, and rebuild without losing mastery',()=>{
 assert.equal(Object.values(M.SKILL_TREES).flatMap(tree=>tree.flatMap(path=>path.nodes)).length,36);
 for(const form of Object.keys(A.BODIES)){
  const original=trained(form),paths=M.SKILL_TREES[form];assert.equal(M.availablePoints(form,original.training[form]),5);assert.throws(()=>M.learnSkill(original,form,paths[0].nodes[1].id),/first/);
  let meta=M.learnSkill(M.learnSkill(original,form,paths[0].nodes[0].id),form,paths[0].nodes[1].id);assert.equal(M.specialty(meta.training,form).name,paths[0].nodes[1].name);assert.equal(M.availablePoints(form,meta.training[form]),2);
  meta=M.learnSkill(M.learnSkill(meta,form,paths[1].nodes[0].id),form,paths[2].nodes[0].id);assert.ok(M.validTraining(meta.training));assert.throws(()=>M.learnSkill(meta,form,paths[1].nodes[1].id),/One specialty/);
  const rebuilt=M.rebuildTree(meta,form);assert.equal(rebuilt.training[form].xp,100);assert.deepEqual(rebuilt.training[form].learned,[]);assert.equal(meta.training[form].learned.length,4);assert.equal(M.validTraining({...rebuilt.training,[form]:{xp:0,learned:[paths[0].nodes[0].id]}}),false);
 }
});
test('Spark specialties widen a pulse, shorten recovery, and heal only when actual bolts are cleared',()=>{
 const beacon=runFor('spark','radiance');beacon.enemies=[foe(beacon,300)];A.useVesselPower(beacon);assert.ok(beacon.enemies[0].hp<1000);
 const drift=power('spark','drift');assert.equal(drift.player.powerCooldown,6.4);assert.ok(A.dashCooldown(drift)<A.dashCooldown(runFor('spark')));
 const glow=runFor('spark','ember');glow.player.hp-=30;const hp=glow.player.hp;glow.shots=[bullet(glow)];A.useVesselPower(glow);assert.equal(glow.player.hp,hp+12);assert.equal(glow.shots.length,0);
 const noBolt=runFor('spark','ember');noBolt.player.hp-=30;A.useVesselPower(noBolt);assert.equal(noBolt.player.hp,noBolt.player.maxHp-30);
});
test('Human specialties change real attack damage and Rally healing/guarding',()=>{
 const normal=runFor('human'),duelist=runFor('human','blade');for(const run of [normal,duelist]){run.player.attackClock=0;run.enemies=[foe(run)];tick(run);}assert.ok(1000-duelist.enemies[0].hp>(1000-normal.enemies[0].hp)*1.25);
 const guard=runFor('human','guard');A.addPartner(guard,'spark');guard.partner.hp-=30;const hp=guard.partner.hp;A.useVesselPower(guard);assert.equal(guard.player.guardTime,5);assert.equal(guard.partner.hp,hp+10);
 const mender=power('human','solace');assert.equal(mender.player.maxHp,A.BODIES.human.hp+12+12);assert.equal(mender.player.hp,mender.player.maxHp-17);
});
test('Computer specialties seek, extend Overclock, and clear bullets while guarding',()=>{
 const oracle=runFor('computer','scan');oracle.player.attackClock=0;oracle.enemies=[foe(oracle,300)];tick(oracle);assert.equal(oracle.shots.length,3);assert.ok(oracle.shots.every(shot=>shot.homing));
 const clock=power('computer','clock');assert.equal(clock.player.overclockTime,6);assert.equal(clock.player.powerCooldown,8);assert.equal(A.powerProfile(clock).cooldown,8);assert.match(A.powerProfile(clock).desc,/six|6 seconds/);
 const firewall=runFor('computer','barrier');firewall.shots=[bullet(firewall)];A.useVesselPower(firewall);assert.equal(firewall.player.guardTime,2);assert.ok(firewall.shots.every(shot=>!shot.enemy));assert.ok(A.validRun(firewall));
});
test('Animal specialties strengthen, extend, and share healing through Pounce',()=>{
 const hunt=runFor('animal','hunt');hunt.enemies=[{...foe(hunt,0),y:hunt.player.y-150}];A.useVesselPower(hunt);assert.equal(hunt.player.powerCooldown,4.5);assert.ok(hunt.enemies[0].hp<890);
 const normal=runFor('animal'),wind=runFor('animal','runner');const y=normal.player.y;A.useVesselPower(normal);A.useVesselPower(wind);assert.ok(y-wind.player.y>y-normal.player.y+55);assert.equal(wind.player.iframes,1);wind.player.iframes=0;wind.player.powerCooldown=0;A.useVesselPower(wind);assert.equal(wind.player.iframes,.55);
 const pack=runFor('animal','pack');A.addPartner(pack,'spark');pack.player.hp-=30;pack.partner.hp-=30;const hp=pack.player.hp,ally=pack.partner.hp;A.useVesselPower(pack);assert.equal(pack.player.hp,hp+8);assert.equal(pack.partner.hp,ally+8);
});
test('Tree specialties lengthen roots, strengthen their hit, and heal a partner',()=>{
 const ancient=power('tree','growth');assert.equal(ancient.enemies[0].rootTime,3.5);ancient.player.powerCooldown=100;const hp=ancient.player.hp;tick(ancient,60);assert.ok(ancient.player.hp-hp>1.19);
 const thorns=power('tree','thorns');assert.ok(thorns.enemies[0].hp<=910);
 const shelter=runFor('tree','shelter');A.addPartner(shelter,'spark');shelter.player.hp-=50;shelter.partner.hp-=50;const hp2=shelter.player.hp,ally=shelter.partner.hp;A.useVesselPower(shelter);assert.equal(shelter.player.hp,hp2+32);assert.equal(shelter.partner.hp,ally+18);assert.match(A.powerProfile(shelter).desc,/32 HP/);assert.match(A.powerProfile(shelter).desc,/18 HP/);
});
test('Rock specialties widen a fault, clear bullets with longer guards, and strike once per dash',()=>{
 const mass=runFor('rock','mass');mass.enemies=[foe(mass,300)];A.useVesselPower(mass);assert.ok(mass.enemies[0].hp<=858);
 const bastion=runFor('rock','bulwark');bastion.shots=[bullet(bastion)];A.useVesselPower(bastion);assert.equal(bastion.player.guardTime,6);assert.equal(bastion.shots.length,0);assert.ok(A.validRun(bastion));
 const roll=runFor('rock','stride');roll.player.attackClock=100;roll.enemies=[foe(roll,70)];tick(roll,1,{dash:true});assert.equal(roll.enemies[0].hp,960);const health=roll.enemies[0].hp;tick(roll,1,{dash:true});assert.equal(roll.enemies[0].hp,health);assert.ok(roll.player.dashCooldown<1.3);
});
test('morphing and checkpoint gear preserve injury and switch only the current vessel’s learned health',()=>{
 let meta=trained('human','solace');meta.training.tree.xp=100;meta=M.learnSkill(meta,'tree','growth-1');const run=A.createRun(meta,'human',7);A.addPartner(run,'tree');assert.equal(run.player.maxHp,159);assert.equal(run.partner.maxHp,155);run.player.hp*=.4;run.partner.hp*=.3;run.abilities.push('morph');A.morphRun(run,'tree');assert.equal(run.player.maxHp,155);assert.equal(run.player.hp/run.player.maxHp,.4);run.player.morphCooldown=0;A.morphRun(run,'human');assert.equal(run.player.maxHp,159);assert.equal(run.partner.hp/run.partner.maxHp,.3);
 const legacy=structuredClone(run);delete legacy.training;delete legacy.stats;delete legacy.masteryEarned;delete legacy.partnerMasteryEarned;delete legacy.roomPractice;assert.ok(A.validRun(legacy));assert.ok(A.validMeta({...meta,training:undefined}));
});
test('clearing credits the most-used vessel separately for each spark, then banks it exactly once',()=>{
 const run=runFor('spark');A.addPartner(run,'tree');run.room='glass';run.spawnTotal=run.spawned=A.ENCOUNTERS.glass.total;run.roomPractice={host:{spark:18,rock:1},partner:{tree:15,human:2}};run.enemies=[];tick(run);assert.equal(run.phase,'resolve');assert.deepEqual(run.masteryEarned,{spark:10});assert.deepEqual(run.partnerMasteryEarned,{tree:10});A.resolveChamber(run,0);tick(run);assert.deepEqual(run.masteryEarned,{spark:10});run.phase='dead';run.player.hp=run.partner.hp=0;
 const guestCopy=structuredClone(run),host=A.settleRun(run,A.createMeta()),guest=A.settleRun(guestCopy,A.createMeta(),true);assert.equal(host.training.spark.xp,10);assert.equal(host.training.tree.xp,0);assert.equal(guest.training.tree.xp,10);assert.throws(()=>A.settleRun(run,host));
});
test('damage totals count actual enemy health and preserve projectile ownership across a morph',()=>{
 const run=runFor('spark');A.addPartner(run,'computer');run.partner.attackClock=0;run.player.attackClock=100;run.enemies=[{...foe(run,200,500),x:run.partner.x+100}];tick(run);assert.ok(run.shots.some(shot=>shot.sourcePartner));run.abilities.push('morph');A.morphRun(run,'tree',true);tick(run,40);assert.ok(run.stats.partner.damageDealt>0);assert.equal(run.stats.damageDealt,0);
 const overkill=runFor('human');overkill.enemies=[foe(overkill,50,1)];A.useVesselPower(overkill);assert.equal(overkill.stats.damageDealt,1);const record=runRecord(overkill,A.ROOMS,{},false);assert.equal(record.damageDealt,1);assert.equal(record.powers,1);
});
test('pre-mastery saves grant visited vessels one welcome point exactly once',()=>{
 const old=A.createMeta();delete old.training;old.runs=3;old.visited=['spark','tree'];const migrated=prepareEquipment(old);assert.equal(migrated.training.spark.xp,20);assert.equal(migrated.training.tree.xp,20);assert.equal(migrated.training.rock.xp,0);assert.deepEqual(prepareEquipment(migrated),migrated);const next=M.learnSkill(migrated,'tree','growth-1');assert.equal(M.availablePoints('tree',next.training.tree),0);assert.ok(A.validMeta(next));const form=A.offeredForms(old)[0];assert.equal(A.createRun(old,form,3).training.tree.xp,20);
});
test('three karma endings apply at both the Eye milestone and the full finale',()=>{
 for(const [karma,id]of [[50,'liberated'],[-50,'sovereign'],[0,'witness']])for(const room of ['eye','origin-heart'])assert.equal(endingFor({karma,room}).id,id);
 const run=runFor('spark');run.room='eye';run.cleared.push('eye');run.phase='resolve';run.fragments=[];A.resolveChamber(run,0);assert.equal(run.phase,'milestone');assert.ok(A.validRun(run));const finish=structuredClone(run);A.resolveMilestone(run,'continue');assert.equal(run.phase,'playing');assert.equal(run.eyeAcknowledged,true);A.resolveMilestone(finish,'finish');assert.equal(finish.phase,'won');assert.equal(finish.victory,'eye');const meta=A.settleRun(finish,A.createMeta());assert.equal(meta.lastRun.ending,'The Remembered World');assert.equal(meta.endings.length,1);assert.throws(()=>A.resolveMilestone(run,'finish'));
});
test('daily runs use a stable UTC seed, baseline gear and skills, and separate results without campaign rewards',()=>{
 const date=new Date('2026-10-05T23:59:59Z'),a=A.createDailyRun(date),b=A.createDailyRun(date);assert.deepEqual(a,b);assert.notEqual(a.seed,A.createDailyRun(new Date('2026-10-06T00:00:00Z')).seed);assert.equal(dailySeed(date).day,'2026-10-05');assert.equal(a.player.maxHp,112);assert.equal(M.specialty(a.training,'spark'),null);
 const meta=trained('spark','radiance');meta.essence=40;meta.inventory.firstlight=3;assert.throws(()=>A.equipRunItem(a,meta,'firstlight'),/not been found/);a.phase='dead';a.player.hp=0;a.essence=500;a.keys=['ivory'];a.masteryEarned={spark:40};a.loot=['prism'];const next=A.settleRun(a,meta);assert.equal(next.essence,40);assert.equal(next.training.spark.xp,100);assert.deepEqual(next.keys,[]);assert.equal(next.inventory.prism,undefined);assert.equal(next.dailyResults.length,1);assert.equal(next.runs,meta.runs);assert.equal(A.earnedEssence(a,meta),0);assert.ok(A.validMeta(next));assert.ok(A.validRun(a));
});
test('settings sanitize stored data, keep bindings unique, and controller pulses require a release',()=>{
 const defaults=defaultSettings(true);assert.equal(defaults.shake,0);assert.equal(defaults.flashes,0);const bad=cleanSettings({master:100,flashes:-2,bindings:{power:'<',up:'f',down:'f'}});assert.equal(bad.master,1);assert.equal(bad.flashes,0);assert.equal(new Set(Object.values(bad.bindings)).size,11);assert.throws(()=>changeBinding(defaults,'power','1'));assert.throws(()=>changeBinding(defaults,'power','w'));assert.equal(changeBinding(defaults,'power','r').bindings.power,'r');
 const pad={connected:true,mapping:'standard',id:'Test controller',axes:[.1,-.5],buttons:Array.from({length:16},()=>({pressed:false,value:0}))};pad.buttons[0].pressed=true;pad.buttons[1].pressed=true;const first=controllerInput([pad]);assert.equal(first.x,0);assert.equal(first.y,-.5);assert.equal(first.dash,true);assert.equal(first.interact,true);assert.equal(controllerInput([pad],first.buttons).dash,false);pad.buttons[0].pressed=false;const released=controllerInput([pad],first.buttons);pad.buttons[0].pressed=true;assert.equal(controllerInput([pad],released.buttons).dash,true);assert.equal(controllerInput([]).connected,false);
});
test('sound produces distinct envelopes, follows saved volumes, and mutes its ambient layer',async()=>{
 const tones=[],gains=[];const param=()=>({value:0,setValueAtTime(value){this.value=value;},exponentialRampToValueAtTime(value){this.end=value;},setTargetAtTime(value){this.value=value;}});class Context{constructor(){this.currentTime=0;this.state='running';}async resume(){}createGain(){const node={gain:param(),connect(){}};gains.push(node);return node;}createOscillator(){const node={frequency:param(),connect(){},start(){tones.push(this.frequency.value);},stop(){}};return node;}}
 const settings=defaultSettings(),audio=new SparkAudio({AudioContext:Context},settings);audio.effect('hit');assert.equal(tones.length,0);await audio.enable(true);const count=tones.length;audio.effect('hit');audio.effect('hit');assert.equal(tones.length,count+1);audio.context.currentTime=1;audio.effect('level');assert.ok(tones.includes(130));assert.ok(gains.some(node=>node.gain.end===.0001));await audio.enable(false);assert.equal(audio.bedGain.gain.value,0);
});
test('run-card export contains exact result values and creates a downloadable PNG without posting it',async()=>{
 const drawn=[],link={},record={form:'tree',won:false,level:7,seconds:126,chambers:4,kills:42,damageDealt:1890,karma:12,seed:89,equipment:['Thorn Staff','Grove Mantle'],gifts:[]};const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),measureText:text=>({width:text.length*12}),fillText:text=>drawn.push(String(text))},{get:(o,k)=>k in o?o[k]:(()=>{}),set:(o,k,v)=>(o[k]=v,true)});const canvas={getContext:()=>ctx,toBlob:fn=>fn(new Blob(['png'],{type:'image/png'}))};const document={createElement:type=>type==='canvas'?canvas:Object.assign(link,{click(){this.clicked=true;}})},window={URL:{createObjectURL:blob=>{assert.equal(blob.type,'image/png');return 'blob:test';},revokeObjectURL(){}},setTimeout:fn=>fn()};await saveRunCard(record,FORMS,document,window);assert.equal(link.download,'spark-run-89.png');assert.equal(link.clicked,true);assert.ok(drawn.includes('1,890'));assert.ok(drawn.includes('2:06'));assert.ok(drawn.some(text=>text.includes('Thorn Staff')));
});
