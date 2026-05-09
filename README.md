# 🛡️ KSM License Manager v1.0

**KSM License Manager** es un ecosistema profesional de protección de software diseñado para centralizar el control de accesos, gestionar suscripciones temporales y autorizar dispositivos mediante HWID (Hardware ID).

---

## 🚀 Componentes del Sistema

### 1. 🖥️ Dashboard Administrativo (React + Vite)
Panel centralizado para el administrador desde donde se controlan todos los accesos.
*   **Ubicación:** Raíz del proyecto.
*   **Comando para iniciar:** `npm run dev`
*   **Funciones:**
    *   ✅ **Autorizar**: Aprobar solicitudes nuevas con acceso ilimitado o temporal.
    *   🚫 **Bloquear**: Revocar el acceso a cualquier usuario en tiempo real.
    *   🗑️ **Eliminar**: Limpiar registros de la base de datos.
    *   ⏳ **Control de Expiración**: Visualización inteligente de días restantes.

### 2. 🕵️ Módulo "Policía" (`license_checker.js`)
El guardián que se integra en tus aplicaciones clientes.
*   **Ubicación:** `/client_module/license_checker.js`
*   **Características:**
    *   **Auto-Registro**: Si un usuario nuevo abre la app, le solicita su nombre y envía la petición al panel automáticamente.
    *   **Universal HWID**: En Windows (Electron) detecta el ID físico de la placa base. En Web/Android genera un ID persistente.
    *   **Interfaz Premium**: Pantallas de bloqueo integradas con diseño moderno y animaciones.

### 3. ☁️ Backend (Supabase Edge Functions)
La inteligencia en la nube que procesa las validaciones de forma segura.
*   **Función:** `verify-license`
*   **Seguridad**: Validación por HWID + App Name para permitir múltiples apps en una misma PC con licencias independientes.

---

## 🛠️ Cómo Proteger una Nueva Aplicación (3 Pasos)

### Paso 1: Copiar el Módulo
Copia el archivo `client_module/license_checker.js` a la carpeta de tu nuevo proyecto.

### Paso 2: Integrar el Candado
En tu archivo principal (ej. `index.html`), añade este bloque de código al inicio:

```html
<script type="module">
  import { verifyLicense } from './license_checker.js';

  // Cambia 'Mi Nueva App' por el nombre que desees
  verifyLicense('Mi Nueva App');
</script>
```

### Paso 3: Autorizar
1. Abre tu nueva aplicación.
2. Verás la pantalla de **Registro Requerido**.
3. Ingresa tu nombre y envía la solicitud.
4. Ve a tu **Dashboard KSM**, busca la nueva fila y dale a **Autorizar**.
5. ¡Listo! Tu app se desbloqueará automáticamente.

---

## 📱 Notas sobre Plataformas

### 🖥️ Windows (Electron)
El módulo está preparado para detectar el hardware real. Al compilar con Electron, el HWID será el UUID de la BIOS, lo que hace que la licencia sea **imposible de burlar** borrando archivos o formateando.

### 🤖 Android
En aplicaciones Android (híbridas/PWA), el HWID será persistente mientras no se borren los datos de la aplicación. Es ideal para vender apps por suscripción mensual.

### 🌐 Web
Para aplicaciones web tradicionales, el sistema usa el `localStorage` para identificar al cliente.

---

## ⚠️ Configuración Importante en Supabase

Si creas un nuevo proyecto de Supabase, recuerda:
1.  **Ejecutar el `schema.sql`** para crear la tabla de licencias.
2.  **Desactivar "Enforce JWT Verification"** en la configuración de la Edge Function para permitir conexiones con llaves `sb_`.
3.  **Configurar los Secrets**: Asegúrate de que `SUPABASE_SERVICE_ROLE_KEY` esté configurado en las variables de la función.

---

**Desarrollado por Antigravity para KSM Servicios.**  
*Protegiendo tu software, impulsando tu negocio.* 🚀
