Característica: Iniciar sesión

  Como estudiante registrado
  Quiero iniciar sesión con mi correo y contraseña
  Para acceder a mi horario y mis tareas

  Antecedentes:
    Dado Alicia tiene una cuenta

  @smoke
  Escenario: Iniciar sesión con su correo y contraseña
    Cuando ella inicia sesión en la aplicación
    Entonces ella llega a la ruta "/schedule"
    Y ella tiene una sesión guardada

  Escenario: Iniciar sesión con una contraseña incorrecta
    Cuando ella intenta iniciar sesión con la contraseña "mala"
    Entonces ella ve la alerta "Invalid Credentials"
    Y ella sigue en la ruta "/login"
    Y no hay ninguna sesión guardada

  Escenario: Iniciar sesión con un usuario que no existe
    Cuando ella intenta iniciar sesión con el correo "nadie.e2e@test.com" y la contraseña "Clave123"
    Entonces ella ve la alerta "Invalid Credentials"
    Y no hay ninguna sesión guardada

  Escenario: El formulario vacío no permite enviar
    Cuando ella abre la ruta "/login"
    Y ella sale del campo correo
    Entonces ella ve el error de validación "Email is required"
    Y el botón de envío del formulario está bloqueado

  Escenario: Un correo mal formado muestra el error de validación
    Cuando ella abre la ruta "/login"
    Y ella escribe "no-es-email" en el campo correo
    Y ella sale del campo correo
    Entonces ella ve el error de validación "Email must be a valid email address"

  Escenario: Ir al registro desde el inicio de sesión
    Cuando ella abre la ruta "/login"
    Y ella pulsa el enlace para ir al registro
    Entonces ella llega a la ruta "/register"