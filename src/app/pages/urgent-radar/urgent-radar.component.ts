import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription, timer } from 'rxjs';
import { AssignmentResponseCompDto } from '../../models/assignment-response-comp.dto';
import { AssignmentService } from '../../services/assignment.service';
import { UrgentAlertService } from '../../services/urgent-alert.service';

interface UrgentAssignment extends AssignmentResponseCompDto {
  countdown: string;
}

@Component({
  selector: 'app-urgent-radar',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './urgent-radar.component.html',
  styleUrl: './urgent-radar.component.scss'
})
export class UrgentRadarComponent implements OnInit, OnDestroy {
  assignments: AssignmentResponseCompDto[] = [];
  urgentAssignments: UrgentAssignment[] = [];
  loading = true;
  notificationMessage = '';
  private refreshSubscription?: Subscription;
  private countdownSubscription?: Subscription;

  constructor(
    private assignmentService: AssignmentService,
    private urgentAlertService: UrgentAlertService
  ) {}

  ngOnInit(): void {
    this.urgentAlertService.start();
    this.refreshSubscription = timer(0, 60_000).subscribe(() => this.loadUrgentAssignments());
    // The visual countdown updates independently without network requests.
    this.countdownSubscription = timer(0, 1_000).subscribe(() => this.updateCountdowns());
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
    this.countdownSubscription?.unsubscribe();
  }

  async enableNotifications(): Promise<void> {
    const permission = await this.urgentAlertService.requestPermission();
    this.notificationMessage = permission === 'granted'
      ? 'Las alertas web están activadas.'
      : permission === 'unsupported'
        ? 'Este navegador no admite alertas web.'
        : 'No se concedió permiso para mostrar alertas.';
  }

  private loadUrgentAssignments(): void {
    this.assignmentService.getUrgentAssignments().subscribe({
      next: (response) => {
        this.assignments = response.data || [];
        this.updateCountdowns();
        this.loading = false;
      },
      error: () => {
        this.assignments = [];
        this.urgentAssignments = [];
        this.loading = false;
      }
    });
  }

  private updateCountdowns(): void {
    this.urgentAssignments = this.assignments
      .map((assignment) => ({ ...assignment, countdown: this.getCountdown(assignment.dueDate) }))
      .filter((assignment) => assignment.countdown !== 'Vencida');
  }

  private getCountdown(dueDate: string): string {
    const remaining = new Date(dueDate).getTime() - Date.now();
    if (remaining <= 0) return 'Vencida';
    const totalMinutes = Math.floor(remaining / 60_000);
    return `${Math.floor(totalMinutes / 60)} h ${totalMinutes % 60} min`;
  }
}
