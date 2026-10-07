export const INPUT_TICK=1/60,MAX_INPUT_TICKS=240;
export const movementContext=run=>run?run.seed+':'+run.room:'';
const epoch=()=>Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12);
const neutral=mode=>({x:0,y:0,fire:false,fireMode:mode??'auto',dash:false,power:false,interact:false,morph:null});

// A frame has a fixed duration. Packet arrival time never determines how far
// a held direction moves, and resending a frame cannot apply it twice.
export class GuestInputHistory{
 constructor(){this.started=false;this.reset();}
 reset(context=''){this.epoch=epoch();this.context=context;this.tick=0;this.frames=[];}
 capture(input,context){
  this.started=true;if(this.context!==context||this.frames.length>=MAX_INPUT_TICKS)this.reset(context);
  const frame={...neutral(input.fireMode),...input,tick:++this.tick};delete frame.active;delete frame.menu;delete frame.fallAck;
  this.frames.push(frame);return frame;
 }
 batch(){return this.started?{epoch:this.epoch,context:this.context,frames:this.frames.map(frame=>({...frame}))}:null;}
 acknowledge(ack){if(ack?.epoch===this.epoch&&Number.isSafeInteger(ack.tick)&&ack.tick<=this.tick)this.frames=this.frames.filter(frame=>frame.tick>ack.tick);}
}

export class PartnerInputPlayback{
 constructor(){this.epoch=null;this.tick=0;this.context='';this.frames=new Map();this.mode='auto';this.lastInteract=false;this.missing=0;}
 restore(ack){if(ack?.epoch&&Number.isSafeInteger(ack.tick)){this.epoch=ack.epoch;this.tick=ack.tick;this.context=ack.context??'';this.frames.clear();this.lastInteract=false;this.missing=0;}}
 receive(input,context,playing=true){
  const batch=input?.stream;if(!batch)return;
  if(batch.epoch!==this.epoch){this.epoch=batch.epoch;this.tick=0;this.frames.clear();this.lastInteract=false;this.missing=0;}
  this.context=batch.context;this.mode=input.fireMode??'auto';
  for(const frame of batch.frames)if(frame.tick>this.tick&&!this.frames.has(frame.tick))this.frames.set(frame.tick,{...frame});
  if(input.active===false||batch.context!==context||!playing)this.discard();
 }
 discard(){this.lastInteract=false;this.missing=0;for(const tick of this.frames.keys())this.tick=Math.max(this.tick,tick);this.frames.clear();}
 next(){const frame=this.frames.get(this.tick+1);if(!frame)return {...neutral(this.mode),interact:this.lastInteract&&++this.missing<=12};this.frames.delete(++this.tick);this.lastInteract=!!frame.interact;this.missing=0;return frame;}
 acknowledgement(){return {epoch:this.epoch,tick:this.tick,context:this.context};}
}
