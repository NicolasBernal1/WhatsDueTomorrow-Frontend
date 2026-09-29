import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { SubjectsComponent } from './subjects.component';
import { SubjectService } from '../../services/subject.service';
import { AcademicLoadSummaryDto } from '../../models/academic-load-summary.dto';
import { Should } from '../../common/fluent-assertions';

/**
 * ============================================================================
 * SUITE DE PRUEBAS DE REGRESIÓN — F26: SEMÁFORO DE CARGA Y GESTIÓN DE CRÉDITOS
 * ============================================================================
 * Objetivo de Regresión:
 * Garantizar que modificaciones futuras en la navegación, gestión de modales,
 * flujos reactivos de actualización de asignaturas o cálculo de estados
 * no rompan la visualización del semáforo ni alteren las etiquetas/descripciones
 * de carga académica (baja, balanceada, sobrecarga).
 */
describe('F26 Regression Suite: Semáforo de Carga y Gestión de Créditos (Frontend - SubjectsComponent)', () => {
  let component: SubjectsComponent;
  let fixture: ComponentFixture<SubjectsComponent>;
  let subjectServiceMock: jasmine.SpyObj<SubjectService>;
  let routerMock: jasmine.SpyObj<Router>;

  const mockLoadBaja: AcademicLoadSummaryDto = {
    totalCredits: 8,
    status: 'baja',
    statusLabel: 'Carga baja',
    weeklyPresentialHours: 4,
    weeklyAutonomousHours: 8,
    subjectsCount: 2,
    classesCount: 2,
  };

  const mockLoadBalanceada: AcademicLoadSummaryDto = {
    totalCredits: 15,
    status: 'balanceada',
    statusLabel: 'Carga balanceada',
    weeklyPresentialHours: 10,
    weeklyAutonomousHours: 20,
    subjectsCount: 4,
    classesCount: 5,
  };

  const mockLoadSobrecarga: AcademicLoadSummaryDto = {
    totalCredits: 22,
    status: 'sobrecarga',
    statusLabel: 'Sobrecarga',
    weeklyPresentialHours: 14,
    weeklyAutonomousHours: 28,
    subjectsCount: 6,
    classesCount: 8,
  };

  beforeEach(async () => {
    subjectServiceMock = jasmine.createSpyObj('SubjectService', [
      'getSubjects',
      'getAcademicLoadSummary',
      'deleteSubject',
      'searchSubjects',
    ]);

    routerMock = jasmine.createSpyObj('Router', ['navigate']);

    subjectServiceMock.getSubjects.and.returnValue(
      of({ status: 200, message: 'ok', data: [] }),
    );
    subjectServiceMock.getAcademicLoadSummary.and.returnValue(
      of({ status: 200, message: 'ok', data: mockLoadBalanceada }),
    );

    await TestBed.configureTestingModule({
      imports: [SubjectsComponent],
      providers: [
        { provide: SubjectService, useValue: subjectServiceMock },
        { provide: Router, useValue: routerMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(SubjectsComponent, '<div></div>')
      .compileComponents();

    fixture = TestBed.createComponent(SubjectsComponent);
    component = fixture.componentInstance;
  });

  describe('Carga Inicial y Ciclo de Vida (Lifecycle & State Initialization)', () => {
    it('REG-F26-01: debe consultar concurrentemente asignaturas y semáforo de carga académica en ngOnInit', () => {
      component.ngOnInit();

      Should(subjectServiceMock.getSubjects).HaveBeenCalled();
      Should(subjectServiceMock.getAcademicLoadSummary).HaveBeenCalled();
      Should(component.loadingLoad).Be(false);
      Should(component.academicLoad).NotBeNull();
      Should(component.academicLoad?.status).Be('balanceada');
    });

    it('REG-F26-02: debe manejar error en getAcademicLoadSummary asignando academicLoad = null sin lanzar excepción no capturada', () => {
      spyOn(console, 'error');
      subjectServiceMock.getAcademicLoadSummary.and.returnValue(
        throwError(() => new Error('Error de conectividad con el backend')),
      );

      component.loadAcademicLoad();

      Should(component.academicLoad).BeNull();
      Should(component.loadingLoad).Be(false);
      Should(console.error).HaveBeenCalled();
    });
  });

  describe('Clasificación Visual y Semáforo de Carga (UI Indicators & Status)', () => {
    it('REG-F26-03: debe clasificar y formatear adecuadamente la carga académica "baja" (< 12 créditos)', () => {
      subjectServiceMock.getAcademicLoadSummary.and.returnValue(
        of({ status: 200, message: 'ok', data: mockLoadBaja }),
      );

      component.loadAcademicLoad();

      Should(component.academicLoad?.status).Be('baja');
      Should(component.academicLoad?.totalCredits).Be(8);
      Should(component.getLoadStatusIcon('baja')).Be('trending_down');
      Should(component.getLoadStatusText('baja')).Be('Carga baja');
      Should(component.getLoadStatusDescription('baja')).Contain('< 12 créditos');
    });

    it('REG-F26-04: debe clasificar y formatear adecuadamente la carga académica "balanceada" (12 a 18 créditos)', () => {
      subjectServiceMock.getAcademicLoadSummary.and.returnValue(
        of({ status: 200, message: 'ok', data: mockLoadBalanceada }),
      );

      component.loadAcademicLoad();

      Should(component.academicLoad?.status).Be('balanceada');
      Should(component.academicLoad?.totalCredits).Be(15);
      Should(component.getLoadStatusIcon('balanceada')).Be('check_circle');
      Should(component.getLoadStatusText('balanceada')).Be('Carga balanceada');
      Should(component.getLoadStatusDescription('balanceada')).Contain('12 a 18 créditos');
    });

    it('REG-F26-05: debe clasificar y formatear adecuadamente la carga académica "sobrecarga" (> 18 créditos)', () => {
      subjectServiceMock.getAcademicLoadSummary.and.returnValue(
        of({ status: 200, message: 'ok', data: mockLoadSobrecarga }),
      );

      component.loadAcademicLoad();

      Should(component.academicLoad?.status).Be('sobrecarga');
      Should(component.academicLoad?.totalCredits).Be(22);
      Should(component.getLoadStatusIcon('sobrecarga')).Be('warning');
      Should(component.getLoadStatusText('sobrecarga')).Be('Sobrecarga');
      Should(component.getLoadStatusDescription('sobrecarga')).Contain('> 18 créditos');
    });

    it('REG-F26-06: debe proporcionar valores por defecto seguros para estados indefinidos o no reconocidos', () => {
      Should(component.getLoadStatusIcon(undefined)).Be('help_outline');
      Should(component.getLoadStatusText(undefined)).Be('Carga no calculada');
      Should(component.getLoadStatusDescription(undefined)).Be('');
    });
  });

  describe('Sincronización y Recálculo ante Acciones del Usuario (State Sync)', () => {
    it('REG-F26-07: debe re-consultar y sincronizar el semáforo al registrar una nueva asignatura (saveSubject)', () => {
      component.saveSubject();

      Should(component.showAddModal).Be(false);
      Should(subjectServiceMock.getSubjects).HaveBeenCalled();
      Should(subjectServiceMock.getAcademicLoadSummary).HaveBeenCalled();
    });

    it('REG-F26-08: debe re-consultar el semáforo al guardar cambios de una asignatura existente (onSubjectSaved)', () => {
      component.onSubjectSaved();

      Should(component.showEditModal).Be(false);
      Should(subjectServiceMock.getSubjects).HaveBeenCalled();
      Should(subjectServiceMock.getAcademicLoadSummary).HaveBeenCalled();
    });

    it('REG-F26-09: debe re-consultar el semáforo tras eliminar una asignatura confirmada por el usuario', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      component.selectedSubject = {
        id: 99,
        name: 'Materia a Eliminar',
        professor: 'Docente',
        color: '#ff0000',
        credits: 3,
        classes: [],
      } as any;

      subjectServiceMock.deleteSubject.and.returnValue(
        of({ status: 200, message: 'deleted', data: null as any }),
      );

      component.deleteSubject();

      Should(subjectServiceMock.deleteSubject).HaveBeenCalledWith(99);
      Should(subjectServiceMock.getAcademicLoadSummary).HaveBeenCalled();
      Should(component.contextMenuVisible).Be(false);
    });

    it('REG-F26-10: no debe eliminar la asignatura ni alterar el semáforo si el usuario cancela la confirmación', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      component.selectedSubject = { id: 88 } as any;

      component.deleteSubject();

      Should(subjectServiceMock.deleteSubject).NotHaveBeenCalled();
      Should(component.contextMenuVisible).Be(false);
    });
  });

  describe('Navegación e Integración (Routing)', () => {
    it('REG-F26-11: debe navegar hacia la vista detallada de la asignatura al invocar goToSubjectDetais', () => {
      component.goToSubjectDetais(42);

      Should(routerMock.navigate).HaveBeenCalledWith(['/subjects', 42]);
    });
  });
});
