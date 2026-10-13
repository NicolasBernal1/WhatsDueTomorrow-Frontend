@web @subjects @F11
Feature: Eliminar una asignatura

  Como estudiante
  Quiero eliminar una asignatura que ya no cursaré
  Para que mi lista solo tenga materias vigentes

  Background:
    Given Alicia tiene una cuenta
    And Alicia tiene la asignatura "Matemáticas" del profesor "Marcello"
    And Alicia tiene la asignatura "Ciencias" del profesor "Marco"
    And Alicia inicio sesion en la aplicacion
    And Alicia abre la lista de asignaturas

  @smoke
  Scenario: Eliminar una asignatura aceptando la confirmación
    When ella elimina la asignatura "Matemáticas" y acepta la confirmación
    Then ella ve que el navegador pidió confirmar con el mensaje "Delete subject?"
    And ella no ve la asignatura "Matemáticas"
    And ella ve la asignatura "Ciencias" del profesor "Marco"

  Scenario: Cancelar la confirmación conserva la asignatura
    When ella intenta eliminar la asignatura "Matemáticas" y cancela la confirmación
    Then ella ve que el navegador pidió confirmar con el mensaje "Delete subject?"
    And ella ve la asignatura "Matemáticas" del profesor "Marcello"
    And ella ve exactamente 2 asignaturas
