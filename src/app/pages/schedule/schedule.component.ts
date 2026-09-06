import { Component, OnInit } from '@angular/core';
import { SubjectService } from '../../services/subject.service';
import { ClassResponseDto } from '../../models/class-response.dto';
import { days, hours } from '../../common/data.common'
import { Router } from '@angular/router';
import { AddClassModalComponent } from "../../components/add-class-modal/add-class-modal.component";
import { CalendarService } from '../../services/calendar.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [AddClassModalComponent, MatButtonModule, MatIconModule],
  templateUrl: './schedule.component.html',
  styleUrl: './schedule.component.scss'
})
export class ScheduleComponent implements OnInit{
  subscriptionUrl = '';
  calendarMessage = '';

  constructor(private subjectService: SubjectService, private router: Router, private calendarService: CalendarService){}

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

  createCalendarSubscription(): void {
    this.calendarService.createSubscription().subscribe({
      next: response => {
        this.subscriptionUrl = response.data?.webcalUrl || '';
        this.calendarMessage = this.subscriptionUrl ? 'Your subscription link is ready.' : 'Unable to create the subscription link.';
      },
      error: () => this.calendarMessage = 'Unable to create the subscription link.'
    });
  }

  copySubscriptionUrl(): void {
    if (!this.subscriptionUrl) return;
    navigator.clipboard.writeText(this.subscriptionUrl).then(
      () => this.calendarMessage = 'Subscription link copied. Open it from your calendar app.',
      () => this.calendarMessage = 'Copy the subscription link manually.'
    );
  }

  downloadCalendar(): void {
    this.calendarService.download().subscribe({
      next: calendar => {
        const url = URL.createObjectURL(calendar);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'whats-due-tomorrow.ics';
        link.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.calendarMessage = 'Unable to download the calendar file.'
    });
  }

}
