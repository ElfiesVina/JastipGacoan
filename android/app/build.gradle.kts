plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.jastip.gacoan"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.jastip.gacoan"
        minSdk = 24
        targetSdk = 34
        versionCode = 2
        versionName = "1.1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

// Aplikasi ini hanya cangkang WebView untuk web Titip Gacoan (lihat MainActivity.kt),
// jadi dependensinya sengaja sedikit.
dependencies {
    implementation("androidx.core:core-ktx:1.13.0")
    implementation("androidx.activity:activity-ktx:1.9.0")
    implementation("androidx.core:core-splashscreen:1.0.1")
}
