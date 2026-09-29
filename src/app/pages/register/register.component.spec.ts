import { ComponentFixture, TestBed } from '@angular/core/testing';
import * as chai from 'chai';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';

const chaiExpect = chai.expect;

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    // Arrange
    authServiceMock = jasmine.createSpyObj('AuthService', ['register', 'login']);

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, ReactiveFormsModule],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
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
    chaiExpect(component.registerForm.valid).to.be.false;
  });

  it('should be invalid if email format is wrong', () => {
    // Act
    component.registerForm.patchValue({ name: 'Test', email: 'bad-email', password: '123456' });

    // Assert
    chaiExpect(component.registerForm.valid).to.be.false;
  });

  it('should be valid when all required fields are correctly filled', () => {
    // Act
    component.registerForm.patchValue({ name: 'Test User', email: 'test@example.com', password: '123456' });

    // Assert
    chaiExpect(component.registerForm.valid).to.be.true;
  });

  it('should NOT call authService.register if form is invalid', () => {
    // Act
    component.onSubmit();

    // Assert
    expect(authServiceMock.register).not.toHaveBeenCalled();
  });

  it('should register, then login, then navigate to /schedule on success', () => {
    // Arrange
    const navigateSpy = spyOn(router, 'navigate');
    authServiceMock.register.and.returnValue(
      of({ status: 201, message: 'User created', data: { id: 1, name: 'Test', email: 'test@example.com' } })
    );
    authServiceMock.login.and.returnValue(
      of({ status: 200, message: 'Login successful', data: { token: 'jwt', user: { id: 1, name: 'Test', email: 'test@example.com' } } })
    );
    component.registerForm.patchValue({ name: 'Test User', email: 'test@example.com', password: '123456' });

    // Act
    component.onSubmit();

    // Assert
    expect(authServiceMock.register).toHaveBeenCalled();
    expect(authServiceMock.login).toHaveBeenCalledWith({ email: 'test@example.com', password: '123456' });
    expect(navigateSpy).toHaveBeenCalledWith(['/schedule']);
  });

  it('should store the token in localStorage after successful register + login', () => {
    // Arrange
    authServiceMock.register.and.returnValue(
      of({ status: 201, message: 'User created', data: { id: 1, name: 'Test', email: 'test@example.com' } })
    );
    authServiceMock.login.and.returnValue(
      of({ status: 200, message: 'Login successful', data: { token: 'jwt_tok', user: { id: 1, name: 'Test', email: 'test@example.com' } } })
    );
    component.registerForm.patchValue({ name: 'Test', email: 'test@example.com', password: '123456' });

    // Act
    component.onSubmit();

    // Assert
    chaiExpect(localStorage.getItem('token')).to.equal('jwt_tok');
    localStorage.clear();
  });

  it('should alert "already in use" on 409 error', () => {
    // Arrange
    spyOn(window, 'alert');
    authServiceMock.register.and.returnValue(throwError(() => ({ status: 409 })));
    component.registerForm.patchValue({ name: 'Test', email: 'test@example.com', password: '123456' });

    // Act
    component.onSubmit();

    // Assert
    expect(window.alert).toHaveBeenCalledWith('This email is already in use');
  });

  it('should alert "Invalid data" on 400 error', () => {
    // Arrange
    spyOn(window, 'alert');
    authServiceMock.register.and.returnValue(throwError(() => ({ status: 400 })));
    component.registerForm.patchValue({ name: 'Test', email: 'test@example.com', password: '123456' });

    // Act
    component.onSubmit();

    // Assert
    expect(window.alert).toHaveBeenCalledWith('Invalid data');
  });

  it('should alert "unknown error" on unexpected error', () => {
    // Arrange
    spyOn(window, 'alert');
    authServiceMock.register.and.returnValue(throwError(() => ({ status: 500 })));
    component.registerForm.patchValue({ name: 'Test', email: 'test@example.com', password: '123456' });

    // Act
    component.onSubmit();

    // Assert
    expect(window.alert).toHaveBeenCalledWith('An unknown error ocurred');
  });
});