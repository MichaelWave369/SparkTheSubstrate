import test from 'node:test';
import assert from 'node:assert/strict';
import {OnlineRoom} from '../public/online.js';

test('a throttled guest releases stale movement even while its relay timer keeps running',async()=>{
 let time=1000;const packets=[];
 const room=new OnlineRoom(()=>{},assert.fail,{now:()=>time,fetch:async(path,options)=>{const packet=JSON.parse(options.body);packets.push(packet);return Response.json({inputSeq:packet.seq});}});
 room.session={code:'ABCDEFGH',role:'guest',token:'test-only'};
 room.input({x:1,y:1,fire:true,dash:true,power:true,interact:true,morph:'rock'});await room.sync();
 assert.equal(packets[0].input.x,1);time+=1201;await room.sync();
 assert.deepEqual(packets[1].input,{x:0,y:0,fire:false,fireMode:'auto',dash:false,interact:false,power:false,morph:null,active:false,fallAck:0});
});

test('overlapping sync waits for the packet and focus loss cancels failed action retries',async()=>{
 const errors=[];let reject,calls=0;
 const room=new OnlineRoom(()=>{},message=>errors.push(message),{fetch:()=>{calls++;return new Promise((resolve,no)=>reject=no);}});
 room.session={code:'ABCDEFGH',role:'guest',token:'test-only'};
 room.input({x:1,y:0,power:true,morph:'tree'});const first=room.sync(),second=room.sync();
 assert.equal(calls,1);room.clearInput();reject(Error('Test disconnect'));await Promise.all([first,second]);
 assert.equal(room.busy,false);assert.equal(room.pending.power,false);assert.equal(room.pending.morph,null);assert.equal(room.pending.x,0);assert.deepEqual(errors,['Test disconnect']);
});
