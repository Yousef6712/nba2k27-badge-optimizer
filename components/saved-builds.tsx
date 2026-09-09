"use client";
import { useState } from "react";
import type { SavedBuild } from "@/lib/storage";
import type { Build } from "@/lib/model";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
export function SavedBuilds({
  items,
  load,
  change,
}: {
  items: SavedBuild[];
  load: (b: Build) => void;
  change: (items: SavedBuild[]) => void;
}) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  return (
    <section>
      <h1>Saved builds</h1>
      <p>
        Stored on this browser only. Export JSON to back up or move a build.
      </p>
      {!items.length ? (
        <div className="empty">
          No saved builds yet. Use Save Build on the optimizer.
        </div>
      ) : (
        <div className="badge-grid mt-6">
          {items.map((item) => (
            <article className="panel" key={item.id}>
              <label>
                Saved build name
                <input
                  aria-label={`Rename ${item.build.name}`}
                  defaultValue={item.build.name}
                  maxLength={80}
                  onBlur={(e) => {
                    const name = e.target.value.trim();
                    if (name && name !== item.build.name)
                      change(
                        items.map((s) =>
                          s.id === item.id
                            ? { ...s, build: { ...s.build, name } }
                            : s,
                        ),
                      );
                    else e.target.value = item.build.name;
                  }}
                />
              </label>
              <p>
                {item.build.position} · {item.build.height} in ·{" "}
                {item.build.preset}
              </p>
              <small>Saved {new Date(item.savedAt).toLocaleDateString()}</small>
              <div className="toolbar mt-5">
                <button onClick={() => load(item.build)}>Load</button>
                <button
                  onClick={() =>
                    change([
                      ...items,
                      {
                        ...item,
                        id: crypto.randomUUID(),
                        savedAt: new Date().toISOString(),
                        build: {
                          ...item.build,
                          name: `${item.build.name.slice(0, 73)} (copy)`,
                        },
                      },
                    ])
                  }
                >
                  Duplicate
                </button>
                <button onClick={() => setDeleteId(item.id)}>Delete</button>
              </div>
              <AlertDialog
                open={deleteId === item.id}
                onOpenChange={(open) => {
                  if (!open) setDeleteId(null);
                }}
              >
                <AlertDialogContent>
                  <AlertDialogTitle>Delete this local build?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes {item.build.name} from this browser. Export a
                    backup first if you need it.
                  </AlertDialogDescription>
                  <AlertDialogFooter>
                    <AlertDialogAction
                      onClick={() => {
                        change(items.filter((s) => s.id !== item.id));
                        setDeleteId(null);
                      }}
                    >
                      Confirm delete
                    </AlertDialogAction>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
