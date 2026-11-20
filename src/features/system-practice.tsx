"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { library } from "@/music/library";
import type { Score } from "@/music/model";
import { Practice } from "./practice";
import { Empty } from "@/components/ui";

export function SystemPractice({ id }: { id: string | null }) {
  const builtin = library.find((score) => score.id === id);
  const remote = !!id && /^[0-9a-f-]{36}$/i.test(id);
  const [loaded, setLoaded] = useState<{
    id: string;
    score?: Score;
    error?: string;
  }>();
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!remote || builtin) return;
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch(`/api/library/${id}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Không tải được bản nhạc.");
        setLoaded({ id: id!, score: data });
      } catch (e) {
        if (!controller.signal.aborted)
          setLoaded({
            id: id!,
            error: e instanceof Error ? e.message : "Không tải được bản nhạc.",
          });
      }
    })();
    return () => controller.abort();
  }, [id, remote, builtin, retry]);
  if (remote && !builtin) {
    if (!loaded || loaded.id !== id)
      return <p role="status">Đang tải sheet nhạc…</p>;
    if (loaded.error)
      return (
        <Empty
          title="Chưa mở được bản nhạc"
          description={loaded.error}
          action={
            <div className="inline-actions">
              <button
                className="button secondary"
                onClick={() => {
                  setLoaded(undefined);
                  setRetry((n) => n + 1);
                }}
              >
                Thử lại
              </button>
              <Link className="button primary" href="/library">
                Chọn bản nhạc khác
              </Link>
            </div>
          }
        />
      );
    if (loaded.score)
      return <Practice key={loaded.score.id} score={loaded.score} />;
  }
  return (
    <Practice
      key={builtin?.id || library[0].id}
      score={builtin || library[0]}
    />
  );
}
