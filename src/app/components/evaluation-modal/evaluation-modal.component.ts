import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  CreateEvaluationDto,
  Evaluation,
  UpdateEvaluationDto,
} from '../../models/evaluation.model';
import { EvaluationService, round2 } from '../../services/evaluation.service';

export function nonWhitespaceValidator(
  control: AbstractControl,
): ValidationErrors | null {
  if (!control.value || !control.value.toString().trim()) {
    return { required: true };
  }
  return null;
}

@Component({
  selector: 'app-evaluation-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
  ],
  templateUrl: './evaluation-modal.component.html',
  styleUrl: './evaluation-modal.component.scss',
})
export class EvaluationModalComponent implements OnInit {
  @Input() subjectId!: number;
  @Input() evaluation?: Evaluation | null;
  @Input() currentTotalWeight = 0;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();

  evaluationForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private evaluationService: EvaluationService,
  ) {
    this.evaluationForm = this.fb.group({
      name: ['', [Validators.required, nonWhitespaceValidator]],
      weight: [
        '',
        [
          Validators.required,
          Validators.min(1),
          Validators.max(100),
        ],
      ],
      score: [
        '',
        [
          Validators.required,
          Validators.min(0),
          Validators.max(5),
        ],
      ],
    });
  }

  ngOnInit(): void {
    if (this.evaluation) {
      this.evaluationForm.patchValue({
        name: this.evaluation.name,
        weight: this.evaluation.weight,
        score: this.evaluation.score,
      });
    }
  }

  get calculatedContribution(): number {
    const weight = Number(this.evaluationForm.get('weight')?.value);
    const score = Number(this.evaluationForm.get('score')?.value);
    if (!isNaN(weight) && !isNaN(score) && weight > 0 && score >= 0) {
      return round2((score * weight) / 100);
    }
    return 0;
  }

  get projectedTotalWeight(): number {
    const newWeight = Number(this.evaluationForm.get('weight')?.value) || 0;
    const oldWeight = this.evaluation ? Number(this.evaluation.weight) : 0;
    return round2(this.currentTotalWeight - oldWeight + newWeight);
  }

  onSave(): void {
    if (this.evaluationForm.invalid) {
      this.evaluationForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const formValues = this.evaluationForm.value;
    const name = formValues.name.trim();
    const weight = round2(Number(formValues.weight));
    const score = round2(Number(formValues.score));

    if (this.evaluation) {
      const updateDto: UpdateEvaluationDto = { name, weight, score };
      this.evaluationService
        .updateEvaluation(this.subjectId, this.evaluation.id, updateDto)
        .subscribe({
          next: () => {
            this.isSubmitting = false;
            this.save.emit();
            this.close.emit();
          },
          error: () => {
            this.isSubmitting = false;
            this.errorMessage = 'No fue posible actualizar la evaluación.';
          },
        });
      return;
    }

    const createDto: CreateEvaluationDto = { name, weight, score };
    this.evaluationService
      .createEvaluation(this.subjectId, createDto)
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.save.emit();
          this.close.emit();
        },
        error: () => {
          this.isSubmitting = false;
          this.errorMessage = 'No fue posible registrar la evaluación.';
        },
      });
  }

  onClose(): void {
    this.close.emit();
  }
}
