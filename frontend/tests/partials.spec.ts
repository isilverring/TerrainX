import {test,expect} from "@playwright/test";
import {readFileSync} from "node:fs";

test("challenge partials open eight working, bounded research tools",async({page})=>{
 await page.goto("/#/challenge");
 await expect(page.locator(".fit-card.implemented")).toHaveCount(8);
 await expect(page.locator(".fit-implementation-note")).toContainText("evidence remains source-scoped");
 const geology=page.locator(".fit-card").filter({hasText:"Geology, mineralogy"});
 await geology.getByRole("link",{name:"Resolve this research gap"}).click();
 await expect(page.locator("main.lab-page")).toBeVisible();
 await page.getByRole("button",{name:"Load published Salda XRD specimen"}).click();
 await expect(page.getByLabel("Constituent1 percentage")).toHaveValue("98.6");
 await expect(page.locator(".lab-metrics")).toContainText("Within rule");
 await expect(page.locator(".lab-reference").filter({hasText:"Quantified mineral phases"})).toContainText("Exact numeric sample/entrance position unavailable");
});

test("thermal tool shows actual daily NASA data and inspectable lunar illumination",async({page})=>{
 await page.goto("/#/research-lab?module=illumination&cohort=expanded&polar=none&id=saudi-24.000-39.375");
 await expect(page.locator(".lab-outcome")).toBeVisible();
 await expect(page.getByText("365 valid days",{exact:false})).toBeVisible();
 await expect(page.getByLabel("Lunar illumination reference")).toHaveValue("haworth");
 await expect(page.getByLabel("Lunar hourly sample")).toBeVisible();
 await page.getByLabel("Lunar hourly sample").fill("1000");
 await expect(page.getByText("2025-02-11T16:30:00.000Z",{exact:false})).toBeVisible();
 await page.getByLabel("Day of2025",{exact:true}).fill("0");
 await expect(page.locator(".lab-error")).toContainText("Day of2025");
 await expect(page.locator("vite-error-overlay")).toHaveCount(0);
});

test("resource scenarios export no invented reserve or Earth ice measurement",async({page})=>{
 await page.goto("/#/research-lab?module=resources&cohort=expanded&polar=none");
 await page.getByRole("button",{name:"Use LCROSS-inspired mixture scenario"}).click();
 await expect(page.getByLabel("Scenario water mass fraction")).toHaveValue("5.6");
 await expect(page.locator(".lab-metrics").filter({hasText:"Scenario recovered water"})).toContainText("4.480");
 const file=page.waitForEvent("download");await page.getByRole("button",{name:"Export research decision",exact:true}).click();
 const report=JSON.parse(readFileSync((await(await file).path())!,"utf8"));
 expect(report.module).toBe("resources");expect(report.results.reserveEstimate).toBeNull();expect(report.results.classification).toBe("SCENARIO MASS BALANCE");
 expect(report.scientific_input_manifest["challenge_evidence.json"].sha256).toHaveLength(64);
 await expect(page.locator(".lab-reference").filter({hasText:"Janssonhaugen"})).toContainText("2005");
});

test("dust screen distinguishes friction velocity, model assumptions and lunar vacuum",async({page})=>{
 await page.goto("/#/research-lab?module=dust&cohort=expanded&polar=none");
 await expect(page.locator(".lab-table tbody tr")).toHaveCount(3);
 await expect(page.locator(".lab-table tbody tr").last()).toContainText("no atmospheric wind entrainment");
 await page.getByLabel("Particle diameter",{exact:true}).fill("2");
 await expect(page.getByRole("alert")).toContainText("extrapolation");
 const file=page.waitForEvent("download");await page.getByRole("button",{name:"Export research decision",exact:true}).click();
 const report=JSON.parse(readFileSync((await(await file).path())!,"utf8"));
 expect(report.results.find((r:{body:string})=>r.body==="Moon").threshold).toBeNull();
});

