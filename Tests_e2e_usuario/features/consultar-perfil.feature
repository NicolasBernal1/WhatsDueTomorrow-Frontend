@web @F04
Feature: Consultar perfil

  Como estudiante con la sesión iniciada
  Quiero ver mi nombre y mi correo
  Para confirmar con qué cuenta estoy trabajando

  Background:
    Given Ana usa la aplicación con un servidor simulado

  @smoke
  Scenario: Ver mi nombre y mi correo en el menú de perfil
    Given Ana tiene una sesión iniciada
    And el servidor devuelve el perfil de "Ana Pérez" con correo "ana@test.com"
    When ella abre la ruta "/schedule"
    And ella abre el menú de perfil
    Then ella ve en el perfil el nombre "Ana Pérez" y el correo "ana@test.com"
    And el servidor recibió 1 peticiones GET a "/users/profile"

  Scenario: El servidor falla al cargar el perfil
    Given Ana tiene una sesión iniciada
    And el servidor falla al devolver el perfil
    When ella abre la ruta "/schedule"
    And ella abre el menú de perfil
    Then ella ve el aviso "Could not load your profile"
    And ella no ve los datos del perfil

  Scenario: Sin sesión no se puede llegar al perfil
    When ella abre la ruta "/schedule"
    Then ella llega a la ruta "/login"
    And el servidor recibió 0 peticiones GET a "/users/profile"