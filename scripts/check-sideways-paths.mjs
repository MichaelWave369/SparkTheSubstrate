import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createSideJourney,SIDE_KEY,SIDE_ROOMS,sideSave,restoreSide,morphSide,sideGeometry,useSideService,observeSide} from '../public/sideways-engine.js';
import {SIDE_PATHS,SIDE_CACHE_ROOMS} from '../public/sideways-paths.js';
import {sideSet} from '../public/sideways-build.js';
import {clearRoom,cross,walkTo,frames,climbFeather} from '../tests/sideways-path.mjs';
const s=createSideJourney(),history=[];
function reload(){const loaded=restoreSide(sideSave(s));assert.ok(loaded,'save failed in '+s.room);Object.assign(s,loaded);frames(s,{},1);}
function heal(){walkTo(s,sideGeometry(s.room).checkpoint.x);frames(s,{});frames(s,{interact:true});assert.equal(s.player.hp,s.player.maxHp,'checkpoint in '+s.room);frames(s,{});}
function visit(to){cross(s,to);clearRoom(s);const r=SIDE_ROOMS[to];if(r.key){walkTo(s,r.width-300);assert.ok(s.keys.includes(r.key),'key in '+to);}if(!r.final)heal();reload();history.push(to);console.log(to+' · '+Math.ceil(s.player.hp)+' HP · '+s.cleared.length+' rooms');}
function floor(){frames(s,{});for(let i=0;i<180;i++){if(s.player.grounded&&Math.abs(s.player.y-SIDE_ROOMS[s.room].floor)<2)return;frames(s,{down:true,jump:i%20===0});}assert.fail('did not reach the floor at '+s.player.x+','+s.player.y);}
function ready(){while(s.player.powerCooldown>0)frames(s,{});frames(s,{});}
function land(x,y,{double=false}={}){frames(s,{});let landed=false;for(let i=0;i<140;i++){const dx=x-s.player.x;frames(s,{x:Math.abs(dx)<4?0:Math.sign(dx),jump:double?(i<30||i>=31&&i<67):i<43});if(s.player.grounded&&Math.abs(s.player.y-y)<2){landed=true;break;}}assert.ok(landed,'could not land at '+x+','+y+' in '+s.room+' from '+s.player.x+','+s.player.y);}
function power(input={}){ready();frames(s,{...input,power:true});frames(s,{});}
function learn(form){
 const trial=SIDE_PATHS[form];assert.equal(s.room,trial.room);walkTo(s,trial.x);floor();morphSide(s,form);ready();
 if(form==='spark'){frames(s,{jump:true},75);floor();assert.ok(s.pathPractice.drift);}
 if(form==='computer'){frames(s,{jump:true},10);frames(s,{dash:true},18);frames(s,{},55);walkTo(s,trial.x);floor();assert.ok(s.pathPractice.airDash);}
 if(form==='tree'){walkTo(s,1400);power();land(1510,525);assert.ok(s.pathPractice.rootStep);floor();walkTo(s,trial.x);}
 if(form==='animal'){land(trial.x,trial.y,{double:true});assert.ok(s.pathPractice.doubleJump);}
 if(form==='human'){walkTo(s,1360);land(trial.x,trial.y);frames(s,{guard:true},2);}
 ready();frames(s,{power:true,guard:form==='human'});frames(s,{});assert.ok(s.paths.includes(form),'path not remembered: '+form+' · '+s.notice+' at '+s.player.x+','+s.player.y);assert.ok(s.journal.some(j=>j.title===trial.name));
 if(trial.relic)assert.ok(s.relics.includes(trial.relic));floor();heal();reload();assert.ok(s.paths.includes(form));
 console.log('PATH · '+trial.name+(trial.relic?' · '+trial.relic:''));
}
function cache(id){visit(id);const c=SIDE_CACHE_ROOMS[id];morphSide(s,c.form);walkTo(s,c.x);floor();ready();if(id==='night-door'){walkTo(s,1380);land(c.x,c.y,{double:true});}if(id==='origin-nameless'){walkTo(s,1350);land(c.x,c.y);}if(id==='night-concert'){walkTo(s,1370);power();assert.equal(s.bridges.length,2);land(1490,525);land(1540,430);}power();assert.ok(s.secrets.includes(c.secret),'secret '+id+' · '+s.notice);floor();walkTo(s,c.x);frames(s,{},220);heal();reload();assert.ok(s.secrets.includes(c.secret));console.log('SECRET · '+c.name);}
function shop(weapon,armor,name){walkTo(s,560);frames(s,{});frames(s,{interact:true});assert.equal(s.station,'merchant');useSideService(s,weapon);useSideService(s,armor);assert.equal(sideSet(s).name,name);useSideService(s,'enhance');assert.equal(s.build.enhance,1);s.station=null;reload();assert.equal(sideSet(s).name,name);console.log('SET · '+name+' · '+s.wallet+' coins remain');}

