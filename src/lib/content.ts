import fs from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import matter from "gray-matter";
import { marked } from "marked";
import {
  normalizeImagePathToUrlPath,
  normalizeObsidianEmbeds,
  slugifyPathSegment,
} from "./obsidian";

/**
 * 이미지 바로 다음에 오는 이탤릭(em) 텍스트를 캡션으로 인식하여
 * <figure> + <figcaption>으로 변환
 */
function wrapImageCaptions(html: string): string {
  // 패턴: <p><img ...></p>\n<p><em>...</em>...</p>
  // 이미지 p 다음 줄바꿈 후 em으로 시작하는 p가 캡션
  const pattern = /<p>(<img\s+[^>]*>)<\/p>\n<p>(<em>[\s\S]*?<\/em>[\s\S]*?)<\/p>/g;

  return html.replace(pattern, (_match, imgTag: string, captionContent: string) => {
    // 캡션에서 첫 번째 em 내용만 추출 (중복 캡션 제거)
    const captionMatch = captionContent.match(/<em>([\s\S]*?)<\/em>/);
    if (!captionMatch) {
      return `<figure class="image-figure">${imgTag}</figure>`;
    }

    const caption = captionMatch[1].trim();
    return `<figure class="image-figure">${imgTag}<figcaption>${caption}</figcaption></figure>`;
  });
}

export type EntryType = "work" | "exhibition" | "thought" | "page";

export type ContentEntry = {
  type: EntryType;
  title: string;
  slug: string[]; // url segments
  date?: string;
  description?: string;
  category?: string;
  year?: string;
  medium?: string;
  dimensions?: string;
  bodyHtml: string;
  englishHtml?: string;
  sourcePath: string;
  thumbnail?: string; // first image URL for cards
  pinned?: boolean;
  series?: string;
};

const REPO_ROOT = process.cwd();
const CONTENT_ROOT = path.join(REPO_ROOT, "content");
// Custom domain: no base path needed
const SITE_BASE = "/";

