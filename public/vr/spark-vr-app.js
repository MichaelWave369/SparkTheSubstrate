import {legacyXRBridge} from './spark-vr-legacy-xr.js';
import {installXRControls} from './spark-xr-controls.js';
import {
  createVRPreview,stepVRPreview,vrRoomSnapshot,worldAt,
  chooseVRPhase,nextVRForm,vrPhaseChoices,VR_SIM_STEP
} from './spark-vr-model.js';
import {saveVRCheckpoint,loadVRCheckpoint,clearVRCheckpoint} from './spark-vr-save.js';
import {multiply4,projection4,lookAt4,worldRoot4} from './spark-vr-math.js';
import {SparkVRRenderer} from './spark-vr-renderer.js';
import {
  QUEST_ACCEPTANCE_CASES,createQuestDiagnostics,noteQuestEvent,
  beginQuestDiagnostics,recordQuestFrame,
  endQuestDiagnostics,summarizeQuestDiagnostics,questAcceptanceReport
} from './spark-vr-diagnostics.js';
import {vrCompass,closestVRGate} from './spark-vr-navigation.js';
import {
  loadVRComfort,storeVRComfort,normalizeVRComfort,
  applyVRComfortToMovement
} from './spark-vr-comfort.js';

// This app owns presentation and a separate VR-only local save.
// No canonical campaign, Sideways, Arcade or cloud progress is read or changed.
const $=id=>document.getElementById(id);
const canvas=$('world'),status=$('status'),details=$('facts'),color=$('health');
const enterVR=$('enter-vr'),desktop=$('desktop'),pauseButton=$('pause'),
  reset=$('reset'),exitVR=$('exit-vr'),resume=$('resume-vr'),save=$('save-vr');
const options=$('phase-options'),phaseHelp=$('phase-help'),saveStatus=$('checkpoint-status');
const navButton=$('toggle-navigation'),navPanel=$('navigation-panel'),
  navRoutes=$('navigation-routes'),navDescription=$('navigation-description');
const speedSelect=$('comfort-speed'),turnSelect=$('comfort-turn'),
  vignetteSelect=$('comfort-vignette');
const fieldChecks=$('field-checks'),fieldMetrics=$('field-metrics'),
  fieldStatus=$('field-report-status'),
  fieldDownload=$('field-download'),fieldCopy=$('field-copy');
let state=createVRPreview(),renderer=null,mode='idle',xr=null,
  desktopYaw=0,desktopPitch=0,
  desktopRAF=0,last=0,accum=0,paused=true,
  drag=null,outputStamp='',
  keys=new Set(),desktopActions={},selectedChoice=0,phaseStamp='',
  lastSavedAt=0,lastSavedSignature='',navigationOpen=false,
  comfort=loadVRComfort(window.localStorage),
  questDiagnostics=createQuestDiagnostics(),questResults={},
  fieldLastUpdate=-1;

