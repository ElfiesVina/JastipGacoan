package com.jastip.gacoan.ui.navigation

sealed class Screen(val route: String) {
    object Auth : Screen("auth")
    object Dashboard : Screen("dashboard")
    object Customer : Screen("customer/{kode}") {
        fun createRoute(kode: String) = "customer/$kode"
    }
    object SessionDetail : Screen("session/{kode}") {
        fun createRoute(kode: String) = "session/$kode"
    }
}
