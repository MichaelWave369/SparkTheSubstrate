// The same eight guardians, translated into a walkable plane. A ground mark
// locks its position before the attack; the spark always has time to leave it.
export const SIDE_GUARDIAN_PATTERNS={
 cantor:{name:'The returning note',hint:'Jump the low volley. Leave the amber ring.',color:'#f6be76'},
 warden:{name:'The held seam',hint:'Read the stacked lanes. Jump or take the upper ledge.',color:'#e9c887'},
 tidekeeper:{name:'The tidal fan',hint:'The slow fan opens outward. Leave the tidal mark.',color:'#91dce8'},
 thornmother:{name:'The growing circle',hint:'Roots rise at the marked places. The space between stays open.',color:'#b4de9c'},
 regent:{name:'The missing second',hint:'The clock ring leaves a gap facing your last position.',color:'#f2b67c'},
 weaver:{name:'The crossing thread',hint:'High fans alternate with low threads. Read the wind-up.',color:'#d1aff1'},
 curator:{name:'The falling stars',hint:'Stars fall on either side of the marked gap.',color:'#b8c5f6'},
 demiurge:{name:'The changing law',hint:'Crown ring, marked ground, then crossing laws.',color:'#f6d18e'}
};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const sideGuardianPhase=e=>e.kind==='demiurge'?(e.hp<=e.maxHp/3?3:e.hp<=e.maxHp*2/3?2:1):e.hp<e.maxHp*.5?2:1;
export function tickSideGuardian(s,e,r,rank,dt,{bolt,emit}){
 const p=s.player,phase=sideGuardianPhase(e),style=SIDE_GUARDIAN_PATTERNS[e.kind];
 if(phase!==e.phase){e.phase=phase;emit(s,'phase',e.displayName+' · '+(e.kind==='cantor'?'SECOND MOVEMENT':e.kind==='demiurge'?'LAW '+phase:'the pattern changes'));}
 const mark=(x,radius=70,shape='ring',life=1.3)=>s.marks.push({x:clamp(x,160,r.width-160),y:r.floor,r:radius,life,damage:13+rank*1.5,trigger:false,source:e.id,color:style.color,shape});
 const shot=(x,y,dx,dy,speed=275+rank*12,damage=11+rank*1.5)=>{bolt(s,x,y,dx,dy,damage,true,true,speed);const b=s.bolts.at(-1);b.color=style.color;b.source=e.id;};
 if(e.windup>0){
  e.windup-=dt;if(e.windup>0)return;
  const a=e.aim??{x:p.x,y:p.y-40},dx=a.x-e.x,dy=a.y-(e.y-55),angle=Math.atan2(dy,dx);
  const fan=(n,spread,speed=275+rank*12,y=e.y-55)=>{const aim=Math.atan2(a.y-y,dx);for(let i=0;i<n;i++){const t=aim+(i-(n-1)/2)*spread;shot(e.x,y,Math.cos(t),Math.sin(t),speed);}};
  if(e.kind==='cantor'){
   // Keep the existing first encounter, including its live aimed note.
   for(let j=-1;j<=1;j++)shot(e.x,e.y-55,p.x-e.x,p.y-40-(e.y-55)+j*(phase===2?85:65));
   shot(e.x,e.y-18,p.x-e.x,0,255,10+rank);
  }else if(e.kind==='warden'){
   const heights=phase===2?[18,85,155]:[18,125];for(const h of heights)shot(e.x,e.y-h,dx,0,265);
  }else if(e.kind==='tidekeeper'){
   fan(phase===2?5:3,.22,215);shot(e.x,e.y-18,dx,0,190,10+rank);
  }else if(e.kind==='thornmother'){
   fan(phase===2?3:2,.3,245,e.y-140);
  }else if(e.kind==='regent'){
   // The gap is locked to the wind-up aim, rather than chasing a dodge.
   for(let i=0;i<10;i++){const t=angle+(i+1.5)*Math.PI*2/12;shot(e.x,e.y-95,Math.cos(t),Math.sin(t),phase===2?245:205);}
  }else if(e.kind==='weaver'){
   if(e.sequence%2){fan(phase===2?5:3,.2,260,e.y-140);}else{shot(e.x,e.y-20,dx,0,240);shot(e.x,e.y-145,dx,0,275);}
  }else if(e.kind==='curator'){
   for(const offset of (phase===2?[-270,-155,155,270]:[-220,220])){const x=clamp(a.x+offset,140,r.width-140);shot(x,r.floor-345,offset<0?.14:-.14,1,205);}
  }else if(e.kind==='demiurge'){
   if(phase===1){for(let i=0;i<7;i++){const t=angle+(i+2)*Math.PI*2/10;shot(e.x,e.y-95,Math.cos(t),Math.sin(t),225);}}
   else if(phase===2)fan(3,.23,260);
   else{fan(3,.26,285,e.y-140);shot(e.x,e.y-18,dx,0,230);}
  }
  e.clock=phase===1?3.2:phase===2?2.7:2.5;if(e.kind==='cantor'&&phase===2)e.clock=2.5;emit(s,'volley');return;
 }
 if(e.clock<=0){
  e.windup=e.kind==='curator'?1.2:.95;e.windupTotal=e.windup;e.sequence=(e.sequence??0)+1;e.aim={x:p.x,y:p.y-40};e.attackHint=style.hint;
  if(e.kind==='cantor')mark(p.x);
  else if(e.kind==='thornmother'){mark(p.x-155,65,'root');mark(p.x+155,65,'root');}
  else if(e.kind==='tidekeeper')mark(p.x,70,'tide');
  else if(e.kind==='regent')mark(p.x,60,'clock');
  else if(e.kind==='demiurge'&&phase===2){mark(p.x-135,65,'law');mark(p.x+135,65,'law');}
  emit(s,'windup');
 }else if(!e.root)e.x=clamp(e.x+Math.sin(s.time*1.3)*17*dt,300,r.width-190);
}
