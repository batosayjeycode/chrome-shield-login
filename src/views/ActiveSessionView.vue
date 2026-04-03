<template>
  <div class="active-view">
    <!-- Background Glow -->
    <div class="bg-glow bg-glow--top" aria-hidden="true" />
    <div class="bg-glow bg-glow--bottom" aria-hidden="true" />

    <!-- Card -->
    <div class="active-card">
      <!-- Status Badge -->
      <div class="status-badge">
        <span class="status-dot" />
        <span class="status-label">Session Active</span>
      </div>

      <!-- Timer Display -->
      <div class="timer-wrap">
        <p class="timer-subtitle">Time Elapsed</p>
        <div id="timer-display" class="timer-display">{{ elapsed }}</div>
        <p class="timer-note">Since you checked in</p>
      </div>

      <!-- Divider -->
      <div class="divider" />

      <!-- Info row -->
      <div class="info-row">
        <div class="info-item">
          <span class="info-icon" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4l3 3" />
            </svg>
          </span>
          <span class="info-label">Checked in at <strong>{{ checkInTimeLabel }}</strong></span>
        </div>
      </div>

      <!-- Check Out Button -->
      <button id="btn-check-out" class="btn-checkout" @click="handleCheckOut">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Check Out
      </button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useTimer } from '@/composables/useTimer.js'

const props = defineProps({
  checkInTimestamp: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['check-out'])

const { elapsed, start } = useTimer()

const checkInTimeLabel = computed(() => {
  const date = new Date(props.checkInTimestamp)
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
})

function handleCheckOut() {
  const confirmed = window.confirm('Are you sure you want to Check Out?')
  if (confirmed) {
    emit('check-out')
  }
}

onMounted(() => {
  start(props.checkInTimestamp)
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.active-view {
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
    width: 250px;
    height: 250px;
    top: -80px;
    right: -60px;
    background: radial-gradient(circle, rgba(249, 168, 212, 0.18) 0%, transparent 70%);
  }

  &--bottom {
    width: 200px;
    height: 200px;
    bottom: -60px;
    left: -40px;
    background: radial-gradient(circle, rgba(253, 164, 175, 0.12) 0%, transparent 70%);
  }
}

// --- Card --------------------------------------------------------------------
.active-card {
  @include glass-card;
  @include flex-column;
  align-items: center;
  width: 100%;
  max-width: 320px;
  padding: $space-6;
  gap: $space-5;
  position: relative;
  z-index: 1;
}

// --- Status Badge ------------------------------------------------------------
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  background: rgba(134, 239, 172, 0.08);
  border: 1px solid rgba(134, 239, 172, 0.2);
  border-radius: $radius-full;
  padding: $space-1 + 2px $space-4;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: $radius-full;
  background: $color-success;
  box-shadow: 0 0 0 0 rgba(134, 239, 172, 0.4);
  animation: status-pulse 2s ease-in-out infinite;

  @keyframes status-pulse {
    0%   { box-shadow: 0 0 0 0 rgba(134, 239, 172, 0.5); }
    70%  { box-shadow: 0 0 0 8px rgba(134, 239, 172, 0); }
    100% { box-shadow: 0 0 0 0 rgba(134, 239, 172, 0); }
  }
}

.status-label {
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-success;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

// --- Timer -------------------------------------------------------------------
.timer-wrap {
  @include flex-column;
  align-items: center;
  gap: $space-1;
  padding: $space-4 0;
}

.timer-subtitle {
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  color: $color-text-muted;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.timer-display {
  font-family: $font-mono;
  font-size: $font-size-4xl;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  letter-spacing: 0.04em;
  line-height: 1;
  background: linear-gradient(135deg, $color-text-primary 0%, $color-primary 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 12px rgba(249, 168, 212, 0.4));
}

.timer-note {
  font-size: $font-size-xs;
  color: $color-text-subtle;
}

// --- Divider -----------------------------------------------------------------
.divider {
  width: 100%;
  height: 1px;
  background: $color-border;
}

// --- Info Row ----------------------------------------------------------------
.info-row {
  width: 100%;
  @include flex-column;
  gap: $space-2;
}

.info-item {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.info-icon {
  color: $color-text-muted;
  @include flex-center;
  flex-shrink: 0;
}

.info-label {
  font-size: $font-size-sm;
  color: $color-text-muted;

  strong {
    color: $color-text-secondary;
    font-weight: $font-weight-semibold;
  }
}

// --- Checkout Button ---------------------------------------------------------
.btn-checkout {
  @include btn-danger;
  width: 100%;
}
</style>
