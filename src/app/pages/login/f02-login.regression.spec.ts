import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { Should } from '../../common/fluent-assertions';

describe('F02 Regression Suite: Iniciar Sesión (Frontend)', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
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

  describe('Invariante de Regresión 1: Guardia de formulario inválido', () => {
    it('no debe llamar a authService.login mientras el formulario esté incompleto o mal formado', () => {
      component.onSubmit();
      Should(authServiceMock.login).NotHaveBeenCalled();

      component.loginForm.patchValue({ email: 'no-es-un-correo', password: '123456' });
      component.onSubmit();
      Should(authServiceMock.login).NotHaveBeenCalled();
    });
  });


  describe('Invariante de Regresión 2: Contrato de navegación tras éxito', () => {
    it('debe navegar a /schedule enviando exactamente { email, password } del formulario', () => {
      authServiceMock.login.and.returnValue(
        of({ status: 200, message: 'Login successful', data: { token: 'tok', user: { id: 1, name: 'T', email: 'test@example.com' } } })
      );
      const navigateSpy = spyOn(router, 'navigate');
      component.loginForm.patchValue({ email: 'test@example.com', password: '123456' });

      component.onSubmit();

      Should(authServiceMock.login).HaveBeenCalledWith({ email: 'test@example.com', password: '123456' });
      Should(navigateSpy).HaveBeenCalledWith(['/schedule']);
    });
  });


  describe('Invariante de Regresión 3: Sin navegación ni reset ante credenciales inválidas', () => {
    it('debe permanecer en la página y notificar el error si el backend rechaza las credenciales', () => {
      spyOn(window, 'alert');
      const navigateSpy = spyOn(router, 'navigate');
      authServiceMock.login.and.returnValue(throwError(() => new Error('Unauthorized')));
      component.loginForm.patchValue({ email: 'test@example.com', password: 'wrong' });

      component.onSubmit();

      Should(window.alert).HaveBeenCalledWith('Invalid Credentials');
      Should(navigateSpy).NotHaveBeenCalled();
    });
  });
});