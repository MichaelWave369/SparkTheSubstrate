import assert from 'node:assert/strict';

// All actions go through the real preserved API or its original buttons.
// No health, bank, mastery, inventory or completion flag is supplied by a test.
export function oldAction(h, action, data={}) {
 const root=h.document.querySelector('dialog[open]')??h.document;
 const button=root.querySelectorAll('[data-action="'+action+'"]').find(b=>!b.disabled&&Object.entries(data).every(([k,v])=>b.dataset[k]===v));
 assert.ok(button,'Original '+action+' button is unavailable');button.click();
}
export function settleOldChoices(api) {
 for(let i=0;i<30;i++){
  const s=api.observe();
  if(s.phase==='boon'){const id=['regeneration','shell','edge','cadence','orbit','companion'].find(id=>s.choices.includes(id))??s.choices[0];api.chooseGift(id);}
  else if(s.phase==='resolve')api.resolve(2);
  else return;
 }
 throw Error('Historical choices did not settle');
}
export function oldGate(api, direction, destination) {
 settleOldChoices(api);
 for(let i=0;i<1600&&api.observe().room!==destination;i++){
  const s=api.observe(),gate=s.exits.find(g=>g.direction===direction);assert.ok(gate,direction+' gate missing');
  const dx=gate.x-s.player.x,dy=gate.y-s.player.y,d=Math.hypot(dx,dy);
  api.control({x:Math.abs(dx)<3?0:dx/(d||1),y:Math.abs(dy)<3?0:dy/(d||1),interact:d<45,frames:1});
 }
 assert.equal(api.observe().room,destination);
}
export function clearOldChamber(api, room) {
 assert.equal(api.observe().room,room);
 for(let i=0;i<15000&&!api.observe().cleared.includes(room);i++){
  settleOldChoices(api);const s=api.observe();assert.equal(s.phase,'playing','Historical body fell in '+room+' at '+i);
  const p=s.player,tx=480+Math.cos(i*.013)*240,ty=300+Math.sin(i*.013)*165,dx=tx-p.x,dy=ty-p.y,d=Math.hypot(dx,dy);
  api.control({x:dx/(d||1),y:dy/(d||1),dash:s.enemies.some(e=>Math.hypot(e.x-p.x,e.y-p.y)<80)&&p.dashReady,power:!!s.power&&s.power.cooldownRemaining===0&&s.enemies.some(e=>Math.hypot(e.x-p.x,e.y-p.y)<150),frames:1});
 }
 assert.ok(api.observe().cleared.includes(room));settleOldChoices(api);
}
function bankOldLife(h) {
 oldAction(h,'pause');oldAction(h,'end');oldAction(h,'end-confirm');assert.equal(h.window.SparkDescent.observe().phase,'dead');
}
export function playFirstForge(h) {
 const api=h.window.SparkDescent;api.start('spark');oldGate(api,'north','glass');clearOldChamber(api,'glass');bankOldLife(h);
 const earned=api.observe().essence;assert.ok(earned>=3,'The native first life must earn its enhancement');
 oldAction(h,'forge');oldAction(h,'enhance',{item:'wayfarer'});
 assert.equal(api.observe().essence,earned-3);const proof=h.observe();assert.equal(proof.enhancedItems,1);assert.equal(proof.livesRemembered,1);
 return {proof,earned,remaining:api.observe().essence};
}
export function playFirstMastery(h) {
 const api=h.window.SparkDescent;api.start('spark');oldGate(api,'north','glass');clearOldChamber(api,'glass');oldGate(api,'east','machine');clearOldChamber(api,'machine');
 assert.equal(api.observe().masteryEarned.spark,20);assert.equal(h.observe().rememberedSkills,0,'Unbanked practice is not a learned skill');bankOldLife(h);
 assert.equal(api.observe().rememberedTraining.spark.xp,20);oldAction(h,'skills');oldAction(h,'learn-skill',{form:'spark',skill:'radiance-1'});
 assert.equal(h.observe().activeSkills,0,'A skill learned between lives does not rewrite the ended body');oldAction(h,'close-dialog');oldAction(h,'reincarnate');
 assert.ok(api.observe().offeredForms.includes('spark'),'The original next offer should retain Spark');api.start('spark');assert.ok(api.observe().training.spark.learned.includes('radiance-1'));
 assert.equal(h.observe().powersUsed,0);api.power();const proof=h.observe();assert.equal(proof.rememberedSkills,1);assert.equal(proof.activeSkills,1);assert.equal(proof.powersUsed,1);
 return {proof,mastery:api.observe().rememberedTraining.spark};
}
