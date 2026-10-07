import {ROUTE_RELICS,EASTER_EGGS} from '../public/world-expansion.js';
import {LEGACY_BUILDS} from '../public/memory-arcade-manifest.js';
import {createBossRematch} from '../public/boss-rematch.js';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {createRun,createMeta,createDailyRun,addPartner,stepRun,travelWorld,equipRunItem,morphRun,enterGate,exitPosition,ROOMS} from '../public/action-engine.js';
import {createDungeon} from '../public/dungeon.js';
import {learnSkill} from '../public/mastery.js';
import {SEALS} from '../public/worlds.js';
import {KEYS} from '../public/exploration.js';
import {OnlineRoom} from '../public/online.js';
import {checkRescueUnderLatency} from '../tests/co-op-rescue.mjs';
import {checkLiveCoop,checkResumedCoop,checkCoopPolish,checkDelayedCoop,checkLethalRevive,checkVoteBehindSnapshot} from '../tests/co-op-flow.mjs';

const require=createRequire(path.join(fs.realpathSync('node_modules/wrangler'),'package.json'));
const {Miniflare}=await import(pathToFileURL(require.resolve('miniflare')).href);
const root=path.resolve('dist/server');
const files=fs.readdirSync(root,{recursive:true}).filter(file=>/\.m?js$/.test(file)&&file!=='index.js');
const modules=['index.js',...files].map(file=>({type:'ESModule',path:path.join(root,file)}));
const runtime=new Miniflare({modules,modulesRoot:root,compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:{DB:'spark-artifact-test'},cf:false,assets:{directory:path.resolve('dist/client'),routerConfig:{has_user_worker:true}}});

