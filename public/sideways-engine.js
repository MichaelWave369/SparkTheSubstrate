import {WORLDS,WORLD_ORDER,WORLD_GUARDIANS,VESSEL_POWERS} from './worlds.js?v=0.17.0';
import {KEYS} from './exploration.js?v=0.17.0';
import {SIDE_IMPRINTS,SIDE_EQUIPMENT,SIDE_FACTIONS,hasSideImprint,sideBuff,sideDamageBonus,sideSet,sideArmor,freshSideBuild,cleanSideBuild,sideStations,sideService} from './sideways-build.js?v=0.17.0';
import {sideParticles,tickSideParticles,physicalCoins,tickSideCoins,authoredProps,hitSideEnemy,tickSideReaction,sideGrab,hitSideProp,tickSideProps} from './sideways-brawler.js?v=0.17.0';
import {SIDE_BRANCH_ROOMS,SIDE_BRANCH_LINKS,SIDE_PATHS,SIDE_CACHE_ROOMS,SIDE_RELICS,hasSideRelic,validSideRelic,hasSidePath,sidePathObjective,rememberSidePath} from './sideways-paths.js?v=0.17.0';

import {tickSideGuardian} from './sideways-guardians.js?v=0.17.0';

// Keys, seals and memory remain in this journey. Carried coins may be deposited
// into the existing device Vault through a receipt-backed UI callback.
export const SIDE_KEY='spark-substrate-sideways-v1';
export const SIDE_FORMS=['spark','human','computer','animal','tree','rock'];
export const SIDE_NAMES={spark:'Spark',human:'Human',computer:'Computer',animal:'Animal',tree:'Tree',rock:'Rock'};
export const SIDE_COLORS={spark:'#f1d188',human:'#e7c19c',computer:'#81e5ef',animal:'#c8daaa',tree:'#a0dcad',rock:'#c2b4e0'};
export const SIDE_TRAITS={
 spark:{speed:285,jump:680,desc:'Hold Jump in the air to drift. Lumen strikes travel through the dark.'},
 human:{speed:290,jump:670,desc:'A steady stride. Rally restores health and grants a brief guard.'},
 computer:{speed:280,jump:665,desc:'Prism shots reach farther. Air dash crosses gaps; Overclock fires a volley.'},
 animal:{speed:325,jump:695,desc:'Jump again in the air. Pounce carries a feral strike into the landing.'},
 tree:{speed:245,jump:670,desc:'Living doors answer you. Root hold binds enemies and grows temporary steps.'},
 rock:{speed:235,jump:670,desc:'Fault doors answer your weight. Fault guard breaks bolts with a shockwave.'}
};
const room=(world,name,coord,extra={})=>({world,name,coord,width:1900,height:820,floor:620,layout:'steps',...extra,doors:[]});
export const SIDE_ROOMS={
 threshold:room('stratum','The Threshold',[0,0],{safe:true,width:1500,layout:'hall',clue:'The Vault, merchant, Memory Imprint altar, and Memory Arcade wait in this hall. Walk the causeway. The echo forge remembers a guardian; the reliquary remembers a key.'}),
 glass:room('stratum','The Glass Causeway',[1,0],{layout:'arches',enemies:['collector','collector','archon'],clue:'Jump over a cyan bolt. Strike from outside a collector’s reach.'}),
 machine:room('stratum','Machine Sepulcher',[2,0],{layout:'machine',depthLane:true,enemies:['archon','collector','archon'],clue:'A shallow combat lane opens here. Up / Down moves across the floor; Space jumps. Turrets mark their aim in cyan.'}),
 cistern:room('stratum','The Resonant Cistern',[3,0],{layout:'stairs',enemies:['collector','hound'],clue:'Climb the eastern ledges for Nacre’s Reliquary. The Cantor waits along the lower route.'}),
 forge:room('stratum','The Echo Forge',[4,0],{width:1500,layout:'arena',boss:'cantor',clue:'A wind-up ring comes before the notes. Jump the low volley; leave the marked ground. After the Cantor falls, the western amber terminal remembers the first forge.'}),
 reliquary:room('stratum','Nacre’s Reliquary',[3,-1],{layout:'reliquary',enemies:['collector','archon'],key:'ivory',secret:'feather',clue:'The Ivory Key answers the mirrors. A feather rests above a ledge no single jump can reach; return in another body.'}),
 nursery:room('stratum','The Mirror Nursery',[4,-1],{layout:'mirrors',enemies:['mirror','collector'],resonance:true,secretReturn:true,clue:'Six mirrors, one spark. Clear the room to learn resonance. The eastern living door remembers Tree. A feather may answer the high seam after the Cinder guardian falls.'}),
 archive:room('stratum','The Verdant Archive',[5,-1],{layout:'roots',enemies:['collector','hound','archon'],clue:'Living wood opens the archive. The eastern stone passage needs Rock; borrow both shapes.'}),
 belfry:room('stratum','Obsidian Belfry',[6,-1],{layout:'stairs',enemies:['archon','hound'],key:'crown',clue:'A crown without a king. Return with the Crown Key and the Cantor’s remembered note.'}),
 eye:room('stratum','The Demiurge’s Eye',[7,-1],{width:1560,layout:'arena',boss:'warden',seal:'stratum',clue:'The Warden guards the first seam. His seal opens the drowned province.'}),
 'tide-harbor':room('tideglass','The Unmoored Harbor',[8,-1],{safe:true,layout:'hall',clue:WORLDS.tideglass.desc}),
 'tide-archive':room('tideglass','The Salt Archive',[9,-1],{layout:'tide',enemies:['collector','archon','hound'],key:'pearl',clue:'The Pearl Key opens the throne back at the harbor. A Computer reads the prism sluice.'}),
 'tide-throne':room('tideglass','The Tidal Throne',[8,0],{width:1600,layout:'arena',boss:'tidekeeper',seal:'tideglass',clue:'Read the tidal marks. Jump the low fan when it reaches you.'}),
 'grove-rest':room('verdant','The Patient Grove',[8,1],{safe:true,layout:'roots',clue:WORLDS.verdant.desc}),
 'grove-well':room('verdant','The Rootwell',[9,1],{layout:'roots',enemies:['hound','collector','archon'],key:'seed',clue:'The Seed Key is held by the ancient root. Bring it back to the grove; a Tree can follow the canopy.'}),
 'grove-heart':room('verdant','The Thornmother’s Heart',[8,2],{width:1650,layout:'arena',boss:'thornmother',seal:'verdant',clue:'Roots mark the floor before they rise. The leaf crown gathers light before its volley.'}),
 'cinder-rest':room('cinder','The Cold Anvil',[8,3],{safe:true,layout:'machine',clue:WORLDS.cinder.desc}),
 'cinder-fuel':room('cinder','The Fuel Chapel',[9,3],{layout:'machine',enemies:['archon','collector','archon','hound'],key:'ember',clue:'The Ember Key waits beyond the constructs. Rock’s weight answers the stopped clock gate.'}),
 'cinder-throne':room('cinder','The Regent’s Furnace',[8,4],{width:1700,layout:'arena',boss:'regent',seal:'cinder',clue:'The clock gathers amber light. Leave its marked ground before the second hand falls. After its fall, a violet terminal waits on the western floor.'}),
 'night-rest':room('prism','The Unlit Vestibule',[8,5],{safe:true,layout:'arches',secretDoor:true,clue:'A feather from Nacre’s Reliquary can answer a seam in this night. Look above the western steps.'}),
 'night-library':room('prism','The Dream Library',[9,5],{layout:'mirrors',enemies:['mirror','hound','archon','mirror'],key:'dusk',clue:'The Dusk Key answers the Weaver’s Nest. Only an Animal follows the trail through the shadow gate.'}),
 'night-nest':room('prism','The Weaver’s Nest',[8,6],{width:1700,layout:'arena',boss:'weaver',seal:'prism',clue:'The Weaver pauses before each thread. Find the gap in the fan; jump the returning low note.'}),
 'orbit-rest':room('orbit','The Moonless Dock',[8,7],{safe:true,layout:'hall',clue:WORLDS.orbit.desc+' Computer can read the eastern green terminal; it remembers the first vessel skill trees.'}),
 'orbit-relay':room('orbit','The Lunar Relay',[9,7],{layout:'orbit',enemies:['mirror','archon','hound','archon'],key:'orbit',clue:'Light remembers a road. The Orbit Key opens the horizon; a Spark reveals the last light bridge.'}),
 'orbit-throne':room('orbit','The Curator’s Horizon',[8,8],{width:1750,layout:'arena',boss:'curator',seal:'orbit',clue:'The Curator marks a place before the stars fall. Six seals complete the origin seam.'}),
 'origin-seam':room('uncreated','The Origin Seam',[8,9],{safe:true,layout:'hall',clue:'All six seals answer. The last door accepts Human. The body falls. The spark remembers.'}),
 'origin-heart':room('uncreated','The Maker’s Heart',[9,9],{width:1800,layout:'arena',boss:'demiurge',final:true,clue:'The Demiurge changes his law. Read the crown ring and leave the marked ground.'}),
 ...Object.fromEntries(Object.entries(SIDE_BRANCH_ROOMS).map(([id,r])=>[id,room(r.world,r.name,r.coord,r)]))
};
function connect(a,b,options={}){const ra=SIDE_ROOMS[a],rb=SIDE_ROOMS[b],left=options.secret?'seam':options.branch?'branch':'east';ra.doors.push({to:b,side:left,...options});rb.doors.push({to:a,side:options.secret?'seam':'west',return:true,...(options.secret?{secret:true}:{}),...(options.returnForm?{form:options.returnForm}:{})});}
connect('threshold','glass');connect('glass','machine');connect('machine','cistern');connect('cistern','forge');
connect('cistern','reliquary',{branch:true});connect('reliquary','nursery',{key:'ivory'});
connect('nursery','archive',{form:'tree'});connect('archive','belfry',{form:'rock'});
connect('belfry','eye',{key:'crown',feat:'forge'});connect('eye','tide-harbor',{seal:'stratum'});
const regions=[['tide','tideglass','harbor','archive','throne','pearl','computer'],['grove','verdant','rest','well','heart','seed','tree'],['cinder','cinder','rest','fuel','throne','ember','rock'],['night','prism','rest','library','nest','dusk','animal'],['orbit','orbit','rest','relay','throne','orbit','spark']];
for(let i=0;i<regions.length;i++){const [prefix,world,rest,key,boss,lock,form]=regions[i];connect(prefix+'-'+rest,prefix+'-'+key,{form});connect(prefix+'-'+rest,prefix+'-'+boss,{key:lock,branch:true});const next=i<4?regions[i+1][0]+'-'+regions[i+1][2]:'origin-seam';connect(prefix+'-'+boss,next,{seal:world});}
connect('origin-seam','origin-heart',{form:'human',allSeals:true});
connect('nursery','night-rest',{secret:true,seal:'cinder'});
for(const [from,to,options]of SIDE_BRANCH_LINKS)connect(from,to,{branch:true,...options});

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),finite=(n,a,b)=>Number.isFinite(n)&&n>=a&&n<=b;
export function sideGeometry(id){
 const r=SIDE_ROOMS[id];if(!r)throw Error('Unknown side room.');const f=r.floor,w=r.width;
 const layouts={
 hall:[[620,f-92,240],[1100,f-180,210]],
 steps:[[470,f-90,200],[730,f-185,180],[980,f-280,190],[1280,f-175,210],[1540,f-85,180]],
 arches:[[470,f-105,280],[840,f-210,170],[1120,f-105,290],[1500,f-235,190]],
 machine:[[460,f-95,170],[680,f-190,160],[1060,f-100,240],[1370,f-205,220],[1660,f-115,140]],
 stairs:[[460,f-90,210],[700,f-180,190],[930,f-270,200],[1160,f-360,240],[1450,f-205,200]],
 reliquary:[[470,f-80,240],[770,f-175,170],[980,f-275,210],[1270,f-365,230],[1010,f-540,200]],
 mirrors:[[500,f-115,170],[750,f-230,210],[1130,f-170,190],[1440,f-280,170],[1620,f-90,170]],
 roots:[[470,f-85,230],[770,f-180,240],[1050,f-285,180],[1350,f-180,240],[1610,f-85,160]],
 tide:[[420,f-85,200],[690,f-180,240],[1000,f-285,200],[1340,f-180,190],[1590,f-90,160]],
 orbit:[[430,f-100,190],[710,f-205,160],[990,f-310,180],[1270,f-200,160],[1540,f-95,200]],
 arena:[[320,f-90,180],[w-490,f-90,180]],
 'drift-path':[[420,f-85,200],[660,f-180,180],[1150,f-100,230],[1460,f-90,190]],
 'prism-path':[[440,f-110,220],[740,f-220,170],[1150,f-90,210],[1450,f-190,220]],
 'root-path':[[440,f-90,230],[760,f-240,180],[1100,f-135,170],[1400,f-275,230]],
 'fault-path':[[410,f-75,190],[770,f-190,220],[1100,f-95,250],[1460,f-210,200]],
 'feral-path':[[440,f-90,180],[730,f-160,180],[1040,f-70,180],[1320,f-310,230]],
 'rally-path':[[470,f-95,220],[780,f-240,210],[1100,f-90,170],[1400,f-120,220]],
 'clock-cache':[[420,f-90,220],[780,f-190,170],[1120,f-100,210],[1430,f-230,190]],
 'score-cache':[[460,f-85,200],[790,f-240,210],[1090,f-90,180],[1440,f-190,200]],
 'bell-cache':[[450,f-180,170],[800,f-90,240],[1110,f-260,200],[1430,f-100,200]],
  'sleep-cache':[[450,f-85,180],[800,f-175,210],[1110,f-90,180],[1430,f-190,210]],
  'thread-cache':[[470,f-110,200],[780,f-250,190],[1090,f-80,190],[1400,f-120,230]],
  'window-cache':[[450,f-90,200],[780,f-205,230],[1110,f-300,180],[1440,f-100,210]]
 };
 const platforms=(layouts[r.layout]??layouts.steps).map(([x,y,width],i)=>({id:'ledge-'+i,x,y,w:width,h:22,oneWay:true}));
 // Branches to guardian chambers are ground mouths. Only the Cistern branch is above.
 const doors=r.doors.map(d=>({...d,x:d.x??(d.secret?620:d.side==='west'?95:d.branch&&id==='cistern'?1270:d.branch?Math.round(w*.56):w-95),y:d.y??(d.secret?f-(id==='nursery'?115:105):d.branch&&id==='cistern'?f-360:f)}));
 const pits=['tide-archive','orbit-relay'].includes(id)?[{x:1180,w:130}]:['conduit','tide-lantern'].includes(id)?[{x:930,w:210}]:[];
 let start=0;for(const pit of pits){platforms.push({id:'floor-'+start,x:start,y:f,w:pit.x-start,h:220});start=pit.x+pit.w;}
 platforms.push({id:'floor-'+start,x:start,y:f,w:w-start,h:220});
 return {platforms,doors,pits,checkpoint:{x:230,y:f},secret:{x:1110,y:f-540}};
}
function emit(s,type,text='',x=s.player.x,y=s.player.y,value=0){s.events.push({id:++s.eventSerial,type,text,x,y,value,time:s.time});if(s.events.length>40)s.events.shift();if(text)s.notice=text;}
function spawnRoom(s){
 const r=SIDE_ROOMS[s.room],rank=WORLD_ORDER.indexOf(r.world),floor=r.floor;
 s.enemies=[];s.bolts=[];s.marks=[];s.bridges=[];
 if(!s.cleared.includes(s.room)||s.echoRoom===s.room&&!s.echoFinished)for(let i=0;i<(r.enemies??[]).length;i++){const kind=r.enemies[i],captain=s.room==='cinder-fuel'&&kind==='collector',hp=Math.round((kind==='archon'?52+rank*12:60+rank*14)*(captain?1.5:1));s.enemies.push({id:s.echoRoom===s.room?'echo:'+s.room+':'+s.life+'-'+i:s.room+'-'+i,kind,displayName:sideEnemyName(kind),captain,x:680+i*280,y:floor,vx:0,vy:0,lane:r.depthLane?(i%2?24:-24):0,hp,maxHp:hp,clock:1.3+i*.45,windup:0,facing:-1,root:0,flash:0,state:'ready',stagger:0});}
 if(r.boss&&(s.practice||!s.cleared.includes(s.room))){const hp=({cantor:600,warden:780}[r.boss]??900+rank*150);s.enemies.push({id:s.room+'-guardian',kind:r.boss,displayName:sideEnemyName(r.boss),boss:true,x:r.width*.69,y:floor,hp,maxHp:hp,clock:2.4,windup:0,phase:1,facing:-1,root:0,flash:0,state:'ready',vx:0,vy:0,lane:0});}
 s.loot[s.room]??={coins:[],props:s.practice?[]:authoredProps(s,r)};s.coins=s.loot[s.room].coins;s.props=s.loot[s.room].props;s.station=null;s.hitstop=0;s.particles=[];s.shake=0;
}
export function createSideJourney(){
 const s={schema:2,id:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10),room:'threshold',form:'spark',phase:'playing',time:0,keys:[],seals:[],forms:['spark'],visited:['threshold'],cleared:['threshold'],memories:[],secrets:[],paths:[],relics:[],pathPractice:{},opened:[],journal:[],falls:0,damage:0,eventSerial:0,events:[],notice:'A spark against the pattern.',wallet:0,collected:0,recovered:0,bankSerial:0,pendingBank:null,memoryPoints:0,imprints:[],build:freshSideBuild(),loot:{},lootLedger:[],combo:0,comboClock:0,bestCombo:0,life:1,echoRoom:null,echoFinished:false,particles:[],hitstop:0,shake:0,checkpoint:{room:'threshold',x:230,y:620},player:{x:270,y:620,vx:0,vy:0,lane:0,hp:130,maxHp:130,facing:1,grounded:true,coyote:6,jumpBuffer:0,jumps:0,drift:0,invuln:0,dash:0,dashCooldown:0,powerCooldown:0,attack:null,attackCooldown:0,walk:0,grab:null,carry:null,guard:false,guardAge:0,hurt:0},previous:{}};
 spawnRoom(s);recordRoom(s);return s;
}
function recordRoom(s){const r=SIDE_ROOMS[s.room];if(!s.visited.includes(s.room))s.visited.push(s.room);if(!s.journal.some(j=>j.room===s.room))s.journal.push({room:s.room,title:r.name,text:r.clue});}
export function createSideGuardianMemory(parent,id){
 if(!SIDE_ROOMS[id]?.boss||!parent.cleared.includes(id)||parent.phase==='fallen')throw Error('Defeat this guardian in the side journey before remembering its fight.');
 const s=createSideJourney();s.practice=true;s.room=id;s.form=parent.form;s.forms=[...parent.forms];s.visited=[id];s.cleared=[];s.journal=[];s.checkpoint={room:id,x:230,y:SIDE_ROOMS[id].floor};s.player.maxHp=180;s.player.hp=180;s.player.x=270;s.player.y=SIDE_ROOMS[id].floor;s.player.invuln=.6;s.notice='GUARDIAN MEMORY · fixed 180 health · no equipment or rewards. Pause returns to your journey.';spawnRoom(s);return s;
}
export function sideDoorStatus(s,door){
 if(s.practice)return {open:false,reason:'Guardian memory · return through Pause'};
 if(door.path&&!hasSidePath(s,door.path))return {open:false,reason:'Remember '+SIDE_PATHS[door.path].name+' · '+SIDE_ROOMS[SIDE_PATHS[door.path].room].name};
 if(door.relic&&!hasSideRelic(s,door.relic)){const relic=SIDE_RELICS[door.relic];return {open:false,reason:relic.name+' · '+relic.place+' · '+WORLDS[relic.world].name};}
 if(door.secret&&!s.secrets.includes('feather'))return {open:false,reason:'Feather · Nacre’s Reliquary · return as Animal'};
if(door.secret&&!s.seals.includes('cinder'))return {open:false,reason:'The Cinder Regent’s seal opens Prism Night'};
if(door.key&&!s.keys.includes(door.key))return {open:false,reason:KEYS[door.key].name+' · '+KEYS[door.key].place};
 if(door.form&&s.form!==door.form)return {open:false,reason:'Become '+SIDE_NAMES[door.form]+' · Q vessels'};
 if(door.feat&&!s.cleared.includes(door.feat))return {open:false,reason:door.feat==='forge'?'Remember the Cantor · The Echo Forge':'Clear '+SIDE_ROOMS[door.feat].name+' first'};
 if(door.seal&&!s.seals.includes(door.seal))return {open:false,reason:'Guardian seal · '+WORLDS[door.seal].name};
 if(door.allSeals&&!WORLD_ORDER.slice(0,6).every(w=>s.seals.includes(w)))return {open:false,reason:'All six guardian seals'};
 const boss=s.enemies.find(e=>e.boss&&e.hp>0);if(boss)return {open:false,reason:sideEnemyName(boss.kind)+' holds the arena · checkpoint escape in Pause'};
 return {open:true,reason:'OPEN'};
}
export function enterSideRoom(s,id,from=s.room){
 if(s.practice)throw Error('Return through the guardian memory menu.');if(!SIDE_ROOMS[id])throw Error('Unknown side room.');s.echoRoom=null;s.echoFinished=false;s.pathPractice={};s.room=id;const r=SIDE_ROOMS[id],g=sideGeometry(id),door=g.doors.find(d=>d.to===from);
 const p=s.player;if(p.carry){const prop=s.props.find(v=>v.id===p.carry);if(prop){prop.carried=false;prop.y=SIDE_ROOMS[from]?.floor??620;}}if(p.grab){const e=s.enemies.find(v=>v.id===p.grab);if(e)e.state='ready';}p.grab=null;p.carry=null;p.lane=0;p.guard=false;p.hurt=0;p.dive=false;p.dash=0;p.rallyBoost=false;p.faultLanding=false;p.pounceLanding=false;p.x=door?clamp(door.x+(door.side==='west'?90:-90),50,r.width-50):270;p.y=door?.y??r.floor;p.vx=0;p.vy=0;p.grounded=true;p.attack=null;p.invuln=Math.max(p.invuln,.6);p.jumps=0;p.coyote=6;s.arrivalGrace=.6;s.previous={};spawnRoom(s);recordRoom(s);emit(s,'room',r.name+' · '+r.clue);
 if(r.safe){s.checkpoint={room:id,x:230,y:r.floor};p.hp=p.maxHp;emit(s,'checkpoint','Checkpoint remembered · health restored.',230,r.floor);if(!s.cleared.includes(id))s.cleared.push(id);}
}
export function sideEnemyName(kind){return WORLD_GUARDIANS[kind]?.name??({cantor:'The Cantor',warden:'The Warden',collector:'Collector',archon:'Archon',hound:'Hound',mirror:'Mirror construct'}[kind]??kind);}
export function sideInteract(s){
 if(s.phase!=='playing')return false;if(s.practice){emit(s,'hint','Guardian memory · Pause returns to your journey.');return false;}const p=s.player,g=sideGeometry(s.room),r=SIDE_ROOMS[s.room];
 const nearest=g.doors.toSorted((a,b)=>Math.hypot(p.x-a.x,p.y-a.y)-Math.hypot(p.x-b.x,p.y-b.y))[0];
 if(nearest&&Math.abs(p.y-nearest.y)<60&&Math.hypot(p.x-nearest.x,p.y-nearest.y)<100){if((s.arrivalGrace??0)>0){emit(s,'hint','Step away from the arrival glyph before crossing again.');return false;}const status=sideDoorStatus(s,nearest);if(!status.open){emit(s,'hint',status.reason);return false;}if(nearest.secret&&!s.secrets.includes('feather-path')){s.secrets.push('feather-path');p.maxHp+=20;p.hp=Math.min(p.maxHp,p.hp+20);s.journal.push({room:s.room,title:'Feather',text:'A feather from Nacre’s Reliquary opened a seam between the Mirror Nursery and Prism Night.'});emit(s,'secret','FEATHER PATH · the Mirror Nursery and Prism Night remember each other. +20 health capacity.');}enterSideRoom(s,nearest.to);return true;}
 const station=sideStations(s,r).find(v=>Math.hypot(p.x-v.x,p.y-v.y)<90);if(station){if(s.enemies.some(e=>e.hp>0)){emit(s,'hint','Clear the constructs before visiting a counter.');return false;}s.station=station.id;emit(s,'station',station.name);return true;}
 if(Math.hypot(p.x-g.checkpoint.x,p.y-g.checkpoint.y)<90){if(s.enemies.some(e=>e.hp>0)){emit(s,'hint','Clear this room to remember its glyph.');return false;}s.checkpoint={room:s.room,x:g.checkpoint.x,y:g.checkpoint.y};p.hp=p.maxHp;emit(s,'checkpoint','Checkpoint remembered · health restored.');return true;}
 emit(s,'hint',nearest&&Math.abs(p.x-nearest.x)<100&&Math.abs(p.y-nearest.y)>=60?'Climb to the door’s ledge before crossing.':'Move closer to a door or checkpoint glyph.');return false;
}
export function morphSide(s,form){if(s.phase!=='playing'||!s.forms.includes(form))throw Error('Clear the Mirror Nursery to remember all six vessels.');if(s.form===form)return;releaseHeld(s);s.form=form;s.player.attack=null;s.player.jumps=Math.max(s.player.jumps,1);s.player.drift=0;s.player.guard=false;s.player.faultLanding=false;emit(s,'morph',SIDE_NAMES[form]+' · '+SIDE_TRAITS[form].desc);}
function releaseHeld(s){const p=s.player;if(p.grab){const e=s.enemies.find(v=>v.id===p.grab);if(e){e.state='down';e.stagger=.4;e.vy=0;}}if(p.carry){const prop=s.props.find(v=>v.id===p.carry);if(prop){prop.carried=false;prop.y=p.y;}}p.grab=null;p.carry=null;}
export function sideDamage(s,amount,source=null){const p=s.player;if(s.phase!=='playing'||p.invuln>0||p.dash>0)return false;
 if(p.guard&&s.form==='human'&&hasSideImprint(s)&&p.guardAge<=.18){p.invuln=.3;emit(s,'counter','HELD ANSWER · the contact returns.');if(source?.hp>0)hitEnemy(s,source,25+sideDamageBonus(s),{type:'heavy',direction:p.facing});return false;}
 const reduction=sideArmor(s)*(sideBuff(s,'guard')?.88:1)*(p.guard&&s.form==='human'?.35:1)*(s.form==='rock'&&p.attack?.kind==='hk'?.75:1);amount=Math.max(1,Math.round(amount*reduction));p.hp=Math.max(0,p.hp-amount);p.invuln=1;p.flash=.18;p.hurt=.15;p.hurtVx=(source?.x<p.x?1:source?.x>p.x?-1:-p.facing)*145;releaseHeld(s);sideParticles(s,p.x,p.y-40,'#f0a77e',8,140);emit(s,'damage','',p.x,p.y-40,amount);if(p.hp===0){s.phase='fallen';s.falls++;p.vx=0;p.vy=0;const lost=Math.floor(s.wallet*.25);s.wallet-=lost;emit(s,'fall','The body falls. The spark remembers. '+(lost?lost+' unbanked coins fade.':'Remembered techniques remain.'));}return true;}
