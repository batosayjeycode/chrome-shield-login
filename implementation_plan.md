# Implementation Plan
## Chrome Extension — Shield Login

**Versi:** 1.0.0  
**Tanggal:** 4 April 2026  
**Status:** ✅ Implemented

---

## Ringkasan

Chrome Extension Shield Login dibangun menggunakan Vue 3 + SCSS + Vite dengan tema **pink pastel dark mode**. Extension mengelola absensi Check In / Check Out dengan session expiry 15 menit dan penyimpanan data di `localStorage`. Tidak ada backend — seluruh state dikelola secara lokal di browser.

---

## Keputusan Final yang Disepakati

| Item | Keputusan |
|---|---|
| Warna tema | Pink pastel dark mode |
| Tampilkan username setelah login | Tidak |
| Reset check-in saat session expired | Ya (via `clearShieldData()`) |
| Ikon extension | Dibuat dari scratch (AI-generated) |
| Bahasa teks UI | English |

---

## Design System — Pink Pastel Dark Mode

| Token | Nilai | Fungsi |
|---|---|---|
| `$color-bg-base` | `#1C0F18` | Background utama |
| `$color-bg-surface` | `#2D1A26` | Card / panel |
| `$color-bg-surface-2` | `#3D2233` | Input background |
| `$color-primary` | `#F9A8D4` | Aksen pink-300 |
| `$color-primary-hover` | `#F472B6` | Hover state |
| `$color-success` | `#86EFAC` | Tombol Check In (green pastel) |
| `$color-danger` | `#FDA4AF` | Tombol Check Out (rose pastel) |
| `$color-text-primary` | `#FDF2F8` | Teks utama |
| `$color-text-muted` | `#9D6B8A` | Teks sekunder |
| `$font-sans` | Inter | Font UI |
| `$font-mono` | JetBrains Mono | Font timer display |

---

## Arsitektur

```
App.vue (state router — computed currentView)
├── LoginView.vue      ← useAuth.js
├── CheckInView.vue    ← useAuth.js
└── ActiveSessionView.vue
         ├── useTimer.js
         └── useAuth.js
              ↕
     useStorage.js (localStorage helpers)
```

**Tidak menggunakan vue-router** — navigasi antar halaman dilakukan via `computed currentView` di `App.vue` dan `<component :is>` + Vue `<Transition>`.

---

## Struktur File

```
chrome-shield-login/
├── public/
│   ├── manifest.json              # Chrome Extension Manifest V3
│   └── icons/
│       ├── icon16.png             # AI-generated, resized via sips
│       ├── icon48.png
│       └── icon128.png
├── src/
│   ├── main.js                    # Entry point Vue 3
│   ├── App.vue                    # State router + Transition
│   ├── assets/
│   │   └── styles/
│   │       ├── _variables.scss    # Design tokens
│   │       ├── _mixins.scss       # Reusable mixins
│   │       └── global.scss        # Reset + base + transition classes
│   ├── composables/
│   │   ├── useStorage.js          # localStorage helpers (get/set/remove/clear)
│   │   ├── useAuth.js             # Login, checkIn, checkOut, session expiry
│   │   └── useTimer.js            # setInterval timer, formatTime, auto-cleanup
│   └── views/
│       ├── LoginView.vue          # Form login + shield logo SVG
│       ├── CheckInView.vue        # Animated clock ring + session countdown
│       └── ActiveSessionView.vue  # Timer display + Check Out button
├── index.html
├── vite.config.js
├── package.json
├── PRD.md
├── implementation_plan.md
└── dist/                          # Build output (load ke Chrome)
    ├── index.html
    ├── manifest.json
    ├── icons/
    └── assets/
        ├── popup.js   (~83 KB)
        └── popup.css  (~11 KB)
```

---

## Detail Implementasi per File

### `useStorage.js`
- Helper `getItem(key)` — `JSON.parse` wrapper, returns `null` jika gagal
- Helper `setItem(key, value)` — `JSON.stringify` wrapper
- Helper `removeItem(key)` dan `clearShieldData()` — clear semua key `shield_*`
- Konstanta `KEYS` — centralized key names

