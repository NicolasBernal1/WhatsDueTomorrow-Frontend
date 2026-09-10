import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { convertToParamMap, ActivatedRoute } from '@angular/router';

import { SubjectDetailsComponent } from './subject-details.component';
import { SubjectService } from '../../services/subject.service';
import { AssignmentService } from '../../services/assignment.service';

describe('SubjectDetailsComponent', () => {

  let component: SubjectDetailsComponent;
  let fixture: ComponentFixture<SubjectDetailsComponent>;

  let subjectServiceMock: jasmine.SpyObj<SubjectService>;
  let assignmentServiceMock: jasmine.SpyObj<AssignmentService>;

  const subjectMock: any = {
    id: 10,
    name: 'validación',
    professor: 'Gabriel',
    color: '#0078d4',
  };

  function configureTestBed(routeId: string | null) {
    subjectServiceMock = jasmine.createSpyObj('SubjectService', ['getSubjectById']);
    assignmentServiceMock = jasmine.createSpyObj('AssignmentService', [
      'getAssignmentsBySubject',
      'deleteAssignment',
    ]);
    assignmentServiceMock.getAssignmentsBySubject.and.returnValue(
      of({ status: 200, message: 'ok', data: [] }),
    );

    TestBed.configureTestingModule({
      imports: [SubjectDetailsComponent],
      providers: [
        { provide: SubjectService, useValue: subjectServiceMock },
        { provide: AssignmentService, useValue: assignmentServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap(routeId ? { id: routeId } : {}) },
          },
        },
      ],
    });

    fixture = TestBed.createComponent(SubjectDetailsComponent);
    component = fixture.componentInstance;
  }

  //Consultar detalle de asignatura (F08)

  // Camino:
  // 1,2,3,9
  it('1. no debe consultar nada cuando la ruta no trae id', () => {

    configureTestBed(null);

    component.ngOnInit();

    expect(subjectServiceMock.getSubjectById).not.toHaveBeenCalled();
    expect(component.subject).toBeUndefined();
  });

  // Camino:
  // 1,2,4,5,6,9
  it('2. debe mostrar alerta cuando la petición falla', () => {

    configureTestBed('999');
    subjectServiceMock.getSubjectById.and.returnValue(
      throwError(() => new Error('not found')),
    );
    spyOn(window, 'alert');

    component.ngOnInit();

    expect(subjectServiceMock.getSubjectById).toHaveBeenCalledWith(999);
    expect(window.alert).toHaveBeenCalledWith('Error fetching subject');
    expect(component.subject).toBeUndefined();
  });

  // Camino:
  // 1,2,4,5,7,8,9
  it('3. debe asignar la asignatura cuando la petición es exitosa', () => {

    configureTestBed('10');
    subjectServiceMock.getSubjectById.and.returnValue(
      of({ status: 200, message: 'ok', data: subjectMock }),
    );

    component.ngOnInit();

    expect(subjectServiceMock.getSubjectById).toHaveBeenCalledWith(10);
    expect(component.subject).toEqual(subjectMock);
  });


  // =========================================================
  // Gestión de tareas (Assignment) — NO forma parte de F07-F11,
  // es funcionalidad de un compañero (Consultar/Registrar/Editar/
  // Eliminar tarea). Se cubre como aporte adicional al coverage
  // del proyecto, no como parte de la tabla de caminos propia.
  // =========================================================

  describe('Gestión de tareas (complementario, no es F07-F11)', () => {

    const assignmentMock: any = { id: 5, name: 'Tarea 1', status: 'pending' };

    beforeEach(() => {
      configureTestBed('10');
      subjectServiceMock.getSubjectById.and.returnValue(
        of({ status: 200, message: 'ok', data: subjectMock }),
      );
      component.ngOnInit();
    });

    it('4. openAssignmentModal abre el modal y bloquea el scroll', () => {
      component.openAssignmentModal();
      expect(component.showAssignmentModal).toBeTrue();
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('5. closeAssignmentModal cierra el modal, limpia selección y libera el scroll', () => {
      component.showAssignmentModal = true;
      component.selectedAssignment = assignmentMock;

      component.closeAssignmentModal();

      expect(component.showAssignmentModal).toBeFalse();
      expect(component.selectedAssignment).toBeNull();
      expect(document.body.style.overflow).toBe('');
    });

    it('6. onAssignmentSaved recarga las tareas de la asignatura y cierra el modal', () => {
      assignmentServiceMock.getAssignmentsBySubject.calls.reset();

      component.onAssignmentSaved();

      expect(assignmentServiceMock.getAssignmentsBySubject).toHaveBeenCalledWith(subjectMock.id);
      expect(component.showAssignmentModal).toBeFalse();
    });

    it('7. onRightClickAssignment guarda la tarea seleccionada y las coordenadas del click', () => {
      const event = { preventDefault: () => {}, clientX: 40, clientY: 60 } as MouseEvent;

      component.onRightClickAssignment(event, assignmentMock);

      expect(component.selectedAssignment).toEqual(assignmentMock);
      expect(component.contextMenuX).toBe(40);
      expect(component.contextMenuY).toBe(60);
      expect(component.contextMenuVisible).toBeTrue();
    });

    it('8. closeContextMenu oculta el menú contextual', () => {
      component.contextMenuVisible = true;
      component.closeContextMenu();
      expect(component.contextMenuVisible).toBeFalse();
    });

    it('9. deleteAssignment no hace nada si no hay tarea seleccionada', () => {
      component.selectedAssignment = null;

      component.deleteAssignment();

      expect(assignmentServiceMock.deleteAssignment).not.toHaveBeenCalled();
    });

    it('10. deleteAssignment cierra el menú sin eliminar cuando el usuario cancela', () => {
      component.selectedAssignment = assignmentMock;
      spyOn(window, 'confirm').and.returnValue(false);

      component.deleteAssignment();

      expect(window.confirm).toHaveBeenCalledWith('Delete Assignment?');
      expect(assignmentServiceMock.deleteAssignment).not.toHaveBeenCalled();
      expect(component.contextMenuVisible).toBeFalse();
    });

    it('11. deleteAssignment elimina la tarea y recarga la lista cuando se confirma', () => {
      component.selectedAssignment = assignmentMock;
      component.contextMenuVisible = true;
      spyOn(window, 'confirm').and.returnValue(true);
      assignmentServiceMock.deleteAssignment.and.returnValue(
        of({ status: 200, message: 'Assignment deleted', data: null }),
      );
      assignmentServiceMock.getAssignmentsBySubject.calls.reset();

      component.deleteAssignment();

      expect(assignmentServiceMock.deleteAssignment).toHaveBeenCalledWith(assignmentMock.id);
      expect(assignmentServiceMock.getAssignmentsBySubject).toHaveBeenCalledWith(subjectMock.id);
      expect(component.contextMenuVisible).toBeFalse();
    });

    it('12. deleteAssignment registra el error en consola y NO cierra el menú cuando falla', () => {
      component.selectedAssignment = assignmentMock;
      component.contextMenuVisible = true;
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(console, 'error');
      assignmentServiceMock.deleteAssignment.and.returnValue(
        throwError(() => new Error('server error')),
      );

      component.deleteAssignment();

      expect(console.error).toHaveBeenCalled();
      expect(component.contextMenuVisible).toBeTrue();
    });

    it('13. editAssignment no hace nada si no hay tarea seleccionada', () => {
      component.selectedAssignment = null;

      component.editAssignment();

      expect(component.showAssignmentModal).toBeFalse();
    });

    it('14. editAssignment abre el modal si hay tarea seleccionada', () => {
      component.selectedAssignment = assignmentMock;
      component.contextMenuVisible = true;

      component.editAssignment();

      expect(component.showAssignmentModal).toBeTrue();
      expect(component.contextMenuVisible).toBeFalse();
      expect(document.body.style.overflow).toBe('hidden');
    });

  });

});