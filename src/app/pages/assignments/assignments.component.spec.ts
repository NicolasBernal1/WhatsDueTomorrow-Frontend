
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AssignmentsComponent } from './assignments.component';
import { AssignmentService } from '../../services/assignment.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('AssignmentsComponent', () => {
  let component: AssignmentsComponent;
  let fixture: ComponentFixture<AssignmentsComponent>;
  let assignmentServiceMock: jasmine.SpyObj<AssignmentService>;

  const mockAssignment = {
    id: 1,
    title: 'Tarea 1',
    description: 'desc',
    dueDate: '2025-07-01',
    subjectId: 10,
    subjectName: 'Math',
  };

  beforeEach(async () => {
    assignmentServiceMock = jasmine.createSpyObj('AssignmentService', [
      'getAllAssignments',
      'deleteAssignment',
    ]);
    // Por defecto, la carga inicial (ngOnInit -> loadAssignments) es exitosa
    // y sin tareas. Los tests que necesiten otro comportamiento lo
    // sobreescriben ANTES de llamar a fixture.detectChanges().
    assignmentServiceMock.getAllAssignments.and.returnValue(
      of({ status: 200, message: 'OK', data: [] })
    );

    await TestBed.configureTestingModule({
      imports: [AssignmentsComponent],
      providers: [
        provideRouter([]),
        { provide: AssignmentService, useValue: assignmentServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(AssignmentsComponent, '<div></div>')
      .compileComponents();

    fixture = TestBed.createComponent(AssignmentsComponent);
    component = fixture.componentInstance;
    // OJO: no se llama fixture.detectChanges() aquí a propósito, para que
    // cada test controle cuándo se dispara ngOnInit() (y por tanto
    // loadAssignments()) después de configurar su propio mock.
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  
  describe('loadAssignments (Listar tareas)', () => {
    // Camino: 1,2,3,4,5,7,11 (ajustado: console.error en vez de alert, ver nota arriba)
    it('[Camino 1,2,3,4,5,7,11 – ajustado] debe registrar el error por consola y quitar el loading cuando la petición falla', () => {
      spyOn(console, 'error');
      assignmentServiceMock.getAllAssignments.and.returnValue(
        throwError(() => new Error('network error'))
      );

      fixture.detectChanges(); // dispara ngOnInit -> loadAssignments()

      expect(console.error).toHaveBeenCalled();
      expect(component.loading).toBeFalse();
      expect(component.assignments).toEqual([]);
    });

    // Camino: 1,2,3,4,5,6,8,10,11
    it('[Camino 1,2,3,4,5,6,8,10,11] debe dejar assignments vacío cuando la petición es exitosa pero sin tareas', () => {
      assignmentServiceMock.getAllAssignments.and.returnValue(
        of({ status: 200, message: 'OK', data: [] })
      );

      fixture.detectChanges();

      expect(component.assignments).toEqual([]);
      expect(component.loading).toBeFalse();
    });

    // Camino: 1,2,3,4,5,6,8,9,11
    it('[Camino 1,2,3,4,5,6,8,9,11] debe cargar las tareas cuando la petición es exitosa y trae elementos', () => {
      assignmentServiceMock.getAllAssignments.and.returnValue(
        of({ status: 200, message: 'OK', data: [mockAssignment] as any })
      );

      fixture.detectChanges();

      expect(component.assignments).toEqual([mockAssignment] as any);
      expect(component.loading).toBeFalse();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Editar tarea (Frontend) → editAssignment()
  //
  // Tabla de caminos (Excel):
  // | Camino                          | Entrada                                                        | Prueba                              | Salida                                          |
  // |-----------------------------------|--------------------------------------------------------------------|----------------------------------------|------------------------------------------------------|
  // | 1,2,3,4,7,17                       | Clic derecho, luego "Editar", sin tarea seleccionada               | Hay selected assignments? = No        | Return → fin                                        |
  // | 1,2,3,4,5,6,8,9,11,17              | Hay tarea seleccionada, se abre el modal, se envían los cambios    | Sucess? = No                          | Alert(error) → fin                                  |
  // | 1,2,3,4,5,6,8,9,10,12,14,17        | Hay tarea seleccionada, la petición sale bien                      | Sucess? = Sí; Hay Edit assignments? = No | Return → fin                                     |
  // | 1,2,3,4,5,6,8,9,10,12,13,15,16,17  | Hay tarea seleccionada, la petición sale bien, hay tarea a editar   | Sucess? = Sí; Hay Edit assignments? = Sí | select assignments → ShowEditModal → Close contexto → fin |
  //
  // ⚠ MISMATCH IMPORTANTE: el método real editAssignment() en
  // assignments.component.ts es mucho más simple que lo que describe la
  // tabla — NO hace ninguna petición HTTP ni evalúa "Sucess?":
  //
  //   editAssignment(): void {
  //     if (!this.selectedAssignment) return;
  //     this.showEditModal = true;
  //     this.closeContextMenu();
  //   }
  //
  // Solo el primer camino (sin tarea seleccionada → return) corresponde
  // exactamente al código actual. Los otros 3 caminos de la tabla (con
  // llamada HTTP, éxito/error, "Hay Edit assignments?") no tienen
  // contraparte en el código: la petición real de guardado ocurre en
  // AddAssignmentModalComponent.onSave() (ver tests de "Registrar tarea"),
  // no aquí. Por eso solo se agregan 2 tests reales (return temprano /
  // abrir modal), y se deja este comentario como evidencia para la
  // sustentación de que se detectó la diferencia. Recomendable revisar y
  // corregir esta tabla en el Excel, igual que se hizo con "Registrar tarea".
  // ═══════════════════════════════════════════════════════════════════════
  describe('editAssignment (Editar tarea)', () => {
    beforeEach(() => {
      assignmentServiceMock.getAllAssignments.and.returnValue(
        of({ status: 200, message: 'OK', data: [] })
      );
      fixture.detectChanges();
    });

    // Camino: 1,2,3,4,7,17
    it('[Camino 1,2,3,4,7,17] no debe abrir el modal cuando no hay tarea seleccionada', () => {
      component.selectedAssignment = null;

      component.editAssignment();

      expect(component.showEditModal).toBeFalse();
    });

    // Comportamiento real (sin camino exacto en la tabla, ver nota de mismatch arriba)
    it('debe abrir el modal de edición y cerrar el menú contextual cuando hay tarea seleccionada', () => {
      component.selectedAssignment = mockAssignment as any;
      component.contextMenuVisible = true;

      component.editAssignment();

      expect(component.showEditModal).toBeTrue();
      expect(component.contextMenuVisible).toBeFalse();
    });
  });
});