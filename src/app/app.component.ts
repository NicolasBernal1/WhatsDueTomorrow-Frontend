import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { AuthService } from './services/auth.service';
import { UrgentAlertService } from './services/urgent-alert.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'WhatsDueTomorrow-Frontend';

  constructor(public authService: AuthService, private urgentAlertService: UrgentAlertService){}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) this.urgentAlertService.start();
  }

}
