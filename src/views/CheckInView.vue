<template>
  <div class="checkin-view">
    <!-- Background Glow -->
    <div class="bg-glow bg-glow--top" aria-hidden="true" />
    <div class="bg-glow bg-glow--bottom" aria-hidden="true" />

    <!-- Card -->
    <div class="checkin-card">
      <!-- Icon -->
      <div class="icon-wrap">
        <div class="icon-ring icon-ring--outer">
          <div class="icon-ring icon-ring--inner">
            <span class="icon-emoji" aria-hidden="true">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="#86EFAC" stroke-width="1.5" />
                <path d="M12 6v6l4 2" stroke="#86EFAC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
          </div>
        </div>
      </div>

      <!-- Text -->
      <div class="text-wrap">
        <h2 class="heading">Ready to Start?</h2>
        <p class="subheading">Tap <strong>Check In</strong> to begin your session</p>
      </div>

      <!-- Session expire info — only shown if session exists -->
      <div v-if="hasSession" class="session-info">
        <div class="session-dot" />
        <span class="session-label">
          Session expires at
          <strong class="session-datetime">{{ expiryLabel }}</strong>
        </span>
      </div>
      <div v-else class="session-info session-info--none">
        <div class="session-dot session-dot--muted" />
        <span class="session-label">No active session</span>
      </div>

      <!-- Countdown — only shown if session exists -->
      <div v-if="hasSession" class="countdown">
        <div class="countdown-unit">
          <span class="countdown-value">{{ countdownParts.days }}</span>
          <span class="countdown-label">Days</span>
        </div>
        <span class="countdown-sep">:</span>
        <div class="countdown-unit">
          <span class="countdown-value">{{ countdownParts.hours }}</span>
          <span class="countdown-label">Hours</span>
        </div>
        <span class="countdown-sep">:</span>
        <div class="countdown-unit">
          <span class="countdown-value">{{ countdownParts.minutes }}</span>
          <span class="countdown-label">Minutes</span>
        </div>
        <span class="countdown-sep">:</span>
        <div class="countdown-unit">
          <span class="countdown-value">{{ countdownParts.seconds }}</span>
          <span class="countdown-label">Seconds</span>
        </div>
      </div>

      <!-- Check In Button -->
      <button id="btn-check-in" class="btn-checkin" :class="{ loading: isCheckingIn }" :disabled="isCheckingIn" @click="handleCheckIn">
        <span v-if="!isCheckingIn" class="btn-checkin__content">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          Check In
        </span>
        <span v-else class="spinner" />
      </button>

      <!-- Error message (auto-login failure) -->
      <div v-if="checkInError" class="error-msg" role="alert">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        {{ checkInError }}
      </div>

      <!-- Edit credentials shortcut -->
      <button
        id="btn-edit-credentials"
        type="button"
        class="btn-edit-creds"
        @click="emit('go-login')"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
        Edit Login Credentials
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  getRemainingSessionMs: {
    type: Function,
    required: true,
  },
  getExpiresAt: {
    type: Function,
    required: true,
  },
  isSessionValid: {
    type: Function,
    required: true,
  },
  hasSavedCredentials: {
    type: Function,
    required: true,
  },
  doAutoLogin: {
    type: Function,
    required: true,
  },
  doCheckAttendance: {
    type: Function,
    required: true,
  },
  doCheckIn: {
    type: Function,
    required: true,
  },
})

// Emits:
//   'check-in'       — session valid, go straight to ActiveSession
//   'go-login'       — go to LoginView (edit credentials / no saved creds)
//   'login-success'  — auto-login succeeded, pass token data up
const emit = defineEmits(['check-in', 'go-login', 'login-success'])

const remainingMs   = ref(props.getRemainingSessionMs())
const isCheckingIn  = ref(false)
const checkInError  = ref('')
let intervalId = null

const hasSession = computed(() => remainingMs.value > 0)

// Months abbreviation array for formatting
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

/**
 * Format the stored accessTokenExpiresAt as "dd/mmm/yyyy  hh:mm:ss" (local time).
 */
