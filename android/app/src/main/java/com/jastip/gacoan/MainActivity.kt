package com.jastip.gacoan

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import com.jastip.gacoan.ui.theme.BackgroundColor
import com.jastip.gacoan.ui.theme.TitipGacoanTheme

// GANTI dengan URL Vercel kamu yang sebenarnya
private const val BASE_URL = "https://titipgacoan.vercel.app/"

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Kalau app dibuka lewat link berisi kode sesi (mis. .../#/s/ABCD12),
        // teruskan path+fragment itu ke WebView
        val data = intent?.data
        val deepLinkPath = data?.let { uri ->
            val fragment = uri.fragment
            if (!fragment.isNullOrBlank()) "#$fragment" else ""
        } ?: ""

        setContent {
            TitipGacoanTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = BackgroundColor
                ) {
                    GacoanWebView(startUrl = BASE_URL + deepLinkPath)
                }
            }
        }
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
private fun GacoanWebView(startUrl: String) {
    val webViewRef = remember { mutableStateOf<WebView?>(null) }

    // Tombol back HP navigasi history web dulu, baru keluar app
    BackHandler(enabled = true) {
        val wv = webViewRef.value
        if (wv != null && wv.canGoBack()) {
            wv.goBack()
        }
    }

    AndroidView(
        modifier = Modifier.fillMaxSize(),
        factory = { context ->
            WebView(context).apply {
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true // wajib: dipakai Supabase auth session
                settings.databaseEnabled = true
                webViewClient = WebViewClient()
                loadUrl(startUrl)
                webViewRef.value = this
            }
        }
    )
}