const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const show=message=>{status.textContent=message;};
const resetInputs=()=>{keys.clear();desktopActions={};};
function initializeFieldLab(){
  const results=[
    ['not-tested','Not tested'],
    ['pass','Passed on Quest'],
    ['fail','Failed on Quest']
  ];
  fieldChecks.replaceChildren();
  for(const item of QUEST_ACCEPTANCE_CASES){
    const row=document.createElement('label');
    row.className='field-case';
    const heading=document.createElement('span');
    heading.textContent=item.label;
    const select=document.createElement('select');
    select.setAttribute('aria-label',item.label+' result');
    select.dataset.caseId=item.id;
    for(const [value,label] of results){
      const option=document.createElement('option');
      option.value=value;option.textContent=label;select.appendChild(option);
    }
    select.addEventListener('change',()=>{
      questResults[item.id]=select.value;
      renderFieldMetrics(true);
    });
    row.append(heading,select);fieldChecks.appendChild(row);
  }
  renderFieldMetrics(true);
}
function renderFieldMetrics(force=false){
  const summary=summarizeQuestDiagnostics(questDiagnostics);
  const now=performance.now();
  if(!force&&fieldLastUpdate>=0&&now-fieldLastUpdate<1500)return;
  fieldLastUpdate=now;
  const cadence=summary.frameIntervalMilliseconds;
  const submission=summary.javascriptRenderSubmissionMilliseconds;
  const ms=v=>v===null?'not measured':v.toFixed(1)+' ms';
  const attempted=QUEST_ACCEPTANCE_CASES.filter(
    c=>['pass','fail'].includes(questResults[c.id])).length;
  fieldMetrics.textContent=[
    'XR sessions: '+summary.sessionCount,
    'WebXR callback frames: '+summary.renderedFrames,
    'Two-eye view frames: '+summary.framesWithTwoEyes,
    'Controllers detected: '+(summary.leftControllerDetected?'L':'–')+
      ' / '+(summary.rightControllerDetected?'R':'–'),
    'Reference space: '+summary.referenceSpace,
    'Frame callback interval (median / p95): '+ms(cadence.median)+' / '+ms(cadence.p95),
    'JavaScript render submission (median / p95): '+
      ms(submission.median)+' / '+ms(submission.p95),
    'Hands-on checks attempted: '+attempted+' / '+QUEST_ACCEPTANCE_CASES.length
  ].join(' · ');
}
function currentQuestReport(){
  return questAcceptanceReport(questDiagnostics,questResults);
}
function exportQuestReport(){
  // An explicit user click is required. Nothing is uploaded or auto-saved.
  const json=JSON.stringify(currentQuestReport(),null,2)+'\n';
  const blob=new Blob([json],{type:'application/json'});
  const href=URL.createObjectURL(blob);
  try{
    const link=document.createElement('a');
    link.href=href;link.download='spark-vr-quest-field-report.json';
    document.body.append(link);link.click();link.remove();
    fieldStatus.textContent='Download prepared locally. No data uploaded.';
  }finally{
    // Keep the blob alive long enough for mobile/Quest browser download UI.
    setTimeout(()=>URL.revokeObjectURL(href),30000);
  }
}
async function copyQuestReport(){
  try{
    if(!navigator.clipboard?.writeText)
      throw Error('Clipboard permission unavailable; use Download instead.');
    await navigator.clipboard.writeText(
      JSON.stringify(currentQuestReport(),null,2));
    fieldStatus.textContent='Quest report copied locally. Paste it into a bug report when ready.';
  }catch{
    fieldStatus.textContent='Clipboard unavailable or denied. Use Download Quest test report.';
  }
}
function initializeComfort(){
  speedSelect.value=String(comfort.movement);
  turnSelect.value=String(comfort.turn);
  vignetteSelect.value=String(comfort.vignette);
}
function changeComfort(){
  const selected=normalizeVRComfort({
    movement:speedSelect.value,
    turn:turnSelect.value,
    vignette:vignetteSelect.value
  });
  comfort=selected;
  if(sharedXR.mode==='xr')sharedXR.configure(comfort);
  try{storeVRComfort(window.localStorage,comfort);}
  catch{show('Comfort settings applied for this visit, but browser storage is unavailable.');}
}
function updateNavigationPanel(snapshot){
  if(!navigationOpen)return;
  const compass=vrCompass(snapshot);
  navRoutes.replaceChildren();
  const near=closestVRGate(snapshot);
  navDescription.textContent=near?
    'Closest gate: '+near.heading+' · '+near.name+
      ' · '+near.distance+' engine units · '+near.reason:
    'No exits are available in this room.';
  compass.forEach(gate=>{
    const item=document.createElement('li'),title=document.createElement('strong'),
      hint=document.createElement('small');
    item.dataset.open=String(gate.available);
    title.textContent=gate.heading+' · '+gate.status+' · '+gate.name;
    hint.textContent=gate.reason;
    item.append(title,hint);navRoutes.append(item);
  });
}
function toggleNavigation(value=!navigationOpen){
  navigationOpen=!!value;
  if(mode==='xr')noteQuestEvent(questDiagnostics,
    navigationOpen?'compass-opened':'compass-closed');
  navButton.setAttribute('aria-expanded',String(navigationOpen));
  navButton.textContent=navigationOpen?'Close room compass':'Show room compass';
  navPanel.hidden=!navigationOpen;
  last=0;accum=0;
  // Legacy desktop compass; immersive navigation uses the shared World page.
  keys.clear();desktopActions={};
  updateInfo(true);
}
function decorateSnapshot(snap){
  snap.navigationOpen=navigationOpen;
  snap.route=vrCompass(snap);
  return snap;
}

