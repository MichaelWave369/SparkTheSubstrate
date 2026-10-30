import test from 'node:test';
import assert from 'node:assert/strict';
import {DescentXRAdapter} from '../public/vr/spark-xr-adapters.js';
import {SparkXRRuntime} from '../public/vr/spark-xr-runtime.js';
import {LivingSparkHost} from '../public/vr/spark-living-host.js';
import * as poses from '../public/vr/spark-xr-preview.js';
import {createVRPreview} from '../public/vr/spark-vr-model.js';
import {enterGate,stepRun,guardianThreats,validRun,attackObservations} from '../public/action-engine.js';
import {GuardianPresentation,guardianGeometry} from '../public/vr/spark-guardian-presentation.js';
import {livingRoomGeometry,livingDynamicGeometry,roomTheme} from '../public/vr/spark-room-themes.js';
import {VR_SAVE_KEY,VR_SAVE_SCHEMA} from '../public/vr/spark-vr-save.js';
import {livingWristPose} from '../public/vr/spark-vr-renderer.js';
import {inverseRigidPoint} from '../public/vr/spark-xr-targeting.js';
import {awakeningDriver} from './vr-awakening-path.mjs';
import {crossGate} from './vr-living-path.mjs';
import {reachWarden,wardenFightStep} from './vr-warden-path.mjs';
const silent={unlock(){},stop(){},event(){},listener(){},dispose(){}};
const memory=()=>({data:new Map(),getItem(k){return this.data.get(k)??null;},setItem(k,v){this.data.set(k,String(v));}});
function setup(){const storage=memory(),a=new DescentXRAdapter(),r=new SparkXRRuntime({adapter:a,feedback:silent,settings:{movement:1,throwMode:'trigger'}}),h=new LivingSparkHost({runtime:r,storage});
 r.mode='desktop';r.pause(false);const d=awakeningDriver({runtime:r,host:h,poses});d.tick({});d.tick({});return {a,r,h,d,storage};}
// Labeled controlled entry fixture: only route prerequisites/position are supplied;
// native enterGate creates the untouched boss. Not a natural campaign playthrough.
function fixture(){const state=createVRPreview(),run=state.run;run.room='foundry';run.cleared.push('foundry');run.abilities.push('eye');run.earnedAbilities.push('eye');
 Object.assign(run.player,{x:480,y:115});run.gateGrace=0;enterGate(run,'north');return {state,run,boss:run.enemies[0]};}
