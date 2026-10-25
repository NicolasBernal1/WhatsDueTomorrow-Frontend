@katalon @subjects @busqueda
Feature: Buscar una asignatura existente (Katalon: "Busqueda de materia Valida")

  Como estudiante
  Quiero buscar una asignatura por nombre o profesor
  Para encontrarla rápido

  Background:
    Given el estudiante inició sesión en "https://whats-due-tomorrow-frontend.vercel.app"
    And existe la asignatura "Ciencias" del profesor "Marco"
    And el estudiante está en la lista de asignaturas

  Scenario: Buscar por nombre
    When escribe "Ciencias" en el buscador
    Then la lista muestra la asignatura "Ciencias" del profesor "Marco"
