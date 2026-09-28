import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import {
  NoteModalComponent,
  urlValidator,
  nonWhitespaceValidator,
} from './note-modal.component';
import { NoteService } from '../../services/note.service';
import { Note } from '../../models/note.model';
import { Should } from '../../common/fluent-assertions';

/**
 * ============================================================================
 * SUITE DE PRUEBAS DE REGRESIÓN — F24: BITÁCORA DE APUNTES Y RECURSOS RÁPIDOS
 * ============================================================================
 * Objetivo de Regresión:
 * Garantizar que modificaciones futuras en validadores de formularios reactivos,
 * sanitización de enlaces externos (prevención de vectores javascript:),
 * manejo de estados asíncronos o emisión de eventos entre modal y vista padre
 * no degraden la experiencia ni introduzcan vulnerabilidades de inyección.
 */
describe('F24 Regression Suite: Bitácora de apuntes y recursos rápidos (Frontend - NoteModal)', () => {
  let component: NoteModalComponent;
  let fixture: ComponentFixture<NoteModalComponent>;
  let noteServiceMock: jasmine.SpyObj<NoteService>;

  const mockExistingNote: Note = {
    id: 15,
    title: 'Apunte sobre Patrones de Diseño',
    content: 'Factory Method, Singleton y Adapter',
    linkUrl: 'https://refactoring.guru/design-patterns',
    createdAt: '2026-04-10T12:00:00Z',
    updatedAt: '2026-04-10T12:00:00Z',
    subjectId: 3,
  };

  beforeEach(async () => {
    noteServiceMock = jasmine.createSpyObj('NoteService', [
      'createNote',
      'updateNote',
      'getNotesBySubject',
      'deleteNote',
    ]);

    await TestBed.configureTestingModule({
      imports: [NoteModalComponent, ReactiveFormsModule],
      providers: [{ provide: NoteService, useValue: noteServiceMock }],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(NoteModalComponent, '<div></div>')
      .compileComponents();

    fixture = TestBed.createComponent(NoteModalComponent);
    component = fixture.componentInstance;
    component.subjectId = 3;
  });

  // ──────────────────────────────────────────────────────────────────────────
  // INVARIANTE 1: Validación Reactiva de URLs y Prevención de Protocolos Inseguros
  // ──────────────────────────────────────────────────────────────────────────
  describe('Invariante de Regresión 1: Validador de URLs (urlValidator)', () => {
    it('debe permitir campo vacío o solo espacios al tratarse de un recurso opcional', () => {
      Should(urlValidator({ value: '' } as any)).BeNull();
      Should(urlValidator({ value: '    ' } as any)).BeNull();
      Should(urlValidator({ value: null } as any)).BeNull();
    });

    it('debe aceptar URLs válidas con protocolo http:// o https://', () => {
      Should(urlValidator({ value: 'https://angular.dev/overview' } as any)).BeNull();
      Should(urlValidator({ value: 'http://localhost:3000/api' } as any)).BeNull();
    });

    it('debe rechazar con { invalidUrl: true } protocolos no permitidos o peligrosos (javascript:, ftp:, file:)', () => {
      const xssRes = urlValidator({ value: 'javascript:alert(1)' } as any);
      Should(xssRes).NotBeNull();
      Should(xssRes?.['invalidUrl']).BeTrue();

      const ftpRes = urlValidator({ value: 'ftp://files.org/notes.pdf' } as any);
      Should(ftpRes).NotBeNull();
      Should(ftpRes?.['invalidUrl']).BeTrue();

      const fileRes = urlValidator({ value: 'file:///etc/passwd' } as any);
      Should(fileRes).NotBeNull();
      Should(fileRes?.['invalidUrl']).BeTrue();
    });

    it('debe rechazar con { invalidUrl: true } cadenas con formato inválido', () => {
      const invalidRes = urlValidator({ value: 'esto-no-es-una-url' } as any);
      Should(invalidRes).NotBeNull();
      Should(invalidRes?.['invalidUrl']).BeTrue();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // INVARIANTE 2: Obligatoriedad y Rechazo de Espacios en Blanco
  // ──────────────────────────────────────────────────────────────────────────
  describe('Invariante de Regresión 2: Validador de Espacios en Blanco (nonWhitespaceValidator)', () => {
    it('debe retornar { required: true } cuando el texto son puros espacios en blanco', () => {
      const res = nonWhitespaceValidator({ value: '      ' } as any);
      Should(res).NotBeNull();
      Should(res?.['required']).BeTrue();
    });

    it('no debe enviar la petición HTTP y marcar campos como tocados si el formulario es inválido', () => {
      fixture.detectChanges();
      component.noteForm.patchValue({
        title: '   ',
        content: '',
      });

      component.onSave();

      Should(noteServiceMock.createNote).NotHaveBeenCalled();
      Should(noteServiceMock.updateNote).NotHaveBeenCalled();
      component.noteForm.get('title')?.touched.Should().BeTrue();
      component.noteForm.get('content')?.touched.Should().BeTrue();
      component.isSubmitting.Should().BeFalse();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // INVARIANTE 3: Modos del Modal (Creación vs Edición) y Sanitización
  // ──────────────────────────────────────────────────────────────────────────
  describe('Invariante de Regresión 3: Flujos de Creación y Edición con Sanitización (trim)', () => {
    it('en modo creación: debe enviar CreateNoteDto con textos limpios y emitir save y close al completar', () => {
      fixture.detectChanges();
      const saveSpy = spyOn(component.save, 'emit');
      const closeSpy = spyOn(component.close, 'emit');

      noteServiceMock.createNote.and.returnValue(
        of({ status: 201, message: 'OK', data: mockExistingNote })
      );

      component.noteForm.patchValue({
        title: '   Apunte de Álgebra Lineal   ',
        content: '   Espacios vectoriales y transformaciones   ',
        linkUrl: '   https://ocw.mit.edu/courses/mathematics/   ',
      });

      component.onSave();

      Should(noteServiceMock.createNote).HaveBeenCalledWith(3, {
        title: 'Apunte de Álgebra Lineal',
        content: 'Espacios vectoriales y transformaciones',
        linkUrl: 'https://ocw.mit.edu/courses/mathematics/',
      });
      component.isSubmitting.Should().BeFalse();
      Should(saveSpy).HaveBeenCalled();
      Should(closeSpy).HaveBeenCalled();
    });

    it('en modo edición: debe precargar valores en ngOnInit y emitir UpdateNoteDto con id del apunte', () => {
      component.note = mockExistingNote;
      fixture.detectChanges();

      // Precarga en el formulario
      component.noteForm.value.title.Should().Be(mockExistingNote.title);
      component.noteForm.value.content.Should().Be(mockExistingNote.content);
      component.noteForm.value.linkUrl.Should().Be(mockExistingNote.linkUrl);

      const saveSpy = spyOn(component.save, 'emit');
      const closeSpy = spyOn(component.close, 'emit');

      noteServiceMock.updateNote.and.returnValue(
        of({ status: 200, message: 'OK', data: mockExistingNote })
      );

      component.noteForm.patchValue({
        title: 'Título Modificado',
      });

      component.onSave();

      Should(noteServiceMock.updateNote).HaveBeenCalledWith(3, 15, {
        title: 'Título Modificado',
        content: mockExistingNote.content,
        linkUrl: mockExistingNote.linkUrl,
      });
      component.isSubmitting.Should().BeFalse();
      Should(saveSpy).HaveBeenCalled();
      Should(closeSpy).HaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // INVARIANTE 4: Resiliencia ante Fallo HTTP del Servidor
  // ──────────────────────────────────────────────────────────────────────────
  describe('Invariante de Regresión 4: Resiliencia y Notificación de Error ante Fallo HTTP', () => {
    it('debe mostrar mensaje descriptivo y desactivar isSubmitting ante fallo en creación', () => {
      fixture.detectChanges();
      const saveSpy = spyOn(component.save, 'emit');
      const closeSpy = spyOn(component.close, 'emit');

      noteServiceMock.createNote.and.returnValue(
        throwError(() => new Error('Error 500'))
      );

      component.noteForm.patchValue({
        title: 'Apunte Fallido',
        content: 'Texto',
      });

      component.onSave();

      component.isSubmitting.Should().BeFalse();
      component.errorMessage.Should().Be('No fue posible guardar el apunte.');
      Should(saveSpy).NotHaveBeenCalled();
      Should(closeSpy).NotHaveBeenCalled();
    });

    it('debe mostrar mensaje descriptivo y desactivar isSubmitting ante fallo en edición', () => {
      component.note = mockExistingNote;
      fixture.detectChanges();

      noteServiceMock.updateNote.and.returnValue(
        throwError(() => new Error('Error 500'))
      );

      component.onSave();

      component.isSubmitting.Should().BeFalse();
      component.errorMessage.Should().Be('No fue posible actualizar el apunte.');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // INVARIANTE 5: Cancelación y Cierre Limpio (onClose)
  // ──────────────────────────────────────────────────────────────────────────
  describe('Invariante de Regresión 5: Cancelación y Cierre (onClose)', () => {
    it('debe emitir close al invocar onClose()', () => {
      const closeSpy = spyOn(component.close, 'emit');

      component.onClose();

      Should(closeSpy).HaveBeenCalled();
    });
  });
});
