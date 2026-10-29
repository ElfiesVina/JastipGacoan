package com.jastip.gacoan.ui.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.jastip.gacoan.GacoanApp
import com.jastip.gacoan.data.model.Profile
import com.jastip.gacoan.data.model.Session
import com.jastip.gacoan.domain.FormatUtils
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

data class DashboardUiState(
    val profile: Profile = Profile(),
    val mySessions: List<Session> = emptyList(),
    val newSessionTitle: String = "",
    val isLoading: Boolean = true,
    val isSavingProfile: Boolean = false,
    val isCreatingSession: Boolean = false,
    val errorMessage: String? = null
)

sealed class DashboardEvent {
    data class NavigateToSessionDetail(val kode: String) : DashboardEvent()
    object NavigateToAuth : DashboardEvent()
    data class ShowToast(val message: String, val isError: Boolean = false) : DashboardEvent()
}

class DashboardViewModel : ViewModel() {

    private val prefs = GacoanApp.instance.prefs
    private val client = GacoanApp.instance.supabaseClient

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    private val _eventFlow = MutableSharedFlow<DashboardEvent>()
    val eventFlow: SharedFlow<DashboardEvent> = _eventFlow.asSharedFlow()

    init {
        loadDashboardData()
    }

    fun loadDashboardData() {
        val userId = prefs.userId
        if (userId.isNullOrBlank()) {
            viewModelScope.launch { _eventFlow.emit(DashboardEvent.NavigateToAuth) }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }

            val profileRes = client.getProfile(userId)
            val sessionsRes = client.listMySessions()

            _uiState.update { it.copy(isLoading = false) }

            val profile = profileRes.getOrNull() ?: Profile(id = userId)
            val sessions = sessionsRes.getOrNull() ?: emptyList()

            _uiState.update {
                it.copy(
                    profile = profile,
                    mySessions = sessions
                )
            }
        }
    }

    fun onProfileNameChange(v: String) = _uiState.update { it.copy(profile = it.profile.copy(nama = v)) }
    fun onProfileRekChange(v: String) = _uiState.update { it.copy(profile = it.profile.copy(rek = v)) }
    fun onProfileWaChange(v: String) = _uiState.update { it.copy(profile = it.profile.copy(wa = v)) }
    fun onNewSessionTitleChange(v: String) = _uiState.update { it.copy(newSessionTitle = v) }

    fun saveProfile() {
        val profile = _uiState.value.profile
        val normalizedWa = FormatUtils.normalizePhone(profile.wa)

        viewModelScope.launch {
            _uiState.update { it.copy(isSavingProfile = true) }
            val updated = profile.copy(wa = normalizedWa)
            val res = client.saveProfile(updated)
            _uiState.update { it.copy(isSavingProfile = false, profile = updated) }

            res.onSuccess {
                emitToast("Profil tersimpan ✓")
            }.onFailure {
                emitToast(it.message ?: "Gagal menyimpan profil", true)
            }
        }
    }

    fun createSession() {
        val userId = prefs.userId ?: return
        val title = _uiState.value.newSessionTitle.ifBlank { "Titipan Gacoan" }

        viewModelScope.launch {
            _uiState.update { it.copy(isCreatingSession = true) }

            var created: Session? = null
            var lastError: Throwable? = null

            // Retry up to 3 times in case of code collision
            for (attempt in 0..2) {
                val code = FormatUtils.generateSessionCode()
                val res = client.createSession(code, userId, title)
                if (res.isSuccess) {
                    created = res.getOrNull()
                    break
                } else {
                    lastError = res.exceptionOrNull()
                }
            }

            _uiState.update { it.copy(isCreatingSession = false) }

            if (created != null) {
                emitToast("Sesi berhasil dibuat!")
                _uiState.update { it.copy(newSessionTitle = "") }
                _eventFlow.emit(DashboardEvent.NavigateToSessionDetail(created.kode))
            } else {
                emitToast(lastError?.message ?: "Gagal membuat sesi", true)
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            prefs.clearAuth()
            _eventFlow.emit(DashboardEvent.NavigateToAuth)
        }
    }

    private fun emitToast(msg: String, isErr: Boolean = false) {
        viewModelScope.launch {
            _eventFlow.emit(DashboardEvent.ShowToast(msg, isErr))
        }
    }
}
