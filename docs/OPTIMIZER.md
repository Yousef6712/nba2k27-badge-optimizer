# Optimization algorithm

## Objective and eligibility

Maximize the sum of final-tier utilities. Utility is tier base value multiplied by badge effectiveness, category playstyle weight and user badge weight. Weights are nonnegative, so zero can remove a badge's objective benefit without excluding it. Locks still apply at zero weight.

The eligibility engine returns every naturally qualifying tier using position, inclusive height range, and AND/OR attribute requirements with optional upper bounds. A chosen natural tier can be lower than the highest eligible tier to conserve tokens.

## Candidate generation

Each badge has options: unequipped, each naturally eligible tier, and each legal natural-tier/upgrade combination. Excluded badges have only the unequipped option. Locked badges omit unequipped and any candidate below their required final tier. A lock without a selected tier is represented as a Bronze minimum. Conflicting exclusion/lock combinations and unknown locked IDs raise actionable errors.

Fuze rules declare `id`, `label`, `steps`, `maxTier`, `requiresFinalEligibility` and allowed `categories`. Resource counts are keyed by upgrade ID. Each candidate uses at most one upgrade. The demo does not allow stacking, overshooting the tier cap, or upgrading from an unequipped badge. Upgrading does not change the natural tier's token cost. This is a documented demo policy, not a verified game rule.

## Multiple-choice dynamic programming

Process badges in a stable order with mandatory badges first. Each transition selects exactly one option for the next badge. State dimensions are:

```
equipped count, token total, usage of each upgrade,
slot/token usage for every category that has a cap
```

Reject transitions exceeding any resource capacity. For states with identical resource usage, retain only the highest score and its selected candidates. Future choices depend only on those resource dimensions, so this merge preserves optimality. Ties retain deterministic order; final ties prefer fewer tokens and fewer badges.

Regular and bonus slots/tokens are fungible under demo rules. Their capacities are added for feasibility, and result accounting consumes regular pools first, then bonus pools. Category caps constrain totals inside these shared capacities. They are not separate bonus pools.

## Search limits and performance

With B badges, C candidate options per badge, and S retained states, transition work is approximately O(B × C × S), plus sorting at truncation. Resource dimensions can make exact state counts large. Default maximum states is 12,000, adjustable from 100 to 50,000. When a layer exceeds this bound, retain the highest-scoring states and mark the result approximate. A layer's temporary map may exceed the retained limit during expansion; this setting is not a strict memory byte limit.

Before truncation this is exact DP, after truncation it is beam search. Beam results are feasible but are not guaranteed globally optimal. A beam may miss feasibility when future locked badges have unusual costs; the error tells users to increase the limit. Mandatory-first ordering reduces that risk. All hard constraints are still checked on every transition. The Web Worker isolates calculation from browser interaction; changing the build terminates pending work and clears stale results.

Unit tests compare exact-mode answers to an independently written exhaustive enumerator on multiple small resource budgets. Separate tests exercise truncation and verify hard limits.

## Alternatives and explanations

Compute the requested objective first. Try Shooting, Defense, Balanced, Finishing and Playmaking objectives and return at most two additional distinct recommendations. An alternative needs at least two changed badge/tier assignments relative to the primary result. Locks, exclusions, resources and badge weights remain identical. Fewer alternatives are explicitly reported when meaningful differences cannot be found.

Alternative utility scores use their own category weights and must not be directly compared as though they share an objective. Explanations report the actual final tier value, natural cost, lock satisfaction and Fuze marginal utility. They do not claim that a locally largest marginal gain necessarily determines the global solution. Unselected eligible badges are described as absent from the selected combination, not proven individually inefficient.

## Diagnostics and future rule changes

Development diagnostics show natural eligibility, candidates, rejected tiers with reasons, score, visited transitions and elapsed time. Production hides this panel unless `NEXT_PUBLIC_OPTIMIZER_DEBUG=true` at build time.

For independently restricted regular/bonus category budgets, mutual-exclusion groups, stacking, or other resource mechanics, add the required state dimensions and candidate validation rather than putting ad hoc checks in UI components. Test exact results on small enumerated fixtures first. Any schema change affecting saved builds needs a versioned migration.
