@web @F12
Feature: Consultar horario de clases

  Como estudiante
  Quiero ver mi horario semanal
  Para saber que clases tengo y a que hora

  Background:
    Given Alicia tiene una cuenta
    And Alicia tiene la asignatura "Cálculo" del profesor "Gómez"

  @smoke
  Scenario: Ver en el horario las clases que tengo registradas
    Given Alicia tiene una clase de "Cálculo" el lunes de 08:00 a 09:00
    And Alicia tiene una clase de "Cálculo" el miércoles de 10:00 a 11:00
    When ella inicia sesion en la aplicacion
    Then ella observa los siete dias de la semana en el horario
    And ella observa 2 clases en el horario
    And ella observa en el horario la clase de "Cálculo" de 08:00 a 09:00
    And ella observa en el horario la clase de "Cálculo" de 10:00 a 11:00

  Scenario: Ver el horario vacio cuando no tengo clases
    When ella inicia sesion en la aplicacion
    Then ella observa los siete dias de la semana en el horario
    And ella observa 0 clases en el horario

  Scenario: No ver las clases de otro estudiante
    Given Alicia tiene una clase de "Cálculo" el lunes de 08:00 a 09:00
    And Bruno tiene una cuenta
    When Bruno inicia sesion en la aplicacion
    Then el observa 0 clases en el horario
    And el no observa ninguna clase de "Cálculo" en el horario
