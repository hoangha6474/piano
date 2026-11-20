"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw, Save, Eye, EyeOff, Pencil } from "lucide-react";
import { Card, Empty, PageHeading } from "@/components/ui";
import { ScoreView } from "@/components/score-view";
import { levels } from "@/music/library";
import type { Score } from "@/music/model";
import type { AdminLibraryDetail, AdminLibraryItem } from "@/music/catalog";
import { useSystemLibrary } from "./system-library";
type Metadata = Pick<Score, "title" | "composer" | "level" | "bpm" | "license">;
const metadataOf = (score: Metadata): Metadata => ({
  title: score.title,
  composer: score.composer,
  level: score.level,
  bpm: score.bpm,
  license: score.license,
});
const statusName = {
  draft: "Bản nháp",
  published: "Đã xuất bản",
  hidden: "Đã ẩn",
};
async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...options, cache: "no-store" });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Không thực hiện được yêu cầu.");
  return data;
}
export function AdminLibrary() {
  const { refresh: refreshCatalog } = useSystemLibrary();
  const [items, setItems] = useState<AdminLibraryItem[]>([]),
    [access, setAccess] = useState<"loading" | "allowed" | "denied">("loading");
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [editor, setEditor] = useState<{
      score: Score;
      saved?: AdminLibraryDetail;
    }>();
  const [metadata, setMetadata] = useState<Metadata>(),
    [search, setSearch] = useState("");
  const reload = useCallback(async () => {
    try {
      setItems(await api<AdminLibraryItem[]>("/api/admin/library"));
      setAccess("allowed");
    } catch (e) {
      setAccess("denied");
      setMessage(
        e instanceof Error ? e.message : "Không mở được trang quản trị.",
      );
    }
  }, []);
  useEffect(() => {
    void reload();
  }, [reload]);
  const open = async (id: string) => {
    setBusy(true);
    setMessage("");
    try {
      const detail = await api<AdminLibraryDetail>(`/api/admin/library/${id}`);
      setEditor({ score: detail.score, saved: detail });
      setMetadata(metadataOf(detail.score));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Không mở được bản nháp.");
    } finally {
      setBusy(false);
    }
  };
  const change = async (action: "save" | "publish" | "hide") => {
    if (!editor?.saved || !metadata) return;
    if (
      action === "publish" &&
      !confirm(`Xuất bản “${metadata.title}” cho mọi người học?`)
    )
      return;
    if (
      action === "hide" &&
      !confirm(`Ẩn “${metadata.title}” khỏi thư viện người học?`)
    )
      return;
    setBusy(true);
    setMessage("");
    try {
      await api(`/api/admin/library/${editor.saved.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          revision: editor.saved.revision,
          ...(action === "save" ? { metadata } : {}),
        }),
      });
      const detail = await api<AdminLibraryDetail>(
        `/api/admin/library/${editor.saved.id}`,
      );
      setEditor({ score: detail.score, saved: detail });
      setMetadata(metadataOf(detail.score));
      await reload();
      await refreshCatalog();
      setMessage(
        action === "publish"
          ? "Đã xuất bản. Người học có thể chọn bản nhạc trong thư viện."
          : action === "hide"
            ? "Đã ẩn bản nhạc khỏi thư viện người học."
            : "Đã lưu bản nháp. Phiên bản công khai chỉ thay đổi khi bạn xuất bản.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Không cập nhật được.");
    } finally {
      setBusy(false);
    }
  };
  const dirty =
    !!editor &&
    !!metadata &&
    JSON.stringify(metadata) !== JSON.stringify(metadataOf(editor.score));
  const filtered = items.filter((item) =>
    `${item.title} ${item.composer}`
      .toLocaleLowerCase("vi")
      .includes(search.toLocaleLowerCase("vi")),
  );
  return (
    <>
      <PageHeading
        eyebrow="QUẢN TRỊ"
        title="Thư viện nhạc hệ thống"
        description="Thêm MusicXML, xem trước sheet và xuất bản cho mọi người học."
        action={
          access === "allowed" ? (
            <button
              className="button primary"
              disabled={busy}
              onClick={() => {
                if (
                  dirty &&
                  !confirm("Bỏ thay đổi chưa lưu để thêm bản nhạc mới?")
                )
                  return;
                setEditor(undefined);
                setMetadata(undefined);
                setMessage("");
                document.getElementById("admin-musicxml")?.focus();
              }}
            >
              <Plus size={16} />
              Thêm bản nhạc
            </button>
          ) : undefined
        }
      />
      {message && (
        <div className="notice" role="status">
          {message}
        </div>
      )}
      {access === "loading" && (
        <p role="status">Đang kiểm tra quyền quản trị…</p>
      )}
      {access === "denied" && (
        <Empty
          title="Cần quyền quản trị"
          description="Đăng nhập trong Cài đặt bằng tài khoản được chủ website cấp quyền. Nếu chưa cấu hình, xem hướng dẫn quản trị của dự án."
          action={
            <div className="inline-actions">
              <Link className="button primary" href="/settings">
                Mở cài đặt & đăng nhập
              </Link>
              <button
                className="button secondary"
                onClick={() => void reload()}
              >
                Kiểm tra lại
              </button>
            </div>
          }
        />
      )}
      {access === "allowed" && (
        <div className="admin-library-layout">
          <div>
            <Card>
              <div className="section-title">
                <h2>Bản nhạc do admin thêm</h2>
                <button
                  className="icon-button"
                  aria-label="Tải lại danh sách quản trị"
                  disabled={busy}
                  onClick={() => void reload()}
                >
                  <RefreshCw size={17} />
                </button>
              </div>
              <label className="stacked-form">
                Tìm bản nhạc quản trị
                <input
                  aria-label="Tìm bản nhạc quản trị"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              <p className="muted">
                Các bài tập có sẵn của hệ thống vẫn được giữ trong thư viện.
              </p>
              {!filtered.length && <p>Chưa có bản nhạc phù hợp.</p>}
              <div className="admin-score-list">
                {filtered.map((item) => (
                  <button
                    key={item.id}
                    className={`admin-score-row ${editor?.saved?.id === item.id ? "selected" : ""}`}
                    disabled={busy}
                    onClick={() => {
                      if (
                        dirty &&
                        !confirm("Bỏ thay đổi chưa lưu để mở bản nhạc khác?")
                      )
                        return;
                      void open(item.id);
                    }}
                  >
                    <span>
                      <strong>{item.title}</strong>
                      <small>
                        {item.composer} · {item.level}
                      </small>
                      <small>
                        {statusName[item.status]}
                        {item.status === "published" &&
                        item.publishedRevision &&
                        item.revision > item.publishedRevision
                          ? " · Có bản sửa chưa xuất bản"
                          : ""}
                      </small>
                    </span>
                    <Pencil size={16} />
                  </button>
                ))}
              </div>
            </Card>
          </div>
          <div className="admin-editor">
            {!editor?.saved && (
              <Card>
                <h2>Chọn sheet MusicXML</h2>
                <p className="muted">
                  Tệp .xml hoặc .musicxml, UTF-8, tối đa 5 MB. PDF và ảnh chưa
                  dùng được để nhận biết nốt MIDI.
                </p>
                <label className="stacked-form">
                  Tệp MusicXML
                  <input
                    id="admin-musicxml"
                    type="file"
                    accept=".xml,.musicxml"
                    disabled={busy}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      e.target.value = "";
                      setBusy(true);
                      setMessage("");
                      setEditor(undefined);
                      setMetadata(undefined);
                      try {
                        if (
                          !/\.(xml|musicxml)$/i.test(file.name) ||
                          !file.size ||
                          file.size > 5 * 1024 * 1024
                        )
                          throw new Error(
                            "Chọn tệp .xml/.musicxml từ 1 byte đến 5 MB.",
                          );
                        const bytes = await file.arrayBuffer();
                        const score = await api<Score>(
                          "/api/admin/library/preview",
                          {
                            method: "POST",
                            headers: {
                              "Content-Type":
                                "application/vnd.recordare.musicxml+xml",
                            },
                            body: bytes,
                          },
                        );
                        setEditor({ score });
                        setMetadata(metadataOf(score));
                        setMessage(
                          "Đã phân tích sheet. Kiểm tra bản xem trước và điền thông tin trước khi lưu nháp.",
                        );
                      } catch (error) {
                        setMessage(
                          error instanceof Error
                            ? error.message
                            : "Không đọc được MusicXML.",
                        );
                      } finally {
                        setBusy(false);
                      }
                    }}
                  />
                </label>
              </Card>
            )}
            {editor && metadata && (
              <>
                <Card>
                  <h2>Thông tin bản nhạc</h2>
                  {editor.saved && (
                    <p>
                      {statusName[editor.saved.status]} · Phiên bản{" "}
                      {editor.saved.revision}
                    </p>
                  )}
                  <form
                    className="form-grid"
                    onSubmit={async (event) => {
                      event.preventDefault();
                      if (editor.saved) {
                        await change("save");
                        return;
                      }
                      setBusy(true);
                      setMessage("");
                      try {
                        const detail = await api<AdminLibraryDetail>(
                          "/api/admin/library",
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              xml: editor.score.xml,
                              metadata,
                            }),
                          },
                        );
                        setEditor({ score: detail.score, saved: detail });
                        setMetadata(metadataOf(detail.score));
                        await reload();
                        setMessage(
                          "Đã lưu bản nháp. Kiểm tra sheet và bấm Xuất bản khi đã sẵn sàng.",
                        );
                      } catch (error) {
                        setMessage(
                          error instanceof Error
                            ? error.message
                            : "Không lưu được bản nháp.",
                        );
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    <label>
                      Tên bản nhạc
                      <input
                        required
                        maxLength={200}
                        value={metadata.title}
                        disabled={busy}
                        onChange={(e) =>
                          setMetadata({ ...metadata, title: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Tác giả
                      <input
                        required
                        maxLength={200}
                        value={metadata.composer}
                        disabled={busy}
                        onChange={(e) =>
                          setMetadata({ ...metadata, composer: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Cấp độ
                      <select
                        value={metadata.level}
                        disabled={busy}
                        onChange={(e) =>
                          setMetadata({ ...metadata, level: e.target.value })
                        }
                      >
                        {levels.map((level) => (
                          <option key={level}>{level}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Tempo (BPM)
                      <input
                        required
                        type="number"
                        min={20}
                        max={240}
                        step={1}
                        value={metadata.bpm}
                        disabled={busy}
                        onChange={(e) =>
                          setMetadata({
                            ...metadata,
                            bpm: Number(e.target.value),
                          })
                        }
                      />
                    </label>
                    <label className="admin-license">
                      Quyền sử dụng / giấy phép
                      <textarea
                        required
                        maxLength={1000}
                        value={metadata.license}
                        disabled={busy}
                        onChange={(e) =>
                          setMetadata({ ...metadata, license: e.target.value })
                        }
                        placeholder="Ví dụ: bài tập tự biên soạn, CC0 hoặc thông tin cho phép sử dụng."
                      />
                    </label>
                    <button
                      className="button primary"
                      disabled={busy || (!!editor.saved && !dirty)}
                    >
                      <Save size={16} />
                      {busy ? "Đang xử lý…" : "Lưu bản nháp"}
                    </button>
                  </form>
                  {editor.saved && (
                    <div className="inline-actions admin-publish-actions">
                      <button
                        className="button primary"
                        disabled={
                          busy ||
                          dirty ||
                          (editor.saved.status === "published" &&
                            editor.saved.publishedRevision ===
                              editor.saved.revision)
                        }
                        onClick={() => void change("publish")}
                      >
                        <Eye size={16} />
                        Xuất bản
                      </button>
                      <button
                        className="button secondary"
                        disabled={busy || editor.saved.status !== "published"}
                        onClick={() => void change("hide")}
                      >
                        <EyeOff size={16} />
                        Ẩn bài
                      </button>
                      <small>
                        {dirty
                          ? "Lưu bản nháp trước khi xuất bản."
                          : "Xuất bản sẽ cập nhật thư viện cho mọi người học."}
                      </small>
                    </div>
                  )}
                </Card>
                <Card>
                  <h2>Xem trước sheet</h2>
                  <p>
                    {editor.score.notes.length} nốt · Nhịp{" "}
                    {editor.score.meter.join("/")} · {metadata.bpm} BPM
                  </p>
                  <div className="admin-sheet-preview">
                    <ScoreView
                      score={{ ...editor.score, ...metadata }}
                      beat={-1}
                      zoom={0.8}
                      names={false}
                      fingers={false}
                      colors={false}
                      compact={false}
                      autoScroll={false}
                      a={0}
                      b={Number.MAX_SAFE_INTEGER}
                      errors={new Set()}
                      annotations={[]}
                      onSelect={() => {}}
                    />
                  </div>
                </Card>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
