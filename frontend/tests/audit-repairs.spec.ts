import { test, expect } from "@playwright/test";
test("screened-cell field proposal preserves coordinates, saved model and historical release", async ({
  page,
  browser,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/#/what-if?mission=mare-crisium");
  await page.locator("#wi-alpha").fill("0.8");
  await page.goto("/#/cells?mission=mare-crisium&cell=chile--23.000--70.000");
  await page
    .getByRole("link", { name: "Plan a field study for this cell" })
    .click();
  await expect(page.getByLabel("Earth candidate")).toHaveValue(
    "chile--23.000--70.000",
  );
  await page.getByRole("button", { name: "Suggest relief transect" }).click();
  const file = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON", exact: true }).click();
  const { readFileSync } = await import("node:fs");
  const study = JSON.parse(readFileSync((await (await file).path())!, "utf8"));
  expect(study.snapshot.scenarios["mare-crisium"].alpha).toBe(0.8);
  expect(study.stations).toHaveLength(5);
  await page.getByRole("button", { name: "Copy share link" }).click();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  const historical = new URL(link),
    query = new URLSearchParams(historical.hash.split("?")[1]);
  const payload = JSON.parse(
    Buffer.from(query.get("share")!, "base64url").toString("utf8"),
  );
  payload.r = "science-53988b38e4d57b4f";
  historical.hash =
    "/field-study?share=" +
    Buffer.from(JSON.stringify(payload)).toString("base64url");
  const otherContext = await browser.newContext();
  const other = await otherContext.newPage();
  await other.goto(historical.href);
  await expect(other.getByLabel("Earth candidate")).toHaveValue(
    "chile--23.000--70.000",
  );
  await expect(other).toHaveURL(/science=science-53988b38e4d57b4f/);
  const replay = other.waitForEvent("download");
  await other.getByRole("button", { name: "Export JSON", exact: true }).click();
  const restored = JSON.parse(
    readFileSync((await (await replay).path())!, "utf8"),
  );
  expect(restored.snapshot.scenarios["mare-crisium"].alpha).toBe(0.8);
  expect(restored.stations).toEqual(study.stations);
  await otherContext.close();
});
test("polar deep link survives reload and states modeled ice and unknown support", async ({
  page,
}) => {
  await page.goto("/#/lunar-pole?site=haworth");
  await expect(page.locator(".polar-detail h2")).toHaveText("Haworth");
  await expect(page.locator(".polar-diviner")).toContainText(
    "not a detection of water ice",
  );
  await expect(page.locator(".polar-diviner")).toContainText(
    "Unknown ice-code area",
  );
  await page
    .locator(".polar-key")
    .getByRole("button", { name: /Shackleton/ })
    .click();
  await page.reload();
  await expect(page.locator(".polar-detail h2")).toHaveText("Shackleton");
});

test("command palette keyboard stays inside the modal during the guided demo", async ({
  page,
}) => {
  await page.goto("/#/demo?presentation=1");
  await expect(page.locator(".demo-count")).toHaveText("1 / 11");
  await page.keyboard.press("Control+k");
  const input = page.getByRole("combobox", {
    name: "Search pages and candidates",
  });
  await expect(input).toBeFocused();
  await input.press("End");
  await input.press("ArrowRight");
  await input.press("Tab");
  await expect(input).toBeFocused();
  await expect(page.locator(".demo-count")).toHaveText("1 / 11");
  await input.press("Escape");
  await expect(page.locator(".palette")).toHaveCount(0);
  await expect(page.locator(".demo-count")).toHaveText("1 / 11");
});

test("Transfer Lab stays contained at intermediate tablet width", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1100, height: 1003 });
  await page.goto("/#/transfer-lab");
  await expect(
    page.getByRole("heading", { name: "Planetary Transfer Lab" }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(1100);
});

test('polar provenance and thermal cards fit a phone viewport',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/#/lunar-pole?site=mons-mouton');
 await expect(page.locator('.polar-verify')).toContainText('PDS MD5 verified');await page.evaluate(()=>document.fonts.ready);
 await page.locator('.polar-diviner').scrollIntoViewIfNeeded();
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
