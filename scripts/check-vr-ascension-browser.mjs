// Optional development/CI browser check. Playwright is test tooling, never a runtime asset.
// npm install --prefix /tmp/spark-xr-qa --no-audit --no-fund playwright@1.62.1
// SPARK_PLAYWRIGHT_MODULE=/tmp/spark-xr-qa/node_modules/playwright/index.mjs node scripts/check-vr-ascension-browser.mjs
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const output=resolve(process.env.SPARK_XR_QA_OUTPUT||resolve(root,'work/vr-browser'));
const tool=process.env.SPARK_PLAYWRIGHT_MODULE;
const {chromium}=await import(tool?pathToFileURL(tool).href:'playwright');
const server=createServer(async(req,res)=>{
  try{
    const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(path==='/favicon.ico'){res.writeHead(204);res.end();return;}
    const file=resolve(root,'public','.'+path.replace(/^\/SparkTheSubstrate/,''));
    if(!file.startsWith(resolve(root,'public')+'/'))throw Error('Invalid path');
    const bytes=await readFile(file);
    res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[extname(file)]||'application/octet-stream'});
    res.end(bytes);
  }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port;
let browser;
try{
  const executablePath=process.env.SPARK_CHROMIUM_PATH;
  browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{}),
    args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],
    env:{...process.env,...(executablePath?{LD_LIBRARY_PATH:dirname(executablePath)}:{})}});
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],remote=[];
  page.setDefaultTimeout(10000);
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.route('**/*',route=>{
    if(!route.request().url().startsWith(base+'/')){remote.push(route.request().url());return route.abort();}
    return route.continue();
  });
  await page.goto(base+'/SparkTheSubstrate/vr/ascension.html');
  await page.getByRole('button',{name:'Desktop 3D preview',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#arena-facts').textContent.includes('Round 1'));
  const canvas=page.locator('#world');await canvas.focus();
  await page.keyboard.down('Space');await page.waitForTimeout(180);await page.keyboard.up('Space');
  try{
    await page.waitForFunction(()=>document.querySelector('#arena-facts').textContent.includes('Archon 86'),null,{timeout:10000});
  }catch(error){
    await mkdir(output,{recursive:true});await page.screenshot({path:resolve(output,'failure.png'),fullPage:true});
    console.error('Arena failure:',await page.locator('#arena-status').innerText(),await page.locator('#arena-facts').innerText(),errors);
    throw error;
  }
  const castFacts=await page.locator('#arena-facts').innerText();
  assert.match(castFacts,/Cast recovery [1-5]/);
  await page.getByRole('button',{name:'Pause / resume',exact:true}).click();
  const paused=await page.locator('#arena-facts').innerText();await page.waitForTimeout(120);
  assert.equal(await page.locator('#arena-facts').innerText(),paused);
  await page.getByLabel('Reduced visual intensity',{exact:true}).check();
  await page.locator('#arena-throwMode').selectOption('trigger');
  await page.getByRole('button',{name:'Test tracking interruption',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#arena-status').textContent.includes('controller pose unavailable'));
  const interrupted=await page.locator('#arena-facts').innerText();await page.waitForTimeout(120);
  assert.equal(await page.locator('#arena-facts').innerText(),interrupted);
  await page.getByRole('button',{name:'Pause / resume',exact:true}).click();
  await page.waitForTimeout(100);
  await mkdir(output,{recursive:true});
  await canvas.screenshot({path:resolve(output,'arena-desktop.png')});
  // Simulated stereo drives the real WebGL renderer and both per-eye HUD/hand passes.
  const stereo=await page.evaluate(async()=>{
    const {SparkXRRuntime}=await import('./spark-xr-runtime.js');
    const {DuelXRAdapter}=await import('./spark-xr-adapters.js');
    const {desktopXRSample,previewMatrix}=await import('./spark-xr-preview.js');
    const {projection4,lookAt4}=await import('./spark-vr-math.js');
    const c=document.createElement('canvas');c.width=1000;c.height=500;
    const r=new SparkXRRuntime({canvas:c,adapter:new DuelXRAdapter()});r.ensureRenderer();
    const p=desktopXRSample(),inverse=lookAt4([0,1.65,0],[0,1.65,-1]);
    let frames=0;
    r.session={visibilityState:'visible',inputSources:['left','right'].map(handedness=>({handedness,
      gripSpace:{handedness},targetRaySpace:{handedness},gamepad:{mapping:'xr-standard',...p.hands[handedness]}})),
      requestAnimationFrame:()=>++frames,cancelAnimationFrame(){},end:async()=>{}};
    r.layer={framebuffer:null,getViewport:v=>({x:v.eye==='left'?0:500,y:0,width:500,height:500})};
    r.space={};r.mode='xr';r.pause(false);
    const frame={getViewerPose:()=>({transform:{matrix:p.head},views:['left','right'].map(eye=>({eye,
      projectionMatrix:projection4(Math.PI/2.7,1,.04,25),transform:{inverse:{matrix:inverse}}}))}),
      getPose:space=>({transform:{matrix:p.hands[space.handedness]?.grip||previewMatrix()}})};
    r.xrFrame(0,frame);r.xrFrame(16,frame);r.xrFrame(32,frame);
    const gl=r.renderer.gl,pixels=new Uint8Array(1000*500*4),eyePixels=[0,0];
    gl.readPixels(0,0,1000,500,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
    for(let i=0;i<1000*500;i++)if(pixels[i*4]+pixels[i*4+1]+pixels[i*4+2]>35)eyePixels[i%1000<500?0:1]++;
    const result={frames,error:gl.getError(),eyePixels,mode:r.mode};
    await r.dispose();return result;
  });
  assert.equal(stereo.mode,'xr');assert.equal(stereo.error,0);assert.ok(stereo.frames>=3);
  assert.ok(stereo.eyePixels.every(n=>n>10000),'both eye viewports retain visible geometry');
  await page.getByRole('button',{name:'Exit VR / preview',exact:true}).click();
  await page.getByRole('link',{name:'Seven-world Descent VR',exact:true}).click();
  await page.waitForURL('**/vr/index.html');await page.waitForLoadState('load');
  await page.getByRole('button',{name:'Desktop 3D preview',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#intro-overlay').hidden===true);
  assert.match(await page.locator('#facts').innerText(),/The Threshold/);
  await page.waitForTimeout(120);
  assert.doesNotMatch(await page.locator('#status').innerText(),/unavailable|paused:/i);
  await page.locator('#world').screenshot({path:resolve(output,'descent-desktop.png')});
  assert.deepEqual(remote,[]);assert.deepEqual(errors,[]);
  const result={status:'PASS',browser:browser.version(),checks:['project subpath imports','desktop canonical cast hit',
    'pause freezes combat','comfort controls','tracking interruption pauses','real WebGL simulated stereo and hands',
    'Descent desktop still renders','zero remote requests','no browser errors'],stereo,
    hardwareVerification:'NOT PERFORMED; synthetic input and software-rendered Chromium only'};
  await writeFile(resolve(output,'browser-results.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
}finally{await browser?.close();await new Promise(r=>server.close(r));}
