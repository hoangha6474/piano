"use client";
import type { Dispatch, SetStateAction } from "react";
import type { Score } from "@/music/model";
import { Card } from "@/components/ui";
import { noteName, scoreBeats } from "@/music/model";
import { measurementPolicy, type Evaluation } from "@/music/evaluation";
interface Props {
  result: Evaluation;
  score: Score;
  setA: Dispatch<SetStateAction<number>>;
  setB: Dispatch<SetStateAction<number>>;
  setLoop: Dispatch<SetStateAction<boolean>>;
  setMessage: Dispatch<SetStateAction<string>>;
}
export function PracticeResults(props: Props) {
  const { result, score, setA, setB, setLoop, setMessage } = props;
  return (
    <Card>
      <h3>Kết quả lượt luyện</h3>
      {result.measurements && (
        <div className="measurement-summary">
          <span>
            Lệch thời điểm trung bình:{" "}
            {result.measurements.onsetMeanAbsMs === undefined
              ? "—"
              : `${Math.round(result.measurements.onsetMeanAbsMs)} ms`}
          </span>
          <span>
            Dao động lệch nhịp:{" "}
            {result.measurements.timingSpreadMs === undefined
              ? "—"
              : `${Math.round(result.measurements.timingSpreadMs)} ms`}
          </span>
          <span>
            Velocity MIDI:{" "}
            {result.measurements.velocityMean === undefined
              ? "—"
              : `${Math.round(result.measurements.velocityMean)} / 127 (trung bình)`}
          </span>
        </div>
      )}
      <p>
        <strong>{result.accuracy}%</strong> nốt khớp · {result.matched}/
        {result.expected} nốt kỳ vọng. Đây là số đo cao độ, chưa phải điểm tổng
        hợp có trọng số.
      </p>
      {result.incomplete && (
        <p className="notice">
          Có nốt thiếu thông tin thả phím; không dùng để kết luận trường độ
          chính xác.
        </p>
      )}
      <p className="muted">
        Dung sai thử nghiệm: thời điểm ±{measurementPolicy.onsetMs} ms, trường
        độ ±{measurementPolicy.durationMs} ms. Chế độ chờ không đánh giá nhịp.
      </p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Nốt</th>
              <th>Kết quả</th>
              <th>Tay</th>
              <th>Thời điểm</th>
              <th>Trường độ</th>
            </tr>
          </thead>
          <tbody>
            {result.results.map((r, i) => (
              <tr key={i}>
                <td>{noteName(r.midi)}</td>
                <td>
                  {
                    {
                      correct: "Đúng",
                      wrong: "Sai nốt",
                      missing: "Thiếu",
                      extra: "Thừa",
                      timing: "Lệch nhịp",
                      duration: "Lệch trường độ",
                    }[r.type]
                  }
                </td>
                <td>
                  {r.hand === "left"
                    ? "Trái"
                    : r.hand === "right"
                      ? "Phải"
                      : "—"}
                </td>
                <td>
                  {r.offsetMs === undefined
                    ? "—"
                    : `${Math.round(r.offsetMs)} ms`}
                </td>
                <td>
                  {r.durationMs === undefined
                    ? "—"
                    : `${Math.round(r.durationMs)} ms`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        className="button secondary small"
        onClick={() => {
          const bad = result.results.find(
            (r) => r.type !== "correct" && r.noteId,
          );
          const n = score.notes.find((n) => n.id === bad?.noteId);
          if (n) {
            setA(Math.floor(n.beat / 4) * 4);
            setB(Math.min(scoreBeats(score), Math.floor(n.beat / 4) * 4 + 4));
            setLoop(true);
            setMessage("Đã chọn ô nhịp có lỗi để luyện A–B.");
          }
        }}
      >
        Luyện lại đoạn có lỗi
      </button>
    </Card>
  );
}
