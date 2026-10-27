Característica: Cerrar sesión

  Como estudiante con la sesión iniciada
  Quiero cerrar mi sesión
  Para que nadie más use mi cuenta desde este navegador

  Antecedentes:
    Dado Alicia tiene una cuenta
    Y Alicia inició sesión en la aplicación

  @smoke
  Escenario: Cerrar sesión borra la sesión y vuelve al inicio de sesión
    Cuando ella cierra sesión
    Entonces ella llega a la ruta "/login"
    Y no hay ninguna sesión guardada

  Escenario: Después de cerrar sesión una ruta protegida la devuelve al inicio de sesión
    Cuando ella cierra sesión
    Y ella abre la ruta "/subjects"
    Entonces ella llega a la ruta "/login"