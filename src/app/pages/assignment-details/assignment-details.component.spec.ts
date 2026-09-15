import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AssignmentDetailsComponent } from './assignment-details.component';
import { AssignmentService } from '../../services/assignment.service';
import { SubtaskService } from '../../services/subtask.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { AssignmentResponseCompDto } from '../../models/assignment-response-comp.dto';
import { Subtask } from '../../models/subtask.model';

describe('AssignmentDetailsComponent (F22 — Desglosar tareas en subtareas con avance porcentual - Tabla 11)', () => {
  let component: AssignmentDetailsComponent;
  let fixture: ComponentFixture<AssignmentDetailsComponent>;
  let assignmentServiceMock: jasmine.SpyObj<AssignmentService>;
  let subtaskServiceMock: jasmine.SpyObj<SubtaskService>;
  let routerMock: jasmine.SpyObj<Router>;
  let activatedRouteStub: any;

  const mockAssignment: AssignmentResponseCompDto = {
    id: 10,
    title: 'Informe de Arquitectura',
    description: 'Documentación de vistas C4',
    dueDate: '2026-10-01T00:00:00Z',
    subjectId: 1,
    subjectName: 'Arquitectura de Software',
  };

  const mockSubtask1: Subtask = {
    id: 101,
    title: 'Diagrama de Contexto',
    completed: true,
    position: 0,
  };

  const mockSubtask2: Subtask = {
    id: 102,
    title: 'Diagrama de Contenedores',
    completed: false,
    position: 1,
  };

  beforeEach(async () => {
    assignmentServiceMock = jasmine.createSpyObj('AssignmentService', ['getAllAssignments']);
    subtaskServiceMock = jasmine.createSpyObj('SubtaskService', ['getAll', 'create', 'update', 'remove', 'reorder']);
    routerMock = jasmine.createSpyObj('Router', ['navigate']);

    activatedRouteStub = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue('10'),
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
          subtasks: [{ ...mockSubtask1 }, { ...mockSubtask2 }],
          progress: 50,
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

  it('debe crearse e inicializarse correctamente cargando la entrega y sus subtareas', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.assignment?.id).toBe(10);
    expect(component.subtasks.length).toBe(2);
    expect(component.progress).toBe(50);
  });

  // ─── TABLA 11: CAMINOS BÁSICOS INDEPENDIENTES (FRONTEND F22) ─────────────────

  // Camino P1: 1-2-3-24 (Parámetro :id no numérico o ausente -> goBack() inmediato)
  it('Camino P1 (1-2-3-24): debe ejecutar goBack() y redirigir a /assignments si el parámetro :id es inválido o 0', () => {
    // Arrange: ruta con id 'abc'
    activatedRouteStub.snapshot.paramMap.get.and.returnValue('abc');

    // Act
    component.ngOnInit();

    // Assert
    expect(routerMock.navigate).toHaveBeenCalledWith(['/assignments']);
    expect(assignmentServiceMock.getAllAssignments).not.toHaveBeenCalled();
  });

  // Camino P2: 1-2-4-5-6-24 (ID numérico pero asignación no encontrada en la API)
  it('Camino P2 (1-2-4-5-6-24): debe ejecutar goBack() si la asignación no existe en la lista retornada por la API', () => {
    // Arrange: API retorna lista vacía
    assignmentServiceMock.getAllAssignments.and.returnValue(
      of({ status: 200, message: 'OK', data: [] })
    );

    // Act
    component.ngOnInit();

    // Assert
    expect(routerMock.navigate).toHaveBeenCalledWith(['/assignments']);
    expect(component.assignment).toBeUndefined();
  });

  // Camino P3: 1-2-4-5-7-8-10-11-12-24 (Fallo HTTP al cargar subtareas)
  it('Camino P3 (1-2-4-5-7-8-10-11-12-24): debe capturar el error y mostrar mensaje cuando falla la carga de subtareas', () => {
    // Arrange: getAll falla con HTTP 500
    subtaskServiceMock.getAll.and.returnValue(
      throwError(() => new Error('Error al conectar con la API de subtareas'))
    );

    // Act
    component.ngOnInit();

    // Assert
    expect(component.error).toBe('No fue posible cargar las subtareas.');
    expect(component.loading).toBeFalse();
  });

  // Camino P4: 1-2-4-5-7-8-9-11-12-24 (Flujo nominal de consulta y renderizado de progreso)
  it('Camino P4 (1-2-4-5-7-8-9-11-12-24): debe renderizar subtareas y calcular la barra de progreso correctamente', () => {
    // Act
    component.ngOnInit();

    // Assert
    expect(component.loading).toBeFalse();
    expect(component.subtasks.length).toBe(2);
    expect(component.progress).toBe(50);
  });

  // Camino P5: 1-2-4-5-7-8-9-11-12-13-11-12-24 (Intento de agregar subtarea con campo vacío)
  it('Camino P5 (1-2-4-5-7-8-9-11-12-13-11-12-24): debe bloquear la creación y no invocar la API si newTitle está vacío', () => {
    // Arrange
    component.ngOnInit();
    component.newTitle = '    ';

    // Act
    component.addSubtask();

    // Assert
    expect(subtaskServiceMock.create).not.toHaveBeenCalled();
  });

  // Camino P6: 1-2-4-5-7-8-9-11-12-13-14-11-12-24 (Creación exitosa de subtarea)
  it('Camino P6 (1-2-4-5-7-8-9-11-12-13-14-11-12-24): debe crear la subtarea, limpiar el campo y actualizar el progreso', () => {
    // Arrange
    component.ngOnInit();
    component.newTitle = 'Nuevo Diagrama de Componentes';
    const updatedSubtasks: Subtask[] = [
      mockSubtask1,
      mockSubtask2,
      { id: 103, title: 'Nuevo Diagrama de Componentes', completed: false, position: 2 },
    ];
    subtaskServiceMock.create.and.returnValue(
      of({ status: 201, message: 'Created', data: { subtasks: updatedSubtasks, progress: 33 } })
    );

    // Act
    component.addSubtask();

    // Assert
    expect(subtaskServiceMock.create).toHaveBeenCalledWith(10, 'Nuevo Diagrama de Componentes');
    expect(component.newTitle).toBe('');
    expect(component.subtasks.length).toBe(3);
    expect(component.progress).toBe(33);
  });

  // Camino P7: 1-2-4-5-7-8-9-11-12-15-16-11-12-24 (Toggle optimista exitoso con recálculo reactivo)
  it('Camino P7 (1-2-4-5-7-8-9-11-12-15-16-11-12-24): debe alternar optimistic toggle y actualizar progreso en servidor', () => {
    // Arrange
    component.ngOnInit();
    const targetSubtask = { ...mockSubtask2 }; // completed: false
    subtaskServiceMock.update.and.returnValue(
      of({
        status: 200,
        message: 'Updated',
        data: { subtasks: [{ ...mockSubtask1 }, { ...targetSubtask, completed: true }], progress: 100 },
      })
    );

    // Act
    component.toggleSubtask(targetSubtask);

    // Assert
    expect(subtaskServiceMock.update).toHaveBeenCalledWith(10, 102, { completed: true });
    expect(component.progress).toBe(100);
  });

  // Camino P8: 1-2-4-5-7-8-9-11-12-15-16-17-11-12-24 (Fallo en toggle -> Rollback del estado previo)
  it('Camino P8 (1-2-4-5-7-8-9-11-12-15-16-17-11-12-24): debe revertir optimistic toggle ante fallo HTTP y notificar error', () => {
    // Arrange
    component.ngOnInit();
    const targetSubtask = { ...mockSubtask2, completed: false };
    subtaskServiceMock.update.and.returnValue(
      throwError(() => new Error('Error al actualizar estado'))
    );

    // Act
    component.toggleSubtask(targetSubtask);

    // Assert
    expect(targetSubtask.completed).toBeFalse();
    expect(component.error).toBe('No fue posible actualizar el progreso.');
  });

  // Camino P9: 1-2-4-5-7-8-9-11-12-18-11-12-24 (Edición con título vacío previene actualización)
  it('Camino P9 (1-2-4-5-7-8-9-11-12-18-11-12-24): debe impedir el guardado si el título editado está vacío', () => {
    // Arrange
    component.ngOnInit();
    component.startEditing(mockSubtask1);
    component.editingTitle = '   ';

    // Act
    component.saveEditing(mockSubtask1);

    // Assert
    expect(subtaskServiceMock.update).not.toHaveBeenCalled();
  });

  // Camino P10: 1-2-4-5-7-8-9-11-12-18-19-11-12-24 (Renombrado exitoso de subtarea)
  it('Camino P10 (1-2-4-5-7-8-9-11-12-18-19-11-12-24): debe actualizar título en backend y cerrar modo edición', () => {
    // Arrange
    component.ngOnInit();
    component.startEditing(mockSubtask1);
    component.editingTitle = 'Diagrama de Contexto C4 Actualizado';
    subtaskServiceMock.update.and.returnValue(
      of({
        status: 200,
        message: 'Updated',
        data: { subtasks: [{ ...mockSubtask1, title: 'Diagrama de Contexto C4 Actualizado' }, mockSubtask2], progress: 50 },
      })
    );

    // Act
    component.saveEditing(mockSubtask1);

    // Assert
    expect(subtaskServiceMock.update).toHaveBeenCalledWith(10, 101, { title: 'Diagrama de Contexto C4 Actualizado' });
    expect(component.editingId).toBeUndefined();
  });

  // Camino P11: 1-2-4-5-7-8-9-11-12-20-11-12-24 (Eliminación exitosa de subtarea)
  it('Camino P11 (1-2-4-5-7-8-9-11-12-20-11-12-24): debe eliminar la subtarea seleccionada y recalcular el avance', () => {
    // Arrange
    component.ngOnInit();
    subtaskServiceMock.remove.and.returnValue(
      of({
        status: 200,
        message: 'Deleted',
        data: { subtasks: [mockSubtask2], progress: 0 },
      })
    );

    // Act
    component.deleteSubtask(mockSubtask1);

    // Assert
    expect(subtaskServiceMock.remove).toHaveBeenCalledWith(10, 101);
    expect(component.subtasks.length).toBe(1);
    expect(component.progress).toBe(0);
  });

  // Camino P12: 1-2-4-5-7-8-9-11-12-21-22-11-12-24 (Mover fuera de límites: BVA boundary check)
  it('Camino P12 (1-2-4-5-7-8-9-11-12-21-22-11-12-24): debe abortar operación si targetIndex está fuera de límites', () => {
    // Arrange
    component.ngOnInit();

    // Act: Intentar subir la primera subtarea (índice 0 con dirección -1 -> targetIndex -1)
    component.move(component.subtasks[0], -1);

    // Assert
    expect(subtaskServiceMock.reorder).not.toHaveBeenCalled();

    // Act: Intentar bajar la última subtarea (índice 1 con dirección +1 -> targetIndex 2 >= length)
    component.move(component.subtasks[1], 1);

    // Assert
    expect(subtaskServiceMock.reorder).not.toHaveBeenCalled();
  });

  // Camino P13: 1-2-4-5-7-8-9-11-12-21-22-23-11-12-24 (Swap posicional y reordenamiento persistido)
  it('Camino P13 (1-2-4-5-7-8-9-11-12-21-22-23-11-12-24): debe realizar swap local y persistir el nuevo orden con PATCH /order', () => {
    // Arrange
    component.ngOnInit();
    subtaskServiceMock.reorder.and.returnValue(
      of({
        status: 200,
        message: 'Reordered',
        data: { subtasks: [{ ...mockSubtask2, position: 0 }, { ...mockSubtask1, position: 1 }], progress: 50 },
      })
    );

    // Act: Bajar la primera subtarea (índice 0 con dirección +1)
    component.move(component.subtasks[0], 1);

    // Assert
    expect(subtaskServiceMock.reorder).toHaveBeenCalledWith(10, [102, 101]);
  });

  // ─── PRUEBAS DE DETECCIÓN DE DEFECTOS (QA AUDIT / VERIFICACIÓN DE DEFECTOS) ───

  // DEF-QA-F22-01: Verificación de cancelación de modo edición para no bloquear la interfaz
  it('[DEF-QA-F22-01]: debe permitir cancelar o restaurar editingId a undefined al enviar un título vacío para evitar el bloqueo del estudiante', () => {
    // Arrange
    component.ngOnInit();
    component.startEditing(mockSubtask1);
    expect(component.editingId).toBe(101);

    // Act: El estudiante borra todo el texto e intenta salir/guardar
    component.editingTitle = '';
    component.saveEditing(mockSubtask1);

    // Expectativa de V&V: El modo edición no debe quedar atrapado indefinidamente
    // (Esta aserción evalúa el defecto identificado DEF-QA-F22-01 en el informe de QA)
    expect(component.editingId).toBeUndefined();
  });
});
