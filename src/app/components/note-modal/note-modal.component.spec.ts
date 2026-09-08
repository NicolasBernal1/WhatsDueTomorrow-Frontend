import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoteModalComponent } from './note-modal.component';
import { NoteService } from '../../services/note.service';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Note } from '../../models/note.model';

describe('NoteModalComponent (F24 Bitácora de apuntes)', () => {
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
    subjectId: 10
  };

  beforeEach(async () => {
    noteServiceMock = jasmine.createSpyObj('NoteService', ['createNote', 'updateNote']);

    await TestBed.configureTestingModule({
      imports: [NoteModalComponent, ReactiveFormsModule],
      providers: [{ provide: NoteService, useValue: noteServiceMock }],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(NoteModalComponent);
    component = fixture.componentInstance;
    component.subjectId = 10;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe inicializarse con formulario inválido cuando está vacío', () => {
    expect(component.noteForm.valid).toBeFalse();
  });

  it('debe ser válido cuando título y contenido están completos sin enlace (enlace opcional)', () => {
    component.noteForm.patchValue({
      title: 'Resumen Unidad 1',
      content: 'Conceptos clave de matrices y determinantes'
    });
    expect(component.noteForm.valid).toBeTrue();
  });

  it('debe rechazar título o contenido que solo contenga espacios en blanco', () => {
    component.noteForm.patchValue({
      title: '   ',
      content: 'Contenido válido'
    });
    expect(component.noteForm.valid).toBeFalse();

    component.noteForm.patchValue({
      title: 'Título válido',
      content: '   '
    });
    expect(component.noteForm.valid).toBeFalse();
  });

  it('debe validar URLs correctamente rechazando URLs inválidas o sin protocolo (RNF08)', () => {
    component.noteForm.patchValue({
      title: 'Nota con link inválido',
      content: 'Ver enlace abajo',
      linkUrl: 'enlace-invalido'
    });
    expect(component.noteForm.get('linkUrl')?.hasError('invalidUrl')).toBeTrue();
    expect(component.noteForm.valid).toBeFalse();

    component.noteForm.patchValue({
      linkUrl: 'javascript:alert(1)'
    });
    expect(component.noteForm.get('linkUrl')?.hasError('invalidUrl')).toBeTrue();

    component.noteForm.patchValue({
      linkUrl: 'https://mi-recurso.edu/archivo.pdf'
    });
    expect(component.noteForm.get('linkUrl')?.errors).toBeNull();
    expect(component.noteForm.valid).toBeTrue();
  });

  it('debe precargar los datos de la nota en modo edición', () => {
    component.note = mockNote;
    component.ngOnInit();

    expect(component.noteForm.get('title')?.value).toBe('Apunte Existente');
    expect(component.noteForm.get('content')?.value).toBe('Fórmula de derivadas');
    expect(component.noteForm.get('linkUrl')?.value).toBe('https://calculo.edu/recurso');
  });

  it('NO debe llamar al servicio si el formulario es inválido al guardar', () => {
    component.onSave();
    expect(noteServiceMock.createNote).not.toHaveBeenCalled();
    expect(noteServiceMock.updateNote).not.toHaveBeenCalled();
  });

  it('debe llamar a createNote y emitir eventos save y close en modo creación', () => {
    noteServiceMock.createNote.and.returnValue(of({
      status: 201,
      message: 'Note created',
      data: mockNote
    }));
    spyOn(component.save, 'emit');
    spyOn(component.close, 'emit');

    component.noteForm.patchValue({
      title: 'Nueva Nota',
      content: 'Nuevo Contenido',
      linkUrl: 'https://sitio.com'
    });
    component.onSave();

    expect(noteServiceMock.createNote).toHaveBeenCalledWith(10, {
      title: 'Nueva Nota',
      content: 'Nuevo Contenido',
      linkUrl: 'https://sitio.com'
    });
    expect(component.save.emit).toHaveBeenCalled();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('debe llamar a updateNote y emitir eventos en modo edición', () => {
    component.note = mockNote;
    component.ngOnInit();

    noteServiceMock.updateNote.and.returnValue(of({
      status: 200,
      message: 'Note updated',
      data: mockNote
    }));
    spyOn(component.save, 'emit');
    spyOn(component.close, 'emit');

    component.noteForm.patchValue({
      title: 'Título Editado',
      content: 'Contenido Editado',
      linkUrl: ''
    });
    component.onSave();

    expect(noteServiceMock.updateNote).toHaveBeenCalledWith(10, 5, {
      title: 'Título Editado',
      content: 'Contenido Editado',
      linkUrl: null
    });
    expect(component.save.emit).toHaveBeenCalled();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('debe manejar errores del servicio al guardar', () => {
    noteServiceMock.createNote.and.returnValue(throwError(() => new Error('Error de red')));
    component.noteForm.patchValue({
      title: 'Nota con error',
      content: 'Contenido'
    });
    component.onSave();

    expect(component.isSubmitting).toBeFalse();
    expect(component.errorMessage).toBe('No fue posible guardar el apunte.');
  });

  it('debe emitir close cuando onClose es llamado', () => {
    spyOn(component.close, 'emit');
    component.onClose();
    expect(component.close.emit).toHaveBeenCalled();
  });
});
