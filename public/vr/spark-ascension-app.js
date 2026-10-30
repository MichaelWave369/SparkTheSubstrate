import {SparkXRRuntime} from './spark-xr-runtime.js';
import {installXRControls} from './spark-xr-controls.js';
import {DuelXRAdapter} from './spark-xr-adapters.js';
import {desktopXRSample} from './spark-xr-preview.js';
import {clamp} from './spark-xr-input.js';
import {QUEST_ACCEPTANCE_CASES,createQuestDiagnostics,beginQuestDiagnostics,
  endQuestDiagnostics,recordQuestFrame,questAcceptanceReport,summarizeQuestDiagnostics} from './spark-vr-diagnostics.js';

const $=id=>document.getElementById(id),canvas=$('world'),keys=new Set();
let pointer=false,drag=null,yaw=0,pitch=0,lean=0,duck=0,lastPreview=null,interrupted=false,lastStamp='';
const triggerLatch={left:false,right:false};
const diagnostics=createQuestDiagnostics(),checks={};
const adapter=new DuelXRAdapter();
export const runtime=new SparkXRRuntime({canvas,adapter,
  settings:{reduced:globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true},
  onStatus:message=>{$('arena-status').textContent=message;},
  onMode:mode=>{
    $('enter-arena-vr').disabled=mode==='xr';$('arena-desktop').disabled=mode==='xr';
    $('intro-overlay').hidden=mode!=='idle';
    keys.clear();pointer=false;drag=null;lastPreview=null;triggerLatch.left=triggerLatch.right=false;
  },
  onSnapshot:scene=>{
    const stamp=[Math.ceil(scene.health),Math.ceil(scene.enemyHealth),scene.round,scene.phase,
      Math.ceil(scene.cooldown),scene.rounds.join(':')].join('|');
    if(stamp!==lastStamp){
      lastStamp=stamp;$('arena-facts').textContent='Round '+scene.round+' · '+scene.rounds.join(' : ')+
        ' · HP '+Math.ceil(scene.health)+' / '+scene.maxHealth+' · Archon '+Math.ceil(scene.enemyHealth)+
        ' · Cast recovery '+scene.cooldown.toFixed(1)+'s · '+scene.phase;
      if(scene.phase==='finished')$('arena-status').textContent=scene.notice+' · Restart for another full encounter.';
    }
  },
  onSettings:settings=>{
    for(const [key,value] of Object.entries(settings)){
      const control=$('arena-'+key);if(!control)continue;
      if(control.type==='checkbox')control.checked=value;else control.value=String(value);
    }
  },
  onSession:(event,kind)=>{if(event==='start')beginQuestDiagnostics(diagnostics,kind);else endQuestDiagnostics(diagnostics);},
  onFrame:metrics=>{
    recordQuestFrame(diagnostics,metrics);
    if(diagnostics.frames%90===0){const s=summarizeQuestDiagnostics(diagnostics);
      $('arena-metrics').textContent='XR frames '+s.renderedFrames+' · Two-eye callbacks '+s.framesWithTwoEyes+
        ' · callback median '+(s.frameIntervalMilliseconds.median??'unmeasured')+' ms · not headset FPS';}
  }
});
function preview(now){
  const dt=lastPreview===null?0:Math.min(.05,(now-lastPreview)/1000);lastPreview=now;
  const targetLean=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0);
  lean+=(targetLean*.30-lean)*Math.min(1,dt*12);
  duck+=(((keys.has('ControlLeft')||keys.has('ControlRight')) ? .32 : 0)-duck)*Math.min(1,dt*12);
  const sample=desktopXRSample({yaw,pitch,lean,duck,
    move:runtime.paused?0:(keys.has('KeyW')?1:0)-(keys.has('KeyS')?1:0),
    turn:(keys.has('ArrowRight')?1:0)-(keys.has('ArrowLeft')?1:0),
    dodgeDirection:targetLean,leftTrigger:keys.has('KeyF')||triggerLatch.left,
    rightTrigger:pointer||keys.has('Space')||keys.has('Enter')||triggerLatch.right,dodge:keys.has('KeyX'),
    pause:keys.has('Escape'),recenter:keys.has('KeyR'),exit:keys.has('KeyB'),missingPose:interrupted});
  if(runtime.paused)sample.hands.left.axes[3]=(keys.has('ArrowDown')?1:0)-(keys.has('ArrowUp')?1:0);
  interrupted=false;triggerLatch.left=triggerLatch.right=false;return sample;
}
$('arena-desktop').addEventListener('click',()=>{try{runtime.startDesktop(preview);}catch(error){$('arena-status').textContent=error.message;}});
$('enter-arena-vr').addEventListener('click',()=>void runtime.enter());
$('arena-pause').addEventListener('click',()=>runtime.pause());
$('arena-recenter').addEventListener('click',()=>runtime.recenter());
$('arena-restart').addEventListener('click',()=>{adapter.restart();runtime.recenter();});
$('arena-exit').addEventListener('click',()=>void runtime.exit());
$('arena-interrupt').addEventListener('click',()=>{interrupted=true;runtime.pause(true,'Simulated tracking interruption · desktop test only');});
for(const key of Object.keys(runtime.settings)){
  const control=$('arena-'+key);if(!control)continue;
  control.addEventListener('change',()=>{
    const value=control.type==='checkbox'?control.checked:['movement','turn','vignette'].includes(key)?Number(control.value):control.value;
    runtime.configure({[key]:value});if(key==='posture')runtime.recenter();
  });
}
runtime.onSettings(runtime.settings);
installXRControls(runtime);
window.addEventListener('keydown',event=>{
  if(event.target?.closest?.('input,select,button,a'))return;
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.code))event.preventDefault();
  if(event.code==='Space'||event.code==='Enter')triggerLatch.right=true;
  if(event.code==='KeyF')triggerLatch.left=true;
  keys.add(event.code);
});
window.addEventListener('keyup',event=>keys.delete(event.code));
const interruptedWindow=()=>{keys.clear();pointer=false;drag=null;triggerLatch.left=triggerLatch.right=false;if(runtime.mode!=='idle')runtime.pause(true,'Browser interrupted · explicitly resume');};
window.addEventListener('blur',interruptedWindow);
document.addEventListener('visibilitychange',()=>{if(document.hidden)interruptedWindow();});
canvas.addEventListener('pointerdown',event=>{
  canvas.focus();pointer=true;triggerLatch.right=true;drag={x:event.clientX,y:event.clientY,yaw,pitch};canvas.setPointerCapture?.(event.pointerId);
});
canvas.addEventListener('pointermove',event=>{
  if(!drag)return;yaw=drag.yaw-(event.clientX-drag.x)*.004;
  pitch=clamp(drag.pitch-(event.clientY-drag.y)*.004,-.7,.7);
});
canvas.addEventListener('pointerup',()=>{pointer=false;drag=null;});
canvas.addEventListener('pointercancel',()=>{pointer=false;drag=null;runtime.pause(true,'Pointer interrupted');});
canvas.tabIndex=0;
window.addEventListener('pagehide',()=>void runtime.dispose());
for(const item of QUEST_ACCEPTANCE_CASES){
  const label=document.createElement('label'),span=document.createElement('span'),select=document.createElement('select');
  label.className='field-case';span.textContent=item.label;select.setAttribute('aria-label',item.label);
  for(const [value,text] of [['not-tested','Not tested'],['pass','Passed on Quest'],['fail','Failed on Quest']]){
    const option=document.createElement('option');option.value=value;option.textContent=text;select.append(option);
  }
  select.addEventListener('change',()=>{checks[item.id]=select.value;});label.append(span,select);$('arena-field-checks').append(label);
}
$('arena-report').addEventListener('click',()=>{
  const report=questAcceptanceReport(diagnostics,checks),blob=new Blob([JSON.stringify(report,null,2)+'\n'],{type:'application/json'});
  const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='spark-ascension-quest-report.json';
  document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
});
