import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { days, hours } from '../../common/data.common';
import { ClassService } from '../../services/class.service';
import { AddClassDto } from '../../models/add-class.dto';
import { TitleCasePipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-add-class-modal',
  imports: [ReactiveFormsModule, TitleCasePipe, MatFormFieldModule, MatSelectModule, MatOptionModule, MatCardModule, MatButtonModule],
  standalone: true,
  templateUrl: './add-class-modal.component.html',
  styleUrl: './add-class-modal.component.scss'
})
export class AddClassModalComponent {
  @Input() subjectId!: number;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();

  addClassForm: FormGroup;

  days = days;
  hours = hours;

  constructor(private fb: FormBuilder, private classService: ClassService){
    this.addClassForm = this.fb.group({
      dayOfWeek: [this.days[0], [Validators.required]],
      startTime: [this.hours[0], [Validators.required]],
      endTime: [this.hours[2], [Validators.required]]
    })
  }

  onSave(): void {
    if(this.addClassForm.invalid){
      this.addClassForm.markAllAsTouched();
      return;
    }

    const dto: AddClassDto = {
      ...this.addClassForm.value,
      subjectId: this.subjectId
    }

    this.classService.addClass(dto).subscribe({
      next: () => {
        this.save.emit();
        this.close.emit();
      },
      error: (err) => console.error(err)
    })
  }

  onClose(): void {
    this.close.emit();
  }
}
