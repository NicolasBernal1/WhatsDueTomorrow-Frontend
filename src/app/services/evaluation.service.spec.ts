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
  SimulateGradeDto,
  SimulationResult,
  UpdateEvaluationDto,
} from '../models/evaluation.model';

describe('EvaluationService (F25 Calculadora y simulador de calificaciones)', () => {
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

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  describe('Métodos HTTP', () => {
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

    it('debe consultar GET /subjects/:subjectId/evaluations', () => {
      service.getEvaluationsBySubject(10).subscribe((res) => {
        expect(res.data?.evaluations.length).toBe(1);
        expect(res.data?.summary.status).toBe('Aprobando');
      });

      const req = httpMock.expectOne(`${apiUrl}/subjects/10/evaluations`);
      expect(req.request.method).toBe('GET');
      req.flush({ status: 200, message: 'OK', data: mockListResponse });
    });

    it('debe enviar POST a /subjects/:subjectId/evaluations', () => {
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

    it('debe enviar PATCH a /subjects/:subjectId/evaluations/:id', () => {
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

    it('debe enviar DELETE a /subjects/:subjectId/evaluations/:id', () => {
      service.deleteEvaluation(10, 1).subscribe((res) => {
        expect(res.status).toBe(200);
      });

      const req = httpMock.expectOne(`${apiUrl}/subjects/10/evaluations/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ status: 200, message: 'Deleted', data: mockListResponse });
    });

    it('debe enviar POST a /subjects/:subjectId/evaluations/simulate', () => {
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

  describe('Cálculos reactivos locales (RNF09 < 200ms)', () => {
    it('debe manejar lista vacía con estado "Sin calificaciones"', () => {
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

    it('debe calcular promedio ponderado y nota requerida cuando se está aprobando', () => {
      const evaluations: Evaluation[] = [
        {
          id: 1,
          name: 'Parcial 1',
          weight: 40,
          score: 4.0,
          createdAt: '',
          updatedAt: '',
          subjectId: 1,
        },
      ];
      // contribution = 4.0 * 0.40 = 1.60
      // remaining = 60%
      // required for 3.0 = (3.0 - 1.60) / 0.60 = 1.40 / 0.60 = 2.33
      const summary = service.calculateSummaryLocally(evaluations);
      expect(summary.totalWeight).toBe(40);
      expect(summary.remainingWeight).toBe(60);
      expect(summary.currentContribution).toBe(1.6);
      expect(summary.currentAverage).toBe(4.0);
      expect(summary.requiredGrade).toBe(2.33);
      expect(summary.isAttainable).toBeTrue();
      expect(summary.status).toBe('Aprobando');
      expect(summary.weightExceeded).toBeFalse();
    });

    it('debe marcar estado "Aprobado" cuando la contribución acumulada alcanza o supera 3.0', () => {
      const evaluations: Evaluation[] = [
        {
          id: 1,
          name: 'Corte 1',
          weight: 35,
          score: 4.8,
          createdAt: '',
          updatedAt: '',
          subjectId: 1,
        },
        {
          id: 2,
          name: 'Corte 2',
          weight: 35,
          score: 4.5,
          createdAt: '',
          updatedAt: '',
          subjectId: 1,
        },
      ];
      // contribution = (4.8 * 35)/100 + (4.5 * 35)/100 = 1.68 + 1.575 = 3.255 -> 3.26 >= 3.0
      const summary = service.calculateSummaryLocally(evaluations);
      expect(summary.currentContribution).toBe(3.26);
      expect(summary.requiredGrade).toBe(0.0);
      expect(summary.status).toBe('Aprobado');
      expect(summary.isPassing).toBeTrue();
    });

    it('debe detectar nota requerida inalcanzable (> 5.0) y marcar estado "En riesgo"', () => {
      const evaluations: Evaluation[] = [
        {
          id: 1,
          name: 'Corte 1',
          weight: 80,
          score: 1.0,
          createdAt: '',
          updatedAt: '',
          subjectId: 1,
        },
      ];
      // contribution = 0.8
      // remaining = 20%
      // required for 3.0 = (3.0 - 0.8) / 0.20 = 2.2 / 0.2 = 11.0 > 5.0!
      const summary = service.calculateSummaryLocally(evaluations);
      expect(summary.requiredGrade).toBe(11.0);
      expect(summary.isAttainable).toBeFalse();
      expect(summary.status).toBe('En riesgo');
    });

    it('debe detectar cuando el porcentaje total excede el 100% (RF25)', () => {
      const evaluations: Evaluation[] = [
        {
          id: 1,
          name: 'Corte 1',
          weight: 60,
          score: 2.0,
          createdAt: '',
          updatedAt: '',
          subjectId: 1,
        },
        {
          id: 2,
          name: 'Corte 2',
          weight: 50,
          score: 1.0,
          createdAt: '',
          updatedAt: '',
          subjectId: 1,
        },
      ];
      const summary = service.calculateSummaryLocally(evaluations);
      expect(summary.totalWeight).toBe(110);
      expect(summary.remainingWeight).toBe(-10);
      expect(summary.weightExceeded).toBeTrue();
      expect(summary.isAttainable).toBeFalse();
    });

    it('debe simular escenarios hipotéticos localmente con simulateLocally', () => {
      const summary = service.calculateSummaryLocally([
        {
          id: 1,
          name: 'Corte 1',
          weight: 50,
          score: 3.0,
          createdAt: '',
          updatedAt: '',
          subjectId: 1,
        },
      ]);
      // contribution = 1.5, remaining = 50%
      // hypothetical score 4.0 on remaining 50%:
      // hypothetical final = 1.5 + (4.0 * 50 / 100) = 3.5
      const sim = service.simulateLocally(summary, 4.0, 3.8);
      expect(sim.hypotheticalFinalGrade).toBe(3.5);
      expect(sim.hypotheticalStatus).toBe('Aprobando');
      // required for target 3.8: (3.8 - 1.5) / 0.50 = 4.60
      expect(sim.requiredForTarget).toBe(4.6);
      expect(sim.isTargetAttainable).toBeTrue();
    });
  });

  describe('Función round2 (RNF09)', () => {
    it('debe redondear correctamente evitando fallas de coma flotante', () => {
      expect(round2(0.1 + 0.2)).toBe(0.3);
      expect(round2(2.345)).toBe(2.35);
      expect(round2(2.344)).toBe(2.34);
    });
  });
});
