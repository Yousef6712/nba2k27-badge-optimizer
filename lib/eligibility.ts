import type { Badge, Build } from "./model";
export function explainTierEligibility(
  build: Build,
  badge: Badge,
  tierIndex: number,
): string[] {
  const failures: string[] = [];
  if (!badge.allowedPositions.includes(build.position))
    failures.push(`Position must be ${badge.allowedPositions.join(" / ")}`);
  if (build.height < badge.minimumHeight || build.height > badge.maximumHeight)
    failures.push(
      `Height must be ${badge.minimumHeight}–${badge.maximumHeight} inches`,
    );
  const tier = badge.tiers[tierIndex];
  if (!tier) return ["Tier does not exist"];
  const checks = tier.requirements.map((r) => ({
    ok:
      build.attributes[r.attribute] >= r.minimum &&
      (r.maximum === undefined || build.attributes[r.attribute] <= r.maximum),
    text: `${r.attribute}: ${r.minimum}${r.maximum === undefined ? "+" : `–${r.maximum}`}`,
  }));
  if (tier.requirementMode === "any") {
    if (checks.length && !checks.some((c) => c.ok))
      failures.push(`Requires one of: ${checks.map((c) => c.text).join(", ")}`);
  } else failures.push(...checks.filter((c) => !c.ok).map((c) => c.text));
  return failures;
}
export function getEligibleBadgeTiers(build: Build, badge: Badge): number[] {
  return badge.tiers.flatMap((_, i) =>
    explainTierEligibility(build, badge, i).length ? [] : [i],
  );
}
