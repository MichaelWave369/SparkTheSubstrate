// Deterministic controlled scenarios for byte-level main-before-Rung-3 receipts.
// Earned-form/equipment fixtures here are not campaign playthrough evidence.
export function legacyCombatScenario(engine,{form,mode='auto',partner=false,weapon=null,guardian=false}){
 const meta=engine.createMeta();if(weapon){meta.inventory[weapon]=1;meta.loadout.weapon=weapon;}
 const run=engine.createRun(meta,'spark',369);run.abilities.push('morph');engine.morphRun(run,form);
 if(partner)engine.addPartner(run,'human');
 if(guardian){run.room='cistern';run.cleared.push('cistern');run.player.y=485;run.player.gateGrace=0;engine.enterGate(run,'south');}
 else{run.player.y=115;if(run.partner){run.partner.x=run.player.x+20;run.partner.y=120;}engine.enterGate(run,'north');}
 for(let frame=0;frame<420;frame++){
  if(run.phase==='resolve'){engine.resolveChamber(run,0);continue;}
  if(run.phase==='boon'){engine.chooseBoon(run,run.choices[0]);continue;}
  if(run.phase!=='playing')break;
  const input={x:Math.cos(frame*.03),y:Math.sin(frame*.03),fireMode:mode,fire:frame%100<30,dash:frame%90===0,power:frame%120===0};
  engine.stepRun(run,{...input,...(partner?{partner:{...input,x:-input.x,y:-input.y}}:{})},1/60);
 }
 return run;
}
