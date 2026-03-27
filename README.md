# Silsilah Keluarga HM Syachroel AP

Aplikasi pohon keluarga (silsilah) interaktif untuk Keluarga Besar HM Syachroel AP. Dibangun dengan React 18 + Vite, di-deploy otomatis ke GitHub Pages.

**Live:** [mshadianto.github.io/silsilahkeluarga](https://mshadianto.github.io/silsilahkeluarga/)

## Fitur

### Tampilan
- **Pohon Keluarga** — Visualisasi hierarki dengan pasangan & keturunan, zoom in/out (50%–150%)
- **Daftar** — Semua anggota dalam list sortir per generasi
- **Statistik** — Total anggota, rasio gender, jumlah generasi, anggota tertua
- **Timeline** — Kronologi peristiwa lahir & wafat

### Manajemen Data
- **Tambah/Edit/Hapus** anggota keluarga
- **Upload foto** langsung dari device (auto-resize & compress)
- **Tempat & tanggal lahir** ditampilkan di setiap kartu anggota
- **Quick action** — Tambah anak atau pasangan langsung dari detail anggota
- **Breadcrumb silsilah** — Jalur leluhur yang bisa diklik (Kakek > Ayah > Anak)
- **Import/Export JSON** — Backup & restore data, download file atau salin ke clipboard
- **Pencarian** — Cari berdasarkan nama, tempat lahir, atau catatan

### UX
- Light theme yang bersih dan modern
- Keyboard shortcuts: `Ctrl+K` (cari), `Ctrl+N` (tambah), `Esc` (tutup)
- Custom dialog konfirmasi (tidak pakai alert/confirm browser)
- Responsive — mobile & desktop
- Data tersimpan otomatis di localStorage browser

## Development

```bash
# Install dependencies
npm install

# Jalankan dev server
npm run dev

# Build untuk production
npm run build

# Preview hasil build
npm run preview
```

## Deploy

Push ke branch `main` akan otomatis trigger GitHub Actions (`.github/workflows/deploy.yml`) untuk build dan deploy ke GitHub Pages.

## Tech Stack

- **React 18** — UI library
- **Vite** — Build tool & dev server
- **GitHub Actions** — CI/CD
- **GitHub Pages** — Hosting
- **localStorage** — Penyimpanan data (termasuk foto base64)

## Struktur File

```
├── silsilah-keluarga.jsx    # Komponen utama (semua logic + UI + CSS)
├── src/main.jsx             # Entry point, mount React + localStorage polyfill
├── index.html               # HTML template
├── vite.config.js           # Konfigurasi Vite (base path untuk GitHub Pages)
├── package.json
└── .github/workflows/
    └── deploy.yml           # GitHub Actions deploy ke Pages
```
