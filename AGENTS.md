<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Persistent project rules

Use strict TypeScript. Inspect existing source before changing it. Game data lives in data/; optimization and eligibility live in lib/; components consume calculated results. Do not hard-code game logic in UI components. Change game rules through configuration/data where possible. Never invent official NBA 2K27 requirements and silently present them as verified.

Run tests whenever optimization logic changes. Run formatting and ESLint on completed changes, relevant Playwright tests for user flows, and the production build before considering major work complete. Preserve versioned saved builds where practical; introduce explicit migrations for schema changes. Keep secrets and generated output out of Git.

This is an actual Next.js static-export application. Preserve the existing pnpm lockfile and shadcn components; npm install / npm run dev / npm run build must work. Keep .openai/hosting.json and its project ID for Sites. The private GitHub repository uses origin; Sites uses a separate sites remote.

Commit and push completed user-requested changes to the existing GitHub repository. Never force-push, rewrite history, create another repository for updates, or commit broken code. If GitHub requires user login, continue independent implementation and validation and report the precise authorization action. Read README.md and docs/ for architecture details.
