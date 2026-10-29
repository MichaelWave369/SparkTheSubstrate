// Optional canonical Duel geometry, version 1. No renderer, storage or damage authority.
// Existing 2D matches never enter this path. Units match duel-engine's 960-unit lane.
export const DUEL_SPATIAL_VERSION = 1;
export const DUEL_SPATIAL_RULES = Object.freeze({
  lateralLimit: 55, forwardLimit: 35, minHeight: 15, maxHeight: 95,
  hitRadius: 20, boltSpeed: 10, enemyWindup: 42,
  arenaHalfWidth: 265, floorHeight: -95, ceilingHeight: 200,
  dodgeFrames: 18, dodgeCooldown: 90, dodgeDistance: 45
});
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const finite = values => values.every(Number.isFinite);

export function duelSpatialInput(raw) {
  const r = DUEL_SPATIAL_RULES, p = raw?.body, a = raw?.aim;
  if (raw?.version !== DUEL_SPATIAL_VERSION || !p ||
      !finite([p.forward, p.lateral, p.height]) ||
      Math.abs(p.forward) > r.forwardLimit || Math.abs(p.lateral) > r.lateralLimit ||
      p.height < r.minHeight || p.height > r.maxHeight) return null;
  const result = {body: {forward: p.forward, lateral: p.lateral, height: p.height},
    cast: false, dodge: raw.dodge === true, dodgeDirection: raw.dodgeDirection === 1 ? 1 : -1};
  if (!a || !finite([a.forward, a.lateral, a.height, a.dx, a.dy, a.dz]) ||
      Math.abs(a.forward) > 75 || Math.abs(a.lateral) > 90 ||
      a.height < 5 || a.height > 170) return result;
  const length = Math.hypot(a.dx, a.dy, a.dz);
  if (length < .9 || length > 1.1) return result;
  result.aim = {forward:a.forward,lateral:a.lateral,height:a.height,
    dx: a.dx / length, dy: a.dy / length, dz: a.dz / length};
  result.cast = raw.cast === true;
  return result;
}

export function duelBody(fighter) {
  const r = DUEL_SPATIAL_RULES, p = fighter.spatialPose;
  return {x: clamp(fighter.x + (p?.forward ?? 0), 45, 915),
    y: p?.height ?? (fighter.crouch ? 35 : 65),
    z: clamp((p?.lateral ?? 0) + (fighter.dodgeOffset ?? 0), -r.lateralLimit, r.lateralLimit)};
}

export function duelBoltAim(match, index, supplied) {
  const f = match.fighters[index], body = duelBody(f);
  const origin = supplied ? {x: clamp(f.x + supplied.forward, 45, 915),
    y: supplied.height, z: clamp(supplied.lateral + (f.dodgeOffset ?? 0), -90, 90)} :
    {x: body.x + f.facing * 25, y: body.y, z: body.z};
  const target = duelBody(match.fighters[1 - index]);
  const direction = supplied ? [supplied.dx, supplied.dy, supplied.dz] :
    [target.x - origin.x, target.y - origin.y, target.z - origin.z];
  const n = Math.hypot(...direction) || 1;
  return {...origin, vx: direction[0] / n * DUEL_SPATIAL_RULES.boltSpeed,
    vy: direction[1] / n * DUEL_SPATIAL_RULES.boltSpeed,
    vz: direction[2] / n * DUEL_SPATIAL_RULES.boltSpeed};
}

// Swept sphere against the HMD-anchored training target; never endpoint-only.
export function duelSpatialCollision(from, to, body, radius = DUEL_SPATIAL_RULES.hitRadius) {
  const d = [to.x - from.x, to.y - from.y, to.z - from.z];
  const n = d.reduce((s, v) => s + v * v, 0);
  const t = n ? clamp(((body.x - from.x) * d[0] + (body.y - from.y) * d[1] +
    (body.z - from.z) * d[2]) / n, 0, 1) : 0;
  return Math.hypot(from.x + t * d[0] - body.x, from.y + t * d[1] - body.y,
    from.z + t * d[2] - body.z) <= radius;
}
export function duelSpatialBoltInBounds(bolt){
  const r=DUEL_SPATIAL_RULES;
  return Number.isFinite(bolt.z)&&Number.isFinite(bolt.y)&&
    Math.abs(bolt.z)<=r.arenaHalfWidth&&bolt.y>=r.floorHeight&&bolt.y<=r.ceilingHeight;
}
