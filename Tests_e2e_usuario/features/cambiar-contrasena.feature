@web @F05
Feature: Cambiar contraseña

  Como estudiante con la sesión iniciada
  Quiero cambiar mi contraseña verificando primero la actual
  Para mantener mi cuenta segura

  Background:
    Given Ana usa la aplicación con un servidor simulado
    And Ana tiene una sesión iniciada
    And el servidor devuelve el perfil de "Ana" con correo "ana@test.com"
    And ella abre la ruta "/schedule"

  @smoke
  Scenario: Verificar la contraseña actual habilita la nueva contraseña
    Given el servidor confirma la contraseña actual
    When ella verifica su contraseña actual "Clave123"
    Then ella ve el mensaje "Current password verified" en el menú de perfil
    And el servidor recibió en PATCH "/auth/verify-password" el cuerpo "{\"password\":\"Clave123\"}"

  Scenario: Una contraseña actual incorrecta no permite continuar
    Given el servidor rechaza la contraseña actual
    When ella verifica su contraseña actual "mala"
    Then ella ve el mensaje "Incorrect password" en el menú de perfil
    And ella no puede escribir una nueva contraseña

  Scenario: El botón de verificar está bloqueado con el campo vacío
    When ella abre el menú de perfil
    Then ella ve el botón "Verify Password" bloqueado

  @smoke
  Scenario: Cambio exitoso cierra la sesión y vuelve al inicio de sesión
    Given el servidor confirma la contraseña actual
    And el servidor acepta el cambio de contraseña
    When ella cambia su contraseña de "Clave123" a "Nueva456"
    Then ella llega a la ruta "/login"
    And no hay ninguna sesión guardada
    And ella ve el aviso "Password changed successfully."
    And el servidor recibió en PATCH "/auth/change-password" el cuerpo "{\"currentPassword\":\"Clave123\",\"newPassword\":\"Nueva456\"}"

  Scenario: Si el servidor rechaza el cambio la sesión sigue iniciada
    Given el servidor confirma la contraseña actual
    And el servidor rechaza el cambio de contraseña con el código 400
    When ella cambia su contraseña de "Clave123" a "Nueva456"
    Then ella sigue en la ruta "/schedule"
    And la sesión guardada es "jwt-ana"

  Scenario: Cambiar contraseña está bloqueado hasta escribir la nueva
    Given el servidor confirma la contraseña actual
    When ella verifica su contraseña actual "Clave123"
    Then ella ve el botón "Change Password" bloqueado
    When ella escribe la nueva contraseña "Nueva456"
    Then ella ve el botón "Change Password" habilitado