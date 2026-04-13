// =============================================================================
// useStorage.js — localStorage helpers
// =============================================================================

const KEYS = {
  LOGIN_TIMESTAMP: 'shield_login_timestamp',
  CHECKIN_TIMESTAMP: 'shield_checkin_timestamp',
  IS_LOGGED_IN: 'shield_is_logged_in',
  IS_CHECKED_IN: 'shield_is_checked_in',
  USERNAME: 'shield_username',
  ACCESS_TOKEN: 'shield_access_token',
  ACCESS_TOKEN_EXPIRES_AT: 'shield_access_token_expires_at',
  // Saved credentials — persist independently of session
  SAVED_USERNAME: 'shield_saved_username',
  SAVED_PASSWORD: 'shield_saved_password',
}

/**
 * Get a value from localStorage, parsed as JSON.
 * Returns null if key doesn't exist or parsing fails.
 */
export function getItem(key) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/**
 * Set a value in localStorage, serialized as JSON.
 */
export function setItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    console.error('[Shield] Failed to write localStorage:', err)
  }
}

/**
 * Remove a single key from localStorage.
 */
export function removeItem(key) {
  localStorage.removeItem(key)
}

/**
 * Clear all Shield-related keys from localStorage.
 */
export function clearShieldData() {
  const { SAVED_USERNAME, SAVED_PASSWORD, ...rest } = KEYS;
  const values = Object.values(rest);
  values.forEach((key) => localStorage.removeItem(key))
}

export { KEYS }
