// All online actions use the same simulation as solo play. HTTPS relay keeps
// rooms usable behind NAT without requiring a third-party signaling service.
export class OnlineRoom{
 constructor(onUpdate,onError,options={}){this.fetcher=options.fetch??globalThis.fetch;this.onUpdate=onUpdate;this.onError=onError;this.session=null;this.seq=0;this.timer=null;this.busy=false;this.source=null;this.pending={x:0,y:0,dash:false,interact:false};this.lastInputSeq=0;this.errors=0;this.lastSuccess=0;}
 get role(){return this.session?.role;}get code(){return this.session?.code;}get active(){return !!this.session;}
 async request(path,value={},authorize=true){const response=await this.fetcher('/api/rooms'+path,{method:'POST',headers:{'content-type':'application/json',...(authorize&&this.session?{authorization:'Bearer '+this.session.token}:{})},body:JSON.stringify(value),signal:AbortSignal.timeout(6000)});let data;try{data=await response.json();}catch{throw Error('The room service did not respond. Try again shortly.');}if(!response.ok)throw Error(data.error??'Unable to connect to the room.');return data;}
 remember(){try{sessionStorage.setItem('spark-online-room-v1',JSON.stringify(this.session));}catch{}}
 async host(run){const session=await this.request('',{run},false);this.session=session;this.seq=0;this.remember();this.start();return session;}
 async join(code,form){const session=await this.request('/'+code+'/join',{form},false);this.session=session;this.seq=0;this.remember();this.start();return session;}
 async resume(){let session;try{session=JSON.parse(sessionStorage.getItem('spark-online-room-v1')??'null');}catch{return false;}if(!session?.code||!session.token||!['host','guest'].includes(session.role))return false;this.session=session;try{const data=await this.request('/'+session.code+'/resume');this.seq=session.role==='host'?data.seq:data.inputSeq;this.lastSuccess=Date.now();this.onUpdate(data);this.start();return true;}catch(error){this.session=null;try{sessionStorage.removeItem('spark-online-room-v1');}catch{}this.onError(error.message);return false;}}
 setSource(source){this.source=source;}
 input(input){this.pending={x:input.x,y:input.y,dash:this.pending.dash||!!input.dash,interact:this.pending.interact||!!input.interact};}
 start(){this.stop();this.timer=setInterval(()=>this.sync(),100);}
 stop(){if(this.timer)clearInterval(this.timer);this.timer=null;}
 async sync(){if(this.busy||!this.session)return;const source=this.source?.();if(this.role==='host'&&!source?.run)return;this.busy=true;const session=this.session,sent=this.pending;this.pending={...sent,dash:false,interact:false};
  try{const payload=this.role==='host'?{...source,seq:++this.seq}:{seq:++this.seq,input:sent};const data=await this.request('/'+this.code+'/sync',payload);if(this.session!==session)return;this.errors=0;this.lastSuccess=Date.now();this.onUpdate(data);}
  catch(error){if(this.session!==session)return;this.errors++;if(this.errors===1||this.errors%10===0)this.onError(error.message);if(this.role==='guest')this.pending.dash=this.pending.dash||sent.dash;}
  finally{this.busy=false;}
 }
 async leave(){const session=this.session;this.stop();if(session){try{await this.request('/'+session.code+'/leave');}catch{}}this.session=null;try{sessionStorage.removeItem('spark-online-room-v1');}catch{}this.pending={x:0,y:0,dash:false,interact:false};this.seq=0;this.errors=0;}
}
