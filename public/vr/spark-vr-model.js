// One immersive presentation of canonical Spark Descent, not a second game engine.
// All game rules, room locks, karma, gifts, morphing and boss phases stay in action-engine.
import {
  BODIES, BOONS, WIDTH, HEIGHT, ROOMS, createMeta, createRun, obstacles,
  gateStatus, nearestGate, stepRun, observeRun, chooseBoon, resolveChamber,
  resolveMilestone, morphRun, validRun, validMeta, pendingKey, pendingRelic,
  settleRun, offeredForms
} from '../action-engine.js?v=0.17.0';
import {WORLDS,worldOf,WORLD_ORDER} from '../worlds.js?v=0.17.0';

export const VR_ROOMS=Object.freeze(Object.keys(ROOMS));
export const VR_WORLDS=Object.freeze([...WORLD_ORDER]);
export const VR_FORMS=Object.freeze(Object.keys(BODIES));
export const VR_WORLD_SCALE=100;
export const VR_SIM_STEP=1/60;
export const VR_SNAP_RADIANS=Math.PI/6;

export const worldAt=(x,y,height=0)=>[
  (x-WIDTH/2)/VR_WORLD_SCALE,height,(y-HEIGHT/2)/VR_WORLD_SCALE
];
export const engineAt=(x,z)=>({
  x:x*VR_WORLD_SCALE+WIDTH/2,
  y:z*VR_WORLD_SCALE+HEIGHT/2
});

export function createVRPreview(seed=369){
  if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)
    throw Error('VR preview requires a bounded integer seed.');
  const meta=createMeta();
  return {meta,run:createRun(meta,'spark',seed),blockedMessage:'',ticks:0,
    pendingRebirth:false};
}
export function resumeVRPreview(meta,run){
  // An isolated VR checkpoint is still subject to the canonical save validators.
  if(!validMeta(meta)||!validRun(run)||run.daily||run.dungeon||run.rematch||
    run.partner||!VR_ROOMS.includes(run.room))
    throw Error('The saved VR journey is not a valid solo Spark Descent run.');
  return {meta:structuredClone(meta),run:structuredClone(run),blockedMessage:'',
    ticks:0,pendingRebirth:!!run.settled&&['dead','won'].includes(run.phase)};
}
const deadzone=(v,limit=.18)=>{
  if(!Number.isFinite(v)||Math.abs(v)<=limit)return 0;
  return Math.sign(v)*(Math.abs(v)-limit)/(1-limit);
};

// Head-relative left-stick motion; world root yaw only adjusts the view,
// never bypasses canonical engine collision or movement speed.
export function stickToGame(stickX,stickY,headMatrix,rootYaw=0){
  if(!headMatrix||headMatrix.length!==16||!Number.isFinite(rootYaw))
    return {x:0,y:0};
  const sx=deadzone(stickX),sy=deadzone(stickY);
  const fx=-headMatrix[8],fz=-headMatrix[10];
  const rx=headMatrix[0],rz=headMatrix[2];
  const fl=Math.hypot(fx,fz)||1,rl=Math.hypot(rx,rz)||1;
  const worldX=sx*rx/rl-sy*fx/fl;
  const worldZ=sx*rz/rl-sy*fz/fl;
  const c=Math.cos(rootYaw),s=Math.sin(rootYaw);
  const x=c*worldX-s*worldZ,y=s*worldX+c*worldZ;
  const magnitude=Math.hypot(x,y);
  return magnitude>1?{x:x/magnitude,y:y/magnitude}:{x,y};
}

export function vrPhaseChoices(state){
  const run=state.run;
  if(state.pendingRebirth){
    return offeredForms(state.meta).map(form=>({
      id:'form:'+form,title:'Rekindle as '+form.toUpperCase(),
      detail:'Canonical next-life offering · previously earned memory carries forward'
    }));
  }
  if(['dead','won'].includes(run.phase)){
    return [{
      id:'rebirth',
      title:run.phase==='won'?'Remember this victory and begin again':'Remember this life and reincarnate',
      detail:'Bank canonical earned essence, abilities, keys, seals and records'
    }];
  }
  if(run.phase==='resolve')return [
    {id:'0',title:'Liberate the trapped light',detail:'Mercy · +7 karma · +3 essence · +10 HP'},
    {id:'1',title:'Harvest the machinery',detail:'Power · -9 karma · +8 essence · +25 HP'},
    {id:'2',title:'Listen for the pattern',detail:'Awareness · +2 karma · +7 awareness · +5 essence'}
  ];
  if(run.phase==='boon')return run.choices.map(id=>({
    id,title:BOONS[id]?.name??id,detail:BOONS[id]?.desc??'Permanent for this life'
  }));
  if(run.phase==='milestone')return [
    {id:'continue',title:'Continue beyond the Eye',detail:'Pursue the six seals and the Demiurge'},
    {id:'finish',title:'Complete the Eye ending',detail:'End this run with the canon Eye victory'}
  ];
  return [];
}

