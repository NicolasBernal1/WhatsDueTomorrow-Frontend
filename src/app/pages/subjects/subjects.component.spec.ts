import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { SubjectsComponent } from './subjects.component';
import { SubjectService } from '../../services/subject.service';

describe('SubjectsComponent', () => {

  let component: SubjectsComponent;
  let fixture: ComponentFixture<SubjectsComponent>;
  let subjectServiceMock: jasmine.SpyObj<SubjectService>;
  let routerMock: jasmine.SpyObj<Router>;

  const subjectMock: any = {
    id: 10,
    name: 'validación',
    professor: 'Gabriel',
    color: '#0078d4',
  };

  beforeEach(async () => {
    subjectServiceMock = jasmine.createSpyObj('SubjectService', ['getSubjects', 'deleteSubject']);
    routerMock = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [SubjectsComponent],
      providers: [
        { provide: SubjectService, useValue: subjectServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SubjectsComponent);
    component = fixture.componentInstance;
  });


  //Listar asignaturas del estudiante (F07)

  describe('Listar asignaturas', () => {

    // Camino:
    // 1,2,3,4,6,7,9
    it('1. debe mostrar el mensaje de error y dejar la lista vacía cuando la petición falla', () => {

      subjectServiceMock.getSubjects.and.returnValue(
        throwError(() => new Error('server error')),
      );
      spyOn(window, 'alert');

      component.ngOnInit();

      expect(window.alert).toHaveBeenCalledWith('Error getting subjects');
      expect(component.subjects).toEqual([]);
      expect(component.loading).toBeFalse();
    });

    // Camino:
    // 1,2,3,5,6,7,9
    it('2. debe dejar la lista vacía cuando el usuario no tiene asignaturas', () => {

      subjectServiceMock.getSubjects.and.returnValue(
        of({ status: 200, message: 'The user has no subjects', data: [] }),
      );

      component.ngOnInit();

      expect(component.subjects).toEqual([]);
      expect(component.loading).toBeFalse();
    });

    // Camino:
    // 1,2,3,5,6,8,9
    it('3. debe asignar las asignaturas recibidas cuando existen', () => {

      subjectServiceMock.getSubjects.and.returnValue(
        of({ status: 200, message: 'ok', data: [subjectMock] }),
      );

      component.ngOnInit();

      expect(component.subjects).toEqual([subjectMock]);
      expect(component.loading).toBeFalse();
    });

  });


  //Eliminar asignatura académica (F11)

  describe('Eliminar asignatura', () => {

    beforeEach(() => {
      subjectServiceMock.getSubjects.and.returnValue(
        of({ status: 200, message: 'ok', data: [] }),
      );
      spyOn(component, 'loadSubjects').and.callThrough();
    });

    // Camino:
    // 1,2,3,11
    it('4. no debe hacer nada cuando no hay asignatura seleccionada', () => {

      component.selectedSubject = null;
      component.contextMenuVisible = true;

      component.deleteSubject();

      expect(subjectServiceMock.deleteSubject).not.toHaveBeenCalled();
      expect(component.contextMenuVisible).toBeTrue();
    });

    // Camino:
    // 1,2,4,5,6,11
    it('5. debe cerrar el menú contextual sin eliminar cuando el usuario cancela la confirmación', () => {

      component.selectedSubject = subjectMock;
      component.contextMenuVisible = true;
      spyOn(window, 'confirm').and.returnValue(false);

      component.deleteSubject();

      expect(window.confirm).toHaveBeenCalledWith('Delete subject?');
      expect(subjectServiceMock.deleteSubject).not.toHaveBeenCalled();
      expect(component.contextMenuVisible).toBeFalse();
      expect(component.selectedSubject).toBeNull();
    });

    // Camino:
    // 1,2,4,5,7,8,9,11
    it('6. debe eliminar la asignatura y recargar la lista cuando la petición es exitosa', () => {

      component.selectedSubject = subjectMock;
      component.contextMenuVisible = true;
      spyOn(window, 'confirm').and.returnValue(true);
      subjectServiceMock.deleteSubject.and.returnValue(
        of({ status: 200, message: 'Subject deleted successfully', data: null }),
      );

      component.deleteSubject();

      expect(subjectServiceMock.deleteSubject).toHaveBeenCalledWith(subjectMock.id);
      expect(component.loadSubjects).toHaveBeenCalled();
      expect(component.contextMenuVisible).toBeFalse();
      expect(component.selectedSubject).toBeNull();
    });

    // Camino:
    // 1,2,4,5,7,8,10,11
    it('7. debe registrar el error en consola y NO cerrar el menú cuando la petición falla', () => {

      component.selectedSubject = subjectMock;
      component.contextMenuVisible = true;
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(console, 'error');
      subjectServiceMock.deleteSubject.and.returnValue(
        throwError(() => new Error('server error')),
      );

      component.deleteSubject();

      expect(console.error).toHaveBeenCalled();
      expect(component.contextMenuVisible).toBeTrue();
    });

  });


  // Orquestación de UI (modales / menú contextual) — no forma parte
  // de la tabla de caminos de F07-F11, pero se cubre para elevar
  // el % de coverage de Sonar.

  describe('Orquestación de UI (complementario)', () => {

    beforeEach(() => {
      subjectServiceMock.getSubjects.and.returnValue(
        of({ status: 200, message: 'ok', data: [] }),
      );
      spyOn(component, 'loadSubjects').and.callThrough();
    });

    it('8. goToSubjectDetais navega a /subjects/:id', () => {
      component.goToSubjectDetais(10);
      expect(routerMock.navigate).toHaveBeenCalledWith(['/subjects', 10]);
    });

    it('9. addSubjectModal abre el modal y bloquea el scroll', () => {
      component.addSubjectModal();
      expect(component.showAddModal).toBeTrue();
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('10. closeAddSubjectModal cierra el modal y libera el scroll', () => {
      component.closeAddSubjectModal();
      expect(component.showAddModal).toBeFalse();
      expect(document.body.style.overflow).toBe('');
    });

    it('11. saveSubject cierra el modal de creación y recarga la lista', () => {
      component.saveSubject();
      expect(component.showAddModal).toBeFalse();
      expect(component.loadSubjects).toHaveBeenCalled();
    });

    it('12. onRightClickSubject abre el menú contextual con la asignatura seleccionada', () => {
      const event = { preventDefault: () => {}, clientX: 50, clientY: 80 } as MouseEvent;

      component.onRightClickSubject(event, subjectMock);

      expect(component.selectedSubject).toEqual(subjectMock);
      expect(component.contextMenuX).toBe(50);
      expect(component.contextMenuY).toBe(80);
      expect(component.contextMenuVisible).toBeTrue();
    });

    it('13. editSubject no hace nada si no hay asignatura seleccionada', () => {
      component.selectedSubject = null;

      component.editSubject();

      expect(component.showEditModal).toBeFalse();
    });

    it('14. editSubject abre el modal de edición si hay asignatura seleccionada', () => {
      component.selectedSubject = subjectMock;
      component.contextMenuVisible = true;

      component.editSubject();

      expect(component.showEditModal).toBeTrue();
      expect(component.contextMenuVisible).toBeFalse();
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('15. closeEditModal cierra el modal, limpia la selección y libera el scroll', () => {
      component.showEditModal = true;
      component.selectedSubject = subjectMock;

      component.closeEditModal();

      expect(component.showEditModal).toBeFalse();
      expect(component.selectedSubject).toBeNull();
      expect(document.body.style.overflow).toBe('');
    });

    it('16. onSubjectSaved cierra el modal de edición y recarga la lista', () => {
      component.onSubjectSaved();
      expect(component.showEditModal).toBeFalse();
      expect(component.loadSubjects).toHaveBeenCalled();
    });

  });

});