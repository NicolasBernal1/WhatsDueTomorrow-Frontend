@katalon @subjects @F09
Feature: Rechazar un registro de asignatura inválido (Katalon: "Registro de materia fallido")

  Como estudiante
  Quiero que el formulario me avise de los datos inválidos
  Para no registrar asignaturas incorrectas

  Background:
    Given el estudiante inició sesión en "https://whats-due-tomorrow-frontend.vercel.app"
    And el estudiante está en la lista de asignaturas

  Scenario: Datos numéricos y créditos fuera de rango
    When el estudiante abre el formulario "Add New Subject"
    And escribe el nombre "431251351", el profesor "14515" y 33145135 créditos
    Then ve el error "Name must contain at least one letter"
    And ve el error "Professor must contain at least one letter"
    And ve el error "Los créditos deben ser un entero entre 1 y 12"
    And el botón "Save" está deshabilitado

  Scenario: Cancelar el formulario inválido no crea la asignatura
    Given el estudiante escribió datos inválidos en el formulario
    When pulsa "Cancel"
    Then el formulario se cierra
    And no aparece ninguna asignatura nueva
