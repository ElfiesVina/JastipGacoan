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
import { initLang } from './core/i18n.js';
import { bindEvents } from './core/events.js';
import { route } from './core/router.js';
import { armOfflineOnClose } from './services/presence.js';

import { ready } from './core/ui.js';
import { initPullRefresh } from './services/pull-refresh.js';

initLang(); // bahasa dipasang sebelum halaman pertama digambar
bindEvents();
armOfflineOnClose(); // usaha terbaik: tandai offline saat tab/jendela ditutup
initPullRefresh(); // tarik untuk refresh (header tetap, indikator Gacoan di bawahnya)
route();
setTimeout(ready, 6000); // pengaman: jangan biarkan layar tunggu tertahan bila ada galat
