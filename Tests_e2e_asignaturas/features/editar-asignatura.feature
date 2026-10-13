@web @subjects @F10
Feature: Editar una asignatura

  Como estudiante
  Quiero corregir los datos de una asignatura
  Para mantener mi información al día

  Background:
    Given Alicia tiene una cuenta
    And Alicia tiene la asignatura "Ciencias" del profesor "Marco"
    And Alicia inicio sesion en la aplicacion
    And Alicia abre la lista de asignaturas

  @smoke
  Scenario: Editar el nombre y el profesor
    When ella cambia la asignatura "Ciencias" a nombre "Maths" y profesor "Sebastian"
    Then ella ve la asignatura "Maths" del profesor "Sebastian"
    And ella no ve la asignatura "Ciencias"
    And ella ve exactamente 1 asignaturas

  Scenario: El formulario de edición abre con los datos actuales
    When ella abre el formulario de edición de "Ciencias"
    Then ella ve en el formulario el nombre "Ciencias" y el profesor "Marco"

  Scenario: Cancelar la edición no guarda los cambios
    When ella abre el formulario de edición de "Ciencias"
    And ella cancela la edición después de cambiar el nombre a "Otro nombre"
    Then ella ve la asignatura "Ciencias" del profesor "Marco"
    And ella no ve la asignatura "Otro nombre"
