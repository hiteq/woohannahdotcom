import { describe, expect, it } from "vitest";

import {
  normalizeImagePathToUrlPath,
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

  it("encodes nested image paths segment by segment", () => {
    expect(normalizeImagePathToUrlPath("works/가 나/image 1.jpg")).toBe(
      `works/${encodeURIComponent("가 나".normalize("NFC"))}/image%201.jpg`,
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

  it("rewrites bare image embeds without creating note links", () => {
    const md = "![[Cook or Be Cooked.jpg]]";
    const out = normalizeObsidianEmbeds(md);
    expect(out).toBe("![](/Images/Cook%20or%20Be%20Cooked.jpg)");
  });

  it("keeps private image embeds out of published markdown", () => {
    const md = "![[private/Images/Press/file.jpg]]";
    expect(normalizeObsidianEmbeds(md)).toBe("");
  });

  it("removes non-embed attachment wiki links instead of publishing note links", () => {
    const md = "[[file.jpg|Open: file.jpg]]\n![[file.jpg]]";
    expect(normalizeObsidianEmbeds(md)).toBe("\n![](/Images/file.jpg)");
  });

  it("keeps nested image embeds published while dropping adjacent Open attachment links", () => {
    const md = [
      "[[35a4fbf16b1a9f3a3c09c658cf0f6b1d_MD5.jpg|Open: source.jpg]]",
      "![[Images/Bag with you_Cook or Be Cooked/35a4fbf16b1a9f3a3c09c658cf0f6b1d_MD5.jpg]]",
    ].join("\n");

    expect(normalizeObsidianEmbeds(md)).toBe(
      "\n![](/Images/Bag%20with%20you_Cook%20or%20Be%20Cooked/35a4fbf16b1a9f3a3c09c658cf0f6b1d_MD5.jpg)",
    );
  });
});
