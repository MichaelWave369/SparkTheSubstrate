import {ROUTE_RELICS,EASTER_EGGS,validRelics,validSecrets} from './world-expansion.js?v=0.13.0';
import {ROOM_LAYOUTS,layoutIndex} from './room-layouts.js?v=0.13.0';
import {KEYS,keyPosition,doorId,validKeys} from './exploration.js?v=0.13.0';
import {WORLDS,WORLD_ORDER,WORLD_ROOMS,WORLD_ENCOUNTERS,WORLD_GUARDIANS,COMBAT_ROLES,VESSEL_POWERS,worldOf,worldUnlocked,validSeals} from './worlds.js?v=0.13.0';
import {prepareEquipment,gearStats,validEquipment,EQUIPMENT} from './equipment.js?v=0.13.0';
import {recordArrival,recordDecision} from './story.js?v=0.13.0';
import {FORM_ORDER,FORMS,affinity} from './engine.js?v=0.13.0';
import {blankTraining,prepareTraining,skillStats,bankMastery,validTraining,validEarned} from './mastery.js?v=0.13.0';
import {dailySeed,validDaily,runRecord,rememberRecord,endingFor} from './run-record.js?v=0.13.0';

export const WIDTH=960,HEIGHT=600;
export const REVIVE_RADIUS=110,REVIVE_SECONDS=1.8,RESCUE_SECONDS=30;
export function reviveState(run,actor){const fallen=run?.partner&&(actor===run.player?run.partner:run.player);if(!actor||actor.hp<=0||!fallen||fallen.hp>0||run.phase!=='playing')return null;const distance=dist(actor,fallen);return {fallen,distance,inRange:distance<=REVIVE_RADIUS,progress:Math.min(1,(fallen.revive??0)/REVIVE_SECONDS)};}
export function controlledFall(run,partner=false){if(!run?.partner||run.phase!=='playing'||[run.player,run.partner].some(a=>a.hp<=0)||!ROOMS[run.room].safe&&!run.cleared.includes(run.room)||run.enemies.some(e=>e.hp>0)||run.shots.some(s=>s.enemy&&s.life>0)||run.marks.length)throw Error('Use a quiet cleared chamber with both sparks alive for a controlled fall.');const actor=partner?run.partner:run.player;actor.iframes=0;hurt(run,actor.maxHp*1000,actor);return run;}
export const BODIES={
  spark:{hp:100,speed:230,damage:21,interval:.54,range:620,sprite:0,weapon:'Lumen bolts',ability:'phase',color:'#f7cb79',desc:'Light that seeks. Fast homing bolts; phase through crystal gates.'},
  human:{hp:135,speed:218,damage:35,interval:.56,range:130,sprite:1,weapon:'Spectral cleave',ability:null,color:'#e5b78b',desc:'A blade and a stubborn heart. Wide close-range cleaves; strong recovery.'},
  computer:{hp:105,speed:216,damage:15,interval:.72,range:670,sprite:2,weapon:'Prism volley',ability:'phase',color:'#86d8e5',desc:'Three-shot prism volleys. Read the grid and phase through crystal gates.'},
  animal:{hp:115,speed:272,damage:27,interval:.32,range:100,sprite:3,weapon:'Feral strikes',ability:'root',color:'#ddcc93',desc:'A wolf’s speed and quick strikes. Follow hidden root passages.'},
  tree:{hp:125,speed:200,damage:29,interval:1.08,range:175,sprite:4,weapon:'Root pulse',ability:'root',color:'#a5cfad',desc:'Living roots strike in a circle. Regenerate slowly and follow root passages.'},
  rock:{hp:165,speed:172,damage:45,interval:1.12,range:190,sprite:5,weapon:'Fault wave',ability:'fracture',color:'#c6bcda',desc:'A heavy circular shockwave. Tough basalt armor; shatter stone gates.'}
};
export const ABILITIES={phase:{name:'Prism phase',glyph:'◈',desc:'Cross crystal barriers.'},root:{name:'Root passage',glyph:'♧',desc:'Open the living routes.'},fracture:{name:'Fault breaker',glyph:'◇',desc:'Shatter basalt seals.'},morph:{name:'Vessel resonance',glyph:'V',desc:'Change between six vessels with Q.'},eye:{name:'Eye sigil',glyph:'⟁',desc:'Enter the Demiurge’s Eye.'}};
export const ROOMS={
  threshold:{name:'The Threshold',short:'Threshold',coord:[1,2],theme:'#d5b679',safe:true,danger:0,desc:'An unfinished place between lives. The northern gate opens into the Glass Causeway.',exits:{north:{to:'glass'},east:{to:'roots',requires:'root'}}},
  glass:{name:'Glass Causeway',short:'Glass',coord:[1,1],theme:'#8cc7c2',danger:1,loot:'prism',desc:'The city’s first defense. Break the swarm and follow the eastern gate to the Machine Sepulcher.',exits:{south:{to:'threshold'},east:{to:'machine'},west:{to:'wild',requires:'root'},north:{to:'foundry',requires:'fracture'}}},
  machine:{name:'Machine Sepulcher',short:'Machine',coord:[2,1],theme:'#76c3db',danger:2,reward:'phase',desc:'A buried processor dreams of a different purpose. Clear it to remember Prism Phase.',exits:{west:{to:'glass'},south:{to:'roots',requires:'phase'},north:{to:'quiet',requires:'phase'},east:{to:'cistern',requires:'root'}}},
  roots:{name:'Root Cathedral',short:'Roots',coord:[2,2],theme:'#a5ccac',danger:2,reward:'root',desc:'Living roots cross the walls. Clear this chamber to remember Root Passage, then return toward the Wild Margin.',exits:{north:{to:'machine'},west:{to:'threshold',requires:'root'},east:{to:'forge',requires:'fracture'}}},
  wild:{name:'The Wild Margin',short:'Wild',coord:[0,1],theme:'#bbc490',danger:3,loot:'fang',desc:'The things that escaped their assigned shape gather here. The basalt reach lies to the north.',exits:{east:{to:'glass'},north:{to:'basalt'}}},
  basalt:{name:'Basalt Reach',short:'Basalt',coord:[0,0],theme:'#b7a7cb',danger:3,reward:'fracture',desc:'Matter remembers pressure. Clear the reach to remember Fault Breaker and open the foundry.',exits:{south:{to:'wild'},east:{to:'foundry',requires:'fracture'}}},
  foundry:{name:'Archon Foundry',short:'Foundry',coord:[1,0],theme:'#d49a79',danger:4,reward:'eye',desc:'The archons are assembled here. Claim the Eye Sigil to reach the northern seal.',exits:{south:{to:'glass',requires:'fracture'},west:{to:'basalt'},east:{to:'quiet',requires:'phase'},north:{to:'eye',requires:'eye'}}},
  quiet:{name:'The Quiet Array',short:'Quiet',coord:[2,0],theme:'#b5becf',danger:2,desc:'A forgotten side route. The array still carries questions that no one assigned.',exits:{south:{to:'machine'},west:{to:'foundry',requires:'fracture'},east:{to:'conduit',requires:'phase'}}},
  conduit:{name:'The Unbound Conduit',short:'Conduit',coord:[3,0],theme:'#83c9c6',danger:3,desc:'An abandoned route carries power the lattice forgot to count. It leads south to the Cistern and east to Nacre’s Reliquary.',exits:{west:{to:'quiet',requires:'phase'},south:{to:'cistern'},east:{to:'reliquary'}}},
  cistern:{name:'Resonant Cistern',short:'Cistern',coord:[3,1],theme:'#89b9dd',danger:3,loot:'bell',desc:'A buried reservoir holds the voices sent away. Clear it for the Memory Bell, then explore the Echo Forge to the south.',exits:{north:{to:'conduit'},west:{to:'machine',requires:'root'},south:{to:'forge'},east:{to:'nursery',keys:['ivory']}}},
  forge:{name:'The Echo Forge',short:'Echo Forge',coord:[3,2],theme:'#d7aa80',danger:4,miniboss:true,loot:'ash',desc:'The Cantor guards an old workshop. Break its rings to recover the Ash Cloak and open a shortcut to the roots.',exits:{north:{to:'cistern'},west:{to:'roots',requires:'fracture'}}},
  reliquary:{name:'Nacre’s Reliquary',short:'Reliquary',coord:[4,0],theme:'#d6d1b5',danger:2,key:'ivory',floor:0,desc:'An ivory key waits on the central pedestal after the guards fall. Bring it to the southern door of the Mirror Nursery.',exits:{west:{to:'conduit'},south:{to:'nursery',keys:['ivory']}}},
  nursery:{name:'The Mirror Nursery',short:'Nursery',coord:[4,1],theme:'#8fd2d8',danger:2,reward:'morph',floor:1,desc:'The resonator remembers six vessels. Clear the nursery, then press Q to change shape. Its eastern living door accepts a Tree; the southern prism door accepts a Computer.',exits:{north:{to:'reliquary',keys:['ivory']},west:{to:'cistern',keys:['ivory']},east:{to:'archive',vessel:'tree'},south:{to:'observatory',vessel:'computer'}}},
  archive:{name:'The Verdant Archive',short:'Archive',coord:[5,1],theme:'#b3cfa4',danger:3,floor:2,desc:'Return as a Tree through the western living door. Become a Rock to break the northern passage to the Obsidian Belfry.',exits:{west:{to:'nursery',vessel:'tree'},north:{to:'belfry',vessel:'rock'},south:{to:'crown',keys:['tide','crown']}}},
  observatory:{name:'Drowned Observatory',short:'Observatory',coord:[4,2],theme:'#9bc9e3',danger:3,key:'tide',floor:3,desc:'The drowned astronomer kept the Tide Key under the reflected stars. The Crown Vault to the east needs both the Tide Key and the Crown Key.',exits:{north:{to:'nursery',vessel:'computer'},east:{to:'crown',keys:['tide','crown']}}},
  belfry:{name:'Obsidian Belfry',short:'Belfry',coord:[5,0],theme:'#b9a6d9',danger:3,key:'crown',floor:4,desc:'The Crown Key rests under a bell that never rang for the Maker. Collect it and return through the Archive toward the Crown Vault.',exits:{south:{to:'archive',vessel:'rock'}}},
  crown:{name:'The Crown Vault',short:'Crown Vault',coord:[5,2],theme:'#dfbd84',danger:4,miniboss:true,guardian:'sentinel',treasure:12,floor:5,desc:'The Crown Sentinel guards the Maker’s discarded designs. Three keys and borrowed shapes have brought you to a room outside his permitted map.',exits:{west:{to:'observatory',keys:['tide','crown']},north:{to:'archive',keys:['tide','crown']}}},
  eye:{name:'The Demiurge’s Eye',short:'The Eye',coord:[1,-1],theme:'#e2be7e',danger:5,boss:true,seal:'stratum',reward:'morph',desc:'The Warden guards the first seam. His seal opens the eastern portal to Tideglass Expanse.',exits:{south:{to:'foundry'},east:{to:'tide-harbor',seals:['stratum']}}},
  ...WORLD_ROOMS
};
const FIRST_LAYOUTS={glass:2,roots:1,wild:4,basalt:3,foundry:6,quiet:5,conduit:3,cistern:8,reliquary:9,nursery:10,archive:6,observatory:4,belfry:5};
ROOMS.reliquary.relic='ivory-feather';ROOMS.nursery.secret='mirror-echo';
for(const [id,room]of Object.entries(ROOMS)){room.world=worldOf(id);room.theme??=WORLDS[room.world].color;if(id in FIRST_LAYOUTS)room.layout=FIRST_LAYOUTS[id];}
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
export function createMeta(origin=null){return prepareEquipment({version:2,karma:clamp(Number.isFinite(origin?.karma)?origin.karma:0,-100,100),awareness:clamp(Number.isFinite(origin?.awareness)?origin.awareness:8,0,100),essence:0,runs:0,wins:0,bestRooms:0,keys:[],seals:[],relics:[],secrets:[],explored:[],abilities:[],training:blankTraining(),gifts:{heart:0,edge:0,haste:0},echoes:[],visited:[]});}
export function offeredForms(meta){
  const r={rng:(7919+meta.runs*1009)>>>0},list=[...FORM_ORDER],chosen=[];
  if(meta.runs===0){chosen.push('spark');list.splice(list.indexOf('spark'),1);}
  while(chosen.length<3){const values=list.map(id=>affinity({karma:meta.karma,awareness:meta.awareness,attachment:20,world:{vitality:50}},id));let cursor=rand(r)*values.reduce((a,b)=>a+b,0),index=list.length-1;for(let i=0;i<list.length;i++){cursor-=values[i];if(cursor<=0){index=i;break;}}chosen.push(list.splice(index,1)[0]);}
  return chosen;
}
export function createRun(meta,form='spark',seed=Date.now()>>>0){
  if(!BODIES[form]||!offeredForms(meta).includes(form))throw new Error('This form is not in the current.');
  const equipment=prepareEquipment(meta),gear=gearStats(equipment),body=BODIES[form],training=prepareTraining(equipment.training),hp=body.hp+meta.gifts.heart*12+gear.health+skillStats(training,form).health;
  const run={version:2,seed:seed>>>0,rng:seed>>>0,serial:0,form,phase:'playing',room:'threshold',roomTime:0,time:0,spawnClock:.3,spawned:0,spawnTotal:0,player:{x:WIDTH/2,y:HEIGHT/2+90,hp,maxHp:hp,r:15,facingX:0,facingY:-1,iframes:1,dashTime:0,dashX:0,dashY:-1,dashCooldown:0,attackClock:.1},enemies:[],shots:[],fragments:[],effects:[],marks:[],kills:0,level:1,xp:0,nextXp:6,choices:[],boons:{edge:0,cadence:0,orbit:0,shell:0,regeneration:0,magnet:0,dash:0},cleared:['threshold'],discovered:[...new Set(['threshold',...(meta.explored??[])])],abilities:[...new Set([...(equipment.abilities??meta.abilities),...(body.ability?[body.ability]:[])])],earnedAbilities:[],karma:meta.karma,awareness:meta.awareness,essence:0,memoryEdge:meta.gifts.edge*.07,memoryHaste:meta.gifts.haste*.025,notice:'Move to the northern gate. Press E to enter the Glass Causeway.',noticeTime:8,damageFlash:0,settled:false,roomResolved:[],lastGate:null};
  run.training=training;run.masteryEarned={};run.partnerMasteryEarned={};run.roomPractice={host:{},partner:{}};run.stats={damageDealt:0,damageTaken:0,powers:0,dashes:0};run.keys=[...(meta.keys??[])];run.relics=[...(meta.relics??[])];run.secrets=[...(meta.secrets??[])];run.roomKills=0;run.roomExtra=0;run.seals=[...(equipment.seals??[])];run.openDoors=[];run.birthForm=form;run.visitedVessels=[form];run.player.morphCooldown=0;run.player.powerCooldown=0;run.gear=gear;run.loadout=equipment.loadout;run.equipmentLevels=equipment.inventory;run.loot=[];run.journal=[];run.seenEnemies=[];recordArrival(run);if(meta.runs===0){run.notice='Move with WASD or arrows. Your weapon attacks automatically. Go north and press E.';run.noticeTime=18;}return run;
}
export function createDailyRun(date=new Date()){const daily=dailySeed(date),run=createRun(createMeta(),'spark',daily.seed);run.daily=daily;run.notice='Daily current · '+daily.day+' UTC. Everyone begins as Spark with starter gear. This challenge records its result separately from campaign rewards.';run.noticeTime=18;return run;}
export function obstacles(room,run=null){
  const layout=layoutIndex(ROOMS[room],run);if(Number.isInteger(layout)&&!ROOMS[room].safe&&!ROOMS[room].boss&&!ROOMS[room].miniboss)return ROOM_LAYOUTS[layout].map(box=>({...box}));
  if(ROOMS[room].safe||ROOMS[room].boss||ROOMS[room].miniboss)return [];
  if(room==='reliquary')return [{x:245,y:155,w:42,h:58},{x:675,y:387,w:42,h:58}];
  if(worldOf(room)!=='stratum'){const rank=WORLDS[worldOf(room)].rank;return rank%2?[{x:300,y:180,w:48,h:68},{x:620,y:370,w:48,h:68}]:[{x:225,y:290,w:54,h:58},{x:680,y:215,w:54,h:58}];}
  const offset=ROOMS[room].danger%2?0:34;
  return [{x:245+offset,y:160,w:52,h:78},{x:660-offset,y:355,w:52,h:78}];
}
function circleRect(x,y,r,b){const px=clamp(x,b.x,b.x+b.w),py=clamp(y,b.y,b.y+b.h);return Math.hypot(x-px,y-py)<r;}
function move(run,entity,dx,dy,ignore=false){
  const boxes=ignore?[]:obstacles(run.room,run),steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/8));
  for(let step=0;step<steps;step++){
   let x=clamp(entity.x+dx/steps,34+entity.r,WIDTH-34-entity.r),y=clamp(entity.y+dy/steps,34+entity.r,HEIGHT-34-entity.r);
   for(const b of boxes){if(!circleRect(x,y,entity.r,b))continue;const px=clamp(x,b.x,b.x+b.w),py=clamp(y,b.y,b.y+b.h),vx=x-px,vy=y-py,d=Math.hypot(vx,vy);
    if(d>0){x=px+vx/d*(entity.r+.02);y=py+vy/d*(entity.r+.02);}else{const faces=[{d:x-b.x,x:b.x-entity.r-.02,y},{d:b.x+b.w-x,x:b.x+b.w+entity.r+.02,y},{d:y-b.y,x,y:b.y-entity.r-.02},{d:b.y+b.h-y,x,y:b.y+b.h+entity.r+.02}];const face=faces.sort((a,b)=>a.d-b.d)[0];x=face.x;y=face.y;}
   }entity.x=clamp(x,34+entity.r,WIDTH-34-entity.r);entity.y=clamp(y,34+entity.r,HEIGHT-34-entity.r);
  }
}
// A bounded drawing projection uses the same speed and solid cover as the host.
// It never advances combat, cooldowns, gates, or the saved run.
export function projectMovement(run,actor,form,input,seconds){
 const projected={...actor},dt=Math.max(0,Math.min(.12,Number(seconds)||0));
 if(!actor||actor.hp<=0||!BODIES[form]||!dt)return projected;
 const x=Number(input.x)||0,y=Number(input.y)||0,length=Math.hypot(x,y),scale=length>1?1/length:1;
 const dash=Math.min(dt,Math.max(0,actor.dashTime??0));
 if(dash)move(run,projected,actor.dashX*830*dash,actor.dashY*830*dash,run.abilities.includes('phase'));
 const speed=BODIES[form].speed*(1+(run.gear?.speed??0)+skillStats(run.training,form).speed);
 move(run,projected,x*scale*speed*(dt-dash),y*scale*speed*(dt-dash));
 return projected;
}
export function predictInputMovement(run,actor,form,frames){
 let p={...actor};if(!actor||actor.hp<=0)return p;
 for(const input of frames){
  const dt=1/60,x=input.x??0,y=input.y??0,length=Math.hypot(x,y),mx=length>1?x/length:x,my=length>1?y/length:y;
  p.dashCooldown=Math.max(0,(p.dashCooldown??0)-dt);
  if(input.dash&&p.dashCooldown===0){p.dashTime=.16;p.dashX=length?mx:p.facingX;p.dashY=length?my:p.facingY;p.dashCooldown=dashCooldown(run,form);}
  const dashing=p.dashTime>0;if(dashing)move(run,p,p.dashX*830*dt,p.dashY*830*dt,run.abilities.includes('phase'));else{const speed=BODIES[form].speed*(1+(run.gear?.speed??0)+skillStats(run.training,form).speed);move(run,p,mx*speed*dt,my*speed*dt);}p.dashTime=Math.max(0,(p.dashTime??0)-dt);
  if(!dashing&&length){p.facingX=mx;p.facingY=my;}
 }
 return p;
}
export function exitPosition(direction){return {north:{x:WIDTH/2,y:31},south:{x:WIDTH/2,y:HEIGHT-31},east:{x:WIDTH-31,y:HEIGHT/2},west:{x:31,y:HEIGHT/2}}[direction];}
export function gateStatus(run,direction){
  if(run.rematch)return {available:false,reason:'Finish this rematch, then return to your journey.'};
  if(run.dungeon)return {available:false,reason:'Clear this floor, then choose Descend at the checkpoint.'};
  const exit=ROOMS[run.room].exits[direction];if(!exit)return {available:false,reason:'No gate here.'};
  if(!run.cleared.includes(run.room))return {available:false,to:exit.to,reason:'Break the swarm to open the gates.'};
  if(exit.requires&&!run.abilities.includes(exit.requires))return {available:false,reason:'Requires '+ABILITIES[exit.requires].name+'.',requires:exit.requires,to:exit.to};
  const missing=(exit.keys??[]).filter(id=>!(run.keys??[]).includes(id));if(missing.length)return {available:false,to:exit.to,keys:exit.keys,missingKeys:missing,reason:'Needs '+missing.map(id=>KEYS[id].name+' — '+KEYS[id].place).join(' and ')+'.'};
  const missingRelics=(exit.relics??[]).filter(id=>!(run.relics??[]).includes(id));if(missingRelics.length)return {available:false,to:exit.to,relics:exit.relics,missingRelics,reason:'Needs '+missingRelics.map(id=>ROUTE_RELICS[id].name+' — '+ROUTE_RELICS[id].place+' in '+WORLDS[ROUTE_RELICS[id].world].name).join(' and ')+'.'};
  if(exit.ward&&!run.cleared.includes(exit.ward)&&!(run.seals??[]).includes(ROOMS[run.room].world))return {available:false,to:exit.to,ward:exit.ward,reason:'Wake '+ROOMS[exit.ward].name+' in this world to release the guardian ward.'};
  const missingSeals=(exit.seals??[]).filter(id=>!(run.seals??[]).includes(id));if(missingSeals.length)return {available:false,to:exit.to,seals:exit.seals,missingSeals,reason:'Needs guardian seals: '+missingSeals.map(id=>WORLDS[id].name).join(', ')+'.'};
  if(exit.vessel&&![run.player.hp>0?run.form:null,run.partner?.hp>0?run.partnerForm:null].includes(exit.vessel))return {available:false,to:exit.to,vessel:exit.vessel,reason:'Become '+FORMS[exit.vessel].name+' to open this door. Press Q for vessels.'};
  return {available:true,to:exit.to,requires:exit.requires,keys:exit.keys,seals:exit.seals,vessel:exit.vessel,relics:exit.relics,ward:exit.ward,opened:(run.openDoors??[]).includes(doorId(run.room,exit.to))};
}
export function nearestGate(run,actor=run.player){
  let gate=null;for(const direction of Object.keys(ROOMS[run.room].exits)){const position=exitPosition(direction),distance=dist(actor,position);if(!gate||distance<gate.distance)gate={direction,position,distance,...gateStatus(run,direction)};}return gate;
}
export function gateEntryStatus(run,direction,actor=run.player){
  if(run.phase!=='playing')return {available:false,reason:'Finish the current choice before traveling.'};
  const status=gateStatus(run,direction);if(!status.available)return status;
  if(actor!==run.player&&actor!==run.partner)return {...status,available:false,reason:'Use your own vessel at the gate.'};
  if(!actor||actor.hp<=0)return {...status,available:false,reason:'Rekindle your spark before crossing.'};
  const other=run.partner?(actor===run.player?run.partner:run.player):null,position=exitPosition(direction);
  if(other?.hp<=0)return {...status,available:false,reason:'Rekindle your partner before crossing.'};
  if((actor.gateGrace??0)>0)return {...status,available:false,reason:'Arrival grace · step into the chamber before crossing again.'};
  if(dist(actor,position)>120)return {...status,available:false,reason:'Move closer to the gate.'};
  if(other&&dist(other,position)>120)return {...status,available:false,reason:'Partner must be near this gate.'};
  return status;
}
export function enterGate(run,direction,actor=run.player){
  const status=gateEntryStatus(run,direction,actor);if(!status.available)throw new Error(status.reason);
  const opposite={north:'south',south:'north',east:'west',west:'east'}[direction];
  const from=run.room;if(status.keys?.length||status.relics?.length||status.ward){run.openDoors??=[];const door=doorId(from,status.to);if(!run.openDoors.includes(door))run.openDoors.push(door);}
  return arrive(run,status.to,opposite);
}
function rememberLoot(run,room){run.loot??=[];run.equipmentLevels??={};for(const id of [room.loot??[]].flat())if(!run.loot.includes(id)){run.loot.push(id);run.equipmentLevels??={};run.equipmentLevels[id]??=0;}}
function arrive(run,to,opposite='south'){
  const at=exitPosition(opposite);run.visitNumber=(run.visitNumber??0)+1;run.room=to;run.bossDefeated=null;run.roomTime=0;run.arrayClock=8;run.enemies=[];run.shots=[];run.effects=[];run.marks=[];run.fragments=[];run.spawnClock=.6;run.spawned=0;run.roomKills=0;run.roomExtra=0;run.spawnTotal=ROOMS[run.room].safe?0:ROOMS[run.room].boss||ROOMS[run.room].miniboss?1:encounterFor(run)?.total??14+ROOMS[run.room].danger*4;run.player.x=clamp(at.x,160,WIDTH-160);run.player.y=clamp(at.y,160,HEIGHT-160);run.player.iframes=1.4;run.player.attackClock=.25;run.lastGate=opposite;
  if(!run.discovered.includes(run.room))run.discovered.push(run.room);
  if(run.partner){run.partner.x=clamp(run.player.x+48,82,WIDTH-82);run.partner.y=run.player.y;run.partner.iframes=1.4;run.spawnTotal=Math.round(run.spawnTotal*1.3);}
  run.roomPractice={host:{},partner:{}};for(const actor of [run.player,run.partner].filter(Boolean)){actor.gateLatched=true;actor.gateGrace=.75;}
  if(ROOMS[run.room].safe){if(!run.cleared.includes(run.room))run.cleared.push(run.room);rememberLoot(run,ROOMS[run.room]);}
  recordArrival(run);
  if(run.partner&&!ROOMS[to].safe&&!run.cleared.includes(to)){run.passageRecoveries??=[];if(!run.passageRecoveries.includes(to)){run.passageRecoveries.push(to);const heals=[run.player,run.partner].map(a=>{const before=a.hp;if(a.hp>0)a.hp=Math.min(a.maxHp,a.hp+Math.ceil(a.maxHp*.12));return Math.ceil(a.hp-before);});run.notice+=' Passage recovery · P1 +'+heals[0]+' HP · P2 +'+heals[1]+' HP.';run.noticeTime=8;}}
  effect(run,'gate',run.player.x,run.player.y,ROOMS[run.room].theme,60);
  if((ROOMS[run.room].boss||ROOMS[run.room].miniboss)&&!run.cleared.includes(run.room))spawnBoss(run);
  return run.room;
}
export function checkpointAvailable(run){return !!run&&!run.rematch&&run.phase==='playing'&&run.player.hp>0&&(!run.partner||run.partner.hp>0)&&(ROOMS[run.room].safe||ROOMS[run.room].boss&&run.cleared.includes(run.room));}
// Dungeon rooms reuse combat and artwork, but never campaign gates or rewards.
export function beginDungeonChamber(run,room,pressure){
 if(!run.dungeon||!ROOMS[room]||ROOMS[room].safe)throw Error('Choose a dungeon combat chamber.');
 run.dungeon.pressure=pressure;run.cleared=[];run.roomResolved=[];run.journal=[];run.earnedAbilities=[];run.loot=[];run.bossDefeated=null;run.phase='playing';run.choices=[];arrive(run,room);run.spawnTotal=ROOMS[room].boss||ROOMS[room].miniboss?1:pressure.total;run.player.x=WIDTH/2;run.player.y=HEIGHT/2+100;run.player.gateLatched=true;return room;
}
export function beginBossRematch(run,room){
 if(!run.rematch||!ROOMS[room]?.boss&&!ROOMS[room]?.miniboss)throw Error('Choose a guardian to refight.');
 run.phase='playing';run.cleared=[];run.roomResolved=[];run.choices=[];run.fragments=[];run.time=0;run.kills=0;run.stats={damageDealt:0,damageTaken:0,powers:0,dashes:0};run.masteryEarned={};run.partnerMasteryEarned={};run.journal=[];run.loot=[];run.essence=0;arrive(run,room);run.player.x=480;run.player.y=440;run.player.hp=run.player.maxHp;run.player.powerCooldown=0;run.player.morphCooldown=0;return run;
}
export function prepareDungeonGifts(run){if(!run.dungeon||run.phase!=='resolve'||run.xp<run.nextXp)throw Error('No dungeon gift is waiting.');run.xp-=run.nextXp;run.level++;run.nextXp=6+run.level*4;offerBoons(run);}
export function travelWorld(run,world){if(!run)throw Error('Inhabit a vessel first.');if(!Object.hasOwn(WORLDS,world)||!worldUnlocked(world,run.seals??[]))throw Error('Collect the preceding guardian seals first.');if(!checkpointAvailable(run))throw Error('World travel is available at a safe checkpoint or a defeated guardian.');if(run.partner&&dist(run.player,run.partner)>170)throw Error('Bring your partner close before crossing worlds.');return arrive(run,WORLDS[world].entry);}
export function equipRunItem(run,meta,id){if(run.daily)meta=createMeta();if(!checkpointAvailable(run))throw Error('Equip found gear at a safe checkpoint.');if(!Object.hasOwn(EQUIPMENT,id)||!(id in (meta.inventory??{}))&&!(run.loot??[]).includes(id))throw Error('This item has not been found.');const inventory={...meta.inventory,...run.equipmentLevels};for(const item of run.loot??[])inventory[item]??=0;const equipment=prepareEquipment({inventory,loadout:{...run.loadout,[EQUIPMENT[id].slot]:id}}),gear=gearStats(equipment),difference=gear.health-(run.gear?.health??0);for(const actor of [run.player,run.partner].filter(Boolean)){const ratio=actor.hp/actor.maxHp;actor.maxHp+=difference;actor.hp=actor.maxHp*ratio;}run.gear=gear;run.loadout=equipment.loadout;run.equipmentLevels=equipment.inventory;run.notice=EQUIPMENT[id].name+' equipped. Injuries carry across the change.';run.noticeTime=4;return id;}
export const ENCOUNTERS={glass:{total:14,interval:.95,cap:6,damage:.7,pool:['collector','collector','collector','archon','hound']},machine:{total:14,interval:1.2,cap:5,rangedCap:1,damage:.65,pool:['collector','collector','collector','archon','hound']},roots:{total:20,interval:.85,cap:9,damage:.85,pool:['collector','archon','spore','collector']},quiet:{total:18,interval:1.1,cap:6,damage:.75,pool:['collector','collector','archon','hound']},conduit:{total:20,interval:.95,cap:8,damage:.85,pool:['collector','collector','archon','leech','moth']},cistern:{total:22,interval:.9,cap:9,damage:.9,pool:['collector','collector','archon','leech','moth']},reliquary:{total:16,interval:1,cap:6,damage:.8,pool:['collector','archon','collector','hound']},nursery:{total:18,interval:1,cap:7,damage:.8,pool:['collector','archon','mirror','collector']},archive:{total:22,interval:.9,cap:9,damage:.9,pool:['collector','spore','archon','hound']},observatory:{total:22,interval:.9,cap:9,damage:.9,pool:['collector','leech','moth','archon']},belfry:{total:22,interval:1,cap:9,damage:.9,pool:['collector','archon','mirror','hound']},...WORLD_ENCOUNTERS};
export const ENEMY_KINDS=['collector','archon','warden','hound','mirror','spore','oracle','leech','moth','cantor','sentinel',...Object.keys(COMBAT_ROLES),...Object.keys(WORLD_GUARDIANS)];
const encounterFor=run=>run.rematch?{damage:run.rematch.damage}:run.dungeon?{...ENCOUNTERS[run.room],...run.dungeon.pressure,damage:run.dungeon.pressure.damage*((ROOMS[run.room].boss||ROOMS[run.room].miniboss)?1.4:1)}:run.swarmPact&&ENCOUNTERS[run.room]?{...ENCOUNTERS[run.room],total:Math.ceil(ENCOUNTERS[run.room].total*1.25),cap:ENCOUNTERS[run.room].cap+2,interval:ENCOUNTERS[run.room].interval*.88}:ENCOUNTERS[run.room];
export function floorRecovery(run){const base=Math.max(32+Math.min(28,(run.dungeon.floor-1)*2),run.player.maxHp*.2);return Math.ceil(base*(run.dungeon.condition==='wither'?.6:1));}
export function swarmProgress(run){const clear=run.cleared.includes(run.room),total=run.spawnTotal+(run.roomExtra??0),defeated=run.roomKills??Math.max(0,run.spawned-run.enemies.filter(e=>e.hp>0).length);return {defeated:clear?total:Math.min(defeated,total),total,remaining:clear?0:Math.max(run.enemies.filter(e=>e.hp>0).length,total-defeated),fraction:clear?1:Math.min(.99,defeated/Math.max(1,total)),cleared:clear};}
export function rewardBanner(run,type,title,text,color='#e9cb87') {run.banner={type,title,text,color,remaining:6};effect(run,type,run.player.x,run.player.y,color,80);}
function spawnEnemy(run,forced=null,count=true){
  let x,y;const actors=[run.player,run.partner].filter(p=>p&&p.hp>0);for(let attempt=0;attempt<12;attempt++){const edge=Math.floor(rand(run)*4);x=edge===0?65:edge===1?WIDTH-65:80+rand(run)*(WIDTH-160);y=edge===2?65:edge===3?HEIGHT-65:80+rand(run)*(HEIGHT-160);if(actors.every(p=>Math.hypot(p.x-x,p.y-y)>180))break;}
  const difficulty=ROOMS[run.room].danger,roll=rand(run),pool=encounterFor(run)?.pool;let kind=forced??(pool?pool[Math.floor(roll*pool.length)]:roll<.12&&difficulty>=3?'oracle':roll<.25&&difficulty>=2?'spore':roll<.37&&difficulty>=2?'mirror':roll<.53?'hound':roll<.7?'archon':'collector');if(kind==='archon'&&run.enemies.filter(e=>e.hp>0&&e.kind==='archon').length>=(encounterFor(run)?.rangedCap??3))kind='collector';
  const enemy={id:randomId(run),kind,x,y,r:kind==='archon'?17:14,hp:(kind==='archon'?42:24)+difficulty*6,maxHp:(kind==='archon'?42:24)+difficulty*6,speed:kind==='archon'?53:74+difficulty*6,attack:1.2+rand(run)*1.1,orbitHit:0,flash:0};
  const stats={hound:{hp:31,speed:84,r:14},mirror:{hp:55,speed:58,r:18},spore:{hp:38,speed:45,r:17},oracle:{hp:75,speed:38,r:20},leech:{hp:49,speed:59,r:17},moth:{hp:29,speed:102,r:14}}[COMBAT_ROLES[kind]??kind];if(stats)Object.assign(enemy,{hp:stats.hp+difficulty*5,maxHp:stats.hp+difficulty*5,speed:stats.speed,r:stats.r,windup:0,charge:0,chargeX:0,chargeY:0,shield:0});if(run.partner){enemy.hp*=1.3;enemy.maxHp=enemy.hp;}run.seenEnemies??=[];if(!run.seenEnemies.includes(kind))run.seenEnemies.push(kind);
  if(actors.some(p=>dist(enemy,p)<160)){const corners=[{x:65,y:65},{x:WIDTH-65,y:65},{x:65,y:HEIGHT-65},{x:WIDTH-65,y:HEIGHT-65}];const safe=corners.sort((a,b)=>Math.min(...actors.map(p=>dist(p,b)))-Math.min(...actors.map(p=>dist(p,a))))[0];enemy.x=safe.x;enemy.y=safe.y;}
  const pressure=encounterFor(run);enemy.hp*=pressure?.health??1;enemy.maxHp=enemy.hp;enemy.speed*=pressure?.speed??1;run.enemies.push(enemy);if(count)run.spawned++;else run.roomExtra=(run.roomExtra??0)+1;
}
function spawnBoss(run){const mini=!!ROOMS[run.room].miniboss,sentinel=ROOMS[run.room].guardian==='sentinel',guardian=WORLD_GUARDIANS[ROOMS[run.room].guardian],baseHp=guardian?guardian.hp*(run.partner?1.5:1):sentinel?(run.partner?2000:1400):mini?(run.partner?1600:1100):(run.partner?2700:1800),hp=run.rematch?run.rematch.health:run.dungeon?3600*run.dungeon.pressure.health*(1+Math.max(0,run.dungeon.floor-5)/30):baseHp,kind=guardian?ROOMS[run.room].guardian:sentinel?'sentinel':mini?'cantor':'warden';run.enemies.push({id:randomId(run),kind,x:WIDTH/2,y:HEIGHT/2-90,r:guardian?kind==='demiurge'?47:37:mini?32:37,hp,maxHp:hp,speed:guardian?.speed??(sentinel?42:mini?48:65),attack:2,markClock:3.5,orbitHit:0,flash:0});run.spawned=1;run.seenEnemies??=[];if(!run.seenEnemies.includes(kind))run.seenEnemies.push(kind);}

