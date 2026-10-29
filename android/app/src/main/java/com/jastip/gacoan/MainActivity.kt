package com.jastip.gacoan

import android.annotation.SuppressLint
import android.content.ActivityNotFoundException
import android.content.ContentValues
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.os.Handler
import android.os.Looper
import android.provider.MediaStore
import android.util.Base64
import android.view.View
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.MimeTypeMap
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import java.io.File
import java.io.IOException

// Alamat aplikasi web (Vercel). Semua tampilan dan fitur datang dari sini,
// jadi perubahan web langsung terlihat di APK tanpa perlu membangun ulang APK.
private const val BASE_URL = "https://titipgacoan.vercel.app/"
private const val BASE_HOST = "titipgacoan.vercel.app"

/** Batas waktu terlama splash screen ditahan bila halaman lambat dimuat (milidetik). */
private const val SPLASH_MAX_MS = 4000L

/** Halaman sederhana saat tidak ada koneksi. Tombolnya memanggil Bridge.retry(). */
private const val ERROR_HTML = """
<!doctype html><html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
html,body{height:100%;margin:0}
body{display:flex;align-items:center;justify-content:center;background:#F2F6F9;color:#10192B;
font-family:sans-serif;text-align:center;padding:24px;box-sizing:border-box}
h1{font-size:20px;margin:0 0 8px}
p{margin:0 0 22px;color:#5D6A80;line-height:1.5;font-size:15px}
button{background:#07758F;color:#fff;border:0;border-radius:12px;padding:14px 28px;font-size:16px;font-weight:700}
</style></head><body><div>
<h1>Tidak ada koneksi</h1>
<p>Titip Gacoan butuh internet.<br>Periksa koneksimu, lalu coba lagi.</p>
<button onclick="AndroidApp.retry()">Coba lagi</button>
</div></body></html>
"""

