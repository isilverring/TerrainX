# Deploying TerrainX to Vercel

TerrainX is a fully static site (React + Vite, hash routes, no server, no API keys, no environment variables). Everything Vercel needs is in the committed [`vercel.json`](../vercel.json).

| Setting | Value (from `vercel.json`) |
|---|---|
| Framework preset | Other (`"framework": null`) |
| Root directory | repository root (leave blank) |
| Install command | `npm --prefix frontend ci` |
| Build command | `npm run build` (runs `prepare_release.mjs` → `tsc` → `vite build` → offline catalogue → copies to `/dist`) |
| Output directory | `dist` |
| Node.js | **24.x**, pinned by root package.json and validated locally. |
| Caching | `sw.js` and `offline-index.json` never cached; `/assets/*` and `/releases/*` immutable for a year; `/data/*` 5 minutes |

The build is verified locally with exactly these commands (`npm --prefix frontend ci && npm run build` at the repo root). It reproduces the committed science release `science-b1a132b201ad2046` byte-for-byte; if a build ever reports a *new* release ID, someone changed a file in `frontend/public/data/` — commit that new `frontend/public/releases/<id>/` folder rather than deleting old ones.

## Option A — dashboard (recommended, about 5 minutes)

1. Sign in at <https://vercel.com> with GitHub.
2. **Add New… → Project → Import Git Repository**. If `isilverring/TerrainX` is not listed, choose **Adjust GitHub App Permissions** and grant the Vercel app access to that private repository.
3. On the configure screen leave **Root Directory** at `./` and **Framework Preset** at *Other*. The build/install/output fields are filled from `vercel.json`; do not override them.
4. No environment variables are needed. Click **Deploy**.
5. When it finishes, open the production URL (`https://<project>.vercel.app`).

Every push to `main` then redeploys production; pushes to other branches create preview deployments.

## Option B — Vercel CLI

```bash
npm i -g vercel
cd TerrainX              # repository root
vercel login
vercel link              # create/link the project; accept root ./
vercel --prod            # build on Vercel and promote to production
```

`vercel build` followed by `vercel deploy --prebuilt --prod` also works if you want to build locally first.

## Make sure judges can open it

New Vercel projects come with **Deployment Protection (Vercel Authentication, Standard Protection)** enabled. Standard Protection keeps the production domain public but asks visitors to log in to Vercel for preview and per-deployment URLs.

- Share the **production domain** (`<project>.vercel.app` or your custom domain), not a preview or `…-git-…` URL.
- Check it in a private/incognito window: it must load without any Vercel login.
- If you must share a preview, use **Settings → Deployment Protection** to create a shareable link, or set protection to *None* for the hackathon.

## Verify the deployment (2 minutes)

Open these in an incognito window:

- `/#/` landing: globe and counts load.
- `/#/explorer?mission=jezero`: map and shortlist (Esri/NASA tiles need internet; science panels work if tiles fail).
- `/#/cells?mission=mare-crisium`: shows the first lunar-eligible cell. This also proves the browser verified `cell_search.json` against the release manifest; a checksum failure would show an error instead.
- `/#/lunar-pole`: "LOLA LDEM_16 verified" badge and eight polar sites.
- `/#/demo?presentation=1`: eleven scenes (the tenth is the Research Lab), ← → keys.
- `/#/offline`: **Prepare offline demo** completes (service worker served with `no-cache`).

From a terminal, the production preview workflows can run against the live URL:

```bash
cd frontend
TERRAINX_BASE_URL=https://<project>.vercel.app npx playwright test
```

## Custom domain (optional)

**Settings → Domains → Add**, enter the domain, and create the DNS record Vercel shows (A record for an apex domain, CNAME for a subdomain). HTTPS is issued automatically.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Found invalid Node.js Version` | Set root `package.json` engines to a supported major, e.g. `"24.x"`, and redeploy. |
| `Immutable science asset changed` during build | A file in `frontend/public/data/` differs from a frozen release. Never edit frozen release folders; rebuild locally, commit the new `releases/<id>/` folder. |
| Stale page after redeploy | Prepared offline builds stay pinned intentionally. Reconnect, open `/#/offline`, prepare the update and explicitly activate/reload. Clear prepared files is a fallback and does not erase saved studies. |
| Map tiles blank | External tile hosts blocked by the network; science views still work. |
| Visitors asked to log in | They opened a preview/deployment URL. Share the production domain or adjust Deployment Protection. |

The existing public ChatGPT Site is also updated as requested; Vercel remains an optional additional host. See DEPLOYMENT.md for exact live version and rollback.
