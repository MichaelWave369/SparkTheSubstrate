// Original bounded faceted art, shared by architecture, constructs and gauntlets.
import {pushBeam,pushGem,tint} from './spark-vr-geometry.js';
export function pushBevelBox(v,x,y,z,w,h,d,color,bevel=.12){
 const b=Math.min(w,d)*bevel,ring=[[-w/2+b,-d/2],[w/2-b,-d/2],[w/2,-d/2+b],[w/2,d/2-b],[w/2-b,d/2],[-w/2+b,d/2],[-w/2,d/2-b],[-w/2,-d/2+b]];
 const tri=(a,b,c,col)=>{for(const p of [a,b,c])v.push(...p,...col);};
 for(let i=0;i<8;i++){
  const j=(i+1)%8,a=[x+ring[i][0],y-h/2,z+ring[i][1]],b=[x+ring[j][0],y-h/2,z+ring[j][1]],
   c=[b[0],y+h/2,b[2]],e=[a[0],y+h/2,a[2]],col=tint(color,.48+(i%4)*.12);
  tri(a,c,b,col);tri(a,e,c,col);tri([x,y+h/2,z],c,e,tint(color,1));tri([x,y-h/2,z],a,b,tint(color,.3));
 }
}
export function pushLimb(v,a,b,r1,r2,color,sides=6){
 const dz=b.map((n,i)=>n-a[i]),length=Math.hypot(...dz);if(length<.0001)return;
 const z=dz.map(n=>n/length),up=Math.abs(z[1])>.9?[1,0,0]:[0,1,0],
  cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 let x=cross(up,z),n=Math.hypot(...x);x=x.map(v=>v/n);const y=cross(z,x);
 const point=(base,r,t)=>base.map((v,i)=>v+(x[i]*Math.cos(t)+y[i]*Math.sin(t))*r),tri=(a,b,c,col)=>{for(const p of [a,b,c])v.push(...p,...col);};
 for(let i=0;i<sides;i++){
  const t=i/sides*Math.PI*2,u=(i+1)/sides*Math.PI*2,p=point(a,r1,t),q=point(a,r1,u),r=point(b,r2,u),s=point(b,r2,t),col=tint(color,.6+(i%3)*.13);
  tri(p,q,r,col);tri(p,r,s,col);tri(a,q,p,tint(color,.45));tri(b,s,r,color);
 }
}
export function pushArch(v,x,y,z,r,rise,color,segments=12,axis='z'){
 for(let i=0;i<segments;i++){
  const a=i/segments*Math.PI,b=(i+1)/segments*Math.PI,
   point=t=>[x+(axis==='z'?Math.cos(t)*r:0),y+Math.sin(t)*rise,z+(axis==='x'?Math.cos(t)*r:0)];
  pushBeam(v,point(a),point(b),.13,color);
 }
}
export function pushColumn(v,x,z,height,color,trim){
 pushBevelBox(v,x,height/2,z,.23,height,.3,color,.2);
 for(const y of [.12,height*.38,height-.12])pushBevelBox(v,x,y,z,.32,.12,.38,trim,.18);
 pushGem(v,x,height+.1,z,.12,.35,trim);
}
