import { ComponentFixture, TestBed } from '@angular/core/testing';
import * as chai from 'chai';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';

// Fluent Assertions (chai) para los asserts de VALORES/ESTADO.
// Las verificaciones de spies (toHaveBeenCalledWith) se dejan con el
// `expect` nativo de Jasmine.
const chaiExpect = chai.expect;

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    // Arrange
    authServiceMock = jasmine.createSpyObj('AuthService', ['login']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    // Assert
    chaiExpect(component).to.exist;
  });

  it('should initialize with an invalid form', () => {
    // Assert
    chaiExpect(component.loginForm.valid).to.be.false;
  });

  it('should be invalid if email format is wrong', () => {
    // Act
    component.loginForm.patchValue({ email: 'not-an-email', password: '123456' });

    // Assert
    chaiExpect(component.loginForm.valid).to.be.false;
  });

  it('should be valid when email and password are provided correctly', () => {
    // Act
    component.loginForm.patchValue({ email: 'test@example.com', password: '123456' });

    // Assert
    chaiExpect(component.loginForm.valid).to.be.true;
  });

  it('should NOT call authService.login if form is invalid', () => {
    // Act
    component.onSubmit();

    // Assert
    expect(authServiceMock.login).not.toHaveBeenCalled();
  });

  it('should call authService.login and navigate to /schedule on success', () => {
    // Arrange
    authServiceMock.login.and.returnValue(
      of({ status: 200, message: 'Login successful', data: { token: 'tok', user: { id: 1, name: 'T', email: 'test@example.com' } } })
    );
    const navigateSpy = spyOn(router, 'navigate');
    component.loginForm.patchValue({ email: 'test@example.com', password: '123456' });

    // Act
    component.onSubmit();

    // Assert
    expect(authServiceMock.login).toHaveBeenCalledWith({ email: 'test@example.com', password: '123456' });
    expect(navigateSpy).toHaveBeenCalledWith(['/schedule']);
  });

  it('should alert on login error', () => {
    // Arrange
    spyOn(window, 'alert');
    authServiceMock.login.and.returnValue(throwError(() => new Error('Unauthorized')));
    component.loginForm.patchValue({ email: 'test@example.com', password: 'wrong' });

    // Act
    component.onSubmit();

    // Assert
    expect(window.alert).toHaveBeenCalledWith('Invalid Credentials');
  });
});