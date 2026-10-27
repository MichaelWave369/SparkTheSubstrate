// Separate browser-local progress for immersive Spark; never reads/writes
// the canonical Descent campaign, Sideways, Vault or online credential keys.
import {validMeta,validRun} from '../action-engine.js?v=0.17.0';
import {resumeVRPreview} from './spark-vr-model.js';

export const VR_SAVE_KEY='spark-substrate-immersive-vr-v1';
export const VR_SAVE_SCHEMA='spark.vr.local-checkpoint.v1';
const MAX_CHECKPOINT_BYTES=512*1024;

export function saveVRCheckpoint(storage,state){
  if(!storage?.setItem||!state?.meta||!state?.run||
    !validMeta(state.meta)||!validRun(state.run)||state.run.partner||
    state.run.daily||state.run.dungeon||state.run.rematch)
    throw Error('Refusing to save an invalid or non-solo VR journey.');
  const item={
    schema:VR_SAVE_SCHEMA,
    timestamp:new Date().toISOString(),
    meta:state.meta,
    run:state.run
  };
  const text=JSON.stringify(item);
  if(text.length>MAX_CHECKPOINT_BYTES)
    throw Error('VR checkpoint exceeds the local storage budget.');
  storage.setItem(VR_SAVE_KEY,text);
  return {room:state.run.room,phase:state.run.phase};
}

export function loadVRCheckpoint(storage){
  const raw=storage?.getItem?.(VR_SAVE_KEY);
  if(!raw)return null;
  if(raw.length>MAX_CHECKPOINT_BYTES)throw Error('Saved VR checkpoint is too large.');
  let item;
  try{item=JSON.parse(raw);}
  catch{throw Error('Saved VR checkpoint is corrupt. Start a new VR run.');}
  if(item?.schema!==VR_SAVE_SCHEMA||!item.meta||!item.run||
    !validMeta(item.meta)||!validRun(item.run)||
    item.run.partner||item.run.daily||item.run.dungeon||item.run.rematch)
    throw Error('Saved VR checkpoint is incompatible with this Spark release.');
  return resumeVRPreview(item.meta,item.run);
}

export function clearVRCheckpoint(storage){
  storage?.removeItem?.(VR_SAVE_KEY);
}
