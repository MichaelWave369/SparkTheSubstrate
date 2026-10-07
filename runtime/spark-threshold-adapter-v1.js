import { createHash } from "node:crypto";

import {
  createMeta,
  createRun,
  observeRun,
  stepRun,
} from "../public/action-engine.js?v=0.17.0";

const DT = 1 / 60;
const DEFAULT_SEED = 0x53504152;
const ACTIONS = Object.freeze(["MOVE", "DASH", "PULSE"]);

function clone(value) {
  return structuredClone(value);
}

function finiteUnit(value, label) {
  if (!Number.isFinite(value) || value < -1 || value > 1)
    throw new TypeError(label + " must be finite and between -1 and 1");
  return value;
}

function normalizeDirection(params = {}) {
  const x = finiteUnit(Number(params.x ?? 0), "x");
  const y = finiteUnit(Number(params.y ?? 0), "y");
  const length = Math.hypot(x, y);
  if (length > 1.000001)
    throw new TypeError("movement vector magnitude must not exceed 1");
  return { x, y };
}

function stableHash(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function assertControllerDescriptor(descriptor) {
  if (!descriptor || typeof descriptor !== "object" || Array.isArray(descriptor))
    throw new TypeError("controller descriptor must be an object");
  if (typeof descriptor.id !== "string" || !descriptor.id.trim())
    throw new TypeError("controller descriptor requires a non-empty id");
  if (typeof descriptor.kind !== "string" || !descriptor.kind.trim())
    throw new TypeError("controller descriptor requires a non-empty kind");
}

function assertTick(tick) {
  if (!Number.isSafeInteger(tick) || tick < 0)
    throw new TypeError("tick must be a non-negative safe integer");
}

function observation(run, meta, tick) {
  return {
    schemaVersion: 1,
    mode: "descent",
    bridgeScope: "threshold",
    tick,
    allowedActions: [...ACTIONS],
    state: observeRun(run, meta),
  };
}

/**
 * Narrow SPARK adapter for the first PixelForge Runtime Bridge proof.
 *
 * It uses the real Descent action engine with a fixed seed and a fresh in-memory
 * campaign state. It does not read or write localStorage, server progress, D1,
 * Sideways, Memory Arcade, Duel, Endless, or any other save boundary.
 */
export function createSparkThresholdAdapterV1({ seed = DEFAULT_SEED } = {}) {
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff)
    throw new TypeError("seed must be a uint32");

  const meta = createMeta();
  const run = createRun(meta, "spark", seed >>> 0);

  let tick = 0;
  let nextEvent = 1;
  let pending = [];
  const controllers = new Map();
  const ledger = [];
  const frames = [];

  function emit(type, controllerId, payload = {}) {
    const event = {
      id: "spark-threshold:" + nextEvent++,
      tick,
      type,
      controllerId,
      payload: clone(payload),
    };
    ledger.push(event);
    return event;
  }

  function reject(controllerId, reason, detail = null) {
    return emit("SPARK_ACTION_REJECTED", controllerId, {
      reason,
      ...(detail ? { detail } : {}),
    });
  }

  function actionInput(controllerId, intent) {
    if (!intent || typeof intent !== "object" || Array.isArray(intent)) {
      reject(controllerId, "MALFORMED_ACTION");
      return null;
    }

    if (intent.actorId !== "spark") {
      reject(controllerId, "UNKNOWN_ACTOR");
      return null;
    }

    if (intent.type === "MOVE") {
      try {
        return {
          type: "MOVE",
          input: normalizeDirection(intent.params),
        };
      } catch (error) {
        reject(
          controllerId,
          "MALFORMED_ACTION",
          error instanceof Error ? error.message : String(error),
        );
        return null;
      }
    }

    if (intent.type === "DASH") {
      if (run.player.dashCooldown > 0) {
        reject(controllerId, "DASH_COOLDOWN");
        return null;
      }
      try {
        const direction = normalizeDirection(intent.params);
        if (Math.hypot(direction.x, direction.y) === 0) {
          reject(controllerId, "DASH_DIRECTION_REQUIRED");
          return null;
        }
        return {
          type: "DASH",
          input: { ...direction, dash: true },
        };
      } catch (error) {
        reject(
          controllerId,
          "MALFORMED_ACTION",
          error instanceof Error ? error.message : String(error),
        );
        return null;
      }
    }

    if (intent.type === "PULSE") {
      if (run.player.powerCooldown > 0) {
        reject(controllerId, "POWER_COOLDOWN");
        return null;
      }
      return {
        type: "PULSE",
        input: { power: true },
      };
    }

    reject(controllerId, "UNSUPPORTED_ACTION", String(intent.type ?? "unknown"));
    return null;
  }

  const adapter = {
    describe() {
      return {
        protocol: "pixelforge-runtime-bridge",
        version: 1,
        gameId: "spark-the-substrate",
        runtimeVersion: "spark-threshold/0.17.0-bridge-v1",
        deterministic: true,
        clockMode: "external",
        advanceSemantics: "simulation-step",
        replayExact: false,
      };
    },

    registerController(descriptor) {
      assertControllerDescriptor(descriptor);

      if (
        controllers.size > 0 &&
        !controllers.has(descriptor.id)
      ) {
        throw new Error(
          "SPARK Threshold Runtime Bridge v1 supports one controller",
        );
      }

      controllers.set(descriptor.id, clone(descriptor));
      return {
        ok: true,
        actor: "spark",
        allowedActions: [...ACTIONS],
      };
    },

    observe(controllerId) {
      if (!controllers.has(controllerId))
        throw new Error("controller is not registered");
      return observation(run, meta, tick);
    },

    submit(controllerId, intent, intentTick = tick) {
      if (!controllers.has(controllerId))
        throw new Error("controller is not registered");
      assertTick(intentTick);

      pending.push({
        controllerId,
        tick: intentTick,
        intent: clone(intent),
      });

      return { queued: true, tick: intentTick };
    },

    advance(roots = []) {
      if (!Array.isArray(roots))
        throw new TypeError("advance roots must be an array");

      pending.push(...clone(roots));
      const eventStart = ledger.length;
      const frameRoots = pending;
      pending = [];

      let accepted = null;

      for (const root of frameRoots) {
        const controllerId = root?.controllerId ?? root?.controller_id;

        if (!controllers.has(controllerId)) {
          reject(controllerId ?? "unknown", "UNREGISTERED_CONTROLLER");
          continue;
        }

        if (root.tick !== tick) {
          reject(controllerId, "WRONG_TICK", {
            expected: tick,
            received: root.tick,
          });
          continue;
        }

        if (accepted) {
          reject(controllerId, "MULTIPLE_ACTIONS_SAME_TICK");
          continue;
        }

        const mapped = actionInput(controllerId, root.intent);
        if (mapped) accepted = { controllerId, ...mapped };
      }

      const before = observation(run, meta, tick).state;
      const beforePlayer = clone(before.player);
      const beforeStats = clone(before.stats);

      try {
        stepRun(run, accepted?.input ?? {}, DT);
      } catch (error) {
        if (accepted) {
          reject(
            accepted.controllerId,
            "ENGINE_REJECTED",
            error instanceof Error ? error.message : String(error),
          );
          accepted = null;
        }
      }

      const after = observation(run, meta, tick + 1).state;
      const afterPlayer = clone(after.player);
      const afterStats = clone(after.stats);

      if (accepted?.type === "MOVE") {
        emit("SPARK_PLAYER_MOVED", accepted.controllerId, {
          room: after.room,
          form: after.form,
          from: { x: beforePlayer.x, y: beforePlayer.y },
          to: { x: afterPlayer.x, y: afterPlayer.y },
        });
      } else if (accepted?.type === "DASH") {
        emit("SPARK_DASH_STARTED", accepted.controllerId, {
          room: after.room,
          form: after.form,
          from: { x: beforePlayer.x, y: beforePlayer.y },
          to: { x: afterPlayer.x, y: afterPlayer.y },
          dashReady: afterPlayer.dashReady,
          dashes:
            (afterStats?.dashes ?? 0) - (beforeStats?.dashes ?? 0),
        });
      } else if (accepted?.type === "PULSE") {
        emit("SPARK_PULSE_USED", accepted.controllerId, {
          room: after.room,
          form: after.form,
          power: after.power?.name ?? "Lumen pulse",
          cooldownRemaining: after.power?.cooldownRemaining ?? 0,
          powers:
            (afterStats?.powers ?? 0) - (beforeStats?.powers ?? 0),
        });
      }

      frames.push({
        tick,
        roots: clone(frameRoots),
        accepted: accepted
          ? {
              controllerId: accepted.controllerId,
              type: accepted.type,
            }
          : null,
        observation: clone(after),
      });

      tick += 1;
      return ledger.slice(eventStart);
    },

    events(since = 0) {
      if (!Number.isSafeInteger(since) || since < 0)
        throw new TypeError("event offset must be a non-negative safe integer");
      return ledger.slice(since);
    },

    snapshot() {
      return {
        schemaVersion: 1,
        scope: "spark-threshold",
        tick,
        seed: seed >>> 0,
        observation: observation(run, meta, tick),
      };
    },

    recording() {
      return {
        schemaVersion: 1,
        scope: "spark-threshold",
        seed: seed >>> 0,
        frames: clone(frames),
        final: observation(run, meta, tick),
      };
    },

    authority() {
      return Object.fromEntries(
        [...controllers.keys()].map((id) => [id, [...ACTIONS]]),
      );
    },

    hash() {
      return stableHash({
        scope: "spark-threshold",
        seed: seed >>> 0,
        tick,
        observation: observation(run, meta, tick),
        events: ledger,
      });
    },
  };

  return adapter;
}

export const SPARK_THRESHOLD_DEFAULT_SEED = DEFAULT_SEED;
export const SPARK_THRESHOLD_ACTIONS = ACTIONS;
