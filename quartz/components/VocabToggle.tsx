// @ts-ignore
import vocabToggleScript from "./scripts/vocab-toggle.inline"
import styles from "./styles/vocab-toggle.scss"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

interface VocabCategory {
  [key: string]: string[]
}

interface GrammarPoint {
  pattern: string
  meaning: string
}

function formatCategoryName(key: string): string {
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

const CORE_CATEGORIES = ["pronouns", "verbs", "interrogatives", "particles"]

const VocabToggle: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  const frontmatter = fileData.frontmatter
  const vocab = frontmatter?.vocab as VocabCategory | undefined
  const grammar = frontmatter?.grammar as GrammarPoint[] | undefined

  // Only render for Chinese lesson pages with vocabulary
  if (frontmatter?.audience !== "chinese" || !vocab) {
    return null
  }

  // Split vocabulary into core and lesson-specific
  const coreEntries = Object.entries(vocab).filter(([category]) =>
    CORE_CATEGORIES.includes(category.toLowerCase()),
  )

  const lessonEntries = Object.entries(vocab).filter(
    ([category]) => !CORE_CATEGORIES.includes(category.toLowerCase()),
  )

  return (
    <div class={classNames(displayClass, "vocab-toggle")} id="vocab-toggle">
      <button class="vocab-toggle-btn" aria-label="Show vocabulary">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          <line x1="12" y1="6" x2="12" y2="10" />
          <line x1="10" y1="8" x2="14" y2="8" />
        </svg>
      </button>
      <div class="vocab-toggle-panel" aria-hidden="true">
        <div class="vocab-toggle-header">
          <span>Word Wall</span>
          <button class="vocab-toggle-close" aria-label="Close vocabulary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div class="vocab-toggle-content">
          {/* Core Vocabulary Section */}
          {coreEntries.length > 0 && (
            <div class="vocab-section">
              <h4 class="vocab-section-title">Core Vocabulary</h4>
              {coreEntries.map(([category, items]) => (
                <div class="vocab-category" key={category}>
                  <h5 class="vocab-category-title">{formatCategoryName(category)}</h5>
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
          )}

          {/* This Lesson Section */}
          {(lessonEntries.length > 0 || (grammar && grammar.length > 0)) && (
            <div class="vocab-section">
              <h4 class="vocab-section-title">This Lesson</h4>
              {lessonEntries.map(([category, items]) => (
                <div class="vocab-category" key={category}>
                  <h5 class="vocab-category-title">{formatCategoryName(category)}</h5>
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
                  <h5 class="vocab-category-title">Grammar</h5>
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
          )}
        </div>
      </div>
    </div>
  )
}

VocabToggle.afterDOMLoaded = vocabToggleScript
VocabToggle.css = styles

export default (() => VocabToggle) satisfies QuartzComponentConstructor
