import { Injectable } from '@angular/core';
import { Subscription, timer } from 'rxjs';
import { AssignmentService } from './assignment.service';
import { NotificationService } from './notification.service';
import { AssignmentResponseCompDto } from '../models/assignment-response-comp.dto';

@Injectable({ providedIn: 'root' })
export class UrgentAlertService {
  private monitoring?: Subscription;

  constructor(
    private assignmentService: AssignmentService,
    private notificationService: NotificationService,
  ) {}

  start(): void {
    if (this.monitoring) return;

    // Aviso in-app inmediato (snackbar): cuántas tareas urgentes hay ahora mismo.
    this.checkUrgentAssignments();

    if (!('Notification' in window)) return;

    // A minute cadence is enough for configured reminders and avoids busy polling.
    this.monitoring = timer(0, 60_000).subscribe(() => {
      this.assignmentService.getAllAssignments().subscribe({
        next: (response) => this.notifyDueAssignments(response.data || []),
        error: () => undefined
      });
    });
  }

  private checkUrgentAssignments(): void {
    this.assignmentService.getUrgentAssignments().subscribe({
      next: (res) => {
        const urgentCount = res.data?.length ?? 0;
        if (urgentCount > 0) {
          this.notificationService.error(`You have ${urgentCount} urgent assignment(s)!`);
        }
      },
      error: (err) => console.error(err),
    });
  }

  async requestPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.requestPermission();
  }

  private notifyDueAssignments(assignments: AssignmentResponseCompDto[]): void {
    if (Notification.permission !== 'granted') return;

    const now = Date.now();
    assignments.forEach((assignment) => {
      if (assignment.reminderMinutes === undefined || assignment.reminderMinutes === null) return;

      const dueAt = new Date(assignment.dueDate).getTime();
      const reminderAt = dueAt - assignment.reminderMinutes * 60_000;
      const notificationKey = `urgent-alert-${assignment.id}-${dueAt}`;

      if (now >= reminderAt && now < dueAt && !localStorage.getItem(notificationKey)) {
        new Notification('Entrega próxima', {
          body: `${assignment.title} vence pronto (${assignment.subjectName}).`
        });
        localStorage.setItem(notificationKey, 'sent');
      }
    });
  }
}