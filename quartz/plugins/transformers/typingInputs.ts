import { QuartzTransformerPlugin } from "../types"
import { visit } from "unist-util-visit"
import { Root, Text, Html, Parent } from "mdast"
import { toString } from "mdast-util-to-string"

interface TypingInputOptions {
  // Future options can be added here
}

// Normalize pinyin by removing tone marks
// This allows "nihao" to match "nǐhǎo"
function normalizePinyin(str: string): string {
  const toneMap: Record<string, string> = {
    // a variants
    ā: "a", á: "a", ǎ: "a", à: "a",
    // e variants
    ē: "e", é: "e", ě: "e", è: "e",
    // i variants
    ī: "i", í: "i", ǐ: "i", ì: "i",
    // o variants
    ō: "o", ó: "o", ǒ: "o", ò: "o",
    // u variants
    ū: "u", ú: "u", ǔ: "u", ù: "u",
    // ü variants
    ǖ: "v", ǘ: "v", ǚ: "v", ǜ: "v", ü: "v",
  }

  let result = str.toLowerCase()
  for (const [toned, plain] of Object.entries(toneMap)) {
    result = result.replace(new RegExp(toned, "g"), plain)
  }
  return result
}

// Parse typing answers from the Answers section
// Returns array of answers in document order
function parseTypingAnswers(tree: Root): string[] {
  const answers: string[] = []
  let inAnswersSection = false
  let inTypingSection = false

  // Walk through the tree to find the Answers section
  visit(tree, (node) => {
    // Check for ## Answers heading
    if (node.type === "heading" && (node as any).depth === 2) {
      const text = toString(node).toLowerCase()
      if (text === "answers") {
        inAnswersSection = true
      } else if (inAnswersSection) {
        // We've hit another h2, so we're done with answers
        inAnswersSection = false
      }
    }

    // Look for **Typing:** markers
    if (inAnswersSection && node.type === "paragraph") {
      const text = toString(node)
      if (text.match(/^\*?\*?Typing:?\*?\*?$/i)) {
        inTypingSection = true
        return
      }
      // Check if this looks like a section header that ends typing
      if (inTypingSection && text.match(/^\*?\*?(MC|Multiple Choice):?/i)) {
        inTypingSection = false
        return
      }
    }

    // Look for list items with answers (- 6: answer format)
    if (inAnswersSection && inTypingSection && node.type === "listItem") {
      const text = toString(node)
      // Match patterns like "6: nǐhǎo" or "6: 你好"
      const match = text.match(/^\d+:\s*(.+)$/)
      if (match) {
        answers.push(match[1].trim())
      }
    }

    // Also check for html content (details tag)
    if (node.type === "html") {
      const html = (node as Html).value
      // Check if we're entering a details section with answers
      if (html.includes("<details>") || html.includes("<summary>")) {
        // Continue looking inside
      }
    }
  })

  return answers
}

export const TypingInputs: QuartzTransformerPlugin<Partial<TypingInputOptions> | undefined> = (
  _userOpts,
) => {
  return {
    name: "TypingInputs",
    markdownPlugins() {
      return [
        () => {
          return (tree: Root) => {
            // First pass: collect all typing answers from the Answers section
            const answers = parseTypingAnswers(tree)
            let answerIndex = 0

            // Second pass: convert typing input markers to actual inputs
            visit(tree, "text", (node: Text, index, parent: Parent | undefined) => {
              // Match pattern: → followed by underscores (at least 3)
              const pattern = /^(→|->)\s*_{3,}$/

              if (pattern.test(node.value.trim()) && parent && typeof index === "number") {
                // Get the answer for this input (if available)
                const answer = answers[answerIndex] || ""
                answerIndex++

                // Create normalized version for comparison (strips tone marks)
                const normalizedAnswer = normalizePinyin(answer)

                // Build data attributes
                let dataAttrs = ""
                if (answer) {
                  // Escape quotes in answers
                  const escapedAnswer = answer.replace(/"/g, "&quot;")
                  const escapedNormalized = normalizedAnswer.replace(/"/g, "&quot;")
                  dataAttrs = ` data-answer="${escapedAnswer}" data-answer-normalized="${escapedNormalized}"`
                }

                // Create an HTML input element with answer data
                const htmlNode: Html = {
                  type: "html",
                  value: `<span class="typing-input-wrapper">→ <input type="text" class="typing-input" placeholder="Type here..."${dataAttrs}></span>`,
                }

                // Replace the text node with the HTML node
                parent.children[index] = htmlNode
              }
            })
          }
        },
      ]
    },
  }
}
