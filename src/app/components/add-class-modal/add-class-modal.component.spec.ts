import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddClassModalComponent } from './add-class-modal.component';
import { ClassService } from '../../services/class.service';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('AddClassModalComponent', () => {
  let component: AddClassModalComponent;
  let fixture: ComponentFixture<AddClassModalComponent>;
  let classServiceMock: jasmine.SpyObj<ClassService>;

  beforeEach(async () => {
    classServiceMock = jasmine.createSpyObj('ClassService', ['addClass']);

    await TestBed.configureTestingModule({
      imports: [AddClassModalComponent, ReactiveFormsModule],
      providers: [{ provide: ClassService, useValue: classServiceMock }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AddClassModalComponent);
    component = fixture.componentInstance;
    component.subjectId = 10;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call classService.addClass with correct dto and emit save + close on success', () => {
    classServiceMock.addClass.and.returnValue(
      of({ status: 201, message: 'Class created' })
    );
    spyOn(component.save, 'emit');
    spyOn(component.close, 'emit');

    component.addClassForm.patchValue({ dayOfWeek: 'monday', startTime: '08:00', endTime: '10:00' });
    component.onSave();

    expect(classServiceMock.addClass).toHaveBeenCalledWith({
      dayOfWeek: 'monday',
      startTime: '08:00',
      endTime: '10:00',
      subjectId: 10,
    });
    expect(component.save.emit).toHaveBeenCalled();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should set isStartGrater = true and NOT call classService when endTime < startTime', () => {
    component.addClassForm.patchValue({ dayOfWeek: 'monday', startTime: '10:00', endTime: '08:00' });
    component.onSave();

    expect(component.isStartGrater).toBeTrue();
    expect(classServiceMock.addClass).not.toHaveBeenCalled();
  });

  it('should reset isStartGrater to false when endTime >= startTime', () => {
    component.isStartGrater = true;
    classServiceMock.addClass.and.returnValue(
      of({ status: 201, message: 'Class created' })
    );

    component.addClassForm.patchValue({ dayOfWeek: 'monday', startTime: '08:00', endTime: '10:00' });
    component.onSave();

    expect(component.isStartGrater).toBeFalse();
  });

  it('should NOT call classService.addClass and mark form as touched if form is invalid', () => {
    component.addClassForm.get('dayOfWeek')?.setValue('');
    component.addClassForm.get('startTime')?.setValue('');
    component.addClassForm.get('endTime')?.setValue('');
    spyOn(component.addClassForm, 'markAllAsTouched');

    component.onSave();

    expect(component.addClassForm.markAllAsTouched).toHaveBeenCalled();
    expect(classServiceMock.addClass).not.toHaveBeenCalled();
  });

  it('should emit close event when onClose is called', () => {
    spyOn(component.close, 'emit');
    component.onClose();
    expect(component.close.emit).toHaveBeenCalled();
  });
});