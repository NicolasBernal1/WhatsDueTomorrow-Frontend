Característica: Cambiar contraseña

  Como estudiante con la sesión iniciada
  Quiero cambiar mi contraseña verificando primero la actual
  Para mantener mi cuenta segura

  Antecedentes:
    Dado Alicia tiene una cuenta
    Y Alicia inició sesión en la aplicación

  @smoke
  Escenario: Verificar la contraseña actual habilita la nueva contraseña
    Cuando ella verifica su contraseña actual
    Entonces ella ve el mensaje "Current password verified" en el menú de perfil

  Escenario: Una contraseña actual incorrecta no permite continuar
    Cuando ella verifica la contraseña "mala"
    Entonces ella ve el mensaje "Incorrect password" en el menú de perfil
    Y ella no puede escribir una nueva contraseña

  Escenario: El botón de verificar está bloqueado con el campo vacío
    Cuando ella abre el menú de perfil
    Entonces ella ve el botón "Verify Password" bloqueado

  @smoke
  Escenario: Cambio exitoso cierra la sesión y solo vale la nueva contraseña
    Cuando ella cambia su contraseña por "Nueva456"
    Entonces ella llega a la ruta "/login"
    Y no hay ninguna sesión guardada
    Y ella ve el aviso "Password changed successfully."
    Y el backend acepta su contraseña "Nueva456"
    Y el backend rechaza su contraseña "Clave123"

  Escenario: Si el servidor rechaza el cambio la sesión sigue iniciada
    Dado el servidor rechaza el cambio de contraseña con el código 400
    Cuando ella cambia su contraseña por "Nueva456"
    Entonces ella sigue en la ruta "/schedule"
    Y ella tiene una sesión guardada
    Y el backend acepta su contraseña "Clave123"

  Escenario: Cambiar contraseña está bloqueado hasta escribir la nueva
    Cuando ella verifica su contraseña actual
    Entonces ella ve el botón "Change Password" bloqueado
    Cuando ella escribe la nueva contraseña "Nueva456"
    Entonces ella ve el botón "Change Password" habilitado