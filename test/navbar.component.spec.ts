import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavbarComponent } from '../src/app/components/navbar/navbar.component';
import { AuthService } from '../src/app/services/auth.service';
import { Router, provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';

// ════════════════════════════════════════════════════════════════════════════
// CERRAR SESIÓN — logout()
// Tabla de caminos FE-3 · nodos 1-6 · sin decisiones · V(G) = 1
// ════════════════════════════════════════════════════════════════════════════

describe('NavbarComponent · logout', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['logout']);

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
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('P1 (1-2-3-4-5-6, camino único): should call authService.logout and navigate to /login', () => {
    const navigateSpy = spyOn(router, 'navigate');

    component.logout();

    expect(authServiceMock.logout).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });
});
