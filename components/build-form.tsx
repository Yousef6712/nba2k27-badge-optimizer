"use client";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
import { attributes, categories, positions, rules } from "@/data/rules";
import type { Build } from "@/lib/model";
import { Choice, NumberField } from "./controls";
import { Slider } from "@/components/ui/slider";
const categoryNames: Record<string, string> = {
  finishing: "Finishing",
  shooting: "Shooting",
  playmaking: "Playmaking",
  defense: "Defense / Rebounding",
  physicals: "Physicals",
};
const categoryColors: Record<string, string> = {
  finishing: "#3b82f6",
  shooting: "#25c66f",
  playmaking: "#f59e0b",
  defense: "#ef4444",
  physicals: "#d1a514",
};
export function BuildForm({
  build,
  update,
}: {
  build: Build;
  update: (b: Build) => void;
}) {
  const setAttribute = (id: keyof Build["attributes"], value: number) =>
    update({ ...build, attributes: { ...build.attributes, [id]: value } });
  return (
    <section className="builder-card panel">
      <div className="builder-topline">
        <div>
          <p className="eyebrow">MYPLAYER BUILDER · ATTRIBUTE EDITOR</p>
          <h2>
            <SlidersHorizontal size={18} /> Enter your build
          </h2>
        </div>
        <button
          className="compact-reset"
          onClick={() =>
            update({
              ...build,
              attributes: Object.fromEntries(
                Object.keys(attributes).map((k) => [k, 25]),
              ) as Build["attributes"],
            })
          }
        >
          <RotateCcw size={14} /> Reset attributes
        </button>
      </div>
      <div className="build-identity">
        <label>
          Build name
          <input
            value={build.name}
            maxLength={80}
            onChange={(e) => update({ ...build, name: e.target.value })}
          />
        </label>
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
      <div className="capbreaker-warning">
        <strong>CAP BREAKER CHECK</strong>
        <span>
          Enter final attribute ratings after every cap breaker has been
          applied. Cap breakers are not entered separately and do not create
          extra badge tokens.
        </span>
      </div>
      <div className="attribute-grid">
        {categories.map((category) => (
          <div
            className="attribute-group"
            key={category}
            style={
              {
                "--group-color": categoryColors[category],
              } as React.CSSProperties
            }
          >
            <div className="attribute-heading">
              <span className="group-dot" />
              {categoryNames[category]}
              <small>25–99</small>
            </div>
            {Object.entries(attributes)
              .filter(([, v]) => v[1] === category)
              .map(([key, [name]]) => {
                const id = key as keyof Build["attributes"];
                const value = build.attributes[id] ?? 25;
                return (
                  <div className="attribute-row" key={id}>
                    <div className="attribute-label">
                      <span>{name}</span>
                      <b>
                        {Number.isFinite(value) ? value : 25}
                        <em>/99</em>
                      </b>
                    </div>
                    <Slider
                      aria-label={`${name} slider`}
                      value={[Number.isFinite(value) ? value : 25]}
                      min={25}
                      max={99}
                      onValueChange={(v) =>
                        setAttribute(id, Array.isArray(v) ? v[0] : v)
                      }
                    />
                    <div className="attribute-input">
                      <NumberField
                        label=""
                        value={value}
                        min={25}
                        max={99}
                        onChange={(v) => setAttribute(id, v)}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        ))}
      </div>
      <div className="resource-strip">
        <div>
          <strong>Badge resources</strong>
          <small>Manual inputs from your current loadout</small>
        </div>
        {(["slots", "tokens", "bonusSlots", "bonusTokens"] as const).map(
          (key, i) => (
            <NumberField
              key={key}
              label={["Slots", "Tokens", "Bonus slots", "Bonus tokens"][i]}
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
