import { expect, test } from "@playwright/test";

test("pitch shows ten slides with release-derived numbers and keyboard navigation", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/#/pitch");
  await expect(page.locator(".pitch-count")).toHaveText("1 / 10");
  await expect(page.locator(".pitch h1")).toContainText("rehearse");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".pv-gaps li")).toHaveCount(3);
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".pv-node")).toHaveCount(4);
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".pv-eq")).toHaveCount(3);
  await expect(page.locator(".pv-eq.key")).toContainText("α = 0.3");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".pv-features > div")).toHaveCount(8);
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".pv-dots span")).toHaveCount(130);
  await expect(page.locator(".pv-legend")).toContainText("rankable");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".pv-twins li").first()).toContainText("F ");
  await page.keyboard.press("End");
  await expect(page.locator(".pitch-count")).toHaveText("10 / 10");
  await expect(page.locator(".pv-end .qr-code")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page).not.toHaveURL(/pitch/);
  expect(errors).toEqual([]);
});

test("pitch keeps mobile content reachable and navigation visible in both orientations", async ({ page }) => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    await page.goto("about:blank");
    await page.goto("/#/pitch");
    await expect(page.locator(".pitch-count")).toHaveText("1 / 10");
    for (let i = 0; i < 4; i++) await page.keyboard.press("ArrowRight");
    await expect(page.locator(".pv-features > div")).toHaveCount(8);
    await expect(page.locator(".pitch-scroll-hint")).toBeVisible();
    const slide = page.locator(".pitch-slide");
    await slide.evaluate((e) => { e.scrollTop = e.scrollHeight; });
    await expect(page.locator(".pv-features > div").last()).toBeInViewport();
    await expect(page.locator(".pitch-scroll-hint")).toBeHidden();
    await expect(page.getByRole("button", { name: "Next slide", exact: true })).toBeInViewport();
    await page.getByRole("button", { name: "Previous slide", exact: true }).click();
    await expect(page.locator(".pitch-count")).toHaveText("4 / 10");
    await expect.poll(() => page.locator(".pv-math").evaluateAll((items) =>
      items.every((e) => e.scrollWidth <= e.clientWidth + 1),
    )).toBe(true);
    await page.keyboard.press("End");
    await expect(page.locator(".pitch-count")).toHaveText("10 / 10");
    await page.locator(".pitch-slide").evaluate((e) => { e.scrollTop = e.scrollHeight; });
    await expect(page.locator(".pv-end .qr-code")).toBeInViewport();
    await expect(page.getByRole("button", { name: "Exit pitch", exact: true })).toBeInViewport();
  }
});
