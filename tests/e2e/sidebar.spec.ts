import { expect, test } from "@playwright/test";

test("sidebar resizes, collapses, remembers preferences, and keeps mobile navigation", async ({
  page,
}) => {
  await page.goto("/");
  const sidebar = page.locator(".sidebar");
  const handle = page.getByRole("separator", {
    name: "Điều chỉnh độ rộng thanh bên",
  });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  async function dragTo(x: number) {
    const box = await handle.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + 60);
    await page.mouse.down();
    await page.mouse.move(x, box!.y + 60, { steps: 8 });
    await page.mouse.up();
  }

  await dragTo(320);
  await expect(sidebar).toHaveCSS("width", "320px");
  await page.screenshot({
    path: "test-results/sidebar-expanded.png",
    fullPage: true,
  });
  await page.reload();
  await expect(sidebar).toHaveCSS("width", "320px");

  await page
    .getByRole("button", { name: "Thu gọn thanh bên", exact: true })
    .click();
  await expect(sidebar).toHaveCSS("width", "76px");
  await page.screenshot({
    path: "test-results/sidebar-collapsed.png",
    fullPage: true,
  });
  await expect(
    sidebar.getByRole("link", { name: "Luyện Piano", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(sidebar).toHaveCSS("width", "76px");
  await page
    .getByRole("button", { name: "Mở rộng thanh bên", exact: true })
    .click();
  await expect(sidebar).toHaveCSS("width", "320px");

  await dragTo(100);
  await expect(sidebar).toHaveCSS("width", "76px");
  await dragTo(280);
  await expect(sidebar).toHaveCSS("width", "280px");
  await handle.focus();
  await page.keyboard.press("End");
  await expect(sidebar).toHaveCSS("width", "360px");
  await page.keyboard.press("ArrowLeft");
  await expect(sidebar).toHaveCSS("width", "344px");
  await expect(page.locator(".app")).not.toHaveClass(/sidebar-resizing/);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(handle).toBeHidden();
  await page
    .getByRole("button", { name: "Mở điều hướng", exact: true })
    .click();
  await expect(
    sidebar.getByRole("link", { name: "Giáo trình", exact: true }),
  ).toBeVisible();
  await sidebar.getByRole("link", { name: "Giáo trình", exact: true }).click();
  await expect(page).toHaveURL(/\/curriculum$/);
  await expect(sidebar).not.toHaveClass(/open/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
