import { badges as dataset } from "@/data/badges";
import { categories, presets, rules } from "@/data/rules";
import { buildSchema, type Badge, type Build, type Category } from "./model";
import { getEligibleBadgeTiers, explainTierEligibility } from "./eligibility";
export type UpgradeRule = {
  id: string;
  label: string;
  steps: number;
  maxTier: number;
  requiresFinalEligibility: boolean;
  categories: readonly Category[];
};
export type Pick = {
  badgeId: string;
  naturalTier: number;
  finalTier: number;
  upgrade: string | null;
  tokens: number;
  value: number;
  reason: string;
};
type State = {
  picks: Pick[];
  tokens: number;
  upgrades: number[];
  categoryUsage: number[];
  score: number;
};
export type Solution = {
  picks: Pick[];
  score: number;
  usage: {
    slots: number;
    tokens: number;
    bonusSlots: number;
    bonusTokens: number;
    upgrades: Record<string, number>;
  };
  exact: boolean;
  states: number;
  runtime: number;
  explanations: string[];
};
export type Recommendation = { label: string; solution: Solution };
export function badgeValue(build: Build, badge: Badge, tier: number): number {
  const categoryWeight =
    build.preset === "Custom"
      ? (build.categoryWeights[badge.category] ?? 1)
      : (presets[build.preset][badge.category] ?? 1);
  return (
    badge.tiers[tier].baseValue *
    badge.importance *
    categoryWeight *
    (build.badgeWeights[badge.id] ?? 1)
  );
}
export function candidates(
  build: Build,
  badge: Badge,
  upgradeRules: readonly UpgradeRule[] = rules.upgrades,
): Pick[] {
  const choice = build.choices[badge.id];
  if (choice?.exclude) return [];
  const eligible = getEligibleBadgeTiers(build, badge);
  const out: Pick[] = [];
  for (const naturalTier of eligible) {
    const add = (finalTier: number, upgrade: string | null) => {
      if (finalTier < (choice?.minimumTier ?? 0)) return;
      const value = badgeValue(build, badge, finalTier);
      out.push({
        badgeId: badge.id,
        naturalTier,
        finalTier,
        upgrade,
        tokens: badge.tiers[naturalTier].tokenCost,
        value,
        reason: `${badge.tiers[finalTier].tierName} contributes ${value.toFixed(1)} weighted utility for ${badge.tiers[naturalTier].tokenCost} tokens${upgrade ? " with " + upgradeRules.find((r) => r.id === upgrade)?.label : ""}${choice?.minimumTier !== undefined ? "; honors your minimum tier" : ""}.`,
      });
    };
    add(naturalTier, null);
    for (const upgrade of upgradeRules) {
      const target = naturalTier + upgrade.steps;
      if (
        (build.resources.upgrades[upgrade.id] ?? 0) > 0 &&
        upgrade.categories.includes(badge.category) &&
        target <= upgrade.maxTier &&
        target < badge.tiers.length &&
        (!upgrade.requiresFinalEligibility || eligible.includes(target))
      )
        add(target, upgrade.id);
    }
  }
  return out;
}
// Multiple-choice resource DP: one option per badge, merging equal resource states.
// Once the state cap is hit, use a deterministic beam; report approximation explicitly.
export function optimize(
  input: Build,
  data: Badge[] = dataset,
  upgradeRules: readonly UpgradeRule[] = rules.upgrades,
): Solution {
  const started = performance.now();
  const build = buildSchema.parse(input);
  const r = build.resources;
  for (const [id, choice] of Object.entries(build.choices)) {
    if (choice.minimumTier !== undefined) {
      if (choice.exclude)
        throw new Error(`${id} cannot be both locked and excluded.`);
      if (!data.some((b) => b.id === id))
        throw new Error(`Locked badge ${id} is missing from the dataset.`);
    }
  }
  const limited = categories.filter((c) => r.categoryCaps[c]);
  let states: State[] = [
    {
      picks: [],
      tokens: 0,
      upgrades: upgradeRules.map(() => 0),
      categoryUsage: limited.flatMap(() => [0, 0]),
      score: 0,
    },
  ];
  let exact = true;
  let visited = 0;
  // Mandatory badges first ensures optional choices cannot crowd locks out of the beam.
  const ordered = [...data].sort(
    (a, b) =>
      Number(build.choices[b.id]?.minimumTier !== undefined) -
      Number(build.choices[a.id]?.minimumTier !== undefined),
  );
  for (const badge of ordered) {
    const required = build.choices[badge.id]?.minimumTier !== undefined;
    const options = candidates(build, badge, upgradeRules);
    if (required && !options.length)
      throw new Error(
        `${badge.name}: the locked tier is not reachable with this build and Fuze rules.`,
      );
    const next = new Map<string, State>();
    for (const state of states) {
      for (const pick of [...(required ? [] : [null]), ...options]) {
        visited++;
        const tokens = state.tokens + (pick?.tokens ?? 0);
        const slots = state.picks.length + (pick ? 1 : 0);
        if (tokens > r.tokens + r.bonusTokens || slots > r.slots + r.bonusSlots)
          continue;
        const upgrades = [...state.upgrades];
        if (pick?.upgrade) {
          const i = upgradeRules.findIndex((u) => u.id === pick.upgrade);
          upgrades[i]++;
          if (upgrades[i] > (r.upgrades[pick.upgrade] ?? 0)) continue;
        }
        const categoryUsage = [...state.categoryUsage];
        const ci = limited.indexOf(badge.category);
        if (pick && ci >= 0) {
          categoryUsage[ci * 2]++;
          categoryUsage[ci * 2 + 1] += pick.tokens;
          const cap = r.categoryCaps[badge.category];
          if (
            categoryUsage[ci * 2] > cap.slots ||
            categoryUsage[ci * 2 + 1] > cap.tokens
          )
            continue;
        }
        const score = state.score + (pick?.value ?? 0);
        const key = [slots, tokens, ...upgrades, ...categoryUsage].join(",");
        const previous = next.get(key);
        if (!previous || score > previous.score)
          next.set(key, {
            picks: pick ? [...state.picks, pick] : state.picks,
            tokens,
            upgrades,
            categoryUsage,
            score,
          });
      }
    }
    states = [...next.values()];
    if (states.length > build.maxStates) {
      exact = false;
      states.sort((a, b) => b.score - a.score || a.tokens - b.tokens);
      states = states.slice(0, build.maxStates);
    }
    if (!states.length)
      throw new Error(
        `No feasible allocation: increase resources or relax locked badges${exact ? "" : ". The search limit was reached; also try increasing the state limit"}.`,
      );
  }
  states.sort(
    (a, b) =>
      b.score - a.score ||
      a.tokens - b.tokens ||
      a.picks.length - b.picks.length,
  );
  const best = states[0];
  const usage = {
    slots: Math.min(best.picks.length, r.slots),
    tokens: Math.min(best.tokens, r.tokens),
    bonusSlots: Math.max(0, best.picks.length - r.slots),
    bonusTokens: Math.max(0, best.tokens - r.tokens),
    upgrades: Object.fromEntries(
      upgradeRules.map((u, i) => [u.id, best.upgrades[i]]),
    ),
  };
  const explanations = [
    `${exact ? "Exact" : "Bounded-search"} allocation maximizes configured weighted utility across eligible badge options${exact ? "." : "; optimality is not guaranteed because the state limit was reached."}`,
    `Used ${best.tokens} of ${r.tokens + r.bonusTokens} tokens across ${best.picks.length} of ${r.slots + r.bonusSlots} slots. Bonus resources are consumed after regular resources.`,
  ];
  for (const pick of best.picks) {
    const badge = data.find((b) => b.id === pick.badgeId)!;
    if (pick.upgrade)
      explanations.push(
        `${upgradeRules.find((u) => u.id === pick.upgrade)?.label} on ${badge.name} adds ${(pick.value - badgeValue(build, badge, pick.naturalTier)).toFixed(1)} utility without additional tokens under demo rules.`,
      );
  }
  for (const badge of data.filter(
    (b) => !best.picks.some((p) => p.badgeId === b.id),
  )) {
    explanations.push(
      `${badge.name}: ${build.choices[badge.id]?.exclude ? "excluded by you" : !getEligibleBadgeTiers(build, badge).length ? "no naturally eligible tier" : "not included in the selected combination at current costs and weights"}.`,
    );
  }
  return {
    picks: best.picks,
    score: best.score,
    usage,
    exact,
    states: visited,
    runtime: performance.now() - started,
    explanations,
  };
}
export function recommend(build: Build): Recommendation[] {
  const primary = optimize(build);
  const out: Recommendation[] = [{ label: "Best Overall", solution: primary }];
  const signature = (s: Solution) =>
    s.picks
      .map((p) => `${p.badgeId}:${p.finalTier}`)
      .sort()
      .join("|");
  for (const preset of [
    "Shooting",
    "Defense",
    "Balanced",
    "Finishing",
    "Playmaking",
  ]) {
    if (out.length === 3) break;
    const solution = optimize({ ...build, preset });
    const changed =
      solution.picks.filter(
        (p) =>
          !primary.picks.some(
            (q) => q.badgeId === p.badgeId && q.finalTier === p.finalTier,
          ),
      ).length +
      primary.picks.filter(
        (p) => !solution.picks.some((q) => q.badgeId === p.badgeId),
      ).length;
    if (
      changed >= 2 &&
      !out.some((r) => signature(r.solution) === signature(solution))
    )
      out.push({ label: `${preset} emphasis`, solution });
  }
  return out;
}
export function diagnostics(build: Build) {
  return dataset.map((b) => ({
    badge: b.name,
    eligible: getEligibleBadgeTiers(build, b),
    candidates: candidates(build, b),
    rejected: b.tiers.flatMap((t, i) => {
      const reasons = explainTierEligibility(build, b, i);
      return reasons.length ? [{ tier: t.tierName, reasons }] : [];
    }),
  }));
}
