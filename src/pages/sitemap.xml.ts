import { loadAllContent, sortByDateDesc } from "../lib/content"
import { absoluteUrl, entryPath } from "../lib/seo"

const STATIC_PATHS = ["/", "/about/", "/works/", "/exhibitions/", "/thoughts/", "/press/"]

export async function GET() {
  const all = await loadAllContent()
  const entries = sortByDateDesc(all.filter((entry) => entry.type === "work" || entry.type === "exhibition" || entry.type === "thought"))
  const urls = new Map<string, string | undefined>()

  for (const pathname of STATIC_PATHS) urls.set(pathname, undefined)
  for (const entry of entries) urls.set(entryPath(entry), normalizedDate(entry.date))

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Array.from(urls.entries()).map(([pathname, lastmod]) => renderUrl(pathname, lastmod)).join("\n")}
</urlset>
`

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  })
}

function renderUrl(pathname: string, lastmod?: string): string {
  return [
    "  <url>",
    `    <loc>${escapeXml(absoluteUrl(pathname))}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : undefined,
    "  </url>",
  ].filter(Boolean).join("\n")
}

function normalizedDate(date?: string): string | undefined {
  if (!date) return undefined
  const match = date.match(/^\d{4}-\d{2}-\d{2}/)
  return match?.[0]
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}
