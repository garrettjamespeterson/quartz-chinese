import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/coreVocab.scss"
import { classNames } from "../util/lang"

interface VocabCategory {
  [key: string]: string[]
}

function formatCategoryName(key: string): string {
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

// Categories to show on the left sidebar (core/foundational vocab)
const CORE_CATEGORIES = ["pronouns", "verbs", "interrogatives", "particles"]

export default (() => {
  const CoreVocab: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
    const frontmatter = fileData.frontmatter
    const vocab = frontmatter?.vocab as VocabCategory | undefined

    if (frontmatter?.audience !== "chinese" || !vocab) {
      return null
    }

    // Filter to only core categories
    const coreEntries = Object.entries(vocab).filter(([category]) =>
      CORE_CATEGORIES.includes(category.toLowerCase()),
    )

    if (coreEntries.length === 0) {
      return null
    }

    return (
      <div class={classNames(displayClass, "core-vocab")}>
        <h3 class="core-vocab-title">Core Vocabulary</h3>
        <div class="core-vocab-content">
          {coreEntries.map(([category, items]) => (
            <div class="vocab-category" key={category}>
              <h4 class="vocab-category-title">{formatCategoryName(category)}</h4>
              <ul class="vocab-list">
                {items.map((item, index) => (
                  <li
                    key={index}
                    class="vocab-item"
                    dangerouslySetInnerHTML={{ __html: item }}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    )
  }

  CoreVocab.css = style
  return CoreVocab
}) satisfies QuartzComponentConstructor
