@web @F13
Feature: Agregar clase

  Como estudiante
  Quiero agregar una clase a una asignatura
  Para que aparezca en mi horario

  Background:
    Given Alicia tiene una cuenta
    And Alicia tiene la asignatura "Cálculo" del profesor "Gómez"
    And Alicia inicio sesion en la aplicacion

  @smoke
  Scenario: Agregar una clase valida y verla en el horario
    When ella agrega a la asignatura "Cálculo" una clase el martes de 14:00 a 15:00
    And ella consulta su horario
    Then ella observa 1 clase en el horario
    And ella observa en el horario la clase de "Cálculo" de 14:00 a 15:00

  Scenario: No permitir una clase que termina antes de empezar
    When ella agrega a la asignatura "Cálculo" una clase el martes de 15:00 a 14:00
    Then ella observa el error "End time must be greater than start time." en el formulario
    When ella cancela el formulario de clase
    And ella consulta su horario
    Then ella observa 0 clases en el horario

  Scenario: No permitir una clase que se cruza con otra del mismo dia
    Given Alicia tiene una clase de "Cálculo" el lunes de 09:00 a 10:00
    When ella agrega a la asignatura "Cálculo" una clase el lunes de 08:00 a 10:00
    Then ella observa el error "This class overlaps with another class in your schedule." en el formulario
    When ella cancela el formulario de clase
    And ella consulta su horario
    Then ella observa 1 clase en el horario
    And ella observa en el horario la clase de "Cálculo" de 09:00 a 10:00
