import { describe, expect, it } from "vitest";

import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";

describe("analytics layout", () => {
  it("loads GA4 only when PUBLIC_GA_MEASUREMENT_ID is configured", async () => {
    const layout = await fs.readFile("src/layouts/BaseLayout.astro", "utf8");

    expect(layout).toContain("PUBLIC_GA_MEASUREMENT_ID");
    expect(layout).toContain("https://www.googletagmanager.com/gtag/js?id=");
    expect(layout).toContain("window.dataLayer");
    expect(layout).toContain("window.gtag");
  });

  it("renders executable GA4 script in built HTML", async () => {
    execFileSync("npm", ["run", "build"], {
      env: {
        ...process.env,
        PUBLIC_GA_MEASUREMENT_ID: "G-TEST123456",
      },
      stdio: "pipe",
    });

    const html = await fs.readFile("dist/index.html", "utf8");

    expect(html).toContain("https://www.googletagmanager.com/gtag/js?id=G-TEST123456");
    expect(html).toContain('window.gtag("config", gaMeasurementId);');
    expect(html).not.toContain("{`window.dataLayer");
  }, 20000);
});
