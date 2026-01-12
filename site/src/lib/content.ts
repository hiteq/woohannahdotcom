import fs from "node:fs/promises"
import path from "node:path"
import fg from "fast-glob"
import matter from "gray-matter"
import { marked } from "marked"
import { normalizeObsidianEmbeds, slugifyPathSegment } from "./obsidian"

// We'll decode URLs after marked.parse() since marked's renderer API is complex

export type EntryType = "work" | "exhibition" | "thought" | "page"

export type ContentEntry = {
  type: EntryType
  title: string
  slug: string[] // url segments
  date?: string
  description?: string
  category?: string
  year?: string
  medium?: string
  dimensions?: string
  bodyHtml: string
  sourcePath: string
  thumbnail?: string // first image URL for cards
}

const REPO_ROOT = path.resolve(process.cwd(), "..")
const CONTENT_ROOT = path.join(REPO_ROOT, "content")
// For GitHub Pages deployment, base path is /woohannahdotcom/
// In development, it should also be /woohannahdotcom/ for consistency
const SITE_BASE = "/woohannahdotcom/"

/** Extract the first image from Obsidian-style markdown (![[Images/...]]) */
function extractFirstImage(mdContent: string, siteBase: string): string | undefined {
  // Match ![[Images/...]] pattern, capturing only the filename (before | if present)
  const obsidianMatch = mdContent.match(/!\[\[Images\/([^\]|]+)/)
  if (obsidianMatch) {
    const filename = obsidianMatch[1]
    // Don't encode Korean filenames - let browser/server handle them naturally
    return `${siteBase}Images/${filename}`
  }
  // Also try standard markdown image syntax
  const mdMatch = mdContent.match(/!\[.*?\]\(([^)]+)\)/)
  if (mdMatch) {
    const src = mdMatch[1]
    if (src.startsWith("http")) return src
    // If src is absolute (/Images/...), respect the configured base.
    return `${siteBase}${src.replace(/^\//, "")}`
  }
  return undefined
}

function toSlugSegmentsFromFsPath(relFromContent: string): string[] {
  const noExt = relFromContent.replace(/\.md$/i, "")
  return noExt.split(path.sep).map(slugifyPathSegment).filter(Boolean)
}

function entryTypeFrom(relFromContent: string, fmType: unknown): EntryType {
  if (typeof fmType === "string") {
    const t = fmType.toLowerCase()
    if (t === "work") return "work"
    if (t === "exhibition") return "exhibition"
    if (t === "thought") return "thought"
    if (t === "page") return "page"
  }

  const top = relFromContent.split(path.sep)[0]?.toLowerCase()
  if (top === "works") return "work"
  if (top === "exhibitions") return "exhibition"
  if (top === "thoughts") return "thought"
  return "page"
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
  })

  const entries: ContentEntry[] = []
  for (const rel of files) {
    const abs = path.join(CONTENT_ROOT, rel)
    const raw = await fs.readFile(abs, "utf8")
    const parsed = matter(raw)
    const data = parsed.data as Record<string, unknown>

    const title = typeof data.title === "string" ? data.title : path.basename(rel, ".md")
    const type = entryTypeFrom(rel, data.type)
    const slugAll = toSlugSegmentsFromFsPath(rel)
    const top = slugAll[0] ?? ""
    const slug =
      top === "works" || top === "exhibitions" || top === "thoughts" ? slugAll.slice(1) : slugAll

    const md = normalizeObsidianEmbeds(parsed.content, SITE_BASE)
    // Configure marked to not encode URLs
    marked.setOptions({
      breaks: false,
      gfm: true,
    })
    let bodyHtml = marked.parse(md) as string
    
    // Fix: Decode URL-encoded Korean filenames in image src attributes
    // marked automatically encodes URLs, so we need to decode them back
    // Match all src="..." patterns containing Images/ paths
    bodyHtml = bodyHtml.replace(
      /src="([^"]*Images\/[^"]+)"/g,
      (match, url) => {
        try {
          // Decode URL-encoded Korean characters
          const decoded = decodeURIComponent(url)
          return `src="${decoded}"`
        } catch (e) {
          return match
        }
      }
    )
    
    const thumbnail = extractFirstImage(parsed.content, SITE_BASE)

    entries.push({
      type,
      title,
      slug,
      date: typeof data.date === "string" ? data.date : undefined,
      description: typeof data.description === "string" ? data.description : undefined,
      category: typeof data.category === "string" ? data.category : undefined,
      year: typeof data.year === "string" ? data.year : undefined,
      medium: typeof data.medium === "string" ? data.medium : undefined,
      dimensions: typeof data.dimensions === "string" ? data.dimensions : undefined,
      bodyHtml,
      sourcePath: abs,
      thumbnail,
    })
  }

  return entries
}

export function sortByDateDesc<T extends { date?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
}

