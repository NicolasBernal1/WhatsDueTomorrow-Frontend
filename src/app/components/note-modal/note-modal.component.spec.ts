import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoteModalComponent } from './note-modal.component';
import { NoteService } from '../../services/note.service';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Note } from '../../models/note.model';

describe('NoteModalComponent (F24 — Modal de Apuntes - Caminos Básicos Tabla 25)', () => {
  let component: NoteModalComponent;
  let fixture: ComponentFixture<NoteModalComponent>;
  let noteServiceMock: jasmine.SpyObj<NoteService>;

  const mockNote: Note = {
    id: 5,
    title: 'Apunte Existente',
    content: 'Fórmula de derivadas',
    linkUrl: 'https://calculo.edu/recurso',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
    subjectId: 10,
  };

  beforeEach(async () => {
    noteServiceMock = jasmine.createSpyObj('NoteService', ['createNote', 'updateNote']);

    await TestBed.configureTestingModule({
      imports: [NoteModalComponent, ReactiveFormsModule],
      providers: [{ provide: NoteService, useValue: noteServiceMock }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(NoteModalComponent);
    component = fixture.componentInstance;
    component.subjectId = 10;
    fixture.detectChanges();
  });

  it('debe crearse correctamente el componente NoteModalComponent', () => {
    expect(component).toBeTruthy();
  });

  // Camino P3: 1-2-3-5-6-7-8-13-14-15-13-21-6-7-22
  describe('Camino P3: Envío con título o contenido en blanco en creación', () => {
    it('debe marcar todos los campos como tocados y prevenir llamada a createNote si el formulario es inválido', () => {
      component.noteForm.patchValue({
        title: '   ',
        content: '   ',
      });

      component.onSave();

      expect(component.noteForm.valid).toBeFalse();
      expect(component.noteForm.get('title')?.touched).toBeTrue();
      expect(component.noteForm.get('content')?.touched).toBeTrue();
      expect(noteServiceMock.createNote).not.toHaveBeenCalled();
      expect(noteServiceMock.updateNote).not.toHaveBeenCalled();
    });
  });

  // Camino P4: 1-2-3-5-6-7-8-13-14-16-19-20-13-21-6-7-22
  describe('Camino P4: Creación de apunte con fallo HTTP en servidor (500)', () => {
    it('debe mostrar mensaje de error y mantener el modal abierto cuando createNote falla', () => {
      noteServiceMock.createNote.and.returnValue(
        throwError(() => new Error('Error interno del servidor')),
      );

      component.noteForm.patchValue({
        title: 'Resumen Parcial',
        content: 'Temas 1 al 4',
        linkUrl: 'https://docs.google.com/resumen',
      });

      component.onSave();

      expect(noteServiceMock.createNote).toHaveBeenCalledWith(10, {
        title: 'Resumen Parcial',
        content: 'Temas 1 al 4',
        linkUrl: 'https://docs.google.com/resumen',
      });
      expect(component.isSubmitting).toBeFalse();
      expect(component.errorMessage).toBe('No fue posible guardar el apunte.');
    });
  });

  // Camino P5: 1-2-3-5-6-7-8-13-14-16-19-20-2-3-5-6-7-22
  describe('Camino P5: Creación exitosa de apunte (201 Created)', () => {
    it('debe registrar el apunte, emitir eventos save y close tras respuesta exitosa', () => {
      noteServiceMock.createNote.and.returnValue(
        of({
          status: 201,
          message: 'Note created',
          data: mockNote,
        }),
      );
      spyOn(component.save, 'emit');
      spyOn(component.close, 'emit');

      component.noteForm.patchValue({
        title: 'Nueva Nota',
        content: 'Nuevo Contenido',
        linkUrl: 'https://sitio.com/recurso',
      });

      component.onSave();

      expect(noteServiceMock.createNote).toHaveBeenCalledWith(10, {
        title: 'Nueva Nota',
        content: 'Nuevo Contenido',
        linkUrl: 'https://sitio.com/recurso',
      });
      expect(component.save.emit).toHaveBeenCalled();
      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  // Camino P6: 1-2-3-5-6-7-9-13-14-16-17-18-13-21-6-7-22
  describe('Camino P6: Edición de apunte con fallo HTTP en servidor', () => {
    it('debe mostrar mensaje de error y no emitir eventos cuando updateNote falla', () => {
      component.note = mockNote;
      component.ngOnInit();

      noteServiceMock.updateNote.and.returnValue(
        throwError(() => new Error('Error al actualizar')),
      );
      spyOn(component.save, 'emit');
      spyOn(component.close, 'emit');

      component.noteForm.patchValue({
        title: 'Título con fallo',
        content: 'Contenido',
      });

      component.onSave();

      expect(noteServiceMock.updateNote).toHaveBeenCalled();
      expect(component.isSubmitting).toBeFalse();
      expect(component.errorMessage).toBe('No fue posible actualizar el apunte.');
      expect(component.save.emit).not.toHaveBeenCalled();
      expect(component.close.emit).not.toHaveBeenCalled();
    });
  });

  // Camino P7: 1-2-3-5-6-7-9-13-14-16-17-18-2-3-5-6-7-22
  describe('Camino P7: Edición exitosa de apunte (200 OK)', () => {
    it('debe actualizar el apunte, emitir save y close reflejando cambios', () => {
      component.note = mockNote;
      component.ngOnInit();

      noteServiceMock.updateNote.and.returnValue(
        of({
          status: 200,
          message: 'Note updated',
          data: mockNote,
        }),
      );
      spyOn(component.save, 'emit');
      spyOn(component.close, 'emit');

      component.noteForm.patchValue({
        title: 'Título Editado',
        content: 'Contenido Editado',
        linkUrl: '',
      });

      component.onSave();

      expect(noteServiceMock.updateNote).toHaveBeenCalledWith(10, 5, {
        title: 'Título Editado',
        content: 'Contenido Editado',
        linkUrl: null,
      });
      expect(component.save.emit).toHaveBeenCalled();
      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  // Camino P8: 1-2-3-5-6-7-9-13-21-6-7-22
  describe('Camino P8: Cancelación voluntaria del modal', () => {
    it('debe emitir close sin llamar a servicios al pulsar Cancelar (onClose)', () => {
      spyOn(component.close, 'emit');

      component.onClose();

      expect(component.close.emit).toHaveBeenCalled();
      expect(noteServiceMock.createNote).not.toHaveBeenCalled();
      expect(noteServiceMock.updateNote).not.toHaveBeenCalled();
    });
  });

  // Camino P12: 1-2-3-5-6-7-8-13-14-15-13-14-16-19-20-2-3-5-6-7-22
  describe('Camino P12: Validación personalizada de URL y posterior corrección', () => {
    it('debe invalidar linkUrl con esquema ftp o javascript y validar al corregir con https', () => {
      component.noteForm.patchValue({
        title: 'Apunte con recurso',
        content: 'Material complementario',
        linkUrl: 'ftp://servidor.edu/archivo',
      });

      expect(component.noteForm.get('linkUrl')?.hasError('invalidUrl')).toBeTrue();
      expect(component.noteForm.valid).toBeFalse();

      component.noteForm.patchValue({
        linkUrl: 'https://campus.edu/material.pdf',
      });

      expect(component.noteForm.get('linkUrl')?.errors).toBeNull();
      expect(component.noteForm.valid).toBeTrue();
    });
  });
});
