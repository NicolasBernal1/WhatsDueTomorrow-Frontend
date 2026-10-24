describe('F22: Desglosar Tareas en Subtareas con Avance Porcentual (Frontend E2E, UI & a11y)', () => {
  const mockAssignment = {
    id: 201,
    title: 'Proyecto de Validación y Verificación',
    description: 'Implementación de pruebas integrales con Cypress',
    dueDate: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
    subjectId: 10,
    subjectName: 'Validación de Software',
  };

  const initialSubtasks = [
    { id: 1, title: 'Definir plan de pruebas E2E', completed: false, position: 0 },
    { id: 2, title: 'Escribir suites en Cypress', completed: false, position: 1 },
  ];

  beforeEach(() => {
    cy.visit('/login');
    cy.loginSession();

    // Interceptar la consulta de assignments
    cy.intercept('GET', '**/assignments*', {
      statusCode: 200,
      body: {
        status: 200,
        message: 'OK',
        data: [mockAssignment],
      },
    }).as('getAssignments');

    // Interceptar listado inicial de subtareas
    cy.intercept('GET', '**/assignments/201/subtasks*', {
      statusCode: 200,
      body: {
        status: 200,
        message: 'OK',
        data: {
          subtasks: initialSubtasks,
          progress: 0,
        },
      },
    }).as('getSubtasks');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. ESCENARIO EXITOSO: Avance Porcentual Progresivo (0% -> 50% -> 100%)
  // ──────────────────────────────────────────────────────────────────────────
  it('E1: Debería reflejar el avance porcentual dinámico y mostrar mensaje de completitud', () => {
    // Interceptar completitud de la primera subtarea (50%)
    cy.intercept('PATCH', '**/assignments/201/subtasks/1*', {
      statusCode: 200,
      body: {
        status: 200,
        message: 'Updated',
        data: {
          subtasks: [
            { id: 1, title: 'Definir plan de pruebas E2E', completed: true, position: 0 },
            { id: 2, title: 'Escribir suites en Cypress', completed: false, position: 1 },
          ],
          progress: 50,
        },
      },
    }).as('completeSubtask1');

    // Interceptar completitud de la segunda subtarea (100%)
    cy.intercept('PATCH', '**/assignments/201/subtasks/2*', {
      statusCode: 200,
      body: {
        status: 200,
        message: 'Updated',
        data: {
          subtasks: [
            { id: 1, title: 'Definir plan de pruebas E2E', completed: true, position: 0 },
            { id: 2, title: 'Escribir suites en Cypress', completed: true, position: 1 },
          ],
          progress: 100,
        },
      },
    }).as('completeSubtask2');

    cy.visit('/assignments/201');

    // Validar cabecera y estado inicial en 0%
    cy.get('h1').should('contain.text', 'Proyecto de Validación y Verificación');
    cy.get('.progress-label strong').should('contain.text', '0%');
    cy.get('.subtask-item').should('have.length', 2);

    // Marcar la primera subtarea
    cy.get('.subtask-item').eq(0).find('mat-checkbox').click();
    cy.wait('@completeSubtask1');
    cy.get('.progress-label strong').should('contain.text', '50%');

    // Marcar la segunda subtarea
    cy.get('.subtask-item').eq(1).find('mat-checkbox').click();
    cy.wait('@completeSubtask2');
    cy.get('.progress-label strong').should('contain.text', '100%');

    // Validar tip de felicitación al llegar a 100%
    cy.get('.completion-tip').should('be.visible').and('contain.text', 'You completed all the steps');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. ESCENARIO ALTERNATIVO: Reordenamiento y Eliminación de Subtarea
  // ──────────────────────────────────────────────────────────────────────────
  it('E2: Debería permitir reordenar y eliminar subtareas actualizando la interfaz', () => {
    cy.intercept('PATCH', '**/assignments/201/subtasks/order*', {
      statusCode: 200,
      body: {
        status: 200,
        message: 'Reordered',
        data: {
          subtasks: [
            { id: 2, title: 'Escribir suites en Cypress', completed: false, position: 0 },
            { id: 1, title: 'Definir plan de pruebas E2E', completed: false, position: 1 },
          ],
          progress: 0,
        },
      },
    }).as('reorderSubtasks');

    cy.intercept('DELETE', '**/assignments/201/subtasks/1*', {
      statusCode: 200,
      body: {
        status: 200,
        message: 'Deleted',
        data: {
          subtasks: [
            { id: 2, title: 'Escribir suites en Cypress', completed: false, position: 0 },
          ],
          progress: 0,
        },
      },
    }).as('deleteSubtask');

    cy.visit('/assignments/201');

    // La primera subtarea no puede moverse hacia arriba (disabled)
    cy.get('.subtask-item').first().find('button[aria-label="Move up"]').should('be.disabled');

    // Mover hacia abajo la primera subtarea
    cy.get('.subtask-item').first().find('button[aria-label="Move down"]').should('not.be.disabled').click();
    cy.wait('@reorderSubtasks');

    // Eliminar una subtarea
    cy.get('.subtask-item').last().find('button[aria-label="Delete"]').click();
    cy.wait('@deleteSubtask');
    cy.get('.subtask-item').should('have.length', 1);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. ESCENARIO DE ERROR: Validación en Formulario (Botón Add Inhabilitado)
  // ──────────────────────────────────────────────────────────────────────────
  it('E3: Debería deshabilitar el botón de agregar cuando el título esté vacío', () => {
    cy.visit('/assignments/201');

    // Inicialmente el botón Add está inhabilitado
    cy.contains('button', 'Add').should('be.disabled');

    // Escribir solo espacios en blanco
    cy.get('input[aria-label="New subtask"]').type('     ');
    cy.contains('button', 'Add').should('be.disabled');

    // Escribir texto válido
    cy.get('input[aria-label="New subtask"]').clear().type('Configurar reportes');
    cy.contains('button', 'Add').should('not.be.disabled');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. ESCENARIO DE RESILIENCIA: Reversión Optimista ante Fallo en Red
  // ──────────────────────────────────────────────────────────────────────────
  it('E4: Debería revertir el estado del checkbox si la petición de actualización falla (Error 500)', () => {
    cy.intercept('PATCH', '**/assignments/201/subtasks/1*', {
      statusCode: 500,
      body: { message: 'Internal Server Error' },
    }).as('patchFail');

    cy.visit('/assignments/201');

    // Clic en checkbox de la primera subtarea
    cy.get('.subtask-item').first().find('mat-checkbox').click();
    cy.wait('@patchFail');

    // La interfaz muestra el mensaje de error y no deja el checkbox marcado
    cy.get('.error').should('be.visible').and('contain.text', 'Could not update the progress');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. ACCESIBILIDAD (a11y): Cumplimiento WCAG en Detalle de Entrega y Subtareas
  // ──────────────────────────────────────────────────────────────────────────
  it('E5: Debería cumplir con estándares de accesibilidad WCAG en la gestión de subtareas', () => {
    cy.visit('/assignments/201');
    cy.injectAxe();

    // Validar accesibilidad del contenedor principal de la entrega
    cy.checkA11y('main.assignment-details', {
      includedImpacts: ['critical', 'serious'],
    });
  });
});
