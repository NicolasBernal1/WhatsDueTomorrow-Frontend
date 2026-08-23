import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
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
    expect(component).toBeTruthy();
  });

  it('should initialize with an invalid form', () => {
    expect(component.registerForm.valid).toBeFalse();
  });

  it('should be invalid if email format is wrong', () => {
    component.registerForm.patchValue({ name: 'Test', email: 'bad-email', password: '123456' });
    expect(component.registerForm.valid).toBeFalse();
  });

  it('should be valid when all required fields are correctly filled', () => {
    component.registerForm.patchValue({ name: 'Test User', email: 'test@example.com', password: '123456' });
    expect(component.registerForm.valid).toBeTrue();
  });

  it('should NOT call authService.register if form is invalid', () => {
    component.onSubmit();
    expect(authServiceMock.register).not.toHaveBeenCalled();
  });

  it('should register, then login, then navigate to /schedule on success', () => {
    const navigateSpy = spyOn(router, 'navigate');
    authServiceMock.register.and.returnValue(
      of({ status: 201, message: 'User created', data: { id: 1, name: 'Test', email: 'test@example.com' } })
    );
    authServiceMock.login.and.returnValue(
      of({ status: 200, message: 'Login successful', data: { token: 'jwt', user: { id: 1, name: 'Test', email: 'test@example.com' } } })
    );

    component.registerForm.patchValue({ name: 'Test User', email: 'test@example.com', password: '123456' });
    component.onSubmit();

    expect(authServiceMock.register).toHaveBeenCalled();
    expect(authServiceMock.login).toHaveBeenCalledWith({ email: 'test@example.com', password: '123456' });
    expect(navigateSpy).toHaveBeenCalledWith(['/schedule']);
  });

  it('should store the token in localStorage after successful register + login', () => {
    authServiceMock.register.and.returnValue(
      of({ status: 201, message: 'User created', data: { id: 1, name: 'Test', email: 'test@example.com' } })
    );
    authServiceMock.login.and.returnValue(
      of({ status: 200, message: 'Login successful', data: { token: 'jwt_tok', user: { id: 1, name: 'Test', email: 'test@example.com' } } })
    );

    component.registerForm.patchValue({ name: 'Test', email: 'test@example.com', password: '123456' });
    component.onSubmit();

    expect(localStorage.getItem('token')).toBe('jwt_tok');
    localStorage.clear();
  });

  it('should alert "already in use" on 409 error', () => {
    spyOn(window, 'alert');
    authServiceMock.register.and.returnValue(throwError(() => ({ status: 409 })));
    component.registerForm.patchValue({ name: 'Test', email: 'test@example.com', password: '123456' });
    component.onSubmit();
    expect(window.alert).toHaveBeenCalledWith('This email is already in use');
  });

  it('should alert "Invalid data" on 400 error', () => {
    spyOn(window, 'alert');
    authServiceMock.register.and.returnValue(throwError(() => ({ status: 400 })));
    component.registerForm.patchValue({ name: 'Test', email: 'test@example.com', password: '123456' });
    component.onSubmit();
    expect(window.alert).toHaveBeenCalledWith('Invalid data');
  });

  it('should alert "unknown error" on unexpected error', () => {
    spyOn(window, 'alert');
    authServiceMock.register.and.returnValue(throwError(() => ({ status: 500 })));
    component.registerForm.patchValue({ name: 'Test', email: 'test@example.com', password: '123456' });
    component.onSubmit();
    expect(window.alert).toHaveBeenCalledWith('An unknown error ocurred');
  });
});