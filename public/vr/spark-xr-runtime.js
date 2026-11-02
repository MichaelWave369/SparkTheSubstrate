import {SparkXRInput, XR_ADAPTER_VERSION, xrSettings} from './spark-xr-input.js';
import {SparkVRRenderer} from './spark-vr-renderer.js';
import {readXRFrame} from './spark-xr-input.js';
import {duelWorldPoint} from './spark-xr-adapters.js';
import {worldRoot4, multiply4, projection4, lookAt4} from './spark-vr-math.js';
import {targetDescent} from './spark-xr-targeting.js';
import {XR_QUALITY} from './spark-room-themes.js';
import {XRFeedback} from './spark-xr-feedback.js';
import {xrCalibration,calibrateXRSource,presentCalibratedHands} from './spark-xr-calibration.js';
import {XR_PANEL_PAGES,panelPageFor,xrPanelModel,xrPanelPose,hitXRPanel} from './spark-xr-panel.js';
import {XRRealityDiagnostics} from './spark-xr-status.js';

export const XR_RUNTIME_VERSION = 'spark.xr.runtime.v1';
const STEP = 1 / 60;
export function xrWorldRoot(scene, input) {
  if (!input.head) return worldRoot4(0, 0);
  const head = input.head, yaw = input.yaw || 0, c = Math.cos(yaw), s = Math.sin(yaw);
  const eye = scene.playerBody ? duelWorldPoint(scene.playerBody.x, scene.playerBody.y, scene.playerBody.z) :
    [(scene.player.x - 480) / 100, 1.65+(input.body?Math.max(-.5,Math.min(.3,(input.body.height-65)/100)):0), (scene.player.y - 300) / 100];
  const root = worldRoot4(eye[0], eye[2], yaw, head[13] - eye[1]);
  root[12] += head[12]; root[14] += head[14];
  return root;
}

