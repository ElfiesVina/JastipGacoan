/**
 * js/components/auth-forms.js
 * Layar MASUK dan DAFTAR (desain baru). Hanya membuat HTML.
 * Dua mode memakai kerangka yang sama (pita atas, logo, lonceng) dan hanya
 * beda isi form.
 */

import { t } from '../core/i18n.js';
import { esc } from '../core/dom.js';
import { CHANGELOG } from '../data/changelog-data.js';
import { CFG } from '../config.js';
import { gacoanLoaderHTML } from './gacoan-loader.js';
import { otpBoxesHTML } from './otp-boxes.js';
import { mmss } from '../services/otp-clock.js';

/** Nomor versi terbaru dari catatan perubahan (untuk footer). */
const VERSI = (CHANGELOG.slice().sort((a, b) => b.id - a.id)[0] || {}).v || '';

/* Ikon-ikon inline (ikut warna teks lewat currentColor). */
const svg = (body, size = 20, sw = 1.8) =>
  '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
const ICON = {
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5"/>'),
  mail: svg('<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M4 7.5l8 5.5 8-5.5"/>'),
  key: svg('<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3M14 9l3 3"/>'),
  lock: svg('<rect x="5" y="11" width="14" height="10" rx="3"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/><circle cx="12" cy="16" r=".8" fill="currentColor"/>'),
  eyeOff: svg('<path d="M3 3l18 18"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/><path d="M10.6 6.1A9.6 9.6 0 0 1 12 6c5 0 8.5 4 9.5 6-.4.8-1.2 2-2.5 3.2M6.6 7.6C4.6 9 3.3 10.9 2.5 12c1 2 4.5 6 9.5 6 1.3 0 2.5-.3 3.6-.7"/>'),
  eye: svg('<path d="M2.5 12C3.5 10 7 6 12 6s8.5 4 9.5 6c-1 2-4.5 6-9.5 6s-8.5-4-9.5-6z"/><circle cx="12" cy="12" r="3"/>'),
  down: svg('<path d="M5 9l7 7 7-7"/>', 34, 2.6),
  up: svg('<path d="M5 15l7-7 7 7"/>', 34, 2.6),
  shop: svg('<path d="M4 9l1.6-5h12.8L20 9"/><path d="M4 9a2.67 2.67 0 0 0 5.33 0 2.67 2.67 0 0 0 5.34 0A2.67 2.67 0 0 0 20 9"/><path d="M5.5 12v8h13v-8"/><path d="M10 20v-4h4v4"/>', 22, 2),
  who: svg('<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5"/>', 22, 2),
  link: svg('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
  moon: svg('<path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z"/>', 22, 2),
  sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6"/>', 22, 2),
  copy: svg('<rect x="9" y="9" width="11" height="11" rx="3"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>', 20, 2),
  clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', 18, 2.2),
  cross: svg('<path d="M6 6l12 12M18 6L6 18"/>', 18, 2.4),
  note: svg('<path d="M6 3.5h9l3 3V20a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 6 20z"/><path d="M9 11h6M9 15h6"/>'),
  check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 20, 2.6),
  search: svg('<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>', 18, 2.2),
  bell: svg('<path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9"/><path d="M10 20a2 2 0 0 0 4 0"/>', 24),
};

/**
 * Satu kolom isian dengan ikon di kiri.
 * @param {string} icon kunci ikon @param {string} attrs atribut <input>
 * @param {boolean} [eye] true = tambahkan tombol mata (untuk password)
 */
const field = (icon, attrs, eye) =>
  '<div class="auth-field"><span class="ico">' + ICON[icon] + '</span><input ' + attrs + '>' +
  (eye
    ? '<button type="button" class="auth-eye" data-act="pw" aria-pressed="false" aria-label="Tampilkan password"><span class="off">' + ICON.eyeOff + '</span><span class="on">' + ICON.eye + '</span></button>'
    : '') + '</div>';

/** Isi form MASUK: email, password, lupa password, tombol Masuk, tautan ke Daftar. */
const loginBody = () =>
  '<form class="auth-form" data-form="login" novalidate>' +
  field('mail', 'id="em" type="email" autocomplete="email" inputmode="email" placeholder="Email address"') +
  field('lock', 'id="pw" type="password" autocomplete="current-password" enterkeyhint="go" placeholder="Password"', true) +
  '<div class="auth-links auth-forgot"><button type="button" data-act="forgot">Forgot password?</button></div>' +
  '<button class="auth-btn" type="submit">Masuk</button>' +
  '<div class="auth-links">I don’t have an account<button type="button" data-act="to-signup">Daftar</button></div></form>';

