import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { UserDto } from '../../models/user.dto';
import { ChangePasswordDto } from '../../models/change-password.dto';
import { MatLabel } from "@angular/material/form-field";
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatMenuModule, MatIconModule, MatLabel, FormsModule, MatInputModule],
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  dropDownOpened = false;

  user?: UserDto;

  password = '';
  newPassword = '';

  passwordVerified = false;
  passwordError = false;
  changingPassword = false;

  constructor(private router: Router, private authService: AuthService) { }

  toggleDropdown() {
    this.dropDownOpened = !this.dropDownOpened;
  }

  loadProfile() {
    this.authService.getProfile().subscribe({
      next: (res) => {
        this.user = res.data;
      },
      error: (err) => console.error(err)
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
        alert('Password changed successfully.');
        this.logout();
      },
      error: (err) => {
        console.error(err);
        this.changingPassword = false;
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  confirmDelete() {
    const confirmed = confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );

    if (confirmed) {
      this.authService.deleteAccount().subscribe({
        next: () => this.logout(),
        error: (err) => console.error(err)
      });
    }
  }

  resetPasswordState() {
    this.password = '';
    this.newPassword = '';
    this.passwordVerified = false;
    this.passwordError = false;
    this.changingPassword = false;
  }
}