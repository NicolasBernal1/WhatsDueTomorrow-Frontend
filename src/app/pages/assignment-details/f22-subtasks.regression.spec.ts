import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AssignmentDetailsComponent } from './assignment-details.component';
import { AssignmentService } from '../../services/assignment.service';
import { SubtaskService } from '../../services/subtask.service';
import { AssignmentResponseCompDto } from '../../models/assignment-response-comp.dto';
import { Subtask } from '../../models/subtask.model';
import { Should } from '../../common/fluent-assertions';

/**
 * ============================================================================
 * SUITE DE PRUEBAS DE REGRESIÓN — F22: DESGLOSAR TAREAS EN SUBTAREAS CON AVANCE
 * ============================================================================
 * Objetivo de Regresión:
 * Garantizar que modificaciones futuras en la interfaz de usuario, manejo de
 * estado optimista, redondeo matemático de porcentajes, navegación segura o
 * control de límites de reordenamiento no rompan la experiencia ni dejen a la
 * aplicación en estados inconsistentes con el servidor.
 */
describe('F22 Regression Suite: Desglosar tareas en subtareas con avance porcentual (Frontend)', () => {
  let component: AssignmentDetailsComponent;
  let fixture: ComponentFixture<AssignmentDetailsComponent>;
  let assignmentServiceMock: jasmine.SpyObj<AssignmentService>;
  let subtaskServiceMock: jasmine.SpyObj<SubtaskService>;
  let routerMock: jasmine.SpyObj<Router>;
  let activatedRouteStub: any;

  const mockAssignment: AssignmentResponseCompDto = {
    id: 42,
    title: 'Proyecto de Verificación y Validación',
    description: 'Pruebas de regresión automatizadas',
    dueDate: '2026-11-20T23:59:59Z',
    subjectId: 5,
    subjectName: 'Calidad de Software',
  };

  const initialSubtasks: Subtask[] = [
    { id: 1, title: 'Definición de Invariantes', completed: true, position: 0 },
    { id: 2, title: 'Diseño de Casos de Prueba', completed: false, position: 1 },
    { id: 3, title: 'Automatización CI/CD', completed: false, position: 2 },
  ];

  beforeEach(async () => {
    assignmentServiceMock = jasmine.createSpyObj('AssignmentService', [
      'getAllAssignments',
    ]);
    subtaskServiceMock = jasmine.createSpyObj('SubtaskService', [
      'getAll',
      'create',
      'update',
      'remove',
      'reorder',
    ]);
    routerMock = jasmine.createSpyObj('Router', ['navigate']);

    activatedRouteStub = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue('42'),
        },
      },
    };

    assignmentServiceMock.getAllAssignments.and.returnValue(
      of({ status: 200, message: 'OK', data: [mockAssignment] })
    );

    subtaskServiceMock.getAll.and.returnValue(
      of({
        status: 200,
        message: 'OK',
        data: {
          subtasks: initialSubtasks.map((s) => ({ ...s })),
          progress: 33,
        },
      })
    );

    await TestBed.configureTestingModule({
      imports: [AssignmentDetailsComponent],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRouteStub },
        { provide: Router, useValue: routerMock },
        { provide: AssignmentService, useValue: assignmentServiceMock },
        { provide: SubtaskService, useValue: subtaskServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(AssignmentDetailsComponent, '<div></div>')
      .compileComponents();

    fixture = TestBed.createComponent(AssignmentDetailsComponent);
    component = fixture.componentInstance;
  });

  // ──────────────────────────────────────────────────────────────────────────
  // INVARIANTE 1: Reactividad Optimista con Rollback ante Error del Servidor
  // ──────────────────────────────────────────────────────────────────────────
  describe('Invariante de Regresión 1: Actualización Optimista y Reversión (Rollback)', () => {
    it('debe actualizar inmediatamente la completitud y el progreso en la UI, y sincronizar al confirmar el servidor', () => {
      fixture.detectChanges();
      const targetSubtask = component.subtasks[1]; // id: 2, completed: false

      // Configurar respuesta exitosa del servidor
      subtaskServiceMock.update.and.returnValue(
        of({
          status: 200,
          message: 'OK',
          data: {
            subtasks: [
              { ...component.subtasks[0] },
              { ...targetSubtask, completed: true },
              { ...component.subtasks[2] },
            ],
            progress: 67,
          },
        })
      );

      // Act: marcar como completada
      component.toggleSubtask(targetSubtask);

      Should(subtaskServiceMock.update).HaveBeenCalledWith(42, 2, {
        completed: true,
      });
      component.progress.Should().Be(67);
      component.error.Should().Be('');
    });

    it('debe revertir (rollback) el checkbox y el progreso si la petición HTTP falla en el backend', () => {
      fixture.detectChanges();
      const targetSubtask = component.subtasks[1]; // initial completed: false
      const initialProgress = component.progress; // 33%

      // Simular fallo HTTP 500 en la red
      subtaskServiceMock.update.and.returnValue(
        throwError(() => new Error('Error 500: Database lock'))
      );

      // Act: toggle que falla
      component.toggleSubtask(targetSubtask);

      // Assert: el estado debe revertirse estrictamente a false y 33%
      targetSubtask.completed.Should().BeFalse();
      component.progress.Should().Be(initialProgress);
      component.error.Should().Be('No fue posible actualizar el progreso.');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // INVARIANTE 2: Aritmética y Casos Frontera en la Barra de Progreso
  // ──────────────────────────────────────────────────────────────────────────
  describe('Invariante de Regresión 2: Integridad Matemática del Progreso Porcentual', () => {
    it('debe retornar 0% cuando la lista de subtareas está vacía sin generar NaN', () => {
      fixture.detectChanges();
      component.subtasks = [];

      (component as any).refreshProgress();

      component.progress.Should().Be(0);
      isNaN(component.progress).Should().BeFalse();
    });

    it('debe calcular exactamente los umbrales de avance porcentual entero', () => {
      fixture.detectChanges();

      // 1 de 3 completadas
      component.subtasks = [
        { id: 1, title: 'A', completed: true, position: 0 },
        { id: 2, title: 'B', completed: false, position: 1 },
        { id: 3, title: 'C', completed: false, position: 2 },
      ];
      (component as any).refreshProgress();
      component.progress.Should().Be(33);

      // 2 de 3 completadas
      component.subtasks[1].completed = true;
      (component as any).refreshProgress();
      component.progress.Should().Be(67);

      // 3 de 3 completadas
      component.subtasks[2].completed = true;
      (component as any).refreshProgress();
      component.progress.Should().Be(100);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // INVARIANTE 3: Control de Límites en Reordenamiento (move)
  // ──────────────────────────────────────────────────────────────────────────
  describe('Invariante de Regresión 3: Control de Límites en Reordenamiento y Recuperación', () => {
    it('no debe permitir mover hacia arriba el primer elemento de la lista', () => {
      fixture.detectChanges();
      const firstItem = component.subtasks[0];

      component.move(firstItem, -1);

      Should(subtaskServiceMock.reorder).NotHaveBeenCalled();
    });

    it('no debe permitir mover hacia abajo el último elemento de la lista', () => {
      fixture.detectChanges();
      const lastItem = component.subtasks[component.subtasks.length - 1];

      component.move(lastItem, 1);

      Should(subtaskServiceMock.reorder).NotHaveBeenCalled();
    });

    it('debe recargar subtareas desde el servidor para corregir el orden si la petición reorder falla', () => {
      fixture.detectChanges();
      subtaskServiceMock.reorder.and.returnValue(
        throwError(() => new Error('Error 400: Concurrencia'))
      );

      const middleItem = component.subtasks[1];
      component.move(middleItem, -1);

      // Debe haber llamado a getAll para sincronizar tras el fallo
      Should(subtaskServiceMock.getAll).HaveBeenCalled();
      component.error.Should().Be('No fue posible cambiar el orden.');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // INVARIANTE 4: Sanitización de Formularios en Creación y Edición
  // ──────────────────────────────────────────────────────────────────────────
  describe('Invariante de Regresión 4: Validación y Limpieza en Formularios', () => {
    it('no debe llamar al servicio si el título de la nueva subtarea está vacío o son puros espacios', () => {
      fixture.detectChanges();

      component.newTitle = '    ';
      component.addSubtask();

      Should(subtaskServiceMock.create).NotHaveBeenCalled();
    });

    it('debe limpiar newTitle a string vacío tras la adición exitosa', () => {
      fixture.detectChanges();
      subtaskServiceMock.create.and.returnValue(
        of({
          status: 201,
          message: 'OK',
          data: {
            subtasks: [...component.subtasks, { id: 4, title: 'Nueva', completed: false, position: 3 }],
            progress: 25,
          },
        })
      );

      component.newTitle = 'Documentar API';
      component.addSubtask();

      Should(subtaskServiceMock.create).HaveBeenCalledWith(42, 'Documentar API');
      component.newTitle.Should().Be('');
    });

    it('debe resetear editingId a undefined tras guardar exitosamente una edición', () => {
      fixture.detectChanges();
      const itemToEdit = component.subtasks[0];
      component.startEditing(itemToEdit);
      component.editingTitle = 'Título Editado';

      subtaskServiceMock.update.and.returnValue(
        of({
          status: 200,
          message: 'OK',
          data: {
            subtasks: component.subtasks,
            progress: 33,
          },
        })
      );

      component.saveEditing(itemToEdit);

      Should(component.editingId).BeUndefined();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // INVARIANTE 5: Navegación Defensiva y Protección contra Rutas Huérfanas
  // ──────────────────────────────────────────────────────────────────────────
  describe('Invariante de Regresión 5: Navegación Segura ante Parámetros Inválidos o Tareas No Encontradas', () => {
    it('debe redirigir a /assignments si el parámetro :id no es numérico', () => {
      activatedRouteStub.snapshot.paramMap.get.and.returnValue('invalido');

      component.ngOnInit();

      Should(routerMock.navigate).HaveBeenCalledWith(['/assignments']);
      Should(assignmentServiceMock.getAllAssignments).NotHaveBeenCalled();
    });

    it('debe redirigir a /assignments si la entrega no existe en la lista del usuario', () => {
      activatedRouteStub.snapshot.paramMap.get.and.returnValue('9999');

      component.ngOnInit();

      Should(routerMock.navigate).HaveBeenCalledWith(['/assignments']);
      Should(subtaskServiceMock.getAll).NotHaveBeenCalled();
    });
  });
});
