// Real browser, real application host, synthetic tracked inputs. Never headset certification.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {buildPages} from './build-pages.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),output=resolve(root,'work/vr-warden-browser'),staticRoot=buildPages();
const server=createServer(async(req,res)=>{try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(path==='/favicon.ico'){res.writeHead(204);res.end();return;}
  const qa=['vr-living-path.mjs','vr-awakening-path.mjs','vr-warden-path.mjs'].find(name=>path==='/__qa__/'+name);
  const file=qa?resolve(root,'tests',qa):
    resolve(staticRoot,'.'+path.replace(/^\/SparkTheSubstrate/,''));
  if(!file.startsWith(staticRoot+'/')&&!qa)throw Error('Path');
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
  page=await browser.newPage({viewport:{width:1500,height:1100}});page.setDefaultTimeout(20000);
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
      const draw=gl.drawArrays.bind(gl),upload=gl.bufferData.bind(gl);
      gl.__metrics={drawCalls:0,vertices:0,uploadBytes:0,allocations:0};
      gl.drawArrays=(kind,start,count)=>{gl.__metrics.drawCalls++;gl.__metrics.vertices+=count;return draw(kind,start,count);};
      gl.bufferData=(target,data,usage)=>{gl.__metrics.uploadBytes+=typeof data==='number'?data:data.byteLength;return upload(target,data,usage);};
      for(const key of ['createBuffer','createTexture','createProgram']){const make=gl[key].bind(gl);gl[key]=(...a)=>{gl.__metrics.allocations++;return make(...a);};}
      return gl;
    };
  });
  await page.route('**/*',route=>{if(!route.request().url().startsWith(base+'/')){remote.push(route.request().url());return route.abort();}return route.continue();});
  await page.goto(base+'/SparkTheSubstrate/vr/living.html');
  await page.getByRole('button',{name:'Desktop 3D preview',exact:true}).click();
  await page.evaluate(async()=>{window.__app=await import('./spark-living-app.js');});
  await page.waitForFunction(()=>window.__app.runtime.input.motionArmed);
  await mkdir(output,{recursive:true});const canvas=page.locator('#world');
  const entry=await page.evaluate(async()=>{
    const app=window.__app,poses=await import('./spark-xr-preview.js'),path=await import('/__qa__/vr-awakening-path.mjs'),
      warden=await import('/__qa__/vr-warden-path.mjs'),helpers=await import('/__qa__/vr-living-path.mjs'),
      math=await import('./spark-vr-math.js'),runtime=await import('./spark-xr-runtime.js');
    const {runtime:r,host:h}=app;h.newJourney();r.stopDesktop();r.configure({movement:1,throwMode:'trigger',combatProfile:'classic'});r.pause(false);
    const d=path.awakeningDriver({runtime:r,host:h,poses});d.tick({});d.tick({});warden.reachWarden(d);
    const q=window.__warden={app,d,warden,helpers,metrics:[],frame:0,tally:{serial:0,casts:0,hits:0,damage:0}};
    q.note=()=>{for(const e of d.snapshot().combatEvents){if(e.id<=q.tally.serial)continue;q.tally.serial=e.id;
      if(e.room!=='eye')continue;if(e.type==='cast')q.tally.casts++;if(e.type==='hit'){q.tally.hits++;q.tally.damage+=e.damage||0;}}};
    q.fight=()=>{if(d.snapshot().phase==='dead')throw Error('Native Warden defeated the acceptance character');
      warden.wardenFightStep(d,q.frame++);q.note();};
    q.face=(pitch=-.22)=>{const s=d.snapshot(),g=s.guardians[0]||q.lastBoss||{x:480,y:210},p=s.player;
      q.lastBoss=g;d.view(Math.atan2(-(g.x-p.x),-(g.y-p.y)),pitch);};
    q.stereo=()=>{
      const last=d.last(),root=runtime.xrWorldRoot(last.scene,last.input),head=last.input.head,
        eye=[head[12],head[13],head[14]],forward=[-head[8],-head[9],-head[10]],projection=math.projection4(Math.PI/2.7,1,.04,25);
      r.canvas.width=1200;r.canvas.height=600;
      return [0,600].map((x,index)=>{const position=eye.map((value,i)=>value+head[i]*(index===0?-.032:.032)),
        inverse=math.lookAt4(position,position.map((value,i)=>value+forward[i]));
        return {viewport:{x,y:0,width:600,height:600},projection,inverse,matrix:math.multiply4(projection,math.multiply4(inverse,root))};});
    };
    q.benchmark=()=>{
      const quality=r.settings.quality;r.pause(true,'Warden wrist benchmark');
      for(const quality of ['performance','balanced','high']){
        r.configure({quality});d.tick({});const {scene,input}=d.last(),views=q.stereo(),gl=r.renderer.gl,samples=[];
        for(let i=0;i<9;i++){
          gl.__metrics={drawCalls:0,vertices:0,uploadBytes:0,allocations:0};const start=performance.now();
          r.renderer.render(views,scene,{hudPose:input.head,hands:input.hands,vignette:.4});
          if(i)samples.push({...gl.__metrics,submissionMs:performance.now()-start});
        }
        const times=samples.map(s=>s.submissionMs).sort((a,b)=>a-b);
        q.metrics.push({quality,twoEyes:2,wristVisible:true,activeEnemies:scene.enemies.length,
          enemyProjectiles:scene.shots.filter(s=>s.enemy).length,warningAngles:scene.guardians[0]?.angles.length,
          samples:samples.length,medianSubmissionMs:times[Math.floor(times.length/2)],p95SubmissionMs:times.at(-1),
          drawCalls:samples[0].drawCalls,verticesSubmitted:samples[0].vertices,geometryUploadBytes:samples[0].uploadBytes,
          newGPUObjects:samples.reduce((n,s)=>n+s.allocations,0),limit:'Software-WebGL CPU submission; not headset FPS or GPU timing'});
      }
      r.configure({quality});r.pause(false);d.tick({});d.tick({});
    };
    const s=d.snapshot();q.classicEntryHP=s.guardians[0].hp;
    d.profile('spellcraft');q.face(.45);d.tick({aim:d.snapshot().guardians[0].id});d.capture();
    return {room:s.roomId,bossHP:s.guardians[0].hp,maxHP:s.guardians[0].maxHp,level:s.level,playerHP:s.health,
      abilities:s.abilities,source:'Fresh native campaign; legal movement, powers, automatic combat and offered choices only'};
  });
  assert.equal(entry.room,'eye');assert.equal(entry.maxHP,1800);
  await canvas.screenshot({path:resolve(output,'warden-entry.png')});
  const first=await page.evaluate(()=>{
    const q=window.__warden,{d}=q;
    for(let i=0;i<3000;i++){
      const g=d.snapshot().guardians[0];if(g?.stage===1&&g.windup>.5&&g.angles.length===3){q.face(-.4);d.tick({aim:g.id});d.capture();
        const actual=d.snapshot().guardians[0];if(actual?.angles.length===3)return actual;}
      q.fight();
    }throw Error('No actual three-bolt preparation');
  });
  await canvas.screenshot({path:resolve(output,'warden-three-paths.png')});
  const summons=await page.evaluate(()=>{
    const q=window.__warden,{d}=q;
    for(let i=0;i<15000;i++){
      const s=d.snapshot(),g=s.guardians[0];if(g?.stage===2&&s.enemies.filter(e=>e.kind==='hound').length===2){
        q.face(-.3);d.tick({aim:g.id});d.capture();return {guardian:d.snapshot().guardians[0],hounds:d.snapshot().enemies.filter(e=>e.kind==='hound'),transition:d.snapshot().guardianVisual.transition};}
      q.fight();
    }throw Error('Native two-hound transition not observed');
  });
  assert.equal(summons.hounds.length,2);
  await canvas.screenshot({path:resolve(output,'warden-summons.png')});
  const second=await page.evaluate(()=>{
    const q=window.__warden,{d}=q;
    for(let i=0;i<3000;i++){
      const g=d.snapshot().guardians[0];if(g?.stage===2&&g.windup>.5&&g.angles.length===5){
        q.face(-.4);d.tick({aim:g.id});d.capture();const actual=d.snapshot().guardians[0];
        if(actual?.angles.length===5){q.stageVolley=actual.volleys;return actual;}}
      q.fight();
    }throw Error('No actual five-bolt preparation');
  });
  await canvas.screenshot({path:resolve(output,'warden-five-paths.png')});
  const stereo=await page.evaluate(()=>{
    const q=window.__warden,r=q.app.runtime;r.pause(true,'Warden wrist');q.face(0);q.d.tick({});const {scene,input}=q.d.last(),views=q.stereo(),gl=r.renderer.gl;
    r.renderer.render(views,scene,{hudPose:input.head,hands:input.hands,vignette:.4});
    const pixels=new Uint8Array(1200*600*4),eyes=[0,0];gl.readPixels(0,0,1200,600,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
    for(let i=0;i<1200*600;i++)if(pixels[i*4]+pixels[i*4+1]+pixels[i*4+2]>35)eyes[i%1200<600?0:1]++;
    return {eyes,error:gl.getError(),angles:scene.guardians[0].angles.length,separationMetres:.064,distinctViewMatrices:JSON.stringify([...views[0].matrix])!==JSON.stringify([...views[1].matrix])};
  });
  assert.equal(stereo.error,0);assert.equal(stereo.angles,5);assert.equal(stereo.distinctViewMatrices,true);assert.ok(stereo.eyes.every(n=>n>15000));
  await canvas.screenshot({path:resolve(output,'warden-stereo-wrist.png')});
  await page.evaluate(()=>window.__warden.benchmark());
  const volley=await page.evaluate(()=>{
    const q=window.__warden,{d}=q;
    for(let i=0;i<150;i++){
      q.fight();const s=d.snapshot(),g=s.guardians[0],shots=s.shots.filter(b=>b.enemy&&b.sourceKind==='warden');
      if(g?.volleys>q.stageVolley&&shots.length>=5){d.capture();return {volleys:g.volleys,stage:g.stage,hp:g.hp,shots:shots.map(b=>({vx:b.vx,vy:b.vy,damage:b.damage}))};}
    }throw Error('Native five-bolt release not observed');
  });
  assert.equal(volley.stage,2);assert.ok(volley.shots.every(b=>b.damage===16));
  await canvas.screenshot({path:resolve(output,'warden-five-bolts.png')});
  const victory=await page.evaluate(()=>{
    const q=window.__warden,{d,app}=q;
    for(let i=0;i<15000&&!d.snapshot().cleared;i++){q.lastBoss=d.snapshot().guardians[0]||q.lastBoss;q.fight();}
    const s=d.snapshot(),run=app.host.descent.state.run;
    if(!s.cleared||run.bossDefeated?.name!=='The Warden'||!run.seals.includes('stratum')||!run.earnedAbilities.includes('morph'))throw Error('Native Warden victory/rewards missing');
    if(q.tally.hits<8||q.tally.damage<500)throw Error('Native directed basics not demonstrated');
    q.face(.45);d.tick({});d.capture();
    return {boss:run.bossDefeated,seals:run.seals,abilities:run.earnedAbilities,essence:run.essence,phase:s.phase,
      hp:s.health,level:s.level,directed:q.tally,visual:d.snapshot().guardianVisual,source:'Real canonical defeat; no health or reward injection'};
  });
  await canvas.screenshot({path:resolve(output,'warden-victory.png')});
  // Voluntary synthetic head look at the actual Eye; gameplay stays paused by
  // its real reward choice. No forced camera motion exists in the application.
  await page.evaluate(()=>{const q=window.__warden,p=q.d.snapshot().player;
    q.d.view(Math.atan2(-(480-p.x),-(190-p.y)),Math.atan2(2.6,Math.hypot(480-p.x,190-p.y)/100));q.d.tick({});q.d.capture();});
  await canvas.screenshot({path:resolve(output,'eye-fracture.png')});
  const milestone=await page.evaluate(()=>{
    const q=window.__warden,{d,app}=q;
    while(d.snapshot().phase!=='milestone'){const choices=d.snapshot().choices;if(!choices.length)throw Error('No native reward choice');
      d.choose(choices.find(c=>c.id==='0')?.id||choices[0].id);}
    q.face(0);d.tick({});d.capture();app.host.save();q.milestoneRun=JSON.stringify(app.host.descent.state.run);
    return {choices:d.snapshot().choices,phase:d.snapshot().phase,eyeAcknowledged:app.host.descent.state.run.eyeAcknowledged??false};
  });
  assert.deepEqual(milestone.choices.map(c=>c.id),['continue','finish']);
  await canvas.screenshot({path:resolve(output,'eye-milestone.png')});
  const continuation=await page.evaluate(()=>{
    const q=window.__warden,{d,app,helpers}=q;d.choose('finish');const finish={phase:d.snapshot().phase,victory:d.snapshot().victory};
    app.host.restore();if(JSON.stringify(app.host.descent.state.run)!==q.milestoneRun)throw Error('Checkpoint changed native campaign');
    const restored=d.snapshot().guardianVisual;
    if(restored.kind!=='warden'||!restored.defeated||restored.victory!==0)throw Error('Paused milestone did not restore fractured Eye without replay');
    d.choose('continue');app.runtime.pause(false);d.tick({});d.tick({});helpers.crossGate(d,'east');
    if(d.snapshot().roomId!=='tide-harbor')throw Error('Continue did not open the next world');
    return {finish,restored:true,restoredEye:{kind:restored.kind,defeated:restored.defeated,replayedVictory:restored.victory>0},continue:{room:d.snapshot().roomId,seals:d.snapshot().seals},
      label:'Both choices exercised by branching the real saved milestone; no reward banking or duplication'};
  });
  assert.equal(continuation.finish.phase,'won');assert.equal(continuation.finish.victory,'eye');
  await page.getByRole('button',{name:'Return to hub / exit VR',exact:true}).click();
  await page.waitForFunction(()=>window.__app.runtime.mode==='idle');
  const cleanup=await page.evaluate(()=>({gpu:window.__gpuRecords,voices:window.__app.runtime.feedback.voices.size,metrics:window.__warden.metrics}));
  assert.equal(cleanup.voices,0);assert.ok(cleanup.gpu.every(c=>c.buffers===0&&c.textures===0&&c.programs===0));
  assert.ok(cleanup.metrics.every(m=>m.newGPUObjects===0&&m.drawCalls>0&&m.verticesSubmitted>0));
  assert.deepEqual(remote,[]);assert.deepEqual(errors,[]);
  const receipt={schema:'spark.xr.rung3.5.browser.v1',status:'PASS',browser:browser.version(),entry,first,summons,second,volley,victory,milestone,continuation,stereo,
    performance:cleanup.metrics,cleanup:{gpu:cleanup.gpu,voices:cleanup.voices},stagedPages:true,projectSubpath:'/SparkTheSubstrate/',remoteRequests:remote.length,browserErrors:errors.length,
    source:'Actual exported app/runtime, synthetic tracked poses, fresh native campaign route and legal inputs; no gameplay state injection',
    limitations:'Not a complete seven-world campaign. Quest 3 hardware, stereo comfort, tracking and performance NOT VERIFIED.'};
  await writeFile(resolve(output,'browser-results.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt,null,2));
}catch(error){
  await mkdir(output,{recursive:true});if(page){await page.screenshot({path:resolve(output,'failure.png'),fullPage:true}).catch(()=>{});
    console.error(await page.locator('#living-status').innerText().catch(()=>''),errors);
    console.error(await page.evaluate(()=>window.__app?{paused:window.__app.runtime.paused,reason:window.__app.runtime.pauseReason,scene:window.__app.host.descent.snapshot()}:{}).catch(()=>({})));}
  throw error;
}finally{await browser?.close();await new Promise(r=>server.close(r));}
