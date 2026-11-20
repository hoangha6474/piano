import { test, expect } from "@playwright/test";
test("dashboard, course navigation and responsive layout", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator(".sidebar")).toHaveCSS("position", "relative");
  const layout = await page.evaluate(() => {
    const sidebar = document.querySelector<HTMLElement>(".sidebar")!;
    const main = document.querySelector<HTMLElement>(".main-column")!;
    const sideRect = sidebar.getBoundingClientRect();
    const mainRect = main.getBoundingClientRect();
    return {
      topDifference: Math.abs(sideRect.top - mainRect.top),
      bottomDifference: Math.abs(sideRect.bottom - mainRect.bottom),
      internalScroll: sidebar.scrollHeight > sidebar.clientHeight,
    };
  });
  expect(layout.topDifference).toBeLessThanOrEqual(1);
  expect(layout.bottomDifference).toBeLessThanOrEqual(1);
  expect(layout.internalScroll).toBe(false);
  await expect(
    page.getByRole("heading", { name: "Mỗi ngày, một chút âm nhạc." }),
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
    page.getByRole("heading", { name: "Mỗi ngày, một chút âm nhạc." }),
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
  await page.getByRole("button", { name: "Đóng điều hướng" }).click();
  expect((await page.request.get("/preview")).status()).toBe(404);
  expect(errors).toEqual([]);
});
test("score renders, tempo and annotation persist after reload", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1600 });
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
  await expect(page.locator(".score-loading")).toHaveCount(0);
  await expect(page.locator(".note-name-label").first()).toBeHidden();
  await expect(page.locator(".note-finger-label").first()).toBeHidden();
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
test("only system scores can be selected and private uploads are disabled", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "piano-learning-v1",
      JSON.stringify({
        version: 2,
        state: {
          scores: [
            {
              id: "private-test",
              title: "Bản nhạc riêng kiểm thử",
              level: "Cá nhân",
              notes: [],
            },
          ],
        },
      }),
    );
  });
  await page.goto("/my-scores");
  await expect(page).toHaveURL(/\/library$/);
  await expect(
    page.getByRole("heading", { name: "Tìm giai điệu của hôm nay." }),
  ).toBeVisible();
  await expect(page.locator("input[type=file]")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Bản nhạc riêng kiểm thử" }),
  ).toHaveCount(0);
  await expect(
    page.locator("#sidebar-navigation a[href='/my-scores']"),
  ).toHaveCount(0);
  await expect(
    page
      .getByRole("combobox", { name: "Lọc cấp độ" })
      .locator("option", { hasText: "Cá nhân" }),
  ).toHaveCount(0);
  await page.getByLabel("Tìm bản nhạc").fill("khong-co-ban-nhac-xyz");
  await expect(
    page.getByRole("heading", { name: "Không tìm thấy bản nhạc" }),
  ).toBeVisible();
  await page.goto("/practice?score=private-test");
  await expect(page.locator(".osmd svg").first()).toBeVisible({
    timeout: 40000,
  });
  await expect(
    page.getByRole("heading", { name: "Bản nhạc riêng kiểm thử" }),
  ).toHaveCount(0);
  await page.goto("/schedule");
  await page
    .getByRole("button", { name: "Lên lịch luyện", exact: true })
    .click();
  await expect(
    page
      .getByRole("combobox", { name: "Bản nhạc", exact: true })
      .locator("option", { hasText: "Bản nhạc riêng kiểm thử" }),
  ).toHaveCount(0);
  await page.goto("/settings");
  await expect(
    page.getByRole("heading", { name: "Sẵn sàng cho những giai điệu." }),
  ).toBeVisible();
  await expect(page.locator("input[type=file]")).toHaveCount(0);
  expect(
    (
      await page.request.post("/api/assets", { data: "private score" })
    ).status(),
  ).toBe(403);
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
