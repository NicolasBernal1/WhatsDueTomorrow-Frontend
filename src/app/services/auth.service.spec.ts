import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── login ───────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('should POST to /auth/login and store the token in localStorage', () => {
      const credentials = { email: 'test@example.com', password: '123456' };
      const mockResponse = { status: 200, data: { token: 'jwt_token', user: { id: 1, name: 'Test', email: 'test@example.com' } } };

      service.login(credentials).subscribe(res => {
        expect(res.data?.token).toBe('jwt_token');
        expect(localStorage.getItem('token')).toBe('jwt_token');
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(credentials);
      req.flush(mockResponse);
    });

    it('should NOT store token in localStorage if response has no token', () => {
      const credentials = { email: 'test@example.com', password: 'wrong' };
      const mockResponse = { status: 200, data: null };

      service.login(credentials).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/auth/login`);
      req.flush(mockResponse);

      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  // ─── register ────────────────────────────────────────────────────────────────

  describe('register', () => {
    it('should POST to /auth/register with the user data', () => {
      const data = { name: 'New User', email: 'new@example.com', password: '123456' };
      const mockResponse = { status: 201, data: { id: 1, name: 'New User', email: 'new@example.com' } };

      service.register(data).subscribe(res => {
        expect(res.status).toBe(201);
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(data);
      req.flush(mockResponse);
    });
  });

  // ─── logout ──────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('should remove the token from localStorage', () => {
      localStorage.setItem('token', 'some_token');
      service.logout();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  // ─── isAuthenticated ─────────────────────────────────────────────────────────

  describe('isAuthenticated', () => {
    it('should return true when token exists in localStorage', () => {
      localStorage.setItem('token', 'some_token');
      expect(service.isAuthenticated()).toBeTrue();
    });

    it('should return false when no token in localStorage', () => {
      expect(service.isAuthenticated()).toBeFalse();
    });
  });

  // ─── getToken ────────────────────────────────────────────────────────────────

  describe('getToken', () => {
    it('should return the token from localStorage', () => {
      localStorage.setItem('token', 'my_token');
      expect(service.getToken()).toBe('my_token');
    });

    it('should return null if no token is stored', () => {
      expect(service.getToken()).toBeNull();
    });
  });

  // ─── deleteAccount ───────────────────────────────────────────────────────────

  describe('deleteAccount', () => {
    it('should send DELETE to /users/profile', () => {
      const mockResponse = { status: 204 };

      service.deleteAccount().subscribe(res => {
        expect(res.status).toBe(204);
      });

      const req = httpMock.expectOne(`${apiUrl}/users/profile`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });
});