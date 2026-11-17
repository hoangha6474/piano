import { Midi } from "@tonejs/midi";
import type { Score } from "./model";
import { parseMusicXML, toMusicXML } from "./notation";
export const MAX_UPLOAD = 5 * 1024 * 1024;
export async function importScore(file: File): Promise<Score> {
  if (!file.size || file.size > MAX_UPLOAD)
    throw new Error("Chọn tệp MIDI/MusicXML từ 1 byte đến 5 MB.");
  const id = crypto.randomUUID(),
    extension = file.name.split(".").pop()?.toLowerCase();
  if (["xml", "musicxml"].includes(extension || ""))
    return parseMusicXML(await file.text(), id);
  if (!["mid", "midi"].includes(extension || ""))
    throw new Error(
      "Hỗ trợ .mid, .midi, .xml, .musicxml. Tệp .mxl cần giải nén trước.",
    );
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (String.fromCharCode(...bytes.slice(0, 4)) !== "MThd")
    throw new Error("Header MIDI không hợp lệ.");
  const midi = new Midi(bytes),
    ppq = midi.header.ppq;
  const notes = midi.tracks.flatMap((track, ti) =>
    track.notes.map((n, ni) => ({
      id: `${id}-${ti}-${ni}`,
      midi: n.midi,
      beat: Math.round((n.ticks / ppq) * 4) / 4,
      duration: Math.max(0.25, Math.round((n.durationTicks / ppq) * 4) / 4),
      hand: (midi.tracks.filter((t) => t.notes.length).length > 1
        ? ti === 0
          ? "right"
          : "left"
        : n.midi < 60
          ? "left"
          : "right") as "left" | "right",
      velocity: n.velocity,
      part: `track-${ti}`,
    })),
  );
  if (!notes.length || notes.length > 20000)
    throw new Error("MIDI cần có từ 1 đến 20.000 nốt.");
  const score: Score = {
    id,
    title: midi.name || file.name.replace(/\.(mid|midi)$/i, ""),
    composer: "Chưa rõ tác giả",
    bpm: midi.header.tempos[0]?.bpm || 80,
    meter: (midi.header.timeSignatures[0]?.timeSignature as [
      number,
      number,
    ]) || [4, 4],
    notes,
    tempos: midi.header.tempos.map((t) => ({
      beat: t.ticks / ppq,
      bpm: t.bpm,
    })),
    level: "Cá nhân",
    source: "MIDI cá nhân — ký âm lượng tử hóa 1/16",
    license: "Người tải lên chịu trách nhiệm quyền sử dụng",
    imported: true,
  };
  // A truthful bounded converter: do not silently engrave overlapping voices or cross-bar ties incorrectly.
  const bar = (score.meter[0] * 4) / score.meter[1];
  for (const hand of ["left", "right"]) {
    const sorted = notes
      .filter((n) => n.hand === hand)
      .sort((a, b) => a.beat - b.beat);
    for (let i = 0; i < sorted.length; i++) {
      const n = sorted[i],
        prior = sorted[i - 1];
      if (
        Math.floor((n.beat + 0.0001) / bar) !==
          Math.floor((n.beat + n.duration - 0.0001) / bar) ||
        (prior &&
          n.beat > prior.beat &&
          n.beat < prior.beat + prior.duration - 0.001)
      )
        throw new Error(
          "MIDI có bè chồng hoặc nốt nối qua ô nhịp. Hãy xuất MusicXML từ phần mềm ký âm để giữ đúng bản nhạc.",
        );
    }
  }
  score.xml = toMusicXML(score);
  return score;
}
