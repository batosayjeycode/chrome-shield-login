// =============================================================================
// useAuth.js — Session management composable
// v1.1.0: login() now immediately performs check-in; isSessionValid() is exported.
// =============================================================================

import { ref } from 'vue'
import { getItem, setItem, clearShieldData, KEYS } from './useStorage.js'

const SESSION_DURATION = 15 * 60 * 1000 // 15 minutes in ms

/**
 * Checks if the stored session is still valid.
 * Returns false if no loginTimestamp exists or if 15 minutes have elapsed.
 * Exported so CheckInView can call it when the Check In button is clicked.
 */
export function isSessionValid() {
  const loginTimestamp = getItem(KEYS.LOGIN_TIMESTAMP)
  if (!loginTimestamp) return false
  return Date.now() - loginTimestamp < SESSION_DURATION
}

/**
 * Reads the current auth state from localStorage.
 * If session has expired, clears all Shield data and returns logged-out state.
 */
function readAuthState() {
  const isCheckedIn = getItem(KEYS.IS_CHECKED_IN) === true

  // If there was a login but session expired → clear everything
  if (isCheckedIn && !isSessionValid()) {
    clearShieldData()
    return { isCheckedIn: false }
  }

  return { isCheckedIn }
}

export function useAuth() {
  const authState = ref(readAuthState())

  /**
   * Perform login + check-in in one step.
   * v1.1.0: After successful login the user goes directly to ActiveSessionView.
   * No credential validation (testing mode).
   */
  function login(username, _password) {
    const now = Date.now()
    setItem(KEYS.IS_LOGGED_IN, true)
    setItem(KEYS.LOGIN_TIMESTAMP, now)
    setItem(KEYS.USERNAME, username)
    // Immediately check in
    setItem(KEYS.IS_CHECKED_IN, true)
    setItem(KEYS.CHECKIN_TIMESTAMP, now)
    authState.value = { isCheckedIn: true }
  }

  /**
   * Perform check-in: store check-in timestamp and update state.
   * Used when session is still valid and user clicks Check In.
   */
  function checkIn() {
    const now = Date.now()
    setItem(KEYS.IS_CHECKED_IN, true)
    setItem(KEYS.CHECKIN_TIMESTAMP, now)
    authState.value = { isCheckedIn: true }
  }

  /**
   * Perform check-out: clear check-in data only, return to CheckInView.
   * Login session data (loginTimestamp, isLoggedIn) is preserved.
   */
  function checkOut() {
    setItem(KEYS.IS_CHECKED_IN, false)
    localStorage.removeItem(KEYS.CHECKIN_TIMESTAMP)
    authState.value = { isCheckedIn: false }
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
    isSessionValid,
  }
}
