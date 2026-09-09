export const categories = [
  "finishing",
  "shooting",
  "playmaking",
  "defense",
  "physicals",
] as const;
export const positions = ["PG", "SG", "SF", "PF", "C"] as const;
export const tierNames = [
  "Bronze",
  "Silver",
  "Gold",
  "Hall of Fame",
  "Legend",
] as const;
export const attributes = {
  closeShot: ["Close Shot", "finishing"],
  drivingLayup: ["Driving Layup", "finishing"],
  drivingDunk: ["Driving Dunk", "finishing"],
  standingDunk: ["Standing Dunk", "finishing"],
  postControl: ["Post Control", "finishing"],
  midRange: ["Mid-Range Shot", "shooting"],
  threePoint: ["Three-Point Shot", "shooting"],
  freeThrow: ["Free Throw", "shooting"],
  passAccuracy: ["Pass Accuracy", "playmaking"],
  ballHandle: ["Ball Handle", "playmaking"],
  speedWithBall: ["Speed With Ball", "playmaking"],
  interiorDefense: ["Interior Defense", "defense"],
  perimeterDefense: ["Perimeter Defense", "defense"],
  steal: ["Steal", "defense"],
  block: ["Block", "defense"],
  offensiveRebound: ["Offensive Rebound", "defense"],
  defensiveRebound: ["Defensive Rebound", "defense"],
  speed: ["Speed", "physicals"],
  agility: ["Agility", "physicals"],
  strength: ["Strength", "physicals"],
  vertical: ["Vertical", "physicals"],
} as const;
// These are deliberately illustrative rules, not claims about NBA 2K27.
export const rules = {
  status: "demo",
  attributeRange: [25, 99],
  heightRange: [65, 87],
  weightRange: [150, 350],
  wingspanRange: [65, 100],
  resourceMax: 200,
  upgrades: [
    {
      id: "fuze1",
      label: "Fuze +1",
      steps: 1,
      maxTier: 4,
      requiresFinalEligibility: false,
      categories: [...categories],
    },
    {
      id: "fuze2",
      label: "Fuze +2",
      steps: 2,
      maxTier: 4,
      requiresFinalEligibility: false,
      categories: [...categories],
    },
  ],
  maxStates: 12000,
} as const;
export const presets: Record<
  string,
  Partial<Record<(typeof categories)[number], number>>
> = {
  Balanced: {},
  Shooting: { shooting: 2, playmaking: 1.1 },
  Finishing: { finishing: 2 },
  Playmaking: { playmaking: 2 },
  Defense: { defense: 2 },
  "Big Man": { defense: 1.7, finishing: 1.6, shooting: 0.7 },
  Custom: {},
};
