import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddAssignmentModalComponent } from './add-assignment-modal.component';
import { AssignmentService } from '../../services/assignment.service';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('AddAssignmentModalComponent', () => {
  let component: AddAssignmentModalComponent;
  let fixture: ComponentFixture<AddAssignmentModalComponent>;
  let assignmentServiceMock: jasmine.SpyObj<AssignmentService>;

  beforeEach(async () => {
    assignmentServiceMock = jasmine.createSpyObj('AssignmentService', ['addAssignment']);

    await TestBed.configureTestingModule({
      imports: [AddAssignmentModalComponent],
      providers: [{ provide: AssignmentService, useValue: assignmentServiceMock }],
      schemas: [NO_ERRORS_SCHEMA],
    })
    // Reemplazar el template con uno vacío para evitar que Material/animations falle
    .overrideTemplate(AddAssignmentModalComponent, '<div></div>')
    .compileComponents();

    fixture = TestBed.createComponent(AddAssignmentModalComponent);
    component = fixture.componentInstance;
    component.subjectId = 10;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ─── Form validation ─────────────────────────────────────────────────────────

  it('should initialize with an invalid form', () => {
    expect(component.addAssignmentForm.valid).toBeFalse();
  });

  it('should be invalid when only title is filled', () => {
    component.addAssignmentForm.patchValue({ title: 'Tarea 1', dueDate: '' });
    expect(component.addAssignmentForm.valid).toBeFalse();
  });

  it('should be invalid when only dueDate is filled', () => {
    component.addAssignmentForm.patchValue({ title: '', dueDate: new Date('2025-07-01') });
    expect(component.addAssignmentForm.valid).toBeFalse();
  });

  it('should be valid when title and dueDate are filled', () => {
    component.addAssignmentForm.patchValue({ title: 'Tarea 1', dueDate: new Date('2025-07-01') });
    expect(component.addAssignmentForm.valid).toBeTrue();
  });

  it('description should be optional', () => {
    component.addAssignmentForm.patchValue({ title: 'Tarea 1', description: '', dueDate: new Date('2025-07-01') });
    expect(component.addAssignmentForm.valid).toBeTrue();
  });

  // ─── onSave ──────────────────────────────────────────────────────────────────

  it('should NOT call assignmentService if form is invalid', () => {
    component.onSave();
    expect(assignmentServiceMock.addAssignment).not.toHaveBeenCalled();
  });

  it('should mark form as touched if invalid on save', () => {
    spyOn(component.addAssignmentForm, 'markAllAsTouched');
    component.onSave();
    expect(component.addAssignmentForm.markAllAsTouched).toHaveBeenCalled();
  });

  it('should call assignmentService.addAssignment with subjectId and emit events on success', () => {
    assignmentServiceMock.addAssignment.and.returnValue(
      of({ status: 201, message: 'Assignment created' })
    );
    spyOn(component.save, 'emit');
    spyOn(component.close, 'emit');

    component.addAssignmentForm.patchValue({
      title: 'Tarea 1',
      description: 'desc',
      dueDate: new Date('2025-07-01'),
    });
    component.onSave();

    expect(assignmentServiceMock.addAssignment).toHaveBeenCalledWith(
      component.addAssignmentForm.value,
      10
    );
    expect(component.save.emit).toHaveBeenCalled();
    expect(component.close.emit).toHaveBeenCalled();
  });

  // ─── onclose ─────────────────────────────────────────────────────────────────

  it('should emit close event when onclose is called', () => {
    spyOn(component.close, 'emit');
    component.onclose();
    expect(component.close.emit).toHaveBeenCalled();
  });
});