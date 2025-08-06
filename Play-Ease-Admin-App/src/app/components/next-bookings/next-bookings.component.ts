import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-next-bookings',
  templateUrl: './next-bookings.component.html',
  styleUrls: ['./next-bookings.component.css']
})
export class NextBookingsComponent implements OnInit {
  courts = [
    {
      name: 'Kings Arena',
      location: 'DHA Phase 8',
      price: 'Rs. 2800',
      pitchSize: '6x6',
      image: 'assets/courts/court4.jpg'
    },
    {
      name: 'KickOff Ground',
      location: 'Gulshan Block 5',
      price: 'Rs. 2600',
      pitchSize: '7x7',
      image: 'assets/courts/court5.jpg'
    }
    // Add more courts if needed
  ];

  constructor() { }

  ngOnInit(): void { }
}
