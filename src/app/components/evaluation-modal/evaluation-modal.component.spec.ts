import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { EvaluationModalComponent } from './evaluation-modal.component';
import { EvaluationService } from '../../services/evaluation.service';
import { Evaluation } from '../../models/evaluation.model';

describe('EvaluationModalComponent (F25 Calculadora y simulador)', () => {
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

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe inicializarse con formulario inválido cuando está vacío', () => {
    expect(component.evaluationForm.valid).toBeFalse();
  });

  it('debe validar formulario como válido con campos válidos', () => {
    component.evaluationForm.patchValue({
      name: 'Taller 1',
      weight: 20,
      score: 4.2,
    });
    expect(component.evaluationForm.valid).toBeTrue();
  });

  it('debe rechazar nombres vacíos o que solo contengan espacios', () => {
    component.evaluationForm.patchValue({
      name: '   ',
      weight: 20,
      score: 4.0,
    });
    expect(component.evaluationForm.valid).toBeFalse();
    expect(component.evaluationForm.get('name')?.hasError('required')).toBeTrue();
  });

  it('debe validar rango de porcentaje ponderado (1% a 100%)', () => {
    component.evaluationForm.patchValue({ name: 'Quiz', score: 3.5 });

    component.evaluationForm.patchValue({ weight: 0 });
    expect(component.evaluationForm.get('weight')?.hasError('min')).toBeTrue();

    component.evaluationForm.patchValue({ weight: 101 });
    expect(component.evaluationForm.get('weight')?.hasError('max')).toBeTrue();

    component.evaluationForm.patchValue({ weight: 25 });
    expect(component.evaluationForm.get('weight')?.valid).toBeTrue();
  });

  it('debe validar rango de calificación (0.0 a 5.0)', () => {
    component.evaluationForm.patchValue({ name: 'Quiz', weight: 15 });

    component.evaluationForm.patchValue({ score: -0.1 });
    expect(component.evaluationForm.get('score')?.hasError('min')).toBeTrue();

    component.evaluationForm.patchValue({ score: 5.1 });
    expect(component.evaluationForm.get('score')?.hasError('max')).toBeTrue();

    component.evaluationForm.patchValue({ score: 4.0 });
    expect(component.evaluationForm.get('score')?.valid).toBeTrue();
  });

  it('debe calcular correctamente el aporte de puntos a la nota definitiva', () => {
    component.evaluationForm.patchValue({ weight: 20, score: 4.5 });
    expect(component.calculatedContribution).toBe(0.9);

    component.evaluationForm.patchValue({ weight: 33.33, score: 3.0 });
    expect(component.calculatedContribution).toBe(1.0);
  });

  it('debe proyectar el porcentaje total acumulado correctamente en creación y edición', () => {
    // Current total weight is 40
    component.evaluationForm.patchValue({ weight: 25 });
    expect(component.projectedTotalWeight).toBe(65);

    // In edit mode replacing an existing 25% evaluation with 30%
    component.evaluation = mockEvaluation; // weight is 25
    component.evaluationForm.patchValue({ weight: 30 });
    // 40 - 25 + 30 = 45
    expect(component.projectedTotalWeight).toBe(45);
  });

  it('debe precargar los datos de la evaluación en modo edición', () => {
    component.evaluation = mockEvaluation;
    component.ngOnInit();

    expect(component.evaluationForm.get('name')?.value).toBe('Parcial 1');
    expect(component.evaluationForm.get('weight')?.value).toBe(25);
    expect(component.evaluationForm.get('score')?.value).toBe(4.5);
  });

  it('NO debe llamar al servicio si el formulario es inválido al guardar', () => {
    component.onSave();
    expect(evaluationServiceMock.createEvaluation).not.toHaveBeenCalled();
    expect(evaluationServiceMock.updateEvaluation).not.toHaveBeenCalled();
  });

  it('debe llamar a createEvaluation y emitir eventos save y close en modo creación', () => {
    evaluationServiceMock.createEvaluation.and.returnValue(
      of(mockEvaluationResponse),
    );
    spyOn(component.save, 'emit');
    spyOn(component.close, 'emit');

    component.evaluationForm.patchValue({
      name: 'Parcial 1',
      weight: 25,
      score: 4.5,
    });
    component.onSave();

    expect(evaluationServiceMock.createEvaluation).toHaveBeenCalledWith(10, {
      name: 'Parcial 1',
      weight: 25,
      score: 4.5,
    });
    expect(component.save.emit).toHaveBeenCalled();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('debe llamar a updateEvaluation y emitir eventos en modo edición', () => {
    component.evaluation = mockEvaluation;
    component.ngOnInit();

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
    expect(component.save.emit).toHaveBeenCalled();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('debe manejar errores del servicio al guardar', () => {
    evaluationServiceMock.createEvaluation.and.returnValue(
      throwError(() => new Error('Error de red')),
    );
    component.evaluationForm.patchValue({
      name: 'Parcial con error',
      weight: 20,
      score: 3.5,
    });
    component.onSave();

    expect(component.isSubmitting).toBeFalse();
    expect(component.errorMessage).toBe('No fue posible registrar la evaluación.');
  });

  it('debe emitir close al invocar onClose', () => {
    spyOn(component.close, 'emit');
    component.onClose();
    expect(component.close.emit).toHaveBeenCalled();
  });
});
