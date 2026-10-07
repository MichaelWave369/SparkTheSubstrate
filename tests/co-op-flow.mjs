import assert from 'node:assert/strict';
import {ui} from './ui-harness.mjs';

// This uses the real HTML, dialog-close handlers, keyboard handlers, animation
// loop, OnlineRoom callbacks and room API. Neither player mutates the other's run.
export async function checkLiveCoop(fetcher){
 let time=0;
 const options={entry:true,roomOptions:{fetch:fetcher},deferredClose:true,nativeFocusAfterClose:true,now:()=>time};
 const host=ui(null,options),guest=ui(null,options);
 const exchange=async()=>{await guest.run('online.sync()');await host.run('online.sync()');await host.run('online.sync()');await guest.run('online.sync()');};
 const frame=()=>{time+=1000/60;host.run(`animate(${time})`);guest.run(`animate(${time})`);};
 try{
  host.window.SparkDescent.selectProfile('pc');host.el('online-nav').focus();host.run("act('entry-host')");
  await host.run("onlineAction('online-host')");host.flushCloses();host.flushFrames(time);
  guest.window.SparkDescent.selectProfile('pc');guest.el('online-nav').focus();guest.run("act('entry-join')");
  guest.el('online-code').value=host.run('online.code');
  await guest.run("onlineAction('online-join')");guest.flushCloses();guest.flushFrames(time);await exchange();
  assert.equal(host.document.activeElement.id,'game-canvas');assert.equal(guest.document.activeElement.id,'game-canvas');
  assert.equal(host.run('onlineWaiting'),false);assert.equal(guest.run('onlineWaiting'),false);
  const hx=host.run('run.player.x'),gy=host.run('run.partner.y');
  host.key('d');guest.key('w');
  for(let i=0;i<6;i++){for(let j=0;j<6;j++)frame();await exchange();}
  assert.ok(host.run('run.player.x')>hx+70,'host movement advances while room stays Threshold');
  assert.ok(host.run('run.partner.y')<gy-70,'guest movement advances on host');
  assert.equal(guest.run('run.player.x'),host.run('run.player.x'),'guest receives live host position');
  assert.equal(guest.run('run.partner.y'),host.run('run.partner.y'),'guest receives its authoritative position');
  assert.ok(guest.run("visualPositions.get('player:threshold').x")>hx+40,'rendered host moves between room transitions');
  assert.ok(host.run("visualPositions.get('partner:threshold').y")<gy-40,'rendered partner moves between room transitions');
  assert.equal(host.run('run.room'),'threshold');assert.equal(guest.run('run.room'),'threshold');
  host.run('clearInput()');guest.run('clearInput()');await exchange();
  host.run('peerMovedAt=Date.now()-1500;renderOnlineStatus()');assert.match(host.el('online-status').textContent,/PLAYER 2 · Spark · away/);
  host.run("run.abilities.push('morph')");await exchange();
  host.key('q');assert.equal(host.el('vessel-dialog').open,true);host.key('2');host.flushCloses();host.flushFrames(time);frame();await exchange();
  assert.equal(host.run('run.form'),'human');assert.equal(guest.run('run.form'),'human');
  guest.key('q');assert.equal(guest.el('vessel-dialog').open,true);guest.key('5');guest.flushCloses();guest.flushFrames(time);await exchange();frame();await exchange();
  assert.equal(host.run('run.partnerForm'),'tree');assert.equal(guest.run('run.partnerForm'),'tree');assert.equal(guest.el('form-name').textContent,'Tree');
  host.run('draw()');guest.run('draw()');
  assert.ok(host.drawn.some(text=>text.includes('PLAYER 1 · Human')));assert.ok(guest.drawn.some(text=>text.includes('PLAYER 2 · Tree')));
  assert.equal(guest.document.activeElement.id,'game-canvas');

  // The same requests keep succeeding even when a stale counter is below the
  // server's newest sequence. It must recover without waiting for a new room.
  const lastHost=host.run('online.seq'),lastGuest=guest.run('online.seq');
  host.run('online.seq=0');guest.run('online.seq=0');await exchange();
  assert.ok(host.run('online.seq')>lastHost);assert.ok(guest.run('online.seq')>=lastGuest);
  host.key('a');guest.key('s');const freshX=host.run('run.player.x'),freshY=host.run('run.partner.y');
  for(let i=0;i<3;i++){for(let j=0;j<6;j++)frame();await exchange();}
  assert.ok(guest.run('run.player.x')<freshX);assert.ok(host.run('run.partner.y')>freshY);

  // Losing focus cannot leave a held move, fire, gate or power at the host.
  guest.listeners.get('window:blur').fn();await exchange();host.run('clearInput()');
  const stopped=host.run('JSON.stringify({x:run.partner.x,y:run.partner.y})');
  for(let i=0;i<30;i++)frame();await exchange();
  assert.equal(host.run('JSON.stringify({x:run.partner.x,y:run.partner.y})'),stopped);
  assert.equal(host.run('remoteInput.active'),false);guest.listeners.get('window:focus').fn();

  // Room fixtures reproduce the reported cleared gates. Crossing still uses E
  // and the actual engine, with both players required at the same gate.
  host.run('clearInput();Object.assign(run.player,{x:480,y:50});Object.assign(run.partner,{x:480,y:450})');await exchange();
  host.key('e');frame();host.run('renderRail();draw()');
  assert.equal(host.run('run.room'),'threshold');assert.match(host.el('world-message').textContent,/Partner must be near/);
  assert.match(host.drawn.join(' '),/Partner must be near/);
  host.run('clearInput();Object.assign(run.player,{x:480,y:450});Object.assign(run.partner,{x:480,y:50})');await exchange();
  guest.key('e');frame();await exchange();frame();await exchange();guest.run('renderRail();draw()');
  assert.equal(host.run('run.room'),'threshold');assert.match(guest.el('world-message').textContent,/Partner must be near/);
  host.run('Object.assign(run.player,{x:480,y:100})');frame();await exchange();
  assert.equal(host.run('run.room'),'glass');assert.equal(guest.run('run.room'),'glass');
  host.run("clearInput();run.cleared.push('glass');run.phase='playing';run.enemies=[];Object.assign(run.player,{x:910,y:300,gateLatched:false,gateGrace:0});Object.assign(run.partner,{x:480,y:300,gateLatched:false,gateGrace:0})");guest.run('clearInput()');await exchange();
  host.key('e');frame();host.run('renderRail();draw()');
  assert.equal(host.run('run.room'),'glass');assert.match(host.el('world-message').textContent,/EAST · E · Machine Sepulcher · Partner must be near/);
  host.run('Object.assign(run.partner,{x:870,y:300})');frame();await exchange();
  assert.equal(host.run('run.room'),'machine');assert.equal(guest.run('run.room'),'machine');
  host.run("clearInput();run.cleared.push('machine');run.enemies=[];run.player.hp=0;Object.assign(run.player,{x:480,y:300});Object.assign(run.partner,{x:510,y:300})");guest.run('clearInput()');await exchange();
  guest.key('e');for(let i=0;i<22;i++){for(let j=0;j<6;j++)frame();await exchange();}
  assert.ok(host.run('run.player.hp')>0,'guest can still rekindle the host');assert.equal(guest.run('run.player.hp'),host.run('run.player.hp'));
  host.run("openDialog('online-dialog')");const offers=host.el('online-form').innerHTML;host.run('meta.karma=-70;meta.runs++;renderRail()');
  assert.equal(host.el('online-form').innerHTML,offers);assert.match(host.el('online-body-note').textContent,/PLAYER 1 · Human.*PLAYER 2 · Tree/);
  host.el('online-dialog').close();host.flushCloses();host.flushFrames(time);assert.equal(host.document.activeElement.id,'game-canvas');
  return {host,guest,exchange,frame,options};
 }catch(error){await guest.run('online.leave()');await host.run('online.leave()');throw error;}
}

