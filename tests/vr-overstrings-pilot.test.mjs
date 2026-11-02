import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {createSparkEchoBridge,SPARK_ECHO_SCHEMA} from "../public/vr/spark-overstrings-bridge.mjs";

function intent({source="webxr",sequence=1,timestamp_ms=1000,action_id="spark.cast"}={}){
  return {
    schema:"overstrings.action-intent.v1",version:1,advisory:true,mode:"practice",
    action_id,template_label:"Liquid spiral",source,sequence,timestamp_ms
  };
}
test("host adapter is disarmed, advisory-only and does not mutate Spark game",()=>{
  const echoes=[];const b=createSparkEchoBridge({onEcho:echo=>echoes.push(echo)});
  assert.equal(b.armed,false);
  assert.equal(b.receive(intent(),1000).reason,"not_armed");
  assert.equal(b.arm({source:"webxr"}).armed,true);
  assert.equal(b.receive(intent(),1010).accepted,true);
  assert.equal(b.armed,false);
  assert.equal(echoes.length,1);
  assert.equal(echoes[0].schema,SPARK_ECHO_SCHEMA);
  assert.equal(echoes[0].action_id,"spark.cast");
  assert.equal(Object.isFrozen(echoes[0]),true);
  assert.equal("player" in echoes[0],false);
  assert.equal("frames" in echoes[0],false);
  assert.equal(b.receive(intent({sequence:2}),1020).reason,"not_armed");
});
test("another game action, bogus event and replay are never visual echoes",()=>{
  const echoes=[];const b=createSparkEchoBridge({onEcho:e=>echoes.push(e)});
  b.arm({source:"webxr"});
  assert.equal(b.receive(intent({action_id:"btm.interact"}),1000).accepted,false);
  b.arm({source:"webxr"});
  assert.equal(b.receive({...intent(),advisory:false},1000).accepted,false);
  b.arm({source:"webxr"});
  assert.equal(b.receive(intent(),1000).accepted,true);
  b.arm({source:"webxr"});
  assert.equal(b.receive(intent(),2500).reason,"replay_or_reordered");
  assert.equal(echoes.length,1);
});
test("synthetic is opt-in, one-shot, never mislabeled as headset",()=>{
  const echoes=[];const b=createSparkEchoBridge({onEcho:e=>echoes.push(e)});
  assert.equal(b.arm({source:"synthetic"}).armed,false);
  assert.equal(b.syntheticDemo(1000).reason,"not_armed");
  assert.equal(b.arm({source:"synthetic",allowSyntheticDemo:true}).armed,true);
  assert.equal(b.syntheticDemo(1000).accepted,true);
  assert.equal(echoes[0].source,"synthetic");
  assert.equal(b.syntheticDemo(1500).reason,"not_armed");
});
test("no spoofed WebXR or unsafe intent passes source and timestamp limits",()=>{
  const b=createSparkEchoBridge();
  b.arm({source:"webxr"});
  assert.equal(b.receive(intent({source:"synthetic"}),1000).accepted,false);
  b.arm({source:"webxr"});
  assert.equal(b.receive(intent({timestamp_ms:100}),4000).reason,"stale_or_future_intent");
  b.arm({source:"webxr"});
  assert.equal(b.receive({...intent(),sequence:Infinity},1000).reason,"invalid_intent");
});
test("interface is explicitly opt-in and isolated from canonical gameplay inputs",()=>{
  const read=path=>readFileSync(fileURLToPath(new URL(path,import.meta.url)),"utf8");
  const html=read("../public/vr/index.html");
  const app=read("../public/vr/spark-vr-app.js");
  const bridge=read("../public/vr/spark-overstrings-bridge.mjs");
  assert.match(html,/id="overstrings-pilot"/);
  assert.match(html,/id="overstrings-allow-synthetic"/);
  assert.match(html,/id="overstrings-try-demo"/);
  assert.match(app,/mountSparkEchoPilot/);
  assert.doesNotMatch(bridge,/stepVRPreview|state\.run|adapter\.cast|\.powerCooldown|localStorage|fetch\(/);
  assert.doesNotMatch(bridge,/postMessage\(|sessionStorage|sendBeacon/);
});
