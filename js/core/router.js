/**
 * js/core/router.js
 * Router berbasis hash (#), cocok untuk hosting statis seperti Vercel.
 *   #/s/<kode>  -> halaman PENITIP
 *   #/a/<kode>  -> detail sesi ADMIN
 *   lainnya     -> dashboard / login ADMIN
 */
import { state } from './state.js';
import { showCustomer } from '../views/customer.js';
import { showAdmin } from '../views/admin-auth.js';

/** Baca URL saat ini lalu tampilkan halaman yang sesuai. */
export function route() {
  clearInterval(state.timer); // hentikan polling halaman sebelumnya
  const m = location.hash.match(/^#\/s\/(\w+)/);
  document.body.classList.toggle('cust-mode', !!m); // lebar & tata letak khusus halaman penitip
  m ? showCustomer(m[1]) : showAdmin();
}
