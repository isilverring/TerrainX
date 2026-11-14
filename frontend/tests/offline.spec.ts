import { test, expect } from "@playwright/test";
test("prepared production demo reloads and opens lazy science views without a network", async ({
  page,
  context,
}) => {
  const catalogue = await page.request.get("/offline-index.json");
  let production = false;
  try {
    production = (await catalogue.json()).schema_version === 1;
  } catch {}
  test.skip(
    !production,
    "Offline acceptance requires the production catalogue (local preview or public deployment).",
  );
  // Reproduce canonical-index redirects used by public static hosts even on
  // local preview. A cached redirected response must still support navigation.
  await context.route("**/index.html", (route) =>
    route.fulfill({ status: 302, headers: { location: "/" } }),
  );
  await page.goto("/#/offline");
  await page
    .getByRole("button", { name: "Prepare offline demo", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Offline ready", exact: true }),
  ).toBeVisible({ timeout: 90000 });
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  const before = await page.evaluate(async () =>
    (await (
      await caches.open("terrainx-offline-metadata")
    ).match("/__terrainx_prepared__"))!.json(),
  );
  expect(
    await page.evaluate(async (cacheName: string) =>
      (await (await caches.open(cacheName)).match("/index.html"))?.redirected,
      before.cache,
    ),
  ).toBe(true);
  // Force a later asset verification failure. Partial download must not replace the ready pointer.
  await context.route("**/releases/**/dataset.json", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" }),
  );
  await page
    .getByRole("button", { name: "Prepare offline demo", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Checksum failed", {
    timeout: 90000,
  });
  expect(
    await page.evaluate(async () =>
      (await (
        await caches.open("terrainx-offline-metadata")
      ).match("/__terrainx_prepared__"))!.json(),
    ),
  ).toEqual(before);
  await context.unrouteAll();
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("link", { name: "Cases", exact: true }).click();
  await expect(page.locator(".case-study")).toHaveCount(3);
  await page.goto("/#/cells?mission=mare-crisium&cell=chile--23.000--70.000");
  await page
    .getByRole("link", { name: "Plan a field study for this cell" })
    .click();
  await page.getByRole("button", { name: "Suggest relief transect" }).click();
  await expect(page.locator(".field-stations li")).toHaveCount(5);
  await page.goto("/#/lunar-pole?site=haworth");
  await expect(page.locator(".polar-detail h2")).toHaveText("Haworth");
  await expect(page.locator(".polar-verify")).toContainText("PDS MD5 verified");
  await page.goto("/#/site/saudi-24.000-39.375?mission=jezero");
  await expect(
    page.getByRole("heading", { name: /NASA Earth observations/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Forensics", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: /Analog Forensics/ }),
  ).toBeVisible();
  await page.goto("/#/expedition/saudi-24.000-39.375?mission=jezero");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "JSON", exact: true }).click();
  expect((await download).suggestedFilename()).toContain(".json");
  await page.goto("/#/demo?presentation=1");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("End");
  await expect(page.getByRole("dialog")).toContainText(
    "Earth is the training ground",
  );
});
