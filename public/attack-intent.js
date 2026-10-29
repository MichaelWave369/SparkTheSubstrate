// Canonical solo combat input/geometry, shared by any intentional-input client.
// No damage, rewards, timers or gameplay state can be supplied by this contract.
export const ATTACK_INTENT_VERSION='spark.attack-intent.v1';
export const DIRECTED_ATTACK_MODE='directed-v1';
const journals=new WeakMap();
export function attackJournal(run){
  if(!journals.has(run))journals.set(run,{sequence:0,serial:0,events:[]});
  return journals.get(run);
}
export function attackEvent(run,type,detail={}){
  const j=attackJournal(run),event={id:++j.serial,time:run.time,room:run.room,type,...detail};
  j.events.push(event);if(j.events.length>48)j.events.shift();return event;
}
export function attackObservations(run,after=0){
  return attackJournal(run).events.filter(e=>e.id>after).map(e=>({...e}));
}
// First intersection fraction, including origins inside cover. Exact slab sweep.
export function segmentBox(a,b,box,padding=0){
  let lo=0,hi=1;
  for(const [key,min,size]of [['x',box.x,box.w],['y',box.y,box.h]]){
    const d=b[key]-a[key],low=min-padding,high=min+size+padding;
    if(Math.abs(d)<1e-10){if(a[key]<low||a[key]>high)return null;continue;}
    const t1=(low-a[key])/d,t2=(high-a[key])/d;
    lo=Math.max(lo,Math.min(t1,t2));hi=Math.min(hi,Math.max(t1,t2));
    if(lo>hi)return null;
  }
  return lo;
}
export function segmentCircle(a,b,c,r){
  const x=a.x-c.x,y=a.y-c.y,dx=b.x-a.x,dy=b.y-a.y,aa=dx*dx+dy*dy;
  if(x*x+y*y<=r*r)return 0;if(aa<1e-12)return null;
  const bb=2*(x*dx+y*dy),cc=x*x+y*y-r*r,disc=bb*bb-4*aa*cc;
  if(disc<0)return null;const t=(-bb-Math.sqrt(disc))/(2*aa);
  return t>=0&&t<=1?t:null;
}
export const blockedSegment=(a,b,boxes,padding=0)=>boxes.some(box=>segmentBox(a,b,box,padding)!==null);
const finitePoint=p=>p&&Object.keys(p).length===2&&Object.keys(p).every(k=>['x','y'].includes(k))&&['x','y'].every(k=>Number.isFinite(p[k]));
const allowed=new Set(['version','room','observedAt','sequence','origin','direction','targetId','assist','hand']);
// Caller supplies the canonical effective range and canonical obstacles, never XR values.
export function validateAttackIntent(run,intent,range,boxes){
  const fail=reason=>({valid:false,reason});
  if(!intent||intent.version!==ATTACK_INTENT_VERSION||Object.keys(intent).some(k=>!allowed.has(k)))return fail('Unsupported attack intent');
  if(run.partner||run.daily||run.dungeon||run.rematch||run.phase!=='playing'||run.player.hp<=0)return fail('Directed attacks require a living solo campaign vessel');
  if(intent.room!==run.room)return fail('The observed room changed');
  if(!Number.isFinite(intent.observedAt)||run.time-intent.observedAt>.2+1e-8||intent.observedAt>run.time+1e-8)return fail('Attack observation expired');
  if(!Number.isSafeInteger(intent.sequence)||intent.sequence<1||intent.sequence>1e9)return fail('Invalid attack sequence');
  if(!finitePoint(intent.origin)||!finitePoint(intent.direction))return fail('Attack geometry must be finite');
  const {origin,direction}=intent,p=run.player,n=Math.hypot(direction.x,direction.y);
  if(Math.abs(n-1)>.015||Math.hypot(origin.x-p.x,origin.y-p.y)>75||origin.x<39||origin.x>921||origin.y<39||origin.y>561)return fail('Attack origin or direction exceeds bounds');
  if(blockedSegment(p,origin,boxes,5))return fail('Hand origin is behind cover');
  const assist=intent.assist??0;
  if(![0,3,6].includes(assist)||intent.hand!==undefined&&!['left','right'].includes(intent.hand))return fail('Invalid aim assistance');
  const aim={x:direction.x/n,y:direction.y/n},eligible=e=>{
    const x=e.x-origin.x,y=e.y-origin.y,d=Math.hypot(x,y),fromBody=Math.hypot(e.x-p.x,e.y-p.y);
    if(e.hp<=0||fromBody>range||d<1e-6||blockedSegment(origin,e,boxes,5)||blockedSegment(p,e,boxes))return false;
    return (x*aim.x+y*aim.y)/d>=Math.cos(Math.asin(Math.min(1,e.r/d))+assist*Math.PI/180);
  };
  let target=null;
  if(intent.targetId!=null){
    if(!Number.isSafeInteger(intent.targetId))return fail('Invalid observed enemy identity');
    target=run.enemies.find(e=>e.id===intent.targetId);
    if(!target||target.hp<=0)return fail('Observed enemy is no longer present');
    if(!eligible(target))return fail('Observed target is out of aim, range or behind cover');
  }else target=run.enemies.filter(eligible).sort((a,b)=>Math.hypot(a.x-origin.x,a.y-origin.y)-Math.hypot(b.x-origin.x,b.y-origin.y))[0]??null;
  // Assistance only rotates a real launch direction inside this bounded cone.
  // Homing capability is decided by the weapon/skills in action-engine.
  const d=target&&assist>0?Math.hypot(target.x-origin.x,target.y-origin.y):0;
  return {valid:true,origin:{...origin},direction:d?{x:(target.x-origin.x)/d,y:(target.y-origin.y)/d}:aim,
    targetId:target?.id??null,sequence:intent.sequence,hand:intent.hand??'right'};
}
export function validDirectedShot(d){
  return d&&d.version===1&&Number.isSafeInteger(d.cast)&&d.cast>0&&
    ['x','y','range','remaining'].every(k=>Number.isFinite(d[k]))&&d.x>=0&&d.x<=960&&d.y>=0&&d.y<=600&&
    d.range>0&&d.range<=4000&&d.remaining>=0&&d.remaining<=d.range&&
    (d.targetId===null||Number.isSafeInteger(d.targetId)&&d.targetId>0);
}
