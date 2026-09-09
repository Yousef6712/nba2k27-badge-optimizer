"use client";
import { useState } from "react";
import { Shield, ArrowUpRight } from "lucide-react";
import { verifiedBadgeForHeight } from "@/data/verified";
import { rules, tierNames } from "@/data/rules";
import type { Build } from "@/lib/model";
import type { Recommendation } from "@/lib/optimizer";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
export function Tier({ index }: { index: number }) {
  return (
    <span
      className={`tier ${tierNames[index].toLowerCase().replaceAll(" ", "-")}`}
    >
      {tierNames[index]}
    </span>
  );
}
export function Results({
  results,
  build,
}: {
  results: Recommendation[];
  build: Build;
}) {
  const badges = verifiedBadgeForHeight(build.height);
  const [selected, setSelected] = useState(0);
  const result = results[selected] ?? results[0];
  if (!result)
    return (
      <div className="empty">
        <Shield size={36} />
        <h2>Your next advantage starts here.</h2>
        <p>Set your attributes, choose a playstyle, and optimize.</p>
      </div>
    );
  const s = result.solution;
  const resources = [
    ["Regular slots", s.usage.slots, build.resources.slots],
    ["Regular tokens", s.usage.tokens, build.resources.tokens],
    ["Bonus slots", s.usage.bonusSlots, build.resources.bonusSlots],
    ["Bonus tokens", s.usage.bonusTokens, build.resources.bonusTokens],
    ...rules.upgrades.map((u) => [
      u.label,
      s.usage.upgrades[u.id],
      build.resources.upgrades[u.id] ?? 0,
    ]),
  ] as [string, number, number][];
  return (
    <section aria-label="Optimization results">
      <div className="row mt-7">
        <h2>
          Recommended loadout <ArrowUpRight size={18} />
        </h2>
        <span className="tag">
          {s.exact ? "EXACT SOLUTION" : "APPROXIMATE"}
        </span>
      </div>
      <Tabs
        value={String(selected)}
        onValueChange={(v) => setSelected(Number(v))}
      >
        <TabsList className="w-full h-auto flex-wrap">
          {results.map((r, i) => (
            <TabsTrigger key={r.label} value={String(i)} className="p-3">
              {r.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <p>
        <strong className="text-[#ceff60] text-3xl">
          {s.score.toFixed(1)}
        </strong>{" "}
        weighted utility ·{" "}
        {build.preset === "Custom"
          ? "Custom"
          : selected === 0
            ? build.preset
            : result.label}{" "}
        weights
      </p>
      {selected > 0 && (
        <small>
          Alternative scores use different playstyle weights and are not
          directly comparable.
        </small>
      )}
      <div className="stats">
        {resources.map(([label, used, available]) => (
          <div className="stat" key={label}>
            <strong>
              {used}
              <span> / {available}</span>
            </strong>
            <span>
              {label} · {available - used} unused
            </span>
          </div>
        ))}
      </div>
      {s.picks.length === 0 ? (
        <p>
          No badges allocated. Increase resources or adjust your attributes and
          weights.
        </p>
      ) : (
        s.picks.map((p) => {
          const badge = badges.find((b) => b.id === p.badgeId)!;
          return (
            <article key={p.badgeId} className="result-row">
              <div className="row">
                <div>
                  <strong>{badge.name}</strong>
                  <p className="capitalize text-sm">{badge.category}</p>
                </div>
                <Tier index={p.finalTier} />
              </div>
              <div className="result-meta">
                <span>Natural: {tierNames[p.naturalTier]}</span>
                <span>
                  {rules.upgrades.find((u) => u.id === p.upgrade)?.label ??
                    "No upgrade"}
                </span>
                <span>{p.tokens} tokens</span>
                <span>{p.value.toFixed(1)} utility</span>
              </div>
              <p className="text-sm">{p.reason}</p>
            </article>
          );
        })
      )}
      <details>
        <summary>Why did the optimizer choose this?</summary>
        <ul className="list-disc pl-5 space-y-2 text-sm text-[#adb6be]">
          {s.explanations.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      </details>
      {results.length < 3 && (
        <p className="text-sm">
          {results.length === 1
            ? "No meaningfully different feasible alternative was found."
            : "Only one meaningfully different alternative was found."}
        </p>
      )}
    </section>
  );
}
