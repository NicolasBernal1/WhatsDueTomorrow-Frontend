import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

// ─── authGuard ────────────────────────────────────────────────────────────────
// Pruebas basadas en el Grafo de Flujo de Control y Tabla de Caminos Básicos

describe('authGuard', () => {
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let routerMock: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'getToken']);
    routerMock = jasmine.createSpyObj('Router', ['createUrlTree']);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });
  });

  // Camino: 1, 2, 4, 5, 6, 8 (Región 3)
  // Entrada: ruta = /schedule, token = valido
  // Prueba: ruta_privada = true, isAuthenticated() = true, token != null
  // Salida: return true, RenderizarVistaPrivada()
  it('Camino 1, 2, 4, 5, 6, 8: should allow access (return true) when the user is authenticated with a valid token on a private route', () => {
    authServiceMock.isAuthenticated.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, { url: '/schedule' } as any)
    );

    expect(authServiceMock.isAuthenticated).toHaveBeenCalled();
    expect(result).toBeTrue();
  });

  // Camino: 1, 2, 4, 5, 7, 8 (Región 2)
  // Entrada: ruta = /schedule, token = null
  // Prueba: ruta_privada = true, isAuthenticated() = false, token == null
  // Salida: createUrlTree(['/login']), RedirigirLogin()
  it('Camino 1, 2, 4, 5, 7, 8: should block access and redirect to /login via createUrlTree when the user is not authenticated', () => {
    authServiceMock.isAuthenticated.and.returnValue(false);
    const urlTree = {} as any;
    routerMock.createUrlTree.and.returnValue(urlTree);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, { url: '/schedule' } as any)
    );

    expect(authServiceMock.isAuthenticated).toHaveBeenCalled();
    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(result).toBe(urlTree);
  });
});