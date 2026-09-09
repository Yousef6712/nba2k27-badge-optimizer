"use client";
import { SlidersHorizontal } from "lucide-react";
import { attributes, categories, positions, rules } from "@/data/rules";
import type { Build } from "@/lib/model";
import { Choice, NumberField } from "./controls";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
export function BuildForm({
  build,
  update,
}: {
  build: Build;
  update: (b: Build) => void;
}) {
  return (
    <section className="panel">
      <h2>
        <SlidersHorizontal size={18} /> Your build
      </h2>
      <label>
        Build name
        <input
          value={build.name}
          maxLength={80}
          onChange={(e) => update({ ...build, name: e.target.value })}
        />
      </label>
      <div className="fields">
        <Choice
          label="Position"
          value={build.position}
          options={positions}
          onChange={(position) =>
            update({ ...build, position: position as Build["position"] })
          }
        />
        <NumberField
          label="Height (in)"
          value={build.height}
          min={rules.heightRange[0]}
          max={rules.heightRange[1]}
          onChange={(height) => update({ ...build, height })}
        />
        <NumberField
          label="Weight (lb)"
          value={build.weight}
          min={rules.weightRange[0]}
          max={rules.weightRange[1]}
          onChange={(weight) => update({ ...build, weight })}
        />
        <NumberField
          label="Wingspan (in)"
          value={build.wingspan}
          min={rules.wingspanRange[0]}
          max={rules.wingspanRange[1]}
          onChange={(wingspan) => update({ ...build, wingspan })}
        />
      </div>
      <h3>Attributes</h3>
      {categories.map((category) => (
        <details key={category} open={category === "shooting"}>
          <summary className="capitalize">
            {category === "defense" ? "Defense / Rebounding" : category}
          </summary>
          {Object.entries(attributes)
            .filter(([, v]) => v[1] === category)
            .map(([key, [name]]) => {
              const id = key as keyof Build["attributes"];
              const value = build.attributes[id];
              return (
                <div key={id}>
                  <NumberField
                    label={name}
                    value={value}
                    min={rules.attributeRange[0]}
                    max={rules.attributeRange[1]}
                    onChange={(v) =>
                      update({
                        ...build,
                        attributes: { ...build.attributes, [id]: v },
                      })
                    }
                  />
                  <Slider
                    aria-label={`${name} slider`}
                    value={[Number.isFinite(value) ? value : 25]}
                    min={25}
                    max={99}
                    onValueChange={(v) =>
                      update({
                        ...build,
                        attributes: {
                          ...build.attributes,
                          [id]: Array.isArray(v) ? v[0] : v,
                        },
                      })
                    }
                  />
                </div>
              );
            })}
        </details>
      ))}
      <h3>Cap breakers & synergy</h3>
      <small>
        Cap breakers raise attribute ceilings and do not create new tokens.
        Reaction badges are paired with a Fuse badge and activate in-game.
      </small>
      <div className="fields">
        {Object.entries(attributes).map(([key, [name]]) => (
          <NumberField
            key={key}
            label={`${name} cap breakers`}
            value={build.resources.capBreakers?.[key] ?? 0}
            max={5}
            onChange={(v) =>
              update({
                ...build,
                resources: {
                  ...build.resources,
                  capBreakers: {
                    ...(build.resources.capBreakers ?? {}),
                    [key]: v,
                  },
                },
              })
            }
          />
        ))}
        <NumberField
          label="Reaction badges unlocked"
          value={build.resources.reactionBadges ?? 0}
          max={200}
          onChange={(reactionBadges) =>
            update({
              ...build,
              resources: { ...build.resources, reactionBadges },
            })
          }
        />
      </div>
      <h3>
        Badge resources{" "}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              aria-label="How badge resources work"
              className="px-2 py-0 ml-2"
            >
              ?
            </TooltipTrigger>
            <TooltipContent>
              Demo rules spend regular pools first, then bonus pools. Fuze
              upgrades raise one badge by one or two tiers at no extra token
              cost.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </h3>
      <small>
        Enter earned resources manually. Demo rules combine regular and bonus
        pools.
      </small>
      <div className="fields">
        {(["slots", "tokens", "bonusSlots", "bonusTokens"] as const).map(
          (key, i) => (
            <NumberField
              key={key}
              label={
                ["Badge slots", "Badge tokens", "Bonus slots", "Bonus tokens"][
                  i
                ]
              }
              value={build.resources[key]}
              onChange={(v) =>
                update({
                  ...build,
                  resources: { ...build.resources, [key]: v },
                })
              }
            />
          ),
        )}
        {rules.upgrades.map((u) => (
          <NumberField
            key={u.id}
            label={u.label}
            value={build.resources.upgrades[u.id] ?? 0}
            onChange={(v) =>
              update({
                ...build,
                resources: {
                  ...build.resources,
                  upgrades: { ...build.resources.upgrades, [u.id]: v },
                },
              })
            }
          />
        ))}
      </div>
    </section>
  );
}
