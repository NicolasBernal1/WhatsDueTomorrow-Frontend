import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { guestGuard } from './guest.guard';
import { AuthService } from '../services/auth.service';

// ─── guestGuard ───────────────────────────────────────────────────────────────

describe('guestGuard', () => {
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let routerMock: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
    routerMock = jasmine.createSpyObj('Router', ['createUrlTree']);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });
  });

  it('should allow access when the user is NOT authenticated (is a guest)', () => {
    authServiceMock.isAuthenticated.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      guestGuard({} as any, {} as any)
    );

    expect(result).toBeTrue();
  });

  it('should redirect to /schedule when the user is already authenticated', () => {
    authServiceMock.isAuthenticated.and.returnValue(true);
    const urlTree = {} as any;
    routerMock.createUrlTree.and.returnValue(urlTree);

    const result = TestBed.runInInjectionContext(() =>
      guestGuard({} as any, {} as any)
    );

    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/schedule']);
    expect(result).toBe(urlTree);
  });
});