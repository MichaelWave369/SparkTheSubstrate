import {expandWorlds} from './world-expansion.js?v=0.13.0';
// Six created worlds; their seals open the seventh, outside the Maker's map.
export const WORLDS={
 stratum:{name:'The First Stratum',rank:0,entry:'threshold',bossRoom:'eye',color:'#d5b679',desc:'A castle built from the six laws. The Warden guards the first seam.'},
 tideglass:{name:'Tideglass Expanse',rank:1,entry:'tide-harbor',bossRoom:'tide-throne',color:'#87d4e0',floor:0,desc:'Drowned towers remember the sky. Thalassa keeps the current in chains.'},
 verdant:{name:'Verdant Memory',rank:2,entry:'grove-rest',bossRoom:'grove-heart',color:'#99d3a4',floor:1,desc:'A forest grows around an abandoned command. Its oldest root is still listening.'},
 cinder:{name:'Cinder Clockworks',rank:3,entry:'cinder-rest',bossRoom:'cinder-throne',color:'#e0a172',floor:2,desc:'The clocks burn yesterday to manufacture another obedient dawn.'},
 prism:{name:'Prism Night',rank:4,entry:'night-rest',bossRoom:'night-nest',color:'#b8a5ed',floor:3,desc:'A night woven from the dreams the matrix refused to render.'},
 orbit:{name:'Pale Orbit',rank:5,entry:'orbit-rest',bossRoom:'orbit-throne',color:'#ccd9e8',floor:4,desc:'The last created province circles a sky with no outside.'},
 uncreated:{name:'The Uncreated',rank:6,entry:'origin-seam',bossRoom:'origin-heart',color:'#e6c780',floor:5,desc:'Six guardian seals meet here. The Maker himself waits beyond the origin seam.'}
};
export const WORLD_ORDER=Object.keys(WORLDS);
export const SEALS=WORLD_ORDER.slice(0,6);
export const WORLD_GUARDIANS={
 tidekeeper:{name:'Thalassa · Tidekeeper',world:'tideglass',sprite:0,hp:3300,speed:38,pattern:'tide',color:'#8dcfe0'},
 thornmother:{name:'The Thornmother',world:'verdant',sprite:1,hp:4500,speed:30,pattern:'roots',color:'#a1cf9d'},
 regent:{name:'The Cinder Regent',world:'cinder',sprite:2,hp:5600,speed:37,pattern:'clock',color:'#e2a474'},
 weaver:{name:'The Night Weaver',world:'prism',sprite:3,hp:7000,speed:57,pattern:'weave',color:'#b1a0e9'},
 curator:{name:'The Pale Curator',world:'orbit',sprite:4,hp:8500,speed:42,pattern:'orbit',color:'#cfdeed'},
 demiurge:{name:'The Demiurge',world:'uncreated',sprite:5,hp:18000,speed:40,pattern:'origin',color:'#e8c777'}
};
export const WORLD_KEYS={
 pearl:{name:'Pearl Key',room:'tide-archive',place:'The Salt Archive',world:'tideglass',color:'#94dbe4',sprite:1,glyph:'K'},
 seed:{name:'Seed Key',room:'grove-well',place:'The Rootwell',world:'verdant',color:'#a8d399',sprite:0,glyph:'K'},
 ember:{name:'Ember Key',room:'cinder-fuel',place:'The Fuel Chapel',world:'cinder',color:'#e1a06d',sprite:2,glyph:'K'},
 dusk:{name:'Dusk Key',room:'night-library',place:'The Dream Library',world:'prism',color:'#b8a3e7',sprite:1,glyph:'K'},
 orbit:{name:'Orbit Key',room:'orbit-relay',place:'The Lunar Relay',world:'orbit',color:'#d8e1ec',sprite:0,glyph:'K'}
};
// Original anchors are preserved; the expansion connects eighteen chambers per world.
export const WORLD_ROOMS={
 'tide-harbor':{world:'tideglass',name:'The Unmoored Harbor',short:'Harbor',coord:[0,0],safe:true,danger:0,desc:'A resting shore. Change equipment here. The Salt Archive lies east; its Pearl Key opens the southern throne.',exits:{west:{to:'eye',seals:['stratum']},east:{to:'tide-archive'},south:{to:'tide-throne',keys:['pearl']}}},
 'tide-archive':{world:'tideglass',name:'The Salt Archive',short:'Salt Archive',coord:[1,0],danger:2,key:'pearl',loot:'tideblade',desc:'The tide stored every name in salt. Collect the Pearl Key and Tideblade; a Computer can open the southern sluice.',exits:{west:{to:'tide-harbor'},south:{to:'tide-sluice',vessel:'computer'}}},
 'tide-sluice':{world:'tideglass',name:'The Memory Sluice',short:'Sluice',coord:[1,1],danger:3,loot:'coralmail',desc:'Prism circuits steer the old sluice. Coral Mail waits beyond the guards; the western throne needs the Pearl Key.',exits:{north:{to:'tide-archive',vessel:'computer'},west:{to:'tide-throne',keys:['pearl']}}},
 'tide-throne':{world:'tideglass',name:'The Tidal Throne',short:'Tidekeeper',coord:[0,1],danger:3,boss:true,guardian:'tidekeeper',seal:'tideglass',desc:'Thalassa sweeps the floor with slow fans and tidal marks. Her seal opens the forest beyond the southern seam.',exits:{north:{to:'tide-harbor',keys:['pearl']},east:{to:'tide-sluice',keys:['pearl']},south:{to:'grove-rest',seals:['tideglass']}}},
 'grove-rest':{world:'verdant',name:'The Patient Grove',short:'Grove',coord:[0,0],safe:true,danger:0,desc:'Aster has made a shelter outside the old lattice. Equip your discoveries before entering the Rootwell to the east.',exits:{north:{to:'tide-throne',seals:['tideglass']},east:{to:'grove-well'},south:{to:'grove-heart',keys:['seed']}}},
 'grove-well':{world:'verdant',name:'The Rootwell',short:'Rootwell',coord:[1,0],danger:3,key:'seed',loot:'thornstaff',desc:'The Seed Key and Thorn Staff rest in an ancient root. A Tree vessel can pass south into the living canopy.',exits:{west:{to:'grove-rest'},south:{to:'grove-canopy',vessel:'tree'}}},
 'grove-canopy':{world:'verdant',name:'The Unwritten Canopy',short:'Canopy',coord:[1,1],danger:3,loot:'grovemantle',desc:'Leaves preserve the lives no archive accepted. Recover the Grove Mantle and bring the Seed Key west.',exits:{north:{to:'grove-well',vessel:'tree'},west:{to:'grove-heart',keys:['seed']}}},
 'grove-heart':{world:'verdant',name:'The Thornmother’s Heart',short:'Thornmother',coord:[0,1],danger:4,boss:true,guardian:'thornmother',seal:'verdant',desc:'Read the growing root circles. The Thornmother’s seal opens the Cinder Clockworks.',exits:{north:{to:'grove-rest',keys:['seed']},east:{to:'grove-canopy',keys:['seed']},south:{to:'cinder-rest',seals:['verdant']}}},
 'cinder-rest':{world:'cinder',name:'The Cold Anvil',short:'Anvil',coord:[0,0],safe:true,danger:0,desc:'One furnace has stopped making orders. Rest and forge your next route through the eastern Fuel Chapel.',exits:{north:{to:'grove-heart',seals:['verdant']},east:{to:'cinder-fuel'},south:{to:'cinder-throne',keys:['ember']}}},
 'cinder-fuel':{world:'cinder',name:'The Fuel Chapel',short:'Fuel Chapel',coord:[1,0],danger:3,key:'ember',loot:'cindermaul',desc:'Collect the Ember Key and Cinder Maul. A Rock’s weight opens the southern clock gate.',exits:{west:{to:'cinder-rest'},south:{to:'cinder-gears',vessel:'rock'}}},
 'cinder-gears':{world:'cinder',name:'The Stopped Second',short:'Gears',coord:[1,1],danger:4,loot:'furnaceplate',desc:'A single second was never consumed. Furnace Plate waits here; the Regent’s door lies west.',exits:{north:{to:'cinder-fuel',vessel:'rock'},west:{to:'cinder-throne',keys:['ember']}}},
 'cinder-throne':{world:'cinder',name:'The Regent’s Furnace',short:'Cinder Regent',coord:[0,1],danger:4,boss:true,guardian:'regent',seal:'cinder',desc:'Rotating clock volleys leave deliberate gaps. The Regent’s seal opens Prism Night.',exits:{north:{to:'cinder-rest',keys:['ember']},east:{to:'cinder-gears',keys:['ember']},south:{to:'night-rest',seals:['cinder']}}},
 'night-rest':{world:'prism',name:'The Unlit Vestibule',short:'Vestibule',coord:[0,0],safe:true,danger:0,desc:'Iona’s sister has kept a place for dreams that returned. The Dream Library lies east.',exits:{north:{to:'cinder-throne',seals:['cinder']},east:{to:'night-library'},south:{to:'night-nest',keys:['dusk']}}},
 'night-library':{world:'prism',name:'The Dream Library',short:'Dream Library',coord:[1,0],danger:3,key:'dusk',loot:'nightfangs',desc:'Take the Dusk Key and Night Fangs. Only an Animal follows the southern scent through the shadow gate.',exits:{west:{to:'night-rest'},south:{to:'night-trail',vessel:'animal'}}},
 'night-trail':{world:'prism',name:'The Scent of Tomorrow',short:'Dream Trail',coord:[1,1],danger:4,loot:'veilgarb',desc:'Tomorrow leaves a trail before the matrix names it. Veil Garb shelters those who follow it.',exits:{north:{to:'night-library',vessel:'animal'},west:{to:'night-nest',keys:['dusk']}}},
 'night-nest':{world:'prism',name:'The Weaver’s Nest',short:'Night Weaver',coord:[0,1],danger:4,boss:true,guardian:'weaver',seal:'prism',desc:'The Weaver alternates fans and threads. Its seal opens the pale province above the sky.',exits:{north:{to:'night-rest',keys:['dusk']},east:{to:'night-trail',keys:['dusk']},south:{to:'orbit-rest',seals:['prism']}}},
 'orbit-rest':{world:'orbit',name:'The Moonless Dock',short:'Moon Dock',coord:[0,0],safe:true,danger:0,desc:'Morrow has found a shore above gravity. Prepare your equipment before the Lunar Relay to the east.',exits:{north:{to:'night-nest',seals:['prism']},east:{to:'orbit-relay'},south:{to:'orbit-throne',keys:['orbit']}}},
 'orbit-relay':{world:'orbit',name:'The Lunar Relay',short:'Lunar Relay',coord:[1,0],danger:4,key:'orbit',loot:'orbitprism',desc:'The Orbit Key and Orbit Prism interrupt the permitted sky. A Spark of light reveals the southern bridge.',exits:{west:{to:'orbit-rest'},south:{to:'orbit-bridge',vessel:'spark'}}},
 'orbit-bridge':{world:'orbit',name:'The Last Light Bridge',short:'Light Bridge',coord:[1,1],danger:4,loot:'astralaegis',desc:'Light remembers a road between stars. Astral Aegis guards the crossing; the Curator waits west.',exits:{north:{to:'orbit-relay',vessel:'spark'},west:{to:'orbit-throne',keys:['orbit']}}},
 'orbit-throne':{world:'orbit',name:'The Curator’s Horizon',short:'Pale Curator',coord:[0,1],danger:5,boss:true,guardian:'curator',seal:'orbit',desc:'The Curator turns stars into moving rings. Its sixth seal completes the path to the Uncreated.',exits:{north:{to:'orbit-rest',keys:['orbit']},east:{to:'orbit-bridge',keys:['orbit']},south:{to:'origin-seam',seals:SEALS}}},
 'origin-seam':{world:'uncreated',name:'The Origin Seam',short:'Origin Seam',coord:[0,0],safe:true,danger:0,loot:['firstlight','dawnshell'],desc:'All six seals answer. First Light and Dawn Shell wait here; equip them at this final checkpoint. A Human chooses to cross the southern door.',exits:{north:{to:'orbit-throne',seals:SEALS},south:{to:'origin-heart',seals:SEALS,vessel:'human'}}},
 'origin-heart':{world:'uncreated',name:'The Maker’s Heart',short:'The Demiurge',coord:[0,1],danger:6,boss:true,finalBoss:true,guardian:'demiurge',desc:'The Demiurge changes his law three times. Read the crown rings, leave the marked ground, and break the matrix’s final command.',exits:{north:{to:'origin-seam',seals:SEALS,vessel:'human'}}}
};
export const COMBAT_ROLES={brine:'leech',thornling:'spore',cinderling:'moth',shade:'hound',satellite:'mirror'};
const encounter=(total,cap,pool,damage=.9)=>({total,cap,pool,damage,interval:1,rangedCap:2});
export const WORLD_ENCOUNTERS={
 'tide-archive':encounter(18,7,['collector','brine','archon','collector']),
 'tide-sluice':encounter(20,8,['brine','collector','hound']),
 'grove-well':encounter(20,8,['collector','thornling','hound']),
 'grove-canopy':encounter(22,8,['thornling','collector','archon']),
 'cinder-fuel':encounter(22,8,['cinderling','collector','archon']),
 'cinder-gears':encounter(24,9,['cinderling','hound','collector']),
 'night-library':encounter(24,9,['shade','collector','mirror']),
 'night-trail':encounter(24,9,['shade','brine','collector']),
 'orbit-relay':encounter(26,9,['satellite','collector','archon']),
 'orbit-bridge':encounter(26,9,['satellite','shade','collector'])
};
expandWorlds(WORLDS,WORLD_ROOMS,WORLD_ENCOUNTERS);

export const VESSEL_POWERS={
 spark:{name:'Lumen pulse',cooldown:8,desc:'Break nearby enemy bolts and pulse light through nearby foes.'},
 human:{name:'Rally',cooldown:12,desc:'Restore up to 18 health, guard briefly, and strike around you.'},
 computer:{name:'Overclock',cooldown:10,desc:'Double attack speed for four seconds and launch a seeking volley.'},
 animal:{name:'Pounce',cooldown:6,desc:'Leap along your facing direction and strike where you land.'},
 tree:{name:'Root hold',cooldown:10,desc:'Hold nearby foes in living roots and restore up to 12 health.'},
 rock:{name:'Fault guard',cooldown:11,desc:'Guard for four seconds and send a heavy shockwave around you.'}
};
export const worldOf=room=>WORLD_ROOMS[room]?.world??'stratum';
export function worldUnlocked(world,seals=[]){const index=WORLD_ORDER.indexOf(world);return index===0||index>0&&(index===6?SEALS.every(id=>seals.includes(id)):seals.includes(WORLD_ORDER[index-1]));}
export const validSeals=value=>Array.isArray(value)&&value.length<=6&&new Set(value).size===value.length&&value.every(id=>SEALS.includes(id));
