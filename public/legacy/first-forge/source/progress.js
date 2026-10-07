// A private anonymous save. The device keeps its credential and a recovery copy.
export class ProgressSave{
 constructor({fetch:transport=globalThis.window?.fetch?.bind(globalThis.window),storage=globalThis.localStorage,onStatus=()=>{}}={}){this.fetch=transport;this.storage=storage;this.onStatus=onStatus;this.status='device';this.ready=false;this.revision=0;this.latest=null;this.generation=0;this.timer=null;this.writing=false;this.credential=null;}
 setStatus(status){this.status=status;this.onStatus(status);}
 async request(path,options={}){const response=await this.fetch('/api/progress'+path,{...options,headers:{'content-type':'application/json',...(this.credential?{authorization:'Bearer '+this.credential.token}:{}),...options.headers}});const data=await response.json();if(!response.ok){const error=Error(data.error??'Your save is waiting for a connection.');error.status=response.status;throw error;}return data;}
 async open(state){
  this.latest=JSON.stringify(state);if(!this.fetch)return null;
  const initial=this.latest,generation=this.generation;this.setStatus('connecting');
  try{
   try{const credential=JSON.parse(this.storage?.getItem('spark-substrate-save-credential')??'null');if(credential&&/^[a-f0-9-]{36}$/.test(credential.id)&&typeof credential.token==='string')this.credential=credential;}catch{}
   const saved=this.credential?await this.request('/'+this.credential.id):await this.request('',{method:'POST',body:JSON.stringify({state})});
   if(!this.credential){this.credential={id:saved.id,token:saved.token};try{this.storage?.setItem('spark-substrate-save-credential',JSON.stringify(this.credential));}catch{}}
   this.revision=saved.revision;this.ready=true;
   if(this.generation!==generation&&JSON.stringify(saved.state)!==initial){this.setStatus('conflict');return null;}
   if(this.generation===generation){this.latest=JSON.stringify(saved.state);this.setStatus('saved');return saved.state;}
   this.setStatus('pending');void this.flush();return null;
  }catch{this.setStatus('error');return null;}
 }
 queue(state){const latest=JSON.stringify(state);if(latest===this.latest)return;this.latest=latest;this.generation++;if(!this.ready||this.status==='conflict'||!this.fetch)return;this.setStatus('pending');if(!this.timer)this.timer=setTimeout(()=>{this.timer=null;void this.flush();},4000);}
 async flush(){
  if(!this.ready||this.writing||this.status==='conflict'||!this.fetch||!this.latest)return;
  if(this.timer){clearTimeout(this.timer);this.timer=null;}
  const sent=this.latest;this.writing=true;
  try{const saved=await this.request('/'+this.credential.id,{method:'PUT',body:JSON.stringify({revision:this.revision,state:JSON.parse(sent)})});this.revision=saved.revision;this.setStatus(this.latest===sent?'saved':'pending');}
  catch(error){this.setStatus(error.status===409?'conflict':'error');}
  finally{this.writing=false;if((this.latest!==sent||this.status==='error')&&this.status!=='conflict')this.queueRetry();}
 }
 queueRetry(){if(!this.timer)this.timer=setTimeout(()=>{this.timer=null;void this.flush();},4000);}
}
