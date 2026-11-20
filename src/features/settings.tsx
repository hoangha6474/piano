"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createAuthClient } from "better-auth/react";
import {
  Usb,
  Cloud,
  Download,
  Upload,
  LogOut,
  ShieldCheck,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Card, PageHeading } from "@/components/ui";
import { useMidi } from "./use-midi";
import { useLearning, snapshot } from "./store";
const client = createAuthClient();
interface ServiceStatus {
  admin: boolean;
  auth: boolean;
  storage: boolean;
  ai: boolean;
  user: { id: string; name: string; email: string } | null;
  error?: string;
}
export function Settings() {
  const midi = useMidi(),
    [status, setStatus] = useState<ServiceStatus | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [register, setRegister] = useState(false),
    [revision, setRevision] = useState<number | null>(null),
    [files, setFiles] = useState<
      { id: string; mime: string; bytes: number; createdAt: string }[]
    >([]);
  const refresh = async () => {
    try {
      const r = await fetch("/api/status"),
        s = await r.json();
      setStatus(s);
      if (s.error) setMessage(s.error);
      if (s.user) {
        const w = await fetch("/api/workspace");
        if (w.ok) setRevision((await w.json()).revision);
        if (s.storage) {
          const f = await fetch("/api/assets");
          if (f.ok) setFiles(await f.json());
        }
      }
    } catch {
      setMessage("Không lấy được trạng thái dịch vụ.");
    }
  };
  useEffect(() => {
    void refresh();
  }, []);
  const cloud = async (direction: "push" | "pull") => {
    setBusy(true);
    try {
      if (direction === "push") {
        if (revision === null)
          throw new Error(
            "Chưa đọc được phiên bản đám mây. Bấm kiểm tra dịch vụ trước.",
          );
        if (
          revision > 0 &&
          !confirm("Ghi dữ liệu trên thiết bị này lên bản đám mây hiện tại?")
        )
          return;
        const r = await fetch("/api/workspace", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            revision,
            data: snapshot(useLearning.getState()),
          }),
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setRevision(d.revision);
        setMessage("Đã lưu bản dữ liệu riêng tư trên Neon.");
      } else {
        const r = await fetch("/api/workspace"),
          d = await r.json();
        if (!r.ok) throw new Error(d.error);
        if (!d.data) {
          setMessage("Tài khoản chưa có bản dữ liệu đám mây.");
          return;
        }
        if (!confirm("Thay dữ liệu trên trình duyệt này bằng bản đám mây?"))
          return;
        useLearning.getState().replace(d.data);
        setRevision(d.revision);
        setMessage("Đã tải dữ liệu từ Neon về thiết bị.");
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Không đồng bộ được.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <PageHeading
        eyebrow="CÀI ĐẶT & KẾT NỐI"
        title="Sẵn sàng cho những giai điệu."
        description="Kiểm tra đàn, tài khoản và nơi lưu dữ liệu của bạn."
        action={
          <button className="button secondary" onClick={refresh}>
            <RefreshCw size={16} />
            Kiểm tra dịch vụ
          </button>
        }
      />
      {message && (
        <div className="notice" role="status">
          {message}
        </div>
      )}
      <div className="two-column">
        <Card>
          <h3>
            <Usb size={20} />
            Đàn Piano của bạn
          </h3>
          <p>{midi.status}</p>
          <button className="button primary" onClick={midi.connect}>
            <Usb size={16} />
            Kết nối MIDI
          </button>
          {midi.devices.length > 0 && (
            <label className="block-label">
              Thiết bị
              <select
                value={midi.selected}
                onChange={(e) => midi.select(e.target.value)}
              >
                {midi.devices.map((d) => (
                  <option value={d.id} key={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="midi-diagnostics">
            <div className="metric-row">
              <span>Sự kiện gần nhất</span>
              <strong>{midi.last?.type || "—"}</strong>
            </div>
            <div className="metric-row">
              <span>MIDI note</span>
              <strong>{midi.last?.midi ?? "—"}</strong>
            </div>
            <div className="metric-row">
              <span>Velocity</span>
              <strong>
                {midi.last ? Math.round(midi.last.velocity * 127) : "—"}
              </strong>
            </div>
            <div className="metric-row">
              <span>Pedal</span>
              <strong>{midi.pedal ? "Đang giữ" : "Đã thả"}</strong>
            </div>
          </div>
          <button className="text-button" onClick={midi.reset}>
            Giải phóng trạng thái phím bị kẹt
          </button>
          <hr />
          <p className="muted">
            USB: dùng cáp có truyền dữ liệu. Bluetooth MIDI: kết nối trong hệ
            điều hành trước nếu cần. Bluetooth Audio không tương đương MIDI.
          </p>
          <p className="notice">
            Victor VT02 chưa được kiểm chứng trên đàn thật trong phiên làm việc
            này.
          </p>
        </Card>
        <Card>
          <h3>
            <ShieldCheck size={20} />
            Tài khoản
          </h3>
          {status?.user ? (
            <>
              <p>
                Đã đăng nhập: <strong>{status.user.name}</strong>
              </p>
              <p className="muted">{status.user.email}</p>
              <p className="muted">
                Mã tài khoản: <code>{status.user.id}</code>
              </p>
              {status.admin && (
                <Link className="button primary" href="/admin">
                  Quản trị thư viện nhạc
                </Link>
              )}
              <button
                className="button secondary"
                onClick={async () => {
                  await client.signOut();
                  setRevision(null);
                  await refresh();
                  setMessage(
                    "Đã đăng xuất. Dữ liệu cục bộ vẫn nằm trên trình duyệt này.",
                  );
                }}
              >
                <LogOut size={16} />
                Đăng xuất
              </button>
            </>
          ) : status?.auth ? (
            <>
              <div className="segmented">
                <button
                  className={!register ? "selected" : ""}
                  onClick={() => setRegister(false)}
                >
                  Đăng nhập
                </button>
                <button
                  className={register ? "selected" : ""}
                  onClick={() => setRegister(true)}
                >
                  Tạo tài khoản
                </button>
              </div>
              <form
                className="stacked-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBusy(true);
                  const fd = new FormData(e.currentTarget);
                  try {
                    const body = {
                      email: String(fd.get("email")),
                      password: String(fd.get("password")),
                      name: String(fd.get("name") || "Học viên"),
                    };
                    const result = register
                      ? await client.signUp.email(body)
                      : await client.signIn.email(body);
                    if (result.error)
                      throw new Error(
                        result.error.message || "Không đăng nhập được.",
                      );
                    await refresh();
                    setMessage(
                      "Đã đăng nhập. Dữ liệu cục bộ chưa tự động ghi lên tài khoản; chọn đồng bộ bên dưới.",
                    );
                  } catch (e) {
                    setMessage(
                      e instanceof Error ? e.message : "Không kết nối được.",
                    );
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {register && (
                  <label>
                    Tên hiển thị
                    <input
                      name="name"
                      required
                      maxLength={100}
                      autoComplete="name"
                    />
                  </label>
                )}
                <label>
                  Email
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                  />
                </label>
                <label>
                  Mật khẩu
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={12}
                    autoComplete={
                      register ? "new-password" : "current-password"
                    }
                  />
                </label>
                <button className="button primary" disabled={busy}>
                  {register ? "Tạo tài khoản" : "Đăng nhập"}
                </button>
              </form>
            </>
          ) : (
            <>
              <p>Đang sử dụng chế độ cục bộ.</p>
              <p className="muted">
                Lịch, ghi chú và kết quả được lưu trong trình duyệt. Chưa kết
                nối Neon và hệ thống đăng nhập.
              </p>
              <div className="notice">
                Cần cấu hình DATABASE_URL, BETTER_AUTH_SECRET và BETTER_AUTH_URL
                ở môi trường server.
              </div>
            </>
          )}
        </Card>
      </div>
      <Card>
        <h3>
          <Cloud size={20} />
          Dữ liệu riêng tư & đồng bộ
        </h3>
        <div className="service-grid">
          {[
            { name: "Neon & tài khoản", ready: status?.auth },
            { name: "Cloudflare R2", ready: status?.storage },
            { name: "AI Tutor", ready: status?.ai },
          ].map((s) => (
            <div className="service-status" key={s.name}>
              <span className={`status-dot ${s.ready ? "green" : ""}`} />
              {s.name}
              <small>{s.ready ? "Đã cấu hình" : "Chưa cấu hình"}</small>
            </div>
          ))}
        </div>
        <p className="muted">
          Đồng bộ chỉ thực hiện khi bạn chọn. Bản lưu có phiên bản để tránh ghi
          đè thay đổi từ thiết bị khác.
        </p>
        <div className="inline-actions">
          <button
            className="button secondary"
            disabled={!status?.user || busy}
            onClick={() => cloud("push")}
          >
            <Upload size={16} />
            Lưu lên Neon
          </button>
          <button
            className="button secondary"
            disabled={!status?.user || busy}
            onClick={() => cloud("pull")}
          >
            <Download size={16} />
            Tải từ Neon
          </button>
          <span className="muted">
            {revision !== null ? `Phiên bản: ${revision}` : ""}
          </span>
        </div>
      </Card>
      {files.length > 0 && (
        <Card>
          <h3>
            <Cloud size={20} />
            Tệp đã lưu trước đây
          </h3>
          <p className="muted">
            Bạn có thể tải về hoặc xóa tệp cũ. Luyện tập chỉ sử dụng thư viện hệ
            thống.
          </p>
          {files.map((f) => (
            <div className="metric-row" key={f.id}>
              <span>
                {f.mime.includes("midi") ? "MIDI" : "MusicXML"} ·{" "}
                {Math.ceil(f.bytes / 1024)} KB ·{" "}
                {new Date(f.createdAt).toLocaleDateString("vi-VN")}
              </span>
              <div className="inline-actions">
                <button
                  className="icon-button"
                  title="Tải tệp"
                  onClick={async () => {
                    try {
                      const r = await fetch(`/api/assets?id=${f.id}`),
                        d = await r.json();
                      if (!r.ok) throw new Error(d.error);
                      window.open(d.url, "_blank", "noopener,noreferrer");
                    } catch (e) {
                      setMessage(
                        e instanceof Error ? e.message : "Không tải được tệp.",
                      );
                    }
                  }}
                >
                  <Download size={16} />
                </button>
                <button
                  className="icon-button"
                  title="Xóa tệp"
                  onClick={async () => {
                    if (!confirm("Xóa vĩnh viễn bản gốc này khỏi R2?")) return;
                    const r = await fetch(`/api/assets?id=${f.id}`, {
                      method: "DELETE",
                    });
                    if (r.ok) await refresh();
                    else setMessage("Chưa xóa được tệp.");
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}
