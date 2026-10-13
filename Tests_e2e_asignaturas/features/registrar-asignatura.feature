@web @subjects @F09
Feature: Registrar una asignatura

  Como estudiante
  Quiero registrar una nueva asignatura
  Para organizar mis clases y evaluaciones

  Background:
    Given Alicia tiene una cuenta
    And Alicia inicio sesion en la aplicacion
    And Alicia abre la lista de asignaturas

  @smoke
  Scenario: Registro exitoso con datos válidos
    When ella registra la asignatura "Ciencias" del profesor "Marco" con 4 créditos
    Then ella ve la asignatura "Ciencias" del profesor "Marco"
    And ella ve la asignatura "Ciencias" con 4 créditos
    And ella ve que el formulario de asignatura se cierra

  Scenario Outline: El formulario rechaza datos inválidos
    When ella intenta registrar la asignatura "<nombre>" del profesor "<profesor>" con <créditos> créditos
    Then ella ve el error "<mensaje>"
    And ella no puede guardar la asignatura

    Examples:
      | nombre   | profesor | créditos | mensaje                                   |
      | 4312513  | Marco    | 3        | Name must contain at least one letter     |
      | Ciencias | 14515    | 3        | Professor must contain at least one letter |
      | Ciencias | Marco    | 0        | Los créditos deben ser un entero entre 1 y 12 |
      | Ciencias | Marco    | 13       | Los créditos deben ser un entero entre 1 y 12 |

  Scenario: Cancelar el formulario no crea la asignatura
    When ella abre el formulario de nueva asignatura
    And ella cancela el formulario
    Then ella ve que el formulario de asignatura se cierra
    And ella ve el mensaje "You have no subjects yet"
