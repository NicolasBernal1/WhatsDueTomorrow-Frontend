import { TestBed } from '@angular/core/testing';
import * as chai from 'chai';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

const chaiExpect = chai.expect;

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    // Arrange
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
    // Assert
    chaiExpect(service).to.exist;
  });

  // ─── login (Iniciar Sesión) ────────────────────────────────────────────────

  describe('login', () => {
    it('should POST to /auth/login and store the token in localStorage', () => {
      // Arrange
      const credentials = { email: 'test@example.com', password: '123456' };
      const mockResponse = { status: 200, data: { token: 'jwt_token', user: { id: 1, name: 'Test', email: 'test@example.com' } } };

      // Act
      service.login(credentials).subscribe(res => {
        // Assert
        chaiExpect(res.data?.token).to.equal('jwt_token');
        chaiExpect(localStorage.getItem('token')).to.equal('jwt_token');
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/login`);
      chaiExpect(req.request.method).to.equal('POST');
      chaiExpect(req.request.body).to.deep.equal(credentials);
      req.flush(mockResponse);
    });

    it('should NOT store token in localStorage if response has no token', () => {
      // Arrange
      const credentials = { email: 'test@example.com', password: 'wrong' };
      const mockResponse = { status: 200, data: null };

      // Act
      service.login(credentials).subscribe();
      const req = httpMock.expectOne(`${apiUrl}/auth/login`);
      req.flush(mockResponse);

      // Assert
      chaiExpect(localStorage.getItem('token')).to.be.null;
    });
  });

  // ─── register (Registrar Estudiante) ───────────────────────────────────────

  describe('register', () => {
    it('should POST to /auth/register with the user data', () => {
      // Arrange
      const data = { name: 'New User', email: 'new@example.com', password: '123456' };
      const mockResponse = { status: 201, data: { id: 1, name: 'New User', email: 'new@example.com' } };

      // Act
      service.register(data).subscribe(res => {
        // Assert
        chaiExpect(res.status).to.equal(201);
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/register`);
      chaiExpect(req.request.method).to.equal('POST');
      chaiExpect(req.request.body).to.deep.equal(data);
      req.flush(mockResponse);
    });
  });

  // ─── logout (Cerrar Sesión) ─────────────────────────────────────────────────

  describe('logout', () => {
    it('should remove the token from localStorage', () => {
      // Arrange
      localStorage.setItem('token', 'some_token');

      // Act
      service.logout();

      // Assert
      chaiExpect(localStorage.getItem('token')).to.be.null;
    });
  });

  // ─── isAuthenticated ─────────────────────────────────────────────────────────

  describe('isAuthenticated', () => {
    it('should return true when token exists in localStorage', () => {
      // Arrange
      localStorage.setItem('token', 'some_token');

      // Act
      const result = service.isAuthenticated();

      // Assert
      chaiExpect(result).to.be.true;
    });

    it('should return false when no token in localStorage', () => {
      // Act
      const result = service.isAuthenticated();

      // Assert
      chaiExpect(result).to.be.false;
    });
  });

  // ─── getToken ────────────────────────────────────────────────────────────────

  describe('getToken', () => {
    it('should return the token from localStorage', () => {
      // Arrange
      localStorage.setItem('token', 'my_token');

      // Act
      const result = service.getToken();

      // Assert
      chaiExpect(result).to.equal('my_token');
    });

    it('should return null if no token is stored', () => {
      // Act
      const result = service.getToken();

      // Assert
      chaiExpect(result).to.be.null;
    });
  });

  // ─── deleteAccount ───────────────────────────────────────────────────────────

  describe('deleteAccount', () => {
    it('should send DELETE to /users/profile', () => {
      // Arrange
      const mockResponse = { status: 204 };

      // Act
      service.deleteAccount().subscribe(res => {
        // Assert
        chaiExpect(res.status).to.equal(204);
      });

      const req = httpMock.expectOne(`${apiUrl}/users/profile`);
      chaiExpect(req.request.method).to.equal('DELETE');
      req.flush(mockResponse);
    });
  });

  // ─── updateProfile (Gestionar Perfil) ──────────────────────────────────────

  describe('updateProfile', () => {
    it('should send PATCH to /users/profile with the updated fields', () => {
      // Arrange
      const mockResponse = { status: 200, data: { id: 1, name: 'Nuevo Nombre', email: 'a@b.com' } };

      // Act
      service.updateProfile({ name: 'Nuevo Nombre' }).subscribe(res => {
        // Assert
        chaiExpect(res.data?.name).to.equal('Nuevo Nombre');
      });

      const req = httpMock.expectOne(`${apiUrl}/users/profile`);
      chaiExpect(req.request.method).to.equal('PATCH');
      chaiExpect(req.request.body).to.deep.equal({ name: 'Nuevo Nombre' });
      req.flush(mockResponse);
    });
  });
});