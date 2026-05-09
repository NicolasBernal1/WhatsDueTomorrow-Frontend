import { TestBed } from '@angular/core/testing';
import { jwtInterceptor } from './jwt.interceptor';
import { AuthService } from '../services/auth.service';
import { of } from 'rxjs';

describe('jwtInterceptor', () => {
  let authServiceMock: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['getToken']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
      ],
    });
  });

  it('should add Authorization header when token exists', () => {
    authServiceMock.getToken.and.returnValue('my_jwt_token');

    const clonedReq = { isFake: true } as any;
    const mockReq: any = {
      clone: jasmine.createSpy('clone').and.returnValue(clonedReq),
      headers: { set: jasmine.createSpy('set').and.returnValue({}) },
    };
    const handledResponse = of(null);
    const mockNext = jasmine.createSpy('next').and.returnValue(handledResponse);

    TestBed.runInInjectionContext(() => jwtInterceptor(mockReq, mockNext));

    // El request fue clonado con el header de Authorization
    expect(mockReq.clone).toHaveBeenCalled();
    const cloneArg = mockReq.clone.calls.mostRecent().args[0];
    expect(cloneArg.headers).toBeDefined();

    // next fue llamado con el request clonado, no el original
    expect(mockNext).toHaveBeenCalledWith(clonedReq);
  });

  it('should NOT clone the request when there is no token', () => {
    authServiceMock.getToken.and.returnValue(null);

    const mockReq: any = {
      clone: jasmine.createSpy('clone'),
      headers: {},
    };
    const handledResponse = of(null);
    const mockNext = jasmine.createSpy('next').and.returnValue(handledResponse);

    TestBed.runInInjectionContext(() => jwtInterceptor(mockReq, mockNext));

    // No se clona — el request original pasa sin modificar
    expect(mockReq.clone).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(mockReq);
  });
});