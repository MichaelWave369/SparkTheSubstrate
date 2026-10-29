import {DescentXRAdapter} from './spark-xr-adapters.js';
import {SparkXRRuntime} from './spark-xr-runtime.js';
import {LivingSparkHost} from './spark-living-host.js';
import {desktopXRSample} from './spark-xr-preview.js';
import {clamp} from './spark-xr-input.js';
import {loadVRComfort,storeVRComfort} from './spark-vr-comfort.js';
import {QUEST_ACCEPTANCE_CASES,createQuestDiagnostics,beginQuestDiagnostics,endQuestDiagnostics,recordQuestFrame,questAcceptanceReport,summarizeQuestDiagnostics} from './spark-vr-diagnostics.js';
const $=id=>document.getElementById(id),canvas=$('world'),keys=new Set(),latch={};
const descentGuide=$('living-guide').innerHTML;
const arenaGuide='<p><strong>Elemental Ascension</strong><br>Either trigger charges and releases a canonical Lumen Thread. Right grip / A dodges; left grip ducks. Left stick approaches or retreats, right stick snap-turns. Left X or right-stick click opens the pause menu; Y recenters and B exits.</p><h3>Desktop arena</h3><p class="keyboard">W/S approach/retreat · drag to aim · F or mouse hold/release cast · X dodge · Z/C lean · Ctrl duck · Tab wrist/pause · arrows select/turn · Enter confirm · B exit.</p><p>Both hands share the canonical special cooldown. Finish a best-of-three encounter, then restart through the pause menu. Arena records and campaign progression remain separate. <a href="./ascension.html">Standalone Rung 1 arena</a>.</p>';
let host,pointer=false,drag=null,yaw=0,pitch=0,lean=0,duck=0,lastPreview=null,choiceStamp='',factsStamp='';
const diagnostics=createQuestDiagnostics(),checks={};
let storage;try{storage=window.localStorage;}catch{storage=null;}
export const runtime=new SparkXRRuntime({canvas,adapter:new DescentXRAdapter(),
  settings:{...loadVRComfort(storage),reduced:matchMedia('(prefers-reduced-motion: reduce)').matches},
  onStatus:message=>{$('living-status').textContent=message;},
  onMode:mode=>{keys.clear();pointer=false;drag=null;lastPreview=null;for(const k of Object.keys(latch))delete latch[k];
    $('intro-overlay').hidden=mode!=='idle';$('living-vr').disabled=mode==='xr';$('living-desktop').disabled=mode==='xr';},
  onSettings:settings=>{for(const [key,value]of Object.entries(settings)){const control=$('living-'+key);if(!control)continue;
    if(control.type==='checkbox')control.checked=value;else control.value=String(value);}
    try{storeVRComfort(storage,settings);}catch{}},
  onSnapshot:scene=>{
    const stamp=[scene.roomId,scene.form,Math.ceil(scene.health),scene.phase,scene.level,scene.keys?.join(),scene.seals?.join(),Math.ceil(scene.cooldown)].join('|');
    if(stamp!==factsStamp){factsStamp=stamp;$('living-facts').textContent=scene.worldName+' · '+scene.roomName+' · '+scene.form.toUpperCase()+
      ' · HP '+Math.ceil(scene.health)+' / '+scene.maxHealth+' · '+scene.phase+' · power '+scene.cooldown.toFixed(1)+'s';
      $('living-objective').textContent=scene.target?scene.target.label+' · '+scene.target.reason:scene.notice||scene.roomDescription||'';}
    const choices=scene.choices||[],next=choices.map(x=>x.id).join('|');
    if(next!==choiceStamp){choiceStamp=next;$('living-choices').replaceChildren();
      for(const choice of choices){const button=document.createElement('button');button.textContent=choice.title;
        button.addEventListener('click',()=>{try{host.choose(choice.id);}catch(error){host.status(error.message);}});$('living-choices').append(button);}}
    if(runtime.mode!=='idle')host?.checkpointIfDue();
  },
  onSession:(event,kind)=>{if(event==='start')beginQuestDiagnostics(diagnostics,kind);else endQuestDiagnostics(diagnostics);},
  onFrame:metrics=>{recordQuestFrame(diagnostics,metrics);if(diagnostics.frames%90===0){const s=summarizeQuestDiagnostics(diagnostics);
    $('living-metrics').textContent=s.renderedFrames+' callbacks · '+s.framesWithTwoEyes+' two-eye views · p95 callback '+(s.frameIntervalMilliseconds.p95??'unmeasured')+' ms · not headset FPS';}}
});
host=new LivingSparkHost({runtime,storage,onStatus:message=>{$('living-status').textContent=message;},onMode:id=>{
  for(const mode of ['descent','duel'])$('mode-'+mode).setAttribute('aria-pressed',String(mode===id));
  $('living-selection').textContent=id==='descent'?'Descent selected · original VR checkpoint format':'Elemental Ascension selected · ephemeral Duel encounter';
  $('living-mode-label').textContent=id==='descent'?'DESCENT / SHARED XR':'ELEMENTAL ASCENSION / DUEL';
  $('living-guide').innerHTML=id==='descent'?descentGuide:arenaGuide;
  for(const control of ['save','resume','new'])$('living-'+control).disabled=id!=='descent';
}});
// Export the actual host for deterministic browser acceptance through the same public modules.
export {host};
function preview(now){
  const dt=lastPreview===null?0:Math.min(.05,(now-lastPreview)/1000);lastPreview=now;
  lean+=(((keys.has('KeyC')?1:0)-(keys.has('KeyZ')?1:0))*.25-lean)*Math.min(1,dt*12);
  duck+=(((keys.has('ControlLeft')||keys.has('ControlRight')) ? .3 : 0)-duck)*Math.min(1,dt*12);
  const s=desktopXRSample({yaw,pitch,lean,duck,move:(keys.has('KeyW')?1:0)-(keys.has('KeyS')?1:0),
    strafe:(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0),turn:(keys.has('ArrowRight')?1:0)-(keys.has('ArrowLeft')?1:0),
    rightTrigger:pointer||keys.has('KeyF')||keys.has('Enter')||latch.trigger,leftTrigger:false,
    dash:keys.has('Space')||latch.dash,dodge:host.mode==='duel'&&(keys.has('KeyX')||latch.dodge),
    interact:keys.has('KeyE')||latch.interact,wrist:keys.has('Tab')||latch.wrist,
    cycleForm:keys.has('KeyQ')||latch.cycle,pause:keys.has('Escape')||latch.pause,recenter:keys.has('KeyR')||latch.recenter,
    exit:keys.has('KeyB')||latch.exit});
  if(runtime.paused)s.hands.left.axes[3]=(keys.has('ArrowDown')?1:0)-(keys.has('ArrowUp')?1:0);
  for(const k of Object.keys(latch))delete latch[k];return s;
}
const act=fn=>()=>{try{void fn();}catch(error){host.status(error.message);}};
$('living-desktop').addEventListener('click',act(()=>runtime.startDesktop(preview)));
$('living-vr').addEventListener('click',act(()=>runtime.enter()));
$('living-wrist').addEventListener('click',()=>runtime.pause());
$('living-save').addEventListener('click',act(()=>host.save()));
$('living-resume').addEventListener('click',act(()=>host.restore()));
$('living-new').addEventListener('click',()=>host.newJourney());
$('living-exit').addEventListener('click',act(()=>host.returnToHub()));
for(const id of ['descent','duel'])$('mode-'+id).addEventListener('click',act(()=>host.setMode(id)));
for(const key of Object.keys(runtime.settings)){const control=$('living-'+key);if(!control)continue;
  control.addEventListener('change',()=>{runtime.configure({[key]:control.type==='checkbox'?control.checked:['movement','turn','vignette'].includes(key)?Number(control.value):control.value});if(key==='posture')runtime.recenter();});}
