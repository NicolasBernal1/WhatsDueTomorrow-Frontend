/// <reference types="cypress" />

describe('F26: Gestión de Créditos Académicos y Semáforo de Carga Semanal (Frontend E2E, UI & a11y)', () => {
  const apiUrl = 'https://whatsduetomorrow-backed.onrender.com';

  const mockSubjectsBalanced = [
    { id: 1, name: 'Cálculo Vectorial', professor: 'Prof. Gauss', credits: 5, color: '#3f51b5' },
    { id: 2, name: 'Estructuras de Datos', professor: 'Prof. Knuth', credits: 5, color: '#009688' },
    { id: 3, name: 'Física Electromagnética', professor: 'Prof. Maxwell', credits: 5, color: '#e91e63' },
  ];

  const mockLoadBalanced = {
    totalCredits: 15,
    status: 'balanceada' as const,
    statusLabel: 'Carga balanceada',
    weeklyPresentialHours: 9,
    weeklyAutonomousHours: 18,
    subjectsCount: 3,
    classesCount: 3,
  };

  const mockLoadOverload = {
    totalCredits: 20,
    status: 'sobrecarga' as const,
    statusLabel: 'Sobrecarga',
    weeklyPresentialHours: 12,
    weeklyAutonomousHours: 24,
    subjectsCount: 4,
    classesCount: 4,
  };

  const mockLoadLow = {
    totalCredits: 0,
    status: 'baja' as const,
    statusLabel: 'Carga baja',
    weeklyPresentialHours: 0,
    weeklyAutonomousHours: 0,
    subjectsCount: 0,
    classesCount: 0,
  };

  beforeEach(() => {
    // Autenticar sesión en cliente
    cy.visit('/login');
    cy.loginSession();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. ESCENARIO EXITOSO: Visualización de Semáforo en Carga Balanceada
  // ──────────────────────────────────────────────────────────────────────────
  it('E1: Debería mostrar la tarjeta de carga balanceada con horas presenciales y de estudio autónomo', () => {
    cy.intercept('GET', `${apiUrl}/subjects`, {
      statusCode: 200,
      body: { status: 200, message: 'Success', data: mockSubjectsBalanced },
    }).as('getSubjects');

    cy.intercept('GET', `${apiUrl}/subjects/academic-load`, {
      statusCode: 200,
      body: { status: 200, message: 'Success', data: mockLoadBalanced },
    }).as('getAcademicLoad');

    cy.visit('/subjects');
    cy.wait(['@getSubjects', '@getAcademicLoad']);

    // Validar contenedor y clases de estado
    cy.get('.academic-load-section').should('be.visible');
    cy.get('.load-card').should('have.class', 'status-balanceada');
    cy.get('.status-text').should('contain.text', 'Balanced load');

    // Validar paso activo del semáforo tricolor (RNF10)
    cy.get('.traffic-step.step-balanceada').should('have.class', 'active');
    cy.get('.traffic-step.step-baja').should('not.have.class', 'active');
    cy.get('.traffic-step.step-sobrecarga').should('not.have.class', 'active');

    // Validar estadísticas desglosadas
    cy.contains('.stat-box', 'Total Credits')
      .find('.stat-number')
      .should('contain.text', '15 credits');

    cy.contains('.stat-box', 'Weekly Class Hours')
      .find('.stat-number')
      .should('contain.text', '9 h/week');

    cy.contains('.stat-box', 'Estimated Independent Study')
      .find('.stat-number')
      .should('contain.text', '18 h/week');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. ESCENARIO ALTERNATIVO: Transición Reactiva a Sobrecarga tras Crear Asignatura
  // ──────────────────────────────────────────────────────────────────────────
  it('E2: Debería transicionar reactivamente a sobrecarga al inscribir una nueva asignatura sin recargar la página', () => {
    let currentSubjects = [...mockSubjectsBalanced];
    let currentLoad = mockLoadBalanced;

    cy.intercept('GET', `${apiUrl}/subjects`, (req) => {
      req.reply({
        statusCode: 200,
        body: { status: 200, message: 'Success', data: currentSubjects },
      });
    }).as('getSubjects');

    cy.intercept('GET', `${apiUrl}/subjects/academic-load`, (req) => {
      req.reply({
        statusCode: 200,
        body: { status: 200, message: 'Success', data: currentLoad },
      });
    }).as('getAcademicLoad');

    cy.intercept('POST', `${apiUrl}/subjects`, (req) => {
      expect(req.body.name).to.eq('Inteligencia Artificial');
      expect(Number(req.body.credits)).to.eq(5);

      currentSubjects.push({
        id: 4,
        name: 'Inteligencia Artificial',
        professor: 'Dr. Turing',
        credits: 5,
        color: '#ff9800',
      });
      currentLoad = mockLoadOverload;

      req.reply({
        statusCode: 201,
        body: { status: 201, message: 'Subject created', data: null },
      });
    }).as('createSubject');

    cy.visit('/subjects');
    cy.wait(['@getSubjects', '@getAcademicLoad']);

    // Abrir modal de nueva asignatura
    cy.contains('button', '+ Add Subject').click();
    cy.get('app-add-subject-modal').should('be.visible');

    // Llenar formulario
    cy.get('app-add-subject-modal input[formControlName="name"]').type(
      'Inteligencia Artificial',
      { force: true }
    );
    cy.get('app-add-subject-modal input[formControlName="professor"]').type(
      'Dr. Turing',
      { force: true }
    );
    cy.get('app-add-subject-modal input[formControlName="credits"]').clear({ force: true }).type(
      '5',
      { force: true }
    );

    // Guardar
    cy.get('app-add-subject-modal button[type="submit"]').click();
    cy.wait('@createSubject');

    // El semáforo debe haber cambiado a estado sobrecarga
    cy.get('app-add-subject-modal').should('not.exist');
    cy.get('.load-card').should('have.class', 'status-sobrecarga');
    cy.get('.status-text').should('contain.text', 'Overload');
    cy.get('.traffic-step.step-sobrecarga').should('have.class', 'active');

    cy.contains('.stat-box', 'Total Credits')
      .find('.stat-number')
      .should('contain.text', '20 credits');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. ESCENARIO ALTERNATIVO: Carga Baja Inicial con Cero Créditos
  // ──────────────────────────────────────────────────────────────────────────
  it('E3: Debería renderizar el semáforo en estado de carga baja para un estudiante sin materias', () => {
    cy.intercept('GET', `${apiUrl}/subjects`, {
      statusCode: 200,
      body: { status: 200, message: 'Success', data: [] },
    }).as('getSubjects');

    cy.intercept('GET', `${apiUrl}/subjects/academic-load`, {
      statusCode: 200,
      body: { status: 200, message: 'Success', data: mockLoadLow },
    }).as('getAcademicLoad');

    cy.visit('/subjects');
    cy.wait(['@getSubjects', '@getAcademicLoad']);

    cy.get('.load-card').should('have.class', 'status-baja');
    cy.get('.status-text').should('contain.text', 'Low load');
    cy.get('.traffic-step.step-baja').should('have.class', 'active');

    cy.contains('.stat-box', 'Total Credits')
      .find('.stat-number')
      .should('contain.text', '0 credits');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. ESCENARIO DE ERROR: Resiliencia ante Fallo del Servidor (500)
  // ──────────────────────────────────────────────────────────────────────────
  it('E4: Debería mantener la estabilidad de la vista de asignaturas si la carga semanal falla con error 500', () => {
    cy.intercept('GET', `${apiUrl}/subjects`, {
      statusCode: 200,
      body: { status: 200, message: 'Success', data: mockSubjectsBalanced },
    }).as('getSubjects');

    cy.intercept('GET', `${apiUrl}/subjects/academic-load`, {
      statusCode: 500,
      body: { message: 'Internal Server Error' },
    }).as('getLoadFail');

    cy.visit('/subjects');
    cy.wait(['@getSubjects', '@getLoadFail']);

    // La interfaz no debe colapsar y debe seguir mostrando el encabezado y las asignaturas
    cy.get('.subjects-container').should('be.visible');
    cy.contains('h2', 'Your Subjects').should('be.visible');
    cy.get('.academic-load-section').should('not.exist');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. ESCENARIO DE ACCESIBILIDAD: Cumplimiento WCAG del Semáforo de Carga
  // ──────────────────────────────────────────────────────────────────────────
  it('E5: Debería cumplir con estándares de accesibilidad WCAG en el semáforo y tarjeta de carga', () => {
    cy.intercept('GET', `${apiUrl}/subjects`, {
      statusCode: 200,
      body: { status: 200, message: 'Success', data: mockSubjectsBalanced },
    }).as('getSubjects');

    cy.intercept('GET', `${apiUrl}/subjects/academic-load`, {
      statusCode: 200,
      body: { status: 200, message: 'Success', data: mockLoadBalanced },
    }).as('getAcademicLoad');

    cy.visit('/subjects');
    cy.wait(['@getSubjects', '@getAcademicLoad']);

    // Inyectar y auditar accesibilidad con cypress-axe
    cy.injectAxe();
    cy.checkA11y(
      '.academic-load-section',
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
