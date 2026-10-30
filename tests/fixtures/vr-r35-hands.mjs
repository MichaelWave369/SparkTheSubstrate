// Frozen original MIT Spark hand geometry, main a1f59bd. Software comparison only.
// Function SHA-256: 03a2db93b71afb9c36831024afe13ef5abbf8a03e99d6123d0035e9b66a0073f
import {hex,tint,pushBox,pushGem,pushRing,pushBeam} from '../../public/vr/spark-vr-geometry.js';
import {transform4} from '../../public/vr/spark-vr-math.js';
export function baselineHandVertices(hands={},reduced=false){
  const result=[];
  for(const name of ['left','right']){
    const hand=hands[name];if(!hand?.matrix)continue;
    const local=[],col=hex(hand.color),sign=name==='left'?-1:1,accent=hex(hand.accent||hand.color);
    if(hand.style==='lumen'){pushRing(local,0,.04,-.04,.075,accent,reduced?6:12);pushGem(local,0,.08,-.045,.035,.07,col);}
    if(hand.style==='blade'){pushBeam(local,[0,.015,-.05],[0,.025,-.53],.018,accent);pushBox(local,0,.025,-.13,.15,.025,.025,col);}
    if(hand.style==='prism'){for(let i=-1;i<=1;i++)pushGem(local,i*.045,.045,-.04,.022,.09,accent);pushBox(local,0,.035,0,.10,.025,.09,col);}
    if(hand.style==='claw'){for(let i=-1;i<=1;i++)pushBeam(local,[i*.024,.025,-.06],[i*.036,.01,-.23],.016,accent);}
    if(hand.style==='root'){for(const side of [-1,1]){pushBeam(local,[side*.035,.025,.05],[side*.06,.04,-.1],.02,col);pushGem(local,side*.06,.05,-.09,.035,.035,accent);}}
    if(hand.style==='crystal'){pushBox(local,0,.005,-.01,.12,.065,.13,col);for(const side of [-1,1])pushGem(local,side*.055,.045,-.04,.03,.09,accent);}
    if(hand.attacking){
      const p=hand.attack||0,pulse=Math.sin(p*Math.PI),r=.065+p*(reduced?.02:.065);
      if(hand.style==='blade')for(let i=0;i<5;i++)pushBeam(local,[(i-2)*.045*p,.015,-.08],[(i-2)*.10*p,.04,-.62-pulse*.14],.012,accent);
      else if(hand.style==='claw')for(let i=-1;i<=1;i++)pushBeam(local,[i*.026,.03,-.09],[i*.065,.03-pulse*.1,-.35-pulse*.16],.018,accent);
      else if(hand.style==='root')for(const side of [-1,1])pushBeam(local,[0,.03,0],[side*r,.08,-.15-r],.02,col);
      else if(hand.style==='crystal')pushRing(local,0,-.02-p*.12,-.12,r,col,8);
      else if(hand.style==='prism')for(let i=-1;i<=1;i++)pushGem(local,i*r,.05,-.16-p*.25,.025,.11,accent);
      else pushRing(local,0,.08,-.09,r,accent,10);
    }
    pushBox(local,0,0,0,.075,.035,.105,tint(col,.6));
    pushBox(local,0,0,.065,.09,.045,.025,col);
    for(let i=0;i<4;i++){
      const x=(i-1.5)*.019,z=-.083+(i===3?.012:0);
      pushBox(local,x,0,z,.014,.025,.066,tint(col,.85));
      pushBox(local,x,-.006,z-.041,.013,.020,.02,col);
    }
    pushBox(local,sign*.049,-.004,-.015,.030,.025,.05,col);
    const charge=Math.max(0,Math.min(1,hand.charge||0));
    const size=.025+charge*.075;
    if(hand.recovering){pushBox(local,0,.026,.064,.08,.01,.025,[.25,.28,.32]);pushBox(local,-.04+(.08*(1-(hand.recovery||0)))/2,.033,.064,.08*(1-(hand.recovery||0)),.008,.026,accent);}
    pushBox(local,0,.055,-.085,size,size,size,col);
    if(charge>0){
      const count=reduced?2:6;
      for(let i=0;i<count;i++){
        const a=i/count*Math.PI*2+charge*2;
        pushBox(local,Math.cos(a)*.095,.055+Math.sin(a)*.07,-.085,.014,.014,.014,col);
      }
    }
    // The controller ray and grip can have different orientations on real devices.
    const filament=[];pushBox(filament,0,0,-.24,.004,.004,.26,tint(col,.45));
    for(let i=0;i<filament.length;i+=6)result.push(...transform4(hand.ray||hand.matrix,filament.slice(i,i+3)),...filament.slice(i+3,i+6));
    for(let i=0;i<local.length;i+=6){
      result.push(...transform4(hand.matrix,local.slice(i,i+3)),...local.slice(i+3,i+6));
    }
  }
  return new Float32Array(result);
}
