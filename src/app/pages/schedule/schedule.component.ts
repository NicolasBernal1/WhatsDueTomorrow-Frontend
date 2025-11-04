import { Component, OnInit } from '@angular/core';
import { SubjectService } from '../../services/subject.service';
import { ClassResponseDto } from '../../models/class-response.dto';
import { days, hours } from '../../common/data.common'
import { Router } from '@angular/router';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [],
  templateUrl: './schedule.component.html',
  styleUrl: './schedule.component.scss'
})
export class ScheduleComponent implements OnInit{
  constructor(private subjectService: SubjectService, private router: Router){}

  hours: string[] = hours;
  days: string[] = days;
  classes: ClassResponseDto[] = [];

  ngOnInit(): void {
    this.subjectService.getClass().subscribe({
      next: (res) => {
        this.classes = res.data || [];
      },
      error: () => alert('Error getting classes')
    })
  }

  getClassesFor(day: string, hour: string) {
    const hourToMinutes = (h: string) => {
      const [hh, mm] = h.split(':').map(Number);
      return hh * 60 + mm;
    };

    const current = hourToMinutes(hour);

    return this.classes.find(c =>
      c.dayOfWeek.toLowerCase() === day &&
      hourToMinutes(c.startTime) <= current &&
      current < hourToMinutes(c.endTime)
    );
  }

  onClickClass(id: number) {
    this.router.navigate([`/subjects/${id}`]);
  }

  onRightClickClass(event: MouseEvent, subjectClass: ClassResponseDto){
    event.preventDefault();
    const confirmed = confirm('Delete Class?');

    if(confirmed){
      this.subjectService.deleteClass(subjectClass.id).subscribe({
        next: () => {
          this.classes = this.classes.filter(c => c.id !== subjectClass.id);
        },
        error: (err) => console.error(err)
      })
    }
  }

}
