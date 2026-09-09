# Badge data entry and verification

Edit `data/badges.ts` to replace the demo array. Keep game records separate from the optimizer. Pass every record through `badgeSchema.parse`; schema violations should stop development/build rather than silently weakening constraints. IDs must be unique and stable across future versions so saved locks and weights remain meaningful.

## Record example (fictional)

```ts
badgeSchema.parse({
  id: "example-badge",
  name: "Example Badge",
  category: "shooting",
  description: "Illustrative example only.",
  allowedPositions: ["PG", "SG"],
  minimumHeight: 65, // inches, inclusive
  maximumHeight: 80,
  importance: 1,
  tiers: [
    {
      tierName: "Bronze",
      requirements: [{ attribute: "threePoint", minimum: 60 }],
      requirementMode: "all",
      tokenCost: 1,
      baseValue: 2,
    },
  ],
  source: {
    status: "demo",
    notes: "Invented to test the app; not game data.",
  },
});
```

## Fields and invariants

- `id`: lowercase letters, numbers and hyphens, starting with a letter; never reuse a retired ID for a different badge.
- `category`: a key from `categories` in `data/rules.ts`. Edit configuration and types together to introduce categories.
- `allowedPositions`: nonempty subset of PG, SG, SF, PF, C.
- `minimumHeight` / `maximumHeight`: inclusive inches. A build outside this interval cannot equip any natural tier, even with Fuze.
- `importance`: effectiveness multiplier from 0 to 10, separate from user overrides.
- `tiers`: contiguous entries in configured tier order, beginning at Bronze. Initial order is Bronze, Silver, Gold, Hall of Fame, Legend. A badge may stop before Legend.
- `requirements`: use exact attribute keys in `data/rules.ts`. `minimum` and optional `maximum` are inclusive. `all` means AND, `any` means OR. An empty requirement array has no attribute constraint.
- `tokenCost`: absolute cost to equip that natural tier, not incremental upgrade cost. Integer 0–200.
- `baseValue`: nonnegative subjective effectiveness, up to 1000; comparisons depend on consistent scoring conventions.
- Source statuses: `verified`, `community reported`, `unverified`, `demo`. A verified record requires both an absolute source URL and ISO date (`YYYY-MM-DD`) in `lastVerified`. Missing evidence must never be labeled verified. `notes` should describe how information was collected and any caveats.

The database viewer renders source status, restrictions, requirements, costs and verification date directly from these records. Retain prominent demo labeling until the complete active dataset and its rules have actually been verified. For mixed datasets, replace the global demo banner with an accurate mixed-source warning; do not simply hide provenance.

## Replacing the dataset

1. Obtain reliable source material for each badge and tier.
2. Enter records with stable IDs and the appropriate provenance status; retain source dates and notes.
3. Verify attribute names, physical ranges, tier names, category policy, and Fuze mechanics in `data/rules.ts`.
4. Update fixtures and add regression tests based on documented real examples.
5. Review migration implications for stored IDs and versioned build files.
6. Run unit tests, ESLint, type checking, browser tests for changed flows, and production build.

UI game logic must remain out of React components. New requirement types belong in the schema and dedicated eligibility module, with tests. Resources added later can use `resources.upgrades[id]` and a new upgrade rule without changing the allocation state machinery.
