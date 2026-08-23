import { Component, OnInit } from '@angular/core';
import { SubjectService } from '../../services/subject.service';
import { ClassResponseDto } from '../../models/class-response.dto';
import { days, hours } from '../../common/data.common'
import { Router } from '@angular/router';
import { AddClassModalComponent } from "../../components/add-class-modal/add-class-modal.component";

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [AddClassModalComponent],
  templateUrl: './schedule.component.html',
  styleUrl: './schedule.component.scss'
})
export class ScheduleComponent implements OnInit{
  constructor(private subjectService: SubjectService, private router: Router){}

  hours: string[] = hours;
  days: string[] = days;
  classes: ClassResponseDto[] = [];
  contextMenuVisible: boolean = false;
  showEditModal: boolean = false;
  contextMenuX: number = 0;
  contextMenuY: number = 0;
  selectedClass: ClassResponseDto | null = null;

  ngOnInit(): void {
    this.subjectService.getClass().subscribe({
      next: (res) => {
        this.classes = res.data || [];
      },
      error: () => alert('Error getting classes')
    })
  }

  getClassesFor(day: string, hour: string) {
    const hourToMinutes = (h: string) => {
      const [hh, mm] = h.split(':').map(Number);
      return hh * 60 + mm;
    };

    const current = hourToMinutes(hour);

    return this.classes.find(c =>
      c.dayOfWeek.toLowerCase() === day &&
      hourToMinutes(c.startTime) <= current &&
      current < hourToMinutes(c.endTime)
    );
  }

  onClickClass(id: number) {
    this.router.navigate([`/subjects/${id}`]);
  }

  onRightClickClass(event: MouseEvent, subjectClass: ClassResponseDto) {
    event.preventDefault();

    this.selectedClass = subjectClass;
    this.contextMenuX = event.clientX;
    this.contextMenuY = event.clientY;
    this.contextMenuVisible = true;
  }

  deleteClass() {
    if (!this.selectedClass) return;

    const confirmed = confirm('Delete Class?');

    if (confirmed) {
      this.subjectService.deleteClass(this.selectedClass.id).subscribe({
        next: () => {
          this.classes = this.classes.filter(
            c => c.id !== this.selectedClass!.id
          );
          this.closeContextMenu();
        },
        error: (err) => console.error(err)
      });
    }
    this.closeContextMenu();
  }

  closeContextMenu() {
    this.contextMenuVisible = false;
    this.selectedClass = null;
  }

  editClass() {
    if (!this.selectedClass) return;

    this.showEditModal = true;
    this.contextMenuVisible = false;

    document.body.style.overflow = 'hidden';
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedClass = null;

    document.body.style.overflow = '';
  }

  onClassSaved(): void {
  this.closeEditModal();

  this.subjectService.getClass().subscribe({
    next: (res) => {
      this.classes = res.data || [];
    },
    error: () => alert('Error getting classes')
    });
  }

}
