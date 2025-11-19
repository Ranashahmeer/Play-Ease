
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import bootstrapPlugin from '@fullcalendar/bootstrap';
@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    CommonModule
    // Add any other modules or components used in navbar.component.html
  ],
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
    // Month selected
  }
  
  calendarPlugins = [dayGridPlugin, interactionPlugin, bootstrapPlugin];
  events = [
    { title: 'Booked Slot', date: '2024-12-25', color: 'red' },
    { title: 'Available Slot', date: '2024-12-26', color: 'green' },
  ];

  handleDateClick(event: any) {
    // Date selected
  }
}