export function respawnSide(s){if(s.practice)throw Error('Use Retry guardian memory.');if(!['fallen','playing'].includes(s.phase))throw Error('This journey is complete.');const wasFallen=s.phase==='fallen';const cp=structuredClone(s.checkpoint);if(wasFallen){s.life++;s.build=freshSideBuild();s.lootLedger=s.lootLedger.filter(id=>!id.startsWith('enemy:echo:'));}s.phase='playing';enterSideRoom(s,cp.room,'');s.player.x=cp.x;s.player.y=cp.y;s.player.hp=s.player.maxHp;s.player.powerCooldown=0;s.player.invuln=1;s.previous={};emit(s,'checkpoint','The spark returns to its remembered glyph.'+(wasFallen?' Food, equipment, and borrowed techniques belong to the fallen body.':''));}
function hitEnemy(s,e,damage,impact={type:'light',direction:s.player.facing}){return hitSideEnemy(s,e,damage,impact,emit);}
function bolt(s,x,y,dx,dy,damage,enemy=false,guardian=false,speed=330,impact='light',lane=s.player.lane??0){const len=Math.hypot(dx,dy)||1,reach=enemy?1:(sideBuff(s,'reach')?1.15:1)*(1+(sideSet(s)?.range??0));s.bolts.push({x,y,px:x,py:y,vx:dx/len*speed*reach,vy:dy/len*speed*reach,damage,enemy,guardian,impact,lane,life:4.5,color:enemy?(guardian?'#f6be76':'#75e8ed'):SIDE_COLORS[s.form]});}
function attack(s,kind,input={}){const p=s.player;if(p.attackCooldown>0||p.carry||p.guard)return;
 if(p.grab){const e=s.enemies.find(v=>v.id===p.grab);if(e?.hp>0){hitEnemy(s,e,16+sideDamageBonus(s));p.attackCooldown=.35;if(!e.hp)p.grab=null;}return;}
 const heavy=kind==='heavy',launcher=heavy&&input.up&&!['spark','computer'].includes(s.form),dive=heavy&&input.down&&!p.grounded&&s.form==='animal'&&hasSideImprint(s),damage=Math.round(((heavy?30:20)+s.memories.length*2+s.seals.length*3+sideDamageBonus(s)+(s.form==='rock'?6:0))*(1+(sideSet(s)?.damage??0)));
 if(p.dash>0){if(!hasSideImprint(s)||!['spark','computer','animal'].includes(s.form))return;if(s.form==='spark'){for(const b of s.bolts)if(b.enemy&&Math.hypot(b.x-p.x,b.y-(p.y-35))<200){b.enemy=false;b.guardian=false;b.vx*=-1;b.vy*=-1;b.color=SIDE_COLORS.spark;b.damage=30;emit(s,'deflect');}}if(s.form==='computer')p.overclock=Math.max(p.overclock,1.5);}
 if(dive){p.dive=true;p.vy=750;p.pounceLanding=true;p.invuln=Math.max(p.invuln,.25);}
 p.attack={kind:launcher?'launcher':heavy?'hk':'lp',frame:0,total:heavy?29:21,hit:false,damage,impact:dive?'dive':launcher?'launcher':heavy?'heavy':'light'};p.attackCooldown=(heavy?.5:.36)/(p.overclock>0?2:1)/(sideBuff(s,'quick')?1.1:1)/(1+(sideSet(s)?.haste??0));emit(s,'strike');}
