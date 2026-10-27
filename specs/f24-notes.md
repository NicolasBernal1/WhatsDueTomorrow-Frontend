# Test Plan: F24 - Bitácora de Apuntes y Recursos Rápidos

## 1. Identificación y Objetivos
* **Módulo:** F24 - Notes and Quick Resources Log (`/subject-details/:id`)
* **User Story:** Como estudiante, quiero registrar apuntes de clase y enlaces de recursos rápidos en la bitácora de cada materia para centralizar mi material de estudio.
* **Seed Fixture:** `test/seed.spec.ts` (Sesión autenticada en `localStorage` con bypass de `auth.guard`).

---

## 2. Precondiciones y Estado Inicial
1. Usuario autenticado con token JWT en `localStorage`.
2. Asignatura base existente:
   * `GET **/subjects/1` -> `{ id: 1, name: 'Bases de Datos', professor: 'Prof. Gómez', color: '#4caf50' }`.
   * `GET **/notes?subjectId=1` o `GET **/subjects/1/notes` -> Lista de notas asociadas.
   * `POST **/notes` -> Creación de apunte.
3. Navegación hacia `/subject-details/1`.

---

## 3. Escenarios de Prueba Detallados

### Escenario 1 (Happy Path): Creación y Visualización de un Nuevo Apunte
* **Descripción:** Abrir el modal de nueva nota, diligenciar título, contenido y enlace URL, guardar y comprobar su aparición inmediata en la lista.
* **Pasos:**
  1. Interceptar `GET **/subjects/1` devolviendo la información de la asignatura.
  2. Interceptar `GET **/notes` devolviendo inicialmente lista vacía.
  3. Navegar a `/subject-details/1`.
  4. Localizar la sección: `locator('.bitacora-section')`.
  5. Verificar el título: `getByRole('heading', { name: 'Notes and quick resources log' })`.
  6. Hacer clic en el botón: `getByRole('button', { name: '+ New Note' })` o `getByRole('button', { name: 'Create the first note' })`.
  7. Esperar la apertura del modal: `locator('app-note-modal')`.
  8. Llenar el campo de título: `getByLabel('Title')` con `'Resumen de Normalización 3FN'`.
  9. Llenar el campo de contenido: `getByLabel('Content')` con `'Repasar dependencias funcionales y transitivas'`.
  10. Llenar el enlace URL opcional: `getByLabel('Resource Link (URL)')` o `getByPlaceholder('https://...')` con `'https://wikipedia.org/wiki/Third_normal_form'`.
  11. Interceptar `POST **/notes` devolviendo respuesta exitosa.
  12. Interceptar la recarga de `GET **/notes` devolviendo la nota creada.
  13. Hacer clic en `getByRole('button', { name: 'Save Note' })` o `getByRole('button', { name: 'Save' })`.
  14. Verificar que el modal se cierre.
  15. Verificar que la tarjeta de la nota se renderice:
      * Título: `getByText('Resumen de Normalización 3FN')`.
      * Contenido: `getByText('Repasar dependencias funcionales y transitivas')`.
      * Enlace: `getByText('https://wikipedia.org/wiki/Third_normal_form')`.
* **Criterio de Éxito:** La nota se crea, se persiste en el listado y el modal de Angular Material se cierra adecuadamente.

---

### Escenario 2 (Edge Case / Estado Vacío): Materia sin Apuntes Registrados
* **Descripción:** Comprobar el mensaje de estado vacío y el llamado a la acción cuando la materia no tiene apuntes.
* **Pasos:**
  1. Interceptar `GET **/notes` con `{ status: 200, message: 'ok', data: [] }`.
  2. Navegar a `/subject-details/1`.
  3. Verificar que sea visible el contenedor `.empty-bitacora`.
  4. Validar el encabezado: `getByRole('heading', { name: 'No notes or resources registered for this subject' })`.
  5. Validar el texto explicativo: `getByText('Keep your study notes, formulas, class agreements and online links in one place.')`.
  6. Verificar la existencia del botón de acción: `getByRole('button', { name: 'Create the first note' })`.
* **Criterio de Éxito:** La interfaz guía proactivamente al estudiante hacia la creación de su primer recurso.
