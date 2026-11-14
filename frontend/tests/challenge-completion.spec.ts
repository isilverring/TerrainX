import { test, expect } from "@playwright/test";
test("five-step judge path reaches the sourced proposal and secondary tools stay accessible", async ({
  page,
}) => {
  await page.goto("/#/guide?cohort=expanded&polar=none");
  await expect(page.locator("main.guide-page h1")).toContainText(
    "testable field question",
  );
  await expect(page.locator(".guide-scene")).toContainText("Where on Earth");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.locator(".guide-scene")).toContainText(
    "130 screened cells",
  );
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.locator(".guide-scene .score-strip")).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.locator(".guide-scene .site-evidence")).toContainText(
    "Basaltic-andesite lava",
  );
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("link", { name: "Prepare this field proposal" }).click();
  await expect(page.locator("main.field-page")).toBeVisible();
  await expect(page).toHaveURL(/protocol=source/);
  await page
    .getByRole("button", { name: "Research tools", exact: true })
    .click();
  await page.getByRole("link", { name: "Terrain pilot", exact: true }).click();
  await expect(page.locator("main.pilot-page")).toBeVisible();
});
test("independent cases expose local volcanic contradiction and regional Mars evidence gap", async ({
  page,
}) => {
  await page.goto("/#/cases");
  await expect(page.locator(".site-evidence")).toHaveCount(2);
  const moon = page.locator("#evidence-chile--23\\.000--70\\.000");
  await expect(moon).toContainText("Basaltic-andesite lava");
  await expect(moon).toContainText("9.9 km");
  const mars = page
    .locator(".site-evidence")
    .filter({ hasText: "geographic evidence gap" });
  await expect(mars).toContainText("55.7 km");
  await expect(mars).toContainText(
    "outside the analysis window; measurements not transferred",
  );
  await moon
    .getByRole("link", { name: "Use literature-informed field proposal" })
    .click();
  await expect(page.locator(".field-page")).toBeVisible();
  const file = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON", exact: true }).click();
  const { readFileSync } = await import("node:fs");
  const study = JSON.parse(readFileSync((await (await file).path())!, "utf8"));
  expect(study.hypothesis).toContain("material classes and alteration");
  expect(study.snapshot.proposal_protocol).toBe("site-evidence");
});
test("expanded common-support grids and processing-order sensitivity remain separate from discovery", async ({
  page,
}) => {
  await page.goto(
    "/#/terrain-pilot?study=expanded&id=chile--23.000--70.000&mission=mare-crisium",
  );
  await expect(page.locator(".pilot-page")).toContainText("18-site experiment");
  await expect(page.locator(".pilot-grids svg")).toHaveCount(2);
  await expect(page.locator(".support-ranks")).toContainText("F-only order");
  await page
    .getByLabel("Common square averaging support")
    .selectOption("12000");
  await expect(page.locator(".pilot-page")).toContainText("12");
  await page.goto(
    "/#/site/chile--23.000--70.000?cohort=expanded&mission=mare-crisium",
  );
  await expect(page.locator(".support-sensitivity")).toContainText(
    "10 valid support/offset choices",
  );
});
test("polar reference survives dossier, export and field-study replay with utility unassessed", async ({
  page,
  browser,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/#/lunar-pole?site=haworth");
  await page
    .getByRole("link", { name: "Compare Earth with Haworth", exact: true })
    .first()
    .click();
  await expect(
    page.locator("main.detail-page .document-label").first(),
  ).toContainText("Haworth");
  await expect(page.locator(".score-strip").first()).toContainText("0%");
  await page.getByRole("link", { name: "Prepare Analog Passport" }).click();
  const replay = await page.locator(".passport-link a").getAttribute("href");
  const other = await browser.newPage();
  await other.goto(replay!);
  await expect(other.locator("main.passport-page")).toContainText("Haworth");
  await other.close();
  await page
    .getByRole("link", { name: "Discovery atlas", exact: true })
    .click();
  await expect(page.locator("#target option:checked")).toHaveText(
    "Haworth · Moon",
  );
  await page.getByRole("link", { name: "Field study", exact: true }).click();
  await expect(page.getByLabel("Planetary mission")).toContainText("Haworth");
  await page.getByRole("button", { name: "Suggest relief transect" }).click();
  const file = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON", exact: true }).click();
  const { readFileSync } = await import("node:fs");
  const study = JSON.parse(readFileSync((await (await file).path())!, "utf8"));
  expect(study.target_reference).toBe("lunar-polar:haworth");
  expect(study.snapshot.target_reference).toBe("lunar-polar:haworth");
  await page.getByRole("button", { name: "Copy share link" }).click();
  const fieldLink = await page.evaluate(() => navigator.clipboard.readText());
  const fieldReplay = await browser.newPage();
  await fieldReplay.goto(fieldLink);
  await expect(fieldReplay.getByLabel("Planetary mission")).toContainText(
    "Haworth",
  );
  await expect(fieldReplay.locator(".field-stations li")).toHaveCount(5);
  await fieldReplay.close();
});
test("expanded lead opens DNA, map and a source-pinned Passport without replacing the baseline", async ({
  page,
  browser,
}) => {
  await page.goto("/#/cells?mission=mare-crisium&cell=chile--23.000--70.000");
  await page
    .getByRole("link", { name: "Open Analog DNA", exact: true })
    .click();
  await expect(page.locator("main.detail-page h1")).toBeVisible();
  await expect(page.getByLabel("Study collection")).toHaveValue("expanded");
  await expect(page).toHaveURL(/cohort=expanded/);
  await page
    .locator(".site-actions")
    .getByRole("link", { name: "Analog Passport" })
    .click();
  await expect(page.locator("main.passport-page")).toContainText(
    "Mare Crisium",
  );
  const link = await page.locator(".passport-link a").getAttribute("href");
  const fresh = await browser.newPage();
  await fresh.goto(link!);
  await expect(fresh.locator("main.passport-page")).toBeVisible();
  await expect(fresh.getByLabel("Study collection")).toHaveValue("expanded");
  await fresh.close();
  await page
    .getByRole("link", { name: "Discovery atlas", exact: true })
    .click();
  await expect(page).toHaveURL(/cohort=expanded/);
  await expect(page.locator(".explorer")).toContainText(
    "130 screened-cell profiles",
  );
  await page.getByLabel("Study collection").selectOption("original");
  await expect(page.locator(".explorer")).toContainText(
    "16 algorithmic candidates",
  );
});
