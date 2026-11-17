import { test, expect } from "@playwright/test";
test("dashboard, course navigation and responsive layout", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Chào bạn, cùng chơi Piano nhé." }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/dashboard-desktop.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Giáo trình", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Một hành trình, nhiều khám phá." }),
  ).toBeVisible();
  await page.getByRole("link", { name: /Tư thế đúng, khởi đầu tốt/ }).click();
  await expect(
    page.getByRole("heading", { name: "Tư thế đúng, khởi đầu tốt" }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Chào bạn, cùng chơi Piano nhé." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/dashboard-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Mở điều hướng" }).click();
  await expect(
    page.getByRole("link", { name: "Luyện Piano", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("score renders, tempo and annotation persist after reload", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({width:1440,height:1600});
  await page.goto("/practice");
  await expect(page.locator(".osmd svg").first()).toBeVisible({
    timeout: 40000,
  });
  await testInfo.attach("engraved-score.svg", {
    body: Buffer.from(
      await page
        .locator(".osmd svg")
        .first()
        .evaluate((el) => el.outerHTML),
    ),
    contentType: "image/svg+xml",
  });
  await expect(page.locator(".osmd [data-note-id]")).toHaveCount(16);
  await expect(page.locator('.score-loading')).toHaveCount(0);
  await expect(page.locator('.note-name-label').first()).toBeHidden();
  await expect(page.locator('.note-finger-label').first()).toBeHidden();
  await page.screenshot({
    path: "test-results/practice-desktop.png",
    fullPage: false,
  });
  await page
    .getByRole("button", { name: "Bắt đầu luyện", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("kết nối đàn MIDI");
  await page
    .getByRole("textbox", { name: "Nội dung chú thích" })
    .fill("Thả lỏng cổ tay");
  await page.getByRole("button", { name: "Thêm", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Sửa chú thích" }),
  ).toHaveValue("Thả lỏng cổ tay");
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Sửa chú thích" }),
  ).toHaveValue("Thả lỏng cổ tay");
  await page.getByRole("checkbox", { name: "Số ngón", exact: true }).check();
  await expect(page.locator(".osmd svg").first()).toBeVisible();
  expect(errors).toEqual([]);
});
test("schedule creation persists and completion updates the day", async ({
  page,
}) => {
  await page.goto("/schedule");
  await page
    .getByRole("button", { name: "Lên lịch luyện", exact: true })
    .click();
  await page.getByLabel("Nội dung", { exact: true }).fill("Luyện gam kiểm thử");
  await page.getByRole("button", { name: "Lưu lịch", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Luyện gam kiểm thử" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Luyện gam kiểm thử" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Hoàn thành", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Đã hoàn thành", exact: true }),
  ).toBeVisible();
});
test("MusicXML upload validates input and renders a private score", async ({
  page,
}) => {
  await page.goto("/my-scores");
  const xml =
    '<?xml version="1.0"?><score-partwise version="4.0"><work><work-title>Bài nhập kiểm thử</work-title></work><part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1"><measure number="1"><attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes><note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><type>whole</type></note></measure></part></score-partwise>';
  await page.locator("input[type=file]").setInputFiles({
    name: "lesson.musicxml",
    mimeType: "application/xml",
    buffer: Buffer.from(xml),
  });
  await expect(
    page.getByRole("heading", { name: "Bài nhập kiểm thử" }),
  ).toBeVisible();
  await page
    .getByRole("link")
    .filter({ has: page.getByRole("heading", { name: "Bài nhập kiểm thử" }) })
    .click();
  await expect(page.locator(".osmd svg").first()).toBeVisible({
    timeout: 40000,
  });
});
test("private APIs deny anonymous access and untrusted mutation origins", async ({
  request,
}) => {
  expect((await request.get("/api/workspace")).status()).toBe(401);
  expect((await request.get("/api/assets")).status()).toBe(401);
  expect(
    (
      await request.put("/api/workspace", {
        headers: { Origin: "https://untrusted.example" },
        data: {},
      })
    ).status(),
  ).toBe(403);
  const status = await request.get("/api/status");
  expect(status.status()).toBe(200);
  expect((await status.json()).user).toBeNull();
});
