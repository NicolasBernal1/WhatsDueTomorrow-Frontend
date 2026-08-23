import { Component, OnInit } from '@angular/core';
import { AssignmentService } from '../../services/assignment.service';
import { DatePipe } from '@angular/common';
import { AssignmentResponseCompDto } from '../../models/assignment-response-comp.dto';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AddAssignmentModalComponent } from '../../components/add-assignment-modal/add-assignment-modal.component';

@Component({
  selector: 'app-assignments',
  imports: [DatePipe, MatCardModule, MatProgressSpinnerModule, AddAssignmentModalComponent],
  standalone: true,
  templateUrl: './assignments.component.html',
  styleUrl: './assignments.component.scss'
})
export class AssignmentsComponent implements OnInit{
  assignments: AssignmentResponseCompDto[] = [];
  loading = true;
  showEditModal = false;
  selectedAssignment: AssignmentResponseCompDto | null = null;
  contextMenuVisible = false;
  contextMenuX = 0;
  contextMenuY = 0;

  constructor(private assignmentService: AssignmentService){}

  ngOnInit(): void {
      this.loadAssignments();
  }

  loadAssignments(): void {
    this.assignmentService.getAllAssignments().subscribe({
      next: (res) => {
        this.assignments = res.data || [];
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    })
  }

  onRightClickAssignment(event: MouseEvent, assignment: AssignmentResponseCompDto): void {
    event.preventDefault();

    this.selectedAssignment = {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate,
      subjectId: assignment.subjectId,
      subjectName: assignment.subjectName
    };

    this.contextMenuX = event.clientX;
    this.contextMenuY = event.clientY;
    this.contextMenuVisible = true;
  }

  editAssignment(): void {
    if (!this.selectedAssignment) return;

    this.showEditModal = true;
    this.closeContextMenu();
  }
  
  closeContextMenu(): void {
    this.contextMenuVisible = false;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedAssignment = null;
  }

  saveAssignment(): void {
    this.closeEditModal();
    this.loadAssignments();
  }
  
  deleteAssignment(): void {
    if (!this.selectedAssignment) return;

    const confirmed = confirm('Delete Assignment?');

    if (confirmed) {
      this.assignmentService.deleteAssignment(this.selectedAssignment.id).subscribe({
        next: () => {
          this.loadAssignments();
          this.closeContextMenu();
        },
        error: (err) => console.error(err)
      });
    } else {
      this.closeContextMenu();
    }
  }
}
