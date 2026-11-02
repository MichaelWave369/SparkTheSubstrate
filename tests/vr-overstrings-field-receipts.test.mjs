import test from "node:test";
import assert from "node:assert/strict";
import {SparkOpticalFieldReceipt,FIELD_RECEIPT_SCHEMA} from "../public/vr/spark-overstrings-field-receipts.mjs";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

test("no recording by default and synthetic source cannot claim Quest receipt",()=>{
 let t=0;const r=new SparkOpticalFieldReceipt({now:()=>t});
 assert.equal(r.summary,null);assert.equal(r.sample({time:t,tracked:{left:true,right:true}}),false);
 assert.equal(r.start({source:"synthetic",time:t}),false);
 assert.equal(r.summary,null);
 assert.equal(r.start({source:"webxr",time:100}),true);
 assert.equal(r.summary.phase,"recording");
 assert.equal(r.summary.source,"webxr");
 assert.equal(r.summary.sampled_frames,0);
});
test("bounded coarse frames, dropouts and pinch/echo counts with no raw positions",()=>{
 let t=100;const r=new SparkOpticalFieldReceipt({now:()=>t});
 r.start({source:"webxr",time:t});
 assert.equal(r.sample({time:100,tracked:{left:false,right:false}}),true);
 assert.equal(r.sample({time:130,tracked:{left:true,right:false}}),true);
 assert.equal(r.sample({time:160,tracked:{left:true,right:true}}),true);
 assert.equal(r.sample({time:190,tracked:{left:false,right:true}}),true);
 assert.equal(r.sample({time:220,tracked:{left:false,right:false}}),true);
 assert.equal(r.gesture({handedness:"left",gesture:"pinch",phase:"start",source:"webxr"}),true);
 assert.equal(r.gesture({handedness:"right",gesture:"pinch",phase:"end",source:"webxr"}),false);
 assert.equal(r.gesture({handedness:"left",gesture:"pinch",phase:"start",source:"synthetic"}),false);
 assert.equal(r.echo({handedness:"left",source:"webxr"}),true);
 assert.equal(r.echo({handedness:"right",source:"synthetic"}),false);
 t=250;assert.equal(r.end("one_shot_echo"),true);
 assert.equal(r.end("xr_session_end"),false);
 const s=r.summary;
 assert.equal(s.schema,FIELD_RECEIPT_SCHEMA);
 assert.equal(s.sampled_frames,5);
 assert.deepEqual(s.reported_hand_frames,{left:2,right:2});
 assert.deepEqual(s.hand_tracking_dropouts,{left:1,right:1});
 assert.deepEqual(s.observed_frame_percent,{left:40,right:40});
 assert.deepEqual(s.detected_pinch_starts,{left:1,right:0});
 assert.deepEqual(s.accepted_visual_echoes,{left:1,right:0});
 assert.equal(s.duration_ms,150);
 assert.equal(s.stop_reason,"one_shot_echo");
 assert.doesNotMatch(r.exportJSON(),/wrist_m|fingertips_palm_units|full_hand|device_id|user_id|timestamp_ms/);
});
test("explicit manual annotations require a finished trial and are never inferred",()=>{
 const r=new SparkOpticalFieldReceipt({now:()=>200});
 assert.equal(r.annotate("missed_pinch"),false);
 r.start({time:100});
 assert.equal(r.annotate("missed_pinch"),false);
 r.end("xr_session_end",200);
 assert.equal(r.annotate("missed_pinch"),true);
 assert.equal(r.annotate("correct_echo"),true);
 assert.equal(r.annotate("unexpected_echo"),true);
 assert.equal(r.annotate("unreadable_hud"),true);
 assert.equal(r.annotate("other"),false);
 assert.deepEqual(r.summary.manual_notes,{
   correct_echo:1,missed_pinch:1,unexpected_echo:1,unreadable_hud:1
 });
});
test("invalid, reversed and malformed frames fail without changing counters",()=>{
 const r=new SparkOpticalFieldReceipt({now:()=>100});
 assert.equal(r.start({source:"webxr",time:-1}),false);
 r.start({time:100});
 assert.equal(r.sample({time:101,tracked:{left:true,right:false}}),true);
 for(const sample of [
   {time:99,tracked:{left:true,right:true}},
   {time:102,tracked:{left:1,right:false}},
   {time:NaN,tracked:{left:true,right:false}},
   {time:102,tracked:null}
 ])assert.equal(r.sample(sample),false);
 assert.equal(r.sample({time:100,tracked:{left:false,right:false}}),false);
 assert.equal(r.summary.sampled_frames,1);
 r.clear();assert.equal(r.summary,null);
});
test("one-shot finished report freezes automatic counters, clear deletes everything",()=>{
 const r=new SparkOpticalFieldReceipt({now:()=>1100});
 r.start({time:100});
 r.sample({time:200,tracked:{left:true,right:false}});
 r.end("manual_disarm",1100);
 assert.equal(r.sample({time:1200,tracked:{left:true,right:true}}),false);
 assert.equal(r.gesture({handedness:"left",gesture:"pinch",phase:"start",source:"webxr"}),false);
 assert.equal(r.summary.reported_hand_frames.left,1);
 assert.equal(r.summary.duration_ms,1000);
 r.clear();assert.equal(r.summary,null);
 assert.throws(()=>r.exportJSON(),/No field trial/);
});
test("code is independent of game state and has no storage or network",()=>{
 const code=readFileSync(fileURLToPath(new URL("../public/vr/spark-overstrings-field-receipts.mjs",import.meta.url)),"utf8");
 assert.doesNotMatch(code,/fetch\(|localStorage|sessionStorage|postMessage|indexedDB|gamepad|player\.health|adapter\.step/);
});

test("source-state buckets distinguish missing sources, partial joints and emulated required pose",()=>{
  const r=new SparkOpticalFieldReceipt({now:()=>1000});
  r.start({time:100});
  const cases=[
    {time:110,tracked:{left:false,right:false},statuses:{left:"no_hand_source",right:"no_hand_source"}},
    {time:120,tracked:{left:false,right:false},statuses:{left:"no_joint_api",right:"no_hand_source"}},
    {time:130,tracked:{left:false,right:false},statuses:{left:"missing_required_joints",right:"emulated_required_pose"}},
    {time:140,tracked:{left:true,right:false},statuses:{left:"valid",right:"unavailable_frame"}}
  ];
  for(const sample of cases)assert.equal(r.sample(sample),true);
  r.end("manual_disarm",200);
  const s=r.summary;
  assert.equal(s.reported_source_states.left.no_hand_source,1);
  assert.equal(s.reported_source_states.left.no_joint_api,1);
  assert.equal(s.reported_source_states.left.missing_required_joints,1);
  assert.equal(s.reported_source_states.left.valid,1);
  assert.equal(s.reported_source_states.right.no_hand_source,2);
  assert.equal(s.reported_source_states.right.emulated_required_pose,1);
  assert.equal(s.reported_source_states.right.unavailable_frame,1);
  assert.equal(s.reported_hand_frames.left,1);
  assert.equal(s.reported_hand_frames.right,0);
  assert.equal(s.observed_frame_percent.left,25);
  assert.equal(Object.values(s.reported_source_states.left).reduce((a,b)=>a+b,0),s.sampled_frames);
  assert.equal(JSON.stringify(s).includes('"transform"'),false);
});
test("malformed or contradictory status reasons reject entire callback",()=>{
  const r=new SparkOpticalFieldReceipt({now:()=>1000});
  r.start({time:100});
  for(const statuses of [
    {left:"valid",right:"valid"},
    {left:"bogus",right:"no_hand_source"},
    {left:"valid",right:0},
    {left:"no_hand_source"},
    [],
    "valid"
  ]) {
    assert.equal(r.sample({time:120,tracked:{left:false,right:false},statuses}),false);
  }
  assert.equal(r.summary.sampled_frames,0);
  assert.equal(r.sample({time:130,tracked:{left:false,right:false}}),true,
    "backward-compatible fixture without statuses stays unknown, not fabricated");
  assert.equal(r.summary.reported_source_states.left.unknown_untracked,1);
});
