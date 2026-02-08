import { describe, expect, it } from "vitest";

import { isFileUpToDate } from "../scripts/sync-content.mjs";

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
});