/** Isi form DAFTAR: nama, email, password baru, tombol Daftar, tautan ke Masuk. */
const signupBody = () =>
  '<form class="auth-form" data-form="signup" novalidate>' +
  field('user', 'id="nm" autocomplete="name" autocapitalize="words" maxlength="60" placeholder="Your name"') +
  field('mail', 'id="em" type="email" autocomplete="email" inputmode="email" placeholder="Email address"') +
  field('lock', 'id="pw" type="password" autocomplete="new-password" minlength="6" placeholder="New password"', true) +
  '<div class="auth-field auth-field-area"><span class="ico">' + ICON.note + '</span>' +
  '<textarea id="al" rows="3" maxlength="300" autocomplete="off" placeholder="' + esc(t('su.reason')) + '"></textarea></div>' +
  '<button class="auth-btn" type="submit">Daftar</button>' +
  '<div class="auth-links end">I have an account<button type="button" data-act="to-login">Masuk</button></div></form>';

/**
 * Isi layar STATUS PENDAFTARAN (progress 3 langkah):
 *   menunggu (1/3) -> diperiksa (2/3) -> disetujui (3/3, + kode verifikasi bila CFG.OTP_PENDAFTARAN) | ditolak.
 * Dipakai juga saat polling (ganti #pend).
 * @param {{email?:string, status?:string, hasSession?:boolean}} ctx hasSession = pendaftar sedang login
 */
export const pendingHTML = (ctx) => {
  const status = ['menunggu', 'diperiksa', 'disetujui', 'ditolak'].includes(ctx.status) ? ctx.status : 'menunggu';
  const kind = { menunggu: 'wait', diperiksa: 'check', disetujui: 'ok', ditolak: 'no' }[status];
  const otp = kind === 'ok' && CFG.OTP_PENDAFTARAN;
  const step = { wait: 1, check: 2, ok: 3, no: 0 }[kind];
  const label = { ok: t('pd.verified'), no: t('pd.rejected'), wait: t('pd.pending'), check: t('pd.checking') }[kind];
  const icon = { ok: ICON.check, no: ICON.cross, wait: ICON.clock, check: ICON.search }[kind];
  const title = { ok: t('pd.okTitle'), no: t('pd.rejTitle'), wait: t('pd.pendingTitle'), check: t('pd.checkTitle') }[kind];
  const text = { ok: otp ? 'pd.okTextOtp' : 'pd.okText', no: 'pd.rejText', wait: 'pd.pendingText', check: 'pd.checkText' }[kind];
  const email = '<b>' + esc(ctx.email || '') + '</b>';
  const dots = step
    ? '<div class="pd-steps" role="img" aria-label="' + esc(t('pd.step', { n: step })) + '">' +
      [1, 2, 3].map((n) => '<i class="' + (n < step ? 'done' : n === step ? 'now' : '') + '"></i>').join('') +
      '<span class="pd-n">' + step + '/3</span></div>'
    : '';
  const body = otp
    ? '<form class="auth-form pd-otp" data-form="pd-otp" novalidate>' + otpBoxesHTML() +
      '<p class="otp-meta">' + t('pd.otpExpires') + ' <b id="otp-timer" dir="ltr">' + mmss(CFG.OTP_MENIT * 60) + '</b></p>' +
      '<p class="otp-err" role="alert" hidden></p>' +
      '<button class="auth-btn" type="submit">' + t('pd.otpSubmit') + '</button>' +
      '<div class="auth-links">' + t('pd.otpNoCode') + '<button type="button" id="otp-resend" data-act="otp-resend" disabled>' + t('pd.otpResend') + '</button></div>' +
      '<div class="auth-links end"><button type="button" data-act="pending-back">' + t('pd.back') + '</button></div></form>'
    : kind === 'wait' || kind === 'check'
      ? (ctx.hasSession ? '<div class="auth-links end"><button type="button" data-act="pending-back">' + t('pd.logout') + '</button></div>' : '')
      : '<button class="auth-btn" type="button" data-act="pending-back">' + t('pd.back') + '</button>';
  return (
    '<div class="pending" id="pend" data-status="' + esc(status) + '" data-email="' + esc(ctx.email || '') + '" data-session="' + (ctx.hasSession ? '1' : '') + '" aria-live="polite">' +
    '<span class="pending-pill is-' + kind + '">' + icon + label + '</span>' + dots +
    '<h2 class="auth-title">' + title + '</h2>' +
    '<p class="auth-hint">' + t(text, { email }) + '</p>' +
    (kind === 'wait' && !ctx.hasSession && !CFG.OTP_PENDAFTARAN ? '<p class="auth-hint">' + t('pd.checkMail') + '</p>' : '') +
    body + '</div>'
  );
};

