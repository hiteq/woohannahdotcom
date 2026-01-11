export function slugifyPathSegment(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replaceAll("’", "'")
    .replaceAll(/[\s_]+/g, "-")
    .replaceAll(/[^\p{L}\p{N}-]+/gu, "")
    .replaceAll(/-+/g, "-")
    .replaceAll(/^-|-$/g, "")
}

function ensureTrailingSlash(p: string): string {
  if (!p.endsWith("/")) return `${p}/`
  return p
}

function ensureLeadingSlash(p: string): string {
  if (!p.startsWith("/")) return `/${p}`
  return p
}

export function normalizeObsidianEmbeds(md: string, basePath = "/"): string {
  const base = ensureTrailingSlash(ensureLeadingSlash(basePath))

  // Image embeds: ![[Images/foo.jpg]] -> ![](/Images/foo.jpg)
  // (We assume Images are copied to site/public/Images/)
  md = md.replaceAll(/!\[\[(Images\/[^\]]+)\]\]/g, (_m, imgPath) => `![](${base}${imgPath})`)

  // Wiki links: [[Works/Sculptures/Bleeding]] -> [Bleeding](/works/sculptures/bleeding)
  md = md.replaceAll(/\[\[([^[\]]+?)\]\]/g, (_m, target: string) => {
    const parts = target.split("/").map((p) => p.trim()).filter(Boolean)
    const label = parts.at(-1) ?? target
    const first = (parts[0] ?? "").toLowerCase()
    const rest = parts.slice(1).map(slugifyPathSegment)

    if (first === "works") return `[${label}](${base}works/${rest.join("/")}/)`
    if (first === "exhibitions") return `[${label}](${base}exhibitions/${rest.join("/")}/)`
    if (first === "thoughts") return `[${label}](${base}thoughts/${rest.join("/")}/)`
    if (parts.length === 1) return `[${label}](${base}${slugifyPathSegment(parts[0])}/)`

    return label
  })

  // Obsidian callout header line like: > [!important] [[About]]
  md = md.replaceAll(/^>\s*\[![^\]]+\]\s*/gm, "> ")

  return md
}

