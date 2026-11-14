import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
const evidence = resolve("../artifacts/qa");
test.beforeAll(async () => {
  await mkdir(evidence, { recursive: true });
});
test("complete scientific workflow, map, model controls, DNA, Passport and methodology", async ({
  page,
}) => {
  const errors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page).toHaveTitle(/TerrainX/);
  await expect(
    page.getByRole("heading", {
      name: "EARTH IS OUR FIRST PLANETARY LABORATORY.",
    }),
  ).toBeVisible();
  await expect(page.locator(".globe-wrap svg path").last()).toHaveAttribute(
    "d",
    /.{100,}/,
  );
  await page.screenshot({
    path: resolve(evidence, "landing-desktop.png"),
    fullPage: true,
  });
  const basemapResponse = page.waitForResponse(
    (r) =>
      r.url().includes("World_Dark_Gray_Base/MapServer/tile") &&
      r.status() === 200,
  );
  await page.getByRole("link", { name: "Launch Discovery Engine" }).click();
  await basemapResponse;
  await expect(
    page.getByRole("heading", { name: "Earth experiment suitability" }),
  ).toBeVisible();
  await expect(page.locator(".candidate-row")).toHaveCount(20);
  await expect(page.locator(".maplibregl-canvas")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Zoom in", exact: true }),
  ).toBeVisible();
  expect(
    await page.locator(".map-canvas").evaluate((e) => e.clientHeight),
  ).toBeGreaterThan(300);
  await expect(page.locator(".map-marker")).toHaveCount(20, { timeout: 30000 });
  await page
    .getByRole("button", { name: "Show all study regions", exact: true })
    .click();
  await page.waitForTimeout(1400);
  await page.screenshot({
    path: resolve(evidence, "explorer-desktop.png"),
    fullPage: true,
  });
  await page.getByLabel("NASA GIBS imagery").check();
  await page.waitForResponse(
    (r) => r.url().includes("gibs.earthdata.nasa.gov") && r.status() === 200,
    { timeout: 30000 },
  );
  await page.getByLabel("NASA GIBS imagery").uncheck();
  await page.getByRole("button", { name: "Moon", exact: true }).click();
  await expect(page.getByLabel("Target")).toHaveValue("mare-crisium");
  await expect(
    page.getByText(
      "Basaltic sampling, navigation and surface-operations field tests",
      { exact: true },
    ),
  ).toBeVisible();
  await page.getByLabel("Coverage ≥70% only").check();
  await expect(page.locator(".candidate-row")).toHaveCount(2);
  await page.getByLabel("Coverage ≥70% only").uncheck();
  await page.getByLabel("Study region", { exact: true }).selectOption("saudi");
  await expect(page.locator(".candidate-row")).toHaveCount(8);
  await page.getByText("Model assumptions", { exact: true }).click();
  await page.locator("#weight-geology").fill("0.70");
  await expect(page.locator('label[for="weight-geology"] b')).toHaveText(
    "0.70",
  );
  await expect(
    page
      .locator(".candidate-row")
      .first()
      .locator(".score-strip > div")
      .nth(2)
      .locator("strong"),
  ).toHaveText("30%");
  await page.getByRole("button", { name: "Reset mission defaults" }).click();
  await page.getByRole("button", { name: "Mars", exact: true }).click();
  await page.getByLabel("Study region", { exact: true }).selectOption("all");
  const salda = page
    .locator(".candidate-row")
    .filter({ hasText: "Lake Salda shoreline" });
  await salda.click();
  await expect(page.locator(".selected-summary")).toContainText(
    "Hydromagnesite",
  );
  await page.getByRole("link", { name: "Analog DNA", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Lake Salda shoreline", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Broad-scale terrain DNA" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Reality gap", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reality gap", exact: true }).click();
  await expect(page).toHaveURL(/site\/reference-salda/);
  await page
    .getByRole("link", { name: "Analog Passport", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "ANALOG PASSPORT", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "No field campaign or experimental result has been performed.",
      { exact: false },
    ),
  ).toBeVisible();
  await page.emulateMedia({ media: "print" });
  await page.pdf({
    path: resolve(evidence, "passport-salda.pdf"),
    format: "A4",
    printBackground: true,
  });
  await page.screenshot({
    path: resolve(evidence, "passport-print.png"),
    fullPage: true,
  });
  await page.emulateMedia({ media: "screen" });
  await page.getByRole("link", { name: "Methodology", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "A useful analogy has visible limits." }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "48 scientific tests passed in the recorded validation run.",
      { exact: false },
    ),
  ).toBeVisible();
  expect(errors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
test("mobile viewport stays readable and mission drawer works", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Launch Discovery Engine" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: resolve(evidence, "landing-mobile.png"),
    fullPage: true,
  });
  await page.getByRole("link", { name: "Launch Discovery Engine" }).click();
  await expect(
    page.getByRole("button", { name: "Mission & study regions" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Mission & study regions" }).click();
  await page.getByRole("button", { name: "Moon", exact: true }).click();
  await expect(page.getByLabel("Target")).toHaveValue("mare-crisium");
  await page.getByRole("button", { name: "Mission & study regions" }).click();
  await expect(
    page.getByRole("heading", { name: "Earth discovery atlas" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await expect(page.locator(".map-canvas")).toHaveAttribute(
    "data-context-ready",
    "true",
    { timeout: 30000 },
  );
  await page.waitForTimeout(1100);
  await page.screenshot({
    path: resolve(evidence, "explorer-mobile.png"),
    fullPage: true,
  });
});
test("missing optional map network never fabricates observations", async ({
  page,
}) => {
  await page.route("**/server.arcgisonline.com/**", (r) => r.abort());
  await page.goto("/#/site/reference-salda?mission=jezero");
  await expect(
    page.getByRole("heading", { name: "NASA Earth observations" }),
  ).toBeVisible();
  await expect(page.locator(".observation")).toHaveCount(6);
  await expect(page.locator(".observation").first()).not.toContainText("—");
  await expect(page.locator(".evidence-tag.tag-assumed").first()).toBeVisible();
});

test("map retains local coastlines and markers if the external basemap fails", async ({
  page,
}) => {
  await page.route("**/server.arcgisonline.com/**", (route) => route.abort());
  await page.goto("/#/explorer");
  await expect(page.locator(".map-marker")).toHaveCount(20, { timeout: 30000 });
  await expect(page.getByRole("alert")).toContainText(
    "local Natural Earth coastlines",
  );
  await expect(page.locator(".map-canvas")).toHaveAttribute(
    "data-context-ready",
    "true",
    { timeout: 30000 },
  );
  await expect(
    page.getByRole("heading", { name: "Earth experiment suitability" }),
  ).toBeVisible();
});
