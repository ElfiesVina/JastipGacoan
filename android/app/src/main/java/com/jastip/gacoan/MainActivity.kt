package com.jastip.gacoan

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.navigation.compose.rememberNavController
import com.jastip.gacoan.ui.navigation.AppNavGraph
import com.jastip.gacoan.ui.navigation.Screen
import com.jastip.gacoan.ui.theme.BackgroundColor
import com.jastip.gacoan.ui.theme.TitipGacoanTheme

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Check if opened via intent with session code
        val data = intent?.data
        val initialSessionCode = data?.let { uri ->
            val fragment = uri.fragment ?: ""
            Regex("""/s/(\w+)""").find(fragment)?.groupValues?.get(1)
        }

        setContent {
            TitipGacoanTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = BackgroundColor
                ) {
                    val navController = rememberNavController()
                    val startDestination = if (!initialSessionCode.isNullOrBlank()) {
                        Screen.Customer.createRoute(initialSessionCode)
                    } else {
                        Screen.Auth.route
                    }

                    AppNavGraph(
                        navController = navController,
                        startDestination = startDestination
                    )
                }
            }
        }
    }
}
