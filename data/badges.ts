import {
  badgeSchema,
  type Attribute,
  type Badge,
  type Category,
} from "@/lib/model";
import { positions, tierNames } from "./rules";
const samples: [string, string, Category, Attribute, string][] = [
  [
    "deep-threat",
    "Deep Threat",
    "shooting",
    "threePoint",
    "Demo perimeter shooting effectiveness.",
  ],
  [
    "pull-up-specialist",
    "Pull-Up Specialist",
    "shooting",
    "midRange",
    "Demo shooting effectiveness off the dribble.",
  ],
  [
    "soft-touch",
    "Soft Touch",
    "finishing",
    "drivingLayup",
    "Demo finishing on contested layups.",
  ],
  [
    "rim-pressure",
    "Rim Pressure",
    "finishing",
    "drivingDunk",
    "Demo finishing above the rim.",
  ],
  [
    "paint-anchor",
    "Paint Anchor",
    "defense",
    "interiorDefense",
    "Demo interior defensive presence.",
  ],
  [
    "perimeter-stop",
    "Perimeter Stop",
    "defense",
    "perimeterDefense",
    "Demo on-ball perimeter defense.",
  ],
  [
    "glass-work",
    "Glass Work",
    "defense",
    "defensiveRebound",
    "Demo defensive rebounding effectiveness.",
  ],
  [
    "floor-general",
    "Floor General",
    "playmaking",
    "passAccuracy",
    "Demo passing and team creation.",
  ],
  [
    "handle-craft",
    "Handle Craft",
    "playmaking",
    "ballHandle",
    "Demo ball-handling effectiveness.",
  ],
  [
    "second-effort",
    "Second Effort",
    "physicals",
    "strength",
    "Demo strength and physical play.",
  ],
];
export const badges: Badge[] = samples.map(
  ([id, name, category, attribute, description], index) =>
    badgeSchema.parse({
      id,
      name,
      category,
      description,
      allowedPositions: id === "paint-anchor" ? ["PF", "C"] : positions,
      minimumHeight: id === "glass-work" ? 76 : 65,
      maximumHeight: 87,
      importance: 1 + (index % 3) * 0.1,
      tiers: tierNames.map((tierName, i) => ({
        tierName,
        requirements: [{ attribute, minimum: [60, 70, 80, 90, 97][i] }],
        requirementMode: "all",
        tokenCost: [1, 2, 4, 7, 10][i],
        baseValue: [2, 4, 7, 10, 13][i],
      })),
      source: {
        status: "demo",
        notes:
          "Invented example badge for software testing. Not an official NBA 2K27 badge or requirement.",
      },
    }),
);
