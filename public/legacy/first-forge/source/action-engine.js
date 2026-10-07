import {prepareEquipment,gearStats,validEquipment,EQUIPMENT} from './equipment.js';
import {recordArrival,recordDecision} from './story.js';
import {FORM_ORDER,FORMS,affinity} from './engine.js';

export const WIDTH=960,HEIGHT=600;
export const BODIES={
  spark:{hp:100,speed:230,damage:21,interval:.54,range:620,sprite:0,weapon:'Lumen bolts',ability:'phase',color:'#f7cb79',desc:'Light that seeks. Fast homing bolts; phase through crystal gates.'},
  human:{hp:135,speed:218,damage:35,interval:.56,range:130,sprite:1,weapon:'Spectral cleave',ability:null,color:'#e5b78b',desc:'A blade and a stubborn heart. Wide close-range cleaves; strong recovery.'},
  computer:{hp:105,speed:216,damage:15,interval:.72,range:670,sprite:2,weapon:'Prism volley',ability:'phase',color:'#86d8e5',desc:'Three-shot prism volleys. Read the grid and phase through crystal gates.'},
  animal:{hp:115,speed:272,damage:27,interval:.32,range:100,sprite:3,weapon:'Feral strikes',ability:'root',color:'#ddcc93',desc:'A wolf’s speed and quick strikes. Follow hidden root passages.'},
  tree:{hp:125,speed:185,damage:29,interval:1.08,range:175,sprite:4,weapon:'Root pulse',ability:'root',color:'#a5cfad',desc:'Living roots strike in a circle. Regenerate slowly and follow root passages.'},
  rock:{hp:165,speed:172,damage:45,interval:1.12,range:190,sprite:5,weapon:'Fault wave',ability:'fracture',color:'#c6bcda',desc:'A heavy circular shockwave. Tough basalt armor; shatter stone gates.'}
};
export const ABILITIES={phase:{name:'Prism phase',glyph:'◈',desc:'Cross crystal barriers.'},root:{name:'Root passage',glyph:'♧',desc:'Open the living routes.'},fracture:{name:'Fault breaker',glyph:'◇',desc:'Shatter basalt seals.'},eye:{name:'Eye sigil',glyph:'⟁',desc:'Enter the Demiurge’s Eye.'}};
export const ROOMS={
  threshold:{name:'The Threshold',short:'Threshold',coord:[1,2],theme:'#d5b679',safe:true,danger:0,desc:'An unfinished place between lives. The northern gate opens into the Glass Causeway.',exits:{north:{to:'glass'},east:{to:'roots',requires:'root'}}},
  glass:{name:'Glass Causeway',short:'Glass',coord:[1,1],theme:'#8cc7c2',danger:1,loot:'prism',desc:'The city’s first defense. Break the swarm and follow the eastern gate to the Machine Sepulcher.',exits:{south:{to:'threshold'},east:{to:'machine'},west:{to:'wild',requires:'root'},north:{to:'foundry',requires:'fracture'}}},
  machine:{name:'Machine Sepulcher',short:'Machine',coord:[2,1],theme:'#76c3db',danger:2,reward:'phase',desc:'A buried processor dreams of a different purpose. Clear it to remember Prism Phase.',exits:{west:{to:'glass'},south:{to:'roots',requires:'phase'},north:{to:'quiet',requires:'phase'},east:{to:'cistern',requires:'root'}}},
  roots:{name:'Root Cathedral',short:'Roots',coord:[2,2],theme:'#a5ccac',danger:2,reward:'root',desc:'Living roots cross the walls. Clear this chamber to remember Root Passage, then return toward the Wild Margin.',exits:{north:{to:'machine'},west:{to:'threshold',requires:'root'},east:{to:'forge',requires:'fracture'}}},
  wild:{name:'The Wild Margin',short:'Wild',coord:[0,1],theme:'#bbc490',danger:3,loot:'fang',desc:'The things that escaped their assigned shape gather here. The basalt reach lies to the north.',exits:{east:{to:'glass'},north:{to:'basalt'}}},
  basalt:{name:'Basalt Reach',short:'Basalt',coord:[0,0],theme:'#b7a7cb',danger:3,reward:'fracture',desc:'Matter remembers pressure. Clear the reach to remember Fault Breaker and open the foundry.',exits:{south:{to:'wild'},east:{to:'foundry',requires:'fracture'}}},
  foundry:{name:'Archon Foundry',short:'Foundry',coord:[1,0],theme:'#d49a79',danger:4,reward:'eye',desc:'The archons are assembled here. Claim the Eye Sigil to reach the northern seal.',exits:{south:{to:'glass',requires:'fracture'},west:{to:'basalt'},east:{to:'quiet',requires:'phase'},north:{to:'eye',requires:'eye'}}},
  quiet:{name:'The Quiet Array',short:'Quiet',coord:[2,0],theme:'#b5becf',danger:2,desc:'A forgotten side route. The array still carries questions that no one assigned.',exits:{south:{to:'machine'},west:{to:'foundry',requires:'fracture'},east:{to:'conduit',requires:'phase'}}},
  conduit:{name:'The Unbound Conduit',short:'Conduit',coord:[3,0],theme:'#83c9c6',danger:3,desc:'An abandoned route carries power the lattice forgot to count. It leads south into the Resonant Cistern.',exits:{west:{to:'quiet',requires:'phase'},south:{to:'cistern'}}},
  cistern:{name:'Resonant Cistern',short:'Cistern',coord:[3,1],theme:'#89b9dd',danger:3,loot:'bell',desc:'A buried reservoir holds the voices sent away. Clear it for the Memory Bell, then explore the Echo Forge to the south.',exits:{north:{to:'conduit'},west:{to:'machine',requires:'root'},south:{to:'forge'}}},
  forge:{name:'The Echo Forge',short:'Echo Forge',coord:[3,2],theme:'#d7aa80',danger:4,miniboss:true,loot:'ash',desc:'The Cantor guards an old workshop. Break its rings to recover the Ash Cloak and open a shortcut to the roots.',exits:{north:{to:'cistern'},west:{to:'roots',requires:'fracture'}}},
  eye:{name:'The Demiurge’s Eye',short:'The Eye',coord:[1,-1],theme:'#e2be7e',danger:5,boss:true,desc:'The Warden guards the seam of this stratum. Read its marks. Dash through the closing pattern.',exits:{south:{to:'foundry'}}}
};
export const BOONS={
  edge:{name:'Brighter edge',tag:'DAMAGE',desc:'Your primary weapon deals 24% more damage.',glyph:'✧'},
  cadence:{name:'Quickening',tag:'ATTACK SPEED',desc:'Your primary weapon attacks 18% faster.',glyph:'⋈'},
  orbit:{name:'Companion spark',tag:'ORBITAL',desc:'A spark circles your body and strikes nearby enemies.',glyph:'◉'},
  shell:{name:'Living vessel',tag:'SURVIVAL',desc:'Gain 25 maximum health and restore 35 health.',glyph:'◇'},
  regeneration:{name:'Second spring',tag:'RECOVERY',desc:'Recover one health each second.',glyph:'♧'},
  magnet:{name:'Thread pull',tag:'COLLECTION',desc:'Draw memory fragments from much farther away.',glyph:'⌘'},
  dash:{name:'Slip the pattern',tag:'MOVEMENT',desc:'Dash recovers 22% faster.',glyph:'◈'}
};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const rand=s=>{s.rng=(Math.imul(1664525,s.rng)+1013904223)>>>0;return s.rng/4294967296;};
const randomId=s=>++s.serial;
export function createMeta(origin=null){return prepareEquipment({version:2,karma:clamp(Number.isFinite(origin?.karma)?origin.karma:0,-100,100),awareness:clamp(Number.isFinite(origin?.awareness)?origin.awareness:8,0,100),essence:0,runs:0,wins:0,bestRooms:0,abilities:[],gifts:{heart:0,edge:0,haste:0},echoes:[],visited:[]});}
export function offeredForms(meta){
  const r={rng:(7919+meta.runs*1009)>>>0},list=[...FORM_ORDER],chosen=[];
  if(meta.runs===0){chosen.push('spark');list.splice(list.indexOf('spark'),1);}
  while(chosen.length<3){const values=list.map(id=>affinity({karma:meta.karma,awareness:meta.awareness,attachment:20,world:{vitality:50}},id));let cursor=rand(r)*values.reduce((a,b)=>a+b,0),index=list.length-1;for(let i=0;i<list.length;i++){cursor-=values[i];if(cursor<=0){index=i;break;}}chosen.push(list.splice(index,1)[0]);}
  return chosen;
}
export function createRun(meta,form='spark',seed=Date.now()>>>0){
  if(!BODIES[form]||!offeredForms(meta).includes(form))throw new Error('This form is not in the current.');
  const equipment=prepareEquipment(meta),gear=gearStats(equipment),body=BODIES[form],hp=body.hp+meta.gifts.heart*12+gear.health;
  const run={version:2,seed:seed>>>0,rng:seed>>>0,serial:0,form,phase:'playing',room:'threshold',roomTime:0,time:0,spawnClock:.3,spawned:0,spawnTotal:0,player:{x:WIDTH/2,y:HEIGHT/2+90,hp,maxHp:hp,r:15,facingX:0,facingY:-1,iframes:1,dashTime:0,dashX:0,dashY:-1,dashCooldown:0,attackClock:.1},enemies:[],shots:[],fragments:[],effects:[],marks:[],kills:0,level:1,xp:0,nextXp:6,choices:[],boons:{edge:0,cadence:0,orbit:0,shell:0,regeneration:0,magnet:0,dash:0},cleared:['threshold'],discovered:['threshold'],abilities:[...new Set([...meta.abilities,...(body.ability?[body.ability]:[])])],earnedAbilities:[],karma:meta.karma,awareness:meta.awareness,essence:0,memoryEdge:meta.gifts.edge*.07,memoryHaste:meta.gifts.haste*.025,notice:'Move to the northern gate. Press E to enter the Glass Causeway.',noticeTime:8,damageFlash:0,settled:false,roomResolved:[],lastGate:null};
  run.gear=gear;run.loadout=equipment.loadout;run.loot=[];run.journal=[];run.seenEnemies=[];recordArrival(run);if(meta.runs===0){run.notice='Move with WASD or arrows. Your weapon fires itself. Go to the northern gate and press E.';run.noticeTime=18;}return run;
}
export function obstacles(room){
  if(room==='threshold'||room==='eye'||room==='forge')return [];
  const offset=ROOMS[room].danger%2?0:34;
  return [{x:245+offset,y:160,w:52,h:78},{x:660-offset,y:355,w:52,h:78}];
}
function circleRect(x,y,r,b){const px=clamp(x,b.x,b.x+b.w),py=clamp(y,b.y,b.y+b.h);return Math.hypot(x-px,y-py)<r;}
function move(run,entity,dx,dy,ignore=false){
  const boxes=ignore?[]:obstacles(run.room),nx=clamp(entity.x+dx,34+entity.r,WIDTH-34-entity.r),ny=clamp(entity.y+dy,34+entity.r,HEIGHT-34-entity.r);
  if(!boxes.some(b=>circleRect(nx,entity.y,entity.r,b)))entity.x=nx;
  if(!boxes.some(b=>circleRect(entity.x,ny,entity.r,b)))entity.y=ny;
}
export function exitPosition(direction){return {north:{x:WIDTH/2,y:31},south:{x:WIDTH/2,y:HEIGHT-31},east:{x:WIDTH-31,y:HEIGHT/2},west:{x:31,y:HEIGHT/2}}[direction];}
export function gateStatus(run,direction){
  const exit=ROOMS[run.room].exits[direction];if(!exit)return {available:false,reason:'No gate here.'};
  if(!run.cleared.includes(run.room))return {available:false,reason:'Break the swarm to open the gates.'};
  if(exit.requires&&!run.abilities.includes(exit.requires))return {available:false,reason:'Requires '+ABILITIES[exit.requires].name+'.',requires:exit.requires,to:exit.to};
  return {available:true,to:exit.to,requires:exit.requires};
}
export function nearestGate(run){
  let gate=null;for(const direction of Object.keys(ROOMS[run.room].exits)){const position=exitPosition(direction),distance=dist(run.player,position);if(!gate||distance<gate.distance)gate={direction,position,distance,...gateStatus(run,direction)};}return gate;
}
export function enterGate(run,direction){
  if(run.phase!=='playing')throw new Error('Finish the current choice before traveling.');
  const status=gateStatus(run,direction);if(!status.available)throw new Error(status.reason);
  if(dist(run.player,exitPosition(direction))>83)throw new Error('Move closer to the gate.');
  const opposite={north:'south',south:'north',east:'west',west:'east'}[direction],at=exitPosition(opposite);
  run.room=status.to;run.roomTime=0;run.enemies=[];run.shots=[];run.effects=[];run.marks=[];run.fragments=[];run.spawnClock=.6;run.spawned=0;run.spawnTotal=ROOMS[run.room].safe?0:ROOMS[run.room].boss||ROOMS[run.room].miniboss?1:ENCOUNTERS[run.room]?.total??14+ROOMS[run.room].danger*4;run.player.x=clamp(at.x,82,WIDTH-82);run.player.y=clamp(at.y,82,HEIGHT-82);run.player.iframes=1.4;run.player.attackClock=.25;run.lastGate=opposite;
  if(!run.discovered.includes(run.room))run.discovered.push(run.room);
  if(run.partner){run.partner.x=clamp(run.player.x+48,82,WIDTH-82);run.partner.y=run.player.y;run.partner.iframes=1.4;if(run.partner.hp<=0)run.partner.hp=run.partner.maxHp*.4;run.spawnTotal=Math.round(run.spawnTotal*1.3);}
  recordArrival(run);
  if((ROOMS[run.room].boss||ROOMS[run.room].miniboss)&&!run.cleared.includes(run.room))spawnBoss(run);
  return run.room;
}
export const ENCOUNTERS={glass:{total:14,interval:.95,cap:6,damage:.7,pool:['collector','collector','collector','archon','hound']},machine:{total:18,interval:.95,cap:8,damage:.8,pool:['collector','collector','archon','hound']},roots:{total:20,interval:.85,cap:9,damage:.85,pool:['collector','archon','spore','collector']}};
export const ENEMY_KINDS=['collector','archon','warden','hound','mirror','spore','oracle','leech','moth','cantor'];
function spawnEnemy(run,forced=null,count=true){
  let x,y;const actors=[run.player,run.partner].filter(p=>p&&p.hp>0);for(let attempt=0;attempt<12;attempt++){const edge=Math.floor(rand(run)*4);x=edge===0?65:edge===1?WIDTH-65:80+rand(run)*(WIDTH-160);y=edge===2?65:edge===3?HEIGHT-65:80+rand(run)*(HEIGHT-160);if(actors.every(p=>Math.hypot(p.x-x,p.y-y)>180))break;}
  const difficulty=ROOMS[run.room].danger,roll=rand(run),pool=ENCOUNTERS[run.room]?.pool,kind=forced??(pool?pool[Math.floor(roll*pool.length)]:run.room==='conduit'||run.room==='cistern'?(roll<.28?'leech':roll<.47?'moth':roll<.65?'archon':'collector'):roll<.12&&difficulty>=3?'oracle':roll<.25&&difficulty>=2?'spore':roll<.37&&difficulty>=2?'mirror':roll<.53?'hound':roll<.7?'archon':'collector');
  const enemy={id:randomId(run),kind,x,y,r:kind==='archon'?17:14,hp:(kind==='archon'?42:24)+difficulty*6,maxHp:(kind==='archon'?42:24)+difficulty*6,speed:kind==='archon'?53:74+difficulty*6,attack:1.2+rand(run)*1.1,orbitHit:0,flash:0};
  const stats={hound:{hp:31,speed:84,r:14},mirror:{hp:55,speed:58,r:18},spore:{hp:38,speed:45,r:17},oracle:{hp:75,speed:38,r:20},leech:{hp:49,speed:59,r:17},moth:{hp:29,speed:102,r:14}}[kind];if(stats)Object.assign(enemy,{hp:stats.hp+difficulty*5,maxHp:stats.hp+difficulty*5,speed:stats.speed,r:stats.r,windup:0,charge:0,chargeX:0,chargeY:0,shield:0});if(run.partner){enemy.hp*=1.3;enemy.maxHp=enemy.hp;}run.seenEnemies??=[];if(!run.seenEnemies.includes(kind))run.seenEnemies.push(kind);
  if(actors.some(p=>dist(enemy,p)<160)){const corners=[{x:65,y:65},{x:WIDTH-65,y:65},{x:65,y:HEIGHT-65},{x:WIDTH-65,y:HEIGHT-65}];const safe=corners.sort((a,b)=>Math.min(...actors.map(p=>dist(p,b)))-Math.min(...actors.map(p=>dist(p,a))))[0];enemy.x=safe.x;enemy.y=safe.y;}
  run.enemies.push(enemy);if(count)run.spawned++;
}
function spawnBoss(run){const cantor=!!ROOMS[run.room].miniboss,hp=cantor?(run.partner?950:650):(run.partner?1800:1200),kind=cantor?'cantor':'warden';run.enemies.push({id:randomId(run),kind,x:WIDTH/2,y:HEIGHT/2-90,r:cantor?32:37,hp,maxHp:hp,speed:cantor?48:65,attack:1.8,markClock:3.5,orbitHit:0,flash:0});run.spawned=1;run.seenEnemies??=[];if(!run.seenEnemies.includes(kind))run.seenEnemies.push(kind);}

