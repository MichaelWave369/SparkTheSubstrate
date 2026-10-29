// Real browser, real application host, synthetic tracked inputs. Never headset certification.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),output=resolve(root,'work/vr-living-browser');
const server=createServer(async(req,res)=>{try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(path==='/favicon.ico'){res.writeHead(204);res.end();return;}
  const file=path==='/__qa__/vr-living-path.mjs'?resolve(root,'tests/vr-living-path.mjs'):
    resolve(root,'public','.'+path.replace(/^\/SparkTheSubstrate/,''));
  if(!file.startsWith(root+'/public/')&&!file.endsWith('/tests/vr-living-path.mjs'))throw Error('Path');
  const data=await readFile(file);res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css'})[extname(file)]||'application/octet-stream'});res.end(data);
}catch{res.writeHead(404);res.end('Not found');}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
const tool=process.env.SPARK_PLAYWRIGHT_MODULE,{chromium}=await import(tool?pathToFileURL(tool).href:'playwright');
let browser,page;
const errors=[],remote=[];
try{
  const executablePath=process.env.SPARK_CHROMIUM_PATH;
  browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{}),
    env:{...process.env,...(executablePath?{LD_LIBRARY_PATH:dirname(executablePath)}:{})},
    args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  page=await browser.newPage({viewport:{width:1500,height:1100}});page.setDefaultTimeout(12000);
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.addInitScript(()=>{
    window.__gpuRecords=[];const get=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(kind,...args){
      const gl=get.call(this,kind,...args);if(!gl||!['webgl','webgl2'].includes(kind)||gl.__qaTracked)return gl;
      gl.__qaTracked=true;const counts={buffers:0,textures:0,programs:0};window.__gpuRecords.push(counts);
      for(const [create,remove,key]of [['createBuffer','deleteBuffer','buffers'],['createTexture','deleteTexture','textures'],['createProgram','deleteProgram','programs']]){
        const allocate=gl[create].bind(gl),free=gl[remove].bind(gl),live=new Set();
        gl[create]=(...a)=>{const value=allocate(...a);if(value){live.add(value);counts[key]++;}return value;};
        gl[remove]=value=>{if(live.delete(value))counts[key]--;return free(value);};
      }
      return gl;
    };
  });
  await page.route('**/*',route=>{if(!route.request().url().startsWith(base+'/')){remote.push(route.request().url());return route.abort();}return route.continue();});
  await page.goto(base+'/SparkTheSubstrate/vr/living.html');
  await page.getByRole('button',{name:'Desktop 3D preview',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#intro-overlay').hidden);
  const canvas=page.locator('#world');await canvas.focus();
  const before=await page.evaluate(async()=>(await import('./spark-living-app.js')).host.descent.snapshot().player.y);
  await page.keyboard.down('KeyW');await page.waitForTimeout(250);await page.keyboard.up('KeyW');
  const moved=await page.evaluate(async()=>(await import('./spark-living-app.js')).host.descent.snapshot().player.y);
  assert.ok(moved<before,'actual keyboard moves through the shared runtime');
  await page.keyboard.down('Tab');await page.waitForTimeout(150);await page.keyboard.up('Tab');
  assert.equal(await page.evaluate(async()=>(await import('./spark-living-app.js')).runtime.paused),true);
  await mkdir(output,{recursive:true});await canvas.screenshot({path:resolve(output,'wrist.png')});
  // Drive the actual exported app instance. Only inputs, genuine choices, explicit
  // save/restore and original new-journey actions are used; no combat-state mutation.
  await page.evaluate(async()=>{
    const app=await import('./spark-living-app.js'),poses=await import('./spark-xr-preview.js'),helpers=await import('/__qa__/vr-living-path.mjs');
    const {runtime:r,host:h}=app;h.newJourney();r.stopDesktop();r.configure({movement:1});r.pause(false);
    let now=0,last,viewYaw=0,viewPitch=0;
    const d={snapshot:()=>h.descent.snapshot(),tick:i=>{now+=1000/60;
      const c=Math.cos(viewYaw),s=Math.sin(viewYaw),x=i.x||0,y=i.y||0;
      last=r.advance(now,poses.desktopXRSample({yaw:viewYaw,pitch:viewPitch,move:-(s*x+c*y),strafe:c*x-s*y,dash:!!i.dash,interact:!!i.interact,rightTrigger:!!i.power}));},
      choose:id=>{h.choose(id);d.tick({});}};
    d.tick({});d.tick({});
    window.__livingQA={app,d,helpers,view:(yaw,pitch)=>{viewYaw=yaw;viewPitch=pitch;},capture:()=>{d.tick({});r.drawPreview(last);}};
    window.__livingQA.view(.15,.1);window.__livingQA.capture();
  });
  await canvas.screenshot({path:resolve(output,'threshold.png')});
  await page.evaluate(()=>{const q=window.__livingQA;q.helpers.walk(q.d,480,115);q.d.tick({interact:true});q.d.tick({});q.view(-.32,.12);q.capture();});
  assert.equal(await page.evaluate(()=>window.__livingQA.d.snapshot().roomId),'glass');
  await canvas.screenshot({path:resolve(output,'glass.png')});
  const pathReceipt=await page.evaluate(()=>{
    const q=window.__livingQA,{d,helpers,app}=q;helpers.clearEncounter(d);
    const s=d.snapshot(),glass={health:s.health,level:s.level,karma:s.karma,essence:s.essence,cleared:s.cleared,
      kills:app.host.descent.state.run.kills,damage:app.host.descent.state.run.stats.damageDealt};
    helpers.walk(d,480,300);helpers.walk(d,840,270);helpers.walk(d,870,300);d.tick({interact:true});d.tick({});
    app.host.save();const saved=JSON.stringify(app.host.descent.state.run);app.host.restore();
    const restored=JSON.stringify(app.host.descent.state.run)===saved,priorTime=app.host.descent.state.run.time;
    app.runtime.pause(false);d.tick({});d.tick({x:.2});q.view(-.9,.15);q.capture();
    return {glass,restored,continued:app.host.descent.state.run.time>priorTime,room:d.snapshot().roomId};
  });
  assert.equal(pathReceipt.room,'machine');assert.equal(pathReceipt.restored,true);assert.equal(pathReceipt.continued,true);
  assert.ok(pathReceipt.glass.kills>=14&&pathReceipt.glass.damage>0&&pathReceipt.glass.essence>0&&pathReceipt.glass.level>1);
  await canvas.screenshot({path:resolve(output,'machine.png')});
  const transform=await page.evaluate(()=>{
    const {d,helpers,app,capture}=window.__livingQA;
    const earned=helpers.earnResonanceFromMachine(d);
    if(!app.host.descent.state.run.earnedAbilities.includes('morph'))throw Error('No earned resonance.');
    app.host.descent.morph('tree');window.__livingQA.view(0,.05);capture();
    return {form:d.snapshot().form,cooldown:d.snapshot().morphCooldown,earned,
      source:'Fresh campaign: native encounters, earned Ivory key, legal gates and cleared Mirror Nursery; no state/HP/reward injection'};
  });
  assert.equal(transform.form,'tree');assert.ok(transform.cooldown>0);
  await canvas.screenshot({path:resolve(output,'tree-transformation.png')});
  const vesselEvidence=[];
  for(const form of ['human','computer','animal','rock','spark']){
    const observed=await page.evaluate(form=>{
      const q=window.__livingQA;
      for(let i=0;i<182;i++)q.d.tick({});
      q.app.host.descent.morph(form);q.capture();
      return {form:q.d.snapshot().form,cooldown:q.d.snapshot().morphCooldown};
    },form);
    assert.equal(observed.form,form);assert.ok(observed.cooldown>0);vesselEvidence.push(observed);
    await canvas.screenshot({path:resolve(output,'vessel-'+form+'.png')});
  }
  const stereo=await page.evaluate(async()=>{
    const q=window.__livingQA,r=q.app.runtime,p=(await import('./spark-xr-preview.js')).desktopXRSample();
    const {projection4,lookAt4}=await import('./spark-vr-math.js');
    const inverse=lookAt4([0,1.65,0],[0,1.65,-1]),projection=projection4(Math.PI/2.7,1,.04,25);
    r.canvas.width=1200;r.canvas.height=600;
    r.input.recenter();const result=r.advance(100000,p);r.pause(true,'Stereo wrist acceptance');
    const second=r.advance(100016,p),root=(await import('./spark-xr-runtime.js')).xrWorldRoot(second.scene,second.input);
    const {multiply4}=await import('./spark-vr-math.js');
    r.renderer.render([0,600].map(x=>({viewport:{x,y:0,width:600,height:600},projection,inverse,
      matrix:multiply4(projection,multiply4(inverse,root))})),second.scene,{hudPose:p.head,hands:second.input.hands,vignette:.4});
    const gl=r.renderer.gl,pixels=new Uint8Array(1200*600*4),eyes=[0,0];gl.readPixels(0,0,1200,600,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
    for(let i=0;i<1200*600;i++)if(pixels[i*4]+pixels[i*4+1]+pixels[i*4+2]>35)eyes[i%1200<600?0:1]++;
    return {eyes,error:gl.getError()};
  });
  assert.equal(stereo.error,0);assert.ok(stereo.eyes.every(n=>n>15000));
  await page.getByRole('button',{name:/THE ARENA/}).click();
  await page.waitForFunction(()=>document.querySelector('#mode-duel').getAttribute('aria-pressed')==='true');
  assert.equal(await page.evaluate(async()=>(await import('./spark-living-app.js')).runtime.mode),'idle');
  await page.getByRole('button',{name:'Desktop 3D preview',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#living-facts').textContent.includes('Threshold of Ascension'));
  await page.getByRole('button',{name:/DESCENT/}).click();
  await page.waitForFunction(()=>document.querySelector('#mode-descent').getAttribute('aria-pressed')==='true');
  const cleanup=await page.evaluate(async()=>({gpu:window.__gpuRecords,
    voices:(await import('./spark-living-app.js')).runtime.feedback.voices.size}));
  assert.equal(cleanup.voices,0);assert.ok(cleanup.gpu.every(c=>c.buffers===0&&c.textures===0&&c.programs===0));
  assert.deepEqual(remote,[]);assert.deepEqual(errors,[]);
  const receipt={status:'PASS',browser:browser.version(),path:pathReceipt,transformation:transform,vesselEvidence,stereo,cleanup,
    remoteRequests:remote.length,browserErrors:errors.length,checks:['actual desktop keyboard','wrist capture','fresh canonical Threshold→Glass→Machine',
      'real combat/rewards/choices','save/restore/continue','three real room screenshots','legitimately earned Tree transformation',
      'both-eye retained geometry','clean mode exit/relaunch','project subpath imports','no remote requests'],
    hardwareVerification:'NOT PERFORMED; Chromium with software WebGL and synthetic poses'};
  await writeFile(resolve(output,'browser-results.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt,null,2));
}catch(error){
  await mkdir(output,{recursive:true});if(page){await page.screenshot({path:resolve(output,'failure.png'),fullPage:true}).catch(()=>{});
    console.error(await page.locator('#living-status').innerText().catch(()=>''),errors);}
  throw error;
}finally{await browser?.close();await new Promise(r=>server.close(r));}
