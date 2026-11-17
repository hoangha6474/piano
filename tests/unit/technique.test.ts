import { describe, it, expect } from "vitest";
import { makeScale } from "../../src/music/library";
import { evaluate, measuredSkillAccuracy } from "../../src/music/evaluation";
describe("technique measurements", () => {
  it("does not count missing notes as rhythmically correct or hide simultaneous duration errors", () => {
    const missing = evaluate(
      [{ id: "a", midi: 60, beat: 0, duration: 1, hand: "right" }],
      [],
      120,
    );
    expect(measuredSkillAccuracy([missing], "timing")).toBeUndefined();
    expect(measuredSkillAccuracy([missing], "pitch")).toBe(0);
    const both = evaluate(
      [{ id: "a", midi: 60, beat: 0, duration: 1, hand: "right" }],
      [
        {
          midi: 60,
          start: 0.25,
          end: 1.25,
          velocity: 0.5,
          channel: 0,
          device: "test",
        },
      ],
      120,
    );
    expect(measuredSkillAccuracy([both], "timing")).toBe(0);
    expect(measuredSkillAccuracy([both], "duration")).toBe(0);
  });
  it("gives the conventional one-octave C major finger sequence for each hand", () => {
    expect(
      makeScale(60, false, 1, "right")
        .notes.slice(0, 8)
        .map((n) => n.finger),
    ).toEqual([1, 2, 3, 1, 2, 3, 4, 5]);
    expect(
      makeScale(48, false, 1, "left")
        .notes.slice(0, 8)
        .map((n) => n.finger),
    ).toEqual([5, 4, 3, 2, 1, 3, 2, 1]);
  });
  it("reports measured velocity and onset variation without inventing a weighted score", () => {
    const r = evaluate(
      [
        {
          id: "a",
          midi: 60,
          beat: 0,
          duration: 1,
          hand: "right",
          velocity: 0.7,
        },
        {
          id: "b",
          midi: 62,
          beat: 1,
          duration: 1,
          hand: "right",
          velocity: 0.7,
        },
      ],
      [
        {
          midi: 60,
          start: 0,
          end: 0.5,
          velocity: 0.5,
          channel: 0,
          device: "test",
        },
        {
          midi: 62,
          start: 0.55,
          end: 1.05,
          velocity: 0.7,
          channel: 0,
          device: "test",
        },
      ],
      120,
    );
    expect(r.measurements?.velocityMean).toBeCloseTo(76.2);
    expect(r.measurements?.onsetMeanAbsMs).toBeCloseTo(25);
    expect(r.measurements?.timingSpreadMs).toBeCloseTo(25);
    expect(r.measurements?.velocityTargetMeanAbsDelta).toBeCloseTo(0.1);
  });
});
