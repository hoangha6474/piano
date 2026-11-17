import type { ScoreNote } from "./model";
/** Deterministic reference suggestions, never a measurement of physical fingers. */
export function suggestFingering(notes: ScoreNote[]): ScoreNote[] {
  const assigned = new Map<string, number>();
  for (const hand of ["left", "right"] as const) {
    const sequence = notes
      .filter((n) => n.hand === hand)
      .sort((a, b) => a.beat - b.beat || a.midi - b.midi);
    let previous: ScoreNote | undefined,
      previousFinger = hand === "right" ? 1 : 5;
    for (const note of sequence) {
      if (note.finger) {
        assigned.set(note.id, note.finger);
        previous = note;
        previousFinger = note.finger;
        continue;
      }
      let finger = hand === "right" ? 1 : 5;
      if (previous) {
        const delta = note.midi - previous.midi,
          dir = hand === "right" ? 1 : -1;
        if (delta === 0) finger = previousFinger;
        else {
          finger =
            previousFinger +
            Math.sign(delta) * dir * (Math.abs(delta) > 4 ? 2 : 1);
          if (finger > 5) finger = 1;
          if (finger < 1) finger = 5;
        }
        if (note.beat === previous.beat) {
          finger = previousFinger + dir;
          if (finger < 1 || finger > 5) finger = hand === "right" ? 5 : 1;
        }
      }
      assigned.set(note.id, finger);
      previous = note;
      previousFinger = finger;
    }
  }
  return notes.map((n) => ({ ...n, finger: assigned.get(n.id) || n.finger }));
}
