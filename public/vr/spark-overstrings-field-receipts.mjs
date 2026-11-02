/**
 * OverStrings × Spark: private, aggregate-only Quest optical field receipts.
 * Rung 8 candidate. MIT. No pose, identity, biometric template, raw timing
 * trace, network request, persistent storage or automatic upload.
 *
 * Coverage is the proportion of *sampled, opt-in* XRFrames with valid
 * reported XRHand joints. It is NOT hardware accuracy or recognition recall.
 */
export const FIELD_RECEIPT_SCHEMA="spark.overstrings.field-receipt.v1";
import {OPTICAL_SOURCE_STATES} from "./spark-overstrings-hands.mjs";
const RECEIPT_SOURCE_STATES=Object.freeze([...OPTICAL_SOURCE_STATES,"unknown_untracked"]);
const SIDES=Object.freeze(["left","right"]);
const ANNOTATIONS=Object.freeze(["correct_echo","missed_pinch","unexpected_echo","unreadable_hud"]);
const MAX_COUNT=1000000;
function boundedIncrement(n){return Math.min(MAX_COUNT,n+1);}
function validTime(t){return Number.isFinite(t)&&t>=0&&t<=Number.MAX_SAFE_INTEGER;}
function counters(){return {left:0,right:0};}
function sourceCounters(){return Object.fromEntries(SIDES.map(side=>[side,
  Object.fromEntries(RECEIPT_SOURCE_STATES.map(key=>[key,0]))]));}
export class SparkOpticalFieldReceipt {
  constructor({now=()=>globalThis.performance?.now?.()??0}={}) {
    if(typeof now!=="function")throw new TypeError("Expected monotonic clock function");
    this.now=now;this.clear();
  }
  clear(){
    this.phase="idle";this.source=null;this.startAt=null;this.endAt=null;
    this.reason=null;this.frames=0;this.observed=counters();this.dropouts=counters();
    this.pinches=counters();this.echoes=counters();
    this.statusCounts=sourceCounters();
    this.annotations=Object.fromEntries(ANNOTATIONS.map(a=>[a,0]));
    this.previous={left:false,right:false};this.ever={left:false,right:false};
    this.lastSample=null;
  }
  start({source="webxr",time=this.now()}={}) {
    // No synthetic diagnostic receipts pretending to be headset evidence.
    if(source!=="webxr"||!validTime(time))return false;
    this.clear();this.phase="recording";this.source="webxr";
    this.startAt=time;return true;
  }
  sample({time=this.now(),tracked,statuses=null}={}) {
    if(this.phase!=="recording"||!validTime(time)||time<this.startAt||
       !tracked||typeof tracked!=="object"||
       typeof tracked.left!=="boolean"||typeof tracked.right!=="boolean"||
       (this.lastSample!==null&&time<this.lastSample))return false;
    const codes={left:tracked.left?"valid":"unknown_untracked",
      right:tracked.right?"valid":"unknown_untracked"};
    if(statuses!==null) {
      if(!statuses||typeof statuses!=="object")return false;
      for(const side of SIDES){
        const code=statuses[side];
        if(!RECEIPT_SOURCE_STATES.includes(code) ||
           (code==="valid")!==tracked[side])return false;
        codes[side]=code;
      }
    }
    this.frames=boundedIncrement(this.frames);
    for(const side of SIDES) {
      this.statusCounts[side][codes[side]]=boundedIncrement(this.statusCounts[side][codes[side]]);
      if(tracked[side]) {
        this.observed[side]=boundedIncrement(this.observed[side]);
        this.ever[side]=true;
      } else if(this.previous[side]&&this.ever[side])
        this.dropouts[side]=boundedIncrement(this.dropouts[side]);
      this.previous[side]=tracked[side];
    }
    this.lastSample=time;
    return true;
  }
  gesture({handedness,gesture,phase,source}={}) {
    if(this.phase!=="recording"||source!=="webxr"||gesture!=="pinch"||
       phase!=="start"||!SIDES.includes(handedness))return false;
    this.pinches[handedness]=boundedIncrement(this.pinches[handedness]);
    return true;
  }
  echo({handedness,source}={}) {
    if(this.phase!=="recording"||source!=="webxr"||!SIDES.includes(handedness))
      return false;
    this.echoes[handedness]=boundedIncrement(this.echoes[handedness]);
    return true;
  }
  end(reason="xr_session_end",time=this.now()){
    if(this.phase!=="recording")return false;
    if(typeof reason!=="string"||!["xr_session_end","one_shot_echo","manual_disarm","tracking_interrupted","xr_entry_failed"].includes(reason))
      reason="xr_session_end";
    this.phase="complete";this.reason=reason;
    this.endAt=validTime(time)?Math.max(time,this.startAt):this.startAt;
    return true;
  }
  annotate(kind) {
    // Explicit human observation, not estimated from XR events.
    if(this.phase!=="complete"||!ANNOTATIONS.includes(kind))return false;
    this.annotations[kind]=boundedIncrement(this.annotations[kind]);
    return true;
  }
  get summary(){
    if(this.phase==="idle")return null;
    const elapsed=(this.phase==="recording"?this.now():this.endAt)-this.startAt;
    const coverage=Object.fromEntries(SIDES.map(side=>[side,
      this.frames?Math.round(100*this.observed[side]/this.frames):null]));
    return {
      schema:FIELD_RECEIPT_SCHEMA,version:1,source:this.source,
      phase:this.phase,stop_reason:this.reason,
      duration_ms:Math.max(0,Math.min(3600000,Math.round(Number.isFinite(elapsed)?elapsed:0))),
      sampled_frames:this.frames,
      reported_hand_frames:{...this.observed},
      reported_source_states:Object.fromEntries(SIDES.map(side=>[side,{...this.statusCounts[side]}])),
      observed_frame_percent:coverage,
      hand_tracking_dropouts:{...this.dropouts},
      detected_pinch_starts:{...this.pinches},
      accepted_visual_echoes:{...this.echoes},
      manual_notes:{...this.annotations},
      limits:"Source-state buckets describe this WebXR callback, not verified hardware root causes. Counts only during an armed WebXR preview; first accepted echo ends capture. Presence is not sensor precision or gesture accuracy. Manual notes are not automatically verified.",
      privacy:"Aggregate only; no raw poses, movement paths, camera, session times, account identifiers or uploads."
    };
  }
  exportJSON(){
    const report=this.summary;
    if(!report)throw new Error("No field trial recorded");
    return JSON.stringify(report,null,2)+"\n";
  }
}
