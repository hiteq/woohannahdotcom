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

function normalizeImageFilename(filename: string): string {
  const trimmed = filename.trim()

  // Obsidian 문서에서 퍼센트 인코딩된 파일명이 섞여 있을 수 있어 우선 디코딩
  let decoded = trimmed
  if (/%[0-9A-Fa-f]{2}/.test(trimmed)) {
    try {
      decoded = decodeURIComponent(trimmed)
    } catch {
      // 디코딩 실패 시 원본 유지
    }
  }

  // macOS/Obsidian 환경에서 NFD(자모 분해)로 들어오는 경우가 있어
  // URL/파일 매칭을 위해 NFC(완성형)로 정규화
  return decoded.normalize("NFC")
}

export function normalizeImageFilenameToUrlSegment(filename: string): string {
  return encodeURIComponent(normalizeImageFilename(filename))
}

export function normalizeImagePathToUrlPath(imagePath: string): string {
  return imagePath
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map(normalizeImageFilenameToUrlSegment)
    .join("/")
}

function isImagePath(target: string): boolean {
  return /\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(target.trim())
}

function stripImagesPrefix(target: string): string {
  return target.replace(/^Images\//i, "")
}

function renderImageMarkdown(target: string, alt?: string, base = "/"): string {
  if (/^private\/Images\//i.test(target)) return ""

  const imagePath = stripImagesPrefix(target)
  const safePath = normalizeImagePathToUrlPath(imagePath)
  const safeAlt = (alt ?? "").trim()
  return safeAlt ? `![${safeAlt}](${base}Images/${safePath})` : `![](${base}Images/${safePath})`
}

export function normalizeObsidianEmbeds(md: string, basePath = "/"): string {
  const base = ensureTrailingSlash(ensureLeadingSlash(basePath))

  // Image embeds:
  // - ![[Images/foo.jpg]] -> ![](/<base>/Images/foo.jpg)
  // - ![[Images/foo.jpg|alt]] -> ![alt](/<base>/Images/foo.jpg)
  // (We assume Images are copied to site/public/Images/)
  md = md.replaceAll(
    /!\[\[((?:Images\/)?[^\]|]+\.(?:avif|gif|jpe?g|png|svg|webp))(?:\|([^\]]+))?\]\]/gi,
    (_m, target: string, alt?: string) => {
      return renderImageMarkdown(target, alt, base)
    },
  )

  // Explicit private image embeds are intentionally not published.
  md = md.replaceAll(/!\[\[private\/Images\/[^\]]+\]\]/gi, "")

  // If someone used standard markdown image syntax pointing at root (/Images/...),
  // rewrite to respect the configured base path (important for GitHub Pages base deploy).
  md = md.replaceAll(/!\[([^\]]*)\]\(\/Images\/([^)]+)\)/g, (_m, alt: string, rest: string) => {
    const safeRest = normalizeImagePathToUrlPath(rest)
    return `![${alt}](${base}Images/${safeRest})`
  })

  // Same for raw HTML <img src="/Images/...">
  md = md.replaceAll(/(<img\b[^>]*\bsrc=")\/Images\//g, `$1${base}Images/`)

  // Wiki links: [[Works/Sculptures/Bleeding]] -> [Bleeding](/works/sculptures/bleeding)
  md = md.replaceAll(/\[\[([^[\]]+?)\]\]/g, (_m, target: string) => {
    if (/^private\/Images\//i.test(target)) return ""

    const [linkTarget, explicitLabel] = target.split("|")
    if (isImagePath(linkTarget)) {
      return ""
    }

    const parts = linkTarget.split("/").map((p) => p.trim()).filter(Boolean)
    const label = explicitLabel?.trim() || parts.at(-1) || linkTarget
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
