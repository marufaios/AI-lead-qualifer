# Workflow: Deploy the qualify-lead task to Trigger.dev

## Objective
Ship the `qualify-lead` task (`trigger/qualifyLead.ts` and the tools it uses) to Trigger.dev's **prod** environment, so the Vercel app can trigger it.

## When to run
After any change to `trigger/`, `tools/`, `trigger.config.ts`, or the rubric in `workflows/qualify_lead.md` (the rubric ships with the deploy, so editing it needs a redeploy). Changes to `app/` only need a Vercel deploy.

**Always ask the user before running the deploy.** It is outward-facing.

## Inputs
- A Trigger.dev account and project. The CLI must be logged in (`npx trigger.dev@latest whoami`; if not, `npx trigger.dev@latest login`).
- The project ref (`proj_…`) from the dashboard → Project settings, set as `project` in `trigger.config.ts`.
- Prod values for `ANTHROPIC_API_KEY`, `FIRECRAWL_API_KEY` and, optionally, `ANTHROPIC_MODEL`.

## Steps
| # | Step | How |
|---|------|-----|
| 1 | Set the project ref | Replace `proj_REPLACE_ME` in `trigger.config.ts` |
| 2 | Type-check | `npm run typecheck` must pass |
| 3 | Test locally first | `.env.local` with dev keys, then `npx trigger.dev@latest dev` + `npm run dev`; submit a lead and check the run in the dashboard (**Dev** environment) |
| 4 | Set prod env vars | Dashboard → **Environment Variables** → **Production**: `ANTHROPIC_API_KEY`, `FIRECRAWL_API_KEY` (and `ANTHROPIC_MODEL` if overriding). Deployed tasks do **not** read `.env.local` |
| 5 | Deploy | `npx trigger.dev@latest deploy` (defaults to prod). Watch for the "Successfully deployed version …" line |
| 6 | Verify in the dashboard | **Production** → Tasks lists `qualify-lead`; use **Test** with a sample `LeadInput` payload and confirm the run completes |
| 7 | Point the frontend at prod | In Vercel → Project → Settings → Environment Variables, set `TRIGGER_SECRET_KEY` to the **prod** secret key (`tr_prod_…`, dashboard → API keys), then redeploy Vercel |

## Outputs
A new deployed version of `qualify-lead` in the Production environment, triggerable by the Vercel app.

## Edge cases
- **`Could not find project`**: the ref in `trigger.config.ts` is wrong, or the CLI is logged into a different account/profile.
- **Run fails with `ANTHROPIC_API_KEY is not set` / `FIRECRAWL_API_KEY is not set`**: the var is missing in the Production environment (step 4). No redeploy is needed after adding it; just re-run.
- **`Rubric markers not found`**: `workflows/qualify_lead.md` wasn't bundled. Check that the `additionalFiles` extension in `trigger.config.ts` still lists it, and that the `<!-- RUBRIC:START -->` / `<!-- RUBRIC:END -->` markers exist.
- **Frontend shows "Couldn't start the analysis"**: `TRIGGER_SECRET_KEY` on Vercel is missing, or it's the dev key while no `trigger dev` is running.
- **Version mismatch warnings**: keep `@trigger.dev/sdk`, `@trigger.dev/react-hooks`, `@trigger.dev/build` and `trigger.dev` on the same version (currently 4.8.0).

## Learnings
- **Windows PowerShell with script execution disabled**: `npx` fails with "npx.ps1 cannot be loaded". Use `npx.cmd trigger.dev@4.8.0 deploy` instead of changing the execution policy.
- The build log prints `UndefinedVar` warnings (`$SSL_CERT_FILE`, `$PIP_CERT`, …). They come from Trigger.dev's own Dockerfile template and are harmless.
- The first deploy (version 20261023.1) took about 2 minutes, almost all of it image build and push.