const step=run=>stepRun(run,{attackMode:'directed-v1'},1/60);
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
for(const stage of [1,2])test(`controlled phase ${stage}: native Warden HP, locked spread, damage, speed, cadence and summons`,()=>{
 const {run,boss}=fixture();assert.equal(boss.hp,1800);assert.equal(boss.maxHp,1800);assert.equal(boss.r,37);
 if(stage===2)boss.hp=899; // Explicit half-health rule fixture, never evidence of a kill.
 while(!(boss.windup>0))step(run);
 const angles=guardianThreats(run)[0].angles;assert.equal(angles.length,stage===1?3:5);
 const offsets=stage===1?[-.2,0,.2]:[-.36,-.18,0,.18,.36];offsets.forEach((a,i)=>close(angles[i],boss.aimAngle+a));
 const aim=boss.aimAngle;run.player.x+=40;run.player.y-=30;step(run);close(boss.aimAngle,aim);
 while(!(boss.volleys>0))step(run);
 const bolts=run.shots.filter(s=>s.enemy&&s.sourceKind==='warden');assert.equal(bolts.length,angles.length);
 bolts.forEach((s,i)=>{close(Math.atan2(s.vy,s.vx),Math.atan2(Math.sin(angles[i]),Math.cos(angles[i])));close(Math.hypot(s.vx,s.vy),stage===1?220:260);assert.equal(s.damage,stage===1?14:16);});
 close(boss.attack,stage===1?1.4:.9);assert.equal(run.enemies.filter(e=>e.kind==='hound').length,stage===1?0:2);
 if(stage===1){boss.hp=900;step(run);assert.equal(boss.stage,1,'exactly half remains first phase');boss.hp=899;step(run);assert.equal(boss.stage,2);assert.equal(run.enemies.filter(e=>e.kind==='hound').length,2);}
 if(stage===2){const ids=run.enemies.filter(e=>e.kind==='hound').map(e=>e.id);for(let i=0;i<60;i++)step(run);assert.deepEqual(run.enemies.filter(e=>e.kind==='hound').map(e=>e.id),ids,'hounds spawn once, not on every phase observation');}
});
test('controlled native ground marks are observed verbatim and presentation cannot hurt, reward or advance the run',()=>{
 const {state,run,boss}=fixture();boss.markClock=0;step(run);
 const a=new DescentXRAdapter(state);a.observePresentation(0);const before=structuredClone(run),s=a.snapshot(),mark=run.marks[0],observed=s.guardians[0].marks[0];
 assert.deepEqual(observed,{x:mark.x,y:mark.y,r:70,remaining:mark.timer,total:1.1});assert.equal(mark.sourceId,boss.id);
 for(let i=0;i<30;i++){const vertices=[];a.guardian.observe(s,.1);guardianGeometry(vertices,s,6);livingDynamicGeometry(vertices,{...s,quality:'performance'});assert.ok(vertices.every(Number.isFinite));}
 assert.deepEqual(run,before);assert.equal(a.guardian.describe().defeated,false);assert.equal(a.guardian.describe().victory,0);
});
test('guardian phase and victory cues are canonical, bounded, reduced, nonreplaying after cleanup and advance while reward gameplay is paused',()=>{
 const {state,run,boss}=fixture();let now=0;const a=new DescentXRAdapter(state);a.guardian=new GuardianPresentation({now:()=>now});a.observePresentation(0);
 boss.hp=899;step(run);a.observePresentation(1/60);assert.equal(a.guardian.describe().hounds,2);assert.equal(a.guardian.drainEvents().filter(e=>e.type==='guardian-phase').length,1);
 a.observePresentation(1/60);assert.equal(a.guardian.drainEvents().filter(e=>e.type==='guardian-phase').length,0);
 const s=a.snapshot(),normal=[],reduced=[];guardianGeometry(normal,{...s,quality:'balanced'},12);guardianGeometry(reduced,{...s,reduced:true},6);assert.ok(normal.length>reduced.length);
 // Presentation does not accept an absent model or a stray cleared flag as a kill.
 a.guardian.observe({...s,guardians:[],cleared:true,bossDefeated:null},0);assert.equal(a.guardian.describe().defeated,false);
 a.guardian.observe({...s,guardians:[],cleared:true,bossDefeated:{room:'eye',name:'The Warden'}},0);
 assert.equal(a.guardian.describe().victory,2.8);now=1400;close(a.guardian.describe().victory,1.4);now=6000;assert.equal(a.guardian.describe().victory,0);
 run.cleared.push('eye');a.dispose();assert.equal(a.guardian.describe().victory,0);assert.deepEqual(a.drainEvents(),[]);assert.equal(a.launches.size,0);
 a.guardian.seed({...s,cleared:true,guardians:[],bossDefeated:{room:'another-guardian'}});
 assert.equal(a.guardian.describe().defeated,true,'native cleared history survives a newer boss banner');assert.equal(a.guardian.describe().victory,0);assert.deepEqual(a.guardian.drainEvents(),[]);
});
test('Eye chamber caches static geometry, quality budgets dynamic effects and preserves Cantor six/eight plus pair observations',()=>{
 const {state,run}=fixture(),a=new DescentXRAdapter(state),s=a.snapshot();assert.equal(roomTheme(s).showcase,'eye');assert.equal(s.guardianVisual.kind,'warden');
 assert.equal(livingRoomGeometry(s),livingRoomGeometry(s));const sizes=[];
 for(const quality of ['performance','balanced','high']){const v=[];livingDynamicGeometry(v,{...s,quality});assert.ok(v.every(Number.isFinite));sizes.push(v.length);}
 assert.ok(sizes[0]<sizes[1]&&sizes[1]<sizes[2]);
 run.room='forge';Object.assign(run.enemies[0],{kind:'cantor',hp:1100,maxHp:1100,windup:.9,volleyAngle:.2,aimAngle:1});
 assert.equal(guardianThreats(run)[0].angles.length,6);run.enemies[0].hp=549;assert.equal(guardianThreats(run)[0].angles.length,10);
 a.observePresentation(0);assert.equal(a.guardian.describe().kind,'cantor');assert.match(a.guardian.describe().guide,/locked ring/);
});
test('Eye architecture leaves the real eastern progression doorway visibly open at body height',()=>{
 const {state}=fixture(),a=new DescentXRAdapter(state),s=a.snapshot();assert.ok(s.gates.some(g=>g.direction==='east'));
 const v=livingRoomGeometry(s);
 for(let i=0;i<v.length;i+=6){const [x,y,z]=v.slice(i,i+3);
  assert.ok(!(x>4.2&&x<4.7&&y>.3&&y<2.3&&Math.abs(z)<.5),'no decorative pillar in the native exit corridor');
 }
});
test('paused wrist faces the viewer within readable bounds at overhead, seated and missing/near controller poses',()=>{
 for(const pitch of [-.5,0,1.1])for(const height of [1.1,1.65])for(const grip of [null,poses.previewMatrix(-.22,height-.2,-.48),poses.previewMatrix(0,height,-.01),poses.previewMatrix(-2,height-1,-3)]){
  const head=poses.previewMatrix(.2,height,.1,.7,pitch),wrist=livingWristPose(head,grip),local=inverseRigidPoint(head,[...wrist.slice(12,15)]);
  assert.ok(local[0]>=-.421&&local[0]<=-.359);assert.ok(local[1]>=-.121&&local[1]<=.101);
  assert.ok(local[2]>=-1.401&&local[2]<=-1.249);assert.ok([...wrist].every(Number.isFinite));
  // Full panel fits both 64-mm-separated test eyes, even in the narrower
  // square preview frustum; no left-edge cropping of choices in the right eye.
  for(const offset of [-.032,.032])for(const edge of [-.33,.33])assert.ok(Math.abs((local[0]+edge-offset)/local[2])<Math.tan(Math.PI/5.4));
  for(let i=0;i<12;i++)close(wrist[i],Math.fround(head[i]));
 }
});
test('fresh input-only route: Classic and left-handed seated Spellcraft legally damage the Warden, defeat it, preserve rewards, checkpoint and both Eye decisions',()=>{
 const {a,r,h,d,storage}=setup();reachWarden(d);assert.equal(d.snapshot().guardians[0].maxHp,1800);
 for(let i=0;i<90;i++)wardenFightStep(d,i);assert.ok(a.state.run.stats.damageDealt>0);const classicHP=d.snapshot().guardians[0].hp;assert.ok(classicHP<1800);
 r.configure({posture:'seated',dominantHand:'left',reduced:true});d.profile('spellcraft');let three=false,five=false,hounds=false,marks=false;
 for(let i=0;i<15000&&!d.snapshot().cleared;i++){
  const s=d.snapshot(),g=s.guardians[0];assert.notEqual(s.phase,'dead','native acceptance character must survive');
  three||=g?.angles.length===3;five||=g?.angles.length===5;hounds||=s.enemies.filter(e=>e.kind==='hound').length===2;marks||=g?.marks.length>0;
  wardenFightStep(d,i);
 }
 assert.equal(d.snapshot().cleared,true);assert.ok(three&&five&&hounds&&marks);assert.equal(a.state.run.bossDefeated.name,'The Warden');
 assert.ok(attackObservations(a.state.run).some(e=>e.type==='hit'&&e.room==='eye'));assert.ok(a.state.run.seals.includes('stratum'));assert.ok(a.state.run.earnedAbilities.includes('morph'));assert.ok(a.state.run.essence>=12);
 while(d.snapshot().phase!=='milestone'){const s=d.snapshot();assert.ok(s.choices.length);d.choose(s.choices.find(c=>c.id==='0')?.id||s.choices[0].id);}
 assert.deepEqual(d.snapshot().choices.map(c=>c.id),['continue','finish']);assert.ok(validRun(a.state.run));
 h.save();const checkpoint=structuredClone(a.state.run),saved=JSON.parse(storage.getItem(VR_SAVE_KEY));assert.equal(saved.schema,VR_SAVE_SCHEMA);assert.equal(saved.run.guardianVisual,undefined);
 d.choose('finish');assert.equal(a.state.run.phase,'won');assert.equal(a.state.run.victory,'eye');
 h.restore();assert.deepEqual(a.state.run,checkpoint);
 const restored=a.snapshot().guardianVisual;assert.equal(restored.kind,'warden');assert.equal(restored.defeated,true);assert.equal(restored.victory,0,'restored milestone is already fractured without replaying defeat');assert.deepEqual(a.guardian.drainEvents(),[]);
 d.choose('continue');assert.equal(a.state.run.phase,'playing');assert.equal(a.state.run.eyeAcknowledged,true);
 a.morph('tree');assert.equal(a.state.run.form,'tree');r.pause(false);d.tick({});d.tick({});crossGate(d,'east');assert.equal(d.snapshot().roomId,'tide-harbor');assert.ok(validRun(a.state.run));
 for(const key of ['spark-substrate-descent-v2','spark-substrate-sideways-v1'])assert.equal(storage.getItem(key),null);
});
