import { Suspense } from "react";
import { Workspace } from "@/components/workspace";
export default function Home() {
  return (
    <Suspense
      fallback={<div className="boot">Đang mở không gian âm nhạc…</div>}
    >
      <Workspace section="home" />
    </Suspense>
  );
}
