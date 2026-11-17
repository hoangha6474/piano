"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="boot">
      <h1>Chưa mở được trang.</h1>
      <p>Dữ liệu đã lưu trên thiết bị vẫn được giữ. Thử tải lại để tiếp tục.</p>
      <button className="button primary" onClick={reset}>
        Thử lại
      </button>
    </main>
  );
}
