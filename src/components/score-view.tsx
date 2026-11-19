"use client";
import { useEffect, useRef, useState } from "react";
import type {
  GraphicalNote,
  OpenSheetMusicDisplay,
} from "opensheetmusicdisplay";
import type { Score, ScoreNote } from "@/music/model";
import { toMusicXML } from "@/music/notation";
import { noteName } from "@/music/model";
interface Props {
  score: Score;
  beat: number;
  zoom: number;
  names: boolean;
  fingers: boolean;
  colors: boolean;
  compact: boolean;
  autoScroll: boolean;
  a: number;
  b: number;
  errors: Set<string>;
  annotations: {
    beat: number;
    end?: number;
    color: string;
    text: string;
    hand?: string;
  }[];
  onSelect: (beat: number) => void;
}
interface Drawn {
  note: ScoreNote;
  graph: GraphicalNote;
  element: SVGGElement;
  name: SVGTextElement;
  finger: SVGTextElement;
}
export function ScoreView(p: Props) {
  const host = useRef<HTMLDivElement>(null),
    osmd = useRef<OpenSheetMusicDisplay | null>(null),
    drawn = useRef<Drawn[]>([]),
    latest = useRef(p),
    active = useRef<number | null>(null),
    positions = useRef<number[]>([]);
  latest.current = p;
  const [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!host.current) return;
    const observer = new ResizeObserver((entries) => {
      const next = Math.round(entries[0].contentRect.width);
      setWidth((previous) => (Math.abs(previous - next) > 8 ? next : previous));
    });
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let cancelled = false;
    let owned: OpenSheetMusicDisplay | null = null;
    setLoading(true);
    setError("");
    const render = async () => {
      try {
        const { OpenSheetMusicDisplay } = await import("opensheetmusicdisplay");
        if (cancelled || !host.current) return;
        host.current.replaceChildren();
        drawn.current = [];
        const view = new OpenSheetMusicDisplay(host.current, {
          autoResize: false,
          backend: "svg",
          drawTitle: false,
          drawComposer: false,
          drawPartNames: false,
          drawFingerings: false,
          drawingParameters: p.compact ? "compacttight" : "default",
        });
        owned = view;
        osmd.current = view;
        view.Zoom = p.zoom;
        await view.load(p.score.xml || toMusicXML(p.score));
        if (cancelled) return;
        view.render();
        view.cursor.hide();
        const consumed = new Set<string>();
        let pitchOffset: number | undefined;
        const notesAtBeat = new Map<number, ScoreNote[]>();
        for (const n of p.score.notes) {
          const key = Math.round(n.beat * 10000);
          notesAtBeat.set(key, [...(notesAtBeat.get(key) || []), n]);
        }
        for (const measure of view.Sheet.SourceMeasures)
          for (const container of measure.VerticalSourceStaffEntryContainers)
            for (const entry of container.StaffEntries)
              if (entry)
                for (const voice of entry.VoiceEntries)
                  for (const source of voice.Notes) {
                    if (source.isRest()) continue;
                    const beat = source.getAbsoluteTimestamp().RealValue * 4,
                      pitch = source.Pitch.getHalfTone();

                    const candidates = (
                      notesAtBeat.get(Math.round(beat * 10000)) || []
                    ).filter((n) => !consumed.has(n.id));
                    if (pitchOffset === undefined) {
                      const hint =
                        candidates.find(
                          (n) =>
                            n.hand ===
                            (entry.ParentStaff.idInMusicSheet === 0
                              ? "right"
                              : "left"),
                        ) || candidates[0];
                      if (hint) pitchOffset = hint.midi - pitch;
                    }
                    const note = candidates.find(
                      (n) => n.midi === pitch + (pitchOffset || 0),
                    );
                    if (!note) continue;
                    const graph = view.EngravingRules.GNote(
                      source,
                    ) as GraphicalNote & { getSVGGElement?: () => SVGGElement };
                    const element = graph?.getSVGGElement?.();
                    if (!element) continue;
                    consumed.add(note.id);
                    element.dataset.noteId = note.id;
                    element.style.cursor = "pointer";
                    element.setAttribute("role", "button");
                    element.setAttribute("tabindex", "0");
                    element.setAttribute(
                      "aria-label",
                      `${noteName(note.midi)}, phách ${note.beat + 1}`,
                    );
                    element.addEventListener("click", () =>
                      latest.current.onSelect(note.beat),
                    );
                    element.addEventListener("keydown", (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        latest.current.onSelect(note.beat);
                      }
                    });
                    const box = element.getBBox();
                    const label = (
                      text: string,
                      y: number,
                      className: string,
                    ) => {
                      const label = document.createElementNS(
                        "http://www.w3.org/2000/svg",
                        "text",
                      );
                      label.textContent = text;
                      label.setAttribute("x", String(box.x + box.width / 2));
                      label.setAttribute("y", String(y));
                      label.setAttribute("text-anchor", "middle");
                      label.setAttribute("font-size", "9");
                      label.setAttribute(
                        "font-family",
                        "Segoe UI, Arial, sans-serif",
                      );
                      label.setAttribute("fill", "#59613f");
                      label.classList.add(className);
                      element.parentElement?.append(label);
                      return label;
                    };
                    drawn.current.push({
                      note,
                      graph,
                      element,
                      name: label(
                        noteName(note.midi),
                        box.y + box.height + 13,
                        "note-name-label",
                      ),
                      finger: label(
                        String(note.finger || ""),
                        box.y - 7,
                        "note-finger-label",
                      ),
                    });
                  }

        positions.current = [...new Set(p.score.notes.map((n) => n.beat))].sort(
          (a, b) => a - b,
        );
        active.current = null;
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Không hiển thị được bản nhạc.",
          );
          setLoading(false);
        }
      }
    };
    void render();
    return () => {
      cancelled = true;
      owned?.clear();
      if (osmd.current === owned) osmd.current = null;
    };
  }, [p.score, p.zoom, p.compact, width]);
  function baseColor(d: Drawn) {
    const config = latest.current;
    if (config.errors.has(d.note.id)) return "#a34732";
    const mark = config.annotations.find(
      (a) =>
        d.note.beat >= a.beat &&
        d.note.beat < (a.end ?? a.beat + 0.01) &&
        (!a.hand || a.hand === "both" || a.hand === d.note.hand),
    );
    if (mark) return mark.color;
    if (d.note.beat >= config.a && d.note.beat < config.b) return "#667335";
    return config.colors
      ? d.note.hand === "right"
        ? "#6b6a45"
        : "#446384"
      : "#30352c";
  }
  useEffect(() => {
    if (loading) return;
    for (const d of drawn.current) {
      d.graph.setColor(baseColor(d), {});
      d.name.style.display = p.names ? "" : "none";
      d.finger.style.display = p.fingers ? "" : "none";
    }
    active.current = null;
  }, [
    loading,
    p.colors,
    p.errors,
    p.annotations,
    p.a,
    p.b,
    p.names,
    p.fingers,
  ]);
  useEffect(() => {
    if (loading) return;
    const beats = positions.current;
    let lo = 0,
      hi = beats.length - 1;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      if (beats[mid] <= p.beat + 0.001) lo = mid;
      else hi = mid - 1;
    }
    const at = beats[lo];
    if (active.current === at) return;
    for (const d of drawn.current) {
      if (d.note.beat === active.current) d.graph.setColor(baseColor(d), {});
      if (d.note.beat === at) d.graph.setColor("#2f7049", {});
    }
    active.current = at;
    if (p.autoScroll)
      drawn.current
        .find((d) => d.note.beat === at)
        ?.element.scrollIntoView({
          block: "nearest",
          inline: "nearest",
          behavior: "smooth",
        });
  }, [
    p.beat,
    p.autoScroll,
    loading,
    p.errors,
    p.annotations,
    p.a,
    p.b,
    p.colors,
    p.names,
    p.fingers,
  ]);
  return (
    <div className="score-surface">
      {loading && <div className="score-loading">Đang khắc bản nhạc…</div>}
      {error && (
        <div role="alert" className="notice error">
          {error}
        </div>
      )}
      <div ref={host} className="osmd" />
      <div className="note-map" aria-label="Chọn vị trí nốt nhạc">
        {p.score.notes.map((n) => (
          <button
            key={n.id}
            onClick={() => p.onSelect(n.beat)}
            className={`note-chip ${Math.abs(n.beat - p.beat) < 0.1 ? "current" : ""} ${n.beat >= p.a && n.beat < p.b ? "in-loop" : ""} ${p.errors.has(n.id) ? "note-error" : ""}`}
            title={`Phách ${n.beat + 1}: ${noteName(n.midi)}`}
          >
            <span>
              {p.names
                ? noteName(n.midi)
                : `${Math.floor(n.beat / ((p.score.meter[0] * 4) / p.score.meter[1])) + 1}.${(n.beat % ((p.score.meter[0] * 4) / p.score.meter[1])) + 1}`}
            </span>
            {p.fingers && n.finger && <sup>{n.finger}</sup>}
          </button>
        ))}
      </div>
      {p.annotations.length > 0 && (
        <div className="score-annotations">
          {p.annotations.map((a, i) => (
            <button
              key={i}
              style={{ borderLeftColor: a.color }}
              onClick={() => p.onSelect(a.beat)}
            >
              Phách {a.beat + 1}
              {a.end ? `–${a.end + 1}` : ""} · {a.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
