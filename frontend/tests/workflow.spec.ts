import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
const evidence = resolve("../artifacts/qa");
// TERRAINX_OFFLINE=1 skips waits on live third-party tiles (for sandboxes without
// outbound map access). Default runs still require the real tile responses.
const offline = !!process.env.TERRAINX_OFFLINE;
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
  await expect(
    page.locator('.globe-wrap svg path[fill="url(#land)"]'),
  ).toHaveAttribute("d", /.{100,}/);
  await expect(page.locator(".hero-stats dd").first()).toHaveText("130");
  await page.screenshot({
    path: resolve(evidence, "landing-desktop.png"),
    fullPage: true,
  });
  const basemapResponse = offline
    ? Promise.resolve()
    : page.waitForResponse(
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
  // Ranking: characterized candidates precede screened ones for every sort key.
  const tiers = await page
    .locator(".candidate-row .status-label")
    .allTextContents();
  const firstScreened = tiers.findIndex((t) => t === "screened candidate");
  const lastCharacterized = tiers.lastIndexOf("characterized candidate");
  expect(lastCharacterized).toBeLessThan(firstScreened);
  await page.getByRole("button", { name: "F", exact: true }).click();
  await expect(page.locator(".candidate-row").first()).toContainText(
    "characterized candidate",
  );
  await page.getByRole("button", { name: "U", exact: true }).click();
  // Search and keyboard navigation.
  await page.getByLabel("Search candidates by name or status").fill("gobi");
  await expect(
    page.locator(".candidate-row").filter({ hasText: "Gobi region" }),
  ).toHaveCount(4);
  await page.getByLabel("Search candidates by name or status").fill("");
  await page.locator(".candidate-row").first().click();
  await page.keyboard.press("ArrowDown");
  await expect(page.locator(".candidate-row").nth(1)).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  // Layers: NASA GIBS daily imagery with a dated product.
  await page.getByRole("button", { name: /Layers & legend/ }).click();
  await page.getByText("NASA daily", { exact: true }).click();
  await expect(page.locator(".imagery-badge")).toContainText("NASA GIBS");
  if (!offline)
    await page.waitForResponse(
      (r) => r.url().includes("gibs.earthdata.nasa.gov") && r.status() === 200,
      { timeout: 30000 },
    );
  await page.getByText("Dark atlas", { exact: true }).click();
  await page.getByRole("button", { name: /Layers & legend/ }).click();
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
      /\d+ scientific tests passed in the recorded validation run\./,
      { exact: false },
    ),
  ).toBeVisible();
  expect(errors).toEqual([]);
  expect(
    offline
      ? consoleErrors.filter(
          (e) =>
            !/Failed to load resource|AJAXError|net::ERR|CORS policy/.test(e),
        )
      : consoleErrors,
  ).toEqual([]);
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
  const drawer = page.getByRole("button", { name: /Mission & filters/ });
  await expect(drawer).toBeVisible();
  await drawer.click();
  await page.getByRole("button", { name: "Moon", exact: true }).click();
  await expect(page.getByLabel("Target")).toHaveValue("mare-crisium");
  await drawer.click();
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
  await expect(page.locator(".map-toast")).toContainText("Local coastlines");
  await expect(page.locator(".map-canvas")).toHaveAttribute(
    "data-context-ready",
    "true",
    { timeout: 30000 },
  );
  await expect(
    page.getByRole("heading", { name: "Earth experiment suitability" }),
  ).toBeVisible();
});

