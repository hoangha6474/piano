import { describe, it, expect } from "vitest";
import { evaluate, WaitMatcher } from "../../src/music/evaluation";
import {
  beatSeconds,
  type ScoreNote,
  type PlayedNote,
} from "../../src/music/model";
const note = (
  id: string,
  midi: number,
  beat: number,
  duration = 1,
): ScoreNote => ({ id, midi, beat, duration, hand: "right" });
const played = (midi: number, start: number, end?: number): PlayedNote => ({
  midi,
  start,
  end,
  device: "test",
  velocity: 0.7,
  channel: 0,
});
describe("deterministic evaluation", () => {
  it("matches chords one-to-one and distinguishes missing, extra and wrong pitches", () => {
    const r = evaluate(
      [note("c", 60, 0), note("e", 64, 0), note("g", 67, 0), note("d", 62, 2)],
      [
        played(60, 0, 0.5),
        played(64, 0.02, 0.5),
        played(66, 0.01, 0.5),
        played(80, 2, 2.5),
      ],
      120,
    );
    expect(r.matched).toBe(2);
    expect(r.results.filter((n) => n.type === "wrong")).toHaveLength(1);
    expect(r.results.filter((n) => n.type === "missing")).toHaveLength(1);
    expect(r.results.filter((n) => n.type === "extra")).toHaveLength(1);
  });
  it("identifies timing and duration errors, without trusting repaired Note Off", () => {
    const r = evaluate(
      [note("a", 60, 0), note("b", 62, 2), note("c", 64, 4)],
      [
        played(60, 0.25, 0.75),
        played(62, 1, 2),
        { ...played(64, 2, 3), incomplete: true },
      ],
      120,
    );
    expect(r.results.map((n) => n.type)).toEqual([
      "timing",
      "duration",
      "correct",
    ]);
    expect(r.results[2].durationMs).toBeUndefined();
    expect(r.incomplete).toBe(true);
  });
  it("uses tempo changes instead of treating all beats as fixed seconds", () => {
    expect(
      beatSeconds(8, [
        { beat: 0, bpm: 120 },
        { beat: 4, bpm: 60 },
      ]),
    ).toBe(6);
    const r = evaluate(
      [note("a", 60, 8)],
      [played(60, 6, 7)],
      120,
      undefined,
      false,
      [
        { beat: 0, bpm: 120 },
        { beat: 4, bpm: 60 },
      ],
    );
    expect(r.results[0].type).toBe("correct");
  });
  it("does not penalize timing in wait mode", () => {
    expect(
      evaluate([note("a", 60, 0)], [played(60, 10, 11)], 120, undefined, true)
        .results[0].type,
    ).toBe("correct");
  });
  it("does not double-match a single played note", () => {
    const r = evaluate(
      [note("a", 60, 0), note("b", 60, 0.1)],
      [played(60, 0, 0.5)],
      120,
    );
    expect(r.matched).toBe(1);
    expect(r.results.filter((n) => n.type === "missing")).toHaveLength(1);
  });
});
describe("wait mode", () => {
  it("requires fresh attacks for repeated notes but no mandatory release", () => {
    const m = new WaitMatcher([note("a", 60, 0), note("b", 60, 1)]);
    expect(m.on(60, 0)).toBe("advance");
    expect(m.on(60, 100)).toBe("done");
  });
  it("requires chord attacks in the tolerance window", () => {
    const m = new WaitMatcher([note("a", 60, 0), note("b", 64, 0)], 100);
    expect(m.on(61, 0)).toBe("wrong");
    expect(m.on(60, 0)).toBe("partial");
    expect(m.on(64, 200)).toBe("partial");
    expect(m.on(60, 250)).toBe("done");
  });
});
