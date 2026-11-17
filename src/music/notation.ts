import type { Score, ScoreNote } from "./model";
const esc = (s: string) =>
  s.replace(
    /[<>&"']/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
const pitch = (midi: number) => {
  const steps = ["C", "C", "D", "D", "E", "F", "F", "G", "G", "A", "A", "B"];
  return `<pitch><step>${steps[midi % 12]}</step>${[1, 3, 6, 8, 10].includes(midi % 12) ? "<alter>1</alter>" : ""}<octave>${Math.floor(midi / 12) - 1}</octave></pitch>`;
};
function durationType(duration: number) {
  const values: Record<number, [string, boolean]> = {
    0.25: ["16th", false],
    0.5: ["eighth", false],
    0.75: ["eighth", true],
    1: ["quarter", false],
    1.5: ["quarter", true],
    2: ["half", false],
    3: ["half", true],
    4: ["whole", false],
  };
  const value = values[duration];
  if (!value)
    throw new Error(
      "Trường độ cần ký âm nối nốt phức tạp. Hãy dùng bản MusicXML gốc.",
    );
  return `<type>${value[0]}</type>${value[1] ? "<dot/>" : ""}`;
}
function rests(duration: number) {
  let xml = "";
  for (const d of [4, 3, 2, 1.5, 1, 0.75, 0.5, 0.25]) {
    while (duration >= d - 0.001) {
      xml += `<note><rest/><duration>${Math.round(d * 480)}</duration>${durationType(d)}</note>`;
      duration -= d;
    }
  }
  if (duration > 0.001) throw new Error("Khoảng lặng không khớp lưới 1/16.");
  return xml;
}
export function toMusicXML(score: Score): string {
  const bar = (score.meter[0] * 4) / score.meter[1];
  const end = Math.max(bar, ...score.notes.map((n) => n.beat + n.duration));
  const parts = (["right", "left"] as const)
    .map((hand, p) => {
      let measures = "";
      for (let m = 0; m < Math.ceil(end / bar); m++) {
        const notes = score.notes
          .filter(
            (n) =>
              n.hand === hand && n.beat >= m * bar && n.beat < (m + 1) * bar,
          )
          .sort((a, b) => a.beat - b.beat || a.midi - b.midi);
        let cursor = m * bar,
          body = "",
          lastBeat = -1;
        for (const n of notes) {
          if (n.beat > cursor) {
            const d = n.beat - cursor;
            body += rests(d);
          }
          const chord = n.beat === lastBeat;
          body += `<note id="${esc(n.id)}">${chord ? "<chord/>" : ""}${pitch(n.midi)}<duration>${Math.round(n.duration * 480)}</duration>${durationType(n.duration)}${n.finger ? `<notations><technical><fingering>${n.finger}</fingering></technical></notations>` : ""}</note>`;
          cursor = Math.max(cursor, n.beat + n.duration);
          lastBeat = n.beat;
        }
        if (cursor < (m + 1) * bar) {
          const d = (m + 1) * bar - cursor;
          body += rests(d);
        }
        measures += `<measure number="${m + 1}">${m === 0 ? `<attributes><divisions>480</divisions><key><fifths>0</fifths></key><time><beats>${score.meter[0]}</beats><beat-type>${score.meter[1]}</beat-type></time><clef><sign>${p === 0 ? "G" : "F"}</sign><line>${p === 0 ? 2 : 4}</line></clef></attributes><direction><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>${score.bpm}</per-minute></metronome></direction-type><sound tempo="${score.bpm}"/></direction>` : ""}${body}</measure>`;
      }
      return `<part id="P${p + 1}">${measures}</part>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="4.0"><work><work-title>${esc(score.title)}</work-title></work><identification><creator type="composer">${esc(score.composer)}</creator></identification><part-list><score-part id="P1"><part-name>Tay phải</part-name></score-part><score-part id="P2"><part-name>Tay trái</part-name></score-part></part-list>${parts}</score-partwise>`;
}
export function parseMusicXML(xml: string, id: string): Score {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml))
    throw new Error("MusicXML không được chứa DTD hoặc entity bên ngoài.");
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (
    doc.querySelector("parsererror") ||
    doc.documentElement.localName !== "score-partwise"
  )
    throw new Error("Cần file MusicXML score-partwise hợp lệ.");
  if (doc.getElementsByTagName("*").length > 150000)
    throw new Error("Bản nhạc vượt giới hạn 150.000 phần tử.");
  const notes: ScoreNote[] = [],
    tempos: { beat: number; bpm: number }[] = [];
  let meter: [number, number] = [4, 4],
    bpm = 80;
  const parts = [...doc.querySelectorAll("score-partwise > part")];
  if (!parts.length) throw new Error("Không tìm thấy bè nhạc.");
  parts.forEach((part, pi) => {
    let divisions = 1,
      measureStart = 0,
      bar = 4;
    [...part.querySelectorAll(":scope > measure")].forEach((measure, mi) => {
      const d = Number(
        measure.querySelector("attributes > divisions")?.textContent,
      );
      if (d > 0) divisions = d;
      const beats = Number(measure.querySelector("time > beats")?.textContent),
        denominator = Number(
          measure.querySelector("time > beat-type")?.textContent,
        );
      if (beats && denominator) {
        if (mi === 0 && pi === 0) meter = [beats, denominator];
        bar = (beats * 4) / denominator;
      }
      let cursor = measureStart,
        previous = measureStart,
        furthest = measureStart;
      for (const el of [...measure.children]) {
        if (el.tagName === "direction" && pi === 0) {
          const tempo = Number(
            el.querySelector("sound")?.getAttribute("tempo") ||
              el.querySelector("per-minute")?.textContent,
          );
          if (tempo > 0) {
            tempos.push({ beat: cursor, bpm: tempo });
            if (!notes.length) bpm = tempo;
          }
        }
        const duration =
          Number(el.querySelector(":scope > duration")?.textContent || 0) /
          divisions;
        if (el.tagName === "backup") {
          cursor -= duration;
          continue;
        }
        if (el.tagName === "forward") {
          cursor += duration;
          continue;
        }
        if (el.tagName !== "note") continue;
        if (el.querySelector("grace"))
          throw new Error(
            "Nốt hoa mỹ cần được đơn giản hóa trước khi nhập ở phiên bản này.",
          );
        const chord = !!el.querySelector("chord"),
          at = chord ? previous : cursor;
        if (!chord) {
          previous = at;
          cursor += duration;
        }
        furthest = Math.max(furthest, cursor);
        const step = el.querySelector("pitch > step")?.textContent;
        if (!step) continue;
        const octave = Number(el.querySelector("pitch > octave")?.textContent),
          alter = Number(el.querySelector("pitch > alter")?.textContent || 0);
        const midi =
          (octave + 1) * 12 +
          ({ C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[step] ?? NaN) +
          alter;
        if (!Number.isInteger(midi) || midi < 0 || midi > 127 || duration <= 0)
          throw new Error("Nốt nhạc có cao độ hoặc trường độ không hợp lệ.");
        const staff = Number(el.querySelector("staff")?.textContent || 1);
        const hand =
          parts.length > 1
            ? pi === 0
              ? "right"
              : "left"
            : staff === 2
              ? "left"
              : "right";
        const stop = [...el.querySelectorAll("tie")].some(
          (t) => t.getAttribute("type") === "stop",
        );
        const prior = stop
          ? [...notes]
              .reverse()
              .find(
                (n) =>
                  n.midi === midi &&
                  n.part === `${pi}:${staff}` &&
                  Math.abs(n.beat + n.duration - at) < 0.001,
              )
          : undefined;
        if (prior) prior.duration += duration;
        else
          notes.push({
            id: `${id}-${pi}-${mi}-${notes.length}`,
            midi,
            beat: at,
            duration,
            hand,
            part: `${pi}:${staff}`,
            finger:
              Number(el.querySelector("fingering")?.textContent) || undefined,
          });
      }
      measureStart =
        mi === 0 && measure.getAttribute("implicit") === "yes"
          ? furthest
          : Math.max(measureStart + bar, furthest);
    });
  });
  if (!notes.length || notes.length > 20000)
    throw new Error("Bản nhạc cần có từ 1 đến 20.000 nốt.");
  if (!tempos.length || tempos[0].beat > 0) tempos.unshift({ beat: 0, bpm });
  return {
    id,
    title:
      doc.querySelector("work-title, movement-title")?.textContent ||
      "Bản nhạc tải lên",
    composer:
      doc.querySelector('creator[type="composer"]')?.textContent ||
      "Chưa rõ tác giả",
    level: "Cá nhân",
    bpm,
    meter,
    notes,
    xml,
    tempos,
    source: "Tệp cá nhân",
    license: "Người tải lên chịu trách nhiệm quyền sử dụng",
    imported: true,
  };
}
