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

});