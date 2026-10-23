# Tools

Small, deterministic TypeScript functions. Each one does a single job.

- Export one typed async function per file (e.g. `scrapeWebsite.ts`, `qualifyLead.ts`).
- Shared Zod schemas and types live in `schemas.ts`.
- Read secrets from `process.env` only.
- Throw clear errors. Retries are handled by the Trigger.dev task, not here.
