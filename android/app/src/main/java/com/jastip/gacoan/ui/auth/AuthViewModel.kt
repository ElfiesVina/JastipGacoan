package com.jastip.gacoan.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.jastip.gacoan.GacoanApp
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

enum class AuthMode {
    LOGIN, SIGNUP, FORGOT, OTP, NEW_PASS
}

data class AuthUiState(
    val activeTab: String = "jastiper", // "jastiper" or "jastip"
    val authMode: AuthMode = AuthMode.LOGIN,
    val sessionInput: String = "",
    val nameInput: String = "",
    val emailInput: String = "",
    val passwordInput: String = "",
    val confirmPasswordInput: String = "",
    val otpInput: String = "",
    val isLoading: Boolean = false,
    val lastSessionCode: String = "",
    val lastSessionTitle: String = ""
)

sealed class AuthEvent {
    data class NavigateToCustomer(val kode: String) : AuthEvent()
    object NavigateToDashboard : AuthEvent()
    data class ShowToast(val message: String, val isError: Boolean = false) : AuthEvent()
}

class AuthViewModel : ViewModel() {

    private val prefs = GacoanApp.instance.prefs
    private val client = GacoanApp.instance.supabaseClient

    private val _uiState = MutableStateFlow(
        AuthUiState(
            lastSessionCode = prefs.lastSessionCode,
            lastSessionTitle = prefs.lastSessionTitle
        )
    )
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    private val _eventFlow = MutableSharedFlow<AuthEvent>()
    val eventFlow: SharedFlow<AuthEvent> = _eventFlow.asSharedFlow()

    init {
        // If user already logged in with valid token, navigate to dashboard directly
        if (!prefs.authToken.isNullOrBlank() && !prefs.userId.isNullOrBlank()) {
            viewModelScope.launch {
                _eventFlow.emit(AuthEvent.NavigateToDashboard)
            }
        }
    }

    fun setTab(tab: String) {
        _uiState.update { it.copy(activeTab = tab) }
    }

    fun setAuthMode(mode: AuthMode) {
        _uiState.update { it.copy(authMode = mode) }
    }

    fun onSessionInputChange(v: String) = _uiState.update { it.copy(sessionInput = v) }
    fun onNameChange(v: String) = _uiState.update { it.copy(nameInput = v) }
    fun onEmailChange(v: String) = _uiState.update { it.copy(emailInput = v) }
    fun onPasswordChange(v: String) = _uiState.update { it.copy(passwordInput = v) }
    fun onConfirmPasswordChange(v: String) = _uiState.update { it.copy(confirmPasswordInput = v) }
    fun onOtpChange(v: String) = _uiState.update { it.copy(otpInput = v.filter { ch -> ch.isDigit() }) }

    fun joinSession() {
        val input = _uiState.value.sessionInput.trim()
        val codeMatch = Regex("""#/s/(\w+)""").find(input)?.groupValues?.get(1)
            ?: Regex("""^(\w+)$""").find(input)?.groupValues?.get(1)

        if (codeMatch.isNullOrBlank()) {
            emitToast("Tempel link atau kode dari jastip", true)
            return
        }

        viewModelScope.launch {
            _eventFlow.emit(AuthEvent.NavigateToCustomer(codeMatch))
        }
    }

    fun openLastSession() {
        val code = _uiState.value.lastSessionCode
        if (code.isNotBlank()) {
            viewModelScope.launch {
                _eventFlow.emit(AuthEvent.NavigateToCustomer(code))
            }
        }
    }

    fun authenticate() {
        val state = _uiState.value
        val email = state.emailInput.trim()
        val pass = state.passwordInput

        if (state.authMode == AuthMode.SIGNUP && state.nameInput.isBlank()) {
            emitToast("Isi nama terlebih dahulu", true)
            return
        }
        if (email.isBlank() || pass.length < 6) {
            emitToast("Isi email dan password (min 6 karakter)", true)
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            val result = if (state.authMode == AuthMode.SIGNUP) {
                client.signUp(email, pass, state.nameInput.trim())
            } else {
                client.signIn(email, pass)
            }

            _uiState.update { it.copy(isLoading = false) }

            result.onSuccess { session ->
                if (session.accessToken.isNotBlank()) {
                    prefs.authToken = session.accessToken
                    prefs.userId = session.user?.id
                    prefs.userEmail = session.user?.email
                    emitToast(if (state.authMode == AuthMode.SIGNUP) "Pendaftaran berhasil!" else "Berhasil masuk!")
                    _eventFlow.emit(AuthEvent.NavigateToDashboard)
                } else {
                    emitToast("Cek email konfirmasi sebelum masuk")
                    _uiState.update { it.copy(authMode = AuthMode.LOGIN) }
                }
            }.onFailure { err ->
                emitToast(err.message ?: "Gagal masuk", true)
            }
        }
    }

    fun sendResetPassword() {
        val email = _uiState.value.emailInput.trim()
        if (email.isBlank()) {
            emitToast("Isi email terlebih dahulu", true)
            return
        }
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            val res = client.sendResetPasswordEmail(email)
            _uiState.update { it.copy(isLoading = false) }
            res.onSuccess {
                emitToast("Kode verifikasi dikirim ke email")
                _uiState.update { it.copy(authMode = AuthMode.OTP) }
            }.onFailure {
                emitToast(it.message ?: "Gagal mengirim kode", true)
            }
        }
    }

    fun verifyOtp() {
        val state = _uiState.value
        if (state.otpInput.length < 6) {
            emitToast("Kode minimal 6 digit", true)
            return
        }
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            val res = client.verifyResetCode(state.emailInput.trim(), state.otpInput)
            _uiState.update { it.copy(isLoading = false) }
            res.onSuccess { session ->
                prefs.authToken = session.accessToken
                emitToast("Kode terverifikasi! Masukkan password baru.")
                _uiState.update { it.copy(authMode = AuthMode.NEW_PASS) }
            }.onFailure {
                emitToast(it.message ?: "Kode salah atau kedaluwarsa", true)
            }
        }
    }

    fun saveNewPassword() {
        val state = _uiState.value
        if (state.passwordInput.length < 6) {
            emitToast("Password baru min 6 karakter", true)
            return
        }
        if (state.passwordInput != state.confirmPasswordInput) {
            emitToast("Konfirmasi password tidak sama", true)
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            val res = client.updatePassword(state.passwordInput)
            _uiState.update { it.copy(isLoading = false) }
            res.onSuccess {
                emitToast("Password baru berhasil disimpan!")
                _eventFlow.emit(AuthEvent.NavigateToDashboard)
            }.onFailure {
                emitToast(it.message ?: "Gagal memperbarui password", true)
            }
        }
    }

    private fun emitToast(msg: String, isErr: Boolean = false) {
        viewModelScope.launch {
            _eventFlow.emit(AuthEvent.ShowToast(msg, isErr))
        }
    }
}
