import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/grammarNotes.scss"
import { classNames } from "../util/lang"

interface GrammarPoint {
  pattern: string
  meaning: string
  example?: string
}

export default (() => {
  const GrammarNotes: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
    const frontmatter = fileData.frontmatter
    const grammar = frontmatter?.grammar as GrammarPoint[] | undefined

    // Only render if this is a Chinese lesson with grammar notes
    if (frontmatter?.audience !== "chinese" || !grammar || grammar.length === 0) {
      return null
    }

    return (
      <div class={classNames(displayClass, "grammar-notes")}>
        <h3 class="grammar-notes-title">Grammar Patterns</h3>
        <div class="grammar-notes-content">
          {grammar.map((point, index) => (
            <div class="grammar-point" key={index}>
              <div class="grammar-pattern" dangerouslySetInnerHTML={{ __html: point.pattern }} />
              <div class="grammar-meaning">{point.meaning}</div>
              {point.example && (
                <div class="grammar-example" dangerouslySetInnerHTML={{ __html: point.example }} />
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  GrammarNotes.css = style
  return GrammarNotes
}) satisfies QuartzComponentConstructor
