import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SubjectDetailsComponent } from './subject-details.component';
import { SubjectService } from '../../services/subject.service';
import { AssignmentService } from '../../services/assignment.service';
import { NoteService } from '../../services/note.service';
import { EvaluationService } from '../../services/evaluation.service';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Note } from '../../models/note.model';
import { Evaluation, GradeSummary } from '../../models/evaluation.model';

describe('SubjectDetailsComponent (F24 & F25)', () => {
  let component: SubjectDetailsComponent;
  let fixture: ComponentFixture<SubjectDetailsComponent>;
  let subjectServiceMock: jasmine.SpyObj<SubjectService>;
  let assignmentServiceMock: jasmine.SpyObj<AssignmentService>;
  let noteServiceMock: jasmine.SpyObj<NoteService>;
  let evaluationServiceMock: jasmine.SpyObj<EvaluationService>;

  const mockSubject = {
    id: 10,
    name: 'Cálculo Diferencial',
    professor: 'Prof. Gauss',
    color: '#3b82f6',
    credits: 4,
  };

  const mockNotes: Note[] = [
    {
      id: 1,
      title: 'Regla de la Cadena',
      content: "(f o g)'(x) = f'(g(x)) * g'(x)",
      linkUrl: 'https://calculo.edu/cadena',
      createdAt: '2026-03-01T10:00:00Z',
      updatedAt: '2026-03-01T10:00:00Z',
      subjectId: 10,
    },
  ];

  const mockEvaluations: Evaluation[] = [
    {
      id: 1,
      name: 'Parcial 1',
      weight: 30,
      score: 4.0,
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
      subjectId: 10,
    },
  ];

  const mockSummary: GradeSummary = {
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
  };

  beforeEach(async () => {
    subjectServiceMock = jasmine.createSpyObj('SubjectService', [
      'getSubjectById',
    ]);
    assignmentServiceMock = jasmine.createSpyObj('AssignmentService', [
      'getAssignmentsBySubject',
      'deleteAssignment',
    ]);
    noteServiceMock = jasmine.createSpyObj('NoteService', [
      'getNotesBySubject',
      'deleteNote',
    ]);
    evaluationServiceMock = jasmine.createSpyObj('EvaluationService', [
      'getEvaluationsBySubject',
      'deleteEvaluation',
      'calculateSummaryLocally',
      'simulateLocally',
    ]);

    subjectServiceMock.getSubjectById.and.returnValue(
      of({ status: 200, message: 'ok', data: mockSubject }),
    );
    assignmentServiceMock.getAssignmentsBySubject.and.returnValue(
      of({ status: 200, message: 'ok', data: [] }),
    );
    noteServiceMock.getNotesBySubject.and.returnValue(
      of({ status: 200, message: 'ok', data: mockNotes }),
    );
    evaluationServiceMock.getEvaluationsBySubject.and.returnValue(
      of({
        status: 200,
        message: 'ok',
        data: {
          evaluations: mockEvaluations,
          summary: mockSummary,
        },
      }),
    );
    evaluationServiceMock.calculateSummaryLocally.and.returnValue(mockSummary);
    evaluationServiceMock.simulateLocally.and.returnValue({
      requiredForTarget: 2.57,
      isTargetAttainable: true,
      hypotheticalFinalGrade: 3.86,
      hypotheticalStatus: 'Aprobando',
    });

    await TestBed.configureTestingModule({
      imports: [SubjectDetailsComponent],
      providers: [
        { provide: SubjectService, useValue: subjectServiceMock },
        { provide: AssignmentService, useValue: assignmentServiceMock },
        { provide: NoteService, useValue: noteServiceMock },
        { provide: EvaluationService, useValue: evaluationServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? '10' : null),
              },
            },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SubjectDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse y cargar datos de asignatura, tareas, notas y evaluaciones al inicializar', () => {
    expect(component).toBeTruthy();
    expect(subjectServiceMock.getSubjectById).toHaveBeenCalledWith(10);
    expect(assignmentServiceMock.getAssignmentsBySubject).toHaveBeenCalledWith(10);
    expect(noteServiceMock.getNotesBySubject).toHaveBeenCalledWith(10);
    expect(evaluationServiceMock.getEvaluationsBySubject).toHaveBeenCalledWith(10);
    expect(component.notes.length).toBe(1);
    expect(component.evaluations.length).toBe(1);
    expect(component.gradeSummary?.status).toBe('Aprobando');
  });

  describe('F24 Bitácora de apuntes y recursos rápidos por asignatura (Tabla 25)', () => {
    // Camino P1: 1-2-3-4-6-7-22
    it('Camino P1 (1-2-3-4-6-7-22): debe asignar noteError y finalizar loadingNotes cuando getNotesBySubject falla', () => {
      noteServiceMock.getNotesBySubject.and.returnValue(
        throwError(() => new Error('Error HTTP 500 al cargar notas')),
      );

      component.loadNotes(10);

      expect(component.noteError).toBe('Error al cargar los apuntes de la asignatura');
      expect(component.loadingNotes).toBeFalse();
    });

    // Camino P2: 1-2-3-5-6-7-22
    it('Camino P2 (1-2-3-5-6-7-22): debe asignar la lista de notas y limpiar loadingNotes en consulta exitosa', () => {
      noteServiceMock.getNotesBySubject.and.returnValue(
        of({ status: 200, message: 'ok', data: mockNotes }),
      );

      component.loadNotes(10);

      expect(component.notes).toEqual(mockNotes);
      expect(component.loadingNotes).toBeFalse();
      expect(component.noteError).toBe('');
    });

    it('debe abrir el modal de nota en modo creación', () => {
      component.openNoteModal();
      expect(component.showNoteModal).toBeTrue();
      expect(component.selectedNote).toBeNull();
    });

    it('debe abrir el modal de nota en modo edición con la nota seleccionada', () => {
      component.editNote(mockNotes[0]);
      expect(component.showNoteModal).toBeTrue();
      expect(component.selectedNote).toEqual(mockNotes[0]);
    });

    it('debe cerrar el modal de nota y reiniciar la selección', () => {
      component.openNoteModal(mockNotes[0]);
      component.closeNoteModal();
      expect(component.showNoteModal).toBeFalse();
      expect(component.selectedNote).toBeNull();
    });

    it('debe recargar los apuntes y cerrar el modal tras guardar un apunte', () => {
      spyOn(component, 'loadNotes');
      component.openNoteModal();
      component.onNoteSaved();

      expect(component.loadNotes).toHaveBeenCalledWith(10);
      expect(component.showNoteModal).toBeFalse();
    });

    // Camino P9: 1-2-3-5-6-7-10-11-6-7-22
    it('Camino P9 (1-2-3-5-6-7-10-11-6-7-22): NO debe eliminar la nota si el usuario cancela la confirmación', () => {
      spyOn(window, 'confirm').and.returnValue(false);

      component.deleteNote(mockNotes[0]);

      expect(window.confirm).toHaveBeenCalled();
      expect(noteServiceMock.deleteNote).not.toHaveBeenCalled();
    });

    // Camino P10: 1-2-3-5-6-7-10-11-12-6-7-22
    it('Camino P10 (1-2-3-5-6-7-10-11-12-6-7-22): debe capturar el error de eliminación en consola y no recargar la lista', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      noteServiceMock.deleteNote.and.returnValue(
        throwError(() => new Error('Error al borrar nota')),
      );
      spyOn(console, 'error');
      spyOn(component, 'loadNotes');

      component.deleteNote(mockNotes[0]);

      expect(noteServiceMock.deleteNote).toHaveBeenCalledWith(10, 1);
      expect(console.error).toHaveBeenCalled();
      expect(component.loadNotes).not.toHaveBeenCalled();
    });

    // Camino P11: 1-2-3-5-6-7-10-11-12-2-3-5-6-7-22
    it('Camino P11 (1-2-3-5-6-7-10-11-12-2-3-5-6-7-22): debe solicitar confirmación y recargar la lista si DELETE responde 200 OK', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      noteServiceMock.deleteNote.and.returnValue(
        of({ status: 200, message: 'deleted', data: null }),
      );
      spyOn(component, 'loadNotes');

      component.deleteNote(mockNotes[0]);

      expect(window.confirm).toHaveBeenCalled();
      expect(noteServiceMock.deleteNote).toHaveBeenCalledWith(10, 1);
      expect(component.loadNotes).toHaveBeenCalledWith(10);
    });

    // Verificación de Defecto QA DEF-QA-F24-02
    it('[DEF-QA-F24-02] debe documentar que la interfaz no despliega retroalimentación visual al fallar la eliminación en backend', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      noteServiceMock.deleteNote.and.returnValue(
        throwError(() => new Error('Error de red en servidor')),
      );
      component.noteError = '';

      component.deleteNote(mockNotes[0]);

      // Verificación del defecto QA DEF-QA-F24-02:
      // Se documenta que al fallar la eliminación, deleteNote captura el error únicamente en consola
      // sin asignar noteError, manteniendo noteError como cadena vacía ('').
      expect(component.noteError).toBe('');
    });
  });

  describe('F25 — Calculadora y simulador de calificaciones (Caminos Básicos Tabla 37)', () => {
    describe('Carga de Calificaciones (P1: 1 → 2 → 3 → 4 → 22)', () => {
      it('[P1] debe asignar evaluationError y detener loadingEvaluations si getEvaluationsBySubject falla', () => {
        evaluationServiceMock.getEvaluationsBySubject.and.returnValue(
          throwError(() => new Error('Error al conectar con backend')),
        );

        component.loadEvaluations(10);

        expect(component.evaluationError).toBe(
          'Error al cargar las calificaciones de la asignatura',
        );
        expect(component.loadingEvaluations).toBeFalse();
      });
    });

    describe('Gestión y Cierre del Modal (P2: 1 → 2 → 3 → 5 → 6 → 21 → 22)', () => {
      it('[P2] debe abrir en creación, edición y cerrar modal limpiando selectedEvaluation', () => {
        // Modo creación
        component.openEvaluationModal();
        expect(component.showEvaluationModal).toBeTrue();
        expect(component.selectedEvaluation).toBeNull();

        // Modo edición
        component.openEvaluationModal(mockEvaluations[0]);
        expect(component.showEvaluationModal).toBeTrue();
        expect(component.selectedEvaluation).toEqual(mockEvaluations[0]);

        // Cierre
        component.closeEvaluationModal();
        expect(component.showEvaluationModal).toBeFalse();
        expect(component.selectedEvaluation).toBeNull();
      });
    });

    describe('Simulación Interactiva Reactiva (P3, P4, P5)', () => {
      it('[P3: 1 → 2 → 3 → 5 → 6 → 7 → 8 → 22] simulación interactiva con peso agotado (remainingWeight <= 0)', () => {
        const zeroRemainingSummary: GradeSummary = {
          ...mockSummary,
          remainingWeight: 0,
          totalWeight: 100,
        };
        component.gradeSummary = zeroRemainingSummary;
        evaluationServiceMock.simulateLocally.and.returnValue({
          requiredForTarget: null,
          isTargetAttainable: false,
          hypotheticalFinalGrade: null,
          hypotheticalStatus: null,
        });

        component.onSimulationChange();

        expect(evaluationServiceMock.simulateLocally).toHaveBeenCalledWith(
          zeroRemainingSummary,
          component.hypotheticalScore,
          3.0,
        );
        expect(component.simResult?.requiredForTarget).toBeNull();
        expect(component.simResult?.isTargetAttainable).toBeFalse();
      });

      it('[P4: 1 → 2 → 3 → 5 → 6 → 7 → 9 → 22] simulación con remainingWeight > 0 sin nota hipotética', () => {
        component.gradeSummary = mockSummary;
        component.hypotheticalScore = null;
        component.targetGoal = 3.0;
        evaluationServiceMock.simulateLocally.and.returnValue({
          requiredForTarget: 2.57,
          isTargetAttainable: true,
          hypotheticalFinalGrade: null,
          hypotheticalStatus: null,
        });

        component.onSimulationChange();

        expect(evaluationServiceMock.simulateLocally).toHaveBeenCalledWith(
          mockSummary,
          null,
          3.0,
        );
        expect(component.simResult?.requiredForTarget).toBe(2.57);
        expect(component.simResult?.hypotheticalFinalGrade).toBeNull();
      });

      it('[P5: 1 → 2 → 3 → 5 → 6 → 7 → 9 → 11 → 22] simulación reactiva completa con nota hipotética y meta', () => {
        component.gradeSummary = mockSummary;
        component.hypotheticalScore = 4.0;
        component.targetGoal = 3.5;
        evaluationServiceMock.simulateLocally.and.returnValue({
          requiredForTarget: 3.29,
          isTargetAttainable: true,
          hypotheticalFinalGrade: 3.86,
          hypotheticalStatus: 'Aprobando',
        });

        component.onSimulationChange();

        expect(evaluationServiceMock.simulateLocally).toHaveBeenCalledWith(
          mockSummary,
          4.0,
          3.5,
        );
        expect(component.simResult?.hypotheticalFinalGrade).toBe(3.86);
        expect(component.simResult?.hypotheticalStatus).toBe('Aprobando');
      });

      it('guardia onSimulationChange: no debe ejecutar simulación si gradeSummary es null', () => {
        component.gradeSummary = null;
        evaluationServiceMock.simulateLocally.calls.reset();

        component.onSimulationChange();

        expect(evaluationServiceMock.simulateLocally).not.toHaveBeenCalled();
      });
    });

    describe('Sincronización al Guardar en Modal (P7 / P9)', () => {
      it('[P7 / P9] debe recargar las evaluaciones y cerrar el modal tras emitir guardado exitoso', () => {
        spyOn(component, 'loadEvaluations');
        component.openEvaluationModal();
        component.onEvaluationSaved();

        expect(component.loadEvaluations).toHaveBeenCalledWith(10);
        expect(component.showEvaluationModal).toBeFalse();
      });
    });

    describe('Eliminación de Evaluación (P10, P11, P12)', () => {
      it('[P10: 1 → 2 → 3 → 5 → 6 → 15 → 16 → 22] click en eliminar con confirm() cancelado por el usuario', () => {
        spyOn(window, 'confirm').and.returnValue(false);

        component.deleteEvaluation(mockEvaluations[0]);

        expect(window.confirm).toHaveBeenCalled();
        expect(evaluationServiceMock.deleteEvaluation).not.toHaveBeenCalled();
      });

      it('[P11: 1 → 2 → 3 → 5 → 6 → 15 → 23 → 24 → 22] confirmación aceptada pero error HTTP en deleteEvaluation', () => {
        spyOn(window, 'confirm').and.returnValue(true);
        spyOn(console, 'error');
        evaluationServiceMock.deleteEvaluation.and.returnValue(
          throwError(() => new Error('Error al eliminar en servidor')),
        );

        component.deleteEvaluation(mockEvaluations[0]);

        expect(window.confirm).toHaveBeenCalled();
        expect(evaluationServiceMock.deleteEvaluation).toHaveBeenCalledWith(10, 1);
        expect(console.error).toHaveBeenCalled();
      });

      it('[P12: 1 → 2 → 3 → 5 → 6 → 15 → 23 → 25 → 22] confirmación aceptada y éxito HTTP con res.data actualizado', () => {
        spyOn(window, 'confirm').and.returnValue(true);
        const updatedEvaluations: Evaluation[] = [];
        const updatedSummary: GradeSummary = {
          ...mockSummary,
          totalWeight: 0,
          remainingWeight: 100,
          currentContribution: 0,
          status: 'Sin calificaciones',
        };
        evaluationServiceMock.deleteEvaluation.and.returnValue(
          of({
            status: 200,
            message: 'deleted',
            data: {
              evaluations: updatedEvaluations,
              summary: updatedSummary,
            },
          }),
        );
        spyOn(component, 'onSimulationChange');

        component.deleteEvaluation(mockEvaluations[0]);

        expect(evaluationServiceMock.deleteEvaluation).toHaveBeenCalledWith(10, 1);
        expect(component.evaluations).toEqual(updatedEvaluations);
        expect(component.gradeSummary).toEqual(updatedSummary);
        expect(component.onSimulationChange).toHaveBeenCalled();
      });

      it('[P12] confirmación aceptada y éxito HTTP cuando res.data es null invoca loadEvaluations como respaldo', () => {
        spyOn(window, 'confirm').and.returnValue(true);
        evaluationServiceMock.deleteEvaluation.and.returnValue(
          of({
            status: 200,
            message: 'deleted',
            data: null as any,
          }),
        );
        spyOn(component, 'loadEvaluations');
        spyOn(component, 'onSimulationChange');

        component.deleteEvaluation(mockEvaluations[0]);

        expect(component.loadEvaluations).toHaveBeenCalledWith(10);
        expect(component.onSimulationChange).toHaveBeenCalled();
      });

      it('guardia deleteEvaluation: no debe realizar acciones si subject es undefined', () => {
        component.subject = undefined;
        spyOn(window, 'confirm');

        component.deleteEvaluation(mockEvaluations[0]);

        expect(window.confirm).not.toHaveBeenCalled();
        expect(evaluationServiceMock.deleteEvaluation).not.toHaveBeenCalled();
      });
    });

    describe('Auditoría QA y Caracterización de Defectos (Metricas_Software_F21_F26.docx)', () => {
      it('[DEF-QA-F25-03] Comportamiento caracterizado: Permisividad de notas fuera de rango [0.0, 5.0] en onSimulationChange', () => {
        component.gradeSummary = mockSummary;
        // Usuario ingresa una nota de 9.5 en el simulador
        component.hypotheticalScore = 9.5;
        component.targetGoal = 3.0;

        component.onSimulationChange();

        // Verificación de defecto QA DEF-QA-F25-03:
        // Se documenta que el componente frontend traslada el valor 9.5 directamente a simulateLocally
        // sin bloquearlo o marcarlo como inválido en la vista
        expect(evaluationServiceMock.simulateLocally).toHaveBeenCalledWith(
          mockSummary,
          9.5,
          3.0,
        );
      });
    });
  });
});
