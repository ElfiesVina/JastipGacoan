/**
 * js/core/events.js
 * Semua event listener dipasang di sini sebagai "delegasi" pada document,
 * sehingga tombol/form yang digambar ulang tetap berfungsi.
 *
 * Konvensi HTML:
 *   data-act="nama"   -> klik memanggil ACT[nama]
 *   data-form="nama"  -> submit memanggil FORM[nama]
 */
import { $, dlg } from './dom.js';
import { draft } from './state.js';
import { route } from './router.js';
import { openChangelog } from '../services/changelog.js';
import { saveRecapImage } from '../services/recap-image.js';
import { syncChoice } from '../components/customer-forms.js';
import { submitOrder, submitPayment, refreshWhenVisible, joinSession, openLast } from '../views/customer.js';
import { authenticate, logout, showAuth, togglePassword, forgotPassword, sendReset, verifyCode, resendCode, saveNewPassword, setAuthPage, setAuthPane, backToLogin, verifyPendingOtp, resendPendingOtp } from '../views/admin-auth.js';
import { toggleTheme } from './theme.js';
import { copyRecent } from './recent.js';
import { createSession } from '../views/admin-dashboard.js';
import { toggleCojastip, approveRequest, rejectRequest, startReview, chooseLanguage } from '../views/admin-tabs.js';
import { openProfileForm, closeProfileForm, saveProfileForm, previewPhoto } from '../views/admin-profile.js';
import { reloadSession, setStatus, publishRecap, deleteOrder, togglePaid, copyLink } from '../views/admin-session.js';

/** Aksi tombol (data-act). Parameter: elemen tombol yang diketuk. */
const ACT = {
  cl: openChangelog,
  theme: toggleTheme,
  'profile-edit': openProfileForm,
  'profile-cancel': closeProfileForm,
  'cojastip-toggle': toggleCojastip,
  'req-approve': approveRequest,
  'req-reject': rejectRequest,
  'req-start': startReview,
  'otp-resend': resendPendingOtp,
  'pending-back': backToLogin,
  'set-lang': chooseLanguage,
  'copy-recent': copyRecent,
  x: () => dlg.close(),
  retry: () => route(),
  reload: reloadSession,
  img: saveRecapImage,
  copy: copyLink,
  'to-signup': () => showAuth('signup'),
  'to-login': () => showAuth('login'),
  pw: togglePassword,
  forgot: forgotPassword,
  resend: resendCode,
  down: () => setAuthPage(2), // layar masuk: ke halaman cara kerja
  up: () => setAuthPage(1),   // layar masuk: kembali ke form
  pane: (b) => setAuthPane(b.dataset.p), // tab / tautan: geser ke Jastip atau Jastiper
  last: openLast,             // Jastiper: buka lagi sesi terakhir
  out: logout,
  sets: (b) => setStatus(b.dataset.s),
  del: deleteOrder,
  tog: (b) => togglePaid(b.dataset.k),
};

/** Aksi submit form (data-form). */
const FORM = {
  kirim: submitOrder,
  bayar: submitPayment,
  login: () => authenticate(false),
  signup: () => authenticate(true),
  reset: sendReset,
  otp: verifyCode,
  'pd-otp': verifyPendingOtp,
  join: joinSession,
  newpass: saveNewPassword,
  prof: saveProfileForm,
  news: createSession,
  settle: publishRecap,
};

/** Pasang semua listener. Dipanggil sekali dari main.js. */
export function bindEvents() {
  // klik: tombol data-act + level pedas (ketuk lagi untuk membatalkan)
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (b && ACT[b.dataset.act]) ACT[b.dataset.act](b, e);

    const t = e.target;
    if (t.matches && t.matches('input[name=level]')) {
      if (draft.l === t.value) { draft.l = ''; t.checked = false; }
      else draft.l = t.value;
    }
  });

  // submit: form data-form (cegah reload halaman)
  document.addEventListener('submit', (e) => {
    const f = e.target.closest('[data-form]');
    if (!f) return;
    e.preventDefault();
    FORM[f.dataset.form]?.(f);
  });

  // ketik nama: simpan ke draft agar tidak hilang saat tampilan digambar ulang
  document.addEventListener('input', (e) => {
    if (e.target.id === 'n') draft.n = e.target.value;
    if (e.target.id === 'otp') e.target.value = e.target.value.replace(/\D/g, ''); // kode: hanya angka (juga saat ditempel)
  });

  // pilihan radio & file bukti
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.name === 'item') { draft.i = t.value; syncChoice(); }
    else if (t.name === 'who') draft.who = t.value;
    else if (t.id === 'pfoto') previewPhoto(t);
    else if (t.id === 'bk') {
      draft.f = t.files[0] || null;
      $('#fn').textContent = draft.f ? draft.f.name : 'Pilih foto bukti';
      $('#fl').classList.toggle('has', !!draft.f);
    }
  });

  // ketuk area gelap di luar sheet = tutup
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });

  // tab kembali terlihat = segarkan data penitip
  document.addEventListener('visibilitychange', refreshWhenVisible);

  // pindah halaman lewat hash
  addEventListener('hashchange', route);
}