function saveProgress(force=false){
  if(!force&&state.ticks===0)return; // Merely viewing VR never creates a checkpoint.
  const now=Date.now(),run=state.run;
  const signature=[run.room,run.phase,run.level,run.form,
    run.cleared.length,run.keys?.length??0,run.seals?.length??0,
    run.relics?.length??0,run.victory??''].join('|');
  if(!force&&signature===lastSavedSignature&&now-lastSavedAt<15000)return;
  try{
    saveVRCheckpoint(window.localStorage,state);
    lastSavedAt=now;lastSavedSignature=signature;
    saveStatus.textContent='VR-only checkpoint saved locally · original Descent unchanged';
    if(mode==='xr')noteQuestEvent(questDiagnostics,'checkpoint-saved');
    resume.disabled=false;
  }catch(error){
    if(mode==='xr')noteQuestEvent(questDiagnostics,'save-failed');
    saveStatus.textContent='VR checkpoint unavailable: '+error.message;
  }
}
function refreshSavedStatus(){
  try{
    const saved=loadVRCheckpoint(window.localStorage);
    resume.disabled=!saved;
    saveStatus.textContent=saved?
      'VR-only checkpoint found · resume without changing original Spark saves':
      'No VR-only checkpoint yet · original Spark saves stay separate';
  }catch(error){
    resume.disabled=true;
    saveStatus.textContent='VR save cannot be restored: '+error.message;
  }
}
const currentChoices=()=>vrPhaseChoices(state);
function refreshChoices(force=false){
  // Death -> banked memory -> offered next life keeps the same 'dead' phase.
  // Include offered choice IDs so the rendered buttons update immediately.
  const signature=state.run.phase+':'+currentChoices().map(x=>x.id).join(',')+
    ':'+Boolean(state.pendingRebirth);
  if(!force&&signature===phaseStamp)return;
  if(signature!==phaseStamp)selectedChoice=0;
  phaseStamp=signature;
  options.replaceChildren();
  const items=currentChoices();
  options.hidden=items.length===0;
  phaseHelp.hidden=items.length===0;
  phaseHelp.textContent=items.length?
    'Canonical progression paused · ←/→ or left stick chooses · Enter, A, or RT confirms.':
    '';
  items.forEach((item,index)=>{
    const button=document.createElement('button');
    button.type='button';button.className='choice-button';
    button.setAttribute('aria-pressed',String(index===selectedChoice));
    button.textContent=(index+1)+'. '+item.title+' · '+item.detail;
    button.addEventListener('click',()=>{selectedChoice=index;confirmChoice();});
    options.appendChild(button);
  });
}
function changeChoice(delta){
  const choices=currentChoices();
  if(!choices.length)return;
  selectedChoice=(selectedChoice+delta+choices.length)%choices.length;
  refreshChoices(true);
}
function confirmChoice(){
  if(paused)return;
  const item=currentChoices()[selectedChoice];
  if(!item)return;
  try{
    chooseVRPhase(state,item.id);
    if(mode==='xr')noteQuestEvent(questDiagnostics,'choice-confirmed');
    selectedChoice=0;phaseStamp='';last=0;accum=0;
    updateInfo(true);saveProgress(true);
  }catch(error){show('Choice blocked: '+error.message);}
}
function cycleForm(){
  if(paused)return;
  try{
    const form=nextVRForm(state);
    show('Resonance changed vessel to '+form.toUpperCase());
    saveProgress(true);updateInfo(true);
  }catch(error){show(error.message);}
}
function updateInfo(force=false){
  const snap=vrRoomSnapshot(state);
  refreshChoices();
  if(navigationOpen)updateNavigationPanel(snap);
  const stamp=[snap.roomId,snap.phase,Math.ceil(snap.health),snap.cleared,
    Math.floor(state.run.time),snap.notice,snap.form,selectedChoice,
    snap.keys.length,snap.seals.length,navigationOpen].join('|');
  if(stamp===outputStamp&&!force)return snap;
  outputStamp=stamp;
  color.style.width=(100*clamp(snap.health/snap.maxHealth,0,1)).toFixed(1)+'%';
  details.textContent=[snap.worldName,snap.roomName,
    snap.visitedRooms+'/'+snap.availableRooms+' rooms discovered',
    'Vessel '+snap.form.toUpperCase(),Math.ceil(snap.health)+'/'+snap.maxHealth+' HP',
    snap.enemies.length+' enemies',snap.phase.toUpperCase()].join(' · ');
  $('room-heading').textContent=snap.roomName;
  $('world-heading').textContent=snap.worldName;
  if(snap.phase==='won'){
    show('SPARK VICTORY · '+(snap.victory??'canonical ending')+
      ' · VR checkpoint only; original campaign unaffected.');
  }else if(snap.phase==='dead'){
    show('The body falls. The spark remembers. Resume a VR-only checkpoint or begin a new run.');
  }else if(snap.choices.length){
    show('The engine awaits your '+snap.phase+' decision. Select one of the canonical choices.');
  }else if(snap.notice)show(snap.notice);
  return snap;
}
function ensureRenderer(){
  if(!renderer)renderer=new SparkVRRenderer(canvas);
  return renderer;
}
function stopDesktop(){
  if(desktopRAF)cancelAnimationFrame(desktopRAF);
  desktopRAF=0;
}
function desktopInput(){
  const x=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-
    (keys.has('KeyA')||keys.has('ArrowLeft')?1:0);
  const y=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-
    (keys.has('KeyW')||keys.has('ArrowUp')?1:0);
  const c=Math.cos(desktopYaw),s=Math.sin(desktopYaw);
  const movement=applyVRComfortToMovement({x:c*x-s*y,y:s*x+c*y},comfort);
  const result={...movement,
    dash:!!desktopActions.dash,power:!!desktopActions.power,
    interact:!!desktopActions.interact};
  desktopActions={};return result;
}
function simulate(now,input){
  const dt=Math.min(.05,Math.max(0,last?(now-last)/1000:0));
  last=now;
  if(paused||navigationOpen||!dt)return;
  accum=Math.min(.08,accum+dt);
  let count=0;
  while(accum>=VR_SIM_STEP&&count<4){
    if(state.run.phase!=='playing'){accum=0;break;}
    stepVRPreview(state,input,VR_SIM_STEP);
    input={x:input.x,y:input.y};
    accum-=VR_SIM_STEP;count++;
  }
  updateInfo();
  saveProgress();
}
function drawDesktop(now){
  if(mode!=='desktop')return;
  desktopRAF=requestAnimationFrame(drawDesktop);
  try{
    const r=ensureRenderer();
    simulate(now,desktopInput());
    const dpr=Math.min(devicePixelRatio||1,2);
    const w=Math.max(2,Math.floor(canvas.clientWidth*dpr)),
      h=Math.max(2,Math.floor(canvas.clientHeight*dpr));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    const snap=decorateSnapshot(vrRoomSnapshot(state));
    const [px,,pz]=worldAt(snap.player.x,snap.player.y);
    snap.selectedChoice=selectedChoice;
    const root=worldRoot4(px,pz);
    const direction=[Math.sin(desktopYaw),Math.sin(desktopPitch),-Math.cos(desktopYaw)];
    const eye=[0,1.65,0],
      view=lookAt4(eye,[direction[0],1.65+direction[1],direction[2]]);
    const projection=projection4(Math.PI/2.7,w/h,.06,70);
    r.render([{viewport:{x:0,y:0,width:w,height:h},
      matrix:multiply4(projection,multiply4(view,root))}],snap);
  }catch(error){paused=true;show('Desktop preview paused: '+error.message);}
}
function startDesktop(){
  if(sharedXR.pending){show('Finish or cancel the VR permission prompt first.');return;}
  if(sharedXR.calibrating){show('Tracked desktop calibration is available in the Living hub; press Enter VR here to calibrate on Quest.');return;}
  if(xr){show('Exit immersive VR before entering desktop preview.');return;}
  try{
    ensureRenderer();mode='desktop';paused=false;accum=0;last=0;
    if(navigationOpen)toggleNavigation(false);
    desktop.textContent='Resume desktop preview';pauseButton.disabled=false;
    enterVR.disabled=false;updateInfo(true);$('intro-overlay').hidden=true;
    stopDesktop();desktopRAF=requestAnimationFrame(drawDesktop);
  }catch(error){show('Desktop preview unavailable: '+error.message);}
}
// Immersive ownership is shared; legacy desktop remains above unchanged.
export const sharedXR=legacyXRBridge({canvas,getState:()=>state,setState:value=>{state=value;},settings:comfort,
  onSettings:s=>{comfort=normalizeVRComfort(s);initializeComfort();try{storeVRComfort(window.localStorage,comfort);}catch{}},
  save:()=>saveProgress(true),restore:()=>{const saved=loadVRCheckpoint(window.localStorage);if(!saved)throw Error('No VR checkpoint exists.');state=saved;},
  onStatus:show,onMode:display=>{mode=display;xr=sharedXR.session||null;renderer=sharedXR.renderer||null;
    enterVR.disabled=sharedXR.pending||display==='xr';exitVR.disabled=display!=='xr';pauseButton.disabled=display==='idle';
    $('intro-overlay').hidden=display!=='idle';resetInputs();},
  onSnapshot:()=>{paused=sharedXR.paused;updateInfo();saveProgress();},
  onFrame:metrics=>{recordQuestFrame(questDiagnostics,metrics);renderFieldMetrics();},
  onSession:(event,kind)=>{if(event==='start')beginQuestDiagnostics(questDiagnostics,kind);else{saveProgress(true);endQuestDiagnostics(questDiagnostics);}renderFieldMetrics(true);}
});
installXRControls(sharedXR,{legacyDesktop:true});
async function beginXR(){
  if(sharedXR.pending){show('VR permission request pending · finish or cancel the browser prompt');return false;}
  if(sharedXR.session){show('VR is already active.');return false;}
  noteQuestEvent(questDiagnostics,'xr-start-requested');stopDesktop();renderer?.dispose();renderer=null;
  if(navigationOpen)toggleNavigation(false);
  const ok=await sharedXR.enter();if(!ok)noteQuestEvent(questDiagnostics,'xr-start-failed');return ok;
}
async function leaveXR(){await sharedXR.exit();renderer=null;}
async function checkXR(){
  if(!navigator.xr?.isSessionSupported){
    $('xr-support').textContent='Immersive WebXR unavailable here · desktop preview available.';
    return;
  }
  try{
    $('xr-support').textContent=await navigator.xr.isSessionSupported('immersive-vr')?
      'Immersive VR supported by this browser · Quest / HTTPS':
      'No immersive headset detected · desktop preview available';
  }catch{
    $('xr-support').textContent='Unable to confirm headset support · desktop preview available';
  }
}

