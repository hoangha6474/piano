"use client";
import type { Dispatch, SetStateAction } from "react";
import type { Score } from "@/music/model";
import { Card } from "@/components/ui";
import type { useLearning } from "./store";
import { Settings2, Save } from "lucide-react";
import { scoreBeats } from "@/music/model";
interface Props {
  running: boolean;
  metronome: boolean;
  countIn: number;
  meter: [number, number];
  subdivision: number;
  click: "wood" | "soft";
  timbre: "piano" | "sine";
  accompaniment: boolean;
  volume: number;
  leftVolume: number;
  rightVolume: number;
  a: number;
  b: number;
  loop: boolean;
  repeats: number;
  ramp: number;
  bpm: number;
  taps: number[];
  compact: boolean;
  colors: boolean;
  autoScroll: boolean;
  score: Score;
  data: ReturnType<typeof useLearning.getState>;
  setMessage: Dispatch<SetStateAction<string>>;
  setMetronome: Dispatch<SetStateAction<boolean>>;
  setCountIn: Dispatch<SetStateAction<number>>;
  setMeter: Dispatch<SetStateAction<[number, number]>>;
  setSubdivision: Dispatch<SetStateAction<number>>;
  setClick: Dispatch<SetStateAction<"wood" | "soft">>;
  setTimbre: Dispatch<SetStateAction<"piano" | "sine">>;
  setAccompaniment: Dispatch<SetStateAction<boolean>>;
  setVolume: Dispatch<SetStateAction<number>>;
  setLeftVolume: Dispatch<SetStateAction<number>>;
  setRightVolume: Dispatch<SetStateAction<number>>;
  setA: Dispatch<SetStateAction<number>>;
  setB: Dispatch<SetStateAction<number>>;
  setLoop: Dispatch<SetStateAction<boolean>>;
  setRepeats: Dispatch<SetStateAction<number>>;
  setRamp: Dispatch<SetStateAction<number>>;
  setBpm: Dispatch<SetStateAction<number>>;
  setTaps: Dispatch<SetStateAction<number[]>>;
  setCompact: Dispatch<SetStateAction<boolean>>;
  setColors: Dispatch<SetStateAction<boolean>>;
  setAutoScroll: Dispatch<SetStateAction<boolean>>;
}
export function PracticeOptions(props: Props) {
  const {
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
  } = props;
  return (
    <Card className="options-panel">
      <h3>
        <Settings2 size={18} />
        Thiết lập buổi luyện
      </h3>
      <fieldset disabled={running} className="options-grid">
        <label>
          Metronome
          <input
            type="checkbox"
            checked={metronome}
            onChange={(e) => setMetronome(e.target.checked)}
          />
        </label>
        <label>
          Count-in
          <select
            aria-label="Count-in"
            value={countIn}
            onChange={(e) => setCountIn(Number(e.target.value))}
          >
            <option value={0}>Tắt</option>
            <option value={1}>1 ô nhịp</option>
            <option value={2}>2 ô nhịp</option>
          </select>
        </label>
        <label>
          Số chỉ nhịp
          <select
            value={meter.join("/")}
            onChange={(e) =>
              setMeter(
                e.target.value.split("/").map(Number) as [number, number],
              )
            }
          >
            {["2/4", "3/4", "4/4", "6/8"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Chia nhỏ nhịp
          <select
            value={subdivision}
            onChange={(e) => setSubdivision(Number(e.target.value))}
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={4}>4</option>
          </select>
        </label>
        <label>
          Tiếng click
          <select
            value={click}
            onChange={(e) => setClick(e.target.value as "wood" | "soft")}
          >
            <option value="wood">Gỗ</option>
            <option value="soft">Nhẹ</option>
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
        <label>
          Phần đệm tay còn lại
          <input
            type="checkbox"
            checked={accompaniment}
            onChange={(e) => setAccompaniment(e.target.checked)}
          />
        </label>
        <label>
          Âm lượng chung
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
          />
        </label>
        <label>
          Âm lượng tay trái
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={leftVolume}
            onChange={(e) => setLeftVolume(Number(e.target.value))}
          />
        </label>
        <label>
          Âm lượng tay phải
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={rightVolume}
            onChange={(e) => setRightVolume(Number(e.target.value))}
          />
        </label>
        <label>
          Điểm A (phách, từ 0)
          <input
            type="number"
            min={0}
            max={b - 0.25}
            step={0.25}
            value={a}
            onChange={(e) => setA(Number(e.target.value))}
          />
        </label>
        <label>
          Điểm B (không gồm B)
          <input
            type="number"
            min={a + 0.25}
            max={scoreBeats(score)}
            step={0.25}
            value={b}
            onChange={(e) => setB(Number(e.target.value))}
          />
        </label>
        <label>
          Lặp A–B
          <input
            type="checkbox"
            checked={loop}
            onChange={(e) => setLoop(e.target.checked)}
          />
        </label>
        <label>
          Số lượt
          <input
            type="number"
            min={1}
            max={100}
            value={repeats}
            onChange={(e) =>
              setRepeats(Math.max(1, Math.min(100, Number(e.target.value))))
            }
          />
        </label>
        <label>
          Tăng tempo dần (BPM/lượt)
          <input
            type="number"
            min={0}
            max={20}
            value={ramp}
            onChange={(e) =>
              setRamp(Math.max(0, Math.min(20, Number(e.target.value))))
            }
          />
        </label>
        <label>
          Tốc độ so với gốc
          <input
            type="number"
            min={25}
            max={300}
            value={Math.round((bpm / score.bpm) * 100)}
            onChange={(e) =>
              setBpm(
                Math.max(
                  20,
                  Math.min(
                    240,
                    Math.round((score.bpm * Number(e.target.value)) / 100),
                  ),
                ),
              )
            }
          />
        </label>
      </fieldset>
      <div className="inline-actions">
        <button
          className="button secondary small"
          onClick={() => {
            if (b > a) {
              data.saveSegment(score.id, a, b);
              setMessage("Đã lưu đoạn A–B.");
            }
          }}
        >
          <Save size={15} />
          Lưu A–B
        </button>
        <button
          className="button secondary small"
          disabled={running}
          onClick={() => {
            const now = performance.now(),
              next = [...taps.filter((t) => now - t < 4000), now].slice(-5);
            setTaps(next);
            if (next.length > 1)
              setBpm(
                Math.max(
                  20,
                  Math.min(
                    240,
                    Math.round(
                      60000 / ((next.at(-1)! - next[0]) / (next.length - 1)),
                    ),
                  ),
                ),
              );
          }}
        >
          Tap tempo
        </button>
        <label>
          <input
            type="checkbox"
            checked={compact}
            onChange={(e) => setCompact(e.target.checked)}
          />
          Bố cục gọn
        </label>
        <label>
          <input
            type="checkbox"
            checked={colors}
            onChange={(e) => setColors(e.target.checked)}
          />
          Màu từng tay
        </label>
        <label>
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
          />
          Tự cuộn
        </label>
      </div>
      <p className="muted">
        Metronome và phần đệm dừng theo tiến trình khi chờ đúng nốt. Tăng tốc
        chỉ áp dụng giữa các lượt A–B. Âm mẫu giữ cao độ khi đổi BPM.
      </p>
    </Card>
  );
}
