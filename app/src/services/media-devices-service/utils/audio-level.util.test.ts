import { describe, expect, it } from "vitest";
import { gateStep, levelOf } from "./audio-level.util";
import { GATE_CLOSED as CLOSED, HOLD_MS, TICK_MS } from "../constants/devices.constants";
import type { GateState } from "../types/devices.types";
import { ANALYSER_SIZE } from "../constants/devices.constants";

/** Runs the gate over a list of levels, one tick each, and says when it was open. */
const run = (levels: number[], line: number) => {
  let state: GateState = CLOSED;
  return levels.map((level) => (state = gateStep(state, level, line, TICK_MS)).open);
};

describe("the voice's noise gate", () => {
  it("stays closed while the sound is under the line", () => {
    expect(run([0.05, 0.1, 0.11], 0.12)).toEqual([false, false, false]);
  });

  it("opens at once when the sound crosses the line", () => {
    expect(run([0.05, 0.3], 0.12)).toEqual([false, true]);
  });

  it("holds 250 ms after the sound drops, so the end of a word isn't chopped, then closes", () => {
    const ticks = HOLD_MS / TICK_MS;
    const open = run([0.3, ...Array<number>(ticks + 1).fill(0)], 0.12);
    expect(open.slice(0, ticks)).toEqual(Array<boolean>(ticks).fill(true));
    expect(open.at(-1)).toBe(false);
  });

  it("starts the hold over when the sound comes back", () => {
    const half = Math.floor(HOLD_MS / TICK_MS / 2);
    const open = run([0.3, ...Array<number>(half).fill(0), 0.3, ...Array<number>(half + 1).fill(0)], 0.12);
    expect(open.every(Boolean)).toBe(true);
  });

  it("never closes with the line at zero", () => {
    expect(run([0, 0, 0], 0)).toEqual([true, true, true]);
  });

  it("measures the level on the meter's scale: silence 0, speech high, never past 1", () => {
    expect(levelOf(new Float32Array(ANALYSER_SIZE))).toBe(0);
    expect(levelOf(new Float32Array(ANALYSER_SIZE).fill(0.1))).toBeCloseTo(0.6);
    expect(levelOf(new Float32Array(ANALYSER_SIZE).fill(0.9))).toBe(1);
  });
});
