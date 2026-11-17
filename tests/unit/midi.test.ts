import { describe, it, expect } from "vitest";
import { MidiProcessor, type MidiSignal } from "../../src/music/midi";
import type { PlayedNote } from "../../src/music/model";
describe("MIDI input state", () => {
  it("normalizes velocity-zero Note On and retains measured key duration despite pedal", () => {
    const signals: MidiSignal[] = [],
      notes: PlayedNote[] = [];
    const p = new MidiProcessor((s, n) => {
      signals.push(s);
      if (n) notes.push(n);
    });
    p.receive([0x90, 60, 100], 100);
    p.receive([0xb0, 64, 127], 120);
    p.receive([0x90, 60, 0], 600);
    expect(signals.map((s) => s.type)).toEqual(["on", "pedal", "off"]);
    expect(notes[0].end! - notes[0].start).toBe(500);
    expect(notes[0].velocity).toBeCloseTo(100 / 127);
    expect(p.heldCount).toBe(0);
  });
  it("separates channels and devices, and marks a missing Note Off as incomplete on disconnect", () => {
    const notes: PlayedNote[] = [];
    const p = new MidiProcessor((_, n) => {
      if (n) notes.push(n);
    });
    p.receive([0x90, 60, 70], 0, "a");
    p.receive([0x91, 60, 80], 10, "a");
    p.receive([0x90, 60, 90], 20, "b");
    p.receive([0x80, 60, 0], 100, "a");
    expect(p.heldCount).toBe(2);
    p.reset(200, "a");
    expect(p.heldCount).toBe(1);
    expect(notes[1].incomplete).toBe(true);
    expect(notes[1].channel).toBe(1);
  });
  it("pairs overlapping repeated notes FIFO without leaving a stuck key", () => {
    const notes: PlayedNote[] = [];
    const p = new MidiProcessor((_, n) => {
      if (n) notes.push(n);
    });
    p.receive([0x90, 60, 100], 0);
    p.receive([0x90, 60, 100], 50);
    p.receive([0x80, 60, 0], 100);
    p.receive([0x80, 60, 0], 150);
    expect(notes.map((n) => [n.start, n.end])).toEqual([
      [0, 100],
      [50, 150],
    ]);
    expect(p.heldCount).toBe(0);
  });
});
