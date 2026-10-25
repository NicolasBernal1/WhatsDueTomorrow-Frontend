@katalon @subjects @F09
Feature: Registrar una asignatura (Katalon: "Registro Materia")

  Como estudiante
  Quiero registrar una nueva asignatura
  Para verla en mi lista de asignaturas

  Background:
    Given el estudiante inició sesión en "https://whats-due-tomorrow-frontend.vercel.app"
    And el estudiante está en la lista de asignaturas

  Scenario: Registro exitoso con datos válidos
    When el estudiante abre el formulario "Add New Subject"
    And escribe el nombre "Ciencias", el profesor "Marco" y 4 créditos
    And pulsa "Save"
    Then el formulario se cierra
    And la lista muestra la asignatura "Ciencias" del profesor "Marco"
    And la tarjeta de "Ciencias" muestra "4 cr."
