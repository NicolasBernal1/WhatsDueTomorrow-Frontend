import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubjectResponseDto } from '../../models/subject-response.dto';
import { SubjectService } from '../../services/subject.service';
import { Router } from '@angular/router';
import { AddSubjectModalComponent } from '../../components/add-subject-modal/add-subject-modal.component';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { AcademicLoadSummaryDto } from '../../models/academic-load-summary.dto';

@Component({
  selector: 'app-subjects',
  imports: [CommonModule, AddSubjectModalComponent, MatButtonModule, MatCardModule, MatIconModule, FormsModule],
  standalone: true,
  templateUrl: './subjects.component.html',
  styleUrl: './subjects.component.scss'
})
export class SubjectsComponent implements OnInit {
  subjects: SubjectResponseDto[] = [];
  loading = true;
  showAddModal = false;
  showEditModal = false;
  selectedSubject: SubjectResponseDto | null = null;
  contextMenuVisible = false;
  contextMenuX = 0;
  contextMenuY = 0;

  // F26 - F29: Gestión de créditos académicos y semáforo de carga semanal
  academicLoad: AcademicLoadSummaryDto | null = null;
  loadingLoad = false;

  constructor(private subjectService: SubjectService, private router: Router) { }

  ngOnInit(): void {
    this.loadSubjects();
    this.loadAcademicLoad();
  }

  loadAcademicLoad(): void {
    this.loadingLoad = true;
    this.subjectService.getAcademicLoadSummary().subscribe({
      next: (res) => {
        this.academicLoad = res.data ?? null;
        this.loadingLoad = false;
      },
      error: (err) => {
        console.error('Error loading academic load summary', err);
        this.loadingLoad = false;
      }
    });
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

  saveSubject() {
    this.closeAddSubjectModal();
    this.loadSubjects();
    this.loadAcademicLoad();
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
    this.loadAcademicLoad();
  }

  deleteSubject(): void {
    if (!this.selectedSubject) return;

    const confirmed = confirm('Delete subject?');

    if (confirmed) {
      this.subjectService.deleteSubject(this.selectedSubject.id).subscribe({
        next: () => {
          this.loadSubjects();
          this.loadAcademicLoad();
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

  getLoadStatusIcon(status?: string): string {
    switch (status) {
      case 'baja': return 'trending_down';
      case 'balanceada': return 'check_circle';
      case 'sobrecarga': return 'warning';
      default: return 'help_outline';
    }
  }

  getLoadStatusText(status?: string): string {
    switch (status) {
      case 'baja': return 'Carga baja';
      case 'balanceada': return 'Carga balanceada';
      case 'sobrecarga': return 'Sobrecarga';
      default: return 'Carga no calculada';
    }
  }

  getLoadStatusDescription(status?: string): string {
    switch (status) {
      case 'baja':
        return 'Tu carga académica es ligera (< 12 créditos). Tienes margen para inscribir más materias o actividades.';
      case 'balanceada':
        return 'Tu carga académica está en un rango equilibrado y recomendado (12 a 18 créditos).';
      case 'sobrecarga':
        return 'Carga académica alta (> 18 créditos). Requerirá una dedicación horaria exigente durante el semestre.';
      default:
        return '';
    }
  }
  //Agrego nueva funcionalidad en el front de buscar/filtrar asignaturas
  searchQuery = '';

  onSearch(): void {
    const term = this.searchQuery.trim();

    if (!term) {
      this.loadSubjects();
      return;
    }

    this.subjectService.searchSubjects(term).subscribe({
      next: (res) => {
        this.subjects = res.data || [];
      },
      error: () => {
        alert('Error searching subjects');
      }
    });
  }
}
