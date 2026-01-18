// Load saved preferences from localStorage
const STORAGE_KEY_PINYIN = "zhongwen-pinyin"
const STORAGE_KEY_COLORS = "zhongwen-colors"
const STORAGE_KEY_CAPITALIZATION = "zhongwen-capitalization"

// Default settings for chinese.garrettjamespeterson.com
// - Pinyin: hover (available on hover for reference)
// - Colors: on (tone colors visible for learning)
// - Capitalization: on (tone patterns via capitalization)
const DEFAULT_PINYIN = "hover"
const DEFAULT_COLORS = "on"
const DEFAULT_CAPITALIZATION = "on"

// Apply saved preferences on page load (with educational defaults for new visitors)
const savedPinyin = localStorage.getItem(STORAGE_KEY_PINYIN) || DEFAULT_PINYIN
const savedColors = localStorage.getItem(STORAGE_KEY_COLORS) || DEFAULT_COLORS
const savedCapitalization = localStorage.getItem(STORAGE_KEY_CAPITALIZATION) || DEFAULT_CAPITALIZATION

document.documentElement.setAttribute("data-zhongwen-pinyin", savedPinyin)
document.documentElement.setAttribute("data-zhongwen-colors", savedColors)
document.documentElement.setAttribute("data-zhongwen-capitalization", savedCapitalization)

