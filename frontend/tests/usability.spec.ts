import { test, expect } from "@playwright/test";

test("field planning respects the named collection and never silently broadens Original study", async ({
  page,
}) => {
  await page.goto("/#/field-study?cohort=original&polar=none");
  await expect(
    page.getByLabel("Earth candidate").locator("option"),
  ).toHaveCount(20);
  await page.goto(
    "/#/field-study?id=chile--23.000--70.000&cohort=original&polar=none",
  );
  await expect(
    page.getByRole("heading", { name: "Requested field site is unavailable" }),
  ).toBeVisible();
  await page.goto(
    "/#/field-study?id=chile--23.000--70.000&cohort=expanded&polar=none",
  );
  await expect(
    page.getByLabel("Earth candidate").locator("option"),
  ).toHaveCount(134);
  await expect(page.getByLabel("Earth candidate")).toHaveValue(
    "chile--23.000--70.000",
  );
});

test("mobile atlas keeps results and selected-site actions reachable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/explorer?cohort=original&polar=none");
  await expect(page.locator(".selected-summary")).toBeVisible();
  await page.getByRole("button", { name: "Results 20", exact: true }).click();
  await expect(
    page.getByLabel("Search candidates by name or status"),
  ).toBeInViewport();
  await page.locator(".candidate-row").nth(1).click();
  const selected = await page
    .locator(".candidate-row")
    .nth(1)
    .getAttribute("data-candidate-id");
  await expect(page.locator(".candidate-row").nth(1)).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page
    .getByRole("button", { name: "Selected site", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Plan a field experiment", exact: true }),
  ).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page
    .getByRole("link", { name: "Plan a field experiment", exact: true })
    .click();
  await expect(page.locator("main.field-page")).toBeVisible();
  await expect(page.getByLabel("Earth candidate")).toHaveValue(selected!);
});

test("score guide and filter recovery explain evidence without replacing the selected site", async ({
  page,
}) => {
  await page.goto("/#/explorer?cohort=original&polar=none");
  await page.locator(".candidate-row").first().click();
  const selected = await page
    .locator(".candidate-row")
    .first()
    .getAttribute("data-candidate-id");
  await page.getByText("How to read F · U · C", { exact: true }).click();
  await expect(page.locator(".score-key")).toContainText(
    "not confidence or a probability of success",
  );
  await page
    .getByLabel("Search candidates by name or status")
    .fill("not-a-real-site");
  await expect(
    page.getByRole("heading", { name: "Selected site is hidden by filters" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Reset filters", exact: true })
    .click();
  await expect(page.locator(".candidate-row.selected")).toHaveAttribute(
    "data-candidate-id",
    selected!,
  );
  await expect(page.locator(".candidate-row")).toHaveCount(20);
});

test("Discovery filters and selection survive dossier navigation, reload and browser history", async ({
  page,
}) => {
  await page.goto(
    "/#/explorer?atlas_region=gobi&atlas_q=gobi&atlas_sort=F&cohort=original",
  );
  await expect(page.locator(".candidate-row")).toHaveCount(4);
  await expect(page.getByLabel("Study region", { exact: true })).toHaveValue(
    "gobi",
  );
  const first = await page
    .locator(".candidate-row")
    .nth(1)
    .getAttribute("data-candidate-id");
  await page.locator(".candidate-row").nth(1).click();
  await expect(page.locator(".candidate-row.selected")).toHaveAttribute(
    "data-candidate-id",
    first!,
  );
  await page.locator(".candidate-row").nth(2).click();
  await expect(page.locator(".candidate-row").nth(2)).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.goBack();
  await expect(page.locator(".candidate-row.selected")).toHaveAttribute(
    "data-candidate-id",
    first!,
  );
  await page.getByRole("link", { name: "Analog DNA", exact: true }).click();
  await expect(page.locator("main.detail-page")).toBeVisible();
  await page
    .getByRole("link", { name: "Discovery atlas", exact: true })
    .click();
  await expect(page.locator(".candidate-row.selected")).toHaveAttribute(
    "data-candidate-id",
    first!,
  );
  await page.reload();
  await expect(
    page.getByLabel("Search candidates by name or status"),
  ).toHaveValue("gobi");
  await expect(page.locator(".candidate-row")).toHaveCount(4);
  await expect(
    page.getByRole("button", { name: "F", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("invalid and hidden selections are explicit and comparison IDs cannot fabricate extra sites", async ({
  page,
}) => {
  await page.goto(
    "/#/explorer?id=unknown&cohort=original&atlas_compare=unknown,reference-salda,reference-salda",
  );
  await expect(
    page.getByRole("heading", {
      name: "Selected site is outside this collection",
    }),
  ).toBeVisible();
  await expect(page.locator(".candidate-row.selected")).toHaveCount(0);
  await expect(page.locator(".compare-chips button")).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "Pick one more", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Reset filters and selection" })
    .click();
  await expect(page.locator(".candidate-row.selected")).toHaveCount(1);
  await page.goto(
    "/#/compare?ids=reference-salda,reference-salda,unknown&cohort=original",
  );
  await expect(page.locator(".compare-table")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Open Discovery", exact: true }),
  ).toBeVisible();
});

test("comparison edits keep expanded study and lunar polar target identity", async ({
  page,
}) => {
  await page.goto(
    "/#/compare?ids=chile--23.000--70.000,reference-salda,reference-khaybar&cohort=expanded&mission=mare-crisium&polar=haworth",
  );
  await expect(page.locator(".compare-table")).toBeVisible();
  await expect(page.locator(".target-cell strong")).toHaveText("Haworth");
  await expect(
    page.getByRole("button", { name: "Mars · Jezero", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: /Remove Lake Salda/ }).click();
  await expect(page).toHaveURL(/polar=haworth/);
  await expect(page).toHaveURL(/cohort=expanded/);
  await expect(page.locator(".target-cell strong")).toHaveText("Haworth");
  await expect(
    page.locator(".compare-table tbody").getByText("not assessed").first(),
  ).toBeVisible();
});
