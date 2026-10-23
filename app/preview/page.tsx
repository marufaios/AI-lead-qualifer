import { notFound } from "next/navigation";
import { Report, type ReportState } from "../_components/Report";

/** Dev-only gallery of every result state, with sample data, for design review. */
const STATES: { name: string; state: ReportState }[] = [
  { name: "Idle", state: { kind: "idle" } },
  { name: "Reading website", state: { kind: "running", step: "enriching" } },
  {
    name: "Hot",
    state: {
      kind: "done",
      output: {
        websiteScraped: true,
        result: {
          score: 84,
          tier: "hot",
          summary:
            "Northwind is a 120-person freight broker whose RevOps lead has a funded budget and a Q4 deadline. Their manual lead routing is exactly the problem we solve.",
          fitReasons: [
            "Head of Revenue Operations owns the tooling budget",
            "$40k a year budget is in our typical deal range",
            "Wants to go live this quarter",
            "Website shows a 30-person sales team handling inbound quotes",
          ],
          concerns: ["Already uses a legacy CRM plugin they may need to migrate off"],
          recommendedNextStep:
            "Book a 30-minute discovery call with Dana this week and bring a routing teardown of their quote form.",
          enrichment:
            "Northwind Logistics is a mid-market freight brokerage offering LTL and full-truckload shipping across North America, with an online quote form for shippers.",
          confidence: 0.86,
        },
      },
    },
  },
  {
    name: "Cold, website not read",
    state: {
      kind: "done",
      output: {
        websiteScraped: false,
        result: {
          score: 38,
          tier: "cold",
          summary: "A solo consultant exploring options with no budget or timeline. Worth nurturing, not a call.",
          fitReasons: ["Clear interest in automating lead intake"],
          concerns: ["No budget stated", "Just exploring, no timeline", "Personal email domain"],
          recommendedNextStep: "Add to the monthly nurture sequence and send the lead-routing guide.",
          enrichment: "No website content was available, so this is based on the form only.",
          confidence: 0.42,
        },
      },
    },
  },
  {
    name: "Failed",
    state: {
      kind: "failed",
      message:
        "The run ended with status failed. Open run run_abc123 in the Trigger.dev dashboard to see the error.",
    },
  },
];

export default function Preview() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="mx-auto max-w-3xl space-y-16 px-4 py-12 sm:px-8">
      {STATES.map(({ name, state }) => (
        <section key={name}>
          <p className="mb-4 text-sm text-ink-soft">{name}</p>
          <div className="rounded-2xl border border-dashed border-rule p-6">
            <Report state={state} />
          </div>
        </section>
      ))}
    </main>
  );
}
