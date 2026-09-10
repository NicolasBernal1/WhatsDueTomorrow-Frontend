import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AddSubjectModalComponent } from './add-subject-modal.component';
import { SubjectService } from '../../services/subject.service';

describe('AddSubjectModalComponent', () => {

  let component: AddSubjectModalComponent;
  let fixture: ComponentFixture<AddSubjectModalComponent>;
  let subjectServiceMock: jasmine.SpyObj<SubjectService>;

  beforeEach(async () => {
    subjectServiceMock = jasmine.createSpyObj('SubjectService', ['addSubject', 'editSubject']);

    await TestBed.configureTestingModule({
      imports: [AddSubjectModalComponent],
      providers: [
        { provide: SubjectService, useValue: subjectServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddSubjectModalComponent);
    component = fixture.componentInstance;
  });


  //Registrar asignatura académica (F09)

  describe('Registrar asignatura', () => {

    // Camino:
    // 1,2,3,9
    it('1. debe mostrar errores cuando el formulario es inválido', () => {

      component.ngOnInit();
      component.addSubjectForm.patchValue({ name: '', professor: '' });

      component.onSave();

      expect(component.addSubjectForm.invalid).toBeTrue();
      expect(subjectServiceMock.addSubject).not.toHaveBeenCalled();
    });

    // Camino:
    // 1,2,4,5,6,7,9
    it('2. debe crear la asignatura correctamente cuando el formulario es válido', () => {

      component.ngOnInit();
      component.addSubjectForm.setValue({
        name: 'validación',
        professor: 'Gabriel',
        color: '#0078d4',
      });
      subjectServiceMock.addSubject.and.returnValue(
        of({ status: 201, message: 'Subject created successfully', data: null }),
      );
      spyOn(component.save, 'emit');
      spyOn(component.close, 'emit');

      component.onSave();

      expect(subjectServiceMock.addSubject).toHaveBeenCalledWith(
        component.addSubjectForm.value,
      );
      expect(component.save.emit).toHaveBeenCalled();
      expect(component.close.emit).toHaveBeenCalled();
    });

    // Camino:
    // 1,2,4,5,6,8,9
    it('3. debe manejar el error cuando la petición falla', () => {

      component.ngOnInit();
      component.addSubjectForm.setValue({
        name: 'validación',
        professor: 'Gabriel',
        color: '#0078d4',
      });
      subjectServiceMock.addSubject.and.returnValue(
        throwError(() => new Error('server error')),
      );
      spyOn(console, 'error');

      component.onSave();

      expect(console.error).toHaveBeenCalled();
    });

  });


  //Editar asignatura académica (F10)

  describe('Editar asignatura', () => {

    const subjectMock: any = {
      id: 10,
      name: 'validación',
      professor: 'Gabriel',
      color: '#0078d4',
    };

    beforeEach(() => {
      component.subject = subjectMock;
    });

    // Camino:
    // 1,2,3,9
    it('4. debe mostrar errores cuando el formulario es inválido', () => {

      component.ngOnInit();
      component.addSubjectForm.patchValue({ name: '', professor: '' });

      component.onSave();

      expect(component.addSubjectForm.invalid).toBeTrue();
      expect(subjectServiceMock.editSubject).not.toHaveBeenCalled();
    });

    // Camino:
    // 1,2,4,5,6,7,9
    it('5. debe actualizar la asignatura correctamente cuando el formulario es válido', () => {

      component.ngOnInit();
      subjectServiceMock.editSubject.and.returnValue(
        of({ status: 200, message: 'Subject updated successfully', data: null }),
      );
      spyOn(component.save, 'emit');
      spyOn(component.close, 'emit');

      component.onSave();

      expect(subjectServiceMock.editSubject).toHaveBeenCalledWith(
        subjectMock.id,
        component.addSubjectForm.value,
      );
      expect(component.save.emit).toHaveBeenCalled();
      expect(component.close.emit).toHaveBeenCalled();
    });

    // Camino:
    // 1,2,4,5,6,8,9
    it('6. debe manejar el error cuando la petición falla', () => {

      component.ngOnInit();
      subjectServiceMock.editSubject.and.returnValue(
        throwError(() => new Error('server error')),
      );
      spyOn(console, 'error');

      component.onSave();

      expect(console.error).toHaveBeenCalled();
    });

  });

});