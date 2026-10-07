const path=(id,name,first,firstDesc,firstStats,second,secondDesc,secondStats)=>({id,name,nodes:[{id:id+'-1',name:first,desc:firstDesc,cost:1,stats:firstStats},{id:id+'-2',name:second,desc:secondDesc,cost:2,requires:id+'-1',specialty:true,stats:secondStats}]});
export const SKILL_TREES={
 spark:[path('radiance','Beacon','Far light','+12% weapon reach.',{range:.12},'Beacon','Lumen pulse is 40% wider and deals 25% more damage.',{powerRadius:.4,powerDamage:.25}),path('drift','Slipstream','Light feet','+8% movement speed.',{speed:.08},'Slipstream','Powers recover 20% faster; dashes recover 10% faster.',{powerCooldown:.2,dash:.1}),path('ember','Afterglow','Bright core','+8% weapon damage.',{damage:.08},'Afterglow','Clearing enemy bolts with Lumen pulse restores up to 12 health.',{pulseHeal:12})],
 human:[path('blade','Duelist','Remembered blade','+10% weapon damage.',{damage:.1},'Duelist','Deal 20% more weapon damage while above 70% health.',{healthyDamage:.2}),path('guard','Warden','Steady stance','Take 5% less damage.',{armor:.05},'Warden','Rally guards for two extra seconds and heals a living partner up to 10 HP.',{guardExtra:2,partnerHeal:10}),path('solace','Mender','Stubborn heart','+12 maximum health.',{health:12},'Mender','Rally restores up to 15 additional health.',{powerHeal:15})],
 computer:[path('scan','Oracle','Long scan','+15% weapon reach.',{range:.15},'Oracle','Prism volleys become seeking projectiles.',{homingVolley:1}),path('clock','Clocksmith','Fast clock','+8% attack speed.',{haste:.08},'Clocksmith','Overclock lasts two extra seconds and recovers 20% faster.',{overclockExtra:2,powerCooldown:.2}),path('barrier','Firewall','Shielded circuit','Take 6% less damage.',{armor:.06},'Firewall','Overclock clears nearby enemy bolts and guards for two seconds.',{firewall:1})],
 animal:[path('hunt','Hunter','Sharp instinct','+8% weapon damage.',{damage:.08},'Hunter','Pounce deals 50% more damage and recovers 25% faster.',{powerDamage:.5,powerCooldown:.25}),path('runner','Windrunner','Long stride','+8% movement speed.',{speed:.08},'Windrunner','Pounce travels 60 pixels farther with a longer evade window.',{pounceLength:60,pounceIframes:.2}),path('pack','Packheart','Warm blood','Regenerate 0.25 health per second.',{regen:.25},'Packheart','Pounce restores up to 8 health to you and a living partner.',{powerHeal:8,partnerHeal:8})],
 tree:[path('growth','Ancient','Deep roots','+18 maximum health.',{health:18},'Ancient','Roots last one second longer; regenerate 0.8 additional HP/sec.',{rootExtra:1,regen:.8}),path('thorns','Thornheart','Spreading thorns','+15% weapon reach.',{range:.15},'Thornheart','Root hold deals 80% more damage.',{powerDamage:.8}),path('shelter','Grovekeeper','Living shelter','Take 5% less damage.',{armor:.05},'Grovekeeper','Root hold restores up to 20 extra HP and heals a living partner up to 18 HP.',{powerHeal:20,partnerHeal:18})],
 rock:[path('mass','Earthbreaker','Heavy memory','+10% weapon damage.',{damage:.1},'Earthbreaker','Fault guard is 35% wider and deals 50% more damage.',{powerRadius:.35,powerDamage:.5}),path('bulwark','Bastion','Dense shell','Take 5% less damage.',{armor:.05},'Bastion','Fault guard lasts two extra seconds and clears nearby enemy bolts.',{guardExtra:2,clearBolts:1}),path('stride','Rolling Stone','Worn smooth','+8% movement speed.',{speed:.08},'Rolling Stone','Dashes recover 25% faster and strike nearby foes once for 40 damage.',{dash:.25,dashStrike:40})]
};
export const MASTERY_PER_POINT=20,MAX_POINTS=5;
export const blankTraining=()=>Object.fromEntries(Object.keys(SKILL_TREES).map(form=>[form,{xp:0,learned:[]}]));
export function prepareTraining(training){const next=blankTraining();for(const form of Object.keys(next))if(training?.[form])next[form]=structuredClone(training[form]);return next;}
export const allNodes=form=>(SKILL_TREES[form]??[]).flatMap(branch=>branch.nodes);
export const earnedPoints=entry=>Math.min(MAX_POINTS,Math.floor((entry?.xp??0)/MASTERY_PER_POINT));
export const spentPoints=(form,entry)=>allNodes(form).filter(node=>entry?.learned?.includes(node.id)).reduce((sum,node)=>sum+node.cost,0);
export const availablePoints=(form,entry)=>earnedPoints(entry)-spentPoints(form,entry);
export const specialty=(training,form)=>allNodes(form).find(node=>node.specialty&&training?.[form]?.learned.includes(node.id))??null;
export function skillStats(training,form){const stats={health:0,damage:0,range:0,speed:0,haste:0,armor:0,regen:0,dash:0,powerRadius:0,powerDamage:0,powerCooldown:0,powerHeal:0,guardExtra:0,partnerHeal:0,rootExtra:0,pounceLength:0,pounceIframes:0,overclockExtra:0,homingVolley:0,healthyDamage:0,pulseHeal:0,firewall:0,clearBolts:0,dashStrike:0};for(const node of allNodes(form))if(training?.[form]?.learned?.includes(node.id))for(const [key,value]of Object.entries(node.stats))stats[key]+=value;return stats;}
export function skillStatus(training,form,id){
 const entry=training?.[form]??{xp:0,learned:[]},node=allNodes(form).find(n=>n.id===id);
 if(!node)return {available:false,reason:'Unknown skill.'};
 if(entry.learned.includes(id))return {available:false,learned:true,reason:'Remembered'};
 if(node.requires&&!entry.learned.includes(node.requires))return {available:false,reason:'Learn '+allNodes(form).find(n=>n.id===node.requires).name+' first.'};
 if(node.specialty&&specialty(training,form))return {available:false,reason:'One specialty per vessel. Rebuild to change it.'};
 if(availablePoints(form,entry)<node.cost)return {available:false,reason:'Needs '+node.cost+' mastery points.'};
 return {available:true,reason:'Learn · '+node.cost+' '+(node.cost===1?'point':'points')};
}
export function learnSkill(meta,form,id){const next=structuredClone(meta);next.training=prepareTraining(meta.training);const status=skillStatus(next.training,form,id);if(!status.available)throw Error(status.reason);next.training[form].learned.push(id);return next;}
export function rebuildTree(meta,form){if(!SKILL_TREES[form])throw Error('Unknown vessel.');const next=structuredClone(meta);next.training=prepareTraining(meta.training);next.training[form].learned=[];return next;}
export const validEarned=value=>!!value&&typeof value==='object'&&!Array.isArray(value)&&Object.entries(value).every(([form,xp])=>!!SKILL_TREES[form]&&Number.isFinite(xp)&&xp>=0&&xp<=1000000);
export function validTraining(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(form=>!SKILL_TREES[form]))return false;
 return Object.entries(value).every(([form,entry])=>{
  const nodes=allNodes(form);
  return !!entry&&Number.isInteger(entry.xp)&&entry.xp>=0&&entry.xp<=1000000&&Array.isArray(entry.learned)&&entry.learned.length<=4&&new Set(entry.learned).size===entry.learned.length&&entry.learned.every(id=>nodes.some(node=>node.id===id))&&nodes.filter(node=>node.specialty&&entry.learned.includes(node.id)).length<=1&&nodes.every(node=>!entry.learned.includes(node.id)||!node.requires||entry.learned.includes(node.requires))&&availablePoints(form,entry)>=0;
 });
}
export function bankMastery(meta,earned={}){const next=structuredClone(meta);next.training=prepareTraining(meta.training);for(const [form,xp]of Object.entries(earned))if(SKILL_TREES[form])next.training[form].xp=Math.min(1000000,next.training[form].xp+Math.round(xp));return next;}
