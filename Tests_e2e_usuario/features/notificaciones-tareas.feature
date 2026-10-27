Característica: Notificaciones de tareas próximas a vencer (48 horas)

  Como estudiante con la sesión iniciada
  Quiero ver en la campana las tareas que vencen en las próximas 48 horas
  Para no olvidar entregarlas a tiempo

  Antecedentes:
    Dado Alicia tiene una cuenta
    Y Alicia tiene la asignatura "Cálculo"

  @smoke
  Escenario: La campana muestra cuántas tareas vencen en las próximas 48 horas
    Dado Alicia tiene la tarea "Taller de Cálculo" de "Cálculo" que vence en 5 horas
    Y Alicia tiene la tarea "Parcial" de "Cálculo" que vence en 30 horas
    Y Alicia tiene la tarea "Proyecto final" de "Cálculo" que vence en 72 horas
    Cuando ella inicia sesión en la aplicación
    Entonces ella ve 2 en la insignia de la campana

  Escenario: Al abrir la campana veo el título y la materia de cada tarea
    Dado Alicia tiene la tarea "Taller de Cálculo" de "Cálculo" que vence en 5 horas
    Y Alicia tiene la tarea "Parcial" de "Cálculo" que vence en 30 horas
    Cuando ella inicia sesión en la aplicación
    Y ella abre la campana de notificaciones
    Entonces ella ve 2 tareas próximas en la lista
    Y ella ve la tarea 1 con título "Taller de Cálculo" y materia "Cálculo"
    Y ella ve la tarea 2 con título "Parcial" y materia "Cálculo"

  Escenario: Las tareas vencidas o que vencen después de 48 horas no aparecen
    Dado Alicia tiene la tarea "Ya vencida" de "Cálculo" que vence en -2 horas
    Y Alicia tiene la tarea "Muy lejana" de "Cálculo" que vence en 49 horas
    Cuando ella inicia sesión en la aplicación
    Y ella abre la campana de notificaciones
    Entonces ella ve el mensaje de que no hay tareas próximas
    Y ella no ve insignia en la campana

  Escenario: Si el servidor falla la aplicación sigue usable y la campana queda vacía
    Dado el servidor falla al listar las tareas próximas
    Cuando ella inicia sesión en la aplicación
    Y ella abre la campana de notificaciones
    Entonces ella ve el mensaje de que no hay tareas próximas
    Y ella sigue en la ruta "/schedule"
    Y ella no ve insignia en la campana