document.addEventListener("nav", () => {
  const settingsContainer = document.getElementById("chinese-settings")
  if (!settingsContainer) return

  const toggleButton = settingsContainer.querySelector(".chinese-settings-toggle")
  const panel = settingsContainer.querySelector(".chinese-settings-panel")
  const closeButton = settingsContainer.querySelector(".chinese-settings-close")

  if (!toggleButton || !panel || !closeButton) return

  // Update button states to reflect current settings and ensure document attributes are in sync
  const updateButtonStates = () => {
    const currentPinyin = localStorage.getItem(STORAGE_KEY_PINYIN) || DEFAULT_PINYIN
    const currentColors = localStorage.getItem(STORAGE_KEY_COLORS) || DEFAULT_COLORS
    const currentCapitalization = localStorage.getItem(STORAGE_KEY_CAPITALIZATION) || DEFAULT_CAPITALIZATION

    // Ensure document attributes are in sync (fixes SPA navigation issues)
    document.documentElement.setAttribute("data-zhongwen-pinyin", currentPinyin)
    document.documentElement.setAttribute("data-zhongwen-colors", currentColors)
    document.documentElement.setAttribute("data-zhongwen-capitalization", currentCapitalization)

    // Update pinyin buttons
    const pinyinButtons = panel.querySelector('[data-setting="pinyin"]')
    if (pinyinButtons) {
      pinyinButtons.querySelectorAll("button").forEach((btn) => {
        btn.classList.toggle("active", btn.getAttribute("data-value") === currentPinyin)
      })
    }

    // Update color buttons
    const colorButtons = panel.querySelector('[data-setting="colors"]')
    if (colorButtons) {
      colorButtons.querySelectorAll("button").forEach((btn) => {
        btn.classList.toggle("active", btn.getAttribute("data-value") === currentColors)
      })
    }

    // Update capitalization buttons
    const capitalizationButtons = panel.querySelector('[data-setting="capitalization"]')
    if (capitalizationButtons) {
      capitalizationButtons.querySelectorAll("button").forEach((btn) => {
        btn.classList.toggle("active", btn.getAttribute("data-value") === currentCapitalization)
      })
    }
  }

  // Initialize button states
  updateButtonStates()

  // Toggle panel visibility
  const togglePanel = () => {
    const isOpen = panel.classList.contains("open")
    panel.classList.toggle("open", !isOpen)
    panel.setAttribute("aria-hidden", isOpen ? "true" : "false")
  }

  // Close panel
  const closePanel = () => {
    panel.classList.remove("open")
    panel.setAttribute("aria-hidden", "true")
  }

  // Handle setting changes
  const handleSettingChange = (e: Event) => {
    const target = e.target as HTMLElement
    if (target.tagName !== "BUTTON") return

    const buttonGroup = target.closest(".chinese-settings-buttons")
    if (!buttonGroup) return

    const setting = buttonGroup.getAttribute("data-setting")
    const value = target.getAttribute("data-value")

    if (!setting || !value) return

    // Update active state
    buttonGroup.querySelectorAll("button").forEach((btn) => {
      btn.classList.toggle("active", btn === target)
    })

    // Save to localStorage and apply
    if (setting === "pinyin") {
      localStorage.setItem(STORAGE_KEY_PINYIN, value)
      document.documentElement.setAttribute("data-zhongwen-pinyin", value)
    } else if (setting === "colors") {
      localStorage.setItem(STORAGE_KEY_COLORS, value)
      document.documentElement.setAttribute("data-zhongwen-colors", value)
    } else if (setting === "capitalization") {
      localStorage.setItem(STORAGE_KEY_CAPITALIZATION, value)
      document.documentElement.setAttribute("data-zhongwen-capitalization", value)
    }
  }

  // Close panel when clicking outside
  const handleClickOutside = (e: MouseEvent) => {
    if (!settingsContainer.contains(e.target as Node)) {
      closePanel()
    }
  }

  // Event listeners
  toggleButton.addEventListener("click", togglePanel)
  closeButton.addEventListener("click", closePanel)
  panel.addEventListener("click", handleSettingChange)
  document.addEventListener("click", handleClickOutside)

  // Cleanup
  window.addCleanup(() => {
    toggleButton.removeEventListener("click", togglePanel)
    closeButton.removeEventListener("click", closePanel)
    panel.removeEventListener("click", handleSettingChange)
    document.removeEventListener("click", handleClickOutside)
  })

  // === EXERCISE VALIDATION ===
  // Multiple choice and typing input interactivity
  // Uses sessionStorage with a page-load ID so selections reset on hard refresh
  // but persist during SPA navigation

  // Get or create a page load ID (stored in sessionStorage, regenerates on hard refresh)
  let pageLoadId = sessionStorage.getItem("exercise-page-load-id")
  if (!pageLoadId) {
    pageLoadId = Math.random().toString(36).substring(2, 15)
    sessionStorage.setItem("exercise-page-load-id", pageLoadId)
  }

  const MC_STORAGE_PREFIX = `mc-${pageLoadId}-`
  const TYPING_STORAGE_PREFIX = `typing-${pageLoadId}-`
  const pageId = window.location.pathname

  // Initialize multiple choice interactions
  const mcContainers = document.querySelectorAll(".mc-options")
  const mcCleanupFns: (() => void)[] = []

  mcContainers.forEach((container) => {
    const questionName = container.getAttribute("data-question")
    const correctAnswer = container.getAttribute("data-correct")
    if (!questionName) return

    const storageKey = `${MC_STORAGE_PREFIX}${pageId}-${questionName}`
    const radios = container.querySelectorAll<HTMLInputElement>('input[type="radio"]')
    const options = container.querySelectorAll(".mc-option")

    // Function to update visual feedback based on selection
    const updateFeedback = (selectedValue: string | null) => {
      // Remove all feedback classes first
      options.forEach((opt) => {
        opt.classList.remove("correct", "incorrect")
      })

      if (!selectedValue || !correctAnswer) return

      // Find the selected option and add appropriate class
      options.forEach((opt) => {
        const radio = opt.querySelector('input[type="radio"]') as HTMLInputElement
        if (radio && radio.checked) {
          if (radio.value === correctAnswer) {
            opt.classList.add("correct")
          } else {
            opt.classList.add("incorrect")
          }
        }
      })
    }

    // Restore saved selection and show feedback
    const savedValue = sessionStorage.getItem(storageKey)
    if (savedValue) {
      radios.forEach((radio) => {
        if (radio.value === savedValue) {
          radio.checked = true
        }
      })
      updateFeedback(savedValue)
    }

    // Save selection on change and update feedback
    const handleChange = (e: Event) => {
      const radio = e.target as HTMLInputElement
      if (radio.checked) {
        sessionStorage.setItem(storageKey, radio.value)
        updateFeedback(radio.value)
      }
    }

    radios.forEach((radio) => {
      radio.addEventListener("change", handleChange)
      mcCleanupFns.push(() => radio.removeEventListener("change", handleChange))
    })
  })

  // Initialize typing input validation
  const typingInputs = document.querySelectorAll<HTMLInputElement>(".typing-input")
  const typingCleanupFns: (() => void)[] = []

  // Normalize pinyin by removing tone marks (client-side version)
  const normalizePinyin = (str: string): string => {
    const toneMap: Record<string, string> = {
      ā: "a", á: "a", ǎ: "a", à: "a",
      ē: "e", é: "e", ě: "e", è: "e",
      ī: "i", í: "i", ǐ: "i", ì: "i",
      ō: "o", ó: "o", ǒ: "o", ò: "o",
      ū: "u", ú: "u", ǔ: "u", ù: "u",
      ǖ: "v", ǘ: "v", ǚ: "v", ǜ: "v", ü: "v",
    }
    let result = str.toLowerCase()
    for (const [toned, plain] of Object.entries(toneMap)) {
      result = result.split(toned).join(plain)
    }
    return result
  }

  // Validation function for typing inputs
  const validateTypingInput = (input: HTMLInputElement) => {
    const userAnswer = input.value.trim()

    if (!userAnswer) {
      input.classList.remove("correct", "incorrect")
      return
    }

    const correctAnswer = input.dataset.answer
    const normalizedCorrectAnswer = input.dataset.answerNormalized

    // If no answer provided, we can't validate
    if (!correctAnswer) return

    // Basic normalization: lowercase, collapse spaces
    const basicNormalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim()

    // Normalize user input (both basic and pinyin-normalized)
    const userBasic = basicNormalize(userAnswer)
    const userNormalized = normalizePinyin(userAnswer).replace(/\s+/g, "").trim()

    // Check exact match first (for Chinese characters)
    const correctBasic = basicNormalize(correctAnswer)
    if (userBasic === correctBasic) {
      input.classList.remove("incorrect")
      input.classList.add("correct")
      return
    }

    // Check normalized pinyin match (ignoring tone marks and spaces)
    if (normalizedCorrectAnswer) {
      const correctNormalized = normalizedCorrectAnswer.replace(/\s+/g, "").trim()
      if (userNormalized === correctNormalized) {
        input.classList.remove("incorrect")
        input.classList.add("correct")
        return
      }
    }

    // No match
    input.classList.remove("correct")
    input.classList.add("incorrect")
  }

  typingInputs.forEach((input, index) => {
    const storageKey = `${TYPING_STORAGE_PREFIX}${pageId}-${index}`

    // Restore saved value
    const savedValue = sessionStorage.getItem(storageKey)
    if (savedValue) {
      input.value = savedValue
    }

    const handleInput = () => {
      sessionStorage.setItem(storageKey, input.value)
      input.classList.remove("correct", "incorrect")
    }

    const handleBlur = () => validateTypingInput(input)

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault()
        validateTypingInput(input)
        input.blur()
      }
    }

    input.addEventListener("input", handleInput)
    input.addEventListener("blur", handleBlur)
    input.addEventListener("keydown", handleKeydown)

    typingCleanupFns.push(() => {
      input.removeEventListener("input", handleInput)
      input.removeEventListener("blur", handleBlur)
      input.removeEventListener("keydown", handleKeydown)
    })
  })

  // Cleanup for exercises
  window.addCleanup(() => {
    mcCleanupFns.forEach((fn) => fn())
    typingCleanupFns.forEach((fn) => fn())
  })
})
