import { Component, OnInit } from '@angular/core';
import { SubjectService } from '../../services/subject.service';
import { ActivatedRoute } from '@angular/router';
import { SubjectResponseDto } from '../../models/subject-response.dto';
import { AssignmentResponseDto } from '../../models/assignment-response.dto';
import { AssignmentService } from '../../services/assignment.service';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AddAssignmentModalComponent } from '../../components/add-assignment-modal/add-assignment-modal.component';
import { AddClassModalComponent } from '../../components/add-class-modal/add-class-modal.component';
import { NoteModalComponent } from '../../components/note-modal/note-modal.component';
import { NoteService } from '../../services/note.service';
import { Note } from '../../models/note.model';
import { EvaluationModalComponent } from '../../components/evaluation-modal/evaluation-modal.component';
import { EvaluationService } from '../../services/evaluation.service';
import { ApprovalStatus, Evaluation, GradeSummary } from '../../models/evaluation.model';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-subject-details',
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule,
    AddAssignmentModalComponent,
    AddClassModalComponent,
    NoteModalComponent,
    EvaluationModalComponent,
    MatCardModule,
    MatButtonModule
  ],
  standalone: true,
  templateUrl: './subject-details.component.html',
  styleUrl: './subject-details.component.scss'
})
export class SubjectDetailsComponent implements OnInit {
  subject?: SubjectResponseDto;
  assignments: AssignmentResponseDto[] = [];
  notes: Note[] = [];
  loadingNotes = false;
  noteError = '';

  // F25: Calculadora y simulador de calificaciones
  evaluations: Evaluation[] = [];
  gradeSummary: GradeSummary | null = null;
  loadingEvaluations = false;
  evaluationError = '';
  showEvaluationModal = false;
  selectedEvaluation: Evaluation | null = null;
  hypotheticalScore: number | null = null;
  targetGoal = 3.0;
  simResult: {
    requiredForTarget: number | null;
    isTargetAttainable: boolean;
    hypotheticalFinalGrade: number | null;
    hypotheticalStatus: ApprovalStatus | null;
  } | null = null;

  showAssignmentModal = false;
  showClassModal = false;
  showNoteModal = false;

  showEditModal = false;
  selectedAssignment: AssignmentResponseDto | null = null;
  selectedNote: Note | null = null;

  contextMenuVisible = false;
  contextMenuX = 0;
  contextMenuY = 0;

