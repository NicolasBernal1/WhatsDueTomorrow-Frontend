import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavbarComponent } from '../src/app/components/navbar/navbar.component';
import { AuthService } from '../src/app/services/auth.service';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

// ════════════════════════════════════════════════════════════════════════════
// CONSULTAR PERFIL — loadProfile()
// Tabla de caminos FE-4 · nodos 1-11 · decisiones en 5, 8
// El nodo 5 (¿hay token guardado?) se prueba en jwt.interceptor.spec.ts, ya
// que esa decisión vive en el interceptor, no en el componente. Aquí se cubre
// el nodo 8 (¿la respuesta del backend fue exitosa?).
// ════════════════════════════════════════════════════════════════════════════

describe('NavbarComponent · loadProfile', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['getProfile']);

    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('P2/P3 (1-2-3-4-5(Sí)-7-8(Sí)-10-11): should store the profile data on success', () => {
    const mockProfile = { id: 1, name: 'Test User', email: 'test@example.com' };
    authServiceMock.getProfile.and.returnValue(
      of({ status: 200, message: 'ok', data: mockProfile }),
    );

    component.loadProfile();

    expect(authServiceMock.getProfile).toHaveBeenCalled();
    expect(component.user).toEqual(mockProfile);
  });

  it('P1 (1-2-3-4-5(Sí)-7-8(No)-9-11): should log the error and leave user undefined when the backend rejects', () => {
    spyOn(console, 'error');
    authServiceMock.getProfile.and.returnValue(throwError(() => ({ status: 401 })));

    component.loadProfile();

    expect(console.error).toHaveBeenCalled();
    expect(component.user).toBeUndefined();
  });
});
