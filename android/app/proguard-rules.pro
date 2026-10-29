# Proguard rules for com.jastip.gacoan
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod

# Keep data models for kotlinx.serialization
-keepclassmembers class * {
    @kotlinx.serialization.Serializable <fields>;
    companion object *;
}
-keepclasseswithmembers class * {
    kotlinx.serialization.KSerializer serializer(...);
}

# Keep OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**
