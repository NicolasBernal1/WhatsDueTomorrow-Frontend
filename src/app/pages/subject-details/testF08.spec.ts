import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { convertToParamMap, ActivatedRoute } from '@angular/router';

import { SubjectDetailsComponent } from './subject-details.component';
import { SubjectService } from '../../services/subject.service';
import { AssignmentService } from '../../services/assignment.service';

describe('SubjectDetailsComponent', () => {

  let component: SubjectDetailsComponent;
  let fixture: ComponentFixture<SubjectDetailsComponent>;

  let subjectServiceMock: jasmine.SpyObj<SubjectService>;
  let assignmentServiceMock: jasmine.SpyObj<AssignmentService>;

  const subjectMock: any = {
    id: 10,
    name: 'validación',
    professor: 'Gabriel',
    color: '#0078d4',
  };

  function configureTestBed(routeId: string | null) {
    subjectServiceMock = jasmine.createSpyObj('SubjectService', ['getSubjectById']);
    assignmentServiceMock = jasmine.createSpyObj('AssignmentService', ['getAssignmentsBySubject']);
    assignmentServiceMock.getAssignmentsBySubject.and.returnValue(
      of({ status: 200, message: 'ok', data: [] }),
    );

    TestBed.configureTestingModule({
      imports: [SubjectDetailsComponent],
      providers: [
        { provide: SubjectService, useValue: subjectServiceMock },
        { provide: AssignmentService, useValue: assignmentServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap(routeId ? { id: routeId } : {}) },
          },
        },
      ],
    });

    fixture = TestBed.createComponent(SubjectDetailsComponent);
    component = fixture.componentInstance;
  }

  //Consultar detalle de asignatura (F08)

  // Camino:
  // 1,2,3,9
  it('1. no debe consultar nada cuando la ruta no trae id', () => {

    configureTestBed(null);

    component.ngOnInit();

    expect(subjectServiceMock.getSubjectById).not.toHaveBeenCalled();
    expect(component.subject).toBeUndefined();
  });

  // Camino:
  // 1,2,4,5,6,9
  it('2. debe mostrar alerta cuando la petición falla', () => {

    configureTestBed('999');
    subjectServiceMock.getSubjectById.and.returnValue(
      throwError(() => new Error('not found')),
    );
    spyOn(window, 'alert');

    component.ngOnInit();

    expect(subjectServiceMock.getSubjectById).toHaveBeenCalledWith(999);
    expect(window.alert).toHaveBeenCalledWith('Error fetching subject');
    expect(component.subject).toBeUndefined();
  });

  // Camino:
  // 1,2,4,5,7,8,9
  it('3. debe asignar la asignatura cuando la petición es exitosa', () => {

    configureTestBed('10');
    subjectServiceMock.getSubjectById.and.returnValue(
      of({ status: 200, message: 'ok', data: subjectMock }),
    );

    component.ngOnInit();

    expect(subjectServiceMock.getSubjectById).toHaveBeenCalledWith(10);
    expect(component.subject).toEqual(subjectMock);
  });

});