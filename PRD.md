# Product Requirement Document (PRD)
## Chrome Extension — Shield Login

**Versi:** 1.1.0  
**Tanggal:** 6 April 2026  
**Status:** 🔄 Revised — v1.1.0  

---

## 1. Latar Belakang & Tujuan

Shield Login adalah sebuah Chrome Extension yang berfungsi sebagai sistem absensi digital sederhana (Check In / Check Out). Extension ini memungkinkan pengguna untuk login, mencatat waktu masuk (check in), memantau durasi waktu kerja secara real-time, dan mencatat waktu keluar (check out) — semuanya langsung dari browser Chrome.

**Tujuan utama:**
- Menyediakan antarmuka absensi yang cepat dan mudah diakses via browser
- Menyimpan state sesi secara lokal (localStorage) tanpa ketergantungan server
- Menerapkan expired session otomatis untuk keamanan dasar

---

## 2. Tech Stack

| Komponen | Teknologi |
|---|---|
| Bahasa | JavaScript ES2020+ (tanpa TypeScript) |
| UI Framework | Vue 3 (Composition API) + Single File Components (.vue) |
| Styling | SCSS |
| Bundler | Vite (dengan plugin @vitejs/plugin-vue) |
| Storage | Browser localStorage |
| Target | Chrome Extension (Manifest V3) |

---

## 3. Ruang Lingkup Produk

### 3.1 In Scope
- Form login dengan field username dan password
- Mekanisme expired session (15 menit setelah login berhasil)
- Tombol Check In yang menyimpan timestamp ke localStorage
- Timer real-time (format hh:mm:ss) yang berjalan sejak check in
- Tombol Check Out dengan dialog konfirmasi
- Logika routing halaman berdasarkan state session dan status check in/out

### 3.2 Out of Scope
- Validasi kredensial pengguna (untuk tahap testing: semua input diterima)
- Koneksi ke backend/API eksternal
- Notifikasi push / alarm otomatis
- Multi-user / multi-akun
- Riwayat / log absensi historis

---

## 4. Alur Kerja (User Flow)

```
[Extension Diklik]
        |
        v
  [Apakah sudah dalam ActiveSessionView?]
        |                         |
       YA                       TIDAK
        |                         |
        v                         v
[ActiveSessionView]        [CheckInView]
[Timer Running +           [Tombol Check In]
 Tombol Check Out]               |
        |                  Klik Check In
  Klik Check Out                 |
        |             [Apakah session masih valid? (< 15 menit)]
  [Confirm Dialog]              |                    |
        |                      YA                  TIDAK / Belum login
       Ya                      |                    |
        |                      v                    v
  [Reset State]         [ActiveSessionView]   [LoginView]
        |               [Langsung tanpa login] [Form Username & Password]
        v                                           |
  [CheckInView]                                  Submit
                                                   |
                                             [Login Berhasil]
                                             [Set expiry +15 menit]
                                                   |
                                                   v
                                          [ActiveSessionView]
```

---

## 5. Spesifikasi Halaman & Komponen

### 5.1 Halaman Check In (CheckInView)

**Ditampilkan ketika:**
- Extension pertama kali diklik, dan
- Pengguna belum berada di ActiveSessionView (isCheckedIn === false)

**Elemen UI:**

| Elemen | ID / Selector | Keterangan |
|---|---|---|
| Tombol Check In | #btn-check-in | Trigger aksi check in |

**Logika:**
- Klik tombol Check In:
  - **Jika session masih valid (< 15 menit):** langsung redirect ke ActiveSessionView tanpa melewati LoginView
  - **Jika session expired atau belum login:** tampilkan LoginView (form Shield Login)
- View ini **tidak ditampilkan** apabila pengguna sudah berada di ActiveSessionView

---

### 5.2 Halaman Login (LoginView)

**Ditampilkan ketika:**
- Pengguna menekan tombol "Check In" di CheckInView, dan
- Session telah expired (> 15 menit sejak login) atau belum pernah login

**Elemen UI:**

| Elemen | ID / Selector | Keterangan |
|---|---|---|
| Input Username | #input-username | Tipe text, required |
| Input Password | #input-password | Tipe password, required |
| Tombol Submit | #btn-submit-login | Trigger proses login |

