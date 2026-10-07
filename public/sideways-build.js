// Sideways knowledge belongs to the spark; equipment, food and borrowed techniques
// belong to this life. Common coins never buy a permanent Memory Imprint.
export const SIDE_IMPRINTS={
 spark:{id:'pulse-return',name:'Pulse return',rule:'Dash + Strike sends nearby enemy bolts back along their path.',feat:'glass',cost:1},
 human:{id:'held-answer',name:'Held answer',rule:'Guard just before contact to counter. Hold Guard for reduced damage.',feat:'glass',cost:1},
 computer:{id:'split-current',name:'Split current',rule:'Heavy fires three prism lanes. Strike after a dash briefly quickens your shots.',feat:'machine',cost:1},
 animal:{id:'falling-feral',name:'Falling feral',rule:'Down + Heavy in the air dives into a wide landing strike.',feat:'nursery',cost:1},
 tree:{id:'root-lift',name:'Root lift',rule:'Up + Heavy reaches farther and launches rooted enemies. Light strikes bind briefly.',feat:'archive',cost:1},
 rock:{id:'fault-rebound',name:'Fault rebound',rule:'Heavy launches into a ground bounce. Throws hit a wider crowd.',feat:'belfry',cost:1}
};
export const SIDE_FOOD={
 'glass-bun':{name:'Glass bun',cost:3,heal:28,buff:'haste',seconds:90,desc:'Crisp without the shards. +28 health; move 8% faster for 90 seconds.'},
 'root-broth':{name:'Root broth',cost:3,heal:30,buff:'guard',seconds:90,desc:'It tries to stir itself. +30 health; take 12% less damage for 90 seconds.'},
 'clock-crisp':{name:'Clock crisp',cost:4,heal:20,buff:'quick',seconds:90,desc:'Perfectly late. +20 health; strikes repeat 10% faster for 90 seconds.'},
 'salt-pear':{name:'Salt pear',cost:3,heal:32,buff:'magnet',seconds:90,desc:'The tide left dessert. +32 health; coins come from farther away for 90 seconds.'},
 'night-seed':{name:'Night seed',cost:4,heal:24,buff:'power',seconds:90,desc:'A small, suspicious dawn. +24 health; powers return 10% sooner for 90 seconds.'},
 'orbit-wafer':{name:'Orbit wafer',cost:4,heal:22,buff:'reach',seconds:90,desc:'Keeps circling the plate. +22 health; ranged bolts travel 15% faster for 90 seconds.'}
};
export const SIDE_MERCHANTS={
 threshold:{form:'human',name:'Human scavenger',food:'glass-bun',line:'A body eats. A spark keeps the receipt.'},
 'tide-harbor':{form:'spark',name:'Tideglass offering',food:'salt-pear',line:'The water gives back what it can carry.'},
 'grove-rest':{form:'tree',name:'Root counter',food:'root-broth',line:'Nothing here grows on credit.'},
 'cinder-rest':{form:'computer',name:'Clockwork dispenser',food:'clock-crisp',line:'TRANSACTION REMEMBERED. CRISP STILL WARM.'},
 'night-rest':{form:'animal',name:'Night gatherer',food:'night-seed',line:'Follow the scent. Leave the shell.'},
 'orbit-rest':{form:'rock',name:'Dock trader',food:'orbit-wafer',line:'Light goods. Heavy memory.'}
};
export const SIDE_EQUIPMENT={
 'wayfarer-edge':{name:'Wayfarer edge',cost:5,damage:3,desc:'+3 strike damage for this life.',slot:'weapon'},
 'held-shell':{name:'Held shell',cost:5,armor:.1,desc:'Take 10% less damage for this life.',slot:'armor'},
 'echo-thread':{name:'Echo thread',cost:5,desc:'Coin magnet reaches 65 steps farther for this life.',slot:'relic'},
 tideblade:{name:'Tideblade',cost:8,damage:4,set:'tide',requires:'sleeping-minute',desc:'+4 strike damage. Pair with Coral Mail for Tidebound regeneration.',slot:'weapon'},
 coralmail:{name:'Coral Mail',cost:8,armor:.12,set:'tide',requires:'sleeping-minute',desc:'Take 12% less damage. Pair with Tideblade for Tidebound regeneration.',slot:'armor'},
 thornstaff:{name:'Thorn Staff',cost:8,damage:4,set:'grove',requires:'quiet-concert',desc:'+4 strike damage. Pair with Grove Mantle for Living Grove recovery.',slot:'weapon'},
 grovemantle:{name:'Grove Mantle',cost:8,armor:.12,set:'grove',requires:'quiet-concert',desc:'Take 12% less damage. Pair with Thorn Staff for Living Grove recovery.',slot:'armor'},
 cindermaul:{name:'Cinder Maul',cost:9,damage:5,set:'cinder',requires:'ninth-bell',desc:'+5 strike damage. Pair with Furnace Plate for the Cinder Crown damage bonus.',slot:'weapon'},
 furnaceplate:{name:'Furnace Plate',cost:9,armor:.14,set:'cinder',requires:'ninth-bell',desc:'Take 14% less damage. Pair with Cinder Maul for Cinder Crown.',slot:'armor'},
 nightfangs:{name:'Night Fangs',cost:9,damage:5,set:'night',requires:'behind-sleep',desc:'+5 strike damage. Pair with Veil Garb for Night Hunter speed and dash recovery.',slot:'weapon'},
 veilgarb:{name:'Veil Garb',cost:9,armor:.12,set:'night',requires:'behind-sleep',desc:'Take 12% less damage. Pair with Night Fangs for Night Hunter.',slot:'armor'},
 orbitprism:{name:'Orbit Prism',cost:10,damage:5,set:'orbit',requires:'outside-window',desc:'+5 strike damage. Pair with Astral Aegis for Pale Horizon reach and attack speed.',slot:'weapon'},
 astralaegis:{name:'Astral Aegis',cost:10,armor:.15,set:'orbit',requires:'outside-window',desc:'Take 15% less damage. Pair with Orbit Prism for Pale Horizon.',slot:'armor'},
 firstlight:{name:'First Light',cost:11,damage:6,set:'dawn',requires:'nameless-thread',desc:'+6 strike damage. Pair with Dawn Shell for Before the Law damage and recovery.',slot:'weapon'},
 dawnshell:{name:'Dawn Shell',cost:11,armor:.16,set:'dawn',requires:'nameless-thread',desc:'Take 16% less damage. Pair with First Light for Before the Law.',slot:'armor'}
};
export const SIDE_SETS={tide:{name:'Tidebound',desc:'Regenerate 0.4 health per active second.',regen:.4,color:'#85dfdf'},grove:{name:'Living Grove',desc:'Regenerate 0.7 health per active second.',regen:.7,color:'#b3d592'},cinder:{name:'Cinder Crown',desc:'Strikes deal 12% more damage; take 3% less damage.',damage:.12,armor:.03,color:'#e8b175'},night:{name:'Night Hunter',desc:'Move 7% faster; dash returns 6% sooner.',speed:.07,dash:.06,color:'#c4b1f4'},orbit:{name:'Pale Horizon',desc:'Strikes reach 10% farther and repeat 7% faster.',range:.1,haste:.07,color:'#aebdec'},dawn:{name:'Before the Law',desc:'Strikes deal 8% more damage; regenerate 0.7 health per active second.',damage:.08,regen:.7,color:'#efcb85'}};
export const sideSet=s=>{const a=SIDE_EQUIPMENT[s.build.weapon]?.set;return a&&a===SIDE_EQUIPMENT[s.build.armor]?.set?SIDE_SETS[a]:null;};
export const sideArmor=s=>1-(SIDE_EQUIPMENT[s.build.armor]?.armor??0)-(sideSet(s)?.armor??0);
export const SIDE_FACTIONS={
 stratum:{name:'The collecting pattern',motif:'Collector pressure · cyan Archon aim',color:'#87d4da'},
 tideglass:{name:'Tidal constructs',motif:'Quick hounds · delayed aimed fire',color:'#85dfdf'},
 verdant:{name:'The rootbound pattern',motif:'Root snares · close pursuit',color:'#b3d592'},
 cinder:{name:'Clockwork collectors',motif:'An armored captain · paired turret volleys',color:'#e8b175'},
 prism:{name:'Mirror constructs',motif:'Floating mirrors · quick pursuit',color:'#c4b1f4'},
 orbit:{name:'Lunar relay',motif:'High mirrors · long prism lanes',color:'#aebdec'},
 uncreated:{name:'The Maker’s pattern',motif:'The existing guardians remember you',color:'#efcb85'}
};
export const hasSideImprint=(s,form=s.form)=>s.imprints.includes(SIDE_IMPRINTS[form].id)||s.build.loan===SIDE_IMPRINTS[form].id;
export const sideDamageBonus=s=>s.build.weapon?(SIDE_EQUIPMENT[s.build.weapon]?.damage??3)+s.build.enhance*2:0;
export const sideBuff=(s,id)=>s.build.buffs[id]>0;
export function freshSideBuild(){return {weapon:null,armor:null,relic:null,enhance:0,loan:null,buffs:{}};}
export function sideStations(s,room){if(s.practice)return [];const floor=room.floor;
 return [...(s.room==='threshold'?[{id:'vault',x:710,y:floor,name:'The Vault · recovered wealth'},{id:'imprints',x:1015,y:floor,name:'Memory Imprints · lasting knowledge'},{id:'arcade',x:1210,y:floor,name:'The Memory Arcade · preserved incarnations'}]:[]),...(SIDE_MERCHANTS[s.room]?[{id:'merchant',x:s.room==='threshold'?450:560,y:floor,name:SIDE_MERCHANTS[s.room].name}]:[])];
}
export function sideService(s,id,{room,emit}){
 if(s.practice)throw Error('Guardian memories have no purchases or deposits.');
 if(s.phase!=='playing'||s.enemies.some(e=>e.hp>0))throw Error('A quiet room is needed for a service.');
 const station=sideStations(s,room).find(v=>v.id===s.station);if(!station||Math.hypot(s.player.x-station.x,s.player.y-station.y)>115)throw Error('Visit a counter in the world first.');
 const p=s.player;
 const spend=cost=>{if(s.wallet<cost)throw Error('Need '+cost+' carried coins · you have '+s.wallet+'.');s.wallet-=cost;};
 if(id==='bank'){
  if(s.station!=='vault')throw Error('Bring the coins to the Vault.');
  if(s.pendingBank)throw Error('Your previous deposit is still being remembered.');
  if(s.wallet===0)throw Error('Collect physical coins from defeated constructs first.');
  const amount=s.wallet;s.wallet=0;s.bankSerial++;s.pendingBank={id:'side:'+s.id+':'+s.bankSerial,amount};s.recovered+=amount;emit(s,'bank',amount+' coins carried home · the Vault remembers.');return;
 }
 if(id==='learn'){
  if(s.station!=='imprints')throw Error('Visit the Memory Imprint altar.');const a=SIDE_IMPRINTS[s.form];
  if(s.imprints.includes(a.id))throw Error('This imprint is already remembered.');
  if(!s.cleared.includes(a.feat))throw Error('Remember '+a.feat+' before learning '+a.name+'.');
  if(s.memoryPoints<a.cost)throw Error('Find a memory fragment or defeat a guardian to earn a memory.');
  s.memoryPoints-=a.cost;s.imprints.push(a.id);s.build.loan=s.build.loan===a.id?null:s.build.loan;emit(s,'imprint',a.name+' · the spark remembers this technique between lives.');return;
 }
 if(s.station!=='merchant'&&s.station!=='vault')throw Error('Visit a merchant or the Vault counter.');
 if(id==='loan'){const a=SIDE_IMPRINTS[s.form];if(hasSideImprint(s))throw Error('This body already carries its technique.');spend(4);s.build.loan=a.id;emit(s,'purchase',a.name+' · borrowed for this life. Permanent knowledge needs a memory.');return;}
 if(id==='enhance'){if(!s.build.weapon)throw Error('Equip a weapon first.');if(s.build.enhance>=3)throw Error('This weapon remembers its third enhancement.');spend(3+s.build.enhance);s.build.enhance++;emit(s,'purchase',SIDE_EQUIPMENT[s.build.weapon].name+' +'+s.build.enhance+' · this life’s strikes grow stronger.');return;}
 if(SIDE_FOOD[id]){const a=SIDE_FOOD[id];if(s.station==='merchant'&&SIDE_MERCHANTS[s.room]?.food!==id)throw Error('This counter serves its own food.');spend(a.cost);p.hp=Math.min(p.maxHp,p.hp+a.heal);s.build.buffs[a.buff]=a.seconds;emit(s,'purchase',a.name+' · '+a.desc);return;}
 const gear=SIDE_EQUIPMENT[id];if(!gear)throw Error('Unknown Sideways service.');if(gear.requires&&!s.secrets.includes(gear.requires))throw Error('Find the cross-world equipment pattern first.');if(s.build[gear.slot]===id)throw Error('Already equipped for this life.');spend(gear.cost);if(gear.slot==='weapon')s.build.enhance=0;s.build[gear.slot]=id;emit(s,'purchase',gear.name+' · '+gear.desc+(sideSet(s)?' Set remembered · '+sideSet(s).name+'.':''));
}
export function cleanSideBuild(raw){const b=freshSideBuild();for(const slot of ['weapon','armor','relic'])if(SIDE_EQUIPMENT[raw?.[slot]]?.slot===slot)b[slot]=raw[slot];b.enhance=b.weapon&&Number.isInteger(raw?.enhance)?Math.max(0,Math.min(3,raw.enhance)):0;b.loan=Object.values(SIDE_IMPRINTS).some(a=>a.id===raw?.loan)?raw.loan:null;for(const id of ['haste','guard','quick','magnet','power','reach'])if(Number.isFinite(raw?.buffs?.[id])&&raw.buffs[id]>0)b.buffs[id]=Math.min(90,raw.buffs[id]);return b;}