export async function checkResumedCoop(pair,fetcher){
 pair.host.run('paused=true;clearInput()');pair.guest.run('clearInput()');await pair.exchange();
 const hostSession=JSON.parse(pair.host.sessionStorage.getItem('spark-online-room-v1')),guestSession=JSON.parse(pair.guest.sessionStorage.getItem('spark-online-room-v1'));
 const campaign=pair.host.run('JSON.stringify(run)'),hostSeq=pair.host.run('online.seq'),guestSeq=pair.guest.run('online.seq');
 // Unloading a tab stops its client, without leaving or closing the room.
 pair.host.run('online.stop();online.session=null');pair.guest.run('online.stop();online.session=null');
 let time=0;
 const options={entry:true,roomOptions:{fetch:fetcher},preferences:{inputProfile:'pc'},deferredClose:true,nativeFocusAfterClose:true,now:()=>time};
 const host=ui(null,{...options,session:hostSession}),guest=ui(null,{...options,session:guestSession});
 try{
  host.run("enterDescent('continue')");assert.equal(await host.run('onlineRecovery'),true);
  guest.run("enterDescent('continue')");assert.equal(await guest.run('onlineRecovery'),true);
  assert.equal(host.run('online.code'),hostSession.code);assert.equal(guest.run('online.code'),hostSession.code);
  assert.equal(host.run('JSON.stringify(run)'),campaign);assert.equal(guest.run('JSON.stringify(run)'),campaign);
  assert.ok(host.run('online.seq')>=hostSeq);assert.ok(guest.run('online.seq')>=guestSeq);assert.equal(host.run('paused'),true);
  assert.equal(guest.run('online.pending.x'),0);assert.equal(guest.run('online.pending.interact'),false);
  host.run("act('resume')");
  const exchange=async()=>{await guest.run('online.sync()');await host.run('online.sync()');await host.run('online.sync()');await guest.run('online.sync()');};
  await exchange();const hx=host.run('run.player.x'),gx=guest.run('run.partner.x');
  host.key('d');guest.key('a');
  for(let i=0;i<4;i++){for(let j=0;j<6;j++){time+=1000/60;host.run(`animate(${time})`);guest.run(`animate(${time})`);}await exchange();}
  assert.ok(guest.run('run.player.x')>hx+30);assert.ok(host.run('run.partner.x')<gx-30);
  assert.equal(host.run('run.room'),'machine');assert.equal(guest.run('run.room'),'machine');
  assert.equal(host.window.SparkDescent.observe().coop.role,'host');assert.equal(guest.window.SparkDescent.observe().coop.role,'guest');
  return {host,guest};
 }catch(error){await guest.run('online.leave()');await host.run('online.leave()');throw error;}
}

