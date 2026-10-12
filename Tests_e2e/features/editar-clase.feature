@web @F14
Feature: Editar clase

  Como estudiante
  Quiero cambiar el dia o la hora de una clase
  Para mantener mi horario al dia

  Background:
    Given Alicia tiene una cuenta
    And Alicia tiene la asignatura "Cálculo" del profesor "Gómez"
    And Alicia tiene una clase de "Cálculo" el lunes de 08:00 a 09:00
    And Alicia inicio sesion en la aplicacion

  @smoke
  Scenario: Cambiar el horario de una clase y ver el cambio en el horario
    When ella edita la clase de "Cálculo" para el jueves de 14:00 a 15:00
    And ella consulta su horario
    Then ella observa 1 clase en el horario
    And ella observa en el horario la clase de "Cálculo" de 14:00 a 15:00

  Scenario: No permitir editar una clase para que termine antes de empezar
    When ella edita la clase de "Cálculo" para el jueves de 15:00 a 14:00
    Then ella observa el error "End time must be greater than start time." en el formulario
    When ella cancela el formulario de clase
    And ella consulta su horario
    Then ella observa en el horario la clase de "Cálculo" de 08:00 a 09:00
