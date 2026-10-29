/**
 * js/components/otp-boxes.js
 * Kolom kode verifikasi: 6 kotak terpisah. Hanya urusan tampilan dan ketikan
 * (pindah otomatis, hapus mundur, tempel 6 angka, panah kiri/kanan). Tidak bicara ke backend.
 *
 * HTML-nya dibuat oleh otpBoxesHTML() (dipakai auth-forms.js); initOtpBoxes() memasang perilakunya.
 */
import { t } from '../core/i18n.js';

/** Jumlah digit kode. */
export const OTP_LEN = 6;

/** HTML enam kotak. Kotak pertama membawa autocomplete="one-time-code" supaya HP bisa mengisi dari SMS/email. */
export const otpBoxesHTML = () => {
  let kotak = '';
  for (let i = 0; i < OTP_LEN; i++) {
    kotak += '<input class="otp-box" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" ' +
      'autocomplete="' + (i === 0 ? 'one-time-code' : 'off') + '" enterkeyhint="' + (i === OTP_LEN - 1 ? 'go' : 'next') + '" ' +
      'data-i="' + i + '" aria-label="' + t('pd.otpDigit', { n: i + 1 }) + '">';
  }
  return '<div class="otp-boxes" role="group" dir="ltr">' + kotak + '</div>';
};

/** Semua kotak di dalam form. @param {ParentNode} root */
const boxes = (root) => [...root.querySelectorAll('.otp-box')];

/** Isi kode saat ini (hanya angka). @param {ParentNode} root @returns {string} */
export const readOtp = (root) => boxes(root).map((b) => b.value).join('');

/** Kosongkan semua kotak lalu fokus ke kotak pertama. @param {ParentNode} root */
export function clearOtp(root) {
  const b = boxes(root);
  b.forEach((x) => { x.value = ''; });
  b[0]?.focus();
}

/** Aktif/nonaktifkan semua kotak. @param {ParentNode} root @param {boolean} off */
export const disableOtp = (root, off) => boxes(root).forEach((b) => { b.disabled = off; });

/** Tampilkan / sembunyikan pesan galat di bawah kotak. @param {ParentNode} root @param {string} [msg] kosong = sembunyikan */
export function setOtpError(root, msg) {
  const el = root.querySelector('.otp-err');
  const grup = root.querySelector('.otp-boxes');
  if (!el) return;
  el.textContent = msg || '';
  el.hidden = !msg;
  grup?.classList.toggle('is-bad', Boolean(msg));
  if (msg && grup) { // getar singkat supaya terasa salah
    grup.classList.remove('shake');
    void grup.offsetWidth; // paksa ulang animasi
    grup.classList.add('shake');
  }
}

/**
 * Pasang perilaku ketikan pada enam kotak di dalam form.
 * @param {HTMLElement} form wadah yang berisi .otp-box
 * @param {{onComplete?:Function}} [opt] onComplete dipanggil saat keenam kotak terisi (mis. kirim otomatis)
 */
export function initOtpBoxes(form, opt = {}) {
  const b = boxes(form);
  const fokus = (i) => { const x = b[Math.max(0, Math.min(OTP_LEN - 1, i))]; x?.focus(); x?.select?.(); };
  const cek = () => { if (readOtp(form).length === OTP_LEN) opt.onComplete?.(); };

  /** Taruh deretan angka mulai dari kotak `dari`. */
  const isi = (dari, digits) => {
    digits.split('').slice(0, OTP_LEN - dari).forEach((d, k) => { b[dari + k].value = d; });
    fokus(Math.min(OTP_LEN - 1, dari + digits.length));
    cek();
  };

  b.forEach((el, i) => {
    el.addEventListener('input', () => {
      const d = el.value.replace(/\D/g, '');
      setOtpError(form);
      if (d.length > 1) { el.value = ''; isi(i, d); return; } // isi otomatis dari keyboard/SMS menaruh banyak angka sekaligus
      el.value = d;
      if (d) { fokus(i + 1); cek(); }
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !el.value) { e.preventDefault(); if (i > 0) { b[i - 1].value = ''; fokus(i - 1); } }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); fokus(i - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); fokus(i + 1); }
    });
    el.addEventListener('paste', (e) => {
      const d = (e.clipboardData?.getData('text') || '').replace(/\D/g, '');
      if (!d) return;
      e.preventDefault();
      setOtpError(form);
      isi(d.length >= OTP_LEN ? 0 : i, d); // tempel 6 digit selalu mulai dari kotak pertama
    });
    el.addEventListener('focus', () => el.select());
  });
}