export async function checkCoopPolish(pair){
 const {host,guest,exchange,frame}=pair;
 const close=view=>{const button={dataset:{action:'close-dialog'}};view.listeners.get('click').fn({target:{closest:()=>button},preventDefault(){}});view.flushCloses();view.flushFrames();};
 // Set actual names in the existing room; no new life or campaign mutation.
 for(const [view,name]of [[host,'Mr. FL'],[guest,'Maverick']]){
  view.run("openDialog('online-dialog')");view.el('online-name').value=name;await view.run("onlineAction('online-name')");close(view);
  assert.equal(view.document.activeElement.id,'game-canvas','× restores focus after native dialog focus restoration');
  assert.equal(view.run('paused'),false);
  assert.equal(view.storage.get('spark-substrate-player-name-v1'),name);
 }
 await exchange();host.run('renderRail()');guest.run('renderRail()');
 assert.match(host.el('online-status').textContent,/YOU · Mr. FL · PLAYER 1 · Human · connected · (idle|moving|away).*Maverick · PLAYER 2 · Tree/);
 assert.match(guest.el('online-status').textContent,/YOU · Maverick · PLAYER 2 · Tree · connected · (idle|moving|away).*Mr. FL · PLAYER 1 · Human/);
 host.drawn.length=0;guest.drawn.length=0;host.run('draw()');guest.run('draw()');
 for(const view of [host,guest]){
  assert.equal(view.drawn.filter(t=>t.includes('Mr. FL · PLAYER 1 · Human')).length,1);
  assert.equal(view.drawn.filter(t=>t.includes('Maverick · PLAYER 2 · Tree')).length,1);
  assert.ok(!view.drawn.some(t=>/^PLAYER [12] · IDLE$/.test(t)));
 }
 guest.run("openDialog('online-dialog')");assert.equal(guest.el('online-form').value,'tree');assert.doesNotMatch(guest.el('online-form').innerHTML,/host offer/);close(guest);await exchange();
 const before=host.run('run.partner.x');guest.key('d');for(let i=0;i<6;i++){frame();await exchange();}
 assert.ok(host.run('run.partner.x')>before+10,'WASD works directly after ×, with no canvas click');guest.run('clearInput()');await exchange();

 // Guest Map and host focus loss release input without pausing the partner.
 guest.run("openDialog('world-map')");await exchange();const mapTime=host.run('run.time');
 for(let i=0;i<12;i++)frame();await exchange();assert.ok(host.run('run.time')>mapTime);assert.equal(guest.run('paused'),false);
 close(guest);host.listeners.get('window:blur').fn();await exchange();assert.equal(host.run('paused'),false);host.listeners.get('window:focus').fn();

 // Host pause is authoritative on both the displayed and simulated clocks.
 host.run("act('pause')");await exchange();const frozen=host.run('run.time');
 for(let i=0;i<10;i++){for(let j=0;j<60;j++)frame();await exchange();}
 assert.equal(host.run('run.time'),frozen);assert.equal(guest.run('run.time'),frozen);
 guest.run('renderRail()');assert.equal(guest.el('clock-state').textContent,'PAUSED');
 guest.key('escape');assert.equal(guest.run('paused'),false,'guest Escape cannot toggle the shared pause');
 host.run("act('resume')");await exchange();

 // Advisory votes cannot choose a gift, spend karma or unlock a door.
 host.run("clearInput();run.phase='boon';run.xp=0;run.choices=['edge','cadence','orbit'];renderOverlay(true);renderRail()");await exchange();
 const build=host.run('JSON.stringify({boons:run.boons,karma:run.karma,essence:run.essence,keys:run.keys,seals:run.seals})');
 await guest.run('sendCoopVote(1)');await exchange();
 assert.equal(host.run('run.phase'),'boon');assert.equal(host.run('JSON.stringify({boons:run.boons,karma:run.karma,essence:run.essence,keys:run.keys,seals:run.seals})'),build);
 assert.match(host.el('game-overlay').innerHTML,/Maverick votes for option 2/);
 assert.match(guest.el('vessel-button').textContent,/after choice/);assert.match(guest.el('game-overlay').innerHTML,/Vessel changes are disabled/);
 const vessel=guest.run('run.partnerForm');guest.key('q');assert.equal(guest.el('play-feedback').hidden,false);assert.match(guest.el('play-feedback').textContent,/waiting gift/);assert.equal(guest.el('vessel-dialog').open,false);assert.equal(guest.run('run.partnerForm'),vessel);
 const oldContext=guest.run('coopChoiceContext(run)');host.key('1');await exchange();assert.equal(guest.run('run.phase'),'playing');
 await assert.rejects(guest.run(`online.vote(${JSON.stringify(oldContext)},1)`),/choice has already changed/);
 host.run("run.phase='resolve';run.choices=[];renderOverlay(true)");await exchange();const karma=host.run('run.karma');
 guest.listeners.get('window:blur').fn();await exchange();await guest.run('sendCoopVote(2)');guest.listeners.get('window:focus').fn();await exchange();assert.equal(host.run('run.karma'),karma);
 assert.match(host.el('game-overlay').innerHTML,/Maverick votes for option 3/);
 host.key('1');host.key('enter');await exchange();assert.equal(host.run('run.karma'),Math.min(100,karma+7));

 // First check interrupted revival, then a complete host-to-guest revival.
 host.run("clearInput();run.phase='playing';run.enemies=[];run.shots=[];run.fragments=[];run.partner.hp=0;Object.assign(run.player,{x:480,y:300});Object.assign(run.partner,{x:510,y:300})");guest.run('clearInput()');await exchange();
 host.key('e');for(let i=0;i<45;i++)frame();assert.ok(host.run('run.partner.revive')>.5);assert.equal(host.run('run.partner.hp'),0);
 host.run('clearInput()');frame();assert.equal(host.run('run.partner.revive'),0);
 host.key('e');for(let i=0;i<22;i++){for(let j=0;j<6;j++)frame();await exchange();}
 assert.ok(host.run('run.partner.hp')>0);assert.equal(guest.run('run.partner.hp'),host.run('run.partner.hp'));
 host.run('clearInput()');guest.run('clearInput()');await exchange();
 assert.equal(host.window.SparkDescent.observe().coop.name,'Mr. FL');assert.equal(guest.window.SparkDescent.observe().coop.name,'Maverick');
}

