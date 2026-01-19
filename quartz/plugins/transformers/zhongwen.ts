import { QuartzTransformerPlugin } from "../types"
import { visit } from "unist-util-visit"
import { pinyin } from "pinyin-pro"
import { Root, Code, Html } from "mdast"

// Tone colors configuration
const TONE_COLORS = {
  1: "#ff6b35", // 1st tone - phoenix flame
  2: "#6edcb8", // 2nd tone - sea foam
  3: "#a78bfa", // 3rd tone - deep amethyst
  4: "#b0b0b0", // 4th tone - soft grey
  5: "#ffd966", // neutral tone - bright citrine
  0: "#ffd966", // fallback for neutral
} as const

// Compound word overrides for correct pinyin/tone handling
// These take priority over pinyin-pro library lookups
interface PinyinOverride {
  pinyin: string[] // pinyin for each character
  tones: number[] // tone for each character (5 = neutral)
}

const COMPOUND_OVERRIDES: Record<string, PinyinOverride> = {
  // 麼-ending compounds (麼 is neutral tone in these)
  什麼: { pinyin: ["shén", "me"], tones: [2, 5] },
  怎麼: { pinyin: ["zěn", "me"], tones: [3, 5] },
  那麼: { pinyin: ["nà", "me"], tones: [4, 5] },
  這麼: { pinyin: ["zhè", "me"], tones: [4, 5] },
  多麼: { pinyin: ["duō", "me"], tones: [1, 5] },
  // Simplified variants
  什么: { pinyin: ["shén", "me"], tones: [2, 5] },
  怎么: { pinyin: ["zěn", "me"], tones: [3, 5] },
  那么: { pinyin: ["nà", "me"], tones: [4, 5] },
  这么: { pinyin: ["zhè", "me"], tones: [4, 5] },
  多么: { pinyin: ["duō", "me"], tones: [1, 5] },
}

// Single character overrides for common particles
// These characters are almost always neutral tone in practice
const PARTICLE_OVERRIDES: Record<string, PinyinOverride> = {
  嗎: { pinyin: ["ma"], tones: [5] }, // question particle
  吗: { pinyin: ["ma"], tones: [5] }, // simplified
  吧: { pinyin: ["ba"], tones: [5] }, // suggestion particle
  呢: { pinyin: ["ne"], tones: [5] }, // continuation particle
  的: { pinyin: ["de"], tones: [5] }, // possessive/attributive particle
  地: { pinyin: ["de"], tones: [5] }, // adverbial particle (when used as particle)
  得: { pinyin: ["de"], tones: [5] }, // complement particle (when used as particle)
  了: { pinyin: ["le"], tones: [5] }, // aspect particle
  們: { pinyin: ["men"], tones: [5] }, // plural suffix
  们: { pinyin: ["men"], tones: [5] }, // simplified
  啊: { pinyin: ["a"], tones: [5] }, // exclamatory particle
  啦: { pinyin: ["la"], tones: [5] }, // 了+啊 fusion particle
  嘛: { pinyin: ["ma"], tones: [5] }, // emphatic particle
  呀: { pinyin: ["ya"], tones: [5] }, // variant of 啊
}

interface ZhongwenOptions {
  // Future options can be added here
}

// Helper function to get tone number from pinyin with tone marks
function getToneFromPinyin(pinyinStr: string): number {
  // First tone: ā ē ī ō ū ǖ
  if (/[āēīōūǖ]/.test(pinyinStr)) return 1
  // Second tone: á é í ó ú ǘ
  if (/[áéíóúǘ]/.test(pinyinStr)) return 2
  // Third tone: ǎ ě ǐ ǒ ǔ ǚ
  if (/[ǎěǐǒǔǚ]/.test(pinyinStr)) return 3
  // Fourth tone: à è ì ò ù ǜ
  if (/[àèìòùǜ]/.test(pinyinStr)) return 4
  // Neutral tone (no tone mark)
  return 5
}

