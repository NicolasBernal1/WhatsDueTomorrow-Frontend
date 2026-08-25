import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { guestGuard } from '../src/app/guards/guest.guard';
import { AuthService } from '../src/app/services/auth.service';

// ─── guestGuard ───────────────────────────────────────────────────────────────
// Pruebas basadas en el Grafo de Flujo de Control y Tabla de Caminos Básicos

describe('guestGuard - Protección de Formularios de Autenticación', () => {
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

  // Camino: 1, 2, 3, 4, 6
  // Entrada: ruta = /login, token = null
  // Prueba: isAuthenticated() = false, token == null
  // Salida: return true, MostrarFormulario()
  it('Camino 1, 2, 3, 4, 6: debe permitir el acceso a la pantalla pública (retornar true) y mostrar el formulario cuando el usuario NO tiene sesión activa', () => {
    authServiceMock.isAuthenticated.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      guestGuard({} as any, { url: '/login' } as any)
    );

    expect(authServiceMock.isAuthenticated).toHaveBeenCalled();
    expect(result).toBeTrue();
  });

  // Camino: 1, 2, 3, 5, 6
  // Entrada: ruta = /login, token = valido
  // Prueba: isAuthenticated() = true, token != null
  // Salida: createUrlTree(['/schedule']), RedirigirHorario()
  it('Camino 1, 2, 3, 5, 6: debe bloquear el formulario de autenticación y redirigir a /schedule vía createUrlTree cuando el usuario ya tiene sesión activa', () => {
    authServiceMock.isAuthenticated.and.returnValue(true);
    const urlTree = {} as any;
    routerMock.createUrlTree.and.returnValue(urlTree);

    const result = TestBed.runInInjectionContext(() =>
      guestGuard({} as any, { url: '/login' } as any)
    );

    expect(authServiceMock.isAuthenticated).toHaveBeenCalled();
    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/schedule']);
    expect(result).toBe(urlTree);
  });
});
