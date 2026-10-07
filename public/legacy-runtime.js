// Thin safety shell. No historical engine rules are changed here.
(() => {
  'use strict';
  const build = document.querySelector('meta[name="legacy-id"]').content;
  const mode = document.querySelector('meta[name="legacy-mode"]').content;
  const keyMap = JSON.parse(document.querySelector('meta[name="legacy-keys"]').content);
  let session = null, started = false, closed = false, muted = true, store = Object.create(null), queued = false;
  let proof = null, lastPad = [], held = new Set(), touchHeld = new Set();
  const contexts = new Set(), rafs = new Set(), intervals = new Set();
  const nativeRAF = window.requestAnimationFrame.bind(window), nativeCancel = window.cancelAnimationFrame.bind(window);
  const nativeInterval = window.setInterval.bind(window), nativeClear = window.clearInterval.bind(window);
  const send = (type, extra={}) => {if(session) parent.postMessage({type, build, session, ...extra}, '*');};
  const snapshot = () => send('legacy-save', {store:{...store}});
  const flush = () => {if(!queued&&!closed){queued=true;queueMicrotask(()=>{queued=false;snapshot();});}};
  const storage = {
    get length(){return Object.keys(store).length;}, key:i=>Object.keys(store)[i]??null,
    getItem:key=>Object.hasOwn(store,String(key))?store[String(key)]:null,
    setItem(key,value){key=String(key);value=String(value);const next={...store,[key]:value};
      if(Object.keys(next).length>32||key.length>160||value.length>1_000_000||JSON.stringify(next).length>2_000_000)throw Error('This old memory is full.');
      store[key]=value;flush();}, removeItem(key){delete store[String(key)];flush();},
    clear(){store=Object.create(null);flush();}
  };
  // No allow-same-origin is used. The browser Storage getter cannot reach parent data.
  try {
    Object.defineProperty(window,'localStorage',{value:storage,configurable:false});
    const temp=Object.create(null);
    Object.defineProperty(window,'sessionStorage',{value:{getItem:k=>temp[k]??null,setItem:(k,v)=>{temp[k]=String(v);},removeItem:k=>{delete temp[k];},clear:()=>{for(const k of Object.keys(temp))delete temp[k];}},configurable:false});
    // One device-to-PC-key bridge owns input. Some old bodies poll gamepads
    // independently with different mappings; exposing the relay twice doubles it.
    Object.defineProperty(navigator,'getGamepads',{value:()=>[],configurable:false});
    Object.defineProperty(document,'modelContext',{value:undefined,configurable:false});
  } catch(error) {parent.postMessage({type:'legacy-shell-failed',build,message:'The isolated storage shell is unavailable.'},'*');return;}
  window.fetch = async () => new Response(JSON.stringify({error:'This preserved body has no online relay.'}),{status:503,headers:{'content-type':'application/json'}});
  window.requestAnimationFrame = fn => {let id=nativeRAF(time=>{rafs.delete(id);if(!closed)fn(time);});rafs.add(id);return id;};
  window.cancelAnimationFrame = id=>{rafs.delete(id);nativeCancel(id);};
  window.setInterval = (...args)=>{const id=nativeInterval(...args);intervals.add(id);return id;};
  window.clearInterval = id=>{intervals.delete(id);nativeClear(id);};
  const NativeAudio=window.AudioContext||window.webkitAudioContext;
  if(NativeAudio){const Wrapped=function(...args){const context=new NativeAudio(...args);contexts.add(context);const resume=context.resume.bind(context);context.resume=()=>muted?Promise.resolve():resume();if(muted)void context.suspend().catch(()=>{});return context;};Wrapped.prototype=NativeAudio.prototype;window.AudioContext=Wrapped;window.webkitAudioContext=Wrapped;}
  function observe(){
    try {const s=mode==='echo'?window.Spark?.observe():mode==='duel'?window.SparkDuel?.observe():mode==='sideways'?window.SparkSideways?.observe():mode==='endless'?window.SparkDungeon?.observe():window.SparkDescent?.observe();
      if(s) {proof={phase:s.phase,winner:s.winner,cleared:s.cleared??[],life:s.life,form:s.form,mode:s.mode,floor:s.floor,floorsCleared:s.floorsCleared};
        // v0.4's observation API omits inventory. Read its own saved metadata,
        // never current progress; the historical forge remains the only writer.
        if(build==='first-forge'){let meta=null;try{meta=JSON.parse(store['spark-substrate-descent-v2']??'null')?.meta;}catch{}proof.livesRemembered=meta?.runs??0;proof.enhancedItems=Object.values(meta?.inventory??{}).filter(level=>Number.isInteger(level)&&level>=1&&level<=3).length;}
        if(build==='first-mastery'){proof.rememberedSkills=s.rememberedTraining?.[s.form]?.learned?.length??0;proof.activeSkills=s.training?.[s.form]?.learned?.length??0;proof.powersUsed=s.stats?.powers??0;}
        send('legacy-observation',{proof});}}
    catch(error){send('legacy-error',{message:String(error.message).slice(0,200)});}
  }
  const key = (name,on) => {
    if(!name) return;
    const lower=name.toLowerCase();if(on===held.has(lower))return;
    if(on)held.add(lower);else held.delete(lower);
    const target=document.activeElement?.tagName==='CANVAS'?document.activeElement:document.body;
    target.dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{key:name,code:name===' '?'Space':'',bubbles:true,cancelable:true}));
  };
  function clearInput(){touchHeld.clear();for(const name of [...held])key(name,false);lastPad=[];window.dispatchEvent(new Event('blur'));}
  function menuPad(buttons){
    const api=mode==='echo'?window.Spark?.observe():mode==='duel'?window.SparkDuel?.observe():mode==='sideways'?window.SparkSideways?.observe():window.SparkDescent?.observe();
    const dialog=document.querySelector('dialog[open]');
    const overlay=document.getElementById('game-overlay');
    const menu=!!dialog||mode==='echo'||mode==='duel'&&['select','round-end','handoff','finished'].includes(api?.phase)||mode==='sideways'&&!!api?.menu||['descent','endless'].includes(mode)&&(api?.phase!=='playing'||api?.paused||overlay&&!overlay.hidden&&overlay.querySelector('button:not([disabled])'));
    if(!menu)return false;
    const root=dialog??(mode==='echo'?document.getElementById('app'):mode==='duel'?document.getElementById(api?.phase==='select'?'duel-select':'duel-overlay'):mode==='sideways'?document.getElementById('side-overlay'):document.getElementById('game-overlay'));
    const choices=Array.from(root?.querySelectorAll('button:not([disabled])')??[]).filter(b=>b.getBoundingClientRect().width>0);
    const edge=i=>buttons[i]&&!lastPad[i];
    if(choices.length&&(edge(12)||edge(13)||edge(14)||edge(15))){let i=choices.indexOf(document.activeElement);i=(Math.max(0,i)+(edge(13)||edge(15)?1:-1)+choices.length)%choices.length;choices[i].focus({preventScroll:true});choices[i].scrollIntoView({block:'nearest'});}
    if(edge(0)&&choices.length)(choices.includes(document.activeElement)?document.activeElement:choices[0]).click();
    return true;
  }
  function padInput(pad){
    const b=pad?.buttons?.map(v=>!!v.pressed)??[];
    if(b[8]&&!lastPad[8]){dispose();return;}
    if(b[9]&&!lastPad[9]&&!document.querySelector('dialog[open]')){
      const pause=mode==='sideways'?document.getElementById('side-pause'):mode==='duel'?document.querySelector('[data-action="duel-pause"]'):document.getElementById('pause-button');
      if(pause&&!pause.disabled)pause.click();
    }
    if(menuPad(b)){for(const name of [...held])key(name,false);lastPad=b;return;}
    const x=pad?.axes?.[0]??0,y=pad?.axes?.[1]??0;
    const wanted=new Set(touchHeld);const add=(on,name)=>{if(on&&name)wanted.add(name.toLowerCase());};
    add(x<-.25||b[14],keyMap.left);add(x>.25||b[15],keyMap.right);add(y<-.4||b[12],keyMap.up);add(y>.4||b[13],keyMap.down);
    add(b[0],keyMap.jump);add(b[1],keyMap.dash);add(b[2],keyMap.primary);add(b[3],keyMap.secondary);add(b[4],keyMap.power);add(b[7],mode==='duel'?keyMap.dash:keyMap.gate);add(b[5],keyMap.vessels);
    for(const name of [...held])if(!wanted.has(name))key(name,false);for(const name of wanted)key(name,true);lastPad=b;
  }
  function dispose(){
    if(closed)return;
    try{if(mode==='sideways')window.SparkSideways?.leave();window.dispatchEvent(new Event('pagehide'));}catch{}
    observe();snapshot();send('legacy-exit',{store:{...store},proof});closed=true;clearInput();
    for(const id of rafs)nativeCancel(id);for(const id of intervals)nativeClear(id);
    for(const context of contexts)void context.close().catch(()=>{});
  }
  function boot(data){
    if(started)return;started=true;session=data.session;store=Object.assign(Object.create(null),data.store??{});muted=!!data.muted;
    // Profile and saves belong to this old body. The wrapper maps other devices to its PC controls.
    try{const settings=JSON.parse(store['spark-substrate-settings-v1']??'{}');settings.inputProfile='pc';settings.audio=false;store['spark-substrate-settings-v1']=JSON.stringify(settings);}catch{delete store['spark-substrate-settings-v1'];}
    try{
      const script=document.createElement('script');script.textContent=document.getElementById('legacy-program').textContent;document.body.append(script);
      if(['duel','sideways','endless'].includes(mode)){
        if(!window.SparkDescent?.selectProfile)throw Error('The historical entry did not boot.');
        window.SparkDescent.selectProfile('pc');
        if(mode==='sideways')window.SparkSideways.enter();else if(mode==='endless')window.SparkDungeon.enter();else document.querySelector('[data-action="entry-duel"]').click();
      }
      if(!(mode==='echo'?window.Spark:mode==='duel'?window.SparkDuel:mode==='sideways'?window.SparkSideways:mode==='endless'?window.SparkDungeon:window.SparkDescent))throw Error('The preserved body did not answer.');
      send('legacy-booted');observe();window.setInterval(observe,250);snapshot();
    }catch(error){send('legacy-error',{message:String(error.message).slice(0,200)});}
  }
  window.addEventListener('message',event=>{
    const data=event.data;if(event.source!==parent||!data||data.build!==build)return;
    if(data.type==='legacy-init'&&typeof data.session==='string'&&data.session.length>=16){boot(data);return;}
    if(!session||data.session!==session||closed)return;
    if(data.type==='legacy-dispose')dispose();
    if(data.type==='legacy-mute'){muted=!!data.muted;for(const context of contexts)void(muted?context.suspend():context.resume()).catch(()=>{});if(!muted)send('legacy-note',{message:'Cabinet sound allowed · use its original sound switch or Settings to start audio.'});}
    if(data.type==='legacy-pad')padInput(data.pad);
    if(data.type==='legacy-key'&&typeof data.key==='string'){if(data.on)touchHeld.add(data.key.toLowerCase());else touchHeld.delete(data.key.toLowerCase());key(data.key,!!data.on);}
    if(data.type==='legacy-release')clearInput();
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();dispose();}},true);
  document.addEventListener('click',event=>{const link=event.target.closest?.('a[href]');if(link){event.preventDefault();send('legacy-note',{message:'This cabinet keeps its own body. Use Return to Memory Arcade to leave.'});}},true);
  window.addEventListener('error',event=>{
    if(!started||closed)return;const resource=event.target!==window;
    send('legacy-error',{message:resource?'An asset of this old body is missing.':String(event.message??'The old body stopped answering.').slice(0,200)});
  },true);
  window.addEventListener('unhandledrejection',event=>{if(started&&!closed)send('legacy-error',{message:String(event.reason?.message??'The old body stopped answering.').slice(0,200)});});
  parent.postMessage({type:'legacy-ready',build},'*');
})();
