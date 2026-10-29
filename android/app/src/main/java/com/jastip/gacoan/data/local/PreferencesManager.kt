package com.jastip.gacoan.data.local

import android.content.Context
import android.content.SharedPreferences

class PreferencesManager(context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences("titip_gacoan_prefs", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_LAST_NAME = "nm"
        private const val KEY_LAST_SESSION_CODE = "last_code"
        private const val KEY_LAST_SESSION_TITLE = "last_title"
        private const val KEY_AUTH_TOKEN = "auth_token"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_USER_EMAIL = "user_email"
    }

    var lastName: String
        get() = prefs.getString(KEY_LAST_NAME, "") ?: ""
        set(value) = prefs.edit().putString(KEY_LAST_NAME, value).apply()

    var lastSessionCode: String
        get() = prefs.getString(KEY_LAST_SESSION_CODE, "") ?: ""
        set(value) = prefs.edit().putString(KEY_LAST_SESSION_CODE, value).apply()

    var lastSessionTitle: String
        get() = prefs.getString(KEY_LAST_SESSION_TITLE, "") ?: ""
        set(value) = prefs.edit().putString(KEY_LAST_SESSION_TITLE, value).apply()

    var authToken: String?
        get() = prefs.getString(KEY_AUTH_TOKEN, null)
        set(value) = prefs.edit().putString(KEY_AUTH_TOKEN, value).apply()

    var userId: String?
        get() = prefs.getString(KEY_USER_ID, null)
        set(value) = prefs.edit().putString(KEY_USER_ID, value).apply()

    var userEmail: String?
        get() = prefs.getString(KEY_USER_EMAIL, null)
        set(value) = prefs.edit().putString(KEY_USER_EMAIL, value).apply()

    fun saveLastSession(code: String, title: String) {
        lastSessionCode = code
        lastSessionTitle = title
    }

    fun clearAuth() {
        prefs.edit()
            .remove(KEY_AUTH_TOKEN)
            .remove(KEY_USER_ID)
            .remove(KEY_USER_EMAIL)
            .apply()
    }
}