**Logika:**
- Klik tombol Submit -> simpan loginTimestamp (epoch ms) ke localStorage
- Set field session: { loginTimestamp, isLoggedIn: true, isCheckedIn: true }
- Simpan checkInTimestamp ke localStorage
- Redirect ke ActiveSessionView
- **Catatan Testing:** Tidak ada validasi username/password — semua input diterima

---

### 5.3 Halaman Aktif / Timer (ActiveSessionView)

**Ditampilkan ketika:**
- Extension diklik, dan pengguna sudah dalam status check in (isCheckedIn === true), atau
- Setelah login berhasil, atau
- Setelah tombol Check In diklik dan session masih valid

**Elemen UI:**

| Elemen | ID / Selector | Keterangan |
|---|---|---|
| Display Timer | #timer-display | Format hh:mm:ss, real-time |
| Tombol Check Out | #btn-check-out | Trigger dialog konfirmasi |

**Logika Timer:**
- Hitung selisih antara waktu sekarang (Date.now()) dengan checkInTimestamp
- Update setiap 1 detik menggunakan setInterval
- Format output: HH:MM:SS (padded dengan leading zero)

**Logika Check Out:**
1. Tampilkan dialog konfirmasi
2. Jika pengguna memilih Ya:
   - Hapus semua data sesi checkin (`checkInTimestamp`, `isCheckedIn`) dari localStorage
   - Redirect ke CheckInView
3. Jika pengguna memilih Tidak: tidak ada aksi, timer tetap berjalan

---

## 6. Aturan Halaman (State Machine)

| Kondisi | Halaman yang Ditampilkan |
|---|---|
| isCheckedIn = true | Active Session View (Timer + Check Out) |
| isCheckedIn = false | Check In View |
| Tombol Check In diklik + session valid (< 15 menit) | Active Session View |
| Tombol Check In diklik + session expired / belum login | Login View |
| Submit login berhasil | Active Session View |
| Tombol Check Out diklik + konfirmasi Ya | Check In View |

**Definisi Session Expired:**

Date.now() - loginTimestamp lebih dari 15 * 60 * 1000 (15 menit dalam ms)

**Prioritas Tampilan saat Extension Dibuka:**
1. Jika `isCheckedIn === true` → tampilkan **ActiveSessionView**
2. Jika `isCheckedIn === false` → tampilkan **CheckInView**

---

## 7. Skema Data localStorage

| Key | Tipe | Keterangan |
|---|---|---|
| shield_login_timestamp | number (epoch ms) | Waktu login berhasil |
| shield_checkin_timestamp | number (epoch ms) | Waktu check in |
| shield_is_logged_in | boolean (string) | Status login |
| shield_is_checked_in | boolean (string) | Status check in |
| shield_username | string | Username yang diinput saat login |

Catatan: localStorage hanya menyimpan string. Boolean perlu di-parse dengan JSON.parse() saat dibaca.

---

## 8. Struktur Proyek

```
chrome-shield-login/
├── public/
│   ├── manifest.json
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
├── src/
│   ├── main.js
│   ├── App.vue
│   ├── assets/
│   │   └── styles/
│   │       ├── _variables.scss
│   │       ├── _mixins.scss
│   │       └── global.scss
│   ├── composables/
│   │   ├── useAuth.js
│   │   ├── useTimer.js
│   │   └── useStorage.js
│   └── views/
│       ├── LoginView.vue
│       ├── CheckInView.vue
│       └── ActiveSessionView.vue
├── vite.config.js
├── package.json
└── PRD.md
```

---

## 9. Manifest V3 (Ringkasan)

```json
{
  "manifest_version": 3,
  "name": "Shield Login",
  "version": "1.0.0",
  "description": "Sistem absensi Check In / Check Out via Chrome Extension",
  "action": {
    "default_popup": "index.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "permissions": ["storage"]
}
```

---

## 10. Desain & UX Guidelines

- **Ukuran Popup:** Lebar 360px, tinggi menyesuaikan konten (min 400px)
- **Tema Warna:** Pink pastel dark mode
  - Background: `#1C0F18` (dark pink-tinted base)
  - Surface: `#2D1A26` (card/panel)
  - Primary: `#F9A8D4` (pink-300 accent)
  - Check In button: `#86EFAC` (green pastel)
  - Check Out button: `#FDA4AF` (rose pastel)
