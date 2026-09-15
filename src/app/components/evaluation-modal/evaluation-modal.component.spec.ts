import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { EvaluationModalComponent } from './evaluation-modal.component';
import { EvaluationService } from '../../services/evaluation.service';
import { Evaluation } from '../../models/evaluation.model';

describe('EvaluationModalComponent (F25 — Caminos Básicos Frontend Tabla 37)', () => {
  let component: EvaluationModalComponent;
  let fixture: ComponentFixture<EvaluationModalComponent>;
  let evaluationServiceMock: jasmine.SpyObj<EvaluationService>;

  const mockEvaluation: Evaluation = {
    id: 1,
    name: 'Parcial 1',
    weight: 25,
    score: 4.5,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
    subjectId: 10,
  };

  const mockEvaluationResponse = {
    status: 200,
    message: 'Success',
    data: {
      evaluations: [mockEvaluation],
      summary: {
        totalWeight: 25,
        remainingWeight: 75,
        currentContribution: 1.12,
        currentAverage: 4.5,
        requiredGrade: 2.51,
        isPassing: true,
        isAttainable: true,
        status: 'Aprobando' as const,
        weightExceeded: false,
        passingGrade: 3.0,
        maxGrade: 5.0,
      },
    },
  };

  beforeEach(async () => {
    evaluationServiceMock = jasmine.createSpyObj('EvaluationService', [
      'createEvaluation',
      'updateEvaluation',
    ]);

    await TestBed.configureTestingModule({
      imports: [EvaluationModalComponent, ReactiveFormsModule],
      providers: [
        { provide: EvaluationService, useValue: evaluationServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(EvaluationModalComponent);
    component = fixture.componentInstance;
    component.subjectId = 10;
    component.currentTotalWeight = 40;
    fixture.detectChanges();
  });

  it('debe instanciarse correctamente', () => {
    expect(component).toBeTruthy();
  });

  describe('Cierre y Cancelación del Modal (P2: 1 → 2 → 3 → 5 → 6 → 21 → 22)', () => {
    it('[P2] debe emitir el evento close al invocar onClose sin mutar estado', () => {
      spyOn(component.close, 'emit');
      component.onClose();
      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('Validación Reactiva de Formulario (P6: 1 → 2 → 3 → 5 → 6 → 10 → 12 → 22)', () => {
    it('[P6] formulario vacío debe ser inválido e impedir llamada a servicio ejecutando markAllAsTouched()', () => {
      expect(component.evaluationForm.valid).toBeFalse();
      spyOn(component.evaluationForm, 'markAllAsTouched');

      component.onSave();

      expect(component.evaluationForm.markAllAsTouched).toHaveBeenCalled();
      expect(evaluationServiceMock.createEvaluation).not.toHaveBeenCalled();
      expect(evaluationServiceMock.updateEvaluation).not.toHaveBeenCalled();
    });

    it('[P6] debe rechazar nombres vacíos o formados únicamente por espacios en blanco', () => {
      component.evaluationForm.patchValue({
        name: '   ',
        weight: 20,
        score: 4.0,
      });
      expect(component.evaluationForm.valid).toBeFalse();
      expect(component.evaluationForm.get('name')?.hasError('required')).toBeTrue();
    });

    it('[P6] debe validar rango de porcentaje ponderado (1% a 100%)', () => {
      component.evaluationForm.patchValue({ name: 'Quiz', score: 3.5 });

      component.evaluationForm.patchValue({ weight: 0 });
      expect(component.evaluationForm.get('weight')?.hasError('min')).toBeTrue();

      component.evaluationForm.patchValue({ weight: 101 });
      expect(component.evaluationForm.get('weight')?.hasError('max')).toBeTrue();

      component.evaluationForm.patchValue({ weight: 25 });
      expect(component.evaluationForm.get('weight')?.valid).toBeTrue();
    });

    it('[P6] debe validar rango de calificación (0.0 a 5.0)', () => {
      component.evaluationForm.patchValue({ name: 'Quiz', weight: 15 });

      component.evaluationForm.patchValue({ score: -0.1 });
      expect(component.evaluationForm.get('score')?.hasError('min')).toBeTrue();

      component.evaluationForm.patchValue({ score: 5.1 });
      expect(component.evaluationForm.get('score')?.hasError('max')).toBeTrue();

      component.evaluationForm.patchValue({ score: 4.0 });
      expect(component.evaluationForm.get('score')?.valid).toBeTrue();
    });

    it('[P6] debe calcular el aporte a la nota definitiva según peso y nota ingresados', () => {
      component.evaluationForm.patchValue({ weight: 20, score: 4.5 });
      expect(component.calculatedContribution).toBe(0.9);

      component.evaluationForm.patchValue({ weight: 33.33, score: 3.0 });
      expect(component.calculatedContribution).toBe(1.0);

      // Si los campos son inválidos o NaN, debe retornar 0
      component.evaluationForm.patchValue({ weight: '', score: '' });
      expect(component.calculatedContribution).toBe(0);
    });
  });

  describe('Modo Edición: Actualización Exitosa (P7: 10 → 13 → 14 → 18 → 20 → 22)', () => {
    it('[P7] debe precargar datos, invocar updateEvaluation y emitir save y close al completar con éxito', () => {
      component.evaluation = mockEvaluation;
      component.ngOnInit();

      expect(component.evaluationForm.get('name')?.value).toBe('Parcial 1');
      expect(component.evaluationForm.get('weight')?.value).toBe(25);
      expect(component.evaluationForm.get('score')?.value).toBe(4.5);

      evaluationServiceMock.updateEvaluation.and.returnValue(
        of(mockEvaluationResponse),
      );
      spyOn(component.save, 'emit');
      spyOn(component.close, 'emit');

      component.evaluationForm.patchValue({
        name: 'Parcial 1 Editado',
        weight: 30,
        score: 4.8,
      });
      component.onSave();

      expect(evaluationServiceMock.updateEvaluation).toHaveBeenCalledWith(10, 1, {
        name: 'Parcial 1 Editado',
        weight: 30,
        score: 4.8,
      });
      expect(component.isSubmitting).toBeFalse();
      expect(component.save.emit).toHaveBeenCalled();
      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('Modo Edición: Error HTTP (P8: 10 → 13 → 14 → 18 → 19 → 22)', () => {
    it('[P8] debe manejar error HTTP en updateEvaluation, asignar errorMessage y no emitir eventos', () => {
      component.evaluation = mockEvaluation;
      component.ngOnInit();

      evaluationServiceMock.updateEvaluation.and.returnValue(
        throwError(() => new Error('Error al actualizar en backend')),
      );
      spyOn(component.save, 'emit');
      spyOn(component.close, 'emit');

      component.evaluationForm.patchValue({
        name: 'Parcial Fallido',
        weight: 25,
        score: 4.0,
      });
      component.onSave();

      expect(component.isSubmitting).toBeFalse();
      expect(component.errorMessage).toBe('No fue posible actualizar la evaluación.');
      expect(component.save.emit).not.toHaveBeenCalled();
      expect(component.close.emit).not.toHaveBeenCalled();
    });
  });

  describe('Modo Creación: Creación Exitosa (P9: 10 → 13 → 17 → 18 → 20 → 22)', () => {
    it('[P9] debe invocar createEvaluation y emitir save y close en modo creación', () => {
      component.evaluation = null;
      evaluationServiceMock.createEvaluation.and.returnValue(
        of(mockEvaluationResponse),
      );
      spyOn(component.save, 'emit');
      spyOn(component.close, 'emit');

      component.evaluationForm.patchValue({
        name: 'Taller 1',
        weight: 20,
        score: 4.0,
      });
      component.onSave();

      expect(evaluationServiceMock.createEvaluation).toHaveBeenCalledWith(10, {
        name: 'Taller 1',
        weight: 20,
        score: 4.0,
      });
      expect(component.isSubmitting).toBeFalse();
      expect(component.save.emit).toHaveBeenCalled();
      expect(component.close.emit).toHaveBeenCalled();
    });

    it('[P9] debe manejar error HTTP en createEvaluation asignando errorMessage', () => {
      component.evaluation = null;
      evaluationServiceMock.createEvaluation.and.returnValue(
        throwError(() => new Error('Error en servidor')),
      );
      spyOn(component.save, 'emit');

      component.evaluationForm.patchValue({
        name: 'Quiz 2',
        weight: 15,
        score: 3.5,
      });
      component.onSave();

      expect(component.isSubmitting).toBeFalse();
      expect(component.errorMessage).toBe('No fue posible registrar la evaluación.');
      expect(component.save.emit).not.toHaveBeenCalled();
    });
  });

  describe('Auditoría QA y Caracterización de Defectos (Metricas_Software_F21_F26.docx)', () => {
    it('[DEF-QA-F25-01] Comportamiento caracterizado: El formulario proyecta porcentaje total mayor al 100% sin bloquear la acción', () => {
      // currentTotalWeight acumulado es 60%
      component.currentTotalWeight = 60;
      // Usuario ingresa una evaluación individual de 50% (50 <= 100 individual)
      component.evaluationForm.patchValue({
        name: 'Parcial Mayoritario',
        weight: 50,
        score: 4.0,
      });

      // Verificación de defecto QA DEF-QA-F25-01:
      // projectedTotalWeight alcanza 110% (superando el 100% permitido), pero evaluationForm.valid sigue siendo true
      expect(component.projectedTotalWeight).toBe(110);
      expect(component.evaluationForm.valid).toBeTrue();
    });
  });
});
