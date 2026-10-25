@katalon @subjects @busqueda
Feature: Buscar una asignatura que no existe (Katalon: "Busqueda de materia Fallida")

  Como estudiante
  Quiero recibir un aviso cuando mi búsqueda no encuentra nada
  Para saber que no hay coincidencias

  Background:
    Given el estudiante inició sesión en "https://whats-due-tomorrow-frontend.vercel.app"
    And el estudiante está en la lista de asignaturas

  Scenario: Búsqueda sin resultados
    When escribe "zzzz-no-existe" en el buscador
    Then aparece el mensaje "You have no subjects yet"
    And no se muestra ninguna tarjeta de asignatura
