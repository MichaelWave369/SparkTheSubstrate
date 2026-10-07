import {SIDE_ROOMS,createSideGuardianMemory} from './sideways-engine.js?v=0.17.0';
export const SIDE_MEMORY_KEY='spark-substrate-sideways-rematch-v1';
export const guardianMemories=s=>Object.entries(SIDE_ROOMS).filter(([,r])=>r.boss).map(([id,r])=>({id,name:r.name,kind:r.boss,owned:s.cleared.includes(id)}));
// A memory contains only encounter state. The parent journey is never written
// by this serializer, and imported encounter data cannot contain a reward.
export function memorySave(parent,s){if(!s.practice)throw Error('Not a guardian memory.');const e=s.enemies.find(e=>e.boss),p=s.player;return {schema:1,parent:parent.id,room:s.room,form:s.form,phase:s.phase,time:s.time,hp:p.hp,x:p.x,y:p.y,facing:p.facing,damage:s.damage,bestCombo:s.bestCombo,guardian:{hp:e.hp,x:e.x}};}
export function restoreMemory(raw,parent){
 const number=(n,a,b)=>Number.isFinite(n)&&n>=a&&n<=b;
 if(!raw||raw.schema!==1||raw.parent!==parent?.id||!parent.forms.includes(raw.form)||!['playing','fallen','complete'].includes(raw.phase)||!number(raw.time,0,1e9)||!number(raw.hp,0,180)||!number(raw.damage,0,1e9)||!Number.isSafeInteger(raw.bestCombo)||raw.bestCombo<0||raw.bestCombo>1e6)return null;
 let s;try{s=createSideGuardianMemory(parent,raw.room);}catch{return null;}const e=s.enemies[0],r=SIDE_ROOMS[s.room];
 if(!number(raw.x,28,r.width-28)||!number(raw.y,-100,r.height+60)||!number(raw.guardian?.hp,0,e.maxHp)||!number(raw.guardian?.x,250,r.width-100)||raw.phase==='fallen'&&raw.hp!==0||raw.phase==='playing'&&(raw.hp===0||raw.guardian.hp===0)||raw.phase==='complete'&&raw.guardian.hp!==0)return null;
 s.form=raw.form;s.phase=raw.phase;s.time=raw.time;s.damage=raw.damage;s.bestCombo=raw.bestCombo;s.player.hp=raw.hp;s.player.x=raw.x;s.player.y=raw.y;s.player.facing=raw.facing===-1?-1:1;s.player.grounded=false;e.hp=raw.guardian.hp;e.x=raw.guardian.x;e.clock=1.2;
 s.notice=raw.phase==='playing'?'Guardian memory returns · the next pattern is announced again.':'Guardian memory complete.';return s;
}
export function loadMemory(storage,parent){try{return restoreMemory(JSON.parse(storage.getItem(SIDE_MEMORY_KEY)??'null'),parent);}catch{return null;}}
export function saveMemory(storage,parent,s){storage.setItem(SIDE_MEMORY_KEY,JSON.stringify(memorySave(parent,s)));}
export function clearMemory(storage){storage.removeItem(SIDE_MEMORY_KEY);}
