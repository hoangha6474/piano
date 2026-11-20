"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";
import {
  House,
  BookOpen,
  Music2,
  Library,
  FolderHeart,
  AudioLines,
  ChartNoAxesColumn,
  CalendarDays,
  Sparkles,
  Settings2,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  ArrowUpRight,
  Leaf,
  Plus,
} from "lucide-react";
import { Dashboard } from "@/features/dashboard";
import { Curriculum, Lesson } from "@/features/curriculum";
import { Library as MusicLibrary } from "@/features/library";
import { Practice } from "@/features/practice";
import { Technique } from "@/features/technique";
import { Progress } from "@/features/progress";
import { Schedule } from "@/features/schedule";
import { Tutor } from "@/features/tutor";
import { Settings } from "@/features/settings";
import { Assessment } from "@/features/assessment";
import { useLearning } from "@/features/store";
import { library } from "@/music/library";
import { useSidebarLayout } from "./use-sidebar-layout";
const navigation = [
  { id: "home", label: "Tổng quan", icon: House },
  { id: "curriculum", label: "Giáo trình", icon: BookOpen },
  { id: "practice", label: "Luyện Piano", icon: Music2 },
  { id: "library", label: "Thư viện bản nhạc", icon: Library },
  { id: "my-scores", label: "Bản nhạc của tôi", icon: FolderHeart },
  { id: "technique", label: "Gam & hợp âm", icon: AudioLines },
  { id: "progress", label: "Tiến độ học tập", icon: ChartNoAxesColumn },
  { id: "schedule", label: "Lịch luyện tập", icon: CalendarDays },
  { id: "tutor", label: "AI giáo viên", icon: Sparkles },
];
export function Workspace({ section }: { section: string }) {
  const sidebar = useSidebarLayout();
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
    <div
      className={`app ${section === "home" ? "home-workspace" : ""} ${sidebar.collapsed ? "sidebar-collapsed" : ""} ${sidebar.resizing ? "sidebar-resizing" : ""}`}
      style={
        sidebar.width
          ? ({ "--sidebar-width": `${sidebar.width}px` } as CSSProperties)
          : undefined
      }
    >
      <a href="#main" className="skip-link">
        Chuyển đến nội dung
      </a>
      {menu && (
        <div className="sidebar-backdrop" onClick={() => setMenu(false)} />
      )}
      <aside id="sidebar" className={`sidebar ${menu ? "open" : ""}`}>
        <button
          className="sidebar-toggle"
          onClick={() => sidebar.setCollapsed(!sidebar.collapsed)}
          aria-label={
            sidebar.collapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"
          }
          title={sidebar.collapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
          aria-expanded={!sidebar.collapsed}
          aria-controls="sidebar-navigation"
        >
          {sidebar.collapsed ? (
            <ChevronRight size={17} />
          ) : (
            <ChevronLeft size={17} />
          )}
        </button>
        <div
          className="sidebar-resize"
          role="separator"
          tabIndex={0}
          aria-label="Điều chỉnh độ rộng thanh bên"
          aria-orientation="vertical"
          aria-valuemin={76}
          aria-valuemax={360}
          aria-valuenow={sidebar.collapsed ? 76 : (sidebar.width ?? 258)}
          aria-controls="sidebar"
          title="Kéo để chỉnh độ rộng; kéo sát trái để thu gọn"
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            event.preventDefault();
            event.currentTarget.setPointerCapture(event.pointerId);
            sidebar.setResizing(true);
          }}
          onPointerMove={(event) => {
            if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
            sidebar.resize(
              event.clientX -
                event.currentTarget.parentElement!.getBoundingClientRect().left,
            );
          }}
          onPointerUp={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId);
            }
            sidebar.setResizing(false);
          }}
          onLostPointerCapture={() => sidebar.setResizing(false)}
          onPointerCancel={() => sidebar.setResizing(false)}
          onKeyDown={(event) => {
            const current = sidebar.collapsed ? 76 : (sidebar.width ?? 258);
            if (event.key === "ArrowLeft")
              sidebar.resize(current <= 220 ? 76 : current - 16);
            else if (event.key === "ArrowRight")
              sidebar.resize(sidebar.collapsed ? 220 : current + 16);
            else if (event.key === "Home") sidebar.setCollapsed(true);
            else if (event.key === "End") sidebar.resize(360);
            else return;
            event.preventDefault();
          }}
        />
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
        <div className="sidebar-actions">
          <Link href="/practice" aria-label="Bắt đầu luyện piano" title="Luyện Piano">
            <Plus size={25} /> <span>LUYỆN PIANO</span>
          </Link>
          <Link href="/my-scores" aria-label="Mở bản nhạc của tôi" title="Bản nhạc của tôi">
            <Plus size={25} /> <span>BẢN NHẠC CỦA TÔI</span>
          </Link>
        </div>
        <div className="sidebar-label">KHÔNG GIAN CỦA BẠN</div>
        <nav id="sidebar-navigation">
          {navigation.map((n) => (
            <div key={n.id}>
              {n.id === "technique" && <div className="nav-divider" />}
              {n.id === "progress" && <div className="nav-divider" />}
              <Link
                className={`nav-item ${section === n.id || (section === "lessons" && n.id === "curriculum") ? "active" : ""}`}
                href={n.id === "home" ? "/" : `/${n.id}`}
                aria-label={n.label}
                title={n.label}
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
            aria-label="Cài đặt & kết nối"
            title="Cài đặt & kết nối"
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
