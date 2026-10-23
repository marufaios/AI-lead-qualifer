import { z } from "zod";

export const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-1000", "1000+"] as const;

const optionalText = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .transform((v) => (v ? v : undefined));

export const LeadInput = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.email("Enter a valid email"),
  company: z.string().trim().min(1, "Company is required"),
  website: z
    .string()
    .trim()
    .min(1, "Website is required")
    .transform((v) => (/^https?:\/\//i.test(v) ? v : `https://${v}`))
    .pipe(z.url("Enter a valid website")),
  role: z.string().trim().min(1, "Role is required"),
  companySize: z.enum(COMPANY_SIZES, "Pick a company size"),
  industry: z.string().trim().min(1, "Industry is required"),
  budget: optionalText,
  timeline: optionalText,
  notes: optionalText,
});
export type LeadInput = z.infer<typeof LeadInput>;

export const LeadTier = z.enum(["hot", "warm", "cold", "disqualified"]);
export type LeadTier = z.infer<typeof LeadTier>;

export const QualificationResult = z.object({
  score: z.number().int().min(0).max(100),
  tier: LeadTier,
  summary: z.string(),
  fitReasons: z.array(z.string()),
  concerns: z.array(z.string()),
  recommendedNextStep: z.string(),
  enrichment: z.string(),
  confidence: z.number().min(0).max(1),
});
export type QualificationResult = z.infer<typeof QualificationResult>;

export type ScrapedSite = {
  url: string;
  title?: string;
  markdown: string;
};

export type QualifyLeadOutput = {
  result: QualificationResult;
  websiteScraped: boolean;
};

/** Values of `metadata.step` set by the qualify-lead task. */
export type QualifyStep = "enriching" | "qualifying" | "done";
