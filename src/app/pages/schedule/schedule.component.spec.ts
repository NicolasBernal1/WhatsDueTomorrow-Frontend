import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScheduleComponent } from './schedule.component';
import { SubjectService } from '../../services/subject.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { ClassResponseDto } from '../../models/class-response.dto';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';

const mockClasses: ClassResponseDto[] = [
  { id: 1, dayOfWeek: 'monday', startTime: '08:00', endTime: '10:00', color: '#ff0000' } as any,
  { id: 2, dayOfWeek: 'wednesday', startTime: '14:00', endTime: '16:00', color: '#0000ff' } as any,
];

describe('ScheduleComponent', () => {
  let component: ScheduleComponent;
  let fixture: ComponentFixture<ScheduleComponent>;
  let subjectServiceMock: jasmine.SpyObj<SubjectService>;
  let router!: Router;

  beforeEach(async () => {
    subjectServiceMock = jasmine.createSpyObj('SubjectService', ['getClass', 'deleteClass']);

    subjectServiceMock.getClass.and.returnValue(
      of({ status: 200, message: 'OK', data: mockClasses })
    );

    await TestBed.configureTestingModule({
      imports: [ScheduleComponent],
      providers: [
        provideRouter([]),
        { provide: SubjectService, useValue: subjectServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);

    spyOn(component, 'getClassesFor').and.returnValue(undefined);

    fixture.detectChanges();
  });

  it('should create and load classes on init', () => {
    expect(component).toBeTruthy();
    expect(component.classes.length).toBe(2);
  });

  describe('getClassesFor', () => {
    beforeEach(() => {
      (component.getClassesFor as jasmine.Spy).and.callThrough();
    });

    it('should return the class when day and hour match at the start of the range', () => {
      expect(component.getClassesFor('monday', '08:00')?.id).toBe(1);
    });

    it('should return the class when the hour is in the middle of the range', () => {
      expect(component.getClassesFor('monday', '09:00')?.id).toBe(1);
    });

    it('should NOT return a class at the exact endTime (exclusive upper bound)', () => {
      expect(component.getClassesFor('monday', '10:00')).toBeUndefined();
    });

    it('should return undefined when day does not match', () => {
      expect(component.getClassesFor('tuesday', '08:00')).toBeUndefined();
    });

    it('should return undefined when hour is outside all class ranges', () => {
      expect(component.getClassesFor('monday', '11:00')).toBeUndefined();
    });

    it('should match the Wednesday class at 15:00', () => {
      expect(component.getClassesFor('wednesday', '15:00')?.id).toBe(2);
    });
  });

  describe('onClickClass', () => {
    it('should navigate to /subjects/:id on click', () => {
      const navigateSpy = spyOn(router, 'navigate');
      component.onClickClass(5);
      expect(navigateSpy).toHaveBeenCalledWith(['/subjects/5']);
    });
  });

  describe('onRightClickClass', () => {
    it('should delete class and remove it from the list when user confirms', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      subjectServiceMock.deleteClass.and.returnValue(
        of({ status: 200, message: 'Class deleted' })
      );
      component.onRightClickClass(new MouseEvent('contextmenu'), mockClasses[0]);
      expect(subjectServiceMock.deleteClass).toHaveBeenCalledWith(1);
      expect(component.classes.find(c => c.id === 1)).toBeUndefined();
    });

    it('should NOT delete class when user cancels the confirm dialog', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      component.onRightClickClass(new MouseEvent('contextmenu'), mockClasses[0]);
      expect(subjectServiceMock.deleteClass).not.toHaveBeenCalled();
      expect(component.classes.length).toBe(2);
    });
  });
});