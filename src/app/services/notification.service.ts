import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly defaultDuration = 4000;

  constructor(private snackBar: MatSnackBar) {}

  success(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: this.defaultDuration,
      panelClass: ['notification-success'],
    });
  }

  error(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: this.defaultDuration,
      panelClass: ['notification-error'],
    });
  }
}