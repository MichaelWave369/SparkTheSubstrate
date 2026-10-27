// Standalone VR slice consumes the canonical Descent state and rules.
// No campaign, Sideways, keepsake, or Memory Arcade persistence is touched.
import {
  BODIES, WIDTH, HEIGHT, ROOMS, createMeta, createRun, obstacles,
  gateStatus, nearestGate, stepRun, observeRun
} from '../action-engine.js?v=0.17.0';

export const VR_SLICE_ROOMS=Object.freeze(['threshold','glass']);
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
  return {meta,run:createRun(meta,'spark',seed),blockedMessage:'',ticks:0};
}
const deadzone=(v,limit=.18)=>{
  if(!Number.isFinite(v)||Math.abs(v)<=limit)return 0;
  return Math.sign(v)*(Math.abs(v)-limit)/(1-limit);
};

// HMD-relative left-stick motion; rootYaw is the user-selected snap rotation.
// game XY represents world XZ, with north = engine -Y = WebXR -Z.
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

export function stepVRPreview(state,input={},dt=VR_SIM_STEP){
  const {run}=state;
  if(!Number.isFinite(dt)||dt<=0||dt>.05)throw Error('VR step must be 0 < dt <= 0.05.');
  // Do not silently play past the demonstrated two-room prototype.
  const next={x:Number(input.x)||0,y:Number(input.y)||0,
    dash:input.dash===true,power:input.power===true,interact:input.interact===true,
    fireMode:'auto'};
  if(next.interact){
    const nearest=nearestGate(run);
    if(nearest?.to&&!VR_SLICE_ROOMS.includes(nearest.to)){
      next.interact=false;
      state.blockedMessage='That gate continues in classic Descent. The VR prototype only covers Threshold and Glass.';
    }else state.blockedMessage='';
  }
  if(run.phase==='playing')stepRun(run,next,dt);
  state.ticks++;
  return observeRun(run,state.meta);
}

export function vrRoomSnapshot(state){
  const {run}=state;
  const room=ROOMS[run.room];
  const gates=Object.entries(room.exits).map(([direction,exit])=>({
    direction,to:exit.to,
    ...gateStatus(run,direction),
    vrSupported:VR_SLICE_ROOMS.includes(exit.to)
  }));
  return {
    roomId:run.room,roomName:room.name,
    roomTheme:room.theme,phase:run.phase,form:run.form,
    health:run.player.hp,maxHealth:run.player.maxHp,
    player:{x:run.player.x,y:run.player.y},
    enemies:run.enemies.filter(e=>e.hp>0).map(e=>({x:e.x,y:e.y,r:e.r,kind:e.kind,
      hp:e.hp,color:e.color||'#f3b27c'})),
    shots:run.shots.filter(s=>s.life>0).map(s=>({x:s.x,y:s.y,enemy:s.enemy})),
    fragments:run.fragments.map(f=>({x:f.x,y:f.y})),
    obstacles:obstacles(run.room,run),
    gates,notice:state.blockedMessage||run.notice||'',
    cleared:run.cleared.includes(run.room),
    ability:BODIES[run.form]?.ability||null,
    dashReady:run.player.dashCooldown<=0,
    powerReady:run.player.powerCooldown<=0
  };
}