/** Isi form LUPA PASSWORD: email -> kirim link reset. */
const forgotBody = () =>
  '<form class="auth-form" data-form="reset" novalidate>' +
  '<p class="auth-hint">Masukkan email akunmu. Kami kirim kode verifikasi ke email itu untuk membuat password baru.</p>' +
  field('mail', 'id="em" type="email" autocomplete="email" inputmode="email" placeholder="Email address"') +
  '<button class="auth-btn" type="submit">Kirim kode</button>' +
  '<div class="auth-links">Ingat password?<button type="button" data-act="to-login">Masuk</button></div></form>';

/** Isi form KODE (OTP): angka dari email -> verifikasi. @param {{email?:string}} ctx */
const otpBody = (ctx) =>
  '<form class="auth-form" data-form="otp" novalidate>' +
  '<p class="auth-hint">Kode verifikasi dikirim ke <b>' + esc(ctx.email || 'emailmu') + '</b>. Masukkan kodenya di bawah. Cek folder Spam kalau belum masuk.</p>' +
  field('key', 'id="otp" class="auth-otp" inputmode="numeric" pattern="[0-9]*" autocomplete="one-time-code" enterkeyhint="go" maxlength="10" placeholder="Kode"') +
  '<button class="auth-btn" type="submit">Verifikasi</button>' +
  '<div class="auth-links">Belum menerima kode?<button type="button" data-act="resend">Kirim ulang</button></div>' +
  '<div class="auth-links">Salah email?<button type="button" data-act="forgot">Ganti</button></div></form>';

/** Isi form PASSWORD BARU (setelah link di email diketuk): password + konfirmasi. */
const newPasswordBody = () =>
  '<form class="auth-form" data-form="newpass" novalidate>' +
  '<p class="auth-hint">Buat password baru untuk akunmu.</p>' +
  field('lock', 'id="pw" type="password" autocomplete="new-password" minlength="6" placeholder="New password"', true) +
  field('lock', 'id="pw2" type="password" autocomplete="new-password" minlength="6" placeholder="Confirm password"', true) +
  '<button class="auth-btn" type="submit">Simpan password</button></form>';

/**
 * Isi halaman JASTIPER (penitip): tempel link / kode sesi dari jastip lalu buka.
 * @param {{last?:{k:string,j?:string}}} ctx last = sesi yang terakhir dibuka di perangkat ini
 */
/** Slot di atas kolom isian: link sesi terbaru sebagai TEKS (tidak bisa disalin dengan menekannya) + ikon salin. */
const recentHTML = (list) => !list || !list.length ? '' :
  '<div class="auth-recent"><div class="auth-rt">Sesi terbaru</div>' +
  list.map((x) =>
    '<div class="rc-row"><div class="rc-tx"><b>' + esc(x.j || x.k) + '</b><span>' + esc(location.host + location.pathname.replace(/index\.html$/, '') + '#/s/' + x.k) + '</span></div>' +
    '<button type="button" class="rc-copy" data-act="copy-recent" data-k="' + esc(x.k) + '" aria-label="Salin link ' + esc(x.j || x.k) + '"><span class="i-c">' + ICON.copy + '</span><span class="i-ok">' + ICON.check + '</span></button></div>').join('') +
  '</div>';

const joinBody = (ctx) =>
  '<form class="auth-form" data-form="join" novalidate>' +
  '<h2 class="auth-title">Mau titip pesanan?</h2>' +
  '<p class="auth-hint">Tempel link di bawah ini untuk mengakses beranda</p>' +
  recentHTML(ctx.recent) +
  field('link', 'id="kd" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" enterkeyhint="go" placeholder="Link atau kode sesi"') +
  '<button class="auth-btn" type="submit">Buka daftar titipan</button>' +
  '</form>';

