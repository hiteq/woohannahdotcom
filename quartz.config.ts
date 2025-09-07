import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"
import { isFolderPath } from "./quartz/util/path"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
// Custom sort to keep site tree consistent across folder listings
const folderPageSort = (f1: any, f2: any) => {
  const topOrder = ["Works", "Exhibitions", "Thoughts", "Press", "About"]

  const f1IsFolder = isFolderPath(f1.slug ?? "")
  const f2IsFolder = isFolderPath(f2.slug ?? "")
  if (f1IsFolder && !f2IsFolder) return -1
  if (!f1IsFolder && f2IsFolder) return 1

  // Prioritize specific top-level names if present
  const t1 = (f1.frontmatter?.title ?? "") as string
  const t2 = (f2.frontmatter?.title ?? "") as string
  const i1 = topOrder.indexOf(t1)
  const i2 = topOrder.indexOf(t2)
  if (i1 !== -1 || i2 !== -1) {
    if (i1 !== -1 && i2 !== -1) return i1 - i2
    if (i1 !== -1) return -1
    if (i2 !== -1) return 1
  }

  // Then by date (modified desc) if available
  const d1 = f1.dates?.modified ?? f1.dates?.published ?? f1.dates?.created
  const d2 = f2.dates?.modified ?? f2.dates?.published ?? f2.dates?.created
  if (d1 && d2) return d2.getTime() - d1.getTime()
  if (d1 && !d2) return -1
  if (!d1 && d2) return 1

  // Fallback alphabetical by title
  return t1.toLowerCase().localeCompare(t2.toLowerCase())
}

const config: QuartzConfig = {
  configuration: {
    pageTitle: "Hannah Woo",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: null,
    locale: "ko-KR",
    baseUrl: "https://woohannah.com",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Schibsted Grotesk",
        body: "Source Sans Pro",
        code: "IBM Plex Mono",
      },
      colors: {
        lightMode: {
          light: "#faf8f8",
          lightgray: "#e5e5e5",
          gray: "#b8b8b8",
          darkgray: "#4e4e4e",
          dark: "#2b2b2b",
          secondary: "#284b63",
          tertiary: "#84a59d",
          highlight: "rgba(143, 159, 169, 0.15)",
          textHighlight: "#fff23688",
        },
        darkMode: {
          light: "#161618",
          lightgray: "#393639",
          gray: "#646464",
          darkgray: "#d4d4d4",
          dark: "#ebebec",
          secondary: "#7b97aa",
          tertiary: "#84a59d",
          highlight: "rgba(143, 159, 169, 0.15)",
          textHighlight: "#b3aa0288",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage({ sort: folderPageSort }),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // Comment out CustomOgImages to speed up build time
      Plugin.CustomOgImages(),
    ],
  },
}

export default config