export async function checkDelayedCoop(pair){
 const {host,guest,exchange,frame}=pair,client=guest.run('online'),fetcher=client.fetcher;
 host.run("clearInput();run.room='threshold';run.phase='playing';run.enemies=[];run.shots=[];run.fragments=[];Object.assign(run.partner,{x:480,y:350,dashTime:0,dashCooldown:0})");guest.run('clearInput()');await exchange();
 const start=host.run('({...run.partner})'),packets=[];
 client.fetcher=(path,options)=>path.endsWith('/input')?new Promise(resolve=>packets.push(async()=>resolve(await fetcher(path,options)))):fetcher(path,options);
 try{
  guest.key('a');for(let i=0;i<12;i++)frame();const first=client.sendInput();
  guest.listeners.get('keyup').fn({key:'a'});guest.key('w');for(let i=0;i<12;i++)frame();const second=client.sendInput();guest.listeners.get('keyup').fn({key:'w'});
  const preview=guest.run('guestVisualPlayer()');assert.ok(preview.x<start.x&&preview.y<start.y,'guest immediately previews both bursts before any input request arrives');
  assert.equal(host.run('run.partner.x'),start.x,'host does not invent movement while packets are delayed');
  await packets[1]();await second;await packets[0]();await first;
  await host.run('online.sync()');for(let i=0;i<24;i++)frame();
  assert.ok(Math.abs(host.run('run.partner.x')-preview.x)<1e-6);assert.ok(Math.abs(host.run('run.partner.y')-preview.y)<1e-6,'reordered cumulative packets apply every burst exactly once');
  await exchange();assert.equal(guest.run('online.history.frames.some(f=>f.x||f.y)'),false,'authoritative snapshot acknowledges all applied directional ticks');
  const stopped=host.run('({...run.partner})');for(let i=0;i<12;i++)frame();await exchange();for(let i=0;i<12;i++)frame();
  assert.equal(host.run('run.partner.x'),stopped.x);assert.equal(host.run('run.partner.y'),stopped.y,'no old A or W remains held after the bursts');
 }finally{client.fetcher=fetcher;host.run("run.room='machine';clearInput()");guest.run('clearInput()');await exchange();}
}

