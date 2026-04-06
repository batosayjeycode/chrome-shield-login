# Implementation Plan
## Chrome Extension — Shield Login

**Versi:** 1.1.0  
**Tanggal:** 6 April 2026  
**Status:** 🔄 Revised — Flow Update

---

## Ringkasan

Chrome Extension Shield Login dibangun menggunakan Vue 3 + SCSS + Vite dengan tema **pink pastel dark mode**. Extension mengelola absensi Check In / Check Out dengan session expiry 15 menit dan penyimpanan data di `localStorage`. Tidak ada backend — seluruh state dikelola secara lokal di browser.

**v1.1.0 — Flow Update:**
Flow navigasi antar halaman direvisi. Halaman pertama yang ditampilkan adalah **CheckInView** (bukan LoginView). LoginView hanya muncul ketika tombol "Check In" diklik dalam kondisi session expired atau belum pernah login. Setelah login berhasil, pengguna langsung masuk ke **ActiveSessionView** (bukan CheckInView). Check Out mengembalikan pengguna ke **CheckInView**.

---

## Keputusan Final yang Disepakati

| Item | Keputusan |
|---|---|
| Warna tema | Pink pastel dark mode |
| Tampilkan username setelah login | Tidak |
| Reset check-in saat session expired | Ya (via `clearShieldData()`) |
| Ikon extension | Dibuat dari scratch (AI-generated) |
| Bahasa teks UI | English |
| Halaman pertama saat extension dibuka | CheckInView (bukan LoginView) |
| Login hanya muncul saat | Tombol Check In diklik + session expired/belum login |
| Setelah login berhasil | Langsung masuk ActiveSessionView (bukan CheckInView) |
| Check Out mengarahkan ke | CheckInView (bukan LoginView) |

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
├── CheckInView.vue    ← useAuth.js  [HALAMAN PERTAMA]
├── LoginView.vue      ← useAuth.js  [hanya jika session expired / belum login]
└── ActiveSessionView.vue
         ├── useTimer.js
         └── useAuth.js
              ↕
     useStorage.js (localStorage helpers)
```

**Tidak menggunakan vue-router** — navigasi antar halaman dilakukan via `computed currentView` di `App.vue` dan `<component :is>` + Vue `<Transition>`.

### Alur Navigasi v1.1.0

```
[Extension Dibuka]
        ↓
 isCheckedIn === true? → YES → ActiveSessionView
        ↓ NO
   CheckInView
        ↓ (klik "Check In")
 session valid (< 15 mnt)? → YES → ActiveSessionView
        ↓ NO
   LoginView
        ↓ (submit berhasil → simpan login + checkIn)
   ActiveSessionView
        ↓ (klik "Check Out" + konfirmasi Ya)
   CheckInView
```

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
login(username, password)   // simpan loginTimestamp + checkInTimestamp (langsung check in)
checkIn()                   // simpan checkInTimestamp (dipakai jika session masih valid)
checkOut()                  // hapus checkInTimestamp + isCheckedIn → kembali ke CheckInView
isSessionValid()            // cek apakah loginTimestamp masih dalam 15 menit
refreshState()              // re-evaluate, dipanggil di onMounted App.vue
getRemainingSessionMs()     // untuk countdown di CheckInView
```

> **Perubahan v1.1.0:** Fungsi `login()` kini sekaligus melakukan check in (simpan `checkInTimestamp` dan set `isCheckedIn: true`) agar setelah login langsung masuk ke `ActiveSessionView`.

### `useTimer.js`
```js
const elapsed = ref('00:00:00')

start(checkInTimestamp)  // setInterval setiap 1000ms
stop()                   // clearInterval
reset()                  // stop + reset display
// Auto-cleanup via onUnmounted()
```
Format: `pad(hours):pad(minutes):pad(seconds)` — selalu 2 digit.

### `App.vue` — State Machine (v1.1.0)
```js
const currentView = computed(() => {
  const { isCheckedIn } = authState.value
  // Prioritas 1: sudah check in → tampilkan timer
  if (isCheckedIn) return 'active'
  // Prioritas 2: belum check in → tampilkan halaman check in
  return 'checkin'
  // LoginView ditampilkan oleh CheckInView sendiri saat tombol diklik
})
```
`refreshState()` dipanggil `onMounted` untuk cek expired saat popup dibuka.

