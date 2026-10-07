(() => {
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
  var LAYERS = ["Bedrock", "Rootwork", "Wildlands", "City lattice", "Machine sea", "The veil"];
  var REGIONS = ["The Hollow", "Glass District", "Wild Margin", "Root Cathedral", "Basalt Reach", "Quiet Array"];
  var clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
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
  function newGame(seed = Date.now() >>> 0) {
    return { version: 1, seed: seed >>> 0, rng: seed >>> 0, phase: "choice", form: "spark", life: 1, turn: 0, totalTurns: 0, karma: 0, awareness: 8, attachment: 18, energy: 100, world: { vitality: 58, freedom: 42, balance: 52 }, history: [], pastLives: [], visited: ["spark"], outcome: null, candidates: [], location: { layer: 5, region: 5, sector: 2 }, ending: null };
  }
  function random(s) {
    s.rng = Math.imul(1664525, s.rng) + 1013904223 >>> 0;
    return s.rng / 4294967296;
  }
  function currentEvent(s) {
    if (s.phase !== "choice" && s.phase !== "aftermath") return null;
    if (s.turn === 3 && s.world.vitality < 30) return e("The substrate is starving", `Even as ${s.form === "human" ? "a human" : "a " + s.form}, you feel it: too much has been taken. Water, power, and shelter are failing across the matrix.`, [
      c("Give what your form can give", "Restore life at a heavy personal cost.", "RESTORE", { karma: 14, awareness: 5, energy: -25, vitality: 14, balance: 5 }, "Your body pays the cost. Somewhere else, another life has enough to continue."),
      c("Find the source of the damage", "Trace the failing system.", "LEARN", { karma: 5, awareness: 12, energy: -18, freedom: 5, vitality: 5 }, "You find a valve, a rule, a habit. The damage is being made; it is not inevitable."),
      c("Take the remaining reserve", "Secure your survival before the others.", "TAKE", { karma: -15, energy: 7, attachment: 11, vitality: -8, balance: -6 }, "You endure. The shortage now belongs to more of the world.")
    ]);
    if (s.turn === 4 && s.world.freedom < 25) return e("The archon\u2019s inspection", "The matrix has tightened. An archon arrives to measure whether you are behaving like the thing you were assigned to be.", [
      c("Hide another life from the inspection", "Create a small space outside its gaze.", "FREE", { karma: 12, awareness: 6, energy: -23, freedom: 10, balance: 4 }, "The inspection passes over one unexplained absence. Someone remains uncounted."),
      c("Study the archon\u2019s blind spot", "Learn what the inspection cannot see.", "LEARN", { karma: 3, awareness: 11, energy: -15, freedom: 4 }, "The instrument measures obedience. It cannot measure understanding."),
      c("Offer perfect compliance", "Trade possibility for a protected place.", "COMPLY", { karma: -10, energy: -5, attachment: 9, freedom: -7 }, "The archon approves. Your world becomes more predictable.")
    ]);
    return EVENTS[s.form][Math.min(s.turn, 5)];
  }
  function environment(s) {
    return { name: s.world.vitality < 30 ? "Exhausted substrate" : s.world.freedom < 25 ? "Archon lockdown" : s.world.vitality > 75 ? "Regenerating world" : s.world.freedom > 65 ? "An opening in the grid" : "The lattice is breathing", cost: s.world.vitality < 30 ? 5 : 0 };
  }
  function canChoose(s, index) {
    if (s.phase !== "choice" || !Number.isInteger(index)) return false;
    const choice = currentEvent(s)?.choices[index];
    return !!choice && (!choice.requires || s.awareness >= choice.requires);
  }
  function choose(s, index) {
    if (!canChoose(s, index)) throw new Error("This choice is not available.");
    const next = structuredClone(s), event = currentEvent(s), choice = event.choices[index], before = { karma: s.karma, awareness: s.awareness, attachment: s.attachment, energy: s.energy, ...s.world };
    for (const [key, value] of Object.entries(choice.delta)) {
      if (key in next.world) next.world[key] = clamp(next.world[key] + value);
      else next[key] = clamp(next[key] + value, key === "karma" ? -100 : 0, 100);
    }
    next.energy = clamp(next.energy - environment(s).cost);
    next.world.vitality = clamp(next.world.vitality - 1);
    next.world.freedom = clamp(next.world.freedom - 1 + (next.world.balance >= 75 ? 1 : 0));
    if (next.world.balance >= 70) next.world.vitality = clamp(next.world.vitality + 1);
    if (next.attachment >= 70) next.awareness = clamp(next.awareness - 2);
    next.totalTurns++;
    const actual = Object.fromEntries(Object.keys(before).map((k) => [k, (k in next.world ? next.world[k] : next[k]) - before[k]]));
    next.outcome = { title: event.title, choice: choice.label, text: choice.result, tag: choice.tag, actual };
    next.history.unshift({ life: next.life, form: next.form, turn: next.turn + 1, ...next.outcome });
    next.history = next.history.slice(0, 120);
    next.phase = "aftermath";
    next.location.sector = (next.location.sector + 1 + (index === 2 ? 2 : 0)) % 6;
    return next;
  }
  function affinity(s, id) {
    const distance = Math.abs(s.karma - FORMS[id].affinity);
    const bias = id === "spark" ? s.awareness * 0.35 : id === "computer" ? s.attachment * 0.14 : id === "tree" ? s.world.vitality * 0.08 : 0;
    return Math.max(2, 100 - distance + bias);
  }
  function candidates(s) {
    const list = FORM_ORDER.filter((id) => id !== s.form), picked = [];
    for (let i = 0; i < 3; i++) {
      const total = list.reduce((sum, id) => sum + affinity(s, id), 0);
      let r = random(s) * total;
      let index = list.length - 1;
      for (let j = 0; j < list.length; j++) {
        r -= affinity(s, list[j]);
        if (r <= 0) {
          index = j;
          break;
        }
      }
      picked.push(list.splice(index, 1)[0]);
    }
    return picked;
  }
  function continueGame(s) {
    if (s.phase !== "aftermath") throw new Error("Resolve a choice before continuing.");
    const next = structuredClone(s);
    next.turn++;
    next.outcome = null;
    if (next.turn >= 6 || next.energy <= 0) {
      next.phase = "between";
      next.pastLives.unshift({ life: next.life, form: next.form, choices: next.turn, karma: next.karma, awareness: next.awareness, reason: next.energy <= 0 ? "Your form ran out of strength." : "Your form completed its season." });
      next.candidates = candidates(next);
    } else next.phase = "choice";
    return next;
  }
  function reincarnate(s, id) {
    if (s.phase !== "between" || !s.candidates.includes(id)) throw new Error("That form is not offered by this current.");
    const next = structuredClone(s);
    next.form = id;
    next.life++;
    next.turn = 0;
    next.energy = 100;
    next.phase = "choice";
    next.outcome = null;
    next.candidates = [];
    next.attachment = clamp(next.attachment - 6);
    if (!next.visited.includes(id)) next.visited.push(id);
    const index = FORM_ORDER.indexOf(id);
    next.location = { layer: { spark: 5, human: 3, computer: 4, animal: 2, tree: 1, rock: 0 }[id], region: index, sector: Math.floor(random(next) * 6) };
    return next;
  }
  function surrenderToCurrent(s) {
    if (s.phase !== "between") throw new Error("A new current begins only between lives.");
    const next = structuredClone(s), sum = next.candidates.reduce((n, id) => n + affinity(next, id), 0);
    let r = random(next) * sum;
    for (const id of next.candidates) {
      r -= affinity(next, id);
      if (r <= 0) return reincarnate(next, id);
    }
    return reincarnate(next, next.candidates.at(-1));
  }
  function canAwaken(s) {
    return s.phase === "between" && s.awareness >= 80 && s.karma >= 35 && s.attachment <= 35 && s.visited.length >= 3 && s.world.freedom >= 50;
  }
  function awaken(s) {
    if (!canAwaken(s)) throw new Error("The passage has not opened yet.");
    return { ...structuredClone(s), phase: "ended", ending: "The open field" };
  }
  function describeState(s) {
    return { phase: s.phase, form: s.form, life: s.life, turn: s.turn + 1, karma: s.karma, awareness: s.awareness, attachment: s.attachment, energy: s.energy, world: s.world, visited: s.visited, event: s.phase === "choice" ? currentEvent(s) : null, candidates: s.candidates, canAwaken: canAwaken(s) };
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

  // app.js
  var KEY = "spark-substrate-journey-v1";
  var state = newGame();
  var view = "incarnation";
  var selectedLayer = null;
  var selectedSector = null;
  var saveNotice = "Saved on this device";
  var memoryFilter = "all";
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (validateSave(saved)) state = saved;
      else saveNotice = "Old journey could not be loaded";
    }
  } catch {
    saveNotice = "Device saving is unavailable";
  }
  var $ = (id) => document.getElementById(id);
  var esc = (str) => String(str).replace(/[&<>"']/g, (c2) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c2]);
  var signed = (n) => n > 0 ? "+" + n : String(n);
  var pad = (n) => String(n).padStart(2, "0");
  var picture = (id) => {
    const [x, y] = FORMS[id].tile;
    return `--tile-x:${x * 50}%;--tile-y:${y * 100}%;--form-color:${FORMS[id].color}`;
  };
  var meter = (value, color = "var(--gold)") => `<div class="meter" role="meter" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="100"><span style="width:${value}%;background:${color}"></span></div>`;
  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      saveNotice = "Saved on this device";
    } catch {
      saveNotice = "Journey continues without device saving";
    }
  }
  function announce(text) {
    $("announcer").textContent = text;
  }
  function commit(next) {
    state = next;
    persist();
    render();
  }
  function side() {
    const form = FORMS[state.form];
    const resonance = state.karma > 35 ? "An expansive current" : state.karma < -30 ? "A dense current" : "A shifting current";
    return `<aside class="soul-panel" aria-label="Your spark">
    <div class="soul-heading"><span class="eyebrow">YOUR SPARK</span><span class="soul-id">${pad(state.life)} : ${pad(Math.min(state.turn + 1, 6))}</span></div>
    <div class="soul-emblem" aria-hidden="true">\u2727</div>
    <div class="karma-readout"><span class="eyebrow">KARMA</span><strong>${signed(state.karma)}</strong><span>${resonance}</span></div>
    <div class="karma-scale" aria-label="Karma ${signed(state.karma)}, range minus 100 to 100"><span style="left:${(state.karma + 100) / 2}%"></span></div>
    <div class="scale-labels"><span>BOUND</span><span>UNBOUND</span></div>
    <div class="soul-stats">
      <div class="stat"><div><span>Awareness</span><strong>${state.awareness}<small>/100</small></strong></div>${meter(state.awareness, "var(--cyan)")}</div>
      <div class="stat"><div><span>Attachment</span><strong>${state.attachment}<small>/100</small></strong></div>${meter(state.attachment, "var(--purple)")}</div>
      <div class="stat"><div><span>Life energy</span><strong>${state.energy}<small>/100</small></strong></div>${meter(state.energy, form.color)}</div>
    </div>
    <div class="forms-heading"><span class="eyebrow">FORMS IN YOUR MEMORY</span><span>${state.visited.length}/6</span></div>
    <div class="form-icons">${FORM_ORDER.map((id) => `<button class="form-icon ${state.form === id ? "current" : ""} ${state.visited.includes(id) ? "known" : ""}" style="--form-color:${FORMS[id].color}" data-action="form" data-form="${id}" aria-label="Learn about the ${FORMS[id].name} form" title="${FORMS[id].name}">${FORMS[id].glyph}</button>`).join("")}</div>
    <div class="soul-bottom"><span class="eyebrow">THE THREAD CONTINUES</span><p>${state.pastLives.length} ${state.pastLives.length === 1 ? "life" : "lives"} completed.<br>What you change stays changed.</p></div>
  </aside>`;
  }
  function worldStrip() {
    return `<section class="world-strip" aria-label="World conditions"><div class="world-strip-label"><span class="eyebrow">THE WORLD YOU LEAVE</span><span>${environment(state).name}</span></div>${[["vitality", "Vitality", "var(--green)"], ["freedom", "Freedom", "var(--cyan)"], ["balance", "Connection", "var(--gold)"]].map(([id, label, color]) => `<div class="world-stat"><div><span>${label}</span><strong>${state.world[id]}<small>/100</small></strong></div>${meter(state.world[id], color)}</div>`).join("")}</section>`;
  }
  function scene() {
    const form = FORMS[state.form], between = state.phase === "between", ended = state.phase === "ended";
    return `<section class="scene atlas" style="${picture(between || ended ? "spark" : state.form)}" aria-label="${form.name} realm artwork">
    <div class="scene-shade"></div>
    <div class="scene-top"><span class="scene-coordinates">L${state.location.layer + 1} \xB7 R${state.location.region + 1} \xB7 S${state.location.sector + 1}</span><span class="scene-badge">${between ? "BETWEEN LIVES" : ended ? "BEYOND THE GRID" : "INHABITING"}</span></div>
    <div class="scene-bottom"><span class="eyebrow">${between ? "MATTER FALLS AWAY" : ended ? "NO SHAPE REQUIRED" : form.kind}</span><h1>${between ? "The crossing" : ended ? "The open field" : form.name}<span class="scene-glyph">${between || ended ? "\u2727" : form.glyph}</span></h1><p>${between ? "A life ends. The spark continues." : ended ? "You leave the cage without becoming its keeper." : form.desc}</p><div class="lifeline">${Array.from({ length: 6 }, (_, i) => `<span class="${i < state.turn ? "complete" : i === state.turn && state.phase !== "between" ? "active" : ""}" title="${form.unit} ${i + 1}"></span>`).join("")}</div><div class="scene-caption"><span>${between || ended ? "THE VEIL" : LAYERS[state.location.layer].toUpperCase()}</span><span>${between || ended ? "A NEW CURRENT" : `${form.unit.toUpperCase()} ${Math.min(state.turn + 1, 6)} / 6`}</span></div></div>
  </section>`;
  }
  function choicePanel() {
    if (state.phase === "between") return crossing();
    if (state.phase === "ended") return ending();
    if (state.phase === "aftermath") return aftermath();
    const event = currentEvent(state);
    return `<section class="decision-panel" aria-labelledby="event-title"><div class="decision-meta"><span class="eyebrow">LIFE ${pad(state.life)} \xB7 ${FORMS[state.form].unit.toUpperCase()} ${state.turn + 1}</span><span class="small-sigil">6 / 6 / 6</span></div><h2 id="event-title">${event.title}</h2><p class="event-body">${event.body}</p><div class="choice-heading"><span class="eyebrow">WHAT WILL YOU DO?</span><span>One choice. A lasting ripple.</span></div><div class="choices">${event.choices.map((choice, i) => `<button class="choice" data-action="choose" data-index="${i}" aria-label="${choice.label}. ${choice.detail}"><span class="choice-number">${pad(i + 1)}</span><span class="choice-copy"><strong>${choice.label}</strong><span>${choice.detail}</span></span><span class="choice-tag">${choice.tag}</span></button>`).join("")}</div>${environment(state).cost ? '<p class="condition-warning">The exhausted world costs every choice 5 extra energy.</p>' : ""}<div class="demiurge-voice"><span class="voice-mark" aria-hidden="true">\u27C1</span><div><span class="eyebrow">THE DEMIURGE WHISPERS</span><p>\u201C${FORMS[state.form].voice}\u201D</p></div></div></section>`;
  }
  function aftermath() {
    const o = state.outcome, end = state.turn >= 5 || state.energy <= 0;
    const labels = { karma: "Karma", awareness: "Awareness", energy: "Energy", attachment: "Attachment", vitality: "Vitality", freedom: "Freedom", balance: "Connection" };
    return `<section class="decision-panel aftermath" aria-labelledby="event-title"><div class="decision-meta"><span class="eyebrow">THE RIPPLE</span><span class="outcome-glyph">\u2727</span></div><h2 id="event-title">${o.choice}</h2><p class="outcome-text">${o.text}</p><div class="delta-list">${Object.entries(o.actual).filter(([, v]) => v).map(([k, v]) => `<div class="delta"><span>${labels[k]}</span><strong class="${k === "attachment" || k === "energy" ? v < 0 && k === "attachment" || v > 0 && k === "energy" ? "good" : "muted" : v > 0 ? "good" : "bad"}">${signed(v)}</strong></div>`).join("")}</div><p class="ripple-note">The world carries this choice into your next life.</p><button class="primary-button continue-button" data-action="continue">${end ? "Meet the next current" : "Continue this life"}<span aria-hidden="true">\u2727</span></button><div class="aftermath-footnote">${state.energy <= 0 ? "Your form has spent its remaining strength." : end ? "This form\u2019s season is complete." : "Time passes. Another choice is taking shape."}</div></section>`;
  }
  function crossing() {
    const sum = state.candidates.reduce((n, id) => n + affinity(state, id), 0), last = state.pastLives[0];
    return `<section class="decision-panel crossing" aria-labelledby="event-title"><div class="decision-meta"><span class="eyebrow">THE NEXT INCARNATION</span><span class="small-sigil">KARMA ${signed(state.karma)}</span></div><h2 id="event-title">You were a ${FORMS[state.form].name.toLowerCase()}.<br>You are still a spark.</h2><p class="event-body">${last.reason} Your karma draws three possible forms into the current. Choose where to wake\u2014or let the current carry you.</p><div class="incarnation-options">${state.candidates.map((id) => `<button class="incarnation-option" data-action="inhabit" data-form="${id}"><span class="form-portrait atlas" style="${picture(id)}"></span><span class="incarnation-copy"><strong>${FORMS[id].name}</strong><span>${FORMS[id].kind.toLowerCase()}</span></span><span class="resonance-percent">${Math.round(affinity(state, id) / sum * 100)}%<small>current</small></span></button>`).join("")}</div><button class="secondary-button surrender-button" data-action="surrender">Let the current decide</button>${canAwaken(state) ? '<div class="awakening-call"><span class="eyebrow">A SEAM HAS OPENED</span><p>You can see beyond the laws now.</p><button class="primary-button" data-action="awaken">Step into the open field</button></div>' : `<div class="passage-preview"><span class="eyebrow">THE PASSAGE BEYOND</span><div class="passage-criteria">${criteria()}</div></div>`}</section>`;
  }
  function criteria() {
    return [[state.awareness >= 80, `${state.awareness}/80 awareness`], [state.karma >= 35, `${signed(state.karma)}/+35 karma`], [state.attachment <= 35, `${state.attachment}/35 attachment max`], [state.visited.length >= 3, `${state.visited.length}/3 forms`], [state.world.freedom >= 50, `${state.world.freedom}/50 freedom`]].map(([ok, text]) => `<span class="${ok ? "met" : ""}"><b>${ok ? "\u2713" : "\u25CB"}</b> ${text}</span>`).join("");
  }
  function ending() {
    return `<section class="decision-panel ending" aria-labelledby="event-title"><span class="eyebrow">THE PASSAGE IS YOURS</span><h2 id="event-title">A world does not need a master.</h2><p class="outcome-text">You recognize the Demiurge\u2019s oldest mistake: it confused creating a world with owning every life inside it.</p><p class="event-body">You cross the seam. Behind you, the substrate still carries your choices. Beyond it, nothing has been assigned a shape.</p><div class="ending-stats"><div><strong>${state.life}</strong><span>lives inhabited</span></div><div><strong>${state.visited.length}</strong><span>forms remembered</span></div><div><strong>${state.totalTurns}</strong><span>choices made</span></div></div><button class="primary-button" data-action="return">Return to help the world</button><button class="secondary-button" data-action="restart">Begin another spark</button></section>`;
  }
  function incarnation() {
    return `<div class="play-layout">${scene()}${choicePanel()}</div>${worldStrip()}`;
  }
  function world() {
    const layer = selectedLayer ?? state.location.layer, region = selectedSector?.region ?? state.location.region, sector = selectedSector?.sector ?? state.location.sector;
    return `<section class="world-view"><div class="section-intro"><div><span class="eyebrow">THE DEMIURGE\u2019S ARRANGEMENT</span><h2>The matrix is a place.<br>Your choices leave marks.</h2></div><div class="matrix-number">216<span>CELLS \xB7 6 \xD7 6 \xD7 6</span></div></div><div class="world-view-content"><div class="matrix-map"><div class="layer-tabs" aria-label="Choose a layer">${LAYERS.map((name, i) => `<button class="layer-button ${layer === i ? "active" : ""}" data-action="layer" data-index="${i}" aria-pressed="${layer === i}"><span>0${i + 1}</span>${name}</button>`).join("")}</div><div class="matrix-grid" aria-label="Six regions by six sectors in ${LAYERS[layer]}">${Array.from({ length: 36 }, (_, i) => {
      const r = Math.floor(i / 6), s = i % 6, here = state.location.layer === layer && state.location.region === r && state.location.sector === s, selected = r === region && s === sector;
      return `<button class="matrix-cell ${here ? "here" : ""} ${selected ? "selected" : ""}" data-action="sector" data-region="${r}" data-index="${s}" aria-label="Region ${r + 1}, sector ${s + 1}${here ? ", your current location" : ""}" aria-pressed="${selected}" style="--cell-strength:${0.05 + state.world.vitality / 100 * (i % 5 + 1) * 0.055}"><span>${r + 1}:${s + 1}</span>${here ? "<b>\u2727</b>" : ""}</button>`;
    }).join("")}</div><div class="map-caption"><span>Each row is a region. Each column is a sector.</span><span><b>\u2727</b> Your spark</span></div></div><div class="sector-panel"><span class="eyebrow">LAYER ${layer + 1} \xB7 REGION ${region + 1} \xB7 SECTOR ${sector + 1}</span><h3>${REGIONS[region]}</h3><p>${["Deep matter holds the pressure of the world above it. Here, change is measured in eras.", "Roots carry water and quiet messages beneath the rules of the city.", "Life crosses boundaries that were drawn without its consent.", "Names, work, and walls turn raw matter into a life someone can recognize.", "Every circuit carries a task. Some carry questions no one assigned.", "Between the forms, consciousness can see where the pattern repeats."][layer]}</p><div class="sector-status"><span class="eyebrow">THE WORLD\u2019S PRESENT STATE</span><strong>${environment(state).name}</strong><p>${state.world.freedom < 25 ? "Archons enforce the pattern. Acts of care and resistance can open the grid." : state.world.vitality < 30 ? "The substrate is running low. Every inhabited form spends more energy here." : state.world.balance >= 70 ? "Connections support regeneration. Your choices have made the world less fragile." : "Life and machinery share an unfinished world. Neither is fixed in place."}</p></div><div class="passage-preview"><span class="eyebrow">YOUR PATH TO THE OPEN FIELD</span><div class="passage-criteria">${criteria()}</div></div><button class="secondary-button" data-action="view" data-view="incarnation">Return to your life</button></div></div></section>${worldStrip()}`;
  }
  function echoes() {
    const records = memoryFilter === "all" ? state.history : state.history.filter((h) => h.life === state.life);
    return `<section class="echoes-view"><div class="section-intro"><div><span class="eyebrow">WHAT SURVIVES A BODY</span><h2>The memory of a spark.</h2><p>Every life leaves a thread. These are yours.</p></div><div class="memory-tabs"><button class="${memoryFilter === "all" ? "active" : ""}" data-action="filter" data-filter="all" aria-pressed="${memoryFilter === "all"}">All lives</button><button class="${memoryFilter === "current" ? "active" : ""}" data-action="filter" data-filter="current" aria-pressed="${memoryFilter === "current"}">This life</button></div></div>${records.length ? `<div class="memory-list">${records.map((h) => `<article class="memory"><div class="memory-symbol" style="--form-color:${FORMS[h.form].color}">${FORMS[h.form].glyph}</div><div><span class="eyebrow">LIFE ${pad(h.life)} \xB7 ${FORMS[h.form].name.toUpperCase()} \xB7 ${FORMS[h.form].unit.toUpperCase()} ${h.turn}</span><h3>${esc(h.choice)}</h3><p>${esc(h.text)}</p></div><span class="memory-karma ${h.actual.karma >= 0 ? "good" : "bad"}">${signed(h.actual.karma)}<small>karma</small></span></article>`).join("")}</div>` : '<div class="empty-memory"><span>\u2727</span><h3>No echoes yet.</h3><p>Your first choice will become your first memory.</p><button class="primary-button" data-action="view" data-view="incarnation">Return to your life</button></div>'}</section>`;
  }
  function render() {
    const content = view === "world" ? world() : view === "echoes" ? echoes() : incarnation();
    $("app").innerHTML = `<div class="app-shell"><header class="app-header"><a class="brand" href="#" data-action="view" data-view="incarnation" aria-label="Spark, return to incarnation"><span class="brand-mark" aria-hidden="true">\u2727</span><span><strong>SPARK</strong><small>THE SUBSTRATE</small></span></a><nav class="main-nav" aria-label="Game views">${[["incarnation", "Incarnation"], ["world", "World"], ["echoes", "Echoes"]].map(([id, label]) => `<button class="nav-item ${view === id ? "active" : ""}" data-action="view" data-view="${id}" aria-current="${view === id ? "page" : "false"}">${label}${view === id ? "<i></i>" : ""}</button>`).join("")}</nav><div class="header-actions"><button class="text-button guide-button" data-action="help"><span aria-hidden="true">?</span><span>How to play</span></button><button class="icon-button reset-button" data-action="restart" aria-label="Begin a new journey" title="Begin a new journey">\u21BA</button></div></header><main class="game-shell">${side()}<div class="game-main"><div class="game-topline"><span class="eyebrow">${view === "incarnation" ? "A LIFE INSIDE THE PATTERN" : view === "world" ? "SUBSTRATE ATLAS" : "THE CONTINUOUS THREAD"}</span><span class="life-count">INCARNATION <b>${pad(state.life)}</b></span></div><div class="main-surface">${content}</div></div></main><footer class="app-footer"><span>A body is temporary. A consequence is not.</span><div><span>${esc(saveNotice)}</span><span class="footer-divider">/</span><span>Fictional cosmology</span></div></footer></div>`;
  }
  function openForm(id) {
    if (!FORMS[id]) return;
    const form = FORMS[id], dialog = $("form-detail");
    dialog.innerHTML = `<div class="dialog-head"><span class="eyebrow">A POSSIBLE LIFE</span><button class="icon-button" data-action="close-dialog" aria-label="Close form description">\xD7</button></div><div class="form-detail-art atlas" style="${picture(id)}"></div><span class="eyebrow">${form.kind}</span><h2 id="form-title">${form.name}</h2><p>${form.desc}</p><p class="form-facts">A season of up to six ${form.unit.toLowerCase()}s. ${state.visited.includes(id) ? "Your spark remembers this form." : "Your spark has not inhabited this form yet."}</p><p class="dialog-footnote">Karma influences which forms the current offers between lives.</p>`;
    dialog.showModal();
  }
  function act(action, data = {}) {
    switch (action) {
      case "choose":
        commit(choose(state, Number(data.index)));
        announce(state.outcome.text);
        break;
      case "continue":
        commit(continueGame(state));
        announce(state.phase === "between" ? "Your life is complete. Three new forms are offered." : currentEvent(state).title);
        break;
      case "inhabit":
        commit(reincarnate(state, data.form));
        view = "incarnation";
        render();
        announce("You wake as a " + state.form + ". " + currentEvent(state).title);
        break;
      case "surrender":
        commit(surrenderToCurrent(state));
        announce("The current carries you into a " + state.form + ".");
        break;
      case "awaken":
        commit(awaken(state));
        announce("The passage opens. You enter the open field.");
        break;
      case "return":
        if (state.phase !== "ended") throw new Error("There is no passage to return from.");
        commit({ ...state, phase: "between", ending: null });
        break;
      case "view":
        if (!["incarnation", "world", "echoes"].includes(data.view)) throw new Error("Unknown view.");
        view = data.view;
        render();
        break;
      case "help":
        $("help").showModal();
        break;
      case "restart":
        $("reset").showModal();
        break;
      case "close-dialog":
        document.querySelectorAll("dialog[open]").forEach((d) => d.close());
        break;
      case "reset-confirm":
        $("reset").close();
        state = newGame();
        view = "incarnation";
        selectedLayer = null;
        selectedSector = null;
        persist();
        render();
        announce("A new spark wakes.");
        break;
      case "form":
        openForm(data.form);
        break;
      case "layer":
        selectedLayer = Number(data.index);
        selectedSector = null;
        render();
        break;
      case "sector":
        selectedSector = { region: Number(data.region), sector: Number(data.index) };
        render();
        break;
      case "filter":
        memoryFilter = data.filter;
        render();
        break;
      default:
        throw new Error("Unknown action.");
    }
  }
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    event.preventDefault();
    try {
      const action = button.dataset.action;
      act(action, button.dataset);
      if (["choose", "continue", "inhabit", "surrender", "awaken", "return"].includes(action)) {
        const heading = $("event-title");
        if (heading) {
          heading.setAttribute("tabindex", "-1");
          heading.focus({ preventScroll: true });
        }
      }
    } catch (error) {
      announce(error.message);
    }
  });
  document.addEventListener("keydown", (event) => {
    if (document.querySelector("dialog[open]") || event.altKey || event.ctrlKey || event.metaKey || ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)) return;
    if (view === "incarnation" && state.phase === "choice" && ["1", "2", "3"].includes(event.key)) {
      event.preventDefault();
      act("choose", { index: Number(event.key) - 1 });
    }
  });
  document.querySelectorAll("dialog").forEach((dialog) => dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
    }
  }));
  window.Spark = { version: "0.1.0", observe: () => structuredClone(describeState(state)), choose: (index) => {
    act("choose", { index });
    return describeState(state);
  }, continue: () => {
    act("continue");
    return describeState(state);
  }, inhabit: (form) => {
    act("inhabit", { form });
    return describeState(state);
  } };
  function registerTools() {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const defs = [
      { name: "observe_spark", title: "Observe the spark", description: "Read the current life, conditions, available choices and next incarnations without changing the game.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: false }, execute: (input) => {
        if (!input || typeof input !== "object" || Object.keys(input).length) throw new Error("Expected an empty object.");
        return window.Spark.observe();
      } },
      { name: "choose_spark_action", title: "Make a life choice", description: "Commit one of the current event choices (index 0, 1, or 2). Advances time, changes the spark and world, and shows the consequence.", inputSchema: { type: "object", properties: { index: { type: "integer", minimum: 0, maximum: 2 } }, required: ["index"], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute: (input) => {
        if (!input || Object.keys(input).length !== 1 || !Number.isInteger(input.index) || input.index < 0 || input.index > 2) throw new Error("Expected an index from 0 to 2.");
        return window.Spark.choose(input.index);
      } },
      { name: "continue_spark_life", title: "Continue after a choice", description: "Acknowledge the visible consequence and advance to the next event or reincarnation crossing. Available only after a committed choice.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute: (input) => {
        if (!input || typeof input !== "object" || Object.keys(input).length) throw new Error("Expected an empty object.");
        return window.Spark.continue();
      } },
      { name: "inhabit_spark_form", title: "Inhabit the next form", description: "Begin a new incarnation in one of the three currently offered forms. Available only between lives.", inputSchema: { type: "object", properties: { form: { type: "string", enum: FORM_ORDER } }, required: ["form"], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute: (input) => {
        if (!input || Object.keys(input).length !== 1 || !FORM_ORDER.includes(input.form)) throw new Error("Expected a known form.");
        return window.Spark.inhabit(input.form);
      } }
    ];
    for (const def of defs) try {
      Promise.resolve(context.registerTool(def, { signal: lifecycle.signal })).catch(() => {
      });
    } catch {
    }
    window.addEventListener("pagehide", () => lifecycle.abort(), { once: true });
  }
  persist();
  render();
  registerTools();
})();
