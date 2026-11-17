"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  Search,
  Upload,
  ArrowUpRight,
  Music2,
  Trash2,
  Check,
} from "lucide-react";
import { library, levels } from "@/music/library";
import { useLearning } from "./store";
import { importScore } from "@/music/import";
import { Card, Empty, PageHeading } from "@/components/ui";
export function Library({ personal = false }: { personal?: boolean }) {
  const state = useLearning(),
    [search, setSearch] = useState(""),
    [level, setLevel] = useState("Tất cả"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    input = useRef<HTMLInputElement>(null);
  const songs = (
    personal ? state.scores : [...library, ...state.scores]
  ).filter(
    (s) =>
      s.title
        .toLocaleLowerCase("vi")
        .includes(search.toLocaleLowerCase("vi")) &&
      (level === "Tất cả" || s.level === level),
  );
  return (
    <>
      <PageHeading
        eyebrow={personal ? "GÓC NHẠC CỦA BẠN" : "THƯ VIỆN BẢN NHẠC"}
        title={
          personal ? "Những giai điệu mang theo." : "Tìm giai điệu của hôm nay."
        }
        description="Chọn một bản nhạc, ngồi vào đàn và bắt đầu theo nhịp của bạn."
        action={
          <button
            className="button primary"
            disabled={busy}
            onClick={() => input.current?.click()}
          >
            <Upload size={16} />
            {busy ? "Đang phân tích…" : "Tải bản nhạc"}
          </button>
        }
      />
      <input
        className="sr-only"
        ref={input}
        type="file"
        accept=".mid,.midi,.xml,.musicxml"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setBusy(true);
          setMessage("");
          try {
            const s = await importScore(file);
            state.addScore(s);
            setMessage(
              `Đã lưu “${s.title}” trên trình duyệt này. ${s.source.includes("MIDI") ? "Ký âm MIDI là suy luận; hãy kiểm tra và gán lại bè nếu cần." : ""}`,
            );
          } catch (error) {
            setMessage(
              error instanceof Error ? error.message : "Không đọc được tệp.",
            );
          } finally {
            setBusy(false);
            if (input.current) input.current.value = "";
          }
        }}
      />
      <div className="library-tools">
        <label className="search-input">
          <Search size={18} />
          <input
            aria-label="Tìm bản nhạc"
            placeholder="Tìm một bản nhạc…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select
          aria-label="Lọc cấp độ"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
        >
          {["Tất cả", ...levels, "Cá nhân"].map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
        <span className="muted">{songs.length} bản nhạc</span>
      </div>
      {message && (
        <div className="notice" role="status">
          {message}
        </div>
      )}
      <div className="song-grid">
        {songs.map((s, i) => (
          <Card className="library-song" key={s.id}>
            <Link href={`/practice?score=${s.id}`}>
              <div className={`song-art art-${i % 3}`}>
                <span className="song-art-symbol">
                  {["𝄞", "♩", "♫"][i % 3]}
                </span>
                <span className="art-staff" />
              </div>
              <div className="song-info">
                <span className="eyebrow">
                  {s.level} · {s.bpm} BPM
                </span>
                <h3>{s.title}</h3>
                <p>{s.composer}</p>
                <span className="song-level">
                  Mở không gian luyện
                  <ArrowUpRight size={16} />
                </span>
              </div>
            </Link>
            <div className="library-actions">
              <button
                className="text-button"
                onClick={() => state.toggleMastered(s.id)}
              >
                {state.mastered.includes(s.id) ? (
                  <Check size={15} />
                ) : (
                  <Music2 size={15} />
                )}{" "}
                {state.mastered.includes(s.id)
                  ? "Đã thành thạo"
                  : "Đánh dấu thành thạo"}
              </button>
              {s.imported && (
                <button
                  className="icon-button"
                  title="Xóa bản nhạc cá nhân khỏi thiết bị"
                  onClick={() => {
                    if (confirm(`Xóa “${s.title}” khỏi thư viện thiết bị này?`))
                      state.removeScore(s.id);
                  }}
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
            <small className="license">{s.license}</small>
          </Card>
        ))}
      </div>
      {!songs.length && (
        <Empty
          title="Một thư viện đang chờ bạn"
          description="Tải MIDI hoặc MusicXML để bắt đầu. File tối đa 5 MB; bản nhạc cá nhân được giữ trên trình duyệt này."
          action={
            <button
              className="button secondary"
              onClick={() => input.current?.click()}
            >
              Chọn bản nhạc
            </button>
          }
        />
      )}
      <p className="footnote">
        Bài tập tích hợp do dự án biên soạn. Bản nhạc cá nhân không được công
        khai. Nhập MIDI phức tạp: ưu tiên xuất MusicXML từ phần mềm ký âm.
      </p>
    </>
  );
}
