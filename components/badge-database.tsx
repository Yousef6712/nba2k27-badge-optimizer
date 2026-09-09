"use client";
import { useState } from "react";
import { badges } from "@/data/badges";
import { categories, positions, tierNames, attributes } from "@/data/rules";
import type { Build } from "@/lib/model";
import { getEligibleBadgeTiers } from "@/lib/eligibility";
import { Choice } from "./controls";
import { Tier } from "./results";
export function BadgeDatabase({ build }: { build: Build }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const [tier, setTier] = useState("All tiers");
  const [position, setPosition] = useState("All positions");
  const [status, setStatus] = useState("All statuses");
  const list = badges.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) &&
      (category === "All categories" || b.category === category) &&
      (tier === "All tiers" || b.tiers.some((t) => t.tierName === tier)) &&
      (position === "All positions" ||
        b.allowedPositions.some((p) => p === position)) &&
      (status === "All statuses" || b.source.status === status),
  );
  return (
    <section>
      <h1>Badge database</h1>
      <p>Inspect requirements, costs, restrictions, and source quality.</p>
      <div className="toolbar">
        <label>
          Search badges
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name…"
          />
        </label>
        <Choice
          label="Category"
          value={category}
          options={["All categories", ...categories]}
          onChange={setCategory}
        />
        <Choice
          label="Tier"
          value={tier}
          options={["All tiers", ...tierNames]}
          onChange={setTier}
        />
        <Choice
          label="Position eligibility"
          value={position}
          options={["All positions", ...positions]}
          onChange={setPosition}
        />
        <Choice
          label="Verification status"
          value={status}
          options={[
            "All statuses",
            "verified",
            "community reported",
            "unverified",
            "demo",
          ]}
          onChange={setStatus}
        />
      </div>
      <p>{list.length} badges · All included records are demo data</p>
      <div className="badge-grid">
        {list.map((b) => (
          <article className="panel" key={b.id}>
            <div className="row">
              <h2>{b.name}</h2>
              <span className="tag">{b.source.status.toUpperCase()}</span>
            </div>
            <p className="capitalize">{b.category}</p>
            <p>{b.description}</p>
            <small>
              {getEligibleBadgeTiers(build, b).length} natural tiers eligible
              for current build
            </small>
            <details>
              <summary>Requirements & source</summary>
              <p>
                {b.allowedPositions.join(" · ")} · Height {b.minimumHeight}–
                {b.maximumHeight} in
              </p>
              <div className="scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Tier</th>
                      <th>Requirements</th>
                      <th>Tokens</th>
                    </tr>
                  </thead>
                  <tbody>
                    {b.tiers.map((t, i) => (
                      <tr key={t.tierName}>
                        <td>
                          <Tier index={i} />
                        </td>
                        <td>
                          {t.requirements
                            .map(
                              (r) =>
                                `${attributes[r.attribute][0]} ≥ ${r.minimum}${r.maximum === undefined ? "" : ` and ≤ ${r.maximum}`}`,
                            )
                            .join(
                              t.requirementMode === "any" ? " OR " : " AND ",
                            ) || "None"}
                        </td>
                        <td>{t.tokenCost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p>{b.source.notes}</p>
              {b.source.url && (
                <a href={b.source.url} target="_blank" rel="noreferrer">
                  View source
                </a>
              )}
              <p>Last verified: {b.source.lastVerified ?? "Never"}</p>
            </details>
          </article>
        ))}
      </div>
      {!list.length && (
        <div className="empty">No badges match these filters.</div>
      )}
    </section>
  );
}
