// Column-major WebGL/WebXR matrix primitives; deliberately dependency-free.
export function multiply4(a,b,out=new Float32Array(16)){
  for(let col=0;col<4;col++)for(let row=0;row<4;row++){
    let v=0;
    for(let k=0;k<4;k++)v+=a[k*4+row]*b[col*4+k];
    out[col*4+row]=v;
  }
  return out;
}
export function projection4(fov,aspect,near,far){
  if(![fov,aspect,near,far].every(Number.isFinite)||fov<=0||
      fov>=Math.PI||aspect<=0||near<=0||far<=near)throw Error('Invalid VR projection.');
  const f=1/Math.tan(fov/2),o=new Float32Array(16);
  o[0]=f/aspect;o[5]=f;o[10]=(far+near)/(near-far);
  o[11]=-1;o[14]=2*far*near/(near-far);
  return o;
}
const normal=(v)=>{const m=Math.hypot(...v);return m>1e-7?v.map(n=>n/m):[0,0,0]};
const cross=(a,b)=>[
  a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]
];
export function lookAt4(eye,target,up=[0,1,0]){
  const z=normal(eye.map((n,i)=>n-target[i]));
  let x=normal(cross(up,z));
  if(Math.hypot(...x)<.5)x=[1,0,0];
  const y=cross(z,x);
  const o=new Float32Array(16);
  o.set([x[0],y[0],z[0],0,
    x[1],y[1],z[1],0,
    x[2],y[2],z[2],0,
    -x.reduce((s,n,i)=>s+n*eye[i],0),
    -y.reduce((s,n,i)=>s+n*eye[i],0),
    -z.reduce((s,n,i)=>s+n*eye[i],0),1]);
  return o;
}

// Physical HMD stays in its reference space. We move the entire game world
// relative to the canonical Spark player position, without changing the sim.
export function worldRoot4(playerWorldX,playerWorldZ,yaw=0,floorShift=0){
  const c=Math.cos(yaw),s=Math.sin(yaw);
  const o=new Float32Array([
    c,0,-s,0, 0,1,0,0, s,0,c,0,
    -c*playerWorldX-s*playerWorldZ,floorShift,
    s*playerWorldX-c*playerWorldZ,1
  ]);
  if(![...o].every(Number.isFinite))throw Error('Invalid world root.');
  return o;
}
export function transform4(matrix,point){
  const [x,y,z]=point;
  return [
    matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12],
    matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13],
    matrix[2]*x+matrix[6]*y+matrix[10]*z+matrix[14]
  ];
}
