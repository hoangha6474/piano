"use client";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  Plus,
  Check,
  Trash2,
  Pencil,
  Target,
} from "lucide-react";
import { Card, Empty, PageHeading, SectionTitle } from "@/components/ui";
import { useLearning, type Plan } from "./store";
import { library } from "@/music/library";
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function occurs(plan: Plan, date: string) {
  if (plan.date > date) return false;
  if (plan.date === date) return true;
  if (plan.repeat === "daily") return true;
  return (
    plan.repeat === "weekly" &&
    new Date(plan.date + "T12:00:00").getDay() ===
      new Date(date + "T12:00:00").getDay()
  );
}
export function Schedule() {
  const state = useLearning(),
    [date, setDate] = useState(localDate()),
    [editing, setEditing] = useState<Plan | null>(null),
    [form, setForm] = useState(false),
    [message, setMessage] = useState(""),
    [goalForm, setGoalForm] = useState(false);
  const visible = state.plans
    .filter((p) => occurs(p, date))
    .sort((a, b) => a.time.localeCompare(b.time));
  useEffect(() => {
    const shown = new Set<string>();
    const tick = () => {
      const now = new Date(),
        today = localDate(now);
      for (const p of useLearning.getState().plans) {
        const key = `${p.id}:${today}`;
        if (
          !p.remind ||
          !occurs(p, today) ||
          p.doneDates.includes(today) ||
          shown.has(key)
        )
          continue;
        const at = new Date(`${today}T${p.time}`);
        if (
          now.getTime() >= at.getTime() &&
          now.getTime() - at.getTime() < 60000
        ) {
          shown.add(key);
          setMessage(`Đến giờ luyện: ${p.title}`);
          if ("Notification" in window && Notification.permission === "granted")
            new Notification("Đến giờ chơi Piano", { body: p.title });
        }
      }
    };
    const interval = setInterval(tick, 15000);
    tick();
    return () => clearInterval(interval);
  }, []);
  return (
    <>
      <PageHeading
        eyebrow="LỊCH & MỤC TIÊU"
        title="Một cuộc hẹn với chính mình."
        description="Biến những phút luyện tập nhỏ thành một thói quen có ý nghĩa."
        action={
          <button
            className="button primary"
            onClick={() => {
              setEditing(null);
              setForm(true);
            }}
          >
            <Plus size={16} />
            Lên lịch luyện
          </button>
        }
      />
      {message && (
        <div className="notice" role="status">
          {message}
        </div>
      )}
      <Card>
        <div className="calendar-toolbar">
          <CalendarDays size={21} />
          <input
            aria-label="Ngày xem lịch"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <span className="muted">
            Múi giờ: {Intl.DateTimeFormat().resolvedOptions().timeZone}
          </span>
        </div>
        {visible.length ? (
          visible.map((p) => (
            <div key={p.id} className="schedule-row">
              <span className="schedule-hour">{p.time}</span>
              <div>
                <h3>{p.title}</h3>
                <p>
                  {p.minutes} phút ·{" "}
                  {p.repeat === "daily"
                    ? "Mỗi ngày"
                    : p.repeat === "weekly"
                      ? "Mỗi tuần"
                      : "Một buổi"}{" "}
                  · {p.remind ? "Có nhắc khi mở website" : "Không nhắc"}
                </p>
              </div>
              <button
                className={`button small ${p.doneDates.includes(date) ? "primary" : "secondary"}`}
                onClick={() => state.togglePlan(p.id, date)}
              >
                <Check size={15} />
                {p.doneDates.includes(date) ? "Đã hoàn thành" : "Hoàn thành"}
              </button>
              <button
                className="icon-button"
                title="Sửa lịch"
                onClick={() => {
                  setEditing(p);
                  setForm(true);
                }}
              >
                <Pencil size={16} />
              </button>
              <button
                className="icon-button"
                title="Xóa lịch"
                onClick={() => state.removePlan(p.id)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        ) : (
          <Empty
            title="Một ngày đang chờ tiếng đàn"
            description="Tạo buổi luyện 15–30 phút và chọn nội dung bạn muốn tập."
          />
        )}
      </Card>
      {form && (
        <Card>
          <h3>{editing ? "Chỉnh sửa lịch luyện" : "Buổi luyện mới"}</h3>
          <form
            key={editing?.id || "new"}
            className="form-grid"
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const remind = fd.get("remind") === "on";
              if (
                remind &&
                "Notification" in window &&
                Notification.permission === "default"
              )
                await Notification.requestPermission();
              state.savePlan({
                id: editing?.id || crypto.randomUUID(),
                title: String(fd.get("title")).trim(),
                date: String(fd.get("date")),
                time: String(fd.get("time")),
                repeat: fd.get("repeat") as Plan["repeat"],
                minutes: Number(fd.get("minutes")),
                scoreId: String(fd.get("scoreId")),
                doneDates: editing?.doneDates || [],
                remind,
              });
              setForm(false);
              setMessage(
                "Đã lưu lịch trên thiết bị. Nhắc giờ hoạt động khi trang đang mở; chưa cấu hình Web Push nền.",
              );
            }}
          >
            <label>
              Nội dung
              <input
                name="title"
                required
                maxLength={100}
                defaultValue={editing?.title}
                placeholder="15 phút cùng gam Đô trưởng"
              />
            </label>
            <label>
              Ngày bắt đầu
              <input
                name="date"
                type="date"
                required
                defaultValue={editing?.date || date}
              />
            </label>
            <label>
              Giờ
              <input
                name="time"
                type="time"
                required
                defaultValue={editing?.time || "19:00"}
              />
            </label>
            <label>
              Thời lượng (phút)
              <input
                name="minutes"
                type="number"
                min={1}
                max={300}
                required
                defaultValue={editing?.minutes || 15}
              />
            </label>
            <label>
              Lặp lại
              <select name="repeat" defaultValue={editing?.repeat || "none"}>
                <option value="none">Không lặp</option>
                <option value="daily">Hàng ngày</option>
                <option value="weekly">Hàng tuần</option>
              </select>
            </label>
            <label>
              Bản nhạc
              <select
                name="scoreId"
                defaultValue={editing?.scoreId || library[0].id}
              >
                {[...library, ...state.scores].map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="checkbox-label">
              <input
                name="remind"
                type="checkbox"
                defaultChecked={editing?.remind}
              />
              Nhắc khi trang đang mở
            </label>
            <div className="inline-actions">
              <button className="button primary">Lưu lịch</button>
              <button
                type="button"
                className="button secondary"
                onClick={() => setForm(false)}
              >
                Hủy
              </button>
            </div>
          </form>
        </Card>
      )}
      <SectionTitle
        title="Mục tiêu của bạn"
        extra={
          <button
            className="text-button"
            onClick={() => setGoalForm(!goalForm)}
          >
            <Plus size={15} />
            Thêm mục tiêu
          </button>
        }
      />
      {goalForm && (
        <Card>
          <form
            className="form-grid"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              state.addGoal({
                id: crypto.randomUUID(),
                title: String(fd.get("title")),
                kind: fd.get("kind") as
                  "minutes" | "accuracy" | "lessons" | "skill",
                target: Number(fd.get("target")),
              });
              setGoalForm(false);
            }}
          >
            <label>
              Tên mục tiêu
              <input name="title" required maxLength={100} />
            </label>
            <label>
              Loại
              <select name="kind">
                <option value="minutes">Tổng phút luyện</option>
                <option value="lessons">Bài hoàn thành</option>
                <option value="accuracy">Độ chính xác nốt (%)</option>
                <option value="skill">Câu luyện tai đúng</option>
              </select>
            </label>
            <label>
              Giá trị đích
              <input name="target" type="number" required min={1} max={10000} />
            </label>
            <button className="button primary">Lưu mục tiêu</button>
          </form>
        </Card>
      )}
      <div className="goal-grid">
        {state.goals.map((g) => {
          const actual =
            g.kind === "minutes"
              ? Math.floor(
                  state.results.reduce((s, r) => s + r.seconds, 0) / 60,
                )
              : g.kind === "lessons"
                ? state.completed.length
                : g.kind === "skill"
                  ? state.ear.filter((e) => e.correct).length
                  : state.results[0]?.evaluation.accuracy || 0;
          return (
            <Card key={g.id}>
              <div className="stat-top">
                <Target size={20} />
                <button
                  className="icon-button"
                  title="Xóa mục tiêu"
                  onClick={() => state.removeGoal(g.id)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <h3>{g.title}</h3>
              <p>
                {actual} / {g.target}
              </p>
              <div className="progress-track">
                <i
                  style={{
                    width: `${Math.min(100, (actual / g.target) * 100)}%`,
                  }}
                />
              </div>
            </Card>
          );
        })}
      </div>
      {!state.goals.length && (
        <p className="muted">
          Chọn một mục tiêu nhỏ, rõ ràng: thời gian luyện, bài hoàn thành, cao
          độ hoặc luyện tai.
        </p>
      )}
      <SectionTitle title="Đối chiếu ngày đang xem" />
      <Card>
        <p>
          Kế hoạch: {visible.reduce((s, p) => s + p.minutes, 0)} phút · Đã
          luyện:{" "}
          {Math.floor(
            state.results
              .filter((r) => localDate(new Date(r.at)) === date)
              .reduce((s, r) => s + r.seconds, 0) / 60,
          )}{" "}
          phút · Hoàn thành{" "}
          {visible.filter((p) => p.doneDates.includes(date)).length}/
          {visible.length} buổi.
        </p>
      </Card>
    </>
  );
}
