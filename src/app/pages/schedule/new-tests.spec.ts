import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Router } from '@angular/router';

import { ScheduleComponent } from './schedule.component';
import { AddClassModalComponent } from '../../components/add-class-modal/add-class-modal.component';
import { SubjectService } from '../../services/subject.service';
import { CalendarService } from '../../services/calendar.service';
import { ClassService } from '../../services/class.service';
import { Should } from '../../common/fluent-assertions';

function buildClass(overrides: any) {
  return {
    id: overrides.id,
    dayOfWeek: overrides.dayOfWeek,
    startTime: overrides.startTime,
    endTime: overrides.endTime,
    subject: {
      id: overrides.subjectId ?? overrides.id + 100,
      name: `Materia ${overrides.id}`,
      professor: 'gabriel',
      color: '#0078d4',
      credits: 3,
    },
  };
}

describe('Nuevas pruebas de regresion: Seguridad y Performance', () => {
  describe('ScheduleComponent', () => {
    let component: ScheduleComponent;
    let fixture: ComponentFixture<ScheduleComponent>;
    let subjectServiceMock: jasmine.SpyObj<SubjectService>;
    let calendarServiceMock: jasmine.SpyObj<CalendarService>;
    let routerMock: jasmine.SpyObj<Router>;

    beforeEach(async () => {
      subjectServiceMock = jasmine.createSpyObj('SubjectService', ['getClass', 'deleteClass']);
      calendarServiceMock = jasmine.createSpyObj('CalendarService', ['createSubscription', 'download']);
      routerMock = jasmine.createSpyObj('Router', ['navigate']);

      subjectServiceMock.getClass.and.returnValue(
        of({ status: 200, message: 'ok', data: [] }),
      );

      await TestBed.configureTestingModule({
        imports: [ScheduleComponent],
        providers: [
          { provide: SubjectService, useValue: subjectServiceMock },
          { provide: CalendarService, useValue: calendarServiceMock },
          { provide: Router, useValue: routerMock },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(ScheduleComponent);
      component = fixture.componentInstance;
    });

    describe('Consultar horario de clases', () => {
      describe('Contrato con el servicio', () => {
        it('ngOnInit debe llamar a subjectService.getClass() exactamente una vez', () => {
          component.ngOnInit();
          Should(subjectServiceMock.getClass).HaveBeenCalledTimes(1);
        });
      });

      describe('Seguridad', () => {
        it('getClassesFor no debe lanzar excepcion ni hacer match con un dayOfWeek no reconocido', () => {
          component.classes = [buildClass({ id: 1, dayOfWeek: 'NOT_A_REAL_DAY', startTime: '08:00', endTime: '10:00' })] as any;

          let resultado: any;
          const llamada = () => { resultado = component.getClassesFor('monday', '08:00'); };

          expect(llamada).not.toThrow();
          Should(resultado).BeUndefined();
        });
      });

      describe('Performance', () => {
        it('getClassesFor debe resolver en menos de 50ms con 5000 clases cargadas', () => {
          component.classes = Array.from({ length: 5000 }, (_, i) =>
            buildClass({
              id: i,
              dayOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'][i % 5],
              startTime: '08:00',
              endTime: '10:00',
            }),
          ) as any;

          const start = performance.now();
          component.getClassesFor('friday', '09:00');
          const elapsedMs = performance.now() - start;

          Should(elapsedMs).BeLessThan(50);
        });
      });
    });

    describe('Eliminar clase', () => {
      beforeEach(() => {
        component.selectedClass = buildClass({ id: 1, dayOfWeek: 'monday', startTime: '08:00', endTime: '10:00' }) as any;
      });

      describe('Contrato con el servicio', () => {
        it('al confirmar, debe llamar a subjectService.deleteClass con el id exacto de la clase seleccionada', () => {
          spyOn(window, 'confirm').and.returnValue(true);
          subjectServiceMock.deleteClass.and.returnValue(of({ status: 200, message: 'ok', data: null }));

          component.deleteClass();

          Should(subjectServiceMock.deleteClass).HaveBeenCalledWith(1);
        });
      });

      describe('Seguridad', () => {
        it('sin confirmacion del usuario, no debe llamar al servicio de borrado', () => {
          spyOn(window, 'confirm').and.returnValue(false);

          component.deleteClass();

          Should(subjectServiceMock.deleteClass).NotHaveBeenCalled();
        });

        it('al borrar, debe remover unicamente la clase con el id correspondiente del estado local', () => {
          spyOn(window, 'confirm').and.returnValue(true);
          subjectServiceMock.deleteClass.and.returnValue(of({ status: 200, message: 'ok', data: null }));
          component.classes = [
            buildClass({ id: 1, dayOfWeek: 'monday', startTime: '08:00', endTime: '10:00' }),
            buildClass({ id: 2, dayOfWeek: 'tuesday', startTime: '08:00', endTime: '10:00' }),
          ] as any;

          component.deleteClass();

          Should(component.classes.length).Be(1);
          Should(component.classes[0].id).Be(2);
        });
      });

      describe('Performance', () => {
        it('debe filtrar el estado local en menos de 50ms con 5000 clases', () => {
          spyOn(window, 'confirm').and.returnValue(true);
          subjectServiceMock.deleteClass.and.returnValue(of({ status: 200, message: 'ok', data: null }));
          component.classes = Array.from({ length: 5000 }, (_, i) =>
            buildClass({ id: i, dayOfWeek: 'monday', startTime: '08:00', endTime: '10:00' }),
          ) as any;
          component.selectedClass = component.classes[2500];

          const start = performance.now();
          component.deleteClass();
          const elapsedMs = performance.now() - start;

          Should(component.classes.length).Be(4999);
          Should(elapsedMs).BeLessThan(50);
        });
      });
    });

    describe('Acceder a detalles de asignatura', () => {
      describe('Contrato con el router', () => {
        it('debe navegar a /subjects/:id usando el id de la asignatura de la clase clickeada', () => {
          component.onClickClass(42);
          Should(routerMock.navigate).HaveBeenCalledWith(['/subjects/42']);
        });
      });

      describe('Seguridad', () => {
        it('clases con distintas asignaturas deben navegar cada una a su propio id, sin mezclarse', () => {
          component.onClickClass(1);
          component.onClickClass(2);

          Should(routerMock.navigate).HaveBeenCalledWith(['/subjects/1']);
          Should(routerMock.navigate).HaveBeenCalledWith(['/subjects/2']);
        });
      });

      describe('Performance', () => {
        it('debe resolver 500 navegaciones secuenciales en menos de 50ms en total', () => {
          const start = performance.now();
          for (let i = 0; i < 500; i++) {
            component.onClickClass(i);
          }
          const elapsedMs = performance.now() - start;

          Should(routerMock.navigate).HaveBeenCalledTimes(500);
          Should(elapsedMs).BeLessThan(50);
        });
      });
    });

    describe('Ver siguiente clase', () => {
      afterEach(() => jasmine.clock().uninstall());

      describe('Seguridad', () => {
        it('getNextClass no debe lanzar excepción ni considerar una clase con dayOfWeek invalido como proxima', () => {
          jasmine.clock().install();
          jasmine.clock().mockDate(new Date(2024, 0, 1, 9, 0)); // lunes 09:00

          component.classes = [
            buildClass({ id: 1, dayOfWeek: 'DIA_INVALIDO', startTime: '10:00', endTime: '11:00' }),
          ] as any;

          let resultado: any;
          const llamada = () => { resultado = component.getNextClass(); };

          expect(llamada).not.toThrow();
          Should(resultado).BeNull();
        });
      });

      describe('Performance', () => {
        it('getNextClass debe resolver en menos de 50ms con 5000 clases cargadas', () => {
          jasmine.clock().install();
          jasmine.clock().mockDate(new Date(2024, 0, 1, 9, 0));

          component.classes = Array.from({ length: 5000 }, (_, i) =>
            buildClass({
              id: i,
              dayOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'][i % 5],
              startTime: '10:00',
              endTime: '11:00',
            }),
          ) as any;

          const start = performance.now();
          const resultado = component.getNextClass();
          const elapsedMs = performance.now() - start;

          Should(resultado).NotBeNull();
          Should(elapsedMs).BeLessThan(50);
        });
      });
    });
  });

  describe('AddClassModalComponent', () => {
    let component: AddClassModalComponent;
    let fixture: ComponentFixture<AddClassModalComponent>;
    let classServiceMock: jasmine.SpyObj<ClassService>;
    let subjectServiceMock: jasmine.SpyObj<SubjectService>;

    const existingClasses = [
      buildClass({ id: 1, dayOfWeek: 'monday', startTime: '08:00', endTime: '10:00' }),
    ];

    beforeEach(async () => {
      classServiceMock = jasmine.createSpyObj('ClassService', ['addClass']);
      subjectServiceMock = jasmine.createSpyObj('SubjectService', ['getClass', 'editClass']);

      subjectServiceMock.getClass.and.returnValue(
        of({ status: 200, message: 'ok', data: existingClasses }),
      );
      classServiceMock.addClass.and.returnValue(
        of({ status: 201, message: 'ok', data: null }),
      );
      subjectServiceMock.editClass.and.returnValue(
        of({ status: 200, message: 'ok', data: null }),
      );

      await TestBed.configureTestingModule({
        imports: [AddClassModalComponent],
        providers: [
          { provide: ClassService, useValue: classServiceMock },
          { provide: SubjectService, useValue: subjectServiceMock },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(AddClassModalComponent);
      component = fixture.componentInstance;
      component.subjectId = 10;
      component.ngOnInit();
    });

    describe('Agregar clase', () => {
      describe('Contrato con el servicio', () => {
        it('con datos validos sin conflicto, debe llamar a classService.addClass con el dto correcto', () => {
          component.addClassForm.setValue({ dayOfWeek: 'tuesday', startTime: '08:00', endTime: '10:00' });

          component.onSave();

          Should(classServiceMock.addClass).HaveBeenCalledWith({
            dayOfWeek: 'tuesday',
            startTime: '08:00',
            endTime: '10:00',
            subjectId: 10,
          });
        });
      });

      describe('Seguridad)', () => {
        it('formulario invalido (campos vacios) -> no debe llamar al servicio', () => {
          component.addClassForm.setValue({ dayOfWeek: '', startTime: '', endTime: '' });

          component.onSave();

          Should(classServiceMock.addClass).NotHaveBeenCalled();
          Should(component.addClassForm.touched).BeTrue();
        });

        it('endTime anterior o igual a startTime -> no debe llamar al servicio', () => {
          component.addClassForm.setValue({ dayOfWeek: 'monday', startTime: '10:00', endTime: '08:00' });

          component.onSave();

          Should(component.isStartGrater).BeTrue();
          Should(classServiceMock.addClass).NotHaveBeenCalled();
        });

        it('horario que se solapa con una clase existente el mismo dia -> no debe llamar al servicio', () => {
          component.addClassForm.setValue({ dayOfWeek: 'monday', startTime: '09:00', endTime: '11:00' });

          component.onSave();

          Should(component.hasConflict).BeTrue();
          Should(classServiceMock.addClass).NotHaveBeenCalled();
        });
      });

      describe('Performance', () => {
        it('la deteccion de conflictos debe resolver en menos de 50ms con 5000 clases existentes', () => {
          component.classes = Array.from({ length: 5000 }, (_, i) =>
            buildClass({ id: i, dayOfWeek: 'wednesday', startTime: '06:00', endTime: '07:00' }),
          ) as any;
          component.addClassForm.setValue({ dayOfWeek: 'thursday', startTime: '08:00', endTime: '10:00' });

          const start = performance.now();
          component.onSave();
          const elapsedMs = performance.now() - start;

          Should(component.hasConflict).BeFalse();
          Should(elapsedMs).BeLessThan(50);
        });
      });
    });

    describe('Editar clase', () => {
      beforeEach(() => {
        component.classToEdit = buildClass({ id: 1, dayOfWeek: 'monday', startTime: '08:00', endTime: '10:00' }) as any;
      });

      describe('Contrato con el servicio', () => {
        it('con datos validos, debe llamar a subjectService.editClass(id, dto) y no a classService.addClass', () => {
          component.addClassForm.setValue({ dayOfWeek: 'monday', startTime: '09:00', endTime: '11:00' });

          component.onSave();

          Should(subjectServiceMock.editClass).HaveBeenCalledWith(1, {
            dayOfWeek: 'monday',
            startTime: '09:00',
            endTime: '11:00',
          });
          Should(classServiceMock.addClass).NotHaveBeenCalled();
        });
      });

      describe('Seguridad', () => {
        it('endTime anterior o igual a startTime -> no debe llamar al servicio', () => {
          component.addClassForm.setValue({ dayOfWeek: 'monday', startTime: '11:00', endTime: '09:00' });

          component.onSave();

          Should(component.isStartGrater).BeTrue();
          Should(subjectServiceMock.editClass).NotHaveBeenCalled();
        });

        it('la propia clase que se esta editando debe excluirse de la detección de conflictos', () => {
          component.classes = existingClasses as any;
          component.addClassForm.setValue({ dayOfWeek: 'monday', startTime: '08:30', endTime: '10:30' });

          component.onSave();

          Should(component.hasConflict).BeFalse();
          Should(subjectServiceMock.editClass).HaveBeenCalled();
        });

        it('horario que si se solapa con una clase distinta a la que se edita -> no debe llamar al servicio', () => {
          component.classes = [
            ...existingClasses,
            buildClass({ id: 2, dayOfWeek: 'monday', startTime: '12:00', endTime: '13:00' }),
          ] as any;
          component.addClassForm.setValue({ dayOfWeek: 'monday', startTime: '12:30', endTime: '13:30' });

          component.onSave();

          Should(component.hasConflict).BeTrue();
          Should(subjectServiceMock.editClass).NotHaveBeenCalled();
        });
      });

      describe('Performance', () => {
        it('la deteccion de conflictos al editar debe resolver en menos de 50ms con 5000 clases existentes', () => {
          component.classes = Array.from({ length: 5000 }, (_, i) =>
            buildClass({ id: i + 10, dayOfWeek: 'wednesday', startTime: '06:00', endTime: '07:00' }),
          ) as any;
          component.addClassForm.setValue({ dayOfWeek: 'monday', startTime: '09:00', endTime: '11:00' });

          const start = performance.now();
          component.onSave();
          const elapsedMs = performance.now() - start;

          Should(subjectServiceMock.editClass).HaveBeenCalled();
          Should(elapsedMs).BeLessThan(50);
        });
      });
    });
  });
});