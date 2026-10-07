import test from 'node:test';
import assert from 'node:assert/strict';
import {ui} from './ui-harness.mjs';
import {SETTINGS_KEY} from '../public/settings.js';
import {validRun} from '../public/action-engine.js';

const modes=['entry-begin','entry-daily','entry-dungeon','entry-duel','entry-host','entry-join'];
for(const profile of ['pc','controller','mobile'])test(profile+' enables every start mode and survives settings renders and reload',()=>{
 const view=ui(null,{entry:true,dom:true});
 for(const id of modes)assert.equal(view.document.getElementById(id)?.disabled,true,id+' waits for a profile');
 view.window.SparkDescent.selectProfile(profile);
 for(const id of modes)assert.equal(view.document.getElementById(id)?.disabled,false,id+' enabled');
 view.window.SparkDescent.setFireMode('manual');
 view.run("renderSettings();renderSettings();renderStart()");
 assert.ok(view.document.getElementById('fire-label'),'updating control hints preserves the fire label');
 assert.match(view.document.getElementById('fire-label').textContent,/fire/);
 const reloaded=ui(null,{entry:true,dom:true,preferences:JSON.parse(view.storage.get(SETTINGS_KEY))});
 for(const id of modes)assert.equal(reloaded.document.getElementById(id)?.disabled,false,id+' restored');
 assert.equal(reloaded.run('settings.inputProfile'),profile);
});

test('fire rendering tolerates absent optional controls without blocking profile selection',()=>{
 const view=ui(null,{entry:true,dom:true});
 for(const id of ['entry-fire-mode','setting-fire-mode','entry-fire-copy','settings-fire-copy','touch-fire','fire-label'])view.document.getElementById(id).remove();
 view.window.SparkDescent.selectProfile('pc');
 view.window.SparkDescent.setFireMode('manual');
 assert.equal(view.document.getElementById('entry-begin').disabled,false);
 assert.equal(view.document.getElementById('fire-label'),null,'missing elements stay missing');
});

test('Host room and Join room both open the existing co-op dialog at the relevant control',()=>{
 const host=ui(null,{entry:true,dom:true});host.window.SparkDescent.selectProfile('pc');
 const tools=[];host.document.modelContext={registerTool:tool=>tools.push(tool)};host.run('registerTools()');
 const enter=tools.find(tool=>tool.name==='enter_spark_mode');assert.ok(enter.inputSchema.properties.mode.enum.includes('host'));enter.execute({mode:'host'});
 assert.equal(host.el('online-dialog').open,true);
 assert.equal(host.document.activeElement.id,'online-host');
 assert.equal(host.run('run'),null,'opening host setup does not start a life');
 const join=ui(null,{entry:true,dom:true});join.window.SparkDescent.selectProfile('controller');
 join.run("act('entry-join')");
 assert.equal(join.el('online-dialog').open,true);
 assert.equal(join.document.activeElement.id,'online-code');
});

test('each input profile can enter Descent, Daily, Endless and Duel after selection',()=>{
 for(const profile of ['pc','controller','mobile'])for(const mode of ['descent','daily','dungeon','duel']){
  const view=ui(null,{entry:true});view.window.SparkDescent.selectProfile(profile);
  view.run("act('entry-"+mode+"')");
  if(mode==='daily'){assert.equal(view.el('daily-dialog').open,true);view.run("act('daily-start')");}
  else if(mode==='descent')view.window.SparkDescent.start('spark');
  else if(mode==='dungeon')view.window.SparkDungeon.start('spark');
  else {view.run("act('duel-start')");if(profile==='mobile')view.run("act('duel-ready')");}
  assert.equal(view.run('entryMode'),mode==='daily'?'descent':mode);
  if(mode==='duel')assert.equal(view.window.SparkDuel.observe().phase,'playing');
  else assert.equal(view.run('run.phase'),'playing');
 }
});

test('the start-page host flow creates a fresh shared life and displays the room code',async()=>{
 const view=ui(null,{entry:true});view.window.SparkDescent.selectProfile('pc');view.window.SparkDescent.setFireMode('manual');
 view.run("act('entry-host');online.host=async next=>{globalThis.hosted=structuredClone(next);online.session={role:'host',code:'ABCDEFGH',token:'test-only'};};online.sync=async()=>{}");
 await view.run("onlineAction('online-host')");
 assert.ok(validRun(view.run('hosted')));assert.equal(view.run('hosted.fireMode'),'manual');
 assert.equal(view.el('online-room-code').textContent,'ABCDEFGH');
 assert.equal(view.run('onlineWaiting'),true);assert.equal(view.el('online-dialog').open,false);
});
