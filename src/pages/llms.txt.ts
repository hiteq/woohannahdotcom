import { loadAllContent, sortByDateDesc } from "../lib/content"
import { ARTIST_NAME, SITE_DESCRIPTION, absoluteUrl, entryPath, summarizeEntry } from "../lib/seo"

export async function GET() {
  const all = await loadAllContent()
  const works = sortByDateDesc(all.filter((entry) => entry.type === "work"))
  const exhibitions = sortByDateDesc(all.filter((entry) => entry.type === "exhibition"))
  const thoughts = sortByDateDesc(all.filter((entry) => entry.type === "thought"))

  const body = [
    `# WOO HANNAH`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    `Woo Hannah, also known as Hannah Woo and 우한나, is a contemporary artist working across sculpture, installation, painting, and textile-based mixed media.`,
    "",
    "## Core Pages",
    "",
    `- [Home](${absoluteUrl("/")}) - Official portfolio homepage for ${ARTIST_NAME}.`,
    `- [About](${absoluteUrl("/about/")}) - Artist biography, CV, education, exhibitions, and awards.`,
    `- [Works](${absoluteUrl("/works/")}) - Index of sculptures, installations, paintings, and series.`,
    `- [Exhibitions](${absoluteUrl("/exhibitions/")}) - Solo, duo, and group exhibition archive.`,
    `- [Thoughts](${absoluteUrl("/thoughts/")}) - Interviews, criticism, essays, and artist texts.`,
    `- [Press](${absoluteUrl("/press/")}) - Press coverage and external references.`,
    "",
    "## Selected Works",
    "",
    ...works.slice(0, 24).map((entry) => formatEntry(entry)),
    "",
    "## Exhibitions",
    "",
    ...exhibitions.slice(0, 30).map((entry) => formatEntry(entry)),
    "",
    "## Writing and Press Context",
    "",
    ...thoughts.slice(0, 20).map((entry) => formatEntry(entry)),
    "",
  ].join("\n")

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}

function formatEntry(entry: Awaited<ReturnType<typeof loadAllContent>>[number]): string {
  const date = entry.date?.slice(0, 4) || entry.year
  const label = date ? `${entry.title} (${date})` : entry.title
  return `- [${label}](${absoluteUrl(entryPath(entry))}) - ${summarizeEntry(entry, `${entry.title} by Woo Hannah.`, 220)}`
}
