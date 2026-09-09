/* eslint-disable @typescript-eslint/no-explicit-any -- normalize external numeric JSON at this boundary. */
import definitions from "./verified-definitions.json";
import requirements from "./verified-tier-requirements.json";
import costs from "./verified-token-costs.json";
import type { Badge } from "@/lib/model";

type Tier = "Bronze" | "Silver" | "Gold" | "Hall of Fame" | "Legend";
const tierMap: Record<string, Tier> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  hall_of_fame: "Hall of Fame",
  legend: "Legend",
};
const attrMap: Record<string, string> = {
  close_shot: "closeShot",
  driving_layup: "drivingLayup",
  driving_dunk: "drivingDunk",
  standing_dunk: "standingDunk",
  post_control: "postControl",
  mid_range: "midRange",
  three_point: "threePoint",
  free_throw: "freeThrow",
  pass_accuracy: "passAccuracy",
  ball_handle: "ballHandle",
  speed_with_ball: "speedWithBall",
  interior_defense: "interiorDefense",
  perimeter_defense: "perimeterDefense",
  steal: "steal",
  block: "block",
  offensive_rebound: "offensiveRebound",
  defensive_rebound: "defensiveRebound",
  speed: "speed",
  agility: "agility",
  strength: "strength",
  vertical: "vertical",
};
const defs = (definitions as any).data as Array<{
  badge: number;
  name: string;
  discipline: string;
  height_inches: [number, number];
}>;
const reqs = (requirements as any).data as Array<{
  badge: number;
  name: string;
  tier: string;
  requirements: Array<{
    name: string;
    minimum: number;
    operator_to_next: string;
  }>;
}>;
const prices = (costs as any).data as Array<{
  badge: number;
  tier: string;
  height_inches: number;
  cost: number;
}>;
export const verifiedMetadata = {
  captured: "2026-08-22",
  source: "nba2k27-builder-dataset native probe",
  apiVersion: 202750199,
  liveTuningVersion: "993560759169487438",
};
export function verifiedBadgeForHeight(height: number): Badge[] {
  return defs.map((d) => {
    const rows = reqs.filter((r) => r.badge === d.badge);
    const tiers = (
      ["bronze", "silver", "gold", "hall_of_fame", "legend"] as const
    ).map((key, i) => {
      const row = rows.find((r) => r.tier === key);
      const price = prices.find(
        (p) =>
          p.badge === d.badge && p.tier === key && p.height_inches === height,
      );
      return {
        tierName: tierMap[key],
        requirements: (row?.requirements ?? []).map((r) => ({
          attribute: (attrMap[r.name] ?? "closeShot") as any,
          minimum: r.minimum,
        })),
        requirementMode: "all" as const,
        tokenCost: price?.cost ?? 0,
        baseValue: [2, 4, 7, 10, 13][i],
      };
    });
    return {
      id: d.name,
      name: d.name
        .replaceAll("_", " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      category:
        d.discipline === "rebounding" ? "defense" : (d.discipline as any),
      description:
        "Measured NBA 2K27 builder record; review source caveats before relying on it.",
      allowedPositions: ["PG", "SG", "SF", "PF", "C"] as any,
      minimumHeight: d.height_inches[0],
      maximumHeight: d.height_inches[1],
      importance: 1,
      tiers,
      source: {
        status: "community reported" as const,
        notes: `Measured from NBA 2K HQ by the nba2k27-builder-dataset project on ${verifiedMetadata.captured}. Dataset values can change with live tuning.`,
      },
    } as Badge;
  });
}
