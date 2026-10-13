@web @F06
Feature: Notificaciones de tareas próximas a vencer (48 horas)

  Como estudiante con la sesión iniciada
  Quiero ver en la campana las tareas que vencen en las próximas 48 horas
  Para no olvidar entregarlas a tiempo

  Background:
    Given Ana usa la aplicación con un servidor simulado
    And Ana tiene una sesión iniciada

  @smoke
  Scenario: La campana muestra cuántas tareas vencen pronto
    Given el servidor tiene estas tareas próximas a vencer:
      | titulo             | materia | horas |
      | Taller de Cálculo  | Cálculo | 5     |
      | Quiz de Física     | Física  | 30    |
    When ella abre la ruta "/schedule"
    Then ella ve 2 en la insignia de la campana
    And el servidor recibió 1 peticiones GET a "/assignments/upcoming"

  Scenario: Al abrir la campana veo el título y la materia de cada tarea
    Given el servidor tiene estas tareas próximas a vencer:
      | titulo             | materia | horas |
      | Taller de Cálculo  | Cálculo | 5     |
      | Quiz de Física     | Física  | 30    |
    When ella abre la ruta "/schedule"
    And ella abre la campana de notificaciones
    Then ella ve 2 tareas próximas en la lista
    And ella ve la tarea 1 con título "Taller de Cálculo" y materia "Cálculo"
    And ella ve la tarea 2 con título "Quiz de Física" y materia "Física"

  Scenario: Sin tareas próximas no hay insignia y se muestra el mensaje vacío
    Given el servidor no tiene tareas próximas a vencer
    When ella abre la ruta "/schedule"
    And ella abre la campana de notificaciones
    Then ella ve el mensaje de que no hay tareas próximas
    And ella no ve insignia en la campana

  Scenario: Si el servidor falla la aplicación sigue usable y la campana queda vacía
    Given el servidor falla al listar las tareas próximas
    When ella abre la ruta "/schedule"
    And ella abre la campana de notificaciones
    Then ella ve el mensaje de que no hay tareas próximas
    And ella sigue en la ruta "/schedule"
    And ella no ve insignia en la campana