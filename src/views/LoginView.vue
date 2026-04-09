<template>
  <div class="login-view">
    <!-- Background decoration -->
    <div class="bg-glow bg-glow--top" aria-hidden="true" />
    <div class="bg-glow bg-glow--bottom" aria-hidden="true" />

    <!-- Card -->
    <div class="login-card">
      <!-- Top bar: back button -->
      <div class="top-bar">
        <button
          id="btn-back-to-checkin"
          type="button"
          class="btn-back"
          @click="emit('go-checkin')"
          aria-label="Back to Check In"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Check In
        </button>
      </div>

      <!-- Logo -->
      <div class="logo-wrap">
        <div class="logo-icon">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 2L4 7V16C4 22.627 9.373 28 16 30C22.627 28 28 22.627 28 16V7L16 2Z" fill="url(#shield-gradient)" />
            <path d="M12 16.5L14.5 19L20 13.5" stroke="#1C0F18" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <defs>
              <linearGradient id="shield-gradient" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#F9A8D4" />
                <stop offset="100%" stop-color="#F472B6" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1 class="logo-title">Shield Login</h1>
      </div>

      <!-- Heading -->
      <div class="heading-wrap">
        <h2 class="heading">Login Settings</h2>
        <p class="subheading">Save your credentials for quick check-in</p>
      </div>

      <!-- Saved status badge -->
      <div v-if="hasSaved && !testSuccess && !saveSuccess && !errorMsg" class="saved-badge">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Credentials saved
      </div>

      <!-- Form -->
      <form class="login-form" @submit.prevent novalidate>
        <!-- Username field -->
        <div class="field-group">
          <label class="field-label" for="input-username">Username / Email</label>
          <div class="input-wrap">
            <span class="input-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <input
              id="input-username"
              v-model="username"
              type="text"
              class="field-input"
              placeholder="Enter your username or email"
              autocomplete="username"
              required
            />
          </div>
        </div>

        <!-- Password field -->
        <div class="field-group">
          <label class="field-label" for="input-password">Password</label>
          <div class="input-wrap">
            <span class="input-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <input
              id="input-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="field-input"
              placeholder="Enter your password"
              autocomplete="current-password"
              required
            />
            <button
              type="button"
              class="toggle-password"
              @click="showPassword = !showPassword"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
            >
              <svg v-if="!showPassword" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Error message -->
        <div v-if="errorMsg" class="error-msg" role="alert">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {{ errorMsg }}
        </div>

        <!-- Success message after test login -->
        <div v-if="testSuccess" class="success-msg" role="status">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Test login berhasil! Klik Save untuk menyimpan.
        </div>

        <!-- Success message after save -->
        <div v-if="saveSuccess" class="success-msg" role="status">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Credentials berhasil disimpan!
        </div>

        <!-- Action buttons -->
        <div class="btn-group">
          <!-- Test Login button -->
          <button
            id="btn-test-login"
            type="button"
            class="btn-test"
            :class="{ loading: isLoading }"
            :disabled="isLoading || !username || !password"
            @click="handleTestLogin"
          >
            <span v-if="!isLoading" class="btn-test__content">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="10 8 16 12 10 16" />
              </svg>
              Test
            </span>
            <span v-else class="spinner" />
          </button>

          <!-- Save button -->
          <button
            id="btn-save-credentials"
            type="button"
            class="btn-save"
            :disabled="!username || !password"
            @click="handleSave"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            Save
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  savedCredentials: {
    type: Object,
    default: null,
  },
  doCheckAttendance: {
    type: Function,
    required: true,
  }
})

// Emits: go-checkin when user clicks back, save when user saves, login when test succeeds
const emit = defineEmits(['go-checkin', 'save', 'login', 'login-test-success'])

const API_URL = 'https://shield-api.sociolla.info/auth/login'
const SOURCE  = 'hrms-web-desktop'

const username     = ref('')
const password     = ref('')
const showPassword = ref(false)
const isLoading    = ref(false)
const errorMsg     = ref('')
const testSuccess  = ref(false)
const hasSaved     = ref(false)
const saveSuccess  = ref(false)

// Pre-fill form with saved credentials if any
onMounted(() => {
  if (props.savedCredentials) {
    username.value = props.savedCredentials.username || ''
    password.value = props.savedCredentials.password || ''
    hasSaved.value = true
  }
})

async function handleTestLogin() {
  if (!username.value || !password.value) return

  isLoading.value  = true
  errorMsg.value   = ''
  testSuccess.value = false
  saveSuccess.value = false
  hasSaved.value = false

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'content-type': 'application/json',
        'soc-platform': SOURCE,
      },
      body: JSON.stringify({
        email:    username.value,
        password: password.value,
        source:   SOURCE,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      errorMsg.value = data?.message || `Login failed (${response.status})`
      return
    }

    const { accessToken, accessTokenExpiresAt } = data?.data ?? {}
    if (!accessToken) {
      errorMsg.value = 'No access token in response.'
      return
    }

    // Test login berhasil — emit ke parent tapi tidak navigate, user bisa simpan dulu
    testSuccess.value = true
    
    emit('login-test-success', username.value, accessToken, accessTokenExpiresAt)
        
  } catch (err) {
    errorMsg.value = 'Network error — please check your connection.'
    console.error('[Shield] Login error:', err)
  } finally {
    isLoading.value = false
  }
}

