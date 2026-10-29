import {xrSettings} from './spark-xr-input.js';
export const SPELLCRAFT_PREFS_KEY='spark-substrate-xr-spellcraft-prefs-v1';
export const SPELLCRAFT_PREFS_SCHEMA='spark.xr.spellcraft-preferences.v1';
const pick=raw=>{const s=xrSettings(raw);return {combatProfile:s.combatProfile,dominantHand:s.dominantHand,aimAssist:s.aimAssist,throwMode:s.throwMode};};
export function loadSpellcraftPreferences(storage){
 try{const raw=storage?.getItem?.(SPELLCRAFT_PREFS_KEY);if(!raw||raw.length>1024)return pick({});
  const item=JSON.parse(raw);return pick(item?.schema===SPELLCRAFT_PREFS_SCHEMA?item.options:{});
 }catch{return pick({});}
}
export function storeSpellcraftPreferences(storage,settings){
 const options=pick(settings);storage?.setItem?.(SPELLCRAFT_PREFS_KEY,JSON.stringify({schema:SPELLCRAFT_PREFS_SCHEMA,options}));return options;
}
