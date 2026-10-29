import {DUEL_SPATIAL_RULES,duelSpatialInput,duelBody,duelBoltAim,duelSpatialCollision,duelSpatialBoltInBounds} from './duel-spatial.js';
// A separate 60 Hz simulation. Nothing here reads or writes descent progression.
export const DUEL_CONTACT=200;
export const DUEL_FORMS=['spark','human','computer','animal','tree','rock'];
export const DUEL_FIGHTERS=[...DUEL_FORMS,'collector','archon','cantor'];
export const DUEL_STAGES={glass:{name:'Threshold Glass',color:'#82c8c4',look:'glass'},tideglass:{name:'Tideglass',color:'#79cddc',look:'tide'},root:{name:'Root',color:'#99c7a2',look:'root'},basalt:{name:'Basalt',color:'#d4a476',look:'basalt'},night:{name:'Night',color:'#bda4ee',look:'night'},orbit:{name:'Orbit',color:'#c9dbe7',look:'orbit'}};
export const DUEL_ROSTER={spark:{epithet:'Light that seeks',special:'Lumen pulse',desc:'A close pulse breaks the pattern.'},human:{epithet:'A stubborn heart',special:'Rally guard',desc:'A brief guard and a spectral strike.'},computer:{epithet:'Read the grid',special:'Overclock',desc:'Prism fire and four seconds of faster recovery.'},animal:{epithet:'A wolf’s speed',special:'Pounce',desc:'Leap forward and strike where you land.'},tree:{epithet:'The oldest root listens',special:'Root hold',desc:'Hold a grounded foe in living roots.'},rock:{epithet:'The fault remembers',special:'Fault wave',desc:'A low shockwave and a short basalt guard.'},collector:{epithet:'The assigned hunger',special:'Collection lunge',desc:'Lunge along the stage; grab a close grounded foe.'},archon:{epithet:'A bell beneath the armor',special:'Aimed prism',desc:'Mark a line, then send a cyan bolt along it.'},cantor:{epithet:'The unfinished guardian',special:'Wind-up ring',desc:'The familiar ring warns before its pulse.'}};
export const DUEL_MOVES={light:{startup:6,active:3,recovery:12,damage:8,range:240},heavy:{startup:14,active:5,recovery:19,damage:16,range:261},launcher:{startup:12,active:4,recovery:22,damage:12,range:248},special:{startup:12,active:6,recovery:24,damage:16,range:272},super:{startup:32,active:6,recovery:34,damage:32,range:317}};
// Punch and kick are verbs: a wolf uses paws, a tree uses branches and roots.
// The legacy light/heavy API remains LP/HP for existing saves and playtest tools.
Object.assign(DUEL_MOVES,{lk:{startup:8,active:4,recovery:14,damage:10,range:254,height:'low'},hk:{startup:18,active:5,recovery:23,damage:18,range:280,height:'overhead'}});
export const DUEL_COMMANDS={trace:{label:'Trace',directions:['F','D'],button:'light',notation:'forward · down · LP'},bind:{label:'Bind',directions:['D','B'],button:'lk',notation:'down · back · LK'},break:{label:'Break',directions:['B','F'],button:'hk',notation:'back · forward · HK'}};
export const DUEL_TECHNIQUES={
 spark:{trace:{name:'Lumen thread',effect:'A traveling lumen shard.',bolt:true,damage:14},bind:{name:'Held ember',effect:'Gather a close pulse behind a brief guard.',guard:32,damage:12,radial:true},break:{name:'Unbound conduit',effect:'Lift a close vessel with a rising gold pulse.',launcher:true,damage:18}},
 human:{trace:{name:'Rally step',effect:'Step into a guarded hand strike.',dash:65,guard:20,damage:14},bind:{name:'Glass oath',effect:'Brace and strike from a short guard.',guard:40,damage:12},break:{name:'Heart against the pattern',effect:'A rising spectral boot lifts the opponent.',launcher:true,damage:18}},
 computer:{trace:{name:'Prism trace',effect:'Send a cyan prism and enter Overclock.',bolt:true,overclock:180,damage:14},bind:{name:'Buried circuit',effect:'Brace inside a close cyan pulse.',guard:32,radial:true,damage:12},break:{name:'Array rupture',effect:'A rising prism lifts a close vessel.',launcher:true,damage:18}},
 animal:{trace:{name:'Feral crossing',effect:'A short pounce closes the distance.',dash:100,hop:true,damage:14},bind:{name:'Wild margin',effect:'Sweep low with a braced hind leg.',guard:24,low:true,damage:12},break:{name:'Feral ascent',effect:'A rising claw carries a vessel into the air.',launcher:true,damage:18}},
 tree:{trace:{name:'Root passage',effect:'A traveling root catches a grounded vessel.',bolt:true,low:true,root:32,damage:14},bind:{name:'Living vessel',effect:'Brace and hold a close vessel in roots.',guard:36,root:40,damage:12},break:{name:'Archive rising',effect:'A thick root lifts the opponent.',launcher:true,damage:18}},
 rock:{trace:{name:'Fault seam',effect:'Send a low fault wave along the floor.',bolt:true,low:true,damage:14},bind:{name:'Basalt guard',effect:'Brace and sweep the near fault.',guard:40,low:true,damage:12},break:{name:'Fault breaker',effect:'A stone heel opens a rising fault.',launcher:true,damage:18}},
 collector:{trace:{name:'Collection line',effect:'Lunge and grasp a grounded vessel.',dash:90,grab:true,damage:14},bind:{name:'Assigned hunger',effect:'A guarded lower tendril draws a vessel close.',guard:24,low:true,pull:true,damage:12},break:{name:'Uncollected spark',effect:'A rising grasp lifts the opponent.',launcher:true,damage:18}},
 archon:{trace:{name:'Prism witness',effect:'Mark a line and send an aimed prism.',bolt:true,damage:14},bind:{name:'Sealed lattice',effect:'Guard inside a close prism pulse.',guard:32,radial:true,damage:12},break:{name:'Crown fracture',effect:'A rising crystal strike lifts a vessel.',launcher:true,damage:18}},
 cantor:{trace:{name:'First movement',effect:'Wind a visible ring into a close pulse.',radial:true,damage:14},bind:{name:'Held note',effect:'Hold a short guard behind the winding ring.',guard:36,radial:true,damage:12},break:{name:'Second movement',effect:'The ring rises and lifts a close vessel.',launcher:true,radial:true,damage:18}}
};
const CHAIN_RANK={light:0,lk:1,heavy:2,hk:3,launcher:3,special:4,super:5};
const ACTIONS=['super','special','launcher','hk','heavy','lk','light','jump'];
const freshCombo=()=>({hits:0,damage:0,display:0,moves:[]});
export const DUEL_CONDITIONS={
 classic:{name:'Classic',desc:'100 HP. Standard movement and power recovery.',health:100,speed:1,gravity:1,cooldown:300,meter:0,drip:0},
 glass:{name:'Glass oath',desc:'80 HP for both vessels. Every opening matters.',health:80,speed:1,gravity:1,cooldown:300,meter:0,drip:0},
 quick:{name:'Quickening',desc:'Powers recover in 3 seconds for both vessels.',health:100,speed:1,gravity:1,cooldown:180,meter:0,drip:0},
 gravity:{name:'Heavy law',desc:'20% slower movement and heavier falls for both vessels.',health:100,speed:.8,gravity:1.25,cooldown:300,meter:0,drip:0},
 'seal-break':{name:'Seal break',desc:'The first hit of each round cannot be blocked.',health:100,speed:1,gravity:1,cooldown:300,meter:0,drip:0},
 charged:{name:'Charged current',desc:'Start each round with 50 meter; gain 2 meter per second.',health:100,speed:1,gravity:1,cooldown:300,meter:50,drip:2}
};
export const DUEL_LADDER_KEY='spark-substrate-duel-ladder-v1';
export const DUEL_LADDER=[
 ['First ember','human','glass','easy','classic'],['The running light','animal','root','easy','classic'],
 ['Prism witness','computer','tideglass','medium','quick'],['Root keeper','tree','root','medium','gravity'],
 ['Fault reader','rock','basalt','medium','glass'],['Mirror flame','spark','night','medium','charged'],
 ['The duelist','human','glass','hard','quick'],['Wild oath','animal','night','hard','glass'],
 ['The old circuit','computer','orbit','hard','charged'],['Patient crown','tree','root','hard','quick'],
 ['Basalt sovereign','rock','basalt','hard','gravity'],['The unbound spark','spark','orbit','hard','charged']
].map(([name,form,stage,difficulty,condition],i)=>({rung:i+1,name,form,stage,difficulty,condition,bonusHp:i*4}));
export function cleanLadder(raw){return {version:1,next:Number.isInteger(raw?.next)&&raw.next>=1&&raw.next<=13?raw.next:1,best:Number.isInteger(raw?.best)&&raw.best>=0&&raw.best<=12?raw.best:0,attempts:Number.isSafeInteger(raw?.attempts)&&raw.attempts>=0?raw.attempts:0};}
export function createLadderDuel(form,rung,profile='pc',seed=Date.now()>>>0){const entry=DUEL_LADDER[rung-1];if(!entry)throw Error('Choose a ladder rung from 1 to 12.');const match=createDuel({forms:[form,entry.form],stage:entry.stage,difficulty:entry.difficulty,condition:entry.condition,bonusHp:entry.bonusHp,bot:true,profile,seed});match.ladder={rung,name:entry.name};return match;}
export function recordLadder(match,raw){if(!match.ladder||match.phase!=='finished'||match.ladderRecorded)throw Error('Only a completed ladder match can advance a rung.');const record=cleanLadder(raw);if(match.ladder.rung!==record.next)throw Error('Win the current rung before climbing.');record.attempts++;if(match.winner===0){record.best=Math.max(record.best,match.ladder.rung);record.next=match.ladder.rung+1;}match.ladderRecorded=true;return record;}
export const DUEL_RECORD_KEY='spark-substrate-duels-v1';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),F=1/60;
function random(m){m.rng=(Math.imul(m.rng,1664525)+1013904223)>>>0;return m.rng/4294967296;}
const fighter=(form,i,rules=DUEL_CONDITIONS.classic,bonusHp=0)=>({form,x:i?670:290,y:0,vx:0,vy:0,hp:rules.health+(i?bonusHp:0),maxHp:rules.health+(i?bonusHp:0),meter:rules.meter,facing:i?-1:1,crouch:false,blocking:false,attack:null,stun:0,root:0,cooldown:0,guard:0,focusCharge:0,focusGuard:0,focusBoost:0,focusConnected:false,overclock:0,flash:0,rounds:0,previous:{},input:{},pending:null,motion:[],lastDirection:'N',walk:0,combo:freshCombo(),comboOwner:null,juggles:0,lastTechnique:null,stats:{hits:0,damage:0,specials:0,supers:0,throws:0,techs:0,commands:0,bestCombo:0}});
function resolveDuelContact(m){const [a,b]=m.fighters;if(Math.abs(a.y-b.y)<60&&Math.abs(a.x-b.x)<DUEL_CONTACT){const sign=a.x<=b.x?1:-1,lunging=f=>f.attack?.kind==='special'&&['animal','collector'].includes(f.form),center=lunging(a)&&!lunging(b)?a.x+sign*DUEL_CONTACT/2:lunging(b)&&!lunging(a)?b.x-sign*DUEL_CONTACT/2:(a.x+b.x)/2,middle=clamp(center,45+DUEL_CONTACT/2,915-DUEL_CONTACT/2);a.x=middle-sign*DUEL_CONTACT/2;b.x=middle+sign*DUEL_CONTACT/2;}}
function emit(m,type,data={}){m.events.push({id:++m.serial,type,frame:m.frames,...data});if(m.events.length>80)m.events.shift();}
export function createDuel({forms=['spark','human'],stage='glass',bot=false,difficulty='medium',profile='pc',seed=Date.now()>>>0,condition='classic',bonusHp=0,spatial=false}={}){
 if(typeof spatial!=='boolean')throw Error('Invalid spatial Duel setting.');
 if(!Array.isArray(forms)||forms.length!==2||forms.some(form=>!DUEL_FIGHTERS.includes(form))||!Object.hasOwn(DUEL_STAGES,stage)||!['easy','medium','hard'].includes(difficulty)||!['pc','controller','mobile'].includes(profile)||!Number.isInteger(seed)||!Object.hasOwn(DUEL_CONDITIONS,condition)||!Number.isInteger(bonusHp)||bonusHp<0||bonusHp>44||(!bot&&bonusHp!==0))throw Error('Choose two known vessels, a stage, and valid duel settings.');
 return {version:1,mode:'duel',...(spatial?{spatial:1}:{}),forms:[...forms],stage,condition,rules:{...DUEL_CONDITIONS[condition]},bonusHp,bot:!!bot,difficulty,profile,seed:seed>>>0,rng:seed>>>0,frames:0,serial:0,phase:profile==='mobile'&&!bot?'handoff':'playing',clock:60,round:1,firstHit:false,replay:0,roundWinner:null,winner:null,breakFrames:0,freeze:0,cinematic:0,throw:null,bolts:[],fighters:forms.map((form,i)=>fighter(form,i,DUEL_CONDITIONS[condition],bonusHp)),events:[],turn:0,turnFrames:180,botState:{decision:0,input:{},seenSpecials:0,lastAttack:null,pendingSpecial:null},recorded:false};
}
export function readyDuel(m){if(m.phase!=='handoff')throw Error('No handoff is waiting.');m.phase='playing';m.turnFrames=180;emit(m,'ready',{player:m.turn});}
export function skipDuelScene(m){if(m.phase==='finisher'){m.phase='finished';m.breakFrames=0;emit(m,'match',{winner:m.winner});}else if(m.cinematic>0){if(m.fighters.some(f=>f.attack?.kind==='super'))return;m.cinematic=0;}}
function nextRound(m){const rounds=m.fighters.map(f=>f.rounds),stats=m.fighters.map(f=>f.stats);m.fighters=m.forms.map((form,i)=>fighter(form,i,m.rules,m.bonusHp));m.fighters.forEach((f,i)=>{f.rounds=rounds[i];f.stats=stats[i];});m.clock=60;m.firstHit=false;m.bolts=[];m.throw=null;m.cinematic=0;m.freeze=0;m.turn=m.bot?0:(m.round-1)%2;m.turnFrames=180;m.phase=m.profile==='mobile'&&!m.bot?'handoff':'playing';m.botState.input={};m.botState.decision=0;emit(m,'round',{round:m.round});}
function endRound(m,winner){m.roundWinner=winner;emit(m,'ko',{winner,loser:winner===null?null:1-winner});if(winner!==null)m.fighters[winner].rounds++;m.phase='round-end';m.breakFrames=120;m.freeze=0;m.cinematic=0;m.throw=null;}
function moveFor(f){
 const a=f.attack,base=DUEL_MOVES[a?.kind];if(!base)return null;
 const technique=a.technique?DUEL_TECHNIQUES[f.form][a.technique]:null;
 return {...base,...technique,startup:a.startup??base.startup,range:technique?.range??base.range};
}
function addDamage(m,attacker,defender,amount,{special=false,launcher=false,throwing=false,low=false,overhead=false,root=0,pull=false}={}){
 const a=m.fighters[attacker],b=m.fighters[defender];if(b.hp<=0)return;
 const breaksSeal=m.condition==='seal-break'&&!m.firstHit;
 if(!breaksSeal&&!throwing&&b.focusGuard>0){b.focusConnected=true;b.focusGuard=0;b.meter=clamp(b.meter+4,0,100);emit(m,'focus-guard',{player:defender});return;}
 const directionalGuard=b.blocking&&(!low||b.crouch)&&(!overhead||!b.crouch);
 const blocked=!breaksSeal&&!throwing&&b.y===0&&(directionalGuard||b.guard>0);
 const actual=blocked?(special?amount*.05:0):amount;
 if(actual===0){emit(m,'block',{player:defender});return;}
 m.firstHit=true;const counter=!blocked&&!!b.attack&&b.attack.frame<(moveFor(b)?.startup??0);
 const continuing=!blocked&&b.comboOwner===attacker&&(b.stun>0||b.y>0);
 if(!blocked&&!continuing)a.combo=freshCombo();
 const scale=continuing?Math.max(.5,1-a.combo.hits*.14):1;
 const damage=Math.min(b.hp,actual*(blocked?1:scale));
 b.hp=clamp(b.hp-damage,0,b.maxHp);a.meter=clamp(a.meter+damage*1.8,0,100);b.meter=clamp(b.meter+damage*1.2,0,100);
 a.stats.hits++;a.stats.damage+=damage;b.flash=9;m.freeze=counter?6:3;
 if(!blocked){
  b.attack=null;b.pending=null;b.stun=Math.max(counter?24:20,['heavy','hk'].includes(a.attack?.kind)?26:a.attack?.kind==='lk'?22:20);b.comboOwner=attacker;
  b.x=clamp(b.x+a.facing*(pull?-32:continuing?7:launcher?26:18),45,915);
  if(launcher&&b.juggles<2){b.vy=510;b.y=Math.max(1,b.y);b.juggles++;}
  if(root||a.form==='tree'&&special)b.root=root||45;
  a.combo.hits++;a.combo.damage+=damage;a.combo.display=80;
  a.combo.moves.push(a.attack?.technique?DUEL_TECHNIQUES[a.form][a.attack.technique].name:a.attack?.kind??(throwing?'throw':'bolt'));
  a.stats.bestCombo=Math.max(a.stats.bestCombo,a.combo.hits);
 }
 emit(m,blocked?'chip':'hit',{attacker,defender,damage:Math.round(damage*10)/10,counter,blocked,low,overhead,combo:blocked?0:a.combo.hits,kind:a.attack?.kind??'bolt'});
}
function attack(m,i,kind,technique=null){
 const f=m.fighters[i];f.attack={id:++m.serial,kind,technique,crouch:['light','lk'].includes(kind)&&f.crouch,frame:0,hit:false,connected:false,...(kind==='special'&&f.focusBoost>0?{startup:7}:{})};
 if(kind==='special'){f.focusBoost=0;f.cooldown=m.rules.cooldown;f.stats.specials++;if(technique){f.stats.commands++;f.lastTechnique={name:DUEL_TECHNIQUES[f.form][technique].name,frame:m.frames};emit(m,'command',{player:i,technique,name:f.lastTechnique.name});}}
 if(kind==='super'){f.meter=0;f.stats.supers++;m.cinematic=72;}
 if(m.spatial&&kind==='special'){f.attack.aim=duelBoltAim(m,i,f.pending?.aim);if(i===1)f.attack.startup=DUEL_SPATIAL_RULES.enemyWindup;}
 emit(m,kind==='super'?'super':'attack',{player:i,kind,technique,attackId:f.attack.id});
}
function advanceAttack(m,i){
 const f=m.fighters[i],a=f.attack;if(!a)return;const move=moveFor(f);a.frame++;
 if(a.kind==='special'&&a.frame===move.startup){
  const boltCount=m.bolts.length;
  if(a.technique){
   if(move.guard)f.guard=move.guard;if(move.overclock)f.overclock=move.overclock;
   if(move.dash)f.x=clamp(f.x+f.facing*move.dash,45,915);
   if(move.hop){f.y=28;f.vy=65;}
   if(move.bolt){m.bolts.push({owner:i,x:f.x+f.facing*45,y:f.y+(move.low?15:65),vx:f.facing*(move.low?7:10),life:90,damage:move.damage,low:!!move.low,root:move.root??0,trail:[],technique:a.technique,form:f.form});a.hit=true;}
   if(move.grab&&Math.abs(f.x-m.fighters[1-i].x)<DUEL_CONTACT+22&&m.fighters[1-i].y===0){a.hit=true;const hp=m.fighters[1-i].hp;addDamage(m,i,1-i,move.damage,{special:true,throwing:true});a.connected=m.fighters[1-i].hp<hp;}
  }else{
   if(f.form==='archon'){m.bolts.push({owner:i,x:f.x+f.facing*25,y:f.y+65,vx:f.facing*9,life:70,damage:move.damage,trail:[],form:f.form});a.hit=true;}
   if(f.form==='human')f.guard=40;if(f.form==='rock')f.guard=24;if(f.form==='computer')f.overclock=240;
   if(f.form==='collector'){f.x=clamp(f.x+f.facing*90,45,915);if(Math.abs(f.x-m.fighters[1-i].x)<DUEL_CONTACT+12&&m.fighters[1-i].y===0){a.hit=true;const hp=m.fighters[1-i].hp;addDamage(m,i,1-i,move.damage,{special:true,throwing:true});a.connected=m.fighters[1-i].hp<hp;}}
   if(f.form==='animal'){f.x=clamp(f.x+f.facing*160,45,915);f.y=35;f.vy=70;}
  }
  if(m.spatial&&m.bolts.length>boltCount)Object.assign(m.bolts.at(-1),a.aim);
  emit(m,'power',{player:i,form:f.form,technique:a.technique});
 }
 if(a.frame>=move.startup&&a.frame<move.startup+move.active&&!a.hit){
  const b=m.fighters[1-i];let range=move.range;
  if(a.kind==='special'&&!a.technique)range=['computer','archon','rock'].includes(f.form)?340:f.form==='animal'?227:272;
  const low=move.low||move.height==='low'||a.kind==='special'&&!a.technique&&f.form==='rock';
  const overhead=move.height==='overhead'||!!move.launcher;
  const radial=move.radial||a.kind==='special'&&f.form==='spark';
  const canHitCrouch=a.kind!=='light'||f.crouch;
  if(Math.abs(f.x-b.x)<=range&&(radial||(b.x-f.x)*f.facing>=-16)&&Math.abs(f.y-b.y)<(low?35:110)&&(canHitCrouch||!b.crouch)){
   a.hit=true;const hp=b.hp;addDamage(m,i,1-i,move.damage,{special:['special','super'].includes(a.kind),launcher:a.kind==='launcher'||!!move.launcher,low,overhead,root:move.root??0,pull:!!move.pull});a.connected=b.hp<hp&&!m.events.at(-1)?.blocked;
  }
 }
 const recovery=Math.round(move.recovery*(f.overclock>0&&['light','heavy','lk','hk','launcher'].includes(a.kind)?.8:1));
 if(a.frame>=move.startup+move.active+recovery)f.attack=null;
}
function captureInput(m,i,raw={}){
 const f=m.fighters[i],other=m.fighters[1-i];f.facing=other.x>=f.x?1:-1;
 const input={x:clamp(Number(raw.x)||0,-1,1),crouch:!!raw.crouch,focus:!!raw.focus,jump:!!raw.jump,light:!!(raw.lp||raw.light),heavy:!!(raw.hp||raw.heavy),lk:!!raw.lk,hk:!!raw.hk,launcher:!!raw.launcher,special:!!raw.special,super:!!raw.super};
 const direction=input.crouch?'D':input.x*f.facing>.35?'F':input.x*f.facing<-.35?'B':input.jump?'U':'N';
 f.motion=f.motion.filter(e=>m.frames-e.frame<=28);
 if(direction!==f.lastDirection){if(direction!=='N')f.motion.push({direction,frame:m.frames});f.lastDirection=direction;}
 for(const action of ACTIONS){if(input[action]&&!f.previous[action]){
  const sequence=f.motion.slice(-2);
  const command=Object.entries(DUEL_COMMANDS).find(([,c])=>c.button===action&&sequence.length===2&&sequence.every((e,j)=>e.direction===c.directions[j])&&sequence[1].frame-sequence[0].frame<=24&&m.frames-sequence[1].frame<=10)?.[0]??null;
  f.pending={action,command,back:input.x*f.facing<-.25,frame:m.frames,expires:m.frames+(command?18:12)};
  if(command)f.motion=[];break;
 }}
 if(m.spatial){
  const spatial=duelSpatialInput(raw.spatial);
  f.spatialPose=spatial?.body??null;
  if(spatial?.dodge&&!f.previous.dodge&&(f.dodgeCooldown??0)===0&&f.stun===0&&!f.attack){
   f.dodgeTime=DUEL_SPATIAL_RULES.dodgeFrames;f.dodgeCooldown=DUEL_SPATIAL_RULES.dodgeCooldown;
   f.dodgeOffset=spatial.dodgeDirection*DUEL_SPATIAL_RULES.dodgeDistance;emit(m,'dodge',{player:i});
  }
  input.dodge=!!spatial?.dodge;input.cast=!!spatial?.cast;
  if(spatial?.cast&&!f.previous.cast&&DUEL_TECHNIQUES[f.form]?.trace?.bolt&&
    f.x+spatial.aim.forward>=45&&f.x+spatial.aim.forward<=915){
   f.pending={action:'special',command:'trace',aim:spatial.aim,frame:m.frames,expires:m.frames+12};
  }
 }
 f.previous=input;f.input=input;
}
function inputFrame(m,i){
 const f=m.fighters[i],other=m.fighters[1-i],input=f.input??{},pending=f.pending;
 if(pending&&pending.expires<m.frames)f.pending=null;
 f.blocking=input.x*f.facing<-.25&&f.y===0&&!f.attack&&f.stun===0;f.crouch=f.attack?!!f.attack.crouch:input.crouch&&f.y===0;
 if(input.focus&&f.stun===0&&!f.attack&&f.y===0){f.blocking=false;f.focusCharge=Math.min(24,f.focusCharge+1);if(f.focusCharge===24&&!f.focusLatched){f.focusGuard=12;f.focusBoost=90;f.focusConnected=false;f.focusLatched=true;emit(m,'focus',{player:i});}}else{f.focusCharge=0;f.focusLatched=false;}
 if(m.throw){if(m.throw.target===i&&f.pending?.action==='light'&&f.pending.back&&m.throw.frames<=8){m.fighters[m.throw.owner].stun=15;f.stun=15;f.stats.techs++;f.pending=null;emit(m,'tech',{player:i});m.throw=null;}return;}
 if(f.stun>0||m.cinematic>0||input.focus)return;
 const request=f.pending,kind=request?.command?'special':request?.action;
 const cancel=!!(f.attack?.connected&&request&&CHAIN_RANK[kind]>CHAIN_RANK[f.attack.kind]);
 if(request&&(!f.attack||cancel)){
  const ground=f.y===0;
  if(kind==='super'&&f.meter>=100){if(cancel)other.stun=Math.max(other.stun,36);attack(m,i,'super');f.pending=null;}
  else if(kind==='special'&&f.cooldown===0){attack(m,i,'special',request.command);f.pending=null;}
  else if(kind==='light'&&request.back&&Math.abs(f.x-other.x)<DUEL_CONTACT+12&&ground&&other.y===0&&!f.attack){m.throw={owner:i,target:1-i,frames:0};f.stats.throws++;f.pending=null;emit(m,'throw',{player:i,target:1-i});}
  else if(['light','heavy','lk','hk','launcher'].includes(kind)){if(cancel)emit(m,'cancel',{player:i,from:f.attack.kind,to:kind});attack(m,i,kind);f.pending=null;}
  else if(kind==='jump'&&ground&&f.root===0&&!f.attack){f.vy=570;f.y=.1;f.pending=null;}
 }
 if(!f.attack&&!f.crouch&&f.root===0){const dx=(input.x||0)*210*m.rules.speed*F;f.x=clamp(f.x+dx,45,915);f.vx=dx*60;f.walk+=Math.abs(dx)/35;}else f.vx=0;
}
// The bot sees positions, visible poses and its own cooldowns, never an opponent's
// remaining frames, future inputs, RNG, meter or cooldown.
export function duelBotInput(m){const bot=m.fighters[1],other=m.fighters[0],state=m.botState,pose=other.attack?.kind??null,id=other.attack?.id??null;if(state.pendingSpecial!==null&&id!==state.pendingSpecial){state.seenSpecials++;state.pendingSpecial=null;}if(pose==='special'&&id!==state.lastAttack){state.pendingSpecial=id;state.lastAttack=id;}
 // Bot command motions travel through the same input history as both players.
 if(state.commandPlan?.length){const part=state.commandPlan[0];if(--part.frames<=0)state.commandPlan.shift();state.input=part.input;return state.input;}
 if(m.difficulty!=='easy'&&bot.attack?.connected&&state.chainId!==bot.attack.id){const next={light:'lk',lk:'heavy',heavy:'hk',hk:'special',launcher:'special',special:'super'}[bot.attack.kind];state.chainId=bot.attack.id;if(next&&(next!=='special'||bot.cooldown===0)&&(next!=='super'||bot.meter>=100)){state.input={[next]:true};return state.input;}}
 if(--state.decision>0)return state.input;state.decision=m.difficulty==='easy'?18:m.difficulty==='medium'?12:9;const distance=Math.abs(other.x-bot.x),toward=other.x>bot.x?1:-1,r=random(m),input={x:distance>DUEL_CONTACT+7?toward:0};
 const blockChance=m.difficulty==='easy'?.08:m.difficulty==='medium'?.3:.55;if(pose&&(r<blockChance||m.difficulty==='hard'&&pose==='special'&&state.seenSpecials>0))input.x=-toward;
 else if(bot.meter>=100&&distance<DUEL_CONTACT+82)input.super=true;else if(bot.cooldown===0&&distance<310&&r>.55){if(m.difficulty==='easy')input.special=true;else{const command=r>.84?'break':r>.69?'bind':'trace',spec=DUEL_COMMANDS[command],direction=d=>d==='D'?{crouch:true}:{x:d==='F'?toward:-toward};state.commandPlan=[{input:direction(spec.directions[0]),frames:3},{input:direction(spec.directions[1]),frames:3},{input:{[spec.button]:true},frames:1},{input:{},frames:1}];input.x=0;}}
 else if(distance<DUEL_CONTACT+27&&r>.2)input[r<.4?'light':r<.6?'lk':r<.8?'heavy':r<.93?'hk':'launcher']=true;else if(distance>DUEL_CONTACT+102&&r>.88)input.jump=true;
 state.input=input;return input;
}
export function stepDuel(m,inputs=[{},{}],frames=1){if(!Number.isInteger(frames)||frames<1||frames>240)throw Error('Use 1–240 duel frames.');for(let n=0;n<frames;n++){
 if(['finished','handoff','paused'].includes(m.phase))break;m.frames++;
 if(m.phase==='finisher'){if(--m.breakFrames<=0){m.phase='finished';emit(m,'match',{winner:m.winner});}continue;}
 if(m.phase==='round-end'){if(--m.breakFrames>0)continue;if(m.roundWinner!==null&&m.fighters[m.roundWinner].rounds>=2){m.winner=m.roundWinner;const winner=m.fighters[m.winner],loser=m.fighters[1-m.winner];if(loser.hp/loser.maxHp<.1&&winner.meter>0){m.phase='finisher';m.breakFrames=120;winner.meter=0;emit(m,'finisher',{winner:m.winner,loser:1-m.winner});}else{m.phase='finished';emit(m,'match',{winner:m.winner});}}else{if(m.roundWinner===null&&m.replay===0)m.replay=1;else{m.round++;m.replay=0;}nextRound(m);}continue;}
 const source=[inputs[0]??{},m.bot?duelBotInput(m):inputs[1]??{}];for(let i=0;i<2;i++)captureInput(m,i,m.profile==='mobile'&&!m.bot&&i!==m.turn?{}:source[i]);resolveDuelContact(m);if(m.freeze>0){m.freeze--;continue;}if(m.cinematic>0)m.cinematic--;else m.clock=m.clock<=F+1e-8?0:m.clock-F;
 for(let i=0;i<2;i++){const f=m.fighters[i];f.combo.display=Math.max(0,f.combo.display-1);if(f.stun===0&&f.y===0){f.comboOwner=null;f.juggles=0;}f.meter=clamp(f.meter+m.rules.drip*F,0,100);if(m.spatial){f.dodgeCooldown=Math.max(0,(f.dodgeCooldown??0)-1);f.dodgeTime=Math.max(0,(f.dodgeTime??0)-1);if(!f.dodgeTime)f.dodgeOffset=0;}for(const key of ['stun','root','cooldown','guard','overclock','flash','focusBoost'])f[key]=Math.max(0,f[key]-1);if(f.focusGuard>0&&--f.focusGuard===0&&!f.focusConnected){f.meter=clamp(f.meter-10,0,100);emit(m,'focus-whiff',{player:i});}inputFrame(m,i);}
 if(m.throw&&++m.throw.frames>8){const {owner,target}=m.throw;m.throw=null;addDamage(m,owner,target,14,{throwing:true});m.fighters[owner].stun=20;}
 for(let i=0;i<2;i++){const f=m.fighters[i];if(f.y>0||f.vy>0){f.y=Math.max(0,f.y+f.vy*F);f.vy-=1500*m.rules.gravity*F;if(f.y===0)f.vy=0;}}resolveDuelContact(m);for(let i=0;i<2;i++)advanceAttack(m,i);
 for(const bolt of m.bolts){bolt.trail??=[];bolt.trail.push({x:bolt.x,y:bolt.y});if(bolt.trail.length>5)bolt.trail.shift();const from={x:bolt.x,y:bolt.y,z:bolt.z??0};bolt.x+=bolt.vx;if(m.spatial){bolt.y+=bolt.vy??0;bolt.z=(bolt.z??0)+(bolt.vz??0);}bolt.life--;const other=m.fighters[1-bolt.owner];if(m.spatial?duelSpatialCollision(from,bolt,duelBody(other)):Math.abs(bolt.x-other.x)<65&&Math.abs(bolt.y-(other.y+(bolt.low?15:65)))<(bolt.low?30:60)){addDamage(m,bolt.owner,1-bolt.owner,bolt.damage,{special:true,low:!!bolt.low,root:bolt.root??0});bolt.life=0;}}m.bolts=m.bolts.filter(b=>b.life>0&&b.x>0&&b.x<960&&(!m.spatial||duelSpatialBoltInBounds(b)));
 resolveDuelContact(m);const [a,b]=m.fighters;
 if(a.hp<=0||b.hp<=0)endRound(m,a.hp<=0&&b.hp<=0?null:a.hp>0?0:1);else if(m.clock===0)endRound(m,a.hp/a.maxHp===b.hp/b.maxHp?null:a.hp/a.maxHp>b.hp/b.maxHp?0:1);
 else if(m.profile==='mobile'&&!m.bot&&--m.turnFrames<=0){m.turn=1-m.turn;m.phase='handoff';emit(m,'handoff',{player:m.turn});}
 }return m;}
