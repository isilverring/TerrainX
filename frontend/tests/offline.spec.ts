import { test, expect } from "@playwright/test";
test("prepared production demo reloads and opens lazy science views without a network", async ({
  page,
  context,
  baseURL,
}) => {
  test.skip(
    !baseURL?.includes(":4173"),
    "Offline acceptance uses the actual production build on port4173.",
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
