import {loadXRCalibration,storeXRCalibration,xrCalibration} from './spark-xr-calibration.js';
// Browser preferences and local diagnostics, deliberately separate from saves.
export function installXRControls(runtime,{legacyDesktop=false}={}){
 let storage;try{storage=globalThis.localStorage;}catch{}
 runtime.calibration=loadXRCalibration(storage);
 const section=document.createElement('section');section.className='comfort-panel xr-reality';section.setAttribute('aria-label','Hands calibration and live input diagnostics');
 section.innerHTML='<h2>HANDS &amp; CONTROLS</h2><p>Small controller gauntlets. Adjust the hand and pointer separately. Calibration pauses play and grants no rewards.</p><div class="toolbar"><button data-calibrate>Calibrate hands'+(legacyDesktop?' in VR':'')+'</button><button data-recover>Recover controls</button><button data-diagnostics>Input diagnostics</button><button data-export>Export local diagnostics</button></div><p data-live role="status" aria-live="polite"></p><details><summary>Calibration preferences</summary><p>Hand adjustments change appearance. Pointer adjustments rotate aim without moving its origin. Start with small changes.</p><div class="comfort-controls" data-controls></div><button data-reset>Reset hand / pointer preferences</button></details>';
 const target=document.querySelector('.comfort-panel')||document.querySelector('.toolbar');target?.insertAdjacentElement('afterend',section);
 const controls=section.querySelector('[data-controls]'),inputs={},make=(id,label,values,change)=>{
  const wrap=document.createElement('label'),select=document.createElement('select');select.setAttribute('aria-label',label);
  wrap.append(document.createTextNode(label));for(const [value,text]of values){const option=document.createElement('option');option.value=value;option.textContent=text;select.append(option);}
  select.addEventListener('change',()=>change(select.value));wrap.append(select);controls.append(wrap);inputs[id]=select;return select;
 };
 const values=xs=>xs.map(x=>[String(x),String(x)]);
 make('scale','Hand size',[.75,.9,1,1.1,1.2].map(x=>[x,Math.round(x*100)+'%']),v=>runtime.configureCalibration({scale:Number(v)}));
 make('wristSide','Wrist attachment',[['left','Left'],['right','Right']],v=>runtime.configureCalibration({wristSide:v}));
 make('panelMode','Panel position',[['wrist','Wrist · floating fallback'],['floating','Floating when opened']],v=>runtime.configureCalibration({panelMode:v}));
 make('target','Adjust hand',[['both','Both'],['left','Left'],['right','Right']],v=>{runtime.calibrationSide=v;refresh(runtime.calibration);});
 for(const [id,label,group,key,choices]of [
  ['height','Hand lift (cm)','grip','height',[-4,-2,0,2,4]],['depth','Hand depth (cm)','grip','depth',[-4,-2,0,2,4]],
  ['pitch','Hand tilt (degrees)','grip','pitch',[-20,-10,0,10,20]],['roll','Hand roll (degrees)','grip','roll',[-20,-10,0,10,20]],
  ['rayPitch','Pointer pitch (degrees)','ray','pitch',[-10,-5,0,5,10]],['rayYaw','Pointer yaw (degrees)','ray','yaw',[-10,-5,0,5,10]]]){
   make(id,label,values(choices),value=>{const patch={[group]:{}},side=runtime.calibrationSide||'both';
    for(const s of side==='both'?['left','right']:[side])patch[group][s]={[key]:Number(value)/(id==='height'||id==='depth'?100:1)};runtime.configureCalibration(patch);});
 }
 const refresh=c=>{const side=runtime.calibrationSide==='left'?'left':'right';for(const key of ['scale','wristSide','panelMode'])inputs[key].value=String(c[key]);
  inputs.target.value=runtime.calibrationSide||'both';for(const [id,value]of Object.entries({height:c.grip[side].height*100,depth:c.grip[side].depth*100,pitch:c.grip[side].pitch,roll:c.grip[side].roll,rayPitch:c.ray[side].pitch,rayYaw:c.ray[side].yaw}))inputs[id].value=String(Math.round(value*100)/100);};
 const onCalibration=runtime.onCalibration;runtime.onCalibration=c=>{onCalibration(c);try{storeXRCalibration(storage,c);}catch{}refresh(c);};refresh(runtime.calibration);
 section.querySelector('[data-calibrate]').onclick=()=>{
  if(legacyDesktop&&runtime.mode==='idle'){runtime.onStatus('Enter immersive VR, then open Session → Calibrate hands · tracked desktop calibration is in the Living hub');return;}
  runtime.setCalibration(true);if(runtime.mode==='idle')runtime.onStatus('Calibration selected · press Enter immersive VR or Desktop 3D preview');};
 const legacyNotice=()=>legacyDesktop&&runtime.mode==='idle'?(runtime.onStatus('Tracked controls apply in immersive VR here · use the Living hub for tracked desktop calibration and diagnostics'),true):false;
 section.querySelector('[data-recover]').onclick=()=>{if(!legacyNotice())runtime.recoverControls();};
 section.querySelector('[data-diagnostics]').onclick=()=>{if(!legacyNotice()){runtime.pause(true,'Input diagnostics');runtime.focusPage('Diagnostics');}};
 section.querySelector('[data-reset]').onclick=()=>runtime.configureCalibration(xrCalibration());
 section.querySelector('[data-export]').onclick=()=>{const blob=new Blob([JSON.stringify(runtime.reality.snapshot(),null,2)+'\n'],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='spark-xr-input-diagnostics.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);};
 const onSnapshot=runtime.onSnapshot;let stamp='';runtime.onSnapshot=scene=>{onSnapshot(scene);const d=scene.diagnostics;if(!d)return;
  const next=JSON.stringify([d,scene.statusMessage]);if(next===stamp)return;stamp=next;
  const hand=side=>{const x=d.controllers[side];return !x.detected?'disconnected':!x.grip?'grip unavailable':!x.ray?'pointer unavailable':'tracked';};
  section.querySelector('[data-live]').textContent=d.mode+' / '+d.session+' · L '+hand('left')+' · R '+hand('right')+' · '+d.state+' · '+d.quality+(scene.statusMessage?' · '+scene.statusMessage:'')+(d.lastError?' · last error '+d.lastError:'');};
 const onMode=runtime.onMode;runtime.onMode=mode=>{onMode(mode);for(const button of document.querySelectorAll('#living-vr,#enter-vr,#enter-arena-vr,#living-desktop,#arena-desktop'))button.disabled=runtime.pending||mode==='xr';
  const d=runtime.reality.snapshot();section.querySelector('[data-live]').textContent=d.mode+' / '+d.session+' · '+d.state+' · '+d.quality+(d.lastError?' · last error '+d.lastError:'');};
 section.querySelector('[data-live]').textContent='No display session · choose VR or desktop preview. Diagnostics stay local.';
 return section;
}
