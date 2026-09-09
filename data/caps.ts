import sample from "./verified-attribute-caps.json";
import type { Build } from "@/lib/model";
const sampleCaps: Record<string, number> = Object.fromEntries(
  (sample as unknown as { data: Array<{ name: string; cap: number }> }).data.map((x) => [
    x.name,
    x.cap,
  ]),
);
const keys = [
  "close_shot",
  "driving_layup",
  "driving_dunk",
  "standing_dunk",
  "post_control",
  "mid_range",
  "three_point",
  "free_throw",
  "pass_accuracy",
  "ball_handle",
  "speed_with_ball",
  "interior_defense",
  "perimeter_defense",
  "steal",
  "block",
  "offensive_rebound",
  "defensive_rebound",
  "speed",
  "agility",
  "strength",
  "vertical",
];
const map: Record<string, string> = {
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
export function getAttributeCaps(
  build: Pick<Build, "height" | "weight" | "wingspan">,
): Record<string, number> {
  const heightDelta = build.height - 75;
  const weightDelta = build.weight - 198;
  const spanDelta = build.wingspan - 78;
  return Object.fromEntries(
    keys.map((key) => {
      if (key === "strength") {
        // Calibrated to the reference PG body in the supplied 2K27 builder shot:
        // 6'4", 175 lb, 6'4" wingspan reaches 60 Strength.
        const strengthCap =
          60 - (build.height - 76) * 1.1 + (build.weight - 175) * 0.35 +
          (build.wingspan - 76) * 0.5;
        return [map[key], Math.max(25, Math.min(99, Math.round(strengthCap)))];
      }
      let cap = sampleCaps[key] ?? 99;
      const h =
        key === "strength"
          ? -1.15
          : key.includes("rebound") || key === "block"
            ? 0.8
            : -0.25;
      const w =
        key === "strength"
          ? 0.045
          : key === "speed" || key === "agility"
            ? -0.03
            : 0.01;
      const s =
        key === "strength"
          ? 0.75
          : key.includes("rebound") || key === "block"
            ? 0.55
            : 0.18;
      cap = Math.round(cap + h * heightDelta + w * weightDelta + s * spanDelta);
      return [map[key], Math.max(25, Math.min(99, cap))];
    }),
  );
}
