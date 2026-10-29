import {worldAt} from './spark-vr-model.js';
import {duelWorldPoint} from './spark-xr-adapters.js';

// Original synthesized tones; audio is optional and starts only after a user gesture.
export class XRFeedback {
  constructor() { this.context = null; this.voices = new Set(); }
  async unlock() {
    try {
      const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (Audio && !this.context) this.context = new Audio();
      await this.context?.resume?.();
    } catch { /* Silent browsers retain visual windups and impacts. */ }
  }
  event(event, snapshot, settings, sources = []) {
    if (settings.haptics && ['attack','power', 'hit', 'chip', 'dodge','morph','collect','damage','blocked','giggle'].includes(event.type)) {
      for (const source of sources) {
        if(event.hand&&source.handedness!==event.hand)continue;
        if (event.type === 'power' && event.player === 1) continue;
        try {
          const actuator = source.gamepad?.hapticActuators?.[0];
          actuator?.pulse?.(event.type==='giggle'?.08:event.type === 'hit' ? .35 : .18,event.type==='giggle'?25:45)?.catch?.(() => {});
        } catch { /* Haptics are optional. */ }
      }
    }
    const c = this.context;
    if (!settings.sound || !c || c.state !== 'running' || this.voices.size >= 8 ||
        !['attack', 'power', 'hit', 'chip', 'ko', 'dodge','morph','collect','damage','gate','ambient','miss','blocked','windup','victory','giggle','bounce-note'].includes(event.type)) return;
    try {
      const oscillator = c.createOscillator(), gain = c.createGain();
      const enemy = event.player === 1 || event.defender === 1;
      const b = enemy ? snapshot.enemies[0] : snapshot.playerBody;
      const point = snapshot.living?worldAt(event.x??snapshot.player.x,event.y??snapshot.player.y,.9):duelWorldPoint(b.x, b.y, b.z);
      const panner = c.createPanner?.();
      if (panner) {
        panner.panningModel = 'HRTF'; panner.distanceModel = 'inverse'; panner.refDistance = 1;
        if (panner.positionX) [panner.positionX.value, panner.positionY.value, panner.positionZ.value] = point;
        else panner.setPosition?.(...point);
        gain.connect(panner); panner.connect(c.destination);
      } else gain.connect(c.destination);
      oscillator.type = event.type==='giggle'?'triangle':'sine'; oscillator.frequency.setValueAtTime(event.tone??(event.type === 'attack' ? 220 : event.type === 'hit' ? 100 : 440), c.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(event.type==='ambient'?(event.tone||110)*.8:event.type === 'hit' ? 45 : (event.tone||440)*1.5, c.currentTime + .12);
      if(event.type==='giggle')for(let i=1;i<=3;i++)oscillator.frequency.setValueAtTime((event.tone||392)*(i%2?2.5:1.8),c.currentTime+i*.035);
      gain.gain.setValueAtTime(.0001, c.currentTime); gain.gain.exponentialRampToValueAtTime(event.type==='ambient'?.008:['giggle','bounce-note'].includes(event.type)?.018*(settings.reduced?.6:1):.035, c.currentTime + .012);
      gain.gain.exponentialRampToValueAtTime(.0001, c.currentTime + .16);
      oscillator.connect(gain); this.voices.add(oscillator);
      oscillator.onended = () => { this.voices.delete(oscillator); oscillator.disconnect(); gain.disconnect(); panner?.disconnect(); };
      oscillator.start(); oscillator.stop(c.currentTime + .18);
    } catch { /* Audio never owns gameplay. */ }
  }
  listener(snapshot, head, yaw) {
    const listener = this.context?.listener;
    if (!listener || !head || (!snapshot.playerBody&&!snapshot.living)) return;
    const point = snapshot.living?worldAt(snapshot.player.x,snapshot.player.y,snapshot.eyeHeight||1.65):duelWorldPoint(snapshot.playerBody.x, snapshot.playerBody.y, snapshot.playerBody.z);
    const c = Math.cos(yaw), s = Math.sin(yaw);
    const forward = [c * -head[8] - s * -head[10], -head[9], s * -head[8] + c * -head[10]];
    try {
      if (listener.positionX) {
        [listener.positionX.value, listener.positionY.value, listener.positionZ.value] = point;
        [listener.forwardX.value, listener.forwardY.value, listener.forwardZ.value] = forward;
        listener.upX.value = 0; listener.upY.value = 1; listener.upZ.value = 0;
      } else { listener.setPosition?.(...point); listener.setOrientation?.(...forward, 0, 1, 0); }
    } catch { /* Older audio implementations may remain non-spatial. */ }
  }
  stop() { for (const oscillator of this.voices) { try { oscillator.stop(); } catch {} oscillator.onended?.();oscillator.onended=null; } this.voices.clear(); }
  dispose() { this.stop(); void this.context?.close?.()?.catch?.(() => {}); this.context = null; }
}