test("3D terrain viewer falls back to the cached analysis lattice without live tiles", async ({
  page,
}) => {
  await page.route("**/elevation-tiles-prod/**", (route) => route.abort());
  await page.goto("/#/site/saudi-24.000-39.375?mission=jezero");
  const viewer = page.locator(".terrain-viewer");
  await viewer.scrollIntoViewIfNeeded();
  await viewer.getByRole("button", { name: /Regional context/ }).click();
  await viewer.getByRole("button", { name: "3D surface" }).click();
  await expect(
    viewer.getByRole("button", { name: /Analysis lattice/ }),
  ).toHaveAttribute("aria-pressed", "true", { timeout: 20000 });
  await expect(viewer.locator("canvas.surface-canvas")).toHaveCount(2);
  // Mars relief shown by the viewer equals the scored MOLA relief (715.6 m).
  await expect(
    viewer.locator(".viewer-panel.mars .viewer-stats dd").first(),
  ).toHaveText("716 m");
  await expect(viewer).toContainText(
    "Showing the cached analysis lattice instead",
  );
  await expect(viewer).toContainText("not a validated equivalence");
});

test("compare mode shows two or three candidates side by side without a winner", async ({
  page,
}) => {
  await page.goto(
    "/#/compare?mission=jezero&ids=gobi-42.000-101.250,saudi-24.000-39.375,chile--23.500--70.000",
  );
  await expect(
    page.getByRole("heading", { name: "Compare candidates" }),
  ).toBeVisible();
  const table = page.locator(".compare-table");
  await expect(table.locator("thead th")).toHaveCount(5);
  await expect(table).toContainText("U is partial");
  await expect(table).toContainText("not assessed");
  await expect(
    page.getByText("No winner is declared", { exact: false }),
  ).toBeVisible();
  await table
    .getByRole("button", { name: /Remove .* from comparison/ })
    .first()
    .click();
  await expect(table.locator("thead th")).toHaveCount(4);
});

