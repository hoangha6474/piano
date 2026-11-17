import { beatSeconds, type PlayedNote, type ScoreNote } from "./model";
export interface EvaluationPolicy {
  id: string;
  onsetMs: number;
  durationMs: number;
  chordMs: number;
}
// Provisional measurements only. These tolerances are disclosed in the UI.
export const measurementPolicy: EvaluationPolicy = {
  id: "measurement-v1-provisional",
  onsetMs: 180,
  durationMs: 220,
  chordMs: 140,
};
export interface NoteResult {
  noteId?: string;
  midi: number;
  type: "correct" | "wrong" | "missing" | "extra" | "timing" | "duration";
  offsetMs?: number;
  durationMs?: number;
  hand?: string;
  playedMidi?: number;
}
export interface Evaluation {
  policy: string;
  results: NoteResult[];
  accuracy: number;
  expected: number;
  matched: number;
  incomplete: boolean;
  measurements?: {
    onsetMeanAbsMs?: number;
    durationMeanAbsMs?: number;
    timingSpreadMs?: number;
    velocityMean?: number;
    velocityMin?: number;
    velocityMax?: number;
    velocityTargetMeanAbsDelta?: number;
  };
}
export function measuredSkillAccuracy(
  evaluations: Evaluation[],
  skill: "pitch" | "timing" | "duration",
): number | undefined {
  if (skill === "pitch") {
    const expected = evaluations.reduce((sum, e) => sum + e.expected, 0),
      extras = evaluations.reduce(
        (sum, e) => sum + e.results.filter((n) => n.type === "extra").length,
        0,
      ),
      matched = evaluations.reduce((sum, e) => sum + e.matched, 0);
    return expected + extras
      ? Math.round((matched / (expected + extras)) * 100)
      : undefined;
  }
  const values = evaluations
    .flatMap((e) => e.results)
    .filter((r) => r.type !== "wrong")
    .map((r) => (skill === "timing" ? r.offsetMs : r.durationMs))
    .filter((n): n is number => n !== undefined && Number.isFinite(n));
  const tolerance =
    skill === "timing"
      ? measurementPolicy.onsetMs
      : measurementPolicy.durationMs;
  return values.length
    ? Math.round(
        (values.filter((n) => Math.abs(n) <= tolerance).length /
          values.length) *
          100,
      )
    : undefined;
}
export function evaluate(
  expected: ScoreNote[],
  played: PlayedNote[],
  bpm: number,
  policy = measurementPolicy,
  wait = false,
  tempos?: { beat: number; bpm: number }[],
): Evaluation {
  const used = new Set<number>();
  const results: NoteResult[] = [];
  const seconds = (beat: number) =>
    beatSeconds(beat, tempos?.length ? tempos : [{ beat: 0, bpm }]);
  let matched = 0;
  const velocityDeltas: number[] = [];
  for (const note of [...expected].sort((a, b) => a.beat - b.beat)) {
    const at = seconds(note.beat);
    let best = -1,
      delta = Infinity;
    played.forEach((p, i) => {
      const d = Math.abs(p.start - at);
      if (
        !used.has(i) &&
        p.midi === note.midi &&
        (wait || d <= Math.max(0.6, (policy.onsetMs / 1000) * 3)) &&
        d < delta
      ) {
        best = i;
        delta = d;
      }
    });
    if (best < 0) {
      results.push({
        noteId: note.id,
        midi: note.midi,
        type: "missing",
        hand: note.hand,
      });
      continue;
    }
    used.add(best);
    matched++;
    const p = played[best],
      offsetMs = (p.start - at) * 1000;
    if (note.velocity !== undefined)
      velocityDeltas.push(Math.abs(note.velocity - p.velocity));
    const durationMs =
      p.end === undefined || p.incomplete
        ? undefined
        : (p.end - p.start - (seconds(note.beat + note.duration) - at)) * 1000;
    const type =
      !wait && Math.abs(offsetMs) > policy.onsetMs
        ? "timing"
        : !wait &&
            durationMs !== undefined &&
            Math.abs(durationMs) > policy.durationMs
          ? "duration"
          : "correct";
    results.push({
      noteId: note.id,
      midi: note.midi,
      type,
      offsetMs: wait ? undefined : offsetMs,
      durationMs: wait ? undefined : durationMs,
      hand: note.hand,
    });
  }
  // Only pair wrong pitches after all correct-pitch matches, so a chord tone cannot steal another expected note.
  for (const result of results.filter((r) => r.type === "missing")) {
    const expectedNote = expected.find((n) => n.id === result.noteId)!;
    const at = seconds(expectedNote.beat);
    const wrong = played.findIndex(
      (p, i) =>
        !used.has(i) &&
        (wait
          ? Math.abs(p.start - at) < 0.001
          : Math.abs(p.start - at) <= policy.onsetMs / 1000),
    );
    if (wrong >= 0) {
      used.add(wrong);
      result.type = "wrong";
      result.playedMidi = played[wrong].midi;
      result.offsetMs = wait ? undefined : (played[wrong].start - at) * 1000;
    }
  }
  played.forEach((p, i) => {
    if (!used.has(i)) results.push({ midi: p.midi, type: "extra" });
  });
  const average = (values: number[]) =>
    values.length
      ? values.reduce((s, n) => s + n, 0) / values.length
      : undefined;
  const onsets = results
      .filter((r) => r.offsetMs !== undefined && r.type !== "wrong")
      .map((r) => r.offsetMs!),
    durations = results
      .filter((r) => r.durationMs !== undefined)
      .map((r) => r.durationMs!),
    velocities = played.map((p) => p.velocity * 127),
    mean = average(onsets);
  return {
    policy: policy.id,
    results,
    expected: expected.length,
    matched,
    accuracy:
      expected.length || played.length
        ? Math.round((matched / Math.max(expected.length, played.length)) * 100)
        : 0,
    incomplete: played.some((p) => p.incomplete || p.end === undefined),
    measurements: {
      onsetMeanAbsMs: average(onsets.map(Math.abs)),
      durationMeanAbsMs: average(durations.map(Math.abs)),
      timingSpreadMs:
        mean === undefined
          ? undefined
          : Math.sqrt(average(onsets.map((n) => (n - mean) ** 2))!),
      velocityMean: average(velocities),
      velocityMin: velocities.length
        ? velocities.reduce((min, n) => Math.min(min, n), 127)
        : undefined,
      velocityMax: velocities.length
        ? velocities.reduce((max, n) => Math.max(max, n), 0)
        : undefined,
      velocityTargetMeanAbsDelta: average(velocityDeltas),
    },
  };
}
export class WaitMatcher {
  private groups: { beat: number; notes: ScoreNote[] }[];
  private heard = new Map<number, number>();
  index = 0;
  constructor(
    notes: ScoreNote[],
    private chordMs = 140,
  ) {
    const groups = new Map<number, ScoreNote[]>();
    for (const n of notes)
      groups.set(n.beat, [...(groups.get(n.beat) || []), n]);
    this.groups = [...groups]
      .sort((a, b) => a[0] - b[0])
      .map(([beat, notes]) => ({ beat, notes }));
  }
  get current() {
    return this.groups[this.index];
  }
  get done() {
    return this.index >= this.groups.length;
  }
  previous() {
    this.index = Math.max(0, this.index - 1);
    this.heard.clear();
  }
  on(midi: number, timeMs: number): "wrong" | "partial" | "advance" | "done" {
    const current = this.current;
    if (!current) return "done";
    if (!current.notes.some((n) => n.midi === midi)) return "wrong";
    this.heard.set(midi, timeMs);
    for (const [n, t] of this.heard)
      if (timeMs - t > this.chordMs) this.heard.delete(n);
    if (!current.notes.every((n) => this.heard.has(n.midi))) return "partial";
    this.index++;
    this.heard.clear();
    return this.done ? "done" : "advance";
  }
}
