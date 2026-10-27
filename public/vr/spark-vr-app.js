import {
  createVRPreview,resumeVRPreview,stepVRPreview,vrRoomSnapshot,worldAt,stickToGame,
  chooseVRPhase,nextVRForm,vrPhaseChoices,VR_SIM_STEP
} from './spark-vr-model.js';
import {saveVRCheckpoint,loadVRCheckpoint,clearVRCheckpoint} from './spark-vr-save.js';
import {multiply4,projection4,lookAt4,worldRoot4} from './spark-vr-math.js';
import {SparkVRRenderer} from './spark-vr-renderer.js';
import {vrCompass,closestVRGate} from './spark-vr-navigation.js';
import {
  loadVRComfort,storeVRComfort,normalizeVRComfort,
  applyVRComfortToMovement,vrSnapRadians
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
let state=createVRPreview(),renderer=null,mode='idle',xr=null,
  xrSpace=null,xrLayer=null,rootYaw=0,desktopYaw=0,desktopPitch=0,
  desktopRAF=0,frameId=null,last=0,accum=0,paused=true,
  floorShift=0,drag=null,outputStamp='',xrLatch={},
  keys=new Set(),desktopActions={},selectedChoice=0,phaseStamp='',
  lastSavedAt=0,lastSavedSignature='',navigationOpen=false,
  comfort=loadVRComfort(window.localStorage);

const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const show=message=>{status.textContent=message;};
const pad=(source,index)=>!!(source?.gamepad?.buttons?.[index]?.pressed||
  (source?.gamepad?.buttons?.[index]?.value||0)>.6);
const stick=source=>{
  if(!source?.gamepad)return [0,0];
  const a=source.gamepad.axes||[];
  return a.length>=4?[a[2]||0,a[3]||0]:[a[0]||0,a[1]||0];
};
const edge=(name,value)=>{
  const previous=!!xrLatch[name];xrLatch[name]=!!value;
  return !!value&&!previous;
};
const resetInputs=()=>{keys.clear();desktopActions={};xrLatch={};};
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
  navButton.setAttribute('aria-expanded',String(navigationOpen));
  navButton.textContent=navigationOpen?'Close room compass':'Show room compass';
  navPanel.hidden=!navigationOpen;
  last=0;accum=0;resetInputs();
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
    resume.disabled=false;
  }catch(error){
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
  const signature=state.run.phase+':'+state.run.choices.join(',');
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
  if(xr){show('Exit immersive VR before entering desktop preview.');return;}
  try{
    ensureRenderer();mode='desktop';paused=false;accum=0;last=0;
    navigationOpen=false;
    desktop.textContent='Resume desktop preview';pauseButton.disabled=false;
    enterVR.disabled=false;updateInfo(true);$('intro-overlay').hidden=true;
    stopDesktop();desktopRAF=requestAnimationFrame(drawDesktop);
  }catch(error){show('Desktop preview unavailable: '+error.message);}
}
function xrInput(pose,session){
  const controllers=Array.from(session.inputSources||[]).filter(s=>s.gamepad?.mapping==='xr-standard');
  const left=controllers.find(s=>s.handedness==='left'),
    right=controllers.find(s=>s.handedness==='right');
  const axes=stick(left),turn=stick(right)[0];
  const toggleMap=edge('navigation',pad(left,5));
  if(navigationOpen){
    return {x:0,y:0,navigationToggle:toggleMap,
      togglePause:edge('pause',pad(right,3))};
  }
  if(currentChoices().length){
    if(Math.abs(axes[0])<.32)xrLatch.choiceAxis=false;
    if(Math.abs(axes[0])>.78&&!xrLatch.choiceAxis){
      changeChoice(axes[0]>0?1:-1);xrLatch.choiceAxis=true;
    }
    return {x:0,y:0,
      confirmChoice:edge('confirmChoice',pad(right,0)||pad(right,4)),
      navigationToggle:toggleMap,
      togglePause:edge('pause',pad(right,3))};
  }
  // Explicitly clear choice trigger before returning to normal RT power input.
  xrLatch.confirmChoice=false;
  if(Math.abs(turn)<.3)xrLatch.turn=false;
  if(Math.abs(turn)>.72&&!xrLatch.turn){
    rootYaw+=Math.sign(turn)*vrSnapRadians(comfort);xrLatch.turn=true;
  }
  const movement=applyVRComfortToMovement(
    stickToGame(axes[0],axes[1],pose.transform.matrix,rootYaw),comfort);
  return {...movement,navigationToggle:toggleMap,
    dash:edge('dash',pad(left,0)),
    power:edge('power',pad(right,0)),
    interact:edge('interact',pad(right,1)||pad(right,4)),
    togglePause:edge('pause',pad(right,3)),
    cycleForm:edge('cycleForm',pad(right,5))};
}
function onXRFrame(now,frame){
  const session=xr;if(!session||mode!=='xr')return;
  frameId=session.requestAnimationFrame(onXRFrame);
  try{
    if(session.visibilityState!=='visible'){
      paused=true;resetInputs();saveProgress();
      show('Headset not visible · VR paused.');return;
    }
    const pose=frame.getViewerPose(xrSpace);
    if(!pose){
      paused=true;resetInputs();show('Head tracking unavailable · VR paused.');return;
    }
    const input=xrInput(pose,session);
    if(input.navigationToggle)toggleNavigation();
    if(input.togglePause){
      paused=!paused;resetInputs();accum=0;last=0;
      show(paused?'VR paused · press right stick to resume':'VR resumed');
    }
    if(!session.inputSources?.length&&!paused){
      paused=true;show('Controllers disconnected · VR paused.');resetInputs();
    }
    if(input.confirmChoice)confirmChoice();
    if(input.cycleForm)cycleForm();
    simulate(now,input);
    const snap=decorateSnapshot(vrRoomSnapshot(state));
    const [px,,pz]=worldAt(snap.player.x,snap.player.y);
    snap.selectedChoice=selectedChoice;
    const root=worldRoot4(px,pz,rootYaw,floorShift);
    const views=pose.views.map(v=>({
      projection:v.projectionMatrix,
      inverse:v.transform.inverse.matrix,
      viewport:xrLayer.getViewport(v),
      matrix:multiply4(v.projectionMatrix,multiply4(v.transform.inverse.matrix,root))
    }));
    renderer.render(views,snap,{framebuffer:xrLayer.framebuffer,
      hudPose:pose.transform.matrix,vignette:comfort.vignette});
  }catch(error){
    paused=true;show('VR frame stopped safely: '+error.message);
    void leaveXR();
  }
}
async function beginXR(){
  if(xr){show('VR is already active.');return;}
  if(!navigator.xr?.requestSession){
    show('WebXR unavailable. Use Quest Browser over HTTPS or desktop preview.');return;
  }
  let session=null;
  try{
    ensureRenderer();
    if(!globalThis.isSecureContext)throw Error('Immersive WebXR requires HTTPS.');
    stopDesktop();paused=true;resetInputs();
    session=await navigator.xr.requestSession('immersive-vr',{optionalFeatures:['local-floor']});
    xr=session;mode='xr';rootYaw=0;accum=0;last=0;
    navigationOpen=false;
    session.addEventListener('end',()=>finishXR(session),{once:true});
    session.addEventListener('visibilitychange',()=>{
      if(session.visibilityState!=='visible'){paused=true;resetInputs();}
    });
    session.addEventListener('inputsourceschange',event=>{
      if(event.removed?.length){paused=true;resetInputs();
        show('Controller changed · VR paused.');}
    });
    await renderer.gl.makeXRCompatible?.();
    xrLayer=new XRWebGLLayer(session,renderer.gl,{
      antialias:false,alpha:false,framebufferScaleFactor:.85});
    session.updateRenderState({baseLayer:xrLayer,depthNear:.05,depthFar:80});
    try{xrSpace=await session.requestReferenceSpace('local-floor');floorShift=0;}
    catch{xrSpace=await session.requestReferenceSpace('local');floorShift=-1.6;}
    xrSpace.addEventListener?.('reset',()=>{paused=true;resetInputs();rootYaw=0;
      show('Tracking reset · VR paused.');});
    paused=false;$('intro-overlay').hidden=true;
    show('IMMERSIVE SPARK · Canonical solo Descent · RT power/choose · B morph · A gate');
    pauseButton.disabled=false;exitVR.disabled=false;enterVR.disabled=true;
    mode='xr';frameId=session.requestAnimationFrame(onXRFrame);
  }catch(error){
    show('Unable to enter VR: '+error.message);
    if(session){try{await session.end();}catch{finishXR(session);}}
    else{mode='idle';paused=true;}
  }
}
function finishXR(session){
  if(xr!==session)return;
  saveProgress(true);
  xr=null;xrSpace=null;xrLayer=null;frameId=null;
  resetInputs();paused=true;mode='idle';last=0;accum=0;
  pauseButton.disabled=true;exitVR.disabled=true;enterVR.disabled=false;
  show('Immersive VR ended · local VR checkpoint saved separately from original Spark.');
}
async function leaveXR(){
  const session=xr;if(!session)return;
  try{await session.end();}
  catch{finishXR(session);}
}
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
  if(mode==='idle')return;
  paused=!paused;resetInputs();last=0;accum=0;
  show(paused?'Preview paused':'Preview resumed');
});
exitVR.addEventListener('click',()=>void leaveXR());
resume.addEventListener('click',()=>{
  if(xr){show('Exit immersive VR before restoring another checkpoint.');return;}
  try{
    const restored=loadVRCheckpoint(window.localStorage);
    if(!restored)throw Error('No VR checkpoint exists.');
    stopDesktop();mode='idle';paused=true;state=restored;
    rootYaw=0;desktopYaw=0;desktopPitch=0;last=0;accum=0;
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
  state=createVRPreview();rootYaw=0;desktopYaw=0;desktopPitch=0;
  last=0;accum=0;outputStamp='';phaseStamp='';selectedChoice=0;
  lastSavedSignature='';lastSavedAt=0;resetInputs();
  toggleNavigation(false);updateInfo(true);refreshSavedStatus();
  show('New VR-only journey · original Spark saves untouched.');
});
navButton.addEventListener('click',()=>toggleNavigation());
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
  if(mode!=='idle'){paused=true;resetInputs();show('Preview paused on window blur.');}
});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden&&mode!=='idle'){
    paused=true;resetInputs();saveProgress();
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
window.addEventListener('pagehide',()=>saveProgress());
initializeComfort();updateInfo(true);refreshSavedStatus();void checkXR();
