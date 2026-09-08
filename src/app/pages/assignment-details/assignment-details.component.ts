import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AssignmentResponseCompDto } from '../../models/assignment-response-comp.dto';
import { Subtask } from '../../models/subtask.model';
import { AssignmentService } from '../../services/assignment.service';
import { SubtaskService } from '../../services/subtask.service';

@Component({
  selector: 'app-assignment-details',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatCardModule, MatCheckboxModule, MatIconModule, MatProgressBarModule, MatProgressSpinnerModule],
  templateUrl: './assignment-details.component.html',
  styleUrl: './assignment-details.component.scss'
})
export class AssignmentDetailsComponent implements OnInit {
  assignment?: AssignmentResponseCompDto;
  subtasks: Subtask[] = [];
  progress = 0;
  newTitle = '';
  editingId?: number;
  editingTitle = '';
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private assignmentService: AssignmentService,
    private subtaskService: SubtaskService
  ) {}

  ngOnInit(): void {
    const assignmentId = Number(this.route.snapshot.paramMap.get('id'));
    if (!assignmentId) return this.goBack();
    this.assignmentService.getAllAssignments().subscribe({
      next: response => {
        this.assignment = response.data?.find(item => item.id === assignmentId);
        if (!this.assignment) return this.goBack();
        this.loadSubtasks();
      },
      error: () => this.goBack()
    });
  }

  addSubtask(): void {
    if (!this.assignment || !this.newTitle.trim()) return;
    this.subtaskService.create(this.assignment.id, this.newTitle).subscribe({
      next: response => { this.applyResponse(response.data); this.newTitle = ''; },
      error: () => this.error = 'No fue posible guardar la subtarea.'
    });
  }

  toggleSubtask(subtask: Subtask): void {
    if (!this.assignment) return;
    const previous = subtask.completed;
    subtask.completed = !previous; // Visual optimistic feedback required by RNF05.
    this.refreshProgress();
    this.subtaskService.update(this.assignment.id, subtask.id, { completed: subtask.completed }).subscribe({
      next: response => this.applyResponse(response.data),
      error: () => { subtask.completed = previous; this.refreshProgress(); this.error = 'No fue posible actualizar el progreso.'; }
    });
  }

  startEditing(subtask: Subtask): void { this.editingId = subtask.id; this.editingTitle = subtask.title; }

  saveEditing(subtask: Subtask): void {
    if (!this.assignment || !this.editingTitle.trim()) return;
    this.subtaskService.update(this.assignment.id, subtask.id, { title: this.editingTitle }).subscribe({
      next: response => { this.applyResponse(response.data); this.editingId = undefined; },
      error: () => this.error = 'No fue posible editar la subtarea.'
    });
  }

  deleteSubtask(subtask: Subtask): void {
    if (!this.assignment) return;
    this.subtaskService.remove(this.assignment.id, subtask.id).subscribe({
      next: response => this.applyResponse(response.data),
      error: () => this.error = 'No fue posible eliminar la subtarea.'
    });
  }

  move(subtask: Subtask, direction: -1 | 1): void {
    if (!this.assignment) return;
    const currentIndex = this.subtasks.findIndex(item => item.id === subtask.id);
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= this.subtasks.length) return;
    [this.subtasks[currentIndex], this.subtasks[targetIndex]] = [this.subtasks[targetIndex], this.subtasks[currentIndex]];
    this.subtaskService.reorder(this.assignment.id, this.subtasks.map(item => item.id)).subscribe({
      next: response => this.applyResponse(response.data),
      error: () => { this.loadSubtasks(); this.error = 'No fue posible cambiar el orden.'; }
    });
  }

  goBack(): void { this.router.navigate(['/assignments']); }

  private loadSubtasks(): void {
    if (!this.assignment) return;
    this.subtaskService.getAll(this.assignment.id).subscribe({
      next: response => { this.applyResponse(response.data); this.loading = false; },
      error: () => { this.error = 'No fue posible cargar las subtareas.'; this.loading = false; }
    });
  }

  private applyResponse(data?: { subtasks: Subtask[]; progress: number }): void {
    if (!data) return;
    this.subtasks = data.subtasks;
    this.progress = data.progress;
    this.error = '';
  }

  private refreshProgress(): void {
    this.progress = this.subtasks.length ? Math.round((this.subtasks.filter(item => item.completed).length / this.subtasks.length) * 100) : 0;
  }
}
