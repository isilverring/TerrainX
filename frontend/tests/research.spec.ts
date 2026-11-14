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
