/**
 * Spark × OverStrings first host pilot: harmless in-page visual resonance echo.
 * Uses the MIT licensed OverStrings Rung 5 host adapter.
 *
 * Event data is untrusted and does not authenticate hand tracking.
 * Never modifies canonical Spark combat, progress, rewards, or controller input.
 */
import {HostPreviewAdapter} from "./vendor/overstrings-host-sdk.mjs";
import {SparkOpticalHandObserver} from "./spark-overstrings-hands.mjs";
import {SparkOpticalFieldHud} from "./spark-overstrings-field-hud.mjs";
import {SparkOpticalFieldReceipt} from "./spark-overstrings-field-receipts.mjs";

export const SPARK_ECHO_SCHEMA="spark.overstrings.echo.v1";

export function createSparkEchoBridge({onEcho=()=>{}}={}) {
  if(typeof onEcho!=="function") throw new TypeError("onEcho must be a function");
  const adapter=new HostPreviewAdapter({onPreview:preview=>{
    // This is intentionally a visual-only callback.
    onEcho(Object.freeze({
      schema:SPARK_ECHO_SCHEMA,
      text:"Resonance echo",
      action_id:preview.action_id,
      source:preview.source,
      sequence:preview.sequence
    }));
  }});
  let demoSequence=0;
  return Object.freeze({
    arm({source="webxr",allowSyntheticDemo=false}={}) {
      adapter.configure({hostId:"spark",source,allowSyntheticDemo});
      return adapter.arm();
    },
    disarm(){adapter.disarm();},
    get armed(){return adapter.armed===true;},
    receive(intent,nowMs) {return adapter.accept(intent,nowMs);},
    livePinch(nowMs,handedness) {
      if(!Number.isFinite(nowMs)||nowMs<0||!["left","right"].includes(handedness))
        return {accepted:false,reason:"invalid_live_pinch"};
      // Heuristic optical-hand preview, NOT a verified Rung 3 motion phrase.
      const intent={
        schema:"overstrings.action-intent.v1",version:1,advisory:true,mode:"practice",
        action_id:"spark.cast",source:"webxr",
        template_label:"Live "+handedness+" pinch heuristic (not learned)",
        sequence:++demoSequence,timestamp_ms:Math.round(nowMs)
      };
      return adapter.accept(intent,nowMs);
    },
    syntheticDemo(nowMs) {
      if(!Number.isFinite(nowMs)||nowMs<0)return {accepted:false,reason:"invalid_clock"};
      // Generated only by explicit browser button; always labeled synthetic.
      const intent={
        schema:"overstrings.action-intent.v1",version:1,advisory:true,mode:"practice",
        action_id:"spark.cast",source:"synthetic",template_label:"Synthetic Spark preview",
        sequence:++demoSequence,timestamp_ms:Math.round(nowMs)
      };
      return adapter.accept(intent,nowMs);
    }
  });
}