class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView

    /** true setelah halaman pertama selesai (atau gagal): splash screen boleh hilang. */
    @Volatile
    private var pageReady = false

    /** Alamat terakhir milik aplikasi, dipakai tombol "Coba lagi". */
    private var lastUrl = BASE_URL

    private var filePathCallback: ValueCallback<Array<Uri>>? = null

    /** Pemilih file (foto bukti transfer). */
    private val fileChooser =
        registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
            val uris = WebChromeClient.FileChooserParams.parseResult(result.resultCode, result.data)
            filePathCallback?.onReceiveValue(uris)
            filePathCallback = null
        }

    @SuppressLint("SetJavaScriptEnabled", "AddJavascriptInterface")
    override fun onCreate(savedInstanceState: Bundle?) {
        val splash = installSplashScreen()
        super.onCreate(savedInstanceState)
        splash.setKeepOnScreenCondition { !pageReady }
        Handler(Looper.getMainLooper()).postDelayed({ pageReady = true }, SPLASH_MAX_MS)

        webView = WebView(this).apply {
            setBackgroundColor(0xFFF2F6F9.toInt())
            overScrollMode = View.OVER_SCROLL_NEVER // tarik-untuk-refresh sudah dibuat oleh web

            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true // wajib: sesi login Supabase disimpan di sini
                allowFileAccess = false
                setSupportZoom(false)
                builtInZoomControls = false
                displayZoomControls = false
                userAgentString = userAgentString + " TitipGacoanApp"
            }

            addJavascriptInterface(Bridge(), "AndroidApp")
            webViewClient = AppWebViewClient()
            webChromeClient = AppChromeClient()
            setDownloadListener { url, _, _, mimeType, _ -> onDownload(url, mimeType) }
        }
        setContentView(webView)

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() = handleBack()
        })

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState)
        } else {
            webView.loadUrl(startUrlFrom(intent))
        }
    }

    /** Dibuka lagi lewat link (singleTask): muat link barunya. */
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        webView.loadUrl(startUrlFrom(intent))
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onPause() {
        webView.onPause()
        super.onPause()
    }

    override fun onDestroy() {
        (webView.parent as? ViewGroup)?.removeView(webView)
        webView.destroy()
        super.onDestroy()
    }

    /** Link https://titipgacoan.vercel.app/#/s/KODE dibuka di dalam aplikasi. */
    private fun startUrlFrom(intent: Intent?): String {
        val uri = intent?.data
        val fragment = uri?.fragment
        return if (uri?.host == BASE_HOST && !fragment.isNullOrBlank()) "$BASE_URL#$fragment" else BASE_URL
    }

    /** Tombol Back: tutup dialog web dulu, lalu mundur di riwayat, terakhir keluar dari aplikasi. */
    private fun handleBack() {
        webView.evaluateJavascript(
            "(function(){var d=document.querySelector('dialog[open]');if(d){d.close();return 1}return 0})()"
        ) { closed ->
            if (closed == "1") return@evaluateJavascript
            if (webView.canGoBack()) webView.goBack() else finish()
        }
    }

    private fun toast(message: String) = Toast.makeText(this, message, Toast.LENGTH_LONG).show()

    private fun openExternal(uri: Uri) {
        try {
            startActivity(Intent(Intent.ACTION_VIEW, uri))
        } catch (_: ActivityNotFoundException) {
            toast("Tidak ada aplikasi untuk membuka link ini")
        }
    }

    /* ---------------------------------------------------------------- WebView */

    private inner class AppWebViewClient : WebViewClient() {
        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
            val uri = request.url
            val scheme = uri.scheme
            if (scheme == "blob" || scheme == "about" || scheme == "data") return false
            if (scheme == "https" && uri.host == BASE_HOST) return false // tetap di dalam aplikasi
            openExternal(uri) // WhatsApp, telepon, situs lain: buka di aplikasi yang sesuai
            return true
        }

        override fun onPageStarted(view: WebView, url: String?, favicon: android.graphics.Bitmap?) {
            if (url != null && url.startsWith("https://$BASE_HOST")) lastUrl = url
        }

        override fun onPageFinished(view: WebView, url: String?) {
            pageReady = true
        }

        override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
            if (request.isForMainFrame) {
                pageReady = true
                view.loadDataWithBaseURL(null, ERROR_HTML, "text/html", "UTF-8", null)
            }
        }
    }

    private inner class AppChromeClient : WebChromeClient() {
        /** Tombol "Pilih foto bukti" di web. */
        override fun onShowFileChooser(
            view: WebView,
            callback: ValueCallback<Array<Uri>>,
            params: WebChromeClient.FileChooserParams,
        ): Boolean {
            filePathCallback?.onReceiveValue(null)
            filePathCallback = callback
            try {
                fileChooser.launch(params.createIntent())
            } catch (_: ActivityNotFoundException) {
                filePathCallback = null
                callback.onReceiveValue(null)
                toast("Tidak ada aplikasi untuk memilih foto")
            }
            return true
        }
    }

    /* ---------------------------------------------------------------- Unduhan */

    /** "Simpan rekap sebagai gambar" membuat file blob: di web; di sini diambil lalu disimpan ke galeri. */
    private fun onDownload(url: String, mimeType: String?) {
        if (!url.startsWith("blob:")) {
            openExternal(Uri.parse(url))
            return
        }
        val mime = if (mimeType.isNullOrBlank()) "image/png" else mimeType
        val ext = MimeTypeMap.getSingleton().getExtensionFromMimeType(mime) ?: "png"
        val name = "rekap-titipan-${System.currentTimeMillis() / 1000}.$ext"
        val js = "fetch('$url').then(function(r){return r.blob()}).then(function(b){" +
            "var f=new FileReader();f.onloadend=function(){AndroidApp.saveFile(f.result,'$mime','$name')};" +
            "f.readAsDataURL(b)})"
        webView.evaluateJavascript(js, null)
    }

    /** Simpan ke galeri (gambar) atau folder Download. Mengembalikan keterangan lokasi. */
    private fun writeFile(dataUrl: String, mime: String, name: String): String {
        val bytes = Base64.decode(dataUrl.substringAfter("base64,"), Base64.DEFAULT)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val isImage = mime.startsWith("image/")
            val values = ContentValues().apply {
                put(MediaStore.MediaColumns.DISPLAY_NAME, name)
                put(MediaStore.MediaColumns.MIME_TYPE, mime)
                put(
                    MediaStore.MediaColumns.RELATIVE_PATH,
                    if (isImage) "${Environment.DIRECTORY_PICTURES}/TitipGacoan" else Environment.DIRECTORY_DOWNLOADS,
                )
            }
            val collection = if (isImage) MediaStore.Images.Media.EXTERNAL_CONTENT_URI
            else MediaStore.Downloads.EXTERNAL_CONTENT_URI
            val uri = contentResolver.insert(collection, values) ?: throw IOException("Tidak bisa membuat file")
            contentResolver.openOutputStream(uri)?.use { it.write(bytes) } ?: throw IOException("Tidak bisa menulis file")
            return if (isImage) "galeri (Pictures/TitipGacoan)" else "folder Download"
        }
        // Android 9 ke bawah: simpan di folder milik aplikasi (tanpa izin tambahan).
        val dir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS) ?: filesDir
        dir.mkdirs()
        File(dir, name).writeBytes(bytes)
        return dir.absolutePath
    }

    /** Jembatan dari JavaScript web ke aplikasi (nama di web: AndroidApp). */
    private inner class Bridge {
        @JavascriptInterface
        fun saveFile(dataUrl: String, mime: String, name: String) {
            val where = try {
                writeFile(dataUrl, mime, name)
            } catch (_: Exception) {
                null
            }
            runOnUiThread { toast(if (where != null) "Disimpan di $where" else "Gagal menyimpan file") }
        }

        @JavascriptInterface
        fun retry() {
            runOnUiThread { webView.loadUrl(lastUrl) }
        }
    }
}
