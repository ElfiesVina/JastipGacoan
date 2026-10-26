# Arsitektur

## Aturan dependensi (satu arah, tanpa lingkaran)

```
main -> core/events, core/router
router -> views
views -> api, services, components, core
components -> services, core
services -> core
api -> config, core/constants
```
`components/` hanya membuat teks HTML. `api/` hanya bicara ke backend. Logika hitung ada di `services/`.

## Mengulang backend dari nol

Semua pemanggilan backend ada di `js/api/`. Selama setiap fungsi tetap mengembalikan `{ data, error }`
dengan bentuk data di bawah ini, folder lain tidak perlu diubah.

| Fungsi | Mengembalikan `data` |
|---|---|
| `getSession()` | `{ user } | null` |
| `signIn / signUp(email, password)` | `{ session }` (signUp: session bisa null jika perlu konfirmasi email) |
| `getProfile(id)` | `{ id, nama, rek, wa } | null` |
| `saveProfile({id,nama,rek,wa})` | - |
| `getPublicSesi(kode)` | `{ id, judul, status, pajak, fee, tgl, waktu, prices, nama, rek, wa } | null` (tanpa login) |
| `listPublicPesanan(kode)` | `[{ id, nama, item, level, paid, bukti }]` (tanpa login) |
| `addPesanan(kode, nama, item, level)` | `true` jika diterima, `false` jika ditolak (tutup / penuh / tidak valid) |
| `markPaid(kode, nama, urlBukti)` | - (hanya jika sesi berstatus `settled`) |
| `listMySesi()` | `[{ kode, judul, status, tgl }]` |
| `getMySesi(kode)` | baris sesi lengkap `| null` |
| `createSesi({kode,owner,judul})` | baris sesi baru. Error `code:'23505'` = kode bentrok, klien akan coba ulang |
| `updateSesi(id, patch)` | - |
| `listOwnerPesanan(sesiId)` | `[pesanan]` urut waktu |
| `deletePesanan(id)`, `setPaid(ids, paid)` | - |
| `uploadBukti(path, blob)` | URL publik (string); melempar error jika gagal |

Status sesi: `open` -> `closed` -> `settled`. Kolom `prices` berbentuk `{ "Nama Menu": angka }`.

Aturan keamanan yang sebaiknya dijaga backend baru: lihat `docs/AUDIT.md` bagian Keamanan
(validasi URL bukti, batas 300 pesanan, level 1-8, batas ukuran/tipe upload, RLS per pemilik).
