@katalon @subjects @F07 @F08
Feature: Ver el detalle de una asignatura (Katalon: "Ver detalle de materias")

  Como estudiante
  Quiero abrir una asignatura de la lista
  Para consultar su información

  Background:
    Given el estudiante inició sesión en "https://whats-due-tomorrow-frontend.vercel.app"
    And existe la asignatura "Ciencias" del profesor "Marco"
    And el estudiante está en la lista de asignaturas

  Scenario: Abrir el detalle desde la lista
    When hace clic en la tarjeta de "Ciencias"
    Then la dirección corresponde al detalle de una asignatura ("/subjects/{id}")
    And el título muestra "Ciencias"
    And el subtítulo muestra "Marco"
