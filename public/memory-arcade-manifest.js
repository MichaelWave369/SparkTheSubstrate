// Archival identity is verified against Git blobs by scripts/preserve-legacy.mjs.
// These are historical bodies, not remakes. The wrapper only supplies isolation.
export const LEGACY_BUILDS = [
  {
    id: 'echo-lives', title: 'Echo Lives', version: '0.1.0', mode: 'echo',
    authenticity: 'authentic', commit: '798613099d38c3a9de7f098ff4d5a617c4e8c048', sourceRoot: 'dist',
    description: 'Before the descent had weight, a body was six decisions. The original choice-driven incarnation.',
    lore: 'A world remembered through choices. Its laws still answer.',
    x: 500, color: '#e7c17d', material: 'ivory',
    discovery: null, clue: 'The first cabinet answers when you enter the Memory Arcade.',
    objective: 'Finish one life: reach the crossing between bodies, or the original awakening.',
    controls: '1–3 choose · click Continue after a choice · click a body at the crossing.',
    completion: 'life-crossing', reward: 'One Archive token. The first completed cabinet remembers the First light trail.',
    thumbnail: '/legacy/echo-lives/worlds.webp', thumbnailLabel: 'Original six-vessel world atlas',
    launch: '/legacy/echo-lives/index.html',
    keys: {left:'a',right:'d',up:'w',down:'s',primary:'1',secondary:'2',power:'3',jump:'Enter',gate:'Enter',dash:'Enter'}
  },
  {
    id: 'first-descent', title: 'First Descent', version: '0.2.0', mode: 'descent',
    authenticity: 'authentic', commit: 'eeca7f3bf167a1880bbd4d15c6d4d4211a4c94e2', sourceRoot: 'dist',
    description: 'The first nine-chamber action stratum. Automatic weapons, old gifts and the original Warden remain.',
    lore: 'The first body that could run. The seams were smaller then.',
    x: 850, color: '#80d8cc', material: 'glass',
    discovery: {room:'glass', x:1450, form:null},
    clue: 'A dim terminal waits past the glass steps in the cleared Glass Causeway. Touch it with E / RT / GATE.',
    objective: 'Clear the historical Glass Causeway. You may keep exploring the original nine rooms afterward.',
    controls: 'WASD / arrows move · Space dash · E gate · 1–3 gifts and old room choices · M map. Auto-fire.',
    completion: 'glass-cleared', reward: 'One Archive token and a lit cabinet pedestal. No journey keys or coins.',
    thumbnail: '/legacy/first-descent/arena.webp', thumbnailLabel: 'Original First Stratum arena atlas',
    launch: '/legacy/first-descent/index.html',
    keys: {left:'a',right:'d',up:'w',down:'s',primary:'1',secondary:'2',power:'3',jump:' ',gate:'e',dash:' '}
  },
  {
    id: 'first-duel', title: 'First Duel', version: '0.12.1', mode: 'duel',
    authenticity: 'authentic', commit: 'e65856cbad5a24df9d292ab896e6bcac1a52aba0', sourceRoot: 'public',
    description: 'The first runnable preserved fighter roster after the start-page repair. Light, heavy and launcher: before the four-strike techniques.',
    lore: 'A discarded fighting body. Its first verbs remain intact.',
    x: 1200, color: '#eba886', material: 'circuit',
    discovery: {room:'machine', x:480, form:'computer'},
    clue: 'Return to the cleared Machine Sepulcher as Computer. The old terminal beside the western ledge knows a discarded fighter.',
    objective: 'Win a complete historical match as Player 1, first to two rounds.',
    controls: 'P1 WASD · F light · G heavy · H launcher · R power · T super · V Focus. P2 arrows, K/L/;, O/P/I.',
    completion: 'duel-won', reward: 'One Archive token and a lit cabinet pedestal. Historical duel coins stay inside this cabinet.',
    thumbnail: '/legacy/first-duel/duel-fighters-v12.webp', thumbnailLabel: 'Preserved first side-view fighter atlas',
    launch: '/legacy/first-duel/index.html',
    keys: {left:'a',right:'d',up:'w',down:'s',primary:'f',secondary:'g',power:'r',jump:'w',gate:'h',dash:'t'}
  },
  {
    id: 'first-sideways', title: 'First Sideways', version: '0.13.0', mode: 'sideways',
    authenticity: 'authentic', commit: '37adc81f6c1ed6211c885e7aac293f7075ba8bca', sourceRoot: 'public',
    description: 'Twenty-seven side rooms before physical coins, merchants, imprints, grabs or throws. The earlier body and its limits are preserved.',
    lore: 'The path before it learned weight. The spark recognizes the silhouette.',
    x: 1550, color: '#aad39a', material: 'root',
    discovery: {room:'nursery', x:1500, form:null},
    clue: 'A small preserved screen waits on the floor in the cleared Mirror Nursery. Vessel resonance remembers the earlier side path.',
    objective: 'Clear the historical side-view Glass Causeway.',
    controls: 'A/D move · Space jump · Shift dash · J strike · K heavy · F power · E gate · Q vessels · M map.',
    completion: 'glass-cleared', reward: 'One Archive token and a lit cabinet pedestal. Its side keys stay in the old body.',
    thumbnail: '/legacy/first-sideways/duel-stages-v128.webp', thumbnailLabel: 'Stage atlas used by the first Sideways build',
    launch: '/legacy/first-sideways/index.html',
    keys: {left:'a',right:'d',up:'w',down:'s',primary:'j',secondary:'k',power:'f',jump:' ',gate:'e',dash:'Shift',vessels:'q'}
  },
  {
    id: 'first-endless', title: 'First Endless', version: '0.9.0', mode: 'endless',
    authenticity: 'authentic', commit: '73d7d9bce0683daf075fd706f6cbad6a75790cc7', sourceRoot: 'public',
    description: 'The first endless floor ladder: original conditions, five-floor guardians and 18-HP checkpoints. Its BEST record remembers a run when that body falls.',
    lore: 'A floor beneath a floor. This body never learned a last chamber.',
    x: 1900, color: '#bea8e8', material: 'fault',
    discovery: {room:'cinder-throne', x:450, form:null},
    clue: 'After the Cinder Regent falls, return to the western floor of the Regent’s Furnace. Its violet terminal remembers the first endless ladder.',
    objective: 'Clear the first five historical floors, including the guardian on floor 5. You can keep descending afterward.',
    controls: 'WASD / arrows move · Space dash · F power · Q vessels · 1–3 gifts · Enter confirms a story card · M map. Auto-fire. Choose gifts and descend at each cleared checkpoint.',
    completion: 'five-floors', reward: 'One Archive token, a lit fault pedestal and the original floor atlas in the gallery. No current coins, keys or seals.',
    thumbnail: '/legacy/first-endless/floors-v5.webp', thumbnailLabel: 'Original stratum floor atlas used by the first Endless build',
    launch: '/legacy/first-endless/index.html',
    keys: {left:'a',right:'d',up:'w',down:'s',primary:'1',secondary:'2',choice3:'3',power:'f',jump:' ',gate:'e',dash:' ',vessels:'q'}
  },
  {
    id: 'first-forge', title: 'First Forge', version: '0.4.0', mode: 'descent',
    authenticity: 'authentic', commit: 'ce6d1fbf8cf5bdc1bbdaddbe6be32f1fb055ea22', sourceRoot: 'public',
    description: 'The early two-slot forge: relics, wards and affordable +1 enhancements. Its original rooms, automatic weapons and story choices remain.',
    lore: 'A broken star that remembers the road. The first forge still answers.',
    x: 2250, color: '#e8b67f', material: 'circuit',
    discovery: {room:'forge', x:420, form:null},
    clue: 'After the Cantor falls, touch the amber terminal on the western floor of the Echo Forge. It remembers the first affordable enhancement.',
    objective: 'Earn essence in a historical life, end that life, then enhance any owned item to +1 in Equipment & forge. The starter Wayfarer Sigil costs 3 essence.',
    controls: 'WASD / arrows move · Space dash · E gate · 1–3 gifts and room choices · M map. Auto-fire. Pause → Let this body go banks the life; open Equipment & forge between lives.',
    completion: 'item-enhanced', reward: 'One Archive token, an amber pedestal and the original equipment atlas in the gallery. Old essence and equipment stay in this cabinet.',
    thumbnail: '/legacy/first-forge/equipment.webp', thumbnailLabel: 'Original relic and ward forge atlas',
    launch: '/legacy/first-forge/index.html',
    keys: {left:'a',right:'d',up:'w',down:'s',primary:'1',secondary:'2',power:'3',jump:' ',gate:'e',dash:' '}
  },
  {
    id: 'first-mastery', title: 'First Mastery', version: '0.7.0', mode: 'descent',
    authenticity: 'authentic', commit: '4cfd6fa79b8bfd19828f0878182375f6f86a906d', sourceRoot: 'public',
    description: 'Six original vessel trees, banked mastery and their first individual powers. Before the first endless dungeon, each body learned a specialty.',
    lore: 'The body falls. The spark remembers. Practice remains after the life.',
    x: 2600, color: '#a9d6c2', material: 'root',
    discovery: {room:'orbit-rest', x:1330, form:'computer'},
    clue: 'At the Moonless Dock, inhabit Computer and read the green terminal on the eastern floor. The older vessel trees are still remembered there.',
    objective: 'Clear two historical chambers as one vessel, end that life and learn a skill in its tree. In the next life, inhabit that vessel and use its power with F.',
    controls: 'WASD / arrows move · Space dash · F vessel power · E gate · Q vessels · 1–3 gifts and room choices · M map. Auto-fire. Learn banked skills between lives.',
    completion: 'learned-skill-powered', reward: 'One Archive token, a root-lit pedestal and the original vessel atlas in the gallery. Old mastery stays in this cabinet.',
    thumbnail: '/legacy/first-mastery/sprites.webp', thumbnailLabel: 'Original six-vessel atlas from the mastery build',
    launch: '/legacy/first-mastery/index.html',
    keys: {left:'a',right:'d',up:'w',down:'s',primary:'1',secondary:'2',choice3:'3',power:'f',jump:' ',gate:'e',dash:' ',vessels:'q'}
  }
];
export const LEGACY_BY_ID = Object.fromEntries(LEGACY_BUILDS.map(build => [build.id, build]));
const lastCabinet = Math.max(...LEGACY_BUILDS.map(build=>build.x));
export const ARCADE_HOOK = {id:'unwritten', title:'The Unwritten', x:lastCabinet+670, authenticity:'fictional-hook', launch:null,
  lore:'No body answers this seal. The socket has never held a preserved incarnation.'};
