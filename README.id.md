# Quran Discipline

[![License: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](LICENSE)
[![CI](https://github.com/pandusudo/quran-discipline/actions/workflows/ci.yml/badge.svg)](https://github.com/pandusudo/quran-discipline/actions/workflows/ci.yml)

> Lawan kecanduan media sosial dengan pengingat Al-Qur'an — ekstensi Chrome
> yang memblokir situs mengganggu dan berbahaya dengan mode per-aturan dan
> timer fokus Pomodoro.

_Versi bahasa Inggris: [README.md](README.md)_

## Mengapa dibuat

Waktu yang habis untuk doomscrolling seharusnya bisa dipakai untuk ibadah,
belajar, dan keluarga. Quran Discipline menginterupsi kebiasaan itu tepat
saat kamu membuka situs yang diblokir — kamu disambut ayat Al-Qur'an sebagai
kesempatan menata niat sebelum melanjutkan. Proyek ini gratis dan open source
siapa pun yang ingin merebut kembali perhatiannya.

## Fitur

- **Rules (aturan)** — kelompokkan situs; tiap aturan punya mode blokir
  sendiri (`timer`, `audio` mendengarkan ayat, atau `hard`), toggle per situs,
  jadwal aktif, dan unlock sementara per aturan
- **Daftar blok selalu aktif** — daftar domain perjudian/dewasa yang dibundel
  dan tidak bisa di-unlock (sumbernya di
  [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md))
- **Sesi fokus Pomodoro** — pilih salah satu daftar situsmu; saat fase fokus,
  daftar itu diblokir penuh dan toggle popup terkunci
- **Popup** — aktif/nonaktifkan pemblokiran sekali klik
- **Impor/ekspor** JSON, riwayat blokir 100 entri terakhir (lokal)

> Rules dan halaman blok dikelola dari dashboard companion di
> <https://quran.pandusudo.xyz>. Ekstensi menegakkan blokir; dashboard adalah
> layanan terpisah yang berbicara ke ekstensi.

## Instalasi

### Chrome Web Store

_Segera hadir._

### Load unpacked (dari source)

1. Clone repo ini.
2. `npm install`
3. `npm run build`
4. Buka `chrome://extensions`, aktifkan **Developer mode**.
5. Klik **Load unpacked**, pilih folder `.output/chrome-mv3`.

Salin `.env.example` menjadi `.env` (dengan `WXT_WEB_URL` yang benar) bila
build-mu perlu integrasi dashboard.

## Pengembangan

Prasyarat: Node.js 22+, npm.

```bash
npm install
npm run dev        # watch build
npm run build      # build produksi
npm test           # unit test
npm run lint       # ESLint
npm run typecheck  # cek tipe
```

Struktur proyek, arsitektur, izin manifest, dan kebijakan privasi lengkap
ada di [README.md](README.md) (bahasa Inggris).

## Kontribusi

Baca [CONTRIBUTING.md](CONTRIBUTING.md). Dengan berpartisipasi kamu setuju
dengan [Code of Conduct](CODE_OF_CONDUCT.md). Laporkan celah keamanan secara
privat lewat [SECURITY.md](SECURITY.md).

## Lisensi

[GPL-3.0](LICENSE) © Pandu Cahyo Pangestu. Data daftar blok pihak ketiga dan
kutipan terjemahan tetap di bawah lisensi masing-masing — lihat
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Kontak

- Bug dan fitur: [GitHub Issues](https://github.com/pandusudo/quran-discipline/issues)
- Penulis: [Pandu Cahyo Pangestu](https://github.com/pandusudo)
