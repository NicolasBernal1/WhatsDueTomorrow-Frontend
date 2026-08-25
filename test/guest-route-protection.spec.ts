import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, provideRouter, Routes } from '@angular/router';
import { Component } from '@angular/core';
import { guestGuard } from '../src/app/guards/guest.guard';
import { AuthService } from '../src/app/services/auth.service';

// Componentes dummy para simular las pantallas de autenticación y la pantalla principal de horario
@Component({ standalone: true, template: '<p>Formulario de Autenticación: Login / Register</p>' })
class MockAuthFormComponent {
  mostrarFormulario(): boolean {
    return true;
  }
}

@Component({ standalone: true, template: '<p>Pantalla Principal: Horario (Schedule)</p>' })
class MockScheduleComponent {
  mostrarHorario(): boolean {
    return true;
  }
}

describe('guestGuard - Protección de Formularios de Autenticación (Frontend)', () => {

  let authServiceMock: jasmine.SpyObj<AuthService>;
  let routerMock: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'getToken']);
    routerMock = jasmine.createSpyObj('Router', ['createUrlTree', 'navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });
  });

  // =========================================================================
  // CAMINO 1: [1 -> 2 -> 3 -> 4 -> 6]
  // =========================================================================
  // Entrada: ruta = /login, token = null
  // Prueba: isAuthenticated() = false, token == null
  // Salida esperada: return true, MostrarFormulario()
  // =========================================================================
  describe('Camino 1: [1 -> 2 -> 3 -> 4 -> 6] (Usuario sin sesión activa)', () => {

    it('debe permitir el acceso a la pantalla pública (retornar true) y mostrar el formulario cuando no existe sesión activa (ruta = /login, token = null)', () => {
      // 1. Detectar dirección solicitada: /login
      // 2. Consultar si el usuario ya tiene sesión iniciada (token == null)
      const token = null;
      authServiceMock.getToken.and.returnValue(token);
      authServiceMock.isAuthenticated.and.returnValue(false);

      const mockRouteSnapshot = {} as ActivatedRouteSnapshot;
      const mockRouterStateSnapshot = { url: '/login' } as RouterStateSnapshot;

      // 3. ¿El usuario tiene sesión activa? -> NO (Nodo 4)
      const canActivateResult = TestBed.runInInjectionContext(() =>
        guestGuard(mockRouteSnapshot, mockRouterStateSnapshot)
      );

      const formComponent = new MockAuthFormComponent();

      // 4 & 6. Permitir acceso y mostrar formulario de login / registro
      expect(authServiceMock.isAuthenticated).toHaveBeenCalled();
      expect(canActivateResult).toBeTrue();
      expect(formComponent.mostrarFormulario()).toBeTrue();
    });

  });

  // =========================================================================
  // CAMINO 2: [1 -> 2 -> 3 -> 5 -> 6]
  // =========================================================================
  // Entrada: ruta = /login, token = valido
  // Prueba: isAuthenticated() = true, token != null
  // Salida esperada: createUrlTree([\'/schedule\']), RedirigirHorario()
  // =========================================================================
  describe('Camino 2: [1 -> 2 -> 3 -> 5 -> 6] (Usuario con sesión activa)', () => {

    it('debe bloquear el formulario de autenticación y redirigir automáticamente a /schedule cuando existe una sesión activa (ruta = /login, token = valido)', () => {
      // 1. Detectar dirección solicitada: /login
      // 2. Consultar si el usuario ya tiene sesión iniciada (token != null)
      const validToken = 'valid_jwt_token_abcdef123';
      authServiceMock.getToken.and.returnValue(validToken);
      authServiceMock.isAuthenticated.and.returnValue(true);

      const expectedUrlTree = {} as UrlTree;
      routerMock.createUrlTree.and.returnValue(expectedUrlTree);

      const mockRouteSnapshot = {} as ActivatedRouteSnapshot;
      const mockRouterStateSnapshot = { url: '/login' } as RouterStateSnapshot;

      // 3. ¿El usuario tiene sesión activa? -> SÍ (Nodo 5)
      const canActivateResult = TestBed.runInInjectionContext(() =>
        guestGuard(mockRouteSnapshot, mockRouterStateSnapshot)
      );

      // 5 & 6. Bloquear formulario y redirigir automáticamente a la pantalla principal del horario (/schedule)
      expect(authServiceMock.isAuthenticated).toHaveBeenCalled();
      expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/schedule']);
      expect(canActivateResult).toBe(expectedUrlTree);
    });

  });

});

// =============================================================================
// PRUEBAS DE INTEGRACIÓN DE ENRUTAMIENTO CON guestGuard
// =============================================================================
describe('Enrutamiento de Formularios de Invitados - Integración con Router de Angular', () => {

  const testRoutes: Routes = [
    { path: 'login', component: MockAuthFormComponent, canActivate: [guestGuard] },
    { path: 'register', component: MockAuthFormComponent, canActivate: [guestGuard] },
    { path: 'schedule', component: MockScheduleComponent },
  ];

  let router: Router;
  let authServiceMock: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'getToken']);

    TestBed.configureTestingModule({
      providers: [
        provideRouter(testRoutes),
        { provide: AuthService, useValue: authServiceMock }
      ]
    });

    router = TestBed.inject(Router);
  });

  // Camino 1: [1, 2, 3, 4, 6] - Usuario sin sesión intenta ir a /login
  it('Camino 1: debe permitir navegar a /login cuando el usuario no tiene sesión iniciada', async () => {
    authServiceMock.isAuthenticated.and.returnValue(false);

    const navigationResult = await router.navigate(['/login']);

    expect(navigationResult).toBeTrue();
    expect(router.url).toBe('/login');
  });

  // Camino 2: [1, 2, 3, 5, 6] - Usuario con sesión intenta ir a /login y es redirigido a /schedule
  it('Camino 2: debe bloquear navegación a /login y redirigir a /schedule cuando el usuario ya tiene sesión iniciada', async () => {
    authServiceMock.isAuthenticated.and.returnValue(true);

    await router.navigate(['/login']);

    expect(router.url).toBe('/schedule');
  });

});
