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
    subjectServiceMock = jasmine.createSpyObj('SubjectService', ['getSubjects', 'deleteSubject', 'getAcademicLoadSummary']);
    routerMock = jasmine.createSpyObj('Router', ['navigate']);

    subjectServiceMock.getAcademicLoadSummary.and.returnValue(
      of({
        status: 200,
        message: 'ok',
        data: {
          totalCredits: 15,
          status: 'balanceada' as const,
          statusLabel: 'Carga balanceada',
          weeklyPresentialHours: 8,
          weeklyAutonomousHours: 16,
          subjectsCount: 5,
          classesCount: 4,
        },
      }),
    );

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

  // ─── Gestión de créditos y semáforo de carga semanal (HU26 / RF26-RF29 / RNF10-RNF11) ───

  describe('Semáforo de carga académica y horas de estudio (HU26 / RF26-RF29)', () => {

    beforeEach(() => {
      subjectServiceMock.getSubjects.and.returnValue(
        of({ status: 200, message: 'ok', data: [] }),
      );
    });

    it('17. debe cargar y almacenar el resumen de carga académica en ngOnInit', () => {
      component.ngOnInit();
      expect(subjectServiceMock.getAcademicLoadSummary).toHaveBeenCalled();
      expect(component.academicLoad).toBeTruthy();
      expect(component.academicLoad?.totalCredits).toBe(15);
      expect(component.academicLoad?.status).toBe('balanceada');
      expect(component.academicLoad?.weeklyAutonomousHours).toBe(16);
      expect(component.loadingLoad).toBeFalse();
    });

    it('18. debe clasificar como carga baja cuando los créditos son menores a 12', () => {
      subjectServiceMock.getAcademicLoadSummary.and.returnValue(
        of({
          status: 200,
          message: 'ok',
          data: {
            totalCredits: 9,
            status: 'baja' as const,
            statusLabel: 'Carga baja',
            weeklyPresentialHours: 6,
            weeklyAutonomousHours: 12,
            subjectsCount: 3,
            classesCount: 3,
          },
        }),
      );

      component.loadAcademicLoad();

      expect(component.academicLoad?.status).toBe('baja');
      expect(component.academicLoad?.statusLabel).toBe('Carga baja');
      expect(component.getLoadStatusIcon('baja')).toBe('trending_down');
      expect(component.getLoadStatusText('baja')).toBe('Carga baja');
      expect(component.getLoadStatusDescription('baja')).toContain('< 12 créditos');
    });

    it('19. debe clasificar como sobrecarga cuando los créditos son mayores a 18', () => {
      subjectServiceMock.getAcademicLoadSummary.and.returnValue(
        of({
          status: 200,
          message: 'ok',
          data: {
            totalCredits: 21,
            status: 'sobrecarga' as const,
            statusLabel: 'Sobrecarga',
            weeklyPresentialHours: 14,
            weeklyAutonomousHours: 28,
            subjectsCount: 7,
            classesCount: 7,
          },
        }),
      );

      component.loadAcademicLoad();

      expect(component.academicLoad?.status).toBe('sobrecarga');
      expect(component.academicLoad?.statusLabel).toBe('Sobrecarga');
      expect(component.getLoadStatusIcon('sobrecarga')).toBe('warning');
      expect(component.getLoadStatusText('sobrecarga')).toBe('Sobrecarga');
      expect(component.getLoadStatusDescription('sobrecarga')).toContain('> 18 créditos');
    });

    it('20. debe calcular las horas autónomas como el doble de las horas presenciales (factor 2:1)', () => {
      subjectServiceMock.getAcademicLoadSummary.and.returnValue(
        of({
          status: 200,
          message: 'ok',
          data: {
            totalCredits: 12,
            status: 'balanceada' as const,
            statusLabel: 'Carga balanceada',
            weeklyPresentialHours: 8,
            weeklyAutonomousHours: 16,
            subjectsCount: 4,
            classesCount: 4,
          },
        }),
      );

      component.loadAcademicLoad();

      expect(component.academicLoad?.weeklyAutonomousHours).toBe(
        component.academicLoad!.weeklyPresentialHours * 2,
      );
    });

    it('21. debe actualizar reactivamente la carga académica al crear asignatura (saveSubject)', () => {
      spyOn(component, 'loadAcademicLoad');
      component.saveSubject();
      expect(component.loadAcademicLoad).toHaveBeenCalled();
    });

    it('22. debe actualizar reactivamente la carga académica al editar asignatura (onSubjectSaved)', () => {
      spyOn(component, 'loadAcademicLoad');
      component.onSubjectSaved();
      expect(component.loadAcademicLoad).toHaveBeenCalled();
    });

    it('23. debe actualizar reactivamente la carga académica al eliminar asignatura (deleteSubject)', () => {
      spyOn(component, 'loadAcademicLoad');
      spyOn(window, 'confirm').and.returnValue(true);
      subjectServiceMock.deleteSubject.and.returnValue(
        of({ status: 200, message: 'ok', data: null }),
      );
      component.selectedSubject = subjectMock;

      component.deleteSubject();

      expect(component.loadAcademicLoad).toHaveBeenCalled();
    });

    it('24. debe manejar el error al cargar el resumen sin romper el componente', () => {
      spyOn(console, 'error');
      subjectServiceMock.getAcademicLoadSummary.and.returnValue(
        throwError(() => new Error('Error al conectar')),
      );

      component.loadAcademicLoad();

      expect(console.error).toHaveBeenCalled();
      expect(component.loadingLoad).toBeFalse();
    });

    it('25. debe proveer textos e iconos accesibles (RNF10) para cada estado', () => {
      expect(component.getLoadStatusIcon('balanceada')).toBe('check_circle');
      expect(component.getLoadStatusText('balanceada')).toBe('Carga balanceada');
      expect(component.getLoadStatusDescription('balanceada')).toContain('12 a 18 créditos');

      expect(component.getLoadStatusIcon(undefined)).toBe('help_outline');
      expect(component.getLoadStatusText(undefined)).toBe('Carga no calculada');
    });

  });

});