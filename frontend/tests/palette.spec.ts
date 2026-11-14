import { test, expect } from "@playwright/test";

test("command palette jumps to pages and candidate actions from the keyboard", async ({ page }) => {
  await page.goto("/#/methodology");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog", { name: "Jump to a page or candidate" });
  await expect(dialog).toBeVisible();
  await page.keyboard.type("lenses");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "One shortlist, six questions." })).toBeVisible();

  await page.getByRole("button", { name: /Search pages and candidates/ }).click();
  await page.keyboard.type("gobi passport");
  await expect(dialog.getByRole("option").first()).toContainText("passport");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#\/passport\/gobi-/);

  // Escape closes without navigating; "/" opens when not typing in a field.
  await page.keyboard.press("/");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});
