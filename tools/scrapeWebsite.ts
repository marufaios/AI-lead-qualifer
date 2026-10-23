import Firecrawl from "@mendable/firecrawl-js";
import type { ScrapedSite } from "./schemas";

/** Enough of a homepage for Claude to understand the business without blowing up the prompt. */
const MAX_CHARS = 20_000;

/**
 * Scrapes a website to markdown via Firecrawl.
 * Returns null when the site can't be scraped, so the lead can still be qualified from form data.
 * Throws only on misconfiguration (missing API key).
 */
export async function scrapeWebsite(url: string): Promise<ScrapedSite | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY is not set");

  const firecrawl = new Firecrawl({ apiKey });
  try {
    const doc = await firecrawl.scrape(url, {
      formats: ["markdown"],
      onlyMainContent: true,
      timeout: 30_000,
    });
    const markdown = doc.markdown?.trim();
    if (!markdown) return null;
    return {
      url,
      title: doc.metadata?.title,
      markdown: markdown.slice(0, MAX_CHARS),
    };
  } catch (error) {
    console.warn(`scrapeWebsite: failed to scrape ${url}:`, error);
    return null;
  }
}