- **Tipografi:** Google Fonts — Inter (UI) + JetBrains Mono (timer display)
- **Animasi:** Fade transition antar view, pulse ring pada Check In, pulse dot pada Active Session
- **Komponen Timer:** Font monospace besar (48px) dengan pink gradient + glow effect
- **Username display:** Tidak ditampilkan setelah login
- **Bahasa UI:** English
- **Ikon Extension:** Dibuat dari scratch (shield dengan checkmark, pink pastel)
- **Responsif:** Tidak diperlukan (popup fixed width)

---

## 11. Acceptance Criteria

### AC-01: Halaman Pertama (CheckInView)
- [ ] Saat extension diklik dan `isCheckedIn === false`, tampilkan CheckInView
- [ ] Saat extension diklik dan `isCheckedIn === true`, langsung tampilkan ActiveSessionView
- [ ] CheckInView **tidak** ditampilkan apabila sedang dalam sesi aktif

### AC-02: Tombol Check In & Routing Session
- [ ] Klik tombol Check In → cek status session
- [ ] Jika session valid (< 15 menit): langsung masuk ke ActiveSessionView tanpa LoginView
- [ ] Jika session expired atau belum login: tampilkan LoginView

### AC-03: Login (LoginView)
- [ ] Form menampilkan field username dan password
- [ ] Klik submit menyimpan loginTimestamp ke localStorage
- [ ] Setelah submit berhasil, simpan checkInTimestamp dan set isCheckedIn: true
- [ ] Redirect ke ActiveSessionView setelah submit
- [ ] Tidak ada validasi input (semua diterima untuk testing)

### AC-04: Session Expiry
- [ ] Login timestamp tersimpan di localStorage saat login
- [ ] Pengecekan session dilakukan saat tombol Check In diklik
- [ ] Jika expired → tampilkan LoginView

### AC-05: Timer (ActiveSessionView)
- [ ] Timer menampilkan format hh:mm:ss
- [ ] Timer berjalan real-time dan update setiap detik
- [ ] Nilai timer dihitung dari Date.now() - checkInTimestamp

### AC-06: Check Out
- [ ] Tombol Check Out tampil di ActiveSessionView
- [ ] Klik Check Out menampilkan dialog konfirmasi
- [ ] Konfirmasi "Ya" → hapus data sesi checkin dari localStorage → redirect ke CheckInView
- [ ] Konfirmasi "Tidak" → timer tetap berjalan, tidak ada perubahan

---

## 12. Milestone & Prioritas

| Fase | Aktivitas | Status |
|---|---|---|
| P0 | Setup proyek (Vite + Vue 3 + SCSS) | ✅ Done |
| P0 | Implementasi localStorage composable (useStorage.js) | ✅ Done |
| P0 | useAuth.js + logika session expiry | ✅ Done |
| P0 | LoginView + CheckInView + ActiveSessionView | ✅ Done |
| P0 | useTimer.js composable (real-time tick) | ✅ Done |
| P1 | Polishing UI/UX — Pink pastel dark mode + animasi | ✅ Done |
| P1 | Manifest V3 + ikon extension (generated) | ✅ Done |
| P2 | Build & packaging untuk Chrome (`npm run build`) | ✅ Done |
| P0 | **[v1.1.0] Revisi flow: CheckInView sebagai halaman pertama** | 🔄 In Progress |
| P0 | **[v1.1.0] Routing tombol Check In berdasarkan status session** | 🔄 In Progress |
| P0 | **[v1.1.0] Check Out redirect ke CheckInView** | 🔄 In Progress |

---

## 13. Keputusan Desain yang Disepakati

| Pertanyaan | Keputusan |
|---|---|
| Branding & Warna | Pink pastel dark mode |
| Tampilkan Username | Tidak perlu |
| Reset state check-in saat expired | Ya — semua state di-reset via `clearShieldData()` |
| Aset Ikon | Dibuat dari scratch (AI-generated shield icon) |
| Bahasa UI | English |
| Halaman pertama saat extension dibuka | CheckInView (bukan LoginView) |
| Login hanya muncul saat | Tombol Check In diklik + session expired/belum login |
| Setelah login berhasil | Langsung masuk ActiveSessionView (bukan CheckInView) |
| Check Out mengarahkan ke | CheckInView (bukan LoginView) |
