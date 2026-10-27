import {createVRPreview,stepVRPreview,vrRoomSnapshot,worldAt,stickToGame,
  VR_SIM_STEP,VR_SNAP_RADIANS} from './spark-vr-model.js';
import {multiply4,projection4,lookAt4,worldRoot4} from './spark-vr-math.js';
import {SparkVRRenderer} from './spark-vr-renderer.js';

const $=id=>document.getElementById(id);
const canvas=$('world'),status=$('status'),details=$('facts');
const enterVR=$('enter-vr'),desktop=$('desktop'),pauseButton=$('pause'),
  reset=$('reset'),exitVR=$('exit-vr');
const color=$('health');
let state=createVRPreview(),renderer=null,mode='idle',xr=null,
  xrSpace=null,xrLayer=null,rootYaw=0,desktopYaw=0,desktopPitch=0,
  desktopRAF=0,frameId=null,last=0,accum=0,paused=true,
  floorShift=0,drag=null,outputStamp='',xrLatch={},
  keys=new Set(),desktopActions={};

function show(text){status.textContent=text;}
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const pad=(source,index)=>!!(source?.gamepad?.buttons?.[index]?.pressed||
  (source?.gamepad?.buttons?.[index]?.value||0)>.6);
const axis=(source,index)=>source?.gamepad?.axes?.[index]??0;
const stick=source=>{
  if(!source?.gamepad)return [0,0];
  const a=source.gamepad.axes||[];
  return a.length>=4?[a[2]||0,a[3]||0]:[a[0]||0,a[1]||0];
};
const edge=(name,value)=>{
  const previous=!!xrLatch[name];xrLatch[name]=!!value;
  return !!value&&!previous;
};
function resetInputs(){keys.clear();desktopActions={};xrLatch={};}
function updateInfo(force=false){
  const snap=vrRoomSnapshot(state);
  const stamp=[snap.roomId,snap.phase,Math.ceil(snap.health),snap.cleared,
    Math.floor(state.run.time),snap.notice].join('|');
  if(stamp===outputStamp&&!force)return snap;
  outputStamp=stamp;
  color.style.width=(100*clamp(snap.health/snap.maxHealth,0,1)).toFixed(1)+'%';
  details.textContent=[snap.roomName,'Vessel '+snap.form.toUpperCase(),
    Math.ceil(snap.health)+'/'+snap.maxHealth+' HP',
    snap.enemies.length+' enemies',snap.phase.toUpperCase()].join('  ·  ');
  if(snap.phase!=='playing')show('SPARK '+snap.phase.toUpperCase()+
    ' · This two-room VR slice does not resolve campaign rewards or write saved progress.');
  else if(snap.notice)show(snap.notice);
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
  const result={x:c*x-s*y,y:s*x+c*y,
    dash:!!desktopActions.dash,power:!!desktopActions.power,
    interact:!!desktopActions.interact};
  desktopActions={};return result;
}
function simulate(now,input){
  const dt=Math.min(.05,Math.max(0,last?(now-last)/1000:0));
  last=now;
  if(paused||!dt)return;
  accum=Math.min(.08,accum+dt);
  let n=0;
  while(accum>=VR_SIM_STEP&&n<4){
    stepVRPreview(state,input,VR_SIM_STEP);
    input={x:input.x,y:input.y};
    accum-=VR_SIM_STEP;n++;
  }
  updateInfo();
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
    const snap=vrRoomSnapshot(state),[px,,pz]=worldAt(snap.player.x,snap.player.y);
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
  try{ensureRenderer();mode='desktop';paused=false;accum=0;last=0;
    desktop.textContent='Resume desktop preview';pauseButton.disabled=false;
    enterVR.disabled=false;updateInfo(true);stopDesktop();desktopRAF=requestAnimationFrame(drawDesktop);}
  catch(error){show('Desktop preview unavailable: '+error.message);}
}

