import {multiply4} from './spark-vr-math.js';
import {inverseRigidPoint} from './spark-xr-targeting.js';
export const XR_PANEL_VERSION='spark.xr.panel.v1';
export const XR_PANEL_PAGES=Object.freeze(['Combat','Inventory','World','Comfort','Session']);
export function panelPageFor(label,choices=[]){
 if(choices.some(c=>c.title===label)||/^(Resume|Combat:|Casting hand:|Aim assistance:|Throw:|Restart)/.test(label))return 'Combat';
 if(/^(Become |Resonance:|Inventory:)/.test(label))return 'Inventory';
 if(/^(Enter |Inspect |Listen between|A rhythm)/.test(label))return 'World';
 if(/^(Posture:|Snap turn:|Movement:|Vignette:|Visual intensity:|Haptics:|Sound:|Quality:)/.test(label))return 'Comfort';
 if(/^Calibration:/.test(label))return 'Calibration';
 if(/^Diagnostics:/.test(label))return 'Diagnostics';
 return 'Session';
}
export function xrPanelModel(menu,scene,index=0,page=null,scrollIndex=index){
 const all=menu.map(([label],global)=>({label,global,page:panelPageFor(label,scene.choices)})),selected=all[index]||all[0],
  current=page||selected?.page||'Combat',items=all.filter(x=>x.page===current),position=Math.max(0,items.findIndex(x=>x.global===scrollIndex)),
  count=current==='Diagnostics'?2:3,start=Math.max(0,Math.min(items.length-count,position-1));
 return {version:XR_PANEL_VERSION,page:current,tabs:scene.calibration?['Calibration']:scene.recoveryOnly?['Diagnostics']:XR_PANEL_PAGES,
  items,rows:items.slice(start,start+count).map((item,i)=>({...item,y:(current==='Diagnostics'?160:96)+i*58,height:54,selected:item.global===index})),
  selected:index,start,total:items.length,width:.30*(scene.panelScale||1),height:.225*(scene.panelScale||1)};
}
export function panelFitsViews(pose,width,height,views=[]){
 for(const view of views){
  if(!view.projection||!view.inverse)continue;
  const m=multiply4(view.projection,multiply4(view.inverse,pose));
  for(const x of [-width/2,width/2])for(const y of [-height/2,height/2]){
   const clip=[m[0]*x+m[4]*y+m[12],m[1]*x+m[5]*y+m[13],m[3]*x+m[7]*y+m[15]];
   if(clip[2]<.1||Math.abs(clip[0]/clip[2])>.92||Math.abs(clip[1]/clip[2])>.92)return false;
  }
 }
 return true;
}
export function xrPanelPose(head,hands={},calibration={},anchor=head,views=[]){
 const side=calibration.wristSide==='right'?'right':'left',grip=hands[side]?.matrix,scale=calibration.panelScale||1,
  width=.30*scale,height=.225*scale;
 if(calibration.panelMode!=='floating'&&grip){
  const p=new Float32Array(head),sign=side==='right'?1:-1;
  for(let i=0;i<3;i++)p[12+i]=grip[12+i]+grip[i]*sign*.045+grip[4+i]*.075+(i===1?.055:0);
  const d=Math.hypot(...[0,1,2].map(i=>p[12+i]-head[12+i]));
  if(d>=.35&&d<=1.1&&panelFitsViews(p,width,height,views))return {matrix:p,attachment:side+' wrist',width,height};
 }
 const p=new Float32Array(anchor||head),base=anchor||head;
 for(let i=0;i<3;i++)p[12+i]=base[12+i]+base[i]*-.13-base[4+i]*.10-base[8+i]*.82;
 return {matrix:p,attachment:'floating · fixed when opened',width,height};
}
export function hitXRPanel(pose,ray,model){
 if(!ray||!pose)return null;
 const origin=inverseRigidPoint(pose,[ray[12],ray[13],ray[14]]),direction=inverseRigidPoint(pose,[-ray[8],-ray[9],-ray[10]],true);
 if(Math.abs(direction[2])<.01)return null;
 const t=-origin[2]/direction[2];if(t<.03||t>2)return null;
 const x=origin[0]+direction[0]*t,y=origin[1]+direction[1]*t;
 if(Math.abs(x)>model.width/2||Math.abs(y)>model.height/2)return null;
 const px=(x/model.width+.5)*512,py=(.5-y/model.height)*384;
 if(py>=284&&py<=322&&model.tabs.length>1){const page=model.tabs[Math.min(model.tabs.length-1,Math.floor(px/512*model.tabs.length))];return {kind:'tab',page,x:px,y:py};}
 const row=model.rows.find(r=>py>=r.y&&py<=r.y+r.height);
 return row?{kind:'row',index:row.global,x:px,y:py}:null;
}
export function calibrationRoomGeometry(push,{head,origin},art){
 // A paused reference-space display, not a combat target or progression context.
 const base=origin||head;if(!base)return;
 const local=[],floor=base[13]-1.65;
 art.box(local,0,floor-.035,-.6,2.8,.06,2.6,[.045,.075,.09]);
 for(const side of [-1,1]){
  art.ring(local,side*.32,base[13]-.20,-.95,.12,[.45,.85,.8],12,true);
  art.gem(local,side*.32,base[13]-.20,-.95,.018,.045,[1,.8,.4]);
 }
 for(let i=0;i<local.length;i+=6){
  // Only yaw is used for the fixture, so the floor stays level when looking up.
  const yaw=Math.atan2(base[8],base[10]),c=Math.cos(yaw),s=Math.sin(yaw),x=local[i],z=local[i+2];
  push.push(base[12]+c*x+s*z,local[i+1],base[14]-s*x+c*z,...local.slice(i+3,i+6));
 }
}
