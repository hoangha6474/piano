import "server-only";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { libraryScores } from "./db/schema";
import { getStorage } from "./storage";
import type { AdminLibraryItem, LibraryItem } from "../music/catalog";
import type { Score } from "../music/model";

export const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const noStore = { "Cache-Control": "no-store" };
export function adminItem(
  row: typeof libraryScores.$inferSelect,
): AdminLibraryItem {
  const { id, title, composer, level, bpm, license, source } = row.score;
  return {
    id,
    title,
    composer,
    level,
    bpm,
    license,
    source,
    status: row.status,
    revision: row.revision,
    publishedRevision: row.publishedRevision,
    updatedAt: row.updatedAt.toISOString(),
  };
}
export async function publishedLibrary(): Promise<LibraryItem[]> {
  if (!process.env.DATABASE_URL) return [];
  return getDb()
    .select({
      id: libraryScores.id,
      title: sql<string>`${libraryScores.publishedScore}->>'title'`,
      composer: sql<string>`${libraryScores.publishedScore}->>'composer'`,
      level: sql<string>`${libraryScores.publishedScore}->>'level'`,
      bpm: sql<number>`(${libraryScores.publishedScore}->>'bpm')::int`,
      license: sql<string>`${libraryScores.publishedScore}->>'license'`,
      source: sql<string>`${libraryScores.publishedScore}->>'source'`,
    })
    .from(libraryScores)
    .where(
      and(
        eq(libraryScores.status, "published"),
        sql`${libraryScores.publishedScore} is not null`,
      ),
    )
    .orderBy(desc(libraryScores.createdAt));
}
export async function findLibraryScore(id: string) {
  if (!uuidPattern.test(id)) return undefined;
  const [row] = await getDb()
    .select()
    .from(libraryScores)
    .where(eq(libraryScores.id, id));
  return row;
}
export async function withLibraryXML(
  score: Score,
  objectKey: string,
): Promise<Score> {
  const file = await getStorage().send(
    new GetObjectCommand({ Bucket: process.env.R2_BUCKET, Key: objectKey }),
  );
  const xml = await file.Body?.transformToString("utf-8");
  if (!xml) throw new Error("MISSING_SHEET");
  return { ...score, xml };
}
