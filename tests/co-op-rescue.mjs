import assert from 'node:assert/strict';
import {ui} from './ui-harness.mjs';

// Packet delivery is deliberately separated from 60 Hz frames. The old tests
// used fast ordered exchanges and never exhausted the 200 ms E bridge.
export async function checkRescueUnderLatency(fetcher){
 let clock=100000;const now=()=>clock,options={entry:true,now,wallNow:now,roomOptions:{fetch:fetcher,now},deferredClose:true,nativeFocusAfterClose:true};
 const host=ui(null,options),guest=ui(null,options),frame=()=>{clock+=1000/60;host.run(`animate(${clock})`);guest.run(`animate(${clock})`);},exchange=async()=>{await guest.run('online.sync()');await host.run('online.pulse()');await host.run('online.sync()');await guest.run('online.sync()');};
 try{
  host.window.SparkDescent.selectProfile('pc');host.run("enterDescent('host')");await host.run("onlineAction('online-host')");host.flushCloses();host.flushFrames(clock);
  guest.window.SparkDescent.selectProfile('pc');guest.run("enterDescent('join')");guest.el('online-code').value=host.run('online.code');await guest.run("onlineAction('online-join')");guest.flushCloses();guest.flushFrames(clock);await exchange();frame();await exchange();
  for(const partner of [false,true]){
   host.run("openDialog('online-dialog')");assert.equal(host.el('online-fall-'+(partner?'guest':'host')).disabled,false);
   await host.run(`onlineAction('online-fall-${partner?'guest':'host'}')`);host.flushCloses();host.flushFrames(clock);await host.run('online.inFlight');
   const actor=partner?'run.partner':'run.player';assert.equal(host.run(actor+'.hp'),0);assert.equal(host.run('run.phase'),'playing');
   // The guest has not received this fall. Even three seconds of foreground
   // frames must not eat the window or let its clock silently run ahead.
   for(let i=0;i<180;i++)frame();assert.equal(host.run(actor+'.downedFor'),30);assert.equal(host.run('rescueWaiting'),true);
   await exchange();guest.run('renderRail()');if(partner)assert.match(guest.el('clock-state').textContent,/FALLEN/);else assert.doesNotMatch(guest.el('clock-state').textContent,/FALLEN/);
   assert.equal(guest.run(actor+'.hp'),0,'lethal damage is received as a fallen spark, not an ended life');assert.equal(guest.run('run.phase'),'playing');
   frame();await exchange(); // Acknowledge the new fallen-state serial.
   const reviver=partner?host:guest;reviver.key('e');frame();await exchange();
   // Includes gaps of 600, 700 and 750 ms. No invented movement is held during
   // them, but a current authenticated E hold must remain uninterrupted.
   for(const interval of [42,36,45]){for(let i=0;i<interval;i++)frame();await exchange();if(host.run(actor+'.hp')===0){host.run('renderRail();draw()');guest.run('renderRail();draw()');assert.ok(host.run(actor+'.revive')>.5,host.run('JSON.stringify({held:remoteInput.interact,active:remoteInput.active,waiting:rescueWaiting,ack:remoteInput.fallAck,serial:run.fallSerial,age:remoteInputAge+Date.now()-remoteInputAt,phase:run.phase})'));assert.match(reviver.el('online-status').textContent,/reviving/);assert.match(reviver.el('coop-revive-status').textContent,/REKINDLING/);assert.ok(reviver.drawn.some(t=>t.includes('REKINDLING')));}}
   assert.ok(host.run(actor+'.hp')>0,'a continuous held E completes despite delayed packets');assert.equal(guest.run(actor+'.hp'),host.run(actor+'.hp'));assert.equal(host.run(actor+'.downedFor'),0);
   host.run('clearInput()');guest.run('clearInput()');await exchange();
  }
  // A buffered movement preview must not make a survivor look inside the ring
  // while their real position is outside. Holding E displays the relay pose.
  const client=guest.run('online'),transport=client.fetcher;let release;
  client.fetcher=async(path,options)=>{const response=await transport(path,options);if(path.endsWith('/sync'))return new Promise(resolve=>release=()=>resolve(response));return response;};
  const oldWorld=client.sync();while(!release)await new Promise(resolve=>setImmediate(resolve));
  try{host.run("controlledFall(run,false);Object.assign(run.partner,{x:run.player.x+135,y:run.player.y})");await host.run('online.sync()');await client.pulse();assert.equal(guest.run('run.player.hp'),0,'the rescue lane delivers FALLEN while the ordinary snapshot is stalled');release();await oldWorld;assert.equal(guest.run('run.player.hp'),0,'a late pre-fall snapshot cannot roll the guest back to standing');}finally{client.fetcher=transport;release?.();await oldWorld;}
  frame();await exchange();frame();await exchange();
  guest.key('a');for(let i=0;i<12;i++)frame();assert.ok(guest.run('guestVisualPlayer().x')<host.run('run.partner.x'));guest.listeners.get('keyup').fn({key:'a'});guest.key('e');frame();await host.run('online.sync()');await guest.run("online.update('name',{name:'Maverick'})");
  assert.equal(guest.run('guestVisualPlayer().x'),guest.run('run.partner.x'));guest.run('renderRail()');assert.match(guest.el('coop-revive-status').textContent,/Move into the glowing rescue circle/);
  guest.run('clearInput()');host.run('clearInput()');await exchange();
  // Leave returns to the start screen; it never creates a solo body picker.
  await guest.run("onlineAction('online-leave')");guest.flushCloses();assert.equal(guest.run('entryMode'),'start');assert.equal(guest.el('start-screen').hidden,false);assert.equal(guest.el('descent-root').hidden,true);
 }finally{await guest.run('online.leave()');await host.run('online.leave()');}
}
