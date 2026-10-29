package com.jastip.gacoan.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.jastip.gacoan.ui.auth.AuthScreen
import com.jastip.gacoan.ui.customer.CustomerScreen
import com.jastip.gacoan.ui.dashboard.DashboardScreen
import com.jastip.gacoan.ui.session.SessionDetailScreen

@Composable
fun AppNavGraph(
    navController: NavHostController,
    startDestination: String = Screen.Auth.route
) {
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(Screen.Auth.route) {
            AuthScreen(
                onNavigateToCustomer = { kode ->
                    navController.navigate(Screen.Customer.createRoute(kode))
                },
                onNavigateToDashboard = {
                    navController.navigate(Screen.Dashboard.route) {
                        popUpTo(Screen.Auth.route) { inclusive = true }
                    }
                }
            )
        }

        composable(
            route = Screen.Customer.route,
            arguments = listOf(navArgument("kode") { type = NavType.StringType })
        ) { backStackEntry ->
            val kode = backStackEntry.arguments?.getString("kode") ?: ""
            CustomerScreen(
                kode = kode,
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Screen.Dashboard.route) {
            DashboardScreen(
                onNavigateToSessionDetail = { kode ->
                    navController.navigate(Screen.SessionDetail.createRoute(kode))
                },
                onNavigateToAuth = {
                    navController.navigate(Screen.Auth.route) {
                        popUpTo(Screen.Dashboard.route) { inclusive = true }
                    }
                }
            )
        }

        composable(
            route = Screen.SessionDetail.route,
            arguments = listOf(navArgument("kode") { type = NavType.StringType })
        ) { backStackEntry ->
            val kode = backStackEntry.arguments?.getString("kode") ?: ""
            SessionDetailScreen(
                kode = kode,
                onNavigateBack = { navController.popBackStack() }
            )
        }
    }
}
