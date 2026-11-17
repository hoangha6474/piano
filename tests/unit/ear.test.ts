import { describe, it, expect } from "vitest";
import { earKinds, makeQuestion } from "../../src/music/ear";
describe("ear training question generation", () => {
  it("keeps every stimulus within the selected pitch range, with its answer among the choices", () => {
    for (const kind of earKinds)
      for (let i = 0; i < 30; i++) {
        const q = makeQuestion(kind.id, 60, 84, 3);
        expect(q.expected.length).toBeGreaterThan(0);
        expect(q.expected.every((n) => n >= 60 && n <= 84)).toBe(true);
        if (q.choices.length) expect(q.choices).toContain(q.answer);
      }
  });
});
