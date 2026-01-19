import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/vocabWall.scss"
import { classNames } from "../util/lang"

interface VocabCategory {
  [key: string]: string[]
}

interface GrammarPoint {
  pattern: string
  meaning: string
  example?: string
}

function formatCategoryName(key: string): string {
  // Convert snake_case to Title Case
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

// Categories shown on left sidebar (excluded from right)
const CORE_CATEGORIES = ["pronouns", "verbs", "interrogatives", "particles"]

export default (() => {
  const VocabWall: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
    const frontmatter = fileData.frontmatter
    const vocab = frontmatter?.vocab as VocabCategory | undefined
    const grammar = frontmatter?.grammar as GrammarPoint[] | undefined

    // Only render if this is a Chinese lesson
    if (frontmatter?.audience !== "chinese") {
      return null
    }

    // Filter to only lesson-specific categories (exclude core categories)
    const lessonVocab = vocab
      ? Object.entries(vocab).filter(
          ([category]) => !CORE_CATEGORIES.includes(category.toLowerCase()),
        )
      : []

    // If no lesson vocab and no grammar, don't render
    if (lessonVocab.length === 0 && (!grammar || grammar.length === 0)) {
      return null
    }

    return (
      <div class={classNames(displayClass, "vocab-wall")}>
        <h3 class="vocab-wall-title">This Lesson</h3>
        <div class="vocab-wall-content">
          {/* Lesson-specific vocabulary */}
          {lessonVocab.map(([category, items]) => (
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

          {/* Grammar patterns */}
          {grammar && grammar.length > 0 && (
            <div class="vocab-category grammar-section">
              <h4 class="vocab-category-title">Grammar</h4>
              <ul class="vocab-list grammar-list">
                {grammar.map((point, index) => (
                  <li key={index} class="grammar-item">
                    <div
                      class="grammar-pattern"
                      dangerouslySetInnerHTML={{ __html: point.pattern }}
                    />
                    <div class="grammar-meaning">{point.meaning}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    )
  }

  VocabWall.css = style
  return VocabWall
}) satisfies QuartzComponentConstructor
