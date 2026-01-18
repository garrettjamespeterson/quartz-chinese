import { QuartzTransformerPlugin } from "../types"
import { visit } from "unist-util-visit"
import { Root, List, Html, Parent } from "mdast"
import { toString } from "mdast-util-to-string"

interface MultipleChoiceOptions {
  // Future options can be added here
}

// Check if a list item looks like a multiple choice option (starts with A), B), C), etc.)
function isMultipleChoiceOption(text: string): boolean {
  return /^[A-D]\)/.test(text.trim())
}

// Extract the option letter from text like "A) some content"
function getOptionLetter(text: string): string {
  const match = text.trim().match(/^([A-D])\)/)
  return match ? match[1] : ""
}

// Convert list item content to HTML, preserving existing HTML spans
function listItemToHtml(node: any): string {
  if (!node.children || node.children.length === 0) return ""

  // Get the paragraph inside the list item
  const paragraph = node.children[0]
  if (!paragraph || !paragraph.children) return ""

  let html = ""
  for (const child of paragraph.children) {
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

export const MultipleChoice: QuartzTransformerPlugin<Partial<MultipleChoiceOptions> | undefined> = (
  _userOpts,
) => {
  return {
    name: "MultipleChoice",
    markdownPlugins() {
      return [
        () => {
          return (tree: Root) => {
            // Track question numbers we've seen to create unique names
            let questionCounter = 0

            visit(tree, "list", (node: List, index, parent: Parent | undefined) => {
              if (!parent || typeof index !== "number") return

              // Check if this list has multiple choice options
              const items = node.children
              if (items.length < 2) return

              // Check if first item looks like a MC option
              const firstItemText = toString(items[0])
              if (!isMultipleChoiceOption(firstItemText)) return

              // This is a multiple choice list - convert it
              questionCounter++
              const questionName = `mc-q${questionCounter}`

              // Build HTML for the options
              let optionsHtml = ""
              for (const item of items) {
                const fullText = listItemToHtml(item)
                const letter = getOptionLetter(toString(item))

                // Remove the "A) " prefix from display but keep the letter for the label
                const contentWithoutPrefix = fullText.replace(/^[A-D]\)\s*/, "")

                optionsHtml += `
                <label class="mc-option">
                  <input type="radio" name="${questionName}" value="${letter}">
                  <span class="mc-circle"></span>
                  <span class="mc-text"><span class="mc-letter">${letter})</span> ${contentWithoutPrefix}</span>
                </label>`
              }

              // Create the MC container
              const htmlContent = `<div class="mc-options" data-question="${questionName}">${optionsHtml}</div>`

              // Replace the list node with HTML
              const htmlNode: Html = {
                type: "html",
                value: htmlContent,
              }

              parent.children[index] = htmlNode
            })
          }
        },
      ]
    },
  }
}
