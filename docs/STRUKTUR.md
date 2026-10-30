# Struktur project (versi bersih)

```
titip-gacoan/
├── .github/workflows/build-apk.yml
├── .gitignore
├── README.md
├── android/                    # WebView shell saja
│   └── app/src/main/java/com/jastip/gacoan/MainActivity.kt
├── css/
├── docs/
├── icons/
├── img/
├── js/
│   ├── api/
│   ├── components/
│   ├── core/
│   ├── data/
│   ├── services/
│   ├── views/
│   ├── config.js
│   └── main.js
├── supabase/
│   └── schema.sql              # SATU file, jalankan sekali
├── index.html
├── sw.js
├── manifest.json
└── favicon.ico
```

## Aturan

- Database: hanya `supabase/schema.sql`. Tidak ada folder migrasi.
- Android: hanya `MainActivity.kt` (+ resource icon/theme). Tidak ada kode Compose native.
- Fitur baru = ubah web. APK hanya di-build ulang bila icon / permission / deep link berubah.
