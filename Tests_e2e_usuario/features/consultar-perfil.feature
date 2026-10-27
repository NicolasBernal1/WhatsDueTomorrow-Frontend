Característica: Consultar perfil

  Como estudiante con la sesión iniciada
  Quiero ver mi nombre y mi correo
  Para confirmar con qué cuenta estoy trabajando

  Antecedentes:
    Dado Alicia tiene una cuenta

  @smoke
  Escenario: Ver mi nombre y mi correo en el menú de perfil
    Dado Alicia inició sesión en la aplicación
    Cuando ella abre el menú de perfil
    Entonces ella ve en el perfil su nombre y su correo

  Escenario: El servidor falla al cargar el perfil
    Dado Alicia inició sesión en la aplicación
    Y el servidor falla al devolver el perfil
    Cuando ella abre el menú de perfil
    Entonces ella ve el aviso "Could not load your profile"
    Y ella no ve los datos del perfil

  Escenario: Sin sesión no se puede llegar al perfil
    Cuando ella abre la ruta "/schedule"
    Entonces ella llega a la ruta "/login"