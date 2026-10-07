// Hand-named rooms and optional routes. Existing room IDs remain valid in old saves.
export const ROUTE_RELICS={
 'ivory-feather':{name:'Nacre’s Feather',room:'reliquary',place:'Nacre’s Reliquary',world:'stratum',opens:'The Door Behind Sleep · Prism Night',color:'#e5d5a7'},
 'salt-hourglass':{name:'Salt Hourglass',room:'tide-lantern',place:'The Lantern Grave',world:'tideglass',opens:'The Unburned Minute · Cinder Clockworks',color:'#87d4e0'},
 'ember-wing':{name:'Ember Moth Wing',room:'cinder-ashlift',place:'The Ash Lift',world:'cinder',opens:'The Unplayed Concert · Prism Night',color:'#e0a172'},
 'star-seed':{name:'Star Seed',room:'orbit-garden',place:'The Vacuum Garden',world:'orbit',opens:'The Ninth Bell · Verdant Memory',color:'#ccd9e8'},
 'unmade-thread':{name:'Unmade Thread',room:'origin-nameless',place:'The Room Without a Name',world:'uncreated',opens:'The Outside Window · Pale Orbit',color:'#e6c780'}
};
export const EASTER_EGGS={
 'mirror-echo':{name:'The First Player',room:'nursery',vessel:'spark',hint:'One mirror reflects a tiny golden cursor. Return as Spark and investigate it with your gate button.',text:'The cursor blinks: “A spark against the pattern. Player one was here.” Beneath it, someone has scratched a heart and a very small bro.',essence:6},
 'wrong-number':{name:'The 667th Address',room:'tide-number',vessel:'computer',hint:'A terminal asks for the address after 666. A Computer can supply it.',text:'You enter 667. A tiny message appears: “Outside the allocated world. Welcome.” Someone left you a cup of impossible tea.',essence:8},
 'ninth-bell':{name:'The Ninth Bell',room:'grove-bell',vessel:'rock',hint:'Eight bells are painted on the wall. A Rock can ring the ninth.',text:'The ninth bell rings once. Far below, a castle librarian mutters: “What is a vessel? A wonderfully borrowed pile of matter.”',essence:12},
 'sleeping-minute':{name:'One More Minute',room:'cinder-minute',vessel:'human',hint:'A clock has a SNOOZE button. Only a Human understands it.',text:'You press snooze. For one minute the Maker cannot issue an order. Even the furnaces take a breath.',essence:12},
 'quiet-concert':{name:'The Unplayed Concert',room:'night-concert',vessel:'tree',hint:'The score contains only rests. A Tree knows how to listen.',text:'The branches play a song with no notes. A stagehand whispers: “The concert has been happening for four minutes and thirty-three seconds.”',essence:12},
 'outside-window':{name:'The Sky Beyond the Sky',room:'orbit-window',vessel:'spark',hint:'A seam beyond the glass answers to a Spark.',text:'Behind the painted stars, one real star blinks. Its light draws a little arrow: “You are here. Keep going.”',essence:15}
};
export const validRelics=value=>Array.isArray(value)&&value.length<=Object.keys(ROUTE_RELICS).length&&new Set(value).size===value.length&&value.every(id=>Object.hasOwn(ROUTE_RELICS,id));
export const validSecrets=value=>Array.isArray(value)&&value.length<=Object.keys(EASTER_EGGS).length&&new Set(value).size===value.length&&value.every(id=>Object.hasOwn(EASTER_EGGS,id));