desktop.addEventListener('click',startDesktop);
enterVR.addEventListener('click',()=>void beginXR());
pauseButton.addEventListener('click',()=>{
  if(mode==='xr'){sharedXR.pause();return;}
  if(mode==='idle')return;
  paused=!paused;resetInputs();last=0;accum=0;
  show(paused?'Preview paused':'Preview resumed');
});
exitVR.addEventListener('click',()=>void leaveXR());
fieldDownload.addEventListener('click',()=>{
  try{exportQuestReport();}
  catch{fieldStatus.textContent='Report download failed. Try Copy report.';}
});
fieldCopy.addEventListener('click',()=>void copyQuestReport());
resume.addEventListener('click',()=>{
  if(xr){show('Exit immersive VR before restoring another checkpoint.');return;}
  try{
    const restored=loadVRCheckpoint(window.localStorage);
    if(!restored)throw Error('No VR checkpoint exists.');
    stopDesktop();mode='idle';paused=true;state=restored;
    desktopYaw=0;desktopPitch=0;last=0;accum=0;
    selectedChoice=0;phaseStamp='';outputStamp='';resetInputs();
    updateInfo(true);
    toggleNavigation(false);
    show('VR-only journey restored · start Desktop or Enter VR to continue.');
  }catch(error){show('VR resume blocked: '+error.message);}
});
save.addEventListener('click',()=>saveProgress(true));
reset.addEventListener('click',()=>{
  if(xr){show('Exit immersive VR before starting a new run.');return;}
  if(!window.confirm('Start a fresh VR-only journey? The previous VR checkpoint will be replaced; original Spark saves are untouched.'))return;
  clearVRCheckpoint(window.localStorage);
  state=createVRPreview();desktopYaw=0;desktopPitch=0;
  last=0;accum=0;outputStamp='';phaseStamp='';selectedChoice=0;
  lastSavedSignature='';lastSavedAt=0;resetInputs();
  toggleNavigation(false);updateInfo(true);refreshSavedStatus();
  show('New VR-only journey · original Spark saves untouched.');
});
navButton.addEventListener('click',()=>{if(mode==='xr'){sharedXR.pause(true,'World');sharedXR.focusPage('World');}else toggleNavigation();});
for(const control of [speedSelect,turnSelect,vignetteSelect])
  control.addEventListener('change',changeComfort);
