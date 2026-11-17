"use client";
import Link from "next/link";
import { Clock3, BookOpen, Target, ArrowUpRight } from "lucide-react";
import { Card, Empty, PageHeading, SectionTitle } from "@/components/ui";
import { useLearning } from "./store";
import { noteName } from "@/music/model";
import { measuredSkillAccuracy } from "@/music/evaluation";
export function Progress() {
  const state = useLearning(),
    seconds = state.results.reduce((s, r) => s + r.seconds, 0),
    errors = state.results
      .flatMap((r) => r.evaluation.results)
      .filter((r) => r.type !== "correct"),
    categories = [...new Set(errors.map((e) => e.type))];
  return (
    <>
      <PageHeading
        eyebrow="TIẾN ĐỘ HỌC TẬP"
        title="Nhìn lại để tiến xa hơn."
        description="Những kết quả thực tế từ các lượt luyện đã lưu trên thiết bị này."
      />
      <div className="stats-grid">
        {[
          {
            icon: Clock3,
            label: "Tổng thời gian",
            value: `${Math.floor(seconds / 60)} phút`,
          },
          {
            icon: BookOpen,
            label: "Bài đã hoàn thành",
            value: state.completed.length,
          },
          { icon: Target, label: "Lượt luyện", value: state.results.length },
          {
            icon: Target,
            label: "Bản nhạc thành thạo",
            value: state.mastered.length,
          },
        ].map((m) => (
          <Card className="stat-card" key={m.label}>
            <div className="stat-top">
              {m.label}
              <m.icon size={17} />
            </div>
            <div className="stat-value">{m.value}</div>
          </Card>
        ))}
      </div>
      <div className="two-column">
        <Card>
          <h3>Độ chính xác theo tay</h3>
          {["left", "right", "both"].map((hand) => {
            const rows = state.results.filter((r) => r.hand === hand);
            return (
              <div className="metric-row" key={hand}>
                <span>
                  {hand === "left"
                    ? "Tay trái"
                    : hand === "right"
                      ? "Tay phải"
                      : "Hai tay"}
                </span>
                <strong>
                  {rows.length
                    ? `${Math.round(rows.reduce((s, r) => s + r.evaluation.accuracy, 0) / rows.length)}%`
                    : "Chưa có dữ liệu"}
                </strong>
              </div>
            );
          })}
          <p className="muted">
            Chỉ số cao độ theo chế độ tay đã luyện; chưa phải điểm kỹ năng tổng
            hợp.
          </p>
        </Card>
        <Card>
          <h3>Lỗi thường gặp</h3>
          {categories.length ? (
            categories.map((c) => (
              <div className="metric-row" key={c}>
                <span>
                  {
                    {
                      correct: "Đúng",
                      missing: "Thiếu nốt",
                      extra: "Thừa nốt",
                      timing: "Lệch nhịp",
                      duration: "Lệch trường độ",
                      wrong: "Sai nốt",
                    }[c]
                  }
                </span>
                <strong>{errors.filter((e) => e.type === c).length}</strong>
              </div>
            ))
          ) : (
            <p className="muted">Lỗi từ các lượt luyện sẽ xuất hiện ở đây.</p>
          )}
          <p className="muted">
            Luyện chậm đoạn có lỗi. Dùng chế độ chờ để tách cao độ khỏi yêu cầu
            thời gian.
          </p>
        </Card>
      </div>

      <SectionTitle title="Độ chính xác theo kỹ năng" />
      <Card>
        {[
          { label: "Cao độ", skill: "pitch" as const },
          { label: "Thời điểm", skill: "timing" as const },
          { label: "Trường độ", skill: "duration" as const },
        ].map((skill) => {
          const attempts =
            skill.label === "Cao độ"
              ? state.results
              : state.results.filter((r) => r.mode !== "wait");
          const accuracy = measuredSkillAccuracy(
            attempts.map((r) => r.evaluation),
            skill.skill,
          );
          return (
            <div className="metric-row" key={skill.label}>
              <span>{skill.label}</span>
              <strong>
                {accuracy !== undefined ? `${accuracy}%` : "Chưa có dữ liệu"}
              </strong>
            </div>
          );
        })}
        <p className="muted">
          Số đo thử nghiệm theo dung sai hiện tại. Chỉ tính thời điểm và trường
          độ trên các nốt khớp có số đo hợp lệ ở chế độ chơi liên tục; nốt thiếu
          không được tính là đúng nhịp.
        </p>
      </Card>
      <Card>
        <div className="metric-row">
          <span>Số câu luyện tai đã trả lời</span>
          <strong>{state.ear.length}</strong>
        </div>
        <div className="metric-row">
          <span>Đáp án chính xác</span>
          <strong>
            {state.ear.length
              ? `${Math.round((state.ear.filter((e) => e.correct).length / state.ear.length) * 100)}%`
              : "—"}
          </strong>
        </div>
      </Card>
      <SectionTitle title="Lịch sử luyện tập" />
      {state.results.length ? (
        <Card className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Bản nhạc</th>
                <th>Thời gian</th>
                <th>Chế độ</th>
                <th>Nốt khớp</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {state.results.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.at).toLocaleString("vi-VN")}</td>
                  <td>{r.title}</td>
                  <td>
                    {Math.floor(r.seconds / 60)}p {r.seconds % 60}s
                  </td>
                  <td>
                    {r.mode === "wait" ? "Chờ nốt" : "Theo nhịp"} · {r.bpm} BPM
                  </td>
                  <td>{r.evaluation.accuracy}%</td>
                  <td>
                    <Link
                      href={`/practice?score=${r.scoreId}`}
                      className="icon-button"
                      aria-label={`Luyện lại ${r.title}`}
                    >
                      <ArrowUpRight size={17} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <Empty
          title="Mỗi lượt luyện đều có ý nghĩa"
          description="Kết nối đàn MIDI và hoàn thành lượt đầu tiên để bắt đầu lưu tiến độ."
          action={
            <Link className="button primary" href="/practice">
              Bắt đầu luyện
            </Link>
          }
        />
      )}
      <SectionTitle title="Chi tiết lượt gần nhất" />
      {state.results[0] && (
        <Card>
          <h3>{state.results[0].title}</h3>
          {state.results[0].evaluation.results
            .filter((r) => r.type !== "correct")
            .slice(0, 20)
            .map((r, i) => (
              <div className="metric-row" key={i}>
                <span>
                  {noteName(r.midi)} ·{" "}
                  {r.hand === "left"
                    ? "Tay trái"
                    : r.hand === "right"
                      ? "Tay phải"
                      : "Nốt thừa"}
                </span>
                <span>
                  {r.type === "timing"
                    ? `Lệch ${Math.round(r.offsetMs || 0)} ms`
                    : r.type === "duration"
                      ? "Trường độ cần luyện"
                      : r.type === "missing"
                        ? "Thiếu nốt"
                        : "Thừa nốt"}
                </span>
              </div>
            ))}
        </Card>
      )}
    </>
  );
}