> **Perubahan v1.1.0:** State machine tidak lagi me-route ke `'login'` secara langsung dari `App.vue`. LoginView kini ditangani oleh `CheckInView` — ketika tombol "Check In" diklik dan session tidak valid, `currentView` diset ke `'login'` dari dalam `CheckInView`.

### `LoginView.vue`
- Shield SVG logo inline (pink gradient)
- Toggle show/hide password
- Loading state 600ms (simulasi UX) sebelum emit `login`
- Disabled submit jika username/password kosong

### `CheckInView.vue` (v1.1.0 — Halaman Pertama)
- Animated pulse rings (CSS keyframes) pada clock icon
- Session countdown (`getRemainingSessionMs`) update setiap detik via `setInterval`
- Cleanup `onUnmounted`
- **[NEW v1.1.0]** Saat tombol "Check In" diklik:
  - Jika `isSessionValid() === true` → langsung emit `go-active` (set `isCheckedIn: true` + pindah ke `ActiveSessionView`)
  - Jika `isSessionValid() === false` → emit `go-login` (tampilkan `LoginView`)

### `LoginView.vue` (v1.1.0 — Hanya Ditampilkan Saat Session Expired)
- Shield SVG logo inline (pink gradient)
- Toggle show/hide password
- Loading state 600ms (simulasi UX)
- Disabled submit jika username/password kosong
- **[CHANGED v1.1.0]** Setelah submit berhasil:
  - Simpan `loginTimestamp` + `checkInTimestamp` sekaligus
  - Set `isLoggedIn: true` + `isCheckedIn: true`
  - Emit `login-success` → `App.vue` redirect ke `ActiveSessionView`

### `ActiveSessionView.vue`
- Timer `#timer-display` — font JetBrains Mono 48px, pink gradient text + glow
- Badge "SESSION ACTIVE" dengan pulse dot animation
- Info: "Checked in at HH:MM"
- `window.confirm()` untuk dialog Check Out
- Timer auto-stop via `onUnmounted` di `useTimer`
- **[CHANGED v1.1.0]** Check Out: hapus data checkin → redirect ke `CheckInView` (bukan LoginView)

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

## Verification Results (v1.0.0 — Sebelum Revisi)

Semua Acceptance Criteria v1.0.0 telah diverifikasi via browser testing:

| AC | Hasil |
|---|---|
| AC-01: Login (tanpa validasi) | ✅ Pass |
| AC-02: Session expiry 15 menit + auto-reset check-in | ✅ Pass |
| AC-03: Check In simpan timestamp + pindah ke timer | ✅ Pass |
| AC-04: Timer real-time format `hh:mm:ss` | ✅ Pass |
| AC-05: Check Out confirm dialog + reset state | ✅ Pass |

Build output: `dist/index.html`, `manifest.json`, `icons/`, `assets/popup.js`, `assets/popup.css` — semua lengkap.

---

## Rencana Verifikasi v1.1.0

Setelah implementasi flow baru selesai, verifikasi berikut perlu dilakukan:

| AC | Skenario Uji | Status |
|---|---|---|
| AC-01 | Buka extension saat `isCheckedIn = false` → CheckInView tampil | 🔄 Pending |
| AC-01 | Buka extension saat `isCheckedIn = true` → ActiveSessionView tampil | 🔄 Pending |
| AC-02 | Klik Check In saat session valid → langsung ke ActiveSessionView | 🔄 Pending |
| AC-02 | Klik Check In saat session expired → LoginView tampil | 🔄 Pending |
| AC-03 | Submit login → simpan loginTimestamp + checkInTimestamp → ActiveSessionView | 🔄 Pending |
| AC-04 | Session expiry diperiksa saat tombol Check In diklik | 🔄 Pending |
| AC-05 | Timer berjalan real-time di ActiveSessionView | 🔄 Pending |
| AC-06 | Check Out → konfirmasi Ya → redirect ke CheckInView | 🔄 Pending |
| AC-06 | Check Out → konfirmasi Tidak → timer tetap berjalan | 🔄 Pending |
