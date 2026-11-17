import { test, expect } from "@playwright/test";
test("wait mode receives MIDI, advances, and saves an actual measured result", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const input = {
      id: "test-device",
      name: "Test MIDI (automated fixture)",
      state: "connected",
      onmidimessage: null as
        null | ((e: { data: Uint8Array; timeStamp: number }) => void),
    };
    Object.defineProperty(navigator, "requestMIDIAccess", {
      value: async () => ({
        inputs: new Map([[input.id, input]]),
        outputs: new Map(),
        onstatechange: null,
      }),
    });
    window.addEventListener("test-midi", (event) => {
      input.onmidimessage?.({
        data: new Uint8Array((event as CustomEvent).detail),
        timeStamp: performance.now(),
      });
    });
  });
  await page.goto("/practice");
  await expect(page.locator(".osmd svg").first()).toBeVisible({
    timeout: 40000,
  });
  await page
    .getByRole("button", { name: "Kết nối đàn MIDI", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Đàn đã kết nối", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Tùy chọn luyện tập" }).click();
  await page.getByLabel("Count-in", { exact: true }).selectOption("0");
  await page
    .getByRole("button", { name: "Bắt đầu luyện", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Tạm dừng hoặc tiếp tục" }),
  ).toBeVisible();
  // Allow the audio scheduling lead-in to elapse before the fixture sends attacks.
  await page.waitForTimeout(200);
  const notes = [
    60, 62, 64, 65, 67, 65, 64, 62, 60, 60, 62, 64, 62, 60, 62, 60,
  ];
  for (const note of notes) {
    await page.evaluate((n) => {
      window.dispatchEvent(
        new CustomEvent("test-midi", { detail: [0x90, n, 90] }),
      );
      window.dispatchEvent(
        new CustomEvent("test-midi", { detail: [0x80, n, 0] }),
      );
    }, note);
  }
  await expect(
    page.getByRole("heading", { name: "Kết quả lượt luyện" }),
  ).toBeVisible();
  await expect(page.locator("main")).toContainText("16/16 nốt kỳ vọng");
  await page.goto("/progress");
  await expect(page.locator("main")).toContainText("100%");
});
