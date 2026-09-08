import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SubjectDetailsComponent } from './subject-details.component';
import { SubjectService } from '../../services/subject.service';
import { AssignmentService } from '../../services/assignment.service';
import { NoteService } from '../../services/note.service';
import { EvaluationService } from '../../services/evaluation.service';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
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

  describe('F24 Bitácora de apuntes', () => {
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

    it('debe solicitar confirmación y eliminar la nota si el usuario confirma', () => {
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

    it('NO debe eliminar la nota si el usuario cancela la confirmación', () => {
      spyOn(window, 'confirm').and.returnValue(false);

      component.deleteNote(mockNotes[0]);

      expect(window.confirm).toHaveBeenCalled();
      expect(noteServiceMock.deleteNote).not.toHaveBeenCalled();
    });
  });

  describe('F25 Calculadora y simulador de calificaciones', () => {
    it('debe abrir el modal de evaluación en modo creación', () => {
      component.openEvaluationModal();
      expect(component.showEvaluationModal).toBeTrue();
      expect(component.selectedEvaluation).toBeNull();
    });

    it('debe abrir el modal de evaluación en modo edición con la evaluación seleccionada', () => {
      component.openEvaluationModal(mockEvaluations[0]);
      expect(component.showEvaluationModal).toBeTrue();
      expect(component.selectedEvaluation).toEqual(mockEvaluations[0]);
    });

    it('debe cerrar el modal de evaluación y reiniciar la selección', () => {
      component.openEvaluationModal(mockEvaluations[0]);
      component.closeEvaluationModal();
      expect(component.showEvaluationModal).toBeFalse();
      expect(component.selectedEvaluation).toBeNull();
    });

    it('debe recargar las evaluaciones y cerrar el modal tras guardar una evaluación', () => {
      spyOn(component, 'loadEvaluations');
      component.openEvaluationModal();
      component.onEvaluationSaved();

      expect(component.loadEvaluations).toHaveBeenCalledWith(10);
      expect(component.showEvaluationModal).toBeFalse();
    });

    it('debe solicitar confirmación y eliminar la evaluación si el usuario confirma', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      evaluationServiceMock.deleteEvaluation.and.returnValue(
        of({
          status: 200,
          message: 'deleted',
          data: {
            evaluations: [],
            summary: {
              totalWeight: 0,
              remainingWeight: 100,
              currentContribution: 0,
              currentAverage: 0,
              requiredGrade: 3.0,
              isPassing: false,
              isAttainable: true,
              status: 'Sin calificaciones',
              weightExceeded: false,
              passingGrade: 3.0,
              maxGrade: 5.0,
            },
          },
        }),
      );

      component.deleteEvaluation(mockEvaluations[0]);

      expect(window.confirm).toHaveBeenCalled();
      expect(evaluationServiceMock.deleteEvaluation).toHaveBeenCalledWith(10, 1);
      expect(component.evaluations.length).toBe(0);
      expect(component.gradeSummary?.status).toBe('Sin calificaciones');
    });

    it('NO debe eliminar la evaluación si el usuario cancela la confirmación', () => {
      spyOn(window, 'confirm').and.returnValue(false);

      component.deleteEvaluation(mockEvaluations[0]);

      expect(window.confirm).toHaveBeenCalled();
      expect(evaluationServiceMock.deleteEvaluation).not.toHaveBeenCalled();
    });

    it('debe recalcular simulación reactiva al invocar onSimulationChange', () => {
      component.hypotheticalScore = 4.0;
      component.targetGoal = 3.5;
      component.onSimulationChange();

      expect(evaluationServiceMock.simulateLocally).toHaveBeenCalledWith(
        mockSummary,
        4.0,
        3.5,
      );
      expect(component.simResult?.hypotheticalFinalGrade).toBe(3.86);
    });
  });
});
