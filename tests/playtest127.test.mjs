import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import * as A from '../public/action-engine.js';
import * as D from '../public/duel-engine.js';
import {OnlineRoom} from '../public/online.js';
import {handleRoomRequest} from '../server/rooms.mjs';
import {ui} from './ui-harness.mjs';
import {checkRescueUnderLatency} from './co-op-rescue.mjs';

test('held E survives a world poll; its explicit release survives even an old tick still holding E',async()=>{
 const packets=[],client=new OnlineRoom(()=>{},assert.fail,{now:()=>1000,fetch:async(path,options)=>{const p=JSON.parse(options.body);packets.push(p);return Response.json({seq:1,inputSeq:p.seq});}});client.session={role:'guest',code:'ABCDEFGH',token:'test'};
 client.input({x:0,interact:true,fallAck:2});client.capture('127:threshold');await client.sync();await client.sendInput();assert.equal(packets[1].input.interact,true);assert.equal(packets[1].input.fallAck,2);assert.equal(packets[1].input.stream.frames[0].fallAck,undefined);
 const r=A.createRun(A.createMeta(),'spark',127);A.addPartner(r,'spark');A.controlledFall(r);const v=ui({version:2,meta:A.createMeta(),run:r});v.run("remoteInput={active:true,interact:false,stream:{}};remoteInputAge=0;remoteInputAt=Date.now();playback.receive({active:true,stream:{epoch:'release',context:movementContext(run),frames:[{tick:1,x:0,y:0,interact:true}]}},movementContext(run));run.player.revive=.6;stepRun(run,{partner:livePartnerInput()},1/60)");assert.equal(v.run('run.player.revive'),0,'newly released hold overrides an old numbered tick immediately');
});

test('both clients complete quiet-room revival with delayed relay packets and a fallen-state acknowledgement',async()=>{
 const sqlite=new DatabaseSync(':memory:');sqlite.exec(fs.readFileSync(new URL('../drizzle/0000_famous_swarm.sql',import.meta.url),'utf8'));const DB={prepare(sql){let values=[];return {bind(...v){values=v;return this;},async first(){return sqlite.prepare(sql).get(...values)??null;},async run(){const r=sqlite.prepare(sql).run(...values);return {meta:{changes:Number(r.changes)}};}};}};
 try{await checkRescueUnderLatency((path,options)=>handleRoomRequest(new Request('http://local'+path,options),{DB}));}finally{sqlite.close();}
});

test('the rescue circle accepts its visible edge; final swarm clear waits for revival and expiry states its cause',()=>{
 const r=A.createRun(A.createMeta(),'spark',127);A.addPartner(r,'human');A.controlledFall(r);r.partner.x=r.player.x+A.REVIVE_RADIUS;r.partner.y=r.player.y;assert.equal(A.reviveState(r,r.partner).inRange,true);A.stepRun(r,{partner:{interact:true}},1/60);assert.ok(r.player.revive>0);r.partner.x+=1;A.stepRun(r,{partner:{interact:true}},1/60);assert.equal(r.player.revive,0);assert.equal(A.reviveState(r,r.partner).inRange,false);
 r.room='glass';r.spawnTotal=r.spawned=18;r.roomKills=18;r.player.downedFor=15;r.partner.x=r.player.x+60;r.enemies=[];r.shots=[];A.stepRun(r,{},1/60);assert.equal(r.phase,'playing');assert.ok(!r.cleared.includes('glass'));
 for(let i=0;i<110;i++)A.stepRun(r,{partner:{interact:true}},1/60);assert.ok(r.player.hp>0);assert.equal(r.phase,'resolve');assert.ok(r.cleared.includes('glass'));
 const expired=A.createRun(A.createMeta(),'spark',128);A.addPartner(expired,'human');A.controlledFall(expired,true);expired.partner.downedFor=.01;A.stepRun(expired,{},1/60);assert.equal(expired.phase,'dead');assert.equal(expired.endReason,'rescue-expired');assert.ok(expired.player.hp>0);const view=ui({version:2,meta:A.createMeta(),run:expired});assert.match(view.el('game-overlay').innerHTML,/shared life ends even if your partner is still standing/);
 const both=A.createRun(A.createMeta(),'spark',129);A.addPartner(both,'human');A.controlledFall(both);both.partner.iframes=0;both.shots=[{id:++both.serial,x:both.partner.x,y:both.partner.y,vx:0,vy:0,damage:9999,enemy:true,r:6,life:1,color:'#71e5e4'}];A.stepRun(both,{},1/60);assert.equal(both.phase,'dead');assert.equal(both.endReason,'both-fallen');
});

test('a quiet fall cannot be triggered solo, mid-swarm or with hostile shots; pact survives navigation and reload',()=>{
 const r=A.createRun(A.createMeta(),'spark',127);assert.throws(()=>A.controlledFall(r),/quiet/);A.addPartner(r,'human');r.room='glass';assert.throws(()=>A.controlledFall(r),/quiet/);r.cleared.push('glass');r.shots=[{enemy:true,life:1}];assert.throws(()=>A.controlledFall(r),/quiet/);
 const v=ui(null,{entry:true});v.window.SparkDescent.selectProfile('pc');v.window.SparkDescent.swarmPact(true);v.run("enterDescent();returnToStart();chooseProfile('pc');enterDescent('join');$('online-dialog').close();returnToStart()");assert.equal(v.el('entry-pact').checked,true);const restored=ui(null,{entry:true,deviceStorage:v.storage});restored.window.SparkDescent.selectProfile('pc');assert.equal(restored.el('entry-pact').checked,true);restored.window.SparkDescent.enter();restored.window.SparkDescent.start('spark');assert.equal(restored.window.SparkDescent.observe().swarmPact,true);
});

test('walking both keyboard fighters into each other keeps visible body spacing, and full-meter tap supers work for both maps',()=>{
 const v=ui(null,{entry:true});v.window.SparkDescent.selectProfile('pc');v.window.SparkDuel.start({forms:['spark','human'],bot:false});v.key('d');v.key('arrowleft');for(let i=0;i<180;i++){v.run('duel.tick(1/60)');const f=v.window.SparkDuel.observe().fighters;assert.ok(Math.abs(f[0].x-f[1].x)>=D.DUEL_CONTACT);}v.listeners.get('keyup').fn({key:'d'});v.listeners.get('keyup').fn({key:'arrowleft'});
 for(const [player,key]of [[0,'t'],[1,'p']]){v.run(`duel.match.fighters.forEach(f=>{f.attack=null;f.stun=0;f.previous={}});duel.match.cinematic=0;duel.match.freeze=0;duel.match.fighters[${player}].meter=100`);v.key(key);v.listeners.get('keyup').fn({key});v.run('duel.tick(1/60)');assert.equal(v.window.SparkDuel.observe().fighters[player].meter,0);assert.equal(v.window.SparkDuel.observe().fighters[player].stats.supers,1);}
 assert.match(v.el('duel-instructions').textContent,/100 \/ 100/);
 for(const x of [45,480,915]){const m=D.createDuel();m.fighters.forEach(f=>f.x=x);m.freeze=2;D.stepDuel(m);assert.ok(Math.abs(m.fighters[0].x-m.fighters[1].x)>=D.DUEL_CONTACT);}
});
