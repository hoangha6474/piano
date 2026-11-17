export type Hand = "left" | "right";
export type PracticeHand = Hand | "both";
export interface ScoreNote {
  id: string;
  midi: number;
  beat: number;
  duration: number;
  hand: Hand;
  velocity?: number;
  finger?: number;
  part?: string;
}
export interface Score {
  id: string;
  title: string;
  composer: string;
  level: string;
  bpm: number;
  meter: [number, number];
  notes: ScoreNote[];
  xml?: string;
  source: string;
  license: string;
  imported?: boolean;
  tempos?: { beat: number; bpm: number }[];
}
export interface PlayedNote {
  midi: number;
  start: number;
  end?: number;
  velocity: number;
  channel: number;
  device: string;
  incomplete?: boolean;
}
export const noteName = (midi: number) =>
  `${["Đô", "Đô♯", "Rê", "Rê♯", "Mi", "Fa", "Fa♯", "Sol", "Sol♯", "La", "La♯", "Si"][midi % 12]}${Math.floor(midi / 12) - 1}`;
export const pitchName = (midi: number) =>
  `${["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][midi % 12]}${Math.floor(midi / 12) - 1}`;
export function scoreBeats(score: Score) {
  return Math.max(4, ...score.notes.map((n) => n.beat + n.duration));
}
export function beatSeconds(
  beat: number,
  tempos: { beat: number; bpm: number }[],
  rate = 1,
): number {
  const points = [...tempos].sort((a, b) => a.beat - b.beat);
  let seconds = 0,
    cursor = 0,
    bpm = points[0]?.bpm || 80;
  for (const p of points) {
    if (p.beat > beat) break;
    seconds += ((p.beat - cursor) * 60) / bpm / rate;
    cursor = p.beat;
    bpm = p.bpm;
  }
  return seconds + ((beat - cursor) * 60) / bpm / rate;
}
export function segmentTempos(score: Score, a: number, bpm: number) {
  const map = score.tempos?.length
    ? score.tempos
    : [{ beat: 0, bpm: score.bpm }];
  const active = [...map].reverse().find((t) => t.beat <= a) || {
    beat: 0,
    bpm: score.bpm,
  };
  return [
    { beat: 0, bpm: (active.bpm * bpm) / score.bpm },
    ...map
      .filter((t) => t.beat > a)
      .map((t) => ({ beat: t.beat - a, bpm: (t.bpm * bpm) / score.bpm })),
  ];
}
