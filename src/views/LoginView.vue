<template>
  <div class="login-view">
    <!-- Background decoration -->
    <div class="bg-glow bg-glow--top" aria-hidden="true" />
    <div class="bg-glow bg-glow--bottom" aria-hidden="true" />

    <!-- Card -->
    <div class="login-card">
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
        <h2 class="heading">Welcome Back</h2>
        <p class="subheading">Sign in to track your session</p>
      </div>

      <!-- Form -->
      <form class="login-form" @submit.prevent="handleSubmit" novalidate>
        <!-- Username field -->
        <div class="field-group">
          <label class="field-label" for="input-username">Username</label>
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
              placeholder="Enter your username"
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

        <!-- Submit button -->
        <button
          id="btn-submit-login"
          type="submit"
          class="btn-submit"
          :class="{ loading: isLoading }"
          :disabled="isLoading || !username || !password"
        >
          <span v-if="!isLoading">Sign In</span>
          <span v-else class="spinner" />
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// v1.2.0: Calls the Shield API; emits access_token on success.
const emit = defineEmits(['login'])

const API_URL = 'https://shield-api.sociolla.info/auth/login'
const SOURCE  = 'hrms-web-desktop'

const username    = ref('')
const password    = ref('')
const showPassword = ref(false)
const isLoading   = ref(false)
const errorMsg    = ref('')

async function handleSubmit() {
  if (!username.value || !password.value) return

  isLoading.value = true
  errorMsg.value  = ''

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
      // Surface the API error message when available
      errorMsg.value = data?.message || `Login failed (${response.status})`
      return
    }

    const { accessToken, accessTokenExpiresAt } = data?.data ?? {}
    if (!accessToken) {
      errorMsg.value = 'No access token in response.'
      return
    }

    emit('login', username.value, accessToken, accessTokenExpiresAt)
  } catch (err) {
    errorMsg.value = 'Network error — please check your connection.'
    console.error('[Shield] Login error:', err)
  } finally {
    isLoading.value = false
  }
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
  padding: $space-8 $space-6;
  gap: $space-6;
  position: relative;
  z-index: 1;
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

  svg {
    flex-shrink: 0;
  }
}

// --- Submit Button -----------------------------------------------------------
.btn-submit {
  @include btn-primary;
  margin-top: $space-2;

  &.loading {
    cursor: wait;
    opacity: 0.8;
  }
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
