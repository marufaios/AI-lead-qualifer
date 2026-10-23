import { LeadQualifier } from "./_components/LeadQualifier";

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-8 sm:pt-16">
      <header className="mb-10 max-w-2xl">
        <h1 className="font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-7xl">
          Is this lead worth a call?
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
          Enter what you know about the lead. We read their website, score the fit against your rubric, and tell you
          what to do next.
        </p>
      </header>
      <LeadQualifier />
    </main>
  );
}
