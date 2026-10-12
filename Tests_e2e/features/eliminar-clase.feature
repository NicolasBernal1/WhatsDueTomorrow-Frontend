@web @F15
Feature: Eliminar clase

  Como estudiante
  Quiero eliminar una clase de mi horario
  Para que deje de aparecer cuando ya no la tengo

  Background:
    Given Alicia tiene una cuenta
    And Alicia tiene la asignatura "Cálculo" del profesor "Gómez"
    And Alicia tiene una clase de "Cálculo" el lunes de 08:00 a 09:00
    And Alicia inicio sesion en la aplicacion

  @smoke
  Scenario: Eliminar una clase y que desaparezca del horario sin recargar la pagina
    When ella elimina la clase de "Cálculo" y confirma
    Then ella observa 0 clases en el horario

  Scenario: La clase eliminada no vuelve a aparecer al recargar el horario
    When ella elimina la clase de "Cálculo" y confirma
    And ella consulta su horario
    Then ella observa 0 clases en el horario

  Scenario: Cancelar la confirmacion conserva la clase
    When ella intenta eliminar la clase de "Cálculo" pero cancela la confirmacion
    And ella consulta su horario
    Then ella observa 1 clase en el horario
    And ella observa en el horario la clase de "Cálculo" de 08:00 a 09:00
