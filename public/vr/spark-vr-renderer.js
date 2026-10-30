// Original low-poly WebGL renderer for all canonical Spark solo Descent rooms.
// Geometry is derived from canonical ROOMS, obstacles and entity positions.
import {WIDTH,HEIGHT} from '../action-engine.js?v=0.17.0';
import {worldAt} from './spark-vr-model.js';
import {multiply4,transform4} from './spark-vr-math.js';
import {hex,tint,pushBox,pushGem,pushRing,pushBeam} from './spark-vr-geometry.js';
import {livingRoomGeometry,livingDynamicGeometry,clearRoomGeometryCache} from './spark-room-themes.js';
import {guardianGeometry} from './spark-guardian-presentation.js';
import {moreBounceGeometry} from './spark-more-bounce.js';
import {livingEnemyFigure} from './spark-world-art.js';
import {trackedGauntletVertices} from './spark-xr-hands.js';
import {calibrationRoomGeometry} from './spark-xr-panel.js';
import {duelWorldPoint} from './spark-xr-adapters.js';

const VERT= `attribute vec3 position;
attribute vec3 color;
uniform mat4 vp;
varying vec3 vColor;
varying float vDepth;
void main(){vColor=color;gl_Position=vp*vec4(position,1.0);vDepth=gl_Position.w;}`;
const FRAG= `precision mediump float;
varying vec3 vColor;
varying float vDepth;
uniform float fogAmount;
void main(){float fog=clamp((vDepth-3.)/18.,0.,.65)*fogAmount;gl_FragColor=vec4(mix(vColor,vec3(.012,.025,.04),fog),1.0);}`;
const HUD_VERT=`attribute vec3 position;
attribute vec2 uv;
uniform mat4 vp;
varying vec2 vUv;
void main(){vUv=uv;gl_Position=vp*vec4(position,1.0);}`;
const HUD_FRAG=`precision mediump float;
uniform sampler2D atlas;
varying vec2 vUv;
void main(){gl_FragColor=texture2D(atlas,vUv);}`;
// Static viewport-relative peripheral dimming, only when the user opts in.
// This draw does not touch head pose, gameplay collision, or original Spark.
const COMFORT_VERT=`attribute vec2 position;
varying vec2 vPosition;
void main(){vPosition=position;gl_Position=vec4(position,0.,1.);}`;
const COMFORT_FRAG=`precision mediump float;
varying vec2 vPosition;
uniform float amount;
void main(){float falloff=smoothstep(0.45,1.12,length(vPosition));
gl_FragColor=vec4(0.005,0.012,0.021,falloff*amount);}`;


function compile(gl,vertex,fragment){
  const shaders=[];
  let program=null;
  try{
    for(const [type,source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]){
      const shader=gl.createShader(type);
      shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);
      if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))
        throw Error('Spark VR shader: '+(gl.getShaderInfoLog(shader)||'compile failed'));
    }
    program=gl.createProgram();
    for(const sh of shaders)gl.attachShader(program,sh);
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))
      throw Error('Spark VR program: '+(gl.getProgramInfoLog(program)||'link failed'));
    return program;
  }catch(error){if(program)gl.deleteProgram(program);throw error;}
  finally{shaders.forEach(sh=>gl.deleteShader(sh));}
}

