import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {LEGACY_BUILDS,LEGACY_BY_ID,ARCADE_HOOK} from '../public/memory-arcade-manifest.js';
import {ARCADE_KEY,loadArcade,saveArcade,cleanArcade,discoverLegacy,completeLegacy,arcadeTokens,legacyStorageKey,cleanLegacyStore,loadLegacyStore,saveLegacyStore} from '../public/memory-arcade-state.js';
import {createSideJourney,enterSideRoom,SIDE_KEY} from '../public/sideways-engine.js';
import {ui} from './ui-harness.mjs';
import {legacyUI} from './legacy-harness.mjs';
const sha=data=>createHash('sha256').update(data).digest('hex');
const store=map=>({getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)});
function room(){const h=ui(null,{entry:true});h.run("chooseProfile('pc');act('entry-sideways');act('side-new')");h.window.SparkSideways.control({x:1},200);h.window.SparkSideways.control({interact:true},1);assert.equal(h.window.SparkMemoryArcade.observe().active,true);return h;}
function cabinet(h,id='echo-lives'){const b=LEGACY_BY_ID[id],at=h.window.SparkMemoryArcade.observe().player.x;h.window.SparkMemoryArcade.control({x:Math.sign(b.x-at)},Math.floor(Math.abs(b.x-at)/265*60));h.window.SparkMemoryArcade.control({interact:true},1);assert.equal(h.window.SparkMemoryArcade.observe().menu,'cabinet');}

