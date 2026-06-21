import type { ContentEntry } from "./content"

export const SITE_URL = "https://woohannah.com"
export const ARTIST_NAME = "Woo Hannah"
export const SITE_DESCRIPTION =
  "Official portfolio of Woo Hannah, a contemporary artist working across sculpture, installation, painting, and textile-based mixed media."

const ARTIST_ID = `${SITE_URL}/#artist`
const WEBSITE_ID = `${SITE_URL}/#website`

export const ARTIST_SAME_AS = [
  "https://www.instagram.com/hannah.flashed.that/",
  "https://www.artsy.net/artist/woo-hannah",
  "https://ggallery.kr/artists/woo-hannah",
  "https://www.frieze.com/article/frieze-seoul-2023-artist-award-woo-hannah",
]

export function absoluteUrl(pathname = ""): string {
  if (/^https?:\/\//i.test(pathname)) return pathname
  return new URL(pathname.replace(/^\/+/, ""), `${SITE_URL}/`).toString()
}

export function stripHtml(html = ""): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
}

export function truncateText(text: string, maxLen = 160): string {
  if (text.length <= maxLen) return text
  return `${text.slice(0, maxLen).replace(/\s\S*$/, "").trim()}...`
}

export function summarizeEntry(entry: ContentEntry, fallback?: string, maxLen = 160): string {
  const summary = entry.description?.trim() || stripHtml(entry.bodyHtml) || fallback || `${entry.title} by ${ARTIST_NAME}.`
  return truncateText(summary, maxLen)
}

export function entryPath(entry: ContentEntry): string {
  const slug = entry.slug.join("/")
  if (entry.type === "work") return `/works/${slug}/`
  if (entry.type === "exhibition") return `/exhibitions/${slug}/`
  if (entry.type === "thought") return `/thoughts/${slug}/`
  return `/${slug}/`
}

export function entryUrl(entry: ContentEntry): string {
  return absoluteUrl(entryPath(entry))
}

export function entryImageUrl(entry: ContentEntry): string | undefined {
  return entry.thumbnail ? absoluteUrl(entry.thumbnail) : undefined
}

export function websiteSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: "WOO HANNAH",
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: ["ko", "en"],
    publisher: { "@id": ARTIST_ID },
  }
}

export function personSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": ARTIST_ID,
    name: ARTIST_NAME,
    alternateName: ["WOO HANNAH", "Hannah Woo", "Woo Hannah", "우한나"],
    birthDate: "1988",
    jobTitle: "Artist",
    url: SITE_URL,
    sameAs: ARTIST_SAME_AS,
    knowsAbout: ["Sculpture", "Installation art", "Textile art", "Contemporary art", "Mixed media"],
  }
}

export function visualArtworkSchema(entry: ContentEntry): Record<string, unknown> {
  return compactSchema({
    "@context": "https://schema.org",
    "@type": "VisualArtwork",
    name: entry.title,
    url: entryUrl(entry),
    image: entryImageUrl(entry),
    description: summarizeEntry(
      entry,
      [entry.title, "by Woo Hannah", entry.year, entry.medium].filter(Boolean).join(", "),
    ),
    creator: { "@id": ARTIST_ID },
    artist: { "@id": ARTIST_ID },
    dateCreated: entry.year,
    artMedium: entry.medium,
    material: entry.medium,
    width: entry.dimensions,
    mainEntityOfPage: entryUrl(entry),
  })
}

export function exhibitionSchema(entry: ContentEntry): Record<string, unknown> {
  return compactSchema({
    "@context": "https://schema.org",
    "@type": "ExhibitionEvent",
    name: entry.title.replace(/^\d{4},\s*/, ""),
    url: entryUrl(entry),
    image: entryImageUrl(entry),
    description: summarizeEntry(entry, `${entry.title}, an exhibition featuring work by Woo Hannah.`),
    startDate: entry.date,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    performer: { "@id": ARTIST_ID },
    about: { "@id": ARTIST_ID },
    organizer: { "@id": ARTIST_ID },
    mainEntityOfPage: entryUrl(entry),
  })
}

export function articleSchema(entry: ContentEntry): Record<string, unknown> {
  return compactSchema({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: entry.title,
    url: entryUrl(entry),
    image: entryImageUrl(entry),
    description: summarizeEntry(entry),
    datePublished: entry.date,
    dateModified: entry.date,
    author: { "@id": ARTIST_ID },
    publisher: { "@id": ARTIST_ID },
    mainEntityOfPage: entryUrl(entry),
    inLanguage: "ko",
  })
}

function compactSchema(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => {
      if (item === undefined || item === null || item === "") return false
      if (Array.isArray(item) && item.length === 0) return false
      return true
    }),
  )
}
