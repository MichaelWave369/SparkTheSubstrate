// Optional Sideways branches borrow rooms and relics already in the Descent.
// They never write campaign keys, seals, essence, mastery or Archive tokens.
import {ROUTE_RELICS} from './world-expansion.js?v=0.17.0';
export const SIDE_PATHS={
 spark:{room:'conduit',name:'Lumen drift',rule:'Hold Jump while falling to drift for 1.1 seconds.',trial:'Drift while falling for a moment, then use Lumen pulse at the far glyph.',practice:'drift',x:1530,y:620,color:'#e9cf91'},
 computer:{room:'tide-lantern',name:'Prism carry',rule:'Air dashes last longer, carrying the prism across wider gaps.',trial:'Dash in the air, then use Overclock at the lantern glyph.',practice:'airDash',x:1530,y:620,color:'#87dbe7',relic:'salt-hourglass'},
 tree:{room:'grove-canopy',name:'Root stair',rule:'Root hold grows two temporary steps instead of one.',trial:'Land on a step grown by Root hold, then use your power at the far root glyph.',practice:'rootStep',x:1530,y:620,color:'#a9d898'},
 rock:{room:'cinder-ashlift',name:'Fault descent',rule:'Down + Power in the air plunges into a landing shockwave.',trial:'Use Fault guard at the cracked floor glyph.',x:1530,y:620,color:'#dab399',relic:'ember-wing'},
 animal:{room:'night-attic',name:'Feral bound',rule:'Pounce after a second jump restores one air jump.',trial:'Make a second air jump, then Pounce at the high glyph.',practice:'doubleJump',x:1430,y:310,color:'#c8bde5'},
 human:{room:'orbit-garden',name:'Rally ascent',rule:'Rally in the air gives one upward boost before landing.',trial:'Hold Guard and use Rally at the garden glyph.',practice:'guard',x:1500,y:500,color:'#cbd3e8',relic:'star-seed'}
};
export const SIDE_PATH_BY_ROOM=Object.fromEntries(Object.entries(SIDE_PATHS).map(([form,p])=>[p.room,{form,...p}]));
export const SIDE_RELICS=Object.fromEntries(['ivory-feather','salt-hourglass','ember-wing','star-seed','unmade-thread'].map(id=>[id,ROUTE_RELICS[id]]));
export const SIDE_CACHE_ROOMS={
 'cinder-minute':{secret:'sleeping-minute',relic:'salt-hourglass',form:'human',name:'One More Minute',text:'The salt hour settles inside the clock. Even a furnace can remember a rest.',set:'tide',x:1510,y:620},
 'night-concert':{secret:'quiet-concert',relic:'ember-wing',form:'tree',name:'The Unplayed Concert',text:'A wing carries the silent score. The roots remember a path between worlds.',set:'grove',x:1510,y:430},
 'grove-bell':{secret:'ninth-bell',relic:'star-seed',form:'rock',name:'The Ninth Bell',text:'The seed of a distant star gives the missing bell its weight.',set:'cinder',x:1510,y:620},
 'night-door':{secret:'behind-sleep',relic:'ivory-feather',path:'animal',form:'animal',name:'The Door Behind Sleep',text:'The feather turns without a lock. A remembered bound carries the spark through the sleeping door.',set:'night',x:1500,y:430},
 'origin-nameless':{secret:'nameless-thread',allSeals:true,path:'human',form:'human',name:'The Room Without a Name',text:'A thread remains where the pattern leaves no name. Carry it back to the Outside Window in Pale Orbit.',set:'dawn',foundRelic:'unmade-thread',x:1510,y:500},
 'orbit-window':{secret:'outside-window',relic:'unmade-thread',path:'spark',form:'spark',name:'The Sky Beyond the Sky',text:'Beyond the window, one light keeps its own time. You are here. Keep going.',set:'orbit',x:1500,y:620}
};
// Nacre's old feather contact did not require clearing its room. Preserve it.
export const hasSideRelic=(s,id)=>(s.relics??[]).includes(id)||id==='ivory-feather'&&s.secrets.includes('feather');
export function validSideRelic(raw,id){if(id==='ivory-feather')return raw.secrets.includes('feather');if(id==='unmade-thread')return raw.secrets.includes('nameless-thread')&&raw.cleared.includes('origin-nameless')&&(raw.paths??[]).includes('human');return Object.entries(SIDE_PATHS).some(([form,p])=>p.relic===id&&(raw.paths??[]).includes(form));}
export const SIDE_BRANCH_ROOMS={
 conduit:{world:'stratum',name:'The Unbound Conduit',coord:[5,-2],width:1900,layout:'drift-path',enemies:['archon','collector'],clue:'Spark follows the suspended lumen road. Drift while falling, then pulse the far glyph to remember Lumen drift.'},
 'tide-lantern':{world:'tideglass',name:'The Lantern Grave',coord:[10,-1],width:1900,layout:'prism-path',enemies:['archon','hound'],clue:'Computer crosses the tide in an air dash. Overclock the lantern after the guards fall. Its Salt Hourglass opens the Unburned Minute in Cinder Clockworks.'},
 'grove-canopy':{world:'verdant',name:'The Unwritten Canopy',coord:[10,1],width:1900,layout:'root-path',enemies:['collector','hound'],clue:'Tree grows a step with Root hold. Land on it, then wake the far glyph to remember Root stair. Pale Orbit holds the seed for the grove’s missing bell.'},
 'cinder-ashlift':{world:'cinder',name:'The Ash Lift',coord:[10,3],width:1900,layout:'fault-path',enemies:['collector','archon'],clue:'Rock’s Fault guard wakes the cracked floor. The Ember Moth Wing opens the Unplayed Concert in Prism Night.'},
 'night-attic':{world:'prism',name:'The Dreamer’s Attic',coord:[10,5],width:1900,layout:'feral-path',enemies:['mirror','hound'],clue:'Animal jumps twice to the upper floor. Pounce at the high glyph to remember Feral bound.'},
 'orbit-garden':{world:'orbit',name:'The Vacuum Garden',coord:[10,7],width:1900,layout:'rally-path',enemies:['archon','mirror'],clue:'Human holds Guard and uses Rally on the garden ledge. The Star Seed opens the Ninth Bell back in Verdant Memory.'},
 'cinder-minute':{world:'cinder',name:'The Unburned Minute',coord:[9,4],width:1900,layout:'clock-cache',enemies:['archon','collector'],clue:'The Salt Hourglass from Tideglass opens this clock. Human’s Rally remembers One More Minute; its pattern teaches the Tidebound equipment set.'},
 'night-concert':{world:'prism',name:'The Unplayed Concert',coord:[9,6],width:1900,layout:'score-cache',enemies:['mirror','collector'],clue:'The Ember Moth Wing from Cinder opens the silent score. Return as Tree, climb the root steps and wake the high glyph to remember Living Grove.'},
 'grove-bell':{world:'verdant',name:'The Ninth Bell',coord:[9,2],width:1900,layout:'bell-cache',enemies:['hound','collector'],clue:'A Star Seed from Pale Orbit gives this missing bell its weight. Rock’s Fault guard remembers the Cinder Crown equipment pattern.'},
 'night-door':{world:'prism',name:'The Door Behind Sleep',coord:[7,5],width:1900,layout:'sleep-cache',enemies:['mirror','hound'],clue:'Nacre’s Feather answers this door. Animal must first remember Feral bound in the Dreamer’s Attic. Pounce on the high glyph to remember Night Hunter.'},
 'origin-nameless':{world:'uncreated',name:'The Room Without a Name',coord:[8,10],width:1900,layout:'thread-cache',enemies:['archon','collector','mirror'],clue:'All six seals and Human’s Rally ascent answer the nameless room. Rally on the far ledge to find the Unmade Thread and the Before the Law equipment pattern. The thread opens the Outside Window back in Pale Orbit.'},
 'orbit-window':{world:'orbit',name:'The Outside Window',coord:[7,7],width:1900,layout:'window-cache',enemies:['mirror','archon'],clue:'The Unmade Thread from the Room Without a Name opens this window. Spark must remember Lumen drift in the Unbound Conduit. Pulse the far glyph to remember Pale Horizon.'}
};
export const SIDE_BRANCH_LINKS=[
 ['nursery','conduit',{form:'spark',feat:'nursery',x:1150}],
 ['tide-harbor','tide-lantern',{form:'computer',x:1300}],
 ['grove-rest','grove-canopy',{form:'tree',x:1300}],
 ['cinder-rest','cinder-ashlift',{form:'rock',x:1300}],
 ['night-rest','night-attic',{form:'animal',x:1300}],
 ['orbit-rest','orbit-garden',{form:'human',x:1510}],
 ['cinder-rest','cinder-minute',{relic:'salt-hourglass',x:1530}],
 ['night-rest','night-concert',{relic:'ember-wing',x:1530}],
 ['grove-rest','grove-bell',{relic:'star-seed',x:1530}],
 ['night-rest','night-door',{relic:'ivory-feather',path:'animal',form:'animal',seal:'cinder',x:820}],
 ['origin-seam','origin-nameless',{path:'human',form:'human',allSeals:true,x:1270}],
 ['orbit-rest','orbit-window',{relic:'unmade-thread',path:'spark',form:'spark',x:820}]
];
export const hasSidePath=(s,form=s.form)=>(s.paths??[]).includes(form);
export function sidePathObjective(s){if(s.practice)return null;const trial=SIDE_PATH_BY_ROOM[s.room],cache=SIDE_CACHE_ROOMS[s.room],quiet=s.cleared.includes(s.room)&&!s.enemies.some(e=>e.hp>0);if(trial&&!hasSidePath(s,trial.form))return {...trial,kind:'trial',ready:quiet&&s.form===trial.form&&(!trial.practice||(trial.practice==='guard'?s.player.guard:s.pathPractice?.[trial.practice]))};if(cache&&!s.secrets.includes(cache.secret))return {...cache,kind:'cache',color:'#e9cf91',ready:quiet&&s.form===cache.form&&(!cache.relic||hasSideRelic(s,cache.relic))&&(!cache.path||hasSidePath(s,cache.path))&&(!cache.allSeals||s.seals.length===6)};return null;}
export function rememberSidePath(s,emit,coins){
 const o=sidePathObjective(s);if(!o||Math.hypot(s.player.x-o.x,s.player.y-o.y)>95)return false;
 if(!s.cleared.includes(s.room)||s.enemies.some(e=>e.hp>0)){emit(s,'hint','Clear the constructs before waking this glyph.');return false;}
 if(s.form!==o.form){emit(s,'hint','Borrow '+o.form[0].toUpperCase()+o.form.slice(1)+' and use its power at the glyph.');return false;}
 if(!o.ready){emit(s,'hint',o.trial??'Bring the named relic and remember this vessel’s path first.');return false;}
 if(o.kind==='trial'){
  s.paths.push(o.form);s.memoryPoints++;s.journal.push({room:s.room,title:o.name,text:o.rule});emit(s,'imprint','PATH REMEMBERED · '+o.name+' · '+o.rule,o.x,o.y-50);
  if(o.relic&&!s.relics.includes(o.relic)){s.relics.push(o.relic);const r=SIDE_RELICS[o.relic];s.journal.push({room:s.room,title:r.name,text:r.name+' opens '+r.opens+'.'});emit(s,'key','RELIC FOUND · '+r.name+' · opens '+r.opens,o.x,o.y-65);}
 }else{s.secrets.push(o.secret);s.memoryPoints++;coins(s,'secret:'+o.secret,o.x,o.y,12);s.journal.push({room:s.room,title:o.name,text:o.text});if(o.foundRelic&&!s.relics.includes(o.foundRelic)){s.relics.push(o.foundRelic);const r=SIDE_RELICS[o.foundRelic];s.journal.push({room:s.room,title:r.name,text:'Opens '+r.opens+'.'});emit(s,'key','RELIC FOUND · '+r.name+' · opens '+r.opens,o.x,o.y-65);}emit(s,'secret','REMEMBERED · '+o.name+' · an equipment set is now offered at merchants.',o.x,o.y-55);}
 return true;
}
