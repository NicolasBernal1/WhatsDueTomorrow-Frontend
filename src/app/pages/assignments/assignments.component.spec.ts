import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AssignmentsComponent } from './assignments.component';
import { AssignmentService } from '../../services/assignment.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AssignmentResponseCompDto } from '../../models/assignment-response-comp.dto';

describe('AssignmentsComponent', () => {
  let component: AssignmentsComponent;
  let fixture: ComponentFixture<AssignmentsComponent>;
  let assignmentServiceMock: jasmine.SpyObj<AssignmentService>;
  let router: Router;

  const mockAssignment: AssignmentResponseCompDto = {
    id: 1,
    title: 'Tarea 1',
    description: 'Descripción',
    dueDate: '2026-09-20T00:00:00',
    subjectId: 10,
    subjectName: 'Matemáticas',
  };

  beforeEach(async () => {
    assignmentServiceMock = jasmine.createSpyObj('AssignmentService', [
      'getAllAssignments',
      'deleteAssignment',
    ]);
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
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('loadAssignments', () => {
    it('should populate assignments and stop loading on success', () => {
      assignmentServiceMock.getAllAssignments.and.returnValue(
        of({ status: 200, message: 'OK', data: [mockAssignment] })
      );

      component.loadAssignments();

      expect(component.assignments).toEqual([mockAssignment]);
      expect(component.loading).toBeFalse();
    });

    it('should default to an empty list when the response has no data', () => {
      assignmentServiceMock.getAllAssignments.and.returnValue(
        of({ status: 200, message: 'OK', data: undefined as any })
      );

      component.loadAssignments();

      expect(component.assignments).toEqual([]);
      expect(component.loading).toBeFalse();
    });

    it('should stop loading and log the error when the request fails', () => {
      spyOn(console, 'error');
      assignmentServiceMock.getAllAssignments.and.returnValue(
        throwError(() => new Error('network error'))
      );

      component.loadAssignments();

      expect(component.loading).toBeFalse();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('onRightClickAssignment', () => {
    it('should set the selected assignment and open the context menu at the click position', () => {
      const event = new MouseEvent('contextmenu', { clientX: 50, clientY: 80 });
      spyOn(event, 'preventDefault');

      component.onRightClickAssignment(event, mockAssignment);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.selectedAssignment).toEqual(mockAssignment);
      expect(component.contextMenuX).toBe(50);
      expect(component.contextMenuY).toBe(80);
      expect(component.contextMenuVisible).toBeTrue();
    });
  });

  describe('openAssignmentDetails', () => {
    it('should navigate to the assignment details route', () => {
      spyOn(router, 'navigate');

      component.openAssignmentDetails(7);

      expect(router.navigate).toHaveBeenCalledWith(['/assignments', 7]);
    });
  });

  describe('editAssignment', () => {
    it('should do nothing when there is no selected assignment', () => {
      component.selectedAssignment = null;

      component.editAssignment();

      expect(component.showEditModal).toBeFalse();
    });

    it('should open the edit modal and close the context menu when an assignment is selected', () => {
      component.selectedAssignment = mockAssignment;
      component.contextMenuVisible = true;

      component.editAssignment();

      expect(component.showEditModal).toBeTrue();
      expect(component.contextMenuVisible).toBeFalse();
    });
  });

  describe('closeContextMenu', () => {
    it('should hide the context menu', () => {
      component.contextMenuVisible = true;

      component.closeContextMenu();

      expect(component.contextMenuVisible).toBeFalse();
    });
  });

  describe('closeEditModal', () => {
    it('should hide the edit modal and clear the selected assignment', () => {
      component.showEditModal = true;
      component.selectedAssignment = mockAssignment;

      component.closeEditModal();

      expect(component.showEditModal).toBeFalse();
      expect(component.selectedAssignment).toBeNull();
    });
  });

  describe('saveAssignment', () => {
    it('should close the edit modal and reload assignments', () => {
      spyOn(component, 'closeEditModal').and.callThrough();
      spyOn(component, 'loadAssignments').and.callThrough();

      component.saveAssignment();

      expect(component.closeEditModal).toHaveBeenCalled();
      expect(component.loadAssignments).toHaveBeenCalled();
    });
  });

  describe('deleteAssignment', () => {
    it('should do nothing when there is no selected assignment', () => {
      component.selectedAssignment = null;

      component.deleteAssignment();

      expect(assignmentServiceMock.deleteAssignment).not.toHaveBeenCalled();
    });

    it('should delete, reload and close the context menu when confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      assignmentServiceMock.deleteAssignment.and.returnValue(of({ status: 200, message: 'OK', data: null }));
      component.selectedAssignment = mockAssignment;

      component.deleteAssignment();

      expect(assignmentServiceMock.deleteAssignment).toHaveBeenCalledWith(mockAssignment.id);
      expect(component.contextMenuVisible).toBeFalse();
    });

    it('should log the error when the delete request fails', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(console, 'error');
      assignmentServiceMock.deleteAssignment.and.returnValue(throwError(() => new Error('boom')));
      component.selectedAssignment = mockAssignment;

      component.deleteAssignment();

      expect(console.error).toHaveBeenCalled();
    });

    it('should only close the context menu when not confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      component.selectedAssignment = mockAssignment;
      component.contextMenuVisible = true;

      component.deleteAssignment();

      expect(assignmentServiceMock.deleteAssignment).not.toHaveBeenCalled();
      expect(component.contextMenuVisible).toBeFalse();
    });
  });
});
