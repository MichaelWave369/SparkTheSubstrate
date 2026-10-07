import assert from 'node:assert/strict';

// Ordinary actions through the frozen v0.9 API and its actual checkpoint UI.
// No current dungeon engine, health injection, enemies or rewards are used.
export function playFirstEndless(h,{floors=5,start=true}={}){
 const api=h.window.SparkDungeon;if(start)api.start('computer');const checkpoints=[];
 for(let i=0;i<70000;i++){
  const s=api.observe();assert.notEqual(s.phase,'dead','The historical body fell on floor '+s.floor+' after '+i+' frames');
  if(s.floorsCleared>=floors)return {proof:h.observe(),state:s,checkpoints};
  if(s.phase==='resolve'){
   if(!checkpoints.some(c=>c.floor===s.floor))checkpoints.push({floor:s.floor,hp:s.player.hp,maxHp:s.player.maxHp,condition:s.condition.name});
   const gift=h.document.getElementById('game-overlay').querySelector('[data-action="dungeon-gifts"]');
   if(gift&&!gift.disabled)api.gifts();else api.next();continue;
  }
  if(s.phase==='boon'){
   const choices=s.choices.map(v=>v.id),priority=['regeneration','shell','edge','cadence','orbit','pierce','reach','magnet'];
   api.chooseGift(priority.find(id=>choices.includes(id))??choices[0]);continue;
  }
  const live=h.window.SparkDescent.observe(),p=s.player,tx=480+Math.cos(s.time*.7)*245,ty=300+Math.sin(s.time*.7)*170;
  const dx=tx-p.x,dy=ty-p.y,d=Math.hypot(dx,dy),danger=live.enemies.some(e=>Math.hypot(e.x-p.x,e.y-p.y)<100);
  api.control({x:dx/(d||1),y:dy/(d||1),dash:danger&&p.dashCooldown===0,power:p.powerCooldown===0,frames:1});
 }
 throw Error('Historical Endless did not reach floor '+floors+' within the bounded player run.');
}
