import test from "node:test";
import assert from "node:assert/strict";
import {SparkOpticalFieldHud,installSparkOpticalFieldHud} from "../public/vr/spark-overstrings-field-hud.mjs";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

test("optical HUD only returns bounded temporary text when explicitly enabled",()=>{
 let now=0;
 const hud=new SparkOpticalFieldHud({now:()=>now,enabled:false,ttlMs:1200});
 const scene={panel:{page:"Session"},paused:false,calibration:false,statusMessage:""};
 assert.equal(hud.noteOpticalStatus("No real XRHand joints"),false);
 assert.equal(hud.messageForScene(scene),null);
 hud.setEnabled(true);
 assert.equal(hud.noteOpticalStatus("XR session started"),true);
 assert.match(hud.messageForScene(scene),/SEARCHING/);
 now=1200;assert.equal(hud.messageForScene(scene),null);
 hud.noteOpticalStatus("No real XRHand joints");
 assert.match(hud.messageForScene(scene),/NO OPTICAL HANDS/);
 now=2600;assert.equal(hud.messageForScene(scene),null);
});
test("stereo notice uses limited hand status, pinch echo takes precedence",()=>{
 let t=100;
 const hud=new SparkOpticalFieldHud({now:()=>t,ttlMs:1500});
 assert.equal(hud.noteOpticalStatus("Optical joints: left open · right untracked. Experimental recognition; no game actions."),true);
 assert.match(hud.messageForScene({panel:{},paused:false,statusMessage:""}),/L OPEN · R UNTRACKED/);
 assert.equal(hud.noteEcho("left"),true);
 assert.equal(hud.noteOpticalStatus("Optical joints: left pinch · right open."),false);
 assert.match(hud.messageForScene({panel:{},paused:false,statusMessage:""}),/LEFT PINCH · ECHO/);
 t=1700;
 assert.equal(hud.messageForScene({panel:{},paused:false,statusMessage:""}),null);
 assert.equal(hud.noteOpticalStatus("Optical joints: left pinch · right open."),false,
   "no repeated alert from the same tracking state");
 assert.equal(hud.noteEcho("wrong"),false);
});
test("pause, calibration and Spark's own error message take priority",()=>{
 const hud=new SparkOpticalFieldHud({now:()=>1000});
 hud.noteEcho("right");
 for(const scene of [
   {panel:{},paused:true},
   {panel:{},calibration:true},
   {panel:{},statusMessage:"Controllers lost"},
   {paused:false}
 ])assert.equal(hud.messageForScene(scene),null);
});
test("renderer decoration is XR-only, stereo-only and render-scene-only",()=>{
 let time=500,rendered=[];
 const renderer={render(views,scene,options){rendered.push({views,scene,options});return 369;}};
 const runtime={mode:"xr",makeRenderer:()=>renderer};
 const pilot={hudMessage:()=> "OVERSTRINGS / LEFT PINCH · ECHO"};
 const restore=installSparkOpticalFieldHud(runtime,pilot,{now:()=>time});
 const wrapped=runtime.makeRenderer({});
 const original={paused:false,panel:{page:"Session"},statusMessage:""};
 const views=[{eye:"left"},{eye:"right"}],options={hudPose:new Float32Array(16)};
 assert.equal(wrapped.render(views,original,options),369);
 assert.equal(rendered[0].scene.statusMessage,"OVERSTRINGS / LEFT PINCH · ECHO");
 assert.equal(original.statusMessage,"");
 assert.notEqual(rendered[0].scene,original);
 assert.equal(rendered[0].scene.panel,original.panel);
 runtime.mode="desktop";
 wrapped.render([views[0]],original,options);
 assert.equal(rendered[1].scene,original);
 runtime.mode="xr";
 wrapped.render(views,{...original,statusMessage:"Recovery required"},options);
 assert.equal(rendered[2].scene.statusMessage,"Recovery required");
 wrapped.render(views,original,{});
 assert.equal(rendered[3].scene,original);
 restore();
 assert.equal(runtime.makeRenderer({}),renderer);
});
test("protected runtime/renderer remain unchanged and no privileged data path exists",()=>{
 const read=path=>readFileSync(fileURLToPath(new URL(path,import.meta.url)),"utf8");
 const code=read("../public/vr/spark-overstrings-field-hud.mjs");
 const app=read("../public/vr/spark-vr-app.js");
 assert.match(app,/installSparkOpticalFieldHud/);
 assert.doesNotMatch(code,/fetch\(|localStorage|sessionStorage|postMessage|getUserMedia|input\.cast|adapter\.step/);
});
