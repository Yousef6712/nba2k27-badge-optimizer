import { describe, it, expect } from "vitest";
import { demoBuild, badgeSchema, type Badge } from "@/lib/model";
import {
  getEligibleBadgeTiers,
  explainTierEligibility,
} from "@/lib/eligibility";
import { optimize, candidates, recommend } from "@/lib/optimizer";
import { rules } from "@/data/rules";
function badge(id = "test", costs = [1, 2, 4], values = [2, 4, 7]): Badge {
  return badgeSchema.parse({
    id,
    name: id,
    category: "shooting",
    description: "test",
    allowedPositions: ["PG"],
    minimumHeight: 70,
    maximumHeight: 80,
    importance: 1,
    tiers: costs.map((tokenCost, i) => ({
      tierName: ["Bronze", "Silver", "Gold"][i],
      requirements: [{ attribute: "threePoint", minimum: [60, 70, 80][i] }],
      tokenCost,
      baseValue: values[i],
    })),
    source: { status: "demo", notes: "test" },
  });
}
function build() {
  const b = demoBuild();
  b.resources = {
    slots: 2,
    tokens: 4,
    bonusSlots: 0,
    bonusTokens: 0,
    upgrades: { fuze1: 0, fuze2: 0 },
    categoryCaps: {},
  };
  return b;
}
describe("eligibility", () => {
  it("checks attribute thresholds and returns all natural tiers", () => {
    const b = build();
    b.attributes.threePoint = 70;
    expect(getEligibleBadgeTiers(b, badge())).toEqual([0, 1]);
    b.attributes.threePoint = 59;
    expect(getEligibleBadgeTiers(b, badge())).toEqual([]);
  });
  it("honors position and height including boundaries", () => {
    const b = build();
    b.position = "C";
    expect(getEligibleBadgeTiers(b, badge())).toEqual([]);
    b.position = "PG";
    b.height = 69;
    expect(getEligibleBadgeTiers(b, badge())).toEqual([]);
    b.height = 70;
    expect(getEligibleBadgeTiers(b, badge())).toHaveLength(3);
    b.height = 81;
    expect(explainTierEligibility(b, badge(), 0)[0]).toContain("Height");
  });
  it("supports any and all requirements plus maximums", () => {
    const b = build();
    const d = badge();
    d.tiers[0].requirements.push({ attribute: "block", minimum: 99 });
    expect(getEligibleBadgeTiers(b, d)).not.toContain(0);
    d.tiers[0].requirementMode = "any";
    expect(getEligibleBadgeTiers(b, d)).toContain(0);
    d.tiers[0].requirements = [
      { attribute: "threePoint", minimum: 60, maximum: 80 },
    ];
    expect(getEligibleBadgeTiers(b, d)).not.toContain(0);
  });
});
describe("optimizer constraints", () => {
  it("chooses multiple efficient badges over one costly tier", () => {
    const r = optimize(build(), [
      badge("a", [1, 2, 4], [1, 5, 8]),
      badge("b", [1, 2, 4], [1, 5, 8]),
    ]);
    expect(r.score).toBe(10);
    expect(r.picks.map((p) => p.naturalTier)).toEqual([1, 1]);
  });
  it("never exceeds slots or tokens", () => {
    const b = build();
    b.resources.slots = 1;
    b.resources.tokens = 3;
    const r = optimize(b, [badge("a"), badge("b")]);
    expect(r.picks).toHaveLength(1);
    expect(r.usage.tokens).toBeLessThanOrEqual(3);
  });
  it("honors minimum locks and excludes", () => {
    const b = build();
    b.choices = { a: { exclude: false, minimumTier: 2 }, b: { exclude: true } };
    const r = optimize(b, [badge("a"), badge("b")]);
    expect(r.picks).toHaveLength(1);
    expect(r.picks[0].finalTier).toBe(2);
  });
  it("reports conflicting or infeasible locks", () => {
    const b = build();
    b.choices = { a: { exclude: true, minimumTier: 0 } };
    expect(() => optimize(b, [badge("a")])).toThrow("both");
    b.choices = {
      a: { exclude: false, minimumTier: 2 },
      b: { exclude: false, minimumTier: 2 },
    };
    expect(() => optimize(b, [badge("a"), badge("b")])).toThrow("feasible");
    b.choices = { missing: { exclude: false, minimumTier: 0 } };
    expect(() => optimize(b, [badge()])).toThrow("missing");
  });
  it("spends Fuze +1 on the highest marginal value", () => {
    const b = build();
    b.resources.tokens = 2;
    b.resources.upgrades.fuze1 = 1;
    const r = optimize(b, [
      badge("a", [1, 2], [2, 10]),
      badge("b", [1, 2], [2, 4]),
    ]);
    expect(r.picks.find((p) => p.badgeId === "a")?.upgrade).toBe("fuze1");
    expect(r.score).toBe(12);
  });
  it("Fuze +2 raises exactly two tiers and does not stack", () => {
    const b = build();
    b.resources.tokens = 1;
    b.resources.upgrades = { fuze1: 1, fuze2: 1 };
    const r = optimize(b, [badge()]);
    expect(r.picks[0]).toMatchObject({
      naturalTier: 0,
      finalTier: 2,
      upgrade: "fuze2",
      tokens: 1,
    });
    expect(r.usage.upgrades.fuze1).toBe(0);
  });
  it("configurable final eligibility and tier caps restrict Fuze", () => {
    const b = build();
    b.attributes.threePoint = 60;
    b.resources.upgrades.fuze2 = 1;
    expect(
      optimize(
        b,
        [badge()],
        rules.upgrades.map((u) => ({ ...u, requiresFinalEligibility: true })),
      ).picks[0].finalTier,
    ).toBe(0);
    expect(
      optimize(
        b,
        [badge()],
        rules.upgrades.map((u) => ({ ...u, maxTier: 1 })),
      ).picks[0].finalTier,
    ).toBe(0);
    expect(
      optimize(
        b,
        [badge()],
        rules.upgrades.map((u) => ({ ...u, categories: [] })),
      ).picks[0].upgrade,
    ).toBeNull();
  });
  it("uses bonus slots and tokens after regular resources", () => {
    const b = build();
    b.resources.slots = 1;
    b.resources.tokens = 1;
    b.resources.bonusSlots = 1;
    b.resources.bonusTokens = 1;
    const r = optimize(b, [
      badge("a", [1, 2, 4], [3, 4, 7]),
      badge("b", [1, 2, 4], [3, 4, 7]),
    ]);
    expect(r.picks).toHaveLength(2);
    expect(r.usage).toMatchObject({
      slots: 1,
      tokens: 1,
      bonusSlots: 1,
      bonusTokens: 1,
    });
  });
  it("enforces category caps", () => {
    const b = build();
    b.resources.categoryCaps.shooting = { slots: 1, tokens: 1 };
    const r = optimize(b, [badge("a"), badge("b")]);
    expect(r.picks).toHaveLength(1);
    expect(r.usage.tokens).toBe(1);
  });
  it("handles zero resources and unreachable locks", () => {
    const b = build();
    b.resources.slots = 0;
    expect(optimize(b, [badge()]).score).toBe(0);
    b.choices = { test: { exclude: false, minimumTier: 4 } };
    expect(() => optimize(b, [badge()])).toThrow("not reachable");
  });
  it("applies custom and preset weights", () => {
    const b = build();
    const base = optimize(b, [badge()]).score;
    b.preset = "Shooting";
    expect(optimize(b, [badge()]).score).toBe(base * 2);
    b.preset = "Custom";
    b.categoryWeights.shooting = 3;
    b.badgeWeights.test = 2;
    expect(optimize(b, [badge()]).score).toBe(base * 6);
  });
  it("returns unique alternatives", () => {
    const r = recommend(demoBuild());
    expect(r.length).toBeGreaterThan(1);
    expect(
      new Set(
        r.map((x) =>
          JSON.stringify(x.solution.picks.map((p) => [p.badgeId, p.finalTier])),
        ),
      ).size,
    ).toBe(r.length);
  });
  it("matches independent exhaustive enumeration for varied small budgets", () => {
    for (let tokens = 0; tokens <= 8; tokens++) {
      for (let fuze = 0; fuze <= 1; fuze++) {
        const b = build();
        b.resources.tokens = tokens;
        b.resources.upgrades.fuze1 = fuze;
        const data = [
          badge("a", [1, 3, 5], [2, 6, 8]),
          badge("b", [2, 3, 4], [3, 5, 10]),
          badge("c", [1, 2, 6], [2, 4, 11]),
        ];
        let best = 0;
        const walk = (
          i: number,
          score: number,
          t: number,
          slots: number,
          f: number,
        ) => {
          if (t > tokens || slots > 2 || f > fuze) return;
          if (i === data.length) {
            best = Math.max(best, score);
            return;
          }
          walk(i + 1, score, t, slots, f);
          for (let natural = 0; natural < 3; natural++) {
            for (let upgrade = 0; upgrade <= 1; upgrade++) {
              const final = natural + upgrade;
              if (final < 3)
                walk(
                  i + 1,
                  score + data[i].tiers[final].baseValue,
                  t + data[i].tiers[natural].tokenCost,
                  slots + 1,
                  f + upgrade,
                );
            }
          }
        };
        walk(0, 0, 0, 0, 0);
        const result = optimize(b, data);
        expect(result.exact).toBe(true);
        expect(result.score).toBe(best);
      }
    }
  });
  it("reports approximation and preserves constraints after truncation", () => {
    const b = demoBuild();
    b.maxStates = 100;
    b.resources.tokens = 30;
    const r = optimize(
      b,
      Array.from({ length: 16 }, (_, i) => badge(`b-${i}`)),
    );
    expect(r.exact).toBe(false);
    expect(r.picks.length).toBeLessThanOrEqual(6);
    expect(r.usage.tokens + r.usage.bonusTokens).toBeLessThanOrEqual(33);
  });
  it("candidate enumeration respects locked final tiers", () => {
    const b = build();
    b.resources.upgrades.fuze2 = 1;
    b.choices.test = { exclude: false, minimumTier: 2 };
    expect(candidates(b, badge()).every((p) => p.finalTier >= 2)).toBe(true);
  });
});
