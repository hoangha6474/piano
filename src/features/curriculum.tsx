"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Clock3, BookOpen } from "lucide-react";
import { lessons, levels } from "@/music/library";
import { useLearning } from "./store";
import { Card, PageHeading } from "@/components/ui";
export function Curriculum() {
  const [level, setLevel] = useState("Beginner");
  return (
    <>
      <PageHeading
        eyebrow="GIÁO TRÌNH PIANO"
        title="Một hành trình, nhiều khám phá."
        description="Chọn cấp độ để xem nội dung giáo trình piano."
      />
      <div className="level-tabs">
        {levels.map((l, i) => (
          <button
            onClick={() => setLevel(l)}
            className={level === l ? "active" : ""}
            key={l}
          >
            <span>0{i + 1}</span>
            {l}
          </button>
        ))}
      </div>
      <div className="curriculum-layout">
        <Card>
          <span className="eyebrow">{level}</span>
          <h3>Chưa có bài tập</h3>
          <p>Hiện chưa có bài tập trong giáo trình ở cấp độ này.</p>
        </Card>
        <Card className="curriculum-aside">
          <BookOpen size={25} />
          <h3>Đi theo nhịp của riêng bạn</h3>
          <p>Chọn cấp độ phù hợp và luyện tập theo nhịp độ của bạn.</p>
          <hr />
          <Link className="text-button" href="/assessment">
            Thử bài kiểm tra đầu vào
            <ArrowRight size={15} />
          </Link>
          <p className="muted">
            Bài nền tảng giúp quan sát độ chính xác. Đề xuất cấp độ và ngưỡng
            đạt đang ở trạng thái thử nghiệm.
          </p>
        </Card>
      </div>
    </>
  );
}
export function Lesson({ id }: { id: string }) {
  const lesson = lessons.find((l) => l.id === id) || lessons[1],
    state = useLearning(),
    [notice, setNotice] = useState("");
  const passed = state.results.some(
    (r) => r.scoreId === lesson.scoreId && r.evaluation.matched > 0,
  );
  useEffect(() => {
    state.resume(lesson.id);
  }, [lesson.id, state.resume]);
  return (
    <>
      <PageHeading
        eyebrow={`${lesson.level.toUpperCase()} / ${lesson.chapter}`}
        title={lesson.title}
        description={lesson.description}
      />
      <div className="lesson-layout">
        <article className="card lesson-article">
          <div className="lesson-meta">
            <span>
              <Clock3 size={15} />
              {lesson.minutes} phút
            </span>
            <span>
              <BookOpen size={15} />
              Kiến thức & thực hành
            </span>
          </div>
          {lesson.body.map((text, i) => (
            <section key={i}>
              <span className="step-label">0{i + 1}</span>
              <p>{text}</p>
            </section>
          ))}
          <div className="hand-guide">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
            <p>
              Cái · Trỏ · Giữa · Áp út · Út
              <br />
              <small>Giữ khớp ngón tự nhiên, không gồng cổ tay.</small>
            </p>
          </div>
          <figure className="lesson-media">
            <video
              controls
              playsInline
              preload="none"
              poster="/lessons/finger-guide.png"
              width={960}
              height={540}
            >
              <source src="/lessons/five-fingers.webm" type="video/webm" />
              <track
                kind="captions"
                src="/lessons/five-fingers.vi.vtt"
                srcLang="vi"
                label="Tiếng Việt"
                default
              />
              Trình duyệt chưa hỗ trợ video WebM.
            </video>
            <figcaption>
              Minh họa gốc: số ngón 1–5. Sơ đồ giúp ghi nhớ số ngón, không thay
              thế hướng dẫn kỹ thuật từ giáo viên.
            </figcaption>
          </figure>
        </article>
        <Card className="lesson-task">
          <span className="eyebrow">ĐẾN LƯỢT BẠN</span>
          <h3>Đưa kiến thức lên phím đàn.</h3>
          <p>{lesson.task}</p>
          <Link
            className="button primary full"
            href={`/practice?score=${lesson.scoreId}`}
            onClick={() => state.resume(lesson.id)}
          >
            Bắt đầu thực hành
            <ArrowRight size={16} />
          </Link>
          <hr />
          <p className="muted">
            Hoàn thành bài sau khi đọc hướng dẫn và có một lượt MIDI nhận được
            nốt của bài. Đây là điều kiện thử nghiệm, không khóa giáo trình.
          </p>
          <button
            className="button secondary full"
            disabled={state.completed.includes(lesson.id)}
            onClick={() => {
              if (passed) {
                state.complete(lesson.id);
                state.resume(
                  lessons[lessons.indexOf(lesson) + 1]?.id || lesson.id,
                );
                setNotice("Đã hoàn thành bài.");
              } else
                setNotice(
                  "Hãy thực hành trên đàn MIDI và lưu ít nhất một lượt có nốt khớp.",
                );
            }}
          >
            <Check size={16} />
            {state.completed.includes(lesson.id)
              ? "Đã hoàn thành"
              : "Đánh dấu hoàn thành"}
          </button>
          <p role="status">{notice}</p>
          <Link
            className="text-button"
            href={`/assessment?chapter=${Number(lesson.chapter.slice(0, 2))}`}
          >
            Kiểm tra cuối chương
            <ArrowRight size={15} />
          </Link>
        </Card>
      </div>
    </>
  );
}
