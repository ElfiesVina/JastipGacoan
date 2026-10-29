package com.jastip.gacoan.ui.customer

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
import java.util.UUID

data class CustomerUiState(
    val session: Session? = null,
    val orders: List<Order> = emptyList(),
    val recap: RecapSummary? = null,
    val isLoading: Boolean = true,
    val isSubmitting: Boolean = false,
    val errorMessage: String? = null,

    // Form Titip
    val inputName: String = "",
    val selectedItem: String = "",
    val selectedLevel: String = "",

    // Form Bayar
    val selectedWhoName: String = "",
    val selectedProofBytes: ByteArray? = null,
    val proofFileName: String? = null,
    val paymentSuccessName: String? = null
)

sealed class CustomerEvent {
    data class ShowToast(val message: String, val isError: Boolean = false) : CustomerEvent()
}

class CustomerViewModel : ViewModel() {

    private val prefs = GacoanApp.instance.prefs
    private val client = GacoanApp.instance.supabaseClient

    private val _uiState = MutableStateFlow(CustomerUiState(inputName = prefs.lastName))
    val uiState: StateFlow<CustomerUiState> = _uiState.asStateFlow()

    private val _eventFlow = MutableSharedFlow<CustomerEvent>()
    val eventFlow: SharedFlow<CustomerEvent> = _eventFlow.asSharedFlow()

    private var pollingJob: Job? = null
    private var sessionCode: String = ""

    fun initialize(code: String) {
        sessionCode = code
        loadData(showLoading = true)
        startPolling()
    }

    override fun onCleared() {
        super.onCleared()
        pollingJob?.cancel()
    }

    private fun startPolling() {
        pollingJob?.cancel()
        pollingJob = viewModelScope.launch {
            while (isActive) {
                delay(Constants.POLL_INTERVAL_MS)
                loadData(showLoading = false)
            }
        }
    }

    fun loadData(showLoading: Boolean = false) {
        viewModelScope.launch {
            if (showLoading) _uiState.update { it.copy(isLoading = true, errorMessage = null) }

            val sessionResult = client.getPublicSesi(sessionCode)
            val ordersResult = client.listPublicPesanan(sessionCode)

            _uiState.update { it.copy(isLoading = false) }

            if (sessionResult.isFailure || ordersResult.isFailure) {
                val err = sessionResult.exceptionOrNull()?.message ?: ordersResult.exceptionOrNull()?.message ?: "Gagal memuat sesi"
                _uiState.update { it.copy(errorMessage = err) }
                return@launch
            }

            val session = sessionResult.getOrNull()
            val orders = ordersResult.getOrNull() ?: emptyList()

            if (session == null) {
                _uiState.update { it.copy(errorMessage = "Link atau kode sesi tidak ditemukan.") }
                return@launch
            }

            prefs.saveLastSession(session.kode, session.judul)

            val recap = if (session.status == Constants.STATUS_SETTLED) {
                RecapCalculator.hitungRekap(orders, session)
            } else null

            _uiState.update {
                it.copy(
                    session = session,
                    orders = orders,
                    recap = recap,
                    errorMessage = null
                )
            }
        }
    }

    fun onNameChange(v: String) = _uiState.update { it.copy(inputName = v) }
    fun onSelectItem(v: String) = _uiState.update { it.copy(selectedItem = v, selectedLevel = if (!FormatUtils.isMie(v)) "" else it.selectedLevel) }
    fun onSelectLevel(v: String) = _uiState.update { it.copy(selectedLevel = v) }
    fun onSelectWhoName(v: String) = _uiState.update { it.copy(selectedWhoName = v) }

    fun setProofFile(name: String, bytes: ByteArray) {
        _uiState.update { it.copy(proofFileName = name, selectedProofBytes = bytes) }
    }

    fun submitOrder() {
        val state = _uiState.value
        val name = state.inputName.trim()
        val item = state.selectedItem
        val level = if (FormatUtils.isMie(item)) state.selectedLevel else ""

        if (name.isBlank()) {
            emitToast("Isi nama terlebih dahulu", true)
            return
        }
        if (item.isBlank()) {
            emitToast("Pilih pesanan terlebih dahulu", true)
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isSubmitting = true) }
            prefs.lastName = name

            val res = client.addPesanan(sessionCode, name, item, level)
            _uiState.update { it.copy(isSubmitting = false) }

            res.onSuccess { accepted ->
                if (accepted) {
                    emitToast("Masuk ke daftar ✓")
                    _uiState.update { it.copy(selectedItem = "", selectedLevel = "") }
                    loadData(showLoading = false)
                } else {
                    emitToast("Tidak bisa menambah: daftar penuh atau ditutup", true)
                }
            }.onFailure { err ->
                emitToast(err.message ?: "Gagal mengirim pesanan", true)
            }
        }
    }

    fun submitPayment() {
        val state = _uiState.value
        val who = state.selectedWhoName.trim()
        val recap = state.recap ?: return

        val person = recap.groups.find { FormatUtils.nameKey(it.nama) == FormatUtils.nameKey(who) }
        if (person == null) {
            emitToast("Pilih namamu terlebih dahulu", true)
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isSubmitting = true) }

            var proofUrl: String? = null
            if (state.selectedProofBytes != null) {
                val fileName = "$sessionCode/${UUID.randomUUID()}.jpg"
                val uploadRes = client.uploadBuktiImage(fileName, state.selectedProofBytes)
                proofUrl = uploadRes.getOrNull()
            }

            val res = client.markPaid(sessionCode, person.nama, proofUrl)
            _uiState.update { it.copy(isSubmitting = false) }

            res.onSuccess {
                emitToast("Tercatat lunas ✓")
                _uiState.update {
                    it.copy(
                        paymentSuccessName = person.nama,
                        selectedProofBytes = null,
                        proofFileName = null
                    )
                }
                loadData(showLoading = false)
            }.onFailure { err ->
                emitToast(err.message ?: "Gagal mencatat pembayaran", true)
            }
        }
    }

    private fun emitToast(msg: String, isErr: Boolean = false) {
        viewModelScope.launch {
            _eventFlow.emit(CustomerEvent.ShowToast(msg, isErr))
        }
    }
}
