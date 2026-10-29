// Real browser, real application host, synthetic tracked inputs. Never headset certification.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),output=resolve(root,'work/vr-awakening-browser');
const server=createServer(async(req,res)=>{try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(path==='/favicon.ico'){res.writeHead(204);res.end();return;}
  const qa=['vr-living-path.mjs','vr-awakening-path.mjs'].find(name=>path==='/__qa__/'+name);
  const file=qa?resolve(root,'tests',qa):
    resolve(root,'public','.'+path.replace(/^\/SparkTheSubstrate/,''));
  if(!file.startsWith(root+'/public/')&&!qa)throw Error('Path');
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
  await page.waitForFunction(()=>window.__app.runtime.input.motionArmed===true);
  // Exercise the real form control, pause capture and keyboard casting first.
  await page.locator('#living-combatProfile').selectOption('spellcraft');
  assert.equal(await page.evaluate(()=>window.__app.runtime.paused),true);
  const canvas=page.locator('#world');await canvas.focus();
  await page.keyboard.down('Tab');await page.waitForFunction(()=>!window.__app.runtime.paused);await page.keyboard.up('Tab');
  await page.waitForFunction(()=>window.__app.runtime.input.motionArmed);
  await page.waitForFunction(()=>window.__app.host.descent.snapshot().attackCooldown<=0);
  await page.keyboard.down('KeyF');await page.waitForFunction(()=>window.__app.runtime.input.triggers.right.down);
  await page.keyboard.up('KeyF');
  await page.waitForFunction(()=>window.__app.host.descent.snapshot().combatEvents.some(e=>e.type==='cast'));
  await mkdir(output,{recursive:true});
  await page.evaluate(async()=>{
    const app=window.__app,poses=await import('./spark-xr-preview.js'),path=await import('/__qa__/vr-awakening-path.mjs'),
      helpers=await import('/__qa__/vr-living-path.mjs'),math=await import('./spark-vr-math.js'),runtime=await import('./spark-xr-runtime.js');
    const {runtime:r,host:h}=app;h.newJourney();r.stopDesktop();r.configure({movement:1,throwMode:'trigger',combatProfile:'classic'});r.pause(false);
    const d=path.awakeningDriver({runtime:r,host:h,poses});d.tick({});d.tick({});
    const q=window.__awakening={app,d,path,helpers,poses,metrics:[]};
    q.stereo=()=>{
      const last=d.last(),root=runtime.xrWorldRoot(last.scene,last.input),head=last.input.head,
        eye=[head[12],head[13],head[14]],forward=[-head[8],-head[9],-head[10]],
        inverse=math.lookAt4(eye,eye.map((v,i)=>v+forward[i])),projection=math.projection4(Math.PI/2.7,1,.04,25);
      r.canvas.width=1200;r.canvas.height=600;
      return [0,600].map(x=>({viewport:{x,y:0,width:600,height:600},projection,inverse,
        matrix:math.multiply4(projection,math.multiply4(inverse,root))}));
    };
    q.benchmark=label=>{
      const was=r.paused,quality=r.settings.quality;r.pause(true,'Combat wrist benchmark');
      for(const quality of ['performance','balanced','high']){
        r.configure({quality});d.tick({});const {scene,input}=d.last(),views=q.stereo(),gl=r.renderer.gl,samples=[];
        for(let i=0;i<9;i++){
          gl.__metrics={drawCalls:0,vertices:0,uploadBytes:0,allocations:0};const start=performance.now();
          r.renderer.render(views,scene,{hudPose:input.head,hands:input.hands,vignette:.4});
          if(i)samples.push({...gl.__metrics,submissionMs:performance.now()-start});
        }
        const values=samples.map(s=>s.submissionMs).sort((a,b)=>a-b);
        q.metrics.push({label,quality,twoEyes:2,wristVisible:true,activeEnemies:scene.enemies.length,
          enemyProjectiles:scene.shots.filter(s=>s.enemy).length,playerProjectiles:scene.shots.filter(s=>!s.enemy).length,
          canonicalEffects:scene.effects.length,warningAngles:scene.guardians.reduce((n,g)=>n+g.angles.length,0),
          samples:samples.length,medianSubmissionMs:values[Math.floor(values.length/2)],p95SubmissionMs:values.at(-1),
          drawCalls:samples[0].drawCalls,verticesSubmitted:samples[0].vertices,geometryUploadBytes:samples[0].uploadBytes,
          newGPUObjects:samples.reduce((n,s)=>n+s.allocations,0),
          limit:'CPU software-WebGL submission only; not GPU frame time, headset FPS or total JS heap allocation'});
      }
      r.configure({quality});r.pause(was);d.tick({});d.tick({});
    };
    helpers.walk(d,480,115);d.tick({interact:true});d.tick({});
  });
  assert.equal(await page.evaluate(()=>window.__awakening.d.snapshot().roomId),'glass');
  await page.locator('#living-combatProfile').selectOption('spellcraft');
  const pair=await page.evaluate(()=>{
    const q=window.__awakening,{d,helpers,path,app}=q;app.runtime.pause(false);d.tick({});d.tick({});
    helpers.walk(d,480,300);const pair=path.findObservedPair(d),s=d.snapshot(),p=s.player,
      chosen=s.enemies.find(e=>e.id===pair.chosen),other=s.enemies.find(e=>e.id===pair.other),
      ax=chosen.x-p.x,bx=other.x-p.x,ay=chosen.y-p.y,by=other.y-p.y,
      an=Math.hypot(ax,ay),bn=Math.hypot(bx,by);
    d.view(Math.atan2(-ax/an-bx/bn,-ay/an-by/bn),-.13);d.tick({aim:pair.chosen});
    q.pair={...pair,beforeHP:chosen.hp,otherHP:other.hp};
    for(let i=0;i<2;i++)d.tick({attack:true,aim:pair.chosen});d.tick({aim:pair.chosen});d.capture();
    return {...q.pair,enemies:s.enemies.map(e=>({id:e.id,hp:e.hp,x:e.x,y:e.y})),profile:d.snapshot().combatProfile};
  });
  await canvas.screenshot({path:resolve(output,'directed-casting.png')});
  const combat=await page.evaluate(()=>{
    const q=window.__awakening,{d,app}=q,run=app.host.descent.state.run;
    for(let i=0;i<100&&!d.snapshot().combatEvents.some(e=>e.type==='hit'&&e.targetId===q.pair.chosen);i++)d.tick({});
    const hit=d.snapshot().combatEvents.find(e=>e.type==='hit'&&e.targetId===q.pair.chosen);
    if(!hit)throw Error('Selected native enemy was not hit: '+JSON.stringify({paused:app.runtime.paused,reason:app.runtime.pauseReason,events:d.snapshot().combatEvents,aim:d.snapshot().aim,pair:q.pair}));
    for(let i=0;i<120&&d.snapshot().attackCooldown>0;i++)d.tick({});
    if(d.snapshot().attackCooldown>0)throw Error('Native basic recovery did not finish');
    const previous=d.snapshot().combatEvents.filter(e=>e.type==='cast').length;
    d.tick({attack:true,direction:{x:0,y:1}});d.tick({direction:{x:0,y:1}});
    d.tick({attack:true,direction:{x:0,y:1}});d.tick({direction:{x:0,y:1}});
    const after=d.snapshot().combatEvents.filter(e=>e.type==='cast').length;
    for(let i=0;i<120;i++)d.tick({});
    const miss=d.snapshot().combatEvents.find(e=>e.type==='miss'),chosenHP=run.enemies.find(e=>e.id===q.pair.chosen)?.hp??0,
      otherHP=run.enemies.find(e=>e.id===q.pair.other)?.hp??0;
    if(!miss||after!==previous+1||otherHP!==q.pair.otherHP)throw Error('Miss/timing/selection acceptance failed');
    d.tick({aim:q.pair.other,attack:true});d.tick({aim:q.pair.other});d.capture();q.benchmark('two-enemy canonical combat');
    return {hit,miss,chosenBefore:q.pair.beforeHP,chosenAfter:chosenHP,otherBefore:q.pair.otherHP,otherAfter:otherHP,
      requestedCasts:2,acceptedCasts:after-previous,damage:run.stats.damageDealt};
  });
  await canvas.screenshot({path:resolve(output,'spellcraft-wrist.png')});
  await page.locator('#living-combatProfile').selectOption('classic');
  const legacy=await page.evaluate(()=>{
    const q=window.__awakening,{app,d}=q;app.runtime.pause(false);d.tick({});d.tick({});
    const before=app.host.descent.state.run.stats.damageDealt;for(let i=0;i<120;i++)d.tick({});
    const after=app.host.descent.state.run.stats.damageDealt;if(after<=before)throw Error('Classic auto-targeting did not resume');
    app.host.save();const checkpoint=localStorage.getItem('spark-substrate-immersive-vr-v1'),run=JSON.stringify(app.host.descent.state.run);
    app.host.restore();const restored=run===JSON.stringify(app.host.descent.state.run);app.runtime.pause(false);d.tick({});d.tick({});
    const data=JSON.parse(checkpoint);return {before,after,restored,schema:data.schema,preferencesInSave:!!(data.run.combatProfile||data.run.attackMode)};
  });
  assert.equal(legacy.restored,true);assert.equal(legacy.preferencesInSave,false);assert.equal(legacy.schema,'spark.vr.local-checkpoint.v1');
  const collisionFixtures=await page.evaluate(async()=>{
    const e=await import('../action-engine.js?v=0.17.0'),r=e.createRun(e.createMeta(),'spark',369);
    r.room='glass';r.cleared.push('glass');const box=e.obstacles('glass',r)[0];
    Object.assign(r.player,{x:box.x-50,y:box.y+box.h/2,attackClock:0});
    r.enemies=[{id:999,kind:'collector',x:box.x+box.w+70,y:r.player.y,r:14,hp:100,maxHp:100,speed:0,attack:100,orbitHit:0,flash:0}];
    const draft=()=>({version:'spark.attack-intent.v1',room:r.room,observedAt:r.time,sequence:1,origin:{x:r.player.x,y:r.player.y},direction:{x:1,y:0},targetId:999,assist:0});
    const cover=e.queryAttackIntent(r,draft());e.stepRun(r,{attackMode:'directed-v1',attackIntent:{...draft(),targetId:null}},1/60);
    for(let i=0;i<100;i++)e.stepRun(r,{attackMode:'directed-v1'},1/60);
    const coverDamage=r.stats.damageDealt,blocked=e.attackObservations(r).some(e=>e.type==='blocked');
    r.room='threshold';r.player.x=100;r.player.y=100;r.enemies[0].x=800;r.enemies[0].y=100;
    const range=e.queryAttackIntent(r,{...draft(),origin:{x:170,y:100}});
    if(cover.valid||range.valid||coverDamage||!blocked)throw Error('Controlled cover/range fixture failed');
    return {label:'Separate controlled canonical engine fixtures, not campaign progress or unlocks',cover,coverDamage,blocked,range};
  });
  const reached=await page.evaluate(()=>{
    const q=window.__awakening,{d,helpers}=q;helpers.clearEncounter(d);helpers.crossGate(d,'east');
    for(const dir of ['north','east','south','south']){helpers.clearEncounter(d);helpers.crossGate(d,dir);}
    return {room:d.snapshot().roomId,health:d.snapshot().guardians[0]?.hp,level:d.snapshot().level,playerHealth:d.snapshot().health};
  });
  assert.equal(reached.room,'forge');assert.equal(reached.health,1100);
  await page.locator('#living-combatProfile').selectOption('spellcraft');
  await page.evaluate(()=>{const q=window.__awakening;q.app.runtime.pause(false);q.d.tick({});q.d.tick({});
    q.helpers.walk(q.d,700,440);const s=q.d.snapshot(),g=s.guardians[0],p=s.player;
    q.d.view(Math.atan2(-(g.x-p.x),-(g.y-p.y)),.03);q.d.tick({aim:g.id});q.d.capture();});
  await canvas.screenshot({path:resolve(output,'forge-entry.png')});
  const windup=await page.evaluate(()=>{
    const q=window.__awakening,{d,path,app}=q;app.runtime.pause(false);d.tick({});d.tick({});
    q.fightFrame=0;q.fightTally={serial:0,damage:0,hits:0,casts:0,misses:0};
    q.noteFight=()=>{for(const e of d.snapshot().combatEvents){if(e.id<=q.fightTally.serial)continue;q.fightTally.serial=e.id;if(e.room!=='forge')continue;
      if(e.type==='hit'){q.fightTally.hits++;q.fightTally.damage+=e.damage||0;}if(e.type==='cast')q.fightTally.casts++;if(e.type==='miss')q.fightTally.misses++;}};
    for(;q.fightFrame<12000;q.fightFrame++){
      const s=d.snapshot(),g=s.guardians[0];if(s.phase==='dead')throw Error('Character died at native Cantor');
      if(g?.stage===2&&g.angles.length===10&&g.windup>.3){
        const p=s.player;d.view(Math.atan2(-(g.x-p.x),-(g.y-p.y)),-.08);d.tick({aim:g.id});d.capture();
        q.stageVolleys=g.volleys;return g;
      }
      path.directedFightStep(d,q.fightFrame);q.noteFight();
    }
    throw Error('No actual second-movement windup observed');
  });
  await canvas.screenshot({path:resolve(output,'cantor-windup.png')});
  const volley=await page.evaluate(()=>{
    const q=window.__awakening,{d,path}=q;
    for(let i=0;i<150;i++){
      path.directedFightStep(d,++q.fightFrame);q.noteFight();const s=d.snapshot(),g=s.guardians[0];
      if(g?.volleys>q.stageVolleys&&s.shots.filter(b=>b.enemy).length>=8){d.capture();q.benchmark('Cantor strongest native volley');
        return {volleys:g.volleys,enemyShots:s.shots.filter(b=>b.enemy).length,health:g.hp,stage:g.stage};}
    }
    throw Error('Strongest native volley was not observed');
  });
  await canvas.screenshot({path:resolve(output,'cantor-volley.png')});
  const victory=await page.evaluate(()=>{
    const q=window.__awakening,{d,path,app}=q;
    for(let i=0;i<12000&&!d.snapshot().cleared;i++){
      if(d.snapshot().phase==='dead')throw Error('Character died at native Cantor');path.directedFightStep(d,++q.fightFrame);q.noteFight();
    }
    const s=d.snapshot(),run=app.host.descent.state.run;
    if(!s.cleared||run.bossDefeated?.name!=='The Cantor'||!run.loot.includes('ash'))throw Error('No genuine Cantor victory/reward');
    if(q.fightTally.damage<300||q.fightTally.hits<8)throw Error('Boss requires visibly demonstrated native directed basic hits');
    d.capture();return {boss:run.bossDefeated,loot:[...run.loot],essence:run.essence,health:s.health,maxHealth:s.maxHealth,directedBasic:q.fightTally,
      celebration:s.guardianVisual.victory,phase:s.phase,damage:run.stats.damageDealt,kills:run.kills};
  });
  await canvas.screenshot({path:resolve(output,'cantor-victory.png')});
  const continuation=await page.evaluate(()=>{
    const q=window.__awakening,{d,helpers,app}=q;helpers.settleChoices(d);app.host.save();
    const saved=JSON.stringify(app.host.descent.state.run);app.host.restore();const restored=saved===JSON.stringify(app.host.descent.state.run);
    app.runtime.pause(false);d.tick({});d.tick({});helpers.crossGate(d,'north');return {restored,room:d.snapshot().roomId};
  });
  assert.equal(continuation.restored,true);assert.equal(continuation.room,'cistern');
  const earnedVessels=await page.evaluate(()=>{
    const q=window.__awakening,{d,helpers,app}=q;d.profile('classic');helpers.crossGate(d,'north');helpers.crossGate(d,'east');helpers.clearEncounter(d);
    const key=d.snapshot().keyPickup;if(key)helpers.walk(d,key.x,key.y);d.tick({});
    helpers.crossGate(d,'south');helpers.clearEncounter(d);
    if(!app.host.descent.state.run.earnedAbilities.includes('morph'))throw Error('No legitimately earned resonance');
    d.profile('spellcraft');return {room:d.snapshot().roomId,abilities:d.snapshot().abilities,keyring:d.snapshot().keys,source:'Native Reliquary fight, contact Ivory pickup, legal Nursery gate and native clear reward'};
  });
  const vesselEvidence=[];
  for(const form of ['human','computer','animal','tree','rock','spark']){
    const result=await page.evaluate(form=>{
      const q=window.__awakening,{d,app}=q;for(let i=0;i<185;i++)d.tick({});app.host.descent.morph(form);
      for(let i=0;i<120&&d.snapshot().attackCooldown>0;i++)d.tick({});
      if(d.snapshot().attackCooldown>0)throw Error('Native post-morph basic recovery did not finish');
      const serial=d.snapshot().combatEvents.at(-1)?.id||0;
      d.tick({});d.tick({attack:true});d.tick({});for(let i=0;i<5;i++)d.tick({});d.capture();const s=d.snapshot();
      return {form:s.form,style:s.weapon.style,attackRecovery:s.attackCooldown,morphRecovery:s.morphCooldown,
        cast:s.combatEvents.find(e=>e.type==='cast'&&e.id>serial),animation:s.attackAnimation?.form,
        scene:'Cleared canonical Nursery; intentional native misses demonstrate all six form animations'};
    },form);
    assert.equal(result.form,form);assert.equal(result.cast?.form,form);assert.equal(result.animation,form);
    assert.ok(result.attackRecovery>0);assert.ok(result.morphRecovery>0);vesselEvidence.push(result);
    await canvas.screenshot({path:resolve(output,'spellcraft-'+form+'.png')});
  }
  const moreBounce=await page.evaluate(async()=>{
    const q=window.__awakening,{d,helpers,app}=q;d.profile('classic');
    for(const dir of ['west','north','west','south','south'])helpers.crossGate(d,dir);
    helpers.clearEncounter(d);
    for(const dir of ['north','north','east','south','south'])helpers.crossGate(d,dir);
    d.profile('spellcraft');helpers.walk(d,700,440);const p=d.snapshot().player;d.view(Math.atan2(-(480-p.x),-(300-p.y)),-.3);
    app.runtime.pause(true,'Listen');
    const entry=app.host.menu().find(([label])=>label==='Listen between the notes');if(!entry)throw Error('Earned secret did not appear');
    const run=app.host.descent.state.run,before=JSON.stringify(run);entry[1]();
    if(JSON.stringify(run)!==before)throw Error('Celebration activation mutated canonical game state');
    for(let i=0;i<60;i++)d.tick({});d.capture();
    const field=d.snapshot().moreBounce;if(!field)throw Error('No bounded celebration field');
    q.bounceBaseline=structuredClone(run);q.bounceStart=run.time;
    return {schema:field.schema,remaining:field.remaining,dancers:field.dancers.length,bubbles:field.bubbles.length,
      source:'Native Cantor victory, nine distinct mercy decisions, legitimately earned resonance, six canonical transformations and legal return',
      activationChangedGameState:false,celebrationOnly:field.celebrationOnly};
  });
  await canvas.screenshot({path:resolve(output,'more-bounce.png')});
  const bounceExpiry=await page.evaluate(async()=>{
    const q=window.__awakening,engine=await import('../action-engine.js?v=0.17.0');
    for(let i=0;i<430;i++)q.d.tick({});const run=q.app.host.descent.state.run,
      ticks=Math.round((run.time-q.bounceStart)*60);
    for(let i=0;i<ticks;i++)engine.stepRun(q.bounceBaseline,{fireMode:'auto',attackMode:'directed-v1'},1/60);
    const matchesCanonical=JSON.stringify(run)===JSON.stringify(q.bounceBaseline);
    if(!matchesCanonical||q.d.snapshot().moreBounce)throw Error('Celebration changed engine state or failed to expire');
    return {expired:true,matchesCanonical,ticks,noSaveFields:!('moreBounce' in run)};
  });
  const stereo=await page.evaluate(()=>{
    const q=window.__awakening,r=q.app.runtime;r.pause(true,'Awakening wrist');q.d.tick({});const {scene,input}=q.d.last(),views=q.stereo(),gl=r.renderer.gl;
    r.renderer.render(views,scene,{hudPose:input.head,hands:input.hands,vignette:.4});
    const pixels=new Uint8Array(1200*600*4),eyes=[0,0];gl.readPixels(0,0,1200,600,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
    for(let i=0;i<1200*600;i++)if(pixels[i*4]+pixels[i*4+1]+pixels[i*4+2]>35)eyes[i%1200<600?0:1]++;
    return {eyes,error:gl.getError()};
  });
  assert.equal(stereo.error,0);assert.ok(stereo.eyes.every(n=>n>15000));
  await page.getByRole('button',{name:/THE ARENA/}).click();
  await page.waitForFunction(()=>window.__app.host.mode==='duel');
  await page.getByRole('button',{name:'Desktop 3D preview',exact:true}).click();
  await page.waitForFunction(()=>window.__app.runtime.mode==='desktop');
  await page.getByRole('button',{name:/DESCENT/}).click();
  await page.waitForFunction(()=>window.__app.host.mode==='descent');
  const final=await page.evaluate(()=>({gpu:window.__gpuRecords,voices:window.__app.runtime.feedback.voices.size,metrics:window.__awakening.metrics}));
  assert.equal(final.voices,0);assert.ok(final.gpu.every(c=>c.buffers===0&&c.textures===0&&c.programs===0));
  assert.ok(final.metrics.every(m=>m.newGPUObjects===0&&m.drawCalls>0&&m.verticesSubmitted>0));
  assert.deepEqual(remote,[]);assert.deepEqual(errors,[]);
  const receipt={schema:'spark.xr.rung3.browser.v1',status:'PASS',browser:browser.version(),pair,combat,legacy,collisionFixtures,reached,windup,volley,victory,continuation,earnedVessels,vesselEvidence,moreBounce,bounceExpiry,
    stereo,performance:final.metrics,cleanup:{gpu:final.gpu,voices:final.voices},remoteRequests:remote.length,browserErrors:errors.length,
    source:'Actual exported application/runtime with synthetic current tracked poses; fresh native campaign and real choices; no gameplay state injection',
    collisionEvidence:'Separate labeled canonical engine fixtures in this browser and tests/attack-intent.test.mjs; no fixture unlocks in the campaign journey',
    hardwareVerification:'NOT PERFORMED; software Chromium/WebGL does not establish Quest comfort, tracking or FPS'};
  await writeFile(resolve(output,'browser-results.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt,null,2));
}catch(error){
  await mkdir(output,{recursive:true});if(page){await page.screenshot({path:resolve(output,'failure.png'),fullPage:true}).catch(()=>{});
    console.error(await page.locator('#living-status').innerText().catch(()=>''),errors);
    console.error(await page.evaluate(()=>window.__app?{paused:window.__app.runtime.paused,reason:window.__app.runtime.pauseReason,events:window.__app.host.descent.snapshot().combatEvents}:{}).catch(()=>({})));}
  throw error;
}finally{await browser?.close();await new Promise(r=>server.close(r));}