/** Extract the first image from Obsidian-style markdown (![[Images/...]]) */
function extractFirstImage(
  mdContent: string,
  siteBase: string,
): string | undefined {
  // Match ![[Images/...]] pattern, capturing only the filename (before | if present)
  const obsidianMatch = mdContent.match(/!\[\[Images\/([^\]|]+)/);
  if (obsidianMatch) {
    const imagePath = obsidianMatch[1];
    const encodedImagePath = normalizeImagePathToUrlPath(imagePath);
    return `${siteBase}Images/${encodedImagePath}`;
  }

  const bareObsidianImageMatch = mdContent.match(
    /!\[\[((?!private\/Images\/)(?:[^\]|]+\.(?:avif|gif|jpe?g|png|svg|webp)))/i,
  );
  if (bareObsidianImageMatch) {
    const imagePath = bareObsidianImageMatch[1].replace(/^Images\//i, "");
    const encodedImagePath = normalizeImagePathToUrlPath(imagePath);
    return `${siteBase}Images/${encodedImagePath}`;
  }
  // Also try standard markdown image syntax
  const mdMatch = mdContent.match(/!\[.*?\]\(([^)]+)\)/);
  if (mdMatch) {
    const src = mdMatch[1];
    if (src.startsWith("http")) return src;
    const privateImage = src.match(/^(?:\.?\/)?private\/Images\/(.+)$/i);
    if (privateImage) {
      return `${siteBase}Images/${normalizeImagePathToUrlPath(privateImage[1])}`;
    }
    const publicImage = src.match(/^\/?Images\/(.+)$/i);
    if (publicImage) {
      return `${siteBase}Images/${normalizeImagePathToUrlPath(publicImage[1])}`;
    }
    // If src is absolute (/Images/...), respect the configured base.
    return `${siteBase}${src.replace(/^\//, "")}`;
  }
  return undefined;
}

let allContentCache: Promise<ContentEntry[]> | null = null;

export function clearContentCache(): void {
  allContentCache = null;
}

function toSlugSegmentsFromFsPath(relFromContent: string): string[] {
  const noExt = relFromContent.replace(/\.md$/i, "");
  return noExt.split(path.sep).map(slugifyPathSegment).filter(Boolean);
}

function normalizeFrontmatterDate(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) {
    const trimmed = value.trim();
    if (/^invalid date$/i.test(trimmed)) return undefined;

    const dottedDate = trimmed.match(/^(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.?$/);
    if (dottedDate) {
      const [, year, month, day] = dottedDate;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    return trimmed;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  return undefined;
}

function frontmatterDateFrom(data: Record<string, unknown>): string | undefined {
  return (
    normalizeFrontmatterDate(data.date) ??
    normalizeFrontmatterDate(data["날짜"]) ??
    normalizeFrontmatterDate(data.Date) ??
    normalizeFrontmatterDate(data["생성일"]) ??
    normalizeFrontmatterDate(data["생성 일시"])
  );
}

function frontmatterYearFrom(data: Record<string, unknown>): string | undefined {
  const rawYear = data.year ?? data.Year;
  if (typeof rawYear === "number" && Number.isFinite(rawYear)) {
    return String(rawYear);
  }

  if (typeof rawYear === "string") {
    const match = rawYear.match(/\b(\d{4})\b/);
    if (match) return match[1];
  }

  return undefined;
}

function inferYearFromText(text: string): string | undefined {
  return text.match(/\b(19|20)\d{2}\b/)?.[0];
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function normalizeCategoryLabel(value: string): string | undefined {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;

  if (["solo", "personal", "개인전"].includes(normalized)) return "Solo";
  if (["duo", "two-person", "two person", "2-person", "2 person", "2인전", "duet"].includes(normalized)) {
    return "Duo";
  }
  if (["group", "group show", "단체전"].includes(normalized)) return "Group";
  return value.trim();
}

function frontmatterCategoryFrom(data: Record<string, unknown>): string | undefined {
  const explicit = typeof data.category === "string" ? normalizeCategoryLabel(data.category) : undefined;
  if (explicit) return explicit;

  const tags = [...asStringArray(data.tags), ...asStringArray(data["태그"])];
  for (const tag of tags) {
    const category = normalizeCategoryLabel(tag);
    if (category === "Solo" || category === "Duo" || category === "Group") return category;
  }

  return undefined;
}

function entryTypeFrom(relFromContent: string, fmType: unknown): EntryType {
  if (typeof fmType === "string") {
    const t = fmType.toLowerCase();
    if (t === "work") return "work";
    if (t === "exhibition") return "exhibition";
    if (t === "thought") return "thought";
    if (t === "page") return "page";
  }

  const top = relFromContent.split(path.sep)[0]?.toLowerCase();
  if (top === "works") return "work";
  if (top === "exhibitions") return "exhibition";
  if (top === "thoughts") return "thought";
  return "page";
}

async function loadAllContentUncached(): Promise<ContentEntry[]> {
  const files = await fg(["**/*.md"], {
    cwd: CONTENT_ROOT,
    dot: false,
    ignore: [
      "**/.obsidian/**",
      "**/private/**",
      "**/*.backup",
      "**/_index.md",
      "index.md",
      "index_new.md",
    ],
  });

  const entries: ContentEntry[] = [];
  for (const rel of files) {
    const abs = path.join(CONTENT_ROOT, rel);
    const raw = await fs.readFile(abs, "utf8");
    const parsed = matter(raw);
    const data = parsed.data as Record<string, unknown>;

    const title =
      typeof data.title === "string" ? data.title : path.basename(rel, ".md");
    const type = entryTypeFrom(rel, data.type);

    let slug: string[];

    if (typeof data.slug === "string" && data.slug.trim()) {
      slug = data.slug.split("/").filter(Boolean);
    } else {
      const slugAll = toSlugSegmentsFromFsPath(rel);
      const top = slugAll[0] ?? "";
      slug =
        top === "works" || top === "exhibitions" || top === "thoughts"
          ? slugAll.slice(1)
          : slugAll;
    }

    const md = normalizeObsidianEmbeds(parsed.content, SITE_BASE);
    const rawHtml = marked.parse(md) as string;
    let bodyHtml = wrapImageCaptions(rawHtml);
    const thumbnail = extractFirstImage(parsed.content, SITE_BASE);

    // About 페이지 등에서 <details><summary>ENG</summary>... 패턴이 있으면 영문 콘텐츠로 분리
    let englishHtml: string | undefined;
    const detailsRegex = /<details[^>]*>\s*<summary[^>]*>\s*ENG\s*<\/summary>(.*?)<\/details>/s;
    const match = bodyHtml.match(detailsRegex);

    if (match) {
      englishHtml = match[1].trim();
      bodyHtml = bodyHtml.replace(match[0], "").trim();
    }

    entries.push({
      type,
      title,
      slug,
      category: frontmatterCategoryFrom(data),
      year: frontmatterYearFrom(data) ?? inferYearFromText(title) ?? inferYearFromText(rel),
      medium: typeof data.medium === "string" ? data.medium : undefined,
      dimensions: typeof data.dimensions === "string" ? data.dimensions : undefined,
      bodyHtml,
      englishHtml,
      sourcePath: abs,
      thumbnail,
      date: frontmatterDateFrom(data),
      description: typeof data.description === "string" ? data.description : undefined,
      series: typeof data.series === "string" ? data.series : undefined,
      pinned: data.pinned === true || data.pinned === "true",
    });
  }

  return entries;
}

export function loadAllContent(): Promise<ContentEntry[]> {
  if (!allContentCache) allContentCache = loadAllContentUncached();
  return allContentCache;
}

export function sortByDateDesc<T extends { date?: string; year?: string; title?: string; pinned?: boolean }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    const dateCompare = (b.date ?? b.year ?? "").localeCompare(a.date ?? a.year ?? "");
    if (dateCompare !== 0) return dateCompare;
    return (a.title ?? "").localeCompare(b.title ?? "");
  });
}

export function groupWorksBySeries(works: ContentEntry[]): any[] {
  const grouped: any[] = [];
  const seriesSeen = new Set<string>();

  for (const w of works) {
    if (w.series) {
      if (!seriesSeen.has(w.series)) {
        seriesSeen.add(w.series);
        const seriesSlug = w.series.toLowerCase().replace(/\s+/g, '-');
        grouped.push({
          ...w,
          title: w.series,
          category: "Series",
          isSeries: true,
          seriesSlug,
        });
      }
    } else {
      grouped.push(w);
    }
  }
  return grouped;
}