try{
 const database=await runtime.getD1Database('DB');
 for(const file of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())await database.exec(fs.readFileSync('drizzle/'+file,'utf8').replace(/\n/g,' '));
 const home=await runtime.dispatchFetch('http://local/');
 assert.equal(home.status,200);assert.match(home.headers.get('cache-control'),/no-cache/);
 const homeText=await home.text();assert.match(homeText,/Online co-op/);assert.match(homeText,/Skill trees/);assert.match(homeText,/id="start-screen"/);assert.match(homeText,/id="duel-root"/);assert.match(homeText,/v0.17.0/);assert.match(homeText,/src="descent.js\?v=0.17.0"/);
 for(const asset of ['descent.js','action-engine.js','online.js','story.js','enemies.webp','floors.webp','echo-lives.html','equipment.js','progress.js','coop-state.js','equipment.webp','enemies-v4.webp','floors-v4.webp','exploration.js','floors-v5.webp','props-v5.webp','worlds.js','world-story.js','world-floors-v6.webp','world-bosses-v6.webp','equipment-v6.webp','mastery.js','run-record.js','settings.js','share-run.js','entry.js','combat-view.js','duel-engine.js','duel-view.js','sideways-engine.js','sideways-view.js','sideways-build.js','sideways-brawler.js','sideways-scenery.js','memory-arcade.js','memory-arcade-state.js','memory-arcade-manifest.js','memory-arcade.css','dungeon.js','world-expansion.js','room-layouts.js','boss-rematch.js','spark-poster-v1.png','substrate-rewards.js','table-engine.js','duel-fighters-v12.webp','duel-strikes-v128.webp','duel-kicks-v128.webp','duel-stages-v128.webp']){
  const response=await runtime.dispatchFetch('http://local/'+asset);
  assert.equal(response.status,200,asset);
  if(asset.endsWith('.js'))assert.match(response.headers.get('content-type'),/javascript|ecmascript/,asset);
  assert.ok((await response.arrayBuffer()).byteLength>0,asset+' is empty');
 }
 for(const build of LEGACY_BUILDS){
  const htmlResponse=await runtime.dispatchFetch('http://local'+build.launch);assert.equal(htmlResponse.status,200,build.title);assert.match(htmlResponse.headers.get('content-type'),/html/);assert.match(htmlResponse.headers.get('cache-control'),/no-cache/);assert.equal(htmlResponse.headers.get('referrer-policy'),'no-referrer');
  const shell=await htmlResponse.text();assert.match(shell,/Content-Security-Policy/);assert.match(shell,/connect-src 'none'/);assert.match(shell,/id="legacy-program"/);assert.match(shell,new RegExp(build.id));
  const receiptResponse=await runtime.dispatchFetch('http://local/legacy/'+build.id+'/provenance.json');assert.equal(receiptResponse.status,200);const receipt=await receiptResponse.json();assert.equal(receipt.commit,build.commit);assert.equal(receipt.authenticity,'authentic');
  for(const source of receipt.sources){const relative=source.frozen;if(!/\.(webp|png|svg)$/.test(relative))continue;const asset=await runtime.dispatchFetch('http://local/legacy/'+build.id+'/'+relative);assert.equal(asset.status,200,relative);assert.match(asset.headers.get('content-type'),/image/,relative);}
 }
 const versioned=await runtime.dispatchFetch('http://local/descent.js?v=0.17.0');assert.equal(versioned.status,200);assert.match(versioned.headers.get('cache-control'),/no-cache/);
 const versionedSource=await versioned.text();assert.match(versionedSource,/online.js\?v=0.17.0/);assert.match(versionedSource,/version:'0.17.0'/);
 const modulesToCheck=new Map([['descent.js',versionedSource]]),checked=new Set();
 while(checked.size<modulesToCheck.size){for(const [file,source]of modulesToCheck){if(checked.has(file))continue;checked.add(file);for(const [,relative,version]of source.matchAll(/from ['"]\.\/([^'"]+\.js)(?:\?v=([^'"]+))?['"]/g)){assert.equal(version,'0.17.0',file+' imports a stale module');if(modulesToCheck.has(relative))continue;const response=await runtime.dispatchFetch('http://local/'+relative+'?v='+version);assert.equal(response.status,200,relative);modulesToCheck.set(relative,await response.text());}}}
 const uiFetch=(input,options)=>runtime.dispatchFetch('http://local'+input,options);let pair;
 try{pair=await checkLiveCoop(uiFetch);await checkCoopPolish(pair);await checkLethalRevive(pair);await checkRescueUnderLatency(uiFetch);await checkVoteBehindSnapshot(pair);await checkDelayedCoop(pair);pair=await checkResumedCoop(pair,uiFetch);}finally{if(pair){await pair.guest.run('online.leave()');await pair.host.run('online.leave()');}}
 // Exercise OnlineRoom's default transport, including the browser receiver
 // contract, against the built Worker rather than an injected fetch callback.
 const nativeFetch=globalThis.fetch;
 let clientHostData,clientHost,clientGuest;
 const clientRun=createRun(createMeta(),'spark',127);
 try{
  globalThis.fetch=function(input,options){
   if(typeof input==='string'&&input.startsWith('/api/rooms')){assert.equal(this,globalThis,'Browser fetch requires its global receiver.');return runtime.dispatchFetch('http://local'+input,options);}
   return nativeFetch.call(globalThis,input,options);
  };
  // Leave real sync timing to the existing tests while these clients step
  // each network exchange, using the constructor's default fetch binding.
  clientHost=new OnlineRoom(data=>{clientHostData=data;},assert.fail);clientGuest=new OnlineRoom(()=>{},assert.fail);
  clientHost.start=clientGuest.start=()=>{};clientHost.setSource(()=>({run:clientRun,paused:false,waiting:false}));
  await clientHost.host(clientRun);assert.match(clientHost.code,/^[A-Z2-9]{8}$/);
  await clientGuest.join(clientHost.code,'animal');clientGuest.input({x:.25,y:0,fire:true,fireMode:'manual'});
  await clientGuest.sync();await clientHost.sync();
  assert.equal(clientHostData.guestOnline,true);assert.equal(clientHostData.guestForm,'animal');assert.equal(clientHostData.input.fire,true);
  await clientHost.request('/'+clientHost.code+'/resume');
  await clientGuest.leave();await clientHost.leave();assert.equal(clientHost.active,false);
 }finally{clientHost?.stop();clientGuest?.stop();globalThis.fetch=nativeFetch;}

 const send=(route,body,token)=>runtime.dispatchFetch('http://local/api/rooms'+route,{method:'POST',headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});
 const rejectedDungeon=await send('',{run:createDungeon('spark',126)});assert.equal(rejectedDungeon.status,400);
 const run=createRun(createMeta(),'spark',126);
 const response=await send('',{run});
 assert.equal(response.status,201,await response.clone().text());
 const host=await response.json();
 const joined=await send('/'+host.code+'/join',{form:'tree'});
 assert.equal(joined.status,201,await joined.clone().text());
 const guest=await joined.json();
 const input=await send('/'+host.code+'/sync',{seq:1,input:{x:.5,y:0,dash:true}},guest.token);
 assert.equal(input.status,200);
 assert.equal((await input.json()).input.x,.5);
 const shared=await send('/'+host.code+'/sync',{seq:1,run,waiting:false,paused:false},host.token);
 assert.equal(shared.status,200);
 const room=await shared.json();
 assert.equal(room.guestOnline,true);
 assert.equal(room.run.seed,126);
 assert.equal(room.input.dash,true);

 run.abilities.push('morph');
 addPartner(run,'tree');
 const morphRequest=await send('/'+host.code+'/sync',{seq:2,input:{x:0,y:0,morph:'rock'}},guest.token);
 assert.equal(morphRequest.status,200);
 const relay=(await morphRequest.json()).input;
 assert.equal(relay.morph,'rock');
 stepRun(run,{partner:relay},1/60);
 assert.equal(run.partnerForm,'rock');
 const powerRequest=await send('/'+host.code+'/sync',{seq:3,input:{x:0,y:0,power:true}},guest.token);
 assert.equal(powerRequest.status,200);
 const powerRelay=(await powerRequest.json()).input;
 assert.equal(powerRelay.power,true);
 stepRun(run,{partner:powerRelay},1/60);
 assert.ok(run.partner.guardTime>3.9);
 assert.ok(run.partner.powerCooldown>10.9);
 const invalidPower=await send('/'+host.code+'/sync',{seq:4,input:{power:'yes'}},guest.token);
 assert.equal(invalidPower.status,400);
 const fireRequest=await send('/'+host.code+'/sync',{seq:4,input:{x:0,y:0,fire:true,fireMode:'manual'}},guest.token);
 assert.equal(fireRequest.status,200);const fireRelay=(await fireRequest.json()).input;assert.equal(fireRelay.fire,true);assert.equal(fireRelay.fireMode,'manual');
 const invalidFire=await send('/'+host.code+'/sync',{seq:5,input:{fire:'yes',fireMode:'manual'}},guest.token);assert.equal(invalidFire.status,400);
 const invalidFireMode=await send('/'+host.code+'/sync',{seq:5,input:{fireMode:'turbo'}},guest.token);assert.equal(invalidFireMode.status,400);
 const morphed=await send('/'+host.code+'/sync',{seq:2,run,waiting:false,paused:false},host.token);
 assert.equal(morphed.status,200);
 const sharedPower=(await morphed.json()).run;
 assert.equal(sharedPower.partnerForm,'rock');
 assert.equal(sharedPower.partner.guardTime,run.partner.guardTime);
 assert.equal(sharedPower.partner.powerCooldown,run.partner.powerCooldown);

 // Integration fixtures establish advanced progress; check-campaign exercises earning it.
 let meta=createMeta();
 for(const [form,branch]of [['human','solace'],['rock','bulwark'],['computer','clock']]){meta.training[form].xp=100;meta=learnSkill(learnSkill(meta,form,branch+'-1'),form,branch+'-2');}
 meta.keys=Object.keys(KEYS);
 meta.seals=[...SEALS];meta.relics=Object.keys(ROUTE_RELICS);meta.secrets=Object.keys(EASTER_EGGS);meta.explored=Object.keys(ROOMS);
 meta.abilities=['morph'];
 meta.inventory.firstlight=2;
 meta.inventory.dawnshell=1;
 meta.inventory.bark=1;
 const finalRun=createRun(meta,'spark',246);
 addPartner(finalRun,'rock');
 travelWorld(finalRun,'uncreated');
 equipRunItem(finalRun,meta,'firstlight');
 equipRunItem(finalRun,meta,'dawnshell');
 morphRun(finalRun,'human');
 finalRun.room='origin-answer';finalRun.cleared.push('origin-answer');
 Object.assign(finalRun.player,exitPosition('west'),{gateGrace:0});
 assert.throws(()=>enterGate(finalRun,'west'),/Partner must be near/);
 assert.equal(finalRun.room,'origin-answer');
 Object.assign(finalRun.partner,exitPosition('west'));
 enterGate(finalRun,'west');
 stepRun(finalRun,{power:true,partner:{power:true}},1/60);
 assert.equal(finalRun.room,'origin-heart');
 assert.equal(finalRun.enemies[0].kind,'demiurge');
 assert.equal(finalRun.enemies[0].stage,1);
 assert.ok(finalRun.gear.regen>0);
 const finalShared=await send('/'+host.code+'/sync',{seq:3,run:finalRun,waiting:false,paused:false},host.token);
 assert.equal(finalShared.status,200,await finalShared.clone().text());
 const finalSnapshot=(await finalShared.json()).run;
 assert.equal(finalSnapshot.room,'origin-heart');
 assert.equal(finalSnapshot.equipmentLevels.firstlight,2);
 assert.deepEqual(finalSnapshot.seals,SEALS);assert.deepEqual(finalSnapshot.relics,Object.keys(ROUTE_RELICS));assert.deepEqual(finalSnapshot.secrets,Object.keys(EASTER_EGGS));
 assert.equal(finalSnapshot.enemies[0].stage,1);
 assert.deepEqual(finalSnapshot.training.rock.learned,['bulwark-1','bulwark-2']);
 assert.ok(finalSnapshot.partner.guardTime>5.9);
 const echoSync=await send('/'+host.code+'/sync',{seq:4,run:createBossRematch(meta,null,'forge'),waiting:false,paused:false},host.token);assert.equal(echoSync.status,400);
 const milestone=createRun(meta,'spark',248);milestone.room='eye';milestone.cleared.push('eye');milestone.phase='milestone';
 const sharedMilestone=await send('/'+host.code+'/sync',{seq:4,run:milestone,waiting:false,paused:false},host.token);
 assert.equal(sharedMilestone.status,200,await sharedMilestone.clone().text());assert.equal((await sharedMilestone.json()).run.phase,'milestone');
 assert.equal((await send('/'+host.code+'/leave',{},host.token)).status,200);

 run.phase='boon';
 run.choices=['edge','cadence','shell'];
 const state={version:2,meta:createMeta(),run};
 const createProfile=state=>runtime.dispatchFetch('http://local/api/progress',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({state})});
 const profileResponse=await createProfile(state);
 assert.equal(profileResponse.status,201,await profileResponse.clone().text());
 const profile=await profileResponse.json();
 const profileUrl='http://local/api/progress/'+profile.id;
 const readProfile=token=>runtime.dispatchFetch(profileUrl,{headers:{authorization:'Bearer '+token}});
 const read=await readProfile(profile.token);
 assert.equal(read.status,200);
 assert.deepEqual((await read.json()).state,state);
 const advancedState={version:2,meta,run:finalRun};
 const update={method:'PUT',headers:{'content-type':'application/json',authorization:'Bearer '+profile.token},body:JSON.stringify({revision:1,state:advancedState})};
 assert.equal((await runtime.dispatchFetch(profileUrl,update)).status,200);
 assert.equal((await runtime.dispatchFetch(profileUrl,update)).status,409);
 assert.equal((await readProfile('wrong')).status,403);
 const restored=(await (await readProfile(profile.token)).json()).state;
 assert.deepEqual(restored,advancedState);
 const echo=createBossRematch(meta,null,'forge');const rejectedEcho=await createProfile({version:2,meta,run:echo});assert.equal(rejectedEcho.status,400);
 const rejectedProfile=await createProfile({version:2,meta,run:createDungeon('spark',126)});assert.equal(rejectedProfile.status,400);
 const dailyState={version:2,meta,run:createDailyRun(new Date('2026-10-05T00:00:00Z'))};
 const dailyResponse=await createProfile(dailyState);assert.equal(dailyResponse.status,201,await dailyResponse.clone().text());const daily=await dailyResponse.json();
 const dailyRead=await runtime.dispatchFetch('http://local/api/progress/'+daily.id,{headers:{authorization:'Bearer '+daily.token}});assert.equal(dailyRead.status,200);assert.deepEqual((await dailyRead.json()).state,dailyState);

 const freshState={version:2,meta:createMeta(),run:null};
 const freshResponse=await createProfile(freshState);
 assert.equal(freshResponse.status,201);
 const fresh=await freshResponse.json();
 assert.notEqual(fresh.id,profile.id);
 assert.deepEqual(fresh.state,freshState);
 assert.equal((await readProfile(fresh.token)).status,403);
 assert.deepEqual((await (await readProfile(profile.token)).json()).state,advancedState);
 console.log('Worker artifact passed: versioned module graph and cache headers; two independent UI clients with live movement, both morphs, gate proximity, focus release, actual lethal-damage revival, stalled-snapshot guest votes and paused-room recovery against real D1; all game/world/mastery/settings/vault/card/Table assets and duel body art; default browser fetch binding; co-op creation, joins, powers and held-fire relay; specialties, guards, Eye milestone and final-world snapshots; all 126 room IDs and cross-world relic/discovery saves; reward-free rematches; durable training and daily state; isolated profiles; conflicting and unauthorized save protection.');
}finally{
 await runtime.dispose();
}