for(const id of ['glass','machine','cistern','forge','cistern','reliquary','nursery'])visit(id);
visit('conduit');learn('spark');visit('nursery');visit('reliquary');climbFeather(s);visit('nursery');
for(const id of ['archive','belfry','eye','tide-harbor'])visit(id);
visit('tide-lantern');learn('computer');visit('tide-harbor');visit('tide-archive');visit('tide-harbor');visit('tide-throne');visit('grove-rest');
visit('grove-canopy');learn('tree');visit('grove-rest');visit('grove-well');visit('grove-rest');visit('grove-heart');visit('cinder-rest');
visit('cinder-ashlift');learn('rock');visit('cinder-rest');cache('cinder-minute');visit('cinder-rest');shop('tideblade','coralmail','Tidebound');visit('cinder-fuel');visit('cinder-rest');visit('cinder-throne');visit('night-rest');
cross(s,'nursery');cross(s,'night-rest');assert.ok(s.secrets.includes('feather-path'));
visit('night-attic');learn('animal');visit('night-rest');cache('night-door');visit('night-rest');shop('nightfangs','veilgarb','Night Hunter');cache('night-concert');visit('night-rest');shop('thornstaff','grovemantle','Living Grove');visit('night-library');visit('night-rest');visit('night-nest');visit('orbit-rest');
visit('orbit-garden');learn('human');visit('orbit-rest');visit('orbit-relay');visit('orbit-rest');
// Return through the real doors, rather than teleporting to the last relic path.
for(const id of ['night-nest','night-rest','cinder-throne','cinder-rest','grove-heart','grove-rest'])visit(id);
cache('grove-bell');visit('grove-rest');shop('cindermaul','furnaceplate','Cinder Crown');
for(const id of ['grove-heart','cinder-rest','cinder-throne','night-rest','night-nest','orbit-rest','orbit-throne','origin-seam'])visit(id);
cache('origin-nameless');assert.ok(s.relics.includes('unmade-thread'));visit('origin-seam');visit('orbit-throne');visit('orbit-rest');shop('firstlight','dawnshell','Before the Law');cache('orbit-window');visit('orbit-rest');shop('orbitprism','astralaegis','Pale Horizon');visit('orbit-throne');visit('origin-seam');
morphSide(s,'human');cross(s,'origin-heart');clearRoom(s);assert.equal(s.phase,'complete');assert.equal(s.cleared.length,39);assert.equal(s.paths.length,6);assert.equal(s.relics.length,5);assert.equal(s.seals.length,6);assert.equal(s.keys.length,7);assert.ok(restoreSide(sideSave(s)));assert.equal(s.falls,0);
const output=process.argv[2];if(output)fs.writeFileSync(output,JSON.stringify({save:sideSave(s),observe:observeSide(s),history},null,2));
console.log('Sideways expansion passed: all 39 rooms, six practiced vessel paths, five relics, six equipment secrets, all six matched/enhanced sets, ordinary health, no falls, real jumps/powers/gates/coin purchases, and reloads between visits. '+SIDE_KEY+' unchanged.');
