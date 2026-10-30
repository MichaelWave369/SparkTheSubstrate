// Real browser, real application host, synthetic tracked inputs. Never headset certification.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {buildPages} from './build-pages.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),output=resolve(root,'work/vr-reality-browser'),staticRoot=buildPages();
const server=createServer(async(req,res)=>{try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(path==='/favicon.ico'){res.writeHead(204);res.end();return;}
  const qa=['vr-living-path.mjs','vr-awakening-path.mjs','vr-reality-poses.mjs','vr-r35-hands.mjs'].find(name=>path==='/__qa__/'+name);
  const file=qa?resolve(root,'tests',qa==='vr-r35-hands.mjs'?'fixtures/'+qa:qa):
    resolve(staticRoot,'.'+path.replace(/^\/SparkTheSubstrate/,''));
  if(!file.startsWith(staticRoot+'/')&&!qa)throw Error('Path');
  let data=await readFile(file);if(qa)data=Buffer.from(data.toString().replaceAll('../../public/','/SparkTheSubstrate/').replaceAll('../public/','/SparkTheSubstrate/'));res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css'})[extname(file)]||'application/octet-stream'});res.end(data);
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
  await mkdir(output,{recursive:true});const routes=[];
  // These are real page buttons and real WebGL. Only the XR provider, frame
  // poses and layer are simulated; this never establishes Quest hardware success.
  for(const route of [
    {file:'index.html',module:'spark-vr-app.js',key:'sharedXR',button:'#enter-vr',status:'#status'},
    {file:'ascension.html',module:'spark-ascension-app.js',key:'runtime',button:'#enter-arena-vr',status:'#arena-status'},
    {file:'living.html',module:'spark-living-app.js',key:'runtime',button:'#living-vr',status:'#living-status'}]){
    await page.goto(base+'/SparkTheSubstrate/vr/'+route.file);
    await page.evaluate(async({module,key})=>{
      const app=await import('./'+module),r=app[key],poses=await import('/__qa__/vr-reality-poses.mjs'),math=await import('./spark-vr-math.js'),
        rendering=await import('./spark-vr-renderer.js');
      const q=window.__reality={app,r,poses,math,frames:0,requests:0,activations:[],sample:poses.questSample(),metrics:[]};
      class Session extends EventTarget{
        visibilityState='visible';inputSources=[];ended=false;next=null;space=new EventTarget();
        updateRenderState(){}requestReferenceSpace=async()=>this.space;
        requestAnimationFrame=fn=>{this.next=fn;return ++q.frames;};cancelAnimationFrame=()=>{this.next=null;};
        end=async()=>{this.ended=true;this.next=null;this.dispatchEvent(new Event('end'));};
      }
      q.provider=mode=>{r.getXR=()=>({requestSession:()=>{
        q.requests++;q.activations.push(navigator.userActivation?.isActive===true);
        if(mode==='reject')return Promise.reject(Object.assign(Error('Synthetic permission denied'),{name:'NotAllowedError'}));
        q.session=new Session();if(mode==='pending')return new Promise(resolve=>{q.resolve=resolve;});return Promise.resolve(q.session);
      }});};
      r.makeRenderer=c=>{const renderer=new rendering.SparkVRRenderer(c);renderer.gl.makeXRCompatible=async()=>{};return renderer;};
      r.makeLayer=()=>({framebuffer:null,getViewport:view=>({x:view.eye==='left'?0:600,y:0,width:600,height:600})});
      q.tick=(options={})=>{
        q.sample=poses.questSample(options);if(options.noRight)delete q.sample.hands.right;
        if(options.leftShift)q.sample.hands.left.grip[12]+=options.leftShift;
        if(options.height){const delta=options.height-1.65;q.sample.head[13]+=delta;for(const h of Object.values(q.sample.hands))for(const k of ['grip','ray'])if(h[k])h[k][13]+=delta;}
        const s=q.session;s.inputSources=Object.keys(q.sample.hands).map(handedness=>({handedness,
          gripSpace:{side:handedness,kind:'grip'},targetRaySpace:{side:handedness,kind:'ray'},
          gamepad:{mapping:'xr-standard',buttons:q.sample.hands[handedness].buttons,axes:q.sample.hands[handedness].axes}}));
        const views=poses.questViews(q.sample.head),frame={getViewerPose:()=>({transform:{matrix:q.sample.head},views:views.map((v,i)=>({eye:i?'right':'left',projectionMatrix:v.projection,transform:{inverse:{matrix:v.inverse}}}))}),
          getPose:space=>{const m=q.sample.hands[space.side]?.[space.kind];return m?{transform:{matrix:m}}:null;}};
        r.canvas.width=1200;r.canvas.height=600;const callback=s.next;s.next=null;if(callback)callback(++q.time*1000/72,frame);
        return r.lastInput;
      };
      q.time=0;q.powerCount=()=>r.adapter.id==='descent'?r.adapter.state.run.stats.powers:r.adapter.match.fighters[0].stats.specials;
      q.provider('reject');
    },route);
    await page.locator(route.button).click();await page.waitForFunction(()=>!window.__reality.r.pending);
    assert.match(await page.locator(route.status).innerText(),/Unable to enter VR/);assert.equal(await page.locator(route.button).isEnabled(),true);
    const denial=await page.evaluate(()=>({error:window.__reality.r.lastError,mode:window.__reality.r.mode}));assert.equal(denial.error,'PERMISSION_DENIED');assert.equal(denial.mode,'idle');
    await page.evaluate(()=>window.__reality.provider('pending'));await page.locator(route.button).click();
    assert.equal(await page.locator(route.button).isDisabled(),true);
    await page.evaluate(async()=>{const q=window.__reality;await q.r.exit();q.resolve(q.session);});
    await page.waitForFunction(()=>!window.__reality.r.pending);
    assert.equal(await page.evaluate(()=>window.__reality.r.session),null);
    await page.evaluate(()=>window.__reality.provider('success'));await page.locator(route.button).click();
    await page.waitForFunction(()=>window.__reality.r.mode==='xr');
    const launched=await page.evaluate(()=>{const q=window.__reality;q.tick();q.tick();q.tick();
      if(q.r.paused)throw Error('Neutral controllers did not initialize');const before=q.r.adapter.snapshot().player;
      for(let i=0;i<20;i++)q.tick({move:1});const after=q.r.adapter.snapshot().player;q.tick();q.tick({wrist:true});q.tick();
      return {mode:q.r.mode,adapter:q.r.adapter.id,before,after,controllers:q.r.reality.snapshot().controllers,page:q.r.panelPage,activations:q.activations,requestCount:q.requests};});
    assert.ok(launched.activations.every(Boolean),'requests occur from actual user-activation clicks');assert.equal(launched.requestCount,3);
    assert.notDeepEqual(launched.before,launched.after,'native movement responds after neutral startup');
    assert.ok(Object.values(launched.controllers).every(h=>h.grip&&h.ray));
    await page.locator('#world').screenshot({path:resolve(output,route.file.replace('.html','')+'-xr-wrist.png')});
    const interaction=await page.evaluate(()=>{
      const q=window.__reality,{r}=q,pages=['Combat'];for(let i=0;i<4;i++){q.tick({strafe:1});q.tick();pages.push(r.panelPage);}
      const before=q.powerCount();q.tick({wrist:true,rightTrigger:true});q.tick({rightTrigger:true});q.tick();q.tick();
      if(q.powerCount()!==before)throw Error('Menu close leaked an attack');
      q.tick({rightTrigger:true});q.tick({missingPose:true,rightTrigger:true});
      if(!r.paused||!r.lastInput.hands.left||r.lastInput.hands.right)throw Error('Missing pose did not pause/show remaining current hand');
      const x=r.lastInput.hands.left.matrix[12];q.tick({missingPose:true,leftShift:.02});const moved=r.lastInput.hands.left.matrix[12]-x;
      q.tick({noRight:true});return {pages,queuedAttacks:0,remainingHandDelta:moved,diagnostics:r.reality.snapshot()};
    });
    assert.deepEqual(interaction.pages,['Combat','Inventory','World','Comfort','Session']);assert.ok(interaction.remainingHandDelta>.019);
    assert.equal(interaction.diagnostics.state,'controller-disconnected');
    await page.locator('#world').screenshot({path:resolve(output,route.file.replace('.html','')+'-recovery.png')});
    const recovered=await page.evaluate(()=>{const q=window.__reality,r=q.r;r.recoverControls();q.tick({rightTrigger:true});q.tick();q.tick();q.tick();
      if(r.paused||r.lastInput.ready===false)throw Error('Legitimate recovery stuck');
      const before=q.powerCount();q.tick({rightTrigger:true});q.tick();for(let i=0;i<4;i++)q.tick();
      return {ready:r.lastInput.ready,powersBefore:before,powersAfter:q.powerCount(),report:r.reality.snapshot()};});
    assert.equal(recovered.ready,true);assert.equal(recovered.powersAfter,recovered.powersBefore+1);
    await page.locator('[data-calibrate]').click();
    const calibration=await page.evaluate(()=>{
      const q=window.__reality,r=q.r,before=JSON.stringify(r.adapter.id==='descent'?r.adapter.state.run:r.adapter.match);
      if(!r.calibrating||!r.paused)throw Error('Calibration button did not pause the running context');q.tick();
      for(let i=0;i<12;i++)q.tick();const unchanged=JSON.stringify(r.adapter.id==='descent'?r.adapter.state.run:r.adapter.match)===before;
      r.configureCalibration({grip:{left:{pitch:10,height:.02}},ray:{left:{yaw:5}},wristSide:'right'});q.tick();
      return {unchanged,page:r.lastInput&&r.calibrating,settings:r.calibration,report:r.reality.snapshot()};
    });
    assert.equal(calibration.unchanged,true);
    await page.locator('#world').screenshot({path:resolve(output,route.file.replace('.html','')+'-calibration.png')});
    const cacheReleased=await page.evaluate(async()=>{const q=window.__reality,{livingRoomGeometry}=await import('./spark-room-themes.js'),scene=q.r.adapter.snapshot(),mesh=scene.living?livingRoomGeometry(scene):null;
      await q.r.exit();return !mesh||livingRoomGeometry(scene)!==mesh;});
    assert.equal(cacheReleased,true);
    const cleanup=await page.evaluate(()=>({mode:window.__reality.r.mode,calibrating:window.__reality.r.calibrating,gpu:window.__gpuRecords,voices:window.__reality.r.feedback.voices.size}));
    assert.equal(cleanup.mode,'idle');assert.equal(cleanup.calibrating,false);assert.equal(cleanup.voices,0);assert.ok(cleanup.gpu.every(x=>!x.buffers&&!x.textures&&!x.programs));
    routes.push({path:route.file,denial,launched,interaction,recovered,calibration,cleanup:{...cleanup,cacheReleased}});
  }
  // Real page hub switch: it ends the old immersive session and asks for a new
  // gesture. It never pretends that a browser grants seamless session transfer.
  const hub=await page.evaluate(async()=>{const q=window.__reality,h=q.app.host,r=q.r;
    q.provider('success');await r.enter();q.tick();q.tick();const old=q.session,run=JSON.stringify(h.descent.state.run);
    await h.setMode('duel');const ended=old.ended&&r.mode==='idle',saved=JSON.stringify(h.descent.state.run)===run;
    return {ended,saved,mode:h.mode,status:h.notice};});
  assert.equal(hub.ended,true);assert.equal(hub.saved,true);assert.match(hub.status,/press Enter immersive VR again/);
  // New gesture is tested by clicking the actual page button after the switch.
  await page.locator('#living-vr').click();await page.waitForFunction(()=>window.__reality.r.mode==='xr');
  const arenaHub=await page.evaluate(()=>{const q=window.__reality;q.tick();q.tick();return {mode:q.app.host.mode,phase:q.r.adapter.match.phase};});assert.equal(arenaHub.mode,'duel');
  await page.evaluate(async()=>{await window.__reality.app.host.setMode('descent');});
  // Fresh native campaign screenshots and a frozen old-mesh comparison share
  // the same actual renderer and reference-space pose. No gameplay fixtures.
  await page.locator('#living-desktop').click();
  await page.evaluate(async()=>{
    const q=window.__reality,{r,app}=q;app.host.newJourney();r.stopDesktop();r.configure({movement:1,combatProfile:'classic'});r.configureCalibration({scale:1,grip:{left:{pitch:0,height:0},right:{pitch:0,height:0}},ray:{left:{yaw:0},right:{yaw:0}},wristSide:'left'});r.pause(false);
    const driver=await import('/__qa__/vr-awakening-path.mjs'),helpers=await import('/__qa__/vr-living-path.mjs'),poses=await import('./spark-xr-preview.js');
    q.d=driver.awakeningDriver({runtime:r,host:app.host,poses});q.helpers=helpers;q.d.tick({});q.d.tick({});q.d.view(.15,.1);q.d.capture();
    q.drawHands=mesh=>{const {scene,input}=q.d.last(),views=q.poses.questViews(input.head).map(v=>({...v,matrix:q.math.multiply4(v.projection,q.math.multiply4(v.inverse,(q.root||[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1])))}));
      // Use the real world transform, then draw only the selected original or new
      // hand mesh into the same GL buffer. This is a labeled geometry comparison.
      const gl=r.renderer.gl;r.renderer.render(views,scene,{hands:{}});gl.useProgram(r.renderer.program);gl.bindBuffer(gl.ARRAY_BUFFER,r.renderer.handVertices);gl.bufferData(gl.ARRAY_BUFFER,mesh,gl.DYNAMIC_DRAW);
      for(const [name,offset]of [['position',0],['color',12]]){const a=gl.getAttribLocation(r.renderer.program,name);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,3,gl.FLOAT,false,24,offset);}
      for(const v of views){gl.viewport(v.viewport.x,v.viewport.y,v.viewport.width,v.viewport.height);gl.uniformMatrix4fv(gl.getUniformLocation(r.renderer.program,'vp'),false,q.math.multiply4(v.projection,v.inverse));gl.drawArrays(gl.TRIANGLES,0,mesh.length/6);}
    };
  });
  await page.locator('#world').screenshot({path:resolve(output,'threshold-after.png')});
  await page.evaluate(async()=>{const q=window.__reality,rt=await import('./spark-xr-runtime.js'),before=await import('/__qa__/vr-r35-hands.mjs');q.r.canvas.width=1200;q.r.canvas.height=600;q.root=rt.xrWorldRoot(q.d.last().scene,q.d.last().input);q.drawHands(before.baselineHandVertices(q.d.last().input.hands));});
  await page.locator('#world').screenshot({path:resolve(output,'hands-before-same-pose.png')});
  await page.evaluate(async()=>{const q=window.__reality,m=await import('./spark-vr-renderer.js');q.drawHands(m.makeTrackedHandVertices(q.d.last().input.hands));});
  await page.locator('#world').screenshot({path:resolve(output,'hands-after-same-pose.png')});
  const native=await page.evaluate(()=>{const q=window.__reality,{d,helpers}=q;helpers.walk(d,480,115);d.tick({interact:true});d.tick({});
    for(let i=0;i<100;i++)d.tick({});const s=d.snapshot(),p=s.player,e=s.enemies[0];if(e)d.view(Math.atan2(-(e.x-p.x),-(e.y-p.y)),-.1);d.capture();return {room:s.roomId,enemies:s.enemies.map(e=>e.kind),hp:s.health};});
  assert.equal(native.room,'glass');assert.ok(native.enemies.length);
  await page.locator('#world').screenshot({path:resolve(output,'glass-combat-after.png')});
  await page.evaluate(()=>{const q=window.__reality,{d,helpers}=q;helpers.clearEncounter(d);helpers.crossGate(d,'east');d.view(-.9,.15);d.capture();});
  await page.locator('#world').screenshot({path:resolve(output,'machine-after.png')});
  const performanceReceipt=await page.evaluate(async()=>{
    const q=window.__reality,r=q.r;r.pause(true,'Software performance sample');q.d.tick({});const data=[];
    const {xrWorldRoot}=await import('./spark-xr-runtime.js');
    for(const quality of ['performance','balanced','high']){r.configure({quality});q.d.tick({});const {scene,input}=q.d.last(),rtRoot=xrWorldRoot(scene,input);
      const views=q.poses.questViews(input.head).map(v=>({...v,matrix:q.math.multiply4(v.projection,q.math.multiply4(v.inverse,rtRoot))})),gl=r.renderer.gl,samples=[];
      for(let i=0;i<9;i++){gl.__metrics={drawCalls:0,vertices:0,uploadBytes:0,allocations:0};const start=performance.now();r.renderer.render(views,scene,{hudPose:input.head,hands:input.hands,vignette:.4});if(i)samples.push({...gl.__metrics,cpuMs:performance.now()-start});}
      const times=samples.map(x=>x.cpuMs).sort((a,b)=>a-b);data.push({quality,room:scene.roomId,twoEyes:true,medianCpuMs:times[4],p95CpuMs:times.at(-1),...samples[0],limit:'Software CPU submission, not Quest FPS, GPU time or sustained thermal evidence'});
    }return data;
  });
  assert.ok(performanceReceipt.every(x=>x.allocations===0));
  await page.evaluate(async()=>{await window.__reality.r.exit();});
  const final=await page.evaluate(()=>({gpu:window.__gpuRecords,voices:window.__reality.r.feedback.voices.size}));assert.ok(final.gpu.every(x=>!x.buffers&&!x.textures&&!x.programs));assert.equal(final.voices,0);
  assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
  const result={schema:'spark.xr.reality.browser.v1',status:'PASS',browser:browser.version(),stagedPages:true,projectSubpath:'/SparkTheSubstrate/',routes,hub,arenaHub,native,performance:performanceReceipt,cleanup:final,
    browserErrors:errors.length,remoteRequests:remote.length,source:'Actual DOM entry buttons, app/runtime and software-WebGL renderer. Simulated XR provider/layer and current tracked Quest-like poses; no native hardware session.',
    comparison:'Frozen Rung 3.5 hand mesh and new mesh in the same pose/current stage; baseline room captures in docs/vr-reality/before use the actual unmodified merged main.',
    hardware:'Quest 3 retest NOT PERFORMED. Reported third failing route is unidentified; software tests cannot identify which original hardware entry failed.'};
  await writeFile(resolve(output,'browser-results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
}catch(error){await mkdir(output,{recursive:true});if(page){await page.screenshot({path:resolve(output,'failure.png'),fullPage:true}).catch(()=>{});console.error(errors);console.error(await page.evaluate(()=>window.__reality?{mode:window.__reality.r.mode,paused:window.__reality.r.paused,reason:window.__reality.r.pauseReason,state:window.__reality.r.reality.snapshot()}:{}).catch(()=>({})));}throw error;
}finally{await browser?.close();await new Promise(r=>server.close(r));}