  constructor(
    private route: ActivatedRoute,
    private subjectService: SubjectService,
    private assignmentService: AssignmentService,
    private noteService: NoteService,
    private evaluationService: EvaluationService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const subjectId = Number(id);
      this.loadSubject(subjectId);
      this.loadAssignments(subjectId);
      this.loadNotes(subjectId);
      this.loadEvaluations(subjectId);
    }
  }

  loadSubject(id: number): void {
    this.subjectService.getSubjectById(id).subscribe({
      next: (res) => {
        this.subject = res.data;
      },
      error: () => alert('Error fetching subject')
    });
  }

  loadAssignments(id: number): void {
    this.assignmentService.getAssignmentsBySubject(id).subscribe({
      next: (res) => {
        this.assignments = res.data || [];
      },
      error: () => alert('Error fetching assignments')
    });
  }

  loadNotes(id: number): void {
    this.loadingNotes = true;
    this.noteError = '';
    this.noteService.getNotesBySubject(id).subscribe({
      next: (res) => {
        this.notes = res.data || [];
        this.loadingNotes = false;
      },
      error: () => {
        this.noteError = 'Error al cargar los apuntes de la asignatura';
        this.loadingNotes = false;
      }
    });
  }

  openAssignmentModal(): void {
    this.showAssignmentModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeAssignmentModal(): void {
    this.showAssignmentModal = false;
    this.selectedAssignment = null;
    document.body.style.overflow = '';
  }

  openClassModal(): void {
    this.showClassModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeClassModal(): void {
    this.showClassModal = false;
    this.selectedAssignment = null;
    document.body.style.overflow = '';
  }

  openNoteModal(note?: Note): void {
    this.selectedNote = note ?? null;
    this.showNoteModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeNoteModal(): void {
    this.showNoteModal = false;
    this.selectedNote = null;
    document.body.style.overflow = '';
  }

  onAssignmentSaved(): void {
    if (this.subject) {
      this.loadAssignments(this.subject.id);
    }
    this.closeAssignmentModal();
  }

  onClassSaved(): void {
    this.closeClassModal();
  }

  onNoteSaved(): void {
    if (this.subject) {
      this.loadNotes(this.subject.id);
    }
    this.closeNoteModal();
  }

  editNote(note: Note): void {
    this.openNoteModal(note);
  }

  deleteNote(note: Note): void {
    if (!this.subject) return;

    const confirmed = confirm(`¿Estás seguro de eliminar el apunte "${note.title}"?`);
    if (confirmed) {
      this.noteService.deleteNote(this.subject.id, note.id).subscribe({
        next: () => {
          if (this.subject) {
            this.loadNotes(this.subject.id);
          }
        },
        error: (err) => console.error(err)
      });
    }
  }

  loadEvaluations(id: number): void {
    this.loadingEvaluations = true;
    this.evaluationError = '';
    this.evaluationService.getEvaluationsBySubject(id).subscribe({
      next: (res) => {
        this.evaluations = res.data?.evaluations || [];
        this.gradeSummary =
          res.data?.summary ||
          this.evaluationService.calculateSummaryLocally(this.evaluations);
        this.loadingEvaluations = false;
        this.onSimulationChange();
      },
      error: () => {
        this.evaluationError =
          'Error al cargar las calificaciones de la asignatura';
        this.loadingEvaluations = false;
      },
    });
  }

  openEvaluationModal(evaluation?: Evaluation): void {
    this.selectedEvaluation = evaluation ?? null;
    this.showEvaluationModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeEvaluationModal(): void {
    this.showEvaluationModal = false;
    this.selectedEvaluation = null;
    document.body.style.overflow = '';
  }

  onEvaluationSaved(): void {
    if (this.subject) {
      this.loadEvaluations(this.subject.id);
    }
    this.closeEvaluationModal();
  }

  deleteEvaluation(evaluation: Evaluation): void {
    if (!this.subject) return;

    const confirmed = confirm(
      `¿Estás seguro de eliminar la evaluación "${evaluation.name}"?`,
    );
    if (confirmed) {
      this.evaluationService
        .deleteEvaluation(this.subject.id, evaluation.id)
        .subscribe({
          next: (res) => {
            if (res.data) {
              this.evaluations = res.data.evaluations;
              this.gradeSummary = res.data.summary;
            } else if (this.subject) {
              this.loadEvaluations(this.subject.id);
            }
            this.onSimulationChange();
          },
          error: (err) => console.error(err),
        });
    }
  }

  onSimulationChange(): void {
    if (!this.gradeSummary) return;
    this.simResult = this.evaluationService.simulateLocally(
      this.gradeSummary,
      this.hypotheticalScore,
      this.targetGoal ?? 3.0,
    );
  }

  onRightClickAssignment(event: MouseEvent, assignment: AssignmentResponseDto): void {
    event.preventDefault();

    this.selectedAssignment = assignment;
    this.contextMenuX = event.clientX;
    this.contextMenuY = event.clientY;
    this.contextMenuVisible = true;
  }

  closeContextMenu(): void {
    this.contextMenuVisible = false;
  }

  deleteAssignment(): void {
    if (!this.selectedAssignment) return;

    const confirmed = confirm('Delete Assignment?');

    if (confirmed) {
      this.assignmentService.deleteAssignment(this.selectedAssignment.id).subscribe({
        next: () => {
          if (this.subject) {
            this.loadAssignments(this.subject.id);
          }
          this.closeContextMenu();
        },
        error: (err) => console.error(err)
      });
    } else {
      this.closeContextMenu();
    }
  }

  editAssignment(): void {
    if (!this.selectedAssignment) return;

    this.showAssignmentModal = true;
    this.contextMenuVisible = false;

    document.body.style.overflow = 'hidden';
  }
}
