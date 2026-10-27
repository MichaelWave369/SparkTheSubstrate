// Ergonomic settings are display/input preferences, not gameplay upgrades.
// Values deliberately bounded: cannot exceed native Spark locomotion speed.
export const VR_COMFORT_KEY='spark-substrate-immersive-vr-comfort-v1';
export const VR_COMFORT_DEFAULTS=Object.freeze({
  movement:0.75,turn:30,vignette:0.4
});
const allowed=Object.freeze({
  movement:[0.5,0.75,1],
  turn:[30,45,60],
  vignette:[0,0.4,0.75]
});
export function normalizeVRComfort(settings={}){
  const result={};
  for(const key of Object.keys(allowed)){
    const candidate=Number(settings?.[key]);
    result[key]=allowed[key].includes(candidate)?
      candidate:VR_COMFORT_DEFAULTS[key];
  }
  return result;
}
export function applyVRComfortToMovement(vector,comfort=VR_COMFORT_DEFAULTS){
  const settings=normalizeVRComfort(comfort);
  const x=Number.isFinite(vector?.x)?vector.x:0;
  const y=Number.isFinite(vector?.y)?vector.y:0;
  // Diagonal keyboard input can exceed unit length; normalize first or
  // Spark's engine would cap it at full speed, defeating the comfort setting.
  const length=Math.hypot(x,y),scale=length>1?1/length:1;
  return {x:x*scale*settings.movement,y:y*scale*settings.movement};
}
export function vrSnapRadians(comfort=VR_COMFORT_DEFAULTS){
  return normalizeVRComfort(comfort).turn*Math.PI/180;
}
export function loadVRComfort(storage){
  try{
    const raw=storage?.getItem?.(VR_COMFORT_KEY);
    if(!raw||raw.length>1024)return {...VR_COMFORT_DEFAULTS};
    const item=JSON.parse(raw);
    if(item?.schema!=='spark.vr.comfort.v1'||typeof item.options!=='object')
      return {...VR_COMFORT_DEFAULTS};
    return normalizeVRComfort(item.options);
  }catch{return {...VR_COMFORT_DEFAULTS};}
}
export function storeVRComfort(storage,settings){
  const values=normalizeVRComfort(settings);
  storage?.setItem?.(VR_COMFORT_KEY,JSON.stringify({
    schema:'spark.vr.comfort.v1',options:values
  }));
  return values;
}
