@web @F03
Feature: Cerrar sesión

  Como estudiante con la sesión iniciada
  Quiero cerrar mi sesión
  Para que nadie más use mi cuenta desde este navegador

  Background:
    Given Ana usa la aplicación con un servidor simulado
    And Ana tiene una sesión iniciada
    And el servidor devuelve el perfil de "Ana" con correo "ana@test.com"
    And ella abre la ruta "/schedule"

  @smoke
  Scenario: Cerrar sesión borra la sesión y vuelve al inicio de sesión
    Given la sesión guardada es "jwt-ana"
    When ella cierra sesión
    Then ella llega a la ruta "/login"
    And no hay ninguna sesión guardada

  Scenario: Después de cerrar sesión una ruta protegida la devuelve al inicio de sesión
    When ella cierra sesión
    And ella llega a la ruta "/login"
    And ella abre la ruta "/subjects"
    Then ella llega a la ruta "/login"