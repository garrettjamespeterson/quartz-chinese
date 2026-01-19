import { QuartzTransformerPlugin } from "../types"
import { visit } from "unist-util-visit"
import { Root, Html, Parent, Code } from "mdast"
import { toString } from "mdast-util-to-string"
import { processChineseText } from "./zhongwen"

interface AudioLinesOptions {
  // Future options can be added here
}

// Check if a heading contains "(click for audio)"
function hasAudioMarker(text: string): boolean {
  return text.toLowerCase().includes("(click for audio)")
}

// Convert content to HTML while preserving existing HTML spans
function contentToHtml(node: any): string {
  if (!node.children) return ""

  let html = ""
  for (const child of node.children) {
    if (child.type === "html") {
      html += child.value
    } else if (child.type === "text") {
      html += escapeHtml(child.value)
    } else if (child.type === "emphasis") {
      html += `<em>${toString(child)}</em>`
    } else if (child.type === "strong") {
      html += `<strong>${toString(child)}</strong>`
    } else {
      html += escapeHtml(toString(child))
    }
  }
  return html
}

// Escape HTML special characters
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

export const AudioLines: QuartzTransformerPlugin<Partial<AudioLinesOptions> | undefined> = (
  _userOpts,
) => {
  return {
    name: "AudioLines",
    markdownPlugins() {
      return [
        () => {
          return (tree: Root, file) => {
            // Extract audio mapping and lesson number from frontmatter
            const frontmatter = file.data.frontmatter as any
            const audioMapping = new Map<number, string>()
            let lessonNum: string | null = null

            if (frontmatter) {
              // Get lesson number
              if (frontmatter.lesson) {
                lessonNum = frontmatter.lesson.toString().padStart(2, "0")
              }

              // Get audio line mappings
              if (frontmatter.audio && frontmatter.audio.lines) {
                for (const [key, value] of Object.entries(frontmatter.audio.lines)) {
                  audioMapping.set(parseInt(key), value as string)
                }
              }
            }

            let inAudioSection = false

            visit(tree, (node, index, parent: Parent | undefined) => {
              if (!parent || typeof index !== "number") return

              // Check for headings with "(click for audio)"
              if (node.type === "heading") {
                const headingText = toString(node)
                inAudioSection = hasAudioMarker(headingText)
                return
              }

              if (!inAudioSection) return

              // Handle ordered lists (Pinyin Story, With Translation)
              if (node.type === "list") {
                const listNode = node as any

                // Check if it's an ordered list
                if (listNode.ordered === true) {
                  // Transform the list into clickable audio lines
                  let htmlContent = '<div class="audio-lines-container">\n'

                  for (let i = 0; i < listNode.children.length; i++) {
                    const item = listNode.children[i]
                    const lineNum = i + 1

                    let audioPath = audioMapping.get(lineNum)
                    if (!audioPath && lessonNum) {
                      audioPath = `/static/audio/L${lessonNum}/${lineNum.toString().padStart(2, "0")}.mp3`
                    }

                    // Get the paragraph content from inside the list item
                    const paragraph = item.children && item.children[0]
                    const content = paragraph ? contentToHtml(paragraph) : escapeHtml(toString(item))

                    if (audioPath) {
                      htmlContent += `  <div class="audio-line" data-audio="${audioPath}">${content}</div>\n`
                    } else {
                      htmlContent += `  <div class="audio-line">${content}</div>\n`
                    }
                  }

                  htmlContent += '</div>'

                  const htmlNode: Html = {
                    type: "html",
                    value: htmlContent,
                  }

                  parent.children[index] = htmlNode
                }
              }

              // Handle zh-cn code blocks (Character Introduction)
              // Keep zhongwen styling but make each line clickable for audio
              if (node.type === "code" && (node as Code).lang === "zh-cn") {
                const codeNode = node as Code
                const lines = codeNode.value.split("\n").filter(line => line.trim())

                let htmlContent = '<div class="zhongwen-block zhongwen-audio-block" data-pinyin="hidden" data-colors="off" data-capitalization="off">\n'

                for (let i = 0; i < lines.length; i++) {
                  const lineNum = i + 1
                  let audioPath = audioMapping.get(lineNum)

                  // Fallback to convention-based path
                  if (!audioPath && lessonNum) {
                    audioPath = `/static/audio/L${lessonNum}/${lineNum.toString().padStart(2, "0")}.mp3`
                  }

                  // Process the line through zhongwen to get ruby annotations
                  const processedLine = processChineseText(lines[i])

                  if (audioPath) {
                    htmlContent += `  <div class="zhongwen-audio-line audio-line" data-audio="${audioPath}">${processedLine}</div>\n`
                  } else {
                    htmlContent += `  <div class="zhongwen-audio-line">${processedLine}</div>\n`
                  }
                }

                htmlContent += '</div>'

                const htmlNode: Html = {
                  type: "html",
                  value: htmlContent,
                }

                parent.children[index] = htmlNode
              }
            })
          }
        },
      ]
    },
  }
}
