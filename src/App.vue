<template>
  <Transition name="fade" mode="out-in">
    <!-- v1.3.0: CheckInView is the first page shown -->
    <CheckInView
      v-if="currentView === 'checkin'"
      key="checkin"
      :get-remaining-session-ms="getRemainingSessionMs"
      :get-expires-at="getExpiresAt"
      :is-session-valid="isSessionValid"
      :has-saved-credentials="hasSavedCredentials"
      :do-auto-login="doAutoLogin"
      @check-in="handleCheckIn"
      @go-login="handleGoLogin"
      @login-success="handleLoginSuccess"
    />
    <LoginView
      v-else-if="currentView === 'login'"
      key="login"
      :saved-credentials="getSavedCredentials()"
      @go-checkin="handleGoCheckin"
      @save="handleSaveCredentials"
      @login-test-success="handleLoginTestSuccess"
    />
    <ActiveSessionView
      v-else-if="currentView === 'active'"
      key="active"
      :check-in-timestamp="checkInTimestamp"
      @check-out="handleCheckOut"
    />
  </Transition>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth.js'

import LoginView from '@/views/LoginView.vue'
import CheckInView from '@/views/CheckInView.vue'
import ActiveSessionView from '@/views/ActiveSessionView.vue'

const API_URL = 'https://shield-api.sociolla.info/auth/login'
const SOURCE  = 'hrms-web-desktop'

const {
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
} = useAuth()

// Reactive check-in timestamp for passing to ActiveSessionView
const checkInTimestamp = ref(getCheckInTimestamp())

// v1.3.0: CheckInView is the default view; 'login' is triggered from CheckInView or manually
const currentView = ref(authState.value.isCheckedIn ? 'active' : 'checkin')

// Temporary store for pending login result (after "Test Login" in LoginView)
const pendingLogin = ref(null)

// --- Auto-login helper (passed as prop to CheckInView) -----------------------

/**
 * Performs login with saved credentials.
 * Returns { success, username, accessToken, accessTokenExpiresAt } or { success: false, error }
 */
async function doAutoLogin() {
  const creds = getSavedCredentials()
  if (!creds) return { success: false, error: 'No saved credentials.' }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'content-type': 'application/json',
        'soc-platform': SOURCE,
      },
      body: JSON.stringify({
        email:    creds.username,
        password: creds.password,
        source:   SOURCE,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data?.message || `Login gagal (${response.status})` }
    }

    const { accessToken, accessTokenExpiresAt } = data?.data ?? {}
    if (!accessToken) {
      return { success: false, error: 'No access token in response.' }
    }

    return { success: true, username: creds.username, accessToken, accessTokenExpiresAt }
  } catch {
    return { success: false, error: 'Network error — please check your connection.' }
  }
}

// --- Event Handlers ----------------------------------------------------------

/** Called when CheckInView detects session still valid → skip login, go active */
function handleCheckIn() {
  checkIn()
  checkInTimestamp.value = getCheckInTimestamp()
  currentView.value = 'active'
}

/** Called when CheckInView wants to show LoginView (no saved creds / user wants to edit) */
function handleGoLogin() {
  currentView.value = 'login'
}

/** Called when CheckInView auto-login succeeds */
function handleLoginSuccess(username, accessToken, expiresAt) {
  login(username, accessToken, expiresAt)
  checkInTimestamp.value = getCheckInTimestamp()
  currentView.value = 'active'
}

/** Called from LoginView — go back to CheckInView */
function handleGoCheckin() {
  pendingLogin.value = null
  currentView.value = 'checkin'
}

/** Called from LoginView Save button — persist credentials */
function handleSaveCredentials(username, password) {
  saveCredentials(username, password)

  // If we have a pending login result (after successful Test Login), apply it immediately
  if (pendingLogin.value) {
    const { username: u, accessToken, accessTokenExpiresAt } = pendingLogin.value
    login(u, accessToken, accessTokenExpiresAt)
    checkInTimestamp.value = getCheckInTimestamp()
    pendingLogin.value = null
    currentView.value = 'active'
  }
  // else: just saved, stay in LoginView so user can test or go back
}

/**
 * Called from LoginView when Test Login succeeds.
 * We store the pending login data but do NOT navigate yet —
 * the user still needs to click "Save" to persist and activate.
 */
function handleLoginTestSuccess(username, accessToken, accessTokenExpiresAt) {
  pendingLogin.value = { username, accessToken, accessTokenExpiresAt }
}

/** Called when Check Out is confirmed in ActiveSessionView → back to CheckInView */
function handleCheckOut() {
  checkOut()
  checkInTimestamp.value = null
  currentView.value = 'checkin'
}

// Re-evaluate session on mount (handles popup re-open after expiry)
onMounted(() => {
  refreshState()
  checkInTimestamp.value = getCheckInTimestamp()
  currentView.value = authState.value.isCheckedIn ? 'active' : 'checkin'
})
</script>
