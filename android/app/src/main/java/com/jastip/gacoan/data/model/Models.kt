package com.jastip.gacoan.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

object Constants {
    const val SUPABASE_URL = "https://bmhjbutnunmymrcldhmo.supabase.co"
    const val SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtaGpidXRudW5teW1yY2xkaG1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2Njk0MDgsImV4cCI6MjEwODI0NTQwOH0.jw2cdtuxN6eM9IIyQ9RsM_vJsrf9Rq5TAEpLYGmTj9s"
    const val BUCKET_BUKTI = "bukti"

    val DEFAULT_MENU = listOf("Mie Gacoan", "Udang Keju", "Thai Tea Iced")
    val SPICE_LEVELS = (1..8).toList()

    const val STATUS_OPEN = "open"
    const val STATUS_CLOSED = "closed"
    const val STATUS_SETTLED = "settled"

    const val POLL_INTERVAL_MS = 12000L
}

@Serializable
data class Session(
    val id: String = "",
    val kode: String = "",
    val owner: String = "",
    val judul: String = "Titipan Gacoan",
    val status: String = Constants.STATUS_OPEN, // open, closed, settled
    val pajak: Double = 10.0,
    val fee: Long = 0,
    val prices: Map<String, Double> = emptyMap(),
    val tgl: String? = null,
    val waktu: String? = null,
    val nama: String? = null,
    val rek: String? = null,
    val wa: String? = null
)

@Serializable
data class Order(
    val id: String = "",
    @SerialName("sesi_id") val sesiId: String = "",
    val nama: String = "",
    val item: String = "",
    val level: String? = null,
    val paid: Boolean = false,
    val bukti: String? = null,
    @SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class Profile(
    val id: String = "",
    val nama: String = "",
    val rek: String = "",
    val wa: String = ""
)

@Serializable
data class AuthUser(
    val id: String = "",
    val email: String? = null,
    @SerialName("user_metadata") val userMetadata: Map<String, String>? = null
)

@Serializable
data class AuthSession(
    @SerialName("access_token") val accessToken: String = "",
    @SerialName("token_type") val tokenType: String = "",
    val user: AuthUser? = null
)

data class PersonGroup(
    val nama: String,
    val orders: List<Order>,
    val sum: Long,
    val paid: Boolean,
    val proofUrl: String? = null
)

data class RecapSummary(
    val groups: List<PersonGroup>,
    val subtotal: Long,
    val pb1: Long,
    val fee: Long,
    val total: Long,
    val rounding: Long
)
