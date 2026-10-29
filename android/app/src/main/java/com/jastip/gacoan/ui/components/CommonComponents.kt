package com.jastip.gacoan.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.jastip.gacoan.data.model.Constants
import com.jastip.gacoan.data.model.Order
import com.jastip.gacoan.data.model.PersonGroup
import com.jastip.gacoan.data.model.RecapSummary
import com.jastip.gacoan.domain.FormatUtils
import com.jastip.gacoan.ui.theme.*

@Composable
fun GacoanTopHeader(
    title: String? = null,
    statusText: String? = null,
    statusType: String? = null,
    jastipName: String? = null,
    actions: @Composable RowScope.() -> Unit = {}
) {
    Surface(
        color = TealPrimary,
        shape = RoundedCornerShape(bottomStart = 28.dp, bottomEnd = 28.dp),
        shadowElevation = 4.dp
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(horizontal = 20.dp, vertical = 18.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                // Logo: Titip Gacoan
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "TITIP",
                        style = MaterialTheme.typography.displayLarge.copy(
                            fontWeight = FontWeight.ExtraBold,
                            color = Color.White,
                            fontSize = 28.sp
                        )
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(topStart = 12.dp, topEnd = 12.dp, bottomEnd = 12.dp, bottomStart = 4.dp))
                            .background(PinkAccent)
                            .padding(horizontal = 8.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = "GACOAN",
                            style = MaterialTheme.typography.displayLarge.copy(
                                fontWeight = FontWeight.Black,
                                color = Color.White,
                                fontSize = 24.sp
                            )
                        )
                    }
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    actions()
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            if (!title.isNullOrBlank()) {
                Text(
                    text = title.uppercase(),
                    style = MaterialTheme.typography.titleLarge.copy(
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    ),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(modifier = Modifier.height(4.dp))
            }

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                if (!statusText.isNullOrBlank()) {
                    val badgeBg = when (statusType) {
                        Constants.STATUS_OPEN -> SuccessBg
                        Constants.STATUS_CLOSED -> WarningBg
                        else -> Color.White
                    }
                    val badgeColor = when (statusType) {
                        Constants.STATUS_OPEN -> SuccessGreen
                        Constants.STATUS_CLOSED -> Color(0xFF7A4E00)
                        else -> TealPrimary
                    }
                    Box(
                        modifier = Modifier
                            .clip(CircleShape)
                            .background(badgeBg)
                            .padding(horizontal = 10.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = statusText,
                            style = MaterialTheme.typography.labelLarge.copy(
                                color = badgeColor,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                        )
                    }
                }

                if (!jastipName.isNullOrBlank()) {
                    Text(
                        text = "Jastip: $jastipName",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            color = Color.White.copy(alpha = 0.9f)
                        ),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
        }
    }
}

@Composable
fun StepperIndicator(currentStatus: String) {
    val steps = listOf(
        Constants.STATUS_OPEN to "Daftar dibuka",
        Constants.STATUS_CLOSED to "Belanja",
        Constants.STATUS_SETTLED to "Rekap & bayar"
    )
    val currentIndex = when (currentStatus) {
        Constants.STATUS_OPEN -> 0
        Constants.STATUS_CLOSED -> 1
        Constants.STATUS_SETTLED -> 2
        else -> 0
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceColor),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 14.dp, horizontal = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            steps.forEachIndexed { index, (_, label) ->
                val isPassed = index < currentIndex
                val isCurrent = index == currentIndex

                Column(
                    modifier = Modifier.weight(1f),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(
                        modifier = Modifier
                            .size(28.dp)
                            .clip(CircleShape)
                            .background(
                                when {
                                    isPassed -> TealPrimary
                                    isCurrent -> PinkLight
                                    else -> Color.White
                                }
                            )
                            .border(
                                width = 2.dp,
                                color = when {
                                    isPassed -> TealPrimary
                                    isCurrent -> PinkAccent
                                    else -> BorderLine
                                },
                                shape = CircleShape
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        if (isPassed) {
                            Icon(
                                imageVector = Icons.Default.Check,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(16.dp)
                            )
                        } else {
                            Text(
                                text = "${index + 1}",
                                style = MaterialTheme.typography.labelLarge.copy(
                                    color = if (isCurrent) PinkAccent else TextMuted,
                                    fontWeight = FontWeight.Bold
                                )
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = label,
                        style = MaterialTheme.typography.bodyMedium.copy(
                            fontSize = 11.sp,
                            fontWeight = if (isCurrent) FontWeight.Bold else FontWeight.Normal,
                            color = if (isCurrent) TextDark else TextMuted
                        ),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
        }
    }
}

@Composable
fun MenuOptionCard(
    title: String,
    subtitle: String? = null,
    isSelected: Boolean,
    onSelect: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
            .clickable { onSelect() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isSelected) TealLight else SurfaceColor
        ),
        border = CardDefaults.outlinedCardBorder().copy(
            brush = androidx.compose.ui.graphics.SolidColor(if (isSelected) TealSecondary else BorderLine)
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = TextDark
                    )
                )
                if (!subtitle.isNullOrBlank()) {
                    Text(
                        text = subtitle,
                        style = MaterialTheme.typography.bodyMedium.copy(
                            color = TextMuted,
                            fontSize = 12.sp
                        )
                    )
                }
            }
            RadioButton(
                selected = isSelected,
                onClick = onSelect,
                colors = RadioButtonDefaults.colors(selectedColor = TealPrimary)
            )
        }
    }
}

