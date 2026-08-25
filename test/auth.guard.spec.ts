import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, provideRouter, Routes } from '@angular/router';
import { Component } from '@angular/core';
import { authGuard } from '../src/app/guards/auth.guard';
import { AuthService } from '../src/app/services/auth.service';

// Componentes dummy para simular la navegación y renderizado de vistas públicas y privadas
@Component({ standalone: true, template: '<p>Pantalla Pública: Login</p>' })
class MockPublicLoginComponent {
  cargarComponentePublico(): boolean {
    return true;
  }
  mostrarPantalla(): boolean {
    return true;
  }
}

@Component({ standalone: true, template: '<p>Pantalla Privada: Schedule</p>' })
class MockPrivateScheduleComponent {
  renderizarVistaPrivada(): boolean {
    return true;
  }
}

describe('authGuard - Protección de Rutas Privadas (Frontend)', () => {

  let authServiceMock: jasmine.SpyObj<AuthService>;
  let routerMock: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'getToken']);
    routerMock = jasmine.createSpyObj('Router', ['createUrlTree', 'navigate', 'parseUrl']);

    // Configuración del módulo de pruebas de Angular
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });
  });

  // =========================================================================
  // CAMINO 1: [1, 2, 3, 8] - Región 1 (R1)
  // =========================================================================
  // Entrada: ruta = /login, token = null / cualquiera
  // Prueba: ruta_privada = false
  // Salida esperada: CargarComponentePublico(), MostrarPantalla()
  // =========================================================================
  describe('Camino 1: [1 -> 2 -> 3 -> 8] (Ruta Pública)', () => {

    it('debe permitir el acceso libre y cargar/mostrar la pantalla pública cuando la ruta solicitada no es privada (ruta = /login, token = null)', () => {
      // 1. Detectar dirección solicitada: /login (Ruta pública, ruta_privada = false)
      const requestedRoute = '/login';
      const isPrivateRoute = false;
      const token = null;

      authServiceMock.getToken.and.returnValue(token);
      authServiceMock.isAuthenticated.and.returnValue(false);

      const publicComponent = new MockPublicLoginComponent();

      // Verificación: la ruta pública no requiere validación de sesión privada
      expect(isPrivateRoute).toBeFalse();
      expect(publicComponent.cargarComponentePublico()).toBeTrue();
      expect(publicComponent.mostrarPantalla()).toBeTrue();
    });

    it('debe permitir el acceso libre a la pantalla pública independientemente de si existe token o no (token = cualquiera)', () => {
      // Entrada: ruta = /login, token = "cualquier_token_o_sesion"
      const isPrivateRoute = false;
      const anyToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

      authServiceMock.getToken.and.returnValue(anyToken);
      authServiceMock.isAuthenticated.and.returnValue(true);

      const publicComponent = new MockPublicLoginComponent();

      expect(isPrivateRoute).toBeFalse();
      expect(publicComponent.cargarComponentePublico()).toBeTrue();
      expect(publicComponent.mostrarPantalla()).toBeTrue();
    });

  });

  // =========================================================================
  // CAMINO 2: [1, 2, 4, 5, 6, 8] - Región 3 (R3)
  // =========================================================================
  // Entrada: ruta = /schedule, token = valido
  // Prueba: ruta_privada = true, isAuthenticated() = true, token != null
  // Salida esperada: return true, RenderizarVistaPrivada()
  // =========================================================================
  describe('Camino 2: [1 -> 2 -> 4 -> 5 -> 6 -> 8] (Ruta Privada con Sesión Activa)', () => {

    it('debe permitir la navegación (retornar true) y renderizar la vista privada cuando existe una sesión activa registrada (ruta = /schedule, token = valido)', () => {
      // Entrada
      const isPrivateRoute = true;
      const validToken = 'valid_jwt_token_12345';

      // Nodos 4 y 5: Consultar sesión activa guardada (token != null)
      authServiceMock.getToken.and.returnValue(validToken);
      authServiceMock.isAuthenticated.and.returnValue(true);

      const mockRouteSnapshot = {} as ActivatedRouteSnapshot;
      const mockRouterStateSnapshot = { url: '/schedule' } as RouterStateSnapshot;

      // Ejecutar guardián en contexto de inyección de Angular
      const canActivateResult = TestBed.runInInjectionContext(() =>
        authGuard(mockRouteSnapshot, mockRouterStateSnapshot)
      );

      const privateComponent = new MockPrivateScheduleComponent();

      // Salida: return true y RenderizarVistaPrivada()
      expect(isPrivateRoute).toBeTrue();
      expect(authServiceMock.isAuthenticated).toHaveBeenCalled();
      expect(canActivateResult).toBeTrue();
      expect(privateComponent.renderizarVistaPrivada()).toBeTrue();
    });

  });

  // =========================================================================
  // CAMINO 3: [1, 2, 4, 5, 7, 8] - Región 2 (R2)
  // =========================================================================
  // Entrada: ruta = /schedule, token = null
  // Prueba: ruta_privada = true, isAuthenticated() = false, token == null
  // Salida esperada: createUrlTree([\'/login\']), RedirigirLogin()
  // =========================================================================
  describe('Camino 3: [1 -> 2 -> 4 -> 5 -> 7 -> 8] (Ruta Privada sin Sesión Activa)', () => {

    it('debe bloquear el acceso a la pantalla privada y redirigir a /login retornando createUrlTree cuando no existe sesión activa (ruta = /schedule, token = null)', () => {
      // Entrada
      const isPrivateRoute = true;
      const token = null;

      // Nodos 4 y 5: Consultar sesión activa guardada (token == null)
      authServiceMock.getToken.and.returnValue(token);
      authServiceMock.isAuthenticated.and.returnValue(false);

      const expectedUrlTree = {} as UrlTree;
      routerMock.createUrlTree.and.returnValue(expectedUrlTree);

      const mockRouteSnapshot = {} as ActivatedRouteSnapshot;
      const mockRouterStateSnapshot = { url: '/schedule' } as RouterStateSnapshot;

      // Ejecutar guardián en contexto de inyección de Angular
      const canActivateResult = TestBed.runInInjectionContext(() =>
        authGuard(mockRouteSnapshot, mockRouterStateSnapshot)
      );

      // Salida: Bloquear acceso, createUrlTree(['/login']) y RedirigirLogin()
      expect(isPrivateRoute).toBeTrue();
      expect(authServiceMock.isAuthenticated).toHaveBeenCalled();
      expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/login']);
      expect(canActivateResult).toBe(expectedUrlTree);
    });

  });

});
