import { afterEach, describe, expect, it, vi } from "vitest";

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const originalCwd = process.cwd();

afterEach(() => {
  process.chdir(originalCwd);
});

describe("content date parsing", () => {
  it("normalizes YAML dates and sorts thoughts by newest first", async () => {
    const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "woohannahdotcom-dates-"));
    const thoughtsRoot = path.join(tmpRoot, "content", "Thoughts");
    await fs.mkdir(thoughtsRoot, { recursive: true });

    await fs.writeFile(
      path.join(thoughtsRoot, "Newest.md"),
      "---\nDate: 2025-10-17\ntitle: Newest\ntype: thought\n---\nNewest body\n",
      "utf8",
    );
    await fs.writeFile(
      path.join(thoughtsRoot, "Older.md"),
      "---\ndate: 2023-01-09\ntitle: Older\ntype: thought\n---\nOlder body\n",
      "utf8",
    );

    process.chdir(tmpRoot);
    vi.resetModules();

    const mod = await import("../src/lib/content");
    mod.clearContentCache();

    const entries = await mod.loadAllContent();
    const thoughts = mod.sortByDateDesc(entries.filter((entry) => entry.type === "thought"));

    expect(thoughts.map((entry) => entry.title)).toEqual(["Newest", "Older"]);
    expect(thoughts.map((entry) => entry.date)).toEqual(["2025-10-17", "2023-01-09"]);
  });

  it("uses Korean Obsidian creation date metadata for sorting thoughts", async () => {
    const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "woohannahdotcom-korean-dates-"));
    const thoughtsRoot = path.join(tmpRoot, "content", "Thoughts");
    await fs.mkdir(thoughtsRoot, { recursive: true });

    await fs.writeFile(
      path.join(thoughtsRoot, "Newest.md"),
      "---\n생성일: 2025. 10. 17\ntitle: Newest\ntype: thought\n---\nNewest body\n",
      "utf8",
    );
    await fs.writeFile(
      path.join(thoughtsRoot, "Older.md"),
      "---\nDate: 2025-08-12\ntitle: Older\ntype: thought\n---\nOlder body\n",
      "utf8",
    );

    process.chdir(tmpRoot);
    vi.resetModules();

    const mod = await import("../src/lib/content");
    mod.clearContentCache();

    const entries = await mod.loadAllContent();
    const thoughts = mod.sortByDateDesc(entries.filter((entry) => entry.type === "thought"));

    expect(thoughts.map((entry) => entry.title)).toEqual(["Newest", "Older"]);
    expect(thoughts.map((entry) => entry.date)).toEqual(["2025-10-17", "2025-08-12"]);
  });
});