### `useAuth.js`
```js
const SESSION_DURATION = 15 * 60 * 1000  // 15 menit

// Saat session expired → clearShieldData() → return { isLoggedIn: false, isCheckedIn: false }
function readAuthState() { ... }

// Exposed:
login(username, password)   // simpan loginTimestamp, tidak validasi
checkIn()                   // simpan checkInTimestamp
checkOut()                  // hapus checkInTimestamp, set isCheckedIn: false
refreshState()              // re-evaluate, dipanggil di onMounted App.vue
getRemainingSessionMs()     // untuk countdown di CheckInView
```

### `useTimer.js`
```js
const elapsed = ref('00:00:00')

start(checkInTimestamp)  // setInterval setiap 1000ms
stop()                   // clearInterval
reset()                  // stop + reset display
// Auto-cleanup via onUnmounted()
```
Format: `pad(hours):pad(minutes):pad(seconds)` — selalu 2 digit.

### `App.vue` — State Machine
```js
const currentView = computed(() => {
  const { isLoggedIn, isCheckedIn } = authState.value
  if (!isLoggedIn) return 'login'
  if (!isCheckedIn) return 'checkin'
  return 'active'
})
```
`refreshState()` dipanggil `onMounted` untuk cek expired saat popup dibuka.

### `LoginView.vue`
- Shield SVG logo inline (pink gradient)
- Toggle show/hide password
- Loading state 600ms (simulasi UX) sebelum emit `login`
- Disabled submit jika username/password kosong

### `CheckInView.vue`
- Animated pulse rings (CSS keyframes) pada clock icon
- Session countdown (`getRemainingSessionMs`) update setiap detik via `setInterval`
- Cleanup `onUnmounted`

### `ActiveSessionView.vue`
- Timer `#timer-display` — font JetBrains Mono 48px, pink gradient text + glow
- Badge "SESSION ACTIVE" dengan pulse dot animation
- Info: "Checked in at HH:MM"
- `window.confirm()` untuk dialog Check Out
- Timer auto-stop via `onUnmounted` di `useTimer`

---

## localStorage Schema

| Key | Tipe | Ditulis oleh |
|---|---|---|
| `shield_login_timestamp` | `number` (epoch ms) | `useAuth.login()` |
| `shield_checkin_timestamp` | `number` (epoch ms) | `useAuth.checkIn()` |
| `shield_is_logged_in` | `boolean` (JSON string) | `useAuth.login()` |
| `shield_is_checked_in` | `boolean` (JSON string) | `useAuth.checkIn()` / `checkOut()` |
| `shield_username` | `string` | `useAuth.login()` |

---

## Manifest V3

```json
{
  "manifest_version": 3,
  "name": "Shield Login",
  "version": "1.0.0",
  "description": "Check In / Check Out attendance tracker via Chrome Extension",
  "action": {
    "default_popup": "index.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "permissions": []
}
```

> Tidak membutuhkan permission `"storage"` karena menggunakan `localStorage` (bukan `chrome.storage`).

---

## Build & Deployment

```bash
# Install dependencies
npm install

# Development (hot reload)
npm run dev

# Production build → folder dist/
npm run build
```

### Load ke Chrome
1. Buka `chrome://extensions`
2. Aktifkan **Developer Mode**
3. Klik **"Load unpacked"** → pilih folder `dist/`
4. Klik ikon Shield di toolbar Chrome

---

## Verification Results

Semua Acceptance Criteria telah diverifikasi via browser testing:

| AC | Hasil |
|---|---|
| AC-01: Login (tanpa validasi) | ✅ Pass |
| AC-02: Session expiry 15 menit + auto-reset check-in | ✅ Pass |
| AC-03: Check In simpan timestamp + pindah ke timer | ✅ Pass |
| AC-04: Timer real-time format `hh:mm:ss` | ✅ Pass |
| AC-05: Check Out confirm dialog + reset state | ✅ Pass |

Build output: `dist/index.html`, `manifest.json`, `icons/`, `assets/popup.js`, `assets/popup.css` — semua lengkap.
