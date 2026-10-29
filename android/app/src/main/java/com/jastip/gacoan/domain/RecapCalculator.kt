package com.jastip.gacoan.domain

import com.jastip.gacoan.data.model.Order
import com.jastip.gacoan.data.model.PersonGroup
import com.jastip.gacoan.data.model.RecapSummary
import com.jastip.gacoan.data.model.Session
import kotlin.math.roundToLong

object RecapCalculator {

    /** Harga dasar (sebelum pajak) sebuah menu */
    fun hargaDasar(item: String, prices: Map<String, Double>): Double {
        return prices[item] ?: 0.0
    }

    /** Harga satu pesanan setelah pajak gerai (PB1), dibulatkan ke Rp100 terdekat */
    fun hargaItem(item: String, prices: Map<String, Double>, pajak: Double): Long {
        val base = hargaDasar(item, prices)
        val withTax = base * (1.0 + (pajak / 100.0))
        return (Math.round(withTax / 100.0) * 100.0).roundToLong()
    }

    /**
     * Hitung rekap lengkap: pesanan dikelompokkan per orang (nama case-insensitive).
     * Logika identik 100% dengan js/services/calc.js.
     */
    fun hitungRekap(orders: List<Order>, session: Session): RecapSummary {
        val groupsMap = linkedMapOf<String, MutableList<Order>>()
        val displayNames = mutableMapOf<String, String>()

        for (order in orders) {
            val key = FormatUtils.nameKey(order.nama)
            if (!groupsMap.containsKey(key)) {
                groupsMap[key] = mutableListOf()
                displayNames[key] = order.nama.trim()
            }
            groupsMap[key]?.add(order)
        }

        val personGroups = mutableListOf<PersonGroup>()
        var subtotal = 0L
        var total = 0L

        for ((key, orderList) in groupsMap) {
            val personSum = orderList.sumOf { o ->
                hargaItem(o.item, session.prices, session.pajak)
            } + session.fee

            val allPaid = orderList.isNotEmpty() && orderList.all { it.paid }
            val proof = orderList.firstOrNull { !it.bukti.isNullOrBlank() }?.bukti

            personGroups.add(
                PersonGroup(
                    nama = displayNames[key] ?: key,
                    orders = orderList,
                    sum = personSum,
                    paid = allPaid,
                    proofUrl = proof
                )
            )

            subtotal += orderList.sumOf { o -> hargaDasar(o.item, session.prices).roundToLong() }
            total += personSum
        }

        val pb1 = Math.round((subtotal.toDouble() * session.pajak) / 100.0)
        val totalFee = session.fee * personGroups.size
        val rounding = total - subtotal - pb1 - totalFee

        return RecapSummary(
            groups = personGroups,
            subtotal = subtotal,
            pb1 = pb1,
            fee = totalFee,
            total = total,
            rounding = rounding
        )
    }

    /** Buat teks rekap untuk dibagikan ke WhatsApp */
    fun teksRekapWhatsApp(session: Session, orders: List<Order>): String {
        val recap = hitungRekap(orders, session)
        val sb = StringBuilder()
        sb.appendLine("*Daftar Titipan Gacoan*")
        recap.groups.forEachIndexed { i, group ->
            val orderListText = group.orders.joinToString(" + ") { FormatUtils.orderLabel(it) }
            sb.appendLine("${i + 1}. ${group.nama} – $orderListText = ${FormatUtils.rp(group.sum)}")
        }
        sb.appendLine()
        sb.appendLine("Total: ${FormatUtils.rp(recap.total)}")
        sb.appendLine("Transfer: ${session.rek ?: "-"}")
        sb.append("Status: ${if (recap.groups.all { it.paid }) "Semua Lunas ✓" else "Menunggu Pembayaran"}")
        return sb.toString()
    }
}
