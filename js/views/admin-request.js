/**
 * js/views/admin-request.js
 * Pengajuan jadi admin jastip dari layar daftar (sebelum login). Memakai sheet #dlg yang sama dengan
 * "Yang baru". Developer menyetujuinya di tab Persetujuan.
 */
import { $, dlg, esc } from '../core/dom.js';
import { toast, lock } from '../core/ui.js';
import { t } from '../core/i18n.js';
import { ajukanJastip } from '../api/persetujuan.api.js';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Buka sheet pengajuan. Email yang sudah terisi di form daftar ikut terbawa. */
export function openRequestForm() {
  const email = $('#em')?.value?.trim() || '';
  const name = $('#nm')?.value?.trim() || '';
  $('#dlt').textContent = t('rq.title');
  $('#dl').innerHTML =
    '<form class="request-form" data-form="request" novalidate><p class="form-note">' + t('rq.lead') + '</p>' +
    '<label class="form-label" for="rq-nama">' + t('rq.name') + '</label>' +
    '<input class="form-input" id="rq-nama" name="nama" maxlength="60" autocomplete="name" value="' + esc(name) + '">' +
    '<label class="form-label" for="rq-email">' + t('rq.email') + '</label>' +
    '<input class="form-input" id="rq-email" name="email" type="email" inputmode="email" maxlength="120" autocomplete="email" value="' + esc(email) + '">' +
    '<label class="form-label" for="rq-pesan">' + t('rq.msg') + '</label>' +
    '<textarea class="form-input" id="rq-pesan" name="pesan" rows="3" maxlength="200"></textarea>' +
    '<button type="submit" class="profile-button-primary request-send">' + t('rq.send') + '</button></form>';
  dlg.showModal ? dlg.showModal() : dlg.setAttribute('open', '');
}

/** Kirim pengajuan. @param {HTMLFormElement} form */
export function submitRequest(form) {
  return lock(async () => {
    const nama = form.nama.value.trim();
    const email = form.email.value.trim();
    if (nama.length < 2 || !EMAIL_RE.test(email)) { toast(t('rq.invalid'), 1); return; }
    const { error } = await ajukanJastip({ email, nama, pesan: form.pesan.value.trim() });
    if (error) { toast(error.message || t('common.error'), 1); return; }
    dlg.close();
    toast(t('rq.sent'));
  });
}
