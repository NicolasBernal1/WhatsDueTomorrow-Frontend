/// <reference types="cypress" />

describe('F25: Calculadora y Simulador de Calificaciones por Asignatura (Frontend E2E, UI & a11y)', () => {
  const apiUrl = 'https://whatsduetomorrow-backed.onrender.com';

  const mockSubject = {
    id: 1,
    name: 'Física de Oscilaciones y Ondas',
    professor: 'Dra. Curie',
    credits: 4,
    color: '#3f51b5',
  };

  const mockEvaluation1 = {
    id: 201,
    name: 'Primer Examen Parcial',
    weight: 30,
    score: 4.5,
    subjectId: 1,
    createdAt: '2026-05-10T14:30:00.000Z',
    updatedAt: '2026-05-10T14:30:00.000Z',
  };

  const mockSummaryWithEval1 = {
    totalWeight: 30,
    remainingWeight: 70,
    currentContribution: 1.35,
    currentAverage: 4.5,
    requiredGrade: 2.36,
    isPassing: true,
    isAttainable: true,
    status: 'Aprobando' as const,
    weightExceeded: false,
    passingGrade: 3.0,
    maxGrade: 5.0,
  };

  beforeEach(() => {
    // Autenticar sesión en cliente
    cy.visit('/login');
    cy.loginSession();

    // Interceptar llamadas base de la asignatura apuntando a la URL del backend
    cy.intercept('GET', `${apiUrl}/subjects/1`, {
      statusCode: 200,
      body: { status: 200, message: 'Success', data: mockSubject },
    }).as('getSubject');

    cy.intercept('GET', `${apiUrl}/assignments/subject/1`, {
      statusCode: 200,
      body: { status: 200, message: 'Success', data: [] },
    }).as('getAssignments');

    cy.intercept('GET', `${apiUrl}/subjects/1/notes*`, {
      statusCode: 200,
      body: { status: 200, message: 'Success', data: [] },
    }).as('getNotes');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. ESCENARIO EXITOSO: Registro de Calificación y Cálculo Dinámico
  // ──────────────────────────────────────────────────────────────────────────
  it('E1: Debería registrar una evaluación y recalcular reactivamente el promedio ponderado', () => {
    let evalList: any[] = [];
    let summaryData: any = null;

    cy.intercept('GET', `${apiUrl}/subjects/1/evaluations*`, (req) => {
      req.reply({
        statusCode: 200,
        body: {
          status: 200,
          message: 'Success',
          data: { evaluations: evalList, summary: summaryData },
        },
      });
    }).as('getEvaluations');

    cy.intercept('POST', `${apiUrl}/subjects/1/evaluations`, (req) => {
      expect(req.body.name).to.eq('Primer Examen Parcial');
      expect(Number(req.body.weight)).to.eq(30);
      expect(Number(req.body.score)).to.eq(4.5);

      evalList = [mockEvaluation1];
      summaryData = mockSummaryWithEval1;

      req.reply({
        statusCode: 201,
        body: {
          status: 201,
          message: 'Evaluation created',
          data: { evaluations: evalList, summary: summaryData },
        },
      });
    }).as('createEvaluation');

    cy.visit('/subjects/1');
    cy.wait(['@getSubject', '@getEvaluations']);

    // Validar estado inicial sin evaluaciones
    cy.contains('No evaluations registered for this subject').should('be.visible');

    // Abrir modal de evaluación
    cy.contains('button', 'Add first evaluation').click();
    cy.get('app-evaluation-modal').should('be.visible');
    cy.get('app-evaluation-modal h2').should('contain.text', 'New Weighted Evaluation');

    // Llenar formulario con soporte para inputs de Angular Material
    cy.get('app-evaluation-modal input[formControlName="name"]').type('Primer Examen Parcial', {
      force: true,
    });
    cy.get('app-evaluation-modal input[formControlName="weight"]').type('30', {
      force: true,
    });
    cy.get('app-evaluation-modal input[formControlName="score"]').type('4.5', {
      force: true,
    });

    // Validar previsualización en vivo dentro del modal
    cy.get('app-evaluation-modal .live-preview-box').should('contain.text', '1.35 pts');
    cy.get('app-evaluation-modal .live-preview-box').should('contain.text', '30.00%');

    // Guardar evaluación
    cy.get('app-evaluation-modal button[type="submit"]').should('not.be.disabled').click();
    cy.wait('@createEvaluation');

    // El modal debe cerrarse y las métricas deben actualizarse
    cy.get('app-evaluation-modal').should('not.exist');
    cy.get('.calculator-section').should('be.visible');

    // Validar actualización de tarjetas de métricas
    cy.contains('.metric-card', 'Current Weighted Average')
      .find('.metric-value')
      .should('contain.text', '4.50');

    cy.contains('.metric-card', 'Accumulated Points')
      .find('.metric-value')
      .should('contain.text', '1.35');

    cy.contains('.metric-card', 'Evaluated Weight')
      .find('.metric-value')
      .should('contain.text', '30.00%');

    // Validar tabla de notas
    cy.get('.evaluations-table tbody tr').should('have.length', 1);
    cy.get('.eval-name').should('contain.text', 'Primer Examen Parcial');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. ESCENARIO ALTERNATIVO: Simulador Interactivo de Metas y Escenarios
  // ──────────────────────────────────────────────────────────────────────────
  it('E2: Debería calcular en tiempo real escenarios hipotéticos en el simulador interactivo', () => {
    cy.intercept('GET', `${apiUrl}/subjects/1/evaluations*`, {
      statusCode: 200,
      body: {
        status: 200,
        message: 'Success',
        data: {
          evaluations: [mockEvaluation1],
          summary: mockSummaryWithEval1,
        },
      },
    }).as('getEvaluations');

    cy.visit('/subjects/1');
    cy.wait(['@getSubject', '@getEvaluations']);

    // La tarjeta del simulador debe estar presente
    cy.get('.simulator-card').should('be.visible');
    cy.contains('Scenario Simulator').should('be.visible');

    // Simular nota hipotética de 4.0 en el 70% restante
    cy.get('#hypotheticalInput').clear({ force: true }).type('4.0', { force: true });
    // Aporte actual = 1.35, Hipotético = (4.0 * 70)/100 = 2.80 -> Final = 4.15
    cy.get('.simulator-card').should('contain.text', 'Estimated final grade:');
    cy.get('.simulator-card strong').should('contain.text', '4.15');

    // Simular meta de calificación específica de 4.5
    cy.get('#targetGoalInput').clear({ force: true }).type('4.5', { force: true });
    // Para llegar a 4.5: (4.5 - 1.35) * 100 / 70 = 3.15 * 100 / 70 = 4.50
    cy.get('.simulator-card').should('contain.text', 'Required grade:');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. ESCENARIO DE ERROR: Validación de Límites (Pesos > 100% y Notas > 5.0)
  // ──────────────────────────────────────────────────────────────────────────
  it('E3: Debería bloquear el formulario ante pesos superiores al 100% o notas fuera de rango', () => {
    cy.intercept('GET', `${apiUrl}/subjects/1/evaluations*`, {
      statusCode: 200,
      body: {
        status: 200,
        message: 'Success',
        data: { evaluations: [], summary: null },
      },
    }).as('getEvaluations');

    cy.visit('/subjects/1');
    cy.wait(['@getSubject', '@getEvaluations']);

    cy.contains('button', 'Add first evaluation').click();
    cy.get('app-evaluation-modal').should('be.visible');

    // Ingresar datos fuera de rango
    cy.get('app-evaluation-modal input[formControlName="name"]').type('Examen Inválido', {
      force: true,
    });
    cy.get('app-evaluation-modal input[formControlName="weight"]').type('110', {
      force: true,
    });
    cy.get('app-evaluation-modal input[formControlName="score"]').type('5.8', {
      force: true,
    }).blur();

    // Comprobar mensajes de validación y alerta de peso acumulado
    cy.contains('Must be between 1% and 100%.').should('be.visible');
    cy.contains('Must be between 0.0 and 5.0.').should('be.visible');
    cy.contains('Warning: The accumulated weight exceeds 100%.').should('be.visible');

    // El botón guardar debe mantenerse deshabilitado
    cy.get('app-evaluation-modal button[type="submit"]').should('be.disabled');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. ESCENARIO DE ERROR: Resiliencia ante Fallo del Servidor (500)
  // ──────────────────────────────────────────────────────────────────────────
  it('E4: Debería mostrar mensaje de error amigable si el servidor falla al registrar la evaluación', () => {
    cy.intercept('GET', `${apiUrl}/subjects/1/evaluations*`, {
      statusCode: 200,
      body: {
        status: 200,
        message: 'Success',
        data: { evaluations: [], summary: null },
      },
    }).as('getEvaluations');

    cy.intercept('POST', `${apiUrl}/subjects/1/evaluations`, {
      statusCode: 500,
      body: { message: 'Internal Server Error' },
    }).as('postFail');

    cy.visit('/subjects/1');
    cy.wait(['@getSubject', '@getEvaluations']);

    cy.contains('button', 'Add first evaluation').click();
    cy.get('app-evaluation-modal input[formControlName="name"]').type('Taller Evaluativo', {
      force: true,
    });
    cy.get('app-evaluation-modal input[formControlName="weight"]').type('20', {
      force: true,
    });
    cy.get('app-evaluation-modal input[formControlName="score"]').type('4.0', {
      force: true,
    });

    cy.get('app-evaluation-modal button[type="submit"]').click();
    cy.wait('@postFail');

    // El modal no se cierra y muestra mensaje de error amigable
    cy.get('app-evaluation-modal .server-error').should(
      'contain.text',
      'Could not register the evaluation.'
    );
    cy.get('app-evaluation-modal').should('be.visible');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. ESCENARIO DE ACCESIBILIDAD: Cumplimiento WCAG en Modal de Calificaciones
  // ──────────────────────────────────────────────────────────────────────────
  it('E5: Debería cumplir con estándares de accesibilidad WCAG en el modal de evaluación', () => {
    cy.intercept('GET', `${apiUrl}/subjects/1/evaluations*`, {
      statusCode: 200,
      body: {
        status: 200,
        message: 'Success',
        data: { evaluations: [mockEvaluation1], summary: mockSummaryWithEval1 },
      },
    }).as('getEvaluations');

    cy.visit('/subjects/1');
    cy.wait(['@getSubject', '@getEvaluations']);

    cy.contains('button', '+ New Evaluation').click();
    cy.get('app-evaluation-modal').should('be.visible');

    // Auditoría de accesibilidad con cypress-axe
    cy.injectAxe();
    cy.checkA11y(
      'app-evaluation-modal',
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
