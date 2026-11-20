import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Score } from "../../src/music/model";
const mocks = vi.hoisted(() => ({
  currentUser: vi.fn(),
  send: vi.fn(),
  ready: vi.fn(),
  db: vi.fn(),
  find: vi.fn(),
  withXML: vi.fn(),
  insertValues: vi.fn(),
  updateValues: vi.fn(),
  conflict: false,
  failInsert: false,
}));
vi.mock("server-only", () => ({}));
vi.mock("@/server/auth", () => ({ currentUser: mocks.currentUser }));
vi.mock("@/server/storage", () => ({
  storageReady: mocks.ready,
  getStorage: () => ({ send: mocks.send }),
}));
vi.mock("@/server/db", () => ({ getDb: mocks.db }));
vi.mock("@/server/library", async (original) => ({
  ...(await original<typeof import("../../src/server/library")>()),
  findLibraryScore: mocks.find,
  withLibraryXML: mocks.withXML,
}));
import {
  GET as listAdmin,
  POST as create,
} from "../../src/app/api/admin/library/route";
import {
  GET as getAdmin,
  PATCH as change,
} from "../../src/app/api/admin/library/[id]/route";
import { POST as preview } from "../../src/app/api/admin/library/preview/route";
import { GET as getPublic } from "../../src/app/api/library/[id]/route";
import { isAdminId } from "../../src/server/admin-policy";
import { library } from "../../src/music/library";
import { toMusicXML } from "../../src/music/notation";
import {
  applyLibraryMetadata,
  libraryMetadata,
} from "../../src/server/library-validation";
const id = "11111111-1111-4111-8111-111111111111";
const context = { params: Promise.resolve({ id }) };
const metadata = {
  title: "Bài mới",
  composer: "Tác giả",
  level: "Beginner" as const,
  bpm: 80,
  license: "CC0",
};
type Row = {
  id: string;
  score: Score;
  publishedScore: Score | null;
  objectKey: string;
  status: "draft" | "published" | "hidden";
  revision: number;
  publishedRevision: number | null;
  updatedAt: Date;
};
let row: Row;
const request = (body: unknown, origin = "https://piano.example") =>
  new Request("https://piano.example/api/admin/library", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
beforeEach(() => {
  vi.clearAllMocks();
  mocks.conflict = false;
  mocks.failInsert = false;
  vi.stubEnv("ADMIN_USER_IDS", "admin-id");
  vi.stubEnv("BETTER_AUTH_URL", "https://piano.example");
  vi.stubEnv("DATABASE_URL", "configured");
  mocks.currentUser.mockResolvedValue({ id: "admin-id" });
  mocks.ready.mockReturnValue(true);
  mocks.send.mockResolvedValue({});
  row = {
    id,
    score: { ...library[0], id },
    publishedScore: null,
    objectKey: "library/test.musicxml",
    status: "draft",
    revision: 1,
    publishedRevision: null,
    updatedAt: new Date(),
  };
  mocks.find.mockImplementation(async () => row);
  mocks.withXML.mockImplementation(async (score) => ({
    ...score,
    xml: toMusicXML(score),
  }));
  mocks.db.mockReturnValue({
    select: () => ({ from: () => ({ orderBy: async () => [row] }) }),
    insert: () => ({
      values: (value: Partial<Row>) => {
        mocks.insertValues(value);
        row = { ...row, ...value };
        return {
          returning: async () => {
            if (mocks.failInsert) throw new Error("DB unavailable");
            return [row];
          },
        };
      },
    }),
    update: () => ({
      set: (value: Partial<Row>) => {
        mocks.updateValues(value);
        return {
          where: () => ({
            returning: async () => {
              if (mocks.conflict) return [];
              row = { ...row, ...value };
              return [row];
            },
          }),
        };
      },
    }),
  });
});
afterEach(() => vi.unstubAllEnvs());
describe("admin library access and publication", () => {
  it("requires an exact server-configured user ID", () => {
    expect(isAdminId(undefined, "admin")).toBe(false);
    expect(isAdminId("admin", " other, admin ")).toBe(true);
    expect(isAdminId("adm", "admin")).toBe(false);
    expect(isAdminId("admin", "")).toBe(false);
  });
  it("denies anonymous and ordinary users on all admin endpoints", async () => {
    for (const [user, status] of [
      [null, 401],
      [{ id: "learner", role: "admin" }, 403],
    ] as const) {
      mocks.currentUser.mockResolvedValue(user);
      expect((await listAdmin()).status).toBe(status);
      expect((await getAdmin(request({}), context)).status).toBe(status);
      expect((await create(request({}))).status).toBe(status);
      expect((await preview(request({}))).status).toBe(status);
      expect(
        (await change(request({ action: "publish", revision: 1 }), context))
          .status,
      ).toBe(status);
    }
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.db).not.toHaveBeenCalled();
  });
  it("rejects cross-origin writes even from an admin", async () => {
    expect(
      (await create(request({}, "https://untrusted.example"))).status,
    ).toBe(403);
    expect(
      (
        await change(
          request({ action: "hide", revision: 1 }, "https://untrusted.example"),
          context,
        )
      ).status,
    ).toBe(403);
    expect(mocks.db).not.toHaveBeenCalled();
  });
  it("parses on the server and creates a draft without publishing caller-supplied notes", async () => {
    const response = await create(
      request({
        xml: toMusicXML(library[0]),
        metadata,
        status: "published",
        score: { notes: [] },
      }),
    );
    expect(response.status).toBe(201);
    const result = await response.json();
    expect(result.status).toBe("draft");
    expect(result.score.notes).toHaveLength(16);
    expect(result.score.title).toBe(metadata.title);
    expect(mocks.insertValues.mock.calls[0][0].score).not.toHaveProperty("xml");
    expect(mocks.insertValues.mock.calls[0][0]).not.toHaveProperty(
      "publishedScore",
    );
  });
  it("exposes only the last explicitly published snapshot, then hides it", async () => {
    expect((await getPublic(request({}), context)).status).toBe(404);
    expect(mocks.withXML).not.toHaveBeenCalled();
    expect(
      (await change(request({ action: "publish", revision: 1 }), context))
        .status,
    ).toBe(200);
    expect((await (await getPublic(request({}), context)).json()).title).toBe(
      library[0].title,
    );
    expect(
      (
        await change(
          request({ action: "save", revision: 2, metadata }),
          context,
        )
      ).status,
    ).toBe(200);
    expect(row.score.title).toBe(metadata.title);
    expect((await (await getPublic(request({}), context)).json()).title).toBe(
      library[0].title,
    );
    expect(
      (await change(request({ action: "publish", revision: 3 }), context))
        .status,
    ).toBe(200);
    expect((await (await getPublic(request({}), context)).json()).title).toBe(
      metadata.title,
    );
    expect(
      (await change(request({ action: "hide", revision: 4 }), context)).status,
    ).toBe(200);
    expect((await getPublic(request({}), context)).status).toBe(404);
  });
  it("does not overwrite a concurrent edit", async () => {
    expect(
      (await change(request({ action: "hide", revision: 5 }), context)).status,
    ).toBe(409);
    expect(mocks.updateValues).not.toHaveBeenCalled();
    mocks.conflict = true;
    expect(
      (await change(request({ action: "hide", revision: 1 }), context)).status,
    ).toBe(409);
  });
  it("does not publish when the original sheet cannot be read", async () => {
    mocks.withXML.mockRejectedValue(new Error("R2 unavailable"));
    expect(
      (await change(request({ action: "publish", revision: 1 }), context))
        .status,
    ).toBe(503);
    expect(row.status).toBe("draft");
    expect(mocks.updateValues).not.toHaveBeenCalled();
  });
  it("cleans up only its newly uploaded object if draft insertion fails", async () => {
    mocks.failInsert = true;
    expect(
      (await create(request({ xml: toMusicXML(library[0]), metadata }))).status,
    ).toBe(503);
    expect(mocks.send).toHaveBeenCalledTimes(2);
    expect(mocks.send.mock.calls[0][0].input.Key).toBe(
      mocks.send.mock.calls[1][0].input.Key,
    );
  });
  it("rejects missing rights and rescales tempo maps consistently", () => {
    expect(
      libraryMetadata.safeParse({ ...metadata, license: "" }).success,
    ).toBe(false);
    const updated = applyLibraryMetadata(
      {
        ...library[0],
        bpm: 80,
        tempos: [
          { beat: 0, bpm: 80 },
          { beat: 4, bpm: 100 },
        ],
      },
      { ...metadata, bpm: 96 },
    );
    expect(updated.tempos?.map((t) => t.bpm)).toEqual([96, 120]);
  });
});
