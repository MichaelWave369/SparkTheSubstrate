// Software acceptance policy: only tracked samples, real menu choices and native
// actions. No health, enemies, room progress, gear, unlock or reward writes.
export function awakeningDriver({runtime:r,host:h,poses}){
 let now=0,last,yaw=0,pitch=.05;
 const d={snapshot:()=>h.descent.snapshot(),view:(y,p=.05)=>{
   const target=y+(r.input.yaw||0),delta=Math.atan2(Math.sin(target-yaw),Math.cos(target-yaw)),steps=Math.max(1,Math.ceil(Math.max(Math.abs(delta)/.15,Math.abs(p-pitch)/.05))),dy=delta/steps,dp=(p-pitch)/steps;
   for(let i=0;i<steps;i++){yaw+=dy;pitch+=dp;d.tick({});}
  },
  tick:i=>{
   const spell=r.settings.combatProfile==='spellcraft',left=r.settings.dominantHand==='left',x=i.x||0,y=i.y||0,c=Math.cos(yaw),s=Math.sin(yaw),
    cr=Math.cos(r.input.yaw||0),sr=Math.sin(r.input.yaw||0),ux=cr*x+sr*y,uy=-sr*x+cr*y,
    sample=poses.desktopXRSample({yaw,pitch,move:-(s*ux+c*uy),strafe:c*ux-s*uy,dash:!!i.dash,interact:!!i.interact,
     rightTrigger:spell?(left?!!i.power:!!i.attack):!!i.power,leftTrigger:spell?(left?!!i.attack:!!i.power):false});
   if(i.aim!==undefined||i.direction){
    const side=r.settings.dominantHand,hand=sample.hands[side],p=h.descent.state.run.player,
      target=typeof i.aim==='number'?h.descent.state.run.enemies.find(e=>e.id===i.aim):i.aim,
      hx=hand.ray[12]-sample.head[12],hy=hand.ray[14]-sample.head[14],ox=p.x+(cr*hx-sr*hy)*100,oy=p.y+(sr*hx+cr*hy)*100,
      dx=i.direction?.x??((target?.x??ox)-ox),dy=i.direction?.y??((target?.y??oy-100)-oy),
      angle=Math.atan2(-(cr*dx+sr*dy),-(-sr*dx+cr*dy));
    hand.ray=poses.previewMatrix(hand.grip[12],hand.grip[13],hand.grip[14],angle,0);
   }
   now+=1000/60;last=r.advance(now,sample);return last;
  },choose:id=>{h.choose(id);d.tick({});},
  profile:profile=>{r.configure({combatProfile:profile});r.pause(false);d.tick({});d.tick({});},
  capture:()=>{r.drawPreview(last);return last;},last:()=>last};
 return d;
}
export function findObservedPair(d,budget=900){
 for(let i=0;i<budget;i++){
  const s=d.snapshot(),p=s.player,enemies=s.enemies.filter(e=>Math.hypot(e.x-p.x,e.y-p.y)<s.attackReach-20)
   .sort((a,b)=>Math.hypot(b.x-p.x,b.y-p.y)-Math.hypot(a.x-p.x,a.y-p.y));
  for(const e of enemies){
   const other=enemies.find(o=>{const diff=Math.abs(Math.atan2(Math.sin(Math.atan2(e.y-p.y,e.x-p.x)-Math.atan2(o.y-p.y,o.x-p.x)),Math.cos(Math.atan2(e.y-p.y,e.x-p.x)-Math.atan2(o.y-p.y,o.x-p.x))));return o.id!==e.id&&diff>.35&&diff<1.2;});
   if(!other)continue;d.tick({aim:other.id});if(!d.snapshot().aim?.valid||d.snapshot().aim.targetId!==other.id)continue;
   d.tick({aim:e.id});
   if(d.snapshot().aim?.valid&&d.snapshot().aim.targetId===e.id)return {chosen:e.id,other:other.id};
  }
  if(s.phase==='dead')throw Error('Acceptance character died before directed encounter');
  d.tick({});
 }
 throw Error('No two distinct observed enemies were available');
}
export function directedFightStep(d,frame){
 const s=d.snapshot(),p=s.player,e=s.enemies.find(e=>e.kind==='cantor')||s.enemies[0],angle=s.time*.7,
  tx=480+Math.cos(angle)*220,ty=300+Math.sin(angle)*155,dx=tx-p.x,dy=ty-p.y,n=Math.hypot(dx,dy)||1;
 return d.tick({x:dx/n,y:dy/n,aim:e?.id,attack:!!e&&s.attackCooldown<=1/60&&frame%2===0,
  power:s.powerReady&&frame%6<3&&s.enemies.some(e=>Math.hypot(e.x-p.x,e.y-p.y)<220),
  dash:s.dashReady&&s.enemies.some(e=>Math.hypot(e.x-p.x,e.y-p.y)<70)});
}
