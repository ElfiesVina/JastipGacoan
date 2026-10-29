package com.jastip.gacoan.ui.customer

import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddPhotoAlternate
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.jastip.gacoan.data.model.Constants
import com.jastip.gacoan.domain.FormatUtils
import com.jastip.gacoan.domain.RecapCalculator
import com.jastip.gacoan.ui.components.*
import com.jastip.gacoan.ui.theme.*

@Composable
fun CustomerScreen(
    kode: String,
    onNavigateBack: () -> Unit,
    viewModel: CustomerViewModel = viewModel()
) {
    val state by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    LaunchedEffect(kode) {
        viewModel.initialize(kode)
    }

    LaunchedEffect(Unit) {
        viewModel.eventFlow.collect { event ->
            when (event) {
                is CustomerEvent.ShowToast -> Toast.makeText(context, event.message, Toast.LENGTH_SHORT).show()
            }
        }
    }

    // Photo picker for proof of transfer
    val photoPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            try {
                val inputStream = context.contentResolver.openInputStream(it)
                val bytes = inputStream?.readBytes()
                inputStream?.close()
                if (bytes != null) {
                    viewModel.setProofFile("bukti_transfer.jpg", bytes)
                }
            } catch (_: Exception) {
                Toast.makeText(context, "Gagal membaca foto", Toast.LENGTH_SHORT).show()
            }
        }
    }

    Scaffold(
        topBar = {
            GacoanTopHeader(
                title = state.session?.judul ?: "Titip Gacoan",
                statusText = when (state.session?.status) {
                    Constants.STATUS_OPEN -> "Daftar dibuka"
                    Constants.STATUS_CLOSED -> "Daftar ditutup, belanja"
                    Constants.STATUS_SETTLED -> "Rekap terbit"
                    else -> "Memuat..."
                },
                statusType = state.session?.status,
                jastipName = state.session?.nama,
                actions = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Kembali", tint = Color.White)
                    }
                    IconButton(onClick = { viewModel.loadData(showLoading = true) }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Segarkan", tint = Color.White)
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
            if (state.isLoading && state.session == null) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = TealPrimary)
                }
            } else if (state.errorMessage != null && state.session == null) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Text(
                        text = "Sesi Tidak Ditemukan",
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = state.errorMessage ?: "Periksa koneksi atau kode sesi Anda.",
                        style = MaterialTheme.typography.bodyMedium.copy(color = TextMuted)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(
                        onClick = { viewModel.loadData(showLoading = true) },
                        colors = ButtonDefaults.buttonColors(containerColor = TealPrimary)
                    ) {
                        Text("Coba Lagi")
                    }
                }
            } else {
                val session = state.session ?: return@Box
                val recap = RecapCalculator.hitungRekap(state.orders, session)

                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 16.dp, vertical = 10.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Stepper: Daftar dibuka -> Belanja -> Rekap & bayar
                    StepperIndicator(currentStatus = session.status)

                    // Conditional forms depending on session status
                    when (session.status) {
                        Constants.STATUS_OPEN -> {
                            // FORM TITIP SEKARANG
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(18.dp),
                                colors = CardDefaults.cardColors(containerColor = SurfaceColor)
                            ) {
                                Column(modifier = Modifier.padding(18.dp)) {
                                    Text(
                                        text = "Titip Sekarang",
                                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                                    )
                                    Spacer(modifier = Modifier.height(12.dp))

                                    Text(text = "Nama Kamu", style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
                                    Spacer(modifier = Modifier.height(6.dp))
                                    OutlinedTextField(
                                        value = state.inputName,
                                        onValueChange = { viewModel.onNameChange(it) },
                                        placeholder = { Text("Nama panggilan") },
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = RoundedCornerShape(14.dp),
                                        singleLine = true
                                    )

                                    Spacer(modifier = Modifier.height(12.dp))
                                    Text(text = "Pilih Pesanan", style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
                                    Spacer(modifier = Modifier.height(6.dp))

                                    Constants.DEFAULT_MENU.forEach { menuItem ->
                                        MenuOptionCard(
                                            title = menuItem,
                                            subtitle = if (FormatUtils.isMie(menuItem)) "Bisa pilih level pedas (1–8)" else null,
                                            isSelected = state.selectedItem == menuItem,
                                            onSelect = { viewModel.onSelectItem(menuItem) }
                                        )
                                    }

                                    if (FormatUtils.isMie(state.selectedItem)) {
                                        Spacer(modifier = Modifier.height(10.dp))
                                        SpiceLevelSelector(
                                            selectedLevel = state.selectedLevel,
                                            onSelectLevel = { viewModel.onSelectLevel(it) }
                                        )
                                    }

                                    Spacer(modifier = Modifier.height(16.dp))
                                    Button(
                                        onClick = { viewModel.submitOrder() },
                                        enabled = !state.isSubmitting,
                                        modifier = Modifier.fillMaxWidth().height(48.dp),
                                        shape = RoundedCornerShape(14.dp),
                                        colors = ButtonDefaults.buttonColors(containerColor = TealPrimary)
                                    ) {
                                        if (state.isSubmitting) {
                                            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                                        } else {
                                            Text("Titip Pesanan", fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }
                            }
                        }

                        Constants.STATUS_CLOSED -> {
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(18.dp),
                                colors = CardDefaults.cardColors(containerColor = WarningBg)
                            ) {
                                Column(modifier = Modifier.padding(18.dp)) {
                                    Text(
                                        text = "Daftar Ditutup",
                                        style = MaterialTheme.typography.titleLarge.copy(
                                            fontWeight = FontWeight.Bold,
                                            color = Color(0xFF7A4E00)
                                        )
                                    )
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        text = "Jastip sedang belanja. Rekap dan info transfer akan muncul di sini setelah harga dimasukkan.",
                                        style = MaterialTheme.typography.bodyMedium.copy(color = TextDark)
                                    )
                                }
                            }
                        }

                        Constants.STATUS_SETTLED -> {
                            // FORM BAYAR
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(18.dp),
                                colors = CardDefaults.cardColors(containerColor = SurfaceColor)
                            ) {
                                Column(modifier = Modifier.padding(18.dp)) {
                                    Text(
                                        text = "Sudah Bayar?",
                                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                                    )
                                    Spacer(modifier = Modifier.height(10.dp))

                                    Text(text = "Pilih Namamu", style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
                                    Spacer(modifier = Modifier.height(6.dp))

                                    recap.groups.forEach { group ->
                                        MenuOptionCard(
                                            title = group.nama,
                                            subtitle = "Total: ${FormatUtils.rp(group.sum)} ${if (group.paid) "✓ Sudah Lunas" else ""}",
                                            isSelected = FormatUtils.nameKey(state.selectedWhoName) == FormatUtils.nameKey(group.nama),
                                            onSelect = { viewModel.onSelectWhoName(group.nama) }
                                        )
                                    }

                                    Spacer(modifier = Modifier.height(12.dp))
                                    Text(text = "Bukti Transfer (Foto)", style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
                                    Spacer(modifier = Modifier.height(6.dp))

                                    OutlinedCard(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clickable { photoPickerLauncher.launch("image/*") },
                                        shape = RoundedCornerShape(14.dp)
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(14.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Icon(Icons.Default.AddPhotoAlternate, contentDescription = null, tint = TealPrimary)
                                            Spacer(modifier = Modifier.width(10.dp))
                                            Text(
                                                text = state.proofFileName ?: "Pilih foto bukti transfer",
                                                style = MaterialTheme.typography.bodyMedium.copy(
                                                    color = if (state.proofFileName != null) TealPrimary else TextMuted,
                                                    fontWeight = if (state.proofFileName != null) FontWeight.Bold else FontWeight.Normal
                                                )
                                            )
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(16.dp))
                                    Button(
                                        onClick = { viewModel.submitPayment() },
                                        enabled = !state.isSubmitting,
                                        modifier = Modifier.fillMaxWidth().height(48.dp),
                                        shape = RoundedCornerShape(14.dp),
                                        colors = ButtonDefaults.buttonColors(containerColor = PinkAccent)
                                    ) {
                                        if (state.isSubmitting) {
                                            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                                        } else {
                                            Text("Centang Lunas & Kirim", fontWeight = FontWeight.Bold)
                                        }
                                    }

                                    if (state.paymentSuccessName != null) {
                                        Spacer(modifier = Modifier.height(14.dp))
                                        Surface(
                                            shape = RoundedCornerShape(14.dp),
                                            color = SuccessBg,
                                            modifier = Modifier.fillMaxWidth()
                                        ) {
                                            Column(modifier = Modifier.padding(14.dp)) {
                                                Text(
                                                    text = "Tercatat Lunas ✓",
                                                    style = MaterialTheme.typography.titleMedium.copy(
                                                        color = SuccessGreen,
                                                        fontWeight = FontWeight.Bold
                                                    )
                                                )
                                                Text(
                                                    text = "Terima kasih, ${state.paymentSuccessName}!",
                                                    style = MaterialTheme.typography.bodyMedium.copy(color = TextDark)
                                                )
                                                if (!session.wa.isNullOrBlank()) {
                                                    Spacer(modifier = Modifier.height(10.dp))
                                                    Button(
                                                        onClick = {
                                                            val group = recap.groups.find { it.nama == state.paymentSuccessName }
                                                            val sumText = group?.let { FormatUtils.rp(it.sum) } ?: ""
                                                            val message = "Halo, saya ${state.paymentSuccessName} sudah transfer $sumText untuk titipan Gacoan."
                                                            val waUrl = FormatUtils.waLink(session.wa, message)
                                                            context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(waUrl)))
                                                        },
                                                        colors = ButtonDefaults.buttonColors(containerColor = SuccessGreen),
                                                        shape = RoundedCornerShape(10.dp)
                                                    ) {
                                                        Text("Kabari Jastip lewat WA", fontWeight = FontWeight.Bold)
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }

                            // RECAP SUMMARY CARD
                            RecapCard(
                                recap = recap,
                                rek = session.rek,
                                onShareWhatsApp = {
                                    val text = RecapCalculator.teksRekapWhatsApp(session, state.orders)
                                    val waUrl = FormatUtils.waLink(session.wa, text)
                                    context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(waUrl)))
                                }
                            )
                        }
                    }

                    // ORDER LIST CARD
                    OrderListSection(
                        groups = recap.groups,
                        isAdmin = false,
                        sessionStatus = session.status
                    )

                    Spacer(modifier = Modifier.height(30.dp))
                }
            }
        }
    }
}
