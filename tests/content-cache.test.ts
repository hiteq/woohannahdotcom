import { afterEach, describe, expect, it, vi } from "vitest";

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const originalCwd = process.cwd();

afterEach(() => {
  process.chdir(originalCwd);
});

describe("loadAllContent caching", () => {
  it("returns the same promise for repeated calls", async () => {
    const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "woohannahdotcom-test-"));
    const contentRoot = path.join(tmpRoot, "content");
    await fs.mkdir(contentRoot, { recursive: true });
    await fs.writeFile(
      path.join(contentRoot, "About.md"),
      "---\ntitle: About\nslug: about\ntype: page\n---\nHello\n![[Images/가 나.png]]\n",
      "utf8",
    );

    process.chdir(tmpRoot);
    vi.resetModules();

    const mod = await import("../src/lib/content");
    mod.clearContentCache();

    const p1 = mod.loadAllContent();
    const p2 = mod.loadAllContent();
    expect(p1).toBe(p2);

    const entries = await p1;
    expect(entries).toHaveLength(1);
    expect(entries[0]?.title).toBe("About");
  });
});