// Apply capitalization based on tone
// 1st tone: ALL CAPS
// 2nd tone: last letter capitalized
// 3rd tone: all lowercase
// 4th tone: First Letter Capitalized
// 5th/neutral tone: all lowercase (italics handled via CSS/markup)
function applyToneCapitalization(pinyinStr: string, tone: number): string {
  if (!pinyinStr) return pinyinStr

  switch (tone) {
    case 1:
      // ALL CAPS
      return pinyinStr.toUpperCase()
    case 2:
      // Last letter capitalized
      if (pinyinStr.length === 1) {
        return pinyinStr.toUpperCase()
      }
      return pinyinStr.slice(0, -1).toLowerCase() + pinyinStr.slice(-1).toUpperCase()
    case 3:
      // all lowercase
      return pinyinStr.toLowerCase()
    case 4:
      // First Letter Capitalized
      return pinyinStr.charAt(0).toUpperCase() + pinyinStr.slice(1).toLowerCase()
    case 5:
    default:
      // all lowercase (italics handled separately)
      return pinyinStr.toLowerCase()
  }
}

// Check if a character is a Chinese character
function isChinese(char: string): boolean {
  return /[\u4e00-\u9fff\u3400-\u4dbf\u{20000}-\u{2a6df}\u{2a700}-\u{2b73f}\u{2b740}-\u{2b81f}\u{2b820}-\u{2ceaf}]/u.test(
    char,
  )
}

// Check if a character is an ASCII letter
function isAsciiLetter(char: string): boolean {
  return /[a-zA-Z]/.test(char)
}

