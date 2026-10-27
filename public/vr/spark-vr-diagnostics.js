// Privacy-preserving Quest/WebXR test summary. No headset pose, origin,
// controller axes, user agent, game saves, room names, IP or identifiers collected.
// All data stays in memory until a player explicitly exports JSON.
export const QUEST_DIAGNOSTIC_SCHEMA='spark.quest3.field-report.v1';
export const QUEST_ACCEPTANCE_CASES=Object.freeze([
  Object.freeze({id:'xr-entry',label:'Immersive session enters Quest Browser successfully'}),
  Object.freeze({id:'stereo',label:'Both eyes render with correct depth and scale'}),
  Object.freeze({id:'head-pose',label:'Head movement tracks without drifting'}),
  Object.freeze({id:'movement',label:'Left-stick movement and right-stick snap turn work'}),
  Object.freeze({id:'abilities',label:'Dash and vessel power respond correctly'}),
  Object.freeze({id:'gate',label:'Threshold to Glass gate opens by normal Spark rules'}),
  Object.freeze({id:'compass',label:'Left-Y compass opens, pauses combat, then closes'}),
  Object.freeze({id:'comfort',label:'Speed and mask are tolerable while seated'}),
  Object.freeze({id:'save',label:'VR-only checkpoint restores and original saves are untouched'}),
  Object.freeze({id:'progression',label:'Glass to Machine and a real karma/gift choice work'}),
  Object.freeze({id:'recovery',label:'Tracking/controller interruption pauses without losing progress'}),
  Object.freeze({id:'exit',label:'Exiting immersive mode safely returns to the browser'})
]);
const MAX_SAMPLES=480;
const EVENTS=Object.freeze([
  'xr-start-requested','xr-start-failed','xr-started','xr-ended',
  'visibility-paused','pose-unavailable','controller-interrupted',
  'tracking-reset','runtime-error','compass-opened','compass-closed',
  'choice-confirmed','checkpoint-saved','save-failed'
]);
const finite=(n,min,max)=>Number.isFinite(n)&&n>=min&&n<=max?n:null;

export function createQuestDiagnostics(){
  return {status:'not-started',sessions:0,frames:0,stereoFrames:0,
    maxEyeViews:0,leftControllerSeen:false,rightControllerSeen:false,
    referenceSpace:'unknown',lastTimestamp:null,intervals:[],renderMs:[],
    events:Object.fromEntries(EVENTS.map(name=>[name,0]))};
}
export function noteQuestEvent(state,event){
  if(!EVENTS.includes(event))throw Error('Unrecognized Quest diagnostic event.');
  state.events[event]=(state.events[event]||0)+1;
}
export function beginQuestDiagnostics(state,referenceSpace='unknown'){
  if(!['unknown','local-floor','local'].includes(referenceSpace))
    throw Error('Invalid WebXR reference-space category.');
  state.status='active';state.sessions++;
  state.referenceSpace=referenceSpace;state.lastTimestamp=null;
  noteQuestEvent(state,'xr-started');
}
export function setQuestReferenceSpace(state,referenceSpace){
  if(!['local-floor','local'].includes(referenceSpace))
    throw Error('Invalid XR reference-space category.');
  state.referenceSpace=referenceSpace;
}
function pushBounded(buffer,value){
  if(buffer.length>=MAX_SAMPLES)buffer.shift();
  buffer.push(value);
}
export function recordQuestFrame(state,{timestamp,viewCount,renderSubmissionMs,left,right}){
  if(state.status!=='active')return;
  state.frames++;
  const count=Number.isInteger(viewCount)?Math.max(0,Math.min(4,viewCount)):0;
  if(count===2)state.stereoFrames++;
  state.maxEyeViews=Math.max(state.maxEyeViews,count);
  if(left===true)state.leftControllerSeen=true;
  if(right===true)state.rightControllerSeen=true;
  const ts=finite(timestamp,0,Number.MAX_SAFE_INTEGER);
  if(ts!==null){
    const delta=state.lastTimestamp===null?null:ts-state.lastTimestamp;
    if(delta!==null&&delta>=2&&delta<=250)pushBounded(state.intervals,delta);
    state.lastTimestamp=ts;
  }
  const cpu=finite(renderSubmissionMs,0,1000);
  if(cpu!==null)pushBounded(state.renderMs,cpu);
}
export function endQuestDiagnostics(state){
  if(state.status==='active')state.status='ended';
  state.lastTimestamp=null;
  noteQuestEvent(state,'xr-ended');
}
const round=n=>Math.round(n*10)/10;
const quantile=(numbers,p)=>{
  if(!numbers.length)return null;
  const sorted=[...numbers].sort((a,b)=>a-b);
  const position=(sorted.length-1)*p;
  const low=Math.floor(position),high=Math.ceil(position);
  return round(sorted[low]+(sorted[high]-sorted[low])*(position-low));
};
export function summarizeQuestDiagnostics(state){
  return {
    sessionStatus:state.status,sessionCount:state.sessions,
    renderedFrames:state.frames,
    framesWithTwoEyes:state.stereoFrames,
    maximumViewsSeen:state.maxEyeViews,
    leftControllerDetected:state.leftControllerSeen,
    rightControllerDetected:state.rightControllerSeen,
    referenceSpace:state.referenceSpace,
    frameIntervalMilliseconds:{
      samples:state.intervals.length,median:quantile(state.intervals,.5),
      p95:quantile(state.intervals,.95)
    },
    javascriptRenderSubmissionMilliseconds:{
      samples:state.renderMs.length,median:quantile(state.renderMs,.5),
      p95:quantile(state.renderMs,.95)
    },
    eventCounts:{...state.events}
  };
}
export function questAcceptanceReport(state,selection={}){
  const checks=QUEST_ACCEPTANCE_CASES.map(item=>{
    const value=selection[item.id];
    return {id:item.id,result:['pass','fail','not-tested'].includes(value)?
      value:'not-tested'};
  });
  const counts={
    pass:checks.filter(c=>c.result==='pass').length,
    fail:checks.filter(c=>c.result==='fail').length,
    notTested:checks.filter(c=>c.result==='not-tested').length
  };
  return {
    schema:QUEST_DIAGNOSTIC_SCHEMA,
    releaseReadiness:'MANUAL_QUEST_ACCEPTANCE_REQUIRED',
    provenance:'locally captured WebXR browser metrics and manually selected checks',
    scope:'No personal data, headset pose, controller values, game saves or network upload.',
    diagnostics:summarizeQuestDiagnostics(state),
    manualChecks:checks,counts,
    measurementLimitations:[
      'Frame intervals approximate browser callback cadence, not headset FPS or GPU frame time.',
      'CPU render-submission duration is not GPU time.',
      'Two-eye viewport count is not proof of perceived stereoscopic correctness.',
      'Controller detection does not prove action mappings or comfort.',
      'Only a tester can mark manual checks pass or fail.'
    ]
  };
}
