/**
 * js/services/pull-refresh.js
 * Tarik untuk refresh di semua halaman biasa (beranda/admin, tab, detail sesi, halaman penitip).
 *
 * Header TIDAK ikut tertarik. Saat layar ditarik ke bawah dari posisi paling atas, ruang kosong
 * terbuka tepat di bawah header dan di situ muncul ikon muat pink; konten ikut turun. Pada saat yang sama
 * tulisan TITIP GACOAN di header hilang berurutan (GACOAN, pil pink, TITIP) lalu terisi kembali
 * dengan urutan yang sama. Lepas setelah penuh = halaman dimuat ulang.
 *
 *   HP / tablet : tarik dengan jari (touch).
 *   Laptop / PC : gulir ke atas (roda mouse / trackpad) saat sudah di paling atas.
 *
 * Layar masuk/daftar (body.auth-mode) punya pelacak tarik sendiri di views/admin-auth.js.
 * Gaya: css/components/ptr.css.
 */
import { gacoanLoaderHTML } from '../components/gacoan-loader.js';

const THRESH = 78;     // jarak tarik (px) agar refresh jalan
const MAX = 140;       // jarak tarik maksimal
const HOLD = 66;       // tinggi ruang indikator saat memuat
const RESIST = 0.5;    // 0.5 = terasa "berat" ditarik
const WHEEL_IDLE = 160; // jeda (ms) tanpa gulir = gesekan trackpad dianggap selesai
const WHEEL_AFTER = 450; // gulir roda baru dihitung bila halaman sudah diam di atas selama ini (ms), supaya momentum gulir tidak memicu refresh

/**
 * Pecah tulisan logo header jadi huruf per huruf supaya bisa beranimasi satu-satu.
 * Nomor --k = urutan animasi: huruf GACOAN 0-5, pil pink 6, huruf TITIP 7-11.
 * Tampilan diam tidak berubah. @param {HTMLElement|null} lg elemen .lg di header
 */
function splitLogo(lg) {
  const pil = lg?.querySelector('b');
  if (!lg || !pil || lg.dataset.split) return;
  const titip = lg.firstChild?.textContent.trim() || '';
  const gacoan = pil.textContent.trim();
  const huruf = (teks, dari) => teks.split('').map((c, i) => '<span class="lg-c" style="--k:' + (dari + i) + '" aria-hidden="true">' + c + '</span>').join('');
  lg.innerHTML = huruf(titip, 7) + '<b class="lg-pill" style="--k:6" aria-hidden="true">' + huruf(gacoan, 0) + '</b>';
  lg.setAttribute('role', 'img');
  lg.setAttribute('aria-label', titip + ' ' + gacoan);
  lg.dataset.split = '1';
}

/** Pasang sekali dari main.js. */
export function initPullRefresh() {
  const header = document.querySelector('header');
  if (!header) return;

  const root = document.documentElement;
  splitLogo(header.querySelector('.lg'));

  const ptr = document.createElement('div');
  ptr.id = 'ptr';
  ptr.setAttribute('aria-hidden', 'true');
  ptr.innerHTML = '<div class="ptr-in">' + gacoanLoaderHTML() + '</div>';
  header.after(ptr);

  let pull = 0;
  let loading = false;
  let lastScrolled = Date.now();

  /** Atur tinggi ruang indikator dan seberapa penuh (0..1). Variabel dipasang di <html> supaya logo header ikut membaca. */
  const set = (v) => {
    pull = v;
    root.style.setProperty('--pull', v + 'px');
    root.style.setProperty('--ptr', String(Math.min(1, v / THRESH)));
    ptr.classList.toggle('on', v > 0);
    if (v > 0) root.classList.add('ptr-on');
    else setTimeout(() => { if (!pull && !loading) root.classList.remove('ptr-on'); }, 400); // tunggu logo selesai kembali mulus
  };
  /** Sedang ditarik jari/roda: matikan transisi --ptr supaya logo mengikuti tanpa tertinggal. */
  const pulling = (on) => { ptr.classList.toggle('pulling', on); root.classList.toggle('ptr-pulling', on); };

  const blocked = () =>
    loading || document.body.classList.contains('auth-mode') || document.body.classList.contains('boot') ||
    window.scrollY > 0 || Boolean(document.querySelector('dialog[open]'));

  /** Lepas: cukup jauh = refresh, kalau belum = menutup kembali. */
  const release = () => {
    pulling(false);
    if (pull >= THRESH) {
      loading = true;
      ptr.classList.add('refreshing');
      root.classList.add('ptr-loading');
      set(HOLD);
      root.style.setProperty('--ptr', '1');
      setTimeout(() => location.reload(), 700);
    } else {
      set(0);
    }
  };

  /* ---------- sentuh (HP / tablet) ---------- */
  let y0 = null;
  let x0 = 0;
  let arah = ''; // '' belum ditentukan, 'v' tegak, 'h' mendatar

  addEventListener('touchstart', (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '') || e.target.closest?.('input,textarea,select');
    if (blocked() || typing || e.touches.length !== 1) { y0 = null; return; }
    y0 = e.touches[0].clientY;
    x0 = e.touches[0].clientX;
    arah = '';
  }, { passive: true });

  addEventListener('touchmove', (e) => {
    if (y0 === null) return;
    const dy = e.touches[0].clientY - y0;
    const dx = e.touches[0].clientX - x0;
    if (!arah) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      arah = Math.abs(dy) > Math.abs(dx) && dy > 0 ? 'v' : 'h';
      if (arah === 'v') pulling(true);
    }
    if (arah === 'h' || dy <= 0 || window.scrollY > 0) { // bukan tarik ke bawah: batalkan, biarkan gulir normal
      y0 = null; pulling(false); if (pull) set(0); return;
    }
    if (e.cancelable) e.preventDefault(); // cegah browser ikut menarik seluruh halaman (header tetap diam)
    set(Math.min(MAX, dy * RESIST));
  }, { passive: false });

  const end = () => { if (y0 === null) return; y0 = null; release(); };
  addEventListener('touchend', end);
  addEventListener('touchcancel', end);

  /* ---------- roda mouse / trackpad (laptop / PC) ---------- */
  addEventListener('scroll', () => { if (window.scrollY > 0) lastScrolled = Date.now(); }, { passive: true });

  let wheelTimer = 0;
  addEventListener('wheel', (e) => {
    if (e.deltaY >= 0) { if (pull && !loading) { clearTimeout(wheelTimer); set(0); pulling(false); } return; }
    if (blocked() || Date.now() - lastScrolled < WHEEL_AFTER) return;
    pulling(true);
    set(Math.min(MAX, pull + Math.abs(e.deltaY) * 0.4));
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(release, WHEEL_IDLE);
  }, { passive: true });
}
