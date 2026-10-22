/**
 * js/main.js
 * Titik masuk aplikasi (dimuat dari index.html sebagai <script type="module">).
 * Memasang event lalu menampilkan halaman sesuai URL.
 *
 * Peta folder:
 *   config.js      pengaturan (URL Supabase, menu)
 *   core/          dasar: state, util, router, events
 *   api/           SATU-SATUNYA tempat bicara ke backend
 *   services/      logika bisnis: hitung rekap, gambar rekap, changelog
 *   components/    pembuat HTML (tanpa logika data)
 *   views/         halaman: penitip & admin
 *   data/          data statis (changelog)
 */
import { bindEvents } from './core/events.js';
import { route } from './core/router.js';

bindEvents();
route();
