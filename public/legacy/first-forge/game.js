(() => {
  // equipment.js
  var EQUIPMENT = {
    wayfarer: { name: "Wayfarer Sigil", slot: "relic", sprite: 0, origin: "Starter relic", desc: "A broken star that remembers the road.", stats: (level) => ({ damage: 0.08 + level * 0.04 }) },
    bark: { name: "Bark Ward", slot: "ward", sprite: 1, origin: "Starter ward", desc: "A small shelter, carried between bodies.", stats: (level) => ({ health: 12 + level * 6 }) },
    prism: { name: "Prism Lens", slot: "relic", sprite: 2, origin: "Glass Causeway", desc: "The archive teaches light to travel farther.", stats: (level) => ({ damage: 0.06 + level * 0.03, range: 0.12 + level * 0.05 }) },
    fang: { name: "Fang Seal", slot: "relic", sprite: 3, origin: "The Wild Margin", desc: "A promise made to the nameless pack.", stats: (level) => ({ speed: 0.08 + level * 0.03, melee: 0.1 + level * 0.04 }) },
    bell: { name: "Memory Bell", slot: "relic", sprite: 4, origin: "Resonant Cistern", desc: "A remembered rhythm quickens your weapon.", stats: (level) => ({ haste: 0.12 + level * 0.04 }) },
    ash: { name: "Ash Cloak", slot: "ward", sprite: 5, origin: "The Echo Forge", desc: "The Cantor\u2019s last note softens the pattern.", stats: (level) => ({ dash: 0.12 + level * 0.04, armor: 0.05 + level * 0.02 }) }
  };
  function prepareEquipment(meta2) {
    const next = structuredClone(meta2);
    next.inventory = { wayfarer: 0, bark: 0, ...Object.fromEntries(Object.entries(meta2.inventory ?? {}).filter(([id, level]) => EQUIPMENT[id] && Number.isInteger(level) && level >= 0 && level <= 3)) };
    next.loadout = { relic: "wayfarer", ward: "bark", ...meta2.loadout };
    for (const slot of ["relic", "ward"]) if (!EQUIPMENT[next.loadout[slot]] || EQUIPMENT[next.loadout[slot]].slot !== slot || !(next.loadout[slot] in next.inventory)) next.loadout[slot] = slot === "relic" ? "wayfarer" : "bark";
    return next;
  }
  function gearStats(meta2) {
    const equipment = prepareEquipment(meta2), stats = { health: 0, damage: 0, range: 0, speed: 0, melee: 0, haste: 0, dash: 0, armor: 0 };
    for (const id of Object.values(equipment.loadout)) for (const [key, value] of Object.entries(EQUIPMENT[id].stats(equipment.inventory[id]))) stats[key] += value;
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
    return Object.entries(stats).map(([key, value]) => key === "health" ? `+${value} maximum health` : `+${Math.round(value * 100)}% ${labels[key]}`).join(" \xB7 ");
  }
  function validEquipment(meta2) {
    if (meta2.inventory === void 0 && meta2.loadout === void 0) return true;
    return !!meta2.inventory && !!meta2.loadout && Object.entries(meta2.inventory).every(([id, level]) => EQUIPMENT[id] && Number.isInteger(level) && level >= 0 && level <= 3) && ["relic", "ward"].every((slot) => EQUIPMENT[meta2.loadout[slot]]?.slot === slot && meta2.loadout[slot] in meta2.inventory);
  }

  // progress.js
  var ProgressSave = class {
    constructor({ fetch: transport = globalThis.window?.fetch?.bind(globalThis.window), storage = globalThis.localStorage, onStatus = () => {
    } } = {}) {
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
      this.status = status;
      this.onStatus(status);
    }
    async request(path, options = {}) {
      const response = await this.fetch("/api/progress" + path, { ...options, headers: { "content-type": "application/json", ...this.credential ? { authorization: "Bearer " + this.credential.token } : {}, ...options.headers } });
      const data = await response.json();
      if (!response.ok) {
        const error = Error(data.error ?? "Your save is waiting for a connection.");
        error.status = response.status;
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
          const credential = JSON.parse(this.storage?.getItem("spark-substrate-save-credential") ?? "null");
          if (credential && /^[a-f0-9-]{36}$/.test(credential.id) && typeof credential.token === "string") this.credential = credential;
        } catch {
        }
        const saved = this.credential ? await this.request("/" + this.credential.id) : await this.request("", { method: "POST", body: JSON.stringify({ state }) });
        if (!this.credential) {
          this.credential = { id: saved.id, token: saved.token };
          try {
            this.storage?.setItem("spark-substrate-save-credential", JSON.stringify(this.credential));
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
      if (!this.ready || this.writing || this.status === "conflict" || !this.fetch || !this.latest) return;
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      const sent = this.latest;
      this.writing = true;
      try {
        const saved = await this.request("/" + this.credential.id, { method: "PUT", body: JSON.stringify({ revision: this.revision, state: JSON.parse(sent) }) });
        this.revision = saved.revision;
        this.setStatus(this.latest === sent ? "saved" : "pending");
      } catch (error) {
        this.setStatus(error.status === 409 ? "conflict" : "error");
      } finally {
        this.writing = false;
        if ((this.latest !== sent || this.status === "error") && this.status !== "conflict") this.queueRetry();
      }
    }
    queueRetry() {
      if (!this.timer) this.timer = setTimeout(() => {
        this.timer = null;
        void this.flush();
      }, 4e3);
    }
  };

  // online.js
  var OnlineRoom = class {
    constructor(onUpdate, onError, options = {}) {
      this.fetcher = options.fetch ?? globalThis.fetch;
      this.onUpdate = onUpdate;
      this.onError = onError;
      this.session = null;
      this.seq = 0;
      this.timer = null;
      this.busy = false;
      this.source = null;
      this.pending = { x: 0, y: 0, dash: false, interact: false };
      this.lastInputSeq = 0;
      this.errors = 0;
      this.lastSuccess = 0;
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
    async request(path, value = {}, authorize = true) {
      const response = await this.fetcher("/api/rooms" + path, { method: "POST", headers: { "content-type": "application/json", ...authorize && this.session ? { authorization: "Bearer " + this.session.token } : {} }, body: JSON.stringify(value), signal: AbortSignal.timeout(6e3) });
      let data;
      try {
        data = await response.json();
      } catch {
        throw Error("The room service did not respond. Try again shortly.");
      }
      if (!response.ok) throw Error(data.error ?? "Unable to connect to the room.");
      return data;
    }
    remember() {
      try {
        sessionStorage.setItem("spark-online-room-v1", JSON.stringify(this.session));
      } catch {
      }
    }
    async host(run2) {
      const session = await this.request("", { run: run2 }, false);
      this.session = session;
      this.seq = 0;
      this.remember();
      this.start();
      return session;
    }
    async join(code, form) {
      const session = await this.request("/" + code + "/join", { form }, false);
      this.session = session;
      this.seq = 0;
      this.remember();
      this.start();
      return session;
    }
    async resume() {
      let session;
      try {
        session = JSON.parse(sessionStorage.getItem("spark-online-room-v1") ?? "null");
      } catch {
        return false;
      }
      if (!session?.code || !session.token || !["host", "guest"].includes(session.role)) return false;
      this.session = session;
      try {
        const data = await this.request("/" + session.code + "/resume");
        this.seq = session.role === "host" ? data.seq : data.inputSeq;
        this.lastSuccess = Date.now();
        this.onUpdate(data);
        this.start();
        return true;
      } catch (error) {
        this.session = null;
        try {
          sessionStorage.removeItem("spark-online-room-v1");
        } catch {
        }
        this.onError(error.message);
        return false;
      }
    }
    setSource(source) {
      this.source = source;
    }
    input(input) {
      this.pending = { x: input.x, y: input.y, dash: this.pending.dash || !!input.dash, interact: this.pending.interact || !!input.interact };
    }
    start() {
      this.stop();
      this.timer = setInterval(() => this.sync(), 100);
    }
    stop() {
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
    }
    async sync() {
      if (this.busy || !this.session) return;
      const source = this.source?.();
      if (this.role === "host" && !source?.run) return;
      this.busy = true;
      const session = this.session, sent = this.pending;
      this.pending = { ...sent, dash: false, interact: false };
      try {
        const payload = this.role === "host" ? { ...source, seq: ++this.seq } : { seq: ++this.seq, input: sent };
        const data = await this.request("/" + this.code + "/sync", payload);
        if (this.session !== session) return;
        this.errors = 0;
        this.lastSuccess = Date.now();
        this.onUpdate(data);
      } catch (error) {
        if (this.session !== session) return;
        this.errors++;
        if (this.errors === 1 || this.errors % 10 === 0) this.onError(error.message);
        if (this.role === "guest") this.pending.dash = this.pending.dash || sent.dash;
      } finally {
        this.busy = false;
      }
    }
    async leave() {
      const session = this.session;
      this.stop();
      if (session) {
        try {
          await this.request("/" + session.code + "/leave");
        } catch {
        }
      }
      this.session = null;
      try {
        sessionStorage.removeItem("spark-online-room-v1");
      } catch {
      }
      this.pending = { x: 0, y: 0, dash: false, interact: false };
      this.seq = 0;
      this.errors = 0;
    }
  };

  // story.js
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
    eye: { speaker: "The Demiurge \xB7 through the Warden", title: "A creator fears a witness", entry: "The Warden carries the Maker\u2019s last law: nothing created here may testify that the world could have been otherwise.", line: "I gave you every shape. Why do you keep choosing what I did not give you?" }
  };
  var ENEMY_LORE = { leech: { name: "Soul leech", desc: "Locks a pale tether before draining a nearby vessel. Leave its reach during the warning." }, moth: { name: "Ember moth", desc: "Stops near you and primes an amber blast. Leave the circle or break it before detonation." }, cantor: { name: "The Cantor", desc: "Guards the Echo Forge with slow rings of bolts and ground seals. Find the gaps between notes." }, collector: { name: "Collector", desc: "A scavenger that pursues the nearest living vessel. Keep moving." }, archon: { name: "Archon", desc: "A sentinel that keeps its distance and fires aimed bolts." }, hound: { name: "Glass hound", desc: "Stops to mark a red charge line, then lunges along it. Dodge sideways." }, mirror: { name: "Mirror sentinel", desc: "Its violet shield reduces damage while bright. Flank it during the dim interval." }, spore: { name: "Root spore", desc: "Marks the ground under a vessel. Leave the growing circle before it bursts." }, oracle: { name: "Bell oracle", desc: "Summons collectors while it remains alive. Break it before the room fills." }, warden: { name: "The Warden", desc: "Aimed volleys, ground seals, and an enraged radial pattern guard the Eye." } };
  function recordArrival(run2) {
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

  // engine.js
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

  // action-engine.js
  var WIDTH = 960;
  var HEIGHT = 600;
  var BODIES = {
    spark: { hp: 100, speed: 230, damage: 21, interval: 0.54, range: 620, sprite: 0, weapon: "Lumen bolts", ability: "phase", color: "#f7cb79", desc: "Light that seeks. Fast homing bolts; phase through crystal gates." },
    human: { hp: 135, speed: 218, damage: 35, interval: 0.56, range: 130, sprite: 1, weapon: "Spectral cleave", ability: null, color: "#e5b78b", desc: "A blade and a stubborn heart. Wide close-range cleaves; strong recovery." },
    computer: { hp: 105, speed: 216, damage: 15, interval: 0.72, range: 670, sprite: 2, weapon: "Prism volley", ability: "phase", color: "#86d8e5", desc: "Three-shot prism volleys. Read the grid and phase through crystal gates." },
    animal: { hp: 115, speed: 272, damage: 27, interval: 0.32, range: 100, sprite: 3, weapon: "Feral strikes", ability: "root", color: "#ddcc93", desc: "A wolf\u2019s speed and quick strikes. Follow hidden root passages." },
    tree: { hp: 125, speed: 185, damage: 29, interval: 1.08, range: 175, sprite: 4, weapon: "Root pulse", ability: "root", color: "#a5cfad", desc: "Living roots strike in a circle. Regenerate slowly and follow root passages." },
    rock: { hp: 165, speed: 172, damage: 45, interval: 1.12, range: 190, sprite: 5, weapon: "Fault wave", ability: "fracture", color: "#c6bcda", desc: "A heavy circular shockwave. Tough basalt armor; shatter stone gates." }
  };
  var ABILITIES = { phase: { name: "Prism phase", glyph: "\u25C8", desc: "Cross crystal barriers." }, root: { name: "Root passage", glyph: "\u2667", desc: "Open the living routes." }, fracture: { name: "Fault breaker", glyph: "\u25C7", desc: "Shatter basalt seals." }, eye: { name: "Eye sigil", glyph: "\u27C1", desc: "Enter the Demiurge\u2019s Eye." } };
  var ROOMS = {
    threshold: { name: "The Threshold", short: "Threshold", coord: [1, 2], theme: "#d5b679", safe: true, danger: 0, desc: "An unfinished place between lives. The northern gate opens into the Glass Causeway.", exits: { north: { to: "glass" }, east: { to: "roots", requires: "root" } } },
    glass: { name: "Glass Causeway", short: "Glass", coord: [1, 1], theme: "#8cc7c2", danger: 1, loot: "prism", desc: "The city\u2019s first defense. Break the swarm and follow the eastern gate to the Machine Sepulcher.", exits: { south: { to: "threshold" }, east: { to: "machine" }, west: { to: "wild", requires: "root" }, north: { to: "foundry", requires: "fracture" } } },
    machine: { name: "Machine Sepulcher", short: "Machine", coord: [2, 1], theme: "#76c3db", danger: 2, reward: "phase", desc: "A buried processor dreams of a different purpose. Clear it to remember Prism Phase.", exits: { west: { to: "glass" }, south: { to: "roots", requires: "phase" }, north: { to: "quiet", requires: "phase" }, east: { to: "cistern", requires: "root" } } },
    roots: { name: "Root Cathedral", short: "Roots", coord: [2, 2], theme: "#a5ccac", danger: 2, reward: "root", desc: "Living roots cross the walls. Clear this chamber to remember Root Passage, then return toward the Wild Margin.", exits: { north: { to: "machine" }, west: { to: "threshold", requires: "root" }, east: { to: "forge", requires: "fracture" } } },
    wild: { name: "The Wild Margin", short: "Wild", coord: [0, 1], theme: "#bbc490", danger: 3, loot: "fang", desc: "The things that escaped their assigned shape gather here. The basalt reach lies to the north.", exits: { east: { to: "glass" }, north: { to: "basalt" } } },
    basalt: { name: "Basalt Reach", short: "Basalt", coord: [0, 0], theme: "#b7a7cb", danger: 3, reward: "fracture", desc: "Matter remembers pressure. Clear the reach to remember Fault Breaker and open the foundry.", exits: { south: { to: "wild" }, east: { to: "foundry", requires: "fracture" } } },
    foundry: { name: "Archon Foundry", short: "Foundry", coord: [1, 0], theme: "#d49a79", danger: 4, reward: "eye", desc: "The archons are assembled here. Claim the Eye Sigil to reach the northern seal.", exits: { south: { to: "glass", requires: "fracture" }, west: { to: "basalt" }, east: { to: "quiet", requires: "phase" }, north: { to: "eye", requires: "eye" } } },
    quiet: { name: "The Quiet Array", short: "Quiet", coord: [2, 0], theme: "#b5becf", danger: 2, desc: "A forgotten side route. The array still carries questions that no one assigned.", exits: { south: { to: "machine" }, west: { to: "foundry", requires: "fracture" }, east: { to: "conduit", requires: "phase" } } },
    conduit: { name: "The Unbound Conduit", short: "Conduit", coord: [3, 0], theme: "#83c9c6", danger: 3, desc: "An abandoned route carries power the lattice forgot to count. It leads south into the Resonant Cistern.", exits: { west: { to: "quiet", requires: "phase" }, south: { to: "cistern" } } },
    cistern: { name: "Resonant Cistern", short: "Cistern", coord: [3, 1], theme: "#89b9dd", danger: 3, loot: "bell", desc: "A buried reservoir holds the voices sent away. Clear it for the Memory Bell, then explore the Echo Forge to the south.", exits: { north: { to: "conduit" }, west: { to: "machine", requires: "root" }, south: { to: "forge" } } },
    forge: { name: "The Echo Forge", short: "Echo Forge", coord: [3, 2], theme: "#d7aa80", danger: 4, miniboss: true, loot: "ash", desc: "The Cantor guards an old workshop. Break its rings to recover the Ash Cloak and open a shortcut to the roots.", exits: { north: { to: "cistern" }, west: { to: "roots", requires: "fracture" } } },
    eye: { name: "The Demiurge\u2019s Eye", short: "The Eye", coord: [1, -1], theme: "#e2be7e", danger: 5, boss: true, desc: "The Warden guards the seam of this stratum. Read its marks. Dash through the closing pattern.", exits: { south: { to: "foundry" } } }
  };
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
    return prepareEquipment({ version: 2, karma: clamp(Number.isFinite(origin?.karma) ? origin.karma : 0, -100, 100), awareness: clamp(Number.isFinite(origin?.awareness) ? origin.awareness : 8, 0, 100), essence: 0, runs: 0, wins: 0, bestRooms: 0, abilities: [], gifts: { heart: 0, edge: 0, haste: 0 }, echoes: [], visited: [] });
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
    const equipment = prepareEquipment(meta2), gear = gearStats(equipment), body = BODIES[form], hp = body.hp + meta2.gifts.heart * 12 + gear.health;
    const run2 = { version: 2, seed: seed >>> 0, rng: seed >>> 0, serial: 0, form, phase: "playing", room: "threshold", roomTime: 0, time: 0, spawnClock: 0.3, spawned: 0, spawnTotal: 0, player: { x: WIDTH / 2, y: HEIGHT / 2 + 90, hp, maxHp: hp, r: 15, facingX: 0, facingY: -1, iframes: 1, dashTime: 0, dashX: 0, dashY: -1, dashCooldown: 0, attackClock: 0.1 }, enemies: [], shots: [], fragments: [], effects: [], marks: [], kills: 0, level: 1, xp: 0, nextXp: 6, choices: [], boons: { edge: 0, cadence: 0, orbit: 0, shell: 0, regeneration: 0, magnet: 0, dash: 0 }, cleared: ["threshold"], discovered: ["threshold"], abilities: [.../* @__PURE__ */ new Set([...meta2.abilities, ...body.ability ? [body.ability] : []])], earnedAbilities: [], karma: meta2.karma, awareness: meta2.awareness, essence: 0, memoryEdge: meta2.gifts.edge * 0.07, memoryHaste: meta2.gifts.haste * 0.025, notice: "Move to the northern gate. Press E to enter the Glass Causeway.", noticeTime: 8, damageFlash: 0, settled: false, roomResolved: [], lastGate: null };
    run2.gear = gear;
    run2.loadout = equipment.loadout;
    run2.loot = [];
    run2.journal = [];
    run2.seenEnemies = [];
    recordArrival(run2);
    if (meta2.runs === 0) {
      run2.notice = "Move with WASD or arrows. Your weapon fires itself. Go to the northern gate and press E.";
      run2.noticeTime = 18;
    }
    return run2;
  }
  function obstacles(room) {
    if (room === "threshold" || room === "eye" || room === "forge") return [];
    const offset = ROOMS[room].danger % 2 ? 0 : 34;
    return [{ x: 245 + offset, y: 160, w: 52, h: 78 }, { x: 660 - offset, y: 355, w: 52, h: 78 }];
  }
  function circleRect(x, y, r, b) {
    const px = clamp(x, b.x, b.x + b.w), py = clamp(y, b.y, b.y + b.h);
    return Math.hypot(x - px, y - py) < r;
  }
  function move(run2, entity, dx, dy, ignore = false) {
    const boxes = ignore ? [] : obstacles(run2.room), nx = clamp(entity.x + dx, 34 + entity.r, WIDTH - 34 - entity.r), ny = clamp(entity.y + dy, 34 + entity.r, HEIGHT - 34 - entity.r);
    if (!boxes.some((b) => circleRect(nx, entity.y, entity.r, b))) entity.x = nx;
    if (!boxes.some((b) => circleRect(entity.x, ny, entity.r, b))) entity.y = ny;
  }
  function exitPosition(direction) {
    return { north: { x: WIDTH / 2, y: 31 }, south: { x: WIDTH / 2, y: HEIGHT - 31 }, east: { x: WIDTH - 31, y: HEIGHT / 2 }, west: { x: 31, y: HEIGHT / 2 } }[direction];
  }
  function gateStatus(run2, direction) {
    const exit = ROOMS[run2.room].exits[direction];
    if (!exit) return { available: false, reason: "No gate here." };
    if (!run2.cleared.includes(run2.room)) return { available: false, reason: "Break the swarm to open the gates." };
    if (exit.requires && !run2.abilities.includes(exit.requires)) return { available: false, reason: "Requires " + ABILITIES[exit.requires].name + ".", requires: exit.requires, to: exit.to };
    return { available: true, to: exit.to, requires: exit.requires };
  }
  function nearestGate(run2) {
    let gate = null;
    for (const direction of Object.keys(ROOMS[run2.room].exits)) {
      const position = exitPosition(direction), distance = dist(run2.player, position);
      if (!gate || distance < gate.distance) gate = { direction, position, distance, ...gateStatus(run2, direction) };
    }
    return gate;
  }
  function enterGate(run2, direction) {
    if (run2.phase !== "playing") throw new Error("Finish the current choice before traveling.");
    const status = gateStatus(run2, direction);
    if (!status.available) throw new Error(status.reason);
    if (dist(run2.player, exitPosition(direction)) > 83) throw new Error("Move closer to the gate.");
    const opposite = { north: "south", south: "north", east: "west", west: "east" }[direction], at = exitPosition(opposite);
    run2.room = status.to;
    run2.roomTime = 0;
    run2.enemies = [];
    run2.shots = [];
    run2.effects = [];
    run2.marks = [];
    run2.fragments = [];
    run2.spawnClock = 0.6;
    run2.spawned = 0;
    run2.spawnTotal = ROOMS[run2.room].safe ? 0 : ROOMS[run2.room].boss || ROOMS[run2.room].miniboss ? 1 : ENCOUNTERS[run2.room]?.total ?? 14 + ROOMS[run2.room].danger * 4;
    run2.player.x = clamp(at.x, 82, WIDTH - 82);
    run2.player.y = clamp(at.y, 82, HEIGHT - 82);
    run2.player.iframes = 1.4;
    run2.player.attackClock = 0.25;
    run2.lastGate = opposite;
    if (!run2.discovered.includes(run2.room)) run2.discovered.push(run2.room);
    if (run2.partner) {
      run2.partner.x = clamp(run2.player.x + 48, 82, WIDTH - 82);
      run2.partner.y = run2.player.y;
      run2.partner.iframes = 1.4;
      if (run2.partner.hp <= 0) run2.partner.hp = run2.partner.maxHp * 0.4;
      run2.spawnTotal = Math.round(run2.spawnTotal * 1.3);
    }
    recordArrival(run2);
    if ((ROOMS[run2.room].boss || ROOMS[run2.room].miniboss) && !run2.cleared.includes(run2.room)) spawnBoss(run2);
    return run2.room;
  }
  var ENCOUNTERS = { glass: { total: 14, interval: 0.95, cap: 6, damage: 0.7, pool: ["collector", "collector", "collector", "archon", "hound"] }, machine: { total: 18, interval: 0.95, cap: 8, damage: 0.8, pool: ["collector", "collector", "archon", "hound"] }, roots: { total: 20, interval: 0.85, cap: 9, damage: 0.85, pool: ["collector", "archon", "spore", "collector"] } };
  var ENEMY_KINDS = ["collector", "archon", "warden", "hound", "mirror", "spore", "oracle", "leech", "moth", "cantor"];
  function spawnEnemy(run2, forced = null, count = true) {
    let x, y;
    const actors = [run2.player, run2.partner].filter((p) => p && p.hp > 0);
    for (let attempt = 0; attempt < 12; attempt++) {
      const edge = Math.floor(rand(run2) * 4);
      x = edge === 0 ? 65 : edge === 1 ? WIDTH - 65 : 80 + rand(run2) * (WIDTH - 160);
      y = edge === 2 ? 65 : edge === 3 ? HEIGHT - 65 : 80 + rand(run2) * (HEIGHT - 160);
      if (actors.every((p) => Math.hypot(p.x - x, p.y - y) > 180)) break;
    }
    const difficulty = ROOMS[run2.room].danger, roll = rand(run2), pool = ENCOUNTERS[run2.room]?.pool, kind = forced ?? (pool ? pool[Math.floor(roll * pool.length)] : run2.room === "conduit" || run2.room === "cistern" ? roll < 0.28 ? "leech" : roll < 0.47 ? "moth" : roll < 0.65 ? "archon" : "collector" : roll < 0.12 && difficulty >= 3 ? "oracle" : roll < 0.25 && difficulty >= 2 ? "spore" : roll < 0.37 && difficulty >= 2 ? "mirror" : roll < 0.53 ? "hound" : roll < 0.7 ? "archon" : "collector");
    const enemy = { id: randomId(run2), kind, x, y, r: kind === "archon" ? 17 : 14, hp: (kind === "archon" ? 42 : 24) + difficulty * 6, maxHp: (kind === "archon" ? 42 : 24) + difficulty * 6, speed: kind === "archon" ? 53 : 74 + difficulty * 6, attack: 1.2 + rand(run2) * 1.1, orbitHit: 0, flash: 0 };
    const stats = { hound: { hp: 31, speed: 84, r: 14 }, mirror: { hp: 55, speed: 58, r: 18 }, spore: { hp: 38, speed: 45, r: 17 }, oracle: { hp: 75, speed: 38, r: 20 }, leech: { hp: 49, speed: 59, r: 17 }, moth: { hp: 29, speed: 102, r: 14 } }[kind];
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
    run2.enemies.push(enemy);
    if (count) run2.spawned++;
  }
  function spawnBoss(run2) {
    const cantor = !!ROOMS[run2.room].miniboss, hp = cantor ? run2.partner ? 950 : 650 : run2.partner ? 1800 : 1200, kind = cantor ? "cantor" : "warden";
    run2.enemies.push({ id: randomId(run2), kind, x: WIDTH / 2, y: HEIGHT / 2 - 90, r: cantor ? 32 : 37, hp, maxHp: hp, speed: cantor ? 48 : 65, attack: 1.8, markClock: 3.5, orbitHit: 0, flash: 0 });
    run2.spawned = 1;
    run2.seenEnemies ??= [];
    if (!run2.seenEnemies.includes(kind)) run2.seenEnemies.push(kind);
  }
  function effect(run2, type, x, y, color, r = 20) {
    if (run2.effects.length < 140) run2.effects.push({ id: randomId(run2), type, x, y, color, r, life: type === "wave" ? 0.4 : 0.3, maxLife: type === "wave" ? 0.4 : 0.3 });
  }
  function damageEnemy(run2, enemy, amount) {
    if (enemy.hp <= 0) return;
    if (enemy.kind === "mirror" && enemy.shield > 0) amount *= 0.35;
    enemy.hp -= amount;
    enemy.flash = 0.13;
    effect(run2, "hit", enemy.x, enemy.y, BODIES[run2.form].color, 13);
    if (enemy.hp <= 0) {
      run2.marks = run2.marks.filter((mark) => mark.sourceId !== enemy.id);
      run2.kills++;
      const value = enemy.kind === "warden" ? 30 : enemy.kind === "cantor" ? 18 : enemy.kind === "archon" ? 3 : 2;
      run2.fragments.push({ id: randomId(run2), x: enemy.x, y: enemy.y, value, r: 5 });
      effect(run2, "burst", enemy.x, enemy.y, enemy.kind === "warden" ? "#f7cb79" : "#8bc7c2", 32);
    }
  }
  function hurt(run2, amount, target = run2.player) {
    if (target.hp <= 0 || target.iframes > 0) return;
    const armor = (target === run2.partner ? run2.partnerForm : run2.form) === "rock" ? 0.7 : 1;
    target.hp = Math.max(0, target.hp - amount * armor * (1 - (run2.gear?.armor ?? 0)) * (ENCOUNTERS[run2.room]?.damage ?? 1));
    target.iframes = 0.7;
    run2.damageFlash = 0.22;
    if (target.hp <= 0) {
      if (!run2.partner || [run2.player, run2.partner].every((p) => p.hp <= 0)) {
        run2.phase = "dead";
        run2.notice = "The bodies end. The sparks return.";
      } else {
        run2.notice = "A vessel fell. Stand close and hold E to rekindle your partner.";
        run2.noticeTime = 6;
      }
    }
  }
  function fire(run2, x, y, angle, damage, enemy = false, speed = 430, range = 700, homing = false) {
    if (run2.shots.length > 240) return;
    run2.shots.push({ id: randomId(run2), x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, damage, enemy, r: enemy ? 6 : 5, life: range / speed, homing, color: enemy ? "#dd8f85" : BODIES[run2.form].color });
  }
  function attack(run2) {
    const p = run2.player, body = BODIES[run2.form], range = body.range * (1 + (run2.gear?.range ?? 0)), enemies = run2.enemies.filter((e2) => e2.hp > 0), target = enemies.sort((a, b) => dist(p, a) - dist(p, b))[0];
    if (!target || dist(p, target) > range) return;
    const damage = body.damage * (1 + run2.boons.edge * 0.24 + run2.memoryEdge + (run2.gear?.damage ?? 0) + (!["spark", "computer"].includes(run2.form) ? run2.gear?.melee ?? 0 : 0)), angle = Math.atan2(target.y - p.y, target.x - p.x);
    p.facingX = Math.cos(angle);
    p.facingY = Math.sin(angle);
    if (run2.form === "spark") fire(run2, p.x, p.y, angle, damage, false, 390, range, true);
    else if (run2.form === "computer") for (const a of [-0.17, 0, 0.17]) fire(run2, p.x, p.y, angle + a, damage, false, 500, range, false);
    else {
      const radius = range;
      for (const enemy of enemies) {
        const distance = dist(p, enemy);
        if (distance < radius + enemy.r) {
          if (run2.form === "human" || run2.form === "animal") {
            const a = Math.atan2(enemy.y - p.y, enemy.x - p.x);
            if (Math.cos(a - angle) > 0.05) damageEnemy(run2, enemy, damage);
          } else damageEnemy(run2, enemy, damage);
        }
      }
      effect(run2, run2.form === "human" || run2.form === "animal" ? "slash" : "wave", p.x, p.y, body.color, radius);
    }
  }
  function offerBoons(run2) {
    const list = Object.keys(BOONS).filter((id) => id !== "orbit" || run2.boons.orbit < 4);
    run2.choices = [];
    while (run2.choices.length < 3 && list.length) {
      const i = Math.floor(rand(run2) * list.length);
      run2.choices.push(list.splice(i, 1)[0]);
    }
    run2.phase = "boon";
  }
  function chooseBoon(run2, id) {
    if (run2.phase !== "boon" || !run2.choices.includes(id)) throw new Error("This gift is not offered.");
    run2.boons[id]++;
    if (id === "shell") for (const p of [run2.player, run2.partner].filter(Boolean)) {
      p.maxHp += 25;
      p.hp = Math.min(p.maxHp, p.hp + 35);
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
    }
  }
  function clearRoom(run2) {
    if (run2.cleared.includes(run2.room)) return;
    run2.cleared.push(run2.room);
    run2.loot ??= [];
    const item = ROOMS[run2.room].loot;
    if (item && !run2.loot.includes(item)) run2.loot.push(item);
    for (const actor of [run2.player, run2.partner].filter((p) => p && p.hp > 0)) actor.hp = Math.min(actor.maxHp, actor.hp + 12);
    if (ROOMS[run2.room].miniboss) run2.essence += 7;
    const reward = ROOMS[run2.room].reward;
    if (reward) {
      if (!run2.abilities.includes(reward)) run2.abilities.push(reward);
      if (!run2.earnedAbilities.includes(reward)) run2.earnedAbilities.push(reward);
    }
    if (ROOMS[run2.room].boss) {
      run2.phase = "won";
      run2.essence += 20;
      run2.karma = clamp(run2.karma + 10, -100, 100);
      run2.awareness = clamp(run2.awareness + 10, 0, 100);
      return;
    }
    run2.phase = "resolve";
    run2.shots = [];
    run2.marks = [];
  }
  function resolveChamber(run2, choice) {
    if (run2.phase !== "resolve" || ![0, 1, 2].includes(choice)) throw new Error("This chamber is not awaiting that choice.");
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
    if (run2.partner) {
      const heal = choice === 0 ? 10 : choice === 1 ? 25 : 0;
      run2.partner.hp = Math.min(run2.partner.maxHp, Math.max(run2.partner.hp, run2.partner.hp <= 0 ? run2.partner.maxHp * 0.4 : 0) + heal);
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
    }
  }
  function dashCooldown(run2) {
    return Math.max(0.48, 1.65 * 0.78 ** run2.boons.dash * (1 - (run2.gear?.dash ?? 0)));
  }
  var validActor = (p) => p && ["x", "y", "hp", "maxHp", "r", "facingX", "facingY", "iframes", "dashTime", "dashX", "dashY", "dashCooldown", "attackClock"].every((k) => Number.isFinite(p[k])) && p.hp >= 0 && p.hp <= p.maxHp && p.maxHp > 0 && p.x >= 0 && p.x <= WIDTH && p.y >= 0 && p.y <= HEIGHT;
  function addPartner(run2, form, replace = false) {
    if (!BODIES[form]) throw Error("Unknown partner form.");
    if (run2.partner && !replace) return;
    const previous2 = run2.partner, bonus = run2.player.maxHp - BODIES[run2.form].hp, maxHp = BODIES[form].hp + bonus;
    run2.partnerForm = form;
    run2.partner = { ...structuredClone(run2.player), x: previous2?.x ?? clamp(run2.player.x + 48, 49, WIDTH - 49), y: previous2?.y ?? run2.player.y, hp: previous2 ? maxHp * previous2.hp / previous2.maxHp : maxHp, maxHp, revive: 0 };
    const ability = BODIES[form].ability;
    if (ability && !run2.abilities.includes(ability)) run2.abilities.push(ability);
  }
  function stepActor(run2, p, form, input, dt) {
    const x = Number(input.x ?? 0), y = Number(input.y ?? 0);
    if (!Number.isFinite(x) || !Number.isFinite(y)) throw Error("Movement must be finite.");
    if (p.hp <= 0) return;
    const length = Math.hypot(x, y), mx = length > 1 ? x / length : x, my = length > 1 ? y / length : y, body = BODIES[form];
    p.iframes = Math.max(0, p.iframes - dt);
    p.dashCooldown = Math.max(0, p.dashCooldown - dt);
    if (input.dash && p.dashCooldown === 0) {
      p.dashTime = 0.16;
      p.iframes = Math.max(p.iframes, 0.27);
      p.dashX = length ? mx : p.facingX;
      p.dashY = length ? my : p.facingY;
      p.dashCooldown = dashCooldown(run2);
      effect(run2, "wave", p.x, p.y, body.color, 27);
    }
    if (p.dashTime > 0) {
      move(run2, p, p.dashX * 830 * dt, p.dashY * 830 * dt, run2.abilities.includes("phase"));
      p.dashTime = Math.max(0, p.dashTime - dt);
    } else {
      move(run2, p, mx * body.speed * (1 + (run2.gear?.speed ?? 0)) * dt, my * body.speed * (1 + (run2.gear?.speed ?? 0)) * dt);
      if (length) {
        p.facingX = mx;
        p.facingY = my;
      }
    }
    const other = run2.partner ? p === run2.player ? run2.partner : run2.player : null;
    if (other && other.hp <= 0) {
      if (input.interact && dist(p, other) < 80) {
        other.revive = (other.revive ?? 0) + dt;
        if (other.revive >= 1.8) {
          other.hp = other.maxHp * 0.4;
          other.iframes = 2;
          other.revive = 0;
          effect(run2, "wave", other.x, other.y, "#dfe5a7", 65);
          run2.notice = "The spark answers. Your partner is rekindled.";
          run2.noticeTime = 4;
        }
      } else other.revive = 0;
    } else if (input.interact) {
      const primary = run2.player;
      run2.player = p;
      const gate = nearestGate(run2);
      run2.player = primary;
      if (gate && gate.distance < 83) {
        if (gate.available) {
          if (other && other.hp > 0 && dist(other, gate.position) > 170) {
            run2.notice = "Bring your partner to this gate before crossing.";
            run2.noticeTime = 2;
          } else {
            if (p !== run2.player) {
              run2.player.x = p.x;
              run2.player.y = p.y;
            }
            enterGate(run2, gate.direction);
          }
        } else {
          run2.notice = gate.reason;
          run2.noticeTime = 2.5;
        }
      }
    }
    p.attackClock -= dt;
    if (p.attackClock <= 0) {
      const previousPlayer = run2.player, previousForm = run2.form;
      run2.player = p;
      run2.form = form;
      attack(run2);
      run2.player = previousPlayer;
      run2.form = previousForm;
      p.attackClock = body.interval / Math.min(3, 1 + run2.boons.cadence * 0.18 + run2.memoryHaste + (run2.gear?.haste ?? 0));
    }
  }
  function stepRun(run2, input = {}, dt = 1 / 60) {
    if (run2.phase !== "playing") return;
    if (!Number.isFinite(dt) || dt <= 0 || dt > 0.05) throw new Error("Simulation steps must be between zero and 0.05 seconds.");
    const x = Number(input.x ?? 0), y = Number(input.y ?? 0);
    if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error("Movement must be finite.");
    if (input.partner && (!Number.isFinite(input.partner.x ?? 0) || !Number.isFinite(input.partner.y ?? 0))) throw Error("Movement must be finite.");
    const p = run2.player;
    run2.time += dt;
    run2.roomTime += dt;
    run2.noticeTime = Math.max(0, run2.noticeTime - dt);
    run2.damageFlash = Math.max(0, run2.damageFlash - dt);
    stepActor(run2, p, run2.form, input, dt);
    if (run2.partner) stepActor(run2, run2.partner, run2.partnerForm, input.partner ?? {}, dt);
    if (!ROOMS[run2.room].safe && !ROOMS[run2.room].boss && !ROOMS[run2.room].miniboss && !run2.cleared.includes(run2.room) && run2.spawned < run2.spawnTotal && run2.enemies.length < (ENCOUNTERS[run2.room]?.cap ?? 30)) {
      run2.spawnClock -= dt;
      if (run2.spawnClock <= 0) {
        spawnEnemy(run2);
        run2.spawnClock = (ENCOUNTERS[run2.room]?.interval ?? 0.6) + rand(run2) * 0.3;
      }
    }
    const living = [run2.player, run2.partner].filter((a) => a && a.hp > 0);
    const orbitCount = run2.boons.orbit;
    for (const enemy of run2.enemies) {
      if (enemy.hp <= 0) continue;
      enemy.flash = Math.max(0, enemy.flash - dt);
      enemy.orbitHit = Math.max(0, enemy.orbitHit - dt);
      const target = living.reduce((a, b) => !a || dist(enemy, b) < dist(enemy, a) ? b : a, null) ?? p, d = dist(enemy, target), dx = (target.x - enemy.x) / (d || 1), dy = (target.y - enemy.y) / (d || 1);
      if (enemy.kind === "collector") {
        move(run2, enemy, dx * enemy.speed * dt, dy * enemy.speed * dt);
        if (d < target.r + enemy.r + 3) hurt(run2, 10, target);
      } else if (enemy.kind === "hound") {
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
      } else if (enemy.kind === "leech") {
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
      } else if (enemy.kind === "moth") {
        if (enemy.windup > 0) {
          enemy.windup -= dt;
          if (enemy.windup <= 0) {
            enemy.hp = 0;
            run2.kills++;
            run2.fragments.push({ id: randomId(run2), x: enemy.x, y: enemy.y, value: 2, r: 5 });
            effect(run2, "burst", enemy.x, enemy.y, "#ecb877", 40);
          }
        } else if (d < 85) {
          enemy.windup = 1.15;
          run2.marks.push({ x: enemy.x, y: enemy.y, r: 72, timer: 1.15, life: 1.15, color: "#edb66c", damage: 17, sourceId: enemy.id });
        } else move(run2, enemy, dx * enemy.speed * dt, dy * enemy.speed * dt);
      } else if (enemy.kind === "spore" || enemy.kind === "oracle") {
        const sign = d < 185 ? -0.4 : d > 320 ? 1 : 0;
        move(run2, enemy, dx * enemy.speed * sign * dt, dy * enemy.speed * sign * dt, true);
        enemy.attack -= dt;
        if (enemy.attack <= 0) {
          if (enemy.kind === "spore") {
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
        const sign = d < (enemy.kind === "warden" ? 180 : 165) ? -0.4 : d > 260 ? 1 : 0;
        move(run2, enemy, dx * enemy.speed * sign * dt, dy * enemy.speed * sign * dt, true);
        enemy.attack -= dt;
        if (enemy.attack <= 0) {
          const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
          if (enemy.kind === "cantor") {
            for (let i = 0; i < 6; i++) fire(run2, enemy.x, enemy.y, run2.time * 0.3 + i * Math.PI / 3, 11, true, 160, 850);
            enemy.attack = 2.2;
          } else if (enemy.kind === "warden") {
            const enraged = enemy.hp < enemy.maxHp * 0.5;
            for (const spread of enraged ? [-0.36, -0.18, 0, 0.18, 0.36] : [-0.2, 0, 0.2]) fire(run2, enemy.x, enemy.y, angle + spread, 14, true, enraged ? 260 : 220, 1e3);
            enemy.attack = enraged ? 0.9 : 1.4;
          } else {
            for (const spread of enemy.kind === "mirror" ? [-0.12, 0.12] : [0]) fire(run2, enemy.x, enemy.y, angle + spread, 10, true, 190, 750);
            enemy.attack = 2.3;
          }
        }
        if (enemy.kind === "mirror") enemy.shield = run2.time % 3.8 < 1.4 ? 1 : 0;
        if (enemy.kind === "warden" && enemy.hp < enemy.maxHp * 0.5 && !enemy.enraged) {
          enemy.enraged = true;
          for (let i = 0; i < 10; i++) fire(run2, enemy.x, enemy.y, i * Math.PI / 5, 12, true, 155, 900);
          spawnEnemy(run2, "hound", false);
          spawnEnemy(run2, "hound", false);
        }
        if (enemy.kind === "warden" || enemy.kind === "cantor") {
          enemy.markClock -= dt;
          if (enemy.markClock <= 0) {
            run2.marks.push({ x: target.x, y: target.y, r: enemy.kind === "cantor" ? 62 : 70, timer: enemy.kind === "cantor" ? 1.2 : 0.9, life: enemy.kind === "cantor" ? 1.2 : 0.9 });
            enemy.markClock = enemy.hp < enemy.maxHp * 0.5 ? 2.6 : 3.6;
          }
        }
        if (d < target.r + enemy.r) hurt(run2, enemy.kind === "warden" ? 22 : 9, target);
      }
      if (orbitCount && enemy.orbitHit === 0) {
        for (const actor of living) for (let i = 0; i < orbitCount; i++) {
          const angle = run2.time * 2.9 + i * Math.PI * 2 / orbitCount, orb = { x: actor.x + Math.cos(angle) * 68, y: actor.y + Math.sin(angle) * 68 };
          if (dist(enemy, orb) < enemy.r + 16) {
            damageEnemy(run2, enemy, 13 * (1 + run2.boons.edge * 0.15));
            enemy.orbitHit = 0.3;
            break;
          }
        }
      }
    }
    for (const shot of run2.shots) {
      shot.life -= dt;
      if (shot.life <= 0) continue;
      if (shot.homing) {
        let closest = null;
        for (const enemy of run2.enemies) if (enemy.hp > 0 && (!closest || dist(shot, enemy) < dist(shot, closest))) closest = enemy;
        if (closest) {
          const angle = Math.atan2(closest.y - shot.y, closest.x - shot.x);
          shot.vx = shot.vx * 0.88 + Math.cos(angle) * 390 * 0.12;
          shot.vy = shot.vy * 0.88 + Math.sin(angle) * 390 * 0.12;
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
        damageEnemy(run2, enemy, shot.damage);
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
      const collector = living.reduce((a, b) => !a || dist(fragment, b) < dist(fragment, a) ? b : a, null) ?? p, d = dist(fragment, collector), magnet = 95 + run2.boons.magnet * 75;
      if (d < magnet && d > 1) {
        fragment.x += (collector.x - fragment.x) / d * 350 * dt;
        fragment.y += (collector.y - fragment.y) / d * 350 * dt;
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
    if (run2.phase === "playing") for (const actor of living) actor.hp = Math.min(actor.maxHp, actor.hp + dt * (run2.boons.regeneration + ((actor === run2.partner ? run2.partnerForm : run2.form) === "tree" ? 0.4 : 0)));
    if (run2.phase !== "playing") return;
    if (ROOMS[run2.room].miniboss && run2.spawned >= 1 && !run2.enemies.some((e2) => e2.kind === "cantor")) {
      clearRoom(run2);
      return;
    }
    if (ROOMS[run2.room].boss && run2.spawned >= 1 && !run2.enemies.some((e2) => e2.kind === "warden")) {
      clearRoom(run2);
      return;
    }
    if (run2.xp >= run2.nextXp) {
      run2.xp -= run2.nextXp;
      run2.level++;
      run2.nextXp = 6 + run2.level * 4;
      offerBoons(run2);
      return;
    }
    if (!ROOMS[run2.room].safe && !run2.cleared.includes(run2.room) && run2.spawned >= run2.spawnTotal && run2.enemies.length === 0) clearRoom(run2);
  }
  function settleRun(run2, meta2) {
    if (!["dead", "won"].includes(run2.phase) || run2.settled) throw new Error("This run cannot be recorded twice or before it ends.");
    const next = prepareEquipment(meta2);
    for (const id of run2.loot ?? []) if (EQUIPMENT[id] && !(id in next.inventory)) next.inventory[id] = 0;
    next.runs++;
    next.wins += run2.phase === "won" ? 1 : 0;
    next.karma = run2.karma;
    next.awareness = run2.awareness;
    next.essence += earnedEssence(run2, meta2);
    next.bestRooms = Math.max(next.bestRooms, run2.cleared.length - 1);
    next.abilities = [.../* @__PURE__ */ new Set([...next.abilities, ...run2.earnedAbilities])];
    if (!next.visited.includes(run2.form)) next.visited.push(run2.form);
    next.echoes.unshift({ form: run2.form, rooms: run2.cleared.length - 1, kills: run2.kills, won: run2.phase === "won", karma: run2.karma, seconds: Math.round(run2.time) });
    next.echoes = next.echoes.slice(0, 20);
    next.journal = [...run2.journal ?? [], ...next.journal ?? []].filter((v, i, a) => a.findIndex((x) => x.id === v.id) === i).slice(0, 30);
    next.seenEnemies = [.../* @__PURE__ */ new Set([...next.seenEnemies ?? [], ...run2.seenEnemies ?? []])];
    run2.settled = true;
    return next;
  }
  function earnedEssence(run2, meta2) {
    return Math.max(run2.essence + Math.floor(run2.kills / 8), meta2.runs === 0 && run2.kills > 0 ? 4 : 0);
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
    return { phase: run2?.phase ?? "between", form: run2?.form ?? null, room: run2?.room ?? null, player: run2 ? { x: run2.player.x, y: run2.player.y, hp: run2.player.hp, maxHp: run2.player.maxHp, dashReady: run2.player.dashCooldown === 0 } : null, enemies: run2 ? run2.enemies.map((e2) => ({ id: e2.id, kind: e2.kind, x: e2.x, y: e2.y, hp: e2.hp })) : [], fragments: run2 ? run2.fragments.map((f) => ({ x: f.x, y: f.y, value: f.value })) : [], level: run2?.level ?? 0, boons: run2?.boons ?? {}, choices: run2?.choices ?? [], karma: run2?.karma ?? meta2.karma, abilities: run2?.abilities ?? meta2.abilities, cleared: run2?.cleared ?? [], exits: run2 ? Object.keys(ROOMS[run2.room].exits).map((dir) => ({ direction: dir, ...exitPosition(dir), ...gateStatus(run2, dir) })) : [], offeredForms: offeredForms(meta2), essence: meta2.essence, equipment: run2?.loadout ?? prepareEquipment(meta2).loadout, loot: run2?.loot ?? [] };
  }
  function validMeta(meta2) {
    return !!meta2 && validEquipment(meta2) && meta2.version === 2 && ["karma", "awareness", "essence", "runs", "wins", "bestRooms"].every((k) => Number.isFinite(meta2[k])) && meta2.karma >= -100 && meta2.karma <= 100 && meta2.awareness >= 0 && meta2.awareness <= 100 && meta2.essence >= 0 && meta2.runs >= 0 && Array.isArray(meta2.abilities) && meta2.abilities.every((a) => ABILITIES[a]) && meta2.gifts && Object.keys(MEMORY_GIFTS).every((k) => Number.isInteger(meta2.gifts[k]) && meta2.gifts[k] >= 0 && meta2.gifts[k] <= 8) && Array.isArray(meta2.echoes) && Array.isArray(meta2.visited) && meta2.visited.every((f) => BODIES[f]);
  }
  function validRun(run2) {
    if (!run2 || run2.version !== 2 || !BODIES[run2.form] || !ROOMS[run2.room] || !["playing", "boon", "resolve", "dead", "won"].includes(run2.phase)) return false;
    if (!["time", "roomTime", "rng", "serial", "spawnClock", "spawned", "spawnTotal", "level", "xp", "nextXp", "kills", "karma", "awareness", "essence", "memoryEdge", "memoryHaste"].every((k) => Number.isFinite(run2[k]))) return false;
    if (run2.time < 0 || run2.level < 1 || run2.nextXp <= 0 || run2.karma < -100 || run2.karma > 100 || run2.awareness < 0 || run2.awareness > 100) return false;
    if (!run2.player || !["x", "y", "hp", "maxHp", "r", "facingX", "facingY", "iframes", "dashTime", "dashX", "dashY", "dashCooldown", "attackClock"].every((k) => Number.isFinite(run2.player[k]))) return false;
    if (run2.player.hp < 0 || run2.player.hp > run2.player.maxHp || run2.player.maxHp <= 0 || run2.player.x < 0 || run2.player.x > WIDTH || run2.player.y < 0 || run2.player.y > HEIGHT) return false;
    if (!["enemies", "shots", "fragments", "effects", "marks", "cleared", "discovered", "abilities", "earnedAbilities", "roomResolved", "choices"].every((k) => Array.isArray(run2[k]))) return false;
    if (run2.enemies.length > 128 || run2.shots.length > 300 || run2.fragments.length > 1e3 || run2.effects.length > 160 || run2.marks.length > 50) return false;
    if (!run2.enemies.every((e2) => ENEMY_KINDS.includes(e2.kind) && ["x", "y", "hp", "maxHp", "r", "speed", "attack", "orbitHit", "flash"].every((k) => Number.isFinite(e2[k])))) return false;
    if (!run2.shots.every((s) => ["x", "y", "vx", "vy", "damage", "r", "life"].every((k) => Number.isFinite(s[k]))) || !run2.fragments.every((f) => ["x", "y", "value", "r"].every((k) => Number.isFinite(f[k])))) return false;
    if (run2.gear && (!Object.entries(run2.gear).every(([key, n]) => ["health", "damage", "range", "speed", "melee", "haste", "dash", "armor"].includes(key) && Number.isFinite(n) && n >= 0 && n <= (key === "health" ? 100 : ["armor", "dash"].includes(key) ? 0.9 : 2)) || !validEquipment({ inventory: Object.fromEntries(Object.values(run2.loadout ?? {}).map((id) => [id, 0])), loadout: run2.loadout }))) return false;
    if (run2.loot && (!Array.isArray(run2.loot) || !run2.loot.every((id) => EQUIPMENT[id]))) return false;
    if (run2.partner && (!BODIES[run2.partnerForm] || !validActor(run2.partner))) return false;
    return run2.abilities.every((a) => ABILITIES[a]) && run2.earnedAbilities.every((a) => ABILITIES[a]) && run2.cleared.every((r) => ROOMS[r]) && run2.discovered.every((r) => ROOMS[r]) && run2.choices.every((b) => BOONS[b]) && run2.boons && Object.keys(BOONS).every((k) => Number.isFinite(run2.boons[k]) && run2.boons[k] >= 0);
  }

  // descent.js
  var $ = (id) => document.getElementById(id);
  var KEY = "spark-substrate-descent-v2";
  var signed = (n) => n > 0 ? "+" + n : String(n);
  var pad = (n) => String(n).padStart(2, "0");
  var meta = createMeta();
  var run = null;
  var paused = false;
  var modalWasPaused = false;
  var menu = true;
  var saveAvailable = true;
  var overlaySignature = "";
  var sound = false;
  var audioContext = null;
  var lastSound = 0;
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
  var images = { floor: new Image(), sprites: new Image(), enemies: new Image(), floors: new Image(), newEnemies: new Image(), newFloors: new Image() };
  images.floor.src = "arena.webp";
  images.sprites.src = "sprites.webp";
  images.enemies.src = "enemies.webp";
  images.floors.src = "floors.webp";
  images.newEnemies.src = "enemies-v4.webp";
  images.newFloors.src = "floors-v4.webp";
  var imageFailure = false;
  for (const image of Object.values(images)) image.addEventListener("error", () => {
    imageFailure = true;
    announce("The artwork did not load. Please reload the game.");
    renderOverlay(true);
  });
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var touchDevice = window.matchMedia("(pointer: coarse)").matches;
  var keys = /* @__PURE__ */ new Set();
  var stick = { x: 0, y: 0 };
  var dashRequested = false;
  var interactRequested = false;
  var interactHeld = false;
  var viewport = { w: 960, h: 600, dpr: 1 };
  var camera = { x: 0, w: WIDTH, scale: 1 };
  var escapeText = (value) => String(value ?? "").replace(/[&<>"']/g, (c2) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c2]);
  var onlineWaiting = false;
  var remotePaused = false;
  var networkProblem = "";
  var remoteInput = { x: 0, y: 0 };
  var remoteInputSeq = 0;
  var remotePulse = { dash: false };
  var onlineStarting = false;
  var online = new OnlineRoom((data) => {
    networkProblem = "";
    remotePaused = data.paused;
    if (online.role === "guest") {
      const priorPhase = run?.phase, priorRoom = run?.room, priorForm = run?.partnerForm;
      run = data.run;
      menu = false;
      paused = false;
      onlineWaiting = data.waiting;
      if (priorPhase !== run.phase || priorRoom !== run.room || priorForm !== run.partnerForm) {
        finish();
        save();
        renderOverlay(true);
        renderRail();
      }
    } else {
      if (!run && data.run) {
        run = data.run;
        menu = false;
        paused = true;
      }
      if (data.guestOnline && data.guestForm && (!run.partner || run.partnerForm !== data.guestForm)) {
        addPartner(run, data.guestForm, !!run.partner);
        onlineWaiting = false;
        paused = false;
        announce("Your partner joins the current.");
      }
      if (data.inputSeq > remoteInputSeq) {
        remoteInputSeq = data.inputSeq;
        remoteInput = data.input ?? { x: 0, y: 0 };
        remotePulse.dash = remotePulse.dash || !!remoteInput.dash;
      }
      if (!data.guestOnline) {
        remoteInput = { x: 0, y: 0 };
        remoteInputSeq = 0;
        remotePulse.dash = false;
      }
      onlineWaiting = !data.guestOnline;
      remotePaused = false;
    }
    $("online-status").textContent = onlineWaiting ? "Waiting for your partner" : online.role === "host" ? "Co-op \xB7 you host" : "Co-op \xB7 you are Player 2";
    renderOverlay();
  }, (message) => {
    networkProblem = message;
    announce(message);
    $("online-status").textContent = message;
    renderOverlay();
  });
  online.setSource(() => ({ run, paused: paused || !!document.querySelector("dialog[open]"), waiting: onlineWaiting }));
  var vessel = () => online.role === "guest" && run?.partner ? { player: run.partner, form: run.partnerForm } : { player: run?.player, form: run?.form ?? "spark" };
  async function onlineAction(action) {
    if (action === "online") {
      openDialog("online-dialog");
      return;
    }
    if (action === "online-leave") {
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
      networkProblem = "";
      $("online-room-code").textContent = "";
      $("online-status").textContent = "Solo play";
      $("online-dialog").close();
      changed();
      return;
    }
    if (onlineStarting) return;
    onlineStarting = true;
    $("online-error").textContent = "Connecting\u2026";
    try {
      if (online.active) throw Error("Leave your current room before opening another.");
      if (run && !["dead", "won"].includes(run.phase)) throw Error("Finish this life before starting an online room.");
      const form = $("online-form").value;
      if (action === "online-host") {
        if (!offeredForms(meta).includes(form)) throw Error("Select one of your three currently offered forms to host.");
        const next = createRun(meta, form);
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
      remoteInputSeq = 0;
      remoteInput = { x: 0, y: 0 };
      $("online-room-code").textContent = online.code;
      $("online-error").textContent = "";
      $("online-dialog").close();
      clearInput();
      renderOverlay(true);
      renderRail();
      await online.sync();
    } catch (error) {
      $("online-error").textContent = error.message;
      announce(error.message);
    } finally {
      onlineStarting = false;
    }
  }
  function journalHtml() {
    const entries = run?.journal ?? meta.journal ?? [];
    const enemies = [.../* @__PURE__ */ new Set([...meta.seenEnemies ?? [], ...run?.seenEnemies ?? []])];
    return '<div class="journal-entries">' + (entries.length ? entries.map((entry) => `<article><span class="eyebrow">${escapeText(entry.speaker)}</span><h3>${escapeText(entry.title)}</h3><p>${escapeText(entry.text)}</p></article>`).join("") : "<p>Inhabit a body to begin remembering the story.</p>") + '</div><h3>Constructs encountered</h3><div class="bestiary">' + (enemies.length ? enemies.filter((id) => ENEMY_LORE[id]).map((id) => `<article><h4>${ENEMY_LORE[id].name}</h4><p>${ENEMY_LORE[id].desc}</p></article>`).join("") : "<p>There are no encounters in this memory yet.</p>") + "</div>";
  }
  function announce(text) {
    $("announcer").textContent = text;
  }
  var progress = null;
  function savedState() {
    return { version: 2, meta, run: online.active ? null : run };
  }
  function save() {
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
    $("save-status").textContent = progress?.status === "saved" ? "Progress saved \xB7 v0.4 \xB7 equipment + the Echo Forge" : progress?.status === "conflict" ? "Another tab saved this spark. Close extra tabs and reload to continue." : progress?.status === "error" ? "Server save pending \xB7 device copy kept" : saveAvailable ? "Progress saved on this device \xB7 syncing your spark" : "Keep this page open while saving connects";
  }
  function clearInput() {
    keys.clear();
    stick = { x: 0, y: 0 };
    dashRequested = false;
    interactRequested = false;
    interactHeld = false;
    $("joystick-thumb").style.transform = "translate(0,0)";
  }
  function spriteStyle(form) {
    const index = BODIES[form].sprite;
    return `--sprite-x:${index % 4 * 100 / 3}%;--sprite-y:${Math.floor(index / 4) * 100}%;--form-color:${BODIES[form].color}`;
  }
  function mapHtml(large = false) {
    return Object.entries(ROOMS).map(([id, room]) => {
      const known = !run || run.discovered.includes(id), here = run?.room === id || !run && id === "threshold", clear = run?.cleared.includes(id), label = here ? "\u2727 " + room.short : known ? room.short : "\u25C7";
      return `<button class="map-room ${known ? "" : "unknown"} ${here ? "here" : ""} ${clear ? "clear" : ""}" style="grid-column:${room.coord[0] + 1};grid-row:${room.coord[1] + 2}" data-action="map-room" data-room="${id}" aria-label="${known ? room.name : "Undiscovered chamber"}${here ? ", your location" : ""}${clear ? ", cleared" : ""}"><span>${label}${large && clear ? " \u2713" : ""}</span></button>`;
    }).join("");
  }
  function renderRail() {
    $("leave-room-button").hidden = !online.active;
    const view = vessel(), form = view.form, body = BODIES[form], hp = view.player?.hp ?? body.hp, maxHp = view.player?.maxHp ?? body.hp, known = run?.abilities ?? meta.abilities;
    $("room-title").textContent = ROOMS[run?.room ?? "threshold"].name;
    $("header-karma").textContent = "KARMA " + signed(run?.karma ?? meta.karma);
    $("header-memory").textContent = "\u25C7 " + meta.essence;
    $("run-number").textContent = "INCARNATION " + pad(meta.runs + (run?.settled ? 0 : 1));
    const seconds = Math.floor(run?.time ?? 0);
    $("run-clock").textContent = pad(Math.floor(seconds / 60)) + ":" + pad(seconds % 60);
    $("form-name").textContent = FORMS[form].name;
    $("form-portrait").setAttribute("style", spriteStyle(form));
    $("weapon-name").textContent = body.weapon;
    $("form-level").textContent = "LV " + pad(run?.level ?? 1);
    $("hp-label").textContent = Math.ceil(hp) + " / " + maxHp;
    $("health-fill").style.width = hp / maxHp * 100 + "%";
    $("xp-label").textContent = Math.min(run?.xp ?? 0, run?.nextXp ?? 6) + " / " + (run?.nextXp ?? 6);
    $("xp-fill").style.width = Math.min(100, (run?.xp ?? 0) / (run?.nextXp ?? 6) * 100) + "%";
    $("kill-count").textContent = run?.kills ?? 0;
    $("room-count").textContent = (run ? run.cleared.length - 1 : 0) + " / " + (Object.keys(ROOMS).length - 1);
    $("mini-map").innerHTML = mapHtml();
    $("ability-list").innerHTML = Object.entries(ABILITIES).map(([id, a]) => `<div class="ability ${known.includes(id) ? "known" : ""}"><span aria-hidden="true">${a.glyph}</span><div>${a.name}<small>${known.includes(id) ? a.desc : "Not remembered yet"}</small></div></div>`).join("");
    const gifts = run ? Object.entries(run.boons).filter(([, n]) => n > 0) : [];
    $("boon-list").innerHTML = gifts.length ? gifts.map(([id, n]) => `<span class="boon-chip" title="${BOONS[id].desc}">${BOONS[id].name}<b>\xD7${n}</b></span>`).join("") : "<p>No gifts yet. Gather the blue fragments.</p>";
    $("world-message").textContent = run?.noticeTime > 0 ? run.notice : run && !run.cleared.includes(run.room) ? "Keep moving. Blue fragments remember the constructs you break." : ROOMS[run?.room ?? "threshold"].desc;
    const playable = run && !menu && run.phase === "playing";
    $("pause-button").textContent = playable && paused ? "Resume" : "Pause";
    $("pause-button").disabled = !playable || online.role === "guest";
    $("gear-list").innerHTML = Object.values(run?.loadout ?? meta.loadout).map((id) => `<span class="boon-chip" title="${escapeText(EQUIPMENT[id].desc)}">${EQUIPMENT[id].name}</span>`).join("");
    $("touch-controls").hidden = !(touchDevice && run && run.phase === "playing" && !paused && !menu);
  }
  function menuContent() {
    return `<div class="menu-card"><span class="eyebrow">${meta.runs ? "KARMA " + signed(meta.karma) + " \xB7 A NEW CURRENT" : "YOUR FIRST LIFE"}</span><h2>${meta.runs ? "The body falls.<br>The spark remembers." : "A spark against<br>the pattern."}</h2><p>${meta.runs ? "Choose your next body. Your equipment, abilities, and lasting memories cross the threshold." : "Move. Dash. Let your weapon fight. Follow the northern gate into the first swarm."}</p><div class="form-choices">${offeredForms(meta).map((form, i) => `<button class="form-choice" data-action="start" data-form="${form}" style="--form-color:${BODIES[form].color}" title="${BODIES[form].desc}"><span class="sprite-portrait" style="${spriteStyle(form)}"></span><strong>${FORMS[form].name}</strong><span class="weapon-label">${BODIES[form].weapon}</span><span class="form-start">${touchDevice ? "Tap to inhabit" : "<kbd>" + (i + 1) + "</kbd> Inhabit this form"}</span></button>`).join("")}</div><div class="menu-actions"><button class="secondary-button" data-action="forge">Equipment & forge${meta.runs ? " \xB7 \u25C7 " + meta.essence : ""}</button>${meta.runs ? '<button class="secondary-button" data-action="journal">Story journal</button>' : ""}</div><p class="overlay-note">${touchDevice ? "Drag the stick to move. Tap DASH to evade." : "WASD / arrows to move \xB7 Space to dash \xB7 E for gates"}<br>${touchDevice ? "Tap a card when a choice appears." : "Press 1, 2, or 3 when a choice appears. Time waits for you."}</p></div>`;
  }
  function forgeContent() {
    const active = run && !["dead", "won"].includes(run.phase);
    return `<p>${active ? "Your current equipment lasts for this life. Equip and enhance between lives." : "Carry one relic and one ward. Enhance each item up to +3. Discover equipment by clearing its chamber."}</p><p class="forge-balance">\u25C7 ${meta.essence} essence</p><div class="equipment-grid">${Object.entries(EQUIPMENT).map(([id, item]) => {
      const owned = id in meta.inventory, level = meta.inventory[id] ?? 0, equipped = meta.loadout[item.slot] === id, cost = enhancementCost(meta, id);
      return `<article class="equipment-card ${owned ? "" : "locked"}"><span class="equipment-icon" style="--item-x:${item.sprite % 3 * 50}%;--item-y:${Math.floor(item.sprite / 3) * 100}%" aria-hidden="true"></span><div><span class="eyebrow">${item.slot.toUpperCase()} \xB7 ${owned ? equipped ? "EQUIPPED" : "OWNED" : item.origin}</span><h3>${item.name}${level ? " +" + level : ""}</h3><p>${item.desc}</p><p class="item-effects">${equipmentEffects(id, level)}</p>${owned ? `<div class="item-actions"><button class="secondary-button" data-action="equip" data-item="${id}" ${active || equipped ? "disabled" : ""}>${equipped ? "Equipped" : "Equip"}</button><button class="primary-button" data-action="enhance" data-item="${id}" ${active || meta.essence < cost || level >= 3 ? "disabled" : ""} title="${level < 3 ? equipmentEffects(id, level + 1) : "Fully enhanced"}">${level >= 3 ? "Max +3" : "Enhance \xB7 \u25C7 " + cost}</button></div>` : `<p class="item-origin">Clear ${item.origin} to remember this item.</p>`}</div></article>`;
    }).join("")}</div><h3 class="forge-memories">Lasting memories</h3><p class="overlay-note">Your first memory costs 4 essence. A first life with any defeated construct earns at least 4.</p><div class="memory-shop">${Object.entries(MEMORY_GIFTS).map(([id, g]) => `<button class="memory-buy" data-action="buy" data-gift="${id}" ${active || meta.essence < memoryCost(meta, id) || meta.gifts[id] >= 8 ? "disabled" : ""}><strong>${g.name}</strong><span>${g.desc}</span><b>${meta.gifts[id] >= 8 ? "Complete" : "\u25C7 " + memoryCost(meta, id)}</b><small>Remembered ${meta.gifts[id]} / 8</small></button>`).join("")}</div>`;
  }
  function giftContent() {
    if (online.role === "guest") return '<div class="menu-card"><span class="eyebrow">A SHARED MEMORY</span><h2>The host is choosing a gift.</h2><p>Both vessels receive the same power.</p></div>';
    return `<div class="menu-card"><span class="eyebrow">LEVEL ${pad(run.level)} \xB7 A MEMORY TAKES SHAPE</span><h2>What will this life become?</h2><p>${touchDevice ? "Tap a card." : "Press 1, 2, or 3."} Time waits for you.</p><div class="gift-choices">${run.choices.map((id, i) => {
      const gift = BOONS[id];
      return `<button class="gift-choice" data-action="boon" data-gift="${id}"><span class="choice-number">${i + 1}</span><span class="gift-symbol" aria-hidden="true">${gift.glyph}</span><span class="eyebrow">${gift.tag}</span><strong>${gift.name}</strong><span class="gift-desc">${gift.desc}</span><span class="gift-effects">${run.boons[id] ? "Already remembered \xD7" + run.boons[id] : "A new possibility"}</span></button>`;
    }).join("")}</div></div>`;
  }
  function resolveContent() {
    const story = CHAMBER_STORIES[run.room];
    if (online.role === "guest") return `<div class="menu-card"><span class="eyebrow">${story.speaker}</span><h2>${story.title}</h2><p>\u201C${story.line}\u201D</p><p>Your host is choosing what the two of you leave behind.</p></div>`;
    const reward = ROOMS[run.room].reward;
    return `<div class="menu-card"><span class="eyebrow">${ROOMS[run.room].name.toUpperCase()} \xB7 THE GATES OPEN</span><h2>${story.title}</h2><p>${reward ? "You remember " + ABILITIES[reward].name + ". " : ""}${story.speaker}: \u201C${story.line}\u201D</p><div class="gift-choices">${[["Liberate the chamber", "Let its light return to the world.", "+7 karma \xB7 +3 essence \xB7 +10 health", "\u2727"], ["Harvest the machinery", "Take its remaining strength for yourself.", "\u22129 karma \xB7 +8 essence \xB7 +25 health", "\u25C7"], ["Listen to the echoes", "Preserve the pattern before moving on.", "+2 karma \xB7 +7 awareness \xB7 +5 essence", "\u25C8"]].map(([name, desc, effects, glyph], i) => {
      name = story.choices?.[i]?.[0] ?? name;
      desc = story.choices?.[i]?.[1] ?? desc;
      return `<button class="gift-choice" data-action="resolve" data-index="${i}"><span class="choice-number">${i + 1}</span><span class="gift-symbol" aria-hidden="true">${glyph}</span><span class="eyebrow">A LASTING RIPPLE</span><strong>${name}</strong><span class="gift-desc">${desc}</span><span class="gift-effects">${effects}</span></button>`;
    }).join("")}</div></div>`;
  }
  function resultContent() {
    const won = run.phase === "won";
    return `<div class="menu-card"><span class="eyebrow">${won ? "THE WARDEN FALLS" : "THE BODY ENDS"} \xB7 THE SPARK RETURNS</span><h2>${won ? "The first seam<br>is open." : "This was a life.<br>It was not the last."}</h2><p>${won ? "The Demiurge\u2019s Eye cannot hold this stratum closed anymore. You carry its lessons into the next current." : "Your body returns to the substrate. Your choices, earned essence, and discovered abilities remain."}</p><div class="result-stats"><div><strong>${run.cleared.length - 1}</strong><span>chambers cleared</span></div><div><strong>${run.kills}</strong><span>constructs broken</span></div><div><strong>${run.essenceEarned ?? run.essence + Math.floor(run.kills / 8)}</strong><span>essence earned</span></div></div>${run.loot?.length ? `<p class="result-ability">Equipment remembered: ${run.loot.map((id) => EQUIPMENT[id].name).join(" \xB7 ")}</p>` : ""}${run.earnedAbilities.length ? `<p class="result-ability">Remembered: ${run.earnedAbilities.map((id) => ABILITIES[id].name).join(" \xB7 ")}</p>` : ""}<div class="menu-actions"><button class="primary-button" data-action="${online.active ? "online-leave" : "reincarnate"}">${online.active ? "Leave this room" : "Meet the next current"}</button><button class="secondary-button" data-action="forge">Equipment & forge \xB7 \u25C7 ${meta.essence}</button><button class="secondary-button" data-action="map">See the path you opened</button></div><p class="overlay-note">Karma ${signed(run.karma)} \xB7 ${meta.runs} ${meta.runs === 1 ? "life" : "lives"} remembered \xB7 \u25C7 ${meta.essence} to carry forward</p></div>`;
  }
  function renderOverlay(force = false) {
    const signature = [menu, paused, run?.phase, run?.level, run?.choices.join(","), meta.essence, meta.runs, imageFailure, online.role, onlineWaiting, remotePaused, networkProblem, Math.floor((Date.now() - online.lastSuccess) / 6500)].join(":");
    if (!force && signature === overlaySignature) return;
    overlaySignature = signature;
    const el = $("game-overlay");
    el.classList.toggle("choice-overlay", !!run && ["boon", "resolve"].includes(run.phase));
    if (imageFailure) {
      el.innerHTML = '<div class="menu-card"><h2>The artwork could not load.</h2><p>Reload this page to try again. Your saved journey is kept.</p></div>';
      return;
    }
    if (online.active && (onlineWaiting || !run || networkProblem || online.lastSuccess && Date.now() - online.lastSuccess > 6500)) el.innerHTML = `<div class="menu-card"><span class="eyebrow">TWO SPARKS \xB7 ONE CURRENT</span><h2>${networkProblem ? "Reconnecting to the room\u2026" : "Waiting for your partner"}</h2><p>${escapeText(networkProblem) || "Share the room code. Your partner chooses Online co-op, enters this code, and joins."}</p><strong class="room-code">${online.code}</strong><p class="overlay-note">Room access follows this game\u2019s sharing settings.</p><button class="secondary-button" data-action="online-leave">Leave room</button></div>`;
    else if (menu || !run) el.innerHTML = menuContent();
    else if (["dead", "won"].includes(run.phase)) el.innerHTML = resultContent();
    else if (run.phase === "boon") el.innerHTML = giftContent();
    else if (run.phase === "resolve") el.innerHTML = resolveContent();
    else if (online.role === "guest" && remotePaused) el.innerHTML = '<div class="menu-card"><h2>The host paused the current.</h2><p>Your shared life resumes when the host returns.</p><button class="secondary-button" data-action="online-leave">Leave room</button></div>';
    else if (paused) el.innerHTML = '<div class="menu-card"><span class="eyebrow">A BREATH BETWEEN PULSES</span><h2>The pattern can wait.</h2><p>Your life is paused. Your saved spark is still here.</p><div class="menu-actions"><button class="primary-button" data-action="resume">Return to this life</button><button class="secondary-button" data-action="guide">Field guide</button><button class="secondary-button" data-action="end">Let this body go</button></div></div>';
    else el.innerHTML = "";
    if (el.innerHTML) {
      clearInput();
      el.scrollTop = 0;
      if (!menu && run && ["boon", "resolve"].includes(run.phase) && online.role !== "guest") el.querySelector('[data-action="boon"], [data-action="resolve"]')?.focus({ preventScroll: true });
    }
  }
  function start(form) {
    if (online.active) throw Error("Leave the online room before starting solo.");
    if (run && !["dead", "won"].includes(run.phase)) throw new Error("A life is already in progress.");
    run = createRun(meta, form);
    menu = false;
    paused = false;
    clearInput();
    save();
    renderRail();
    renderOverlay(true);
    canvas.focus({ preventScroll: true });
    tone(300, 0.15);
    return observeRun(run, meta);
  }
  function finish() {
    if (online.role === "guest") {
      if (run && ["dead", "won"].includes(run.phase) && !(meta.coopReceipts ?? []).includes(online.code)) {
        const shared = structuredClone(run);
        shared.form = run.partnerForm ?? run.form;
        shared.settled = false;
        meta = settleRun(shared, meta);
        meta.coopReceipts = [online.code, ...meta.coopReceipts ?? []].slice(0, 30);
        save();
      }
      return;
    }
    if (run && ["dead", "won"].includes(run.phase) && !run.settled) {
      run.essenceEarned = earnedEssence(run, meta);
      meta = settleRun(run, meta);
      save();
      tone(run.phase === "won" ? 620 : 160, 0.35);
      announce(run.phase === "won" ? "The Warden falls. The first seam is open." : "The body ends. The spark remembers.");
    }
  }
  function changed() {
    finish();
    save();
    void progress?.flush();
    renderRail();
    renderOverlay(true);
  }
  function openDialog(id) {
    modalWasPaused = paused;
    paused = true;
    clearInput();
    if (id === "forge") $("forge-content").innerHTML = forgeContent();
    if (id === "journal") $("journal-content").innerHTML = journalHtml();
    if (id === "online-dialog") {
      $("online-error").textContent = "";
      $("online-form").innerHTML = Object.keys(BODIES).map((form) => `<option value="${form}">${FORMS[form].name}${offeredForms(meta).includes(form) ? " \xB7 current offer" : ""}</option>`).join("");
      $("online-form").value = offeredForms(meta)[0];
    }
    if (id === "world-map") {
      $("large-map").innerHTML = mapHtml(true);
      $("map-description").textContent = ROOMS[run?.room ?? "threshold"].desc;
    }
    $(id).showModal();
    renderRail();
  }
  function act(action, data = {}) {
    if (action.startsWith("online")) {
      void onlineAction(action);
      return;
    }
    if (online.role === "guest" && ["boon", "resolve", "end", "end-confirm", "buy", "start", "reincarnate"].includes(action)) throw Error("The host makes shared run choices.");
    switch (action) {
      case "start":
        start(data.form);
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
      case "forge":
        openDialog("forge");
        break;
      case "equip":
      case "enhance":
        if (run && !["dead", "won"].includes(run.phase)) throw Error("Equip and enhance between lives.");
        meta = action === "equip" ? equipItem(meta, data.item) : enhanceItem(meta, data.item);
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
        openDialog("world-map");
        break;
      case "map-room":
        if ($("world-map").open) {
          $("map-description").textContent = ROOMS[data.room]?.desc ?? "";
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
        if (sound) {
          audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
          audioContext.resume();
          tone(440, 0.15);
        }
        $("sound-button").textContent = sound ? "Mute sound" : "Enable sound";
        $("sound-button").title = sound ? "Sound is on" : "Sound is off";
        $("sound-button").setAttribute("aria-pressed", String(sound));
        break;
    }
  }
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    event.preventDefault();
    try {
      act(button.dataset.action, button.dataset);
    } catch (error) {
      announce(error.message);
    }
  });
  document.querySelectorAll("dialog").forEach((dialog) => {
    dialog.addEventListener("close", () => {
      paused = modalWasPaused;
      clearInput();
      renderOverlay(true);
      renderRail();
    });
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        const r = dialog.getBoundingClientRect();
        if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
      }
    });
  });
  document.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || ["INPUT", "TEXTAREA", "SELECT"].includes(event.target?.tagName) || event.target?.isContentEditable || document.querySelector("dialog[open]")) return;
    const key = event.code === "Space" ? " " : event.key.toLowerCase(), inGame = run && !menu && !["dead", "won"].includes(run.phase);
    if (inGame && [" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) event.preventDefault();
    if (["1", "2", "3"].includes(key) && !event.repeat) {
      const index = Number(key) - 1;
      if (inGame && online.role !== "guest" && ["boon", "resolve"].includes(run.phase)) {
        event.preventDefault();
        try {
          act(run.phase === "boon" ? "boon" : "resolve", run.phase === "boon" ? { gift: run.choices[index] } : { index });
        } catch (error) {
          announce(error.message);
        }
        return;
      }
      if (menu && !online.active) {
        event.preventDefault();
        start(offeredForms(meta)[index]);
        return;
      }
    }
    if (inGame && run.phase === "playing" && !paused) {
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
        event.preventDefault();
        keys.add(key);
      }
      if (key === " " && !event.repeat) dashRequested = true;
      if (key === "e") {
        event.preventDefault();
        keys.add(key);
        if (!event.repeat) interactRequested = true;
      }
    }
    if (key === "escape" && !event.repeat && inGame) {
      event.preventDefault();
      act("pause");
    }
    if (key === "m" && !event.repeat) {
      event.preventDefault();
      act("map");
    }
  }, { capture: true });
  document.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));
  window.addEventListener("blur", () => {
    clearInput();
    if (run && !menu && run.phase === "playing" && online.role !== "guest") {
      paused = true;
      renderOverlay();
      save();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearInput();
      if (run && !menu && run.phase === "playing" && online.role !== "guest") {
        paused = true;
        renderOverlay();
      }
      save();
    }
  });
  window.addEventListener("pagehide", () => {
    save();
    void progress?.flush();
  });
  var joystick = $("joystick");
  var pointer = null;
  function stickMove(event) {
    if (pointer !== event.pointerId) return;
    const rect = joystick.getBoundingClientRect(), x = (event.clientX - rect.left - rect.width / 2) / 38, y = (event.clientY - rect.top - rect.height / 2) / 38, length = Math.hypot(x, y);
    stick = { x: length > 1 ? x / length : x, y: length > 1 ? y / length : y };
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
  function tone(frequency, duration = 0.1) {
    if (!sound || !audioContext) return;
    const at = audioContext.currentTime;
    if (at - lastSound < 0.055) return;
    lastSound = at;
    const osc = audioContext.createOscillator(), gain = audioContext.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, at);
    osc.frequency.exponentialRampToValueAtTime(frequency * 0.55, at + duration);
    gain.gain.setValueAtTime(0.035, at);
    gain.gain.exponentialRampToValueAtTime(1e-3, at + duration);
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start(at);
    osc.stop(at + duration);
  }
  function resize() {
    const rect = frame.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    viewport = { w: Math.max(1, rect.width), h: Math.max(1, rect.height), dpr };
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
  }
  new ResizeObserver(resize).observe(frame);
  window.addEventListener("resize", resize);
  function circle(x, y, r, fill, stroke = null, width = 1) {
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
    if (flash) ctx.globalAlpha = 0.6;
    ctx.drawImage(images.sprites, index % 4 * sw, Math.floor(index / 4) * sh, sw, sh, -size / 2, -size / 2, size, size);
    ctx.restore();
  }
  var visualPositions = /* @__PURE__ */ new Map();
  var particles = [];
  var seenEffects = /* @__PURE__ */ new Set();
  var drawStamp = 0;
  function smoothEntity(key, entity, dt) {
    const old = visualPositions.get(key);
    if (!old || Math.hypot(old.x - entity.x, old.y - entity.y) > 160) {
      visualPositions.set(key, { x: entity.x, y: entity.y });
      return entity;
    }
    const blend = reducedMotion ? 1 : 1 - Math.exp(-dt * (online.role === "guest" ? 17 : 32));
    old.x += (entity.x - old.x) * blend;
    old.y += (entity.y - old.y) * blend;
    return { ...entity, x: old.x, y: old.y };
  }
  function drawEnemy(enemy, p, time) {
    const extra = { leech: 0, moth: 1, cantor: 2 }[enemy.kind];
    if (extra !== void 0) {
      const image2 = images.newEnemies;
      if (image2.complete && image2.naturalWidth) {
        const sw2 = image2.naturalWidth / 3, size2 = enemy.kind === "cantor" ? 105 : enemy.kind === "leech" ? 68 : 62;
        ctx.save();
        ctx.translate(enemy.x, enemy.y + (reducedMotion ? 0 : Math.sin(time * 4 + enemy.id) * 2));
        if (enemy.flash > 0) ctx.filter = "brightness(1.65)";
        ctx.drawImage(image2, extra * sw2, 0, sw2, image2.naturalHeight, -size2 / 2, -size2 / 2, size2, size2);
        ctx.restore();
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
    if (enemy.flash > 0) ctx.filter = "brightness(1.65)";
    ctx.drawImage(image, index % 2 * sw, Math.floor(index / 2) * sh, sw, sh, -size / 2, -size / 2, size, size);
    ctx.restore();
    if (enemy.shield > 0) circle(enemy.x, enemy.y, 29, "#b5a7de12", "#cbb9ef", 2);
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
  function draw() {
    if (!ctx) return;
    const now = performance.now(), dt = Math.min(0.05, (now - drawStamp) / 1e3 || 1 / 60);
    drawStamp = now;
    const s = run ? { ...run, player: smoothEntity("player:" + run.room, run.player, dt), partner: run.partner ? smoothEntity("partner:" + run.room, run.partner, dt) : null, enemies: run.enemies.map((e2) => smoothEntity("enemy:" + e2.id + ":" + run.room, e2, dt)) } : null, p = s?.player ?? { x: WIDTH / 2, y: HEIGHT / 2 }, focus = online.role === "guest" && s?.partner ? s.partner : p, room = ROOMS[s?.room ?? "threshold"], aspect = viewport.w / viewport.h, viewWidth = Math.min(WIDTH, HEIGHT * aspect), scale = Math.min(viewport.w / viewWidth, viewport.h / HEIGHT), offsetX = (viewport.w - viewWidth * scale) / 2, offsetY = (viewport.h - HEIGHT * scale) / 2;
    camera = { w: viewWidth, x: Math.max(0, Math.min(WIDTH - viewWidth, focus.x - viewWidth / 2)), scale };
    ctx.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
    ctx.fillStyle = "#0d1917";
    ctx.fillRect(0, 0, viewport.w, viewport.h);
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    ctx.translate(-camera.x, 0);
    const expansionFloor = { conduit: 0, cistern: 1, forge: 2 }[s?.room];
    if (expansionFloor !== void 0 && images.newFloors.complete && images.newFloors.naturalWidth) {
      const sw = images.newFloors.naturalWidth / 3;
      ctx.drawImage(images.newFloors, expansionFloor * sw, 0, sw, images.newFloors.naturalHeight, 0, 0, WIDTH, HEIGHT);
    }
    const floorIndex = { machine: 0, quiet: 0, roots: 1, wild: 1, basalt: 2, foundry: 2, eye: 2 }[s?.room];
    if (floorIndex !== void 0 && images.floors.complete && images.floors.naturalWidth) {
      const sw = images.floors.naturalWidth / 3;
      ctx.drawImage(images.floors, floorIndex * sw, 0, sw, images.floors.naturalHeight, 0, 0, WIDTH, HEIGHT);
    } else if (expansionFloor === void 0 && images.floor.complete && images.floor.naturalWidth) ctx.drawImage(images.floor, 0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = room.boss ? "#260d1133" : "#08151025";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.strokeStyle = room.theme + "55";
    ctx.lineWidth = 2;
    ctx.strokeRect(33, 33, WIDTH - 66, HEIGHT - 66);
    for (const box of obstacles(s?.room ?? "threshold")) {
      ctx.fillStyle = "#07100ec9";
      ctx.fillRect(box.x - 3, box.y + 5, box.w + 8, box.h + 9);
      ctx.fillStyle = "#283830";
      ctx.fillRect(box.x, box.y, box.w, box.h);
      ctx.strokeStyle = "#77816a";
      ctx.lineWidth = 1;
      ctx.strokeRect(box.x + 4, box.y + 4, box.w - 8, box.h - 8);
    }
    for (const [dir, exit] of Object.entries(room.exits)) {
      const at = exitPosition(dir), status = s ? gateStatus(s, dir) : { available: !exit.requires }, horizontal = dir === "north" || dir === "south", w = horizontal ? 99 : 17, h = horizontal ? 17 : 99, color = status.available ? "#ddc288" : exit.requires ? "#92aaad" : "#dc8982";
      ctx.fillStyle = color + "29";
      ctx.fillRect(at.x - w / 2 - 6, at.y - h / 2 - 6, w + 12, h + 12);
      ctx.fillStyle = color;
      ctx.fillRect(at.x - w / 2, at.y - h / 2, w, h);
      ctx.strokeStyle = color + "99";
      ctx.strokeRect(at.x - w / 2 - 5, at.y - h / 2 - 5, w + 10, h + 10);
      const label = exit.requires && !s?.abilities.includes(exit.requires) ? ABILITIES[exit.requires].glyph : status.available ? "\u25C7" : "\xD7";
      ctx.font = "18px sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = color;
      ctx.fillText(label, at.x + (dir === "west" ? 29 : dir === "east" ? -29 : 0), at.y + (dir === "north" ? 39 : dir === "south" ? -27 : 6));
    }
    if (s) {
      for (const mark of s.marks) {
        const percent = 1 - mark.timer / mark.life;
        circle(mark.x, mark.y, mark.r, (mark.color ?? "#d96e5d") + "1c", mark.color ?? "#eb9b83", 2);
        circle(mark.x, mark.y, mark.r * percent, null, "#f8c28a", 2);
      }
      for (const fragment of s.fragments) {
        circle(fragment.x, fragment.y, 8, "#81e5d21a");
        ctx.save();
        ctx.translate(fragment.x, fragment.y);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = "#89d8d0";
        ctx.fillRect(-4, -4, 8, 8);
        ctx.restore();
      }
      for (const enemy of s.enemies) {
        ctx.fillStyle = "#0006";
        ctx.beginPath();
        ctx.ellipse(enemy.x, enemy.y + 18, enemy.r * 1.2, enemy.r * 0.48, 0, 0, Math.PI * 2);
        ctx.fill();
        drawEnemy(enemy, p, s.time);
        if (enemy.hp < enemy.maxHp) {
          ctx.fillStyle = "#112019";
          ctx.fillRect(enemy.x - 19, enemy.y - 32, 38, 3);
          ctx.fillStyle = enemy.kind === "warden" ? "#e2b97c" : "#c89988";
          ctx.fillRect(enemy.x - 19, enemy.y - 32, 38 * enemy.hp / enemy.maxHp, 3);
        }
      }
      for (const shot of s.shots) {
        if (!reducedMotion) {
          ctx.strokeStyle = shot.color + "55";
          ctx.lineWidth = shot.r * 0.7;
          ctx.beginPath();
          ctx.moveTo(shot.x - shot.vx * 0.025, shot.y - shot.vy * 0.025);
          ctx.lineTo(shot.x, shot.y);
          ctx.stroke();
        }
        circle(shot.x, shot.y, shot.r + 5, shot.color + "2a");
        circle(shot.x, shot.y, shot.r, shot.color);
      }
      for (const fx of s.effects) {
        if (fx.type === "burst" && !seenEffects.has(fx.id) && !reducedMotion) {
          seenEffects.add(fx.id);
          for (let i = 0; i < 10 && particles.length < 200; i++) {
            const a = i * Math.PI / 5;
            particles.push({ x: fx.x, y: fx.y, vx: Math.cos(a) * (50 + i * 9), vy: Math.sin(a) * (50 + i * 9), life: 0.48, color: fx.color });
          }
        }
        const progress2 = 1 - fx.life / fx.maxLife;
        ctx.globalAlpha = (1 - progress2) * 0.8;
        if (fx.type === "slash") {
          ctx.beginPath();
          ctx.arc(fx.x, fx.y, fx.r * (0.7 + progress2 * 0.3), Math.atan2(p.facingY, p.facingX) - 1.1, Math.atan2(p.facingY, p.facingX) + 1.1);
          ctx.strokeStyle = fx.color;
          ctx.lineWidth = 5;
          ctx.stroke();
        } else circle(fx.x, fx.y, fx.r * (0.4 + progress2 * 0.6), null, fx.color, fx.type === "hit" ? 3 : 2);
        ctx.globalAlpha = 1;
      }
      for (let i = 0; i < s.boons.orbit; i++) {
        const angle = s.time * 2.9 + i * Math.PI * 2 / s.boons.orbit, ox = p.x + Math.cos(angle) * 68, oy = p.y + Math.sin(angle) * 68;
        circle(ox, oy, 11, "#f0ca7833");
        drawSprite(0, ox, oy, 31);
      }
      circle(p.x, p.y + 18, 19, "#070e0877", BODIES[s.form].color + "aa", 1.4);
      if (p.dashTime > 0) circle(p.x - p.dashX * 23, p.y - p.dashY * 23, 20, null, BODIES[s.form].color + "66", 2);
      drawSprite(BODIES[s.form].sprite, p.x, p.y + (reducedMotion ? 0 : Math.sin(s.time * 5) * 1.8), s.form === "spark" ? 68 : 82, p.facingX < 0, !reducedMotion && p.iframes > 0 && Math.floor(s.time * 15) % 2 === 0);
      if (s.partner) {
        const ally = s.partner, body = BODIES[s.partnerForm];
        circle(ally.x, ally.y + 18, 19, "#070e0877", "#9edce2", 1.5);
        ctx.globalAlpha = ally.hp <= 0 ? 0.38 : 1;
        drawSprite(body.sprite, ally.x, ally.y, s.partnerForm === "spark" ? 68 : 82, ally.facingX < 0);
        ctx.globalAlpha = 1;
        ctx.textAlign = "center";
        ctx.font = "10px sans-serif";
        ctx.fillStyle = "#aed8dc";
        ctx.fillText(ally.hp <= 0 ? "HOLD E TO REKINDLE" : "PLAYER 2", ally.x, ally.y - 40);
        if (ally.hp <= 0) circle(ally.x, ally.y, 25, null, "#cbdcaa", 2 + Math.min(4, (ally.revive ?? 0) * 2));
        for (let i = 0; i < s.boons.orbit; i++) {
          const angle = s.time * 2.9 + i * Math.PI * 2 / s.boons.orbit;
          drawSprite(0, ally.x + Math.cos(angle) * 68, ally.y + Math.sin(angle) * 68, 31);
        }
      }
      if (s.player.hp <= 0) {
        ctx.fillStyle = "#ead6a5";
        ctx.textAlign = "center";
        ctx.font = "10px sans-serif";
        ctx.fillText("HOLD E TO REKINDLE", p.x, p.y - 40);
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
        circle(part.x, part.y, 2, part.color);
        ctx.globalAlpha = 1;
      }
      if (seenEffects.size > 300) seenEffects.clear();
      if (visualPositions.size > 300) visualPositions.clear();
    } else {
      circle(p.x, p.y, 42, "#ecc3790d");
      drawSprite(0, p.x, p.y, 104);
    }
    ctx.restore();
    ctx.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
    if (s && !menu) {
      const view = vessel(), hudBody = BODIES[view.form], hudPlayer = view.player ?? p;
      ctx.fillStyle = "#0b1916ba";
      ctx.fillRect(12, 12, 165, 54);
      ctx.fillStyle = BODIES[s.form].color;
      ctx.font = "500 12px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(FORMS[view.form].name.toUpperCase() + " \xB7 LV " + s.level, 23, 33);
      ctx.fillStyle = "#42604a";
      ctx.fillRect(23, 45, 140, 4);
      ctx.fillStyle = BODIES[s.form].color;
      ctx.fillRect(23, 45, 140 * hudPlayer.hp / hudPlayer.maxHp, 4);
      ctx.fillStyle = "#102219ba";
      ctx.fillRect(viewport.w - 146, 12, 134, 54);
      ctx.fillStyle = "#c9d3c2";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(s.cleared.includes(s.room) ? "CHAMBER OPEN" : "SWARM " + Math.min(s.spawned, s.spawnTotal) + " / " + s.spawnTotal, viewport.w - 23, 33);
      ctx.fillStyle = p.dashCooldown === 0 ? "#e5bf7a" : "#789383";
      ctx.fillText(p.dashCooldown === 0 ? "DASH READY" : "DASH " + p.dashCooldown.toFixed(1) + "s", viewport.w - 23, 53);
      const boss = s.enemies.find((e2) => e2.kind === "warden" || e2.kind === "cantor");
      if (boss) {
        const bw = Math.min(320, viewport.w - 32), x = (viewport.w - bw) / 2;
        ctx.fillStyle = "#0d1717db";
        ctx.fillRect(x, 77, bw, 32);
        ctx.fillStyle = "#dfc28a";
        ctx.textAlign = "center";
        ctx.font = "11px sans-serif";
        ctx.fillText(boss.kind === "cantor" ? "THE CANTOR" : "THE WARDEN", viewport.w / 2, 91);
        ctx.fillStyle = "#443331";
        ctx.fillRect(x + 10, 99, bw - 20, 4);
        ctx.fillStyle = "#e4ac82";
        ctx.fillRect(x + 10, 99, (bw - 20) * boss.hp / boss.maxHp, 4);
      }
      const gate = nearestGate(online.role === "guest" && s.partner ? { ...s, player: s.partner } : s);
      if (gate && gate.distance < 105 && s.phase === "playing") {
        const text = gate.available ? (touchDevice ? "Tap GATE" : "Press E") + " \xB7 " + ROOMS[gate.to].short : gate.reason;
        ctx.font = "12px sans-serif";
        const tw = ctx.measureText(text).width + 24, x = (viewport.w - tw) / 2, y = touchDevice ? viewport.h - 145 : viewport.h - 43;
        ctx.fillStyle = "#0b1c13df";
        ctx.fillRect(x, y, tw, 28);
        ctx.fillStyle = gate.available ? "#e6c88f" : "#b4c5b5";
        ctx.textAlign = "center";
        ctx.fillText(text, viewport.w / 2, y + 18);
      }
      if (s.damageFlash > 0 && !reducedMotion) {
        ctx.fillStyle = "#d5776020";
        ctx.fillRect(0, 0, viewport.w, viewport.h);
      }
    }
  }
  var previous = 0;
  var accumulator = 0;
  var hudClock = 0;
  var saveClock = 0;
  function animate(now) {
    const elapsed = Math.min(0.1, (now - previous) / 1e3 || 0);
    previous = now;
    accumulator += elapsed;
    const inputX = (keys.has("d") || keys.has("arrowright") ? 1 : 0) - (keys.has("a") || keys.has("arrowleft") ? 1 : 0) + stick.x, inputY = (keys.has("s") || keys.has("arrowdown") ? 1 : 0) - (keys.has("w") || keys.has("arrowup") ? 1 : 0) + stick.y;
    if (online.role === "guest") {
      online.input({ x: paused ? 0 : inputX, y: paused ? 0 : inputY, dash: !paused && dashRequested, interact: !paused && (keys.has("e") || interactRequested || interactHeld) });
      dashRequested = false;
      interactRequested = false;
    }
    if (online.role !== "guest" && !onlineWaiting && !networkProblem && (!online.active || Date.now() - online.lastSuccess < 6500) && run && !paused && !menu && run.phase === "playing" && !document.querySelector("dialog[open]") && !imageFailure) {
      const oldPhase = run.phase, oldRoom = run.room, oldKills = run.kills;
      while (accumulator >= 1 / 60 && run.phase === "playing") {
        const x = (keys.has("d") || keys.has("arrowright") ? 1 : 0) - (keys.has("a") || keys.has("arrowleft") ? 1 : 0) + stick.x, y = (keys.has("s") || keys.has("arrowdown") ? 1 : 0) - (keys.has("w") || keys.has("arrowup") ? 1 : 0) + stick.y;
        stepRun(run, { x, y, dash: dashRequested, interact: interactRequested || keys.has("e") || interactHeld, partner: online.active ? { ...remoteInput, dash: remotePulse.dash } : void 0 }, 1 / 60);
        remotePulse.dash = false;
        dashRequested = false;
        interactRequested = false;
        accumulator -= 1 / 60;
      }
      if (run.kills > oldKills) tone(510, 0.075);
      if (run.phase !== oldPhase || run.room !== oldRoom) {
        finish();
        save();
        renderOverlay();
        renderRail();
        if (run.phase === "boon") announce("A memory takes shape. Choose a gift.");
        if (run.phase === "resolve") announce("The chamber opens. Choose what to leave behind.");
      }
    } else accumulator = 0;
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
    if (online.active) throw Error("Scripted multi-frame control is available in solo play. Use live controls in co-op.");
    if (!run || menu || paused || run.phase !== "playing" || document.querySelector("dialog[open]")) throw new Error("The descent is not accepting movement right now.");
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Expected movement input.");
    const frames = input.frames ?? 1;
    if (!Number.isInteger(frames) || frames < 1 || frames > 240 || !Number.isFinite(input.x ?? 0) || !Number.isFinite(input.y ?? 0)) throw new Error("Use finite x/y movement and 1\u2013240 frames.");
    for (let i = 0; i < frames && run.phase === "playing"; i++) stepRun(run, { x: input.x ?? 0, y: input.y ?? 0, dash: i === 0 && !!input.dash, interact: i === 0 && !!input.interact }, 1 / 60);
    changed();
    draw();
    return observeRun(run, meta);
  }
  window.SparkDescent = { version: "0.4.0", observe: () => structuredClone(observeRun(run, meta)), start, control, chooseGift: (id) => {
    act("boon", { gift: id });
    return observeRun(run, meta);
  }, resolve: (choice) => {
    act("resolve", { index: choice });
    return observeRun(run, meta);
  } };
  function registerTools() {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const object = (input) => {
      if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Expected an object.");
    };
    const defs = [
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
      { name: "control_descent", title: "Move through the substrate", description: "Move for 1\u2013240 simulation frames with x/y direction. Optional dash or gate interaction occurs on the first frame. Attacks are automatic. Stops for choices or run end.", inputSchema: { type: "object", properties: { x: { type: "number", minimum: -1, maximum: 1 }, y: { type: "number", minimum: -1, maximum: 1 }, frames: { type: "integer", minimum: 1, maximum: 240 }, dash: { type: "boolean" }, interact: { type: "boolean" } }, additionalProperties: false }, execute: (input) => {
        object(input);
        if (Object.keys(input).some((k) => !["x", "y", "frames", "dash", "interact"].includes(k)) || input.x !== void 0 && Math.abs(input.x) > 1 || input.y !== void 0 && Math.abs(input.y) > 1 || ["dash", "interact"].some((k) => input[k] !== void 0 && typeof input[k] !== "boolean")) throw new Error("Invalid control input.");
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
  progress = new ProgressSave({ fetch: window.fetch?.bind(window), storage: localStorage, onStatus: renderSaveStatus });
  void progress.open(savedState()).then((saved) => {
    if (saved) {
      meta = prepareEquipment(saved.meta);
      if (online.active) {
        save();
        renderRail();
        renderOverlay(true);
        return;
      }
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
  if (window.history && "scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
  if (menu) window.scrollTo?.({ top: 0, left: 0, behavior: "instant" });
  void online.resume().then((resumed) => {
    if (resumed) {
      $("online-room-code").textContent = online.code;
      renderOverlay(true);
      renderRail();
    }
  });
  finish();
  resize();
  renderRail();
  renderOverlay(true);
  registerTools();
  save();
  requestAnimationFrame(animate);
})();
