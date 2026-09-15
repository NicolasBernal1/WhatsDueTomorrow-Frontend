import { Injectable } from '@angular/core';
import { AssignmentService } from './assignment.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root',
})
export class UrgentAlertService {
  constructor(
    private assignmentService: AssignmentService,
    private notificationService: NotificationService,
  ) {}

  start(): void {
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
}