window.addEventListener('keydown',event=>{
  if(['INPUT','TEXTAREA','SELECT'].includes(event.target?.tagName))return;
  if(event.target?.closest?.('button,a')&&['Space','Enter'].includes(event.code))return;
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.code))
    event.preventDefault();
  if(event.repeat)return;
  if(event.code==='KeyM'&&mode==='desktop'){
    toggleNavigation();return;
  }
  if(navigationOpen)return;
  if(event.code==='Escape'&&mode==='desktop'){
    paused=!paused;resetInputs();last=0;
    show(paused?'Desktop paused':'Desktop resumed');
    return;
  }
  if(currentChoices().length){
    if(event.code==='ArrowRight'||event.code==='KeyD')changeChoice(1);
    else if(event.code==='ArrowLeft'||event.code==='KeyA')changeChoice(-1);
    else if(event.code==='Enter'||event.code==='Space'||event.code==='KeyE')
      confirmChoice();
    return;
  }
  if(event.code==='Space')desktopActions.dash=true;
  else if(event.code==='KeyF')desktopActions.power=true;
  else if(event.code==='KeyE')desktopActions.interact=true;
  else if(event.code==='KeyQ')cycleForm();
  keys.add(event.code);
});
window.addEventListener('keyup',event=>keys.delete(event.code));
window.addEventListener('blur',()=>{
  if(mode!=='idle'){paused=true;resetInputs();if(mode==='xr')sharedXR.pause(true,'Browser interrupted · release controls and resume');show('Preview paused on window blur.');}
});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden&&mode!=='idle'){
    paused=true;resetInputs();if(mode==='xr')sharedXR.pause(true,'Headset hidden · resume explicitly');saveProgress();
    show('Preview paused while hidden.');
  }
});
canvas.addEventListener('pointerdown',event=>{
  if(mode!=='desktop')return;
  drag={x:event.clientX,y:event.clientY,yaw:desktopYaw,pitch:desktopPitch};
  canvas.setPointerCapture?.(event.pointerId);
});
canvas.addEventListener('pointermove',event=>{
  if(mode!=='desktop'||!drag)return;
  desktopYaw=drag.yaw+(event.clientX-drag.x)*.006;
  desktopPitch=clamp(drag.pitch-(event.clientY-drag.y)*.004,-.65,.65);
});
canvas.addEventListener('pointerup',()=>{drag=null;});
canvas.addEventListener('pointercancel',()=>{drag=null;});
window.addEventListener('pagehide',()=>{saveProgress();stopDesktop();if(renderer&&renderer!==sharedXR.renderer)renderer.dispose();void sharedXR.dispose();});
initializeComfort();initializeFieldLab();updateInfo(true);refreshSavedStatus();void checkXR();
