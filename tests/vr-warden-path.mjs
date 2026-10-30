import {thresholdGlassMachine,clearEncounter,crossGate} from './vr-living-path.mjs';
// Input-only route from a fresh campaign. No room, HP, enemy, reward or gate writes.
export function reachWarden(d){
 thresholdGlassMachine(d);clearEncounter(d);crossGate(d,'south');clearEncounter(d);
 for(const direction of ['north','west','west'])crossGate(d,direction);
 clearEncounter(d);crossGate(d,'north');clearEncounter(d);crossGate(d,'east');
 clearEncounter(d);crossGate(d,'north');
 if(d.snapshot().roomId!=='eye'||d.snapshot().guardians[0]?.maxHp!==1800)throw Error('Native Warden not reached');
}
export function wardenFightStep(d,frame){
 const s=d.snapshot(),p=s.player,e=s.enemies.find(e=>e.kind==='warden')||s.enemies[0],angle=s.time*.7,
  dx=480+Math.cos(angle)*220-p.x,dy=300+Math.sin(angle)*155-p.y,n=Math.hypot(dx,dy)||1;
 return d.tick({x:dx/n,y:dy/n,aim:e?.id,attack:!!e&&s.attackCooldown<=1/60&&frame%2===0,
  power:s.powerReady&&frame%6<3&&s.enemies.some(e=>Math.hypot(e.x-p.x,e.y-p.y)<220),
  dash:s.dashReady&&s.enemies.some(e=>Math.hypot(e.x-p.x,e.y-p.y)<70)});
}