/** Pilih isi form sesuai mode. @param {string} mode */
const bodyFor = (mode, ctx) =>
  ({ signup: signupBody, forgot: forgotBody, otp: otpBody, newpass: newPasswordBody, pending: pendingHTML }[mode] || loginBody)(ctx);

/** Langkah singkat untuk JASTIP (admin): [judul, penjelasan]. */
const STEPS_JASTIP = [
  ['Buat sesi', 'Jastip masuk, lalu membuat sesi titipan baru.'],
  ['Bagikan link', 'Kirim link sesi ke teman lewat WhatsApp.'],
  ['Teman mengisi', 'Nama, menu, dan level pedas. Tanpa perlu akun.'],
  ['Rekap otomatis', 'Harga, pajak, dan fee terhitung. Teman bayar dan kirim bukti.'],
];

/** Langkah singkat untuk JASTIPER (penitip). */
const STEPS_JASTIPER = [
  ['Buka link', 'Minta link sesi ke jastip, lalu tempel di atas atau ketuk linknya.'],
  ['Isi titipan', 'Nama, menu, dan level pedas. Tanpa akun.'],
  ['Tunggu rekap', 'Setelah daftar ditutup dan belanja selesai, total muncul.'],
  ['Transfer', 'Bayar sesuai total, lalu unggah foto bukti.'],
];

/** Tautan kecil untuk pindah halaman geser. */
const goto = (p, teks) => '<button type="button" class="auth-goto" data-act="pane" data-p="' + p + '">' + teks + '</button>';

/**
 * Kartu "Cara kerjanya". Di HP tampil di bawah form; di laptop jadi bagian panel kiri.
 * @param {'jastip'|'jastiper'} untuk @param {string} [kelas] kelas tambahan
 */
const infoHTML = (untuk, kelas = '') => {
  const jastip = untuk === 'jastip';
  return (
    '<section class="auth-info info-' + untuk + ' ' + kelas + '" aria-label="' + (jastip ? 'Cara kerja untuk jastip' : 'Cara menitip') + '">' +
    '<h2>' + (jastip ? 'Cara kerjanya' : 'Cara menitip') + '</h2><ol class="auth-steps">' +
    (jastip ? STEPS_JASTIP : STEPS_JASTIPER).map((s, i) =>
      '<li><span class="auth-n" aria-hidden="true">' + (i + 1) + '</span><span class="auth-st"><b>' + s[0] + '</b>' + s[1] + '</span></li>').join('') +
    '</ol><p class="auth-note' + (jastip ? '' : ' goto-l') + '">' +
    (jastip
      ? 'Halaman ini untuk jastip. Kalau kamu penitip, buka link dari jastip<span class="goto-l"> atau ' + goto('jastiper', 'Masuk sebagai Jastiper') + '</span>.'
      : 'Kamu yang membuka jastip dan mengelola sesi? ' + goto('jastip', 'Masuk sebagai Jastip') + '.') +
    '</p></section>'
  );
};

/** Sambutan: judul (HP: di halaman kedua) + logo dan paragraf (hanya laptop). */
const heroHTML = () =>
  '<div class="auth-hero"><div class="auth-hero-logo"><img src="img/sakan.png" alt="Sakan Al-Kalim at-Tayyib"></div>' +
  '<h1>Titip pesanan, rekap otomatis.</h1>' +
  '<p>Kumpulkan titipan teman lewat satu link, hitung total beserta pajaknya, lalu terima bukti transfer di satu tempat.</p></div>';

/** Footer: hak cipta, versi, dan catatan bahwa ini bukan aplikasi resmi. @param {string} [kelas] */
const footerHTML = (kelas = '') =>
  '<footer class="auth-foot ' + kelas + '"><div class="auth-foot-in">' +
  '<span class="auth-copy">&copy; ' + new Date().getFullYear() + ' Titip Gacoan' + (VERSI ? ' &middot; v' + VERSI : '') + '</span>' +
  '<span class="auth-disc">Bukan aplikasi resmi Mie Gacoan. Logo dan merek milik pemiliknya masing-masing.</span>' +
  '</div></footer>';

/**
 * Pita cyan + logo Sakan + switch ikon (tanpa teks) untuk pindah Jastip / Jastiper.
 * Switch ini hanya tampil di HP/tablet; di laptop dipakai tautan teks di panel kiri.
 * @param {'jastip'|'jastiper'} aktif halaman yang sedang tampil
 */
