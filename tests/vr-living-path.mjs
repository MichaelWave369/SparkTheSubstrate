// Acceptance driver policy only; no HP, enemy, room, reward, ability or save mutation.
export function settleChoices(d){
  let count=0;
  while(d.snapshot().choices.length&&count++<20){
    const choices=d.snapshot().choices;
    const id=['shell','regeneration','edge','cadence','0'].find(id=>choices.some(c=>c.id===id))||choices[0].id;
    d.choose(id);
  }
  if(d.snapshot().phase==='dead')throw Error('Acceptance character died.');
}
export function walk(d,x,y,budget=900){
  for(let i=0;i<budget;i++){
    settleChoices(d);const p=d.snapshot().player,dx=x-p.x,dy=y-p.y,n=Math.hypot(dx,dy);
    if(n<9)return;
    d.tick({x:dx/Math.max(9,n),y:dy/Math.max(9,n)});
  }
  throw Error('Canonical movement could not reach waypoint '+x+','+y+' from '+JSON.stringify(d.snapshot().player));
}
export function clearEncounter(d,budget=10000){
  for(let i=0;i<budget&&!d.snapshot().cleared;i++){
    settleChoices(d);const s=d.snapshot(),p=s.player,angle=(s.time||0)*.7;
    const target={x:480+Math.cos(angle)*220,y:300+Math.sin(angle)*155},dx=target.x-p.x,dy=target.y-p.y,n=Math.hypot(dx,dy)||1;
    d.tick({x:dx/n,y:dy/n,dash:s.dashReady&&s.enemies.some(e=>Math.hypot(e.x-p.x,e.y-p.y)<70),
      power:s.powerReady&&i%6<3&&s.enemies.some(e=>Math.hypot(e.x-p.x,e.y-p.y)<220)});
  }
  if(!d.snapshot().cleared)throw Error('Canonical encounter did not clear: '+JSON.stringify({phase:d.snapshot().phase,health:d.snapshot().health}));
  settleChoices(d);
  // Sweep actual native fragment drops; no direct XP/level/reward mutation.
  for(let i=0;i<1800&&d.snapshot().fragments.length;i++){
    settleChoices(d);const s=d.snapshot(),p=s.player;
    const target=[...s.fragments].sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
    const dx=target.x-p.x,dy=target.y-p.y,n=Math.hypot(dx,dy)||1;d.tick({x:dx/n,y:dy/n});
  }
  settleChoices(d);
}
export function thresholdGlassMachine(d){
  if(d.snapshot().roomId!=='threshold')throw Error('Acceptance must start in the real Threshold.');
  walk(d,480,115);d.tick({interact:true});d.tick({});
  if(d.snapshot().roomId!=='glass')throw Error('Threshold gate did not enter Glass.');
  clearEncounter(d);
  const cleared=d.snapshot();
  walk(d,480,300);walk(d,840,270);walk(d,870,300);d.tick({interact:true});d.tick({});
  if(d.snapshot().roomId!=='machine')throw Error('Eligible Glass gate did not enter Machine.');
  return {glass:cleared,machine:d.snapshot()};
}
export function crossGate(d,direction){
  walk(d,480,300);
  const waypoints={north:[[480,115]],south:[[480,485]],east:[[840,270],[870,300]],west:[[120,300]]};
  const gate=d.snapshot().gates.find(g=>g.direction===direction);
  if(!gate?.available)throw Error('Acceptance route requested a locked '+direction+' gate: '+gate?.reason);
  for(const [x,y]of waypoints[direction])walk(d,x,y);
  d.tick({interact:true});d.tick({});
  if(d.snapshot().roomId!==gate.to)throw Error('Acceptance gate did not reach '+gate.to);
}
export function earnResonanceFromMachine(d){
  const rooms=[];
  for(const direction of ['south','north','north','east','east']){
    clearEncounter(d);rooms.push(d.snapshot().roomId);crossGate(d,direction);
  }
  clearEncounter(d);rooms.push(d.snapshot().roomId);
  const key=d.snapshot().keyPickup;if(key)walk(d,key.x,key.y);d.tick({});
  if(!d.snapshot().keys.includes('ivory'))throw Error('Ivory key was not collected by native contact.');
  crossGate(d,'west');crossGate(d,'south');clearEncounter(d);rooms.push(d.snapshot().roomId);
  crossGate(d,'east');clearEncounter(d);rooms.push(d.snapshot().roomId);
  if(!d.snapshot().morphAvailable)throw Error('Mirror Nursery did not grant resonance.');
  return {rooms,keyring:[...d.snapshot().keys],abilities:[...d.snapshot().abilities],level:d.snapshot().level,health:d.snapshot().health};
}
