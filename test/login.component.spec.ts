import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavbarComponent } from '../src/app/components/navbar/navbar.component';
import { AuthService } from '../src/app/services/auth.service';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

// Tests generales del componente que no pertenecen a ninguna de las 5
// funcionalidades trackeadas en las tablas de caminos (Registro, Login,
// Logout, Perfil, Cambiar Contraseña). Esas viven en:
//   navbar-logout.component.spec.ts
//   navbar-perfil.component.spec.ts
//   navbar-cambiar-password.component.spec.ts

describe('NavbarComponent (general)', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['logout', 'deleteAccount']);

    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('toggleDropdown', () => {
    it('should toggle dropDownOpened from false to true', () => {
      expect(component.dropDownOpened).toBeFalse();
      component.toggleDropdown();
      expect(component.dropDownOpened).toBeTrue();
    });

    it('should toggle dropDownOpened from true back to false', () => {
      component.dropDownOpened = true;
      component.toggleDropdown();
      expect(component.dropDownOpened).toBeFalse();
    });
  });

  describe('confirmDelete', () => {
    it('should call deleteAccount and then logout when user confirms', () => {
      const router = TestBed.inject(Router);
      const navigateSpy = spyOn(router, 'navigate');
      spyOn(window, 'confirm').and.returnValue(true);
      authServiceMock.deleteAccount.and.returnValue(
        of({ status: 204, message: 'Account deleted' })
      );

      component.confirmDelete();

      expect(authServiceMock.deleteAccount).toHaveBeenCalled();
      expect(authServiceMock.logout).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    });

    it('should NOT call deleteAccount when user cancels', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      component.confirmDelete();
      expect(authServiceMock.deleteAccount).not.toHaveBeenCalled();
    });
  });
});