function handleSave() {
  saveSuccess.value = false
  if (!username.value || !password.value) return
  hasSaved.value = false
  testSuccess.value = false
  errorMsg.value = ''
  saveSuccess.value = true
  emit('save', username.value, password.value)
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.login-view {
  @include flex-center;
  min-height: $popup-min-height;
  padding: $space-6;
  position: relative;
}

// --- Background Glow ---------------------------------------------------------
.bg-glow {
  position: absolute;
  width: 200px;
  height: 200px;
  border-radius: $radius-full;
  filter: blur(60px);
  pointer-events: none;
  z-index: 0;

  &--top {
    top: -60px;
    right: -40px;
    background: radial-gradient(circle, rgba(249, 168, 212, 0.2) 0%, transparent 70%);
  }

  &--bottom {
    bottom: -60px;
    left: -40px;
    background: radial-gradient(circle, rgba(244, 114, 182, 0.12) 0%, transparent 70%);
  }
}

// --- Card --------------------------------------------------------------------
.login-card {
  @include glass-card;
  @include flex-column;
  width: 100%;
  max-width: 320px;
  padding: $space-5 $space-6 $space-8;
  gap: $space-5;
  position: relative;
  z-index: 1;
}

// --- Top Bar -----------------------------------------------------------------
.top-bar {
  display: flex;
  align-items: center;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: $space-1 + 2px;
  background: none;
  border: none;
  color: $color-text-muted;
  font-family: $font-sans;
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  cursor: pointer;
  padding: $space-1 $space-2;
  border-radius: $radius-md;
  transition: color $transition-fast, background $transition-fast;
  letter-spacing: 0.01em;

  &:hover {
    color: $color-primary;
    background: $color-primary-subtle;
  }
}

// --- Logo --------------------------------------------------------------------
.logo-wrap {
  @include flex-center;
  flex-direction: column;
  gap: $space-3;
}

.logo-icon {
  @include flex-center;
  width: 56px;
  height: 56px;
  background: $color-primary-subtle;
  border: 1px solid $color-border-hover;
  border-radius: $radius-xl;
  box-shadow: $shadow-pink;
}

.logo-title {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $color-primary;
  letter-spacing: -0.01em;
}

// --- Heading -----------------------------------------------------------------
.heading-wrap {
  text-align: center;
}

.heading {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  letter-spacing: -0.02em;
  margin-bottom: $space-1;
}

.subheading {
  font-size: $font-size-sm;
  color: $color-text-muted;
  font-weight: $font-weight-regular;
}

// --- Saved Badge -------------------------------------------------------------
.saved-badge {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  align-self: center;
  background: rgba(134, 239, 172, 0.08);
  border: 1px solid rgba(134, 239, 172, 0.2);
  border-radius: $radius-full;
  padding: $space-1 + 2px $space-3;
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  color: $color-success;
  letter-spacing: 0.02em;
}

// --- Form --------------------------------------------------------------------
.login-form {
  @include flex-column;
  gap: $space-4;
}

.field-group {
  @include flex-column;
  gap: $space-2;
}

.field-label {
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  color: $color-text-secondary;
  padding-left: 2px;
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.field-input {
  @include input-field;
  padding-left: $space-10;
  padding-right: $space-10;
}

.input-icon {
  position: absolute;
  left: $space-3;
  color: $color-text-muted;
  @include flex-center;
  pointer-events: none;
}

.toggle-password {
  position: absolute;
  right: $space-3;
  background: none;
  border: none;
  color: $color-text-muted;
  cursor: pointer;
  padding: 2px;
  @include flex-center;
  border-radius: $radius-sm;
  transition: color $transition-fast;

  &:hover {
    color: $color-primary;
  }
}

// --- Messages ----------------------------------------------------------------
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

  svg {
    flex-shrink: 0;
  }
}

.success-msg {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-2 $space-3;
  background: rgba(134, 239, 172, 0.1);
  border: 1px solid rgba(134, 239, 172, 0.25);
  border-radius: $radius-md;
  color: $color-success;
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  line-height: 1.4;

  svg {
    flex-shrink: 0;
  }

  strong {
    font-weight: $font-weight-bold;
  }
}

// --- Button Group ------------------------------------------------------------
.btn-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-3;
  margin-top: $space-1;
}

// --- Test Login Button -------------------------------------------------------
.btn-test {
  @include btn-base;
  background: $color-bg-surface-2;
  color: $color-text-secondary;
  border: 1px solid $color-border-hover;
  width: auto;

  &:hover:not(:disabled) {
    background: $color-primary-subtle;
    color: $color-primary;
    border-color: $color-primary;
    transform: translateY(-1px);
  }

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

// --- Save Button -------------------------------------------------------------
.btn-save {
  @include btn-primary;
  width: auto;
}

.spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(28, 15, 24, 0.3);
  border-top-color: #1C0F18;
  border-radius: $radius-full;
  animation: spin 0.7s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
}
</style>