function xrInput(frame,pose,session){
  const all=Array.from(session.inputSources||[]).filter(s=>s.gamepad?.mapping==='xr-standard');
  const left=all.find(s=>s.handedness==='left'),right=all.find(s=>s.handedness==='right');
  const axes=stick(left),turn=stick(right)[0];
  if(Math.abs(turn)<.3)xrLatch.turn=false;
  if(Math.abs(turn)>.72&&!xrLatch.turn){
    rootYaw+=Math.sign(turn)*VR_SNAP_RADIANS;
    xrLatch.turn=true;
  }
  const head=pose.transform.matrix;
  const movement=stickToGame(axes[0],axes[1],head,rootYaw);
  return {...movement,
    dash:edge('dash',pad(left,0)),
    power:edge('power',pad(right,0)),
    interact:edge('interact',pad(right,1)||pad(right,4)),
    togglePause:edge('pause',pad(right,3))};
}
function onXRFrame(now,frame){
  const session=xr;if(!session||mode!=='xr')return;
  frameId=session.requestAnimationFrame(onXRFrame);
  try{
    if(session.visibilityState!=='visible'){
      paused=true;resetInputs();show('Headset not visible. Preview paused.');return;
    }
    const pose=frame.getViewerPose(xrSpace);
    if(!pose){paused=true;resetInputs();show('Headset pose unavailable. Preview paused.');return;}
    const input=xrInput(frame,pose,session);
    if(input.togglePause){paused=!paused;resetInputs();show(paused?'VR paused · press right stick to resume':'VR resumed');}
    if(!session.inputSources?.length&&!paused){paused=true;show('VR controllers disconnected. Preview paused.');}
    simulate(now,input);
    const snap=vrRoomSnapshot(state),[px,,pz]=worldAt(snap.player.x,snap.player.y);
    const root=worldRoot4(px,pz,rootYaw,floorShift);
    const views=pose.views.map(v=>{
      const projection=v.projectionMatrix,inverse=v.transform.inverse.matrix;
      return {projection,inverse,viewport:xrLayer.getViewport(v),
        matrix:multiply4(projection,multiply4(inverse,root))};
    });
    renderer.render(views,snap,{framebuffer:xrLayer.framebuffer,hudPose:pose.transform.matrix});
  }catch(error){
    paused=true;show('VR frame stopped safely: '+error.message);
    void leaveXR();
  }
}
async function beginXR(){
  if(xr){show('VR is already active.');return;}
  if(!navigator.xr?.requestSession){show('WebXR unavailable. Use Quest Browser over HTTPS, or try desktop preview.');return;}
  let session=null;
  try{
    ensureRenderer();
    if(!globalThis.isSecureContext)throw Error('Immersive WebXR requires HTTPS.');
    stopDesktop();paused=true;resetInputs();
    // A user gesture triggers every immersive session; never enter automatically.
    session=await navigator.xr.requestSession('immersive-vr',{optionalFeatures:['local-floor']});
    xr=session;mode='xr';rootYaw=0;accum=0;last=0;
    session.addEventListener('end',()=>finishXR(session),{once:true});
    session.addEventListener('visibilitychange',()=>{
      if(session.visibilityState!=='visible'){paused=true;resetInputs();}
    });
    session.addEventListener('inputsourceschange',e=>{
      if(e.removed?.length){paused=true;resetInputs();show('Controller changed · VR paused.');}
    });
    await renderer.gl.makeXRCompatible?.();
    xrLayer=new XRWebGLLayer(session,renderer.gl,{antialias:false,alpha:false,
      framebufferScaleFactor:.85});
    session.updateRenderState({baseLayer:xrLayer,depthNear:.05,depthFar:80});
    try{xrSpace=await session.requestReferenceSpace('local-floor');floorShift=0;}
    catch{xrSpace=await session.requestReferenceSpace('local');floorShift=-1.6;}
    xrSpace.addEventListener?.('reset',()=>{paused=true;resetInputs();rootYaw=0;
      show('Tracking reset · VR paused.');});
    paused=false;show('IMMERSIVE VR ACTIVE · LT dash · RT power · right grip gate · right stick snap-turn');
    pauseButton.disabled=false;exitVR.disabled=false;enterVR.disabled=true;
    mode='xr';frameId=session.requestAnimationFrame(onXRFrame);
  }catch(error){
    show('Unable to enter VR: '+error.message);
    if(session){try{await session.end();}catch{}}
    else{mode='idle';paused=true;}
  }
}
function finishXR(session){
  if(xr!==session)return;
  xr=null;xrSpace=null;xrLayer=null;frameId=null;
  resetInputs();paused=true;mode='idle';last=0;accum=0;
  pauseButton.disabled=true;exitVR.disabled=true;enterVR.disabled=false;
  show('Immersive session ended. Progress was never written to your Descent save.');
}
async function leaveXR(){
  const session=xr;if(!session)return;
  try{await session.end();}
  catch{finishXR(session);}
}
async function checkXR(){
  if(!navigator.xr?.isSessionSupported){
    $('xr-support').textContent='WebXR immersive mode is not offered by this browser.';
    return;
  }
  try{
    const enabled=await navigator.xr.isSessionSupported('immersive-vr');
    $('xr-support').textContent=enabled?'Immersive VR available · Quest Browser / HTTPS':
      'No immersive headset detected · desktop preview still works';
  }catch{
    $('xr-support').textContent='Cannot verify headset support · desktop preview still works';
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
reset.addEventListener('click',()=>{
  state=createVRPreview();rootYaw=0;desktopYaw=0;desktopPitch=0;
  last=0;accum=0;outputStamp='';resetInputs();
  updateInfo(true);show('Separate prototype reset. Campaign saves unchanged.');
});
window.addEventListener('keydown',event=>{
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.code))
    event.preventDefault();
  if(event.repeat)return;
  if(event.code==='Space')desktopActions.dash=true;
  else if(event.code==='KeyF')desktopActions.power=true;
  else if(event.code==='KeyE')desktopActions.interact=true;
  else if(event.code==='Escape'&&mode==='desktop'){
    paused=!paused;resetInputs();show(paused?'Desktop preview paused':'Desktop preview resumed');
  }
  keys.add(event.code);
});
window.addEventListener('keyup',event=>keys.delete(event.code));
window.addEventListener('blur',()=>{if(mode!=='idle'){
  paused=true;resetInputs();show('Preview paused on window blur.');
}});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden&&mode!=='idle'){
    paused=true;resetInputs();show('Preview paused while hidden.');
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
updateInfo(true);void checkXR();
