# AI Lead Qualifier — WAT Framework

This project uses the **WAT framework**:
- **W — Workflows** (`workflows/`): Markdown SOPs. Each one says what to do, in what order, with which tools, what the inputs and outputs are, and how to handle edge cases. Workflows are the source of truth for *how* a job gets done.
- **A — Agent** (Claude Code): reads workflows, picks and runs the right tools in order, handles failures, and improves the system. The agent coordinates. It does not do by hand what a tool should do.
- **T — Tools** (`tools/`): small, deterministic TypeScript functions/scripts that do one thing each (scrape a site, call Claude, validate data). Tools hold the code. Workflows hold the instructions.

Why: AI reasoning is probabilistic and code is deterministic. Keep judgment in the agent and the LLM, and keep execution in tested tools.

## The product
An AI Lead Qualifier. A user fills a lead form in the web app and clicks **Analyze**. A Trigger.dev task enriches the lead by scraping its company website, Claude scores and qualifies it, and the result streams back to the frontend.

## Architecture
```
[Next.js on Vercel]                         [Trigger.dev cloud]
 Lead form ──Server Action──► tasks.trigger("qualify-lead") ──► qualify-lead task
    ▲                         (TRIGGER_SECRET_KEY, server-only)     │ 1. tools/scrapeWebsite (Firecrawl)
    │                                                               │ 2. tools/qualifyLead  (Claude API)
    └── useRealtimeRun(runId, publicAccessToken) ◄── run status + output (Realtime)
```
- **Backend:** Trigger.dev v4 task in `trigger/`. It runs the tools in the order its workflow sets.
- **Frontend:** Next.js (App Router, TypeScript, Tailwind), deployed to Vercel from GitHub.
- **Communication:** a Server Action calls `tasks.trigger<typeof qualifyLeadTask>()` and returns `{ runId, publicAccessToken }`. The client subscribes with `useRealtimeRun` from `@trigger.dev/react-hooks` to show live status and the final result. The secret key never reaches the browser.
- One repo, one `package.json`. The Next.js app and the Trigger.dev tasks share types from `tools/schemas.ts`.

## Directory layout
```
CLAUDE.md
workflows/            # SOPs (Markdown) — e.g. qualify_lead.md
tools/                # TypeScript tools — scrapeWebsite.ts, qualifyLead.ts, schemas.ts
trigger/              # Trigger.dev task definitions (thin: wire tools per workflow)
app/                  # Next.js App Router (form page, server actions, result UI)
trigger.config.ts     # dirs: ["./trigger"]
.env.example          # every required env var, no values
```

## Data contracts (`tools/schemas.ts`, Zod)
- **LeadInput:** name, email, company, website (URL), role/title, company size, industry, budget, timeline, notes.
- **QualificationResult:** `score` (0–100), `tier` ("hot" | "warm" | "cold" | "disqualified"), `summary`, `fitReasons[]`, `concerns[]`, `recommendedNextStep`, `enrichment` (short company summary from the site), `confidence` (0–1).
- Validate the input at the Server Action *and* in the task. Validate Claude's output against the schema before returning it.

## Tool rules
- One responsibility per tool. Export a typed async function and accept and return Zod-validated types.
- Tools read secrets from `process.env` and never hardcode them.
- Tools fail loudly with clear error messages. Retries live in the Trigger.dev task (`retry` config), not inside tools.
- `scrapeWebsite`: Firecrawl scrape → markdown. Truncate it to a sane token budget. If the scrape fails, return `null` (the lead is still qualified, but with lower confidence).
- `qualifyLead`: Anthropic SDK. Model from `ANTHROPIC_MODEL` (default `claude-opus-5-5`). Force structured output with a tool or JSON schema. The scoring rubric lives in `workflows/qualify_lead.md` and is loaded into the prompt. Do not duplicate it in code.

## How the agent (you) should operate
1. **Check `workflows/` first.** Before building or running anything, read the relevant workflow and follow it.
2. **Check `tools/` before writing new code.** Reuse existing tools and create a new one only when nothing fits.
3. **When something fails:** read the full error, fix the tool, and test again. If the fix teaches something (an API limit, a quirk, a better approach), **update the workflow** so it stays true.
4. **Don't overwrite workflows casually.** Ask before making big changes to a workflow. Small factual fixes are fine.
5. **Ask before paid or outward-facing actions:** deploys (`npx trigger.dev deploy`, Vercel prod), runs that use paid API credits in bulk, and pushes to GitHub.

## Environment variables
| Var | Where | Purpose |
|---|---|---|
| `TRIGGER_SECRET_KEY` | Vercel + `.env.local` | Server-side key to trigger tasks (dev key locally, prod key on Vercel) |
| `ANTHROPIC_API_KEY` | Trigger.dev project env (+ `.env.local` for dev) | Claude API |
| `ANTHROPIC_MODEL` | Trigger.dev env (optional) | Override the model |
| `FIRECRAWL_API_KEY` | Trigger.dev env (+ `.env.local`) | Website scraping |

Never commit `.env*` files except `.env.example`.

## Commands
- `npm run dev`: Next.js locally
- `npx trigger.dev@latest dev`: run tasks locally against the Trigger.dev dev environment
- `npx trigger.dev@latest deploy`: deploy tasks (ask first)
- Vercel deploys automatically on push to `main` (ask before pushing)

## Conventions
- TypeScript strict mode, Zod at every boundary, no `any`.
- Keep tasks in `trigger/` thin. Logic belongs in `tools/`.
- Keep the UI states clear: idle → queued → enriching → qualifying → done / failed. Use `metadata.set("step", …)` in the task to drive them.
