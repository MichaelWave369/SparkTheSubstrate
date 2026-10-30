// Actual staged application/WebGL. Controlled native room fixtures; no headset.
import assert from 'node:assert/strict';import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),baseline=!!process.env.SPARK_WORLD_BASELINE_ROOT,
 sourceRoot=baseline?resolve(process.env.SPARK_WORLD_BASELINE_ROOT):root,output=resolve(root,'work/vr-worlds-browser',baseline?'before':'after'),
 {buildPages}=await import(pathToFileURL(resolve(sourceRoot,'scripts/build-pages.mjs')).href),staticRoot=buildPages();
const server=createServer(async(req,res)=>{try{
 const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(path==='/favicon.ico'){res.writeHead(204);res.end();return;}
 const qa=['vr-worlds-fixtures.mjs','vr-reality-poses.mjs'].find(n=>path==='/__qa__/'+n),file=qa?resolve(root,'tests',qa):resolve(staticRoot,'.'+path.replace(/^\/SparkTheSubstrate/,''));
 if(!file.startsWith(staticRoot+'/')&&!qa)throw Error('Path');let data=await readFile(file);
 if(qa)data=Buffer.from(data.toString().replaceAll('../public/','/SparkTheSubstrate/'));
 res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css'})[extname(file)]||'application/octet-stream'});res.end(data);
 }catch{res.writeHead(404);res.end('Not found');}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
const {chromium}=await import(process.env.SPARK_PLAYWRIGHT_MODULE?pathToFileURL(process.env.SPARK_PLAYWRIGHT_MODULE).href:'playwright');
let browser,page;const errors=[],remote=[];
try{
 const executablePath=process.env.SPARK_CHROMIUM_PATH;
 browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{}),env:{...process.env,...(executablePath?{LD_LIBRARY_PATH:dirname(executablePath)}:{})},
  args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 page=await browser.newPage({viewport:{width:1440,height:1100}});page.setDefaultTimeout(20000);
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await page.route('**/*',route=>{if(!route.request().url().startsWith(base+'/')){remote.push(route.request().url());return route.abort();}return route.continue();});
 await page.addInitScript(()=>{
  window.__gpu=[];const original=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type,...args){const gl=original.call(this,type,...args);if(!gl||!['webgl','webgl2'].includes(type)||gl.__tracked)return gl;
   gl.__tracked=true;const counts={buffers:0,textures:0,programs:0};window.__gpu.push(counts);
   gl.__metrics={vertices:0,drawCalls:0,uploadBytes:0,allocations:0};
   for(const [create,remove,key]of [['createBuffer','deleteBuffer','buffers'],['createTexture','deleteTexture','textures'],['createProgram','deleteProgram','programs']]){
    const make=gl[create].bind(gl),drop=gl[remove].bind(gl),live=new Set();gl[create]=(...a)=>{const p=make(...a);if(p){live.add(p);counts[key]++;gl.__metrics.allocations++;}return p;};gl[remove]=p=>{if(live.delete(p))counts[key]--;return drop(p);};
   }
   const draw=gl.drawArrays.bind(gl),upload=gl.bufferData.bind(gl);gl.drawArrays=(m,s,c)=>{gl.__metrics.vertices+=c;gl.__metrics.drawCalls++;return draw(m,s,c);};gl.bufferData=(t,d,u)=>{gl.__metrics.uploadBytes+=typeof d==='number'?d:d.byteLength;return upload(t,d,u);};return gl;
  };
 });
 await mkdir(output,{recursive:true});await page.goto(base+'/SparkTheSubstrate/vr/living.html');await page.getByRole('button',{name:'Desktop 3D preview',exact:true}).click();
 await page.evaluate(async()=>{const app=await import('./spark-living-app.js');window.__worlds={app,r:app.runtime};});
 await page.waitForFunction(()=>window.__worlds.r.lastInput?.valid);
 await page.evaluate(async()=>{
  const q=window.__worlds;q.r.stopDesktop();q.fixtures=await import('/__qa__/vr-worlds-fixtures.mjs');q.poses=await import('/__qa__/vr-reality-poses.mjs');q.math=await import('./spark-vr-math.js');q.runtime=await import('./spark-xr-runtime.js');q.themes=await import('./spark-room-themes.js');q.now=0;q.yaw=0;q.pitch=.12;
  q.tick=(options={})=>{q.now+=1000/60;q.last=q.r.advance(q.now,q.poses.questSample({yaw:q.yaw,pitch:q.pitch,...options}));return q.last;};
  q.look=(yaw,pitch)=>{const d=Math.atan2(Math.sin(yaw-q.yaw),Math.cos(yaw-q.yaw)),dp=pitch-q.pitch,n=Math.max(1,Math.ceil(Math.max(Math.abs(d)/.1,Math.abs(dp)/.04)));
   for(let i=0;i<n;i++){q.yaw+=d/n;q.pitch+=dp/n;q.tick();}
  };
  q.setup=(room,seed=369)=>{q.fixtures.worldVisualFixture(q.r,room,seed);q.now=0;q.yaw=0;q.pitch=.1;q.tick();q.tick();q.look(-.45,.12);};
  q.draw=(stereo=false)=>{const {scene,input}=q.last,r=q.r,head=input.head,root=q.runtime.xrWorldRoot(scene,input);
   r.canvas.width=stereo?1200:1200;r.canvas.height=stereo?600:800;
   const eye=[head[12],head[13],head[14]],views=stereo?q.poses.questViews(head):[{projection:q.math.projection4(Math.PI/2.5,1.5,.04,32),inverse:q.math.lookAt4(eye,eye.map((v,i)=>v-head[8+i])),viewport:{x:0,y:0,width:1200,height:800}}];
   for(const v of views)v.matrix=q.math.multiply4(v.projection,q.math.multiply4(v.inverse,root));
   r.renderer.render(views,scene,{hands:input.hands,hudPose:head,vignette:0,reduced:r.settings.reduced});return {vertices:q.themes.livingRoomGeometry(scene).length/6,...r.renderer.gl.__metrics};
  };
 });
 const worlds=[],performance=[];
 const rooms=await page.evaluate(()=>window.__worlds.fixtures.WORLD_VISUAL_ROOMS);
 for(const [world,room]of Object.entries(rooms)){
  const receipt=await page.evaluate(({room})=>{const q=window.__worlds;q.setup(room);for(let i=0;i<75;i++)q.tick();q.draw();return {room,world:q.last.scene.worldId,name:q.last.scene.roomName,enemies:q.last.scene.enemies.map(e=>e.kind),phase:q.last.scene.phase,paused:q.r.paused,valid:q.last.input.valid};},{room});
  assert.equal(receipt.world,world);assert.equal(receipt.phase,'playing');assert.equal(receipt.paused,false);assert.equal(receipt.valid,true);worlds.push(receipt);
  if(!baseline||world==='stratum')await page.locator('#world').screenshot({path:resolve(output,'world-'+world+'.png')});
  for(const quality of ['performance','balanced','high']){
   const sample=await page.evaluate(quality=>{const q=window.__worlds;q.r.configure({quality});q.r.pause(false);q.tick();q.tick();q.draw(true);const gl=q.r.renderer.gl,times=[],metrics=[];
    for(let i=0;i<6;i++){gl.__metrics={vertices:0,drawCalls:0,uploadBytes:0,allocations:0};const t=performance.now();q.draw(true);times.push(performance.now()-t);metrics.push({...gl.__metrics});}
    times.sort((a,b)=>a-b);return {quality,room:q.last.scene.roomId,world:q.last.scene.worldId,staticVertices:q.themes.livingRoomGeometry(q.last.scene).length/6,medianCpuMs:times[3],maxCpuMs:times.at(-1),...metrics[0]};},quality);
   assert.ok(sample.staticVertices<=30000);assert.equal(sample.allocations,0);performance.push(sample);
  }
 }
 const enemies=[];
 const enemyRooms=await page.evaluate(()=>window.__worlds.fixtures.ENEMY_VISUAL_ROOMS);
 for(const [kind,room]of Object.entries(enemyRooms)){
  const receipt=await page.evaluate(({kind,room})=>{const q=window.__worlds;let selected=null,atSeed;
   for(let seed=369;seed<389&&!selected;seed++){
    q.setup(room,seed);for(let i=0;i<260;i++){
     q.tick();const s=q.last.scene,p=s.player;if(s.phase!=='playing')break;
     const e=s.enemies.find(e=>e.kind===kind&&Math.hypot(e.x-p.x,e.y-p.y)>105&&Math.hypot(e.x-p.x,e.y-p.y)<380&&(!['hound','archon','leech'].includes(kind)||e.windup>0));
     if(e){selected={...e};atSeed=seed;break;}
    }
   }
   if(!selected)throw Error('No native '+kind+' observation');const s=q.last.scene,p=s.player;
   q.look(Math.atan2(-(selected.x-p.x),-(selected.y-p.y))+(q.r.input.yaw||0),-.11);q.draw();
   return {kind,room,seed:atSeed,observed:q.last.scene.enemies.find(e=>e.id===selected.id),phase:q.last.scene.phase,paused:q.r.paused,valid:q.last.input.valid,health:q.last.scene.health,time:q.last.scene.time,policy:'Controlled room fixture; enemy spawned and reached this activity through native simulation, never an injected model target'};
  },{kind,room});enemies.push(receipt);assert.equal(receipt.phase,'playing');assert.equal(receipt.paused,false,kind+' capture paused');assert.equal(receipt.valid,true);
  await page.locator('#world').screenshot({path:resolve(output,'enemy-'+kind+'.png')});
 }
 const stereo=await page.evaluate(()=>{const q=window.__worlds;q.setup('tide-archive');for(let i=0;i<60;i++)q.tick();q.r.pause(true,'Stereo wrist fixture');q.tick();q.draw(true);
  const gl=q.r.renderer.gl,counts=[];for(const x of [0,600]){const p=new Uint8Array(600*600*4);gl.readPixels(x,0,600,600,gl.RGBA,gl.UNSIGNED_BYTE,p);let bright=0;for(let i=0;i<p.length;i+=4)if(p[i]+p[i+1]+p[i+2]>60)bright++;counts.push(bright);}return {bothEyes:counts,controllers:Object.keys(q.last.input.hands)};});
 assert.ok(stereo.bothEyes.every(n=>n>15000));assert.equal(stereo.controllers.length,2);
 if(!baseline)await page.locator('#world').screenshot({path:resolve(output,'world-stereo-wrist.png')});
 let lesson=null;
 if(!baseline){
  const before=await page.evaluate(()=>JSON.stringify(window.__worlds.r.adapter.state.run));
  await page.locator('#spellcraft-lesson summary').click();await page.locator('[data-lesson-profile="spellcraft"]').click();
  const selected=await page.evaluate(()=>window.__worlds.r.settings.combatProfile);assert.equal(selected,'spellcraft');
  await page.locator('[data-lesson-profile="classic"]').click();
  lesson=await page.evaluate(()=>({profile:window.__worlds.r.settings.combatProfile,run:JSON.stringify(window.__worlds.r.adapter.state.run),open:document.querySelector('#spellcraft-lesson').open}));
  assert.equal(lesson.profile,'classic');assert.equal(lesson.run,before);assert.equal(lesson.open,true);delete lesson.run;lesson.progressChanged=false;
  await page.locator('#spellcraft-lesson').screenshot({path:resolve(output,'spellcraft-lesson.png')});
 }
 const cleanup=await page.evaluate(async()=>{const q=window.__worlds;await q.r.exit();return {gpu:window.__gpu,voices:q.r.feedback.voices.size,mode:q.r.mode};});
 assert.ok(cleanup.gpu.every(x=>!x.buffers&&!x.textures&&!x.programs));assert.equal(cleanup.voices,0);assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
 const receipt={schema:'spark.xr.worlds.browser.v1',status:'PASS',baseline,browser:browser.version(),worlds,enemies,performance,stereo,lesson,cleanup,browserErrors:errors.length,remoteRequests:remote.length,
  limitations:'Actual staged app and software-WebGL with synthetic controller/eye poses; direct room fixtures, native enemy simulation. No natural seven-world campaign, physical Quest acceptance, GPU timing or headset FPS claim.'};
 await writeFile(resolve(output,'browser-results.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt,null,2));
}catch(error){await mkdir(output,{recursive:true});if(page)await page.screenshot({path:resolve(output,'failure.png'),fullPage:true}).catch(()=>{});console.error(errors);throw error;}
finally{await browser?.close();await new Promise(r=>server.close(r));}
