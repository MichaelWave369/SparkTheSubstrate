import test from 'node:test';
import assert from 'node:assert/strict';
import {GuestInputHistory,PartnerInputPlayback,movementContext} from '../public/coop-input.js';
import * as A from '../public/action-engine.js';
import {OnlineRoom} from '../public/online.js';

test('delayed cumulative ticks preserve equal bursts, direction changes, collisions and dash without duplicate movement',()=>{
 const run=A.createRun(A.createMeta(),'spark',125);A.addPartner(run,'human');
 const history=new GuestInputHistory(),playback=new PartnerInputPlayback(),context=movementContext(run),start={...run.partner};
 for(let i=0;i<12;i++)history.capture({x:-1,y:0},context);
 const old=history.batch();for(let i=0;i<12;i++)history.capture({x:0,y:-1},context);
 const input={active:true,stream:history.batch()};playback.receive(input,context);
 const predicted=A.predictInputMovement(run,start,'human',history.frames);
 for(let i=0;i<24;i++)A.stepRun(run,{partner:playback.next()},1/60);
 assert.equal(run.partner.x,predicted.x);assert.equal(run.partner.y,predicted.y);
 assert.ok(Math.abs(start.x-run.partner.x-(start.y-run.partner.y))<1e-7,'equal-duration bursts move equal distances');
 playback.receive({active:true,stream:old},context);const stopped={...run.partner};
 for(let i=0;i<20;i++)A.stepRun(run,{partner:playback.next()},1/60);
 assert.equal(run.partner.x,stopped.x);assert.equal(run.partner.y,stopped.y,'old packets never reapply a direction');
 history.acknowledge(playback.acknowledgement());assert.equal(history.frames.length,0);
 run.room='machine';run.cleared.push('machine');Object.assign(run.partner,{x:230,y:150});history.reset(movementContext(run));
 for(let i=0;i<25;i++)history.capture({x:1,y:-1,dash:i===0},movementContext(run));
 const nearCover=A.predictInputMovement(run,run.partner,'human',history.frames);
 playback.receive({active:true,stream:history.batch()},movementContext(run));
 for(let i=0;i<25;i++)A.stepRun(run,{partner:playback.next()},1/60);
 assert.equal(run.partner.x,nearCover.x);assert.equal(run.partner.y,nearCover.y);
});

test('focus cancellation and room changes discard buffered controls',()=>{
 const h=new GuestInputHistory(),p=new PartnerInputPlayback();h.capture({x:1,dash:true},'1:glass');p.receive({active:true,stream:h.batch()},'1:glass');
 h.reset('1:glass');p.receive({active:false,stream:h.batch()},'1:glass');assert.equal(p.next().x,0);
 h.capture({x:1,interact:true},'1:glass');p.receive({active:true,stream:h.batch()},'1:machine');assert.equal(p.next().x,0);
});

test('small input lane operates while a world snapshot request is stalled',async()=>{
 const requests=[];let release;const room=new OnlineRoom(()=>{},()=>{},{now:()=>100,fetch:(url,options)=>{
  requests.push({url,body:JSON.parse(options.body)});
  if(url.endsWith('/sync'))return new Promise(resolve=>release=()=>resolve({ok:true,json:async()=>({seq:1,inputSeq:1})}));
  return Promise.resolve({ok:true,json:async()=>({inputSeq:2})});
 }});
 room.session={role:'guest',code:'ABCDEFGH',token:'test'};room.input({x:-1});room.capture('1:glass');const slow=room.sync();
 room.input({x:0,y:-1});room.capture('1:glass');await room.sendInput();
 assert.equal(requests[1].url,'/api/rooms/ABCDEFGH/input');assert.equal(requests[1].body.input.stream.frames.length,2);
 assert.equal(requests[1].body.input.stream.frames[1].y,-1);release();await slow;
});