export const DISCOVERY_CLUES={
 reliquary:[{id:'salt-road',title:'Nacre’s map of impossible roads',text:'In Tideglass, follow the eastern trail to the Lantern Grave. A Salt Hourglass waits there after the guards fall. It opens the Unburned Minute in Cinder Clockworks.'}],
 foundry:[{id:'wing-road',title:'A moth’s unfinished journey',text:'The Ash Lift in Cinder Clockworks holds an Ember Moth Wing. Carry it to the Unplayed Concert in Prism Night; the silent score answers a Tree.'}],
 belfry:[{id:'star-road',title:'The bell that is missing',text:'The Vacuum Garden in Pale Orbit holds a Star Seed. Bring it back to the Ninth Bell in Verdant Memory, then investigate as Rock.'}],
 archive:[{id:'outside-road',title:'A margin beyond the last world',text:'A thread waits in the Room Without a Name in the Uncreated. It opens the Outside Window in Pale Orbit. A Spark can answer what is beyond the glass.'}]
};
export function discoveryClues(room){return [...(DISCOVERY_CLUES[room]??[]),...Object.entries(ROUTE_RELICS).filter(([,r])=>r.room===room).map(([id,r])=>({id,title:r.name+' · a road between worlds',text:'Clear '+r.place+' and walk onto the glowing diamond. '+r.name+' opens '+r.opens+'. It stays with your spark.'})),...Object.entries(EASTER_EGGS).filter(([,e])=>e.room===room).map(([id,e])=>({id,title:e.name+' · a strange discovery',text:e.hint}))];}
export function recordDiscoveryClues(run){if(!run||run.dungeon||run.rematch)return;run.journal??=[];for(const clue of discoveryClues(run.room)){const id=run.room+':clue:'+clue.id;if(!run.journal.some(e=>e.id===id))run.journal.push({id,room:run.room,speaker:'A clue in the substrate',title:clue.title,text:clue.text});}}

