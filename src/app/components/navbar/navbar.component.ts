import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatMenuModule, MatIconModule],
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  dropDownOpened = false;

  constructor(private router: Router, private authService: AuthService){}

  toggleDropdown(){
    this.dropDownOpened = !this.dropDownOpened;
  }

  logout(){
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  confirmDelete() {
    const confirmed = confirm('Are you sure you want to delete your account? This action cannot be undone.');
    if (confirmed) {
      this.authService.deleteAccount().subscribe({
        next: () =>  this.logout(),
        error: (err) => console.error(err)
      })
    }
  }
}
