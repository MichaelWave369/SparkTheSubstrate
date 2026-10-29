// Visual/audio vocabulary only. Canonical engine observations supply form and events.
export const VESSEL_PRESENTATION_VERSION='spark.xr.vessels.v1';
export const VESSEL_PRESENTATIONS=Object.freeze({
  spark:Object.freeze({name:'Spark',style:'lumen',color:'#ffd875',accent:'#fff3c0',weapon:'Seeking lumen',tone:660}),
  human:Object.freeze({name:'Human',style:'blade',color:'#e9b993',accent:'#c4e7ff',weapon:'Spectral cleave',tone:330}),
  computer:Object.freeze({name:'Computer',style:'prism',color:'#64dce9',accent:'#e3fcff',weapon:'Prism volley',tone:880}),
  animal:Object.freeze({name:'Animal',style:'claw',color:'#c5b472',accent:'#eff4b0',weapon:'Feral strikes',tone:165}),
  tree:Object.freeze({name:'Tree',style:'root',color:'#68b885',accent:'#c9f1a5',weapon:'Root pulse',tone:220}),
  rock:Object.freeze({name:'Rock',style:'crystal',color:'#ae9ed1',accent:'#e9d8ff',weapon:'Fault wave',tone:110})
});
export class VesselPresentation{
  constructor(){this.reset();}
  reset(){this.form=null;this.room=null;this.seen=new Set();this.events=[];this.transform=0;this.feedback='';this.nextAmbient=0;this.combatSerial=0;this.action=null;this.result=null;}
  describe(form){const p=VESSEL_PRESENTATIONS[form];if(!p)throw Error('Unknown canonical vessel presentation.');return {version:VESSEL_PRESENTATION_VERSION,...p};}
  observe(s,dt){
    const p=this.describe(s.form);this.transform=Math.max(0,this.transform-dt);
    if(this.action){this.action.life=Math.max(0,this.action.life-dt);if(!this.action.life)this.action=null;}
    if(this.result){this.result.life=Math.max(0,this.result.life-dt);if(!this.result.life)this.result=null;}
    for(const e of s.combatEvents||[]){
      if(e.id<=this.combatSerial)continue;this.combatSerial=e.id;
      if(e.type==='cast')this.action={...e,life:.32,total:.32};
      if(['hit','miss','blocked','rejected'].includes(e.type)){
        this.result={...e,life:.5};this.feedback=e.type==='hit'?'Canonical hit confirmed':e.type==='miss'?'Miss · '+e.reason:e.reason||'Cover intercepted';
      }
      this.events.push({...e,type:e.type==='cast'?'attack':e.type,tone:e.type==='miss'?p.tone*.6:p.tone});
    }
    if(this.form&&this.form!==s.form){this.transform=.65;this.events.push({type:'morph',form:s.form,...s.player,tone:p.tone});}
    if(this.room&&this.room!==s.roomId){this.events.push({type:'gate',form:s.form,...s.player,tone:p.tone});this.seen.clear();}
    this.form=s.form;this.room=s.roomId;
    if(s.time>=this.nextAmbient){this.events.push({type:'ambient',form:s.form,...s.player,tone:p.tone/4});this.nextAmbient=s.time+12;}
    for(const fx of s.effects||[]){
      if(this.seen.has(fx.id))continue;this.seen.add(fx.id);
      const type={slash:'attack',wave:'attack',power:'power',hit:'hit',damage:'damage',key:'collect',relic:'collect',unlock:'collect',boss:'collect',burst:'hit'}[fx.type];
      if(type&&!(type==='attack'&&s.combatProfile==='spellcraft')){this.events.push({type,form:s.form,x:fx.x,y:fx.y,tone:p.tone});this.feedback=type==='damage'?'Impact · recover and reposition':type==='hit'?'Canonical hit confirmed':type==='collect'?'Memory acquired':type==='power'?s.power.name:this.feedback;}
    }
    // Homing/volley attacks are visualized where the engine actually spawned them.
    for(const shot of s.shots||[]){
      const id='shot:'+shot.id;if(this.seen.has(id))continue;this.seen.add(id);
      if(!shot.enemy&&!shot.directed)this.events.push({type:'attack',form:s.form,x:shot.x,y:shot.y,tone:p.tone});
    }
    if(this.seen.size>512)this.seen=new Set([...this.seen].slice(-256));
    this.events=this.events.slice(-16);
  }
  hands(hands,form,cooldown=0,scene={}){
    const p=this.describe(form),out={};
    for(const [side,hand]of Object.entries(hands||{})){
      const basic=scene.combatProfile==='spellcraft'&&side===scene.dominantHand,
        remaining=basic?Math.max(0,scene.attackCooldown||0):cooldown;
      out[side]={...hand,form,style:p.style,color:p.color,accent:p.accent,recovering:remaining>0,
        recovery:basic?Math.min(1,remaining/(scene.attackInterval||1)):Math.min(1,remaining/(scene.power?.cooldown||1)),
        attack:this.action?.hand===side?1-this.action.life/this.action.total:0,
        attacking:this.action?.hand===side,miss:this.result&&this.result.type!=='hit'};
    }
    return out;
  }
  drainEvents(){const out=this.events;this.events=[];return out;}
}
