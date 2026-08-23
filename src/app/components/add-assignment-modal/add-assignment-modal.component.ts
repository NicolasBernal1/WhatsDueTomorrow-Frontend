import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AssignmentService } from '../../services/assignment.service';
import { AddAssignmentDto } from '../../models/add-assignment.dto';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { AssignmentResponseDto } from '../../models/assignment-response.dto';
import { UpdateAssignmentDto } from '../../models/update-assignment.dto';

@Component({
  selector: 'app-add-assignment-modal',
  imports: [ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatButtonModule, MatInputModule, MatDatepickerModule, MatNativeDateModule],
  standalone: true,
  templateUrl: './add-assignment-modal.component.html',
  styleUrl: './add-assignment-modal.component.scss'
})
export class AddAssignmentModalComponent implements OnInit{
  @Input() subjectId!: number;
  @Input() assignment?: AssignmentResponseDto;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();

  minDate = new Date();

  addAssignmentForm: FormGroup;

  constructor(private fb: FormBuilder, private assignmentService: AssignmentService){
    this.addAssignmentForm = this.fb.group({
      title: ["", [Validators.required, Validators.pattern(/.*[a-zA-ZáéíóúÁÉÍÓÚñÑ].*/)]],
      description: [""],
      dueDate: ['', [Validators.required]]
    })
  }

  ngOnInit(): void {
    if(this.assignment) {
      this.addAssignmentForm.patchValue({
        title: this.assignment.title,
        description: this.assignment.description,
        dueDate: this.assignment.dueDate
      });
    }
  }

  onSave(): void {
    if (this.addAssignmentForm.invalid) {
      this.addAssignmentForm.markAllAsTouched();
      return;
    }

    const dto = this.addAssignmentForm.value as AddAssignmentDto;

    if (this.assignment) {
      const updateDto = this.addAssignmentForm.value as UpdateAssignmentDto;
      this.assignmentService.editAssignment(updateDto, this.assignment.id).subscribe({
        next: () => {
          this.save.emit();
          this.close.emit();
        },
        error: (err) => console.error(err)
      });

      return;
    }

    this.assignmentService.addAssignment(dto, this.subjectId).subscribe({
      next: () => {
        this.save.emit();
        this.close.emit();
      },
      error: (err) => console.error(err)
    });
  }

  onclose(): void {
    this.close.emit();
  }
}
