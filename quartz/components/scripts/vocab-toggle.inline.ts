document.addEventListener("nav", () => {
  const container = document.getElementById("vocab-toggle")
  if (!container) return

  const toggleButton = container.querySelector(".vocab-toggle-btn")
  const panel = container.querySelector(".vocab-toggle-panel")
  const closeButton = container.querySelector(".vocab-toggle-close")

  if (!toggleButton || !panel || !closeButton) return

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

  // Close panel when clicking outside
  const handleClickOutside = (e: MouseEvent) => {
    if (!container.contains(e.target as Node)) {
      closePanel()
    }
  }

  // Event listeners
  toggleButton.addEventListener("click", togglePanel)
  closeButton.addEventListener("click", closePanel)
  document.addEventListener("click", handleClickOutside)

  // Cleanup
  window.addCleanup(() => {
    toggleButton.removeEventListener("click", togglePanel)
    closeButton.removeEventListener("click", closePanel)
    document.removeEventListener("click", handleClickOutside)
  })
})
