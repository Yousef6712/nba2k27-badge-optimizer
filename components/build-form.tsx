"use client";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
import { attributes, positions, rules } from "@/data/rules";
import type { Build } from "@/lib/model";
import { Choice, NumberField } from "./controls";
import { Slider } from "@/components/ui/slider";
import { getAttributeCaps } from "@/data/caps";
const builderCategories = [
  "finishing",
  "shooting",
  "playmaking",
  "rebounding",
  "defense",
  "physicals",
];
const categoryNames: Record<string, string> = {
  finishing: "Finishing",
  shooting: "Shooting",
  playmaking: "Playmaking",
  defense: "Defense",
  rebounding: "Rebounding",
  physicals: "Physicals",
};
const categoryColors: Record<string, string> = {
  finishing: "#3b82f6",
  shooting: "#25c66f",
  playmaking: "#f59e0b",
  defense: "#ef3333",
  rebounding: "#8b4de8",
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
  const caps = getAttributeCaps(build);
  const feetInches = (inches: number) => ({
    feet: Math.floor(inches / 12),
    inches: inches % 12,
  });
  const setFeetInches = (kind: "height" | "wingspan", feet: number, inches: number) => {
    const total = feet * 12 + inches;
    const range = kind === "height" ? rules.heightRange : rules.wingspanRange;
    update({ ...build, [kind]: Math.max(range[0], Math.min(range[1], total)) });
  };
  const height = feetInches(build.height);
  const wingspan = feetInches(build.wingspan);
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
        <Choice
          label="Position"
          value={build.position}
          options={positions}
          onChange={(position) =>
            update({ ...build, position: position as Build["position"] })
          }
        />
        <div className="compound-field">
          <span>Height</span>
          <div className="compound-inputs">
            <NumberField label="ft" value={height.feet} min={5} max={7} onChange={(v) => setFeetInches("height", v, height.inches)} />
            <NumberField label="in" value={height.inches} min={0} max={11} onChange={(v) => setFeetInches("height", height.feet, v)} />
          </div>
        </div>
        <NumberField
          label="Weight (lb)"
          value={build.weight}
          min={rules.weightRange[0]}
          max={rules.weightRange[1]}
          onChange={(weight) => update({ ...build, weight })}
        />
        <div className="compound-field">
          <span>Wingspan</span>
          <div className="compound-inputs">
            <NumberField label="ft" value={wingspan.feet} min={5} max={8} onChange={(v) => setFeetInches("wingspan", v, wingspan.inches)} />
            <NumberField label="in" value={wingspan.inches} min={0} max={11} onChange={(v) => setFeetInches("wingspan", wingspan.feet, v)} />
          </div>
        </div>
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
        {builderCategories.map((category) => (
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
              .filter(
                ([key, v]) => {
                  const isRebound =
                    key === "offensiveRebound" || key === "defensiveRebound";
                  return category === "rebounding"
                    ? isRebound
                    : v[1] === category && (category !== "defense" || !isRebound);
                },
              )
              .map(([key, [name]]) => {
                const id = key as keyof Build["attributes"];
                const cap = caps[id] ?? 99;
                const value = Math.min(build.attributes[id] ?? 25, cap);
                return (
                  <div className="attribute-row" key={id}>
                    <div className="attribute-label">
                      <span>{name}</span>
                      <b>
                        {Number.isFinite(value) ? value : 25}
                        <em>/{cap}</em>
                      </b>
                    </div>
                    <Slider
                      aria-label={`${name} slider`}
                      value={[Number.isFinite(value) ? value : 25]}
                      min={25}
                      max={cap}
                      onValueChange={(v) =>
                        setAttribute(id, Array.isArray(v) ? v[0] : v)
                      }
                    />
                    <div className="attribute-input">
                      <NumberField
                        label=""
                        value={value}
                        min={25}
                        max={cap}
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
