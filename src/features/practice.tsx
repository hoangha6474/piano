"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  Pause,
  Square,
  Settings2,
  SlidersHorizontal,
  Volume2,
  Usb,
  RotateCcw,
  ChevronLeft,
  Plus,
  Trash2,
  Save,
  Lightbulb,
} from "lucide-react";
import { useLearning } from "./store";
import { useMidi } from "./use-midi";
import { PracticeOptions } from "./practice-options";
import { PracticeEditors } from "./practice-editors";
import { PracticeResults } from "./practice-results";
import { ScoreView } from "@/components/score-view";
import { PageHeading, Card } from "@/components/ui";
import { PianoAudio } from "@/music/audio";
import {
  evaluate,
  WaitMatcher,
  measurementPolicy,
  type Evaluation,
} from "@/music/evaluation";
import {
  beatSeconds,
  segmentTempos,
  noteName,
  scoreBeats,
  type Score,
  type PracticeHand,
  type PlayedNote,
} from "@/music/model";
import type { MidiSignal } from "@/music/midi";
import { suggestFingering } from "@/music/fingering";
interface Run {
  played: PlayedNote[];
  matcher: WaitMatcher;
  expected: Score["notes"];
  sample: boolean;
  wait: boolean;
  a: number;
  b: number;
  bpm: number;
  hand: PracticeHand;
  started: number;
  activeMs: number;
  offset: number;
}
export function Practice({ score: original }: { score: Score }) {
  const data = useLearning(),
    pref = data.preferences[original.id];
  const [bpm, setBpm] = useState(pref?.bpm || original.bpm),
    [hand, setHand] = useState<PracticeHand>(
      (pref?.hand as PracticeHand) || "both",
    ),
    [wait, setWait] = useState(true);
  const [metronome, setMetronome] = useState(false),
    [countIn, setCountIn] = useState(1),
    [subdivision, setSubdivision] = useState(1),
    [meter, setMeter] = useState<[number, number]>(original.meter);
  const [accompaniment, setAccompaniment] = useState(true),
    [volume, setVolume] = useState(0.65),
    [leftVolume, setLeftVolume] = useState(0.7),
    [rightVolume, setRightVolume] = useState(0.7),
    [timbre, setTimbre] = useState<"piano" | "sine">("piano"),
    [click, setClick] = useState<"wood" | "soft">("wood");
  const [a, setA] = useState(data.segments[original.id]?.a || 0),
    [b, setB] = useState(data.segments[original.id]?.b || scoreBeats(original)),
    [loop, setLoop] = useState(false),
    [repeats, setRepeats] = useState(3),
    [round, setRound] = useState(1),
    [ramp, setRamp] = useState(0);
  const [zoom, setZoom] = useState(0.85),
    [names, setNames] = useState(false),
    [fingers, setFingers] = useState(false),
    [colors, setColors] = useState(true),
    [compact, setCompact] = useState(false),
    [autoScroll, setAutoScroll] = useState(false),
    [showAnnotations, setShowAnnotations] = useState(true);
  const [running, setRunning] = useState(false),
    [paused, setPaused] = useState(false),
    [beat, setBeat] = useState(a),
    [count, setCount] = useState<number | null>(null),
    [message, setMessage] = useState("Sẵn sàng khi bạn sẵn sàng."),
    [details, setDetails] = useState(false),
    [result, setResult] = useState<Evaluation | null>(null),
    [annotation, setAnnotation] = useState(""),
    [annotationColor, setAnnotationColor] = useState("#bc9556"),
    [annotationHand, setAnnotationHand] = useState("both");
  const [selectedNote, setSelectedNote] = useState(original.notes[0]?.id || ""),
    [taps, setTaps] = useState<number[]>([]);
  const engine = useRef<PianoAudio | null>(null),
    run = useRef<Run | null>(null),
    beatRef = useRef(a),
    roundRef = useRef(1),
    finishRef = useRef<() => void>(() => {}),
    startRef = useRef<(sample?: boolean, resume?: boolean) => Promise<void>>(
      async () => {},
    );
  const mounted = useRef(false),
    timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const later = (callback: () => void, ms: number) => {
    const id = setTimeout(() => {
      timers.current.delete(id);
      if (mounted.current) callback();
    }, ms);
    timers.current.add(id);
  };
  const score = useMemo(
    () => ({
      ...original,
      xml: original.xml,
      notes: suggestFingering(
        original.notes.map((n) => ({
          ...n,
          hand:
            data.assignments[`${original.id}:${n.part || n.hand}`] || n.hand,
          finger: data.fingers[`${original.id}:${n.id}`] || n.finger,
        })),
      ),
    }),
    [original, data.assignments, data.fingers],
  );
  const secs = useCallback(
    (at: number, tempo = bpm) =>
      beatSeconds(
        at,
        score.tempos?.length ? score.tempos : [{ beat: 0, bpm: score.bpm }],
        tempo / score.bpm,
      ),
    [score, bpm],
  );
  const saveResult = useCallback(() => {
    const r = run.current;
    if (!r || r.sample) return;
    const measured = evaluate(
      r.expected.map((n) => ({ ...n, beat: n.beat - r.a })),
      r.played,
      r.bpm,
      measurementPolicy,
      r.wait,
      segmentTempos(score, r.a, r.bpm),
    );
    setResult(measured);
    useLearning.getState().addResult({
      id: crypto.randomUUID(),
      scoreId: score.id,
      title: score.title,
      at: new Date().toISOString(),
      seconds: Math.round(
        (r.activeMs +
          (r.started ? Math.max(0, performance.now() - r.started) : 0)) /
          1000,
      ),
      hand: r.hand,
      bpm: r.bpm,
      mode: r.wait ? "wait" : "continuous",
      evaluation: measured,
    });
  }, [score]);
  const finish = useCallback(() => {
    const r = run.current;
    if (!r) return;
    engine.current?.stop();
    saveResult();
    run.current = null;
    setRunning(false);
    setPaused(false);
    setCount(null);
    if (!r.sample && loop && roundRef.current < repeats) {
      roundRef.current++;
      setRound(roundRef.current);
      setMessage(`Lượt ${roundRef.current}/${repeats}`);
      later(() => void startRef.current(false), 150);
    } else
      setMessage(
        r.sample
          ? "Đã phát hết bản nhạc mẫu."
          : "Đã lưu lượt luyện trên thiết bị này. Xem chi tiết bên dưới.",
      );
  }, [loop, repeats, saveResult]);
  finishRef.current = finish;
  const midi = useMidi((signal: MidiSignal, completed?: PlayedNote) => {
    const r = run.current,
      e = engine.current;
    if (!r || !e || r.sample || paused || e.counting) return;
    if (signal.type === "on") {
      const audioTime = e.now + (signal.time - performance.now()) / 1000;
      const at = r.wait ? (r.matcher.current?.beat ?? r.b) - r.a : undefined;
      const played: PlayedNote = {
        midi: signal.midi,
        start: r.wait
          ? beatSeconds(at!, segmentTempos(score, r.a, r.bpm))
          : e.elapsedAt(audioTime) + r.offset,
        velocity: signal.velocity,
        device: signal.device,
        channel: signal.channel,
      };
      r.played.push(played);
      if (r.wait) {
        const response = r.matcher.on(signal.midi, signal.time);
        if (response === "wrong")
          setMessage(`Chưa đúng: ${noteName(signal.midi)}. Thử lại nhẹ nhàng.`);
        else if (response === "done") {
          setMessage("Bạn đã đi hết đoạn nhạc!");
          later(() => finishRef.current(), 300);
        } else if (response === "advance") {
          const next = r.matcher.current!.beat;
          beatRef.current = next;
          setBeat(next);
          e.advanceWait(next);
          setMessage("Đúng rồi. Tiếp tục nhé.");
        } else setMessage("Giữ các âm hợp âm gần đồng thời.");
      } else
        setMessage(
          `Đã nhận ${noteName(signal.midi)} · velocity ${Math.round(signal.velocity * 127)}`,
        );
    } else if (signal.type === "off") {
      const pending = r.played.find(
        (n) =>
          n.midi === signal.midi &&
          n.channel === signal.channel &&
          n.device === signal.device &&
          n.end === undefined,
      );
      if (pending) {
        pending.end =
          pending.start +
          (completed ? completed.end! - completed.start : 0) / 1000;
        pending.incomplete = pending.incomplete || completed?.incomplete;
      }
    } else if (signal.type === "reset") {
      for (const n of r.played) if (n.end === undefined) n.incomplete = true;
      if (!midi.connected) {
        setMessage("MIDI bị ngắt. Hãy dừng lượt và kiểm tra kết nối.");
      }
    }
  });
  useEffect(() => {
    mounted.current = true;
    engine.current = new PianoAudio();
    return () => {
      mounted.current = false;
      timers.current.forEach(clearTimeout);
      timers.current.clear();
      engine.current?.dispose();
      run.current = null;
    };
  }, []);
  const start = useCallback(
    async (sample = false, resume = false) => {
      if (!engine.current) return;
      if (resume) sample = run.current?.sample ?? sample;
      if (!sample && !midi.connected) {
        setMessage(
          "Hãy kết nối đàn MIDI trước khi bắt đầu luyện. Bạn có thể nghe bản mẫu ngay.",
        );
        return;
      }
      if (!(a >= 0 && b > a && b <= scoreBeats(score))) {
        setMessage("Chọn A nhỏ hơn B, trong phạm vi bản nhạc.");
        return;
      }
      try {
        const currentBpm = Math.min(240, bpm + (roundRef.current - 1) * ramp);
        const from = resume ? beatRef.current : a;
        const expected = score.notes.filter(
          (n) =>
            n.beat >= a && n.beat < b && (hand === "both" || n.hand === hand),
        );
        if (!sample && !expected.length) {
          setMessage("Đoạn này không có nốt của tay đang chọn.");
          return;
        }
        if (!resume) {
          run.current = {
            played: [],
            matcher: new WaitMatcher(expected),
            expected,
            sample,
            wait,
            a,
            b,
            bpm: currentBpm,
            hand,
            started: performance.now(),
            activeMs: 0,
            offset: 0,
          };
          setResult(null);
        } else if (run.current) {
          run.current.started = performance.now();
          run.current.offset = secs(from, currentBpm) - secs(a, currentBpm);
        }
        await engine.current.start(
          score,
          {
            bpm: currentBpm,
            a: from,
            b,
            hand,
            sample,
            accompaniment,
            metronome: metronome && !wait,
            subdivision,
            meter,
            countIn: resume ? 0 : countIn,
            volume,
            leftVolume,
            rightVolume,
            timbre,
            click,
          },
          !sample && wait,
        );
        engine.current.onPosition = (at, c) => {
          beatRef.current = at;
          setBeat(at);
          setCount(c);
        };
        engine.current.onEnd = () => finishRef.current();
        if (run.current)
          run.current.started =
            performance.now() +
            120 +
            (resume
              ? 0
              : ((((countIn * meter[0] * 4) / meter[1]) * 60) / currentBpm) *
                1000);
        beatRef.current = from;
        setBeat(from);
        setRunning(true);
        setPaused(false);
        setMessage(
          sample
            ? "Đang nghe bản mẫu…"
            : wait
              ? "Lắng nghe Count-in, rồi chơi nhóm nốt đang chờ."
              : "Lắng nghe Count-in, rồi chơi cùng nhịp.",
        );
        data.savePreference(score.id, bpm, hand);
      } catch (e) {
        run.current = null;
        setRunning(false);
        setMessage(
          e instanceof Error ? e.message : "Không khởi động được âm thanh.",
        );
      }
    },
    [
      a,
      b,
      score,
      hand,
      bpm,
      ramp,
      wait,
      accompaniment,
      metronome,
      subdivision,
      meter,
      countIn,
      volume,
      leftVolume,
      rightVolume,
      timbre,
      click,
      midi.connected,
      data,
      secs,
    ],
  );
  startRef.current = start;
  const pause = () => {
    if (paused) {
      void start(false, true);
      return;
    }
    if (run.current) {
      run.current.played.forEach((n) => {
        if (n.end === undefined) n.incomplete = true;
      });
      run.current.activeMs += Math.max(
        0,
        performance.now() - run.current.started,
      );
      run.current.started = 0;
    }
    engine.current?.stop();
    setPaused(true);
    setMessage("Đã tạm dừng.");
  };
  const stop = () => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
    const old = loop;
    setLoop(false);
    if (run.current) {
      const counting = engine.current?.counting;
      engine.current?.stop();
      if (!counting) saveResult();
      run.current = null;
    }
    setRunning(false);
    setPaused(false);
    setCount(null);
    setMessage("Đã kết thúc lượt luyện.");
    if (old) setMessage("Đã dừng vòng lặp và lưu lượt hiện tại.");
  };
  const selectBeat = (at: number) => {
    if (running) return;
    setBeat(at);
    beatRef.current = at;
    setA(at);
  };
  const errorIds = useMemo(
    () =>
      new Set(
        result?.results
          .filter((n) => n.type !== "correct" && n.noteId)
          .map((n) => n.noteId!) || [],
      ),
    [result],
  );
  const annotations = useMemo(
    () => data.annotations.filter((n) => n.scoreId === score.id),
    [data.annotations, score.id],
  );
  const shownAnnotations = useMemo(
    () => (showAnnotations ? annotations : []),
    [showAnnotations, annotations],
  );
  const parts = [...new Set(score.notes.map((n) => n.part || n.hand))];
  return (
    <>
      <PageHeading
        eyebrow="KHÔNG GIAN LUYỆN TẬP"
        title="Từng nốt nhạc. Từng bước tiến."
        description="Dành trọn sự tập trung cho âm nhạc của bạn."
        action={
          <button
            className={`button ${midi.connected ? "connected" : "secondary"}`}
            onClick={midi.connect}
          >
            <Usb size={16} />
            {midi.connected ? "Đàn đã kết nối" : "Kết nối đàn MIDI"}
          </button>
        }
      />
      <Card className="practice-card">
        <div className="practice-title">
          <div className="song-mark">♪</div>
          <div>
            <h2>{score.title}</h2>
            <p>
              {score.composer} <span>·</span> {score.level} <span>·</span>{" "}
              {meter[0]}/{meter[1]}
            </p>
          </div>
          <span className="tag">
            {wait ? "Chờ đúng nốt" : "Chơi theo nhịp"}
          </span>
        </div>
        <div className="practice-toolbar">
          <div className="segmented">
            {(["both", "right", "left"] as const).map((h) => (
              <button
                key={h}
                disabled={running}
                className={hand === h ? "selected" : ""}
                onClick={() => setHand(h)}
              >
                {h === "both"
                  ? "Hai tay"
                  : h === "right"
                    ? "Tay phải"
                    : "Tay trái"}
              </button>
            ))}
          </div>
          <label className="bpm-label">
            Tempo{" "}
            <input
              aria-label="BPM"
              type="number"
              min={20}
              max={240}
              value={bpm}
              disabled={running}
              onChange={(e) =>
                setBpm(
                  Math.max(20, Math.min(240, Number(e.target.value) || 20)),
                )
              }
            />{" "}
            <small>BPM</small>
          </label>
          <button
            className="icon-button"
            title="Khôi phục tempo gốc"
            disabled={running}
            onClick={() => setBpm(score.bpm)}
          >
            <RotateCcw size={16} />
          </button>
          <label className="switch-label">
            <input
              type="checkbox"
              checked={wait}
              disabled={running}
              onChange={(e) => setWait(e.target.checked)}
            />
            Chờ đúng nốt
          </label>
          <button
            className={`icon-button ${details ? "active" : ""}`}
            aria-label="Tùy chọn luyện tập"
            onClick={() => setDetails(!details)}
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>
        <div className="score-header">
          <span>♯ BẢN NHẠC</span>
          <div>
            <label>
              <input
                type="checkbox"
                checked={names}
                onChange={(e) => setNames(e.target.checked)}
              />{" "}
              Tên nốt
            </label>
            <label>
              <input
                type="checkbox"
                checked={fingers}
                onChange={(e) => setFingers(e.target.checked)}
              />{" "}
              Số ngón
            </label>
            <select
              aria-label="Phóng to bản nhạc"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
            >
              <option value={0.65}>75%</option>
              <option value={0.85}>100%</option>
              <option value={1}>125%</option>
              <option value={1.2}>150%</option>
            </select>
          </div>
        </div>
        <div className="score-wrap">
          <ScoreView
            score={score}
            beat={beat}
            zoom={zoom}
            names={names}
            fingers={fingers}
            colors={colors}
            compact={compact}
            autoScroll={autoScroll}
            a={loop ? a : -1}
            b={loop ? b : -1}
            errors={errorIds}
            annotations={shownAnnotations}
            onSelect={selectBeat}
          />
          {count !== null && running && !paused && (
            <div className="count-overlay">
              <span>Chuẩn bị</span>
              <strong>{count}</strong>
              <small>Hít thở và thả lỏng đôi tay</small>
            </div>
          )}
        </div>
        <div className="transport">
          <div className="transport-actions">
            <button
              className="icon-button"
              title="Về nốt trước"
              disabled={!wait || !running || paused}
              onClick={() => {
                run.current?.matcher.previous();
                const at = run.current?.matcher.current?.beat ?? a;
                setBeat(at);
                beatRef.current = at;
                engine.current?.advanceWait(at);
              }}
            >
              <ChevronLeft size={19} />
            </button>
            <button
              className="play-button"
              aria-label={running ? "Tạm dừng hoặc tiếp tục" : "Bắt đầu luyện"}
              onClick={() => {
                if (running) pause();
                else {
                  roundRef.current = 1;
                  setRound(1);
                  void start();
                }
              }}
            >
              {running && !paused ? <Pause size={21} /> : <Play size={21} />}
            </button>
            <button
              className="icon-button"
              title="Dừng và lưu lượt"
              disabled={!running}
              onClick={stop}
            >
              <Square size={17} />
            </button>
          </div>
          <div className="transport-position">
            <span>
              Ô nhịp {Math.floor(beat / ((meter[0] * 4) / meter[1])) + 1}
            </span>
            <div className="progress-track">
              <i
                style={{
                  width: `${Math.min(100, (beat / scoreBeats(score)) * 100)}%`,
                }}
              />
            </div>
            <small>
              {Math.round(beat + 1)} / {scoreBeats(score)} phách{" "}
              {loop ? `· Lượt ${round}/${repeats}` : ""}
            </small>
          </div>
          <button
            className="button secondary small"
            disabled={running}
            onClick={() => void start(true)}
          >
            <Volume2 size={16} />
            Nghe mẫu
          </button>
        </div>
        <div className="feedback" role="status">
          <span className={`status-dot ${midi.connected ? "green" : ""}`} />
          {message}
          <button
            className="text-button"
            onClick={() =>
              setMessage(
                `Gợi ý: ${(run.current?.matcher.current?.notes || score.notes.filter((n) => Math.abs(n.beat - beat) < 0.1)).map((n) => noteName(n.midi)).join(" · ") || "Chọn vị trí bắt đầu trên bản nhạc."}`,
              )
            }
          >
            <Lightbulb size={15} />
            Gợi ý
          </button>
        </div>
      </Card>
      {details && (
        <PracticeOptions
          {...{
            running,
            metronome,
            countIn,
            meter,
            subdivision,
            click,
            timbre,
            accompaniment,
            volume,
            leftVolume,
            rightVolume,
            a,
            b,
            loop,
            repeats,
            ramp,
            bpm,
            taps,
            compact,
            colors,
            autoScroll,
            score,
            data,
            setMessage,
            setMetronome,
            setCountIn,
            setMeter,
            setSubdivision,
            setClick,
            setTimbre,
            setAccompaniment,
            setVolume,
            setLeftVolume,
            setRightVolume,
            setA,
            setB,
            setLoop,
            setRepeats,
            setRamp,
            setBpm,
            setTaps,
            setCompact,
            setColors,
            setAutoScroll,
          }}
        />
      )}
      <PracticeEditors
        {...{
          data,
          score,
          running,
          beat,
          loop,
          b,
          annotations,
          annotation,
          annotationHand,
          annotationColor,
          showAnnotations,
          selectedNote,
          parts,
          selectBeat,
          setAnnotation,
          setAnnotationHand,
          setAnnotationColor,
          setShowAnnotations,
          setSelectedNote,
        }}
      />
      {result && (
        <PracticeResults
          {...{ result, score, setA, setB, setLoop, setMessage }}
        />
      )}
      {midi.devices.length > 1 && (
        <label>
          Thiết bị MIDI
          <select
            value={midi.selected}
            onChange={(e) => midi.select(e.target.value)}
          >
            {midi.devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <p className="footnote">
        {midi.status}
        {midi.pedal ? " · Pedal đang giữ" : ""} · Không thu âm hoặc truy cập
        microphone.
      </p>
    </>
  );
}
