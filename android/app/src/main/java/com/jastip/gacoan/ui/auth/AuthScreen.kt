package com.jastip.gacoan.ui.auth

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.jastip.gacoan.ui.theme.*

@Composable
fun AuthScreen(
    onNavigateToCustomer: (String) -> Unit,
    onNavigateToDashboard: () -> Unit,
    viewModel: AuthViewModel = viewModel()
) {
    val state by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    LaunchedEffect(Unit) {
        viewModel.eventFlow.collect { event ->
            when (event) {
                is AuthEvent.NavigateToCustomer -> onNavigateToCustomer(event.kode)
                is AuthEvent.NavigateToDashboard -> onNavigateToDashboard()
                is AuthEvent.ShowToast -> Toast.makeText(context, event.message, Toast.LENGTH_SHORT).show()
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundColor)
    ) {
        // Cyan Top Bar with Switch Tabs
        Surface(
            color = AuthCyan,
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .statusBarsPadding()
                    .padding(horizontal = 20.dp, vertical = 14.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "Titip Gacoan",
                        style = MaterialTheme.typography.titleLarge.copy(
                            color = Color.White,
                            fontWeight = FontWeight.ExtraBold
                        )
                    )

                    // Switch tabs between Jastip & Jastiper
                    Row(
                        modifier = Modifier
                            .clip(RoundedCornerShape(20.dp))
                            .background(Color.White.copy(alpha = 0.25f))
                            .padding(4.dp),
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        TabPill(
                            title = "Jastiper",
                            icon = Icons.Default.Person,
                            isSelected = state.activeTab == "jastiper",
                            onClick = { viewModel.setTab("jastiper") }
                        )
                        TabPill(
                            title = "Jastip",
                            icon = Icons.Default.Storefront,
                            isSelected = state.activeTab == "jastip",
                            onClick = { viewModel.setTab("jastip") }
                        )
                    }
                }
            }
        }

        // Scrollable Body
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            if (state.activeTab == "jastiper") {
                JastiperTabContent(state = state, viewModel = viewModel)
            } else {
                JastipTabContent(state = state, viewModel = viewModel)
            }

            // Footer
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 16.dp, bottom = 24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "© Titip Gacoan",
                    style = MaterialTheme.typography.bodyMedium.copy(color = TextMuted, fontSize = 12.sp)
                )
                Text(
                    text = "Bukan aplikasi resmi Mie Gacoan.",
                    style = MaterialTheme.typography.bodyMedium.copy(color = TextMuted, fontSize = 11.sp)
                )
            }
        }
    }
}

@Composable
fun TabPill(
    title: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(16.dp))
            .background(if (isSelected) Color.White else Color.Transparent)
            .clickable { onClick() }
            .padding(horizontal = 12.dp, vertical = 6.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = if (isSelected) AuthBlue else Color.White,
                modifier = Modifier.size(16.dp)
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = title,
                style = MaterialTheme.typography.labelLarge.copy(
                    color = if (isSelected) AuthBlue else Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp
                )
            )
        }
    }
}

@Composable
fun JastiperTabContent(state: AuthUiState, viewModel: AuthViewModel) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceColor)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Text(
                text = "Mau titip pesanan?",
                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
            )
            Text(
                text = "Tempel link atau kode sesi dari jastip. Tanpa perlu daftar atau login.",
                style = MaterialTheme.typography.bodyMedium.copy(color = TextMuted),
                modifier = Modifier.padding(vertical = 8.dp)
            )

            OutlinedTextField(
                value = state.sessionInput,
                onValueChange = { viewModel.onSessionInputChange(it) },
                placeholder = { Text("Link atau kode sesi (mis. 87k2mz)") },
                leadingIcon = { Icon(Icons.Default.Link, contentDescription = null, tint = TextMuted) },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                singleLine = true
            )

            Spacer(modifier = Modifier.height(14.dp))

            Button(
                onClick = { viewModel.joinSession() },
                modifier = Modifier.fillMaxWidth().height(48.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = TealPrimary)
            ) {
                Text("Buka Daftar Titipan", fontWeight = FontWeight.Bold)
            }

            if (state.lastSessionCode.isNotBlank()) {
                Spacer(modifier = Modifier.height(10.dp))
                OutlinedButton(
                    onClick = { viewModel.openLastSession() },
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Buka Sesi Terakhir", fontSize = 12.sp, color = TextMuted)
                        Text(
                            text = state.lastSessionTitle.ifBlank { state.lastSessionCode },
                            fontWeight = FontWeight.Bold,
                            color = TealPrimary
                        )
                    }
                }
            }
        }
    }

    // Cara Menitip Steps Card
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceColor)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Text(
                text = "Cara Menitip",
                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
            )
            Spacer(modifier = Modifier.height(12.dp))

            val steps = listOf(
                "Buka Link" to "Minta link sesi ke jastip, lalu tempel di atas atau ketuk linknya.",
                "Isi Titipan" to "Nama, menu, dan level pedas. Tanpa perlu akun.",
                "Tunggu Rekap" to "Setelah daftar ditutup dan belanja selesai, total muncul.",
                "Transfer" to "Bayar sesuai total hitungan, lalu unggah bukti transfer."
            )

            steps.forEachIndexed { i, (stepTitle, stepDesc) ->
                Row(modifier = Modifier.padding(vertical = 6.dp), verticalAlignment = Alignment.Top) {
                    Box(
                        modifier = Modifier
                            .size(24.dp)
                            .clip(CircleShape)
                            .background(TealLight),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "${i + 1}",
                            style = MaterialTheme.typography.bodyMedium.copy(
                                fontWeight = FontWeight.Bold,
                                color = TealPrimary,
                                fontSize = 12.sp
                            )
                        )
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text(text = stepTitle, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyLarge)
                        Text(text = stepDesc, color = TextMuted, style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }
        }
    }
}

