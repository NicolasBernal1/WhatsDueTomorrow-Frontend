import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { of } from 'rxjs';
import { Router } from '@angular/router';

import { SubjectsComponent } from './subjects.component';
import { SubjectService } from '../../services/subject.service';
import { environment } from '../../../environments/environment';
import { Should } from '../../common/fluent-assertions';

const apiUrl = environment.apiUrl;

function buildSubject(overrides: any = {}) {
  return {
    id: overrides.id ?? 10,
    name: overrides.name ?? 'validacion',
    professor: overrides.professor ?? 'gabriel',
    color: '#0078d4',
    credits: 3,
  };
}

describe('pruebas de regresion: API, Seguridad y Performance de Asignaturas', () => {
  describe('SubjectService', () => {
    let service: SubjectService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [provideHttpClient(), provideHttpClientTesting()],
      });
      service = TestBed.inject(SubjectService);
      httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    describe('Listar asignaturas', () => {
      describe('API', () => {
        it('getSubjects debe hacer GET a /subjects', () => {
          service.getSubjects().subscribe();

          const req = httpMock.expectOne(`${apiUrl}/subjects`);
          req.flush({ status: 200, message: 'ok', data: [buildSubject()] });

          Should(req.request.method).Be('GET');
        });

        it('ante un error 500 del backend, debe propagar el error al suscriptor', () => {
          let status: number | undefined;

          service.getSubjects().subscribe({ error: (err) => (status = err.status) });
          httpMock
            .expectOne(`${apiUrl}/subjects`)
            .flush('error', { status: 500, statusText: 'Server Error' });

          Should(status).Be(500);
        });
      });

      describe('Performance', () => {
        it('debe resolver 100 consultas de listado en menos de 500ms en total', () => {
          let completadas = 0;

          const start = performance.now();
          for (let i = 0; i < 100; i++) {
            service.getSubjects().subscribe(() => completadas++);
            httpMock
              .expectOne(`${apiUrl}/subjects`)
              .flush({ status: 200, message: 'ok', data: [buildSubject()] });
          }
          const elapsedMs = performance.now() - start;

          Should(completadas).Be(100);
          Should(elapsedMs).BeLessThan(500);
        });
      });
    });

    describe('Acceder a detalles de asignatura', () => {
      describe('API', () => {
        it('getSubjectById debe hacer GET a /subjects/:id', () => {
          service.getSubjectById(10).subscribe();

          const req = httpMock.expectOne(`${apiUrl}/subjects/10`);
          req.flush({ status: 200, message: 'ok', data: buildSubject() });

          Should(req.request.method).Be('GET');
        });

        it('ante un 404 de asignatura inexistente, debe propagar el error', () => {
          let status: number | undefined;

          service.getSubjectById(99999).subscribe({ error: (err) => (status = err.status) });
          httpMock
            .expectOne(`${apiUrl}/subjects/99999`)
            .flush('not found', { status: 404, statusText: 'Not Found' });

          Should(status).Be(404);
        });
      });
    });

    describe('Registrar asignatura', () => {
      describe('API', () => {
        it('addSubject debe hacer POST a /subjects con el dto completo en el body', () => {
          const dto = { name: 'Algebra', professor: 'Luis Diaz', color: '#28a745', credits: 3 };

          service.addSubject(dto as any).subscribe();

          const req = httpMock.expectOne(`${apiUrl}/subjects`);
          req.flush({ status: 201, message: 'ok', data: null });

          Should(req.request.method).Be('POST');
          Should(req.request.body).BeEquivalentTo(dto);
        });
      });
    });

    describe('Editar asignatura', () => {
      describe('API', () => {
        it('editSubject debe hacer PATCH a /subjects/:id con los cambios en el body', () => {
          const cambios = { name: 'Calculo Integral', credits: 5 };

          service.editSubject(10, cambios as any).subscribe();

          const req = httpMock.expectOne(`${apiUrl}/subjects/10`);
          req.flush({ status: 200, message: 'ok', data: null });

          Should(req.request.method).Be('PATCH');
          Should(req.request.body).BeEquivalentTo(cambios);
        });
      });
    });

    describe('Eliminar asignatura', () => {
      describe('API', () => {
        it('deleteSubject debe hacer DELETE a /subjects/:id', () => {
          service.deleteSubject(10).subscribe();

          const req = httpMock.expectOne(`${apiUrl}/subjects/10`);
          req.flush({ status: 200, message: 'ok', data: null });

          Should(req.request.method).Be('DELETE');
        });
      });
    });

    describe('Buscar asignaturas', () => {
      describe('API', () => {
        it('searchSubjects debe hacer GET a /subjects/search?q=', () => {
          service.searchSubjects('validacion').subscribe();

          const req = httpMock.expectOne(`${apiUrl}/subjects/search?q=validacion`);
          req.flush({ status: 200, message: 'ok', data: [buildSubject()] });

          Should(req.request.method).Be('GET');
        });
      });

      describe('Seguridad', () => {
        it('debe codificar el termino para que no pueda alterar la URL (& = #)', () => {
          service.searchSubjects('a&b=c#d').subscribe();

          const req = httpMock.expectOne(`${apiUrl}/subjects/search?q=a%26b%3Dc%23d`);
          req.flush({ status: 200, message: 'ok', data: [] });

          Should(req.request.url).NotContain('&b=');
        });

        it('debe codificar un intento de inyeccion SQL en el termino', () => {
          const injection = "' OR 1=1 --";

          service.searchSubjects(injection).subscribe();

          const req = httpMock.expectOne(
            `${apiUrl}/subjects/search?q=${encodeURIComponent(injection)}`,
          );
          req.flush({ status: 200, message: 'ok', data: [] });

          Should(req.request.method).Be('GET');
        });

        it('debe codificar etiquetas HTML en el termino', () => {
          service.searchSubjects('<script>alert(1)</script>').subscribe();

          const req = httpMock.expectOne(
            `${apiUrl}/subjects/search?q=${encodeURIComponent('<script>alert(1)</script>')}`,
          );
          req.flush({ status: 200, message: 'ok', data: [] });

          Should(req.request.url).NotContain('<script>');
        });
      });
    });
  });

  describe('SubjectsComponent', () => {
    let component: SubjectsComponent;
    let fixture: ComponentFixture<SubjectsComponent>;
    let subjectServiceMock: jasmine.SpyObj<SubjectService>;
    let routerMock: jasmine.SpyObj<Router>;

    beforeEach(async () => {
      subjectServiceMock = jasmine.createSpyObj('SubjectService', [
        'getSubjects',
        'deleteSubject',
        'getAcademicLoadSummary',
        'searchSubjects',
      ]);
      routerMock = jasmine.createSpyObj('Router', ['navigate']);

      subjectServiceMock.getSubjects.and.returnValue(
        of({ status: 200, message: 'ok', data: [buildSubject()] }),
      );
      subjectServiceMock.searchSubjects.and.returnValue(
        of({ status: 200, message: 'ok', data: [buildSubject()] }),
      );
      subjectServiceMock.getAcademicLoadSummary.and.returnValue(
        of({
          status: 200,
          message: 'ok',
          data: {
            totalCredits: 15,
            status: 'balanceada' as const,
            statusLabel: 'Carga balanceada',
            weeklyPresentialHours: 8,
            weeklyAutonomousHours: 16,
            subjectsCount: 5,
            classesCount: 4,
          },
        }),
      );

      await TestBed.configureTestingModule({
        imports: [SubjectsComponent],
        providers: [
          { provide: SubjectService, useValue: subjectServiceMock },
          { provide: Router, useValue: routerMock },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(SubjectsComponent);
      component = fixture.componentInstance;
    });

    describe('Listar asignaturas', () => {
      describe('Contrato con el servicio', () => {
        it('ngOnInit debe llamar a subjectService.getSubjects() exactamente una vez', () => {
          component.ngOnInit();

          Should(subjectServiceMock.getSubjects).HaveBeenCalledTimes(1);
        });
      });

      describe('Seguridad', () => {
        it('un nombre con HTML debe mostrarse como texto y no interpretarse (XSS)', () => {
          const xss = '<img src=x onerror=alert(1)>';
          subjectServiceMock.getSubjects.and.returnValue(
            of({ status: 200, message: 'ok', data: [buildSubject({ name: xss })] }),
          );

          fixture.detectChanges();
          const titulo = fixture.nativeElement.querySelector('.subject-card h3');

          Should(titulo.textContent.trim()).Be(xss);
          Should(fixture.nativeElement.querySelector('.subject-card img')).BeNull();
        });

        it('un profesor con HTML debe mostrarse como texto y no interpretarse (XSS)', () => {
          const xss = '<script>alert(1)</script>';
          subjectServiceMock.getSubjects.and.returnValue(
            of({ status: 200, message: 'ok', data: [buildSubject({ professor: xss })] }),
          );

          fixture.detectChanges();
          const profesor = fixture.nativeElement.querySelector('.subject-card .subject-info > p');

          Should(profesor.textContent.trim()).Be(xss);
          Should(fixture.nativeElement.querySelector('.subject-card script')).BeNull();
        });
      });

      describe('Performance', () => {
        it('debe renderizar 1000 asignaturas en menos de 2000ms', () => {
          subjectServiceMock.getSubjects.and.returnValue(
            of({
              status: 200,
              message: 'ok',
              data: Array.from({ length: 1000 }, (_, i) =>
                buildSubject({ id: i + 1, name: `Materia ${i + 1}` }),
              ),
            }),
          );

          const start = performance.now();
          fixture.detectChanges();
          const elapsedMs = performance.now() - start;

          Should(fixture.nativeElement.querySelectorAll('.subject-card').length).Be(1000);
          Should(elapsedMs).BeLessThan(2000);
        });
      });
    });

    describe('Acceder a detalles de asignatura', () => {
      describe('Contrato con el router', () => {
        it('debe navegar a /subjects/:id usando el id de la asignatura clickeada', () => {
          component.goToSubjectDetais(42);

          Should(routerMock.navigate).HaveBeenCalledWith(['/subjects', 42]);
        });
      });

      describe('Seguridad', () => {
        it('asignaturas distintas deben navegar cada una a su propio id, sin mezclarse', () => {
          component.goToSubjectDetais(1);
          component.goToSubjectDetais(2);

          Should(routerMock.navigate).HaveBeenCalledWith(['/subjects', 1]);
          Should(routerMock.navigate).HaveBeenCalledWith(['/subjects', 2]);
        });
      });

      describe('Performance', () => {
        it('debe resolver 500 navegaciones secuenciales en menos de 50ms en total', () => {
          const start = performance.now();
          for (let i = 0; i < 500; i++) {
            component.goToSubjectDetais(i);
          }
          const elapsedMs = performance.now() - start;

          Should(routerMock.navigate).HaveBeenCalledTimes(500);
          Should(elapsedMs).BeLessThan(50);
        });
      });
    });

    describe('Editar asignatura', () => {
      describe('Seguridad', () => {
        it('sin una asignatura seleccionada, no debe abrir el modal de edicion', () => {
          component.selectedSubject = null;

          component.editSubject();

          Should(component.showEditModal).BeFalse();
        });
      });
    });

    describe('Eliminar asignatura', () => {
      beforeEach(() => {
        component.selectedSubject = buildSubject() as any;
      });

      describe('Contrato con el servicio', () => {
        it('al confirmar, debe llamar a subjectService.deleteSubject con el id exacto de la asignatura seleccionada', () => {
          spyOn(window, 'confirm').and.returnValue(true);
          subjectServiceMock.deleteSubject.and.returnValue(
            of({ status: 200, message: 'ok', data: null }),
          );

          component.deleteSubject();

          Should(subjectServiceMock.deleteSubject).HaveBeenCalledWith(10);
        });
      });

      describe('Seguridad', () => {
        it('sin confirmacion del usuario, no debe llamar al servicio de borrado', () => {
          spyOn(window, 'confirm').and.returnValue(false);

          component.deleteSubject();

          Should(subjectServiceMock.deleteSubject).NotHaveBeenCalled();
        });

        it('sin una asignatura seleccionada, no debe pedir confirmacion ni llamar al servicio', () => {
          const confirmSpy = spyOn(window, 'confirm');
          component.selectedSubject = null;

          component.deleteSubject();

          Should(confirmSpy).NotHaveBeenCalled();
          Should(subjectServiceMock.deleteSubject).NotHaveBeenCalled();
        });
      });
    });

    describe('Buscar asignaturas', () => {
      describe('Contrato con el servicio', () => {
        it('debe llamar a subjectService.searchSubjects con el termino sin espacios sobrantes', () => {
          component.searchQuery = '  validacion  ';

          component.onSearch();

          Should(subjectServiceMock.searchSubjects).HaveBeenCalledWith('validacion');
        });
      });

      describe('Seguridad', () => {
        it('con un termino en blanco, no debe llamar a searchSubjects y debe recargar el listado', () => {
          component.searchQuery = '   ';

          component.onSearch();

          Should(subjectServiceMock.searchSubjects).NotHaveBeenCalled();
          Should(subjectServiceMock.getSubjects).HaveBeenCalledTimes(1);
        });
      });

      describe('Performance', () => {
        it('debe procesar 1000 resultados de busqueda en menos de 50ms', () => {
          subjectServiceMock.searchSubjects.and.returnValue(
            of({
              status: 200,
              message: 'ok',
              data: Array.from({ length: 1000 }, (_, i) => buildSubject({ id: i + 1 })),
            }),
          );
          component.searchQuery = 'validacion';

          const start = performance.now();
          component.onSearch();
          const elapsedMs = performance.now() - start;

          Should(component.subjects.length).Be(1000);
          Should(elapsedMs).BeLessThan(50);
        });

        it('debe resolver 50 busquedas seguidas en menos de 50ms en total', () => {
          component.searchQuery = 'validacion';

          const start = performance.now();
          for (let i = 0; i < 50; i++) {
            component.onSearch();
          }
          const elapsedMs = performance.now() - start;

          Should(subjectServiceMock.searchSubjects).HaveBeenCalledTimes(50);
          Should(elapsedMs).BeLessThan(50);
        });
      });
    });
  });
});