function effect(run,type,x,y,color,r=20,value=null){const life=['key','unlock','boss'].includes(type)?1.2:type==='damage'?.9:type==='wave'?.4:.3;if(run.effects.length<140)run.effects.push({id:randomId(run),type,x,y,color,r,life,maxLife:life,...(value===null?{}:{value})});}
function actorStats(run,partner=false){run.stats??={damageDealt:0,damageTaken:0,powers:0,dashes:0};if(partner)return run.stats.partner??={damageDealt:0,damageTaken:0,powers:0,dashes:0};return run.stats;}
function damageEnemy(run,enemy,amount,form=run.form,partner=run.player===run.partner){
  if(enemy.hp<=0)return;if((COMBAT_ROLES[enemy.kind]??enemy.kind)==='mirror'&&enemy.shield>0)amount*=.35;actorStats(run,partner).damageDealt+=Math.min(enemy.hp,amount);enemy.hp-=amount;enemy.flash=.08;effect(run,'hit',enemy.x,enemy.y,BODIES[form].color,13);
  if(enemy.hp<=0){run.marks=run.marks.filter(mark=>mark.sourceId!==enemy.id);run.kills++;run.roomKills=(run.roomKills??0)+1;const value=enemy.kind==='warden'||WORLD_GUARDIANS[enemy.kind]?30:['cantor','sentinel'].includes(enemy.kind)?18:enemy.kind==='archon'?3:2;run.fragments.push({id:randomId(run),x:enemy.x,y:enemy.y,value,r:5});effect(run,'burst',enemy.x,enemy.y,enemy.kind==='warden'?'#f7cb79':'#8bc7c2',32);}
}
function hurt(run,amount,target=run.player){if(target.hp<=0||target.iframes>0)return;const form=target===run.partner?run.partnerForm:run.form,skills=skillStats(run.training,form),armor=form==='rock'?.7:1;const before=target.hp;target.hp=Math.max(0,target.hp-amount*armor*Math.max(.1,1-(run.gear?.armor??0)-skills.armor)*(target.guardTime>0?.5:1)*(encounterFor(run)?.damage??1));actorStats(run,target===run.partner).damageTaken+=before-target.hp;target.iframes=.7;target.hurtFlash=.32;run.damageFlash=.32;effect(run,'damage',target.x,target.y-42,'#ffad8f',0,Math.ceil(before-target.hp));if(target.hp<=0){if(!run.partner||[run.player,run.partner].every(p=>p.hp<=0)){run.phase='dead';if(run.partner)run.endReason='both-fallen';run.notice='The bodies end. The sparks return.';}else{target.downedFor=RESCUE_SECONDS;run.fallSerial=(run.fallSerial??0)+1;target.fallId=run.fallSerial;target.fellAt=run.time;target.revive=0;target.dashTime=0;const survivor=target===run.player?run.partner:run.player;survivor.iframes=Math.max(survivor.iframes,1.5);run.notice='A spark is down · 30 seconds. Stand close and hold E to rekindle your partner.';run.noticeTime=6;}}}
function fire(run,x,y,angle,damage,enemy=false,speed=430,range=700,homing=false,source=null){if(run.shots.length>=(run.dungeon||run.swarmPact?360:240))return;const form=source?.form??run.form,partner=source?.partner??(run.player===run.partner);run.shots.push({id:randomId(run),x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,damage,enemy,r:enemy?6:5,life:range/speed,homing,...(homing?{homingSpeed:speed}:{}),color:enemy?(['cantor','warden','sentinel'].includes(run.shotRole)||WORLD_GUARDIANS[run.shotRole]?'#f3ba63':'#71e5e4'):BODIES[form].color,...(!enemy?{sourceForm:form,sourcePartner:partner}:{sourceKind:run.shotRole??'archon'})});}
export function attackProfile(run,form=run.form){const body=BODIES[form],item=EQUIPMENT[run.loadout?.weapon];return item?.attack?{...item.attack,name:item.name}:{damage:body.damage,interval:body.interval,range:body.range,name:body.weapon,style:form==='spark'?'homing':form==='computer'?'volley':['human','animal'].includes(form)?'cleave':'wave'};}
export function powerProfile(run,form=run?.form??'spark'){const base=VESSEL_POWERS[form],skills=skillStats(run?.training,form),heal=({human:18,tree:12}[form]??0)+skills.powerHeal;let desc={spark:'Pulse light through nearby foes and clear nearby enemy bolts.'+(skills.pulseHeal?' Clearing bolts restores up to '+skills.pulseHeal+' HP.':''),human:'Restore up to '+heal+' HP, strike nearby foes, and guard for '+(3+skills.guardExtra)+' seconds.',computer:'Double attack speed for '+(4+skills.overclockExtra)+' seconds and launch a seeking volley.'+(skills.firewall?' Clear nearby enemy bolts and guard for two seconds.':''),animal:'Leap along your facing direction and strike where you land.'+(heal?' Restore up to '+heal+' HP.':''),tree:'Root nearby foes for '+(2.5+skills.rootExtra)+' seconds and restore up to '+heal+' HP. Guardians resist rooting.',rock:'Guard for '+(4+skills.guardExtra)+' seconds and send a heavy shockwave around you.'+(skills.clearBolts?' Clear nearby enemy bolts.':'')}[form];if(skills.partnerHeal)desc+=' Restore up to '+skills.partnerHeal+' HP to a nearby living partner.';return {...base,desc,cooldown:base.cooldown*(1-skills.powerCooldown)};}
function attack(run){
  const p=run.player,body=BODIES[run.form],skills=skillStats(run.training,run.form),profile=attackProfile(run),range=profile.range*(1+(run.gear?.range??0)+skills.range),enemies=run.enemies.filter(e=>e.hp>0),target=enemies.sort((a,b)=>dist(p,a)-dist(p,b))[0];if(!target||dist(p,target)>range)return;
  const melee=['cleave','wave'].includes(profile.style),damage=profile.damage*(1+run.boons.edge*.24+run.memoryEdge+(run.gear?.damage??0)+skills.damage+(p.hp/p.maxHp>.7?skills.healthyDamage:0)+(melee?run.gear?.melee??0:0)),angle=Math.atan2(target.y-p.y,target.x-p.x);p.facingX=Math.cos(angle);p.facingY=Math.sin(angle);
  if(profile.style==='homing')fire(run,p.x,p.y,angle,damage,false,390,range,true);
  else if(profile.style==='volley')for(const a of [-.17,0,.17])fire(run,p.x,p.y,angle+a,damage,false,500,range,!!skills.homingVolley);
  else {const radius=range;for(const enemy of enemies){const distance=dist(p,enemy);if(distance<radius+enemy.r){if(profile.style==='cleave'){const a=Math.atan2(enemy.y-p.y,enemy.x-p.x);if(Math.cos(a-angle)>.05)damageEnemy(run,enemy,damage);}else damageEnemy(run,enemy,damage);}}effect(run,profile.style==='cleave'?'slash':'wave',p.x,p.y,body.color,radius);}
}
export function useVesselPower(run,partner=false){
 const actor=partner?run.partner:run.player,form=partner?run.partnerForm:run.form,power=VESSEL_POWERS[form],skills=skillStats(run.training,form);if(run.phase!=='playing'||!actor||actor.hp<=0)throw Error('This vessel cannot use its power right now.');if((actor.powerCooldown??0)>0)throw Error('The vessel power is recovering.');actor.powerCooldown=power.cooldown*(1-skills.powerCooldown);actorStats(run,partner).powers++;
 if(form==='animal'){const length=150+skills.pounceLength;move(run,actor,actor.facingX*length,actor.facingY*length);actor.iframes=Math.max(actor.iframes,.35+skills.pounceIframes);}
 if(form==='human')actor.guardTime=3+skills.guardExtra;
 if(form==='rock')actor.guardTime=4+skills.guardExtra;
 const heal=({human:18,tree:12}[form]??0)+skills.powerHeal;actor.hp=Math.min(actor.maxHp,actor.hp+heal);const other=partner?run.player:run.partner;if(other?.hp>0&&dist(actor,other)<300)other.hp=Math.min(other.maxHp,other.hp+skills.partnerHeal);
 if(form==='computer'){actor.overclockTime=4+skills.overclockExtra;if(skills.firewall)actor.guardTime=2;const angle=Math.atan2(actor.facingY,actor.facingX);for(const spread of [-.35,-.17,0,.17,.35])fire(run,actor.x,actor.y,angle+spread,25*(1+run.boons.edge*.24),false,390,680,true,{form,partner});}
 const radius=(form==='animal'?120:form==='human'?155:235)*(1+skills.powerRadius);
 if(form!=='computer'){const damage=({spark:65,human:70,animal:75,tree:50,rock:95}[form])*(1+run.boons.edge*.24+run.memoryEdge+skills.powerDamage);for(const enemy of run.enemies)if(enemy.hp>0&&dist(enemy,actor)<radius+enemy.r){damageEnemy(run,enemy,damage,form,partner);if(form==='tree')enemy.rootTime=WORLD_GUARDIANS[enemy.kind]||['warden','cantor','sentinel'].includes(enemy.kind)?.5+skills.rootExtra*.3:2.5+skills.rootExtra;}}
 if(form==='spark'||skills.firewall||skills.clearBolts){const before=run.shots.length;run.shots=run.shots.filter(shot=>!shot.enemy||dist(shot,actor)>radius);if(run.shots.length<before)actor.hp=Math.min(actor.maxHp,actor.hp+skills.pulseHeal);}
 effect(run,'power',actor.x,actor.y,BODIES[form].color,form==='computer'?75:radius);
 run.notice=power.name+'. '+powerProfile(run,form).desc;run.noticeTime=3;return power.name;
}
function stepGuardian(run,enemy,target,dt){
 const spec=WORLD_GUARDIANS[enemy.kind],d=dist(enemy,target),dx=(target.x-enemy.x)/(d||1),dy=(target.y-enemy.y)/(d||1),stage=enemy.kind==='demiurge'?1+(enemy.hp<enemy.maxHp*.66?1:0)+(enemy.hp<enemy.maxHp*.33?1:0):enemy.hp<enemy.maxHp*.5?2:1;
 move(run,enemy,dx*enemy.speed*(d>240?1:d<165?-.4:0)*dt,dy*enemy.speed*(d>240?1:d<165?-.4:0)*dt,true);
 if(enemy.stage!==stage){enemy.stage=stage;effect(run,'wave',enemy.x,enemy.y,spec.color,95);if(stage>1&&['thornmother','demiurge'].includes(enemy.kind)&&run.enemies.length<12){spawnEnemy(run,enemy.kind==='thornmother'?'thornling':'satellite',false);spawnEnemy(run,'collector',false);}}
 enemy.attack-=dt;enemy.markClock-=dt;
 if(enemy.attack<=0&&!(enemy.windup>0)){enemy.windup=.8;enemy.aimAngle=Math.atan2(target.y-enemy.y,target.x-enemy.x);enemy.volleyAngle=run.time*.25;}
 if(enemy.windup>0){enemy.windup-=dt;if(enemy.windup<=0){const angle=enemy.aimAngle,spin=enemy.volleyAngle;
  if(spec.pattern==='tide')for(const spread of [-.6,-.3,0,.3,.6])fire(run,enemy.x,enemy.y,angle+spread,12,true,175,1000);
  else if(spec.pattern==='roots')for(let i=0;i<6;i++)fire(run,enemy.x,enemy.y,spin+i*Math.PI/3,12,true,145,950);
  else if(spec.pattern==='clock')for(let i=0;i<12;i++){if(i%6===0)continue;fire(run,enemy.x,enemy.y,spin+i*Math.PI/6,14,true,170,1000);}
  else if(spec.pattern==='weave')for(const spread of [-.55,-.2,.2,.55]){fire(run,enemy.x,enemy.y,angle+spread,13,true,210,1100);fire(run,enemy.x,enemy.y,angle+spread+Math.PI,11,true,155,1000);}
  else if(spec.pattern==='orbit')for(let i=0;i<8;i++)fire(run,enemy.x,enemy.y,spin+i*Math.PI/4,14,true,155+i%2*55,1100);
  else{for(let i=0;i<16;i++){if(i%8===0)continue;fire(run,enemy.x,enemy.y,spin+i*Math.PI/8,14+stage*2,true,145+stage*20,1100);}if(stage>=2)for(const spread of [-.28,0,.28])fire(run,enemy.x,enemy.y,angle+spread,18,true,235,1100);}
  enemy.volleys=(enemy.volleys??0)+1;enemy.attack=spec.pattern==='origin'?2.8-stage*.3:stage===2?2:2.6;
 }}
 if(enemy.markClock<=0&&run.marks.length<35){const offsets=spec.pattern==='roots'?[-130,0,130]:spec.pattern==='clock'?[-180,0,180]:spec.pattern==='origin'&&stage===3?[-210,-105,0,105,210]:[0];for(const offset of offsets)run.marks.push({x:clamp(target.x+offset,70,WIDTH-70),y:target.y,r:spec.pattern==='roots'?50:62,timer:1.35,life:1.35,color:spec.color,damage:spec.pattern==='origin'?24:18,sourceId:enemy.id});enemy.markClock=stage>1?3:4;}
 if(d<enemy.r+target.r)hurt(run,20,target);
}
function stepFirstGuardian(run,enemy,target,dt){
 const kind=enemy.kind,d=dist(enemy,target),dx=(target.x-enemy.x)/(d||1),dy=(target.y-enemy.y)/(d||1),stage=enemy.hp<enemy.maxHp*.5?2:1,sign=d<(kind==='warden'?180:165)?-.4:d>260?1:0;
 move(run,enemy,dx*enemy.speed*sign*dt,dy*enemy.speed*sign*dt,true);
 if(enemy.stage!==stage&&stage===2){const name=kind==='cantor'?'The Cantor':kind==='sentinel'?'The Crown Sentinel':'The Warden';rewardBanner(run,'phase',name+' · '+(kind==='cantor'?'second movement':'second phase'),kind==='cantor'?'Eight notes. Watch the aimed pair and leave the ground seals.':'The pattern changes. Watch the golden wind-up and leave the marked ground.','#ebc68e');effect(run,'wave',enemy.x,enemy.y,'#ebc68e',95);if(kind==='warden'){enemy.enraged=true;spawnEnemy(run,'hound',false);spawnEnemy(run,'hound',false);}}
 enemy.stage=stage;enemy.attack-=dt;
 if(enemy.windup>0){enemy.windup-=dt;if(enemy.windup<=0){
  if(kind==='cantor'){const count=stage===1?6:8;for(let i=0;i<count;i++)fire(run,enemy.x,enemy.y,enemy.volleyAngle+i*Math.PI*2/count,11,true,stage===1?160:180,900);if(stage===2)for(const spread of [-.18,.18])fire(run,enemy.x,enemy.y,enemy.aimAngle+spread,11,true,180,900);enemy.attack=stage===1?2.5:2.8;}
  else if(kind==='sentinel'){const count=stage===1?8:12;for(let i=0;i<count;i++){if(stage===2&&i%6===0)continue;fire(run,enemy.x,enemy.y,enemy.volleyAngle+i*Math.PI*2/count,stage===1?12:14,true,stage===1?170:185,900);}enemy.attack=stage===1?2.4:2;}
  else{for(const spread of stage===2?[-.36,-.18,0,.18,.36]:[-.2,0,.2])fire(run,enemy.x,enemy.y,enemy.aimAngle+spread,stage===2?16:14,true,stage===2?260:220,1000);enemy.attack=stage===2?.9:1.4;}
  enemy.volleys=(enemy.volleys??0)+1;
 }}else if(enemy.attack<=0){enemy.windup=kind==='cantor'?.9:.8;enemy.volleyAngle=run.time*(kind==='sentinel'?.45:.3);enemy.aimAngle=Math.atan2(target.y-enemy.y,target.x-enemy.x);effect(run,'wave',enemy.x,enemy.y,'#ebc68e',70);}
 enemy.markClock-=dt;if(enemy.markClock<=0){run.marks.push({x:target.x,y:target.y,r:kind==='cantor'?62:70,timer:kind==='cantor'?1.2:1.1,life:kind==='cantor'?1.2:1.1,sourceId:enemy.id});enemy.markClock=stage===2?2.6:3.6;}
 if(d<target.r+enemy.r)hurt(run,kind==='warden'?22:9,target);
}
function offerBoons(run){const list=Object.keys(BOONS).filter(id=>id!=='orbit'||run.boons.orbit<4);run.choices=[];while(run.choices.length<3&&list.length){const i=Math.floor(rand(run)*list.length);run.choices.push(list.splice(i,1)[0]);}run.phase='boon';effect(run,'level',run.player.x,run.player.y,'#c2dfbc',90);}
export function chooseBoon(run,id){
  if(run.phase!=='boon'||!run.choices.includes(id))throw new Error('This gift is not offered.');run.boons[id]++;
  if(id==='shell')for(const p of [run.player,run.partner].filter(p=>p&&p.hp>0)){const before=p.hp;p.maxHp+=25;p.hp=Math.min(p.maxHp,p.hp+35);if(run.dungeon&&p===run.player)run.dungeon.vesselRecovered=(run.dungeon.vesselRecovered??0)+Math.ceil(p.hp-before);}
  run.phase='playing';run.choices=[];run.notice=BOONS[id].name+' remembers you.';run.noticeTime=3;
  if(run.xp>=run.nextXp){run.xp-=run.nextXp;run.level++;run.nextXp=6+run.level*4;offerBoons(run);}
  else if(run.dungeon&&run.cleared.includes(run.room))run.phase='resolve';
  else if(run.room==='eye'&&run.cleared.includes('eye')&&!run.eyeAcknowledged)run.phase='milestone';
}
function awardMastery(run){for(const role of ['host','partner']){const actor=role==='host'?run.player:run.partner;if(!actor)continue;const practiced=Object.entries(run.roomPractice?.[role]??{}).sort((a,b)=>b[1]-a[1]);if(!practiced.length||practiced[0][1]<.5)continue;const earned=role==='host'?'masteryEarned':'partnerMasteryEarned';run[earned]??={};const form=practiced[0][0];run[earned][form]=(run[earned][form]??0)+(ROOMS[run.room].boss?30:10);}}
function clearRoom(run){
  if(run.cleared.includes(run.room))return;
  const room=ROOMS[run.room];run.lastClear={room:run.room,visit:run.visitNumber??0,floor:run.dungeon?.floor??0};run.clearNotice=(run.dungeon?'Floor '+run.dungeon.floor:room.name)+' cleared.';if(room.boss||room.miniboss){const name=WORLD_GUARDIANS[room.guardian]?.name??(room.guardian==='sentinel'?'The Crown Sentinel':room.miniboss?'The Cantor':'The Warden');run.bossDefeated={name,room:run.room};rewardBanner(run,'boss',name+' defeated',run.rematch?'The echo falls. Your journey is waiting.':run.dungeon?'The next rung opens.':room.loot?EQUIPMENT[room.loot]?.name+' recovered.':room.seal?'A guardian seal answers.':(room.treasure??0)+(room.miniboss?7:40)+' essence recovered.');}
  if(run.rematch){run.cleared=[run.room];run.rematch.cleared=true;run.enemies=[];run.shots=[];run.marks=[];run.fragments=[];run.phase='won';return;}
  if(run.dungeon){run.cleared=[run.room];run.dungeon.floorsCleared++;run.xp+=run.fragments.reduce((sum,f)=>sum+f.value,0);run.fragments=[];run.shots=[];run.marks=[];run.enemies=[];const before=run.player.hp;run.player.hp=Math.min(run.player.maxHp,run.player.hp+floorRecovery(run));run.dungeon.recovered=Math.ceil(run.player.hp-before);run.phase='resolve';run.notice='Floor '+run.dungeon.floor+' cleared. Rest, remember a gift, then descend.';run.noticeTime=8;return;}
  awardMastery(run);effect(run,'gate',run.player.x,run.player.y,'#dfc288',65);
  run.cleared.push(run.room);if(room.wardFor)rewardBanner(run,'unlock','Guardian ward released',ROOMS[room.wardFor].name+' now answers your local key.',room.theme);run.loot??=[];rememberLoot(run,ROOMS[run.room]);for(const actor of [run.player,run.partner].filter(p=>p&&p.hp>0))actor.hp=Math.min(actor.maxHp,actor.hp+(ROOMS[run.room].boss?30:12));if(ROOMS[run.room].miniboss)run.essence+=7;run.essence+=ROOMS[run.room].treasure??0;const reward=ROOMS[run.room].reward;
  if(reward){if(!run.abilities.includes(reward)){run.abilities.push(reward);rewardBanner(run,'unlock',ABILITIES[reward].name+' remembered',ABILITIES[reward].desc);}if(!run.earnedAbilities.includes(reward))run.earnedAbilities.push(reward);}
  if(ROOMS[run.room].seal){run.seals??=[];if(!run.seals.includes(ROOMS[run.room].seal))run.seals.push(ROOMS[run.room].seal);run.essence+=12;}
  if(ROOMS[run.room].finalBoss){run.phase='won';run.victory='demiurge';run.essence+=40;run.karma=clamp(run.karma+10,-100,100);run.awareness=clamp(run.awareness+10,0,100);return;}
  if(ROOMS[run.room].boss)run.enemies=[];
  run.phase='resolve';run.shots=[];run.marks=[];
}
export function resolveChamber(run,choice){
  if(run.dungeon||run.rematch||run.phase!=='resolve'||![0,1,2].includes(choice))throw new Error('This chamber is not awaiting that choice.');
  if(choice===0){run.karma=clamp(run.karma+7,-100,100);run.essence+=3;run.player.hp=Math.min(run.player.maxHp,run.player.hp+10);run.notice='You free the trapped light. The world keeps a little more possibility.';}
  if(choice===1){run.karma=clamp(run.karma-9,-100,100);run.essence+=8;run.player.hp=Math.min(run.player.maxHp,run.player.hp+25);run.notice='You harvest the machinery. Your next life will feel the weight of this choice.';}
  if(choice===2){run.karma=clamp(run.karma+2,-100,100);run.awareness=clamp(run.awareness+7,0,100);run.essence+=5;run.notice='You listen before leaving. A pattern survives as understanding.';}
  recordDecision(run,choice);if(ROOMS[run.room].key&&!(run.keys??[]).includes(ROOMS[run.room].key))run.notice+=' The '+KEYS[ROOMS[run.room].key].name+' waits on the glowing pedestal.';if(run.partner){const heal=choice===0?10:choice===1?25:0;run.partner.hp=Math.min(run.partner.maxHp,run.partner.hp+(run.partner.hp>0?heal:0));}
  // Uncollected fragments are kept when a room is resolved, not lost at its exit.
  const xp=run.fragments.reduce((sum,f)=>sum+f.value,0);run.xp+=xp;run.fragments=[];
  run.roomResolved.push(run.room);run.phase='playing';run.noticeTime=5;
  if(run.xp>=run.nextXp){run.xp-=run.nextXp;run.level++;run.nextXp=6+run.level*4;offerBoons(run);}
  else if(run.room==='eye'&&!run.eyeAcknowledged)run.phase='milestone';
}
export function resolveMilestone(run,decision){if(run.phase!=='milestone'||run.room!=='eye'||!['continue','finish'].includes(decision))throw Error('The Eye is not awaiting that decision.');run.eyeAcknowledged=true;run.phase=decision==='continue'?'playing':'won';if(decision==='finish')run.victory='eye';return run.phase;}
export function dashCooldown(run,form=run.form){return Math.max(.48,1.65*(.78**run.boons.dash)*Math.max(.2,1-(run.gear?.dash??0)-skillStats(run.training,form).dash));}
const validActor=p=>p&&['x','y','hp','maxHp','r','facingX','facingY','iframes','dashTime','dashX','dashY','dashCooldown','attackClock'].every(k=>Number.isFinite(p[k]))&&p.hp>=0&&p.hp<=p.maxHp&&p.maxHp>0&&p.x>=0&&p.x<=WIDTH&&p.y>=0&&p.y<=HEIGHT;
export function addPartner(run,form,replace=false){if(!BODIES[form])throw Error('Unknown partner form.');if(run.partner&&!replace)return;run.partnerBirthForm=form;const previous=run.partner,bonus=run.player.maxHp-BODIES[run.form].hp-skillStats(run.training,run.form).health,maxHp=BODIES[form].hp+bonus+skillStats(run.training,form).health;run.partnerForm=form;run.partner={...structuredClone(run.player),x:previous?.x??clamp(run.player.x+48,49,WIDTH-49),y:previous?.y??run.player.y,hp:previous?maxHp*previous.hp/previous.maxHp:maxHp,maxHp,revive:0};actorStats(run,true);const ability=BODIES[form].ability;if(ability&&!run.abilities.includes(ability))run.abilities.push(ability);}
export function morphRun(run,form,partner=false){
 if(!Object.hasOwn(BODIES,form))throw Error('Unknown vessel.');if(run.phase!=='playing'||!run.abilities.includes('morph'))throw Error('Find Vessel Resonance in the Mirror Nursery first.');
 const actor=partner?run.partner:run.player,prior=partner?run.partnerForm:run.form;if(!actor||actor.hp<=0)throw Error('Rekindle this spark before changing vessels.');if(prior===form)return form;if((actor.morphCooldown??0)>0)throw Error('Vessel resonance is recovering.');
 const bonus=actor.maxHp-BODIES[prior].hp-skillStats(run.training,prior).health,fraction=actor.hp/actor.maxHp;actor.maxHp=BODIES[form].hp+bonus+skillStats(run.training,form).health;actor.hp=actor.maxHp*fraction;actor.morphCooldown=3;actor.dashTime=0;actor.attackClock=Math.max(actor.attackClock,BODIES[form].interval*.25);if(partner)run.partnerForm=form;else run.form=form;
 run.visitedVessels??=[prior];if(!run.visitedVessels.includes(form))run.visitedVessels.push(form);if(BODIES[form].ability&&!run.abilities.includes(BODIES[form].ability))run.abilities.push(BODIES[form].ability);effect(run,'wave',actor.x,actor.y,BODIES[form].color,60);run.notice='The spark inhabits '+FORMS[form].name+'. Health carries across the change.';run.noticeTime=3;return form;
}
export function pendingKey(run){if(run.dungeon||run.rematch)return null;const key=ROOMS[run.room].key;return key&&run.cleared.includes(run.room)&&!(run.keys??[]).includes(key)?{key,...keyPosition}:null;}
function collectKey(run){const item=pendingKey(run);if(!item||![run.player,run.partner].some(p=>p&&p.hp>0&&dist(p,item)<40))return;run.keys??=[];run.keys.push(item.key);run.notice=KEYS[item.key].name+' found. It stays on your keyring and opens its marked doors.';run.noticeTime=7;rewardBanner(run,'key',KEYS[item.key].name+' acquired',KEYS[item.key].place+' · marked doors now open.',KEYS[item.key].color);run.journal??=[];run.journal.push({id:run.room+':key',room:run.room,speaker:'Your keyring',title:KEYS[item.key].name+' acquired',text:'You collected the key from the pedestal. It is carried on your keyring.'});}
export function pendingRelic(run){if(run.dungeon||run.rematch)return null;const relic=ROOMS[run.room].relic;return relic&&run.cleared.includes(run.room)&&!(run.relics??[]).includes(relic)?{relic,x:run.room==='reliquary'?620:480,y:run.room==='reliquary'?300:215}:null;}
export function relicContact(item){return item?.relic==='ivory-feather'?68:40;}
function collectRelic(run){const item=pendingRelic(run);if(!item||![run.player,run.partner].some(p=>p&&p.hp>0&&dist(p,item)<=relicContact(item)))return;const relic=ROUTE_RELICS[item.relic];run.relics??=[];run.relics.push(item.relic);run.notice=relic.name+' found. Opens '+relic.opens+'. Travel back from a checkpoint.';run.noticeTime=10;rewardBanner(run,'key',relic.name+' acquired','Opens '+relic.opens+'.',relic.color);run.journal??=[];run.journal.push({id:run.room+':relic',room:run.room,speaker:'A road between worlds',title:relic.name,text:run.notice});}
export function pendingSecret(run){if(run.dungeon||run.rematch)return null;const secret=ROOMS[run.room].secret;return secret&&run.cleared.includes(run.room)&&!(run.secrets??[]).includes(secret)?{secret,...EASTER_EGGS[secret],x:730,y:300}:null;}
function discoverSecret(run,actor,form){const item=pendingSecret(run);if(!item||dist(actor,item)>65)return false;if(form!==item.vessel){run.notice=item.hint+' Press Q to borrow that vessel.';run.noticeTime=5;return true;}run.secrets??=[];run.secrets.push(item.secret);run.essence+=item.essence;run.notice=item.text+' +'+item.essence+' essence.';run.noticeTime=14;rewardBanner(run,'unlock',item.name,'A hidden memory · +'+item.essence+' essence. Remembered in your journal.','#e8c780');run.journal??=[];run.journal.push({id:run.room+':secret',room:run.room,speaker:'An impossible little discovery',title:item.name,text:item.text});return true;}
function stepActor(run,p,form,input,dt){
 const x=Number(input.x??0),y=Number(input.y??0);if(!Number.isFinite(x)||!Number.isFinite(y))throw Error('Movement must be finite.');p.gateGrace=Math.max(0,(p.gateGrace??0)-dt);if(p.hp<=0)return;
 const length=Math.hypot(x,y),mx=length>1?x/length:x,my=length>1?y/length:y,body=BODIES[form],skills=skillStats(run.training,form);p.iframes=Math.max(0,p.iframes-dt);p.morphCooldown=Math.max(0,(p.morphCooldown??0)-dt);p.hurtFlash=Math.max(0,(p.hurtFlash??0)-dt);p.powerCooldown=Math.max(0,(p.powerCooldown??0)-dt);p.guardTime=Math.max(0,(p.guardTime??0)-dt);p.overclockTime=Math.max(0,(p.overclockTime??0)-dt);p.dashCooldown=Math.max(0,p.dashCooldown-dt);
 if(input.dash&&p.dashCooldown===0){p.dashTime=.16;p.iframes=Math.max(p.iframes,.27);p.dashX=length?mx:p.facingX;p.dashY=length?my:p.facingY;p.dashCooldown=dashCooldown(run,form);actorStats(run,p===run.partner).dashes++;effect(run,'wave',p.x,p.y,body.color,27);if(skills.dashStrike)for(const enemy of run.enemies)if(dist(p,enemy)<135+enemy.r)damageEnemy(run,enemy,skills.dashStrike,form,p===run.partner);}
 if(p.dashTime>0){move(run,p,p.dashX*830*dt,p.dashY*830*dt,run.abilities.includes('phase'));p.dashTime=Math.max(0,p.dashTime-dt);}else{move(run,p,mx*body.speed*(1+(run.gear?.speed??0)+skills.speed)*dt,my*body.speed*(1+(run.gear?.speed??0)+skills.speed)*dt);if(length){p.facingX=mx;p.facingY=my;}}
 if(!input.interact)p.gateLatched=false;
 const other=run.partner?(p===run.player?run.partner:run.player):null;
 if(other&&other.hp<=0){if(input.interact&&dist(p,other)<=REVIVE_RADIUS){other.revive=(other.revive??0)+dt;if(other.revive>=REVIVE_SECONDS){other.hp=other.maxHp*.4;other.iframes=2;other.revive=0;other.downedFor=0;effect(run,'wave',other.x,other.y,'#dfe5a7',65);run.notice='The spark answers. Your partner is rekindled.';run.noticeTime=4;}}else other.revive=0;}
 else if(input.interact&&!p.gateLatched){if(discoverSecret(run,p,form)){p.gateLatched=true;}else{const gate=nearestGate(run,p);if(gate){const status=gateEntryStatus(run,gate.direction,p);if(status.available)enterGate(run,gate.direction,p);else{run.notice=status.reason;run.noticeTime=2.5;}}}}
 p.surgeCooldown=Math.max(0,(p.surgeCooldown??0)-dt);p.attackClock=Math.max(-.05,p.attackClock-dt);const mode=['auto','manual','surge'].includes(input.fireMode)?input.fireMode:run.fireMode??'auto';
 if(p.attackClock<=0&&(mode!=='manual'||input.fire)){const previousPlayer=run.player,previousForm=run.form;run.player=p;run.form=form;attack(run);const interval=attackProfile(run,form).interval;run.player=previousPlayer;run.form=previousForm;p.attackClock=interval/Math.min(3,1+run.boons.cadence*.18+run.memoryHaste+(run.gear?.haste??0)+skills.haste)/(p.overclockTime>0?2:1);}
 if(mode==='surge'&&input.fire&&p.surgeCooldown===0){const target=run.enemies.filter(e=>e.hp>0).sort((a,b)=>dist(p,a)-dist(p,b))[0];if(target){const profile=attackProfile(run,form),angle=Math.atan2(target.y-p.y,target.x-p.x),damage=profile.damage*.7*(1+run.boons.edge*.24+run.memoryEdge+(run.gear?.damage??0)+skills.damage);for(const spread of [-.2,0,.2])fire(run,p.x,p.y,angle+spread,damage,false,460,Math.max(450,profile.range),profile.style==='homing',{form,partner:p===run.partner});p.surgeCooldown=4;effect(run,'wave',p.x,p.y,body.color,35);}}

}
export function stepRun(run,input={},dt=1/60){
  if(run.phase!=='playing')return;
  run.roomKills??=Math.max(0,run.spawned-run.enemies.filter(e=>e.hp>0).length);run.roomExtra??=0;
  if(!Number.isFinite(dt)||dt<=0||dt>.05)throw new Error('Simulation steps must be between zero and 0.05 seconds.');
  const x=Number(input.x??0),y=Number(input.y??0);if(!Number.isFinite(x)||!Number.isFinite(y))throw new Error('Movement must be finite.');
  if(input.partner&&(!Number.isFinite(input.partner.x??0)||!Number.isFinite(input.partner.y??0)))throw Error('Movement must be finite.');
  if((input.morph!=null&&!Object.hasOwn(BODIES,input.morph))||(input.partner?.morph!=null&&!Object.hasOwn(BODIES,input.partner.morph)))throw Error('Unknown vessel.');
  for(const [action,isPartner]of [[input,false],[input.partner,true]])if(action?.morph&&run.abilities.includes('morph')){const actor=isPartner?run.partner:run.player;if(actor?.hp>0&&(actor.morphCooldown??0)<=0)morphRun(run,action.morph,isPartner);}
  for(const [action,isPartner]of [[input,false],[input.partner,true]]){const actor=isPartner?run.partner:run.player;if(action?.power&&actor?.hp>0&&(actor.powerCooldown??0)<=0)useVesselPower(run,isPartner);}
  const p=run.player;
  if(!ROOMS[run.room].safe&&!run.cleared.includes(run.room)){run.roomPractice??={host:{},partner:{}};for(const [role,actor,form]of [['host',p,run.form],['partner',run.partner,run.partnerForm]])if(actor?.hp>0){run.roomPractice[role]??={};run.roomPractice[role][form]=(run.roomPractice[role][form]??0)+dt;}}
  run.time+=dt;run.roomTime+=dt;if(run.partner){if(run.player.hp<=0&&run.partner.hp<=0){run.phase='dead';run.endReason='both-fallen';run.notice='Both sparks have fallen. The body falls. The spark remembers.';return;}for(const actor of [run.player,run.partner])if(actor.hp<=0){actor.downedFor=Math.max(0,(actor.downedFor??30)-dt);if(actor.downedFor===0){run.phase='dead';run.endReason='rescue-expired';run.notice='The rekindling window closed. The body falls. The spark remembers.';return;}}}if(run.banner)run.banner.remaining=Math.max(0,run.banner.remaining-dt);run.noticeTime=Math.max(0,run.noticeTime-dt);run.damageFlash=Math.max(0,run.damageFlash-dt);
  stepActor(run,p,run.form,input,dt);if(run.partner)stepActor(run,run.partner,run.partnerForm,input.partner??{},dt);
  if(!ROOMS[run.room].safe&&!ROOMS[run.room].boss&&!ROOMS[run.room].miniboss&&!run.cleared.includes(run.room)&&run.spawned<run.spawnTotal&&run.enemies.length<(encounterFor(run)?.cap??30)){run.spawnClock-=dt;if(run.spawnClock<=0){spawnEnemy(run);run.spawnClock=(encounterFor(run)?.interval??.6)+rand(run)*.3;}}
  collectKey(run);collectRelic(run);
  if(!run.cleared.includes(run.room)&&(run.room==='quiet'||ROOMS[run.room].hazard==='echo'||run.dungeon?.condition==='fault')){run.arrayClock=(run.arrayClock??8)-dt;if(run.arrayClock<=0&&run.marks.length<30){for(const offset of [-125,0,125])run.marks.push({x:clamp(p.x+offset,75,WIDTH-75),y:p.y,r:38,timer:1.5,life:1.5,color:'#aaa9e4',damage:9});run.arrayClock=8;run.notice=run.room==='quiet'?'The array is listening. Step outside the violet echo circles.':run.dungeon?'Fault weather · leave the marked ground.':'Echo weather · leave the warning circles.';run.noticeTime=3;}}
  const living=[run.player,run.partner].filter(a=>a&&a.hp>0);
  const orbitCount=run.boons.orbit;
  for(const enemy of run.enemies){
    if(enemy.hp<=0)continue;enemy.flash=Math.max(0,enemy.flash-dt);enemy.orbitHit=Math.max(0,enemy.orbitHit-dt);const target=living.reduce((a,b)=>!a||dist(enemy,b)<dist(enemy,a)?b:a,null)??p,d=dist(enemy,target),dx=(target.x-enemy.x)/(d||1),dy=(target.y-enemy.y)/(d||1);
    run.shotRole=enemy.kind;const kind=COMBAT_ROLES[enemy.kind]??enemy.kind;enemy.rootTime=Math.max(0,(enemy.rootTime??0)-dt);
    if(enemy.rootTime>0){}
    else if(WORLD_GUARDIANS[enemy.kind])stepGuardian(run,enemy,target,dt);
    else if(['cantor','sentinel','warden'].includes(kind))stepFirstGuardian(run,enemy,target,dt);
    else if(kind==='collector'){move(run,enemy,dx*enemy.speed*dt,dy*enemy.speed*dt);if(d<target.r+enemy.r+3)hurt(run,10,target);}
    else if(kind==='hound'){
      enemy.attack-=dt;if(enemy.windup>0){enemy.windup-=dt;if(enemy.windup<=0)enemy.charge=.34;}
      else if(enemy.charge>0){move(run,enemy,enemy.chargeX*480*dt,enemy.chargeY*480*dt,true);enemy.charge=Math.max(0,enemy.charge-dt);}
      else if(enemy.attack<=0){enemy.windup=.65;enemy.chargeX=dx;enemy.chargeY=dy;enemy.attack=2.8;}
      else move(run,enemy,dx*enemy.speed*dt,dy*enemy.speed*dt);
      if(d<target.r+enemy.r+5)hurt(run,enemy.charge>0?16:9,target);
    }else if(kind==='leech'){
      enemy.attack-=dt;if(enemy.windup>0){enemy.windup-=dt;if(enemy.windup<=0){const tx=target.x-enemy.x,ty=target.y-enemy.y,forward=tx*enemy.chargeX+ty*enemy.chargeY,lateral=Math.abs(tx*enemy.chargeY-ty*enemy.chargeX);if(forward>0&&forward<230&&lateral<28)hurt(run,12,target);effect(run,'wave',enemy.x,enemy.y,'#91d7d3',45);enemy.attack=3;}}
      else if(enemy.attack<=0&&d<230){enemy.windup=.85;enemy.chargeX=dx;enemy.chargeY=dy;}else{const sign=d>180?1:-.3;move(run,enemy,dx*enemy.speed*sign*dt,dy*enemy.speed*sign*dt,true);}
    }else if(kind==='moth'){
      if(enemy.windup>0){enemy.windup-=dt;if(enemy.windup<=0){enemy.hp=0;run.kills++;run.roomKills=(run.roomKills??0)+1;run.fragments.push({id:randomId(run),x:enemy.x,y:enemy.y,value:2,r:5});effect(run,'burst',enemy.x,enemy.y,'#ecb877',40);}}
      else if(d<85){enemy.windup=1.15;run.marks.push({x:enemy.x,y:enemy.y,r:72,timer:1.15,life:1.15,color:'#edb66c',damage:17,sourceId:enemy.id});}else move(run,enemy,dx*enemy.speed*dt,dy*enemy.speed*dt);
    }else if(kind==='archon'){
      const sign=d<145?-.25:d>245?1:0;move(run,enemy,dx*enemy.speed*sign*dt,dy*enemy.speed*sign*dt,true);enemy.attack-=dt;
      if(enemy.windup>0){enemy.windup-=dt;if(enemy.windup<=0){for(const spread of run.dungeon||run.swarmPact?[-.2,0,.2]:[0])fire(run,enemy.x,enemy.y,Math.atan2(enemy.chargeY,enemy.chargeX)+spread,run.room==='machine'?8:10,true,run.room==='machine'?155:185,800);enemy.attack=run.room==='machine'?3.2:2.6;}}else if(enemy.attack<=0){enemy.windup=.75;enemy.chargeX=dx;enemy.chargeY=dy;}if(d<target.r+enemy.r)hurt(run,6,target);
    }else if(kind==='spore'||kind==='oracle'){
      const sign=d<185?-.4:d>320?1:0;move(run,enemy,dx*enemy.speed*sign*dt,dy*enemy.speed*sign*dt,true);enemy.attack-=dt;
      if(enemy.attack<=0){if(kind==='spore'){run.marks.push({x:target.x,y:target.y,r:52,timer:1.15,life:1.15,color:'#b9c989',damage:15});enemy.attack=3.1;}else{if(run.enemies.length<32){spawnEnemy(run,'collector',false);spawnEnemy(run,'collector',false);}effect(run,'wave',enemy.x,enemy.y,'#e2d1ac',55);enemy.attack=5.3;}}
      if(d<target.r+enemy.r)hurt(run,8,target);
    }else{const sign=d<165?-.4:d>260?1:0;move(run,enemy,dx*enemy.speed*sign*dt,dy*enemy.speed*sign*dt,true);enemy.attack-=dt;
      if(enemy.attack<=0){const angle=Math.atan2(target.y-enemy.y,target.x-enemy.x);for(const spread of kind==='mirror'?[-.12,.12]:[0])fire(run,enemy.x,enemy.y,angle+spread,10,true,190,750);enemy.attack=2.3;}
      if(kind==='mirror')enemy.shield=run.time%3.8<1.4?1:0;
      if(d<target.r+enemy.r)hurt(run,9,target);
    }
    if(orbitCount&&enemy.orbitHit===0){for(const actor of living)for(let i=0;i<orbitCount;i++){const angle=run.time*2.9+i*Math.PI*2/orbitCount,orb={x:actor.x+Math.cos(angle)*68,y:actor.y+Math.sin(angle)*68};if(dist(enemy,orb)<enemy.r+16){damageEnemy(run,enemy,13*(1+run.boons.edge*.15),actor===run.partner?run.partnerForm:run.form,actor===run.partner);enemy.orbitHit=.3;break;}}}
  }
  delete run.shotRole;
  for(const shot of run.shots){shot.life-=dt;if(shot.life<=0)continue;
    if(shot.homing){let closest=null;for(const enemy of run.enemies)if(enemy.hp>0&&(!closest||dist(shot,enemy)<dist(shot,closest)))closest=enemy;if(closest){const angle=Math.atan2(closest.y-shot.y,closest.x-shot.x),speed=shot.homingSpeed??390;shot.vx=shot.vx*.88+Math.cos(angle)*speed*.12;shot.vy=shot.vy*.88+Math.sin(angle)*speed*.12;}}
    shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;
    if(shot.enemy){for(const actor of living)if(shot.life>0&&dist(shot,actor)<shot.r+actor.r){hurt(run,shot.damage,actor);shot.life=0;}}
    else for(const enemy of run.enemies)if(enemy.hp>0&&dist(shot,enemy)<shot.r+enemy.r){damageEnemy(run,enemy,shot.damage,shot.sourceForm??run.form,shot.sourcePartner??false);shot.life=0;break;}
  }
  for(const mark of run.marks){mark.timer-=dt;if(mark.timer<=0&&mark.timer+dt>0){for(const actor of living)if(dist(actor,mark)<mark.r)hurt(run,mark.damage??23,actor);effect(run,'wave',mark.x,mark.y,mark.color??'#dd8f85',mark.r);}}
  for(const fragment of run.fragments){const collector=living.reduce((a,b)=>!a||dist(fragment,b)<dist(fragment,a)?b:a,null)??p,d=dist(fragment,collector),magnet=(run.dungeon||run.swarmPact?155:95)+run.boons.magnet*75+(run.cardModifier==='feather'?45:0);if(d<magnet&&d>1){fragment.x+=(collector.x-fragment.x)/d*350*(run.cardModifier==='unbound-conduit'?1.15:1)*dt;fragment.y+=(collector.y-fragment.y)/d*350*(run.cardModifier==='unbound-conduit'?1.15:1)*dt;}if(d<23){run.xp+=fragment.value;fragment.value=0;}}
  for(const fx of run.effects)fx.life-=dt;
  run.enemies=run.enemies.filter(e=>e.hp>0);run.shots=run.shots.filter(s=>s.life>0&&s.x>-30&&s.x<WIDTH+30&&s.y>-30&&s.y<HEIGHT+30);run.fragments=run.fragments.filter(f=>f.value>0);run.effects=run.effects.filter(f=>f.life>0);run.marks=run.marks.filter(m=>m.timer>0);
  if(run.phase==='playing')for(const actor of living.filter(a=>a.hp>0)){const form=actor===run.partner?run.partnerForm:run.form;actor.hp=Math.min(actor.maxHp,actor.hp+dt*(run.boons.regeneration+(run.gear?.regen??0)+skillStats(run.training,form).regen+(form==='tree'?.4:0)));}
  if(run.phase!=='playing'||run.partner&&[run.player,run.partner].some(a=>a.hp<=0))return;
  if(ROOMS[run.room].miniboss&&run.spawned>=1&&!run.enemies.some(e=>['cantor','sentinel'].includes(e.kind))){clearRoom(run);return;}
  if(ROOMS[run.room].boss&&run.spawned>=1&&!run.enemies.some(e=>e.kind===(ROOMS[run.room].guardian??'warden'))){clearRoom(run);return;}
  if(run.xp>=run.nextXp&&(ROOMS[run.room].safe||run.cleared.includes(run.room))&&!run.dungeon&&!run.rematch&&!ROOMS[run.room].boss&&!ROOMS[run.room].miniboss){run.xp-=run.nextXp;run.level++;run.nextXp=6+run.level*4;offerBoons(run);return;}
  if(!ROOMS[run.room].safe&&!run.cleared.includes(run.room)&&run.spawned>=run.spawnTotal&&run.enemies.length===0)clearRoom(run);
}
export function settleRun(run,meta,guest=false){
  if(run.dungeon||run.rematch)throw Error('Dungeon and rematch records are separate from campaign progress.');
  if(!['dead','won'].includes(run.phase)||run.settled)throw new Error('This run cannot be recorded twice or before it ends.');
  const record=runRecord(run,ROOMS,EQUIPMENT,guest);let next=prepareEquipment(meta);
  if(run.daily){next=rememberRecord(next,record);run.settled=true;return next;}
  next=bankMastery(next,guest?run.partnerMasteryEarned:run.masteryEarned);next=rememberRecord(next,record);for(const id of run.loot??[])if(EQUIPMENT[id]&&!(id in next.inventory))next.inventory[id]=0;next.explored=[...new Set([...(next.explored??[]),...run.discovered])];next.keys=[...new Set([...(next.keys??[]),...(run.keys??[])])];next.seals=[...new Set([...(next.seals??[]),...(run.seals??[])])];next.relics=[...new Set([...(next.relics??[]),...(run.relics??[])])];next.secrets=[...new Set([...(next.secrets??[]),...(run.secrets??[])])];if(run.loadout)next.loadout=prepareEquipment({...next,loadout:run.loadout}).loadout;next.runs++;next.wins+=run.phase==='won'?1:0;next.karma=run.karma;next.awareness=run.awareness;next.essence+=earnedEssence(run,meta);next.bestRooms=Math.max(next.bestRooms,record.chambers);next.abilities=[...new Set([...next.abilities,...run.earnedAbilities])];for(const form of run.visitedVessels??[run.form])if(!next.visited.includes(form))next.visited.push(form);next.echoes.unshift({form:record.form,rooms:record.chambers,kills:run.kills,won:run.phase==='won',karma:run.karma,seconds:Math.round(run.time)});next.echoes=next.echoes.slice(0,20);next.journal=[...(run.journal??[]),...(next.journal??[])].filter((v,i,a)=>a.findIndex(x=>x.id===v.id)===i).slice(0,400);next.seenEnemies=[...new Set([...(next.seenEnemies??[]),...(run.seenEnemies??[])])];run.settled=true;return next;
}
export function earnedEssence(run,meta){return run.daily?0:Math.max(run.essence+Math.floor(run.kills/8),meta.runs===0&&run.kills>0?4:0);}
export const MEMORY_GIFTS={heart:{name:'A stronger vessel',desc:'+12 health in every new life',baseCost:4},edge:{name:'A remembered edge',desc:'+7% damage in every new life',baseCost:6},haste:{name:'A quicker thought',desc:'+2.5% attack speed in every new life',baseCost:4}};
export function memoryCost(meta,id){if(!MEMORY_GIFTS[id])return Infinity;return MEMORY_GIFTS[id].baseCost+meta.gifts[id]*3;}
export function buyMemory(meta,id){if(!MEMORY_GIFTS[id]||meta.gifts[id]>=8||meta.essence<memoryCost(meta,id))throw new Error('This memory is not available.');const next=structuredClone(meta);next.essence-=memoryCost(meta,id);next.gifts[id]++;return next;}
export function observeRun(run,meta){return {fireMode:run?.fireMode??'auto',swarmPact:!!run?.swarmPact,surgeCooldown:run?.player.surgeCooldown??0,swarm:run?swarmProgress(run):null,relics:run?.relics??meta.relics??[],secrets:run?.secrets??meta.secrets??[],relicPickup:run?pendingRelic(run):null,secret:run?pendingSecret(run):null,training:run?.training??prepareTraining(meta.training),masteryEarned:run?.masteryEarned??{},partnerMasteryEarned:run?.partnerMasteryEarned??{},stats:run?.stats??null,daily:run?.daily??null,ending:run&&['milestone','won'].includes(run.phase)?endingFor(run):null,lastRun:meta.lastRun??null,bestRun:meta.bestRun??null,time:run?.time??0,pauseReason:run&&run.phase!=='playing'?({boon:'Choose a waiting gift.',resolve:'Resolve this cleared chamber.',milestone:'Choose your next journey.'}[run.phase]??run.phase):null,banner:run?.banner??null,bossDefeated:run?.bossDefeated??null,phase:run?.phase??'between',form:run?.form??null,room:run?.room??null,player:run?{x:run.player.x,y:run.player.y,hp:run.player.hp,maxHp:run.player.maxHp,dashReady:run.player.dashCooldown===0}:null,enemies:run?run.enemies.map(e=>({id:e.id,kind:e.kind,x:e.x,y:e.y,hp:e.hp})):[],fragments:run?run.fragments.map(f=>({x:f.x,y:f.y,value:f.value})):[],level:run?.level??0,boons:run?.boons??{},choices:run?.choices??[],karma:run?.karma??meta.karma,abilities:run?.abilities??meta.abilities,cleared:run?.cleared??[],exits:run?Object.keys(ROOMS[run.room].exits).map(dir=>({direction:dir,...exitPosition(dir),...gateStatus(run,dir)})):[],offeredForms:offeredForms(meta),essence:meta.essence+(run&&!run.settled?run.essence:0),bankedEssence:meta.essence,keys:run?.keys??meta.keys??[],keyPickup:run?pendingKey(run):null,morphAvailable:!!run?.abilities.includes('morph'),morphCooldown:run?.player.morphCooldown??0,partnerForm:run?.partnerForm??null,world:worldOf(run?.room??'threshold'),worlds:WORLD_ORDER.map(id=>({id,name:WORLDS[id].name,unlocked:worldUnlocked(id,run?.seals??meta.seals??[])})),seals:run?.seals??meta.seals??[],power:run?{...powerProfile(run),cooldownRemaining:run.player.powerCooldown??0}:null,checkpoint:checkpointAvailable(run),weapon:run?attackProfile(run):null,openedDoors:run?.openDoors??[],equipment:run?.loadout??prepareEquipment(meta).loadout,loot:run?.loot??[]};}
export function validMeta(meta){return !!meta&&(meta.relics===undefined||validRelics(meta.relics))&&(meta.secrets===undefined||validSecrets(meta.secrets))&&(meta.training===undefined||validTraining(meta.training))&&validEquipment(meta)&&(meta.seals===undefined||validSeals(meta.seals))&&(meta.keys===undefined||validKeys(meta.keys))&&(meta.explored===undefined||(Array.isArray(meta.explored)&&meta.explored.length<=Object.keys(ROOMS).length&&meta.explored.every(room=>ROOMS[room])))&&meta.version===2&&['karma','awareness','essence','runs','wins','bestRooms'].every(k=>Number.isFinite(meta[k]))&&meta.karma>=-100&&meta.karma<=100&&meta.awareness>=0&&meta.awareness<=100&&meta.essence>=0&&meta.runs>=0&&Array.isArray(meta.abilities)&&meta.abilities.every(a=>ABILITIES[a])&&meta.gifts&&Object.keys(MEMORY_GIFTS).every(k=>Number.isInteger(meta.gifts[k])&&meta.gifts[k]>=0&&meta.gifts[k]<=8)&&Array.isArray(meta.echoes)&&Array.isArray(meta.visited)&&meta.visited.every(f=>BODIES[f]);}
export function validRun(run){
  if(!run||run.dungeon!==undefined||run.rematch!==undefined||run.version!==2||!BODIES[run.form]||!ROOMS[run.room]||!['playing','boon','resolve','milestone','dead','won'].includes(run.phase))return false;
  if(run.phase==='milestone'&&(run.room!=='eye'||!run.cleared?.includes('eye')))return false;
  if(run.fireMode!==undefined&&!['auto','manual','surge'].includes(run.fireMode)||run.swarmPact!==undefined&&typeof run.swarmPact!=='boolean'||run.cardModifier!=null&&!['feather','unbound-conduit'].includes(run.cardModifier))return false;
  if(run.training!==undefined&&!validTraining(run.training))return false;
  if([run.masteryEarned,run.partnerMasteryEarned].some(value=>value!==undefined&&!validEarned(value)))return false;
  if(run.daily!==undefined&&!validDaily(run.daily))return false;
  if(run.victory!==undefined&&!['eye','demiurge'].includes(run.victory))return false;
  if(run.stats!==undefined&&(!run.stats||[run.stats,run.stats.partner].filter(Boolean).some(stats=>!['damageDealt','damageTaken','powers','dashes'].every(key=>Number.isFinite(stats[key])&&stats[key]>=0&&stats[key]<=1e9))))return false;
  if(run.roomPractice!==undefined&&(!run.roomPractice||['host','partner'].some(role=>!run.roomPractice[role]||Object.entries(run.roomPractice[role]).some(([form,time])=>!BODIES[form]||!Number.isFinite(time)||time<0||time>100000))))return false;
  if(!['time','roomTime','rng','serial','spawnClock','spawned','spawnTotal','level','xp','nextXp','kills','karma','awareness','essence','memoryEdge','memoryHaste'].every(k=>Number.isFinite(run[k])))return false;
  if(run.time<0||run.level<1||run.nextXp<=0||run.karma< -100||run.karma>100||run.awareness<0||run.awareness>100)return false;
  if(!run.player||!['x','y','hp','maxHp','r','facingX','facingY','iframes','dashTime','dashX','dashY','dashCooldown','attackClock'].every(k=>Number.isFinite(run.player[k])))return false;
  if(run.player.hp<0||run.player.hp>run.player.maxHp||run.player.maxHp<=0||run.player.x<0||run.player.x>WIDTH||run.player.y<0||run.player.y>HEIGHT)return false;
  if(!['enemies','shots','fragments','effects','marks','cleared','discovered','abilities','earnedAbilities','roomResolved','choices'].every(k=>Array.isArray(run[k])))return false;
  if(run.enemies.length>128||run.shots.length>360||run.fragments.length>1000||run.effects.length>160||run.marks.length>50)return false;
  if(!run.enemies.every(e=>ENEMY_KINDS.includes(e.kind)&&['x','y','hp','maxHp','r','speed','attack','orbitHit','flash'].every(k=>Number.isFinite(e[k]))))return false;
  if(!run.shots.every(s=>['x','y','vx','vy','damage','r','life'].every(k=>Number.isFinite(s[k])))||!run.fragments.every(f=>['x','y','value','r'].every(k=>Number.isFinite(f[k]))))return false;
  if(run.shots.some(shot=>shot.sourceForm!==undefined&&!Object.hasOwn(BODIES,shot.sourceForm)||shot.sourcePartner!==undefined&&typeof shot.sourcePartner!=='boolean'||shot.homingSpeed!==undefined&&(!Number.isFinite(shot.homingSpeed)||shot.homingSpeed<100||shot.homingSpeed>1000)))return false;
  if(run.gear&&(!Object.entries(run.gear).every(([key,n])=>['health','damage','range','speed','melee','haste','dash','armor','regen'].includes(key)&&Number.isFinite(n)&&n>=0&&n<=(key==='health'?100:['armor','dash'].includes(key)?.9:2))||!validEquipment({inventory:Object.fromEntries(Object.values(run.loadout??{}).filter(Boolean).map(id=>[id,0])),loadout:run.loadout})))return false;
  if(run.loot&&(!Array.isArray(run.loot)||!run.loot.every(id=>EQUIPMENT[id])))return false;
  if(run.seals!==undefined&&!validSeals(run.seals))return false;
  if(run.equipmentLevels!==undefined&&!validEquipment({inventory:run.equipmentLevels,loadout:run.loadout}))return false;
  if([run.player,run.partner].filter(Boolean).some(actor=>['powerCooldown','guardTime','overclockTime','surgeCooldown'].some(key=>actor[key]!==undefined&&(!Number.isFinite(actor[key])||actor[key]<0||actor[key]>(key==='powerCooldown'?12:key==='surgeCooldown'?4:6)))))return false;
  if(run.enemies.some(enemy=>enemy.rootTime!==undefined&&(!Number.isFinite(enemy.rootTime)||enemy.rootTime<0||enemy.rootTime>3.5)))return false;
  if(run.relics!==undefined&&!validRelics(run.relics)||run.secrets!==undefined&&!validSecrets(run.secrets))return false;
  if(['roomKills','roomExtra'].some(k=>run[k]!==undefined&&(!Number.isSafeInteger(run[k])||run[k]<0||run[k]>100000)))return false;
  if(run.keys!==undefined&&!validKeys(run.keys))return false;if(run.openDoors!==undefined&&(!Array.isArray(run.openDoors)||run.openDoors.length>Object.keys(ROOMS).length*4||!run.openDoors.every(id=>typeof id==='string'&&id.split(':').length===2&&id.split(':').every(room=>ROOMS[room]))))return false;
  if(run.visitedVessels!==undefined&&(!Array.isArray(run.visitedVessels)||run.visitedVessels.length>6||!run.visitedVessels.every(form=>BODIES[form])))return false;if([run.player,run.partner].filter(Boolean).some(actor=>actor.morphCooldown!==undefined&&(!Number.isFinite(actor.morphCooldown)||actor.morphCooldown<0||actor.morphCooldown>3)))return false;
  if(run.fallSerial!==undefined&&(!Number.isSafeInteger(run.fallSerial)||run.fallSerial<0||run.fallSerial>1000000))return false;
  if([run.player,run.partner].filter(Boolean).some(a=>['downedFor','gateGrace'].some(k=>a[k]!==undefined&&(!Number.isFinite(a[k])||a[k]<0||a[k]>(k==='downedFor'?30:.75)))))return false;
  if(run.passageRecoveries!==undefined&&(!Array.isArray(run.passageRecoveries)||run.passageRecoveries.length>126||!run.passageRecoveries.every(id=>ROOMS[id])))return false;
  if(run.partner&&(!BODIES[run.partnerForm]||!validActor(run.partner)))return false;
  return run.abilities.every(a=>ABILITIES[a])&&run.earnedAbilities.every(a=>ABILITIES[a])&&run.cleared.every(r=>ROOMS[r])&&run.discovered.every(r=>ROOMS[r])&&run.choices.every(b=>BOONS[b])&&run.boons&&Object.keys(BOONS).every(k=>Number.isFinite(run.boons[k])&&run.boons[k]>=0);
}
