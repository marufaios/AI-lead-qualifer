import { readFile } from "node:fs/promises";
import path from "node:path";

const WORKFLOW_PATH = path.join(process.cwd(), "workflows", "qualify_lead.md");
const START = "<!-- RUBRIC:START -->";
const END = "<!-- RUBRIC:END -->";

/** Reads the scoring rubric section from workflows/qualify_lead.md. */
export async function loadRubric(): Promise<string> {
  const doc = await readFile(WORKFLOW_PATH, "utf8");
  const start = doc.indexOf(START);
  const end = doc.indexOf(END);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`Rubric markers not found in ${WORKFLOW_PATH}`);
  }
  return doc.slice(start + START.length, end).trim();
}
