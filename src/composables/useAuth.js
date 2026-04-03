// =============================================================================
// useAuth.js — Session management composable
// =============================================================================

import { ref } from 'vue'
import { getItem, setItem, clearShieldData, KEYS } from './useStorage.js'

const SESSION_DURATION = 15 * 60 * 1000 // 15 minutes in ms

/**
 * Checks if the stored session is still valid.
 * Returns false if no loginTimestamp exists or if 15 minutes have elapsed.
 */
function isSessionValid() {
  const loginTimestamp = getItem(KEYS.LOGIN_TIMESTAMP)
  if (!loginTimestamp) return false
  return Date.now() - loginTimestamp < SESSION_DURATION
}

/**
 * Reads the current auth state from localStorage.
 * If session has expired, clears all Shield data and returns logged-out state.
 */
function readAuthState() {
  const isLoggedIn = getItem(KEYS.IS_LOGGED_IN) === true
  const isCheckedIn = getItem(KEYS.IS_CHECKED_IN) === true

  // If was logged in but session expired → clear everything
  if (isLoggedIn && !isSessionValid()) {
    clearShieldData()
    return { isLoggedIn: false, isCheckedIn: false }
  }

  return { isLoggedIn, isCheckedIn }
}

export function useAuth() {
  const authState = ref(readAuthState())

  /**
   * Perform login: store credentials timestamp and update state.
   * No credential validation (testing mode).
   */
  function login(username, _password) {
    const now = Date.now()
    setItem(KEYS.IS_LOGGED_IN, true)
    setItem(KEYS.IS_CHECKED_IN, false)
    setItem(KEYS.LOGIN_TIMESTAMP, now)
    setItem(KEYS.USERNAME, username)
    authState.value = { isLoggedIn: true, isCheckedIn: false }
  }

  /**
   * Perform check-in: store check-in timestamp and update state.
   */
  function checkIn() {
    const now = Date.now()
    setItem(KEYS.IS_CHECKED_IN, true)
    setItem(KEYS.CHECKIN_TIMESTAMP, now)
    authState.value = { ...authState.value, isCheckedIn: true }
  }

  /**
   * Perform check-out: clear check-in data but keep session alive.
   */
  function checkOut() {
    setItem(KEYS.IS_CHECKED_IN, false)
    localStorage.removeItem(KEYS.CHECKIN_TIMESTAMP)
    authState.value = { ...authState.value, isCheckedIn: false }
  }

  /**
   * Get the stored check-in timestamp (epoch ms).
   * Returns null if not checked in.
   */
  function getCheckInTimestamp() {
    return getItem(KEYS.CHECKIN_TIMESTAMP)
  }

  /**
   * Re-evaluate session validity (e.g. on popup re-open).
   */
  function refreshState() {
    authState.value = readAuthState()
  }

  /**
   * Get remaining session time in milliseconds.
   */
  function getRemainingSessionMs() {
    const loginTimestamp = getItem(KEYS.LOGIN_TIMESTAMP)
    if (!loginTimestamp) return 0
    const remaining = SESSION_DURATION - (Date.now() - loginTimestamp)
    return Math.max(0, remaining)
  }

  return {
    authState,
    login,
    checkIn,
    checkOut,
    getCheckInTimestamp,
    refreshState,
    getRemainingSessionMs,
  }
}
