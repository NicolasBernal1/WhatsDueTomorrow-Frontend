Característica: Registrar estudiante

  Como visitante de la aplicación
  Quiero crear mi cuenta con nombre, correo y contraseña
  Para empezar a organizar mi horario y mis tareas

  @smoke
  Escenario: Registrarse con datos válidos
    Dado Alicia es una visitante de la aplicación
    Cuando ella se registra con una cuenta nueva
    Entonces ella llega a la ruta "/schedule"
    Y ella tiene una sesión guardada
    Y el backend acepta su contraseña "Clave123"

  Escenario: Registrarse con un correo que ya existe
    Dado Alicia tiene una cuenta
    Cuando ella intenta registrarse otra vez con su correo
    Entonces ella ve la alerta "This email is already in use"
    Y ella sigue en la ruta "/register"
    Y no hay ninguna sesión guardada

  Escenario: El servidor rechaza un nombre con números
    Dado Alicia es una visitante de la aplicación
    Cuando ella intenta registrarse con nombre "Ana123", correo "ana123.e2e@test.com" y contraseña "Clave123"
    Entonces ella ve la alerta "Invalid data"
    Y ella sigue en la ruta "/register"
    Y no hay ninguna sesión guardada

  Escenario: El formulario vacío no permite enviar
    Dado Alicia es una visitante de la aplicación
    Cuando ella abre la ruta "/register"
    Y ella sale del campo nombre
    Entonces ella ve el error de validación "Name is required"
    Y el botón de envío del formulario está bloqueado

  Escenario: Un nombre sin letras muestra el error de validación
    Dado Alicia es una visitante de la aplicación
    Cuando ella abre la ruta "/register"
    Y ella escribe "12345" en el campo nombre
    Y ella sale del campo nombre
    Entonces ella ve el error de validación "Name must contain at least one letter"
    Y el botón de envío del formulario está bloqueado

  Escenario: Un correo mal formado muestra el error de validación
    Dado Alicia es una visitante de la aplicación
    Cuando ella abre la ruta "/register"
    Y ella escribe "no-es-email" en el campo correo
    Y ella sale del campo correo
    Entonces ella ve el error de validación "Email must be a valid email address"