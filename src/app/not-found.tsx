import Link from "next/link";
export default function NotFound() {
  return (
    <main className="boot">
      <h1>Trang này chưa có bản nhạc.</h1>
      <Link className="button primary" href="/">
        Về trang chủ
      </Link>
    </main>
  );
}
