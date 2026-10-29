// Original bounded procedural geometry; no asset downloads.
export const hex=(input,fallback='#a9bbbe')=>{
  const m=/^#([0-9a-f]{6})$/i.exec(input||'')||/^#([0-9a-f]{6})$/i.exec(fallback);
  const n=parseInt(m[1],16);
  return [(n>>>16)/255,((n>>>8)&255)/255,(n&255)/255];
};
export const tint=(a,mul=1)=>a.map(v=>Math.min(1,v*mul));

export function pushBox(vertices,x,y,z,w,h,d,color){
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
export function pushBeam(v,a,b,width,color){
  const delta=b.map((n,i)=>n-a[i]),length=Math.hypot(...delta);if(length<.0001)return;
  const z=delta.map(n=>n/length),up=Math.abs(z[1])>.95?[1,0,0]:[0,1,0];
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  let x=cross(up,z),n=Math.hypot(...x);x=x.map(v=>v/n);const y=cross(z,x),local=[];
  pushBox(local,0,0,0,width,width,length,color);
  const center=a.map((n,i)=>(n+b[i])/2);
  for(let i=0;i<local.length;i+=6){
    for(let k=0;k<3;k++)v.push(center[k]+x[k]*local[i]+y[k]*local[i+1]+z[k]*local[i+2]);
    v.push(...local.slice(i+3,i+6));
  }
}
export function pushRing(v,x,y,z,r,color,segments=12,vertical=false){
  for(let i=0;i<segments;i++){
    const a=i/segments*Math.PI*2,b=(i+1)/segments*Math.PI*2;
    pushBeam(v,[x+Math.cos(a)*r,y+(vertical?Math.sin(a)*r:0),z+(vertical?0:Math.sin(a)*r)],
      [x+Math.cos(b)*r,y+(vertical?Math.sin(b)*r:0),z+(vertical?0:Math.sin(b)*r)],.025,color);
  }
}
export function pushGem(v,x,y,z,r,height,color){
  const top=[x,y+height/2,z],bottom=[x,y-height/2,z],ring=[[x+r,y,z],[x,y,z+r],[x-r,y,z],[x,y,z-r]];
  for(let i=0;i<4;i++)for(const [triangle,shade]of [[[top,ring[(i+1)%4],ring[i]],.7+i*.1],[[bottom,ring[i],ring[(i+1)%4]],.35+i*.08]])
    for(const p of triangle)v.push(...p,...tint(color,shade));
}
