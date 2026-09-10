import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SubjectDetailsComponent } from './subject-details.component';
import { SubjectService } from '../../services/subject.service';
import { AssignmentService } from '../../services/assignment.service';

/**
 * Pruebas de SubjectDetailsComponent basadas en la tabla de caminos
 * "Registrar tarea (Frontend)" del Excel (Camino 1), que describe el paso
 * previo al registro de una tarea: al inicializar el componente se
 * solicitan las tareas existentes de la materia mediante
 * loadAssignments(id), y si esa petición falla, se muestra alert('Error
 * fetching assignments').
 */
describe('SubjectDetailsComponent', () => {
  let component: SubjectDetailsComponent;
  let fixture: ComponentFixture<SubjectDetailsComponent>;
  let subjectServiceMock: jasmine.SpyObj<SubjectService>;
  let assignmentServiceMock: jasmine.SpyObj<AssignmentService>;

  const mockSubject = { id: 10, name: 'Math', professor: 'Dr. Smith', color: '#ff0000' };

  beforeEach(async () => {
    subjectServiceMock = jasmine.createSpyObj('SubjectService', ['getSubjectById']);
    assignmentServiceMock = jasmine.createSpyObj('AssignmentService', [
      'getAssignmentsBySubject',
      'deleteAssignment',
    ]);

    // Por defecto, la materia carga bien (no es el foco de estos tests)
    subjectServiceMock.getSubjectById.and.returnValue(of({ status: 200, message: 'OK', data: mockSubject as any }));

    await TestBed.configureTestingModule({
      imports: [SubjectDetailsComponent],
      providers: [
        { provide: SubjectService, useValue: subjectServiceMock },
        { provide: AssignmentService, useValue: assignmentServiceMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '10' } } },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(SubjectDetailsComponent, '<div></div>')
      .compileComponents();

    fixture = TestBed.createComponent(SubjectDetailsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    assignmentServiceMock.getAssignmentsBySubject.and.returnValue(of({ status: 200, message: 'OK', data: [] }));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  // ─── loadAssignments (Camino 1 de "Registrar tarea (Frontend)") ───────────

  describe('loadAssignments', () => {
    // Camino: 1,2,3,4,5,7,14
    // Entrada: Componente inicializado, se solicitan las tareas existentes
    // Prueba: Subscribe -> Success? (nodo 5) = No
    // Salida: AlertError -> fin
    it('[Camino 1,2,3,4,5,7,14] debe mostrar alert cuando falla la carga de tareas', () => {
      spyOn(window, 'alert');
      assignmentServiceMock.getAssignmentsBySubject.and.returnValue(
        throwError(() => new Error('network error')),
      );

      fixture.detectChanges(); // dispara ngOnInit -> loadAssignments(10)

      expect(assignmentServiceMock.getAssignmentsBySubject).toHaveBeenCalledWith(10);
      expect(window.alert).toHaveBeenCalledWith('Error fetching assignments');
      expect(component.assignments).toEqual([]);
    });

    it('debe cargar las tareas de la materia cuando la petición es exitosa', () => {
      const mockAssignments = [
        { id: 1, title: 'Tarea 1', description: 'desc', dueDate: '2025-07-01', subjectId: 10 },
      ];
      assignmentServiceMock.getAssignmentsBySubject.and.returnValue(
        of({ status: 200, message: 'OK', data: mockAssignments as any }),
      );

      fixture.detectChanges();

      expect(component.assignments).toEqual(mockAssignments as any);
    });
  });
});