const expiryLabel = computed(() => {
  const iso = props.getExpiresAt()
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d)) return '—'
  const dd  = String(d.getDate()).padStart(2, '0')
  const mmm = MONTHS[d.getMonth()]
  const yyyy = d.getFullYear()
  const hh  = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  const ss  = String(d.getSeconds()).padStart(2, '0')
  return `${dd}/${mmm}/${yyyy}  ${hh}:${min}:${ss}`
})

function updateRemaining() {
  remainingMs.value = props.getRemainingSessionMs()
}

/**
 * Break remainingMs into Days / Hours / Minutes / Seconds parts.
 */
const countdownParts = computed(() => {
  const ms = Math.max(0, remainingMs.value)
  const totalSeconds = Math.floor(ms / 1000)
  const days    = Math.floor(totalSeconds / 86400)
  const hours   = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return {
    days:    String(days).padStart(2, '0'),
    hours:   String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
  }
})

/**
 * v1.3.0 — Core routing logic on Check In button click:
 * 1. If session is still valid → emit 'check-in' (go directly to ActiveSessionView)
 * 2. If saved credentials exist → auto-login, then emit 'login-success'
 * 3. No saved credentials → emit 'go-login' (show LoginView)
 */
async function handleCheckIn() {
  checkInError.value = ''

  if (props.isSessionValid()) {
    const resultAttendance = await props.doCheckAttendance()  
    if (resultAttendance.success) {
      const {data, isCheckedIn} = resultAttendance.data || {}
      if(isCheckedIn) {
        emit('check-in', data.checkin_time || null)
        return
      }
      const resultCheckIn = await props.doCheckIn()
      if (resultCheckIn.success) {
        const {data} = resultCheckIn.data || {}
        emit('check-in', data.checkin_time || null)
        return
      }
      checkInError.value = resultCheckIn.error || 'Check In gagal. Periksa kembali credentials Anda.'
      return
    }
    checkInError.value = resultAttendance.error || 'Check attendance gagal. Periksa kembali credentials Anda.'
    return
  }

  if (!props.hasSavedCredentials()) {
    emit('go-login')
    return
  }

  // Auto-login with saved credentials
  isCheckingIn.value = true
  try {
    const result = await props.doAutoLogin()
    if (result.success) {
      const resultAttendance = await props.doCheckAttendance()
      if (resultAttendance.success) {
        const {data, isCheckedIn} = resultAttendance.data || {}
        if(isCheckedIn) {
          emit('login-success', result.username, result.accessToken, result.accessTokenExpiresAt, data.checkin_time || null)
          return
        }
        const resultCheckIn = await props.doCheckIn()
        if (resultCheckIn.success) {
          const {data} = resultCheckIn.data || {}
          emit('login-success', result.username, result.accessToken, result.accessTokenExpiresAt, data.checkin_time || null)
          return
        }
        checkInError.value = resultCheckIn.error || 'Check In gagal. Periksa kembali credentials Anda.'
        return
      }
      checkInError.value = resultAttendance.error || 'Check attendance gagal. Periksa kembali credentials Anda.'
      return
    }
    checkInError.value = result.error || 'Login gagal. Periksa kembali credentials Anda.'
  } catch {
    checkInError.value = 'Network error — please check your connection.'
  } finally {
    isCheckingIn.value = false
  }
}

onMounted(() => {
  updateRemaining()
  intervalId = setInterval(updateRemaining, 1000)
})

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.checkin-view {
  @include flex-center;
  min-height: $popup-min-height;
  padding: $space-6;
  position: relative;
}

// --- Background Glow ---------------------------------------------------------
.bg-glow {
  position: absolute;
  border-radius: $radius-full;
  filter: blur(70px);
  pointer-events: none;
  z-index: 0;

  &--top {
    width: 220px;
    height: 220px;
    top: -70px;
    left: 50%;
    transform: translateX(-50%);
    background: radial-gradient(circle, rgba(134, 239, 172, 0.15) 0%, transparent 70%);
  }

  &--bottom {
    width: 180px;
    height: 180px;
    bottom: -50px;
    right: -30px;
    background: radial-gradient(circle, rgba(249, 168, 212, 0.12) 0%, transparent 70%);
  }
}

// --- Card --------------------------------------------------------------------
.checkin-card {
  @include glass-card;
  @include flex-column;
  align-items: center;
  width: 100%;
  max-width: 320px;
  padding: $space-10 $space-6 $space-8;
  gap: $space-6;
  position: relative;
  z-index: 1;
  text-align: center;
}

