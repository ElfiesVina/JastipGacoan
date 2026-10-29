# Proguard rules for com.jastip.gacoan
# Metode yang dipanggil dari JavaScript (lihat MainActivity.Bridge) harus tetap ada.
-keepclassmembers class com.jastip.gacoan.MainActivity$Bridge {
    @android.webkit.JavascriptInterface <methods>;
}
