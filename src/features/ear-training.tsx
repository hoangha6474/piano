"use client";
import { useEffect, useRef, useState } from "react";
import {
  Headphones,
  Play,
  ArrowRight,
  Usb,
  Check,
  RotateCcw,
} from "lucide-react";
import { Card, PageHeading } from "@/components/ui";
import {
  earKinds,
  makeQuestion,
  type EarKind,
  type EarQuestion,
} from "@/music/ear";
import { PianoAudio } from "@/music/audio";
import { useMidi } from "./use-midi";
import { useLearning } from "./store";
export function EarTraining() {
  const [kind, setKind] = useState<EarKind>("note"),
    [difficulty, setDifficulty] = useState(1),
    [min, setMin] = useState(60),
    [max, setMax] = useState(84),
    [limit, setLimit] = useState(3),
    [timbre, setTimbre] = useState<"piano" | "sine">("piano"),
    [question, setQuestion] = useState<EarQuestion | null>(null),
    [plays, setPlays] = useState(0),
    [listening, setListening] = useState(false),
    [verdict, setVerdict] = useState<boolean | null>(null),
    [message, setMessage] = useState(""),
    [inputCount, setInputCount] = useState(0);
  const audio = useRef<PianoAudio | null>(null),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    received = useRef<{ n: number; t: number }[]>([]),
    finished = useRef(false);
  const next = () => {
    finished.current = false;
    received.current = [];
    setQuestion(makeQuestion(kind, min, max, difficulty));
    setPlays(0);
    setVerdict(null);
    setMessage("");
    setInputCount(0);
  };
  useEffect(() => {
    audio.current = new PianoAudio();
    return () => {
      audio.current?.dispose();
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  useEffect(() => {
    next();
  }, [kind, min, max, difficulty]);
  const answer = (value: string) => {
    if (!question || finished.current || !plays || listening) return;
    finished.current = true;
    const correct = value === question.answer;
    setVerdict(correct);
    useLearning.getState().addEar(correct, kind);
    setMessage(question.explanation);
  };
  const midi = useMidi((signal) => {
    if (
      signal.type !== "on" ||
      !question ||
      finished.current ||
      !plays ||
      listening
    )
      return;
    received.current.push({ n: signal.midi, t: signal.time });
    setInputCount(received.current.length);
    if (received.current.length >= question.expected.length) {
      const notes = received.current.slice(0, question.expected.length);
      const correct =
        kind === "chord"
          ? notes.every((p) => question.expected.includes(p.n)) &&
            new Set(notes.map((p) => p.n)).size === question.expected.length &&
            notes.at(-1)!.t - notes[0].t < 200
          : kind === "rhythm"
            ? notes
                .slice(1)
                .every(
                  (p, i) =>
                    Math.abs(
                      (p.t - notes[i].t) / 1000 - question.events[i].duration,
                    ) < 0.2,
                )
            : notes.every((p, i) => p.n === question.expected[i]);
      answer(correct ? question.answer : "__wrong__");
    }
  });
  return (
    <>
      <PageHeading
        eyebrow="EAR TRAINING"
        title="Lắng nghe. Cảm nhận. Khám phá."
        description="Rèn đôi tai âm nhạc qua từng âm thanh nhỏ."
        action={
          <button className="button secondary" onClick={midi.connect}>
            <Usb size={16} />
            {midi.connected ? "MIDI đã kết nối" : "Trả lời bằng MIDI"}
          </button>
        }
      />
      <div className="ear-layout">
        <Card className="ear-sidebar">
          <h3>Bạn muốn luyện gì?</h3>
          {earKinds.map((k) => (
            <button
              className={`ear-kind ${kind === k.id ? "active" : ""}`}
              key={k.id}
              disabled={listening}
              onClick={() => setKind(k.id)}
            >
              <Headphones size={17} />
              <span>{k.title}</span>
            </button>
          ))}
          <hr />
          <fieldset disabled={listening} className="stacked-form">
            <label>
              Cấp độ
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
              >
                <option value={1}>Cơ bản</option>
                <option value={2}>Vừa</option>
                <option value={3}>Nâng cao</option>
              </select>
            </label>
            <label>
              Phạm vi thấp (MIDI)
              <input
                type="number"
                min={36}
                max={max - 12}
                value={min}
                onChange={(e) =>
                  setMin(
                    Math.max(36, Math.min(max - 12, Number(e.target.value))),
                  )
                }
              />
            </label>
            <label>
              Phạm vi cao (MIDI)
              <input
                type="number"
                min={min + 12}
                max={96}
                value={max}
                onChange={(e) =>
                  setMax(
                    Math.min(96, Math.max(min + 12, Number(e.target.value))),
                  )
                }
              />
            </label>
            <label>
              Số lần nghe
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
              >
                {[1, 2, 3, 5, 10].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <label>
              Âm sắc
              <select
                value={timbre}
                onChange={(e) => setTimbre(e.target.value as "piano" | "sine")}
              >
                <option value="piano">Phím tổng hợp</option>
                <option value="sine">Sóng sin</option>
              </select>
            </label>
          </fieldset>
        </Card>
        <Card className="ear-stage">
          <span className="tag">
            {earKinds.find((k) => k.id === kind)?.title}
          </span>
          <div className={`listening-orb ${listening ? "listening" : ""}`}>
            <Headphones size={52} />
          </div>
          <h2>
            {listening
              ? "Chỉ cần lắng nghe…"
              : verdict !== null
                ? verdict
                  ? "Bạn nghe rất tốt!"
                  : "Cùng nghe lại và ghi nhớ."
                : "Đôi tai bạn đã sẵn sàng?"}
          </h2>
          <p>{earKinds.find((k) => k.id === kind)?.description}</p>
          <button
            className="button primary"
            disabled={listening || plays >= limit || verdict !== null}
            onClick={async () => {
              if (!question) return;
              try {
                setListening(true);
                const seconds = await audio.current!.stimulus(
                  question.events,
                  timbre,
                );
                setPlays((p) => p + 1);
                timer.current = setTimeout(
                  () => setListening(false),
                  seconds * 1000 + 150,
                );
              } catch {
                setListening(false);
                setMessage(
                  "Không khởi động được âm thanh. Hãy kiểm tra thiết bị phát.",
                );
              }
            }}
          >
            <Play size={17} />
            {plays ? "Nghe lại" : "Nghe câu hỏi"} · {plays}/{limit}
          </button>
          <div className="answer-grid">
            {question?.choices.map((choice) => (
              <button
                key={choice}
                className={`answer-option ${verdict !== null && choice === question.answer ? "correct" : ""}`}
                disabled={!plays || listening || verdict !== null}
                onClick={() => answer(choice)}
              >
                {choice}
              </button>
            ))}
          </div>
          {question && !question.choices.length && (
            <div className="notice">
              Chơi lại chuỗi nốt trên đàn MIDI sau khi nghe. Đã nhận{" "}
              {inputCount}/{question.expected.length} nốt.
              <button
                className="text-button"
                onClick={() => {
                  received.current = [];
                  setInputCount(0);
                }}
              >
                Nhập lại
              </button>
            </div>
          )}
          {message && (
            <div
              className={`notice ${verdict === false ? "error" : ""}`}
              role="status"
            >
              {message}
            </div>
          )}
          <div className="inline-actions">
            <button
              className="button secondary"
              disabled={listening}
              onClick={next}
            >
              {verdict !== null ? <Check size={16} /> : <RotateCcw size={16} />}
              Câu tiếp theo
              <ArrowRight size={16} />
            </button>
            {plays > 0 && verdict === null && (
              <button
                className="text-button"
                disabled={listening}
                onClick={() => answer("__reveal__")}
              >
                Xem đáp án (tính chưa đúng)
              </button>
            )}
          </div>
          <p className="footnote">{midi.status} · Không dùng microphone.</p>
        </Card>
      </div>
    </>
  );
}
