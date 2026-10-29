import {createDuel, stepDuel, DUEL_MOVES, DUEL_TECHNIQUES} from '../duel-engine.js';
import {duelBody} from '../duel-spatial.js';
import {createVRPreview, stepVRPreview, vrRoomSnapshot,chooseVRPhase,nextVRForm} from './spark-vr-model.js';
import {BODIES,powerProfile,attackProfile,morphRun,gateEntryStatus,exitPosition,enterGate} from '../action-engine.js?v=0.17.0';
import {VesselPresentation} from './spark-vessel-presentation.js';
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

// Real campaign adapter. Checkpoint IO remains owned by the host, using the old format.
export class DescentXRAdapter {
  version = XR_ADAPTER_VERSION;
  id = 'descent';
  constructor(state = createVRPreview()) { this.state = state; this.presentation=new VesselPresentation(); }
  step(input, dt = 1 / 60) {
    if (input?.version !== XR_INPUT_VERSION || !input.valid || input.ready===false) return false;
    const run=this.state.run;
    if(input.cast)this.powerBlocked=(run.player.powerCooldown??0)>0;
    if(input.cycleForm)this.cycleForm();
    const movement=input.descentMovement||input.movement||{x:0,y:input.move||0};
    const physical=input.physicalDelta||{x:0,y:0},speed=BODIES[run.form].speed;
    let x=(Number.isFinite(movement.x)?movement.x:0)+(Number.isFinite(physical.x)?physical.x:0)/(speed*dt);
    let y=(Number.isFinite(movement.y)?movement.y:0)+(Number.isFinite(physical.y)?physical.y:0)/(speed*dt);
    const max=Number.isFinite(input.motionScale)?clamp(input.motionScale,.5,1):1,n=Math.max(1,Math.hypot(x,y)/max);
    x/=n;y/=n;
    stepVRPreview(this.state,{x,y,dash:input.dash===true||(input.interact===undefined&&input.dodge===true),
      power:!!input.cast,interact:input.interact===true},dt);
    this.presentation.observe(this.snapshotBase(),dt);
    return true;
  }
  choose(id){chooseVRPhase(this.state,id);this.presentation.observe(this.snapshotBase(),0);}
  enterGate(direction){enterGate(this.state.run,direction);this.state.ticks++;this.presentation.observe(this.snapshotBase(),0);}
  morph(form){morphRun(this.state.run,form);this.state.ticks++;this.presentation.observe(this.snapshotBase(),0);}
  cycleForm(){try{nextVRForm(this.state);this.presentation.observe(this.snapshotBase(),0);}catch(error){this.state.blockedMessage=error.message;}}
  snapshotBase(){
    const run=this.state.run,s=vrRoomSnapshot(this.state);
    return {...s,living:true,presentation:'descent',frame:this.state.ticks,time:run.time,
      cooldown:run.player.powerCooldown??0,attackCooldown:run.player.attackClock,
      notice:this.powerBlocked&&(run.player.powerCooldown??0)>0?'Power recovering · '+run.player.powerCooldown.toFixed(1)+'s':s.notice,
      power:powerProfile(run),weapon:attackProfile(run),dashCooldown:run.player.dashCooldown??0,
      morphCooldown:run.player.morphCooldown??0,availableForms:run.abilities.includes('morph')?Object.keys(BODIES):[],
      abilities:[...run.abilities],relics:[...(run.relics??[])],
      facing:{x:run.player.facingX,y:run.player.facingY},
      effects:run.effects.slice(-48).map(e=>({...e})),
      enemies:run.enemies.filter(e=>e.hp>0).slice(0,64).map(e=>({...e})),
      shots:run.shots.filter(e=>e.life>0).slice(0,240).map(e=>({...e})),
      gates:s.gates.map(g=>({...g,position:exitPosition(g.direction),entry:gateEntryStatus(run,g.direction)}))};
  }
  snapshot(){return {...this.snapshotBase(),vessel:this.presentation.describe(this.state.run.form),
    transform:this.presentation.transform,feedback:this.presentation.feedback};}
  drainEvents(){return this.presentation.drainEvents();}
  dispose(){this.presentation.reset();}
}
