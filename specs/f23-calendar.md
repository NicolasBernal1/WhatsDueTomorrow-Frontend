# Test Plan: F23 - Sincronización y Exportación de Calendario (.ics)

## 1. Identificación y Objetivos
* **Módulo:** F23 - Calendar Sync & ICS Export (`/schedule`)
* **User Story:** Como estudiante, quiero exportar mi horario de clases y entregas en formato `.ics` y generar un enlace de suscripción `webcal://` para sincronizar con Google Calendar, Apple Calendar o Outlook.
* **Seed Fixture:** `test/seed.spec.ts` (Sesión autenticada en `localStorage` con bypass de `auth.guard`).

---

## 2. Precondiciones y Estado Inicial
1. Usuario autenticado con token JWT en `localStorage`.
2. Interceptores de red configurados para:
   * `GET **/classes` -> Clases del horario escolar.
   * `GET **/users/profile` -> Datos de perfil del estudiante.
   * `POST **/calendar/subscription` -> Generación de URL `webcal://whatsduetomorrow-backed.onrender.com/calendar/user-123.ics`.
   * `GET **/calendar/download.ics` -> Flujo binario de descarga de archivo iCalendar según estándar RFC 5545.
3. Navegación hacia `/schedule`.

---

## 3. Escenarios de Prueba Detallados

### Escenario 1 (Happy Path): Generación de Enlace de Suscripción Webcal
* **Descripción:** Acceder a la sección de sincronización, solicitar la creación del enlace de suscripción y verificar la presentación del input con URL y botón de copia.
* **Pasos:**
  1. Interceptar `POST **/calendar/subscription` devolviendo:
     `{ status: 200, message: 'ok', data: { webcalUrl: 'webcal://example.com/calendar/subscribe.ics' } }`.
  2. Navegar a `/schedule`.
  3. Desplazarse hasta la sección de sincronización: `locator('section.calendar-sync')`.
  4. Verificar el encabezado: `getByRole('heading', { name: 'Calendar sync' })`.
  5. Hacer clic en el botón de sincronización: `getByRole('button', { name: 'Sync calendar' })`.
  6. Verificar que aparezca el campo de texto de enlace: `getByLabel('Calendar subscription link')`.
  7. Verificar que el valor del campo contenga el protocolo `webcal://`: `toHaveValue(/webcal:\/\/.+/)`.
  8. Verificar que el botón `getByRole('button', { name: 'Copy link' })` esté disponible.
  9. Validar el mensaje de confirmación: `getByText('Your subscription link is ready.')`.
* **Criterio de Éxito:** La URL generada se despliega en modo solo lectura (`readonly`) y el mensaje de confirmación es visible.

---

### Escenario 2 (Happy Path): Descarga de Archivo .ics
* **Descripción:** Pulsar el botón de descarga y verificar que el navegador desencadene el evento de descarga del archivo `.ics` con el nombre correcto.
* **Pasos:**
  1. Interceptar `GET **/calendar/download.ics` devolviendo un archivo de texto plano con contenido de formato `BEGIN:VCALENDAR...END:VCALENDAR`.
  2. Navegar a `/schedule`.
  3. Configurar la captura del evento de descarga en Playwright: `page.waitForEvent('download')`.
  4. Hacer clic en el botón: `getByRole('button', { name: 'Download .ics' })`.
  5. Esperar la resolución de la descarga.
  6. Verificar que el nombre sugerido del archivo descargado sea `whats-due-tomorrow.ics`.
* **Criterio de Éxito:** El archivo se descarga sin errores ni advertencias de seguridad en el cliente.

---

### Escenario 3 (Resiliencia / Error): Manejo de Falla en el Servicio de Calendario
* **Descripción:** Verificar que cuando la API de sincronización falla (HTTP 500), se presenta un mensaje de error amigable en pantalla sin congelar la vista.
* **Pasos:**
  1. Interceptar `POST **/calendar/subscription` con código de error HTTP 500.
  2. Navegar a `/schedule`.
  3. Hacer clic en `getByRole('button', { name: 'Sync calendar' })`.
  4. Verificar la presencia del mensaje de error accesible: `getByText('Unable to create the subscription link.')`.
  5. Comprobar que no se renderice el input de enlace roto.
* **Criterio de Éxito:** El error se notifica al usuario con un mensaje comprensible en pantalla.
