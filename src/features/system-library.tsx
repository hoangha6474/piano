"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { library } from "@/music/library";
import type { LibraryItem } from "@/music/catalog";

const Context = createContext<{
  items: LibraryItem[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
}>({ items: library, loading: true, error: "", refresh: async () => {} });
export function SystemLibraryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<LibraryItem[]>(library),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const latestRequest = useRef(0);
  const refresh = useCallback(async () => {
    const generation = ++latestRequest.current;
    try {
      const response = await fetch("/api/library", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Không tải được thư viện.");
      if (generation !== latestRequest.current) return;
      setItems([...library, ...data]);
      setError("");
    } catch (e) {
      if (generation !== latestRequest.current) return;
      setError(
        e instanceof Error ? e.message : "Không tải được thư viện cập nhật.",
      );
    } finally {
      if (generation === latestRequest.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
    const focused = () => {
      void refresh();
    };
    window.addEventListener("focus", focused);
    return () => window.removeEventListener("focus", focused);
  }, [refresh]);
  return (
    <Context.Provider value={{ items, loading, error, refresh }}>
      {children}
    </Context.Provider>
  );
}
export const useSystemLibrary = () => useContext(Context);
