import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { EvaluationService, round2 } from './evaluation.service';
import { environment } from '../../environments/environment';
import {
  CreateEvaluationDto,
  Evaluation,
  EvaluationListResponse,
  GradeSummary,
  SimulateGradeDto,
  SimulationResult,
  UpdateEvaluationDto,
} from '../models/evaluation.model';

describe('EvaluationService (F25 — Métodos HTTP y Cálculos Reactivos RNF09)', () => {
  let service: EvaluationService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EvaluationService],
    });
    service = TestBed.inject(EvaluationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('debe crearse e instanciarse correctamente', () => {
    expect(service).toBeTruthy();
  });

  describe('Métodos HTTP de Persistencia en API', () => {
    const mockListResponse: EvaluationListResponse = {
      evaluations: [
        {
          id: 1,
          name: 'Parcial 1',
          weight: 30,
          score: 4.0,
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-01T00:00:00.000Z',
          subjectId: 10,
        },
      ],
      summary: {
        totalWeight: 30,
        remainingWeight: 70,
        currentContribution: 1.2,
        currentAverage: 4.0,
        requiredGrade: 2.57,
        isPassing: true,
        isAttainable: true,
        status: 'Aprobando',
        weightExceeded: false,
        passingGrade: 3.0,
        maxGrade: 5.0,
      },
    };

    it('debe ejecutar GET /subjects/:subjectId/evaluations', () => {
      service.getEvaluationsBySubject(10).subscribe((res) => {
        expect(res.data?.evaluations.length).toBe(1);
        expect(res.data?.summary.status).toBe('Aprobando');
      });

      const req = httpMock.expectOne(`${apiUrl}/subjects/10/evaluations`);
      expect(req.request.method).toBe('GET');
      req.flush({ status: 200, message: 'OK', data: mockListResponse });
    });

    it('debe ejecutar POST /subjects/:subjectId/evaluations con payload válido', () => {
      const dto: CreateEvaluationDto = {
        name: 'Parcial 2',
        weight: 30,
        score: 3.5,
      };

      service.createEvaluation(10, dto).subscribe((res) => {
        expect(res.status).toBe(201);
      });

      const req = httpMock.expectOne(`${apiUrl}/subjects/10/evaluations`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({ status: 201, message: 'Created', data: mockListResponse });
    });

    it('debe ejecutar PATCH /subjects/:subjectId/evaluations/:id con DTO parcial', () => {
      const dto: UpdateEvaluationDto = {
        name: 'Parcial 1 Modificado',
        score: 4.5,
      };

      service.updateEvaluation(10, 1, dto).subscribe((res) => {
        expect(res.status).toBe(200);
      });

      const req = httpMock.expectOne(`${apiUrl}/subjects/10/evaluations/1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(dto);
      req.flush({ status: 200, message: 'Updated', data: mockListResponse });
    });

    it('debe ejecutar DELETE /subjects/:subjectId/evaluations/:id', () => {
      service.deleteEvaluation(10, 1).subscribe((res) => {
        expect(res.status).toBe(200);
      });

      const req = httpMock.expectOne(`${apiUrl}/subjects/10/evaluations/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ status: 200, message: 'Deleted', data: mockListResponse });
    });

    it('debe ejecutar POST /subjects/:subjectId/evaluations/simulate', () => {
      const dto: SimulateGradeDto = {
        hypotheticalScore: 3.8,
        targetGrade: 3.5,
      };
      const mockSimResult: SimulationResult = {
        summary: mockListResponse.summary,
        targetGrade: 3.5,
        requiredForTarget: 3.29,
        isTargetAttainable: true,
        hypotheticalScore: 3.8,
        hypotheticalFinalGrade: 3.86,
        hypotheticalStatus: 'Aprobando',
      };

      service.simulateGrade(10, dto).subscribe((res) => {
        expect(res.data?.hypotheticalFinalGrade).toBe(3.86);
      });

      const req = httpMock.expectOne(
        `${apiUrl}/subjects/10/evaluations/simulate`,
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({ status: 200, message: 'OK', data: mockSimResult });
    });
  });

  describe('Cálculos Reactivos Locales (calculateSummaryLocally RNF09 < 5ms)', () => {
    it('caso sin evaluaciones: estado "Sin calificaciones", nota requerida 3.0, restante 100%', () => {
      const summary = service.calculateSummaryLocally([]);
      expect(summary.totalWeight).toBe(0);
      expect(summary.remainingWeight).toBe(100);
      expect(summary.currentContribution).toBe(0);
      expect(summary.currentAverage).toBe(0);
      expect(summary.requiredGrade).toBe(3.0);
      expect(summary.isAttainable).toBeTrue();
      expect(summary.status).toBe('Sin calificaciones');
      expect(summary.weightExceeded).toBeFalse();
    });

    it('caso contribución acumulada alcanza o supera 3.0: estado "Aprobado" y requiredGrade 0.0', () => {
      const evaluations: Evaluation[] = [
        { id: 1, name: 'Corte 1', weight: 40, score: 5.0, createdAt: '', updatedAt: '', subjectId: 1 },
        { id: 2, name: 'Corte 2', weight: 30, score: 4.0, createdAt: '', updatedAt: '', subjectId: 1 },
      ];
      // 5.0*0.4 + 4.0*0.3 = 2.0 + 1.2 = 3.2 >= 3.0
      const summary = service.calculateSummaryLocally(evaluations);
      expect(summary.currentContribution).toBe(3.2);
      expect(summary.requiredGrade).toBe(0.0);
      expect(summary.status).toBe('Aprobado');
      expect(summary.isPassing).toBeTrue();
      expect(summary.isAttainable).toBeTrue();
    });

    it('caso promedio aprobatorio con nota requerida alcanzable: estado "Aprobando"', () => {
      const evaluations: Evaluation[] = [
        { id: 1, name: 'Parcial 1', weight: 40, score: 4.0, createdAt: '', updatedAt: '', subjectId: 1 },
      ];
      // contribution = 1.6, remaining = 60%, currentAverage = 4.0 >= 3.0
      // required: (3.0 - 1.6) / 0.6 = 1.4 / 0.6 = 2.33 <= 5.0
      const summary = service.calculateSummaryLocally(evaluations);
      expect(summary.currentAverage).toBe(4.0);
      expect(summary.requiredGrade).toBe(2.33);
      expect(summary.isAttainable).toBeTrue();
      expect(summary.status).toBe('Aprobando');
      expect(summary.isPassing).toBeTrue();
    });

    it('caso promedio reprobatorio pero alcanzable: estado "En riesgo"', () => {
      const evaluations: Evaluation[] = [
        { id: 1, name: 'Parcial 1', weight: 20, score: 2.0, createdAt: '', updatedAt: '', subjectId: 1 },
      ];
      // contribution = 0.4, remaining = 80%, currentAverage = 2.0 < 3.0
      // required: (3.0 - 0.4) / 0.8 = 2.6 / 0.8 = 3.25 <= 5.0
      const summary = service.calculateSummaryLocally(evaluations);
      expect(summary.currentAverage).toBe(2.0);
      expect(summary.requiredGrade).toBe(3.25);
      expect(summary.isAttainable).toBeTrue();
      expect(summary.status).toBe('En riesgo');
      expect(summary.isPassing).toBeFalse();
    });

    it('caso nota requerida matemáticamente inalcanzable (> 5.0): estado "En riesgo"', () => {
      const evaluations: Evaluation[] = [
        { id: 1, name: 'Parcial 1', weight: 80, score: 1.0, createdAt: '', updatedAt: '', subjectId: 1 },
      ];
      // contribution = 0.8, remaining = 20%
      // required: (3.0 - 0.8) / 0.2 = 2.2 / 0.2 = 11.0 > 5.0!
      const summary = service.calculateSummaryLocally(evaluations);
      expect(summary.requiredGrade).toBe(11.0);
      expect(summary.isAttainable).toBeFalse();
      expect(summary.status).toBe('En riesgo');
      expect(summary.isPassing).toBeFalse();
    });

    it('caso 100% evaluado con nota reprobada (remainingWeight <= 0): requiredGrade null y status "En riesgo"', () => {
      const evaluations: Evaluation[] = [
        { id: 1, name: 'Final', weight: 100, score: 2.8, createdAt: '', updatedAt: '', subjectId: 1 },
      ];
      const summary = service.calculateSummaryLocally(evaluations);
      expect(summary.remainingWeight).toBe(0);
      expect(summary.requiredGrade).toBeNull();
      expect(summary.isAttainable).toBeFalse();
      expect(summary.status).toBe('En riesgo');
    });

    it('caso porcentaje total supera el 100%: weightExceeded true y remainingWeight negativo', () => {
      const evaluations: Evaluation[] = [
        { id: 1, name: 'Parcial 1', weight: 60, score: 2.0, createdAt: '', updatedAt: '', subjectId: 1 },
        { id: 2, name: 'Parcial 2', weight: 50, score: 1.0, createdAt: '', updatedAt: '', subjectId: 1 },
      ];
      const summary = service.calculateSummaryLocally(evaluations);
      expect(summary.totalWeight).toBe(110);
      expect(summary.remainingWeight).toBe(-10);
      expect(summary.weightExceeded).toBeTrue();
      expect(summary.isAttainable).toBeFalse();
    });
  });

  describe('Simulador Reactivo de Notas (simulateLocally)', () => {
    it('simulación con peso agotado (remainingWeight <= 0) retorna requiredForTarget null y isTargetAttainable false', () => {
      const summary: GradeSummary = {
        totalWeight: 100,
        remainingWeight: 0,
        currentContribution: 2.5,
        currentAverage: 2.5,
        requiredGrade: null,
        isPassing: false,
        isAttainable: false,
        status: 'En riesgo',
        weightExceeded: false,
        passingGrade: 3.0,
        maxGrade: 5.0,
      };

      const res = service.simulateLocally(summary, 4.0, 3.0);

      expect(res.requiredForTarget).toBeNull();
      expect(res.isTargetAttainable).toBeFalse();
      expect(res.hypotheticalFinalGrade).toBeNull();
      expect(res.hypotheticalStatus).toBeNull();
    });

    it('simulación con margen disponible y meta ya lograda por la nota acumulada (requiredForTarget 0.0)', () => {
      const summary: GradeSummary = {
        totalWeight: 70,
        remainingWeight: 30,
        currentContribution: 3.5,
        currentAverage: 5.0,
        requiredGrade: 0.0,
        isPassing: true,
        isAttainable: true,
        status: 'Aprobado',
        weightExceeded: false,
        passingGrade: 3.0,
        maxGrade: 5.0,
      };

      const res = service.simulateLocally(summary, null, 3.0);

      expect(res.requiredForTarget).toBe(0.0);
      expect(res.isTargetAttainable).toBeTrue();
      expect(res.hypotheticalFinalGrade).toBeNull();
    });

    it('simulación con nota hipotética ingresada que resulta en estado "En riesgo" (< 3.0)', () => {
      const summary: GradeSummary = {
        totalWeight: 50,
        remainingWeight: 50,
        currentContribution: 1.0,
        currentAverage: 2.0,
        requiredGrade: 4.0,
        isPassing: false,
        isAttainable: true,
        status: 'En riesgo',
        weightExceeded: false,
        passingGrade: 3.0,
        maxGrade: 5.0,
      };

      // Si saco 2.0 en el 50% restante: 1.0 + (2.0 * 50 / 100) = 2.0 < 3.0 => En riesgo
      const res = service.simulateLocally(summary, 2.0);

      expect(res.requiredForTarget).toBe(4.0);
      expect(res.isTargetAttainable).toBeTrue();
      expect(res.hypotheticalFinalGrade).toBe(2.0);
      expect(res.hypotheticalStatus).toBe('En riesgo');
    });

    it('simulación con valor por defecto de targetGrade (3.0)', () => {
      const summary: GradeSummary = {
        totalWeight: 50,
        remainingWeight: 50,
        currentContribution: 1.5,
        currentAverage: 3.0,
        requiredGrade: 3.0,
        isPassing: true,
        isAttainable: true,
        status: 'Aprobando',
        weightExceeded: false,
        passingGrade: 3.0,
        maxGrade: 5.0,
      };

      // Invocación sin especificar targetGrade -> toma default PASSING_GRADE = 3.0
      const res = service.simulateLocally(summary, 4.0);

      expect(res.requiredForTarget).toBe(3.0);
      expect(res.isTargetAttainable).toBeTrue();
      // 1.5 + (4.0 * 50 / 100) = 3.5 >= 3.0 => Aprobando
      expect(res.hypotheticalFinalGrade).toBe(3.5);
      expect(res.hypotheticalStatus).toBe('Aprobando');
    });
  });

  describe('Función round2 (RNF09)', () => {
    it('debe redondear valores con 2 cifras decimales evitando desbordes de coma flotante', () => {
      expect(round2(0.1 + 0.2)).toBe(0.3);
      expect(round2(2.345)).toBe(2.35);
      expect(round2(2.344)).toBe(2.34);
    });
  });

  describe('Auditoría QA y Caracterización de Defectos (Metricas_Software_F21_F26.docx)', () => {
    it('[DEF-QA-F25-01] Comportamiento caracterizado: calculateSummaryLocally admite evaluaciones con suma > 100%', () => {
      const evaluations: Evaluation[] = [
        { id: 1, name: 'P1', weight: 60, score: 3.0, createdAt: '', updatedAt: '', subjectId: 1 },
        { id: 2, name: 'P2', weight: 60, score: 4.0, createdAt: '', updatedAt: '', subjectId: 1 },
      ];

      const summary = service.calculateSummaryLocally(evaluations);

      // Verificación de defecto QA DEF-QA-F25-01:
      // Se documenta que el método procesa totalWeight = 120% y remainingWeight = -20%
      expect(summary.totalWeight).toBe(120);
      expect(summary.remainingWeight).toBe(-20);
      expect(summary.weightExceeded).toBeTrue();
    });

    it('[DEF-QA-F25-02] Comportamiento caracterizado: simulateLocally ante sobreponderación (remainingWeight < 0)', () => {
      const summary: GradeSummary = {
        totalWeight: 120,
        remainingWeight: -20,
        currentContribution: 4.2,
        currentAverage: 3.5,
        requiredGrade: null,
        isPassing: true,
        isAttainable: false,
        status: 'Aprobando',
        weightExceeded: true,
        passingGrade: 3.0,
        maxGrade: 5.0,
      };

      const res = service.simulateLocally(summary, 4.0, 3.0);

      // Verificación de defecto QA DEF-QA-F25-02:
      // Al ser remainingWeight <= 0, no calcula requiredForTarget ni notas hipotéticas pero no genera error
      expect(res.requiredForTarget).toBeNull();
      expect(res.isTargetAttainable).toBeFalse();
      expect(res.hypotheticalFinalGrade).toBeNull();
    });
  });
});
