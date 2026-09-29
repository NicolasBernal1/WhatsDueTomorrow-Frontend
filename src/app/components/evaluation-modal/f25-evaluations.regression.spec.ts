import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import {
  EvaluationModalComponent,
  nonWhitespaceValidator,
} from './evaluation-modal.component';
import { EvaluationService, round2 } from '../../services/evaluation.service';
import { Evaluation } from '../../models/evaluation.model';
import { Should } from '../../common/fluent-assertions';

/**
 * ============================================================================
 * SUITE DE PRUEBAS DE REGRESIÓN — F25: PROMEDIO PONDERADO Y SIMULADOR
 * ============================================================================
 * Objetivo de Regresión:
 * Garantizar que modificaciones futuras en los validadores de notas y pesos,
 * el cálculo reactivo instantáneo (RNF09), la proyección en tiempo real de
 * aportes o la simulación de notas hipotéticas no introduzcan errores de punto
 * flotante, bloqueos de formularios ni estados inconsistentes en la UI.
 */
describe('F25 Regression Suite: Promedio ponderado y simulador de calificaciones (Frontend)', () => {
  let component: EvaluationModalComponent;
  let fixture: ComponentFixture<EvaluationModalComponent>;
  let evaluationService: EvaluationService;
  let evaluationServiceMock: jasmine.SpyObj<EvaluationService>;

  const mockEvaluation: Evaluation = {
    id: 51,
    name: 'Parcial 1: Autómatas',
    weight: 25,
    score: 4.2,
    createdAt: '2026-03-15T10:00:00Z',
    updatedAt: '2026-03-15T10:00:00Z',
    subjectId: 7,
  };

  beforeEach(async () => {
    evaluationServiceMock = jasmine.createSpyObj('EvaluationService', [
      'createEvaluation',
      'updateEvaluation',
      'getEvaluationsBySubject',
      'deleteEvaluation',
      'simulateGrade',
    ]);

    await TestBed.configureTestingModule({
      imports: [EvaluationModalComponent, ReactiveFormsModule],
      providers: [
        EvaluationService,
        { provide: EvaluationService, useValue: evaluationServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(EvaluationModalComponent, '<div></div>')
      .compileComponents();

    fixture = TestBed.createComponent(EvaluationModalComponent);
    component = fixture.componentInstance;
    component.subjectId = 7;
    component.currentTotalWeight = 40;

    // Instancia real del servicio para probar algoritmos locales puros
    evaluationService = new EvaluationService(null as any);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // INVARIANTE 1: Validación Reactiva y Rangos Estrictos de Dominio
  // ──────────────────────────────────────────────────────────────────────────
  describe('Invariante de Regresión 1: Validación de Rangos (weight: 1..100, score: 0..5)', () => {
    it('debe invalidar el formulario si el peso o la nota están fuera de sus límites matemáticos', () => {
      fixture.detectChanges();

      // Peso < 1
      component.evaluationForm.patchValue({ name: 'Quiz', weight: 0, score: 3.5 });
      component.evaluationForm.get('weight')?.invalid.Should().BeTrue();

      // Peso > 100
      component.evaluationForm.patchValue({ name: 'Quiz', weight: 101, score: 3.5 });
      component.evaluationForm.get('weight')?.invalid.Should().BeTrue();

      // Nota < 0
      component.evaluationForm.patchValue({ name: 'Quiz', weight: 20, score: -0.1 });
      component.evaluationForm.get('score')?.invalid.Should().BeTrue();

      // Nota > 5
      component.evaluationForm.patchValue({ name: 'Quiz', weight: 20, score: 5.1 });
      component.evaluationForm.get('score')?.invalid.Should().BeTrue();
    });

    it('debe rechazar nombres vacíos o que solo contienen espacios con nonWhitespaceValidator', () => {
      const res = nonWhitespaceValidator({ value: '    ' } as any);
      Should(res).NotBeNull();
      Should(res?.['required']).BeTrue();

      fixture.detectChanges();
      component.evaluationForm.patchValue({ name: '   ', weight: 20, score: 4.0 });
      component.onSave();

      Should(evaluationServiceMock.createEvaluation).NotHaveBeenCalled();
      component.isSubmitting.Should().BeFalse();
      component.evaluationForm.get('name')?.touched.Should().BeTrue();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // INVARIANTE 2: Proyección Reactiva en Tiempo Real (Getters)
  // ──────────────────────────────────────────────────────────────────────────
  describe('Invariante de Regresión 2: Getters Reactivos de Aporte y Peso Proyectado', () => {
    it('debe calcular en tiempo real calculatedContribution = (score * weight) / 100', () => {
      fixture.detectChanges();

      component.evaluationForm.patchValue({ weight: 30, score: 4.5 });
      // (4.5 * 30) / 100 = 1.35
      component.calculatedContribution.Should().Be(1.35);

      component.evaluationForm.patchValue({ weight: -5, score: 4.0 });
      component.calculatedContribution.Should().Be(0);
    });

    it('debe calcular projectedTotalWeight considerando el peso previo en modo edición', () => {
      component.currentTotalWeight = 60;
      component.evaluation = mockEvaluation; // peso previo = 25
      fixture.detectChanges();

      // Nuevo peso 35 -> 60 - 25 + 35 = 70
      component.evaluationForm.patchValue({ weight: 35 });
      component.projectedTotalWeight.Should().Be(70);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // INVARIANTE 3: Flujos de Creación, Edición y Emisión de Eventos
  // ──────────────────────────────────────────────────────────────────────────
  describe('Invariante de Regresión 3: Creación y Edición con Notificación al Contenedor', () => {
    it('en creación: debe emitir save y close tras respuesta HTTP exitosa', () => {
      fixture.detectChanges();
      const saveSpy = spyOn(component.save, 'emit');
      const closeSpy = spyOn(component.close, 'emit');

      evaluationServiceMock.createEvaluation.and.returnValue(
        of({ status: 201, message: 'OK', data: {} as any })
      );

      component.evaluationForm.patchValue({
        name: '   Laboratorio 1   ',
        weight: '20',
        score: '4.8',
      });

      component.onSave();

      Should(evaluationServiceMock.createEvaluation).HaveBeenCalledWith(7, {
        name: 'Laboratorio 1',
        weight: 20,
        score: 4.8,
      });
      component.isSubmitting.Should().BeFalse();
      Should(saveSpy).HaveBeenCalled();
      Should(closeSpy).HaveBeenCalled();
    });

    it('en edición: debe inicializar con datos existentes y emitir updateEvaluation con ID correcto', () => {
      component.evaluation = mockEvaluation;
      fixture.detectChanges();

      component.evaluationForm.value.name.Should().Be(mockEvaluation.name);
      component.evaluationForm.value.weight.Should().Be(mockEvaluation.weight);
      component.evaluationForm.value.score.Should().Be(mockEvaluation.score);

      const saveSpy = spyOn(component.save, 'emit');
      const closeSpy = spyOn(component.close, 'emit');

      evaluationServiceMock.updateEvaluation.and.returnValue(
        of({ status: 200, message: 'OK', data: {} as any })
      );

      component.evaluationForm.patchValue({ score: 4.8 });
      component.onSave();

      Should(evaluationServiceMock.updateEvaluation).HaveBeenCalledWith(7, 51, {
        name: mockEvaluation.name,
        weight: 25,
        score: 4.8,
      });
      Should(saveSpy).HaveBeenCalled();
      Should(closeSpy).HaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // INVARIANTE 4: Resiliencia ante Fallos de Servidor (Error 500)
  // ──────────────────────────────────────────────────────────────────────────
  describe('Invariante de Regresión 4: Resiliencia ante Errores de Red', () => {
    it('debe desactivar isSubmitting y mostrar mensaje de error si el backend falla', () => {
      fixture.detectChanges();
      evaluationServiceMock.createEvaluation.and.returnValue(
        throwError(() => new Error('Error 500'))
      );

      component.evaluationForm.patchValue({
        name: 'Examen Final',
        weight: 40,
        score: 3.0,
      });

      component.onSave();

      component.isSubmitting.Should().BeFalse();
      component.errorMessage.Should().Be('No fue posible registrar la evaluación.');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // INVARIANTE 5: Algoritmos de Cálculo y Simulación Local (EvaluationService)
  // ──────────────────────────────────────────────────────────────────────────
  describe('Invariante de Regresión 5: Algoritmo Local de Promedio y Simulación (calculateSummaryLocally & simulateLocally)', () => {
    it('debe calcular idénticamente el resumen de notas localmente en cliente sin latencia (RNF09)', () => {
      const items: Evaluation[] = [
        { id: 1, name: 'Taller', weight: 40, score: 4.5, createdAt: '', updatedAt: '', subjectId: 1 },
        { id: 2, name: 'Quiz', weight: 20, score: 3.0, createdAt: '', updatedAt: '', subjectId: 1 },
      ];

      const summary = evaluationService.calculateSummaryLocally(items);

      // totalWeight = 60, aporte = 4.5*0.4 + 3.0*0.2 = 1.8 + 0.6 = 2.4
      summary.totalWeight.Should().Be(60);
      summary.remainingWeight.Should().Be(40);
      summary.currentContribution.Should().Be(2.4);
      summary.currentAverage.Should().Be(4.0);
      // Para 3.0 en el 40% restante: (3.0 - 2.4)*100 / 40 = 1.5
      Should(summary.requiredGrade).Be(1.5);
      summary.status.Should().Be('Aprobando');
      summary.isAttainable.Should().BeTrue();
    });

    it('debe simular notas hipotéticas y metas personalizadas sin divisiones por cero', () => {
      const summary = evaluationService.calculateSummaryLocally([
        { id: 1, name: 'Parcial', weight: 50, score: 2.0, createdAt: '', updatedAt: '', subjectId: 1 }, // Aporte = 1.0, falta 50%
      ]);

      // Meta personalizada de 3.5 con nota hipotética de 4.0 en el 50% restante
      const sim = evaluationService.simulateLocally(summary, 4.0, 3.5);

      // (3.5 - 1.0)*100 / 50 = 5.0
      Should(sim.requiredForTarget).Be(5.0);
      sim.isTargetAttainable.Should().BeTrue();

      // aporte simulado = 1.0 + (4.0 * 50)/100 = 1.0 + 2.0 = 3.0
      Should(sim.hypotheticalFinalGrade).Be(3.0);
      Should(sim.hypotheticalStatus).Be('Aprobando');
    });
  });
});
