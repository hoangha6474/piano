"use client";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Clock3,
  BookOpen,
  Target,
  Music2,
  Headphones,
  CalendarDays,
  Play,
  Check,
} from "lucide-react";
import { Card, PageHeading, SectionTitle } from "@/components/ui";
import { useLearning } from "./store";
import { lessons, library } from "@/music/library";
export function Dashboard() {
  const state = useLearning(),
    minutes = Math.floor(state.results.reduce((s, r) => s + r.seconds, 0) / 60),
    last = lessons.find((l) => l.id === state.lastLesson) || lessons[1];
  const accuracy = state.results.length
    ? Math.round(
        state.results.reduce((s, r) => s + r.evaluation.accuracy, 0) /
          state.results.length,
      )
    : null;
  const next =
    lessons.find((l) => !state.completed.includes(l.id)) || lessons[0];
  const today = new Date().toLocaleDateString("sv-SE"),
    plans = state.plans.filter(
      (p) =>
        p.date === today ||
        (p.repeat === "daily" && p.date <= today) ||
        (p.repeat === "weekly" &&
          p.date <= today &&
          new Date(p.date + "T12:00:00").getDay() === new Date().getDay()),
    );
  return (
    <>
      <PageHeading
        eyebrow="MỖI NGÀY, MỘT CHÚT TIẾN BỘ"
        title="Chào bạn, cùng chơi Piano nhé."
        description="Một khoảng lặng cho bạn. Một bước tiến cho âm nhạc."
        action={
          <span className="date-label">
            <CalendarDays size={16} />
            {state.ready
              ? new Intl.DateTimeFormat("vi-VN", {
                  day: "numeric",
                  month: "long",
                }).format(new Date())
              : "Hôm nay"}
          </span>
        }
      />
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-kicker">
            <span />
            HÀNH TRÌNH ÂM NHẠC CỦA BẠN
          </span>
          <h2>
            Âm nhạc bắt đầu
            <br />
            từ đôi tay bạn.
          </h2>
          <p>
            Không cần vội vàng. Chỉ cần ngồi xuống,
            <br className="desktop-break" /> thả lỏng và chơi những nốt đầu
            tiên.
          </p>
          <Link className="button cream" href={`/lessons?id=${last.id}`}>
            Tiếp tục học
            <ArrowRight size={17} />
          </Link>
          <span className="hero-caption">
            {last.title} · {last.minutes} phút
          </span>
        </div>
        <div className="piano-art" aria-hidden="true">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <span className="art-note note-one">♪</span>
          <span className="art-note note-two">♩</span>
          <div className="piano-lid" />
          <div className="piano-body">
            <div className="piano-brand">PIANO LEARNING</div>
            <div className="piano-keys" />
          </div>
          <div className="piano-leg leg-one" />
          <div className="piano-leg leg-two" />
          <div className="piano-shadow" />
        </div>
        <div className="hero-number">01 / YOUR OWN TEMPO</div>
      </section>
      <div className="stats-grid">
        {[
          {
            icon: Clock3,
            value: minutes,
            suffix: "phút",
            label: "Thời gian luyện tập",
          },
          {
            icon: BookOpen,
            value: state.completed.length,
            suffix: `/ ${lessons.length}`,
            label: "Bài học hoàn thành",
          },
          {
            icon: Target,
            value: accuracy === null ? "—" : accuracy,
            suffix: accuracy === null ? "" : "%",
            label: "Độ chính xác nốt",
          },
          {
            icon: Music2,
            value: state.results.length,
            suffix: "lượt",
            label: "Lượt luyện đã lưu",
          },
        ].map((s) => (
          <Card className="stat-card" key={s.label}>
            <div className="stat-top">
              <span>{s.label}</span>
              <s.icon size={17} />
            </div>
            <div className="stat-value">
              {s.value}
              <small>{s.suffix}</small>
            </div>
          </Card>
        ))}
      </div>
      <div className="dashboard-columns">
        <div>
          <SectionTitle
            title="Lộ trình của bạn"
            extra={
              <Link href="/curriculum" className="text-button">
                Xem giáo trình
                <ArrowUpRight size={15} />
              </Link>
            }
          />
          <Card className="learning-card">
            <div className="learning-card-top">
              <span className="tag">{next.level}</span>
              <span className="muted small-text">{next.chapter}</span>
            </div>
            <h3>{next.title}</h3>
            <p>{next.description}</p>
            <div className="lesson-progress">
              <div className="progress-track">
                <i
                  style={{
                    width: `${(state.completed.length / lessons.length) * 100}%`,
                  }}
                />
              </div>
              <small>
                {state.completed.length} / {lessons.length} bài đã hoàn thành
              </small>
            </div>
            <div className="learning-card-bottom">
              <span>
                <Clock3 size={15} />
                {next.minutes} phút · Học theo tốc độ của bạn
              </span>
              <Link
                className="round-arrow"
                href={`/lessons?id=${next.id}`}
                aria-label={`Học ${next.title}`}
              >
                <ArrowRight size={19} />
              </Link>
            </div>
          </Card>
          <SectionTitle title="Một chút luyện tập hôm nay" />
          <div className="quick-grid">
            <Link className="quick-card ear-card" href="/ear-training">
              <span className="quick-icon">
                <Headphones size={23} />
              </span>
              <span>
                <strong>Lắng nghe & cảm nhận</strong>
                <small>Rèn đôi tai âm nhạc của bạn</small>
              </span>
              <ArrowUpRight size={19} />
            </Link>
            <Link className="quick-card scale-card" href="/technique">
              <span className="quick-icon">
                <Music2 size={23} />
              </span>
              <span>
                <strong>Luyện gam & hợp âm</strong>
                <small>Vững kỹ thuật, tự tin hơn</small>
              </span>
              <ArrowUpRight size={19} />
            </Link>
          </div>
        </div>
        <div>
          <SectionTitle
            title="Kế hoạch hôm nay"
            extra={
              <Link
                href="/schedule"
                className="icon-button"
                aria-label="Mở lịch luyện"
              >
                <ArrowUpRight size={17} />
              </Link>
            }
          />
          <Card className="today-card">
            <div className="today-date">
              <CalendarDays size={19} />
              <span>Một cuộc hẹn với âm nhạc</span>
            </div>
            {plans.length ? (
              plans.map((p) => (
                <div className="plan-mini" key={p.id}>
                  <span className="plan-time">{p.time}</span>
                  <div>
                    <strong>{p.title}</strong>
                    <small>{p.minutes} phút</small>
                  </div>
                  {p.doneDates.includes(today) && <Check size={17} />}
                </div>
              ))
            ) : (
              <>
                <h3>Dành thời gian cho điều bạn thích.</h3>
                <p>15 phút tập trung cũng có thể tạo nên sự khác biệt.</p>
                <Link href="/schedule" className="button secondary full">
                  Lên lịch luyện tập
                  <ArrowRight size={16} />
                </Link>
              </>
            )}
            <div className="daily-note">
              <span>GỢI Ý NHỎ</span>
              <p>
                “Chơi chậm để nghe rõ.
                <br />
                Lặp lại để cảm thấy tự nhiên.”
              </p>
            </div>
          </Card>
        </div>
      </div>
      <SectionTitle
        title="Tìm một giai điệu để bắt đầu"
        extra={
          <Link href="/library" className="text-button">
            Khám phá thư viện
            <ArrowUpRight size={15} />
          </Link>
        }
      />
      <div className="song-grid">
        {library.slice(0, 3).map((s, i) => (
          <Link
            href={`/practice?score=${s.id}`}
            className="song-card"
            key={s.id}
          >
            <div className={`song-art art-${i}`}>
              <span className="song-art-symbol">{["𝄞", "♩", "♫"][i]}</span>
              <span className="art-staff" />
              <span className="song-play" aria-label={`Luyện ${s.title}`}>
                <Play size={17} />
              </span>
            </div>
            <div className="song-info">
              <span className="muted small-text">
                BÀI TẬP GỐC · {s.bpm} BPM
              </span>
              <h3>{s.title}</h3>
              <span className="song-level">
                {s.level}
                <ArrowUpRight size={16} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
