import { and, eq, sql } from "drizzle-orm";
import { currentUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { workspaces } from "@/server/db/schema";
import { sameOrigin, readLimited } from "@/server/http";
import { z } from "zod";
const string = z.string().max(2000),
  strings = z.array(string).max(20000);
const schema = z.object({
  revision: z.number().int().nonnegative(),
  data: z.object({
    completed: strings,
    lastLesson: string,
    results: z
      .array(
        z
          .object({
            id: string,
            scoreId: string,
            title: string,
            at: z.iso.datetime(),
            seconds: z.number().nonnegative(),
            evaluation: z
              .object({ accuracy: z.number().min(0).max(100) })
              .passthrough(),
          })
          .passthrough(),
      )
      .max(2000),
    scores: z
      .array(
        z
          .object({
            id: string,
            title: string,
            notes: z
              .array(
                z
                  .object({
                    midi: z.number().min(0).max(127),
                    beat: z.number().nonnegative(),
                    duration: z.number().positive(),
                  })
                  .passthrough(),
              )
              .max(20000),
          })
          .passthrough(),
      )
      .max(100),
    annotations: z
      .array(
        z
          .object({
            id: string,
            scoreId: string,
            text: string,
            beat: z.number().nonnegative(),
          })
          .passthrough(),
      )
      .max(20000),
    fingers: z.record(string, z.number().int().min(1).max(5)),
    assignments: z.record(string, z.enum(["left", "right"])),
    mastered: strings,
    segments: z.record(
      string,
      z.object({ a: z.number().nonnegative(), b: z.number().positive() }),
    ),
    preferences: z.record(
      string,
      z.object({ bpm: z.number().min(20).max(240), hand: string }),
    ),
    plans: z
      .array(z.object({ id: string, title: string }).passthrough())
      .max(2000),
    goals: z
      .array(
        z
          .object({
            id: string,
            kind: z.enum(["minutes", "accuracy", "lessons"]),
            target: z.number().nonnegative(),
          })
          .passthrough(),
      )
      .max(1000),
  }),
});
export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Cần đăng nhập." }, { status: 401 });
  const rows = await getDb()
    .select()
    .from(workspaces)
    .where(eq(workspaces.userId, user.id));
  return Response.json(rows[0] || { revision: 0, data: null });
}
export async function PUT(request: Request) {
  if (!sameOrigin(request))
    return Response.json(
      { error: "Nguồn yêu cầu không hợp lệ." },
      { status: 403 },
    );
  const user = await currentUser();
  if (!user) return Response.json({ error: "Cần đăng nhập." }, { status: 401 });
  let raw;
  try {
    raw = new TextDecoder().decode(await readLimited(request, 2 * 1024 * 1024));
  } catch {
    return Response.json(
      { error: "Dữ liệu đồng bộ vượt 2 MB. Dùng R2 cho bản nhạc lớn." },
      { status: 413 },
    );
  }
  let parsed;
  try {
    parsed = schema.parse(JSON.parse(raw));
  } catch {
    return Response.json(
      { error: "Dữ liệu đồng bộ không hợp lệ." },
      { status: 400 },
    );
  }
  const { data, revision } = parsed;
  const db = getDb();
  let rows;
  if (revision === 0)
    rows = await db
      .insert(workspaces)
      .values({ userId: user.id, data, revision: 1 })
      .onConflictDoNothing()
      .returning({ revision: workspaces.revision });
  else
    rows = await db
      .update(workspaces)
      .set({
        data,
        revision: sql`${workspaces.revision}+1`,
        updatedAt: new Date(),
      })
      .where(
        and(eq(workspaces.userId, user.id), eq(workspaces.revision, revision)),
      )
      .returning({ revision: workspaces.revision });
  if (!rows.length)
    return Response.json(
      { error: "Dữ liệu đám mây đã thay đổi. Tải bản mới trước khi lưu." },
      { status: 409 },
    );
  return Response.json(rows[0]);
}
