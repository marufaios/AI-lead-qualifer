import type { LeadTier, QualifyLeadOutput, QualifyStep } from "@/tools/schemas";

export type ReportStep = "connecting" | "queued" | Exclude<QualifyStep, "done">;

export type ReportState =
  | { kind: "idle" }
  | { kind: "running"; step: ReportStep }
  | { kind: "failed"; message: string }
  | { kind: "done"; output: QualifyLeadOutput };

/** Score bands from the rubric in workflows/qualify_lead.md, lowest first. */
const BANDS: { tier: LeadTier; label: string; from: number }[] = [
  { tier: "disqualified", label: "Disqualified", from: 0 },
  { tier: "cold", label: "Cold", from: 25 },
  { tier: "warm", label: "Warm", from: 50 },
  { tier: "hot", label: "Hot", from: 75 },
];

const TIER_TEXT: Record<LeadTier, string> = {
  hot: "text-hot",
  warm: "text-warm",
  cold: "text-cold",
  disqualified: "text-dq",
};
const TIER_BG: Record<LeadTier, string> = {
  hot: "bg-hot",
  warm: "bg-warm",
  cold: "bg-cold",
  disqualified: "bg-dq",
};
const TIER_BORDER: Record<LeadTier, string> = {
  hot: "border-hot",
  warm: "border-warm",
  cold: "border-cold",
  disqualified: "border-dq",
};
const TIER_HEADLINE: Record<LeadTier, string> = {
  hot: "Hot lead",
  warm: "Warm lead",
  cold: "Cold lead",
  disqualified: "Disqualified",
};

export function Report({ state }: { state: ReportState }) {
  const done = state.kind === "done" ? state.output : null;

  return (
    <div aria-live="polite">
      {done ? (
        <ScoreHeadline output={done} />
      ) : (
        <h2 className="font-display text-3xl font-semibold text-ink-soft">
          {state.kind === "failed" ? "Analysis stopped" : state.kind === "running" ? "Analyzing…" : "No lead yet"}
        </h2>
      )}

      <ThermalScale score={done?.result.score} tier={done?.result.tier} />

      <div className="mt-8">
        {state.kind === "idle" && (
          <p className="max-w-md leading-relaxed text-ink-soft">
            Fill in the lead and click Analyze. The score lands on this scale, with the reasons behind it
            and a suggested next step.
          </p>
        )}
        {state.kind === "running" && <Steps step={state.step} />}
        {state.kind === "failed" && <p className="max-w-md leading-relaxed text-danger">{state.message}</p>}
        {done && <Details output={done} />}
      </div>
    </div>
  );
}

function ScoreHeadline({ output: { result, websiteScraped } }: { output: QualifyLeadOutput }) {
  return (
    <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
      <span className={`font-display text-[7.5rem] font-extrabold leading-[0.8] tabular-nums ${TIER_TEXT[result.tier]}`}>
        {result.score}
      </span>
      <div className="pb-1">
        <p className="font-display text-3xl font-semibold leading-none">{TIER_HEADLINE[result.tier]}</p>
        <p className="mt-2 text-sm text-ink-soft">
          {Math.round(result.confidence * 100)}% confidence,{" "}
          {websiteScraped ? "website read" : "scored from the form only"}
        </p>
      </div>
    </div>
  );
}

function ThermalScale({ score, tier }: { score?: number; tier?: LeadTier }) {
  const hasScore = score !== undefined;
  return (
    <div className="mt-8" role={hasScore ? "img" : undefined} aria-label={hasScore ? `Score ${score} of 100` : undefined}>
      <div className="relative">
        <div className="flex h-3 gap-[3px] overflow-hidden rounded-full">
          {BANDS.map((b) => (
            <div
              key={b.tier}
              className={`flex-1 transition-opacity duration-700 ${TIER_BG[b.tier]} ${
                !hasScore ? "opacity-25" : b.tier === tier ? "opacity-100" : "opacity-20"
              }`}
            />
          ))}
        </div>
        {hasScore && (
          <div
            className="marker-sweep absolute -top-2 bottom-[-0.5rem] w-[3px] -translate-x-1/2 rounded-full bg-ink"
            style={{ left: `${score}%` }}
          />
        )}
      </div>
      <div className="mt-3 grid grid-cols-4 text-xs">
        {BANDS.map((b) => (
          <div key={b.tier} className={b.tier === tier ? "font-semibold text-ink" : "text-ink-soft"}>
            <span className="tabular-nums">{b.from}</span>
            <span className="ml-1.5 hidden sm:inline">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const STEPS: { key: ReportStep; label: string }[] = [
  { key: "queued", label: "Queued on Trigger.dev" },
  { key: "enriching", label: "Reading the company website" },
  { key: "qualifying", label: "Scoring the lead with Claude" },
];

function Steps({ step }: { step: ReportStep }) {
  const current = step === "connecting" ? 0 : STEPS.findIndex((s) => s.key === step);
  return (
    <ol className="space-y-3">
      {STEPS.map((s, i) => {
        const state = i < current ? "done" : i === current ? "active" : "todo";
        return (
          <li key={s.key} className={`flex items-center gap-3 ${state === "todo" ? "text-ink-soft" : ""}`}>
            <span
              className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
                state === "done"
                  ? "border-ink bg-ink text-sheet"
                  : state === "active"
                    ? "border-cold"
                    : "border-rule"
              }`}
            >
              {state === "done" && (
                <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden>
                  <path d="M2.5 6.5l2.2 2L9.5 3.5" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              )}
              {state === "active" && <span className="h-2 w-2 animate-pulse rounded-full bg-cold" />}
            </span>
            <span className={state === "active" ? "font-medium" : ""}>{s.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function Details({ output: { result, websiteScraped } }: { output: QualifyLeadOutput }) {
  return (
    <div className="report-rise space-y-8">
      <p className="max-w-prose text-lg leading-relaxed">{result.summary}</p>

      <div className={`border-l-4 pl-4 ${TIER_BORDER[result.tier]}`}>
        <h3 className="text-sm font-semibold text-ink-soft">Next step</h3>
        <p className="mt-1 text-lg font-medium leading-snug">{result.recommendedNextStep}</p>
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
        <Reasons title="Why it fits" items={result.fitReasons} marker="+" markerClass="text-ink" />
        <Reasons title="Concerns" items={result.concerns} marker="−" markerClass="text-danger" />
      </div>

      <div className="border-t border-rule pt-6">
        <h3 className="text-sm font-semibold text-ink-soft">About the company</h3>
        <p className="mt-1 max-w-prose leading-relaxed">{result.enrichment}</p>
        {!websiteScraped && (
          <p className="mt-2 text-sm text-ink-soft">
            The website couldn&apos;t be read, so confidence is lower. Check the URL and analyze again.
          </p>
        )}
      </div>
    </div>
  );
}

function Reasons({ title, items, marker, markerClass }: { title: string; items: string[]; marker: string; markerClass: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-ink-soft">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-ink-soft">None noted.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2.5 leading-snug">
              <span className={`w-3 shrink-0 font-semibold ${markerClass}`} aria-hidden>
                {marker}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
