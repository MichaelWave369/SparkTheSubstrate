import {LEGACY_BUILDS, LEGACY_BY_ID, ARCADE_WIDTH, legacyCompleted} from './memory-arcade-manifest.js?v=0.17.0';
export const ARCADE_KEY = 'spark-substrate-memory-arcade-v1';
export const legacyStorageKey = id => {
  if (!LEGACY_BY_ID[id]) throw Error('Unknown preserved body.');
  return 'spark-substrate-legacy-' + id + '-v1';
};
export function cleanArcade(raw) {
  const valid = list => [...new Set((Array.isArray(list)?list:[]).filter(id=>LEGACY_BY_ID[id]))];
  const discovered = valid(raw?.discovered); if(!discovered.includes('echo-lives')) discovered.unshift('echo-lives');
  const completed = valid(raw?.completed).filter(id=>discovered.includes(id));
  return {version:1, entered:!!raw?.entered, discovered, completed,
    trail:completed.length>0 && !!raw?.trail, x:Number.isFinite(raw?.x)?Math.max(80,Math.min(ARCADE_WIDTH-100,raw.x)):125};
}
export function loadArcade(storage) {try {return cleanArcade(JSON.parse(storage.getItem(ARCADE_KEY)??'null'));}catch{return cleanArcade(null);}}
export function saveArcade(storage,state) {storage.setItem(ARCADE_KEY,JSON.stringify(cleanArcade(state)));}
export function discoverLegacy(state,id,journey) {
  const b=LEGACY_BY_ID[id], d=b?.discovery;
  if(!d || state.discovered.includes(id) || !journey || journey.phase!=='playing' || journey.room!==d.room ||
    !journey.cleared.includes(d.room) || journey.enemies.some(e=>e.hp>0) || d.form&&journey.form!==d.form ||
    Math.hypot(journey.player.x-d.x,journey.player.y-620)>100) return false;
  state.discovered.push(id); return true;
}
export function completeLegacy(state,id,proof) {
  const build=LEGACY_BY_ID[id];
  if(!build || !state.discovered.includes(id) || !legacyCompleted(build,proof) || state.completed.includes(id)) return false;
  state.completed.push(id); if(state.completed.length===1) state.trail=true; return true;
}
// An opaque sandbox sees only this dictionary, never the parent Storage object.
export function cleanLegacyStore(raw) {
  if(!raw || typeof raw!=='object' || Array.isArray(raw) || Object.keys(raw).length>32) return null;
  const clean=Object.create(null);let bytes=0;
  for(const [key,value] of Object.entries(raw)) {
    if(typeof value!=='string'||key.length>160||value.length>1_000_000) return null;
    bytes+=key.length+value.length;if(bytes>2_000_000)return null;clean[key]=value;
  }
  return clean;
}
export function loadLegacyStore(storage,id) {try {return cleanLegacyStore(JSON.parse(storage.getItem(legacyStorageKey(id))??'{}'))??Object.create(null);}catch{return Object.create(null);}}
export function saveLegacyStore(storage,id,raw) {const clean=cleanLegacyStore(raw);if(!clean)throw Error('The preserved save is damaged or too large.');storage.setItem(legacyStorageKey(id),JSON.stringify(clean));return clean;}
export const arcadeTokens = state => state.completed.length;
export const arcadeJournal = state => LEGACY_BUILDS.map(b=>({id:b.id,title:b.title,found:state.discovered.includes(b.id),text:b.clue}));
