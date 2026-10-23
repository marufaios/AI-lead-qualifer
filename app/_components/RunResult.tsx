"use client";

import { useRealtimeRun } from "@trigger.dev/react-hooks";
import type { qualifyLeadTask } from "@/trigger/qualifyLead";
import type { QualifyStep } from "@/tools/schemas";
import { Report, type ReportState } from "./Report";

const FAILED_STATUSES = new Set(["FAILED", "CRASHED", "SYSTEM_FAILURE", "CANCELED", "EXPIRED", "TIMED_OUT"]);

/** Subscribes to a qualify-lead run and renders its live state. */
export function RunResult({ runId, accessToken }: { runId: string; accessToken: string }) {
  const { run, error } = useRealtimeRun<typeof qualifyLeadTask>(runId, { accessToken });

  let state: ReportState;
  if (error) {
    state = { kind: "failed", message: `Lost the connection to the run: ${error.message}. Refresh and analyze again.` };
  } else if (!run) {
    state = { kind: "running", step: "connecting" };
  } else if (FAILED_STATUSES.has(run.status)) {
    state = {
      kind: "failed",
      message: `The run ended with status ${run.status.toLowerCase().replace(/_/g, " ")}. Open run ${run.id} in the Trigger.dev dashboard to see the error.`,
    };
  } else if (run.status === "COMPLETED" && run.output) {
    state = { kind: "done", output: run.output };
  } else {
    const step = run.metadata?.step as QualifyStep | undefined;
    // "done" is set just before the run completes, so it still reads as scoring.
    state = { kind: "running", step: step === "done" ? "qualifying" : (step ?? "queued") };
  }

  return <Report state={state} />;
}
