@web @subjects @F07
Feature: Listar mis asignaturas

  Como estudiante
  Quiero ver la lista de mis asignaturas
  Para saber qué materias tengo inscritas y con qué profesor

  Background:
    Given Alicia tiene una cuenta

  @smoke
  Scenario: La lista muestra todas sus asignaturas con su profesor
    Given Alicia tiene la asignatura "Cálculo" del profesor "Gómez"
    And Alicia tiene la asignatura "Física" del profesor "Pérez"
    And Alicia inicio sesion en la aplicacion
    When ella abre la lista de asignaturas
    Then ella ve la asignatura "Cálculo" del profesor "Gómez"
    And ella ve la asignatura "Física" del profesor "Pérez"
    And ella ve exactamente 2 asignaturas

  Scenario: Cada asignatura muestra sus créditos
    Given Alicia tiene la asignatura "Cálculo" del profesor "Gómez"
    And Alicia inicio sesion en la aplicacion
    When ella abre la lista de asignaturas
    Then ella ve la asignatura "Cálculo" con 3 créditos

  Scenario: Sin asignaturas la lista muestra un mensaje de vacío
    Given Alicia inicio sesion en la aplicacion
    When ella abre la lista de asignaturas
    Then ella ve el mensaje "You have no subjects yet"
