# Test Plan: F26 - Gestión de Créditos y Semáforo de Carga Semanal

## 1. Identificación y Objetivos
* **Módulo:** F26 - Weekly Academic Load & Credit Management (`/subjects`)
* **User Story:** Como estudiante, quiero visualizar un semáforo de carga académica semanal y el desglose de horas presenciales vs. autónomas según mis créditos inscritos, para planificar mi semestre sin sobrecargas.
* **Seed Fixture:** `test/seed.spec.ts` (Sesión autenticada en `localStorage` con bypass de `auth.guard`).

---

## 2. Precondiciones y Estado Inicial
1. Usuario autenticado con token JWT en `localStorage`.
2. Interceptor de red configurado para:
   * `GET **/subjects` -> Lista de materias inscritas con sus créditos individuales.
   * `GET **/subjects/academic-load-summary` o endpoint de carga académica ->
     `{ totalCredits: 16, weeklyPresentialHours: 12, weeklyAutonomousHours: 24, subjectsCount: 4, classesCount: 6, status: 'balanceada' }`.
3. Navegación hacia `/subjects`.

---

## 3. Escenarios de Prueba Detallados

### Escenario 1 (Happy Path): Semáforo en Estado 'Balanceada' (12 a 18 Créditos)
* **Descripción:** Verificar que un estudiante con 16 créditos visualiza el semáforo en nivel 'Balanced' con los cálculos horarios correspondientes.
* **Pasos:**
  1. Interceptar `GET **/subjects` respondiendo con 4 materias (cada una de 4 créditos).
  2. Interceptar el resumen de carga académica con:
     * `status: 'balanceada'`
     * `totalCredits: 16`
     * `weeklyPresentialHours: 12`
     * `weeklyAutonomousHours: 24`
     * `subjectsCount: 4`
     * `classesCount: 6`
  3. Navegar a `/subjects`.
  4. Localizar la sección: `locator('section.academic-load-section')`.
  5. Verificar el encabezado: `getByText('Weekly Academic Load')`.
  6. Verificar que la zona activa del semáforo sea la intermedia:
     `locator('.traffic-step.step-balanceada.active')` es visible.
  7. Verificar la tarjeta de Total de Créditos: `getByText('Total Credits')` con valor `16 credits`.
  8. Verificar las Horas Presenciales: `getByText('Weekly Class Hours')` con valor `12 h/week`.
  9. Verificar las Horas Autónomas: `getByText('Estimated Independent Study')` con valor `24 h/week`.
  10. Validar la regla de cálculo explícita: `getByText('Formula: 2h of independent study per 1h of class')`.
* **Criterio de Éxito:** La tarjeta de semáforo refleja con precisión el estado 'balanceada' y las horas estimadas.

---

### Escenario 2 (Edge Case): Semáforo en Estado 'Sobrecarga' (> 18 Créditos)
* **Descripción:** Comprobar la activación de la alerta de sobrecarga académica cuando el total de créditos supera los 18.
* **Pasos:**
  1. Interceptar el resumen de carga con `totalCredits: 22` y `status: 'sobrecarga'`.
  2. Navegar a `/subjects`.
  3. Localizar la sección del semáforo: `locator('section.academic-load-section')`.
  4. Verificar que el paso de sobrecarga esté activo:
     `locator('.traffic-step.step-sobrecarga.active')` es visible.
  5. Validar que la tarjeta contenedora incluya la clase CSS indicativa:
     `locator('.load-card.status-sobrecarga')` es visible.
  6. Verificar el texto de total de créditos: `getByText('22 credits')`.
* **Criterio de Éxito:** El semáforo visualiza la alerta de sobrecarga sin depender exclusivamente del color (cumpliendo accesibilidad RNF10).

---

### Escenario 3 (Interacción): Búsqueda y Filtrado de Materias
* **Descripción:** Utilizar el campo de búsqueda de asignaturas y verificar que filtra reactivamente las tarjetas mostradas.
* **Pasos:**
  1. Cargar `/subjects` con materias como `'Cálculo Diferencial'` y `'Programación Web'`.
  2. Localizar el buscador: `getByPlaceholder('Search by subject or professor...')`.
  3. Escribir `'Cálculo'` en el buscador.
  4. Verificar que la tarjeta `'Cálculo Diferencial'` permanezca visible.
  5. Verificar que `'Programación Web'` no esté visible en la cuadrícula.
* **Criterio de Éxito:** La lista se filtra en el cliente de manera reactiva en tiempo real.
