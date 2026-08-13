import { Component, OnInit } from '@angular/core';
import { SubjectResponseDto } from '../../models/subject-response.dto';
import { SubjectService } from '../../services/subject.service';
import { Router } from '@angular/router';
import { AddSubjectModalComponent } from '../../components/add-subject-modal/add-subject-modal.component';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-subjects',
  imports: [AddSubjectModalComponent, MatButtonModule, MatCardModule],
  standalone: true,
  templateUrl: './subjects.component.html',
  styleUrl: './subjects.component.scss'
})
export class SubjectsComponent implements OnInit{
  subjects: SubjectResponseDto[] = [];
  loading = true;
  showAddModal = false;
  showEditModal = false;
  selectedSubject: SubjectResponseDto | null = null;
  contextMenuVisible = false;
  contextMenuX = 0;
  contextMenuY = 0;
  
  constructor(private subjectService: SubjectService, private router: Router){}

  ngOnInit(): void {
      this.loadSubjects();
  }

  loadSubjects(): void {
    this.subjectService.getSubjects().subscribe({
      next: (res) => {
        this.subjects = res.data || [];
        this.loading = false;
      },
      error: () => {
        alert('Error getting subjects');
        this.loading = false;
      }
    })
  }

  goToSubjectDetais(id: number): void {
    this.router.navigate(['/subjects', id]);
  }

  addSubjectModal() {
    this.showAddModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeAddSubjectModal() {
    this.showAddModal = false;
    document.body.style.overflow = '';
  }

  saveSubject(){
    this.closeAddSubjectModal();
    this.loadSubjects();
  }

  onRightClickSubject(event: MouseEvent, subject: SubjectResponseDto): void {
    event.preventDefault();

    this.selectedSubject = subject;
    this.contextMenuX = event.clientX;
    this.contextMenuY = event.clientY;
    this.contextMenuVisible = true;
  }

  editSubject(): void {
    if (!this.selectedSubject) return;

    this.showEditModal = true;
    this.contextMenuVisible = false;

    document.body.style.overflow = 'hidden';
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedSubject = null;
    document.body.style.overflow = '';
  }

  onSubjectSaved(): void {
    this.closeEditModal();
    this.loadSubjects();
  }

  deleteSubject(): void {
    if (!this.selectedSubject) return;

    const confirmed = confirm('Delete subject?');

    if (confirmed) {
      this.subjectService.deleteSubject(this.selectedSubject.id).subscribe({
        next: () => {
          this.loadSubjects();
          this.closeContextMenu();
        },
        error: (err) => console.error(err)
      });
    } else {
      this.closeContextMenu();
    }
  }

  closeContextMenu(): void {
    this.contextMenuVisible = false;
    this.selectedSubject = null;
  }
}
