import {SIDE_PATH_BY_ROOM,SIDE_CACHE_ROOMS,sidePathObjective,hasSidePath} from './sideways-paths.js?v=0.17.0';
import {SIDE_SETS} from './sideways-build.js?v=0.17.0';

// These bounded layers reuse the existing stages and vessel colors. They sit
// behind the walkable plane; trial markers share the engine's contact radius.
export function sidePathBackdrop(ctx,r,time,cx,cy,reduced){
 const trial=Object.values(SIDE_PATH_BY_ROOM).find(p=>r.layout.includes(p.form==='spark'?'drift':p.form==='computer'?'prism':p.form==='tree'?'root':p.form==='rock'?'fault':p.form==='animal'?'feral':'rally'));
 if(!r.layout.endsWith('-path')&&!r.layout.endsWith('-cache'))return;
 const t=reduced?0:time,color=trial?.color??'#dcca96';ctx.save();ctx.translate(640-cx*.24,260-cy*.14);ctx.strokeStyle=color;ctx.lineWidth=2;ctx.globalAlpha=.22;
 if(r.layout==='drift-path'){
  for(let i=0;i<9;i++){const x=(i-4)*105;ctx.beginPath();ctx.moveTo(x,-260);ctx.bezierCurveTo(x-35,-95,x+35,10,x,75+Math.sin(t*.8+i)*12);ctx.stroke();ctx.beginPath();ctx.moveTo(x,55);ctx.lineTo(x+10,75);ctx.lineTo(x,95);ctx.lineTo(x-10,75);ctx.closePath();ctx.stroke();}
 }else if(r.layout==='prism-path'){
  for(let i=0;i<5;i++){ctx.save();ctx.translate((i-2)*150,Math.sin(t*.55+i)*18);ctx.rotate((i-2)*.18);ctx.beginPath();ctx.moveTo(0,-100);ctx.lineTo(54,0);ctx.lineTo(0,100);ctx.lineTo(-54,0);ctx.closePath();ctx.stroke();ctx.beginPath();ctx.moveTo(0,-100);ctx.lineTo(0,100);ctx.moveTo(-54,0);ctx.lineTo(54,0);ctx.stroke();ctx.restore();}
 }else if(r.layout==='root-path'||r.layout==='bell-cache'){
  for(let i=0;i<7;i++){const x=(i-3)*125;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,280);ctx.bezierCurveTo(x-50,120,x+60,-90,x,-280);ctx.stroke();for(let j=0;j<3;j++){ctx.beginPath();ctx.moveTo(x,80-j*90);ctx.quadraticCurveTo(x+55,30-j*90,x+76,70-j*90);ctx.stroke();}}
  if(r.layout==='bell-cache'){ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-75,-35);ctx.quadraticCurveTo(-55,-130,0,-130);ctx.quadraticCurveTo(55,-130,75,-35);ctx.lineTo(94,10);ctx.lineTo(-94,10);ctx.closePath();ctx.stroke();ctx.beginPath();ctx.arc(0,14,17,0,Math.PI);ctx.stroke();}
 }else if(r.layout==='fault-path'||r.layout==='clock-cache'){
  ctx.beginPath();ctx.arc(0,-15,155,0,Math.PI*2);ctx.stroke();for(let i=0;i<12;i++){const a=i*Math.PI/6;ctx.beginPath();ctx.moveTo(Math.cos(a)*133,-15+Math.sin(a)*133);ctx.lineTo(Math.cos(a)*149,-15+Math.sin(a)*149);ctx.stroke();}const a=t*.035;ctx.beginPath();ctx.moveTo(0,-15);ctx.lineTo(Math.sin(a)*95,-15-Math.cos(a)*95);ctx.moveTo(0,-15);ctx.lineTo(Math.cos(a*.4)*62,-15+Math.sin(a*.4)*62);ctx.stroke();
  for(let i=0;i<4;i++){const x=(i-1.5)*220;ctx.beginPath();ctx.moveTo(x,270);ctx.lineTo(x+30,185);ctx.lineTo(x-8,125);ctx.lineTo(x+40,65);ctx.stroke();}
 }else if(r.layout==='feral-path'||r.layout==='score-cache'){
  for(let i=0;i<5;i++){ctx.save();ctx.translate((i-2)*170,Math.sin(t*.5+i)*12);ctx.rotate((i-2)*.12);ctx.strokeRect(-43,-120,86,210);ctx.beginPath();ctx.moveTo(-33,65);ctx.lineTo(33,-95);ctx.stroke();ctx.restore();}if(r.layout==='score-cache'){ctx.globalAlpha=.35;for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(-210,-20+i*15);ctx.lineTo(210,-20+i*15);ctx.stroke();}ctx.beginPath();ctx.arc(0,7,11,0,Math.PI*2);ctx.stroke();}
 }else if(r.layout==='sleep-cache'){
  ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-90,280);ctx.lineTo(-90,-85);ctx.quadraticCurveTo(0,-220,90,-85);ctx.lineTo(90,280);ctx.stroke();for(let i=-2;i<=2;i++){ctx.beginPath();ctx.ellipse(i*115,-30+i*22,18,75,i*.14,0,Math.PI*2);ctx.stroke();}
 }else if(r.layout==='thread-cache'){
  for(let i=-4;i<=4;i++){ctx.beginPath();ctx.moveTo(i*97,-300);ctx.bezierCurveTo(i*48+Math.sin(t*.3+i)*28,-85,i*28,100,i*16,280);ctx.stroke();}ctx.beginPath();ctx.arc(0,-15,75,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(-75,-15);ctx.lineTo(75,-15);ctx.stroke();
 }else if(r.layout==='window-cache'){
  ctx.lineWidth=5;ctx.strokeRect(-150,-230,300,360);ctx.lineWidth=1;ctx.strokeRect(-130,-210,260,320);ctx.beginPath();ctx.moveTo(0,-210);ctx.lineTo(0,110);ctx.moveTo(-130,-55);ctx.lineTo(130,-55);ctx.stroke();ctx.globalAlpha=.65;ctx.beginPath();ctx.arc(63,-142,7,0,Math.PI*2);ctx.stroke();for(let i=0;i<12;i++){ctx.fillStyle=color;ctx.fillRect(-112+(i*43)%230,-194+(i*73)%274,2,2);}
 }else if(r.layout==='rally-path'){
  ctx.beginPath();ctx.ellipse(0,-20,230,92,-.25,0,Math.PI*2);ctx.stroke();for(let i=0;i<7;i++){const a=i*Math.PI*2/7+t*.07,x=Math.cos(a)*220,y=-20+Math.sin(a)*85;ctx.beginPath();ctx.arc(x,y,5+i%3*3,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x-40,y+60,x-10,200);ctx.stroke();}
 }
 ctx.restore();
}

