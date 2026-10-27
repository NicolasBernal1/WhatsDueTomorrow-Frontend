# Test Plan: F25 - Calculadora y Simulador de Calificaciones por Asignatura

## 1. Identificación y Objetivos
* **Módulo:** F25 - Grade Calculator & Scenario Simulator (`/subject-details/:id`)
* **User Story:** Como estudiante, quiero registrar las calificaciones de mis evaluaciones con sus porcentajes para calcular mi promedio acumulado y simular la nota necesaria para aprobar la materia.
* **Seed Fixture:** `test/seed.spec.ts` (Sesión autenticada en `localStorage` con bypass de `auth.guard`).

---

## 2. Precondiciones y Estado Inicial
1. Usuario autenticado con token JWT en `localStorage`.
2. Asignatura y evaluaciones base interceptadas por red:
   * `GET **/subjects/1` -> Asignatura activa.
   * `GET **/evaluations?subjectId=1` -> Evaluaciones registradas.
   * `GET **/subjects/1/grades-summary` -> Objeto de resumen con `currentAverage`, `totalWeight`, `requiredGrade`, `status`.
3. Navegación hacia `/subject-details/1`.

---

## 3. Escenarios de Prueba Detallados

### Escenario 1 (Happy Path): Visualización de Métricas Ponderadas y Tabla
* **Descripción:** Verificar que el panel de métricas presenta correctamente el promedio ponderado actual, los puntos acumulados y la nota requerida para aprobar (3.0).
* **Pasos:**
  1. Interceptar `GET **/evaluations?subjectId=1` con:
     * Evaluación 1: Parcial 1 (Peso: 25%, Nota: 4.0).
     * Evaluación 2: Taller 1 (Peso: 15%, Nota: 3.5).
  2. Interceptar el resumen de calificaciones con:
     * `currentAverage`: 3.81
     * `currentContribution`: 1.53 (sobre 5.0)
     * `totalWeight`: 40.0%
     * `remainingWeight`: 60.0%
     * `requiredGrade`: 2.45
     * `status`: 'Aprobando'
  3. Navegar a `/subject-details/1`.
  4. Localizar la sección: `locator('.calculator-section')`.
  5. Verificar el encabezado: `getByRole('heading', { name: 'Grade calculator and simulator' })`.
  6. Verificar el promedio ponderado en la métrica: `getByText('3.81')`.
  7. Verificar los puntos acumulados: `getByText('1.53')`.
  8. Verificar el porcentaje evaluado: `getByText('40.00%')`.
  9. Verificar la nota requerida proyectada: `getByText('2.45')`.
  10. Verificar las filas de la tabla de evaluaciones:
      * Fila 1: `Parcial 1`, `25%`, `4.00`.
      * Fila 2: `Taller 1`, `15%`, `3.50`.
* **Criterio de Éxito:** Todos los cálculos matemáticos del backend se plasman con exactitud en las tarjetas de métricas y la tabla.

---

### Escenario 2 (Interactivo / Simulación): Simulador de Escenarios Hipotéticos
* **Descripción:** Ingresar una nota hipotética en el simulador y comprobar que la nota final proyectada se actualiza en tiempo real.
* **Pasos:**
  1. Con evaluaciones existentes que dejen un peso restante (ejemplo: 60% por evaluar).
  2. Localizar el contenedor: `locator('.simulator-card')`.
  3. Localizar el input del simulador: `locator('#hypotheticalInput')`.
  4. Ingresar el valor `4.0` en el input.
  5. Verificar que el texto de retroalimentación calcule la nota final estimada:
     `locator('.sim-feedback')` contiene `Estimated final grade:`.
  6. Comprobar que la insignia de estado indique `Status: Aprobando` o equivalente.
* **Criterio de Éxito:** El simulador realiza el cálculo en vivo ante eventos de teclado (`input`/`ngModelChange`) sin recargar la página.

---

### Escenario 3 (Alerta Visual): Detección de Sobrepeso (> 100%)
* **Descripción:** Verificar que cuando la sumatoria de porcentajes de evaluación supera el 100%, se dispara el banner de advertencia visual.
* **Pasos:**
  1. Interceptar el resumen de calificaciones con `totalWeight: 110.0` y `weightExceeded: true`.
  2. Navegar a `/subject-details/1`.
  3. Verificar que sea visible el banner de advertencia: `locator('.alert-warning')`.
  4. Validar el mensaje: `getByText('Weight alert: The sum of the evaluated weights')`.
* **Criterio de Éxito:** La advertencia se activa de forma condicional para prevenir inconsistencias en la planeación de la materia.
