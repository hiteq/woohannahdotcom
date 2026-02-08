import { describe, expect, it } from "vitest";

import {
  normalizeImageFilenameToUrlSegment,
  normalizeObsidianEmbeds,
} from "../src/lib/obsidian";

describe("obsidian image filename normalization", () => {
  it("encodes and NFC-normalizes filenames", () => {
    const input = "가 나.png";
    expect(normalizeImageFilenameToUrlSegment(input)).toBe(
      encodeURIComponent(input.normalize("NFC")),
    );
  });
});

describe("normalizeObsidianEmbeds", () => {
  it("rewrites Obsidian image embeds to base-aware encoded URLs", () => {
    const md = "![[Images/가 나.png|Alt]]";
    const out = normalizeObsidianEmbeds(md, "/woohannahdotcom/");
    expect(out).toBe(
      `![Alt](/woohannahdotcom/Images/${encodeURIComponent("가 나.png".normalize("NFC"))})`,
    );
  });
});
