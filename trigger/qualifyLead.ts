import { metadata, schemaTask } from "@trigger.dev/sdk";
import { qualifyLead } from "../tools/qualifyLead";
import { LeadInput, type QualifyLeadOutput, type QualifyStep } from "../tools/schemas";
import { scrapeWebsite } from "../tools/scrapeWebsite";

const setStep = (step: QualifyStep) => metadata.set("step", step);

/** Runs workflows/qualify_lead.md: enrich via website scrape, then qualify with Claude. */
export const qualifyLeadTask = schemaTask({
  id: "qualify-lead",
  schema: LeadInput,
  maxDuration: 300,
  run: async (lead): Promise<QualifyLeadOutput> => {
    setStep("enriching");
    const site = await scrapeWebsite(lead.website);

    setStep("qualifying");
    const result = await qualifyLead(lead, site);

    setStep("done");
    return { result, websiteScraped: site !== null };
  },
});
