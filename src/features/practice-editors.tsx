"use client";
import type { Dispatch, SetStateAction } from "react";
import type { Score } from "@/music/model";
import { Card } from "@/components/ui";
import type { useLearning } from "./store";
import { Plus, Trash2 } from "lucide-react";
import { noteName } from "@/music/model";
import type { Annotation } from "./store";
interface Props {
  data: ReturnType<typeof useLearning.getState>;
  score: Score;
  running: boolean;
  beat: number;
  loop: boolean;
  b: number;
  annotations: Annotation[];
  annotation: string;
  annotationHand: string;
  annotationColor: string;
  showAnnotations: boolean;
  selectedNote: string;
  parts: string[];
  selectBeat: (beat: number) => void;
  setAnnotation: Dispatch<SetStateAction<string>>;
  setAnnotationHand: Dispatch<SetStateAction<string>>;
  setAnnotationColor: Dispatch<SetStateAction<string>>;
  setShowAnnotations: Dispatch<SetStateAction<boolean>>;
  setSelectedNote: Dispatch<SetStateAction<string>>;
}
export function PracticeEditors(props: Props) {
  const {
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
  } = props;
  return (
    <div className="two-column">
      <Card>
        <h3>Ghi chú cho lần luyện tới</h3>
        <p className="muted">Chọn vị trí trên bản nhạc rồi thêm chú thích.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (annotation.trim()) {
              data.addAnnotation({
                id: crypto.randomUUID(),
                scoreId: score.id,
                beat,
                end: loop ? b : undefined,
                text: annotation.trim(),
                color: annotationColor,
                hand: annotationHand,
              });
              setAnnotation("");
            }
          }}
          className="annotation-form"
        >
          <input
            aria-label="Nội dung chú thích"
            value={annotation}
            maxLength={500}
            onChange={(e) => setAnnotation(e.target.value)}
            placeholder="Ví dụ: thả lỏng cổ tay ở ô nhịp này…"
          />
          <select
            aria-label="Tay của chú thích"
            value={annotationHand}
            onChange={(e) => setAnnotationHand(e.target.value)}
          >
            <option value="both">Hai tay</option>
            <option value="left">Tay trái</option>
            <option value="right">Tay phải</option>
          </select>
          <input
            type="color"
            aria-label="Màu chú thích"
            value={annotationColor}
            onChange={(e) => setAnnotationColor(e.target.value)}
          />
          <button className="button secondary small">
            <Plus size={16} />
            Thêm
          </button>
        </form>
        <button
          className="text-button"
          onClick={() =>
            data.addAnnotation({
              id: crypto.randomUUID(),
              scoreId: score.id,
              beat,
              text: "Nốt cần chú ý",
              color: annotationColor,
              hand: annotationHand,
            })
          }
        >
          Đánh dấu nốt tại phách {beat + 1}
        </button>
        <label className="muted">
          <input
            type="checkbox"
            checked={showAnnotations}
            onChange={(e) => setShowAnnotations(e.target.checked)}
          />
          Hiện chú thích
        </label>
        {annotations.map((n) => (
          <div className="annotation-row" key={n.id}>
            <button className="text-button" onClick={() => selectBeat(n.beat)}>
              Phách {n.beat + 1}
            </button>
            <input
              aria-label="Sửa chú thích"
              value={n.text}
              onChange={(e) => data.editAnnotation(n.id, e.target.value)}
            />
            <button
              className="icon-button"
              title="Xóa chú thích"
              onClick={() => data.removeAnnotation(n.id)}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </Card>
      <Card>
        <h3>Thế bấm & phân tay</h3>
        <p className="muted">
          Đề xuất tham khảo. MIDI không xác định ngón thực tế.
        </p>
        <div className="form-row">
          <select
            aria-label="Nốt cần chỉnh số ngón"
            value={selectedNote}
            onChange={(e) => setSelectedNote(e.target.value)}
          >
            {score.notes.map((n) => (
              <option value={n.id} key={n.id}>
                {noteName(n.midi)} · phách {n.beat + 1}
              </option>
            ))}
          </select>
          <select
            aria-label="Số ngón"
            value={
              data.fingers[`${score.id}:${selectedNote}`] ||
              score.notes.find((n) => n.id === selectedNote)?.finger ||
              1
            }
            onChange={(e) =>
              data.setFinger(
                `${score.id}:${selectedNote}`,
                Number(e.target.value),
              )
            }
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </div>
        {parts.map((part) => (
          <label className="part-row" key={part}>
            Bè {part}
            <select
              disabled={running}
              value={
                data.assignments[`${score.id}:${part}`] ||
                score.notes.find((n) => (n.part || n.hand) === part)?.hand
              }
              onChange={(e) =>
                data.assign(
                  `${score.id}:${part}`,
                  e.target.value as "left" | "right",
                )
              }
            >
              <option value="left">Tay trái</option>
              <option value="right">Tay phải</option>
            </select>
          </label>
        ))}
      </Card>
    </div>
  );
}
