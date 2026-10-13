@web @F02
Feature: Iniciar sesión

  Como estudiante registrado
  Quiero iniciar sesión con mi correo y contraseña
  Para acceder a mi horario y mis tareas

  Background:
    Given Ana usa la aplicación con un servidor simulado

  @smoke
  Scenario: Iniciar sesión con credenciales válidas
    Given el servidor acepta las credenciales
    When ella inicia sesión con correo "ana@test.com" y contraseña "Clave123"
    Then ella llega a la ruta "/schedule"
    And la sesión guardada es "jwt-ana"
    And el servidor recibió en POST "/auth/login" el cuerpo "{\"email\":\"ana@test.com\",\"password\":\"Clave123\"}"

  Scenario: Iniciar sesión con una contraseña incorrecta
    Given el servidor rechaza las credenciales con el código 401
    When ella inicia sesión con correo "ana@test.com" y contraseña "mala"
    Then ella ve la alerta "Invalid Credentials"
    And ella sigue en la ruta "/login"
    And no hay ninguna sesión guardada

  Scenario: Iniciar sesión con un usuario que no existe
    Given el servidor rechaza las credenciales con el código 404
    When ella inicia sesión con correo "nadie@test.com" y contraseña "Clave123"
    Then ella ve la alerta "Invalid Credentials"
    And no hay ninguna sesión guardada

  Scenario: El formulario vacío no permite enviar
    When ella abre la ruta "/login"
    And ella sale del campo correo
    Then ella ve el error de validación "Email is required"
    And el botón de envío del formulario está bloqueado
    And el servidor recibió 0 peticiones POST a "/auth/login"

  Scenario: Un correo mal formado muestra el error de validación
    When ella abre la ruta "/login"
    And ella escribe "no-es-email" en el campo correo
    And ella sale del campo correo
    Then ella ve el error de validación "Email must be a valid email address"

  Scenario: Ir al registro desde el inicio de sesión
    When ella abre la ruta "/login"
    And ella pulsa el enlace para ir al registro
    Then ella llega a la ruta "/register"