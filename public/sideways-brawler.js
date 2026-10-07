import {hasSideImprint,sideBuff} from './sideways-build.js?v=0.17.0';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function sideParticles(s,x,y,color='#ead5a3',count=8,power=150){
 for(let i=0;i<count;i++){const angle=(i+.5)*2.399+(s.eventSerial%7),speed=power*(.45+(i%4)*.17);s.particles.push({x,y,vx:Math.cos(angle)*speed,vy:-Math.abs(Math.sin(angle)*speed)-50,color,life:.35+(i%3)*.12,maxLife:.7,size:i%4===0?4:2});}
 s.particles=s.particles.slice(-120);
}
export function tickSideParticles(s,dt){for(const p of s.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=680*dt;}s.particles=s.particles.filter(p=>p.life>0);s.shake=Math.max(0,s.shake-dt);s.comboClock=Math.max(0,s.comboClock-dt);if(s.comboClock===0)s.combo=0;}
export function physicalCoins(s,receipt,x,y,total){
 if(s.practice||s.lootLedger.includes(receipt))return;s.lootLedger.push(receipt);const values=[];while(total>=5){values.push(5);total-=5;}while(total>0){values.push(1);total--;}
 const used=new Set(s.coins.map(c=>c.id));for(let i=0;i<values.length;i++){const id=receipt+':'+i;if(used.has(id))continue;const fan=(i-(values.length-1)/2)*.6;s.coins.push({id,value:values[i],x,y:y-34,vx:Math.sin(fan)*160+(i%2?35:-35),vy:-250-(i%3)*65,age:0,bounces:0});}
 if(s.coins.length>40){const value=s.coins.reduce((n,c)=>n+c.value,0);s.coins.splice(0,s.coins.length,{id:'coin-cache:'+s.room+':'+s.life+':'+s.lootLedger.length,value,x,y:y-30,vx:0,vy:-180,age:0,bounces:0});}
}
export function tickSideCoins(s,r,dt,emit){
 const p=s.player,magnet=125+(s.build.relic?65:0)+(sideBuff(s,'magnet')?80:0);
 for(const c of s.coins){c.age+=dt;const dx=p.x-c.x,dy=p.y-30-c.y,d=Math.hypot(dx,dy);if(c.age>.45&&d<magnet){const speed=350+Math.max(0,magnet-d)*2;c.vx=dx/Math.max(1,d)*speed;c.vy=dy/Math.max(1,d)*speed;}else c.vy+=900*dt;c.x=clamp(c.x+c.vx*dt,30,r.width-30);c.y+=c.vy*dt;
  if(c.y>r.floor-5){c.y=r.floor-5;c.vy=c.bounces<3?-Math.abs(c.vy)*.38:0;c.vx*=.58;c.bounces++;}
  if(c.age>.24&&d<37){s.wallet+=c.value;s.collected+=c.value;c.collected=true;sideParticles(s,p.x,p.y-30,'#f2cf76',3,55);emit(s,'coin','',p.x,p.y-35,c.value);}
 }
 const kept=s.coins.filter(c=>!c.collected);s.coins.splice(0,s.coins.length,...kept);
}
export function authoredProps(s,r){if(r.safe||r.boss)return [];return [{id:s.room+'-cask',kind:r.world==='verdant'?'root-cask':'crystal-cask',x:925,y:r.floor,hp:28,weight:1,vx:0,vy:0},{id:s.room+'-stone',kind:'fault-stone',x:1350,y:r.floor,hp:55,weight:3,vx:0,vy:0}];}
export function hitSideEnemy(s,e,damage,impact,emit){
 if(e.hp<=0)return false;const p=s.player,type=impact?.type??'light',direction=impact?.direction??p.facing,strong=['heavy','launcher','dive','throw','prop','power'].includes(type);
 if(e.captain&&(e.shell??24)>0){if(strong){e.shell=0;emit(s,'break','Collector armor breaks · the heavy strike finds a seam.',e.x,e.y-60);}else{e.shell=(e.shell??24)-damage*.5;damage=Math.round(damage*.8);}}
 const actual=Math.min(e.hp,damage);e.hp=Math.max(0,e.hp-damage);s.damage+=actual;e.flash=.16;s.combo++;s.comboClock=1.8;s.bestCombo=Math.max(s.bestCombo,s.combo);s.hitstop=Math.max(s.hitstop??0,strong?4/60:2/60);sideParticles(s,e.x,e.y-50,'#f5deaa',strong?11:5,strong?230:110);emit(s,'hit','',e.x,e.y-45,actual);
 if(strong){s.shake=Math.max(s.shake,.13);emit(s,'thump');}
 if(!e.boss&&e.state!=='grabbed'){
  e.vx=direction*(type==='throw'?660:type==='prop'?490:strong?310:110);e.stagger=strong?.45:.19;e.clock=Math.max(.4,e.clock);e.windup=0;
  if(type==='launcher'||type==='throw'||type==='dive'||s.form==='rock'&&hasSideImprint(s)&&type==='heavy'){e.state=type==='throw'?'thrown':'launched';e.vy=type==='throw'?-330:-490;e.bounce=true;e.wallBounced=false;e.throwHits=[];}
  else {e.state=strong?'down':'stagger';e.vy=strong?-120:0;}
 }else if(e.boss){e.vx=direction*(strong?45:12);}
 if(e.hp===0){e.death=.8;e.state='dead';e.vx=direction*(strong?280:180);e.vy=-200;physicalCoins(s,'enemy:'+e.id,e.x,e.y,e.boss?24:e.captain?12:e.kind==='archon'?5:3);emit(s,e.boss?'boss-down':'enemy-down',e.boss?'DEFEATED · '+e.displayName:'',e.x,e.y);}
 return true;
}
export function tickSideReaction(s,e,r,dt,emit,hit){
 e.flash=Math.max(0,(e.flash??0)-dt);e.root=Math.max(0,(e.root??0)-dt);
 if(e.death>0)e.death=Math.max(0,e.death-dt);
 if(e.state==='grabbed'){const p=s.player;e.x=p.x+p.facing*47;e.y=p.y-18;e.lane=p.lane??0;return true;}
 if(e.boss)return false;
 if(!['stagger','down','launched','thrown','dead'].includes(e.state))return false;
 e.stagger=Math.max(0,(e.stagger??0)-dt);e.vy=(e.vy??0)+1250*dt;e.x+=e.vx*dt;e.y+=e.vy*dt;
 if(e.x<90||e.x>r.width-90){e.x=clamp(e.x,90,r.width-90);if(!e.wallBounced&&['thrown','launched'].includes(e.state)){e.vx*=-.6;e.vy=-260;e.wallBounced=true;sideParticles(s,e.x,e.y-25,'#dbc8aa',9,170);emit(s,'bounce');}else e.vx=0;}
 if(e.state==='thrown'){for(const other of s.enemies)if(other!==e&&other.hp>0&&!e.throwHits?.includes(other.id)&&Math.abs(other.x-e.x)<(s.form==='rock'?100:70)&&Math.abs(other.y-e.y)<100&&Math.abs((other.lane??0)-(e.lane??0))<42){e.throwHits??=[];e.throwHits.push(other.id);hit(s,other,30+(s.form==='rock'?12:0),{type:'heavy',direction:Math.sign(e.vx)||s.player.facing});}}
 if(e.y>=r.floor){e.y=r.floor;if(e.bounce&&e.vy>180){e.bounce=false;e.vy=-220;e.stagger=.4;sideParticles(s,e.x,e.y,'#d2c6a4',10,170);emit(s,'bounce');}else{e.vy=0;e.vx*=Math.pow(.02,dt);if(e.stagger===0&&e.hp>0){e.state='ready';e.vx=0;}}}
 return true;
}
export function sideGrab(s,r,emit,hit){
 const p=s.player;
 if(p.carry){const prop=s.props.find(v=>v.id===p.carry);p.carry=null;if(prop){prop.carried=false;prop.thrown=true;prop.vx=p.facing*(s.form==='rock'?750:550);prop.vy=-330;prop.hits=[];prop.lane=p.lane??0;emit(s,'throw','Object thrown.');}return true;}
 if(p.grab){const e=s.enemies.find(v=>v.id===p.grab);p.grab=null;if(e&&e.hp>0){hit(s,e,s.form==='rock'?28:18,{type:'throw',direction:p.facing});if(e.hp>0){e.state='thrown';e.vx=p.facing*(s.form==='rock'?760:660);e.vy=-330;e.bounce=true;e.throwHits=[];e.wallBounced=false;}emit(s,'throw','The construct returns to the floor.');}return true;}
 if(['spark','computer'].includes(s.form)){emit(s,'hint','This vessel controls the current. Borrow Human, Tree, Animal, or Rock to grab.');return false;}
 const e=s.enemies.find(v=>v.hp>0&&!v.boss&&Math.abs(v.x-p.x)<(s.form==='tree'?125:90)&&Math.abs(v.y-p.y)<95&&Math.abs((v.lane??0)-(p.lane??0))<42&&(v.stagger>0||v.root>0||v.state==='down'||v.state==='launched'));
 if(e){p.grab=e.id;p.grabClock=2.4;e.state='grabbed';e.windup=0;emit(s,'grab','Held · Strike to hit · Grab again to throw.');return true;}
 const prop=s.props.find(v=>v.hp>0&&!v.thrown&&!v.carried&&Math.abs(v.x-p.x)<90&&Math.abs(v.y-p.y)<70);
 if(prop){if(prop.weight>1&&s.form!=='rock'){emit(s,'hint','Rock can lift this fault stone.');return false;}p.carry=prop.id;prop.carried=true;emit(s,'grab',prop.weight>1?'Fault stone lifted · Grab again to throw.':'Cask lifted · Grab again to throw.');return true;}
 emit(s,'hint','Stagger or root a nearby construct, then Grab. Casks can be lifted; fault stones need Rock.');return false;
}
export function hitSideProp(s,prop,damage,emit){if(prop.hp<=0)return;prop.hp=Math.max(0,prop.hp-damage);sideParticles(s,prop.x,prop.y-23,prop.weight>1?'#b7acd6':'#95d0c9',8,170);if(prop.hp===0){physicalCoins(s,'prop:'+prop.id,prop.x,prop.y,prop.weight>1?3:2);if(s.player.carry===prop.id)s.player.carry=null;emit(s,'break','',prop.x,prop.y-20);}}
export function tickSideProps(s,r,dt,emit,hit){for(const prop of s.props){if(prop.hp<=0)continue;if(prop.carried){prop.x=s.player.x+s.player.facing*12;prop.y=s.player.y-125;continue;}if(!prop.thrown)continue;prop.vy+=1200*dt;prop.x+=prop.vx*dt;prop.y+=prop.vy*dt;for(const e of s.enemies)if(e.hp>0&&!prop.hits.includes(e.id)&&Math.abs(e.x-prop.x)<(prop.weight>1?95:65)&&Math.abs(e.y-prop.y)<120&&Math.abs((e.lane??0)-(prop.lane??0))<42){prop.hits.push(e.id);hit(s,e,prop.weight>1?65:38,{type:'prop',direction:Math.sign(prop.vx)});}
 if(prop.y>=r.floor||prop.x<45||prop.x>r.width-45){prop.y=r.floor;hitSideProp(s,prop,999,emit);}}
}
