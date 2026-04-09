// =============================================================================
// useAuth.js — Session management composable
// v1.3.0: Added saved credentials management and auto-login flow.
// =============================================================================

import { ref } from 'vue'
import { getItem, setItem, clearShieldData, KEYS } from './useStorage.js'

// Fallback TTL if the API doesn't provide an expiry (should not happen in normal flow)
const FALLBACK_SESSION_DURATION = 15 * 60 * 1000 // 15 minutes in ms

/**
 * Checks if the stored session is still valid.
 * Returns false if no loginTimestamp exists or if 15 minutes have elapsed.
 * Exported so CheckInView can call it when the Check In button is clicked.
 */
export function isSessionValid() {
  const expiresAt = getItem(KEYS.ACCESS_TOKEN_EXPIRES_AT)
  if (expiresAt) {
    // Use the real expiry from the API
    return Date.now() < new Date(expiresAt).getTime()
  }
  // Fallback: 15-minute window from login timestamp
  const loginTimestamp = getItem(KEYS.LOGIN_TIMESTAMP)
  if (!loginTimestamp) return false
  return Date.now() - loginTimestamp < FALLBACK_SESSION_DURATION
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
   * v1.2.0: Accepts access_token + accessTokenExpiresAt from Shield API.
   */
  function login(username, accessToken, accessTokenExpiresAt, checkinTime) {
    const now = Date.now()
    setItem(KEYS.IS_LOGGED_IN, true)
    setItem(KEYS.LOGIN_TIMESTAMP, now)
    setItem(KEYS.USERNAME, username)
    setItem(KEYS.ACCESS_TOKEN, accessToken)
    if (accessTokenExpiresAt) {
      setItem(KEYS.ACCESS_TOKEN_EXPIRES_AT, accessTokenExpiresAt)
    }
    // Immediately check in
    setItem(KEYS.IS_CHECKED_IN, true)
    setItem(KEYS.CHECKIN_TIMESTAMP, checkinTime || now)
    authState.value = { isCheckedIn: true }
  }

  /**
   * Perform check-in: store check-in timestamp and update state.
   * Used when session is still valid and user clicks Check In.
   */
  function checkIn(checkinTime) {
    const now = Date.now()
    setItem(KEYS.IS_CHECKED_IN, true)
    setItem(KEYS.CHECKIN_TIMESTAMP, checkinTime || now)
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
    const expiresAt = getItem(KEYS.ACCESS_TOKEN_EXPIRES_AT)
    if (expiresAt) {
      return Math.max(0, new Date(expiresAt).getTime() - Date.now())
    }
    // Fallback: 15-minute window
    const loginTimestamp = getItem(KEYS.LOGIN_TIMESTAMP)
    if (!loginTimestamp) return 0
    return Math.max(0, FALLBACK_SESSION_DURATION - (Date.now() - loginTimestamp))
  }

  /**
   * Get the stored access token expiry as an ISO string, or null.
   */
  function getExpiresAt() {
    return getItem(KEYS.ACCESS_TOKEN_EXPIRES_AT)
  }

  /**
   * Save credentials to localStorage (persists independently of session).
   */
  function saveCredentials(username, password) {
    setItem(KEYS.SAVED_USERNAME, username)
    setItem(KEYS.SAVED_PASSWORD, password)
  }

  /**
   * Get saved credentials if they exist.
   * Returns { username, password } or null.
   */
  function getSavedCredentials() {
    const username = getItem(KEYS.SAVED_USERNAME)
    const password = getItem(KEYS.SAVED_PASSWORD)
    if (!username || !password) return null
    return { username, password }
  }

  function getAccessToken() {
    return getItem(KEYS.ACCESS_TOKEN)
  }

  /**
   * Returns true if saved credentials exist.
   */
  function hasSavedCredentials() {
    return !!(getItem(KEYS.SAVED_USERNAME) && getItem(KEYS.SAVED_PASSWORD))
  }

  return {
    authState,
    login,
    checkIn,
    checkOut,
    getCheckInTimestamp,
    getExpiresAt,
    refreshState,
    getRemainingSessionMs,
    isSessionValid,
    saveCredentials,
    getSavedCredentials,
    hasSavedCredentials,
    getAccessToken,
  }
}
