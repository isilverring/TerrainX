# TerrainX

**Planetary Analog Discovery & Mission Readiness Lab**

“Before we land on another world,let's discover where to practice on ours.”

A working static React/Vite scientific discovery application and reproducible Python pipeline for the2026 NASA Space Apps challenge,[Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars](https://www.spaceappschallenge.org/2026/challenges/permanent-moon-base-locations-and-mars/). Independent project;NASA data use does not imply endorsement.

All work stays in **D:\TerrainX**. Private repository:[isilverring/TerrainX](https://github.com/isilverring/TerrainX). Read[STATUS.md](STATUS.md),[NEXT_STEPS.md](NEXT_STEPS.md) and[DATA_STATUS.md](DATA_STATUS.md) before resuming after a stop,power issue or usage limit.

## Working experience

Landing;Mars/Jezero and Moon/Mare Crisium Explorer;interactive MapLibre Earth map and verified NASA GIBS;region/evidence filters;separate F/U/C and gated P;adjustable normalized mission weights;Analog DNA with real values/units;geological citations;Reality Gap;field hypothesis;printable Analog Passport;Methodology and source register.Mobile mission drawer and readable detail routes,reduced-motion support,lazy map/charts,and runtime Zod data validation are implemented.

No application authentication,database,backend,paid API,LLM or judge-time NASA query is required.Cached data are versioned.Map tiles and external source links need internet;science panels work if tiles fail.

## Run locally

Node22+ and Python3.11+ recommended.This workstation has Python3.12 via `py -3.12`;its Windows Store `python` alias is not a usable interpreter.The app has also built successfully on the installed Node20.16,but a map-validation dependency declares Node22.

```powershell
Set-Location D:\TerrainX
npm --prefix frontend ci
npm run dev
```

Open **http://127.0.0.1:5173/**.Scientific JSON is already included;preprocessing is not needed simply to run the app.

## Reproduce science

```powershell
Set-Location D:\TerrainX
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe scripts\fetch_geography.py
.\.venv\Scripts\python.exe scripts\build_planetary_profiles.py
.\.venv\Scripts\python.exe scripts\build_discovery.py
.\.venv\Scripts\python.exe scripts\validate_results.py
```

Successful requests are cached.Rerun `build_discovery.py --offline` to regenerate from cached Earth inputs.An interrupted run writes completed candidates atomically and resumes using successful caches.Planetary downloads use `.partial` files then rename.The two33MB rasters are ignored by Git;labels,checksums and exact native extraction pixels are committed.Fresh clones can re-download with the planetary script.

## Validate and build

```powershell
.\.venv\Scripts\python.exe scripts\validate_results.py
npm run build
# With the dev server running in another terminal:
npm test
npm --prefix frontend audit
```

Current scientific validation:48 tests plus independent reproduction of saved metrics/scores.Strict TypeScript and static production build pass.Playwright uses the installed Chrome channel and tests1568×1003 desktop,390×844 mobile,the full mission-to-Passport flow,live GIBS,weights and print/PDF.On another machine install Chrome or adjust the channel in `frontend/playwright.config.ts`.Dependency audit reports zero known vulnerabilities with this lockfile.See `docs/QA.md` for final visual and interaction evidence.

## Static deployment

`npm run build` builds `frontend/dist` and copies a clean root **dist/** release.Hash routes work on static hosts without server rewrites.No runtime secrets/environment variables are required.

- **Netlify:**import using `netlify.toml`;base:`frontend`;build:`npm ci && npm run build`;publish:`dist`;Node22.
- **Vercel:**import root using `vercel.json`;install frontend dependencies;run root `npm run build`;serve root `dist`;Node22+,no framework preset.
- **Sites:**`.openai/hosting.json` retains the linked owner-private preview project.Publication status and URL are in `STATUS.md`.Do not duplicate the Site or silently change its audience.The app itself has no account system;owner-private hosting may add a preview access gate.Public judge deployment can use Netlify/Vercel without adding app authentication.

## Actual findings and limits

130 real cells;16 automatic candidates;10 preliminary characterized candidates;4 benchmarks;20 real climate profiles;20 SRTM grids;2 planetary DEM profiles;19 mapped geologies;no acquisition errors.No automatic candidate has established direct lunar-basalt relevance in the selected evidence.No field experiment or NASA certification is claimed.

POWER cells are not outcrop measurements.SRTM≈90m native support is sampled at4km,not used as a90m hazard map.Common spacing does not eliminate unequal Earth/MOLA/LOLA support.Mapped lithology is not verified mineralogy.Scores are declared assumptions,not probabilities.Read[SCIENCE.md](SCIENCE.md),[DATA_SOURCES.md](DATA_SOURCES.md) and the in-app methods.

## Recovery and durable checkpoints

After each completed module:update status/next steps,run relevant checks,then:

```powershell
.\scripts\checkpoint.ps1 -Message "feat: describe completed module"
```

This commits,pushes main,and verifies local/remote SHAs match.Never store credentials in files.A sudden shutdown can lose edits since the latest checkpoint;GitHub commits are the recovery boundary.Browser selection/weights are local convenience state;scientific release data are versioned.

See[DEMO.md](DEMO.md) for the90-second judge demonstration and scientific caveats.
