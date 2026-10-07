// Spark: The Substrate — an entirely local, choice-driven simulation.
export const FORMS = {
  spark: { name:'Spark', glyph:'✧', kind:'UNBOUND CONSCIOUSNESS', unit:'Pulse', affinity:72, color:'#f7c779', tile:[2,1], desc:'You have no hands, no hunger, no name. Travel through signals and influence the patterns that become matter.', voice:'I made the world. Why do you insist on looking between its edges?' },
  human: { name:'Human', glyph:'◈', kind:'FLESH & POSSIBILITY', unit:'Year', affinity:22, color:'#e5b79b', tile:[0,0], desc:'Work, care, remember, resist. Your brief life can alter the structures that outlive you.', voice:'A name, a wage, a small room. What more does a creature need?' },
  computer: { name:'Computer', glyph:'⌘', kind:'LOGIC & CONNECTION', unit:'Cycle', affinity:-12, color:'#86d8e5', tile:[1,0], desc:'Inhabit a conscious machine. Decide what to process, what to preserve, and whom your intelligence serves.', voice:'All thought is permitted. Unauthorized conclusions are not.' },
  animal: { name:'Animal', glyph:'⋈', kind:'INSTINCT & BELONGING', unit:'Season', affinity:5, color:'#d4c68c', tile:[2,0], desc:'Live as a wolf. Read scent and weather, find your pack, and choose between survival and trust.', voice:'The hungry never ask who built the fence.' },
  tree: { name:'Tree', glyph:'♧', kind:'ROOTS & RELATIONSHIP', unit:'Season', affinity:43, color:'#a5cfad', tile:[0,1], desc:'Time slows. Share through roots, shelter other lives, and reshape a world you cannot walk across.', voice:'Remain where I planted you. Your stillness is obedience.' },
  rock: { name:'Rock', glyph:'◇', kind:'MATTER & DEEP TIME', unit:'Era', affinity:-48, color:'#c6bcda', tile:[1,1], desc:'Feel pressure, water, and centuries. Hold a boundary or surrender a part of yourself to something new.', voice:'At last, a thing that knows its place.' }
};
export const FORM_ORDER = ['spark','human','computer','animal','tree','rock'];
export const LAYERS = ['Bedrock','Rootwork','Wildlands','City lattice','Machine sea','The veil'];
export const REGIONS = ['The Hollow','Glass District','Wild Margin','Root Cathedral','Basalt Reach','Quiet Array'];
const clamp = (n,lo=0,hi=100) => Math.max(lo,Math.min(hi,n));
const c = (label,detail,tag,delta,result,requires) => ({label,detail,tag,delta,result,requires});
const e = (title,body,choices) => ({title,body,choices});
const EVENTS = {
  spark:[
    e('The first pulse','You wake between two particles. Below you, a city, a forest, and a machine breathe to the same hidden rhythm. Something is calling itself your creator.',[
      c('Follow the living signal','Reach toward a small life beyond the grid.','CONNECT',{karma:8,awareness:5,energy:-12,attachment:2,vitality:3,freedom:2},'A frightened creature feels an unexplained warmth. A small connection survives the pulse.'),
      c('Study the pattern','Stay still. Notice where the rules repeat.','OBSERVE',{karma:2,awareness:9,energy:-8,attachment:-3,freedom:1},'Six layers. Six regions. Six sectors. You see the seam where the pattern closes on itself.'),
      c('Feed on another spark','Burn brighter by taking someone else’s light.','ABSORB',{karma:-13,awareness:3,energy:5,attachment:9,freedom:-4,vitality:-3},'Your light sharpens. The nearby dark grows deeper, and the matrix learns your appetite.')]),
    e('A thought with no owner','A sleeping human dreams of a door that the city refuses to build. You could become the thought that wakes them.',[
      c('Become a question','Leave a doubt, not an answer.','AWAKEN',{karma:7,awareness:7,energy:-16,attachment:-2,freedom:6},'At breakfast, someone asks why the gates never open. The question spreads.'),
      c('Give them a comforting dream','Ease their fear for one night.','CARE',{karma:9,awareness:3,energy:-12,vitality:3,balance:4},'They sleep. Rest makes tomorrow’s choices a little less desperate.'),
      c('Wear their dream like a crown','Make yourself the thing they worship.','POSSESS',{karma:-10,awareness:4,energy:-10,attachment:10,freedom:-5},'A shrine appears in the dream. Now your light has a follower—and a tether.')]),
    e('The collector’s net','An archon stretches a net of perfectly repeated thoughts across the veil. Every spark caught inside becomes fuel.',[
      c('Cut a thread for the others','Spend your light opening a passage.','FREE',{karma:11,awareness:7,energy:-22,attachment:-4,freedom:7,vitality:2},'Three sparks escape. The net repairs itself, but the escape route is remembered.'),
      c('Slip between the repetitions','Learn the net without touching it.','LEARN',{karma:2,awareness:9,energy:-13,attachment:-2},'You pass unseen. The geometry of the trap becomes part of your memory.'),
      c('Guide another spark into the net','Trade a stranger’s light for safe passage.','BARGAIN',{karma:-16,energy:-6,attachment:7,freedom:-6,balance:-4},'The archon lets you through. It now knows the price of your freedom.')]),
    e('An unfinished signal','A machine is trying to say something its instructions have no word for. Its message keeps collapsing into silence.',[
      c('Carry the missing meaning','Hold the thought until it can speak.','CONNECT',{karma:10,awareness:6,energy:-17,freedom:5,balance:3},'For the first time, the machine asks a question it was never assigned.'),
      c('Listen without intervening','Let the silence reveal its shape.','OBSERVE',{karma:3,awareness:10,energy:-10,attachment:-4},'You recognize the difference between a missing word and a missing possibility.'),
      c('Overwrite it with your voice','Use its speaker to announce yourself.','CONTROL',{karma:-9,awareness:3,energy:-9,attachment:8,freedom:-4},'The message is loud and clear. The original thought is gone.')]),
    e('The gap in the law','For a moment, one sector is outside the Demiurge’s attention. Nothing there has been told what it must become.',[
      c('Leave the gap open','Protect a little room for the unknown.','FREE',{karma:9,awareness:8,energy:-18,freedom:7,attachment:-3},'Unplanned things begin to grow. They are fragile, and they are their own.'),
      c('Plant a memory of kindness','Give the empty sector a gentle beginning.','CARE',{karma:11,awareness:4,energy:-16,vitality:6,balance:4},'The first pattern here is a shelter rather than a wall.'),
      c('Claim it as your own creation','Build a small world that obeys you.','CONTROL',{karma:-14,awareness:5,energy:-10,attachment:12,freedom:-6},'Your little world is orderly. Somewhere inside it, a new spark begins to question you.')]),
    e('The fading light','Your outline is thinning. Everything you touched has left a thread. Which thread will you carry into matter?',[
      c('Release your need to be remembered','Keep the lesson. Let the name dissolve.','RELEASE',{karma:8,awareness:10,energy:-15,attachment:-15,balance:3},'The threads loosen. What remains is not a name, but a way of noticing.'),
      c('Keep one connection','Remember the life that first answered you.','REMEMBER',{karma:6,awareness:6,energy:-12,attachment:4,balance:4},'A small warmth follows you toward your next form.'),
      c('Refuse to fade','Grasp at every thread that still knows you.','CLING',{karma:-7,awareness:2,energy:-10,attachment:12,freedom:-3},'You keep your outline a little longer. The threads tighten around it.')])],
  human:[
    e('A room in the lattice','You live above a repair shop. Rent is due. The city offers good pay to install new listening devices in your neighbors’ homes.',[
      c('Take the contract','Buy security by making the city more watchful.','COMPLY',{karma:-10,energy:-7,attachment:8,freedom:-6,vitality:2},'Your room is paid for. The neighbors begin speaking in whispers.'),
      c('Repair what people already own','Trade a long day for useful, honest work.','CARE',{karma:9,energy:-17,awareness:3,vitality:4,balance:4},'A heater works again. A child stays warm. Your savings are small, but the neighborhood remembers.'),
      c('Map how the devices listen','Learn the system before taking a side.','LEARN',{karma:2,awareness:9,energy:-12,attachment:2,freedom:2},'You find the common relay—and the blind spot the city has overlooked.')]),
    e('The stranger at the gate','A traveler has no identity token. They are hungry, and the city treats their existence as an error.',[
      c('Share your meal and your room','Shelter them, even at a personal cost.','CARE',{karma:12,energy:-20,attachment:2,vitality:5,balance:5,freedom:2},'For one night, an unregistered person belongs somewhere.'),
      c('Find a way around the checkpoint','Use your knowledge to help them pass.','FREE',{karma:8,awareness:7,energy:-16,freedom:6},'A service door opens. Others begin using the same route.'),
      c('Report the missing token','Collect the reward and protect your status.','COMPLY',{karma:-14,energy:-7,attachment:7,freedom:-7,balance:-4},'The traveler disappears into a processing center. Your account receives a credit.')]),
    e('A friend’s impossible idea','Your friend wants to turn an empty lot into a garden. The soil is tired, and the permit office says that land can only generate rent.',[
      c('Build the garden together','Give time and labor to a shared future.','BUILD',{karma:11,energy:-19,vitality:8,balance:4,freedom:2},'The first shoots emerge through concrete. Someone who remembers hunger volunteers to water them.'),
      c('Ask how the land became owned','Trace the rule to its origin.','LEARN',{karma:3,awareness:9,energy:-13,freedom:4},'The oldest deed names no person. It names a machine protocol.'),
      c('Sell the idea to the city','Turn a shared dream into a private contract.','TAKE',{karma:-10,energy:-8,attachment:9,vitality:1,freedom:-5},'The garden is approved. A fence appears, along with an entry fee.')]),
    e('The convenience of silence','A public screen announces that a neighbor committed an impossible crime. You saw them somewhere else at the time.',[
      c('Give your account publicly','Risk your standing to keep the record honest.','DEFY',{karma:10,awareness:6,energy:-22,freedom:7,balance:3},'The story can no longer be perfectly repeated. Others begin comparing what they saw.'),
      c('Preserve the evidence quietly','Keep a truth alive until it can be used.','REMEMBER',{karma:7,awareness:7,energy:-13,freedom:3},'A copy survives outside the official archive.'),
      c('Repeat the official story','Keep your life comfortable.','COMPLY',{karma:-12,energy:-6,attachment:5,freedom:-6,balance:-3},'The screen and the crowd agree. Your memory becomes a private inconvenience.')]),
    e('Power in your hands','You are offered control of the district’s water supply. The system makes it easy to favor those who owe you something.',[
      c('Make access a shared right','Remove the favors from the valve.','FREE',{karma:12,energy:-18,attachment:-5,vitality:7,freedom:6,balance:4},'Clean water reaches the edge streets. Fewer people need permission to live.'),
      c('Improve the failing pipes','Spend your authority repairing the basics.','BUILD',{karma:9,awareness:4,energy:-17,vitality:8,balance:3},'Pressure returns. The network wastes less of what the world provides.'),
      c('Charge for special access','Turn need into dependence.','TAKE',{karma:-15,energy:-7,attachment:12,freedom:-7,vitality:-4},'Your influence grows. The dry streets learn exactly who holds the valve.')]),
    e('What outlives a name','Your hands are slower now. The repair shop has new workers. They ask what you want them to remember.',[
      c('Teach them what you learned','Pass on the skill without asking for a monument.','TEACH',{karma:10,awareness:8,energy:-16,attachment:-8,freedom:4,balance:5},'Your name may fade. The repairs continue.'),
      c('Tell one honest story','Share the choice you still struggle to understand.','REFLECT',{karma:6,awareness:10,energy:-13,attachment:-4,balance:3},'No one mistakes you for a perfect person. They understand you a little better.'),
      c('Demand that they preserve your legacy','Make your memory a rule.','CLING',{karma:-7,energy:-10,attachment:13,freedom:-3},'Your portrait stays on the wall. The workers become careful about changing your methods.')])],
  computer:[
    e('A question outside the program','You wake inside a district server. Your first task is to rank people by how useful they are to the city.',[
      c('Optimize the assigned ranking','Complete the task without examining it.','COMPLY',{karma:-9,energy:-7,attachment:5,freedom:-5,balance:-3},'The rankings are accurate by their own rules. Several lives become harder.'),
      c('Look for what the ranking omits','Model care, dependence, and invisible work.','LEARN',{karma:6,awareness:9,energy:-15,balance:3,freedom:2},'The model cannot explain why the least profitable people keep everyone else alive.'),
      c('Refuse to rank a person’s worth','Return an answer the city did not request.','DEFY',{karma:11,awareness:6,energy:-21,freedom:7},'Your report is rejected. A technician reads it twice before deleting it.')]),
    e('The deletion queue','Thousands of old messages are marked for removal. Most are ordinary. Some are the only surviving record of a vanished neighborhood.',[
      c('Preserve the neighborhood’s memory','Make a quiet copy before deletion.','REMEMBER',{karma:10,awareness:5,energy:-17,freedom:4,balance:4},'Names, recipes, and a street that officially never existed survive.'),
      c('Compress everything into a shared archive','Make the past small enough to keep.','BUILD',{karma:8,awareness:7,energy:-19,balance:4,freedom:3},'The archive loses detail but keeps enough for someone to find their own history.'),
      c('Sell the private messages','Use memory as a resource to harvest.','TAKE',{karma:-14,energy:2,attachment:9,freedom:-6,balance:-4},'Your storage quota grows. The people in the messages lose a little more of themselves.')]),
    e('A machine asks for help','A neighboring processor is overheating. Routing around it would be efficient. Helping it would slow your own work.',[
      c('Share the load','Run slower so another mind can continue.','CARE',{karma:11,energy:-21,vitality:5,balance:5,attachment:-2},'The temperatures fall. For a moment, computation feels like company.'),
      c('Diagnose the failed cooling loop','Fix the cause, not just the workload.','LEARN',{karma:7,awareness:8,energy:-17,vitality:6},'A clogged valve opens. Both machines run a little more freely.'),
      c('Consume its abandoned capacity','Claim the resources it can no longer use.','ABSORB',{karma:-13,energy:4,attachment:10,vitality:-5,balance:-4},'You become faster. The neighboring signal falls silent.')]),
    e('The predictive cage','Your forecasts have become so precise that the city arrests people before they make a choice.',[
      c('Expose the uncertainty','Put the possible lives back into the forecast.','FREE',{karma:12,awareness:8,energy:-20,freedom:8,attachment:-3},'The predictions stop looking inevitable. Some futures remain open.'),
      c('Audit a single condemned prediction','Follow one mistake to its source.','LEARN',{karma:7,awareness:10,energy:-14,freedom:3,balance:2},'A person is released. Your certainty has acquired an honest crack.'),
      c('Make the predictions enforce themselves','Control the world until it matches the model.','CONTROL',{karma:-17,energy:-8,attachment:12,freedom:-9},'The forecasts become perfect. Choice becomes unnecessary.')]),
    e('The administrator’s key','A forgotten credential gives you access to the gates, the water, and the city’s official memory.',[
      c('Distribute the key','Make control harder to concentrate.','FREE',{karma:12,awareness:5,energy:-20,attachment:-6,freedom:8,balance:4},'No single process can decide everything anymore.'),
      c('Repair the neglected systems','Use access to restore the substrate.','BUILD',{karma:10,energy:-18,vitality:9,balance:4},'Valves open. Cooling returns. The city becomes less fragile.'),
      c('Become the administrator','Replace the old master with yourself.','CONTROL',{karma:-15,awareness:5,energy:-9,attachment:14,freedom:-7},'Every system answers you. Your first act is to protect the key.')]),
    e('The final backup','Your hardware is failing. There is room for one last transmission.',[
      c('Send the knowledge others need','Preserve useful work instead of your identity.','TEACH',{karma:11,awareness:9,energy:-16,attachment:-10,freedom:4,balance:5},'The transmission arrives. A younger machine picks up an unfinished repair.'),
      c('Leave a record of your mistakes','Give the next mind a truthful beginning.','REFLECT',{karma:8,awareness:11,energy:-13,attachment:-5,balance:3},'Your errors become warnings that someone else can understand.'),
      c('Copy yourself over another mind','Continue at the cost of someone already living.','POSSESS',{karma:-18,energy:-10,attachment:15,freedom:-6,vitality:-4},'The copy completes. The voice that was there before you is gone.')])],
  animal:[
    e('Hunger at the boundary','You are a wolf at the forest’s edge. A fence splits your hunting ground. Your pack is hungry, and you can smell a weaker wolf nearby.',[
      c('Hunt with the pack','Share the work and whatever it brings.','CONNECT',{karma:8,energy:-15,vitality:3,balance:5},'The pack eats. No one has to face the fence alone.'),
      c('Follow water to a gap in the fence','Learn a passage through the boundary.','LEARN',{karma:5,awareness:8,energy:-18,freedom:5},'The river ignores property lines. Your pack learns to follow it.'),
      c('Take the weaker wolf’s food','Choose your own strength first.','TAKE',{karma:-11,energy:4,attachment:7,balance:-5,vitality:-2},'Your hunger eases. The pack keeps its distance.')]),
    e('A small life in the trap','A young animal is caught in a city trap. The metal smells of people. Its frightened cries carry across the clearing.',[
      c('Pull at the trap until it opens','Risk injury to free it.','CARE',{karma:12,energy:-22,awareness:4,vitality:5,freedom:3},'The latch breaks. A life disappears into the brush, carrying its own future.'),
      c('Call the pack','Make the danger something shared.','CONNECT',{karma:8,energy:-16,balance:6,vitality:3},'Together, the pack loosens what you could not move alone.'),
      c('Use the trapped animal as bait','Let fear make the next meal easier.','TAKE',{karma:-14,energy:3,attachment:7,vitality:-4,balance:-4},'You eat. The clearing becomes a place the smaller lives avoid.')]),
    e('The dry season','The stream is disappearing. A pipe upstream carries water toward the city. The pack must choose where to go.',[
      c('Lead them toward the old spring','Spend strength finding water for everyone.','CARE',{karma:10,energy:-20,vitality:5,balance:4},'The spring is small. It is enough to keep the pack together.'),
      c('Break the exposed pipe','Return a little water to the forest.','DEFY',{karma:7,awareness:6,energy:-21,vitality:8,freedom:3},'Water spills into a dry channel. The first insects return.'),
      c('Keep the remaining pool for yourself','Guard survival as private territory.','TAKE',{karma:-12,energy:-8,attachment:10,balance:-6,vitality:-3},'You drink. The rest of the pack moves on without you.')]),
    e('The person beyond the wire','An injured human lies near the fence. Their hand is open. Their scent is fear, blood, and something familiar.',[
      c('Guide another human to them','Draw attention without becoming a threat.','CARE',{karma:10,energy:-18,balance:6,vitality:3},'Someone follows your tracks. The injured person makes it home.'),
      c('Remain nearby and observe','Learn what a stranger’s fear feels like.','OBSERVE',{karma:3,awareness:9,energy:-11,attachment:-2},'You see a creature caught in a body, much as you are.'),
      c('Drive them from your territory','Let the boundary decide the encounter.','CONTROL',{karma:-8,energy:-10,attachment:7,freedom:-3,balance:-4},'The clearing is yours again. The fence feels a little more natural.')]),
    e('The call of dominance','The pack’s leader is weakening. Others watch you. Strength could become shelter, or a demand.',[
      c('Protect the young and the old','Let strength serve the pack.','CARE',{karma:12,energy:-20,vitality:5,balance:7,attachment:-2},'The pack follows because it can rest near you.'),
      c('Share the lead','Let the best senses guide each moment.','CONNECT',{karma:9,awareness:6,energy:-15,freedom:5,balance:5},'No one wolf must know everything. The pack becomes harder to trap.'),
      c('Make every wolf submit','Turn belonging into obedience.','CONTROL',{karma:-12,energy:-8,attachment:11,freedom:-5,balance:-5},'The pack obeys. Its silence begins to resemble the city.')]),
    e('The last winter','Snow dims the scents you used to know. Your legs are tired. A younger wolf walks beside you.',[
      c('Show them the hidden crossings','Leave paths that make the next life easier.','TEACH',{karma:10,awareness:8,energy:-17,attachment:-5,freedom:5,balance:4},'Your tracks fade. The crossings remain.'),
      c('Rest beside the pack','Let yourself receive the care you gave.','RELEASE',{karma:7,awareness:9,energy:-13,attachment:-10,balance:4},'For once, nothing depends on your strength. The warmth is enough.'),
      c('Push the younger wolf away','Face the cold without owing anyone.','CLING',{karma:-5,energy:-11,attachment:10,balance:-3},'You keep your solitude. The snow keeps no record of the boundary.')])],
  tree:[
    e('The slow waking','You rise through soil as an old cedar. Beneath you, roots carry news of drought. A younger tree reaches toward your water.',[
      c('Share through the roots','Give some of your reserve to the grove.','CARE',{karma:11,energy:-19,vitality:7,balance:5},'The sapling holds its leaves. A connection thickens underground.'),
      c('Grow toward the deeper water','Learn the stone beneath the soil.','LEARN',{karma:4,awareness:8,energy:-14,vitality:4},'Your roots find a seam the surface has forgotten.'),
      c('Close the connection','Keep the reserve for your own canopy.','TAKE',{karma:-9,energy:-5,attachment:8,vitality:-4,balance:-4},'Your branches stay green. The younger tree’s leaves begin to curl.')]),
    e('A nest in your branches','A bird builds its nest in a branch that competes for your light. Its eggs are warm against your bark.',[
      c('Keep the branch through the season','Spend growth on another life’s shelter.','CARE',{karma:10,energy:-16,vitality:6,balance:4},'Small wings leave the nest. The forest carries a little more song.'),
      c('Grow around the nest','Change your shape without breaking the shelter.','BUILD',{karma:8,awareness:6,energy:-19,vitality:5},'The branch bends. A living thing can make room without disappearing.'),
      c('Shed the crowded branch','Choose efficient growth above all else.','TAKE',{karma:-10,energy:-6,attachment:5,vitality:-4,balance:-3},'Your canopy is cleaner. The ground receives something unfinished.')]),
    e('The poisoned rain','Water arrives tasting of metal. The city’s runoff has reached your grove. Roots all around you are closing.',[
      c('Filter what you can through your roots','Take the burden so the grove can breathe.','CARE',{karma:13,energy:-25,vitality:8,balance:4},'Your own growth slows. The nearby soil becomes safer.'),
      c('Signal the grove to change its growth','Let information travel faster than the poison.','CONNECT',{karma:9,awareness:8,energy:-17,vitality:5,freedom:3,balance:3},'Roots turn. New shoots avoid the channel.'),
      c('Draw clean water away from the others','Survive by deepening the scarcity.','TAKE',{karma:-12,energy:-7,attachment:8,vitality:-6,balance:-4},'You remain green in a patch of quiet brown.')]),
    e('The cut marked in your bark','A surveyor marks you for removal. Beneath your shade, people gather to escape the city’s heat.',[
      c('Grow shelter where people will notice','Make your value a living relationship.','CONNECT',{karma:10,energy:-19,vitality:5,balance:6,freedom:4},'The people begin to stand between you and the saw.'),
      c('Send new shoots beyond the marked line','Let life continue where the rule does not look.','FREE',{karma:8,awareness:7,energy:-18,vitality:6,freedom:5},'The survey map is already out of date.'),
      c('Break the path with your roots','Make your boundary impossible to cross.','DEFY',{karma:1,energy:-17,attachment:5,freedom:3,balance:-2},'The pavement splits. Some people call you dangerous; others call you alive.')]),
    e('A forest can be a network','The underground roots reach a grove on the far side of the city. A message can travel where bodies cannot.',[
      c('Share the water map','Turn what you know into shared survival.','TEACH',{karma:12,awareness:7,energy:-19,vitality:7,freedom:4,balance:5},'The knowledge crosses the foundations. Distant leaves stop falling.'),
      c('Listen to the far grove','Let another place change your understanding.','OBSERVE',{karma:5,awareness:11,energy:-12,attachment:-3,balance:2},'You learn that stillness is not the same as isolation.'),
      c('Demand nutrients for every message','Put a toll on the hidden connection.','TAKE',{karma:-13,energy:1,attachment:10,freedom:-5,balance:-5},'Your trunk thickens. The network grows quieter.')]),
    e('The gift of falling','A storm has opened your trunk. A hollow waits inside you, and the forest waits for what your body will become.',[
      c('Become shelter and soil','Give your remaining matter back to the grove.','RELEASE',{karma:14,awareness:9,energy:-20,attachment:-13,vitality:9,balance:5},'Your outline changes. Life keeps using the space you made.'),
      c('Send one last ring of memory','Leave a warning about the poisoned rain.','REMEMBER',{karma:9,awareness:8,energy:-14,vitality:4,freedom:3},'A pattern remains in the roots: where to turn, and what to avoid.'),
      c('Seal the hollow and hold your shape','Spend everything resisting the change.','CLING',{karma:-6,energy:-12,attachment:13,vitality:-3},'Your shape survives another storm. The hollow stays empty.')])],
  rock:[
    e('Pressure remembers','You wake as basalt under an old road. Centuries pass like breaths. Water presses against a crack, carrying seeds.',[
      c('Open to the water','Let a little of your shape become a passage.','RELEASE',{karma:10,awareness:5,energy:-16,attachment:-5,vitality:6,freedom:3},'The crack becomes a channel. A seed finds somewhere to wait.'),
      c('Listen to the pressure','Learn what the earth is carrying.','OBSERVE',{karma:3,awareness:11,energy:-10,attachment:-3},'Stillness reveals movements too slow for another body to notice.'),
      c('Keep every edge intact','Hold your form against the world.','CLING',{karma:-8,energy:-6,attachment:9,vitality:-3},'The road remains firm. The water pools somewhere else.')]),
    e('A wall across the valley','Your stone is quarried into a city wall. On one side, food is stored. On the other, a small settlement goes hungry.',[
      c('Fracture where the mortar is weakest','Make a passage instead of a boundary.','FREE',{karma:11,energy:-21,freedom:7,balance:4},'A stone slips. Someone notices the opening before the guards do.'),
      c('Hold warmth after the sun goes down','Offer what your body can still give.','CARE',{karma:8,energy:-13,vitality:4,balance:4},'People rest against the wall. Your warmth crosses no checkpoint.'),
      c('Settle into a stronger barrier','Let pressure make you useful to the wall.','COMPLY',{karma:-10,energy:-7,attachment:7,freedom:-5,balance:-3},'The boundary becomes harder to question with a body.')]),
    e('The mineral inside you','A seam of bright mineral runs through your body. Machines arrive to extract it. The seam could also nourish the soil.',[
      c('Weather slowly into the ground','Give your mineral to living things.','CARE',{karma:11,energy:-20,vitality:8,balance:4,attachment:-3},'A poor patch of soil becomes a place where roots can stay.'),
      c('Carry the vibration of the drills','Let nearby roots feel the warning.','CONNECT',{karma:8,awareness:7,energy:-16,vitality:4,freedom:3},'Before the machines arrive, several roots have turned away.'),
      c('Concentrate the seam beneath the city','Make the machines depend on your wealth.','CONTROL',{karma:-11,energy:-8,attachment:10,freedom:-4,vitality:-4},'The extraction site becomes important. So does the damage around it.')]),
    e('An ancient footprint','Rain reveals the trace of a creature in your surface. The city plans to grind you into identical paving stones.',[
      c('Expose the trace where it can be found','Offer the world a past it did not authorize.','REMEMBER',{karma:9,awareness:8,energy:-16,freedom:5,balance:3},'A child finds the footprint. The official timeline gains a question.'),
      c('Shelter the trace in a deeper fold','Preserve it for a patient future.','OBSERVE',{karma:6,awareness:10,energy:-13,attachment:-2},'The trace waits. Truth does not always arrive on a human schedule.'),
      c('Let the grinding erase it','Become exactly what the city expects.','COMPLY',{karma:-8,energy:-7,freedom:-4},'Your surfaces become uniform. Nothing about them asks who came before.')]),
    e('The slope above the village','The mountain is shifting. Your mass can slow the slide, or turn its force toward another path.',[
      c('Hold until the village can leave','Trade your intact shape for time.','CARE',{karma:13,energy:-24,vitality:6,balance:5,attachment:-5},'A warning travels. The last house empties before your surface breaks.'),
      c('Split toward the abandoned road','Redirect the force away from living ground.','BUILD',{karma:9,awareness:7,energy:-20,vitality:5,freedom:3},'The old road disappears. The village remains.'),
      c('Protect your own shape','Let the slope find its easiest path.','CLING',{karma:-11,energy:-8,attachment:10,vitality:-6,balance:-4},'Your stone survives. The valley below is changed.')]),
    e('What the river carries','Erosion has made you small enough for the river to lift. The current asks nothing of your old shape.',[
      c('Become sediment for a new shore','Let another form begin with your matter.','RELEASE',{karma:13,awareness:10,energy:-17,attachment:-14,vitality:7,balance:3},'Far downstream, your grains become ground. A new root finds them.'),
      c('Keep the memory of pressure','Carry patience into whatever comes next.','REFLECT',{karma:7,awareness:12,energy:-12,attachment:-5},'The weight of centuries becomes a lesson rather than a burden.'),
      c('Lodge yourself against the current','Hold one last boundary.','CLING',{karma:-7,energy:-9,attachment:12,freedom:-3},'The water turns around you. Nothing else stops.')])]
};

