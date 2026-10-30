export const XR_REALITY_DIAGNOSTICS_VERSION='spark.xr.reality-diagnostics.v1';
const STATES=['idle','launching','ready','paused','neutral-required','tracking-unavailable','controller-disconnected','safe-boundary','tracking-jump','cadence','visibility','input-range','collision-blocked','calibration','error'];
const ERRORS=['XR_UNSUPPORTED','PERMISSION_DENIED','XR_LAUNCH_FAILED','XR_FRAME_FAILED','WEBGL_CONTEXT_LOST'];
export class XRRealityDiagnostics{
 constructor(){this.current={session:'idle',mode:'descent',state:'idle',quality:'balanced',controllers:{left:{detected:false,grip:false,ray:false},right:{detected:false,grip:false,ray:false}},lastError:null};this.counts=Object.fromEntries(STATES.map(s=>[s,0]));}
 observe({session='idle',mode='descent',input,paused=false,calibrating=false,pending=false,quality='balanced',collision=false,error=null}={}){
  const code=error?'error':pending?'launching':session==='idle'?'idle':calibrating?'calibration':!input?.valid?input?.status?.code||'tracking-unavailable':paused?'paused':input.ready===false?'neutral-required':collision?'collision-blocked':'ready',
   state=STATES.includes(code)?code:'tracking-unavailable';
  if(state!==this.current.state)this.counts[state]++;
  this.current={session:['idle','xr','desktop'].includes(session)?session:'idle',mode:mode==='duel'?'duel':'descent',state,
   quality:['performance','balanced','high'].includes(quality)?quality:'balanced',controllers:{},lastError:error?(ERRORS.includes(error)?error:'XR_ERROR'):this.current.lastError};
  for(const side of ['left','right'])this.current.controllers[side]=Object.fromEntries(['detected','grip','ray'].map(k=>[k,input?.controllers?.[side]?.[k]===true]));
  return this.snapshot();
 }
 snapshot(){return {schema:XR_REALITY_DIAGNOSTICS_VERSION,...structuredClone(this.current),transitions:{...this.counts},privacy:'Local aggregate state only; no poses, axes, recordings, saves or automatic upload',hardwareAcceptance:'Manual Quest retest required'};}
}
