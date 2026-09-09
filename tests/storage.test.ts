import { it, expect } from "vitest";
import { demoBuild, badgeSchema } from "@/lib/model";
import { badges } from "@/data/badges";
import {
  exportBuild,
  importBuild,
  readBuilds,
  writeBuilds,
  storageKey,
} from "@/lib/storage";
it("round trips exported builds with constraints and weights", () => {
  const b = demoBuild();
  b.choices["deep-threat"] = { exclude: false, minimumTier: 2 };
  b.badgeWeights["deep-threat"] = 1.8;
  expect(importBuild(exportBuild(b))).toEqual(b);
});
it("rejects malformed JSON, unknown versions, bad values and oversized files", () => {
  expect(() => importBuild("{")).toThrow();
  for (const edit of [
    { version: 2 },
    { height: 900 },
    { resources: {} },
    { attributes: {} },
    { name: "" },
  ])
    expect(() =>
      importBuild(JSON.stringify({ ...demoBuild(), ...edit })),
    ).toThrow();
  expect(() => importBuild(" ".repeat(100001))).toThrow("large");
});
it("saves and loads validated browser records", () => {
  const map = new Map<string, string>();
  const storage = {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
  };
  expect(readBuilds(storage)).toEqual([]);
  const records = [
    { id: "a", savedAt: new Date().toISOString(), build: demoBuild() },
  ];
  writeBuilds(storage, records);
  expect(readBuilds(storage)).toEqual(records);
  storage.setItem(storageKey, "bad json");
  expect(() => readBuilds(storage)).toThrow();
});
it("propagates quota failures", () => {
  expect(() =>
    writeBuilds(
      {
        setItem: () => {
          throw new Error("QuotaExceeded");
        },
      },
      [],
    ),
  ).toThrow("QuotaExceeded");
});
it("requires source evidence before marking data verified", () => {
  const b = structuredClone(badges[0]);
  b.source.status = "verified";
  expect(() => badgeSchema.parse(b)).toThrow("Verified records");
});