// One lifecycle and one simulation clock for every mode adapter and both display paths.
export class SparkXRRuntime {
  version = XR_RUNTIME_VERSION;
  constructor({canvas, adapter, settings = {}, calibration={}, onCalibration=()=>{}, onStatus = () => {}, onSnapshot = () => {},
    onMode = () => {}, onFrame = () => {}, onSession = () => {}, onSettings = () => {},
    xr = () => globalThis.navigator?.xr,
    makeRenderer = c => new SparkVRRenderer(c),
    makeLayer = (s, g, scale=.85) => new globalThis.XRWebGLLayer(s, g, {antialias: false, framebufferScaleFactor: scale}),
    raf = cb => globalThis.requestAnimationFrame(cb), caf = id => globalThis.cancelAnimationFrame(id),
    feedback = new XRFeedback()} = {}) {
    if (adapter?.version !== XR_ADAPTER_VERSION) throw Error('Unsupported XR mode adapter.');
    Object.assign(this, {canvas, adapter, onStatus, onSnapshot, onMode, onFrame, onSession, onSettings,onCalibration,
      getXR: xr, makeRenderer, makeLayer, raf, caf, feedback});
    this.settings = xrSettings(settings); this.input = new SparkXRInput();
    this.mode = 'idle'; this.paused = true; this.last = null; this.accum = 0;
    this.pending = false; this.listeners = []; this.menuIndex = 0; this.queued = {};
    this.calibration=xrCalibration(calibration);this.reality=new XRRealityDiagnostics();this.panelPage=null;this.panelSelectedIndex=0;this.panelScrollIndex=0;
    this.panelAnchor=null;this.calibrating=false;this.entryWarmup=false;this.recoveryRequested=false;this.lastInput=null;this.lastError=null;
    this.adapter.configureCombat?.(this.settings);
  }
  menu() {
    if(this.calibrating)return this.calibrationMenu();
    if(this.lastInput&&!this.lastInput.valid)return [
      ['Diagnostics: Recenter safely',()=>{this.recenter();this.focusPage('Diagnostics');}],
      ['Diagnostics: Recover when neutral',()=>this.recoverControls()],
      ['Diagnostics: Exit VR / preview',()=>void this.exit()]];
    const cycle = (key, values) => { const index = values.indexOf(this.settings[key]); this.configure({[key]: values[(index + 1) % values.length]}); };
    const entries=[
      ['Resume encounter', () => this.pause(false)],
      ['Recenter here', () => this.recenter()],
      ['Posture: ' + this.settings.posture, () => { cycle('posture', ['seated', 'standing']); this.recenter(); }],
      ['Snap turn: ' + this.settings.turn + '°', () => cycle('turn', [30, 45, 60])],
      ['Movement: ' + this.settings.movement * 100 + '%', () => cycle('movement', [.5, .75, 1])],
      ['Vignette: ' + this.settings.vignette, () => cycle('vignette', [0, .4, .75])],
      ['Visual intensity: ' + (this.settings.reduced ? 'reduced' : 'normal'), () => this.configure({reduced: !this.settings.reduced})],
      ['Haptics: ' + (this.settings.haptics ? 'on' : 'off'), () => this.configure({haptics: !this.settings.haptics})],
      ['Sound: ' + (this.settings.sound ? 'on' : 'off'), () => this.configure({sound: !this.settings.sound})],
      ['Throw: ' + this.settings.throwMode, () => cycle('throwMode', ['gesture', 'trigger'])],
      ['Restart isolated encounter', () => { this.adapter.restart?.(); this.recenter(); }],
      ['Exit VR / preview', () => { void this.exit(); }]
    ];
    const extra=this.menuExtras?.()||[];
    if(this.adapter.id==='descent'){entries[0][0]='Resume journey';entries.splice(10,1);}
    entries.splice(1,0,...extra);
    entries.splice(entries.length-1,0,['Quality: '+this.settings.quality,()=>cycle('quality',['performance','balanced','high'])]);
    entries.splice(entries.length-1,0,
      ['Calibrate hands',()=>this.setCalibration(true)],
      ['Input diagnostics',()=>this.focusPage('Diagnostics')],
      ['Panel attachment: '+this.calibration.wristSide,()=>this.configureCalibration({wristSide:this.calibration.wristSide==='left'?'right':'left'})],
      ['Panel display: '+this.calibration.panelMode,()=>this.configureCalibration({panelMode:this.calibration.panelMode==='wrist'?'floating':'wrist'})],
      ['Recover controls',()=>this.recoverControls()],
      ['Diagnostics: Recenter safely',()=>{this.recenter();this.focusPage('Diagnostics');}],
      ['Diagnostics: Recover when neutral',()=>this.recoverControls()],
      ['Diagnostics: Back to session',()=>this.focusPage('Session')]);
    const inventory=this.adapter.snapshot();
    for(const [label,values]of [['Keys',inventory.keys],['Seals',inventory.seals],['Relics',inventory.relics]]){
      const text=label+': '+(values?.join(', ')||'none');entries.splice(entries.length-1,0,['Inventory: '+text,()=>{this.pauseReason=text;}]);
    }
    return entries;
  }
  focusPage(page){
    const s=this.adapter.snapshot(),menu=this.menu();this.panelPage=page;
    this.menuIndex=menu.findIndex(([label])=>panelPageFor(label,s.choices)===page);this.panelSelectedIndex=this.menuIndex;this.panelScrollIndex=this.menuIndex;
  }
  configureCalibration(patch){
    const next={...this.calibration,...patch};
    for(const group of ['grip','ray'])next[group]=Object.fromEntries(['left','right'].map(side=>[side,{...this.calibration[group][side],...patch[group]?.[side]}]));
    this.calibration=xrCalibration(next);this.pause(true,'Calibration updated · release controls before resuming');this.onCalibration(this.calibration);
  }
  setCalibration(open=true){this.calibrating=!!open;this.pause(true,open?'Calibration · campaign paused; no attacks or rewards':'Calibration complete · resume when ready');this.focusPage(open?'Calibration':'Session');}
  calibrationMenu(){
    const target=this.calibrationSide||'both',side=target==='both'?'right':target,c=this.calibration,
      cycle=(values,value)=>values[(values.findIndex(v=>Math.abs(v-value)<.001)+1)%values.length],
      adjust=(group,key,values)=>{const patch={[group]:{}};for(const s of (target==='both'?['left','right']:[target]))patch[group][s]={[key]:cycle(values,c[group][s][key])};this.configureCalibration(patch);};
    return [['Calibration: Finish / back',()=>this.setCalibration(false)],
      ['Calibration: Hand '+target,()=>{this.calibrationSide=target==='both'?'left':target==='left'?'right':'both';}],
      ['Calibration: Size '+Math.round(c.scale*100)+'%',()=>this.configureCalibration({scale:cycle([.75,.9,1,1.1],c.scale)})],
      ['Calibration: Grip lift '+Math.round(c.grip[side].height*100)+' cm',()=>adjust('grip','height',[-.04,-.02,0,.02,.04])],
      ['Calibration: Grip depth '+Math.round(c.grip[side].depth*100)+' cm',()=>adjust('grip','depth',[-.04,-.02,0,.02,.04])],
      ['Calibration: Grip angle '+c.grip[side].pitch+'°',()=>adjust('grip','pitch',[-20,-10,0,10,20])],
      ['Calibration: Grip roll '+c.grip[side].roll+'°',()=>adjust('grip','roll',[-20,-10,0,10,20])],
      ['Calibration: Ray pitch '+c.ray[side].pitch+'°',()=>adjust('ray','pitch',[-10,-5,0,5,10])],
      ['Calibration: Ray yaw '+c.ray[side].yaw+'°',()=>adjust('ray','yaw',[-10,-5,0,5,10])],
      ['Calibration: Reset defaults',()=>this.configureCalibration(xrCalibration())],
      ['Calibration: Recenter display',()=>this.recenter()],
      ['Calibration: Exit VR / preview',()=>void this.exit()]];
  }
  recoverControls(){this.recoveryRequested=true;this.pause(true,'Recovery requested · release triggers and grips, centre both sticks');}
  configure(patch) { this.settings = xrSettings({...this.settings, ...patch}); this.adapter.configureCombat?.(this.settings);this.input.interrupt(); this.queued = {}; this.onSettings(this.settings);
    if(['combatProfile','dominantHand','aimAssist','throwMode'].some(k=>Object.hasOwn(patch,k)))this.pause(true,'Combat controls changed · release controls, then resume');}
  pause(value = !this.paused, reason = '') {
    if(this.calibrating&&!value){this.setCalibration(false);return;}
    if(this.paused!==value||this.pauseReason!==reason)this.panelAnchor=null;
    this.paused = value; this.pauseReason = reason; this.last = null; this.accum = 0;
    this.queued = {}; this.input.interrupt(); this.feedback.stop();
    this.onStatus(value ? reason || 'Paused · left stick selects comfort options, trigger confirms' : 'Encounter resumed');
  }
  recenter() { this.input.recenter(); this.pause(true, 'Recentered · release triggers, then resume'); }
  advance(now, sample) {
    const input = this.input.poll(calibrateXRSource(sample,this.calibration), now, {active: !this.paused&&!this.calibrating, settings: this.settings, synthetic:this.mode==='desktop'});
    this.lastInput=input;
    if(this.mode==='desktop'&&input.head){const h=input.head,eye=[h[12],h[13],h[14]],inverse=lookAt4(eye,eye.map((v,i)=>v-h[8+i]));
      this.panelViews=[{inverse,projection:projection4(Math.PI/2.7,(this.canvas?.clientWidth||600)/(this.canvas?.clientHeight||600),.04,25)}];}
    if (input.exit) { void this.exit(); return {input, scene: this.adapter.snapshot()}; }
    if (input.recenter){this.entryWarmup=false;this.recenter();}
    if(input.uiReady&&input.wrist){this.entryWarmup=false;this.recoveryRequested=false;this.pause(!this.paused,'Spark wrist');}
    if (!input.valid){if(!this.paused||this.pauseReason!==input.reason)this.pause(true, input.reason);}
    else if (input.pause){this.entryWarmup=false;this.recoveryRequested=false;this.pause(!this.paused);}
    if((this.entryWarmup||this.recoveryRequested)&&input.valid&&input.neutral&&!input.pause&&!input.wrist&&!input.confirm){
      this.entryWarmup=false;this.recoveryRequested=false;this.pause(this.calibrating,this.calibrating?'Calibration · campaign paused':'');input.ready=false;
    }
    if(this.paused&&input.uiReady&&!input.wrist&&!input.pause&&!this.entryWarmup&&!this.recoveryRequested){
      const menu = this.menu();
      if(this.menuIndex>=menu.length||this.menuIndex<0&&!this.panelPage)this.menuIndex=0;
      const current=this.adapter.snapshot();
      if(this.menuIndex!==this.panelSelectedIndex||!this.panelPage){this.panelPage=panelPageFor(menu[this.menuIndex]?.[0]||'',current.choices);this.panelScrollIndex=this.menuIndex;}
      if(!input.valid)this.panelPage='Diagnostics';if(this.calibrating)this.panelPage='Calibration';
      if(input.menuPage&&!this.calibrating&&input.valid){const at=XR_PANEL_PAGES.indexOf(this.panelPage);this.focusPage(XR_PANEL_PAGES[(Math.max(0,at)+input.menuPage+5)%5]);}
      // Recovery uses a smaller command registry. Remap the selection when the
      // full registry returns so a displayed recovery row cannot activate Resume.
      if(panelPageFor(menu[this.menuIndex]?.[0]||'',current.choices)!==this.panelPage){
        this.menuIndex=menu.findIndex(([label])=>panelPageFor(label,current.choices)===this.panelPage);this.panelScrollIndex=this.menuIndex;
      }
      let model=xrPanelModel(menu,{...current,calibration:this.calibrating,recoveryOnly:!input.valid},this.menuIndex,this.panelPage,this.panelScrollIndex);
      if(input.menuMove&&model.items.length){const at=model.items.findIndex(x=>x.global===this.menuIndex);this.menuIndex=model.items[(Math.max(0,at)+input.menuMove+model.items.length)%model.items.length].global;this.panelScrollIndex=this.menuIndex;this.pointerNav=false;}
      this.panelAnchor||=input.head&&[...input.head];
      const pose=input.head?xrPanelPose(input.head,input.hands,this.calibration,this.panelAnchor,this.panelViews):null,
        pointer=pose?hitXRPanel(pose.matrix,input.hands[this.calibration.wristSide==='left'?'right':'left']?.ray,model):null;
      if(pointer&&(!this.lastPointer||Math.hypot(pointer.x-this.lastPointer.x,pointer.y-this.lastPointer.y)>12))this.pointerNav=true;
      if(input.menuMove||input.menuPage)this.pointerNav=false;
      if(pointer?.kind==='row'&&this.pointerNav)this.menuIndex=pointer.index;
      this.lastPointer=pointer;this.panelSelectedIndex=this.menuIndex;
      if(input.confirm){try{
        if(pointer?.kind==='tab'&&this.pointerNav)this.focusPage(pointer.page);
        else menu[this.menuIndex]?.[1]();
      }catch(error){this.onStatus(error.message);this.pauseReason=error.message;}this.input.interrupt();this.queued={};}
    }
    const delta = this.last === null ? 0 : (now - this.last) / 1000;
    this.last = now;
    if (!this.paused && !this.calibrating && input.valid && !input.pause && !input.confirm && !input.recenter && !input.wrist && input.ready!==false) {
      // Retain release/dodge edges across high-refresh render frames until one sim tick consumes them.
      if (input.cast) this.queued.cast ||= input.cast;
      for(const hand of ['left','right'])if(input.casts?.[hand]){this.queued.casts||={};this.queued.casts[hand]||=input.casts[hand];}
      for(const key of ['interact','dash','cycleForm'])if(input[key])this.queued[key]=true;
      const physical=this.queued.physicalDelta||{x:0,y:0};
      this.queued.physicalDelta={x:physical.x+(input.physicalDelta?.x||0),y:physical.y+(input.physicalDelta?.y||0)};
      if (input.dodge) { this.queued.dodge = true; this.queued.dodgeDirection = input.dodgeDirection; }
      this.accum = Math.min(.08, this.accum + Math.max(0, Math.min(.05, delta)));
      let ticks = 0;
      while (this.accum + 1e-9 >= STEP && ticks++ < 4) {
        this.adapter.step({...input, cast: this.queued.cast || null, dodge: !!this.queued.dodge,
          casts:this.queued.casts||{},
          dodgeDirection: this.queued.dodgeDirection,interact:!!this.queued.interact,dash:!!this.queued.dash,
          cycleForm:!!this.queued.cycleForm,physicalDelta:this.queued.physicalDelta||{x:0,y:0}}, STEP);
        this.queued = {}; this.accum -= STEP;
      }
    } else { this.accum = 0; this.queued = {}; }
    const scene = this.adapter.snapshot();
    if(scene.living&&input.valid&&!this.paused){this.adapter.observeInput?.(input);scene.aim=this.adapter.aim;}
    if(scene.living&&scene.choices?.length&&!this.paused){this.menuIndex=1;this.panelPage='Combat';this.panelSelectedIndex=1;this.panelScrollIndex=1;this.pause(true,'Choose the next chapter');}
    if(scene.living&&input.valid)scene.target=targetDescent(scene,input.hands,xrWorldRoot(scene,input));
    scene.eyeHeight=1.65+(scene.living&&input.body?(input.body.height-65)/100:0);
    scene.quality=this.settings.quality;scene.reduced=this.settings.reduced;
    scene.paused = this.paused; scene.pauseReason = this.pauseReason;
    scene.menuIndex = this.menuIndex;
    scene.calibration=this.calibrating;scene.panelScale=this.calibration.panelScale;scene.panelAnchor=this.panelAnchor||input.head;scene.xrCalibration=this.calibration;
    scene.recoveryOnly=!input.valid;
    scene.inputState=input.status;scene.rearmBlocks=input.rearmBlocks||[];
    const collision=this.adapter.motionStatus?.blocked===true;
    scene.diagnostics=this.reality.observe({session:this.mode,mode:this.adapter.id,input,paused:this.paused,calibrating:this.calibrating,pending:this.pending,quality:this.settings.quality,collision,error:this.lastError});
    scene.movementStatus=collision?(this.adapter.id==='duel'?'Native combat movement restriction or arena edge':'Native collision or room edge · move away from cover'):this.adapter.motionStatus?.reason||'';
    scene.statusMessage=!input.valid?input.reason:this.recoveryRequested&&!input.neutral?'Release '+(input.rearmBlocks||[]).join(', ')+' · recovery waiting':input.ready===false&&!this.paused?input.status?.reason:collision?scene.movementStatus:'';
    const frameMenu=this.paused||this.calibrating||scene.statusMessage?this.menu():[];
    scene.menuLabels=frameMenu.map(item=>item[0]);
    scene.panel=xrPanelModel(frameMenu,scene,this.menuIndex,this.calibrating?'Calibration':!input.valid?'Diagnostics':this.panelPage,this.panelScrollIndex);
    scene.panelPlacement=input.head?xrPanelPose(input.head,input.hands,this.calibration,scene.panelAnchor,this.panelViews):null;
    scene.panel.pointer=this.lastPointer;
    if (this.settings.reduced && scene.effects) scene.effects = scene.effects.slice(-1);
    this.feedback.listener(scene, input.head, input.yaw || 0);
    for (const event of this.adapter.drainEvents?.() || [])if(!this.paused)
      this.feedback.event(event, scene, this.settings, Array.from(this.session?.inputSources || []));
    if(scene.living)input.hands=this.adapter.presentation.hands(input.hands,scene.form,scene.cooldown,scene);
    input.hands=presentCalibratedHands(input.hands,this.calibration);
    for(const hand of Object.values(input.hands))hand.calibration=this.calibrating;
    this.onSnapshot(scene);
    return {input, scene};
  }
  ensureRenderer() {
    if (!this.renderer) {
      this.renderer = this.makeRenderer(this.canvas);
      this.contextLost = event => { event.preventDefault();this.lastError='WEBGL_CONTEXT_LOST';this.onStatus('Graphics context lost · exiting'); void this.exit(); };
      this.canvas?.addEventListener?.('webglcontextlost', this.contextLost);
    }
    return this.renderer;
  }
  listen(target, event, fn) { target.addEventListener?.(event, fn); this.listeners.push(() => target.removeEventListener?.(event, fn)); }
  async enter() {
    if (this.pending || this.session){this.onStatus(this.pending?'VR permission request pending · finish or cancel the browser prompt':'VR is already active · exit before changing display path');return false;}
    this.pending = true;this.lastError=null;this.reality.observe({session:this.mode,mode:this.adapter.id,pending:true,quality:this.settings.quality});this.onStatus('Requesting immersive VR · accept the Quest Browser prompt');this.onMode(this.mode);let session;
    const generation=this.generation=(this.generation||0)+1;
    try {
      const api = this.getXR();
      if (!api?.requestSession) throw Error('WebXR unavailable · use desktop preview or Quest Browser over HTTPS');
      void this.feedback.unlock();
      session = await api.requestSession('immersive-vr', {optionalFeatures: ['local-floor']});
      if(this.generation!==generation){try{await session.end();}catch{}return false;}
      this.stopDesktop(); this.session = session; this.mode = 'xr';
      this.listen(session, 'end', () => { if (this.session === session) this.cleanup(); });
      this.listen(session, 'visibilitychange', () => { if (session.visibilityState !== 'visible') this.pause(true, 'Headset visibility interrupted'); });
      this.listen(session, 'inputsourceschange', () => this.pause(true, 'Controllers changed · release triggers before resuming'));
      const renderer = this.ensureRenderer();
      await renderer.gl.makeXRCompatible?.();
      if (this.session !== session) return false;
      this.layer = this.makeLayer(session, renderer.gl,XR_QUALITY[this.settings.quality].scale);
      session.updateRenderState({baseLayer: this.layer, depthNear: .04, depthFar: XR_QUALITY[this.settings.quality].far});
      let kind = 'local-floor';
      let space;
      try { space = await session.requestReferenceSpace(kind); }
      catch { kind = 'local'; space = await session.requestReferenceSpace(kind); }
      if (this.session !== session) return false;
      this.space=space;
      this.listen(this.space, 'reset', () => this.recenter());
      this.input.recenter();this.entryWarmup=true;this.pause(this.calibrating,this.calibrating?'Calibration · campaign paused':'');this.onMode(this.mode);this.onSession('start', kind);
      this.frameId = session.requestAnimationFrame((t, f) => this.xrFrame(t, f));
      return true;
    } catch (error) {
      this.lastError=error.name==='NotAllowedError'?'PERMISSION_DENIED':error.name==='NotSupportedError'?'XR_UNSUPPORTED':'XR_LAUNCH_FAILED';
      if (session) { try { await session.end(); } catch {} this.cleanup(); }
      this.onStatus('Unable to enter VR: ' + error.message);
      return false;
    } finally { this.pending = false;this.reality.observe({session:this.mode,mode:this.adapter.id,input:this.lastInput,paused:this.paused,quality:this.settings.quality,error:this.lastError});this.onMode(this.mode); }
  }
  xrFrame(now, frame) {
    const session = this.session; if (!session || this.mode !== 'xr') return;
    try {
      if (session.visibilityState !== 'visible') this.pause(true, 'Headset visibility interrupted');
      const sample = readXRFrame(frame, this.space, session.inputSources);sample.visible=session.visibilityState==='visible';
      this.panelViews=sample.viewer?.views?.map(v=>({projection:v.projectionMatrix,inverse:v.transform.inverse.matrix}))||[];
      const {input, scene} = this.advance(now, sample);
      if (this.session !== session) return;
      if (sample.viewer && input.head) {
        const root = xrWorldRoot(scene, input);
        const views = sample.viewer.views.map(v => ({viewport: this.layer.getViewport(v),
          projection: v.projectionMatrix, inverse: v.transform.inverse.matrix,
          matrix: multiply4(v.projectionMatrix, multiply4(v.transform.inverse.matrix, root))}));
        const start = performance.now();
        this.renderer.render(views, scene, {framebuffer: this.layer.framebuffer, hudPose: input.head,
          hands: input.hands, reduced: this.settings.reduced,
          vignette: !input.valid ? .75 : this.settings.vignette});
        this.onFrame({timestamp: now, viewCount: views.length, renderSubmissionMs: performance.now() - start,
          left: !!input.hands.left, right: !!input.hands.right});
      }
      this.frameId = session.requestAnimationFrame((t, f) => this.xrFrame(t, f));
    } catch (error) {this.lastError='XR_FRAME_FAILED';this.onStatus('XR frame failed: ' + error.message); void this.exit(); }
  }
  startDesktop(readSample) {
    if (this.session || this.pending){this.onStatus(this.session?'Exit immersive VR before starting desktop preview':'Finish or cancel the VR permission prompt first');return false;}
    this.stopDesktop(); this.ensureRenderer(); void this.feedback.unlock();
    this.mode = 'desktop';this.lastError=null;this.input.recenter();this.pause(this.calibrating,this.calibrating?'Calibration · campaign paused':'');this.onMode(this.mode);
    const draw = now => {
      if (this.mode !== 'desktop') return;
      try {
        const {input, scene} = this.advance(now, readSample(now));
        if (this.mode !== 'desktop') return;
        this.drawPreview({input,scene});
        this.desktopId = this.raf(draw);
      } catch (error) { this.pause(true, 'Preview error: ' + error.message); }
    };
    this.desktopId = this.raf(draw); return true;
  }
  drawPreview({input,scene}){
        const ratio = Math.min(globalThis.devicePixelRatio || 1, 2);
        const w = Math.max(2, Math.floor(this.canvas.clientWidth * ratio)), h = Math.max(2, Math.floor(this.canvas.clientHeight * ratio));
        this.canvas.width = w; this.canvas.height = h;
        const projection = projection4(Math.PI / 2.7, w / h, .04, XR_QUALITY[this.settings.quality].far);
        const head = input.head, direction = head ? [-head[8], -head[9], -head[10]] : [0, 0, -1];
        const eye = head ? [head[12], head[13], head[14]] : [0, 1.65, 0];
        const inverse = lookAt4(eye, eye.map((v, i) => v + direction[i]));
        this.renderer.render([{viewport: {x: 0, y: 0, width: w, height: h}, projection, inverse,
          matrix: multiply4(projection, multiply4(inverse, xrWorldRoot(scene, input)))}], scene,
        {hudPose: head, hands: input.hands, reduced: this.settings.reduced, vignette: this.settings.vignette});
  }
  stopDesktop() { if (this.desktopId != null) this.caf(this.desktopId); this.desktopId = null; }
  async exit() {
    const session = this.session;
    if (session) { try { await session.end(); } catch {} }
    if(!session||this.session===session)this.cleanup();
  }
  cleanup() {
    this.generation=(this.generation||0)+1;
    this.stopDesktop();
    if (this.session && this.frameId != null) { try { this.session.cancelAnimationFrame(this.frameId); } catch {} }
    const wasXR = !!this.session;
    for (const detach of this.listeners.splice(0)) detach();
    this.session = null; this.space = null; this.layer = null; this.frameId = null;
    this.mode = 'idle'; this.pause(true, 'Session ended · encounter remains in memory'); this.input.recenter();
    this.entryWarmup=false;this.recoveryRequested=false;this.lastInput=null;this.panelPage=null;this.panelSelectedIndex=0;this.panelScrollIndex=0;this.menuIndex=0;this.lastPointer=null;
    this.calibrating=false;this.panelViews=[];this.reality.observe({session:'idle',mode:this.adapter.id,quality:this.settings.quality,error:this.lastError});
    this.canvas?.removeEventListener?.('webglcontextlost', this.contextLost);
    this.renderer?.dispose(); this.renderer = null;
    this.adapter.onSessionEnd?.();
    if (wasXR) this.onSession('end'); this.onMode(this.mode);
  }
  async dispose() { await this.exit(); this.feedback.dispose(); this.adapter.dispose?.(); }
}
