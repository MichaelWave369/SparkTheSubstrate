#!/usr/bin/env node
import assert from "node:assert/strict";

import { createSparkThresholdAdapterV1 } from "../runtime/spark-threshold-adapter-v1.js";

const adapter = createSparkThresholdAdapterV1();
const controllerId = "local-qualification";

adapter.registerController({
  id: controllerId,
  kind: "human",
  binding: "local-check",
});

const initial = adapter.observe(controllerId);
assert.equal(initial.state.room, "threshold");
assert.equal(initial.state.form, "spark");
assert.equal(initial.state.player.x, 480);
assert.equal(initial.state.player.y, 390);

adapter.submit(
  controllerId,
  {
    type: "MOVE",
    actorId: "spark",
    params: { x: 1, y: 0 },
  },
  0,
);

const moved = adapter.advance();
assert.equal(moved.length, 1);
assert.equal(moved[0].type, "SPARK_PLAYER_MOVED");

const afterMove = adapter.observe(controllerId);
assert.ok(afterMove.state.player.x > initial.state.player.x);

adapter.submit(
  controllerId,
  {
    type: "DASH",
    actorId: "spark",
    params: { x: 1, y: 0 },
  },
  1,
);

const dashed = adapter.advance();
assert.equal(dashed.length, 1);
assert.equal(dashed[0].type, "SPARK_DASH_STARTED");

const afterDash = adapter.observe(controllerId);
assert.equal(afterDash.state.stats.dashes, 1);
assert.equal(afterDash.state.player.dashReady, false);

adapter.submit(
  controllerId,
  {
    type: "PULSE",
    actorId: "spark",
    params: {},
  },
  2,
);

const pulsed = adapter.advance();
assert.equal(pulsed.length, 1);
assert.equal(pulsed[0].type, "SPARK_PULSE_USED");

const final = adapter.observe(controllerId);
assert.equal(final.state.stats.powers, 1);
assert.ok(final.state.power.cooldownRemaining > 0);

const hash = adapter.hash();
assert.match(hash, /^[a-f0-9]{64}$/);

console.log("SPARK Threshold Runtime Bridge qualification PASS");
console.log("room:", final.state.room);
console.log("form:", final.state.form);
console.log("tick:", final.tick);
console.log("player:", final.state.player.x, final.state.player.y);
console.log("hash:", hash);
