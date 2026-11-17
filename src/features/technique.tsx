"use client";
import { useState } from "react";
import { makeScale } from "@/music/library";
import type { Score, ScoreNote } from "@/music/model";
import { Practice } from "./practice";
import { Card } from "@/components/ui";
export function Technique() {
  const [root, setRoot] = useState(60),
    [kind, setKind] = useState("major"),
    [octaves, setOctaves] = useState(1),
    [both, setBoth] = useState(false),
    [inversion, setInversion] = useState(0);
  let score: Score = makeScale(root, kind === "minor", octaves);
  if (!["major", "minor"].includes(kind)) {
    let tones =
      kind === "minor-chord"
        ? [0, 3, 7]
        : kind === "seventh"
          ? [0, 4, 7, 10]
          : [0, 4, 7];
    tones = tones
      .map((t, i) => root + t + (i < inversion ? 12 : 0))
      .sort((a, b) => a - b);
    const arpeggio = kind === "arpeggio",
      progression = kind === "progression";
    const notes: ScoreNote[] = arpeggio
      ? Array.from({ length: 16 }, (_, i) => ({
          id: `arp-${i}`,
          midi:
            tones[i % tones.length] + (Math.floor(i / tones.length) % 2) * 12,
          beat: i * 0.5,
          duration: 0.5,
          hand: "right",
          finger: [1, 2, 3, 5][i % 4],
        }))
      : Array.from({ length: 4 }, (_, bar) =>
          tones.map((midi, i) => ({
            id: `chord-${bar}-${i}`,
            midi: midi + (progression ? [0, 5, 7, 0][bar] : 0),
            beat: bar * 4,
            duration: 4,
            hand: "right" as const,
            finger: [1, 3, 5, 4][i],
          })),
        ).flat();
    score = {
      ...score,
      id: `tech-${root}-${kind}-${inversion}`,
      title:
        kind === "arpeggio"
          ? "Luyện Arpeggio"
          : kind === "progression"
            ? "Chuyển hợp âm I–IV–V–I"
            : kind === "seventh"
              ? "Hợp âm bảy át"
              : kind === "minor-chord"
                ? "Hợp âm ba thứ"
                : "Hợp âm ba trưởng",
      notes,
    };
  }
  if (both)
    score = {
      ...score,
      id: score.id + "-both",
      notes: [
        ...score.notes,
        ...(["major", "minor"].includes(kind)
          ? makeScale(root - 12, kind === "minor", octaves, "left").notes
          : score.notes.map((n) => ({
              ...n,
              id: n.id + "-left",
              midi: n.midi - 12,
              hand: "left" as const,
              finger: n.finger ? 6 - n.finger : undefined,
            }))),
      ],
    };
  return (
    <>
      <Card className="technique-config">
        <h3>Gam & hợp âm · Chọn bài luyện</h3>
        <div className="form-grid">
          <label>
            Nốt gốc
            <select
              value={root}
              onChange={(e) => setRoot(Number(e.target.value))}
            >
              {[
                "Đô",
                "Đô♯",
                "Rê",
                "Mi♭",
                "Mi",
                "Fa",
                "Fa♯",
                "Sol",
                "La♭",
                "La",
                "Si♭",
                "Si",
              ].map((n, i) => (
                <option key={n} value={60 + i}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label>
            Dạng bài
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="major">Gam trưởng</option>
              <option value="minor">Gam thứ tự nhiên</option>
              <option value="chord">Hợp âm trưởng</option>
              <option value="minor-chord">Hợp âm thứ</option>
              <option value="seventh">Hợp âm bảy át</option>
              <option value="progression">Chuyển hợp âm</option>
              <option value="arpeggio">Arpeggio</option>
            </select>
          </label>
          <label>
            Quãng tám
            <select
              value={octaves}
              onChange={(e) => setOctaves(Number(e.target.value))}
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </label>
          <label>
            Thế đảo
            <select
              value={inversion}
              onChange={(e) => setInversion(Number(e.target.value))}
            >
              <option value={0}>Gốc</option>
              <option value={1}>Đảo 1</option>
              <option value={2}>Đảo 2</option>
            </select>
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={both}
              onChange={(e) => setBoth(e.target.checked)}
            />
            Hai tay cách một quãng tám
          </label>
        </div>
        <p className="muted">
          Thế bấm tự động là gợi ý để sửa, chưa tối ưu cho mọi giọng và hai tay.
          Thực hành trên đàn MIDI; không có bàn phím ảo.
        </p>
      </Card>
      <Practice key={`${score.id}-${octaves}`} score={score} />
    </>
  );
}
