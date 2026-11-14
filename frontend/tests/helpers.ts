import type { Page } from "@playwright/test";
export async function openResearch(page: Page, name: string) {
  const link = page.getByRole("link", { name, exact: true });
  if (!(await link.isVisible())) {
    const tools = page.getByRole("button", {
      name: "Research tools",
      exact: true,
    });
    if (!(await tools.isVisible()))
      await page
        .getByRole("button", { name: "Open navigation", exact: true })
        .click();
    await tools.click();
  }
  await link.click();
}
