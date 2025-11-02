import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { LoginDto } from '../../models/login.dto';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule],
  standalone: true,
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  registerForm: FormGroup;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router){
    this.registerForm = this.fb.group({
      name: ["", Validators.required],
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required]]
    })
  }

  onSubmit(): void {
    if(this.registerForm.valid){
      const loginData: LoginDto = {
        email: this.registerForm.value.email,
        password: this.registerForm.value.password
      }

      this.authService.register(this.registerForm.value).subscribe({
        next: () => {
          this.authService.login(loginData).subscribe({
            next: (res) => {
              if(!res.data) return;
              localStorage.setItem('token', res.data.token);
              this.registerForm.reset();
              this.router.navigate(['/schedule']);
            },
            error: () => alert('Invalid credentials')
          })
        },
        error: (err) => {
          if (err.status === 409) {
            alert('This email is already in use');
          } else if (err.status === 400) {
            alert('Invalid data');
          } else {
            alert('An unknown error ocurred');
          }
        }
      })
    }
  }
}