@Composable
fun SpiceLevelSelector(
    selectedLevel: String?,
    onSelectLevel: (String) -> Unit
) {
    Column(modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp)) {
        Text(
            text = "Level Pedas",
            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
        )
        Spacer(modifier = Modifier.height(8.dp))
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            items(Constants.SPICE_LEVELS) { level ->
                val levelStr = level.toString()
                val isSelected = selectedLevel == levelStr

                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(if (isSelected) PinkAccent else SurfaceColor)
                        .border(
                            width = 1.5.dp,
                            color = if (isSelected) PinkAccent else BorderLine,
                            shape = RoundedCornerShape(12.dp)
                        )
                        .clickable {
                            if (isSelected) onSelectLevel("") else onSelectLevel(levelStr)
                        },
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = levelStr,
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.ExtraBold,
                            color = if (isSelected) Color.White else TextDark
                        )
                    )
                }
            }
        }
        Text(
            text = "1 paling ringan, 8 paling pedas. Ketuk lagi untuk batal.",
            style = MaterialTheme.typography.bodyMedium.copy(
                fontSize = 12.sp,
                color = TextMuted
            ),
            modifier = Modifier.padding(top = 6.dp)
        )
    }
}

@Composable
fun OrderListSection(
    groups: List<PersonGroup>,
    isAdmin: Boolean = false,
    sessionStatus: String = Constants.STATUS_OPEN,
    onDeleteOrder: (String) -> Unit = {},
    onTogglePaid: (String) -> Unit = {}
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceColor)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Daftar Titipan",
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                )
                Text(
                    text = "${groups.size} orang",
                    style = MaterialTheme.typography.bodyMedium.copy(color = TextMuted)
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            if (groups.isEmpty()) {
                Text(
                    text = if (isAdmin) "Belum ada titipan. Bagikan link ke WA agar teman bisa mengisi."
                    else "Belum ada titipan. Jadi yang pertama titip!",
                    style = MaterialTheme.typography.bodyMedium.copy(color = TextMuted)
                )
            } else {
                groups.forEachIndexed { index, group ->
                    PersonOrderRow(
                        group = group,
                        isAdmin = isAdmin,
                        sessionStatus = sessionStatus,
                        onDeleteOrder = onDeleteOrder,
                        onTogglePaid = { onTogglePaid(FormatUtils.nameKey(group.nama)) }
                    )
                    if (index < groups.size - 1) {
                        HorizontalDivider(
                            modifier = Modifier.padding(vertical = 10.dp),
                            color = BorderLine
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun PersonOrderRow(
    group: PersonGroup,
    isAdmin: Boolean,
    sessionStatus: String,
    onDeleteOrder: (String) -> Unit,
    onTogglePaid: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.Top
    ) {
        // Avatar Initial
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(CircleShape)
                .background(TealLight),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = group.nama.take(1).uppercase(),
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.Bold,
                    color = TealPrimary
                )
            )
        }

        Spacer(modifier = Modifier.width(12.dp))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = group.nama,
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
            )
            Spacer(modifier = Modifier.height(4.dp))
            // Order chips
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                group.orders.forEach { order ->
                    OrderChip(
                        order = order,
                        isAdmin = isAdmin && sessionStatus == Constants.STATUS_OPEN,
                        onDelete = { onDeleteOrder(order.id) }
                    )
                }
            }
        }

        if (sessionStatus == Constants.STATUS_SETTLED) {
            Spacer(modifier = Modifier.width(8.dp))
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = FormatUtils.rp(group.sum),
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                )
                Spacer(modifier = Modifier.height(4.dp))
                // Paid pill
                Box(
                    modifier = Modifier
                        .clip(CircleShape)
                        .background(if (group.paid) SuccessBg else Color(0xFFFFEBEE))
                        .clickable(enabled = isAdmin) { onTogglePaid() }
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = if (group.paid) "✓ Lunas" else "Belum",
                        style = MaterialTheme.typography.labelLarge.copy(
                            color = if (group.paid) SuccessGreen else PinkAccent,
                            fontSize = 11.sp
                        )
                    )
                }
            }
        }
    }
}

