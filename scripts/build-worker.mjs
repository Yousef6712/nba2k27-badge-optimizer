import { build } from "esbuild";
export const workerOptions = {
  entryPoints: ["lib/optimizer.worker.ts"],
  outfile: "public/optimizer-worker.js",
  bundle: true,
  platform: "browser",
  target: "es2022",
  format: "iife",
  minify: true,
  tsconfig: "tsconfig.json",
};
await build(workerOptions);