export const ARCADE_OBJECTS = [{id:'exit',x:80,title:'The Threshold'}, {id:'jukebox',x:250,title:'Sound archive'},
  ...LEGACY_BUILDS.map(build=>({id:build.id,x:build.x,title:build.title})),
  {id:'gallery',x:lastCabinet+320,title:'Archive gallery'}, ARCADE_HOOK];
export const ARCADE_WIDTH = lastCabinet + 930;
export function legacyCompleted(build, proof) {
  if (!proof || typeof proof !== 'object') return false;
  if (build.completion === 'life-crossing') return proof.phase === 'between' || proof.phase === 'ended';
  if (build.completion === 'glass-cleared') return Array.isArray(proof.cleared) && proof.cleared.includes('glass');
  if (build.completion === 'five-floors') return proof.mode === 'dungeon' && Number.isSafeInteger(proof.floorsCleared) && proof.floorsCleared >= 5;
  if (build.completion === 'item-enhanced') return Number.isSafeInteger(proof.livesRemembered) && proof.livesRemembered >= 1 && Number.isSafeInteger(proof.enhancedItems) && proof.enhancedItems >= 1;
  if (build.completion === 'learned-skill-powered') return proof.phase === 'playing' && Number.isSafeInteger(proof.rememberedSkills) && proof.rememberedSkills >= 1 && Number.isSafeInteger(proof.activeSkills) && proof.activeSkills >= 1 && Number.isSafeInteger(proof.powersUsed) && proof.powersUsed >= 1;
  return build.completion === 'duel-won' && proof.phase === 'finished' && proof.winner === 0;
}
