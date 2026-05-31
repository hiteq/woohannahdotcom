import type { ContentEntry } from "./content";

type LinkTarget = {
  href: string;
  terms: string[];
};

const EXTRA_EXHIBITION_ALIASES: Record<string, string[]> = {
  "2025-poomsae": ["Poomsae", "품새"],
  "2023-no-9-cork-street": ["Appearances", "Frieze No. 9 Cork Street", "Frieze No.9 Cork Street"],
  "2023-tumbleweeds": ["마른 풀 소용돌이", "마른 풀 소용돌이:Tumbleweeds"],
  "2023-woo-hannah-connection": ["Connection: Woo Hannah Open Studio"],
  "2020-woo-hannah-ma-moitié": ["Ma Moitié", "마 모아티에"],
  "2022-feather": ["우한나 x 정수정"],
  "2025-bodys-first-architecture": ["Body's First Architecture"],
  "2024-the-1st-seoul-sculpture-prize-the-strange-encounter": [
    "The 1st Seoul Sculpture Prize ‘The Strange Encounter’",
    "제 1회 서울조각상 ‘경계없이 낯설게’",
    "경계없이 낯설게",
  ],
  "2024-at-the-end-of-the-world-split-endlessly": ["끝없이 갈라지는 세계의 끝에서"],
  "2022-sculptural-impulse": ["조각충동"],
  "2020-art-plant-asia-hare-way-object": ["Hare Way Object", "토끼 방향 오브젝트"],
  "2019-seoul-focus": ["Nothing Twice", "두 번의 똑같은 밤은 없다"],
  "2026-off-the-whitefold-and-watchtower": [
    "Off the White: Fold and Watchtower",
    "Off the White：Fold and Watchtower",
    "오프 더 화이트: 주름과 망루",
    "우한나 x 김동희",
  ],
  "2026-stay-with-meneither-here-nor-there": [
    "Stay with Me: Neither Here nor There",
    "Stay with Me：Neither Here nor There",
    "Stay With Me：Neither Here nor There",
  ],
};

function getDisplayTitle(title: string): string {
  return title.replace(/^\d{4},\s*/, "");
}

function getSlugKey(entry: ContentEntry): string {
  return entry.slug.join("/");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function uniqueTerms(terms: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const term of terms) {
    const normalized = term.trim().normalize("NFC");
    const key = normalized.toLocaleLowerCase();
    if (!normalized || seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }

  return result.sort((a, b) => b.length - a.length);
}

function buildLinkTargets(exhibitions: ContentEntry[], base = "/"): LinkTarget[] {
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;

  return exhibitions.map((entry) => {
    const slugKey = getSlugKey(entry);
    const displayTitle = getDisplayTitle(entry.title);
    const terms = uniqueTerms([
      entry.title,
      displayTitle,
      ...(entry.year ? [`${entry.year} - ${displayTitle}`, `${entry.year}, ${displayTitle}`] : []),
      ...(EXTRA_EXHIBITION_ALIASES[slugKey] ?? []),
    ]);

    return {
      href: `${normalizedBase}exhibitions/${slugKey}/`,
      terms,
    };
  });
}

function linkTextSegment(text: string, targets: LinkTarget[]): string {
  const lookup = new Map<string, string>();
  const patterns: string[] = [];

  for (const target of targets) {
    for (const term of target.terms) {
      const key = term.toLocaleLowerCase();
      if (lookup.has(key)) continue;
      lookup.set(key, target.href);
      patterns.push(escapeRegExp(term));
    }
  }

  if (patterns.length === 0) return text;

  const matcher = new RegExp(patterns.join("|"), "giu");
  return text.replace(matcher, (match) => {
    const href = lookup.get(match.normalize("NFC").toLocaleLowerCase());
    if (!href) return match;
    return `<a href="${href}">${match}</a>`;
  });
}

export function linkAboutExhibitions(
  html: string,
  exhibitions: ContentEntry[],
  base = "/",
): string {
  const targets = buildLinkTargets(exhibitions, base).filter((target) => target.terms.length > 0);
  if (targets.length === 0) return html;

  const tokens = html.split(/(<[^>]+>)/g);
  let anchorDepth = 0;

  return tokens
    .map((token) => {
      if (!token) return token;

      if (token.startsWith("<")) {
        if (/^<a\b/i.test(token)) anchorDepth += 1;
        if (/^<\/a>/i.test(token)) anchorDepth = Math.max(0, anchorDepth - 1);
        return token;
      }

      if (anchorDepth > 0) return token;
      return linkTextSegment(token, targets);
    })
    .join("");
}
