import fs from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import matter from "gray-matter";
import { marked } from "marked";
import { normalizeObsidianEmbeds, slugifyPathSegment } from "./obsidian";

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
};

const REPO_ROOT = process.cwd();
const CONTENT_ROOT = path.join(REPO_ROOT, "content");
// For GitHub Pages deployment, base path is /woohannahdotcom/
// In development, it should also be /woohannahdotcom/ for consistency
const SITE_BASE = "/woohannahdotcom/";

function normalizeAndEncodeImageFilename(filename: string): string {
  const trimmed = filename.trim();

  let decoded = trimmed;
  if (/%[0-9A-Fa-f]{2}/.test(trimmed)) {
    try {
      decoded = decodeURIComponent(trimmed);
    } catch {
      // ignore
    }
  }

  // NFD -> NFC 정규화 후 인코딩 (서버/파일 매칭 안정화)
  const nfc = decoded.normalize("NFC");
  return encodeURIComponent(nfc);
}

/** Extract the first image from Obsidian-style markdown (![[Images/...]]) */
function extractFirstImage(
  mdContent: string,
  siteBase: string,
): string | undefined {
  // Match ![[Images/...]] pattern, capturing only the filename (before | if present)
  const obsidianMatch = mdContent.match(/!\[\[Images\/([^\]|]+)/);
  if (obsidianMatch) {
    const filename = obsidianMatch[1];
    const encodedFilename = normalizeAndEncodeImageFilename(filename);
    return `${siteBase}Images/${encodedFilename}`;
  }
  // Also try standard markdown image syntax
  const mdMatch = mdContent.match(/!\[.*?\]\(([^)]+)\)/);
  if (mdMatch) {
    const src = mdMatch[1];
    if (src.startsWith("http")) return src;
    // If src is absolute (/Images/...), respect the configured base.
    return `${siteBase}${src.replace(/^\//, "")}`;
  }
  return undefined;
}

function toSlugSegmentsFromFsPath(relFromContent: string): string[] {
  const noExt = relFromContent.replace(/\.md$/i, "");
  return noExt.split(path.sep).map(slugifyPathSegment).filter(Boolean);
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

export async function loadAllContent(): Promise<ContentEntry[]> {
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
      date: typeof data.date === "string" ? data.date : undefined,
      description:
        typeof data.description === "string" ? data.description : undefined,
      category: typeof data.category === "string" ? data.category : undefined,
      year: typeof data.year === "string" ? data.year : undefined,
      medium: typeof data.medium === "string" ? data.medium : undefined,
      dimensions:
        typeof data.dimensions === "string" ? data.dimensions : undefined,
      bodyHtml,
      englishHtml,
      sourcePath: abs,
      thumbnail,
    });
  }

  return entries;
}

export function sortByDateDesc<T extends { date?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}