export function useSideService(s,id){return sideService(s,id,{room:SIDE_ROOMS[s.room],emit});}
export function sideEchoEncounter(s){if(s.practice)throw Error('Guardian memories have no encounter rewards.');const r=SIDE_ROOMS[s.room],cp=sideGeometry(s.room).checkpoint;if(s.phase!=='playing'||r.safe||r.boss||!s.cleared.includes(s.room)||s.enemies.some(e=>e.hp>0)||Math.hypot(s.player.x-cp.x,s.player.y-cp.y)>120)throw Error('Visit a cleared ordinary chamber’s glyph to remember its encounter.');releaseHeld(s);s.echoRoom=s.room;s.echoFinished=false;spawnRoom(s);emit(s,'room','Remembered encounter · coins pay once per construct in this life. No extra key, seal, or lasting memory.');}
export function sidePower(s,input={}){
 const p=s.player;if(s.phase!=='playing'||p.powerCooldown>0||p.carry)return false;releaseHeld(s);p.powerCooldown=VESSEL_POWERS[s.form].cooldown*(sideBuff(s,'power')?.9:1);const rank=s.memories.length*3+sideDamageBonus(s);
 if(s.form==='computer'){for(const angle of [-.22,0,.22])bolt(s,p.x,p.y-38,p.facing*Math.cos(angle),Math.sin(angle),32+rank,false,false,570);p.attackCooldown=0;p.overclock=4;}
 else{for(const e of s.enemies)if(e.hp>0&&Math.hypot(e.x-p.x,(e.y-p.y)*.5)<(s.form==='rock'?260:210)&&Math.abs((e.lane??0)-(p.lane??0))<60){hitEnemy(s,e,({spark:70,human:55,animal:75,tree:48,rock:100}[s.form])+rank,{type:'power',direction:Math.sign(e.x-p.x)||p.facing});if(s.form==='tree')e.root=2.3;}
 if(['spark','rock'].includes(s.form))s.bolts=s.bolts.filter(b=>!b.enemy||Math.hypot(b.x-p.x,b.y-(p.y-30))>270);
 if(s.form==='human'){p.hp=Math.min(p.maxHp,p.hp+18);p.invuln=1.3;if(hasSidePath(s)&&!p.grounded&&!p.rallyBoost){p.vy=-540;p.rallyBoost=true;emit(s,'hint','Rally ascent · the body rises once before landing.');}}if(s.form==='tree'){p.hp=Math.min(p.maxHp,p.hp+12);s.bridges=[{id:'root-step',x:clamp(p.x+p.facing*50,40,SIDE_ROOMS[s.room].width-160),y:p.y-95,w:160,h:16,oneWay:true,life:12}];if(hasSidePath(s))s.bridges.push({id:'root-step-high',x:clamp(p.x+p.facing*145,40,SIDE_ROOMS[s.room].width-160),y:p.y-190,w:160,h:16,oneWay:true,life:12});}
 if(s.form==='animal'){if(hasSidePath(s)&&!p.grounded&&p.jumps>=2)p.jumps=1;p.vx=p.facing*650;p.vy=-440;p.grounded=false;p.pounce=.38;p.pounceLanding=true;p.invuln=.45;}
 if(s.form==='rock'){p.invuln=4;if(hasSidePath(s)&&input.down&&!p.grounded){p.vy=780;p.faultLanding=true;}}}
 emit(s,'power',VESSEL_POWERS[s.form].name);rememberSidePath(s,emit,physicalCoins);return true;
}
function playerPhysics(s,input,dt){
 const p=s.player,r=SIDE_ROOMS[s.room],trait=SIDE_TRAITS[s.form],old={x:p.x,y:p.y,vy:p.vy,grounded:p.grounded},geometry=sideGeometry(s.room),platforms=[...geometry.platforms,...s.bridges];
 const pressed=key=>!!input[key]&&!s.previous[key];
 for(const k of ['invuln','dashCooldown','powerCooldown','attackCooldown','flash','dropThrough','overclock','pounce','hurt'])p[k]=Math.max(0,(p[k]??0)-dt);
 p.guard=!!input.guard&&s.form==='human'&&p.grounded&&!p.grab&&!p.carry&&p.dash===0;p.guardAge=p.guard?(p.guardAge??0)+dt:0;
 if(r.depthLane&&p.grounded&&Math.abs(p.y-r.floor)<3)p.lane=clamp((p.lane??0)+((input.down?1:0)-(input.up?1:0))*120*dt,-46,46);
 if(pressed('jump')&&input.down&&p.grounded){p.dropThrough=.22;p.y+=6;p.vy=150;p.grounded=false;p.jumpBuffer=0;p.coyote=0;}
p.coyote=p.grounded?6:Math.max(0,p.coyote-1);p.jumpBuffer=pressed('jump')&&!input.down?7:Math.max(0,p.jumpBuffer-1);
 if(p.jumpBuffer&&(p.coyote>0||s.form==='animal'&&p.jumps<2)&&!p.grab){p.vy=-trait.jump;p.grounded=false;p.coyote=0;p.jumps++;if(s.form==='animal'&&p.jumps===2)s.pathPractice.doubleJump=true;p.jumpBuffer=0;p.drift=0;emit(s,'jump');sideParticles(s,p.x,p.y,'#bcc9b0',5,70);}
 if(pressed('dash')&&p.dashCooldown===0){if(s.form==='computer'&&!p.grounded)s.pathPractice.airDash=true;p.dash=s.form==='computer'&&!p.grounded&&hasSidePath(s)?.28:.19;p.dashCooldown=1.2*(1-(sideSet(s)?.dash??0));p.invuln=Math.max(p.invuln,.22);emit(s,'dash');}
 if(p.dash>0){p.dash=Math.max(0,p.dash-dt);p.vx=p.facing*(s.form==='computer'?710:650);p.vy=0;}
 else{const axis=clamp(input.x??0,-1,1),target=axis*trait.speed*(1+(sideSet(s)?.speed??0))*(sideBuff(s,'haste')?1.08:1)*(p.guard?.35:p.carry?.72:p.grab?.55:1);if(axis)p.facing=Math.sign(axis);p.vx=p.pounce>0?p.facing*650:p.hurt>0?p.hurtVx:Math.abs(p.vx-target)<=2800*dt?target:p.vx+Math.sign(target-p.vx)*2800*dt;if(axis&&p.vx*axis<0)p.vx=target;const drift=s.form==='spark'&&input.jump&&p.vy>0&&p.drift<(hasSidePath(s)?1.1:.7);p.drift+=drift?dt:0;if(drift&&p.drift>=.15)s.pathPractice.drift=true;p.vy=Math.min(880,p.vy+1450*dt*(drift?.18:1));if(!input.jump&&p.vy<-250)p.vy+=1800*dt;}
 p.x=clamp(p.x+p.vx*dt,28,r.width-28);p.y+=p.vy*dt;p.walk+=Math.abs(p.vx)*dt/75;p.grounded=false;
 if(p.vy>=0)for(const platform of platforms){if(!(platform.oneWay&&p.dropThrough>0)&&p.x+19>platform.x&&p.x-19<platform.x+platform.w&&old.y<=platform.y+2&&p.y>=platform.y){p.y=platform.y;p.vy=0;p.grounded=true;p.jumps=0;p.drift=0;p.rallyBoost=false;if(s.form==='tree'&&String(platform.id).startsWith('root-step'))s.pathPractice.rootStep=true;break;}}
 if(p.grounded&&p.faultLanding){p.faultLanding=false;for(const e of s.enemies)if(e.hp>0&&Math.hypot(e.x-p.x,(e.y-p.y)*.5)<240)hitEnemy(s,e,50+sideDamageBonus(s),{type:'dive',direction:Math.sign(e.x-p.x)||p.facing});s.bolts=s.bolts.filter(b=>!b.enemy||Math.hypot(b.x-p.x,b.y-p.y)>260);sideParticles(s,p.x,p.y,SIDE_COLORS.rock,18,220);emit(s,'power','Fault descent · landing shockwave');}
 if(p.grounded&&!old.grounded&&old.vy>300){sideParticles(s,p.x,p.y,'#c5c0a1',s.form==='rock'?10:5,s.form==='rock'?180:90);emit(s,'landing');}
 if(p.grounded&&p.pounceLanding){p.pounceLanding=false;for(const e of s.enemies)if(e.hp>0&&Math.hypot(e.x-p.x,(e.y-p.y)*.5)<180&&Math.abs((e.lane??0)-p.lane)<60)hitEnemy(s,e,35+s.memories.length*3,{type:p.dive?'dive':'heavy',direction:Math.sign(e.x-p.x)||p.facing});p.dive=false;emit(s,'power','Pounce · landing strike');}
if(p.y>r.height+60){sideDamage(s,18);if(s.phase==='playing'){p.x=old.x<r.width*.6?Math.max(270,geometry.pits[0]?.x-70??270):r.width-220;p.y=r.floor;p.vy=0;p.invuln=1;}}
 if(pressed('grab'))sideGrab(s,r,emit,hitEnemy);
 if(p.grab){p.grabClock-=dt;if(p.grabClock<=0)releaseHeld(s);}
 if(input.attack)attack(s,'light',input);if(input.heavy)attack(s,'heavy',input);if(pressed('power'))sidePower(s,input);
 if(p.attack){const a=p.attack;a.frame+=1+(sideSet(s)?.haste??0);const heavy=a.kind!=='lp';if(a.frame>=(heavy?14:7)&&!a.hit){a.hit=true;if(['spark','computer'].includes(s.form)){const angle=input.down?.65:input.up?-.65:0;bolt(s,p.x+p.facing*30,p.y-35,p.facing,angle,a.damage,false,false,s.form==='computer'?610:500,a.impact);if(s.form==='computer'&&heavy&&hasSideImprint(s))for(const offset of [-.22,.22])bolt(s,p.x+p.facing*30,p.y-35,p.facing,angle+offset,a.damage*.7,false,false,610,'heavy');}
 else{const range=(s.form==='tree'&&hasSideImprint(s)?240:heavy?175:150)*(1+(sideSet(s)?.range??0));for(const e of s.enemies)if(e.hp>0&&(e.x-p.x)*p.facing>-25&&(e.x-p.x)*p.facing<range&&Math.abs(e.y-p.y)<(e.boss?145:95)&&Math.abs((e.lane??0)-p.lane)<42){hitEnemy(s,e,a.damage,{type:a.impact,direction:p.facing});if(s.form==='tree'&&hasSideImprint(s)&&e.hp>0)e.root=1.1;}}
 for(const prop of s.props)if(prop.hp>0&&!prop.carried&&(prop.x-p.x)*p.facing>-20&&(prop.x-p.x)*p.facing<(heavy?180:145)&&Math.abs(prop.y-p.y)<85)hitSideProp(s,prop,a.damage,emit);}
 if(a.frame>=a.total)p.attack=null;}
 if(pressed('interact'))sideInteract(s);
}
function enemiesTick(s,dt){
 const p=s.player,r=SIDE_ROOMS[s.room],rank=WORLD_ORDER.indexOf(r.world);
 for(const e of s.enemies){const reacting=tickSideReaction(s,e,r,dt,emit,hitEnemy);if(e.hp<=0||reacting)continue;e.facing=p.x>=e.x?1:-1;e.clock-=dt;
 if(r.depthLane&&!e.root)e.lane=clamp(e.lane+clamp(p.lane-e.lane,-1,1)*40*dt,-46,46);
 if(e.boss){tickSideGuardian(s,e,r,rank,dt,{bolt,emit});
 }else if(e.kind==='archon'){if(e.windup>0){e.windup-=dt;if(e.windup<=0){bolt(s,e.x,e.y-42,p.x-e.x,p.y-35-(e.y-42),9+rank,true,false,310,'light',e.lane);if(r.world==='cinder')bolt(s,e.x,e.y-60,p.x-e.x,p.y-30-(e.y-60),8+rank,true,false,280,'light',e.lane);e.clock=2.6;emit(s,'volley');}}else if(e.clock<=0&&Math.abs(e.x-p.x)<800)e.windup=.7;}
 else if(!e.root){const speed=e.kind==='hound'?110+rank*5:e.kind==='mirror'?85:65+rank*5;
  if(e.kind==='collector'&&e.clock<=0&&Math.abs(e.x-p.x)<190){if(e.windup<=0)e.windup=.4;e.windup-=dt;if(e.windup<=dt){e.x=clamp(e.x+e.facing*(e.captain?135:95),310,r.width-180);e.clock=2.1;e.windup=0;sideParticles(s,e.x,e.y,'#d0b197',5,120);}else e.clock=0;}
  else e.x=clamp(e.x+e.facing*speed*dt,310,r.width-180);
  e.y=r.floor-(e.kind==='mirror'?75+Math.sin(s.time*2+e.x)*35:e.kind==='hound'?Math.max(0,Math.sin(s.time*2.2+e.id.length)*55):0);
 }
 if(Math.abs(e.x-p.x)<(e.boss?75:48)&&Math.abs(e.y-p.y)<(e.boss?115:70)&&Math.abs((e.lane??0)-p.lane)<38)sideDamage(s,(e.boss?15:e.captain?14:9)+rank,e);
 }
 s.marks=s.marks.filter(m=>!m.source||s.enemies.some(e=>e.id===m.source&&e.hp>0));for(const mark of s.marks){mark.life-=dt;if(mark.life<=.2&&!mark.trigger){mark.trigger=true;if(Math.abs(p.x-mark.x)<mark.r&&Math.abs(p.y-mark.y)<70)sideDamage(s,mark.damage);emit(s,'impact','',mark.x,mark.y);}}s.marks=s.marks.filter(m=>m.life>0);
 s.bolts=s.bolts.filter(b=>!b.source||s.enemies.some(e=>e.id===b.source&&e.hp>0));for(const b of s.bolts){b.px=b.x;b.py=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(b.enemy){if(Math.abs(b.x-p.x)<25&&b.y>p.y-65&&b.y<p.y+10&&Math.abs((b.lane??0)-p.lane)<40){sideDamage(s,b.damage,{x:b.x,hp:0});b.life=0;emit(s,'impact','',b.x,b.y);}}else{for(const e of s.enemies)if(e.hp>0&&Math.abs(b.x-e.x)<(e.boss?65:32)&&b.y>e.y-(e.boss?170:95)&&b.y<e.y+12&&Math.abs((b.lane??0)-(e.lane??0))<42){hitEnemy(s,e,b.damage,{type:b.impact??'light',direction:Math.sign(b.vx)});b.life=0;break;}
 if(b.life>0)for(const prop of s.props)if(prop.hp>0&&!prop.carried&&Math.abs(b.x-prop.x)<24&&b.y>prop.y-54&&b.y<prop.y+4){hitSideProp(s,prop,b.damage,emit);b.life=0;break;}}}
 s.bolts=s.bolts.filter(b=>b.life>0&&b.x>0&&b.x<r.width&&b.y>0&&b.y<r.height);
}
function pickups(s){
 const r=SIDE_ROOMS[s.room],p=s.player,g=sideGeometry(s.room);
 if(s.practice){if(s.enemies.every(e=>e.hp<=0)){s.phase='complete';s.bolts=[];s.marks=[];emit(s,'complete','Guardian memory complete · return to your journey.');}return;}
 if(s.echoRoom===s.room&&!s.echoFinished&&s.enemies.every(e=>e.hp<=0)){s.echoFinished=true;emit(s,'clear','Remembered encounter cleared · collect the coins. The glyph is quiet.');}
 if(s.enemies.every(e=>e.hp<=0)&&!s.cleared.includes(s.room)){s.cleared.push(s.room);if(r.boss)s.memoryPoints++;if(r.seal&&!s.seals.includes(r.seal)){s.seals.push(r.seal);p.maxHp+=8;p.hp=Math.min(p.maxHp,p.hp+35);emit(s,'memory','Guardian seal · +8 health capacity · a lasting memory for an imprint.');}emit(s,'clear',r.boss?'The guardian’s glyph opens.':'Room cleared · collect the coins; return to the glowing glyph to heal and save.');
 if(r.resonance){s.forms=[...SIDE_FORMS];emit(s,'resonance','VESSEL RESONANCE · Q borrows another body.');}
 if(r.final){s.phase='complete';emit(s,'complete','The body falls. The spark remembers.');}}
 if(r.key&&s.cleared.includes(s.room)&&!s.keys.includes(r.key)&&Math.hypot(p.x-(r.width-300),p.y-r.floor)<65){s.keys.push(r.key);emit(s,'key',KEYS[r.key].name+' · remembered for this side journey.',p.x,p.y-55);}
 if(!r.safe&&!r.boss&&!s.memories.includes(s.room)){const pos={x:850,y:r.floor-185};const platform=g.platforms.filter(v=>v.oneWay).toSorted((a,b)=>Math.abs(a.x+a.w/2-850)-Math.abs(b.x+b.w/2-850))[0];if(platform){pos.x=platform.x+platform.w/2;pos.y=platform.y;}
 if(Math.hypot(p.x-pos.x,p.y-pos.y)<55){s.memories.push(s.room);s.memoryPoints++;p.maxHp+=6;p.hp=Math.min(p.maxHp,p.hp+10);emit(s,'memory','Memory fragment · +6 health capacity · +1 lasting memory for an imprint.',pos.x,pos.y-35);}}
 if(r.secret&&!s.secrets.includes(r.secret)&&Math.hypot(p.x-g.secret.x,p.y-g.secret.y)<55){s.secrets.push(r.secret);if(!s.relics.includes('ivory-feather'))s.relics.push('ivory-feather');emit(s,'secret','FEATHER · a night seam in Prism Night remembers this shape.');s.journal.push({room:s.room,title:'Feather',text:'Carry this feather beyond the Cinder Clockworks. Look above the western steps of the Unlit Vestibule.'});}
}
export function stepSide(s,input={},dt=1/60){
 if(s.phase!=='playing'||s.station)return;s.time+=dt;tickSideParticles(s,dt);s.arrivalGrace=Math.max(0,(s.arrivalGrace??0)-dt);for(const id of Object.keys(s.build.buffs))s.build.buffs[id]=Math.max(0,s.build.buffs[id]-dt);
 if(s.hitstop>0){s.hitstop=Math.max(0,s.hitstop-dt);s.buffer??={};for(const id of ['jump','dash','power','grab','interact','attack','heavy'])if(input[id]&&!s.previous[id])s.buffer[id]=true;return;}
 const original=input;if(s.buffer){input={...input,...s.buffer};s.buffer=null;}const before=s.room;playerPhysics(s,input,dt);if(before===s.room&&s.phase==='playing'&&!s.station){enemiesTick(s,dt);tickSideProps(s,SIDE_ROOMS[s.room],dt,emit,hitEnemy);tickSideCoins(s,SIDE_ROOMS[s.room],dt,emit);if(s.phase==='playing'){s.player.hp=Math.min(s.player.maxHp,s.player.hp+(sideSet(s)?.regen??0)*dt);pickups(s);}}for(const bridge of s.bridges)bridge.life-=dt;s.bridges=s.bridges.filter(b=>b.life>0);s.previous={jump:!!original.jump,dash:!!original.dash,power:!!original.power,interact:!!original.interact,grab:!!original.grab,attack:!!original.attack,heavy:!!original.heavy};
}
export function observeSide(s){if(!s)return null;const g=sideGeometry(s.room),r=SIDE_ROOMS[s.room];return structuredClone({mode:'sideways',practice:!!s.practice,phase:s.phase,room:s.room,name:r.name,world:r.world,form:s.form,forms:s.forms,time:s.time,player:s.player,checkpoint:s.checkpoint,keys:s.keys,seals:s.seals,visited:s.visited,cleared:s.cleared,memories:s.memories,secrets:s.secrets,paths:s.paths,relics:s.relics,pathPractice:s.pathPractice,pathObjective:sidePathObjective(s),falls:s.falls,damage:s.damage,enemies:s.enemies.filter(e=>e.hp>0),bolts:s.bolts,platforms:g.platforms,doors:g.doors.map(d=>({...d,...sideDoorStatus(s,d)})),notice:s.notice,journal:s.journal,wallet:s.wallet,recovered:s.recovered,memoryPoints:s.memoryPoints,imprints:s.imprints,build:s.build,coins:s.coins,props:s.props,combo:s.combo,bestCombo:s.bestCombo,life:s.life,depthLane:!!r.depthLane,faction:SIDE_FACTIONS[r.world],station:s.station,stations:sideStations(s,r),pendingBank:s.pendingBank,echoRoom:s.echoRoom,echoFinished:s.echoFinished});}
export function sideSave(s){if(s.practice)throw Error('Guardian memory uses its own save slot.');return {schema:2,id:s.id,room:s.room,form:s.form,phase:s.phase,time:s.time,keys:[...s.keys],seals:[...s.seals],forms:[...s.forms],visited:[...s.visited],cleared:[...s.cleared],memories:[...s.memories],secrets:[...s.secrets],paths:[...s.paths],relics:[...s.relics],opened:[...s.opened],journal:structuredClone(s.journal),falls:s.falls,damage:s.damage,checkpoint:structuredClone(s.checkpoint),player:structuredClone(s.player),enemies:structuredClone(s.enemies),wallet:s.wallet,collected:s.collected,recovered:s.recovered,bankSerial:s.bankSerial,pendingBank:structuredClone(s.pendingBank),memoryPoints:s.memoryPoints,imprints:[...s.imprints],build:structuredClone(s.build),loot:structuredClone(s.loot),lootLedger:[...s.lootLedger],bestCombo:s.bestCombo,life:s.life,echoRoom:s.echoRoom,echoFinished:s.echoFinished};}
export function restoreSide(raw){
 if(!raw||![1,2].includes(raw.schema)||!SIDE_ROOMS[raw.room]||!SIDE_FORMS.includes(raw.form)||!['playing','fallen','complete'].includes(raw.phase))return null;
 const list=(v,allow,max)=>Array.isArray(v)&&v.length<=max&&new Set(v).size===v.length&&v.every(x=>allow.includes(x));
 for(const key of ['visited','cleared','memories'])if(!list(raw[key],Object.keys(SIDE_ROOMS),Object.keys(SIDE_ROOMS).length))return null;
 if(!list(raw.keys,Object.keys(KEYS),8)||!list(raw.seals,WORLD_ORDER.slice(0,6),6)||!list(raw.forms,SIDE_FORMS,6)||!raw.forms.includes(raw.form)||!list(raw.secrets,['feather','feather-path',...Object.values(SIDE_CACHE_ROOMS).map(r=>r.secret)],2+Object.keys(SIDE_CACHE_ROOMS).length))return null;
 if(!finite(raw.damage,0,1e12)||!Number.isInteger(raw.falls)||raw.falls<0||raw.falls>1e6||raw.cleared.some(id=>!raw.visited.includes(id))||raw.memories.some(id=>!raw.visited.includes(id))||raw.secrets.includes('feather-path')&&!raw.secrets.includes('feather'))return null;
const p=raw.player,cp=raw.checkpoint;if(!p||!cp||!SIDE_ROOMS[cp.room]||!finite(p.hp,0,500)||!finite(p.maxHp,100,500)||p.hp>p.maxHp||!finite(p.x,0,SIDE_ROOMS[raw.room].width)||!finite(p.y,-100,1000)||!finite(cp.x,0,SIDE_ROOMS[cp.room].width)||!finite(cp.y,0,SIDE_ROOMS[cp.room].height)||!finite(raw.time,0,1e9))return null;
 if(raw.keys.some(k=>!raw.cleared.includes(Object.keys(SIDE_ROOMS).find(id=>SIDE_ROOMS[id].key===k))))return null;
 if(raw.seals.some(k=>!raw.cleared.includes(Object.keys(SIDE_ROOMS).find(id=>SIDE_ROOMS[id].seal===k))))return null;
 if(raw.forms.length>1&&!raw.cleared.includes('nursery')||raw.phase==='complete'&&!raw.cleared.includes('origin-heart'))return null;
 if(!list(raw.paths??[],SIDE_FORMS,6)||!list(raw.relics??[],Object.keys(SIDE_RELICS),Object.keys(SIDE_RELICS).length)||(raw.paths??[]).some(form=>!raw.forms.includes(form)||!raw.cleared.includes(SIDE_PATHS[form].room)))return null;
 if((raw.relics??[]).some(id=>!validSideRelic(raw,id)))return null;
 if(Object.entries(SIDE_CACHE_ROOMS).some(([id,c])=>raw.secrets.includes(c.secret)&&(!raw.cleared.includes(id)||c.relic&&!hasSideRelic(raw,c.relic)||c.path&&!(raw.paths??[]).includes(c.path)||c.allSeals&&raw.seals.length!==6||c.foundRelic&&!(raw.relics??[]).includes(c.foundRelic))))return null;
 const s=createSideJourney();s.paths=[...(raw.paths??[])];s.relics=[...(raw.relics??[])];if(raw.secrets.includes('feather')&&!s.relics.includes('ivory-feather'))s.relics.unshift('ivory-feather');for(const key of ['room','form','phase','time','keys','seals','forms','visited','cleared','memories','secrets','falls','damage','checkpoint'])s[key]=structuredClone(raw[key]);s.opened=[];s.journal=s.visited.map(id=>({room:id,title:SIDE_ROOMS[id].name,text:SIDE_ROOMS[id].clue}));
 if(raw.schema===1){s.memoryPoints=s.memories.length+s.cleared.filter(id=>SIDE_ROOMS[id].boss).length;s.notice='Your side journey remembers its new physical form.';}
 else{
  if(typeof raw.id!=='string'||!/^[a-z0-9-]{8,45}$/.test(raw.id)||!list(raw.imprints,Object.values(SIDE_IMPRINTS).map(a=>a.id),6))return null;
  const memoryLimit=Object.keys(SIDE_ROOMS).length+Object.values(SIDE_ROOMS).filter(r=>r.boss).length+SIDE_FORMS.length+Object.keys(SIDE_CACHE_ROOMS).length;
  for(const key of ['wallet','collected','recovered','bankSerial','memoryPoints','bestCombo','life'])if(!Number.isSafeInteger(raw[key])||raw[key]<0||raw[key]>(key==='memoryPoints'?memoryLimit:1e9))return null;
  if(!Array.isArray(raw.lootLedger)||raw.lootLedger.length>256||new Set(raw.lootLedger).size!==raw.lootLedger.length||raw.lootLedger.some(id=>typeof id!=='string'||id.length>90))return null;
  if(raw.pendingBank&&(raw.pendingBank.id!=='side:'+raw.id+':'+raw.bankSerial||!Number.isSafeInteger(raw.pendingBank.amount)||raw.pendingBank.amount<1||raw.pendingBank.amount>1e9))return null;
  if(raw.echoRoom&&(raw.echoRoom!==raw.room||!raw.cleared.includes(raw.echoRoom)||SIDE_ROOMS[raw.echoRoom].safe||SIDE_ROOMS[raw.echoRoom].boss))return null;
  s.echoRoom=raw.echoRoom??null;s.echoFinished=!!raw.echoFinished;
  if(!raw.loot||typeof raw.loot!=='object'||Array.isArray(raw.loot)||Object.keys(raw.loot).some(id=>!SIDE_ROOMS[id]))return null;
  for(const [id,l]of Object.entries(raw.loot)){
   const r=SIDE_ROOMS[id];if(!l||!Array.isArray(l.coins)||l.coins.length>48||!Array.isArray(l.props)||l.props.length>2)return null;
   const coins=[];for(const c of l.coins){if(!c||typeof c.id!=='string'||c.id.length>95||(!Number.isSafeInteger(c.value)||c.value<1||c.value>1e9)||!finite(c.x,0,r.width)||!finite(c.y,-100,r.height)||!finite(c.vx,-1500,1500)||!finite(c.vy,-1500,1500))return null;coins.push({...c,age:finite(c.age,0,1e9)?c.age:1,bounces:3});}
   if(new Set(coins.map(c=>c.id)).size!==coins.length)return null;
   const templates=authoredProps({room:id},r),props=[];for(const obj of l.props){const v=templates.find(t=>t.id===obj?.id);if(!v||!finite(obj.hp,0,v.hp)||!finite(obj.x,0,r.width))return null;props.push({...v,x:obj.x,y:r.floor,hp:obj.hp,carried:false,thrown:false});}s.loot[id]={coins,props};
  }
  s.id=raw.id;for(const key of ['wallet','collected','recovered','bankSerial','memoryPoints','bestCombo','life','pendingBank','imprints','lootLedger'])s[key]=structuredClone(raw[key]??null);s.build=cleanSideBuild(raw.build);if(['weapon','armor'].some(slot=>SIDE_EQUIPMENT[s.build[slot]]?.requires&&!s.secrets.includes(SIDE_EQUIPMENT[s.build[slot]].requires)))return null;
 }
 s.player={...s.player,...p,facing:p.facing===-1?-1:1,lane:SIDE_ROOMS[s.room].depthLane&&finite(p.lane,-46,46)?p.lane:0,powerCooldown:finite(p.powerCooldown,0,12)?p.powerCooldown:0,attackCooldown:0,dashCooldown:0,flash:0,dropThrough:0,pounce:0,pounceLanding:false,overclock:0,jumps:0,drift:0,vx:0,vy:0,attack:null,dash:0,invuln:1,grounded:false,coyote:0,jumpBuffer:0,walk:0,grab:null,carry:null,guard:false,guardAge:0,hurt:0,dive:false,rallyBoost:false,faultLanding:false};spawnRoom(s);
 if(Array.isArray(raw.enemies)&&raw.enemies.length<=8)for(const e of s.enemies){const found=raw.enemies.find(v=>v?.id===e.id);if(found&&finite(found.hp,0,e.maxHp)&&finite(found.x,250,SIDE_ROOMS[s.room].width)&&finite(found.y,0,820)){e.hp=found.hp;e.x=found.x;e.y=found.y;if(e.captain&&finite(found.shell,0,24))e.shell=found.shell;}}
 for(const form of s.paths)s.journal.push({room:SIDE_PATHS[form].room,title:SIDE_PATHS[form].name,text:SIDE_PATHS[form].rule});for(const id of s.relics)s.journal.push({room:SIDE_RELICS[id].room,title:SIDE_RELICS[id].name,text:'Opens '+SIDE_RELICS[id].opens+'.'});for(const [id,c]of Object.entries(SIDE_CACHE_ROOMS))if(s.secrets.includes(c.secret))s.journal.push({room:id,title:c.name,text:c.text});
 if(s.secrets.includes('feather'))s.journal.push({room:'reliquary',title:'Feather',text:'A feather from Nacre’s Reliquary answers the seam above the western steps in Prism Night.'});s.arrivalGrace=.6;s.notice='Your side journey returns.';return s;
}
export function loadSide(storage){try{return restoreSide(JSON.parse(storage.getItem(SIDE_KEY)??'null'));}catch{return null;}}
export function saveSide(storage,s){if(s.practice)throw Error('Guardian memory uses its own save slot.');storage.setItem(SIDE_KEY,JSON.stringify(sideSave(s)));}
