import assert from 'node:assert/strict';
import {SIDE_ROOMS,stepSide,sideGeometry,morphSide} from '../public/sideways-engine.js';

export function frames(s,input,count=1){for(let i=0;i<count&&s.phase==='playing';i++)stepSide(s,input);}
export function walkTo(s,x,{attack=true,max=2400}={}){
 for(let i=0;i<max;i++){
  assert.equal(s.phase,'playing','fell in '+s.room+' at '+s.player.x+' · '+s.notice);const p=s.player;
  if(Math.abs(p.x-x)<7&&p.grounded)return;
  const pit=sideGeometry(s.room).pits.find(v=>p.x>v.x-95&&p.x<v.x+v.w+25);
  const direction=Math.abs(x-p.x)<6?0:Math.sign(x-p.x);
  const jump=!!pit||p.y>SIDE_ROOMS[s.room].floor+15;
  frames(s,{x:direction,attack,jump});
 }
 throw Error('walk timeout '+s.room+' → '+x+' from '+s.player.x+','+s.player.y);
}
export function climbCistern(s){
 const ledges=sideGeometry('cistern').platforms.filter(p=>p.oneWay).slice(0,4);
 for(const ledge of ledges){const p=s.player;const old=sideGeometry('cistern').platforms.find(v=>Math.abs(v.y-p.y)<2&&p.x>v.x&&p.x<v.x+v.w);const launch=old?.oneWay?Math.min(old.x+old.w-26,ledge.x-65):ledge.x-80;walkTo(s,launch);frames(s,{});let landed=false;
  for(let i=0;i<150;i++){const x=ledge.x+50,dx=Math.sign(x-s.player.x),close=Math.abs(x-s.player.x)<4;frames(s,{x:close?0:dx,jump:i<36,attack:true});if(s.player.grounded&&Math.abs(s.player.y-ledge.y)<2){landed=true;break;}}
  assert.ok(landed,'cannot reach Cistern ledge '+ledge.y+' as '+s.form+'; at '+s.player.x+','+s.player.y);
 }
}
export function climbFeather(s){
 assert.equal(s.room,'reliquary');morphSide(s,'animal');
 const ledges=sideGeometry(s.room).platforms.filter(p=>p.oneWay);
 for(let index=0;index<ledges.length;index++){
  const ledge=ledges[index],p=s.player,old=sideGeometry(s.room).platforms.find(v=>Math.abs(v.y-p.y)<2&&p.x>v.x&&p.x<v.x+v.w),reverse=index===4;
  const launch=old?.oneWay?(reverse?old.x+25:Math.min(old.x+old.w-26,ledge.x-65)):ledge.x-80;walkTo(s,launch);frames(s,{});let landed=false;
  for(let i=0;i<200;i++){const x=reverse?1110:ledge.x+60,dx=Math.sign(x-s.player.x),close=Math.abs(x-s.player.x)<4;frames(s,{x:close?0:dx,jump:reverse?(i<22||i>=23&&i<60):i<36});if(s.player.grounded&&Math.abs(s.player.y-ledge.y)<2){landed=true;break;}}
  assert.ok(landed,'cannot reach Feather ledge '+ledge.y+' from '+s.player.x+','+s.player.y);
 }
 assert.ok(s.secrets.includes('feather'),'Animal’s second jump should collect the high feather');
}
export function cross(s,to){
 const door=sideGeometry(s.room).doors.find(d=>d.to===to);assert.ok(door,s.room+' has no door to '+to);
 if(door.form&&s.form!==door.form)morphSide(s,door.form);
 if(door.y<SIDE_ROOMS[s.room].floor){if(s.room==='cistern')climbCistern(s);else if(door.secret){walkTo(s,door.x-80);frames(s,{});for(let i=0;i<100;i++){const dx=door.x-s.player.x;frames(s,{x:Math.abs(dx)<4?0:Math.sign(dx),jump:i<36});if(s.player.grounded&&Math.abs(s.player.y-door.y)<2)break;}}}
 walkTo(s,door.x);frames(s,{},45);frames(s,{interact:true});assert.equal(s.room,to,s.notice);frames(s,{});
}
export function clearRoom(s){
 if(s.cleared.includes(s.room))return;
 if(s.forms.includes('spark')&&s.form!=='spark')morphSide(s,'spark');let jumpStart=-1000;
 for(let i=0;i<12000;i++){
  if(s.cleared.includes(s.room))return;assert.equal(s.phase,'playing','combat fell in '+s.room+' · HP '+s.player.hp);
  const e=s.enemies.filter(e=>e.hp>0).toSorted((a,b)=>Math.abs(a.x-s.player.x)-Math.abs(b.x-s.player.x))[0];if(!e){frames(s,{});continue;}
  const p=s.player,dx=e.x-p.x,desired=Math.abs(dx)>480?Math.sign(dx):Math.abs(dx)<240?-Math.sign(dx):0;
  if(desired===0&&p.facing!==Math.sign(dx)){frames(s,{x:Math.sign(dx),attack:true});continue;}
  const drop=p.grounded&&p.y<SIDE_ROOMS[s.room].floor-15&&e.y>p.y+65;
  const dangerous=s.marks.some(m=>!m.trigger&&m.life<.6&&Math.abs(m.x-p.x)<m.r+25)||s.bolts.some(b=>b.enemy&&Math.abs(b.x-p.x)<160&&b.y>p.y-50);
  if(dangerous&&p.grounded&&i-jumpStart>55)jumpStart=i;
  frames(s,{x:desired,attack:true,power:p.powerCooldown===0&&Math.abs(dx)<210,down:drop||e.y>p.y+75,up:e.y<p.y-90,jump:drop||i-jumpStart<34});
 }
 throw Error('combat timeout '+s.room+' at '+s.player.x+','+s.player.y+' enemies '+JSON.stringify(s.enemies.filter(e=>e.hp>0)));
}
