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
