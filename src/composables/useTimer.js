// =============================================================================
// useTimer.js — Real-time elapsed timer composable
// =============================================================================

import { ref, onUnmounted } from 'vue'

/**
 * Formats a duration in milliseconds to HH:MM:SS string.
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted time string e.g. "01:23:45"
 */
function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000)
  const hours   = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

export function useTimer() {
  const elapsed = ref('00:00:00')
  let intervalId = null

  /**
   * Start the timer from a given check-in timestamp (epoch ms).
   * Updates `elapsed` every second.
   * @param {number} checkInTimestamp - The epoch ms timestamp of check-in
   */
  function start(checkInTimestamp) {
    // Clear any existing interval first
    stop()

    // Immediately set the current elapsed time
    elapsed.value = formatTime(Date.now() - checkInTimestamp)

    // Then tick every second
    intervalId = setInterval(() => {
      elapsed.value = formatTime(Date.now() - checkInTimestamp)
    }, 1000)
  }

  /**
   * Stop the timer and clear the interval.
   */
  function stop() {
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  /**
   * Reset the timer display and stop ticking.
   */
  function reset() {
    stop()
    elapsed.value = '00:00:00'
  }

  // Auto-cleanup when component unmounts
  onUnmounted(() => {
    stop()
  })

  return { elapsed, start, stop, reset }
}
