// Controlled visual fixtures only. Never imported or served by the game build.
// Rooms are selected directly for coverage; enemies still spawn, move, wind up,
// damage and die through native stepRun. No enemy, HP, reward or unlock injection.
import {createVRPreview} from '../public/vr/spark-vr-model.js';
import {ENCOUNTERS} from '../public/action-engine.js';
export const WORLD_VISUAL_ROOMS={stratum:'quiet',tideglass:'tide-archive',verdant:'grove-well',cinder:'cinder-fuel',prism:'night-library',orbit:'orbit-relay',uncreated:'origin-draft'};
export const ENEMY_VISUAL_ROOMS={collector:'glass',archon:'glass',hound:'glass',mirror:'nursery',leech:'conduit'};
export function worldVisualFixture(runtime,room,seed=369){
 runtime.adapter.dispose();runtime.adapter.state=createVRPreview(seed);
 const run=runtime.adapter.state.run;run.room=room;run.discovered=[room];run.spawnTotal=ENCOUNTERS[room]?.total||12;run.spawnClock=0;
 runtime.configure({combatProfile:'spellcraft',quality:'balanced',reduced:false,movement:.5});runtime.input.recenter();runtime.pause(false);
 return {room,seed,policy:'Controlled room selection; all enemies and combat updates are canonical; not a natural campaign route'};
}
