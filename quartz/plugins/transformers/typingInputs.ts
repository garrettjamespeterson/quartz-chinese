import { QuartzTransformerPlugin } from "../types"
import { visit } from "unist-util-visit"
import { Root, Text, Html } from "mdast"

interface TypingInputOptions {
  // Future options can be added here
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
            visit(tree, "text", (node: Text, index, parent) => {
              // Match pattern: → followed by underscores (at least 3)
              // The arrow can be → or -> and underscores can vary in count
              const pattern = /^(→|->)\s*_{3,}$/

              if (pattern.test(node.value.trim()) && parent && typeof index === "number") {
                // Create an HTML input element
                const htmlNode: Html = {
                  type: "html",
                  value: `<span class="typing-input-wrapper">→ <input type="text" class="typing-input" placeholder="Type here..."></span>`,
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
