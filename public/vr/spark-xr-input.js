// Renderer/engine-independent WebXR input contract. Metres, seconds, column-major matrices.
export const XR_INPUT_VERSION = 'spark.xr.input.v1';
export const XR_ADAPTER_VERSION = 'spark.xr.adapter.v1';
export const XR_DEFAULTS = Object.freeze({posture: 'seated', movement: .5, turn: 30,
  vignette: .4, reduced: false, haptics: true, sound: true, throwMode: 'gesture'});
export function xrSettings(raw = {}) {
  const s = {...XR_DEFAULTS};
  for (const [key, values] of Object.entries({posture: ['seated', 'standing'],
    movement: [.5, .75, 1], turn: [30, 45, 60], vignette: [0, .4, .75],
    throwMode: ['gesture', 'trigger']})) if (values.includes(raw[key])) s[key] = raw[key];
  for (const k of ['reduced', 'haptics', 'sound']) if (typeof raw[k] === 'boolean') s[k] = raw[k];
  return s;
}
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export function trackedMatrix(m) {
  if (!m || m.length !== 16 || !Array.from(m).every(Number.isFinite) ||
      Math.max(Math.abs(m[12]), Math.abs(m[13]), Math.abs(m[14])) > 50 ||
      Math.abs(m[3]) + Math.abs(m[7]) + Math.abs(m[11]) > .01 || Math.abs(m[15] - 1) > .01) return null;
  const dot = (a, b) => m[a] * m[b] + m[a + 1] * m[b + 1] + m[a + 2] * m[b + 2];
  if ([0, 4, 8].some(i => Math.abs(dot(i, i) - 1) > .08) ||
      Math.abs(dot(0, 4)) + Math.abs(dot(0, 8)) + Math.abs(dot(4, 8)) > .1) return null;
  const determinant=m[0]*(m[5]*m[10]-m[6]*m[9])-m[4]*(m[1]*m[10]-m[2]*m[9])+m[8]*(m[1]*m[6]-m[2]*m[5]);
  if(Math.abs(determinant-1)>.1)return null;
  return Array.from(m);
}
export function readXRFrame(frame, space, sources) {
  let viewer = null;
  try { viewer = frame.getViewerPose(space); } catch { /* fail closed */ }
  const head = viewer?.emulatedPosition ? null : trackedMatrix(viewer?.transform?.matrix);
  const hands = {};
  for (const source of Array.from(sources || [])) {
    if (!['left', 'right'].includes(source.handedness) || hands[source.handedness] ||
        source.gamepad?.mapping !== 'xr-standard') continue;
    const get = ref => {
      try { const pose = ref && frame.getPose(ref, space);
        return pose && !pose.emulatedPosition ? trackedMatrix(pose.transform?.matrix) : null;
      } catch { return null; }
    };
    const grip = get(source.gripSpace), ray = get(source.targetRaySpace);
    hands[source.handedness] = {grip, ray: ray || grip,
      buttons: source.gamepad.buttons || [], axes: source.gamepad.axes || [], source};
  }
  return {head, hands, viewer};
}
const button = (hand, i) => {
  const b = hand?.buttons?.[i];
  return b?.pressed === true || Number.isFinite(b?.value) && b.value > .6;
};
const axis = (hand, i) => {
  const axes = hand?.axes || [], value = axes[axes.length >= 4 ? i + 2 : i];
  return Number.isFinite(value) ? clamp(value, -1, 1) : 0;
};
const distance = (a, b) => Math.hypot(a[12] - b[12], a[13] - b[13], a[14] - b[14]);

