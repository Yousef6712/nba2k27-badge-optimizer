import { z } from "zod";
import {
  attributes,
  categories,
  positions,
  rules,
  presets,
  tierNames,
} from "@/data/rules";
export type Category = (typeof categories)[number];
export type Attribute = keyof typeof attributes;
const count = z.number().int().min(0).max(rules.resourceMax);
const weight = z.number().min(0).max(10);
export const buildSchema = z.object({
  version: z.literal(1),
  name: z.string().trim().min(1).max(80),
  position: z.enum(positions),
  height: z.number().int().min(rules.heightRange[0]).max(rules.heightRange[1]),
  weight: z.number().int().min(rules.weightRange[0]).max(rules.weightRange[1]),
  wingspan: z
    .number()
    .int()
    .min(rules.wingspanRange[0])
    .max(rules.wingspanRange[1]),
  attributes: z.record(
    z.enum(Object.keys(attributes) as [Attribute, ...Attribute[]]),
    z.number().int().min(rules.attributeRange[0]).max(rules.attributeRange[1]),
  ),
  resources: z.object({
    slots: count,
    tokens: count,
    bonusSlots: count,
    bonusTokens: count,
    upgrades: z.record(z.string(), count),
    capBreakers: z
      .record(z.string(), z.number().int().min(0).max(5))
      .optional(),
    reactionBadges: count.optional(),
    categoryCaps: z
      .record(
        z
          .string()
          .refine((v) => categories.some((c) => c === v), "Unknown category"),
        z.object({ slots: count, tokens: count }),
      )
      .default({}),
  }),
  preset: z.string().refine((v) => Object.hasOwn(presets, v), "Unknown preset"),
  categoryWeights: z.record(z.string(), weight),
  badgeWeights: z.record(z.string(), weight),
  choices: z.record(
    z.string(),
    z.object({
      exclude: z.boolean().default(false),
      minimumTier: z
        .number()
        .int()
        .min(0)
        .max(tierNames.length - 1)
        .optional(),
    }),
  ),
  maxStates: z.number().int().min(100).max(50000),
});
export type Build = z.infer<typeof buildSchema>;
export const requirementSchema = z.object({
  attribute: z.enum(Object.keys(attributes) as [Attribute, ...Attribute[]]),
  minimum: z.number().min(0).max(99),
  maximum: z.number().min(0).max(99).optional(),
});
export const badgeSchema = z
  .object({
    id: z.string().regex(/^[a-z][a-z0-9-]*$/),
    name: z.string().min(1),
    category: z.enum(categories),
    description: z.string(),
    allowedPositions: z.array(z.enum(positions)).min(1),
    minimumHeight: z.number(),
    maximumHeight: z.number(),
    importance: weight,
    tiers: z
      .array(
        z.object({
          tierName: z.enum(tierNames),
          requirements: z.array(requirementSchema),
          requirementMode: z.enum(["all", "any"]).default("all"),
          tokenCost: count,
          baseValue: z.number().min(0).max(1000),
        }),
      )
      .min(1)
      .max(tierNames.length),
    source: z.object({
      status: z.enum(["verified", "community reported", "unverified", "demo"]),
      url: z.url().optional(),
      notes: z.string(),
      lastVerified: z.iso.date().optional(),
    }),
  })
  .superRefine((badge, ctx) => {
    badge.tiers.forEach((tier, i) => {
      if (tier.tierName !== tierNames[i])
        ctx.addIssue({
          code: "custom",
          message: "Tiers must be in configured order, starting at Bronze",
        });
    });
    if (badge.minimumHeight > badge.maximumHeight)
      ctx.addIssue({ code: "custom", message: "Invalid height restriction" });
    if (
      badge.source.status === "verified" &&
      (!badge.source.url || !badge.source.lastVerified)
    )
      ctx.addIssue({
        code: "custom",
        message: "Verified records require a source and verification date",
      });
  });
export type Badge = z.infer<typeof badgeSchema>;
export function demoBuild(): Build {
  return buildSchema.parse({
    version: 1,
    name: "Two-Way Shot Creator",
    position: "PG",
    height: 77,
    weight: 205,
    wingspan: 81,
    attributes: Object.fromEntries(
      Object.keys(attributes).map((k) => [
        k,
        (
          {
            threePoint: 88,
            ballHandle: 86,
            perimeterDefense: 85,
            drivingLayup: 80,
            passAccuracy: 78,
            midRange: 82,
            speed: 85,
          } as Record<string, number>
        )[k] ?? 70,
      ]),
    ),
    resources: {
      slots: 5,
      tokens: 12,
      bonusSlots: 1,
      bonusTokens: 3,
      upgrades: { fuze1: 1, fuze2: 1 },
      capBreakers: {},
      reactionBadges: 0,
      categoryCaps: {},
    },
    preset: "Balanced",
    categoryWeights: {},
    badgeWeights: {},
    choices: {},
    maxStates: rules.maxStates,
  });
}
