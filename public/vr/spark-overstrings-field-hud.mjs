/**
 * Spark × OverStrings: short optical feedback in the EXISTING stereo HUD.
 *
 * The existing Spark renderer and its protected runtime remain unchanged.
 * The wrapper only annotates an ephemeral *render-only copy* of a scene.
 * No new WebGL programs, extra framebuffers, game commands, networking,
 * persistent consent, tracking data storage or gameplay-state mutations.
 * MIT license.
 */
export class SparkOpticalFieldHud {
  constructor({now=()=>globalThis.performance?.now?.()??0,enabled=true,ttlMs=1600}={}) {
    if(typeof now!=="function" || typeof enabled!=="boolean" ||
      !Number.isFinite(ttlMs)||ttlMs<400||ttlMs>3000)
      throw new TypeError("Invalid optical field HUD settings");
    this.now=now;
    this.enabled=enabled;
    this.ttlMs=ttlMs;
    this.clear();
  }
  clear() {
    this.message=null;
    this.expiresAt=-Infinity;
    this.echoActive=false;
    this.lastSignal="";
  }
  setEnabled(value) {
    this.enabled=value===true;
    if(!this.enabled)this.clear();
  }
  announce(text,timeMs=this.now(),{echo=false}={}) {
    if(!this.enabled || !Number.isFinite(timeMs) || timeMs<0)return false;
    if(this.echoActive && timeMs<this.expiresAt && !echo)return false;
    if(typeof text!=="string"||!text.trim()||text.length>90)return false;
    this.message=text;
    this.expiresAt=timeMs+this.ttlMs;
    this.echoActive=echo;
    return true;
  }
  noteOpticalStatus(message,timeMs=this.now()) {
    if(typeof message!=="string"||!this.enabled)return false;
    let label=null;
    if(message.startsWith("XR session started"))label="OVERSTRINGS / SEARCHING FOR HANDS";
    else if(message.startsWith("No real XRHand joints"))label="OVERSTRINGS / NO OPTICAL HANDS";
    else if(message.startsWith("Optical joints:")) {
      // Only derive a simple on/off/gesture status; never pass raw pose text.
      const left=/left\s+(pinch|open|point|grab|neutral)/.exec(message)?.[1]||"untracked";
      const right=/right\s+(pinch|open|point|grab|neutral)/.exec(message)?.[1]||"untracked";
      label="OVERSTRINGS / L "+left.toUpperCase()+" · R "+right.toUpperCase();
    }
    if(!label || label===this.lastSignal)return false;
    this.lastSignal=label;
    return this.announce(label,timeMs);
  }
  noteEcho(hand,timeMs=this.now()) {
    if(!["left","right"].includes(hand))return false;
    return this.announce("OVERSTRINGS / "+hand.toUpperCase()+" PINCH · ECHO",timeMs,{echo:true});
  }
  messageForScene(scene,timeMs=this.now()) {
    if(!this.enabled||!scene||typeof scene!=="object"||
      scene.paused===true||scene.calibration===true||
      (typeof scene.statusMessage==="string"&&scene.statusMessage.trim()) ||
      !scene.panel||!Number.isFinite(timeMs)||timeMs>=this.expiresAt)
      return null;
    return this.message;
  }
}

/** Wrap only the instance's renderer factory, not its protected source file. */
export function installSparkOpticalFieldHud(runtime,pilot,{now=()=>globalThis.performance?.now?.()??0}={}) {
  if(!runtime||typeof runtime.makeRenderer!=="function"||
     !pilot||typeof pilot.hudMessage!=="function"||typeof now!=="function")
    throw new TypeError("Expected Spark runtime and local optical pilot");
  const original=runtime.makeRenderer;
  runtime.makeRenderer=(canvas)=>{
    const renderer=original(canvas);
    if(!renderer||typeof renderer.render!=="function")return renderer;
    const render=renderer.render;
    renderer.render=function(views,scene,options) {
      // Only stereo immersive views and only when the ordinary HUD already has
      // a placement. Never replace a high-priority Spark alert or pause screen.
      let text=null;
      if(runtime.mode==="xr" && Array.isArray(views)&&views.length===2 &&
         options?.hudPose && scene?.panel && !scene?.statusMessage) {
        try {text=pilot.hudMessage(now(),scene);} catch {/* fail open to normal rendering */}
      }
      const presentation=text?{...scene,statusMessage:text}:scene;
      return render.call(this,views,presentation,options);
    };
    return renderer;
  };
  return ()=>{runtime.makeRenderer=original;};
}