runtime.onSettings(runtime.settings);
const bindings={KeyF:'trigger',Enter:'trigger',Space:'dash',KeyE:'interact',KeyX:'dodge',Tab:'wrist',KeyQ:'cycle',Escape:'pause',KeyR:'recenter',KeyB:'exit'};
window.addEventListener('keydown',event=>{
  if(event.target?.closest?.('button,input,select,a'))return;
  if(['Space','Tab','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.code))event.preventDefault();
  if(event.repeat)return;keys.add(event.code);if(bindings[event.code])latch[bindings[event.code]]=true;
});
window.addEventListener('keyup',event=>keys.delete(event.code));
const interrupt=()=>{keys.clear();pointer=false;drag=null;for(const k of Object.keys(latch))delete latch[k];if(runtime.mode!=='idle')runtime.pause(true,'Browser interrupted · release controls and resume');};
window.addEventListener('blur',interrupt);document.addEventListener('visibilitychange',()=>{if(document.hidden)interrupt();});
canvas.addEventListener('pointerdown',event=>{canvas.focus();pointer=true;latch.trigger=true;drag={x:event.clientX,y:event.clientY,yaw,pitch};canvas.setPointerCapture?.(event.pointerId);});
canvas.addEventListener('pointermove',event=>{if(drag){yaw=drag.yaw-(event.clientX-drag.x)*.004;pitch=clamp(drag.pitch-(event.clientY-drag.y)*.004,-.8,.8);}});
canvas.addEventListener('pointerup',()=>{pointer=false;drag=null;});canvas.addEventListener('pointercancel',interrupt);
window.addEventListener('pagehide',()=>{if(host.mode==='descent'&&host.descent.state.ticks){try{host.save();}catch{}}void runtime.dispose();});
for(const c of QUEST_ACCEPTANCE_CASES){const label=document.createElement('label'),span=document.createElement('span'),select=document.createElement('select');
  label.className='field-case';span.textContent=c.label;select.setAttribute('aria-label',c.label);
  for(const [value,text]of [['not-tested','Not tested'],['pass','Passed on Quest'],['fail','Failed on Quest']]){const o=document.createElement('option');o.value=value;o.textContent=text;select.append(o);}
  select.addEventListener('change',()=>{checks[c.id]=select.value;});label.append(span,select);$('living-checks').append(label);}
$('living-report').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(questAcceptanceReport(diagnostics,checks),null,2)+'\n'],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download='spark-living-quest-report.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);});
