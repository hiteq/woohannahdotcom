import { describe, expect, it } from "vitest";

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { isFileUpToDate } from "../scripts/sync-content.mjs";
import { syncContentImages } from "../scripts/sync-content.mjs";

describe("sync-content isFileUpToDate", () => {
  it("returns true when size and mtime match", () => {
    const srcStat = { size: 10, mtimeMs: 1234, isFile: () => true };
    const dstStat = { size: 10, mtimeMs: 1234, isFile: () => true };
    expect(isFileUpToDate(srcStat, dstStat)).toBe(true);
  });

  it("returns false when size matches but mtime differs", () => {
    const srcStat = { size: 10, mtimeMs: 2000, isFile: () => true };
    const dstStat = { size: 10, mtimeMs: 1000, isFile: () => true };
    expect(isFileUpToDate(srcStat, dstStat)).toBe(false);
  });

  it("returns false when dst is missing", () => {
    const srcStat = { size: 10, mtimeMs: 1234, isFile: () => true };
    expect(isFileUpToDate(srcStat, null)).toBe(false);
  });

  it("copies public and private image folders into public Images", async () => {
    const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "woohannahdotcom-sync-"));
    const publicSrc = path.join(tmpRoot, "content", "Images");
    const privateSrc = path.join(tmpRoot, "content", "private", "Images");
    const dst = path.join(tmpRoot, "public", "Images");

    await fs.mkdir(publicSrc, { recursive: true });
    await fs.mkdir(path.join(privateSrc, "Show"), { recursive: true });
    await fs.writeFile(path.join(publicSrc, "public.jpg"), "public", "utf8");
    await fs.writeFile(path.join(privateSrc, "Show", "private.jpg"), "private", "utf8");

    await syncContentImages({ src: publicSrc, privateSrc, dst });

    await expect(fs.readFile(path.join(dst, "public.jpg"), "utf8")).resolves.toBe("public");
    await expect(fs.readFile(path.join(dst, "Show", "private.jpg"), "utf8")).resolves.toBe("private");
  });
});
