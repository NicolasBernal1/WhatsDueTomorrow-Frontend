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
import { ClassResponseDto } from '../../models/class-response.dto';
import { SubjectService } from '../../services/subject.service';

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

  classes: ClassResponseDto[] = [];

  days = days;
  hours = hours;
  isStartGrater = false;
  hasConflict = false;

  constructor(private fb: FormBuilder, private classService: ClassService, private subjectService: SubjectService){
    this.addClassForm = this.fb.group({
      dayOfWeek: [this.days[0], [Validators.required]],
      startTime: [this.hours[0], [Validators.required]],
      endTime: [this.hours[2], [Validators.required]]
    })
  }

  ngOnInit(): void {
    this.subjectService.getClass().subscribe({
      next: (res) => {
        this.classes = res.data || [];
      },
      error: () => alert('Error getting classes')
    });
  }

  onSave(): void {
    if(this.addClassForm.invalid){
      this.addClassForm.markAllAsTouched();
      return;
    }

    if(this.addClassForm.value.endTime <= this.addClassForm.value.startTime){
      this.isStartGrater = true;
      return;
    }

    this.isStartGrater = false;

    const newStart = this.toMinutes(this.addClassForm.value.startTime);
    const newEnd = this.toMinutes(this.addClassForm.value.endTime);
    const newDay = this.addClassForm.value.dayOfWeek;

    this.hasConflict = this.classes.some(c => {
      if (c.dayOfWeek.toLowerCase() !== newDay.toLowerCase()) {
        return false;
      }

      const existingStart = this.toMinutes(c.startTime);
      const existingEnd = this.toMinutes(c.endTime);

      return newStart < existingEnd && newEnd > existingStart;
    });

    if (this.hasConflict) {
      return;
    }
    this.hasConflict = false;

    const dto: AddClassDto = {
      ...this.addClassForm.value,
      subjectId: this.subjectId
    };

    this.classService.addClass(dto).subscribe({
      next: () => {
        this.save.emit();
        this.close.emit();
      },
      error: (err) => console.error(err)
    });
  }

  onClose(): void {
    this.close.emit();
  }

  toMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}
