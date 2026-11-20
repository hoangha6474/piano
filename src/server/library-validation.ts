import { z } from "zod";
import type { Score } from "../music/model";

export const libraryMetadata = z.object({
  title: z.string().trim().min(1).max(200),
  composer: z.string().trim().min(1).max(200),
  level: z.enum([
    "Beginner",
    "Elementary",
    "Intermediate",
    "Upper Intermediate",
    "Advanced",
  ]),
  bpm: z.number().int().min(20).max(240),
  license: z.string().trim().min(1).max(1000),
});
export const createLibraryScore = z.object({
  xml: z.string().min(1),
  metadata: libraryMetadata,
});
export const changeLibraryScore = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("save"),
    revision: z.number().int().positive(),
    metadata: libraryMetadata,
  }),
  z.object({
    action: z.literal("publish"),
    revision: z.number().int().positive(),
  }),
  z.object({
    action: z.literal("hide"),
    revision: z.number().int().positive(),
  }),
]);
export function applyLibraryMetadata(
  score: Score,
  metadata: z.infer<typeof libraryMetadata>,
): Score {
  const tempos = score.tempos?.map((point) => ({
    ...point,
    bpm: (point.bpm * metadata.bpm) / score.bpm,
  }));
  if (tempos?.some((point) => point.bpm < 20 || point.bpm > 240))
    throw new Error(
      "Thay đổi tempo khiến một đoạn nằm ngoài khoảng 20–240 BPM.",
    );
  return { ...score, ...metadata, source: "Thư viện hệ thống", tempos };
}
