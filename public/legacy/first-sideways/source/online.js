import {GuestInputHistory} from './coop-input.js?v=0.13.0';
import {cleanPlayerName} from './coop-state.js?v=0.13.0';
// Both players use the descent simulation. The host relays live snapshots;
// the guest sends held input and single-use actions through the same room.
export class OnlineRoom{
 constructor(onUpdate,onError,options={}){
  this.fetcher=options.fetch??globalThis.fetch?.bind(globalThis);this.storage=options.storage;
  this.now=options.now??Date.now;this.onUpdate=onUpdate;this.onError=onError;
  this.session=null;this.seq=0;this.timer=null;this.busy=false;this.source=null;this.displayName=cleanPlayerName(options.name);this.inputDirty=false;this.urgent=false;
  this.history=new GuestInputHistory();this.fastBusy=0;this.fastAt=0;this.pending=this.neutral();this.inputAt=0;this.inputGeneration=0;
  this.errors=0;this.lastSuccess=0;this.lastAttempt=0;this.latency=0;this.inFlight=null;
 }
 neutral(){return {x:0,y:0,fire:false,fireMode:this.pending?.fireMode??'auto',dash:false,interact:false,power:false,morph:null,active:false,fallAck:0};}
 sessionStore(){return this.storage??globalThis.sessionStorage;}
 get role(){return this.session?.role;}get code(){return this.session?.code;}get active(){return !!this.session;}
 async request(path,value={},authorize=true){
  const response=await this.fetcher('/api/rooms'+path,{method:'POST',cache:'no-store',headers:{'content-type':'application/json',...(authorize&&this.session?{authorization:'Bearer '+this.session.token}:{})},body:JSON.stringify(value),signal:AbortSignal.timeout(6000)});
  let data;try{data=await response.json();}catch{throw Error('The room service did not respond. Try again shortly.');}
  if(!response.ok){const error=Error(data.error??'Unable to connect to the room.');error.status=response.status;throw error;}return data;
 }
 remember(){try{this.sessionStore()?.setItem('spark-online-room-v1',JSON.stringify(this.session));}catch{}}
 async host(run){const session=await this.request('',{run,name:this.displayName},false);this.session=session;this.seq=0;this.remember();this.start();return session;}
 async join(code,form){const session=await this.request('/'+code+'/join',{form,name:this.displayName},false);this.session=session;this.seq=0;this.remember();this.start();return session;}
 async resume(){
  let session;try{session=JSON.parse(this.sessionStore()?.getItem('spark-online-room-v1')??'null');}catch{return false;}
  if(!session?.code||!session.token||!['host','guest'].includes(session.role))return false;
  this.session=session;
  try{const data=await this.request('/'+session.code+'/resume',{name:this.displayName});if(this.session!==session)return false;if(data.expired){this.session=null;try{this.sessionStore()?.removeItem('spark-online-room-v1');}catch{}return false;}this.seq=session.role==='host'?data.seq:data.inputSeq;this.lastSuccess=this.now();this.clearInput();this.onUpdate(data);this.start();return true;}
  catch(error){if(this.session!==session)return false;this.session=null;try{this.sessionStore()?.removeItem('spark-online-room-v1');}catch{}if(error.status!==404)this.onError(error.message);return false;}
 }
 setSource(source){this.source=source;}
 input(input){this.inputAt=this.now();const before=JSON.stringify(this.pending);this.pending={x:input.x??this.pending.x,y:input.y??this.pending.y,fire:input.fire??this.pending.fire,fireMode:['auto','manual','surge'].includes(input.fireMode)?input.fireMode:this.pending.fireMode,dash:this.pending.dash||!!input.dash,interact:input.interact??this.pending.interact,power:this.pending.power||!!input.power,morph:input.morph??this.pending.morph??null,active:input.active??true,fallAck:input.fallAck??this.pending.fallAck??0};this.inputDirty||=before!==JSON.stringify(this.pending);}
 capture(context){this.history.capture(this.pending,context);this.pending={...this.pending,dash:false,power:false,morph:null};}
 acknowledge(ack){this.history.acknowledge(ack);}
 clearInput(){this.history.reset(this.history.context);this.inputGeneration++;const before=JSON.stringify(this.pending);this.pending={...this.neutral(),fallAck:this.pending.fallAck??0};this.inputDirty||=before!==JSON.stringify(this.pending);this.inputAt=this.now();}
 async update(action,value){const session=this.session;if(!session)return;const data=await this.request('/'+session.code+'/'+action,value);if(this.session===session)this.onUpdate(data);return data;}
 async rename(name){this.displayName=cleanPlayerName(name);if(this.active)return this.update('name',{name:this.displayName});}
 async vote(context,index){if(this.role!=='guest')throw Error('Only the guest sends an advisory vote.');return this.update('vote',{context,index});}
 start(){this.stop();this.timer=setInterval(()=>this.sync(),100);}
 stop(){if(this.timer)clearInterval(this.timer);this.timer=null;}
 // The frame loop also pumps the relay. One request at a time prevents a
 // throttled interval or overlapping requests from starving live updates.
 pump(){if(!this.session)return;const snapshot=this.role==='guest'?this.source?.()?.run:null,fallen=!!snapshot?.partner&&[snapshot.player,snapshot.partner].some(a=>a.hp<=0);if(this.now()-(this.pulseAt??0)>=300&&(this.role==='host'||fallen||this.busy&&this.now()-this.lastAttempt>600))void this.pulse();if(this.role==='guest'&&this.history.started&&(this.inputDirty||this.now()-this.fastAt>=80))void this.sendInput();const changed=this.role==='guest'&&this.inputDirty;if(changed&&this.busy){this.urgent=true;return;}if(changed||this.now()-this.lastAttempt>=100)void this.sync();}
 async pulse(){if(!this.session||this.pulseBusy)return;const session=this.session;this.pulseBusy=true;this.pulseAt=this.now();try{const data=await this.request('/'+session.code+'/pulse');if(this.session===session){if(this.role==='guest'){this.lastSuccess=this.now();this.errors=0;}this.onUpdate(data);}}catch{/* World sync owns connection errors; pulse retries independently. */}finally{this.pulseBusy=false;}}
 async sendInput(){
  if(this.role!=='guest'||!this.session||this.fastBusy>=2)return;
  const session=this.session;this.fastBusy++;this.fastAt=this.now();this.inputDirty=false;
  const payload={seq:++this.seq,input:{...this.pending,stream:this.history.batch()}};
  try{const data=await this.request('/'+session.code+'/input',payload);if(this.session===session){this.seq=Math.max(this.seq,data.inputSeq??0);}}
  catch{/* The cumulative history retries on the next batch or world poll. */}
  finally{this.fastBusy--;}
 }
 async sync(){
  if(this.busy)return this.inFlight;if(!this.session)return;
  const source=this.source?.();if(this.role==='host'&&!source?.run)return;
  if(this.role==='guest'&&this.now()-this.inputAt>1200)this.clearInput();
  if(this.role==='guest'&&this.history.started&&(this.pending.morph||this.pending.power||this.pending.dash))this.capture(this.history.context);
  const session=this.session,sent=this.pending,generation=this.inputGeneration;
  this.pending={...sent,dash:false,power:false,morph:null};this.inputDirty=false;this.urgent=false;this.busy=true;this.lastAttempt=this.now();
  const payload=this.role==='host'?{...source,seq:++this.seq}:{seq:++this.seq,input:{...sent,...(this.history.started?{stream:this.history.batch()}: {})}};
  this.inFlight=this.request('/'+this.code+'/sync',payload).then(data=>{
   if(this.session!==session)return;
   // Catch up to persisted sequences when a room resumes. Otherwise a stale
   // counter can silently send updates the server must keep discarding.
   const acknowledged=this.role==='host'?data.seq:data.inputSeq;
   if(Number.isSafeInteger(acknowledged))this.seq=Math.max(this.seq,acknowledged);
   this.errors=0;this.lastSuccess=this.now();this.latency=Math.max(0,this.lastSuccess-this.lastAttempt);this.onUpdate(data);
  }).catch(error=>{
   if(this.session!==session)return;this.errors++;if(this.errors===1||this.errors%10===0)this.onError(error.message);
   if(this.role==='guest'&&generation===this.inputGeneration){this.pending.dash||=sent.dash;this.pending.power||=sent.power;this.pending.morph??=sent.morph;}
  }).finally(()=>{this.busy=false;this.inFlight=null;const again=this.urgent&&!this.errors&&this.session===session;this.urgent=false;if(again)void this.sync();});
  return this.inFlight;
 }
 async leave(){const session=this.session;this.stop();this.clearInput();if(session){try{await this.request('/'+session.code+'/leave');}catch{}}this.session=null;try{this.sessionStore()?.removeItem('spark-online-room-v1');}catch{}this.seq=0;this.errors=0;}
}
