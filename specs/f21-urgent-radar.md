# Test Plan: F21 - Alertas y Radar de Entregas Urgentes

## 1. Identificación y Objetivos
* **Módulo:** F21 - Urgent Radar (`/urgent-radar`)
* **User Story:** Como estudiante, quiero visualizar en un radar prioritario las asignaciones con entrega en las próximas 24 horas y activar alertas web, para evitar entregas tardías.
* **Seed Fixture:** `test/seed.spec.ts` (Sesión autenticada en `localStorage` con bypass de `auth.guard`).

---

## 2. Precondiciones y Estado Inicial
1. Usuario autenticado con token JWT almacenado en `localStorage.getItem('token')`.
2. Interceptor de red configurado para simular o consultar:
   * `GET **/users/profile` -> Usuario activo.
   * `GET **/assignments/upcoming` -> Asignaciones urgentes (≤ 24h) o lista vacía según el escenario.
3. Servidor frontend en ejecución en `http://127.0.0.1:4200` o URL base de pruebas.

---

## 3. Escenarios de Prueba Detallados

### Escenario 1 (Happy Path): Visualización de Asignaciones Urgentes en el Radar
* **Descripción:** Comprobar que el radar presenta la lista de tareas urgentes con su temporizador y datos de la materia.
* **Pasos:**
  1. Interceptar `GET **/assignments/upcoming` respondiendo con al menos una asignación urgente (ejemplo: `{ id: 101, title: 'Taller de Algoritmos', subjectName: 'Estructuras de Datos', countdown: '18h 30m remaining', reminderMinutes: 60 }`).
  2. Navegar a `/urgent-radar`.
  3. Esperar que el título principal de la página sea visible: `getByRole('heading', { name: 'Urgent assignments radar' })`.
  4. Verificar que se renderice la cuadrícula de urgencias: `locator('section.urgent-grid')`.
  5. Verificar que la tarjeta contenga el nombre de la materia: `getByText('Estructuras de Datos')`.
  6. Verificar que la tarjeta contenga el título de la tarea: `getByText('Taller de Algoritmos')`.
  7. Verificar que el temporizador regresivo esté visible: `getByText('18h 30m remaining')`.
  8. Verificar la etiqueta de recordatorio: `getByText('Reminder: 60 min before')`.
* **Criterio de Éxito:** Todos los metadatos de la asignación urgente se despliegan en la tarjeta sin errores de renderizado.

---

### Escenario 2 (Edge Case / Estado Vacío): Sin Asignaciones Urgentes
* **Descripción:** Verificar el mensaje informativo de estado vacío cuando el estudiante no tiene tareas pendientes en las próximas 24 horas.
* **Pasos:**
  1. Interceptar `GET **/assignments/upcoming` devolviendo una lista vacía `{ status: 200, message: 'ok', data: [] }`.
  2. Navegar a `/urgent-radar`.
  3. Esperar que finalice el spinner de carga (`mat-progress-spinner`).
  4. Verificar que se muestre el contenedor de estado vacío: `locator('section.empty-radar')`.
  5. Verificar que el encabezado de estado vacío sea visible: `getByRole('heading', { name: 'No urgent assignments' })`.
  6. Validar el texto explicativo: `getByText('You have no pending assignments due within the next 24 hours.')`.
  7. Verificar que no exista ninguna tarjeta de asignación en el DOM (`locator('mat-card.urgent-card')` con conteo 0).
* **Criterio de Éxito:** La interfaz comunica claramente la ausencia de urgencias sin romper el diseño.

---

### Escenario 3 (Interacción): Activación de Alertas Web
* **Descripción:** Validar que el botón de habilitar alertas web responde a la interacción del usuario y actualiza el mensaje de estado.
* **Pasos:**
  1. Navegar a `/urgent-radar`.
  2. Localizar el botón de acción: `getByRole('button', { name: 'Enable web alerts' })`.
  3. Hacer clic en el botón.
  4. Verificar que el botón o el mensaje de estado refleje la activación o el estado de permisos de notificación del navegador (`locator('.notification-message')`).
* **Criterio de Éxito:** La interacción de habilitación no genera excepciones no controladas en la consola y responde inmediatamente.
