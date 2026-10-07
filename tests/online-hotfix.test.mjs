import test from 'node:test';
import assert from 'node:assert/strict';
import {OnlineRoom} from '../public/online.js';
import {createMeta,createRun,offeredForms} from '../public/action-engine.js';
import {ui} from './ui-harness.mjs';

test('the default room transport keeps the browser receiver for every room request',async t=>{
 const calls=[];
 t.mock.method(globalThis,'fetch',function(path,options){
  if(this!==globalThis)throw new TypeError("Failed to execute 'fetch' on 'Window': Illegal invocation");
  calls.push({path,options});return Promise.resolve(new Response(JSON.stringify({code:'ABCDEFGH',role:'host',token:'test-only'}),{headers:{'content-type':'application/json'}}));
 });
 const room=new OnlineRoom(()=>{},assert.fail);room.start=()=>{};
 await room.host(createRun(createMeta(),'spark',831));
 for(const path of ['/ABCDEFGH/join','/ABCDEFGH/sync','/ABCDEFGH/resume'])await room.request(path,{seq:1});
 await room.leave();
 assert.deepEqual(calls.map(c=>c.path),['/api/rooms','/api/rooms/ABCDEFGH/join','/api/rooms/ABCDEFGH/sync','/api/rooms/ABCDEFGH/resume','/api/rooms/ABCDEFGH/leave']);
 assert.equal(calls[0].options.headers.authorization,undefined);
 for(const call of calls.slice(1))assert.equal(call.options.headers.authorization,'Bearer test-only');
});

function activeJourney(){const meta=createMeta(),run=createRun(meta,'spark',7919);run.room='archive';run.player.hp=61;return {version:2,meta,run};}
test('an unfinished solo life is explained before body selection and cannot be erased by leaving no room',async()=>{
 const view=ui(activeJourney(),{entry:true});view.window.SparkDescent.selectProfile('pc');
 const before=view.run('JSON.stringify(run)');view.run("act('entry-host')");
 assert.match(view.el('online-readiness').textContent,/life in progress/);
 assert.equal(view.el('online-host').disabled,true);assert.equal(view.el('online-join').disabled,true);assert.equal(view.el('online-form').disabled,true);
 assert.equal(view.el('online-leave').hidden,true);assert.equal(view.el('online-return').hidden,false);
 await view.run("onlineAction('online-leave')");assert.equal(view.run('JSON.stringify(run)'),before);
 const dialog=view.el('online-dialog'),onClose=dialog.handlers.get('close');dialog.close=()=>{dialog.open=false;};
 await view.run("onlineAction('online-return')");onClose();
 assert.equal(dialog.open,false);assert.equal(view.run('paused'),false);assert.equal(view.run('JSON.stringify(run)'),before);
});

test('room setup prefers Spark when offered and explains the legal fallback without changing karma',()=>{
 const fresh=ui(null,{entry:true});fresh.window.SparkDescent.selectProfile('pc');fresh.run("act('entry-host')");
 assert.equal(fresh.el('online-form').value,'spark');assert.equal(fresh.el('online-host').disabled,false);assert.equal(fresh.el('online-leave').hidden,true);
 fresh.el('online-form').value=Object.keys(fresh.run('BODIES')).find(id=>!offeredForms(createMeta()).includes(id));fresh.listeners.get('change').fn({target:fresh.el('online-form')});
 assert.equal(fresh.el('online-host').disabled,true);assert.equal(fresh.el('online-join').disabled,false);
 const meta=createMeta();meta.runs=4;const offers=offeredForms(meta),view=ui({version:2,meta,run:null},{entry:true});
 view.window.SparkDescent.selectProfile('pc');view.run("act('entry-host')");
 assert.equal(view.el('online-form').value,offers.includes('spark')?'spark':offers[0]);
 if(!offers.includes('spark'))assert.match(view.el('online-body-note').textContent,/Spark is outside/);
 assert.equal(view.run('meta.karma'),meta.karma);
 view.run("returnToStart();act('entry-join')");assert.equal(view.el('online-form').value,'spark');
});

test('setup failures stay in the dialog, reenable its controls, and never start a life',async()=>{
 const view=ui(null,{entry:true});view.window.SparkDescent.selectProfile('pc');view.run("act('entry-host');online.host=()=>new Promise((resolve,reject)=>{globalThis.rejectRoom=reject;})");
 const prior=view.el('announcer').textContent,connecting=view.run("onlineAction('online-host')");
 assert.equal(view.el('online-host').disabled,true);assert.equal(view.el('online-join').disabled,true);assert.equal(view.el('online-form').disabled,true);
 view.run("rejectRoom(Error('Room service unavailable'))");await connecting;
 assert.equal(view.el('online-error').textContent,'Room service unavailable');assert.equal(view.el('announcer').textContent,prior);
 assert.equal(view.el('online-host').disabled,false);assert.equal(view.el('online-leave').hidden,true);assert.equal(view.run('run'),null);
});

test('an existing room disables new setup and shows Leave current room',()=>{
 const view=ui(null,{entry:true});view.window.SparkDescent.selectProfile('pc');
 view.run("enterDescent();online.session={code:'ABCDEFGH',role:'host',token:'test-only'};openDialog('online-dialog')");
 assert.equal(view.el('online-host').disabled,true);assert.equal(view.el('online-join').disabled,true);assert.equal(view.el('online-leave').hidden,false);
 assert.match(view.el('online-readiness').textContent,/ABCDEFGH/);
});
