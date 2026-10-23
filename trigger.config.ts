import { defineConfig } from "@trigger.dev/sdk";
import { additionalFiles } from "@trigger.dev/build/extensions/core";

export default defineConfig({
  // Replace with your project ref from the Trigger.dev dashboard (Project settings).
  project: "proj_nipzwmfzxorlnifrlqce",
  dirs: ["./trigger"],
  maxDuration: 300,
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  build: {
    // The scoring rubric is read from the workflow at runtime, so ship it with the deploy.
    extensions: [additionalFiles({ files: ["./workflows/qualify_lead.md"] })],
  },
});
