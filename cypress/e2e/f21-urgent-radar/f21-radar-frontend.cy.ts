describe('F21: Alertas y Radar de Entregas Urgentes (Frontend E2E, UI & a11y)', () => {
  const mockUrgentAssignments = [
    {
      id: 101,
      title: 'Taller de Pruebas Unitarias',
      description: 'Informe con cobertura Jest',
      dueDate: new Date(Date.now() + 4 * 3600 * 1000).toISOString(), // Vence en 4h
      subjectId: 10,
      subjectName: 'Validación y Verificación',
      reminderMinutes: 60,
    },
    {
      id: 102,
      title: 'Avance de Proyecto Final',
      description: 'Subtareas y cálculo de avance',
      dueDate: new Date(Date.now() + 14 * 3600 * 1000).toISOString(), // Vence en 14h
      subjectId: 20,
      subjectName: 'Ingeniería de Software',
      reminderMinutes: 120,
    },
  ];

  beforeEach(() => {
    // Configurar sesión activa en localStorage antes de navegar
    cy.visit('/login');
    cy.loginSession();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. ESCENARIO EXITOSO: Visualización y Conteo Regresivo del Radar
  // ──────────────────────────────────────────────────────────────────────────
  it('E1: Debería renderizar la cuadrícula de tareas urgentes con temporizador activo', () => {
    // Interceptar llamadas a assignments para garantizar determinismo
    cy.intercept('GET', '**/assignments/urgent*', {
      statusCode: 200,
      body: {
        status: 200,
        message: 'OK',
        data: mockUrgentAssignments,
      },
    }).as('getUrgent');

    cy.intercept('GET', '**/assignments/upcoming*', {
      statusCode: 200,
      body: {
        status: 200,
        message: 'OK',
        data: mockUrgentAssignments,
      },
    }).as('getUpcoming');

    cy.visit('/urgent-radar');

    // Validar encabezados y estructura
    cy.get('h1#radar-title').should('be.visible').and('contain.text', 'Urgent assignments radar');
    cy.get('.radar-header p').should('contain.text', 'Assignments due within the next 24 hours');

    // Validar tarjetas de tareas urgentes
    cy.get('.urgent-grid mat-card.urgent-card').should('have.length', 2);

    // Validar contenido de la primera tarjeta
    cy.get('.urgent-grid mat-card.urgent-card').first().within(() => {
      cy.get('mat-card-subtitle').should('contain.text', 'Validación y Verificación');
      cy.get('mat-card-title').should('contain.text', 'Taller de Pruebas Unitarias');
      cy.get('.countdown').should('be.visible');
      cy.get('.countdown span').should('contain.text', 'h');
      cy.get('.reminder').should('contain.text', 'Reminder: 60 min before');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. ESCENARIO ALTERNATIVO: Estado Vacío cuando no hay entregas urgentes
  // ──────────────────────────────────────────────────────────────────────────
  it('E2: Debería mostrar mensaje amigable de estado vacío cuando no hay tareas urgentes', () => {
    cy.intercept('GET', '**/assignments/urgent*', {
      statusCode: 200,
      body: {
        status: 200,
        message: 'No urgent assignments',
        data: [],
      },
    }).as('getEmptyUrgent');

    cy.intercept('GET', '**/assignments/upcoming*', {
      statusCode: 200,
      body: {
        status: 200,
        message: 'No upcoming assignments',
        data: [],
      },
    }).as('getEmptyUpcoming');

    cy.visit('/urgent-radar');

    cy.get('.empty-radar').should('be.visible');
    cy.get('.empty-radar h2').should('contain.text', 'No urgent assignments');
    cy.get('.empty-radar p').should('contain.text', 'You have no pending assignments due within the next 24 hours');
    cy.get('.urgent-grid').should('not.exist');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. ESCENARIO DE ERROR: Resiliencia ante caída del servicio (Error 500)
  // ──────────────────────────────────────────────────────────────────────────
  it('E3: Debería manejar de forma segura errores del servidor sin bloquear la interfaz', () => {
    cy.intercept('GET', '**/assignments/urgent*', {
      statusCode: 500,
      body: { message: 'Internal server error' },
    }).as('getErrorUrgent');

    cy.visit('/urgent-radar');

    // La interfaz no debe quedar colgada en el spinner
    cy.get('mat-progress-spinner').should('not.exist');
    cy.get('main.radar-container').should('be.visible');
    // Al fallar se muestra el fallback seguro
    cy.get('.empty-radar').should('exist');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. ESCENARIO UI / INTERACCIÓN: Botón de Habilitación de Alertas Web
  // ──────────────────────────────────────────────────────────────────────────
  it('E4: Debería permitir interactuar con el control de habilitación de alertas web', () => {
    cy.intercept('GET', '**/assignments/urgent*', {
      statusCode: 200,
      body: { status: 200, message: 'OK', data: [] },
    });

    cy.visit('/urgent-radar', {
      onBeforeLoad(win) {
        if ('Notification' in win) {
          cy.stub(win.Notification, 'requestPermission').resolves('granted');
        }
      },
    });

    cy.contains('button', 'Enable web alerts').should('be.visible').click();
    cy.get('.notification-message').should('be.visible').and('contain.text', 'Web alerts are enabled');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. ACCESIBILIDAD (a11y): Auditoría de Cumplimiento WCAG con Cypress-Axe
  // ──────────────────────────────────────────────────────────────────────────
  it('E5: Debería cumplir con estándares de accesibilidad WCAG en el radar', () => {
    cy.intercept('GET', '**/assignments/urgent*', {
      statusCode: 200,
      body: { status: 200, message: 'OK', data: mockUrgentAssignments },
    });

    cy.visit('/urgent-radar');
    cy.injectAxe();

    // Auditar contenedor principal asegurando accesibilidad básica
    cy.checkA11y('main.radar-container', {
      includedImpacts: ['critical', 'serious'],
    });
  });
});
