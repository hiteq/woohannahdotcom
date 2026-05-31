import { describe, expect, it } from "vitest";

import type { ContentEntry } from "../src/lib/content";
import { linkAboutExhibitions } from "../src/lib/exhibition-links";

function exhibition(title: string, slug: string[], year?: string): ContentEntry {
  return {
    type: "exhibition",
    title,
    slug,
    year,
    bodyHtml: "",
    sourcePath: "",
  };
}

describe("linkAboutExhibitions", () => {
  it("links About CV exhibition names to their exhibition detail pages", () => {
    const html = "<p>2025 - 품새, G Gallery, 서울, 대한민국</p>";
    const out = linkAboutExhibitions(
      html,
      [exhibition("2025, POOMSAE", ["2025-poomsae"], "2025")],
      "/",
    );

    expect(out).toContain('<a href="/exhibitions/2025-poomsae/">품새</a>');
  });

  it("links English aliases and preserves existing anchors", () => {
    const html =
      '<p>2023 - Appearances, G Gallery, Frieze No. 9 Cork Street</p><p><a href="/x/">Summer Love</a></p>';
    const out = linkAboutExhibitions(
      html,
      [
        exhibition("2023, No. 9 Cork Street", ["2023-no-9-cork-street"], "2023"),
        exhibition("2022, Summer Love", ["2022-summer-love"], "2022"),
      ],
      "/woohannahdotcom/",
    );

    expect(out).toContain(
      '<a href="/woohannahdotcom/exhibitions/2023-no-9-cork-street/">Appearances</a>',
    );
    expect(out).toContain('<a href="/x/">Summer Love</a>');
    expect(out).not.toContain('/exhibitions/2022-summer-love/">Summer Love</a></a>');
  });
});
