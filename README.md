# NBA 2K27 Badge Optimizer

A local-first MyPLAYER planning application built with Next.js, React, strict TypeScript, Tailwind CSS, shadcn/ui, and Zod. It allocates limited slots, tokens, bonus resources, and Fuze upgrades to maximize configurable badge utility.

**All ten included badges, requirements, costs, effectiveness values, build ranges, and Fuze mechanics are invented demo data. They are not official NBA 2K27 information. Do not use them as in-game guidance.** The database displays source status for every record.

## Run locally

Install Node.js 22.13 or newer with npm, then from this repository:

```sh
npm install
npm run dev
```

Open http://localhost:3000. Load Demo Build and click OPTIMIZE BADGES.

The environment used to develop this project uses pnpm; `pnpm-lock.yaml` is the canonical reproducible dependency lock. `npm install` is also supported for the requested local workflow. Prefer pnpm for dependency changes and committed lock updates.

## Commands

```sh
npm run dev          # Next.js development server
npm test            # Vitest behavior and exhaustive-oracle tests
npm run lint        # ESLint with Next.js / TypeScript rules
npm run format      # Prettier
npx tsc --noEmit     # Strict type checking
npx playwright install chromium
npm run test:e2e     # Desktop and mobile Chromium journeys
npm run build       # Production static export to out/
```

## Features

- All 21 requested attributes, physical measurements, positions, and manual badge resources.
- Seven playstyle presets, category weights, individual badge importance, minimum-tier locks, and exclusions.
- Resource-constrained multiple-choice optimization; real Fuze +1/+2 selection; optional category caps.
- Best overall recommendation and up to two materially different playstyle alternatives when found.
- Natural and final tiers, token costs, utility, unused resource accounting, and deterministic explanations.
- Searchable badge database with category, tier, position, and source-status filters.
- Local saved builds: save, rename, duplicate, delete, load, validated JSON import/export.
- Optimization in a Web Worker so the page stays responsive. Edits invalidate stale results.
- Diagnostics in development, or production when built with `NEXT_PUBLIC_OPTIMIZER_DEBUG=true`.
- Feature-detected WebMCP `optimize_current_build` action; ordinary browsers need no WebMCP support.

## Architecture

| Location                  | Responsibility                                                         |
| ------------------------- | ---------------------------------------------------------------------- |
| `app/`                    | Next.js entry, metadata, global design tokens                          |
| `components/`             | Presentation, forms, browser lifecycle, result views                   |
| `components/ui/`          | Installed shadcn/Base UI primitives                                    |
| `data/rules.ts`           | Attributes, ranges, tier order, presets, upgrade configuration         |
| `data/badges.ts`          | Small, explicitly fictional dataset                                    |
| `lib/model.ts`            | Zod schemas and inferred domain types                                  |
| `lib/eligibility.ts`      | Attribute, position, height and tier evaluation                        |
| `lib/optimizer.ts`        | Candidate generation, resource DP, scoring, alternatives, explanations |
| `lib/optimizer.worker.ts` | Off-main-thread calculation                                            |
| `lib/storage.ts`          | Validated versioned import/export and local storage                    |
| `tests/`                  | Unit and browser tests                                                 |

UI components render results; they do not implement badge eligibility or allocation algorithms. No database, account system, analytics, external AI API, or runtime secrets are required. The Sites starter was adapted to actual Next.js as requested; the output is a portable static site.

## Data, scoring, and Fuze

See [Badge data guide](docs/BADGE_DATA.md) for record format and replacement instructions, and [Optimizer guide](docs/OPTIMIZER.md) for the algorithm and resource model.

Utility is `tier.baseValue × badge.importance × categoryWeight × userBadgeWeight`. Presets supply category weights; Custom uses editable category weights. All presets honor user badge weights. Higher utility is better under those configured subjective weights, not a claim of measured in-game strength.

Fuze rules live in `data/rules.ts`. The demo lets one resource raise a naturally eligible badge by exactly one or two tiers without extra tokens, capped at Legend, with no final-tier attribute check. A second Fuze cannot stack on the same badge. These are configurable software assumptions awaiting verification.

## Saved builds and privacy

Storage key: `nba2k27.builds.v1`. Exported JSON contains `version: 1`; future versions must migrate before validation. Unsupported versions and malformed records are rejected. All 21 attributes are required. Import size is limited to 100 KB and local saves to 100 records. LocalStorage failures are shown, and corrupt saved records are not silently overwritten. Export important builds because browser data may be cleared. There is no cloud sync.

## Deployment

Run `npm run build` and serve the public `out/` directory using any static host, including Sites. Do not deploy the source tree, `.next/` server intermediates, or development server. `next start` is not used for static exports; use the static host to preview production output. `.openai/hosting.json` binds this checkout to its existing Sites project and declares `out` as public output. Preserve that project ID on future updates.

## Tests

Unit tests cover requirement AND/OR conditions, thresholds and upper bounds, height and position restrictions, tier eligibility, all resource pools, locks, exclusions, Fuze caps and eligibility policies, category restrictions, scoring, and approximation labeling. An independent exhaustive enumerator checks the optimizer's exact answers across small budgets. Storage tests cover validated round trips, corrupt records, schema versions, missing attributes, quota errors, and evidence requirements for verified data. Playwright covers primary flows at desktop and mobile sizes.

## Screenshots

Screenshots can be added here after the first verified game dataset is integrated. No proprietary NBA 2K artwork is included.

## Current limitations

- Game information is entirely demo data; verified badge information is the most important next addition.
- Above the configured state cap, deterministic beam truncation is approximate and is labeled. It may miss a feasible or better solution; raising the cap can help. Exact mode has no such heuristic truncation.
- Category caps share regular and bonus global pools. Independently restricted regular/bonus category pools and badge incompatibility groups require additional resource dimensions/rules.
- Natural token costs are absolute tier costs; Fuze upgrades are non-stacking. Update those semantics only with verified evidence and tests.
- Alternatives use different weights, so their utility scores are not directly comparable.
- Shareable build URLs are deferred: a full schema includes attributes, weights and locks and may exceed practical URL lengths. Versioned JSON is the V1 sharing format.
- WebMCP is optional and browser-dependent. Its registration and action use the same optimizer as the UI; live WebMCP validation requires a supporting host.
- Current Next.js ESLint React plugin requires ESLint 9; ESLint 10 is incompatible with that plugin's context API. Upgrade together when supported.

## Roadmap

Verified NBA 2K27 dataset and rule provenance; screenshot/OCR importing; automatic attribute extraction; community badge rankings and meta presets; login and cloud sync; side-by-side comparisons; automated data updates; mobile PWA; Tauri desktop packaging; compact versioned build URLs; mode-specific scoring for Rec, Pro-Am, Park and 1v1.

## Continuing development

Follow `AGENTS.md`: inspect the existing source, implement the requested change, format, lint, test, and build before committing. Push completed changes to the existing private GitHub origin; never force-push or replace the repository. Sites uses a separate `sites` remote, not the GitHub origin.
