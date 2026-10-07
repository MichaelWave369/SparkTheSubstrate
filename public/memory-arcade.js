import {LEGACY_BUILDS,LEGACY_BY_ID,ARCADE_OBJECTS,ARCADE_HOOK,ARCADE_WIDTH} from './memory-arcade-manifest.js?v=0.17.0';
import {loadArcade,saveArcade,discoverLegacy,completeLegacy,arcadeTokens,arcadeJournal,loadLegacyStore,saveLegacyStore,legacyStorageKey} from './memory-arcade-state.js?v=0.17.0';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// A walkable, peaceful annex. It never changes the 27-room journey or its clock.
export class MemoryArcade {
  constructor(side) {
    this.side=side;this.$=side.$;this.state=loadArcade(side.storage);this.active=false;this.menu='';this.time=0;this.camera=0;this.frame=null;this.session=null;this.legacy=null;this.muted=true;this.previous={};this.lastRender='';
    this.message=event=>this.receive(event);side.window.addEventListener('message',this.message);
  }
  persist(){if(!this.side.owns())return false;try{saveArcade(this.side.storage,this.state);return true;}catch{this.side.say('The archive cannot save on this device. Keep this page open.');return false;}}
  enter(){
    if(this.side.journey?.room!=='threshold'||this.side.journey?.station!=='arcade')throw Error('Walk to the Memory Arcade door in the Threshold.');
    if(!this.side.save())throw Error('Remember the current journey before entering an old body.');
    this.state=loadArcade(this.side.storage);this.state.entered=true;this.active=true;this.menu='';this.side.menu='';this.side.journey.station=null;
    this.player={x:this.state.x,y:420,vx:0,vy:0,facing:1,grounded:true,walk:0};this.camera=clamp(this.player.x-360,0,ARCADE_WIDTH-960);this.clearInputs();this.persist();
    this.side.say('The body falls. The spark remembers. Some bodies were worlds.');this.render(true);this.side.draw();this.focus();
  }
  clearInputs(){this.side.clearInputs();this.previous={};if(this.player){this.player.vx=0;this.player.vy=0;this.player.y=420;this.player.grounded=true;}}
  focus(){if(this.frame){this.frame.focus?.();return;}if(!this.menu)this.side.canvas.focus({preventScroll:true});else this.$('side-overlay').querySelector('button')?.focus({preventScroll:true});}
  setMenu(menu){this.menu=menu;this.clearInputs();this.render(true);this.focus();}
  leave(){
    this.teardown();if(!this.active)return;this.state.x=this.player.x;this.persist();this.active=false;this.menu='';this.side.journey.station=null;this.side.lastHud='';this.side.lastOverlay='';this.side.setMenu('');this.side.save();this.side.snapCamera();this.side.draw();
  }
  suspend(){if(this.frame){this.send('legacy-release');return;}if(this.active)this.setMenu('pause');}
  discover(journey){
    const found=LEGACY_BUILDS.find(b=>b.discovery&&b.discovery.room===journey.room&&Math.hypot(journey.player.x-b.discovery.x,journey.player.y-620)<100);
    if(!found)return false;
    if(this.state.discovered.includes(found.id)){this.side.say(found.title+' is remembered in the Memory Arcade · Threshold.');return true;}
    if(found.discovery.form&&journey.form!==found.discovery.form){this.side.say('The terminal asks for '+found.discovery.form[0].toUpperCase()+found.discovery.form.slice(1)+' · return after vessel resonance.');return true;}
    if(!discoverLegacy(this.state,found.id,journey)){this.side.say('Clear this chamber before waking the old terminal.');return true;}
    this.persist();this.side.audio.effect('key');this.side.say('INCARNATION REMEMBERED · '+found.title+' v'+found.version+' · a cabinet wakes in the Threshold’s Memory Arcade.');return true;
  }
  near(){return ARCADE_OBJECTS.toSorted((a,b)=>Math.abs(a.x-this.player.x)-Math.abs(b.x-this.player.x))[0];}
  interact(){const object=this.near();if(Math.abs(object.x-this.player.x)>105||Math.abs(this.player.y-420)>60){this.side.say('Walk closer to a cabinet, terminal, or the Threshold door.');return;}
    if(object.id==='exit'){this.leave();return;}this.selected=object.id;this.setMenu(object.id==='unwritten'?'mystery':object.id==='jukebox'?'jukebox':object.id==='gallery'?'gallery':'cabinet');this.side.audio.effect('chime');
  }
  step(input,dt=1/60){if(this.menu||this.frame||!this.active)return;this.time+=dt;const p=this.player,x=clamp(input.x??0,-1,1);
    p.vx=x*265;if(x)p.facing=Math.sign(x);p.x=clamp(p.x+p.vx*dt,48,ARCADE_WIDTH-90);p.walk+=Math.abs(p.vx)*dt/75;
    if(input.jump&&!this.previous.jump&&p.grounded){p.vy=-510;p.grounded=false;}p.vy=Math.min(700,p.vy+1450*dt);p.y+=p.vy*dt;if(p.y>=420){p.y=420;p.vy=0;p.grounded=true;}
    if(input.interact&&!this.previous.interact)this.interact();this.previous={jump:!!input.jump,interact:!!input.interact};this.state.x=p.x;
  }
  tick(dt){
    if(!this.side.owns()){this.teardown();this.active=false;return;}
    const pad=this.controller();if(this.frame){this.pollLegacyPad();return;}
    if(!this.side.document.hidden&&!this.side.document.querySelector('dialog[open]')){
      const input=this.side.settings().inputProfile==='mobile'?{x:this.side.touch.x,...this.side.touch.buttons}:this.side.settings().inputProfile==='controller'?pad:this.side.keyboardInput();
      let count=0;this.accumulator=(this.accumulator??0)+Math.min(.2,Math.max(0,dt));while(this.accumulator>=1/60&&count++<12){this.step(input);this.accumulator-=1/60;}
    }else this.accumulator=0;
    this.saveClock=(this.saveClock??0)+dt;if(this.saveClock>=2){this.persist();this.saveClock=0;}if(this.time>(this.noticeUntil??0))this.$('side-notice').hidden=true;this.render();this.side.draw();
  }
  control(input,frames=1){if(!this.active||this.menu||this.frame||!this.side.owns())throw Error('Walk in the Memory Arcade before controlling it.');
    if(!input||!Number.isInteger(frames)||frames<1||frames>600||Object.keys(input).some(k=>!['x','jump','interact'].includes(k))||input.x!==undefined&&(!Number.isFinite(input.x)||Math.abs(input.x)>1)||['jump','interact'].some(k=>input[k]!==undefined&&typeof input[k]!=='boolean'))throw Error('Use bounded arcade movement and 1–600 frames.');
    for(let i=0;i<frames&&!this.menu;i++)this.step(input);this.persist();this.render(true);this.side.draw();return this.observe();
  }
  keydown(event){const key=event.code==='Space'?' ':String(event.key??'').toLowerCase();if(event.altKey||event.ctrlKey||event.metaKey||['INPUT','TEXTAREA','SELECT'].includes(event.target?.tagName))return;
    if(event.target?.tagName==='BUTTON'&&[' ','enter'].includes(key))return;
    if(['a','d','w','arrowleft','arrowright','arrowup',' ','e','m','escape'].includes(key))event.preventDefault();
    if(event.repeat&&['e','escape','m'].includes(key))return;
    if(this.frame){if(key==='escape')this.requestReturn();return;}
    if(key==='q'){event.preventDefault();this.side.say('Borrow another body back in the Threshold.');return;}
    if(key==='escape'){this.setMenu(this.menu?'':'pause');return;}if(key==='m'){this.setMenu(this.menu==='journal'?'':'journal');return;}
    if(!this.menu&&this.side.settings().inputProfile==='pc')this.side.keys.add(key);
  }
  controller(){
    if(this.frame||this.side.settings().inputProfile!=='controller')return {};
    const pad=Array.from(this.side.window.navigator?.getGamepads?.()??[]).find(p=>p?.connected&&p.mapping==='standard');if(!pad)return {};
    const b=pad.buttons.map(v=>typeof v==='number'?v>.5:!!v.pressed||v.value>.5),edge=i=>b[i]&&!this.side.padPrevious[i];
    if(this.menu){const buttons=Array.from(this.$('side-overlay').querySelectorAll('button:not([disabled])'));if(buttons.length&&(edge(12)||edge(13)||edge(14)||edge(15))){let at=buttons.indexOf(this.side.document.activeElement);at=(Math.max(0,at)+(edge(13)||edge(15)?1:-1)+buttons.length)%buttons.length;buttons[at].focus({preventScroll:true});buttons[at].scrollIntoView?.({block:'nearest'});}if(edge(0)&&buttons.length)(buttons.includes(this.side.document.activeElement)?this.side.document.activeElement:buttons[0]).click();if(edge(1)||edge(9))this.setMenu('');}
    else if(edge(9))this.setMenu('pause');else if(edge(8))this.setMenu('journal');this.side.padPrevious=b;
    return {x:clamp((Math.abs(pad.axes[0]??0)>.18?pad.axes[0]:0)+(b[15]?1:0)-(b[14]?1:0),-1,1),jump:!!b[0],interact:!!b[7]};
  }
  action(action,data={}){
    if(!this.active)throw Error('Walk into the Memory Arcade first.');
    if(!this.side.owns())throw Error('This spark is open in another tab.');
    if(action==='arcade-resume')this.setMenu('');
    else if(action==='arcade-exit')this.leave();
    else if(action==='arcade-journal')this.setMenu('journal');
    else if(action==='arcade-play')this.launch(data.build);
    else if(action==='arcade-return')this.requestReturn();
    else if(action==='arcade-mute'){this.muted=!this.muted;this.send('legacy-mute',{muted:this.muted});this.$('arcade-mute').textContent=this.muted?'Allow cabinet sound':'Mute cabinet sound';}
    else if(action==='arcade-fullscreen'){const view=this.$('arcade-legacy-view');Promise.resolve(this.side.document.fullscreenElement?this.side.document.exitFullscreen?.():view.requestFullscreen?.()).catch(()=>this.side.say('Fullscreen is unavailable here.'));}
    else if(action==='arcade-reset'){this.selected=data.build;this.setMenu('reset');}
    else if(action==='arcade-reset-confirm'){if(!LEGACY_BY_ID[this.selected])throw Error('Unknown cabinet.');this.side.storage.removeItem(legacyStorageKey(this.selected));this.side.say('Only this cabinet’s old save was cleared. Tokens and journeys remain.');this.setMenu('cabinet');}
    else if(action==='arcade-trail'){if(!this.state.completed.length)throw Error('Complete one cabinet to remember First light.');this.state.trail=!this.state.trail;this.persist();this.render(true);}
    else if(action==='arcade-sound')this.sound(data.sound);
    else if(action==='side-pause')this.setMenu(this.menu?'':'pause');
    else if(action==='side-map')this.setMenu(this.menu==='journal'?'':'journal');
    else if(action==='side-resume')this.setMenu('');
    else if(action==='side-quit'){this.leave();this.side.leave();}
    else if(action==='side-help')this.setMenu('journal');
    else if(action==='side-vessels')this.side.say('Borrow another body back in the Threshold.');
  }
  token(){const data=new Uint8Array(16);if(this.side.window.crypto?.getRandomValues)this.side.window.crypto.getRandomValues(data);else for(let i=0;i<data.length;i++)data[i]=Math.floor(Math.random()*256);return Array.from(data,v=>v.toString(16).padStart(2,'0')).join('');}
  launch(id){
    const build=LEGACY_BY_ID[id];if(this.menu!=='cabinet'||id!==this.selected||!build||!this.state.discovered.includes(id))throw Error('Approach a discovered cabinet and read its plate first.');
    if(!this.side.save()||!this.persist())throw Error('Remember the current body before launching an old one.');
    this.teardown();this.legacy=build;this.session=this.token();this.returning=false;this.booted=false;this.lastPadSent=0;this.muted=true;this.clearInputs();
    const host=this.$('arcade-frame-slot'),view=this.$('arcade-legacy-view');host.innerHTML='<iframe id="arcade-frame" title="'+esc(build.title)+' v'+build.version+' · authentic preserved game" sandbox="allow-scripts" referrerpolicy="no-referrer" src="'+build.launch+'"></iframe>';
    this.frame=this.$('arcade-frame');view.hidden=false;view.inert=false;view.setAttribute('aria-hidden','false');this.$('side-root').inert=true;
    this.$('arcade-legacy-title').textContent=build.title+' · v'+build.version+' · AUTHENTIC LEGACY BUILD';this.$('arcade-legacy-controls').textContent=build.controls+' Esc / controller View returns to the Arcade.';
    this.$('arcade-legacy-status').textContent='Waking a preserved body…';this.$('arcade-mute').textContent='Allow cabinet sound';this.$('arcade-legacy-objective').textContent=build.objective;
    this.$('arcade-touch').hidden=this.side.settings().inputProfile!=='mobile';this.bindLegacyTouch();this.frame.focus?.();
    this.bootTimer=this.side.window.setTimeout?.(()=>{if(!this.booted&&this.frame)this.fail('The preserved body did not answer. Return is still available.');},15000);
  }
  send(type,extra={}){this.frame?.contentWindow?.postMessage({type,build:this.legacy?.id,session:this.session,...extra},'*');}
  receive(event){
    const data=event.data;if(!this.active||!this.frame||event.source!==this.frame.contentWindow||!data||data.build!==this.legacy.id)return;
    if(data.type==='legacy-ready'){this.send('legacy-init',{store:loadLegacyStore(this.side.storage,this.legacy.id),muted:this.muted});return;}
    if(data.type==='legacy-shell-failed'){this.fail(data.message);return;}
    if(data.session!==this.session||!this.side.owns())return;
    if(data.type==='legacy-booted'){this.booted=true;this.side.window.clearTimeout?.(this.bootTimer);this.$('arcade-legacy-status').textContent='Preserved body awake · isolated save';}
    if(data.type==='legacy-save'||data.type==='legacy-exit')try{saveLegacyStore(this.side.storage,this.legacy.id,data.store);}catch{this.$('arcade-legacy-status').textContent='Cabinet save unavailable · modern journey remains remembered';}
    if(data.type==='legacy-observation'||data.type==='legacy-exit'){
      const next=loadArcade(this.side.storage);if(completeLegacy(next,this.legacy.id,data.proof)){this.state=next;this.persist();this.$('arcade-legacy-status').textContent='ARCHIVE TOKEN REMEMBERED · '+this.state.completed.length+' / '+LEGACY_BUILDS.length+' · First light trail available';this.side.audio.effect('key');}
    }
    if(data.type==='legacy-note')this.$('arcade-legacy-status').textContent=String(data.message).slice(0,200);
    if(data.type==='legacy-error')this.fail(data.message);
    if(data.type==='legacy-exit'){this.teardown();this.state=loadArcade(this.side.storage);this.setMenu('cabinet');this.side.draw();}
  }
  fail(message){this.error=String(message??'This old body is unavailable.').slice(0,200);this.teardown();this.setMenu('error');this.side.draw();}
  requestReturn(){if(!this.frame)return;if(this.returning)return;this.returning=true;this.send('legacy-dispose');this.returnTimer=this.side.window.setTimeout?.(()=>{if(this.frame){this.teardown();this.setMenu('cabinet');this.side.say('The old body stopped answering. Its last remembered save remains.');}},1000);}
  teardown(){
    this.side.window.clearTimeout?.(this.bootTimer);this.side.window.clearTimeout?.(this.returnTimer);this.stopSound();
    if(this.frame){this.send('legacy-dispose');this.frame.remove?.();this.$('arcade-frame-slot').innerHTML='';}
    this.frame=null;this.session=null;this.legacy=null;this.booted=false;this.returning=false;
    const view=this.$('arcade-legacy-view');if(view){view.hidden=true;view.inert=true;view.setAttribute('aria-hidden','true');}this.$('side-root').inert=false;
    if(this.side.document.fullscreenElement===view)Promise.resolve(this.side.document.exitFullscreen?.()).catch(()=>{});
  }
  pollLegacyPad(){const now=Date.now();if(now-this.lastPadSent<50)return;this.lastPadSent=now;const pad=Array.from(this.side.window.navigator?.getGamepads?.()??[]).find(p=>p?.connected&&p.mapping==='standard');const payload=pad?{connected:true,mapping:'standard',id:'Archive controller',axes:Array.from(pad.axes).slice(0,4).map(v=>clamp(Number(v)||0,-1,1)),buttons:pad.buttons.slice(0,17).map(v=>({pressed:typeof v==='number'?v>.5:!!v.pressed,value:typeof v==='number'?v:v.value??0}))}:null;this.send('legacy-pad',{pad:payload});}
  bindLegacyTouch(){for(const action of ['left','right','up','down','jump','primary','secondary','choice3','power','gate','dash','vessels']){const button=this.$('arcade-touch-'+action),mode=this.legacy.mode;const choices={primary:'CHOICE 1',secondary:'CHOICE 2',power:'CHOICE 3'},fight={primary:'LIGHT',secondary:'HEAVY',power:'POWER',gate:'LAUNCH',dash:'SUPER'},topdown={primary:'CHOICE 1',secondary:'CHOICE 2',choice3:'CHOICE 3',power:this.legacy.keys.power==='3'?'CHOICE 3':'POWER'};button.textContent=(mode==='echo'?choices[action]:mode==='duel'?fight[action]:['descent','endless'].includes(mode)?topdown[action]:null)??action.toUpperCase();button.hidden=action==='choice3'&&!this.legacy.keys.choice3||action==='vessels'&&!this.legacy.keys.vessels||mode==='echo'&&!choices[action]||['descent','endless'].includes(mode)&&action==='jump';const send=on=>this.send('legacy-key',{key:this.legacy?.keys[action],on});button.onpointerdown=e=>{e.preventDefault();button.setPointerCapture?.(e.pointerId);send(true);};for(const type of ['onpointerup','onpointercancel','onlostpointercapture'])button[type]=()=>send(false);}}
  async sound(id){
    this.stopSound();if(!['old-hit','old-gift','old-fall','old-victory','hum'].includes(id))return;
    if(!this.side.settings().audio){this.side.say('Enable sound in Settings to hear this archive.');return;}
    const Audio=this.side.window.AudioContext||this.side.window.webkitAudioContext;if(!Audio){this.side.say('Audio is unavailable on this device.');return;}
    try{const context=new Audio();this.soundContext=context;await context.resume();if(this.soundContext!==context)return;const spec=({ 'old-hit':[510,.075],'old-gift':[650,.17],'old-fall':[160,.35],'old-victory':[620,.35],hum:[72,4]})[id];const osc=context.createOscillator(),gain=context.createGain(),at=context.currentTime;osc.type='sine';osc.frequency.setValueAtTime(spec[0],at);osc.frequency.exponentialRampToValueAtTime(spec[0]*.55,at+spec[1]);gain.gain.setValueAtTime(id==='hum'?.012:.035,at);gain.gain.exponentialRampToValueAtTime(.001,at+spec[1]);osc.connect(gain);gain.connect(context.destination);osc.start(at);osc.stop(at+spec[1]);osc.onended=()=>{if(this.soundContext===context)this.stopSound();};}catch{this.stopSound();this.side.say('The sound archive could not start here.');}
  }
  stopSound(){if(this.soundContext){void this.soundContext.close().catch(()=>{});this.soundContext=null;}}
  observe(){return structuredClone({active:this.active,menu:this.menu,player:this.player??null,discovered:this.state.discovered,completed:this.state.completed,tokens:arcadeTokens(this.state),trail:this.state.trail,legacy:this.legacy?{id:this.legacy.id,booted:this.booted}:null,builds:LEGACY_BUILDS.map(b=>({...b,discovered:this.state.discovered.includes(b.id),completed:this.state.completed.includes(b.id)})),journal:arcadeJournal(this.state),hook:ARCADE_HOOK});}
  render(force=false){
    if(!this.active)return;const state=this.state,signature=[this.menu,this.selected,state.discovered.join(),state.completed.join(),state.trail].join('|');
    this.$('side-room-title').textContent='The Memory Arcade';this.$('side-world').textContent='THE THRESHOLD · PRESERVED INCARNATIONS';this.$('side-build').textContent=state.discovered.length+' / '+LEGACY_BUILDS.length+' cabinets awake · '+arcadeTokens(state)+' Archive tokens';this.$('side-power-label').textContent='No body is lost here';this.$('side-economy').textContent='Archive tokens are memories of completed cabinets · no grind, coins or essence';this.$('side-keyring').textContent='The modern journey waits at the doorway. Its clock and injuries are held.';this.$('side-instructions').textContent=this.side.settings().inputProfile==='controller'?'Stick / D-pad walk · A jump · RT cabinet · View clues · Start pause · View inside a cabinet returns here':this.side.settings().inputProfile==='mobile'?'Stick walks · JUMP · GATE reads a cabinet · Return to Memory Arcade stays above every old game':'A/D or arrows walk · Space jump · E cabinet / terminal / exit · M clues · Esc closes a plate or pauses; inside a cabinet Esc returns here';this.$('side-pause').textContent=this.menu?'Resume':'Pause';this.$('side-pause').disabled=false;this.$('side-map').disabled=false;this.$('side-vessels').disabled=true;this.$('side-touch').hidden=this.side.settings().inputProfile!=='mobile'||!!this.menu||!!this.frame;
    if(!force&&this.lastRender===signature)return;this.lastRender=signature;const overlay=this.$('side-overlay');overlay.hidden=!this.menu||!!this.frame;if(!this.menu){overlay.innerHTML='';return;}
    const back='<button class="primary-button" data-action="arcade-resume">Return to the cabinets</button>';let title='',body='',label='THE MEMORY ARCADE';
    if(this.menu==='pause'){title='Some bodies were worlds.';body='<p>These machines preserve actual earlier incarnations. Their old laws, controls and limitations remain. Your present body waits at the Threshold.</p><div class="side-menu-actions">'+back+'<button data-action="arcade-journal">Cabinet clues & collection</button><button data-action="arcade-exit">Walk back to the Threshold</button><button data-action="side-quit">Save & return to start</button></div>';}
    else if(this.menu==='cabinet'){const b=LEGACY_BY_ID[this.selected],found=state.discovered.includes(b.id),done=state.completed.includes(b.id);title=b.title;label='INCARNATION '+b.version+' · '+(found?'MEMORY RETAINED':'SIGNAL MISSING');body='<p>'+esc(b.lore)+'</p><p>'+esc(b.description)+'</p><p class="arcade-type">AUTHENTIC LEGACY BUILD · '+(done?'ARCHIVE TOKEN REMEMBERED':found?'OBJECTIVE WAITING':'NOT YET DISCOVERED')+'</p><p><b>Controls</b> · '+esc(b.controls)+'</p><p><b>Objective</b> · '+esc(b.objective)+'</p><p class="map-note">'+esc(found?b.reward:b.clue)+'</p><details><summary>Historical source</summary><p class="arcade-source">Git '+b.commit+' · '+b.sourceRoot+' / original sources. Frozen engine; isolated safety wrapper.</p><a href="/legacy/'+b.id+'/provenance.json" target="_blank" rel="noopener">View the source receipt</a></details><div class="side-menu-actions">'+(found?'<button class="primary-button" data-action="arcade-play" data-build="'+b.id+'">Play preserved v'+b.version+'</button><button data-action="arcade-reset" data-build="'+b.id+'">Reset only this cabinet’s save</button>':'')+back+'</div>';}
    else if(this.menu==='journal'){title='Old laws leave traces.';body=arcadeJournal(state).map(j=>'<div class="arcade-clue"><strong>'+esc(j.title)+' · '+(j.found?'REMEMBERED':'?')+'</strong><p>'+esc(j.text)+'</p></div>').join('')+'<p>'+arcadeTokens(state)+' / '+LEGACY_BUILDS.length+' Archive tokens. Complete each cabinet once. Nothing here is required by the descent.</p><button data-action="arcade-trail" '+(state.completed.length?'':'disabled')+'>First light trail · '+(state.completed.length?(state.trail?'on':'off'):'complete one cabinet')+'</button>'+back;}
    else if(this.menu==='gallery'){title='The evidence survived.';body='<p>Original project atlases from the preserved source, with their actual milestone versions.</p><div class="arcade-gallery">'+LEGACY_BUILDS.map(b=>state.discovered.includes(b.id)?'<figure><img loading="lazy" src="'+b.thumbnail+'" alt="'+esc(b.thumbnailLabel)+'"><figcaption>'+esc(b.thumbnailLabel)+' · v'+b.version+'<small>Git '+b.commit.slice(0,7)+'</small></figcaption></figure>':'<div class="arcade-clue"><strong>'+esc(b.title)+' · SIGNAL MISSING</strong><p>'+esc(b.clue)+'</p></div>').join('')+'</div><button data-action="arcade-trail" '+(state.completed.length?'':'disabled')+'>First light trail · '+(state.trail?'on':'off')+'</button>'+back;}
    else if(this.menu==='jukebox'){title='The sound of an earlier body.';body='<p>The v0.2 source contains synthesized effects, rather than recorded songs. These four samples replay its original sine sweep and timings. The room hum is a new archive ambience.</p><div class="side-menu-actions">'+[['old-hit','Construct hit · v0.2'],['old-gift','Gift remembered · v0.2'],['old-fall','Body falls · v0.2'],['old-victory','Warden falls · v0.2'],['hum','Archive hum · current ambience']].map(([id,name])=>'<button data-action="arcade-sound" data-sound="'+id+'">'+name+'</button>').join('')+back+'</div><p class="map-note">Sound follows your Settings switch and stops on exit. No outside music.</p>';}
    else if(this.menu==='mystery'){title='The Unwritten';label='SEALED SOCKET';body='<p>'+esc(ARCADE_HOOK.lore)+'</p><p class="map-note">No playable build is attached to this machine.</p>'+back;}
    else if(this.menu==='reset'){title='Clear this cabinet’s memory?';body='<p>Only the isolated '+esc(LEGACY_BY_ID[this.selected]?.title??'cabinet')+' save is replaced. Archive tokens, the current side journey, and campaign progress remain.</p><button data-action="arcade-reset-confirm">Clear only this cabinet’s save</button><button data-action="arcade-resume">Keep it</button>';}
    else if(this.menu==='error'){title='The old body stopped answering.';body='<p>'+esc(this.error)+'</p><p>Your present journey is still remembered. No token was granted by this failure.</p>'+back;}
    overlay.innerHTML='<div class="side-menu '+(this.menu==='gallery'?'wide':'')+'"><span class="eyebrow">'+label+'</span><h2>'+title+'</h2>'+body+'</div>';
  }
  drawScene(ctx){const p=this.player;if(!p)return;const reduced=this.side.settings().reduced,t=reduced?0:this.time;this.camera+=(clamp(p.x-360,0,ARCADE_WIDTH-960)-this.camera)*(reduced?1:.16);const cx=this.camera;
    ctx.save();ctx.fillStyle='#071414';ctx.fillRect(0,0,960,540);const haze=ctx.createLinearGradient(0,0,0,540);haze.addColorStop(0,'#172526');haze.addColorStop(.75,'#061412');haze.addColorStop(1,'#020808');ctx.fillStyle=haze;ctx.fillRect(0,0,960,540);
    ctx.strokeStyle='#cbbb8320';ctx.lineWidth=1;for(let i=0;i<Math.ceil(ARCADE_WIDTH/170)+1;i++){const x=i*170-cx*.4;ctx.beginPath();ctx.moveTo(x,-10);ctx.bezierCurveTo(x+65,80,x-60,145,x+15,240);ctx.stroke();ctx.fillStyle='#93cbc335';ctx.fillRect(x+8,230,13,5);}
    ctx.save();ctx.translate(-cx,0);ctx.strokeStyle='#6e8b7940';for(let x=0;x<ARCADE_WIDTH;x+=160){ctx.strokeRect(x,70,155,295);ctx.beginPath();ctx.arc(x+78,110,28,0,Math.PI*2);ctx.stroke();}ctx.fillStyle='#111f1c';ctx.fillRect(0,420,ARCADE_WIDTH,120);ctx.strokeStyle='#d5b87365';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,421);ctx.lineTo(ARCADE_WIDTH,421);ctx.stroke();
    ctx.strokeStyle='#465d4229';ctx.lineWidth=1;for(let x=0;x<ARCADE_WIDTH;x+=80){ctx.beginPath();ctx.moveTo(x,425);ctx.lineTo(x-38,540);ctx.stroke();}for(const y of [455,490,535]){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(ARCADE_WIDTH,y);ctx.stroke();}
    const lit=this.state.completed.length;
    // Completion trophies are physical floor glyphs beneath their actual cabinets.
    for(const b of LEGACY_BUILDS)this.cabinet(ctx,b,t);
    this.object(ctx,80,'THRESHOLD','#b8d2b2','door');this.object(ctx,250,'SOUND ARCHIVE','#9ecac5','sound');this.object(ctx,ARCADE_OBJECTS.find(o=>o.id==='gallery').x,'ARCHIVE GALLERY','#d4c190','gallery');this.object(ctx,ARCADE_HOOK.x,'THE UNWRITTEN','#aaa0c4','sealed');
    const shelfWidth=Math.min(520,LEGACY_BUILDS.length*68+32),shelfX=ARCADE_OBJECTS.find(o=>o.id==='gallery').x-shelfWidth/2;
    ctx.fillStyle='#20352b';ctx.fillRect(shelfX,187,shelfWidth,8);for(let i=0;i<LEGACY_BUILDS.length;i++){const x=shelfX+30+i*(shelfWidth-60)/Math.max(1,LEGACY_BUILDS.length-1);ctx.strokeStyle='#dec887'+(i<lit?'bb':'33');ctx.fillStyle=i<lit?'#e2c581':'#192c25';ctx.beginPath();ctx.moveTo(x,156);ctx.lineTo(x+12,169);ctx.lineTo(x,182);ctx.lineTo(x-12,169);ctx.closePath();ctx.fill();ctx.stroke();}
    ctx.fillStyle='#0008';ctx.beginPath();ctx.ellipse(p.x,423,31,5,0,0,Math.PI*2);ctx.fill();this.side.body(ctx,{...p,form:this.side.journey.form},p.y,.66,1);
    for(let i=0;i<35;i++){const x=(i*79+t*4)%ARCADE_WIDTH,y=140+(i*61)%265;ctx.globalAlpha=.1+(i%5)*.04;ctx.fillStyle='#d4c987';ctx.fillRect(x,y,1.5,1.5);}ctx.globalAlpha=1;
    // Foreground dust and dangling cables use bounded geometry, no new texture download.
    ctx.strokeStyle='#020c0bb5';ctx.lineWidth=7;for(let x=320;x<ARCADE_WIDTH;x+=710){ctx.beginPath();ctx.moveTo(x,0);ctx.quadraticCurveTo(x+55,175,x+30,315);ctx.stroke();}ctx.restore();
    const shade=ctx.createLinearGradient(0,0,960,0);shade.addColorStop(0,'#020707ae');shade.addColorStop(.16,'#02070700');shade.addColorStop(.82,'#02070700');shade.addColorStop(1,'#020707b0');ctx.fillStyle=shade;ctx.fillRect(0,0,960,540);ctx.fillStyle='#d2c792';ctx.font='18px Georgia';ctx.textAlign='center';ctx.fillText('THE MEMORY ARCADE',480,43);ctx.font='10px sans-serif';ctx.fillStyle='#8fa89b';ctx.fillText('THE BODY FALLS. THE SPARK REMEMBERS.',480,65);
    const near=this.near();if(Math.abs(near.x-p.x)<115){ctx.fillStyle='#0b201eea';ctx.fillRect(240,488,480,34);ctx.strokeStyle='#a4b89470';ctx.strokeRect(240,488,480,34);ctx.textAlign='center';ctx.font='13px sans-serif';ctx.fillStyle='#e7d5ad';ctx.fillText('E / RT / GATE · '+near.title,480,510,450);}ctx.restore();
  }
  cabinet(ctx,b,time){const found=this.state.discovered.includes(b.id),done=this.state.completed.includes(b.id),near=Math.abs(this.player.x-b.x)<115;ctx.save();ctx.translate(b.x,420);
    const glow=ctx.createRadialGradient(0,-145,5,0,-145,140);glow.addColorStop(0,b.color+(found?'25':'05'));glow.addColorStop(1,b.color+'00');ctx.fillStyle=glow;ctx.fillRect(-145,-285,290,295);
    ctx.fillStyle=b.material==='root'?'#26382b':b.material==='ivory'?'#39392a':b.material==='circuit'?'#20333a':b.material==='fault'?'#30283a':'#223c3b';ctx.strokeStyle=found?b.color+'c0':'#71837b5c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-60,0);ctx.lineTo(-61,-60);ctx.lineTo(-50,-83);ctx.lineTo(-58,-228);ctx.lineTo(-43,-260);ctx.lineTo(43,-260);ctx.lineTo(58,-228);ctx.lineTo(50,-83);ctx.lineTo(61,-60);ctx.lineTo(60,0);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#091816';ctx.fillRect(-40,-214,80,98);ctx.strokeStyle=b.color+(found?'8a':'30');ctx.strokeRect(-42,-216,84,102);ctx.fillStyle=found?b.color+'28':'#12241e';ctx.fillRect(-38,-211,76,92);
    ctx.save();ctx.beginPath();ctx.rect(-37,-211,74,91);ctx.clip();ctx.globalAlpha=found?.75:.15;ctx.strokeStyle=b.color;ctx.lineWidth=1.4;
    if(b.completion==='item-enhanced'){ctx.beginPath();ctx.moveTo(0,-195);ctx.lineTo(22,-179);ctx.lineTo(14,-150);ctx.lineTo(-14,-150);ctx.lineTo(-22,-179);ctx.closePath();ctx.stroke();ctx.moveTo(-9,-173);ctx.lineTo(9,-173);ctx.moveTo(0,-182);ctx.lineTo(0,-164);ctx.stroke();ctx.fillRect(-20,-137,40,3);}
    else if(b.completion==='learned-skill-powered'){ctx.beginPath();ctx.moveTo(0,-137);ctx.lineTo(0,-174);ctx.moveTo(-21,-190);ctx.lineTo(0,-174);ctx.lineTo(21,-190);ctx.stroke();for(const [x,y]of [[0,-174],[-21,-190],[21,-190],[0,-137]]){ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.stroke();}}
    else if(b.mode==='echo'){for(let i=0;i<3;i++){ctx.strokeRect(-28,-191+i*22,56,16);ctx.fillStyle=b.color+'90';ctx.fillRect(-23,-185+i*22,30-i*6,2);}}
    else if(b.mode==='descent'||b.mode==='endless'){ctx.strokeRect(-26,-195,52,53);ctx.beginPath();ctx.arc(Math.sin(time)*9,-168,6,0,Math.PI*2);ctx.stroke();for(const [x,y]of [[-15,-186],[17,-150],[-12,-144]])ctx.fillRect(x,y,3,3);if(b.mode==='endless'){for(let i=0;i<5;i++){ctx.fillStyle=b.color;ctx.fillRect(-24+i*11,-130,5,found?4+Math.sin(time+i)*2:2);}ctx.strokeStyle=b.color;ctx.beginPath();ctx.moveTo(0,-187);ctx.lineTo(9,-180);ctx.lineTo(0,-173);ctx.lineTo(-9,-180);ctx.closePath();ctx.stroke();}}
    else if(b.mode==='duel'){ctx.beginPath();ctx.moveTo(-31,-138);ctx.lineTo(31,-138);ctx.stroke();for(const [x,flip]of [[-18,1],[18,-1]]){ctx.beginPath();ctx.arc(x,-174,5,0,Math.PI*2);ctx.moveTo(x,-169);ctx.lineTo(x,-150);ctx.lineTo(x-8*flip,-138);ctx.moveTo(x,-158);ctx.lineTo(x+12*flip,-162);ctx.moveTo(x,-150);ctx.lineTo(x+7*flip,-138);ctx.stroke();}}
    else{ctx.beginPath();ctx.moveTo(-34,-139);ctx.lineTo(34,-139);ctx.moveTo(-30,-159);ctx.lineTo(-5,-159);ctx.moveTo(6,-182);ctx.lineTo(31,-182);ctx.stroke();ctx.fillRect(-20+Math.sin(time)*5,-172,6,12);}
    ctx.globalAlpha=found?.14:.03;ctx.fillStyle='#f2edc7';for(let y=-210;y<-120;y+=4)ctx.fillRect(-37,y,74,1);ctx.restore();
    ctx.fillStyle='#09221c';ctx.fillRect(-46,-86,92,20);ctx.fillStyle=b.color+(found?'d0':'50');ctx.beginPath();ctx.arc(-21,-75,4,0,Math.PI*2);ctx.fill();ctx.fillRect(10,-78,11,4);ctx.fillStyle='#050b09';ctx.fillRect(-35,-49,70,32);ctx.fillStyle=b.color+(done?'dd':'44');ctx.font='9px sans-serif';ctx.textAlign='center';ctx.fillText('v'+b.version,0,-35);ctx.fillText(done?'MEMORY RETAINED':found?'BODY PRESERVED':'SIGNAL MISSING',0,-24,65);
    ctx.strokeStyle=done?'#ecd194':'#69796955';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(0,3,done?63:47,8,0,0,Math.PI*2);ctx.stroke();if(done){ctx.fillStyle='#e6c780';ctx.beginPath();ctx.moveTo(0,17);ctx.lineTo(8,25);ctx.lineTo(0,33);ctx.lineTo(-8,25);ctx.closePath();ctx.fill();}
    ctx.fillStyle=found?'#e3d6b6':'#92a596';ctx.font='15px Georgia';ctx.fillText(b.title,0,-283);ctx.font='9px sans-serif';ctx.fillStyle=near?'#e7d19b':'#a2b5a1';ctx.fillText(found?'AUTHENTIC · '+b.version:'? · SEEK THE SIGNAL',0,-268);
    if(b.material==='root'){ctx.strokeStyle='#87a47780';ctx.beginPath();ctx.moveTo(-60,0);ctx.quadraticCurveTo(-78,-100,-53,-188);ctx.stroke();}if(b.material==='circuit'){ctx.strokeStyle='#88b4bf75';for(const x of [-48,48]){ctx.beginPath();ctx.moveTo(x,-15);ctx.lineTo(x,-57);ctx.lineTo(x*.75,-65);ctx.stroke();}}if(b.material==='fault'){ctx.strokeStyle=b.color+'88';ctx.beginPath();ctx.moveTo(-54,-190);ctx.lineTo(-45,-157);ctx.lineTo(-50,-111);ctx.moveTo(53,-72);ctx.lineTo(42,-42);ctx.lineTo(53,-13);ctx.stroke();}ctx.restore();
  }
  object(ctx,x,label,color,kind){ctx.save();ctx.translate(x,420);ctx.fillStyle='#102422';ctx.strokeStyle=color+'70';ctx.lineWidth=2;
    if(kind==='door'){ctx.beginPath();ctx.moveTo(-31,0);ctx.lineTo(-31,-158);ctx.quadraticCurveTo(0,-197,31,-158);ctx.lineTo(31,0);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#91bc9f22';ctx.fillRect(-23,-142,46,138);}
    else{ctx.fillRect(-37,-145,74,145);ctx.strokeRect(-37,-145,74,145);ctx.fillStyle=color+'35';ctx.fillRect(-28,-130,56,55);ctx.strokeStyle=color;ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,-103,18,0,Math.PI*2);ctx.stroke();if(kind==='sealed'){for(const y of [-124,-108,-92]){ctx.beginPath();ctx.moveTo(-28,y);ctx.lineTo(28,y+15);ctx.stroke();}}else if(kind==='sound'){for(let i=0;i<5;i++)ctx.fillRect(-22+i*10,-58,5,20);}else{ctx.strokeRect(-20,-118,16,24);ctx.strokeRect(5,-118,16,24);}}
    ctx.fillStyle=color;ctx.textAlign='center';ctx.font='10px sans-serif';ctx.fillText(label,0,kind==='door'?-210:-172,190);ctx.restore();
  }
  drawRelics(ctx,journey){for(const b of LEGACY_BUILDS){const d=b.discovery;if(!d||d.room!==journey.room)continue;const found=this.state.discovered.includes(b.id);ctx.save();ctx.translate(d.x,620);ctx.fillStyle='#102421';ctx.strokeStyle=b.color+(found?'66':'aa');ctx.lineWidth=2;ctx.fillRect(-25,-66,50,66);ctx.strokeRect(-25,-66,50,66);ctx.fillStyle=b.color+(found?'12':'65');ctx.fillRect(-18,-55,36,24);ctx.fillStyle=found?'#acc4b0':b.color;ctx.font='13px sans-serif';ctx.textAlign='center';ctx.fillText(found?'MEMORY RETAINED':'?',0,-216);ctx.font='9px sans-serif';ctx.fillText(d.form?'OLD TERMINAL · COMPUTER':'OLD TERMINAL',0,-199);ctx.restore();}}
  drawTrail(ctx,s,settings){if(!this.state.trail||!this.state.completed.length||settings.reduced||Math.abs(s.player.vx)<10)return;const p=s.player;ctx.save();for(let i=1;i<=7;i++){ctx.globalAlpha=(8-i)*.055;ctx.fillStyle='#f2d49a';const x=p.x-p.facing*i*12,y=p.y-40+Math.sin(s.time*5+i)*12;ctx.fillRect(x,y,2+i%2,2+i%2);}ctx.restore();}
}
