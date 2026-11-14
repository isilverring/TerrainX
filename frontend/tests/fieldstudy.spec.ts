import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

test("field study: place stations, measure the traverse, save, export JSON + GPX and reopen", async ({
  page,
}) => {
  await page.goto("/#/cases");
  await page.getByRole("link", { name: "Plan a field study" }).first().click();
  await expect(
    page.getByRole("heading", {
      name: "Turn a candidate into a field question.",
    }),
  ).toBeVisible();
  await expect(page.getByText(/^science-[0-9a-f]{16}$/)).toBeVisible();

  // Deterministic relief transect from the real sample nodes.
  await page.getByRole("button", { name: "Suggest relief transect" }).click();
  await expect(page.locator(".field-stations li")).toHaveCount(5);
  await expect(page.getByText("Straight-line distance")).toBeVisible();
  await expect(page.locator(".field-legs tbody tr")).toHaveCount(4);

  // Add a sample station by clicking the planner, then move it with the keyboard.
  await page.getByRole("button", { name: "Sample", exact: true }).click();
  const canvas = page.locator(".field-canvas");
  const box = (await canvas.boundingBox())!;
  await canvas.click({ position: { x: box.width * 0.7, y: box.height * 0.3 } });
  await expect(page.locator(".field-stations li")).toHaveCount(6);
  const coords = page.locator(".field-stations li.selected small");
  const before = await coords.textContent();
  await canvas.press("ArrowRight");
  await expect(coords).not.toHaveText(before!);
  await page
    .getByLabel("Purpose — what would you observe or test here?")
    .fill("Bedding and grain size");
  await expect(page.locator(".field-samples .caption")).toContainText("TX-");

  await page.getByLabel("Study title").fill("Judge field study");
  await page.getByRole("button", { name: "Save field study" }).click();
  await expect(
    page.getByRole("heading", { name: "Judge field study", level: 3 }),
  ).toBeVisible();

  const [json] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Export JSON" }).click(),
  ]);
  const study = JSON.parse(readFileSync((await json.path())!, "utf8"));
  expect(study.field_study_version).toBe("1.0");
  expect(study.stations).toHaveLength(6);
  expect(study.snapshot.science.release_id).toMatch(/^science-[0-9a-f]{16}$/);
  expect(study.snapshot.science.dataset_sha256).toHaveLength(64);

  const [gpx] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Export GPX" }).click(),
  ]);
  const gpxText = readFileSync((await gpx.path())!, "utf8");
  expect(gpxText).toContain('<gpx version="1.1"');
  expect(gpxText.match(/<wpt /g)).toHaveLength(6);

  // Reopen after a reload restores the exact stations.
  await page.reload();
  await page.getByRole("button", { name: "Reopen", exact: true }).click();
  await expect(page.locator(".field-stations li")).toHaveCount(6);
  await expect(page.getByLabel("Study title")).toHaveValue("Judge field study");
});

test("field study is usable on a phone without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/field-study");
  await expect(page.locator(".field-canvas")).toBeVisible();
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(390);
});

test("field study share link reopens the same stations on another device", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/#/field-study?id=saudi-24.000-39.375&mission=jezero");
  await page.getByRole("button", { name: "Suggest relief transect" }).click();
  await page.getByLabel("Study title").fill("Shared traverse");
  await page.getByRole("button", { name: "Copy share link" }).click();
  await expect(page.locator(".field-message")).toContainText(
    "Share link copied",
  );
  const url = await page.evaluate(() => navigator.clipboard.readText());
  expect(url).toContain("#/field-study?share=");
  const other = await context.newPage();
  await other.goto(url);
  await expect(other.locator(".field-stations li")).toHaveCount(5);
  await expect(other.getByLabel("Study title")).toHaveValue("Shared traverse");
  await expect(other.locator(".field-message")).toContainText(
    "Opened a shared plan",
  );
  // A damaged link is refused rather than guessed.
  await other.goto(url.slice(0, -12) + "%%broken");
  await other.reload();
  await expect(other.getByRole("alert")).toContainText("damaged or incomplete");
});
