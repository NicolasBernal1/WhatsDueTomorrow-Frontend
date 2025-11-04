import { Component, OnInit } from '@angular/core';
import { AssignmentService } from '../../services/assignment.service';
import { DatePipe } from '@angular/common';
import { AssignmentResponseCompDto } from '../../models/assignment-response-comp.dto';

@Component({
  selector: 'app-assignments',
  imports: [DatePipe],
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
}
