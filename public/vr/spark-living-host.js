import {DescentXRAdapter,DuelXRAdapter} from './spark-xr-adapters.js';
import {createVRPreview} from './spark-vr-model.js';
import {loadVRCheckpoint,saveVRCheckpoint} from './spark-vr-save.js';
import {moreBounceEligible} from './spark-more-bounce.js';
export const LIVING_HOST_VERSION='spark.xr.living-host.v1';
export class LivingSparkHost{
  constructor({runtime,storage,onMode=()=>{},onStatus=()=>{}}){
    Object.assign(this,{runtime,storage,onMode,onStatus});
    this.adapters={descent:runtime.adapter.id==='descent'?runtime.adapter:new DescentXRAdapter(),
      duel:runtime.adapter.id==='duel'?runtime.adapter:new DuelXRAdapter()};
    this.mode=runtime.adapter.id;this.switching=false;this.lastSave=-1;
    runtime.menuExtras=()=>this.menu();
  }
  get descent(){return this.adapters.descent;}
  status(text){this.notice=text;this.onStatus(text);this.runtime.pauseReason=text;}
  save(){
    const result=saveVRCheckpoint(this.storage,this.descent.state);
    this.lastSave=this.descent.state.run.time;this.status('VR checkpoint saved · '+result.room);return result;
  }
  restore(){
    const restored=loadVRCheckpoint(this.storage);if(!restored)throw Error('No VR checkpoint is available.');
    this.descent.dispose();this.descent.state=restored;this.runtime.recenter();
    this.status('Original VR checkpoint restored · resume when ready');return restored;
  }
  choose(id){this.descent.choose(id);this.runtime.pause(this.descent.state.run.phase!=='playing');}
  menu(){
    const rows=[];
    if(this.mode==='descent'){
      const s=this.descent.snapshot();
      for(const choice of s.choices)rows.push([choice.title,()=>this.choose(choice.id)]);
      rows.push(['Combat: '+(s.combatProfile==='spellcraft'?'Spellcraft':'Classic'),()=>this.runtime.configure({combatProfile:s.combatProfile==='spellcraft'?'classic':'spellcraft'})],
        ['Casting hand: '+s.dominantHand,()=>this.runtime.configure({dominantHand:s.dominantHand==='right'?'left':'right'})],
        ['Aim assistance: '+s.aimAssist+'°',()=>this.runtime.configure({aimAssist:[0,3,6][([0,3,6].indexOf(s.aimAssist)+1)%3]})]);
      rows.push(['Save VR checkpoint',()=>this.save()],['Restore VR checkpoint',()=>this.restore()]);
      for(const gate of s.gates)rows.push([(gate.entry.available?'Enter ':'Inspect ')+gate.direction.toUpperCase()+' · '+gate.toName,()=>{
        if(gate.entry.available){this.descent.enterGate(gate.direction);this.runtime.pause(false);}
        else this.status(gate.entry.reason||gate.reason||'This gate is locked.');
      }]);
      if(s.morphAvailable)for(const form of s.availableForms)rows.push(['Become '+form+(s.morphCooldown>0?' · recovering':''),()=>this.descent.morph(form)]);
      else rows.push(['Resonance: find the Mirror Nursery',()=>this.status('Vessel Resonance is earned in the Mirror Nursery.')]);
      if(s.roomId==='forge'&&s.cleared)rows.push(moreBounceEligible(this.descent.state.run)?
        ['Listen between the notes',()=>{this.descent.moreBounce.activate(this.descent.state.run,this.runtime.settings);this.runtime.pause(false);this.status('MORE BOUNCE · a celebration after battle');}]:
        ['A rhythm without orders',()=>this.status('Three ripples. Six echoes. A ninth note remembers kindness.')]);
      rows.push(['Choose Elemental Ascension',()=>void this.setMode('duel')]);
    }else rows.push(['Choose Descent campaign',()=>void this.setMode('descent')]);
    rows.push(['Return to mode hub',()=>void this.returnToHub()]);
    return rows;
  }
  async returnToHub(){
    if(this.mode==='descent'&&this.descent.state.ticks>0){try{this.save();}catch(error){this.status(error.message);}}
    await this.runtime.exit();this.onMode(this.mode);
  }
  async setMode(id){
    if(!Object.hasOwn(this.adapters,id))throw Error('This XR mode is not implemented.');
    if(this.switching)return false;
    this.switching=true;
    try{
      await this.returnToHub();this.runtime.adapter.dispose?.();
      this.mode=id;this.runtime.adapter=this.adapters[id];this.runtime.menuIndex=0;this.runtime.recenter();
      this.runtime.adapter.configureCombat?.(this.runtime.settings);
      this.onMode(id);this.status((id==='descent'?'Descent journey':'Ascension encounter')+' ready · choose desktop or Enter VR');
      return true;
    }finally{this.switching=false;}
  }
  newJourney(){this.descent.dispose();this.descent.state=createVRPreview();this.runtime.recenter();}
  checkpointIfDue(){
    if(this.mode!=='descent'||!this.descent.state.ticks)return;
    const run=this.descent.state.run;
    if(this.lastSave<0||run.time-this.lastSave>=15||this.savedRoom!==run.room){
      try{saveVRCheckpoint(this.storage,this.descent.state);this.lastSave=run.time;this.savedRoom=run.room;}
      catch(error){this.status('Checkpoint unavailable: '+error.message);}
    }
  }
  worldModePacket(){
    const s=this.runtime.adapter.snapshot();
    return {schema:'spark.xr.wrist-world.v1',host:'SparkTheSubstrate',mode:this.mode,
      state:{vessel:s.form,health:s.health,maxHealth:s.maxHealth,powerRecovery:s.cooldown,
        combatProfile:s.combatProfile,basicRecovery:s.attackCooldown,attack:s.weapon,
        aim:s.aim?.blocked?'Cover blocks the ray':s.aim?.targetId?'Observed enemy '+s.aim.targetId:s.aim?.reason??'No observed enemy',
        guardians:s.guardians?.map(g=>({kind:g.kind,health:g.hp,maxHealth:g.maxHp,movement:g.stage})),
        room:s.roomName,world:s.worldName,objective:s.notice,keys:s.keys||[],seals:s.seals||[],relics:s.relics||[]},
      // Future GenEWrist WORLD MODE consumer can bind these IDs to this host's menu.
      actions:this.menu().map(([label],index)=>({id:'spark-menu-'+index,label})),externalDependency:false};
  }
}
