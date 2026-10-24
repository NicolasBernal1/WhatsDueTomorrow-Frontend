/// <reference types="cypress" />

describe('F24: Bitácora de Apuntes y Recursos Rápidos por Asignatura (Frontend E2E, UI & a11y)', () => {
  const apiUrl = 'https://whatsduetomorrow-backed.onrender.com';

  const mockSubject = {
    id: 1,
    name: 'Cálculo Multivariable y Vectorial',
    professor: 'Dr. Gauss',
    credits: 4,
    color: '#3f51b5',
  };

  const mockNote1 = {
    id: 101,
    title: 'Fórmulas de Gradiente y Rotacional',
    content: 'El gradiente apunta en la dirección de máxima tasa de aumento de una función escalar.',
    linkUrl: 'https://ocw.mit.edu/courses/mathematics/gradient-notes',
    subjectId: 1,
    createdAt: '2026-05-10T14:30:00.000Z',
    updatedAt: '2026-05-10T14:30:00.000Z',
  };

  const mockNote2Updated = {
    ...mockNote1,
    content: 'Actualizado: Incluye el Teorema de Stokes y cálculo de flujo rotacional.',
    updatedAt: '2026-05-11T10:00:00.000Z',
  };

  beforeEach(() => {
    // Autenticar sesión en cliente
    cy.visit('/login');
    cy.loginSession();

    // Interceptar llamadas base de la asignatura apuntando explícitamente a la API de backend
    cy.intercept('GET', `${apiUrl}/subjects/1`, {
      statusCode: 200,
      body: { status: 200, message: 'Success', data: mockSubject },
    }).as('getSubject');

    cy.intercept('GET', `${apiUrl}/assignments/subject/1`, {
      statusCode: 200,
      body: { status: 200, message: 'Success', data: [] },
    }).as('getAssignments');

    cy.intercept('GET', `${apiUrl}/subjects/1/evaluations*`, {
      statusCode: 200,
      body: { status: 200, message: 'Success', data: { evaluations: [], summary: null } },
    }).as('getEvaluations');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. ESCENARIO EXITOSO: Creación de Apunte y Renderizado con Enlace Seguro
  // ──────────────────────────────────────────────────────────────────────────
  it('E1: Debería crear un nuevo apunte con título, contenido y URL externa de forma interactiva', () => {
    let notesList: any[] = [];

    cy.intercept('GET', `${apiUrl}/subjects/1/notes`, (req) => {
      req.reply({
        statusCode: 200,
        body: { status: 200, message: 'Success', data: notesList },
      });
    }).as('getNotes');

    cy.intercept('POST', `${apiUrl}/subjects/1/notes`, (req) => {
      expect(req.body.title).to.eq('Fórmulas de Gradiente y Rotacional');
      expect(req.body.linkUrl).to.include('ocw.mit.edu');
      notesList = [mockNote1];
      req.reply({
        statusCode: 201,
        body: { status: 201, message: 'Note created', data: mockNote1 },
      });
    }).as('createNote');

    cy.visit('/subjects/1');
    cy.wait(['@getSubject', '@getNotes']);

    // Validar mensaje informativo ante ausencia de apuntes
    cy.contains('No notes or resources registered for this subject').should('be.visible');

    // Abrir modal de creación de apunte
    cy.contains('button', 'Create the first note').click();
    cy.get('app-note-modal').should('be.visible');
    cy.get('app-note-modal h2').should('contain.text', 'New Note or Resource');

    // Llenar formulario
    cy.get('app-note-modal input[formControlName="title"]').type(
      'Fórmulas de Gradiente y Rotacional',
      { force: true }
    );
    cy.get('app-note-modal textarea[formControlName="content"]').type(
      'El gradiente apunta en la dirección de máxima tasa de aumento de una función escalar.',
      { force: true }
    );
    cy.get('app-note-modal input[formControlName="linkUrl"]').type(
      'https://ocw.mit.edu/courses/mathematics/gradient-notes',
      { force: true }
    );

    // Guardar apunte
    cy.get('app-note-modal button[type="submit"]').click();
    cy.wait('@createNote');

    // El modal debe cerrarse y el apunte debe renderizarse en la lista
    cy.get('app-note-modal').should('not.exist');
    cy.get('.note-card').should('have.length', 1);
    cy.get('.note-title').should('contain.text', 'Fórmulas de Gradiente y Rotacional');
    cy.get('.note-content').should('contain.text', 'El gradiente apunta');
    cy.get('a.note-link')
      .should('have.attr', 'href', 'https://ocw.mit.edu/courses/mathematics/gradient-notes')
      .and('have.attr', 'target', '_blank')
      .and('have.attr', 'rel', 'noopener noreferrer');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. ESCENARIO ALTERNATIVO: Edición y Actualización de Contenido de Apunte
  // ──────────────────────────────────────────────────────────────────────────
  it('E2: Debería abrir el modal de edición y actualizar el contenido de un apunte existente', () => {
    let currentNotes = [mockNote1];

    cy.intercept('GET', `${apiUrl}/subjects/1/notes`, (req) => {
      req.reply({
        statusCode: 200,
        body: { status: 200, message: 'Success', data: currentNotes },
      });
    }).as('getNotes');

    cy.intercept('PATCH', `${apiUrl}/subjects/1/notes/101`, (req) => {
      expect(req.body.content).to.include('Teorema de Stokes');
      currentNotes = [mockNote2Updated];
      req.reply({
        statusCode: 200,
        body: { status: 200, message: 'Note updated', data: mockNote2Updated },
      });
    }).as('updateNote');

    cy.visit('/subjects/1');
    cy.wait(['@getSubject', '@getNotes']);

    cy.get('.note-card').should('have.length', 1);
    cy.contains('.note-actions button', 'Edit').click();

    // Modal en modo edición
    cy.get('app-note-modal').should('be.visible');
    cy.get('app-note-modal h2').should('contain.text', 'Edit Note');
    cy.get('app-note-modal input[formControlName="title"]').should(
      'have.value',
      'Fórmulas de Gradiente y Rotacional'
    );

    // Actualizar contenido
    cy.get('app-note-modal textarea[formControlName="content"]')
      .clear()
      .type('Actualizado: Incluye el Teorema de Stokes y cálculo de flujo rotacional.');

    cy.get('app-note-modal button[type="submit"]').click();
    cy.wait('@updateNote');

    cy.get('app-note-modal').should('not.exist');
    cy.get('.note-content').should('contain.text', 'Teorema de Stokes');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. ESCENARIO DE ERROR: Validación de URL y Rechazo de Protocolo Inseguro
  // ──────────────────────────────────────────────────────────────────────────
  it('E3: Debería bloquear el guardado si la URL es inválida (javascript:) o faltan campos obligatorios', () => {
    cy.intercept('GET', `${apiUrl}/subjects/1/notes`, {
      statusCode: 200,
      body: { status: 200, message: 'Success', data: [] },
    }).as('getNotes');

    cy.visit('/subjects/1');
    cy.wait(['@getSubject', '@getNotes']);

    cy.contains('button', 'Create the first note').click();
    cy.get('app-note-modal').should('be.visible');

    // Intentar guardar con formulario vacío
    cy.get('app-note-modal button[type="submit"]').click();
    cy.contains('Title is required').should('be.visible');
    cy.contains('Content is required').should('be.visible');

    // Escribir URL maliciosa o inválida (javascript:alert(1))
    cy.get('app-note-modal input[formControlName="title"]').type('Título Válido', {
      force: true,
    });
    cy.get('app-note-modal textarea[formControlName="content"]').type(
      'Contenido Válido',
      { force: true }
    );
    cy.get('app-note-modal input[formControlName="linkUrl"]').type(
      'javascript:alert(1)',
      { force: true }
    );

    cy.get('app-note-modal button[type="submit"]').click();
    cy.contains('Enter a valid URL starting with http:// or https://').should('be.visible');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. ESCENARIO DE ERROR: Resiliencia ante Fallo del Servidor (500)
  // ──────────────────────────────────────────────────────────────────────────
  it('E4: Debería mostrar mensaje de error amigable cuando el servidor falla al guardar', () => {
    cy.intercept('GET', `${apiUrl}/subjects/1/notes`, {
      statusCode: 200,
      body: { status: 200, message: 'Success', data: [] },
    }).as('getNotes');

    cy.intercept('POST', `${apiUrl}/subjects/1/notes`, {
      statusCode: 500,
      body: { message: 'Internal Server Error' },
    }).as('postFail');

    cy.visit('/subjects/1');
    cy.wait(['@getSubject', '@getNotes']);

    cy.contains('button', 'Create the first note').click();
    cy.get('app-note-modal input[formControlName="title"]').type(
      'Apunte de Resiliencia',
      { force: true }
    );
    cy.get('app-note-modal textarea[formControlName="content"]').type(
      'Prueba de error del servidor 500',
      { force: true }
    );

    cy.get('app-note-modal button[type="submit"]').click();
    cy.wait('@postFail');

    // El modal no se cierra y muestra el error amigable del servidor
    cy.get('app-note-modal .server-error').should('contain.text', 'Could not save the note.');
    cy.get('app-note-modal').should('be.visible');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. ESCENARIO DE ACCESIBILIDAD: Cumplimiento WCAG en Formulario Modal de Apuntes
  // ──────────────────────────────────────────────────────────────────────────
  it('E5: Debería cumplir con estándares de accesibilidad WCAG en el modal de apuntes', () => {
    cy.intercept('GET', `${apiUrl}/subjects/1/notes`, {
      statusCode: 200,
      body: { status: 200, message: 'Success', data: [mockNote1] },
    }).as('getNotes');

    cy.visit('/subjects/1');
    cy.wait(['@getSubject', '@getNotes']);

    cy.contains('button', '+ New Note').click();
    cy.get('app-note-modal').should('be.visible');

    // Inyectar y auditar accesibilidad con cypress-axe
    cy.injectAxe();
    cy.checkA11y(
      'app-note-modal',
      {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa'],
        },
      },
      undefined,
      true
    );
  });
});
