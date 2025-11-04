import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { authGuard } from './guards/auth.guard';
import { RegisterComponent } from './pages/register/register.component';
import { ScheduleComponent } from './pages/schedule/schedule.component';
import { guestGuard } from './guards/guest.guard';
import { SubjectsComponent } from './pages/subjects/subjects.component';
import { SubjectDetailsComponent } from './pages/subject-details/subject-details.component';
import { AssignmentsComponent } from './pages/assignments/assignments.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },
  { path: 'schedule', component: ScheduleComponent, canActivate: [authGuard] },
  { path: 'subjects', component: SubjectsComponent, canActivate: [authGuard] },
  { path: 'assignments', component: AssignmentsComponent, canActivate: [authGuard] },
  { path: 'subjects/:id', component: SubjectDetailsComponent, canActivate: [authGuard] },
  { path: '', redirectTo: 'schedule', pathMatch: 'full' },
  { path: '**', redirectTo: 'schedule' }
];
