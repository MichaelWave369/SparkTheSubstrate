export async function saveRunCard(record,names,document,window){
 if(!record)throw Error('Finish a life to save a run card.');
 const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1080;const ctx=canvas.getContext('2d');
 const gradient=ctx.createLinearGradient(0,0,1080,1080);gradient.addColorStop(0,'#112720');gradient.addColorStop(1,'#0c1118');ctx.fillStyle=gradient;ctx.fillRect(0,0,1080,1080);ctx.strokeStyle='#c9a66b';ctx.lineWidth=2;ctx.strokeRect(40,40,1000,1000);
 const text=(value,x,y,size=28,color='#c4d4ca')=>{ctx.font='500 '+size+'px system-ui, sans-serif';ctx.fillStyle=color;ctx.textAlign='left';ctx.fillText(value,x,y);};
 const wrap=(value,y,size=25)=>{ctx.font='500 '+size+'px system-ui, sans-serif';let line='';for(const word of value.split(' ')){const next=line?line+' '+word:word;if(ctx.measureText(next).width>880&&line){text(line,88,y,size);y+=38;line=word;}else line=next;}if(line){text(line,88,y,size);y+=38;}return y;};
 text('SPARK / THE SUBSTRATE',88,125,24,'#d9b77d');text(record.won?record.ending:'The spark remembers.',88,206,54,'#f0cd94');text((names[record.form]?.name??record.form)+' · LEVEL '+record.level,88,259,27);text(record.daily?'DAILY CURRENT · '+record.daily.day+' UTC':'INCARNATION · KARMA '+record.karma,88,301,22,'#99c6ba');
 const cells=[[record.chambers,'COMBAT CHAMBERS'],[record.kills,'CONSTRUCTS'],[record.damageDealt.toLocaleString(),'DAMAGE DEALT'],[Math.floor(record.seconds/60)+':'+String(record.seconds%60).padStart(2,'0'),'TIME']];
 cells.forEach(([value,label],i)=>{const x=88+i%2*465,y=410+Math.floor(i/2)*140;text(String(value),x,y,64,'#e5c78f');text(label,x,y+42,21,'#9ec7b9');});
 let y=wrap(record.equipment.join(' · ')||'Native vessel weapon',708);y=wrap(record.gifts.map(gift=>(names[gift.id]?.name??gift.id)+' ×'+gift.count).join(' · ')||'No battle gifts',y+10,23);text('SEED '+record.seed,88,940,19,'#8bafa3');text('spark-substrate.microneesia79.chatgpt.site',88,982,19,'#8bafa3');
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('This browser could not create the run image.');const url=window.URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='spark-run-'+(record.daily?.day??record.seed)+'.png';link.click();window.setTimeout(()=>window.URL.revokeObjectURL(url),1000);
}
