# Sistem Informasi Presensi Digital - PT PLN Indonesia Power UBP Cilegon

Aplikasi web presensi digital berbasis React + Vite + TypeScript dan Supabase. Dilengkapi fitur tanda tangan digital, QR code generator otomatis, custom shortlink per kegiatan, serta export daftar hadir resmi format DOCX (Word template baku) dan Excel (XLSX).

---

## 🚀 Fitur Utama

- **Presensi Digital Interaktif**: Form kehadiran responsif untuk smartphone & desktop dengan tanda tangan digital langsung di layar.
- **Generator QR Code & Shortlink**: Setiap kegiatan otomatis dibuatkan QR Code beresolusi tinggi dan link pendek khusus (contoh: `/p/k3-cilegon`) untuk ditempel di poster/meja registrasi.
- **Format Cetak Poster Presensi**: Admin dapat langsung mencetak poster A4 siap pajang berlogo resmi PLN Indonesia Power.
- **Ekspor Dokumen Resmi**:
  - **Word (.docx)**: Sesuai format standar daftar hadir resmi PLN IP (CLG.17.3.2) lengkap dengan gambar tanda tangan peserta.
  - **Excel (.xlsx)**: Rekapitulasi tabular untuk kebutuhan pelaporan & arsip data.
- **Admin Dashboard**: Statistik kehadiran real-time, monitoring peserta harian, manajemen event aktif/selesai.
- **Ready for Netlify**: Konfigurasi SPA routing (`_redirects` & `netlify.toml`) siap pakai.

---

## 🛠️ Persiapan Database (Supabase)

1. Buat project baru di [Supabase Dashboard](https://supabase.com/).
2. Masuk ke menu **SQL Editor**, buka file `supabase_migration.sql` dan jalankan script tersebut.
3. Masuk ke menu **Storage**:
   - Buat bucket baru dengan nama `signatures`.
   - Centang opsi **Public bucket**.
4. Di menu **Authentication > Users**:
   - Buat user admin dengan email & password untuk akses backend.

---

## ⚙️ Konfigurasi Environment Variables

Salin `.env.example` menjadi `.env` di komputer lokal:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_URL=https://absensi-pln-cilegon.netlify.app
```

> **Catatan Netlify**: Jangan commit file `.env` ke Git repository. Masukkan variabel-variabel di atas ke menu **Site settings > Environment variables** di dashboard Netlify.

---

## 💻 Menjalankan di Lokal (Development)

```bash
# Install dependencies
npm install

# Jalankan development server
npm run dev

# Build untuk production
npm run build
```

---

## 🌐 Panduan Deploy ke Netlify

### Metode A: Melalui GitHub / GitLab (Direkomendasikan)
1. Buat repository baru di GitHub.
2. Push kode ke GitHub:
   ```bash
   git add .
   git commit -m "feat: initial release presensi digital pln ip"
   git branch -M main
   git remote add origin <URL_REPOSITORY_GITHUB_ANDA>
   git push -u origin main
   ```
3. Buka [Netlify](https://app.netlify.com/) > **Add new site** > **Import an existing project**.
4. Pilih repository GitHub Anda.
5. Netlify otomatis mendeteksi pengaturan dari `netlify.toml`:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Buka **Site configuration > Environment variables**, lalu tambahkan:
   - `VITE_SUPABASE_URL` : URL project Supabase Anda
   - `VITE_SUPABASE_ANON_KEY` : Anon public key Supabase Anda
   - `VITE_APP_URL` : Domain Netlify Anda (misal `https://nama-site.netlify.app`)
7. Klik **Deploy site**.

### Metode B: Deploy Manual (Netlify Drop)
1. Jalankan `npm run build` di terminal lokal Anda.
2. Buka [app.netlify.com/drop](https://app.netlify.com/drop).
3. Seret (*drag & drop*) folder `dist` yang telah dibuat ke halaman tersebut.

---

## 📄 Lisensi & Hak Cipta
PT PLN Indonesia Power UBP Cilegon &copy; 2026.
