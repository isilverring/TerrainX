import { openResearch } from "./helpers";
import { test, expect } from "@playwright/test";

test("discovery lenses re-rank candidates without changing the baseline", async ({
  page,
}) => {
  await page.goto("/#/explorer?mission=jezero");
  await openResearch(page, "Lenses");
  await expect(
    page.getByRole("heading", { name: "One shortlist, six questions." }),
  ).toBeVisible();
  // Baseline table lists all automatic candidates; benchmarks are excluded.
  await expect(page.locator(".lens-table tbody tr")).toHaveCount(16);
  const firstBaseline = await page
    .locator(".lens-table tbody tr")
    .first()
    .locator(".lens-name")
    .textContent();
  await page.getByRole("button", { name: /Terrain twin/ }).click();
  await expect(
    page.getByRole("heading", { name: "Terrain twin", level: 2 }),
  ).toBeVisible();
  await expect(
    page.locator(".lens-table tbody tr").first().locator("td").first(),
  ).toHaveText("1");
  // Pin a candidate and read its story across lenses.
  await page.locator(".lens-name").first().click();
  await expect(page.locator(".lens-story h2")).toBeVisible();
  await expect(page.locator(".lens-story li")).toHaveCount(6);
  // Switching back restores the identical baseline order.
  await page.getByRole("button", { name: /Release baseline/ }).click();
  await expect(
    page.locator(".lens-table tbody tr").first().locator(".lens-name"),
  ).toHaveText(firstBaseline!);
});

test("moon lenses state plainly when geology prevents any baseline ranking", async ({
  page,
}) => {
  await page.goto("/#/lenses?mission=mare-crisium");
  await expect(page.getByText("None ranked").first()).toBeVisible();
  await expect(
    page.locator(".lens-table tbody tr td em").first(),
  ).toContainText("Geology unknown");
});
