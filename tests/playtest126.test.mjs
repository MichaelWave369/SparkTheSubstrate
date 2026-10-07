import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as A from '../public/action-engine.js';
import * as K from '../public/substrate-rewards.js';
import * as D from '../public/duel-engine.js';
import {OnlineRoom} from '../public/online.js';
import {ProgressSave} from '../public/progress.js';
import {ui} from './ui-harness.mjs';

const advance=(r,n,input={})=>{for(let i=0;i<n;i++)A.stepRun(r,input,1/60);};
const lethal=(r,actor)=>{actor.hp=1;actor.iframes=0;r.shots=[{id:++r.serial,x:actor.x,y:actor.y,vx:0,vy:0,damage:100,enemy:true,r:6,life:1,color:'#71e5e4'}];A.stepRun(r,{},1/60);};

test('damage-caused downed state has a bounded rescue window; solo and a double fall end the life',()=>{
 const r=A.createRun(A.createMeta(),'spark',126);A.addPartner(r,'tree');r.boons.regeneration=3;lethal(r,r.player);
 assert.equal(r.player.hp,0);assert.equal(r.phase,'playing');assert.equal(r.player.downedFor,30);assert.ok(A.validRun(r));
 advance(r,60);assert.equal(r.player.hp,0);assert.ok(r.player.downedFor<30);r.player.downedFor=.01;advance(r,1);assert.equal(r.phase,'dead');assert.match(r.notice,/window closed/);
 const solo=A.createRun(A.createMeta(),'spark',127);lethal(solo,solo.player);assert.equal(solo.phase,'dead');
 const both=A.createRun(A.createMeta(),'spark',128);A.addPartner(both,'human');lethal(both,both.player);both.partner.iframes=0;lethal(both,both.partner);assert.equal(both.phase,'dead');
});

test('gates accept both sparks at 110px, spawn inside, prevent immediate bounce, and recover once per new co-op chamber',()=>{
 const r=A.createRun(A.createMeta(),'spark',126);A.addPartner(r,'human');const gate=A.exitPosition('north');Object.assign(r.player,{x:gate.x-20,y:gate.y+110,hp:10});Object.assign(r.partner,{x:gate.x+20,y:gate.y+110,hp:14});
 assert.equal(A.gateEntryStatus(r,'north').available,true);A.enterGate(r,'north');assert.ok(r.player.hp>10);assert.ok(r.partner.hp>14);assert.match(r.notice,/Passage recovery.*P1.*P2/);
 assert.ok([r.player,r.partner].every(p=>Math.hypot(p.x-480,p.y-569)>120));r.cleared.push('glass');Object.assign(r.player,A.exitPosition('south'));Object.assign(r.partner,A.exitPosition('south'));assert.throws(()=>A.enterGate(r,'south'),/Arrival grace/);
 advance(r,46);A.enterGate(r,'south');advance(r,46);Object.assign(r.player,A.exitPosition('north'));Object.assign(r.partner,A.exitPosition('north'));const hp=r.player.hp;A.enterGate(r,'north');assert.equal(r.player.hp,hp,'re-entering cannot farm passage recovery');
});

