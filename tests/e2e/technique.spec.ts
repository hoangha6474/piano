import { test, expect } from "@playwright/test";
test("two-hand scale preserves notation and conventional left-hand fingering", async ({
  page,
}) => {
  await page.goto("/technique");
  await expect(page.locator(".osmd svg").first()).toBeVisible({
    timeout: 40000,
  });
  await page
    .getByRole("checkbox", { name: "Hai tay cách một quãng tám" })
    .check();
  await expect(page.locator(".osmd [data-note-id]")).toHaveCount(30);
  await page
    .getByLabel("Nốt cần chỉnh số ngón", { exact: true })
    .selectOption("left-0");
  await expect(page.getByRole('combobox',{name:'Số ngón',exact:true})).toHaveValue('5');
  await page.goto("/progress");
  await expect(
    page.getByRole("heading", { name: "Độ chính xác theo kỹ năng" }),
  ).toBeVisible();
  await expect(page.locator("main")).toContainText("Chưa có dữ liệu");
});
