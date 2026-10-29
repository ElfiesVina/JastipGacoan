package com.jastip.gacoan

import android.app.Application
import com.jastip.gacoan.data.local.PreferencesManager
import com.jastip.gacoan.data.remote.SupabaseClient

class GacoanApp : Application() {

    lateinit var prefs: PreferencesManager
        private set

    lateinit var supabaseClient: SupabaseClient
        private set

    companion object {
        lateinit var instance: GacoanApp
            private set
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
        prefs = PreferencesManager(this)
        supabaseClient = SupabaseClient { prefs.authToken }
    }
}
