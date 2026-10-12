@web @F08
Feature: Acceder a los detalles de una asignatura desde el horario

  Como estudiante
  Quiero abrir los detalles de una asignatura desde su clase en el horario
  Para consultar su informacion sin buscarla aparte

  Background:
    Given Alicia tiene una cuenta
    And Alicia tiene la asignatura "Cálculo" del profesor "Gómez"
    And Alicia tiene la asignatura "Física" del profesor "Pérez"
    And Alicia tiene una clase de "Cálculo" el lunes de 08:00 a 09:00
    And Alicia tiene una clase de "Física" el martes de 10:00 a 11:00
    And Alicia inicio sesion en la aplicacion

  @smoke
  Scenario: Hacer clic en una clase lleva a los detalles de su asignatura
    When ella hace clic en la clase de "Cálculo" del horario
    Then ella llega a los detalles de la asignatura "Cálculo" del profesor "Gómez"

  Scenario: Cada clase lleva a los detalles de su propia asignatura
    When ella hace clic en la clase de "Física" del horario
    Then ella llega a los detalles de la asignatura "Física" del profesor "Pérez"
