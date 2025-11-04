import { Component, EventEmitter, Output } from '@angular/core';
import { AddSubjectDto } from '../../models/add-subject.dto';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SubjectService } from '../../services/subject.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-add-subject-modal',
  imports: [ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatButtonModule, MatInputModule],
  standalone: true,
  templateUrl: './add-subject-modal.component.html',
  styleUrl: './add-subject-modal.component.scss'
})
export class AddSubjectModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();
  addSubjectForm: FormGroup;

  colors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6f42c1'];

  constructor(private fb: FormBuilder, private subjectService: SubjectService){
    this.addSubjectForm = this.fb.group({
      name: ['', [Validators.required]],
      professor: ['', [Validators.required]],
      color: [this.colors[0]]
    })
  }

  onSave(): void {
    if(this.addSubjectForm.invalid){
      this.addSubjectForm.markAllAsTouched();
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