export class SparkXRInput {
  constructor() { this.ui = {}; this.recenter(); }
  interrupt() {
    this.triggers = {left: {armed: false, down: false}, right: {armed: false, down: false}};
    this.previousHands = {}; this.last = null;
  }
  recenter() { this.base = null; this.yaw = 0; this.previousHead = null; this.interrupt(); }
  edge(key, down) { const was = this.ui[key]; this.ui[key] = !!down; return !!down && !was; }
  local(point) {
    const c = Math.cos(this.yaw), s = Math.sin(this.yaw), x = point[0], z = point[2];
    return [c * x - s * z, point[1], s * x + c * z];
  }
  poll(sample, now, {active = true, settings = XR_DEFAULTS, synthetic = false} = {}) {
    settings = xrSettings(settings);
    const {head, hands = {}} = sample, l = hands.left, r = hands.right;
    const ui = {pause: this.edge('pause', button(r, 3)), exit: this.edge('exit', button(r, 5)),
      recenter: this.edge('recenter', button(l, 5)),
      confirm: this.edge('confirm', button(r, 0) || button(l, 0))};
    const menuAxis = axis(l, 1);
    if (Math.abs(menuAxis) < .25) this.ui.menu = false;
    ui.menuMove = Math.abs(menuAxis) > .7 && !this.ui.menu ? Math.sign(menuAxis) : 0;
    if (ui.menuMove) this.ui.menu = true;
    const out = {version: XR_INPUT_VERSION, ...ui, head, hands: {}, valid: false,
      yaw:this.yaw,move: 0, cast: null, dodge: false, duck: false, body: null};
    const fail = reason => { this.interrupt(); out.reason = reason; return out; };
    if (!Number.isFinite(now) || !trackedMatrix(head)) return fail('Head tracking unavailable');
    let dt = this.last === null ? 0 : (now - this.last) / 1000;
    // Software-rendered desktop frames have no physical tracking cadence to qualify.
    if(synthetic&&dt>.25)dt=.05;
    if (dt < 0 || dt > .25) return fail('Tracking cadence interrupted');
    if (this.previousHead && distance(head, this.previousHead) > .25 + Math.max(0, dt) * 4)
      return fail('Tracking position jumped');
    if (!this.base) {
      this.base = [head[12], head[13], head[14]];
      this.yaw = Math.atan2(head[8], head[10]);
    }
    const offset = this.local([head[12] - this.base[0], head[13] - this.base[1], head[14] - this.base[2]]);
    const radius = settings.posture === 'standing' ? .55 : .45;
    if (Math.abs(offset[0]) > radius || Math.abs(offset[2]) > .35 || offset[1] < -.5 || offset[1] > .3)
      return fail('Return to your centred play space, then resume');
    for (const name of ['left', 'right']) {
      const h = hands[name];
      if (!trackedMatrix(h?.grip) || !trackedMatrix(h?.ray) || distance(h.grip, head) > 1.4)
        return fail(name + ' controller pose unavailable');
      if (this.previousHands[name] && dt > 0 && distance(h.grip, this.previousHands[name]) > .35 + dt * 12)
        return fail(name + ' controller tracking jumped');
    }
    // Turns are edge-triggered and never repeat until the stick returns to neutral.
    const turn = axis(r, 0);
    if (Math.abs(turn) < .25) this.ui.turn = false;
    if (active && Math.abs(turn) > .72 && !this.ui.turn) {
      this.yaw += Math.sign(turn) * settings.turn * Math.PI / 180; this.ui.turn = true;
    }
    const bodyOffset = this.local([head[12] - this.base[0], head[13] - this.base[1], head[14] - this.base[2]]);
    // A snap turn must not rotate an off-centre body outside the collision envelope.
    if (Math.abs(bodyOffset[2]) > .35 || Math.abs(bodyOffset[0]) > radius) return fail('Recenter before turning further');
    out.body = {forward: clamp(-bodyOffset[2] * 100, -35, 35),
      lateral: clamp(bodyOffset[0] * 100, -55, 55), height: clamp(65 + bodyOffset[1] * 100, 15, 95)};
    out.valid = true; out.yaw = this.yaw; out.base = [...this.base];
    out.move = active ? -axis(l, 1) * settings.movement : 0;
    out.duck = active && button(l, 1);
    if (out.duck) out.body.height = Math.min(out.body.height, 35);
    const dodge = this.edge('dodge', button(r, 1) || button(r, 4));
    out.dodge = active && dodge; out.dodgeDirection = axis(l, 0) > .2 ? 1 : -1;
    for (const name of ['right', 'left']) {
      const h = hands[name], t = this.triggers[name], pressed = button(h, 0);
      if (!pressed) t.armed = true;
      const localGrip = this.local([h.grip[12] - this.base[0], h.grip[13] - this.base[1], h.grip[14] - this.base[2]]);
      const direction = this.local([-h.ray[8], -h.ray[9], -h.ray[10]]);
      if (!active) { t.armed = false; t.down = false; }
      if (active && t.armed && pressed && !t.down) { t.started = now; t.down = true; }
      const charge = t.down ? clamp((now - t.started) / 900, 0, 1) : 0;
      out.hands[name] = {matrix: h.grip, charge, color: name === 'left' ? '#f6c66c' : '#6cebe2'};
      if (active && t.armed && t.down && !pressed) {
        let aim = direction, gesture = false;
        const previous = this.previousHands[name];
        if (settings.throwMode === 'gesture' && previous && dt > .003 && dt < .08) {
          const velocity = this.local([(h.grip[12] - previous[12]) / dt,
            (h.grip[13] - previous[13]) / dt, (h.grip[14] - previous[14]) / dt]);
          const speed = Math.hypot(...velocity);
          // A bounded intentional forward throw; otherwise use the current pointing ray.
          if (speed > .7 && speed < 10 && velocity[2] < -.35 * speed) {
            aim = velocity.map(v => v / speed); gesture = true;
          }
        }
        const cast = {forward: -localGrip[2] * 100, lateral: localGrip[0] * 100,
          height: 65 + localGrip[1] * 100, dx: -aim[2], dy: aim[1], dz: aim[0], hand: name, gesture};
        // No untracked origin fallback, stale transform, damage or charge bonus.
        if (Math.abs(cast.forward) <= 75 && Math.abs(cast.lateral) <= 90 && cast.height >= 5 && cast.height <= 170)
          out.cast ||= cast;
        t.down = false;
      }
      this.previousHands[name] = [...h.grip];
    }
    this.previousHead = [...head]; this.last = now;
    return out;
  }
}
