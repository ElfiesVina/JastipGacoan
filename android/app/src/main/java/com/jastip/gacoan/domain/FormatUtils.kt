package com.jastip.gacoan.domain

import com.jastip.gacoan.data.model.Order
import java.net.URLEncoder
import java.security.SecureRandom
import java.text.NumberFormat
import java.util.Locale

object FormatUtils {

    private val idLocale = Locale("id", "ID")
    private val numberFormat = NumberFormat.getNumberInstance(idLocale)

    /** Format Rupiah: 12500 -> "Rp12.500"; negatif -> "–Rp12.500" */
    fun rp(amount: Long): String {
        val prefix = if (amount < 0) "–Rp" else "Rp"
        val formatted = numberFormat.format(Math.abs(amount))
        return "$prefix$formatted"
    }

    /** Kunci pencarian/pengelompokan nama: huruf kecil tanpa spasi berlebih */
    fun nameKey(s: String): String = s.trim().lowercase(Locale.ROOT)

    /** Format label pesanan: "Mie Gacoan · Level 3" atau "Udang Keju" */
    fun orderLabel(item: String, level: String?): String {
        return if (!level.isNullOrBlank()) {
            "$item · Level $level"
        } else {
            item
        }
    }

    fun orderLabel(order: Order): String = orderLabel(order.item, order.level)

    /** Apakah menu ini mie (berhak memilih level pedas)? */
    fun isMie(item: String?): Boolean {
        return item?.contains("mie", ignoreCase = true) == true
    }

    /** Ambil angka saja dari nomor telepon, awalan 0 diganti 62 */
    fun normalizePhone(phone: String?): String {
        if (phone.isNullOrBlank()) return ""
        val digits = phone.filter { it.isDigit() }
        return if (digits.startsWith("0")) {
            "62" + digits.substring(1)
        } else {
            digits
        }
    }

    /** Link WhatsApp */
    fun waLink(phone: String?, text: String): String {
        val normalized = normalizePhone(phone)
        val encodedText = try {
            URLEncoder.encode(text, "UTF-8")
        } catch (_: Exception) {
            text
        }
        return "https://wa.me/$normalized?text=$encodedText"
    }

    /**
     * Buat kode sesi acak 8 karakter memakai SecureRandom (sulit ditebak).
     * Karakter mirip (i, l, o, 0, 1) sengaja dihilangkan seperti di versi web.
     */
    fun generateSessionCode(): String {
        val chars = "abcdefghjkmnpqrstuvwxyz23456789"
        val random = SecureRandom()
        val sb = StringBuilder(8)
        repeat(8) {
            sb.append(chars[random.nextInt(chars.length)])
        }
        return sb.toString()
    }
}
