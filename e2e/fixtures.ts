import { test as base, expect } from "@playwright/test";

import { QAData } from "./qa-data";
export { expect };
export const test = base.extend<{ diagnostics: void; qa: QAData }>({
  qa: async ({ request }, use, info) => {
    const qa = new QAData(request, info);
    await qa.init();
    try { await use(qa); } finally { await qa.cleanup(); }
  },
  diagnostics: [async ({ page }, use, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(`JS: ${error.message}`));
    page.on("requestfailed", request => {
      if (request.failure()?.errorText !== "net::ERR_ABORTED") {
        errors.push(`NETWORK: ${request.method()} ${new URL(request.url()).origin}${new URL(request.url()).pathname}: ${request.failure()?.errorText}`);
      }
    });
    page.on("response", response => {
      if (response.status() >= 500) errors.push(`HTTP ${response.status()}: ${new URL(response.url()).origin}${new URL(response.url()).pathname}`);
    });
    await use();
    await testInfo.attach("runtime-diagnostics", { body: JSON.stringify(errors, null, 2), contentType: "application/json" });
    expect(errors, "Unhandled JS errors, failed requests, or server errors occurred").toEqual([]);
  }, { auto: true }],
});
