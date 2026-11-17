"use client";
import { useState } from "react";
import { Sparkles, Send, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { PageHeading, Card } from "@/components/ui";
import { useLearning } from "./store";
interface Message {
  role: "user" | "assistant";
  text: string;
  steps?: string[];
}
export function Tutor() {
  const [messages, setMessages] = useState<Message[]>([]),
    [question, setQuestion] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const results = useLearning((s) => s.results);
  const send = async (text = question) => {
    if (!text.trim() || busy) return;
    setQuestion("");
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          context: JSON.stringify(
            results.slice(0, 2).map((r) => ({
              title: r.title,
              bpm: r.bpm,
              hand: r.hand,
              mode: r.mode,
              metrics: {
                measurements: r.evaluation.measurements,
                accuracy: r.evaluation.accuracy,
                expected: r.evaluation.expected,
                matched: r.evaluation.matched,
                incomplete: r.evaluation.incomplete,
                errors: r.evaluation.results
                  .filter((e) => e.type !== "correct")
                  .slice(0, 20),
              },
            })),
          ),
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Chưa nhận được phản hồi.");
      setMessages((m) => [
        ...m,
        { role: "user", text },
        { role: "assistant", text: data.explanation, steps: data.steps },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không kết nối được AI Tutor.");
      setQuestion(text);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <PageHeading
        eyebrow="AI GIÁO VIÊN PIANO"
        title="Có người đồng hành cùng bạn."
        description="Đặt câu hỏi về nhạc lý, cách luyện và dữ liệu MIDI của những lượt gần nhất."
      />
      <div className="tutor-layout">
        <Card className="tutor-panel">
          {!messages.length && (
            <div className="tutor-welcome">
              <span className="tutor-symbol">
                <Sparkles size={29} />
              </span>
              <h2>Mình cùng tháo gỡ một chút nhé.</h2>
              <p>
                Bạn có thể hỏi một điều nhỏ, hoặc tìm cách luyện hiệu quả hơn từ
                những lỗi vừa gặp.
              </p>
              <div className="suggestions">
                {[
                  "Tôi nên luyện hai tay như thế nào?",
                  "Giải thích lỗi nhịp ở lượt gần nhất.",
                  "Gam trưởng và gam thứ khác nhau ra sao?",
                ].map((q) => (
                  <button key={q} onClick={() => setQuestion(q)}>
                    {q}
                    <ArrowUpRight size={16} />
                  </button>
                ))}
              </div>
            </div>
          )}
          <div aria-live="polite" className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-message ${m.role}`}>
                <span>{m.role === "user" ? "BẠN" : "PIANO TUTOR"}</span>
                <p>{m.text}</p>
                {m.steps && (
                  <ol>
                    {m.steps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                )}
              </div>
            ))}
          </div>
          {error && (
            <div className="notice error" role="alert">
              {error}
              <Link href="/settings" className="text-button">
                Kiểm tra tài khoản và dịch vụ
                <ArrowUpRight size={15} />
              </Link>
            </div>
          )}
          <form
            className="chat-form"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <textarea
              aria-label="Câu hỏi cho AI Tutor"
              maxLength={2000}
              rows={2}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Điều gì đang làm bạn băn khoăn khi luyện đàn?"
            />
            <button
              className="button primary"
              disabled={busy || !question.trim()}
            >
              {busy ? (
                "Đang suy nghĩ…"
              ) : (
                <>
                  <Send size={17} />
                  Gửi
                </>
              )}
            </button>
          </form>
          <p className="footnote">
            AI giải thích số liệu, không tự chấm lại điểm. Cần tài khoản, Neon
            và API AI đã cấu hình.
          </p>
        </Card>
        <Card className="tutor-context">
          <h3>Ngữ cảnh được sử dụng</h3>
          {results[0] ? (
            <>
              <span className="tag">Lượt gần nhất</span>
              <h4>{results[0].title}</h4>
              <p>
                {results[0].bpm} BPM · {results[0].evaluation.accuracy}% nốt
                khớp
              </p>
              <p className="muted">
                Chỉ gửi tóm tắt tối đa hai lượt luyện và lỗi cần thiết. Không
                gửi toàn bộ sự kiện MIDI.
              </p>
            </>
          ) : (
            <p className="muted">
              Chưa có lượt luyện. AI vẫn có thể giải thích nhạc lý nếu dịch vụ
              đã được cấu hình.
            </p>
          )}
          <hr />
          <p className="muted">
            Câu trả lời AI có thể sai. Đối chiếu hướng dẫn với bài học và dữ
            liệu trên bản nhạc.
          </p>
        </Card>
      </div>
    </>
  );
}