// --- Icon Ring ---------------------------------------------------------------
.icon-wrap {
  @include flex-center;
}

.icon-ring {
  @include flex-center;
  border-radius: $radius-full;

  &--outer {
    width: 100px;
    height: 100px;
    background: rgba(134, 239, 172, 0.06);
    border: 1px solid rgba(134, 239, 172, 0.15);
    animation: pulse-outer 2.5s ease-in-out infinite;
  }

  &--inner {
    width: 72px;
    height: 72px;
    background: rgba(134, 239, 172, 0.1);
    border: 1px solid rgba(134, 239, 172, 0.25);
    animation: pulse-inner 2.5s ease-in-out infinite;
  }
}

@keyframes pulse-outer {
  0%, 100% { transform: scale(1); opacity: 1; }
  50%       { transform: scale(1.04); opacity: 0.85; }
}

@keyframes pulse-inner {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.06); }
}

// --- Text --------------------------------------------------------------------
.text-wrap {
  @include flex-column;
  gap: $space-2;
}

.heading {
  font-size: $font-size-2xl;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  letter-spacing: -0.02em;
}

.subheading {
  font-size: $font-size-sm;
  color: $color-text-muted;
  line-height: $line-height-loose;

  strong {
    color: $color-success;
    font-weight: $font-weight-semibold;
  }
}

// --- Session Info ------------------------------------------------------------
.session-info {
  display: flex;
  align-items: flex-start;
  gap: $space-2;
  background: $color-bg-surface-2;
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  padding: $space-3 $space-4;

  &--none {
    opacity: 0.6;
    align-items: center;
  }
}

.session-dot {
  width: 7px;
  height: 7px;
  border-radius: $radius-full;
  background: $color-primary;
  animation: blink 1.5s ease-in-out infinite;
  margin-top: 3px; // align dot with first text line
  flex-shrink: 0;

  &--muted {
    background: $color-text-muted;
    animation: none;
    margin-top: 0;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
  }
}

.session-label {
  display: flex;
  flex-direction: column;
  gap: $space-1;
  font-size: $font-size-xs;
  color: $color-text-muted;
  line-height: 1.4;
}

.session-datetime {
  color: $color-primary;
  font-weight: $font-weight-semibold;
  font-size: $font-size-xs;
  letter-spacing: 0.01em;
}

// --- Countdown ---------------------------------------------------------------
.countdown {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  width: 100%;
}

.countdown-unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: $color-bg-surface-2;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  padding: $space-2 $space-3;
  min-width: 52px;
}

.countdown-value {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: $color-primary;
  line-height: 1;
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
}

.countdown-label {
  font-size: 9px;
  font-weight: $font-weight-medium;
  color: $color-text-muted;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.countdown-sep {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $color-text-muted;
  line-height: 1;
  margin-bottom: $space-4; // push up to align with numbers, not labels
  opacity: 0.5;
}

// --- Button ------------------------------------------------------------------
.btn-checkin {
  @include btn-success;
  width: 100%;

  &.loading {
    cursor: wait;
    opacity: 0.8;
  }

  &__content {
    display: inline-flex;
    align-items: center;
    gap: $space-2;
  }
}

.spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(10, 38, 21, 0.3);
  border-top-color: #0a2615;
  border-radius: $radius-full;
  animation: spin 0.7s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
}

// --- Error Message -----------------------------------------------------------
.error-msg {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-2 $space-3;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: $radius-md;
  color: #f87171;
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  line-height: 1.4;
  width: 100%;
  box-sizing: border-box;

  svg {
    flex-shrink: 0;
  }
}

// --- Edit Credentials Shortcut -----------------------------------------------
.btn-edit-creds {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  background: none;
  border: none;
  color: $color-text-muted;
  font-family: $font-sans;
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  cursor: pointer;
  padding: $space-2 $space-3;
  border-radius: $radius-md;
  transition: color $transition-fast, background $transition-fast;
  letter-spacing: 0.01em;
  align-self: center;

  &:hover {
    color: $color-primary;
    background: $color-primary-subtle;
  }
}
</style>
