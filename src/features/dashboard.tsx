"use client";
import Link from "next/link";
import {
  ArrowUpRight,
  Plus,
  Music2,
  BookOpen,
  Headphones,
  Search,
  Check,
  Clock3,
  ChevronRight,
} from "lucide-react";
import { useLearning } from "./store";
import { lessons } from "@/music/library";
import s from "./dashboard.module.css";
export function Dashboard() {
  const state = useLearning();
  const now = new Date();
  const dateKey = (date: Date) => date.toLocaleDateString("sv-SE");
  const today = dateKey(now);
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date;
  });
  const plans = state.plans
    .filter(
      (p) =>
        p.date === today ||
        (p.date <= today &&
          (p.repeat === "daily" ||
            (p.repeat === "weekly" &&
              new Date(p.date + "T12:00:00").getDay() === now.getDay()))),
    )
    .sort((a, b) => a.time.localeCompare(b.time));
  const last = lessons.find((l) => l.id === state.lastLesson) || lessons[0];
  const minutes = Math.floor(
    state.results.reduce((sum, r) => sum + r.seconds, 0) / 60,
  );
  return (
    <div className={s.dashboard}>
      <header className={s.header}>
        <div>
          <span className={s.eyebrow}>KHÔNG GIAN ÂM NHẠC CỦA BẠN</span>
          <h1>
            Mỗi ngày, một
            <br />
            chút âm nhạc<span>.</span>
          </h1>
        </div>
        <Link href="/library" className={s.search}>
          <Search size={20} /> Khám phá bản nhạc <ArrowUpRight size={18} />
        </Link>
      </header>
      <div className={s.intro}>
        <span>
          {now.toLocaleDateString("vi-VN", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </span>
        <span className={s.studioLabel}>HỌC THEO NHỊP CỦA BẠN</span>
      </div>
      <div className={s.grid}>
        <section className={s.today}>
          <div className={s.title}>
            <h2>Hôm nay của bạn</h2>
            <Clock3 size={20} />
          </div>
          <p>Một nhịp nhỏ. Một bước tiến.</p>
          {plans.map((plan) => (
            <div className={s.plan} key={plan.id}>
              <span className={s.time}>
                {plan.time} · {plan.minutes} PHÚT
              </span>
              <h3>{plan.title}</h3>
              <div>
                <Link
                  href={
                    plan.scoreId
                      ? `/practice?score=${encodeURIComponent(plan.scoreId)}`
                      : "/practice"
                  }
                >
                  Luyện tập <ArrowUpRight size={16} />
                </Link>
                <button
                  type="button"
                  onClick={() => state.togglePlan(plan.id, today)}
                  aria-pressed={plan.doneDates.includes(today)}
                  aria-label={`Đánh dấu hoàn thành: ${plan.title}`}
                >
                  {plan.doneDates.includes(today) ? (
                    <Check size={16} />
                  ) : (
                    "Hoàn thành"
                  )}
                </button>
              </div>
            </div>
          ))}
          <div className={s.task}>
            <span className={s.time}>01 / KHỞI ĐỘNG</span>
            <h3>Đánh thức đôi tay</h3>
            <p>Gam Đô trưởng · 5 phút</p>
            <Link href="/technique">
              Bắt đầu <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className={s.done}>
            <Check size={20} />
            <div>
              <strong>Sẵn sàng cho buổi tập</strong>
              <p>Thả lỏng vai, ngồi thật thoải mái.</p>
            </div>
          </div>
          <div className={s.note}>
            <Music2 size={25} />
            <p>
              Không cần hoàn hảo.
              <br />
              <strong>Chỉ cần bắt đầu.</strong>
            </p>
          </div>
          <Link className={s.bottomlink} href="/schedule">
            Xem lịch luyện tập <ChevronRight size={17} />
          </Link>
        </section>
        <div className={s.center}>
          <section className={s.hero}>
            <div className={s.herohead}>
              <span>NHỊP ĐIỆU TUẦN NÀY</span>
              <Link href="/schedule">
                {days[0].getDate()}/{days[0].getMonth() + 1} —{" "}
                {days[6].getDate()}/{days[6].getMonth() + 1}{" "}
                <ChevronRight size={14} />
              </Link>
            </div>
            <h2>
              Chơi theo nhịp
              <br />
              của riêng bạn.
            </h2>
            <p>Dành 15 phút cho điều bạn yêu thích.</p>
            <div className={s.week}>
              {days.map((date, i) => (
                <Link
                  href={`/schedule?date=${dateKey(date)}`}
                  key={dateKey(date)}
                  className={dateKey(date) === today ? s.selected : ""}
                  aria-label={`Lịch ngày ${date.toLocaleDateString("vi-VN")}`}
                >
                  <span>{["T2", "T3", "T4", "T5", "T6", "T7", "CN"][i]}</span>
                  <strong>{date.getDate()}</strong>
                  <i
                    className={
                      state.results.some(
                        (r) => dateKey(new Date(r.at)) === dateKey(date),
                      )
                        ? s.finished
                        : ""
                    }
                  />
                </Link>
              ))}
            </div>
            <div className={s.herobottom}>
              <span>
                <span className={s.dot} /> Hành trình bắt đầu từ hôm nay
              </span>
              <Link href="/practice" aria-label="Bắt đầu luyện piano">
                <Plus size={25} />
              </Link>
            </div>
          </section>
          <section className={s.continue}>
            <div className={s.title}>
              <h2>Tiếp tục hành trình</h2>
              <span>
                {state.completed.length} / {lessons.length}
              </span>
            </div>
            <div className={s.lesson}>
              <div className={s.keys}>
                {Array.from({ length: 12 }, (_, i) => (
                  <i key={i} />
                ))}
              </div>
              <div>
                <span className={s.eyebrow}>{last.chapter}</span>
                <h3>{last.title}</h3>
                <p>{last.minutes} phút · Học theo tốc độ của bạn.</p>
                <Link href={`/lessons?id=${last.id}`}>
                  Vào bài học <ArrowUpRight size={17} />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
      <div className={s.lower}>
        <Link href="/ear-training">
          <Headphones size={24} />
          <div>
            <strong>Lắng nghe & cảm nhận</strong>
            <p>Rèn đôi tai âm nhạc của bạn</p>
          </div>
          <ArrowUpRight size={19} />
        </Link>
        <Link href="/library">
          <BookOpen size={24} />
          <div>
            <strong>Tìm giai điệu yêu thích</strong>
            <p>Khám phá thư viện bản nhạc</p>
          </div>
          <ArrowUpRight size={19} />
        </Link>
      </div>
      <div className={s.metrics}>
        <Link href="/progress">
          <strong>{minutes}</strong>
          <span>phút luyện tập</span>
        </Link>
        <Link href="/curriculum">
          <strong>{state.completed.length}</strong>
          <span>bài học hoàn thành</span>
        </Link>
        <Link href="/progress">
          <strong>{state.results.length}</strong>
          <span>lượt luyện đã lưu</span>
        </Link>
      </div>
    </div>
  );
}
