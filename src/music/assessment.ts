export interface TheoryQuestion {
  prompt: string;
  options: string[];
  correct: number;
  explanation: string;
}
export const questions: TheoryQuestion[] = [
  {
    prompt: "Ngón cái được đánh số mấy?",
    options: ["1", "2", "4", "5"],
    correct: 0,
    explanation: "Ngón cái là 1 ở cả hai tay.",
  },
  {
    prompt: "Phím trắng ngay bên trái nhóm hai phím đen là nốt nào?",
    options: ["Rê", "Đô", "Mi", "Sol"],
    correct: 1,
    explanation: "Đô nằm ngay bên trái nhóm hai phím đen.",
  },
  {
    prompt: "Trong nhịp 4/4, một ô nhịp thường có bao nhiêu phách nốt đen?",
    options: ["2", "3", "4", "6"],
    correct: 2,
    explanation: "Tử số 4 chỉ bốn phách; mẫu số 4 ứng với nốt đen.",
  },
  {
    prompt: "Gam Đô trưởng có các dấu hóa nào?",
    options: [
      "Một dấu thăng",
      "Hai dấu giáng",
      "Không có dấu thăng/giáng",
      "Ba dấu thăng",
    ],
    correct: 2,
    explanation: "Đô trưởng gồm các phím trắng Đô–Rê–Mi–Fa–Sol–La–Si.",
  },
  {
    prompt: "Đô trưởng gồm ba âm nào?",
    options: ["Đô–Mi–Sol", "Đô–Mi♭–Sol", "Rê–Fa–La", "Đô–Fa–Sol"],
    correct: 0,
    explanation:
      "Hợp âm Đô trưởng gồm nốt gốc Đô, quãng ba trưởng Mi và quãng năm Sol.",
  },
  {
    prompt: "Arpeggio có nghĩa là gì?",
    options: [
      "Chơi mọi nốt cùng lúc",
      "Chơi lần lượt các âm hợp âm",
      "Chỉ chơi tay trái",
      "Tăng âm lượng",
    ],
    correct: 1,
    explanation: "Arpeggio triển khai các âm hợp âm nối tiếp nhau.",
  },
  {
    prompt: "MIDI thông thường có xác nhận ngón tay thực tế không?",
    options: [
      "Luôn xác nhận được",
      "Chỉ ngón tay phải",
      "Không xác nhận được",
      "Chỉ khi dùng pedal",
    ],
    correct: 2,
    explanation:
      "MIDI truyền thông tin phím và điều khiển, không xác định ngón tay thực tế.",
  },
];