function pushStage(vertices,scene){
  const c=hex(scene.roomTheme),accent=tint(c,1.6),stone=[.12,.15,.22],
    wall=[.10,.12,.20],dark=[.02,.045,.075];
  // A coherent, walkable stage uses the canonical 960x600 Descent footprint.
  pushBox(vertices,0,-.1,0,WIDTH/100,.20,HEIGHT/100,tint(c,.18));
  for(let x=-4.5;x<4.7;x+=.5)pushBox(vertices,x,.005,0,.012,.012,5.88,tint(accent,.24));
  for(let z=-2.5;z<2.8;z+=.5)pushBox(vertices,0,.006,z,9.52,.013,.012,tint(accent,.24));
  const sides=new Set(scene.gates.map(g=>g.direction));
  const wallH=2.7;
  for(const dir of ['north','south']){
    const z=dir==='north'?-3:3;
    if(sides.has(dir)){
      pushBox(vertices,-2.825,wallH/2,z,3.95,wallH,.18,wall);
      pushBox(vertices,2.825,wallH/2,z,3.95,wallH,.18,wall);
    }else pushBox(vertices,0,wallH/2,z,9.6,wallH,.18,wall);
  }
  for(const dir of ['east','west']){
    const x=dir==='east'?4.8:-4.8;
    if(sides.has(dir)){
      pushBox(vertices,x,wallH/2,-1.9,.18,wallH,2.2,wall);
      pushBox(vertices,x,wallH/2,1.9,.18,wallH,2.2,wall);
    }else pushBox(vertices,x,wallH/2,0,.18,wallH,6,wall);
  }
  // Space for the doorway stays open. The Spark engine, not this visual,
  // remains the only authority for whether a gate can be crossed.
  for(const gate of scene.gates){
    const open=gate.available&&gate.vrSupported;
    const col=open?[.2,.94,.80]:gate.vrSupported?[.95,.48,.20]:[.45,.32,.49];
    let x=0,z=0,alongX=true;
    if(gate.direction==='north')z=-2.90;
    if(gate.direction==='south')z=2.90;
    if(gate.direction==='west'){x=-4.70;alongX=false;}
    if(gate.direction==='east'){x=4.70;alongX=false;}
    if(alongX){
      pushBox(vertices,x-.82,1.05,z,.13,2.1,.24,col);
      pushBox(vertices,x+.82,1.05,z,.13,2.1,.24,col);
      pushBox(vertices,x,2.12,z,1.8,.13,.24,col);
    }else{
      pushBox(vertices,x,1.05,z-.82,.24,2.1,.13,col);
      pushBox(vertices,x,1.05,z+.82,.24,2.1,.13,col);
      pushBox(vertices,x,2.12,z,.24,.13,1.8,col);
    }
    if(!open){
      for(const h of [.28,.58,.88,1.18,1.48,1.78])
        pushBox(vertices,x,h,z,alongX?1.1:.045,.025,alongX?.045:1.1,tint(col,.48));
    }
  }
  for(const o of scene.obstacles){
    const [x,,z]=worldAt(o.x+o.w/2,o.y+o.h/2);
    pushBox(vertices,x,.58,z,o.w/100,1.16,o.h/100,stone);
    pushBox(vertices,x,1.18,z,o.w/100+.05,.06,o.h/100+.05,accent);
  }
  // Distinct, bounded seven-world low-poly motifs; obstacles remain canonical,
  // and decorative world monuments never change navigation or combat physics.
  const rank=Number.isInteger(scene.worldRank)?scene.worldRank:0;
  const tones=[
    ['#d1b878','#86c7c0'],['#76cadd','#5c9dca'],['#7cc993','#a3d981'],
    ['#ea9d64','#d7bb72'],['#b5a1e7','#7c90cc'],['#c6d9ec','#77bace'],
    ['#f2d18c','#88c6ba']
  ];
  const [primary,secondary]=tones[Math.max(0,Math.min(6,rank))];
  const pColor=hex(primary),sColor=hex(secondary);
  for(let i=0;i<7;i++){
    const z=-2.42+i*.8,x=i%2?4.28:-4.28;
    if(rank===1){
      // Tideglass: bright drowned conduits and ceremonial tide obelisks.
      pushBox(vertices,x,.11,z,.55,.20,.42,tint(sColor,.7));
      pushBox(vertices,x,.72,z,.17,1.23,.17,tint(pColor,.9));
      pushBox(vertices,x,1.41,z,.4,.16,.4,sColor);
    }else if(rank===2){
      // Verdant: clustered root pillars, with a crown of leaf-colored light.
      pushBox(vertices,x,.9,z,.24,1.8,.26,tint(pColor,.44));
      pushBox(vertices,x,1.94,z,.7,.50,.7,tint(sColor,.8));
    }else if(rank===3){
      // Cinder: molten works, vertical shafts and alternating hot segments.
      pushBox(vertices,x,.92,z,.4,1.85,.42,tint(pColor,.48));
      pushBox(vertices,x,1.6,z,.52,.18,.52,pColor);
      pushBox(vertices,x,.72,z,.55,.10,.54,sColor);
    }else if(rank===4){
      // Prism: violet split monoliths in an asymmetric dream cadence.
      pushBox(vertices,x,1.02,z,.29,1.9,.32,tint(pColor,.71));
      pushBox(vertices,x+.18,1.96,z,.28,.23,.28,sColor);
    }else if(rank===5){
      // Pale Orbit: star relays along a geometric path to the final realm.
      pushBox(vertices,x,.85,z,.25,1.7,.25,tint(sColor,.55));
      pushBox(vertices,x,1.77,z,.56,.12,.56,tint(pColor,.95));
    }else if(rank===6){
      // Uncreated: paired elemental monoliths below the final heart.
      pushBox(vertices,x,.81,z,.35,1.6,.35,tint(pColor,.55));
      pushBox(vertices,x,1.67,z,.54,.27,.54,tint(sColor,.98));
    }else{
      pushBox(vertices,x,.55,z,.22,1.1,.22,tint(pColor,.5));
      pushBox(vertices,x,1.15,z,.29,.14,.29,tint(sColor,.9));
    }
  }
  if(scene.safe){
    pushBox(vertices,0,.26,0,1.8,.50,1.6,tint(sColor,.45));
    pushBox(vertices,0,.55,0,.85,.10,.85,tint(pColor,.9));
  }
  if(scene.boss){
    // Decorative ceremonial chamber centerpiece; cosmetic only.
    pushBox(vertices,0,.09,0,1.8,.18,1.8,tint(pColor,.62));
    pushBox(vertices,0,.05,0,2.35,.05,.12,tint(sColor,.82));
    pushBox(vertices,0,.05,0,.12,.05,2.35,tint(sColor,.82));
  }
  // Seven-world motifs reference actual Spark vessel colors without reusing
  // or flattening the original 2D sprite atlas.
  const motifs=['#f7cb79','#e5b78b','#86d8e5','#ddcc93','#a5cfad','#c6bcda'];
  for(let i=0;i<6;i++){
    const x=-3.65+i*1.46,z=scene.roomId==='glass'?2.42:scene.safe?2.3:1.9;
    pushBox(vertices,x,.77,z,.2,1.54,.2,dark);
    pushBox(vertices,x,1.5,z,.3,.16,.3,tint(hex(motifs[i]),.95));
    pushBox(vertices,x,.47,z,.11,.78,.11,tint(hex(motifs[i]),.6));
  }
  if(scene.roomId==='threshold'){
    pushBox(vertices,0,.32,-.25,1.22,.64,1.22,tint(c,.42));
    pushBox(vertices,0,.72,-.25,.5,.15,.5,accent);
  }
}
function pushActors(vertices,s){
  for(const entity of s.enemies.slice(0,36)){
    if(s.living&&((s.roomId==='forge'&&entity.kind==='cantor')||(s.roomId==='eye'&&['warden','hound'].includes(entity.kind))))continue;
    if(s.living){livingEnemyFigure(vertices,entity,s);continue;}
    const [x,,z]=worldAt(entity.x,entity.y),radius=Math.min(.6,Math.max(.18,(entity.r||20)/100));
    const col=entity.hp>0?hex(entity.color,'#ef966d'):[.1,.1,.1];
    pushBox(vertices,x,.35+radius/2,z,radius*1.6,.7+radius,radius*1.6,col);
    pushBox(vertices,x,.96+radius/2,z,radius*.65,.2,radius*.65,tint(col,1.8));
  }
  for(const shot of s.shots.slice(0,s.living?240:80)){
    const [x,,z]=worldAt(shot.x,shot.y);
    const col=shot.enemy?[1,.28,.35]:s.living?hex(shot.color):[.31,.97,1];
    if(s.living){const y=shot.visualHeight??.82;pushGem(vertices,x,y,z,.045,.12,col);
      const length=Math.hypot(shot.vx||0,shot.vy||0);if(length)pushBeam(vertices,[x,y,z],[x-(shot.vx/length)*.18,y,z-(shot.vy/length)*.18],.018,tint(col,.65));
      pushGem(vertices,x,y,z,.019,.055,[.88,.97,.9]);}
    else pushBox(vertices,x,.65,z,.14,.14,.14,col);
  }
  for(const frag of s.fragments.slice(0,60)){
    const [x,,z]=worldAt(frag.x,frag.y);
    if(s.living)pushGem(vertices,x,.17,z,.04,.13,[1,.83,.37]);else pushBox(vertices,x,.28,z,.14,.55,.14,[.9,.77,.35]);
  }
  for(const mark of (s.dangerMarks??[]).slice(0,40)){
    const [x,,z]=worldAt(mark.x,mark.y);
    const size=Math.min(2.8,Math.max(.2,(mark.r??42)*2/100));
    const tintColor=hex(mark.color,'#fa9277');
    for(const d of [-1,1]){
      pushBox(vertices,x,.022,z+d*size/2,size,.03,.035,tintColor);
      pushBox(vertices,x+d*size/2,.022,z,.035,.03,size,tintColor);
    }
  }
  if(s.keyPickup){
    const [x,,z]=worldAt(s.keyPickup.x,s.keyPickup.y);
    pushBox(vertices,x,.42,z,.20,.80,.20,[1,.84,.31]);
    pushBox(vertices,x,.85,z,.45,.14,.45,[1,.91,.50]);
  }
  if(s.relicPickup){
    const [x,,z]=worldAt(s.relicPickup.x,s.relicPickup.y);
    pushBox(vertices,x,.35,z,.26,.68,.26,[.52,.94,.95]);
    pushBox(vertices,x,.76,z,.43,.10,.43,[.9,.96,1]);
  }
  if(s.living){const detail=s.quality==='performance'?6:s.quality==='high'?20:12;guardianGeometry(vertices,s,detail);moreBounceGeometry(vertices,s,detail);}
}
// Keep the paused wrist readable when the user looks overhead or brings the
// controller close. Follow the tracked wrist within a bounded head-relative
// region, facing the viewer and leaving the central combat sight line clear.
export function livingWristPose(head,leftGrip){
  const out=new Float32Array(head),tracked=leftGrip?.length===16&&[12,13,14].every(i=>Number.isFinite(leftGrip[i])),
    delta=tracked?[0,1,2].map(i=>leftGrip[12+i]-head[12+i]):null,
    dot=column=>delta?.reduce((sum,value,i)=>sum+value*head[column+i],0),
    bound=(value,min,max)=>Math.max(min,Math.min(max,value)),
    x=tracked?bound(dot(0)-.22,-.42,-.36):-.4,
    y=tracked?bound(dot(4)+.22,-.12,.1):-.06,
    depth=tracked?bound(-dot(8)+.6,1.25,1.4):1.3;
  for(let i=0;i<3;i++)out[12+i]=head[12+i]+head[i]*x+head[4+i]*y-head[8+i]*depth;
  return out;
}
export function makeSceneVertices(snapshot){
  const vertices=[];
  if(snapshot.living){for(const value of livingRoomGeometry(snapshot))vertices.push(value);pushActors(vertices,snapshot);livingDynamicGeometry(vertices,snapshot);}
  else if(snapshot.presentation==='arena')pushArena(vertices,snapshot);
  else{pushStage(vertices,snapshot);pushActors(vertices,snapshot);}
  return new Float32Array(vertices);
}

