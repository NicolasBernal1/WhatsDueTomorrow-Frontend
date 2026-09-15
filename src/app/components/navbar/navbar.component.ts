import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { AssignmentService } from '../../services/assignment.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatBadgeModule } from '@angular/material/badge';
import { UserDto } from '../../models/user.dto';
import { ChangePasswordDto } from '../../models/change-password.dto';
import { AssignmentResponseCompDto } from '../../models/assignment-response-comp.dto';
import { MatLabel } from "@angular/material/form-field";
import { FormsModule } from '@angular/forms';
import { UrgentAlertService } from '../../services/urgent-alert.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatMenuModule, MatIconModule, MatLabel, FormsModule, MatInputModule, MatBadgeModule, DatePipe],
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {
  dropDownOpened = false;

  user?: UserDto;

  editingProfile = false;
  editName = '';
  editEmail = '';
  savingProfile = false;

  password = '';
  newPassword = '';

  passwordVerified = false;
  passwordError = false;
  changingPassword = false;

  upcomingAssignments: AssignmentResponseCompDto[] = [];

  pendingDeleteConfirmation = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService,
    private assignmentService: AssignmentService,
    private urgentAlertService: UrgentAlertService,
  ) { }

  ngOnInit(): void {
    this.urgentAlertService.start();
    this.loadUpcomingAssignments();
  }

  loadUpcomingAssignments(): void {
    this.assignmentService.getUpcomingAssignments().subscribe({
      next: (res) => {
        this.upcomingAssignments = res.data ?? [];
      },
      error: (err: unknown) => this.logError('loadUpcomingAssignments', err),
    });
  }

  toggleDropdown() {
    this.dropDownOpened = !this.dropDownOpened;
  }

  loadProfile() {
    this.editingProfile = false;
    this.pendingDeleteConfirmation = false;

    this.authService.getProfile().subscribe({
      next: (res) => {
        this.user = res.data;
        this.editName = res.data?.name ?? '';
        this.editEmail = res.data?.email ?? '';
      },
      error: (err: unknown) => {
        this.logError('loadProfile', err);
        this.notificationService.error('Could not load your profile');
      }
    });
  }

  startEditingProfile() {
    this.editingProfile = true;
    this.editName = this.user?.name ?? '';
    this.editEmail = this.user?.email ?? '';
  }

  cancelEditingProfile() {
    this.editingProfile = false;
  }

  saveProfile() {
    if (!this.editName || !this.editEmail) return;

    this.savingProfile = true;

    this.authService.updateProfile({ name: this.editName, email: this.editEmail }).subscribe({
      next: (res) => {
        this.user = res.data;
        this.editingProfile = false;
        this.savingProfile = false;
        this.notificationService.success('Profile updated successfully.');
      },
      error: (err: HttpErrorResponse) => {
        this.savingProfile = false;
        if (err.status === 409) {
          this.notificationService.error('That email is already in use');
        } else {
          this.notificationService.error('Could not update your profile');
        }
      }
    });
  }

  verifyPassword() {
    if (!this.password) return;

    this.passwordError = false;

    this.authService.verifyPassword(this.password).subscribe({
      next: () => {
        this.passwordVerified = true;
        this.passwordError = false;
      },
      error: () => {
        this.passwordVerified = false;
        this.passwordError = true;
      }
    });
  }

  changePassword() {
    if (!this.passwordVerified || !this.newPassword) return;

    this.changingPassword = true;

    const dto: ChangePasswordDto = {
      currentPassword: this.password,
      newPassword: this.newPassword
    };

    this.authService.changePassword(dto).subscribe({
      next: () => {
        this.notificationService.success('Password changed successfully.');
        this.logout();
      },
      error: (err: unknown) => {
        this.logError('changePassword', err);
        this.changingPassword = false;
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  requestDeleteAccount() {
    this.pendingDeleteConfirmation = true;
  }

  cancelDeleteAccount() {
    this.pendingDeleteConfirmation = false;
  }

  confirmDelete() {
    this.pendingDeleteConfirmation = false;

    this.authService.deleteAccount().subscribe({
      next: () => this.logout(),
      error: (err: unknown) => this.logError('confirmDelete', err)
    });
  }

  resetPasswordState() {
    this.password = '';
    this.newPassword = '';
    this.passwordVerified = false;
    this.passwordError = false;
    this.changingPassword = false;
  }

  // Antes: console.error(err) estaba repetido de forma idéntica en 4 métodos
  // distintos (typescript:S4144 — funciones/bloques duplicados). Centralizarlo
  // aquí también deja un único punto donde conectar un servicio de logging
  // real (Sentry, LogRocket, etc.) el día que se necesite, sin tocar cada
  // método uno por uno.
  private logError(context: string, err: unknown): void {
    console.error(`[NavbarComponent] ${context}:`, err);
  }
}