"use client";
import { useEffect, useRef, useState } from "react";
import { Zap, Download, Upload, Save, RotateCcw } from "lucide-react";
import { z } from "zod";
import { demoBuild, buildSchema, type Build } from "@/lib/model";
import { presets } from "@/data/rules";
import { diagnostics, type Recommendation } from "@/lib/optimizer";
import {
  readBuilds,
  writeBuilds,
  exportBuild,
  importBuild,
  type SavedBuild,
} from "@/lib/storage";
import { BuildForm } from "./build-form";
import { BadgeDatabase } from "./badge-database";
import { BadgeChoices, Preferences } from "./preferences";
import { SavedBuilds } from "./saved-builds";
import { Results } from "./results";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
type ModelContext = {
  registerTool: (
    tool: {
      name: string;
      description: string;
      inputSchema: object;
      annotations: { readOnlyHint: boolean };
      execute: (input: unknown) => unknown;
    },
    options: { signal: AbortSignal },
  ) => void | Promise<void>;
};
function message(error: unknown) {
  return error instanceof z.ZodError
    ? error.issues
        .slice(0, 5)
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join(" · ")
    : error instanceof Error
      ? error.message
      : "Something went wrong.";
}
export function Dashboard() {
  const [build, setBuild] = useState<Build>(demoBuild);
  const [tab, setTab] = useState("Build & Optimize");
  const [results, setResults] = useState<Recommendation[]>([]);
  const [resultBuild, setResultBuild] = useState<Build>(build);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saved, setSaved] = useState<SavedBuild[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const worker = useRef<Worker | null>(null);
  const file = useRef<HTMLInputElement>(null);
  function update(next: Build) {
    worker.current?.terminate();
    worker.current = null;
    setBusy(false);
    setBuild(next);
    setResults([]);
    setError("");
    setNotice("");
  }
  useEffect(() => {
    setHydrated(true);
    try {
      setSaved(readBuilds(localStorage));
      setStorageReady(true);
    } catch (e) {
      setError(
        `Saved builds could not be read; existing storage was left untouched. ${message(e)}`,
      );
    }
    return () => worker.current?.terminate();
  }, []);
  function changeSaved(next: SavedBuild[]) {
    try {
      if (!storageReady)
        throw new Error(
          "Saved storage could not be read. Export your current build and inspect browser storage before saving.",
        );
      writeBuilds(localStorage, next);
      setSaved(next);
      setNotice("Saved builds updated.");
    } catch (e) {
      setError(message(e));
    }
  }
  function save() {
    try {
      const valid = buildSchema.parse(build);
      if (!storageReady)
        throw new Error(
          "Saved storage is unavailable. Export this build instead.",
        );
      const next = [
        ...saved,
        {
          id: crypto.randomUUID(),
          savedAt: new Date().toISOString(),
          build: valid,
        },
      ];
      writeBuilds(localStorage, next);
      setSaved(next);
      setNotice("Build saved on this device.");
    } catch (e) {
      setError(message(e));
    }
  }
  function optimizeCurrent(
    input: Build = build,
  ): Promise<{ recommendations: number; score: number }> {
    return new Promise((resolve, reject) => {
      let valid: Build;
      try {
        valid = buildSchema.parse(input);
      } catch (e) {
        setError(message(e));
        reject(e);
        return;
      }
      setError("");
      setNotice("");
      setBusy(true);
      worker.current?.terminate();
      const active = new Worker("/optimizer-worker.js");
      worker.current = active;
      const finish = () => {
        active.terminate();
        if (worker.current === active) worker.current = null;
        setBusy(false);
      };
      active.onmessage = (
        event: MessageEvent<{ results?: Recommendation[]; error?: string }>,
      ) => {
        finish();
        if (event.data.error) {
          setError(event.data.error);
          reject(new Error(event.data.error));
        } else if (event.data.results) {
          setResultBuild(valid);
          setResults(event.data.results);
          resolve({
            recommendations: event.data.results.length,
            score: event.data.results[0].solution.score,
          });
        }
      };
      active.onerror = () => {
        finish();
        const e = new Error(
          "The optimizer could not start. Reload the page and try again.",
        );
        setError(e.message);
        reject(e);
      };
      active.postMessage(valid);
    });
  }
  const currentAction = useRef(optimizeCurrent);
  useEffect(() => {
    currentAction.current = optimizeCurrent;
  });
  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContext })
      .modelContext;
    if (!context) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(
        context.registerTool(
          {
            name: "optimize_current_build",
            description:
              "Optimize the currently configured build and display recommendations. Accepts no arguments.",
            inputSchema: {
              type: "object",
              properties: {},
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false },
            execute: async (input) => {
              z.strictObject({}).parse(input);
              return currentAction.current();
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {});
    } catch {}
    return () => lifecycle.abort();
  }, []);
  function download() {
    try {
      const blob = new Blob([exportBuild(build)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${build.name.replace(/[^a-z0-9-]/gi, "-")}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setNotice("Build exported.");
    } catch (e) {
      setError(message(e));
    }
  }
  async function upload(selected: File | undefined) {
    if (!selected) return;
    try {
      if (selected.size > 100000) throw new Error("Build file exceeds 100 KB.");
      update(importBuild(await selected.text()));
      setTab("Build & Optimize");
      setNotice("Build imported. Save it to keep it on this device.");
    } catch (e) {
      setError(`Import failed. ${message(e)}`);
    } finally {
      if (file.current) file.current.value = "";
    }
  }
  const tabs = [
    "Build & Optimize",
    "Badge Database",
    "Saved Builds",
    "Settings / About",
  ];
  return (
    <main className="shell" data-ready={hydrated}>
      <header>
        <div className="brand">
          <Zap />
          <span>
            NBA 2K27 <b className="block">BADGE OPTIMIZER</b>
          </span>
        </div>
        <span className="tag">LOCAL-FIRST · V1</span>
      </header>
      <fieldset disabled={!hydrated} className="min-w-0 border-0 p-0 m-0">
        <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
          <nav aria-label="Main navigation">
            <TabsList
              variant="line"
              className="h-auto max-w-full overflow-x-auto justify-start"
            >
              {tabs.map((t) => (
                <TabsTrigger key={t} value={t} className="px-3 py-2">
                  {t}
                </TabsTrigger>
              ))}
            </TabsList>
          </nav>
          <div className="notice">
            <strong>MEASURED DATA / TUNING SNAPSHOT</strong> · Badge
            requirements and height-specific token costs are loaded from a
            public NBA 2K27 builder dataset captured 2026-08-22. Verify against
            your live game before relying on results. Fuze and Reaction pairings
            remain configurable.
          </div>
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          {notice && (
            <div className="success" role="status">
              {notice}
            </div>
          )}
          <TabsContent value="Build & Optimize">
            <section className="heading">
              <div>
                <h1>Every token. More impact.</h1>
                <p>
                  Configure your build. Find your strongest badge combination.
                </p>
              </div>
              <button
                onClick={() => {
                  update(demoBuild());
                  setNotice(
                    "Demo build loaded. All game data is illustrative.",
                  );
                }}
              >
                <RotateCcw size={16} /> Load Demo Build
              </button>
            </section>
            <div className="toolbar">
              <button onClick={save}>
                <Save size={16} /> Save Build
              </button>
              <button onClick={download}>
                <Download size={16} /> Export Build
              </button>
              <button onClick={() => file.current?.click()}>
                <Upload size={16} /> Import Build
              </button>
              <input
                ref={file}
                className="hidden"
                type="file"
                accept="application/json,.json"
                aria-label="Import build JSON"
                onChange={(e) => void upload(e.target.files?.[0])}
              />
            </div>
            <div className="workspace">
              <BuildForm build={build} update={update} />
              <section className="panel">
                <p className="eyebrow">ALLOCATION ENGINE</p>
                <h2>Make your badges work harder.</h2>
                <p>
                  Choose your playstyle. The optimizer balances tier value,
                  token costs, and every available upgrade.
                </p>
                <div className="preset-grid">
                  {Object.keys(presets).map((p) => (
                    <button
                      key={p}
                      className={build.preset === p ? "active-choice" : ""}
                      aria-pressed={build.preset === p}
                      onClick={() => update({ ...build, preset: p })}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                {build.preset === "Custom" && (
                  <p className="text-sm">
                    Edit category weights in Settings / About.
                  </p>
                )}
                <button
                  className="primary"
                  disabled={busy}
                  onClick={() => void optimizeCurrent().catch(() => {})}
                >
                  <Zap size={18} />
                  {busy ? "OPTIMIZING…" : "OPTIMIZE BADGES"}
                </button>
                {busy && <p role="status">Comparing badge combinations…</p>}
                <Results
                  key={
                    results === undefined
                      ? "none"
                      : JSON.stringify(results.map((r) => r.solution.score))
                  }
                  results={results}
                  build={resultBuild}
                />
                <BadgeChoices build={build} update={update} />
                {(process.env.NODE_ENV === "development" ||
                  process.env.NEXT_PUBLIC_OPTIMIZER_DEBUG === "true") && (
                  <details>
                    <summary>Developer diagnostics</summary>
                    <pre className="overflow-auto text-xs max-h-96">
                      {JSON.stringify(
                        {
                          result: results[0]?.solution,
                          eligibility: diagnostics(build),
                        },
                        null,
                        2,
                      )}
                    </pre>
                  </details>
                )}
              </section>
            </div>
          </TabsContent>
          <TabsContent value="Badge Database">
            <BadgeDatabase build={build} />
          </TabsContent>
          <TabsContent value="Saved Builds">
            <SavedBuilds
              items={saved}
              change={changeSaved}
              load={(b) => {
                update(structuredClone(b));
                setTab("Build & Optimize");
                setNotice("Saved build loaded.");
              }}
            />
          </TabsContent>
          <TabsContent value="Settings / About">
            <Preferences
              build={build}
              update={update}
              reset={() =>
                update({
                  ...build,
                  preset: "Balanced",
                  categoryWeights: {},
                  badgeWeights: {},
                  choices: {},
                  maxStates: 12000,
                })
              }
            />
          </TabsContent>
        </Tabs>
      </fieldset>
      <footer className="row mt-10 text-xs text-[#9aa5ad]">
        <span>
          Independent MyPLAYER planning tool. Not affiliated with NBA 2K.
        </span>
        <span>DATA: DEMO / V1</span>
      </footer>
    </main>
  );
}