export function chooseVRPhase(state,id){
  const run=state.run;
  const chosen=vrPhaseChoices(state).find(item=>item.id===String(id));
  if(!chosen)throw Error('This decision is not currently available.');
  if(state.pendingRebirth){
    const form=String(id).slice(5);
    if(!offeredForms(state.meta).includes(form))
      throw Error('This vessel was not offered for the next life.');
    state.run=createRun(state.meta,form,(run.seed+1)>>>0);
    state.pendingRebirth=false;
  }else if(['dead','won'].includes(run.phase)){
    // Explicit choice and once-only bank. Never mutate the original campaign.
    if(run.settled)throw Error('This completed life was already recorded.');
    state.meta=settleRun(run,state.meta);
    state.pendingRebirth=true;
  }else if(run.phase==='resolve')resolveChamber(run,Number(id));
  else if(run.phase==='boon')chooseBoon(run,id);
  else if(run.phase==='milestone')resolveMilestone(run,id);
  state.blockedMessage='';
  state.ticks++;
  return observeRun(state.run,state.meta);
}

export function nextVRForm(state){
  const run=state.run;
  if(run.phase!=='playing'||!run.abilities.includes('morph'))
    throw Error('Vessel resonance unlocks in the Mirror Nursery.');
  if((run.player.morphCooldown??0)>0)
    throw Error('Vessel resonance is recovering.');
  const index=VR_FORMS.indexOf(run.form),next=VR_FORMS[(index+1)%VR_FORMS.length];
  morphRun(run,next);
  state.blockedMessage='';
  return next;
}

export function stepVRPreview(state,input={},dt=VR_SIM_STEP){
  const {run}=state;
  if(!Number.isFinite(dt)||dt<=0||dt>.05)
    throw Error('VR step must be 0 < dt <= 0.05.');
  const next={x:Number(input.x)||0,y:Number(input.y)||0,
    dash:input.dash===true,power:input.power===true,interact:input.interact===true,
    fireMode:'auto'};
  if(input.morph!==undefined){
    if(!VR_FORMS.includes(input.morph))throw Error('Unknown Spark vessel.');
    next.morph=input.morph;
  }
  // Never force a door. The canonical engine checks distance, seals, keys,
  // required vessel, completion, ward state and arrival grace.
  if(next.interact){
    const gate=nearestGate(run);
    state.blockedMessage=gate&&!gate.available?gate.reason:'';
  }
  if(run.phase==='playing')stepRun(run,next,dt);
  state.ticks++;
  return observeRun(run,state.meta);
}

export function vrRoomSnapshot(state){
  const {run}=state;
  const room=ROOMS[run.room],worldId=worldOf(run.room);
  const gates=Object.entries(room.exits).map(([direction,exit])=>({
    direction,to:exit.to,
    toName:ROOMS[exit.to]?.name??exit.to,
    ...gateStatus(run,direction),
    vrSupported:VR_ROOMS.includes(exit.to)
  }));
  const key=pendingKey(run),relic=pendingRelic(run);
  return {
    roomId:run.room,roomName:room.name,roomDescription:room.desc??'',
    roomTheme:room.theme,worldId,worldName:WORLDS[worldId]?.name??worldId,
    worldRank:WORLDS[worldId]?.rank??0,worldCount:VR_WORLDS.length,
    availableRooms:VR_ROOMS.length,visitedRooms:run.discovered.length,
    phase:run.phase,form:run.form,
    health:run.player.hp,maxHealth:run.player.maxHp,
    level:run.level,xp:run.xp,karma:run.karma,awareness:run.awareness,
    essence:run.essence,keys:[...run.keys],seals:[...run.seals],
    livesBanked:state.meta.runs,rebirthPending:!!state.pendingRebirth,
    choices:vrPhaseChoices(state),
    player:{x:run.player.x,y:run.player.y},
    enemies:run.enemies.filter(e=>e.hp>0).slice(0,64).map(e=>({
      x:e.x,y:e.y,r:e.r,kind:e.kind,hp:e.hp,
      color:e.color||'#f3b27c',boss:!!(room.boss||room.miniboss)
    })),
    shots:run.shots.filter(s=>s.life>0).slice(0,160).map(s=>({
      x:s.x,y:s.y,enemy:!!s.enemy
    })),
    fragments:run.fragments.slice(0,90).map(f=>({x:f.x,y:f.y})),
    dangerMarks:(run.marks??[]).slice(0,40).map(m=>({
      x:m.x,y:m.y,r:m.r,color:m.color??'#f19e8e'
    })),
    keyPickup:key?{x:key.x,y:key.y}:null,
    relicPickup:relic?{x:relic.x,y:relic.y}:null,
    obstacles:obstacles(run.room,run).slice(0,32),
    gates,notice:state.blockedMessage||run.notice||'',
    cleared:run.cleared.includes(run.room),safe:!!room.safe,boss:!!room.boss,
    ability:BODIES[run.form]?.ability||null,
    morphAvailable:run.abilities.includes('morph'),
    morphReady:(run.player.morphCooldown??0)<=0,
    dashReady:(run.player.dashCooldown??0)<=0,
    powerReady:(run.player.powerCooldown??0)<=0,
    victory:run.victory??null
  };
}