test('seven authentic builds retain their exact Git-source hashes; the strange socket claims no history',()=>{
 assert.equal(LEGACY_BUILDS.length,7);assert.equal(ARCADE_HOOK.authenticity,'fictional-hook');assert.equal(ARCADE_HOOK.launch,null);
 for(const b of LEGACY_BUILDS){const base=new URL('../public/legacy/'+b.id+'/',import.meta.url),receipt=JSON.parse(fs.readFileSync(new URL('provenance.json',base),'utf8'));assert.equal(receipt.commit,b.commit);assert.equal(receipt.authenticity,'authentic');
  for(const source of receipt.sources)assert.equal(sha(fs.readFileSync(new URL(source.frozen,base))),source.sha256,source.file);
  const html=fs.readFileSync(new URL('index.html',base),'utf8');assert.equal(sha(html),receipt.htmlSha256);assert.equal(sha(fs.readFileSync(new URL('game.js',base))),receipt.bundleSha256);
  assert.match(html,/connect-src 'none'/);assert.match(html,/script-src 'sha256-/);assert.doesNotMatch(html,/<script[^>]+type="module"/);assert.doesNotMatch(html,/@import\s+url/);
 }
});
test('archive currency cannot grant current coins, essence, mastery, keys or seals; completion is one-time',()=>{
 const s=cleanArcade(null);assert.equal(completeLegacy(s,'echo-lives',{phase:'choice'}),false);assert.equal(completeLegacy(s,'echo-lives',{phase:'between'}),true);assert.equal(completeLegacy(s,'echo-lives',{phase:'between'}),false);assert.equal(arcadeTokens(s),1);assert.equal(s.trail,true);assert.equal(completeLegacy(s,'first-duel',{phase:'finished',winner:0}),false);assert.deepEqual(Object.keys(s).sort(),['completed','discovered','entered','trail','version','x']);
});
test('discovery requires the actual cleared room, proximity and Computer for the old fighter',()=>{
 const s=cleanArcade(null),journey=createSideJourney();assert.equal(discoverLegacy(s,'first-descent',journey),false);enterSideRoom(journey,'glass','');journey.player.x=1450;assert.equal(discoverLegacy(s,'first-descent',journey),false);journey.enemies.forEach(e=>e.hp=0);journey.cleared.push('glass');assert.equal(discoverLegacy(s,'first-descent',journey),true);assert.equal(discoverLegacy(s,'first-descent',journey),false);
 enterSideRoom(journey,'machine','');journey.player.x=480;journey.enemies.forEach(e=>e.hp=0);journey.cleared.push('machine');assert.equal(discoverLegacy(s,'first-duel',journey),false);journey.form='computer';assert.equal(discoverLegacy(s,'first-duel',journey),true);
});
test('the first endless terminal needs a cleared Cinder Regent and real floor contact',()=>{
 const state=cleanArcade(null),journey=createSideJourney();enterSideRoom(journey,'cinder-throne','');journey.player.x=450;
 assert.equal(discoverLegacy(state,'first-endless',journey),false);journey.cleared.push('cinder-throne');assert.equal(discoverLegacy(state,'first-endless',journey),false);
 journey.enemies.forEach(e=>e.hp=0);journey.player.y=450;assert.equal(discoverLegacy(state,'first-endless',journey),false);journey.player.y=620;
 assert.equal(discoverLegacy(state,'first-endless',journey),true);assert.equal(discoverLegacy(state,'first-endless',journey),false);
});
test('only five genuinely cleared historical dungeon floors count; an old four-token collection is retained',()=>{
 const state=cleanArcade({discovered:LEGACY_BUILDS.slice(0,4).map(b=>b.id),completed:LEGACY_BUILDS.slice(0,4).map(b=>b.id),trail:true,x:2180});
 assert.equal(arcadeTokens(state),4);assert.equal(state.trail,true);state.discovered.push('first-endless');
 for(const proof of [{mode:'dungeon',floor:5,floorsCleared:4},{mode:'descent',floor:5,floorsCleared:5},{mode:'dungeon',floorsCleared:Infinity},{mode:'dungeon',floorsCleared:5.5},{cleared:['glass']}])assert.equal(completeLegacy(state,'first-endless',proof),false);
 assert.equal(completeLegacy(state,'first-endless',{mode:'dungeon',floor:5,floorsCleared:5,phase:'resolve'}),true);assert.equal(arcadeTokens(state),5);
 assert.equal(completeLegacy(state,'first-endless',{mode:'dungeon',floorsCleared:6}),false);assert.equal(arcadeTokens(state),5);
});
test('a five-cabinet collection retains its old games and earns only the new native objectives',()=>{
 const oldIds=LEGACY_BUILDS.slice(0,5).map(b=>b.id),state=cleanArcade({discovered:oldIds,completed:oldIds,trail:false,x:2480});
 assert.deepEqual(state.completed,oldIds);assert.equal(arcadeTokens(state),5);assert.equal(state.trail,false);assert.equal(state.x,2480);
 state.discovered.push('first-forge','first-mastery');
 for(const proof of [{livesRemembered:0,enhancedItems:1},{livesRemembered:1,enhancedItems:0},{livesRemembered:Infinity,enhancedItems:1},{livesRemembered:1,enhancedItems:1.5}])assert.equal(completeLegacy(state,'first-forge',proof),false);
 assert.equal(completeLegacy(state,'first-forge',{livesRemembered:1,enhancedItems:1}),true);
 for(const proof of [{phase:'playing',rememberedSkills:0,activeSkills:1,powersUsed:1},{phase:'playing',rememberedSkills:1,activeSkills:0,powersUsed:1},{phase:'playing',rememberedSkills:1,activeSkills:1,powersUsed:0},{phase:'dead',rememberedSkills:1,activeSkills:1,powersUsed:1}])assert.equal(completeLegacy(state,'first-mastery',proof),false);
 const learned={phase:'playing',rememberedSkills:1,activeSkills:1,powersUsed:1};assert.equal(completeLegacy(state,'first-mastery',learned),true);assert.equal(arcadeTokens(state),7);
 assert.equal(completeLegacy(state,'first-mastery',learned),false);assert.equal(arcadeTokens(state),7);
});
test('new terminals require Cantor clear and Computer at the Dock without blocking existing services',()=>{
 const state=cleanArcade(null),s=createSideJourney();enterSideRoom(s,'forge','');s.player.x=420;
 assert.equal(discoverLegacy(state,'first-forge',s),false);s.enemies.forEach(e=>e.hp=0);s.cleared.push('forge');assert.equal(discoverLegacy(state,'first-forge',s),true);
 enterSideRoom(s,'orbit-rest','');s.player.x=1330;assert.equal(discoverLegacy(state,'first-mastery',s),false);s.form='computer';assert.equal(discoverLegacy(state,'first-mastery',s),true);
 for(const id of ['first-forge','first-mastery']){const d=LEGACY_BY_ID[id].discovery;assert.ok(d.x>100&&d.x<1400);assert.equal(discoverLegacy(state,id,s),false);}
});
test('original forge and mastery dialogs accept controller selection within the active dialog',()=>{
 for(const [id,action,dialogId]of [['first-forge','forge','forge'],['first-mastery','settings','settings-dialog']]){
  const h=legacyUI(id),button=h.document.querySelector('[data-action="'+action+'"]');assert.ok(button);button.click();const dialog=h.document.getElementById(dialogId);assert.equal(dialog.open,true);
  const close=dialog.querySelector('[data-action="close-dialog"]');assert.ok(close);close.focus();const buttons=Array.from({length:17},()=>({pressed:false,value:0}));buttons[0]={pressed:true,value:1};
  h.send('legacy-pad',{pad:{connected:true,mapping:'standard',axes:[0,0],buttons}});assert.equal(dialog.open,false);assert.equal(h.messages.some(m=>m.type==='legacy-error'),false);h.send('legacy-dispose');
 }
});
test('controller Start reaches original early pause and banking menus with one input bridge',()=>{
 for(const id of ['first-forge','first-mastery']){
  const h=legacyUI(id);h.window.SparkDescent.start('spark');
  const pad=index=>({connected:true,mapping:'standard',axes:[0,0],buttons:Array.from({length:17},(_,i)=>({pressed:i===index,value:i===index?1:0}))});
  h.send('legacy-pad',{pad:pad(9)});assert.throws(()=>h.window.SparkDescent.control({frames:1}),/not accepting/);
  h.send('legacy-pad',{pad:pad(-1)});const end=h.document.getElementById('game-overlay').querySelector('[data-action="end"]');assert.ok(end);end.focus();h.send('legacy-pad',{pad:pad(0)});assert.equal(h.document.getElementById('end-life').open,true);
  h.send('legacy-pad',{pad:pad(-1)});h.document.getElementById('end-life').querySelector('[data-action="end-confirm"]').focus();h.send('legacy-pad',{pad:pad(0)});assert.equal(h.window.SparkDescent.observe().phase,'dead');
  assert.equal(h.window.navigator.getGamepads().length,0,'Original poller must not apply the relayed input a second time');h.send('legacy-dispose');
 }
});
test('v0.9 opens its own dungeon, saves held input, and resumes paused through the old menu',()=>{
 const h=legacyUI('first-endless');assert.equal(h.window.SparkDescent.observe().entryMode,'dungeon');assert.equal(h.window.SparkDungeon.observe().phase,'select');
 h.window.SparkDungeon.start('computer');const initial=h.window.SparkDungeon.observe();assert.equal(initial.floor,1);assert.equal(initial.player.hp,initial.player.maxHp);
 h.send('legacy-key',{key:'d',on:true});h.send('legacy-pad',{pad:null});for(const time of [100,117,134]){const queue=[...h.frames.values()];h.frames.clear();for(const fn of queue)fn(time);}
 assert.ok(h.window.SparkDungeon.observe().player.x>initial.player.x);h.send('legacy-key',{key:'d',on:false});h.send('legacy-dispose');const remembered=h.storage();
 assert.ok(remembered['spark-substrate-endless-v1']);assert.equal(h.frames.size,0);assert.equal(h.timers.size,0);
 const reload=legacyUI('first-endless',remembered);assert.equal(reload.window.SparkDungeon.observe().floor,1);assert.equal(reload.window.SparkDescent.observe().paused,true);
 const buttons=Array.from({length:17},()=>({pressed:false,value:0}));buttons[0]={pressed:true,value:1};reload.send('legacy-pad',{pad:{connected:true,mapping:'standard',axes:[0,0],buttons}});
 assert.equal(reload.window.SparkDescent.observe().paused,false);assert.equal(reload.messages.some(m=>m.type==='legacy-error'),false);reload.send('legacy-dispose');
});
test('walking reaches the physical annex, freezes the modern clock, inspects a cabinet and returns to the same doorway',()=>{
 const h=room(),before=h.window.SparkSideways.observe(),campaign=h.storage.get('spark-substrate-descent-v2');assert.match(h.el('side-room-title').textContent,/Memory Arcade/);cabinet(h);assert.match(h.el('side-overlay').innerHTML,/AUTHENTIC LEGACY BUILD/);assert.match(h.el('side-overlay').innerHTML,/7986130/);assert.throws(()=>h.window.SparkMemoryArcade.play('first-duel'),/Approach/);
 h.run("act('arcade-resume')");h.window.SparkMemoryArcade.control({x:1},240);assert.equal(h.window.SparkSideways.observe().time,before.time);h.run("act('arcade-exit')");const after=h.window.SparkSideways.observe();assert.equal(after.room,'threshold');assert.equal(after.player.x,before.player.x);assert.equal(after.player.hp,before.player.hp);assert.equal(after.time,before.time);assert.equal(h.storage.get('spark-substrate-descent-v2'),campaign);assert.ok(h.storage.has(ARCADE_KEY));
});
test('legacy storage dictionaries never touch current save keys, reset and damaged data remain isolated',()=>{
 const map=new Map([[SIDE_KEY,'current-side'],['spark-substrate-descent-v2','current-campaign'],['spark-substrate-keepsakes-v12','current-vault']]),storage=store(map);
 saveLegacyStore(storage,'echo-lives',{'spark-substrate-descent-v2':'old-campaign','spark-substrate-keepsakes-v12':'old-vault'});assert.equal(map.get('spark-substrate-descent-v2'),'current-campaign');assert.equal(map.get('spark-substrate-keepsakes-v12'),'current-vault');assert.equal(loadLegacyStore(storage,'echo-lives')['spark-substrate-descent-v2'],'old-campaign');assert.deepEqual(Object.keys(loadLegacyStore(storage,'first-descent')),[]);
 storage.removeItem(legacyStorageKey('echo-lives'));assert.equal(map.get(SIDE_KEY),'current-side');map.set(legacyStorageKey('echo-lives'),'broken');assert.deepEqual(Object.keys(loadLegacyStore(storage,'echo-lives')),[]);assert.equal(cleanLegacyStore({bad:42}),null);assert.equal(cleanLegacyStore({bad:'x'.repeat(1_000_001)}),null);assert.throws(()=>legacyStorageKey('new-world'));
});
test('malformed archive state is repaired and a reload/new side life retain optional discoveries and tokens',()=>{
 const raw={discovered:['echo-lives','invented','first-duel','first-duel'],completed:['first-duel','first-sideways','invented'],trail:true,x:Infinity};const s=cleanArcade(raw);assert.deepEqual(s.completed,['first-duel']);assert.equal(s.x,125);
 const h=room();h.run("side.arcade.state.completed=['echo-lives'];side.arcade.state.trail=true;side.arcade.persist();act('arcade-exit');act('side-reset');act('side-new')");assert.equal(h.window.SparkMemoryArcade.observe().tokens,1);const reload=ui(null,{entry:true,deviceStorage:h.storage});assert.equal(reload.window.SparkMemoryArcade.observe().tokens,1);assert.ok(reload.storage.has(SIDE_KEY));
});
test('launch is opaque and lazy, rejects forged/stale messages, and rewards only an observed objective',()=>{
 const h=room();cabinet(h);const sideSave=h.storage.get(SIDE_KEY);assert.equal(h.el('arcade-frame-slot').innerHTML,'');h.window.SparkMemoryArcade.play('echo-lives');assert.match(h.el('arcade-frame-slot').innerHTML,/sandbox="allow-scripts"/);assert.doesNotMatch(h.el('arcade-frame-slot').innerHTML,/allow-same-origin/);assert.equal(h.el('side-root').inert,true);
 const frame=h.el('arcade-frame');frame.contentWindow={postMessage(){}};const receive=data=>h.listeners.get('window:message').fn({source:frame.contentWindow,data});const session=h.run('side.arcade.session');
 h.listeners.get('window:message').fn({source:{},data:{type:'legacy-observation',build:'echo-lives',session,proof:{phase:'between'}}});assert.equal(h.window.SparkMemoryArcade.observe().tokens,0);
 receive({type:'legacy-observation',build:'echo-lives',session:'wrong',proof:{phase:'between'}});assert.equal(h.window.SparkMemoryArcade.observe().tokens,0);
 receive({type:'legacy-observation',build:'echo-lives',session,proof:{phase:'between'}});assert.equal(h.window.SparkMemoryArcade.observe().tokens,1);assert.equal(h.storage.get(SIDE_KEY),sideSave);
 receive({type:'legacy-exit',build:'echo-lives',session,store:{old:'saved'},proof:{phase:'between'}});assert.equal(h.window.SparkMemoryArcade.observe().tokens,1);assert.equal(h.el('arcade-legacy-view').hidden,true);assert.equal(h.el('arcade-frame-slot').innerHTML,'');assert.equal(h.el('side-root').inert,false);assert.equal(h.run('side.arcade.frame'),null);
});
test('missing/crashed old body tears down the iframe and leaves a useful return path without a reward',()=>{
 const h=room();cabinet(h);h.window.SparkMemoryArcade.play('echo-lives');const frame=h.el('arcade-frame');frame.contentWindow={postMessage(){}};h.listeners.get('window:message').fn({source:frame.contentWindow,data:{type:'legacy-error',build:'echo-lives',session:h.run('side.arcade.session'),message:'Missing sprite'}});assert.equal(h.run('side.arcade.frame'),null);assert.equal(h.window.SparkMemoryArcade.observe().menu,'error');assert.match(h.el('side-overlay').innerHTML,/Missing sprite/);assert.equal(h.window.SparkMemoryArcade.observe().tokens,0);h.run("act('arcade-resume');act('arcade-exit')");assert.equal(h.window.SparkSideways.observe().room,'threshold');
});
test('controller and mobile use the same peaceful walk; cabinet touch labels match actual historical verbs',()=>{
 const h=room();h.run("chooseProfile('controller')");const b=Array.from({length:17},()=>({pressed:false,value:0}));h.window.navigator={getGamepads:()=>[{connected:true,mapping:'standard',axes:[.6,0],buttons:b}]};const at=h.window.SparkMemoryArcade.observe().player.x;h.run('side.tick(.1)');assert.ok(h.window.SparkMemoryArcade.observe().player.x>at);
 h.run("chooseProfile('mobile')");assert.equal(h.el('side-touch').hidden,false);h.run('side.touch.x=-1;side.tick(.1)');assert.ok(h.window.SparkMemoryArcade.observe().player.x<at);
 h.run("chooseProfile('pc')");cabinet(h);h.window.SparkMemoryArcade.play('echo-lives');assert.equal(h.el('arcade-touch-left').hidden,true);assert.equal(h.el('arcade-touch-jump').hidden,true);assert.equal(h.el('arcade-touch-primary').textContent,'CHOICE 1');assert.equal(h.el('arcade-touch-power').textContent,'CHOICE 3');assert.equal(h.el('arcade-touch').hidden,true);
});
test('the endless touch shell exposes the original power, dash and all three gift keys',()=>{
 const h=room();h.run("side.arcade.state.discovered.push('first-endless');side.arcade.persist();chooseProfile('mobile')");cabinet(h,'first-endless');h.window.SparkMemoryArcade.play('first-endless');
 assert.equal(h.el('arcade-touch').hidden,false);assert.equal(h.el('arcade-touch-jump').hidden,true);assert.equal(h.el('arcade-touch-power').textContent,'POWER');assert.equal(h.el('arcade-touch-choice3').hidden,false);
 const frame=h.el('arcade-frame'),packets=[];frame.contentWindow={postMessage:data=>packets.push(data)};
 h.el('arcade-touch-choice3').onpointerdown({preventDefault(){},pointerId:1});h.el('arcade-touch-choice3').onpointerup();assert.deepEqual(packets.map(p=>[p.key,p.on]),[['3',true],['3',false]]);
});
test('the mastery touch shell exposes F power separately from all three choices',()=>{
 const h=room();h.run("side.arcade.state.discovered.push('first-mastery');side.arcade.persist();chooseProfile('mobile')");cabinet(h,'first-mastery');h.window.SparkMemoryArcade.play('first-mastery');
 assert.equal(h.el('arcade-touch-choice3').hidden,false);assert.equal(h.el('arcade-touch-choice3').textContent,'CHOICE 3');assert.equal(h.el('arcade-touch-power').textContent,'POWER');assert.equal(h.el('arcade-touch-jump').hidden,true);
 assert.equal(LEGACY_BY_ID['first-mastery'].keys.power,'f');assert.equal(LEGACY_BY_ID['first-mastery'].keys.choice3,'3');
});
test('successive launches create one frame, stale messages cannot complete the next body, reset affects only its dictionary',()=>{
 const h=room();cabinet(h);h.window.SparkMemoryArcade.play('echo-lives');const old=h.el('arcade-frame'),session=h.run('side.arcade.session');old.contentWindow={postMessage(){}};
 h.listeners.get('window:message').fn({source:old.contentWindow,data:{type:'legacy-exit',build:'echo-lives',session,store:{old:'memory'},proof:{phase:'choice'}}});h.window.SparkMemoryArcade.play('echo-lives');const fresh=h.el('arcade-frame');fresh.contentWindow={postMessage(){}};assert.notEqual(fresh,old);
 h.listeners.get('window:message').fn({source:old.contentWindow,data:{type:'legacy-observation',build:'echo-lives',session,proof:{phase:'between'}}});assert.equal(h.window.SparkMemoryArcade.observe().tokens,0);
 h.run('side.arcade.teardown()');h.run("act('arcade-reset',{build:'echo-lives'});act('arcade-reset-confirm')");assert.equal(h.storage.has(legacyStorageKey('echo-lives')),false);assert.ok(h.storage.has(SIDE_KEY));assert.ok(h.storage.has(ARCADE_KEY));
});
test('a held mobile key survives null-pad relay ticks and disposal releases historical input',()=>{
 const h=legacyUI('first-descent');const api=h.window.SparkDescent;api.start(api.observe().offeredForms[0]);h.send('legacy-key',{key:'d',on:true});h.send('legacy-pad',{pad:null});
 const x=api.observe().player.x;for(const time of [100,117,134]){const queue=[...h.frames.values()];h.frames.clear();for(const fn of queue)fn(time);}assert.ok(api.observe().player.x>x);h.send('legacy-key',{key:'d',on:false});h.send('legacy-dispose');assert.equal(h.frames.size,0);
});
test('corrupt isolated old saves fall back safely; old tools never register over the current document',()=>{
 for(const b of LEGACY_BUILDS){const h=legacyUI(b.id,{'spark-substrate-descent-v2':'corrupt','spark-substrate-sideways-v1':'corrupt','spark-substrate-v1':'corrupt'});assert.equal(h.messages.filter(m=>m.type==='legacy-error').length,0,JSON.stringify(h.messages));assert.equal(h.document.modelContext,undefined);h.send('legacy-dispose');}
});
test('unavailable current saving refuses an archive launch gracefully instead of breaking the game loop',()=>{
 const h=ui(null,{entry:true});h.run("chooseProfile('pc');act('entry-sideways');act('side-new')");h.window.SparkSideways.control({x:1},200);h.run("side.storage.setItem=()=>{throw Error('full')} ");assert.doesNotThrow(()=>h.window.SparkSideways.control({interact:true},1));assert.equal(h.window.SparkMemoryArcade.observe().active,false);assert.match(h.el('side-notice').textContent,/Remember the current journey/);assert.equal(h.window.SparkSideways.observe().station,null);
});
for(const b of LEGACY_BUILDS)test('actual frozen '+b.title+' bundle boots with the storage bridge and has no shell error',()=>{
 const h=legacyUI(b.id);assert.ok(h.messages.some(m=>m.type==='legacy-booted'),JSON.stringify(h.messages));assert.equal(h.messages.some(m=>m.type==='legacy-error'),false,JSON.stringify(h.messages));assert.ok(h.observe());assert.equal(h.run('localStorage===window.localStorage'),true);
 h.run("localStorage.setItem('spark-substrate-descent-v2','only inside this body')");assert.equal(h.storage()['spark-substrate-descent-v2'],'only inside this body');h.send('legacy-dispose');assert.ok(h.messages.some(m=>m.type==='legacy-exit'));assert.equal(h.frames.size,0);assert.equal(h.timers.size,0);
});
