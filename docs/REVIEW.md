# Submission review — 15 November 2026

Reviewed the Research Lab, presentation and navigation changes through `c59f286`, followed by corrective commit `fbbc1a7`. The presentation, live MapLibre providers and original scientific data are retained.

## Corrections

- Rapid mission/filter navigation could overwrite the selected mission. Selection now follows the active URL context consistently.
- Research protocols now distinguish air temperature from ground temperature, model wetness from water content, relative cave stations from a cave survey, and modeled routes from certified rover safety.
- Saved/shared Research Lab studies retain protocol identity and planning inputs. Unavailable products, conflicting protocol links and Mars-labeled lunar-base studies are rejected explicitly.
- Lunar-base scenarios preserve bounded illumination, thermal and autonomy assumptions without asserting measured resources or approved landing suitability.

## Submission presentation

Project documentation describes current behavior, source products, reproduction and limitations. Obsolete development plans and generation briefs have been replaced. The lunar source panel reports source-integrity verification directly. Scientific provenance and required tool acknowledgements remain available.

## Validation

94 Python tests plus independent result reproduction and 117 frontend unit tests pass. Strict TypeScript and static production build pass. Browser acceptance and live provider results are recorded in [QA.md](QA.md). Publication is recorded in [../DEPLOYMENT.md](../DEPLOYMENT.md).
