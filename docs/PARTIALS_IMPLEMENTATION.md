# Research Lab methods

TerrainX provides eight evidence-to-experiment tools at `/#/research-lab`. Each distinguishes source observations, calculations, user scenarios and unavailable evidence. Reports retain the candidate and selected scientific release. A matching method template opens in the Field Study Builder and survives save/share/export/print.

| Tool | Available analysis | Evidence still required |
|---|---|---|
| Mineralogy | Source-scoped material references, composition/closure checks and sampling protocol | Local mineral phases and representative sample chemistry |
| Thermal and illumination | 2025 POWER daily temperature envelopes and solar geometry | Like-for-like local logger/irradiance observations and longer extreme records |
| Water and resources | Published reference context and recovery scenarios | Depth-resolved water content, ground temperature and resource abundance |
| Dust | Shao–Lu threshold and log-law wind scenarios | Grain distributions, cohesion, wind profiles and measured transport |
| Biology | User assay analysis with blanks and positive controls | Field/laboratory assays, contamination controls and interpretation |
| Caves | Documented inventory references and relative station proposals | Verified local cave geometry, access and safety survey |
| Operations | Least-cost paths on measured Copernicus-derived grids and GeoJSON export | Sub-grid obstacles, traction, access and certified route safety |
| Lunar base | Feature-centre illumination, thermal trade-offs and autonomy scenarios | Full landing polygons, engineering validation and measured resources |

## Scientific products

Lunar illumination uses five verified JPL kernels, MOON_ME surface-observer geometry, eight feature-centre profiles and 8,760 hourly samples for 2025. Terrain shading uses bounded 72-ray LOLA horizons. Four cached JPL Horizons comparisons support the geometry checks. This is a feature-centre model, not permanent-illumination or landing certification.

Operations data contain 18 real 97×97 Copernicus-derived lattices at 250 m spacing, with water/void masks and source hashes. A route is constrained by that grid's support. It cannot resolve individual hazards or establish rover safety.

Nine source-scoped reference records and 18 cached 2025 POWER daily profiles support the tools. Published measurements apply only to their documented locations and observables. They do not fill unrelated candidate evidence gaps or change original F/U/C/P rankings.

## Reproduction and contracts

`scripts/build_lunar_illumination.py` and `scripts/build_operations_terrain.py` generate the additional products. `spiceypy` 8.4.0 is pinned. Kernel/raster binaries are excluded from Git; metadata, checksums, cached Horizons responses and derived arrays are retained.

Typed frontend schemas validate new products. Numerical tests cover the calculations and source contracts. Protocol tests cover collection, model and module persistence, historical releases, conflicting links and mission restrictions. See [QA.md](QA.md) for current acceptance.
