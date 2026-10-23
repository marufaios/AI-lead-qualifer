"use client";

import { useState, useTransition } from "react";
import { analyzeLead, type AnalyzeResult } from "../actions";
import { COMPANY_SIZES } from "@/tools/schemas";
import { Report } from "./Report";
import { RunResult } from "./RunResult";

type FieldErrors = NonNullable<Extract<AnalyzeResult, { ok: false }>["fieldErrors"]>;
type FieldName = keyof FieldErrors;
type Run = { runId: string; accessToken: string };

const inputClass =
  "mt-1.5 w-full rounded-lg border border-rule bg-paper/50 px-3 py-2.5 text-[0.9375rem] text-ink placeholder:text-ink-soft/60 outline-none transition-colors focus:border-ink focus:bg-sheet aria-[invalid=true]:border-danger";

export function LeadQualifier() {
  const [isPending, startTransition] = useTransition();
  const [run, setRun] = useState<Run | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await analyzeLead(formData);
      if (res.ok) {
        setRun({ runId: res.runId, accessToken: res.accessToken });
        setError(null);
        setFieldErrors({});
      } else {
        setError(res.error);
        setFieldErrors(res.fieldErrors ?? {});
      }
    });
  }

  const errorFor = (name: FieldName) =>
    fieldErrors[name]?.[0] && (
      <span id={`${name}-error`} className="mt-1 block text-sm text-danger">
        {fieldErrors[name][0]}
      </span>
    );

  const field = (
    name: FieldName,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
    hint?: string,
  ) => (
    <label className="block">
      <span className="text-sm font-medium">
        {label}
        {hint && <span className="font-normal text-ink-soft"> {hint}</span>}
      </span>
      <input
        name={name}
        className={inputClass}
        aria-invalid={fieldErrors[name] ? true : undefined}
        aria-describedby={fieldErrors[name] ? `${name}-error` : undefined}
        {...props}
      />
      {errorFor(name)}
    </label>
  );

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-14">
      <form onSubmit={onSubmit} noValidate className="rounded-2xl border border-rule bg-sheet p-5 sm:p-7">
        <Group title="Contact">
          {field("name", "Name", { required: true, autoComplete: "off", placeholder: "Dana Whitfield" })}
          {field("email", "Work email", { required: true, type: "email", placeholder: "dana@northwind.io" })}
          {field("role", "Role", { required: true, placeholder: "Head of Revenue Operations" })}
        </Group>

        <Group title="Company">
          {field("company", "Company", { required: true, placeholder: "Northwind Logistics" })}
          {field("website", "Website", { required: true, inputMode: "url", placeholder: "northwind.io" })}
          {field("industry", "Industry", { required: true, placeholder: "Freight and logistics" })}
          <fieldset aria-describedby={fieldErrors.companySize ? "companySize-error" : undefined}>
            <legend className="text-sm font-medium">Employees</legend>
            <div className="mt-1.5 grid grid-cols-5 overflow-hidden rounded-lg border border-rule">
              {COMPANY_SIZES.map((size, i) => (
                <label key={size} className={`relative ${i > 0 ? "border-l border-rule" : ""}`}>
                  <input type="radio" name="companySize" value={size} required className="peer sr-only" />
                  <span className="block cursor-pointer py-2.5 text-center text-sm tabular-nums text-ink-soft transition-colors hover:text-ink peer-checked:bg-ink peer-checked:font-medium peer-checked:text-sheet peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-2 peer-focus-visible:outline-cold">
                    {size}
                  </span>
                </label>
              ))}
            </div>
            {errorFor("companySize")}
          </fieldset>
        </Group>

        <Group title="Deal" last>
          <div className="grid gap-4 sm:grid-cols-2">
            {field("budget", "Budget", { placeholder: "$40k a year" }, "(optional)")}
            {field("timeline", "Timeline", { placeholder: "This quarter" }, "(optional)")}
          </div>
          <label className="block">
            <span className="text-sm font-medium">
              Notes <span className="font-normal text-ink-soft">(optional)</span>
            </span>
            <textarea
              name="notes"
              rows={4}
              className={`${inputClass} resize-y`}
              placeholder="What problem are they trying to solve? Anything they said on the call."
            />
          </label>
        </Group>

        {error && (
          <p role="alert" className="mt-5 text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="mt-6 w-full rounded-lg bg-ink px-4 py-3.5 font-display text-xl font-semibold tracking-wide text-sheet transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
        >
          {isPending ? "Starting analysis…" : "Analyze"}
        </button>
      </form>

      <section aria-label="Qualification result" className="lg:sticky lg:top-10">
        {run ? <RunResult key={run.runId} runId={run.runId} accessToken={run.accessToken} /> : <Report state={{ kind: "idle" }} />}
      </section>
    </div>
  );
}

function Group({ title, last, children }: { title: string; last?: boolean; children: React.ReactNode }) {
  return (
    <fieldset className={last ? "" : "mb-7 border-b border-rule pb-7"}>
      <legend className="mb-4 font-display text-2xl font-semibold">{title}</legend>
      <div className="space-y-4">{children}</div>
    </fieldset>
  );
}
