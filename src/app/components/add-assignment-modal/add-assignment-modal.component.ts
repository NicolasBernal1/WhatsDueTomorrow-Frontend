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
      dueDate: ['', [Validators.required]],
      dueTime: ['23:59', [Validators.required]],
      reminderMinutes: [null]
    })
  }

  ngOnInit(): void {
    if(this.assignment) {
      this.addAssignmentForm.patchValue({
        title: this.assignment.title,
        description: this.assignment.description,
        dueDate: new Date(this.assignment.dueDate),
        dueTime: this.formatTime(this.assignment.dueDate),
        reminderMinutes: this.assignment.reminderMinutes ?? null
      });
    }
  }

  onSave(): void {
    if (this.addAssignmentForm.invalid) {
      this.addAssignmentForm.markAllAsTouched();
      return;
    }

    const value = this.addAssignmentForm.value;
    const dueDate = new Date(value.dueDate);
    const [hours, minutes] = value.dueTime.split(':').map(Number);
    dueDate.setHours(hours, minutes, 0, 0);
    const dto: AddAssignmentDto = {
      title: value.title,
      description: value.description,
      dueDate: dueDate.toISOString(),
      reminderMinutes: value.reminderMinutes
    };

    if (this.assignment) {
      const updateDto = dto as UpdateAssignmentDto;
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

  private formatTime(date: string): string {
    const dueDate = new Date(date);
    return `${String(dueDate.getHours()).padStart(2, '0')}:${String(dueDate.getMinutes()).padStart(2, '0')}`;
  }
}