// Ten additions along/around the main trail and four side chambers per created world.
const PROVINCES={
 tideglass:{prefix:'tide',base:['tide-harbor','tide-archive','tide-sluice','tide-throne'],key:'pearl',vessel:'computer',speaker:'The drowned cartographer',theme:'The sea remembers a route the Maker erased.',rooms:[
 ['quay','The Broken Quay','The water climbs broken stairs. Brine echoes rush between scattered stones.'],
 ['choir','The Drowned Choir','A submerged choir counts the people the tide was ordered to forget.'],
 ['aqueduct','The Glass Aqueduct','Current runs along glass ribs. Leave the warning circles before the tide returns.'],
 ['lantern','The Lantern Grave','One lantern contains an hour of salt. It belongs to a clock in another world.'],
 ['reef','The Reversed Reef','Coral grows toward yesterday. The guardians begin moving in larger packs.'],
 ['reservoir','The Silent Reservoir','Reflections arrive a heartbeat before their owners.'],
 ['causeway','The Ebb Causeway','The last dry stones lead toward the pressure vault.'],
 ['pressure','The Pressure Vault','Three tides press on a door built to hold one. Violet rings announce their release.'],
 ['wreck','The Unwritten Wreck','A ship’s log ends with a destination no chart contains.'],
 ['beacon','The Last Tide Beacon','Break the guards to light the beacon. Its answer releases the locks on Thalassa’s throne.'],
 ['refuge','The Sandglass Refuge','A sheltered shore overlooks the throne road. Change gear and plan a return.'],
 ['number','The Numberless Terminal','A forgotten terminal lists 666 addresses and waits for one more.'],
 ['pearlcourt','The Pearl Court','Abandoned pearls still imitate little moons.'],
 ['deep','The Sea Beneath the Sea','The water below the painted ocean has never heard of the Maker.']
 ]},
 verdant:{prefix:'grove',base:['grove-rest','grove-well','grove-canopy','grove-heart'],key:'seed',vessel:'tree',speaker:'Aster’s oldest root',theme:'An old forest keeps the lives the archive discarded.',rooms:[
 ['orchard','The Unchosen Orchard','Each fruit carries the memory of a life that almost happened.'],
 ['moss','The Moss Script','Commands have grown soft enough for roots to read between them.'],
 ['rain','The Green Rainhouse','Rain falls upward through the leaves. The circles below it still hurt.'],
 ['nursery','The Seed Nursery','A constellation has left an empty hollow in the roots.'],
 ['braid','The Braided Path','Three roots knot around one remembered road.'],
 ['fern','The Fern Cathedral','Thornlings carry prayers no machine can translate.'],
 ['hollow','The Heartwood Hollow','The forest keeps a pulse behind its walls.'],
 ['spore','The Spore Atrium','Root circles flower around your last footprint. Keep moving.'],
 ['fall','The Emerald Fall','A river of leaves buries the last command tablet.'],
 ['altar','The Root Altar','Wake this altar to open the Thornmother’s heart.'],
 ['shelter','The Gardener’s Shelter','Aster has kept a second resting place for the long road home.'],
 ['forgotten','The Forgotten Orchard','Names that were never spoken hang from the branches.'],
 ['sap','The Amber Library','Tree rings preserve a book nobody has finished reading.'],
 ['bell','The Ninth Bell','An empty place between eight bells waits for a seed from the stars.']
 ]},
 cinder:{prefix:'cinder',base:['cinder-rest','cinder-fuel','cinder-gears','cinder-throne'],key:'ember',vessel:'rock',speaker:'The clockmaker without a shift',theme:'The factory consumes yesterday to manufacture obedient dawns.',rooms:[
 ['conveyor','The Yesterday Conveyor','Ashlings ride a conveyor carrying the previous day into the furnace.'],
 ['kiln','The Memory Kiln','Memories burn brighter than coal. Some still refuse to catch.'],
 ['piston','The Piston Gallery','Warning rings trace the next fall of the factory’s invisible pistons.'],
 ['ashlift','The Ash Lift','A moth has hidden an ember inside a wing. It remembers a stage in Prism Night.'],
 ['escapement','The Broken Escapement','The clock’s smallest tooth has learned to miss a beat.'],
 ['pendulum','The Red Pendulum','Every swing divides a life the Maker cannot own whole.'],
 ['slag','The Slag Arcade','The furnace’s discarded iron has begun building another road.'],
 ['boiler','The Sixth Boiler','Leave the heat circles before the boiler claims their ground.'],
 ['dial','The Empty Dial','There are no numbers left, but the guards still count.'],
 ['release','The Release Valve','Clear the valve to vent the pressure locking the Regent’s furnace.'],
 ['canteen','The Nightshift Canteen','A cold furnace shelters a table set for people who never clocked in.'],
 ['spare','The Spare Parts Chapel','Every missing cog has a little shrine.'],
 ['coal','The Coal Library','Black pages record all the seconds that were consumed.'],
 ['minute','The Unburned Minute','A salt-filled socket waits beside a clock with one human button.']
 ]},
 prism:{prefix:'night',base:['night-rest','night-library','night-trail','night-nest'],key:'dusk',vessel:'animal',speaker:'Iona’s sleeping sister',theme:'The night shelters dreams the lattice could not render.',rooms:[
 ['gallery','The Unfinished Gallery','Paintings look away when the Maker looks at them.'],
 ['stair','The Inverted Stair','Shadow hounds follow steps cast by tomorrow.'],
 ['rain','The Violet Rain','The drops cast circles before they arrive.'],
 ['attic','The Dreamer’s Attic','A discarded dream has made itself a home above the library.'],
 ['mirror','The Blind Mirrorhall','Mirrors imitate everyone except their owner.'],
 ['thread','The Silver Threadway','A thread leads out of the nest and into an unapproved dream.'],
 ['garden','The Midnight Garden','Flowers bloom only when somebody stops to remember them.'],
 ['loom','The Loom of Rests','The floor sings the places where a volley will land.'],
 ['shore','The Sleeping Shore','The dark sea is calm; its inhabitants are less patient.'],
 ['knot','The Last Dream Knot','Unbind this knot to enter the Weaver’s nest.'],
 ['repose','The Repose Room','A lamp without a bulb keeps the resting place warm.'],
 ['door','The Door Behind Sleep','Nobody remembers building this door.'],
 ['wings','The Silent Wings','The concert hall’s lamps wait for fire borrowed from another world.'],
 ['concert','The Unplayed Concert','An ember-wing socket guards a score made entirely of rests.']
 ]},
 orbit:{prefix:'orbit',base:['orbit-rest','orbit-relay','orbit-bridge','orbit-throne'],key:'orbit',vessel:'spark',speaker:'Morrow beyond gravity',theme:'The last province circles a sky that insists it has no outside.',rooms:[
 ['platform','The Falling Platform','Satellites circle a landing that has no ground below it.'],
 ['lens','The Pale Lenshouse','Every lens points toward a different version of the permitted sky.'],
 ['weather','The Star Weatherhouse','The forecast marks where the next pale storm will strike.'],
 ['garden','The Vacuum Garden','A seed grows in nothing at all. A forest below is waiting for it.'],
 ['ring','The Broken Ring','An orbital path has become a road by refusing to return.'],
 ['choir','The Satellite Choir','The little moons repeat a command whose sender has disappeared.'],
 ['cable','The Horizon Cable','A pale cable holds the false sky to its frame.'],
 ['perihelion','The Cold Perihelion','Starlight gathers in warning rings, then falls.'],
 ['chart','The Forbidden Chart','One chart labels the white space beyond the world.'],
 ['anchor','The Last Sky Anchor','Cut the anchor’s command to enter the Curator’s horizon.'],
 ['shelter','The Gravity Shelter','Morrow keeps a small room where things remember how to rest.'],
 ['echo','The Far Echo Chamber','A voice returns from farther away than the sky is wide.'],
 ['glass','The Outside Glass','A needle-shaped opening waits for an unmade thread.'],
 ['window','The Outside Window','Something beyond the painted sky has left the window unlocked from its side.']
 ]},
 uncreated:{prefix:'origin',base:['origin-seam','origin-witness','origin-oath','origin-heart'],vessel:'human',speaker:'Your own unborrowed voice',theme:'The six laws end here. Their author is still trying to write you.',rooms:[
 ['first','The First Uncommand','A command breaks into harmless letters before it reaches you.'],
 ['margin','The Margin of Creation','The Maker’s drafts are full of lives he crossed out.'],
 ['law','The Court of Six Laws','Warning circles rehearse the final guardian’s crown.'],
 ['nameless','The Room Without a Name','A loose thread was never made. A window in Pale Orbit can use it.'],
 ['grammar','The Empty Grammar','Words have begun choosing their own order.'],
 ['veil','The Torn Veil','There is no artwork behind the veil, only room for something new.'],
 ['echo','The Echo Before Light','The echoes here are older than the voices that made them.'],
 ['crown','The Unworn Crown','The floor remembers the shape of a law before a ruler wore it.'],
 ['mirror','The Human Mirror','The mirror cannot tell you which body you should be.'],
 ['answer','The Last Answer','Clear this chamber to open the final ward. A Human must choose to cross.'],
 ['refuge','The Refuge Outside Time','A last quiet place holds the equipment you brought through six worlds.'],
 ['draft','The Unfinished Draft','The final page has room for a different ending.'],
 ['zero','The Zeroth Room','A room numbered before the first refuses the Maker’s arithmetic.'],
 ['after','The Room After the Ending','The road continues behind the sentence he wrote as final.']
 ]}
};
const COORDS=[[0,0],[1,0],[2,0],[3,0],[3,1],[2,1],[1,1],[1,2],[2,2],[3,2],[3,3],[2,3],[1,3],[0,3],[0,1],[0,2],[1,4],[2,4]];
const opposite={north:'south',south:'north',east:'west',west:'east'};
function direction(a,b){return b[0]>a[0]?'east':b[0]<a[0]?'west':b[1]>a[1]?'south':'north';}
export function expandWorlds(worlds,rooms,encounters){
 for(const [world,p]of Object.entries(PROVINCES)){
  const [entry,key,trial,boss]=p.base,rank=worlds[world].rank,extra=p.rooms.map(([suffix])=>p.prefix+'-'+suffix),path=[entry,key,...extra.slice(0,4),trial,...extra.slice(4,10),boss,...extra.slice(10)];
  const externalEntry=Object.fromEntries(Object.entries(rooms[entry].exits).filter(([,e])=>rooms[e.to]?.world!==world)),externalBoss=Object.fromEntries(Object.entries(rooms[boss].exits).filter(([,e])=>rooms[e.to]?.world!==world));
  if(world==='uncreated'){
   rooms[key]={world,name:'The Unwritten Witness',short:'Witness',danger:6,desc:'Six created seals answer a witness the Maker never called.'};
   rooms[trial]={world,name:'The Borrowed Oath',short:'Oath',danger:7,desc:'Any body may carry the spark this far. A Human must choose the last crossing.'};
  }
  for(let i=0;i<extra.length;i++){
   const [,name,desc]=p.rooms[i],id=extra[i];rooms[id]={world,name,short:name.replace(/^The /,'').split(' ').slice(-2).join(' '),danger:Math.min(9,rank+2+Math.floor(i/5)),safe:i===10,desc,exits:{},layout:(i+rank*2)%8,...([2,7].includes(i)?{hazard:'echo'}:{})};
  }
  for(let i=0;i<path.length;i++){
   const room=rooms[path[i]];room.coord=COORDS[i];room.exits={};room.world=world;room.stage=i;room.layout??=(i+rank)%8;
   room.story={speaker:p.speaker,title:room.name,line:room.desc,choices:[['Leave a freer road',p.theme],['Take the remaining strength','The substrate still holds power that another life could use.'],['Remember this place','Keep the road and its witnesses in your memory.']]};
   if(!room.safe&&!room.boss){const role=['brine','thornling','cinderling','shade','satellite','satellite'][rank-1],pool=i%3===0?[role,'collector','archon','mirror']:i%3===1?['collector',role,'hound']:['collector',role,role,'archon'];encounters[path[i]]={total:18+rank*2+Math.floor(i/3),cap:Math.min(11,6+rank+Math.floor(i/7)),pool,damage:.8+rank*.075,health:1+rank*.4+i*.035,speed:1+rank*.035,interval:Math.max(.6,1-rank*.04-i*.01),rangedCap:rank<4?2:3};}
  }
  const link=(a,b,guard={})=>{const dir=direction(rooms[a].coord,rooms[b].coord);rooms[a].exits[dir]={to:b,...guard};rooms[b].exits[opposite[dir]]={to:a,...guard};};
  for(let i=0;i<13;i++)link(path[i],path[i+1],i===5?{vessel:p.vessel}:i===12?{...(p.key?{keys:[p.key]}:{}),ward:extra[9],...(world==='uncreated'?{vessel:'human',seals:Object.keys(worlds).slice(0,6)}:{})}:{});
  link(key,trial,{vessel:p.vessel});link(entry,extra[10]);link(extra[10],extra[11]);link(extra[11],boss,{...(p.key?{keys:[p.key]}:{}),ward:extra[9],...(world==='uncreated'?{vessel:'human',seals:Object.keys(worlds).slice(0,6)}:{})});link(extra[9],extra[12]);link(extra[12],extra[13]);link(extra[13],extra[8]);
  Object.assign(rooms[entry].exits,externalEntry);Object.assign(rooms[boss].exits,externalBoss);
  rooms[entry].desc='A safe checkpoint. Explore east for the '+(p.key?'local key':'unwritten witness')+', or rest at the southern refuge. Wake '+rooms[extra[9]].name+' to release the guardian’s ward.';
  rooms[key].desc+=(world==='uncreated'?'':' The eastern trail explores the far side of this world; the southern vessel gate is a shortcut.');
  rooms[trial].desc={tideglass:'Prism circuits steer the old sluice. Coral Mail waits beyond the guards.',verdant:'Leaves preserve the lives no archive accepted. Recover the Grove Mantle.',cinder:'A single second was never consumed. Furnace Plate waits here.',prism:'Tomorrow leaves a trail before the matrix names it. Veil Garb shelters those who follow.',orbit:'Light remembers a road between stars. Astral Aegis guards the crossing.',uncreated:'Any body may carry the spark this far. A Human must choose the last crossing.'}[world]+' The southern route leads toward '+rooms[extra[9]].name+'.';
  rooms[boss].desc+=' Its ward answers '+rooms[extra[9]].name+'.';
  rooms[extra[9]].wardFor=boss;
 }
 for(const [id,relic]of Object.entries(ROUTE_RELICS))if(rooms[relic.room])rooms[relic.room].relic=id;
 for(const [id,egg]of Object.entries(EASTER_EGGS))if(rooms[egg.room])rooms[egg.room].secret=id;
 for(const [target,relic]of [['night-door','ivory-feather'],['cinder-minute','salt-hourglass'],['night-concert','ember-wing'],['grove-bell','star-seed'],['orbit-window','unmade-thread']]){
  for(const room of Object.values(rooms))for(const exit of Object.values(room.exits))if(exit.to===target)exit.relics=[relic];
  for(const exit of Object.values(rooms[target].exits))exit.relics=[relic];
 }
}
