import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AddSubjectModalComponent } from './add-subject-modal.component';
import { SubjectService } from '../../services/subject.service';

describe('AddSubjectModalComponent (F26 — Caminos Básicos Frontend Tabla 48)', () => {

  let component: AddSubjectModalComponent;
  let fixture: ComponentFixture<AddSubjectModalComponent>;
  let subjectServiceMock: jasmine.SpyObj<SubjectService>;

  beforeEach(async () => {
    subjectServiceMock = jasmine.createSpyObj('SubjectService', ['addSubject', 'editSubject']);

    await TestBed.configureTestingModule({
      imports: [AddSubjectModalComponent],
      providers: [
        { provide: SubjectService, useValue: subjectServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddSubjectModalComponent);
    component = fixture.componentInstance;
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  describe('Cierre del Modal (P5: 1 → 2 → 3 → 5 → 6 → 7 → 9 → 21 → 22)', () => {
    it('[P5] debe emitir el evento close al invocar onClose()', () => {
      spyOn(component.close, 'emit');
      component.onClose();
      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('Validación Reactiva de Asignatura y Créditos (P6: 12 → 13 → 22)', () => {
    it('[P6] debe marcar campos como touched y detener el envío si el formulario es inválido', () => {
      component.ngOnInit();
      component.addSubjectForm.patchValue({ name: '', professor: '' });
      spyOn(component.addSubjectForm, 'markAllAsTouched');

      component.onSave();

      expect(component.addSubjectForm.invalid).toBeTrue();
      expect(component.addSubjectForm.markAllAsTouched).toHaveBeenCalled();
      expect(subjectServiceMock.addSubject).not.toHaveBeenCalled();
      expect(subjectServiceMock.editSubject).not.toHaveBeenCalled();
    });

    it('[P6] debe asignar 3 créditos por defecto al inicializar', () => {
      component.ngOnInit();
      expect(component.addSubjectForm.get('credits')?.value).toBe(3);
      expect(component.addSubjectForm.get('credits')?.valid).toBeTrue();
    });

    it('[P6] debe rechazar créditos menores a 1 (ej: 0)', () => {
      component.ngOnInit();
      component.addSubjectForm.patchValue({ credits: 0 });
      expect(component.addSubjectForm.get('credits')?.invalid).toBeTrue();
      expect(component.addSubjectForm.get('credits')?.hasError('min')).toBeTrue();
    });

    it('[P6] debe rechazar créditos mayores a 12 (ej: 13)', () => {
      component.ngOnInit();
      component.addSubjectForm.patchValue({ credits: 13 });
      expect(component.addSubjectForm.get('credits')?.invalid).toBeTrue();
      expect(component.addSubjectForm.get('credits')?.hasError('max')).toBeTrue();
    });

    it('[P6] debe rechazar créditos decimales (ej: 3.5)', () => {
      component.ngOnInit();
      component.addSubjectForm.patchValue({ credits: '3.5' });
      expect(component.addSubjectForm.get('credits')?.invalid).toBeTrue();
      expect(component.addSubjectForm.get('credits')?.hasError('pattern')).toBeTrue();
    });

    it('[P6] debe aceptar los límites exactos de créditos (1 y 12)', () => {
      component.ngOnInit();
      component.addSubjectForm.patchValue({ credits: 1 });
      expect(component.addSubjectForm.get('credits')?.valid).toBeTrue();

      component.addSubjectForm.patchValue({ credits: 12 });
      expect(component.addSubjectForm.get('credits')?.valid).toBeTrue();
    });

    it('[P6] debe exponer getters para name, professor y credits', () => {
      component.ngOnInit();
      expect(component.name).toBeTruthy();
      expect(component.professor).toBeTruthy();
      expect(component.credits).toBeTruthy();
    });

    it('[P6] debe permitir seleccionar color con selectColor', () => {
      component.ngOnInit();
      component.selectColor('#ffc107');
      expect(component.addSubjectForm.get('color')?.value).toBe('#ffc107');
    });
  });

  describe('Modo Edición: Actualización de Asignatura (P7 y P8)', () => {
    const subjectMock: any = {
      id: 10,
      name: 'validación',
      professor: 'Gabriel',
      color: '#0078d4',
      credits: 4,
    };

    beforeEach(() => {
      component.subject = subjectMock;
    });

    it('[P7: 12 → 14 → 16 → 18 → 20 → 22] debe actualizar la asignatura y emitir save y close cuando la petición es exitosa', () => {
      component.ngOnInit();
      expect(component.addSubjectForm.get('credits')?.value).toBe(4);

      subjectServiceMock.editSubject.and.returnValue(
        of({ status: 200, message: 'Subject updated successfully', data: null }),
      );
      spyOn(component.save, 'emit');
      spyOn(component.close, 'emit');

      component.onSave();

      expect(subjectServiceMock.editSubject).toHaveBeenCalledWith(
        subjectMock.id,
        jasmine.objectContaining({
          name: 'validación',
          professor: 'Gabriel',
          color: '#0078d4',
          credits: 4,
        }),
      );
      expect(component.save.emit).toHaveBeenCalled();
      expect(component.close.emit).toHaveBeenCalled();
    });

    it('[P8: 12 → 14 → 16 → 18 → 19 → 22] debe manejar error HTTP en editSubject registrando en consola sin emitir eventos', () => {
      component.ngOnInit();
      subjectServiceMock.editSubject.and.returnValue(
        throwError(() => new Error('Error al actualizar')),
      );
      spyOn(console, 'error');
      spyOn(component.save, 'emit');
      spyOn(component.close, 'emit');

      component.onSave();

      expect(console.error).toHaveBeenCalled();
      expect(component.save.emit).not.toHaveBeenCalled();
      expect(component.close.emit).not.toHaveBeenCalled();
    });
  });

  describe('Modo Creación: Registro de Asignatura (P9: 12 → 14 → 17 → ... → 22)', () => {
    it('[P9: 12 → 14 → 17 → 18 → 20 → 22] debe crear la asignatura con créditos y emitir save y close al completar', () => {
      component.ngOnInit();
      component.addSubjectForm.setValue({
        name: 'validación',
        professor: 'Gabriel',
        color: '#0078d4',
        credits: 3,
      });
      subjectServiceMock.addSubject.and.returnValue(
        of({ status: 201, message: 'Subject created successfully', data: null }),
      );
      spyOn(component.save, 'emit');
      spyOn(component.close, 'emit');

      component.onSave();

      expect(subjectServiceMock.addSubject).toHaveBeenCalledWith(
        jasmine.objectContaining({
          name: 'validación',
          professor: 'Gabriel',
          color: '#0078d4',
          credits: 3,
        }),
      );
      expect(component.save.emit).toHaveBeenCalled();
      expect(component.close.emit).toHaveBeenCalled();
    });

    it('[P9] debe manejar error HTTP en addSubject registrando en consola', () => {
      component.ngOnInit();
      component.addSubjectForm.setValue({
        name: 'validación',
        professor: 'Gabriel',
        color: '#0078d4',
        credits: 3,
      });
      subjectServiceMock.addSubject.and.returnValue(
        throwError(() => new Error('Error en servidor')),
      );
      spyOn(console, 'error');

      component.onSave();

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Auditoría QA y Caracterización de Defectos (Metricas_Software_F21_F26.docx)', () => {
    it('[DEF-QA-F26-01] Comportamiento caracterizado: Validación regex acepta nombres arbitrarios o absurdos si contienen al menos una letra', () => {
      component.ngOnInit();
      // "12345a" y "???x!!!" contienen dígitos/símbolos pero tienen al menos una letra
      component.addSubjectForm.patchValue({
        name: '12345a',
        professor: '11111b',
        credits: 3,
      });

      // Verificación de defecto QA DEF-QA-F26-01:
      // Se documenta que el patrón /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/ no restringe longitud coherente ni caracteres extraños
      expect(component.addSubjectForm.get('name')?.valid).toBeTrue();
      expect(component.addSubjectForm.get('professor')?.valid).toBeTrue();
      expect(component.addSubjectForm.valid).toBeTrue();
    });
  });

});