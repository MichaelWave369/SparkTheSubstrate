import {DescentXRAdapter} from './spark-xr-adapters.js';
import {SparkXRRuntime} from './spark-xr-runtime.js';
// The established route keeps its desktop controls and UI. Its immersive path
// uses the same tracked input, lifecycle, hands and menus as the Living hub.
export function legacyXRBridge({canvas,getState,setState,save,restore,onStatus,onMode,onSnapshot,onFrame,onSession,onSettings,settings}){
 const adapter=new DescentXRAdapter(getState());Object.defineProperty(adapter,'state',{get:getState,set:setState});
 const runtime=new SparkXRRuntime({canvas,adapter,settings,onStatus,onMode,onSnapshot,onFrame,onSession,onSettings});
 runtime.menuExtras=()=>{
  const s=adapter.snapshot(),rows=s.choices.map(choice=>[choice.title,()=>{adapter.choose(choice.id);runtime.pause(adapter.state.run.phase!=='playing');}]);
  rows.push(['Save VR checkpoint',save],['Restore VR checkpoint',()=>{restore();runtime.recenter();}]);
  for(const gate of s.gates)rows.push([(gate.entry.available?'Enter ':'Inspect ')+gate.direction.toUpperCase()+' · '+gate.toName,()=>{
   if(gate.entry.available){adapter.enterGate(gate.direction);runtime.pause(false);}else{runtime.pauseReason=gate.entry.reason||gate.reason;onStatus(runtime.pauseReason);}}]);
  if(s.morphAvailable)for(const form of s.availableForms)rows.push(['Become '+form,()=>adapter.morph(form)]);
  rows.push(['Combat: '+s.combatProfile,()=>runtime.configure({combatProfile:s.combatProfile==='classic'?'spellcraft':'classic'})],
    ['Casting hand: '+s.dominantHand,()=>runtime.configure({dominantHand:s.dominantHand==='left'?'right':'left'})]);
  return rows;
 };
 return runtime;
}
