# Research workflow and interface behavior

## Discovery state

Atlas filters, mission, selection and comparison context are represented in navigation state and survive dossiers, reload and browser history. Rapid mission/filter changes preserve the active mission. Duplicate comparison IDs are removed; unavailable or filtered selections are explicit.

Desktop uses a mission rail, map and ranked results with a selected-site summary. Mobile provides Map / Results / Selected site navigation within a natural page height. Short-laptop layouts retain visible inspector actions. Tables scroll within their own containers.

## Evidence-to-experiment navigation

Discovery leads to Analog DNA, source evidence and field planning. Collection and planetary-reference controls travel with the research context. Original study and Expanded search have separate candidate pools. Polar links preserve the actual selected feature, with correct S/W coordinate notation in comparison and print.

## Saved and shared studies

Full shared plans restore and pin their declared scientific release, model, collection, mission, polar reference and protocol. A protocol cannot be silently replaced by conflicting query parameters. Source-scoped proposals retain their reviewed candidate and mission. An explicit new-study action starts a separate proposal.

Research Lab templates retain `lab_module` in saved studies and full/compact links. Reports and field books identify the protocol. Unsupported modules, missing release products and Mars-labeled lunar-base proposals produce explicit error states.

## Accessibility and presentation

Native controls have labels and visible focus states. Keyboard shortcuts support atlas selection, the command palette and pitch navigation. Reduced motion is respected. Source dialogs and mobile menus manage focus; data tables complement charts. Printing expands Limits disclosures. Formal accessibility certification has not been performed.

Presentation settings are isolated from research settings. Exiting the guided demo restores the research model. Offline preparation verifies all first-party assets before switching the prepared version; failed updates retain the previous complete cache.

Acceptance evidence and browser limits: [QA.md](QA.md).
