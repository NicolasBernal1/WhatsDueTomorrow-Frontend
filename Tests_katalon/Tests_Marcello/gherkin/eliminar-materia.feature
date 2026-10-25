@katalon @subjects @F11
Feature: Eliminar una asignatura (Katalon: "Eliminar Materia")

  Como estudiante
  Quiero eliminar una asignatura que ya no cursaré
  Para que mi lista solo tenga materias vigentes

  Background:
    Given el estudiante inició sesión en "https://whats-due-tomorrow-frontend.vercel.app"
    And existe la asignatura "Matematicas" del profesor "Marcello"
    And el estudiante está en la lista de asignaturas

  Scenario: Eliminar aceptando la confirmación
    When hace clic derecho en la tarjeta de "Matematicas" y elige "Delete"
    Then el navegador pide confirmar con el mensaje "Delete subject?"
    When acepta la confirmación
    Then la lista no muestra la asignatura "Matematicas"
