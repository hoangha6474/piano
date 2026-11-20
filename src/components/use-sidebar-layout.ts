"use client";

import { useEffect, useState } from "react";

const storageKey = "piano-sidebar-layout";
const clampWidth = (width: number) => Math.min(360, Math.max(220, width));

export function useSidebarLayout() {
  const [width, setWidth] = useState<number>();
  const [collapsed, setCollapsed] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (
        saved &&
        typeof saved.width === "number" &&
        Number.isFinite(saved.width)
      ) {
        setWidth(clampWidth(saved.width));
      }
      if (typeof saved?.collapsed === "boolean") setCollapsed(saved.collapsed);
    } catch {
      // The sidebar also works when browser storage is unavailable.
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded || resizing) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ width, collapsed }));
    } catch {
      // Keeping this preference in memory is sufficient for this visit.
    }
  }, [width, collapsed, loaded, resizing]);

  function resize(nextWidth: number) {
    if (nextWidth < 150) {
      setCollapsed(true);
    } else {
      setCollapsed(false);
      setWidth(clampWidth(nextWidth));
    }
  }

  return { width, collapsed, resizing, setCollapsed, setResizing, resize };
}
