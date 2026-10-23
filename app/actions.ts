"use server";

import { tasks } from "@trigger.dev/sdk";
import { z } from "zod";
import type { qualifyLeadTask } from "@/trigger/qualifyLead";
import { LeadInput } from "@/tools/schemas";

export type AnalyzeResult =
  | { ok: true; runId: string; accessToken: string }
  | { ok: false; error: string; fieldErrors?: Partial<Record<keyof LeadInput, string[]>> };

/** Validates the lead form and starts the qualify-lead task on Trigger.dev. */
export async function analyzeLead(formData: FormData): Promise<AnalyzeResult> {
  const parsed = LeadInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    const handle = await tasks.trigger<typeof qualifyLeadTask>("qualify-lead", parsed.data);
    return { ok: true, runId: handle.id, accessToken: handle.publicAccessToken };
  } catch (error) {
    console.error("analyzeLead: failed to trigger qualify-lead", error);
    return { ok: false, error: "Couldn't start the analysis. Check the server logs and TRIGGER_SECRET_KEY." };
  }
}
