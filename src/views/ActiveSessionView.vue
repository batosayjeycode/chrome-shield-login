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
      <button id="btn-check-out" class="btn-checkout" @click="openConfirmModal">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Check Out
      </button>
    </div>

    <!-- Confirm Modal -->
    <Transition name="modal-fade">
      <div v-if="showConfirmModal" class="modal-overlay" @click.self="closeConfirmModal">
        <div class="modal-box">
          <div class="modal-icon modal-icon--warn">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </div>
          <h2 class="modal-title">Check Out?</h2>
          <p class="modal-message">Are you sure you want to end your current session?</p>
          <div class="modal-actions">
            <button id="modal-btn-cancel" class="modal-btn modal-btn--cancel" @click="closeConfirmModal">
              Cancel
            </button>
            <button id="modal-btn-confirm" class="modal-btn modal-btn--confirm" :disabled="isLoading" @click="handleCheckOut">
              <span v-if="isLoading" class="spinner" />
              <span v-else>Yes</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Alert Modal -->
    <Transition name="modal-fade">
      <div v-if="showAlertModal" class="modal-overlay" @click.self="closeAlertModal">
        <div class="modal-box">
          <div class="modal-icon modal-icon--error">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 class="modal-title">Something went wrong</h2>
          <p class="modal-message">{{ alertMessage }}</p>
          <div class="modal-actions">
            <button id="modal-btn-ok" class="modal-btn modal-btn--confirm" @click="closeAlertModal">
              OK
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useTimer } from '@/composables/useTimer.js'

const props = defineProps({
  checkInTimestamp: {
    type: [String, Number],
    required: true,
  },
  doCheckAttendance: {
    type: Function,
    required: true,
  },
  doCheckOut: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits(['check-out'])

const { elapsed, start } = useTimer()

// Modal state
const showConfirmModal = ref(false)
const showAlertModal = ref(false)
const alertMessage = ref('')
const isLoading = ref(false)

const checkInTimeLabel = computed(() => {
  const date = new Date(props.checkInTimestamp)
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
})

function openConfirmModal() {
  showConfirmModal.value = true
}

function closeConfirmModal() {
  if (isLoading.value) return
  showConfirmModal.value = false
}

function showAlert(message) {
  alertMessage.value = message
  showAlertModal.value = true
}

function closeAlertModal() {
  showAlertModal.value = false
  alertMessage.value = ''
}

async function handleCheckOut() {
  isLoading.value = true
  try {
    const resultAttendance = await props.doCheckAttendance()
    if (!resultAttendance.success) {
      closeConfirmModal()
      showAlert(resultAttendance.error)
      return
    }
    const { isCheckedIn } = resultAttendance.data || {}
    if (!isCheckedIn) {
      emit('check-out')
      return
    }
    const resultCheckOut = await props.doCheckOut()
    if (!resultCheckOut.success) {
      closeConfirmModal()
      showAlert(resultCheckOut.error)
      return
    }
    emit('check-out')
  } finally {
    isLoading.value = false
    showConfirmModal.value = false
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

// --- Modal Overlay -----------------------------------------------------------
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(28, 15, 24, 0.75);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  padding: $space-4;
}

// --- Modal Box ---------------------------------------------------------------
.modal-box {
  background: $color-bg-surface;
  border: 1px solid $color-border-hover;
  border-radius: $radius-xl;
  box-shadow: $shadow-lg, $shadow-pink;
  padding: $space-6;
  width: 100%;
  max-width: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-4;
  text-align: center;
}

// --- Modal Icon --------------------------------------------------------------
.modal-icon {
  width: 52px;
  height: 52px;
  border-radius: $radius-full;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &--warn {
    background: rgba(253, 164, 175, 0.12);
    border: 1px solid rgba(253, 164, 175, 0.25);
    color: $color-danger;
    box-shadow: 0 0 20px rgba(253, 164, 175, 0.15);
  }

  &--error {
    background: rgba(253, 164, 175, 0.12);
    border: 1px solid rgba(253, 164, 175, 0.25);
    color: $color-danger;
    box-shadow: 0 0 20px rgba(253, 164, 175, 0.15);
  }
}

// --- Modal Text --------------------------------------------------------------
.modal-title {
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  margin: 0;
  line-height: $line-height-tight;
}

.modal-message {
  font-size: $font-size-sm;
  color: $color-text-muted;
  margin: 0;
  line-height: $line-height-normal;
}

// --- Modal Actions -----------------------------------------------------------
.modal-actions {
  display: flex;
  gap: $space-3;
  width: 100%;
  margin-top: $space-1;
}

.modal-btn {
  flex: 1;
  padding: $space-2 + 2px $space-4;
  border-radius: $radius-md;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  font-family: $font-sans;
  cursor: pointer;
  border: none;
  transition: background $transition-fast, color $transition-fast, box-shadow $transition-fast, opacity $transition-fast;
  line-height: 1;

  &--cancel {
    background: $color-bg-surface-2;
    color: $color-text-muted;
    border: 1px solid $color-border;

    &:hover {
      background: $color-bg-surface-3;
      color: $color-text-secondary;
      border-color: $color-border-hover;
    }
  }

  &--confirm {
    background: linear-gradient(135deg, $color-danger 0%, $color-danger-hover 100%);
    color: $color-bg-base;
    box-shadow: 0 0 12px $color-danger-glow;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $space-2;

    &:hover:not(:disabled) {
      box-shadow: 0 0 20px $color-danger-glow;
      filter: brightness(1.08);
    }

    &:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }
  }
}

// --- Spinner -----------------------------------------------------------------
.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(28, 15, 24, 0.35);
  border-top-color: $color-bg-base;
  border-radius: $radius-full;
  animation: spin 0.65s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
}

// --- Modal Transition --------------------------------------------------------
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity $transition-base;

  .modal-box {
    transition: transform $transition-spring, opacity $transition-base;
  }
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;

  .modal-box {
    transform: scale(0.88) translateY(8px);
    opacity: 0;
  }
}
</style>
