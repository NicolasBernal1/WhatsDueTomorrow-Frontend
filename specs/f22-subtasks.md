# Test Plan: F22 - Desglose de Tareas en Subtareas con Avance

## 1. Identificación y Objetivos
* **Módulo:** F22 - Subtasks & Progress (`/assignment-details/:id`)
* **User Story:** Como estudiante, quiero desglosar una tarea compleja en subtareas manejables y marcar las completadas para visualizar el porcentaje reactivo de avance.
* **Seed Fixture:** `test/seed.spec.ts` (Sesión autenticada en `localStorage` con bypass de `auth.guard`).

---

## 2. Precondiciones y Estado Inicial
1. Usuario autenticado con token JWT en `localStorage`.
2. Asignación existente simulada mediante intercepción de ruta:
   * `GET **/assignments/1` -> `{ id: 1, title: 'Proyecto Final de Software', subjectName: 'Ingeniería de Software', description: 'Entrega de arquitectura' }`.
   * `GET **/assignments/1/subtasks` o `GET **/subtasks?assignmentId=1` -> Lista de subtareas.
   * `POST **/subtasks` -> Creación de nueva subtarea.
   * `PATCH **/subtasks/:id` -> Actualización de estado (completada/incompleta).
3. Navegación hacia `/assignment-details/1`.

---

## 3. Escenarios de Prueba Detallados

### Escenario 1 (Happy Path): Creación de Subtarea y Actualización de Progreso
* **Descripción:** Añadir una nueva subtarea mediante el formulario de entrada rápida y verificar que aparece en el listado y recalcula el progreso.
* **Pasos:**
  1. Interceptar `GET **/assignments/1` devolviendo los datos de la asignación.
  2. Interceptar `GET **/subtasks` devolviendo inicialmente una lista con 1 subtarea no completada:
     `[{ id: 10, title: 'Diseñar diagramas C4', completed: false }]`.
  3. Navegar a `/assignment-details/1`.
  4. Verificar que el título de la tarea sea visible: `getByRole('heading', { name: 'Proyecto Final de Software' })`.
  5. Verificar que el progreso inicial indique `0%`: `locator('.progress-label strong')` con texto `0%`.
  6. Localizar el campo de texto de nueva subtarea: `getByPlaceholder('Add a step for this assignment')` o `getByLabel('New subtask')`.
  7. Escribir `Configurar Dockerfile` en el campo.
  8. Hacer clic en el botón `getByRole('button', { name: 'Add' })`.
  9. Interceptar la creación y recarga devolviendo 2 subtareas pendientes.
  10. Verificar que la nueva subtarea sea visible en la lista: `getByText('Configurar Dockerfile')`.
* **Criterio de Éxito:** La nueva subtarea se lista de inmediato y el formulario queda limpio para el siguiente ingreso.

---

### Escenario 2 (Cálculo Reactivo): Marcar Subtareas y Alcance del 100%
* **Descripción:** Marcar las subtareas como completadas y verificar que la barra de progreso avanza a 50% y 100%, mostrando el mensaje de finalización.
* **Pasos:**
  1. Cargar la vista con 2 subtareas existentes:
     * Subtarea 1: `Configurar entorno` (incompleta).
     * Subtarea 2: `Desarrollar módulo` (incompleta).
  2. Verificar que el progreso inicial sea `0%`.
  3. Marcar el primer checkbox: `getByLabel('Completar Configurar entorno')`.
  4. Verificar que el progreso cambie a `50%`.
  5. Marcar el segundo checkbox: `getByLabel('Completar Desarrollar módulo')`.
  6. Verificar que el progreso avance a `100%`: `locator('.progress-label strong')` con texto `100%`.
  7. Validar la aparición del mensaje de felicitación/completitud:
     `getByText('You completed all the steps. You can now mark the assignment as completed.')`.
* **Criterio de Éxito:** El progreso porcentual se actualiza matemáticamente de forma reactiva y el mensaje de finalización se hace visible únicamente al llegar al 100%.

---

### Escenario 3 (Validación de Entrada): Botón Deshabilitado ante Campo Vacío
* **Descripción:** Comprobar que no se permite agregar subtareas con título en blanco o espacios vacíos.
* **Pasos:**
  1. Navegar a `/assignment-details/1`.
  2. Verificar que el botón de agregar (`getByRole('button', { name: 'Add' })`) se encuentre deshabilitado (`toBeDisabled()`).
  3. Ingresar espacios en blanco `'   '` en el input.
  4. Verificar que el botón continúe deshabilitado.
* **Criterio de Éxito:** Se previene la inserción de subtareas vacías o inválidas en la interfaz.
