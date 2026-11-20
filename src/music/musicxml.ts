import { XMLParser, XMLValidator } from "fast-xml-parser";
import type { Score, ScoreNote } from "./model";

export const MAX_MUSICXML_BYTES = 5 * 1024 * 1024;
type Node = {
  [key: string]: Node[] | Record<string, string> | string | number;
};
const children = (node: Node, tag: string): Node[] =>
  (Array.isArray(node[tag]) ? node[tag] : []) as Node[];
const child = (nodes: Node[], tag: string) => nodes.find((node) => tag in node);
const text = (node: Node | undefined, tag: string) =>
  children(node || {}, tag)
    .map((value) => value["#text"] ?? "")
    .join("");
const attribute = (node: Node, name: string) =>
  String(
    (node[":@"] as Record<string, string> | undefined)?.[`@_${name}`] ?? "",
  );
function number(value: string, fallback?: number) {
  const n = value === "" ? fallback : Number(value);
  if (n === undefined || !Number.isFinite(n))
    throw new Error("MusicXML chứa số không hợp lệ.");
  return n;
}

/** Parse in document order so backup/forward, chords and simultaneous voices keep their timing. */
export function readMusicXML(xml: string, id: string): Score {
  if (!xml || new TextEncoder().encode(xml).length > MAX_MUSICXML_BYTES)
    throw new Error("Chọn MusicXML từ 1 byte đến 5 MB.");
  // Common notation exporters add an external DTD declaration. Strip the inert
  // declaration before parsing/storing; never resolve it or allow internal subsets.
  xml = xml.replace(
    /<!DOCTYPE\s+score-partwise\s+(?:PUBLIC|SYSTEM)\s+[^<>\[\]]*>/gi,
    "",
  );
  if (
    /<!DOCTYPE|<!ENTITY|<\s*(?:script|iframe|image|link)\b|\bxlink:href\s*=/i.test(
      xml,
    )
  )
    throw new Error(
      "MusicXML không được chứa DTD nội bộ, entity hoặc tài nguyên bên ngoài.",
    );
  if (/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-f]+;)/i.test(xml))
    throw new Error("MusicXML chứa entity chưa được hỗ trợ.");
  if (
    (xml.match(/</g) || []).length > 150000 ||
    XMLValidator.validate(xml) !== true
  )
    throw new Error("MusicXML không hợp lệ hoặc quá phức tạp.");
  const document = new XMLParser({
    preserveOrder: true,
    ignoreAttributes: false,
    parseTagValue: false,
    processEntities: true,
  }).parse(xml) as Node[];
  const root = child(document, "score-partwise");
  if (!root)
    throw new Error(
      "Chỉ hỗ trợ MusicXML score-partwise (.xml hoặc .musicxml).",
    );
  const content = children(root, "score-partwise");
  const parts = content.filter((node) => "part" in node);
  if (!parts.length || parts.length > 2)
    throw new Error("Cần bản nhạc Piano có một hoặc hai bè.");
  const notes: ScoreNote[] = [],
    tempos: { beat: number; bpm: number }[] = [];
  const pending = new Map<string, ScoreNote>();
  let meter: [number, number] = [4, 4],
    bpm = 80;
  parts.forEach((part, pi) => {
    let divisions = 1,
      start = 0,
      bar = 4;
    const measures = children(part, "part").filter((node) => "measure" in node);
    if (!measures.length) throw new Error("Không tìm thấy ô nhịp.");
    measures.forEach((measure, mi) => {
      let cursor = start,
        previous = start,
        furthest = start;
      for (const element of children(measure, "measure")) {
        if ("attributes" in element) {
          const attrs = children(element, "attributes");
          const div = child(attrs, "divisions");
          if (div) divisions = number(text(div, "divisions"));
          if (
            !Number.isInteger(divisions) ||
            divisions <= 0 ||
            divisions > 1000000
          )
            throw new Error("Divisions không hợp lệ.");
          if (child(attrs, "transpose"))
            throw new Error(
              "Hãy xuất bản nhạc ở cao độ thực, không dùng transpose.",
            );
          const time = child(attrs, "time");
          if (time) {
            const values = children(time, "time");
            const beats = number(text(child(values, "beats"), "beats"));
            const denominator = number(
              text(child(values, "beat-type"), "beat-type"),
            );
            if (
              !Number.isInteger(beats) ||
              beats < 1 ||
              beats > 32 ||
              ![1, 2, 4, 8, 16, 32].includes(denominator)
            )
              throw new Error("Số chỉ nhịp chưa được hỗ trợ.");
            if (mi === 0 && pi === 0) meter = [beats, denominator];
            else if (beats !== meter[0] || denominator !== meter[1])
              throw new Error(
                "Bản nhạc đổi số chỉ nhịp cần được tách thành từng bài.",
              );
            bar = (beats * 4) / denominator;
          }
          continue;
        }
        if (
          "barline" in element &&
          child(children(element, "barline"), "repeat")
        )
          throw new Error(
            "Hãy xuất MusicXML đã triển khai đầy đủ các đoạn lặp.",
          );
        if ("direction" in element) {
          const direction = children(element, "direction");
          const sound = child(direction, "sound");
          if (
            sound &&
            ["dacapo", "dalsegno", "tocoda", "fine"].some((key) =>
              attribute(sound, key),
            )
          )
            throw new Error(
              "Chưa hỗ trợ D.C., D.S. hoặc Coda. Hãy triển khai thành các ô nhịp liên tục.",
            );
          const metronome = child(
            children(
              child(direction, "direction-type") || {},
              "direction-type",
            ),
            "metronome",
          );
          const perMinute = text(
            child(children(metronome || {}, "metronome"), "per-minute"),
            "per-minute",
          );
          const tempo = attribute(sound || {}, "tempo") || perMinute;
          if (
            !attribute(sound || {}, "tempo") &&
            perMinute &&
            text(
              child(children(metronome || {}, "metronome"), "beat-unit"),
              "beat-unit",
            ) !== "quarter"
          )
            throw new Error("Hãy xuất tempo theo nốt đen.");
          if (tempo && pi === 0) {
            const value = number(tempo);
            if (value < 20 || value > 240)
              throw new Error("Tempo cần nằm trong khoảng 20–240 BPM.");
            tempos.push({ beat: cursor, bpm: value });
            if (cursor === 0) bpm = value;
          }
          continue;
        }
        const tag = ["note", "backup", "forward"].find((key) => key in element);
        if (!tag) continue;
        const values = children(element, tag);
        if (child(values, "grace"))
          throw new Error("Hãy đơn giản hóa nốt hoa mỹ trước khi tải lên.");
        const duration =
          number(text(child(values, "duration"), "duration")) / divisions;
        if (duration <= 0 || duration > 256)
          throw new Error("Trường độ không hợp lệ.");
        if (tag === "backup") {
          cursor -= duration;
          if (cursor < start - 0.001)
            throw new Error("Backup vượt quá đầu ô nhịp.");
          continue;
        }
        if (tag === "forward") {
          cursor += duration;
          furthest = Math.max(furthest, cursor);
          continue;
        }
        const chord = !!child(values, "chord"),
          at = chord ? previous : cursor;
        if (!chord) {
          previous = at;
          cursor += duration;
        }
        furthest = Math.max(furthest, at + duration);
        if (child(values, "rest")) continue;
        const pitch = children(child(values, "pitch") || {}, "pitch");
        if (!pitch.length)
          throw new Error("Chỉ hỗ trợ nốt nhạc có cao độ xác định.");
        const step = text(child(pitch, "step"), "step");
        const octave = number(text(child(pitch, "octave"), "octave"));
        const alter = number(text(child(pitch, "alter"), "alter"), 0);
        const midi =
          (octave + 1) * 12 +
          ({ C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[step] ?? NaN) +
          alter;
        if (
          !Number.isInteger(octave) ||
          !Number.isInteger(alter) ||
          !Number.isInteger(midi) ||
          midi < 0 ||
          midi > 127
        )
          throw new Error("Cao độ không hợp lệ.");
        const staff = number(text(child(values, "staff"), "staff"), 1);
        if (![1, 2].includes(staff))
          throw new Error("Chỉ hỗ trợ hai khuông Piano.");
        const voice = text(child(values, "voice"), "voice") || "1";
        const partKey = `${pi}:${staff}`;
        const tiedStop = values.some(
          (node) => "tie" in node && attribute(node, "type") === "stop",
        );
        // Track voices independently so ties cannot accidentally merge parallel notes.
        const key = `${partKey}:${voice}:${midi}`;
        const prior = tiedStop ? pending.get(key) : undefined;
        if (
          tiedStop &&
          (!prior || Math.abs(prior.beat + prior.duration - at) >= 0.001)
        )
          throw new Error("Dấu nối nốt không khớp. Hãy kiểm tra MusicXML gốc.");
        let note: ScoreNote;
        if (prior && Math.abs(prior.beat + prior.duration - at) < 0.001) {
          prior.duration += duration;
          note = prior;
        } else {
          note = {
            id: `${id}-${pi}-${mi}-${notes.length}`,
            midi,
            beat: at,
            duration,
            hand: (parts.length > 1 ? pi === 0 : staff === 1)
              ? "right"
              : "left",
            part: partKey,
          };
          notes.push(note);
        }
        if (
          values.some(
            (node) => "tie" in node && attribute(node, "type") === "start",
          )
        )
          pending.set(key, note);
        else pending.delete(key);
        if (notes.length > 20000)
          throw new Error("Bản nhạc vượt giới hạn 20.000 nốt.");
      }
      start =
        mi === 0 && attribute(measure, "implicit") === "yes"
          ? furthest
          : Math.max(start + bar, furthest);
      if (start > 100000) throw new Error("Bản nhạc quá dài.");
    });
  });
  if (!notes.length) throw new Error("Bản nhạc phải có ít nhất một nốt.");
  if (pending.size) throw new Error("Dấu nối nốt chưa có điểm kết thúc.");
  if (!tempos.length || tempos[0].beat > 0) tempos.unshift({ beat: 0, bpm });
  const work = children(child(content, "work") || {}, "work");
  const identification = children(
    child(content, "identification") || {},
    "identification",
  );
  const composer = identification.find(
    (node) => "creator" in node && attribute(node, "type") === "composer",
  );
  return {
    id,
    title:
      text(child(work, "work-title"), "work-title") ||
      text(child(content, "movement-title"), "movement-title") ||
      "Bản nhạc mới",
    composer: text(composer, "creator") || "Chưa rõ tác giả",
    level: "Beginner",
    bpm,
    meter,
    notes,
    tempos,
    xml,
    source: "Thư viện hệ thống",
    license: "",
  };
}