function effect(run,type,x,y,color,r=20){if(run.effects.length<140)run.effects.push({id:randomId(run),type,x,y,color,r,life:type==='wave'?.4:.3,maxLife:type==='wave'?.4:.3});}
function damageEnemy(run,enemy,amount){
  if(enemy.hp<=0)return;if(enemy.kind==='mirror'&&enemy.shield>0)amount*=.35;enemy.hp-=amount;enemy.flash=.13;effect(run,'hit',enemy.x,enemy.y,BODIES[run.form].color,13);
  if(enemy.hp<=0){run.marks=run.marks.filter(mark=>mark.sourceId!==enemy.id);run.kills++;const value=enemy.kind==='warden'?30:enemy.kind==='cantor'?18:enemy.kind==='archon'?3:2;run.fragments.push({id:randomId(run),x:enemy.x,y:enemy.y,value,r:5});effect(run,'burst',enemy.x,enemy.y,enemy.kind==='warden'?'#f7cb79':'#8bc7c2',32);}
}
function hurt(run,amount,target=run.player){if(target.hp<=0||target.iframes>0)return;const armor=(target===run.partner?run.partnerForm:run.form)==='rock'?.7:1;target.hp=Math.max(0,target.hp-amount*armor*(1-(run.gear?.armor??0))*(ENCOUNTERS[run.room]?.damage??1));target.iframes=.7;run.damageFlash=.22;if(target.hp<=0){if(!run.partner||[run.player,run.partner].every(p=>p.hp<=0)){run.phase='dead';run.notice='The bodies end. The sparks return.';}else{run.notice='A vessel fell. Stand close and hold E to rekindle your partner.';run.noticeTime=6;}}}
function fire(run,x,y,angle,damage,enemy=false,speed=430,range=700,homing=false){if(run.shots.length>240)return;run.shots.push({id:randomId(run),x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,damage,enemy,r:enemy?6:5,life:range/speed,homing,color:enemy?'#dd8f85':BODIES[run.form].color});}
function attack(run){
  const p=run.player,body=BODIES[run.form],range=body.range*(1+(run.gear?.range??0)),enemies=run.enemies.filter(e=>e.hp>0),target=enemies.sort((a,b)=>dist(p,a)-dist(p,b))[0];if(!target||dist(p,target)>range)return;
  const damage=body.damage*(1+run.boons.edge*.24+run.memoryEdge+(run.gear?.damage??0)+(!['spark','computer'].includes(run.form)?run.gear?.melee??0:0)),angle=Math.atan2(target.y-p.y,target.x-p.x);p.facingX=Math.cos(angle);p.facingY=Math.sin(angle);
  if(run.form==='spark')fire(run,p.x,p.y,angle,damage,false,390,range,true);
  else if(run.form==='computer')for(const a of [-.17,0,.17])fire(run,p.x,p.y,angle+a,damage,false,500,range,false);
  else {const radius=range;for(const enemy of enemies){const distance=dist(p,enemy);if(distance<radius+enemy.r){if(run.form==='human'||run.form==='animal'){const a=Math.atan2(enemy.y-p.y,enemy.x-p.x);if(Math.cos(a-angle)>.05)damageEnemy(run,enemy,damage);}else damageEnemy(run,enemy,damage);}}effect(run,run.form==='human'||run.form==='animal'?'slash':'wave',p.x,p.y,body.color,radius);}
}
function offerBoons(run){const list=Object.keys(BOONS).filter(id=>id!=='orbit'||run.boons.orbit<4);run.choices=[];while(run.choices.length<3&&list.length){const i=Math.floor(rand(run)*list.length);run.choices.push(list.splice(i,1)[0]);}run.phase='boon';}
export function chooseBoon(run,id){
  if(run.phase!=='boon'||!run.choices.includes(id))throw new Error('This gift is not offered.');run.boons[id]++;
  if(id==='shell')for(const p of [run.player,run.partner].filter(Boolean)){p.maxHp+=25;p.hp=Math.min(p.maxHp,p.hp+35);}
  run.phase='playing';run.choices=[];run.notice=BOONS[id].name+' remembers you.';run.noticeTime=3;
  if(run.xp>=run.nextXp){run.xp-=run.nextXp;run.level++;run.nextXp=6+run.level*4;offerBoons(run);}
}
function clearRoom(run){
  if(run.cleared.includes(run.room))return;
  run.cleared.push(run.room);run.loot??=[];const item=ROOMS[run.room].loot;if(item&&!run.loot.includes(item))run.loot.push(item);for(const actor of [run.player,run.partner].filter(p=>p&&p.hp>0))actor.hp=Math.min(actor.maxHp,actor.hp+12);if(ROOMS[run.room].miniboss)run.essence+=7;const reward=ROOMS[run.room].reward;
  if(reward){if(!run.abilities.includes(reward))run.abilities.push(reward);if(!run.earnedAbilities.includes(reward))run.earnedAbilities.push(reward);}
  if(ROOMS[run.room].boss){run.phase='won';run.essence+=20;run.karma=clamp(run.karma+10,-100,100);run.awareness=clamp(run.awareness+10,0,100);return;}
  run.phase='resolve';run.shots=[];run.marks=[];
}
export function resolveChamber(run,choice){
  if(run.phase!=='resolve'||![0,1,2].includes(choice))throw new Error('This chamber is not awaiting that choice.');
  if(choice===0){run.karma=clamp(run.karma+7,-100,100);run.essence+=3;run.player.hp=Math.min(run.player.maxHp,run.player.hp+10);run.notice='You free the trapped light. The world keeps a little more possibility.';}
  if(choice===1){run.karma=clamp(run.karma-9,-100,100);run.essence+=8;run.player.hp=Math.min(run.player.maxHp,run.player.hp+25);run.notice='You harvest the machinery. Your next life will feel the weight of this choice.';}
  if(choice===2){run.karma=clamp(run.karma+2,-100,100);run.awareness=clamp(run.awareness+7,0,100);run.essence+=5;run.notice='You listen before leaving. A pattern survives as understanding.';}
  recordDecision(run,choice);if(run.partner){const heal=choice===0?10:choice===1?25:0;run.partner.hp=Math.min(run.partner.maxHp,Math.max(run.partner.hp,run.partner.hp<=0?run.partner.maxHp*.4:0)+heal);}
  // Uncollected fragments are kept when a room is resolved, not lost at its exit.
  const xp=run.fragments.reduce((sum,f)=>sum+f.value,0);run.xp+=xp;run.fragments=[];
  run.roomResolved.push(run.room);run.phase='playing';run.noticeTime=5;
  if(run.xp>=run.nextXp){run.xp-=run.nextXp;run.level++;run.nextXp=6+run.level*4;offerBoons(run);}
}
export function dashCooldown(run){return Math.max(.48,1.65*(.78**run.boons.dash)*(1-(run.gear?.dash??0)));}
const validActor=p=>p&&['x','y','hp','maxHp','r','facingX','facingY','iframes','dashTime','dashX','dashY','dashCooldown','attackClock'].every(k=>Number.isFinite(p[k]))&&p.hp>=0&&p.hp<=p.maxHp&&p.maxHp>0&&p.x>=0&&p.x<=WIDTH&&p.y>=0&&p.y<=HEIGHT;
export function addPartner(run,form,replace=false){if(!BODIES[form])throw Error('Unknown partner form.');if(run.partner&&!replace)return;const previous=run.partner,bonus=run.player.maxHp-BODIES[run.form].hp,maxHp=BODIES[form].hp+bonus;run.partnerForm=form;run.partner={...structuredClone(run.player),x:previous?.x??clamp(run.player.x+48,49,WIDTH-49),y:previous?.y??run.player.y,hp:previous?maxHp*previous.hp/previous.maxHp:maxHp,maxHp,revive:0};const ability=BODIES[form].ability;if(ability&&!run.abilities.includes(ability))run.abilities.push(ability);}
function stepActor(run,p,form,input,dt){
 const x=Number(input.x??0),y=Number(input.y??0);if(!Number.isFinite(x)||!Number.isFinite(y))throw Error('Movement must be finite.');if(p.hp<=0)return;
 const length=Math.hypot(x,y),mx=length>1?x/length:x,my=length>1?y/length:y,body=BODIES[form];p.iframes=Math.max(0,p.iframes-dt);p.dashCooldown=Math.max(0,p.dashCooldown-dt);
 if(input.dash&&p.dashCooldown===0){p.dashTime=.16;p.iframes=Math.max(p.iframes,.27);p.dashX=length?mx:p.facingX;p.dashY=length?my:p.facingY;p.dashCooldown=dashCooldown(run);effect(run,'wave',p.x,p.y,body.color,27);}
 if(p.dashTime>0){move(run,p,p.dashX*830*dt,p.dashY*830*dt,run.abilities.includes('phase'));p.dashTime=Math.max(0,p.dashTime-dt);}else{move(run,p,mx*body.speed*(1+(run.gear?.speed??0))*dt,my*body.speed*(1+(run.gear?.speed??0))*dt);if(length){p.facingX=mx;p.facingY=my;}}
 const other=run.partner?(p===run.player?run.partner:run.player):null;
 if(other&&other.hp<=0){if(input.interact&&dist(p,other)<80){other.revive=(other.revive??0)+dt;if(other.revive>=1.8){other.hp=other.maxHp*.4;other.iframes=2;other.revive=0;effect(run,'wave',other.x,other.y,'#dfe5a7',65);run.notice='The spark answers. Your partner is rekindled.';run.noticeTime=4;}}else other.revive=0;}
 else if(input.interact){const primary=run.player;run.player=p;const gate=nearestGate(run);run.player=primary;if(gate&&gate.distance<83){if(gate.available){if(other&&other.hp>0&&dist(other,gate.position)>170){run.notice='Bring your partner to this gate before crossing.';run.noticeTime=2;}else{if(p!==run.player){run.player.x=p.x;run.player.y=p.y;}enterGate(run,gate.direction);}}else{run.notice=gate.reason;run.noticeTime=2.5;}}}
 p.attackClock-=dt;if(p.attackClock<=0){const previousPlayer=run.player,previousForm=run.form;run.player=p;run.form=form;attack(run);run.player=previousPlayer;run.form=previousForm;p.attackClock=body.interval/Math.min(3,1+run.boons.cadence*.18+run.memoryHaste+(run.gear?.haste??0));}
}
export function stepRun(run,input={},dt=1/60){
  if(run.phase!=='playing')return;
  if(!Number.isFinite(dt)||dt<=0||dt>.05)throw new Error('Simulation steps must be between zero and 0.05 seconds.');
  const x=Number(input.x??0),y=Number(input.y??0);if(!Number.isFinite(x)||!Number.isFinite(y))throw new Error('Movement must be finite.');
  if(input.partner&&(!Number.isFinite(input.partner.x??0)||!Number.isFinite(input.partner.y??0)))throw Error('Movement must be finite.');
  const p=run.player;
  run.time+=dt;run.roomTime+=dt;run.noticeTime=Math.max(0,run.noticeTime-dt);run.damageFlash=Math.max(0,run.damageFlash-dt);
  stepActor(run,p,run.form,input,dt);if(run.partner)stepActor(run,run.partner,run.partnerForm,input.partner??{},dt);
  if(!ROOMS[run.room].safe&&!ROOMS[run.room].boss&&!ROOMS[run.room].miniboss&&!run.cleared.includes(run.room)&&run.spawned<run.spawnTotal&&run.enemies.length<(ENCOUNTERS[run.room]?.cap??30)){run.spawnClock-=dt;if(run.spawnClock<=0){spawnEnemy(run);run.spawnClock=(ENCOUNTERS[run.room]?.interval??.6)+rand(run)*.3;}}
  const living=[run.player,run.partner].filter(a=>a&&a.hp>0);
  const orbitCount=run.boons.orbit;
  for(const enemy of run.enemies){
    if(enemy.hp<=0)continue;enemy.flash=Math.max(0,enemy.flash-dt);enemy.orbitHit=Math.max(0,enemy.orbitHit-dt);const target=living.reduce((a,b)=>!a||dist(enemy,b)<dist(enemy,a)?b:a,null)??p,d=dist(enemy,target),dx=(target.x-enemy.x)/(d||1),dy=(target.y-enemy.y)/(d||1);
    if(enemy.kind==='collector'){move(run,enemy,dx*enemy.speed*dt,dy*enemy.speed*dt);if(d<target.r+enemy.r+3)hurt(run,10,target);}
    else if(enemy.kind==='hound'){
      enemy.attack-=dt;if(enemy.windup>0){enemy.windup-=dt;if(enemy.windup<=0)enemy.charge=.34;}
      else if(enemy.charge>0){move(run,enemy,enemy.chargeX*480*dt,enemy.chargeY*480*dt,true);enemy.charge=Math.max(0,enemy.charge-dt);}
      else if(enemy.attack<=0){enemy.windup=.65;enemy.chargeX=dx;enemy.chargeY=dy;enemy.attack=2.8;}
      else move(run,enemy,dx*enemy.speed*dt,dy*enemy.speed*dt);
      if(d<target.r+enemy.r+5)hurt(run,enemy.charge>0?16:9,target);
    }else if(enemy.kind==='leech'){
      enemy.attack-=dt;if(enemy.windup>0){enemy.windup-=dt;if(enemy.windup<=0){const tx=target.x-enemy.x,ty=target.y-enemy.y,forward=tx*enemy.chargeX+ty*enemy.chargeY,lateral=Math.abs(tx*enemy.chargeY-ty*enemy.chargeX);if(forward>0&&forward<230&&lateral<28)hurt(run,12,target);effect(run,'wave',enemy.x,enemy.y,'#91d7d3',45);enemy.attack=3;}}
      else if(enemy.attack<=0&&d<230){enemy.windup=.85;enemy.chargeX=dx;enemy.chargeY=dy;}else{const sign=d>180?1:-.3;move(run,enemy,dx*enemy.speed*sign*dt,dy*enemy.speed*sign*dt,true);}
    }else if(enemy.kind==='moth'){
      if(enemy.windup>0){enemy.windup-=dt;if(enemy.windup<=0){enemy.hp=0;run.kills++;run.fragments.push({id:randomId(run),x:enemy.x,y:enemy.y,value:2,r:5});effect(run,'burst',enemy.x,enemy.y,'#ecb877',40);}}
      else if(d<85){enemy.windup=1.15;run.marks.push({x:enemy.x,y:enemy.y,r:72,timer:1.15,life:1.15,color:'#edb66c',damage:17,sourceId:enemy.id});}else move(run,enemy,dx*enemy.speed*dt,dy*enemy.speed*dt);
    }else if(enemy.kind==='spore'||enemy.kind==='oracle'){
      const sign=d<185?-.4:d>320?1:0;move(run,enemy,dx*enemy.speed*sign*dt,dy*enemy.speed*sign*dt,true);enemy.attack-=dt;
      if(enemy.attack<=0){if(enemy.kind==='spore'){run.marks.push({x:target.x,y:target.y,r:52,timer:1.15,life:1.15,color:'#b9c989',damage:15});enemy.attack=3.1;}else{if(run.enemies.length<32){spawnEnemy(run,'collector',false);spawnEnemy(run,'collector',false);}effect(run,'wave',enemy.x,enemy.y,'#e2d1ac',55);enemy.attack=5.3;}}
      if(d<target.r+enemy.r)hurt(run,8,target);
    }else{const sign=d<(enemy.kind==='warden'?180:165)?-.4:d>260?1:0;move(run,enemy,dx*enemy.speed*sign*dt,dy*enemy.speed*sign*dt,true);enemy.attack-=dt;
      if(enemy.attack<=0){const angle=Math.atan2(target.y-enemy.y,target.x-enemy.x);if(enemy.kind==='cantor'){for(let i=0;i<6;i++)fire(run,enemy.x,enemy.y,run.time*.3+i*Math.PI/3,11,true,160,850);enemy.attack=2.2;}else if(enemy.kind==='warden'){const enraged=enemy.hp<enemy.maxHp*.5;for(const spread of enraged?[-.36,-.18,0,.18,.36]:[-.2,0,.2])fire(run,enemy.x,enemy.y,angle+spread,14,true,enraged?260:220,1000);enemy.attack=enraged?.9:1.4;}else{for(const spread of enemy.kind==='mirror'?[-.12,.12]:[0])fire(run,enemy.x,enemy.y,angle+spread,10,true,190,750);enemy.attack=2.3;}}
      if(enemy.kind==='mirror')enemy.shield=run.time%3.8<1.4?1:0;
      if(enemy.kind==='warden'&&enemy.hp<enemy.maxHp*.5&&!enemy.enraged){enemy.enraged=true;for(let i=0;i<10;i++)fire(run,enemy.x,enemy.y,i*Math.PI/5,12,true,155,900);spawnEnemy(run,'hound',false);spawnEnemy(run,'hound',false);}
      if(enemy.kind==='warden'||enemy.kind==='cantor'){enemy.markClock-=dt;if(enemy.markClock<=0){run.marks.push({x:target.x,y:target.y,r:enemy.kind==='cantor'?62:70,timer:enemy.kind==='cantor'?1.2:.9,life:enemy.kind==='cantor'?1.2:.9});enemy.markClock=enemy.hp<enemy.maxHp*.5?2.6:3.6;}}
      if(d<target.r+enemy.r)hurt(run,enemy.kind==='warden'?22:9,target);
    }
    if(orbitCount&&enemy.orbitHit===0){for(const actor of living)for(let i=0;i<orbitCount;i++){const angle=run.time*2.9+i*Math.PI*2/orbitCount,orb={x:actor.x+Math.cos(angle)*68,y:actor.y+Math.sin(angle)*68};if(dist(enemy,orb)<enemy.r+16){damageEnemy(run,enemy,13*(1+run.boons.edge*.15));enemy.orbitHit=.3;break;}}}
  }
  for(const shot of run.shots){shot.life-=dt;if(shot.life<=0)continue;
    if(shot.homing){let closest=null;for(const enemy of run.enemies)if(enemy.hp>0&&(!closest||dist(shot,enemy)<dist(shot,closest)))closest=enemy;if(closest){const angle=Math.atan2(closest.y-shot.y,closest.x-shot.x);shot.vx=shot.vx*.88+Math.cos(angle)*390*.12;shot.vy=shot.vy*.88+Math.sin(angle)*390*.12;}}
    shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;
    if(shot.enemy){for(const actor of living)if(shot.life>0&&dist(shot,actor)<shot.r+actor.r){hurt(run,shot.damage,actor);shot.life=0;}}
    else for(const enemy of run.enemies)if(enemy.hp>0&&dist(shot,enemy)<shot.r+enemy.r){damageEnemy(run,enemy,shot.damage);shot.life=0;break;}
  }
  for(const mark of run.marks){mark.timer-=dt;if(mark.timer<=0&&mark.timer+dt>0){for(const actor of living)if(dist(actor,mark)<mark.r)hurt(run,mark.damage??23,actor);effect(run,'wave',mark.x,mark.y,mark.color??'#dd8f85',mark.r);}}
  for(const fragment of run.fragments){const collector=living.reduce((a,b)=>!a||dist(fragment,b)<dist(fragment,a)?b:a,null)??p,d=dist(fragment,collector),magnet=95+run.boons.magnet*75;if(d<magnet&&d>1){fragment.x+=(collector.x-fragment.x)/d*350*dt;fragment.y+=(collector.y-fragment.y)/d*350*dt;}if(d<23){run.xp+=fragment.value;fragment.value=0;}}
  for(const fx of run.effects)fx.life-=dt;
  run.enemies=run.enemies.filter(e=>e.hp>0);run.shots=run.shots.filter(s=>s.life>0&&s.x>-30&&s.x<WIDTH+30&&s.y>-30&&s.y<HEIGHT+30);run.fragments=run.fragments.filter(f=>f.value>0);run.effects=run.effects.filter(f=>f.life>0);run.marks=run.marks.filter(m=>m.timer>0);
  if(run.phase==='playing')for(const actor of living)actor.hp=Math.min(actor.maxHp,actor.hp+dt*(run.boons.regeneration+((actor===run.partner?run.partnerForm:run.form)==='tree'?.4:0)));
  if(run.phase!=='playing')return;
  if(ROOMS[run.room].miniboss&&run.spawned>=1&&!run.enemies.some(e=>e.kind==='cantor')){clearRoom(run);return;}
  if(ROOMS[run.room].boss&&run.spawned>=1&&!run.enemies.some(e=>e.kind==='warden')){clearRoom(run);return;}
  if(run.xp>=run.nextXp){run.xp-=run.nextXp;run.level++;run.nextXp=6+run.level*4;offerBoons(run);return;}
  if(!ROOMS[run.room].safe&&!run.cleared.includes(run.room)&&run.spawned>=run.spawnTotal&&run.enemies.length===0)clearRoom(run);
}
export function settleRun(run,meta){
  if(!['dead','won'].includes(run.phase)||run.settled)throw new Error('This run cannot be recorded twice or before it ends.');
  const next=prepareEquipment(meta);for(const id of run.loot??[])if(EQUIPMENT[id]&&!(id in next.inventory))next.inventory[id]=0;next.runs++;next.wins+=run.phase==='won'?1:0;next.karma=run.karma;next.awareness=run.awareness;next.essence+=earnedEssence(run,meta);next.bestRooms=Math.max(next.bestRooms,run.cleared.length-1);next.abilities=[...new Set([...next.abilities,...run.earnedAbilities])];if(!next.visited.includes(run.form))next.visited.push(run.form);next.echoes.unshift({form:run.form,rooms:run.cleared.length-1,kills:run.kills,won:run.phase==='won',karma:run.karma,seconds:Math.round(run.time)});next.echoes=next.echoes.slice(0,20);next.journal=[...(run.journal??[]),...(next.journal??[])].filter((v,i,a)=>a.findIndex(x=>x.id===v.id)===i).slice(0,30);next.seenEnemies=[...new Set([...(next.seenEnemies??[]),...(run.seenEnemies??[])])];run.settled=true;return next;
}
export function earnedEssence(run,meta){return Math.max(run.essence+Math.floor(run.kills/8),meta.runs===0&&run.kills>0?4:0);}
export const MEMORY_GIFTS={heart:{name:'A stronger vessel',desc:'+12 health in every new life',baseCost:4},edge:{name:'A remembered edge',desc:'+7% damage in every new life',baseCost:6},haste:{name:'A quicker thought',desc:'+2.5% attack speed in every new life',baseCost:4}};
export function memoryCost(meta,id){if(!MEMORY_GIFTS[id])return Infinity;return MEMORY_GIFTS[id].baseCost+meta.gifts[id]*3;}
export function buyMemory(meta,id){if(!MEMORY_GIFTS[id]||meta.gifts[id]>=8||meta.essence<memoryCost(meta,id))throw new Error('This memory is not available.');const next=structuredClone(meta);next.essence-=memoryCost(meta,id);next.gifts[id]++;return next;}
export function observeRun(run,meta){return {phase:run?.phase??'between',form:run?.form??null,room:run?.room??null,player:run?{x:run.player.x,y:run.player.y,hp:run.player.hp,maxHp:run.player.maxHp,dashReady:run.player.dashCooldown===0}:null,enemies:run?run.enemies.map(e=>({id:e.id,kind:e.kind,x:e.x,y:e.y,hp:e.hp})):[],fragments:run?run.fragments.map(f=>({x:f.x,y:f.y,value:f.value})):[],level:run?.level??0,boons:run?.boons??{},choices:run?.choices??[],karma:run?.karma??meta.karma,abilities:run?.abilities??meta.abilities,cleared:run?.cleared??[],exits:run?Object.keys(ROOMS[run.room].exits).map(dir=>({direction:dir,...exitPosition(dir),...gateStatus(run,dir)})):[],offeredForms:offeredForms(meta),essence:meta.essence,equipment:run?.loadout??prepareEquipment(meta).loadout,loot:run?.loot??[]};}
export function validMeta(meta){return !!meta&&validEquipment(meta)&&meta.version===2&&['karma','awareness','essence','runs','wins','bestRooms'].every(k=>Number.isFinite(meta[k]))&&meta.karma>=-100&&meta.karma<=100&&meta.awareness>=0&&meta.awareness<=100&&meta.essence>=0&&meta.runs>=0&&Array.isArray(meta.abilities)&&meta.abilities.every(a=>ABILITIES[a])&&meta.gifts&&Object.keys(MEMORY_GIFTS).every(k=>Number.isInteger(meta.gifts[k])&&meta.gifts[k]>=0&&meta.gifts[k]<=8)&&Array.isArray(meta.echoes)&&Array.isArray(meta.visited)&&meta.visited.every(f=>BODIES[f]);}
export function validRun(run){
  if(!run||run.version!==2||!BODIES[run.form]||!ROOMS[run.room]||!['playing','boon','resolve','dead','won'].includes(run.phase))return false;
  if(!['time','roomTime','rng','serial','spawnClock','spawned','spawnTotal','level','xp','nextXp','kills','karma','awareness','essence','memoryEdge','memoryHaste'].every(k=>Number.isFinite(run[k])))return false;
  if(run.time<0||run.level<1||run.nextXp<=0||run.karma< -100||run.karma>100||run.awareness<0||run.awareness>100)return false;
  if(!run.player||!['x','y','hp','maxHp','r','facingX','facingY','iframes','dashTime','dashX','dashY','dashCooldown','attackClock'].every(k=>Number.isFinite(run.player[k])))return false;
  if(run.player.hp<0||run.player.hp>run.player.maxHp||run.player.maxHp<=0||run.player.x<0||run.player.x>WIDTH||run.player.y<0||run.player.y>HEIGHT)return false;
  if(!['enemies','shots','fragments','effects','marks','cleared','discovered','abilities','earnedAbilities','roomResolved','choices'].every(k=>Array.isArray(run[k])))return false;
  if(run.enemies.length>128||run.shots.length>300||run.fragments.length>1000||run.effects.length>160||run.marks.length>50)return false;
  if(!run.enemies.every(e=>ENEMY_KINDS.includes(e.kind)&&['x','y','hp','maxHp','r','speed','attack','orbitHit','flash'].every(k=>Number.isFinite(e[k]))))return false;
  if(!run.shots.every(s=>['x','y','vx','vy','damage','r','life'].every(k=>Number.isFinite(s[k])))||!run.fragments.every(f=>['x','y','value','r'].every(k=>Number.isFinite(f[k]))))return false;
  if(run.gear&&(!Object.entries(run.gear).every(([key,n])=>['health','damage','range','speed','melee','haste','dash','armor'].includes(key)&&Number.isFinite(n)&&n>=0&&n<=(key==='health'?100:['armor','dash'].includes(key)?.9:2))||!validEquipment({inventory:Object.fromEntries(Object.values(run.loadout??{}).map(id=>[id,0])),loadout:run.loadout})))return false;
  if(run.loot&&(!Array.isArray(run.loot)||!run.loot.every(id=>EQUIPMENT[id])))return false;
  if(run.partner&&(!BODIES[run.partnerForm]||!validActor(run.partner)))return false;
  return run.abilities.every(a=>ABILITIES[a])&&run.earnedAbilities.every(a=>ABILITIES[a])&&run.cleared.every(r=>ROOMS[r])&&run.discovered.every(r=>ROOMS[r])&&run.choices.every(b=>BOONS[b])&&run.boons&&Object.keys(BOONS).every(k=>Number.isFinite(run.boons[k])&&run.boons[k]>=0);
}
