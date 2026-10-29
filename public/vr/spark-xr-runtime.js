import {SparkXRInput, XR_ADAPTER_VERSION, xrSettings} from './spark-xr-input.js';
import {SparkVRRenderer} from './spark-vr-renderer.js';
import {readXRFrame} from './spark-xr-input.js';
import {duelWorldPoint} from './spark-xr-adapters.js';
import {worldRoot4, multiply4, projection4, lookAt4} from './spark-vr-math.js';
import {targetDescent} from './spark-xr-targeting.js';
import {XR_QUALITY} from './spark-room-themes.js';
import {XRFeedback} from './spark-xr-feedback.js';

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
  constructor({canvas, adapter, settings = {}, onStatus = () => {}, onSnapshot = () => {},
    onMode = () => {}, onFrame = () => {}, onSession = () => {}, onSettings = () => {},
    xr = () => globalThis.navigator?.xr,
    makeRenderer = c => new SparkVRRenderer(c),
    makeLayer = (s, g, scale=.85) => new globalThis.XRWebGLLayer(s, g, {antialias: false, framebufferScaleFactor: scale}),
    raf = cb => globalThis.requestAnimationFrame(cb), caf = id => globalThis.cancelAnimationFrame(id),
    feedback = new XRFeedback()} = {}) {
    if (adapter?.version !== XR_ADAPTER_VERSION) throw Error('Unsupported XR mode adapter.');
    Object.assign(this, {canvas, adapter, onStatus, onSnapshot, onMode, onFrame, onSession, onSettings,
      getXR: xr, makeRenderer, makeLayer, raf, caf, feedback});
    this.settings = xrSettings(settings); this.input = new SparkXRInput();
    this.mode = 'idle'; this.paused = true; this.last = null; this.accum = 0;
    this.pending = false; this.listeners = []; this.menuIndex = 0; this.queued = {};
  }
  menu() {
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
    return entries;
  }
  configure(patch) { this.settings = xrSettings({...this.settings, ...patch}); this.input.interrupt(); this.queued = {}; this.onSettings(this.settings); }
  pause(value = !this.paused, reason = '') {
    this.paused = value; this.pauseReason = reason; this.last = null; this.accum = 0;
    this.queued = {}; this.input.interrupt(); this.feedback.stop();
    this.onStatus(value ? reason || 'Paused · left stick selects comfort options, trigger confirms' : 'Encounter resumed');
  }
  recenter() { this.input.recenter(); this.pause(true, 'Recentered · release triggers, then resume'); }
  advance(now, sample) {
    const input = this.input.poll(sample, now, {active: !this.paused, settings: this.settings, synthetic:this.mode==='desktop'});
    if (input.exit) { void this.exit(); return {input, scene: this.adapter.snapshot()}; }
    if (input.recenter) this.recenter();
    if(input.valid&&input.wrist)this.pause(!this.paused,'Spark wrist');
    if (!input.valid) this.pause(true, input.reason);
    else if (input.pause) this.pause(!this.paused);
    else if (this.paused) {
      const menu = this.menu();
      this.menuIndex = (this.menuIndex + input.menuMove + menu.length) % menu.length;
      if (input.confirm){try{menu[this.menuIndex][1]();}catch(error){this.onStatus(error.message);this.pauseReason=error.message;}this.input.interrupt();this.queued={};}
    }
    const delta = this.last === null ? 0 : (now - this.last) / 1000;
    this.last = now;
    if (!this.paused && input.valid && !input.pause && !input.confirm && !input.recenter && !input.wrist && input.ready!==false) {
      // Retain release/dodge edges across high-refresh render frames until one sim tick consumes them.
      if (input.cast) this.queued.cast ||= input.cast;
      for(const key of ['interact','dash','cycleForm'])if(input[key])this.queued[key]=true;
      const physical=this.queued.physicalDelta||{x:0,y:0};
      this.queued.physicalDelta={x:physical.x+(input.physicalDelta?.x||0),y:physical.y+(input.physicalDelta?.y||0)};
      if (input.dodge) { this.queued.dodge = true; this.queued.dodgeDirection = input.dodgeDirection; }
      this.accum = Math.min(.08, this.accum + Math.max(0, Math.min(.05, delta)));
      let ticks = 0;
      while (this.accum + 1e-9 >= STEP && ticks++ < 4) {
        this.adapter.step({...input, cast: this.queued.cast || null, dodge: !!this.queued.dodge,
          dodgeDirection: this.queued.dodgeDirection,interact:!!this.queued.interact,dash:!!this.queued.dash,
          cycleForm:!!this.queued.cycleForm,physicalDelta:this.queued.physicalDelta||{x:0,y:0}}, STEP);
        this.queued = {}; this.accum -= STEP;
      }
    } else { this.accum = 0; this.queued = {}; }
    const scene = this.adapter.snapshot();
    if(scene.living&&scene.choices?.length&&!this.paused){this.menuIndex=1;this.pause(true,'Choose the next chapter');}
    if(scene.living&&input.valid)scene.target=targetDescent(scene,input.hands,xrWorldRoot(scene,input));
    scene.eyeHeight=1.65+(scene.living&&input.body?(input.body.height-65)/100:0);
    scene.quality=this.settings.quality;scene.reduced=this.settings.reduced;
    scene.paused = this.paused; scene.pauseReason = this.pauseReason;
    scene.menuIndex = this.menuIndex; scene.menuLabels = this.menu().map(item => item[0]);
    if (this.settings.reduced && scene.effects) scene.effects = scene.effects.slice(-1);
    this.feedback.listener(scene, input.head, input.yaw || 0);
    for (const event of this.adapter.drainEvents?.() || [])
      this.feedback.event(event, scene, this.settings, Array.from(this.session?.inputSources || []));
    if(scene.living)input.hands=this.adapter.presentation.hands(input.hands,scene.form,scene.cooldown);
    this.onSnapshot(scene);
    return {input, scene};
  }
  ensureRenderer() {
    if (!this.renderer) {
      this.renderer = this.makeRenderer(this.canvas);
      this.contextLost = event => { event.preventDefault(); this.onStatus('Graphics context lost · exiting'); void this.exit(); };
      this.canvas?.addEventListener?.('webglcontextlost', this.contextLost);
    }
    return this.renderer;
  }
  listen(target, event, fn) { target.addEventListener?.(event, fn); this.listeners.push(() => target.removeEventListener?.(event, fn)); }
  async enter() {
    if (this.pending || this.session) return false;
    this.pending = true; let session;
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
      this.input.recenter(); this.pause(false); this.onMode(this.mode); this.onSession('start', kind);
      this.frameId = session.requestAnimationFrame((t, f) => this.xrFrame(t, f));
      return true;
    } catch (error) {
      if (session) { try { await session.end(); } catch {} this.cleanup(); }
      this.onStatus('Unable to enter VR: ' + error.message);
      return false;
    } finally { this.pending = false; }
  }
  xrFrame(now, frame) {
    const session = this.session; if (!session || this.mode !== 'xr') return;
    try {
      if (session.visibilityState !== 'visible') this.pause(true, 'Headset visibility interrupted');
      const sample = readXRFrame(frame, this.space, session.inputSources);sample.visible=session.visibilityState==='visible';
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
    } catch (error) { this.onStatus('XR frame failed: ' + error.message); void this.exit(); }
  }
  startDesktop(readSample) {
    if (this.session || this.pending) return false;
    this.stopDesktop(); this.ensureRenderer(); void this.feedback.unlock();
    this.mode = 'desktop'; this.input.recenter(); this.pause(false); this.onMode(this.mode);
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
    this.cleanup();
  }
  cleanup() {
    this.generation=(this.generation||0)+1;
    this.stopDesktop();
    if (this.session && this.frameId != null) { try { this.session.cancelAnimationFrame(this.frameId); } catch {} }
    const wasXR = !!this.session;
    for (const detach of this.listeners.splice(0)) detach();
    this.session = null; this.space = null; this.layer = null; this.frameId = null;
    this.mode = 'idle'; this.pause(true, 'Session ended · encounter remains in memory'); this.input.recenter();
    this.canvas?.removeEventListener?.('webglcontextlost', this.contextLost);
    this.renderer?.dispose(); this.renderer = null;
    if (wasXR) this.onSession('end'); this.onMode(this.mode);
  }
  async dispose() { await this.exit(); this.feedback.dispose(); this.adapter.dispose?.(); }
}
