import test from 'node:test';
import assert from 'node:assert/strict';
import {createMoreBounceField,sampleMoreBounceField,validMoreBounceField} from '../public/more-bounce-field.js';
import {MoreBouncePresentation,moreBounceEligible} from '../public/vr/spark-more-bounce.js';
import {createVRPreview} from '../public/vr/spark-vr-model.js';
import {DescentXRAdapter} from '../public/vr/spark-xr-adapters.js';
import {SparkXRRuntime} from '../public/vr/spark-xr-runtime.js';
import {stepRun} from '../public/action-engine.js';
// Controlled presentation eligibility fixture; no assertion of earned progress.
function ready(){const r=createVRPreview().run,rooms=['glass','machine','roots','quiet','conduit','cistern','forge','reliquary','nursery'];
 r.room='forge';r.cleared.push(...rooms);r.roomResolved=[...rooms];r.abilities.push('morph');r.visitedVessels=['spark','human','computer','animal','tree','rock'];
 r.journal=rooms.map(room=>({id:room+':decision',room,text:'A small freedom outlives this body.'}));return r;}
test('portable Giggle Field is finite, bounded, original and presentation-only at normal/reduced intensity',()=>{
 for(const reduced of [false,true]){
  const e=createMoreBounceField({at:1,seed:369,reduced});assert.ok(validMoreBounceField(e));
  for(let t=1;t<7.9;t+=.01){const s=sampleMoreBounceField(e,t);assert.ok(s.radius<=3.6);assert.equal(s.dancers.length,6);assert.ok(s.bubbles.length<=9);
   for(const d of s.dancers)assert.ok([d.x,d.y,d.z,d.arms].every(Number.isFinite));}
  assert.equal(sampleMoreBounceField(e,8),null);assert.equal(sampleMoreBounceField({...e,bubbles:{count:1e12}},2),null);
  assert.equal(e.propagation.maxHops,0);assert.equal(e.authority,'presentation-only');assert.equal(e.audio.originalSynthesis,true);
 }
 assert.throws(()=>createMoreBounceField({at:NaN}),/Invalid/);
});
test('secret requires earned history and a clear forge; celebration never changes canonical state or saves',()=>{
 const r=ready(),p=new MoreBouncePresentation(),before=structuredClone(r);assert.equal(moreBounceEligible(r),true);
 p.activate(r,{reduced:true});p.observe(r);assert.deepEqual(r,before);assert.ok(p.snapshot(r).celebrationOnly);
 assert.equal(p.snapshot(r,{reduced:true}).bubbles.length,3);assert.equal(p.snapshot(r,{reduced:false}).bubbles.length,9);
 assert.equal(p.activate(r,{}),false);assert.equal(p.drainEvents().length,1);p.observe(r);assert.equal(p.drainEvents().length,0);
 r.time=7;p.observe(r);assert.equal(p.snapshot(r),null);assert.equal(p.events.length,0);
 for(const mutate of [r=>r.enemies.push({hp:1}),r=>r.visitedVessels.pop(),r=>r.journal.pop(),r=>r.phase='resolve',r=>r.room='glass',r=>r.roomResolved.pop()]){
  const locked=ready();mutate(locked);assert.equal(moreBounceEligible(locked),false);assert.throws(()=>p.activate(locked,{}),/not answered/);
 }
 const active=ready();p.activate(active,{});active.enemies.push({hp:1});p.observe(active);assert.equal(p.snapshot(active),null,'never pacifies active combat');
});
test('plain session exit clears an active celebration and presentation without resetting the journey',async()=>{
 const state=createVRPreview();state.run=ready();const a=new DescentXRAdapter(state),r=new SparkXRRuntime({adapter:a,
  feedback:{stop(){},dispose(){},event(){},listener(){}}});
 state.run.player.attackClock=0;
 stepRun(state.run,{attackMode:'directed-v1',attackIntent:{version:'spark.attack-intent.v1',room:'forge',observedAt:state.run.time,
  sequence:1,origin:{x:state.run.player.x,y:state.run.player.y},direction:{x:0,y:-1},targetId:null,assist:0}},1/60);
 a.observePresentation();a.drainEvents();assert.ok(a.presentation.action);
 a.moreBounce.activate(state.run,{});assert.ok(a.snapshot().moreBounce);const before=structuredClone(state.run);
 r.mode='desktop';await r.exit();assert.equal(a.snapshot().moreBounce,null);assert.equal(a.moreBounce.variants,null);
 assert.deepEqual(state.run,before);assert.equal(r.mode,'idle');assert.equal(r.paused,true);
 a.observePresentation();assert.equal(a.presentation.action,null);
 assert.equal(a.drainEvents().filter(e=>['attack','hit','miss'].includes(e.type)).length,0,'old observations cannot replay attacks on reentry');
});
