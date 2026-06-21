import type { ContentEntry } from "./content"

export const SITE_URL = "https://woohannah.com"
export const ARTIST_NAME = "Woo Hannah"
export const SITE_DESCRIPTION =
  "Official portfolio of Woo Hannah, a contemporary artist working across sculpture, installation, painting, and textile-based mixed media."

const ARTIST_ID = `${SITE_URL}/#artist`
const WEBSITE_ID = `${SITE_URL}/#website`

type ListSchemaItem = {
  name: string
  url: string
  description?: string
  image?: string
}

type BreadcrumbItem = {
  name: string
  path: string
}

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

export function entryListItem(entry: ContentEntry, maxDescriptionLen = 180): ListSchemaItem {
  return compactSchema({
    name: entry.title,
    url: entryUrl(entry),
    description: summarizeEntry(entry, `${entry.title} by Woo Hannah.`, maxDescriptionLen),
    image: entryImageUrl(entry),
  }) as ListSchemaItem
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
    additionalProperty: entry.dimensions
      ? [{ "@type": "PropertyValue", name: "dimensions", value: entry.dimensions }]
      : undefined,
    isPartOf: { "@id": `${SITE_URL}/works/#collection` },
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
    isPartOf: { "@id": `${SITE_URL}/exhibitions/#collection` },
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
    isPartOf: { "@id": `${SITE_URL}/thoughts/#collection` },
    mainEntityOfPage: entryUrl(entry),
    inLanguage: "ko",
  })
}

export function breadcrumbSchema(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function entryBreadcrumbSchema(entry: ContentEntry): Record<string, unknown> {
  const section = entry.type === "work" ? "Works" : entry.type === "exhibition" ? "Exhibitions" : "Thoughts"
  const sectionPath = entry.type === "work" ? "/works/" : entry.type === "exhibition" ? "/exhibitions/" : "/thoughts/"

  return breadcrumbSchema([
    { name: "Home", path: "/" },
    { name: section, path: sectionPath },
    { name: entry.title, path: entryPath(entry) },
  ])
}

export function collectionPageSchema(options: {
  name: string
  description: string
  path: string
  id?: string
  items?: ListSchemaItem[]
}): Record<string, unknown> {
  const url = absoluteUrl(options.path)
  const items = options.items ?? []

  return compactSchema({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": options.id ?? `${url}#collection`,
    name: options.name,
    url,
    description: options.description,
    about: { "@id": ARTIST_ID },
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: items.length
      ? {
          "@type": "ItemList",
          numberOfItems: items.length,
          itemListElement: items.map((item, index) =>
            compactSchema({
              "@type": "ListItem",
              position: index + 1,
              name: item.name,
              url: item.url,
              image: item.image,
              description: item.description,
            }),
          ),
        }
      : undefined,
  })
}

export function profilePageSchema(description: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${SITE_URL}/about/#profile`,
    name: "About Woo Hannah",
    url: absoluteUrl("/about/"),
    description,
    mainEntity: { "@id": ARTIST_ID },
    isPartOf: { "@id": WEBSITE_ID },
  }
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
