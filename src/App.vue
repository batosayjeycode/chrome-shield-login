<template>
  <Transition name="fade" mode="out-in">
    <!-- v1.1.0: CheckInView is the first page shown -->
    <CheckInView
      v-if="currentView === 'checkin'"
      key="checkin"
      :get-remaining-session-ms="getRemainingSessionMs"
      :is-session-valid="isSessionValid"
      @check-in="handleCheckIn"
      @go-login="handleGoLogin"
    />
    <LoginView
      v-else-if="currentView === 'login'"
      key="login"
      @login="handleLogin"
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

const {
  authState,
  login,
  checkIn,
  checkOut,
  getCheckInTimestamp,
  refreshState,
  getRemainingSessionMs,
  isSessionValid,
} = useAuth()

// Reactive check-in timestamp for passing to ActiveSessionView
const checkInTimestamp = ref(getCheckInTimestamp())

// v1.1.0: Only two primary routes — 'checkin' or 'active'.
// 'login' is triggered manually from CheckInView when session is expired.
const currentView = ref(authState.value.isCheckedIn ? 'active' : 'checkin')

// --- Event Handlers ----------------------------------------------------------

// Called when CheckInView detects session is still valid → skip login, go active
function handleCheckIn() {
  checkIn()
  checkInTimestamp.value = getCheckInTimestamp()
  currentView.value = 'active'
}

// Called when CheckInView detects session is expired / user never logged in
function handleGoLogin() {
  currentView.value = 'login'
}

// Called after LoginView submit — login() already checks in, go straight to active
function handleLogin(username, password) {
  login(username, password)
  checkInTimestamp.value = getCheckInTimestamp()
  currentView.value = 'active'
}

// Called when Check Out is confirmed in ActiveSessionView → back to CheckInView
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
