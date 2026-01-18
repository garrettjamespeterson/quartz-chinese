// Audio line playback functionality
// Handles clickable audio lines for Chinese lessons

let currentAudio: HTMLAudioElement | null = null
let currentLine: HTMLElement | null = null

document.addEventListener("nav", () => {
  // Stop any currently playing audio when navigating
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    if (currentLine) currentLine.classList.remove("playing")
    currentAudio = null
    currentLine = null
  }

  const audioLines = document.querySelectorAll<HTMLElement>(".audio-line")

  audioLines.forEach((line) => {
    const playAudio = () => {
      const audioSrc = line.dataset.audio

      if (!audioSrc) return

      // Stop current audio if playing
      if (currentAudio) {
        currentAudio.pause()
        currentAudio.currentTime = 0
        if (currentLine) currentLine.classList.remove("playing")
      }

      // If clicking same line, just stop
      if (currentLine === line) {
        currentAudio = null
        currentLine = null
        return
      }

      // Play new audio
      currentAudio = new Audio(audioSrc)
      currentLine = line
      line.classList.add("playing")

      currentAudio
        .play()
        .catch((err) => {
          console.error("Audio playback failed:", err)
          line.classList.remove("playing")
        })

      currentAudio.onended = () => {
        line.classList.remove("playing")
        currentAudio = null
        currentLine = null
      }
    }

    line.addEventListener("click", playAudio)
    window.addCleanup(() => line.removeEventListener("click", playAudio))
  })
})
