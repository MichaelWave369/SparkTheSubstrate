import assert from "node:assert/strict";
import test from "node:test";

import {
  createSparkThresholdAdapterV1,
  SPARK_THRESHOLD_ACTIONS,
} from "../runtime/spark-threshold-adapter-v1.js";

function register(adapter, id = "phicade-seat-1") {
  return adapter.registerController({
    id,
    kind: "human",
    binding: "phicade-action-bus",
  });
}

function intent(type, params = {}) {
  return {
    type,
    actorId: "spark",
    params,
  };
}

test("Threshold adapter starts from the real SPARK Descent state", () => {
  const adapter = createSparkThresholdAdapterV1();
  const descriptor = adapter.describe();

  assert.equal(descriptor.protocol, "pixelforge-runtime-bridge");
  assert.equal(descriptor.version, 1);
  assert.equal(descriptor.gameId, "spark-the-substrate");
  assert.equal(descriptor.runtimeVersion, "spark-threshold/0.17.0-bridge-v1");
  assert.equal(descriptor.clockMode, "external");
  assert.equal(descriptor.deterministic, true);

  const registration = register(adapter);
  assert.equal(registration.ok, true);
  assert.deepEqual(registration.allowedActions, SPARK_THRESHOLD_ACTIONS);

  const observation = adapter.observe("phicade-seat-1");
  assert.equal(observation.mode, "descent");
  assert.equal(observation.bridgeScope, "threshold");
  assert.equal(observation.tick, 0);
  assert.equal(observation.state.room, "threshold");
  assert.equal(observation.state.form, "spark");
  assert.equal(observation.state.phase, "playing");
  assert.equal(observation.state.player.x, 480);
  assert.equal(observation.state.player.y, 390);
  assert.equal(observation.state.player.hp, 100);
  assert.equal(observation.state.player.maxHp, 100);
});

test("MOVE advances the real action-engine player and emits a semantic event", () => {
  const adapter = createSparkThresholdAdapterV1();
  register(adapter);

  adapter.submit(
    "phicade-seat-1",
    intent("MOVE", { x: 1, y: 0 }),
    0,
  );

  const events = adapter.advance();
  assert.equal(events.length, 1);
  assert.equal(events[0].type, "SPARK_PLAYER_MOVED");
  assert.equal(events[0].payload.room, "threshold");
  assert.equal(events[0].payload.form, "spark");
  assert.equal(events[0].payload.from.x, 480);
  assert.equal(events[0].payload.from.y, 390);
  assert.ok(events[0].payload.to.x > 480);
  assert.equal(events[0].payload.to.y, 390);

  const observation = adapter.observe("phicade-seat-1");
  assert.equal(observation.tick, 1);
  assert.ok(observation.state.player.x > 480);
  assert.equal(observation.state.player.y, 390);
  assert.deepEqual(adapter.events(0), events);
});

test("DASH uses the existing Descent dash path instead of adapter physics", () => {
  const adapter = createSparkThresholdAdapterV1();
  register(adapter);

  adapter.submit(
    "phicade-seat-1",
    intent("DASH", { x: 1, y: 0 }),
    0,
  );

  const events = adapter.advance();
  assert.equal(events.length, 1);
  assert.equal(events[0].type, "SPARK_DASH_STARTED");
  assert.ok(events[0].payload.to.x > events[0].payload.from.x);
  assert.equal(events[0].payload.dashes, 1);
  assert.equal(events[0].payload.dashReady, false);

  const observation = adapter.observe("phicade-seat-1");
  assert.equal(observation.state.stats.dashes, 1);
  assert.equal(observation.state.player.dashReady, false);
});

test("PULSE uses the real Spark vessel power and cooldown", () => {
  const adapter = createSparkThresholdAdapterV1();
  register(adapter);

  adapter.submit("phicade-seat-1", intent("PULSE"), 0);
  const events = adapter.advance();

  assert.equal(events.length, 1);
  assert.equal(events[0].type, "SPARK_PULSE_USED");
  assert.equal(events[0].payload.power, "Lumen pulse");
  assert.equal(events[0].payload.powers, 1);
  assert.ok(events[0].payload.cooldownRemaining > 0);

  const observation = adapter.observe("phicade-seat-1");
  assert.equal(observation.state.stats.powers, 1);
  assert.ok(observation.state.power.cooldownRemaining > 0);
});

test("wrong-tick and malformed actions fail closed without moving the player", () => {
  const adapter = createSparkThresholdAdapterV1();
  register(adapter);

  adapter.submit(
    "phicade-seat-1",
    intent("MOVE", { x: 1, y: 0 }),
    7,
  );

  let events = adapter.advance();
  assert.equal(events.length, 1);
  assert.equal(events[0].type, "SPARK_ACTION_REJECTED");
  assert.equal(events[0].payload.reason, "WRONG_TICK");

  let observation = adapter.observe("phicade-seat-1");
  assert.equal(observation.state.player.x, 480);
  assert.equal(observation.state.player.y, 390);

  adapter.submit(
    "phicade-seat-1",
    intent("MOVE", { x: 2, y: 0 }),
    1,
  );

  events = adapter.advance();
  assert.equal(events.length, 1);
  assert.equal(events[0].type, "SPARK_ACTION_REJECTED");
  assert.equal(events[0].payload.reason, "MALFORMED_ACTION");

  observation = adapter.observe("phicade-seat-1");
  assert.equal(observation.state.player.x, 480);
  assert.equal(observation.state.player.y, 390);
});

test("adapter exposes bounded authority, observation snapshots and changing hashes", () => {
  const adapter = createSparkThresholdAdapterV1({ seed: 1234 });
  register(adapter);

  const beforeHash = adapter.hash();
  const authority = adapter.authority();
  assert.deepEqual(authority["phicade-seat-1"], ["MOVE", "DASH", "PULSE"]);

  const snapshot = adapter.snapshot();
  assert.equal(snapshot.scope, "spark-threshold");
  assert.equal(snapshot.seed, 1234);
  assert.equal(snapshot.observation.state.room, "threshold");

  adapter.submit(
    "phicade-seat-1",
    intent("MOVE", { x: 1, y: 0 }),
    0,
  );
  adapter.advance();

  const afterHash = adapter.hash();
  assert.notEqual(afterHash, beforeHash);

  const recording = adapter.recording();
  assert.equal(recording.scope, "spark-threshold");
  assert.equal(recording.frames.length, 1);
  assert.equal(recording.final.tick, 1);
  assert.equal(recording.frames[0].accepted.type, "MOVE");
});

test("Threshold v1 refuses a second independent controller", () => {
  const adapter = createSparkThresholdAdapterV1();
  register(adapter, "seat-1");

  assert.throws(
    () => register(adapter, "seat-2"),
    /supports one controller/,
  );
});
