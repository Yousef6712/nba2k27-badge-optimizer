import { context } from "esbuild";
import { spawn } from "node:child_process";
import { workerOptions } from "./build-worker.mjs";
const worker = await context(workerOptions);
await worker.watch();
const next = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "dev", ...process.argv.slice(2)],
  { stdio: "inherit", windowsHide: true },
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => next.kill(signal));
next.on("exit", async (code) => {
  await worker.dispose();
  process.exit(code ?? 0);
});
