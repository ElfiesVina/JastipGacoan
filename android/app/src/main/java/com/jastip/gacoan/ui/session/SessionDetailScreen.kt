package com.jastip.gacoan.ui.session

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.jastip.gacoan.data.model.Constants
import com.jastip.gacoan.domain.FormatUtils
import com.jastip.gacoan.domain.RecapCalculator
import com.jastip.gacoan.ui.components.GacoanTopHeader
import com.jastip.gacoan.ui.components.OrderListSection
import com.jastip.gacoan.ui.components.RecapCard
import com.jastip.gacoan.ui.theme.*

@Composable
fun SessionDetailScreen(
    kode: String,
    onNavigateBack: () -> Unit,
    viewModel: SessionDetailViewModel = viewModel()
) {
    val state by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    LaunchedEffect(kode) {
        viewModel.initialize(kode)
    }

    LaunchedEffect(Unit) {
        viewModel.eventFlow.collect { event ->
            when (event) {
                is SessionDetailEvent.NavigateBack -> onNavigateBack()
                is SessionDetailEvent.ShowToast -> Toast.makeText(context, event.message, Toast.LENGTH_SHORT).show()
            }
        }
    }

    Scaffold(
        topBar = {
            GacoanTopHeader(
                title = state.session?.judul ?: "Detail Sesi",
                statusText = when (state.session?.status) {
                    Constants.STATUS_OPEN -> "Dibuka"
                    Constants.STATUS_CLOSED -> "Ditutup"
                    Constants.STATUS_SETTLED -> "Rekap Terbit"
                    else -> "Memuat..."
                },
                statusType = state.session?.status,
                actions = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Kembali", tint = Color.White)
                    }
                    IconButton(onClick = { viewModel.loadSessionData(showLoading = true) }) {
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
            } else if (state.session == null) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(state.errorMessage ?: "Sesi tidak ditemukan", color = TextMuted)
                }
            } else {
                val session = state.session!!
                val sessionUrl = "https://titip-gacoan.vercel.app/#/s/${session.kode}"
                val recap = RecapCalculator.hitungRekap(state.orders, session)

                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    // CARD KONTROL & LINK
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(18.dp),
                        colors = CardDefaults.cardColors(containerColor = SurfaceColor)
                    ) {
                        Column(modifier = Modifier.padding(18.dp)) {
                            Text(
                                text = "Kontrol Sesi",
                                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                            )
                            Spacer(modifier = Modifier.height(8.dp))

                            Text(text = "Link untuk Penitip", style = MaterialTheme.typography.bodyMedium.copy(color = TextMuted))
                            Spacer(modifier = Modifier.height(4.dp))

                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = BackgroundColor,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(
                                        text = sessionUrl,
                                        style = MaterialTheme.typography.bodyMedium.copy(
                                            color = TealPrimary,
                                            fontWeight = FontWeight.SemiBold
                                        ),
                                        modifier = Modifier.weight(1f)
                                    )
                                    IconButton(
                                        onClick = {
                                            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                                            val clip = ClipData.newPlainText("Link Sesi", sessionUrl)
                                            clipboard.setPrimaryClip(clip)
                                            Toast.makeText(context, "Link disalin ✓", Toast.LENGTH_SHORT).show()
                                        }
                                    ) {
                                        Icon(Icons.Default.ContentCopy, contentDescription = "Salin", tint = TealPrimary)
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(14.dp))

                            // Action buttons based on status
                            when (session.status) {
                                Constants.STATUS_OPEN -> {
                                    Button(
                                        onClick = {
                                            val msg = "Titip Gacoan yuk! Isi nama, pesanan & level di sini: $sessionUrl"
                                            val waUrl = FormatUtils.waLink("", msg)
                                            context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(waUrl)))
                                        },
                                        modifier = Modifier.fillMaxWidth().height(48.dp),
                                        shape = RoundedCornerShape(14.dp),
                                        colors = ButtonDefaults.buttonColors(containerColor = SuccessGreen)
                                    ) {
                                        Icon(Icons.Default.Share, contentDescription = null)
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("Bagikan ke WA", fontWeight = FontWeight.Bold)
                                    }

                                    Spacer(modifier = Modifier.height(8.dp))

                                    Button(
                                        onClick = { viewModel.setStatus(Constants.STATUS_CLOSED) },
                                        enabled = !state.isBusy,
                                        modifier = Modifier.fillMaxWidth().height(48.dp),
                                        shape = RoundedCornerShape(14.dp),
                                        colors = ButtonDefaults.buttonColors(containerColor = PinkAccent)
                                    ) {
                                        Text("Simpan & Tutup Daftar", fontWeight = FontWeight.Bold)
                                    }
                                }

                                Constants.STATUS_CLOSED -> {
                                    OutlinedButton(
                                        onClick = { viewModel.setStatus(Constants.STATUS_OPEN) },
                                        enabled = !state.isBusy,
                                        modifier = Modifier.fillMaxWidth().height(48.dp),
                                        shape = RoundedCornerShape(14.dp)
                                    ) {
                                        Text("Buka Lagi Daftar", fontWeight = FontWeight.Bold, color = TealPrimary)
                                    }
                                }

                                Constants.STATUS_SETTLED -> {
                                    Button(
                                        onClick = {
                                            val text = RecapCalculator.teksRekapWhatsApp(session, state.orders)
                                            val waUrl = FormatUtils.waLink("", text)
                                            context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(waUrl)))
                                        },
                                        modifier = Modifier.fillMaxWidth().height(48.dp),
                                        shape = RoundedCornerShape(14.dp),
                                        colors = ButtonDefaults.buttonColors(containerColor = SuccessGreen)
                                    ) {
                                        Icon(Icons.Default.Share, contentDescription = null)
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("Kirim Rekap ke WA", fontWeight = FontWeight.Bold)
                                    }

                                    Spacer(modifier = Modifier.height(8.dp))

                                    OutlinedButton(
                                        onClick = { viewModel.setStatus(Constants.STATUS_CLOSED) },
                                        enabled = !state.isBusy,
                                        modifier = Modifier.fillMaxWidth().height(48.dp),
                                        shape = RoundedCornerShape(14.dp)
                                    ) {
                                        Text("Ubah Harga", fontWeight = FontWeight.Bold, color = TealPrimary)
                                    }
                                }
                            }
                        }
                    }

                    // FORM HARGA & BIAYA (Hanya saat status closed)
                    if (session.status == Constants.STATUS_CLOSED) {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(18.dp),
                            colors = CardDefaults.cardColors(containerColor = SurfaceColor)
                        ) {
                            Column(modifier = Modifier.padding(18.dp)) {
                                Text(
                                    text = "Harga & Biaya",
                                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                                )
                                Text(
                                    text = "Harga per porsi sebelum pajak (lihat struk gerai)",
                                    style = MaterialTheme.typography.bodyMedium.copy(color = TextMuted),
                                    modifier = Modifier.padding(vertical = 4.dp)
                                )
                                Spacer(modifier = Modifier.height(10.dp))

                                val uniqueItems = (state.orders.map { it.item } + Constants.DEFAULT_MENU).distinct()
                                uniqueItems.forEach { menuItem ->
                                    val currentPrice = state.menuPricesInput[menuItem] ?: ""
                                    Text(text = menuItem, style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
                                    Spacer(modifier = Modifier.height(4.dp))
                                    OutlinedTextField(
                                        value = currentPrice,
                                        onValueChange = { viewModel.onPriceChange(menuItem, it) },
                                        placeholder = { Text("mis. 10500") },
                                        leadingIcon = { Text("Rp", modifier = Modifier.padding(start = 12.dp), color = TextMuted) },
                                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = RoundedCornerShape(14.dp)
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                }

                                Spacer(modifier = Modifier.height(6.dp))
                                Text(text = "Pajak Gerai (PB1 %)", style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
                                Spacer(modifier = Modifier.height(4.dp))
                                OutlinedTextField(
                                    value = state.taxInput,
                                    onValueChange = { viewModel.onTaxChange(it) },
                                    placeholder = { Text("10") },
                                    trailingIcon = { Text("%", modifier = Modifier.padding(end = 12.dp), color = TextMuted) },
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(14.dp)
                                )

                                Spacer(modifier = Modifier.height(8.dp))
                                Text(text = "Fee Jastip per Orang (Rp)", style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
                                Spacer(modifier = Modifier.height(4.dp))
                                OutlinedTextField(
                                    value = state.feeInput,
                                    onValueChange = { viewModel.onFeeChange(it) },
                                    placeholder = { Text("0") },
                                    leadingIcon = { Text("Rp", modifier = Modifier.padding(start = 12.dp), color = TextMuted) },
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(14.dp)
                                )

                                Spacer(modifier = Modifier.height(16.dp))
                                Button(
                                    onClick = { viewModel.publishRecap() },
                                    enabled = !state.isBusy,
                                    modifier = Modifier.fillMaxWidth().height(48.dp),
                                    shape = RoundedCornerShape(14.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = PinkAccent)
                                ) {
                                    if (state.isBusy) {
                                        CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                                    } else {
                                        Text("Hitung & Terbitkan Rekap", fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                    }

                    // DAFTAR TITIPAN
                    OrderListSection(
                        groups = recap.groups,
                        isAdmin = true,
                        sessionStatus = session.status,
                        onDeleteOrder = { viewModel.deleteOrder(it) },
                        onTogglePaid = { viewModel.togglePaid(it) }
                    )

                    // REKAP CARD (Hanya saat settled)
                    if (session.status == Constants.STATUS_SETTLED) {
                        RecapCard(
                            recap = recap,
                            rek = session.rek,
                            onShareWhatsApp = {
                                val text = RecapCalculator.teksRekapWhatsApp(session, state.orders)
                                val waUrl = FormatUtils.waLink("", text)
                                context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(waUrl)))
                            }
                        )
                    }

                    Spacer(modifier = Modifier.height(30.dp))
                }
            }
        }
    }
}
