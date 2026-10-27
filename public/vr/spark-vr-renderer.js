// Original low-poly WebGL renderer for all canonical Spark solo Descent rooms.
// Geometry is derived from canonical ROOMS, obstacles and entity positions.
import {WIDTH,HEIGHT} from '../action-engine.js?v=0.17.0';
import {worldAt} from './spark-vr-model.js';
import {multiply4} from './spark-vr-math.js';

const VERT= `attribute vec3 position;
attribute vec3 color;
uniform mat4 vp;
varying vec3 vColor;
void main(){vColor=color;gl_Position=vp*vec4(position,1.0);}`;
const FRAG= `precision mediump float;
varying vec3 vColor;
void main(){gl_FragColor=vec4(vColor,1.0);}`;
const HUD_VERT=`attribute vec3 position;
attribute vec2 uv;
uniform mat4 vp;
varying vec2 vUv;
void main(){vUv=uv;gl_Position=vp*vec4(position,1.0);}`;
const HUD_FRAG=`precision mediump float;
uniform sampler2D atlas;
varying vec2 vUv;
void main(){gl_FragColor=texture2D(atlas,vUv);}`;

const hex=(input,fallback='#a9bbbe')=>{
  const m=/^#([0-9a-f]{6})$/i.exec(input||'')||/^#([0-9a-f]{6})$/i.exec(fallback);
  const n=parseInt(m[1],16);
  return [(n>>>16)/255,((n>>>8)&255)/255,(n&255)/255];
};
const tint=(a,mul=1)=>a.map(v=>Math.min(1,v*mul));

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
function pushBox(vertices,x,y,z,w,h,d,color){
  // Each face gets a slightly different diffuse shade. No texture fetches.
  const a=x-w/2,b=x+w/2,c=y-h/2,e=y+h/2,f=z-d/2,g=z+d/2;
  const p=[
    [[a,c,g],[b,c,g],[b,e,g],[a,e,g],.62],
    [[b,c,f],[a,c,f],[a,e,f],[b,e,f],.42],
    [[a,c,f],[a,c,g],[a,e,g],[a,e,f],.48],
    [[b,c,g],[b,c,f],[b,e,f],[b,e,g],.74],
    [[a,e,f],[a,e,g],[b,e,g],[b,e,f],1],
    [[a,c,g],[a,c,f],[b,c,f],[b,c,g],.26]
  ];
  for(const [v0,v1,v2,v3,light] of p){
    const col=tint(color,light);
    for(const v of [v0,v1,v2,v0,v2,v3])vertices.push(...v,...col);
  }
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
    const [x,,z]=worldAt(entity.x,entity.y),radius=Math.min(.6,Math.max(.18,(entity.r||20)/100));
    const col=entity.hp>0?hex(entity.color,'#ef966d'):[.1,.1,.1];
    pushBox(vertices,x,.35+radius/2,z,radius*1.6,.7+radius,radius*1.6,col);
    pushBox(vertices,x,.96+radius/2,z,radius*.65,.2,radius*.65,tint(col,1.8));
  }
  for(const shot of s.shots.slice(0,80)){
    const [x,,z]=worldAt(shot.x,shot.y);
    pushBox(vertices,x,.65,z,.14,.14,.14,shot.enemy?[1,.28,.35]:[.31,.97,1]);
  }
  for(const frag of s.fragments.slice(0,60)){
    const [x,,z]=worldAt(frag.x,frag.y);
    pushBox(vertices,x,.28,z,.14,.55,.14,[.9,.77,.35]);
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
}
export function makeSceneVertices(snapshot){
  const vertices=[];
  pushStage(vertices,snapshot);
  pushActors(vertices,snapshot);
  return new Float32Array(vertices);
}
export class SparkVRRenderer{
  constructor(canvas){
    this.canvas=canvas;
    const gl=canvas.getContext('webgl',{alpha:false,antialias:true,depth:true,xrCompatible:true});
    if(!gl)throw Error('A WebGL browser is required for the Spark VR preview.');
    this.gl=gl;
    this.program=compile(gl,VERT,FRAG);
    this.hudProgram=compile(gl,HUD_VERT,HUD_FRAG);
    this.vertices=gl.createBuffer();this.hudVertices=gl.createBuffer();
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
    const stamp=[scene.roomId,scene.roomName,scene.worldName,scene.form,
      Math.ceil(scene.health),scene.phase,scene.cleared,
      scene.notice.slice(0,80),scene.selectedChoice??0,
      scene.choices?.map(x=>x.id).join(',')].join('|');
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
    if(scene.choices?.length){
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
  render(views,scene,{framebuffer=null,hudPose=null}={}){
    if(this.disposed)return;
    const gl=this.gl,mesh=makeSceneVertices(scene);
    this.updateHud(scene);
    gl.bindBuffer(gl.ARRAY_BUFFER,this.vertices);
    gl.bufferData(gl.ARRAY_BUFFER,mesh,gl.DYNAMIC_DRAW);
    gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);
    gl.disable(gl.BLEND);
    const p=this.program;
    const a=gl.getAttribLocation(p,'position'),b=gl.getAttribLocation(p,'color'),
      vp=gl.getUniformLocation(p,'vp');
    for(const view of views){
      gl.viewport(view.viewport.x,view.viewport.y,view.viewport.width,view.viewport.height);
      gl.clearColor(.012,.023,.045,1);
      gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      gl.useProgram(p);
      gl.bindBuffer(gl.ARRAY_BUFFER,this.vertices);
      gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,3,gl.FLOAT,false,24,0);
      gl.enableVertexAttribArray(b);gl.vertexAttribPointer(b,3,gl.FLOAT,false,24,12);
      gl.uniformMatrix4fv(vp,false,view.matrix);
      gl.drawArrays(gl.TRIANGLES,0,mesh.length/6);
      if(hudPose)this.drawHud(view,hudPose);
    }
  }
  drawHud(view,headMatrix){
    const gl=this.gl;
    // Head-following, placed ABOVE rather than across the central sight line.
    const anchored=new Float32Array(headMatrix);
    for(let k=0;k<3;k++)anchored[12+k]+=
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
    gl.deleteBuffer(this.vertices);gl.deleteBuffer(this.hudVertices);
    gl.deleteTexture(this.hudTexture);
    gl.deleteProgram(this.program);gl.deleteProgram(this.hudProgram);
  }
}
