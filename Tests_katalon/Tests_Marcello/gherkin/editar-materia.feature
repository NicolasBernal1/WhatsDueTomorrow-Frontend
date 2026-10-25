@katalon @subjects @F10
Feature: Editar una asignatura (Katalon: "Editar Materia")

  Como estudiante
  Quiero corregir los datos de una asignatura
  Para mantener mi información al día

  Background:
    Given el estudiante inició sesión en "https://whats-due-tomorrow-frontend.vercel.app"
    And existe la asignatura "Ciencias" del profesor "Marco"
    And el estudiante está en la lista de asignaturas

  Scenario: Cambiar nombre y profesor
    When hace clic derecho en la tarjeta de "Ciencias" y elige "Edit"
    Then el formulario muestra el nombre "Ciencias" y el profesor "Marco"
    When cambia el nombre a "Maths" y el profesor a "Sebastian"
    And pulsa "Update"
    Then la lista muestra la asignatura "Maths" del profesor "Sebastian"
    And la lista no muestra la asignatura "Ciencias"
