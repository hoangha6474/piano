"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Score } from "@/music/model";
import type { Evaluation } from "@/music/evaluation";
import { durableStorage } from "./storage";
export interface SessionResult {
  id: string;
  scoreId: string;
  title: string;
  at: string;
  seconds: number;
  hand: string;
  bpm: number;
  mode: string;
  evaluation: Evaluation;
}
export interface Annotation {
  id: string;
  scoreId: string;
  beat: number;
  end?: number;
  text: string;
  color: string;
  hand: string;
}
export interface Plan {
  id: string;
  title: string;
  date: string;
  time: string;
  repeat: "none" | "daily" | "weekly";
  minutes: number;
  scoreId: string;
  doneDates: string[];
  remind: boolean;
}
export interface Goal {
  id: string;
  kind: "minutes" | "accuracy" | "lessons" | "skill";
  target: number;
  title: string;
}
interface Data {
  completed: string[];
  lastLesson: string;
  results: SessionResult[];
  scores: Score[];
  annotations: Annotation[];
  fingers: Record<string, number>;
  assignments: Record<string, "left" | "right">;
  mastered: string[];
  segments: Record<string, { a: number; b: number }>;
  preferences: Record<string, { bpm: number; hand: string }>;
  plans: Plan[];
  goals: Goal[];
  ear: { at: string; correct: boolean; skill: string }[];
}
export type Snapshot = Data;
interface State extends Data {
  ready: boolean;
  markReady: () => void;
  complete: (id: string) => void;
  resume: (id: string) => void;
  addResult: (r: SessionResult) => void;
  addScore: (s: Score) => void;
  removeScore: (id: string) => void;
  addAnnotation: (a: Annotation) => void;
  removeAnnotation: (id: string) => void;
  editAnnotation: (id: string, text: string) => void;
  setFinger: (key: string, n: number) => void;
  assign: (key: string, hand: "left" | "right") => void;
  toggleMastered: (id: string) => void;
  saveSegment: (id: string, a: number, b: number) => void;
  savePreference: (id: string, bpm: number, hand: string) => void;
  savePlan: (p: Plan) => void;
  removePlan: (id: string) => void;
  togglePlan: (id: string, date: string) => void;
  addGoal: (g: Goal) => void;
  removeGoal: (id: string) => void;
  addEar: (correct: boolean, skill: string) => void;
  replace: (data: Data) => void;
}
export const emptyData: Data = {
  completed: [],
  lastLesson: "notes",
  results: [],
  scores: [],
  annotations: [],
  fingers: {},
  assignments: {},
  mastered: [],
  segments: {},
  preferences: {},
  plans: [],
  goals: [],
  ear: [],
};
export const useLearning = create<State>()(
  persist(
    (set) => ({
      ...emptyData,
      ready: false,
      markReady: () => set({ ready: true }),
      complete: (id) =>
        set((s) => ({ completed: [...new Set([...s.completed, id])] })),
      resume: (id) => set({ lastLesson: id }),
      addResult: (r) =>
        set((s) => ({ results: [r, ...s.results].slice(0, 2000) })),
      addScore: (score) =>
        set((s) => ({
          scores: [...s.scores.filter((x) => x.id !== score.id), score],
        })),
      removeScore: (id) =>
        set((s) => ({
          scores: s.scores.filter((x) => x.id !== id),
          annotations: s.annotations.filter((a) => a.scoreId !== id),
        })),
      addAnnotation: (a) =>
        set((s) => ({ annotations: [...s.annotations, a] })),
      removeAnnotation: (id) =>
        set((s) => ({ annotations: s.annotations.filter((a) => a.id !== id) })),
      editAnnotation: (id, text) =>
        set((s) => ({
          annotations: s.annotations.map((a) =>
            a.id === id ? { ...a, text } : a,
          ),
        })),
      setFinger: (key, n) =>
        set((s) => ({ fingers: { ...s.fingers, [key]: n } })),
      assign: (key, hand) =>
        set((s) => ({ assignments: { ...s.assignments, [key]: hand } })),
      toggleMastered: (id) =>
        set((s) => ({
          mastered: s.mastered.includes(id)
            ? s.mastered.filter((x) => x !== id)
            : [...s.mastered, id],
        })),
      saveSegment: (id, a, b) =>
        set((s) => ({ segments: { ...s.segments, [id]: { a, b } } })),
      savePreference: (id, bpm, hand) =>
        set((s) => ({
          preferences: { ...s.preferences, [id]: { bpm, hand } },
        })),
      savePlan: (p) =>
        set((s) => ({ plans: [...s.plans.filter((x) => x.id !== p.id), p] })),
      removePlan: (id) =>
        set((s) => ({ plans: s.plans.filter((p) => p.id !== id) })),
      togglePlan: (id, date) =>
        set((s) => ({
          plans: s.plans.map((p) =>
            p.id === id
              ? {
                  ...p,
                  doneDates: p.doneDates.includes(date)
                    ? p.doneDates.filter((d) => d !== date)
                    : [...p.doneDates, date],
                }
              : p,
          ),
        })),
      addGoal: (g) => set((s) => ({ goals: [...s.goals, g] })),
      removeGoal: (id) =>
        set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),
      addEar: (correct, skill) =>
        set((s) => ({
          ear: [
            { at: new Date().toISOString(), correct, skill },
            ...s.ear,
          ].slice(0, 2000),
        })),
      replace: (data) => set(data),
    }),
    {
      name: "piano-learning-v1",
      version: 1,
      storage: createJSONStorage(() => {
        if (typeof window === "undefined")
          throw new Error("Browser storage only");
        return durableStorage;
      }),
      partialize: (s) => snapshot(s),
      onRehydrateStorage: () => (state) => state?.markReady(),
    },
  ),
);
export function snapshot(s: Data): Data {
  return Object.fromEntries(
    Object.keys(emptyData).map((k) => [k, s[k as keyof Data]]),
  ) as unknown as Data;
}
