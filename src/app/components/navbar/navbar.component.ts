import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
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
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      alert('Account deleted');//agregar el borrar la cuenta
      this.logout();
    }
  }
}
