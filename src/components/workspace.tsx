"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  House,
  BookOpen,
  Music2,
  Library,
  FolderHeart,
  Headphones,
  AudioLines,
  ChartNoAxesColumn,
  CalendarDays,
  Sparkles,
  Settings2,
  Menu,
  X,
  ChevronRight,
  ArrowUpRight,
  Leaf,
} from "lucide-react";
import { Dashboard } from "@/features/dashboard";
import { Curriculum, Lesson } from "@/features/curriculum";
import { Library as MusicLibrary } from "@/features/library";
import { Practice } from "@/features/practice";
import { EarTraining } from "@/features/ear-training";
import { Technique } from "@/features/technique";
import { Progress } from "@/features/progress";
import { Schedule } from "@/features/schedule";
import { Tutor } from "@/features/tutor";
import { Settings } from "@/features/settings";
import { Assessment } from "@/features/assessment";
import { useLearning } from "@/features/store";
import { library } from "@/music/library";
const navigation = [
  { id: "home", label: "Tổng quan", icon: House },
  { id: "curriculum", label: "Giáo trình", icon: BookOpen },
  { id: "practice", label: "Luyện Piano", icon: Music2 },
  { id: "library", label: "Thư viện bản nhạc", icon: Library },
  { id: "my-scores", label: "Bản nhạc của tôi", icon: FolderHeart },
  { id: "ear-training", label: "Luyện tai nghe", icon: Headphones },
  { id: "technique", label: "Gam & hợp âm", icon: AudioLines },
  { id: "progress", label: "Tiến độ học tập", icon: ChartNoAxesColumn },
  { id: "schedule", label: "Lịch luyện tập", icon: CalendarDays },
  { id: "tutor", label: "AI giáo viên", icon: Sparkles },
];
export function Workspace({ section }: { section: string }) {
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    const handler = () => setStorageError(true);
    window.addEventListener("piano-storage-error", handler);
    return () => window.removeEventListener("piano-storage-error", handler);
  }, []);
  const [menu, setMenu] = useState(false),
    state = useLearning(),
    query = useSearchParams();
  useEffect(() => {
    if (useLearning.persist.hasHydrated()) useLearning.getState().markReady();
  }, []);
  const selectedScore =
    [...library, ...state.scores].find((s) => s.id === query.get("score")) ||
    library[0];
  let content;
  if (!state.ready)
    content = <div className="boot">Đang mở hành trình của bạn…</div>;
  else
    switch (section) {
      case "assessment":
        content = <Assessment chapter={query.get("chapter") || undefined} />;
        break;
      case "curriculum":
        content = <Curriculum />;
        break;
      case "lessons":
        content = <Lesson id={query.get("id") || state.lastLesson} />;
        break;
      case "practice":
        content = <Practice key={selectedScore.id} score={selectedScore} />;
        break;
      case "library":
        content = <MusicLibrary />;
        break;
      case "my-scores":
        content = <MusicLibrary personal />;
        break;
      case "ear-training":
        content = <EarTraining />;
        break;
      case "technique":
        content = <Technique />;
        break;
      case "progress":
        content = <Progress />;
        break;
      case "schedule":
        content = <Schedule />;
        break;
      case "tutor":
        content = <Tutor />;
        break;
      case "settings":
        content = <Settings />;
        break;
      default:
        content = <Dashboard />;
    }
  return (
    <div className="app">
      <a href="#main" className="skip-link">
        Chuyển đến nội dung
      </a>
      {menu && (
        <div className="sidebar-backdrop" onClick={() => setMenu(false)} />
      )}
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <Link href="/" className="brand" aria-label="Piano Learning, trang chủ">
          <span className="brand-symbol">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span>
            piano<span className="brand-dot">.</span>
            <small>LEARNING</small>
          </span>
        </Link>
        <button
          className="mobile-close icon-button"
          aria-label="Đóng điều hướng"
          onClick={() => setMenu(false)}
        >
          <X size={20} />
        </button>
        <div className="sidebar-label">KHÔNG GIAN CỦA BẠN</div>
        <nav>
          {navigation.map((n, i) => (
            <div key={n.id}>
              {i === 5 && <div className="nav-divider" />}
              {i === 7 && <div className="nav-divider" />}
              <Link
                className={`nav-item ${section === n.id || (section === "lessons" && n.id === "curriculum") ? "active" : ""}`}
                href={n.id === "home" ? "/" : `/${n.id}`}
                onClick={() => setMenu(false)}
              >
                <n.icon size={19} strokeWidth={1.65} />
                <span>{n.label}</span>
                {n.id === "tutor" && <span className="ai-label">AI</span>}
              </Link>
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <Leaf size={19} />
            <p>
              Không cần hoàn hảo.
              <br />
              <strong>Chỉ cần bắt đầu.</strong>
            </p>
          </div>
          <Link
            className={`nav-item ${section === "settings" ? "active" : ""}`}
            href="/settings"
          >
            <Settings2 size={19} />
            <span>Cài đặt & kết nối</span>
          </Link>
          <div className="profile">
            <span className="avatar">B</span>
            <div>
              <strong>Người yêu Piano</strong>
              <small>
                <span className="status-dot" />
                Đang lưu trên thiết bị
              </small>
            </div>
            <ChevronRight size={15} />
          </div>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <button
            className="mobile-menu icon-button"
            onClick={() => setMenu(true)}
            aria-label="Mở điều hướng"
          >
            <Menu size={21} />
          </button>
          <div className="breadcrumb">
            Không gian học tập
            <ChevronRight size={13} />
            <span>
              {section === "settings"
                ? "Cài đặt"
                : section === "lessons"
                  ? "Bài học"
                  : navigation.find((n) => n.id === section)?.label ||
                    "Tổng quan"}
            </span>
          </div>
          <Link className="topbar-tip" href="/settings">
            <span className="status-dot" />
            Kết nối đàn của bạn
            <ArrowUpRight size={14} />
          </Link>
        </header>
        <main id="main" className="main-content">
          {storageError && (
            <div className="notice error" role="alert">
              Trình duyệt không lưu được dữ liệu bền vững. Kết quả đang có trong
              bộ nhớ; hãy kiểm tra dung lượng hoặc đồng bộ Neon trước khi đóng
              trang.
            </div>
          )}
          {content}
          <footer className="footer">
            <span>
              piano. <small>Chơi nhạc, theo nhịp của bạn.</small>
            </span>
            <small>Thiết kế cho đàn Piano thật · Tiếng Việt</small>
          </footer>
        </main>
      </div>
    </div>
  );
}
