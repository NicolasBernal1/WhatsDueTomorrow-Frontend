import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AssignmentsComponent } from './assignments.component';
import { AssignmentService } from '../../services/assignment.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

describe('AssignmentsComponent', () => {
  let component: AssignmentsComponent;
  let fixture: ComponentFixture<AssignmentsComponent>;
  let assignmentServiceMock: jasmine.SpyObj<AssignmentService>;

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
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});