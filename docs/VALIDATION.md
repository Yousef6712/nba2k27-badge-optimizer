# Validation record

Validated on 2026-09-09.

- Clean `npm install` succeeded in a separate directory; `npm run build` succeeded using that installation.
- Vitest: 23 passing tests, including independent exhaustive-enumeration comparisons.
- ESLint: passed; strict TypeScript: passed.
- Next.js production export: passed. Optimizer worker is explicitly bundled by esbuild for both development and production.
- Playwright: eight passing journeys against the actual static export, across desktop and mobile Chromium. Covers optimization, resource validation, locks/exclusions, save/load/rename/duplicate/delete, JSON import/export, database search, custom weighting/reset and mobile overflow.
- Desktop and mobile layouts were visually inspected.
- Optional WebMCP is feature-detected. No live host supporting the WebMCP registry was available for native contract validation; this integration is not claimed verified.

The canonical application is a static client-side Next.js export. Verification does not validate fictional NBA 2K27 game data. GitHub publication requires an authenticated GitHub CLI account.
