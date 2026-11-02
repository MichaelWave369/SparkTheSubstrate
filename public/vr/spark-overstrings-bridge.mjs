/**
 * Spark × OverStrings first host pilot: harmless in-page visual resonance echo.
 * Uses the MIT licensed OverStrings Rung 5 host adapter.
 *
 * Event data is untrusted and does not authenticate hand tracking.
 * Never modifies canonical Spark combat, progress, rewards, or controller input.
 */
import {HostPreviewAdapter} from "./vendor/overstrings-host-sdk.mjs";

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
  const source=get("overstrings-source"),allowSynthetic=get("overstrings-allow-synthetic");
  const arm=get("overstrings-arm"),stop=get("overstrings-stop"),
    tryDemo=get("overstrings-try-demo"),status=get("overstrings-status"),
    echo=get("overstrings-echo"),symbol=get("overstrings-echo-symbol");
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
  function sync(){
    arm.disabled=bridge.armed;
    stop.disabled=!bridge.armed;
    tryDemo.disabled=!bridge.armed||source.value!=="synthetic"||!allowSynthetic.checked;
  }
  function disarm(message="OverStrings host preview disarmed.") {
    bridge.disarm();status.textContent=message;sync();
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
  for(const control of [source,allowSynthetic]) {
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
  win.addEventListener("blur",()=>disarm("Browser focus lost. Preview disarmed."));
  doc.addEventListener("visibilitychange",()=>{
    if(doc.hidden)disarm("Page hidden. Preview disarmed.");
  });
  win.addEventListener("pagehide",()=>bridge.disarm());
  sync();
  return bridge;
}
