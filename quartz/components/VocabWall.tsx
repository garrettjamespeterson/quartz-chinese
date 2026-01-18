import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/vocabWall.scss"
import { classNames } from "../util/lang"

interface VocabCategory {
  [key: string]: string[]
}

function formatCategoryName(key: string): string {
  // Convert snake_case to Title Case
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export default (() => {
  const VocabWall: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
    const frontmatter = fileData.frontmatter
    const vocab = frontmatter?.vocab as VocabCategory | undefined

    // Only render if this is a Chinese lesson with vocab
    if (frontmatter?.audience !== "chinese" || !vocab) {
      return null
    }

    const categories = Object.entries(vocab)

    if (categories.length === 0) {
      return null
    }

    return (
      <div class={classNames(displayClass, "vocab-wall")}>
        <h3 class="vocab-wall-title">Vocabulary</h3>
        <div class="vocab-wall-content">
          {categories.map(([category, items]) => (
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

  VocabWall.css = style
  return VocabWall
}) satisfies QuartzComponentConstructor
