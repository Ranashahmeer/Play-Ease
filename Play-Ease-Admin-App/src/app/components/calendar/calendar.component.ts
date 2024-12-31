
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import bootstrapPlugin from '@fullcalendar/bootstrap';
import { FullCalendarModule } from '@fullcalendar/angular';
@Component({
  selector: 'app-calendar',
  imports: [FullCalendarModule,CommonModule],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css'
})
export class CalendarComponent {
  months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  
  selectMonth(month: string) {
    alert('Selected Month: ' + month);
  }
  
  calendarPlugins = [dayGridPlugin, interactionPlugin, bootstrapPlugin];
  events = [
    { title: 'Booked Slot', date: '2024-12-25', color: 'red' },
    { title: 'Available Slot', date: '2024-12-26', color: 'green' },
  ];

  handleDateClick(event: any) {
    alert('Date selected: ' + event.dateStr);
  }
}
