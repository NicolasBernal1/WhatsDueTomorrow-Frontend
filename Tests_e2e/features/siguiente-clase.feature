@web @F16
Feature: Ver siguiente clase

  Como estudiante
  Quiero ver cual es mi proxima clase
  Para saber que me toca despues sin revisar todo el horario

  Background:
    Given Alicia tiene una cuenta
    And Alicia tiene la asignatura "Cálculo" del profesor "Gómez"
    And Alicia tiene la asignatura "Física" del profesor "Pérez"

  @smoke
  Scenario: Ver la clase mas cercana en el tiempo
    Given Alicia tiene una clase de "Física" pasado mañana de 08:00 a 09:00
    And Alicia tiene una clase de "Cálculo" mañana de 10:00 a 11:00
    When ella inicia sesion en la aplicacion
    Then ella observa que su proxima clase es "Cálculo" mañana de 10:00 a 11:00
    And ella observa que la proxima clase es del profesor "Gómez"

  Scenario: Avisar cuando no hay clases programadas
    When ella inicia sesion en la aplicacion
    Then ella observa el aviso de proxima clase "You do not have more classes."

  Scenario: Ir a los detalles de la asignatura desde la proxima clase
    Given Alicia tiene una clase de "Cálculo" mañana de 10:00 a 11:00
    And Alicia inicio sesion en la aplicacion
    When ella hace clic en Ver detalles de su proxima clase
    Then ella llega a los detalles de la asignatura "Cálculo" del profesor "Gómez"
