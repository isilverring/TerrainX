# Scientific and application contracts

| Area | Enforced behavior |
|---|---|
| Environmental values | Units, actual period, coordinates, source URL and response hash travel with numerical observations |
| Proxy interpretation | AOD550 is column aerosol extinction; GBIF counts reflect reporting/sampling effort; model wetness is not measured ice or water content |
| Thermal values | POWER daily/monthly air statistics are distinct from lunar surface thermal models and long-term extremes |
| Diviner | PDS layout/checksum verified; retained records match source bytes; area fractions use triangle surface area; undefined depth codes remain unknown |
| Research replay | Release/model/candidate identity is checked; unavailable historical assets stop replay; compact QR scope is explicit |
| Field proposals | Stations and protocols remain proposals; source-scoped studies retain candidate/mission restrictions |
| Polar references | Historical feature-centre profiles remain separate from landing polygons and mission-certified base selection |
| Offline cache | Asset hashes and lengths are checked before an atomic cache switch; canonical redirects are handled; corrupt updates preserve the last ready version |

Independent Diviner verification checked 604,800,210 bytes against the PDS MD5 and retained SHA-256; all 30,674 retained records matched the source. Details are in `data/source/diviner/verification.json`.

The source-support study now includes 18 selected Earth sites and 360 comparisons, while the original two-site feasibility pilot remains reproducible. Neither study changes original discovery scores. See [TERRAIN_PILOT.md](TERRAIN_PILOT.md).

Current research tools and limits: [PARTIALS_IMPLEMENTATION.md](PARTIALS_IMPLEMENTATION.md). Current test results: [QA.md](QA.md). Published-source and rollback records: [../DEPLOYMENT.md](../DEPLOYMENT.md).
