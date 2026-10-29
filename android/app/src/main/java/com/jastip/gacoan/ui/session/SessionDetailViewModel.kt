package com.jastip.gacoan.ui.session

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.jastip.gacoan.GacoanApp
import com.jastip.gacoan.data.model.*
import com.jastip.gacoan.domain.FormatUtils
import com.jastip.gacoan.domain.RecapCalculator
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

data class SessionDetailUiState(
    val session: Session? = null,
    val orders: List<Order> = emptyList(),
    val menuPricesInput: Map<String, String> = emptyMap(),
    val taxInput: String = "10",
    val feeInput: String = "0",
    val isLoading: Boolean = true,
    val isBusy: Boolean = false,
    val errorMessage: String? = null
)

sealed class SessionDetailEvent {
    object NavigateBack : SessionDetailEvent()
    data class ShowToast(val message: String, val isError: Boolean = false) : SessionDetailEvent()
}

class SessionDetailViewModel : ViewModel() {

    private val client = GacoanApp.instance.supabaseClient

    private val _uiState = MutableStateFlow(SessionDetailUiState())
    val uiState: StateFlow<SessionDetailUiState> = _uiState.asStateFlow()

    private val _eventFlow = MutableSharedFlow<SessionDetailEvent>()
    val eventFlow: SharedFlow<SessionDetailEvent> = _eventFlow.asSharedFlow()

    private var pollingJob: Job? = null
    private var sessionCode: String = ""

    fun initialize(kode: String) {
        sessionCode = kode
        loadSessionData(showLoading = true)
    }

    override fun onCleared() {
        super.onCleared()
        pollingJob?.cancel()
    }

    fun loadSessionData(showLoading: Boolean = false) {
        viewModelScope.launch {
            if (showLoading) _uiState.update { it.copy(isLoading = true, errorMessage = null) }

            val sessionRes = client.getMySession(sessionCode)
            if (sessionRes.isFailure) {
                _uiState.update { it.copy(isLoading = false, errorMessage = sessionRes.exceptionOrNull()?.message) }
                return@launch
            }

            val session = sessionRes.getOrNull()
            if (session == null) {
                _uiState.update { it.copy(isLoading = false, errorMessage = "Sesi tidak ditemukan") }
                return@launch
            }

            val ordersRes = client.listOwnerPesanan(session.id)
            val orders = ordersRes.getOrNull() ?: emptyList()

            // Prepare price inputs for all unique items
            val currentInputs = _uiState.value.menuPricesInput.toMutableMap()
            val uniqueItems = (orders.map { it.item } + Constants.DEFAULT_MENU).distinct()
            uniqueItems.forEach { item ->
                if (!currentInputs.containsKey(item)) {
                    val price = session.prices[item]
                    currentInputs[item] = if (price != null && price > 0) price.toInt().toString() else ""
                }
            }

            _uiState.update {
                it.copy(
                    session = session,
                    orders = orders,
                    menuPricesInput = currentInputs,
                    taxInput = session.pajak.toInt().toString(),
                    feeInput = session.fee.toString(),
                    isLoading = false
                )
            }

            // Start polling if open
            if (session.status == Constants.STATUS_OPEN && pollingJob == null) {
                startPolling(session.id)
            } else if (session.status != Constants.STATUS_OPEN) {
                pollingJob?.cancel()
                pollingJob = null
            }
        }
    }

    private fun startPolling(sesiId: String) {
        pollingJob?.cancel()
        pollingJob = viewModelScope.launch {
            while (isActive) {
                delay(Constants.POLL_INTERVAL_MS)
                val ordersRes = client.listOwnerPesanan(sesiId)
                ordersRes.getOrNull()?.let { newOrders ->
                    _uiState.update { it.copy(orders = newOrders) }
                }
            }
        }
    }

    fun onPriceChange(menuItem: String, priceStr: String) {
        val filtered = priceStr.filter { it.isDigit() }
        _uiState.update {
            it.copy(menuPricesInput = it.menuPricesInput + (menuItem to filtered))
        }
    }

    fun onTaxChange(taxStr: String) {
        _uiState.update { it.copy(taxInput = taxStr.filter { ch -> ch.isDigit() || ch == '.' }) }
    }

    fun onFeeChange(feeStr: String) {
        _uiState.update { it.copy(feeInput = feeStr.filter { ch -> ch.isDigit() }) }
    }

    fun setStatus(newStatus: String) {
        val session = _uiState.value.session ?: return
        viewModelScope.launch {
            _uiState.update { it.copy(isBusy = true) }
            val res = client.updateSessionStatus(session.id, newStatus)
            _uiState.update { it.copy(isBusy = false) }

            res.onSuccess {
                emitToast("Status diubah ke $newStatus")
                loadSessionData(showLoading = false)
            }.onFailure {
                emitToast(it.message ?: "Gagal mengubah status", true)
            }
        }
    }

    fun publishRecap() {
        val session = _uiState.value.session ?: return
        val state = _uiState.value

        // Validate menu prices
        val uniqueOrderedItems = state.orders.map { it.item }.distinct()
        val pricesMap = mutableMapOf<String, Double>()
        for (item in uniqueOrderedItems) {
            val priceVal = state.menuPricesInput[item]?.toDoubleOrNull() ?: 0.0
            if (priceVal <= 0.0) {
                emitToast("Isi harga untuk menu $item terlebih dahulu", true)
                return
            }
            pricesMap[item] = priceVal
        }

        val taxVal = state.taxInput.toDoubleOrNull() ?: 0.0
        val feeVal = state.feeInput.toLongOrNull() ?: 0L

        if (taxVal !in 0.0..100.0) {
            emitToast("Pajak harus antara 0 dan 100", true)
            return
        }
        if (feeVal < 0) {
            emitToast("Fee jastip tidak boleh minus", true)
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isBusy = true) }
            val res = client.publishRecap(session.id, pricesMap, taxVal, feeVal)
            _uiState.update { it.copy(isBusy = false) }

            res.onSuccess {
                emitToast("Rekap berhasil diterbitkan ✓")
                loadSessionData(showLoading = false)
            }.onFailure {
                emitToast(it.message ?: "Gagal menerbitkan rekap", true)
            }
        }
    }

    fun deleteOrder(orderId: String) {
        viewModelScope.launch {
            val res = client.deletePesanan(orderId)
            res.onSuccess {
                emitToast("Pesanan dihapus")
                _uiState.update { it.copy(orders = it.orders.filter { o -> o.id != orderId }) }
            }.onFailure {
                emitToast(it.message ?: "Gagal menghapus pesanan", true)
            }
        }
    }

    fun togglePaid(nameKey: String) {
        val state = _uiState.value
        val session = state.session ?: return
        val recap = RecapCalculator.hitungRekap(state.orders, session)
        val group = recap.groups.find { FormatUtils.nameKey(it.nama) == nameKey } ?: return

        val newPaid = !group.paid
        val orderIds = group.orders.map { it.id }

        viewModelScope.launch {
            val res = client.setOrdersPaid(orderIds, newPaid)
            res.onSuccess {
                _uiState.update { s ->
                    s.copy(
                        orders = s.orders.map { o ->
                            if (orderIds.contains(o.id)) o.copy(paid = newPaid) else o
                        }
                    )
                }
            }.onFailure {
                emitToast(it.message ?: "Gagal memperbarui status lunas", true)
            }
        }
    }

    private fun emitToast(msg: String, isErr: Boolean = false) {
        viewModelScope.launch {
            _eventFlow.emit(SessionDetailEvent.ShowToast(msg, isErr))
        }
    }
}
