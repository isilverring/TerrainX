import { test, expect } from "@playwright/test";
test("research snapshots pin the release and reopen the same custom model", async ({
  page,
}) => {
  await page.goto("/#/what-if?mission=jezero");
  await page.locator("#wi-alpha").fill("0.85");
  await page.getByRole("link", { name: "Research", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Research workspace" }),
  ).toBeVisible();
  await page.getByLabel("Study title").fill("Judge reproducibility study");
  await page
    .getByRole("button", { name: "Save snapshot", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Judge reproducibility study" }),
  ).toBeVisible();
  const [file] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Export snapshot JSON" }).click(),
  ]);
  const { readFileSync } = await import("node:fs");
  const snapshot = JSON.parse(readFileSync((await file.path())!, "utf8"));
  expect(snapshot.science.release_id).toMatch(/^science-/);
  expect(snapshot.scenarios.jezero.alpha).toBe(0.85);
  expect(snapshot.science.dataset_sha256).toHaveLength(64);
  await page.reload();
  await page.getByRole("button", { name: "Reopen", exact: true }).click();
  await expect(page).toHaveURL(
    new RegExp(`science=${snapshot.science.release_id}`),
  );
  await page.getByRole("link", { name: "What if", exact: true }).click();
  await expect(page.locator("#wi-alpha")).toHaveValue("0.85");
});
test("a missing historical release stops rather than replacing scientific inputs", async ({
  page,
}) => {
  await page.goto("/#/explorer?science=science-0000000000000000");
  await expect(
    page.getByRole("heading", { name: "Scientific data could not be loaded." }),
  ).toBeVisible();
  await expect(page.getByText(/No newer data were substituted/)).toBeVisible();
  await expect(page.locator(".candidate-row")).toHaveCount(0);
});

test("evidence values open source metadata and cases preserve scientific status", async ({
  page,
}) => {
  await page.goto("/#/site/saudi-24.000-39.375?mission=jezero");
  const trigger = page
    .getByRole("button", { name: "Inspect evidence: Temperature at 2 Meters" })
    .first();
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Temperature at 2 Meters" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("2001-01-01");
  await expect(dialog).toContainText("not an outcrop instrument");
  await expect(dialog).toContainText("Source response SHA-256");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await page.goto("/#/cases");
  await expect(page.locator(".case-study")).toHaveCount(3);
  await expect(page.locator(".case-study").nth(1)).toContainText(
    "mission-specific relevance remains unassessed",
  );
  await expect(page.locator(".case-study").nth(2)).toContainText(
    "excluded from discovery counts",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(390);
});

test("presentation uses its own model and restores research settings on exit", async ({
  page,
}) => {
  await page.goto("/#/what-if?mission=jezero");
  await page.locator("#wi-alpha").fill("0.85");
  await page.getByRole("link", { name: /Guided demo/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("End");
  await page.goto("/#/what-if?mission=jezero&presentation=1");
  await expect(page.locator("#wi-alpha")).toHaveValue("0.3");
  await page.locator("#wi-alpha").fill("0.65");
  await page
    .getByRole("link", { name: "Exit presentation", exact: true })
    .click();
  await page.getByRole("link", { name: "What if", exact: true }).click();
  await expect(page.locator("#wi-alpha")).toHaveValue("0.85");
  await page.getByRole("link", { name: /Guided demo/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: "What if", exact: true }).click();
  await expect(page.locator("#wi-alpha")).toHaveValue("0.85");
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("terrainx-scenarios-v1")!),
  );
  expect(stored.jezero.alpha).toBe(0.85);
});

test("mobile navigation exposes the complete research journey", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Research", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Research workspace" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toHaveAttribute("aria-expanded", "false");
});
