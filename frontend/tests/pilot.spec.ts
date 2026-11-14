import { test, expect } from "@playwright/test";
test("common-support pilot renders real grids and changes only its own experimental results", async ({
  page,
}) => {
  await page.goto("/#/terrain-pilot");
  await expect(
    page.getByRole("heading", { name: "Same window. Different worlds." }),
  ).toBeVisible();
  await expect(page.locator(".pilot-values")).toContainText("89.2");
  await expect(page.locator(".pilot-grids svg")).toHaveCount(2);
  await page
    .getByLabel("Common square averaging support")
    .selectOption("12000");
  await expect(page.locator(".pilot-values")).toContainText("85.5");
  await page.getByLabel("Earth site").selectOption("reference-salda");
  await page.getByLabel("Planetary reference").selectOption("mare-crisium");
  await expect(page.locator(".pilot-values")).toContainText("56.0");
  await expect(
    page
      .getByRole("heading", { name: "Water, edits and infill" })
      .locator(".."),
  ).toContainText("5.75%");
  await page
    .getByLabel("Coupled window offset on both worlds")
    .selectOption("north");
  await expect(page.locator(".pilot-values")).not.toContainText("56.0");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(390);
  await page.goto("/#/terrain-pilot?science=science-a134e4d3f6430233");
  await expect(page.getByRole("status")).toContainText(
    "not included in this historical",
  );
  await expect(page.locator(".pilot-values")).toHaveCount(0);
});
