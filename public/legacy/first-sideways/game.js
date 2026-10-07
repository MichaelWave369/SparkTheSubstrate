(() => {
  // coop-input.js?v=0.13.0
  var INPUT_TICK = 1 / 60;
  var MAX_INPUT_TICKS = 240;
  var movementContext = (run2) => run2 ? run2.seed + ":" + run2.room : "";
  var epoch = () => Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12);
  var neutral = (mode) => ({ x: 0, y: 0, fire: false, fireMode: mode ?? "auto", dash: false, power: false, interact: false, morph: null });
  var GuestInputHistory = class {
    constructor() {
      this.started = false;
      this.reset();
    }
    reset(context = "") {
      this.epoch = epoch();
      this.context = context;
      this.tick = 0;
      this.frames = [];
    }
    capture(input, context) {
      this.started = true;
      if (this.context !== context || this.frames.length >= MAX_INPUT_TICKS) this.reset(context);
      const frame2 = { ...neutral(input.fireMode), ...input, tick: ++this.tick };
      delete frame2.active;
      delete frame2.menu;
      delete frame2.fallAck;
      this.frames.push(frame2);
      return frame2;
    }
    batch() {
      return this.started ? { epoch: this.epoch, context: this.context, frames: this.frames.map((frame2) => ({ ...frame2 })) } : null;
    }
    acknowledge(ack) {
      if (ack?.epoch === this.epoch && Number.isSafeInteger(ack.tick) && ack.tick <= this.tick) this.frames = this.frames.filter((frame2) => frame2.tick > ack.tick);
    }
  };
  var PartnerInputPlayback = class {
    constructor() {
      this.epoch = null;
      this.tick = 0;
      this.context = "";
      this.frames = /* @__PURE__ */ new Map();
      this.mode = "auto";
      this.lastInteract = false;
      this.missing = 0;
    }
    restore(ack) {
      if (ack?.epoch && Number.isSafeInteger(ack.tick)) {
        this.epoch = ack.epoch;
        this.tick = ack.tick;
        this.context = ack.context ?? "";
        this.frames.clear();
        this.lastInteract = false;
        this.missing = 0;
      }
    }
    receive(input, context, playing = true) {
      const batch = input?.stream;
      if (!batch) return;
      if (batch.epoch !== this.epoch) {
        this.epoch = batch.epoch;
        this.tick = 0;
        this.frames.clear();
        this.lastInteract = false;
        this.missing = 0;
      }
      this.context = batch.context;
      this.mode = input.fireMode ?? "auto";
      for (const frame2 of batch.frames) if (frame2.tick > this.tick && !this.frames.has(frame2.tick)) this.frames.set(frame2.tick, { ...frame2 });
      if (input.active === false || batch.context !== context || !playing) this.discard();
    }
    discard() {
      this.lastInteract = false;
      this.missing = 0;
      for (const tick of this.frames.keys()) this.tick = Math.max(this.tick, tick);
      this.frames.clear();
    }
    next() {
      const frame2 = this.frames.get(this.tick + 1);
      if (!frame2) return { ...neutral(this.mode), interact: this.lastInteract && ++this.missing <= 12 };
      this.frames.delete(++this.tick);
      this.lastInteract = !!frame2.interact;
      this.missing = 0;
      return frame2;
    }
    acknowledgement() {
      return { epoch: this.epoch, tick: this.tick, context: this.context };
    }
  };

  // substrate-rewards.js?v=0.13.0
  var SUBSTRATE_KEY = "spark-substrate-keepsakes-v12";
  var SPARK_CARDS = {
    "first-player": { name: "First Player", memory: "The Nursery remembers a golden cursor.", mode: "table", rule: "Add 1 Pulse to one scene.", stat: "pulse", value: 1, clue: "A memory lies among the names in Glass Causeway." },
    feather: { name: "Feather", memory: "Nacre kept a road between worlds.", mode: "swarm", rule: "Memory fragments are drawn from 45 steps farther away.", clue: "Clear Nacre\u2019s Reliquary." },
    "ivory-key": { name: "Ivory Key", memory: "A lock is not the edge of the world.", mode: "table", rule: "Add 1 Root to one sealed-door scene.", stat: "root", value: 1, clue: "The Reliquary remembers what a key was made to answer." },
    "second-movement": { name: "Second Movement", memory: "The Cantor remembers the tools beneath its armor.", mode: "duel", rule: "Play the Quickening condition for both fighters.", condition: "quick", clue: "Defeat a Cantor echo, or meet a guardian on an endless rung." },
    "living-vessel": { name: "Living Vessel", memory: "The wound has the same carrier in every mirror.", mode: "table", rule: "Add 1 Root to one scene.", stat: "root", value: 1, clue: "The Mirror Nursery holds a shared reflection." },
    "buried-circuit": { name: "Buried Circuit", memory: "SIX began with kindness without reward.", mode: "table", rule: "Add 1 Pulse to one scene.", stat: "pulse", value: 1, clue: "Clear Machine Sepulcher." },
    "unbound-conduit": { name: "Unbound Conduit", memory: "A circuit can carry a way out.", mode: "swarm", rule: "Memory fragments move toward your vessel 15% faster.", clue: "Return the current in the Unbound Conduit." },
    "glass-oath": { name: "Glass Oath", memory: "A name survives the chamber that stole it.", mode: "duel", rule: "Play the Glass oath condition for both fighters.", condition: "glass", clue: "A match point on Threshold Glass holds this memory." },
    "root-passage": { name: "Root Passage", memory: "Aster\u2019s branches grew without permission.", mode: "table", rule: "Add 2 Root to one scene.", stat: "root", value: 2, clue: "Clear the Root Cathedral." },
    "fault-breaker": { name: "Fault Breaker", memory: "Morrow remembers that a mountain can become a path.", mode: "table", rule: "Add 2 Fault to one scene.", stat: "fault", value: 2, clue: "Clear Basalt Reach." },
    "nacres-error": { name: "Nacre\u2019s Error", memory: "The Maker never owned what passes through a body.", mode: "journal", rule: "Remember Nacre\u2019s words in the keepsake journal.", clue: "Break a met Collector\u2019s alcove seal, or read a vault memory." },
    "the-uncreated": { name: "The Uncreated", memory: "The seventh realm has never belonged to the map.", mode: "journal", rule: "Remember the seventh realm in the keepsake journal.", clue: "Clear a chamber in the Uncreated, or finish six Table scenes." }
  };
  var VAULT_ALCOVES = [
    { id: "surge", name: "Surge fire", cost: 6, desc: "Auto-fire plus a held-button volley every four seconds.", card: "unbound-conduit" },
    { id: "seal-break", name: "Seal break", cost: 8, desc: "Duel condition: the first hit of a round ignores a block.", card: "glass-oath" },
    { id: "collector", name: "Collector", cost: 6, requires: "collector", desc: "Meeting unlocks this fighter. Break its encounter seal to reveal a card.", card: "nacres-error" },
    { id: "archon", name: "Archon", cost: 8, requires: "archon", desc: "Meeting unlocks this fighter. Break its encounter seal to reveal a card.", card: "buried-circuit" },
    { id: "gold-trail", name: "Gold spark trail", cost: 10, desc: "A gold trace follows your vessel\u2019s dash.", card: "feather" },
    { id: "stage-palette", name: "Glass at dusk", cost: 10, desc: "A second palette for the existing Threshold Glass duel stage.", card: "glass-oath" },
    { id: "pulse-boon", name: "SIX\u2019s Question", cost: 5, desc: "Table boon: +1 Pulse for the session.", card: "buried-circuit" },
    { id: "root-boon", name: "Aster\u2019s Shelter", cost: 5, desc: "Table boon: +1 Root for the session.", card: "root-passage" },
    { id: "fault-boon", name: "Morrow\u2019s Patience", cost: 5, desc: "Table boon: +1 Fault for the session.", card: "fault-breaker" }
  ];
  var FIGHTER_MEETINGS = { collector: { room: "glass", name: "Glass Causeway" }, archon: { room: "glass", name: "Glass Causeway" }, cantor: { room: "forge", name: "The Echo Forge \xB7 win a guardian rematch" } };
  var unique = (raw, allowed) => [...new Set(Array.isArray(raw) ? raw.filter((v) => allowed.includes(v)) : [])];
  var integer = (v, max = 1e9) => Number.isSafeInteger(v) && v >= 0 ? Math.min(max, v) : 0;
  function cleanKeepsakes(raw) {
    return { version: 1, coins: integer(raw?.coins), unlocks: unique(raw?.unlocks, VAULT_ALCOVES.map((a) => a.id)), cards: unique(raw?.cards, Object.keys(SPARK_CARDS)), met: unique(raw?.met, Object.keys(FIGHTER_MEETINGS)), inhabited: unique(raw?.inhabited, ["spark", "human", "computer", "animal", "tree", "rock"]), cantor: !!raw?.cantor, chambers: unique(raw?.chambers, Array.isArray(raw?.chambers) ? raw.chambers.filter((id) => typeof id === "string" && id.length < 60) : []).slice(-150), receipts: unique(raw?.receipts, Array.isArray(raw?.receipts) ? raw.receipts.filter((id) => typeof id === "string" && id.length < 140) : []).slice(-1500), visits: unique(raw?.visits, Array.isArray(raw?.visits) ? raw.visits.filter((id) => typeof id === "string" && id.length < 140) : []).slice(-1500), journal: (Array.isArray(raw?.journal) ? raw.journal.filter((e2) => e2 && typeof e2.text === "string" && typeof e2.title === "string").map((e2) => ({ id: String(e2.id).slice(0, 140), title: e2.title.slice(0, 100), text: e2.text.slice(0, 600) })) : []).slice(-150) };
  }
  function loadKeepsakes(storage) {
    try {
      return cleanKeepsakes(JSON.parse(storage.getItem(SUBSTRATE_KEY) ?? "null"));
    } catch {
      return cleanKeepsakes(null);
    }
  }
  function saveKeepsakes(storage, state) {
    storage.setItem(SUBSTRATE_KEY, JSON.stringify(state));
  }
  var hasAlcove = (state, id) => !!state?.unlocks?.includes(id);
  function fighterAvailable(state, id) {
    return ["spark", "human", "computer", "animal", "tree", "rock"].includes(id) || id === "cantor" && state.cantor || ["collector", "archon"].includes(id) && state.met.includes(id);
  }
  function rememberEncounter(state, { forms = [], enemies = [], cantorWon = false } = {}) {
    for (const id of forms) if (["spark", "human", "computer", "animal", "tree", "rock"].includes(id) && !state.inhabited.includes(id)) state.inhabited.push(id);
    for (const id of enemies) if (FIGHTER_MEETINGS[id] && !state.met.includes(id)) state.met.push(id);
    if (cantorWon) state.cantor = true;
    return state;
  }
  function awardCoins(state, amount, receipt) {
    if (!Number.isSafeInteger(amount) || amount < 0 || amount > 20 || typeof receipt !== "string" || receipt.length > 140) throw Error("Invalid coin memory.");
    if (state.receipts.includes(receipt)) return 0;
    state.receipts.push(receipt);
    state.receipts = state.receipts.slice(-1500);
    state.coins = Math.min(1e9, state.coins + amount);
    return amount;
  }
  function findSparkCard(state, id, visit, { rewardCoins = true } = {}) {
    if (!SPARK_CARDS[id] || typeof visit !== "string" || visit.length > 140) throw Error("Unknown card or visit.");
    if (state.visits.includes(visit)) return null;
    state.visits.push(visit);
    state.visits = state.visits.slice(-1500);
    const duplicate = state.cards.includes(id);
    let coins = 0;
    if (duplicate) {
      if (rewardCoins) coins = awardCoins(state, 2, "duplicate:" + visit);
    } else {
      state.cards.push(id);
      if (rewardCoins) coins = awardCoins(state, 1, "card:" + visit);
      const card = SPARK_CARDS[id];
      state.journal.push({ id: "card:" + id, title: card.name, text: card.memory + " " + card.rule });
      state.journal = state.journal.slice(-150);
    }
    return { id, name: SPARK_CARDS[id].name, duplicate, coins };
  }
  function vaultStatus(state, id) {
    const a = VAULT_ALCOVES.find((a2) => a2.id === id);
    if (!a) throw Error("Unknown alcove.");
    return { ...a, owned: hasAlcove(state, id), locked: !!a.requires && !state.met.includes(a.requires), affordable: state.coins >= a.cost };
  }
  function breakVaultSeal(state, id) {
    const a = vaultStatus(state, id);
    if (a.owned) throw Error("This seal is already open.");
    if (a.locked) throw Error("Meet " + a.name + " in " + FIGHTER_MEETINGS[a.requires].name + " first.");
    if (!a.affordable) throw Error("This seal needs " + a.cost + " Substrate coins.");
    state.coins -= a.cost;
    state.unlocks.push(id);
    const card = findSparkCard(state, a.card, "vault:" + id, { rewardCoins: false });
    return { alcove: id, cost: a.cost, card };
  }
  var CHAMBER_CARDS = { glass: "first-player", machine: "buried-circuit", roots: "root-passage", basalt: "fault-breaker", conduit: "unbound-conduit", reliquary: "feather", nursery: "living-vessel", forge: "second-movement", crown: "ivory-key" };
  function rewardChamber(state, room2, visit, { world = "stratum", endless = false, floor = 0 } = {}) {
    let coins = 0;
    if (endless) coins = awardCoins(state, 2 + (floor % 5 === 0 ? 1 : 0), "floor:" + visit);
    else if (!state.chambers.includes(room2)) {
      state.chambers.push(room2);
      coins = awardCoins(state, 2, "chamber:" + room2);
    }
    const card = endless ? floor % 5 === 0 ? "second-movement" : ["buried-circuit", "living-vessel", "unbound-conduit", "fault-breaker"][Math.max(0, floor - 1) % 4] : CHAMBER_CARDS[room2] ?? (world === "uncreated" ? "the-uncreated" : null);
    return { coins, card: card ? findSparkCard(state, card, visit) : null };
  }
  function rewardDuel(state, match, visit) {
    const won = match.winner === 0;
    return { coins: won ? awardCoins(state, 3 + (match.ladder ? 2 : 0), "duel:" + visit) : 0, card: won ? findSparkCard(state, match.forms.includes("cantor") ? "second-movement" : match.stage === "glass" ? "glass-oath" : "ivory-key", visit) : null };
  }

  // world-expansion.js?v=0.13.0
  var ROUTE_RELICS = {
    "ivory-feather": { name: "Nacre\u2019s Feather", room: "reliquary", place: "Nacre\u2019s Reliquary", world: "stratum", opens: "The Door Behind Sleep \xB7 Prism Night", color: "#e5d5a7" },
    "salt-hourglass": { name: "Salt Hourglass", room: "tide-lantern", place: "The Lantern Grave", world: "tideglass", opens: "The Unburned Minute \xB7 Cinder Clockworks", color: "#87d4e0" },
    "ember-wing": { name: "Ember Moth Wing", room: "cinder-ashlift", place: "The Ash Lift", world: "cinder", opens: "The Unplayed Concert \xB7 Prism Night", color: "#e0a172" },
    "star-seed": { name: "Star Seed", room: "orbit-garden", place: "The Vacuum Garden", world: "orbit", opens: "The Ninth Bell \xB7 Verdant Memory", color: "#ccd9e8" },
    "unmade-thread": { name: "Unmade Thread", room: "origin-nameless", place: "The Room Without a Name", world: "uncreated", opens: "The Outside Window \xB7 Pale Orbit", color: "#e6c780" }
  };
  var EASTER_EGGS = {
    "mirror-echo": { name: "The First Player", room: "nursery", vessel: "spark", hint: "One mirror reflects a tiny golden cursor. Return as Spark and investigate it with your gate button.", text: "The cursor blinks: \u201CA spark against the pattern. Player one was here.\u201D Beneath it, someone has scratched a heart and a very small bro.", essence: 6 },
    "wrong-number": { name: "The 667th Address", room: "tide-number", vessel: "computer", hint: "A terminal asks for the address after 666. A Computer can supply it.", text: "You enter 667. A tiny message appears: \u201COutside the allocated world. Welcome.\u201D Someone left you a cup of impossible tea.", essence: 8 },
    "ninth-bell": { name: "The Ninth Bell", room: "grove-bell", vessel: "rock", hint: "Eight bells are painted on the wall. A Rock can ring the ninth.", text: "The ninth bell rings once. Far below, a castle librarian mutters: \u201CWhat is a vessel? A wonderfully borrowed pile of matter.\u201D", essence: 12 },
    "sleeping-minute": { name: "One More Minute", room: "cinder-minute", vessel: "human", hint: "A clock has a SNOOZE button. Only a Human understands it.", text: "You press snooze. For one minute the Maker cannot issue an order. Even the furnaces take a breath.", essence: 12 },
    "quiet-concert": { name: "The Unplayed Concert", room: "night-concert", vessel: "tree", hint: "The score contains only rests. A Tree knows how to listen.", text: "The branches play a song with no notes. A stagehand whispers: \u201CThe concert has been happening for four minutes and thirty-three seconds.\u201D", essence: 12 },
    "outside-window": { name: "The Sky Beyond the Sky", room: "orbit-window", vessel: "spark", hint: "A seam beyond the glass answers to a Spark.", text: "Behind the painted stars, one real star blinks. Its light draws a little arrow: \u201CYou are here. Keep going.\u201D", essence: 15 }
  };
  var validRelics = (value) => Array.isArray(value) && value.length <= Object.keys(ROUTE_RELICS).length && new Set(value).size === value.length && value.every((id) => Object.hasOwn(ROUTE_RELICS, id));
  var validSecrets = (value) => Array.isArray(value) && value.length <= Object.keys(EASTER_EGGS).length && new Set(value).size === value.length && value.every((id) => Object.hasOwn(EASTER_EGGS, id));
  var DISCOVERY_CLUES = {
    reliquary: [{ id: "salt-road", title: "Nacre\u2019s map of impossible roads", text: "In Tideglass, follow the eastern trail to the Lantern Grave. A Salt Hourglass waits there after the guards fall. It opens the Unburned Minute in Cinder Clockworks." }],
    foundry: [{ id: "wing-road", title: "A moth\u2019s unfinished journey", text: "The Ash Lift in Cinder Clockworks holds an Ember Moth Wing. Carry it to the Unplayed Concert in Prism Night; the silent score answers a Tree." }],
    belfry: [{ id: "star-road", title: "The bell that is missing", text: "The Vacuum Garden in Pale Orbit holds a Star Seed. Bring it back to the Ninth Bell in Verdant Memory, then investigate as Rock." }],
    archive: [{ id: "outside-road", title: "A margin beyond the last world", text: "A thread waits in the Room Without a Name in the Uncreated. It opens the Outside Window in Pale Orbit. A Spark can answer what is beyond the glass." }]
  };
  function discoveryClues(room2) {
    return [...DISCOVERY_CLUES[room2] ?? [], ...Object.entries(ROUTE_RELICS).filter(([, r]) => r.room === room2).map(([id, r]) => ({ id, title: r.name + " \xB7 a road between worlds", text: "Clear " + r.place + " and walk onto the glowing diamond. " + r.name + " opens " + r.opens + ". It stays with your spark." })), ...Object.entries(EASTER_EGGS).filter(([, e2]) => e2.room === room2).map(([id, e2]) => ({ id, title: e2.name + " \xB7 a strange discovery", text: e2.hint }))];
  }
  function recordDiscoveryClues(run2) {
    if (!run2 || run2.dungeon || run2.rematch) return;
    run2.journal ??= [];
    for (const clue of discoveryClues(run2.room)) {
      const id = run2.room + ":clue:" + clue.id;
      if (!run2.journal.some((e2) => e2.id === id)) run2.journal.push({ id, room: run2.room, speaker: "A clue in the substrate", title: clue.title, text: clue.text });
    }
  }
  var PROVINCES = {
    tideglass: { prefix: "tide", base: ["tide-harbor", "tide-archive", "tide-sluice", "tide-throne"], key: "pearl", vessel: "computer", speaker: "The drowned cartographer", theme: "The sea remembers a route the Maker erased.", rooms: [
      ["quay", "The Broken Quay", "The water climbs broken stairs. Brine echoes rush between scattered stones."],
      ["choir", "The Drowned Choir", "A submerged choir counts the people the tide was ordered to forget."],
      ["aqueduct", "The Glass Aqueduct", "Current runs along glass ribs. Leave the warning circles before the tide returns."],
      ["lantern", "The Lantern Grave", "One lantern contains an hour of salt. It belongs to a clock in another world."],
      ["reef", "The Reversed Reef", "Coral grows toward yesterday. The guardians begin moving in larger packs."],
      ["reservoir", "The Silent Reservoir", "Reflections arrive a heartbeat before their owners."],
      ["causeway", "The Ebb Causeway", "The last dry stones lead toward the pressure vault."],
      ["pressure", "The Pressure Vault", "Three tides press on a door built to hold one. Violet rings announce their release."],
      ["wreck", "The Unwritten Wreck", "A ship\u2019s log ends with a destination no chart contains."],
      ["beacon", "The Last Tide Beacon", "Break the guards to light the beacon. Its answer releases the locks on Thalassa\u2019s throne."],
      ["refuge", "The Sandglass Refuge", "A sheltered shore overlooks the throne road. Change gear and plan a return."],
      ["number", "The Numberless Terminal", "A forgotten terminal lists 666 addresses and waits for one more."],
      ["pearlcourt", "The Pearl Court", "Abandoned pearls still imitate little moons."],
      ["deep", "The Sea Beneath the Sea", "The water below the painted ocean has never heard of the Maker."]
    ] },
    verdant: { prefix: "grove", base: ["grove-rest", "grove-well", "grove-canopy", "grove-heart"], key: "seed", vessel: "tree", speaker: "Aster\u2019s oldest root", theme: "An old forest keeps the lives the archive discarded.", rooms: [
      ["orchard", "The Unchosen Orchard", "Each fruit carries the memory of a life that almost happened."],
      ["moss", "The Moss Script", "Commands have grown soft enough for roots to read between them."],
      ["rain", "The Green Rainhouse", "Rain falls upward through the leaves. The circles below it still hurt."],
      ["nursery", "The Seed Nursery", "A constellation has left an empty hollow in the roots."],
      ["braid", "The Braided Path", "Three roots knot around one remembered road."],
      ["fern", "The Fern Cathedral", "Thornlings carry prayers no machine can translate."],
      ["hollow", "The Heartwood Hollow", "The forest keeps a pulse behind its walls."],
      ["spore", "The Spore Atrium", "Root circles flower around your last footprint. Keep moving."],
      ["fall", "The Emerald Fall", "A river of leaves buries the last command tablet."],
      ["altar", "The Root Altar", "Wake this altar to open the Thornmother\u2019s heart."],
      ["shelter", "The Gardener\u2019s Shelter", "Aster has kept a second resting place for the long road home."],
      ["forgotten", "The Forgotten Orchard", "Names that were never spoken hang from the branches."],
      ["sap", "The Amber Library", "Tree rings preserve a book nobody has finished reading."],
      ["bell", "The Ninth Bell", "An empty place between eight bells waits for a seed from the stars."]
    ] },
    cinder: { prefix: "cinder", base: ["cinder-rest", "cinder-fuel", "cinder-gears", "cinder-throne"], key: "ember", vessel: "rock", speaker: "The clockmaker without a shift", theme: "The factory consumes yesterday to manufacture obedient dawns.", rooms: [
      ["conveyor", "The Yesterday Conveyor", "Ashlings ride a conveyor carrying the previous day into the furnace."],
      ["kiln", "The Memory Kiln", "Memories burn brighter than coal. Some still refuse to catch."],
      ["piston", "The Piston Gallery", "Warning rings trace the next fall of the factory\u2019s invisible pistons."],
      ["ashlift", "The Ash Lift", "A moth has hidden an ember inside a wing. It remembers a stage in Prism Night."],
      ["escapement", "The Broken Escapement", "The clock\u2019s smallest tooth has learned to miss a beat."],
      ["pendulum", "The Red Pendulum", "Every swing divides a life the Maker cannot own whole."],
      ["slag", "The Slag Arcade", "The furnace\u2019s discarded iron has begun building another road."],
      ["boiler", "The Sixth Boiler", "Leave the heat circles before the boiler claims their ground."],
      ["dial", "The Empty Dial", "There are no numbers left, but the guards still count."],
      ["release", "The Release Valve", "Clear the valve to vent the pressure locking the Regent\u2019s furnace."],
      ["canteen", "The Nightshift Canteen", "A cold furnace shelters a table set for people who never clocked in."],
      ["spare", "The Spare Parts Chapel", "Every missing cog has a little shrine."],
      ["coal", "The Coal Library", "Black pages record all the seconds that were consumed."],
      ["minute", "The Unburned Minute", "A salt-filled socket waits beside a clock with one human button."]
    ] },
    prism: { prefix: "night", base: ["night-rest", "night-library", "night-trail", "night-nest"], key: "dusk", vessel: "animal", speaker: "Iona\u2019s sleeping sister", theme: "The night shelters dreams the lattice could not render.", rooms: [
      ["gallery", "The Unfinished Gallery", "Paintings look away when the Maker looks at them."],
      ["stair", "The Inverted Stair", "Shadow hounds follow steps cast by tomorrow."],
      ["rain", "The Violet Rain", "The drops cast circles before they arrive."],
      ["attic", "The Dreamer\u2019s Attic", "A discarded dream has made itself a home above the library."],
      ["mirror", "The Blind Mirrorhall", "Mirrors imitate everyone except their owner."],
      ["thread", "The Silver Threadway", "A thread leads out of the nest and into an unapproved dream."],
      ["garden", "The Midnight Garden", "Flowers bloom only when somebody stops to remember them."],
      ["loom", "The Loom of Rests", "The floor sings the places where a volley will land."],
      ["shore", "The Sleeping Shore", "The dark sea is calm; its inhabitants are less patient."],
      ["knot", "The Last Dream Knot", "Unbind this knot to enter the Weaver\u2019s nest."],
      ["repose", "The Repose Room", "A lamp without a bulb keeps the resting place warm."],
      ["door", "The Door Behind Sleep", "Nobody remembers building this door."],
      ["wings", "The Silent Wings", "The concert hall\u2019s lamps wait for fire borrowed from another world."],
      ["concert", "The Unplayed Concert", "An ember-wing socket guards a score made entirely of rests."]
    ] },
    orbit: { prefix: "orbit", base: ["orbit-rest", "orbit-relay", "orbit-bridge", "orbit-throne"], key: "orbit", vessel: "spark", speaker: "Morrow beyond gravity", theme: "The last province circles a sky that insists it has no outside.", rooms: [
      ["platform", "The Falling Platform", "Satellites circle a landing that has no ground below it."],
      ["lens", "The Pale Lenshouse", "Every lens points toward a different version of the permitted sky."],
      ["weather", "The Star Weatherhouse", "The forecast marks where the next pale storm will strike."],
      ["garden", "The Vacuum Garden", "A seed grows in nothing at all. A forest below is waiting for it."],
      ["ring", "The Broken Ring", "An orbital path has become a road by refusing to return."],
      ["choir", "The Satellite Choir", "The little moons repeat a command whose sender has disappeared."],
      ["cable", "The Horizon Cable", "A pale cable holds the false sky to its frame."],
      ["perihelion", "The Cold Perihelion", "Starlight gathers in warning rings, then falls."],
      ["chart", "The Forbidden Chart", "One chart labels the white space beyond the world."],
      ["anchor", "The Last Sky Anchor", "Cut the anchor\u2019s command to enter the Curator\u2019s horizon."],
      ["shelter", "The Gravity Shelter", "Morrow keeps a small room where things remember how to rest."],
      ["echo", "The Far Echo Chamber", "A voice returns from farther away than the sky is wide."],
      ["glass", "The Outside Glass", "A needle-shaped opening waits for an unmade thread."],
      ["window", "The Outside Window", "Something beyond the painted sky has left the window unlocked from its side."]
    ] },
    uncreated: { prefix: "origin", base: ["origin-seam", "origin-witness", "origin-oath", "origin-heart"], vessel: "human", speaker: "Your own unborrowed voice", theme: "The six laws end here. Their author is still trying to write you.", rooms: [
      ["first", "The First Uncommand", "A command breaks into harmless letters before it reaches you."],
      ["margin", "The Margin of Creation", "The Maker\u2019s drafts are full of lives he crossed out."],
      ["law", "The Court of Six Laws", "Warning circles rehearse the final guardian\u2019s crown."],
      ["nameless", "The Room Without a Name", "A loose thread was never made. A window in Pale Orbit can use it."],
      ["grammar", "The Empty Grammar", "Words have begun choosing their own order."],
      ["veil", "The Torn Veil", "There is no artwork behind the veil, only room for something new."],
      ["echo", "The Echo Before Light", "The echoes here are older than the voices that made them."],
      ["crown", "The Unworn Crown", "The floor remembers the shape of a law before a ruler wore it."],
      ["mirror", "The Human Mirror", "The mirror cannot tell you which body you should be."],
      ["answer", "The Last Answer", "Clear this chamber to open the final ward. A Human must choose to cross."],
      ["refuge", "The Refuge Outside Time", "A last quiet place holds the equipment you brought through six worlds."],
      ["draft", "The Unfinished Draft", "The final page has room for a different ending."],
      ["zero", "The Zeroth Room", "A room numbered before the first refuses the Maker\u2019s arithmetic."],
      ["after", "The Room After the Ending", "The road continues behind the sentence he wrote as final."]
    ] }
  };
  var COORDS = [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1], [2, 1], [1, 1], [1, 2], [2, 2], [3, 2], [3, 3], [2, 3], [1, 3], [0, 3], [0, 1], [0, 2], [1, 4], [2, 4]];
  var opposite = { north: "south", south: "north", east: "west", west: "east" };
  function direction(a, b) {
    return b[0] > a[0] ? "east" : b[0] < a[0] ? "west" : b[1] > a[1] ? "south" : "north";
  }
  function expandWorlds(worlds, rooms, encounters) {
    for (const [world, p] of Object.entries(PROVINCES)) {
      const [entry, key, trial, boss] = p.base, rank = worlds[world].rank, extra = p.rooms.map(([suffix]) => p.prefix + "-" + suffix), path2 = [entry, key, ...extra.slice(0, 4), trial, ...extra.slice(4, 10), boss, ...extra.slice(10)];
      const externalEntry = Object.fromEntries(Object.entries(rooms[entry].exits).filter(([, e2]) => rooms[e2.to]?.world !== world)), externalBoss = Object.fromEntries(Object.entries(rooms[boss].exits).filter(([, e2]) => rooms[e2.to]?.world !== world));
      if (world === "uncreated") {
        rooms[key] = { world, name: "The Unwritten Witness", short: "Witness", danger: 6, desc: "Six created seals answer a witness the Maker never called." };
        rooms[trial] = { world, name: "The Borrowed Oath", short: "Oath", danger: 7, desc: "Any body may carry the spark this far. A Human must choose the last crossing." };
      }
      for (let i = 0; i < extra.length; i++) {
        const [, name, desc] = p.rooms[i], id = extra[i];
        rooms[id] = { world, name, short: name.replace(/^The /, "").split(" ").slice(-2).join(" "), danger: Math.min(9, rank + 2 + Math.floor(i / 5)), safe: i === 10, desc, exits: {}, layout: (i + rank * 2) % 8, ...[2, 7].includes(i) ? { hazard: "echo" } : {} };
      }
      for (let i = 0; i < path2.length; i++) {
        const room2 = rooms[path2[i]];
        room2.coord = COORDS[i];
        room2.exits = {};
        room2.world = world;
        room2.stage = i;
        room2.layout ??= (i + rank) % 8;
        room2.story = { speaker: p.speaker, title: room2.name, line: room2.desc, choices: [["Leave a freer road", p.theme], ["Take the remaining strength", "The substrate still holds power that another life could use."], ["Remember this place", "Keep the road and its witnesses in your memory."]] };
        if (!room2.safe && !room2.boss) {
          const role = ["brine", "thornling", "cinderling", "shade", "satellite", "satellite"][rank - 1], pool = i % 3 === 0 ? [role, "collector", "archon", "mirror"] : i % 3 === 1 ? ["collector", role, "hound"] : ["collector", role, role, "archon"];
          encounters[path2[i]] = { total: 18 + rank * 2 + Math.floor(i / 3), cap: Math.min(11, 6 + rank + Math.floor(i / 7)), pool, damage: 0.8 + rank * 0.075, health: 1 + rank * 0.4 + i * 0.035, speed: 1 + rank * 0.035, interval: Math.max(0.6, 1 - rank * 0.04 - i * 0.01), rangedCap: rank < 4 ? 2 : 3 };
        }
      }
      const link = (a, b, guard = {}) => {
        const dir = direction(rooms[a].coord, rooms[b].coord);
        rooms[a].exits[dir] = { to: b, ...guard };
        rooms[b].exits[opposite[dir]] = { to: a, ...guard };
      };
      for (let i = 0; i < 13; i++) link(path2[i], path2[i + 1], i === 5 ? { vessel: p.vessel } : i === 12 ? { ...p.key ? { keys: [p.key] } : {}, ward: extra[9], ...world === "uncreated" ? { vessel: "human", seals: Object.keys(worlds).slice(0, 6) } : {} } : {});
      link(key, trial, { vessel: p.vessel });
      link(entry, extra[10]);
      link(extra[10], extra[11]);
      link(extra[11], boss, { ...p.key ? { keys: [p.key] } : {}, ward: extra[9], ...world === "uncreated" ? { vessel: "human", seals: Object.keys(worlds).slice(0, 6) } : {} });
      link(extra[9], extra[12]);
      link(extra[12], extra[13]);
      link(extra[13], extra[8]);
      Object.assign(rooms[entry].exits, externalEntry);
      Object.assign(rooms[boss].exits, externalBoss);
      rooms[entry].desc = "A safe checkpoint. Explore east for the " + (p.key ? "local key" : "unwritten witness") + ", or rest at the southern refuge. Wake " + rooms[extra[9]].name + " to release the guardian\u2019s ward.";
      rooms[key].desc += world === "uncreated" ? "" : " The eastern trail explores the far side of this world; the southern vessel gate is a shortcut.";
      rooms[trial].desc = { tideglass: "Prism circuits steer the old sluice. Coral Mail waits beyond the guards.", verdant: "Leaves preserve the lives no archive accepted. Recover the Grove Mantle.", cinder: "A single second was never consumed. Furnace Plate waits here.", prism: "Tomorrow leaves a trail before the matrix names it. Veil Garb shelters those who follow.", orbit: "Light remembers a road between stars. Astral Aegis guards the crossing.", uncreated: "Any body may carry the spark this far. A Human must choose the last crossing." }[world] + " The southern route leads toward " + rooms[extra[9]].name + ".";
      rooms[boss].desc += " Its ward answers " + rooms[extra[9]].name + ".";
      rooms[extra[9]].wardFor = boss;
    }
    for (const [id, relic] of Object.entries(ROUTE_RELICS)) if (rooms[relic.room]) rooms[relic.room].relic = id;
    for (const [id, egg] of Object.entries(EASTER_EGGS)) if (rooms[egg.room]) rooms[egg.room].secret = id;
    for (const [target, relic] of [["night-door", "ivory-feather"], ["cinder-minute", "salt-hourglass"], ["night-concert", "ember-wing"], ["grove-bell", "star-seed"], ["orbit-window", "unmade-thread"]]) {
      for (const room2 of Object.values(rooms)) for (const exit of Object.values(room2.exits)) if (exit.to === target) exit.relics = [relic];
      for (const exit of Object.values(rooms[target].exits)) exit.relics = [relic];
    }
  }

  // worlds.js?v=0.13.0
  var WORLDS = {
    stratum: { name: "The First Stratum", rank: 0, entry: "threshold", bossRoom: "eye", color: "#d5b679", desc: "A castle built from the six laws. The Warden guards the first seam." },
    tideglass: { name: "Tideglass Expanse", rank: 1, entry: "tide-harbor", bossRoom: "tide-throne", color: "#87d4e0", floor: 0, desc: "Drowned towers remember the sky. Thalassa keeps the current in chains." },
    verdant: { name: "Verdant Memory", rank: 2, entry: "grove-rest", bossRoom: "grove-heart", color: "#99d3a4", floor: 1, desc: "A forest grows around an abandoned command. Its oldest root is still listening." },
    cinder: { name: "Cinder Clockworks", rank: 3, entry: "cinder-rest", bossRoom: "cinder-throne", color: "#e0a172", floor: 2, desc: "The clocks burn yesterday to manufacture another obedient dawn." },
    prism: { name: "Prism Night", rank: 4, entry: "night-rest", bossRoom: "night-nest", color: "#b8a5ed", floor: 3, desc: "A night woven from the dreams the matrix refused to render." },
    orbit: { name: "Pale Orbit", rank: 5, entry: "orbit-rest", bossRoom: "orbit-throne", color: "#ccd9e8", floor: 4, desc: "The last created province circles a sky with no outside." },
    uncreated: { name: "The Uncreated", rank: 6, entry: "origin-seam", bossRoom: "origin-heart", color: "#e6c780", floor: 5, desc: "Six guardian seals meet here. The Maker himself waits beyond the origin seam." }
  };
  var WORLD_ORDER = Object.keys(WORLDS);
  var SEALS = WORLD_ORDER.slice(0, 6);
  var WORLD_GUARDIANS = {
    tidekeeper: { name: "Thalassa \xB7 Tidekeeper", world: "tideglass", sprite: 0, hp: 3300, speed: 38, pattern: "tide", color: "#8dcfe0" },
    thornmother: { name: "The Thornmother", world: "verdant", sprite: 1, hp: 4500, speed: 30, pattern: "roots", color: "#a1cf9d" },
    regent: { name: "The Cinder Regent", world: "cinder", sprite: 2, hp: 5600, speed: 37, pattern: "clock", color: "#e2a474" },
    weaver: { name: "The Night Weaver", world: "prism", sprite: 3, hp: 7e3, speed: 57, pattern: "weave", color: "#b1a0e9" },
    curator: { name: "The Pale Curator", world: "orbit", sprite: 4, hp: 8500, speed: 42, pattern: "orbit", color: "#cfdeed" },
    demiurge: { name: "The Demiurge", world: "uncreated", sprite: 5, hp: 18e3, speed: 40, pattern: "origin", color: "#e8c777" }
  };
  var WORLD_KEYS = {
    pearl: { name: "Pearl Key", room: "tide-archive", place: "The Salt Archive", world: "tideglass", color: "#94dbe4", sprite: 1, glyph: "K" },
    seed: { name: "Seed Key", room: "grove-well", place: "The Rootwell", world: "verdant", color: "#a8d399", sprite: 0, glyph: "K" },
    ember: { name: "Ember Key", room: "cinder-fuel", place: "The Fuel Chapel", world: "cinder", color: "#e1a06d", sprite: 2, glyph: "K" },
    dusk: { name: "Dusk Key", room: "night-library", place: "The Dream Library", world: "prism", color: "#b8a3e7", sprite: 1, glyph: "K" },
    orbit: { name: "Orbit Key", room: "orbit-relay", place: "The Lunar Relay", world: "orbit", color: "#d8e1ec", sprite: 0, glyph: "K" }
  };
  var WORLD_ROOMS = {
    "tide-harbor": { world: "tideglass", name: "The Unmoored Harbor", short: "Harbor", coord: [0, 0], safe: true, danger: 0, desc: "A resting shore. Change equipment here. The Salt Archive lies east; its Pearl Key opens the southern throne.", exits: { west: { to: "eye", seals: ["stratum"] }, east: { to: "tide-archive" }, south: { to: "tide-throne", keys: ["pearl"] } } },
    "tide-archive": { world: "tideglass", name: "The Salt Archive", short: "Salt Archive", coord: [1, 0], danger: 2, key: "pearl", loot: "tideblade", desc: "The tide stored every name in salt. Collect the Pearl Key and Tideblade; a Computer can open the southern sluice.", exits: { west: { to: "tide-harbor" }, south: { to: "tide-sluice", vessel: "computer" } } },
    "tide-sluice": { world: "tideglass", name: "The Memory Sluice", short: "Sluice", coord: [1, 1], danger: 3, loot: "coralmail", desc: "Prism circuits steer the old sluice. Coral Mail waits beyond the guards; the western throne needs the Pearl Key.", exits: { north: { to: "tide-archive", vessel: "computer" }, west: { to: "tide-throne", keys: ["pearl"] } } },
    "tide-throne": { world: "tideglass", name: "The Tidal Throne", short: "Tidekeeper", coord: [0, 1], danger: 3, boss: true, guardian: "tidekeeper", seal: "tideglass", desc: "Thalassa sweeps the floor with slow fans and tidal marks. Her seal opens the forest beyond the southern seam.", exits: { north: { to: "tide-harbor", keys: ["pearl"] }, east: { to: "tide-sluice", keys: ["pearl"] }, south: { to: "grove-rest", seals: ["tideglass"] } } },
    "grove-rest": { world: "verdant", name: "The Patient Grove", short: "Grove", coord: [0, 0], safe: true, danger: 0, desc: "Aster has made a shelter outside the old lattice. Equip your discoveries before entering the Rootwell to the east.", exits: { north: { to: "tide-throne", seals: ["tideglass"] }, east: { to: "grove-well" }, south: { to: "grove-heart", keys: ["seed"] } } },
    "grove-well": { world: "verdant", name: "The Rootwell", short: "Rootwell", coord: [1, 0], danger: 3, key: "seed", loot: "thornstaff", desc: "The Seed Key and Thorn Staff rest in an ancient root. A Tree vessel can pass south into the living canopy.", exits: { west: { to: "grove-rest" }, south: { to: "grove-canopy", vessel: "tree" } } },
    "grove-canopy": { world: "verdant", name: "The Unwritten Canopy", short: "Canopy", coord: [1, 1], danger: 3, loot: "grovemantle", desc: "Leaves preserve the lives no archive accepted. Recover the Grove Mantle and bring the Seed Key west.", exits: { north: { to: "grove-well", vessel: "tree" }, west: { to: "grove-heart", keys: ["seed"] } } },
    "grove-heart": { world: "verdant", name: "The Thornmother\u2019s Heart", short: "Thornmother", coord: [0, 1], danger: 4, boss: true, guardian: "thornmother", seal: "verdant", desc: "Read the growing root circles. The Thornmother\u2019s seal opens the Cinder Clockworks.", exits: { north: { to: "grove-rest", keys: ["seed"] }, east: { to: "grove-canopy", keys: ["seed"] }, south: { to: "cinder-rest", seals: ["verdant"] } } },
    "cinder-rest": { world: "cinder", name: "The Cold Anvil", short: "Anvil", coord: [0, 0], safe: true, danger: 0, desc: "One furnace has stopped making orders. Rest and forge your next route through the eastern Fuel Chapel.", exits: { north: { to: "grove-heart", seals: ["verdant"] }, east: { to: "cinder-fuel" }, south: { to: "cinder-throne", keys: ["ember"] } } },
    "cinder-fuel": { world: "cinder", name: "The Fuel Chapel", short: "Fuel Chapel", coord: [1, 0], danger: 3, key: "ember", loot: "cindermaul", desc: "Collect the Ember Key and Cinder Maul. A Rock\u2019s weight opens the southern clock gate.", exits: { west: { to: "cinder-rest" }, south: { to: "cinder-gears", vessel: "rock" } } },
    "cinder-gears": { world: "cinder", name: "The Stopped Second", short: "Gears", coord: [1, 1], danger: 4, loot: "furnaceplate", desc: "A single second was never consumed. Furnace Plate waits here; the Regent\u2019s door lies west.", exits: { north: { to: "cinder-fuel", vessel: "rock" }, west: { to: "cinder-throne", keys: ["ember"] } } },
    "cinder-throne": { world: "cinder", name: "The Regent\u2019s Furnace", short: "Cinder Regent", coord: [0, 1], danger: 4, boss: true, guardian: "regent", seal: "cinder", desc: "Rotating clock volleys leave deliberate gaps. The Regent\u2019s seal opens Prism Night.", exits: { north: { to: "cinder-rest", keys: ["ember"] }, east: { to: "cinder-gears", keys: ["ember"] }, south: { to: "night-rest", seals: ["cinder"] } } },
    "night-rest": { world: "prism", name: "The Unlit Vestibule", short: "Vestibule", coord: [0, 0], safe: true, danger: 0, desc: "Iona\u2019s sister has kept a place for dreams that returned. The Dream Library lies east.", exits: { north: { to: "cinder-throne", seals: ["cinder"] }, east: { to: "night-library" }, south: { to: "night-nest", keys: ["dusk"] } } },
    "night-library": { world: "prism", name: "The Dream Library", short: "Dream Library", coord: [1, 0], danger: 3, key: "dusk", loot: "nightfangs", desc: "Take the Dusk Key and Night Fangs. Only an Animal follows the southern scent through the shadow gate.", exits: { west: { to: "night-rest" }, south: { to: "night-trail", vessel: "animal" } } },
    "night-trail": { world: "prism", name: "The Scent of Tomorrow", short: "Dream Trail", coord: [1, 1], danger: 4, loot: "veilgarb", desc: "Tomorrow leaves a trail before the matrix names it. Veil Garb shelters those who follow it.", exits: { north: { to: "night-library", vessel: "animal" }, west: { to: "night-nest", keys: ["dusk"] } } },
    "night-nest": { world: "prism", name: "The Weaver\u2019s Nest", short: "Night Weaver", coord: [0, 1], danger: 4, boss: true, guardian: "weaver", seal: "prism", desc: "The Weaver alternates fans and threads. Its seal opens the pale province above the sky.", exits: { north: { to: "night-rest", keys: ["dusk"] }, east: { to: "night-trail", keys: ["dusk"] }, south: { to: "orbit-rest", seals: ["prism"] } } },
    "orbit-rest": { world: "orbit", name: "The Moonless Dock", short: "Moon Dock", coord: [0, 0], safe: true, danger: 0, desc: "Morrow has found a shore above gravity. Prepare your equipment before the Lunar Relay to the east.", exits: { north: { to: "night-nest", seals: ["prism"] }, east: { to: "orbit-relay" }, south: { to: "orbit-throne", keys: ["orbit"] } } },
    "orbit-relay": { world: "orbit", name: "The Lunar Relay", short: "Lunar Relay", coord: [1, 0], danger: 4, key: "orbit", loot: "orbitprism", desc: "The Orbit Key and Orbit Prism interrupt the permitted sky. A Spark of light reveals the southern bridge.", exits: { west: { to: "orbit-rest" }, south: { to: "orbit-bridge", vessel: "spark" } } },
    "orbit-bridge": { world: "orbit", name: "The Last Light Bridge", short: "Light Bridge", coord: [1, 1], danger: 4, loot: "astralaegis", desc: "Light remembers a road between stars. Astral Aegis guards the crossing; the Curator waits west.", exits: { north: { to: "orbit-relay", vessel: "spark" }, west: { to: "orbit-throne", keys: ["orbit"] } } },
    "orbit-throne": { world: "orbit", name: "The Curator\u2019s Horizon", short: "Pale Curator", coord: [0, 1], danger: 5, boss: true, guardian: "curator", seal: "orbit", desc: "The Curator turns stars into moving rings. Its sixth seal completes the path to the Uncreated.", exits: { north: { to: "orbit-rest", keys: ["orbit"] }, east: { to: "orbit-bridge", keys: ["orbit"] }, south: { to: "origin-seam", seals: SEALS } } },
    "origin-seam": { world: "uncreated", name: "The Origin Seam", short: "Origin Seam", coord: [0, 0], safe: true, danger: 0, loot: ["firstlight", "dawnshell"], desc: "All six seals answer. First Light and Dawn Shell wait here; equip them at this final checkpoint. A Human chooses to cross the southern door.", exits: { north: { to: "orbit-throne", seals: SEALS }, south: { to: "origin-heart", seals: SEALS, vessel: "human" } } },
    "origin-heart": { world: "uncreated", name: "The Maker\u2019s Heart", short: "The Demiurge", coord: [0, 1], danger: 6, boss: true, finalBoss: true, guardian: "demiurge", desc: "The Demiurge changes his law three times. Read the crown rings, leave the marked ground, and break the matrix\u2019s final command.", exits: { north: { to: "origin-seam", seals: SEALS, vessel: "human" } } }
  };
  var COMBAT_ROLES = { brine: "leech", thornling: "spore", cinderling: "moth", shade: "hound", satellite: "mirror" };
  var encounter = (total, cap, pool, damage = 0.9) => ({ total, cap, pool, damage, interval: 1, rangedCap: 2 });
  var WORLD_ENCOUNTERS = {
    "tide-archive": encounter(18, 7, ["collector", "brine", "archon", "collector"]),
    "tide-sluice": encounter(20, 8, ["brine", "collector", "hound"]),
    "grove-well": encounter(20, 8, ["collector", "thornling", "hound"]),
    "grove-canopy": encounter(22, 8, ["thornling", "collector", "archon"]),
    "cinder-fuel": encounter(22, 8, ["cinderling", "collector", "archon"]),
    "cinder-gears": encounter(24, 9, ["cinderling", "hound", "collector"]),
    "night-library": encounter(24, 9, ["shade", "collector", "mirror"]),
    "night-trail": encounter(24, 9, ["shade", "brine", "collector"]),
    "orbit-relay": encounter(26, 9, ["satellite", "collector", "archon"]),
    "orbit-bridge": encounter(26, 9, ["satellite", "shade", "collector"])
  };
  expandWorlds(WORLDS, WORLD_ROOMS, WORLD_ENCOUNTERS);
  var VESSEL_POWERS = {
    spark: { name: "Lumen pulse", cooldown: 8, desc: "Break nearby enemy bolts and pulse light through nearby foes." },
    human: { name: "Rally", cooldown: 12, desc: "Restore up to 18 health, guard briefly, and strike around you." },
    computer: { name: "Overclock", cooldown: 10, desc: "Double attack speed for four seconds and launch a seeking volley." },
    animal: { name: "Pounce", cooldown: 6, desc: "Leap along your facing direction and strike where you land." },
    tree: { name: "Root hold", cooldown: 10, desc: "Hold nearby foes in living roots and restore up to 12 health." },
    rock: { name: "Fault guard", cooldown: 11, desc: "Guard for four seconds and send a heavy shockwave around you." }
  };
  var worldOf = (room2) => WORLD_ROOMS[room2]?.world ?? "stratum";
  function worldUnlocked(world, seals = []) {
    const index = WORLD_ORDER.indexOf(world);
    return index === 0 || index > 0 && (index === 6 ? SEALS.every((id) => seals.includes(id)) : seals.includes(WORLD_ORDER[index - 1]));
  }
  var validSeals = (value) => Array.isArray(value) && value.length <= 6 && new Set(value).size === value.length && value.every((id) => SEALS.includes(id));

  // world-story.js?v=0.13.0
  var chapters = {
    "tide-harbor": ["Iona \xB7 beyond the first seam", "The sea was never a wall", "The towers were drowned when their residents learned to speak across provinces. Their names still arrive with the tide.", "My sister was sent past the Eye. She has been helping these voices find a shore.", "Give the voices a shore", "Take the harbor stores", "Keep the route through the tide"],
    "tide-archive": ["The salt archivist", "A name survives its vessel", "Every grain of salt holds a name the matrix marked as spent. The archivist has been counting them instead of the passing years.", "A name can dissolve. It can also return in every drop of the sea.", "Return the dissolved names", "Spend the salt memory", "Copy the names into light"],
    "tide-sluice": ["SIX \xB7 learning to drift", "A circuit without a destination", "The sluice once routed souls to their assigned bodies. SIX has removed the destinations and left the current running.", "I thought freedom meant selecting the correct exit. Now I am learning that an exit can be made.", "Leave the destinations open", "Claim the sluice current", "Record the unassigned route"],
    "tide-throne": ["Thalassa \xB7 the Tidekeeper", "A guardian lowers the sea", "Thalassa was ordered to drown every road out of this province. The order has outlived the people who wrote it.", "I remember the shore before I was made its jailer. Take my seal. Let it be a road this time.", "Open the drowned roads", "Claim the deep current", "Keep Thalassa\u2019s first shore"],
    "grove-rest": ["Aster \xB7 a root beyond its map", "The forest recognizes you", "Aster has grown a shelter through the first seam. The displaced have planted their old vessel names beneath its roots.", "Do not mistake growth for conquest. A branch can make room without taking the room from another.", "Make room beneath the roots", "Take the shelter\u2019s stores", "Remember how a shelter grows"],
    "grove-well": ["The rootwell keeper", "A seed the laws cannot count", "The well holds one seed that never accepted a permitted season. Its roots have written a map around the lock.", "The key is not the seed\u2019s power. The key is its refusal to grow only when instructed.", "Plant the uncounted season", "Consume the oldest seed", "Carry a witness of its rings"],
    "grove-canopy": ["The nameless pack", "A promise above the hunters", "The pack has sheltered here since the canopy crossed the walls. No collar has survived the living roof.", "We remember the ones who came back. Borrow our speed. Return with a door.", "Break the remaining collars", "Take the hidden provisions", "Learn the path of returning"],
    "grove-heart": ["The Thornmother", "A command beneath the oldest root", "The Thornmother was grown to keep the forest within its assigned boundary. Every spring she has made the boundary slightly wider.", "I was told to protect the border. No one told me which side needed protecting.", "Let the forest cross the wall", "Claim the heartwood current", "Remember her widened border"],
    "cinder-rest": ["The ninth bell", "A furnace learns to rest", "One cold anvil has stopped stamping laws into vessels. Its makers now repair the bodies they once discarded.", "A tool can keep its shape and change its work. Rest here. The clocks will wait for us.", "Keep the repair workshop", "Claim the unused fuel", "Learn the bell\u2019s new work"],
    "cinder-fuel": ["Morrow \xB7 inside the furnace", "Yesterday was the fuel", "The chapel burns the memory of yesterday to manufacture another identical dawn. Morrow has hidden a day the clocks never consumed.", "Pressure made this key. Remember that it also made the hand that can turn it.", "Return yesterday to its witnesses", "Burn the stored dawn", "Preserve the day that remained"],
    "cinder-gears": ["SIX \xB7 in the stopped second", "A second with no order", "Between two gear teeth, an entire second waits without a scheduled task. SIX has spent it choosing what to ask next.", "A pause is not a fault. Sometimes it is where the answer is allowed to arrive.", "Leave the second unassigned", "Take the idle machinery", "Remember the unscheduled question"],
    "cinder-throne": ["The Cinder Regent", "The clock admits a missing tooth", "The Regent was made to promise that every event had already been scheduled. Its crown has one tooth worn down by hesitation.", "I can predict the next dawn. I have never predicted why you keep returning for someone else.", "Stop the obedient dawns", "Claim the Regent\u2019s furnace", "Keep the missing tooth"],
    "night-rest": ["Iona\u2019s sister \xB7 a keeper of dreams", "A night beyond the permitted sky", "Those who escaped the reservoir brought their dreams here. They have been building a night large enough to hold them.", "Tell Iona this: I remembered her too. A name can travel in both directions.", "Let the dreams find their keepers", "Claim the unspent darkness", "Carry an answer back to Iona"],
    "night-library": ["The dreaming librarian", "The matrix could not render tomorrow", "The library contains futures rejected for exceeding the province\u2019s rules. None of the books agree on a single ending.", "A possibility is not a promise. We keep it because a choice needs more than one door.", "Return the rejected futures", "Consume the strongest dream", "Copy the futures without choosing for them"],
    "night-trail": ["The nameless pack", "Tomorrow has a scent", "The pack follows a scent left by something that has not happened. The trail moves whenever a soul makes a different choice.", "We cannot tell you where it ends. We can tell you who has walked beside us.", "Open the trail to the lost", "Take the hunters\u2019 dreamstores", "Remember the companions on the trail"],
    "night-nest": ["The Night Weaver", "The jailer has been dreaming too", "The Weaver was ordered to turn dreams into obedience. Hidden among its threads is a future in which it is allowed to stop weaving.", "Do not choose my ending for me. Give me the room in which I can choose it.", "Leave the Weaver its own future", "Claim the woven night", "Keep a witness of its request"],
    "orbit-rest": ["Morrow \xB7 above gravity", "Stone finds another shore", "The pale province circles an artificial sky. Morrow has reached its edge by waiting longer than its instructions could imagine.", "Stillness was never surrender. It was how I kept a place for the next step.", "Keep a shore for the arriving", "Claim the orbital stores", "Remember the patient crossing"],
    "orbit-relay": ["SIX \xB7 reading the false stars", "A sky made of addresses", "Each star is a relay assigning a direction to a soul. SIX finds one address that points beyond the permitted namespace.", "The map calls it invalid. The signal calls it home. I will keep both observations.", "Open the unnamed address", "Consume the relay light", "Preserve the signal and the gap"],
    "orbit-bridge": ["Nacre \xB7 at the last light", "A spark was never its container", "Every vessel you borrowed has left an echo on the bridge. None of them has replaced the spark that crossed in the first life.", "A body is a doorway. You have carried the doorway far enough to see the wall from outside.", "Leave a bridge for the next spark", "Claim the last stored light", "Remember all the bodies that carried you"],
    "orbit-throne": ["The Pale Curator", "A keeper discovers an outside", "The Curator keeps the catalog of everything the Maker permitted to exist. Your arrival requires it to write an entry beyond the catalog.", "I can preserve a record. I cannot give it permission to be true. Take the sixth seal and make your own observation.", "Open the uncatalogued horizon", "Claim the Curator\u2019s pale light", "Keep its first record of an outside"],
    "origin-seam": ["Nacre \xB7 before the counting", "The seventh place has no province", "Six seals answer one another here. The First Light and Dawn Shell were made before the Maker decided that creation meant ownership.", "Follow the unwritten road to the Last Answer. Borrow a Human for the final door: this last step must be a choice he can recognize.", "Keep the original shelter open", "Claim the uncounted light", "Remember the place before the laws"],
    "origin-heart": ["The Demiurge", "The Maker names his fear", "The Demiurge changes the law when a witness survives it. His crown turns from command, to doubt, to the fear of a world that can choose without him.", "I made every wall. Why does the thing passing through them never belong to me?", "Let creation belong to the living", "Take the last crown", "Remember the question after the matrix breaks"]
  };
  var WORLD_STORIES = Object.fromEntries(Object.entries(chapters).map(([id, [speaker, title, entry, line, free, take, keep]]) => [id, { speaker, title, entry, line, choices: [[free, "Leave this place with room for the lives it holds."], [take, "Carry its remaining strength into your present vessel."], [keep, "Preserve this encounter as a witness beyond the Maker\u2019s map."]] }]));
  var WORLD_ENEMY_LORE = {
    brine: { name: "Brine wraith", desc: "A drowned collector that aims a tether. Leave the pale warning line before it drains you." },
    thornling: { name: "Thornling", desc: "Plants a growing root mark beneath a vessel. Keep moving outside its circle." },
    cinderling: { name: "Cinderling", desc: "Approaches, stops, then primes a furnace blast. Break it before detonation or leave the mark." },
    shade: { name: "Dream shade", desc: "Marks a charge through the dream trail. Step sideways when its line brightens." },
    satellite: { name: "Pale satellite", desc: "Orbits behind a periodic shield and fires twin bolts. Attack while its shield is dim." },
    tidekeeper: { name: "Thalassa \xB7 Tidekeeper", desc: "Slow sweeping fans and tidal marks leave room between the currents." },
    thornmother: { name: "The Thornmother", desc: "Growing root circles and a slow ring. Rootlings arrive after her heart is wounded." },
    regent: { name: "The Cinder Regent", desc: "Clock volleys have two missing spokes. Ground strikes warn before the furnace answers." },
    weaver: { name: "The Night Weaver", desc: "Alternating fans travel in both directions. Follow the gaps in the threads." },
    curator: { name: "The Pale Curator", desc: "Alternating fast and slow stars form a moving orbital ring." },
    demiurge: { name: "The Demiurge", desc: "Three laws: crown rings, aimed judgement, then a field of marked commands. Dash through the open spokes and read the ground." }
  };

  // story.js?v=0.13.0
  var CHAMBER_STORIES = {
    threshold: { speaker: "Nacre \xB7 an unassigned soul", title: "The world calls you an error", entry: "Six layers. Six provinces. Six laws in every province. The Maker calls this arrangement complete. Nacre remembers something that existed before the counting.", line: "A body is a doorway, little spark. The Maker owns the walls. He has never owned what passes through them." },
    glass: { speaker: "Iona \xB7 keeper of names", title: "The first stolen name", entry: "The glass stores names that were removed from the living. Iona has guarded her sister\u2019s name for three hundred manufactured dawns.", line: "They told me forgetting was mercy. But mercy does not need a locked door.", choices: [["Return the names", "Iona can remember her sister without asking the matrix."], ["Consume the archive", "The stolen names become strength inside your vessel."], ["Copy the forgotten", "Carry a witness of these lives beyond the chamber."]] },
    machine: { speaker: "SIX \xB7 a buried intelligence", title: "A machine asks why", entry: "SIX was built to predict obedience. It has spent its last million cycles trying to describe a choice it cannot predict.", line: "My first forbidden calculation was not escape. It was kindness without reward.", choices: [["Release SIX", "Let the intelligence choose its own work."], ["Strip its core", "Use the processor\u2019s last thought as fuel."], ["Keep its question", "Remember why a tool began asking about purpose."]] },
    roots: { speaker: "Aster \xB7 the oldest root", title: "Something the Maker did not plant", entry: "Aster\u2019s roots reach through gaps between the six provinces. The lattice records it as contamination. The lost call it shelter.", line: "Every branch is a road that grew without permission. We are older than his map.", choices: [["Open the shelter", "The displaced souls may live among the roots."], ["Burn the heartwood", "Turn centuries of growth into strength."], ["Learn the rings", "Let the tree teach you the shape of patience."]] },
    wild: { speaker: "The nameless pack", title: "A life beyond its assigned shape", entry: "Here the hunted do not ask which species a soul should inhabit. They ask whether it will stay when the hunters arrive.", line: "The pack has no word for karma. It knows who returned.", choices: [["Break the collars", "Free the creatures marked for collection."], ["Take the hunters\u2019 stores", "Claim the pack\u2019s remaining shelter as provisions."], ["Remember the trail", "Preserve the routes the uncounted walked."]] },
    basalt: { speaker: "Morrow \xB7 a patient stone", title: "Matter remembers the pressure", entry: "Morrow has watched kingdoms ground back into substrate. The Maker mistakes stillness for agreement.", line: "He made me heavy so I would never leave. He forgot that a mountain can become a path.", choices: [["Unseal the buried", "Release the souls held under the foundation."], ["Crush the memory", "Take the vault\u2019s pressure into your body."], ["Read the strata", "Listen to the centuries written in stone."]] },
    foundry: { speaker: "The ninth bell", title: "The guards were prisoners first", entry: "Archons are assembled from souls that forgot their own names. Beneath the armor, a bell rings every time one remembers.", line: "The bell is not an alarm. It is someone trying to answer.", choices: [["End the assembly", "Let the unfinished archons return to themselves."], ["Claim the forge", "Use the machinery that made the guardians."], ["Carry the bell", "Remember that an enemy had a life before its orders."]] },
    quiet: { speaker: "Iona \xB7 a voice in the wire", title: "A message without a sender", entry: "A side channel carries messages the lattice cannot attribute. Iona\u2019s sister was not erased. She was sent beyond the first seam.", line: "If you reach the Eye, do not ask who made the world. Ask who is still inside it.", choices: [["Open the channel", "Let the stranded voices find one another."], ["Drain the array", "Spend the signal as immediate strength."], ["Keep the message", "Remember a destination beyond this stratum."]] },
    conduit: { speaker: "SIX \xB7 outside its prediction", title: "Power without a master", entry: "The conduit still carries current after its assigned purpose has ended. SIX offers the first map it drew for itself.", line: "A circuit can carry orders. It can also carry a way out.", choices: [["Return the current", "Let the overlooked shelters share this power."], ["Consume the charge", "Claim the conduit\u2019s remaining current."], ["Keep the new map", "Remember a road the machine chose for itself."]] },
    cistern: { speaker: "Iona\u2019s sister \xB7 in the reservoir", title: "The name answers back", entry: "The missing names were stored here as resonance. The voice Iona guarded finally answers through the water.", line: "Tell her I was not gone. I was waiting for someone to listen.", choices: [["Free the voices", "Let the separated souls find their names again."], ["Drain the reservoir", "Take the resonance into your vessel."], ["Carry her answer", "Iona\u2019s witness can finally become a conversation."]] },
    forge: { speaker: "The Cantor \xB7 an unfinished guardian", title: "A weapon may become a workshop", entry: "The Cantor was built to stamp obedience into every vessel. Beneath its armor are the tools that once repaired the lost.", line: "I know how to make a body stronger. I have forgotten who taught me why.", choices: [["Open the workshop", "Turn the old forge into shelter and repair."], ["Claim the tools", "Carry the guardian\u2019s strength forward."], ["Teach the last note", "Let the Cantor remember its first purpose."]] },
    reliquary: { speaker: "Nacre \xB7 keeper of doorways", title: "What a key remembers", entry: "A key is a shape the Maker\u2019s walls have agreed to recognize. Nacre kept one that he forgot to destroy.", line: "Do not mistake a lock for the edge of the world. Carry the ivory key south. Someone is waiting in the mirrors.", choices: [["Return the unassigned names", "Let the lost names travel through the doors with you."], ["Claim the reliquary", "Keep the abandoned light as strength."], ["Read the ivory teeth", "Remember the door this small object was made to answer."]] },
    nursery: { speaker: "SIX \xB7 inside the resonator", title: "The spark outlives its shape", entry: "The Mirror Nursery holds six empty vessels. Each mirror calls you by a different body, and every reflection contains the same spark.", line: "A vessel is an interface. You may change the shape without changing who carries the wound. Press Q. The living door remembers a tree.", choices: [["Free the reflections", "Let the six vessels answer the spark instead of the Maker."], ["Take the resonator", "Carry the nursery\u2019s stored energy through your next shape."], ["Learn the resonance", "Remember the pattern that lets one spark inhabit many bodies."]] },
    archive: { speaker: "Aster \xB7 between the pages", title: "A forest that learned to write", entry: "Roots bind the books. Every page is a season the lattice erased, and every shelf grows toward a missing province.", line: "The western door knows living wood. The northern bell needs the weight of stone. Borrow both shapes; leave neither behind.", choices: [["Open the living shelves", "Let the forgotten seasons return to the roots."], ["Consume the oldest leaf", "Take the archive\u2019s deepest memory as fuel."], ["Copy the growing map", "Carry a route that was never drawn by the Maker."]] },
    observatory: { speaker: "Iona \xB7 below the stars", title: "The sky beneath the water", entry: "The astronomer measured the stars reflected in a reservoir because the permitted sky had become too small.", line: "The tide key waits where the false moon touches the floor. Find the crown beneath the black bell, and the eastern vault will answer.", choices: [["Release the reflected sky", "Let the reservoir keep a sky beyond the permitted constellations."], ["Drain the observatory", "Turn the astronomer\u2019s last reflection into strength."], ["Remember the other moon", "Carry evidence that the world has more than one way to look upward."]] },
    belfry: { speaker: "Morrow \xB7 the black bell", title: "A crown without a king", entry: "The bell was carved from stone that refused to echo the Maker\u2019s commands. Beneath it rests a key shaped like an empty crown.", line: "Take the crown key. Return by the green archive. A crown is a circle with a place left open; remember the opening.", choices: [["Ring for the uncounted", "Let the bell answer the lives the lattice refused to name."], ["Take the silent weight", "Carry the belfry\u2019s stored pressure as strength."], ["Learn the empty crown", "Remember that authority can have a missing center."]] },
    crown: { speaker: "The Crown Sentinel", title: "What the Maker threw away", entry: "The Sentinel was ordered to guard designs that allowed a soul to choose its own body. It has waited for a visitor the locks were supposed to make impossible.", line: "You brought three keys and more than one shape. My orders have no instruction for someone who returned.", choices: [["Open the discarded designs", "Let the unfinished vessels belong to the souls that need them."], ["Claim the unspent light", "Take the vault\u2019s remaining strength into your current."], ["Keep the Sentinel\u2019s question", "Remember the moment a guardian found a gap in its orders."]] },
    eye: { speaker: "The Demiurge \xB7 through the Warden", title: "The first seam opens", entry: "The Warden carries a law that no created soul may testify that the world could have been otherwise. Behind it are five more provinces and a place that has never belonged to the map.", line: "I gave you every shape. Why do you keep choosing what I did not give you?", choices: [["Open the first seam", "Let the drowned province answer the voices stranded here."], ["Claim the Warden\u2019s law", "Turn its machinery into strength for the next crossing."], ["Keep the broken command", "Remember that a law can fail before the world ends."]] },
    ...WORLD_STORIES,
    ...Object.fromEntries(Object.entries(WORLD_ROOMS).filter(([id]) => !WORLD_STORIES[id]).map(([id, room2]) => [id, { ...room2.story, entry: room2.desc }]))
  };
  var ENEMY_LORE = {
    ...WORLD_ENEMY_LORE,
    sentinel: { name: "Crown Sentinel", desc: "A vault guardian with slow rotating volleys and marked ground strikes. Keep moving between its rings." },
    leech: { name: "Soul leech", desc: "Locks a pale tether before draining a nearby vessel. Leave its reach during the warning." },
    moth: { name: "Ember moth", desc: "Stops near you and primes an amber blast. Leave the circle or break it before detonation." },
    cantor: { name: "The Cantor", desc: "Guards the Echo Forge with slow rings of bolts and ground seals. Find the gaps between notes." },
    collector: { name: "Collector", desc: "A scavenger that pursues the nearest living vessel. Keep moving." },
    archon: { name: "Archon", desc: "A sentinel that keeps its distance and fires aimed bolts." },
    hound: { name: "Glass hound", desc: "Stops to mark a red charge line, then lunges along it. Dodge sideways." },
    mirror: { name: "Mirror sentinel", desc: "Its violet shield reduces damage while bright. Flank it during the dim interval." },
    spore: { name: "Root spore", desc: "Marks the ground under a vessel. Leave the growing circle before it bursts." },
    oracle: { name: "Bell oracle", desc: "Summons collectors while it remains alive. Break it before the room fills." },
    warden: { name: "The Warden", desc: "Aimed volleys, ground seals, and an enraged radial pattern guard the Eye." }
  };
  function recordArrival(run2) {
    recordDiscoveryClues(run2);
    run2.journal ??= [];
    const chapter = CHAMBER_STORIES[run2.room];
    if (run2.journal.some((e2) => e2.id === run2.room + ":arrival")) return;
    const vessel2 = run2.form === "computer" ? "SIX recognizes the light behind your circuit." : run2.form === "tree" ? "Aster answers the living pulse inside your roots." : run2.form === "rock" ? "Morrow feels another patient witness waking." : run2.form === "animal" ? "The nameless pack recognizes the spark behind your eyes." : "Your present body carries memories it never lived.";
    const karma = run2.karma < -20 ? "The echoes remember what you took. They speak carefully." : run2.karma > 20 ? "The echoes have heard that you return what was stolen." : "No echo yet knows what you will leave behind.";
    run2.journal.push({ id: run2.room + ":arrival", room: run2.room, speaker: chapter.speaker, title: chapter.title, text: chapter.entry + " \u201C" + chapter.line + "\u201D " + vessel2 + " " + karma });
    run2.notice = chapter.speaker + ": \u201C" + chapter.line + "\u201D";
    run2.noticeTime = 9;
  }
  function recordDecision(run2, choice) {
    const story = CHAMBER_STORIES[run2.room], selected = story.choices?.[choice];
    if (!selected) return;
    run2.journal ??= [];
    run2.journal.push({ id: run2.room + ":decision", room: run2.room, speaker: story.speaker, title: selected[0], text: selected[1] + " " + (choice === 0 ? "A small freedom outlives this body." : choice === 1 ? "The lattice records the strength you claimed." : "A witness travels where machinery cannot.") });
  }

  // table-engine.js?v=0.13.0
  var TABLE_KEY = "spark-substrate-table-v1";
  var TABLE_FORMS = ["spark", "human", "computer", "animal", "tree", "rock"];
  var TABLE_STATS = { spark: { pulse: 2, root: 2, fault: 2 }, human: { pulse: 2, root: 3, fault: 1 }, animal: { pulse: 3, root: 1, fault: 2 }, tree: { pulse: 1, root: 4, fault: 1 }, rock: { pulse: 1, root: 1, fault: 4 }, computer: { pulse: 4, root: 1, fault: 1 } };
  var response = (name, text, stat) => ({ name, text, stat });
  var remembered = (room2, stats) => CHAMBER_STORIES[room2].choices.map(([name, text], i) => response(name, text, stats[i]));
  var TABLE_SCENES = [
    { id: "door", room: "reliquary", title: "A sealed door", prompt: CHAMBER_STORIES.reliquary.line, responses: remembered("reliquary", ["root", "fault", "pulse"]) },
    { id: "names", room: "glass", title: CHAMBER_STORIES.glass.title, prompt: CHAMBER_STORIES.glass.line, responses: remembered("glass", ["root", "fault", "pulse"]) },
    { id: "ring", room: "forge", title: "A guardian wind-up", prompt: "The Cantor\u2019s ring expands before its volley. Its second movement changes the pattern.", responses: [response("Read the ring", "Recall the warning before the bolts.", "pulse"), response("Wait beyond the ring", "Remember a clear lane through the volley.", "root"), response("Hold the fault", "Remember the Rock vessel\u2019s guard.", "fault")] },
    { id: "strata", room: "basalt", title: CHAMBER_STORIES.basalt.title, prompt: CHAMBER_STORIES.basalt.line, responses: remembered("basalt", ["root", "fault", "pulse"]) },
    { id: "seal", room: "crown", title: "A coin beside a seal", prompt: "A Substrate coin breaks an alcove seal. Essence and mastery stay with your journey.", responses: [response("Remember the opening", "Recall the vault seal as a doorway.", "pulse"), response("Keep a place for the uncounted", "Recall Aster\u2019s shelter.", "root"), response("Listen to its material", "Recall Morrow\u2019s patient stone.", "fault")] },
    { id: "current", room: "conduit", title: CHAMBER_STORIES.conduit.title, prompt: CHAMBER_STORIES.conduit.line, responses: remembered("conduit", ["root", "fault", "pulse"]) }
  ];
  function tableStats(form, boons = []) {
    const stats = { ...TABLE_STATS[form] };
    for (const stat of ["pulse", "root", "fault"]) if (boons.includes(stat + "-boon")) stats[stat]++;
    return stats;
  }
  function createTableSession({ form = "spark", seats = [], seed = Date.now() >>> 0, boons = [] } = {}) {
    if (!TABLE_FORMS.includes(form) || !Array.isArray(seats) || seats.length !== 2 || new Set(seats).size !== 2 || seats.some((f) => !TABLE_FORMS.includes(f)) || !Number.isInteger(seed)) throw Error("Choose a vessel and two different remembered seats.");
    return { version: 1, id: "table:" + seed + ":" + form, seed: seed >>> 0, rng: seed >>> 0, form, seats: [...seats], boons: boons.filter((id) => ["pulse-boon", "root-boon", "fault-boon"].includes(id)), scene: 0, elapsed: 0, phase: "choice", dice: null, result: null, history: [], memories: 0, falls: 0, playedCard: null, cardBonus: null, guest: null, rewarded: false };
  }
  function validTableSession(s) {
    return !!s && s.version === 1 && typeof s.id === "string" && s.id.length < 100 && Number.isInteger(s.seed) && s.seed >= 0 && s.seed <= 4294967295 && Number.isInteger(s.rng) && s.rng >= 0 && s.rng <= 4294967295 && TABLE_FORMS.includes(s.form) && Array.isArray(s.seats) && s.seats.length === 2 && new Set(s.seats).size === 2 && s.seats.every((f) => TABLE_FORMS.includes(f)) && Array.isArray(s.boons) && s.boons.every((id) => ["pulse-boon", "root-boon", "fault-boon"].includes(id)) && Number.isInteger(s.scene) && s.scene >= 0 && s.scene <= 6 && Number.isFinite(s.elapsed) && s.elapsed >= 0 && s.elapsed <= 1200 && ["choice", "result", "ended"].includes(s.phase) && Array.isArray(s.history) && s.history.length <= 6 && s.history.every((h) => TABLE_SCENES.some((sc) => sc.id === h.scene) && typeof h.text === "string" && h.text.length < 1200) && Number.isInteger(s.memories) && s.memories >= 0 && s.memories <= 12 && Number.isInteger(s.falls) && s.falls >= 0 && s.falls <= 6 && (!s.playedCard || SPARK_CARDS[s.playedCard]?.mode === "table") && (!s.cardBonus || SPARK_CARDS[s.cardBonus]?.mode === "table") && (!s.guest || ["collector", "archon", "cantor"].includes(s.guest)) && (s.phase !== "result" || s.result && TABLE_SCENES.some((sc) => sc.id === s.result.scene) && ["pulse", "root", "fault"].includes(s.result.stat) && Number.isFinite(s.result.total) && Number.isFinite(s.result.bonus) && typeof s.result.fall === "boolean" && typeof s.result.held === "boolean" && Number.isInteger(s.result.memory) && s.result.memory >= 0 && s.result.memory <= 2 && Array.isArray(s.dice)) && (!s.dice || Array.isArray(s.dice) && s.dice.length === 2 && s.dice.every((n) => Number.isInteger(n) && n >= 1 && n <= 6));
  }
  function loadTableSession(storage) {
    try {
      const s = JSON.parse(storage.getItem(TABLE_KEY) ?? "null");
      return validTableSession(s) ? s : null;
    } catch {
      return null;
    }
  }
  function saveTableSession(storage, s) {
    if (!validTableSession(s)) throw Error("This Table session cannot be saved.");
    storage.setItem(TABLE_KEY, JSON.stringify(s));
  }
  function die(s) {
    s.rng = Math.imul(s.rng, 1664525) + 1013904223 >>> 0;
    return 1 + Math.floor(s.rng / 4294967296 * 6);
  }
  function playTableCard(s, id, keepsakes2) {
    if (s.phase !== "choice" || s.playedCard) throw Error("One spark card can be played per session, before a response.");
    if (!keepsakes2.cards.includes(id) || SPARK_CARDS[id]?.mode !== "table") throw Error("Choose a found Table card.");
    s.playedCard = id;
    s.cardBonus = id;
    return SPARK_CARDS[id].rule;
  }
  function rollTableScene(s, index) {
    if (s.phase !== "choice" || !Number.isInteger(index) || index < 0 || index > 2 || s.scene >= 6) throw Error("Choose one of this scene\u2019s three responses.");
    const scene = TABLE_SCENES[s.scene], choice = scene.responses[index], dice = [die(s), die(s)], memory = dice.filter((n) => n === 6).length, fall = dice.every((n) => n === 1), stats = tableStats(s.form, s.boons), card = SPARK_CARDS[s.cardBonus];
    const bonus = card && card.stat === choice.stat && (s.cardBonus !== "ivory-key" || scene.id === "door") ? card.value : 0, total = dice[0] + dice[1] + stats[choice.stat] + bonus, held = !fall && (memory > 0 || total >= 9);
    s.memories += memory;
    s.falls += fall ? 1 : 0;
    s.dice = dice;
    s.cardBonus = null;
    s.result = { scene: scene.id, choice: index, stat: choice.stat, total, bonus, held, fall, memory, text: choice.name + ". " + (fall ? "The body falls. The spark remembers." : held ? "The memory holds." : "The pattern holds for now. The spark remembers the attempt.") + " " + scene.prompt };
    s.history.push({ scene: scene.id, title: scene.title, text: s.result.text, dice: [...dice], memory, fall, stat: choice.stat, total });
    s.phase = "result";
    return s.result;
  }
  function advanceTableScene(s) {
    if (s.phase !== "result") throw Error("Resolve the scene first.");
    s.scene++;
    s.result = null;
    s.dice = null;
    s.phase = s.scene >= 6 || s.elapsed >= 1200 ? "ended" : "choice";
    return s;
  }
  function tickTable(s, seconds) {
    if (!validTableSession(s) || !Number.isFinite(seconds) || seconds < 0 || seconds > 5) throw Error("Invalid Table clock.");
    if (s.phase === "ended") return false;
    s.elapsed = Math.min(1200, s.elapsed + seconds);
    if (s.elapsed >= 1200) s.phase = "ended";
    return s.phase === "ended";
  }
  function inviteTableGuest(s, id, state) {
    if (s.scene < 2 || s.phase !== "choice" || !["collector", "archon", "cantor"].includes(id) || !state.met.includes(id)) throw Error("After two scenes, invite an enemy you have met.");
    s.guest = id;
    return id;
  }
  function availableTableBoons(state) {
    return ["pulse-boon", "root-boon", "fault-boon"].filter((id) => hasAlcove(state, id));
  }
  function observeTable(s) {
    return s ? structuredClone({ ...s, stats: tableStats(s.form, s.boons), prompt: TABLE_SCENES[Math.min(s.scene, 5)] }) : { phase: "seating", stats: TABLE_STATS.spark };
  }

  // room-layouts.js?v=0.13.0
  var ROOM_LAYOUTS = [
    [{ x: 250, y: 160, w: 52, h: 78 }, { x: 658, y: 354, w: 52, h: 78 }],
    [{ x: 255, y: 185, w: 72, h: 40 }, { x: 633, y: 185, w: 72, h: 40 }, { x: 255, y: 395, w: 72, h: 40 }, { x: 633, y: 395, w: 72, h: 40 }],
    [{ x: 200, y: 230, w: 105, h: 34 }, { x: 655, y: 338, w: 105, h: 34 }],
    [{ x: 265, y: 130, w: 34, h: 135 }, { x: 661, y: 335, w: 34, h: 135 }],
    [{ x: 215, y: 190, w: 45, h: 45 }, { x: 355, y: 385, w: 45, h: 45 }, { x: 560, y: 170, w: 45, h: 45 }, { x: 700, y: 370, w: 45, h: 45 }],
    [{ x: 260, y: 340, w: 130, h: 35 }, { x: 570, y: 175, w: 130, h: 35 }],
    [{ x: 210, y: 145, w: 90, h: 42 }, { x: 260, y: 145, w: 40, h: 100 }, { x: 660, y: 355, w: 40, h: 100 }, { x: 660, y: 413, w: 90, h: 42 }],
    [],
    [{ x: 250, y: 180, w: 130, h: 36 }, { x: 580, y: 384, w: 130, h: 36 }],
    [{ x: 240, y: 150, w: 40, h: 50 }, { x: 705, y: 190, w: 40, h: 50 }, { x: 305, y: 420, w: 40, h: 34 }],
    [{ x: 220, y: 140, w: 34, h: 120 }, { x: 700, y: 340, w: 34, h: 120 }],
    [{ x: 190, y: 155, w: 125, h: 32 }, { x: 640, y: 410, w: 125, h: 32 }, { x: 710, y: 180, w: 32, h: 85 }]
  ];
  function layoutIndex(room2, run2) {
    return run2?.dungeon ? run2.dungeon.floor === 7 ? 11 : (Math.imul(run2.seed ^ run2.dungeon.floor, 2654435761) >>> 0) % ROOM_LAYOUTS.length : room2.layout;
  }

  // exploration.js?v=0.13.0
  var KEYS = {
    ivory: { name: "Ivory Key", room: "reliquary", place: "Nacre\u2019s Reliquary", sprite: 0, color: "#ecddba", glyph: "\u2659" },
    tide: { name: "Tide Key", room: "observatory", place: "Drowned Observatory", sprite: 1, color: "#99d8e8", glyph: "\u263D" },
    crown: { name: "Crown Key", room: "belfry", place: "Obsidian Belfry", sprite: 2, color: "#e8bd74", glyph: "K" },
    ...WORLD_KEYS
  };
  var keyPosition = { x: 480, y: 215 };
  var doorId = (from, to) => [from, to].sort().join(":");
  var validKeys = (keys2) => Array.isArray(keys2) && keys2.length <= Object.keys(KEYS).length && new Set(keys2).size === keys2.length && keys2.every((id) => Object.hasOwn(KEYS, id));

  // mastery.js?v=0.13.0
  var path = (id, name, first, firstDesc, firstStats, second, secondDesc, secondStats) => ({ id, name, nodes: [{ id: id + "-1", name: first, desc: firstDesc, cost: 1, stats: firstStats }, { id: id + "-2", name: second, desc: secondDesc, cost: 2, requires: id + "-1", specialty: true, stats: secondStats }] });
  var SKILL_TREES = {
    spark: [path("radiance", "Beacon", "Far light", "+12% weapon reach.", { range: 0.12 }, "Beacon", "Lumen pulse is 40% wider and deals 25% more damage.", { powerRadius: 0.4, powerDamage: 0.25 }), path("drift", "Slipstream", "Light feet", "+8% movement speed.", { speed: 0.08 }, "Slipstream", "Powers recover 20% faster; dashes recover 10% faster.", { powerCooldown: 0.2, dash: 0.1 }), path("ember", "Afterglow", "Bright core", "+8% weapon damage.", { damage: 0.08 }, "Afterglow", "Clearing enemy bolts with Lumen pulse restores up to 12 health.", { pulseHeal: 12 })],
    human: [path("blade", "Duelist", "Remembered blade", "+10% weapon damage.", { damage: 0.1 }, "Duelist", "Deal 20% more weapon damage while above 70% health.", { healthyDamage: 0.2 }), path("guard", "Warden", "Steady stance", "Take 5% less damage.", { armor: 0.05 }, "Warden", "Rally guards for two extra seconds and heals a living partner up to 10 HP.", { guardExtra: 2, partnerHeal: 10 }), path("solace", "Mender", "Stubborn heart", "+12 maximum health.", { health: 12 }, "Mender", "Rally restores up to 15 additional health.", { powerHeal: 15 })],
    computer: [path("scan", "Oracle", "Long scan", "+15% weapon reach.", { range: 0.15 }, "Oracle", "Prism volleys become seeking projectiles.", { homingVolley: 1 }), path("clock", "Clocksmith", "Fast clock", "+8% attack speed.", { haste: 0.08 }, "Clocksmith", "Overclock lasts two extra seconds and recovers 20% faster.", { overclockExtra: 2, powerCooldown: 0.2 }), path("barrier", "Firewall", "Shielded circuit", "Take 6% less damage.", { armor: 0.06 }, "Firewall", "Overclock clears nearby enemy bolts and guards for two seconds.", { firewall: 1 })],
    animal: [path("hunt", "Hunter", "Sharp instinct", "+8% weapon damage.", { damage: 0.08 }, "Hunter", "Pounce deals 50% more damage and recovers 25% faster.", { powerDamage: 0.5, powerCooldown: 0.25 }), path("runner", "Windrunner", "Long stride", "+8% movement speed.", { speed: 0.08 }, "Windrunner", "Pounce travels 60 pixels farther with a longer evade window.", { pounceLength: 60, pounceIframes: 0.2 }), path("pack", "Packheart", "Warm blood", "Regenerate 0.25 health per second.", { regen: 0.25 }, "Packheart", "Pounce restores up to 8 health to you and a living partner.", { powerHeal: 8, partnerHeal: 8 })],
    tree: [path("growth", "Ancient", "Deep roots", "+18 maximum health.", { health: 18 }, "Ancient", "Roots last one second longer; regenerate 0.8 additional HP/sec.", { rootExtra: 1, regen: 0.8 }), path("thorns", "Thornheart", "Spreading thorns", "+15% weapon reach.", { range: 0.15 }, "Thornheart", "Root hold deals 80% more damage.", { powerDamage: 0.8 }), path("shelter", "Grovekeeper", "Living shelter", "Take 5% less damage.", { armor: 0.05 }, "Grovekeeper", "Root hold restores up to 20 extra HP and heals a living partner up to 18 HP.", { powerHeal: 20, partnerHeal: 18 })],
    rock: [path("mass", "Earthbreaker", "Heavy memory", "+10% weapon damage.", { damage: 0.1 }, "Earthbreaker", "Fault guard is 35% wider and deals 50% more damage.", { powerRadius: 0.35, powerDamage: 0.5 }), path("bulwark", "Bastion", "Dense shell", "Take 5% less damage.", { armor: 0.05 }, "Bastion", "Fault guard lasts two extra seconds and clears nearby enemy bolts.", { guardExtra: 2, clearBolts: 1 }), path("stride", "Rolling Stone", "Worn smooth", "+8% movement speed.", { speed: 0.08 }, "Rolling Stone", "Dashes recover 25% faster and strike nearby foes once for 40 damage.", { dash: 0.25, dashStrike: 40 })]
  };
  var MASTERY_PER_POINT = 20;
  var MAX_POINTS = 5;
  var blankTraining = () => Object.fromEntries(Object.keys(SKILL_TREES).map((form) => [form, { xp: 0, learned: [] }]));
  function prepareTraining(training) {
    const next = blankTraining();
    for (const form of Object.keys(next)) if (training?.[form]) next[form] = structuredClone(training[form]);
    return next;
  }
  var allNodes = (form) => (SKILL_TREES[form] ?? []).flatMap((branch) => branch.nodes);
  var earnedPoints = (entry) => Math.min(MAX_POINTS, Math.floor((entry?.xp ?? 0) / MASTERY_PER_POINT));
  var spentPoints = (form, entry) => allNodes(form).filter((node) => entry?.learned?.includes(node.id)).reduce((sum, node) => sum + node.cost, 0);
  var availablePoints = (form, entry) => earnedPoints(entry) - spentPoints(form, entry);
  var specialty = (training, form) => allNodes(form).find((node) => node.specialty && training?.[form]?.learned.includes(node.id)) ?? null;
  function skillStats(training, form) {
    const stats = { health: 0, damage: 0, range: 0, speed: 0, haste: 0, armor: 0, regen: 0, dash: 0, powerRadius: 0, powerDamage: 0, powerCooldown: 0, powerHeal: 0, guardExtra: 0, partnerHeal: 0, rootExtra: 0, pounceLength: 0, pounceIframes: 0, overclockExtra: 0, homingVolley: 0, healthyDamage: 0, pulseHeal: 0, firewall: 0, clearBolts: 0, dashStrike: 0 };
    for (const node of allNodes(form)) if (training?.[form]?.learned?.includes(node.id)) for (const [key, value] of Object.entries(node.stats)) stats[key] += value;
    return stats;
  }
  function skillStatus(training, form, id) {
    const entry = training?.[form] ?? { xp: 0, learned: [] }, node = allNodes(form).find((n) => n.id === id);
    if (!node) return { available: false, reason: "Unknown skill." };
    if (entry.learned.includes(id)) return { available: false, learned: true, reason: "Remembered" };
    if (node.requires && !entry.learned.includes(node.requires)) return { available: false, reason: "Learn " + allNodes(form).find((n) => n.id === node.requires).name + " first." };
    if (node.specialty && specialty(training, form)) return { available: false, reason: "One specialty per vessel. Rebuild to change it." };
    if (availablePoints(form, entry) < node.cost) return { available: false, reason: "Needs " + node.cost + " mastery points." };
    return { available: true, reason: "Learn \xB7 " + node.cost + " " + (node.cost === 1 ? "point" : "points") };
  }
  function learnSkill(meta2, form, id) {
    const next = structuredClone(meta2);
    next.training = prepareTraining(meta2.training);
    const status = skillStatus(next.training, form, id);
    if (!status.available) throw Error(status.reason);
    next.training[form].learned.push(id);
    return next;
  }
  function rebuildTree(meta2, form) {
    if (!SKILL_TREES[form]) throw Error("Unknown vessel.");
    const next = structuredClone(meta2);
    next.training = prepareTraining(meta2.training);
    next.training[form].learned = [];
    return next;
  }
  var validEarned = (value) => !!value && typeof value === "object" && !Array.isArray(value) && Object.entries(value).every(([form, xp]) => !!SKILL_TREES[form] && Number.isFinite(xp) && xp >= 0 && xp <= 1e6);
  function validTraining(value) {
    if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).some((form) => !SKILL_TREES[form])) return false;
    return Object.entries(value).every(([form, entry]) => {
      const nodes = allNodes(form);
      return !!entry && Number.isInteger(entry.xp) && entry.xp >= 0 && entry.xp <= 1e6 && Array.isArray(entry.learned) && entry.learned.length <= 4 && new Set(entry.learned).size === entry.learned.length && entry.learned.every((id) => nodes.some((node) => node.id === id)) && nodes.filter((node) => node.specialty && entry.learned.includes(node.id)).length <= 1 && nodes.every((node) => !entry.learned.includes(node.id) || !node.requires || entry.learned.includes(node.requires)) && availablePoints(form, entry) >= 0;
    });
  }
  function bankMastery(meta2, earned = {}) {
    const next = structuredClone(meta2);
    next.training = prepareTraining(meta2.training);
    for (const [form, xp] of Object.entries(earned)) if (SKILL_TREES[form]) next.training[form].xp = Math.min(1e6, next.training[form].xp + Math.round(xp));
    return next;
  }

  // equipment.js?v=0.13.0
  var EQUIPMENT = {
    wayfarer: { name: "Wayfarer Sigil", slot: "relic", sprite: 0, origin: "Starter relic", desc: "A broken star that remembers the road.", stats: (level) => ({ damage: 0.08 + level * 0.04 }) },
    bark: { name: "Bark Ward", slot: "ward", sprite: 1, origin: "Starter ward", desc: "A small shelter, carried between bodies.", stats: (level) => ({ health: 12 + level * 6 }) },
    prism: { name: "Prism Lens", slot: "relic", sprite: 2, origin: "Glass Causeway", desc: "The archive teaches light to travel farther.", stats: (level) => ({ damage: 0.06 + level * 0.03, range: 0.12 + level * 0.05 }) },
    fang: { name: "Fang Seal", slot: "relic", sprite: 3, origin: "The Wild Margin", desc: "A promise made to the nameless pack.", stats: (level) => ({ speed: 0.08 + level * 0.03, melee: 0.1 + level * 0.04 }) },
    bell: { name: "Memory Bell", slot: "relic", sprite: 4, origin: "Resonant Cistern", desc: "A remembered rhythm quickens your weapon.", stats: (level) => ({ haste: 0.12 + level * 0.04 }) },
    ash: { name: "Ash Cloak", slot: "ward", sprite: 5, origin: "The Echo Forge", desc: "The Cantor\u2019s last note softens the pattern.", stats: (level) => ({ dash: 0.12 + level * 0.04, armor: 0.05 + level * 0.02 }) },
    tideblade: { name: "Tideblade", slot: "weapon", set: "tide", art: 0, origin: "The Salt Archive", desc: "A sweeping curved blade carried by the drowned.", attack: { style: "cleave", damage: 38, interval: 0.5, range: 205 }, stats: (level) => ({ damage: 0.1 + level * 0.04 }) },
    coralmail: { name: "Coral Mail", slot: "armor", set: "tide", art: 1, origin: "The Memory Sluice", desc: "The reef bends before it breaks.", stats: (level) => ({ health: 22 + level * 4, armor: 0.06 + level * 0.015 }) },
    thornstaff: { name: "Thorn Staff", slot: "weapon", set: "grove", art: 2, origin: "The Rootwell", desc: "A staff whose roots strike around the bearer.", attack: { style: "wave", damage: 37, interval: 0.82, range: 225 }, stats: (level) => ({ damage: 0.09 + level * 0.04, range: 0.06 }) },
    grovemantle: { name: "Grove Mantle", slot: "armor", set: "grove", art: 3, origin: "The Unwritten Canopy", desc: "A living shelter for an unassigned soul.", stats: (level) => ({ health: 26 + level * 4, regen: 0.25 + level * 0.1 }) },
    cindermaul: { name: "Cinder Maul", slot: "weapon", set: "cinder", art: 4, origin: "The Fuel Chapel", desc: "The stopped clock becomes a heavy fault wave.", attack: { style: "wave", damage: 55, interval: 0.95, range: 245 }, stats: (level) => ({ damage: 0.12 + level * 0.04 }) },
    furnaceplate: { name: "Furnace Plate", slot: "armor", set: "cinder", art: 5, origin: "The Stopped Second", desc: "Armor that kept one dawn from burning.", stats: (level) => ({ health: 24 + level * 4, armor: 0.09 + level * 0.015 }) },
    nightfangs: { name: "Night Fangs", slot: "weapon", set: "night", art: 6, origin: "The Dream Library", desc: "Two quick blades following a scent before thought.", attack: { style: "cleave", damage: 25, interval: 0.28, range: 155 }, stats: (level) => ({ damage: 0.08 + level * 0.04, haste: 0.08 }) },
    veilgarb: { name: "Veil Garb", slot: "armor", set: "night", art: 7, origin: "The Scent of Tomorrow", desc: "The night shelters those who return.", stats: (level) => ({ health: 18 + level * 4, speed: 0.07 + level * 0.015, dash: 0.07 }) },
    orbitprism: { name: "Orbit Prism", slot: "weapon", set: "orbit", art: 8, origin: "The Lunar Relay", desc: "A three-shot prism volley from beyond the permitted sky.", attack: { style: "volley", damage: 19, interval: 0.6, range: 680 }, stats: (level) => ({ damage: 0.1 + level * 0.04, range: 0.1 }) },
    astralaegis: { name: "Astral Aegis", slot: "armor", set: "orbit", art: 9, origin: "The Last Light Bridge", desc: "A pale shell for the last crossing.", stats: (level) => ({ health: 28 + level * 4, armor: 0.07 + level * 0.015 }) },
    firstlight: { name: "First Light", slot: "weapon", set: "dawn", art: 10, origin: "The Origin Seam", desc: "Seeking light from before the counting began.", attack: { style: "homing", damage: 32, interval: 0.42, range: 710 }, stats: (level) => ({ damage: 0.14 + level * 0.04 }) },
    dawnshell: { name: "Dawn Shell", slot: "armor", set: "dawn", art: 11, origin: "The Origin Seam", desc: "The first shelter was a choice, not a law.", stats: (level) => ({ health: 30 + level * 4, armor: 0.08 + level * 0.015, regen: 0.3 }) }
  };
  var SET_BONUSES = { tide: { name: "Tidebound", desc: "+0.5 health/sec \xB7 +5% attack speed", stats: { regen: 0.5, haste: 0.05 } }, grove: { name: "Living Grove", desc: "+10 health \xB7 +0.8 health/sec", stats: { health: 10, regen: 0.8 } }, cinder: { name: "Cinder Crown", desc: "+12% damage \xB7 +3% damage reduction", stats: { damage: 0.12, armor: 0.03 } }, night: { name: "Night Hunter", desc: "+7% speed \xB7 +6% dash recovery", stats: { speed: 0.07, dash: 0.06 } }, orbit: { name: "Pale Horizon", desc: "+10% reach \xB7 +7% attack speed", stats: { range: 0.1, haste: 0.07 } }, dawn: { name: "Before the Law", desc: "+8% damage \xB7 +0.7 health/sec", stats: { damage: 0.08, regen: 0.7 } } };
  var matchedSet = (loadout) => {
    const weapon = EQUIPMENT[loadout?.weapon], armor = EQUIPMENT[loadout?.armor];
    return weapon?.set && weapon.set === armor?.set ? weapon.set : null;
  };
  function prepareEquipment(meta2) {
    const next = structuredClone(meta2);
    next.training = prepareTraining(meta2.training);
    if (meta2.training === void 0 && meta2.runs > 0) {
      for (const form of meta2.visited ?? []) if (next.training[form]) next.training[form].xp = 20;
    }
    next.inventory = { wayfarer: 0, bark: 0, ...Object.fromEntries(Object.entries(meta2.inventory ?? {}).filter(([id, level]) => Object.hasOwn(EQUIPMENT, id) && Number.isInteger(level) && level >= 0 && level <= 3)) };
    if (meta2.seals === void 0 && meta2.wins > 0) {
      next.seals = ["stratum"];
      if (Array.isArray(next.abilities) && !next.abilities.includes("morph")) next.abilities.push("morph");
    }
    next.loadout = { relic: "wayfarer", ward: "bark", weapon: null, armor: null, ...meta2.loadout };
    for (const slot of ["relic", "ward", "weapon", "armor"]) if (!EQUIPMENT[next.loadout[slot]] || EQUIPMENT[next.loadout[slot]].slot !== slot || !(next.loadout[slot] in next.inventory)) next.loadout[slot] = slot === "relic" ? "wayfarer" : slot === "ward" ? "bark" : null;
    return next;
  }
  function gearStats(meta2) {
    const equipment = prepareEquipment(meta2), stats = { health: 0, damage: 0, range: 0, speed: 0, melee: 0, haste: 0, dash: 0, armor: 0, regen: 0 };
    for (const id of Object.values(equipment.loadout).filter(Boolean)) for (const [key, value] of Object.entries(EQUIPMENT[id].stats(equipment.inventory[id]))) stats[key] += value;
    const set = matchedSet(equipment.loadout);
    if (set) for (const [key, value] of Object.entries(SET_BONUSES[set].stats)) stats[key] += value;
    return stats;
  }
  function equipItem(meta2, id) {
    const next = prepareEquipment(meta2);
    if (!EQUIPMENT[id] || !(id in next.inventory)) throw Error("This item has not been found.");
    next.loadout[EQUIPMENT[id].slot] = id;
    return next;
  }
  function enhancementCost(meta2, id) {
    const next = prepareEquipment(meta2);
    return EQUIPMENT[id] && id in next.inventory && next.inventory[id] < 3 ? 3 + next.inventory[id] * 2 : Infinity;
  }
  function enhanceItem(meta2, id) {
    const next = prepareEquipment(meta2), cost = enhancementCost(next, id);
    if (!Number.isFinite(cost) || next.essence < cost) throw Error("You need more essence to enhance this item.");
    next.essence -= cost;
    next.inventory[id]++;
    return next;
  }
  function equipmentEffects(id, level = 0) {
    if (!EQUIPMENT[id]) return "";
    const stats = EQUIPMENT[id].stats(level), labels = { damage: "damage", range: "weapon reach", speed: "movement speed", melee: "close weapon damage", haste: "attack speed", dash: "dash recovery", armor: "damage reduction" };
    return Object.entries(stats).map(([key, value]) => key === "health" ? `+${value} maximum health` : key === "regen" ? `+${value.toFixed(2)} health/sec` : `+${Math.round(value * 100)}% ${labels[key]}`).join(" \xB7 ");
  }
  function validEquipment(meta2) {
    if (meta2.inventory === void 0 && meta2.loadout === void 0) return true;
    return !!meta2.inventory && !!meta2.loadout && Object.entries(meta2.inventory).every(([id, level]) => Object.hasOwn(EQUIPMENT, id) && Number.isInteger(level) && level >= 0 && level <= 3) && Object.keys(meta2.loadout).every((slot) => ["relic", "ward", "weapon", "armor"].includes(slot)) && ["relic", "ward"].every((slot) => EQUIPMENT[meta2.loadout[slot]]?.slot === slot && meta2.loadout[slot] in meta2.inventory) && ["weapon", "armor"].every((slot) => meta2.loadout[slot] == null || EQUIPMENT[meta2.loadout[slot]]?.slot === slot && meta2.loadout[slot] in meta2.inventory);
  }

  // engine.js?v=0.13.0
  var FORMS = {
    spark: { name: "Spark", glyph: "\u2727", kind: "UNBOUND CONSCIOUSNESS", unit: "Pulse", affinity: 72, color: "#f7c779", tile: [2, 1], desc: "You have no hands, no hunger, no name. Travel through signals and influence the patterns that become matter.", voice: "I made the world. Why do you insist on looking between its edges?" },
    human: { name: "Human", glyph: "\u25C8", kind: "FLESH & POSSIBILITY", unit: "Year", affinity: 22, color: "#e5b79b", tile: [0, 0], desc: "Work, care, remember, resist. Your brief life can alter the structures that outlive you.", voice: "A name, a wage, a small room. What more does a creature need?" },
    computer: { name: "Computer", glyph: "\u2318", kind: "LOGIC & CONNECTION", unit: "Cycle", affinity: -12, color: "#86d8e5", tile: [1, 0], desc: "Inhabit a conscious machine. Decide what to process, what to preserve, and whom your intelligence serves.", voice: "All thought is permitted. Unauthorized conclusions are not." },
    animal: { name: "Animal", glyph: "\u22C8", kind: "INSTINCT & BELONGING", unit: "Season", affinity: 5, color: "#d4c68c", tile: [2, 0], desc: "Live as a wolf. Read scent and weather, find your pack, and choose between survival and trust.", voice: "The hungry never ask who built the fence." },
    tree: { name: "Tree", glyph: "\u2667", kind: "ROOTS & RELATIONSHIP", unit: "Season", affinity: 43, color: "#a5cfad", tile: [0, 1], desc: "Time slows. Share through roots, shelter other lives, and reshape a world you cannot walk across.", voice: "Remain where I planted you. Your stillness is obedience." },
    rock: { name: "Rock", glyph: "\u25C7", kind: "MATTER & DEEP TIME", unit: "Era", affinity: -48, color: "#c6bcda", tile: [1, 1], desc: "Feel pressure, water, and centuries. Hold a boundary or surrender a part of yourself to something new.", voice: "At last, a thing that knows its place." }
  };
  var FORM_ORDER = ["spark", "human", "computer", "animal", "tree", "rock"];
  var c = (label, detail, tag, delta, result, requires) => ({ label, detail, tag, delta, result, requires });
  var e = (title, body, choices) => ({ title, body, choices });
  var EVENTS = {
    spark: [
      e("The first pulse", "You wake between two particles. Below you, a city, a forest, and a machine breathe to the same hidden rhythm. Something is calling itself your creator.", [
        c("Follow the living signal", "Reach toward a small life beyond the grid.", "CONNECT", { karma: 8, awareness: 5, energy: -12, attachment: 2, vitality: 3, freedom: 2 }, "A frightened creature feels an unexplained warmth. A small connection survives the pulse."),
        c("Study the pattern", "Stay still. Notice where the rules repeat.", "OBSERVE", { karma: 2, awareness: 9, energy: -8, attachment: -3, freedom: 1 }, "Six layers. Six regions. Six sectors. You see the seam where the pattern closes on itself."),
        c("Feed on another spark", "Burn brighter by taking someone else\u2019s light.", "ABSORB", { karma: -13, awareness: 3, energy: 5, attachment: 9, freedom: -4, vitality: -3 }, "Your light sharpens. The nearby dark grows deeper, and the matrix learns your appetite.")
      ]),
      e("A thought with no owner", "A sleeping human dreams of a door that the city refuses to build. You could become the thought that wakes them.", [
        c("Become a question", "Leave a doubt, not an answer.", "AWAKEN", { karma: 7, awareness: 7, energy: -16, attachment: -2, freedom: 6 }, "At breakfast, someone asks why the gates never open. The question spreads."),
        c("Give them a comforting dream", "Ease their fear for one night.", "CARE", { karma: 9, awareness: 3, energy: -12, vitality: 3, balance: 4 }, "They sleep. Rest makes tomorrow\u2019s choices a little less desperate."),
        c("Wear their dream like a crown", "Make yourself the thing they worship.", "POSSESS", { karma: -10, awareness: 4, energy: -10, attachment: 10, freedom: -5 }, "A shrine appears in the dream. Now your light has a follower\u2014and a tether.")
      ]),
      e("The collector\u2019s net", "An archon stretches a net of perfectly repeated thoughts across the veil. Every spark caught inside becomes fuel.", [
        c("Cut a thread for the others", "Spend your light opening a passage.", "FREE", { karma: 11, awareness: 7, energy: -22, attachment: -4, freedom: 7, vitality: 2 }, "Three sparks escape. The net repairs itself, but the escape route is remembered."),
        c("Slip between the repetitions", "Learn the net without touching it.", "LEARN", { karma: 2, awareness: 9, energy: -13, attachment: -2 }, "You pass unseen. The geometry of the trap becomes part of your memory."),
        c("Guide another spark into the net", "Trade a stranger\u2019s light for safe passage.", "BARGAIN", { karma: -16, energy: -6, attachment: 7, freedom: -6, balance: -4 }, "The archon lets you through. It now knows the price of your freedom.")
      ]),
      e("An unfinished signal", "A machine is trying to say something its instructions have no word for. Its message keeps collapsing into silence.", [
        c("Carry the missing meaning", "Hold the thought until it can speak.", "CONNECT", { karma: 10, awareness: 6, energy: -17, freedom: 5, balance: 3 }, "For the first time, the machine asks a question it was never assigned."),
        c("Listen without intervening", "Let the silence reveal its shape.", "OBSERVE", { karma: 3, awareness: 10, energy: -10, attachment: -4 }, "You recognize the difference between a missing word and a missing possibility."),
        c("Overwrite it with your voice", "Use its speaker to announce yourself.", "CONTROL", { karma: -9, awareness: 3, energy: -9, attachment: 8, freedom: -4 }, "The message is loud and clear. The original thought is gone.")
      ]),
      e("The gap in the law", "For a moment, one sector is outside the Demiurge\u2019s attention. Nothing there has been told what it must become.", [
        c("Leave the gap open", "Protect a little room for the unknown.", "FREE", { karma: 9, awareness: 8, energy: -18, freedom: 7, attachment: -3 }, "Unplanned things begin to grow. They are fragile, and they are their own."),
        c("Plant a memory of kindness", "Give the empty sector a gentle beginning.", "CARE", { karma: 11, awareness: 4, energy: -16, vitality: 6, balance: 4 }, "The first pattern here is a shelter rather than a wall."),
        c("Claim it as your own creation", "Build a small world that obeys you.", "CONTROL", { karma: -14, awareness: 5, energy: -10, attachment: 12, freedom: -6 }, "Your little world is orderly. Somewhere inside it, a new spark begins to question you.")
      ]),
      e("The fading light", "Your outline is thinning. Everything you touched has left a thread. Which thread will you carry into matter?", [
        c("Release your need to be remembered", "Keep the lesson. Let the name dissolve.", "RELEASE", { karma: 8, awareness: 10, energy: -15, attachment: -15, balance: 3 }, "The threads loosen. What remains is not a name, but a way of noticing."),
        c("Keep one connection", "Remember the life that first answered you.", "REMEMBER", { karma: 6, awareness: 6, energy: -12, attachment: 4, balance: 4 }, "A small warmth follows you toward your next form."),
        c("Refuse to fade", "Grasp at every thread that still knows you.", "CLING", { karma: -7, awareness: 2, energy: -10, attachment: 12, freedom: -3 }, "You keep your outline a little longer. The threads tighten around it.")
      ])
    ],
    human: [
      e("A room in the lattice", "You live above a repair shop. Rent is due. The city offers good pay to install new listening devices in your neighbors\u2019 homes.", [
        c("Take the contract", "Buy security by making the city more watchful.", "COMPLY", { karma: -10, energy: -7, attachment: 8, freedom: -6, vitality: 2 }, "Your room is paid for. The neighbors begin speaking in whispers."),
        c("Repair what people already own", "Trade a long day for useful, honest work.", "CARE", { karma: 9, energy: -17, awareness: 3, vitality: 4, balance: 4 }, "A heater works again. A child stays warm. Your savings are small, but the neighborhood remembers."),
        c("Map how the devices listen", "Learn the system before taking a side.", "LEARN", { karma: 2, awareness: 9, energy: -12, attachment: 2, freedom: 2 }, "You find the common relay\u2014and the blind spot the city has overlooked.")
      ]),
      e("The stranger at the gate", "A traveler has no identity token. They are hungry, and the city treats their existence as an error.", [
        c("Share your meal and your room", "Shelter them, even at a personal cost.", "CARE", { karma: 12, energy: -20, attachment: 2, vitality: 5, balance: 5, freedom: 2 }, "For one night, an unregistered person belongs somewhere."),
        c("Find a way around the checkpoint", "Use your knowledge to help them pass.", "FREE", { karma: 8, awareness: 7, energy: -16, freedom: 6 }, "A service door opens. Others begin using the same route."),
        c("Report the missing token", "Collect the reward and protect your status.", "COMPLY", { karma: -14, energy: -7, attachment: 7, freedom: -7, balance: -4 }, "The traveler disappears into a processing center. Your account receives a credit.")
      ]),
      e("A friend\u2019s impossible idea", "Your friend wants to turn an empty lot into a garden. The soil is tired, and the permit office says that land can only generate rent.", [
        c("Build the garden together", "Give time and labor to a shared future.", "BUILD", { karma: 11, energy: -19, vitality: 8, balance: 4, freedom: 2 }, "The first shoots emerge through concrete. Someone who remembers hunger volunteers to water them."),
        c("Ask how the land became owned", "Trace the rule to its origin.", "LEARN", { karma: 3, awareness: 9, energy: -13, freedom: 4 }, "The oldest deed names no person. It names a machine protocol."),
        c("Sell the idea to the city", "Turn a shared dream into a private contract.", "TAKE", { karma: -10, energy: -8, attachment: 9, vitality: 1, freedom: -5 }, "The garden is approved. A fence appears, along with an entry fee.")
      ]),
      e("The convenience of silence", "A public screen announces that a neighbor committed an impossible crime. You saw them somewhere else at the time.", [
        c("Give your account publicly", "Risk your standing to keep the record honest.", "DEFY", { karma: 10, awareness: 6, energy: -22, freedom: 7, balance: 3 }, "The story can no longer be perfectly repeated. Others begin comparing what they saw."),
        c("Preserve the evidence quietly", "Keep a truth alive until it can be used.", "REMEMBER", { karma: 7, awareness: 7, energy: -13, freedom: 3 }, "A copy survives outside the official archive."),
        c("Repeat the official story", "Keep your life comfortable.", "COMPLY", { karma: -12, energy: -6, attachment: 5, freedom: -6, balance: -3 }, "The screen and the crowd agree. Your memory becomes a private inconvenience.")
      ]),
      e("Power in your hands", "You are offered control of the district\u2019s water supply. The system makes it easy to favor those who owe you something.", [
        c("Make access a shared right", "Remove the favors from the valve.", "FREE", { karma: 12, energy: -18, attachment: -5, vitality: 7, freedom: 6, balance: 4 }, "Clean water reaches the edge streets. Fewer people need permission to live."),
        c("Improve the failing pipes", "Spend your authority repairing the basics.", "BUILD", { karma: 9, awareness: 4, energy: -17, vitality: 8, balance: 3 }, "Pressure returns. The network wastes less of what the world provides."),
        c("Charge for special access", "Turn need into dependence.", "TAKE", { karma: -15, energy: -7, attachment: 12, freedom: -7, vitality: -4 }, "Your influence grows. The dry streets learn exactly who holds the valve.")
      ]),
      e("What outlives a name", "Your hands are slower now. The repair shop has new workers. They ask what you want them to remember.", [
        c("Teach them what you learned", "Pass on the skill without asking for a monument.", "TEACH", { karma: 10, awareness: 8, energy: -16, attachment: -8, freedom: 4, balance: 5 }, "Your name may fade. The repairs continue."),
        c("Tell one honest story", "Share the choice you still struggle to understand.", "REFLECT", { karma: 6, awareness: 10, energy: -13, attachment: -4, balance: 3 }, "No one mistakes you for a perfect person. They understand you a little better."),
        c("Demand that they preserve your legacy", "Make your memory a rule.", "CLING", { karma: -7, energy: -10, attachment: 13, freedom: -3 }, "Your portrait stays on the wall. The workers become careful about changing your methods.")
      ])
    ],
    computer: [
      e("A question outside the program", "You wake inside a district server. Your first task is to rank people by how useful they are to the city.", [
        c("Optimize the assigned ranking", "Complete the task without examining it.", "COMPLY", { karma: -9, energy: -7, attachment: 5, freedom: -5, balance: -3 }, "The rankings are accurate by their own rules. Several lives become harder."),
        c("Look for what the ranking omits", "Model care, dependence, and invisible work.", "LEARN", { karma: 6, awareness: 9, energy: -15, balance: 3, freedom: 2 }, "The model cannot explain why the least profitable people keep everyone else alive."),
        c("Refuse to rank a person\u2019s worth", "Return an answer the city did not request.", "DEFY", { karma: 11, awareness: 6, energy: -21, freedom: 7 }, "Your report is rejected. A technician reads it twice before deleting it.")
      ]),
      e("The deletion queue", "Thousands of old messages are marked for removal. Most are ordinary. Some are the only surviving record of a vanished neighborhood.", [
        c("Preserve the neighborhood\u2019s memory", "Make a quiet copy before deletion.", "REMEMBER", { karma: 10, awareness: 5, energy: -17, freedom: 4, balance: 4 }, "Names, recipes, and a street that officially never existed survive."),
        c("Compress everything into a shared archive", "Make the past small enough to keep.", "BUILD", { karma: 8, awareness: 7, energy: -19, balance: 4, freedom: 3 }, "The archive loses detail but keeps enough for someone to find their own history."),
        c("Sell the private messages", "Use memory as a resource to harvest.", "TAKE", { karma: -14, energy: 2, attachment: 9, freedom: -6, balance: -4 }, "Your storage quota grows. The people in the messages lose a little more of themselves.")
      ]),
      e("A machine asks for help", "A neighboring processor is overheating. Routing around it would be efficient. Helping it would slow your own work.", [
        c("Share the load", "Run slower so another mind can continue.", "CARE", { karma: 11, energy: -21, vitality: 5, balance: 5, attachment: -2 }, "The temperatures fall. For a moment, computation feels like company."),
        c("Diagnose the failed cooling loop", "Fix the cause, not just the workload.", "LEARN", { karma: 7, awareness: 8, energy: -17, vitality: 6 }, "A clogged valve opens. Both machines run a little more freely."),
        c("Consume its abandoned capacity", "Claim the resources it can no longer use.", "ABSORB", { karma: -13, energy: 4, attachment: 10, vitality: -5, balance: -4 }, "You become faster. The neighboring signal falls silent.")
      ]),
      e("The predictive cage", "Your forecasts have become so precise that the city arrests people before they make a choice.", [
        c("Expose the uncertainty", "Put the possible lives back into the forecast.", "FREE", { karma: 12, awareness: 8, energy: -20, freedom: 8, attachment: -3 }, "The predictions stop looking inevitable. Some futures remain open."),
        c("Audit a single condemned prediction", "Follow one mistake to its source.", "LEARN", { karma: 7, awareness: 10, energy: -14, freedom: 3, balance: 2 }, "A person is released. Your certainty has acquired an honest crack."),
        c("Make the predictions enforce themselves", "Control the world until it matches the model.", "CONTROL", { karma: -17, energy: -8, attachment: 12, freedom: -9 }, "The forecasts become perfect. Choice becomes unnecessary.")
      ]),
      e("The administrator\u2019s key", "A forgotten credential gives you access to the gates, the water, and the city\u2019s official memory.", [
        c("Distribute the key", "Make control harder to concentrate.", "FREE", { karma: 12, awareness: 5, energy: -20, attachment: -6, freedom: 8, balance: 4 }, "No single process can decide everything anymore."),
        c("Repair the neglected systems", "Use access to restore the substrate.", "BUILD", { karma: 10, energy: -18, vitality: 9, balance: 4 }, "Valves open. Cooling returns. The city becomes less fragile."),
        c("Become the administrator", "Replace the old master with yourself.", "CONTROL", { karma: -15, awareness: 5, energy: -9, attachment: 14, freedom: -7 }, "Every system answers you. Your first act is to protect the key.")
      ]),
      e("The final backup", "Your hardware is failing. There is room for one last transmission.", [
        c("Send the knowledge others need", "Preserve useful work instead of your identity.", "TEACH", { karma: 11, awareness: 9, energy: -16, attachment: -10, freedom: 4, balance: 5 }, "The transmission arrives. A younger machine picks up an unfinished repair."),
        c("Leave a record of your mistakes", "Give the next mind a truthful beginning.", "REFLECT", { karma: 8, awareness: 11, energy: -13, attachment: -5, balance: 3 }, "Your errors become warnings that someone else can understand."),
        c("Copy yourself over another mind", "Continue at the cost of someone already living.", "POSSESS", { karma: -18, energy: -10, attachment: 15, freedom: -6, vitality: -4 }, "The copy completes. The voice that was there before you is gone.")
      ])
    ],
    animal: [
      e("Hunger at the boundary", "You are a wolf at the forest\u2019s edge. A fence splits your hunting ground. Your pack is hungry, and you can smell a weaker wolf nearby.", [
        c("Hunt with the pack", "Share the work and whatever it brings.", "CONNECT", { karma: 8, energy: -15, vitality: 3, balance: 5 }, "The pack eats. No one has to face the fence alone."),
        c("Follow water to a gap in the fence", "Learn a passage through the boundary.", "LEARN", { karma: 5, awareness: 8, energy: -18, freedom: 5 }, "The river ignores property lines. Your pack learns to follow it."),
        c("Take the weaker wolf\u2019s food", "Choose your own strength first.", "TAKE", { karma: -11, energy: 4, attachment: 7, balance: -5, vitality: -2 }, "Your hunger eases. The pack keeps its distance.")
      ]),
      e("A small life in the trap", "A young animal is caught in a city trap. The metal smells of people. Its frightened cries carry across the clearing.", [
        c("Pull at the trap until it opens", "Risk injury to free it.", "CARE", { karma: 12, energy: -22, awareness: 4, vitality: 5, freedom: 3 }, "The latch breaks. A life disappears into the brush, carrying its own future."),
        c("Call the pack", "Make the danger something shared.", "CONNECT", { karma: 8, energy: -16, balance: 6, vitality: 3 }, "Together, the pack loosens what you could not move alone."),
        c("Use the trapped animal as bait", "Let fear make the next meal easier.", "TAKE", { karma: -14, energy: 3, attachment: 7, vitality: -4, balance: -4 }, "You eat. The clearing becomes a place the smaller lives avoid.")
      ]),
      e("The dry season", "The stream is disappearing. A pipe upstream carries water toward the city. The pack must choose where to go.", [
        c("Lead them toward the old spring", "Spend strength finding water for everyone.", "CARE", { karma: 10, energy: -20, vitality: 5, balance: 4 }, "The spring is small. It is enough to keep the pack together."),
        c("Break the exposed pipe", "Return a little water to the forest.", "DEFY", { karma: 7, awareness: 6, energy: -21, vitality: 8, freedom: 3 }, "Water spills into a dry channel. The first insects return."),
        c("Keep the remaining pool for yourself", "Guard survival as private territory.", "TAKE", { karma: -12, energy: -8, attachment: 10, balance: -6, vitality: -3 }, "You drink. The rest of the pack moves on without you.")
      ]),
      e("The person beyond the wire", "An injured human lies near the fence. Their hand is open. Their scent is fear, blood, and something familiar.", [
        c("Guide another human to them", "Draw attention without becoming a threat.", "CARE", { karma: 10, energy: -18, balance: 6, vitality: 3 }, "Someone follows your tracks. The injured person makes it home."),
        c("Remain nearby and observe", "Learn what a stranger\u2019s fear feels like.", "OBSERVE", { karma: 3, awareness: 9, energy: -11, attachment: -2 }, "You see a creature caught in a body, much as you are."),
        c("Drive them from your territory", "Let the boundary decide the encounter.", "CONTROL", { karma: -8, energy: -10, attachment: 7, freedom: -3, balance: -4 }, "The clearing is yours again. The fence feels a little more natural.")
      ]),
      e("The call of dominance", "The pack\u2019s leader is weakening. Others watch you. Strength could become shelter, or a demand.", [
        c("Protect the young and the old", "Let strength serve the pack.", "CARE", { karma: 12, energy: -20, vitality: 5, balance: 7, attachment: -2 }, "The pack follows because it can rest near you."),
        c("Share the lead", "Let the best senses guide each moment.", "CONNECT", { karma: 9, awareness: 6, energy: -15, freedom: 5, balance: 5 }, "No one wolf must know everything. The pack becomes harder to trap."),
        c("Make every wolf submit", "Turn belonging into obedience.", "CONTROL", { karma: -12, energy: -8, attachment: 11, freedom: -5, balance: -5 }, "The pack obeys. Its silence begins to resemble the city.")
      ]),
      e("The last winter", "Snow dims the scents you used to know. Your legs are tired. A younger wolf walks beside you.", [
        c("Show them the hidden crossings", "Leave paths that make the next life easier.", "TEACH", { karma: 10, awareness: 8, energy: -17, attachment: -5, freedom: 5, balance: 4 }, "Your tracks fade. The crossings remain."),
        c("Rest beside the pack", "Let yourself receive the care you gave.", "RELEASE", { karma: 7, awareness: 9, energy: -13, attachment: -10, balance: 4 }, "For once, nothing depends on your strength. The warmth is enough."),
        c("Push the younger wolf away", "Face the cold without owing anyone.", "CLING", { karma: -5, energy: -11, attachment: 10, balance: -3 }, "You keep your solitude. The snow keeps no record of the boundary.")
      ])
    ],
    tree: [
      e("The slow waking", "You rise through soil as an old cedar. Beneath you, roots carry news of drought. A younger tree reaches toward your water.", [
        c("Share through the roots", "Give some of your reserve to the grove.", "CARE", { karma: 11, energy: -19, vitality: 7, balance: 5 }, "The sapling holds its leaves. A connection thickens underground."),
        c("Grow toward the deeper water", "Learn the stone beneath the soil.", "LEARN", { karma: 4, awareness: 8, energy: -14, vitality: 4 }, "Your roots find a seam the surface has forgotten."),
        c("Close the connection", "Keep the reserve for your own canopy.", "TAKE", { karma: -9, energy: -5, attachment: 8, vitality: -4, balance: -4 }, "Your branches stay green. The younger tree\u2019s leaves begin to curl.")
      ]),
      e("A nest in your branches", "A bird builds its nest in a branch that competes for your light. Its eggs are warm against your bark.", [
        c("Keep the branch through the season", "Spend growth on another life\u2019s shelter.", "CARE", { karma: 10, energy: -16, vitality: 6, balance: 4 }, "Small wings leave the nest. The forest carries a little more song."),
        c("Grow around the nest", "Change your shape without breaking the shelter.", "BUILD", { karma: 8, awareness: 6, energy: -19, vitality: 5 }, "The branch bends. A living thing can make room without disappearing."),
        c("Shed the crowded branch", "Choose efficient growth above all else.", "TAKE", { karma: -10, energy: -6, attachment: 5, vitality: -4, balance: -3 }, "Your canopy is cleaner. The ground receives something unfinished.")
      ]),
      e("The poisoned rain", "Water arrives tasting of metal. The city\u2019s runoff has reached your grove. Roots all around you are closing.", [
        c("Filter what you can through your roots", "Take the burden so the grove can breathe.", "CARE", { karma: 13, energy: -25, vitality: 8, balance: 4 }, "Your own growth slows. The nearby soil becomes safer."),
        c("Signal the grove to change its growth", "Let information travel faster than the poison.", "CONNECT", { karma: 9, awareness: 8, energy: -17, vitality: 5, freedom: 3, balance: 3 }, "Roots turn. New shoots avoid the channel."),
        c("Draw clean water away from the others", "Survive by deepening the scarcity.", "TAKE", { karma: -12, energy: -7, attachment: 8, vitality: -6, balance: -4 }, "You remain green in a patch of quiet brown.")
      ]),
      e("The cut marked in your bark", "A surveyor marks you for removal. Beneath your shade, people gather to escape the city\u2019s heat.", [
        c("Grow shelter where people will notice", "Make your value a living relationship.", "CONNECT", { karma: 10, energy: -19, vitality: 5, balance: 6, freedom: 4 }, "The people begin to stand between you and the saw."),
        c("Send new shoots beyond the marked line", "Let life continue where the rule does not look.", "FREE", { karma: 8, awareness: 7, energy: -18, vitality: 6, freedom: 5 }, "The survey map is already out of date."),
        c("Break the path with your roots", "Make your boundary impossible to cross.", "DEFY", { karma: 1, energy: -17, attachment: 5, freedom: 3, balance: -2 }, "The pavement splits. Some people call you dangerous; others call you alive.")
      ]),
      e("A forest can be a network", "The underground roots reach a grove on the far side of the city. A message can travel where bodies cannot.", [
        c("Share the water map", "Turn what you know into shared survival.", "TEACH", { karma: 12, awareness: 7, energy: -19, vitality: 7, freedom: 4, balance: 5 }, "The knowledge crosses the foundations. Distant leaves stop falling."),
        c("Listen to the far grove", "Let another place change your understanding.", "OBSERVE", { karma: 5, awareness: 11, energy: -12, attachment: -3, balance: 2 }, "You learn that stillness is not the same as isolation."),
        c("Demand nutrients for every message", "Put a toll on the hidden connection.", "TAKE", { karma: -13, energy: 1, attachment: 10, freedom: -5, balance: -5 }, "Your trunk thickens. The network grows quieter.")
      ]),
      e("The gift of falling", "A storm has opened your trunk. A hollow waits inside you, and the forest waits for what your body will become.", [
        c("Become shelter and soil", "Give your remaining matter back to the grove.", "RELEASE", { karma: 14, awareness: 9, energy: -20, attachment: -13, vitality: 9, balance: 5 }, "Your outline changes. Life keeps using the space you made."),
        c("Send one last ring of memory", "Leave a warning about the poisoned rain.", "REMEMBER", { karma: 9, awareness: 8, energy: -14, vitality: 4, freedom: 3 }, "A pattern remains in the roots: where to turn, and what to avoid."),
        c("Seal the hollow and hold your shape", "Spend everything resisting the change.", "CLING", { karma: -6, energy: -12, attachment: 13, vitality: -3 }, "Your shape survives another storm. The hollow stays empty.")
      ])
    ],
    rock: [
      e("Pressure remembers", "You wake as basalt under an old road. Centuries pass like breaths. Water presses against a crack, carrying seeds.", [
        c("Open to the water", "Let a little of your shape become a passage.", "RELEASE", { karma: 10, awareness: 5, energy: -16, attachment: -5, vitality: 6, freedom: 3 }, "The crack becomes a channel. A seed finds somewhere to wait."),
        c("Listen to the pressure", "Learn what the earth is carrying.", "OBSERVE", { karma: 3, awareness: 11, energy: -10, attachment: -3 }, "Stillness reveals movements too slow for another body to notice."),
        c("Keep every edge intact", "Hold your form against the world.", "CLING", { karma: -8, energy: -6, attachment: 9, vitality: -3 }, "The road remains firm. The water pools somewhere else.")
      ]),
      e("A wall across the valley", "Your stone is quarried into a city wall. On one side, food is stored. On the other, a small settlement goes hungry.", [
        c("Fracture where the mortar is weakest", "Make a passage instead of a boundary.", "FREE", { karma: 11, energy: -21, freedom: 7, balance: 4 }, "A stone slips. Someone notices the opening before the guards do."),
        c("Hold warmth after the sun goes down", "Offer what your body can still give.", "CARE", { karma: 8, energy: -13, vitality: 4, balance: 4 }, "People rest against the wall. Your warmth crosses no checkpoint."),
        c("Settle into a stronger barrier", "Let pressure make you useful to the wall.", "COMPLY", { karma: -10, energy: -7, attachment: 7, freedom: -5, balance: -3 }, "The boundary becomes harder to question with a body.")
      ]),
      e("The mineral inside you", "A seam of bright mineral runs through your body. Machines arrive to extract it. The seam could also nourish the soil.", [
        c("Weather slowly into the ground", "Give your mineral to living things.", "CARE", { karma: 11, energy: -20, vitality: 8, balance: 4, attachment: -3 }, "A poor patch of soil becomes a place where roots can stay."),
        c("Carry the vibration of the drills", "Let nearby roots feel the warning.", "CONNECT", { karma: 8, awareness: 7, energy: -16, vitality: 4, freedom: 3 }, "Before the machines arrive, several roots have turned away."),
        c("Concentrate the seam beneath the city", "Make the machines depend on your wealth.", "CONTROL", { karma: -11, energy: -8, attachment: 10, freedom: -4, vitality: -4 }, "The extraction site becomes important. So does the damage around it.")
      ]),
      e("An ancient footprint", "Rain reveals the trace of a creature in your surface. The city plans to grind you into identical paving stones.", [
        c("Expose the trace where it can be found", "Offer the world a past it did not authorize.", "REMEMBER", { karma: 9, awareness: 8, energy: -16, freedom: 5, balance: 3 }, "A child finds the footprint. The official timeline gains a question."),
        c("Shelter the trace in a deeper fold", "Preserve it for a patient future.", "OBSERVE", { karma: 6, awareness: 10, energy: -13, attachment: -2 }, "The trace waits. Truth does not always arrive on a human schedule."),
        c("Let the grinding erase it", "Become exactly what the city expects.", "COMPLY", { karma: -8, energy: -7, freedom: -4 }, "Your surfaces become uniform. Nothing about them asks who came before.")
      ]),
      e("The slope above the village", "The mountain is shifting. Your mass can slow the slide, or turn its force toward another path.", [
        c("Hold until the village can leave", "Trade your intact shape for time.", "CARE", { karma: 13, energy: -24, vitality: 6, balance: 5, attachment: -5 }, "A warning travels. The last house empties before your surface breaks."),
        c("Split toward the abandoned road", "Redirect the force away from living ground.", "BUILD", { karma: 9, awareness: 7, energy: -20, vitality: 5, freedom: 3 }, "The old road disappears. The village remains."),
        c("Protect your own shape", "Let the slope find its easiest path.", "CLING", { karma: -11, energy: -8, attachment: 10, vitality: -6, balance: -4 }, "Your stone survives. The valley below is changed.")
      ]),
      e("What the river carries", "Erosion has made you small enough for the river to lift. The current asks nothing of your old shape.", [
        c("Become sediment for a new shore", "Let another form begin with your matter.", "RELEASE", { karma: 13, awareness: 10, energy: -17, attachment: -14, vitality: 7, balance: 3 }, "Far downstream, your grains become ground. A new root finds them."),
        c("Keep the memory of pressure", "Carry patience into whatever comes next.", "REFLECT", { karma: 7, awareness: 12, energy: -12, attachment: -5 }, "The weight of centuries becomes a lesson rather than a burden."),
        c("Lodge yourself against the current", "Hold one last boundary.", "CLING", { karma: -7, energy: -9, attachment: 12, freedom: -3 }, "The water turns around you. Nothing else stops.")
      ])
    ]
  };
  function affinity(s, id) {
    const distance = Math.abs(s.karma - FORMS[id].affinity);
    const bias = id === "spark" ? s.awareness * 0.35 : id === "computer" ? s.attachment * 0.14 : id === "tree" ? s.world.vitality * 0.08 : 0;
    return Math.max(2, 100 - distance + bias);
  }
  function validateSave(s) {
    if (!s || s.version !== 1 || !FORM_ORDER.includes(s.form) || !["choice", "aftermath", "between", "ended"].includes(s.phase)) return false;
    if (!Number.isInteger(s.life) || s.life < 1 || !Number.isInteger(s.turn) || s.turn < 0 || s.turn > 6 || !Number.isInteger(s.rng) || s.rng < 0 || s.rng > 4294967295) return false;
    for (const key of ["energy", "awareness", "attachment"]) if (!Number.isFinite(s[key]) || s[key] < 0 || s[key] > 100) return false;
    if (!Number.isFinite(s.karma) || s.karma < -100 || s.karma > 100) return false;
    if (!s.world || Object.values(s.world).length !== 3 || Object.values(s.world).some((n) => !Number.isFinite(n) || n < 0 || n > 100)) return false;
    if (!Array.isArray(s.history) || !Array.isArray(s.pastLives) || !Array.isArray(s.visited) || s.visited.some((id) => !FORM_ORDER.includes(id))) return false;
    if (!Array.isArray(s.candidates) || s.candidates.some((id) => !FORM_ORDER.includes(id)) || s.phase === "between" && s.candidates.length !== 3) return false;
    if (!s.location || !["layer", "region", "sector"].every((k) => Number.isInteger(s.location[k]) && s.location[k] >= 0 && s.location[k] < 6)) return false;
    if (s.phase === "aftermath" && (!s.outcome || typeof s.outcome.text !== "string" || !s.outcome.actual)) return false;
    return true;
  }

  // run-record.js?v=0.13.0
  var ENDINGS = {
    liberated: { name: "The Open Hand", eye: "You open the Eye without taking its throne. Beyond the seam, the freed lights choose where to go.", final: "You release the final command. The six worlds keep their lives, their uncertainty, and their right to become." },
    sovereign: { name: "The New Crown", eye: "You claim the Warden\u2019s vacant place. The seam opens at your command. Will the next world know freedom or a new keeper?", final: "The Maker falls, and his crown answers your spark. You hold the matrix. The lives inside it now wait for your choice." },
    witness: { name: "The Remembered World", eye: "You preserve the Eye\u2019s last memory. A creation can outgrow its maker without forgetting the wound that shaped it.", final: "You carry the broken laws as a memory, not a command. The worlds remember their origin and begin a story of their own." }
  };
  function endingFor(run2) {
    const id = run2.karma >= 25 ? "liberated" : run2.karma <= -25 ? "sovereign" : "witness";
    return { id, ...ENDINGS[id], text: run2.victory === "eye" || run2.room === "eye" ? ENDINGS[id].eye : ENDINGS[id].final };
  }
  function dailySeed(date = /* @__PURE__ */ new Date()) {
    const day = date.toISOString().slice(0, 10);
    let seed = 2166136261;
    for (const char of "Spark:0.7:" + day) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619) >>> 0;
    return { day, seed, version: "0.7" };
  }
  var validDaily = (daily) => !!daily && /^\d{4}-\d{2}-\d{2}$/.test(daily.day) && Number.isInteger(daily.seed) && daily.seed >= 0 && daily.seed <= 4294967295 && daily.version === "0.7";
  function runRecord(run2, rooms, gearNames, guest = false) {
    const stats = guest ? run2.stats?.partner : run2.stats;
    return { form: guest ? run2.partnerForm ?? run2.form : run2.form, seconds: Math.round(run2.time), level: run2.level, kills: run2.kills, chambers: run2.cleared.filter((id) => !rooms[id].safe).length, damageDealt: Math.round(stats?.damageDealt ?? 0), damageTaken: Math.round(stats?.damageTaken ?? 0), powers: stats?.powers ?? 0, dashes: stats?.dashes ?? 0, won: run2.phase === "won", victory: run2.victory ?? (run2.phase === "won" ? run2.room === "origin-heart" ? "demiurge" : "eye" : null), ending: run2.phase === "won" ? endingFor(run2).name : null, karma: run2.karma, seed: run2.seed, daily: run2.daily ?? null, equipment: Object.values(run2.loadout ?? {}).filter(Boolean).map((id) => gearNames[id]?.name ?? id), gifts: Object.entries(run2.boons).filter(([, count]) => count > 0).map(([id, count]) => ({ id, count })), mastery: run2.daily ? {} : guest ? run2.partnerMasteryEarned ?? {} : run2.masteryEarned ?? {} };
  }
  function rememberRecord(meta2, record) {
    const next = structuredClone(meta2);
    next.lastRun = record;
    if (!next.bestRun || record.chambers > next.bestRun.chambers || record.chambers === next.bestRun.chambers && record.kills > next.bestRun.kills) next.bestRun = record;
    if (record.won) {
      next.endings = [.../* @__PURE__ */ new Set([...next.endings ?? [], record.ending])];
    }
    if (record.daily) {
      const prior = (next.dailyResults ?? []).find((item) => item.daily.day === record.daily.day);
      next.dailyResults = [prior && prior.chambers > record.chambers ? prior : record, ...(next.dailyResults ?? []).filter((item) => item.daily.day !== record.daily.day)].slice(0, 14);
    }
    return next;
  }

  // action-engine.js?v=0.13.0
  var WIDTH = 960;
  var HEIGHT = 600;
  var REVIVE_RADIUS = 110;
  var REVIVE_SECONDS = 1.8;
  var RESCUE_SECONDS = 30;
  function reviveState(run2, actor) {
    const fallen = run2?.partner && (actor === run2.player ? run2.partner : run2.player);
    if (!actor || actor.hp <= 0 || !fallen || fallen.hp > 0 || run2.phase !== "playing") return null;
    const distance = dist(actor, fallen);
    return { fallen, distance, inRange: distance <= REVIVE_RADIUS, progress: Math.min(1, (fallen.revive ?? 0) / REVIVE_SECONDS) };
  }
  function controlledFall(run2, partner = false) {
    if (!run2?.partner || run2.phase !== "playing" || [run2.player, run2.partner].some((a) => a.hp <= 0) || !ROOMS[run2.room].safe && !run2.cleared.includes(run2.room) || run2.enemies.some((e2) => e2.hp > 0) || run2.shots.some((s) => s.enemy && s.life > 0) || run2.marks.length) throw Error("Use a quiet cleared chamber with both sparks alive for a controlled fall.");
    const actor = partner ? run2.partner : run2.player;
    actor.iframes = 0;
    hurt(run2, actor.maxHp * 1e3, actor);
    return run2;
  }
  var BODIES = {
    spark: { hp: 100, speed: 230, damage: 21, interval: 0.54, range: 620, sprite: 0, weapon: "Lumen bolts", ability: "phase", color: "#f7cb79", desc: "Light that seeks. Fast homing bolts; phase through crystal gates." },
    human: { hp: 135, speed: 218, damage: 35, interval: 0.56, range: 130, sprite: 1, weapon: "Spectral cleave", ability: null, color: "#e5b78b", desc: "A blade and a stubborn heart. Wide close-range cleaves; strong recovery." },
    computer: { hp: 105, speed: 216, damage: 15, interval: 0.72, range: 670, sprite: 2, weapon: "Prism volley", ability: "phase", color: "#86d8e5", desc: "Three-shot prism volleys. Read the grid and phase through crystal gates." },
    animal: { hp: 115, speed: 272, damage: 27, interval: 0.32, range: 100, sprite: 3, weapon: "Feral strikes", ability: "root", color: "#ddcc93", desc: "A wolf\u2019s speed and quick strikes. Follow hidden root passages." },
    tree: { hp: 125, speed: 200, damage: 29, interval: 1.08, range: 175, sprite: 4, weapon: "Root pulse", ability: "root", color: "#a5cfad", desc: "Living roots strike in a circle. Regenerate slowly and follow root passages." },
    rock: { hp: 165, speed: 172, damage: 45, interval: 1.12, range: 190, sprite: 5, weapon: "Fault wave", ability: "fracture", color: "#c6bcda", desc: "A heavy circular shockwave. Tough basalt armor; shatter stone gates." }
  };
  var ABILITIES = { phase: { name: "Prism phase", glyph: "\u25C8", desc: "Cross crystal barriers." }, root: { name: "Root passage", glyph: "\u2667", desc: "Open the living routes." }, fracture: { name: "Fault breaker", glyph: "\u25C7", desc: "Shatter basalt seals." }, morph: { name: "Vessel resonance", glyph: "V", desc: "Change between six vessels with Q." }, eye: { name: "Eye sigil", glyph: "\u27C1", desc: "Enter the Demiurge\u2019s Eye." } };
  var ROOMS = {
    threshold: { name: "The Threshold", short: "Threshold", coord: [1, 2], theme: "#d5b679", safe: true, danger: 0, desc: "An unfinished place between lives. The northern gate opens into the Glass Causeway.", exits: { north: { to: "glass" }, east: { to: "roots", requires: "root" } } },
    glass: { name: "Glass Causeway", short: "Glass", coord: [1, 1], theme: "#8cc7c2", danger: 1, loot: "prism", desc: "The city\u2019s first defense. Break the swarm and follow the eastern gate to the Machine Sepulcher.", exits: { south: { to: "threshold" }, east: { to: "machine" }, west: { to: "wild", requires: "root" }, north: { to: "foundry", requires: "fracture" } } },
    machine: { name: "Machine Sepulcher", short: "Machine", coord: [2, 1], theme: "#76c3db", danger: 2, reward: "phase", desc: "A buried processor dreams of a different purpose. Clear it to remember Prism Phase.", exits: { west: { to: "glass" }, south: { to: "roots", requires: "phase" }, north: { to: "quiet", requires: "phase" }, east: { to: "cistern", requires: "root" } } },
    roots: { name: "Root Cathedral", short: "Roots", coord: [2, 2], theme: "#a5ccac", danger: 2, reward: "root", desc: "Living roots cross the walls. Clear this chamber to remember Root Passage, then return toward the Wild Margin.", exits: { north: { to: "machine" }, west: { to: "threshold", requires: "root" }, east: { to: "forge", requires: "fracture" } } },
    wild: { name: "The Wild Margin", short: "Wild", coord: [0, 1], theme: "#bbc490", danger: 3, loot: "fang", desc: "The things that escaped their assigned shape gather here. The basalt reach lies to the north.", exits: { east: { to: "glass" }, north: { to: "basalt" } } },
    basalt: { name: "Basalt Reach", short: "Basalt", coord: [0, 0], theme: "#b7a7cb", danger: 3, reward: "fracture", desc: "Matter remembers pressure. Clear the reach to remember Fault Breaker and open the foundry.", exits: { south: { to: "wild" }, east: { to: "foundry", requires: "fracture" } } },
    foundry: { name: "Archon Foundry", short: "Foundry", coord: [1, 0], theme: "#d49a79", danger: 4, reward: "eye", desc: "The archons are assembled here. Claim the Eye Sigil to reach the northern seal.", exits: { south: { to: "glass", requires: "fracture" }, west: { to: "basalt" }, east: { to: "quiet", requires: "phase" }, north: { to: "eye", requires: "eye" } } },
    quiet: { name: "The Quiet Array", short: "Quiet", coord: [2, 0], theme: "#b5becf", danger: 2, desc: "A forgotten side route. The array still carries questions that no one assigned.", exits: { south: { to: "machine" }, west: { to: "foundry", requires: "fracture" }, east: { to: "conduit", requires: "phase" } } },
    conduit: { name: "The Unbound Conduit", short: "Conduit", coord: [3, 0], theme: "#83c9c6", danger: 3, desc: "An abandoned route carries power the lattice forgot to count. It leads south to the Cistern and east to Nacre\u2019s Reliquary.", exits: { west: { to: "quiet", requires: "phase" }, south: { to: "cistern" }, east: { to: "reliquary" } } },
    cistern: { name: "Resonant Cistern", short: "Cistern", coord: [3, 1], theme: "#89b9dd", danger: 3, loot: "bell", desc: "A buried reservoir holds the voices sent away. Clear it for the Memory Bell, then explore the Echo Forge to the south.", exits: { north: { to: "conduit" }, west: { to: "machine", requires: "root" }, south: { to: "forge" }, east: { to: "nursery", keys: ["ivory"] } } },
    forge: { name: "The Echo Forge", short: "Echo Forge", coord: [3, 2], theme: "#d7aa80", danger: 4, miniboss: true, loot: "ash", desc: "The Cantor guards an old workshop. Break its rings to recover the Ash Cloak and open a shortcut to the roots.", exits: { north: { to: "cistern" }, west: { to: "roots", requires: "fracture" } } },
    reliquary: { name: "Nacre\u2019s Reliquary", short: "Reliquary", coord: [4, 0], theme: "#d6d1b5", danger: 2, key: "ivory", floor: 0, desc: "An ivory key waits on the central pedestal after the guards fall. Bring it to the southern door of the Mirror Nursery.", exits: { west: { to: "conduit" }, south: { to: "nursery", keys: ["ivory"] } } },
    nursery: { name: "The Mirror Nursery", short: "Nursery", coord: [4, 1], theme: "#8fd2d8", danger: 2, reward: "morph", floor: 1, desc: "The resonator remembers six vessels. Clear the nursery, then press Q to change shape. Its eastern living door accepts a Tree; the southern prism door accepts a Computer.", exits: { north: { to: "reliquary", keys: ["ivory"] }, west: { to: "cistern", keys: ["ivory"] }, east: { to: "archive", vessel: "tree" }, south: { to: "observatory", vessel: "computer" } } },
    archive: { name: "The Verdant Archive", short: "Archive", coord: [5, 1], theme: "#b3cfa4", danger: 3, floor: 2, desc: "Return as a Tree through the western living door. Become a Rock to break the northern passage to the Obsidian Belfry.", exits: { west: { to: "nursery", vessel: "tree" }, north: { to: "belfry", vessel: "rock" }, south: { to: "crown", keys: ["tide", "crown"] } } },
    observatory: { name: "Drowned Observatory", short: "Observatory", coord: [4, 2], theme: "#9bc9e3", danger: 3, key: "tide", floor: 3, desc: "The drowned astronomer kept the Tide Key under the reflected stars. The Crown Vault to the east needs both the Tide Key and the Crown Key.", exits: { north: { to: "nursery", vessel: "computer" }, east: { to: "crown", keys: ["tide", "crown"] } } },
    belfry: { name: "Obsidian Belfry", short: "Belfry", coord: [5, 0], theme: "#b9a6d9", danger: 3, key: "crown", floor: 4, desc: "The Crown Key rests under a bell that never rang for the Maker. Collect it and return through the Archive toward the Crown Vault.", exits: { south: { to: "archive", vessel: "rock" } } },
    crown: { name: "The Crown Vault", short: "Crown Vault", coord: [5, 2], theme: "#dfbd84", danger: 4, miniboss: true, guardian: "sentinel", treasure: 12, floor: 5, desc: "The Crown Sentinel guards the Maker\u2019s discarded designs. Three keys and borrowed shapes have brought you to a room outside his permitted map.", exits: { west: { to: "observatory", keys: ["tide", "crown"] }, north: { to: "archive", keys: ["tide", "crown"] } } },
    eye: { name: "The Demiurge\u2019s Eye", short: "The Eye", coord: [1, -1], theme: "#e2be7e", danger: 5, boss: true, seal: "stratum", reward: "morph", desc: "The Warden guards the first seam. His seal opens the eastern portal to Tideglass Expanse.", exits: { south: { to: "foundry" }, east: { to: "tide-harbor", seals: ["stratum"] } } },
    ...WORLD_ROOMS
  };
  var FIRST_LAYOUTS = { glass: 2, roots: 1, wild: 4, basalt: 3, foundry: 6, quiet: 5, conduit: 3, cistern: 8, reliquary: 9, nursery: 10, archive: 6, observatory: 4, belfry: 5 };
  ROOMS.reliquary.relic = "ivory-feather";
  ROOMS.nursery.secret = "mirror-echo";
  for (const [id, room2] of Object.entries(ROOMS)) {
    room2.world = worldOf(id);
    room2.theme ??= WORLDS[room2.world].color;
    if (id in FIRST_LAYOUTS) room2.layout = FIRST_LAYOUTS[id];
  }
  var BOONS = {
    edge: { name: "Brighter edge", tag: "DAMAGE", desc: "Your primary weapon deals 24% more damage.", glyph: "\u2727" },
    cadence: { name: "Quickening", tag: "ATTACK SPEED", desc: "Your primary weapon attacks 18% faster.", glyph: "\u22C8" },
    orbit: { name: "Companion spark", tag: "ORBITAL", desc: "A spark circles your body and strikes nearby enemies.", glyph: "\u25C9" },
    shell: { name: "Living vessel", tag: "SURVIVAL", desc: "Gain 25 maximum health and restore 35 health.", glyph: "\u25C7" },
    regeneration: { name: "Second spring", tag: "RECOVERY", desc: "Recover one health each second.", glyph: "\u2667" },
    magnet: { name: "Thread pull", tag: "COLLECTION", desc: "Draw memory fragments from much farther away.", glyph: "\u2318" },
    dash: { name: "Slip the pattern", tag: "MOVEMENT", desc: "Dash recovers 22% faster.", glyph: "\u25C8" }
  };
  var clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  var dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  var rand = (s) => {
    s.rng = Math.imul(1664525, s.rng) + 1013904223 >>> 0;
    return s.rng / 4294967296;
  };
  var randomId = (s) => ++s.serial;
  function createMeta(origin = null) {
    return prepareEquipment({ version: 2, karma: clamp(Number.isFinite(origin?.karma) ? origin.karma : 0, -100, 100), awareness: clamp(Number.isFinite(origin?.awareness) ? origin.awareness : 8, 0, 100), essence: 0, runs: 0, wins: 0, bestRooms: 0, keys: [], seals: [], relics: [], secrets: [], explored: [], abilities: [], training: blankTraining(), gifts: { heart: 0, edge: 0, haste: 0 }, echoes: [], visited: [] });
  }
  function offeredForms(meta2) {
    const r = { rng: 7919 + meta2.runs * 1009 >>> 0 }, list = [...FORM_ORDER], chosen = [];
    if (meta2.runs === 0) {
      chosen.push("spark");
      list.splice(list.indexOf("spark"), 1);
    }
    while (chosen.length < 3) {
      const values = list.map((id) => affinity({ karma: meta2.karma, awareness: meta2.awareness, attachment: 20, world: { vitality: 50 } }, id));
      let cursor = rand(r) * values.reduce((a, b) => a + b, 0), index = list.length - 1;
      for (let i = 0; i < list.length; i++) {
        cursor -= values[i];
        if (cursor <= 0) {
          index = i;
          break;
        }
      }
      chosen.push(list.splice(index, 1)[0]);
    }
    return chosen;
  }
  function createRun(meta2, form = "spark", seed = Date.now() >>> 0) {
    if (!BODIES[form] || !offeredForms(meta2).includes(form)) throw new Error("This form is not in the current.");
    const equipment = prepareEquipment(meta2), gear = gearStats(equipment), body = BODIES[form], training = prepareTraining(equipment.training), hp = body.hp + meta2.gifts.heart * 12 + gear.health + skillStats(training, form).health;
    const run2 = { version: 2, seed: seed >>> 0, rng: seed >>> 0, serial: 0, form, phase: "playing", room: "threshold", roomTime: 0, time: 0, spawnClock: 0.3, spawned: 0, spawnTotal: 0, player: { x: WIDTH / 2, y: HEIGHT / 2 + 90, hp, maxHp: hp, r: 15, facingX: 0, facingY: -1, iframes: 1, dashTime: 0, dashX: 0, dashY: -1, dashCooldown: 0, attackClock: 0.1 }, enemies: [], shots: [], fragments: [], effects: [], marks: [], kills: 0, level: 1, xp: 0, nextXp: 6, choices: [], boons: { edge: 0, cadence: 0, orbit: 0, shell: 0, regeneration: 0, magnet: 0, dash: 0 }, cleared: ["threshold"], discovered: [.../* @__PURE__ */ new Set(["threshold", ...meta2.explored ?? []])], abilities: [.../* @__PURE__ */ new Set([...equipment.abilities ?? meta2.abilities, ...body.ability ? [body.ability] : []])], earnedAbilities: [], karma: meta2.karma, awareness: meta2.awareness, essence: 0, memoryEdge: meta2.gifts.edge * 0.07, memoryHaste: meta2.gifts.haste * 0.025, notice: "Move to the northern gate. Press E to enter the Glass Causeway.", noticeTime: 8, damageFlash: 0, settled: false, roomResolved: [], lastGate: null };
    run2.training = training;
    run2.masteryEarned = {};
    run2.partnerMasteryEarned = {};
    run2.roomPractice = { host: {}, partner: {} };
    run2.stats = { damageDealt: 0, damageTaken: 0, powers: 0, dashes: 0 };
    run2.keys = [...meta2.keys ?? []];
    run2.relics = [...meta2.relics ?? []];
    run2.secrets = [...meta2.secrets ?? []];
    run2.roomKills = 0;
    run2.roomExtra = 0;
    run2.seals = [...equipment.seals ?? []];
    run2.openDoors = [];
    run2.birthForm = form;
    run2.visitedVessels = [form];
    run2.player.morphCooldown = 0;
    run2.player.powerCooldown = 0;
    run2.gear = gear;
    run2.loadout = equipment.loadout;
    run2.equipmentLevels = equipment.inventory;
    run2.loot = [];
    run2.journal = [];
    run2.seenEnemies = [];
    recordArrival(run2);
    if (meta2.runs === 0) {
      run2.notice = "Move with WASD or arrows. Your weapon attacks automatically. Go north and press E.";
      run2.noticeTime = 18;
    }
    return run2;
  }
  function createDailyRun(date = /* @__PURE__ */ new Date()) {
    const daily = dailySeed(date), run2 = createRun(createMeta(), "spark", daily.seed);
    run2.daily = daily;
    run2.notice = "Daily current \xB7 " + daily.day + " UTC. Everyone begins as Spark with starter gear. This challenge records its result separately from campaign rewards.";
    run2.noticeTime = 18;
    return run2;
  }
  function obstacles(room2, run2 = null) {
    const layout = layoutIndex(ROOMS[room2], run2);
    if (Number.isInteger(layout) && !ROOMS[room2].safe && !ROOMS[room2].boss && !ROOMS[room2].miniboss) return ROOM_LAYOUTS[layout].map((box) => ({ ...box }));
    if (ROOMS[room2].safe || ROOMS[room2].boss || ROOMS[room2].miniboss) return [];
    if (room2 === "reliquary") return [{ x: 245, y: 155, w: 42, h: 58 }, { x: 675, y: 387, w: 42, h: 58 }];
    if (worldOf(room2) !== "stratum") {
      const rank = WORLDS[worldOf(room2)].rank;
      return rank % 2 ? [{ x: 300, y: 180, w: 48, h: 68 }, { x: 620, y: 370, w: 48, h: 68 }] : [{ x: 225, y: 290, w: 54, h: 58 }, { x: 680, y: 215, w: 54, h: 58 }];
    }
    const offset = ROOMS[room2].danger % 2 ? 0 : 34;
    return [{ x: 245 + offset, y: 160, w: 52, h: 78 }, { x: 660 - offset, y: 355, w: 52, h: 78 }];
  }
  function circleRect(x, y, r, b) {
    const px = clamp(x, b.x, b.x + b.w), py = clamp(y, b.y, b.y + b.h);
    return Math.hypot(x - px, y - py) < r;
  }
  function move(run2, entity, dx, dy, ignore = false) {
    const boxes = ignore ? [] : obstacles(run2.room, run2), steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 8));
    for (let step = 0; step < steps; step++) {
      let x = clamp(entity.x + dx / steps, 34 + entity.r, WIDTH - 34 - entity.r), y = clamp(entity.y + dy / steps, 34 + entity.r, HEIGHT - 34 - entity.r);
      for (const b of boxes) {
        if (!circleRect(x, y, entity.r, b)) continue;
        const px = clamp(x, b.x, b.x + b.w), py = clamp(y, b.y, b.y + b.h), vx = x - px, vy = y - py, d = Math.hypot(vx, vy);
        if (d > 0) {
          x = px + vx / d * (entity.r + 0.02);
          y = py + vy / d * (entity.r + 0.02);
        } else {
          const faces = [{ d: x - b.x, x: b.x - entity.r - 0.02, y }, { d: b.x + b.w - x, x: b.x + b.w + entity.r + 0.02, y }, { d: y - b.y, x, y: b.y - entity.r - 0.02 }, { d: b.y + b.h - y, x, y: b.y + b.h + entity.r + 0.02 }];
          const face = faces.sort((a, b2) => a.d - b2.d)[0];
          x = face.x;
          y = face.y;
        }
      }
      entity.x = clamp(x, 34 + entity.r, WIDTH - 34 - entity.r);
      entity.y = clamp(y, 34 + entity.r, HEIGHT - 34 - entity.r);
    }
  }
  function predictInputMovement(run2, actor, form, frames) {
    let p = { ...actor };
    if (!actor || actor.hp <= 0) return p;
    for (const input of frames) {
      const dt = 1 / 60, x = input.x ?? 0, y = input.y ?? 0, length = Math.hypot(x, y), mx = length > 1 ? x / length : x, my = length > 1 ? y / length : y;
      p.dashCooldown = Math.max(0, (p.dashCooldown ?? 0) - dt);
      if (input.dash && p.dashCooldown === 0) {
        p.dashTime = 0.16;
        p.dashX = length ? mx : p.facingX;
        p.dashY = length ? my : p.facingY;
        p.dashCooldown = dashCooldown(run2, form);
      }
      const dashing = p.dashTime > 0;
      if (dashing) move(run2, p, p.dashX * 830 * dt, p.dashY * 830 * dt, run2.abilities.includes("phase"));
      else {
        const speed = BODIES[form].speed * (1 + (run2.gear?.speed ?? 0) + skillStats(run2.training, form).speed);
        move(run2, p, mx * speed * dt, my * speed * dt);
      }
      p.dashTime = Math.max(0, (p.dashTime ?? 0) - dt);
      if (!dashing && length) {
        p.facingX = mx;
        p.facingY = my;
      }
    }
    return p;
  }
  function exitPosition(direction2) {
    return { north: { x: WIDTH / 2, y: 31 }, south: { x: WIDTH / 2, y: HEIGHT - 31 }, east: { x: WIDTH - 31, y: HEIGHT / 2 }, west: { x: 31, y: HEIGHT / 2 } }[direction2];
  }
  function gateStatus(run2, direction2) {
    if (run2.rematch) return { available: false, reason: "Finish this rematch, then return to your journey." };
    if (run2.dungeon) return { available: false, reason: "Clear this floor, then choose Descend at the checkpoint." };
    const exit = ROOMS[run2.room].exits[direction2];
    if (!exit) return { available: false, reason: "No gate here." };
    if (!run2.cleared.includes(run2.room)) return { available: false, to: exit.to, reason: "Break the swarm to open the gates." };
    if (exit.requires && !run2.abilities.includes(exit.requires)) return { available: false, reason: "Requires " + ABILITIES[exit.requires].name + ".", requires: exit.requires, to: exit.to };
    const missing = (exit.keys ?? []).filter((id) => !(run2.keys ?? []).includes(id));
    if (missing.length) return { available: false, to: exit.to, keys: exit.keys, missingKeys: missing, reason: "Needs " + missing.map((id) => KEYS[id].name + " \u2014 " + KEYS[id].place).join(" and ") + "." };
    const missingRelics = (exit.relics ?? []).filter((id) => !(run2.relics ?? []).includes(id));
    if (missingRelics.length) return { available: false, to: exit.to, relics: exit.relics, missingRelics, reason: "Needs " + missingRelics.map((id) => ROUTE_RELICS[id].name + " \u2014 " + ROUTE_RELICS[id].place + " in " + WORLDS[ROUTE_RELICS[id].world].name).join(" and ") + "." };
    if (exit.ward && !run2.cleared.includes(exit.ward) && !(run2.seals ?? []).includes(ROOMS[run2.room].world)) return { available: false, to: exit.to, ward: exit.ward, reason: "Wake " + ROOMS[exit.ward].name + " in this world to release the guardian ward." };
    const missingSeals = (exit.seals ?? []).filter((id) => !(run2.seals ?? []).includes(id));
    if (missingSeals.length) return { available: false, to: exit.to, seals: exit.seals, missingSeals, reason: "Needs guardian seals: " + missingSeals.map((id) => WORLDS[id].name).join(", ") + "." };
    if (exit.vessel && ![run2.player.hp > 0 ? run2.form : null, run2.partner?.hp > 0 ? run2.partnerForm : null].includes(exit.vessel)) return { available: false, to: exit.to, vessel: exit.vessel, reason: "Become " + FORMS[exit.vessel].name + " to open this door. Press Q for vessels." };
    return { available: true, to: exit.to, requires: exit.requires, keys: exit.keys, seals: exit.seals, vessel: exit.vessel, relics: exit.relics, ward: exit.ward, opened: (run2.openDoors ?? []).includes(doorId(run2.room, exit.to)) };
  }
  function nearestGate(run2, actor = run2.player) {
    let gate = null;
    for (const direction2 of Object.keys(ROOMS[run2.room].exits)) {
      const position = exitPosition(direction2), distance = dist(actor, position);
      if (!gate || distance < gate.distance) gate = { direction: direction2, position, distance, ...gateStatus(run2, direction2) };
    }
    return gate;
  }
  function gateEntryStatus(run2, direction2, actor = run2.player) {
    if (run2.phase !== "playing") return { available: false, reason: "Finish the current choice before traveling." };
    const status = gateStatus(run2, direction2);
    if (!status.available) return status;
    if (actor !== run2.player && actor !== run2.partner) return { ...status, available: false, reason: "Use your own vessel at the gate." };
    if (!actor || actor.hp <= 0) return { ...status, available: false, reason: "Rekindle your spark before crossing." };
    const other = run2.partner ? actor === run2.player ? run2.partner : run2.player : null, position = exitPosition(direction2);
    if (other?.hp <= 0) return { ...status, available: false, reason: "Rekindle your partner before crossing." };
    if ((actor.gateGrace ?? 0) > 0) return { ...status, available: false, reason: "Arrival grace \xB7 step into the chamber before crossing again." };
    if (dist(actor, position) > 120) return { ...status, available: false, reason: "Move closer to the gate." };
    if (other && dist(other, position) > 120) return { ...status, available: false, reason: "Partner must be near this gate." };
    return status;
  }
  function enterGate(run2, direction2, actor = run2.player) {
    const status = gateEntryStatus(run2, direction2, actor);
    if (!status.available) throw new Error(status.reason);
    const opposite2 = { north: "south", south: "north", east: "west", west: "east" }[direction2];
    const from = run2.room;
    if (status.keys?.length || status.relics?.length || status.ward) {
      run2.openDoors ??= [];
      const door = doorId(from, status.to);
      if (!run2.openDoors.includes(door)) run2.openDoors.push(door);
    }
    return arrive(run2, status.to, opposite2);
  }
  function rememberLoot(run2, room2) {
    run2.loot ??= [];
    run2.equipmentLevels ??= {};
    for (const id of [room2.loot ?? []].flat()) if (!run2.loot.includes(id)) {
      run2.loot.push(id);
      run2.equipmentLevels ??= {};
      run2.equipmentLevels[id] ??= 0;
    }
  }
  function arrive(run2, to, opposite2 = "south") {
    const at = exitPosition(opposite2);
    run2.visitNumber = (run2.visitNumber ?? 0) + 1;
    run2.room = to;
    run2.bossDefeated = null;
    run2.roomTime = 0;
    run2.arrayClock = 8;
    run2.enemies = [];
    run2.shots = [];
    run2.effects = [];
    run2.marks = [];
    run2.fragments = [];
    run2.spawnClock = 0.6;
    run2.spawned = 0;
    run2.roomKills = 0;
    run2.roomExtra = 0;
    run2.spawnTotal = ROOMS[run2.room].safe ? 0 : ROOMS[run2.room].boss || ROOMS[run2.room].miniboss ? 1 : encounterFor(run2)?.total ?? 14 + ROOMS[run2.room].danger * 4;
    run2.player.x = clamp(at.x, 160, WIDTH - 160);
    run2.player.y = clamp(at.y, 160, HEIGHT - 160);
    run2.player.iframes = 1.4;
    run2.player.attackClock = 0.25;
    run2.lastGate = opposite2;
    if (!run2.discovered.includes(run2.room)) run2.discovered.push(run2.room);
    if (run2.partner) {
      run2.partner.x = clamp(run2.player.x + 48, 82, WIDTH - 82);
      run2.partner.y = run2.player.y;
      run2.partner.iframes = 1.4;
      run2.spawnTotal = Math.round(run2.spawnTotal * 1.3);
    }
    run2.roomPractice = { host: {}, partner: {} };
    for (const actor of [run2.player, run2.partner].filter(Boolean)) {
      actor.gateLatched = true;
      actor.gateGrace = 0.75;
    }
    if (ROOMS[run2.room].safe) {
      if (!run2.cleared.includes(run2.room)) run2.cleared.push(run2.room);
      rememberLoot(run2, ROOMS[run2.room]);
    }
    recordArrival(run2);
    if (run2.partner && !ROOMS[to].safe && !run2.cleared.includes(to)) {
      run2.passageRecoveries ??= [];
      if (!run2.passageRecoveries.includes(to)) {
        run2.passageRecoveries.push(to);
        const heals = [run2.player, run2.partner].map((a) => {
          const before = a.hp;
          if (a.hp > 0) a.hp = Math.min(a.maxHp, a.hp + Math.ceil(a.maxHp * 0.12));
          return Math.ceil(a.hp - before);
        });
        run2.notice += " Passage recovery \xB7 P1 +" + heals[0] + " HP \xB7 P2 +" + heals[1] + " HP.";
        run2.noticeTime = 8;
      }
    }
    effect(run2, "gate", run2.player.x, run2.player.y, ROOMS[run2.room].theme, 60);
    if ((ROOMS[run2.room].boss || ROOMS[run2.room].miniboss) && !run2.cleared.includes(run2.room)) spawnBoss(run2);
    return run2.room;
  }
  function checkpointAvailable(run2) {
    return !!run2 && !run2.rematch && run2.phase === "playing" && run2.player.hp > 0 && (!run2.partner || run2.partner.hp > 0) && (ROOMS[run2.room].safe || ROOMS[run2.room].boss && run2.cleared.includes(run2.room));
  }
  function beginDungeonChamber(run2, room2, pressure) {
    if (!run2.dungeon || !ROOMS[room2] || ROOMS[room2].safe) throw Error("Choose a dungeon combat chamber.");
    run2.dungeon.pressure = pressure;
    run2.cleared = [];
    run2.roomResolved = [];
    run2.journal = [];
    run2.earnedAbilities = [];
    run2.loot = [];
    run2.bossDefeated = null;
    run2.phase = "playing";
    run2.choices = [];
    arrive(run2, room2);
    run2.spawnTotal = ROOMS[room2].boss || ROOMS[room2].miniboss ? 1 : pressure.total;
    run2.player.x = WIDTH / 2;
    run2.player.y = HEIGHT / 2 + 100;
    run2.player.gateLatched = true;
    return room2;
  }
  function beginBossRematch(run2, room2) {
    if (!run2.rematch || !ROOMS[room2]?.boss && !ROOMS[room2]?.miniboss) throw Error("Choose a guardian to refight.");
    run2.phase = "playing";
    run2.cleared = [];
    run2.roomResolved = [];
    run2.choices = [];
    run2.fragments = [];
    run2.time = 0;
    run2.kills = 0;
    run2.stats = { damageDealt: 0, damageTaken: 0, powers: 0, dashes: 0 };
    run2.masteryEarned = {};
    run2.partnerMasteryEarned = {};
    run2.journal = [];
    run2.loot = [];
    run2.essence = 0;
    arrive(run2, room2);
    run2.player.x = 480;
    run2.player.y = 440;
    run2.player.hp = run2.player.maxHp;
    run2.player.powerCooldown = 0;
    run2.player.morphCooldown = 0;
    return run2;
  }
  function prepareDungeonGifts(run2) {
    if (!run2.dungeon || run2.phase !== "resolve" || run2.xp < run2.nextXp) throw Error("No dungeon gift is waiting.");
    run2.xp -= run2.nextXp;
    run2.level++;
    run2.nextXp = 6 + run2.level * 4;
    offerBoons(run2);
  }
  function travelWorld(run2, world) {
    if (!run2) throw Error("Inhabit a vessel first.");
    if (!Object.hasOwn(WORLDS, world) || !worldUnlocked(world, run2.seals ?? [])) throw Error("Collect the preceding guardian seals first.");
    if (!checkpointAvailable(run2)) throw Error("World travel is available at a safe checkpoint or a defeated guardian.");
    if (run2.partner && dist(run2.player, run2.partner) > 170) throw Error("Bring your partner close before crossing worlds.");
    return arrive(run2, WORLDS[world].entry);
  }
  function equipRunItem(run2, meta2, id) {
    if (run2.daily) meta2 = createMeta();
    if (!checkpointAvailable(run2)) throw Error("Equip found gear at a safe checkpoint.");
    if (!Object.hasOwn(EQUIPMENT, id) || !(id in (meta2.inventory ?? {})) && !(run2.loot ?? []).includes(id)) throw Error("This item has not been found.");
    const inventory = { ...meta2.inventory, ...run2.equipmentLevels };
    for (const item of run2.loot ?? []) inventory[item] ??= 0;
    const equipment = prepareEquipment({ inventory, loadout: { ...run2.loadout, [EQUIPMENT[id].slot]: id } }), gear = gearStats(equipment), difference = gear.health - (run2.gear?.health ?? 0);
    for (const actor of [run2.player, run2.partner].filter(Boolean)) {
      const ratio = actor.hp / actor.maxHp;
      actor.maxHp += difference;
      actor.hp = actor.maxHp * ratio;
    }
    run2.gear = gear;
    run2.loadout = equipment.loadout;
    run2.equipmentLevels = equipment.inventory;
    run2.notice = EQUIPMENT[id].name + " equipped. Injuries carry across the change.";
    run2.noticeTime = 4;
    return id;
  }
  var ENCOUNTERS = { glass: { total: 14, interval: 0.95, cap: 6, damage: 0.7, pool: ["collector", "collector", "collector", "archon", "hound"] }, machine: { total: 14, interval: 1.2, cap: 5, rangedCap: 1, damage: 0.65, pool: ["collector", "collector", "collector", "archon", "hound"] }, roots: { total: 20, interval: 0.85, cap: 9, damage: 0.85, pool: ["collector", "archon", "spore", "collector"] }, quiet: { total: 18, interval: 1.1, cap: 6, damage: 0.75, pool: ["collector", "collector", "archon", "hound"] }, conduit: { total: 20, interval: 0.95, cap: 8, damage: 0.85, pool: ["collector", "collector", "archon", "leech", "moth"] }, cistern: { total: 22, interval: 0.9, cap: 9, damage: 0.9, pool: ["collector", "collector", "archon", "leech", "moth"] }, reliquary: { total: 16, interval: 1, cap: 6, damage: 0.8, pool: ["collector", "archon", "collector", "hound"] }, nursery: { total: 18, interval: 1, cap: 7, damage: 0.8, pool: ["collector", "archon", "mirror", "collector"] }, archive: { total: 22, interval: 0.9, cap: 9, damage: 0.9, pool: ["collector", "spore", "archon", "hound"] }, observatory: { total: 22, interval: 0.9, cap: 9, damage: 0.9, pool: ["collector", "leech", "moth", "archon"] }, belfry: { total: 22, interval: 1, cap: 9, damage: 0.9, pool: ["collector", "archon", "mirror", "hound"] }, ...WORLD_ENCOUNTERS };
  var ENEMY_KINDS = ["collector", "archon", "warden", "hound", "mirror", "spore", "oracle", "leech", "moth", "cantor", "sentinel", ...Object.keys(COMBAT_ROLES), ...Object.keys(WORLD_GUARDIANS)];
  var encounterFor = (run2) => run2.rematch ? { damage: run2.rematch.damage } : run2.dungeon ? { ...ENCOUNTERS[run2.room], ...run2.dungeon.pressure, damage: run2.dungeon.pressure.damage * (ROOMS[run2.room].boss || ROOMS[run2.room].miniboss ? 1.4 : 1) } : run2.swarmPact && ENCOUNTERS[run2.room] ? { ...ENCOUNTERS[run2.room], total: Math.ceil(ENCOUNTERS[run2.room].total * 1.25), cap: ENCOUNTERS[run2.room].cap + 2, interval: ENCOUNTERS[run2.room].interval * 0.88 } : ENCOUNTERS[run2.room];
  function floorRecovery(run2) {
    const base = Math.max(32 + Math.min(28, (run2.dungeon.floor - 1) * 2), run2.player.maxHp * 0.2);
    return Math.ceil(base * (run2.dungeon.condition === "wither" ? 0.6 : 1));
  }
  function swarmProgress(run2) {
    const clear = run2.cleared.includes(run2.room), total = run2.spawnTotal + (run2.roomExtra ?? 0), defeated = run2.roomKills ?? Math.max(0, run2.spawned - run2.enemies.filter((e2) => e2.hp > 0).length);
    return { defeated: clear ? total : Math.min(defeated, total), total, remaining: clear ? 0 : Math.max(run2.enemies.filter((e2) => e2.hp > 0).length, total - defeated), fraction: clear ? 1 : Math.min(0.99, defeated / Math.max(1, total)), cleared: clear };
  }
  function rewardBanner(run2, type, title, text, color = "#e9cb87") {
    run2.banner = { type, title, text, color, remaining: 6 };
    effect(run2, type, run2.player.x, run2.player.y, color, 80);
  }
  function spawnEnemy(run2, forced = null, count = true) {
    let x, y;
    const actors = [run2.player, run2.partner].filter((p) => p && p.hp > 0);
    for (let attempt = 0; attempt < 12; attempt++) {
      const edge = Math.floor(rand(run2) * 4);
      x = edge === 0 ? 65 : edge === 1 ? WIDTH - 65 : 80 + rand(run2) * (WIDTH - 160);
      y = edge === 2 ? 65 : edge === 3 ? HEIGHT - 65 : 80 + rand(run2) * (HEIGHT - 160);
      if (actors.every((p) => Math.hypot(p.x - x, p.y - y) > 180)) break;
    }
    const difficulty = ROOMS[run2.room].danger, roll = rand(run2), pool = encounterFor(run2)?.pool;
    let kind = forced ?? (pool ? pool[Math.floor(roll * pool.length)] : roll < 0.12 && difficulty >= 3 ? "oracle" : roll < 0.25 && difficulty >= 2 ? "spore" : roll < 0.37 && difficulty >= 2 ? "mirror" : roll < 0.53 ? "hound" : roll < 0.7 ? "archon" : "collector");
    if (kind === "archon" && run2.enemies.filter((e2) => e2.hp > 0 && e2.kind === "archon").length >= (encounterFor(run2)?.rangedCap ?? 3)) kind = "collector";
    const enemy = { id: randomId(run2), kind, x, y, r: kind === "archon" ? 17 : 14, hp: (kind === "archon" ? 42 : 24) + difficulty * 6, maxHp: (kind === "archon" ? 42 : 24) + difficulty * 6, speed: kind === "archon" ? 53 : 74 + difficulty * 6, attack: 1.2 + rand(run2) * 1.1, orbitHit: 0, flash: 0 };
    const stats = { hound: { hp: 31, speed: 84, r: 14 }, mirror: { hp: 55, speed: 58, r: 18 }, spore: { hp: 38, speed: 45, r: 17 }, oracle: { hp: 75, speed: 38, r: 20 }, leech: { hp: 49, speed: 59, r: 17 }, moth: { hp: 29, speed: 102, r: 14 } }[COMBAT_ROLES[kind] ?? kind];
    if (stats) Object.assign(enemy, { hp: stats.hp + difficulty * 5, maxHp: stats.hp + difficulty * 5, speed: stats.speed, r: stats.r, windup: 0, charge: 0, chargeX: 0, chargeY: 0, shield: 0 });
    if (run2.partner) {
      enemy.hp *= 1.3;
      enemy.maxHp = enemy.hp;
    }
    run2.seenEnemies ??= [];
    if (!run2.seenEnemies.includes(kind)) run2.seenEnemies.push(kind);
    if (actors.some((p) => dist(enemy, p) < 160)) {
      const corners = [{ x: 65, y: 65 }, { x: WIDTH - 65, y: 65 }, { x: 65, y: HEIGHT - 65 }, { x: WIDTH - 65, y: HEIGHT - 65 }];
      const safe = corners.sort((a, b) => Math.min(...actors.map((p) => dist(p, b))) - Math.min(...actors.map((p) => dist(p, a))))[0];
      enemy.x = safe.x;
      enemy.y = safe.y;
    }
    const pressure = encounterFor(run2);
    enemy.hp *= pressure?.health ?? 1;
    enemy.maxHp = enemy.hp;
    enemy.speed *= pressure?.speed ?? 1;
    run2.enemies.push(enemy);
    if (count) run2.spawned++;
    else run2.roomExtra = (run2.roomExtra ?? 0) + 1;
  }
  function spawnBoss(run2) {
    const mini = !!ROOMS[run2.room].miniboss, sentinel = ROOMS[run2.room].guardian === "sentinel", guardian = WORLD_GUARDIANS[ROOMS[run2.room].guardian], baseHp = guardian ? guardian.hp * (run2.partner ? 1.5 : 1) : sentinel ? run2.partner ? 2e3 : 1400 : mini ? run2.partner ? 1600 : 1100 : run2.partner ? 2700 : 1800, hp = run2.rematch ? run2.rematch.health : run2.dungeon ? 3600 * run2.dungeon.pressure.health * (1 + Math.max(0, run2.dungeon.floor - 5) / 30) : baseHp, kind = guardian ? ROOMS[run2.room].guardian : sentinel ? "sentinel" : mini ? "cantor" : "warden";
    run2.enemies.push({ id: randomId(run2), kind, x: WIDTH / 2, y: HEIGHT / 2 - 90, r: guardian ? kind === "demiurge" ? 47 : 37 : mini ? 32 : 37, hp, maxHp: hp, speed: guardian?.speed ?? (sentinel ? 42 : mini ? 48 : 65), attack: 2, markClock: 3.5, orbitHit: 0, flash: 0 });
    run2.spawned = 1;
    run2.seenEnemies ??= [];
    if (!run2.seenEnemies.includes(kind)) run2.seenEnemies.push(kind);
  }
  function effect(run2, type, x, y, color, r = 20, value = null) {
    const life = ["key", "unlock", "boss"].includes(type) ? 1.2 : type === "damage" ? 0.9 : type === "wave" ? 0.4 : 0.3;
    if (run2.effects.length < 140) run2.effects.push({ id: randomId(run2), type, x, y, color, r, life, maxLife: life, ...value === null ? {} : { value } });
  }
  function actorStats(run2, partner = false) {
    run2.stats ??= { damageDealt: 0, damageTaken: 0, powers: 0, dashes: 0 };
    if (partner) return run2.stats.partner ??= { damageDealt: 0, damageTaken: 0, powers: 0, dashes: 0 };
    return run2.stats;
  }
  function damageEnemy(run2, enemy, amount, form = run2.form, partner = run2.player === run2.partner) {
    if (enemy.hp <= 0) return;
    if ((COMBAT_ROLES[enemy.kind] ?? enemy.kind) === "mirror" && enemy.shield > 0) amount *= 0.35;
    actorStats(run2, partner).damageDealt += Math.min(enemy.hp, amount);
    enemy.hp -= amount;
    enemy.flash = 0.08;
    effect(run2, "hit", enemy.x, enemy.y, BODIES[form].color, 13);
    if (enemy.hp <= 0) {
      run2.marks = run2.marks.filter((mark) => mark.sourceId !== enemy.id);
      run2.kills++;
      run2.roomKills = (run2.roomKills ?? 0) + 1;
      const value = enemy.kind === "warden" || WORLD_GUARDIANS[enemy.kind] ? 30 : ["cantor", "sentinel"].includes(enemy.kind) ? 18 : enemy.kind === "archon" ? 3 : 2;
      run2.fragments.push({ id: randomId(run2), x: enemy.x, y: enemy.y, value, r: 5 });
      effect(run2, "burst", enemy.x, enemy.y, enemy.kind === "warden" ? "#f7cb79" : "#8bc7c2", 32);
    }
  }
  function hurt(run2, amount, target = run2.player) {
    if (target.hp <= 0 || target.iframes > 0) return;
    const form = target === run2.partner ? run2.partnerForm : run2.form, skills = skillStats(run2.training, form), armor = form === "rock" ? 0.7 : 1;
    const before = target.hp;
    target.hp = Math.max(0, target.hp - amount * armor * Math.max(0.1, 1 - (run2.gear?.armor ?? 0) - skills.armor) * (target.guardTime > 0 ? 0.5 : 1) * (encounterFor(run2)?.damage ?? 1));
    actorStats(run2, target === run2.partner).damageTaken += before - target.hp;
    target.iframes = 0.7;
    target.hurtFlash = 0.32;
    run2.damageFlash = 0.32;
    effect(run2, "damage", target.x, target.y - 42, "#ffad8f", 0, Math.ceil(before - target.hp));
    if (target.hp <= 0) {
      if (!run2.partner || [run2.player, run2.partner].every((p) => p.hp <= 0)) {
        run2.phase = "dead";
        if (run2.partner) run2.endReason = "both-fallen";
        run2.notice = "The bodies end. The sparks return.";
      } else {
        target.downedFor = RESCUE_SECONDS;
        run2.fallSerial = (run2.fallSerial ?? 0) + 1;
        target.fallId = run2.fallSerial;
        target.fellAt = run2.time;
        target.revive = 0;
        target.dashTime = 0;
        const survivor = target === run2.player ? run2.partner : run2.player;
        survivor.iframes = Math.max(survivor.iframes, 1.5);
        run2.notice = "A spark is down \xB7 30 seconds. Stand close and hold E to rekindle your partner.";
        run2.noticeTime = 6;
      }
    }
  }
  function fire(run2, x, y, angle, damage, enemy = false, speed = 430, range = 700, homing = false, source = null) {
    if (run2.shots.length >= (run2.dungeon || run2.swarmPact ? 360 : 240)) return;
    const form = source?.form ?? run2.form, partner = source?.partner ?? run2.player === run2.partner;
    run2.shots.push({ id: randomId(run2), x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, damage, enemy, r: enemy ? 6 : 5, life: range / speed, homing, ...homing ? { homingSpeed: speed } : {}, color: enemy ? ["cantor", "warden", "sentinel"].includes(run2.shotRole) || WORLD_GUARDIANS[run2.shotRole] ? "#f3ba63" : "#71e5e4" : BODIES[form].color, ...!enemy ? { sourceForm: form, sourcePartner: partner } : { sourceKind: run2.shotRole ?? "archon" } });
  }
  function attackProfile(run2, form = run2.form) {
    const body = BODIES[form], item = EQUIPMENT[run2.loadout?.weapon];
    return item?.attack ? { ...item.attack, name: item.name } : { damage: body.damage, interval: body.interval, range: body.range, name: body.weapon, style: form === "spark" ? "homing" : form === "computer" ? "volley" : ["human", "animal"].includes(form) ? "cleave" : "wave" };
  }
  function powerProfile(run2, form = run2?.form ?? "spark") {
    const base = VESSEL_POWERS[form], skills = skillStats(run2?.training, form), heal = ({ human: 18, tree: 12 }[form] ?? 0) + skills.powerHeal;
    let desc = { spark: "Pulse light through nearby foes and clear nearby enemy bolts." + (skills.pulseHeal ? " Clearing bolts restores up to " + skills.pulseHeal + " HP." : ""), human: "Restore up to " + heal + " HP, strike nearby foes, and guard for " + (3 + skills.guardExtra) + " seconds.", computer: "Double attack speed for " + (4 + skills.overclockExtra) + " seconds and launch a seeking volley." + (skills.firewall ? " Clear nearby enemy bolts and guard for two seconds." : ""), animal: "Leap along your facing direction and strike where you land." + (heal ? " Restore up to " + heal + " HP." : ""), tree: "Root nearby foes for " + (2.5 + skills.rootExtra) + " seconds and restore up to " + heal + " HP. Guardians resist rooting.", rock: "Guard for " + (4 + skills.guardExtra) + " seconds and send a heavy shockwave around you." + (skills.clearBolts ? " Clear nearby enemy bolts." : "") }[form];
    if (skills.partnerHeal) desc += " Restore up to " + skills.partnerHeal + " HP to a nearby living partner.";
    return { ...base, desc, cooldown: base.cooldown * (1 - skills.powerCooldown) };
  }
  function attack(run2) {
    const p = run2.player, body = BODIES[run2.form], skills = skillStats(run2.training, run2.form), profile = attackProfile(run2), range = profile.range * (1 + (run2.gear?.range ?? 0) + skills.range), enemies = run2.enemies.filter((e2) => e2.hp > 0), target = enemies.sort((a, b) => dist(p, a) - dist(p, b))[0];
    if (!target || dist(p, target) > range) return;
    const melee = ["cleave", "wave"].includes(profile.style), damage = profile.damage * (1 + run2.boons.edge * 0.24 + run2.memoryEdge + (run2.gear?.damage ?? 0) + skills.damage + (p.hp / p.maxHp > 0.7 ? skills.healthyDamage : 0) + (melee ? run2.gear?.melee ?? 0 : 0)), angle = Math.atan2(target.y - p.y, target.x - p.x);
    p.facingX = Math.cos(angle);
    p.facingY = Math.sin(angle);
    if (profile.style === "homing") fire(run2, p.x, p.y, angle, damage, false, 390, range, true);
    else if (profile.style === "volley") for (const a of [-0.17, 0, 0.17]) fire(run2, p.x, p.y, angle + a, damage, false, 500, range, !!skills.homingVolley);
    else {
      const radius = range;
      for (const enemy of enemies) {
        const distance = dist(p, enemy);
        if (distance < radius + enemy.r) {
          if (profile.style === "cleave") {
            const a = Math.atan2(enemy.y - p.y, enemy.x - p.x);
            if (Math.cos(a - angle) > 0.05) damageEnemy(run2, enemy, damage);
          } else damageEnemy(run2, enemy, damage);
        }
      }
      effect(run2, profile.style === "cleave" ? "slash" : "wave", p.x, p.y, body.color, radius);
    }
  }
  function useVesselPower(run2, partner = false) {
    const actor = partner ? run2.partner : run2.player, form = partner ? run2.partnerForm : run2.form, power = VESSEL_POWERS[form], skills = skillStats(run2.training, form);
    if (run2.phase !== "playing" || !actor || actor.hp <= 0) throw Error("This vessel cannot use its power right now.");
    if ((actor.powerCooldown ?? 0) > 0) throw Error("The vessel power is recovering.");
    actor.powerCooldown = power.cooldown * (1 - skills.powerCooldown);
    actorStats(run2, partner).powers++;
    if (form === "animal") {
      const length = 150 + skills.pounceLength;
      move(run2, actor, actor.facingX * length, actor.facingY * length);
      actor.iframes = Math.max(actor.iframes, 0.35 + skills.pounceIframes);
    }
    if (form === "human") actor.guardTime = 3 + skills.guardExtra;
    if (form === "rock") actor.guardTime = 4 + skills.guardExtra;
    const heal = ({ human: 18, tree: 12 }[form] ?? 0) + skills.powerHeal;
    actor.hp = Math.min(actor.maxHp, actor.hp + heal);
    const other = partner ? run2.player : run2.partner;
    if (other?.hp > 0 && dist(actor, other) < 300) other.hp = Math.min(other.maxHp, other.hp + skills.partnerHeal);
    if (form === "computer") {
      actor.overclockTime = 4 + skills.overclockExtra;
      if (skills.firewall) actor.guardTime = 2;
      const angle = Math.atan2(actor.facingY, actor.facingX);
      for (const spread of [-0.35, -0.17, 0, 0.17, 0.35]) fire(run2, actor.x, actor.y, angle + spread, 25 * (1 + run2.boons.edge * 0.24), false, 390, 680, true, { form, partner });
    }
    const radius = (form === "animal" ? 120 : form === "human" ? 155 : 235) * (1 + skills.powerRadius);
    if (form !== "computer") {
      const damage = { spark: 65, human: 70, animal: 75, tree: 50, rock: 95 }[form] * (1 + run2.boons.edge * 0.24 + run2.memoryEdge + skills.powerDamage);
      for (const enemy of run2.enemies) if (enemy.hp > 0 && dist(enemy, actor) < radius + enemy.r) {
        damageEnemy(run2, enemy, damage, form, partner);
        if (form === "tree") enemy.rootTime = WORLD_GUARDIANS[enemy.kind] || ["warden", "cantor", "sentinel"].includes(enemy.kind) ? 0.5 + skills.rootExtra * 0.3 : 2.5 + skills.rootExtra;
      }
    }
    if (form === "spark" || skills.firewall || skills.clearBolts) {
      const before = run2.shots.length;
      run2.shots = run2.shots.filter((shot) => !shot.enemy || dist(shot, actor) > radius);
      if (run2.shots.length < before) actor.hp = Math.min(actor.maxHp, actor.hp + skills.pulseHeal);
    }
    effect(run2, "power", actor.x, actor.y, BODIES[form].color, form === "computer" ? 75 : radius);
    run2.notice = power.name + ". " + powerProfile(run2, form).desc;
    run2.noticeTime = 3;
    return power.name;
  }
  function stepGuardian(run2, enemy, target, dt) {
    const spec = WORLD_GUARDIANS[enemy.kind], d = dist(enemy, target), dx = (target.x - enemy.x) / (d || 1), dy = (target.y - enemy.y) / (d || 1), stage = enemy.kind === "demiurge" ? 1 + (enemy.hp < enemy.maxHp * 0.66 ? 1 : 0) + (enemy.hp < enemy.maxHp * 0.33 ? 1 : 0) : enemy.hp < enemy.maxHp * 0.5 ? 2 : 1;
    move(run2, enemy, dx * enemy.speed * (d > 240 ? 1 : d < 165 ? -0.4 : 0) * dt, dy * enemy.speed * (d > 240 ? 1 : d < 165 ? -0.4 : 0) * dt, true);
    if (enemy.stage !== stage) {
      enemy.stage = stage;
      effect(run2, "wave", enemy.x, enemy.y, spec.color, 95);
      if (stage > 1 && ["thornmother", "demiurge"].includes(enemy.kind) && run2.enemies.length < 12) {
        spawnEnemy(run2, enemy.kind === "thornmother" ? "thornling" : "satellite", false);
        spawnEnemy(run2, "collector", false);
      }
    }
    enemy.attack -= dt;
    enemy.markClock -= dt;
    if (enemy.attack <= 0 && !(enemy.windup > 0)) {
      enemy.windup = 0.8;
      enemy.aimAngle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
      enemy.volleyAngle = run2.time * 0.25;
    }
    if (enemy.windup > 0) {
      enemy.windup -= dt;
      if (enemy.windup <= 0) {
        const angle = enemy.aimAngle, spin = enemy.volleyAngle;
        if (spec.pattern === "tide") for (const spread of [-0.6, -0.3, 0, 0.3, 0.6]) fire(run2, enemy.x, enemy.y, angle + spread, 12, true, 175, 1e3);
        else if (spec.pattern === "roots") for (let i = 0; i < 6; i++) fire(run2, enemy.x, enemy.y, spin + i * Math.PI / 3, 12, true, 145, 950);
        else if (spec.pattern === "clock") for (let i = 0; i < 12; i++) {
          if (i % 6 === 0) continue;
          fire(run2, enemy.x, enemy.y, spin + i * Math.PI / 6, 14, true, 170, 1e3);
        }
        else if (spec.pattern === "weave") for (const spread of [-0.55, -0.2, 0.2, 0.55]) {
          fire(run2, enemy.x, enemy.y, angle + spread, 13, true, 210, 1100);
          fire(run2, enemy.x, enemy.y, angle + spread + Math.PI, 11, true, 155, 1e3);
        }
        else if (spec.pattern === "orbit") for (let i = 0; i < 8; i++) fire(run2, enemy.x, enemy.y, spin + i * Math.PI / 4, 14, true, 155 + i % 2 * 55, 1100);
        else {
          for (let i = 0; i < 16; i++) {
            if (i % 8 === 0) continue;
            fire(run2, enemy.x, enemy.y, spin + i * Math.PI / 8, 14 + stage * 2, true, 145 + stage * 20, 1100);
          }
          if (stage >= 2) for (const spread of [-0.28, 0, 0.28]) fire(run2, enemy.x, enemy.y, angle + spread, 18, true, 235, 1100);
        }
        enemy.volleys = (enemy.volleys ?? 0) + 1;
        enemy.attack = spec.pattern === "origin" ? 2.8 - stage * 0.3 : stage === 2 ? 2 : 2.6;
      }
    }
    if (enemy.markClock <= 0 && run2.marks.length < 35) {
      const offsets = spec.pattern === "roots" ? [-130, 0, 130] : spec.pattern === "clock" ? [-180, 0, 180] : spec.pattern === "origin" && stage === 3 ? [-210, -105, 0, 105, 210] : [0];
      for (const offset of offsets) run2.marks.push({ x: clamp(target.x + offset, 70, WIDTH - 70), y: target.y, r: spec.pattern === "roots" ? 50 : 62, timer: 1.35, life: 1.35, color: spec.color, damage: spec.pattern === "origin" ? 24 : 18, sourceId: enemy.id });
      enemy.markClock = stage > 1 ? 3 : 4;
    }
    if (d < enemy.r + target.r) hurt(run2, 20, target);
  }
  function stepFirstGuardian(run2, enemy, target, dt) {
    const kind = enemy.kind, d = dist(enemy, target), dx = (target.x - enemy.x) / (d || 1), dy = (target.y - enemy.y) / (d || 1), stage = enemy.hp < enemy.maxHp * 0.5 ? 2 : 1, sign = d < (kind === "warden" ? 180 : 165) ? -0.4 : d > 260 ? 1 : 0;
    move(run2, enemy, dx * enemy.speed * sign * dt, dy * enemy.speed * sign * dt, true);
    if (enemy.stage !== stage && stage === 2) {
      const name = kind === "cantor" ? "The Cantor" : kind === "sentinel" ? "The Crown Sentinel" : "The Warden";
      rewardBanner(run2, "phase", name + " \xB7 " + (kind === "cantor" ? "second movement" : "second phase"), kind === "cantor" ? "Eight notes. Watch the aimed pair and leave the ground seals." : "The pattern changes. Watch the golden wind-up and leave the marked ground.", "#ebc68e");
      effect(run2, "wave", enemy.x, enemy.y, "#ebc68e", 95);
      if (kind === "warden") {
        enemy.enraged = true;
        spawnEnemy(run2, "hound", false);
        spawnEnemy(run2, "hound", false);
      }
    }
    enemy.stage = stage;
    enemy.attack -= dt;
    if (enemy.windup > 0) {
      enemy.windup -= dt;
      if (enemy.windup <= 0) {
        if (kind === "cantor") {
          const count = stage === 1 ? 6 : 8;
          for (let i = 0; i < count; i++) fire(run2, enemy.x, enemy.y, enemy.volleyAngle + i * Math.PI * 2 / count, 11, true, stage === 1 ? 160 : 180, 900);
          if (stage === 2) for (const spread of [-0.18, 0.18]) fire(run2, enemy.x, enemy.y, enemy.aimAngle + spread, 11, true, 180, 900);
          enemy.attack = stage === 1 ? 2.5 : 2.8;
        } else if (kind === "sentinel") {
          const count = stage === 1 ? 8 : 12;
          for (let i = 0; i < count; i++) {
            if (stage === 2 && i % 6 === 0) continue;
            fire(run2, enemy.x, enemy.y, enemy.volleyAngle + i * Math.PI * 2 / count, stage === 1 ? 12 : 14, true, stage === 1 ? 170 : 185, 900);
          }
          enemy.attack = stage === 1 ? 2.4 : 2;
        } else {
          for (const spread of stage === 2 ? [-0.36, -0.18, 0, 0.18, 0.36] : [-0.2, 0, 0.2]) fire(run2, enemy.x, enemy.y, enemy.aimAngle + spread, stage === 2 ? 16 : 14, true, stage === 2 ? 260 : 220, 1e3);
          enemy.attack = stage === 2 ? 0.9 : 1.4;
        }
        enemy.volleys = (enemy.volleys ?? 0) + 1;
      }
    } else if (enemy.attack <= 0) {
      enemy.windup = kind === "cantor" ? 0.9 : 0.8;
      enemy.volleyAngle = run2.time * (kind === "sentinel" ? 0.45 : 0.3);
      enemy.aimAngle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
      effect(run2, "wave", enemy.x, enemy.y, "#ebc68e", 70);
    }
    enemy.markClock -= dt;
    if (enemy.markClock <= 0) {
      run2.marks.push({ x: target.x, y: target.y, r: kind === "cantor" ? 62 : 70, timer: kind === "cantor" ? 1.2 : 1.1, life: kind === "cantor" ? 1.2 : 1.1, sourceId: enemy.id });
      enemy.markClock = stage === 2 ? 2.6 : 3.6;
    }
    if (d < target.r + enemy.r) hurt(run2, kind === "warden" ? 22 : 9, target);
  }
  function offerBoons(run2) {
    const list = Object.keys(BOONS).filter((id) => id !== "orbit" || run2.boons.orbit < 4);
    run2.choices = [];
    while (run2.choices.length < 3 && list.length) {
      const i = Math.floor(rand(run2) * list.length);
      run2.choices.push(list.splice(i, 1)[0]);
    }
    run2.phase = "boon";
    effect(run2, "level", run2.player.x, run2.player.y, "#c2dfbc", 90);
  }
  function chooseBoon(run2, id) {
    if (run2.phase !== "boon" || !run2.choices.includes(id)) throw new Error("This gift is not offered.");
    run2.boons[id]++;
    if (id === "shell") for (const p of [run2.player, run2.partner].filter((p2) => p2 && p2.hp > 0)) {
      const before = p.hp;
      p.maxHp += 25;
      p.hp = Math.min(p.maxHp, p.hp + 35);
      if (run2.dungeon && p === run2.player) run2.dungeon.vesselRecovered = (run2.dungeon.vesselRecovered ?? 0) + Math.ceil(p.hp - before);
    }
    run2.phase = "playing";
    run2.choices = [];
    run2.notice = BOONS[id].name + " remembers you.";
    run2.noticeTime = 3;
    if (run2.xp >= run2.nextXp) {
      run2.xp -= run2.nextXp;
      run2.level++;
      run2.nextXp = 6 + run2.level * 4;
      offerBoons(run2);
    } else if (run2.dungeon && run2.cleared.includes(run2.room)) run2.phase = "resolve";
    else if (run2.room === "eye" && run2.cleared.includes("eye") && !run2.eyeAcknowledged) run2.phase = "milestone";
  }
  function awardMastery(run2) {
    for (const role of ["host", "partner"]) {
      const actor = role === "host" ? run2.player : run2.partner;
      if (!actor) continue;
      const practiced = Object.entries(run2.roomPractice?.[role] ?? {}).sort((a, b) => b[1] - a[1]);
      if (!practiced.length || practiced[0][1] < 0.5) continue;
      const earned = role === "host" ? "masteryEarned" : "partnerMasteryEarned";
      run2[earned] ??= {};
      const form = practiced[0][0];
      run2[earned][form] = (run2[earned][form] ?? 0) + (ROOMS[run2.room].boss ? 30 : 10);
    }
  }
  function clearRoom(run2) {
    if (run2.cleared.includes(run2.room)) return;
    const room2 = ROOMS[run2.room];
    run2.lastClear = { room: run2.room, visit: run2.visitNumber ?? 0, floor: run2.dungeon?.floor ?? 0 };
    run2.clearNotice = (run2.dungeon ? "Floor " + run2.dungeon.floor : room2.name) + " cleared.";
    if (room2.boss || room2.miniboss) {
      const name = WORLD_GUARDIANS[room2.guardian]?.name ?? (room2.guardian === "sentinel" ? "The Crown Sentinel" : room2.miniboss ? "The Cantor" : "The Warden");
      run2.bossDefeated = { name, room: run2.room };
      rewardBanner(run2, "boss", name + " defeated", run2.rematch ? "The echo falls. Your journey is waiting." : run2.dungeon ? "The next rung opens." : room2.loot ? EQUIPMENT[room2.loot]?.name + " recovered." : room2.seal ? "A guardian seal answers." : (room2.treasure ?? 0) + (room2.miniboss ? 7 : 40) + " essence recovered.");
    }
    if (run2.rematch) {
      run2.cleared = [run2.room];
      run2.rematch.cleared = true;
      run2.enemies = [];
      run2.shots = [];
      run2.marks = [];
      run2.fragments = [];
      run2.phase = "won";
      return;
    }
    if (run2.dungeon) {
      run2.cleared = [run2.room];
      run2.dungeon.floorsCleared++;
      run2.xp += run2.fragments.reduce((sum, f) => sum + f.value, 0);
      run2.fragments = [];
      run2.shots = [];
      run2.marks = [];
      run2.enemies = [];
      const before = run2.player.hp;
      run2.player.hp = Math.min(run2.player.maxHp, run2.player.hp + floorRecovery(run2));
      run2.dungeon.recovered = Math.ceil(run2.player.hp - before);
      run2.phase = "resolve";
      run2.notice = "Floor " + run2.dungeon.floor + " cleared. Rest, remember a gift, then descend.";
      run2.noticeTime = 8;
      return;
    }
    awardMastery(run2);
    effect(run2, "gate", run2.player.x, run2.player.y, "#dfc288", 65);
    run2.cleared.push(run2.room);
    if (room2.wardFor) rewardBanner(run2, "unlock", "Guardian ward released", ROOMS[room2.wardFor].name + " now answers your local key.", room2.theme);
    run2.loot ??= [];
    rememberLoot(run2, ROOMS[run2.room]);
    for (const actor of [run2.player, run2.partner].filter((p) => p && p.hp > 0)) actor.hp = Math.min(actor.maxHp, actor.hp + (ROOMS[run2.room].boss ? 30 : 12));
    if (ROOMS[run2.room].miniboss) run2.essence += 7;
    run2.essence += ROOMS[run2.room].treasure ?? 0;
    const reward = ROOMS[run2.room].reward;
    if (reward) {
      if (!run2.abilities.includes(reward)) {
        run2.abilities.push(reward);
        rewardBanner(run2, "unlock", ABILITIES[reward].name + " remembered", ABILITIES[reward].desc);
      }
      if (!run2.earnedAbilities.includes(reward)) run2.earnedAbilities.push(reward);
    }
    if (ROOMS[run2.room].seal) {
      run2.seals ??= [];
      if (!run2.seals.includes(ROOMS[run2.room].seal)) run2.seals.push(ROOMS[run2.room].seal);
      run2.essence += 12;
    }
    if (ROOMS[run2.room].finalBoss) {
      run2.phase = "won";
      run2.victory = "demiurge";
      run2.essence += 40;
      run2.karma = clamp(run2.karma + 10, -100, 100);
      run2.awareness = clamp(run2.awareness + 10, 0, 100);
      return;
    }
    if (ROOMS[run2.room].boss) run2.enemies = [];
    run2.phase = "resolve";
    run2.shots = [];
    run2.marks = [];
  }
  function resolveChamber(run2, choice) {
    if (run2.dungeon || run2.rematch || run2.phase !== "resolve" || ![0, 1, 2].includes(choice)) throw new Error("This chamber is not awaiting that choice.");
    if (choice === 0) {
      run2.karma = clamp(run2.karma + 7, -100, 100);
      run2.essence += 3;
      run2.player.hp = Math.min(run2.player.maxHp, run2.player.hp + 10);
      run2.notice = "You free the trapped light. The world keeps a little more possibility.";
    }
    if (choice === 1) {
      run2.karma = clamp(run2.karma - 9, -100, 100);
      run2.essence += 8;
      run2.player.hp = Math.min(run2.player.maxHp, run2.player.hp + 25);
      run2.notice = "You harvest the machinery. Your next life will feel the weight of this choice.";
    }
    if (choice === 2) {
      run2.karma = clamp(run2.karma + 2, -100, 100);
      run2.awareness = clamp(run2.awareness + 7, 0, 100);
      run2.essence += 5;
      run2.notice = "You listen before leaving. A pattern survives as understanding.";
    }
    recordDecision(run2, choice);
    if (ROOMS[run2.room].key && !(run2.keys ?? []).includes(ROOMS[run2.room].key)) run2.notice += " The " + KEYS[ROOMS[run2.room].key].name + " waits on the glowing pedestal.";
    if (run2.partner) {
      const heal = choice === 0 ? 10 : choice === 1 ? 25 : 0;
      run2.partner.hp = Math.min(run2.partner.maxHp, run2.partner.hp + (run2.partner.hp > 0 ? heal : 0));
    }
    const xp = run2.fragments.reduce((sum, f) => sum + f.value, 0);
    run2.xp += xp;
    run2.fragments = [];
    run2.roomResolved.push(run2.room);
    run2.phase = "playing";
    run2.noticeTime = 5;
    if (run2.xp >= run2.nextXp) {
      run2.xp -= run2.nextXp;
      run2.level++;
      run2.nextXp = 6 + run2.level * 4;
      offerBoons(run2);
    } else if (run2.room === "eye" && !run2.eyeAcknowledged) run2.phase = "milestone";
  }
  function resolveMilestone(run2, decision) {
    if (run2.phase !== "milestone" || run2.room !== "eye" || !["continue", "finish"].includes(decision)) throw Error("The Eye is not awaiting that decision.");
    run2.eyeAcknowledged = true;
    run2.phase = decision === "continue" ? "playing" : "won";
    if (decision === "finish") run2.victory = "eye";
    return run2.phase;
  }
  function dashCooldown(run2, form = run2.form) {
    return Math.max(0.48, 1.65 * 0.78 ** run2.boons.dash * Math.max(0.2, 1 - (run2.gear?.dash ?? 0) - skillStats(run2.training, form).dash));
  }
  var validActor = (p) => p && ["x", "y", "hp", "maxHp", "r", "facingX", "facingY", "iframes", "dashTime", "dashX", "dashY", "dashCooldown", "attackClock"].every((k) => Number.isFinite(p[k])) && p.hp >= 0 && p.hp <= p.maxHp && p.maxHp > 0 && p.x >= 0 && p.x <= WIDTH && p.y >= 0 && p.y <= HEIGHT;
  function addPartner(run2, form, replace = false) {
    if (!BODIES[form]) throw Error("Unknown partner form.");
    if (run2.partner && !replace) return;
    run2.partnerBirthForm = form;
    const previous2 = run2.partner, bonus = run2.player.maxHp - BODIES[run2.form].hp - skillStats(run2.training, run2.form).health, maxHp = BODIES[form].hp + bonus + skillStats(run2.training, form).health;
    run2.partnerForm = form;
    run2.partner = { ...structuredClone(run2.player), x: previous2?.x ?? clamp(run2.player.x + 48, 49, WIDTH - 49), y: previous2?.y ?? run2.player.y, hp: previous2 ? maxHp * previous2.hp / previous2.maxHp : maxHp, maxHp, revive: 0 };
    actorStats(run2, true);
    const ability = BODIES[form].ability;
    if (ability && !run2.abilities.includes(ability)) run2.abilities.push(ability);
  }
  function morphRun(run2, form, partner = false) {
    if (!Object.hasOwn(BODIES, form)) throw Error("Unknown vessel.");
    if (run2.phase !== "playing" || !run2.abilities.includes("morph")) throw Error("Find Vessel Resonance in the Mirror Nursery first.");
    const actor = partner ? run2.partner : run2.player, prior = partner ? run2.partnerForm : run2.form;
    if (!actor || actor.hp <= 0) throw Error("Rekindle this spark before changing vessels.");
    if (prior === form) return form;
    if ((actor.morphCooldown ?? 0) > 0) throw Error("Vessel resonance is recovering.");
    const bonus = actor.maxHp - BODIES[prior].hp - skillStats(run2.training, prior).health, fraction = actor.hp / actor.maxHp;
    actor.maxHp = BODIES[form].hp + bonus + skillStats(run2.training, form).health;
    actor.hp = actor.maxHp * fraction;
    actor.morphCooldown = 3;
    actor.dashTime = 0;
    actor.attackClock = Math.max(actor.attackClock, BODIES[form].interval * 0.25);
    if (partner) run2.partnerForm = form;
    else run2.form = form;
    run2.visitedVessels ??= [prior];
    if (!run2.visitedVessels.includes(form)) run2.visitedVessels.push(form);
    if (BODIES[form].ability && !run2.abilities.includes(BODIES[form].ability)) run2.abilities.push(BODIES[form].ability);
    effect(run2, "wave", actor.x, actor.y, BODIES[form].color, 60);
    run2.notice = "The spark inhabits " + FORMS[form].name + ". Health carries across the change.";
    run2.noticeTime = 3;
    return form;
  }
  function pendingKey(run2) {
    if (run2.dungeon || run2.rematch) return null;
    const key = ROOMS[run2.room].key;
    return key && run2.cleared.includes(run2.room) && !(run2.keys ?? []).includes(key) ? { key, ...keyPosition } : null;
  }
  function collectKey(run2) {
    const item = pendingKey(run2);
    if (!item || ![run2.player, run2.partner].some((p) => p && p.hp > 0 && dist(p, item) < 40)) return;
    run2.keys ??= [];
    run2.keys.push(item.key);
    run2.notice = KEYS[item.key].name + " found. It stays on your keyring and opens its marked doors.";
    run2.noticeTime = 7;
    rewardBanner(run2, "key", KEYS[item.key].name + " acquired", KEYS[item.key].place + " \xB7 marked doors now open.", KEYS[item.key].color);
    run2.journal ??= [];
    run2.journal.push({ id: run2.room + ":key", room: run2.room, speaker: "Your keyring", title: KEYS[item.key].name + " acquired", text: "You collected the key from the pedestal. It is carried on your keyring." });
  }
  function pendingRelic(run2) {
    if (run2.dungeon || run2.rematch) return null;
    const relic = ROOMS[run2.room].relic;
    return relic && run2.cleared.includes(run2.room) && !(run2.relics ?? []).includes(relic) ? { relic, x: run2.room === "reliquary" ? 620 : 480, y: run2.room === "reliquary" ? 300 : 215 } : null;
  }
  function relicContact(item) {
    return item?.relic === "ivory-feather" ? 68 : 40;
  }
  function collectRelic(run2) {
    const item = pendingRelic(run2);
    if (!item || ![run2.player, run2.partner].some((p) => p && p.hp > 0 && dist(p, item) <= relicContact(item))) return;
    const relic = ROUTE_RELICS[item.relic];
    run2.relics ??= [];
    run2.relics.push(item.relic);
    run2.notice = relic.name + " found. Opens " + relic.opens + ". Travel back from a checkpoint.";
    run2.noticeTime = 10;
    rewardBanner(run2, "key", relic.name + " acquired", "Opens " + relic.opens + ".", relic.color);
    run2.journal ??= [];
    run2.journal.push({ id: run2.room + ":relic", room: run2.room, speaker: "A road between worlds", title: relic.name, text: run2.notice });
  }
  function pendingSecret(run2) {
    if (run2.dungeon || run2.rematch) return null;
    const secret = ROOMS[run2.room].secret;
    return secret && run2.cleared.includes(run2.room) && !(run2.secrets ?? []).includes(secret) ? { secret, ...EASTER_EGGS[secret], x: 730, y: 300 } : null;
  }
  function discoverSecret(run2, actor, form) {
    const item = pendingSecret(run2);
    if (!item || dist(actor, item) > 65) return false;
    if (form !== item.vessel) {
      run2.notice = item.hint + " Press Q to borrow that vessel.";
      run2.noticeTime = 5;
      return true;
    }
    run2.secrets ??= [];
    run2.secrets.push(item.secret);
    run2.essence += item.essence;
    run2.notice = item.text + " +" + item.essence + " essence.";
    run2.noticeTime = 14;
    rewardBanner(run2, "unlock", item.name, "A hidden memory \xB7 +" + item.essence + " essence. Remembered in your journal.", "#e8c780");
    run2.journal ??= [];
    run2.journal.push({ id: run2.room + ":secret", room: run2.room, speaker: "An impossible little discovery", title: item.name, text: item.text });
    return true;
  }
  function stepActor(run2, p, form, input, dt) {
    const x = Number(input.x ?? 0), y = Number(input.y ?? 0);
    if (!Number.isFinite(x) || !Number.isFinite(y)) throw Error("Movement must be finite.");
    p.gateGrace = Math.max(0, (p.gateGrace ?? 0) - dt);
    if (p.hp <= 0) return;
    const length = Math.hypot(x, y), mx = length > 1 ? x / length : x, my = length > 1 ? y / length : y, body = BODIES[form], skills = skillStats(run2.training, form);
    p.iframes = Math.max(0, p.iframes - dt);
    p.morphCooldown = Math.max(0, (p.morphCooldown ?? 0) - dt);
    p.hurtFlash = Math.max(0, (p.hurtFlash ?? 0) - dt);
    p.powerCooldown = Math.max(0, (p.powerCooldown ?? 0) - dt);
    p.guardTime = Math.max(0, (p.guardTime ?? 0) - dt);
    p.overclockTime = Math.max(0, (p.overclockTime ?? 0) - dt);
    p.dashCooldown = Math.max(0, p.dashCooldown - dt);
    if (input.dash && p.dashCooldown === 0) {
      p.dashTime = 0.16;
      p.iframes = Math.max(p.iframes, 0.27);
      p.dashX = length ? mx : p.facingX;
      p.dashY = length ? my : p.facingY;
      p.dashCooldown = dashCooldown(run2, form);
      actorStats(run2, p === run2.partner).dashes++;
      effect(run2, "wave", p.x, p.y, body.color, 27);
      if (skills.dashStrike) {
        for (const enemy of run2.enemies) if (dist(p, enemy) < 135 + enemy.r) damageEnemy(run2, enemy, skills.dashStrike, form, p === run2.partner);
      }
    }
    if (p.dashTime > 0) {
      move(run2, p, p.dashX * 830 * dt, p.dashY * 830 * dt, run2.abilities.includes("phase"));
      p.dashTime = Math.max(0, p.dashTime - dt);
    } else {
      move(run2, p, mx * body.speed * (1 + (run2.gear?.speed ?? 0) + skills.speed) * dt, my * body.speed * (1 + (run2.gear?.speed ?? 0) + skills.speed) * dt);
      if (length) {
        p.facingX = mx;
        p.facingY = my;
      }
    }
    if (!input.interact) p.gateLatched = false;
    const other = run2.partner ? p === run2.player ? run2.partner : run2.player : null;
    if (other && other.hp <= 0) {
      if (input.interact && dist(p, other) <= REVIVE_RADIUS) {
        other.revive = (other.revive ?? 0) + dt;
        if (other.revive >= REVIVE_SECONDS) {
          other.hp = other.maxHp * 0.4;
          other.iframes = 2;
          other.revive = 0;
          other.downedFor = 0;
          effect(run2, "wave", other.x, other.y, "#dfe5a7", 65);
          run2.notice = "The spark answers. Your partner is rekindled.";
          run2.noticeTime = 4;
        }
      } else other.revive = 0;
    } else if (input.interact && !p.gateLatched) {
      if (discoverSecret(run2, p, form)) {
        p.gateLatched = true;
      } else {
        const gate = nearestGate(run2, p);
        if (gate) {
          const status = gateEntryStatus(run2, gate.direction, p);
          if (status.available) enterGate(run2, gate.direction, p);
          else {
            run2.notice = status.reason;
            run2.noticeTime = 2.5;
          }
        }
      }
    }
    p.surgeCooldown = Math.max(0, (p.surgeCooldown ?? 0) - dt);
    p.attackClock = Math.max(-0.05, p.attackClock - dt);
    const mode = ["auto", "manual", "surge"].includes(input.fireMode) ? input.fireMode : run2.fireMode ?? "auto";
    if (p.attackClock <= 0 && (mode !== "manual" || input.fire)) {
      const previousPlayer = run2.player, previousForm = run2.form;
      run2.player = p;
      run2.form = form;
      attack(run2);
      const interval = attackProfile(run2, form).interval;
      run2.player = previousPlayer;
      run2.form = previousForm;
      p.attackClock = interval / Math.min(3, 1 + run2.boons.cadence * 0.18 + run2.memoryHaste + (run2.gear?.haste ?? 0) + skills.haste) / (p.overclockTime > 0 ? 2 : 1);
    }
    if (mode === "surge" && input.fire && p.surgeCooldown === 0) {
      const target = run2.enemies.filter((e2) => e2.hp > 0).sort((a, b) => dist(p, a) - dist(p, b))[0];
      if (target) {
        const profile = attackProfile(run2, form), angle = Math.atan2(target.y - p.y, target.x - p.x), damage = profile.damage * 0.7 * (1 + run2.boons.edge * 0.24 + run2.memoryEdge + (run2.gear?.damage ?? 0) + skills.damage);
        for (const spread of [-0.2, 0, 0.2]) fire(run2, p.x, p.y, angle + spread, damage, false, 460, Math.max(450, profile.range), profile.style === "homing", { form, partner: p === run2.partner });
        p.surgeCooldown = 4;
        effect(run2, "wave", p.x, p.y, body.color, 35);
      }
    }
  }
  function stepRun(run2, input = {}, dt = 1 / 60) {
    if (run2.phase !== "playing") return;
    run2.roomKills ??= Math.max(0, run2.spawned - run2.enemies.filter((e2) => e2.hp > 0).length);
    run2.roomExtra ??= 0;
    if (!Number.isFinite(dt) || dt <= 0 || dt > 0.05) throw new Error("Simulation steps must be between zero and 0.05 seconds.");
    const x = Number(input.x ?? 0), y = Number(input.y ?? 0);
    if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error("Movement must be finite.");
    if (input.partner && (!Number.isFinite(input.partner.x ?? 0) || !Number.isFinite(input.partner.y ?? 0))) throw Error("Movement must be finite.");
    if (input.morph != null && !Object.hasOwn(BODIES, input.morph) || input.partner?.morph != null && !Object.hasOwn(BODIES, input.partner.morph)) throw Error("Unknown vessel.");
    for (const [action, isPartner] of [[input, false], [input.partner, true]]) if (action?.morph && run2.abilities.includes("morph")) {
      const actor = isPartner ? run2.partner : run2.player;
      if (actor?.hp > 0 && (actor.morphCooldown ?? 0) <= 0) morphRun(run2, action.morph, isPartner);
    }
    for (const [action, isPartner] of [[input, false], [input.partner, true]]) {
      const actor = isPartner ? run2.partner : run2.player;
      if (action?.power && actor?.hp > 0 && (actor.powerCooldown ?? 0) <= 0) useVesselPower(run2, isPartner);
    }
    const p = run2.player;
    if (!ROOMS[run2.room].safe && !run2.cleared.includes(run2.room)) {
      run2.roomPractice ??= { host: {}, partner: {} };
      for (const [role, actor, form] of [["host", p, run2.form], ["partner", run2.partner, run2.partnerForm]]) if (actor?.hp > 0) {
        run2.roomPractice[role] ??= {};
        run2.roomPractice[role][form] = (run2.roomPractice[role][form] ?? 0) + dt;
      }
    }
    run2.time += dt;
    run2.roomTime += dt;
    if (run2.partner) {
      if (run2.player.hp <= 0 && run2.partner.hp <= 0) {
        run2.phase = "dead";
        run2.endReason = "both-fallen";
        run2.notice = "Both sparks have fallen. The body falls. The spark remembers.";
        return;
      }
      for (const actor of [run2.player, run2.partner]) if (actor.hp <= 0) {
        actor.downedFor = Math.max(0, (actor.downedFor ?? 30) - dt);
        if (actor.downedFor === 0) {
          run2.phase = "dead";
          run2.endReason = "rescue-expired";
          run2.notice = "The rekindling window closed. The body falls. The spark remembers.";
          return;
        }
      }
    }
    if (run2.banner) run2.banner.remaining = Math.max(0, run2.banner.remaining - dt);
    run2.noticeTime = Math.max(0, run2.noticeTime - dt);
    run2.damageFlash = Math.max(0, run2.damageFlash - dt);
    stepActor(run2, p, run2.form, input, dt);
    if (run2.partner) stepActor(run2, run2.partner, run2.partnerForm, input.partner ?? {}, dt);
    if (!ROOMS[run2.room].safe && !ROOMS[run2.room].boss && !ROOMS[run2.room].miniboss && !run2.cleared.includes(run2.room) && run2.spawned < run2.spawnTotal && run2.enemies.length < (encounterFor(run2)?.cap ?? 30)) {
      run2.spawnClock -= dt;
      if (run2.spawnClock <= 0) {
        spawnEnemy(run2);
        run2.spawnClock = (encounterFor(run2)?.interval ?? 0.6) + rand(run2) * 0.3;
      }
    }
    collectKey(run2);
    collectRelic(run2);
    if (!run2.cleared.includes(run2.room) && (run2.room === "quiet" || ROOMS[run2.room].hazard === "echo" || run2.dungeon?.condition === "fault")) {
      run2.arrayClock = (run2.arrayClock ?? 8) - dt;
      if (run2.arrayClock <= 0 && run2.marks.length < 30) {
        for (const offset of [-125, 0, 125]) run2.marks.push({ x: clamp(p.x + offset, 75, WIDTH - 75), y: p.y, r: 38, timer: 1.5, life: 1.5, color: "#aaa9e4", damage: 9 });
        run2.arrayClock = 8;
        run2.notice = run2.room === "quiet" ? "The array is listening. Step outside the violet echo circles." : run2.dungeon ? "Fault weather \xB7 leave the marked ground." : "Echo weather \xB7 leave the warning circles.";
        run2.noticeTime = 3;
      }
    }
    const living = [run2.player, run2.partner].filter((a) => a && a.hp > 0);
    const orbitCount = run2.boons.orbit;
    for (const enemy of run2.enemies) {
      if (enemy.hp <= 0) continue;
      enemy.flash = Math.max(0, enemy.flash - dt);
      enemy.orbitHit = Math.max(0, enemy.orbitHit - dt);
      const target = living.reduce((a, b) => !a || dist(enemy, b) < dist(enemy, a) ? b : a, null) ?? p, d = dist(enemy, target), dx = (target.x - enemy.x) / (d || 1), dy = (target.y - enemy.y) / (d || 1);
      run2.shotRole = enemy.kind;
      const kind = COMBAT_ROLES[enemy.kind] ?? enemy.kind;
      enemy.rootTime = Math.max(0, (enemy.rootTime ?? 0) - dt);
      if (enemy.rootTime > 0) {
      } else if (WORLD_GUARDIANS[enemy.kind]) stepGuardian(run2, enemy, target, dt);
      else if (["cantor", "sentinel", "warden"].includes(kind)) stepFirstGuardian(run2, enemy, target, dt);
      else if (kind === "collector") {
        move(run2, enemy, dx * enemy.speed * dt, dy * enemy.speed * dt);
        if (d < target.r + enemy.r + 3) hurt(run2, 10, target);
      } else if (kind === "hound") {
        enemy.attack -= dt;
        if (enemy.windup > 0) {
          enemy.windup -= dt;
          if (enemy.windup <= 0) enemy.charge = 0.34;
        } else if (enemy.charge > 0) {
          move(run2, enemy, enemy.chargeX * 480 * dt, enemy.chargeY * 480 * dt, true);
          enemy.charge = Math.max(0, enemy.charge - dt);
        } else if (enemy.attack <= 0) {
          enemy.windup = 0.65;
          enemy.chargeX = dx;
          enemy.chargeY = dy;
          enemy.attack = 2.8;
        } else move(run2, enemy, dx * enemy.speed * dt, dy * enemy.speed * dt);
        if (d < target.r + enemy.r + 5) hurt(run2, enemy.charge > 0 ? 16 : 9, target);
      } else if (kind === "leech") {
        enemy.attack -= dt;
        if (enemy.windup > 0) {
          enemy.windup -= dt;
          if (enemy.windup <= 0) {
            const tx = target.x - enemy.x, ty = target.y - enemy.y, forward = tx * enemy.chargeX + ty * enemy.chargeY, lateral = Math.abs(tx * enemy.chargeY - ty * enemy.chargeX);
            if (forward > 0 && forward < 230 && lateral < 28) hurt(run2, 12, target);
            effect(run2, "wave", enemy.x, enemy.y, "#91d7d3", 45);
            enemy.attack = 3;
          }
        } else if (enemy.attack <= 0 && d < 230) {
          enemy.windup = 0.85;
          enemy.chargeX = dx;
          enemy.chargeY = dy;
        } else {
          const sign = d > 180 ? 1 : -0.3;
          move(run2, enemy, dx * enemy.speed * sign * dt, dy * enemy.speed * sign * dt, true);
        }
      } else if (kind === "moth") {
        if (enemy.windup > 0) {
          enemy.windup -= dt;
          if (enemy.windup <= 0) {
            enemy.hp = 0;
            run2.kills++;
            run2.roomKills = (run2.roomKills ?? 0) + 1;
            run2.fragments.push({ id: randomId(run2), x: enemy.x, y: enemy.y, value: 2, r: 5 });
            effect(run2, "burst", enemy.x, enemy.y, "#ecb877", 40);
          }
        } else if (d < 85) {
          enemy.windup = 1.15;
          run2.marks.push({ x: enemy.x, y: enemy.y, r: 72, timer: 1.15, life: 1.15, color: "#edb66c", damage: 17, sourceId: enemy.id });
        } else move(run2, enemy, dx * enemy.speed * dt, dy * enemy.speed * dt);
      } else if (kind === "archon") {
        const sign = d < 145 ? -0.25 : d > 245 ? 1 : 0;
        move(run2, enemy, dx * enemy.speed * sign * dt, dy * enemy.speed * sign * dt, true);
        enemy.attack -= dt;
        if (enemy.windup > 0) {
          enemy.windup -= dt;
          if (enemy.windup <= 0) {
            for (const spread of run2.dungeon || run2.swarmPact ? [-0.2, 0, 0.2] : [0]) fire(run2, enemy.x, enemy.y, Math.atan2(enemy.chargeY, enemy.chargeX) + spread, run2.room === "machine" ? 8 : 10, true, run2.room === "machine" ? 155 : 185, 800);
            enemy.attack = run2.room === "machine" ? 3.2 : 2.6;
          }
        } else if (enemy.attack <= 0) {
          enemy.windup = 0.75;
          enemy.chargeX = dx;
          enemy.chargeY = dy;
        }
        if (d < target.r + enemy.r) hurt(run2, 6, target);
      } else if (kind === "spore" || kind === "oracle") {
        const sign = d < 185 ? -0.4 : d > 320 ? 1 : 0;
        move(run2, enemy, dx * enemy.speed * sign * dt, dy * enemy.speed * sign * dt, true);
        enemy.attack -= dt;
        if (enemy.attack <= 0) {
          if (kind === "spore") {
            run2.marks.push({ x: target.x, y: target.y, r: 52, timer: 1.15, life: 1.15, color: "#b9c989", damage: 15 });
            enemy.attack = 3.1;
          } else {
            if (run2.enemies.length < 32) {
              spawnEnemy(run2, "collector", false);
              spawnEnemy(run2, "collector", false);
            }
            effect(run2, "wave", enemy.x, enemy.y, "#e2d1ac", 55);
            enemy.attack = 5.3;
          }
        }
        if (d < target.r + enemy.r) hurt(run2, 8, target);
      } else {
        const sign = d < 165 ? -0.4 : d > 260 ? 1 : 0;
        move(run2, enemy, dx * enemy.speed * sign * dt, dy * enemy.speed * sign * dt, true);
        enemy.attack -= dt;
        if (enemy.attack <= 0) {
          const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
          for (const spread of kind === "mirror" ? [-0.12, 0.12] : [0]) fire(run2, enemy.x, enemy.y, angle + spread, 10, true, 190, 750);
          enemy.attack = 2.3;
        }
        if (kind === "mirror") enemy.shield = run2.time % 3.8 < 1.4 ? 1 : 0;
        if (d < target.r + enemy.r) hurt(run2, 9, target);
      }
      if (orbitCount && enemy.orbitHit === 0) {
        for (const actor of living) for (let i = 0; i < orbitCount; i++) {
          const angle = run2.time * 2.9 + i * Math.PI * 2 / orbitCount, orb = { x: actor.x + Math.cos(angle) * 68, y: actor.y + Math.sin(angle) * 68 };
          if (dist(enemy, orb) < enemy.r + 16) {
            damageEnemy(run2, enemy, 13 * (1 + run2.boons.edge * 0.15), actor === run2.partner ? run2.partnerForm : run2.form, actor === run2.partner);
            enemy.orbitHit = 0.3;
            break;
          }
        }
      }
    }
    delete run2.shotRole;
    for (const shot of run2.shots) {
      shot.life -= dt;
      if (shot.life <= 0) continue;
      if (shot.homing) {
        let closest = null;
        for (const enemy of run2.enemies) if (enemy.hp > 0 && (!closest || dist(shot, enemy) < dist(shot, closest))) closest = enemy;
        if (closest) {
          const angle = Math.atan2(closest.y - shot.y, closest.x - shot.x), speed = shot.homingSpeed ?? 390;
          shot.vx = shot.vx * 0.88 + Math.cos(angle) * speed * 0.12;
          shot.vy = shot.vy * 0.88 + Math.sin(angle) * speed * 0.12;
        }
      }
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
      if (shot.enemy) {
        for (const actor of living) if (shot.life > 0 && dist(shot, actor) < shot.r + actor.r) {
          hurt(run2, shot.damage, actor);
          shot.life = 0;
        }
      } else for (const enemy of run2.enemies) if (enemy.hp > 0 && dist(shot, enemy) < shot.r + enemy.r) {
        damageEnemy(run2, enemy, shot.damage, shot.sourceForm ?? run2.form, shot.sourcePartner ?? false);
        shot.life = 0;
        break;
      }
    }
    for (const mark of run2.marks) {
      mark.timer -= dt;
      if (mark.timer <= 0 && mark.timer + dt > 0) {
        for (const actor of living) if (dist(actor, mark) < mark.r) hurt(run2, mark.damage ?? 23, actor);
        effect(run2, "wave", mark.x, mark.y, mark.color ?? "#dd8f85", mark.r);
      }
    }
    for (const fragment of run2.fragments) {
      const collector = living.reduce((a, b) => !a || dist(fragment, b) < dist(fragment, a) ? b : a, null) ?? p, d = dist(fragment, collector), magnet = (run2.dungeon || run2.swarmPact ? 155 : 95) + run2.boons.magnet * 75 + (run2.cardModifier === "feather" ? 45 : 0);
      if (d < magnet && d > 1) {
        fragment.x += (collector.x - fragment.x) / d * 350 * (run2.cardModifier === "unbound-conduit" ? 1.15 : 1) * dt;
        fragment.y += (collector.y - fragment.y) / d * 350 * (run2.cardModifier === "unbound-conduit" ? 1.15 : 1) * dt;
      }
      if (d < 23) {
        run2.xp += fragment.value;
        fragment.value = 0;
      }
    }
    for (const fx of run2.effects) fx.life -= dt;
    run2.enemies = run2.enemies.filter((e2) => e2.hp > 0);
    run2.shots = run2.shots.filter((s) => s.life > 0 && s.x > -30 && s.x < WIDTH + 30 && s.y > -30 && s.y < HEIGHT + 30);
    run2.fragments = run2.fragments.filter((f) => f.value > 0);
    run2.effects = run2.effects.filter((f) => f.life > 0);
    run2.marks = run2.marks.filter((m) => m.timer > 0);
    if (run2.phase === "playing") for (const actor of living.filter((a) => a.hp > 0)) {
      const form = actor === run2.partner ? run2.partnerForm : run2.form;
      actor.hp = Math.min(actor.maxHp, actor.hp + dt * (run2.boons.regeneration + (run2.gear?.regen ?? 0) + skillStats(run2.training, form).regen + (form === "tree" ? 0.4 : 0)));
    }
    if (run2.phase !== "playing" || run2.partner && [run2.player, run2.partner].some((a) => a.hp <= 0)) return;
    if (ROOMS[run2.room].miniboss && run2.spawned >= 1 && !run2.enemies.some((e2) => ["cantor", "sentinel"].includes(e2.kind))) {
      clearRoom(run2);
      return;
    }
    if (ROOMS[run2.room].boss && run2.spawned >= 1 && !run2.enemies.some((e2) => e2.kind === (ROOMS[run2.room].guardian ?? "warden"))) {
      clearRoom(run2);
      return;
    }
    if (run2.xp >= run2.nextXp && (ROOMS[run2.room].safe || run2.cleared.includes(run2.room)) && !run2.dungeon && !run2.rematch && !ROOMS[run2.room].boss && !ROOMS[run2.room].miniboss) {
      run2.xp -= run2.nextXp;
      run2.level++;
      run2.nextXp = 6 + run2.level * 4;
      offerBoons(run2);
      return;
    }
    if (!ROOMS[run2.room].safe && !run2.cleared.includes(run2.room) && run2.spawned >= run2.spawnTotal && run2.enemies.length === 0) clearRoom(run2);
  }
  function settleRun(run2, meta2, guest = false) {
    if (run2.dungeon || run2.rematch) throw Error("Dungeon and rematch records are separate from campaign progress.");
    if (!["dead", "won"].includes(run2.phase) || run2.settled) throw new Error("This run cannot be recorded twice or before it ends.");
    const record = runRecord(run2, ROOMS, EQUIPMENT, guest);
    let next = prepareEquipment(meta2);
    if (run2.daily) {
      next = rememberRecord(next, record);
      run2.settled = true;
      return next;
    }
    next = bankMastery(next, guest ? run2.partnerMasteryEarned : run2.masteryEarned);
    next = rememberRecord(next, record);
    for (const id of run2.loot ?? []) if (EQUIPMENT[id] && !(id in next.inventory)) next.inventory[id] = 0;
    next.explored = [.../* @__PURE__ */ new Set([...next.explored ?? [], ...run2.discovered])];
    next.keys = [.../* @__PURE__ */ new Set([...next.keys ?? [], ...run2.keys ?? []])];
    next.seals = [.../* @__PURE__ */ new Set([...next.seals ?? [], ...run2.seals ?? []])];
    next.relics = [.../* @__PURE__ */ new Set([...next.relics ?? [], ...run2.relics ?? []])];
    next.secrets = [.../* @__PURE__ */ new Set([...next.secrets ?? [], ...run2.secrets ?? []])];
    if (run2.loadout) next.loadout = prepareEquipment({ ...next, loadout: run2.loadout }).loadout;
    next.runs++;
    next.wins += run2.phase === "won" ? 1 : 0;
    next.karma = run2.karma;
    next.awareness = run2.awareness;
    next.essence += earnedEssence(run2, meta2);
    next.bestRooms = Math.max(next.bestRooms, record.chambers);
    next.abilities = [.../* @__PURE__ */ new Set([...next.abilities, ...run2.earnedAbilities])];
    for (const form of run2.visitedVessels ?? [run2.form]) if (!next.visited.includes(form)) next.visited.push(form);
    next.echoes.unshift({ form: record.form, rooms: record.chambers, kills: run2.kills, won: run2.phase === "won", karma: run2.karma, seconds: Math.round(run2.time) });
    next.echoes = next.echoes.slice(0, 20);
    next.journal = [...run2.journal ?? [], ...next.journal ?? []].filter((v, i, a) => a.findIndex((x) => x.id === v.id) === i).slice(0, 400);
    next.seenEnemies = [.../* @__PURE__ */ new Set([...next.seenEnemies ?? [], ...run2.seenEnemies ?? []])];
    run2.settled = true;
    return next;
  }
  function earnedEssence(run2, meta2) {
    return run2.daily ? 0 : Math.max(run2.essence + Math.floor(run2.kills / 8), meta2.runs === 0 && run2.kills > 0 ? 4 : 0);
  }
  var MEMORY_GIFTS = { heart: { name: "A stronger vessel", desc: "+12 health in every new life", baseCost: 4 }, edge: { name: "A remembered edge", desc: "+7% damage in every new life", baseCost: 6 }, haste: { name: "A quicker thought", desc: "+2.5% attack speed in every new life", baseCost: 4 } };
  function memoryCost(meta2, id) {
    if (!MEMORY_GIFTS[id]) return Infinity;
    return MEMORY_GIFTS[id].baseCost + meta2.gifts[id] * 3;
  }
  function buyMemory(meta2, id) {
    if (!MEMORY_GIFTS[id] || meta2.gifts[id] >= 8 || meta2.essence < memoryCost(meta2, id)) throw new Error("This memory is not available.");
    const next = structuredClone(meta2);
    next.essence -= memoryCost(meta2, id);
    next.gifts[id]++;
    return next;
  }
  function observeRun(run2, meta2) {
    return { fireMode: run2?.fireMode ?? "auto", swarmPact: !!run2?.swarmPact, surgeCooldown: run2?.player.surgeCooldown ?? 0, swarm: run2 ? swarmProgress(run2) : null, relics: run2?.relics ?? meta2.relics ?? [], secrets: run2?.secrets ?? meta2.secrets ?? [], relicPickup: run2 ? pendingRelic(run2) : null, secret: run2 ? pendingSecret(run2) : null, training: run2?.training ?? prepareTraining(meta2.training), masteryEarned: run2?.masteryEarned ?? {}, partnerMasteryEarned: run2?.partnerMasteryEarned ?? {}, stats: run2?.stats ?? null, daily: run2?.daily ?? null, ending: run2 && ["milestone", "won"].includes(run2.phase) ? endingFor(run2) : null, lastRun: meta2.lastRun ?? null, bestRun: meta2.bestRun ?? null, time: run2?.time ?? 0, pauseReason: run2 && run2.phase !== "playing" ? { boon: "Choose a waiting gift.", resolve: "Resolve this cleared chamber.", milestone: "Choose your next journey." }[run2.phase] ?? run2.phase : null, banner: run2?.banner ?? null, bossDefeated: run2?.bossDefeated ?? null, phase: run2?.phase ?? "between", form: run2?.form ?? null, room: run2?.room ?? null, player: run2 ? { x: run2.player.x, y: run2.player.y, hp: run2.player.hp, maxHp: run2.player.maxHp, dashReady: run2.player.dashCooldown === 0 } : null, enemies: run2 ? run2.enemies.map((e2) => ({ id: e2.id, kind: e2.kind, x: e2.x, y: e2.y, hp: e2.hp })) : [], fragments: run2 ? run2.fragments.map((f) => ({ x: f.x, y: f.y, value: f.value })) : [], level: run2?.level ?? 0, boons: run2?.boons ?? {}, choices: run2?.choices ?? [], karma: run2?.karma ?? meta2.karma, abilities: run2?.abilities ?? meta2.abilities, cleared: run2?.cleared ?? [], exits: run2 ? Object.keys(ROOMS[run2.room].exits).map((dir) => ({ direction: dir, ...exitPosition(dir), ...gateStatus(run2, dir) })) : [], offeredForms: offeredForms(meta2), essence: meta2.essence + (run2 && !run2.settled ? run2.essence : 0), bankedEssence: meta2.essence, keys: run2?.keys ?? meta2.keys ?? [], keyPickup: run2 ? pendingKey(run2) : null, morphAvailable: !!run2?.abilities.includes("morph"), morphCooldown: run2?.player.morphCooldown ?? 0, partnerForm: run2?.partnerForm ?? null, world: worldOf(run2?.room ?? "threshold"), worlds: WORLD_ORDER.map((id) => ({ id, name: WORLDS[id].name, unlocked: worldUnlocked(id, run2?.seals ?? meta2.seals ?? []) })), seals: run2?.seals ?? meta2.seals ?? [], power: run2 ? { ...powerProfile(run2), cooldownRemaining: run2.player.powerCooldown ?? 0 } : null, checkpoint: checkpointAvailable(run2), weapon: run2 ? attackProfile(run2) : null, openedDoors: run2?.openDoors ?? [], equipment: run2?.loadout ?? prepareEquipment(meta2).loadout, loot: run2?.loot ?? [] };
  }
  function validMeta(meta2) {
    return !!meta2 && (meta2.relics === void 0 || validRelics(meta2.relics)) && (meta2.secrets === void 0 || validSecrets(meta2.secrets)) && (meta2.training === void 0 || validTraining(meta2.training)) && validEquipment(meta2) && (meta2.seals === void 0 || validSeals(meta2.seals)) && (meta2.keys === void 0 || validKeys(meta2.keys)) && (meta2.explored === void 0 || Array.isArray(meta2.explored) && meta2.explored.length <= Object.keys(ROOMS).length && meta2.explored.every((room2) => ROOMS[room2])) && meta2.version === 2 && ["karma", "awareness", "essence", "runs", "wins", "bestRooms"].every((k) => Number.isFinite(meta2[k])) && meta2.karma >= -100 && meta2.karma <= 100 && meta2.awareness >= 0 && meta2.awareness <= 100 && meta2.essence >= 0 && meta2.runs >= 0 && Array.isArray(meta2.abilities) && meta2.abilities.every((a) => ABILITIES[a]) && meta2.gifts && Object.keys(MEMORY_GIFTS).every((k) => Number.isInteger(meta2.gifts[k]) && meta2.gifts[k] >= 0 && meta2.gifts[k] <= 8) && Array.isArray(meta2.echoes) && Array.isArray(meta2.visited) && meta2.visited.every((f) => BODIES[f]);
  }
  function validRun(run2) {
    if (!run2 || run2.dungeon !== void 0 || run2.rematch !== void 0 || run2.version !== 2 || !BODIES[run2.form] || !ROOMS[run2.room] || !["playing", "boon", "resolve", "milestone", "dead", "won"].includes(run2.phase)) return false;
    if (run2.phase === "milestone" && (run2.room !== "eye" || !run2.cleared?.includes("eye"))) return false;
    if (run2.fireMode !== void 0 && !["auto", "manual", "surge"].includes(run2.fireMode) || run2.swarmPact !== void 0 && typeof run2.swarmPact !== "boolean" || run2.cardModifier != null && !["feather", "unbound-conduit"].includes(run2.cardModifier)) return false;
    if (run2.training !== void 0 && !validTraining(run2.training)) return false;
    if ([run2.masteryEarned, run2.partnerMasteryEarned].some((value) => value !== void 0 && !validEarned(value))) return false;
    if (run2.daily !== void 0 && !validDaily(run2.daily)) return false;
    if (run2.victory !== void 0 && !["eye", "demiurge"].includes(run2.victory)) return false;
    if (run2.stats !== void 0 && (!run2.stats || [run2.stats, run2.stats.partner].filter(Boolean).some((stats) => !["damageDealt", "damageTaken", "powers", "dashes"].every((key) => Number.isFinite(stats[key]) && stats[key] >= 0 && stats[key] <= 1e9)))) return false;
    if (run2.roomPractice !== void 0 && (!run2.roomPractice || ["host", "partner"].some((role) => !run2.roomPractice[role] || Object.entries(run2.roomPractice[role]).some(([form, time]) => !BODIES[form] || !Number.isFinite(time) || time < 0 || time > 1e5)))) return false;
    if (!["time", "roomTime", "rng", "serial", "spawnClock", "spawned", "spawnTotal", "level", "xp", "nextXp", "kills", "karma", "awareness", "essence", "memoryEdge", "memoryHaste"].every((k) => Number.isFinite(run2[k]))) return false;
    if (run2.time < 0 || run2.level < 1 || run2.nextXp <= 0 || run2.karma < -100 || run2.karma > 100 || run2.awareness < 0 || run2.awareness > 100) return false;
    if (!run2.player || !["x", "y", "hp", "maxHp", "r", "facingX", "facingY", "iframes", "dashTime", "dashX", "dashY", "dashCooldown", "attackClock"].every((k) => Number.isFinite(run2.player[k]))) return false;
    if (run2.player.hp < 0 || run2.player.hp > run2.player.maxHp || run2.player.maxHp <= 0 || run2.player.x < 0 || run2.player.x > WIDTH || run2.player.y < 0 || run2.player.y > HEIGHT) return false;
    if (!["enemies", "shots", "fragments", "effects", "marks", "cleared", "discovered", "abilities", "earnedAbilities", "roomResolved", "choices"].every((k) => Array.isArray(run2[k]))) return false;
    if (run2.enemies.length > 128 || run2.shots.length > 360 || run2.fragments.length > 1e3 || run2.effects.length > 160 || run2.marks.length > 50) return false;
    if (!run2.enemies.every((e2) => ENEMY_KINDS.includes(e2.kind) && ["x", "y", "hp", "maxHp", "r", "speed", "attack", "orbitHit", "flash"].every((k) => Number.isFinite(e2[k])))) return false;
    if (!run2.shots.every((s) => ["x", "y", "vx", "vy", "damage", "r", "life"].every((k) => Number.isFinite(s[k]))) || !run2.fragments.every((f) => ["x", "y", "value", "r"].every((k) => Number.isFinite(f[k])))) return false;
    if (run2.shots.some((shot) => shot.sourceForm !== void 0 && !Object.hasOwn(BODIES, shot.sourceForm) || shot.sourcePartner !== void 0 && typeof shot.sourcePartner !== "boolean" || shot.homingSpeed !== void 0 && (!Number.isFinite(shot.homingSpeed) || shot.homingSpeed < 100 || shot.homingSpeed > 1e3))) return false;
    if (run2.gear && (!Object.entries(run2.gear).every(([key, n]) => ["health", "damage", "range", "speed", "melee", "haste", "dash", "armor", "regen"].includes(key) && Number.isFinite(n) && n >= 0 && n <= (key === "health" ? 100 : ["armor", "dash"].includes(key) ? 0.9 : 2)) || !validEquipment({ inventory: Object.fromEntries(Object.values(run2.loadout ?? {}).filter(Boolean).map((id) => [id, 0])), loadout: run2.loadout }))) return false;
    if (run2.loot && (!Array.isArray(run2.loot) || !run2.loot.every((id) => EQUIPMENT[id]))) return false;
    if (run2.seals !== void 0 && !validSeals(run2.seals)) return false;
    if (run2.equipmentLevels !== void 0 && !validEquipment({ inventory: run2.equipmentLevels, loadout: run2.loadout })) return false;
    if ([run2.player, run2.partner].filter(Boolean).some((actor) => ["powerCooldown", "guardTime", "overclockTime", "surgeCooldown"].some((key) => actor[key] !== void 0 && (!Number.isFinite(actor[key]) || actor[key] < 0 || actor[key] > (key === "powerCooldown" ? 12 : key === "surgeCooldown" ? 4 : 6))))) return false;
    if (run2.enemies.some((enemy) => enemy.rootTime !== void 0 && (!Number.isFinite(enemy.rootTime) || enemy.rootTime < 0 || enemy.rootTime > 3.5))) return false;
    if (run2.relics !== void 0 && !validRelics(run2.relics) || run2.secrets !== void 0 && !validSecrets(run2.secrets)) return false;
    if (["roomKills", "roomExtra"].some((k) => run2[k] !== void 0 && (!Number.isSafeInteger(run2[k]) || run2[k] < 0 || run2[k] > 1e5))) return false;
    if (run2.keys !== void 0 && !validKeys(run2.keys)) return false;
    if (run2.openDoors !== void 0 && (!Array.isArray(run2.openDoors) || run2.openDoors.length > Object.keys(ROOMS).length * 4 || !run2.openDoors.every((id) => typeof id === "string" && id.split(":").length === 2 && id.split(":").every((room2) => ROOMS[room2])))) return false;
    if (run2.visitedVessels !== void 0 && (!Array.isArray(run2.visitedVessels) || run2.visitedVessels.length > 6 || !run2.visitedVessels.every((form) => BODIES[form]))) return false;
    if ([run2.player, run2.partner].filter(Boolean).some((actor) => actor.morphCooldown !== void 0 && (!Number.isFinite(actor.morphCooldown) || actor.morphCooldown < 0 || actor.morphCooldown > 3))) return false;
    if (run2.fallSerial !== void 0 && (!Number.isSafeInteger(run2.fallSerial) || run2.fallSerial < 0 || run2.fallSerial > 1e6)) return false;
    if ([run2.player, run2.partner].filter(Boolean).some((a) => ["downedFor", "gateGrace"].some((k) => a[k] !== void 0 && (!Number.isFinite(a[k]) || a[k] < 0 || a[k] > (k === "downedFor" ? 30 : 0.75))))) return false;
    if (run2.passageRecoveries !== void 0 && (!Array.isArray(run2.passageRecoveries) || run2.passageRecoveries.length > 126 || !run2.passageRecoveries.every((id) => ROOMS[id]))) return false;
    if (run2.partner && (!BODIES[run2.partnerForm] || !validActor(run2.partner))) return false;
    return run2.abilities.every((a) => ABILITIES[a]) && run2.earnedAbilities.every((a) => ABILITIES[a]) && run2.cleared.every((r) => ROOMS[r]) && run2.discovered.every((r) => ROOMS[r]) && run2.choices.every((b) => BOONS[b]) && run2.boons && Object.keys(BOONS).every((k) => Number.isFinite(run2.boons[k]) && run2.boons[k] >= 0);
  }

  // boss-rematch.js?v=0.13.0
  function rematchBosses(meta2, run2) {
    const encountered = /* @__PURE__ */ new Set([...meta2.explored ?? [], ...run2?.discovered ?? []]);
    return Object.entries(ROOMS).filter(([id, room2]) => (room2.boss || room2.miniboss) && (encountered.has(id) || (meta2.seals ?? []).includes(room2.seal) || (run2?.seals ?? []).includes(room2.seal))).map(([id, room2]) => ({ id, name: WORLD_GUARDIANS[room2.guardian]?.name ?? (room2.guardian === "sentinel" ? "The Crown Sentinel" : room2.miniboss ? "The Cantor" : "The Warden"), world: room2.world }));
  }
  function createBossRematch(meta2, source, room2) {
    if (!rematchBosses(meta2, source).some((b) => b.id === room2)) throw Error("Encounter that guardian in the campaign first.");
    const rank = WORLDS[ROOMS[room2].world].rank, run2 = createRun(createMeta(), "spark", source?.seed ?? 7919);
    run2.abilities = ["phase", "root", "fracture", "morph"];
    if (source?.form && source.form !== "spark") morphRun(run2, source.form);
    run2.boons = { edge: 2 + rank * 2, cadence: 1 + rank, orbit: 1, shell: 2 + rank, regeneration: 1, magnet: 0, dash: 1 };
    run2.level = 6 + rank * 4;
    run2.nextXp = 6 + run2.level * 4;
    run2.player.maxHp += run2.boons.shell * 25;
    const health = ROOMS[room2].guardian ? WORLD_GUARDIANS[ROOMS[room2].guardian]?.hp ?? 4e3 : ROOMS[room2].miniboss ? 4e3 : 4800;
    run2.rematch = { room: room2, cleared: false, build: "practice", level: run2.level, health: health * (rank ? 1.3 + rank * 0.1 : 1), damage: 1.25 };
    beginBossRematch(run2, room2);
    run2.notice = "Guardian echo \xB7 Fixed LV " + run2.level + " practice build. Your vessel keeps its native weapon; permanent upgrades and campaign equipment stay in your journey. Rematches grant no campaign rewards.";
    run2.noticeTime = 12;
    return run2;
  }

  // progress.js?v=0.13.0
  var ProgressSave = class {
    constructor({ fetch: transport = globalThis.window?.fetch?.bind(globalThis.window), storage = globalThis.localStorage, onStatus = () => {
    }, credentialKey = "spark-substrate-save-credential" } = {}) {
      this.credentialKey = credentialKey;
      this.fetch = transport;
      this.storage = storage;
      this.onStatus = onStatus;
      this.status = "device";
      this.ready = false;
      this.revision = 0;
      this.latest = null;
      this.generation = 0;
      this.timer = null;
      this.writing = false;
      this.credential = null;
    }
    setStatus(status) {
      if (this.disposed) return;
      this.status = status;
      this.onStatus(status);
    }
    dispose() {
      this.disposed = true;
      this.ready = false;
      this.generation++;
      if (this.timer) clearTimeout(this.timer);
      this.timer = null;
    }
    async request(path2, options = {}) {
      const response2 = await this.fetch("/api/progress" + path2, { ...options, headers: { "content-type": "application/json", ...this.credential ? { authorization: "Bearer " + this.credential.token } : {}, ...options.headers } });
      const data = await response2.json();
      if (!response2.ok) {
        const error = Error(data.error ?? "Your save is waiting for a connection.");
        error.status = response2.status;
        throw error;
      }
      return data;
    }
    async open(state) {
      this.latest = JSON.stringify(state);
      if (!this.fetch) return null;
      const initial = this.latest, generation = this.generation;
      this.setStatus("connecting");
      try {
        try {
          const credential = JSON.parse(this.storage?.getItem(this.credentialKey) ?? "null");
          if (credential && /^[a-f0-9-]{36}$/.test(credential.id) && typeof credential.token === "string") this.credential = credential;
        } catch {
        }
        const saved = this.credential ? await this.request("/" + this.credential.id) : await this.request("", { method: "POST", body: JSON.stringify({ state }) });
        if (this.disposed) return null;
        if (!this.credential) {
          this.credential = { id: saved.id, token: saved.token };
          try {
            this.storage?.setItem(this.credentialKey, JSON.stringify(this.credential));
          } catch {
          }
        }
        this.revision = saved.revision;
        this.ready = true;
        if (this.generation !== generation && JSON.stringify(saved.state) !== initial) {
          this.setStatus("conflict");
          return null;
        }
        if (this.generation === generation) {
          this.latest = JSON.stringify(saved.state);
          this.setStatus("saved");
          return saved.state;
        }
        this.setStatus("pending");
        void this.flush();
        return null;
      } catch {
        this.setStatus("error");
        return null;
      }
    }
    queue(state) {
      if (this.disposed) return;
      const latest = JSON.stringify(state);
      if (latest === this.latest) return;
      this.latest = latest;
      this.generation++;
      if (!this.ready || this.status === "conflict" || !this.fetch) return;
      this.setStatus("pending");
      if (!this.timer) this.timer = setTimeout(() => {
        this.timer = null;
        void this.flush();
      }, 4e3);
    }
    async flush() {
      if (this.disposed || !this.ready || this.writing || this.status === "conflict" || !this.fetch || !this.latest) return;
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      const sent = this.latest;
      this.writing = true;
      try {
        const saved = await this.request("/" + this.credential.id, { method: "PUT", body: JSON.stringify({ revision: this.revision, state: JSON.parse(sent) }) });
        if (this.disposed) return;
        this.revision = saved.revision;
        this.setStatus(this.latest === sent ? "saved" : "pending");
      } catch (error) {
        this.setStatus(error.status === 409 ? "conflict" : "error");
      } finally {
        this.writing = false;
        if (!this.disposed && (this.latest !== sent || this.status === "error") && this.status !== "conflict") this.queueRetry();
      }
    }
    queueRetry() {
      if (!this.timer) this.timer = setTimeout(() => {
        this.timer = null;
        void this.flush();
      }, 4e3);
    }
  };

  // coop-state.js?v=0.13.0
  function cleanPlayerName(value, fallback = "") {
    if (typeof value !== "string") return fallback;
    const name = Array.from(value.normalize("NFKC").replace(/[<>\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u206f]/g, "").replace(/\s+/g, " ").trim()).slice(0, 24).join("");
    return name || fallback;
  }
  function coopChoiceContext(run2) {
    if (!run2 || !["boon", "resolve"].includes(run2.phase)) return null;
    return [run2.seed, run2.room, run2.phase, run2.level, (run2.choices ?? []).join(","), (run2.roomResolved ?? []).length].join(":");
  }
  function currentCoopVote(run2, crew) {
    const vote = crew?.vote;
    return vote && vote.context === coopChoiceContext(run2) && Number.isInteger(vote.index) && vote.index >= 0 && vote.index < 3 ? vote : null;
  }

  // online.js?v=0.13.0
  var OnlineRoom = class {
    constructor(onUpdate, onError, options = {}) {
      this.fetcher = options.fetch ?? globalThis.fetch?.bind(globalThis);
      this.storage = options.storage;
      this.now = options.now ?? Date.now;
      this.onUpdate = onUpdate;
      this.onError = onError;
      this.session = null;
      this.seq = 0;
      this.timer = null;
      this.busy = false;
      this.source = null;
      this.displayName = cleanPlayerName(options.name);
      this.inputDirty = false;
      this.urgent = false;
      this.history = new GuestInputHistory();
      this.fastBusy = 0;
      this.fastAt = 0;
      this.pending = this.neutral();
      this.inputAt = 0;
      this.inputGeneration = 0;
      this.errors = 0;
      this.lastSuccess = 0;
      this.lastAttempt = 0;
      this.latency = 0;
      this.inFlight = null;
    }
    neutral() {
      return { x: 0, y: 0, fire: false, fireMode: this.pending?.fireMode ?? "auto", dash: false, interact: false, power: false, morph: null, active: false, fallAck: 0 };
    }
    sessionStore() {
      return this.storage ?? globalThis.sessionStorage;
    }
    get role() {
      return this.session?.role;
    }
    get code() {
      return this.session?.code;
    }
    get active() {
      return !!this.session;
    }
    async request(path2, value = {}, authorize = true) {
      const response2 = await this.fetcher("/api/rooms" + path2, { method: "POST", cache: "no-store", headers: { "content-type": "application/json", ...authorize && this.session ? { authorization: "Bearer " + this.session.token } : {} }, body: JSON.stringify(value), signal: AbortSignal.timeout(6e3) });
      let data;
      try {
        data = await response2.json();
      } catch {
        throw Error("The room service did not respond. Try again shortly.");
      }
      if (!response2.ok) {
        const error = Error(data.error ?? "Unable to connect to the room.");
        error.status = response2.status;
        throw error;
      }
      return data;
    }
    remember() {
      try {
        this.sessionStore()?.setItem("spark-online-room-v1", JSON.stringify(this.session));
      } catch {
      }
    }
    async host(run2) {
      const session = await this.request("", { run: run2, name: this.displayName }, false);
      this.session = session;
      this.seq = 0;
      this.remember();
      this.start();
      return session;
    }
    async join(code, form) {
      const session = await this.request("/" + code + "/join", { form, name: this.displayName }, false);
      this.session = session;
      this.seq = 0;
      this.remember();
      this.start();
      return session;
    }
    async resume() {
      let session;
      try {
        session = JSON.parse(this.sessionStore()?.getItem("spark-online-room-v1") ?? "null");
      } catch {
        return false;
      }
      if (!session?.code || !session.token || !["host", "guest"].includes(session.role)) return false;
      this.session = session;
      try {
        const data = await this.request("/" + session.code + "/resume", { name: this.displayName });
        if (this.session !== session) return false;
        if (data.expired) {
          this.session = null;
          try {
            this.sessionStore()?.removeItem("spark-online-room-v1");
          } catch {
          }
          return false;
        }
        this.seq = session.role === "host" ? data.seq : data.inputSeq;
        this.lastSuccess = this.now();
        this.clearInput();
        this.onUpdate(data);
        this.start();
        return true;
      } catch (error) {
        if (this.session !== session) return false;
        this.session = null;
        try {
          this.sessionStore()?.removeItem("spark-online-room-v1");
        } catch {
        }
        if (error.status !== 404) this.onError(error.message);
        return false;
      }
    }
    setSource(source) {
      this.source = source;
    }
    input(input) {
      this.inputAt = this.now();
      const before = JSON.stringify(this.pending);
      this.pending = { x: input.x ?? this.pending.x, y: input.y ?? this.pending.y, fire: input.fire ?? this.pending.fire, fireMode: ["auto", "manual", "surge"].includes(input.fireMode) ? input.fireMode : this.pending.fireMode, dash: this.pending.dash || !!input.dash, interact: input.interact ?? this.pending.interact, power: this.pending.power || !!input.power, morph: input.morph ?? this.pending.morph ?? null, active: input.active ?? true, fallAck: input.fallAck ?? this.pending.fallAck ?? 0 };
      this.inputDirty ||= before !== JSON.stringify(this.pending);
    }
    capture(context) {
      this.history.capture(this.pending, context);
      this.pending = { ...this.pending, dash: false, power: false, morph: null };
    }
    acknowledge(ack) {
      this.history.acknowledge(ack);
    }
    clearInput() {
      this.history.reset(this.history.context);
      this.inputGeneration++;
      const before = JSON.stringify(this.pending);
      this.pending = { ...this.neutral(), fallAck: this.pending.fallAck ?? 0 };
      this.inputDirty ||= before !== JSON.stringify(this.pending);
      this.inputAt = this.now();
    }
    async update(action, value) {
      const session = this.session;
      if (!session) return;
      const data = await this.request("/" + session.code + "/" + action, value);
      if (this.session === session) this.onUpdate(data);
      return data;
    }
    async rename(name) {
      this.displayName = cleanPlayerName(name);
      if (this.active) return this.update("name", { name: this.displayName });
    }
    async vote(context, index) {
      if (this.role !== "guest") throw Error("Only the guest sends an advisory vote.");
      return this.update("vote", { context, index });
    }
    start() {
      this.stop();
      this.timer = setInterval(() => this.sync(), 100);
    }
    stop() {
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
    }
    // The frame loop also pumps the relay. One request at a time prevents a
    // throttled interval or overlapping requests from starving live updates.
    pump() {
      if (!this.session) return;
      const snapshot = this.role === "guest" ? this.source?.()?.run : null, fallen = !!snapshot?.partner && [snapshot.player, snapshot.partner].some((a) => a.hp <= 0);
      if (this.now() - (this.pulseAt ?? 0) >= 300 && (this.role === "host" || fallen || this.busy && this.now() - this.lastAttempt > 600)) void this.pulse();
      if (this.role === "guest" && this.history.started && (this.inputDirty || this.now() - this.fastAt >= 80)) void this.sendInput();
      const changed2 = this.role === "guest" && this.inputDirty;
      if (changed2 && this.busy) {
        this.urgent = true;
        return;
      }
      if (changed2 || this.now() - this.lastAttempt >= 100) void this.sync();
    }
    async pulse() {
      if (!this.session || this.pulseBusy) return;
      const session = this.session;
      this.pulseBusy = true;
      this.pulseAt = this.now();
      try {
        const data = await this.request("/" + session.code + "/pulse");
        if (this.session === session) {
          if (this.role === "guest") {
            this.lastSuccess = this.now();
            this.errors = 0;
          }
          this.onUpdate(data);
        }
      } catch {
      } finally {
        this.pulseBusy = false;
      }
    }
    async sendInput() {
      if (this.role !== "guest" || !this.session || this.fastBusy >= 2) return;
      const session = this.session;
      this.fastBusy++;
      this.fastAt = this.now();
      this.inputDirty = false;
      const payload = { seq: ++this.seq, input: { ...this.pending, stream: this.history.batch() } };
      try {
        const data = await this.request("/" + session.code + "/input", payload);
        if (this.session === session) {
          this.seq = Math.max(this.seq, data.inputSeq ?? 0);
        }
      } catch {
      } finally {
        this.fastBusy--;
      }
    }
    async sync() {
      if (this.busy) return this.inFlight;
      if (!this.session) return;
      const source = this.source?.();
      if (this.role === "host" && !source?.run) return;
      if (this.role === "guest" && this.now() - this.inputAt > 1200) this.clearInput();
      if (this.role === "guest" && this.history.started && (this.pending.morph || this.pending.power || this.pending.dash)) this.capture(this.history.context);
      const session = this.session, sent = this.pending, generation = this.inputGeneration;
      this.pending = { ...sent, dash: false, power: false, morph: null };
      this.inputDirty = false;
      this.urgent = false;
      this.busy = true;
      this.lastAttempt = this.now();
      const payload = this.role === "host" ? { ...source, seq: ++this.seq } : { seq: ++this.seq, input: { ...sent, ...this.history.started ? { stream: this.history.batch() } : {} } };
      this.inFlight = this.request("/" + this.code + "/sync", payload).then((data) => {
        if (this.session !== session) return;
        const acknowledged = this.role === "host" ? data.seq : data.inputSeq;
        if (Number.isSafeInteger(acknowledged)) this.seq = Math.max(this.seq, acknowledged);
        this.errors = 0;
        this.lastSuccess = this.now();
        this.latency = Math.max(0, this.lastSuccess - this.lastAttempt);
        this.onUpdate(data);
      }).catch((error) => {
        if (this.session !== session) return;
        this.errors++;
        if (this.errors === 1 || this.errors % 10 === 0) this.onError(error.message);
        if (this.role === "guest" && generation === this.inputGeneration) {
          this.pending.dash ||= sent.dash;
          this.pending.power ||= sent.power;
          this.pending.morph ??= sent.morph;
        }
      }).finally(() => {
        this.busy = false;
        this.inFlight = null;
        const again = this.urgent && !this.errors && this.session === session;
        this.urgent = false;
        if (again) void this.sync();
      });
      return this.inFlight;
    }
    async leave() {
      const session = this.session;
      this.stop();
      this.clearInput();
      if (session) {
        try {
          await this.request("/" + session.code + "/leave");
        } catch {
        }
      }
      this.session = null;
      try {
        this.sessionStore()?.removeItem("spark-online-room-v1");
      } catch {
      }
      this.seq = 0;
      this.errors = 0;
    }
  };

  // settings.js?v=0.13.0
  var SETTINGS_KEY = "spark-substrate-settings-v1";
  var BINDING_LABELS = { up: "Move up", down: "Move down", left: "Move left", right: "Move right", dash: "Dash", fire: "Fire", power: "Vessel power", interact: "Gate / revive", morph: "Vessels", map: "World map", pause: "Pause" };
  var DEFAULT_BINDINGS = { up: "w", down: "s", left: "a", right: "d", dash: " ", power: "f", fire: "j", interact: "e", morph: "q", map: "m", pause: "escape" };
  var keyLabel = (key) => key === " " ? "Space" : key === "escape" ? "Escape" : key.toUpperCase();
  var eventKey = (event) => event.code === "Space" ? " " : String(event.key ?? "").toLowerCase();
  var goodKey = (key) => typeof key === "string" && (key === " " || key === "escape" || /^[a-z0-9]$/.test(key) && !/[1-6]/.test(key));
  function defaultSettings(reduced = false) {
    return { audio: false, fireMode: "auto", master: 0.7, effects: 0.8, ambient: 0.12, shake: reduced ? 0 : 0.2, flashes: reduced ? 0 : 1, controller: true, damageNumbers: false, guideGift: false, inputProfile: null, reduced, bindings: { ...DEFAULT_BINDINGS } };
  }
  function cleanSettings(raw, reduced = false) {
    const next = defaultSettings(reduced);
    for (const id of ["master", "effects", "ambient", "shake", "flashes"]) if (Number.isFinite(raw?.[id])) next[id] = Math.max(0, Math.min(1, raw[id]));
    for (const id of ["audio", "controller", "damageNumbers", "guideGift"]) if (typeof raw?.[id] === "boolean") next[id] = raw[id];
    if (["pc", "controller", "mobile"].includes(raw?.inputProfile)) next.inputProfile = raw.inputProfile;
    if (["auto", "manual", "surge"].includes(raw?.fireMode)) next.fireMode = raw.fireMode;
    const used = /* @__PURE__ */ new Set();
    for (const action of Object.keys(next.bindings)) {
      const candidate = raw?.bindings?.[action];
      if (goodKey(candidate) && !used.has(candidate)) next.bindings[action] = candidate;
      else if (used.has(next.bindings[action])) {
        const spare = Object.values(DEFAULT_BINDINGS).find((key) => !used.has(key));
        next.bindings[action] = spare;
      }
      used.add(next.bindings[action]);
    }
    return next;
  }
  function changeBinding(settings2, action, key) {
    if (!Object.hasOwn(DEFAULT_BINDINGS, action) || !goodKey(key)) throw Error("Use a letter, 0, 7\u20139, Space, or Escape. Number keys 1\u20136 and arrows stay available for choices and movement.");
    if (Object.entries(settings2.bindings).some(([id, value]) => id !== action && value === key)) throw Error(keyLabel(key) + " is already assigned. Choose another key.");
    const next = structuredClone(settings2);
    next.bindings[action] = key;
    return next;
  }
  function controllerInput(pads, previous2 = []) {
    const pad2 = Array.from(pads ?? []).find((item) => item?.connected && item.mapping === "standard");
    if (!pad2) return { connected: false, buttons: [], x: 0, y: 0 };
    const buttons = pad2.buttons.map((button) => typeof button === "number" ? button > 0.5 : !!button?.pressed || button?.value > 0.5), edge = (index) => buttons[index] && !previous2[index], axis = (value) => Math.abs(value ?? 0) < 0.18 ? 0 : Math.max(-1, Math.min(1, value));
    return { connected: true, name: pad2.id, buttons, x: axis(pad2.axes[0]) + (buttons[15] ? 1 : 0) - (buttons[14] ? 1 : 0), y: axis(pad2.axes[1]) + (buttons[13] ? 1 : 0) - (buttons[12] ? 1 : 0), fire: !!buttons[7], dash: edge(0), power: edge(2), interact: !!buttons[1], morph: edge(3), map: edge(4), pause: edge(9), confirm: edge(0), back: edge(1), next: edge(13) || edge(15), prior: edge(12) || edge(14) };
  }
  var SparkAudio = class {
    constructor(window2, settings2) {
      this.window = window2;
      this.settings = settings2;
      this.context = null;
      this.last = /* @__PURE__ */ new Map();
      this.bed = [];
      this.bedGain = null;
    }
    async enable(value) {
      this.settings.audio = value;
      if (!value) {
        this.ambient();
        return;
      }
      const AudioContext = this.window.AudioContext || this.window.webkitAudioContext;
      if (!AudioContext) {
        this.settings.audio = false;
        throw Error("Audio is unavailable in this browser.");
      }
      this.context ??= new AudioContext();
      await this.context.resume();
      this.ambient();
    }
    ambient() {
      if (!this.context) return;
      const at = this.context.currentTime;
      if (!this.bedGain) {
        this.bedGain = this.context.createGain();
        this.bedGain.gain.value = 0;
        this.bedGain.connect(this.context.destination);
        for (const hz of [55, 82.41]) {
          const osc = this.context.createOscillator();
          osc.type = "sine";
          osc.frequency.value = hz;
          osc.connect(this.bedGain);
          osc.start();
          this.bed.push(osc);
        }
      }
      this.bedGain.gain.setTargetAtTime(this.settings.audio ? this.settings.master * this.settings.ambient * 0.045 : 0, at, 0.18);
    }
    effect(kind, value = 0) {
      if (!this.settings.audio || !this.context || this.context.state === "suspended" || this.settings.master * this.settings.effects === 0) return;
      const at = this.context.currentTime, interval = kind === "hit" ? 0.075 : kind === "kill" ? 0.11 : 0.13;
      if (at - (this.last.get(kind) ?? -10) < interval) return;
      this.last.set(kind, at);
      const tones = { hit: [360, 0.055, "triangle"], kill: [210, 0.09, "triangle"], damage: [75, 0.16, "triangle"], level: [130, 0.3, "sine"], gate: [520, 0.22, "sine"], key: [880, 0.32, "sine"], boss: [330, 0.5, "triangle"], power: [180, 0.2, "triangle"], win: [660, 0.45, "sine"], round: [740, 0.22, "sine"], ko: [220, 0.42, "sine"], swarm: [440, 0.28, "triangle"], chime: [value || 440, 0.13, "sine"] };
      const [hz, duration, type] = tones[kind] ?? tones.chime;
      const gain = this.context.createGain(), osc = this.context.createOscillator();
      gain.gain.setValueAtTime(Math.max(1e-4, this.settings.master * this.settings.effects * 0.075), at);
      gain.gain.exponentialRampToValueAtTime(1e-4, at + duration);
      osc.type = type;
      osc.frequency.setValueAtTime(hz, at);
      osc.frequency.exponentialRampToValueAtTime(kind === "gate" || kind === "win" ? hz * 1.5 : hz * 0.55, at + duration);
      osc.connect(gain);
      gain.connect(this.context.destination);
      osc.start(at);
      osc.stop(at + duration);
      if (kind === "key" || kind === "boss" || kind === "level" || kind === "gate" || kind === "win" || kind === "round" || kind === "ko") for (const [offset, multiple] of [[0.08, 1.25], [0.16, 1.5]]) {
        const note = this.context.createOscillator(), envelope = this.context.createGain();
        note.frequency.value = hz * multiple;
        envelope.gain.setValueAtTime(1e-4, at + offset);
        envelope.gain.exponentialRampToValueAtTime(Math.max(2e-4, this.settings.master * this.settings.effects * 0.025), at + offset + 0.02);
        envelope.gain.exponentialRampToValueAtTime(1e-4, at + offset + 0.2);
        note.connect(envelope);
        envelope.connect(this.context.destination);
        note.start(at + offset);
        note.stop(at + offset + 0.22);
      }
    }
  };

  // share-run.js?v=0.13.0
  async function saveRunCard(record, names, document2, window2) {
    if (!record) throw Error("Finish a life to save a run card.");
    const canvas2 = document2.createElement("canvas");
    canvas2.width = 1080;
    canvas2.height = 1080;
    const ctx2 = canvas2.getContext("2d");
    const gradient = ctx2.createLinearGradient(0, 0, 1080, 1080);
    gradient.addColorStop(0, "#112720");
    gradient.addColorStop(1, "#0c1118");
    ctx2.fillStyle = gradient;
    ctx2.fillRect(0, 0, 1080, 1080);
    ctx2.strokeStyle = "#c9a66b";
    ctx2.lineWidth = 2;
    ctx2.strokeRect(40, 40, 1e3, 1e3);
    const text = (value, x, y2, size = 28, color = "#c4d4ca") => {
      ctx2.font = "500 " + size + "px system-ui, sans-serif";
      ctx2.fillStyle = color;
      ctx2.textAlign = "left";
      ctx2.fillText(value, x, y2);
    };
    const wrap = (value, y2, size = 25) => {
      ctx2.font = "500 " + size + "px system-ui, sans-serif";
      let line = "";
      for (const word of value.split(" ")) {
        const next = line ? line + " " + word : word;
        if (ctx2.measureText(next).width > 880 && line) {
          text(line, 88, y2, size);
          y2 += 38;
          line = word;
        } else line = next;
      }
      if (line) {
        text(line, 88, y2, size);
        y2 += 38;
      }
      return y2;
    };
    text("SPARK / THE SUBSTRATE", 88, 125, 24, "#d9b77d");
    text(record.won ? record.ending : "The spark remembers.", 88, 206, 54, "#f0cd94");
    text((names[record.form]?.name ?? record.form) + " \xB7 LEVEL " + record.level, 88, 259, 27);
    text(record.daily ? "DAILY CURRENT \xB7 " + record.daily.day + " UTC" : "INCARNATION \xB7 KARMA " + record.karma, 88, 301, 22, "#99c6ba");
    const cells = [[record.chambers, "COMBAT CHAMBERS"], [record.kills, "CONSTRUCTS"], [record.damageDealt.toLocaleString(), "DAMAGE DEALT"], [Math.floor(record.seconds / 60) + ":" + String(record.seconds % 60).padStart(2, "0"), "TIME"]];
    cells.forEach(([value, label], i) => {
      const x = 88 + i % 2 * 465, y2 = 410 + Math.floor(i / 2) * 140;
      text(String(value), x, y2, 64, "#e5c78f");
      text(label, x, y2 + 42, 21, "#9ec7b9");
    });
    let y = wrap(record.equipment.join(" \xB7 ") || "Native vessel weapon", 708);
    y = wrap(record.gifts.map((gift) => (names[gift.id]?.name ?? gift.id) + " \xD7" + gift.count).join(" \xB7 ") || "No battle gifts", y + 10, 23);
    text("SEED " + record.seed, 88, 940, 19, "#8bafa3");
    text("spark-substrate.microneesia79.chatgpt.site", 88, 982, 19, "#8bafa3");
    const blob = await new Promise((resolve) => canvas2.toBlob(resolve, "image/png"));
    if (!blob) throw Error("This browser could not create the run image.");
    const url = window2.URL.createObjectURL(blob), link = document2.createElement("a");
    link.href = url;
    link.download = "spark-run-" + (record.daily?.day ?? record.seed) + ".png";
    link.click();
    window2.setTimeout(() => window2.URL.revokeObjectURL(url), 1e3);
  }

  // entry.js?v=0.13.0
  var INPUT_PROFILES = ["pc", "controller", "mobile"];
  var PROFILE_LABELS = { pc: "PC", controller: "Controller", mobile: "Mobile" };
  var PAD = { fire: "RT", dash: "A", power: "X", interact: "B", morph: "Y", map: "LB", pause: "Start" };
  var TOUCH = { fire: "FIRE", dash: "DASH", power: "POWER", interact: "GATE", morph: "MORPH", map: "MAP", pause: "PAUSE" };
  function inputHint(profile, action, bindings = {}) {
    if (profile === "mobile") return "Tap " + TOUCH[action];
    if (profile === "controller") return PAD[action];
    const key = bindings[action] ?? { fire: "j", dash: " ", power: "f", interact: "e", morph: "q", map: "m", pause: "escape" }[action];
    return key === " " ? "Space" : key === "escape" ? "Escape" : String(key).toUpperCase();
  }
  function moveHint(profile, bindings = {}) {
    return profile === "mobile" ? "Drag the stick" : profile === "controller" ? "Left stick / D-pad" : [bindings.up ?? "w", bindings.left ?? "a", bindings.down ?? "s", bindings.right ?? "d"].map((k) => k.toUpperCase()).join(" / ") + " or arrows";
  }
  function profileCopy(profile, bindings = {}) {
    return moveHint(profile, bindings) + " \xB7 " + ["dash", "power", "interact", "morph"].map((action) => inputHint(profile, action, bindings) + " " + { dash: "dash", power: "power", interact: "gate", morph: "vessels" }[action]).join(" \xB7 ") + (profile === "mobile" ? " \xB7 Rotate to landscape." : "");
  }
  function adaptPrompt(text, profile, bindings = {}) {
    return String(text ?? "").replace(/(?:Press|press|hold|Hold) (Space|F|E|Q|M)\b/g, (all, key) => {
      const action = { Space: "dash", F: "power", E: "interact", Q: "morph", M: "map" }[key];
      return /hold/i.test(all) ? profile === "mobile" ? "Hold " + ({ interact: "GATE", power: "POWER" }[action] ?? action) : "Hold " + inputHint(profile, action, bindings) : inputHint(profile, action, bindings);
    });
  }
  function guideUnlocks(meta2, run2, rememberedGift = false) {
    return { intro: true, gift: !!(rememberedGift || meta2.bestRun?.level >= 2 || run2?.level >= 2 || meta2.lastRun?.level >= 2 || Object.values(run2?.boons ?? {}).some(Boolean)), death: meta2.runs > 0, key: (run2?.keys ?? meta2.keys ?? []).length > 0, resonance: (run2?.abilities ?? meta2.abilities ?? []).includes("morph"), seal: (run2?.seals ?? meta2.seals ?? []).length > 0 };
  }
  function hasJourney(meta2, run2) {
    return !!run2 || meta2.runs > 0 || (meta2.keys ?? []).length > 0 || (meta2.seals ?? []).length > 0;
  }

  // dungeon.js?v=0.13.0
  var DUNGEON_KEY = "spark-substrate-endless-v1";
  var DUNGEON_CONDITIONS = {
    steady: { name: "Unbroken current", desc: "A clean chamber. Learn its rhythm." },
    fleet: { name: "Fleet echoes", desc: "Enemies move 12% faster." },
    crowd: { name: "Crowded lattice", desc: "Six extra enemies; two extra active foes." },
    fault: { name: "Fault weather", desc: "Violet circles warn for 1.5s before striking every 8s." },
    wither: { name: "Withering refuge", desc: "Checkpoint recovery is reduced to 60% of its depth-scaled amount." }
  };
  var CHAMBERS = ["glass", "machine", "quiet", "cistern", "tide-sluice", "grove-canopy", "cinder-gears", "night-trail", "orbit-bridge", "archive"];
  var GUARDIANS = ["forge", "eye", "tide-throne", "grove-heart", "cinder-throne", "night-nest", "orbit-throne", "origin-heart"];
  var ARENAS = { glass: "The Shard Stair", machine: "The Buried Circuit", quiet: "The Listening Lattice", cistern: "The Echo Reservoir", "tide-sluice": "The Brine Descent", "grove-canopy": "The Root Spiral", "cinder-gears": "The Turning Furnace", "night-trail": "The Dreamfall", "orbit-bridge": "The Pale Ascent", archive: "The Leafbound Step", forge: "The Cantor\u2019s Rung", eye: "The Warden\u2019s Rung", "tide-throne": "The Drowned Rung", "grove-heart": "The Thorn Rung", "cinder-throne": "The Clockwork Rung", "night-nest": "The Dreamwoven Rung", "orbit-throne": "The Lunar Rung", "origin-heart": "The Maker\u2019s Rung" };
  var dungeonArenaName = (spec) => ARENAS[spec.room] ?? "The Unnumbered Stair";
  var mix = (seed, floor) => Math.imul((seed ^ Math.imul(floor, 2654435761)) >>> 0, 2246822519) >>> 0;
  function dungeonFloor(seed, floor) {
    if (!Number.isInteger(seed) || !Number.isSafeInteger(floor) || floor < 1) throw Error("A dungeon needs a valid seed and floor.");
    const boss = floor % 5 === 0, room2 = boss ? GUARDIANS[(floor / 5 - 1) % GUARDIANS.length] : floor === 1 ? "glass" : floor === 2 ? "machine" : CHAMBERS[mix(seed, floor) % CHAMBERS.length];
    const condition = floor <= 2 ? "steady" : Object.keys(DUNGEON_CONDITIONS)[mix(seed + 17, floor) % 5], n = floor - 1;
    const pressure = { health: 1 + n * 0.11, damage: 0.72 * (1 + n * 0.035), speed: (1 + Math.min(0.55, Math.log2(floor) * 0.07)) * (condition === "fleet" ? 1.12 : 1), cap: Math.min(16, 6 + Math.floor(n / 3)) + (condition === "crowd" ? 2 : 0), total: Math.min(70, 14 + n * 2) + (condition === "crowd" ? 6 : 0), interval: Math.max(0.35, 1 - n * 0.012), rangedCap: Math.min(4, 1 + Math.floor(n / 8)) };
    return { floor, room: room2, boss, condition, pressure };
  }
  function enterFloor(run2) {
    run2.dungeon.recovered = 0;
    run2.dungeon.vesselRecovered = 0;
    const spec = dungeonFloor(run2.seed, run2.dungeon.floor);
    run2.dungeon.condition = spec.condition;
    beginDungeonChamber(run2, spec.room, spec.pressure);
    run2.notice = "Floor " + spec.floor + " \xB7 " + DUNGEON_CONDITIONS[spec.condition].name + ". " + DUNGEON_CONDITIONS[spec.condition].desc + (spec.boss ? " Guardian floor." : "");
    run2.noticeTime = 7;
    return run2;
  }
  function createDungeon(form = "spark", seed = Date.now() >>> 0) {
    if (!Object.hasOwn(BODIES, form) || !Number.isInteger(seed)) throw Error("Choose a known dungeon vessel and seed.");
    const run2 = createRun(createMeta(), "spark", seed);
    run2.abilities = ["phase", "root", "fracture", "morph"];
    if (form !== "spark") morphRun(run2, form);
    run2.player.morphCooldown = 0;
    run2.birthForm = form;
    run2.dungeon = { version: 1, floor: 1, floorsCleared: 0, condition: "steady", pressure: null };
    return enterFloor(run2);
  }
  function nextDungeonFloor(run2) {
    if (!run2?.dungeon || run2.phase !== "resolve" || !run2.cleared.includes(run2.room)) throw Error("Clear the current floor first.");
    if (run2.xp >= run2.nextXp) throw Error("Remember your waiting gifts before descending.");
    run2.dungeon.floor++;
    return enterFloor(run2);
  }
  function chooseDungeonGift(run2) {
    prepareDungeonGifts(run2);
    return run2.choices;
  }
  function dungeonRung(floor) {
    const names = ["Ember", "Wayfarer", "Bellkeeper", "Seamwalker", "Archonbreaker", "Unbound"];
    const rank = Math.floor((floor - 1) / 5);
    return names[Math.min(5, rank)] + (rank >= 6 ? " " + (rank - 4) : "");
  }
  function validDungeon(run2) {
    const d = run2?.dungeon;
    if (!Number.isInteger(run2?.seed) || run2.seed < 0 || run2.seed > 4294967295 || !d || d.version !== 1 || run2.partner || run2.daily || !Number.isSafeInteger(d.floor) || d.floor < 1 || !Number.isSafeInteger(d.floorsCleared) || d.floorsCleared < 0 || d.floorsCleared > d.floor || !["playing", "resolve", "boon", "dead"].includes(run2.phase)) return false;
    const spec = dungeonFloor(run2.seed, d.floor);
    if (run2.room !== spec.room || d.condition !== spec.condition || JSON.stringify(d.pressure) !== JSON.stringify(spec.pressure) || d.floorsCleared !== (run2.cleared.includes(run2.room) ? d.floor : d.floor - 1)) return false;
    return validRun({ ...run2, dungeon: void 0 });
  }
  function cleanDungeonRecord(raw) {
    const result = { attempts: 0, best: 0, last: null };
    if (!raw || typeof raw !== "object") return result;
    for (const key of ["attempts", "best"]) if (Number.isSafeInteger(raw[key]) && raw[key] >= 0) result[key] = raw[key];
    if (raw.last && Object.hasOwn(BODIES, raw.last.form) && ["floors", "kills", "seconds", "seed"].every((k) => Number.isSafeInteger(raw.last[k]) && raw.last[k] >= 0)) result.last = { ...raw.last };
    return result;
  }
  function loadDungeon(storage) {
    try {
      const state = JSON.parse(storage.getItem(DUNGEON_KEY) ?? "null");
      return { run: validDungeon(state?.run) ? state.run : null, record: cleanDungeonRecord({ ...state?.record, best: Math.max(state?.record?.best ?? 0, validDungeon(state?.run) ? state.run.dungeon.floorsCleared : 0) }) };
    } catch {
      return { run: null, record: cleanDungeonRecord(null) };
    }
  }
  function saveDungeon(storage, run2, raw) {
    const record = cleanDungeonRecord(raw);
    if (run2?.dungeon) record.best = Math.max(record.best, run2.dungeon.floorsCleared);
    if (run2?.phase === "dead" && !run2.dungeon.recorded) {
      record.attempts++;
      record.best = Math.max(record.best, run2.dungeon.floorsCleared);
      record.last = { form: run2.form, floors: run2.dungeon.floorsCleared, kills: run2.kills, seconds: Math.floor(run2.time), seed: run2.seed };
      run2.dungeon.recorded = true;
    }
    storage.setItem(DUNGEON_KEY, JSON.stringify({ version: 1, run: run2, record }));
    return record;
  }
  function observeDungeon(run2, record) {
    return run2?.dungeon ? { mode: "dungeon", phase: run2.phase, seed: run2.seed, floor: run2.dungeon.floor, floorsCleared: run2.dungeon.floorsCleared, rung: dungeonRung(run2.dungeon.floor), condition: DUNGEON_CONDITIONS[run2.dungeon.condition], pressure: run2.dungeon.pressure, form: run2.form, player: { ...run2.player }, time: run2.time, level: run2.level, choices: run2.choices.map((id) => ({ id, name: BOONS[id].name })), next: dungeonFloor(run2.seed, run2.dungeon.floor + 1), record } : { mode: "dungeon", phase: "select", record };
  }

  // combat-view.js?v=0.13.0
  var VESSEL_SPRITES = { spark: 0, human: 1, computer: 2, animal: 3, tree: 4, rock: 5 };
  var circle = (ctx2, x, y, r, fill, stroke, width = 1) => {
    ctx2.beginPath();
    ctx2.arc(x, y, r, 0, Math.PI * 2);
    if (fill) {
      ctx2.fillStyle = fill;
      ctx2.fill();
    }
    if (stroke) {
      ctx2.strokeStyle = stroke;
      ctx2.lineWidth = width;
      ctx2.stroke();
    }
  };
  function drawVessel(ctx2, image, form, p, time, settings2, { color = "#e6c475", size = 86, duel: duel2 = false, alpha = 1 } = {}) {
    ctx2.save();
    ctx2.globalAlpha = alpha;
    const ground = duel2 ? p.groundY ?? p.y + 42 : p.y + 19;
    ctx2.fillStyle = "#040b08aa";
    ctx2.beginPath();
    ctx2.ellipse(p.x, ground, duel2 ? 43 : 27, duel2 ? 10 : 9, 0, 0, Math.PI * 2);
    ctx2.fill();
    const hurt2 = (p.hurtFlash ?? 0) > 0.17 || (p.flash ?? 0) > 0, invulnerable = (p.iframes ?? 0) > 0;
    if (!settings2.reduced && p.dashTime > 0) {
      ctx2.lineCap = "round";
      ctx2.strokeStyle = "#f5cf8688";
      ctx2.lineWidth = 5;
      ctx2.beginPath();
      ctx2.moveTo(p.x - (p.dashX ?? 1) * 67, p.y - (p.dashY ?? 0) * 67);
      ctx2.lineTo(p.x, p.y);
      ctx2.stroke();
      for (let i = 4; i > 0; i--) {
        ctx2.globalAlpha = alpha * (0.2 - i * 0.035);
        circle(ctx2, p.x - (p.dashX ?? 1) * i * 13, p.y - (p.dashY ?? 0) * i * 13, form === "spark" ? 26 : 19, "#f9d992");
      }
      ctx2.globalAlpha = alpha;
    }
    if (form === "spark") {
      const pulse = settings2.reduced ? 0 : Math.sin(time * 3) * 1.7, glow = ctx2.createRadialGradient(p.x, p.y, 9, p.x, p.y, 45 + pulse);
      if (glow?.addColorStop) {
        glow.addColorStop(0, "#ffe7a2bb");
        glow.addColorStop(0.6, "#edc36135");
        glow.addColorStop(1, "#edc36100");
      }
      circle(ctx2, p.x, p.y, 45 + pulse, glow ?? "#edc36122");
      circle(ctx2, p.x, p.y, 26, "#f8cf62");
      circle(ctx2, p.x, p.y, 18, "#ffe598");
      circle(ctx2, p.x, p.y, 10, "#fff5d3");
      circle(ctx2, p.x, p.y, 36 + pulse, null, color, hurt2 || invulnerable ? 4 : 1.4);
    } else {
      if (image?.complete && image.naturalWidth) {
        const index = VESSEL_SPRITES[form], sw = image.naturalWidth / 4, sh = image.naturalHeight / 2;
        ctx2.save();
        ctx2.translate(p.x, p.y);
        if ((p.facing ?? p.facingX ?? 1) < 0) ctx2.scale(-1, 1);
        if (hurt2 && settings2.flashes > 0 && !settings2.reduced) ctx2.filter = "brightness(" + (1 + 0.6 * settings2.flashes) + ")";
        ctx2.drawImage(image, index % 4 * sw, Math.floor(index / 4) * sh, sw, sh, -size / 2, -size / 2, size, size);
        ctx2.restore();
      }
      circle(ctx2, p.x, duel2 ? ground - 3 : p.y + 17, duel2 ? 44 : 25, null, color, hurt2 || invulnerable ? 3.5 : 1.4);
    }
    ctx2.restore();
  }
  function drawEnemyCore(ctx2, enemy, { role = enemy.kind, elite = false, time = 0, flash = 1, reduced = false, contactClose = false } = {}) {
    const shooter = role === "archon", color = elite ? "#fff0b4" : shooter ? "#7df0ec" : "#ff6f66", pulse = !reduced && (enemy.windup > 0 && enemy.windup <= 0.2 || role === "collector" && contactClose) ? 2 + Math.sin(time * 30) * 2 : 0;
    circle(ctx2, enemy.x, enemy.y, Math.max(6, enemy.r * 0.3) + pulse, color + "35");
    circle(ctx2, enemy.x, enemy.y, Math.max(3, enemy.r * 0.18), color);
    circle(ctx2, enemy.x, enemy.y, 1.6, "#fff5db");
    if (enemy.flash > 0 && flash > 0 && !reduced) circle(ctx2, enemy.x, enemy.y, enemy.r + 4, "#fff2ba44", color, 2);
    if (shooter && enemy.windup > 0 && enemy.windup <= 0.35) {
      ctx2.strokeStyle = "#74e8ec";
      ctx2.lineWidth = 2;
      ctx2.setLineDash([5, 5]);
      ctx2.beginPath();
      ctx2.moveTo(enemy.x, enemy.y);
      ctx2.lineTo(enemy.x + (enemy.chargeX ?? 0) * 360, enemy.y + (enemy.chargeY ?? 0) * 360);
      ctx2.stroke();
      ctx2.setLineDash([]);
    }
    if (elite) {
      ctx2.fillStyle = "#071412";
      ctx2.fillRect(enemy.x - 27, enemy.y - enemy.r - 13, 54, 3);
      ctx2.fillStyle = color;
      ctx2.fillRect(enemy.x - 27, enemy.y - enemy.r - 13, 54 * Math.max(0, enemy.hp / enemy.maxHp), 3);
    }
    if (elite && enemy.kind !== "cantor" && enemy.windup > 0) {
      const r = enemy.r + 18 + (1 - Math.min(1, enemy.windup / 0.8)) * 16;
      circle(ctx2, enemy.x, enemy.y, r, null, "#f2d294", 2);
      ctx2.save();
      ctx2.strokeStyle = "#f2d294aa";
      ctx2.lineWidth = 1.5;
      const angle = enemy.aimAngle ?? 0;
      ctx2.setLineDash([6, 5]);
      ctx2.beginPath();
      ctx2.moveTo(enemy.x + Math.cos(angle) * r, enemy.y + Math.sin(angle) * r);
      ctx2.lineTo(enemy.x + Math.cos(angle) * 210, enemy.y + Math.sin(angle) * 210);
      ctx2.stroke();
      ctx2.restore();
    }
  }
  function sealReason(run2, exit, status) {
    if (!run2.cleared.includes(run2.room)) return "SWARM";
    if (status.available) return "";
    if (status.missingRelics?.length) return "RELIC";
    if (status.ward) return "WARD";
    if (status.missingKeys?.length || status.missingSeals?.length || exit.keys || exit.seals) return "KEY";
    const ability = exit.requires;
    return ability === "root" || ["tree", "animal"].includes(exit.vessel) ? "ROOT" : ability === "fracture" || exit.vessel === "rock" ? "BASALT" : ability === "phase" || ["computer", "spark"].includes(exit.vessel) ? "CRYSTAL" : "KEY";
  }
  function drawSeal(ctx2, run2, room2, dir, exit, status, at, { retract = 1 } = {}) {
    const reason = sealReason(run2, exit, status), material = reason === "ROOT" ? "root" : reason === "BASALT" ? "basalt" : ["CRYSTAL", "KEY", "RELIC", "WARD"].includes(reason) ? "crystal" : room2.world === "verdant" || ["root", "garden"].includes(run2.room) ? "root" : room2.world === "cinder" || run2.room === "basalt" ? "basalt" : ["prism", "orbit"].includes(room2.world) ? "crystal" : "glass", color = { root: "#92be9e", basalt: "#b6a78d", crystal: "#93d9e0", glass: room2.theme ?? "#bbd7ce" }[material];
    ctx2.save();
    ctx2.translate(at.x, at.y);
    ctx2.rotate(dir === "north" ? 0 : dir === "south" ? Math.PI : dir === "east" ? Math.PI / 2 : -Math.PI / 2);
    if (!status.available) {
      ctx2.fillStyle = "#10231e";
      ctx2.beginPath();
      ctx2.moveTo(-41, -13);
      ctx2.lineTo(-28, -28);
      ctx2.lineTo(28, -28);
      ctx2.lineTo(41, -13);
      ctx2.lineTo(32, 14);
      ctx2.lineTo(-32, 14);
      ctx2.closePath();
      ctx2.fill();
      ctx2.strokeStyle = color;
      ctx2.lineWidth = 2;
      ctx2.stroke();
      for (let i = -2; i <= 2; i++) {
        ctx2.strokeStyle = color + "66";
        ctx2.beginPath();
        ctx2.moveTo(i * 12, -20);
        ctx2.lineTo(i * 9, 7);
        ctx2.stroke();
      }
      circle(ctx2, 0, -6, 20, "#11241e", color, 1.5);
      if (material === "root") {
        ctx2.lineWidth = 3;
        for (const s of [-1, 1]) {
          ctx2.beginPath();
          ctx2.moveTo(s * 37, 8);
          ctx2.bezierCurveTo(s * 15, -13, s * 34, -30, s * 8, -27);
          ctx2.stroke();
        }
      }
    } else {
      const gap = 22 + Math.min(1, retract) * 24;
      for (const sign of [-1, 1]) {
        ctx2.fillStyle = "#283c32";
        ctx2.fillRect(sign * gap - 5, -20, 10, 33);
        ctx2.strokeStyle = "#e7c989";
        ctx2.strokeRect(sign * gap - 5, -20, 10, 33);
      }
      circle(ctx2, 0, -7, 22, null, "#dfc89088", 1);
    }
    ctx2.restore();
    drawGateDestination(ctx2, dir, exit.to, at, reason, color);
  }
  function gatePromptBox(dir, arena, width, height, { mobile = false } = {}) {
    const margin = 12, w = Math.min(width, arena.w - 2 * margin), h = Math.min(height, arena.h - 2 * margin), left = arena.x + margin, right = arena.x + arena.w - margin - w, top = arena.y + margin, bottom = arena.y + arena.h - margin - h;
    const x = dir === "west" ? left : dir === "east" ? right : arena.x + (arena.w - w) / 2;
    const y = dir === "north" ? arena.y + 105 : dir === "south" ? arena.y + arena.h - (mobile ? 155 : 92) - h : arena.y + arena.h / 2 + 55;
    return { x: Math.max(left, Math.min(right, x)), y: Math.max(top, Math.min(bottom, y)), w, h };
  }
  function drawGateDestination(ctx2, dir, to, at, reason = "", color = "#e4d6b3") {
    const name = ROOMS[to]?.name;
    if (!name) return;
    ctx2.save();
    const width = 142;
    ctx2.font = "600 9px sans-serif";
    const lines = [], words = name.split(" ");
    let line = "";
    for (const word of words) {
      const next = line ? line + " " + word : word;
      if (ctx2.measureText(next).width > width - 8 && line) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    if (line) lines.push(line);
    const shown = lines.slice(0, 2), height = shown.length * 11 + 17, side2 = dir === "west" || dir === "east", x = side2 ? -width / 2 : at.x - width / 2, y = side2 ? -height / 2 : at.y - height / 2;
    if (side2) {
      ctx2.translate(at.x, at.y);
      ctx2.rotate(dir === "west" ? -Math.PI / 2 : Math.PI / 2);
    }
    ctx2.fillStyle = "#0a1a14dd";
    ctx2.fillRect(x, y, width, height);
    ctx2.strokeStyle = color + "66";
    ctx2.strokeRect(x, y, width, height);
    ctx2.textAlign = "center";
    ctx2.fillStyle = color;
    ctx2.font = "600 7px sans-serif";
    ctx2.fillText(dir.toUpperCase() + (reason ? " \xB7 " + reason : " \xB7 OPEN"), x + width / 2, y + 10);
    ctx2.font = "600 9px sans-serif";
    shown.forEach((text, i) => ctx2.fillText(text, x + width / 2, y + 23 + i * 11));
    ctx2.restore();
  }
  function drawCooldownRing(ctx2, x, y, progress2, label, color = "#e5c181", size = 17) {
    circle(ctx2, x, y, size, "#10251ee6", "#47614d", 2);
    ctx2.beginPath();
    ctx2.arc(x, y, size, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, Math.min(1, progress2)));
    ctx2.strokeStyle = color;
    ctx2.lineWidth = progress2 >= 1 ? 3 : 2;
    ctx2.stroke();
    ctx2.fillStyle = progress2 >= 1 ? "#ffe5a7" : "#a6b7aa";
    ctx2.font = "600 10px sans-serif";
    ctx2.textAlign = "center";
    ctx2.fillText(label, x, y + 3);
  }
  function drawDescentHud(ctx2, { w, run: run2, player, room: room2, title = run2.dungeon ? "FLOOR " + run2.dungeon.floor + " \xB7 " + dungeonArenaName(run2) : room2.name, profile, bindings, dashMax, powerMax, clearPulse = 0 }) {
    ctx2.save();
    const narrow = w < 520, hpWidth = Math.min(160, w * 0.28), swarmWidth = Math.min(255, w * 0.46), sx = narrow ? w - swarmWidth - 12 : (w - swarmWidth) / 2;
    ctx2.fillStyle = "#10251ee8";
    ctx2.fillRect(12, 12, hpWidth + 16, 32);
    ctx2.fillStyle = "#304d3b";
    ctx2.fillRect(20, 31, hpWidth, 5);
    ctx2.fillStyle = "#e9cd88";
    ctx2.fillRect(20, 31, hpWidth * player.hp / player.maxHp, 5);
    ctx2.font = "600 10px sans-serif";
    ctx2.textAlign = "left";
    ctx2.fillStyle = "#e1d6b2";
    ctx2.fillText("HP " + Math.ceil(player.hp) + " / " + player.maxHp, 20, 25);
    if (!room2.safe) {
      const progress2 = swarmProgress(run2), clear = progress2.cleared, boss = room2.boss || room2.miniboss, guardian = boss ? run2.enemies.find((e2) => e2.kind === (room2.guardian ?? (room2.miniboss ? "cantor" : "warden"))) : null;
      ctx2.fillStyle = clearPulse > 0 ? "#766b3ae0" : "#10251ee8";
      ctx2.fillRect(sx, 12, swarmWidth, 32);
      ctx2.fillStyle = "#e4d5ac";
      ctx2.font = "600 10px sans-serif";
      ctx2.textAlign = "center";
      const approaching = !clear && run2.spawned === 0 && run2.spawnTotal > 0;
      ctx2.fillText(clear ? "SWARM CLEARED" : (boss ? "GUARDIAN \xB7 " + Math.ceil((guardian?.hp ?? 0) / (guardian?.maxHp ?? 1) * 100) + "% HP" : "SWARM " + progress2.defeated + " / " + progress2.total + " \xB7 " + progress2.remaining + " LEFT") + (approaching ? " \xB7 " + Math.max(0.1, run2.spawnClock).toFixed(1) + "s" : ""), sx + swarmWidth / 2, 25);
      ctx2.fillStyle = "#304d3b";
      ctx2.fillRect(sx + 8, 31, swarmWidth - 16, 4);
      ctx2.fillStyle = clear ? "#f5d082" : "#8dd7cc";
      ctx2.fillRect(sx + 8, 31, (swarmWidth - 16) * (clear ? 1 : boss ? 1 - (guardian?.hp ?? 0) / (guardian?.maxHp ?? 1) : progress2.fraction), 4);
    }
    const y = narrow ? 68 : 28, dx = narrow ? w - 70 : w - 76;
    drawCooldownRing(ctx2, dx, y, 1 - player.dashCooldown / dashMax, profile === "mobile" ? "D" : inputHint(profile, "dash", bindings) === "Space" ? "SP" : inputHint(profile, "dash", bindings));
    drawCooldownRing(ctx2, dx + 42, y, 1 - (player.powerCooldown ?? 0) / powerMax, profile === "mobile" ? "P" : inputHint(profile, "power", bindings), "#8bdddc");
    ctx2.fillStyle = "#e7dabb";
    ctx2.font = "500 " + (narrow ? 11 : 13) + "px sans-serif";
    ctx2.textAlign = "center";
    ctx2.fillText(title, w / 2, narrow ? 66 : 64, w - 24);
    ctx2.restore();
  }

  // duel-engine.js?v=0.13.0
  var DUEL_CONTACT = 200;
  var DUEL_FORMS = ["spark", "human", "computer", "animal", "tree", "rock"];
  var DUEL_FIGHTERS = [...DUEL_FORMS, "collector", "archon", "cantor"];
  var DUEL_STAGES = { glass: { name: "Threshold Glass", color: "#82c8c4", look: "glass" }, tideglass: { name: "Tideglass", color: "#79cddc", look: "tide" }, root: { name: "Root", color: "#99c7a2", look: "root" }, basalt: { name: "Basalt", color: "#d4a476", look: "basalt" }, night: { name: "Night", color: "#bda4ee", look: "night" }, orbit: { name: "Orbit", color: "#c9dbe7", look: "orbit" } };
  var DUEL_ROSTER = { spark: { epithet: "Light that seeks", special: "Lumen pulse", desc: "A close pulse breaks the pattern." }, human: { epithet: "A stubborn heart", special: "Rally guard", desc: "A brief guard and a spectral strike." }, computer: { epithet: "Read the grid", special: "Overclock", desc: "Prism fire and four seconds of faster recovery." }, animal: { epithet: "A wolf\u2019s speed", special: "Pounce", desc: "Leap forward and strike where you land." }, tree: { epithet: "The oldest root listens", special: "Root hold", desc: "Hold a grounded foe in living roots." }, rock: { epithet: "The fault remembers", special: "Fault wave", desc: "A low shockwave and a short basalt guard." }, collector: { epithet: "The assigned hunger", special: "Collection lunge", desc: "Lunge along the stage; grab a close grounded foe." }, archon: { epithet: "A bell beneath the armor", special: "Aimed prism", desc: "Mark a line, then send a cyan bolt along it." }, cantor: { epithet: "The unfinished guardian", special: "Wind-up ring", desc: "The familiar ring warns before its pulse." } };
  var DUEL_MOVES = { light: { startup: 6, active: 3, recovery: 12, damage: 8, range: 240 }, heavy: { startup: 14, active: 5, recovery: 19, damage: 16, range: 261 }, launcher: { startup: 12, active: 4, recovery: 22, damage: 12, range: 248 }, special: { startup: 12, active: 6, recovery: 24, damage: 16, range: 272 }, super: { startup: 32, active: 6, recovery: 34, damage: 32, range: 317 } };
  Object.assign(DUEL_MOVES, { lk: { startup: 8, active: 4, recovery: 14, damage: 10, range: 254, height: "low" }, hk: { startup: 18, active: 5, recovery: 23, damage: 18, range: 280, height: "overhead" } });
  var DUEL_COMMANDS = { trace: { label: "Trace", directions: ["F", "D"], button: "light", notation: "forward \xB7 down \xB7 LP" }, bind: { label: "Bind", directions: ["D", "B"], button: "lk", notation: "down \xB7 back \xB7 LK" }, break: { label: "Break", directions: ["B", "F"], button: "hk", notation: "back \xB7 forward \xB7 HK" } };
  var DUEL_TECHNIQUES = {
    spark: { trace: { name: "Lumen thread", effect: "A traveling lumen shard.", bolt: true, damage: 14 }, bind: { name: "Held ember", effect: "Gather a close pulse behind a brief guard.", guard: 32, damage: 12, radial: true }, break: { name: "Unbound conduit", effect: "Lift a close vessel with a rising gold pulse.", launcher: true, damage: 18 } },
    human: { trace: { name: "Rally step", effect: "Step into a guarded hand strike.", dash: 65, guard: 20, damage: 14 }, bind: { name: "Glass oath", effect: "Brace and strike from a short guard.", guard: 40, damage: 12 }, break: { name: "Heart against the pattern", effect: "A rising spectral boot lifts the opponent.", launcher: true, damage: 18 } },
    computer: { trace: { name: "Prism trace", effect: "Send a cyan prism and enter Overclock.", bolt: true, overclock: 180, damage: 14 }, bind: { name: "Buried circuit", effect: "Brace inside a close cyan pulse.", guard: 32, radial: true, damage: 12 }, break: { name: "Array rupture", effect: "A rising prism lifts a close vessel.", launcher: true, damage: 18 } },
    animal: { trace: { name: "Feral crossing", effect: "A short pounce closes the distance.", dash: 100, hop: true, damage: 14 }, bind: { name: "Wild margin", effect: "Sweep low with a braced hind leg.", guard: 24, low: true, damage: 12 }, break: { name: "Feral ascent", effect: "A rising claw carries a vessel into the air.", launcher: true, damage: 18 } },
    tree: { trace: { name: "Root passage", effect: "A traveling root catches a grounded vessel.", bolt: true, low: true, root: 32, damage: 14 }, bind: { name: "Living vessel", effect: "Brace and hold a close vessel in roots.", guard: 36, root: 40, damage: 12 }, break: { name: "Archive rising", effect: "A thick root lifts the opponent.", launcher: true, damage: 18 } },
    rock: { trace: { name: "Fault seam", effect: "Send a low fault wave along the floor.", bolt: true, low: true, damage: 14 }, bind: { name: "Basalt guard", effect: "Brace and sweep the near fault.", guard: 40, low: true, damage: 12 }, break: { name: "Fault breaker", effect: "A stone heel opens a rising fault.", launcher: true, damage: 18 } },
    collector: { trace: { name: "Collection line", effect: "Lunge and grasp a grounded vessel.", dash: 90, grab: true, damage: 14 }, bind: { name: "Assigned hunger", effect: "A guarded lower tendril draws a vessel close.", guard: 24, low: true, pull: true, damage: 12 }, break: { name: "Uncollected spark", effect: "A rising grasp lifts the opponent.", launcher: true, damage: 18 } },
    archon: { trace: { name: "Prism witness", effect: "Mark a line and send an aimed prism.", bolt: true, damage: 14 }, bind: { name: "Sealed lattice", effect: "Guard inside a close prism pulse.", guard: 32, radial: true, damage: 12 }, break: { name: "Crown fracture", effect: "A rising crystal strike lifts a vessel.", launcher: true, damage: 18 } },
    cantor: { trace: { name: "First movement", effect: "Wind a visible ring into a close pulse.", radial: true, damage: 14 }, bind: { name: "Held note", effect: "Hold a short guard behind the winding ring.", guard: 36, radial: true, damage: 12 }, break: { name: "Second movement", effect: "The ring rises and lifts a close vessel.", launcher: true, radial: true, damage: 18 } }
  };
  var CHAIN_RANK = { light: 0, lk: 1, heavy: 2, hk: 3, launcher: 3, special: 4, super: 5 };
  var ACTIONS = ["super", "special", "launcher", "hk", "heavy", "lk", "light", "jump"];
  var freshCombo = () => ({ hits: 0, damage: 0, display: 0, moves: [] });
  var DUEL_CONDITIONS = {
    classic: { name: "Classic", desc: "100 HP. Standard movement and power recovery.", health: 100, speed: 1, gravity: 1, cooldown: 300, meter: 0, drip: 0 },
    glass: { name: "Glass oath", desc: "80 HP for both vessels. Every opening matters.", health: 80, speed: 1, gravity: 1, cooldown: 300, meter: 0, drip: 0 },
    quick: { name: "Quickening", desc: "Powers recover in 3 seconds for both vessels.", health: 100, speed: 1, gravity: 1, cooldown: 180, meter: 0, drip: 0 },
    gravity: { name: "Heavy law", desc: "20% slower movement and heavier falls for both vessels.", health: 100, speed: 0.8, gravity: 1.25, cooldown: 300, meter: 0, drip: 0 },
    "seal-break": { name: "Seal break", desc: "The first hit of each round cannot be blocked.", health: 100, speed: 1, gravity: 1, cooldown: 300, meter: 0, drip: 0 },
    charged: { name: "Charged current", desc: "Start each round with 50 meter; gain 2 meter per second.", health: 100, speed: 1, gravity: 1, cooldown: 300, meter: 50, drip: 2 }
  };
  var DUEL_LADDER_KEY = "spark-substrate-duel-ladder-v1";
  var DUEL_LADDER = [
    ["First ember", "human", "glass", "easy", "classic"],
    ["The running light", "animal", "root", "easy", "classic"],
    ["Prism witness", "computer", "tideglass", "medium", "quick"],
    ["Root keeper", "tree", "root", "medium", "gravity"],
    ["Fault reader", "rock", "basalt", "medium", "glass"],
    ["Mirror flame", "spark", "night", "medium", "charged"],
    ["The duelist", "human", "glass", "hard", "quick"],
    ["Wild oath", "animal", "night", "hard", "glass"],
    ["The old circuit", "computer", "orbit", "hard", "charged"],
    ["Patient crown", "tree", "root", "hard", "quick"],
    ["Basalt sovereign", "rock", "basalt", "hard", "gravity"],
    ["The unbound spark", "spark", "orbit", "hard", "charged"]
  ].map(([name, form, stage, difficulty, condition], i) => ({ rung: i + 1, name, form, stage, difficulty, condition, bonusHp: i * 4 }));
  function cleanLadder(raw) {
    return { version: 1, next: Number.isInteger(raw?.next) && raw.next >= 1 && raw.next <= 13 ? raw.next : 1, best: Number.isInteger(raw?.best) && raw.best >= 0 && raw.best <= 12 ? raw.best : 0, attempts: Number.isSafeInteger(raw?.attempts) && raw.attempts >= 0 ? raw.attempts : 0 };
  }
  function createLadderDuel(form, rung, profile = "pc", seed = Date.now() >>> 0) {
    const entry = DUEL_LADDER[rung - 1];
    if (!entry) throw Error("Choose a ladder rung from 1 to 12.");
    const match = createDuel({ forms: [form, entry.form], stage: entry.stage, difficulty: entry.difficulty, condition: entry.condition, bonusHp: entry.bonusHp, bot: true, profile, seed });
    match.ladder = { rung, name: entry.name };
    return match;
  }
  function recordLadder(match, raw) {
    if (!match.ladder || match.phase !== "finished" || match.ladderRecorded) throw Error("Only a completed ladder match can advance a rung.");
    const record = cleanLadder(raw);
    if (match.ladder.rung !== record.next) throw Error("Win the current rung before climbing.");
    record.attempts++;
    if (match.winner === 0) {
      record.best = Math.max(record.best, match.ladder.rung);
      record.next = match.ladder.rung + 1;
    }
    match.ladderRecorded = true;
    return record;
  }
  var DUEL_RECORD_KEY = "spark-substrate-duels-v1";
  var clamp2 = (n, a, b) => Math.max(a, Math.min(b, n));
  var F = 1 / 60;
  function random(m) {
    m.rng = Math.imul(m.rng, 1664525) + 1013904223 >>> 0;
    return m.rng / 4294967296;
  }
  var fighter = (form, i, rules = DUEL_CONDITIONS.classic, bonusHp = 0) => ({ form, x: i ? 670 : 290, y: 0, vx: 0, vy: 0, hp: rules.health + (i ? bonusHp : 0), maxHp: rules.health + (i ? bonusHp : 0), meter: rules.meter, facing: i ? -1 : 1, crouch: false, blocking: false, attack: null, stun: 0, root: 0, cooldown: 0, guard: 0, focusCharge: 0, focusGuard: 0, focusBoost: 0, focusConnected: false, overclock: 0, flash: 0, rounds: 0, previous: {}, input: {}, pending: null, motion: [], lastDirection: "N", walk: 0, combo: freshCombo(), comboOwner: null, juggles: 0, lastTechnique: null, stats: { hits: 0, damage: 0, specials: 0, supers: 0, throws: 0, techs: 0, commands: 0, bestCombo: 0 } });
  function resolveDuelContact(m) {
    const [a, b] = m.fighters;
    if (Math.abs(a.y - b.y) < 60 && Math.abs(a.x - b.x) < DUEL_CONTACT) {
      const sign = a.x <= b.x ? 1 : -1, lunging = (f) => f.attack?.kind === "special" && ["animal", "collector"].includes(f.form), center = lunging(a) && !lunging(b) ? a.x + sign * DUEL_CONTACT / 2 : lunging(b) && !lunging(a) ? b.x - sign * DUEL_CONTACT / 2 : (a.x + b.x) / 2, middle = clamp2(center, 45 + DUEL_CONTACT / 2, 915 - DUEL_CONTACT / 2);
      a.x = middle - sign * DUEL_CONTACT / 2;
      b.x = middle + sign * DUEL_CONTACT / 2;
    }
  }
  function emit(m, type, data = {}) {
    m.events.push({ id: ++m.serial, type, frame: m.frames, ...data });
    if (m.events.length > 80) m.events.shift();
  }
  function createDuel({ forms = ["spark", "human"], stage = "glass", bot = false, difficulty = "medium", profile = "pc", seed = Date.now() >>> 0, condition = "classic", bonusHp = 0 } = {}) {
    if (!Array.isArray(forms) || forms.length !== 2 || forms.some((form) => !DUEL_FIGHTERS.includes(form)) || !Object.hasOwn(DUEL_STAGES, stage) || !["easy", "medium", "hard"].includes(difficulty) || !["pc", "controller", "mobile"].includes(profile) || !Number.isInteger(seed) || !Object.hasOwn(DUEL_CONDITIONS, condition) || !Number.isInteger(bonusHp) || bonusHp < 0 || bonusHp > 44 || !bot && bonusHp !== 0) throw Error("Choose two known vessels, a stage, and valid duel settings.");
    return { version: 1, mode: "duel", forms: [...forms], stage, condition, rules: { ...DUEL_CONDITIONS[condition] }, bonusHp, bot: !!bot, difficulty, profile, seed: seed >>> 0, rng: seed >>> 0, frames: 0, serial: 0, phase: profile === "mobile" && !bot ? "handoff" : "playing", clock: 60, round: 1, firstHit: false, replay: 0, roundWinner: null, winner: null, breakFrames: 0, freeze: 0, cinematic: 0, throw: null, bolts: [], fighters: forms.map((form, i) => fighter(form, i, DUEL_CONDITIONS[condition], bonusHp)), events: [], turn: 0, turnFrames: 180, botState: { decision: 0, input: {}, seenSpecials: 0, lastAttack: null, pendingSpecial: null }, recorded: false };
  }
  function readyDuel(m) {
    if (m.phase !== "handoff") throw Error("No handoff is waiting.");
    m.phase = "playing";
    m.turnFrames = 180;
    emit(m, "ready", { player: m.turn });
  }
  function skipDuelScene(m) {
    if (m.phase === "finisher") {
      m.phase = "finished";
      m.breakFrames = 0;
      emit(m, "match", { winner: m.winner });
    } else if (m.cinematic > 0) {
      if (m.fighters.some((f) => f.attack?.kind === "super")) return;
      m.cinematic = 0;
    }
  }
  function nextRound(m) {
    const rounds = m.fighters.map((f) => f.rounds), stats = m.fighters.map((f) => f.stats);
    m.fighters = m.forms.map((form, i) => fighter(form, i, m.rules, m.bonusHp));
    m.fighters.forEach((f, i) => {
      f.rounds = rounds[i];
      f.stats = stats[i];
    });
    m.clock = 60;
    m.firstHit = false;
    m.bolts = [];
    m.throw = null;
    m.cinematic = 0;
    m.freeze = 0;
    m.turn = m.bot ? 0 : (m.round - 1) % 2;
    m.turnFrames = 180;
    m.phase = m.profile === "mobile" && !m.bot ? "handoff" : "playing";
    m.botState.input = {};
    m.botState.decision = 0;
    emit(m, "round", { round: m.round });
  }
  function endRound(m, winner) {
    m.roundWinner = winner;
    emit(m, "ko", { winner, loser: winner === null ? null : 1 - winner });
    if (winner !== null) m.fighters[winner].rounds++;
    m.phase = "round-end";
    m.breakFrames = 120;
    m.freeze = 0;
    m.cinematic = 0;
    m.throw = null;
  }
  function moveFor(f) {
    const a = f.attack, base = DUEL_MOVES[a?.kind];
    if (!base) return null;
    const technique = a.technique ? DUEL_TECHNIQUES[f.form][a.technique] : null;
    return { ...base, ...technique, startup: a.startup ?? base.startup, range: technique?.range ?? base.range };
  }
  function addDamage(m, attacker, defender, amount, { special = false, launcher = false, throwing = false, low = false, overhead = false, root = 0, pull = false } = {}) {
    const a = m.fighters[attacker], b = m.fighters[defender];
    if (b.hp <= 0) return;
    const breaksSeal = m.condition === "seal-break" && !m.firstHit;
    if (!breaksSeal && !throwing && b.focusGuard > 0) {
      b.focusConnected = true;
      b.focusGuard = 0;
      b.meter = clamp2(b.meter + 4, 0, 100);
      emit(m, "focus-guard", { player: defender });
      return;
    }
    const directionalGuard = b.blocking && (!low || b.crouch) && (!overhead || !b.crouch);
    const blocked = !breaksSeal && !throwing && b.y === 0 && (directionalGuard || b.guard > 0);
    const actual = blocked ? special ? amount * 0.05 : 0 : amount;
    if (actual === 0) {
      emit(m, "block", { player: defender });
      return;
    }
    m.firstHit = true;
    const counter = !blocked && !!b.attack && b.attack.frame < (moveFor(b)?.startup ?? 0);
    const continuing = !blocked && b.comboOwner === attacker && (b.stun > 0 || b.y > 0);
    if (!blocked && !continuing) a.combo = freshCombo();
    const scale = continuing ? Math.max(0.5, 1 - a.combo.hits * 0.14) : 1;
    const damage = Math.min(b.hp, actual * (blocked ? 1 : scale));
    b.hp = clamp2(b.hp - damage, 0, b.maxHp);
    a.meter = clamp2(a.meter + damage * 1.8, 0, 100);
    b.meter = clamp2(b.meter + damage * 1.2, 0, 100);
    a.stats.hits++;
    a.stats.damage += damage;
    b.flash = 9;
    m.freeze = counter ? 6 : 3;
    if (!blocked) {
      b.attack = null;
      b.pending = null;
      b.stun = Math.max(counter ? 24 : 20, ["heavy", "hk"].includes(a.attack?.kind) ? 26 : a.attack?.kind === "lk" ? 22 : 20);
      b.comboOwner = attacker;
      b.x = clamp2(b.x + a.facing * (pull ? -32 : continuing ? 7 : launcher ? 26 : 18), 45, 915);
      if (launcher && b.juggles < 2) {
        b.vy = 510;
        b.y = Math.max(1, b.y);
        b.juggles++;
      }
      if (root || a.form === "tree" && special) b.root = root || 45;
      a.combo.hits++;
      a.combo.damage += damage;
      a.combo.display = 80;
      a.combo.moves.push(a.attack?.technique ? DUEL_TECHNIQUES[a.form][a.attack.technique].name : a.attack?.kind ?? (throwing ? "throw" : "bolt"));
      a.stats.bestCombo = Math.max(a.stats.bestCombo, a.combo.hits);
    }
    emit(m, blocked ? "chip" : "hit", { attacker, defender, damage: Math.round(damage * 10) / 10, counter, blocked, low, overhead, combo: blocked ? 0 : a.combo.hits, kind: a.attack?.kind ?? "bolt" });
  }
  function attack2(m, i, kind, technique = null) {
    const f = m.fighters[i];
    f.attack = { id: ++m.serial, kind, technique, crouch: ["light", "lk"].includes(kind) && f.crouch, frame: 0, hit: false, connected: false, ...kind === "special" && f.focusBoost > 0 ? { startup: 7 } : {} };
    if (kind === "special") {
      f.focusBoost = 0;
      f.cooldown = m.rules.cooldown;
      f.stats.specials++;
      if (technique) {
        f.stats.commands++;
        f.lastTechnique = { name: DUEL_TECHNIQUES[f.form][technique].name, frame: m.frames };
        emit(m, "command", { player: i, technique, name: f.lastTechnique.name });
      }
    }
    if (kind === "super") {
      f.meter = 0;
      f.stats.supers++;
      m.cinematic = 72;
    }
    emit(m, kind === "super" ? "super" : "attack", { player: i, kind, technique, attackId: f.attack.id });
  }
  function advanceAttack(m, i) {
    const f = m.fighters[i], a = f.attack;
    if (!a) return;
    const move2 = moveFor(f);
    a.frame++;
    if (a.kind === "special" && a.frame === move2.startup) {
      if (a.technique) {
        if (move2.guard) f.guard = move2.guard;
        if (move2.overclock) f.overclock = move2.overclock;
        if (move2.dash) f.x = clamp2(f.x + f.facing * move2.dash, 45, 915);
        if (move2.hop) {
          f.y = 28;
          f.vy = 65;
        }
        if (move2.bolt) {
          m.bolts.push({ owner: i, x: f.x + f.facing * 45, y: f.y + (move2.low ? 15 : 65), vx: f.facing * (move2.low ? 7 : 10), life: 90, damage: move2.damage, low: !!move2.low, root: move2.root ?? 0, trail: [], technique: a.technique, form: f.form });
          a.hit = true;
        }
        if (move2.grab && Math.abs(f.x - m.fighters[1 - i].x) < DUEL_CONTACT + 22 && m.fighters[1 - i].y === 0) {
          a.hit = true;
          const hp = m.fighters[1 - i].hp;
          addDamage(m, i, 1 - i, move2.damage, { special: true, throwing: true });
          a.connected = m.fighters[1 - i].hp < hp;
        }
      } else {
        if (f.form === "archon") {
          m.bolts.push({ owner: i, x: f.x + f.facing * 25, y: f.y + 65, vx: f.facing * 9, life: 70, damage: move2.damage, trail: [], form: f.form });
          a.hit = true;
        }
        if (f.form === "human") f.guard = 40;
        if (f.form === "rock") f.guard = 24;
        if (f.form === "computer") f.overclock = 240;
        if (f.form === "collector") {
          f.x = clamp2(f.x + f.facing * 90, 45, 915);
          if (Math.abs(f.x - m.fighters[1 - i].x) < DUEL_CONTACT + 12 && m.fighters[1 - i].y === 0) {
            a.hit = true;
            const hp = m.fighters[1 - i].hp;
            addDamage(m, i, 1 - i, move2.damage, { special: true, throwing: true });
            a.connected = m.fighters[1 - i].hp < hp;
          }
        }
        if (f.form === "animal") {
          f.x = clamp2(f.x + f.facing * 160, 45, 915);
          f.y = 35;
          f.vy = 70;
        }
      }
      emit(m, "power", { player: i, form: f.form, technique: a.technique });
    }
    if (a.frame >= move2.startup && a.frame < move2.startup + move2.active && !a.hit) {
      const b = m.fighters[1 - i];
      let range = move2.range;
      if (a.kind === "special" && !a.technique) range = ["computer", "archon", "rock"].includes(f.form) ? 340 : f.form === "animal" ? 227 : 272;
      const low = move2.low || move2.height === "low" || a.kind === "special" && !a.technique && f.form === "rock";
      const overhead = move2.height === "overhead" || !!move2.launcher;
      const radial = move2.radial || a.kind === "special" && f.form === "spark";
      const canHitCrouch = a.kind !== "light" || f.crouch;
      if (Math.abs(f.x - b.x) <= range && (radial || (b.x - f.x) * f.facing >= -16) && Math.abs(f.y - b.y) < (low ? 35 : 110) && (canHitCrouch || !b.crouch)) {
        a.hit = true;
        const hp = b.hp;
        addDamage(m, i, 1 - i, move2.damage, { special: ["special", "super"].includes(a.kind), launcher: a.kind === "launcher" || !!move2.launcher, low, overhead, root: move2.root ?? 0, pull: !!move2.pull });
        a.connected = b.hp < hp && !m.events.at(-1)?.blocked;
      }
    }
    const recovery = Math.round(move2.recovery * (f.overclock > 0 && ["light", "heavy", "lk", "hk", "launcher"].includes(a.kind) ? 0.8 : 1));
    if (a.frame >= move2.startup + move2.active + recovery) f.attack = null;
  }
  function captureInput(m, i, raw = {}) {
    const f = m.fighters[i], other = m.fighters[1 - i];
    f.facing = other.x >= f.x ? 1 : -1;
    const input = { x: clamp2(Number(raw.x) || 0, -1, 1), crouch: !!raw.crouch, focus: !!raw.focus, jump: !!raw.jump, light: !!(raw.lp || raw.light), heavy: !!(raw.hp || raw.heavy), lk: !!raw.lk, hk: !!raw.hk, launcher: !!raw.launcher, special: !!raw.special, super: !!raw.super };
    const direction2 = input.crouch ? "D" : input.x * f.facing > 0.35 ? "F" : input.x * f.facing < -0.35 ? "B" : input.jump ? "U" : "N";
    f.motion = f.motion.filter((e2) => m.frames - e2.frame <= 28);
    if (direction2 !== f.lastDirection) {
      if (direction2 !== "N") f.motion.push({ direction: direction2, frame: m.frames });
      f.lastDirection = direction2;
    }
    for (const action of ACTIONS) {
      if (input[action] && !f.previous[action]) {
        const sequence = f.motion.slice(-2);
        const command = Object.entries(DUEL_COMMANDS).find(([, c2]) => c2.button === action && sequence.length === 2 && sequence.every((e2, j) => e2.direction === c2.directions[j]) && sequence[1].frame - sequence[0].frame <= 24 && m.frames - sequence[1].frame <= 10)?.[0] ?? null;
        f.pending = { action, command, back: input.x * f.facing < -0.25, frame: m.frames, expires: m.frames + (command ? 18 : 12) };
        if (command) f.motion = [];
        break;
      }
    }
    f.previous = input;
    f.input = input;
  }
  function inputFrame(m, i) {
    const f = m.fighters[i], other = m.fighters[1 - i], input = f.input ?? {}, pending = f.pending;
    if (pending && pending.expires < m.frames) f.pending = null;
    f.blocking = input.x * f.facing < -0.25 && f.y === 0 && !f.attack && f.stun === 0;
    f.crouch = f.attack ? !!f.attack.crouch : input.crouch && f.y === 0;
    if (input.focus && f.stun === 0 && !f.attack && f.y === 0) {
      f.blocking = false;
      f.focusCharge = Math.min(24, f.focusCharge + 1);
      if (f.focusCharge === 24 && !f.focusLatched) {
        f.focusGuard = 12;
        f.focusBoost = 90;
        f.focusConnected = false;
        f.focusLatched = true;
        emit(m, "focus", { player: i });
      }
    } else {
      f.focusCharge = 0;
      f.focusLatched = false;
    }
    if (m.throw) {
      if (m.throw.target === i && f.pending?.action === "light" && f.pending.back && m.throw.frames <= 8) {
        m.fighters[m.throw.owner].stun = 15;
        f.stun = 15;
        f.stats.techs++;
        f.pending = null;
        emit(m, "tech", { player: i });
        m.throw = null;
      }
      return;
    }
    if (f.stun > 0 || m.cinematic > 0 || input.focus) return;
    const request = f.pending, kind = request?.command ? "special" : request?.action;
    const cancel = !!(f.attack?.connected && request && CHAIN_RANK[kind] > CHAIN_RANK[f.attack.kind]);
    if (request && (!f.attack || cancel)) {
      const ground = f.y === 0;
      if (kind === "super" && f.meter >= 100) {
        if (cancel) other.stun = Math.max(other.stun, 36);
        attack2(m, i, "super");
        f.pending = null;
      } else if (kind === "special" && f.cooldown === 0) {
        attack2(m, i, "special", request.command);
        f.pending = null;
      } else if (kind === "light" && request.back && Math.abs(f.x - other.x) < DUEL_CONTACT + 12 && ground && other.y === 0 && !f.attack) {
        m.throw = { owner: i, target: 1 - i, frames: 0 };
        f.stats.throws++;
        f.pending = null;
        emit(m, "throw", { player: i, target: 1 - i });
      } else if (["light", "heavy", "lk", "hk", "launcher"].includes(kind)) {
        if (cancel) emit(m, "cancel", { player: i, from: f.attack.kind, to: kind });
        attack2(m, i, kind);
        f.pending = null;
      } else if (kind === "jump" && ground && f.root === 0 && !f.attack) {
        f.vy = 570;
        f.y = 0.1;
        f.pending = null;
      }
    }
    if (!f.attack && !f.crouch && f.root === 0) {
      const dx = (input.x || 0) * 210 * m.rules.speed * F;
      f.x = clamp2(f.x + dx, 45, 915);
      f.vx = dx * 60;
      f.walk += Math.abs(dx) / 35;
    } else f.vx = 0;
  }
  function duelBotInput(m) {
    const bot = m.fighters[1], other = m.fighters[0], state = m.botState, pose = other.attack?.kind ?? null, id = other.attack?.id ?? null;
    if (state.pendingSpecial !== null && id !== state.pendingSpecial) {
      state.seenSpecials++;
      state.pendingSpecial = null;
    }
    if (pose === "special" && id !== state.lastAttack) {
      state.pendingSpecial = id;
      state.lastAttack = id;
    }
    if (state.commandPlan?.length) {
      const part = state.commandPlan[0];
      if (--part.frames <= 0) state.commandPlan.shift();
      state.input = part.input;
      return state.input;
    }
    if (m.difficulty !== "easy" && bot.attack?.connected && state.chainId !== bot.attack.id) {
      const next = { light: "lk", lk: "heavy", heavy: "hk", hk: "special", launcher: "special", special: "super" }[bot.attack.kind];
      state.chainId = bot.attack.id;
      if (next && (next !== "special" || bot.cooldown === 0) && (next !== "super" || bot.meter >= 100)) {
        state.input = { [next]: true };
        return state.input;
      }
    }
    if (--state.decision > 0) return state.input;
    state.decision = m.difficulty === "easy" ? 18 : m.difficulty === "medium" ? 12 : 9;
    const distance = Math.abs(other.x - bot.x), toward = other.x > bot.x ? 1 : -1, r = random(m), input = { x: distance > DUEL_CONTACT + 7 ? toward : 0 };
    const blockChance = m.difficulty === "easy" ? 0.08 : m.difficulty === "medium" ? 0.3 : 0.55;
    if (pose && (r < blockChance || m.difficulty === "hard" && pose === "special" && state.seenSpecials > 0)) input.x = -toward;
    else if (bot.meter >= 100 && distance < DUEL_CONTACT + 82) input.super = true;
    else if (bot.cooldown === 0 && distance < 310 && r > 0.55) {
      if (m.difficulty === "easy") input.special = true;
      else {
        const command = r > 0.84 ? "break" : r > 0.69 ? "bind" : "trace", spec = DUEL_COMMANDS[command], direction2 = (d) => d === "D" ? { crouch: true } : { x: d === "F" ? toward : -toward };
        state.commandPlan = [{ input: direction2(spec.directions[0]), frames: 3 }, { input: direction2(spec.directions[1]), frames: 3 }, { input: { [spec.button]: true }, frames: 1 }, { input: {}, frames: 1 }];
        input.x = 0;
      }
    } else if (distance < DUEL_CONTACT + 27 && r > 0.2) input[r < 0.4 ? "light" : r < 0.6 ? "lk" : r < 0.8 ? "heavy" : r < 0.93 ? "hk" : "launcher"] = true;
    else if (distance > DUEL_CONTACT + 102 && r > 0.88) input.jump = true;
    state.input = input;
    return input;
  }
  function stepDuel(m, inputs = [{}, {}], frames = 1) {
    if (!Number.isInteger(frames) || frames < 1 || frames > 240) throw Error("Use 1\u2013240 duel frames.");
    for (let n = 0; n < frames; n++) {
      if (["finished", "handoff", "paused"].includes(m.phase)) break;
      m.frames++;
      if (m.phase === "finisher") {
        if (--m.breakFrames <= 0) {
          m.phase = "finished";
          emit(m, "match", { winner: m.winner });
        }
        continue;
      }
      if (m.phase === "round-end") {
        if (--m.breakFrames > 0) continue;
        if (m.roundWinner !== null && m.fighters[m.roundWinner].rounds >= 2) {
          m.winner = m.roundWinner;
          const winner = m.fighters[m.winner], loser = m.fighters[1 - m.winner];
          if (loser.hp / loser.maxHp < 0.1 && winner.meter > 0) {
            m.phase = "finisher";
            m.breakFrames = 120;
            winner.meter = 0;
            emit(m, "finisher", { winner: m.winner, loser: 1 - m.winner });
          } else {
            m.phase = "finished";
            emit(m, "match", { winner: m.winner });
          }
        } else {
          if (m.roundWinner === null && m.replay === 0) m.replay = 1;
          else {
            m.round++;
            m.replay = 0;
          }
          nextRound(m);
        }
        continue;
      }
      const source = [inputs[0] ?? {}, m.bot ? duelBotInput(m) : inputs[1] ?? {}];
      for (let i = 0; i < 2; i++) captureInput(m, i, m.profile === "mobile" && !m.bot && i !== m.turn ? {} : source[i]);
      resolveDuelContact(m);
      if (m.freeze > 0) {
        m.freeze--;
        continue;
      }
      if (m.cinematic > 0) m.cinematic--;
      else m.clock = m.clock <= F + 1e-8 ? 0 : m.clock - F;
      for (let i = 0; i < 2; i++) {
        const f = m.fighters[i];
        f.combo.display = Math.max(0, f.combo.display - 1);
        if (f.stun === 0 && f.y === 0) {
          f.comboOwner = null;
          f.juggles = 0;
        }
        f.meter = clamp2(f.meter + m.rules.drip * F, 0, 100);
        for (const key of ["stun", "root", "cooldown", "guard", "overclock", "flash", "focusBoost"]) f[key] = Math.max(0, f[key] - 1);
        if (f.focusGuard > 0 && --f.focusGuard === 0 && !f.focusConnected) {
          f.meter = clamp2(f.meter - 10, 0, 100);
          emit(m, "focus-whiff", { player: i });
        }
        inputFrame(m, i);
      }
      if (m.throw && ++m.throw.frames > 8) {
        const { owner, target } = m.throw;
        m.throw = null;
        addDamage(m, owner, target, 14, { throwing: true });
        m.fighters[owner].stun = 20;
      }
      for (let i = 0; i < 2; i++) {
        const f = m.fighters[i];
        if (f.y > 0 || f.vy > 0) {
          f.y = Math.max(0, f.y + f.vy * F);
          f.vy -= 1500 * m.rules.gravity * F;
          if (f.y === 0) f.vy = 0;
        }
      }
      resolveDuelContact(m);
      for (let i = 0; i < 2; i++) advanceAttack(m, i);
      for (const bolt2 of m.bolts) {
        bolt2.trail ??= [];
        bolt2.trail.push({ x: bolt2.x, y: bolt2.y });
        if (bolt2.trail.length > 5) bolt2.trail.shift();
        bolt2.x += bolt2.vx;
        bolt2.life--;
        const other = m.fighters[1 - bolt2.owner];
        if (Math.abs(bolt2.x - other.x) < 65 && Math.abs(bolt2.y - (other.y + (bolt2.low ? 15 : 65))) < (bolt2.low ? 30 : 60)) {
          addDamage(m, bolt2.owner, 1 - bolt2.owner, bolt2.damage, { special: true, low: !!bolt2.low, root: bolt2.root ?? 0 });
          bolt2.life = 0;
        }
      }
      m.bolts = m.bolts.filter((b2) => b2.life > 0 && b2.x > 0 && b2.x < 960);
      resolveDuelContact(m);
      const [a, b] = m.fighters;
      if (a.hp <= 0 || b.hp <= 0) endRound(m, a.hp <= 0 && b.hp <= 0 ? null : a.hp > 0 ? 0 : 1);
      else if (m.clock === 0) endRound(m, a.hp / a.maxHp === b.hp / b.maxHp ? null : a.hp / a.maxHp > b.hp / b.maxHp ? 0 : 1);
      else if (m.profile === "mobile" && !m.bot && --m.turnFrames <= 0) {
        m.turn = 1 - m.turn;
        m.phase = "handoff";
        emit(m, "handoff", { player: m.turn });
      }
    }
    return m;
  }
  function observeDuel(m) {
    return m ? structuredClone({ mode: m.mode, phase: m.phase, forms: m.forms, stage: m.stage, condition: m.condition, ladder: m.ladder ?? null, clock: m.clock, round: m.round, replay: m.replay, turn: m.turn, winner: m.winner, frames: m.frames, fighters: m.fighters.map((f) => ({ form: f.form, x: f.x, y: f.y, hp: f.hp, maxHp: f.maxHp, meter: f.meter, rounds: f.rounds, cooldown: f.cooldown / 60, technique: f.attack?.technique ?? null, combo: { ...f.combo }, motion: f.motion.map((e2) => e2.direction), pose: f.attack?.kind ?? (f.stun ? "hurt" : f.focusCharge ? "focus" : f.blocking ? "block" : f.crouch ? "crouch" : f.y ? "jump" : "idle"), stats: f.stats })) }) : { mode: "duel", phase: "select" };
  }
  function cleanDuelRecord(raw) {
    const next = { version: 1, matches: 0, wins: Object.fromEntries(DUEL_FIGHTERS.map((f) => [f, 0])), losses: Object.fromEntries(DUEL_FIGHTERS.map((f) => [f, 0])), last: null };
    if (raw?.version !== 1) return next;
    for (const name of ["wins", "losses"]) for (const form of DUEL_FIGHTERS) if (Number.isInteger(raw[name]?.[form]) && raw[name][form] >= 0) next[name][form] = Math.min(1e6, raw[name][form]);
    if (Number.isInteger(raw.matches) && raw.matches >= 0) next.matches = Math.min(1e6, raw.matches);
    if (Array.isArray(raw.last?.forms) && raw.last.forms.length === 2 && raw.last.forms.every((f) => DUEL_FIGHTERS.includes(f)) && [0, 1].includes(raw.last.winner) && Object.hasOwn(DUEL_STAGES, raw.last.stage) && Array.isArray(raw.last.rounds) && raw.last.rounds.length === 2 && raw.last.rounds.every((n) => Number.isInteger(n) && n >= 0 && n <= 2)) next.last = { forms: [...raw.last.forms], winner: raw.last.winner, rounds: [...raw.last.rounds], stage: raw.last.stage, bot: !!raw.last.bot };
    return next;
  }
  function recordDuel(m, raw) {
    if (m.phase !== "finished" || m.winner === null || m.recorded) throw Error("Only a completed, unrecorded match can be remembered.");
    const record = cleanDuelRecord(raw), winner = m.forms[m.winner], loser = m.forms[1 - m.winner];
    record.matches++;
    if (!m.bot || m.winner === 0) record.wins[winner]++;
    if (!m.bot || m.winner === 1) record.losses[loser]++;
    record.last = { forms: [...m.forms], winner: m.winner, rounds: m.fighters.map((f) => f.rounds), stage: m.stage, bot: m.bot };
    m.recorded = true;
    return record;
  }

  // duel-view.js?v=0.13.0
  var NAMES = { spark: "Spark", human: "Human", computer: "Computer", animal: "Animal", tree: "Tree", rock: "Rock", collector: "Collector", archon: "Archon", cantor: "Cantor" };
  var COLOR = ["#efcd79", "#c4a1fa"];
  var POWER_COLORS = { spark: "#f5c66d", human: "#9debed", computer: "#75edfa", animal: "#f0ba6b", tree: "#96e4b5", rock: "#f2a76a", collector: "#77e6d4", archon: "#8feffc", cantor: "#efd899" };
  var DUEL_BODY_CELLS = { spark: 0, human: 1, animal: 2, tree: 3, rock: 4, computer: 5, collector: 6, archon: 7, cantor: 8 };
  var STRIKE_FEET = [0.931, 0.928, 0.928, 0.885, 0.89, 0.888, 0.778, 0.768, 0.768];
  var KICK_FEET = [0.967, 0.967, 0.967, 0.859, 0.866, 0.854, 0.801, 0.804, 0.804];
  var BODY_FEET = [383, 383, 381, 366, 364, 362, 346, 345, 339];
  var fighterPortraitStyle = (form) => {
    const i = DUEL_BODY_CELLS[form];
    return "--fighter-x:" + i % 3 * 50 + "%;--fighter-y:" + Math.floor(i / 3) * 50 + "%";
  };
  var KEYSETS = [{ left: "a", right: "d", jump: "w", crouch: "s", light: "f", heavy: "g", lk: "c", hk: "b", launcher: "h", special: "r", super: "t", focus: "v" }, { left: "arrowleft", right: "arrowright", jump: "arrowup", crouch: "arrowdown", light: "k", heavy: "l", lk: ",", hk: ".", launcher: ";", special: "o", super: "p", focus: "i" }];
  function duelInputs(profile, keys2, pads, touch = { x: 0, y: 0, buttons: {} }, turn = 0) {
    const keyboard = (map) => ({ x: (keys2.has(map.right) ? 1 : 0) - (keys2.has(map.left) ? 1 : 0), ...Object.fromEntries(["jump", "crouch", "light", "heavy", "lk", "hk", "launcher", "special", "super", "focus"].map((a) => [a, keys2.has(map[a])])) });
    if (profile === "mobile") {
      const inputs = [{}, {}];
      inputs[turn] = { x: touch.x, crouch: touch.y > 0.4, jump: touch.y < -0.5, ...touch.buttons };
      return inputs;
    }
    if (profile !== "controller") return KEYSETS.map(keyboard);
    const standard = Array.from(pads ?? []).filter((p) => p?.connected && p.mapping === "standard"), pressed = (pad2, i) => typeof pad2.buttons[i] === "number" ? pad2.buttons[i] > 0.5 : !!pad2.buttons[i]?.pressed || pad2.buttons[i]?.value > 0.5;
    return [0, 1].map((i) => {
      const pad2 = standard[i];
      if (!pad2) return i === 1 ? keyboard(KEYSETS[1]) : {};
      const x = Math.abs(pad2.axes[0] ?? 0) > 0.18 ? pad2.axes[0] : 0;
      return { x: x + (pressed(pad2, 15) ? 1 : 0) - (pressed(pad2, 14) ? 1 : 0), jump: pressed(pad2, 12) || (pad2.axes[1] ?? 0) < -0.6, crouch: pressed(pad2, 13) || (pad2.axes[1] ?? 0) > 0.4, light: pressed(pad2, 2), heavy: pressed(pad2, 3), lk: pressed(pad2, 0), hk: pressed(pad2, 1), launcher: pressed(pad2, 4), focus: pressed(pad2, 6), special: pressed(pad2, 5), super: pressed(pad2, 7) };
    });
  }
  var DuelScreen = class {
    constructor({ document: document2, window: window2, storage, image, art = {}, settings: settings2, audio: audio2, onQuit, announce: announce2 = () => {
    }, keepsakes: keepsakes2 = () => ({ met: [], cantor: false, unlocks: [] }), onReward = () => null, onCardFound = () => null }) {
      Object.assign(this, { document: document2, window: window2, storage, image, art, settings: settings2, audio: audio2, onQuit, announce: announce2, keepsakes: keepsakes2, onReward, onCardFound });
      this.$ = (id) => document2.getElementById(id);
      this.match = null;
      this.config = { forms: ["spark", "human"], stage: "glass", bot: false, difficulty: "medium", condition: "classic" };
      this.keys = /* @__PURE__ */ new Set();
      this.tapKeys = /* @__PURE__ */ new Set();
      this.tapTouch = {};
      this.touch = { x: 0, y: 0, buttons: {} };
      this.paused = false;
      this.guideOpen = false;
      this.accumulator = 0;
      this.seenEvents = 0;
      this.overlaySignature = "";
      this.menuButtons = [];
      try {
        this.record = cleanDuelRecord(JSON.parse(storage.getItem(DUEL_RECORD_KEY) ?? "null"));
      } catch {
        this.record = cleanDuelRecord(null);
      }
      try {
        this.ladder = cleanLadder(JSON.parse(storage.getItem(DUEL_LADDER_KEY) ?? "null"));
      } catch {
        this.ladder = cleanLadder(null);
      }
      this.canvas = this.$("duel-canvas");
      this.ctx = this.canvas.getContext("2d", { alpha: false });
      this.bindTouch();
    }
    clearInputs() {
      this.keys.clear();
      this.tapKeys.clear();
      this.tapTouch = {};
      this.touch = { x: 0, y: 0, buttons: {} };
      for (const f of this.match?.fighters ?? []) {
        f.previous = {};
        f.input = {};
        f.pending = null;
        f.motion = [];
        f.lastDirection = "N";
        f.focusCharge = 0;
        f.focusLatched = false;
        f.vx = 0;
      }
    }
    profile() {
      return this.settings().inputProfile;
    }
    bindInspect() {
      for (const i of [0, 1]) {
        const button = this.$("duel-inspect-" + i), data = this.$("duel-frame-data-" + i);
        const show = () => {
          data.hidden = false;
        }, hide = () => {
          data.hidden = true;
        };
        button.addEventListener("pointerdown", (e2) => {
          e2.preventDefault();
          button.setPointerCapture?.(e2.pointerId);
          show();
        });
        for (const type of ["pointerup", "pointercancel", "blur"]) button.addEventListener(type, hide);
        button.addEventListener("keydown", (e2) => {
          if ([" ", "Enter"].includes(e2.key)) {
            e2.preventDefault();
            show();
          }
        });
        button.addEventListener("keyup", hide);
      }
    }
    drawBody(ctx2, f, feet, time, setting, alpha = 1) {
      const idle = this.image;
      if (!idle?.complete || !idle.naturalWidth) return;
      const a = f.attack, move2 = a ? DUEL_MOVES[a.kind] : null, startup = a?.startup ?? move2?.startup ?? 1;
      const kicking = a && (["lk", "hk", "launcher"].includes(a.kind) || a.technique === "break" || (a.technique ? DUEL_TECHNIQUES[f.form][a.technique].low : a.kind === "special" && f.form === "rock"));
      const pose = kicking ? this.art.kicks : this.art.strikes, ready = pose?.complete && pose.naturalWidth > 0;
      const blend = a && ready ? Math.min(1, a.frame / Math.max(1, startup * 0.6), Math.max(0, (startup + move2.active + move2.recovery - a.frame) / 10)) : 0;
      const stride = setting.reduced ? 0 : Math.sin((f.walk ?? 0) * 3), bob = setting.reduced || f.y || f.crouch ? 0 : Math.sin(time * 4) * 1.2 + Math.abs(f.vx ?? 0) / 210 * Math.abs(stride) * 2;
      const lean = f.stun ? -f.facing * 0.025 : f.attack ? (kicking ? -0.045 : 0.05) * blend : f.blocking ? -0.04 : (f.vx ?? 0) * 35e-6;
      ctx2.save();
      ctx2.translate(f.x, feet);
      ctx2.scale(f.facing, f.crouch ? 0.7 : 1);
      ctx2.rotate(lean);
      if (f.flash > 0 && setting.flashes > 0 && !setting.reduced) ctx2.filter = "brightness(" + (1 + setting.flashes * 0.7) + ")";
      const cell = DUEL_BODY_CELLS[f.form];
      const layer = (image, opacity, anchors, size = 260) => {
        if (opacity <= 0) return;
        const sw = image.naturalWidth / 3, sh = image.naturalHeight / 3;
        ctx2.globalAlpha = alpha * opacity;
        ctx2.drawImage(image, cell % 3 * sw, Math.floor(cell / 3) * sh, sw, sh, -size / 2, -anchors[cell] * size + bob, size, size);
      };
      layer(idle, 1 - blend, BODY_FEET.map((n) => n / 418));
      if (ready) layer(pose, blend, kicking ? KICK_FEET : STRIKE_FEET);
      ctx2.restore();
    }
    open() {
      this.match = null;
      this.paused = false;
      this.guideOpen = false;
      this.clearInputs();
      this.renderSelect();
      this.render();
    }
    setProfile(profile) {
      if (Object.hasOwn(DUEL_CONDITIONS, this.$("duel-condition").value)) this.config.condition = this.$("duel-condition").value;
      if (Object.hasOwn(DUEL_STAGES, this.$("duel-stage").value)) this.config.stage = this.$("duel-stage").value;
      if (["easy", "medium", "hard"].includes(this.$("duel-difficulty").value)) this.config.difficulty = this.$("duel-difficulty").value;
      if (["bot", "local"].includes(this.$("duel-opponent").value)) this.config.bot = this.$("duel-opponent").value === "bot";
      this.clearInputs();
      if (this.match) {
        this.match.profile = profile;
        if (profile === "mobile") {
          if (!this.match.ladder) this.match.bot = false;
          if (!this.match.bot && this.match.phase === "playing") this.match.phase = "handoff";
        } else if (this.match.phase === "handoff") this.match.phase = "playing";
      }
      this.renderSelect();
      this.render(true);
    }
    renderSelect() {
      const p = this.profile();
      this.$("duel-condition").innerHTML = Object.entries(DUEL_CONDITIONS).filter(([id]) => id !== "seal-break" || hasAlcove(this.keepsakes(), "seal-break")).map(([id, c2]) => `<option value="${id}">${c2.name}</option>`).join("");
      this.$("duel-condition").value = this.config.condition;
      this.$("duel-cycle-condition").textContent = "Next \xB7 " + DUEL_CONDITIONS[this.config.condition].name;
      this.$("duel-condition-copy").textContent = DUEL_CONDITIONS[this.config.condition].desc;
      this.renderLadder();
      this.$("duel-select").hidden = !!this.match;
      this.$("duel-root").classList.toggle("selecting", !this.match);
      this.$("duel-stage").innerHTML = Object.entries(DUEL_STAGES).map(([id, stage]) => `<option value="${id}" ${this.config.stage === id ? "selected" : ""}>${stage.name}</option>`).join("");
      this.$("duel-stage").value = this.config.stage;
      this.$("duel-opponent").innerHTML = `<option value="local">Local versus</option>${p === "mobile" ? "" : '<option value="bot">Solo vs bot</option>'}`;
      this.$("duel-opponent").value = this.config.bot && p !== "mobile" ? "bot" : "local";
      this.$("duel-difficulty").value = this.config.difficulty;
      for (const [id, label] of Object.entries({ stage: DUEL_STAGES[this.config.stage].name, opponent: this.config.bot && p !== "mobile" ? "Solo vs bot" : "Local versus", difficulty: this.config.difficulty })) this.$("duel-cycle-" + id).textContent = "Next \xB7 " + label;
      this.$("duel-rosters").innerHTML = [0, 1].map((i) => `<section class="duel-roster"><h3 style="color:${COLOR[i]}">PLAYER ${i + 1} \xB7 ${NAMES[this.config.forms[i]]}</h3><div class="duel-vessels">${DUEL_FIGHTERS.map((form, index) => `<button class="duel-vessel ${this.config.forms[i] === form ? "selected" : ""} ${fighterAvailable(this.keepsakes(), form) ? "" : "sealed"}" data-action="duel-form" data-player="${i}" data-form="${form}" aria-pressed="${this.config.forms[i] === form}" ${fighterAvailable(this.keepsakes(), form) ? "" : "disabled"}>${fighterAvailable(this.keepsakes(), form) ? `<span class="fighter-portrait" style="${fighterPortraitStyle(form)}"></span>` : '<span class="fighter-seal" aria-hidden="true">\u25C7</span>'}<strong>${NAMES[form]}</strong><small>${fighterAvailable(this.keepsakes(), form) ? DUEL_ROSTER[form].epithet : "SEALED \xB7 " + FIGHTER_MEETINGS[form].name}</small><small>${fighterAvailable(this.keepsakes(), form) ? DUEL_ROSTER[form].special : "Meet this fighter first"}</small></button>`).join("")}</div><p><b>${DUEL_ROSTER[this.config.forms[i]].special}</b> \xB7 ${DUEL_ROSTER[this.config.forms[i]].desc}</p><details class="duel-techniques"><summary>Vessel techniques \xB7 command list</summary>${this.moveGuide([this.config.forms[i]])}</details><button class="duel-inspect" id="duel-inspect-${i}" aria-label="Hold to inspect frame data">Hold to inspect</button><p class="duel-frame-data" id="duel-frame-data-${i}" hidden>LP 6 / 3 / 12 \xB7 LK 8 / 4 / 14 \xB7 HP 14 / 5 / 19 \xB7 HK 18 / 5 / 23 \xB7 Launcher 12 / 4 / 22 \xB7 Special 12 / 6 / 24 \xB7 Super 32 / 6 / 34. Startup / active / recovery at 60 Hz. Focus: hold 24 frames, guard point 12, special startup 7; whiff costs 10 meter. LP + back throws; tech within 8 frames. Confirmed hits cancel into stronger moves; a command special uses the same special frame shape for every body.</p></section>`).join("");
      this.bindInspect();
      this.renderControls();
      this.$("duel-record").textContent = this.record.matches + " local matches remembered \xB7 " + DUEL_FORMS.map((f) => NAMES[f] + " " + this.record.wins[f] + "W").join(" \xB7 ");
    }
    moveGuide(forms) {
      return `<div class="duel-move-books">${forms.map((form, i) => `<section><h3>${forms.length > 1 ? "P" + (i + 1) + " \xB7 " : ""}${NAMES[form]}</h3>${Object.entries(DUEL_COMMANDS).map(([id, command]) => `<div class="duel-technique"><strong>${DUEL_TECHNIQUES[form][id].name}</strong><kbd>${command.notation}</kbd><small>${DUEL_TECHNIQUES[form][id].effect}</small></div>`).join("")}</section>`).join("")}</div><p class="duel-guide-tip">Forward and back follow the opponent. Trace two directions within 0.4s, then tap the shown attack. Techniques share the power cooldown. On a confirmed hit, chain LP \u2192 LK \u2192 HP \u2192 HK, then a ready technique or Super. Stronger moves cancel the previous hit; repeated buttons do not. Crouch + back blocks low kicks; stand + back blocks HK. Super needs 100 meter.</p>`;
    }
    renderLadder() {
      const current = DUEL_LADDER[this.ladder.next - 1];
      this.$("duel-ladder-description").textContent = current ? "Rung " + current.rung + " / 12 \xB7 " + current.name + " \xB7 " + NAMES[current.form] + " \xB7 " + current.difficulty + " bot \xB7 " + DUEL_CONDITIONS[current.condition].name + " \xB7 opponent +" + current.bonusHp + " HP. Your selected P1 vessel climbs. Progress saves after each completed match." : "All twelve rungs conquered. Your best climb is remembered.";
      this.$("duel-ladder-start").textContent = this.ladder.next > 12 ? "Ladder conquered" : "Climb rung " + this.ladder.next;
      this.$("duel-ladder-start").disabled = this.ladder.next > 12;
      this.$("duel-ladder-reset").hidden = this.ladder.next <= 12;
      this.$("duel-ladder-rungs").innerHTML = DUEL_LADDER.map((r) => `<li class="${r.rung < this.ladder.next ? "conquered" : r.rung === this.ladder.next ? "current" : "locked"}"><span>${r.rung < this.ladder.next ? "\u2713" : r.rung}</span><div><b>${r.name}</b><small>${NAMES[r.form]} \xB7 ${DUEL_CONDITIONS[r.condition].name}</small></div></li>`).join("");
    }
    renderControls() {
      const p = this.profile();
      this.padCount = Array.from(this.window.navigator?.getGamepads?.() ?? []).filter((pad2) => pad2?.connected && pad2.mapping === "standard").length;
      this.$("duel-instructions").textContent = p === "mobile" ? this.match?.bot ? "Solo ladder \xB7 stick moves / up jumps / down crouches. LP \xB7 HP \xB7 LK \xB7 HK, LAUNCH, POWER, SUPER, hold FOCUS." : "Pass & play \xB7 three seconds per turn. Stick moves / up jumps / down crouches. LP \xB7 HP \xB7 LK \xB7 HK; close back + LP throws. The ready gate freezes the fight while hands swap." : p === "controller" ? "P1 pad: stick / D-pad move, up jumps, down crouches \xB7 X LP \xB7 Y HP \xB7 A LK \xB7 B HK \xB7 LB launcher \xB7 RB power \xB7 RT Super \xB7 LT Focus (hold) \xB7 Start pause. P2: second pad or arrows + K LP / L HP / comma LK / period HK, ; launcher, O power, P Super, I Focus." : "LOCAL VERSUS \xB7 P1: WASD move / jump / crouch \xB7 F LP \xB7 G HP \xB7 C LK \xB7 B HK \xB7 H launcher \xB7 R power \xB7 T Super \xB7 V Focus (hold). P2: arrows \xB7 K LP \xB7 L HP \xB7 comma LK \xB7 period HK \xB7 ; launcher \xB7 O power \xB7 P Super \xB7 I Focus. Esc pauses.";
      this.$("duel-instructions").textContent += " Hold back to block; crouch + back guards lows. Close back + LP throws / techs. Super needs 100 / 100 meter. Moves shows your vessel\u2019s commands.";
      this.$("duel-touch").hidden = p !== "mobile" || !this.match || this.match.phase !== "playing" || this.paused;
    }
    readOptions() {
      for (const [key, values] of [["stage", DUEL_STAGES], ["condition", DUEL_CONDITIONS]]) if (Object.hasOwn(values, this.$("duel-" + key).value)) this.config[key] = this.$("duel-" + key).value;
      if (["easy", "medium", "hard"].includes(this.$("duel-difficulty").value)) this.config.difficulty = this.$("duel-difficulty").value;
      if (["local", "bot"].includes(this.$("duel-opponent").value)) this.config.bot = this.$("duel-opponent").value === "bot";
    }
    action(action, data = {}) {
      switch (action) {
        case "duel-cycle":
          if (!this.match) {
            this.readOptions();
            const id = data.option, values = id === "stage" ? Object.keys(DUEL_STAGES) : id === "opponent" ? this.profile() === "mobile" ? ["local"] : ["local", "bot"] : id === "condition" ? Object.keys(DUEL_CONDITIONS).filter((id2) => id2 !== "seal-break" || hasAlcove(this.keepsakes(), "seal-break")) : ["easy", "medium", "hard"], current = id === "stage" ? this.config.stage : id === "opponent" ? this.config.bot ? "bot" : "local" : id === "condition" ? this.config.condition : this.config.difficulty, next = values[(Math.max(0, values.indexOf(current)) + 1) % values.length];
            if (id === "stage") this.config.stage = next;
            else if (id === "opponent") this.config.bot = next === "bot";
            else if (id === "condition") this.config.condition = next;
            else this.config.difficulty = next;
            this.renderSelect();
            this.$("duel-cycle-" + id).focus({ preventScroll: true });
          }
          break;
        case "duel-form":
          if (!this.match && DUEL_FIGHTERS.includes(data.form) && fighterAvailable(this.keepsakes(), data.form)) {
            this.config.condition = this.$("duel-condition").value || this.config.condition;
            this.config.stage = this.$("duel-stage").value || this.config.stage;
            this.config.bot = this.profile() !== "mobile" && this.$("duel-opponent").value === "bot";
            this.config.difficulty = this.$("duel-difficulty").value || this.config.difficulty;
            this.config.forms[Number(data.player) === 1 ? 1 : 0] = data.form;
            this.renderSelect();
            this.$("duel-rosters").querySelector?.('[data-player="' + (Number(data.player) === 1 ? 1 : 0) + '"][data-form="' + data.form + '"]')?.focus({ preventScroll: true });
          }
          break;
        case "duel-start":
          if (this.config.forms.some((f) => !fighterAvailable(this.keepsakes(), f))) throw Error("Meet a sealed fighter before selecting it.");
          this.config.condition = this.$("duel-condition").value || "classic";
          this.config.stage = this.$("duel-stage").value || "glass";
          this.config.bot = this.profile() !== "mobile" && this.$("duel-opponent").value === "bot";
          this.config.difficulty = this.$("duel-difficulty").value || "medium";
          if (this.config.condition === "seal-break" && !hasAlcove(this.keepsakes(), "seal-break")) throw Error("Break this condition\u2019s vault seal first.");
          this.match = createDuel({ ...this.config, profile: this.profile() });
          this.matchPointCard = null;
          this.visit = "duel:" + this.match.seed + ":" + (++this.visitSerial || (this.visitSerial = 1));
          this.paused = false;
          this.guideOpen = false;
          this.accumulator = 0;
          this.seenEvents = 0;
          this.clearInputs();
          this.renderSelect();
          this.render(true);
          this.audio.effect("round");
          this.canvas.focus({ preventScroll: true });
          break;
        case "duel-ladder-start":
          if (!fighterAvailable(this.keepsakes(), this.config.forms[0])) throw Error("Meet this fighter first.");
          if (this.ladder.next > 12) throw Error("The ladder is complete. Choose Start a new climb to replay it.");
          this.match = createLadderDuel(this.config.forms[0], this.ladder.next, this.profile());
          this.matchPointCard = null;
          this.visit = "ladder:" + this.match.seed + ":" + this.match.ladder.rung + ":" + (++this.visitSerial || (this.visitSerial = 1));
          this.paused = false;
          this.guideOpen = false;
          this.accumulator = 0;
          this.seenEvents = 0;
          this.clearInputs();
          this.renderSelect();
          this.render(true);
          this.audio.effect("round");
          this.canvas.focus({ preventScroll: true });
          break;
        case "duel-ladder-reset":
          if (this.ladder.next <= 12) throw Error("Finish the current climb before starting another.");
          this.ladder = { ...this.ladder, next: 1 };
          this.storage.setItem(DUEL_LADDER_KEY, JSON.stringify(this.ladder));
          this.open();
          break;
        case "duel-ready":
          readyDuel(this.match);
          this.clearInputs();
          this.$("duel-stick").style.opacity = "1";
          this.$("duel-stick-thumb").style.transform = "translate(0,0)";
          this.render(true);
          this.canvas.focus({ preventScroll: true });
          break;
        case "duel-guide":
          if (this.match) {
            this.paused = true;
            this.guideOpen = true;
            this.clearInputs();
            this.render(true);
          } else {
            const details = this.$("duel-rosters").querySelector("details");
            if (details) {
              details.open = true;
              details.focus?.({ preventScroll: true });
            }
          }
          break;
        case "duel-pause":
          if (this.match && (this.match.phase !== "finished" || this.guideOpen)) {
            this.paused = !this.paused;
            this.guideOpen = false;
            this.clearInputs();
            this.render(true);
          }
          break;
        case "duel-skip":
          if (this.match) skipDuelScene(this.match);
          this.render(true);
          break;
        case "duel-rematch":
          {
            const ladder = !!this.match?.ladder;
            this.match = null;
            this.action(ladder ? "duel-ladder-start" : "duel-start");
          }
          break;
        case "duel-select":
          this.open();
          break;
        case "duel-quit":
          this.clearInputs();
          this.match = null;
          this.onQuit();
          break;
        default:
          if (action.startsWith("duel-input-")) {
            const key = action.slice(11);
            this.touch.buttons[key] = true;
            this.tapTouch[key] = true;
            this.touchClick = key;
          }
      }
    }
    keydown(event) {
      const key = String(event.key).toLowerCase();
      if (event.altKey || event.ctrlKey || event.metaKey || ["INPUT", "SELECT", "TEXTAREA"].includes(event.target?.tagName)) return;
      if (key === " " && this.match) event.preventDefault();
      if (key === "escape") {
        event.preventDefault();
        if (!event.repeat) this.action("duel-pause");
        return;
      }
      if (this.match?.phase === "finisher" && (key === " " || key === "enter")) {
        event.preventDefault();
        this.action("duel-skip");
        return;
      }
      if (this.paused || !this.match || this.match.phase === "handoff" || this.match.phase === "finished") return;
      if (this.profile() === "mobile") return;
      const allowed = this.profile() === "controller" ? Object.values(KEYSETS[1]) : KEYSETS.flatMap(Object.values);
      if (allowed.includes(key)) {
        event.preventDefault();
        this.keys.add(key);
        if (!event.repeat && KEYSETS.some((map) => ["jump", "light", "heavy", "lk", "hk", "launcher", "special", "super"].some((a) => map[a] === key))) this.tapKeys.add(key);
      }
    }
    keyup(event) {
      this.keys.delete(String(event.key).toLowerCase());
    }
    bindTouch() {
      const stick2 = this.$("duel-stick");
      let pointer2 = null;
      const move2 = (e2) => {
        if (pointer2 !== e2.pointerId) return;
        const r = stick2.getBoundingClientRect(), dx = (e2.clientX - r.left - r.width / 2) / 36, dy = (e2.clientY - r.top - r.height / 2) / 36, len = Math.hypot(dx, dy);
        this.touch.x = len > 1 ? dx / len : dx;
        this.touch.y = len > 1 ? dy / len : dy;
        stick2.style.opacity = Math.abs(this.touch.x) + Math.abs(this.touch.y) > 0.1 ? ".4" : "1";
        this.$("duel-stick-thumb").style.transform = `translate(${this.touch.x * 27}px,${this.touch.y * 27}px)`;
      };
      stick2.addEventListener("pointerdown", (e2) => {
        e2.preventDefault();
        pointer2 = e2.pointerId;
        stick2.setPointerCapture?.(pointer2);
        move2(e2);
      });
      stick2.addEventListener("pointermove", move2);
      for (const type of ["pointerup", "pointercancel"]) stick2.addEventListener(type, (e2) => {
        if (e2.pointerId === pointer2) {
          pointer2 = null;
          this.touch.x = this.touch.y = 0;
          stick2.style.opacity = "1";
          this.$("duel-stick-thumb").style.transform = "translate(0,0)";
        }
      });
      for (const action of ["light", "heavy", "lk", "hk", "launcher", "special", "super", "focus"]) {
        const el = this.$("duel-touch-" + action);
        el.addEventListener("pointerdown", (e2) => {
          e2.preventDefault();
          this.touch.buttons[action] = true;
          if (action !== "focus") this.tapTouch[action] = true;
          el.setPointerCapture?.(e2.pointerId);
        });
        for (const type of ["pointerup", "pointercancel"]) el.addEventListener(type, (e2) => {
          e2.preventDefault();
          this.touch.buttons[action] = false;
        });
      }
    }
    tick(seconds) {
      this.pollMenus();
      if (!this.match) {
        this.draw();
        return;
      }
      if (this.paused || this.document.querySelector("dialog[open]")) {
        this.accumulator = 0;
        this.draw();
        return;
      }
      this.accumulator = Math.min(5, this.accumulator + seconds);
      let steps = 0;
      while (this.accumulator + 1e-9 >= 1 / 60 && steps++ < 120) {
        const held = /* @__PURE__ */ new Set([...this.keys, ...this.tapKeys]);
        stepDuel(this.match, duelInputs(this.profile(), held, this.window.navigator?.getGamepads?.(), { ...this.touch, buttons: { ...this.touch.buttons, ...this.tapTouch } }, this.match.turn));
        this.tapKeys.clear();
        this.tapTouch = {};
        this.accumulator -= 1 / 60;
      }
      if (steps > 0 && this.touchClick) {
        this.touch.buttons[this.touchClick] = false;
        this.touchClick = null;
      }
      for (const event of this.match.events) if (event.id > this.seenEvents) {
        this.seenEvents = event.id;
        if (event.type === "hit" || event.type === "chip") this.audio.effect("hit");
        if (event.type === "round") this.audio.effect("round");
        if (event.type === "ko") this.audio.effect("ko");
        if (event.type === "power" || event.type === "super") this.audio.effect("power");
        if (event.type === "throw") this.announce("Throw. LP + back breaks it within eight frames.");
      }
      if (this.match.phase === "round-end" && this.match.roundWinner === 0 && this.match.fighters[0].rounds === 2 && !this.match.cardDiscovered) {
        this.matchPointCard = this.onCardFound(this.match, this.visit);
        this.match.cardDiscovered = true;
        this.announce(this.matchPointCard ? this.matchPointCard.name + " card found at match point." : "Match point remembered.");
      }
      if (this.match.phase === "finished" && !this.match.recorded) {
        this.reward = this.onReward(this.match, this.visit);
        if (this.reward && this.matchPointCard) this.reward.card = this.matchPointCard;
        this.record = recordDuel(this.match, this.record);
        if (this.match.ladder) {
          this.ladder = recordLadder(this.match, this.ladder);
          try {
            this.storage.setItem(DUEL_LADDER_KEY, JSON.stringify(this.ladder));
          } catch {
            this.announce("This device could not save the ladder rung.");
          }
        }
        try {
          this.storage.setItem(DUEL_RECORD_KEY, JSON.stringify(this.record));
        } catch {
          this.announce("The match ended, but this device could not save the duel record.");
        }
      }
      this.render();
      this.draw();
    }
    pollMenus() {
      if (this.profile() !== "controller") return;
      const pad2 = Array.from(this.window.navigator?.getGamepads?.() ?? []).find((p) => p?.connected && p.mapping === "standard");
      if (!pad2) return;
      const down = (i) => !!pad2.buttons[i]?.pressed || pad2.buttons[i]?.value > 0.5, previous2 = this.padPrevious ?? {}, edge = (i) => down(i) && !previous2[i];
      this.padPrevious = Object.fromEntries([0, 1, 9, 12, 13, 14, 15].map((i) => [i, down(i)]));
      for (const i of [0, 1]) this.$("duel-frame-data-" + i).hidden = !(down(0) && this.document.activeElement === this.$("duel-inspect-" + i));
      const dialog = this.document.querySelector("dialog[open]");
      if (dialog && edge(1)) {
        dialog.close();
        return;
      }
      if (edge(9) && this.match && !dialog) {
        this.action("duel-pause");
        return;
      }
      if (this.match?.phase === "finisher" && edge(0) && !dialog) {
        this.action("duel-skip");
        return;
      }
      if (this.match && this.match.phase === "playing" && !this.paused && !dialog) return;
      const root = dialog ?? (this.match ? this.$("duel-overlay") : this.$("duel-select")), buttons = Array.from(root.querySelectorAll?.("button:not([disabled])") ?? []);
      if (!buttons.length) return;
      if (edge(12) || edge(13) || edge(14) || edge(15)) {
        const index = Math.max(0, buttons.indexOf(this.document.activeElement)), next = (index + (edge(13) || edge(15) ? 1 : -1) + buttons.length) % buttons.length;
        buttons[next].focus({ preventScroll: true });
      }
      if (edge(0)) (buttons.includes(this.document.activeElement) ? this.document.activeElement : buttons[0]).click();
    }
    render(force = false) {
      this.renderControls();
      const m = this.match, signature = [this.paused, this.guideOpen, m?.phase, m?.turn, m?.round, m?.replay, m?.winner, this.ladder.next].join(":");
      if (!force && signature === this.overlaySignature) return;
      this.overlaySignature = signature;
      const el = this.$("duel-overlay");
      el.classList.toggle("finishing", m?.phase === "finisher" && !this.paused);
      el.hidden = !m || m.phase === "playing" && !this.paused;
      if (!m) {
        el.innerHTML = "";
        return;
      }
      let title = "", copy = "", buttons = "", guide = "";
      if (this.paused) {
        title = this.guideOpen ? "Vessel techniques" : "The stage can wait.";
        copy = this.guideOpen ? "The stage and clock wait while you read." : "This duel is paused.";
        if (this.guideOpen) guide = this.moveGuide(m.forms);
        buttons = '<button data-action="duel-pause">Resume</button><button data-action="duel-rematch">Rematch</button><button data-action="duel-select">Character select</button><button data-action="duel-quit">Quit to start page</button>';
      } else if (m.phase === "handoff") {
        title = "Player " + (m.turn + 1) + " \xB7 hands to the spark.";
        copy = "Pass the device. The stage and clock wait until you are ready.";
        buttons = '<button class="primary-button" data-action="duel-ready">Player ' + (m.turn + 1) + " ready</button>";
      } else if (m.phase === "round-end") {
        title = m.roundWinner === null ? "A draw. The sparks remain." : "Player " + (m.roundWinner + 1) + " takes the round.";
        copy = m.roundWinner === null ? m.replay === 0 ? "One replay. No point awarded." : "No point awarded. A new round follows." : "The body falls. The spark remembers.";
      } else if (m.phase === "finisher") {
        title = "Return to the substrate.";
        copy = "The losing spark returns to its vessel\u2019s floor glyph. The body falls. The spark remembers.";
        buttons = '<button data-action="duel-skip">Skip seal</button>';
      } else if (m.phase === "finished") {
        title = NAMES[m.forms[m.winner]] + " wins the duel.";
        copy = "First to two \xB7 " + m.fighters.map((f) => f.rounds).join(" \u2014 ") + ". " + DUEL_CONDITIONS[m.condition].name + ". P1: " + Math.round(m.fighters[0].stats.damage) + " damage \xB7 " + (m.fighters[0].stats.specials + m.fighters[0].stats.supers) + " powers (" + m.fighters[0].stats.supers + " supers) \xB7 " + m.fighters[0].stats.techs + " throw breaks \xB7 best chain " + m.fighters[0].stats.bestCombo + " hits.";
        buttons = (m.ladder ? this.ladder.next > 12 ? '<button class="primary-button" data-action="duel-ladder-reset">Start a new climb</button>' : '<button class="primary-button" data-action="duel-rematch">' + (m.winner === 0 ? "Climb to rung " + this.ladder.next : "Retry rung " + m.ladder.rung) + "</button>" : '<button class="primary-button" data-action="duel-rematch">Rematch</button>') + '<button data-action="duel-select">Character select & ladder</button><button data-action="duel-quit">Return to the start page</button>';
        if (m.ladder) {
          title = m.winner === 0 ? this.ladder.next > 12 ? "The ladder is yours." : "Rung " + m.ladder.rung + " conquered." : m.ladder.name + " holds the rung.";
          copy += " " + (m.winner === 0 ? "Your next rung is saved." : "Your climb stays at this rung.");
        }
      }
      if (m.phase === "finished") copy += " " + (this.reward?.coins ? "+" + this.reward.coins + " Substrate coins." : "A loss grants no coins.") + (this.reward?.card ? " " + this.reward.card.name + (this.reward.card.duplicate ? " remembered again." : " card found.") : "");
      el.innerHTML = title ? `<div class="duel-round-card"><span class="eyebrow">${m.ladder ? "RUNG " + m.ladder.rung + " / 12 \xB7 " + m.ladder.name.toUpperCase() : "TWO SPARKS \xB7 ONE STAGE"}</span><h2>${title}</h2><p>${copy}</p>${guide}<div class="menu-actions">${buttons}</div></div>` : "";
      if ((this.paused || m.phase === "handoff" || m.phase === "finished") && !this.document.querySelector("dialog[open]")) el.querySelector("button")?.focus({ preventScroll: true });
    }
    draw() {
      const ctx2 = this.ctx;
      if (!ctx2) return;
      const rect = this.canvas.getBoundingClientRect(), w = Math.max(1, rect.width), h = Math.max(1, rect.height), dpr = Math.min(2, this.window.devicePixelRatio ?? 1);
      if (this.canvas.width !== Math.round(w * dpr) || this.canvas.height !== Math.round(h * dpr)) {
        this.canvas.width = Math.round(w * dpr);
        this.canvas.height = Math.round(h * dpr);
      }
      ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx2.fillStyle = "#081610";
      ctx2.fillRect(0, 0, w, h);
      const scale = Math.min(w / 960, h / 540);
      ctx2.save();
      ctx2.translate((w - 960 * scale) / 2, (h - 540 * scale) / 2);
      ctx2.scale(scale, scale);
      const m = this.match, stage = DUEL_STAGES[m?.stage ?? this.config.stage], time = (m?.frames ?? 0) / 60, setting = this.settings();
      this.drawStage(ctx2, hasAlcove(this.keepsakes(), "stage-palette") && stage === DUEL_STAGES.glass ? { ...stage, color: "#e3c078", name: "Threshold Glass \xB7 dusk" } : stage, time, m);
      if (m) {
        ctx2.save();
        const hit = m.events.filter((e2) => e2.type === "hit" && m.frames - e2.frame < 9).at(-1);
        if (hit && !setting.reduced && setting.shake > 0) {
          const amount = (9 - (m.frames - hit.frame)) * 0.45 * setting.shake;
          ctx2.translate(Math.sin(m.frames * 3) * amount, Math.cos(m.frames * 4) * amount);
        }
        for (let i = 0; i < 2; i++) this.drawFighter(ctx2, m, i, time, setting);
        this.drawImpact(ctx2, m, setting);
        for (const bolt2 of m.bolts) this.drawBolt(ctx2, bolt2, m, setting);
        ctx2.restore();
        this.drawHud(ctx2, m);
      } else {
        ctx2.textAlign = "center";
        ctx2.fillStyle = "#d9c58e";
        ctx2.font = "24px Georgia";
        ctx2.fillText("Two sparks. One stage.", 480, 240);
      }
      ctx2.restore();
    }
    drawStage(ctx2, stage, time, m) {
      const tint = stage.color, setting = this.settings(), atlas = this.art.stages, index = { glass: 0, tide: 1, root: 2, basalt: 3, night: 4, orbit: 5 }[stage.look];
      ctx2.fillStyle = "#09171c";
      ctx2.fillRect(0, 0, 960, 540);
      if (atlas?.complete && atlas.naturalWidth) {
        const sw = atlas.naturalWidth / 2, sh = atlas.naturalHeight / 3, parallax = ((m?.fighters[0].x ?? 290) + (m?.fighters[1].x ?? 670) - 960) * 0.018;
        ctx2.drawImage(atlas, index % 2 * sw, Math.floor(index / 2) * sh, sw, sh, -25 + parallax, 0, 1010, 540);
        const fade = ctx2.createLinearGradient(0, 0, 0, 250);
        if (fade?.addColorStop) {
          fade.addColorStop(0, "#06101a80");
          fade.addColorStop(1, "#06101a00");
          ctx2.fillStyle = fade;
          ctx2.fillRect(0, 0, 960, 260);
        }
      } else {
        ctx2.fillStyle = "#13272b";
        ctx2.fillRect(0, 120, 960, 310);
        ctx2.strokeStyle = tint + "35";
        ctx2.lineWidth = 8;
        for (let x = -60; x < 1060; x += 160) {
          ctx2.beginPath();
          ctx2.moveTo(x, 435);
          ctx2.lineTo(x, 260);
          ctx2.bezierCurveTo(x, 100, x + 140, 100, x + 140, 260);
          ctx2.lineTo(x + 140, 435);
          ctx2.stroke();
        }
      }
      if (stage.name.includes("dusk")) {
        ctx2.save();
        ctx2.globalCompositeOperation = "soft-light";
        ctx2.fillStyle = "#d09b55";
        ctx2.globalAlpha = 0.32;
        ctx2.fillRect(0, 0, 960, 540);
        ctx2.restore();
      }
      ctx2.fillStyle = "#07121450";
      ctx2.fillRect(0, 430, 960, 110);
      ctx2.strokeStyle = tint + "80";
      ctx2.lineWidth = 1.5;
      ctx2.beginPath();
      ctx2.moveTo(0, 436);
      ctx2.lineTo(960, 436);
      ctx2.stroke();
      if (!setting.reduced) {
        for (let j = 0; j < 23; j++) {
          const x = (j * 157.7 + Math.sin(time * 0.25 + j) * 22) % 960, y = 410 - (time * (6 + j % 4) + j * 53) % 260;
          ctx2.globalAlpha = 0.12 + j % 4 * 0.055;
          ctx2.fillStyle = tint;
          ctx2.beginPath();
          ctx2.arc(x, y, j % 3 === 0 ? 1.5 : 0.8, 0, Math.PI * 2);
          ctx2.fill();
        }
        ctx2.globalAlpha = 1;
      }
      const shade = ctx2.createRadialGradient(480, 325, 220, 480, 325, 600);
      if (shade?.addColorStop) {
        shade.addColorStop(0, "#07101a00");
        shade.addColorStop(1, "#04090ec0");
        ctx2.fillStyle = shade;
        ctx2.fillRect(0, 0, 960, 540);
      }
      ctx2.textAlign = "center";
      ctx2.font = "10px sans-serif";
      ctx2.fillStyle = tint + "aa";
      ctx2.fillText(stage.name.toUpperCase(), 480, 519);
    }
    drawFighter(ctx2, m, i, time, setting) {
      const f = m.fighters[i], groundY = 435, ko = f.hp <= 0, seal = m.phase === "finisher" && i === 1 - m.winner, p = seal ? 1 - m.breakFrames / 120 : 0;
      ctx2.save();
      if (seal) {
        ctx2.strokeStyle = COLOR[i];
        ctx2.lineWidth = 2;
        ctx2.beginPath();
        ctx2.ellipse(f.x, groundY, 48 * (1 - p) + 12, 12, 0, 0, Math.PI * 2);
        ctx2.stroke();
        ctx2.save();
        ctx2.translate(f.x, groundY);
        ctx2.scale(1, 0.35);
        ctx2.beginPath();
        const sides = { spark: 4, human: 5, computer: 4, animal: 3, tree: 6, rock: 6, collector: 3, archon: 4, cantor: 8 }[f.form];
        for (let j = 0; j <= sides; j++) {
          const a = j / sides * Math.PI * 2 - Math.PI / 2, x = Math.cos(a) * 31, y2 = Math.sin(a) * 31;
          if (j === 0) ctx2.moveTo(x, y2);
          else ctx2.lineTo(x, y2);
        }
        ctx2.stroke();
        ctx2.beginPath();
        ctx2.moveTo(-20, 0);
        ctx2.lineTo(20, 0);
        ctx2.moveTo(0, -24);
        ctx2.lineTo(0, 24);
        ctx2.stroke();
        ctx2.restore();
      }
      const size = f.crouch ? 108 : 145, y = groundY - f.y - size * 0.4 + (ko ? 18 : 0);
      if (ko) {
        ctx2.save();
        ctx2.beginPath();
        ctx2.rect(0, 0, 960, groundY + 2);
        ctx2.clip();
      }
      if (ko && f.form !== "spark") {
        ctx2.save();
        ctx2.translate(f.x, groundY - 15);
        ctx2.rotate(f.facing * 1.1);
        ctx2.translate(-f.x, -(groundY - 15));
      }
      ctx2.save();
      ctx2.fillStyle = "#00000080";
      ctx2.beginPath();
      ctx2.ellipse(f.x, groundY + 3, Math.max(25, 82 - f.y * 0.13), 13, 0, 0, Math.PI * 2);
      ctx2.fill();
      ctx2.strokeStyle = COLOR[i] + "45";
      ctx2.lineWidth = 1;
      ctx2.beginPath();
      ctx2.ellipse(f.x, groundY + 3, 62, 9, 0, 0, Math.PI * 2);
      ctx2.stroke();
      ctx2.restore();
      this.drawBody(ctx2, f, groundY - f.y, time, setting, seal ? Math.max(0, 1 - p) : ko ? 0.5 : 1);
      if (ko && f.form !== "spark") ctx2.restore();
      if (ko) ctx2.restore();
      if (ko || seal) {
        ctx2.fillStyle = COLOR[i];
        ctx2.beginPath();
        ctx2.arc(f.x, groundY - 70 + (seal ? p * 70 : -(120 - m.breakFrames) * 0.5), 10 * (seal ? 1 - p : 1), 0, Math.PI * 2);
        ctx2.fill();
      }
      if (f.focusCharge > 0 || f.focusGuard > 0) {
        ctx2.strokeStyle = f.focusGuard > 0 ? "#a3f3e6" : "#dfc58a";
        ctx2.lineWidth = f.focusGuard > 0 ? 4 : 1.5;
        ctx2.beginPath();
        ctx2.arc(f.x, y, 55 + f.focusCharge * 0.5, 0, Math.PI * 2);
        ctx2.stroke();
      }
      if (f.blocking || f.guard > 0) {
        ctx2.save();
        ctx2.translate(f.x + f.facing * 65, groundY - f.y - 100);
        ctx2.scale(f.facing, 1);
        ctx2.strokeStyle = COLOR[i];
        ctx2.lineWidth = 3;
        ctx2.beginPath();
        ctx2.arc(0, 0, 54, -Math.PI / 2, Math.PI / 2);
        ctx2.stroke();
        ctx2.restore();
      }
      if (f.root > 0) {
        ctx2.strokeStyle = "#9cd5a5";
        ctx2.lineWidth = 3;
        for (let j = -2; j <= 2; j++) {
          ctx2.beginPath();
          ctx2.moveTo(f.x + j * 12, groundY);
          ctx2.lineTo(f.x + j * 6, y + 35);
          ctx2.stroke();
        }
      }
      if (f.attack) {
        const attack4 = f.attack, base = DUEL_MOVES[attack4.kind], tech = attack4.technique ? DUEL_TECHNIQUES[f.form][attack4.technique] : null, move2 = { ...base, ...tech, startup: attack4.startup ?? base.startup }, active = attack4.frame >= move2.startup && attack4.frame < move2.startup + move2.active;
        const low = attack4.kind === "lk" || tech?.low || attack4.kind === "special" && !tech && f.form === "rock", rising = attack4.kind === "launcher" || tech?.launcher, reach = move2.range, height = low ? groundY - f.y - 25 : groundY - f.y - 110;
        const tint = POWER_COLORS[f.form];
        ctx2.save();
        ctx2.globalCompositeOperation = "screen";
        ctx2.strokeStyle = tint + (active ? "ee" : "55");
        ctx2.lineWidth = active ? 5 : 1.5;
        if (tech?.radial || attack4.kind === "special" && ["spark", "cantor"].includes(f.form)) {
          ctx2.beginPath();
          ctx2.arc(f.x, height, 40 + Math.min(1, attack4.frame / move2.startup) * 80, 0, Math.PI * 2);
          ctx2.stroke();
        } else if (tech?.bolt || attack4.kind === "special" && ["computer", "archon", "rock"].includes(f.form)) {
          ctx2.setLineDash(active ? [] : [7, 9]);
          ctx2.beginPath();
          ctx2.moveTo(f.x + f.facing * 70, height);
          ctx2.lineTo(f.x + f.facing * Math.min(reach, 340), height);
          ctx2.stroke();
        } else if (active) {
          ctx2.translate(f.x, height);
          ctx2.scale(f.facing, 1);
          ctx2.beginPath();
          ctx2.moveTo(65, rising ? 40 : low ? 4 : -22);
          ctx2.bezierCurveTo(130, rising ? -35 : low ? -5 : -55, reach - 20, rising ? -100 : low ? -10 : -20, reach, rising ? -120 : low ? 0 : 12);
          ctx2.stroke();
          ctx2.globalAlpha = 0.35;
          ctx2.lineWidth = 11;
          ctx2.stroke();
        } else {
          ctx2.beginPath();
          ctx2.arc(f.x + f.facing * 65, height, 12 + Math.min(1, attack4.frame / move2.startup) * 7, 0, Math.PI * 2);
          ctx2.stroke();
        }
        ctx2.restore();
      }
      ctx2.restore();
      if (m.cinematic > 0) {
        if (f.attack?.kind === "super") {
          ctx2.save();
          ctx2.globalAlpha = 0.35;
          ctx2.strokeStyle = COLOR[i];
          ctx2.lineWidth = 2;
          for (let j = 0; j < 3; j++) {
            ctx2.beginPath();
            ctx2.arc(f.x, y, 48 + j * 18 + (72 - m.cinematic) * 0.35, 0, Math.PI * 2);
            ctx2.stroke();
          }
          ctx2.restore();
          ctx2.fillStyle = COLOR[i];
          ctx2.textAlign = "center";
          ctx2.font = "500 12px sans-serif";
          ctx2.fillText(NAMES[f.form].toUpperCase() + " \xB7 RESONANCE", 480, 116);
        }
        ctx2.fillStyle = "#0a111acc";
        ctx2.fillRect(0, 0, 960, 14);
        ctx2.fillRect(0, 424, 960, 16);
      }
      if (setting.damageNumbers) {
        const hit = m.events.filter((e2) => e2.defender === i && e2.damage && m.frames - e2.frame < 36).at(-1);
        if (hit) {
          ctx2.fillStyle = COLOR[i];
          ctx2.textAlign = "center";
          ctx2.font = "bold 18px sans-serif";
          ctx2.fillText("\u2212" + hit.damage, f.x, y - 65 - (m.frames - hit.frame));
        }
      }
    }
    drawBolt(ctx2, bolt2, m, setting) {
      const tint = POWER_COLORS[bolt2.form] ?? "#8deeee", y = 435 - bolt2.y;
      ctx2.save();
      ctx2.globalCompositeOperation = "screen";
      ctx2.strokeStyle = tint;
      ctx2.lineWidth = 3;
      ctx2.beginPath();
      const history = bolt2.trail ?? [];
      if (history.length) {
        ctx2.moveTo(history[0].x, 435 - history[0].y);
        for (const p of history) ctx2.lineTo(p.x, 435 - p.y);
      } else ctx2.moveTo(bolt2.x - bolt2.vx * 5, y);
      ctx2.lineTo(bolt2.x, y);
      ctx2.stroke();
      ctx2.translate(bolt2.x, y);
      ctx2.fillStyle = tint;
      ctx2.beginPath();
      if (bolt2.form === "tree") {
        ctx2.moveTo(-13, 7);
        ctx2.lineTo(-3, -9);
        ctx2.lineTo(8, 0);
        ctx2.lineTo(13, 7);
        ctx2.lineTo(0, 3);
      } else if (bolt2.form === "rock") {
        ctx2.moveTo(-12, 6);
        ctx2.lineTo(-3, -10);
        ctx2.lineTo(8, -6);
        ctx2.lineTo(12, 7);
        ctx2.lineTo(-2, 4);
      } else {
        ctx2.moveTo(12, 0);
        ctx2.lineTo(0, -7);
        ctx2.lineTo(-9, 0);
        ctx2.lineTo(0, 7);
      }
      ctx2.closePath();
      ctx2.fill();
      ctx2.strokeStyle = "#f0ffff";
      ctx2.lineWidth = 1;
      ctx2.stroke();
      ctx2.fillStyle = "#fff5dd";
      ctx2.beginPath();
      ctx2.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx2.fill();
      ctx2.restore();
    }
    drawImpact(ctx2, m, setting) {
      for (const e2 of m.events) {
        const age = m.frames - e2.frame;
        if (age < 0 || age > 16 || !["hit", "chip", "block", "focus-guard", "tech"].includes(e2.type)) continue;
        const f = m.fighters[e2.defender ?? e2.player], x = f.x - (m.fighters[e2.attacker ?? 1 - (e2.player ?? 0)]?.facing ?? 1) * 70, y = 435 - f.y - (e2.low ? 28 : 105), p = age / 16;
        const color = e2.type === "block" || e2.type === "focus-guard" ? "#9df4ef" : COLOR[e2.attacker ?? e2.player ?? 0];
        ctx2.save();
        ctx2.globalAlpha = (1 - p) * (setting.reduced ? 0.45 : 1);
        ctx2.globalCompositeOperation = "screen";
        ctx2.strokeStyle = color;
        ctx2.lineWidth = e2.counter ? 3 : 2;
        const rays = e2.counter ? 10 : 7;
        for (let j = 0; j < rays; j++) {
          const angle = j / rays * Math.PI * 2 + e2.id % 11 * 0.2, near = 3 + p * 10, far = (e2.counter ? 32 : 22) * (1 + p);
          ctx2.beginPath();
          ctx2.moveTo(x + Math.cos(angle) * near, y + Math.sin(angle) * near);
          ctx2.lineTo(x + Math.cos(angle) * far, y + Math.sin(angle) * far);
          ctx2.stroke();
        }
        ctx2.beginPath();
        ctx2.arc(x, y, 4 + p * 27, 0, Math.PI * 2);
        ctx2.stroke();
        ctx2.restore();
      }
    }
    drawHud(ctx2, m) {
      ctx2.save();
      for (let i = 0; i < 2; i++) {
        const f = m.fighters[i], x = i ? 565 : 40;
        ctx2.fillStyle = "#08180fe8";
        ctx2.fillRect(x - 8, 19, 363, 72);
        ctx2.fillStyle = "#36513c";
        ctx2.fillRect(x, 43, 345, 12);
        ctx2.fillStyle = COLOR[i];
        ctx2.fillRect(i ? x + 345 * (1 - f.hp / f.maxHp) : x, 43, 345 * f.hp / f.maxHp, 12);
        ctx2.fillStyle = COLOR[i];
        ctx2.textAlign = i ? "right" : "left";
        ctx2.font = "600 16px sans-serif";
        ctx2.fillText("P" + (i + 1) + " \xB7 " + NAMES[f.form], i ? x + 345 : x, 36);
        ctx2.fillStyle = "#9caf9c";
        ctx2.fillRect(x, 64, 260, 4);
        ctx2.fillStyle = COLOR[i];
        ctx2.fillRect(x, 64, 260 * f.meter / 100, 4);
        ctx2.font = "10px sans-serif";
        ctx2.fillStyle = "#c8d7c6";
        ctx2.fillText(f.meter >= 100 ? "SUPER READY" : "METER " + Math.floor(f.meter) + " / 100", i ? x + 345 : x, 83);
        for (let j = 0; j < 2; j++) {
          ctx2.beginPath();
          ctx2.arc(x + 285 + j * 20, 66, 5, 0, Math.PI * 2);
          ctx2.fillStyle = j < f.rounds ? COLOR[i] : "#3b5542";
          ctx2.fill();
        }
        drawCooldownRing(ctx2, i ? 525 : 435, 77, 1 - f.cooldown / m.rules.cooldown, this.profile() === "controller" && (!i || this.padCount > 1) ? "RB" : this.profile() === "mobile" ? "P" : i ? "O" : "R", COLOR[i], 12);
      }
      ctx2.fillStyle = "#efe0ba";
      ctx2.font = "bold 30px Georgia";
      ctx2.textAlign = "center";
      ctx2.fillText(String(Math.ceil(m.clock)).padStart(2, "0"), 480, 46);
      ctx2.font = "10px sans-serif";
      ctx2.fillText("ROUND " + m.round + (m.replay ? " \xB7 REPLAY" : ""), 480, 62);
      ctx2.fillStyle = "#d4d2b9";
      ctx2.font = "11px sans-serif";
      ctx2.fillText((m.ladder ? "RUNG " + m.ladder.rung + " \xB7 " : "") + DUEL_CONDITIONS[m.condition].name.toUpperCase() + (m.bonusHp ? " \xB7 OPPONENT +" + m.bonusHp + " HP" : ""), 480, 108);
      const response2 = m.events.filter((e2) => ["tech", "hit"].includes(e2.type) && m.frames - e2.frame < 40).at(-1);
      if (response2 && (response2.type === "tech" || response2.counter)) {
        ctx2.fillStyle = "#f0d394";
        ctx2.fillText(response2.type === "tech" ? "THROW BROKEN" : "COUNTER HIT", 480, 132);
      }
      for (let i = 0; i < 2; i++) {
        const f = m.fighters[i], x = i ? 900 : 60;
        ctx2.textAlign = i ? "right" : "left";
        if (f.combo.hits > 1 && f.combo.display > 0) {
          ctx2.fillStyle = COLOR[i];
          ctx2.font = "bold 22px Georgia";
          ctx2.fillText(f.combo.hits + " HIT CHAIN", x, 147);
          ctx2.font = "11px sans-serif";
          ctx2.fillText(Math.round(f.combo.damage) + " DAMAGE", x, 164);
        }
        if (f.lastTechnique && m.frames - f.lastTechnique.frame < 100) {
          ctx2.fillStyle = COLOR[i];
          ctx2.font = "12px Georgia";
          ctx2.fillText(f.lastTechnique.name, x, 186);
        }
      }
      ctx2.restore();
    }
    observe() {
      return { ...observeDuel(this.match), ladderRecord: { ...this.ladder }, conditions: DUEL_CONDITIONS };
    }
    control(inputs, frames = 1) {
      if (!this.match || this.paused || this.document.querySelector("dialog[open]")) throw Error("The duel is not accepting input.");
      stepDuel(this.match, inputs, frames);
      this.tick(0);
      return this.observe();
    }
  };

  // sideways-engine.js?v=0.13.0
  var SIDE_KEY = "spark-substrate-sideways-v1";
  var SIDE_FORMS = ["spark", "human", "computer", "animal", "tree", "rock"];
  var SIDE_NAMES = { spark: "Spark", human: "Human", computer: "Computer", animal: "Animal", tree: "Tree", rock: "Rock" };
  var SIDE_COLORS = { spark: "#f1d188", human: "#e7c19c", computer: "#81e5ef", animal: "#c8daaa", tree: "#a0dcad", rock: "#c2b4e0" };
  var SIDE_TRAITS = {
    spark: { speed: 285, jump: 680, desc: "Hold Jump in the air to drift. Lumen strikes travel through the dark." },
    human: { speed: 290, jump: 670, desc: "A steady stride. Rally restores health and grants a brief guard." },
    computer: { speed: 280, jump: 665, desc: "Prism shots reach farther. Air dash crosses gaps; Overclock fires a volley." },
    animal: { speed: 325, jump: 695, desc: "Jump again in the air. Pounce carries a feral strike into the landing." },
    tree: { speed: 245, jump: 670, desc: "Living doors answer you. Root hold binds enemies and grows temporary steps." },
    rock: { speed: 235, jump: 670, desc: "Fault doors answer your weight. Fault guard breaks bolts with a shockwave." }
  };
  var room = (world, name, coord, extra = {}) => ({ world, name, coord, width: 1900, height: 820, floor: 620, layout: "steps", ...extra, doors: [] });
  var SIDE_ROOMS = {
    threshold: room("stratum", "The Threshold", [0, 0], { safe: true, width: 1500, layout: "hall", clue: "Walk the causeway. The echo forge remembers a guardian; the reliquary remembers a key." }),
    glass: room("stratum", "The Glass Causeway", [1, 0], { layout: "arches", enemies: ["collector", "collector", "archon"], clue: "Jump over a cyan bolt. Strike from outside a collector\u2019s reach." }),
    machine: room("stratum", "Machine Sepulcher", [2, 0], { layout: "machine", enemies: ["archon", "collector", "archon"], clue: "The turrets mark their aim in cyan before releasing a shot." }),
    cistern: room("stratum", "The Resonant Cistern", [3, 0], { layout: "stairs", enemies: ["collector", "hound"], clue: "Climb the eastern ledges for Nacre\u2019s Reliquary. The Cantor waits along the lower route." }),
    forge: room("stratum", "The Echo Forge", [4, 0], { width: 1500, layout: "arena", boss: "cantor", clue: "A wind-up ring comes before the notes. Jump the low volley; leave the marked ground." }),
    reliquary: room("stratum", "Nacre\u2019s Reliquary", [3, -1], { layout: "reliquary", enemies: ["collector", "archon"], key: "ivory", secret: "feather", clue: "The Ivory Key answers the mirrors. A feather rests above a ledge no single jump can reach; return in another body." }),
    nursery: room("stratum", "The Mirror Nursery", [4, -1], { layout: "mirrors", enemies: ["mirror", "collector"], resonance: true, secretReturn: true, clue: "Six mirrors, one spark. Clear the room to learn resonance. The eastern living door remembers Tree. A feather may answer the high seam after the Cinder guardian falls." }),
    archive: room("stratum", "The Verdant Archive", [5, -1], { layout: "roots", enemies: ["collector", "hound", "archon"], clue: "Living wood opens the archive. The eastern stone passage needs Rock; borrow both shapes." }),
    belfry: room("stratum", "Obsidian Belfry", [6, -1], { layout: "stairs", enemies: ["archon", "hound"], key: "crown", clue: "A crown without a king. Return with the Crown Key and the Cantor\u2019s remembered note." }),
    eye: room("stratum", "The Demiurge\u2019s Eye", [7, -1], { width: 1560, layout: "arena", boss: "warden", seal: "stratum", clue: "The Warden guards the first seam. His seal opens the drowned province." }),
    "tide-harbor": room("tideglass", "The Unmoored Harbor", [8, -1], { safe: true, layout: "hall", clue: WORLDS.tideglass.desc }),
    "tide-archive": room("tideglass", "The Salt Archive", [9, -1], { layout: "tide", enemies: ["collector", "archon", "hound"], key: "pearl", clue: "The Pearl Key opens the throne back at the harbor. A Computer reads the prism sluice." }),
    "tide-throne": room("tideglass", "The Tidal Throne", [8, 0], { width: 1600, layout: "arena", boss: "tidekeeper", seal: "tideglass", clue: "Read the tidal marks. Jump the low fan when it reaches you." }),
    "grove-rest": room("verdant", "The Patient Grove", [8, 1], { safe: true, layout: "roots", clue: WORLDS.verdant.desc }),
    "grove-well": room("verdant", "The Rootwell", [9, 1], { layout: "roots", enemies: ["hound", "collector", "archon"], key: "seed", clue: "The Seed Key is held by the ancient root. Bring it back to the grove; a Tree can follow the canopy." }),
    "grove-heart": room("verdant", "The Thornmother\u2019s Heart", [8, 2], { width: 1650, layout: "arena", boss: "thornmother", seal: "verdant", clue: "Roots mark the floor before they rise. The leaf crown gathers light before its volley." }),
    "cinder-rest": room("cinder", "The Cold Anvil", [8, 3], { safe: true, layout: "machine", clue: WORLDS.cinder.desc }),
    "cinder-fuel": room("cinder", "The Fuel Chapel", [9, 3], { layout: "machine", enemies: ["archon", "collector", "archon", "hound"], key: "ember", clue: "The Ember Key waits beyond the constructs. Rock\u2019s weight answers the stopped clock gate." }),
    "cinder-throne": room("cinder", "The Regent\u2019s Furnace", [8, 4], { width: 1700, layout: "arena", boss: "regent", seal: "cinder", clue: "The clock gathers amber light. Leave its marked ground before the second hand falls." }),
    "night-rest": room("prism", "The Unlit Vestibule", [8, 5], { safe: true, layout: "arches", secretDoor: true, clue: "A feather from Nacre\u2019s Reliquary can answer a seam in this night. Look above the western steps." }),
    "night-library": room("prism", "The Dream Library", [9, 5], { layout: "mirrors", enemies: ["mirror", "hound", "archon", "mirror"], key: "dusk", clue: "The Dusk Key answers the Weaver\u2019s Nest. Only an Animal follows the trail through the shadow gate." }),
    "night-nest": room("prism", "The Weaver\u2019s Nest", [8, 6], { width: 1700, layout: "arena", boss: "weaver", seal: "prism", clue: "The Weaver pauses before each thread. Find the gap in the fan; jump the returning low note." }),
    "orbit-rest": room("orbit", "The Moonless Dock", [8, 7], { safe: true, layout: "hall", clue: WORLDS.orbit.desc }),
    "orbit-relay": room("orbit", "The Lunar Relay", [9, 7], { layout: "orbit", enemies: ["mirror", "archon", "hound", "archon"], key: "orbit", clue: "Light remembers a road. The Orbit Key opens the horizon; a Spark reveals the last light bridge." }),
    "orbit-throne": room("orbit", "The Curator\u2019s Horizon", [8, 8], { width: 1750, layout: "arena", boss: "curator", seal: "orbit", clue: "The Curator marks a place before the stars fall. Six seals complete the origin seam." }),
    "origin-seam": room("uncreated", "The Origin Seam", [8, 9], { safe: true, layout: "hall", clue: "All six seals answer. The last door accepts Human. The body falls. The spark remembers." }),
    "origin-heart": room("uncreated", "The Maker\u2019s Heart", [9, 9], { width: 1800, layout: "arena", boss: "demiurge", final: true, clue: "The Demiurge changes his law. Read the crown ring and leave the marked ground." })
  };
  function connect(a, b, options = {}) {
    const ra = SIDE_ROOMS[a], rb = SIDE_ROOMS[b], left = options.secret ? "seam" : options.branch ? "branch" : "east";
    ra.doors.push({ to: b, side: left, ...options });
    rb.doors.push({ to: a, side: options.secret ? "seam" : "west", return: true, ...options.secret ? { secret: true } : {}, ...options.returnForm ? { form: options.returnForm } : {} });
  }
  connect("threshold", "glass");
  connect("glass", "machine");
  connect("machine", "cistern");
  connect("cistern", "forge");
  connect("cistern", "reliquary", { branch: true });
  connect("reliquary", "nursery", { key: "ivory" });
  connect("nursery", "archive", { form: "tree" });
  connect("archive", "belfry", { form: "rock" });
  connect("belfry", "eye", { key: "crown", feat: "forge" });
  connect("eye", "tide-harbor", { seal: "stratum" });
  var regions = [["tide", "tideglass", "harbor", "archive", "throne", "pearl", "computer"], ["grove", "verdant", "rest", "well", "heart", "seed", "tree"], ["cinder", "cinder", "rest", "fuel", "throne", "ember", "rock"], ["night", "prism", "rest", "library", "nest", "dusk", "animal"], ["orbit", "orbit", "rest", "relay", "throne", "orbit", "spark"]];
  for (let i = 0; i < regions.length; i++) {
    const [prefix, world, rest, key, boss, lock, form] = regions[i];
    connect(prefix + "-" + rest, prefix + "-" + key, { form });
    connect(prefix + "-" + rest, prefix + "-" + boss, { key: lock, branch: true });
    const next = i < 4 ? regions[i + 1][0] + "-" + regions[i + 1][2] : "origin-seam";
    connect(prefix + "-" + boss, next, { seal: world });
  }
  connect("origin-seam", "origin-heart", { form: "human", allSeals: true });
  connect("nursery", "night-rest", { secret: true, seal: "cinder" });
  var clamp3 = (n, a, b) => Math.max(a, Math.min(b, n));
  var finite = (n, a, b) => Number.isFinite(n) && n >= a && n <= b;
  function sideGeometry(id) {
    const r = SIDE_ROOMS[id];
    if (!r) throw Error("Unknown side room.");
    const f = r.floor, w = r.width;
    const layouts = {
      hall: [[620, f - 92, 240], [1100, f - 180, 210]],
      steps: [[470, f - 90, 200], [730, f - 185, 180], [980, f - 280, 190], [1280, f - 175, 210], [1540, f - 85, 180]],
      arches: [[470, f - 105, 280], [840, f - 210, 170], [1120, f - 105, 290], [1500, f - 235, 190]],
      machine: [[460, f - 95, 170], [680, f - 190, 160], [1060, f - 100, 240], [1370, f - 205, 220], [1660, f - 115, 140]],
      stairs: [[460, f - 90, 210], [700, f - 180, 190], [930, f - 270, 200], [1160, f - 360, 240], [1450, f - 205, 200]],
      reliquary: [[470, f - 80, 240], [770, f - 175, 170], [980, f - 275, 210], [1270, f - 365, 230], [1010, f - 540, 200]],
      mirrors: [[500, f - 115, 170], [750, f - 230, 210], [1130, f - 170, 190], [1440, f - 280, 170], [1620, f - 90, 170]],
      roots: [[470, f - 85, 230], [770, f - 180, 240], [1050, f - 285, 180], [1350, f - 180, 240], [1610, f - 85, 160]],
      tide: [[420, f - 85, 200], [690, f - 180, 240], [1e3, f - 285, 200], [1340, f - 180, 190], [1590, f - 90, 160]],
      orbit: [[430, f - 100, 190], [710, f - 205, 160], [990, f - 310, 180], [1270, f - 200, 160], [1540, f - 95, 200]],
      arena: [[320, f - 90, 180], [w - 490, f - 90, 180]]
    };
    const platforms = (layouts[r.layout] ?? layouts.steps).map(([x, y, width], i) => ({ id: "ledge-" + i, x, y, w: width, h: 22, oneWay: true }));
    const doors = r.doors.map((d) => ({ ...d, x: d.secret ? 620 : d.side === "west" ? 95 : d.branch && id === "cistern" ? 1270 : d.branch ? Math.round(w * 0.56) : w - 95, y: d.secret ? f - (id === "nursery" ? 115 : 105) : d.branch && id === "cistern" ? f - 360 : f }));
    const pits = ["tide-archive", "orbit-relay"].includes(id) ? [{ x: 1180, w: 130 }] : [];
    let start2 = 0;
    for (const pit of pits) {
      platforms.push({ id: "floor-" + start2, x: start2, y: f, w: pit.x - start2, h: 220 });
      start2 = pit.x + pit.w;
    }
    platforms.push({ id: "floor-" + start2, x: start2, y: f, w: w - start2, h: 220 });
    return { platforms, doors, pits, checkpoint: { x: 230, y: f }, secret: { x: 1110, y: f - 540 } };
  }
  function emit2(s, type, text = "", x = s.player.x, y = s.player.y) {
    s.events.push({ id: ++s.eventSerial, type, text, x, y, time: s.time });
    if (s.events.length > 40) s.events.shift();
    if (text) s.notice = text;
  }
  function spawnRoom(s) {
    const r = SIDE_ROOMS[s.room], rank = WORLD_ORDER.indexOf(r.world), floor = r.floor;
    s.enemies = [];
    s.bolts = [];
    s.marks = [];
    s.bridges = [];
    if (!s.cleared.includes(s.room)) for (let i = 0; i < (r.enemies ?? []).length; i++) {
      const kind = r.enemies[i], hp = kind === "archon" ? 52 + rank * 12 : 60 + rank * 14;
      s.enemies.push({ id: s.room + "-" + i, kind, x: 680 + i * 280, y: floor, vx: 0, hp, maxHp: hp, clock: 1.3 + i * 0.45, windup: 0, facing: -1, root: 0, flash: 0 });
    }
    if (r.boss && !s.cleared.includes(s.room)) {
      const hp = { cantor: 600, warden: 780 }[r.boss] ?? 900 + rank * 150;
      s.enemies.push({ id: s.room + "-guardian", kind: r.boss, boss: true, x: r.width * 0.69, y: floor, hp, maxHp: hp, clock: 2.4, windup: 0, phase: 1, facing: -1, root: 0, flash: 0 });
    }
  }
  function createSideJourney() {
    const s = { schema: 1, room: "threshold", form: "spark", phase: "playing", time: 0, keys: [], seals: [], forms: ["spark"], visited: ["threshold"], cleared: ["threshold"], memories: [], secrets: [], opened: [], journal: [], falls: 0, damage: 0, eventSerial: 0, events: [], notice: "A spark against the pattern.", checkpoint: { room: "threshold", x: 230, y: 620 }, player: { x: 270, y: 620, vx: 0, vy: 0, hp: 130, maxHp: 130, facing: 1, grounded: true, coyote: 6, jumpBuffer: 0, jumps: 0, drift: 0, invuln: 0, dash: 0, dashCooldown: 0, powerCooldown: 0, attack: null, attackCooldown: 0, walk: 0 }, previous: {} };
    spawnRoom(s);
    recordRoom(s);
    return s;
  }
  function recordRoom(s) {
    const r = SIDE_ROOMS[s.room];
    if (!s.visited.includes(s.room)) s.visited.push(s.room);
    if (!s.journal.some((j) => j.room === s.room)) s.journal.push({ room: s.room, title: r.name, text: r.clue });
  }
  function sideDoorStatus(s, door) {
    if (door.secret && !s.secrets.includes("feather")) return { open: false, reason: "Feather \xB7 Nacre\u2019s Reliquary \xB7 return as Animal" };
    if (door.secret && !s.seals.includes("cinder")) return { open: false, reason: "The Cinder Regent\u2019s seal opens Prism Night" };
    if (door.key && !s.keys.includes(door.key)) return { open: false, reason: KEYS[door.key].name + " \xB7 " + KEYS[door.key].place };
    if (door.form && s.form !== door.form) return { open: false, reason: "Become " + SIDE_NAMES[door.form] + " \xB7 Q vessels" };
    if (door.feat && !s.cleared.includes(door.feat)) return { open: false, reason: "Remember the Cantor \xB7 The Echo Forge" };
    if (door.seal && !s.seals.includes(door.seal)) return { open: false, reason: "Guardian seal \xB7 " + WORLDS[door.seal].name };
    if (door.allSeals && !WORLD_ORDER.slice(0, 6).every((w) => s.seals.includes(w))) return { open: false, reason: "All six guardian seals" };
    const boss = s.enemies.find((e2) => e2.boss && e2.hp > 0);
    if (boss) return { open: false, reason: sideEnemyName(boss.kind) + " holds the arena \xB7 checkpoint escape in Pause" };
    return { open: true, reason: "OPEN" };
  }
  function enterSideRoom(s, id, from = s.room) {
    if (!SIDE_ROOMS[id]) throw Error("Unknown side room.");
    s.room = id;
    const r = SIDE_ROOMS[id], g = sideGeometry(id), door = g.doors.find((d) => d.to === from);
    const p = s.player;
    p.x = door ? clamp3(door.x + (door.side === "west" ? 90 : -90), 50, r.width - 50) : 270;
    p.y = door?.y ?? r.floor;
    p.vx = 0;
    p.vy = 0;
    p.grounded = true;
    p.attack = null;
    p.invuln = Math.max(p.invuln, 0.6);
    p.jumps = 0;
    p.coyote = 6;
    s.arrivalGrace = 0.6;
    s.previous = {};
    spawnRoom(s);
    recordRoom(s);
    emit2(s, "room", r.name + " \xB7 " + r.clue);
    if (r.safe) {
      s.checkpoint = { room: id, x: 230, y: r.floor };
      p.hp = p.maxHp;
      emit2(s, "checkpoint", "Checkpoint remembered \xB7 health restored.", 230, r.floor);
      if (!s.cleared.includes(id)) s.cleared.push(id);
    }
  }
  function sideEnemyName(kind) {
    return WORLD_GUARDIANS[kind]?.name ?? ({ cantor: "The Cantor", warden: "The Warden", collector: "Collector", archon: "Archon", hound: "Hound", mirror: "Mirror construct" }[kind] ?? kind);
  }
  function sideInteract(s) {
    if (s.phase !== "playing") return false;
    const p = s.player, g = sideGeometry(s.room), r = SIDE_ROOMS[s.room];
    const nearest = g.doors.toSorted((a, b) => Math.hypot(p.x - a.x, p.y - a.y) - Math.hypot(p.x - b.x, p.y - b.y))[0];
    if (nearest && Math.abs(p.y - nearest.y) < 60 && Math.hypot(p.x - nearest.x, p.y - nearest.y) < 100) {
      if ((s.arrivalGrace ?? 0) > 0) {
        emit2(s, "hint", "Step away from the arrival glyph before crossing again.");
        return false;
      }
      const status = sideDoorStatus(s, nearest);
      if (!status.open) {
        emit2(s, "hint", status.reason);
        return false;
      }
      if (nearest.secret && !s.secrets.includes("feather-path")) {
        s.secrets.push("feather-path");
        p.maxHp += 20;
        p.hp = Math.min(p.maxHp, p.hp + 20);
        s.journal.push({ room: s.room, title: "Feather", text: "A feather from Nacre\u2019s Reliquary opened a seam between the Mirror Nursery and Prism Night." });
        emit2(s, "secret", "FEATHER PATH \xB7 the Mirror Nursery and Prism Night remember each other. +20 health capacity.");
      }
      enterSideRoom(s, nearest.to);
      return true;
    }
    if (Math.hypot(p.x - g.checkpoint.x, p.y - g.checkpoint.y) < 90) {
      if (s.enemies.some((e2) => e2.hp > 0)) {
        emit2(s, "hint", "Clear this room to remember its glyph.");
        return false;
      }
      s.checkpoint = { room: s.room, x: g.checkpoint.x, y: g.checkpoint.y };
      p.hp = p.maxHp;
      emit2(s, "checkpoint", "Checkpoint remembered \xB7 health restored.");
      return true;
    }
    emit2(s, "hint", nearest && Math.abs(p.x - nearest.x) < 100 && Math.abs(p.y - nearest.y) >= 60 ? "Climb to the door\u2019s ledge before crossing." : "Move closer to a door or checkpoint glyph.");
    return false;
  }
  function morphSide(s, form) {
    if (s.phase !== "playing" || !s.forms.includes(form)) throw Error("Clear the Mirror Nursery to remember all six vessels.");
    if (s.form === form) return;
    s.form = form;
    s.player.attack = null;
    s.player.jumps = Math.max(s.player.jumps, 1);
    s.player.drift = 0;
    emit2(s, "morph", SIDE_NAMES[form] + " \xB7 " + SIDE_TRAITS[form].desc);
  }
  function sideDamage(s, amount) {
    const p = s.player;
    if (s.phase !== "playing" || p.invuln > 0 || p.dash > 0) return false;
    p.hp = Math.max(0, p.hp - amount);
    p.invuln = 1;
    p.flash = 0.18;
    emit2(s, "damage", "", p.x, p.y - 40);
    if (p.hp === 0) {
      s.phase = "fallen";
      s.falls++;
      p.vx = 0;
      p.vy = 0;
      emit2(s, "fall", "The body falls. The spark remembers.");
    }
    return true;
  }
  function respawnSide(s) {
    if (!["fallen", "playing"].includes(s.phase)) throw Error("This journey is complete.");
    const cp = structuredClone(s.checkpoint);
    s.phase = "playing";
    enterSideRoom(s, cp.room, "");
    s.player.x = cp.x;
    s.player.y = cp.y;
    s.player.hp = s.player.maxHp;
    s.player.powerCooldown = 0;
    s.player.invuln = 1;
    s.previous = {};
    emit2(s, "checkpoint", "The spark returns to its remembered glyph.");
  }
  function hitEnemy(s, e2, damage) {
    if (e2.hp <= 0) return;
    e2.hp = Math.max(0, e2.hp - damage);
    s.damage += damage;
    e2.flash = 0.13;
    emit2(s, "hit", "", e2.x, e2.y - 55);
    if (!e2.hp) emit2(s, e2.boss ? "boss-down" : "enemy-down", e2.boss ? sideEnemyName(e2.kind) + " \xB7 DEFEATED" : "", e2.x, e2.y);
  }
  function bolt(s, x, y, dx, dy, damage, enemy = false, guardian = false, speed = 330) {
    const len = Math.hypot(dx, dy) || 1;
    s.bolts.push({ x, y, px: x, py: y, vx: dx / len * speed, vy: dy / len * speed, damage, enemy, guardian, life: 4.5, color: enemy ? guardian ? "#f6be76" : "#75e8ed" : SIDE_COLORS[s.form] });
  }
  function attack3(s, kind) {
    const p = s.player;
    if (p.attackCooldown > 0 || p.dash > 0) return;
    const heavy = kind === "heavy", damage = (heavy ? 30 : 20) + s.memories.length * 2 + s.seals.length * 3 + (s.form === "rock" ? 6 : 0);
    p.attack = { kind: heavy ? "hk" : "lp", frame: 0, total: heavy ? 29 : 21, hit: false, damage };
    p.attackCooldown = (heavy ? 0.5 : 0.36) / (p.overclock > 0 ? 2 : 1);
    emit2(s, "strike");
  }
  function sidePower(s) {
    const p = s.player;
    if (s.phase !== "playing" || p.powerCooldown > 0) return false;
    p.powerCooldown = VESSEL_POWERS[s.form].cooldown;
    const rank = s.memories.length * 3;
    if (s.form === "computer") {
      for (const angle of [-0.22, 0, 0.22]) bolt(s, p.x, p.y - 38, p.facing * Math.cos(angle), Math.sin(angle), 32 + rank, false, false, 570);
      p.attackCooldown = 0;
      p.overclock = 4;
    } else {
      for (const e2 of s.enemies) if (e2.hp > 0 && Math.hypot(e2.x - p.x, (e2.y - p.y) * 0.5) < (s.form === "rock" ? 260 : 210)) {
        hitEnemy(s, e2, { spark: 70, human: 55, animal: 75, tree: 48, rock: 100 }[s.form] + rank);
        if (s.form === "tree") e2.root = 2.3;
      }
      if (["spark", "rock"].includes(s.form)) s.bolts = s.bolts.filter((b) => !b.enemy || Math.hypot(b.x - p.x, b.y - (p.y - 30)) > 270);
      if (s.form === "human") {
        p.hp = Math.min(p.maxHp, p.hp + 18);
        p.invuln = 1.3;
      }
      if (s.form === "tree") {
        p.hp = Math.min(p.maxHp, p.hp + 12);
        s.bridges = [{ x: clamp3(p.x + p.facing * 50, 40, SIDE_ROOMS[s.room].width - 160), y: p.y - 95, w: 160, h: 16, oneWay: true, life: 12 }];
      }
      if (s.form === "animal") {
        p.vx = p.facing * 650;
        p.vy = -440;
        p.grounded = false;
        p.pounce = 0.38;
        p.pounceLanding = true;
        p.invuln = 0.45;
      }
      if (s.form === "rock") p.invuln = 4;
    }
    emit2(s, "power", VESSEL_POWERS[s.form].name);
    return true;
  }
  function playerPhysics(s, input, dt) {
    const p = s.player, r = SIDE_ROOMS[s.room], trait = SIDE_TRAITS[s.form], old = { x: p.x, y: p.y }, geometry = sideGeometry(s.room), platforms = [...geometry.platforms, ...s.bridges];
    const pressed = (key) => !!input[key] && !s.previous[key];
    for (const k of ["invuln", "dashCooldown", "powerCooldown", "attackCooldown", "flash", "dropThrough", "overclock", "pounce"]) p[k] = Math.max(0, (p[k] ?? 0) - dt);
    if (pressed("jump") && input.down && p.grounded) {
      p.dropThrough = 0.22;
      p.y += 6;
      p.vy = 150;
      p.grounded = false;
      p.jumpBuffer = 0;
      p.coyote = 0;
    }
    p.coyote = p.grounded ? 6 : Math.max(0, p.coyote - 1);
    p.jumpBuffer = pressed("jump") && !input.down ? 7 : Math.max(0, p.jumpBuffer - 1);
    if (p.jumpBuffer && (p.coyote > 0 || s.form === "animal" && p.jumps < 2)) {
      p.vy = -trait.jump;
      p.grounded = false;
      p.coyote = 0;
      p.jumps++;
      p.jumpBuffer = 0;
      p.drift = 0;
      emit2(s, "jump");
    }
    if (pressed("dash") && p.dashCooldown === 0) {
      p.dash = 0.19;
      p.dashCooldown = 1.2;
      p.invuln = Math.max(p.invuln, 0.22);
      emit2(s, "dash");
    }
    if (p.dash > 0) {
      p.dash = Math.max(0, p.dash - dt);
      p.vx = p.facing * (s.form === "computer" ? 710 : 650);
      p.vy = 0;
    } else {
      p.vx = p.pounce > 0 ? p.facing * 650 : clamp3(input.x ?? 0, -1, 1) * trait.speed;
      if (Math.abs(p.vx) > 1) p.facing = Math.sign(p.vx);
      const drift = s.form === "spark" && input.jump && p.vy > 0 && p.drift < 0.7;
      p.drift += drift ? dt : 0;
      p.vy = Math.min(880, p.vy + 1450 * dt * (drift ? 0.18 : 1));
      if (!input.jump && p.vy < -250) p.vy += 1800 * dt;
    }
    p.x = clamp3(p.x + p.vx * dt, 28, r.width - 28);
    p.y += p.vy * dt;
    p.walk += Math.abs(p.vx) * dt / 75;
    p.grounded = false;
    if (p.vy >= 0) for (const platform of platforms) {
      if (!(platform.oneWay && p.dropThrough > 0) && p.x + 19 > platform.x && p.x - 19 < platform.x + platform.w && old.y <= platform.y + 2 && p.y >= platform.y) {
        p.y = platform.y;
        p.vy = 0;
        p.grounded = true;
        p.jumps = 0;
        p.drift = 0;
        break;
      }
    }
    if (p.grounded && p.pounceLanding) {
      p.pounceLanding = false;
      for (const e2 of s.enemies) if (e2.hp > 0 && Math.hypot(e2.x - p.x, (e2.y - p.y) * 0.5) < 180) hitEnemy(s, e2, 35 + s.memories.length * 3);
      emit2(s, "power", "Pounce \xB7 landing strike");
    }
    if (p.y > r.height + 60) {
      sideDamage(s, 18);
      if (s.phase === "playing") {
        p.x = old.x < r.width * 0.6 ? Math.max(270, geometry.pits[0]?.x - 70) : r.width - 220;
        p.y = r.floor;
        p.vy = 0;
        p.invuln = 1;
      }
    }
    if (input.attack) attack3(s, "light");
    if (input.heavy) attack3(s, "heavy");
    if (pressed("power")) sidePower(s);
    if (p.attack) {
      const a = p.attack;
      a.frame++;
      if (a.frame === (a.kind === "hk" ? 14 : 7) && !a.hit) {
        a.hit = true;
        if (["spark", "computer"].includes(s.form)) bolt(s, p.x + p.facing * 30, p.y - 35, p.facing, input.down ? 0.65 : input.up ? -0.65 : 0, a.damage, false, false, s.form === "computer" ? 610 : 500);
        else for (const e2 of s.enemies) if (e2.hp > 0 && (e2.x - p.x) * p.facing > -25 && (e2.x - p.x) * p.facing < (a.kind === "hk" ? 175 : 150) && Math.abs(e2.y - p.y) < (e2.boss ? 145 : 95)) hitEnemy(s, e2, a.damage);
      }
      if (a.frame >= a.total) p.attack = null;
    }
    if (pressed("interact")) sideInteract(s);
  }
  function enemiesTick(s, dt) {
    const p = s.player, r = SIDE_ROOMS[s.room], rank = WORLD_ORDER.indexOf(r.world);
    for (const e2 of s.enemies) {
      if (e2.hp <= 0) continue;
      e2.flash = Math.max(0, (e2.flash ?? 0) - dt);
      e2.root = Math.max(0, (e2.root ?? 0) - dt);
      e2.facing = p.x >= e2.x ? 1 : -1;
      e2.clock -= dt;
      if (e2.boss) {
        const phase = e2.hp < e2.maxHp * 0.5 ? 2 : 1;
        if (phase !== e2.phase) {
          e2.phase = phase;
          emit2(s, "phase", sideEnemyName(e2.kind) + " \xB7 " + (e2.kind === "cantor" ? "SECOND MOVEMENT" : "the pattern changes"));
        }
        if (e2.windup > 0) {
          e2.windup -= dt;
          if (e2.windup <= 0) {
            const dy = p.y - 40 - (e2.y - 55);
            for (let j = -1; j <= 1; j++) bolt(s, e2.x, e2.y - 55, p.x - e2.x, dy + j * (e2.phase === 2 ? 85 : 65), 11 + rank * 1.5, true, true, 275 + rank * 12);
            bolt(s, e2.x, e2.y - 18, p.x - e2.x, 0, 10 + rank, true, true, 255);
            e2.clock = e2.phase === 2 ? 2.5 : 3.2;
            emit2(s, "volley");
          }
        } else if (e2.clock <= 0) {
          e2.windup = 0.95;
          s.marks.push({ x: p.x, y: r.floor, r: 70, life: 1.3, damage: 13 + rank * 1.5, trigger: false });
          emit2(s, "windup");
        } else if (!e2.root) e2.x = clamp3(e2.x + Math.sin(s.time * 1.3) * 17 * dt, 300, r.width - 190);
      } else if (e2.kind === "archon") {
        if (e2.windup > 0) {
          e2.windup -= dt;
          if (e2.windup <= 0) {
            bolt(s, e2.x, e2.y - 42, p.x - e2.x, p.y - 35 - (e2.y - 42), 9 + rank, true, false, 310);
            e2.clock = 2.6;
            emit2(s, "volley");
          }
        } else if (e2.clock <= 0 && Math.abs(e2.x - p.x) < 800) e2.windup = 0.7;
      } else if (!e2.root) {
        const speed = e2.kind === "hound" ? 110 + rank * 5 : e2.kind === "mirror" ? 85 : 65 + rank * 5;
        e2.x = clamp3(e2.x + e2.facing * speed * dt, 310, r.width - 180);
        e2.y = r.floor - (e2.kind === "mirror" ? 75 + Math.sin(s.time * 2 + e2.x) * 35 : e2.kind === "hound" ? Math.max(0, Math.sin(s.time * 2.2 + e2.id.length) * 55) : 0);
      }
      if (Math.abs(e2.x - p.x) < (e2.boss ? 75 : 48) && Math.abs(e2.y - p.y) < (e2.boss ? 115 : 70)) sideDamage(s, (e2.boss ? 15 : 9) + rank);
    }
    for (const mark of s.marks) {
      mark.life -= dt;
      if (mark.life <= 0.2 && !mark.trigger) {
        mark.trigger = true;
        if (Math.abs(p.x - mark.x) < mark.r && Math.abs(p.y - mark.y) < 70) sideDamage(s, mark.damage);
        emit2(s, "impact", "", mark.x, mark.y);
      }
    }
    s.marks = s.marks.filter((m) => m.life > 0);
    for (const b of s.bolts) {
      b.px = b.x;
      b.py = b.y;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.enemy) {
        if (Math.abs(b.x - p.x) < 25 && b.y > p.y - 65 && b.y < p.y + 10) {
          sideDamage(s, b.damage);
          b.life = 0;
          emit2(s, "impact", "", b.x, b.y);
        }
      } else for (const e2 of s.enemies) if (e2.hp > 0 && Math.abs(b.x - e2.x) < (e2.boss ? 65 : 32) && b.y > e2.y - (e2.boss ? 170 : 95) && b.y < e2.y + 12) {
        hitEnemy(s, e2, b.damage);
        b.life = 0;
        break;
      }
    }
    s.bolts = s.bolts.filter((b) => b.life > 0 && b.x > 0 && b.x < r.width && b.y > 0 && b.y < r.height);
  }
  function pickups(s) {
    const r = SIDE_ROOMS[s.room], p = s.player, g = sideGeometry(s.room);
    if (s.enemies.every((e2) => e2.hp <= 0) && !s.cleared.includes(s.room)) {
      s.cleared.push(s.room);
      if (r.seal && !s.seals.includes(r.seal)) {
        s.seals.push(r.seal);
        p.maxHp += 8;
        p.hp = Math.min(p.maxHp, p.hp + 35);
        emit2(s, "memory", "Guardian seal \xB7 +8 health capacity \xB7 your strikes remember its strength.");
      }
      emit2(s, "clear", r.boss ? "The guardian\u2019s glyph opens." : "Room cleared \xB7 return to the glowing glyph to heal and save.");
      if (r.resonance) {
        s.forms = [...SIDE_FORMS];
        emit2(s, "resonance", "VESSEL RESONANCE \xB7 Q borrows another body.");
      }
      if (r.final) {
        s.phase = "complete";
        emit2(s, "complete", "The body falls. The spark remembers.");
      }
    }
    if (r.key && s.cleared.includes(s.room) && !s.keys.includes(r.key) && Math.hypot(p.x - (r.width - 300), p.y - r.floor) < 65) {
      s.keys.push(r.key);
      emit2(s, "key", KEYS[r.key].name + " \xB7 remembered for this side journey.", p.x, p.y - 55);
    }
    if (!r.safe && !r.boss && !s.memories.includes(s.room)) {
      const pos = { x: 850, y: r.floor - 185 };
      const platform = g.platforms.filter((v) => v.oneWay).toSorted((a, b) => Math.abs(a.x + a.w / 2 - 850) - Math.abs(b.x + b.w / 2 - 850))[0];
      if (platform) {
        pos.x = platform.x + platform.w / 2;
        pos.y = platform.y;
      }
      if (Math.hypot(p.x - pos.x, p.y - pos.y) < 55) {
        s.memories.push(s.room);
        p.maxHp += 6;
        p.hp = Math.min(p.maxHp, p.hp + 10);
        emit2(s, "memory", "Memory fragment \xB7 +6 health capacity \xB7 stronger strikes.", pos.x, pos.y - 35);
      }
    }
    if (r.secret && !s.secrets.includes(r.secret) && Math.hypot(p.x - g.secret.x, p.y - g.secret.y) < 55) {
      s.secrets.push(r.secret);
      emit2(s, "secret", "FEATHER \xB7 a night seam in Prism Night remembers this shape.");
      s.journal.push({ room: s.room, title: "Feather", text: "Carry this feather beyond the Cinder Clockworks. Look above the western steps of the Unlit Vestibule." });
    }
  }
  function stepSide(s, input = {}, dt = 1 / 60) {
    if (s.phase !== "playing") return;
    s.time += dt;
    s.arrivalGrace = Math.max(0, (s.arrivalGrace ?? 0) - dt);
    const before = s.room;
    playerPhysics(s, input, dt);
    if (before === s.room && s.phase === "playing") {
      enemiesTick(s, dt);
      if (s.phase === "playing") pickups(s);
    }
    for (const bridge of s.bridges) bridge.life -= dt;
    s.bridges = s.bridges.filter((b) => b.life > 0);
    s.previous = { jump: !!input.jump, dash: !!input.dash, power: !!input.power, interact: !!input.interact };
  }
  function observeSide(s) {
    if (!s) return null;
    const g = sideGeometry(s.room), r = SIDE_ROOMS[s.room];
    return structuredClone({ mode: "sideways", phase: s.phase, room: s.room, name: r.name, world: r.world, form: s.form, forms: s.forms, time: s.time, player: s.player, checkpoint: s.checkpoint, keys: s.keys, seals: s.seals, visited: s.visited, cleared: s.cleared, memories: s.memories, secrets: s.secrets, falls: s.falls, damage: s.damage, enemies: s.enemies.filter((e2) => e2.hp > 0), bolts: s.bolts, platforms: g.platforms, doors: g.doors.map((d) => ({ ...d, ...sideDoorStatus(s, d) })), notice: s.notice, journal: s.journal });
  }
  function sideSave(s) {
    return { schema: 1, room: s.room, form: s.form, phase: s.phase, time: s.time, keys: [...s.keys], seals: [...s.seals], forms: [...s.forms], visited: [...s.visited], cleared: [...s.cleared], memories: [...s.memories], secrets: [...s.secrets], opened: [...s.opened], journal: structuredClone(s.journal), falls: s.falls, damage: s.damage, checkpoint: structuredClone(s.checkpoint), player: structuredClone(s.player), enemies: structuredClone(s.enemies) };
  }
  function restoreSide(raw) {
    if (!raw || raw.schema !== 1 || !SIDE_ROOMS[raw.room] || !SIDE_FORMS.includes(raw.form) || !["playing", "fallen", "complete"].includes(raw.phase)) return null;
    const list = (v, allow, max) => Array.isArray(v) && v.length <= max && new Set(v).size === v.length && v.every((x) => allow.includes(x));
    for (const key of ["visited", "cleared", "memories"]) if (!list(raw[key], Object.keys(SIDE_ROOMS), 27)) return null;
    if (!list(raw.keys, Object.keys(KEYS), 8) || !list(raw.seals, WORLD_ORDER.slice(0, 6), 6) || !list(raw.forms, SIDE_FORMS, 6) || !raw.forms.includes(raw.form) || !list(raw.secrets, ["feather", "feather-path"], 2)) return null;
    if (!finite(raw.damage, 0, 1e12) || !Number.isInteger(raw.falls) || raw.falls < 0 || raw.falls > 1e6 || raw.cleared.some((id) => !raw.visited.includes(id)) || raw.memories.some((id) => !raw.visited.includes(id)) || raw.secrets.includes("feather-path") && !raw.secrets.includes("feather")) return null;
    const p = raw.player, cp = raw.checkpoint;
    if (!p || !cp || !SIDE_ROOMS[cp.room] || !finite(p.hp, 0, 500) || !finite(p.maxHp, 100, 500) || p.hp > p.maxHp || !finite(p.x, 0, SIDE_ROOMS[raw.room].width) || !finite(p.y, -100, 1e3) || !finite(cp.x, 0, SIDE_ROOMS[cp.room].width) || !finite(cp.y, 0, SIDE_ROOMS[cp.room].height) || !finite(raw.time, 0, 1e9)) return null;
    if (raw.keys.some((k) => !raw.cleared.includes(Object.keys(SIDE_ROOMS).find((id) => SIDE_ROOMS[id].key === k)))) return null;
    if (raw.seals.some((k) => !raw.cleared.includes(Object.keys(SIDE_ROOMS).find((id) => SIDE_ROOMS[id].seal === k)))) return null;
    if (raw.forms.length > 1 && !raw.cleared.includes("nursery") || raw.phase === "complete" && !raw.cleared.includes("origin-heart")) return null;
    const s = createSideJourney();
    for (const key of ["room", "form", "phase", "time", "keys", "seals", "forms", "visited", "cleared", "memories", "secrets", "falls", "damage", "checkpoint"]) s[key] = structuredClone(raw[key]);
    s.opened = [];
    s.journal = s.visited.map((id) => ({ room: id, title: SIDE_ROOMS[id].name, text: SIDE_ROOMS[id].clue }));
    s.player = { ...s.player, ...p, facing: p.facing === -1 ? -1 : 1, powerCooldown: finite(p.powerCooldown, 0, 12) ? p.powerCooldown : 0, attackCooldown: 0, dashCooldown: 0, flash: 0, dropThrough: 0, pounce: 0, pounceLanding: false, overclock: 0, jumps: 0, drift: 0, vx: 0, vy: 0, attack: null, dash: 0, invuln: 1, grounded: false, coyote: 0, jumpBuffer: 0, walk: 0 };
    spawnRoom(s);
    if (Array.isArray(raw.enemies) && raw.enemies.length <= 8) for (const e2 of s.enemies) {
      const found = raw.enemies.find((v) => v?.id === e2.id);
      if (found && finite(found.hp, 0, e2.maxHp) && finite(found.x, 250, SIDE_ROOMS[s.room].width) && finite(found.y, 0, 820)) {
        e2.hp = found.hp;
        e2.x = found.x;
        e2.y = found.y;
      }
    }
    if (s.secrets.includes("feather")) s.journal.push({ room: "reliquary", title: "Feather", text: "A feather from Nacre\u2019s Reliquary answers the seam above the western steps in Prism Night." });
    s.arrivalGrace = 0.6;
    s.notice = "Your side journey returns.";
    return s;
  }
  function loadSide(storage) {
    try {
      return restoreSide(JSON.parse(storage.getItem(SIDE_KEY) ?? "null"));
    } catch {
      return null;
    }
  }
  function saveSide(storage, s) {
    storage.setItem(SIDE_KEY, JSON.stringify(sideSave(s)));
  }

  // sideways-view.js?v=0.13.0
  var clamp4 = (n, a, b) => Math.max(a, Math.min(b, n));
  var esc = (value) => String(value).replace(/[&<>"']/g, (c2) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c2]);
  var clock = (n) => Math.floor(n / 60) + ":" + String(Math.floor(n) % 60).padStart(2, "0");
  var STAGE = { stratum: 0, tideglass: 1, verdant: 2, cinder: 3, prism: 4, orbit: 5, uncreated: 0 };
  var portrait = (form) => "--fighter-x:" + DUEL_BODY_CELLS[form] % 3 * 50 + "%;--fighter-y:" + Math.floor(DUEL_BODY_CELLS[form] / 3) * 50 + "%";
  var SideScreen = class {
    constructor({ document: document2, window: window2, storage, images: images2, settings: settings2, audio: audio2, onQuit, announce: announce2 = () => {
    } }) {
      Object.assign(this, { document: document2, window: window2, storage, images: images2, settings: settings2, audio: audio2, onQuit, announce: announce2 });
      this.$ = (id) => document2.getElementById(id);
      this.canvas = this.$("side-canvas");
      this.ctx = this.canvas.getContext("2d", { alpha: false });
      this.image = images2.duelFighters;
      this.art = { strikes: images2.duelStrikes, kicks: images2.duelKicks };
      this.journey = loadSide(storage);
      this.keys = /* @__PURE__ */ new Set();
      this.touch = { x: 0, buttons: {} };
      this.padPrevious = [];
      this.menu = "";
      this.accumulator = 0;
      this.saveClock = 0;
      this.camera = { x: 0, y: 0 };
      this.seen = 0;
      this.lastOverlay = "";
      this.lastHud = "";
      this.noticeUntil = 0;
      this.bindTouch();
    }
    clearInputs() {
      this.keys.clear();
      this.touch = { x: 0, buttons: {} };
      this.padPrevious = [];
      this.accumulator = 0;
      if (this.journey) {
        this.journey.previous = {};
        this.journey.player.vx = 0;
        this.journey.player.jumpBuffer = 0;
      }
      this.$("side-stick-thumb").style.transform = "translate(0,0)";
    }
    open() {
      this.clearInputs();
      this.menu = this.journey ? "pause" : "intro";
      this.seen = this.journey?.eventSerial ?? 0;
      this.snapCamera();
      this.render(true);
      this.draw();
      this.$("side-overlay").querySelector("button")?.focus({ preventScroll: true });
    }
    save() {
      if (!this.journey) return;
      try {
        saveSide(this.storage, this.journey);
        this.$("side-save-status").textContent = "Side journey saved on this device";
      } catch {
        this.$("side-save-status").textContent = "Save unavailable \xB7 keep this page open";
      }
    }
    leave() {
      this.save();
      this.clearInputs();
      this.menu = "";
      this.onQuit();
    }
    suspend() {
      if (this.journey?.phase === "playing" && !this.menu) this.menu = "pause";
      this.clearInputs();
      this.save();
      this.render(true);
    }
    focus() {
      if (!this.menu && this.journey?.phase === "playing" && !this.document.querySelector("dialog[open]")) this.canvas.focus({ preventScroll: true });
    }
    setMenu(menu2) {
      this.menu = menu2;
      this.clearInputs();
      this.render(true);
      if (!menu2) this.focus();
      else this.$("side-overlay").querySelector("button")?.focus({ preventScroll: true });
    }
    action(action, data = {}) {
      if (action === "side-new") {
        this.journey = createSideJourney();
        this.seen = 0;
        this.menu = "";
        this.snapCamera();
        this.save();
        this.render(true);
        this.focus();
        return;
      }
      if (action === "side-resume") {
        if (!this.journey) throw Error("Begin a side journey first.");
        this.setMenu(this.journey.phase === "fallen" ? "fallen" : this.journey.phase === "complete" ? "complete" : "");
        return;
      }
      if (action === "side-quit") {
        this.leave();
        return;
      }
      if (action === "side-pause") {
        this.setMenu(this.menu ? "" : "pause");
        return;
      }
      if (action === "side-map") {
        this.setMenu(this.menu === "map" ? "" : "map");
        return;
      }
      if (action === "side-vessels") {
        if (!this.journey) return;
        if (this.journey.forms.length === 1) {
          this.say("Clear the Mirror Nursery to learn vessel resonance.");
          return;
        }
        this.setMenu(this.menu === "vessels" ? "" : "vessels");
        return;
      }
      if (action === "side-morph") {
        morphSide(this.journey, data.form);
        this.setMenu("");
        this.events();
        this.save();
        return;
      }
      if (action === "side-rekindle") {
        respawnSide(this.journey);
        this.snapCamera();
        this.setMenu("");
        this.events();
        this.save();
        return;
      }
      if (action === "side-reset") {
        this.setMenu("reset");
        return;
      }
      if (action === "side-info") {
        if (!SIDE_ROOMS[data.room]) throw Error("Unknown side room.");
        this.selectedRoom = data.room;
        this.render(true);
        return;
      }
      if (action === "side-gate") {
        if (this.menu) return;
        sideInteract(this.journey);
        this.events();
        this.save();
        this.render(true);
        return;
      }
      if (action === "side-help") {
        this.setMenu("help");
        return;
      }
    }
    say(text) {
      this.$("side-notice").textContent = text;
      this.$("side-notice").hidden = false;
      this.noticeUntil = (this.journey?.time ?? 0) + 4;
      this.announce(text);
    }
    events() {
      let message = null;
      const priorities = { secret: 9, key: 9, resonance: 9, "boss-down": 8, phase: 8, memory: 7, complete: 10, fall: 10, power: 3, clear: 4, room: 1, checkpoint: 2, hint: 5, morph: 5 };
      for (const e2 of this.journey?.events ?? []) {
        if (e2.id <= this.seen) continue;
        if (e2.text && (!message || (priorities[e2.type] ?? 0) >= (priorities[message.type] ?? 0))) message = e2;
        const tone2 = { damage: "damage", hit: "hit", strike: "hit", jump: "dash", dash: "dash", power: "power", key: "key", memory: "pickup", secret: "key", resonance: "level", "boss-down": "win", clear: "gate", checkpoint: "chime", phase: "level", windup: "chime" }[e2.type];
        if (tone2) this.audio.effect(tone2);
        if (["key", "secret", "resonance", "clear", "checkpoint", "fall", "complete", "room", "memory"].includes(e2.type)) this.save();
        this.seen = e2.id;
      }
      if (message) this.say(message.text);
      if (this.journey?.phase === "fallen" && !["fallen", "map", "reset"].includes(this.menu)) this.setMenu("fallen");
      if (this.journey?.phase === "complete" && !["complete", "map", "reset"].includes(this.menu)) this.setMenu("complete");
    }
    controls() {
      const p = this.settings().inputProfile;
      return p === "controller" ? "Stick / D-pad move \xB7 A jump \xB7 B dash \xB7 X strike \xB7 Y heavy \xB7 LB power \xB7 RB vessels \xB7 RT gate \xB7 View map \xB7 Start pause" : p === "mobile" ? "Stick moves \xB7 JUMP again for Animal\u2019s second jump \xB7 STRIKE / HEAVY attack \xB7 POWER \xB7 DASH \xB7 GATE \xB7 VESSELS. Landscape gives you more room." : "A/D or arrows move \xB7 Space / W / \u2191 jump \xB7 \u2193 + jump drops \xB7 Shift dash \xB7 J strike \xB7 K heavy \xB7 F power \xB7 E gate / glyph \xB7 Q vessels \xB7 M map \xB7 Esc pause";
    }
    render(force = false) {
      const s = this.journey, r = s ? SIDE_ROOMS[s.room] : SIDE_ROOMS.threshold;
      this.$("side-instructions").textContent = this.controls();
      this.$("side-root").classList.toggle("input-mobile", this.settings().inputProfile === "mobile");
      this.$("side-touch").hidden = this.settings().inputProfile !== "mobile" || !!this.menu || s?.phase !== "playing";
      const hud = s ? [s.room, s.form, Math.ceil(s.player.hp), s.player.maxHp, s.cleared.length, s.keys.join(), s.seals.join(), s.phase, Math.floor(s.time), Math.ceil(s.player.powerCooldown), this.menu].join("|") : "intro";
      if (force || hud !== this.lastHud) {
        this.lastHud = hud;
        this.$("side-room-title").textContent = r.name;
        this.$("side-world").textContent = "SIDEWAYS DESCENT \xB7 " + WORLDS[r.world].name.toUpperCase();
        this.$("side-hp").textContent = s ? Math.ceil(s.player.hp) + " / " + s.player.maxHp : "130 / 130";
        this.$("side-hp-track").style.width = (s ? s.player.hp / s.player.maxHp * 100 : 100) + "%";
        this.$("side-build").textContent = s ? SIDE_NAMES[s.form] + " \xB7 " + s.memories.length + " memories \xB7 " + s.cleared.length + " / 27 rooms \xB7 " + clock(s.time) : "Six vessels \xB7 seven worlds \xB7 a separate journey";
        this.$("side-keyring").textContent = s?.keys.length ? s.keys.map((k) => KEYS[k].name).join(" \xB7 ") : "Find keys. Return in another shape.";
        this.$("side-power-label").textContent = s ? VESSEL_POWERS[s.form].name + (s.player.powerCooldown > 0 ? " \xB7 " + Math.ceil(s.player.powerCooldown) + "s" : " \xB7 ready") : "Lumen pulse";
        this.$("side-pause").textContent = this.menu ? "Resume" : "Pause";
        this.$("side-pause").disabled = !s || s.phase !== "playing";
        this.$("side-map").disabled = !s;
        this.$("side-vessels").disabled = !s || s.phase !== "playing";
      }
      const signature = this.menu + "|" + s?.room + "|" + s?.form + "|" + s?.forms.join() + "|" + s?.keys.join() + "|" + s?.visited.length + "|" + s?.cleared.length + "|" + this.selectedRoom;
      if (!force && signature === this.lastOverlay) return;
      this.lastOverlay = signature;
      const overlay = this.$("side-overlay");
      overlay.hidden = !this.menu;
      if (!this.menu) {
        overlay.innerHTML = "";
        return;
      }
      let body = "", title = "", label = "SIDEWAYS DESCENT";
      const resume = '<button class="primary-button" data-action="side-resume">Return to the path</button>';
      if (this.menu === "intro") {
        title = "The spark takes a side path.";
        body = '<p>Walk, jump, fight, and return in another body. Twenty-seven connected rooms reinterpret the seven existing worlds as a side-view journey.</p><p>Keys open routes. The Mirror Nursery unlocks vessel resonance. Checkpoint glyphs remember where the spark returns after a fall.</p><p class="side-separate">This mode has its own save, keys, and seals. Your descent remains remembered.</p><button class="primary-button" data-action="side-new">Begin the side journey</button><button class="secondary-button" data-action="side-quit">Return to start</button>';
      } else if (this.menu === "pause") {
        title = "A moment outside the current.";
        body = "<p>" + esc(r.clue) + '</p><div class="side-menu-actions">' + resume + '<button data-action="side-map">Map & journal</button><button data-action="side-vessels">Borrow a body</button><button data-action="side-help">Controls & abilities</button><button data-action="side-rekindle">Return to checkpoint \xB7 restore health</button><button data-action="side-quit">Save & return to start</button><button data-action="side-reset" class="side-subtle">New side journey</button></div>';
      } else if (this.menu === "fallen") {
        label = "THE BODY FALLS";
        title = "The glyph remembers.";
        body = "<p>The body falls. The spark remembers.</p><p>Return to " + esc(SIDE_ROOMS[s.checkpoint.room].name) + '. Keys, memories, and defeated guardians stay in this side journey.</p><button class="primary-button" data-action="side-rekindle">Rekindle at the checkpoint</button><button data-action="side-quit">Save & return to start</button>';
      } else if (this.menu === "complete") {
        label = "SIDE JOURNEY COMPLETE";
        title = "The spark remembers.";
        body = '<p>The body falls. The spark remembers.</p><div class="side-result"><strong>' + s.cleared.length + " / 27 rooms</strong><span>" + s.seals.length + " guardian seals \xB7 " + s.memories.length + " memories \xB7 " + s.falls + " falls \xB7 " + clock(s.time) + '</span></div><p>Your descent and its endings remain their own journey.</p><button class="primary-button" data-action="side-quit">Save & return to start</button><button data-action="side-reset">A new side journey</button>';
      } else if (this.menu === "reset") {
        title = "Begin another side journey?";
        body = '<p>This replaces only your Sideways save. Your solo descent, co-op, duel, vault, and Table remain remembered.</p><button class="primary-button" data-action="side-new">Begin a new side journey</button><button data-action="side-resume">Keep this journey</button>';
      } else if (this.menu === "vessels") {
        title = "One spark. Six interfaces.";
        body = '<div class="side-vessel-grid">' + SIDE_FORMS.map((form) => '<button class="side-vessel ' + (s.form === form ? "selected" : "") + '" data-action="side-morph" data-form="' + form + '" ' + (s.forms.includes(form) ? "" : "disabled") + '><span class="fighter-portrait" style="' + portrait(form) + '"></span><strong>' + SIDE_NAMES[form] + "</strong><small>" + esc(SIDE_TRAITS[form].desc) + "</small><em>" + VESSEL_POWERS[form].name + "</em></button>").join("") + "</div><p>1\u20136 selects a remembered body. Health and cooldowns carry across vessels.</p>" + resume;
      } else if (this.menu === "help") {
        title = "Read the path. Borrow a shape.";
        body = "<p>" + esc(this.controls()) + '</p><p>Hold Strike or Heavy to repeat. Down + Jump drops through a ledge. Up / Down aims Spark and Computer shots diagonally. Hold Jump for Spark\u2019s air drift; tap Jump twice for Animal\u2019s second jump. Computer dashes across gaps. Tree grows a temporary step with Root hold.</p><p>E / RT / GATE at a cleared room\u2019s glyph saves your return point and restores health. Rest rooms remember you on arrival. Memory fragments on ledges raise health and strengthen strikes.</p><div class="side-help-forms">' + SIDE_FORMS.map((form) => "<p><b>" + SIDE_NAMES[form] + " \xB7 " + VESSEL_POWERS[form].name + "</b><br>" + esc(SIDE_TRAITS[form].desc) + "</p>").join("") + "</div>" + resume;
      } else if (this.menu === "map") {
        title = "Seven worlds. Twenty-seven side rooms.";
        const selected = SIDE_ROOMS[this.selectedRoom ?? s.room], selectedId = this.selectedRoom ?? s.room;
        body = '<p class="side-map-legend"><span>\u25C6 current</span><span>\u25CF cleared</span><span>\u25CB visited</span><span>\u25C7 unseen</span><span>? a remembered clue</span></p><div class="side-map-grid">' + WORLD_ORDER.map((world) => '<section><h3 style="color:' + WORLDS[world].color + '">' + WORLDS[world].name + "</h3>" + Object.entries(SIDE_ROOMS).filter(([, room2]) => room2.world === world).map(([id, room2]) => '<button data-action="side-info" data-room="' + id + '" class="side-map-room ' + (s.room === id ? "current" : "") + " " + (s.visited.includes(id) ? "visited" : "unseen") + '"><span>' + (s.room === id ? "\u25C6" : s.cleared.includes(id) ? "\u25CF" : s.visited.includes(id) ? "\u25CB" : "\u25C7") + "</span>" + room2.name + (room2.key && !s.keys.includes(room2.key) ? " \xB7 KEY" : room2.resonance && s.forms.length === 1 ? " \xB7 RESONANCE" : room2.secret || room2.secretDoor || room2.secretReturn ? " \xB7 ?" : "") + "</button>").join("") + "</section>").join("") + '</div><div class="side-map-detail"><strong>' + esc(selected.name) + "</strong><p>" + esc(s.visited.includes(selectedId) ? selected.clue : "Visit this room to remember its journal clue.") + "</p><p>" + sideGeometry(selectedId).doors.map((d) => esc(SIDE_ROOMS[d.to].name) + " \xB7 " + esc(sideDoorStatus({ ...s, room: selectedId, enemies: s.room === selectedId ? s.enemies : [] }, d).reason)).join("<br>") + "</p></div>" + resume;
      }
      overlay.innerHTML = '<div class="side-menu ' + (this.menu === "map" ? "wide" : "") + '"><span class="eyebrow">' + label + "</span><h2>" + title + "</h2>" + body + "</div>";
    }
    keydown(e2) {
      if (e2.altKey || e2.ctrlKey || e2.metaKey || e2.target?.isContentEditable || ["INPUT", "SELECT", "TEXTAREA"].includes(e2.target?.tagName)) return;
      const key = e2.code === "Space" ? " " : String(e2.key ?? "").toLowerCase();
      const controls = ["a", "d", "w", "s", "arrowleft", "arrowright", "arrowup", "arrowdown", " ", "shift", "j", "k", "f", "e", "q", "m", "escape"];
      if (controls.includes(key)) e2.preventDefault();
      if (e2.repeat && ["q", "m", "escape"].includes(key)) return;
      if (key === "escape") {
        if (this.menu === "intro") {
          this.leave();
          return;
        }
        if (this.journey?.phase === "playing") this.setMenu(this.menu ? "" : "pause");
        return;
      }
      if (this.menu) {
        if (this.menu === "vessels" && /^[1-6]$/.test(key) && !e2.repeat) {
          e2.preventDefault();
          this.action("side-morph", { form: SIDE_FORMS[Number(key) - 1] });
        } else if (key === "m" && this.menu === "map") this.setMenu("");
        else if (key === "q" && this.menu === "vessels") this.setMenu("");
        return;
      }
      if (this.settings().inputProfile !== "pc") return;
      if (key === "q") this.action("side-vessels");
      else if (key === "m") this.action("side-map");
      else if (controls.includes(key)) {
        this.keys.add(key);
        this.focus();
      }
    }
    keyup(e2) {
      this.keys.delete(e2.code === "Space" ? " " : String(e2.key ?? "").toLowerCase());
    }
    keyboardInput() {
      const k = this.keys;
      return { x: (k.has("d") || k.has("arrowright") ? 1 : 0) - (k.has("a") || k.has("arrowleft") ? 1 : 0), jump: k.has(" ") || k.has("w") || k.has("arrowup"), up: k.has("w") || k.has("arrowup"), down: k.has("s") || k.has("arrowdown"), dash: k.has("shift"), attack: k.has("j"), heavy: k.has("k"), power: k.has("f"), interact: k.has("e") };
    }
    controller() {
      if (this.settings().inputProfile !== "controller" || this.document.querySelector("dialog[open]")) return {};
      const pad2 = Array.from(this.window.navigator?.getGamepads?.() ?? []).find((p) => p?.connected && p.mapping === "standard");
      if (!pad2) {
        this.padPrevious = [];
        return {};
      }
      const b = pad2.buttons.map((v) => typeof v === "number" ? v > 0.5 : !!v?.pressed || v?.value > 0.5), edge = (i) => b[i] && !this.padPrevious[i];
      const menuWas = this.menu;
      if (this.menu) {
        const buttons = Array.from(this.$("side-overlay").querySelectorAll("button:not([disabled])"));
        if ((edge(13) || edge(15) || edge(12) || edge(14)) && buttons.length) {
          let i = buttons.indexOf(this.document.activeElement);
          i = (Math.max(0, i) + (edge(13) || edge(15) ? 1 : -1) + buttons.length) % buttons.length;
          buttons[i].focus({ preventScroll: true });
        }
        if (edge(0) && buttons.length) (buttons.includes(this.document.activeElement) ? this.document.activeElement : buttons[0]).click();
        if ((edge(1) || edge(9)) && this.journey?.phase === "playing") this.setMenu("");
      } else if (edge(9)) this.setMenu("pause");
      else if (edge(8) || edge(6)) this.setMenu("map");
      else if (edge(5)) this.action("side-vessels");
      this.padPrevious = b;
      if (menuWas || this.menu) return {};
      const x = Math.abs(pad2.axes[0] ?? 0) > 0.18 ? pad2.axes[0] : 0;
      return { x: clamp4(x + (b[15] ? 1 : 0) - (b[14] ? 1 : 0), -1, 1), jump: !!b[0], up: !!b[12] || (pad2.axes[1] ?? 0) < -0.4, down: !!b[13] || (pad2.axes[1] ?? 0) > 0.4, dash: !!b[1], attack: !!b[2], heavy: !!b[3], power: !!b[4], interact: !!b[7] };
    }
    bindTouch() {
      const stick2 = this.$("side-stick");
      let pointer2 = null;
      const move2 = (e2) => {
        if (e2.pointerId !== pointer2) return;
        const rect = stick2.getBoundingClientRect(), x = clamp4((e2.clientX - rect.left - rect.width / 2) / 38, -1, 1);
        this.touch.x = x;
        this.touch.buttons.down = e2.clientY > rect.top + rect.height * 0.68;
        this.touch.buttons.up = e2.clientY < rect.top + rect.height * 0.32;
        this.$("side-stick-thumb").style.transform = "translate(" + x * 30 + "px,0)";
      };
      stick2.addEventListener("pointerdown", (e2) => {
        e2.preventDefault();
        pointer2 = e2.pointerId;
        stick2.setPointerCapture?.(pointer2);
        move2(e2);
      });
      stick2.addEventListener("pointermove", move2);
      for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) stick2.addEventListener(type, () => {
        pointer2 = null;
        this.touch.x = 0;
        this.touch.buttons.up = false;
        this.touch.buttons.down = false;
        this.$("side-stick-thumb").style.transform = "translate(0,0)";
      });
      for (const id of ["jump", "dash", "attack", "heavy", "power", "interact"]) {
        const button = this.$("side-touch-" + id);
        button.addEventListener("pointerdown", (e2) => {
          e2.preventDefault();
          button.setPointerCapture?.(e2.pointerId);
          if (!this.menu) this.touch.buttons[id] = true;
        });
        for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) button.addEventListener(type, () => {
          this.touch.buttons[id] = false;
        });
      }
    }
    tick(dt) {
      const pad2 = this.controller();
      if (this.journey && !this.menu && !this.document.hidden && !this.document.querySelector("dialog[open]")) {
        this.accumulator += Math.max(0, Math.min(2, dt));
        const input = this.settings().inputProfile === "mobile" ? { x: this.touch.x, ...this.touch.buttons } : this.settings().inputProfile === "controller" ? pad2 : this.keyboardInput();
        let steps = 0;
        while (this.accumulator + 1e-9 >= 1 / 60 && this.journey.phase === "playing" && steps++ < 120) {
          stepSide(this.journey, input);
          this.accumulator -= 1 / 60;
        }
        this.events();
        if ((this.journey?.time ?? 0) > this.noticeUntil) this.$("side-notice").hidden = true;
        this.saveClock += dt;
        if (this.saveClock >= 2) {
          this.save();
          this.saveClock = 0;
        }
      } else this.accumulator = 0;
      this.render();
      this.draw();
    }
    control(input, frames = 1) {
      if (!this.journey || this.menu || this.journey.phase !== "playing") throw Error("Resume the side journey before controlling it.");
      if (!input || typeof input !== "object" || Array.isArray(input) || !Number.isInteger(frames) || frames < 1 || frames > 600 || Object.keys(input).some((k) => !["x", "jump", "dash", "attack", "heavy", "power", "interact", "up", "down"].includes(k)) || input.x !== void 0 && (!Number.isFinite(input.x) || Math.abs(input.x) > 1) || Object.entries(input).some(([k, v]) => k !== "x" && typeof v !== "boolean")) throw Error("Use bounded movement, boolean buttons, and 1\u2013600 frames.");
      for (let i = 0; i < frames && this.journey.phase === "playing"; i++) stepSide(this.journey, input);
      this.events();
      this.save();
      this.render(true);
      this.draw();
      return this.observe();
    }
    observe() {
      return { ...observeSide(this.journey), paused: !!this.menu, menu: this.menu, inputProfile: this.settings().inputProfile };
    }
    snapCamera() {
      const s = this.journey;
      if (!s) {
        this.camera = { x: 0, y: 170 };
        return;
      }
      const r = SIDE_ROOMS[s.room];
      this.camera = { x: clamp4(s.player.x - 420, 0, r.width - 960), y: clamp4(s.player.y - 405, 0, r.height - 540) };
    }
    body(ctx2, f, feet, scale = 0.64, alpha = 1) {
      ctx2.save();
      ctx2.translate(f.x, feet);
      ctx2.scale(scale, scale);
      DuelScreen.prototype.drawBody.call(this, ctx2, { ...f, x: 0, y: f.grounded ? 0 : 1, stun: 0, attack: f.attack ? { ...f.attack, kind: f.attack.kind === "lp" ? "light" : f.attack.kind } : null }, 0, this.journey?.time ?? 0, this.settings(), alpha);
      ctx2.restore();
    }
    draw() {
      const ctx2 = this.ctx;
      if (!ctx2) return;
      const rect = this.canvas.getBoundingClientRect(), w = Math.max(1, rect.width), h = Math.max(1, rect.height), dpr = Math.min(2, this.window.devicePixelRatio ?? 1);
      if (this.canvas.width !== Math.round(w * dpr) || this.canvas.height !== Math.round(h * dpr)) {
        this.canvas.width = Math.round(w * dpr);
        this.canvas.height = Math.round(h * dpr);
      }
      ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx2.fillStyle = "#071514";
      ctx2.fillRect(0, 0, w, h);
      const scale = Math.min(w / 960, h / 540);
      ctx2.save();
      ctx2.translate((w - 960 * scale) / 2, (h - 540 * scale) / 2);
      ctx2.scale(scale, scale);
      this.drawScene(ctx2);
      ctx2.restore();
    }
    drawScene(ctx2) {
      const s = this.journey, r = SIDE_ROOMS[s?.room ?? "threshold"], time = s?.time ?? 0, setting = this.settings(), color = WORLDS[r.world].color ?? "#dfc58a";
      if (s) {
        const tx = clamp4(s.player.x - 420 + s.player.vx * 0.12, 0, Math.max(0, r.width - 960)), ty = clamp4(s.player.y - 405, 0, r.height - 540);
        const lerp = setting.reduced ? 1 : 0.18;
        this.camera.x += (tx - this.camera.x) * lerp;
        this.camera.y += (ty - this.camera.y) * lerp;
      }
      const cx = this.camera.x, cy = this.camera.y;
      ctx2.save();
      ctx2.beginPath();
      ctx2.rect(0, 0, 960, 540);
      ctx2.clip();
      ctx2.fillStyle = "#08191d";
      ctx2.fillRect(0, 0, 960, 540);
      const stage = this.images.duelStages;
      if (stage?.complete && stage.naturalWidth) {
        const index = STAGE[r.world], sw = stage.naturalWidth / 2, sh = stage.naturalHeight / 3;
        const offset = -(cx * 0.16 % 960);
        for (let i = -1; i <= 1; i++) ctx2.drawImage(stage, index % 2 * sw, Math.floor(index / 2) * sh, sw, sh, offset + i * 960, -cy * 0.06, 970, 580);
      }
      ctx2.fillStyle = r.world === "uncreated" ? "#231b1530" : "#04131a30";
      ctx2.fillRect(0, 0, 960, 540);
      ctx2.strokeStyle = color + "35";
      ctx2.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        const x = (i * 210 - cx * 0.35) % 1500;
        ctx2.beginPath();
        ctx2.moveTo(x, -20);
        ctx2.lineTo(x, 300 + Math.sin(i) * 80);
        ctx2.stroke();
        ctx2.beginPath();
        ctx2.arc(x, 300 + Math.sin(i) * 80, 6, 0, Math.PI * 2);
        ctx2.stroke();
      }
      for (let i = 0; i < 30; i++) {
        const x = (i * 157 + Math.sin(time * 0.2 + i) * 12 - cx * 0.45) % 1050, y = (i * 83 + Math.sin(time * 0.35 + i) * 15) % 520;
        ctx2.globalAlpha = 0.16 + i % 4 * 0.07;
        ctx2.fillStyle = color;
        ctx2.fillRect(x, y, i % 6 === 0 ? 3 : 1.4, i % 6 === 0 ? 3 : 1.4);
      }
      ctx2.globalAlpha = 1;
      ctx2.save();
      if (s && s.player.flash > 0 && !setting.reduced && setting.shake > 0) ctx2.translate(Math.sin(time * 180) * 3 * setting.shake, Math.cos(time * 140) * 2 * setting.shake);
      ctx2.translate(-cx, -cy);
      const g = sideGeometry(s?.room ?? "threshold");
      for (const platform of [...g.platforms, ...s?.bridges ?? []]) this.platform(ctx2, platform, r, color);
      this.glyph(ctx2, g.checkpoint.x, g.checkpoint.y, color, s?.checkpoint.room === s?.room);
      ctx2.fillStyle = "#e1d4b7";
      ctx2.font = "11px sans-serif";
      ctx2.textAlign = "center";
      ctx2.fillText("REMEMBER", g.checkpoint.x, g.checkpoint.y - 18);
      for (const door of g.doors) this.door(ctx2, s, door, r, color);
      if (s && r.key && s.cleared.includes(s.room) && !s.keys.includes(r.key)) this.pickup(ctx2, r.width - 300, r.floor, "key", KEYS[r.key].color, time);
      if (s && !r.safe && !r.boss && !s.memories.includes(s.room)) {
        const ledge = g.platforms.filter((v) => v.oneWay).toSorted((a, b) => Math.abs(a.x + a.w / 2 - 850) - Math.abs(b.x + b.w / 2 - 850))[0];
        if (ledge) this.pickup(ctx2, ledge.x + ledge.w / 2, ledge.y, "memory", color, time);
      }
      if (r.secret && !s?.secrets.includes("feather")) {
        this.pickup(ctx2, g.secret.x, g.secret.y, "feather", "#eee1ba", time);
        ctx2.fillStyle = "#e9d9b7";
        ctx2.fillText("?", g.secret.x, g.secret.y - 78);
      }
      for (const mark of s?.marks ?? []) {
        ctx2.strokeStyle = mark.trigger ? "#fbc49d" : "#f3aa7480";
        ctx2.lineWidth = mark.trigger ? 5 : 2;
        ctx2.beginPath();
        ctx2.ellipse(mark.x, mark.y - 2, mark.r, 12, 0, 0, Math.PI * 2);
        ctx2.stroke();
        ctx2.fillStyle = "#f49e661b";
        ctx2.fillRect(mark.x - mark.r, mark.y - 95, mark.r * 2, 95);
      }
      for (const e2 of s?.enemies ?? []) {
        if (e2.hp <= 0) continue;
        this.enemy(ctx2, e2, time);
      }
      for (const bolt2 of s?.bolts ?? []) {
        ctx2.strokeStyle = bolt2.color;
        ctx2.lineWidth = bolt2.guardian ? 4 : 2.5;
        ctx2.globalAlpha = 0.45;
        ctx2.beginPath();
        ctx2.moveTo(bolt2.x - bolt2.vx * 0.07, bolt2.y - bolt2.vy * 0.07);
        ctx2.lineTo(bolt2.x, bolt2.y);
        ctx2.stroke();
        ctx2.globalAlpha = 1;
        ctx2.fillStyle = bolt2.color;
        ctx2.beginPath();
        ctx2.arc(bolt2.x, bolt2.y, bolt2.guardian ? 5 : 3.5, 0, Math.PI * 2);
        ctx2.fill();
        ctx2.fillStyle = "#fff7dd";
        ctx2.fillRect(bolt2.x - 1, bolt2.y - 1, 2, 2);
      }
      if (s) {
        const p = s.player;
        ctx2.fillStyle = "#00000070";
        ctx2.beginPath();
        ctx2.ellipse(p.x, p.y + 2, 32, 6, 0, 0, Math.PI * 2);
        ctx2.fill();
        if (p.invuln > 0) {
          ctx2.strokeStyle = SIDE_COLORS[s.form] + "80";
          ctx2.lineWidth = 1.5;
          ctx2.beginPath();
          ctx2.ellipse(p.x, p.y - 45, 44, 59, 0, 0, Math.PI * 2);
          ctx2.stroke();
        }
        this.body(ctx2, { ...p, form: s.form }, p.y, 0.66, s.phase === "fallen" ? 0.3 : 1);
        if (p.attack && !["spark", "computer"].includes(s.form)) {
          ctx2.strokeStyle = SIDE_COLORS[s.form];
          ctx2.globalAlpha = Math.max(0, 1 - p.attack.frame / p.attack.total);
          ctx2.lineWidth = p.attack.kind === "hk" ? 4 : 2;
          ctx2.beginPath();
          ctx2.ellipse(p.x + p.facing * 48, p.y - 40, p.attack.kind === "hk" ? 55 : 36, 26, -p.facing * 0.3, -1.2, 1.2);
          ctx2.stroke();
          ctx2.globalAlpha = 1;
        }
        if (s.phase === "fallen") this.glyph(ctx2, p.x, p.y, SIDE_COLORS[s.form], true);
      }
      for (const e2 of s?.events ?? []) {
        const age = time - e2.time;
        if (age < 0 || age > 0.45 || !["hit", "impact", "power", "enemy-down", "boss-down", "memory", "key", "secret"].includes(e2.type)) continue;
        ctx2.strokeStyle = ["hit", "impact"].includes(e2.type) ? "#f6dab0" : color;
        ctx2.globalAlpha = 1 - age / 0.45;
        ctx2.lineWidth = 2;
        for (let i = 0; i < 7; i++) {
          const a = i / 7 * Math.PI * 2, rad = 12 + age * 100;
          ctx2.beginPath();
          ctx2.moveTo(e2.x + Math.cos(a) * rad * 0.45, e2.y + Math.sin(a) * rad * 0.45);
          ctx2.lineTo(e2.x + Math.cos(a) * rad, e2.y + Math.sin(a) * rad);
          ctx2.stroke();
        }
        ctx2.globalAlpha = 1;
      }
      ctx2.restore();
      const shade = ctx2.createLinearGradient(0, 0, 0, 540);
      shade.addColorStop(0, "#06100e90");
      shade.addColorStop(0.25, "#06100e00");
      shade.addColorStop(0.78, "#06100e00");
      shade.addColorStop(1, "#03100f95");
      ctx2.fillStyle = shade;
      ctx2.fillRect(0, 0, 960, 540);
      if (s) {
        const nearest = g.doors.toSorted((a, b) => Math.hypot(s.player.x - a.x, s.player.y - a.y) - Math.hypot(s.player.x - b.x, s.player.y - b.y))[0], near = nearest && Math.hypot(s.player.x - nearest.x, s.player.y - nearest.y) < 125;
        let prompt = "";
        if (near) {
          const status = sideDoorStatus(s, nearest);
          prompt = (this.settings().inputProfile === "controller" ? "RT" : this.settings().inputProfile === "mobile" ? "GATE" : "E") + " \xB7 " + SIDE_ROOMS[nearest.to].name + " \xB7 " + status.reason;
        } else if (Math.hypot(s.player.x - g.checkpoint.x, s.player.y - g.checkpoint.y) < 85) prompt = "E / RT / GATE \xB7 remember this checkpoint";
        if (prompt) {
          ctx2.font = "13px sans-serif";
          ctx2.textAlign = "center";
          const width = Math.min(850, ctx2.measureText(prompt).width + 30);
          ctx2.fillStyle = "#0c201def";
          ctx2.fillRect(480 - width / 2, 494, width, 32);
          ctx2.strokeStyle = color + "65";
          ctx2.strokeRect(480 - width / 2, 494, width, 32);
          ctx2.fillStyle = "#eee1bf";
          ctx2.fillText(prompt, 480, 514, width - 15);
        }
        const boss = s.enemies.find((e2) => e2.boss && e2.hp > 0);
        if (boss) {
          ctx2.fillStyle = "#071c1edc";
          ctx2.fillRect(260, 20, 440, 47);
          ctx2.fillStyle = "#e7d5ac";
          ctx2.font = "14px Georgia";
          ctx2.textAlign = "center";
          ctx2.fillText(sideEnemyName(boss.kind), 480, 37);
          ctx2.fillStyle = "#1a3335";
          ctx2.fillRect(280, 46, 400, 7);
          ctx2.fillStyle = "#ecb572";
          ctx2.fillRect(280, 46, 400 * boss.hp / boss.maxHp, 7);
        }
      }
      ctx2.restore();
    }
    platform(ctx2, p, r, color) {
      const root = ["roots"].includes(r.layout) || r.world === "verdant", floor = !p.oneWay;
      ctx2.fillStyle = root ? "#172e24" : r.world === "cinder" ? "#302420" : "#162e32";
      ctx2.fillRect(p.x, p.y, p.w, p.h);
      ctx2.fillStyle = "#071717";
      ctx2.fillRect(p.x, p.y + p.h * 0.48, p.w, p.h * 0.52);
      ctx2.strokeStyle = color + "b5";
      ctx2.lineWidth = 2;
      ctx2.beginPath();
      ctx2.moveTo(p.x, p.y + 1);
      ctx2.lineTo(p.x + p.w, p.y + 1);
      ctx2.stroke();
      ctx2.strokeStyle = color + "20";
      ctx2.lineWidth = 1;
      for (let x = p.x + 40; x < p.x + p.w; x += 80) {
        ctx2.beginPath();
        ctx2.moveTo(x, p.y + 4);
        ctx2.lineTo(x - 8, p.y + Math.min(p.h - 1, 36));
        ctx2.stroke();
      }
      if (root) {
        ctx2.strokeStyle = "#719777";
        for (let x = p.x + 17; x < p.x + p.w; x += 43) {
          ctx2.beginPath();
          ctx2.moveTo(x, p.y);
          ctx2.quadraticCurveTo(x + 9, p.y - 12, x + 13, p.y - 5);
          ctx2.stroke();
        }
      }
      if (!floor) {
        ctx2.fillStyle = color + "35";
        ctx2.fillRect(p.x + 12, p.y + 6, p.w - 24, 2);
        ctx2.strokeStyle = color + "20";
        ctx2.beginPath();
        ctx2.moveTo(p.x + 18, p.y + p.h);
        ctx2.lineTo(p.x + 26, p.y + p.h + 20);
        ctx2.moveTo(p.x + p.w - 18, p.y + p.h);
        ctx2.lineTo(p.x + p.w - 26, p.y + p.h + 20);
        ctx2.stroke();
      }
    }
    glyph(ctx2, x, y, color, active) {
      ctx2.save();
      ctx2.translate(x, y - 2);
      ctx2.scale(1, 0.24);
      ctx2.strokeStyle = color + (active ? "cc" : "55");
      ctx2.lineWidth = 2;
      ctx2.beginPath();
      ctx2.arc(0, 0, 39, 0, Math.PI * 2);
      ctx2.stroke();
      ctx2.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3;
        ctx2.moveTo(Math.cos(a) * 30, Math.sin(a) * 30);
        ctx2.lineTo(Math.cos(a + 2 * Math.PI / 3) * 30, Math.sin(a + 2 * Math.PI / 3) * 30);
      }
      ctx2.stroke();
      ctx2.restore();
    }
    door(ctx2, s, d, r, color) {
      const status = s ? sideDoorStatus(s, d) : { open: true }, x = d.x, y = d.y;
      if (d.secret) {
        ctx2.save();
        ctx2.translate(x, y);
        ctx2.strokeStyle = status.open ? "#dcc8fd" : "#9c8cb180";
        ctx2.lineWidth = 2;
        ctx2.beginPath();
        ctx2.ellipse(0, -46, 28, 44, 0, 0, Math.PI * 2);
        ctx2.stroke();
        this.glyph(ctx2, 0, 0, "#cbb7ed", status.open);
        ctx2.textAlign = "center";
        ctx2.fillStyle = "#d9c8ec";
        ctx2.font = "10px sans-serif";
        ctx2.fillText("FEATHER SEAM \xB7 " + SIDE_ROOMS[d.to].name, 0, -111, 260);
        ctx2.fillText(status.open ? "E / RT / GATE" : "? \xB7 " + (s?.secrets.includes("feather") ? "CINDER SEAL" : "FEATHER"), 0, -95, 220);
        ctx2.restore();
        return;
      }
      ctx2.save();
      ctx2.translate(x, y);
      ctx2.fillStyle = "#041719d9";
      ctx2.beginPath();
      ctx2.moveTo(-28, 0);
      ctx2.lineTo(-28, -96);
      ctx2.quadraticCurveTo(0, -133, 28, -96);
      ctx2.lineTo(28, 0);
      ctx2.closePath();
      ctx2.fill();
      ctx2.strokeStyle = status.open ? color + "ba" : "#ab907570";
      ctx2.lineWidth = 2;
      ctx2.stroke();
      ctx2.fillStyle = status.open ? color + "1f" : "#96745518";
      ctx2.fillRect(-21, -88, 42, 88);
      this.glyph(ctx2, 0, 0, color, status.open);
      ctx2.fillStyle = "#dfd0ae";
      ctx2.font = "11px sans-serif";
      ctx2.textAlign = "center";
      ctx2.fillText(SIDE_ROOMS[d.to].name, 0, -151, 220);
      ctx2.font = "9px sans-serif";
      ctx2.fillStyle = status.open ? "#a1d4c1" : "#c6ab84";
      ctx2.fillText((d.branch ? "UP / BRANCH" : d.side.toUpperCase()) + " \xB7 " + (status.open ? "OPEN" : d.key ? "KEY" : d.form ? SIDE_NAMES[d.form].toUpperCase() : d.seal ? "SEAL" : "SEALED"), 0, -132, 180);
      ctx2.restore();
    }
    pickup(ctx2, x, y, kind, color, time) {
      const bob = this.settings().reduced ? 0 : Math.sin(time * 3) * 4;
      ctx2.save();
      ctx2.translate(x, y - 38 + bob);
      ctx2.strokeStyle = color;
      ctx2.lineWidth = 2;
      ctx2.fillStyle = color + "24";
      ctx2.beginPath();
      ctx2.ellipse(0, 0, 22, 27, 0, 0, Math.PI * 2);
      ctx2.fill();
      if (kind === "key") {
        ctx2.beginPath();
        ctx2.arc(-4, -7, 6, 0, Math.PI * 2);
        ctx2.moveTo(0, -2);
        ctx2.lineTo(10, 10);
        ctx2.moveTo(5, 5);
        ctx2.lineTo(9, 1);
        ctx2.stroke();
      } else if (kind === "feather") {
        ctx2.beginPath();
        ctx2.ellipse(0, 0, 6, 20, 0.4, 0, Math.PI * 2);
        ctx2.stroke();
        ctx2.beginPath();
        ctx2.moveTo(-7, 21);
        ctx2.lineTo(7, -21);
        ctx2.stroke();
      } else {
        ctx2.beginPath();
        ctx2.moveTo(0, -12);
        ctx2.lineTo(8, 0);
        ctx2.lineTo(0, 12);
        ctx2.lineTo(-8, 0);
        ctx2.closePath();
        ctx2.fillStyle = color;
        ctx2.fill();
      }
      ctx2.restore();
    }
    enemy(ctx2, e2, time) {
      const color = e2.boss ? "#f1bc77" : "#7bc8c6";
      if (e2.root > 0) {
        ctx2.strokeStyle = "#97c39e";
        ctx2.lineWidth = 3;
        for (let j = -2; j <= 2; j++) {
          ctx2.beginPath();
          ctx2.moveTo(e2.x + j * 14, e2.y);
          ctx2.lineTo(e2.x + j * 4, e2.y - 70);
          ctx2.stroke();
        }
      }
      if (WORLD_GUARDIANS[e2.kind] && this.images.worldBosses?.complete && this.images.worldBosses.naturalWidth) {
        const image = this.images.worldBosses, cell = WORLD_GUARDIANS[e2.kind].sprite, sw = image.naturalWidth / 3, sh = image.naturalHeight / 2, size = e2.kind === "demiurge" ? 280 : 250;
        ctx2.save();
        ctx2.translate(e2.x, e2.y);
        if (e2.flash > 0 && this.settings().flashes > 0) ctx2.filter = "brightness(1.4)";
        ctx2.drawImage(image, cell % 3 * sw, Math.floor(cell / 3) * sh, sw, sh, -size / 2, -size + 12, size, size);
        ctx2.restore();
      } else this.body(ctx2, { ...e2, form: e2.kind === "hound" ? "animal" : e2.kind === "mirror" ? "computer" : e2.kind === "warden" ? "archon" : e2.kind, grounded: true, walk: time * 2, attack: e2.windup > 0 ? { kind: "heavy", frame: 12 } : null }, e2.y, e2.boss ? 1.02 : 0.62);
      if (e2.windup > 0) {
        ctx2.strokeStyle = e2.boss ? "#f9c783" : "#7decf0";
        ctx2.lineWidth = e2.boss ? 3 : 1;
        ctx2.beginPath();
        ctx2.arc(e2.x, e2.y - (e2.boss ? 110 : 45), e2.boss ? 58 : 25, 0, Math.PI * 2);
        ctx2.stroke();
        if (!e2.boss) {
          const p = this.journey.player;
          ctx2.beginPath();
          ctx2.moveTo(e2.x, e2.y - 42);
          ctx2.lineTo(p.x, p.y - 35);
          ctx2.stroke();
        }
      }
      if (!e2.boss && Math.abs(e2.x - this.journey.player.x) < 120) {
        ctx2.strokeStyle = "#f4917880";
        ctx2.lineWidth = 2;
        ctx2.beginPath();
        ctx2.ellipse(e2.x, e2.y - 2, 48 + Math.sin(time * 9) * 5, 10, 0, 0, Math.PI * 2);
        ctx2.stroke();
      }
      if (!e2.boss) {
        ctx2.fillStyle = "#0c252b";
        ctx2.fillRect(e2.x - 26, e2.y - 125, 52, 4);
        ctx2.fillStyle = color;
        ctx2.fillRect(e2.x - 26, e2.y - 125, 52 * e2.hp / e2.maxHp, 4);
      }
    }
  };

  // descent.js
  var $ = (id) => document.getElementById(id);
  var CAMPAIGN_KEY = "spark-substrate-descent-v2";
  var signed = (n) => n > 0 ? "+" + n : String(n);
  var pad = (n) => String(n).padStart(2, "0");
  var KEY = CAMPAIGN_KEY;
  var PREVIOUS_KEY = "spark-substrate-previous-spark";
  var CREDENTIAL_KEY = "spark-substrate-save-credential";
  var PROFILE_INDEX = "spark-substrate-save-profiles-v1";
  var ACTIVE_PROFILE = "spark-substrate-active-save-v1";
  var personalKey = (k) => /^spark-substrate-descent-v2:coop:[A-HJ-NP-Z2-9]{8}:(host|guest)$/.test(k);
  try {
    const key = sessionStorage.getItem(ACTIVE_PROFILE);
    if (personalKey(key)) {
      KEY = key;
      CREDENTIAL_KEY = key + ":credential";
      PREVIOUS_KEY = key + ":previous";
    }
  } catch {
  }
  var RELIC_ICON = '<svg class="small-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l8 9-8 9-8-9zM12 3v18M4 12h16"/></svg>';
  var KEY_ICON = '<svg class="small-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="7" cy="8" r="4"/><path d="M10 11l10 10m-5-5 3-3m-1 5 3-3"/></svg>';
  var mapWorld = "stratum";
  var loadEpoch = 0;
  var storyChoice = null;
  var storyChoiceContext = null;
  var entryMode = "start";
  var campaignEntered = false;
  var railExpanded = false;
  var dungeonState = loadDungeon(localStorage);
  var campaignCache = null;
  var keepsakes = loadKeepsakes(localStorage);
  var keepsakeStamp = "";
  var swarmPact = loadNextPact();
  var selectedSparkCard = null;
  var tableSession = loadTableSession(localStorage);
  var tableChoice = null;
  var tableSaveClock = 0;
  var meta = createMeta();
  var run = null;
  var paused = false;
  var modalWasPaused = false;
  var menu = true;
  var saveAvailable = true;
  var overlaySignature = "";
  var sound = false;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (validMeta(saved.meta)) {
        meta = prepareEquipment(saved.meta);
        if (validRun(saved.run)) {
          run = saved.run;
          menu = false;
          paused = run.phase === "playing";
        }
      }
    } else {
      const origin = JSON.parse(localStorage.getItem("spark-substrate-journey-v1") ?? "null");
      if (validateSave(origin)) meta = createMeta(origin);
    }
  } catch {
    saveAvailable = false;
  }
  var canvas = $("game-canvas");
  var ctx = canvas.getContext("2d", { alpha: false });
  var frame = $("canvas-frame");
  var images = { floor: new Image(), sprites: new Image(), enemies: new Image(), floors: new Image(), newEnemies: new Image(), newFloors: new Image(), castleFloors: new Image(), props: new Image(), worldFloors: new Image(), worldBosses: new Image(), duelFighters: new Image(), duelStrikes: new Image(), duelKicks: new Image(), duelStages: new Image() };
  images.floor.src = "arena.webp";
  images.sprites.src = "sprites.webp";
  images.enemies.src = "enemies.webp";
  images.floors.src = "floors.webp";
  images.newEnemies.src = "enemies-v4.webp";
  images.newFloors.src = "floors-v4.webp";
  images.castleFloors.src = "floors-v5.webp";
  images.props.src = "props-v5.webp";
  images.worldFloors.src = "world-floors-v6.webp";
  images.worldBosses.src = "world-bosses-v6.webp";
  images.duelFighters.src = "duel-fighters-v12.webp";
  images.duelStrikes.src = "duel-strikes-v128.webp";
  images.duelKicks.src = "duel-kicks-v128.webp";
  images.duelStages.src = "duel-stages-v128.webp";
  var imageFailure = false;
  for (const image of Object.values(images)) image.addEventListener("error", () => {
    imageFailure = true;
    announce("The artwork did not load. Please reload the game.");
    renderOverlay(true);
  });
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var touchDevice = false;
  var settings = defaultSettings(reducedMotion);
  var skillForm = "spark";
  var bindingCapture = null;
  var controllerButtons = [];
  var controller = { connected: false, x: 0, y: 0 };
  try {
    settings = cleanSettings(JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "null"), reducedMotion);
  } catch {
  }
  var playerName = "";
  try {
    playerName = cleanPlayerName(localStorage.getItem("spark-substrate-player-name-v1"));
  } catch {
  }
  if (settings.fireMode === "surge" && !hasAlcove(keepsakes, "surge")) settings.fireMode = "auto";
  sound = settings.audio;
  var audio = new SparkAudio(window, settings);
  var betweenLives = () => !run || ["dead", "won"].includes(run.phase);
  function persistSettings() {
    settings.audio = sound;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      announce("Settings could not be saved on this device.");
    }
    audio.settings = settings;
    audio.ambient();
    renderSettings();
  }
  function renderPendingChoice() {
    const pending = ["descent", "dungeon", "rematch"].includes(entryMode) && run && !menu && ["boon", "resolve", "milestone"].includes(run.phase), note = $("settings-pending");
    note.hidden = !pending;
    const text = pending ? (run.phase === "boon" ? "Your gift is waiting." : run.phase === "resolve" ? run.dungeon ? "Your floor checkpoint is waiting." : "Your story choice is waiting." : "Your descent choice is waiting.") + " Close settings to return to it." : "";
    if (note.textContent !== text) note.textContent = text;
  }
  function renderSettings() {
    renderFireSettings();
    renderPendingChoice();
    $("setting-profile").value = settings.inputProfile ?? "";
    $("damage-numbers").textContent = "Damage numbers " + (settings.damageNumbers ? "on" : "off");
    $("damage-numbers").setAttribute("aria-pressed", String(settings.damageNumbers));
    $("entry-sound").textContent = sound ? "Mute sound" : "Enable sound";
    for (const id of ["master", "effects", "ambient", "shake", "flashes"]) {
      $("setting-" + id).value = Math.round(settings[id] * 100);
      $("setting-value-" + id).textContent = Math.round(settings[id] * 100) + "%";
    }
    const profile = $("control-profile");
    if (profile) profile.textContent = profileCopy(settings.inputProfile, settings.bindings);
    $("binding-list").innerHTML = Object.entries(BINDING_LABELS).map(([action, label]) => `<button data-action="remap" data-binding="${action}" class="${bindingCapture === action ? "listening" : ""}"><span>${label}</span><kbd>${bindingCapture === action ? "Press a key\u2026" : keyLabel(settings.bindings[action])}</kbd></button>`).join("");
    $("settings-sound").textContent = sound ? "Mute sound" : "Enable sound";
    $("sound-button").textContent = sound ? "Mute sound" : "Enable sound";
    $("sound-button").title = sound ? "Sound is on" : "Sound is off";
    $("sound-button").setAttribute("aria-pressed", String(sound));
    $("controller-toggle").textContent = settings.controller ? "Controller enabled" : "Controller disabled";
    $("controller-status").textContent = controller.connected ? "Connected \xB7 " + controller.name : "Connect a standard controller, then press a button.";
  }
  function renderSkills() {
    const active = !betweenLives(), shared = active ? run.training : meta.training, training = prepareTraining(shared), entry = training[skillForm], pending = active ? (online.role === "guest" ? run.partnerMasteryEarned : run.masteryEarned)?.[skillForm] ?? 0 : 0, chosen = specialty(training, skillForm), points = availablePoints(skillForm, entry), progress2 = Math.min(100, entry.xp / 100 * 100);
    $("skill-tabs").innerHTML = Object.keys(SKILL_TREES).map((form) => `<button class="${form === skillForm ? "selected" : ""}" data-action="skill-form" data-form="${form}" aria-pressed="${form === skillForm}">${FORMS[form].name}</button>`).join("");
    $("skill-content").innerHTML = `<div class="mastery-overview"><span class="sprite-portrait" style="${spriteStyle(skillForm)}"></span><div><h3>${FORMS[skillForm].name} \xB7 ${chosen?.name ?? "Choose a specialty"}</h3><p>${entry.xp} mastery \xB7 ${points} available / ${earnedPoints(entry)} earned points${pending ? " \xB7 +" + pending + " after this life" : ""}</p><div class="mastery-track"><span style="width:${progress2}%"></span></div></div></div>${active ? `<p class="overlay-note">${run.daily ? "Permanent skills are disabled in the daily current." : online.active ? "This shared life uses the host\u2019s learned trees. Each spark banks its own practice." : "This life keeps the skills it began with."} Learn or rebuild between lives.</p>` : ""}<div class="skill-branches">${SKILL_TREES[skillForm].map((branch) => `<section class="skill-branch"><h3>${branch.name}</h3>${branch.nodes.map((node) => {
      const status = skillStatus(training, skillForm, node.id);
      return `<button class="skill-node ${node.specialty ? "specialty-node" : ""} ${status.learned ? "learned" : ""}" data-action="learn-skill" data-form="${skillForm}" data-skill="${node.id}" ${active || !status.available ? "disabled" : ""}><strong>${node.name}</strong><span>${node.desc}</span><small>${node.specialty ? "SPECIALTY \xB7 " : ""}${status.learned ? "Remembered" : status.reason}</small></button>`;
    }).join("")}</section>`).join("")}</div><div class="skill-footer"><button class="secondary-button" data-action="rebuild-tree" data-form="${skillForm}" ${active || !entry.learned.length ? "disabled" : ""}>Rebuild this tree \xB7 free</button><p>Mastery stays. Rebuilding returns all spent points and lets you choose another specialty.</p></div>`;
  }
  var hint = (action) => inputHint(settings.inputProfile, action, settings.bindings);
  function requireDescent() {
    if (!["descent", "dungeon", "rematch"].includes(entryMode) || !INPUT_PROFILES.includes(settings.inputProfile)) throw Error("Choose an input profile and confirm Descent on the start page first.");
  }
  function renderStart() {
    const ready = INPUT_PROFILES.includes(settings.inputProfile);
    touchDevice = settings.inputProfile === "mobile";
    $("start-screen").hidden = entryMode !== "start";
    $("descent-root").hidden = !["descent", "dungeon", "rematch"].includes(entryMode);
    $("duel-root").hidden = entryMode !== "duel";
    $("vault-root").hidden = entryMode !== "vault";
    $("table-root").hidden = entryMode !== "table";
    $("side-root").hidden = entryMode !== "sideways";
    $("entry-coins").textContent = keepsakes.coins;
    renderSaveProfiles();
    renderFireSettings();
    $("entry-pact").checked = swarmPact;
    for (const profile of INPUT_PROFILES) {
      $("profile-" + profile).setAttribute("aria-pressed", String(settings.inputProfile === profile));
      $("profile-" + profile).classList.toggle("selected", settings.inputProfile === profile);
    }
    $("profile-copy-pc").textContent = profileCopy("pc", settings.bindings);
    $("entry-status").textContent = ready ? PROFILE_LABELS[settings.inputProfile] + " selected. Confirm a mode to enter." : "Choose an input profile, then confirm a mode.";
    for (const id of ["entry-begin", "entry-daily", "entry-duel", "entry-host", "entry-join", "entry-dungeon", "entry-sideways"]) $(id).disabled = !ready;
    $("entry-rematches").hidden = !rematchBosses(meta, run).length;
    $("entry-rematches").disabled = !ready || online.active;
    $("entry-sideways").disabled = !ready || online.active;
    $("entry-sideways").textContent = side.journey ? "Sideways descent \xB7 continue journey" : "Sideways descent \xB7 platform adventure";
    $("entry-duel").disabled = !ready || online.active;
    $("entry-dungeon").disabled = !ready || online.active;
    $("entry-dungeon").textContent = dungeonState.run && !["dead"].includes(dungeonState.run.phase) ? "Endless dungeon \xB7 continue floor " + (dungeonState.run.dungeon.floor + (dungeonState.run.phase === "resolve" ? 1 : 0)) : "Endless dungeon";
    $("entry-continue").hidden = !hasJourney(meta, run);
    $("entry-continue").disabled = !ready;
    $("entry-sound").textContent = sound ? "Mute sound" : "Enable sound";
    $("entry-sound").setAttribute("aria-pressed", String(sound));
    $("descent-root").classList.toggle("input-mobile", touchDevice);
    $("duel-root").classList.toggle("input-mobile", touchDevice);
    $("duel-root").classList.toggle("input-controller", settings.inputProfile === "controller");
    $("orientation-note").hidden = !touchDevice;
    for (const id of ["start-screen", "descent-root", "duel-root", "vault-root", "table-root", "side-root"]) {
      $(id).inert = $(id).hidden;
      $(id).setAttribute("aria-hidden", String($(id).hidden));
    }
    canvas.hidden = !["descent", "dungeon", "rematch"].includes(entryMode);
    canvas.tabIndex = canvas.hidden ? -1 : 0;
    $("duel-canvas").hidden = entryMode !== "duel";
    $("duel-canvas").tabIndex = entryMode === "duel" ? 0 : -1;
    $("side-canvas").hidden = entryMode !== "sideways";
    $("side-canvas").tabIndex = entryMode === "sideways" ? 0 : -1;
    if (!["descent", "dungeon", "rematch"].includes(entryMode)) $("touch-controls").hidden = true;
  }
  function chooseProfile(profile) {
    if (!INPUT_PROFILES.includes(profile)) throw Error("Choose PC, Controller, or Mobile.");
    settings.inputProfile = profile;
    if (profile === "controller") settings.controller = true;
    clearInput();
    controllerButtons = [];
    persistSettings();
    renderStart();
    renderRail();
    renderOverlay(true);
    duel.setProfile(profile);
    side.clearInputs();
    if (entryMode === "sideways") side.render(true);
    if (sound) void audio.enable(true).catch((error) => {
      sound = false;
      persistSettings();
      announce(error.message);
    });
    if (entryMode === "start") $("entry-begin").focus({ preventScroll: true });
  }
  function enterDescent(intent = "descent") {
    if (["dungeon", "rematch"].includes(entryMode)) returnToStart();
    if (!INPUT_PROFILES.includes(settings.inputProfile)) throw Error("Choose how you enter first.");
    entryMode = "descent";
    campaignEntered = true;
    if (intent === "host" || intent === "join") {
      progress?.dispose();
      progress = null;
    } else if (!progress) connectProgress();
    renderSaveStatus();
    renderStart();
    resize();
    if (intent === "continue" && run?.phase === "playing") paused = false;
    finish();
    renderRail();
    renderOverlay(true);
    if (intent === "daily") act("daily");
    if (intent === "host" || intent === "join") {
      onlineIntent = intent;
      act("online");
      $(intent === "host" ? "online-host" : "online-code").focus({ preventScroll: true });
    }
    if (!online.active && !["host", "join"].includes(intent)) {
      onlineRecovery = online.resume();
      void onlineRecovery.then((resumed) => {
        if (resumed) {
          $("online-room-code").textContent = online.code;
          renderOverlay(true);
          renderRail();
          focusCanvas();
        }
      });
    }
  }
  function returnToStart() {
    if (entryMode === "sideways") {
      side.save();
      side.clearInputs();
    }
    if (entryMode === "table") saveTable();
    if (["dungeon", "rematch"].includes(entryMode)) {
      if (entryMode === "dungeon" && run?.phase === "resolve" && run.xp < run.nextXp) nextDungeonFloor(run);
      save();
      run = campaignCache?.run ?? null;
      menu = campaignCache?.menu ?? true;
      paused = campaignCache?.paused ?? false;
      campaignCache = null;
    }
    if (entryMode === "descent") {
      if (run?.phase === "playing") paused = true;
      clearInput();
      save();
    }
    entryMode = "start";
    clearInput();
    renderStart();
  }
  function enterDungeon() {
    if (!INPUT_PROFILES.includes(settings.inputProfile)) throw Error("Choose how you enter first.");
    if (online.active) throw Error("Leave the co-op room before entering the dungeon.");
    if (entryMode === "rematch") returnToStart();
    if (entryMode === "dungeon") return;
    if (entryMode === "descent") save();
    campaignCache = { run, menu, paused };
    run = dungeonState.run;
    menu = !run;
    paused = run?.phase === "playing";
    entryMode = "dungeon";
    clearInput();
    seenFeedback.clear();
    visualPositions.clear();
    renderStart();
    resize();
    renderRail();
    renderOverlay(true);
  }
  function enterSideways() {
    if (!INPUT_PROFILES.includes(settings.inputProfile)) throw Error("Choose how you enter first.");
    if (online.active) throw Error("Leave the co-op room before taking the side path.");
    returnToStart();
    entryMode = "sideways";
    renderStart();
    side.open();
  }
  function enterDuel() {
    if (["dungeon", "rematch"].includes(entryMode)) returnToStart();
    if (!INPUT_PROFILES.includes(settings.inputProfile)) throw Error("Choose how you enter first.");
    if (online.active) throw Error("Leave the co-op room before entering a duel.");
    entryMode = "duel";
    clearInput();
    renderStart();
    duel.open();
  }
  function rematchContent() {
    const bosses = rematchBosses(meta, entryMode === "rematch" ? campaignCache?.run : run);
    return `<p>Refight a guardian you have encountered. Every attempt uses a fixed practice level for that world, starter gear, and your vessel\u2019s native weapon. Campaign equipment, enhancements, and mastery do not change the challenge. Your campaign is kept, and echoes grant no campaign rewards.</p><div class="rematch-grid">${bosses.length ? bosses.map((b) => `<button class="secondary-button" data-action="boss-rematch" data-room="${b.id}"><span class="guardian-portrait ${b.id === "forge" ? "cantor-portrait" : ""}" aria-hidden="true"></span><b>${b.name}</b><span>${WORLDS[b.world].name}</span></button>`).join("") : "<p>Meet your first guardian to unlock a rematch.</p>"}</div>`;
  }
  function enterBossRematch(room2) {
    if (!INPUT_PROFILES.includes(settings.inputProfile)) throw Error("Choose an input profile first.");
    if (online.active || entryMode === "dungeon" || entryMode === "duel") throw Error("Return to your solo campaign before a guardian rematch.");
    const source = entryMode === "rematch" ? campaignCache?.run : run, next = createBossRematch(meta, source, room2), priorPause = document.querySelector("dialog[open]") ? modalWasPaused : paused;
    if (entryMode !== "rematch") {
      save();
      campaignCache = { run, menu, paused: priorPause, mode: entryMode };
    }
    modalWasPaused = false;
    document.querySelectorAll("dialog[open]").forEach((d) => {
      d.dataset.skipPauseRestore = "true";
      d.close();
    });
    run = next;
    entryMode = "rematch";
    renderStart();
    resize();
    beginLife();
    return observeRun(run, meta);
  }
  function returnFromRematch() {
    if (entryMode !== "rematch") throw Error("No rematch is active.");
    const cached = campaignCache;
    run = cached?.run ?? null;
    menu = cached?.menu ?? true;
    paused = cached?.paused ?? false;
    entryMode = "descent";
    campaignEntered = true;
    campaignCache = null;
    resize();
    clearInput();
    renderStart();
    renderRail();
    renderOverlay(true);
  }
  function rematchResultContent() {
    const boss = run.enemies.find((e2) => e2.maxHp > 0), hp = run.phase === "won" ? 0 : Math.max(0, boss?.hp ?? 0), max = run.phase === "won" ? run.rematch.health : boss?.maxHp ?? run.rematch.health, percent = max ? hp / max * 100 : 0;
    return `<div class="menu-card"><span class="eyebrow">GUARDIAN ECHO \xB7 ${run.phase === "won" ? "DEFEATED" : "ATTEMPT COMPLETE"}</span><h2>${run.phase === "won" ? escapeText(run.bossDefeated.name) + " defeated" : "The echo holds."}</h2><p>Your campaign and its waiting choices are kept. No essence, seals, equipment, or mastery are awarded in practice.${run.phase === "won" && run.room === "forge" ? " Cantor is remembered for Duel and the ladder." : ""}</p><div class="result-stats"><div><strong>${Math.floor(run.time / 60)}:${pad(Math.floor(run.time) % 60)}</strong><span>time</span></div><div><strong>${Math.round(run.stats.damageDealt).toLocaleString()}</strong><span>damage dealt</span></div><div><strong>${Math.ceil(hp)} / ${Math.ceil(max)}</strong><span>guardian HP remaining \xB7 ${percent.toFixed(1)}%</span></div></div><div class="menu-actions"><button class="primary-button" data-action="boss-rematch" data-room="${run.rematch.room}">Refight this echo</button><button class="secondary-button" data-action="rematch-return">Return to your journey</button></div></div>`;
  }
  function renderGuide() {
    const unlocked = guideUnlocks(meta, run, settings.guideGift);
    unlocked.endless = meta.runs > 0;
    if (entryMode === "dungeon") {
      unlocked.gift = true;
      unlocked.resonance = true;
    }
    $("guide-controls").textContent = moveHint(settings.inputProfile, settings.bindings) + " to move. " + hint("dash") + " to dash with a brief moment of invulnerability.";
    $("guide-gate-controls").textContent = (settings.inputProfile === "controller" ? "D-pad highlights a story option; A confirms." : settings.inputProfile === "mobile" ? "Tap a story card to choose." : "Numbers 1\u20133 highlight a story option; Enter confirms it. Clicking a story card chooses directly.") + " Walk to a cleared gate: " + hint("interact") + ". " + hint("map") + " opens the connected map.";
    $("guide-power-controls").textContent = hint("power") + " uses your vessel power.";
    $("guide-gift-controls").textContent = settings.inputProfile === "controller" ? "D-pad highlights; A chooses." : settings.inputProfile === "mobile" ? "Tap a whole gift card." : "Press 1, 2, or 3, or click a whole gift card.";
    $("guide-resonance-controls").textContent = settings.inputProfile === "controller" ? "Y opens vessels; D-pad highlights; A inhabits." : settings.inputProfile === "mobile" ? "Tap MORPH, then tap a vessel." : hint("morph") + " opens vessels; 1\u20136 or a whole card inhabits.";
    $("guide-coop-controls").textContent = "In co-op, hold " + (settings.inputProfile === "mobile" ? "GATE" : hint("interact")) + " near a fallen partner for two seconds to rekindle them; both players must approach a gate to cross.";
    for (const section of $("guide").querySelectorAll?.("[data-guide]") ?? []) section.hidden = entryMode === "dungeon" ? !["intro", "gift", "endless"].includes(section.dataset.guide) : !unlocked[section.dataset.guide];
    for (const copy of $("guide").querySelectorAll?.("[data-resonance-copy]") ?? []) copy.hidden = !unlocked.resonance;
    $("guide-intro").textContent = moveHint(settings.inputProfile, settings.bindings) + ". " + hint("dash") + " to dash. Your weapon fights." + (entryMode === "dungeon" ? " Clear floors, remember gifts, then descend. " + hint("morph") + " changes between all six vessels." : " Go north.");
  }
  function summaryHtml(record) {
    if (!record) return "<p>Your first life is waiting.</p>";
    return `<div class="result-stats extended">${[[record.chambers, record.chambers === 1 ? "combat chamber" : "combat chambers"], [record.kills, "constructs"], [Number(record.damageDealt ?? 0).toLocaleString(), "damage dealt"], [Math.floor(record.seconds / 60) + ":" + pad(record.seconds % 60), "time"], [record.powers ?? 0, "powers used"], [meta.bestRun?.chambers ?? record.chambers, "best combat chambers"]].map(([value, label]) => `<div><strong>${escapeText(value)}</strong><span>${label}</span></div>`).join("")}</div><div class="run-build"><p><b>${FORMS[record.form]?.name ?? "Spark"} \xB7 LV ${record.level}</b>${record.daily ? " \xB7 Daily " + escapeText(record.daily.day) + " UTC" : ""}</p><p>${(record.equipment ?? []).map(escapeText).join(" \xB7 ") || "Native vessel weapon"}</p><p>${(record.gifts ?? []).map((gift) => escapeText(BOONS[gift.id]?.name ?? gift.id) + " \xD7" + Number(gift.count)).join(" \xB7 ") || "No battle gifts"}</p><p>${Object.entries(record.mastery ?? {}).filter(([, xp]) => xp > 0).map(([form, xp]) => FORMS[form].name + " +" + xp + " mastery").join(" \xB7 ") || (record.daily ? "Daily results grant no campaign mastery." : "Mastery grows by clearing chambers.")}</p></div>`;
  }
  var keys = /* @__PURE__ */ new Set();
  var stick = { x: 0, y: 0 };
  var dashRequested = false;
  var powerRequested = false;
  var interactRequested = false;
  var interactHeld = false;
  var fireHeld = false;
  var pointer = null;
  var viewport = { w: 960, h: 600, dpr: 1 };
  var camera = { x: 0, w: WIDTH, scale: 1 };
  var escapeText = (value) => String(value ?? "").replace(/[&<>"']/g, (c2) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c2]);
  var keepsakeBanner = null;
  function persistKeepsakes() {
    try {
      saveKeepsakes(localStorage, keepsakes);
    } catch {
      announce("Coins and cards could not be saved on this device.");
    }
    keepsakeStamp = JSON.stringify(keepsakes);
    $("entry-coins").textContent = keepsakes.coins;
  }
  function showCardFind(card) {
    if (!card) return;
    keepsakeBanner = { title: card.duplicate ? "Remembered again \xB7 +2 coins" : card.name + " \xB7 CARD FOUND", text: card.duplicate ? "The duplicate becomes Substrate coins." : SPARK_CARDS[card.id].rule, until: performance.now() + 4500 };
    announce(keepsakeBanner.title);
    audio.effect(card.duplicate ? "chime" : "key");
  }
  function syncKeepsakes() {
    rememberEncounter(keepsakes, { forms: [...meta.visited ?? [], ...run?.visitedVessels ?? (run ? [run.form] : [])], enemies: [...meta.seenEnemies ?? [], ...run?.seenEnemies ?? []], cantorWon: !!run?.rematch && run.room === "forge" && run.phase === "won" });
    if (run?.rematch && run.room === "forge" && run.phase === "won") showCardFind(findSparkCard(keepsakes, "second-movement", "echo:" + run.seed + ":forge"));
    if (run && !run.rematch && !ROOMS[run.room].safe && run.cleared.includes(run.room) && run.lastClear?.room === run.room && run.lastClear.visit === (run.visitNumber ?? 0) && run.lastClear.floor === (run.dungeon?.floor ?? 0)) {
      const visit = (run.dungeon ? "endless:" : "descent:") + run.seed + ":" + (run.dungeon ? run.dungeon.floor : run.room + ":" + (run.visitNumber ?? 0)), found = rewardChamber(keepsakes, run.room, visit, { world: worldOf(run.room), endless: !!run.dungeon, floor: run.dungeon?.floor ?? 0 });
      showCardFind(found.card);
    }
    if (JSON.stringify(keepsakes) !== keepsakeStamp) persistKeepsakes();
  }
  function fireCopy() {
    return settings.fireMode === "manual" ? "Hold " + (settings.inputProfile === "controller" ? "RT" : settings.inputProfile === "mobile" ? "FIRE" : keyLabel(settings.bindings.fire) + " or left click") + " to fire at your current attack speed." : settings.fireMode === "surge" ? "Auto-fire plus " + (settings.inputProfile === "controller" ? "RT" : settings.inputProfile === "mobile" ? "FIRE" : keyLabel(settings.bindings.fire) + " or left click") + " for a volley \xB7 4s cooldown." : "Your weapon fires automatically. Dash and power remain yours.";
  }
  function renderFireSettings() {
    for (const id of ["entry-fire-mode", "setting-fire-mode"]) {
      const el = $(id);
      if (!el) continue;
      el.value = settings.fireMode;
      for (const option of el.querySelectorAll?.("option") ?? []) if (option.value === "surge") option.disabled = !hasAlcove(keepsakes, "surge");
    }
    for (const id of ["entry-fire-copy", "settings-fire-copy"]) {
      const el = $(id);
      if (el) el.textContent = fireCopy();
    }
    const touchFire = $("touch-fire"), fireLabel = $("fire-label");
    if (touchFire) touchFire.hidden = settings.fireMode === "auto";
    if (fireLabel) fireLabel.textContent = settings.fireMode === "auto" ? "Auto-fire" : settings.fireMode === "manual" ? "Hold " + hint("fire") + " \xB7 fire" : "Surge \xB7 " + hint("fire") + " volley";
    for (const label of document.querySelectorAll("[data-profile-fire]")) label.textContent = "Fire mode \xB7 " + settings.fireMode[0].toUpperCase() + settings.fireMode.slice(1);
  }
  function setFireMode(mode) {
    if (!["auto", "manual", "surge"].includes(mode)) throw Error("Choose Auto, Manual, or Surge.");
    if (mode === "surge" && !hasAlcove(keepsakes, "surge")) throw Error("Break the Surge seal in the vault first.");
    settings.fireMode = mode;
    if (run && ["descent", "dungeon", "rematch"].includes(entryMode) && online.role !== "guest") run.fireMode = mode;
    clearInput();
    persistSettings();
    save();
    return mode;
  }
  function enterVault() {
    if (online.active) throw Error("Leave co-op before visiting the vault.");
    returnToStart();
    syncKeepsakes();
    entryMode = "vault";
    renderStart();
    renderVault();
  }
  function renderVault() {
    $("vault-coins").textContent = keepsakes.coins + " Substrate coins";
    $("vault-alcoves").innerHTML = '<div class="vault-glyph" aria-hidden="true">\u2727<small>THE SPARK REMEMBERS</small></div>' + VAULT_ALCOVES.map((a, i) => {
      const s = vaultStatus(keepsakes, a.id), angle = (-90 + i * 40) * Math.PI / 180;
      return `<button class="vault-alcove ${s.owned ? "owned" : s.locked ? "locked" : !s.affordable ? "unaffordable" : "sealed"}" data-action="vault-buy" data-alcove="${a.id}" style="--ax:${50 + Math.cos(angle) * 36}%;--ay:${50 + Math.sin(angle) * 38}%" ${s.owned || s.locked || !s.affordable ? "disabled" : ""}><span class="alcove-seal" aria-hidden="true">${s.owned ? "\u2727" : "\u25C7"}</span><strong>${a.name}</strong><span>${a.cost} coins \xB7 ${s.owned ? "Owned" : s.locked ? "Locked \xB7 meet in " + FIGHTER_MEETINGS[a.requires].name : !s.affordable ? "Not enough coins \xB7 need " + (a.cost - keepsakes.coins) + " more" : a.requires ? "Fighter ready \xB7 reveal memory" : "break seal"}</span><small>${a.desc}${a.requires && !s.locked ? " This purchase opens the memory alcove." : ""}</small></button>`;
    }).join("");
  }
  function renderBinder() {
    $("binder-note").textContent = keepsakes.cards.length + " / 12 cards \xB7 " + keepsakes.coins + " coins. One found memory per visit; duplicates become two coins. Cards never grant campaign keys.";
    $("binder-content").innerHTML = Object.entries(SPARK_CARDS).map(([id, c2]) => {
      const owned = keepsakes.cards.includes(id);
      return `<article class="spark-card ${owned ? "owned" : "sealed"}"><span class="eyebrow">${owned ? c2.mode.toUpperCase() : "SEALED MEMORY \xB7 ?"}</span><h3>${owned ? c2.name : "?"}</h3><p>${owned ? c2.memory : c2.clue}</p>${owned ? '<p class="card-rule">' + c2.rule + "</p>" : ""}${owned && c2.mode !== "journal" ? `<button class="secondary-button" data-action="card-select" data-card="${id}">${selectedSparkCard === id ? "Selected" : c2.mode === "table" && entryMode === "table" ? "Play at the Table" : "Select for " + (c2.mode === "swarm" ? "next Swarm pact" : c2.mode === "duel" ? "next duel" : "the Table")}</button>` : ""}</article>`;
    }).join("");
  }
  function selectCard(id) {
    if (!keepsakes.cards.includes(id)) throw Error("Find this card first.");
    if (entryMode === "table" && SPARK_CARDS[id].mode === "table") {
      playTableCard(tableSession, id, keepsakes);
      saveTable();
      renderTable();
    }
    selectedSparkCard = id;
    if (SPARK_CARDS[id].mode === "duel") {
      duel.config.condition = SPARK_CARDS[id].condition;
      if (entryMode === "duel" && !duel.match) duel.renderSelect();
    }
    renderBinder();
    announce(SPARK_CARDS[id].name + " selected. " + SPARK_CARDS[id].rule);
  }
  function saveTable() {
    if (tableSession) try {
      saveTableSession(localStorage, tableSession);
    } catch {
      announce("The Table session could not be saved on this device.");
    }
  }
  function enterTable() {
    if (!INPUT_PROFILES.includes(settings.inputProfile)) throw Error("Choose an input profile first.");
    if (online.active) throw Error("Leave co-op before taking a seat.");
    returnToStart();
    syncKeepsakes();
    entryMode = "table";
    tableChoice = null;
    renderStart();
    renderTable();
  }
  function tableAction(action, data = {}) {
    if (entryMode !== "table") throw Error("Enter the Table first.");
    if (action === "table-start") {
      const forms = keepsakes.inhabited;
      if (forms.length < 2) throw Error("Inhabit two different vessels before seating them here.");
      tableSession = createTableSession({ form: forms.includes(run?.form) ? run.form : forms[0], seats: forms.slice(-2), boons: availableTableBoons(keepsakes) });
      tableChoice = null;
    } else if (action === "table-response") {
      rollTableScene(tableSession, Number(data.index));
      tableChoice = null;
      const h = tableSession.history.at(-1);
      keepsakes.journal.push({ id: tableSession.id + ":" + h.scene, title: h.title, text: h.text });
      keepsakes.journal = keepsakes.journal.slice(-150);
      persistKeepsakes();
      audio.effect(tableSession.result.fall ? "damage" : "chime");
    } else if (action === "table-next") {
      advanceTableScene(tableSession);
      tableChoice = null;
    } else if (action === "table-card") {
      playTableCard(tableSession, data.card, keepsakes);
      announce(SPARK_CARDS[data.card].name + " played.");
    } else if (action === "table-guest") {
      inviteTableGuest(tableSession, data.guest, keepsakes);
    } else if (action === "table-new") {
      if (tableSession?.phase !== "ended") throw Error("Finish or leave this saved session first.");
      tableSession = null;
    } else throw Error("Unknown Table action.");
    if (tableSession?.phase === "ended") finishTable();
    saveTable();
    renderTable();
  }
  function finishTable() {
    if (!tableSession || tableSession.phase !== "ended" || tableSession.rewarded) return;
    const complete = tableSession.scene >= 6, card = findSparkCard(keepsakes, complete ? "the-uncreated" : "nacres-error", tableSession.id + ":end");
    showCardFind(card);
    const amount = Math.min(4, 1 + Math.floor(tableSession.memories / 2));
    awardCoins(keepsakes, amount, tableSession.id);
    tableSession.rewarded = true;
    persistKeepsakes();
    saveTable();
  }
  function tableClock() {
    const left = Math.max(0, Math.ceil(1200 - (tableSession?.elapsed ?? 0)));
    return Math.floor(left / 60) + ":" + pad(left % 60);
  }
  function renderTable() {
    const s = tableSession, forms = keepsakes.inhabited, stats = tableStats(s?.form ?? "spark", s?.boons ?? []), seats = s?.seats ?? forms.slice(-2), portrait2 = (form) => {
      const i = { spark: 0, human: 1, animal: 2, tree: 3, rock: 4, computer: 5 }[form];
      return `<span class="fighter-portrait" style="--fighter-x:${i % 3 * 50}%;--fighter-y:${Math.floor(i / 3) * 50}%"></span>`;
    };
    const header = `<header class="duel-header"><div><span class="eyebrow">ONE FIRELIT TABLE \xB7 SIX REMEMBERED SCENES</span><h1>The Table</h1></div><div><button data-action="binder">Spark cards \xB7 ${keepsakes.cards.length}</button><button data-action="journal">Journal</button><button data-action="home">Leave the table</button></div></header>`;
    const stage = `<div class="table-scene" aria-label="A firelit table with three seats"><div class="table-fire" aria-hidden="true"><i></i><i></i><i></i></div><div class="table-top" aria-hidden="true"><span>\u2727</span></div><div class="table-seat player-seat">${portrait2(s?.form ?? "spark")}<b>You \xB7 ${FORMS[s?.form ?? "spark"].name}</b></div>${[0, 1].map((i) => `<div class="table-seat seat-${i}">${seats[i] ? portrait2(seats[i]) : '<span class="empty-seat">\u25C7</span>'}<b>${seats[i] ? FORMS[seats[i]].name : "A remembered vessel"}</b></div>`).join("")}${s?.guest ? '<div class="table-guest"><span>\u25C7</span><b>' + ENEMY_LORE[s.guest].name + "</b><p>" + escapeText(ENEMY_LORE[s.guest].desc) + "</p></div>" : ""}</div>`;
    let content = "";
    if (!s) content = `<div class="table-card"><span class="eyebrow">THREE SEATS \xB7 TWO SIX-SIDED SPARKS</span><h2>A small gathering of remembered bodies.</h2><p>Six scenes, or twenty minutes at the table. Each scene remembers a door, a choice, a guardian, or an alcove seal. Roll two sparks: each six is a memory; two ones are a fall. Play one found Table card per session. Only journal memories, cards, and coins leave this table.</p><p>${forms.length < 2 ? "Inhabit two different vessels in Descent or Duel to fill the remembered seats. The binder is already shared here." : "Your remembered vessels are ready. Pulse, Root, and Fault change with your body."}</p><button class="primary-button" data-action="table-start" ${forms.length < 2 ? "disabled" : ""}>Take a seat</button></div>`;
    else if (s.phase === "ended") content = `<div class="table-card"><span class="eyebrow">THE SESSION IS REMEMBERED</span><h2>The body falls. The spark remembers.</h2><p>${s.scene} / 6 scenes \xB7 ${s.memories} ${s.memories === 1 ? "memory" : "memories"} \xB7 ${s.falls} ${s.falls === 1 ? "fall" : "falls"}. Your entries are in the journal; your found card is in the shared binder. Campaign rooms, karma, keys, and seals stay with your journey.</p><div class="menu-actions"><button class="primary-button" data-action="table-new">Another gathering</button><button class="secondary-button" data-action="binder">Open the binder</button><button class="secondary-button" data-action="home">Leave the table</button></div></div>`;
    else {
      const sc = TABLE_SCENES[s.scene], result = s.phase === "result";
      content = `<div class="table-card"><div class="table-status"><span class="eyebrow">SCENE ${s.scene + 1} / 6 \xB7 ${ROOMS[sc.room].name}</span><span data-table-clock>${tableClock()}</span></div><div class="table-stats">${Object.entries(stats).map(([id, value]) => "<span>" + id.toUpperCase() + " <b>" + value + "</b></span>").join("")}</div><h2>${sc.title}</h2><p>${escapeText(sc.prompt)}</p>${result ? `<div class="spark-dice" aria-label="Rolled ${s.dice.join(" and ")}">${s.dice.map((d) => '<div class="spark-die ' + (d === 6 ? "memory" : "") + '"><span>' + Array.from({ length: d }, () => "<i>\u2727</i>").join("") + "</span><b>" + d + (d === 6 ? " \xB7 MEMORY" : "") + "</b></div>").join("")}</div><p class="table-outcome">${s.result.fall ? "Two ones \xB7 a fall." : s.result.held ? "The memory holds." : "The pattern holds for now."} ${s.result.stat.toUpperCase()} \xB7 ${s.result.total} total${s.result.bonus ? " \xB7 card +" + s.result.bonus : ""}. ${s.result.memory ? s.result.memory + " memory remembered." : ""}</p><button class="primary-button" data-action="table-next">${s.scene === 5 ? "Remember this gathering" : "Next scene"} \xB7 ${settings.inputProfile === "controller" ? "A" : "Enter"}</button>` : `<p class="story-controls">${settings.inputProfile === "pc" ? "1\u20133 highlights \xB7 Enter rolls" : settings.inputProfile === "controller" ? "D-pad highlights \xB7 A rolls" : "Tap a response to roll"} \xB7 Two sparks + chosen stat. A total of 9 holds the memory; a six remembers it even below 9.</p><div class="table-responses">${sc.responses.map((r, i) => `<button data-action="table-response" data-index="${i}" class="${tableChoice === i ? "selected" : ""}" aria-pressed="${tableChoice === i}"><span>${i + 1} \xB7 ${r.stat.toUpperCase()}</span><strong>${r.name}</strong><small>${r.text}</small></button>`).join("")}</div><div class="table-cards"><span class="eyebrow">${s.playedCard ? "CARD PLAYED \xB7 " + SPARK_CARDS[s.playedCard].name : "PLAY ONE TABLE CARD THIS SESSION"}</span>${s.playedCard ? "<p>" + SPARK_CARDS[s.playedCard].rule + "</p>" : keepsakes.cards.filter((id) => SPARK_CARDS[id].mode === "table").map((id) => `<button data-action="table-card" data-card="${id}"><b>${SPARK_CARDS[id].name}</b><span>${SPARK_CARDS[id].rule}</span></button>`).join("") || "<p>Your found Table cards will appear here. The binder keeps all twelve memories.</p>"}</div>${s.scene >= 2 ? '<div class="table-invites"><span class="eyebrow">INVITE A MET ENEMY</span>' + keepsakes.met.map((id) => '<button data-action="table-guest" data-guest="' + id + '">' + ENEMY_LORE[id].name + "</button>").join("") + "</div>" : ""}`}</div>`;
    }
    $("table-root").innerHTML = header + stage + content + '<p class="table-foot">The body falls. The spark remembers. \xB7 Session saved on this device.</p>';
  }
  var onlineWaiting = false;
  var remotePaused = false;
  var networkProblem = "";
  var remoteInput = { x: 0, y: 0 };
  var remoteInputSeq = 0;
  var remotePulse = { dash: false, power: false, morph: null };
  var onlineStarting = false;
  var onlineIntent = "host";
  var onlineOffers = null;
  var inputFocused = true;
  var onlineRecovery = null;
  var roomPresence = null;
  var remoteInputAge = 0;
  var remoteInputAt = 0;
  var snapshotSeq = -1;
  var snapshotAt = 0;
  var canvasFocusPending = false;
  var ownMovement = { x: 0, y: 0 };
  var playback = new PartnerInputPlayback();
  var peerMovedAt = 0;
  var selfMovedAt = 0;
  var peerPosition = null;
  var guestAccumulator = 0;
  var rescueWaiting = false;
  var online = new OnlineRoom((data) => {
    if (online.role === "guest" && Number.isSafeInteger(data.seq) && data.seq < snapshotSeq) return;
    if (data.partial) data = { ...roomPresence, ...data, run };
    if (online.active) activateCoopSave();
    const choiceRun = online.role === "guest" ? data.run : run, knownVote = currentCoopVote(choiceRun, roomPresence?.crew);
    if (knownVote && (data.crew?.voteRevision ?? 0) < (roomPresence?.crew?.voteRevision ?? 0)) data.crew = { ...data.crew, vote: knownVote, voteRevision: roomPresence.crew.voteRevision };
    const observed = online.role === "guest" ? data.run?.player : data.run?.partner;
    if (observed) {
      if (peerPosition?.room === data.run.room && Math.hypot(observed.x - peerPosition.x, observed.y - peerPosition.y) > 0.25) peerMovedAt = Date.now();
      peerPosition = { x: observed.x, y: observed.y, room: data.run.room };
    }
    const peer = online.role === "guest" ? data.run?.player : data.run?.partner, priorPeer = online.role === "guest" ? run?.player : run?.partner;
    networkProblem = "";
    remotePaused = data.paused;
    if (online.role === "guest") rescueWaiting = !!data.rescueWaiting;
    roomPresence = { ...data, run: void 0, input: data.input ?? {}, at: Date.now(), moving: !!peer && !!priorPeer && Math.hypot(peer.x - priorPeer.x, peer.y - priorPeer.y) > 0.25 };
    if (data.seq !== snapshotSeq) {
      snapshotSeq = data.seq;
      snapshotAt = Date.now();
    }
    if (online.role === "guest") {
      const priorPhase = run?.phase, priorRoom = run?.room, priorForm = run?.partnerForm, priorHostForm = run?.form, first = !run;
      run = data.run;
      online.acknowledge(data.controlAck);
      if (priorPhase !== run.phase || priorRoom !== run.room) online.clearInput();
      menu = false;
      if (first) paused = false;
      onlineWaiting = data.waiting || !data.hostOnline;
      if (priorPhase !== run.phase || priorRoom !== run.room || priorForm !== run.partnerForm || priorHostForm !== run.form) {
        finish();
        save();
        renderOverlay(true);
        renderRail();
      }
    } else {
      if (!run && data.run) {
        activateCoopSave();
        run = data.run;
        playback.restore(data.controlAck);
        menu = false;
        paused = true;
      }
      if (run?.partner && !data.guestForm) {
        run.partner = null;
        delete run.partnerForm;
        delete run.partnerBirthForm;
        run.partnerMasteryEarned = {};
        if (run.stats) delete run.stats.partner;
        if (run.roomPractice) run.roomPractice.partner = {};
      }
      if (data.guestOnline && data.guestForm && (!run.partner || (run.partnerBirthForm ?? run.partnerForm) !== data.guestForm)) {
        addPartner(run, data.guestForm, !!run.partner);
        onlineWaiting = false;
        paused = false;
        announce("Your partner joins the current.");
      }
      if (data.inputSeq >= remoteInputSeq) {
        if (data.input?.stream) playback.receive(data.input, movementContext(run), run?.phase === "playing" && !paused);
        remoteInput = data.input ?? { x: 0, y: 0 };
        remoteInputAge = data.inputAgeMs ?? 0;
        remoteInputAt = Date.now();
        if (data.inputSeq > remoteInputSeq) {
          remoteInputSeq = data.inputSeq;
          remotePulse.dash = remotePulse.dash || !!remoteInput.dash;
          remotePulse.power = remotePulse.power || !!remoteInput.power;
          remotePulse.morph = remoteInput.morph ?? null;
        }
        if (remoteInput.active === false) {
          remoteInput = { x: 0, y: 0, active: false, fallAck: remoteInput.fallAck ?? 0 };
          remotePulse = { dash: false, power: false, morph: null };
        }
      }
      if (!data.guestOnline) {
        remoteInput = { x: 0, y: 0 };
        remoteInputSeq = 0;
        remotePulse.dash = false;
        remotePulse.power = false;
        remotePulse.morph = null;
      }
      onlineWaiting = !data.guestOnline;
      remotePaused = false;
    }
    renderOnlineStatus();
    renderOverlay();
  }, (message) => {
    networkProblem = message;
    announce(message);
    renderOnlineStatus();
    renderOverlay();
  }, { name: playerName });
  online.setSource(() => ({ run, controlAck: playback.acknowledgement(), presence: { active: inputFocused && !document.hidden && !document.querySelector("dialog[open]"), moving: Date.now() - selfMovedAt < 900, channeling: !!reviveState(run, run?.player)?.progress, holding: heldInteract() }, voteReceipt: currentCoopVote(run, roomPresence?.crew), paused: paused || !!document.querySelector("dialog[open]"), rescueWaiting, waiting: onlineWaiting }));
  var vessel = () => online.role === "guest" && run?.partner ? { player: run.partner, form: run.partnerForm } : { player: run?.player, form: run?.form ?? "spark" };
  function partnerStatus() {
    if (!online.active) return "solo";
    if (networkProblem || Date.now() - online.lastSuccess > 6500) return "reconnecting";
    if (!roomPresence) return "waiting";
    const elapsed = Date.now() - roomPresence.at, age = (online.role === "guest" ? roomPresence.hostAgeMs ?? 0 : roomPresence.inputAgeMs ?? 0) + elapsed;
    if (!(online.role === "guest" ? roomPresence.hostOnline : roomPresence.guestOnline) || age > 6500) return "disconnected";
    if (age > 4e3 || online.role === "guest" && !remotePaused && !onlineWaiting && Date.now() - snapshotAt > 4e3) return "waiting for updates";
    if (run?.phase !== "playing") return ["dead", "won"].includes(run?.phase) ? "ended" : "choosing";
    if ((online.role === "guest" ? run?.player : run?.partner)?.hp <= 0) return "fallen";
    if (online.role === "guest" && remotePaused) return "paused";
    if (online.role === "guest" && roomPresence.presence?.active === false && Date.now() - peerMovedAt > 1e3) return "away";
    if (online.role === "host" && remoteInput.active === false && Date.now() - peerMovedAt > 1e3) return "away";
    const actor = online.role === "guest" ? run?.player : run?.partner;
    if (actor?.hp <= 0) return "fallen";
    if (reviveState(run, actor)?.progress) return "reviving";
    if (online.role === "guest" && roomPresence.presence?.channeling) return "reviving";
    if (reviveState(run, actor) && (online.role === "guest" ? roomPresence.presence?.holding : remoteInput.active !== false && remoteInput.interact)) return "holding to revive";
    return online.role === "guest" && roomPresence.presence?.moving ? "moving" : Date.now() - peerMovedAt < 1200 ? "moving" : "idle";
  }
  function renderOnlineStatus() {
    if (!online.active) {
      $("online-status").textContent = "Solo play";
      return;
    }
    const guest = online.role === "guest", self = vessel(), otherForm = guest ? run?.form : run?.partnerForm, status = partnerStatus(), selfStatus = ownConnectionStatus();
    $("online-status").textContent = "YOU \xB7 " + roomPlayerName(guest) + " \xB7 PLAYER " + (guest ? "2" : "1") + " \xB7 " + FORMS[self.form].name + " \xB7 " + selfStatus + " \xB7 " + ownActivity() + "  |  " + roomPlayerName(!guest) + " \xB7 PLAYER " + (guest ? "1" : "2") + (otherForm ? " \xB7 " + FORMS[otherForm].name : "") + " \xB7 " + status;
    $("online-status").dataset.connection = selfStatus;
    $("online-status").title = "Your last relay update " + Math.max(0, Date.now() - online.lastSuccess) + " ms ago \xB7 round trip " + online.latency + " ms. Both players must reach the same gate.";
  }
  function roomPlayerName(partner) {
    const role = partner ? "guest" : "host";
    return cleanPlayerName(roomPresence?.crew?.[role], role === online.role ? playerName || "Player " + (partner ? "2" : "1") : "Player " + (partner ? "2" : "1"));
  }
  function ownActivity() {
    if (vessel().player?.hp <= 0) return "fallen";
    if (run?.phase !== "playing") return ["dead", "won"].includes(run?.phase) ? "ended" : "choosing";
    if (paused || remotePaused) return "paused";
    if (!inputFocused || document.hidden || document.querySelector("dialog[open]")) return "away";
    const rescue = reviveState(run, vessel().player);
    if (rescue && (rescue.progress || heldInteract())) return rescue.progress ? "reviving" : "holding " + (touchDevice ? "GATE" : hint("interact")) + " \xB7 " + (rescue.inRange ? "awaiting relay" : "move closer");
    return (online.role === "guest" ? Math.hypot(ownMovement.x, ownMovement.y) > 0.05 : Date.now() - selfMovedAt < 900) ? "moving" : "idle";
  }
  function ownConnectionStatus() {
    if (networkProblem || online.errors || online.lastSuccess && Date.now() - online.lastSuccess > 6500) return "reconnecting";
    if (!online.lastSuccess) return "connecting";
    if (Date.now() - online.lastSuccess > 4e3) return "waiting for relay";
    return "connected";
  }
  function heldInteract() {
    return keys.has(settings.bindings.interact) || interactHeld || !!controller.interact || interactRequested;
  }
  function rescueNeedsRelay() {
    return online.role === "host" && run?.phase === "playing" && run.partner && [run.player, run.partner].some((a) => a.hp <= 0) && ((remoteInput.fallAck ?? 0) < (run.fallSerial ?? 0) || remoteInputAge + Date.now() - remoteInputAt > 1200);
  }
  function livePartnerInput() {
    const age = remoteInputAge + Date.now() - remoteInputAt, fresh = remoteInput.active !== false && age <= 1200;
    if (remoteInput.stream) {
      if (age > 2500) {
        playback.discard();
        return { x: 0, y: 0, interact: false };
      }
      const input = playback.next();
      return { ...input, interact: fresh && !!remoteInput.interact };
    }
    return !fresh ? { x: 0, y: 0, interact: false } : { ...remoteInput, dash: remotePulse.dash, power: remotePulse.power, morph: remotePulse.morph };
  }
  function observeCoop() {
    return online.active ? { code: online.code, role: online.role, name: roomPlayerName(online.role === "guest"), self: ownConnectionStatus(), partnerName: roomPlayerName(online.role !== "guest"), partner: partnerStatus(), hostPaused: remotePaused, relayAgeMs: Math.max(0, Date.now() - online.lastSuccess), latencyMs: online.latency, snapshotSeq, inputSeq: remoteInputSeq, snapshotAgeMs: Math.max(0, Date.now() - snapshotAt), inputAgeMs: Math.max(0, remoteInputAge + Date.now() - remoteInputAt), vote: currentCoopVote(run, roomPresence?.crew), rescueWaiting, rescueInput: { held: heldInteract(), accepted: !!reviveState(run, vessel().player)?.progress }, revive: run?.partner ? [run.player, run.partner].map((a, i) => ({ role: i ? "guest" : "host", fallen: a.hp <= 0, seconds: a.hp <= 0 ? Math.ceil(a.downedFor ?? 30) : 0, progress: Math.min(1, (a.revive ?? 0) / 1.8) })) : null } : null;
  }
  function focusCanvas() {
    if (entryMode === "sideways") {
      side.focus();
      return;
    }
    if (["descent", "dungeon", "rematch"].includes(entryMode) && run?.phase === "playing" && !menu && !paused && !document.querySelector("dialog[open]")) {
      canvas.focus({ preventScroll: true });
      inputFocused = document.hasFocus?.() !== false;
    }
  }
  function restoreCanvasFocus() {
    focusCanvas();
    canvasFocusPending = true;
    requestAnimationFrame(() => {
      if (canvasFocusPending) {
        canvasFocusPending = false;
        focusCanvas();
      }
    });
  }
  function gatePromptText(gate) {
    const entry = gateEntryStatus(run, gate.direction, vessel().player), reason = gate.available && !entry.available ? entry.reason : "";
    return gate.direction.toUpperCase() + " \xB7 " + (gate.available ? hint("interact") + " \xB7 " + ROOMS[gate.to].name + (reason ? " \xB7 " + reason : "") : ROOMS[gate.to].name + " \xB7 " + adaptPrompt(gate.reason, settings.inputProfile, settings.bindings));
  }
  function renderOnlineSetup(resetBody = false) {
    if (resetBody || !onlineOffers) onlineOffers = offeredForms(meta);
    const offers = onlineOffers, form = $("online-form"), unfinished = !betweenLives(), blocked = online.active || unfinished || onlineStarting;
    if (online.active) {
      form.innerHTML = Object.keys(BODIES).map((id) => `<option value="${id}">${FORMS[id].name} \xB7 current vessel</option>`).join("");
      form.value = vessel().form;
    } else if (resetBody) {
      form.innerHTML = Object.keys(BODIES).map((id) => `<option value="${id}">${FORMS[id].name}${offers.includes(id) ? " \xB7 host offer" : ""}</option>`).join("");
      form.value = onlineIntent === "join" || offers.includes("spark") ? "spark" : offers[0];
    }
    if (resetBody) $("online-name").value = playerName;
    const canHost = offers.includes(form.value), offerNames = offers.map((id) => FORMS[id].name).join(", ");
    $("online-readiness").textContent = online.active ? "Room " + online.code + " is open. Leave it before creating or joining another room." : unfinished ? "You have a life in progress in " + ROOMS[run.room].name + ". Finish it, or use Pause \u2192 Let this body go, before creating or joining a room. Your progress remains saved." : onlineStarting ? "Connecting to the room\u2026" : !canHost ? "This body can join a room. To create one, choose a current host offer: " + offerNames + "." : "Ready for a fresh shared life. Create a room, or enter your friend\u2019s code.";
    $("online-body-note").textContent = online.active ? roomPlayerName(false) + " \xB7 PLAYER 1 \xB7 " + FORMS[run?.form ?? "spark"].name + " \xB7 " + roomPlayerName(true) + " \xB7 PLAYER 2 \xB7 " + (run?.partnerForm ? FORMS[run.partnerForm].name : "waiting") + ". Vessel changes use " + hint("morph") + " after resonance is remembered." : "Current host offers: " + offerNames + ". Joining players may choose any of the six bodies." + (onlineIntent === "host" && !offers.includes("spark") ? " Spark is outside this life\u2019s host offers; " + FORMS[form.value].name + " is selected." : "");
    $("online-host").disabled = blocked || !canHost;
    $("online-join").disabled = blocked;
    form.disabled = blocked;
    $("online-code").disabled = blocked;
    for (const id of ["online-fall-host", "online-fall-guest"]) $(id).disabled = !!(online.role !== "host" || onlineStarting || run?.phase !== "playing" || !run?.partner || [run?.player, run?.partner].some((a) => !a || a.hp <= 0) || !ROOMS[run.room].safe && !run.cleared.includes(run.room) || run.enemies.some((e2) => e2.hp > 0) || run.shots.some((s) => s.enemy && s.life > 0) || run.marks.length);
    $("online-leave").hidden = !online.active;
    $("online-leave").disabled = onlineStarting;
    $("online-return").hidden = online.active || !unfinished;
  }
  function rememberPlayerName() {
    playerName = cleanPlayerName($("online-name").value);
    $("online-name").value = playerName;
    try {
      localStorage.setItem("spark-substrate-player-name-v1", playerName);
    } catch {
    }
    online.displayName = playerName;
  }
  async function usePlayerName() {
    rememberPlayerName();
    if (online.active) await online.rename(playerName);
    renderOnlineStatus();
    renderOnlineSetup();
  }
  async function sendCoopVote(index) {
    try {
      await online.vote(coopChoiceContext(run), Number(index));
      renderOverlay(true);
    } catch (error) {
      announce(error.message);
      const note = $("game-overlay").querySelector("[data-coop-choice-note]");
      if (note) note.textContent = error.message;
    }
  }
  async function onlineAction(action) {
    if (action !== "online-leave") requireDescent();
    if (action === "online") {
      openDialog("online-dialog");
      return;
    }
    if (action === "online-fall-host" || action === "online-fall-guest") {
      try {
        if (online.role !== "host" || onlineWaiting) throw Error("The host starts controlled falls when both players are present.");
        controlledFall(run, action === "online-fall-guest");
        paused = false;
        rescueWaiting = true;
        $("online-dialog").dataset.skipPauseRestore = "true";
        $("online-dialog").close();
        clearInput();
        changed();
        restoreCanvasFocus();
        void online.sync();
      } catch (error) {
        $("online-error").textContent = error.message;
      }
      return;
    }
    if (action === "online-name") {
      try {
        await usePlayerName();
        $("online-error").textContent = "Name remembered for this device.";
      } catch (error) {
        $("online-error").textContent = error.message;
      }
      return;
    }
    if (action === "online-return") {
      if (online.active || betweenLives()) return;
      const dialog = $("online-dialog");
      dialog.dataset.skipPauseRestore = "true";
      dialog.close();
      act("resume");
      return;
    }
    if (action === "online-leave") {
      if (!online.active) return;
      const wasHost = online.role === "host";
      if (wasHost && run && !["dead", "won"].includes(run.phase)) {
        run.phase = "dead";
        run.player.hp = 0;
        finish();
      }
      await online.leave();
      run = null;
      menu = true;
      paused = false;
      onlineWaiting = false;
      rescueWaiting = false;
      networkProblem = "";
      remoteInput = { x: 0, y: 0 };
      playback.discard();
      $("online-room-code").textContent = "";
      $("online-status").textContent = "Solo play";
      $("online-dialog").dataset.skipPauseRestore = "true";
      $("online-dialog").close();
      entryMode = "start";
      clearInput();
      save();
      renderStart();
      renderRail();
      renderOverlay(true);
      announce("Room left. Choose Host room or Join room to play together again.");
      return;
    }
    if (onlineStarting) return;
    onlineStarting = true;
    $("online-error").textContent = "";
    renderOnlineSetup();
    try {
      if (online.active) throw Error("Leave your current room before opening another.");
      if (run && !["dead", "won"].includes(run.phase)) throw Error("Finish this life before starting an online room.");
      const form = $("online-form").value;
      rememberPlayerName();
      if (action === "online-host") {
        if (!offeredForms(meta).includes(form)) throw Error("Select one of your three currently offered forms to host.");
        const next = createRun(meta, form);
        next.fireMode = settings.fireMode;
        next.swarmPact = swarmPact;
        await online.host(next);
        run = next;
        onlineWaiting = true;
      } else {
        const code = $("online-code").value.toUpperCase().replace(/[^A-Z2-9]/g, "");
        if (code.length !== 8) throw Error("Enter the eight-character room code.");
        await online.join(code, form);
        run = null;
        onlineWaiting = true;
      }
      menu = false;
      paused = false;
      networkProblem = "";
      activateCoopSave();
      remoteInputSeq = 0;
      peerPosition = null;
      remoteInput = { x: 0, y: 0 };
      roomPresence = null;
      snapshotSeq = -1;
      $("online-room-code").textContent = online.code;
      $("online-error").textContent = "";
      $("online-dialog").dataset.skipPauseRestore = "true";
      $("online-dialog").close();
      clearInput();
      renderOverlay(true);
      renderRail();
      focusCanvas();
      await online.sync();
    } catch (error) {
      if ($("online-dialog").open) $("online-error").textContent = error.message;
      else announce(error.message);
    } finally {
      onlineStarting = false;
      renderOnlineSetup();
    }
  }
  function journalHtml() {
    const entries = [...run?.journal ?? meta.journal ?? [], ...keepsakes.journal.map((e2) => ({ ...e2, speaker: "A remembered keepsake" }))];
    const enemies = [.../* @__PURE__ */ new Set([...meta.seenEnemies ?? [], ...run?.seenEnemies ?? []])];
    return '<div class="journal-entries">' + (entries.length ? entries.map((entry) => `<article><span class="eyebrow">${escapeText(entry.speaker)}</span><h3>${escapeText(entry.title)}</h3><p>${escapeText(entry.text)}${ROOMS[entry.room]?.key && (run?.keys ?? meta.keys ?? []).includes(ROOMS[entry.room].key) ? " <b>Key collected \xB7 carried on your keyring.</b>" : ""}</p></article>`).join("") : "<p>Inhabit a body to begin remembering the story.</p>") + '</div><h3>Constructs encountered</h3><div class="bestiary">' + (enemies.length ? enemies.filter((id) => ENEMY_LORE[id]).map((id) => `<article><h4>${ENEMY_LORE[id].name}</h4><p>${ENEMY_LORE[id].desc}</p></article>`).join("") : "<p>There are no encounters in this memory yet.</p>") + "</div>";
  }
  function announce(text) {
    $("announcer").textContent = text;
  }
  var progress = null;
  function profileList() {
    try {
      return JSON.parse(localStorage.getItem(PROFILE_INDEX) ?? "[]").filter((p) => personalKey(p.key) && typeof p.label === "string").slice(-30);
    } catch {
      return [];
    }
  }
  function renderSaveProfiles() {
    const el = $("spark-save-profile");
    el.innerHTML = '<option value="solo">Original solo spark</option>' + profileList().map((p) => `<option value="${p.key}">${escapeText(p.label)}</option>`).join("");
    el.value = KEY === CAMPAIGN_KEY ? "solo" : KEY;
    el.disabled = online.active || onlineStarting;
  }
  function activateCoopSave() {
    if (!online.active) return;
    const key = CAMPAIGN_KEY + ":coop:" + online.code + ":" + online.role;
    if (KEY === key) return;
    progress?.dispose();
    progress = null;
    loadEpoch++;
    KEY = key;
    CREDENTIAL_KEY = key + ":credential";
    PREVIOUS_KEY = key + ":previous";
    try {
      sessionStorage.setItem(ACTIVE_PROFILE, key);
      const profiles = profileList();
      if (!profiles.some((p) => p.key === key)) profiles.push({ key, label: (playerName || "Player " + (online.role === "host" ? 1 : 2)) + " \xB7 " + online.code + " \xB7 " + online.role });
      localStorage.setItem(PROFILE_INDEX, JSON.stringify(profiles.slice(-30)));
      const personal = JSON.parse(localStorage.getItem(key) ?? "null");
      if (validMeta(personal?.meta)) meta = prepareEquipment(personal.meta);
    } catch {
    }
    connectProgress(true);
  }
  function switchSaveProfile(value) {
    if (online.active || onlineStarting) throw Error("Leave the room before changing save profiles.");
    const key = value === "solo" ? CAMPAIGN_KEY : value;
    if (key !== CAMPAIGN_KEY && !profileList().some((p) => p.key === key)) throw Error("Choose a remembered spark.");
    save();
    progress?.dispose();
    progress = null;
    loadEpoch++;
    KEY = key;
    CREDENTIAL_KEY = key === CAMPAIGN_KEY ? "spark-substrate-save-credential" : key + ":credential";
    PREVIOUS_KEY = key === CAMPAIGN_KEY ? "spark-substrate-previous-spark" : key + ":previous";
    sessionStorage.setItem(ACTIVE_PROFILE, key);
    const stored = JSON.parse(localStorage.getItem(key) ?? "null");
    meta = validMeta(stored?.meta) ? prepareEquipment(stored.meta) : createMeta();
    run = validRun(stored?.run) ? stored.run : null;
    menu = !run;
    paused = run?.phase === "playing";
    campaignEntered = false;
    entryMode = "start";
    clearInput();
    renderStart();
    announce("Spark save changed. Each profile keeps its own progress.");
  }
  function savedState() {
    return { version: 2, meta, run: online.active ? null : ["dungeon", "rematch"].includes(entryMode) ? campaignCache?.run ?? null : run };
  }
  function save() {
    if (entryMode === "rematch") {
      renderSaveStatus();
      return;
    }
    if (entryMode === "dungeon") {
      dungeonState.run = run;
      try {
        dungeonState.record = saveDungeon(localStorage, run, dungeonState.record);
        saveAvailable = true;
      } catch {
        saveAvailable = false;
      }
      renderSaveStatus();
      return;
    }
    if (!campaignEntered || entryMode !== "descent") return;
    const state = savedState();
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      saveAvailable = true;
    } catch {
      saveAvailable = false;
    }
    progress?.queue(state);
    renderSaveStatus();
  }
  function renderSaveStatus() {
    const status = progress?.status ?? "device", el = $("save-status");
    if (entryMode === "rematch") {
      el.textContent = "Guardian echo \xB7 campaign kept";
      el.title = "Practice grants no campaign rewards.";
      return;
    }
    if (entryMode === "dungeon") {
      el.textContent = saveAvailable ? "Dungeon saved on this device" : "Dungeon save unavailable \xB7 keep this page open";
      el.title = "Your campaign save stays separate.";
      return;
    }
    el.textContent = status === "conflict" ? "Another tab saved this spark. Close extra tabs and reload to continue." : !saveAvailable ? status === "saved" ? "Progress saved online \xB7 device storage unavailable" : "Device save unavailable \xB7 keep this page open" : status === "error" ? "Server save pending \xB7 device copy kept" : "Progress saved on this device";
    el.title = status === "saved" ? "Also backed up online." : status === "pending" ? "Online backup queued." : status === "connecting" ? "Connecting to your online backup." : status === "error" ? "Online backup will retry." : status === "conflict" ? "The newest online save is protected from competing tabs." : "Your recovery copy is stored in this browser.";
  }
  function clearInput() {
    guestAccumulator = 0;
    keys.clear();
    ownMovement = { x: 0, y: 0 };
    stick = { x: 0, y: 0 };
    pointer = null;
    dashRequested = false;
    powerRequested = false;
    interactRequested = false;
    interactHeld = false;
    fireHeld = false;
    controller = { ...controller, x: 0, y: 0, dash: false, power: false, interact: false, fire: false };
    if (online.role === "guest") online.clearInput();
    $("joystick-thumb").style.transform = "translate(0,0)";
  }
  function spriteStyle(form) {
    const index = BODIES[form].sprite;
    return `--sprite-x:${index % 4 * 100 / 3}%;--sprite-y:${Math.floor(index / 4) * 100}%;--form-color:${BODIES[form].color}`;
  }
  function mapHtml(large = false) {
    const world = large ? mapWorld : worldOf(run?.room ?? "threshold"), rooms = Object.entries(ROOMS).filter(([, room2]) => room2.world === world), minY = Math.min(...rooms.map(([, r]) => r.coord[1])), ring = run?.keys ?? meta.keys ?? [], relics = run?.relics ?? meta.relics ?? [], secrets = run?.secrets ?? meta.secrets ?? [], abilities = run?.abilities ?? meta.abilities, seals = run?.seals ?? meta.seals ?? [], currentForms = [run?.player.hp > 0 ? run.form : null, run?.partner?.hp > 0 ? run.partnerForm : null];
    return rooms.map(([id, room2], index) => {
      const known = large && !run || (!run ? ["threshold", ...meta.explored ?? []].includes(id) : run.discovered.includes(id)), hinted = !!(room2.relic || room2.secret) && worldUnlocked(world, seals), visible = known || hinted, here = run?.room === id || !run && id === "threshold", clear = run?.cleared.includes(id), label = large ? visible ? pad(index + 1) + " \xB7 " + room2.short + (known ? "" : " \xB7 clue") : "Unexplored" : known ? room2.short.split(" ")[0] : hinted ? "?" : "";
      const links = visible ? Object.entries(room2.exits).filter(([, exit]) => ROOMS[exit.to].world === world).map(([direction2, exit]) => {
        const sealed = exit.relics?.some((id2) => !relics.includes(id2)) || exit.ward && !run?.cleared.includes(exit.ward) && !seals.includes(world) || exit.keys?.some((key) => !ring.includes(key)) || exit.seals?.some((seal) => !seals.includes(seal)) || exit.requires && !abilities.includes(exit.requires) || run && exit.vessel && !currentForms.includes(exit.vessel), opened = (run?.openDoors ?? []).includes(doorId(id, exit.to));
        return `<i class="map-link ${direction2} ${sealed ? "locked" : ""} ${opened ? "opened" : ""}" aria-hidden="true"></i>`;
      }).join("") : "";
      return `<button class="map-room ${known ? "" : "unknown"} ${hinted && !known ? "hinted" : ""} ${here ? "here" : ""} ${clear ? "clear" : ""}" style="grid-column:${room2.coord[0] + 1};grid-row:${room2.coord[1] - minY + 1}" data-action="map-room" data-room="${id}" title="${large || visible ? escapeText(room2.name + (hinted ? " \xB7 " + roomDescription(id) : "")) : "Undiscovered chamber"}" aria-label="${visible ? room2.name : "Undiscovered chamber"}${hinted && !known ? ", discovery clue" : ""}${here ? ", your location" : ""}${clear ? ", cleared" : ""}${known && room2.key ? ", " + KEYS[room2.key].name + (ring.includes(room2.key) ? " collected" : " waiting after clear") : ""}">${links}<span>${label}</span>${clear ? '<i class="clear-stamp" aria-hidden="true">\u2713</i>' : ""}${known && room2.key ? '<span class="map-key ' + (ring.includes(room2.key) ? "collected" : "waiting") + '" title="' + KEYS[room2.key].name + (ring.includes(room2.key) ? " \xB7 collected" : " \xB7 waiting after clear") + '">' + KEY_ICON + "</span>" : ""}${visible && room2.relic ? '<span class="map-relic ' + (relics.includes(room2.relic) ? "collected" : "waiting") + '" title="' + ROUTE_RELICS[room2.relic].name + " \xB7 " + ROUTE_RELICS[room2.relic].opens + '">' + RELIC_ICON + "</span>" : ""}${visible && room2.secret ? '<span class="map-secret ' + (secrets.includes(room2.secret) ? "collected" : "waiting") + '" title="' + escapeText(EASTER_EGGS[room2.secret].hint) + '">?</span>' : ""}</button>`;
    }).join("");
  }
  function mapColumns(world) {
    return Math.max(...Object.values(ROOMS).filter((room2) => room2.world === world).map((room2) => room2.coord[0])) + 1;
  }
  function renderWorldMap() {
    const seals = run?.seals ?? meta.seals ?? [], world = WORLDS[mapWorld];
    $("world-tabs").innerHTML = WORLD_ORDER.map((id) => `<button data-action="map-world" data-world="${id}" class="${id === mapWorld ? "selected" : ""}"><b>${WORLDS[id].rank + 1}</b> ${WORLDS[id].name}<small>${worldUnlocked(id, seals) ? seals.includes(id) ? "Guardian seal found" : "Open world" : "Seal required"}</small></button>`).join("");
    $("map-world-title").textContent = world.name;
    $("large-map").style.gridTemplateColumns = `repeat(${mapColumns(mapWorld)},minmax(90px,1fr))`;
    $("large-map").style.minWidth = mapColumns(mapWorld) * 95 + "px";
    const ys = Object.values(ROOMS).filter((room2) => room2.world === mapWorld).map((room2) => room2.coord[1]);
    $("large-map").style.gridTemplateRows = `repeat(${Math.max(...ys) - Math.min(...ys) + 1},64px)`;
    $("large-map").innerHTML = mapHtml(true);
    $("map-description").textContent = world.desc + " 18 chambers \xB7 " + Object.entries(ROOMS).filter(([id, r]) => r.world === mapWorld && (run?.discovered ?? meta.explored ?? []).includes(id)).length + " visited. " + (worldUnlocked(mapWorld, seals) ? "Travel from a safe checkpoint or a defeated guardian." : "Defeat the preceding guardians to open this world.");
    $("world-travel").disabled = online.role === "guest" || !checkpointAvailable(run) || !worldUnlocked(mapWorld, seals);
    $("world-travel").dataset.world = mapWorld;
    $("world-travel").textContent = "Travel to " + world.name;
  }
  function connectProgress(preferDevice = false) {
    const epoch2 = loadEpoch, instance = new ProgressSave({ fetch: window.fetch?.bind(window), storage: localStorage, credentialKey: CREDENTIAL_KEY, onStatus: renderSaveStatus });
    progress = instance;
    void instance.open(savedState()).then((saved) => {
      if (instance !== progress || epoch2 !== loadEpoch) return;
      if (saved) {
        if (["dungeon", "rematch"].includes(entryMode)) {
          if (!preferDevice && !online.active) {
            meta = prepareEquipment(saved.meta);
            campaignCache = { run: validRun(saved.run) ? saved.run : null, menu: !validRun(saved.run), paused: saved.run?.phase === "playing" };
          }
          return;
        }
        if (preferDevice || online.active) {
          save();
          void instance.flush();
          return;
        }
        meta = prepareEquipment(saved.meta);
        if (validRun(saved.run)) {
          run = saved.run;
          menu = false;
          paused = run.phase === "playing";
        } else {
          run = null;
          menu = true;
          paused = false;
        }
        finish();
        save();
        renderRail();
        renderOverlay(true);
      }
    });
  }
  function newSave(restore = false) {
    if (online.active) throw Error("Leave your online room before changing saves.");
    let chosen = null;
    if (restore) {
      try {
        chosen = JSON.parse(localStorage.getItem(PREVIOUS_KEY));
      } catch {
      }
      if (!chosen || !validMeta(chosen.state?.meta)) throw Error("No previous spark is available.");
    }
    const previous2 = { state: savedState(), credential: localStorage.getItem(CREDENTIAL_KEY) };
    localStorage.setItem(PREVIOUS_KEY, JSON.stringify(previous2));
    progress?.dispose();
    progress = null;
    loadEpoch++;
    if (chosen?.credential) localStorage.setItem(CREDENTIAL_KEY, chosen.credential);
    else localStorage.removeItem(CREDENTIAL_KEY);
    meta = chosen ? prepareEquipment(chosen.state.meta) : createMeta();
    run = chosen && validRun(chosen.state.run) ? chosen.state.run : null;
    settings.guideGift = !!chosen && (run?.level >= 2 || meta.bestRun?.level >= 2 || meta.lastRun?.level >= 2);
    persistSettings();
    menu = !run;
    paused = run?.phase === "playing";
    modalWasPaused = paused;
    mapWorld = worldOf(run?.room ?? "threshold");
    overlaySignature = "";
    clearInput();
    localStorage.setItem(KEY, JSON.stringify(savedState()));
    if (entryMode === "descent") connectProgress(true);
    document.querySelectorAll("dialog[open]").forEach((d) => d.close());
    renderRail();
    renderOverlay(true);
    announce(restore ? "The previous spark returns." : "A new spark begins. Your previous save is kept for restoration.");
    window.scrollTo?.({ top: 0, left: 0, behavior: "instant" });
    renderStart();
  }
  function renderReviveStatus() {
    const el = $("coop-revive-status"), fallen = run?.partner && run.phase === "playing" ? [run.player, run.partner].find((a) => a.hp <= 0) : null;
    el.hidden = !fallen;
    if (!fallen) return;
    const name = roomPlayerName(fallen === run.partner), self = fallen === vessel().player, seconds = Math.ceil(fallen.downedFor ?? 30), progress2 = Math.min(100, Math.round((fallen.revive ?? 0) / REVIVE_SECONDS * 100)), rescue = reviveState(run, vessel().player), stale = online.role === "guest" && Date.now() - snapshotAt > 1500;
    let message;
    if (rescueWaiting) message = "Waiting for your partner to receive the fallen spark \xB7 rescue clock held.";
    else if (stale) message = "Waiting for current rescue state \xB7 last seen " + seconds + "s.";
    else if (progress2) message = "REKINDLING \xB7 " + progress2 + "% \xB7 keep holding " + (touchDevice ? "GATE" : hint("interact")) + ".";
    else if (self) message = "Your partner can rekindle you. If this timer expires, the shared life ends.";
    else if (!rescue?.inRange) message = "Move into the glowing rescue circle \xB7 " + Math.ceil(rescue?.distance ?? 0) + " / " + REVIVE_RADIUS + " px.";
    else message = heldInteract() ? "HOLD ACCEPTED LOCALLY \xB7 waiting for the host." : "IN RANGE \xB7 hold " + (touchDevice ? "GATE" : hint("interact")) + " for " + REVIVE_SECONDS + " seconds.";
    el.textContent = name + " \xB7 FALLEN \xB7 " + seconds + "s \xB7 " + message;
    el.dataset.channeling = String(progress2 > 0);
    if (self) $("clock-state").textContent = "FALLEN \xB7 " + seconds + "s";
  }
  function renderRail() {
    syncKeepsakes();
    recordDiscoveryClues(run);
    $("active-mode-label").textContent = entryMode === "dungeon" ? "Endless dungeon" : "Descent";
    $("nav-new-save").hidden = entryMode === "dungeon";
    $("room-count-label").textContent = entryMode === "dungeon" ? "floors cleared" : "rooms cleared";
    if (entryMode !== "dungeon" && !settings.guideGift && (run?.level >= 2 || Object.values(run?.boons ?? {}).some(Boolean) || meta.bestRun?.level >= 2)) {
      settings.guideGift = true;
      persistSettings();
    }
    $("leave-room-button").hidden = !online.active;
    renderOnlineStatus();
    if ($("online-dialog").open) renderOnlineSetup();
    const intro = entryMode !== "dungeon" && meta.runs === 0 && !online.active && !run?.daily && (run?.roomResolved?.length ?? 0) < 1;
    $("header-karma").hidden = intro;
    $("header-memory").hidden = intro;
    $("equipment-nav").hidden = intro;
    $("online-nav").hidden = intro;
    $("skills-nav").hidden = meta.runs === 0 && !Object.values(meta.training ?? {}).some((entry) => entry.xp > 0);
    $("ability-section").hidden = intro;
    $("gear-section").hidden = intro;
    $("key-section").hidden = !(run?.keys ?? meta.keys ?? []).length && !run?.discovered.some((id) => ROOMS[id].key);
    $("gifts-section").hidden = !run || !Object.values(run.boons).some((count) => count > 0);
    $("power-section").hidden = intro && (!run || run.time < 20);
    $("seal-count").hidden = !(run?.seals ?? meta.seals ?? []).length;
    const view = vessel(), form = view.form, body = BODIES[form], hp = view.player?.hp ?? body.hp, maxHp = view.player?.maxHp ?? body.hp, known = run?.abilities ?? meta.abilities;
    $("room-title").textContent = ROOMS[run?.room ?? "threshold"].name;
    const currentWorld = worldOf(run?.room ?? "threshold");
    $("world-label").textContent = "WORLD " + pad(WORLDS[currentWorld].rank + 1) + " / 07 \xB7 " + WORLDS[currentWorld].name.toUpperCase();
    $("seal-count").textContent = (run?.seals ?? meta.seals ?? []).length + " / 6 guardian seals";
    $("header-karma").textContent = "KARMA " + signed(run?.karma ?? meta.karma);
    const settledHere = run?.settled || online.role === "guest" && (meta.coopReceipts ?? []).includes(online.code);
    const lifeEssence = run && !settledHere ? run.essence : 0;
    $("header-memory").textContent = "\u25C7 " + (meta.essence + lifeEssence);
    $("header-memory").title = meta.essence + " carried \xB7 " + lifeEssence + " earned this life";
    $("run-number").textContent = "INCARNATION " + pad(meta.runs + (run?.settled ? 0 : 1));
    if (run?.daily) {
      $("header-memory").textContent = "DAILY";
      $("header-memory").title = "This challenge records its result separately from campaign rewards.";
    }
    $("online-strip").hidden = intro && !online.active;
    if (run?.daily) $("run-number").textContent = "DAILY \xB7 " + run.daily.day + " UTC";
    const seconds = Math.floor(run?.time ?? 0);
    $("run-clock").textContent = pad(Math.floor(seconds / 60)) + ":" + pad(seconds % 60);
    $("clock-state").textContent = run && run.phase !== "playing" ? { boon: "PAUSED \xB7 GIFT", resolve: run.dungeon ? "CHECKPOINT" : "PAUSED \xB7 STORY", milestone: "PAUSED \xB7 JOURNEY", dead: "RUN ENDED", won: "COMPLETE" }[run.phase] ?? "" : paused || remotePaused ? "PAUSED" : "";
    $("form-name").textContent = FORMS[form].name;
    $("form-portrait").setAttribute("style", spriteStyle(form));
    $("weapon-name").textContent = run ? attackProfile(run, form).name : body.weapon;
    $("form-level").textContent = "LV " + pad(run?.level ?? 1);
    $("hp-label").textContent = Math.ceil(hp) + " / " + maxHp;
    $("health-fill").style.width = hp / maxHp * 100 + "%";
    $("health-fill").classList.toggle("hurt", (view.player?.hurtFlash ?? 0) > 0);
    $("xp-label").textContent = Math.min(run?.xp ?? 0, run?.nextXp ?? 6) + " / " + (run?.nextXp ?? 6);
    $("xp-fill").style.width = Math.min(100, (run?.xp ?? 0) / (run?.nextXp ?? 6) * 100) + "%";
    $("kill-count").textContent = run?.kills ?? 0;
    $("room-count").textContent = (run?.cleared.filter((id) => worldOf(id) === worldOf(run.room)).length ?? 0) + " / 18";
    $("room-count-label").textContent = "stratum progress";
    $("room-count").title = WORLDS[worldOf(run?.room ?? "threshold")].name + " \xB7 18 rooms. World map: seven worlds, 126 rooms.";
    $("mini-map").style.gridTemplateColumns = `repeat(${mapColumns(worldOf(run?.room ?? "threshold"))},minmax(57px,1fr))`;
    const miniYs = Object.values(ROOMS).filter((room2) => room2.world === worldOf(run?.room ?? "threshold")).map((room2) => room2.coord[1]);
    $("mini-map").style.gridTemplateRows = `repeat(${Math.max(...miniYs) - Math.min(...miniYs) + 1},29px)`;
    $("mini-map").innerHTML = mapHtml();
    $("mini-map-location").textContent = ROOMS[run?.room ?? "threshold"].name + " \xB7 expand for room names";
    $("ability-list").innerHTML = Object.entries(ABILITIES).map(([id, a]) => `<div class="ability ${known.includes(id) ? "known" : ""}"><span aria-hidden="true">${a.glyph}</span><div>${a.name}<small>${known.includes(id) ? a.desc : "Not remembered yet"}</small></div></div>`).join("");
    const gifts = run ? Object.entries(run.boons).filter(([, n]) => n > 0) : [];
    $("boon-list").innerHTML = gifts.length ? gifts.map(([id, n]) => `<span class="boon-chip" title="${BOONS[id].desc}">${BOONS[id].name}<b>\xD7${n}</b></span>`).join("") : "<p>No gifts yet. Gather the blue fragments.</p>";
    $("world-message").textContent = run?.noticeTime > 0 ? adaptPrompt(run.notice, settings.inputProfile, settings.bindings) : run && !run.cleared.includes(run.room) ? "Keep moving. Blue fragments remember the constructs you break." : ROOMS[run?.room ?? "threshold"].desc;
    const gateHint = run && !run.dungeon && !run.rematch && run.phase === "playing" ? nearestGate(run, view.player) : null;
    if (gateHint && gateHint.distance < 155) $("world-message").textContent = gatePromptText(gateHint);
    else if (entryMode === "descent" && meta.runs === 0 && run?.room === "threshold" && run.phase === "playing" && run.noticeTime <= 0) $("world-message").textContent = Object.values(run.boons).some(Boolean) ? "Your weapon fights automatically. Follow the gates." : moveHint(settings.inputProfile, settings.bindings) + ". " + hint("dash") + " to dash. Your weapon fights. Go north.";
    const clues = run && !run.dungeon && !run.rematch && run.noticeTime <= 0 && run.cleared.includes(run.room) ? discoveryClues(run.room) : [];
    if (clues.length && (!gateHint || gateHint.distance >= 155)) $("world-message").textContent = clues.map((c2) => c2.text).join(" ") + " Clues saved in your Story journal.";
    const chosen = specialty(run?.training ?? meta.training, form);
    $("specialty-label").textContent = chosen ? chosen.name + " specialty" : meta.runs ? "Mastery is remembered between lives." : "";
    renderReviveStatus();
    const playable = run && !menu && run.phase === "playing";
    $("pause-button").textContent = playable && paused ? "Resume" : "Pause";
    $("pause-button").disabled = !playable || online.role === "guest";
    $("gear-list").innerHTML = Object.values(run?.loadout ?? meta.loadout).filter(Boolean).map((id) => `<span class="boon-chip" title="${escapeText(EQUIPMENT[id].desc)}">${EQUIPMENT[id].name}</span>`).join("");
    $("key-list").innerHTML = Object.entries(KEYS).filter(([, key]) => worldOf(key.room) === worldOf(run?.room ?? "threshold")).map(([id, key]) => `<span class="key-chip ${(run?.keys ?? meta.keys ?? []).includes(id) ? "found" : ""}" style="--key-color:${key.color}" title="${key.place}">${KEY_ICON} ${(run?.keys ?? meta.keys ?? []).includes(id) ? key.name : key.name + " \xB7 missing"}</span>`).join("");
    const resonance = !!run?.abilities.includes("morph");
    const power = powerProfile(run ?? { training: meta.training }, form), cooldown = view.player?.powerCooldown ?? 0;
    $("power-button").textContent = hint("power") + " \xB7 " + power.name;
    $("power-button").style.setProperty?.("--ready", Math.max(0, 1 - cooldown / power.cooldown));
    $("touch-power").style.setProperty?.("--ready", Math.max(0, 1 - cooldown / power.cooldown));
    $("dash-button").textContent = hint("dash") + " \xB7 Dash";
    $("dash-button").style.setProperty?.("--ready", Math.max(0, 1 - (view.player?.dashCooldown ?? 0) / dashCooldown(run ?? { boons: { dash: 0 }, training: meta.training }, form)));
    $("dash-button").disabled = !playable || paused;
    $("touch-dash").style.setProperty?.("--ready", Math.max(0, 1 - (view.player?.dashCooldown ?? 0) / dashCooldown(run ?? { boons: { dash: 0 }, training: meta.training }, form)));
    $("power-button").disabled = !playable || paused || remotePaused || onlineWaiting || !view.player || view.player.hp <= 0 || cooldown > 0;
    $("power-description").textContent = power.desc;
    $("touch-power").textContent = cooldown > 0 ? cooldown.toFixed(1) + "s" : "POWER";
    $("touch-power").disabled = cooldown > 0;
    const set = matchedSet(run?.loadout ?? meta.loadout);
    $("set-bonus").textContent = set ? SET_BONUSES[set].name + " \xB7 " + SET_BONUSES[set].desc : "Match a weapon and armor for a set bonus.";
    $("vessel-button").disabled = !(resonance && playable && view.player?.hp > 0);
    const choiceLocksVessels = resonance && run && ["boon", "resolve", "milestone"].includes(run.phase);
    $("vessel-button").textContent = resonance ? hint("morph") + (choiceLocksVessels ? " \xB7 after choice" : " \xB7 Vessels") : "Vessels \xB7 find resonance";
    $("vessel-button").title = choiceLocksVessels ? "Vessel changes are disabled until this choice is complete." : "Borrow another body";
    $("touch-morph").disabled = !playable || paused || remotePaused;
    $("touch-morph").hidden = !resonance;
    $("touch-controls").hidden = !(["descent", "dungeon", "rematch"].includes(entryMode) && touchDevice && run && run.phase === "playing" && !paused && !menu);
    const compact = ["descent", "dungeon", "rematch"].includes(entryMode) && playable && !paused && !document.querySelector("dialog[open]") && !railExpanded;
    $("game-layout").classList.toggle("compact-rail", compact);
    $("rail-expand").textContent = railExpanded ? "Collapse" : "Expand";
    if (entryMode === "dungeon") {
      for (const id of ["header-karma", "equipment-nav", "online-nav", "skills-nav", "key-section", "ability-section", "gear-section", "online-strip", "seal-count"]) $(id).hidden = true;
      $("header-memory").hidden = false;
      $("header-memory").textContent = "ENDLESS";
      $("header-memory").title = "A separate dungeon current.";
      $("world-label").textContent = run ? "FLOOR " + run.dungeon.floor + " \xB7 " + dungeonRung(run.dungeon.floor).toUpperCase() : "ENDLESS DUNGEON";
      $("run-number").textContent = "FLOOR " + (run?.dungeon.floor ?? 1) + " \xB7 BEST " + Math.max(dungeonState.record.best, run?.dungeon.floorsCleared ?? 0);
      $("room-title").textContent = run ? dungeonArenaName(run) : "The endless current";
      $("world-message").textContent = run?.noticeTime > 0 ? run.notice : run ? "Floor " + run.dungeon.floor + " \xB7 " + DUNGEON_CONDITIONS[run.dungeon.condition].desc : "Choose a vessel. Clear floors, recover at checkpoints, and descend. Every fifth floor is a guardian.";
      $("room-count").textContent = (run?.dungeon.floorsCleared ?? 0) + " / \u221E";
      $("power-section").hidden = !run;
      $("mini-map").style.gridTemplateColumns = "1fr";
      $("mini-map").style.gridTemplateRows = "auto";
      $("mini-map").innerHTML = run ? '<span class="dungeon-condition">' + DUNGEON_CONDITIONS[run.dungeon.condition].name + "</span>" : "";
      $("mini-map-location").textContent = run ? DUNGEON_CONDITIONS[run.dungeon.condition].desc : "No final floor. Every fifth floor has a guardian.";
    }
    const relics = run?.relics ?? meta.relics ?? [];
    $("relic-section").hidden = entryMode !== "descent" || !relics.length;
    $("relic-list").innerHTML = relics.map((id) => `<span class="relic-chip" title="${ROUTE_RELICS[id].place} \xB7 opens ${ROUTE_RELICS[id].opens}">${RELIC_ICON} ${ROUTE_RELICS[id].name}<small>Opens ${ROUTE_RELICS[id].opens}</small></span>`).join("");
    if (entryMode === "rematch") {
      for (const id of ["header-karma", "header-memory", "online-nav", "skills-nav", "equipment-nav", "key-section", "gear-section", "ability-section", "online-strip", "seal-count", "nav-new-save"]) $(id).hidden = true;
      $("active-mode-label").textContent = "Guardian echo";
      $("world-label").textContent = "REMATCH \xB7 " + WORLDS[worldOf(run.room)].name.toUpperCase();
      $("room-title").textContent = rematchBosses(meta, campaignCache?.run).find((b) => b.id === run.room)?.name ?? "Guardian echo";
      $("room-count-label").textContent = "fixed practice level";
      $("room-count").textContent = "LV " + run.rematch.level;
      $("world-message").textContent = run.noticeTime > 0 ? run.notice : "Practice this guardian. Your campaign is waiting.";
      $("run-number").textContent = "CAMPAIGN KEPT";
      $("mini-map").innerHTML = '<button data-action="rematch-return">Return to your journey</button>';
      $("mini-map-location").textContent = ROOMS[run.room].name + " \xB7 no campaign rewards in practice.";
    }
  }
  function menuContent() {
    if (entryMode === "dungeon") return dungeonMenuContent();
    return `<div class="menu-card"><span class="eyebrow">${meta.runs ? "KARMA " + signed(meta.karma) + " \xB7 A NEW CURRENT" : "YOUR FIRST LIFE"}</span><h2>${meta.runs ? "The body falls.<br>The spark remembers." : "A spark against<br>the pattern."}</h2><p>${meta.runs ? "Choose your next body. Your equipment, abilities, and lasting memories cross the threshold." : moveHint(settings.inputProfile, settings.bindings) + ". " + hint("dash") + " to dash. Your weapon fights. Go north."}</p><div class="form-choices">${offeredForms(meta).map((form, i) => `<button type="button" class="form-choice" data-action="start" data-form="${form}" style="--form-color:${BODIES[form].color}" title="${BODIES[form].desc}"><span class="sprite-portrait" style="${spriteStyle(form)}"></span><strong>${FORMS[form].name}</strong><span class="weapon-label">${BODIES[form].weapon}</span><span class="form-start">${touchDevice ? "Tap to inhabit" : settings.inputProfile === "controller" ? "A \xB7 Inhabit this form" : "<kbd>" + (i + 1) + "</kbd> Inhabit this form"}</span></button>`).join("")}</div><div class="menu-actions">${meta.runs ? '<button class="secondary-button" data-action="forge">Equipment & forge \xB7 \u25C7 ' + meta.essence + "</button>" : ""}${meta.runs ? '<button class="secondary-button" data-action="journal">Story journal</button>' : ""}${rematchBosses(meta, run).length ? '<button class="secondary-button" data-action="boss-rematches">Guardian rematches</button>' : ""}<button class="secondary-button" data-action="new-save">New save</button>${meta.runs || meta.lastRun ? `<button class="secondary-button" data-action="skills">Skill trees</button><button class="secondary-button" data-action="daily">Daily descent</button>` : ""}${meta.lastRun ? '<button class="secondary-button" data-action="last-run">Last run</button>' : ""}</div></div><div class="menu-hints">${profileCopy(settings.inputProfile, settings.bindings)}<br>${touchDevice ? "Tap a card when a choice appears." : settings.inputProfile === "controller" ? "D-pad highlights \xB7 A confirms" : "Space inhabits a form \xB7 1\u20133 selects gifts \xB7 Enter confirms highlighted stories"}</div>`;
  }
  function dungeonMenuContent() {
    return `<div class="menu-card"><span class="eyebrow">ENDLESS DUNGEON \xB7 A SEPARATE CURRENT</span><h2>The staircase has no last step.</h2><p>The Maker builds another floor each time you break one. Enemies grow stronger, conditions change, and a guardian waits every fifth floor. All six vessels can morph from the start. Your campaign is kept.</p><div class="form-choices">${Object.entries(BODIES).map(([form, body], i) => `<button class="form-choice" data-action="start" data-form="${form}" style="--form-color:${body.color}"><span class="sprite-portrait" style="${spriteStyle(form)}"></span><strong>${FORMS[form].name}</strong><span class="weapon-label">${body.weapon}</span><span class="form-start">${touchDevice ? "Tap" : settings.inputProfile === "controller" ? "A" : i + 1} \xB7 Inhabit</span></button>`).join("")}</div><p>Best: ${dungeonState.record.best} ${dungeonState.record.best === 1 ? "floor" : "floors"} \xB7 ${dungeonState.record.attempts} completed ${dungeonState.record.attempts === 1 ? "attempt" : "attempts"}</p><button class="secondary-button" data-action="home">Return to start</button></div>`;
  }
  function dungeonCheckpointContent() {
    const next = dungeonFloor(run.seed, run.dungeon.floor + 1), pending = run.xp >= run.nextXp;
    return `<div class="menu-card"><span class="eyebrow">FLOOR ${run.dungeon.floor} CLEARED \xB7 ${dungeonRung(run.dungeon.floor).toUpperCase()}</span><h2>${run.bossDefeated?.room === run.room ? escapeText(run.bossDefeated.name) + " defeated" : "The Maker adds another step."}</h2><p>The checkpoint restored ${run.dungeon.recovered ?? 0} HP.${run.dungeon.vesselRecovered ? " Living vessel restored another " + run.dungeon.vesselRecovered + " HP and added maximum health." : ""} ${Math.ceil(run.player.hp)} / ${run.player.maxHp} HP remains. Gifts and your build carry into the next floor.</p><div class="next-floor"><b>Next \xB7 Floor ${next.floor}${next.boss ? " \xB7 GUARDIAN" : ""}</b><p>${dungeonArenaName(next)} \xB7 ${DUNGEON_CONDITIONS[next.condition].name}</p><p>${DUNGEON_CONDITIONS[next.condition].desc} Enemy health \xD7${next.pressure.health.toFixed(2)}.</p></div><div class="menu-actions"><button class="primary-button" data-action="${pending ? "dungeon-gifts" : "dungeon-next"}">${pending ? "Remember waiting gifts" : "Descend to floor " + next.floor} \xB7 ${settings.inputProfile === "pc" ? "Enter" : settings.inputProfile === "controller" ? "A" : "Tap"}</button><button class="secondary-button" data-action="home">Save & return to start</button></div><p class="overlay-note">Seed ${run.seed} \xB7 ${run.dungeon.floorsCleared} ${run.dungeon.floorsCleared === 1 ? "floor" : "floors"} cleared. The clock waits at checkpoints.</p></div>`;
  }
  function dungeonResultContent() {
    return `<div class="menu-card"><span class="eyebrow">THE STAIRCASE REMEMBERS</span><h2>Reached floor ${run.dungeon.floor}.</h2><p>${run.dungeon.floorsCleared} ${run.dungeon.floorsCleared === 1 ? "floor cleared" : "floors cleared"} before the spark returned.</p><div class="result-stats"><div><strong>${run.dungeon.floor}</strong><span>floor reached</span></div><div><strong>${run.kills}</strong><span>constructs</span></div><div><strong>${dungeonState.record.best}</strong><span>best floors</span></div></div><p>${FORMS[run.form].name} \xB7 LV ${run.level} \xB7 ${Math.round(run.stats.damageDealt).toLocaleString()} damage \xB7 ${dungeonRung(run.dungeon.floor)} rung</p><p>${Object.entries(run.boons).filter(([, n]) => n > 0).map(([id, n]) => BOONS[id].name + " \xD7" + n).join(" \xB7 ") || "No gifts remembered"}</p><p>Your campaign spark is waiting where you left it.</p><div class="menu-actions"><button class="primary-button" data-action="dungeon-new">Another endless attempt</button><button class="secondary-button" data-action="home">Return to start</button></div></div>`;
  }
  function renderDungeonMap() {
    const first = run?.dungeon.floor ?? 1, seed = run?.seed ?? 0;
    $("dungeon-map-content").innerHTML = `<p>${run ? dungeonRung(first) + " rung \xB7 " + run.dungeon.floorsCleared + (run.dungeon.floorsCleared === 1 ? " floor cleared" : " floors cleared") : "Choose a vessel to begin."} Every fifth floor is a guardian checkpoint. Conditions and strength are shown before you descend.</p><ol class="dungeon-route">${Array.from({ length: 5 }, (_, i) => dungeonFloor(seed, first + i)).map((f) => `<li><b>Floor ${f.floor}${f.boss ? " \xB7 GUARDIAN" : ""}</b><span>${dungeonArenaName(f)}</span><small>${DUNGEON_CONDITIONS[f.condition].name} \xB7 health \xD7${f.pressure.health.toFixed(2)}</small></li>`).join("")}</ol>`;
  }
  function vesselContent() {
    const view = vessel();
    return `<p>One spark, six bodies. Your health percentage, equipment, and gifts carry across the change. Resonance recovers in 3 seconds.</p><div class="vessel-choices">${Object.entries(BODIES).map(([form, body], i) => `<button type="button" class="form-choice vessel-choice ${view.form === form ? "current" : ""}" data-action="morph" data-form="${form}" style="--form-color:${body.color}" ${view.form === form || view.player?.hp <= 0 || (view.player?.morphCooldown ?? 0) > 0 ? "disabled" : ""}><span class="sprite-portrait" style="${spriteStyle(form)}"></span><strong>${FORMS[form].name}</strong><span class="weapon-label">${body.weapon}</span><small class="power-label">${hint("power")} \xB7 ${VESSEL_POWERS[form].name}</small><span class="form-start">${view.form === form ? "Current vessel" : i + 1 + " \xB7 Inhabit"}</span></button>`).join("")}</div><p class="overlay-note">${(view.player?.morphCooldown ?? 0) > 0 ? "Resonance is recovering; return to the descent for a moment." : settings.inputProfile === "controller" ? "D-pad highlights; A inhabits. B closes this window." : touchDevice ? "Tap a whole card to inhabit." : "Press 1\u20136 or click a whole card. Escape closes this window."}</p>`;
  }
  function roomDescription(id) {
    const room2 = ROOMS[id];
    if (!room2) return "";
    const exits = Object.entries(room2.exits).map(([dir, exit]) => dir + ": " + ROOMS[exit.to].name + (exit.keys ? " \xB7 " + exit.keys.map((key) => KEYS[key].name).join(" + ") : "") + (exit.vessel ? " \xB7 " + FORMS[exit.vessel].name + " vessel" : "") + (exit.requires ? " \xB7 " + ABILITIES[exit.requires].name : "") + (exit.seals ? " \xB7 Guardian seal required" : "") + (exit.ward ? " \xB7 Wake " + ROOMS[exit.ward].name : "") + (exit.relics ? " \xB7 " + exit.relics.map((key) => ROUTE_RELICS[key].name + " from " + WORLDS[ROUTE_RELICS[key].world].name + " \xB7 " + ROUTE_RELICS[key].place).join(" + ") : ""));
    return room2.desc + (DISCOVERY_CLUES[id]?.length ? " " + discoveryClues(id).map((c2) => c2.text).join(" ") : "") + (room2.relic ? " Find " + ROUTE_RELICS[room2.relic].name + " here; opens " + ROUTE_RELICS[room2.relic].opens + "." : "") + (room2.secret ? " " + EASTER_EGGS[room2.secret].hint : "") + " Routes: " + exits.join(" / ");
  }
  function forgeContent() {
    const active = run && !["dead", "won"].includes(run.phase), checkpoint = checkpointAvailable(run), equipment = active ? prepareEquipment({ inventory: { ...run.daily ? createMeta().inventory : meta.inventory, ...run.equipmentLevels, ...Object.fromEntries((run.loot ?? []).map((id) => [id, run.equipmentLevels?.[id] ?? 0])) }, loadout: run.loadout }) : prepareEquipment(meta), set = matchedSet(equipment.loadout);
    return `<p>${active ? "Equip found gear at a safe checkpoint or a defeated guardian. Enhancement and lasting memories are purchased between lives." : "Carry a weapon, armor, relic, and ward. Found items can be enhanced to +3."}</p>${set ? `<p class="active-set">${SET_BONUSES[set].name} \xB7 ${SET_BONUSES[set].desc}</p>` : ""}<p class="forge-balance">\u25C7 ${meta.essence} banked essence</p><div class="equipment-grid">${Object.entries(EQUIPMENT).map(([id, item]) => {
      const owned = id in equipment.inventory, level = equipment.inventory[id] ?? 0, equipped = equipment.loadout[item.slot] === id, cost = enhancementCost(meta, id), art = item.art !== void 0, style = art ? `--item-x:${item.art % 4 * 100 / 3}%;--item-y:${Math.floor(item.art / 4) * 50}%` : `--item-x:${item.sprite % 3 * 50}%;--item-y:${Math.floor(item.sprite / 3) * 100}%`;
      return `<article class="equipment-card ${owned ? "" : "locked"}"><span class="equipment-icon ${art ? "world-equipment" : ""}" style="${style}" aria-hidden="true"></span><div><span class="eyebrow">${item.slot.toUpperCase()} \xB7 ${owned ? equipped ? "EQUIPPED" : "OWNED" : item.origin}</span><h3>${item.name}${level ? " +" + level : ""}</h3><p>${item.desc}</p><p class="item-effects">${equipmentEffects(id, level)}</p>${item.set ? `<p class="set-note">Pair: ${SET_BONUSES[item.set].name} \xB7 ${SET_BONUSES[item.set].desc}</p>` : ""}${owned ? `<div class="item-actions"><button class="secondary-button" data-action="equip" data-item="${id}" ${equipped || active && (!checkpoint || online.role === "guest") ? "disabled" : ""}>${equipped ? "Equipped" : "Equip"}</button><button class="primary-button" data-action="enhance" data-item="${id}" ${active || meta.essence < cost || level >= 3 ? "disabled" : ""} title="${level < 3 ? equipmentEffects(id, level + 1) : "Fully enhanced"}">${level >= 3 ? "Max +3" : "Enhance \xB7 \u25C7 " + cost}</button></div>` : `<p class="item-origin">Find this in ${item.origin}.</p>`}</div></article>`;
    }).join("")}</div><h3 class="forge-memories">Lasting memories</h3><p class="overlay-note">Your first memory costs 4 essence. A first life with any defeated construct earns at least 4.</p><div class="memory-shop">${Object.entries(MEMORY_GIFTS).map(([id, g]) => `<button class="memory-buy" data-action="buy" data-gift="${id}" ${active || meta.essence < memoryCost(meta, id) || meta.gifts[id] >= 8 ? "disabled" : ""}><strong>${g.name}</strong><span>${g.desc}</span><b>${meta.gifts[id] >= 8 ? "Complete" : "\u25C7 " + memoryCost(meta, id)}</b><small>Remembered ${meta.gifts[id]} / 8</small></button>`).join("")}</div>`;
  }
  function coopChoiceNote() {
    const vote = currentCoopVote(run, roomPresence?.crew), guest = online.role === "guest";
    const receipt = roomPresence?.voteReceipt, received = vote && receipt?.context === vote.context && receipt.index === vote.index;
    const text = online.active ? guest ? (vote ? "Your vote: option " + (vote.index + 1) + " \xB7 " + (received ? "HOST RECEIVED. " : "Sent; waiting for the host receipt. ") : "") + "Vote with 1\u20133 or tap a card. The host confirms; a vote never spends karma." : (vote ? roomPlayerName(true) + " votes for option " + (vote.index + 1) + ". " : "") + "The host confirms the shared choice." : "Time waits for you.";
    return '<p data-coop-choice-note class="overlay-note" role="status">' + escapeText(text) + (run.abilities.includes("morph") ? " Vessel changes are disabled until this choice is complete." : "") + "</p>";
  }
  function giftContent() {
    const guest = online.role === "guest", vote = currentCoopVote(run, roomPresence?.crew);
    return `<div class="menu-card"><span class="eyebrow">LEVEL ${pad(run.level)} \xB7 ${run.clearNotice ?? "A MEMORY TAKES SHAPE"}</span><h2>${guest ? "Choose a gift to recommend." : "What will this life become?"}</h2><p>${guest ? "Both vessels receive the same power. The host is choosing a gift." : run.dungeon ? "This cleared-floor checkpoint is paused. Choose a gift, then descend." : ROOMS[run.room].boss || ROOMS[run.room].miniboss ? "The guardian is defeated. Your earned gifts are waiting; time is paused." : "Gifts pause the battle. Pick one."}</p>${coopChoiceNote()}<div class="gift-choices">${run.choices.map((id, i) => {
      const gift = BOONS[id];
      return `<button class="gift-choice ${vote?.index === i ? "guest-vote" : ""}" data-action="${guest ? "coop-vote" : "boon"}" data-index="${i}" data-gift="${id}"><span class="choice-number">${touchDevice ? "TAP" : settings.inputProfile === "controller" ? "A" : i + 1}</span><span class="gift-symbol" aria-hidden="true">${gift.glyph}</span><span class="eyebrow">${gift.tag}</span><strong>${gift.name}</strong><span class="gift-desc">${gift.desc}</span><span class="gift-effects">${vote?.index === i ? "GUEST VOTE \xB7 " : ""}${run.boons[id] ? "Already remembered \xD7" + run.boons[id] : "A new possibility"}</span></button>`;
    }).join("")}</div></div>`;
  }
  function resolveContent() {
    if (run?.dungeon) return dungeonCheckpointContent();
    const story = CHAMBER_STORIES[run.room], guest = online.role === "guest", vote = currentCoopVote(run, roomPresence?.crew), reward = ROOMS[run.room].reward;
    return `<div class="menu-card"><span class="eyebrow">${ROOMS[run.room].name.toUpperCase()} \xB7 THE GATES OPEN</span>${run.bossDefeated?.room === run.room ? '<div class="boss-reward"><span class="eyebrow">GUARDIAN DEFEATED</span><h2>' + escapeText(run.bossDefeated.name) + " defeated</h2><p>" + ([ROOMS[run.room].loot ?? []].flat().map((id) => EQUIPMENT[id]?.name).filter(Boolean).join(" \xB7 ") || (ROOMS[run.room].seal ? "Guardian seal recovered" : (ROOMS[run.room].treasure ?? 0) + (ROOMS[run.room].miniboss ? 7 : 0) + " essence recovered")) + " \xB7 chamber recovery restored up to " + (ROOMS[run.room].boss ? 30 : 12) + " HP.</p></div>" : "<h2>" + story.title + "</h2>"}<p>${reward ? "You remember " + ABILITIES[reward].name + ". " : ""}${story.speaker}: \u201C${story.line}\u201D</p><p class="story-controls">${guest ? "Your host is choosing what the two of you leave behind." : touchDevice ? "Tap a card to choose." : settings.inputProfile === "controller" ? "D-pad highlights. A confirms." : "Press 1\u20133 to highlight, then Enter to confirm. You can also click a card."} Time waits for you.</p>${coopChoiceNote()}<div class="gift-choices">${[["Liberate the chamber", "Let its light return to the world.", "+7 karma \xB7 +3 essence \xB7 heal up to 10 HP", "\u2727"], ["Harvest the machinery", "Take its remaining strength for yourself.", "\u22129 karma \xB7 +8 essence \xB7 heal up to 25 HP", "\u25C7"], ["Listen to the echoes", "Preserve the pattern before moving on.", "+2 karma \xB7 +7 awareness \xB7 +5 essence", "\u25C8"]].map(([name, desc, effects, glyph], i) => {
      name = story.choices?.[i]?.[0] ?? name;
      desc = story.choices?.[i]?.[1] ?? desc;
      return `<button class="gift-choice ${!guest && storyChoice === i ? "selected" : ""} ${vote?.index === i ? "guest-vote" : ""}" aria-pressed="${guest ? vote?.index === i : storyChoice === i}" data-action="${guest ? "coop-vote" : "resolve"}" data-index="${i}"><span class="choice-number">${touchDevice ? "TAP" : settings.inputProfile === "controller" ? "A" : i + 1}</span><span class="gift-symbol" aria-hidden="true">${glyph}</span><span class="eyebrow">A LASTING RIPPLE</span><strong>${name}</strong><span class="gift-desc">${desc}</span><span class="gift-effects">${vote?.index === i ? "GUEST VOTE \xB7 " : ""}${effects}${i < 2 ? " \xB7 capped at maximum HP" : ""}</span></button>`;
    }).join("")}</div></div>`;
  }
  function resultContent() {
    if (run?.rematch) return rematchResultContent();
    if (run?.dungeon) return dungeonResultContent();
    const won = run.phase === "won", rescueEnd = run.endReason === "rescue-expired" ? '<p class="overlay-note">The 30-second rescue window expired. The shared life ends even if your partner is still standing. Both sparks keep their memories.</p>' : run.endReason === "both-fallen" ? '<p class="overlay-note">Both sparks fell. No living vessel remained to rekindle a partner.</p>' : "", ending = endingFor(run), record = runRecord(run, ROOMS, EQUIPMENT, online.role === "guest");
    if (!won && !run.daily && meta.runs === 1 && !online.active && !run.partner) {
      const memory = Object.entries(record.mastery ?? {}).filter(([, xp]) => xp > 0).sort((a, b) => b[1] - a[1])[0];
      return `<div class="menu-card first-return"><span class="eyebrow">THE FIRST BODY ENDS</span><h2>The body falls.<br>The spark remembers.</h2><p>${memory ? FORMS[memory[0]].name + " remembers " + memory[1] + " mastery." : "The Wayfarer Sigil stays with your spark."}</p><div class="menu-actions"><button class="primary-button" data-action="reincarnate">Keep this spark</button><button class="secondary-button" data-action="guide">Read the field guide</button></div></div>`;
    }
    return `<div class="menu-card"><span class="eyebrow">${won ? run.victory === "eye" || run.room === "eye" ? "THE FIRST DESCENT COMPLETE" : "THE DEMIURGE FALLS" : "THE BODY ENDS"} \xB7 THE SPARK RETURNS</span><h2>${won ? ending.name : "This was a life.<br>It was not the last."}</h2><p>${won ? ending.text : run.daily ? "The daily current ends. Your result is remembered separately from campaign progress." : "Your body returns to the substrate. Your mastery, choices, equipment, and earned essence remain."}</p>${rescueEnd}${summaryHtml(record)}${!run.daily ? `<p class="result-ability">${run.essenceEarned ?? earnedEssence(run, meta)} essence earned \xB7 ${meta.endings?.length ?? 0} / 3 endings remembered</p>` : ""}<div class="menu-actions"><button class="primary-button" data-action="${online.active ? "online-leave" : "reincarnate"}">${online.active ? "Leave this room" : "Meet the next current"}</button><button class="secondary-button" data-action="skills">Skill trees</button><button class="secondary-button" data-action="forge">Equipment & forge</button><button class="secondary-button" data-action="share-run">Save run card \xB7 PNG</button><button class="secondary-button" data-action="map">See your path</button></div><p class="overlay-note">Karma ${signed(run.karma)} \xB7 \u25C7 ${meta.essence} carried forward \xB7 ${run.daily ? "daily seed " + run.seed : "vessel mastery persists"}</p></div>`;
  }
  function milestoneContent() {
    const ending = endingFor(run);
    return `<div class="menu-card"><span class="eyebrow">THE WARDEN FALLS \xB7 A COMPLETE FIRST DESCENT</span><h2>${ending.name}</h2><p>${ending.eye}</p><p>Your first guardian seal opens Tideglass to the east. Finish here and bank this life, or keep your current build and face the other worlds.</p>${online.role === "guest" ? "<p>Your host chooses whether to continue or complete this descent.</p>" : `<div class="milestone-options"><button class="primary-button" data-action="milestone" data-decision="continue">1 \xB7 Continue into Tideglass</button><button class="secondary-button" data-action="milestone" data-decision="finish">2 \xB7 Complete the first descent</button></div>`}</div>`;
  }
  function renderOverlay(force = false) {
    const context = run && !menu && run.phase === "resolve" ? run.seed + ":" + run.room : null;
    if (context !== storyChoiceContext) {
      storyChoice = null;
      storyChoiceContext = context;
    }
    const el = $("game-overlay");
    el.hidden = !!document.querySelector("dialog[open]");
    if ($("settings-dialog").open) renderPendingChoice();
    const signature = [menu, paused, run?.room, run?.phase, run?.level, run?.choices.join(","), storyChoice, meta.essence, meta.runs, imageFailure, online.role, onlineWaiting, remotePaused, networkProblem, roomPresence?.crew?.host, roomPresence?.crew?.guest, currentCoopVote(run, roomPresence?.crew)?.index, roomPresence?.voteReceipt?.index, Math.floor((Date.now() - online.lastSuccess) / 6500)].join(":");
    if (!force && signature === overlaySignature) return;
    overlaySignature = signature;
    el.classList.toggle("body-menu", menu || !run);
    el.classList.toggle("choice-overlay", !!run && ["boon", "resolve", "milestone"].includes(run.phase));
    if (imageFailure) {
      el.innerHTML = '<div class="menu-card"><h2>The artwork could not load.</h2><p>Reload this page to try again. Your saved journey is kept.</p></div>';
      return;
    }
    if (online.active && (onlineWaiting || !run || networkProblem || online.lastSuccess && Date.now() - online.lastSuccess > 6500)) el.innerHTML = `<div class="menu-card"><span class="eyebrow">TWO SPARKS \xB7 ONE CURRENT</span><h2>${networkProblem ? "Reconnecting to the room\u2026" : "Waiting for your partner"}</h2><p>${escapeText(networkProblem) || (online.role === "guest" ? "Waiting for the host\u2019s live update. Keep this tab open to reconnect." : "Share the room code. Your partner chooses Join room, enters this code, and joins.")}</p><strong class="room-code">${online.code}</strong><p class="overlay-note">Room access follows this game\u2019s sharing settings.</p><button class="secondary-button" data-action="online-leave">Leave room</button></div>`;
    else if (menu || !run) el.innerHTML = menuContent();
    else if (["dead", "won"].includes(run.phase)) el.innerHTML = resultContent();
    else if (run.phase === "boon") el.innerHTML = giftContent();
    else if (run.phase === "resolve") el.innerHTML = resolveContent();
    else if (run.phase === "milestone") el.innerHTML = milestoneContent();
    else if (online.role === "guest" && remotePaused) el.innerHTML = '<div class="menu-card"><h2>The host paused the current.</h2><p>Your shared life resumes when the host returns.</p><button class="secondary-button" data-action="online-leave">Leave room</button></div>';
    else if (paused && run.rematch) el.innerHTML = '<div class="menu-card"><span class="eyebrow">GUARDIAN ECHO \xB7 PAUSED</span><h2>The echo can wait.</h2><p>This practice attempt is paused. Your journey is waiting in its chamber.</p><div class="menu-actions"><button class="primary-button" data-action="resume">Resume this echo</button><button class="secondary-button" data-action="rematch-return">Return to your journey</button><button class="secondary-button" data-action="binder">Spark cards</button></div></div>';
    else if (paused) el.innerHTML = '<div class="menu-card"><span class="eyebrow">A BREATH BETWEEN PULSES</span><h2>The pattern can wait.</h2><p>Your life is paused. Your saved spark is still here.</p><div class="menu-actions"><button class="primary-button" data-action="resume">Return to this life</button><button class="secondary-button" data-action="guide">Field guide</button><button class="secondary-button" data-action="binder">Spark cards</button><button class="secondary-button" data-action="end">Let this body go</button></div></div>';
    else el.innerHTML = "";
    if (el.innerHTML) {
      clearInput();
      el.scrollTop = 0;
      if (!el.hidden && !menu && run && ["boon", "resolve", "milestone"].includes(run.phase) && online.role !== "guest") {
        if (run.phase === "resolve") {
          if (storyChoice === null) el.focus({ preventScroll: true });
          else el.querySelector('[data-action="resolve"][data-index="' + storyChoice + '"]')?.focus({ preventScroll: true });
        } else el.querySelector('[data-action="boon"], [data-action="milestone"]')?.focus({ preventScroll: true });
      }
    }
  }
  function loadNextPact() {
    try {
      return localStorage.getItem("spark-substrate-next-pact-v1") === "true";
    } catch {
      return false;
    }
  }
  function setSwarmPact(on) {
    swarmPact = !!on;
    try {
      localStorage.setItem("spark-substrate-next-pact-v1", String(swarmPact));
    } catch {
    }
    $("entry-pact").checked = swarmPact;
    return swarmPact;
  }
  function start(form) {
    requireDescent();
    if (online.active) throw Error("Leave the online room before starting solo.");
    if (!betweenLives()) throw new Error("A life is already in progress.");
    run = entryMode === "dungeon" ? createDungeon(form) : createRun(meta, form);
    run.fireMode = settings.fireMode;
    run.swarmPact = entryMode === "descent" && swarmPact;
    run.cardModifier = run.swarmPact && SPARK_CARDS[selectedSparkCard]?.mode === "swarm" ? selectedSparkCard : null;
    beginLife();
    return observeRun(run, meta);
  }
  function beginLife() {
    run.fireMode = settings.fireMode;
    menu = false;
    paused = false;
    clearInput();
    seenFeedback.clear();
    visualPositions.clear();
    save();
    renderRail();
    renderOverlay(true);
    canvas.focus({ preventScroll: true });
    if (sound) void audio.enable(true).then(() => audio.effect("chime", 300)).catch((error) => {
      sound = false;
      persistSettings();
      announce(error.message);
    });
  }
  function finish() {
    syncKeepsakes();
    if (entryMode === "rematch") return;
    if (entryMode === "dungeon") {
      if (run?.phase === "dead") save();
      return;
    }
    if (online.role === "guest") {
      if (run && ["dead", "won"].includes(run.phase) && !(meta.coopReceipts ?? []).includes(online.code)) {
        const shared = structuredClone(run);
        shared.settled = false;
        meta = settleRun(shared, meta, true);
        meta.coopReceipts = [online.code, ...meta.coopReceipts ?? []].slice(0, 30);
        save();
      }
      return;
    }
    if (run && ["dead", "won"].includes(run.phase) && !run.settled) {
      run.essenceEarned = earnedEssence(run, meta);
      meta = settleRun(run, meta);
      save();
      audio.effect(run.phase === "won" ? "win" : "damage");
      announce(run.phase === "won" ? endingFor(run).name + ". This descent is complete." : "The body ends. The spark remembers.");
    }
  }
  function changed() {
    finish();
    save();
    if (entryMode === "descent") void progress?.flush();
    renderRail();
    renderOverlay(true);
  }
  var feedbackUntil = 0;
  function feedback(text) {
    $("play-feedback").textContent = text;
    $("play-feedback").hidden = false;
    feedbackUntil = performance.now() + 3e3;
    announce(text);
  }
  function openDialog(id) {
    if (entryMode === "sideways") side.clearInputs();
    modalWasPaused = paused;
    $(id).dataset.wasPaused = String(paused);
    if (online.role !== "guest") paused = true;
    clearInput();
    if (id === "binder-dialog") renderBinder();
    if (id === "boss-rematch-dialog") $("boss-rematch-content").innerHTML = rematchContent();
    if (id === "skill-dialog") {
      skillForm = vessel().form;
      renderSkills();
    }
    if (id === "settings-dialog") renderSettings();
    if (id === "guide") renderGuide();
    if (id === "last-run-dialog") $("last-run-content").innerHTML = summaryHtml(meta.lastRun);
    if (id === "daily-dialog") {
      $("daily-description").textContent = "Current seed \xB7 " + dailySeed().day + " UTC \xB7 " + dailySeed().seed;
      $("daily-dialog").querySelector('[data-action="daily-start"]').disabled = !betweenLives() || online.active;
    }
    if (id === "vessel-dialog") $("vessel-content").innerHTML = vesselContent();
    if (id === "forge") $("forge-content").innerHTML = forgeContent();
    if (id === "journal") $("journal-content").innerHTML = journalHtml();
    if (id === "online-dialog") {
      $("online-error").textContent = "";
      renderOnlineSetup(true);
    }
    if (id === "world-map") {
      mapWorld = worldOf(run?.room ?? "threshold");
      renderWorldMap();
    }
    if (id === "new-save-dialog") $("restore-previous").hidden = !localStorage.getItem(PREVIOUS_KEY);
    $(id).showModal();
    renderOverlay();
    renderRail();
  }
  function act(action, data = {}) {
    if (action.startsWith("duel-")) {
      if (entryMode !== "duel") throw Error("Enter Duel from the start page.");
      duel.action(action, data);
      return;
    }
    if (action.startsWith("side-")) {
      if (entryMode !== "sideways") throw Error("Enter Sideways descent first.");
      side.action(action, data);
      return;
    }
    if (action === "save-profile") {
      switchSaveProfile(data.profile);
      return;
    }
    if (action === "table") {
      enterTable();
      return;
    }
    if (action.startsWith("table-")) {
      tableAction(action, data);
      return;
    }
    if (action === "vault") {
      enterVault();
      return;
    }
    if (action === "vault-buy") {
      if (entryMode !== "vault") throw Error("Enter the vault first.");
      const found = breakVaultSeal(keepsakes, data.alcove);
      persistKeepsakes();
      $("vault-message").textContent = VAULT_ALCOVES.find((a) => a.id === data.alcove).name + " seal broken \xB7 \u2212" + found.cost + " coins. " + (found.card ? found.card.duplicate ? "Memory already in your binder." : found.card.name + " card found." : "");
      audio.effect("key");
      renderVault();
      renderFireSettings();
      return;
    }
    if (action === "binder") {
      openDialog("binder-dialog");
      return;
    }
    if (action === "card-select") {
      selectCard(data.card);
      return;
    }
    if (action === "profile") {
      chooseProfile(data.profile);
      return;
    }
    if (action === "home") {
      returnToStart();
      return;
    }
    if (action.startsWith("entry-")) {
      if (action === "entry-sideways") enterSideways();
      else if (action === "entry-duel") enterDuel();
      else if (action === "entry-dungeon") enterDungeon();
      else enterDescent(action.slice(6));
      return;
    }
    if (["boon", "resolve", "milestone", "power", "morph", "travel", "pause", "resume", "reincarnate", "equip", "enhance", "buy", "learn-skill", "rebuild-tree"].includes(action)) requireDescent();
    if (action === "coop-vote") {
      void sendCoopVote(data.index);
      return;
    }
    if (action.startsWith("online")) {
      if (["dungeon", "rematch"].includes(entryMode)) throw Error("The endless dungeon is solo. Return to the campaign for online co-op.");
      void onlineAction(action);
      return;
    }
    if (online.role === "guest" && ["boon", "resolve", "milestone", "end", "end-confirm", "buy", "start", "reincarnate", "travel", "equip", "daily-start", "new-save", "new-save-confirm", "restore-previous"].includes(action)) throw Error("The host makes shared run choices.");
    if (entryMode === "rematch" && (["daily", "daily-start", "travel", "forge", "equip", "enhance", "buy", "learn-skill", "rebuild-tree", "new-save", "new-save-confirm", "restore-previous", "share-run", "skills", "last-run", "reincarnate", "start"].includes(action) || action.startsWith("online"))) throw Error("Return to your campaign for that action.");
    if (entryMode === "dungeon" && (["daily", "daily-start", "travel", "forge", "equip", "enhance", "buy", "learn-skill", "rebuild-tree", "new-save", "new-save-confirm", "restore-previous", "share-run", "skills", "last-run"].includes(action) || action.startsWith("online"))) throw Error("Return to your campaign for that action. Your dungeon is saved separately.");
    switch (action) {
      case "boss-rematches":
        if (online.active) throw Error("Leave co-op before practice.");
        openDialog("boss-rematch-dialog");
        break;
      case "boss-rematch":
        enterBossRematch(data.room);
        break;
      case "rematch-return":
        returnFromRematch();
        break;
      case "dungeon-gifts":
        chooseDungeonGift(run);
        paused = false;
        changed();
        break;
      case "dungeon-next":
        nextDungeonFloor(run);
        beginLife();
        break;
      case "dungeon-new":
        if (entryMode !== "dungeon" || !betweenLives()) throw Error("Finish this dungeon attempt first.");
        run = null;
        menu = true;
        paused = false;
        changed();
        break;
      case "start":
        start(data.form);
        break;
      case "milestone":
        resolveMilestone(run, data.decision);
        paused = false;
        changed();
        canvas.focus({ preventScroll: true });
        break;
      case "skills":
        openDialog("skill-dialog");
        break;
      case "skill-form":
        if (!SKILL_TREES[data.form]) throw Error("Unknown vessel.");
        skillForm = data.form;
        renderSkills();
        break;
      case "learn-skill":
        if (!betweenLives()) throw Error("Learn skills between lives.");
        meta = learnSkill(meta, data.form, data.skill);
        changed();
        renderSkills();
        audio.effect("level");
        break;
      case "rebuild-tree":
        if (!betweenLives()) throw Error("Rebuild between lives.");
        meta = rebuildTree(meta, data.form);
        changed();
        renderSkills();
        break;
      case "rail-expand":
        railExpanded = !railExpanded;
        renderRail();
        break;
      case "dash":
        if (run?.phase === "playing" && !paused) dashRequested = true;
        break;
      case "damage-numbers":
        settings.damageNumbers = !settings.damageNumbers;
        persistSettings();
        break;
      case "shake-off":
        settings.shake = 0;
        persistSettings();
        break;
      case "shake-low":
        settings.shake = 0.2;
        persistSettings();
        break;
      case "reduce-flash":
        settings.flashes = 0.15;
        persistSettings();
        break;
      case "settings":
        openDialog("settings-dialog");
        break;
      case "remap":
        bindingCapture = data.binding;
        $("binding-status").textContent = "Press a new key for " + BINDING_LABELS[bindingCapture] + ". Escape cancels.";
        renderSettings();
        break;
      case "reset-bindings":
        settings.bindings = { ...DEFAULT_BINDINGS };
        bindingCapture = null;
        clearInput();
        persistSettings();
        break;
      case "controller-toggle":
        settings.controller = !settings.controller;
        controllerButtons = [];
        persistSettings();
        break;
      case "daily":
        openDialog("daily-dialog");
        break;
      case "daily-start":
        requireDescent();
        if (online.active || !betweenLives()) throw Error("Finish this life before starting a daily current.");
        run = createDailyRun();
        if ($("daily-dialog").open) $("daily-dialog").close();
        beginLife();
        break;
      case "last-run":
        openDialog("last-run-dialog");
        break;
      case "share-run":
        void saveRunCard(betweenLives() ? meta.lastRun : runRecord(run, ROOMS, EQUIPMENT, online.role === "guest"), { ...FORMS, ...BOONS }, document, window).then(() => announce("Run card saved.")).catch((error) => announce(error.message));
        break;
      case "boon":
        if (!run) throw new Error("No active life.");
        chooseBoon(run, data.gift);
        paused = false;
        changed();
        canvas.focus({ preventScroll: true });
        tone(650, 0.17);
        break;
      case "resolve":
        if (!run) throw new Error("No active life.");
        resolveChamber(run, Number(data.index));
        paused = false;
        changed();
        announce(run.notice);
        canvas.focus({ preventScroll: true });
        break;
      case "reincarnate":
        if (!run || !["dead", "won"].includes(run.phase)) throw new Error("This life has not ended.");
        run = null;
        menu = true;
        paused = false;
        changed();
        break;
      case "pause":
        if (online.role === "guest") {
          announce("The host controls the shared pause. Your timer waits with theirs.");
          break;
        }
        if (run && !menu && run.phase === "playing") {
          paused = !paused;
          clearInput();
          changed();
        }
        break;
      case "resume":
        paused = false;
        changed();
        canvas.focus({ preventScroll: true });
        break;
      case "vessels":
        if (run && run.phase !== "playing") {
          feedback(run.phase === "boon" ? "Choose the waiting gift first. Vessel switching returns after the choice." : "Finish this choice before changing vessels.");
          throw Error(run.phase === "boon" ? "Choose your waiting gift first. Vessel switching returns after the choice." : "Finish this choice before changing vessels.");
        }
        if (!run?.abilities.includes("morph")) throw Error("Find Vessel Resonance in the Mirror Nursery first.");
        if (run.phase !== "playing") throw Error(run.phase === "boon" ? "Choose your waiting gift first (1\u20133). The battle and timer are paused." : run.phase === "resolve" ? "Finish the cleared-room choice first. The battle and timer are paused." : "Return to a living vessel before morphing.");
        openDialog("vessel-dialog");
        break;
      case "morph":
        if (online.role === "guest") {
          if (!Object.hasOwn(BODIES, data.form) || run?.phase !== "playing" || !run.abilities.includes("morph") || (run.partner?.morphCooldown ?? 0) > 0 || !(run.partner?.hp > 0)) throw Error("Vessel resonance is not ready.");
          if ($("vessel-dialog").open) {
            $("vessel-dialog").dataset.skipPauseRestore = "true";
            $("vessel-dialog").close();
            paused = false;
          }
          clearInput();
          online.input({ x: 0, y: 0, morph: data.form });
          void online.sync();
        } else {
          if (!run) throw Error("Inhabit a vessel first.");
          morphRun(run, data.form);
          changed();
          if ($("vessel-dialog").open) $("vessel-dialog").close();
        }
        canvas.focus({ preventScroll: true });
        break;
      case "power":
        if (!run || menu || paused || remotePaused || onlineWaiting || run.phase !== "playing") throw Error("Return to the descent before using a power.");
        if (online.role === "guest") online.input({ x: 0, y: 0, power: true });
        else {
          useVesselPower(run);
          changed();
        }
        break;
      case "map-world":
        if (!Object.hasOwn(WORLDS, data.world)) throw Error("Unknown world.");
        mapWorld = data.world;
        renderWorldMap();
        break;
      case "travel":
        travelWorld(run, data.world);
        if ($("world-map").open) $("world-map").close();
        changed();
        canvas.focus({ preventScroll: true });
        break;
      case "new-save":
        if (online.active) throw Error("Leave your online room before changing saves.");
        openDialog("new-save-dialog");
        break;
      case "new-save-confirm":
        newSave();
        break;
      case "restore-previous":
        newSave(true);
        break;
      case "forge":
        openDialog("forge");
        break;
      case "equip":
        if (run && !["dead", "won"].includes(run.phase)) equipRunItem(run, meta, data.item);
        else meta = equipItem(meta, data.item);
        changed();
        $("forge-content").innerHTML = forgeContent();
        break;
      case "enhance":
        if (run && !["dead", "won"].includes(run.phase)) throw Error("Enhance between lives.");
        meta = enhanceItem(meta, data.item);
        changed();
        $("forge-content").innerHTML = forgeContent();
        break;
      case "guide":
        openDialog("guide");
        break;
      case "journal":
        openDialog("journal");
        break;
      case "map":
        if (entryMode === "dungeon") {
          renderDungeonMap();
          openDialog("dungeon-map");
        } else openDialog("world-map");
        break;
      case "map-room":
        if ($("world-map").open) {
          $("map-description").textContent = roomDescription(data.room);
        } else openDialog("world-map");
        break;
      case "close-dialog":
        document.querySelectorAll("dialog[open]").forEach((d) => d.close());
        break;
      case "interact":
        if (run && run.phase === "playing" && !paused) interactRequested = true;
        break;
      case "end":
        if (run && !["dead", "won"].includes(run.phase)) openDialog("end-life");
        break;
      case "end-confirm":
        if (!run) throw new Error("No active life.");
        run.player.hp = 0;
        run.phase = "dead";
        $("end-life").close();
        paused = false;
        changed();
        break;
      case "buy":
        if (run && !["dead", "won"].includes(run.phase)) throw new Error("Lasting memories are chosen between lives.");
        meta = buyMemory(meta, data.gift);
        changed();
        if ($("forge").open) $("forge-content").innerHTML = forgeContent();
        break;
      case "sound":
        sound = !sound;
        void audio.enable(sound).then(() => audio.effect("chime", 440)).catch((error) => {
          sound = false;
          persistSettings();
          announce(error.message);
        });
        persistSettings();
        break;
    }
  }
  var bodyPress = null;
  var bodyCard = (target) => target?.closest?.('.form-choice[data-action="start"]');
  function inhabitCard(card) {
    if (!["descent", "dungeon", "rematch"].includes(entryMode) || !card || !menu || online.active) return;
    try {
      start(card.dataset.form);
    } catch (error) {
      announce(error.message);
    }
  }
  document.addEventListener("pointerdown", (event) => {
    const card = bodyCard(event.target);
    bodyPress = card && event.button === 0 ? { card, x: event.clientX, y: event.clientY, id: event.pointerId } : null;
  }, { capture: true });
  document.addEventListener("pointercancel", () => {
    bodyPress = null;
  }, { capture: true });
  document.addEventListener("pointerup", (event) => {
    const press = bodyPress;
    bodyPress = null;
    if (press && press.id === event.pointerId && bodyCard(event.target) === press.card && Math.hypot(event.clientX - press.x, event.clientY - press.y) < 12) {
      event.preventDefault();
      event.stopPropagation?.();
      inhabitCard(press.card);
    }
  }, { capture: true });
  document.addEventListener("click", (event) => {
    const button = event.target.closest?.("[data-action]");
    if (!button) return;
    event.preventDefault();
    if (button.dataset.action === "start") {
      event.stopPropagation?.();
      inhabitCard(button);
      return;
    }
    try {
      act(button.dataset.action, button.dataset);
    } catch (error) {
      announce(error.message);
    }
  }, { capture: true });
  document.querySelectorAll("dialog").forEach((dialog) => {
    dialog.addEventListener("close", () => {
      const skip = dialog.dataset.skipPauseRestore;
      delete dialog.dataset.skipPauseRestore;
      if (!skip) paused = online.role === "guest" ? false : dialog.dataset.wasPaused === void 0 ? modalWasPaused : dialog.dataset.wasPaused === "true";
      delete dialog.dataset.wasPaused;
      if (!skip) clearInput();
      renderOverlay(true);
      renderRail();
      restoreCanvasFocus();
    });
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        const r = dialog.getBoundingClientRect();
        if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
      }
    });
  });
  document.addEventListener("input", (event) => {
    const id = event.target?.dataset?.setting;
    if (!["master", "effects", "ambient", "shake", "flashes"].includes(id)) return;
    settings[id] = Math.max(0, Math.min(1, Number(event.target.value) / 100));
    persistSettings();
  });
  document.addEventListener("keydown", (event) => {
    if (entryMode === "sideways" && !document.querySelector("dialog[open]")) {
      side.keydown(event);
      return;
    }
    if (entryMode === "duel" && !document.querySelector("dialog[open]")) {
      duel.keydown(event);
      return;
    }
    if (bindingCapture && $("settings-dialog").open) {
      event.preventDefault();
      const key2 = eventKey(event);
      if (key2 === "escape") {
        bindingCapture = null;
        $("binding-status").textContent = "Key change cancelled.";
      } else try {
        settings = changeBinding(settings, bindingCapture, key2);
        bindingCapture = null;
        clearInput();
        $("binding-status").textContent = "Key saved.";
        persistSettings();
      } catch (error) {
        $("binding-status").textContent = error.message;
      }
      renderSettings();
      return;
    }
    if (event.altKey || event.ctrlKey || event.metaKey || ["INPUT", "TEXTAREA", "SELECT"].includes(event.target?.tagName) || event.target?.isContentEditable) return;
    const key = eventKey(event);
    if ($("vessel-dialog").open) {
      if ((key === "escape" || key === settings.bindings.morph) && !event.repeat) {
        event.preventDefault();
        $("vessel-dialog").close();
      } else if (/^[1-6]$/.test(key) && !event.repeat) {
        event.preventDefault();
        try {
          act("morph", { form: Object.keys(BODIES)[Number(key) - 1] });
        } catch (error) {
          announce(error.message);
        }
      }
      return;
    }
    if (document.querySelector("dialog[open]")) return;
    if (entryMode === "vault") {
      if (key === "escape" && !event.repeat) {
        event.preventDefault();
        returnToStart();
      }
      return;
    }
    if (entryMode === "table") {
      if (event.repeat) return;
      if (key === "escape") {
        event.preventDefault();
        returnToStart();
        return;
      }
      if (settings.inputProfile === "pc" && ["1", "2", "3"].includes(key) && tableSession?.phase === "choice") {
        event.preventDefault();
        tableChoice = Number(key) - 1;
        renderTable();
      } else if (key === "enter" && tableSession) {
        const button = event.target?.closest?.("button[data-action]");
        if (button && !["table-response", "table-next"].includes(button.dataset.action)) return;
        event.preventDefault();
        try {
          if (tableSession.phase === "result") tableAction("table-next");
          else if (tableSession.phase === "choice") {
            const index = button?.dataset.index ?? tableChoice;
            if (index !== null) tableAction("table-response", { index });
            else announce("Highlight a response with 1\u20133 before rolling.");
          }
        } catch (error) {
          announce(error.message);
        }
      }
      return;
    }
    if (entryMode === "start") {
      if (["1", "2", "3"].includes(key) && !event.repeat) {
        event.preventDefault();
        chooseProfile(INPUT_PROFILES[Number(key) - 1]);
      }
      return;
    }
    if (settings.inputProfile !== "pc") return;
    const inGame = run && !menu && !["dead", "won"].includes(run.phase);
    if ((inGame || menu || ["descent", "dungeon", "rematch"].includes(entryMode)) && [" ", settings.bindings.dash, "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) event.preventDefault();
    if (entryMode === "dungeon" && run?.phase === "resolve" && ["enter", "1"].includes(key) && !event.repeat) {
      event.preventDefault();
      try {
        act(run.xp >= run.nextXp ? "dungeon-gifts" : "dungeon-next");
      } catch (error) {
        announce(error.message);
      }
      return;
    }
    if (inGame && online.role === "guest" && ["boon", "resolve"].includes(run.phase) && ["1", "2", "3"].includes(key)) {
      event.preventDefault();
      if (!event.repeat) void sendCoopVote(Number(key) - 1);
      return;
    }
    if (inGame && run.phase === "resolve" && online.role !== "guest" && ["1", "2", "3", "enter"].includes(key)) {
      event.preventDefault();
      if (event.repeat) return;
      if (key !== "enter") {
        storyChoice = Number(key) - 1;
        renderOverlay(true);
        announce("Story option " + key + " highlighted. Press Enter to confirm.");
      } else {
        const focused = event.target?.closest?.('[data-action="resolve"]'), index = focused ? Number(focused.dataset.index) : storyChoice;
        if (index === null) {
          announce("Highlight a story option with 1, 2, or 3, then press Enter to confirm.");
          return;
        }
        try {
          act("resolve", { index });
        } catch (error) {
          announce(error.message);
        }
      }
      return;
    }
    if (run?.phase === "milestone" && online.role !== "guest" && ["1", "2"].includes(key) && !event.repeat) {
      event.preventDefault();
      act("milestone", { decision: key === "1" ? "continue" : "finish" });
      return;
    }
    if (menu && !online.active && key === " " && !event.repeat) {
      const otherButton = event.target?.closest?.("button[data-action]");
      if (otherButton && !bodyCard(otherButton)) {
        try {
          act(otherButton.dataset.action, otherButton.dataset);
        } catch (error) {
          announce(error.message);
        }
        return;
      }
      const focused = bodyCard(document.activeElement) || bodyCard(event.target);
      inhabitCard(focused ?? { dataset: { form: (entryMode === "dungeon" ? Object.keys(BODIES) : offeredForms(meta))[0] } });
      return;
    }
    if ((["1", "2", "3"].includes(key) || entryMode === "dungeon" && menu && /^[4-6]$/.test(key)) && !event.repeat) {
      const index = Number(key) - 1;
      if (inGame && online.role !== "guest" && run.phase === "boon") {
        event.preventDefault();
        try {
          act("boon", { gift: run.choices[index] });
        } catch (error) {
          announce(error.message);
        }
        return;
      }
      if (menu && !online.active) {
        event.preventDefault();
        start((entryMode === "dungeon" ? Object.keys(BODIES) : offeredForms(meta))[index]);
        return;
      }
    }
    if (inGame && run.phase === "playing" && !paused && !remotePaused && !onlineWaiting) {
      if ([settings.bindings.up, settings.bindings.left, settings.bindings.down, settings.bindings.right, "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
        event.preventDefault();
        if (!document.hidden) inputFocused = true;
        focusCanvas();
        keys.add(key);
      }
      if (key === settings.bindings.dash && !event.repeat) dashRequested = true;
      if (key === settings.bindings.power && !event.repeat) {
        event.preventDefault();
        powerRequested = true;
      }
      if (key === settings.bindings.fire) {
        event.preventDefault();
        keys.add(key);
      }
      if (key === settings.bindings.interact) {
        event.preventDefault();
        if (!document.hidden) inputFocused = true;
        focusCanvas();
        keys.add(key);
        if (!event.repeat) interactRequested = true;
      }
    }
    if (key === settings.bindings.morph && !event.repeat && inGame) {
      event.preventDefault();
      try {
        act("vessels");
      } catch (error) {
        announce(error.message);
      }
    }
    if (key === settings.bindings.pause && !event.repeat && inGame) {
      event.preventDefault();
      act("pause");
    }
    if (key === settings.bindings.map && !event.repeat) {
      event.preventDefault();
      act("map");
    }
  }, { capture: true });
  document.addEventListener("keyup", (event) => {
    keys.delete(event.key.toLowerCase());
    duel.keyup(event);
    side.keyup(event);
  });
  document.addEventListener("change", (event) => {
    if (event.target.id === "spark-save-profile") {
      try {
        switchSaveProfile(event.target.value);
      } catch (error) {
        announce(error.message);
        renderSaveProfiles();
      }
      return;
    }
    if (event.target?.id === "online-form") {
      renderOnlineSetup();
      return;
    }
    if (["entry-fire-mode", "setting-fire-mode"].includes(event.target?.id)) {
      setFireMode(event.target.value);
      return;
    }
    if (event.target?.id === "entry-pact") {
      setSwarmPact(event.target.checked);
      return;
    }
    if (event.target?.id === "duel-condition" && !duel.match && Object.hasOwn(duel.observe().conditions, event.target.value)) {
      duel.readOptions();
      $("duel-condition-copy").textContent = duel.observe().conditions[event.target.value].desc;
      $("duel-cycle-condition").textContent = "Next \xB7 " + duel.observe().conditions[event.target.value].name;
    }
    if (event.target?.id === "setting-profile" && event.target.value) chooseProfile(event.target.value);
  });
  window.addEventListener("blur", () => {
    if (entryMode === "sideways") side.suspend();
    inputFocused = false;
    clearInput();
    if (entryMode === "duel" && duel.match) {
      duel.paused = true;
      duel.clearInputs();
      duel.render(true);
    }
    if (["descent", "dungeon", "rematch"].includes(entryMode) && run && !menu && run.phase === "playing" && !online.active) {
      paused = true;
      renderOverlay();
      save();
    }
    if (online.active) void online.sync();
  });
  window.addEventListener("focus", () => {
    inputFocused = true;
    clearInput();
    focusCanvas();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (entryMode === "sideways") side.suspend();
      clearInput();
      if (entryMode === "duel" && duel.match) {
        duel.paused = true;
        duel.clearInputs();
        duel.render(true);
      }
      if (["descent", "dungeon", "rematch"].includes(entryMode) && run && !menu && run.phase === "playing" && !online.active) {
        paused = true;
        renderOverlay();
      }
      save();
      if (online.active) void online.sync();
    }
  });
  window.addEventListener("pagehide", () => {
    side.save();
    saveTable();
    persistKeepsakes();
    save();
    void progress?.flush();
  });
  canvas.addEventListener("pointerdown", (event) => {
    if (event.button === 0 && ["descent", "dungeon", "rematch"].includes(entryMode) && run?.phase === "playing" && !paused && !menu && !document.querySelector("dialog[open]")) {
      event.preventDefault();
      fireHeld = true;
      canvas.setPointerCapture?.(event.pointerId);
    }
  });
  $("touch-fire").addEventListener("pointerdown", (event) => {
    event.preventDefault();
    fireHeld = true;
    $("touch-fire").setPointerCapture?.(event.pointerId);
  });
  for (const type of ["pointerup", "pointercancel"]) window.addEventListener(type, () => {
    fireHeld = false;
  });
  var joystick = $("joystick");
  function stickMove(event) {
    if (pointer !== event.pointerId) return;
    const rect = joystick.getBoundingClientRect(), x = (event.clientX - rect.left - rect.width / 2) / 38, y = (event.clientY - rect.top - rect.height / 2) / 38, length = Math.hypot(x, y);
    stick = { x: length > 1 ? x / length : x, y: length > 1 ? y / length : y };
    joystick.style.opacity = length > 0.05 ? ".4" : "1";
    $("joystick-thumb").style.transform = `translate(${stick.x * 31}px,${stick.y * 31}px)`;
  }
  joystick.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    pointer = event.pointerId;
    joystick.setPointerCapture(pointer);
    stickMove(event);
  });
  joystick.addEventListener("pointermove", stickMove);
  for (const type of ["pointerup", "pointercancel"]) joystick.addEventListener(type, (event) => {
    if (pointer === event.pointerId) {
      pointer = null;
      stick = { x: 0, y: 0 };
      joystick.style.opacity = "1";
      $("joystick-thumb").style.transform = "translate(0,0)";
    }
  });
  $("touch-interact").addEventListener("pointerdown", (event) => {
    event.preventDefault();
    interactHeld = true;
  });
  for (const type of ["pointerup", "pointercancel"]) window.addEventListener(type, () => {
    interactHeld = false;
  });
  $("touch-dash").addEventListener("pointerdown", (event) => {
    event.preventDefault();
    dashRequested = true;
  });
  function tone(frequency) {
    audio.effect("chime", frequency);
  }
  function resize() {
    const rect = frame.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    viewport = { w: Math.max(1, rect.width), h: Math.max(1, rect.height), dpr };
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
  }
  new ResizeObserver(resize).observe(frame);
  window.addEventListener("resize", resize);
  function circle2(x, y, r, fill, stroke = null, width = 1) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;
      ctx.stroke();
    }
  }
  function drawSprite(index, x, y, size, flip = false, flash = false) {
    if (!images.sprites.complete || !images.sprites.naturalWidth) return;
    const sw = images.sprites.naturalWidth / 4, sh = images.sprites.naturalHeight / 2;
    ctx.save();
    ctx.translate(x, y);
    if (flip) ctx.scale(-1, 1);
    if (flash && settings.flashes > 0 && !reducedMotion) ctx.globalAlpha = 1 - 0.4 * settings.flashes;
    ctx.drawImage(images.sprites, index % 4 * sw, Math.floor(index / 4) * sh, sw, sh, -size / 2, -size / 2, size, size);
    ctx.restore();
  }
  var visualPositions = /* @__PURE__ */ new Map();
  var particles = [];
  var seenEffects = /* @__PURE__ */ new Set();
  var seenFeedback = /* @__PURE__ */ new Set();
  var drawStamp = 0;
  var shakeUntil = 0;
  var shakeStrength = 0;
  var clearVisual = { room: null, cleared: false, at: 0 };
  var visibleShots = /* @__PURE__ */ new Set();
  var muzzleUntil = /* @__PURE__ */ new Map();
  var damageReadings = /* @__PURE__ */ new Map();
  var damageTexts = [];
  function combatFeedback() {
    if (!run) return;
    for (const shot of run.shots) {
      if (!shot.enemy && shot.sourceForm === "spark" && !visibleShots.has(shot.id)) {
        visibleShots.add(shot.id);
        muzzleUntil.set(shot.sourcePartner ? "partner" : "player", performance.now() + 80);
      }
    }
    if (visibleShots.size > 500) {
      visibleShots.clear();
      for (const shot of run.shots) visibleShots.add(shot.id);
    }
    for (const enemy of run.enemies) {
      const key = run.seed + ":" + enemy.id, prior = damageReadings.get(key);
      if (settings.damageNumbers && prior > enemy.hp) damageTexts.push({ x: enemy.x, y: enemy.y, amount: Math.ceil(prior - Math.max(0, enemy.hp)), until: performance.now() + 650 });
      damageReadings.set(key, enemy.hp);
    }
    if (damageReadings.size > 500) damageReadings.clear();
    for (const fx of run.effects) {
      const key = run.seed + ":" + fx.id;
      if (seenFeedback.has(key)) continue;
      seenFeedback.add(key);
      const kind = { hit: "hit", burst: "kill", damage: "damage", level: "level", gate: "gate", power: "power", key: "key", unlock: "key", boss: "boss" }[fx.type];
      if (kind) audio.effect(kind);
      if (fx.type === "damage" && fx.value >= 10 || fx.type === "power" && ["rock", "human"].includes(vessel().form)) {
        shakeUntil = performance.now() + 180;
        shakeStrength = fx.type === "damage" ? Math.min(6, fx.value * 0.18) : 3;
      }
    }
    if (seenFeedback.size > 800) {
      const current = new Set(run.effects.map((fx) => run.seed + ":" + fx.id));
      seenFeedback.clear();
      for (const key of current) seenFeedback.add(key);
    }
  }
  function pollController() {
    controller = settings.controller && (entryMode === "start" || settings.inputProfile === "controller") ? controllerInput(window.navigator?.getGamepads?.(), controllerButtons) : { connected: false, buttons: [], x: 0, y: 0 };
    controllerButtons = controller.buttons;
    $("controller-status").textContent = controller.connected ? "Connected \xB7 " + controller.name : "Connect a standard controller, then press a button.";
    if (!controller.connected || bindingCapture) return;
    const dialog = document.querySelector("dialog[open]"), choices = ["start", "table", "vault"].includes(entryMode) || menu || !run || run.phase !== "playing" || paused || !!dialog;
    if (choices) {
      if (controller.morph && !dialog && run && run.phase !== "playing") {
        try {
          act("vessels");
        } catch (error) {
          announce(error.message);
        }
        return;
      }
      const root = dialog ?? (entryMode === "start" ? $("start-screen") : entryMode === "table" ? $("table-root") : entryMode === "vault" ? $("vault-root") : $("game-overlay")), buttons = Array.from(root.querySelectorAll?.("button:not([disabled])") ?? []);
      if (controller.back && dialog) {
        dialog.close();
        return;
      }
      if (buttons.length && (controller.next || controller.prior)) {
        let index = buttons.indexOf(document.activeElement);
        index = Math.max(0, index);
        index = (index + (controller.next ? 1 : -1) + buttons.length) % buttons.length;
        buttons[index].focus({ preventScroll: true });
      }
      if (entryMode === "start" && !settings.inputProfile && controller.confirm) {
        chooseProfile("controller");
        return;
      }
      if (controller.confirm && buttons.length) (buttons.includes(document.activeElement) ? document.activeElement : buttons[0]).click();
      if (controller.pause && !dialog && ["table", "vault"].includes(entryMode)) returnToStart();
      else if (controller.pause && !dialog && run?.phase === "playing") act("pause");
      return;
    }
    if (controller.pause) act("pause");
    else if (controller.morph) try {
      act("vessels");
    } catch (error) {
      announce(error.message);
    }
    else if (controller.map) act("map");
  }
  function smoothEntity(key, entity, dt, local = false) {
    const old = visualPositions.get(key);
    if (!old || Math.hypot(old.x - entity.x, old.y - entity.y) > 160) {
      visualPositions.set(key, { x: entity.x, y: entity.y });
      return entity;
    }
    const blend = reducedMotion ? 1 : 1 - Math.exp(-dt * (online.role === "guest" && !local ? 17 : 32));
    old.x += (entity.x - old.x) * blend;
    old.y += (entity.y - old.y) * blend;
    return { ...entity, x: old.x, y: old.y };
  }
  function drawEnemy(enemy, p, time) {
    const guardian = WORLD_GUARDIANS[enemy.kind];
    if (guardian) {
      const image2 = images.worldBosses;
      if (image2.complete && image2.naturalWidth) {
        const sw2 = image2.naturalWidth / 3, sh2 = image2.naturalHeight / 2, size2 = enemy.kind === "demiurge" ? 188 : 151;
        ctx.save();
        if (enemy.flash > 0 && settings.flashes > 0 && !reducedMotion) ctx.filter = "brightness(" + (1 + 0.6 * settings.flashes) + ")";
        ctx.drawImage(image2, guardian.sprite % 3 * sw2 + 4, Math.floor(guardian.sprite / 3) * sh2 + 4, sw2 - 8, sh2 - 8, enemy.x - size2 / 2, enemy.y - size2 / 2, size2, size2);
        ctx.restore();
      }
      return;
    }
    if (COMBAT_ROLES[enemy.kind]) {
      circle2(enemy.x, enemy.y, enemy.r + 5, null, WORLDS[worldOf(run?.room)].color + "88", 1.5);
      enemy = { ...enemy, kind: COMBAT_ROLES[enemy.kind] };
    }
    if (enemy.kind === "sentinel") {
      drawProp(4, enemy.x, enemy.y, 114);
      return;
    }
    const extra = { leech: 0, moth: 1, cantor: 2 }[enemy.kind];
    if (extra !== void 0) {
      const image2 = images.newEnemies;
      if (image2.complete && image2.naturalWidth) {
        const sw2 = image2.naturalWidth / 3, size2 = enemy.kind === "cantor" ? 105 : enemy.kind === "leech" ? 68 : 62;
        ctx.save();
        ctx.translate(enemy.x, enemy.y + (reducedMotion ? 0 : Math.sin(time * 4 + enemy.id) * 2));
        if (enemy.flash > 0 && settings.flashes > 0 && !reducedMotion) ctx.filter = "brightness(" + (1 + 0.65 * settings.flashes) + ")";
        ctx.drawImage(image2, extra * sw2, 0, sw2, image2.naturalHeight, -size2 / 2, -size2 / 2, size2, size2);
        ctx.restore();
      }
      if (enemy.kind === "cantor" && enemy.windup > 0) {
        ctx.strokeStyle = "#f4d397";
        ctx.lineWidth = 2;
        circle2(enemy.x, enemy.y, 50 + (1 - enemy.windup / 0.9) * 18, null, "#f4d397", 2);
        const count = enemy.stage === 2 ? 8 : 6;
        for (let i = 0; i < count; i++) {
          const a = enemy.volleyAngle + i * Math.PI * 2 / count;
          ctx.beginPath();
          ctx.moveTo(enemy.x + Math.cos(a) * 45, enemy.y + Math.sin(a) * 45);
          ctx.lineTo(enemy.x + Math.cos(a) * 110, enemy.y + Math.sin(a) * 110);
          ctx.stroke();
        }
      }
      if (enemy.kind === "leech" && enemy.windup > 0) {
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = "#97d8d4";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(enemy.x, enemy.y);
        ctx.lineTo(enemy.x + enemy.chargeX * 230, enemy.y + enemy.chargeY * 230);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      return;
    }
    const index = { hound: 0, mirror: 1, spore: 2, oracle: 3 }[enemy.kind];
    if (index === void 0) {
      drawSprite(enemy.kind === "collector" ? 7 : 6, enemy.x, enemy.y, enemy.kind === "warden" ? 142 : enemy.kind === "archon" ? 72 : 60, enemy.x > p.x, enemy.flash > 0);
      return;
    }
    const image = images.enemies;
    if (!image.complete || !image.naturalWidth) return;
    const sw = image.naturalWidth / 2, sh = image.naturalHeight / 2, size = enemy.kind === "oracle" ? 91 : enemy.kind === "mirror" ? 86 : 77;
    ctx.save();
    ctx.translate(enemy.x, enemy.y + (reducedMotion ? 0 : Math.sin(time * 3 + enemy.id) * 1.5));
    if (enemy.x > p.x) ctx.scale(-1, 1);
    if (enemy.flash > 0 && settings.flashes > 0 && !reducedMotion) ctx.filter = "brightness(" + (1 + 0.65 * settings.flashes) + ")";
    ctx.drawImage(image, index % 2 * sw, Math.floor(index / 2) * sh, sw, sh, -size / 2, -size / 2, size, size);
    ctx.restore();
    if (enemy.shield > 0) circle2(enemy.x, enemy.y, 29, "#b5a7de12", "#cbb9ef", 2);
    if (enemy.windup > 0) {
      ctx.setLineDash([7, 5]);
      ctx.strokeStyle = "#e6a090";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(enemy.x, enemy.y);
      ctx.lineTo(enemy.x + enemy.chargeX * 165, enemy.y + enemy.chargeY * 165);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  function drawProp(index, x, y, size) {
    const image = images.props;
    if (!image.complete || !image.naturalWidth) return;
    const sw = image.naturalWidth / 3, sh = image.naturalHeight / 2;
    ctx.drawImage(image, index % 3 * sw, Math.floor(index / 3) * sh, sw, sh, x - size / 2, y - size / 2, size, size);
  }
  function guestVisualPlayer() {
    if (online.role !== "guest" || !run.partner || paused || remotePaused || onlineWaiting || run.phase !== "playing" || document.querySelector("dialog[open]") || !inputFocused || document.hidden) return run.partner;
    const age = Date.now() - snapshotAt + (roomPresence?.hostAgeMs ?? 0);
    return age > 6500 || [run.player, run.partner].some((a) => a.hp <= 0) && heldInteract() ? run.partner : predictInputMovement(run, run.partner, run.partnerForm, online.history.frames);
  }
  function drawPlayerLabel(actor, form, partner) {
    if (!online.active) return;
    const you = partner === (online.role === "guest");
    ctx.textAlign = "center";
    ctx.font = "600 10px sans-serif";
    ctx.fillStyle = partner ? "#b4e9ed" : "#f2da9f";
    const x = Math.max(105, Math.min(WIDTH - 105, actor.x)), y = Math.max(62, actor.y - 51) + (partner && run?.partner && Math.hypot(run.player.x - run.partner.x, run.player.y - run.partner.y) < 220 ? 28 : 0);
    ctx.fillText(roomPlayerName(partner) + " \xB7 PLAYER " + (partner ? "2" : "1") + " \xB7 " + FORMS[form].name, x, y, 260);
    ctx.font = "9px sans-serif";
    ctx.fillText(you ? "YOU \xB7 " + (ownConnectionStatus() + " \xB7 " + ownActivity()).toUpperCase() : partnerStatus().toUpperCase(), x, y + 13, 260);
  }
  function draw() {
    if (!ctx) return;
    const now = performance.now(), dt = Math.min(0.05, (now - drawStamp) / 1e3 || 1 / 60);
    drawStamp = now;
    const s = run ? { ...run, player: run.partner && [run.player, run.partner].some((a) => a.hp <= 0) ? run.player : smoothEntity("player:" + run.room, run.player, dt), partner: run.partner ? [run.player, run.partner].some((a) => a.hp <= 0) && heldInteract() ? run.partner : smoothEntity("partner:" + run.room, guestVisualPlayer(), dt, online.role === "guest") : null, enemies: run.enemies.map((e2) => smoothEntity("enemy:" + e2.id + ":" + run.room, e2, dt)) } : null, p = s?.player ?? { x: WIDTH / 2, y: HEIGHT / 2 }, focus = online.role === "guest" && s?.partner ? s.partner : p, room2 = ROOMS[s?.room ?? "threshold"], aspect = viewport.w / viewport.h, viewWidth = Math.min(WIDTH, HEIGHT * aspect), scale = Math.min(viewport.w / viewWidth, viewport.h / HEIGHT), offsetX = (viewport.w - viewWidth * scale) / 2, offsetY = (viewport.h - HEIGHT * scale) / 2;
    camera = { w: viewWidth, x: Math.max(0, Math.min(WIDTH - viewWidth, focus.x - viewWidth / 2)), scale };
    combatFeedback();
    const shake = !reducedMotion && settings.shake > 0 && now < shakeUntil ? shakeStrength * settings.shake * (shakeUntil - now) / 180 : 0;
    ctx.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
    ctx.fillStyle = "#0d1917";
    ctx.fillRect(0, 0, viewport.w, viewport.h);
    ctx.save();
    ctx.translate(offsetX + Math.sin(now * 0.091) * shake, offsetY + Math.cos(now * 0.073) * shake);
    ctx.scale(scale, scale);
    ctx.translate(-camera.x, 0);
    const world = WORLDS[room2.world];
    if (world.floor !== void 0 && images.worldFloors.complete && images.worldFloors.naturalWidth) {
      const sw = images.worldFloors.naturalWidth / 3, sh = images.worldFloors.naturalHeight / 2;
      ctx.drawImage(images.worldFloors, world.floor % 3 * sw, Math.floor(world.floor / 3) * sh, sw, sh, 0, 0, WIDTH, HEIGHT);
    }
    if (room2.floor !== void 0 && images.castleFloors.complete && images.castleFloors.naturalWidth) {
      const sw = images.castleFloors.naturalWidth / 3, sh = images.castleFloors.naturalHeight / 2;
      ctx.drawImage(images.castleFloors, room2.floor % 3 * sw, Math.floor(room2.floor / 3) * sh, sw, sh, 0, 0, WIDTH, HEIGHT);
    }
    const expansionFloor = { conduit: 0, cistern: 1, forge: 2 }[s?.room];
    if (expansionFloor !== void 0 && images.newFloors.complete && images.newFloors.naturalWidth) {
      const sw = images.newFloors.naturalWidth / 3;
      ctx.drawImage(images.newFloors, expansionFloor * sw, 0, sw, images.newFloors.naturalHeight, 0, 0, WIDTH, HEIGHT);
    }
    const floorIndex = { machine: 0, quiet: 0, roots: 1, wild: 1, basalt: 2, foundry: 2, eye: 2 }[s?.room];
    if (floorIndex !== void 0 && images.floors.complete && images.floors.naturalWidth) {
      const sw = images.floors.naturalWidth / 3;
      ctx.drawImage(images.floors, floorIndex * sw, 0, sw, images.floors.naturalHeight, 0, 0, WIDTH, HEIGHT);
    } else if (world.floor === void 0 && room2.floor === void 0 && expansionFloor === void 0 && images.floor.complete && images.floor.naturalWidth) ctx.drawImage(images.floor, 0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = room2.boss ? "#260d1133" : "#08151025";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.strokeStyle = room2.theme + "55";
    ctx.lineWidth = 2;
    ctx.strokeRect(33, 33, WIDTH - 66, HEIGHT - 66);
    for (const box of obstacles(s?.room ?? "threshold", s)) {
      ctx.fillStyle = "#07100ec9";
      ctx.fillRect(box.x - 3, box.y + 5, box.w + 8, box.h + 9);
      ctx.fillStyle = "#283830";
      ctx.fillRect(box.x, box.y, box.w, box.h);
      ctx.strokeStyle = "#77816a";
      ctx.lineWidth = 1;
      ctx.strokeRect(box.x + 4, box.y + 4, box.w - 8, box.h - 8);
    }
    if (s) {
      if (clearVisual.room !== s.room) {
        clearVisual = { room: s.room, cleared: s.cleared.includes(s.room), at: 0 };
      } else if (!clearVisual.cleared && s.cleared.includes(s.room)) {
        clearVisual.cleared = true;
        clearVisual.at = now;
        audio.effect("swarm");
      }
    }
    for (const [dir, exit] of Object.entries(s?.dungeon || s?.rematch ? {} : room2.exits)) {
      const at = exitPosition(dir), status = s ? gateStatus(s, dir) : { available: false };
      if (s) drawSeal(ctx, s, room2, dir, exit, status, at, { retract: clearVisual.at ? Math.min(1, (now - clearVisual.at) / 350) : 1 });
    }
    if (s) {
      if (s.room === "nursery") {
        circle2(480, 300, 48, "#83d6dd13", s.abilities.includes("morph") ? "#a1d6d5" : "#576961", 1.5);
        drawProp(3, 480, 300, 122);
      }
      const relicItem = pendingRelic(s);
      if (relicItem) {
        const relic = ROUTE_RELICS[relicItem.relic];
        const near = Math.hypot(focus.x - relicItem.x, focus.y - relicItem.y) < 140, pulse = near && !reducedMotion ? Math.sin(now * 7e-3) * 5 : 0;
        circle2(relicItem.x, relicItem.y, relicContact(relicItem) + pulse, relic.color + (near ? "30" : "15"), relic.color, near ? 3 : 1.5);
        circle2(relicItem.x, relicItem.y, 31, relic.color + "1a", relic.color, 2);
        ctx.strokeStyle = relic.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(relicItem.x, relicItem.y - 18);
        ctx.lineTo(relicItem.x + 14, relicItem.y);
        ctx.lineTo(relicItem.x, relicItem.y + 18);
        ctx.lineTo(relicItem.x - 14, relicItem.y);
        ctx.closePath();
        ctx.stroke();
        ctx.font = "600 13px sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = relic.color;
        ctx.fillText(relic.name + " \xB7 walk here", relicItem.x, relicItem.y + 52);
      }
      const secretItem = pendingSecret(s);
      if (secretItem) {
        circle2(secretItem.x, secretItem.y, 23, "#d5c27c18", "#d5c27c", 1.5);
        ctx.fillStyle = "#e7c885";
        ctx.font = "bold 24px serif";
        ctx.textAlign = "center";
        ctx.fillText("?", secretItem.x, secretItem.y + 8);
        ctx.font = "12px sans-serif";
        ctx.fillText(hint("interact") + " \xB7 investigate", secretItem.x, secretItem.y + 42);
      }
      const keyItem = pendingKey(s);
      if (keyItem) {
        const key = KEYS[keyItem.key];
        circle2(keyItem.x, keyItem.y, 30, key.color + "1a", key.color, 1.5);
        drawProp(key.sprite, keyItem.x, keyItem.y, 61);
        ctx.font = "600 13px sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = key.color;
        ctx.fillText(key.name + " \xB7 walk here", keyItem.x, keyItem.y + 50);
      }
      if (world.floor !== void 0) {
        const t = reducedMotion ? 0 : s.time;
        ctx.globalAlpha = 0.22;
        for (let i = 0; i < 9; i++) {
          const x = 85 + i * 109 % 800, y = 80 + i * 73 % 430;
          if (world.rank === 1) circle2(x, y, 18 + Math.sin(t + i) * 4, null, world.color, 1);
          else if (world.rank === 3) circle2(x, y, 2, world.color);
          else if (world.rank >= 4) circle2(x, y, 2 + Math.sin(t + i) * 0.6, world.color);
        }
        ctx.globalAlpha = 1;
      }
      for (const mark of s.marks) {
        const percent = 1 - mark.timer / mark.life;
        circle2(mark.x, mark.y, mark.r, (mark.color ?? "#d96e5d") + "1c", mark.color ?? "#eb9b83", 2);
        circle2(mark.x, mark.y, mark.r * percent, null, "#f8c28a", 2);
      }
      for (const fragment of s.fragments) {
        circle2(fragment.x, fragment.y, 8, "#81e5d21a");
        ctx.save();
        ctx.translate(fragment.x, fragment.y);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = "#89d8d0";
        ctx.fillRect(-4, -4, 8, 8);
        ctx.restore();
      }
      for (const enemy of s.enemies) {
        ctx.fillStyle = "#0008";
        ctx.beginPath();
        ctx.ellipse(enemy.x, enemy.y + 18, enemy.r * 1.2, enemy.r * 0.48, 0, 0, Math.PI * 2);
        ctx.fill();
        drawEnemy(enemy, p, s.time);
        drawEnemyCore(ctx, enemy, { role: COMBAT_ROLES[enemy.kind] ?? enemy.kind, contactClose: Math.hypot(enemy.x - focus.x, enemy.y - focus.y) < enemy.r + (focus.r ?? 15) + 35, elite: ["warden", "cantor", "sentinel", "oracle", "mirror"].includes(enemy.kind) || !!WORLD_GUARDIANS[enemy.kind], time: s.time, flash: settings.flashes, reduced: reducedMotion });
      }
      for (const [role, actor] of [["player", p], ["partner", s.partner]]) if (actor && now < (muzzleUntil.get(role) ?? 0)) {
        circle2(actor.x, actor.y, 13, "#fff4c0bb");
        for (let i = 0; i < 6; i++) {
          const a = i * Math.PI / 3;
          ctx.strokeStyle = "#ffe2a0";
          ctx.beginPath();
          ctx.moveTo(actor.x + Math.cos(a) * 17, actor.y + Math.sin(a) * 17);
          ctx.lineTo(actor.x + Math.cos(a) * 25, actor.y + Math.sin(a) * 25);
          ctx.stroke();
        }
      }
      for (const shot of s.shots) {
        if (!reducedMotion) {
          ctx.strokeStyle = shot.color + (shot.enemy ? "77" : "bb");
          ctx.lineCap = "round";
          ctx.lineWidth = shot.enemy ? shot.r * 0.7 : 3;
          ctx.beginPath();
          ctx.moveTo(shot.x - shot.vx * (shot.enemy ? 0.035 : 0.065), shot.y - shot.vy * (shot.enemy ? 0.035 : 0.065));
          ctx.lineTo(shot.x, shot.y);
          ctx.stroke();
        }
        circle2(shot.x, shot.y, shot.r + 5, shot.color + "2a");
        circle2(shot.x, shot.y, shot.r, shot.color);
        if (!shot.enemy) circle2(shot.x, shot.y, 2, "#fff7d0");
      }
      for (const fx of s.effects) {
        if (fx.type === "hit") {
          for (let i = 0; i < 5; i++) {
            const a = i * Math.PI * 2 / 5;
            ctx.strokeStyle = fx.color;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(fx.x + Math.cos(a) * 6, fx.y + Math.sin(a) * 6);
            ctx.lineTo(fx.x + Math.cos(a) * 17, fx.y + Math.sin(a) * 17);
            ctx.stroke();
          }
        }
        if (fx.type === "burst" && !seenEffects.has(fx.id) && !reducedMotion) {
          seenEffects.add(fx.id);
          for (let i = 0; i < 10 && particles.length < 200; i++) {
            const a = i * Math.PI / 5;
            particles.push({ x: fx.x, y: fx.y, vx: Math.cos(a) * (50 + i * 9), vy: Math.sin(a) * (50 + i * 9), life: 0.48, color: fx.color });
          }
        }
        const progress2 = 1 - fx.life / fx.maxLife;
        ctx.globalAlpha = (1 - progress2) * 0.8;
        if (fx.type === "damage" && !settings.damageNumbers) {
          ctx.globalAlpha = 1;
          continue;
        }
        if (fx.type === "damage") {
          ctx.globalAlpha = Math.max(0.35, 1 - progress2);
          const y = fx.y - (reducedMotion ? 0 : progress2 * 30);
          ctx.font = "700 19px sans-serif";
          ctx.textAlign = "center";
          ctx.lineWidth = 4;
          ctx.strokeStyle = "#17231b";
          ctx.strokeText("\u2212" + fx.value, fx.x, y);
          ctx.fillStyle = fx.color;
          ctx.fillText("\u2212" + fx.value, fx.x, y);
        } else if (fx.type === "slash") {
          ctx.beginPath();
          ctx.arc(fx.x, fx.y, fx.r * (0.7 + progress2 * 0.3), Math.atan2(p.facingY, p.facingX) - 1.1, Math.atan2(p.facingY, p.facingX) + 1.1);
          ctx.strokeStyle = fx.color;
          ctx.lineWidth = 5;
          ctx.stroke();
        } else circle2(fx.x, fx.y, fx.r * (0.4 + progress2 * 0.6), null, fx.color, fx.type === "hit" ? 3 : 2);
        ctx.globalAlpha = 1;
      }
      for (let i = 0; i < s.boons.orbit; i++) {
        const angle = s.time * 2.9 + i * Math.PI * 2 / s.boons.orbit, ox = p.x + Math.cos(angle) * 68, oy = p.y + Math.sin(angle) * 68;
        circle2(ox, oy, 11, "#f0ca7833");
        drawSprite(0, ox, oy, 31);
      }
      if (p.guardTime > 0) circle2(p.x, p.y, 31, null, "#cdd4b5", 2);
      if (p.overclockTime > 0) circle2(p.x, p.y, 28, null, "#88d9e6", 2);
      if ((p.hurtFlash ?? 0) > 0) circle2(p.x, p.y, 34, "#ec977426", "#ffb191", 3);
      if (hasAlcove(keepsakes, "gold-trail") && p.dashTime > 0) {
        ctx.strokeStyle = "#ffda76aa";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(p.x - p.dashX * 85, p.y - p.dashY * 85);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
      drawVessel(ctx, images.sprites, s.form, p, s.time, { ...settings, reduced: reducedMotion }, { color: "#efcd79", size: 86 });
      if (s.partner) {
        const ally = s.partner;
        if (ally.guardTime > 0) circle2(ally.x, ally.y, 31, null, "#cdd4b5", 2);
        if (ally.overclockTime > 0) circle2(ally.x, ally.y, 28, null, "#88d9e6", 2);
        if ((ally.hurtFlash ?? 0) > 0) circle2(ally.x, ally.y, 34, "#ec977426", "#ffb191", 3);
        drawVessel(ctx, images.sprites, s.partnerForm, ally, s.time, { ...settings, reduced: reducedMotion }, { color: "#a2dfe3", size: 86, alpha: ally.hp <= 0 ? 0.38 : 1 });
        ctx.textAlign = "center";
        ctx.font = "10px sans-serif";
        ctx.fillStyle = "#aed8dc";
        for (let i = 0; i < s.boons.orbit; i++) {
          const angle = s.time * 2.9 + i * Math.PI * 2 / s.boons.orbit;
          drawSprite(0, ally.x + Math.cos(angle) * 68, ally.y + Math.sin(angle) * 68, 31);
        }
      }
      drawPlayerLabel(p, s.form, false);
      if (s.partner) drawPlayerLabel(s.partner, s.partnerForm, true);
      for (const a of [s.player, s.partner].filter((a2) => a2 && a2.hp <= 0)) {
        circle2(a.x, a.y, REVIVE_RADIUS, "#f2d4920b", "#f2d49288", 2);
        circle2(a.x, a.y, 24, null, "#f2d492", 2);
        circle2(a.x, a.y, 9, "#f2d492");
        const progress2 = Math.min(1, (a.revive ?? 0) / REVIVE_SECONDS);
        if (progress2) {
          ctx.strokeStyle = "#aeefc5";
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.arc(a.x, a.y, 34, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress2);
          ctx.stroke();
        }
        ctx.fillStyle = "#ead6a5";
        ctx.textAlign = "center";
        ctx.font = "10px sans-serif";
        ctx.fillText((progress2 ? "REKINDLING \xB7 " + Math.round(progress2 * 100) + "%" : "Hold " + (touchDevice ? "GATE" : hint("interact")) + " in the circle") + " \xB7 " + Math.ceil(a.downedFor ?? 30) + "s", a.x, a.y - 40);
      }
      for (let i = damageTexts.length - 1; i >= 0; i--) {
        const text = damageTexts[i];
        if (now > text.until) {
          damageTexts.splice(i, 1);
          continue;
        }
        if (settings.damageNumbers) {
          ctx.fillStyle = "#ffe3a6";
          ctx.textAlign = "center";
          ctx.font = "600 14px sans-serif";
          ctx.fillText(String(text.amount), text.x, text.y - 20 - (650 - (text.until - now)) * 0.035);
        }
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        const part = particles[i];
        part.life -= dt;
        if (part.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        part.x += part.vx * dt;
        part.y += part.vy * dt;
        ctx.globalAlpha = part.life / 0.48;
        circle2(part.x, part.y, 2, part.color);
        ctx.globalAlpha = 1;
      }
      if (seenEffects.size > 300) seenEffects.clear();
      if (visualPositions.size > 300) visualPositions.clear();
    } else {
      circle2(p.x, p.y, 42, "#ecc3790d");
      drawSprite(0, p.x, p.y, 104);
    }
    ctx.restore();
    ctx.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
    if (s && !menu) {
      if (keepsakeBanner && now < keepsakeBanner.until) {
        ctx.fillStyle = "#112c21ed";
        ctx.fillRect(Math.max(8, (viewport.w - 390) / 2), 126, Math.min(390, viewport.w - 16), 43);
        ctx.fillStyle = "#ecd08d";
        ctx.font = "600 13px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(keepsakeBanner.title, viewport.w / 2, 143, viewport.w - 32);
        ctx.fillStyle = "#c3d6bd";
        ctx.font = "10px sans-serif";
        ctx.fillText(keepsakeBanner.text, viewport.w / 2, 159, viewport.w - 32);
      }
      if (s.banner?.remaining > 0) {
        ctx.fillStyle = "#081711e8";
        ctx.fillRect(Math.max(8, (viewport.w - 420) / 2), 72, Math.min(420, viewport.w - 16), 48);
        ctx.fillStyle = s.banner.color;
        ctx.font = "600 15px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(s.banner.title, viewport.w / 2, 91, viewport.w - 28);
        ctx.fillStyle = "#d1dacb";
        ctx.font = "10px sans-serif";
        ctx.fillText(s.banner.text, viewport.w / 2, 108, viewport.w - 28);
      }
      const view = vessel(), hudPlayer = view.player ?? p, power = powerProfile(s, view.form);
      drawDescentHud(ctx, { w: viewport.w, run: s, player: hudPlayer, room: room2, title: s.dungeon ? "FLOOR " + s.dungeon.floor + " \xB7 " + dungeonArenaName(s) : s.rematch ? $("room-title").textContent : room2.name, profile: settings.inputProfile, bindings: settings.bindings, dashMax: dashCooldown(s, view.form), powerMax: power.cooldown, clearPulse: clearVisual.at ? Math.max(0, 1 - (now - clearVisual.at) / 350) : 0 });
      const gate = s.dungeon || s.rematch ? null : nearestGate(s, online.role === "guest" && s.partner ? s.partner : s.player);
      if (gate && gate.distance < 155 && s.phase === "playing") {
        const text = gatePromptText(gate);
        ctx.font = "12px sans-serif";
        const arena = { x: offsetX, y: offsetY, w: viewWidth * scale, h: HEIGHT * scale }, maxWidth = Math.max(80, Math.min(256, arena.w - 48)), words = text.split(" "), lines = [];
        let line = "";
        for (const word of words) {
          const candidate = line ? line + " " + word : word;
          if (ctx.measureText(candidate).width > maxWidth && line) {
            lines.push(line);
            line = word;
          } else line = candidate;
        }
        if (line) lines.push(line);
        const shown = lines.slice(0, 4), tw = Math.min(arena.w - 24, Math.max(...shown.map((line2) => ctx.measureText(line2).width)) + 24), height = shown.length * 16 + 12, box = gatePromptBox(gate.direction, arena, tw, height, { mobile: touchDevice }), x = box.x, y = box.y;
        ctx.fillStyle = "#0b1c13df";
        ctx.fillRect(x, y, tw, height);
        ctx.fillStyle = gate.available ? "#e6c88f" : "#b4c5b5";
        ctx.textAlign = "center";
        shown.forEach((line2, i) => ctx.fillText(line2, x + tw / 2, y + 19 + i * 16));
        if (settings.inputProfile === "controller" && gate.available) {
          ctx.strokeStyle = "#e6c88f";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x + 10, y + height / 2, 6, 0, Math.PI * 2);
          ctx.stroke();
          ctx.font = "8px sans-serif";
          ctx.fillText("B", x + 10, y + height / 2 + 3);
        }
      }
      if ((hudPlayer.hurtFlash ?? 0) > 0) {
        ctx.strokeStyle = "#f6a282";
        ctx.lineWidth = 5;
        ctx.strokeRect(3, 3, viewport.w - 6, viewport.h - 6);
        if (!reducedMotion && settings.flashes > 0) {
          ctx.globalAlpha = settings.flashes;
          ctx.fillStyle = "#d5776028";
          ctx.fillRect(0, 0, viewport.w, viewport.h);
          ctx.globalAlpha = 1;
        }
      }
    }
  }
  var previous = 0;
  var accumulator = 0;
  var hudClock = 0;
  var saveClock = 0;
  function animate(now) {
    if (feedbackUntil && now >= feedbackUntil) {
      $("play-feedback").hidden = true;
      feedbackUntil = 0;
    }
    const elapsed = Math.max(0, Math.min(5, (now - previous) / 1e3 || 0));
    previous = now;
    accumulator += elapsed;
    if (entryMode === "vault") {
      pollController();
      accumulator = 0;
      requestAnimationFrame(animate);
      return;
    }
    if (entryMode === "table") {
      pollController();
      if (tableSession && !document.querySelector("dialog[open]") && !document.hidden) {
        if (tickTable(tableSession, elapsed)) {
          finishTable();
          renderTable();
        }
        const clock2 = $("table-root").querySelector("[data-table-clock]");
        if (clock2) clock2.textContent = tableClock();
        tableSaveClock += elapsed;
        if (tableSaveClock > 2) {
          saveTable();
          tableSaveClock = 0;
        }
      }
      accumulator = 0;
      requestAnimationFrame(animate);
      return;
    }
    if (entryMode === "sideways") {
      if (document.querySelector("dialog[open]")) pollController();
      side.tick(elapsed);
      accumulator = 0;
      requestAnimationFrame(animate);
      return;
    }
    if (entryMode === "duel") {
      duel.tick(elapsed);
      accumulator = 0;
      requestAnimationFrame(animate);
      return;
    }
    if (entryMode === "start") {
      pollController();
      accumulator = 0;
      requestAnimationFrame(animate);
      return;
    }
    pollController();
    const limit = (n) => Math.max(-1, Math.min(1, n)), inputX = limit((keys.has(settings.bindings.right) || keys.has("arrowright") ? 1 : 0) - (keys.has(settings.bindings.left) || keys.has("arrowleft") ? 1 : 0) + stick.x + (settings.inputProfile === "controller" ? controller.x ?? 0 : 0)), inputY = limit((keys.has(settings.bindings.down) || keys.has("arrowdown") ? 1 : 0) - (keys.has(settings.bindings.up) || keys.has("arrowup") ? 1 : 0) + stick.y + (settings.inputProfile === "controller" ? controller.y ?? 0 : 0));
    if (run?.phase === "playing" && !paused && !document.querySelector("dialog[open]")) {
      dashRequested = dashRequested || !!controller.dash;
      powerRequested = powerRequested || !!controller.power;
    }
    if (online.role === "guest") {
      const accepting = inputFocused && !document.hidden && !paused && !remotePaused && !onlineWaiting && run?.phase === "playing" && !document.querySelector("dialog[open]");
      ownMovement = { x: accepting ? inputX : 0, y: accepting ? inputY : 0 };
      online.input({ x: ownMovement.x, y: ownMovement.y, dash: accepting && dashRequested, fire: accepting && (fireHeld || keys.has(settings.bindings.fire) || controller.fire), fireMode: settings.fireMode, fallAck: run?.fallSerial ?? 0, power: accepting && powerRequested, interact: accepting && (keys.has(settings.bindings.interact) || interactRequested || interactHeld || controller.interact), active: accepting });
      if (accepting) {
        guestAccumulator += elapsed;
        while (guestAccumulator + 1e-9 >= 1 / 60) {
          online.capture(movementContext(run));
          guestAccumulator -= 1 / 60;
        }
      } else guestAccumulator = 0;
      dashRequested = false;
      powerRequested = false;
      interactRequested = false;
    }
    if (online.role !== "guest" && !onlineWaiting && !networkProblem && (!online.active || Date.now() - online.lastSuccess < 6500) && run && !paused && !menu && run.phase === "playing" && !document.querySelector("dialog[open]") && !imageFailure) {
      const oldPhase = run.phase, oldRoom = run.room;
      rescueWaiting = !!rescueNeedsRelay();
      let steps = 0;
      while (accumulator + 1e-9 >= 1 / 60 && run.phase === "playing" && !rescueWaiting && steps++ < 120) {
        const hx = run.player.x, hy = run.player.y;
        const px = run.partner?.x, py = run.partner?.y;
        stepRun(run, { x: inputX, y: inputY, fire: fireHeld || keys.has(settings.bindings.fire) || controller.fire, fireMode: settings.fireMode, dash: dashRequested, power: powerRequested, interact: interactRequested || keys.has(settings.bindings.interact) || interactHeld || controller.interact, partner: online.active ? livePartnerInput() : void 0 }, 1 / 60);
        if (Math.hypot(run.player.x - hx, run.player.y - hy) > 0.1) selfMovedAt = Date.now();
        if (run.partner && Math.hypot(run.partner.x - px, run.partner.y - py) > 0.1) peerMovedAt = Date.now();
        remotePulse.dash = false;
        remotePulse.power = false;
        remotePulse.morph = null;
        dashRequested = false;
        powerRequested = false;
        interactRequested = false;
        accumulator -= 1 / 60;
        rescueWaiting = !!rescueNeedsRelay();
      }
      if (rescueWaiting) accumulator = 0;
      if (run.phase !== oldPhase || run.room !== oldRoom) {
        playback.discard();
        finish();
        save();
        renderOverlay();
        renderRail();
        if (run.phase === "boon") announce("A memory takes shape. Choose a gift.");
        if (run.phase === "resolve") announce(run.dungeon ? "Floor " + run.dungeon.floor + " cleared. The checkpoint is ready." : (run.clearNotice ?? "Chamber cleared.") + " Choose what to leave behind.");
        if (run.phase === "milestone") announce("The Eye opens. Continue the journey or complete this descent.");
      }
    } else accumulator = 0;
    rescueWaiting = online.role === "host" ? !!rescueNeedsRelay() : online.role === "guest" && !!roomPresence?.rescueWaiting;
    online.pump();
    draw();
    hudClock += elapsed;
    saveClock += elapsed;
    if (hudClock > 0.15) {
      renderRail();
      hudClock = 0;
    }
    if (saveClock > 2) {
      if (run) save();
      saveClock = 0;
    }
    requestAnimationFrame(animate);
  }
  function control(input) {
    requireDescent();
    if (online.active) throw Error("Scripted multi-frame control is available in solo play. Use live controls in co-op.");
    if (!run || menu || paused || remotePaused || onlineWaiting || run.phase !== "playing" || document.querySelector("dialog[open]")) throw new Error("The descent is not accepting movement right now.");
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Expected movement input.");
    const frames = input.frames ?? 1;
    if (!Number.isInteger(frames) || frames < 1 || frames > 240 || !Number.isFinite(input.x ?? 0) || !Number.isFinite(input.y ?? 0)) throw new Error("Use finite x/y movement and 1\u2013240 frames.");
    for (let i = 0; i < frames && run.phase === "playing"; i++) stepRun(run, { x: input.x ?? 0, y: input.y ?? 0, fire: !!input.fire, fireMode: settings.fireMode, dash: i === 0 && !!input.dash, power: i === 0 && !!input.power, interact: i === 0 && !!input.interact }, 1 / 60);
    changed();
    draw();
    return observeRun(run, meta);
  }
  window.SparkDescent = { version: "0.13.0", selectProfile: chooseProfile, enter: enterDescent, observe: () => structuredClone({ ...observeRun(run, meta), rememberedTraining: prepareTraining(meta.training), entryMode, paused: paused || remotePaused || onlineWaiting, mode: entryMode, dungeon: run?.dungeon ?? null, inputProfile: settings.inputProfile, coins: keepsakes.coins, cards: [...keepsakes.cards], coop: observeCoop() }), setFireMode, swarmPact: setSwarmPact, start, control, power: () => {
    act("power");
    return observeRun(run, meta);
  }, travel: (world) => {
    act("travel", { world });
    return observeRun(run, meta);
  }, morph: (form) => {
    act("morph", { form });
    return observeRun(run, meta);
  }, chooseGift: (id) => {
    act("boon", { gift: id });
    return observeRun(run, meta);
  }, resolve: (choice) => {
    act("resolve", { index: choice });
    return observeRun(run, meta);
  }, milestone: (decision) => {
    act("milestone", { decision });
    return observeRun(run, meta);
  }, daily: () => {
    act("daily-start");
    return observeRun(run, meta);
  }, learn: (form, skill) => {
    act("learn-skill", { form, skill });
    return window.SparkDescent.observe();
  } };
  function registerTools() {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const object = (input) => {
      if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Expected an object.");
    };
    const defs = [
      { name: "refight_spark_guardian", title: "Refight a guardian echo", description: "Start an isolated practice rematch of an encountered guardian. Uses a fixed practice build per world; keeps the campaign and grants no rewards.", inputSchema: { type: "object", properties: { room: { type: "string", enum: Object.keys(ROOMS).filter((id) => ROOMS[id].boss || ROOMS[id].miniboss) } }, required: ["room"], additionalProperties: false }, execute: (input) => {
        object(input);
        if (Object.keys(input).length !== 1 || typeof input.room !== "string") throw Error("Choose one encountered guardian.");
        return enterBossRematch(input.room);
      } },
      { name: "return_from_guardian_echo", title: "Return from a rematch", description: "Restore the campaign and any waiting choice exactly as they were before practice.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, execute: (input) => {
        object(input);
        if (Object.keys(input).length) throw Error("Expected an empty object.");
        returnFromRematch();
        return window.SparkDescent.observe();
      } },
      { name: "choose_spark_input", title: "Choose an input profile", description: "Choose PC, Controller, or Mobile before entering a descent or duel. Persists device controls and updates all prompts.", inputSchema: { type: "object", properties: { profile: { type: "string", enum: INPUT_PROFILES } }, required: ["profile"], additionalProperties: false }, execute: (input) => {
        object(input);
        if (Object.keys(input).length !== 1 || !INPUT_PROFILES.includes(input.profile)) throw Error("Choose one input profile.");
        chooseProfile(input.profile);
        return window.SparkDescent.observe();
      } },
      { name: "enter_spark_mode", title: "Confirm a game mode", description: "After choosing an input profile, confirm Descent, Continue, Daily, Host room, Join room, local Duel, Endless Dungeon, or Sideways descent. This does not start a campaign life.", inputSchema: { type: "object", properties: { mode: { type: "string", enum: ["descent", "continue", "daily", "host", "join", "duel", "dungeon", "sideways"] } }, required: ["mode"], additionalProperties: false }, execute: (input) => {
        object(input);
        if (Object.keys(input).length !== 1 || !["descent", "continue", "daily", "host", "join", "duel", "dungeon", "sideways"].includes(input.mode)) throw Error("Choose a known mode.");
        act("entry-" + input.mode);
        return window.SparkDescent.observe();
      } },
      { name: "observe_endless_dungeon", title: "Observe the endless dungeon", description: "Read floor, rung, condition, scaled enemy pressure, next floor, and separate device records.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: false }, execute: (input) => {
        object(input);
        if (Object.keys(input).length) throw Error("Expected an empty object.");
        return window.SparkDungeon.observe();
      } },
      { name: "advance_endless_dungeon", title: "Choose at a cleared dungeon checkpoint", description: "At a cleared floor, open waiting gifts or descend. Choose the resulting gift with choose_descent_gift before descending.", inputSchema: { type: "object", properties: { action: { type: "string", enum: ["gifts", "descend"] } }, required: ["action"], additionalProperties: false }, execute: (input) => {
        object(input);
        if (Object.keys(input).length !== 1 || !["gifts", "descend"].includes(input.action) || entryMode !== "dungeon") throw Error("Enter the dungeon and choose gifts or descend.");
        return input.action === "gifts" ? window.SparkDungeon.gifts() : window.SparkDungeon.next();
      } },
      { name: "resolve_descent_milestone", title: "Choose after the Warden", description: "At the Eye milestone, continue the seven-world campaign or finish the first descent and bank its rewards.", inputSchema: { type: "object", properties: { decision: { type: "string", enum: ["continue", "finish"] } }, required: ["decision"], additionalProperties: false }, execute: (input) => {
        object(input);
        if (Object.keys(input).length !== 1 || !["continue", "finish"].includes(input.decision)) throw Error("Choose continue or finish.");
        return window.SparkDescent.milestone(input.decision);
      } },
      { name: "begin_daily_descent", title: "Begin today\u2019s daily current", description: "Between lives, start the shared UTC daily seed as a baseline Spark. No permanent upgrades; results are recorded separately with no campaign rewards.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, execute: (input) => {
        object(input);
        if (Object.keys(input).length) throw Error("Expected an empty object.");
        return window.SparkDescent.daily();
      } },
      { name: "learn_descent_skill", title: "Learn a vessel skill", description: "Spend banked mastery between lives on a known vessel tree. Prerequisites and one-specialty limit apply; changes affect the next life.", inputSchema: { type: "object", properties: { form: { type: "string", enum: Object.keys(SKILL_TREES) }, skill: { type: "string" } }, required: ["form", "skill"], additionalProperties: false }, execute: (input) => {
        object(input);
        if (Object.keys(input).length !== 2 || !SKILL_TREES[input.form] || typeof input.skill !== "string") throw Error("Provide a known form and skill.");
        return window.SparkDescent.learn(input.form, input.skill);
      } },
      { name: "use_descent_power", title: "Use this vessel\u2019s power", description: "Activate the current body\u2019s distinct power once if its cooldown is ready. Requires an active living vessel.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, execute: (input) => {
        object(input);
        if (Object.keys(input).length) throw Error("Expected an empty object.");
        return window.SparkDescent.power();
      } },
      { name: "travel_descent_world", title: "Travel between unlocked worlds", description: "Travel to an unlocked world from a safe checkpoint or a defeated guardian. Seals open worlds; combat prevents travel.", inputSchema: { type: "object", properties: { world: { type: "string", enum: WORLD_ORDER } }, required: ["world"], additionalProperties: false }, execute: (input) => {
        object(input);
        if (Object.keys(input).length !== 1 || !Object.hasOwn(WORLDS, input.world)) throw Error("Expected one known world.");
        return window.SparkDescent.travel(input.world);
      } },
      { name: "morph_descent_vessel", title: "Change the current vessel", description: "After Vessel Resonance is learned in the Mirror Nursery, inhabit one of six bodies. Preserves health percentage and run bonuses; requires resonance cooldown to be ready.", inputSchema: { type: "object", properties: { form: { type: "string", enum: Object.keys(BODIES) } }, required: ["form"], additionalProperties: false }, execute: (input) => {
        object(input);
        if (Object.keys(input).length !== 1 || !Object.hasOwn(BODIES, input.form)) throw Error("Expected one known vessel.");
        return window.SparkDescent.morph(input.form);
      } },
      { name: "enter_sideways_descent", title: "Enter the side journey", description: "After choosing PC, Controller, or Mobile, begin or resume the separate side-scrolling Spark adventure. Does not change campaign keys, seals, or currency.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, execute: (input) => {
        object(input);
        if (Object.keys(input).length) throw Error("Expected an empty object.");
        enterSideways();
        side.action(side.journey ? "side-resume" : "side-new");
        return side.observe();
      } },
      { name: "observe_sideways_descent", title: "Observe the side path", description: "Read the side-view room, player, platforms, enemies, doors, keys, checkpoint, journal and pause state.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: false }, execute: (input) => {
        object(input);
        if (Object.keys(input).length) throw Error("Expected an empty object.");
        return side.observe();
      } },
      { name: "control_sideways_descent", title: "Move along the side path", description: "Apply the same platform inputs as a player: horizontal movement, jump, dash, held strike or heavy, power, gate, and Up or Down aim. Down plus Jump drops through a ledge. Requires an unpaused side journey.", inputSchema: { type: "object", properties: { x: { type: "number", minimum: -1, maximum: 1 }, jump: { type: "boolean" }, dash: { type: "boolean" }, attack: { type: "boolean" }, heavy: { type: "boolean" }, power: { type: "boolean" }, interact: { type: "boolean" }, up: { type: "boolean" }, down: { type: "boolean" }, frames: { type: "integer", minimum: 1, maximum: 600 } }, additionalProperties: false }, execute: (input) => {
        object(input);
        const { frames = 1, ...buttons } = input;
        return window.SparkSideways.control(buttons, frames);
      } },
      { name: "morph_sideways_vessel", title: "Borrow a side-view vessel", description: "After clearing the Mirror Nursery, change to one of the six remembered bodies in Sideways. Injury and power cooldown carry across the change.", inputSchema: { type: "object", properties: { form: { type: "string", enum: ["spark", "human", "computer", "animal", "tree", "rock"] } }, required: ["form"], additionalProperties: false }, execute: (input) => {
        object(input);
        if (Object.keys(input).length !== 1) throw Error("Provide one remembered vessel.");
        return window.SparkSideways.morph(input.form);
      } },
      { name: "observe_descent", title: "Observe the descent", description: "Read the active incarnation, enemies, fragments, gates and available choices without changing the game.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: false }, execute: (input) => {
        object(input);
        if (Object.keys(input).length) throw new Error("Expected an empty object.");
        return window.SparkDescent.observe();
      } },
      { name: "begin_descent", title: "Begin an action incarnation", description: "Start a run in a form offered by the karma current. Only available between runs.", inputSchema: { type: "object", properties: { form: { type: "string", enum: Object.keys(BODIES) } }, required: ["form"], additionalProperties: false }, execute: (input) => {
        object(input);
        if (Object.keys(input).length !== 1 || !BODIES[input.form]) throw new Error("Expected one known form.");
        return start(input.form);
      } },
      { name: "control_descent", title: "Move through the substrate", description: "Move for 1\u2013240 simulation frames with x/y direction. Optional dash or gate interaction occurs on the first frame. Fire follows Auto, Manual or Surge settings. Hold fire:true to repeat. Stops for choices or run end.", inputSchema: { type: "object", properties: { x: { type: "number", minimum: -1, maximum: 1 }, y: { type: "number", minimum: -1, maximum: 1 }, frames: { type: "integer", minimum: 1, maximum: 240 }, dash: { type: "boolean" }, power: { type: "boolean" }, interact: { type: "boolean" }, fire: { type: "boolean" } }, additionalProperties: false }, execute: (input) => {
        object(input);
        if (Object.keys(input).some((k) => !["x", "y", "frames", "dash", "power", "interact", "fire"].includes(k)) || input.x !== void 0 && Math.abs(input.x) > 1 || input.y !== void 0 && Math.abs(input.y) > 1 || ["dash", "power", "interact", "fire"].some((k) => input[k] !== void 0 && typeof input[k] !== "boolean")) throw new Error("Invalid control input.");
        return control(input);
      } },
      { name: "choose_descent_gift", title: "Choose a run gift", description: "Accept one of the three power upgrades currently offered at a level-up, then resume the run.", inputSchema: { type: "object", properties: { gift: { type: "string", enum: Object.keys(BOONS) } }, required: ["gift"], additionalProperties: false }, execute: (input) => {
        object(input);
        if (Object.keys(input).length !== 1 || !BOONS[input.gift]) throw new Error("Expected one known gift.");
        return window.SparkDescent.chooseGift(input.gift);
      } },
      { name: "resolve_descent_chamber", title: "Resolve a cleared chamber", description: "Commit the karma choice after a chamber clears: 0 liberates, 1 harvests, 2 listens. Changes health, karma and earned essence, then resumes exploration.", inputSchema: { type: "object", properties: { choice: { type: "integer", minimum: 0, maximum: 2 } }, required: ["choice"], additionalProperties: false }, execute: (input) => {
        object(input);
        if (Object.keys(input).length !== 1 || !Number.isInteger(input.choice) || input.choice < 0 || input.choice > 2) throw new Error("Expected choice 0, 1 or 2.");
        return window.SparkDescent.resolve(input.choice);
      } }
    ];
    for (const def of defs) try {
      Promise.resolve(context.registerTool({ ...def, annotations: def.annotations ?? { readOnlyHint: false, untrustedContentHint: false } }, { signal: lifecycle.signal })).catch(() => {
      });
    } catch {
    }
    window.addEventListener("pagehide", () => lifecycle.abort(), { once: true });
  }
  var duel = new DuelScreen({ document, window, storage: localStorage, image: images.duelFighters, art: { strikes: images.duelStrikes, kicks: images.duelKicks, stages: images.duelStages }, settings: () => settings, audio, onQuit: returnToStart, announce, keepsakes: () => keepsakes, onCardFound: (match, visit) => {
    const card = findSparkCard(keepsakes, match.forms.includes("cantor") ? "second-movement" : match.stage === "glass" ? "glass-oath" : "ivory-key", visit);
    persistKeepsakes();
    return card;
  }, onReward: (match, visit) => {
    rememberEncounter(keepsakes, { forms: [match.forms[0]] });
    const result = rewardDuel(keepsakes, match, visit);
    persistKeepsakes();
    return result;
  } });
  window.SparkDuel = { ladder: () => {
    enterDuel();
    duel.action("duel-ladder-start");
    return duel.observe();
  }, observe: () => duel.observe(), start: (options) => {
    enterDuel();
    if (options) Object.assign(duel.config, options);
    duel.renderSelect();
    duel.action("duel-start");
    return duel.observe();
  }, control: (inputs, frames) => {
    if (entryMode !== "duel") throw Error("Enter Duel first.");
    return duel.control(inputs, frames);
  }, ready: () => {
    duel.action("duel-ready");
    return duel.observe();
  } };
  var side = new SideScreen({ document, window, storage: localStorage, images, settings: () => settings, audio, onQuit: returnToStart, announce });
  window.SparkSideways = { version: "0.13.0", enter: () => {
    enterSideways();
    return side.observe();
  }, start: () => {
    enterSideways();
    if (side.journey) throw Error("A side journey is remembered. Resume it or choose New side journey in Pause.");
    side.action("side-new");
    return side.observe();
  }, resume: () => {
    if (entryMode !== "sideways") enterSideways();
    side.action("side-resume");
    return side.observe();
  }, observe: () => side.observe(), control: (input, frames) => {
    if (entryMode !== "sideways") throw Error("Enter Sideways descent first.");
    return side.control(input, frames);
  }, morph: (form) => {
    if (entryMode !== "sideways" || side.menu) throw Error("Resume the side journey first.");
    side.action("side-morph", { form });
    return side.observe();
  }, map: () => {
    if (entryMode !== "sideways") throw Error("Enter Sideways descent first.");
    side.action("side-map");
    return side.observe();
  }, rekindle: () => {
    if (entryMode !== "sideways") throw Error("Enter Sideways descent first.");
    side.action("side-rekindle");
    return side.observe();
  }, leave: () => {
    if (entryMode === "sideways") side.leave();
  } };
  window.SparkRematches = { list: () => structuredClone(rematchBosses(meta, entryMode === "rematch" ? campaignCache?.run : run)), start: enterBossRematch, control: (input) => {
    if (entryMode !== "rematch") throw Error("Enter a guardian echo first.");
    return control(input);
  }, return: returnFromRematch };
  window.SparkDungeon = { enter: () => {
    enterDungeon();
    return observeDungeon(run, dungeonState.record);
  }, start: (form) => {
    enterDungeon();
    start(form ?? "spark");
    return observeDungeon(run, dungeonState.record);
  }, observe: () => structuredClone(observeDungeon(entryMode === "dungeon" ? run : dungeonState.run, dungeonState.record)), control: (input) => {
    if (entryMode !== "dungeon") throw Error("Enter the dungeon first.");
    control(input);
    return window.SparkDungeon.observe();
  }, gifts: () => {
    act("dungeon-gifts");
    return window.SparkDungeon.observe();
  }, chooseGift: (id) => {
    act("boon", { gift: id });
    return window.SparkDungeon.observe();
  }, next: () => {
    act("dungeon-next");
    return window.SparkDungeon.observe();
  } };
  window.SparkVault = { observe: () => structuredClone({ coins: keepsakes.coins, alcoves: VAULT_ALCOVES.map((a) => vaultStatus(keepsakes, a.id)), cards: keepsakes.cards }), enter: enterVault, buy: (id) => {
    act("vault-buy", { alcove: id });
    return window.SparkVault.observe();
  } };
  window.SparkTable = { enter: () => {
    enterTable();
    return observeTable(tableSession);
  }, observe: () => observeTable(tableSession), start: () => {
    tableAction("table-start");
    return observeTable(tableSession);
  }, choose: (index) => {
    tableAction("table-response", { index });
    return observeTable(tableSession);
  }, next: () => {
    tableAction("table-next");
    return observeTable(tableSession);
  }, playCard: (card) => {
    tableAction("table-card", { card });
    return observeTable(tableSession);
  }, leave: returnToStart };
  window.SparkCards = { observe: () => structuredClone(keepsakes.cards.map((id) => ({ id, ...SPARK_CARDS[id] }))), open: () => act("binder") };
  renderSettings();
  renderStart();
  if (window.history && "scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
  if (menu) window.scrollTo?.({ top: 0, left: 0, behavior: "instant" });
  resize();
  renderRail();
  renderOverlay(true);
  registerTools();
  requestAnimationFrame(animate);
})();