@Composable
fun OrderChip(
    order: Order,
    isAdmin: Boolean,
    onDelete: () -> Unit
) {
    Surface(
        shape = RoundedCornerShape(8.dp),
        color = BackgroundColor,
        border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(BorderLine))
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = FormatUtils.orderLabel(order),
                style = MaterialTheme.typography.bodyMedium.copy(fontSize = 12.sp)
            )
            if (isAdmin) {
                Spacer(modifier = Modifier.width(4.dp))
                Icon(
                    imageVector = Icons.Default.Close,
                    contentDescription = "Hapus",
                    modifier = Modifier
                        .size(14.dp)
                        .clickable { onDelete() },
                    tint = TextMuted
                )
            }
        }
    }
}

@Composable
fun RecapCard(
    recap: RecapSummary,
    rek: String? = null,
    onShareWhatsApp: () -> Unit = {}
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceColor)
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Text(
                text = "Rekap Pembayaran",
                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
            )
            Spacer(modifier = Modifier.height(14.dp))

            RecapRow("Subtotal sebelum pajak", FormatUtils.rp(recap.subtotal))
            RecapRow("PB1", FormatUtils.rp(recap.pb1))
            if (recap.fee > 0) {
                RecapRow("Fee jastip", FormatUtils.rp(recap.fee))
            }
            RecapRow("Pembulatan", FormatUtils.rp(recap.rounding))

            HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp), color = BorderLine)

            Text(
                text = "Total Dibayar",
                style = MaterialTheme.typography.bodyMedium.copy(color = TextMuted)
            )
            Text(
                text = FormatUtils.rp(recap.total),
                style = MaterialTheme.typography.displayLarge.copy(
                    color = PinkAccent,
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 36.sp
                )
            )

            if (!rek.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Transfer: $rek",
                    style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.SemiBold)
                )
            }

            Spacer(modifier = Modifier.height(14.dp))
            Button(
                onClick = onShareWhatsApp,
                modifier = Modifier.fillMaxWidth().height(48.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = TealPrimary)
            ) {
                Text("Kirim Rekap ke WA", fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun RecapRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = label, style = MaterialTheme.typography.bodyMedium.copy(color = TextMuted))
        Text(text = value, style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold))
    }
}
