import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AssignmentService } from '../../services/assignment.service';
import { AddAssignmentDto } from '../../models/add-assignment.dto';

@Component({
  selector: 'app-add-assignment-modal',
  imports: [ReactiveFormsModule],
  standalone: true,
  templateUrl: './add-assignment-modal.component.html',
  styleUrl: './add-assignment-modal.component.scss'
})
export class AddAssignmentModalComponent {
  @Input() subjectId!: number;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();

  addAssignmentForm: FormGroup;

  constructor(private fb: FormBuilder, private assignmentService: AssignmentService){
    this.addAssignmentForm = this.fb.group({
      title: ["", [Validators.required]],
      description: [""],
      dueDate: ['', [Validators.required]]
    })
  }

  onSave(): void {
    if(this.addAssignmentForm.invalid){
      this.addAssignmentForm.markAllAsTouched();
      return;
    }

    const dto = this.addAssignmentForm.value as AddAssignmentDto


    this.assignmentService.addAssignment(dto, this.subjectId).subscribe({
      next: () => {
        this.save.emit();
        this.close.emit();
      },
      error: (err) => console.error(err)
    })
  }

  onclose(): void {
    this.close.emit();
  }
}
