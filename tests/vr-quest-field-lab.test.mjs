import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {
  QUEST_ACCEPTANCE_CASES,QUEST_DIAGNOSTIC_SCHEMA,
  createQuestDiagnostics,noteQuestEvent,beginQuestDiagnostics,
  setQuestReferenceSpace,recordQuestFrame,endQuestDiagnostics,
  summarizeQuestDiagnostics,questAcceptanceReport
} from '../public/vr/spark-vr-diagnostics.js';

const text=path=>readFileSync(fileURLToPath(new URL(path,import.meta.url)),'utf8');
test('Quest field report remains explicitly unverified with zero hardware measurements',()=>{
  const state=createQuestDiagnostics();
  const report=questAcceptanceReport(state);
  assert.equal(report.schema,QUEST_DIAGNOSTIC_SCHEMA);
  assert.equal(report.releaseReadiness,'MANUAL_QUEST_ACCEPTANCE_REQUIRED');
  assert.equal(report.diagnostics.sessionStatus,'not-started');
  assert.equal(report.diagnostics.renderedFrames,0);
  assert.equal(report.diagnostics.frameIntervalMilliseconds.median,null);
  assert.equal(report.counts.notTested,QUEST_ACCEPTANCE_CASES.length);
  assert.equal(report.counts.pass,0);
  assert.ok(report.manualChecks.every(item=>item.result==='not-tested'));
});
test('real session metrics summarize two-eye callbacks, both controller hands and frame pacing',()=>{
  const state=createQuestDiagnostics();
  noteQuestEvent(state,'xr-start-requested');
  beginQuestDiagnostics(state,'local-floor');
  const intervals=[11,12,14,15,16,17,20,23,30,34];
  let timestamp=100;
  for(const ms of intervals){
    timestamp+=ms;
    recordQuestFrame(state,{
      timestamp,viewCount:2,renderSubmissionMs:3+ms/10,left:true,right:true
    });
  }
  const result=summarizeQuestDiagnostics(state);
  assert.equal(result.sessionStatus,'active');
  assert.equal(result.sessionCount,1);
  assert.equal(result.renderedFrames,10);
  assert.equal(result.framesWithTwoEyes,10);
  assert.equal(result.maximumViewsSeen,2);
  assert.equal(result.leftControllerDetected,true);
  assert.equal(result.rightControllerDetected,true);
  assert.equal(result.referenceSpace,'local-floor');
  assert.equal(result.frameIntervalMilliseconds.samples,9);
  assert.ok(result.frameIntervalMilliseconds.p95>=20);
  assert.ok(result.javascriptRenderSubmissionMilliseconds.median>0);
  endQuestDiagnostics(state);
  assert.equal(summarizeQuestDiagnostics(state).sessionStatus,'ended');
  assert.equal(summarizeQuestDiagnostics(state).eventCounts['xr-ended'],1);
});
test('pauses and frame jumps are excluded from callback cadence rather than misreported as slow frames',()=>{
  const state=createQuestDiagnostics();beginQuestDiagnostics(state);
  recordQuestFrame(state,{timestamp:100,viewCount:1,renderSubmissionMs:2});
  recordQuestFrame(state,{timestamp:110,viewCount:1,renderSubmissionMs:2});
  recordQuestFrame(state,{timestamp:120000,viewCount:2,renderSubmissionMs:Infinity});
  recordQuestFrame(state,{timestamp:120011,viewCount:2,renderSubmissionMs:4});
  const snapshot=summarizeQuestDiagnostics(state);
  assert.equal(snapshot.frameIntervalMilliseconds.samples,2);
  assert.equal(snapshot.frameIntervalMilliseconds.median,10.5);
  assert.equal(snapshot.javascriptRenderSubmissionMilliseconds.samples,3);
  assert.equal(snapshot.framesWithTwoEyes,2);
});
test('frame-sample memory remains capped after a long session',()=>{
  const state=createQuestDiagnostics();beginQuestDiagnostics(state);
  for(let i=0;i<2000;i++){
    recordQuestFrame(state,{timestamp:100+i*12,viewCount:2,
      renderSubmissionMs:2+(i%10)/10,left:i%2===0,right:i%2===1});
  }
  assert.equal(state.frames,2000);
  assert.ok(state.intervals.length<=480);
  assert.ok(state.renderMs.length<=480);
  assert.equal(state.leftControllerSeen,true);
  assert.equal(state.rightControllerSeen,true);
  assert.equal(summarizeQuestDiagnostics(state).framesWithTwoEyes,2000);
});
test('unknown telemetry events or invalid reference spaces are rejected',()=>{
  const state=createQuestDiagnostics();
  assert.throws(()=>noteQuestEvent(state,'playerPosition'),/Unrecognized/);
  assert.throws(()=>beginQuestDiagnostics(state,'precise-location'),/reference-space/);
  beginQuestDiagnostics(state,'unknown');
  setQuestReferenceSpace(state,'local');
  assert.equal(state.referenceSpace,'local');
  assert.throws(()=>setQuestReferenceSpace(state,'room-map'),/reference-space/);
  noteQuestEvent(state,'tracking-reset');
  noteQuestEvent(state,'controller-interrupted');
  assert.equal(summarizeQuestDiagnostics(state).eventCounts['tracking-reset'],1);
  assert.equal(summarizeQuestDiagnostics(state).eventCounts['controller-interrupted'],1);
});
test('manual checklist cannot be auto-passed or injected with arbitrary fields',()=>{
  const state=createQuestDiagnostics();
  const cases={stereo:'pass',movement:'fail','xr-entry':'arbitrary',
    ['unknown-case']:'pass'};
  const report=questAcceptanceReport(state,cases);
  assert.equal(report.counts.pass,1);
  assert.equal(report.counts.fail,1);
  assert.equal(report.counts.notTested,QUEST_ACCEPTANCE_CASES.length-2);
  assert.equal(report.manualChecks.length,QUEST_ACCEPTANCE_CASES.length);
  assert.ok(report.manualChecks.every(item=>Object.keys(item).sort().join(',')==='id,result'));
  assert.equal(report.manualChecks.find(x=>x.id==='xr-entry').result,'not-tested');
  assert.ok(!report.manualChecks.some(x=>x.id==='unknown-case'));
  assert.ok(JSON.stringify(report).includes('not headset FPS'));
});
test('export never includes user identifiers, room data, game progress, input vectors, or browser URL',()=>{
  const state=createQuestDiagnostics();beginQuestDiagnostics(state,'local-floor');
  const sentinel='sensitive-user-token-12345';
  recordQuestFrame(state,{
    timestamp:1000,viewCount:2,renderSubmissionMs:3,left:true,right:true,
    pose:{x:sentinel},room:sentinel,save:sentinel,controllerAxis:sentinel
  });
  const serialized=JSON.stringify(questAcceptanceReport(state,{stereo:'pass'}));
  for(const forbidden of [sentinel,'controllerAxis','pose','saveData','navigator',
    'latitude','longitude','gameProgress','userAgent']){
    assert.equal(serialized.includes(forbidden),false,forbidden+' must never appear');
  }
  assert.equal(serialized.includes('not headset FPS'),true);
});
test('public XR lab has manual explicit export, readable controls and report kept only in memory',()=>{
  const html=text('../public/vr/index.html');
  const app=text('../public/vr/spark-vr-app.js');
  assert.match(html,/id="field-checks"/);
  assert.match(html,/id="field-metrics"/);
  assert.match(html,/id="field-download"/);
  assert.match(html,/id="field-copy"/);
  assert.match(html,/real headset/i);
  assert.match(app,/recordQuestFrame\(questDiagnostics/);
  assert.match(app,/beginQuestDiagnostics\(questDiagnostics/);
  assert.match(app,/endQuestDiagnostics\(questDiagnostics/);
  assert.match(app,/performance\.now\(\)-renderStarted/);
  assert.match(app,/QUEST_ACCEPTANCE_CASES/);
  assert.match(app,/fieldDownload\.addEventListener\('click'/);
  assert.match(app,/fieldCopy\.addEventListener\('click'/);
  assert.match(app,/new Blob\(\[json\]/);
  assert.match(app,/navigator\.clipboard\.writeText/);
  assert.ok(!app.includes('fetch('));
  assert.ok(!app.includes('sendBeacon('));
  assert.ok(!app.includes('XMLHttpRequest'));
  assert.ok(!app.includes('spark-substrate-descent-v2'));
});
