<template>
  <Transition name="fade" mode="out-in">
    <LoginView
      v-if="currentView === 'login'"
      key="login"
      @login="handleLogin"
    />
    <CheckInView
      v-else-if="currentView === 'checkin'"
      key="checkin"
      :get-remaining-session-ms="getRemainingSessionMs"
      @check-in="handleCheckIn"
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
import { computed, ref, onMounted } from 'vue'
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
} = useAuth()

// Reactive check-in timestamp for passing to ActiveSessionView
const checkInTimestamp = ref(getCheckInTimestamp())

// Determine which view to show based on auth state
const currentView = computed(() => {
  const { isLoggedIn, isCheckedIn } = authState.value
  if (!isLoggedIn) return 'login'
  if (!isCheckedIn) return 'checkin'
  return 'active'
})

// --- Event Handlers ----------------------------------------------------------

function handleLogin(username, password) {
  login(username, password)
  // checkInTimestamp is null after fresh login
  checkInTimestamp.value = null
}

function handleCheckIn() {
  checkIn()
  checkInTimestamp.value = getCheckInTimestamp()
}

function handleCheckOut() {
  checkOut()
  checkInTimestamp.value = null
}

// Re-evaluate session on mount (checks for expiry)
onMounted(() => {
  refreshState()
  checkInTimestamp.value = getCheckInTimestamp()
})
</script>