// Original vessel gauntlets: tracked palms, five fingers, wrist rings and charge seeds.
// Vertices live in XR reference space; no camera-relative fake hands or retained poses.
export const makeTrackedHandVertices=trackedGauntletVertices;

function pushArena(v,s){
  const dark=[.035,.075,.095],gold=[.86,.64,.29],mint=[.28,.71,.70];
  pushBox(v,0,-.11,0,5.6,.2,10,dark);
  for(let x=-2.5;x<=2.5;x+=.5)pushBox(v,x,.002,0,.009,.01,9.6,tint(mint,.3));
  for(let z=-4.5;z<=4.5;z+=.5)pushBox(v,0,.002,z,5.4,.01,.009,tint(mint,.3));
  for(const x of [-2.8,2.8]){
    pushBox(v,x,1.35,0,.18,2.7,10,dark);
    for(let z=-4.5;z<=4.5;z+=1.5){
      pushBox(v,x*.94,1.1,z,.18,2.2,.25,tint(mint,.5));
      pushBox(v,x*.94,2.25,z,.3,.12,.38,gold);
    }
  }
  for(const z of [-4.9,4.9])pushBox(v,0,1.35,z,5.6,2.7,.15,dark);
  // Finite central lane marks the small physical lean zone; no room-scale walking task.
  for(const x of [-.6,.6])pushBox(v,x,.015,0,.02,.025,8,tint(gold,.6));
  for(const e of s.enemies){
    const [x,y,z]=duelWorldPoint(e.x,e.y,e.z),col=hex(e.color);
    pushBox(v,x,y-.35,z,.36,.80,.31,tint(col,.55));
    pushBox(v,x,y+.17,z,.23,.30,.23,col);
    for(const a of [-1,1]){
      pushBox(v,x+a*.26,y-.24,z,.12,.60,.14,tint(col,.7));
      pushBox(v,x+a*.12,.43,z,.14,.80,.16,tint(col,.45));
    }
    pushBox(v,x,2.12,z,.85,.06,.035,[.17,.23,.25]);
    pushBox(v,x-(1-e.hp/e.maxHp)*.425,2.12,z,.85*Math.max(0,e.hp/e.maxHp),.065,.04,mint);
    if(s.windup){
      const size=.16+s.windup.progress*.35;
      pushBox(v,x,y,z+.29,size,size*.65,.08,[.98,.62,.22]);
      // A locked amber corridor is visible during the canonical 0.7 second startup.
      const a=s.windup.aim;
      if(a)for(let k=0;k<12;k++){
        const p=duelWorldPoint(a.x+a.vx*k*3,a.y+a.vy*k*3,a.z+a.vz*k*3);
        pushBox(v,p[0],.035,p[2],.035,.025,.12,gold);
      }
    }
  }
  for(const b of s.bolts){
    const [x,y,z]=duelWorldPoint(b.x,b.y,b.z),col=b.owner?[1,.35,.18]:[.45,.94,1];
    pushBox(v,x,y,z,.12,.12,.20,col);
    pushBox(v,x,y,z+(b.owner?-.14:.14),.05,.05,.18,tint(col,.65));
  }
  for(const e of s.effects){
    const [x,y,z]=duelWorldPoint(e.x,e.y,e.z),size=.12+(.3-e.life)*1.5;
    for(const side of [-1,1]){
      pushBox(v,x+side*size,y,z,.045,.32,.045,gold);
      pushBox(v,x,y+side*size,z,.32,.045,.045,mint);
    }
  }
}
export class SparkVRRenderer{
  constructor(canvas){
    this.canvas=canvas;
    const gl=canvas.getContext('webgl',{alpha:false,antialias:true,depth:true,xrCompatible:true});
    if(!gl)throw Error('A WebGL browser is required for the Spark VR preview.');
    this.gl=gl;
    this.program=compile(gl,VERT,FRAG);
    this.hudProgram=compile(gl,HUD_VERT,HUD_FRAG);
    this.comfortProgram=compile(gl,COMFORT_VERT,COMFORT_FRAG);
    this.vertices=gl.createBuffer();this.hudVertices=gl.createBuffer();this.handVertices=gl.createBuffer();this.stageVertices=gl.createBuffer();
    this.comfortVertices=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,this.comfortVertices);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([
      -1,-1,1,-1,1,1,-1,-1,1,1,-1,1
    ]),gl.STATIC_DRAW);
    this.hudCanvas=document.createElement('canvas');
    this.hudCanvas.width=512;this.hudCanvas.height=256;
    this.hudContext=this.hudCanvas.getContext('2d');
    this.hudTexture=gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D,this.hudTexture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    this.hudMesh=new Float32Array([
      -.86,.0,0,0,1, .86,.0,0,1,1, .86,.43,0,1,0,
      -.86,.0,0,0,1, .86,.43,0,1,0, -.86,.43,0,0,0
    ]);
    gl.bindBuffer(gl.ARRAY_BUFFER,this.hudVertices);
    gl.bufferData(gl.ARRAY_BUFFER,this.hudMesh,gl.STATIC_DRAW);
    this.lastHudStamp='';
    this.disposed=false;
  }
  updateHud(scene){
    if(scene.panel)return this.updateXRPanel(scene);
    if(scene.living)return this.updateLivingHud(scene);
    if(scene.presentation==='arena')return this.updateArenaHud(scene);
    const stamp=[scene.roomId,scene.roomName,scene.worldName,scene.form,
      Math.ceil(scene.health),scene.phase,scene.cleared,
      scene.notice.slice(0,80),scene.selectedChoice??0,scene.navigationOpen??false,
      scene.choices?.map(x=>x.id).join(','),
      scene.route?.map(x=>x.status+x.name+x.distance).join(',')].join('|');
    if(stamp===this.lastHudStamp)return;
    this.lastHudStamp=stamp;
    const c=this.hudContext,w=512,h=256;
    c.clearRect(0,0,w,h);
    c.fillStyle='rgba(7,15,28,.88)';c.fillRect(0,0,w,h);
    c.strokeStyle='#d1b873';c.lineWidth=3;c.strokeRect(4,4,w-8,h-8);
    c.font='bold 27px sans-serif';c.fillStyle='#f3da9c';
    c.fillText('SPARK / '+scene.form.toUpperCase()+'  ·  LEVEL '+(scene.level??1),22,39);
    c.fillStyle='#a9dccc';c.font='18px sans-serif';
    c.fillText((scene.worldName??'The First Stratum').slice(0,43),22,66);
    c.fillStyle='#e9f4f1';c.font='22px sans-serif';
    c.fillText(scene.roomName.slice(0,36),22,96);
    c.font='18px sans-serif';c.fillStyle='#c8d9e5';
    c.fillText('HP '+Math.ceil(scene.health)+' / '+scene.maxHealth+
      '     '+scene.phase.toUpperCase(),22,123);
    c.fillStyle='#18343d';c.fillRect(22,136,466,16);
    c.fillStyle='#6de6c0';c.fillRect(22,136,466*Math.max(0,Math.min(1,scene.health/scene.maxHealth)),16);
    if(scene.navigationOpen){
      c.fillStyle='#f7dd9b';c.font='bold 21px sans-serif';
      c.fillText('COMPASS · CANONICAL ROOM EXITS',22,177);
      c.font='15px sans-serif';
      const lines=(scene.route??[]).slice(0,4);
      lines.forEach((gate,index)=>{
        const text=gate.heading+'  '+gate.status+'  '+gate.name;
        c.fillStyle=gate.available?'#8de6c8':'#e9b68b';
        c.fillText(text.length>55?text.slice(0,52)+'…':text,24,198+index*15);
      });
      c.fillStyle='#96c7cf';c.font='12px sans-serif';
      c.fillText('LEFT Y CLOSES MAP · ROOM SIMULATION PAUSED',22,249);
    }else if(scene.choices?.length){
      c.font='16px sans-serif';
      scene.choices.forEach((item,index)=>{
        c.fillStyle=index===(scene.selectedChoice??0)?'#f4df9e':'#afc8c7';
        const label=(index===(scene.selectedChoice??0)?'▶ ':'   ')+item.title;
        c.fillText(label.length>55?label.slice(0,52)+'…':label,22,177+index*22);
      });
      c.fillStyle='#96c7cf';c.font='13px sans-serif';
      c.fillText('LEFT STICK SELECT  ·  RT / A CONFIRM',22,249);
    }else{
      const hint=scene.notice|| (scene.cleared?
        'Travel through the open gate · A or grip':'Clear the swarm to open the gates');
      c.font='17px sans-serif';c.fillStyle='#d4c8b3';
      const label=hint.length>58?hint.slice(0,55)+'…':hint;
      c.fillText(label,22,190);
      c.font='15px sans-serif';c.fillStyle='#96c7cf';
      c.fillText('LT DASH  ·  RT POWER  ·  A GATE  ·  B MORPH',22,228);
    }
    const g=this.gl;
    g.bindTexture(g.TEXTURE_2D,this.hudTexture);
    g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL,false);
    g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,this.hudCanvas);
  }
  updateXRPanel(s){
    const alert=!!s.statusMessage&&!s.paused&&!s.calibration,p=s.panel,d=s.diagnostics||{},
      stamp=JSON.stringify([alert,s.statusMessage,s.pauseReason,p.page,p.rows.map(r=>[r.label,r.selected]),p.start,p.total,
        Math.ceil(s.health),s.cooldown?.toFixed(1),s.guardians?.map(g=>[Math.ceil(g.hp),g.stage]),d.state,d.controllers,s.panelPlacement?.attachment,p.pointer&&[Math.round(p.pointer.x/8),Math.round(p.pointer.y/8)]]);
    if(stamp===this.lastHudStamp)return;this.lastHudStamp=stamp;
    const c=this.hudContext,height=alert?128:384,width=alert?.34:p.width,physicalHeight=alert?.085:p.height;
    if(this.hudCanvas.height!==height)this.hudCanvas.height=height;
    const meshKey=width+':'+physicalHeight;
    if(this.hudSizeKey!==meshKey){this.hudSizeKey=meshKey;const x=width/2,y=physicalHeight/2;
      this.hudMesh=new Float32Array([-x,-y,0,0,1,x,-y,0,1,1,x,y,0,1,0,-x,-y,0,0,1,x,y,0,1,0,-x,y,0,0,0]);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.hudVertices);this.gl.bufferData(this.gl.ARRAY_BUFFER,this.hudMesh,this.gl.STATIC_DRAW);}
    c.fillStyle='rgba(5,17,23,.97)';c.fillRect(0,0,512,height);c.strokeStyle='#bda366';c.lineWidth=3;c.strokeRect(2,2,508,height-4);
    const lines=(text,max=34)=>{const words=String(text||'').split(' '),out=[''];for(const word of words){if((out.at(-1)+' '+word).trim().length>max)out.push(word);else out[out.length-1]=(out.at(-1)+' '+word).trim();}return out;};
    c.fillStyle='#f5dca1';c.font='bold 28px sans-serif';c.fillText(alert?'SPARK / CONTROLS':'SPARK / '+p.page.toUpperCase(),16,33);
    if(alert){c.font='24px sans-serif';c.fillStyle='#e3ece7';lines(s.statusMessage,37).slice(0,3).forEach((line,i)=>c.fillText(line,16,63+i*26));}
    else{
      c.font='18px sans-serif';c.fillStyle='#a4d9d1';
      c.fillText((s.calibration?'CAMPAIGN PAUSED · CALIBRATION':(s.roomName||'Arena')+' · '+(s.form||'spark')).slice(0,44),16,57);
      c.fillStyle='#e2d9c3';c.font='19px sans-serif';
      const boss=s.guardians?.[0];
      const summary=boss?boss.kind.toUpperCase()+' '+Math.ceil(boss.hp)+' / '+boss.maxHp+' · PHASE '+boss.stage:
        s.roomId==='eye'&&s.cleared?'WARDEN DEFEATED · RUN ESSENCE '+s.essence:
        p.page==='Inventory'?'Keys '+(s.keys?.join(', ')||'—')+' · Seals '+(s.seals?.join(', ')||'—'):
        'HP '+Math.ceil(s.health)+' / '+s.maxHealth+' · POWER '+(s.cooldown||0).toFixed(1)+'s';
      c.fillText(summary.slice(0,44),16,82);
      if(p.page==='Diagnostics'){
        c.font='19px sans-serif';const controls=d.controllers||{};
        const state=side=>{const x=controls[side]||{};return !x.detected?'disconnected':!x.grip?'grip lost':!x.ray?'ray lost':'tracked';};
        for(const [i,text]of ['L '+state('left')+' · R '+state('right'),d.state+' · '+(s.movementStatus||'').slice(0,20),d.session+' / '+d.mode+' / '+d.quality,'Last error: '+(d.lastError||'none')].entries())c.fillText(text.slice(0,44),16,78+i*23);
      }
      for(const row of p.rows){
        c.fillStyle=row.selected?'#254c4b':'#102b31';c.fillRect(10,row.y,492,row.height);
        if(row.selected){c.fillStyle='#f6d994';c.fillRect(10,row.y,5,row.height);}
        c.fillStyle=row.selected?'#fff0be':'#bbd6d2';c.font=(row.selected?'bold ':'')+'24px sans-serif';
        lines(row.label,34).slice(0,2).forEach((line,i)=>c.fillText((row.selected&&i===0?'› ':'  ')+line,23,row.y+24+i*25));
      }
      if(!p.rows.length){c.fillStyle='#b5d6d2';c.font='22px sans-serif';
        lines(p.page==='World'?(s.worldName||'Arena')+' · No campaign gates in this encounter.':'No actions on this page.',32).slice(0,3).forEach((line,i)=>c.fillText(line,22,130+i*29));}
      c.font='15px sans-serif';p.tabs.forEach((tab,i)=>{const w=512/p.tabs.length;c.fillStyle=tab===p.page?'#d4ba7f':'#214047';c.fillRect(i*w+3,284,w-6,34);c.fillStyle=tab===p.page?'#10222a':'#c0d9d6';c.fillText(tab,i*w+8,307);});
      c.font='16px sans-serif';c.fillStyle='#a1c8c3';
      const footer=s.calibration?'Only art / aim preferences · no combat input':s.statusMessage||s.pauseReason||'Stick ↑↓ items · ←→ pages · trigger confirm';
      lines(footer,49).slice(0,2).forEach((line,i)=>c.fillText(line,14,340+i*18));
      c.font='13px sans-serif';c.fillText((p.total?p.start+1+'–'+Math.min(p.start+p.rows.length,p.total)+' / '+p.total+' · ':'')+(s.panelPlacement?.attachment||'wrist')+' · X close / Y recenter',14,378);
      if(p.pointer){c.fillStyle='#f9e2a7';c.beginPath();c.arc(p.pointer.x,p.pointer.y,4,0,Math.PI*2);c.fill();}
    }
    const gl=this.gl;gl.bindTexture(gl.TEXTURE_2D,this.hudTexture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,this.hudCanvas);
  }
  updateArenaHud(s){
    const stamp=[s.frame>>3,s.paused,s.menuIndex,s.menuLabels?.join('|'),s.pauseReason].join('|');
    if(stamp===this.lastHudStamp)return;this.lastHudStamp=stamp;
    const c=this.hudContext;
    c.clearRect(0,0,512,256);c.fillStyle='rgba(4,17,25,.93)';c.fillRect(0,0,512,256);
    c.strokeStyle='#d6bc79';c.lineWidth=3;c.strokeRect(3,3,506,250);
    c.fillStyle='#f5d593';c.font='bold 24px sans-serif';c.fillText('SPARK / ELEMENTAL ASCENSION',18,32);
    c.font='18px sans-serif';c.fillStyle='#ade5db';
    c.fillText('ROUND '+s.round+' · '+s.rounds.join(' : ')+' · '+s.clock+'s',18,60);
    if(s.paused){
      c.fillStyle='#ffd6a3';c.fillText((s.pauseReason||'PAUSED').slice(0,48),18,86);
      for(let i=-1;i<=2;i++){
        const index=(s.menuIndex+i+s.menuLabels.length)%s.menuLabels.length;
        c.fillStyle=i===0?'#ffe4a3':'#94c3c5';c.font=i===0?'bold 20px sans-serif':'17px sans-serif';
        c.fillText((i===0?'▶ ':'  ')+s.menuLabels[index],18,120+(i+1)*28);
      }
      c.font='14px sans-serif';c.fillStyle='#c2d0cf';c.fillText('LEFT STICK SELECT · TRIGGER CONFIRM · B EXIT',18,244);
    }else{
      c.fillStyle='#d3ece8';c.fillText('YOU '+Math.ceil(s.health)+' / '+s.maxHealth+'    ARCHON '+Math.ceil(s.enemyHealth),18,91);
      c.fillText('CAST '+s.cooldown.toFixed(1)+'s    DODGE '+s.dodgeCooldown.toFixed(1)+'s',18,118);
      c.fillStyle=s.windup?'#ffc16e':'#9be3d3';
      c.fillText(s.windup?'WINDUP · LEAN / DUCK / DODGE':'HOLD TRIGGER · AIM · RELEASE',18,151);
      c.font='15px sans-serif';c.fillStyle='#d9d7bb';
      c.fillText(s.notice.slice(0,60),18,185);
      c.fillText('GRIP / A DODGE · LEFT GRIP DUCK · Y RECENTER',18,214);
      c.fillText('RIGHT STICK CLICK: COMFORT / PAUSE · B EXIT',18,240);
    }
    const gl=this.gl;gl.bindTexture(gl.TEXTURE_2D,this.hudTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,this.hudCanvas);
  }
  updateLivingHud(s){
    const stamp=JSON.stringify([s.form,s.roomId,Math.ceil(s.health),s.cooldown.toFixed(1),s.attackCooldown.toFixed(1),s.combatProfile,s.dominantHand,s.aim?.reason,s.aim?.targetId,s.paused,s.menuIndex,s.menuLabels,s.pauseReason,s.choices,s.guardians?.map(g=>[Math.ceil(g.hp),g.stage]),s.guardianVisual?.guide,s.cleared,s.essence,s.morphAvailable]);
    if(stamp===this.lastHudStamp)return;this.lastHudStamp=stamp;
    if(this.hudCanvas.height!==512){
      this.hudCanvas.height=512;
      this.hudMesh=new Float32Array([-.33,-.33,0,0,1,.33,-.33,0,1,1,.33,.33,0,1,0,
        -.33,-.33,0,0,1,.33,.33,0,1,0,-.33,.33,0,0,0]);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.hudVertices);
      this.gl.bufferData(this.gl.ARRAY_BUFFER,this.hudMesh,this.gl.STATIC_DRAW);
    }
    const c=this.hudContext;
    c.fillStyle='rgba(5,17,25,.96)';c.fillRect(0,0,512,512);
    c.strokeStyle=s.vessel.color;c.lineWidth=4;c.strokeRect(4,4,504,504);
    c.fillStyle=s.vessel.color;c.font='bold 26px sans-serif';c.fillText('SPARK / '+s.form.toUpperCase(),20,38);
    c.fillStyle='#dae9e4';c.font='19px sans-serif';c.fillText(s.worldName,20,68);c.fillText(s.roomName,20,96);
    c.fillText('HP '+Math.ceil(s.health)+' / '+s.maxHealth+'    POWER '+s.cooldown.toFixed(1)+'s',20,127);
    c.fillStyle='#99cfbd';c.font='15px sans-serif';
    c.fillText('Keys '+(s.keys.join(', ')||'—')+' · Seals '+(s.seals.join(', ')||'—'),20,153);
    c.fillText('Relics '+(s.relics.join(', ')||'—'),20,174);
    const hint=s.notice||s.roomDescription||s.pauseReason||'',guardian=s.guardians?.[0];
    c.fillStyle='#ddcca7';
    if(guardian){c.fillText('THE '+guardian.kind.toUpperCase()+' · HP '+Math.ceil(guardian.hp)+' / '+guardian.maxHp+' · PHASE '+guardian.stage,20,200);c.fillText((s.guardianVisual?.guide||'').slice(0,62),20,220);}
    else if(s.roomId==='eye'&&s.cleared&&s.bossDefeated?.room==='eye'){
      c.fillText('THE WARDEN DEFEATED · RUN ESSENCE '+s.essence,20,200);
      c.fillText((s.seals.includes('stratum')?'Stratum seal remembered':'')+(s.morphAvailable?' · Vessel Resonance':''),20,220);
    }
    else{c.fillText(hint.slice(0,58),20,200);c.fillText(hint.slice(58,116),20,220);}
    c.fillStyle='#94b7ba';c.font='14px sans-serif';
    const recovery='Basic '+Math.max(0,s.attackCooldown).toFixed(1)+'s · '+s.weapon.name;
    c.fillText(recovery.slice(0,58),20,239);
    c.font='13px sans-serif';
    c.fillText(s.combatProfile==='spellcraft'?'SPELLCRAFT · '+s.dominantHand.toUpperCase()+' CAST · OTHER TRIGGER POWER':'CLASSIC · auto-attacks · either trigger power',20,258);
    const guide=s.moreBounce?'MORE BOUNCE · celebration only':['forge','eye'].includes(s.roomId)?s.guardianVisual?.guide:s.aim?.blocked?'Shot blocked by cover':s.aim?.targetId?'Observed enemy '+s.aim.targetId:s.feedback;
    c.fillText((guide||'').slice(0,67),20,277);
    const labels=s.menuLabels||[];
    for(let i=-1;i<=3;i++){
      const index=(s.menuIndex+i+labels.length)%labels.length;
      c.fillStyle=i===0?s.vessel.color:'#94b7ba';c.font=i===0?'bold 21px sans-serif':'18px sans-serif';
      c.fillText((i===0?'▶ ':'  ')+(labels[index]||'').slice(0,43),20,311+(i+1)*32);
    }
    c.fillStyle='#8cb9b2';c.font='13px sans-serif';c.fillText((s.pauseReason||'').slice(0,64),20,471);
    c.font='14px sans-serif';c.fillText('LEFT STICK SELECT · TRIGGER CONFIRM · X CLOSE',20,493);
    const gl=this.gl;gl.bindTexture(gl.TEXTURE_2D,this.hudTexture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,this.hudCanvas);
  }
  render(views,scene,{framebuffer=null,hudPose=null,vignette=0,hands={},reduced=false}={}){
    if(this.disposed)return;
    const gl=this.gl;
    this.living=!!scene.living;
    let mesh;
    if(scene.calibration){const v=[];calibrationRoomGeometry(v,{head:hudPose,origin:scene.panelAnchor},{box:pushBox,ring:pushRing,gem:pushGem});mesh=new Float32Array(v);}
    else if(scene.living){const dynamic=[];pushActors(dynamic,scene);livingDynamicGeometry(dynamic,scene);mesh=new Float32Array(dynamic);
      const stage=livingRoomGeometry(scene);if(stage!==this.stageMesh){this.stageMesh=stage;gl.bindBuffer(gl.ARRAY_BUFFER,this.stageVertices);gl.bufferData(gl.ARRAY_BUFFER,stage,gl.STATIC_DRAW);}}
    else mesh=makeSceneVertices(scene);
    const handMesh=makeTrackedHandVertices(hands,reduced);
    gl.bindBuffer(gl.ARRAY_BUFFER,this.handVertices);
    gl.bufferData(gl.ARRAY_BUFFER,handMesh,gl.DYNAMIC_DRAW);
    const panelVisible=scene.panel?(scene.paused||scene.calibration||!!scene.statusMessage):!scene.living||scene.paused;
    if(panelVisible)this.updateHud(scene);
    gl.bindBuffer(gl.ARRAY_BUFFER,this.vertices);
    gl.bufferData(gl.ARRAY_BUFFER,mesh,gl.DYNAMIC_DRAW);
    gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);
    gl.disable(gl.BLEND);
    const p=this.program;
    const a=gl.getAttribLocation(p,'position'),b=gl.getAttribLocation(p,'color'),
      vp=gl.getUniformLocation(p,'vp');
    // gl.clear ignores viewport: clear once or the second eye erases the first.
    gl.clearColor(.012,.023,.045,1);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    for(const view of views){
      gl.viewport(view.viewport.x,view.viewport.y,view.viewport.width,view.viewport.height);
      gl.useProgram(p);gl.enable(gl.CULL_FACE);
      gl.uniform1f(gl.getUniformLocation(p,'fogAmount'),scene.living?1:0);
      const sceneMatrix=scene.calibration?multiply4(view.projection,view.inverse):view.matrix;
      if(scene.living&&!scene.calibration){
        gl.bindBuffer(gl.ARRAY_BUFFER,this.stageVertices);
        gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,3,gl.FLOAT,false,24,0);
        gl.enableVertexAttribArray(b);gl.vertexAttribPointer(b,3,gl.FLOAT,false,24,12);
        gl.uniformMatrix4fv(vp,false,view.matrix);gl.drawArrays(gl.TRIANGLES,0,this.stageMesh.length/6);
      }
      gl.bindBuffer(gl.ARRAY_BUFFER,this.vertices);
      gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,3,gl.FLOAT,false,24,0);
      gl.enableVertexAttribArray(b);gl.vertexAttribPointer(b,3,gl.FLOAT,false,24,12);
      gl.uniformMatrix4fv(vp,false,sceneMatrix);
      gl.drawArrays(gl.TRIANGLES,0,mesh.length/6);
      if(handMesh.length&&view.projection&&view.inverse){
        gl.bindBuffer(gl.ARRAY_BUFFER,this.handVertices);
        gl.vertexAttribPointer(a,3,gl.FLOAT,false,24,0);gl.vertexAttribPointer(b,3,gl.FLOAT,false,24,12);
        gl.uniformMatrix4fv(vp,false,multiply4(view.projection,view.inverse));
        gl.drawArrays(gl.TRIANGLES,0,handMesh.length/6);
      }
      // A lightweight optional per-eye comfort mask precedes the readable HUD.
      if(hudPose&&vignette>0)this.drawComfortVignette(vignette);
      if(hudPose&&panelVisible){let placement=scene.panelPlacement?.matrix;
        if(scene.panel&&scene.statusMessage&&!scene.paused&&!scene.calibration){placement=new Float32Array(hudPose);for(let i=0;i<3;i++)placement[12+i]=hudPose[12+i]-hudPose[4+i]*.32-hudPose[8+i]*.8;}
        this.drawHud(view,hudPose,hands.left?.matrix,placement);}
    }
  }
  drawComfortVignette(amount){
    const gl=this.gl;
    const safe=Math.max(0,Math.min(.75,Number(amount)||0));
    if(!safe)return;
    gl.disable(gl.CULL_FACE);gl.disable(gl.DEPTH_TEST);gl.depthMask(false);
    gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this.comfortProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER,this.comfortVertices);
    const pos=gl.getAttribLocation(this.comfortProgram,'position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos,2,gl.FLOAT,false,8,0);
    gl.uniform1f(gl.getUniformLocation(this.comfortProgram,'amount'),safe);
    gl.drawArrays(gl.TRIANGLES,0,6);
    gl.disable(gl.BLEND);gl.depthMask(true);gl.enable(gl.DEPTH_TEST);
  }
  drawHud(view,headMatrix,leftGrip,placement=null){
    const gl=this.gl;
    // Head-following, placed ABOVE rather than across the central sight line.
    const anchored=placement|| (this.living?livingWristPose(headMatrix,leftGrip):new Float32Array(headMatrix));
    if(!placement&&!this.living)for(let k=0;k<3;k++)anchored[12+k]+=
      headMatrix[4+k]*.38-headMatrix[8+k]*1.75;
    const m=multiply4(view.projection,multiply4(view.inverse,anchored));
    gl.disable(gl.CULL_FACE);gl.disable(gl.DEPTH_TEST);gl.depthMask(false);
    gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    const p=this.hudProgram;
    gl.useProgram(p);
    gl.bindBuffer(gl.ARRAY_BUFFER,this.hudVertices);
    const a=gl.getAttribLocation(p,'position'),u=gl.getAttribLocation(p,'uv');
    gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,3,gl.FLOAT,false,20,0);
    gl.enableVertexAttribArray(u);gl.vertexAttribPointer(u,2,gl.FLOAT,false,20,12);
    gl.uniformMatrix4fv(gl.getUniformLocation(p,'vp'),false,m);
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.hudTexture);
    gl.uniform1i(gl.getUniformLocation(p,'atlas'),0);
    gl.drawArrays(gl.TRIANGLES,0,6);
    gl.disable(gl.BLEND);gl.depthMask(true);gl.enable(gl.DEPTH_TEST);
  }
  dispose(){
    if(this.disposed)return;this.disposed=true;
    const gl=this.gl;
    gl.deleteBuffer(this.vertices);gl.deleteBuffer(this.hudVertices);gl.deleteBuffer(this.handVertices);gl.deleteBuffer(this.stageVertices);this.stageMesh=null;
    gl.deleteBuffer(this.comfortVertices);
    gl.deleteTexture(this.hudTexture);
    gl.deleteProgram(this.program);gl.deleteProgram(this.hudProgram);
    gl.deleteProgram(this.comfortProgram);
    clearRoomGeometryCache();
  }
}