export function observeDuel(m){return m?structuredClone({mode:m.mode,phase:m.phase,forms:m.forms,stage:m.stage,condition:m.condition,ladder:m.ladder??null,clock:m.clock,round:m.round,replay:m.replay,turn:m.turn,winner:m.winner,frames:m.frames,fighters:m.fighters.map(f=>({form:f.form,x:f.x,y:f.y,hp:f.hp,maxHp:f.maxHp,meter:f.meter,rounds:f.rounds,cooldown:f.cooldown/60,technique:f.attack?.technique??null,combo:{...f.combo},motion:f.motion.map(e=>e.direction),pose:f.attack?.kind??(f.stun?'hurt':f.focusCharge?'focus':f.blocking?'block':f.crouch?'crouch':f.y?'jump':'idle'),stats:f.stats}))}):{mode:'duel',phase:'select'};}
export function cleanDuelRecord(raw){const next={version:1,matches:0,wins:Object.fromEntries(DUEL_FIGHTERS.map(f=>[f,0])),losses:Object.fromEntries(DUEL_FIGHTERS.map(f=>[f,0])),last:null};if(raw?.version!==1)return next;for(const name of ['wins','losses'])for(const form of DUEL_FIGHTERS)if(Number.isInteger(raw[name]?.[form])&&raw[name][form]>=0)next[name][form]=Math.min(1e6,raw[name][form]);if(Number.isInteger(raw.matches)&&raw.matches>=0)next.matches=Math.min(1e6,raw.matches);if(Array.isArray(raw.last?.forms)&&raw.last.forms.length===2&&raw.last.forms.every(f=>DUEL_FIGHTERS.includes(f))&&[0,1].includes(raw.last.winner)&&Object.hasOwn(DUEL_STAGES,raw.last.stage)&&Array.isArray(raw.last.rounds)&&raw.last.rounds.length===2&&raw.last.rounds.every(n=>Number.isInteger(n)&&n>=0&&n<=2))next.last={forms:[...raw.last.forms],winner:raw.last.winner,rounds:[...raw.last.rounds],stage:raw.last.stage,bot:!!raw.last.bot};return next;}
export function recordDuel(m,raw){if(m.phase!=='finished'||m.winner===null||m.recorded)throw Error('Only a completed, unrecorded match can be remembered.');const record=cleanDuelRecord(raw),winner=m.forms[m.winner],loser=m.forms[1-m.winner];record.matches++;if(!m.bot||m.winner===0)record.wins[winner]++;if(!m.bot||m.winner===1)record.losses[loser]++;record.last={forms:[...m.forms],winner:m.winner,rounds:m.fighters.map(f=>f.rounds),stage:m.stage,bot:m.bot};m.recorded=true;return record;}
