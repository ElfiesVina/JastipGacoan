package com.jastip.gacoan.data.remote

import com.jastip.gacoan.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.*
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import java.util.concurrent.TimeUnit

class SupabaseClient(private val getAuthToken: () -> String?) {

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        encodeDefaults = true
    }

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .writeTimeout(20, TimeUnit.SECONDS)
        .build()

    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()

    private fun buildRequest(url: String, method: String = "GET", body: RequestBody? = null, useAuth: Boolean = false): Request {
        val builder = Request.Builder()
            .url(url)
            .addHeader("apikey", Constants.SUPABASE_ANON_KEY)
            .addHeader("Content-Type", "application/json")

        val token = if (useAuth) getAuthToken() else null
        if (!token.isNullOrBlank()) {
            builder.addHeader("Authorization", "Bearer $token")
        } else {
            builder.addHeader("Authorization", "Bearer ${Constants.SUPABASE_ANON_KEY}")
        }

        when (method.uppercase()) {
            "GET" -> builder.get()
            "POST" -> builder.post(body ?: "".toRequestBody(jsonMediaType))
            "PATCH" -> builder.patch(body ?: "".toRequestBody(jsonMediaType))
            "DELETE" -> builder.delete(body)
            "PUT" -> builder.put(body ?: "".toRequestBody(jsonMediaType))
        }

        return builder.build()
    }

    private suspend fun executeRequest(request: Request): String = withContext(Dispatchers.IO) {
        val response = httpClient.newCall(request).execute()
        val bodyString = response.body?.string() ?: ""
        if (!response.isSuccessful) {
            val errorMsg = try {
                val errorJson = json.parseToJsonElement(bodyString).jsonObject
                errorJson["message"]?.jsonPrimitive?.content
                    ?: errorJson["error_description"]?.jsonPrimitive?.content
                    ?: errorJson["error"]?.jsonPrimitive?.content
                    ?: "Terjadi kesalahan (${response.code})"
            } catch (_: Exception) {
                "Gagal menghubungi server (${response.code})"
            }
            throw IOException(errorMsg)
        }
        bodyString
    }

    /* -------------------------------------------------------------
       PUBLIC API (Penitip / Customer - Tanpa Login)
       ------------------------------------------------------------- */

    suspend fun getPublicSesi(kode: String): Result<Session?> = runCatching {
        val url = "${Constants.SUPABASE_URL}/rest/v1/rpc/get_sesi"
        val payload = buildJsonObject { put("k", kode) }.toString()
        val request = buildRequest(url, "POST", payload.toRequestBody(jsonMediaType))
        val responseText = executeRequest(request).trim()

        if (responseText.isEmpty() || responseText == "null") return@runCatching null

        val element = json.parseToJsonElement(responseText)
        val obj = if (element is JsonArray && element.isNotEmpty()) element[0].jsonObject else element.jsonObject

        val pricesMap = mutableMapOf<String, Double>()
        obj["prices"]?.let { p ->
            if (p is JsonObject) {
                p.forEach { (k, v) -> pricesMap[k] = v.jsonPrimitive.doubleOrNull ?: 0.0 }
            }
        }

        Session(
            id = obj["id"]?.jsonPrimitive?.contentOrNull ?: "",
            kode = kode,
            owner = obj["owner"]?.jsonPrimitive?.contentOrNull ?: "",
            judul = obj["judul"]?.jsonPrimitive?.contentOrNull ?: "Titipan Gacoan",
            status = obj["status"]?.jsonPrimitive?.contentOrNull ?: Constants.STATUS_OPEN,
            pajak = obj["pajak"]?.jsonPrimitive?.doubleOrNull ?: 10.0,
            fee = obj["fee"]?.jsonPrimitive?.longOrNull ?: 0L,
            prices = pricesMap,
            tgl = obj["tgl"]?.jsonPrimitive?.contentOrNull,
            waktu = obj["waktu"]?.jsonPrimitive?.contentOrNull,
            nama = obj["nama"]?.jsonPrimitive?.contentOrNull,
            rek = obj["rek"]?.jsonPrimitive?.contentOrNull,
            wa = obj["wa"]?.jsonPrimitive?.contentOrNull
        )
    }

    suspend fun listPublicPesanan(kode: String): Result<List<Order>> = runCatching {
        val url = "${Constants.SUPABASE_URL}/rest/v1/rpc/list_pesanan"
        val payload = buildJsonObject { put("k", kode) }.toString()
        val request = buildRequest(url, "POST", payload.toRequestBody(jsonMediaType))
        val responseText = executeRequest(request)

        val array = json.parseToJsonElement(responseText).jsonArray
        array.map { elem ->
            val obj = elem.jsonObject
            Order(
                id = obj["id"]?.jsonPrimitive?.contentOrNull ?: "",
                sesiId = obj["sesi_id"]?.jsonPrimitive?.contentOrNull ?: "",
                nama = obj["nama"]?.jsonPrimitive?.contentOrNull ?: "",
                item = obj["item"]?.jsonPrimitive?.contentOrNull ?: "",
                level = obj["level"]?.jsonPrimitive?.contentOrNull,
                paid = obj["paid"]?.jsonPrimitive?.booleanOrNull ?: false,
                bukti = obj["bukti"]?.jsonPrimitive?.contentOrNull
            )
        }
    }

    suspend fun addPesanan(kode: String, nama: String, item: String, level: String?): Result<Boolean> = runCatching {
        val url = "${Constants.SUPABASE_URL}/rest/v1/rpc/tambah_pesanan"
        val payload = buildJsonObject {
            put("k", kode)
            put("n", nama)
            put("i", item)
            put("l", level ?: "")
        }.toString()
        val request = buildRequest(url, "POST", payload.toRequestBody(jsonMediaType))
        val responseText = executeRequest(request).trim()
        responseText.toBooleanStrictOrNull() ?: (responseText == "true")
    }

    suspend fun markPaid(kode: String, nama: String, buktiUrl: String?): Result<Unit> = runCatching {
        val url = "${Constants.SUPABASE_URL}/rest/v1/rpc/tandai_bayar"
        val payload = buildJsonObject {
            put("k", kode)
            put("n", nama)
            if (buktiUrl != null) put("b", buktiUrl) else put("b", JsonNull)
        }.toString()
        val request = buildRequest(url, "POST", payload.toRequestBody(jsonMediaType))
        executeRequest(request)
    }

    suspend fun uploadBuktiImage(path: String, bytes: ByteArray): Result<String> = runCatching {
        val url = "${Constants.SUPABASE_URL}/storage/v1/object/${Constants.BUCKET_BUKTI}/$path"
        val mediaType = "image/jpeg".toMediaType()
        val requestBody = bytes.toRequestBody(mediaType)

        val request = Request.Builder()
            .url(url)
            .addHeader("apikey", Constants.SUPABASE_ANON_KEY)
            .addHeader("Authorization", "Bearer ${Constants.SUPABASE_ANON_KEY}")
            .post(requestBody)
            .build()

        executeRequest(request)
        "${Constants.SUPABASE_URL}/storage/v1/object/public/${Constants.BUCKET_BUKTI}/$path"
    }

    /* -------------------------------------------------------------
       AUTHENTICATION (Supabase Auth)
       ------------------------------------------------------------- */

    suspend fun signIn(email: String, pass: String): Result<AuthSession> = runCatching {
        val url = "${Constants.SUPABASE_URL}/auth/v1/token?grant_type=password"
        val payload = buildJsonObject {
            put("email", email)
            put("password", pass)
        }.toString()
        val request = buildRequest(url, "POST", payload.toRequestBody(jsonMediaType))
        val responseText = executeRequest(request)
        val obj = json.parseToJsonElement(responseText).jsonObject

        val token = obj["access_token"]?.jsonPrimitive?.content ?: ""
        val userObj = obj["user"]?.jsonObject
        val user = userObj?.let {
            AuthUser(
                id = it["id"]?.jsonPrimitive?.content ?: "",
                email = it["email"]?.jsonPrimitive?.contentOrNull
            )
        }

        AuthSession(accessToken = token, tokenType = "Bearer", user = user)
    }

    suspend fun signUp(email: String, pass: String, nama: String): Result<AuthSession> = runCatching {
        val url = "${Constants.SUPABASE_URL}/auth/v1/signup"
        val payload = buildJsonObject {
            put("email", email)
            put("password", pass)
            putJsonObject("data") {
                put("nama", nama)
            }
        }.toString()
        val request = buildRequest(url, "POST", payload.toRequestBody(jsonMediaType))
        val responseText = executeRequest(request)
        val obj = json.parseToJsonElement(responseText).jsonObject

        val token = obj["access_token"]?.jsonPrimitive?.contentOrNull ?: ""
        val userObj = obj["user"]?.jsonObject
        val user = userObj?.let {
            AuthUser(
                id = it["id"]?.jsonPrimitive?.content ?: "",
                email = it["email"]?.jsonPrimitive?.contentOrNull
            )
        }

        AuthSession(accessToken = token, tokenType = "Bearer", user = user)
    }

    suspend fun sendResetPasswordEmail(email: String): Result<Unit> = runCatching {
        val url = "${Constants.SUPABASE_URL}/auth/v1/recover"
        val payload = buildJsonObject { put("email", email) }.toString()
        val request = buildRequest(url, "POST", payload.toRequestBody(jsonMediaType))
        executeRequest(request)
    }

    suspend fun verifyResetCode(email: String, code: String): Result<AuthSession> = runCatching {
        val url = "${Constants.SUPABASE_URL}/auth/v1/verify"
        val payload = buildJsonObject {
            put("type", "recovery")
            put("email", email)
            put("token", code)
        }.toString()
        val request = buildRequest(url, "POST", payload.toRequestBody(jsonMediaType))
        val responseText = executeRequest(request)
        val obj = json.parseToJsonElement(responseText).jsonObject

        val token = obj["access_token"]?.jsonPrimitive?.content ?: ""
        val userObj = obj["user"]?.jsonObject
        val user = userObj?.let {
            AuthUser(
                id = it["id"]?.jsonPrimitive?.content ?: "",
                email = it["email"]?.jsonPrimitive?.contentOrNull
            )
        }

        AuthSession(accessToken = token, tokenType = "Bearer", user = user)
    }

    suspend fun updatePassword(newPass: String): Result<Unit> = runCatching {
        val url = "${Constants.SUPABASE_URL}/auth/v1/user"
        val payload = buildJsonObject { put("password", newPass) }.toString()
        val request = buildRequest(url, "PUT", payload.toRequestBody(jsonMediaType), useAuth = true)
        executeRequest(request)
    }

    /* -------------------------------------------------------------
       ADMIN / JASTIP (Butuh Auth Token)
       ------------------------------------------------------------- */

    suspend fun getProfile(userId: String): Result<Profile?> = runCatching {
        val url = "${Constants.SUPABASE_URL}/rest/v1/profiles?id=eq.$userId&select=*"
        val request = buildRequest(url, "GET", useAuth = true)
        val responseText = executeRequest(request)
        val array = json.parseToJsonElement(responseText).jsonArray
        if (array.isEmpty()) return@runCatching null
        val obj = array[0].jsonObject
        Profile(
            id = obj["id"]?.jsonPrimitive?.content ?: userId,
            nama = obj["nama"]?.jsonPrimitive?.contentOrNull ?: "",
            rek = obj["rek"]?.jsonPrimitive?.contentOrNull ?: "",
            wa = obj["wa"]?.jsonPrimitive?.contentOrNull ?: ""
        )
    }

    suspend fun saveProfile(profile: Profile): Result<Unit> = runCatching {
        val url = "${Constants.SUPABASE_URL}/rest/v1/profiles"
        val payload = buildJsonObject {
            put("id", profile.id)
            put("nama", profile.nama)
            put("rek", profile.rek)
            put("wa", profile.wa)
        }.toString()

        val reqBuilder = Request.Builder()
            .url(url)
            .addHeader("apikey", Constants.SUPABASE_ANON_KEY)
            .addHeader("Authorization", "Bearer ${getAuthToken() ?: Constants.SUPABASE_ANON_KEY}")
            .addHeader("Content-Type", "application/json")
            .addHeader("Prefer", "resolution=merge-duplicates")
            .post(payload.toRequestBody(jsonMediaType))

        executeRequest(reqBuilder.build())
    }

    suspend fun listMySessions(): Result<List<Session>> = runCatching {
        val url = "${Constants.SUPABASE_URL}/rest/v1/sesi?select=kode,judul,status,tgl,id,owner,created_at&order=created_at.desc"
        val request = buildRequest(url, "GET", useAuth = true)
        val responseText = executeRequest(request)
        val array = json.parseToJsonElement(responseText).jsonArray
        array.map { elem ->
            val obj = elem.jsonObject
            Session(
                id = obj["id"]?.jsonPrimitive?.contentOrNull ?: "",
                kode = obj["kode"]?.jsonPrimitive?.contentOrNull ?: "",
                owner = obj["owner"]?.jsonPrimitive?.contentOrNull ?: "",
                judul = obj["judul"]?.jsonPrimitive?.contentOrNull ?: "Titipan Gacoan",
                status = obj["status"]?.jsonPrimitive?.contentOrNull ?: Constants.STATUS_OPEN,
                tgl = obj["tgl"]?.jsonPrimitive?.contentOrNull
            )
        }
    }

    suspend fun getMySession(kode: String): Result<Session?> = runCatching {
        val url = "${Constants.SUPABASE_URL}/rest/v1/sesi?kode=eq.$kode&select=*"
        val request = buildRequest(url, "GET", useAuth = true)
        val responseText = executeRequest(request)
        val array = json.parseToJsonElement(responseText).jsonArray
        if (array.isEmpty()) return@runCatching null
        val obj = array[0].jsonObject

        val pricesMap = mutableMapOf<String, Double>()
        obj["prices"]?.let { p ->
            if (p is JsonObject) {
                p.forEach { (k, v) -> pricesMap[k] = v.jsonPrimitive.doubleOrNull ?: 0.0 }
            }
        }

        Session(
            id = obj["id"]?.jsonPrimitive?.contentOrNull ?: "",
            kode = obj["kode"]?.jsonPrimitive?.contentOrNull ?: kode,
            owner = obj["owner"]?.jsonPrimitive?.contentOrNull ?: "",
            judul = obj["judul"]?.jsonPrimitive?.contentOrNull ?: "Titipan Gacoan",
            status = obj["status"]?.jsonPrimitive?.contentOrNull ?: Constants.STATUS_OPEN,
            pajak = obj["pajak"]?.jsonPrimitive?.doubleOrNull ?: 10.0,
            fee = obj["fee"]?.jsonPrimitive?.longOrNull ?: 0L,
            prices = pricesMap,
            tgl = obj["tgl"]?.jsonPrimitive?.contentOrNull,
            waktu = obj["waktu"]?.jsonPrimitive?.contentOrNull
        )
    }

    suspend fun createSession(kode: String, owner: String, judul: String): Result<Session> = runCatching {
        val url = "${Constants.SUPABASE_URL}/rest/v1/sesi"
        val payload = buildJsonObject {
            put("kode", kode)
            put("owner", owner)
            put("judul", judul)
        }.toString()

        val reqBuilder = Request.Builder()
            .url(url)
            .addHeader("apikey", Constants.SUPABASE_ANON_KEY)
            .addHeader("Authorization", "Bearer ${getAuthToken() ?: Constants.SUPABASE_ANON_KEY}")
            .addHeader("Content-Type", "application/json")
            .addHeader("Prefer", "return=representation")
            .post(payload.toRequestBody(jsonMediaType))

        val responseText = executeRequest(reqBuilder.build())
        val array = json.parseToJsonElement(responseText).jsonArray
        val obj = array[0].jsonObject
        Session(
            id = obj["id"]?.jsonPrimitive?.content ?: "",
            kode = obj["kode"]?.jsonPrimitive?.content ?: kode,
            owner = owner,
            judul = judul,
            status = Constants.STATUS_OPEN
        )
    }

    suspend fun updateSessionStatus(id: String, newStatus: String): Result<Unit> = runCatching {
        val url = "${Constants.SUPABASE_URL}/rest/v1/sesi?id=eq.$id"
        val payload = buildJsonObject { put("status", newStatus) }.toString()
        val request = buildRequest(url, "PATCH", payload.toRequestBody(jsonMediaType), useAuth = true)
        executeRequest(request)
    }

    suspend fun publishRecap(id: String, prices: Map<String, Double>, pajak: Double, fee: Long): Result<Unit> = runCatching {
        val url = "${Constants.SUPABASE_URL}/rest/v1/sesi?id=eq.$id"
        val payload = buildJsonObject {
            put("status", Constants.STATUS_SETTLED)
            put("pajak", pajak)
            put("fee", fee)
            putJsonObject("prices") {
                prices.forEach { (k, v) -> put(k, v) }
            }
        }.toString()
        val request = buildRequest(url, "PATCH", payload.toRequestBody(jsonMediaType), useAuth = true)
        executeRequest(request)
    }

    suspend fun listOwnerPesanan(sesiId: String): Result<List<Order>> = runCatching {
        val url = "${Constants.SUPABASE_URL}/rest/v1/pesanan?sesi_id=eq.$sesiId&select=*&order=created_at.asc"
        val request = buildRequest(url, "GET", useAuth = true)
        val responseText = executeRequest(request)
        val array = json.parseToJsonElement(responseText).jsonArray
        array.map { elem ->
            val obj = elem.jsonObject
            Order(
                id = obj["id"]?.jsonPrimitive?.contentOrNull ?: "",
                sesiId = obj["sesi_id"]?.jsonPrimitive?.contentOrNull ?: sesiId,
                nama = obj["nama"]?.jsonPrimitive?.contentOrNull ?: "",
                item = obj["item"]?.jsonPrimitive?.contentOrNull ?: "",
                level = obj["level"]?.jsonPrimitive?.contentOrNull,
                paid = obj["paid"]?.jsonPrimitive?.booleanOrNull ?: false,
                bukti = obj["bukti"]?.jsonPrimitive?.contentOrNull,
                createdAt = obj["created_at"]?.jsonPrimitive?.contentOrNull
            )
        }
    }

    suspend fun deletePesanan(id: String): Result<Unit> = runCatching {
        val url = "${Constants.SUPABASE_URL}/rest/v1/pesanan?id=eq.$id"
        val request = buildRequest(url, "DELETE", useAuth = true)
        executeRequest(request)
    }

    suspend fun setOrdersPaid(ids: List<String>, paid: Boolean): Result<Unit> = runCatching {
        if (ids.isEmpty()) return@runCatching
        val idsQuery = ids.joinToString(",")
        val url = "${Constants.SUPABASE_URL}/rest/v1/pesanan?id=in.($idsQuery)"
        val payload = buildJsonObject { put("paid", paid) }.toString()
        val request = buildRequest(url, "PATCH", payload.toRequestBody(jsonMediaType), useAuth = true)
        executeRequest(request)
    }
}
