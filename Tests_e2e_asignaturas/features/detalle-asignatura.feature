@web @subjects @F08
Feature: Acceder al detalle de una asignatura desde la lista

  Como estudiante
  Quiero abrir una asignatura de la lista
  Para consultar su información, clases y evaluaciones

  Background:
    Given Alicia tiene una cuenta
    And Alicia tiene la asignatura "Cálculo" del profesor "Gómez"
    And Alicia tiene la asignatura "Física" del profesor "Pérez"
    And Alicia inicio sesion en la aplicacion
    And Alicia abre la lista de asignaturas

  @smoke
  Scenario: Al hacer clic en una asignatura se abre su detalle
    When ella abre la asignatura "Cálculo"
    Then ella llega a los detalles de la asignatura "Cálculo" del profesor "Gómez"

  Scenario: Cada asignatura abre su propio detalle
    When ella abre la asignatura "Física"
    Then ella llega a los detalles de la asignatura "Física" del profesor "Pérez"
