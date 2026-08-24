import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScheduleComponent } from './schedule.component';
import { SubjectService } from '../../services/subject.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('ScheduleComponent', () => {

  let component: ScheduleComponent;
  let fixture: ComponentFixture<ScheduleComponent>;

  let subjectServiceMock: jasmine.SpyObj<SubjectService>;
  let routerMock: jasmine.SpyObj<Router>;

  const classesMock: any[] = [
    {
      id: 1,
      dayOfWeek: 'monday',
      startTime: '08:00',
      endTime: '10:00',
      subject: {
        id: 10,
        name: 'validacion',
        professor: 'gabriel',
        color: '#0078d4'
      }
    }
  ];

  beforeEach(async () => {

    subjectServiceMock = jasmine.createSpyObj(
      'SubjectService',
      ['getClass', 'deleteClass', 'editClass']
    );

    routerMock = jasmine.createSpyObj(
      'Router',
      ['navigate']
    );

    subjectServiceMock.getClass.and.returnValue(
      of({
        status: 200,
        message: 'Classes retrieved successfully',
        data: classesMock
      })
    );

    await TestBed.configureTestingModule({
      imports: [ScheduleComponent],
      providers: [
        {
          provide: SubjectService,
          useValue: subjectServiceMock
        },
        {
          provide: Router,
          useValue: routerMock
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleComponent);
    component = fixture.componentInstance;
  });

  //Consultar horario
  describe('Consultar horario', () => {

    // Camino:
    // 1,2,3,4,5,7,17
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
    // 1,2,3,4,5,6,8,9,10,11,12,11...
    it('2. debe continuar la búsqueda cuando no existe una clase para el horario', () => {

      component.classes = classesMock;

      const result = component.getClassesFor(
        'monday',
        '11:00'
      );

      expect(result).toBeUndefined();
    });


    // Camino:
    // 1,2,3,4,5,6,8,9,10,11,12,13,11...
    it('3. debe ignorar una clase que pertenece a otro día', () => {

      component.classes = classesMock;

      const result = component.getClassesFor(
        'tuesday',
        '08:00'
      );

      expect(result).toBeUndefined();
    });


    // Camino:
    // 1,2,3,4,5,6,8,9,10,11,12,13,14,11...
    it('4. debe ignorar una clase que está fuera del horario consultado', () => {

      component.classes = classesMock;

      const result = component.getClassesFor(
        'monday',
        '10:00'
      );

      expect(result).toBeUndefined();
    });


    // Camino:
    // 1,2,3,4,5,6,8,9,10,11,12,13,14,15,16,17
    it('5. debe retornar la clase cuando coincide día y horario', () => {

      component.classes = classesMock;

      const result = component.getClassesFor(
        'monday',
        '08:00'
      );

      expect(result).toEqual(classesMock[0]);
    });

  });


  //Ver detalles de una asignatura desde una clase

  describe('Ver detalles de asignatura desde la clase', () => {

    // Camino:
    // 1,2,3,4
    it('6. debe navegar al detalle de la asignatura', () => {

      const subjectId = 15;

      component.onClickClass(subjectId);

      expect(routerMock.navigate).toHaveBeenCalledWith([
        '/subjects/15'
      ]);
    });

  });


  //Eliminar clase

  describe('Eliminar clase', () => {

    beforeEach(() => {

      component.selectedClass = {
        id: 1,
        dayOfWeek: 'monday',
        startTime: '08:00',
        endTime: '10:00',
        subject: {
          id: 10,
          name: 'validacion',
          professor: 'gabriel',
          color: '#0078d4'
        }
      } as any;

    });


    // Camino:
    // 1,2,3,4,5,7,13
    it('7. no debe eliminar la clase cuando el usuario cancela', () => {

      spyOn(window, 'confirm').and.returnValue(false);

      component.deleteClass();

      expect(subjectServiceMock.deleteClass)
        .not.toHaveBeenCalled();

      expect(component.contextMenuVisible)
        .toBeFalse();

      expect(component.selectedClass)
        .toBeNull();
    });


    // Camino:
    // 1,2,3,4,5,6,8,9,11,12,13
    it('8. debe manejar el error al eliminar una clase', () => {

      spyOn(window, 'confirm').and.returnValue(true);

      subjectServiceMock.deleteClass.and.returnValue(
        throwError(() => new Error('Delete error'))
      );

      spyOn(console, 'error');

      component.deleteClass();

      expect(subjectServiceMock.deleteClass)
        .toHaveBeenCalledWith(1);

      expect(console.error)
        .toHaveBeenCalled();
    });


    // Camino:
    // 1,2,3,4,5,6,8,9,10,12,13
    it('9. debe eliminar la clase correctamente', () => {

      spyOn(window, 'confirm').and.returnValue(true);

      subjectServiceMock.deleteClass.and.returnValue(
        of({
          status: 200,
          message: 'Class deleted successfully',
          data: null
        })
      );

      component.classes = [
        component.selectedClass!
      ];

      component.deleteClass();

      expect(subjectServiceMock.deleteClass)
        .toHaveBeenCalledWith(1);

      expect(component.classes.length)
        .toBe(0);

      expect(component.contextMenuVisible)
        .toBeFalse();

      expect(component.selectedClass)
        .toBeNull();
    });

  });


  //Editar clase

  describe('Editar clase', () => {

    // Camino:
    // 1,2,3,5
    it('10. no debe hacer nada cuando no existe selectedClass', () => {

      component.selectedClass = null;

      component.editClass();

      expect(component.showEditModal)
        .toBeFalse();

    });


    // Camino:
    // 1,2,3,4,6...
    it('11. debe abrir el modal cuando existe selectedClass', () => {

      component.selectedClass = classesMock[0];

      component.contextMenuVisible = true;

      component.editClass();

      expect(component.showEditModal)
        .toBeTrue();

      expect(component.contextMenuVisible)
        .toBeFalse();

    });

  });

});