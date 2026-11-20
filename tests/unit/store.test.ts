import { describe, expect, it, vi } from "vitest";
import { emptyData, snapshot, useLearning } from "../../src/features/store";

vi.hoisted(() => {
  vi.stubGlobal("window", {});
});
vi.mock("../../src/features/storage", () => ({
  durableStorage: {
    getItem: async () => null,
    setItem: async () => {},
    removeItem: async () => {},
  },
}));

const legacy = {
  ...emptyData,
  completed: ["notes"],
  ear: [{ at: "2026-01-01T00:00:00Z", correct: true, skill: "pitch" }],
  goals: [
    { id: "removed", kind: "skill", title: "Old goal", target: 5 },
    { id: "kept", kind: "minutes", title: "Practice", target: 30 },
  ],
};

describe("saved learning data", () => {
  it("removes retired fields and goals from snapshots without changing the input", () => {
    const data = snapshot(legacy as unknown as typeof emptyData);
    expect(data).not.toHaveProperty("ear");
    expect(data.goals.map((g) => g.id)).toEqual(["kept"]);
    expect(data.completed).toEqual(["notes"]);
    expect(legacy.goals).toHaveLength(2);
  });

  it("migrates old browser data and preserves the current store actions", async () => {
    const options = useLearning.persist.getOptions();
    const migrated = await options.migrate!(legacy, 1);
    const current = useLearning.getState();
    const merged = options.merge!(migrated, current);
    expect(merged).not.toHaveProperty("ear");
    expect(merged.goals.map((g) => g.id)).toEqual(["kept"]);
    expect(merged.completed).toEqual(["notes"]);
    expect(merged.replace).toBe(current.replace);
  });

  it("fills missing snapshot fields with defaults", () => {
    expect(snapshot()).toEqual(emptyData);
    expect(snapshot({ completed: ["notes"] })).toEqual({
      ...emptyData,
      completed: ["notes"],
    });
  });
});
