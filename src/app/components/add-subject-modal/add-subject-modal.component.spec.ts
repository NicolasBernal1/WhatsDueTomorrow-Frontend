import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddSubjectModalComponent } from './add-subject-modal.component';
import { SubjectService } from '../../services/subject.service';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('AddSubjectModalComponent', () => {
  let component: AddSubjectModalComponent;
  let fixture: ComponentFixture<AddSubjectModalComponent>;
  let subjectServiceMock: jasmine.SpyObj<SubjectService>;

  beforeEach(async () => {
    subjectServiceMock = jasmine.createSpyObj('SubjectService', ['addSubject']);

    await TestBed.configureTestingModule({
      imports: [AddSubjectModalComponent, ReactiveFormsModule],
      providers: [{ provide: SubjectService, useValue: subjectServiceMock }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AddSubjectModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with an invalid form (name and professor are required)', () => {
    expect(component.addSubjectForm.valid).toBeFalse();
  });

  it('should be valid when name and professor are filled', () => {
    component.addSubjectForm.patchValue({ name: 'Math', professor: 'Dr. Smith' });
    expect(component.addSubjectForm.valid).toBeTrue();
  });

  it('should update color in the form when selectColor is called', () => {
    component.selectColor('#28a745');
    expect(component.addSubjectForm.get('color')?.value).toBe('#28a745');
  });

  it('should NOT call subjectService.addSubject if form is invalid', () => {
    component.onSave();
    expect(subjectServiceMock.addSubject).not.toHaveBeenCalled();
  });

  it('should mark form as touched if invalid on save', () => {
    spyOn(component.addSubjectForm, 'markAllAsTouched');
    component.onSave();
    expect(component.addSubjectForm.markAllAsTouched).toHaveBeenCalled();
  });

  it('should emit save and close events on successful save', () => {
    subjectServiceMock.addSubject.and.returnValue(
      of({ status: 201, message: 'Subject created' })
    );
    spyOn(component.save, 'emit');
    spyOn(component.close, 'emit');

    component.addSubjectForm.patchValue({ name: 'Math', professor: 'Dr. Smith' });
    component.onSave();

    expect(component.save.emit).toHaveBeenCalled();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should emit close event when onClose is called', () => {
    spyOn(component.close, 'emit');
    component.onClose();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should expose the name control via getter', () => {
    expect(component.name).toBe(component.addSubjectForm.get('name'));
  });

  it('should expose the professor control via getter', () => {
    expect(component.professor).toBe(component.addSubjectForm.get('professor'));
  });
});