test("Discovery Frontier lists research candidates with hypothetical bounds", async ({
  page,
}) => {
  await page.goto("/#/frontier?mission=jezero");
  await expect(
    page.getByRole("heading", { name: "Discovery Frontier" }),
  ).toBeVisible();
  await expect(page.locator(".frontier-card")).toHaveCount(6);
  await expect(page.locator(".frontier-card").first()).toContainText(
    "Research candidate requiring validation",
  );
  await expect(
    page.getByText("not a formal expected value of information", {
      exact: false,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Moon · Crisium/ }).click();
  await expect(page.locator(".frontier-card")).toHaveCount(16);
  await page.goto("/#/passport/chile--22.500--70.000?mission=jezero");
  await expect(
    page.getByRole("heading", { name: "What should we measure next?" }),
  ).toBeVisible();
});

test("Planetary Transfer Lab computes Froude scaling and labels scenarios", async ({
  page,
}) => {
  await page.goto("/#/transfer-lab?target=mars&id=saudi-24.000-39.375");
  await expect(
    page.getByRole("heading", { name: "Planetary Transfer Lab" }),
  ).toBeVisible();
  const kpis = page.locator(".lab-kpis dd");
  await expect(kpis.nth(0)).toHaveText("0.0510"); // 0.5² / (9.80665 · 0.5)
  await expect(kpis.nth(1)).toContainText("0.308");
  await expect(
    page.getByText("Froude matching is not full physical similarity."),
  ).toBeVisible();
  await expect(page.locator(".lab-table")).toContainText("91,600");
  await expect(page.locator(".lab-table .tag-assumed")).toHaveCount(2);
  await page.getByRole("button", { name: "Moon", exact: true }).click();
  await expect(kpis.nth(1)).toContainText("0.203");
});

test("What-if explorer re-ranks from real scores and reports stability", async ({
  page,
}) => {
  await page.goto("/#/what-if?mission=jezero");
  await expect(
    page.getByRole("heading", { name: "What if the mission changes?" }),
  ).toBeVisible();
  const firstRow = page.locator(".whatif-table tbody tr").first();
  await expect(firstRow).toContainText("Western Saudi Arabia · 02");
  await page.locator("#wi-alpha").fill("0");
  await expect(firstRow).toContainText("Gobi region · 01");
  await expect(firstRow).toContainText(
    "terrain fidelity F was weighted less heavily",
  );
  await expect(
    page.getByText("Ranking stability under model assumptions."),
  ).toBeVisible();
  await expect(page.locator(".rb-row:not(.rb-head):not(.rb-axis)")).toHaveCount(
    10,
  );
  await page.getByRole("button", { name: /Moon · Crisium/ }).click();
  await expect(
    page.getByText("no automatic candidate has assessed basaltic geology", {
      exact: false,
    }),
  ).toBeVisible();
});

test("Analog Forensics defaults to measured 2D maps with a quantitative table", async ({
  page,
}) => {
  await page.goto("/#/site/saudi-24.000-39.375?mission=jezero");
  const viewer = page.locator(".terrain-viewer");
  await viewer.scrollIntoViewIfNeeded();
  await expect(
    viewer.getByRole("heading", { name: /Analog Forensics/ }),
  ).toBeVisible();
  await expect(viewer.locator("canvas.forensic-map")).toHaveCount(2);
  await expect(viewer.locator(".forensic-table")).toContainText("94.7");
  await viewer.getByRole("button", { name: "×5" }).click();
  await expect(viewer.locator(".ve-statement")).toContainText("×5");
  await viewer.getByRole("button", { name: "3D surface" }).click();
  await expect(viewer.locator("canvas.surface-canvas")).toHaveCount(2);
});

test("Compare Worlds shows two sourced NASA image pairs with caveats", async ({
  page,
}) => {
  await page.goto("/#/worlds");
  await expect(
    page.getByRole("heading", { name: "Compare Worlds" }),
  ).toBeVisible();
  await expect(page.locator(".worlds-pair")).toHaveCount(2);
  await expect(page.locator(".worlds-provenance").first()).toContainText(
    "Landsat 8",
  );
  await expect(page.locator(".worlds-provenance").nth(1)).toContainText(
    "Landsat 9",
  );
  await expect(
    page.getByText("colour or brightness does not establish mineralogy", {
      exact: false,
    }),
  ).toBeVisible();
  await page.locator(".split-range").first().fill("20");
  await page.getByRole("button", { name: "Side by side" }).first().click();
  await expect(page.locator(".side-frame").first()).toBeVisible();
});

test("Expedition Packet exports JSON, CSV and GeoJSON that match the displayed scores", async ({
  page,
}) => {
  await page.goto("/#/expedition/saudi-24.000-39.375?mission=jezero");
  await expect(
    page.getByRole("heading", { name: "EXPEDITION PACKET" }),
  ).toBeVisible();
  const shownF = await page
    .locator(".score-strip > div")
    .nth(0)
    .locator("strong")
    .textContent();
  const [json] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "JSON", exact: true }).click(),
  ]);
  const { readFileSync } = await import("node:fs");
  const pkt = JSON.parse(readFileSync((await json.path())!, "utf8"));
  expect(Math.round(pkt.scores.F)).toBe(Number(shownF));
  expect(pkt.candidate.id).toBe("saudi-24.000-39.375");
  expect(pkt.reproducibility.model.weights.geology).toBeCloseTo(0.55, 9);
  const [csv] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "CSV" }).click(),
  ]);
  expect(readFileSync((await csv.path())!, "utf8")).toContain(
    "F terrain fidelity",
  );
  const [geo] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "GeoJSON" }).click(),
  ]);
  const g = JSON.parse(readFileSync((await geo.path())!, "utf8"));
  expect(g.features[0].geometry.coordinates).toEqual([39.375, 24]);
  await expect(
    page.getByRole("heading", { name: "Reproducibility metadata" }),
  ).toBeVisible();
});

test("guided demo navigates seven scenes with real values and keyboard controls", async ({
  page,
}) => {
  await page.goto("/#/");
  await page.getByRole("link", { name: /Guided demo/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".demo-count")).toHaveText("1 / 7");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".demo-funnel")).toContainText("130");
  await page.getByRole("button", { name: /Next/ }).click();
  await page.getByRole("button", { name: /Next/ }).click();
  await expect(page.locator(".demo-physics")).toContainText("0.62 m/s");
  await page.keyboard.press("End");
  await expect(page.getByText("Earth is the training ground.")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/explorer/);
});
