import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "dist/**",
    "components/ui/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
    "public/optimizer-worker.js",
  ]),
  { rules: { "react-hooks/set-state-in-effect": "off" } },
]);
