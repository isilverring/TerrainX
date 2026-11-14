import { test, expect } from "@playwright/test";

test("130-cell search compares the released and mission-aware shortlists", async ({
  page,
}) => {
  await page.goto("/#/explorer?mission=jezero");
  await page.getByRole("link", { name: "All cells", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: /searched for the mission/ }),
  ).toBeVisible();
  await expect(page.locator(".cell-funnel")).toContainText("130");
  await expect(page.locator(".cell-panel")).toHaveCount(4);
  await expect(page.locator(".cell-panel .cell")).toHaveCount(130);
  await page.locator(".cell-panel .cell").first().click();
  await expect(page.locator(".cell-detail h2")).toBeVisible();
  // Moon: the first lunar-eligible cell is called out with its mapped unit.
  await page.getByRole("button", { name: "Moon · Mare Crisium" }).click();
  await expect(page.locator(".cell-callout")).toContainText("Basaltic");
  await expect(page.locator(".cell-funnel")).toContainText(
    "rankable for this mission",
  );
});

test("lunar south pole shows verified LOLA terrain and Earth twins", async ({
  page,
}) => {
  await page.goto("/#/lunar-pole");
  await expect(
    page.getByRole("heading", {
      name: "Where Earth runs out of terrain analogs.",
    }),
  ).toBeVisible();
  await expect(page.locator(".polar-verify")).toContainText("a511e40d7a3e");
  await expect(page.locator(".polar-site")).toHaveCount(8);
  await page
    .locator(".polar-key")
    .getByRole("button", { name: /Shackleton/ })
    .click();
  await expect(page.locator(".polar-detail h2")).toHaveText("Shackleton");
  await expect(page.locator(".polar-detail")).toContainText(
    "not an Artemis III region",
  );
  await expect(page.locator(".polar-twins li")).toHaveCount(4);
});

test("landing findings come from the release and the challenge-fit page lists gaps honestly", async ({
  page,
}) => {
  await page.goto("/#/");
  await expect(page.locator(".finding-card")).toHaveCount(3);
  await expect(page.locator(".finding-card").first()).toContainText(
    "mapped-basalt lead in this sample",
  );
  await page
    .getByRole("link", { name: /How TerrainX meets the challenge/ })
    .click();
  await expect(
    page.getByRole("heading", { name: /What the challenge asks/ }),
  ).toBeVisible();
  await expect(page.locator(".fit-card")).toHaveCount(12);
  await expect(
    page.locator(".fit-card").filter({ hasText: "No verified cave" }),
  ).toBeVisible();
  await expect(page.locator(".fit-data")).toContainText("Diviner modeled");
  await expect(page.locator(".document-title")).toContainText(
    "does not require every dimension or partner",
  );
});
