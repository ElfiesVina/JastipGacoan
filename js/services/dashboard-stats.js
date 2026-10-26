/**
 * js/services/dashboard-stats.js
 * Angka ringkasan & penyaringan sesi untuk beranda jastip (data asli dari database).
 */

/** Sesi yang masih berjalan = belum terbit rekap (status open atau closed). */
export const isActiveSession = (session) => session.status === 'open' || session.status === 'closed';

/**
 * Statistik profil.
 *  total  = semua sesi milik jastip
 *  dibuka = sesi berstatus open
 *  rekap  = sesi berstatus settled
 * @param {{status:string}[]} sessions
 */
export function countSessions(sessions) {
  const list = sessions || [];
  return {
    total: list.length,
    dibuka: list.filter((s) => s.status === 'open').length,
    rekap: list.filter((s) => s.status === 'settled').length,
  };
}

/**
 * Ringkasan pesanan per sesi: jumlah order dan yang belum bayar.
 * @param {{sesi_id:string,paid:boolean}[]} orders
 * @returns {Record<string,{total:number,unpaid:number}>}
 */
export function summarizeOrders(orders) {
  const summary = {};
  for (const order of orders || []) {
    const row = (summary[order.sesi_id] ||= { total: 0, unpaid: 0 });
    row.total += 1;
    if (!order.paid) row.unpaid += 1;
  }
  return summary;
}
