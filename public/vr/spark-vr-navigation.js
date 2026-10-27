// Read-only route display derived from canonical Spark gates.
// This never opens gates, grants keys, changes the game, or invents directions.
import {exitPosition} from '../action-engine.js?v=0.17.0';

export const VR_COMPASS_DIRECTIONS=Object.freeze(['north','east','south','west']);
export const VR_COMPASS_LABELS=Object.freeze({north:'N',east:'E',south:'S',west:'W'});

const finite=n=>Number.isFinite(n)?n:0;

export function vrCompass(snapshot){
  if(!snapshot||!Array.isArray(snapshot.gates))
    throw Error('Spark VR compass requires a canonical room snapshot.');
  const player=snapshot.player??{};
  return VR_COMPASS_DIRECTIONS.map(direction=>{
    const gate=snapshot.gates.find(g=>g.direction===direction);
    if(!gate)return null;
    const at=exitPosition(direction);
    const distance=Math.hypot(finite(player.x)-at.x,finite(player.y)-at.y);
    const status=gate.available?'OPEN':'LOCKED';
    const name=String(gate.toName||gate.to||'Unknown room').slice(0,64);
    const reason=gate.available?'Approach and interact to travel':
      String(gate.reason||'Complete the required objectives.').slice(0,180);
    return {direction,heading:VR_COMPASS_LABELS[direction],
      status,name,reason,distance:Math.round(distance),
      available:!!gate.available};
  }).filter(Boolean);
}

export function closestVRGate(snapshot){
  const items=vrCompass(snapshot);
  return items.length?[...items].sort((a,b)=>a.distance-b.distance)[0]:null;
}

export function gateSummary(gate){
  if(!gate)return 'No exits in this room';
  const label=gate.available?'OPEN':'LOCKED';
  return gate.heading+' '+label+' '+gate.name;
}