/** Mounts on the standalone Spark VR landing page, not inside gameplay logic. */
export function mountSparkEchoPilot(doc=globalThis.document,win=globalThis.window) {
  const root=doc?.getElementById?.("overstrings-pilot");
  if(!root)return null; // Other Spark entry routes remain untouched.
  const get=id=>doc.getElementById(id);
  const source=get("overstrings-source"),allowSynthetic=get("overstrings-allow-synthetic"),
    headsetHudToggle=get("overstrings-headset-hud");
  const arm=get("overstrings-arm"),stop=get("overstrings-stop"),
    tryDemo=get("overstrings-try-demo"),status=get("overstrings-status"),
    echo=get("overstrings-echo"),symbol=get("overstrings-echo-symbol");
  const receiptConsent=get("overstrings-receipt-consent"),
    receiptStatus=get("overstrings-receipt-status"),
    copyReceipt=get("overstrings-receipt-copy"),
    downloadReceipt=get("overstrings-receipt-download"),
    clearReceipt=get("overstrings-receipt-clear"); 
  const fieldTrial=new SparkOpticalFieldReceipt({now:()=>win.performance.now()});
  let nextReceiptUi=-Infinity;
  function refreshReceipt() {
    const sample=fieldTrial.summary,complete=sample?.phase==="complete";
    copyReceipt.disabled=!complete;
    downloadReceipt.disabled=!complete;
    clearReceipt.disabled=!sample;
    for(const button of root.querySelectorAll("[data-overstrings-note]"))
      button.disabled=!complete;
    if(!sample) {
      receiptStatus.textContent="No Quest hand trial recorded. Nothing is saved or uploaded.";
      return;
    }
    const ratio=side=>sample.observed_frame_percent[side]===null?
      "n/a":sample.observed_frame_percent[side]+"%";
    receiptStatus.textContent=
      "Trial: "+sample.phase+" ("+(sample.stop_reason||"armed preview")+")"+
      "\nSampled frames: "+sample.sampled_frames+
      "  |  Duration: "+(sample.duration_ms/1000).toFixed(1)+"s"+
      "\nReported XRHand: L "+sample.reported_hand_frames.left+" ("+ratio("left")+
      "), R "+sample.reported_hand_frames.right+" ("+ratio("right")+")"+
      "\nOptical source states (sample counts, not proven causes):"+
      ["valid","no_hand_source","no_joint_api","missing_required_joints","emulated_required_pose","unavailable_frame"].map(code=>
        "\n  "+code+": L "+sample.reported_source_states.left[code]+
        ", R "+sample.reported_source_states.right[code]).join("")+
      "\nTracking dropouts: L "+sample.hand_tracking_dropouts.left+
      ", R "+sample.hand_tracking_dropouts.right+
      "\nPinch starts: L "+sample.detected_pinch_starts.left+
      ", R "+sample.detected_pinch_starts.right+
      "\nAccepted echo: L "+sample.accepted_visual_echoes.left+
      ", R "+sample.accepted_visual_echoes.right+
      "\nYour notes: correct "+sample.manual_notes.correct_echo+
      ", missed "+sample.manual_notes.missed_pinch+
      ", unexpected "+sample.manual_notes.unexpected_echo+
      ", hard to read "+sample.manual_notes.unreadable_hud+
      "\nThese are sample counts, NOT verified hardware or recognition accuracy.";
  }
  refreshReceipt();
  for(const button of root.querySelectorAll("[data-overstrings-note]")){
    button.addEventListener("click",()=>{
      if(fieldTrial.annotate(button.dataset.overstringsNote))refreshReceipt();
    });
  }
  clearReceipt.addEventListener("click",()=>{fieldTrial.clear();refreshReceipt();});
  copyReceipt.addEventListener("click",async()=>{
    try {
      await win.navigator.clipboard.writeText(fieldTrial.exportJSON());
      status.textContent="Field receipt copied locally. No network upload.";
    } catch {
      status.textContent="Clipboard unavailable in this browser; use Download JSON instead.";
    }
  });
  downloadReceipt.addEventListener("click",()=>{
    if(fieldTrial.summary?.phase!=="complete")return;
    const blob=new Blob([fieldTrial.exportJSON()],{type:"application/json"});
    const url=win.URL.createObjectURL(blob);
    const link=doc.createElement("a");
    link.href=url;link.download="spark-overstrings-quest-field-receipt.json";
    link.click();
    win.setTimeout(()=>win.URL.revokeObjectURL(url),1000);
    status.textContent="Local field receipt download initiated. No upload or tracking coordinates.";
  });
  const onEcho=preview=>{
    if(echo) {
      echo.hidden=false;
      if(symbol)symbol.textContent="✧";
      get("overstrings-echo-label").textContent=preview.text+" · "+preview.source;
    }
    status.textContent="ONE VISUAL ECHO: "+preview.action_id+
      ". No spell damage, gameplay event or controller change.";
  };
  const bridge=createSparkEchoBridge({onEcho});
  const fieldHud=new SparkOpticalFieldHud({now:()=>win.performance.now(),enabled:false});
  let xrEntryPending=false;
  const opticalStatus=get("overstrings-optical-status");
  const observer=new SparkOpticalHandObserver({
    isArmed:()=>bridge.armed&&source.value==="webxr",
    onSample:({tracked,statuses})=>{
      if(fieldTrial.sample({time:win.performance.now(),tracked,statuses}) &&
         win.performance.now()>=nextReceiptUi) {
        nextReceiptUi=win.performance.now()+450;refreshReceipt();
      }
    },
    onStatus:message=>{
      if(opticalStatus)opticalStatus.textContent=message;
      fieldHud.noteOpticalStatus(message,win.performance.now());
    },
    onGesture:gesture=>{
      fieldTrial.gesture(gesture);
      if(gesture.gesture==="pinch"&&gesture.phase==="start"&&
         source.value==="webxr"&&bridge.armed) {
        const time=win.performance.now();
        const result=bridge.livePinch(time,gesture.handedness);
        if(result.accepted){
          fieldHud.noteEcho(gesture.handedness,time);
          fieldTrial.echo({handedness:gesture.handedness,source:"webxr"});
          fieldTrial.end("one_shot_echo",time);
          refreshReceipt();
        }
        showResult(result);
      }
    }
  });
  function sync(){
    arm.disabled=bridge.armed;
    stop.disabled=!bridge.armed;
    tryDemo.disabled=!bridge.armed||source.value!=="synthetic"||!allowSynthetic.checked;
  }
  function disarm(message="OverStrings host preview disarmed.") {
    fieldTrial.end("manual_disarm",win.performance.now());
    bridge.disarm();fieldHud.clear();status.textContent=message;sync();
    refreshReceipt();
  }
  function showResult(result) {
    sync();
    if(!result.accepted)status.textContent="No echo: "+result.reason+
      ". One-shot was consumed; arm again to retry.";
  }
  arm.addEventListener("click",()=>{
    const result=bridge.arm({
      source:source.value,
      allowSyntheticDemo:allowSynthetic.checked
    });
    status.textContent=result.armed?
      "One local Spark echo armed. Awaiting same-page input for "+source.value+".":
      "Not armed: "+result.reason+". Synthetic mode needs separate opt-in.";
    sync();
  });
  stop.addEventListener("click",()=>disarm());
  for(const control of [source,allowSynthetic,headsetHudToggle,receiptConsent]) {
    control.addEventListener("change",()=>disarm("Input mode changed. Arm again to approve."));
  }
  tryDemo.addEventListener("click",()=>{
    if(!bridge.armed)return;
    showResult(bridge.syntheticDemo(win.performance.now()));
  });
  const onIntent=event=>{
    if(!bridge.armed)return;
    // A same-page browser CustomEvent is forgeable; allow visual-only effect.
    showResult(bridge.receive(event?.detail,win.performance.now()));
  };
  win.addEventListener("overstrings:action-intent",onIntent);
  win.addEventListener("blur",()=>{
    if(!xrEntryPending&&!observer.sessionActive)
      disarm("Browser focus lost. Preview disarmed.");
  });
  doc.addEventListener("visibilitychange",()=>{
    if(doc.hidden&&!xrEntryPending&&!observer.sessionActive)disarm("Page hidden. Preview disarmed.");
  });
  win.addEventListener("pagehide",()=>bridge.disarm());
  sync();
  return Object.freeze({
    arm:bridge.arm,disarm:bridge.disarm,receive:bridge.receive,
    get armed(){return bridge.armed;},
    wantsHandTracking:()=>bridge.armed&&source.value==="webxr",
    beforeXREntry(){
      xrEntryPending=bridge.armed&&source.value==="webxr";
      fieldHud.setEnabled(xrEntryPending&&headsetHudToggle.checked);
    },
    afterXREntry(success) {
      xrEntryPending=false;
      if(!success)disarm("VR entry failed or cancelled. Re-arm optical preview.");
    },
    sessionStart(){
      if(receiptConsent.checked && source.value==="webxr" && bridge.armed)
        fieldTrial.start({source:"webxr",time:win.performance.now()});
      observer.sessionStart();
      refreshReceipt();
    },
    sessionEnd(){
      fieldTrial.end("xr_session_end",win.performance.now());
      observer.sessionEnd();
      disarm("XR session ended. Re-arm before another optical gesture.");
    },
    visibilityLost(){
      fieldTrial.end("tracking_interrupted",win.performance.now());
      disarm("XR visibility interrupted. Optical preview disarmed.");
    },
    observeXRFrame:payload=>observer.observe(payload),
    hudMessage:(time,scene)=>observer.sessionActive&&source.value==="webxr"?
      fieldHud.messageForScene(scene,time):null
  });
}
