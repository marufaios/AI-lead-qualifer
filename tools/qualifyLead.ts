import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { loadRubric } from "./loadRubric";
import { QualificationResult, type LeadInput, type ScrapedSite } from "./schemas";

const DEFAULT_MODEL = "claude-opus-5-5";

/** Scores and qualifies a lead with Claude, using the rubric in workflows/qualify_lead.md. */
export async function qualifyLead(
  lead: LeadInput,
  site: ScrapedSite | null,
): Promise<QualificationResult> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set");

  const client = new Anthropic();
  const rubric = await loadRubric();

  const response = await client.beta.messages.parse({
    model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
    max_tokens: 16000,
    // On a safety-classifier refusal, the API re-runs the request on a recommended fallback model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: {
      effort: "medium",
      format: zodOutputFormat(QualificationResult),
    },
    system: rubric,
    messages: [{ role: "user", content: buildPrompt(lead, site) }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error(`Claude declined to qualify this lead: ${response.stop_details?.explanation ?? "no details"}`);
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error("Claude's response was cut off (max_tokens)");
  }
  // Re-validate: parsed_output is null when parsing fails, and bounds (0–100, 0–1) are enforced here.
  return QualificationResult.parse(response.parsed_output);
}

function buildPrompt(lead: LeadInput, site: ScrapedSite | null): string {
  const fields: [string, string | undefined][] = [
    ["Name", lead.name],
    ["Email", lead.email],
    ["Company", lead.company],
    ["Website", lead.website],
    ["Role", lead.role],
    ["Company size", lead.companySize],
    ["Industry", lead.industry],
    ["Budget", lead.budget],
    ["Timeline", lead.timeline],
    ["Notes", lead.notes],
  ];
  const form = fields.map(([k, v]) => `- ${k}: ${v ?? "(not provided)"}`).join("\n");

  const website = site
    ? `<website_content url="${site.url}"${site.title ? ` title="${site.title}"` : ""}>\n${site.markdown}\n</website_content>`
    : "<website_content>(The website could not be scraped. Qualify from the form data only.)</website_content>";

  return `Qualify this lead.\n\n## Form submission\n${form}\n\n## Company website\n${website}`;
}
