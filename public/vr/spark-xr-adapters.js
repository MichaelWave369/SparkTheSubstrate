import {createDuel, stepDuel, DUEL_MOVES, DUEL_TECHNIQUES} from '../duel-engine.js';
import {duelBody} from '../duel-spatial.js';
import {createVRPreview, stepVRPreview, vrRoomSnapshot,chooseVRPhase,nextVRForm} from './spark-vr-model.js';
import {BODIES,powerProfile,attackProfile,attackInterval,attackReach,queryAttackIntent,attackObservations,guardianThreats,morphRun,gateEntryStatus,exitPosition,enterGate} from '../action-engine.js?v=0.17.0';
import {DIRECTED_ATTACK_MODE} from '../attack-intent.js';
import {projectAttackRay,XR_ATTACK_PROJECTION_VERSION} from './spark-xr-targeting.js';
import {VesselPresentation} from './spark-vessel-presentation.js';
import {GuardianPresentation} from './spark-guardian-presentation.js';
import {MoreBouncePresentation} from './spark-more-bounce.js';
import {XR_INPUT_VERSION, XR_ADAPTER_VERSION, clamp,xrSettings,trackedMatrix} from './spark-xr-input.js';

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
  constructor(state = createVRPreview()) { this.state = state; this.presentation=new VesselPresentation();this.guardian=new GuardianPresentation();this.moreBounce=new MoreBouncePresentation();this.controls=xrSettings();this.sequence=0;this.launches=new Map();this.castSerial=0;this.observedRun=state.run; }
  syncRun(){if(this.observedRun!==this.state.run){this.presentation.reset();this.guardian.reset();this.moreBounce.reset();this.launches.clear();this.castSerial=0;this.aim=null;this.observedRun=this.state.run;}}
  observePresentation(dt=0){const s=this.snapshotBase();this.presentation.observe(s,dt);this.guardian.observe(s,dt);this.moreBounce.observe(this.state.run);}
  configureCombat(settings){this.controls=xrSettings(settings);this.aim=null;}
  observeInput(input){
    const draft=projectAttackRay(this.state.run,input,{hand:this.controls.dominantHand,assist:this.controls.aimAssist,sequence:this.sequence+1});
    if(!draft){this.aim=null;return;}
    const result=queryAttackIntent(this.state.run,draft);
    this.aim={version:XR_ATTACK_PROJECTION_VERSION,...result,draft,
      visualOriginHeight:1.65+((input.body?.height??65)-65)/100+input.hands[this.controls.dominantHand].ray[13]-input.head[13]};
  }
  step(input, dt = 1 / 60) {
    if (input?.version !== XR_INPUT_VERSION || !input.valid || input.ready===false) return false;
    this.syncRun();
    const run=this.state.run;
    const spellcraft=this.controls.combatProfile==='spellcraft',hand=this.controls.dominantHand,
      releases=input.casts||{},basic=releases[hand]||(input.cast?.hand===hand?input.cast:null),
      other=hand==='right'?'left':'right',power=spellcraft?!!(releases[other]||input.cast?.hand===other):!!input.cast;
    if(spellcraft&&(!trackedMatrix(input.head)||['left','right'].some(side=>!trackedMatrix(input.hands?.[side]?.matrix)||!trackedMatrix(input.hands?.[side]?.ray))))return false;
    if(power)this.powerBlocked=(run.player.powerCooldown??0)>0;
    let attackIntent;
    if(spellcraft&&basic){const ranged=['homing','volley'].includes(attackProfile(run).style);
      attackIntent=projectAttackRay(run,input,{hand,assist:this.controls.aimAssist,sequence:++this.sequence,cast:ranged?basic:null});
      if(!attackIntent)this.state.blockedMessage='Point the tracked casting hand into the room · aim unavailable';else this.state.blockedMessage='';}
    if(input.cycleForm)this.cycleForm();
    const movement=input.descentMovement||input.movement||{x:0,y:input.move||0};
    const physical=input.physicalDelta||{x:0,y:0},speed=BODIES[run.form].speed;
    let x=(Number.isFinite(movement.x)?movement.x:0)+(Number.isFinite(physical.x)?physical.x:0)/(speed*dt);
    let y=(Number.isFinite(movement.y)?movement.y:0)+(Number.isFinite(physical.y)?physical.y:0)/(speed*dt);
    const max=Number.isFinite(input.motionScale)?clamp(input.motionScale,.5,1):1,n=Math.max(1,Math.hypot(x,y)/max);
    x/=n;y/=n;
    stepVRPreview(this.state,{x,y,dash:input.dash===true||(input.interact===undefined&&input.dodge===true),
      power,interact:input.interact===true,...(spellcraft?{attackMode:DIRECTED_ATTACK_MODE,attackIntent}:{})},dt);
    this.observeInput(input);
    for(const event of attackObservations(run,this.castSerial)){
      this.castSerial=event.id;if(event.type==='cast')this.launches.set(event.id,{at:event.time,
        height:1.65+((input.body?.height??65)-65)/100+(input.hands?.[event.hand]?.ray?.[13]??input.head?.[13]??1.65)-(input.head?.[13]??1.65)});
    }
    for(const [id,launch]of this.launches)if(run.time-launch.at>2.5)this.launches.delete(id);
    this.observePresentation(dt);
    return true;
  }
  choose(id){chooseVRPhase(this.state,id);this.observePresentation();}
  enterGate(direction){enterGate(this.state.run,direction);this.state.ticks++;this.observePresentation();}
  morph(form){morphRun(this.state.run,form);this.state.ticks++;this.observePresentation();}
  cycleForm(){try{nextVRForm(this.state);this.observePresentation();}catch(error){this.state.blockedMessage=error.message;}}
  snapshotBase(){
    this.syncRun();
    const run=this.state.run,s=vrRoomSnapshot(this.state);
    return {...s,living:true,presentation:'descent',frame:this.state.ticks,time:run.time,
      cooldown:run.player.powerCooldown??0,attackCooldown:run.player.attackClock,
      combatProfile:this.controls.combatProfile,dominantHand:this.controls.dominantHand,aimAssist:this.controls.aimAssist,
      attackInterval:attackInterval(run),attackReach:attackReach(run),combatEvents:attackObservations(run),aim:this.aim,
      guardians:guardianThreats(run),bossDefeated:run.bossDefeated??null,
      notice:this.powerBlocked&&(run.player.powerCooldown??0)>0?'Power recovering · '+run.player.powerCooldown.toFixed(1)+'s':s.notice,
      power:powerProfile(run),weapon:attackProfile(run),dashCooldown:run.player.dashCooldown??0,
      morphCooldown:run.player.morphCooldown??0,availableForms:run.abilities.includes('morph')?Object.keys(BODIES):[],
      abilities:[...run.abilities],relics:[...(run.relics??[])],
      facing:{x:run.player.facingX,y:run.player.facingY},
      effects:run.effects.slice(-48).map(e=>({...e})),
      enemies:run.enemies.filter(e=>e.hp>0).slice(0,64).map(e=>({...e})),
      shots:run.shots.filter(e=>e.life>0).slice(0,240).map(e=>{const launch=this.launches.get(e.directed?.cast),blend=launch?Math.max(0,1-(run.time-launch.at)/.18):0;
        return {...e,visualHeight:.82+(launch?launch.height-.82:0)*blend};}),
      gates:s.gates.map(g=>({...g,position:exitPosition(g.direction),entry:gateEntryStatus(run,g.direction)}))};
  }
  snapshot(){return {...this.snapshotBase(),vessel:this.presentation.describe(this.state.run.form),
    transform:this.presentation.transform,feedback:this.presentation.feedback,
    attackAnimation:this.presentation.action,attackResult:this.presentation.result,guardianVisual:this.guardian.describe(),moreBounce:this.moreBounce.snapshot(this.state.run,this.controls)};}
  drainEvents(){return [...this.presentation.drainEvents(),...this.guardian.drainEvents(),...this.moreBounce.drainEvents()];}
  dispose(){this.presentation.reset();this.guardian.reset();this.moreBounce.reset();this.aim=null;this.launches.clear();this.castSerial=attackObservations(this.state.run).at(-1)?.id??0;}
}
