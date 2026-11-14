import {test,expect} from "@playwright/test";
test("expanded lead opens DNA, map and a source-pinned Passport without replacing the baseline",async({page,browser})=>{
 await page.goto("/#/cells?mission=mare-crisium&cell=chile--23.000--70.000");
 await page.getByRole("link",{name:"Open Analog DNA",exact:true}).click();
 await expect(page.locator("main.detail-page h1")).toBeVisible();
 await expect(page.getByLabel("Study collection")).toHaveValue("expanded");
 await expect(page).toHaveURL(/cohort=expanded/);
 await page.locator(".site-actions").getByRole("link",{name:"Analog Passport"}).click();
 await expect(page.locator("main.passport-page")).toContainText("Mare Crisium");
 const link=await page.locator(".passport-link a").getAttribute("href");
 const fresh=await browser.newPage();await fresh.goto(link!);
 await expect(fresh.locator("main.passport-page")).toBeVisible();await expect(fresh.getByLabel("Study collection")).toHaveValue("expanded");
 await fresh.close();
 await page.getByRole("link",{name:"Discovery atlas",exact:true}).click();
 await expect(page).toHaveURL(/cohort=expanded/);await expect(page.locator(".explorer")).toContainText("130 screened-cell profiles");
 await page.getByLabel("Study collection").selectOption("original");
 await expect(page.locator(".explorer")).toContainText("16 algorithmic candidates");
});
