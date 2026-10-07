// Device keepsakes. This store deliberately has no campaign keys, seals or essence.
export const SUBSTRATE_KEY='spark-substrate-keepsakes-v12';
export const SPARK_CARDS={
 'first-player':{name:'First Player',memory:'The Nursery remembers a golden cursor.',mode:'table',rule:'Add 1 Pulse to one scene.',stat:'pulse',value:1,clue:'A memory lies among the names in Glass Causeway.'},
 feather:{name:'Feather',memory:'Nacre kept a road between worlds.',mode:'swarm',rule:'Memory fragments are drawn from 45 steps farther away.',clue:'Clear Nacre’s Reliquary.'},
 'ivory-key':{name:'Ivory Key',memory:'A lock is not the edge of the world.',mode:'table',rule:'Add 1 Root to one sealed-door scene.',stat:'root',value:1,clue:'The Reliquary remembers what a key was made to answer.'},
 'second-movement':{name:'Second Movement',memory:'The Cantor remembers the tools beneath its armor.',mode:'duel',rule:'Play the Quickening condition for both fighters.',condition:'quick',clue:'Defeat a Cantor echo, or meet a guardian on an endless rung.'},
 'living-vessel':{name:'Living Vessel',memory:'The wound has the same carrier in every mirror.',mode:'table',rule:'Add 1 Root to one scene.',stat:'root',value:1,clue:'The Mirror Nursery holds a shared reflection.'},
 'buried-circuit':{name:'Buried Circuit',memory:'SIX began with kindness without reward.',mode:'table',rule:'Add 1 Pulse to one scene.',stat:'pulse',value:1,clue:'Clear Machine Sepulcher.'},
 'unbound-conduit':{name:'Unbound Conduit',memory:'A circuit can carry a way out.',mode:'swarm',rule:'Memory fragments move toward your vessel 15% faster.',clue:'Return the current in the Unbound Conduit.'},
 'glass-oath':{name:'Glass Oath',memory:'A name survives the chamber that stole it.',mode:'duel',rule:'Play the Glass oath condition for both fighters.',condition:'glass',clue:'A match point on Threshold Glass holds this memory.'},
 'root-passage':{name:'Root Passage',memory:'Aster’s branches grew without permission.',mode:'table',rule:'Add 2 Root to one scene.',stat:'root',value:2,clue:'Clear the Root Cathedral.'},
 'fault-breaker':{name:'Fault Breaker',memory:'Morrow remembers that a mountain can become a path.',mode:'table',rule:'Add 2 Fault to one scene.',stat:'fault',value:2,clue:'Clear Basalt Reach.'},
 'nacres-error':{name:'Nacre’s Error',memory:'The Maker never owned what passes through a body.',mode:'journal',rule:'Remember Nacre’s words in the keepsake journal.',clue:'Break a met Collector’s alcove seal, or read a vault memory.'},
 'the-uncreated':{name:'The Uncreated',memory:'The seventh realm has never belonged to the map.',mode:'journal',rule:'Remember the seventh realm in the keepsake journal.',clue:'Clear a chamber in the Uncreated, or finish six Table scenes.'}
};
export const VAULT_ALCOVES=[
 {id:'surge',name:'Surge fire',cost:6,desc:'Auto-fire plus a held-button volley every four seconds.',card:'unbound-conduit'},
 {id:'seal-break',name:'Seal break',cost:8,desc:'Duel condition: the first hit of a round ignores a block.',card:'glass-oath'},
 {id:'collector',name:'Collector',cost:6,requires:'collector',desc:'Meeting unlocks this fighter. Break its encounter seal to reveal a card.',card:'nacres-error'},
 {id:'archon',name:'Archon',cost:8,requires:'archon',desc:'Meeting unlocks this fighter. Break its encounter seal to reveal a card.',card:'buried-circuit'},
 {id:'gold-trail',name:'Gold spark trail',cost:10,desc:'A gold trace follows your vessel’s dash.',card:'feather'},
 {id:'stage-palette',name:'Glass at dusk',cost:10,desc:'A second palette for the existing Threshold Glass duel stage.',card:'glass-oath'},
 {id:'pulse-boon',name:'SIX’s Question',cost:5,desc:'Table boon: +1 Pulse for the session.',card:'buried-circuit'},
 {id:'root-boon',name:'Aster’s Shelter',cost:5,desc:'Table boon: +1 Root for the session.',card:'root-passage'},
 {id:'fault-boon',name:'Morrow’s Patience',cost:5,desc:'Table boon: +1 Fault for the session.',card:'fault-breaker'}
];
export const FIGHTER_MEETINGS={collector:{room:'glass',name:'Glass Causeway'},archon:{room:'glass',name:'Glass Causeway'},cantor:{room:'forge',name:'The Echo Forge · win a guardian rematch'}};
const unique=(raw,allowed)=>[...new Set(Array.isArray(raw)?raw.filter(v=>allowed.includes(v)):[])];
const integer=(v,max=1e9)=>Number.isSafeInteger(v)&&v>=0?Math.min(max,v):0;
export function cleanKeepsakes(raw){return {version:1,coins:integer(raw?.coins),unlocks:unique(raw?.unlocks,VAULT_ALCOVES.map(a=>a.id)),cards:unique(raw?.cards,Object.keys(SPARK_CARDS)),met:unique(raw?.met,Object.keys(FIGHTER_MEETINGS)),inhabited:unique(raw?.inhabited,['spark','human','computer','animal','tree','rock']),cantor:!!raw?.cantor,chambers:unique(raw?.chambers,Array.isArray(raw?.chambers)?raw.chambers.filter(id=>typeof id==='string'&&id.length<60):[]).slice(-150),receipts:unique(raw?.receipts,Array.isArray(raw?.receipts)?raw.receipts.filter(id=>typeof id==='string'&&id.length<140):[]).slice(-1500),visits:unique(raw?.visits,Array.isArray(raw?.visits)?raw.visits.filter(id=>typeof id==='string'&&id.length<140):[]).slice(-1500),journal:(Array.isArray(raw?.journal)?raw.journal.filter(e=>e&&typeof e.text==='string'&&typeof e.title==='string').map(e=>({id:String(e.id).slice(0,140),title:e.title.slice(0,100),text:e.text.slice(0,600)})):[]).slice(-150)};}
export function loadKeepsakes(storage){try{return cleanKeepsakes(JSON.parse(storage.getItem(SUBSTRATE_KEY)??'null'));}catch{return cleanKeepsakes(null);}}
export function saveKeepsakes(storage,state){storage.setItem(SUBSTRATE_KEY,JSON.stringify(state));}
export const hasAlcove=(state,id)=>!!state?.unlocks?.includes(id);
export function fighterAvailable(state,id){return ['spark','human','computer','animal','tree','rock'].includes(id)||id==='cantor'&&state.cantor||['collector','archon'].includes(id)&&state.met.includes(id);}
export function rememberEncounter(state,{forms=[],enemies=[],cantorWon=false}={}){for(const id of forms)if(['spark','human','computer','animal','tree','rock'].includes(id)&&!state.inhabited.includes(id))state.inhabited.push(id);for(const id of enemies)if(FIGHTER_MEETINGS[id]&&!state.met.includes(id))state.met.push(id);if(cantorWon)state.cantor=true;return state;}
export function awardCoins(state,amount,receipt){if(!Number.isSafeInteger(amount)||amount<0||amount>20||typeof receipt!=='string'||receipt.length>140)throw Error('Invalid coin memory.');if(state.receipts.includes(receipt))return 0;state.receipts.push(receipt);state.receipts=state.receipts.slice(-1500);state.coins=Math.min(1e9,state.coins+amount);return amount;}
export function findSparkCard(state,id,visit,{rewardCoins=true}={}){if(!SPARK_CARDS[id]||typeof visit!=='string'||visit.length>140)throw Error('Unknown card or visit.');if(state.visits.includes(visit))return null;state.visits.push(visit);state.visits=state.visits.slice(-1500);const duplicate=state.cards.includes(id);let coins=0;if(duplicate){if(rewardCoins)coins=awardCoins(state,2,'duplicate:'+visit);}else{state.cards.push(id);if(rewardCoins)coins=awardCoins(state,1,'card:'+visit);const card=SPARK_CARDS[id];state.journal.push({id:'card:'+id,title:card.name,text:card.memory+' '+card.rule});state.journal=state.journal.slice(-150);}return {id,name:SPARK_CARDS[id].name,duplicate,coins};}
export function vaultStatus(state,id){const a=VAULT_ALCOVES.find(a=>a.id===id);if(!a)throw Error('Unknown alcove.');return {...a,owned:hasAlcove(state,id),locked:!!a.requires&&!state.met.includes(a.requires),affordable:state.coins>=a.cost};}
export function breakVaultSeal(state,id){const a=vaultStatus(state,id);if(a.owned)throw Error('This seal is already open.');if(a.locked)throw Error('Meet '+a.name+' in '+FIGHTER_MEETINGS[a.requires].name+' first.');if(!a.affordable)throw Error('This seal needs '+a.cost+' Substrate coins.');state.coins-=a.cost;state.unlocks.push(id);const card=findSparkCard(state,a.card,'vault:'+id,{rewardCoins:false});return {alcove:id,cost:a.cost,card};}
const CHAMBER_CARDS={glass:'first-player',machine:'buried-circuit',roots:'root-passage',basalt:'fault-breaker',conduit:'unbound-conduit',reliquary:'feather',nursery:'living-vessel',forge:'second-movement',crown:'ivory-key'};
export function rewardChamber(state,room,visit,{world='stratum',endless=false,floor=0}={}){
 let coins=0;if(endless)coins=awardCoins(state,2+(floor%5===0?1:0),'floor:'+visit);else if(!state.chambers.includes(room)){state.chambers.push(room);coins=awardCoins(state,2,'chamber:'+room);}
 const card=endless?(floor%5===0?'second-movement':['buried-circuit','living-vessel','unbound-conduit','fault-breaker'][Math.max(0,floor-1)%4]):CHAMBER_CARDS[room]??(world==='uncreated'?'the-uncreated':null);
 return {coins,card:card?findSparkCard(state,card,visit):null};
}
export function rewardDuel(state,match,visit){const won=match.winner===0;return {coins:won?awardCoins(state,3+(match.ladder?2:0),'duel:'+visit):0,card:won?findSparkCard(state,match.forms.includes('cantor')?'second-movement':match.stage==='glass'?'glass-oath':'ivory-key',visit):null};}
