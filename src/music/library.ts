import type { Score, ScoreNote } from "./model";
const melody = (
  values: number[],
  hand: "right" | "left" = "right",
  step = 1,
): ScoreNote[] =>
  values.map((midi, i) => ({
    id: `${hand}-${i}`,
    midi,
    beat: i * step,
    duration: step,
    hand,
    finger: (i % 5) + 1,
  }));
const score = (
  id: string,
  title: string,
  notes: ScoreNote[],
  level = "Beginner",
  bpm = 80,
): Score => ({
  id,
  title,
  notes,
  level,
  bpm,
  meter: [4, 4],
  composer: "Piano Learning",
  source: "Bài tập biên soạn cho dự án",
  license: "CC0 — bài tập gốc của dự án",
});
export const library: Score[] = [
  score(
    "first-notes",
    "Những nốt nhạc đầu tiên",
    melody([60, 62, 64, 65, 67, 65, 64, 62, 60, 60, 62, 64, 62, 60, 62, 60]),
  ),
  score(
    "five-fingers",
    "Năm ngón tay, một giai điệu",
    melody([60, 62, 64, 65, 67, 67, 65, 64, 62, 60, 60, 64, 62, 65, 64, 60]),
  ),
  score(
    "two-hands",
    "Cuộc trò chuyện của hai tay",
    [
      ...melody([
        60, 62, 64, 65, 67, 65, 64, 62, 60, 64, 67, 64, 62, 65, 64, 60,
      ]),
      ...melody([48, 55, 53, 55], "left", 4),
    ],
    "Elementary",
    72,
  ),
  score(
    "evening",
    "Khúc nhạc chiều",
    [
      ...melody([
        64, 67, 72, 71, 69, 67, 65, 64, 62, 65, 69, 67, 64, 62, 60, 60,
      ]),
      ...melody([48, 53, 55, 48], "left", 4),
    ],
    "Elementary",
    76,
  ),
  score(
    "scale-c",
    "Gam Đô trưởng",
    melody([
      60, 62, 64, 65, 67, 69, 71, 72, 71, 69, 67, 65, 64, 62, 60, 60,
    ]).map((n, i) => ({
      ...n,
      finger: [1, 2, 3, 1, 2, 3, 4, 5, 4, 3, 2, 1, 3, 2, 1, 1][i],
    })),
  ),
  score(
    "chords-c",
    "Hợp âm Đô – Fa – Sol",
    [
      ...[60, 64, 67].map((midi, i) => ({
        id: `c-${i}`,
        midi,
        beat: 0,
        duration: 4,
        hand: "right" as const,
      })),
      ...[60, 65, 69].map((midi, i) => ({
        id: `f-${i}`,
        midi,
        beat: 4,
        duration: 4,
        hand: "right" as const,
      })),
      ...[59, 62, 67].map((midi, i) => ({
        id: `g-${i}`,
        midi,
        beat: 8,
        duration: 4,
        hand: "right" as const,
      })),
      ...[60, 64, 67].map((midi, i) => ({
        id: `cc-${i}`,
        midi,
        beat: 12,
        duration: 4,
        hand: "right" as const,
      })),
    ],
    "Elementary",
    64,
  ),
  score(
    "arpeggio",
    "Dòng chảy Arpeggio",
    melody(
      [60, 64, 67, 72, 76, 72, 67, 64, 60, 64, 67, 72, 76, 72, 67, 64],
      "right",
      0.5,
    ),
    "Intermediate",
    90,
  ),
];
export interface Lesson {
  id: string;
  level: string;
  chapter: string;
  title: string;
  description: string;
  minutes: number;
  scoreId: string;
  body: string[];
  task: string;
}
export const levels = [
  "Beginner",
  "Elementary",
  "Intermediate",
  "Upper Intermediate",
  "Advanced",
];
export const lessons: Lesson[] = [
  {
    id: "posture",
    level: "Beginner",
    chapter: "01 · Làm quen với Piano",
    title: "Tư thế đúng, khởi đầu tốt",
    description: "Tìm sự thoải mái trước khi đặt tay lên phím.",
    minutes: 8,
    scoreId: "first-notes",
    body: [
      "Ngồi ở nửa trước ghế, giữ lưng tự nhiên và hai vai thả lỏng. Điều chỉnh ghế để cẳng tay gần song song với mặt phím.",
      "Đặt bàn chân vững trên sàn. Giữ cổ tay linh hoạt, không gồng hoặc ép cổ tay xuống.",
      "Số ngón: ngón cái là 1, ngón trỏ 2, ngón giữa 3, ngón áp út 4, ngón út 5. Số ngón giống nhau ở hai tay.",
    ],
    task: "Đặt tay lên nhóm năm phím Đô–Sol và chơi chậm, giữ vai thả lỏng.",
  },
  {
    id: "notes",
    level: "Beginner",
    chapter: "01 · Làm quen với Piano",
    title: "Những nốt nhạc đầu tiên",
    description: "Làm quen Đô, Rê, Mi, Fa, Sol trên đàn thật.",
    minutes: 12,
    scoreId: "first-notes",
    body: [
      "Tìm nhóm hai phím đen. Phím trắng ngay bên trái là Đô. Những phím trắng tiếp theo lần lượt là Rê, Mi, Fa và Sol.",
      "Ở khóa Sol, các dòng từ dưới lên là Mi–Sol–Si–Rê–Fa. Các khe từ dưới lên là Fa–La–Đô–Mi.",
      "Chơi từng nốt ở tốc độ thoải mái. Dùng chế độ chờ đúng nốt để kiểm tra cao độ trước khi quan tâm tới tốc độ.",
    ],
    task: "Kết nối MIDI và luyện hết bài ở chế độ chờ đúng nốt.",
  },
  {
    id: "pulse",
    level: "Beginner",
    chapter: "02 · Nhịp điệu đầu tiên",
    title: "Giữ nhịp cùng Metronome",
    description: "Cảm nhận phách đều và trường độ nốt đen.",
    minutes: 10,
    scoreId: "five-fingers",
    body: [
      "Trong nhịp 4/4 có bốn phách trong một ô nhịp; nốt đen thường tương ứng một phách.",
      "BPM là số phách mỗi phút. 60 BPM tương ứng một phách mỗi giây khi đơn vị phách là nốt đen.",
      "Nghe Count-in trước khi chơi. Bắt đầu chậm, giữ đều thay vì chạy nhanh rồi dừng.",
    ],
    task: "Chơi bài ở 60 BPM trong chế độ liên tục, xem lại lỗi thời điểm sau lượt luyện.",
  },
  {
    id: "coordination",
    level: "Elementary",
    chapter: "03 · Hai tay cùng chơi",
    title: "Cuộc trò chuyện của hai tay",
    description: "Giữ tay trái ổn định khi tay phải chuyển nốt.",
    minutes: 15,
    scoreId: "two-hands",
    body: [
      "Luyện riêng từng tay trước khi ghép hai tay. Xác định những vị trí hai tay bắt đầu cùng nhau.",
      "Tay trái giữ nốt dài trong khi tay phải tiếp tục di chuyển. Không thả nốt tay trái chỉ vì tay phải đổi nốt.",
      "Chọn đoạn A–B ngắn và lặp đủ chậm để giữ sự thoải mái.",
    ],
    task: "Luyện riêng tay trái, tay phải rồi ghép cả hai trong một đoạn bốn ô nhịp.",
  },
  {
    id: "scale",
    level: "Elementary",
    chapter: "04 · Gam và hợp âm",
    title: "Gam Đô trưởng và luồn ngón",
    description: "Một quãng tám với thế bấm cơ bản.",
    minutes: 15,
    scoreId: "scale-c",
    body: [
      "Gam Đô trưởng gồm Đô–Rê–Mi–Fa–Sol–La–Si–Đô, không có dấu thăng hoặc giáng.",
      "Tay phải đi lên thường dùng 1–2–3–1–2–3–4–5. Đưa ngón cái tới Fa nhẹ nhàng sau Mi.",
      "Chuyển động luồn ngón cần nhỏ và thoải mái; không xoắn cổ tay. MIDI chỉ kiểm tra nốt, không xác nhận ngón bạn sử dụng.",
    ],
    task: "Luyện gam chậm và nghe độ đều giữa các nốt.",
  },
  {
    id: "triads",
    level: "Elementary",
    chapter: "04 · Gam và hợp âm",
    title: "Hợp âm trưởng và đảo hợp âm",
    description: "Nghe và chơi Đô trưởng, Fa trưởng, Sol trưởng.",
    minutes: 12,
    scoreId: "chords-c",
    body: [
      "Hợp âm ba trưởng có cấu trúc quãng ba trưởng rồi quãng ba thứ. Đô trưởng gồm Đô–Mi–Sol.",
      "Đảo hợp âm thay đổi nốt thấp nhất nhưng giữ các âm của hợp âm. Chọn thế đảo có thể giảm khoảng di chuyển tay.",
      "Nhấn các nốt hợp âm gần đồng thời. Đừng cố ép tất cả ngón bằng lực lớn.",
    ],
    task: "Chơi hợp âm ở chế độ chờ và kiểm tra toàn bộ các nốt được nhận.",
  },
  {
    id: "arpeggios",
    level: "Intermediate",
    chapter: "05 · Dòng chảy kỹ thuật",
    title: "Arpeggio và chuyển vị trí",
    description: "Nối các âm hợp âm thành đường giai điệu.",
    minutes: 18,
    scoreId: "arpeggio",
    body: [
      "Arpeggio là chơi các âm hợp âm lần lượt thay vì cùng lúc. Xác định nốt gốc, quãng ba và quãng năm.",
      "Chuẩn bị vị trí tiếp theo sớm, di chuyển cánh tay cùng bàn tay. Không căng tay để với quá xa.",
      "Bắt đầu bằng từng nhóm ngắn. Tăng tốc dần khi các nốt đã đều; dừng nếu có đau hoặc căng kéo dài.",
    ],
    task: "Lặp hai ô nhịp rồi ghép thành câu dài.",
  },
  {
    id: "voicing",
    level: "Upper Intermediate",
    chapter: "06 · Độc lập bè",
    title: "Giữ bè giữa khi giai điệu chuyển động",
    description: "Đọc các bè và phân bổ thời gian luyện.",
    minutes: 20,
    scoreId: "evening",
    body: [
      "Đọc riêng từng bè để hiểu nốt nào cần giữ và nốt nào di chuyển. Nét nhạc không luôn trùng với cách chia khuông.",
      "Luyện từng cặp bè rồi thêm bè còn lại ở tempo thấp. Dùng chú thích để đánh dấu điểm cần chú ý.",
      "MIDI cung cấp velocity và thời điểm phím; kết quả đó không mô tả đầy đủ sắc thái âm thanh thực.",
    ],
    task: "Ghi chú hai vị trí cần giữ nốt và luyện lại bằng A–B.",
  },
  {
    id: "structure",
    level: "Advanced",
    chapter: "07 · Tự chủ luyện tập",
    title: "Phân tích cấu trúc và lập kế hoạch",
    description: "Chia tác phẩm thành mục tiêu có thể thực hiện.",
    minutes: 25,
    scoreId: "evening",
    body: [
      "Đọc tổng thể để xác định câu nhạc, chỗ lặp và thay đổi chất liệu. Đặt điểm A–B theo ý nhạc thay vì chia đều máy móc.",
      "Tách mục tiêu cao độ, nhịp, phối hợp và trường độ. Giữ tempo vừa sức khi xử lý vấn đề mới.",
      "Đánh giá bằng cả dữ liệu MIDI và việc lắng nghe trên đàn. Hệ thống không chấm phân tích biểu cảm nâng cao.",
    ],
    task: "Tạo lịch luyện và một mục tiêu kỹ năng cụ thể cho tác phẩm đang học.",
  },
];
export function makeScale(
  root = 60,
  minor = false,
  octaves = 1,
  hand: "left" | "right" = "right",
): Score {
  const intervals = minor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
  const up = Array.from(
    { length: octaves * 7 + 1 },
    (_, i) => root + Math.floor(i / 7) * 12 + intervals[i % 7],
  );
  const upFingers = up.map((_, i) =>
    hand === "right"
      ? i === up.length - 1
        ? 5
        : [1, 2, 3, 1, 2, 3, 4][i % 7]
      : i === 0
        ? 5
        : [4, 3, 2, 1, 3, 2, 1][(i - 1) % 7],
  );
  const fingers = [...upFingers, ...upFingers.slice(0, -1).reverse()];
  return score(
    `scale-${root}-${minor}-${octaves}-${hand}`,
    `Gam ${minor ? "thứ tự nhiên" : "trưởng"}`,
    melody([...up, ...up.slice(0, -1).reverse()], hand, 0.5).map((n, i) => ({
      ...n,
      finger: fingers[i],
    })),
    "Kỹ thuật",
    72,
  );
}