@Composable
fun JastipTabContent(state: AuthUiState, viewModel: AuthViewModel) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceColor)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            when (state.authMode) {
                AuthMode.LOGIN -> {
                    Text(
                        text = "Masuk sebagai Jastip",
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                    )
                    Spacer(modifier = Modifier.height(14.dp))

                    OutlinedTextField(
                        value = state.emailInput,
                        onValueChange = { viewModel.onEmailChange(it) },
                        placeholder = { Text("Email address") },
                        leadingIcon = { Icon(Icons.Default.Email, contentDescription = null, tint = TextMuted) },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email)
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    var showPassword by remember { mutableStateOf(false) }
                    OutlinedTextField(
                        value = state.passwordInput,
                        onValueChange = { viewModel.onPasswordChange(it) },
                        placeholder = { Text("Password") },
                        leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, tint = TextMuted) },
                        trailingIcon = {
                            IconButton(onClick = { showPassword = !showPassword }) {
                                Icon(
                                    imageVector = if (showPassword) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                                    contentDescription = null,
                                    tint = TextMuted
                                )
                            }
                        },
                        visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp)
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End
                    ) {
                        TextButton(onClick = { viewModel.setAuthMode(AuthMode.FORGOT) }) {
                            Text("Lupa password?", color = TealSecondary)
                        }
                    }

                    Button(
                        onClick = { viewModel.authenticate() },
                        enabled = !state.isLoading,
                        modifier = Modifier.fillMaxWidth().height(48.dp),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = AuthBlue)
                    ) {
                        if (state.isLoading) CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                        else Text("Masuk", fontWeight = FontWeight.Bold)
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Belum punya akun?", color = TextMuted)
                        TextButton(onClick = { viewModel.setAuthMode(AuthMode.SIGNUP) }) {
                            Text("Daftar", fontWeight = FontWeight.Bold, color = TealPrimary)
                        }
                    }
                }

                AuthMode.SIGNUP -> {
                    Text(
                        text = "Daftar Akun Jastip",
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                    )
                    Spacer(modifier = Modifier.height(14.dp))

                    OutlinedTextField(
                        value = state.nameInput,
                        onValueChange = { viewModel.onNameChange(it) },
                        placeholder = { Text("Nama lengkap") },
                        leadingIcon = { Icon(Icons.Default.Person, contentDescription = null, tint = TextMuted) },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp)
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    OutlinedTextField(
                        value = state.emailInput,
                        onValueChange = { viewModel.onEmailChange(it) },
                        placeholder = { Text("Email address") },
                        leadingIcon = { Icon(Icons.Default.Email, contentDescription = null, tint = TextMuted) },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp)
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    OutlinedTextField(
                        value = state.passwordInput,
                        onValueChange = { viewModel.onPasswordChange(it) },
                        placeholder = { Text("Password (min 6 karakter)") },
                        leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, tint = TextMuted) },
                        visualTransformation = PasswordVisualTransformation(),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp)
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    Button(
                        onClick = { viewModel.authenticate() },
                        enabled = !state.isLoading,
                        modifier = Modifier.fillMaxWidth().height(48.dp),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = AuthBlue)
                    ) {
                        if (state.isLoading) CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                        else Text("Daftar", fontWeight = FontWeight.Bold)
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Sudah punya akun?", color = TextMuted)
                        TextButton(onClick = { viewModel.setAuthMode(AuthMode.LOGIN) }) {
                            Text("Masuk", fontWeight = FontWeight.Bold, color = TealPrimary)
                        }
                    }
                }

                AuthMode.FORGOT -> {
                    Text(
                        text = "Lupa Password",
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                    )
                    Text(
                        text = "Masukkan email akunmu. Kami akan mengirimkan kode verifikasi.",
                        style = MaterialTheme.typography.bodyMedium.copy(color = TextMuted),
                        modifier = Modifier.padding(vertical = 8.dp)
                    )

                    OutlinedTextField(
                        value = state.emailInput,
                        onValueChange = { viewModel.onEmailChange(it) },
                        placeholder = { Text("Email address") },
                        leadingIcon = { Icon(Icons.Default.Email, contentDescription = null, tint = TextMuted) },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp)
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    Button(
                        onClick = { viewModel.sendResetPassword() },
                        enabled = !state.isLoading,
                        modifier = Modifier.fillMaxWidth().height(48.dp),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = AuthBlue)
                    ) {
                        if (state.isLoading) CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                        else Text("Kirim Kode", fontWeight = FontWeight.Bold)
                    }

                    TextButton(
                        onClick = { viewModel.setAuthMode(AuthMode.LOGIN) },
                        modifier = Modifier.align(Alignment.CenterHorizontally)
                    ) {
                        Text("Kembali ke Masuk", color = TealPrimary)
                    }
                }

                AuthMode.OTP -> {
                    Text(
                        text = "Verifikasi Kode",
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                    )
                    Text(
                        text = "Kode dikirim ke ${state.emailInput}. Masukkan 6 digit kode.",
                        style = MaterialTheme.typography.bodyMedium.copy(color = TextMuted),
                        modifier = Modifier.padding(vertical = 8.dp)
                    )

                    OutlinedTextField(
                        value = state.otpInput,
                        onValueChange = { viewModel.onOtpChange(it) },
                        placeholder = { Text("6 digit kode") },
                        leadingIcon = { Icon(Icons.Default.Key, contentDescription = null, tint = TextMuted) },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    Button(
                        onClick = { viewModel.verifyOtp() },
                        enabled = !state.isLoading,
                        modifier = Modifier.fillMaxWidth().height(48.dp),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = AuthBlue)
                    ) {
                        if (state.isLoading) CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                        else Text("Verifikasi", fontWeight = FontWeight.Bold)
                    }

                    TextButton(
                        onClick = { viewModel.sendResetPassword() },
                        modifier = Modifier.align(Alignment.CenterHorizontally)
                    ) {
                        Text("Kirim Ulang Kode", color = TealPrimary)
                    }
                }

                AuthMode.NEW_PASS -> {
                    Text(
                        text = "Password Baru",
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = state.passwordInput,
                        onValueChange = { viewModel.onPasswordChange(it) },
                        placeholder = { Text("Password baru") },
                        leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, tint = TextMuted) },
                        visualTransformation = PasswordVisualTransformation(),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp)
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    OutlinedTextField(
                        value = state.confirmPasswordInput,
                        onValueChange = { viewModel.onConfirmPasswordChange(it) },
                        placeholder = { Text("Konfirmasi password baru") },
                        leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, tint = TextMuted) },
                        visualTransformation = PasswordVisualTransformation(),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp)
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    Button(
                        onClick = { viewModel.saveNewPassword() },
                        enabled = !state.isLoading,
                        modifier = Modifier.fillMaxWidth().height(48.dp),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = AuthBlue)
                    ) {
                        if (state.isLoading) CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                        else Text("Simpan Password", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }

    // Cara Kerjanya Card
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceColor)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Text(
                text = "Cara Kerjanya",
                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
            )
            Spacer(modifier = Modifier.height(12.dp))

            val steps = listOf(
                "Buat Sesi" to "Jastip masuk, lalu membuat sesi titipan baru.",
                "Bagikan Link" to "Kirim link sesi ke teman lewat WhatsApp.",
                "Teman Mengisi" to "Nama, menu, dan level pedas. Tanpa perlu akun.",
                "Rekap Otomatis" to "Harga, pajak PB1, dan fee terhitung otomatis. Teman bayar dan upload bukti."
            )

            steps.forEachIndexed { i, (stepTitle, stepDesc) ->
                Row(modifier = Modifier.padding(vertical = 6.dp), verticalAlignment = Alignment.Top) {
                    Box(
                        modifier = Modifier
                            .size(24.dp)
                            .clip(CircleShape)
                            .background(TealLight),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "${i + 1}",
                            style = MaterialTheme.typography.bodyMedium.copy(
                                fontWeight = FontWeight.Bold,
                                color = TealPrimary,
                                fontSize = 12.sp
                            )
                        )
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text(text = stepTitle, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyLarge)
                        Text(text = stepDesc, color = TextMuted, style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }
        }
    }
}
