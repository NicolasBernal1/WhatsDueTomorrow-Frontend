import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddClassModalComponent } from './add-class-modal.component';
import { ClassService } from '../../services/class.service';
import { SubjectService } from '../../services/subject.service';
import { of, throwError } from 'rxjs';

describe('AddClassModalComponent', () => {

  let component: AddClassModalComponent;
  let fixture: ComponentFixture<AddClassModalComponent>;

  let classServiceMock: jasmine.SpyObj<ClassService>;
  let subjectServiceMock: jasmine.SpyObj<SubjectService>;

  const classToEdit: any = {
    id: 5,
    dayOfWeek: 'monday',
    startTime: '08:00',
    endTime: '10:00',
    subject: {
      id: 10,
      name: 'validación',
      professor: 'gaabriel',
      color: '#0078d4'
    }
  };

  beforeEach(async () => {

    classServiceMock = jasmine.createSpyObj(
      'ClassService',
      ['addClass']
    );

    subjectServiceMock = jasmine.createSpyObj(
      'SubjectService',
      ['getClass', 'editClass']
    );

    subjectServiceMock.getClass.and.returnValue(
      of({
        status: 200,
        message: 'Classes retrieved successfully',
        data: []
      })
    );

    classServiceMock.addClass.and.returnValue(
      of({
        status: 201,
        message: 'Class created successfully',
        data: null
      })
    );

    subjectServiceMock.editClass.and.returnValue(
      of({
        status: 200,
        message: 'Class updated successfully',
        data: null
      })
    );

    await TestBed.configureTestingModule({
      imports: [AddClassModalComponent],
      providers: [
        {
          provide: ClassService,
          useValue: classServiceMock
        },
        {
          provide: SubjectService,
          useValue: subjectServiceMock
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddClassModalComponent);
    component = fixture.componentInstance;
    component.subjectId = 10;
  });

  //Registrar clase

  describe('Registrar clase', () => {

    // Camino:
    // 1,2,3,4,5,7
    it('1. debe mostrar error cuando getClass falla', () => {

      subjectServiceMock.getClass.and.returnValue(
        throwError(() => new Error('Server error'))
      );

      spyOn(window, 'alert');

      component.ngOnInit();

      expect(window.alert).toHaveBeenCalledWith(
        'Error getting classes'
      );
    });


    // Camino:
    // 1,2,3,4,5,6,8,9,10,11,13
    it('2. debe rechazar una clase cuando endTime no es mayor que startTime', () => {

      component.addClassForm.setValue({
        dayOfWeek: 'monday',
        startTime: '10:00',
        endTime: '09:00'
      });

      component.onSave();

      expect(component.isStartGrater).toBeTrue();
      expect(classServiceMock.addClass).not.toHaveBeenCalled();
    });


    // Camino:
    // 1,2,3,4,5,6,8,9,10,11,12,13
    it('3. debe rechazar una clase cuando existe conflicto de horario', () => {

      component.classes = [
        {
          id: 1,
          dayOfWeek: 'monday',
          startTime: '09:00',
          endTime: '11:00'
        }
      ] as any;

      component.addClassForm.setValue({
        dayOfWeek: 'monday',
        startTime: '10:00',
        endTime: '12:00'
      });

      component.onSave();

      expect(component.hasConflict).toBeTrue();
      expect(classServiceMock.addClass).not.toHaveBeenCalled();
    });


    // Camino:
    // 1,2,3,4,5,6,8,9,10,11,12,14,15
    it('4. debe registrar correctamente la clase cuando no existe conflicto', () => {

      component.classes = [];

      component.addClassForm.setValue({
        dayOfWeek: 'monday',
        startTime: '10:00',
        endTime: '12:00'
      });

      spyOn(component.save, 'emit');
      spyOn(component.close, 'emit');

      component.onSave();

      expect(classServiceMock.addClass).toHaveBeenCalledWith({
        dayOfWeek: 'monday',
        startTime: '10:00',
        endTime: '12:00',
        subjectId: 10
      });

      expect(component.save.emit).toHaveBeenCalled();
      expect(component.close.emit).toHaveBeenCalled();
    });

  });

  //Editar clase

  describe('Editar clase', () => {

    beforeEach(() => {
      component.classToEdit = classToEdit;
    });


    // Camino:
    // 1,2,3,4,6,7,8,9,11
    it('5. debe mostrar error cuando falla la carga de clases para editar', () => {

      subjectServiceMock.getClass.and.returnValue(
        throwError(() => new Error('Server error'))
      );

      spyOn(window, 'alert');

      component.ngOnInit();

      expect(window.alert).toHaveBeenCalledWith(
        'Error getting classes'
      );
    });


    // Camino:
    // 1,2,3,4,6,7,8,9,10,12,13,17,18,20
    it('6. debe precargar la información de la clase en el formulario', () => {

      component.ngOnInit();

      expect(component.addClassForm.value).toEqual({
        dayOfWeek: 'monday',
        startTime: '08:00',
        endTime: '10:00'
      });
    });


    // Camino:
    // 1,2,3,4,6,7,8,9,10,12,14,15,16,17,19
    it('7. debe rechazar la edición cuando endTime no es mayor que startTime', () => {

      component.addClassForm.setValue({
        dayOfWeek: 'monday',
        startTime: '11:00',
        endTime: '10:00'
      });

      component.onSave();

      expect(component.isStartGrater).toBeTrue();
      expect(subjectServiceMock.editClass).not.toHaveBeenCalled();
    });


    // Camino:
    // 1,2,3,4,6,7,8,9,10,12,13,17,18,20
    it('8. debe rechazar la edición cuando existe conflicto con otra clase', () => {

      component.classes = [
        classToEdit,
        {
          id: 8,
          dayOfWeek: 'monday',
          startTime: '10:00',
          endTime: '12:00'
        }
      ] as any;

      component.addClassForm.setValue({
        dayOfWeek: 'monday',
        startTime: '11:00',
        endTime: '13:00'
      });

      component.onSave();

      expect(component.hasConflict).toBeTrue();
      expect(subjectServiceMock.editClass).not.toHaveBeenCalled();
    });


    // Camino:
    // 1,2,3,4,6,7,8,9,10,12,13,17,18,21,22,23,25
    it('9. debe manejar el error cuando editClass falla', () => {

      subjectServiceMock.editClass.and.returnValue(
        throwError(() => new Error('Update error'))
      );

      component.addClassForm.setValue({
        dayOfWeek: 'monday',
        startTime: '10:00',
        endTime: '12:00'
      });

      spyOn(console, 'error');

      component.onSave();

      expect(subjectServiceMock.editClass).toHaveBeenCalledWith(
        5,
        {
          dayOfWeek: 'monday',
          startTime: '10:00',
          endTime: '12:00'
        }
      );

      expect(console.error).toHaveBeenCalled();
    });


    // Camino:
    // 1,2,3,4,6,7,8,9,10,12,13,17,18,21,22,23,24,26
    it('10. debe actualizar correctamente la clase', () => {

      component.addClassForm.setValue({
        dayOfWeek: 'tuesday',
        startTime: '10:00',
        endTime: '12:00'
      });

      spyOn(component.save, 'emit');
      spyOn(component.close, 'emit');

      component.onSave();

      expect(subjectServiceMock.editClass).toHaveBeenCalledWith(
        5,
        {
          dayOfWeek: 'tuesday',
          startTime: '10:00',
          endTime: '12:00'
        }
      );

      expect(component.save.emit).toHaveBeenCalled();
      expect(component.close.emit).toHaveBeenCalled();
    });

  });

});