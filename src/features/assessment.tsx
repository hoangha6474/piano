"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Card, PageHeading } from "@/components/ui";
import { questions } from "@/music/assessment";
import { useLearning } from "./store";
export function Assessment({ chapter }: { chapter?: string }) {
  const [answers, setAnswers] = useState<Record<number, number>>({}),
    [submitted, setSubmitted] = useState(false);
  const selected = chapter
    ? questions.slice(
        Math.max(0, (Number(chapter) || 1) - 1),
        Math.max(0, (Number(chapter) || 1) - 1) + 3,
      )
    : questions;
  const correct = selected.filter((q, i) => answers[i] === q.correct).length,
    results = useLearning((s) => s.results),
    midiResult = results.find((r) => r.scoreId === "first-notes");
  return (
    <>
      <PageHeading
        eyebrow={chapter ? "KIỂM TRA CUỐI CHƯƠNG" : "KIỂM TRA ĐẦU VÀO"}
        title={
          chapter
            ? "Ôn lại để vững vàng hơn."
            : "Tìm một điểm khởi đầu phù hợp."
        }
        description="Kiến thức và thực hành cùng nhau tạo nên nền tảng. Bài kiểm tra không khóa giáo trình."
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
      >
        {selected.map((q, i) => (
          <Card key={q.prompt}>
            <h3>
              {i + 1}. {q.prompt}
            </h3>
            <div className="answer-grid">
              {q.options.map((o, n) => (
                <label
                  className={`answer-option ${submitted && q.correct === n ? "correct" : ""}`}
                  key={o}
                >
                  <input
                    type="radio"
                    name={`q${i}`}
                    value={n}
                    required
                    disabled={submitted}
                    checked={answers[i] === n}
                    onChange={() => setAnswers((a) => ({ ...a, [i]: n }))}
                  />{" "}
                  {o}
                </label>
              ))}
            </div>
            {submitted && (
              <p className="muted">
                {answers[i] === q.correct ? "Đúng. " : "Cùng ghi nhớ: "}
                {q.explanation}
              </p>
            )}
          </Card>
        ))}
        <button className="button primary" disabled={submitted}>
          <Check size={16} />
          Xem kết quả kiến thức
        </button>
      </form>
      {submitted && (
        <Card>
          <h3>
            {correct}/{selected.length} câu đúng
          </h3>
          <p>
            {correct === selected.length
              ? "Bạn có nền tảng lý thuyết phù hợp để khám phá Elementary. Hãy kiểm tra khả năng thực hành trước khi chọn cấp độ."
              : "Đề xuất bắt đầu hoặc ôn lại Beginner, nhất là những nội dung vừa trả lời chưa đúng."}
          </p>
          <p className="muted">
            Gợi ý tham khảo từ câu trả lời, chưa phải đánh giá trình độ biểu
            diễn tổng thể.
          </p>
          <Link className="button secondary" href="/curriculum">
            Xem giáo trình
            <ArrowRight size={16} />
          </Link>
        </Card>
      )}
      <Card>
        <h3>Phần thực hành trên đàn thật</h3>
        <p>
          Chơi bài “Những nốt nhạc đầu tiên” để kiểm tra cao độ và giữ nhịp. Bạn
          có thể xem chi tiết từng lỗi sau lượt luyện.
        </p>
        {midiResult && (
          <p>
            Lượt gần nhất: {midiResult.evaluation.accuracy}% nốt khớp ·{" "}
            {midiResult.bpm} BPM.
          </p>
        )}
        <Link className="button primary" href="/practice?score=first-notes">
          Kiểm tra bằng MIDI
          <ArrowRight size={16} />
        </Link>
      </Card>
    </>
  );
}
