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
        <span class="session-label">Session expires in <strong>{{ remainingLabel }}</strong></span>
      </div>
      <div v-else class="session-info session-info--none">
        <div class="session-dot session-dot--muted" />
        <span class="session-label">No active session</span>
      </div>

      <!-- Check In Button -->
      <button id="btn-check-in" class="btn-checkin" @click="handleCheckIn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        Check In
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
  isSessionValid: {
    type: Function,
    required: true,
  },
})

// v1.1.0: emit 'check-in' when session is valid, 'go-login' when expired/no session
const emit = defineEmits(['check-in', 'go-login'])

const remainingMs = ref(props.getRemainingSessionMs())
let intervalId = null

const hasSession = computed(() => remainingMs.value > 0)

const remainingLabel = computed(() => {
  const ms = remainingMs.value
  if (ms <= 0) return '0:00'
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${String(seconds).padStart(2, '0')}`
})

function updateRemaining() {
  remainingMs.value = props.getRemainingSessionMs()
}

/**
 * v1.1.0 — Core routing logic on Check In button click:
 * - If session is still valid → emit 'check-in' (go to ActiveSessionView directly)
 * - If session expired or no session → emit 'go-login' (show LoginView)
 */
function handleCheckIn() {
  if (props.isSessionValid()) {
    emit('check-in')
  } else {
    emit('go-login')
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
  align-items: center;
  gap: $space-2;
  background: $color-bg-surface-2;
  border: 1px solid $color-border;
  border-radius: $radius-full;
  padding: $space-2 $space-4;

  &--none {
    opacity: 0.6;
  }
}

.session-dot {
  width: 7px;
  height: 7px;
  border-radius: $radius-full;
  background: $color-primary;
  animation: blink 1.5s ease-in-out infinite;

  &--muted {
    background: $color-text-muted;
    animation: none;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
  }
}

.session-label {
  font-size: $font-size-xs;
  color: $color-text-muted;

  strong {
    color: $color-primary;
    font-weight: $font-weight-semibold;
  }
}

// --- Button ------------------------------------------------------------------
.btn-checkin {
  @include btn-success;
  width: 100%;
}
</style>
