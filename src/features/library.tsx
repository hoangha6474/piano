"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, ArrowUpRight, Music2, Check } from "lucide-react";
import { levels } from "@/music/library";
import { useLearning } from "./store";
import { useSystemLibrary } from "./system-library";
import { Card, Empty, PageHeading } from "@/components/ui";
export function Library() {
  const state = useLearning(),
    [search, setSearch] = useState(""),
    [level, setLevel] = useState("Tất cả");
  const { items, loading, error, refresh } = useSystemLibrary();
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const songs = items.filter(
    (s) =>
      s.title
        .toLocaleLowerCase("vi")
        .includes(search.toLocaleLowerCase("vi")) &&
      (level === "Tất cả" || s.level === level),
  );
  return (
    <>
      <PageHeading
        eyebrow="THƯ VIỆN BẢN NHẠC"
        title="Tìm giai điệu của hôm nay."
        description="Chọn một bản nhạc, ngồi vào đàn và bắt đầu theo nhịp của bạn."
      />
      {loading && <p role="status">Đang kiểm tra thư viện mới…</p>}
      {error && (
        <div className="notice" role="status">
          {error}{" "}
          <button className="text-button" onClick={() => void refresh()}>
            Thử lại
          </button>
        </div>
      )}
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
          {["Tất cả", ...levels].map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
        <span className="muted">{songs.length} bản nhạc</span>
      </div>
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
            </div>
            <small className="license">{s.license}</small>
          </Card>
        ))}
      </div>
      {!songs.length && (
        <Empty
          title="Không tìm thấy bản nhạc"
          description="Thử từ khóa khác hoặc chọn cấp độ khác trong thư viện hệ thống."
        />
      )}
      <p className="footnote">
        Bản nhạc và bài tập do hệ thống cung cấp. Chọn một bản nhạc trong thư
        viện để luyện tập.
      </p>
    </>
  );
}
