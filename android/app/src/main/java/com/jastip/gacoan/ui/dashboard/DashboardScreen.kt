package com.jastip.gacoan.ui.dashboard

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.jastip.gacoan.data.model.Constants
import com.jastip.gacoan.data.model.Session
import com.jastip.gacoan.ui.components.GacoanTopHeader
import com.jastip.gacoan.ui.theme.*

@Composable
fun DashboardScreen(
    onNavigateToSessionDetail: (String) -> Unit,
    onNavigateToAuth: () -> Unit,
    viewModel: DashboardViewModel = viewModel()
) {
    val state by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    LaunchedEffect(Unit) {
        viewModel.eventFlow.collect { event ->
            when (event) {
                is DashboardEvent.NavigateToSessionDetail -> onNavigateToSessionDetail(event.kode)
                is DashboardEvent.NavigateToAuth -> onNavigateToAuth()
                is DashboardEvent.ShowToast -> Toast.makeText(context, event.message, Toast.LENGTH_SHORT).show()
            }
        }
    }

    Scaffold(
        topBar = {
            GacoanTopHeader(
                title = "Dashboard Jastip",
                statusText = "Kelola Sesi",
                jastipName = state.profile.nama.ifBlank { null },
                actions = {
                    IconButton(onClick = { viewModel.loadDashboardData() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Segarkan", tint = Color.White)
                    }
                    IconButton(onClick = { viewModel.logout() }) {
                        Icon(Icons.Default.ExitToApp, contentDescription = "Keluar", tint = Color.White)
                    }
                }
            )
        },
        containerColor = BackgroundColor
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            if (state.isLoading && state.mySessions.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = TealPrimary)
                }
            } else {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // CARD PROFIL JASTIP
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(18.dp),
                        colors = CardDefaults.cardColors(containerColor = SurfaceColor)
                    ) {
                        Column(modifier = Modifier.padding(18.dp)) {
                            Text(
                                text = "Profil Jastip",
                                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                            )
                            Spacer(modifier = Modifier.height(12.dp))

                            Text(text = "Nama", style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
                            Spacer(modifier = Modifier.height(4.dp))
                            OutlinedTextField(
                                value = state.profile.nama,
                                onValueChange = { viewModel.onProfileNameChange(it) },
                                placeholder = { Text("Nama kamu") },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(14.dp)
                            )

                            Spacer(modifier = Modifier.height(10.dp))
                            Text(text = "Info Transfer", style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
                            Spacer(modifier = Modifier.height(4.dp))
                            OutlinedTextField(
                                value = state.profile.rek,
                                onValueChange = { viewModel.onProfileRekChange(it) },
                                placeholder = { Text("mis. BCA 123456 a.n. Nama atau DANA") },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(14.dp)
                            )

                            Spacer(modifier = Modifier.height(10.dp))
                            Text(text = "Nomor WhatsApp", style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
                            Spacer(modifier = Modifier.height(4.dp))
                            OutlinedTextField(
                                value = state.profile.wa,
                                onValueChange = { viewModel.onProfileWaChange(it) },
                                placeholder = { Text("628123456789") },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(14.dp)
                            )

                            Spacer(modifier = Modifier.height(14.dp))
                            Button(
                                onClick = { viewModel.saveProfile() },
                                enabled = !state.isSavingProfile,
                                modifier = Modifier.fillMaxWidth().height(48.dp),
                                shape = RoundedCornerShape(14.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = TealPrimary)
                            ) {
                                if (state.isSavingProfile) {
                                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                                } else {
                                    Text("Simpan Profil", fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }

                    // CARD BUAT SESI BARU
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(18.dp),
                        colors = CardDefaults.cardColors(containerColor = SurfaceColor)
                    ) {
                        Column(modifier = Modifier.padding(18.dp)) {
                            Text(
                                text = "Sesi Baru",
                                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                            )
                            Spacer(modifier = Modifier.height(10.dp))

                            Text(text = "Judul Sesi", style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
                            Spacer(modifier = Modifier.height(4.dp))
                            OutlinedTextField(
                                value = state.newSessionTitle,
                                onValueChange = { viewModel.onNewSessionTitleChange(it) },
                                placeholder = { Text("mis. Gacoan Jumat Malam") },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(14.dp)
                            )

                            Spacer(modifier = Modifier.height(14.dp))
                            Button(
                                onClick = { viewModel.createSession() },
                                enabled = !state.isCreatingSession,
                                modifier = Modifier.fillMaxWidth().height(48.dp),
                                shape = RoundedCornerShape(14.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = PinkAccent)
                            ) {
                                if (state.isCreatingSession) {
                                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                                } else {
                                    Icon(Icons.Default.Add, contentDescription = null)
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Buat Sesi", fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }

                    // CARD SESI SAYA
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(18.dp),
                        colors = CardDefaults.cardColors(containerColor = SurfaceColor)
                    ) {
                        Column(modifier = Modifier.padding(18.dp)) {
                            Text(
                                text = "Sesi Saya",
                                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                            )
                            Spacer(modifier = Modifier.height(12.dp))

                            if (state.mySessions.isEmpty()) {
                                Text(
                                    text = "Belum ada sesi titipan. Buat satu di atas.",
                                    style = MaterialTheme.typography.bodyMedium.copy(color = TextMuted)
                                )
                            } else {
                                state.mySessions.forEachIndexed { i, session ->
                                    SessionItemRow(
                                        session = session,
                                        onClick = { onNavigateToSessionDetail(session.kode) }
                                    )
                                    if (i < state.mySessions.size - 1) {
                                        HorizontalDivider(modifier = Modifier.padding(vertical = 10.dp), color = BorderLine)
                                    }
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(20.dp))
                }
            }
        }
    }
}

@Composable
fun SessionItemRow(
    session: Session,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = session.judul.ifBlank { session.kode },
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
            )
            if (!session.tgl.isNullOrBlank()) {
                Text(
                    text = session.tgl,
                    style = MaterialTheme.typography.bodyMedium.copy(color = TextMuted, fontSize = 12.sp)
                )
            }
        }

        val (statusText, bg, color) = when (session.status) {
            Constants.STATUS_OPEN -> Triple("Dibuka", SuccessBg, SuccessGreen)
            Constants.STATUS_CLOSED -> Triple("Ditutup", WarningBg, Color(0xFF7A4E00))
            else -> Triple("Rekap Terbit", TealLight, TealPrimary)
        }

        Box(
            modifier = Modifier
                .clip(CircleShape)
                .background(bg)
                .padding(horizontal = 10.dp, vertical = 4.dp)
        ) {
            Text(
                text = statusText,
                style = MaterialTheme.typography.labelLarge.copy(
                    color = color,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp
                )
            )
        }
    }
}