export function drawSidePath(ctx,s,time,reduced,platforms=[]){
 const trial=SIDE_PATH_BY_ROOM[s.room],cache=SIDE_CACHE_ROOMS[s.room],mark=trial??cache;if(!mark)return;
 const objective=sidePathObjective(s),owned=trial?hasSidePath(s,trial.form):s.secrets.includes(cache.secret),near=Math.hypot(s.player.x-mark.x,s.player.y-mark.y)<180,color=trial?.color??SIDE_SETS[cache.set].color,pulse=reduced?0:Math.sin(time*3)*3;
 ctx.save();ctx.translate(mark.x,mark.y);ctx.strokeStyle=color+(owned?'70':'d5');ctx.fillStyle=color+'16';ctx.lineWidth=near&&!owned?3:1.5;
 ctx.beginPath();ctx.ellipse(0,0,95+(near?pulse:0),17,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.beginPath();ctx.ellipse(0,0,64,11,0,0,Math.PI*2);ctx.stroke();
 ctx.globalAlpha=owned?.45:1;ctx.translate(0,-144);ctx.beginPath();
 if(mark.form==='spark'){ctx.moveTo(0,-33);ctx.bezierCurveTo(40,-10,25,30,0,24);ctx.bezierCurveTo(-32,10,-20,-10,0,-33);}
 else if(mark.form==='computer'){ctx.moveTo(0,-31);ctx.lineTo(29,0);ctx.lineTo(0,31);ctx.lineTo(-29,0);ctx.closePath();}
 else if(mark.form==='animal'){ctx.moveTo(-32,19);ctx.lineTo(-25,-23);ctx.lineTo(-6,-9);ctx.lineTo(13,-29);ctx.lineTo(34,2);ctx.lineTo(14,20);ctx.closePath();}
 else if(mark.form==='tree'){ctx.moveTo(0,30);ctx.lineTo(0,-31);ctx.moveTo(-28,-3);ctx.lineTo(0,10);ctx.lineTo(29,-10);ctx.moveTo(-20,-24);ctx.lineTo(0,-10);ctx.lineTo(19,-30);}
 else if(mark.form==='rock'){ctx.moveTo(-28,22);ctx.lineTo(-31,-13);ctx.lineTo(-6,-30);ctx.lineTo(25,-15);ctx.lineTo(32,18);ctx.closePath();ctx.moveTo(0,-28);ctx.lineTo(-6,0);ctx.lineTo(10,9);ctx.lineTo(2,22);}
 else{ctx.arc(0,-20,9,0,Math.PI*2);ctx.moveTo(0,-10);ctx.lineTo(0,21);ctx.moveTo(-24,0);ctx.lineTo(0,9);ctx.lineTo(24,0);ctx.moveTo(0,21);ctx.lineTo(-18,33);ctx.moveTo(0,21);ctx.lineTo(18,33);}
 ctx.stroke();ctx.globalAlpha=1;let label=-208;for(const p of platforms)if(mark.x+105>p.x&&mark.x-105<p.x+p.w&&mark.y+label-12<p.y+p.h+4&&mark.y+label+17>p.y-8)label=p.y-mark.y-39;ctx.textAlign='center';ctx.font='11px Georgia';ctx.fillStyle=color;ctx.fillText(trial?trial.name:SIDE_SETS[cache.set].name,0,label+144,205);ctx.font='9px sans-serif';ctx.fillStyle=owned?'#9eafa2':'#e5dcc2';ctx.fillText(owned?'REMEMBERED':(objective?.ready?'POWER · ':'? · ')+mark.form.toUpperCase(),0,label+161,205);ctx.restore();
}
