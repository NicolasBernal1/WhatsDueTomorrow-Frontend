import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { Should } from '../../common/fluent-assertions';


describe('F01 Regression Suite: Registrar Estudiante (Frontend)', () => {
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

  
  describe('Invariante de Regresión 1: Ninguna llamada de red con formulario inválido', () => {
    it('no debe llamar a authService.register ni a login si el formulario es inválido', () => {
      component.onSubmit();

      Should(authServiceMock.register).NotHaveBeenCalled();
      Should(authServiceMock.login).NotHaveBeenCalled();
    });
  });

 
  describe('Invariante de Regresión 2: Orden estricto register → login → navigate', () => {
    it('debe llamar a login únicamente después de que register se resuelva con éxito', () => {
      const navigateSpy = spyOn(router, 'navigate');
      authServiceMock.register.and.returnValue(
        of({ status: 201, message: 'User created', data: { id: 1, name: 'Test', email: 'test@example.com' } })
      );
      authServiceMock.login.and.returnValue(
        of({ status: 200, message: 'Login successful', data: { token: 'jwt', user: { id: 1, name: 'Test', email: 'test@example.com' } } })
      );
      component.registerForm.patchValue({ name: 'Test User', email: 'test@example.com', password: '123456' });

      component.onSubmit();

      Should(authServiceMock.register).HaveBeenCalledTimes(1);
      Should(authServiceMock.login).HaveBeenCalledWith({ email: 'test@example.com', password: '123456' });
      Should(navigateSpy).HaveBeenCalledWith(['/schedule']);
    });

    it('NO debe llamar a login si register falla (409/400/500)', () => {
      spyOn(window, 'alert');
      authServiceMock.register.and.returnValue(throwError(() => ({ status: 409 })));
      component.registerForm.patchValue({ name: 'Test', email: 'test@example.com', password: '123456' });

      component.onSubmit();

      Should(authServiceMock.login).NotHaveBeenCalled();
    });
  });

 
  describe('Invariante de Regresión 3: Diferenciación de mensajes por código de error', () => {
    it('409 → "This email is already in use"', () => {
      spyOn(window, 'alert');
      authServiceMock.register.and.returnValue(throwError(() => ({ status: 409 })));
      component.registerForm.patchValue({ name: 'Test', email: 'test@example.com', password: '123456' });

      component.onSubmit();

      Should(window.alert).HaveBeenCalledWith('This email is already in use');
    });

    it('400 → "Invalid data"', () => {
      spyOn(window, 'alert');
      authServiceMock.register.and.returnValue(throwError(() => ({ status: 400 })));
      component.registerForm.patchValue({ name: 'Test', email: 'test@example.com', password: '123456' });

      component.onSubmit();

      Should(window.alert).HaveBeenCalledWith('Invalid data');
    });

    it('otro código (p. ej. 500) → "An unknown error ocurred"', () => {
      spyOn(window, 'alert');
      authServiceMock.register.and.returnValue(throwError(() => ({ status: 500 })));
      component.registerForm.patchValue({ name: 'Test', email: 'test@example.com', password: '123456' });

      component.onSubmit();

      Should(window.alert).HaveBeenCalledWith('An unknown error ocurred');
    });
  });
});