// These checks cause lethal damage; assigning zero HP bypassed the faulty
// damage-to-regeneration transition in the earlier revival fixtures.
export async function checkLethalRevive(pair){
 const {host,guest,exchange,frame}=pair;
 const strike=partner=>host.run(`clearInput();run.phase='playing';run.room='machine';run.enemies=[];run.fragments=[];if(!run.cleared.includes('machine'))run.cleared.push('machine');run.boons.regeneration=2;Object.assign(run.player,{x:480,y:300,hp:run.player.maxHp,iframes:0});Object.assign(run.partner,{x:520,y:300,hp:run.partner.maxHp,iframes:0});{const victim=${partner?'run.partner':'run.player'};victim.hp=1;run.shots=[{id:++run.serial,x:victim.x,y:victim.y,vx:0,vy:0,damage:100,enemy:true,r:6,life:1,color:'#71e5e4'}]}`);
 strike(false);guest.run('clearInput()');await exchange();frame();await exchange();host.run('renderRail();draw()');guest.run('renderRail();draw()');
 assert.equal(host.run('run.player.hp'),0,'lethal damage leaves the host downed despite regeneration');assert.equal(guest.run('run.player.hp'),0);assert.equal(host.run('run.phase'),'playing');
 assert.match(host.el('coop-revive-status').textContent,/FALLEN · 30s.*rescue clock held/);assert.match(guest.el('coop-revive-status').textContent,/FALLEN · 30s/);assert.doesNotMatch(host.el('game-overlay').innerHTML,/The body ends|This was a life/);
 guest.key('e');for(let i=0;i<10;i++){for(let j=0;j<18;j++)frame();await exchange();}
 assert.ok(host.run('run.player.hp')>0,'guest rekindles host even with sparse input batches');assert.equal(guest.run('run.player.hp'),host.run('run.player.hp'));
 strike(true);guest.run('clearInput()');await exchange();frame();await exchange();guest.run('renderRail()');assert.equal(host.run('run.partner.hp'),0);assert.match(guest.el('clock-state').textContent,/FALLEN/);frame();await exchange();
 host.key('e');for(let i=0;i<45;i++)frame();assert.ok(host.run('run.partner.revive')>.5,host.run('JSON.stringify({wait:rescueWaiting,age:remoteInputAge+Date.now()-remoteInputAt,ack:remoteInput.fallAck,active:remoteInput.active,serial:run.fallSerial,phase:run.phase,paused,held:heldInteract(),distance:reviveState(run,run.player)?.distance})'));host.run('clearInput()');frame();assert.equal(host.run('run.partner.revive'),0,'letting go interrupts the host revive immediately');
 host.key('e');for(let i=0;i<8;i++){for(let j=0;j<18;j++)frame();await exchange();}
 assert.ok(host.run('run.partner.hp')>0);assert.equal(guest.run('run.partner.hp'),host.run('run.partner.hp'));assert.equal(host.run('run.partner.downedFor'),0);
 host.run('clearInput()');guest.run('clearInput()');await exchange();
}

export async function checkVoteBehindSnapshot(pair){
 const {host,guest,exchange}=pair,client=host.run('online'),fetcher=client.fetcher;
 host.run("run.phase='boon';run.choices=['edge','cadence','orbit'];renderOverlay(true)");await exchange();
 let release;client.fetcher=async(path,options)=>{const response=await fetcher(path,options);if(path.endsWith('/sync'))return new Promise(resolve=>release=()=>resolve(response));return response;};
 try{
  const slow=client.sync();while(!release)await new Promise(resolve=>setImmediate(resolve));
  await guest.run('sendCoopVote(1)');await client.pulse();assert.match(host.el('game-overlay').innerHTML,/votes for option 2/,'a vote bypasses an in-flight world snapshot');
  release();await slow;assert.match(host.el('game-overlay').innerHTML,/votes for option 2/,'an older snapshot response cannot erase the accepted vote');
 }finally{client.fetcher=fetcher;host.run("chooseBoon(run,'edge');renderOverlay(true)");await exchange();}
}