// Check if a word looks like an English name (starts with capital letter)
function isEnglishName(word: string): boolean {
  return word.length > 0 && /^[A-Z][a-zA-Z]*$/.test(word)
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

// Helper to generate HTML for a single Chinese character with pinyin
function generateCharacterHtml(char: string, charPinyin: string, tone: number): string {
  const color = TONE_COLORS[tone as keyof typeof TONE_COLORS] || TONE_COLORS[5]

  // Apply capitalization based on tone
  const capitalizedPinyin = applyToneCapitalization(charPinyin, tone)
  // Original pinyin (lowercase with tone marks) for when capitalization is OFF
  const originalPinyin = charPinyin.toLowerCase()

  // Create spans for both capitalized and original versions
  // Wrap neutral tone in <em> for italics (only in capitalized version)
  const capitalizedHtml =
    tone === 5
      ? `<span class="pinyin-capitalized"><em>${escapeHtml(capitalizedPinyin)}</em></span>`
      : `<span class="pinyin-capitalized">${escapeHtml(capitalizedPinyin)}</span>`
  const originalHtml = `<span class="pinyin-original">${escapeHtml(originalPinyin)}</span>`

  // Create ruby element with tone coloring
  let html = `<ruby class="zhongwen-char" style="--tone-color: ${color}" data-tone="${tone}">`
  html += `<span class="zhongwen-hanzi">${escapeHtml(char)}</span>`
  html += `<rp>(</rp>`
  html += `<rt class="zhongwen-pinyin">${capitalizedHtml}${originalHtml}</rt>`
  html += `<rp>)</rp>`
  html += `</ruby>`
  return html
}

// Process Chinese text and return HTML string with ruby annotations
export function processChineseText(text: string): string {
  const chars = Array.from(text)
  let html = ""

  // Build a map of which characters have override pinyin
  // We need to process compounds first to know which characters to skip in pinyin-pro
  const overrideMap = new Map<number, { pinyin: string; tone: number }>()

  // First pass: identify all compound and particle overrides
  const chineseIndices: number[] = [] // Maps Chinese char index to chars array index

  // Build index of Chinese character positions
  for (let i = 0; i < chars.length; i++) {
    if (isChinese(chars[i])) {
      chineseIndices.push(i)
    }
  }

  // Check for compound overrides among Chinese characters
  let ci = 0
  while (ci < chineseIndices.length) {
    const charArrayIndex = chineseIndices[ci]

    // Check for 2-character compound
    if (ci + 1 < chineseIndices.length) {
      const nextCharArrayIndex = chineseIndices[ci + 1]
      const twoChar = chars[charArrayIndex] + chars[nextCharArrayIndex]
      if (COMPOUND_OVERRIDES[twoChar]) {
        const override = COMPOUND_OVERRIDES[twoChar]
        overrideMap.set(ci, { pinyin: override.pinyin[0], tone: override.tones[0] })
        overrideMap.set(ci + 1, { pinyin: override.pinyin[1], tone: override.tones[1] })
        ci += 2
        continue
      }
    }

    // Check for single-character particle override
    const singleChar = chars[charArrayIndex]
    if (PARTICLE_OVERRIDES[singleChar]) {
      const override = PARTICLE_OVERRIDES[singleChar]
      overrideMap.set(ci, { pinyin: override.pinyin[0], tone: override.tones[0] })
    }

    ci++
  }

  // Get pinyin from pinyin-pro for all Chinese characters (for non-overridden ones)
  const chineseOnly = chineseIndices.map((i) => chars[i]).join("")
  const pinyinArray = pinyin(chineseOnly, { type: "array" })

  // Second pass: generate HTML
  let pinyinIndex = 0
  let i = 0

  while (i < chars.length) {
    const char = chars[i]

    if (isChinese(char)) {
      let charPinyin: string
      let tone: number

      // Check if this character has an override
      if (overrideMap.has(pinyinIndex)) {
        const override = overrideMap.get(pinyinIndex)!
        charPinyin = override.pinyin
        tone = override.tone
      } else {
        // Use pinyin-pro result
        charPinyin = pinyinArray[pinyinIndex] || ""
        tone = getToneFromPinyin(charPinyin)
      }

      html += generateCharacterHtml(char, charPinyin, tone)
      pinyinIndex++
      i++
    } else if (isAsciiLetter(char)) {
      // Collect consecutive ASCII letters to form a word
      let word = ""
      let j = i
      while (j < chars.length && isAsciiLetter(chars[j])) {
        word += chars[j]
        j++
      }
      // Check if it's an English name (capitalized) and wrap with underline class
      if (isEnglishName(word)) {
        html += `<span class="zhongwen-name">${escapeHtml(word)}</span>`
      } else {
        html += `<span class="zhongwen-punct">${escapeHtml(word)}</span>`
      }
      i = j
    } else if (char === "\n") {
      // Handle line breaks
      html += `<br>`
      i++
    } else if (/\s/.test(char)) {
      // Handle whitespace
      html += `<span class="zhongwen-space">${char}</span>`
      i++
    } else {
      // Handle punctuation and other characters
      html += `<span class="zhongwen-punct">${escapeHtml(char)}</span>`
      i++
    }
  }

  return html
}

export const ZhongwenBlock: QuartzTransformerPlugin<Partial<ZhongwenOptions> | undefined> = (
  _userOpts,
) => {
  return {
    name: "ZhongwenBlock",
    markdownPlugins() {
      return [
        () => {
          return (tree: Root) => {
            visit(tree, "code", (node: Code, index, parent) => {
              // Check if this is a zh-cn code block
              if (node.lang === "zh-cn" && parent && typeof index === "number") {
                const textContent = node.value.trim()

                if (textContent) {
                  const processedHtml = processChineseText(textContent)

                  // Create the wrapper div with all styling
                  const htmlContent = `<div class="zhongwen-block" data-pinyin="hidden" data-colors="off" data-capitalization="off">${processedHtml}</div>`

                  // Replace the code node with an HTML node
                  const htmlNode: Html = {
                    type: "html",
                    value: htmlContent,
                  }

                  // Replace the node in the parent's children array
                  parent.children[index] = htmlNode
                }
              }
            })
          }
        },
      ]
    },
  }
}