const themeBtn = () =>
  '<button type="button" class="theme-btn" data-act="theme" aria-label="Ganti tema terang / gelap">' +
  '<span class="i-moon">' + ICON.moon + '</span><span class="i-sun">' + ICON.sun + '</span></button>';

const headHTML = (aktif) =>
  '<div class="auth-head"><div class="auth-in"><div class="auth-sakan"><img src="img/sakan.png" alt="Sakan Al-Kalim at-Tayyib"></div>' +
  '<div class="auth-switch" role="tablist" aria-label="Pilih halaman">' +
  '<button type="button" role="tab" class="sw sw-jastip" data-act="pane" data-p="jastip" aria-label="Jastip, untuk pengelola" title="Jastip" aria-selected="' + (aktif === 'jastip') + '">' + ICON.shop + '<span class="sw-t">Jastip</span></button>' +
  '<button type="button" role="tab" class="sw sw-jastiper" data-act="pane" data-p="jastiper" aria-label="Jastiper, untuk penitip" title="Jastiper" aria-selected="' + (aktif === 'jastiper') + '">' + ICON.who + '<span class="sw-t">Jastiper</span></button>' +
  '</div>' + themeBtn() + '</div></div>';

/** Logo Me Gacoan + lonceng pembaruan. */
const brandHTML = () =>
  '<div class="auth-brand"><img src="img/me-gacoan.png" alt="Me Gacoan">' +
  '<button type="button" class="auth-bell" data-act="cl" aria-label="Lihat yang baru">' + ICON.bell + '<span class="auth-dot" hidden></span></button></div>';

/**
 * Layar lengkap = DUA halaman yang bertukar dengan efek scale: Jastip | Jastiper.
 * Masing-masing halaman punya dua "layar" yang digulir tegak (snap):
 *   p1 = pita + logo + form (Jastip: masuk/daftar, Jastiper: tempel link sesi) — bagian bawahnya kosong, hanya panah V
 *   p2 = sambutan + cara kerja/cara menitip + footer
 * Laptop (>=900px): panel kiri berisi sambutan + cara kerja, kanan berisi halaman aktif.
 * Pindah halaman: ikon di pita atas (HP/tablet) atau tautan teks "Masuk sebagai ..." (semua ukuran).
 * @param {'login'|'signup'|'forgot'|'otp'|'newpass'} mode  mode form Jastip
 * @param {{email?:string, pane?:'jastip'|'jastiper', last?:{k:string,j?:string}}} [ctx]
 */
export const authScreenHTML = (mode, ctx = {}) => {
  const aktif = ctx.pane === 'jastip' ? 'jastip' : 'jastiper';
  /** Satu halaman: layar 1 (isi utama) + layar 2 (sambutan, info, footer). */
  const pane = (nama, isi, info, ke) =>
    '<div class="auth-pane pane-' + nama + '" role="tabpanel"><div class="auth-scroll">' +
    '<div class="auth-pg auth-p1">' + headHTML(aktif) + '<div class="auth-main"><div class="auth-in">' + brandHTML() + isi + '<div class="auth-swap">' + goto(ke, ke === 'jastip' ? 'Masuk sebagai Jastip' : 'Masuk sebagai Jastiper') + '</div></div></div></div>' +
    '<div class="auth-pg auth-p2"><div class="auth-side">' + heroHTML() + info + '</div>' + footerHTML('foot-m') + '</div>' +
    '</div></div>';
  return (
    '<section class="auth" data-pane="' + aktif + '" data-page="1">' +
    '<div class="auth-ptr" aria-hidden="true">' + gacoanLoaderHTML() + '</div>' +
    '<div class="auth-right"><div class="auth-deck">' +
    pane('jastip', bodyFor(mode, ctx), infoHTML('jastip'), 'jastiper') +
    pane('jastiper', joinBody(ctx), infoHTML('jastiper'), 'jastip') +
    '</div></div>' +
    /* --- hanya laptop: panel kiri + footer --- */
    '<aside class="auth-aside">' + themeBtn() + heroHTML() + infoHTML('jastip') + infoHTML('jastiper') + '</aside>' +
    footerHTML('foot-d') +
    '<button type="button" class="auth-nav auth-next" data-act="down" aria-label="Lihat cara kerja">' + ICON.down + '</button>' +
    '<button type="button" class="auth-nav auth-prev" data-act="up" aria-label="Kembali ke atas">' + ICON.up + '</button>' +
    '</section>'
  );
};
