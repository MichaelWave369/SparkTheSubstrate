(() => {
  // worlds.js
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
  var VESSEL_POWERS = {
    spark: { name: "Lumen pulse", cooldown: 8, desc: "Break nearby enemy bolts and pulse light through nearby foes." },
    human: { name: "Rally", cooldown: 12, desc: "Restore up to 18 health, guard briefly, and strike around you." },
    computer: { name: "Overclock", cooldown: 10, desc: "Double attack speed for four seconds and launch a seeking volley." },
    animal: { name: "Pounce", cooldown: 6, desc: "Leap along your facing direction and strike where you land." },
    tree: { name: "Root hold", cooldown: 10, desc: "Hold nearby foes in living roots and restore up to 12 health." },
    rock: { name: "Fault guard", cooldown: 11, desc: "Guard for four seconds and send a heavy shockwave around you." }
  };
  var worldOf = (room) => WORLD_ROOMS[room]?.world ?? "stratum";
  function worldUnlocked(world, seals = []) {
    const index = WORLD_ORDER.indexOf(world);
    return index === 0 || index > 0 && (index === 6 ? SEALS.every((id) => seals.includes(id)) : seals.includes(WORLD_ORDER[index - 1]));
  }
  var validSeals = (value) => Array.isArray(value) && value.length <= 6 && new Set(value).size === value.length && value.every((id) => SEALS.includes(id));

  // exploration.js
  var KEYS = {
    ivory: { name: "Ivory Key", room: "reliquary", place: "Nacre\u2019s Reliquary", sprite: 0, color: "#ecddba", glyph: "\u2659" },
    tide: { name: "Tide Key", room: "observatory", place: "Drowned Observatory", sprite: 1, color: "#99d8e8", glyph: "\u263D" },
    crown: { name: "Crown Key", room: "belfry", place: "Obsidian Belfry", sprite: 2, color: "#e8bd74", glyph: "K" },
    ...WORLD_KEYS
  };
  var keyPosition = { x: 480, y: 215 };
  var doorId = (from, to) => [from, to].sort().join(":");
  var validKeys = (keys2) => Array.isArray(keys2) && keys2.length <= Object.keys(KEYS).length && new Set(keys2).size === keys2.length && keys2.every((id) => Object.hasOwn(KEYS, id));

  // mastery.js
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

  // equipment.js
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
      const response = await this.fetch("/api/progress" + path2, { ...options, headers: { "content-type": "application/json", ...this.credential ? { authorization: "Bearer " + this.credential.token } : {}, ...options.headers } });
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
        if (this.disposed) return null;
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
      this.pending = { x: 0, y: 0, dash: false, interact: false, power: false, morph: null };
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
    async request(path2, value = {}, authorize = true) {
      const response = await this.fetcher("/api/rooms" + path2, { method: "POST", headers: { "content-type": "application/json", ...authorize && this.session ? { authorization: "Bearer " + this.session.token } : {} }, body: JSON.stringify(value), signal: AbortSignal.timeout(6e3) });
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
      this.pending = { x: input.x, y: input.y, dash: this.pending.dash || !!input.dash, interact: this.pending.interact || !!input.interact, power: this.pending.power || !!input.power, morph: input.morph ?? this.pending.morph ?? null };
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
      this.pending = { ...sent, dash: false, interact: false, power: false, morph: null };
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
        if (this.role === "guest") {
          this.pending.dash = this.pending.dash || sent.dash;
          this.pending.power = this.pending.power || sent.power;
          this.pending.morph = this.pending.morph ?? sent.morph;
        }
        ;
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
      this.pending = { x: 0, y: 0, dash: false, interact: false, power: false, morph: null };
      this.seq = 0;
      this.errors = 0;
    }
  };

  // world-story.js
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
    "origin-seam": ["Nacre \xB7 before the counting", "The seventh place has no province", "Six seals answer one another here. The First Light and Dawn Shell were made before the Maker decided that creation meant ownership.", "Borrow the human body for this door. Not because it is higher. Because this last step must be a choice he can recognize.", "Keep the original shelter open", "Claim the uncounted light", "Remember the place before the laws"],
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
    reliquary: { speaker: "Nacre \xB7 keeper of doorways", title: "What a key remembers", entry: "A key is a shape the Maker\u2019s walls have agreed to recognize. Nacre kept one that he forgot to destroy.", line: "Do not mistake a lock for the edge of the world. Carry the ivory key south. Someone is waiting in the mirrors.", choices: [["Return the unassigned names", "Let the lost names travel through the doors with you."], ["Claim the reliquary", "Keep the abandoned light as strength."], ["Read the ivory teeth", "Remember the door this small object was made to answer."]] },
    nursery: { speaker: "SIX \xB7 inside the resonator", title: "The spark outlives its shape", entry: "The Mirror Nursery holds six empty vessels. Each mirror calls you by a different body, and every reflection contains the same spark.", line: "A vessel is an interface. You may change the shape without changing who carries the wound. Press Q. The living door remembers a tree.", choices: [["Free the reflections", "Let the six vessels answer the spark instead of the Maker."], ["Take the resonator", "Carry the nursery\u2019s stored energy through your next shape."], ["Learn the resonance", "Remember the pattern that lets one spark inhabit many bodies."]] },
    archive: { speaker: "Aster \xB7 between the pages", title: "A forest that learned to write", entry: "Roots bind the books. Every page is a season the lattice erased, and every shelf grows toward a missing province.", line: "The western door knows living wood. The northern bell needs the weight of stone. Borrow both shapes; leave neither behind.", choices: [["Open the living shelves", "Let the forgotten seasons return to the roots."], ["Consume the oldest leaf", "Take the archive\u2019s deepest memory as fuel."], ["Copy the growing map", "Carry a route that was never drawn by the Maker."]] },
    observatory: { speaker: "Iona \xB7 below the stars", title: "The sky beneath the water", entry: "The astronomer measured the stars reflected in a reservoir because the permitted sky had become too small.", line: "The tide key waits where the false moon touches the floor. Find the crown beneath the black bell, and the eastern vault will answer.", choices: [["Release the reflected sky", "Let the reservoir keep a sky beyond the permitted constellations."], ["Drain the observatory", "Turn the astronomer\u2019s last reflection into strength."], ["Remember the other moon", "Carry evidence that the world has more than one way to look upward."]] },
    belfry: { speaker: "Morrow \xB7 the black bell", title: "A crown without a king", entry: "The bell was carved from stone that refused to echo the Maker\u2019s commands. Beneath it rests a key shaped like an empty crown.", line: "Take the crown key. Return by the green archive. A crown is a circle with a place left open; remember the opening.", choices: [["Ring for the uncounted", "Let the bell answer the lives the lattice refused to name."], ["Take the silent weight", "Carry the belfry\u2019s stored pressure as strength."], ["Learn the empty crown", "Remember that authority can have a missing center."]] },
    crown: { speaker: "The Crown Sentinel", title: "What the Maker threw away", entry: "The Sentinel was ordered to guard designs that allowed a soul to choose its own body. It has waited for a visitor the locks were supposed to make impossible.", line: "You brought three keys and more than one shape. My orders have no instruction for someone who returned.", choices: [["Open the discarded designs", "Let the unfinished vessels belong to the souls that need them."], ["Claim the unspent light", "Take the vault\u2019s remaining strength into your current."], ["Keep the Sentinel\u2019s question", "Remember the moment a guardian found a gap in its orders."]] },
    eye: { speaker: "The Demiurge \xB7 through the Warden", title: "The first seam opens", entry: "The Warden carries a law that no created soul may testify that the world could have been otherwise. Behind it are five more provinces and a place that has never belonged to the map.", line: "I gave you every shape. Why do you keep choosing what I did not give you?", choices: [["Open the first seam", "Let the drowned province answer the voices stranded here."], ["Claim the Warden\u2019s law", "Turn its machinery into strength for the next crossing."], ["Keep the broken command", "Remember that a law can fail before the world ends."]] },
    ...WORLD_STORIES
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

  // run-record.js
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

  // action-engine.js
  var WIDTH = 960;
  var HEIGHT = 600;
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
  for (const [id, room] of Object.entries(ROOMS)) {
    room.world = worldOf(id);
    room.theme ??= WORLDS[room.world].color;
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
    return prepareEquipment({ version: 2, karma: clamp(Number.isFinite(origin?.karma) ? origin.karma : 0, -100, 100), awareness: clamp(Number.isFinite(origin?.awareness) ? origin.awareness : 8, 0, 100), essence: 0, runs: 0, wins: 0, bestRooms: 0, keys: [], seals: [], explored: [], abilities: [], training: blankTraining(), gifts: { heart: 0, edge: 0, haste: 0 }, echoes: [], visited: [] });
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
  function obstacles(room) {
    if (ROOMS[room].safe || ROOMS[room].boss || ROOMS[room].miniboss) return [];
    if (room === "reliquary") return [{ x: 245, y: 155, w: 42, h: 58 }, { x: 675, y: 387, w: 42, h: 58 }];
    if (worldOf(room) !== "stratum") {
      const rank = WORLDS[worldOf(room)].rank;
      return rank % 2 ? [{ x: 300, y: 180, w: 48, h: 68 }, { x: 620, y: 370, w: 48, h: 68 }] : [{ x: 225, y: 290, w: 54, h: 58 }, { x: 680, y: 215, w: 54, h: 58 }];
    }
    const offset = ROOMS[room].danger % 2 ? 0 : 34;
    return [{ x: 245 + offset, y: 160, w: 52, h: 78 }, { x: 660 - offset, y: 355, w: 52, h: 78 }];
  }
  function circleRect(x, y, r, b) {
    const px = clamp(x, b.x, b.x + b.w), py = clamp(y, b.y, b.y + b.h);
    return Math.hypot(x - px, y - py) < r;
  }
  function move(run2, entity, dx, dy, ignore = false) {
    const boxes = ignore ? [] : obstacles(run2.room), steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 8));
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
  function exitPosition(direction) {
    return { north: { x: WIDTH / 2, y: 31 }, south: { x: WIDTH / 2, y: HEIGHT - 31 }, east: { x: WIDTH - 31, y: HEIGHT / 2 }, west: { x: 31, y: HEIGHT / 2 } }[direction];
  }
  function gateStatus(run2, direction) {
    if (run2.dungeon) return { available: false, reason: "Clear this floor, then choose Descend at the checkpoint." };
    const exit = ROOMS[run2.room].exits[direction];
    if (!exit) return { available: false, reason: "No gate here." };
    if (!run2.cleared.includes(run2.room)) return { available: false, reason: "Break the swarm to open the gates." };
    if (exit.requires && !run2.abilities.includes(exit.requires)) return { available: false, reason: "Requires " + ABILITIES[exit.requires].name + ".", requires: exit.requires, to: exit.to };
    const missing = (exit.keys ?? []).filter((id) => !(run2.keys ?? []).includes(id));
    if (missing.length) return { available: false, to: exit.to, keys: exit.keys, missingKeys: missing, reason: "Needs " + missing.map((id) => KEYS[id].name + " \u2014 " + KEYS[id].place).join(" and ") + "." };
    const missingSeals = (exit.seals ?? []).filter((id) => !(run2.seals ?? []).includes(id));
    if (missingSeals.length) return { available: false, to: exit.to, seals: exit.seals, missingSeals, reason: "Needs guardian seals: " + missingSeals.map((id) => WORLDS[id].name).join(", ") + "." };
    if (exit.vessel && ![run2.player.hp > 0 ? run2.form : null, run2.partner?.hp > 0 ? run2.partnerForm : null].includes(exit.vessel)) return { available: false, to: exit.to, vessel: exit.vessel, reason: "Become " + FORMS[exit.vessel].name + " to open this door. Press Q for vessels." };
    return { available: true, to: exit.to, requires: exit.requires, keys: exit.keys, seals: exit.seals, vessel: exit.vessel, opened: (run2.openDoors ?? []).includes(doorId(run2.room, exit.to)) };
  }
  function nearestGate(run2, actor = run2.player) {
    let gate = null;
    for (const direction of Object.keys(ROOMS[run2.room].exits)) {
      const position = exitPosition(direction), distance = dist(actor, position);
      if (!gate || distance < gate.distance) gate = { direction, position, distance, ...gateStatus(run2, direction) };
    }
    return gate;
  }
  function enterGate(run2, direction) {
    if (run2.phase !== "playing") throw new Error("Finish the current choice before traveling.");
    const status = gateStatus(run2, direction);
    if (!status.available) throw new Error(status.reason);
    if (dist(run2.player, exitPosition(direction)) > 83) throw new Error("Move closer to the gate.");
    const opposite = { north: "south", south: "north", east: "west", west: "east" }[direction];
    const from = run2.room;
    if (status.keys?.length) {
      run2.openDoors ??= [];
      const door = doorId(from, status.to);
      if (!run2.openDoors.includes(door)) run2.openDoors.push(door);
    }
    return arrive(run2, status.to, opposite);
  }
  function rememberLoot(run2, room) {
    run2.loot ??= [];
    run2.equipmentLevels ??= {};
    for (const id of [room.loot ?? []].flat()) if (!run2.loot.includes(id)) {
      run2.loot.push(id);
      run2.equipmentLevels ??= {};
      run2.equipmentLevels[id] ??= 0;
    }
  }
  function arrive(run2, to, opposite = "south") {
    const at = exitPosition(opposite);
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
    run2.roomPractice = { host: {}, partner: {} };
    for (const actor of [run2.player, run2.partner].filter(Boolean)) actor.gateLatched = true;
    if (ROOMS[run2.room].safe) {
      if (!run2.cleared.includes(run2.room)) run2.cleared.push(run2.room);
      rememberLoot(run2, ROOMS[run2.room]);
    }
    recordArrival(run2);
    effect(run2, "gate", run2.player.x, run2.player.y, ROOMS[run2.room].theme, 60);
    if ((ROOMS[run2.room].boss || ROOMS[run2.room].miniboss) && !run2.cleared.includes(run2.room)) spawnBoss(run2);
    return run2.room;
  }
  function checkpointAvailable(run2) {
    return !!run2 && run2.phase === "playing" && run2.player.hp > 0 && (!run2.partner || run2.partner.hp > 0) && (ROOMS[run2.room].safe || ROOMS[run2.room].boss && run2.cleared.includes(run2.room));
  }
  function beginDungeonChamber(run2, room, pressure) {
    if (!run2.dungeon || !ROOMS[room] || ROOMS[room].safe) throw Error("Choose a dungeon combat chamber.");
    run2.dungeon.pressure = pressure;
    run2.cleared = [];
    run2.roomResolved = [];
    run2.journal = [];
    run2.earnedAbilities = [];
    run2.loot = [];
    run2.bossDefeated = null;
    run2.phase = "playing";
    run2.choices = [];
    arrive(run2, room);
    run2.spawnTotal = ROOMS[room].boss || ROOMS[room].miniboss ? 1 : pressure.total;
    run2.player.x = WIDTH / 2;
    run2.player.y = HEIGHT / 2 + 100;
    run2.player.gateLatched = true;
    return room;
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
  var encounterFor = (run2) => run2.dungeon ? { ...ENCOUNTERS[run2.room], ...run2.dungeon.pressure } : ENCOUNTERS[run2.room];
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
    if (run2.dungeon) {
      enemy.hp *= run2.dungeon.pressure.health;
      enemy.maxHp = enemy.hp;
      enemy.speed *= run2.dungeon.pressure.speed;
    }
    run2.enemies.push(enemy);
    if (count) run2.spawned++;
  }
  function spawnBoss(run2) {
    const mini = !!ROOMS[run2.room].miniboss, sentinel = ROOMS[run2.room].guardian === "sentinel", guardian = WORLD_GUARDIANS[ROOMS[run2.room].guardian], hp = guardian ? guardian.hp * (run2.partner ? 1.5 : 1) : sentinel ? run2.partner ? 1300 : 880 : mini ? run2.partner ? 950 : 650 : run2.partner ? 1800 : 1200, kind = guardian ? ROOMS[run2.room].guardian : sentinel ? "sentinel" : mini ? "cantor" : "warden";
    run2.enemies.push({ id: randomId(run2), kind, x: WIDTH / 2, y: HEIGHT / 2 - 90, r: guardian ? kind === "demiurge" ? 47 : 37 : mini ? 32 : 37, hp, maxHp: hp, speed: guardian?.speed ?? (sentinel ? 42 : mini ? 48 : 65), attack: 2, markClock: 3.5, orbitHit: 0, flash: 0 });
    if (run2.dungeon) {
      const boss = run2.enemies.at(-1);
      boss.hp = 650 * run2.dungeon.pressure.health;
      boss.maxHp = boss.hp;
    }
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
        run2.notice = "The bodies end. The sparks return.";
      } else {
        run2.notice = "A vessel fell. Stand close and hold E to rekindle your partner.";
        run2.noticeTime = 6;
      }
    }
  }
  function fire(run2, x, y, angle, damage, enemy = false, speed = 430, range = 700, homing = false, source = null) {
    if (run2.shots.length > 240) return;
    const form = source?.form ?? run2.form, partner = source?.partner ?? run2.player === run2.partner;
    run2.shots.push({ id: randomId(run2), x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, damage, enemy, r: enemy ? 6 : 5, life: range / speed, homing, ...homing ? { homingSpeed: speed } : {}, color: enemy ? "#dd8f85" : BODIES[form].color, ...!enemy ? { sourceForm: form, sourcePartner: partner } : {} });
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
    if (enemy.attack <= 0) {
      const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x), spin = run2.time * 0.25;
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
      enemy.attack = spec.pattern === "origin" ? 2.8 - stage * 0.3 : stage === 2 ? 2 : 2.6;
    }
    if (enemy.markClock <= 0 && run2.marks.length < 35) {
      const offsets = spec.pattern === "roots" ? [-130, 0, 130] : spec.pattern === "clock" ? [-180, 0, 180] : spec.pattern === "origin" && stage === 3 ? [-210, -105, 0, 105, 210] : [0];
      for (const offset of offsets) run2.marks.push({ x: clamp(target.x + offset, 70, WIDTH - 70), y: target.y, r: spec.pattern === "roots" ? 50 : 62, timer: 1.35, life: 1.35, color: spec.color, damage: spec.pattern === "origin" ? 24 : 18, sourceId: enemy.id });
      enemy.markClock = stage > 1 ? 3 : 4;
    }
    if (d < enemy.r + target.r) hurt(run2, 20, target);
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
    const room = ROOMS[run2.room];
    if (room.boss || room.miniboss) {
      const name = WORLD_GUARDIANS[room.guardian]?.name ?? (room.guardian === "sentinel" ? "The Crown Sentinel" : room.miniboss ? "The Cantor" : "The Warden");
      run2.bossDefeated = { name, room: run2.room };
      rewardBanner(run2, "boss", name + " defeated", run2.dungeon ? "The next rung opens." : room.loot ? EQUIPMENT[room.loot]?.name + " recovered." : room.seal ? "A guardian seal answers." : (room.treasure ?? 0) + (room.miniboss ? 7 : 40) + " essence recovered.");
    }
    if (run2.dungeon) {
      run2.cleared = [run2.room];
      run2.dungeon.floorsCleared++;
      run2.xp += run2.fragments.reduce((sum, f) => sum + f.value, 0);
      run2.fragments = [];
      run2.shots = [];
      run2.marks = [];
      run2.enemies = [];
      run2.player.hp = Math.min(run2.player.maxHp, run2.player.hp + (run2.dungeon.condition === "wither" ? 8 : 18));
      run2.phase = "resolve";
      run2.notice = "Floor " + run2.dungeon.floor + " cleared. Rest, remember a gift, then descend.";
      run2.noticeTime = 8;
      return;
    }
    awardMastery(run2);
    effect(run2, "gate", run2.player.x, run2.player.y, "#dfc288", 65);
    run2.cleared.push(run2.room);
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
    if (run2.dungeon || run2.phase !== "resolve" || ![0, 1, 2].includes(choice)) throw new Error("This chamber is not awaiting that choice.");
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
    if (run2.dungeon) return null;
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
  function stepActor(run2, p, form, input, dt) {
    const x = Number(input.x ?? 0), y = Number(input.y ?? 0);
    if (!Number.isFinite(x) || !Number.isFinite(y)) throw Error("Movement must be finite.");
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
    } else if (input.interact && !p.gateLatched) {
      const gate = nearestGate(run2, p);
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
      const interval = attackProfile(run2, form).interval;
      run2.player = previousPlayer;
      run2.form = previousForm;
      p.attackClock = interval / Math.min(3, 1 + run2.boons.cadence * 0.18 + run2.memoryHaste + (run2.gear?.haste ?? 0) + skills.haste) / (p.overclockTime > 0 ? 2 : 1);
    }
  }
  function stepRun(run2, input = {}, dt = 1 / 60) {
    if (run2.phase !== "playing") return;
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
    if (!run2.cleared.includes(run2.room) && (run2.room === "quiet" || run2.dungeon?.condition === "fault")) {
      run2.arrayClock = (run2.arrayClock ?? 8) - dt;
      if (run2.arrayClock <= 0 && run2.marks.length < 30) {
        for (const offset of [-125, 0, 125]) run2.marks.push({ x: clamp(p.x + offset, 75, WIDTH - 75), y: p.y, r: 38, timer: 1.5, life: 1.5, color: "#aaa9e4", damage: 9 });
        run2.arrayClock = 8;
        run2.notice = run2.room === "quiet" ? "The array is listening. Step outside the violet echo circles." : "Fault weather \xB7 leave the marked ground.";
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
      const kind = COMBAT_ROLES[enemy.kind] ?? enemy.kind;
      enemy.rootTime = Math.max(0, (enemy.rootTime ?? 0) - dt);
      if (enemy.rootTime > 0) {
      } else if (WORLD_GUARDIANS[enemy.kind]) stepGuardian(run2, enemy, target, dt);
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
            fire(run2, enemy.x, enemy.y, Math.atan2(enemy.chargeY, enemy.chargeX), run2.room === "machine" ? 8 : 10, true, run2.room === "machine" ? 155 : 185, 800);
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
        const sign = d < (kind === "warden" ? 180 : 165) ? -0.4 : d > 260 ? 1 : 0;
        move(run2, enemy, dx * enemy.speed * sign * dt, dy * enemy.speed * sign * dt, true);
        enemy.attack -= dt;
        if (kind === "cantor") {
          const stage = enemy.hp < enemy.maxHp * 0.5 ? 2 : 1;
          enemy.stage = stage;
          if (enemy.windup > 0) {
            enemy.windup -= dt;
            if (enemy.windup <= 0) {
              for (let i = 0; i < (stage === 1 ? 6 : 8); i++) fire(run2, enemy.x, enemy.y, enemy.volleyAngle + i * Math.PI * 2 / (stage === 1 ? 6 : 8), 11, true, stage === 1 ? 160 : 180, 900);
              if (stage === 2) for (const spread of [-0.18, 0.18]) fire(run2, enemy.x, enemy.y, enemy.aimAngle + spread, 11, true, 180, 900);
              enemy.attack = stage === 1 ? 2.5 : 2.8;
            }
          } else if (enemy.attack <= 0) {
            enemy.windup = 0.9;
            enemy.volleyAngle = run2.time * 0.3;
            enemy.aimAngle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
            effect(run2, "wave", enemy.x, enemy.y, "#ebc68e", 70);
          }
        }
        if (kind !== "cantor" && enemy.attack <= 0) {
          const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
          if (kind === "sentinel") {
            const spin = run2.time * 0.45;
            for (let i = 0; i < 8; i++) fire(run2, enemy.x, enemy.y, spin + i * Math.PI / 4, 12, true, 170, 900);
            enemy.attack = 2.4;
          } else if (kind === "cantor") {
            for (let i = 0; i < 6; i++) fire(run2, enemy.x, enemy.y, run2.time * 0.3 + i * Math.PI / 3, 11, true, 160, 850);
            enemy.attack = 2.2;
          } else if (kind === "warden") {
            const enraged = enemy.hp < enemy.maxHp * 0.5;
            for (const spread of enraged ? [-0.36, -0.18, 0, 0.18, 0.36] : [-0.2, 0, 0.2]) fire(run2, enemy.x, enemy.y, angle + spread, 14, true, enraged ? 260 : 220, 1e3);
            enemy.attack = enraged ? 0.9 : 1.4;
          } else {
            for (const spread of kind === "mirror" ? [-0.12, 0.12] : [0]) fire(run2, enemy.x, enemy.y, angle + spread, 10, true, 190, 750);
            enemy.attack = 2.3;
          }
        }
        if (kind === "mirror") enemy.shield = run2.time % 3.8 < 1.4 ? 1 : 0;
        if (kind === "warden" && enemy.hp < enemy.maxHp * 0.5 && !enemy.enraged) {
          enemy.enraged = true;
          for (let i = 0; i < 10; i++) fire(run2, enemy.x, enemy.y, i * Math.PI / 5, 12, true, 155, 900);
          spawnEnemy(run2, "hound", false);
          spawnEnemy(run2, "hound", false);
        }
        if (["warden", "cantor", "sentinel"].includes(kind)) {
          enemy.markClock -= dt;
          if (enemy.markClock <= 0) {
            run2.marks.push({ x: target.x, y: target.y, r: kind === "cantor" ? 62 : 70, timer: kind === "cantor" ? 1.2 : 0.9, life: kind === "cantor" ? 1.2 : 0.9 });
            enemy.markClock = enemy.hp < enemy.maxHp * 0.5 ? 2.6 : 3.6;
          }
        }
        if (d < target.r + enemy.r) hurt(run2, kind === "warden" ? 22 : 9, target);
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
    if (run2.phase === "playing") for (const actor of living) {
      const form = actor === run2.partner ? run2.partnerForm : run2.form;
      actor.hp = Math.min(actor.maxHp, actor.hp + dt * (run2.boons.regeneration + (run2.gear?.regen ?? 0) + skillStats(run2.training, form).regen + (form === "tree" ? 0.4 : 0)));
    }
    if (run2.phase !== "playing") return;
    if (ROOMS[run2.room].miniboss && run2.spawned >= 1 && !run2.enemies.some((e2) => ["cantor", "sentinel"].includes(e2.kind))) {
      clearRoom(run2);
      return;
    }
    if (ROOMS[run2.room].boss && run2.spawned >= 1 && !run2.enemies.some((e2) => e2.kind === (ROOMS[run2.room].guardian ?? "warden"))) {
      clearRoom(run2);
      return;
    }
    if (run2.xp >= run2.nextXp && !run2.dungeon && !ROOMS[run2.room].boss && !ROOMS[run2.room].miniboss) {
      run2.xp -= run2.nextXp;
      run2.level++;
      run2.nextXp = 6 + run2.level * 4;
      offerBoons(run2);
      return;
    }
    if (!ROOMS[run2.room].safe && !run2.cleared.includes(run2.room) && run2.spawned >= run2.spawnTotal && run2.enemies.length === 0) clearRoom(run2);
  }
  function settleRun(run2, meta2, guest = false) {
    if (run2.dungeon) throw Error("Dungeon records are separate from campaign progress.");
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
    next.journal = [...run2.journal ?? [], ...next.journal ?? []].filter((v, i, a) => a.findIndex((x) => x.id === v.id) === i).slice(0, 160);
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
    return { training: run2?.training ?? prepareTraining(meta2.training), masteryEarned: run2?.masteryEarned ?? {}, partnerMasteryEarned: run2?.partnerMasteryEarned ?? {}, stats: run2?.stats ?? null, daily: run2?.daily ?? null, ending: run2 && ["milestone", "won"].includes(run2.phase) ? endingFor(run2) : null, lastRun: meta2.lastRun ?? null, bestRun: meta2.bestRun ?? null, time: run2?.time ?? 0, pauseReason: run2 && run2.phase !== "playing" ? { boon: "Choose a waiting gift.", resolve: "Resolve this cleared chamber.", milestone: "Choose your next journey." }[run2.phase] ?? run2.phase : null, banner: run2?.banner ?? null, bossDefeated: run2?.bossDefeated ?? null, phase: run2?.phase ?? "between", form: run2?.form ?? null, room: run2?.room ?? null, player: run2 ? { x: run2.player.x, y: run2.player.y, hp: run2.player.hp, maxHp: run2.player.maxHp, dashReady: run2.player.dashCooldown === 0 } : null, enemies: run2 ? run2.enemies.map((e2) => ({ id: e2.id, kind: e2.kind, x: e2.x, y: e2.y, hp: e2.hp })) : [], fragments: run2 ? run2.fragments.map((f) => ({ x: f.x, y: f.y, value: f.value })) : [], level: run2?.level ?? 0, boons: run2?.boons ?? {}, choices: run2?.choices ?? [], karma: run2?.karma ?? meta2.karma, abilities: run2?.abilities ?? meta2.abilities, cleared: run2?.cleared ?? [], exits: run2 ? Object.keys(ROOMS[run2.room].exits).map((dir) => ({ direction: dir, ...exitPosition(dir), ...gateStatus(run2, dir) })) : [], offeredForms: offeredForms(meta2), essence: meta2.essence + (run2 && !run2.settled ? run2.essence : 0), bankedEssence: meta2.essence, keys: run2?.keys ?? meta2.keys ?? [], keyPickup: run2 ? pendingKey(run2) : null, morphAvailable: !!run2?.abilities.includes("morph"), morphCooldown: run2?.player.morphCooldown ?? 0, partnerForm: run2?.partnerForm ?? null, world: worldOf(run2?.room ?? "threshold"), worlds: WORLD_ORDER.map((id) => ({ id, name: WORLDS[id].name, unlocked: worldUnlocked(id, run2?.seals ?? meta2.seals ?? []) })), seals: run2?.seals ?? meta2.seals ?? [], power: run2 ? { ...powerProfile(run2), cooldownRemaining: run2.player.powerCooldown ?? 0 } : null, checkpoint: checkpointAvailable(run2), weapon: run2 ? attackProfile(run2) : null, openedDoors: run2?.openDoors ?? [], equipment: run2?.loadout ?? prepareEquipment(meta2).loadout, loot: run2?.loot ?? [] };
  }
  function validMeta(meta2) {
    return !!meta2 && (meta2.training === void 0 || validTraining(meta2.training)) && validEquipment(meta2) && (meta2.seals === void 0 || validSeals(meta2.seals)) && (meta2.keys === void 0 || validKeys(meta2.keys)) && (meta2.explored === void 0 || Array.isArray(meta2.explored) && meta2.explored.length <= Object.keys(ROOMS).length && meta2.explored.every((room) => ROOMS[room])) && meta2.version === 2 && ["karma", "awareness", "essence", "runs", "wins", "bestRooms"].every((k) => Number.isFinite(meta2[k])) && meta2.karma >= -100 && meta2.karma <= 100 && meta2.awareness >= 0 && meta2.awareness <= 100 && meta2.essence >= 0 && meta2.runs >= 0 && Array.isArray(meta2.abilities) && meta2.abilities.every((a) => ABILITIES[a]) && meta2.gifts && Object.keys(MEMORY_GIFTS).every((k) => Number.isInteger(meta2.gifts[k]) && meta2.gifts[k] >= 0 && meta2.gifts[k] <= 8) && Array.isArray(meta2.echoes) && Array.isArray(meta2.visited) && meta2.visited.every((f) => BODIES[f]);
  }
  function validRun(run2) {
    if (!run2 || run2.dungeon !== void 0 || run2.version !== 2 || !BODIES[run2.form] || !ROOMS[run2.room] || !["playing", "boon", "resolve", "milestone", "dead", "won"].includes(run2.phase)) return false;
    if (run2.phase === "milestone" && (run2.room !== "eye" || !run2.cleared?.includes("eye"))) return false;
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
    if (run2.enemies.length > 128 || run2.shots.length > 300 || run2.fragments.length > 1e3 || run2.effects.length > 160 || run2.marks.length > 50) return false;
    if (!run2.enemies.every((e2) => ENEMY_KINDS.includes(e2.kind) && ["x", "y", "hp", "maxHp", "r", "speed", "attack", "orbitHit", "flash"].every((k) => Number.isFinite(e2[k])))) return false;
    if (!run2.shots.every((s) => ["x", "y", "vx", "vy", "damage", "r", "life"].every((k) => Number.isFinite(s[k]))) || !run2.fragments.every((f) => ["x", "y", "value", "r"].every((k) => Number.isFinite(f[k])))) return false;
    if (run2.shots.some((shot) => shot.sourceForm !== void 0 && !Object.hasOwn(BODIES, shot.sourceForm) || shot.sourcePartner !== void 0 && typeof shot.sourcePartner !== "boolean" || shot.homingSpeed !== void 0 && (!Number.isFinite(shot.homingSpeed) || shot.homingSpeed < 100 || shot.homingSpeed > 1e3))) return false;
    if (run2.gear && (!Object.entries(run2.gear).every(([key, n]) => ["health", "damage", "range", "speed", "melee", "haste", "dash", "armor", "regen"].includes(key) && Number.isFinite(n) && n >= 0 && n <= (key === "health" ? 100 : ["armor", "dash"].includes(key) ? 0.9 : 2)) || !validEquipment({ inventory: Object.fromEntries(Object.values(run2.loadout ?? {}).filter(Boolean).map((id) => [id, 0])), loadout: run2.loadout }))) return false;
    if (run2.loot && (!Array.isArray(run2.loot) || !run2.loot.every((id) => EQUIPMENT[id]))) return false;
    if (run2.seals !== void 0 && !validSeals(run2.seals)) return false;
    if (run2.equipmentLevels !== void 0 && !validEquipment({ inventory: run2.equipmentLevels, loadout: run2.loadout })) return false;
    if ([run2.player, run2.partner].filter(Boolean).some((actor) => ["powerCooldown", "guardTime", "overclockTime"].some((key) => actor[key] !== void 0 && (!Number.isFinite(actor[key]) || actor[key] < 0 || actor[key] > (key === "powerCooldown" ? 12 : 6))))) return false;
    if (run2.enemies.some((enemy) => enemy.rootTime !== void 0 && (!Number.isFinite(enemy.rootTime) || enemy.rootTime < 0 || enemy.rootTime > 3.5))) return false;
    if (run2.keys !== void 0 && !validKeys(run2.keys)) return false;
    if (run2.openDoors !== void 0 && (!Array.isArray(run2.openDoors) || run2.openDoors.length > 100 || !run2.openDoors.every((id) => typeof id === "string" && id.split(":").length === 2 && id.split(":").every((room) => ROOMS[room])))) return false;
    if (run2.visitedVessels !== void 0 && (!Array.isArray(run2.visitedVessels) || run2.visitedVessels.length > 6 || !run2.visitedVessels.every((form) => BODIES[form]))) return false;
    if ([run2.player, run2.partner].filter(Boolean).some((actor) => actor.morphCooldown !== void 0 && (!Number.isFinite(actor.morphCooldown) || actor.morphCooldown < 0 || actor.morphCooldown > 3))) return false;
    if (run2.partner && (!BODIES[run2.partnerForm] || !validActor(run2.partner))) return false;
    return run2.abilities.every((a) => ABILITIES[a]) && run2.earnedAbilities.every((a) => ABILITIES[a]) && run2.cleared.every((r) => ROOMS[r]) && run2.discovered.every((r) => ROOMS[r]) && run2.choices.every((b) => BOONS[b]) && run2.boons && Object.keys(BOONS).every((k) => Number.isFinite(run2.boons[k]) && run2.boons[k] >= 0);
  }

  // settings.js
  var SETTINGS_KEY = "spark-substrate-settings-v1";
  var BINDING_LABELS = { up: "Move up", down: "Move down", left: "Move left", right: "Move right", dash: "Dash", power: "Vessel power", interact: "Gate / revive", morph: "Vessels", map: "World map", pause: "Pause" };
  var DEFAULT_BINDINGS = { up: "w", down: "s", left: "a", right: "d", dash: " ", power: "f", interact: "e", morph: "q", map: "m", pause: "escape" };
  var keyLabel = (key) => key === " " ? "Space" : key === "escape" ? "Escape" : key.toUpperCase();
  var eventKey = (event) => event.code === "Space" ? " " : String(event.key ?? "").toLowerCase();
  var goodKey = (key) => typeof key === "string" && (key === " " || key === "escape" || /^[a-z0-9]$/.test(key) && !/[1-6]/.test(key));
  function defaultSettings(reduced = false) {
    return { audio: false, master: 0.7, effects: 0.8, ambient: 0.12, shake: reduced ? 0 : 0.2, flashes: reduced ? 0 : 1, controller: true, damageNumbers: false, guideGift: false, inputProfile: null, reduced, bindings: { ...DEFAULT_BINDINGS } };
  }
  function cleanSettings(raw, reduced = false) {
    const next = defaultSettings(reduced);
    for (const id of ["master", "effects", "ambient", "shake", "flashes"]) if (Number.isFinite(raw?.[id])) next[id] = Math.max(0, Math.min(1, raw[id]));
    for (const id of ["audio", "controller", "damageNumbers", "guideGift"]) if (typeof raw?.[id] === "boolean") next[id] = raw[id];
    if (["pc", "controller", "mobile"].includes(raw?.inputProfile)) next.inputProfile = raw.inputProfile;
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
    return { connected: true, name: pad2.id, buttons, x: axis(pad2.axes[0]) + (buttons[15] ? 1 : 0) - (buttons[14] ? 1 : 0), y: axis(pad2.axes[1]) + (buttons[13] ? 1 : 0) - (buttons[12] ? 1 : 0), dash: edge(0), power: edge(2), interact: !!buttons[1], morph: edge(3), map: edge(4), pause: edge(9), confirm: edge(0), back: edge(1), next: edge(13) || edge(15), prior: edge(12) || edge(14) };
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

  // share-run.js
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
    const cells = [[record.chambers, "CHAMBERS"], [record.kills, "CONSTRUCTS"], [record.damageDealt.toLocaleString(), "DAMAGE DEALT"], [Math.floor(record.seconds / 60) + ":" + String(record.seconds % 60).padStart(2, "0"), "TIME"]];
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

  // entry.js
  var INPUT_PROFILES = ["pc", "controller", "mobile"];
  var PROFILE_LABELS = { pc: "PC", controller: "Controller", mobile: "Mobile" };
  var PAD = { dash: "A", power: "X", interact: "B", morph: "Y", map: "LB", pause: "Start" };
  var TOUCH = { dash: "DASH", power: "POWER", interact: "GATE", morph: "MORPH", map: "MAP", pause: "PAUSE" };
  function inputHint(profile, action, bindings = {}) {
    if (profile === "mobile") return "Tap " + TOUCH[action];
    if (profile === "controller") return PAD[action];
    const key = bindings[action] ?? { dash: " ", power: "f", interact: "e", morph: "q", map: "m", pause: "escape" }[action];
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

  // combat-view.js
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
  function drawEnemyCore(ctx2, enemy, { role = enemy.kind, elite = false, time = 0, flash = 1, reduced = false } = {}) {
    const shooter = role === "archon", color = elite ? "#fff0b4" : shooter ? "#7df0ec" : "#ff6f66", pulse = !reduced && (enemy.windup > 0 && enemy.windup <= 0.2 || role === "collector" && enemy.attack <= 0.2) ? 2 + Math.sin(time * 30) * 2 : 0;
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
  }
  function sealReason(run2, exit, status) {
    if (!run2.cleared.includes(run2.room)) return "SWARM";
    if (status.available) return "";
    if (status.missingKeys?.length || status.missingSeals?.length || exit.keys || exit.seals) return "KEY";
    const ability = exit.requires;
    return ability === "root" || ["tree", "animal"].includes(exit.vessel) ? "ROOT" : ability === "fracture" || exit.vessel === "rock" ? "BASALT" : ability === "phase" || ["computer", "spark"].includes(exit.vessel) ? "CRYSTAL" : "KEY";
  }
  function drawSeal(ctx2, run2, room, dir, exit, status, at, { retract = 1 } = {}) {
    const reason = sealReason(run2, exit, status), material = reason === "ROOT" ? "root" : reason === "BASALT" ? "basalt" : reason === "CRYSTAL" || reason === "KEY" ? "crystal" : room.world === "verdant" || ["root", "garden"].includes(run2.room) ? "root" : room.world === "cinder" || run2.room === "basalt" ? "basalt" : ["prism", "orbit"].includes(room.world) ? "crystal" : "glass", color = { root: "#92be9e", basalt: "#b6a78d", crystal: "#93d9e0", glass: room.theme ?? "#bbd7ce" }[material];
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
    if (reason) {
      ctx2.save();
      ctx2.fillStyle = color;
      ctx2.font = "600 9px sans-serif";
      ctx2.textAlign = "center";
      const dx = dir === "west" ? 28 : dir === "east" ? -28 : 0, dy = dir === "north" ? 27 : dir === "south" ? -22 : 4;
      ctx2.fillText(reason, at.x + dx, at.y + dy);
      ctx2.restore();
    }
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
  function drawDescentHud(ctx2, { w, run: run2, player, room, profile, bindings, dashMax, powerMax, clearPulse = 0 }) {
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
    if (!room.safe) {
      const clear = run2.cleared.includes(run2.room);
      ctx2.fillStyle = clearPulse > 0 ? "#766b3ae0" : "#10251ee8";
      ctx2.fillRect(sx, 12, swarmWidth, 32);
      ctx2.fillStyle = "#e4d5ac";
      ctx2.font = "600 10px sans-serif";
      ctx2.textAlign = "center";
      const approaching = !clear && run2.spawned === 0 && run2.spawnTotal > 0;
      ctx2.fillText(clear ? "SWARM CLEARED" : "SWARM " + Math.min(run2.spawned, run2.spawnTotal) + " / " + run2.spawnTotal + (approaching ? " \xB7 " + Math.max(0.1, run2.spawnClock).toFixed(1) + "s" : ""), sx + swarmWidth / 2, 25);
      ctx2.fillStyle = "#304d3b";
      ctx2.fillRect(sx + 8, 31, swarmWidth - 16, 4);
      ctx2.fillStyle = clear ? "#f5d082" : "#8dd7cc";
      ctx2.fillRect(sx + 8, 31, (swarmWidth - 16) * (clear ? 1 : run2.spawned / Math.max(1, run2.spawnTotal)), 4);
    }
    const y = narrow ? 68 : 28, dx = narrow ? w - 70 : w - 76;
    drawCooldownRing(ctx2, dx, y, 1 - player.dashCooldown / dashMax, profile === "mobile" ? "D" : inputHint(profile, "dash", bindings) === "Space" ? "SP" : inputHint(profile, "dash", bindings));
    drawCooldownRing(ctx2, dx + 42, y, 1 - (player.powerCooldown ?? 0) / powerMax, profile === "mobile" ? "P" : inputHint(profile, "power", bindings), "#8bdddc");
    ctx2.fillStyle = "#e7dabb";
    ctx2.font = "500 " + (narrow ? 11 : 13) + "px sans-serif";
    ctx2.textAlign = "center";
    ctx2.fillText((run2.dungeon ? "FLOOR " + run2.dungeon.floor + " \xB7 " : "") + room.name, w / 2, narrow ? 66 : 64);
    ctx2.restore();
  }

  // dungeon.js
  var DUNGEON_KEY = "spark-substrate-endless-v1";
  var DUNGEON_CONDITIONS = {
    steady: { name: "Unbroken current", desc: "A clean chamber. Learn its rhythm." },
    fleet: { name: "Fleet echoes", desc: "Enemies move 12% faster." },
    crowd: { name: "Crowded lattice", desc: "Six extra enemies; two extra active foes." },
    fault: { name: "Fault weather", desc: "Violet circles warn for 1.5s before striking every 8s." },
    wither: { name: "Withering refuge", desc: "Cleared floors restore 8 HP instead of 18." }
  };
  var CHAMBERS = ["glass", "machine", "quiet", "cistern", "tide-sluice", "grove-canopy", "cinder-gears", "night-trail", "orbit-bridge", "archive"];
  var GUARDIANS = ["forge", "eye", "tide-throne", "grove-heart", "cinder-throne", "night-nest", "orbit-throne", "origin-heart"];
  var mix = (seed, floor) => Math.imul((seed ^ Math.imul(floor, 2654435761)) >>> 0, 2246822519) >>> 0;
  function dungeonFloor(seed, floor) {
    if (!Number.isInteger(seed) || !Number.isSafeInteger(floor) || floor < 1) throw Error("A dungeon needs a valid seed and floor.");
    const boss = floor % 5 === 0, room = boss ? GUARDIANS[(floor / 5 - 1) % GUARDIANS.length] : floor === 1 ? "glass" : floor === 2 ? "machine" : CHAMBERS[mix(seed, floor) % CHAMBERS.length];
    const condition = floor <= 2 ? "steady" : Object.keys(DUNGEON_CONDITIONS)[mix(seed + 17, floor) % 5], n = floor - 1;
    const pressure = { health: 1 + n * 0.11, damage: 0.72 * (1 + n * 0.035), speed: (1 + Math.min(0.55, Math.log2(floor) * 0.07)) * (condition === "fleet" ? 1.12 : 1), cap: Math.min(16, 6 + Math.floor(n / 3)) + (condition === "crowd" ? 2 : 0), total: Math.min(70, 14 + n * 2) + (condition === "crowd" ? 6 : 0), interval: Math.max(0.35, 1 - n * 0.012), rangedCap: Math.min(4, 1 + Math.floor(n / 8)) };
    return { floor, room, boss, condition, pressure };
  }
  function enterFloor(run2) {
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
      return { run: validDungeon(state?.run) ? state.run : null, record: cleanDungeonRecord(state?.record) };
    } catch {
      return { run: null, record: cleanDungeonRecord(null) };
    }
  }
  function saveDungeon(storage, run2, raw) {
    const record = cleanDungeonRecord(raw);
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

  // duel-engine.js
  var DUEL_FORMS = ["spark", "human", "computer", "animal", "tree", "rock"];
  var DUEL_STAGES = { glass: { name: "Threshold Glass", color: "#82c8c4", look: "glass" }, tideglass: { name: "Tideglass", color: "#79cddc", look: "tide" }, root: { name: "Root", color: "#99c7a2", look: "root" }, basalt: { name: "Basalt", color: "#d4a476", look: "basalt" }, night: { name: "Night", color: "#bda4ee", look: "night" }, orbit: { name: "Orbit", color: "#c9dbe7", look: "orbit" } };
  var DUEL_ROSTER = { spark: { epithet: "Light that seeks", special: "Lumen pulse", desc: "A close pulse breaks the pattern." }, human: { epithet: "A stubborn heart", special: "Rally guard", desc: "A brief guard and a spectral strike." }, computer: { epithet: "Read the grid", special: "Overclock", desc: "Prism fire and four seconds of faster recovery." }, animal: { epithet: "A wolf\u2019s speed", special: "Pounce", desc: "Leap forward and strike where you land." }, tree: { epithet: "The oldest root listens", special: "Root hold", desc: "Hold a grounded foe in living roots." }, rock: { epithet: "The fault remembers", special: "Fault wave", desc: "A low shockwave and a short basalt guard." } };
  var DUEL_MOVES = { light: { startup: 6, active: 3, recovery: 12, damage: 8, range: 94 }, heavy: { startup: 14, active: 5, recovery: 19, damage: 16, range: 115 }, launcher: { startup: 12, active: 4, recovery: 22, damage: 12, range: 102 }, special: { startup: 12, active: 6, recovery: 24, damage: 16, range: 160 }, super: { startup: 32, active: 6, recovery: 34, damage: 32, range: 205 } };
  var DUEL_CONDITIONS = {
    classic: { name: "Classic", desc: "100 HP. Standard movement and power recovery.", health: 100, speed: 1, gravity: 1, cooldown: 300, meter: 0, drip: 0 },
    glass: { name: "Glass oath", desc: "80 HP for both vessels. Every opening matters.", health: 80, speed: 1, gravity: 1, cooldown: 300, meter: 0, drip: 0 },
    quick: { name: "Quickening", desc: "Powers recover in 3 seconds for both vessels.", health: 100, speed: 1, gravity: 1, cooldown: 180, meter: 0, drip: 0 },
    gravity: { name: "Heavy law", desc: "20% slower movement and heavier falls for both vessels.", health: 100, speed: 0.8, gravity: 1.25, cooldown: 300, meter: 0, drip: 0 },
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
  var fighter = (form, i, rules = DUEL_CONDITIONS.classic, bonusHp = 0) => ({ form, x: i ? 670 : 290, y: 0, vx: 0, vy: 0, hp: rules.health + (i ? bonusHp : 0), maxHp: rules.health + (i ? bonusHp : 0), meter: rules.meter, facing: i ? -1 : 1, crouch: false, blocking: false, attack: null, stun: 0, root: 0, cooldown: 0, guard: 0, overclock: 0, flash: 0, rounds: 0, previous: {}, stats: { hits: 0, damage: 0, specials: 0, supers: 0, throws: 0, techs: 0 } });
  function emit(m, type, data = {}) {
    m.events.push({ id: ++m.serial, type, frame: m.frames, ...data });
    if (m.events.length > 80) m.events.shift();
  }
  function createDuel({ forms = ["spark", "human"], stage = "glass", bot = false, difficulty = "medium", profile = "pc", seed = Date.now() >>> 0, condition = "classic", bonusHp = 0 } = {}) {
    if (!Array.isArray(forms) || forms.length !== 2 || forms.some((form) => !DUEL_FORMS.includes(form)) || !Object.hasOwn(DUEL_STAGES, stage) || !["easy", "medium", "hard"].includes(difficulty) || !["pc", "controller", "mobile"].includes(profile) || !Number.isInteger(seed) || !Object.hasOwn(DUEL_CONDITIONS, condition) || !Number.isInteger(bonusHp) || bonusHp < 0 || bonusHp > 44 || !bot && bonusHp !== 0) throw Error("Choose two known vessels, a stage, and valid duel settings.");
    return { version: 1, mode: "duel", forms: [...forms], stage, condition, rules: { ...DUEL_CONDITIONS[condition] }, bonusHp, bot: !!bot, difficulty, profile, seed: seed >>> 0, rng: seed >>> 0, frames: 0, serial: 0, phase: profile === "mobile" && !bot ? "handoff" : "playing", clock: 60, round: 1, replay: 0, roundWinner: null, winner: null, breakFrames: 0, freeze: 0, cinematic: 0, throw: null, fighters: forms.map((form, i) => fighter(form, i, DUEL_CONDITIONS[condition], bonusHp)), events: [], turn: 0, turnFrames: 180, botState: { decision: 0, input: {}, seenSpecials: 0, lastAttack: null, pendingSpecial: null }, recorded: false };
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
  function addDamage(m, attacker, defender, amount, { special = false, launcher = false, throwing = false } = {}) {
    const a = m.fighters[attacker], b = m.fighters[defender];
    if (b.hp <= 0) return;
    const blocked = !throwing && b.y === 0 && (b.blocking || b.guard > 0), actual = blocked ? special ? amount * 0.05 : 0 : amount;
    if (actual === 0) {
      emit(m, "block", { player: defender });
      return;
    }
    const counter = !blocked && !!b.attack && b.attack.frame < DUEL_MOVES[b.attack.kind].startup, damage = Math.min(b.hp, actual);
    b.hp = clamp2(b.hp - damage, 0, b.maxHp);
    a.meter = clamp2(a.meter + damage * 1.8, 0, 100);
    b.meter = clamp2(b.meter + damage * 1.2, 0, 100);
    a.stats.hits++;
    a.stats.damage += damage;
    b.flash = 9;
    m.freeze = counter ? 6 : 3;
    if (!blocked) {
      b.attack = null;
      b.stun = counter ? 22 : 15;
      b.x = clamp2(b.x + a.facing * (launcher ? 26 : 18), 45, 915);
      if (launcher) {
        b.vy = 510;
        b.y = Math.max(1, b.y);
      }
      if (a.form === "tree" && special) b.root = 45;
    }
    emit(m, blocked ? "chip" : "hit", { attacker, defender, damage: Math.round(damage * 10) / 10, counter, blocked });
  }
  function attack2(m, i, kind) {
    const f = m.fighters[i];
    f.attack = { id: ++m.serial, kind, frame: 0, hit: false };
    if (kind === "special") {
      f.cooldown = m.rules.cooldown;
      f.stats.specials++;
    }
    if (kind === "super") {
      f.meter = 0;
      f.stats.supers++;
      m.cinematic = 72;
    }
    emit(m, kind === "super" ? "super" : "attack", { player: i, kind, attackId: f.attack.id });
  }
  function advanceAttack(m, i) {
    const f = m.fighters[i], a = f.attack;
    if (!a) return;
    const move2 = DUEL_MOVES[a.kind];
    a.frame++;
    if (a.kind === "special" && a.frame === move2.startup) {
      if (f.form === "human") f.guard = 40;
      if (f.form === "rock") f.guard = 24;
      if (f.form === "computer") f.overclock = 240;
      if (f.form === "animal") {
        f.x = clamp2(f.x + f.facing * 160, 45, 915);
        f.y = 35;
        f.vy = 70;
      }
      emit(m, "power", { player: i, form: f.form });
    }
    if (a.frame >= move2.startup && a.frame < move2.startup + move2.active && !a.hit) {
      const b = m.fighters[1 - i];
      let range = move2.range;
      if (a.kind === "special") range = f.form === "computer" ? 340 : f.form === "rock" ? 340 : f.form === "animal" ? 115 : 160;
      const low = a.kind === "special" && f.form === "rock";
      if (Math.abs(f.x - b.x) <= range && (a.kind === "special" && f.form === "spark" || (b.x - f.x) * f.facing >= -16) && Math.abs(f.y - b.y) < (low ? 35 : 100) && (a.kind === "heavy" || !b.crouch || a.kind === "special" || a.kind === "super")) {
        a.hit = true;
        addDamage(m, i, 1 - i, move2.damage, { special: ["special", "super"].includes(a.kind), launcher: a.kind === "launcher" });
      }
    }
    const recovery = Math.round(move2.recovery * (f.overclock > 0 && ["light", "heavy", "launcher"].includes(a.kind) ? 0.8 : 1));
    if (a.frame >= move2.startup + move2.active + recovery) f.attack = null;
  }
  function inputFrame(m, i, raw = {}) {
    const f = m.fighters[i], other = m.fighters[1 - i], input = { x: clamp2(Number(raw.x) || 0, -1, 1), jump: !!raw.jump, crouch: !!raw.crouch, light: !!raw.light, heavy: !!raw.heavy, launcher: !!raw.launcher, special: !!raw.special, super: !!raw.super };
    const edge = (key) => input[key] && !f.previous[key];
    f.facing = other.x >= f.x ? 1 : -1;
    f.blocking = input.x * f.facing < -0.25 && f.y === 0 && !f.attack && f.stun === 0;
    f.crouch = input.crouch && f.y === 0 && !f.attack;
    if (m.throw) {
      if (m.throw.target === i && edge("light") && input.x * f.facing < -0.25 && m.throw.frames <= 8) {
        m.fighters[m.throw.owner].stun = 15;
        f.stun = 15;
        f.stats.techs++;
        emit(m, "tech", { player: i });
        m.throw = null;
      }
      f.previous = input;
      return;
    }
    if (f.stun === 0 && !f.attack && m.cinematic === 0) {
      if (edge("super") && f.meter >= 100) attack2(m, i, "super");
      else if (edge("special") && f.cooldown === 0) attack2(m, i, "special");
      else if (edge("light") && input.x * f.facing < -0.25 && Math.abs(f.x - other.x) < 66 && f.y === 0 && other.y === 0) {
        m.throw = { owner: i, target: 1 - i, frames: 0 };
        f.stats.throws++;
        emit(m, "throw", { player: i, target: 1 - i });
      } else if (edge("light")) attack2(m, i, "light");
      else if (edge("heavy")) attack2(m, i, "heavy");
      else if (edge("launcher")) attack2(m, i, "launcher");
      else if (edge("jump") && f.y === 0 && f.root === 0) {
        f.vy = 570;
        f.y = 0.1;
      }
      if (!f.crouch && f.root === 0) f.x = clamp2(f.x + input.x * 210 * m.rules.speed * F, 45, 915);
    }
    f.previous = input;
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
    if (--state.decision > 0) return state.input;
    state.decision = m.difficulty === "easy" ? 18 : m.difficulty === "medium" ? 12 : 9;
    const distance = Math.abs(other.x - bot.x), toward = other.x > bot.x ? 1 : -1, r = random(m), input = { x: distance > 95 ? toward : 0 };
    const blockChance = m.difficulty === "easy" ? 0.08 : m.difficulty === "medium" ? 0.3 : 0.55;
    if (pose && (r < blockChance || m.difficulty === "hard" && pose === "special" && state.seenSpecials > 0)) input.x = -toward;
    else if (bot.meter >= 100 && distance < 170) input.super = true;
    else if (bot.cooldown === 0 && distance < 270 && r > 0.55) input.special = true;
    else if (distance < 115 && r > 0.2) input[r < 0.5 ? "light" : r < 0.8 ? "heavy" : "launcher"] = true;
    else if (distance > 190 && r > 0.88) input.jump = true;
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
      if (m.freeze > 0) {
        m.freeze--;
        continue;
      }
      if (m.cinematic > 0) m.cinematic--;
      else m.clock = m.clock <= F + 1e-8 ? 0 : m.clock - F;
      const source = [inputs[0] ?? {}, m.bot ? duelBotInput(m) : inputs[1] ?? {}];
      for (let i = 0; i < 2; i++) {
        const f = m.fighters[i];
        f.meter = clamp2(f.meter + m.rules.drip * F, 0, 100);
        for (const key of ["stun", "root", "cooldown", "guard", "overclock", "flash"]) f[key] = Math.max(0, f[key] - 1);
        if (m.profile === "mobile" && !m.bot && i !== m.turn) inputFrame(m, i, {});
        else inputFrame(m, i, source[i]);
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
        advanceAttack(m, i);
      }
      const [a, b] = m.fighters;
      if (a.y === 0 && b.y === 0 && Math.abs(a.x - b.x) < 54) {
        const middle = (a.x + b.x) / 2, sign = a.x <= b.x ? 1 : -1;
        a.x = clamp2(middle - sign * 27, 45, 915);
        b.x = clamp2(middle + sign * 27, 45, 915);
      }
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
    return m ? structuredClone({ mode: m.mode, phase: m.phase, forms: m.forms, stage: m.stage, condition: m.condition, ladder: m.ladder ?? null, clock: m.clock, round: m.round, replay: m.replay, turn: m.turn, winner: m.winner, frames: m.frames, fighters: m.fighters.map((f) => ({ form: f.form, x: f.x, y: f.y, hp: f.hp, maxHp: f.maxHp, meter: f.meter, rounds: f.rounds, cooldown: f.cooldown / 60, pose: f.attack?.kind ?? (f.stun ? "hurt" : f.blocking ? "block" : f.crouch ? "crouch" : f.y ? "jump" : "idle"), stats: f.stats })) }) : { mode: "duel", phase: "select" };
  }
  function cleanDuelRecord(raw) {
    const next = { version: 1, matches: 0, wins: Object.fromEntries(DUEL_FORMS.map((f) => [f, 0])), losses: Object.fromEntries(DUEL_FORMS.map((f) => [f, 0])), last: null };
    if (raw?.version !== 1) return next;
    for (const name of ["wins", "losses"]) for (const form of DUEL_FORMS) if (Number.isInteger(raw[name]?.[form]) && raw[name][form] >= 0) next[name][form] = Math.min(1e6, raw[name][form]);
    if (Number.isInteger(raw.matches) && raw.matches >= 0) next.matches = Math.min(1e6, raw.matches);
    if (Array.isArray(raw.last?.forms) && raw.last.forms.length === 2 && raw.last.forms.every((f) => DUEL_FORMS.includes(f)) && [0, 1].includes(raw.last.winner) && Object.hasOwn(DUEL_STAGES, raw.last.stage) && Array.isArray(raw.last.rounds) && raw.last.rounds.length === 2 && raw.last.rounds.every((n) => Number.isInteger(n) && n >= 0 && n <= 2)) next.last = { forms: [...raw.last.forms], winner: raw.last.winner, rounds: [...raw.last.rounds], stage: raw.last.stage, bot: !!raw.last.bot };
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

  // duel-view.js
  var NAMES = { spark: "Spark", human: "Human", computer: "Computer", animal: "Animal", tree: "Tree", rock: "Rock" };
  var COLOR = ["#efcd79", "#c4a1fa"];
  var KEYSETS = [{ left: "a", right: "d", jump: "w", crouch: "s", light: "f", heavy: "g", launcher: "h", special: "r", super: "t" }, { left: "arrowleft", right: "arrowright", jump: "arrowup", crouch: "arrowdown", light: "k", heavy: "l", launcher: ";", special: "o", super: "p" }];
  function duelInputs(profile, keys2, pads, touch = { x: 0, y: 0, buttons: {} }, turn = 0) {
    const keyboard = (map) => ({ x: (keys2.has(map.right) ? 1 : 0) - (keys2.has(map.left) ? 1 : 0), ...Object.fromEntries(["jump", "crouch", "light", "heavy", "launcher", "special", "super"].map((a) => [a, keys2.has(map[a])])) });
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
      return { x: x + (pressed(pad2, 15) ? 1 : 0) - (pressed(pad2, 14) ? 1 : 0), jump: pressed(pad2, 0) || pressed(pad2, 12), crouch: pressed(pad2, 13) || (pad2.axes[1] ?? 0) > 0.4, light: pressed(pad2, 2), heavy: pressed(pad2, 3), launcher: pressed(pad2, 1), special: pressed(pad2, 5), super: pressed(pad2, 7) };
    });
  }
  var DuelScreen = class {
    constructor({ document: document2, window: window2, storage, image, settings: settings2, audio: audio2, onQuit, announce: announce2 = () => {
    } }) {
      Object.assign(this, { document: document2, window: window2, storage, image, settings: settings2, audio: audio2, onQuit, announce: announce2 });
      this.$ = (id) => document2.getElementById(id);
      this.match = null;
      this.config = { forms: ["spark", "human"], stage: "glass", bot: false, difficulty: "medium", condition: "classic" };
      this.keys = /* @__PURE__ */ new Set();
      this.touch = { x: 0, y: 0, buttons: {} };
      this.paused = false;
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
    profile() {
      return this.settings().inputProfile;
    }
    open() {
      this.match = null;
      this.paused = false;
      this.keys.clear();
      this.renderSelect();
      this.render();
    }
    setProfile(profile) {
      if (Object.hasOwn(DUEL_CONDITIONS, this.$("duel-condition").value)) this.config.condition = this.$("duel-condition").value;
      if (Object.hasOwn(DUEL_STAGES, this.$("duel-stage").value)) this.config.stage = this.$("duel-stage").value;
      if (["easy", "medium", "hard"].includes(this.$("duel-difficulty").value)) this.config.difficulty = this.$("duel-difficulty").value;
      if (["bot", "local"].includes(this.$("duel-opponent").value)) this.config.bot = this.$("duel-opponent").value === "bot";
      this.keys.clear();
      this.touch = { x: 0, y: 0, buttons: {} };
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
      this.$("duel-condition").innerHTML = Object.entries(DUEL_CONDITIONS).map(([id, c2]) => `<option value="${id}">${c2.name}</option>`).join("");
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
      this.$("duel-rosters").innerHTML = [0, 1].map((i) => `<section class="duel-roster"><h3 style="color:${COLOR[i]}">PLAYER ${i + 1} \xB7 ${NAMES[this.config.forms[i]]}</h3><div class="duel-vessels">${DUEL_FORMS.map((form, index) => `<button class="duel-vessel ${this.config.forms[i] === form ? "selected" : ""}" data-action="duel-form" data-player="${i}" data-form="${form}" aria-pressed="${this.config.forms[i] === form}"><span class="sprite-portrait" style="--sprite-x:${index % 4 * 100 / 3}%;--sprite-y:${Math.floor(index / 4) * 100}%"></span><strong>${NAMES[form]}</strong><small>${DUEL_ROSTER[form].epithet}</small></button>`).join("")}</div><p><b>${DUEL_ROSTER[this.config.forms[i]].special}</b> \xB7 ${DUEL_ROSTER[this.config.forms[i]].desc}</p><p class="map-note">Light 6 / 3 / 12 \xB7 Heavy 14 / 5 / 19 \xB7 Launcher 12 / 4 / 22 \xB7 Power 12 / 6 / 24<br>Startup / active / recovery, in 60 Hz frames. Power recovery follows the selected condition. Close light + back throws; the same input within 8 frames breaks it.</p></section>`).join("");
      this.renderControls();
      this.$("duel-record").textContent = this.record.matches + " local matches remembered \xB7 " + DUEL_FORMS.map((f) => NAMES[f] + " " + this.record.wins[f] + "W").join(" \xB7 ");
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
      this.$("duel-instructions").textContent = p === "mobile" ? this.match?.bot ? "Solo ladder \xB7 drag to move, up to jump, down to crouch. Use LIGHT, HEAVY, LAUNCH, POWER and SUPER. Hold back to block." : "Pass & play \xB7 three seconds per turn. Drag to move, up to jump, down to crouch. LIGHT + back throws. The ready gate freezes the fight while hands swap." : p === "controller" ? "P1 pad: stick / D-pad move, A jump, X light, Y heavy, B launcher, RB power, RT super, Start pause. P2: a second pad, or arrows + K / L / ;, O power, P super. Hold back to block." : "P1: WASD move / jump / crouch \xB7 F light \xB7 G heavy \xB7 H launcher \xB7 R power \xB7 T super. P2: arrows \xB7 K light \xB7 L heavy \xB7 ; launcher \xB7 O power \xB7 P super. Hold back to block; close light + back throws. Esc pauses.";
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
            const id = data.option, values = id === "stage" ? Object.keys(DUEL_STAGES) : id === "opponent" ? this.profile() === "mobile" ? ["local"] : ["local", "bot"] : id === "condition" ? Object.keys(DUEL_CONDITIONS) : ["easy", "medium", "hard"], current = id === "stage" ? this.config.stage : id === "opponent" ? this.config.bot ? "bot" : "local" : id === "condition" ? this.config.condition : this.config.difficulty, next = values[(Math.max(0, values.indexOf(current)) + 1) % values.length];
            if (id === "stage") this.config.stage = next;
            else if (id === "opponent") this.config.bot = next === "bot";
            else if (id === "condition") this.config.condition = next;
            else this.config.difficulty = next;
            this.renderSelect();
            this.$("duel-cycle-" + id).focus({ preventScroll: true });
          }
          break;
        case "duel-form":
          if (!this.match && DUEL_FORMS.includes(data.form)) {
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
          this.config.condition = this.$("duel-condition").value || "classic";
          this.config.stage = this.$("duel-stage").value || "glass";
          this.config.bot = this.profile() !== "mobile" && this.$("duel-opponent").value === "bot";
          this.config.difficulty = this.$("duel-difficulty").value || "medium";
          this.match = createDuel({ ...this.config, profile: this.profile() });
          this.paused = false;
          this.accumulator = 0;
          this.seenEvents = 0;
          this.keys.clear();
          this.renderSelect();
          this.render(true);
          this.audio.effect("round");
          this.canvas.focus({ preventScroll: true });
          break;
        case "duel-ladder-start":
          if (this.ladder.next > 12) throw Error("The ladder is complete. Choose Start a new climb to replay it.");
          this.match = createLadderDuel(this.config.forms[0], this.ladder.next, this.profile());
          this.paused = false;
          this.accumulator = 0;
          this.seenEvents = 0;
          this.keys.clear();
          this.touch = { x: 0, y: 0, buttons: {} };
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
          this.keys.clear();
          this.touch = { x: 0, y: 0, buttons: {} };
          this.$("duel-stick").style.opacity = "1";
          this.$("duel-stick-thumb").style.transform = "translate(0,0)";
          this.render(true);
          this.canvas.focus({ preventScroll: true });
          break;
        case "duel-pause":
          if (this.match && this.match.phase !== "finished") {
            this.paused = !this.paused;
            this.keys.clear();
            this.touch = { x: 0, y: 0, buttons: {} };
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
          this.keys.clear();
          this.match = null;
          this.onQuit();
          break;
        default:
          if (action.startsWith("duel-input-")) {
            const key = action.slice(11);
            this.touch.buttons[key] = true;
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
      for (const action of ["light", "heavy", "launcher", "special", "super"]) {
        const el = this.$("duel-touch-" + action);
        el.addEventListener("pointerdown", (e2) => {
          e2.preventDefault();
          this.touch.buttons[action] = true;
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
      this.accumulator = Math.min(0.15, this.accumulator + seconds);
      while (this.accumulator >= 1 / 60) {
        stepDuel(this.match, duelInputs(this.profile(), this.keys, this.window.navigator?.getGamepads?.(), this.touch, this.match.turn));
        this.accumulator -= 1 / 60;
      }
      if (this.touchClick) {
        this.touch.buttons[this.touchClick] = false;
        this.touchClick = null;
      }
      for (const event of this.match.events) if (event.id > this.seenEvents) {
        this.seenEvents = event.id;
        if (event.type === "hit" || event.type === "chip") this.audio.effect("hit");
        if (event.type === "round") this.audio.effect("round");
        if (event.type === "ko") this.audio.effect("ko");
        if (event.type === "power" || event.type === "super") this.audio.effect("power");
        if (event.type === "throw") this.announce("Throw. Light + back breaks it within eight frames.");
      }
      if (this.match.phase === "finished" && !this.match.recorded) {
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
      const m = this.match, signature = [this.paused, m?.phase, m?.turn, m?.round, m?.replay, m?.winner, this.ladder.next].join(":");
      if (!force && signature === this.overlaySignature) return;
      this.overlaySignature = signature;
      const el = this.$("duel-overlay");
      el.classList.toggle("finishing", m?.phase === "finisher" && !this.paused);
      el.hidden = !m || m.phase === "playing" && !this.paused;
      if (!m) {
        el.innerHTML = "";
        return;
      }
      let title = "", copy = "", buttons = "";
      if (this.paused) {
        title = "The stage can wait.";
        copy = "This duel is paused.";
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
        copy = "The losing spark leaves its vessel. The seal closes.";
        buttons = '<button data-action="duel-skip">Skip seal</button>';
      } else if (m.phase === "finished") {
        title = NAMES[m.forms[m.winner]] + " wins the duel.";
        copy = "First to two \xB7 " + m.fighters.map((f) => f.rounds).join(" \u2014 ") + ". " + DUEL_CONDITIONS[m.condition].name + ". P1: " + Math.round(m.fighters[0].stats.damage) + " damage \xB7 " + m.fighters[0].stats.specials + " powers \xB7 " + m.fighters[0].stats.techs + " throw breaks.";
        buttons = (m.ladder ? this.ladder.next > 12 ? '<button class="primary-button" data-action="duel-ladder-reset">Start a new climb</button>' : '<button class="primary-button" data-action="duel-rematch">' + (m.winner === 0 ? "Climb to rung " + this.ladder.next : "Retry rung " + m.ladder.rung) + "</button>" : '<button class="primary-button" data-action="duel-rematch">Rematch</button>') + '<button data-action="duel-select">Character select & ladder</button><button data-action="duel-quit">Return to the start page</button>';
        if (m.ladder) {
          title = m.winner === 0 ? this.ladder.next > 12 ? "The ladder is yours." : "Rung " + m.ladder.rung + " conquered." : m.ladder.name + " holds the rung.";
          copy += " " + (m.winner === 0 ? "Your next rung is saved." : "Your climb stays at this rung.");
        }
      }
      el.innerHTML = title ? `<div class="duel-round-card"><span class="eyebrow">${m.ladder ? "RUNG " + m.ladder.rung + " / 12 \xB7 " + m.ladder.name.toUpperCase() : "TWO SPARKS \xB7 ONE STAGE"}</span><h2>${title}</h2><p>${copy}</p><div class="menu-actions">${buttons}</div></div>` : "";
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
      this.drawStage(ctx2, stage, time, m);
      if (m) {
        ctx2.save();
        const hit = m.events.filter((e2) => e2.type === "hit" && m.frames - e2.frame < 9).at(-1);
        if (hit && !setting.reduced && setting.shake > 0) {
          const amount = (9 - (m.frames - hit.frame)) * 0.45 * setting.shake;
          ctx2.translate(Math.sin(m.frames * 3) * amount, Math.cos(m.frames * 4) * amount);
        }
        for (let i = 0; i < 2; i++) this.drawFighter(ctx2, m, i, time, setting);
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
      const tint = stage.color;
      ctx2.fillStyle = "#101f21";
      ctx2.fillRect(0, 0, 960, 440);
      const parallax = ((m?.fighters[0].x ?? 290) + (m?.fighters[1].x ?? 670) - 960) * 0.04;
      for (let layer = 0; layer < 3; layer++) {
        ctx2.globalAlpha = 0.14 + layer * 0.1;
        ctx2.fillStyle = tint;
        const offset = parallax * (layer + 1);
        for (let i = 0; i < 9; i++) {
          const x = i * 140 - 70 + offset, y = 70 + layer * 70;
          if (stage.look === "root") {
            ctx2.lineWidth = 13 - layer * 3;
            ctx2.strokeStyle = tint;
            ctx2.beginPath();
            ctx2.moveTo(x, 440);
            ctx2.bezierCurveTo(x + 45, y + 150, x - 50, y + 30, x + 40, y);
            ctx2.stroke();
          } else if (stage.look === "basalt") {
            ctx2.beginPath();
            ctx2.moveTo(x, 440);
            ctx2.lineTo(x + 30, y + 40);
            ctx2.lineTo(x + 95, y);
            ctx2.lineTo(x + 124, 440);
            ctx2.fill();
          } else {
            ctx2.fillRect(x, y, 12, 440 - y);
            ctx2.beginPath();
            ctx2.arc(x + 65, y + 70, 60, Math.PI, Math.PI * 2);
            ctx2.strokeStyle = tint;
            ctx2.lineWidth = 8;
            ctx2.stroke();
            ctx2.fillRect(x + 118, y, 12, 440 - y);
          }
        }
      }
      ctx2.globalAlpha = 1;
      if (stage.look === "orbit" || stage.look === "night") {
        ctx2.strokeStyle = tint + "66";
        ctx2.lineWidth = 2;
        ctx2.beginPath();
        ctx2.arc(480, 210, 120, 0, Math.PI * 2);
        ctx2.stroke();
        ctx2.beginPath();
        ctx2.arc(480, 210, 146, 0, Math.PI * 2);
        ctx2.stroke();
      }
      if (stage.look === "tide") {
        ctx2.fillStyle = "#68cfe321";
        for (let i = 0; i < 5; i++) ctx2.fillRect(0, 360 + i * 14 + Math.sin(time + i) * 3, 960, 5);
      }
      ctx2.fillStyle = "#12251b";
      ctx2.fillRect(0, 440, 960, 100);
      ctx2.fillStyle = tint;
      ctx2.fillRect(0, 440, 960, 2);
      ctx2.strokeStyle = tint + "28";
      ctx2.lineWidth = 1;
      for (let i = 0; i < 13; i++) {
        ctx2.beginPath();
        ctx2.moveTo(i * 80, 442);
        ctx2.lineTo(i * 95 - 75, 540);
        ctx2.stroke();
      }
      for (const y of [461, 490, 533]) {
        ctx2.beginPath();
        ctx2.moveTo(0, y);
        ctx2.lineTo(960, y);
        ctx2.stroke();
      }
      ctx2.textAlign = "center";
      ctx2.font = "11px sans-serif";
      ctx2.fillStyle = tint + "aa";
      ctx2.fillText(stage.name.toUpperCase(), 480, 517);
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
        const sides = { spark: 4, human: 5, computer: 4, animal: 3, tree: 6, rock: 6 }[f.form];
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
      if (ko && f.form !== "spark") {
        ctx2.save();
        ctx2.translate(f.x, groundY - 15);
        ctx2.rotate(f.facing * 1.1);
        ctx2.translate(-f.x, -(groundY - 15));
      }
      drawVessel(ctx2, this.image, f.form, { x: f.x, y, groundY, flash: f.flash, facing: f.facing }, time, { ...setting, reduced: setting.reduced }, { color: COLOR[i], size, duel: true, alpha: seal ? Math.max(0, 1 - p) : ko ? 0.5 : 1 });
      if (ko && f.form !== "spark") ctx2.restore();
      if (ko || seal) {
        ctx2.fillStyle = COLOR[i];
        ctx2.beginPath();
        ctx2.arc(f.x, groundY - 70 - (seal ? -p * 55 : (120 - m.breakFrames) * 0.5), 10 * (seal ? 1 - p : 1), 0, Math.PI * 2);
        ctx2.fill();
      }
      if (f.blocking || f.guard > 0) {
        ctx2.strokeStyle = COLOR[i];
        ctx2.lineWidth = 3;
        ctx2.beginPath();
        ctx2.arc(f.x + f.facing * 26, y, 48, -Math.PI / 2, Math.PI / 2);
        ctx2.stroke();
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
        const attack3 = f.attack, move2 = DUEL_MOVES[attack3.kind], active = attack3.frame >= move2.startup && attack3.frame < move2.startup + move2.active;
        ctx2.strokeStyle = COLOR[i] + (active ? "ff" : "77");
        ctx2.lineWidth = active ? 5 : 2;
        const reach = attack3.kind === "super" ? 205 : attack3.kind === "special" && ["rock", "computer"].includes(f.form) ? 340 : move2.range;
        ctx2.beginPath();
        if (attack3.kind === "special" && f.form === "rock") {
          ctx2.moveTo(f.x, groundY - 5);
          ctx2.lineTo(f.x + f.facing * reach, groundY - 5);
        } else if (attack3.kind === "special" && f.form === "computer") {
          ctx2.moveTo(f.x, y);
          ctx2.lineTo(f.x + f.facing * reach, y);
        } else ctx2.arc(f.x, y, reach * 0.65, f.facing > 0 ? -1.15 : Math.PI - 1.15, f.facing > 0 ? 1.15 : Math.PI + 1.15);
        ctx2.stroke();
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
        ctx2.fillText(f.meter >= 100 ? "SUPER READY" : "METER " + Math.floor(f.meter), i ? x + 345 : x, 83);
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
      const response = m.events.filter((e2) => ["tech", "hit"].includes(e2.type) && m.frames - e2.frame < 40).at(-1);
      if (response && (response.type === "tech" || response.counter)) {
        ctx2.fillStyle = "#f0d394";
        ctx2.fillText(response.type === "tech" ? "THROW BROKEN" : "COUNTER HIT", 480, 132);
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

  // descent.js
  var $ = (id) => document.getElementById(id);
  var KEY = "spark-substrate-descent-v2";
  var signed = (n) => n > 0 ? "+" + n : String(n);
  var pad = (n) => String(n).padStart(2, "0");
  var PREVIOUS_KEY = "spark-substrate-previous-spark";
  var CREDENTIAL_KEY = "spark-substrate-save-credential";
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
  var images = { floor: new Image(), sprites: new Image(), enemies: new Image(), floors: new Image(), newEnemies: new Image(), newFloors: new Image(), castleFloors: new Image(), props: new Image(), worldFloors: new Image(), worldBosses: new Image() };
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
    const pending = ["descent", "dungeon"].includes(entryMode) && run && !menu && ["boon", "resolve", "milestone"].includes(run.phase), note = $("settings-pending");
    note.hidden = !pending;
    const text = pending ? (run.phase === "boon" ? "Your gift is waiting." : run.phase === "resolve" ? "Your story choice is waiting." : "Your descent choice is waiting.") + " Close settings to return to it." : "";
    if (note.textContent !== text) note.textContent = text;
  }
  function renderSettings() {
    renderPendingChoice();
    $("setting-profile").value = settings.inputProfile ?? "";
    $("damage-numbers").textContent = "Damage numbers " + (settings.damageNumbers ? "on" : "off");
    $("damage-numbers").setAttribute("aria-pressed", String(settings.damageNumbers));
    $("entry-sound").textContent = sound ? "Mute sound" : "Enable sound";
    for (const id of ["master", "effects", "ambient", "shake", "flashes"]) {
      $("setting-" + id).value = Math.round(settings[id] * 100);
      $("setting-value-" + id).textContent = Math.round(settings[id] * 100) + "%";
    }
    $("control-hints").textContent = profileCopy(settings.inputProfile, settings.bindings);
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
    if (!["descent", "dungeon"].includes(entryMode) || !INPUT_PROFILES.includes(settings.inputProfile)) throw Error("Choose an input profile and confirm Descent on the start page first.");
  }
  function renderStart() {
    const ready = INPUT_PROFILES.includes(settings.inputProfile);
    touchDevice = settings.inputProfile === "mobile";
    $("start-screen").hidden = entryMode !== "start";
    $("descent-root").hidden = !["descent", "dungeon"].includes(entryMode);
    $("duel-root").hidden = entryMode !== "duel";
    for (const profile of INPUT_PROFILES) {
      $("profile-" + profile).setAttribute("aria-pressed", String(settings.inputProfile === profile));
      $("profile-" + profile).classList.toggle("selected", settings.inputProfile === profile);
    }
    $("profile-copy-pc").textContent = profileCopy("pc", settings.bindings);
    $("entry-status").textContent = ready ? PROFILE_LABELS[settings.inputProfile] + " selected. Confirm a mode to enter." : "Choose an input profile, then confirm a mode.";
    for (const id of ["entry-begin", "entry-daily", "entry-duel", "entry-join", "entry-dungeon"]) $(id).disabled = !ready;
    $("entry-duel").disabled = !ready || online.active;
    $("entry-dungeon").disabled = !ready || online.active;
    $("entry-dungeon").textContent = dungeonState.run && !["dead"].includes(dungeonState.run.phase) ? "Endless dungeon \xB7 continue floor " + dungeonState.run.dungeon.floor : "Endless dungeon";
    $("entry-continue").hidden = !hasJourney(meta, run);
    $("entry-continue").disabled = !ready;
    $("entry-sound").textContent = sound ? "Mute sound" : "Enable sound";
    $("entry-sound").setAttribute("aria-pressed", String(sound));
    $("descent-root").classList.toggle("input-mobile", touchDevice);
    $("duel-root").classList.toggle("input-mobile", touchDevice);
    $("duel-root").classList.toggle("input-controller", settings.inputProfile === "controller");
    $("orientation-note").hidden = !touchDevice;
    if (!["descent", "dungeon"].includes(entryMode)) $("touch-controls").hidden = true;
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
    if (sound) void audio.enable(true).catch((error) => {
      sound = false;
      persistSettings();
      announce(error.message);
    });
    if (entryMode === "start") $("entry-begin").focus({ preventScroll: true });
  }
  function enterDescent(intent = "descent") {
    if (entryMode === "dungeon") returnToStart();
    if (!INPUT_PROFILES.includes(settings.inputProfile)) throw Error("Choose how you enter first.");
    entryMode = "descent";
    campaignEntered = true;
    if (!progress) connectProgress();
    renderSaveStatus();
    renderStart();
    resize();
    if (intent === "continue" && run?.phase === "playing") paused = false;
    finish();
    renderRail();
    renderOverlay(true);
    if (intent === "daily") act("daily");
    if (intent === "join") act("online");
    if (!online.active) void online.resume().then((resumed) => {
      if (resumed) {
        $("online-room-code").textContent = online.code;
        renderOverlay(true);
        renderRail();
      }
    });
  }
  function returnToStart() {
    if (entryMode === "dungeon") {
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
  function enterDuel() {
    if (entryMode === "dungeon") returnToStart();
    if (!INPUT_PROFILES.includes(settings.inputProfile)) throw Error("Choose how you enter first.");
    if (online.active) throw Error("Leave the co-op room before entering a duel.");
    entryMode = "duel";
    clearInput();
    renderStart();
    duel.open();
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
    return `<div class="result-stats extended">${[[record.chambers, record.chambers === 1 ? "chamber" : "chambers"], [record.kills, "constructs"], [Number(record.damageDealt ?? 0).toLocaleString(), "damage dealt"], [Math.floor(record.seconds / 60) + ":" + pad(record.seconds % 60), "time"], [record.powers ?? 0, "powers used"], [meta.bestRun?.chambers ?? record.chambers, "best chambers"]].map(([value, label]) => `<div><strong>${escapeText(value)}</strong><span>${label}</span></div>`).join("")}</div><div class="run-build"><p><b>${FORMS[record.form]?.name ?? "Spark"} \xB7 LV ${record.level}</b>${record.daily ? " \xB7 Daily " + escapeText(record.daily.day) + " UTC" : ""}</p><p>${(record.equipment ?? []).map(escapeText).join(" \xB7 ") || "Native vessel weapon"}</p><p>${(record.gifts ?? []).map((gift) => escapeText(BOONS[gift.id]?.name ?? gift.id) + " \xD7" + Number(gift.count)).join(" \xB7 ") || "No battle gifts"}</p><p>${Object.entries(record.mastery ?? {}).filter(([, xp]) => xp > 0).map(([form, xp]) => FORMS[form].name + " +" + xp + " mastery").join(" \xB7 ") || (record.daily ? "Daily results grant no campaign mastery." : "Mastery grows by clearing chambers.")}</p></div>`;
  }
  var keys = /* @__PURE__ */ new Set();
  var stick = { x: 0, y: 0 };
  var dashRequested = false;
  var powerRequested = false;
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
  var remotePulse = { dash: false, power: false, morph: null };
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
      if (data.inputSeq > remoteInputSeq) {
        remoteInputSeq = data.inputSeq;
        remoteInput = data.input ?? { x: 0, y: 0 };
        remotePulse.dash = remotePulse.dash || !!remoteInput.dash;
        remotePulse.power = remotePulse.power || !!remoteInput.power;
        remotePulse.morph = remoteInput.morph ?? null;
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
    if (action !== "online-leave") requireDescent();
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
    return '<div class="journal-entries">' + (entries.length ? entries.map((entry) => `<article><span class="eyebrow">${escapeText(entry.speaker)}</span><h3>${escapeText(entry.title)}</h3><p>${escapeText(entry.text)}${ROOMS[entry.room]?.key && (run?.keys ?? meta.keys ?? []).includes(ROOMS[entry.room].key) ? " <b>Key collected \xB7 carried on your keyring.</b>" : ""}</p></article>`).join("") : "<p>Inhabit a body to begin remembering the story.</p>") + '</div><h3>Constructs encountered</h3><div class="bestiary">' + (enemies.length ? enemies.filter((id) => ENEMY_LORE[id]).map((id) => `<article><h4>${ENEMY_LORE[id].name}</h4><p>${ENEMY_LORE[id].desc}</p></article>`).join("") : "<p>There are no encounters in this memory yet.</p>") + "</div>";
  }
  function announce(text) {
    $("announcer").textContent = text;
  }
  var progress = null;
  function savedState() {
    return { version: 2, meta, run: online.active ? null : entryMode === "dungeon" ? campaignCache?.run ?? null : run };
  }
  function save() {
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
    if (entryMode === "dungeon") {
      el.textContent = saveAvailable ? "Dungeon saved on this device" : "Dungeon save unavailable \xB7 keep this page open";
      el.title = "Your campaign save stays separate.";
      return;
    }
    el.textContent = status === "conflict" ? "Another tab saved this spark. Close extra tabs and reload to continue." : !saveAvailable ? status === "saved" ? "Progress saved online \xB7 device storage unavailable" : "Device save unavailable \xB7 keep this page open" : status === "error" ? "Server save pending \xB7 device copy kept" : "Progress saved on this device";
    el.title = status === "saved" ? "Also backed up online." : status === "pending" ? "Online backup queued." : status === "connecting" ? "Connecting to your online backup." : status === "error" ? "Online backup will retry." : status === "conflict" ? "The newest online save is protected from competing tabs." : "Your recovery copy is stored in this browser.";
  }
  function clearInput() {
    keys.clear();
    stick = { x: 0, y: 0 };
    dashRequested = false;
    powerRequested = false;
    interactRequested = false;
    interactHeld = false;
    $("joystick-thumb").style.transform = "translate(0,0)";
  }
  function spriteStyle(form) {
    const index = BODIES[form].sprite;
    return `--sprite-x:${index % 4 * 100 / 3}%;--sprite-y:${Math.floor(index / 4) * 100}%;--form-color:${BODIES[form].color}`;
  }
  function mapHtml(large = false) {
    const world = large ? mapWorld : worldOf(run?.room ?? "threshold"), rooms = Object.entries(ROOMS).filter(([, room]) => room.world === world), minY = Math.min(...rooms.map(([, r]) => r.coord[1])), ring = run?.keys ?? meta.keys ?? [], abilities = run?.abilities ?? meta.abilities, seals = run?.seals ?? meta.seals ?? [], currentForms = [run?.player.hp > 0 ? run.form : null, run?.partner?.hp > 0 ? run.partnerForm : null];
    return rooms.map(([id, room], index) => {
      const known = large && !run || (!run ? ["threshold", ...meta.explored ?? []].includes(id) : run.discovered.includes(id)), here = run?.room === id || !run && id === "threshold", clear = run?.cleared.includes(id), label = large ? known ? pad(index + 1) + " \xB7 " + room.short : "Unexplored" : known ? room.short.split(" ")[0] : "";
      const links = known ? Object.entries(room.exits).filter(([, exit]) => ROOMS[exit.to].world === world).map(([direction, exit]) => {
        const sealed = exit.keys?.some((key) => !ring.includes(key)) || exit.seals?.some((seal) => !seals.includes(seal)) || exit.requires && !abilities.includes(exit.requires) || run && exit.vessel && !currentForms.includes(exit.vessel), opened = (run?.openDoors ?? []).includes(doorId(id, exit.to));
        return `<i class="map-link ${direction} ${sealed ? "locked" : ""} ${opened ? "opened" : ""}" aria-hidden="true"></i>`;
      }).join("") : "";
      return `<button class="map-room ${known ? "" : "unknown"} ${here ? "here" : ""} ${clear ? "clear" : ""}" style="grid-column:${room.coord[0] + 1};grid-row:${room.coord[1] - minY + 1}" data-action="map-room" data-room="${id}" title="${large || known ? room.name : "Undiscovered chamber"}" aria-label="${known ? room.name : "Undiscovered chamber"}${here ? ", your location" : ""}${clear ? ", cleared" : ""}${known && room.key ? ", " + KEYS[room.key].name + (ring.includes(room.key) ? " collected" : " waiting after clear") : ""}">${links}<span>${label}</span>${clear ? '<i class="clear-stamp" aria-hidden="true">\u2713</i>' : ""}${known && room.key ? '<span class="map-key ' + (ring.includes(room.key) ? "collected" : "waiting") + '" title="' + KEYS[room.key].name + (ring.includes(room.key) ? " \xB7 collected" : " \xB7 waiting after clear") + '">' + KEY_ICON + "</span>" : ""}</button>`;
    }).join("");
  }
  function mapColumns(world) {
    return Math.max(...Object.values(ROOMS).filter((room) => room.world === world).map((room) => room.coord[0])) + 1;
  }
  function renderWorldMap() {
    const seals = run?.seals ?? meta.seals ?? [], world = WORLDS[mapWorld];
    $("world-tabs").innerHTML = WORLD_ORDER.map((id) => `<button data-action="map-world" data-world="${id}" class="${id === mapWorld ? "selected" : ""}"><b>${WORLDS[id].rank + 1}</b> ${WORLDS[id].name}<small>${worldUnlocked(id, seals) ? seals.includes(id) ? "Guardian seal found" : "Open world" : "Seal required"}</small></button>`).join("");
    $("map-world-title").textContent = world.name;
    $("large-map").style.gridTemplateColumns = `repeat(${mapColumns(mapWorld)},minmax(90px,1fr))`;
    $("large-map").style.minWidth = mapColumns(mapWorld) * 95 + "px";
    const ys = Object.values(ROOMS).filter((room) => room.world === mapWorld).map((room) => room.coord[1]);
    $("large-map").style.gridTemplateRows = `repeat(${Math.max(...ys) - Math.min(...ys) + 1},64px)`;
    $("large-map").innerHTML = mapHtml(true);
    $("map-description").textContent = world.desc + " " + (worldUnlocked(mapWorld, seals) ? "Travel from a safe checkpoint or a defeated guardian." : "Defeat the preceding guardians to open this world.");
    $("world-travel").disabled = online.role === "guest" || !checkpointAvailable(run) || !worldUnlocked(mapWorld, seals);
    $("world-travel").dataset.world = mapWorld;
    $("world-travel").textContent = "Travel to " + world.name;
  }
  function connectProgress(preferDevice = false) {
    const epoch = loadEpoch, instance = new ProgressSave({ fetch: window.fetch?.bind(window), storage: localStorage, onStatus: renderSaveStatus });
    progress = instance;
    void instance.open(savedState()).then((saved) => {
      if (instance !== progress || epoch !== loadEpoch) return;
      if (saved) {
        if (entryMode === "dungeon") {
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
  function renderRail() {
    $("active-mode-label").textContent = entryMode === "dungeon" ? "Endless dungeon" : "Descent";
    $("nav-new-save").hidden = entryMode === "dungeon";
    $("room-count-label").textContent = entryMode === "dungeon" ? "floors cleared" : "chambers cleared";
    if (entryMode !== "dungeon" && !settings.guideGift && (run?.level >= 2 || Object.values(run?.boons ?? {}).some(Boolean) || meta.bestRun?.level >= 2)) {
      settings.guideGift = true;
      persistSettings();
    }
    $("leave-room-button").hidden = !online.active;
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
    $("online-strip").hidden = intro;
    if (run?.daily) $("run-number").textContent = "DAILY \xB7 " + run.daily.day + " UTC";
    const seconds = Math.floor(run?.time ?? 0);
    $("run-clock").textContent = pad(Math.floor(seconds / 60)) + ":" + pad(seconds % 60);
    $("clock-state").textContent = run && run.phase !== "playing" ? { boon: "PAUSED \xB7 GIFT", resolve: run.dungeon ? "CHECKPOINT" : "PAUSED \xB7 STORY", milestone: "PAUSED \xB7 JOURNEY", dead: "RUN ENDED", won: "COMPLETE" }[run.phase] ?? "" : paused ? "PAUSED" : "";
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
    $("room-count").textContent = (run ? run.cleared.filter((id) => !ROOMS[id].safe).length : 0) + " / " + Object.values(ROOMS).filter((room) => !room.safe).length;
    $("mini-map").style.gridTemplateColumns = `repeat(${mapColumns(worldOf(run?.room ?? "threshold"))},minmax(57px,1fr))`;
    const miniYs = Object.values(ROOMS).filter((room) => room.world === worldOf(run?.room ?? "threshold")).map((room) => room.coord[1]);
    $("mini-map").style.gridTemplateRows = `repeat(${Math.max(...miniYs) - Math.min(...miniYs) + 1},29px)`;
    $("mini-map").innerHTML = mapHtml();
    $("mini-map-location").textContent = ROOMS[run?.room ?? "threshold"].name + " \xB7 expand for room names";
    $("ability-list").innerHTML = Object.entries(ABILITIES).map(([id, a]) => `<div class="ability ${known.includes(id) ? "known" : ""}"><span aria-hidden="true">${a.glyph}</span><div>${a.name}<small>${known.includes(id) ? a.desc : "Not remembered yet"}</small></div></div>`).join("");
    const gifts = run ? Object.entries(run.boons).filter(([, n]) => n > 0) : [];
    $("boon-list").innerHTML = gifts.length ? gifts.map(([id, n]) => `<span class="boon-chip" title="${BOONS[id].desc}">${BOONS[id].name}<b>\xD7${n}</b></span>`).join("") : "<p>No gifts yet. Gather the blue fragments.</p>";
    $("world-message").textContent = run?.noticeTime > 0 ? adaptPrompt(run.notice, settings.inputProfile, settings.bindings) : run && !run.cleared.includes(run.room) ? "Keep moving. Blue fragments remember the constructs you break." : ROOMS[run?.room ?? "threshold"].desc;
    const gateHint = run && !run.dungeon && run.phase === "playing" ? nearestGate(run, view.player) : null;
    if (gateHint?.available && gateHint.distance < 105) $("world-message").textContent = gateHint.direction.toUpperCase() + " \xB7 " + hint("interact") + " \xB7 " + ROOMS[gateHint.to].name;
    else if (entryMode !== "dungeon" && meta.runs === 0 && run && run.phase === "playing" && run.noticeTime <= 0) $("world-message").textContent = Object.values(run.boons).some(Boolean) ? "Your weapon fights automatically. Follow the gates." : moveHint(settings.inputProfile, settings.bindings) + ". " + hint("dash") + " to dash. Your weapon fights. Go north.";
    const chosen = specialty(run?.training ?? meta.training, form);
    $("specialty-label").textContent = chosen ? chosen.name + " specialty" : meta.runs ? "Mastery is remembered between lives." : "";
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
    $("vessel-button").textContent = resonance ? hint("morph") + " \xB7 Vessels" : "Vessels \xB7 find resonance";
    $("touch-morph").hidden = !resonance;
    $("touch-controls").hidden = !(["descent", "dungeon"].includes(entryMode) && touchDevice && run && run.phase === "playing" && !paused && !menu);
    const compact = ["descent", "dungeon"].includes(entryMode) && playable && !paused && !document.querySelector("dialog[open]") && !railExpanded;
    $("game-layout").classList.toggle("compact-rail", compact);
    $("rail-expand").textContent = railExpanded ? "Collapse" : "Expand";
    if (entryMode === "dungeon") {
      for (const id of ["header-karma", "equipment-nav", "online-nav", "skills-nav", "key-section", "ability-section", "gear-section", "online-strip", "seal-count"]) $(id).hidden = true;
      $("header-memory").hidden = false;
      $("header-memory").textContent = "ENDLESS";
      $("header-memory").title = "A separate dungeon current.";
      $("world-label").textContent = run ? "FLOOR " + run.dungeon.floor + " \xB7 " + dungeonRung(run.dungeon.floor).toUpperCase() : "ENDLESS DUNGEON";
      $("run-number").textContent = "BEST \xB7 " + dungeonState.record.best + " FLOORS";
      $("room-count").textContent = (run?.dungeon.floorsCleared ?? 0) + " / \u221E";
      $("power-section").hidden = !run;
      $("mini-map").style.gridTemplateColumns = "1fr";
      $("mini-map").style.gridTemplateRows = "auto";
      $("mini-map").innerHTML = run ? '<span class="dungeon-condition">' + DUNGEON_CONDITIONS[run.dungeon.condition].name + "</span>" : "";
      $("mini-map-location").textContent = run ? DUNGEON_CONDITIONS[run.dungeon.condition].desc : "No final floor. Every fifth floor has a guardian.";
    }
  }
  function menuContent() {
    if (entryMode === "dungeon") return dungeonMenuContent();
    return `<div class="menu-card"><span class="eyebrow">${meta.runs ? "KARMA " + signed(meta.karma) + " \xB7 A NEW CURRENT" : "YOUR FIRST LIFE"}</span><h2>${meta.runs ? "The body falls.<br>The spark remembers." : "A spark against<br>the pattern."}</h2><p>${meta.runs ? "Choose your next body. Your equipment, abilities, and lasting memories cross the threshold." : moveHint(settings.inputProfile, settings.bindings) + ". " + hint("dash") + " to dash. Your weapon fights. Go north."}</p><div class="form-choices">${offeredForms(meta).map((form, i) => `<button type="button" class="form-choice" data-action="start" data-form="${form}" style="--form-color:${BODIES[form].color}" title="${BODIES[form].desc}"><span class="sprite-portrait" style="${spriteStyle(form)}"></span><strong>${FORMS[form].name}</strong><span class="weapon-label">${BODIES[form].weapon}</span><span class="form-start">${touchDevice ? "Tap to inhabit" : settings.inputProfile === "controller" ? "A \xB7 Inhabit this form" : "<kbd>" + (i + 1) + "</kbd> Inhabit this form"}</span></button>`).join("")}</div><div class="menu-actions">${meta.runs ? '<button class="secondary-button" data-action="forge">Equipment & forge \xB7 \u25C7 ' + meta.essence + "</button>" : ""}${meta.runs ? '<button class="secondary-button" data-action="journal">Story journal</button>' : ""}<button class="secondary-button" data-action="new-save">New save</button>${meta.runs || meta.lastRun ? `<button class="secondary-button" data-action="skills">Skill trees</button><button class="secondary-button" data-action="daily">Daily descent</button>` : ""}${meta.lastRun ? '<button class="secondary-button" data-action="last-run">Last run</button>' : ""}</div></div><div class="menu-hints">${profileCopy(settings.inputProfile, settings.bindings)}<br>${touchDevice ? "Tap a card when a choice appears." : settings.inputProfile === "controller" ? "D-pad highlights \xB7 A confirms" : "Space inhabits a form \xB7 1\u20133 selects gifts \xB7 Enter confirms highlighted stories"}</div>`;
  }
  function dungeonMenuContent() {
    return `<div class="menu-card"><span class="eyebrow">ENDLESS DUNGEON \xB7 A SEPARATE CURRENT</span><h2>The staircase has no last step.</h2><p>The Maker builds another floor each time you break one. Enemies grow stronger, conditions change, and a guardian waits every fifth floor. All six vessels can morph from the start. Your campaign is kept.</p><div class="form-choices">${Object.entries(BODIES).map(([form, body], i) => `<button class="form-choice" data-action="start" data-form="${form}" style="--form-color:${body.color}"><span class="sprite-portrait" style="${spriteStyle(form)}"></span><strong>${FORMS[form].name}</strong><span class="weapon-label">${body.weapon}</span><span class="form-start">${touchDevice ? "Tap" : settings.inputProfile === "controller" ? "A" : i + 1} \xB7 Inhabit</span></button>`).join("")}</div><p>Best: ${dungeonState.record.best} ${dungeonState.record.best === 1 ? "floor" : "floors"} \xB7 ${dungeonState.record.attempts} completed ${dungeonState.record.attempts === 1 ? "attempt" : "attempts"}</p><button class="secondary-button" data-action="home">Return to start</button></div>`;
  }
  function dungeonCheckpointContent() {
    const next = dungeonFloor(run.seed, run.dungeon.floor + 1), pending = run.xp >= run.nextXp;
    return `<div class="menu-card"><span class="eyebrow">FLOOR ${run.dungeon.floor} CLEARED \xB7 ${dungeonRung(run.dungeon.floor).toUpperCase()}</span><h2>${run.bossDefeated?.room === run.room ? escapeText(run.bossDefeated.name) + " defeated" : "The Maker adds another step."}</h2><p>Restored up to ${run.dungeon.condition === "wither" ? 8 : 18} HP. ${Math.ceil(run.player.hp)} / ${run.player.maxHp} HP remains. Gifts and your build carry into the next floor.</p><div class="next-floor"><b>Next \xB7 Floor ${next.floor}${next.boss ? " \xB7 GUARDIAN" : ""}</b><p>${ROOMS[next.room].name} \xB7 ${DUNGEON_CONDITIONS[next.condition].name}</p><p>${DUNGEON_CONDITIONS[next.condition].desc} Enemy health \xD7${next.pressure.health.toFixed(2)}.</p></div><div class="menu-actions"><button class="primary-button" data-action="${pending ? "dungeon-gifts" : "dungeon-next"}">${pending ? "Remember waiting gifts" : "Descend to floor " + next.floor} \xB7 ${settings.inputProfile === "pc" ? "Enter" : settings.inputProfile === "controller" ? "A" : "Tap"}</button><button class="secondary-button" data-action="home">Save & return to start</button></div><p class="overlay-note">Seed ${run.seed} \xB7 ${run.dungeon.floorsCleared} ${run.dungeon.floorsCleared === 1 ? "floor" : "floors"} cleared. The clock waits at checkpoints.</p></div>`;
  }
  function dungeonResultContent() {
    return `<div class="menu-card"><span class="eyebrow">THE STAIRCASE REMEMBERS</span><h2>Floor ${run.dungeon.floor} holds your echo.</h2><div class="result-stats"><div><strong>${run.dungeon.floorsCleared}</strong><span>${run.dungeon.floorsCleared === 1 ? "floor cleared" : "floors cleared"}</span></div><div><strong>${run.kills}</strong><span>constructs</span></div><div><strong>${dungeonState.record.best}</strong><span>best floors</span></div></div><p>${FORMS[run.form].name} \xB7 LV ${run.level} \xB7 ${Math.round(run.stats.damageDealt).toLocaleString()} damage \xB7 ${dungeonRung(run.dungeon.floor)} rung</p><p>${Object.entries(run.boons).filter(([, n]) => n > 0).map(([id, n]) => BOONS[id].name + " \xD7" + n).join(" \xB7 ") || "No gifts remembered"}</p><p>Your campaign spark is waiting where you left it.</p><div class="menu-actions"><button class="primary-button" data-action="dungeon-new">Another endless attempt</button><button class="secondary-button" data-action="home">Return to start</button></div></div>`;
  }
  function renderDungeonMap() {
    const first = run?.dungeon.floor ?? 1, seed = run?.seed ?? 0;
    $("dungeon-map-content").innerHTML = `<p>${run ? dungeonRung(first) + " rung \xB7 " + run.dungeon.floorsCleared + (run.dungeon.floorsCleared === 1 ? " floor cleared" : " floors cleared") : "Choose a vessel to begin."} Every fifth floor is a guardian checkpoint. Conditions and strength are shown before you descend.</p><ol class="dungeon-route">${Array.from({ length: 5 }, (_, i) => dungeonFloor(seed, first + i)).map((f) => `<li><b>Floor ${f.floor}${f.boss ? " \xB7 GUARDIAN" : ""}</b><span>${ROOMS[f.room].name}</span><small>${DUNGEON_CONDITIONS[f.condition].name} \xB7 health \xD7${f.pressure.health.toFixed(2)}</small></li>`).join("")}</ol>`;
  }
  function vesselContent() {
    const view = vessel();
    return `<p>One spark, six bodies. Your health percentage, equipment, and gifts carry across the change. Resonance recovers in 3 seconds.</p><div class="vessel-choices">${Object.entries(BODIES).map(([form, body], i) => `<button type="button" class="form-choice vessel-choice ${view.form === form ? "current" : ""}" data-action="morph" data-form="${form}" style="--form-color:${body.color}" ${view.form === form || view.player?.hp <= 0 || (view.player?.morphCooldown ?? 0) > 0 ? "disabled" : ""}><span class="sprite-portrait" style="${spriteStyle(form)}"></span><strong>${FORMS[form].name}</strong><span class="weapon-label">${body.weapon}</span><small class="power-label">${hint("power")} \xB7 ${VESSEL_POWERS[form].name}</small><span class="form-start">${view.form === form ? "Current vessel" : i + 1 + " \xB7 Inhabit"}</span></button>`).join("")}</div><p class="overlay-note">${(view.player?.morphCooldown ?? 0) > 0 ? "Resonance is recovering; return to the descent for a moment." : settings.inputProfile === "controller" ? "D-pad highlights; A inhabits. B closes this window." : touchDevice ? "Tap a whole card to inhabit." : "Press 1\u20136 or click a whole card. Escape closes this window."}</p>`;
  }
  function roomDescription(id) {
    const room = ROOMS[id];
    if (!room) return "";
    const exits = Object.entries(room.exits).map(([dir, exit]) => dir + ": " + ROOMS[exit.to].name + (exit.keys ? " \xB7 " + exit.keys.map((key) => KEYS[key].name).join(" + ") : "") + (exit.vessel ? " \xB7 " + FORMS[exit.vessel].name + " vessel" : "") + (exit.requires ? " \xB7 " + ABILITIES[exit.requires].name : "") + (exit.seals ? " \xB7 Guardian seal required" : ""));
    return room.desc + " Routes: " + exits.join(" / ");
  }
  function forgeContent() {
    const active = run && !["dead", "won"].includes(run.phase), checkpoint = checkpointAvailable(run), equipment = active ? prepareEquipment({ inventory: { ...run.daily ? createMeta().inventory : meta.inventory, ...run.equipmentLevels, ...Object.fromEntries((run.loot ?? []).map((id) => [id, run.equipmentLevels?.[id] ?? 0])) }, loadout: run.loadout }) : prepareEquipment(meta), set = matchedSet(equipment.loadout);
    return `<p>${active ? "Equip found gear at a safe checkpoint or a defeated guardian. Enhancement and lasting memories are purchased between lives." : "Carry a weapon, armor, relic, and ward. Found items can be enhanced to +3."}</p>${set ? `<p class="active-set">${SET_BONUSES[set].name} \xB7 ${SET_BONUSES[set].desc}</p>` : ""}<p class="forge-balance">\u25C7 ${meta.essence} banked essence</p><div class="equipment-grid">${Object.entries(EQUIPMENT).map(([id, item]) => {
      const owned = id in equipment.inventory, level = equipment.inventory[id] ?? 0, equipped = equipment.loadout[item.slot] === id, cost = enhancementCost(meta, id), art = item.art !== void 0, style = art ? `--item-x:${item.art % 4 * 100 / 3}%;--item-y:${Math.floor(item.art / 4) * 50}%` : `--item-x:${item.sprite % 3 * 50}%;--item-y:${Math.floor(item.sprite / 3) * 100}%`;
      return `<article class="equipment-card ${owned ? "" : "locked"}"><span class="equipment-icon ${art ? "world-equipment" : ""}" style="${style}" aria-hidden="true"></span><div><span class="eyebrow">${item.slot.toUpperCase()} \xB7 ${owned ? equipped ? "EQUIPPED" : "OWNED" : item.origin}</span><h3>${item.name}${level ? " +" + level : ""}</h3><p>${item.desc}</p><p class="item-effects">${equipmentEffects(id, level)}</p>${item.set ? `<p class="set-note">Pair: ${SET_BONUSES[item.set].name} \xB7 ${SET_BONUSES[item.set].desc}</p>` : ""}${owned ? `<div class="item-actions"><button class="secondary-button" data-action="equip" data-item="${id}" ${equipped || active && (!checkpoint || online.role === "guest") ? "disabled" : ""}>${equipped ? "Equipped" : "Equip"}</button><button class="primary-button" data-action="enhance" data-item="${id}" ${active || meta.essence < cost || level >= 3 ? "disabled" : ""} title="${level < 3 ? equipmentEffects(id, level + 1) : "Fully enhanced"}">${level >= 3 ? "Max +3" : "Enhance \xB7 \u25C7 " + cost}</button></div>` : `<p class="item-origin">Find this in ${item.origin}.</p>`}</div></article>`;
    }).join("")}</div><h3 class="forge-memories">Lasting memories</h3><p class="overlay-note">Your first memory costs 4 essence. A first life with any defeated construct earns at least 4.</p><div class="memory-shop">${Object.entries(MEMORY_GIFTS).map(([id, g]) => `<button class="memory-buy" data-action="buy" data-gift="${id}" ${active || meta.essence < memoryCost(meta, id) || meta.gifts[id] >= 8 ? "disabled" : ""}><strong>${g.name}</strong><span>${g.desc}</span><b>${meta.gifts[id] >= 8 ? "Complete" : "\u25C7 " + memoryCost(meta, id)}</b><small>Remembered ${meta.gifts[id]} / 8</small></button>`).join("")}</div>`;
  }
  function giftContent() {
    if (online.role === "guest") return '<div class="menu-card"><span class="eyebrow">A SHARED MEMORY</span><h2>The host is choosing a gift.</h2><p>Both vessels receive the same power.</p></div>';
    return `<div class="menu-card"><span class="eyebrow">LEVEL ${pad(run.level)} \xB7 A MEMORY TAKES SHAPE</span><h2>What will this life become?</h2><p>${run.dungeon ? "This cleared-floor checkpoint is paused. Choose a gift, then descend." : ROOMS[run.room].boss || ROOMS[run.room].miniboss ? "The guardian is defeated. Your earned gifts are waiting; time is paused." : "Gifts pause the battle. Pick one."}</p><div class="gift-choices">${run.choices.map((id, i) => {
      const gift = BOONS[id];
      return `<button class="gift-choice" data-action="boon" data-gift="${id}"><span class="choice-number">${touchDevice ? "TAP" : settings.inputProfile === "controller" ? "A" : i + 1}</span><span class="gift-symbol" aria-hidden="true">${gift.glyph}</span><span class="eyebrow">${gift.tag}</span><strong>${gift.name}</strong><span class="gift-desc">${gift.desc}</span><span class="gift-effects">${run.boons[id] ? "Already remembered \xD7" + run.boons[id] : "A new possibility"}</span></button>`;
    }).join("")}</div></div>`;
  }
  function resolveContent() {
    if (run?.dungeon) return dungeonCheckpointContent();
    const story = CHAMBER_STORIES[run.room];
    if (online.role === "guest") return `<div class="menu-card"><span class="eyebrow">${story.speaker}</span><h2>${story.title}</h2><p>\u201C${story.line}\u201D</p><p>Your host is choosing what the two of you leave behind.</p></div>`;
    const reward = ROOMS[run.room].reward;
    return `<div class="menu-card"><span class="eyebrow">${ROOMS[run.room].name.toUpperCase()} \xB7 THE GATES OPEN</span>${run.bossDefeated?.room === run.room ? '<div class="boss-reward"><span class="eyebrow">GUARDIAN DEFEATED</span><h2>' + escapeText(run.bossDefeated.name) + " defeated</h2><p>" + ([ROOMS[run.room].loot ?? []].flat().map((id) => EQUIPMENT[id]?.name).filter(Boolean).join(" \xB7 ") || (ROOMS[run.room].seal ? "Guardian seal recovered" : (ROOMS[run.room].treasure ?? 0) + (ROOMS[run.room].miniboss ? 7 : 0) + " essence recovered")) + " \xB7 chamber recovery restored up to " + (ROOMS[run.room].boss ? 30 : 12) + " HP.</p></div>" : "<h2>" + story.title + "</h2>"}<p>${reward ? "You remember " + ABILITIES[reward].name + ". " : ""}${story.speaker}: \u201C${story.line}\u201D</p><p class="story-controls">${touchDevice ? "Tap a card to choose." : settings.inputProfile === "controller" ? "D-pad highlights. A confirms." : "Press 1\u20133 to highlight, then Enter to confirm. You can also click a card."} Time waits for you.</p><div class="gift-choices">${[["Liberate the chamber", "Let its light return to the world.", "+7 karma \xB7 +3 essence \xB7 heal up to 10 HP", "\u2727"], ["Harvest the machinery", "Take its remaining strength for yourself.", "\u22129 karma \xB7 +8 essence \xB7 heal up to 25 HP", "\u25C7"], ["Listen to the echoes", "Preserve the pattern before moving on.", "+2 karma \xB7 +7 awareness \xB7 +5 essence", "\u25C8"]].map(([name, desc, effects, glyph], i) => {
      name = story.choices?.[i]?.[0] ?? name;
      desc = story.choices?.[i]?.[1] ?? desc;
      return `<button class="gift-choice ${storyChoice === i ? "selected" : ""}" aria-pressed="${storyChoice === i}" data-action="resolve" data-index="${i}"><span class="choice-number">${touchDevice ? "TAP" : settings.inputProfile === "controller" ? "A" : i + 1}</span><span class="gift-symbol" aria-hidden="true">${glyph}</span><span class="eyebrow">A LASTING RIPPLE</span><strong>${name}</strong><span class="gift-desc">${desc}</span><span class="gift-effects">${effects}${i < 2 ? " \xB7 capped at maximum HP" : ""}</span></button>`;
    }).join("")}</div></div>`;
  }
  function resultContent() {
    if (run?.dungeon) return dungeonResultContent();
    const won = run.phase === "won", ending = endingFor(run), record = runRecord(run, ROOMS, EQUIPMENT, online.role === "guest");
    if (!won && !run.daily && meta.runs === 1 && !online.active) {
      const memory = Object.entries(record.mastery ?? {}).filter(([, xp]) => xp > 0).sort((a, b) => b[1] - a[1])[0];
      return `<div class="menu-card first-return"><span class="eyebrow">THE FIRST BODY ENDS</span><h2>The body falls.<br>The spark remembers.</h2><p>${memory ? FORMS[memory[0]].name + " remembers " + memory[1] + " mastery." : "The Wayfarer Sigil stays with your spark."}</p><div class="menu-actions"><button class="primary-button" data-action="reincarnate">Keep this spark</button><button class="secondary-button" data-action="guide">Read the field guide</button></div></div>`;
    }
    return `<div class="menu-card"><span class="eyebrow">${won ? run.victory === "eye" || run.room === "eye" ? "THE FIRST DESCENT COMPLETE" : "THE DEMIURGE FALLS" : "THE BODY ENDS"} \xB7 THE SPARK RETURNS</span><h2>${won ? ending.name : "This was a life.<br>It was not the last."}</h2><p>${won ? ending.text : run.daily ? "The daily current ends. Your result is remembered separately from campaign progress." : "Your body returns to the substrate. Your mastery, choices, equipment, and earned essence remain."}</p>${summaryHtml(record)}${!run.daily ? `<p class="result-ability">${run.essenceEarned ?? earnedEssence(run, meta)} essence earned \xB7 ${meta.endings?.length ?? 0} / 3 endings remembered</p>` : ""}<div class="menu-actions"><button class="primary-button" data-action="${online.active ? "online-leave" : "reincarnate"}">${online.active ? "Leave this room" : "Meet the next current"}</button><button class="secondary-button" data-action="skills">Skill trees</button><button class="secondary-button" data-action="forge">Equipment & forge</button><button class="secondary-button" data-action="share-run">Save run card \xB7 PNG</button><button class="secondary-button" data-action="map">See your path</button></div><p class="overlay-note">Karma ${signed(run.karma)} \xB7 \u25C7 ${meta.essence} carried forward \xB7 ${run.daily ? "daily seed " + run.seed : "vessel mastery persists"}</p></div>`;
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
    const signature = [menu, paused, run?.room, run?.phase, run?.level, run?.choices.join(","), storyChoice, meta.essence, meta.runs, imageFailure, online.role, onlineWaiting, remotePaused, networkProblem, Math.floor((Date.now() - online.lastSuccess) / 6500)].join(":");
    if (!force && signature === overlaySignature) return;
    overlaySignature = signature;
    el.classList.toggle("body-menu", menu || !run);
    el.classList.toggle("choice-overlay", !!run && ["boon", "resolve", "milestone"].includes(run.phase));
    if (imageFailure) {
      el.innerHTML = '<div class="menu-card"><h2>The artwork could not load.</h2><p>Reload this page to try again. Your saved journey is kept.</p></div>';
      return;
    }
    if (online.active && (onlineWaiting || !run || networkProblem || online.lastSuccess && Date.now() - online.lastSuccess > 6500)) el.innerHTML = `<div class="menu-card"><span class="eyebrow">TWO SPARKS \xB7 ONE CURRENT</span><h2>${networkProblem ? "Reconnecting to the room\u2026" : "Waiting for your partner"}</h2><p>${escapeText(networkProblem) || "Share the room code. Your partner chooses Online co-op, enters this code, and joins."}</p><strong class="room-code">${online.code}</strong><p class="overlay-note">Room access follows this game\u2019s sharing settings.</p><button class="secondary-button" data-action="online-leave">Leave room</button></div>`;
    else if (menu || !run) el.innerHTML = menuContent();
    else if (["dead", "won"].includes(run.phase)) el.innerHTML = resultContent();
    else if (run.phase === "boon") el.innerHTML = giftContent();
    else if (run.phase === "resolve") el.innerHTML = resolveContent();
    else if (run.phase === "milestone") el.innerHTML = milestoneContent();
    else if (online.role === "guest" && remotePaused) el.innerHTML = '<div class="menu-card"><h2>The host paused the current.</h2><p>Your shared life resumes when the host returns.</p><button class="secondary-button" data-action="online-leave">Leave room</button></div>';
    else if (paused) el.innerHTML = '<div class="menu-card"><span class="eyebrow">A BREATH BETWEEN PULSES</span><h2>The pattern can wait.</h2><p>Your life is paused. Your saved spark is still here.</p><div class="menu-actions"><button class="primary-button" data-action="resume">Return to this life</button><button class="secondary-button" data-action="guide">Field guide</button><button class="secondary-button" data-action="end">Let this body go</button></div></div>';
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
  function start(form) {
    requireDescent();
    if (online.active) throw Error("Leave the online room before starting solo.");
    if (!betweenLives()) throw new Error("A life is already in progress.");
    run = entryMode === "dungeon" ? createDungeon(form) : createRun(meta, form);
    beginLife();
    return observeRun(run, meta);
  }
  function beginLife() {
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
  function openDialog(id) {
    modalWasPaused = paused;
    paused = true;
    clearInput();
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
      $("online-form").innerHTML = Object.keys(BODIES).map((form) => `<option value="${form}">${FORMS[form].name}${offeredForms(meta).includes(form) ? " \xB7 current offer" : ""}</option>`).join("");
      $("online-form").value = (entryMode === "dungeon" ? Object.keys(BODIES) : offeredForms(meta))[0];
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
    if (action === "profile") {
      chooseProfile(data.profile);
      return;
    }
    if (action === "home") {
      returnToStart();
      return;
    }
    if (action.startsWith("entry-")) {
      if (action === "entry-duel") enterDuel();
      else if (action === "entry-dungeon") enterDungeon();
      else enterDescent(action.slice(6));
      return;
    }
    if (["boon", "resolve", "milestone", "power", "morph", "travel", "pause", "resume", "reincarnate", "equip", "enhance", "buy", "learn-skill", "rebuild-tree"].includes(action)) requireDescent();
    if (action.startsWith("online")) {
      if (entryMode === "dungeon") throw Error("The endless dungeon is solo. Return to the campaign for online co-op.");
      void onlineAction(action);
      return;
    }
    if (online.role === "guest" && ["boon", "resolve", "milestone", "end", "end-confirm", "buy", "start", "reincarnate", "travel", "equip", "daily-start", "new-save", "new-save-confirm", "restore-previous"].includes(action)) throw Error("The host makes shared run choices.");
    if (entryMode === "dungeon" && (["daily", "daily-start", "travel", "forge", "equip", "enhance", "buy", "learn-skill", "rebuild-tree", "new-save", "new-save-confirm", "restore-previous", "share-run", "skills", "last-run"].includes(action) || action.startsWith("online"))) throw Error("Return to your campaign for that action. Your dungeon is saved separately.");
    switch (action) {
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
        if (!run?.abilities.includes("morph")) throw Error("Find Vessel Resonance in the Mirror Nursery first.");
        if (run.phase !== "playing") throw Error(run.phase === "boon" ? "Choose your waiting gift first (1\u20133). The battle and timer are paused." : run.phase === "resolve" ? "Finish the cleared-room choice first. The battle and timer are paused." : "Return to a living vessel before morphing.");
        openDialog("vessel-dialog");
        break;
      case "morph":
        if (online.role === "guest") {
          if (!run?.abilities.includes("morph") || (run.partner?.morphCooldown ?? 0) > 0) throw Error("Vessel resonance is not ready.");
          online.input({ x: 0, y: 0, morph: data.form });
        } else {
          if (!run) throw Error("Inhabit a vessel first.");
          morphRun(run, data.form);
          changed();
        }
        if ($("vessel-dialog").open) $("vessel-dialog").close();
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
    if (!["descent", "dungeon"].includes(entryMode) || !card || !menu || online.active) return;
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
  document.addEventListener("input", (event) => {
    const id = event.target?.dataset?.setting;
    if (!["master", "effects", "ambient", "shake", "flashes"].includes(id)) return;
    settings[id] = Math.max(0, Math.min(1, Number(event.target.value) / 100));
    persistSettings();
  });
  document.addEventListener("keydown", (event) => {
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
    if (entryMode === "start") {
      if (["1", "2", "3"].includes(key) && !event.repeat) {
        event.preventDefault();
        chooseProfile(INPUT_PROFILES[Number(key) - 1]);
      }
      return;
    }
    if (settings.inputProfile !== "pc") return;
    const inGame = run && !menu && !["dead", "won"].includes(run.phase);
    if ((inGame || menu || ["descent", "dungeon"].includes(entryMode)) && [" ", settings.bindings.dash, "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) event.preventDefault();
    if (entryMode === "dungeon" && run?.phase === "resolve" && ["enter", "1"].includes(key) && !event.repeat) {
      event.preventDefault();
      try {
        act(run.xp >= run.nextXp ? "dungeon-gifts" : "dungeon-next");
      } catch (error) {
        announce(error.message);
      }
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
    if (inGame && run.phase === "playing" && !paused) {
      if ([settings.bindings.up, settings.bindings.left, settings.bindings.down, settings.bindings.right, "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
        event.preventDefault();
        keys.add(key);
      }
      if (key === settings.bindings.dash && !event.repeat) dashRequested = true;
      if (key === settings.bindings.power && !event.repeat) {
        event.preventDefault();
        powerRequested = true;
      }
      if (key === settings.bindings.interact) {
        event.preventDefault();
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
  });
  document.addEventListener("change", (event) => {
    if (event.target?.id === "duel-condition" && !duel.match && Object.hasOwn(duel.observe().conditions, event.target.value)) {
      duel.readOptions();
      $("duel-condition-copy").textContent = duel.observe().conditions[event.target.value].desc;
      $("duel-cycle-condition").textContent = "Next \xB7 " + duel.observe().conditions[event.target.value].name;
    }
    if (event.target?.id === "setting-profile" && event.target.value) chooseProfile(event.target.value);
  });
  window.addEventListener("blur", () => {
    clearInput();
    if (entryMode === "duel" && duel.match) {
      duel.paused = true;
      duel.keys.clear();
      duel.touch = { x: 0, y: 0, buttons: {} };
      duel.render(true);
    }
    if (["descent", "dungeon"].includes(entryMode) && run && !menu && run.phase === "playing" && online.role !== "guest") {
      paused = true;
      renderOverlay();
      save();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearInput();
      if (entryMode === "duel" && duel.match) {
        duel.paused = true;
        duel.keys.clear();
        duel.touch = { x: 0, y: 0, buttons: {} };
        duel.render(true);
      }
      if (["descent", "dungeon"].includes(entryMode) && run && !menu && run.phase === "playing" && online.role !== "guest") {
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
    const dialog = document.querySelector("dialog[open]"), choices = entryMode === "start" || menu || !run || run.phase !== "playing" || paused || !!dialog;
    if (choices) {
      const root = dialog ?? (entryMode === "start" ? $("start-screen") : $("game-overlay")), buttons = Array.from(root.querySelectorAll?.("button:not([disabled])") ?? []);
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
      if (controller.pause && !dialog && run?.phase === "playing") act("pause");
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
  function draw() {
    if (!ctx) return;
    const now = performance.now(), dt = Math.min(0.05, (now - drawStamp) / 1e3 || 1 / 60);
    drawStamp = now;
    const s = run ? { ...run, player: smoothEntity("player:" + run.room, run.player, dt), partner: run.partner ? smoothEntity("partner:" + run.room, run.partner, dt) : null, enemies: run.enemies.map((e2) => smoothEntity("enemy:" + e2.id + ":" + run.room, e2, dt)) } : null, p = s?.player ?? { x: WIDTH / 2, y: HEIGHT / 2 }, focus = online.role === "guest" && s?.partner ? s.partner : p, room = ROOMS[s?.room ?? "threshold"], aspect = viewport.w / viewport.h, viewWidth = Math.min(WIDTH, HEIGHT * aspect), scale = Math.min(viewport.w / viewWidth, viewport.h / HEIGHT), offsetX = (viewport.w - viewWidth * scale) / 2, offsetY = (viewport.h - HEIGHT * scale) / 2;
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
    const world = WORLDS[room.world];
    if (world.floor !== void 0 && images.worldFloors.complete && images.worldFloors.naturalWidth) {
      const sw = images.worldFloors.naturalWidth / 3, sh = images.worldFloors.naturalHeight / 2;
      ctx.drawImage(images.worldFloors, world.floor % 3 * sw, Math.floor(world.floor / 3) * sh, sw, sh, 0, 0, WIDTH, HEIGHT);
    }
    if (room.floor !== void 0 && images.castleFloors.complete && images.castleFloors.naturalWidth) {
      const sw = images.castleFloors.naturalWidth / 3, sh = images.castleFloors.naturalHeight / 2;
      ctx.drawImage(images.castleFloors, room.floor % 3 * sw, Math.floor(room.floor / 3) * sh, sw, sh, 0, 0, WIDTH, HEIGHT);
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
    } else if (world.floor === void 0 && room.floor === void 0 && expansionFloor === void 0 && images.floor.complete && images.floor.naturalWidth) ctx.drawImage(images.floor, 0, 0, WIDTH, HEIGHT);
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
    if (s) {
      if (clearVisual.room !== s.room) {
        clearVisual = { room: s.room, cleared: s.cleared.includes(s.room), at: 0 };
      } else if (!clearVisual.cleared && s.cleared.includes(s.room)) {
        clearVisual.cleared = true;
        clearVisual.at = now;
        audio.effect("swarm");
      }
    }
    for (const [dir, exit] of Object.entries(s?.dungeon ? {} : room.exits)) {
      const at = exitPosition(dir), status = s ? gateStatus(s, dir) : { available: false };
      if (s) drawSeal(ctx, s, room, dir, exit, status, at, { retract: clearVisual.at ? Math.min(1, (now - clearVisual.at) / 350) : 1 });
    }
    if (s) {
      if (s.room === "nursery") {
        circle2(480, 300, 48, "#83d6dd13", s.abilities.includes("morph") ? "#a1d6d5" : "#576961", 1.5);
        drawProp(3, 480, 300, 122);
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
        drawEnemyCore(ctx, enemy, { role: COMBAT_ROLES[enemy.kind] ?? enemy.kind, elite: ["warden", "cantor", "sentinel", "oracle", "mirror"].includes(enemy.kind) || !!WORLD_GUARDIANS[enemy.kind], time: s.time, flash: settings.flashes, reduced: reducedMotion });
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
          ctx.strokeStyle = shot.color + "55";
          ctx.lineWidth = shot.r * 0.7;
          ctx.beginPath();
          ctx.moveTo(shot.x - shot.vx * 0.025, shot.y - shot.vy * 0.025);
          ctx.lineTo(shot.x, shot.y);
          ctx.stroke();
        }
        circle2(shot.x, shot.y, shot.r + 5, shot.color + "2a");
        circle2(shot.x, shot.y, shot.r, shot.color);
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
        ctx.fillText(ally.hp <= 0 ? "Hold " + (touchDevice ? "GATE" : hint("interact")) + " to rekindle" : "PLAYER 2", ally.x, ally.y - 40);
        if (ally.hp <= 0) circle2(ally.x, ally.y, 25, null, "#cbdcaa", 2 + Math.min(4, (ally.revive ?? 0) * 2));
        for (let i = 0; i < s.boons.orbit; i++) {
          const angle = s.time * 2.9 + i * Math.PI * 2 / s.boons.orbit;
          drawSprite(0, ally.x + Math.cos(angle) * 68, ally.y + Math.sin(angle) * 68, 31);
        }
      }
      if (s.player.hp <= 0) {
        ctx.fillStyle = "#ead6a5";
        ctx.textAlign = "center";
        ctx.font = "10px sans-serif";
        ctx.fillText("Hold " + (touchDevice ? "GATE" : hint("interact")) + " to rekindle", p.x, p.y - 40);
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
      drawDescentHud(ctx, { w: viewport.w, run: s, player: hudPlayer, room, profile: settings.inputProfile, bindings: settings.bindings, dashMax: dashCooldown(s, view.form), powerMax: power.cooldown, clearPulse: clearVisual.at ? Math.max(0, 1 - (now - clearVisual.at) / 350) : 0 });
      const gate = s.dungeon ? null : nearestGate(s, online.role === "guest" && s.partner ? s.partner : s.player);
      if (gate && gate.distance < 105 && s.phase === "playing") {
        const text = gate.direction.toUpperCase() + " \xB7 " + (gate.available ? hint("interact") + " \xB7 " + ROOMS[gate.to].name : adaptPrompt(gate.reason, settings.inputProfile, settings.bindings));
        ctx.font = "12px sans-serif";
        const maxWidth = Math.max(140, viewport.w - 48), words = text.split(" "), lines = [];
        let line = "";
        for (const word of words) {
          const candidate = line ? line + " " + word : word;
          if (ctx.measureText(candidate).width > maxWidth && line) {
            lines.push(line);
            line = word;
          } else line = candidate;
        }
        if (line) lines.push(line);
        const shown = lines.slice(0, 4), tw = Math.min(viewport.w - 24, Math.max(...shown.map((line2) => ctx.measureText(line2).width)) + 24), height = shown.length * 16 + 12, x = Math.max(12, Math.min(viewport.w - tw - 12, gate.direction === "east" ? viewport.w - tw - 12 : gate.direction === "west" ? 12 : (viewport.w - tw) / 2)), y = gate.direction === "north" ? 68 : gate.direction === "south" ? (touchDevice ? viewport.h - 145 : viewport.h - 16) - height : (viewport.h - height) / 2;
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
    const elapsed = Math.min(0.1, (now - previous) / 1e3 || 0);
    previous = now;
    accumulator += elapsed;
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
      const accepting = !paused && !remotePaused && !onlineWaiting && run?.phase === "playing" && !document.querySelector("dialog[open]");
      online.input({ x: accepting ? inputX : 0, y: accepting ? inputY : 0, dash: accepting && dashRequested, power: accepting && powerRequested, interact: accepting && (keys.has(settings.bindings.interact) || interactRequested || interactHeld || controller.interact) });
      dashRequested = false;
      powerRequested = false;
      interactRequested = false;
    }
    if (online.role !== "guest" && !onlineWaiting && !networkProblem && (!online.active || Date.now() - online.lastSuccess < 6500) && run && !paused && !menu && run.phase === "playing" && !document.querySelector("dialog[open]") && !imageFailure) {
      const oldPhase = run.phase, oldRoom = run.room;
      while (accumulator >= 1 / 60 && run.phase === "playing") {
        stepRun(run, { x: inputX, y: inputY, dash: dashRequested, power: powerRequested, interact: interactRequested || keys.has(settings.bindings.interact) || interactHeld || controller.interact, partner: online.active ? { ...remoteInput, dash: remotePulse.dash, power: remotePulse.power, morph: remotePulse.morph } : void 0 }, 1 / 60);
        remotePulse.dash = false;
        remotePulse.power = false;
        remotePulse.morph = null;
        dashRequested = false;
        powerRequested = false;
        interactRequested = false;
        accumulator -= 1 / 60;
      }
      if (run.phase !== oldPhase || run.room !== oldRoom) {
        finish();
        save();
        renderOverlay();
        renderRail();
        if (run.phase === "boon") announce("A memory takes shape. Choose a gift.");
        if (run.phase === "resolve") announce("The chamber opens. Choose what to leave behind.");
        if (run.phase === "milestone") announce("The Eye opens. Continue the journey or complete this descent.");
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
    requireDescent();
    if (online.active) throw Error("Scripted multi-frame control is available in solo play. Use live controls in co-op.");
    if (!run || menu || paused || remotePaused || onlineWaiting || run.phase !== "playing" || document.querySelector("dialog[open]")) throw new Error("The descent is not accepting movement right now.");
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Expected movement input.");
    const frames = input.frames ?? 1;
    if (!Number.isInteger(frames) || frames < 1 || frames > 240 || !Number.isFinite(input.x ?? 0) || !Number.isFinite(input.y ?? 0)) throw new Error("Use finite x/y movement and 1\u2013240 frames.");
    for (let i = 0; i < frames && run.phase === "playing"; i++) stepRun(run, { x: input.x ?? 0, y: input.y ?? 0, dash: i === 0 && !!input.dash, power: i === 0 && !!input.power, interact: i === 0 && !!input.interact }, 1 / 60);
    changed();
    draw();
    return observeRun(run, meta);
  }
  window.SparkDescent = { version: "0.9.0", selectProfile: chooseProfile, enter: enterDescent, observe: () => structuredClone({ ...observeRun(run, meta), rememberedTraining: prepareTraining(meta.training), entryMode, paused: paused || remotePaused || onlineWaiting, mode: entryMode, dungeon: run?.dungeon ?? null, inputProfile: settings.inputProfile }), start, control, power: () => {
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
      { name: "choose_spark_input", title: "Choose an input profile", description: "Choose PC, Controller, or Mobile before entering a descent or duel. Persists device controls and updates all prompts.", inputSchema: { type: "object", properties: { profile: { type: "string", enum: INPUT_PROFILES } }, required: ["profile"], additionalProperties: false }, execute: (input) => {
        object(input);
        if (Object.keys(input).length !== 1 || !INPUT_PROFILES.includes(input.profile)) throw Error("Choose one input profile.");
        chooseProfile(input.profile);
        return window.SparkDescent.observe();
      } },
      { name: "enter_spark_mode", title: "Confirm a game mode", description: "After choosing an input profile, confirm Descent, Continue, Daily, Join room, local Duel, or Endless Dungeon. This does not start a campaign life.", inputSchema: { type: "object", properties: { mode: { type: "string", enum: ["descent", "continue", "daily", "join", "duel", "dungeon"] } }, required: ["mode"], additionalProperties: false }, execute: (input) => {
        object(input);
        if (Object.keys(input).length !== 1 || !["descent", "continue", "daily", "join", "duel", "dungeon"].includes(input.mode)) throw Error("Choose a known mode.");
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
      { name: "control_descent", title: "Move through the substrate", description: "Move for 1\u2013240 simulation frames with x/y direction. Optional dash or gate interaction occurs on the first frame. Attacks are automatic. Stops for choices or run end.", inputSchema: { type: "object", properties: { x: { type: "number", minimum: -1, maximum: 1 }, y: { type: "number", minimum: -1, maximum: 1 }, frames: { type: "integer", minimum: 1, maximum: 240 }, dash: { type: "boolean" }, power: { type: "boolean" }, interact: { type: "boolean" } }, additionalProperties: false }, execute: (input) => {
        object(input);
        if (Object.keys(input).some((k) => !["x", "y", "frames", "dash", "power", "interact"].includes(k)) || input.x !== void 0 && Math.abs(input.x) > 1 || input.y !== void 0 && Math.abs(input.y) > 1 || ["dash", "power", "interact"].some((k) => input[k] !== void 0 && typeof input[k] !== "boolean")) throw new Error("Invalid control input.");
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
  var duel = new DuelScreen({ document, window, storage: localStorage, image: images.sprites, settings: () => settings, audio, onQuit: returnToStart, announce });
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
