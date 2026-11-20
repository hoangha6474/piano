import { test, expect } from "@playwright/test";
import { library } from "../../src/music/library";
import { toMusicXML } from "../../src/music/notation";
import { readMusicXML } from "../../src/music/musicxml";
import type { AdminLibraryDetail } from "../../src/music/catalog";
import type { Score } from "../../src/music/model";

test("admin endpoints require authentication and learners cannot upload", async ({
  page,
  request,
}) => {
  expect((await request.get("/api/admin/library")).status()).toBe(401);
  expect(
    (
      await request.post("/api/admin/library/preview", {
        headers: { Origin: "https://untrusted.example" },
        data: "<score-partwise/>",
      })
    ).status(),
  ).toBe(403);
  expect(
    (await request.post("/api/assets", { data: "private-score" })).status(),
  ).toBe(403);
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Cần quyền quản trị" }),
  ).toBeVisible();
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
});

test("admin library UI supports preview, draft, publish, edit and hide using an API fixture", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("dialog", (dialog) => void dialog.accept());
  const id = "11111111-1111-4111-8111-111111111111";
  const xml = toMusicXML(library[0]);
  let saved: AdminLibraryDetail | undefined;
  let published: Score | undefined;
  const summary = () => {
    if (!saved) return undefined;
    const { score: _score, ...item } = saved;
    return item;
  };
  await page.route("**/api/admin/library/preview", async (route) => {
    await route.fulfill({
      json: readMusicXML(route.request().postData()!, "preview"),
    });
  });
  await page.route("**/api/admin/library", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: saved ? [summary()] : [] });
      return;
    }
    const body = route.request().postDataJSON();
    const score = { ...readMusicXML(body.xml, id), ...body.metadata };
    saved = {
      ...body.metadata,
      id,
      source: "Thư viện hệ thống",
      status: "draft",
      revision: 1,
      publishedRevision: null,
      updatedAt: new Date().toISOString(),
      score,
    };
    await route.fulfill({ status: 201, json: saved });
  });
  await page.route(`**/api/admin/library/${id}`, async (route) => {
    if (!saved) {
      await route.fulfill({ status: 404, json: { error: "Not found" } });
      return;
    }
    if (route.request().method() === "PATCH") {
      const body = route.request().postDataJSON() as {
        action: string;
        metadata: Pick<
          Score,
          "title" | "composer" | "bpm" | "level" | "license"
        >;
      };
      const updated: AdminLibraryDetail = {
        ...saved,
        revision: saved.revision + 1,
      };
      if (body.action === "save") {
        Object.assign(updated, body.metadata);
        updated.score = { ...updated.score, ...body.metadata };
      }
      if (body.action === "publish") {
        updated.status = "published";
        updated.publishedRevision = updated.revision;
        published = { ...updated.score };
      }
      if (body.action === "hide") updated.status = "hidden";
      saved = updated;
      await route.fulfill({ json: summary() });
    } else await route.fulfill({ json: saved });
  });
  await page.route("**/api/library", async (route) => {
    const items = saved?.status === "published" && published ? [published] : [];
    await route.fulfill({ json: items });
  });
  await page.route(`**/api/library/${id}`, async (route) => {
    await route.fulfill(
      saved?.status === "published" && published
        ? { json: published }
        : { status: 404, json: { error: "Bản nhạc đã được ẩn." } },
    );
  });
  await page.goto("/admin");
  await page.getByLabel("Tệp MusicXML", { exact: true }).setInputFiles({
    name: "system.musicxml",
    mimeType: "application/xml",
    buffer: Buffer.from(xml),
  });
  await expect(
    page.locator(".admin-sheet-preview .osmd svg").first(),
  ).toBeVisible({ timeout: 40000 });
  await page
    .getByLabel("Tên bản nhạc", { exact: true })
    .fill("Bài chung kiểm thử");
  await page.getByLabel("Tác giả", { exact: true }).fill("Piano Learning");
  await page
    .getByLabel("Quyền sử dụng / giấy phép", { exact: true })
    .fill("CC0 — bài tập gốc");
  await page.getByRole("button", { name: "Lưu bản nháp", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Đã lưu bản nháp");
  await page.screenshot({
    path: "test-results/admin-library-desktop.png",
    fullPage: true,
    animations: "disabled",
    timeout: 15000,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/admin-library-mobile.png",
    fullPage: true,
    animations: "disabled",
    timeout: 15000,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "Xuất bản", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Đã xuất bản");
  await page.goto("/library");
  await page
    .getByRole("link")
    .filter({
      has: page.getByRole("heading", {
        name: "Bài chung kiểm thử",
        exact: true,
      }),
    })
    .click();
  await expect(page).toHaveURL(new RegExp(`/practice\\?score=${id}`));
  await expect(page.locator(".osmd svg").first()).toBeVisible({
    timeout: 40000,
  });
  await page.goto("/schedule");
  await page
    .getByRole("button", { name: "Lên lịch luyện", exact: true })
    .click();
  await expect(
    page
      .getByRole("combobox", { name: "Bản nhạc", exact: true })
      .locator(`option[value="${id}"]`),
  ).toHaveText("Bài chung kiểm thử");
  await page.goto("/admin");
  await page
    .getByRole("button", { name: /Bài chung kiểm thử.*Đã xuất bản/ })
    .click();
  await page
    .getByLabel("Tên bản nhạc", { exact: true })
    .fill("Bài chung đã sửa");
  await expect(
    page.getByRole("button", { name: "Xuất bản", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Lưu bản nháp", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Đã lưu bản nháp");
  await page.goto("/library");
  await expect(
    page.getByRole("heading", { name: "Bài chung kiểm thử", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Bài chung đã sửa", exact: true }),
  ).toHaveCount(0);
  await page.goto("/admin");
  await page
    .getByRole("button", { name: /Bài chung đã sửa.*Đã xuất bản/ })
    .click();
  await page.getByRole("button", { name: "Xuất bản", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Đã xuất bản");
  await page.getByRole("button", { name: "Ẩn bài", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Đã ẩn");
  await page.goto("/library");
  await expect(
    page.getByRole("heading", { name: "Bài chung đã sửa", exact: true }),
  ).toHaveCount(0);
  await page.goto(`/practice?score=${id}`);
  await expect(
    page.getByRole("heading", { name: "Chưa mở được bản nhạc" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