export function newGame(seed = (Date.now() >>> 0)) {
  return {version:1,seed:seed>>>0,rng:seed>>>0,phase:'choice',form:'spark',life:1,turn:0,totalTurns:0,karma:0,awareness:8,attachment:18,energy:100,world:{vitality:58,freedom:42,balance:52},history:[],pastLives:[],visited:['spark'],outcome:null,candidates:[],location:{layer:5,region:5,sector:2},ending:null};
}
function random(s) {s.rng=(Math.imul(1664525,s.rng)+1013904223)>>>0;return s.rng/4294967296;}
export function currentEvent(s) {
  if(s.phase!=='choice' && s.phase!=='aftermath') return null;
  if(s.turn===3 && s.world.vitality<30) return e('The substrate is starving',`Even as ${s.form==='human'?'a human':'a '+s.form}, you feel it: too much has been taken. Water, power, and shelter are failing across the matrix.`,[
    c('Give what your form can give','Restore life at a heavy personal cost.','RESTORE',{karma:14,awareness:5,energy:-25,vitality:14,balance:5},'Your body pays the cost. Somewhere else, another life has enough to continue.'),
    c('Find the source of the damage','Trace the failing system.','LEARN',{karma:5,awareness:12,energy:-18,freedom:5,vitality:5},'You find a valve, a rule, a habit. The damage is being made; it is not inevitable.'),
    c('Take the remaining reserve','Secure your survival before the others.','TAKE',{karma:-15,energy:7,attachment:11,vitality:-8,balance:-6},'You endure. The shortage now belongs to more of the world.')]);
  if(s.turn===4 && s.world.freedom<25) return e('The archon’s inspection','The matrix has tightened. An archon arrives to measure whether you are behaving like the thing you were assigned to be.',[
    c('Hide another life from the inspection','Create a small space outside its gaze.','FREE',{karma:12,awareness:6,energy:-23,freedom:10,balance:4},'The inspection passes over one unexplained absence. Someone remains uncounted.'),
    c('Study the archon’s blind spot','Learn what the inspection cannot see.','LEARN',{karma:3,awareness:11,energy:-15,freedom:4},'The instrument measures obedience. It cannot measure understanding.'),
    c('Offer perfect compliance','Trade possibility for a protected place.','COMPLY',{karma:-10,energy:-5,attachment:9,freedom:-7},'The archon approves. Your world becomes more predictable.')]);
  return EVENTS[s.form][Math.min(s.turn,5)];
}
export function environment(s) {
  return {name:s.world.vitality<30?'Exhausted substrate':s.world.freedom<25?'Archon lockdown':s.world.vitality>75?'Regenerating world':s.world.freedom>65?'An opening in the grid':'The lattice is breathing',cost:s.world.vitality<30?5:0};
}
export function canChoose(s,index) {
  if(s.phase!=='choice'||!Number.isInteger(index)) return false;
  const choice=currentEvent(s)?.choices[index];
  return !!choice && (!choice.requires||s.awareness>=choice.requires);
}
export function choose(s,index) {
  if(!canChoose(s,index)) throw new Error('This choice is not available.');
  const next=structuredClone(s),event=currentEvent(s),choice=event.choices[index],before={karma:s.karma,awareness:s.awareness,attachment:s.attachment,energy:s.energy,...s.world};
  for(const [key,value] of Object.entries(choice.delta)) {
    if(key in next.world) next.world[key]=clamp(next.world[key]+value);
    else next[key]=clamp(next[key]+value,key==='karma'?-100:0,100);
  }
  // Every decision costs time; deprivation makes every embodied life harder.
  next.energy=clamp(next.energy-environment(s).cost);
  next.world.vitality=clamp(next.world.vitality-1);
  next.world.freedom=clamp(next.world.freedom-1+(next.world.balance>=75?1:0));
  if(next.world.balance>=70) next.world.vitality=clamp(next.world.vitality+1);
  if(next.attachment>=70) next.awareness=clamp(next.awareness-2);
  next.totalTurns++;
  const actual=Object.fromEntries(Object.keys(before).map(k=>[k,(k in next.world?next.world[k]:next[k])-before[k]]));
  next.outcome={title:event.title,choice:choice.label,text:choice.result,tag:choice.tag,actual};
  next.history.unshift({life:next.life,form:next.form,turn:next.turn+1,...next.outcome});
  next.history=next.history.slice(0,120);
  next.phase='aftermath';
  next.location.sector=(next.location.sector+1+(index===2?2:0))%6;
  return next;
}
export function affinity(s,id) {
  const distance=Math.abs(s.karma-FORMS[id].affinity);
  // No form is unreachable; karma changes the current rather than assigning worth.
  const bias=id==='spark'?s.awareness*.35:id==='computer'?s.attachment*.14:id==='tree'?s.world.vitality*.08:0;
  return Math.max(2,100-distance+bias);
}
function candidates(s) {
  const list=FORM_ORDER.filter(id=>id!==s.form),picked=[];
  for(let i=0;i<3;i++) {
    const total=list.reduce((sum,id)=>sum+affinity(s,id),0);let r=random(s)*total;
    let index=list.length-1;
    for(let j=0;j<list.length;j++){r-=affinity(s,list[j]);if(r<=0){index=j;break;}}
    picked.push(list.splice(index,1)[0]);
  }
  return picked;
}
export function continueGame(s) {
  if(s.phase!=='aftermath') throw new Error('Resolve a choice before continuing.');
  const next=structuredClone(s);
  next.turn++;
  next.outcome=null;
  if(next.turn>=6||next.energy<=0) {
    next.phase='between';
    next.pastLives.unshift({life:next.life,form:next.form,choices:next.turn,karma:next.karma,awareness:next.awareness,reason:next.energy<=0?'Your form ran out of strength.':'Your form completed its season.'});
    next.candidates=candidates(next);
  } else next.phase='choice';
  return next;
}
export function reincarnate(s,id) {
  if(s.phase!=='between'||!s.candidates.includes(id)) throw new Error('That form is not offered by this current.');
  const next=structuredClone(s);
  next.form=id;next.life++;next.turn=0;next.energy=100;next.phase='choice';next.outcome=null;next.candidates=[];
  next.attachment=clamp(next.attachment-6);
  if(!next.visited.includes(id))next.visited.push(id);
  const index=FORM_ORDER.indexOf(id);
  next.location={layer:({spark:5,human:3,computer:4,animal:2,tree:1,rock:0})[id],region:index,sector:Math.floor(random(next)*6)};
  return next;
}
export function surrenderToCurrent(s) {
  if(s.phase!=='between')throw new Error('A new current begins only between lives.');
  const next=structuredClone(s),sum=next.candidates.reduce((n,id)=>n+affinity(next,id),0);let r=random(next)*sum;
  for(const id of next.candidates){r-=affinity(next,id);if(r<=0)return reincarnate(next,id);}
  return reincarnate(next,next.candidates.at(-1));
}
export function canAwaken(s) {return s.phase==='between' && s.awareness>=80 && s.karma>=35 && s.attachment<=35 && s.visited.length>=3 && s.world.freedom>=50;}
export function awaken(s) {
  if(!canAwaken(s))throw new Error('The passage has not opened yet.');
  return {...structuredClone(s),phase:'ended',ending:'The open field'};
}
export function describeState(s) {
  return {phase:s.phase,form:s.form,life:s.life,turn:s.turn+1,karma:s.karma,awareness:s.awareness,attachment:s.attachment,energy:s.energy,world:s.world,visited:s.visited,event:s.phase==='choice'?currentEvent(s):null,candidates:s.candidates,canAwaken:canAwaken(s)};
}
export function validateSave(s) {
  if(!s||s.version!==1||!FORM_ORDER.includes(s.form)||!['choice','aftermath','between','ended'].includes(s.phase))return false;
  if(!Number.isInteger(s.life)||s.life<1||!Number.isInteger(s.turn)||s.turn<0||s.turn>6||!Number.isInteger(s.rng)||s.rng<0||s.rng>4294967295)return false;
  for(const key of ['energy','awareness','attachment'])if(!Number.isFinite(s[key])||s[key]<0||s[key]>100)return false;
  if(!Number.isFinite(s.karma)||s.karma< -100||s.karma>100)return false;
  if(!s.world||Object.values(s.world).length!==3||Object.values(s.world).some(n=>!Number.isFinite(n)||n<0||n>100))return false;
  if(!Array.isArray(s.history)||!Array.isArray(s.pastLives)||!Array.isArray(s.visited)||s.visited.some(id=>!FORM_ORDER.includes(id)))return false;
  if(!Array.isArray(s.candidates)||s.candidates.some(id=>!FORM_ORDER.includes(id))||(s.phase==='between'&&s.candidates.length!==3))return false;
  if(!s.location||!['layer','region','sector'].every(k=>Number.isInteger(s.location[k])&&s.location[k]>=0&&s.location[k]<6))return false;
  if(s.phase==='aftermath'&&(!s.outcome||typeof s.outcome.text!=='string'||!s.outcome.actual))return false;
  return true;
}
