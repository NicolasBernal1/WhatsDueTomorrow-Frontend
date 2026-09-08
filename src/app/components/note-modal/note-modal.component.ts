import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CreateNoteDto, Note, UpdateNoteDto } from '../../models/note.model';
import { NoteService } from '../../services/note.service';

export function urlValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value || !control.value.trim()) {
    return null;
  }
  try {
    const url = new URL(control.value.trim());
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { invalidUrl: true };
    }
    return null;
  } catch {
    return { invalidUrl: true };
  }
}

export function nonWhitespaceValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value || !control.value.trim()) {
    return { required: true };
  }
  return null;
}

@Component({
  selector: 'app-note-modal',
  standalone: true,
  imports: [ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatButtonModule, MatInputModule],
  templateUrl: './note-modal.component.html',
  styleUrl: './note-modal.component.scss'
})
export class NoteModalComponent implements OnInit {
  @Input() subjectId!: number;
  @Input() note?: Note | null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();

  noteForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private noteService: NoteService
  ) {
    this.noteForm = this.fb.group({
      title: ['', [Validators.required, nonWhitespaceValidator]],
      content: ['', [Validators.required, nonWhitespaceValidator]],
      linkUrl: ['', [urlValidator]]
    });
  }

  ngOnInit(): void {
    if (this.note) {
      this.noteForm.patchValue({
        title: this.note.title,
        content: this.note.content,
        linkUrl: this.note.linkUrl ?? ''
      });
    }
  }

  onSave(): void {
    if (this.noteForm.invalid) {
      this.noteForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const formValues = this.noteForm.value;
    const title = formValues.title.trim();
    const content = formValues.content.trim();
    const linkUrl = formValues.linkUrl && formValues.linkUrl.trim() !== '' ? formValues.linkUrl.trim() : null;

    if (this.note) {
      const updateDto: UpdateNoteDto = { title, content, linkUrl };
      this.noteService.updateNote(this.subjectId, this.note.id, updateDto).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.save.emit();
          this.close.emit();
        },
        error: () => {
          this.isSubmitting = false;
          this.errorMessage = 'No fue posible actualizar el apunte.';
        }
      });
      return;
    }

    const createDto: CreateNoteDto = { title, content, linkUrl };
    this.noteService.createNote(this.subjectId, createDto).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.save.emit();
        this.close.emit();
      },
      error: () => {
        this.isSubmitting = false;
        this.errorMessage = 'No fue posible guardar el apunte.';
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }
}