test('Vault purchases deduct the displayed cost even for known cards; zero coins is visibly unaffordable',()=>{
 for(const duplicate of [false,true]){const state=K.cleanKeepsakes(null);state.coins=5;if(duplicate)state.cards.push('buried-circuit');const result=K.breakVaultSeal(state,'pulse-boon');assert.equal(state.coins,0);assert.equal(result.card.coins,0);assert.equal(result.card.duplicate,duplicate);assert.ok(state.cards.includes('buried-circuit'));}
 const view=ui(null,{entry:true});view.window.SparkDescent.selectProfile('pc');view.run("act('vault')");assert.match(view.el('vault-alcoves').innerHTML,/unaffordable/);assert.match(view.el('vault-alcoves').innerHTML,/Not enough coins/);assert.match(fs.readFileSync(new URL('../public/descent.css',import.meta.url),'utf8'),/\.vault-alcove\.unaffordable\{opacity:\.45/);
 assert.throws(()=>K.breakVaultSeal(K.cleanKeepsakes(null),'surge'),/needs.*coins/);
});

test('meeting unlocks enemy fighters while their Vault cards explain that the remaining seal buys a memory',()=>{
 const state=K.cleanKeepsakes(null);assert.equal(K.fighterAvailable(state,'collector'),false);K.rememberEncounter(state,{enemies:['collector','archon']});assert.equal(K.fighterAvailable(state,'collector'),true);assert.equal(K.hasAlcove(state,'collector'),false);
 const view=ui(null,{entry:true,keepsakes:state});view.window.SparkDescent.selectProfile('pc');view.run('keepsakes.coins=20;act("vault")');assert.match(view.el('vault-alcoves').innerHTML,/Fighter ready · reveal memory/);
});

test('short Super taps survive a render boundary and result statistics include the successful super',()=>{
 const view=ui(null,{entry:true});view.window.SparkDescent.selectProfile('pc');view.window.SparkDuel.start({forms:['human','spark']});view.run('duel.match.fighters[0].meter=100');
 view.key('t');view.listeners.get('keyup').fn({key:'t'});view.run('duel.tick(.005)');assert.equal(view.window.SparkDuel.observe().fighters[0].meter,100);view.run('duel.tick(.02)');
 assert.equal(view.window.SparkDuel.observe().fighters[0].meter,0);assert.equal(view.window.SparkDuel.observe().fighters[0].stats.supers,1);
 view.run("duel.match.phase='finished';duel.match.winner=0;duel.match.fighters[0].rounds=2;duel.render(true)");assert.match(view.el('duel-overlay').innerHTML,/1 powers \(1 supers\)/);
});

test('grounded fighters cannot merge at center or a corner, and retain hittable close attacks',()=>{
 for(const x of [45,480,915]){const m=D.createDuel({forms:['human','spark']});m.fighters.forEach(f=>f.x=x);D.stepDuel(m,[{},{}]);assert.ok(Math.abs(m.fighters[0].x-m.fighters[1].x)>=88);D.stepDuel(m,[{light:true},{}]);D.stepDuel(m,[{},{}],10);assert.ok(m.fighters[1].hp<100);}
});

test('slow foreground frames preserve Endless and Duel elapsed time; paused time is excluded',()=>{
 let now=0;const view=ui(null,{entry:true,now:()=>now});view.window.SparkDescent.selectProfile('pc');view.window.SparkDungeon.start('spark');view.run("run.room='machine';run.spawnClock=60;previous=0");
 for(let i=0;i<40;i++){now+=250;view.run(`animate(${now})`);}assert.ok(Math.abs(view.run('run.time')-10)<1/60);view.run("paused=true");now+=1000;view.run(`animate(${now})`);assert.ok(Math.abs(view.run('run.time')-10)<1/60);
 view.run('paused=false;returnToStart()');view.window.SparkDuel.start({forms:['human','spark']});for(let i=0;i<40;i++)view.run('duel.tick(.25)');assert.ok(Math.abs(view.window.SparkDuel.observe().clock-50)<1/60);
});

test('room-entry render does not pay duplicate cards, while an actual new clear does',()=>{
 const meta=A.createMeta(),r=A.createRun(meta,'spark',126);r.room='glass';r.cleared.push('glass');const state=K.cleanKeepsakes(null);state.cards.push('first-player');
 const view=ui({version:2,meta,run:r},{keepsakes:state});view.run('renderRail();syncKeepsakes()');assert.equal(view.run('keepsakes.coins'),0);assert.equal(view.run('keepsakeBanner'),null);
 view.run("run.cleared=['threshold'];run.phase='playing';run.spawnTotal=run.spawned=0;run.enemies=[];stepRun(run,{},1/60);changed()");assert.equal(view.run('keepsakes.coins'),4);assert.match(view.run('keepsakeBanner.title'),/Remembered again/);
});

test('inactive canvases are hidden and inert; two same-device co-op profiles leave the original campaign key intact',()=>{
 const meta=A.createMeta(),saved={version:2,meta,run:null},device=new Map([['spark-substrate-descent-v2',JSON.stringify(saved)]]),host=ui(null,{entry:true,deviceStorage:device}),guest=ui(null,{entry:true,deviceStorage:device});
 for(const [view,role]of [[host,'host'],[guest,'guest']]){view.window.SparkDescent.selectProfile('pc');view.run(`online.session={code:'ABCDEFGH',role:'${role}',token:'test'};campaignEntered=true;entryMode='descent';activateCoopSave();meta.essence=${role==='host'?17:29};save();renderStart()`);assert.equal(view.el('duel-canvas').hidden,true);assert.equal(view.el('duel-canvas').tabIndex,-1);assert.equal(view.el('duel-root').inert,true);}
 assert.equal(device.get('spark-substrate-descent-v2'),JSON.stringify(saved));assert.equal(JSON.parse(device.get('spark-substrate-descent-v2:coop:ABCDEFGH:host')).meta.essence,17);assert.equal(JSON.parse(device.get('spark-substrate-descent-v2:coop:ABCDEFGH:guest')).meta.essence,29);assert.notEqual(host.run('CREDENTIAL_KEY'),guest.run('CREDENTIAL_KEY'));
 guest.run("online.session=null;switchSaveProfile('solo')");assert.equal(guest.window.SparkDescent.observe().essence,0);assert.equal(guest.el('spark-save-profile').value,'solo');
 assert.match(fs.readFileSync(new URL('../public/descent.css',import.meta.url),'utf8'),/\[hidden\]\{display:none!important\}/);
});

test('separate progress credentials let same-device profiles flush without sharing revisions',async()=>{
 const device=new Map(),store={getItem:k=>device.get(k)??null,setItem:(k,v)=>device.set(k,v)};let count=0;const revisions=new Map();
 const fetch=async(path,options={})=>{if(options.method==='POST'){const id='00000000-0000-4000-8000-'+String(++count).padStart(12,'0');revisions.set(id,1);return Response.json({id,token:'secret'+count,revision:1,state:JSON.parse(options.body).state});}const id=path.split('/').at(-1),body=JSON.parse(options.body);assert.equal(body.revision,revisions.get(id));revisions.set(id,body.revision+1);return Response.json({revision:body.revision+1});};
 const a=new ProgressSave({storage:store,fetch,credentialKey:'host:credential'}),b=new ProgressSave({storage:store,fetch,credentialKey:'guest:credential'});const state={version:2,meta:A.createMeta(),run:null};try{await a.open(state);await b.open(state);a.queue({...state,meta:{...state.meta,essence:7}});b.queue({...state,meta:{...state.meta,essence:9}});await Promise.all([a.flush(),b.flush()]);assert.equal(a.status,'saved');assert.equal(b.status,'saved');assert.notEqual(a.credential.id,b.credential.id);}finally{a.dispose();b.dispose();}
});

test('an expired resume is quiet and an obsolete resume cannot overwrite a newly hosted room',async()=>{
 const storage={getItem:()=>JSON.stringify({code:'ABCDEFGH',role:'host',token:'old'}),removeItem(){},setItem(){}};let resolve,errors=[];const room=new OnlineRoom(()=>{},e=>errors.push(e),{storage,fetch:()=>new Promise(r=>resolve=r)});
 const resuming=room.resume();const fresh={code:'HGFEDCBA',role:'host',token:'fresh'};room.session=fresh;resolve(Response.json({expired:true}));assert.equal(await resuming,false);assert.equal(room.session,fresh);assert.deepEqual(errors,[]);
 const expired=new OnlineRoom(()=>assert.fail('expired rooms must not apply a snapshot'),e=>errors.push(e),{storage,fetch:async()=>Response.json({expired:true})});assert.equal(await expired.resume(),false);assert.equal(expired.session,null);assert.deepEqual(errors,[]);
});
