import * as Tone from "tone";
import {
  beatSeconds,
  pitchName,
  type Score,
  type ScoreNote,
  type PracticeHand,
} from "./model";
export interface AudioOptions {
  bpm: number;
  a: number;
  b: number;
  hand: PracticeHand;
  sample: boolean;
  accompaniment: boolean;
  metronome: boolean;
  subdivision: number;
  meter: [number, number];
  countIn: number;
  volume: number;
  leftVolume: number;
  rightVolume: number;
  click: "wood" | "soft";
  timbre: "piano" | "sine";
}
export class PianoAudio {
  private synth?: Tone.PolySynth;
  private click?: Tone.Synth;
  private ids: number[] = [];
  private epoch = 0;
  private opts?: AudioOptions;
  private score?: Score;
  private active = false;
  private frame = 0;
  private startBeat = 0;
  private endTimer?: ReturnType<typeof setTimeout>;
  onPosition?: (beat: number, count: number | null) => void;
  onEnd?: () => void;
  get now() {
    return Tone.immediate();
  }
  elapsedAt(time: number) {
    return time - this.epoch;
  }
  async initialize() {
    await Tone.start();
    if (!this.synth)
      this.synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: { attack: 0.005, decay: 0.3, sustain: 0.12, release: 0.35 },
      }).toDestination();
    if (!this.click)
      this.click = new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.001, decay: 0.025, sustain: 0, release: 0.01 },
      }).toDestination();
  }
  async playNotes(
    notes: number[],
    duration = 0.7,
    timbre: "piano" | "sine" = "piano",
  ) {
    await this.initialize();
    this.synth!.set({
      oscillator: { type: timbre === "sine" ? "sine" : "triangle" },
    });
    this.synth!.triggerAttackRelease(
      notes.map(pitchName),
      duration,
      Tone.now(),
      0.55,
    );
  }
  async stimulus(
    events: { notes: number[]; duration: number }[],
    timbre: "piano" | "sine" = "piano",
  ) {
    await this.initialize();
    this.synth!.releaseAll();
    this.synth!.set({
      oscillator: { type: timbre === "sine" ? "sine" : "triangle" },
    });
    let offset = 0;
    const start = Tone.now();
    for (const event of events) {
      this.synth!.triggerAttackRelease(
        event.notes.map(pitchName),
        event.duration * 0.8,
        start + offset,
        0.55,
      );
      offset += event.duration;
    }
    return offset;
  }
  private seconds(beat: number) {
    const score = this.score!,
      opts = this.opts!;
    const tempos = score.tempos?.length
      ? score.tempos
      : [{ beat: 0, bpm: score.bpm }];
    return beatSeconds(beat, tempos, opts.bpm / score.bpm);
  }
  beatAt(audioTime: number) {
    if (!this.opts) return this.startBeat;
    const elapsed = audioTime - this.epoch;
    if (elapsed < 0) return this.opts.a;
    const target = elapsed + this.seconds(this.opts.a);
    let lo = this.opts.a,
      hi = this.opts.b;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (this.seconds(mid) < target) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  }
  async start(score: Score, opts: AudioOptions, wait = false) {
    this.stop();
    await this.initialize();
    this.score = score;
    this.opts = opts;
    this.startBeat = opts.a;
    this.synth!.set({
      oscillator: { type: opts.timbre === "sine" ? "sine" : "triangle" },
    });
    const transport = Tone.getTransport();
    transport.stop();
    transport.cancel();
    transport.position = 0;
    const beatUnit = 4 / opts.meter[1],
      countBeats = opts.countIn * opts.meter[0],
      countSeconds = (countBeats * beatUnit * 60) / opts.bpm;
    this.epoch = Tone.immediate() + 0.12 + countSeconds;
    this.active = true;
    for (let i = 0; i < countBeats; i++)
      this.ids.push(
        transport.schedule(
          (t) =>
            this.click!.triggerAttackRelease(
              opts.click === "wood" ? 1200 : 700,
              0.025,
              t,
              0.35 * opts.volume,
            ),
          (i * beatUnit * 60) / opts.bpm,
        ),
      );
    const offset = countSeconds,
      origin = this.seconds(opts.a);
    if (!wait) {
      for (const n of score.notes.filter(
        (n) => n.beat >= opts.a && n.beat < opts.b,
      )) {
        const shouldPlay =
          (opts.sample && (opts.hand === "both" || n.hand === opts.hand)) ||
          (!opts.sample &&
            opts.accompaniment &&
            opts.hand !== "both" &&
            n.hand !== opts.hand);
        if (shouldPlay)
          this.ids.push(
            transport.schedule(
              (t) =>
                this.playScheduled(
                  n,
                  t,
                  Math.min(
                    this.seconds(n.beat + n.duration) - this.seconds(n.beat),
                    this.seconds(opts.b) - this.seconds(n.beat),
                  ),
                ),
              offset + this.seconds(n.beat) - origin,
            ),
          );
      }
      if (opts.metronome)
        for (
          let beat = opts.a;
          beat < opts.b;
          beat += beatUnit / opts.subdivision
        )
          this.ids.push(
            transport.schedule(
              (t) =>
                this.click!.triggerAttackRelease(
                  opts.click === "wood" ? 1100 : 650,
                  0.02,
                  t,
                  opts.volume * 0.4,
                ),
              offset + this.seconds(beat) - origin,
            ),
          );
      this.ids.push(
        transport.schedule(
          (t) => {
            this.endTimer = setTimeout(
              () => {
                if (this.active) {
                  this.active = false;
                  this.onEnd?.();
                }
              },
              Math.max(0, (t - Tone.immediate()) * 1000),
            );
          },
          offset + this.seconds(opts.b) - origin,
        ),
      );
    }
    transport.start(Tone.immediate() + 0.12);
    const tick = () => {
      if (!this.active) return;
      const remaining = this.epoch - Tone.immediate();
      this.onPosition?.(
        wait ? this.startBeat : this.beatAt(Tone.immediate()),
        opts.countIn > 0 && remaining > 0
          ? Math.ceil(remaining / ((beatUnit * 60) / opts.bpm))
          : null,
      );
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }
  private playScheduled(n: ScoreNote, time: number, duration: number) {
    const opts = this.opts!;
    this.synth!.triggerAttackRelease(
      pitchName(n.midi),
      Math.max(0.04, duration),
      time,
      Math.max(
        0,
        opts.volume *
          (n.hand === "left" ? opts.leftVolume : opts.rightVolume) *
          (n.velocity || 0.5),
      ),
    );
  }
  advanceWait(beat: number) {
    this.startBeat = beat;
    const opts = this.opts!;
    if (opts.accompaniment && opts.hand !== "both")
      for (const n of this.score!.notes.filter(
        (n) => n.hand !== opts.hand && Math.abs(n.beat - beat) < 0.001,
      ))
        this.playScheduled(n, Tone.now(), (n.duration * 60) / opts.bpm);
  }
  get counting() {
    return this.active && Tone.immediate() < this.epoch;
  }
  stop() {
    this.active = false;
    clearTimeout(this.endTimer);
    cancelAnimationFrame(this.frame);
    const t = Tone.getTransport();
    this.ids.forEach((id) => t.clear(id));
    this.ids = [];
    t.stop();
    this.synth?.releaseAll();
  }
  dispose() {
    this.stop();
    this.synth?.dispose();
    this.click?.dispose();
  }
}
