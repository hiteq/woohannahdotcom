import { QuartzTransformerPlugin } from "../types"
import { Root, Image, Html, Paragraph } from "mdast"
import { visit } from "unist-util-visit"

export interface ImageCaptionOptions {
  /** Whether to enable image caption processing */
  enableImageCaptions: boolean
}

const defaultOptions: ImageCaptionOptions = {
  enableImageCaptions: true
}

export const ImageCaption: QuartzTransformerPlugin<ImageCaptionOptions> = (userOpts) => {
  const opts = { ...defaultOptions, ...userOpts }

  return {
    name: "ImageCaption",
    markdownPlugins() {
      return [
        () => {
          return (tree: Root) => {
            if (!opts.enableImageCaptions) return

            visit(tree, "paragraph", (node: Paragraph, index, parent) => {
              if (!parent || typeof index !== "number") return

              // Check if paragraph contains only an image followed by italic text
              if (node.children.length >= 2 &&
                  node.children[0].type === "image" &&
                  node.children[1].type === "text" &&
                  node.children[1].value.trim() === "" &&
                  node.children.length >= 3 &&
                  node.children[2].type === "emphasis") {

                const imageNode = node.children[0] as Image
                const emphasisNode = node.children[2]

                // Extract caption text from emphasis
                if (emphasisNode.children.length === 1 &&
                    emphasisNode.children[0].type === "text") {

                  const caption = emphasisNode.children[0].value

                  // Create HTML figure element with better alt text
                  const altText = imageNode.alt || caption.split(',')[0].trim() || "Artwork"
                  const figureHtml = `<figure>
  <img src="${imageNode.url}" alt="${altText}" ${imageNode.title ? `title="${imageNode.title}"` : ""}>
  <figcaption>${caption}</figcaption>
</figure>`

                  // Replace the paragraph with HTML node
                  const htmlNode: Html = {
                    type: "html",
                    value: figureHtml
                  }

                  parent.children[index] = htmlNode
                }
              }

              // Also handle Obsidian-style images: ![[filename]]
              // These get converted to text nodes by ObsidianFlavoredMarkdown
              if (node.children.length === 1 &&
                  node.children[0].type === "text") {

                const text = node.children[0].value
                const obsidianImageMatch = text.match(/^!\[\[(.*?)(?:\|(.*?))?\]\]$/)

                if (obsidianImageMatch) {
                  const imagePath = obsidianImageMatch[1]
                  const altText = obsidianImageMatch[2] || imagePath.split('/').pop()?.split('.')[0] || "Image"

                  const figureHtml = `<figure>
  <img src="../${imagePath}" alt="${altText}">
  <figcaption></figcaption>
</figure>`

                  const htmlNode: Html = {
                    type: "html",
                    value: figureHtml
                  }

                  parent.children[index] = htmlNode
                }
              }

              // Handle multiple children with Obsidian images mixed with other content
              if (node.children.length > 1) {
                for (let i = 0; i < node.children.length; i++) {
                  const child = node.children[i]

                  if (child.type === "text") {
                    const text = child.value
                    const obsidianImageMatch = text.match(/^!\[\[(.*?)(?:\|(.*?))?\]\]$/)

                    if (obsidianImageMatch) {
                      const imagePath = obsidianImageMatch[1]
                      const altText = obsidianImageMatch[2] || imagePath.split('/').pop()?.split('.')[0] || "Image"

                      const figureHtml = `<figure>
  <img src="../${imagePath}" alt="${altText}">
  <figcaption></figcaption>
</figure>`

                      // Replace this child with HTML node
                      node.children[i] = {
                        type: "html",
                        value: figureHtml
                      } as Html
                    }
                  }
                }
              }

              // Handle Obsidian images with captions (image followed by italic text)
              if (node.children.length >= 3 &&
                  node.children[0].type === "text" &&
                  node.children[0].value.match(/^!\[\[.*\]\]$/) &&
                  node.children[1].type === "text" &&
                  node.children[1].value.trim() === "" &&
                  node.children[2].type === "text" &&
                  node.children[2].value.trim().startsWith("*") &&
                  node.children[2].value.trim().endsWith("*")) {

                const obsidianImageMatch = node.children[0].value.match(/^!\[\[(.*?)(?:\|(.*?))?\]\]$/)
                if (obsidianImageMatch) {
                  const imagePath = obsidianImageMatch[1]
                  const altText = obsidianImageMatch[2] || imagePath.split('/').pop()?.split('.')[0] || "Image"
                  const caption = node.children[2].value.trim().slice(1, -1) // Remove * from start and end

                  const figureHtml = `<figure>
  <img src="../${imagePath}" alt="${altText}">
  <figcaption>${caption}</figcaption>
</figure>`

                  const htmlNode: Html = {
                    type: "html",
                    value: figureHtml
                  }

                  parent.children[index] = htmlNode
                }
              }

              // Handle standalone Obsidian images (no captions)
              if (node.children.length === 1 &&
                  node.children[0].type === "text") {

                const text = node.children[0].value.trim()
                const obsidianImageMatch = text.match(/^!\[\[(.*?)(?:\|(.*?))?\]\]$/)

                if (obsidianImageMatch) {
                  const imagePath = obsidianImageMatch[1]
                  const altText = obsidianImageMatch[2] || imagePath.split('/').pop()?.split('.')[0] || "Image"

                  const figureHtml = `<figure>
  <img src="../${imagePath}" alt="${altText}">
  <figcaption></figcaption>
</figure>`

                  const htmlNode: Html = {
                    type: "html",
                    value: figureHtml
                  }

                  parent.children[index] = htmlNode
                }
              }
            })
          }
        }
      ]
    }
  }
}
