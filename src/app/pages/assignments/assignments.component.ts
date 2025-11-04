import { Component, OnInit } from '@angular/core';
import { AssignmentService } from '../../services/assignment.service';
import { DatePipe } from '@angular/common';
import { AssignmentResponseCompDto } from '../../models/assignment-response-comp.dto';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-assignments',
  imports: [DatePipe, MatCardModule, MatProgressSpinnerModule],
  standalone: true,
  templateUrl: './assignments.component.html',
  styleUrl: './assignments.component.scss'
})
export class AssignmentsComponent implements OnInit{
  assignments: AssignmentResponseCompDto[] = [];
  loading = true;

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

  onRightClickAssignment(event: MouseEvent, assignment: AssignmentResponseCompDto){
    event.preventDefault();
    const confirmed = confirm('Delete Assignment?');
    if(confirmed){
      this.assignmentService.deleteAssignment(assignment.id).subscribe({
        next: () => this.loadAssignments(),
        error: (err) => console.error(err)
      })
    } 
  }
}
