import {createDuel, stepDuel, DUEL_MOVES, DUEL_TECHNIQUES} from '../duel-engine.js';
import {duelBody} from '../duel-spatial.js';
import {createVRPreview, stepVRPreview, vrRoomSnapshot} from './spark-vr-model.js';
import {XR_INPUT_VERSION, XR_ADAPTER_VERSION, clamp} from './spark-xr-input.js';

export const ARENA_RELEASE = 'SPARK VR: ELEMENTAL ASCENSION / Rung 1';
export const duelWorldPoint = (x, y = 65, z = 0) => [z / 100, 1.65 + (y - 65) / 100, -(x - 480) / 100];

// No progress imports, recordDuel, ladder mutation, save load/write or online transport.
// This adapter owns only an ephemeral canonical best-of-three Duel encounter.
export class DuelXRAdapter {
  version = XR_ADAPTER_VERSION;
  id = 'duel';
  constructor(seed = 369) { this.seed = seed; this.restart(); }
  restart() {
    this.match = createDuel({forms: ['spark', 'archon'], stage: 'glass', profile: 'controller',
      seed: this.seed, spatial: true});
    this.serial = 0; this.events = []; this.effects = []; this.queued = null;
  }
  step(input, dt = 1 / 60) {
    if (input?.version !== XR_INPUT_VERSION || !input.valid || !input.body) return false;
    if (!Number.isFinite(dt) || Math.abs(dt - 1 / 60) > 1e-8) throw Error('Duel requires one 60 Hz authority tick.');
    const player = {x: clamp(input.move || 0, -1, 1), crouch: input.duck === true,
      spatial: {version: 1, body: input.body, cast: !!input.cast, aim: input.cast,
        dodge: input.dodge === true, dodgeDirection: input.dodgeDirection}};
    // The archon is a repeatable training opponent: visible, aimed windup then a moving bolt.
    // It uses the same trace command, startup, cooldown and damage path as the player.
    const foe = this.match.fighters[1];
    const enemy = {spatial: {version: 1, body: {forward: 0, lateral: 0, height: 65},
      cast: foe.cooldown === 0 && !foe.attack && this.match.frames % 60 === 0,
      aim: this.enemyAim()}};
    stepDuel(this.match, [player, enemy], 1);
    for (const event of this.match.events.filter(e => e.id > this.serial)) {
      this.events.push(event);
      if (['hit', 'chip', 'block', 'focus-guard'].includes(event.type)) {
        const body = duelBody(this.match.fighters[event.defender ?? event.player]);
        this.effects.push({...body, life: .3, type: event.type});
      }
      this.serial = Math.max(this.serial, event.id);
    }
    this.events = this.events.slice(-24);
    this.effects = this.effects.map(e => ({...e, life: e.life - dt})).filter(e => e.life > 0).slice(-12);
    return true;
  }
  enemyAim() {
    const f = this.match.fighters[1], target = duelBody(this.match.fighters[0]);
    const delta = [target.x - f.x + 25, target.y - 65, target.z];
    const n = Math.hypot(...delta) || 1;
    return {forward: -25, lateral: 0, height: 65, dx: delta[0] / n, dy: delta[1] / n, dz: delta[2] / n};
  }
  drainEvents() { const out = this.events; this.events = []; return out; }
  snapshot() {
    const m = this.match, [p, e] = m.fighters, body = duelBody(p);
    const attack = e.attack, startup = attack?.startup ?? DUEL_MOVES[attack?.kind]?.startup ?? 0;
    return {presentation: 'arena', release: ARENA_RELEASE, frame: m.frames,
      roomId: 'ascension', roomName: 'Threshold of Ascension', worldName: 'Duel / Threshold Glass',
      roomTheme: '#6dcfc4', worldRank: 0, form: p.form, health: p.hp, maxHealth: p.maxHp,
      enemyHealth: e.hp, enemyMaxHealth: e.maxHp, phase: m.phase, round: m.round,
      rounds: m.fighters.map(f => f.rounds), clock: Math.ceil(m.clock), winner: m.winner,
      player: {x: p.x, y: 300}, playerBody: body, dodgeCooldown: (p.dodgeCooldown ?? 0) / 60,
      cooldown: p.cooldown / 60, damage: DUEL_TECHNIQUES.spark.trace.damage,
      enemies: [{...duelBody(e), hp: e.hp, maxHp: e.maxHp, color: '#8fe9e4'}],
      bolts: m.bolts.map(b => ({x: b.x, y: b.y, z: b.z ?? 0, owner: b.owner,
        trail: b.trail.map(t => ({...t}))})),
      windup: attack && attack.frame < startup ? {progress: attack.frame / startup,
        aim: attack.aim, remaining: (startup - attack.frame) / 60} : null,
      effects: this.effects.map(e => ({...e})), choices: [], cleared: m.phase === 'finished',
      notice: m.phase === 'finished' ? (m.winner === 0 ? 'ASCENDED · Encounter won' : 'The spark returns · Try again') :
        m.phase === 'round-end' ? 'Round complete · next round begins automatically' :
        'Hold either trigger, aim, release · grip / A dodges · left grip ducks'};
  }
  dispose() { this.effects = []; this.events = []; }
}

// Example of the same presentation contract over the unchanged seven-world engine.
// Existing /vr/index.html remains the full checkpoint/progression UI for Descent.
// A host supplies explicit phase choices/save policy; generic XR never writes saves.
export class DescentXRAdapter {
  version = XR_ADAPTER_VERSION;
  id = 'descent';
  constructor(state = createVRPreview()) { this.state = state; }
  step(input, dt = 1 / 60) {
    if (input?.version !== XR_INPUT_VERSION || !input.valid) return false;
    const movement = input.descentMovement || {x: 0, y: input.move || 0};
    stepVRPreview(this.state, {...movement, dash: !!input.dodge, power: !!input.cast,
      interact: input.interact === true}, dt);
    return true;
  }
  snapshot() { return vrRoomSnapshot(this.state); }
  drainEvents() { return []; }
  dispose() {}
}
