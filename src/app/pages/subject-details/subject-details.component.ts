import { Component, OnInit } from '@angular/core';
import { SubjectService } from '../../services/subject.service';
import { ActivatedRoute } from '@angular/router';
import { SubjectResponseDto } from '../../models/subject-response.dto';
import { AssignmentResponseDto } from '../../models/assignment-response.dto';
import { AssignmentService } from '../../services/assignment.service';
import { DatePipe } from '@angular/common';
import { AddAssignmentModalComponent } from '../../components/add-assignment-modal/add-assignment-modal.component';
import { AddClassModalComponent } from '../../components/add-class-modal/add-class-modal.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-subject-details',
  imports: [DatePipe, AddAssignmentModalComponent, AddClassModalComponent, MatCardModule, MatButtonModule],
  standalone: true,
  templateUrl: './subject-details.component.html',
  styleUrl: './subject-details.component.scss'
})
export class SubjectDetailsComponent implements OnInit{
  subject?: SubjectResponseDto;
  assignments: AssignmentResponseDto[] = [];
  

  showAssignmentModal = false;
  showClassModal = false;

  constructor(private route: ActivatedRoute, private subjectService: SubjectService, private assignmentService: AssignmentService){}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if(id){
      this.loadSubject(Number(id));
      this.loadAssignments(Number(id));
    }
  }

  loadSubject(id: number){
    this.subjectService.getSubjectById(id).subscribe({
      next: (res) => {
        this.subject = res.data;
      },
      error: () => alert('Error fetching subject')
    })
  }

  loadAssignments(id: number){
    this.assignmentService.getAssignmentsBySubject(id).subscribe({
      next: (res) => {
        this.assignments = res.data || [];
      },
      error: () => alert('Error fetching assignments')
    })
  }

  openAssignmentModal(): void {
    this.showAssignmentModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeAssignmentModal(): void {
    this.showAssignmentModal = false;
    document.body.style.overflow = ''
  }

  openClassModal(): void {
    this.showClassModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeClassModal(): void {
    this.showClassModal = false;
    document.body.style.overflow = ''
  }

  onAssignmentSaved(): void {
    if(this.subject){
      this.loadAssignments(this.subject.id);
    }
    this.closeAssignmentModal();
  }

  onClassSaved(): void {
    this.closeClassModal();
  }
  onRightClickAssignment(event: MouseEvent, assignment: AssignmentResponseDto){
    event.preventDefault();
    const confirmed = confirm('Delete Assignment?');
    if(confirmed){
      this.assignmentService.deleteAssignment(assignment.id).subscribe({
        next: () => this.loadAssignments(assignment.subjectId),
        error: (err) => console.error(err)
      })
    } 
  }
}