"use client";
import { badges } from "@/data/badges";
import { categories, presets, tierNames, rules } from "@/data/rules";
import type { Build } from "@/lib/model";
import { Choice, NumberField } from "./controls";
export function BadgeChoices({
  build,
  update,
}: {
  build: Build;
  update: (b: Build) => void;
}) {
  return (
    <details>
      <summary>Lock, exclude & prioritize badges</summary>
      <p className="text-sm">
        Lock means a minimum final tier, including Fuze. Exclusion replaces a
        lock.
      </p>
      {badges.map((b) => {
        const c = build.choices[b.id];
        return (
          <div className="result-row" key={b.id}>
            <strong>{b.name}</strong>
            <div className="fields">
              <Choice
                label={`${b.name} allocation`}
                value={
                  c?.exclude
                    ? "Exclude"
                    : c?.minimumTier !== undefined
                      ? `Lock ${tierNames[c.minimumTier]}`
                      : "Automatic"
                }
                options={[
                  "Automatic",
                  "Exclude",
                  ...tierNames.map((t) => `Lock ${t}`),
                ]}
                onChange={(v) =>
                  update({
                    ...build,
                    choices: {
                      ...build.choices,
                      [b.id]:
                        v === "Exclude"
                          ? { exclude: true }
                          : v === "Automatic"
                            ? { exclude: false }
                            : {
                                exclude: false,
                                minimumTier: tierNames.findIndex(
                                  (t) => `Lock ${t}` === v,
                                ),
                              },
                    },
                  })
                }
              />
              <NumberField
                label={`${b.name} importance`}
                value={build.badgeWeights[b.id] ?? 1}
                min={0}
                max={10}
                step={0.1}
                onChange={(v) =>
                  update({
                    ...build,
                    badgeWeights: { ...build.badgeWeights, [b.id]: v },
                  })
                }
              />
            </div>
          </div>
        );
      })}
    </details>
  );
}
export function Preferences({
  build,
  update,
  reset,
}: {
  build: Build;
  update: (b: Build) => void;
  reset: () => void;
}) {
  return (
    <section>
      <h1>Settings / About</h1>
      <div className="workspace">
        <div className="panel">
          <h2>Scoring preferences</h2>
          <Choice
            label="Optimization preset"
            value={build.preset}
            options={Object.keys(presets)}
            onChange={(preset) => update({ ...build, preset })}
          />
          <p>
            Category weights apply with the Custom preset. Individual badge
            importance applies to every preset.
          </p>
          {categories.map((c) => (
            <NumberField
              key={c}
              label={`${c} weight`}
              value={build.categoryWeights[c] ?? 1}
              min={0}
              max={10}
              step={0.1}
              onChange={(v) =>
                update({
                  ...build,
                  preset: "Custom",
                  categoryWeights: { ...build.categoryWeights, [c]: v },
                })
              }
            />
          ))}
          <button onClick={reset}>Reset settings</button>
        </div>
        <div className="stack">
          <div className="panel">
            <h2>Advanced optimizer settings</h2>
            <NumberField
              label="Maximum search states"
              value={build.maxStates}
              min={100}
              max={50000}
              step={100}
              onChange={(maxStates) => update({ ...build, maxStates })}
            />
            <p>
              The optimizer is exact until this limit is reached, then uses a
              bounded search. Larger limits use more memory and time.
            </p>
            <details>
              <summary>Category resource caps</summary>
              <p>
                Optional caps constrain total category usage within the shared
                resource pools. Set both fields to zero to prevent that
                category.
              </p>
              {categories.map((c) => (
                <div key={c}>
                  <div className="row">
                    <h3 className="capitalize">{c}</h3>
                    <button
                      onClick={() => {
                        const caps = { ...build.resources.categoryCaps };
                        if (caps[c]) delete caps[c];
                        else
                          caps[c] = {
                            slots:
                              build.resources.slots +
                              build.resources.bonusSlots,
                            tokens:
                              build.resources.tokens +
                              build.resources.bonusTokens,
                          };
                        update({
                          ...build,
                          resources: { ...build.resources, categoryCaps: caps },
                        });
                      }}
                    >
                      {build.resources.categoryCaps[c]
                        ? "Remove cap"
                        : "Add cap"}
                    </button>
                  </div>
                  {build.resources.categoryCaps[c] && (
                    <div className="fields">
                      {(["slots", "tokens"] as const).map((key) => (
                        <NumberField
                          key={key}
                          label={`${c} ${key} cap`}
                          value={build.resources.categoryCaps[c][key]}
                          onChange={(v) =>
                            update({
                              ...build,
                              resources: {
                                ...build.resources,
                                categoryCaps: {
                                  ...build.resources.categoryCaps,
                                  [c]: {
                                    ...build.resources.categoryCaps[c],
                                    [key]: v,
                                  },
                                },
                              },
                            })
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </details>
          </div>
          <div className="panel">
            <h2>Transparent by design</h2>
            <p>
              This independent tool is not affiliated with NBA 2K, the NBA, or
              Take-Two. All {badges.length} example badges, requirements,
              values, and rules are invented demo data.
            </p>
            <p>
              Demo Fuze rules: one upgrade per badge, exact +1 or +2 tiers,
              final tier capped at Legend, no final-tier attribute requirement.
              Natural tier costs tokens. Replace these rules with verified data
              before using recommendations in-game.
            </p>
            <p>
              Builds stay in this browser. Export important builds as a backup.
              No account, database, or AI API is required.
            </p>
            <p>
              Rule status: {rules.status}. Dataset is read-only; Load Demo Build
              restores the example configuration.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
