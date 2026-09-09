import { z } from "zod";
import { buildSchema, type Build } from "./model";
export const storageKey = "nba2k27.builds.v1";
const savedSchema = z
  .array(z.object({ id: z.string(), savedAt: z.string(), build: buildSchema }))
  .max(100);
export type SavedBuild = z.infer<typeof savedSchema>[number];
export function exportBuild(build: Build) {
  return JSON.stringify(buildSchema.parse(build), null, 2);
}
export function importBuild(text: string): Build {
  if (text.length > 100000)
    throw new Error("Build file is too large (maximum 100 KB).");
  return buildSchema.parse(JSON.parse(text));
}
export function readBuilds(storage: Pick<Storage, "getItem">): SavedBuild[] {
  const raw = storage.getItem(storageKey);
  return raw ? savedSchema.parse(JSON.parse(raw)) : [];
}
export function writeBuilds(
  storage: Pick<Storage, "setItem">,
  builds: SavedBuild[],
) {
  storage.setItem(storageKey, JSON.stringify(savedSchema.parse(builds)));
}
