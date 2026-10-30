// Synthetic six-degree-of-freedom sample for the desktop test path. Never hardware evidence.
export function previewMatrix(x=0,y=0,z=0,yaw=0,pitch=0){
  const c=Math.cos(yaw),s=Math.sin(yaw),p=Math.cos(pitch),q=Math.sin(pitch);
  return [c,0,-s,0, s*q,p,c*q,0, s*p,-q,c*p,0, x,y,z,1];
}
export function desktopXRSample({yaw=0,pitch=0,lean=0,duck=0,move=0,turn=0,
  leftTrigger=false,rightTrigger=false,dodge=false,controllerDuck=false,pause=false,
  recenter=false,exit=false,missingPose=false,dodgeDirection=0,strafe,dash=false,wrist=false,interact=false,cycleForm=false}={}){
  const head=previewMatrix(lean,1.65-duck,0,yaw,pitch),hands={};
  const target=[head[12]-head[8]*4,head[13]-head[9]*4,head[14]-head[10]*4];
  for(const name of ['left','right']){
    const side=name==='left'?-1:1;
    const point=[lean+head[0]*side*.22-head[8]*.48,head[13]-.20,head[2]*side*.22-head[10]*.48];
    const d=target.map((n,i)=>n-point[i]),n=Math.hypot(...d);
    const matrix=previewMatrix(...point,Math.atan2(-d[0],-d[2]),Math.asin(d[1]/n));
    const pressed=name==='left'?[leftTrigger,controllerDuck,false,dash,wrist,recenter]:
      [rightTrigger,dodge||interact,false,pause,false,exit];
    // Touch-like grip: thumb axis points up and +Y returns along the forearm.
    // The pointing ray remains forward. Identical grip/ray orientations hid
    // alignment errors in the original desktop-only hand screenshots.
    const grip=previewMatrix(...point,Math.atan2(-d[0],-d[2]),Math.asin(d[1]/n)+1.25);
    hands[name]={grip:missingPose&&name==='right'?null:grip,ray:matrix,
      axes:[0,0,name==='left'?(strafe??dodgeDirection):turn,name==='left'?-move:0],
      buttons:pressed.map(p=>({pressed:!!p,value:p?1:0}))};
  }
  return {head,hands,cycleForm};
}
