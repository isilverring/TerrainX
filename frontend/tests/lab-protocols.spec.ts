import { expect, test } from "@playwright/test";

test("invalid, conflicting and historical Lab protocols do not silently open a substitute", async ({
  page,
}) => {
  for (const query of [
    "lab=unknown&mission=jezero",
    "lab=base&mission=jezero",
    "lab=dust&protocol=source&mission=jezero",
    "lab=dust&mission=jezero&science=science-79daa128eae12594",
  ]) {
    await page.goto(`/#/field-study?id=saudi-24.000-39.375&${query}`);
    await expect(
      page.getByRole("heading", {
        name: "Requested research protocol is unavailable",
      }),
    ).toBeVisible();
    await expect(page.locator(".field-setup")).toHaveCount(0);
  }
});

test("a Research Lab protocol link seeds an editable field study and survives sharing", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(
    "/#/field-study?id=saudi-24.000-39.375&mission=jezero&lab=dust",
  );
  const banner = page.locator(".lab-protocol-banner");
  await expect(banner).toContainText("Dust & wind");
  await expect(banner).toContainText("not observations");
  await expect(page.locator("textarea").first()).toHaveValue(/Shao–Lu/);
  await banner.getByRole("link").click();
  await expect(page).toHaveURL(/research-lab\?module=dust/);
  expect(errors).toEqual([]);
});

test("Passport lists open challenge questions with lab and protocol links", async ({
  page,
}) => {
  await page.goto("/#/passport/saudi-24.000-39.375?mission=jezero");
  const oq = page.locator(".open-questions");
  await expect(oq.locator("li")).toHaveCount(8);
  await oq.locator("li").nth(5).getByRole("link", { name: "Protocol" }).click();
  await expect(page).toHaveURL(/field-study\?.*lab=caves/);
  await expect(page.locator(".lab-protocol-banner")).toContainText(
    "Caves & subsurface",
  );
});

test("Research Lab is reachable from the research menu and the command palette", async ({
  page,
}) => {
  await page.goto("/#/cases");
  await page.locator(".research-toggle").click();
  await page
    .locator("#research-navigation")
    .getByRole("link", { name: "Research Lab" })
    .click();
  await expect(page).toHaveURL(/research-lab/);
  await expect(page.locator("h1")).toContainText("evidence gap");
  await page
    .getByRole("button", { name: /Search pages and candidates/ })
    .click();
  await page.keyboard.type("dust wind");
  await expect(page.locator("#palette-list")).toContainText("Dust & wind");
});