test("biosignature decision becomes a scoped, shareable field protocol",async({page,context})=>{
 await context.grantPermissions(["clipboard-read","clipboard-write"]);
 await page.goto("/#/research-lab?module=biology&cohort=expanded&polar=none&id=reference-atacama");
 await expect(page.getByText("Enter at least2 sample replicates",{exact:false})).toBeVisible();
 await page.getByLabel("Sample replicate signals").fill("10,12");await page.getByLabel("Blank replicate signals").fill("0,1,2");
 await page.getByLabel("Positive-control measured signal").fill("11");await page.getByLabel("Expected positive-control increment").fill("10");
 await expect(page.getByText("Signal exceeds the declared blank rule.",{exact:false})).toBeVisible();
 await page.getByRole("link",{name:"Build this field protocol"}).click();
 await expect(page.locator("main.field-page")).toBeVisible();
 await expect(page).toHaveURL(/lab=biology/);
 const file=page.waitForEvent("download");await page.getByRole("button",{name:"Export JSON",exact:true}).click();
 const study=JSON.parse(readFileSync((await(await file).path())!,"utf8"));
 expect(study.research_lab_protocol).toBe("biology");expect(study.snapshot.research_lab_protocol).toBe("biology");
 expect(study.hypothesis).toContain("contamination");expect(study.local_notes).toContain('"sample":"10,12"');
 await page.getByRole("button",{name:"Copy share link",exact:true}).click();
 const url=await page.evaluate(()=>navigator.clipboard.readText());const other=await context.newPage();await other.goto(url);
 await expect(other.locator(".field-page")).toContainText("Research Lab protocol: biology");await other.close();
});

test("cave references and station plans never invent an entrance waypoint",async({page})=>{
 await page.goto("/#/research-lab?module=caves&cohort=expanded&polar=none");
 await expect(page.getByLabel("Documented cave reference").locator("option")).toHaveCount(3);
 await expect(page.locator(".lab-reference")).toContainText("no entrance waypoint");
 const file=page.waitForEvent("download");await page.getByRole("button",{name:"Export research decision",exact:true}).click();
 const report=JSON.parse(readFileSync((await(await file).path())!,"utf8"));expect(report.results.geojson).toBeNull();expect(report.results.stations).toHaveLength(6);expect(report.results.stations.every((s:{absoluteCoordinates:unknown})=>s.absoluteCoordinates===null)).toBe(true);
});

test("measured route is adjustable and exports the actual proposed graph path",async({page})=>{
 await page.goto("/#/research-lab?module=operations&cohort=expanded&polar=none&id=saudi-24.000-39.375");
 await expect(page.locator(".lab-route-map canvas")).toHaveAttribute("width","97");
 await expect(page.getByRole("button",{name:"Export proposed route GeoJSON"})).toBeEnabled();
 const file=page.waitForEvent("download");await page.getByRole("button",{name:"Export proposed route GeoJSON"}).click();
 const geo=JSON.parse(readFileSync((await(await file).path())!,"utf8"));expect(geo.features[0].geometry.coordinates.length).toBeGreaterThan(2);expect(geo.features[0].properties.sample_spacing_m).toBe(250);expect(geo.features[0].properties.classification).toContain("NOT FIELD CLEARED");
 await page.getByLabel("Sampled edge-slope constraint").fill("0.1");await expect(page.locator(".lab-outcome")).toBeVisible();
});

test("lunar tradeoff handoff retains its real reference and unassessed utility",async({page})=>{
 await page.goto("/#/research-lab?module=base&cohort=expanded&polar=none&lunar=nobile&id=chile--23.000--70.000");
 await expect(page.getByLabel("Lunar engineering reference")).toHaveValue("nobile");
 await expect(page.locator(".lab-table tbody tr")).toHaveCount(8);
 await page.getByLabel("Relative sunlight importance").fill("1");
 await page.getByRole("link",{name:"Build this field protocol"}).click();
 await expect(page).toHaveURL(/polar=nobile/);await expect(page.locator(".field-page")).toContainText("Research Lab protocol: base");
 const file=page.waitForEvent("download");await page.getByRole("button",{name:"Export JSON",exact:true}).click();const study=JSON.parse(readFileSync((await(await file).path())!,"utf8"));
 expect(study.snapshot.target_reference).toBe("lunar-polar:nobile");expect(study.research_lab_protocol).toBe("base");
 await page.goto("/#/research-lab?module=base&science=science-79daa128eae12594&cohort=expanded&polar=none");
 await expect(page.getByRole("heading",{name:"Research Lab unavailable in this historical release."})).toBeVisible();
});
