import { noteName } from "./model";
export type EarKind =
  | "note"
  | "height"
  | "interval"
  | "chord"
  | "melody"
  | "rhythm"
  | "memory"
  | "direction";
export const earKinds: { id: EarKind; title: string; description: string }[] = [
  {
    id: "note",
    title: "Nhận diện nốt",
    description: "Nghe một nốt và tìm đúng tên.",
  },
  {
    id: "height",
    title: "Cao hơn hay thấp hơn?",
    description: "So sánh cao độ hai nốt.",
  },
  {
    id: "interval",
    title: "Nhận diện quãng",
    description: "Nghe khoảng cách giữa hai nốt.",
  },
  {
    id: "chord",
    title: "Màu sắc hợp âm",
    description: "Phân biệt hợp âm trưởng và thứ.",
  },
  {
    id: "melody",
    title: "Nghe và chơi giai điệu",
    description: "Lặp lại giai điệu trên đàn MIDI.",
  },
  {
    id: "rhythm",
    title: "Nhận diện tiết tấu",
    description: "Nghe và phân biệt các mẫu trường độ.",
  },
  {
    id: "memory",
    title: "Ghi nhớ chuỗi nốt",
    description: "Ghi nhớ rồi chơi lại chuỗi âm.",
  },
  {
    id: "direction",
    title: "Hướng giai điệu",
    description: "Nhận ra giai điệu đi lên hoặc đi xuống.",
  },
];
export interface EarQuestion {
  kind: EarKind;
  events: { notes: number[]; duration: number }[];
  answer: string;
  choices: string[];
  explanation: string;
  expected: number[];
}
const shuffle = <T>(a: T[]) =>
  a
    .map((x) => ({ x, k: Math.random() }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.x);
export function makeQuestion(
  kind: EarKind,
  min: number,
  max: number,
  difficulty: number,
): EarQuestion {
  const root = Math.min(
      max - 12,
      Math.max(
        min,
        min + Math.floor(Math.random() * Math.max(1, max - min - 12)),
      ),
    ),
    q: EarQuestion = {
      kind,
      events: [],
      answer: "",
      choices: [],
      explanation: "",
      expected: [],
    };
  if (kind === "note") {
    const n = min + Math.floor(Math.random() * (max - min + 1));
    q.expected = [n];
    q.answer = noteName(n);
    q.choices = shuffle(
      [
        ...new Set([
          n,
          Math.max(min, n - 2),
          Math.min(max, n + 2),
          Math.min(max, n + 4),
          Math.max(min, n - 4),
        ]),
      ]
        .slice(0, 4)
        .map(noteName),
    );
    q.events = [{ notes: [n], duration: 1 }];
    q.explanation = `Nốt vừa nghe là ${noteName(n)}. Hãy đối chiếu với vị trí nốt trên đàn.`;
  } else if (kind === "height" || kind === "direction") {
    const up = Math.random() > 0.5,
      delta = difficulty + 2;
    const notes =
      kind === "height"
        ? [root + (up ? 0 : delta), root + (up ? delta : 0)]
        : Array.from({ length: 4 }, (_, i) => root + (up ? i : 3 - i) * 2);
    q.expected = notes;
    q.answer = up ? "Đi lên" : "Đi xuống";
    q.choices = ["Đi lên", "Đi xuống"];
    q.events = notes.map((n) => ({ notes: [n], duration: 0.6 }));
    q.explanation = `Chuỗi âm ${notes.map(noteName).join(" → ")} ${q.answer.toLowerCase()}.`;
  } else if (kind === "interval") {
    const all = [
        { n: 2, s: "Quãng 2 trưởng" },
        { n: 3, s: "Quãng 3 thứ" },
        { n: 4, s: "Quãng 3 trưởng" },
        { n: 5, s: "Quãng 4 đúng" },
        { n: 7, s: "Quãng 5 đúng" },
        { n: 12, s: "Quãng 8 đúng" },
      ],
      pool = all.slice(0, difficulty === 1 ? 4 : 6),
      choice = pool[Math.floor(Math.random() * pool.length)];
    q.expected = [root, root + choice.n];
    q.events = q.expected.map((n) => ({ notes: [n], duration: 0.8 }));
    q.answer = choice.s;
    q.choices = shuffle([
      choice,
      ...shuffle(pool.filter((x) => x !== choice)).slice(0, 3),
    ]).map((x) => x.s);
    q.explanation = `Hai âm cách nhau ${choice.n} bán cung: ${choice.s.toLowerCase()}.`;
  } else if (kind === "chord") {
    const types = [
        { s: "Trưởng", n: [0, 4, 7] },
        { s: "Thứ", n: [0, 3, 7] },
        { s: "Bảy át", n: [0, 4, 7, 10] },
        { s: "Giảm", n: [0, 3, 6] },
      ].slice(0, difficulty === 1 ? 2 : 4),
      chord = types[Math.floor(Math.random() * types.length)];
    q.expected = chord.n.map((n) => root + n);
    q.events = [{ notes: q.expected, duration: 1.5 }];
    q.answer = chord.s;
    q.choices = types.map((t) => t.s);
    q.explanation = `Hợp âm ${chord.s.toLowerCase()} có các âm ${q.expected.map(noteName).join(" – ")}; cấu trúc bán cung ${chord.n.join("–")}.`;
  } else if (kind === "rhythm") {
    const patterns = [
        { s: "Đều: 1 – 1 – 1 – 1", d: [1, 1, 1, 1] },
        { s: "Ngắn ngắn dài: ½ – ½ – 1", d: [0.5, 0.5, 1] },
        { s: "Dài ngắn ngắn: 1 – ½ – ½", d: [1, 0.5, 0.5] },
        { s: "Dài đều: 2 – 2", d: [2, 2] },
      ],
      pattern = patterns[Math.floor(Math.random() * patterns.length)];
    q.expected = pattern.d.map(() => root);
    q.events = pattern.d.map((d) => ({ notes: [root], duration: d * 0.6 }));
    q.answer = pattern.s;
    q.choices = patterns.map((p) => p.s);
    q.explanation = `Mẫu vừa nghe: ${pattern.s}. Đơn vị một phách dài 0,6 giây.`;
  } else {
    const scale = [0, 2, 4, 5, 7, 9, 11, 12],
      sequence = Array.from(
        { length: difficulty + 2 },
        () => root + scale[Math.floor(Math.random() * scale.length)],
      );
    q.expected = sequence;
    q.events = sequence.map((n) => ({ notes: [n], duration: 0.6 }));
    q.answer = sequence.map(noteName).join(" → ");
    q.choices = [];
    q.explanation = `Chuỗi nốt: ${q.answer}. Hãy nghe từng nhóm và tìm hướng chuyển động.`;
  }
  return q;
}
