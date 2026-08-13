import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AddSubjectDto } from '../../models/add-subject.dto';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SubjectService } from '../../services/subject.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { SubjectResponseDto } from '../../models/subject-response.dto';
import { updateSubjectDto } from '../../models/update-subject.dto';

@Component({
  selector: 'app-add-subject-modal',
  imports: [ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatButtonModule, MatInputModule],
  standalone: true,
  templateUrl: './add-subject-modal.component.html',
  styleUrl: './add-subject-modal.component.scss'
})
export class AddSubjectModalComponent implements OnInit{
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();
  @Input() subject?: SubjectResponseDto;
  addSubjectForm: FormGroup;

  colors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6f42c1'];

  constructor(private fb: FormBuilder, private subjectService: SubjectService){
    this.addSubjectForm = this.fb.group({
      name: ['', [Validators.required, Validators.pattern(/.*[a-zA-ZáéíóúÁÉÍÓÚñÑ].*/)]],
      professor: ['', [Validators.required, Validators.pattern(/.*[a-zA-ZáéíóúÁÉÍÓÚñÑ].*/)]],
      color: [this.colors[0]]
    })
  }

  ngOnInit(): void {
    if (this.subject) {
      this.addSubjectForm.patchValue({
        name: this.subject.name,
        professor: this.subject.professor,
        color: this.subject.color
      });
    }
  }

  onSave(): void {
    if(this.addSubjectForm.invalid){
      this.addSubjectForm.markAllAsTouched();
      return;
    }

    if (this.subject) {
      const updateDto = this.addSubjectForm.value as updateSubjectDto;

      this.subjectService.editSubject(this.subject.id, updateDto).subscribe({
        next: () => {
          this.save.emit();
          this.close.emit();
        },
        error: (err) => console.error(err)
      });

      return;
    }

    this.subjectService.addSubject(this.addSubjectForm.value as AddSubjectDto).subscribe({
      next: (res) => {
        this.save.emit();
        this.close.emit();
      },
      error: (err) => {
        console.error(err);
      }
    })
  }

  onClose(): void {
    this.close.emit();
  }

  selectColor(color: string): void {
    this.addSubjectForm.patchValue({ color });
  }

  get name(){
    return this.addSubjectForm.get('name');
  }

  get professor(){
    return this.addSubjectForm.get('professor');
  }
}
