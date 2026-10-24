describe('F23: Sincronización y Exportación de Calendario .ics (Frontend E2E, UI & a11y)', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.loginSession();

    // Interceptar la consulta de materias y clases para cargar el horario
    cy.intercept('GET', '**/subjects/classes*', {
      statusCode: 200,
      body: { status: 200, message: 'OK', data: [] },
    }).as('getClasses');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. ESCENARIO EXITOSO: Generación de Enlace de Suscripción Webcal
  // ──────────────────────────────────────────────────────────────────────────
  it('E1: Debería generar y desplegar el enlace de suscripción webcal con mensaje exitoso', () => {
    const mockWebcalUrl = 'webcal://whatsduetomorrow-backed.onrender.com/calendar/feed/abcdef123456.ics';

    cy.intercept('POST', '**/calendar/subscription*', {
      statusCode: 200,
      body: {
        status: 200,
        message: 'Calendar subscription created successfully',
        data: { webcalUrl: mockWebcalUrl },
      },
    }).as('createSubscription');

    cy.visit('/schedule');

    // Validar sección de sincronización
    cy.get('h2#calendar-sync-title').should('contain.text', 'Calendar sync');
    cy.get('.subscription-link').should('not.exist');

    // Clic en "Sync calendar"
    cy.contains('button', 'Sync calendar').click();
    cy.wait('@createSubscription');

    // Validar visualización del enlace y mensaje
    cy.get('.subscription-link').should('be.visible');
    cy.get('input[aria-label="Calendar subscription link"]')
      .should('have.value', mockWebcalUrl);
    cy.get('.calendar-message').should('contain.text', 'Your subscription link is ready');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. ESCENARIO ALTERNATIVO: Copiar Enlace al Portapapeles (navigator.clipboard)
  // ──────────────────────────────────────────────────────────────────────────
  it('E2: Debería copiar el enlace al portapapeles y actualizar el estado visual', () => {
    const mockWebcalUrl = 'webcal://example.com/calendar/feed/xyz987.ics';

    cy.intercept('POST', '**/calendar/subscription*', {
      statusCode: 200,
      body: {
        status: 200,
        message: 'OK',
        data: { webcalUrl: mockWebcalUrl },
      },
    });

    cy.visit('/schedule', {
      onBeforeLoad(win) {
        // Stub de navigator.clipboard.writeText
        if (win.navigator && win.navigator.clipboard) {
          cy.stub(win.navigator.clipboard, 'writeText').resolves();
        }
      },
    });

    cy.contains('button', 'Sync calendar').click();
    cy.contains('button', 'Copy link').click();

    cy.get('.calendar-message').should(
      'contain.text',
      'Subscription link copied. Open it from your calendar app'
    );
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. ESCENARIO EXITOSO: Descarga de Archivo de Calendario .ics
  // ──────────────────────────────────────────────────────────────────────────
  it('E3: Debería permitir la descarga del archivo whats-due-tomorrow.ics y notificar éxito', () => {
    const mockIcsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Whats Due Tomorrow//Academic Calendar//EN',
      'BEGIN:VEVENT',
      'SUMMARY:Class: Software Testing',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    cy.intercept('GET', '**/calendar/download*', {
      statusCode: 200,
      headers: {
        'content-type': 'text/calendar; charset=utf-8',
        'content-disposition': 'attachment; filename="whats-due-tomorrow.ics"',
      },
      body: mockIcsContent,
    }).as('downloadIcs');

    cy.visit('/schedule', {
      onBeforeLoad(win) {
        cy.spy(win.URL, 'createObjectURL').as('createObjectURL');
      },
    });

    cy.contains('button', 'Download .ics').should('be.visible').click();
    cy.wait('@downloadIcs').then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
      expect(interception.response?.headers['content-type']).to.include('text/calendar');
    });

    cy.get('@createObjectURL').should('have.been.calledOnce');
    cy.get('.calendar-message').should('not.exist');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. ESCENARIO DE ERROR: Resiliencia ante Fallo de Creación de Suscripción (500)
  // ──────────────────────────────────────────────────────────────────────────
  it('E4: Debería mostrar mensaje de error amigable cuando la suscripción falla en el servidor', () => {
    cy.intercept('POST', '**/calendar/subscription*', {
      statusCode: 500,
      body: { message: 'Internal server error' },
    }).as('subscriptionError');

    cy.visit('/schedule');

    cy.contains('button', 'Sync calendar').click();
    cy.wait('@subscriptionError');

    cy.get('.calendar-message').should(
      'contain.text',
      'Unable to create the subscription link'
    );
    cy.get('.subscription-link').should('not.exist');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. ACCESIBILIDAD (a11y): Cumplimiento de Contraste y WCAG en Calendar Sync
  // ──────────────────────────────────────────────────────────────────────────
  it('E5: Debería cumplir con estándares de accesibilidad WCAG en la sección de sincronización', () => {
    cy.visit('/schedule');
    cy.injectAxe();

    // Auditar la sección de sincronización de calendario
    cy.checkA11y('.calendar-sync', {
      includedImpacts: ['critical', 'serious'],
    });
  });
});
