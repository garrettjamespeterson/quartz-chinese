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

// Parse MC answers from the Answers section
// Returns array of correct answer letters in document order (e.g., ["A", "B", "C", "A", "B"])
function parseMcAnswers(tree: Root): string[] {
  const answers: string[] = []
  let inAnswersSection = false

  visit(tree, (node) => {
    // Check for ## Answers heading
    if (node.type === "heading" && (node as any).depth === 2) {
      const text = toString(node).toLowerCase()
      if (text === "answers") {
        inAnswersSection = true
      } else if (inAnswersSection) {
        inAnswersSection = false
      }
    }

    if (!inAnswersSection) return

    // Look for list items with simple format: "1. A", "2. B"
    if (node.type === "listItem") {
      const text = toString(node).trim()
      // Match "A" or "B" or "C" or "D" as standalone answer
      const match = text.match(/^([A-D])$/i)
      if (match) {
        answers.push(match[1].toUpperCase())
      }
    }

    // Look for paragraphs with inline format: "**MC:** 1-A, 2-B, 3-C"
    if (node.type === "paragraph") {
      const text = toString(node)
      const mcMatch = text.match(/\*?\*?MC:?\*?\*?\s*(.+)/i)
      if (mcMatch) {
        const answerPart = mcMatch[1]
        // Parse "1-A, 2-B, 3-C" format
        const pairs = answerPart.split(",")
        for (const pair of pairs) {
          const pairMatch = pair.trim().match(/\d+-([A-D])/i)
          if (pairMatch) {
            answers.push(pairMatch[1].toUpperCase())
          }
        }
      }
    }
  })

  return answers
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
            // First pass: collect all MC answers from the Answers section
            const mcAnswers = parseMcAnswers(tree)
            let answerIndex = 0

            // Second pass: convert MC lists to interactive radio buttons
            visit(tree, "list", (node: List, index, parent: Parent | undefined) => {
              if (!parent || typeof index !== "number") return

              // Check if this list has multiple choice options
              const items = node.children
              if (items.length < 2) return

              // Check if first item looks like a MC option
              const firstItemText = toString(items[0])
              if (!isMultipleChoiceOption(firstItemText)) return

              // This is a multiple choice list - convert it
              const questionName = `mc-q${answerIndex + 1}`
              const correctAnswer = mcAnswers[answerIndex] || ""
              answerIndex++

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

              // Create the MC container with correct answer data attribute
              const htmlContent = `<div class="mc-options" data-question="${questionName}" data-correct="${correctAnswer}">${optionsHtml}</div>`

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
