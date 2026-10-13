@web @subjects @busqueda
Feature: Buscar asignaturas

  Como estudiante
  Quiero buscar una asignatura por su nombre
  Para encontrarla rápido cuando tengo muchas

  Background:
    Given Alicia tiene una cuenta
    And Alicia tiene la asignatura "Cálculo" del profesor "Gómez"
    And Alicia tiene la asignatura "Física" del profesor "Pérez"
    And Alicia inicio sesion en la aplicacion
    And Alicia abre la lista de asignaturas

  @smoke
  Scenario: Buscar por nombre muestra solo las coincidencias
    When ella busca "Cálculo"
    Then ella ve la asignatura "Cálculo" del profesor "Gómez"
    And ella no ve la asignatura "Física"

  Scenario: Buscar por profesor muestra solo las coincidencias
    When ella busca "Pérez"
    Then ella ve la asignatura "Física" del profesor "Pérez"
    And ella no ve la asignatura "Cálculo"

  Scenario: Una búsqueda sin resultados muestra el mensaje de vacío
    When ella busca "zzzz-no-existe"
    Then ella ve el mensaje "You have no subjects yet"

  Scenario: Borrar la búsqueda vuelve a mostrar todas las asignaturas
    When ella busca "Cálculo"
    And ella borra el texto de búsqueda
    Then ella ve la asignatura "Cálculo" del profesor "Gómez"
    And ella ve la asignatura "Física" del profesor "Pérez"
    And ella ve exactamente 2 asignaturas
